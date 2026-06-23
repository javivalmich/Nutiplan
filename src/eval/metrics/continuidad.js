// continuidadEntrenoHidrato (Paso 5, Fase 0.5).
//
// Observable real: day.special === "entrenamiento" se asigna en
// src/engine/buildPlan.js:2502 (`isTrain(day)?"entrenamiento":null`, isTrain
// definido en buildPlan.js:84 como `trainingDays.includes(d)`). En esos días
// la cena sale de TRAINING_DINNERS (buildPlan.js:1149-1159, p.ej.
// `{tmpl:"caliente_clasico", P:"pollo", C:"arroz", ...}`), que se compone
// con composeMeal igual que cualquier combo legacy — por eso cena._spec.C
// (el hidrato) queda disponible tal cual en el _spec resultante
// (buildPlan.js:695 `_spec:spec`). No se infiere nada: se lee el campo C
// directamente.
//
// Continuidad = ¿la cena de un día de entrenamiento incluye hidrato
// (_spec.C truthy)? Solo se evalúa si la cena es legible; si no, el día
// queda excluido (status:"unknown" puntual), sin inventar clasificación.

import { getMainMeals, isLegibleMeal } from '../planReader.js';

export function computeContinuidadEntrenoHidrato(plan) {
  const days = (plan && plan.days) || [];
  const trainingDays = days.filter((d) => d.special === 'entrenamiento');

  if (trainingDays.length === 0) {
    return {
      valor: null,
      status: 'computed',
      polarity: 'higher_is_better',
      evidencias: ['No hay días con day.special === "entrenamiento" en este plan.'],
    };
  }

  const detalle = trainingDays.map((day) => {
    const cena = getMainMeals(day).find((m) => m.time === 'Cena');
    if (!cena || !isLegibleMeal(cena)) {
      return { day: day.name, status: 'unknown', tieneHidrato: null, carb: null };
    }
    return { day: day.name, status: 'computed', tieneHidrato: !!cena._spec.C, carb: cena._spec.C || null };
  });

  const computados = detalle.filter((d) => d.status === 'computed');
  const conHidrato = computados.filter((d) => d.tieneHidrato).length;

  const evidencias = detalle.map((d) =>
    d.status === 'computed'
      ? `${d.day} (entrenamiento) → cena ${d.tieneHidrato ? `con hidrato (${d.carb})` : 'sin hidrato (_spec.C ausente)'}`
      : `${d.day} (entrenamiento) → cena no legible, excluido de la comparación`
  );

  return {
    valor: { diasEntrenamiento: trainingDays.length, conHidrato, deTotalComputados: computados.length, detalle },
    status: 'computed',
    polarity: 'higher_is_better',
    evidencias,
  };
}
