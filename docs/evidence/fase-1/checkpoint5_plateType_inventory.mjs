// Fase 1, Checkpoint 5 — inventario real (BUG 4, Parte 1, paso "ANTES").
// ¿Cuántas comidas de las 9 fixtures del baseline llegan a validateWeek con
// metadata.plateType ya presente, y cuántas caerían al fallback de substring
// si no existiera? No modifica el motor.

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
  });
}

let totalMeals = 0;
let withPlateType = 0;
let withoutPlateType = 0;
const sinPlateType = [];

FIXTURES.forEach((fixture) => {
  const result = run(fixture);
  result.days.forEach((day) => {
    (day.meals || []).filter(Boolean).forEach((meal) => {
      // Replica el filtro de validateWeek: solo cuenta como "rama no-desayuno"
      // (única rama que consulta metadata.plateType) cuando time no es
      // Desayuno/Almuerzo/Merienda.
      if (meal.time === 'Desayuno' || meal.time === 'Almuerzo' || meal.time === 'Merienda') return;
      totalMeals++;
      const pt = meal.metadata && meal.metadata.plateType;
      if (pt) {
        withPlateType++;
      } else {
        withoutPlateType++;
        sinPlateType.push({ fixture: fixture.name, day: day.name, time: meal.time, title: meal.title });
      }
    });
  });
});

console.log('Comidas evaluadas (rama Comida/Cena de validateWeek):', totalMeals);
console.log('  con metadata.plateType presente:', withPlateType);
console.log('  SIN metadata.plateType (caen a substring guessing):', withoutPlateType);
if (sinPlateType.length) {
  console.log('Detalle de las que caen al fallback:');
  sinPlateType.forEach((s) => console.log('  -', JSON.stringify(s)));
}
