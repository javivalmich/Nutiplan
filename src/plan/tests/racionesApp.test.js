import { describe, it, expect } from 'vitest';
import { generarPlanEngine2 } from '../engine2App.js';
import { recalcularDia } from '../generarPlan.js';
import { catalogoApp } from '../catalogo.js';
import { objetivoDe, vetadosDe } from '../racionesApp.js';
import { medirPlan } from '../medidor/medir.js';
import { leerComida } from '../medidor/leerComida.js';
import { COMPOSICION } from '../../engine2/nutrientes/composicion.js';
import { buildPlan } from '../../engine/buildPlan.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const PERFILES = [
  [{ gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 3, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] }, 2600],
  [{ gender: 'female', age: 32, weight: 60, height: 163, activity: 'light', goal: 'fatLossGeneral', mealsPerDay: 4, trainingDays: ['Martes', 'Jueves'] }, 1434],
  [{ gender: 'male', age: 28, weight: 90, height: 185, activity: 'active', goal: 'muscleGain', mealsPerDay: 5, trainingDays: ['Lunes', 'Martes', 'Jueves', 'Viernes'] }, 3714],
];
const perfil = (p, extra = {}) => ({ ...BASE, ...JSON.parse(JSON.stringify(p)), ...extra });
const opts = (w, extra = {}) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: `t${w}`, catalogo: catalogoApp(), platosRecientes: [], ...extra });

