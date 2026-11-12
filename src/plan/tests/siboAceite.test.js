// I-4. Con SIBO, el ajo de la compra se quitaba y se añadía al final la línea
// «Aceite aromatizado con ajo (opcional)», sin cantidad. El medidor (y las
// raciones, que usan el mismo lector) le ponía la cantidad de aceite del texto
// del plato, así que la comida llevaba dos raciones de aceite: el AOVE y el
// aromatizado (en sibo-2000, 66 de 224 comidas; unas 110 kcal por comida que
// las raciones descontaban del resto del plato).
// Decisión de Javi (2026-11-12): el aceite aromatizado con ajo SUSTITUYE al
// AOVE. Una sola línea de aceite, con la cantidad decidida.
import { describe, it, expect } from 'vitest';
import { adaptarCompraFodmap, adaptarComidaFodmap } from '../../engine2/nutrientes/fodmap.js';
import { leerComida } from '../medidor/leerComida.js';
import { generarPlan } from '../generarPlan.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
import { racionesCalculadas } from '../../../scripts/banco/metricas.mjs';

const SIBO = { intolerances: ['sibo'], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] };
const O = (w) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: 'banco-sibo-2000', saveMealMemory: () => {}, platosRecientes: [] });
const ACEITES = new Set(['aove', 'aceite_semillas']);
const aceitesDe = (m) => leerComida(m).items.filter((i) => ACEITES.has(i.clave));

describe('SIBO: el aceite aromatizado con ajo sustituye al AOVE', () => {
  it('la compra lleva una sola línea de aceite, con la cantidad del AOVE', () => {
    const compra = adaptarCompraFodmap(['Pechuga de pollo (150g)', 'Ajo (2 dientes)', 'Pimiento rojo (1)', 'AOVE (15ml)']);
    expect(compra).toEqual(['Pechuga de pollo (150g)', 'Pimiento rojo (1)', 'Aceite aromatizado con ajo (15ml)']);
  });

  it('se lee como un solo aceite (AOVE), con la cantidad escrita', () => {
    const m = adaptarComidaFodmap({ title: 'Pollo con ajo', p1: 'Pechuga de pollo (150g) a la plancha con ajo', p2: 'AOVE (15ml)', shopping: ['Pechuga de pollo (150g)', 'Ajo (2 dientes)', 'AOVE (15ml)'], recipe: [] });
    const aceites = aceitesDe(m);
    expect(aceites).toHaveLength(1);
    expect(aceites[0]).toMatchObject({ clave: 'aove', gramos: 13.8, como: 'ml' });
  });

  it('adaptar dos veces da lo mismo', () => {
    const una = adaptarCompraFodmap(['Ajo (2 dientes)', 'AOVE (10ml)', 'Cebolla (1)']);
    expect(adaptarCompraFodmap(una)).toEqual(una);
  });

  it('sin AOVE en la compra no se añade aceite', () => {
    expect(adaptarCompraFodmap(['Merluza (200g)', 'Ajo (1 diente)', 'Perejil'])).toEqual(['Merluza (200g)', 'Perejil']);
  });

  it('en un plan, ninguna comida lleva dos aceites ni un aceite sin cantidad propia; lo decidido es lo que se muestra', { timeout: 120000 }, () => {
    let conAromatizado = 0;
    for (const w of [60, 61]) {
      const plan = generarPlan(SIBO, 2000, O(w));
      for (const d of plan.days) {
        const calc = racionesCalculadas(d, SIBO, 2000);
        d.meals.forEach((m, i) => {
          if (!m || !(m.shopping || []).some((l) => /aromatizado/i.test(l))) return;
          conAromatizado++;
          const aceites = aceitesDe(m);
          const donde = `${w} ${d.name} ${m.time}: ${m.title}`;
          expect(aceites.length, donde).toBe(1);
          expect(aceites[0].como, donde).toBe('ml');
          const decidido = calc.comidas[String(i)].items.filter((x) => ACEITES.has(x.clave)).reduce((a, x) => a + x.gramos, 0);
          // El aceite se decide en gramos y se escribe en ml redondeados a 5: hasta 1,6 g (README del banco).
          expect(Math.abs(decidido - aceites[0].gramos), donde).toBeLessThanOrEqual(1.6 + 1e-9);
        });
      }
    }
    expect(conAromatizado).toBeGreaterThan(5);
  });
});
