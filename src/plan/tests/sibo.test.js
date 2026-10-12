// SIBO (dieta baja en FODMAP, D-104): los platos se adaptan (sin ajo, parte
// verde de cebolla y puerro, sin gluten, sin lactosa, sin miel) y solo se
// quitan los que tienen algo alto en FODMAP sin sustituto.
import { describe, it, expect } from 'vitest';
import { generarPlan, regenerarComida } from '../generarPlan.js';
import { filtrarCatalogo, intoleranciasDe, componerPlatos } from '../engine2App.js';
import { catalogoApp } from '../catalogo.js';
import { adaptarTextoFodmap, adaptarComidaFodmap, fodmapRestante, protagonistaFodmap } from '../../engine2/nutrientes/fodmap.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const P = { intolerances: ['sibo'], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] };
const O = (w) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: 's', saveMealMemory: () => {}, platosRecientes: [] });
const texto = (m) => [m.title, m.p1, m.p2, ...(m.shopping || []), ...((m.recipe || []).filter((x) => typeof x === 'string'))].join(' · ');

describe('adaptación baja en FODMAP', () => {
  it('quita el ajo y cambia cebolla, trigo, lácteos y miel', () => {
    expect(adaptarTextoFodmap('Ternera magra a la plancha con ajo y perejil')).toBe('Ternera magra a la plancha con perejil');
    expect(adaptarTextoFodmap('Espinacas salteadas con ajo 3 min')).toBe('Espinacas salteadas 3 min');
    expect(adaptarTextoFodmap('Sofríe cebolla picada')).toBe('Sofríe cebolleta (parte verde) picada');
    expect(adaptarTextoFodmap('Pasta integral (80g) · yogur griego 0% (125g) · 1 cda miel')).toBe('Pasta sin gluten (80g) · yogur sin lactosa (125g) · 1 cda sirope de arce');
    expect(adaptarTextoFodmap('Dora el ajo laminado en AOVE')).toMatch(/^Calienta aceite aromatizado con ajo/);
    expect(adaptarTextoFodmap('Bechamel con leche y harina')).toBe('Bechamel con leche sin lactosa y harina de arroz');
    expect(adaptarTextoFodmap('Ceviche en leche de tigre')).toBe('Ceviche en leche de tigre');
  });

  it('el ajillo se hace con aceite aromatizado y las verduras de acompañamiento se cambian', () => {
    expect(adaptarTextoFodmap('Pasta integral al ajillo con gambas')).toBe('Pasta sin gluten al aceite de ajo con gambas');
    expect(adaptarTextoFodmap('salsa de ajo, perejil y guindilla')).toBe('salsa de perejil y guindilla con aceite aromatizado con ajo');
    expect(adaptarTextoFodmap('Muslo de pollo · ajo entero sin pelar y laminado · patatas')).toBe('Muslo de pollo · patatas');
    expect(adaptarTextoFodmap('Ternera con champiñones')).toBe('Ternera con champiñones en conserva');
    expect(adaptarTextoFodmap('Salmón con espárragos (190g)')).toBe('Salmón con judías verdes (190g)');
    expect(protagonistaFodmap('Espárragos con mayonesa y atún')).toBeTruthy();
    expect(fodmapRestante(adaptarTextoFodmap('Pollo al ajillo con champiñones'))).toBeNull();
  });

  it('adaptar dos veces da lo mismo', () => {
    const m = { title: 'Pollo con ajo', p1: 'Pollo (200g) con cebolla y ajo', p2: 'Pan integral (60g)', shopping: ['Ajo (2 dientes)', 'Cebolla (1)'], recipe: ['Dora el ajo laminado en AOVE'] };
    const a = adaptarComidaFodmap(m);
    const b = adaptarComidaFodmap(a);
    expect(b).toEqual(a);
  });

  it('no se ofrecen platos cuyo protagonista es el ajo o con FODMAP sin sustituto', () => {
    expect(protagonistaFodmap('Sopa de ajo castellana')).toBeTruthy();
    expect(fodmapRestante('Lentejas estofadas')).toBeTruthy();
    expect(fodmapRestante('Crema de calabacín con cebolleta (parte verde)')).toBeNull();
  });
});

describe('planes con SIBO', { timeout: 120000 }, () => {
  it('quedan muchos platos y la semana sale con engine2 sin nada alto en FODMAP', () => {
    expect(filtrarCatalogo(catalogoApp(), P, 2000, O(1)).catalogo.length).toBeGreaterThan(190);
    for (const w of [41, 42, 43]) {
      const p = generarPlan(P, 2000, O(w));
      expect(p.motor).toBe('engine2');
      for (const d of p.days) for (const m of d.meals) {
        if (!m) continue;
        expect(intoleranciasDe(m, P), `${d.name} ${m.time}: ${m.title}`).toEqual([]);
        expect(texto(m).replace(/aceite (aromatizado con|de) ajo/gi, '')).not.toMatch(/\bajo\b|\bcebolla\b|pan integral|yogur griego 0/i);
      }
    }
  });

  it('adaptar dos veces da lo mismo en todo el catálogo', () => {
    for (const m of componerPlatos(catalogoApp(), P, 2000, O(1)).values()) {
      if (!m) continue;
      const a = adaptarComidaFodmap(m);
      expect(adaptarComidaFodmap(a), m.title).toEqual(a);
    }
  });

  it('las alternativas también llegan adaptadas', () => {
    const p = generarPlan(P, 2000, O(42));
    for (const deseo of ['comfort', 'ligero', 'rapido', 'diferente']) {
      const n = regenerarComida(p, 2, 'Comida', deseo, P, 2000, O(42));
      const m = n.days[2].meals.find((x) => x && x.time === 'Comida');
      expect(intoleranciasDe(m, P)).toEqual([]);
      expect(m.adaptadoFodmap).toBe(true);
    }
  });
});
