// Propuesta 4 de la auditoría (decisión de Javi del 2026-11-16): si engine2 no encuentra alternativa para
// una comida doble, la comida queda como está, con un aviso y su causa en el log, sin ir al motor viejo
// (que perdería el segundo y podría servir legumbre como plato único).
import { describe, it, expect } from 'vitest';
import { generarPlan as generarPlanSinInterruptor, regenerarComida as regenerarComidaSinInterruptor } from '../generarPlan.js';
import { esComidaDoble } from '../textos/comidaDoble.js';
import { catalogoApp } from '../catalogo.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
// Paso 8: la regla de D-116 y D-117 está apagada por defecto (interruptor reglaLegumbre).
// Estos tests prueban su código, así que la encienden.
const generarPlan = (a0, a1, opts = {}) => generarPlanSinInterruptor(a0, a1, { reglaLegumbre: true, ...opts });
const regenerarComida = (a0, a1, a2, a3, a4, a5, opts = {}) => regenerarComidaSinInterruptor(a0, a1, a2, a3, a4, a5, { reglaLegumbre: true, ...opts });

const H74 = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const opts = { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 60, userId: 'banco-omni-2174', saveMealMemory: () => {} };
const plan = generarPlan(clonar(H74), 2174, { ...opts, platosRecientes: [] });
const comidaDe = (d) => d.meals.find((m) => m && m.time === 'Comida');
const iDoble = plan.days.findIndex((d) => esComidaDoble(comidaDe(d)));
const iUnico = plan.days.findIndex((d) => comidaDe(d) && comidaDe(d)._motor === 'engine2' && !esComidaDoble(comidaDe(d)) && !comidaDe(d).sugerencia);
// Un catálogo con solo los platos de la semana: no queda ningún plato posible para la alternativa.
const deLaSemana = new Set(plan.days.flatMap((d) => d.meals.filter(Boolean).flatMap((m) => [m._dishId, m._dishId2]).filter(Boolean)));
const sinAlternativa = { ...opts, catalogo: catalogoApp().filter((d) => deLaSemana.has(d.id)) };

describe('comida doble sin alternativa de engine2', { timeout: 60000 }, () => {
  it('los casos existen', () => {
    expect(iDoble).toBeGreaterThanOrEqual(0);
    expect(iUnico).toBeGreaterThanOrEqual(0);
  });

  it('la comida doble queda como está, con un aviso y la causa en el log', () => {
    const n = regenerarComida(plan, iDoble, 'Comida', 'ligero', clonar(H74), 2174, sinAlternativa);
    expect(n).toBeTruthy();
    expect(n.alternativaSinCambio).toBe(true);
    expect(n.alternativaAviso).toMatch(/primero y segundo/);
    expect(comidaDe(n.days[iDoble])).toEqual(comidaDe(plan.days[iDoble]));
    expect(n.days).toEqual(plan.days);
    expect(n.decisionLog.some((e) => e.causa === 'alternativa_sin_candidato_comida_doble')).toBe(true);
  });

  it('un plato único sin alternativa sigue como hoy (la vista va al motor viejo)', () => {
    expect(regenerarComida(plan, iUnico, 'Comida', 'ligero', clonar(H74), 2174, sinAlternativa)).toBeNull();
  });
});
