// El segundo de la comida de legumbre (D-116) se come: cuenta para no repetir plato la semana
// siguiente (D-099.3.d). La semana siguiente recibe platosSemana, y el segundo tiene que ir dentro.
// Paso 1 de la etapa 2 (scripts/banco/medicion/estructura-comida.md, sección 12).

import { describe, it, expect } from 'vitest';
import { generarPlan as generarPlanSinInterruptor, platosRecientesPara } from '../generarPlan.js';
import { metaEngine2 } from '../engine2App.js';
import { catalogoApp } from '../catalogo.js';
import { nombreVisible } from '../../engine2/dishes/alinosD105.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
// Paso 8: la regla de D-116 y D-117 está apagada por defecto (interruptor reglaLegumbre).
// Estos tests prueban su código, así que la encienden.
const generarPlan = (a0, a1, opts = {}) => generarPlanSinInterruptor(a0, a1, { reglaLegumbre: true, ...opts });

const P = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] };
const O = (w, recientes) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: 'segundo-semana', saveMealMemory: () => {}, platosRecientes: recientes });
const nombre = new Map(catalogoApp().map((d) => [d.id, nombreVisible(d.nombre)]));
const segundosDe = (plan) => (plan.decisionLog || []).filter((e) => e.causa === 'segundo_de_legumbre').map((e) => e.plato);
const servidosDe = (plan) => [
  ...plan.days.flatMap((d) => (d.meals || []).filter((m) => m && (m.time === 'Comida' || m.time === 'Cena') && !m.sugerencia && m._dishId).map((m) => m._dishId)),
  ...segundosDe(plan),
];

describe('platosSemana: el segundo cuenta para no repetir la semana siguiente', () => {
  const semanas = [];
  let ant = null;
  for (let w = 60; w < 66; w++) {
    const plan = generarPlan({ ...P }, 2000, O(w, platosRecientesPara(ant, w - 1, w)));
    semanas.push(plan);
    ant = plan;
  }

  it('hay semanas con segundos (el caso existe)', () => {
    expect(semanas.every((p) => p.motor !== 'legacy')).toBe(true);
    expect(semanas.reduce((a, p) => a + segundosDe(p).length, 0)).toBeGreaterThan(10);
  });

  it('el nombre de cada segundo está en platosSemana de su semana', () => {
    for (const plan of semanas) {
      const lista = metaEngine2(plan).platosSemana;
      for (const id of segundosDe(plan)) expect(lista).toContain(nombre.get(id));
    }
  });

  it('ningún segundo de la semana N sale en la semana N+1 (ni de comida, ni de segundo, ni de cena)', () => {
    for (let k = 1; k < semanas.length; k++) {
      const antes = new Set(segundosDe(semanas[k - 1]));
      expect(servidosDe(semanas[k]).filter((id) => antes.has(id))).toEqual([]);
    }
  });
});
