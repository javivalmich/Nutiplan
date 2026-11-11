// banco — banco reproducible I-0 del motor de menús.
//
// Genera semanas seguidas con perfiles SINTÉTICOS y semillas fijas
// (scripts/banco/perfiles.mjs), por el mismo punto de entrada que la app
// (src/plan/generarPlan.js), y mide lo que sale. Sin red, sin Supabase y sin
// variables de entorno. Cada semilla se genera DOS veces: si las dos salidas
// no son idénticas, el banco se detiene sin escribir nada.
//
// Uso (desde la raíz del repo):
//   node --import ./scripts/banco/resolver.mjs scripts/banco/banco.mjs                 mide y compara con la línea base
//   node --import ./scripts/banco/resolver.mjs scripts/banco/banco.mjs --guardar       congela la línea base
//   … --salida <archivo.json>   escribe la medición en otro archivo
//   … --semanas <n>             semanas por perfil (por defecto 8)
//   … --perfil <id>             solo ese perfil (repetible)
// Código de salida: 0 igual que la línea base; 1 hay diferencias; 2 no reproducible o error.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generarPlan, platosRecientesPara } from '../../src/plan/generarPlan.js';
import { catalogoApp } from '../../src/plan/catalogo.js';
import { conPlatosDieta } from '../../src/plan/platosDieta.js';
import { objetivoDe } from '../../src/plan/racionesApp.js';
import { medirPlan } from '../../src/plan/medidor/medir.js';
import { COMPOSICION } from '../../src/engine2/nutrientes/composicion.js';
import { FREEFORM_POOL } from '../../src/data/freeformPool.js';
import { PERFILES, SEMANA_INICIAL, SEMANAS_POR_DEFECTO, MES, clonar } from './perfiles.mjs';
import { composicionSemana, restriccionesSemana, cantidadesSemana, huellaPlan, huecosSemana, catalogoFiltrado, idaYVueltaCatalogo } from './metricas.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const LINEA_BASE = path.join(AQUI, 'linea-base', 'linea-base.json');

// ─── Generación ──────────────────────────────────────────────────────────────

function silenciar(fn) {
  const { log, error, warn } = console;
  console.log = console.error = console.warn = () => {};
  try { return fn(); } finally { Object.assign(console, { log, error, warn }); }
}

function generar(p, semana, anterior) {
  const opts = {
    month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: semana, userId: `banco-${p.id}`,
    saveMealMemory: () => {}, platosRecientes: platosRecientesPara(anterior, semana - 1, semana),
  };
  return silenciar(() => generarPlan(clonar(p.perfil), p.kcal, opts));
}

// Única exclusión de la comparación: day.id. El motor viejo (congelado) lo
// forma con Date.now() («day-0-1794438330592») y lo declara fuera de su
// determinismo en src/engine/buildPlan.js:44 y :2267. Todo lo demás del plan
// (también decisionLog y los campos internos) debe ser idéntico byte a byte.
// El banco cuenta en cuántas semillas esa es la única diferencia.
export const estado = { semillas: 0, soloDifiereIdDeDia: 0 };
const sinIdDeDia = (plan) => JSON.stringify(plan, (k, v) => (k === 'id' && typeof v === 'string' && /^day-\d-\d+$/.test(v) ? v.replace(/-\d+$/, '') : v));

const sumarEn = (acc, obj) => {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number') acc[k] = (acc[k] || 0) + v;
    else if (v && typeof v === 'object' && !Array.isArray(v)) acc[k] = sumarEn(acc[k] || {}, v);
  }
  return acc;
};
const maxEn = (acc, obj, claves) => { for (const k of claves) acc[k] = Math.max(acc[k] || 0, obj[k] || 0); };
const ordenar = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, ordenar(o[k])])) : o);
const r1 = (x) => Math.round(x * 10) / 10;

