// Reconocimiento tecnico de emision efectiva de productores (Acto A).
// Lectura + ejecucion. NO mide, NO evalua conformidad, NO decide.
// Ancla: HEAD 46cea91b00d2be0720f2dcb6aa41e2b82cab7511.
//
// Ejecuta cada productor UNA vez con su entrada nativa registrada (ver
// PROCEDENCIA abajo), vuelca el objeto retornado CRUDO (sin normalizar
// contra plan-observable.md §4), y repite la ejecucion para reportar
// byte-identidad entre las dos corridas (dato de estabilidad, no gate).
//
// PROCEDENCIA DE ENTRADAS (verbatim, sin traduccion canonica):
//   Productor 1 (buildPlan):        src/engine/tests/buildPlan.snapshot.test.js:16-54
//     (SEED=123456, PROFILE, TARGET_KCAL=2000, BASE_OPTS, funcion run()).
//   Productor 2 (materializePlan):  src/engine2/tests/materializePlan.test.js:15-19
//     (FIXTURE_INPUT) + catalog = loadCatalog(), tal cual linea 23-24 de ese fichero.
//
// Uso: node docs/evidence/protocolo-evaluacion/r0-emision-productores.mjs
// Salida: docs/evidence/protocolo-evaluacion/out/r0-buildPlan-run1.raw.json
//         docs/evidence/protocolo-evaluacion/out/r0-buildPlan-run2.raw.json
//         docs/evidence/protocolo-evaluacion/out/r0-materializePlan.raw.json
//         (stdout: flags de serializabilidad, estabilidad, capa descriptiva)
//
// LIMITACION CONOCIDA (readPreviousRaw, TAREA 2/3a mas abajo): esta funcion lee,
// ANTES de escribir la corrida actual, el volcado que dejo la ejecucion anterior
// de este mismo script en OUT_DIR, y lo usa como termino de comparacion ("adjunto
// previo"). Encadena hacia delante: cada ejecucion compara contra la inmediata
// anterior, no contra un adjunto fijo. En una copia de trabajo sin corrida previa
// (p.ej. un tercero que clona el repo y ejecuta por primera vez, o tras limpiar
// OUT_DIR) no hay fichero que leer y la TAREA 2 / TAREA 3a del diff se omiten
// (se reporta `omitida: true` en el summary), no fallan. No se ha corregido este
// comportamiento: se deja documentado como limitacion conocida del instrumento.

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { vi } from 'vitest';

// Imports estaticos: profundidad fija desde docs/evidence/protocolo-evaluacion/
// hasta la raiz del repo (tres niveles: ../../../). Un import ES no admite una
// ruta computada desde import.meta.url sin pasar a import() dinamico; se opta
// por la correccion estatica documentada, no por resolucion dinamica de raiz.
// Esta ejecucion ASUME que el fichero permanece en docs/evidence/protocolo-evaluacion/;
// si se mueve, estas cuatro rutas deben reajustarse a mano.
import { buildPlan } from '../../../src/engine/buildPlan.js';
import { mulberry32 } from '../../../src/engine/rng.js';

import { materializePlan } from '../../../src/engine2/materializePlan.js';
import { loadCatalog } from '../../../src/engine2/dishes/loadCatalog.js';

// OUT_DIR ya esta anclado a la ubicacion del propio fichero via import.meta.url
// (no al cwd desde el que se invoque `node`), por lo que cae dentro de
// docs/evidence/protocolo-evaluacion/out/ sin depender de donde se ejecute.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
mkdirSync(OUT_DIR, { recursive: true });

// ─── Lectura del adjunto PREVIO, antes de sobrescribir (instrumentacion S2) ─
// Debe leerse ANTES de que el volcado de esta corrida sobrescriba el fichero,
// o el cotejo tu-run vs Code-run-anterior perderia su termino de comparacion.
function readPreviousRaw(fileName) {
  const p = path.join(OUT_DIR, fileName);
  try {
    const text = readFileSync(p, 'utf8');
    return { exists: true, value: JSON.parse(text) };
  } catch (err) {
    return { exists: false, error: err?.message };
  }
}
const previousRaw = {
  buildPlan: readPreviousRaw('r0-buildPlan-run1.raw.json'),
  materializePlan: readPreviousRaw('r0-materializePlan.raw.json'),
};

