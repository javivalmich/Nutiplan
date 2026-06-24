// Fase 1, Checkpoint 4 — medición de inflación fantasma de "ave" causada por
// BUG 3 (ya corregido y commiteado). NO modifica el motor. Lee el estado
// ACTUAL (post-BUG3) de las 9 fixtures del baseline vía qaTrace, y deriva
// analíticamente el valor "pre-BUG3" sin revertir el código:
//
//   pre = post + (nº de cenas de entreno cuya proteína real es TERNERA)
//
// porque antes del fix, toda cena de entreno (sea pollo/ternera/pavo) se
// registraba como "pollo" → familia "ave". Solo la ternera cruzaba de
// familia (vacuno→ave fantasma); pollo y pavo ya pertenecen a "ave", así
// que para esos dos casos el registro fantasma coincidía con la familia
// real (sin delta).

import { buildPlan } from '../../../src/engine/buildPlan.js';
import { FIXTURES, buildProfile } from '../../../src/engine/tests/baselineFixtures.js';

const TARGET_KCAL = 2000;

function run(fixture) {
  return buildPlan(buildProfile(fixture.profile), TARGET_KCAL, {
    month: 5,
    weekNumber: fixture.weekNumber,
    userId: fixture.userId,
    pastProteins: {},
    freeFormPool: [],
    saveMealMemory: () => {},
    qaTrace: true,
  });
}

console.log('Fixture'.padEnd(55), 'Ave pre-BUG3'.padEnd(14), 'Ave post-BUG3'.padEnd(15), 'Delta (cenas ternera)');

FIXTURES.forEach((fixture) => {
  const result = run(fixture);
  const post = result.qaTrace.weekValidation.weeklyProteinCount.ave || 0;

  // Cenas de entreno reales cuya proteína es ternera (familia "vacuno").
  const ternerasEntreno = result.days.filter((d) => d.special === 'entrenamiento')
    .map((d) => d.meals.find((m) => m.time === 'Cena'))
    .filter((dinner) => dinner && dinner._spec && dinner._spec.P === 'ternera')
    .length;

  const pre = post + ternerasEntreno;

  console.log(
    fixture.name.padEnd(55),
    String(pre).padEnd(14),
    String(post).padEnd(15),
    String(ternerasEntreno),
  );
});
