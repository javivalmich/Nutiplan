// materializePlan — Frente A/Fase 7. Orquestador de materializacion del
// plan observable (docs/spec/plan-observable.md v1.0, §4). Unica
// responsabilidad: transformar estructuralmente lo que buildWeekArc/runWalk
// ya calculan en el objeto de plan que exige §4. No decide nada culinario
// ni nutricional -- ningun filtro, prioridad ni desempate nuevo.
//
// Resolucion de dishId contra catalogo: no hay funcion exportada
// reutilizable. expandWeekArc.js:38-44 y runWalk.js:116-122 tienen cada
// una su propia funcion `findDish` privada (identica entre si), pero
// ninguna esta exportada -- reimplementarla aqui en vez de tocar esos
// modulos (prohibido por el encargo).

import { buildWeekArc } from './skeleton/buildWeekArc.js';
import { runWalk } from './walk/runWalk.js';
import { DAYS_ORDER } from './skeleton/days.js';
import { MOMENTOS } from './dishes/schema.js';

function findDish(catalog, dishId) {
  const dish = catalog.find((d) => d.id === dishId);
  if (!dish) {
    throw new Error(`materializePlan: plato no encontrado en catalogo, id=${JSON.stringify(dishId)}`);
  }
  return dish;
}

/**
 * Materializa el objeto de plan observable (§4) a partir del flujo
 * existente de engine2. No altera las firmas ni el comportamiento de
 * buildWeekArc/runWalk: los invoca tal cual.
 * @param {{profile: object, seed: (number|string), strategy: string, catalog: ReadonlyArray<object>, fuenteEditorial?: object}} input
 * @returns {{days: object[], strategy: string, weekWarnings: [], weekProblems: [], weekScore: null, decisionLog: object[]}}
 */
export function materializePlan(input) {
  const {
    profile, seed, strategy, catalog, fuenteEditorial,
  } = input;

  const { weekArc, decisionLog: arcLog } = buildWeekArc({
    profile, seed, strategy, fuenteEditorial,
  });
  const { slots, decisionLog: walkLog } = runWalk({
    weekArc, catalog, seed, profile, fuenteEditorial,
  });

  const slotsByKey = new Map(slots.map((s) => [`${s.day}::${s.momento}`, s]));

  const days = DAYS_ORDER.map((day) => ({
    day,
    meals: MOMENTOS.map((momento) => {
      const slot = slotsByKey.get(`${day}::${momento}`);
      return { momento, dish: findDish(catalog, slot.dishId) };
    }),
  }));

  return {
    days,
    strategy: weekArc.strategy,
    weekWarnings: [],
    weekProblems: [],
    weekScore: null,
    decisionLog: [...arcLog, ...walkLog],
  };
}
