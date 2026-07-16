// ============================================================
// DIAGNÓSTICO F-E2 — Runner de campaña doble: impacto del eje V2 en la
// métrica headline de variedad de verdura de engine2.
//
// Propósito: medir qué parte de la métrica anclada en
// baseline-variedad-verdura.md (98.6%, moda 4, media 6.47) depende del
// eje V2, comparando dos extracciones de la MISMA secuencia de planes
// generados: BRAZO 1 (control, V+V2 fusionados, idéntico a
// veg_variety_engine2.mjs) vs BRAZO 2 (V-solo, V2 descartado).
//
// RÉPLICA DELIBERADA: este runner duplica (no importa) la lógica de
// parseo de tupla de src/engine2/dishes/compositionResolver.js
// (parseScaffoldTuple, línea 128 @ fd1dbc0) y el andamiaje de campaña de
// docs/evidence/variedad-verdura/veg_variety_engine2.mjs @ fd1dbc0.
//
// ADVERTENCIA: cualquier modificación del parseo canónico en
// compositionResolver.js obliga a revisar esta copia antes de
// reutilizar la campaña — la deriva debe ser auditable, no silenciosa.
//
// Evidencia de diagnóstico, NO test: no fija un comportamiento esperado
// que deba mantenerse (solo BRAZO 1 tiene gate contra la baseline
// anclada; BRAZO 2 y la comparación son el resultado, no una
// expectativa). Fuera de cualquier carpeta tests/, sin describe/it: el
// nombre de fichero no matchea el patrón por defecto del test runner
// (*.{test,spec}.*, ver vite.config.js — sin include propio).
// Independiente del runner legacy: NO importa nada de src/engine/**.
// Ejecutable: node docs/evidence/variedad-verdura/veg_variety_engine2_v2diag.mjs
// ============================================================

import { buildWeekArc } from '../../../src/engine2/skeleton/buildWeekArc.js';
import { runWalk } from '../../../src/engine2/walk/runWalk.js';
import { loadCatalog } from '../../../src/engine2/dishes/loadCatalog.js';
import { resolveDishComposition } from '../../../src/engine2/dishes/compositionResolver.js';

// PROFILE verbatim del runner de control (veg_variety_engine2.mjs) —
// misma campaña, mismo perfil.
const PROFILE = {
  weight:       74,
  goal:         'maintain',
  activity:     'moderate',
  intolerances: [],
  trainingDays: [],
  extras:       {},
  mealsPerDay:  3,
  tiempoCocina: 'normal',
  experiencia:  'intermedio',
  simpleMode:   false,
  dob:          '1990-01-01',
  gender:       'male',
  height:       178,
};

// Baseline anclada en baseline-variedad-verdura.md, sección 4 (ENGINE2
// PRINCIPAL). BRAZO 1 de este runner debe reproducirla EXACTAMENTE.
const EXPECTED_BRAZO1 = {
  pctMax3: '98.6%',
  hist: { 1: 0, 2: 7, 3: 208, 4: 222, '5+': 63 },
  meanDistinct: '6.47',
  vocabSize: 17,
};

// ─── Réplica deliberada de compositionResolver.js:128-138 ─────────────
// Necesaria para leer tupla.V en aislamiento (BRAZO 2) sin pasar por
// resolveDishComposition, que fusiona V+V2 en compositionResolver.js:218
// antes de exponer valorEfectivo (hallazgo R-0 F-E2, bloque 3.2: la
// procedencia de eje se destruye en ese punto, no llega al extractor).
function parseScaffoldTupleV2Diag(id) {
  let parsed;
  try {
    parsed = JSON.parse(id);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length !== 7) return null;
  const [tmpl, P, C, V, V2, S, cookM] = parsed;
  return { tmpl, P, C, V, V2, S, cookM };
}