describe('raciones de engine2 en la app (D-100)', { timeout: 60000 }, () => {
  it('cada semana queda a ±5 % de las calorías del usuario y cerca de su proteína', () => {
    for (const [p, kcal] of PERFILES) {
      for (const w of [40, 41, 42]) {
        const plan = generarPlanEngine2(perfil(p), kcal, opts(w));
        const obj = objetivoDe(perfil(p), kcal);
        const m = medirPlan(plan, { kcal, proteina: obj.proteina, peso: obj.pesoKg }, COMPOSICION);
        expect(Math.abs(m.desvioSemana)).toBeLessThanOrEqual(5);
        expect(m.mediaDia.proteina).toBeGreaterThanOrEqual(obj.proteina * 0.9);
        expect(m.comidasPrincipalesCortas).toBeLessThanOrEqual(1);
      }
    }
  });

  it('cada comida lleva su resultado nutricional y el día su total', () => {
    const plan = generarPlanEngine2(perfil(PERFILES[0][0]), 2600, opts(40));
    expect(plan.raciones).toBe('engine2');
    const d = plan.days[0];
    expect(d.raciones.objetivoKcal).toBe(2600);
    for (const m of d.meals.filter(Boolean)) expect(m.nutricion).toMatchObject({ kcal: expect.any(Number), proteina: expect.any(Number) });
    expect(plan.decisionLog.some((e) => e.causa === 'raciones_por_objetivo')).toBe(true);
  });

  it('las cantidades del texto coinciden con las de la compra', () => {
    let total = 0;
    let iguales = 0;
    for (const [p, kcal] of PERFILES) {
      const plan = generarPlanEngine2(perfil(p), kcal, opts(41));
      for (const d of plan.days) for (const m of d.meals.filter(Boolean)) {
        const texto = `${m.p1} ${m.p2}`;
        for (const it of leerComida(m).items) {
          const v = (it.texto.match(/^[^(]+\((\d+)\s*g\)/) || [])[1];
          const nombre = it.nombre.toLowerCase().split(' ')[0];
          if (!v || !texto.toLowerCase().includes(nombre) || !/\d+\s*g/.test(texto)) continue;
          total++;
          if (new RegExp(`\\b${v}\\s*g`).test(texto)) iguales++;
        }
      }
    }
    expect(total).toBeGreaterThan(100);
    expect(iguales / total).toBeGreaterThan(0.97);
  });

  it('con batido, el plato al que acompaña lleva menos proteína', () => {
    const batido = { proteinShake: { enabled: true, scoops: 1, kcalPerScoop: 120, proteinPerScoop: 24, timing: 'post_entreno' } };
    const [p, kcal] = PERFILES[0];
    const sin = generarPlanEngine2(perfil(p), kcal, opts(43));
    const con = generarPlanEngine2(perfil(p, { extras: batido }), kcal, opts(43));
    let menos = 0;
    sin.days.forEach((d, i) => {
      const a = d.meals.find((m) => m && m.time === 'Cena');
      const b = con.days[i].meals.find((m) => m && m.time === 'Cena');
      if (a && b && b.nutricion.proteina < a.nutricion.proteina - 5) menos++;
    });
    expect(menos).toBeGreaterThanOrEqual(5);
    expect(con.decisionLog.some((e) => e.causa === 'aparte_descontado')).toBe(true);
  });

  it('activar o quitar el batido en un día recalcula ese día', () => {
    const [p, kcal] = PERFILES[0];
    const prof = perfil(p, { extras: { proteinShake: { enabled: true, scoops: 1, kcalPerScoop: 120, proteinPerScoop: 24, timing: 'noche' } } });
    const plan = generarPlanEngine2(perfil(p), kcal, opts(44));
    const dia = { ...plan.days[1], shakeEnabled: true };
    const con = recalcularDia(plan, dia, prof, kcal);
    const cena = (d) => d.meals.find((m) => m && m.time === 'Cena').nutricion.proteina;
    expect(cena(con)).toBeLessThan(cena(plan.days[1]));
  });

  it('activar y quitar el batido muchas veces da siempre lo mismo (no deriva)', () => {
    const [p, kcal] = PERFILES[0];
    for (const timing of ['post_entreno', 'manana']) {
      const prof = (on) => perfil(p, { extras: { proteinShake: { enabled: on, scoops: 1, kcalPerScoop: 120, proteinPerScoop: 24, timing } } });
      let plan = generarPlanEngine2(prof(true), kcal, opts(45));
      const inicial = JSON.stringify(plan.days[0].meals.map((m) => m && [m.p1, m.p2, m.shopping]));
      // Misma secuencia que el botón de la app: cada clic recalcula el día desde sus comidas actuales.
      const estados = [];
      let on = true;
      for (let clic = 0; clic < 6; clic++) {
        on = !on;
        const dia = recalcularDia(plan, { ...plan.days[0], shakeEnabled: on }, prof(on), kcal);
        plan = { ...plan, days: plan.days.map((d, k) => (k === 0 ? { ...dia, shakeEnabled: on } : d)) };
        estados.push(JSON.stringify(plan.days[0].meals.map((m) => m && [m.p1, m.p2, m.shopping])));
      }
      expect(new Set(estados.filter((_, i) => i % 2 === 0)).size).toBe(1); // todos los OFF iguales
      expect(new Set(estados.filter((_, i) => i % 2 === 1)).size).toBe(1); // todos los ON iguales
      expect(estados[1]).toBe(inicial); // volver a ON deja el día como se generó
      expect(estados[0]).not.toBe(estados[1]);
    }
  });

  it('en un plan del motor viejo, recalcularDia no toca nada', () => {
    const [p, kcal] = PERFILES[0];
    const legacy = buildPlan(perfil(p), kcal, { ...opts(40), saveMealMemory: () => {} });
    expect(recalcularDia(legacy, legacy.days[0], perfil(p), kcal)).toBe(legacy.days[0]);
  });

  it('el perfil sin gluten no recibe pan como acompañamiento', () => {
    expect(vetadosDe({ intolerances: ['gluten'] }).has('pan_integral')).toBe(true);
    expect(vetadosDe({ eliminatedFoods: ['Nueces'] }).has('nuez')).toBe(true);
    const plan = generarPlanEngine2(perfil(PERFILES[0][0], { intolerances: ['gluten'] }), 2600, opts(40));
    for (const d of plan.days) for (const m of d.meals.filter(Boolean)) expect(m.acompanamientos || []).not.toContain('pan_integral');
  });

  it('con raciones: false quedan las cantidades del motor viejo (para comparar)', () => {
    const plan = generarPlanEngine2(perfil(PERFILES[0][0]), 2600, opts(40, { raciones: false }));
    expect(plan.raciones).toBeUndefined();
    expect(plan.days[0].raciones).toBeUndefined();
  });
});
