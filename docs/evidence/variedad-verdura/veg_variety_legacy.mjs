// ============================================================
// MEDICIÓN M-1 — Línea base REFERENCIA HISTÓRICA: legacy, variedad de verdura
// Evidencia versionada y regenerable (NO test: una línea base que se espera
// que cambie cuando se construya el mecanismo de variedad) — ver
// docs/evidence/variedad-verdura/baseline-variedad-verdura.md para el
// contrato de reproducción y los resultados anclados.
// Ejecutable: node docs/evidence/variedad-verdura/veg_variety_legacy.mjs
// Independiente del runner engine2: NO importa nada de src/engine2/**.
// Ancla de forma reproducible el valor conversacional ~49,8% (no versionado),
// que queda retirado como referencia — ver sección 7 del baseline.
// ============================================================

import { buildPlan } from '../../../src/engine/buildPlan.js';

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
const TARGET_KCAL = 2000;
const BASE_OPTS_NO_FF = {
  month:        5,
  weekNumber:   23,
  pastProteins: {},
  freeFormPool: [],
};

function run(seed) {
  return buildPlan(
    JSON.parse(JSON.stringify(PROFILE)),
    TARGET_KCAL,
    { ...BASE_OPTS_NO_FF, saveMealMemory: () => {}, rng: mulberry32(seed) },
  );
}

// ─── Métrica compartida (LITERALMENTE la misma función que en el runner
// engine2 — solo el extractor difiere entre ficheros) ──────────────────
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

// ─── Extractor legacy: vegKey VERBATIM de analysis/gate4_veg_baseline.test.js ──
function getMeal(day, timeLabel) {
  if (!day.meals) return null;
  return day.meals.find((m) => m && m.time === timeLabel) || null;
}
function vegKey(meal) {
  if (!meal) return 'none';
  const spec = meal._spec;
  if (!spec) return 'none';
  if (spec.isFree === true) return 'libre';
  if (spec.freeForm === true) return 'freeform';
  return (typeof spec.V === 'string' && spec.V) ? spec.V : 'none';
}
// ─────────────────────────────────────────────────────────────────────

function collectWeekObservations(days) {
  const observations = [];
  let dayIndex = 0;
  days.forEach((day) => {
    if (day.special === 'libre') return; // día NO libre únicamente
    const lunch = getMeal(day, 'Comida');
    const dinner = getMeal(day, 'Cena');
    [lunch, dinner].forEach((meal) => {
      const vk = vegKey(meal);
      if (vk === 'none' || vk === 'freeform' || vk === 'libre') return; // buckets excluidos
      observations.push({ v: vk, day: dayIndex });
    });
    dayIndex++;
  });
  return observations;
}

function runFullCampaign() {
  const N = 500;
  const weeksObservations = [];
  for (let i = 0; i < N; i++) {
    const r = run(i + 1);
    weeksObservations.push(collectWeekObservations(r.days));
  }
  return runCampaign(weeksObservations);
}

const t0 = Date.now();
const result = runFullCampaign();
const t1 = Date.now();

console.log('\n=== MEDICIÓN M-1 — legacy REFERENCIA HISTÓRICA (N=500) ===');
console.log('% semanas maxVegDays>=3:', result.pctMax3);
console.log('Histograma maxVegDays:', JSON.stringify(result.hist));
console.log('Identidades verdura distintas/semana (media):', result.meanDistinct);
console.log('Vocabulario de verdura observado (tamaño):', result.vocabSize);
console.log('Tiempo:', (t1 - t0) + 'ms');