// ─── Métrica compartida (idéntica a veg_variety_engine2.mjs) ──────────
function computeWeekMetric(observations) {
  const daysByVeg = new Map();
  for (const { v, day } of observations) {
    if (!daysByVeg.has(v)) daysByVeg.set(v, new Set());
    daysByVeg.get(v).add(day);
  }
  let maxVegDays = 0;
  daysByVeg.forEach((days) => { if (days.size > maxVegDays) maxVegDays = days.size; });
  return { maxVegDays, distinctVegs: daysByVeg.size };
}

function pct(n, total) { return total ? (n / total * 100).toFixed(1) + '%' : '-'; }

function moda(hist) {
  let best = null;
  let bestCount = -1;
  for (const k of ['1', '2', '3', '4', '5+']) {
    if (hist[k] > bestCount) { bestCount = hist[k]; best = k; }
  }
  return best;
}

function runCampaign(weeksObservations) {
  const N = weeksObservations.length;
  let weeksWithMax3 = 0;
  const hist = { 1: 0, 2: 0, 3: 0, 4: 0, '5+': 0 };
  let sumDistinct = 0;
  const vocabulary = new Set();
  const perWeek = [];

  for (const obs of weeksObservations) {
    const { maxVegDays, distinctVegs } = computeWeekMetric(obs);
    if (maxVegDays >= 3) weeksWithMax3++;
    const bucket = maxVegDays >= 5 ? '5+' : (maxVegDays === 0 ? 1 : maxVegDays);
    hist[bucket] = (hist[bucket] || 0) + 1;
    sumDistinct += distinctVegs;
    obs.forEach(({ v }) => vocabulary.add(v));
    perWeek.push({ maxVegDays, distinctVegs });
  }

  return {
    pctMax3: pct(weeksWithMax3, N),
    weeksWithMax3,
    N,
    hist,
    meanDistinct: (sumDistinct / N).toFixed(2),
    vocabSize: vocabulary.size,
    perWeek,
  };
}
// ─────────────────────────────────────────────────────────────────────

// ─── Agrupación de slots por día (idéntica a veg_variety_engine2.mjs,
// factorizada porque AMBOS brazos la necesitan sobre la MISMA secuencia
// de slots — no es una divergencia de lógica, es la misma agrupación
// leída dos veces) ──────────────────────────────────────────────────
function groupSlotsByDay(slots) {
  const days = [];
  let current = null;
  for (const slot of slots) {
    if (!current || current.day !== slot.day) {
      current = { day: slot.day, libre: false, comida: null, cena: null };
      days.push(current);
    }
    if (slot.fixedRole === 'libre') current.libre = true;
    current[slot.momento] = slot;
  }
  return days;
}

// BRAZO 1 (control): réplica exacta de collectWeekObservations en
// veg_variety_engine2.mjs:86-118 — V+V2 fusionados vía
// resolveDishComposition/vista.verdura.valorEfectivo.
function collectWeekObservationsBrazo1(slots, catalog) {
  const days = groupSlotsByDay(slots);
  const observations = [];
  let dayIndex = 0;
  for (const day of days) {
    if (day.libre) continue;
    for (const slot of [day.comida, day.cena]) {
      if (!slot || !slot.dishId) {
        throw new Error(`v2diag brazo1: hueco sin dishId en ${day.day}/${slot ? slot.momento : '?'} (walk incompleto)`);
      }
      const dish = catalog.find((d) => d.id === slot.dishId);
      const vista = resolveDishComposition(dish, {});
      if (vista.origen === 'freeform') continue;
      if (vista.verdura.origen === 'desconocida') continue;
      for (const v of vista.verdura.valorEfectivo) {
        observations.push({ v, day: dayIndex });
      }
    }
    dayIndex++;
  }
  return observations;
}