/** Mide un perfil: n semanas seguidas, cada semilla dos veces. */
export function medirPerfil(p, semanas) {
  const catalogoPerfil = conPlatosDieta(catalogoApp(), p.perfil, { reserva: true });
  const porId = new Map(catalogoPerfil.map((d) => [d.id, d]));
  const obj = objetivoDe(p.perfil, p.kcal);
  const comp = {}; const cant = {}; const restr = { comidas: 0, conVetado: 0, conEliminado: 0 };
  const maximos = {}; const maxCant = {}; const maximoG = {};
  const filas = []; const motores = {}; const ejemplos = []; const detalleRestr = [];
  const nutr = { desvios: [], diasFueraKcal: 0, diasSinProteina: 0, comidasPrincipalesCortas: 0, comidasPrincipales: 0, semanasFuera: 0 };
  let anterior = null;
  for (let s = 0; s < semanas; s++) {
    const semana = SEMANA_INICIAL + s;
    const plan = generar(p, semana, anterior);
    const otra = generar(p, semana, anterior);
    if (sinIdDeDia(plan) !== sinIdDeDia(otra)) {
      throw new Error(`NO REPRODUCIBLE: ${p.id}, semana ${semana}: dos ejecuciones de la misma semilla dan planes distintos`);
    }
    if (JSON.stringify(plan) !== JSON.stringify(otra)) estado.soloDifiereIdDeDia += 1;
    estado.semillas += 1;
    const recientes = platosRecientesPara(anterior, semana - 1, semana);
    const c = composicionSemana(plan, porId, recientes);
    const q = cantidadesSemana(plan, p.perfil, p.kcal);
    const x = restriccionesSemana(plan, p.perfil);
    const m = medirPlan(plan, { kcal: p.kcal, proteina: obj.proteina, peso: obj.pesoKg }, COMPOSICION);
    // La racha es un máximo de la semana (va en maximoSemanal), no un total.
    const { sugerenciaSabado, rachaPescado: _racha, ...cNum } = c;
    sumarEn(comp, cNum);
    if (sugerenciaSabado) { comp.sugerenciaSabado = comp.sugerenciaSabado || {}; comp.sugerenciaSabado[sugerenciaSabado] = (comp.sugerenciaSabado[sugerenciaSabado] || 0) + 1; }
    maxEn(maximos, c, ['pescado', 'legumbre', 'rachaPescado', 'familiaDiasSeguidos']);
    const { ejemplos: ej, maximoG: mg, mayorDiferenciaG, mayorDiferenciaKcal, huevosMaxComida, huevosMaxDia, ...qNum } = q;
    sumarEn(cant, qNum);
    maxEn(maxCant, q, ['mayorDiferenciaG', 'mayorDiferenciaKcal', 'huevosMaxComida', 'huevosMaxDia']);
    for (const [k, v] of Object.entries(mg)) maximoG[k] = Math.max(maximoG[k] || 0, v);
    for (const e of ej) if (ejemplos.length < 8) ejemplos.push(`s${semana} ${e}`);
    restr.comidas += x.comidas; restr.conVetado += x.conVetado; restr.conEliminado += x.conEliminado;
    for (const d of x.detalle) if (detalleRestr.length < 8) detalleRestr.push(`s${semana} ${d}`);
    nutr.desvios.push(m.desvioSemana);
    nutr.diasFueraKcal += m.diasFueraKcal; nutr.diasSinProteina += m.diasSinProteina;
    nutr.comidasPrincipalesCortas += m.comidasPrincipalesCortas; nutr.comidasPrincipales += m.comidasPrincipales;
    if (!m.semanaDentro) nutr.semanasFuera += 1;
    motores[plan.motor || 'legacy'] = (motores[plan.motor || 'legacy'] || 0) + 1;
    filas.push({
      semana, huella: huellaPlan(plan), motor: plan.motor || 'legacy', aviso: plan.motorAviso ? plan.motorAviso.split(' (')[0] : null,
      desvioKcal: m.desvioSemana, pescado: c.pescado, legumbre: c.legumbre,
      platos: huecosSemana(plan, porId).map((h) => `${h.nombreDia.slice(0, 2)}-${h.momento === 'comida' ? 'C' : 'N'}${h.libre ? '*' : ''} [${h.familia}] ${h.titulo}`),
    });
    anterior = plan;
  }
  return ordenar({
    id: p.id, kcal: p.kcal, semanas, motores,
    composicion: { ...comp, maximoSemanal: maximos, mediaSemanal: { pescado: r1(comp.pescado / semanas), legumbre: r1(comp.legumbre / semanas) } },
    cantidades: { ...cant, ...maxCant, maximoG, ejemplos },
    restricciones: { ...restr, detalle: detalleRestr },
    nutricion: {
      desvioSemanaMin: Math.min(...nutr.desvios), desvioSemanaMax: Math.max(...nutr.desvios),
      desvioSemanaMedio: r1(nutr.desvios.reduce((a, b) => a + b, 0) / nutr.desvios.length),
      semanasFueraDe5: nutr.semanasFuera, diasFueraKcal: nutr.diasFueraKcal, diasSinProteina: nutr.diasSinProteina,
      comidasPrincipalesCortas: nutr.comidasPrincipalesCortas, comidasPrincipales: nutr.comidasPrincipales,
    },
    planes: filas,
  });
}