// ─── Diff estructural recursivo (instrumentacion de comparacion) ───────────
// Opera sobre los objetos ya "walked" (JSON-safe: funciones/undefined/symbol/
// bigint/NaN/Infinity ya representados como marcadores string por walk()).
// Devuelve la LISTA COMPLETA de keypaths donde los dos valores difieren, con
// ambos valores. NO compara por JSON.stringify global: recorre la estructura
// (objetos por union de claves, arrays por indice, primitivos por Object.is).
const ABSENT = Symbol('absent');

function structuralDiff(a, b, keyPath, out) {
  const aAbsent = a === ABSENT;
  const bAbsent = b === ABSENT;
  if (aAbsent || bAbsent) {
    out.push({ path: keyPath, left: aAbsent ? '[[ausente]]' : a, right: bAbsent ? '[[ausente]]' : b });
    return;
  }
  const aIsArr = Array.isArray(a);
  const bIsArr = Array.isArray(b);
  const aIsObj = a !== null && typeof a === 'object' && !aIsArr;
  const bIsObj = b !== null && typeof b === 'object' && !bIsArr;

  if (aIsArr && bIsArr) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const av = i < a.length ? a[i] : ABSENT;
      const bv = i < b.length ? b[i] : ABSENT;
      structuralDiff(av, bv, `${keyPath}[${i}]`, out);
    }
    return;
  }
  if (aIsObj && bIsObj) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const av = Object.prototype.hasOwnProperty.call(a, k) ? a[k] : ABSENT;
      const bv = Object.prototype.hasOwnProperty.call(b, k) ? b[k] : ABSENT;
      structuralDiff(av, bv, keyPath ? `${keyPath}.${k}` : k, out);
    }
    return;
  }
  if (aIsArr !== bIsArr || aIsObj !== bIsObj) {
    // tipo estructural distinto (array vs objeto vs primitivo) en esta ruta
    out.push({ path: keyPath, left: a, right: b });
    return;
  }
  // ambos primitivos (o null)
  if (!Object.is(a, b)) {
    out.push({ path: keyPath, left: a, right: b });
  }
}

function runStructuralDiff(a, b, rootLabel) {
  const out = [];
  structuralDiff(a, b, rootLabel, out);
  return out;
}

// ─── Dumper crudo: no descarta nada silenciosamente ────────────────────────
// function -> "[Function <name>]", undefined -> "[undefined]",
// circular -> "[Circular]". Ademas (para no perder datos por la puerta de
// atras de JSON.stringify): Map/Set -> marcador explicito, NaN/Infinity ->
// marcador explicito, symbol/bigint -> marcador explicito. Orden de claves
// tal como retorna el objeto (Object.keys = orden de insercion).
function walk(value, keyPath, ancestors, nonSerializable) {
  if (typeof value === 'function') {
    const name = value.name || '(anonymous)';
    const repr = `[Function ${name}]`;
    nonSerializable.push({ path: keyPath, kind: 'function', repr });
    return repr;
  }
  if (value === undefined) {
    const repr = '[undefined]';
    nonSerializable.push({ path: keyPath, kind: 'undefined', repr });
    return repr;
  }
  if (typeof value === 'symbol') {
    const repr = value.toString();
    nonSerializable.push({ path: keyPath, kind: 'symbol', repr });
    return repr;
  }
  if (typeof value === 'bigint') {
    const repr = `${value.toString()}n`;
    nonSerializable.push({ path: keyPath, kind: 'bigint', repr });
    return repr;
  }
  if (value === null) return null;
  if (typeof value === 'number' && Number.isNaN(value)) {
    nonSerializable.push({ path: keyPath, kind: 'NaN', repr: 'NaN' });
    return 'NaN';
  }
  if (value === Infinity || value === -Infinity) {
    const repr = String(value);
    nonSerializable.push({ path: keyPath, kind: 'Infinity', repr });
    return repr;
  }
  if (typeof value !== 'object') return value; // string, number, boolean

  if (ancestors.includes(value)) {
    const repr = '[Circular]';
    nonSerializable.push({ path: keyPath, kind: 'circular', repr });
    return repr;
  }
  if (value instanceof Map) {
    const repr = `[Map size=${value.size}]`;
    nonSerializable.push({ path: keyPath, kind: 'Map', repr });
    return repr;
  }
  if (value instanceof Set) {
    const repr = `[Set size=${value.size}]`;
    nonSerializable.push({ path: keyPath, kind: 'Set', repr });
    return repr;
  }

  const nextAncestors = [...ancestors, value];
  if (Array.isArray(value)) {
    return value.map((v, i) => walk(v, `${keyPath}[${i}]`, nextAncestors, nonSerializable));
  }
  // Date u otro objeto plano/instancia: recorrer sus claves propias enumerables.
  const out = {};
  for (const key of Object.keys(value)) {
    out[key] = walk(value[key], keyPath ? `${keyPath}.${key}` : key, nextAncestors, nonSerializable);
  }
  return out;
}

