import { describe, it, expect } from 'vitest';
import { generarPlanEngine2 } from '../engine2App.js';
import { regenerarComida } from '../generarPlan.js';
import { catalogoApp } from '../catalogo.js';
import { buildPlan } from '../../engine/buildPlan.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const PERFIL = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 3, trainingDays: ['Lunes'] };
const perfil = (x = {}) => ({ ...JSON.parse(JSON.stringify(PERFIL)), ...x });
const OPTS = { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 44, userId: 'r' };
const plan = (x = {}) => generarPlanEngine2(perfil(x), 2600, { ...OPTS, catalogo: catalogoApp(), platosRecientes: [] });
const comidas = (p) => p.days.flatMap((d) => d.meals.filter((m) => m && (m.time === 'Comida' || m.time === 'Cena')).map((m) => m.title));

describe('Alternativas con engine2 (D-101)', { timeout: 60000 }, () => {
  it('cambia solo esa comida, por un plato de engine2 que no estaba en la semana, y recalcula las raciones', () => {
    const p = plan();
    const antes = comidas(p);
    const n = regenerarComida(p, 1, 'Cena', 'ligero', perfil(), 2600, OPTS);
    const cena = n.days[1].meals.find((m) => m.time === 'Cena');
    expect(cena._motor).toBe('engine2');
    expect(antes).not.toContain(cena.title);
    expect(cena.nutricion).toBeTruthy();
    const despues = comidas(n);
    expect(despues.filter((t, i) => t !== antes[i])).toEqual([cena.title]);
    expect(n.platosSemana).toContain(cena.title);
    expect(n.decisionLog.some((e) => e.causa && e.causa.startsWith('alternativa_') && e.deseo === 'ligero')).toBe(true);
  });

  it('pedir otra vez la misma alternativa da otro plato', () => {
    const p = plan();
    const a = regenerarComida(p, 2, 'Comida', 'rapido', perfil(), 2600, OPTS);
    const b = regenerarComida(a, 2, 'Comida', 'rapido', perfil(), 2600, OPTS);
    const t = (x) => x.days[2].meals.find((m) => m.time === 'Comida').title;
    expect(t(b)).not.toBe(t(a));
  });

  it('no aplica a desayunos, a la comida libre ni a planes del motor viejo', () => {
    const p = plan();
    expect(regenerarComida(p, 0, 'Desayuno', 'ligero', perfil(), 2600, OPTS)).toBeNull();
    const sab = p.days.findIndex((d) => d.name === 'Sábado');
    expect(regenerarComida(p, sab, 'Comida', 'ligero', perfil(), 2600, OPTS)).toBeNull();
    const legacy = buildPlan(perfil(), 2600, { ...OPTS, saveMealMemory: () => {} });
    expect(regenerarComida(legacy, 1, 'Cena', 'ligero', perfil(), 2600, OPTS)).toBeNull();
  });

  it('respeta las intolerancias que filtra la app (pescado)', () => {
    const prof = perfil({ intolerances: ['pescado'] });
    const p = generarPlanEngine2(prof, 2600, { ...OPTS, catalogo: catalogoApp(), platosRecientes: [] });
    for (const deseo of ['comfort', 'ligero', 'rapido', 'diferente']) {
      const n = regenerarComida(p, 3, 'Cena', deseo, prof, 2600, OPTS);
      const cena = n.days[3].meals.find((m) => m.time === 'Cena');
      expect(`${cena.title} ${cena.p1} ${(cena.shopping || []).join(' ')}`).not.toMatch(/salm[oó]n|merluza|bacalao|dorada|sardina|at[uú]n|bonito|corvina|lubina/i);
    }
  });
});
