// ============================================================
// GATE 4 — weeklyVegCount: penalización cross-semana por verdura repetida
//
// Seed S=1: en el código baseline (pre-GATE4), la verdura primaria
// "tomate" aparece en 4 días distintos de la semana (lunch+dinner,
// excluyendo el día "libre"):
//   lunchVegs  ANTES: ["puerro","tomate","pepino","pimientos","tomate","tomate"]
//   dinnerVegs ANTES: ["calabacin","pimientos","pimientos","tomate","calabacin","lechuga"]
//   Frecuencia máxima ANTES: tomate = 4 días
//
// Tras la penalización cross-semana (weeklyVegCount, STEP=3), para esta
// misma seed la frecuencia máxima de cualquier verdura primaria queda
// en 2 días (medido), por debajo del baseline (4). Se exige <= 2.
//
// Esto es una mejora determinista conocida para esta seed concreta —
// NO una garantía global de que ninguna verdura supere CAP=2 en
// cualquier semana (la penalización es blanda).
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { buildPlan } from '../buildPlan.js';

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
    { ...BASE_OPTS_NO_FF, saveMealMemory: vi.fn(), rng: mulberry32(seed) },
  );
}

function getMeal(day, timeLabel) {
  return (day.meals || []).find(m => m && m.time === timeLabel) || null;
}

function vegKey(meal) {
  if (!meal || !meal._spec) return 'none';
  const spec = meal._spec;
  if (spec.isFree === true) return 'libre';
  if (spec.freeForm === true) return 'freeform';
  return (typeof spec.V === 'string' && spec.V) ? spec.V : 'none';
}

describe('GATE 4 — weeklyVegCount: penalización cross-semana de verdura', () => {
  it('seed=1: la frecuencia máxima de verdura primaria decrece y es <=2', () => {
    const SEED = 1;

    const r = run(SEED);

    const lunchVegs = [];
    const dinnerVegs = [];
    r.days.forEach(day => {
      if (day.special === 'libre') return;
      lunchVegs.push(vegKey(getMeal(day, 'Comida')));
      dinnerVegs.push(vegKey(getMeal(day, 'Cena')));
    });

    const allVegs = [...lunchVegs, ...dinnerVegs];
    const realVegs = new Set(allVegs.filter(v => v !== 'none' && v !== 'freeform' && v !== 'libre'));

    let maxFreq = 0;
    realVegs.forEach(vk => {
      const daysSet = new Set();
      lunchVegs.forEach((v, d) => { if (v === vk) daysSet.add(d); });
      dinnerVegs.forEach((v, d) => { if (v === vk) daysSet.add(d); });
      if (daysSet.size > maxFreq) maxFreq = daysSet.size;
    });

    expect(maxFreq).toBeLessThanOrEqual(2);
  });
});