function dumpRaw(label, producedValue) {
  const nonSerializable = [];
  const walked = walk(producedValue, label, [], nonSerializable);
  const json = JSON.stringify(walked, null, 2);
  return { json, walked, nonSerializable, serializableIntegra: nonSerializable.length === 0 };
}

// ─── Productor 1: buildPlan ─────────────────────────────────────────────
// Entrada nativa verbatim de src/engine/tests/buildPlan.snapshot.test.js:16-54.
const SEED = 123456;
const PROFILE = {
  weight: 74,
  goal: "maintain",
  activity: "moderate",
  intolerances: [],
  trainingDays: [],
  extras: {},
  mealsPerDay: 3,
  tiempoCocina: "normal",
  experiencia: "intermedio",
  simpleMode: false,
  dob: "1990-01-01",
  gender: "male",
  height: 178,
};
const TARGET_KCAL = 2000;
const BASE_OPTS = {
  month: 5,
  weekNumber: 23,
  pastProteins: {},
  freeFormPool: [],
  saveMealMemory: vi.fn(),
};
function runBuildPlan(seed) {
  return buildPlan(
    JSON.parse(JSON.stringify(PROFILE)),
    TARGET_KCAL,
    { ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed) },
  );
}

// ─── Productor 2: materializePlan ───────────────────────────────────────
// Entrada nativa verbatim de src/engine2/tests/materializePlan.test.js:15-19,24.
const FIXTURE_INPUT = {
  profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] },
  seed: 0,
  strategy: 'mantenimiento_equilibrado',
};
function runMaterializePlan() {
  const catalog = loadCatalog();
  return materializePlan({ ...FIXTURE_INPUT, catalog });
}

// ─── Ejecucion + falsabilidad simetrica ─────────────────────────────────
function executeProducer(name, fn) {
  const runs = [];
  for (let i = 0; i < 2; i++) {
    try {
      const value = fn();
      runs.push({ ok: true, value });
    } catch (err) {
      runs.push({ ok: false, error: { name: err?.name, message: err?.message, stack: err?.stack } });
    }
  }
  return { name, runs };
}

const results = {
  buildPlan: executeProducer('buildPlan', () => runBuildPlan(SEED)),
  materializePlan: executeProducer('materializePlan', () => runMaterializePlan()),
};

// ─── Volcado, flags, estabilidad ────────────────────────────────────────
const report = { generatedAt: new Date().toISOString(), producers: {} };
const dumps = {}; // key -> { dump1, dump2 } (walked), para reuso en diffs de TAREA 1/2/3

