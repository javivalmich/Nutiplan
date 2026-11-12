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

  it('sin aceite de cocinar en la compra no se añade aceite', () => {
    expect(adaptarCompraFodmap(['Merluza (200g)', 'Ajo (1 diente)', 'Perejil'])).toEqual(['Merluza (200g)', 'Perejil']);
  });

  // Decisión de Javi (2026-11-12): sustituye al aceite de cocinar (AOVE o girasol), nunca al de sésamo.
  it('sin AOVE, sustituye al aceite de girasol; el de sésamo se queda', () => {
    expect(adaptarCompraFodmap(['Pollo (150g)', 'Ajo (1 diente)', 'Aceite de sésamo (5ml)', 'Aceite de girasol (10ml)']))
      .toEqual(['Pollo (150g)', 'Aceite de sésamo (5ml)', 'Aceite aromatizado con ajo (10ml)']);
    expect(adaptarCompraFodmap(['Pollo (150g)', 'Ajo (1 diente)', 'AOVE (15ml)', 'Aceite de girasol (10ml)']))
      .toEqual(['Pollo (150g)', 'Aceite aromatizado con ajo (15ml)', 'Aceite de girasol (10ml)']);
  });

  it('nunca sustituye a una línea que nombra el sésamo', () => {
    expect(adaptarCompraFodmap(['Gambas (200g)', 'Ajo (1 diente)', 'Aceite de sésamo (5ml)'])).toEqual(['Gambas (200g)', 'Aceite de sésamo (5ml)']);
    expect(adaptarCompraFodmap(['Gambas (200g)', 'Ajo (1 diente)', 'Aceite de sésamo o girasol (15ml)'])).toEqual(['Gambas (200g)', 'Aceite de sésamo o girasol (15ml)']);
  });
});

/** Aceites de cocinar que nombra un texto. */
const aceitesNombrados = (t) => {
  const s = String(t || '');
  return { aove: /\baove\b|aceite de oliva/i.test(s), girasol: /aceite de girasol/i.test(s), aromatizado: /aceite aromatizado con ajo/i.test(s) };
};
const textoDe = (m) => [m.title, m.p1, m.p2, ...((m.recipe || []).filter((x) => typeof x === 'string'))].join(' · ');
const compraDe = (m) => (m.shopping || []).join(' · ');

describe('SIBO: el texto del plato nombra el mismo aceite que la compra', () => {
  it('con AOVE sustituido, el texto dice aceite aromatizado y la cantidad se conserva', () => {
    const m = adaptarComidaFodmap({ title: 'Pollo con ajo', p1: 'Pechuga de pollo (150g) a la plancha con ajo', p2: 'Pimiento · AOVE (15ml)', shopping: ['Pechuga de pollo (150g)', 'Ajo (2 dientes)', 'AOVE (15ml)'], recipe: ['Haz el pollo con el AOVE.'] });
    expect(m.p2).toBe('Pimiento · aceite aromatizado con ajo (15ml)');
    expect(m.recipe[0]).toBe('Haz el pollo con el aceite aromatizado con ajo.');
    expect(textoDe(m)).not.toMatch(/\baove\b/i);
  });

  it('con girasol sustituido, el texto dice aceite aromatizado y el sésamo se queda', () => {
    const m = adaptarComidaFodmap({ title: 'Wok de pollo', p1: 'Pollo al wok con ajo', p2: 'Salsa de soja · aceite de sésamo', shopping: ['Pollo (150g)', 'Ajo (1 diente)', 'Aceite de sésamo (5ml)', 'Aceite de girasol (10ml)'], recipe: ['Calienta el aceite de girasol en el wok.', 'Añade el aceite de sésamo al final.'] });
    expect(m.recipe).toEqual(['Calienta el aceite aromatizado con ajo en el wok.', 'Añade el aceite de sésamo al final.']);
  });

  it('si no hay nada que sustituir, el texto no nombra el aceite aromatizado', () => {
    const m = adaptarComidaFodmap({ title: 'Gambas al wok', p1: 'Gambas', p2: 'Lima', shopping: ['Gambas (200g)', 'Ajo (1 diente)', 'Aceite de sésamo (5ml)'], recipe: ['Dora el ajo laminado en el wok.'] });
    expect(textoDe(m)).not.toMatch(/aromatizado/i);
  });

  it('adaptar dos veces da lo mismo (comida entera)', () => {
    const m = { title: 'Pollo con ajo', p1: 'Pollo (150g) con ajo', p2: 'AOVE (15ml)', shopping: ['Pollo (150g)', 'Ajo (2 dientes)', 'AOVE (15ml)'], recipe: ['Dora el ajo laminado en AOVE'] };
    const a = adaptarComidaFodmap(m);
    expect(adaptarComidaFodmap(a)).toEqual(a);
  });

  it('en un plan, cada aceite de cocinar que nombra el texto está en la compra', { timeout: 120000 }, () => {
    let vistas = 0;
    for (const w of [60, 61, 62]) {
      const plan = generarPlan(SIBO, 2000, O(w));
      for (const d of plan.days) for (const m of d.meals) {
        if (!m || !m.adaptadoFodmap) continue;
        vistas++;
        const t = aceitesNombrados(textoDe(m));
        const c = aceitesNombrados(compraDe(m));
        const donde = `${w} ${d.name} ${m.time}: ${m.title}`;
        for (const k of ['aove', 'girasol', 'aromatizado']) if (t[k]) expect(c[k], `${donde} (${k})`).toBe(true);
      }
    }
    expect(vistas).toBeGreaterThan(20);
  });
});

describe('SIBO: plan con el aceite aromatizado', () => {

  // El aceite de sésamo, si lo hay, es un aliño aparte y no cuenta como aceite de cocinar.
  it('en un plan, ninguna comida lleva dos aceites de cocinar ni uno sin cantidad propia; lo decidido es lo que se muestra', { timeout: 120000 }, () => {
    let conAromatizado = 0;
    for (const w of [60, 61]) {
      const plan = generarPlan(SIBO, 2000, O(w));
      for (const d of plan.days) {
        const calc = racionesCalculadas(d, SIBO, 2000);
        d.meals.forEach((m, i) => {
          if (!m || !(m.shopping || []).some((l) => /aromatizado/i.test(l))) return;
          conAromatizado++;
          const cocinar = aceitesDe(m).filter((x) => !/s[eé]samo/i.test(x.texto));
          const donde = `${w} ${d.name} ${m.time}: ${m.title}`;
          expect(cocinar.length, donde).toBe(1);
          expect(cocinar[0].como, donde).toBe('ml');
          expect(cocinar[0].clave, donde).toBe('aove');
          const decidido = calc.comidas[String(i)].items.filter((x) => x.clave === 'aove').reduce((a, x) => a + x.gramos, 0);
          // El aceite se decide en gramos y se escribe en ml redondeados a 5: hasta 1,6 g (README del banco).
          expect(Math.abs(decidido - cocinar[0].gramos), donde).toBeLessThanOrEqual(1.6 + 1e-9);
        });
      }
    }
    expect(conAromatizado).toBeGreaterThan(5);
  });
});