// BRAZO 2 (V-solo): MISMOS criterios de inclusión/exclusión que BRAZO 1
// (vista.origen / vista.verdura.origen vía resolveDishComposition, para
// que ambos brazos excluyan exactamente el mismo conjunto de huecos) —
// pero el VALOR de verdura sale de tupla.V leída directamente
// (parseScaffoldTupleV2Diag), no de valorEfectivo (ya fusionado con V2).
// V2 se descarta. Los freeform no llegan a este punto para ningún
// brazo (excluidos arriba) — no tienen V2 por construcción
// (compositionResolver.js:256), así que no cambian entre brazos.
function collectWeekObservationsBrazo2(slots, catalog) {
  const days = groupSlotsByDay(slots);
  const observations = [];
  let dayIndex = 0;
  for (const day of days) {
    if (day.libre) continue;
    for (const slot of [day.comida, day.cena]) {
      if (!slot || !slot.dishId) {
        throw new Error(`v2diag brazo2: hueco sin dishId en ${day.day}/${slot ? slot.momento : '?'} (walk incompleto)`);
      }
      const dish = catalog.find((d) => d.id === slot.dishId);
      const vista = resolveDishComposition(dish, {});
      if (vista.origen === 'freeform') continue;
      if (vista.verdura.origen === 'desconocida') continue;
      const tupla = parseScaffoldTupleV2Diag(dish.id);
      if (!tupla) {
        throw new Error(`v2diag brazo2: plato scaffold "${dish.id}" no parseó como tupla (inconsistencia con vista.origen === 'scaffold').`);
      }
      if (tupla.V !== null) observations.push({ v: tupla.V, day: dayIndex });
    }
    dayIndex++;
  }
  return observations;
}
// ─────────────────────────────────────────────────────────────────────

function runWeek(seed, catalog) {
  const { weekArc } = buildWeekArc({ profile: PROFILE, seed, strategy: 'x' });
  const { slots } = runWalk({ weekArc, catalog, seed, profile: PROFILE });
  return {
    brazo1: collectWeekObservationsBrazo1(slots, catalog),
    brazo2: collectWeekObservationsBrazo2(slots, catalog),
  };
}

function runFullCampaign(catalog) {
  const N = 500;
  const weeksBrazo1 = [];
  const weeksBrazo2 = [];
  for (let i = 0; i < N; i++) {
    const { brazo1, brazo2 } = runWeek(i + 1, catalog);
    weeksBrazo1.push(brazo1);
    weeksBrazo2.push(brazo2);
  }
  return {
    brazo1: runCampaign(weeksBrazo1),
    brazo2: runCampaign(weeksBrazo2),
  };
}

// ─── Comparación apareada por semana/semilla ───────────────────────────
function computeComparison(brazo1PerWeek, brazo2PerWeek) {
  const N = brazo1PerWeek.length;
  let weeksLostMax3 = 0;
  let weeksMaxDiffers = 0;
  const maxDeltaHist = {};
  let weeksAffectedAnyDegree = 0;

  for (let i = 0; i < N; i++) {
    const b1 = brazo1PerWeek[i];
    const b2 = brazo2PerWeek[i];
    if (b1.maxVegDays >= 3 && b2.maxVegDays < 3) weeksLostMax3++;
    if (b1.maxVegDays !== b2.maxVegDays) {
      weeksMaxDiffers++;
      const delta = b1.maxVegDays - b2.maxVegDays;
      maxDeltaHist[delta] = (maxDeltaHist[delta] || 0) + 1;
    }
    if (b1.maxVegDays !== b2.maxVegDays || b1.distinctVegs !== b2.distinctVegs) {
      weeksAffectedAnyDegree++;
    }
  }

  return {
    N,
    weeksLostMax3,
    pctWeeksLostMax3: pct(weeksLostMax3, N),
    weeksMaxDiffers,
    maxDeltaHist,
    weeksAffectedAnyDegree,
    pctWeeksAffectedAnyDegree: pct(weeksAffectedAnyDegree, N),
  };
}