for (const [key, result] of Object.entries(results)) {
  const [run1, run2] = result.runs;
  const producerReport = { name: result.name };

  if (!run1.ok) {
    producerReport.excepcion = run1.error;
    report.producers[key] = producerReport;
    console.log(`\n=== ${key}: EXCEPCION en ejecucion 1 ===`);
    console.log(run1.error.stack || run1.error.message);
    continue;
  }

  if (run1.value === undefined || run1.value === null) {
    producerReport.emision = run1.value === undefined ? '[undefined]' : 'null';
    report.producers[key] = producerReport;
    console.log(`\n=== ${key}: NO EMITE (retorna ${producerReport.emision}) ===`);
    continue;
  }

  const dump1 = dumpRaw(key, run1.value);
  // buildPlan: sufijo explicito por corrida (run1/run2), sin sobrescribir.
  // materializePlan: fichero unico, sin cambios (no forma parte de la Tarea 2b).
  const isBuildPlan = key === 'buildPlan';
  const outFile = isBuildPlan
    ? path.join(OUT_DIR, `r0-${key}-run1.raw.json`)
    : path.join(OUT_DIR, `r0-${key}.raw.json`);
  writeFileSync(outFile, dump1.json, 'utf8');

  producerReport.outFile = path.relative(process.cwd(), outFile);
  producerReport.serializableIntegra = dump1.serializableIntegra ? 'si' : 'no';
  producerReport.noSerializables = dump1.nonSerializable;

  // Estabilidad: byte-identidad entre ejecucion 1 y 2 (dato, no gate §5).
  let dump2 = null;
  if (!run2.ok) {
    producerReport.estabilidad = `ejecucion 2 lanzo excepcion: ${run2.error.message}`;
  } else if (run2.value === undefined || run2.value === null) {
    producerReport.estabilidad = `ejecucion 2 no emitio (${run2.value === undefined ? '[undefined]' : 'null'})`;
  } else {
    dump2 = dumpRaw(key, run2.value);
    producerReport.estabilidad = dump1.json === dump2.json ? 'byte-identico' : 'DIFIERE';
    if (isBuildPlan) {
      const outFile2 = path.join(OUT_DIR, `r0-${key}-run2.raw.json`);
      writeFileSync(outFile2, dump2.json, 'utf8');
      producerReport.outFile2 = path.relative(process.cwd(), outFile2);
      console.log(`--- ${key}: run2 escrito en ruta absoluta: ${outFile2} ---`);
    }
  }
  dumps[key] = { dump1, dump2 };

  report.producers[key] = producerReport;

  console.log(`\n=== ${key}: volcado crudo (${outFile}) ===`);
  console.log(dump1.json);
  console.log(`\n--- ${key}: flag serializabilidad integra: ${producerReport.serializableIntegra} ---`);
  if (dump1.nonSerializable.length > 0) {
    console.log(`--- ${key}: no-serializables encontrados ---`);
    for (const ns of dump1.nonSerializable) {
      console.log(`  ${ns.path} :: ${ns.kind} -> ${ns.repr}`);
    }
  }
  console.log(`--- ${key}: estabilidad (2 ejecuciones, misma entrada): ${producerReport.estabilidad} ---`);
}

// ─── TAREA 1: buildPlan, diff estructural run1 vs run2 (misma corrida) ─────
report.tarea1_buildPlan_run1_vs_run2 = null;
if (dumps.buildPlan?.dump1 && dumps.buildPlan?.dump2) {
  const diff1 = runStructuralDiff(dumps.buildPlan.dump1.walked, dumps.buildPlan.dump2.walked, 'buildPlan');
  const expectedDayIdPaths = new Set(Array.from({ length: 7 }, (_, i) => `buildPlan.days[${i}].id`));
  const actualPaths = diff1.map((d) => d.path);
  const exceptions = actualPaths.filter((p) => !expectedDayIdPaths.has(p));
  const missingExpected = [...expectedDayIdPaths].filter((p) => !actualPaths.includes(p));
  const soloDayId = exceptions.length === 0;
  report.tarea1_buildPlan_run1_vs_run2 = { rutasDivergentes: diff1, soloDayId, excepciones: exceptions, expectedDayIdPathsAusentes: missingExpected };

  console.log(`\n=== TAREA 1: buildPlan, diff run1 vs run2 (${diff1.length} rutas divergentes) ===`);
  for (const d of diff1) console.log(`  ${d.path} :: run1=${JSON.stringify(d.left)} | run2=${JSON.stringify(d.right)}`);
  console.log(`--- TAREA 1c veredicto: soloDayId=${soloDayId} ${exceptions.length ? `| EXCEPCIONES: ${JSON.stringify(exceptions)}` : ''} ${missingExpected.length ? `| day.id esperados ausentes de la divergencia: ${JSON.stringify(missingExpected)}` : ''} ---`);
} else {
  console.log('\n=== TAREA 1: omitida (run1 o run2 de buildPlan no disponibles) ===');
}

