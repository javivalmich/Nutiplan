// blind-run — runner del cegado común (D-085, D-086).
//
// NO genera planes y NO ejecuta ningún motor. Recibe planes ya producidos
// (archivos JSON) y escribe, por separado:
//   - la vista del evaluador (sin ids ni motores), y
//   - la clave etiqueta -> id -> motor.
//
// Este script conoce el motor de cada plan porque elige su adaptador; el
// módulo ciego (src/eval/blind/blind.js) solo recibe { id, view }.
//
// Su existencia no autoriza la Fase 7. Ejecutarlo sobre planes de evaluación
// requiere decisión expresa del titular y el diseño experimental aprobado.
//
// Uso:
//   node scripts/fase7/blind-run.mjs <manifiesto.json> <salida-evaluador.json> <salida-clave.json> --confirmo-ejecucion
//
// Manifiesto:
//   { "seed": <entero>, "planes": [ { "id": "...", "motor": "legacy"|"engine2", "archivo": "ruta/plan.json" } ] }
//   Las rutas de "archivo" se resuelven respecto al directorio del manifiesto.

import fs from 'node:fs';
import path from 'node:path';
import { toEvalView as legacyView } from '../../src/engine/evalView.js';
import { toEvalView as engine2View } from '../../src/engine2/evalView.js';
import { blind, serialize } from '../../src/eval/blind/blind.js';

const ADAPTADORES = { legacy: legacyView, engine2: engine2View };

function fail(msg) {
  console.error(`blind-run: ${msg}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const confirmado = args.includes('--confirmo-ejecucion');
const [manifestPath, outEvaluador, outClave] = args.filter((a) => !a.startsWith('--'));

if (!manifestPath || !outEvaluador || !outClave) {
  fail('uso: blind-run.mjs <manifiesto.json> <salida-evaluador.json> <salida-clave.json> --confirmo-ejecucion');
}
if (!confirmado) {
  fail('falta --confirmo-ejecucion. Este runner produce artefactos de evaluación; no se ejecuta por defecto.');
}
if (path.resolve(outEvaluador) === path.resolve(outClave)) {
  fail('la vista del evaluador y la clave deben escribirse en archivos distintos');
}
for (const out of [outEvaluador, outClave]) {
  if (fs.existsSync(out)) fail(`no se sobrescribe un archivo existente: ${out}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const baseDir = path.dirname(path.resolve(manifestPath));
if (!Number.isInteger(manifest.seed)) fail('manifiesto.seed debe ser un entero declarado');
if (!Array.isArray(manifest.planes) || manifest.planes.length === 0) fail('manifiesto.planes vacío');

const motorPorId = {};
const items = manifest.planes.map((p, k) => {
  const adaptar = ADAPTADORES[p.motor];
  if (!adaptar) fail(`planes[${k}].motor desconocido: ${JSON.stringify(p.motor)}`);
  if (typeof p.id !== 'string' || p.id.length === 0) fail(`planes[${k}].id vacío`);
  motorPorId[p.id] = p.motor;
  const plan = JSON.parse(fs.readFileSync(path.resolve(baseDir, p.archivo), 'utf8'));
  return { id: p.id, view: adaptar(plan) };
});

// Reproducibilidad (§6, ítem 3): dos ejecuciones, misma salida, o se aborta.
const r1 = blind(items, manifest.seed);
const r2 = blind(items, manifest.seed);
if (serialize(r1.evaluador) !== serialize(r2.evaluador) || serialize(r1.clave) !== serialize(r2.clave)) {
  fail('el cegado no es determinista con esta entrada; se aborta sin escribir');
}

const clave = {
  version: r1.clave.version,
  seed: r1.clave.seed,
  entradas: r1.clave.entradas.map((e) => ({ etiqueta: e.etiqueta, id: e.id, motor: motorPorId[e.id] })),
};

// UTF-8 sin BOM, LF (serialize ya produce LF y salto final).
fs.writeFileSync(outEvaluador, serialize(r1.evaluador), { encoding: 'utf8', flag: 'wx' });
fs.writeFileSync(outClave, serialize(clave), { encoding: 'utf8', flag: 'wx' });
console.log(`blind-run: ${r1.evaluador.planes.length} planes cegados (seed ${manifest.seed}).`);
console.log(`  vista del evaluador: ${outEvaluador}`);
console.log(`  clave (no entregar al evaluador): ${outClave}`);
