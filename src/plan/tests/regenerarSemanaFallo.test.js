// «Regenerar plan» (D-123): si engine2 falla, el plan guardado no cambia, hay aviso y nunca se llama al motor viejo.
import { describe, it, expect, vi } from 'vitest';

const espias = vi.hoisted(() => ({ buildPlan: vi.fn(), engine2: vi.fn() }));
vi.mock('../../engine/buildPlan.js', async (importOriginal) => {
  const real = await importOriginal();
  espias.buildPlan.mockImplementation(real.buildPlan);
  return { ...real, buildPlan: espias.buildPlan };
});
vi.mock('../engine2App.js', async (importOriginal) => {
  const real = await importOriginal();
  espias.engine2.mockImplementation(() => { throw new Error('engine2 roto (test)'); });
  return { ...real, generarPlanEngine2: espias.engine2 };
});

const { regenerarSemana, AVISO_REGENERAR_FALLO } = await import('../generarPlan.js');

const plan = {
  days: [{ name: 'Lunes', meals: [{ time: 'Comida', title: 'Plato A', _motor: 'engine2', _dishId: 'a' }], _engine2: { platosSemana: ['Plato A'], platosSemanaAnterior: ['Plato Z'] } }],
  strategy: {}, weekWarnings: [], weekProblems: [], weekScore: null,
};
const perfil = { intolerances: [], eliminatedFoods: [], gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 3, trainingDays: [] };

describe('regenerar la semana: engine2 falla', () => {
  for (const dieta of [undefined, 'vegana']) {
    it(`el plan no cambia, hay aviso y no se llama a buildPlan (dieta ${dieta || 'omnívora'})`, () => {
      espias.buildPlan.mockClear();
      espias.engine2.mockClear();
      const antes = JSON.stringify(plan);
      const r = regenerarSemana(plan, { ...perfil, ...(dieta ? { dieta } : {}) }, 2200, { weekNumber: 61, userId: 'x' });
      expect(r.ok).toBe(false);
      expect(r.plan).toBe(plan);
      expect(JSON.stringify(plan)).toBe(antes);
      expect(r.aviso).toBe(AVISO_REGENERAR_FALLO);
      expect(espias.engine2).toHaveBeenCalled();
      expect(espias.buildPlan).not.toHaveBeenCalled();
    });
  }

  it('sin plan no hace nada', () => {
    const r = regenerarSemana(null, perfil, 2200, {});
    expect(r.ok).toBe(false);
    expect(r.plan).toBe(null);
  });
});