// ─── TAREA 2: buildPlan, tu-run vs Code-run adjunto previo ─────────────────
report.tarea2_buildPlan_tuRun_vs_adjunto = null;
if (!previousRaw.buildPlan.exists) {
  report.tarea2_buildPlan_tuRun_vs_adjunto = { omitida: true, motivo: previousRaw.buildPlan.error };
  console.log(`\n=== TAREA 2: OMITIDA — no persiste scripts/diag/out/r0-buildPlan.raw.json de una corrida anterior (${previousRaw.buildPlan.error}) ===`);
} else if (dumps.buildPlan?.dump1) {
  const diff2 = runStructuralDiff(dumps.buildPlan.dump1.walked, previousRaw.buildPlan.value, 'buildPlan');
  const expectedDayIdPaths = new Set(Array.from({ length: 7 }, (_, i) => `buildPlan.days[${i}].id`));
  const actualPaths = diff2.map((d) => d.path);
  const exceptions = actualPaths.filter((p) => !expectedDayIdPaths.has(p));
  const soloDayId = exceptions.length === 0;
  report.tarea2_buildPlan_tuRun_vs_adjunto = { rutasDivergentes: diff2, soloDayId, excepciones: exceptions };

  console.log(`\n=== TAREA 2: buildPlan, diff tu-run vs adjunto previo (${diff2.length} rutas divergentes) ===`);
  for (const d of diff2) console.log(`  ${d.path} :: tu-run=${JSON.stringify(d.left)} | adjunto=${JSON.stringify(d.right)}`);
  console.log(`--- TAREA 2 veredicto (hipotesis: solo day.id): soloDayId=${soloDayId} ${exceptions.length ? `| EXCEPCIONES: ${JSON.stringify(exceptions)}` : ''} ---`);
}

// ─── TAREA 3a: materializePlan, diff tu-run vs adjunto previo ──────────────
report.tarea3a_materializePlan_tuRun_vs_adjunto = null;
if (!previousRaw.materializePlan.exists) {
  report.tarea3a_materializePlan_tuRun_vs_adjunto = { omitida: true, motivo: previousRaw.materializePlan.error };
  console.log(`\n=== TAREA 3a: OMITIDA — no persiste scripts/diag/out/r0-materializePlan.raw.json de una corrida anterior (${previousRaw.materializePlan.error}) ===`);
} else if (dumps.materializePlan?.dump1) {
  const diff3a = runStructuralDiff(dumps.materializePlan.dump1.walked, previousRaw.materializePlan.value, 'materializePlan');
  report.tarea3a_materializePlan_tuRun_vs_adjunto = { rutasDivergentes: diff3a, byteIdentico: diff3a.length === 0 };

  console.log(`\n=== TAREA 3a: materializePlan, diff tu-run vs adjunto previo (${diff3a.length} rutas divergentes) ===`);
  for (const d of diff3a) console.log(`  ${d.path} :: tu-run=${JSON.stringify(d.left)} | adjunto=${JSON.stringify(d.right)}`);
  console.log(`--- TAREA 3a veredicto (hipotesis: ninguna divergencia): byteIdentico=${diff3a.length === 0} ---`);
}

// ─── TAREA 3b: materializePlan, decisionLog — datos literales ─────────────
report.tarea3b_decisionLog = null;
{
  const mpRun1 = results.materializePlan.runs[0];
  if (mpRun1.ok && mpRun1.value && Array.isArray(mpRun1.value.decisionLog)) {
    const dl = mpRun1.value.decisionLog;
    const length = dl.length;

    const undefinedEntries = (dumps.materializePlan.dump1.nonSerializable || [])
      .filter((ns) => ns.kind === 'undefined' && ns.path.startsWith('materializePlan.decisionLog['))
      .map((ns) => ns.path);

    const keySetGroups = new Map();
    dl.forEach((el, i) => {
      const keys = Object.keys(el);
      const signature = JSON.stringify(keys);
      if (!keySetGroups.has(signature)) keySetGroups.set(signature, { keys, indices: [] });
      keySetGroups.get(signature).indices.push(i);
    });
    const grupos = [...keySetGroups.values()].map((g) => ({ claves: g.keys, cuenta: g.indices.length, indices: g.indices }));

    report.tarea3b_decisionLog = { length, undefinedEntries, keySetGroups: grupos };

    console.log(`\n=== TAREA 3b: materializePlan.decisionLog — datos literales ===`);
    console.log(`--- longitud exacta: ${length} ---`);
    console.log(`--- rutas con valor undefined (${undefinedEntries.length}) ---`);
    for (const p of undefinedEntries) console.log(`  ${p}`);
    console.log(`--- conjuntos de claves distintos entre elementos (${grupos.length}) ---`);
    for (const g of grupos) console.log(`  [${g.claves.join(', ')}] :: ${g.cuenta} elemento(s), indices=${JSON.stringify(g.indices)}`);
  } else {
    console.log('\n=== TAREA 3b: omitida (materializePlan run1 no disponible o sin decisionLog) ===');
  }
}

const summaryFile = path.join(OUT_DIR, 'r0-summary.json');
writeFileSync(summaryFile, JSON.stringify(report, null, 2), 'utf8');
console.log(`\n=== resumen escrito en ${path.relative(process.cwd(), summaryFile)} ===`);
