// Revisión independiente, arreglo 1 (Javi, 2026-11-16): en perfiles con sorteo de días de legumbre (omnívoros con
// compuestos de legumbre en el catálogo), ninguna alternativa de una comida puede ser un compuesto de legumbre como
// plato único (D-116.1), sea doble o no la comida que se cambia. En vegetariana y vegana la regla no se aplica.
import { describe, it, expect } from 'vitest';
import { generarPlan, platosRecientesPara, regenerarComida } from '../generarPlan.js';
import { esCompuestoLegumbre } from '../../engine2/dishes/bases.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const H74 = { ...BASE, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] };
const M62 = { ...BASE, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const opts = (userId, w) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId, saveMealMemory: () => {} });

function alternativas(perfil, kcal, userId, semanas) {
  const out = [];
  let ant = null;
  for (let w = 60; w < 60 + semanas; w++) {
    const plan = generarPlan(clonar(perfil), kcal, { ...opts(userId, w), platosRecientes: platosRecientesPara(ant, w - 1, w) });
    ant = plan;
    plan.days.forEach((d, i) => {
      const m = d.meals.find((x) => x && x.time === 'Comida');
      if (!m || m.sugerencia || m._motor !== 'engine2' || m._dishId2) return;
      for (const deseo of ['comfort', 'diferente']) {
        const n = regenerarComida(plan, i, 'Comida', deseo, clonar(perfil), kcal, opts(userId, w));
        if (!n || n.alternativaSinCambio) continue;
        out.push({ nueva: n.days[i].meals.find((x) => x && x.time === 'Comida'), log: n.decisionLog.filter((e) => e.deseo === deseo && typeof e.causa === 'string' && e.causa.startsWith('alternativa')) });
      }
    });
  }
  return out;
}

describe('alternativas sin compuesto de legumbre como plato único', { timeout: 300000 }, () => {
  it('omnívoro: cambiar una comida de plato único nunca da un compuesto de legumbre, y lo dice el log', () => {
    const alts = alternativas(H74, 2174, 'banco-omni-2174', 8);
    expect(alts.length).toBeGreaterThan(30);
    expect(alts.filter((a) => esCompuestoLegumbre({ id: a.nueva._dishId })).map((a) => a.nueva.title)).toEqual([]);
    expect(alts.every((a) => a.log.some((e) => e.causa === 'alternativa_sin_legumbre_compuesta'))).toBe(true);
  });

  it('vegetariana: no hay sorteo de días y la regla no se aplica', () => {
    const alts = alternativas({ ...M62, dieta: 'vegetariana' }, 2000, 'banco-vegetariana-2000', 3);
    expect(alts.length).toBeGreaterThan(10);
    expect(alts.some((a) => a.log.some((e) => e.causa === 'alternativa_sin_legumbre_compuesta'))).toBe(false);
  });
});
