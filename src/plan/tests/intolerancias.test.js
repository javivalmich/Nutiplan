// Seguridad: con cada una de las 10 intolerancias que ofrece la app, ningún
// plato del plan (desayuno, tentempiés, comida, cena, acompañamientos) lleva
// ese alimento, leído por sus ingredientes y su texto (alergenos.js).
import { describe, it, expect } from 'vitest';
import { generarPlan, regenerarComida } from '../generarPlan.js';
import { intoleranciasDe } from '../engine2App.js';
import { CLAVES_ALERGENOS, alergenosDeTexto } from '../../engine2/nutrientes/alergenos.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 5, trainingDays: ['Lunes'] };
const opts = (w) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: 'i', saveMealMemory: () => {}, platosRecientes: [] });

describe('intolerancias por ingrediente (D-103)', { timeout: 120000 }, () => {
  for (const intol of CLAVES_ALERGENOS) {
    it(`sin ${intol} en ningún plato de la semana`, () => {
      for (const w of [41, 42, 43]) {
        const prof = { ...BASE, intolerances: [intol] };
        const plan = generarPlan(prof, 2600, opts(w));
        expect(plan.motor).toBe('engine2');
        for (const d of plan.days) for (const m of d.meals) {
          if (!m) continue;
          const malas = intoleranciasDe(m, prof);
          expect(malas, `${d.name} ${m.time}: ${m.title}`).toEqual([]);
        }
      }
    });
  }

  it('las alternativas también respetan la intolerancia', () => {
    for (const intol of ['soja', 'picante', 'huevo', 'gluten']) {
      const prof = { ...BASE, intolerances: [intol] };
      const plan = generarPlan(prof, 2600, opts(42));
      for (const deseo of ['comfort', 'ligero', 'rapido', 'diferente']) {
        const n = regenerarComida(plan, 1, 'Cena', deseo, prof, 2600, opts(42));
        if (!n) continue;
        expect(intoleranciasDe(n.days[1].meals.find((m) => m && m.time === 'Cena'), prof)).toEqual([]);
      }
    }
  });

  it('detecta lo habitual y no confunde nombres parecidos', () => {
    expect([...alergenosDeTexto('Pollo al wok con salsa de soja')]).toEqual(expect.arrayContaining(['soja', 'gluten']));
    expect(alergenosDeTexto('Merluza con ajo y guindilla').has('picante')).toBe(true);
    expect(alergenosDeTexto('Croquetas caseras de jamón').has('huevo')).toBe(true);
    expect(alergenosDeTexto('Sopa de miso con dashi').has('pescado')).toBe(true);
    expect(alergenosDeTexto('Curry con garam masala').has('gluten')).toBe(false);
    expect(alergenosDeTexto('Salmón con costra de hierbas').has('mariscos')).toBe(false);
    expect([...alergenosDeTexto('Ceviche con leche de tigre y cancha tostada')]).toEqual([]); // ni lactosa ni gluten
    expect(alergenosDeTexto('Pimientos asados con pimentón dulce').has('picante')).toBe(false);
    expect(alergenosDeTexto('Bebida vegetal y leche de coco').has('lactosa')).toBe(false);
    expect(alergenosDeTexto('Judías verdes salteadas').has('legumbres')).toBe(false);
    expect(alergenosDeTexto('Pechuga de pavo y jamón de pavo').has('cerdo')).toBe(false);
  });
});
