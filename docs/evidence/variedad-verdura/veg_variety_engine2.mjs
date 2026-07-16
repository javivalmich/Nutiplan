// ============================================================
// MEDICIÓN M-1 — Línea base PRINCIPAL: engine2, variedad de verdura
// Evidencia versionada y regenerable (NO test: una línea base que se espera
// que cambie cuando se construya el mecanismo de variedad) — ver
// docs/evidence/variedad-verdura/baseline-variedad-verdura.md para el
// contrato de reproducción y los resultados anclados.
// Ejecutable: node docs/evidence/variedad-verdura/veg_variety_engine2.mjs
// Independiente del runner legacy: NO importa nada de src/engine/**.
// ============================================================

import { buildWeekArc } from '../../../src/engine2/skeleton/buildWeekArc.js';
import { runWalk } from '../../../src/engine2/walk/runWalk.js';
import { loadCatalog } from '../../../src/engine2/dishes/loadCatalog.js';
import { resolveDishComposition } from '../../../src/engine2/dishes/compositionResolver.js';

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// PROFILE verbatim del gate legacy (analysis/gate4_veg_baseline.test.js:20-34).
// M-0 confirmó: engine2 solo lee trainingDays e intolerances en este camino;
// ambos están presentes aquí.
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

// ─── Métrica compartida (LITERALMENTE la misma función que en el runner
// legacy — solo el extractor difiere entre ficheros) ───────────────────
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

function runCampaign(weeksObservations) {
  const N = weeksObservations.length;
  let weeksWithMax3 = 0;
  const hist = { 1: 0, 2: 0, 3: 0, 4: 0, '5+': 0 };
  let sumDistinct = 0;
  const vocabulary = new Set();

  for (const obs of weeksObservations) {
    const { maxVegDays, distinctVegs } = computeWeekMetric(obs);
    if (maxVegDays >= 3) weeksWithMax3++;
    const bucket = maxVegDays >= 5 ? '5+' : (maxVegDays === 0 ? 1 : maxVegDays);
    hist[bucket] = (hist[bucket] || 0) + 1;
    sumDistinct += distinctVegs;
    obs.forEach(({ v }) => vocabulary.add(v));
  }

  return {
    pctMax3: pct(weeksWithMax3, N),
    hist,
    meanDistinct: (sumDistinct / N).toFixed(2),
    vocabSize: vocabulary.size,
  };
}
// ─────────────────────────────────────────────────────────────────────

// ─── Extractor engine2 (M-0/M-1 confirmado por archivo:línea) ─────────
function collectWeekObservations(slots, catalog) {
  // Agrupa slots (ya ordenados DAYS_ORDER x MOMENTOS por runWalk) por día.
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

  const observations = [];
  let dayIndex = 0;
  for (const day of days) {
    if (day.libre) continue; // día NO libre únicamente
    for (const slot of [day.comida, day.cena]) {
      if (!slot || !slot.dishId) {
        throw new Error(`veg_variety_engine2: hueco sin dishId en ${day.day}/${slot ? slot.momento : '?'} (walk incompleto)`);
      }
      const dish = catalog.find((d) => d.id === slot.dishId);
      const vista = resolveDishComposition(dish, {});
      if (vista.origen === 'freeform') continue; // bucket excluido
      if (vista.verdura.origen === 'desconocida') continue; // bucket excluido (guard obligatorio: NO llamar a ejesVerdura)
      for (const v of vista.verdura.valorEfectivo) {
        observations.push({ v, day: dayIndex });
      }
    }
    dayIndex++;
  }
  return observations;
}
// ─────────────────────────────────────────────────────────────────────

function runWeek(seed, catalog) {
  const { weekArc } = buildWeekArc({ profile: PROFILE, seed, strategy: 'x' });
  const { slots } = runWalk({ weekArc, catalog, seed, profile: PROFILE });
  return collectWeekObservations(slots, catalog);
}

function runFullCampaign(catalog) {
  const N = 500;
  const weeksObservations = [];
  for (let i = 0; i < N; i++) {
    weeksObservations.push(runWeek(i + 1, catalog));
  }
  return runCampaign(weeksObservations);
}

const catalog = loadCatalog();

const t0 = Date.now();
const run1 = runFullCampaign(catalog);
const t1 = Date.now();
const run2 = runFullCampaign(catalog);
const t2 = Date.now();

console.log('\n=== MEDICIÓN M-1 — engine2 PRINCIPAL (N=500) — CORRIDA 1 ===');
console.log('% semanas maxVegDays>=3:', run1.pctMax3);
console.log('Histograma maxVegDays:', JSON.stringify(run1.hist));
console.log('Identidades verdura distintas/semana (media):', run1.meanDistinct);
console.log('Vocabulario de verdura observado (tamaño):', run1.vocabSize);
console.log('Tiempo:', (t1 - t0) + 'ms');

console.log('\n=== MEDICIÓN M-1 — engine2 PRINCIPAL (N=500) — CORRIDA 2 (determinismo) ===');
console.log('% semanas maxVegDays>=3:', run2.pctMax3);
console.log('Histograma maxVegDays:', JSON.stringify(run2.hist));
console.log('Identidades verdura distintas/semana (media):', run2.meanDistinct);
console.log('Vocabulario de verdura observado (tamaño):', run2.vocabSize);
console.log('Tiempo:', (t2 - t1) + 'ms');

const deterministic = JSON.stringify(run1) === JSON.stringify(run2);
console.log('\n=== DETERMINISMO ===');
console.log('run1 === run2:', deterministic);

if (!deterministic) {
  console.error('ERROR: la campaña engine2 no es determinista entre corridas.');
  process.exit(1);
}