export function medirCatalogo(perfiles) {
  const base = catalogoApp();
  const filtrado = {};
  for (const p of perfiles) filtrado[p.id] = catalogoFiltrado(base, p.perfil, p.kcal);
  const todos = conPlatosDieta(conPlatosDieta(base, { dieta: 'vegana' }, { reserva: true }), { dieta: 'vegetariana' }, { reserva: true });
  const unicos = [...new Map(todos.map((d) => [d.id, d])).values()];
  return ordenar({ platos: base.length, filtradoPorPerfil: filtrado, idaYVuelta: idaYVueltaCatalogo(unicos) });
}

export function medirTodo({ semanas = SEMANAS_POR_DEFECTO, perfiles = PERFILES } = {}) {
  return {
    banco: 'I-0', version: 1, semanas, semanaInicial: SEMANA_INICIAL,
    // Medidas de CATÁLOGO (sin generar planes) y de MENÚS GENERADOS, separadas.
    catalogo: medirCatalogo(perfiles),
    menus: perfiles.map((p) => medirPerfil(p, semanas)),
  };
}

// ─── Comparación con la línea base ───────────────────────────────────────────

export function diferencias(antes, despues, ruta = '') {
  const out = [];
  if (JSON.stringify(antes) === JSON.stringify(despues)) return out;
  const hoja = (v) => v === null || typeof v !== 'object';
  if (hoja(antes) || hoja(despues) || Array.isArray(antes) !== Array.isArray(despues)) return [`${ruta}: ${JSON.stringify(antes)} → ${JSON.stringify(despues)}`];
  if (Array.isArray(antes)) {
    const porId = (xs) => (xs.every((x) => x && typeof x === 'object' && (x.id || x.semana)) ? new Map(xs.map((x) => [x.id || x.semana, x])) : null);
    const a = porId(antes); const d = porId(despues);
    if (a && d) { for (const k of new Set([...a.keys(), ...d.keys()])) out.push(...diferencias(a.get(k) ?? null, d.get(k) ?? null, `${ruta}[${k}]`)); return out; }
    if (JSON.stringify(antes) !== JSON.stringify(despues)) {
      const n = Math.max(antes.length, despues.length);
      for (let i = 0; i < n; i++) if (JSON.stringify(antes[i]) !== JSON.stringify(despues[i])) out.push(`${ruta}[${i}]: ${JSON.stringify(antes[i] ?? null)} → ${JSON.stringify(despues[i] ?? null)}`);
    }
    return out;
  }
  for (const k of new Set([...Object.keys(antes), ...Object.keys(despues)])) out.push(...diferencias(antes[k] ?? null, despues[k] ?? null, ruta ? `${ruta}.${k}` : k));
  return out;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function resumen(m) {
  console.log('\nMENÚS GENERADOS (por perfil; totales de todas las semanas salvo indicación)');
  console.table(m.menus.map((p) => ({
    perfil: p.id, motor: Object.entries(p.motores).map(([k, v]) => `${k}:${v}`).join(' '),
    'pescado med/máx': `${p.composicion.mediaSemanal.pescado}/${p.composicion.maximoSemanal.pescado}`,
    'legumbre med/máx': `${p.composicion.mediaSemanal.legumbre}/${p.composicion.maximoSemanal.legumbre}`,
    'racha pescado': p.composicion.maximoSemanal.rachaPescado,
    'familia días seguidos': p.composicion.familiaDiasSeguidos,
    'calc≠compra': `${p.cantidades.calculadoDistintoDeCompra}/${p.cantidades.ingredientes}`,
    'texto≠compra': p.cantidades.textoDistinto,
    'en techo': p.cantidades.enTechoBase + p.cantidades.sobreTechoBase,
    'pan añadido': `${p.cantidades.panAnadido}/${p.cantidades.principales}`,
    vetados: p.restricciones.conVetado + p.restricciones.conEliminado,
    'kcal % mín/máx': `${p.nutricion.desvioSemanaMin}/${p.nutricion.desvioSemanaMax}`,
  })));
  const iv = m.catalogo.idaYVuelta;
  console.log(`CATÁLOGO — ida y vuelta de cantidades: ${iv.platos} platos, ${iv.ingredientes} ingredientes ajustables, ${iv.pruebas} pruebas; ${iv.distintas} releídas distintas, ${iv.ilegibles} ilegibles, ${iv.platosAfectados} platos afectados`);
  console.log('  por ingrediente y forma:', JSON.stringify(iv.porClaveYForma));
}

const esCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esCli) {
  const args = process.argv.slice(2);
  const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const todos = (n) => args.flatMap((a, i) => (a === n ? [args[i + 1]] : []));
  const semanas = Number(valor('--semanas') || SEMANAS_POR_DEFECTO);
  const ids = todos('--perfil');
  const perfiles = ids.length ? PERFILES.filter((p) => ids.includes(p.id)) : PERFILES;
  let medicion;
  try {
    medicion = medirTodo({ semanas, perfiles });
  } catch (err) {
    console.error(String(err && err.message ? err.message : err));
    process.exit(2);
  }
  console.log(`Reproducibilidad: ${estado.semillas} semillas generadas dos veces, todas idénticas salvo day.id (marca de tiempo del motor viejo, buildPlan.js:2267), que difiere en ${estado.soloDifiereIdDeDia}.`);
  resumen(medicion);
  const texto = `${JSON.stringify(medicion, null, 1)}\n`;
  const salida = valor('--salida');
  if (salida) { fs.writeFileSync(salida, texto); console.log(`Medición escrita en ${salida}`); }
  if (args.includes('--guardar')) {
    if (ids.length || semanas !== SEMANAS_POR_DEFECTO) { console.error('--guardar solo con todos los perfiles y las semanas por defecto'); process.exit(2); }
    fs.mkdirSync(path.dirname(LINEA_BASE), { recursive: true });
    fs.writeFileSync(LINEA_BASE, texto);
    console.log(`Línea base guardada en ${path.relative(process.cwd(), LINEA_BASE)}`);
    process.exit(0);
  }
  if (!fs.existsSync(LINEA_BASE)) { console.log('No hay línea base guardada (usa --guardar).'); process.exit(0); }
  const base = JSON.parse(fs.readFileSync(LINEA_BASE, 'utf8'));
  const recorte = { ...base, semanas, menus: base.menus.filter((p) => perfiles.some((q) => q.id === p.id)), catalogo: { ...base.catalogo, filtradoPorPerfil: Object.fromEntries(Object.entries(base.catalogo.filtradoPorPerfil).filter(([k]) => perfiles.some((q) => q.id === k))) } };
  const comparable = semanas === base.semanas;
  if (!comparable) { console.log(`La línea base tiene ${base.semanas} semanas por perfil; con --semanas ${semanas} no se compara.`); process.exit(0); }
  const difs = diferencias(recorte, medicion);
  if (!difs.length) { console.log('\nSin diferencias con la línea base.'); process.exit(0); }
  const planes = difs.filter((d) => /\.planes\[\d+\]\.huella/.test(d)).length;
  console.log(`\n${difs.length} diferencias con la línea base (${planes} semanas con el menú o el texto cambiado):`);
  for (const d of difs.filter((x) => !/\.planes\[/.test(x)).slice(0, 200)) console.log('  ' + d);
  process.exit(1);
}
