// La versión del motor en la meta de la semana (days[0]._engine2.version), escrita al generar (2026-11-17). Sirve
// para reconocer más adelante un plan guardado antes de esta versión (la base de datos solo guarda los días). De
// momento solo se escribe: nada la lee.
import { describe, it, expect } from 'vitest';
import { generarPlan, regenerarComida } from '../generarPlan.js';
import { VERSION_MOTOR, metaEngine2 } from '../engine2App.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const P = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes'] };
const O = { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 60, userId: 'version', saveMealMemory: () => {}, platosRecientes: [] };

describe('versión del motor en la meta de la semana', { timeout: 60000 }, () => {
  const plan = generarPlan({ ...P }, 2174, O);

  it('existe y es una cadena con fecha', () => {
    expect(VERSION_MOTOR).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('al generar, va en la meta del primer día, y solo ahí', () => {
    expect(plan.days[0]._engine2.version).toBe(VERSION_MOTOR);
    expect(plan.days.slice(1).every((d) => !d._engine2)).toBe(true);
  });

  it('sobrevive a guardar solo los días y a cambiar una comida', () => {
    const guardado = { days: JSON.parse(JSON.stringify(plan.days)) };
    expect(guardado.days[0]._engine2.version).toBe(VERSION_MOTOR);
    const i = plan.days.findIndex((d) => d.meals.some((m) => m && m.time === 'Cena' && m._dishId));
    const n = regenerarComida(guardado, i, 'Cena', 'ligero', { ...P }, 2174, O);
    expect(n.days[0]._engine2.version).toBe(VERSION_MOTOR);
  });

  it('nada la lee todavía: la meta que usa la app no la incluye', () => {
    expect(Object.keys(metaEngine2(plan))).not.toContain('version');
  });
});
