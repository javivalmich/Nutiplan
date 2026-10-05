// generarCasos — generador de los casos de la primera Fase 7 (D-087).
//
// Ejecuta ambos motores para cada caso (perfil × semilla), verifica cada caso
// y, solo con --confirmo-generacion, escribe los planes crudos y un manifiesto
// en un directorio FUERA del repositorio. No ciega, no genera vista de
// evaluador ni clave y no ejecuta la evaluación.
//
// La existencia de este script no autoriza la generación: ejecutarlo con las
// semillas de evaluación requiere autorización expresa del titular.
//
// Uso:
//   node scripts/fase7/generarCasos.mjs --registro <registro-semillas.json> --salida <dir fuera del repo> --confirmo-generacion
//
// Verificaciones por caso (si falla una, se aborta sin escribir nada):
//   1. estrategia declarada por ambos planes = mantenimiento_equilibrado
//   2. premisa de D-087 punto 3: el día libre de ambos motores es el día 6
//   3. determinismo: dos ejecuciones -> vista adaptada idéntica
//   4. contrato del cegado: las vistas de ambos motores lo cumplen (en memoria)
// Antes de ejecutar nada: semillas comprobadas contra el registro declarado y
// árbol de trabajo limpio.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildPlan } from '../../src/engine/buildPlan.js';
import { mulberry32 } from '../../src/engine/rng.js';
import { materializePlan } from '../../src/engine2/materializePlan.js';
import { loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';
import { toEvalView as legacyView } from '../../src/engine/evalView.js';
import { toEvalView as engine2View } from '../../src/engine2/evalView.js';
import { blind } from '../../src/eval/blind/blind.js';
import {
  GENERADOR_VERSION, ESTRATEGIA, SEMILLAS_EVALUACION, PERFILES, PERFIL_BASE_LEGACY,
  TARGET_KCAL_LEGACY, OPCIONES_LEGACY, TRADUCCION_PERFIL_BASE, CasoError,
  entradaLegacy, entradaEngine2, verificarEstrategia, verificarDiaLibreLegacy,
  verificarDiaLibreEngine2, verificarDeterminismo, verificarSemillas, idPlan, listaCasos,
} from './casos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

export function ejecutarLegacy(entrada) {
  return buildPlan(
    JSON.parse(JSON.stringify(entrada.profile)),
    entrada.targetKcal,
    { ...JSON.parse(JSON.stringify(entrada.opts)), saveMealMemory: () => {}, rng: mulberry32(entrada.semilla) },
  );
}

export function ejecutarEngine2(entrada, catalog) {
  return materializePlan({ ...JSON.parse(JSON.stringify(entrada)), catalog });
}

// Genera y verifica un caso completo en memoria. No escribe nada.
export function generarCaso(perfilId, semilla, catalog = loadCatalog()) {
  const eL = entradaLegacy(perfilId, semilla);
  const eE = entradaEngine2(perfilId, semilla);

  const legacy1 = ejecutarLegacy(eL);
  const legacy2 = ejecutarLegacy(eL);
  const engine21 = ejecutarEngine2(eE, catalog);
  const engine22 = ejecutarEngine2(eE, catalog);

  verificarEstrategia(legacy1, 'legacy');
  verificarEstrategia(engine21, 'engine2');
  verificarDiaLibreLegacy(legacy1);
  verificarDiaLibreEngine2(engine21);

  const vistaL = legacyView(legacy1);
  const vistaE = engine2View(engine21);
  verificarDeterminismo(vistaL, legacyView(legacy2), 'legacy');
  verificarDeterminismo(vistaE, engine2View(engine22), 'engine2');

  // Contrato del cegado: se valida en memoria; el resultado se descarta.
  blind([{ id: 'a', view: vistaL }, { id: 'b', view: vistaE }], 0);

  return {
    perfilId, semilla,
    entradas: { legacy: eL, engine2: eE },
    planes: { legacy: legacy1, engine2: engine21 },
    vistas: { legacy: vistaL, engine2: vistaE },
  };
}

const sha256 = (texto) => crypto.createHash('sha256').update(texto, 'utf8').digest('hex');
const serializar = (v) => `${JSON.stringify(v, null, 2)}\n`;

function fail(msg) {
  console.error(`generarCasos: ${msg}`);
  process.exit(1);
}

function arg(nombre) {
  const i = process.argv.indexOf(nombre);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main() {
  if (!process.argv.includes('--confirmo-generacion')) {
    fail('falta --confirmo-generacion. Este script produce material experimental; no se ejecuta por defecto.');
  }
  const registroPath = arg('--registro');
  const salida = arg('--salida');
  if (!registroPath || !salida) fail('uso: --registro <registro-semillas.json> --salida <dir fuera del repo> --confirmo-generacion');

  const salidaAbs = path.resolve(salida);
  const rel = path.relative(ROOT, salidaAbs);
  if (!rel.startsWith('..') && !path.isAbsolute(rel)) fail(`la salida debe estar fuera del repositorio: ${salidaAbs}`);
  if (fs.existsSync(salidaAbs) && fs.readdirSync(salidaAbs).length > 0) fail(`la salida ya existe y no está vacía: ${salidaAbs}`);

  const registroTexto = fs.readFileSync(registroPath, 'utf8');
  const registro = JSON.parse(registroTexto);
  try {
    verificarSemillas([...SEMILLAS_EVALUACION], registro);
  } catch (e) {
    fail(e.message);
  }

  const head = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  const sucio = execSync('git status --porcelain', { cwd: ROOT }).toString().trim();
  if (sucio.length > 0) fail('el árbol de trabajo no está limpio; el material debe salir de un commit exacto');

  // Todo en memoria primero; si un caso falla, no se escribe nada.
  const catalog = loadCatalog();
  const generados = [];
  for (const { perfilId, semilla } of listaCasos()) {
    try {
      generados.push(generarCaso(perfilId, semilla, catalog));
    } catch (e) {
      fail(`caso ${perfilId}-${semilla}: ${e instanceof CasoError ? e.message : e.stack}`);
    }
  }

  fs.mkdirSync(path.join(salidaAbs, 'planes'), { recursive: true });
  const casos = [];
  const planes = [];
  for (const g of generados) {
    const entradaCaso = { caso: `${g.perfilId}-${g.semilla}`, perfil: g.perfilId, semilla: g.semilla, planes: [] };
    for (const motor of ['legacy', 'engine2']) {
      const id = idPlan(g.perfilId, g.semilla, motor);
      const archivo = `planes/${id}.json`;
      const texto = serializar(g.planes[motor]);
      fs.writeFileSync(path.join(salidaAbs, archivo), texto, { encoding: 'utf8', flag: 'wx' });
      entradaCaso.planes.push({
        id, motor, archivo,
        sha256Plan: sha256(texto),
        sha256Vista: sha256(serializar(g.vistas[motor])),
        entrada: g.entradas[motor],
      });
      planes.push({ id, motor, archivo });
    }
    casos.push(entradaCaso);
  }

  const manifiesto = {
    generadorVersion: GENERADOR_VERSION,
    generadoEn: new Date().toISOString(),
    codigo: { head, arbolLimpio: true },
    registroSemillas: { ruta: registroPath, sha256: sha256(registroTexto), ancla: registro.ancla, perimetro: registro.perimetro },
    estrategia: ESTRATEGIA,
    semillas: [...SEMILLAS_EVALUACION],
    perfiles: PERFILES,
    perfilBaseLegacy: PERFIL_BASE_LEGACY,
    targetKcalLegacy: TARGET_KCAL_LEGACY,
    opcionesLegacy: { ...OPCIONES_LEGACY, saveMealMemory: 'función vacía', rng: 'mulberry32(semilla) de src/engine/rng.js' },
    traduccionPerfilBase: TRADUCCION_PERFIL_BASE,
    verificaciones: ['estrategia', 'dia libre = dia 6 en ambos motores', 'determinismo de la vista adaptada', 'contrato del cegado'],
    casos,
    planes,
  };
  fs.writeFileSync(path.join(salidaAbs, 'manifiesto-generacion.json'), serializar(manifiesto), { encoding: 'utf8', flag: 'wx' });
  console.log(`generarCasos: ${generados.length} casos, ${planes.length} planes en ${salidaAbs} (HEAD ${head}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
