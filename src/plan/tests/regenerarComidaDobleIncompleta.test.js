// Segunda revisión independiente, M2 y B5 (2026-11-22): alternativa de una comida que dice tener segundo
// (`_dishId2`) pero llega sin los datos completos de sus dos platos (`_doble` a medias: un plan guardado a
// medias, editado a mano o de otra versión).
//   M2: platosSemana pierde el primero y el segundo (por sus nombres del catálogo) y recibe el plato nuevo,
//       con su causa en el log.
//   B5: si engine2 no encuentra alternativa, la comida se queda como está, con el aviso de la comida doble,
//       sin ir al motor viejo (que perdería el segundo).
import { describe, it, expect } from 'vitest';
import { generarPlan as generarPlanSinInterruptor, regenerarComida as regenerarComidaSinInterruptor } from '../generarPlan.js';
import { metaEngine2 } from '../engine2App.js';
import { esComidaDoble, esComidaDobleIncompleta } from '../textos/comidaDoble.js';
import { catalogoApp } from '../catalogo.js';
import { aplicarAjustesD099 } from '../../engine2/dishes/ajustesD099.js';
import { aplicarNombresD105 } from '../../engine2/dishes/alinosD105.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
// Paso 8: la regla de D-116 y D-117 está apagada por defecto (interruptor reglaLegumbre).
// Estos tests prueban su código, así que la encienden.
const generarPlan = (a0, a1, opts = {}) => generarPlanSinInterruptor(a0, a1, { reglaLegumbre: true, ...opts });
const regenerarComida = (a0, a1, a2, a3, a4, a5, opts = {}) => regenerarComidaSinInterruptor(a0, a1, a2, a3, a4, a5, { reglaLegumbre: true, ...opts });

const H74 = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const opts = { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 60, userId: 'banco-omni-2174', saveMealMemory: () => {} };
const NOMBRE = new Map(aplicarNombresD105(aplicarAjustesD099(catalogoApp())).map((d) => [d.id, d.nombre]));
const comidaDe = (d) => d.meals.find((m) => m && m.time === 'Comida');

const completo = generarPlan(clonar(H74), 2174, { ...opts, platosRecientes: [] });
const iDoble = completo.days.findIndex((d) => esComidaDoble(comidaDe(d)));
// La misma semana con la comida doble a medias: conserva _dishId y _dishId2, pierde los datos de sus dos platos.
const plan = clonar(completo);
const doble = comidaDe(plan.days[iDoble]);
delete doble._doble.segundo;
const primero = NOMBRE.get(doble._dishId);
const segundo = NOMBRE.get(doble._dishId2);
// Un catálogo con solo los platos de la semana: no queda ningún plato posible para la alternativa.
const deLaSemana = new Set(plan.days.flatMap((d) => d.meals.filter(Boolean).flatMap((m) => [m._dishId, m._dishId2]).filter(Boolean)));
const sinAlternativa = { ...opts, catalogo: catalogoApp().filter((x) => deLaSemana.has(x.id)) };

describe('alternativa de una comida doble incompleta (M2 y B5)', { timeout: 60000 }, () => {
  it('el caso existe: comida doble a medias, con primero y segundo en platosSemana', () => {
    expect(iDoble).toBeGreaterThanOrEqual(0);
    expect(esComidaDobleIncompleta(doble)).toBe(true);
    expect(metaEngine2(plan).platosSemana).toEqual(expect.arrayContaining([primero, segundo]));
  });

  it('M2: platosSemana pierde el primero y el segundo y recibe el plato nuevo, con su causa', () => {
    const n = regenerarComida(plan, iDoble, 'Comida', 'ligero', clonar(H74), 2174, opts);
    expect(n && !n.alternativaSinCambio).toBe(true);
    const nueva = comidaDe(n.days[iDoble]);
    expect(nueva._dishId2).toBeUndefined();
    const ps = n.platosSemana;
    expect(ps).not.toContain(primero);
    expect(ps).not.toContain(segundo);
    expect(ps).toContain(NOMBRE.get(nueva._dishId));
    expect(ps.length).toBe(metaEngine2(plan).platosSemana.length - 1);
    expect(metaEngine2(n).platosSemana).toEqual(ps);
    const e = n.decisionLog.find((x) => x.causa === 'alternativa_retira_comida_doble_incompleta');
    expect(e).toBeTruthy();
    expect(e.plato).toBe(doble._dishId2);
    expect(e.detalle).toContain(primero);
    expect(e.detalle).toContain(segundo);
  });

  it('B5: sin alternativa se queda como está, con el aviso, sin ir al motor viejo', () => {
    const n = regenerarComida(plan, iDoble, 'Comida', 'ligero', clonar(H74), 2174, sinAlternativa);
    expect(n).toBeTruthy();
    expect(n.alternativaSinCambio).toBe(true);
    expect(n.alternativaAviso).toMatch(/primero y segundo/);
    expect(n.days).toEqual(plan.days);
    expect(n.decisionLog.some((x) => x.causa === 'alternativa_sin_candidato_comida_doble')).toBe(true);
  });
});
