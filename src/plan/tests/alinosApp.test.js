// D-105 en la app: los nombres sin aliños con ajo no tapan las intolerancias.
// El filtro del catálogo (filtrarCatalogo) lee el nombre original y el plato
// compuesto, antes de que se apliquen los nombres visibles.
import { describe, it, expect } from 'vitest';
import { generarPlan } from '../generarPlan.js';
import { ALINOS_CON_AJO, alinoDe } from '../../engine2/dishes/alinosD105.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 5, trainingDays: ['Lunes'] };
const opts = (w) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: 'a', saveMealMemory: () => {}, platosRecientes: [] });
const principales = (plan) => plan.days.flatMap((d) => d.meals.filter((m) => m && m._dishId && (m.time === 'Comida' || m.time === 'Cena')));

describe('aliños en la app (D-105)', { timeout: 120000 }, () => {
  it('los títulos de comida y cena no llevan aliños con ajo', () => {
    for (const w of [41, 42, 43]) {
      const plan = generarPlan(BASE, 2600, opts(w));
      expect(plan.motor).toBe('engine2');
      for (const m of principales(plan)) for (const a of ALINOS_CON_AJO) expect(m.title).not.toContain(a);
    }
  });

  it('con intolerancia al picante no sale ningún plato con ajillo (lleva guindilla)', () => {
    for (const w of [41, 42, 43, 44, 45]) {
      const plan = generarPlan({ ...BASE, intolerances: ['picante'] }, 2600, opts(w));
      expect(plan.motor).toBe('engine2');
      for (const m of principales(plan)) {
        expect(alinoDe({ id: m._dishId }), m.title).not.toBe('ajillo');
        expect(`${m.title} ${m.p1} ${m.p2}`.toLowerCase()).not.toContain('guindilla');
      }
    }
  });
});
