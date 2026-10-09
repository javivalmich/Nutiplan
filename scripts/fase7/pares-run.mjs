// pares-run — modo pares de la primera Fase 7 (D-091).
//
// NO genera planes y NO ejecuta ningún motor. Lee los planes ya generados
// (D-090), los cega con una sola llamada a blind(), los reagrupa en pares A/B
// y escribe, por separado, la vista del evaluador y la clave.
//
// Su existencia no autoriza la ejecución sobre el material de evaluación:
// requiere un asiento posterior (D-091, "Autorización y límites").
//
// Uso:
//   node scripts/fase7/pares-run.mjs --manifiesto <ruta> --sha <40 hex> --salida-evaluador <ruta> --salida-clave <ruta> --confirmo-ejecucion

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { toEvalView as legacyView } from '../../src/engine/evalView.js';
import { toEvalView as engine2View } from '../../src/engine2/evalView.js';
import { blind, serialize } from '../../src/eval/blind/blind.js';
import {
  MANIFIESTO_SHA256, semillaDeSha, validarManifiesto, formarPares, construirSalidas,
} from './pares.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ADAPTADORES = { legacy: legacyView, engine2: engine2View };

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

function fail(msg) {
  console.error(`pares-run: ${msg}`);
  process.exit(1);
}

function arg(nombre) {
  const i = process.argv.indexOf(nombre);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main() {
  const manifiestoPath = arg('--manifiesto');
  const sha = arg('--sha');
  const outEvaluador = arg('--salida-evaluador');
  const outClave = arg('--salida-clave');
  if (!process.argv.includes('--confirmo-ejecucion')) {
    fail('falta --confirmo-ejecucion. Este comando produce material de evaluación; no se ejecuta por defecto.');
  }
  if (!manifiestoPath || !sha || !outEvaluador || !outClave) {
    fail('uso: --manifiesto <ruta> --sha <40 hex> --salida-evaluador <ruta> --salida-clave <ruta> --confirmo-ejecucion');
  }

  let seed;
  try {
    seed = semillaDeSha(sha);
  } catch (e) {
    fail(e.message);
  }

  const evalAbs = path.resolve(outEvaluador);
  const claveAbs = path.resolve(outClave);
  if (evalAbs === claveAbs) fail('la vista del evaluador y la clave deben escribirse en archivos distintos');
  for (const out of [evalAbs, claveAbs]) {
    if (fs.existsSync(out)) fail(`no se sobrescribe un archivo existente: ${out}`);
    const rel = path.relative(ROOT, out);
    if (!rel.startsWith('..') && !path.isAbsolute(rel)) fail(`la salida debe estar fuera del repositorio: ${out}`);
  }

  const manifiestoAbs = path.resolve(manifiestoPath);
  const bytesManifiesto = fs.readFileSync(manifiestoAbs);
  if (sha256(bytesManifiesto) !== MANIFIESTO_SHA256) {
    fail('el sha256 del manifiesto no es el fijado por D-091');
  }
  const manifiesto = JSON.parse(bytesManifiesto.toString('utf8'));

  let validado;
  try {
    validado = validarManifiesto(manifiesto);
  } catch (e) {
    fail(e.message);
  }
  const { casoPorId, perfilPorCaso, motorPorId } = validado;

  const baseDir = path.dirname(manifiestoAbs);
  const bytesPorId = {};
  for (const c of manifiesto.casos) {
    for (const p of c.planes) {
      const bytes = fs.readFileSync(path.resolve(baseDir, p.archivo));
      if (sha256(bytes) !== p.sha256Plan) fail(`sha256 del plan distinto de sha256Plan: ${p.id}`);
      bytesPorId[p.id] = bytes;
    }
  }

  const items = manifiesto.planes.map((p) => {
    const plan = JSON.parse(bytesPorId[p.id].toString('utf8'));
    return { id: p.id, view: ADAPTADORES[p.motor](plan) };
  });

  const ejecutar = () => {
    const resultado = blind(items, seed);
    const pares = formarPares(resultado, casoPorId);
    const { evaluador, clave } = construirSalidas({
      pares, perfilPorCaso, motorPorId, sha, seed, manifiestoSha256: MANIFIESTO_SHA256,
    });
    return { vista: serialize(evaluador), clave: serialize(clave) };
  };
  let r1;
  let r2;
  try {
    r1 = ejecutar();
    r2 = ejecutar();
  } catch (e) {
    fail(e.message);
  }
  if (r1.vista !== r2.vista || r1.clave !== r2.clave) {
    fail('el proceso no es determinista con esta entrada; se aborta sin escribir');
  }

  fs.writeFileSync(evalAbs, r1.vista, { encoding: 'utf8', flag: 'wx' });
  fs.writeFileSync(claveAbs, r1.clave, { encoding: 'utf8', flag: 'wx' });
  console.log(`pares-run: ${manifiesto.casos.length} pares escritos (seed ${seed}).`);
  console.log(`  vista del evaluador: ${evalAbs}`);
  console.log(`  clave (no entregar al evaluador): ${claveAbs}`);
}

main();