function histEquals(a, b) {
  return ['1', '2', '3', '4', '5+'].every((k) => a[k] === b[k]);
}

// ─── Ejecución ──────────────────────────────────────────────────────
const catalog = loadCatalog();

const run1 = runFullCampaign(catalog);
const run2 = runFullCampaign(catalog);

const deterministic = JSON.stringify(run1) === JSON.stringify(run2);

console.log('\n=== F-E2 DIAGNÓSTICO V2 — engine2 (N=500) ===');

console.log('\n--- BRAZO 1 (control, V+V2 fusionados) ---');
console.log('% semanas maxVegDays>=3:', run1.brazo1.pctMax3);
console.log('Histograma maxVegDays:', JSON.stringify(run1.brazo1.hist));
console.log('Moda:', moda(run1.brazo1.hist));
console.log('Identidades distintas/semana (media):', run1.brazo1.meanDistinct);
console.log('Vocabulario observado:', run1.brazo1.vocabSize);

console.log('\n--- BRAZO 2 (V-solo, V2 descartado) ---');
console.log('% semanas maxVegDays>=3:', run1.brazo2.pctMax3);
console.log('Histograma maxVegDays:', JSON.stringify(run1.brazo2.hist));
console.log('Moda:', moda(run1.brazo2.hist));
console.log('Identidades distintas/semana (media):', run1.brazo2.meanDistinct);
console.log('Vocabulario observado:', run1.brazo2.vocabSize);

const cmp = computeComparison(run1.brazo1.perWeek, run1.brazo2.perWeek);

console.log('\n--- COMPARACIÓN (apareada por semana/semilla) ---');
console.log('(a) RESPUESTA OFICIAL — semanas que pierden maxVegDays>=3 al descartar V2:', cmp.weeksLostMax3, '/', cmp.N, `(${cmp.pctWeeksLostMax3})`);
console.log('(b) Moda por brazo — control:', moda(run1.brazo1.hist), '| V-solo:', moda(run1.brazo2.hist));
console.log('(c) Semanas donde el máximo semanal difiere:', cmp.weeksMaxDiffers, '| histograma del delta (control - V-solo):', JSON.stringify(cmp.maxDeltaHist));
console.log('(d) % agregado — control:', run1.brazo1.pctMax3, '| V-solo:', run1.brazo2.pctMax3);
console.log('(e) Semanas afectadas en cualquier grado (max o distintas difieren):', cmp.weeksAffectedAnyDegree, '/', cmp.N, `(${cmp.pctWeeksAffectedAnyDegree})`);

console.log('\n=== DETERMINISMO (doble corrida completa, ambos brazos) ===');
console.log('run1 === run2:', deterministic);

const gateOk =
  run1.brazo1.pctMax3 === EXPECTED_BRAZO1.pctMax3 &&
  histEquals(run1.brazo1.hist, EXPECTED_BRAZO1.hist) &&
  run1.brazo1.meanDistinct === EXPECTED_BRAZO1.meanDistinct &&
  run1.brazo1.vocabSize === EXPECTED_BRAZO1.vocabSize;

console.log('\n=== GATE DE VALIDEZ (BRAZO 1 vs baseline anclada, sección 4 del .md) ===');
console.log('Esperado:', JSON.stringify(EXPECTED_BRAZO1));
console.log('Observado:', JSON.stringify({
  pctMax3: run1.brazo1.pctMax3,
  hist: run1.brazo1.hist,
  meanDistinct: run1.brazo1.meanDistinct,
  vocabSize: run1.brazo1.vocabSize,
}));
console.log('Gate control OK:', gateOk);

if (!gateOk) {
  console.error('\nERROR: BRAZO 1 no reproduce la baseline anclada — diagnóstico INVÁLIDO.');
}
if (!deterministic) {
  console.error('\nERROR: la campaña no es determinista entre corridas completas.');
}
if (!gateOk || !deterministic) {
  process.exit(1);
}
