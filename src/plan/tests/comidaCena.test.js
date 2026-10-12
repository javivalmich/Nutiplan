// D-106: el motor viejo a veces etiqueta «Cena» la comida de un día (platos de
// ficha libre). engine2App identificaba comida y cena por esa etiqueta y el
// día salía con la cena dos veces y sin comida. Ahora van por su posición.
import { describe, it, expect } from 'vitest';
import { generarPlan, regenerarComida } from '../generarPlan.js';
import { huecosPrincipales } from '../engine2App.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const P = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] };
const O = (w) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: 'omni', saveMealMemory: () => {}, platosRecientes: [] });
const momentos = (d) => d.meals.filter(Boolean).map((m) => m.time).filter((t) => t === 'Comida' || t === 'Cena');

describe('comida y cena por su posición', { timeout: 300000 }, () => {
  it('huecosPrincipales: primera y última principal, sin mirar la etiqueta', () => {
    const t = (...xs) => xs.map((time) => ({ time }));
    expect(huecosPrincipales(t('Desayuno', 'Almuerzo', 'Cena', 'Cena'))).toEqual([2, 3]);
    expect(huecosPrincipales(t('Desayuno', 'Cena', 'Merienda', 'Cena'))).toEqual([1, 3]);
    expect(huecosPrincipales(t('Desayuno', 'Comida'))).toEqual([1, -1]);
  });

  it('cada día lleva una comida y una cena, las que eligió engine2 (casos que fallaban: semanas 1 y 8)', () => {
    for (const w of [1, 2, 3, 8]) {
      const p = generarPlan(P, 2000, O(w));
      for (const d of p.days) {
        expect(momentos(d), `semana ${w} ${d.name}`).toEqual(['Comida', 'Cena']);
        const [comida, cena] = ['Comida', 'Cena'].map((t) => d.meals.find((m) => m && m.time === t));
        if (comida._motor === 'engine2') expect(comida.title).not.toBe(cena.title);
      }
    }
  });

  it('con 2, 3 y 5 comidas al día también', () => {
    for (const mpd of [2, 3, 5]) {
      const p = generarPlan({ ...P, mealsPerDay: mpd }, 2000, O(1));
      for (const d of p.days) expect(momentos(d), `${mpd} comidas, ${d.name}`).toEqual(mpd === 2 ? ['Comida'] : ['Comida', 'Cena']);
    }
  });

  it('la alternativa de la comida queda como comida', () => {
    const p = generarPlan(P, 2000, O(1));
    const n = regenerarComida(p, 4, 'Comida', 'diferente', P, 2000, O(1));
    expect(momentos(n.days[4])).toEqual(['Comida', 'Cena']);
  });
});
