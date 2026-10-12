// La app recarga el plan desde la base de datos (Supabase) con solo estos
// campos: days, strategy, weekWarnings, weekScore, weekProblems
// (OriginalPlanApp.jsx, hidratación desde activePlanMeta). Todo lo de engine2
// tiene que seguir funcionando con un plan así.
import { describe, it, expect } from 'vitest';
import { generarPlan, recalcularDia, regenerarComida, usaRaciones, platosRecientesPara } from '../generarPlan.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const PERFIL = (on) => ({ intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'fatLoss', mealsPerDay: 3, trainingDays: ['Lunes'], cocinarEnCantidad: { activo: true, dia: 'Domingo' }, extras: { proteinShake: { enabled: on, scoops: 1, kcalPerScoop: 120, proteinPerScoop: 24, timing: 'post_entreno' } } });
const OPTS = { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 42, userId: 'j', saveMealMemory: () => {}, platosRecientes: ['Pechuga de pollo a la plancha con limón, orégano y ajo con brócoli y arroz blanco'] };
const recargar = (p) => {
  const db = JSON.parse(JSON.stringify({ days: p.days, strategy: p.strategy, weekWarnings: p.weekWarnings, weekScore: p.weekScore, weekProblems: p.weekProblems }));
  return { _planId: 'x', ...db };
};

describe('plan de engine2 recargado desde la base de datos', { timeout: 60000 }, () => {
  it('el botón del batido sigue recalculando el día', () => {
    const plan = recargar(generarPlan(PERFIL(true), 2149, OPTS));
    expect(usaRaciones(plan, 0)).toBe(true);
    const cena = (d) => d.meals.find((m) => m && m.time === 'Cena').p1;
    const off = recalcularDia(plan, { ...plan.days[0], shakeEnabled: false }, PERFIL(false), 2149);
    expect(cena(off)).not.toBe(cena(plan.days[0]));
    const on = recalcularDia(plan, { ...off, shakeEnabled: true }, PERFIL(true), 2149);
    expect(cena(on)).toBe(cena(plan.days[0]));
  });

  it('las alternativas las sigue eligiendo engine2 y respetan la semana anterior', () => {
    const plan = recargar(generarPlan(PERFIL(true), 2149, OPTS));
    const n = regenerarComida(plan, 2, 'Comida', 'ligero', PERFIL(true), 2149, OPTS);
    expect(n).not.toBeNull();
    const m = n.days[2].meals.find((x) => x.time === 'Comida');
    expect(m._motor).toBe('engine2');
    expect(OPTS.platosRecientes).not.toContain(m.title);
  });

  it('la semana siguiente sabe qué platos no repetir', () => {
    const completo = generarPlan(PERFIL(true), 2149, OPTS);
    const plan = recargar(completo);
    expect(platosRecientesPara(plan, 42, 43)).toEqual([...completo.platosSemana, ...completo.desayunosSemana]);
    expect(platosRecientesPara(plan, 42, 42)).toEqual(OPTS.platosRecientes);
  });
});
