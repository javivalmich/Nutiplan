// planReader — lectura robusta del objeto `plan` (contrato de shape entre
// motores, CLAUDE.md). No decide nada: solo identifica qué partes del plan
// son legibles para las sub-métricas de humanScore.
//
// Un meal es "legible" (decisión Fase 0.5, punto 5) cuando su _spec viene en
// el formato de combo {P,C,V,S,cookM,tmpl,density,...}. Desayuno, comida
// libre y meals freeForm v3.1 (_spec con shape {identity,nutrition,...} y
// freeForm:true) NO son legibles para estas sub-métricas — se reflejan como
// tal, nunca se lanza error ni se cuentan en silencio.

export function isLegibleMeal(meal) {
  return !!(meal && meal._spec && typeof meal._spec.tmpl === 'string' && meal._spec.freeForm !== true);
}

// "Comida" y "Cena" se identifican por meal.time (no por índice del array:
// el índice varía según mealsPerDay). Ver buildPlan.js — meals.find(m =>
// m.time === "Cena") es el mismo patrón usado en el motor.
export function getMainMeals(day) {
  const meals = (day && day.meals) || [];
  return meals.filter((m) => m && (m.time === 'Comida' || m.time === 'Cena'));
}

/**
 * Recorre plan.days y devuelve solo las comidas+cenas legibles, junto con su
 * ubicación temporal (día + comida/cena) para construir evidencias auditables.
 *
 * @param {object} plan
 * @returns {{day: string, time: string, meal: object}[]}
 */
export function collectLegibleMainMeals(plan) {
  const out = [];
  for (const day of (plan && plan.days) || []) {
    for (const meal of getMainMeals(day)) {
      if (isLegibleMeal(meal)) {
        out.push({ day: day.name, time: meal.time, meal });
      }
    }
  }
  return out;
}
