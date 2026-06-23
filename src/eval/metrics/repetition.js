// Sub-métricas de repetición (Paso 3, Fase 0.5): salsa (_spec.S) y técnica
// de cocción (_spec.cookM). Solo operan sobre comida+cena legibles
// (planReader.collectLegibleMainMeals) — desayuno, libre y freeForm v3.1 no
// participan, sin lanzar error.
//
// Umbral de "repetición destacada" (>=3 apariciones/semana) es PROVISIONAL,
// a recalibrar.

import { collectLegibleMainMeals } from '../planReader.js';

const DESTACADA_THRESHOLD = 3;

function buildRepetitionMetric(plan, field) {
  const occurrences = new Map(); // valor del campo -> [{day, time}]

  for (const { day, time, meal } of collectLegibleMainMeals(plan)) {
    const value = meal._spec[field];
    if (!value) continue;
    if (!occurrences.has(value)) occurrences.set(value, []);
    occurrences.get(value).push({ day, time });
  }

  const entries = [...occurrences.entries()]
    .map(([value, ocurrencias]) => ({ value, count: ocurrencias.length, ocurrencias }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  const conteos = {};
  for (const e of entries) conteos[e.value] = e.count;

  const evidencias = entries
    .filter((e) => e.count >= 2)
    .map((e) => {
      const ubicaciones = e.ocurrencias.map((o) => `${o.day.toLowerCase()} ${o.time.toLowerCase()}`).join(', ');
      return `${e.value} aparece ${e.count} veces: ${ubicaciones}`;
    });

  const repeticionesDestacadas = entries
    .filter((e) => e.count >= DESTACADA_THRESHOLD)
    .map((e) => ({ value: e.value, count: e.count }));

  return {
    valor: { conteos, repeticionesDestacadas, umbralDestacadaProvisional: DESTACADA_THRESHOLD },
    status: 'computed',
    polarity: 'lower_is_better',
    evidencias,
  };
}

export function computeRepeticionSalsa(plan) {
  return buildRepetitionMetric(plan, 'S');
}

export function computeRepeticionTecnica(plan) {
  return buildRepetitionMetric(plan, 'cookM');
}
