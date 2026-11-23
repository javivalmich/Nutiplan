// Seguridad de las legumbres (paso 1 de la legumbre como guarnición; Javi, 2026-11-23; D-103 y D-104).
// Con la intolerancia a legumbres, con SIBO y con los alimentos eliminados, ningún plato que lleve esa legumbre pasa.
// Los platos de main (el burrito de alubias negras, el bowl de salmón con edamame, la sopa de miso con tofu…) se
// prueban en el catálogo real; las legumbres que ningún plato de main lleva todavía (habas, habitas, guisantes,
// frijoles…), con comidas sintéticas.
import { describe, it, expect } from 'vitest';
import { intoleranciasDe, filtrarCatalogo, TEXTO_INTOLERANCIA } from '../engine2App.js';
import { eliminadoEn } from '../eliminados.js';
import { fodmapRestante } from '../../engine2/nutrientes/fodmap.js';
import { catalogoApp } from '../catalogo.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes'] };
const comida = (texto) => ({ time: 'Comida', title: `Pechuga de pollo a la plancha con ${texto}`, p1: 'Pechuga de pollo (150 g) a la plancha', p2: `${texto} (150 g) · AOVE (10 ml)`, shopping: ['Pechuga de pollo (150 g)', `${texto} (150 g)`, 'AOVE (10 ml)'] });

const LEGUMBRES = ['Habas', 'Habitas', 'Habichuelas', 'Frijoles', 'Frijoles negros', 'Alubias blancas cocidas', 'Alubias rojas cocidas', 'Alubias pintas cocidas', 'Alubias negras cocidas', 'Judías rojas', 'Judías negras', 'Judías pintas', 'Judías blancas', 'Garbanzos cocidos', 'Lentejas pardinas cocidas', 'Lentejas beluga cocidas', 'Guisantes', 'Edamame'];

describe('intolerancia a legumbres', () => {
  for (const t of LEGUMBRES) {
    it(`quita «${t}»`, () => {
      expect(intoleranciasDe(comida(t), { ...BASE, intolerances: ['legumbres'] })).toContain('legumbres');
    });
  }
  it('no quita las judías verdes', () => {
    expect(intoleranciasDe(comida('Judías verdes al vapor'), { ...BASE, intolerances: ['legumbres'] })).toEqual([]);
  });
  // La regla «por si acaso» del catálogo, por texto (engine2App.js), cubre lo mismo.
  for (const t of ['Habas', 'Habitas', 'Habichuelas', 'Frijoles', 'Judías rojas', 'Judías negras', 'Judías pintas', 'Edamame', 'Salsa de soja']) {
    it(`la regla por texto del catálogo quita «${t}»`, () => {
      expect(TEXTO_INTOLERANCIA.legumbres.test(t.toLowerCase())).toBe(true);
    });
  }
  it('en el catálogo de main quita el burrito de alubias negras, el bowl con edamame y la sopa de miso con tofu', () => {
    const { catalogo } = filtrarCatalogo(catalogoApp(), { ...BASE, intolerances: ['legumbres'] }, 2174);
    const ids = new Set(catalogo.map((d) => d.id));
    for (const id of ['burrito_legumbres', 'bowl_salmon_teriyaki']) expect(ids.has(id), id).toBe(false);
    expect(catalogo.some((d) => /tofu|garbanzo|lenteja|alubia/i.test(d.nombre))).toBe(false);
  });
});

describe('SIBO', () => {
  it('quita las habitas', () => {
    expect(!!fodmapRestante('Habitas (150 g)')).toBe(true);
    expect(intoleranciasDe(comida('Habitas'), { ...BASE, intolerances: ['sibo'] })).toContain('sibo');
  });
  it('quita las habichuelas', () => {
    expect(!!fodmapRestante('Habichuelas (150 g)')).toBe(true);
  });
  it('sigue quitando las habas', () => {
    expect(!!fodmapRestante('Habas (150 g)')).toBe(true);
  });
});

describe('alimentos eliminados: sinónimos', () => {
  const casos = [
    ['frijoles', ['Alubias negras cocidas', 'Alubias rojas cocidas', 'Alubias blancas cocidas', 'Judías pintas', 'Frijoles']],
    ['judías', ['Alubias negras cocidas', 'Alubias blancas cocidas', 'Frijoles', 'Judías verdes']],
    ['alubias', ['Frijoles negros', 'Judías rojas', 'Judías blancas', 'Alubias pintas cocidas']],
    ['habichuelas', ['Alubias blancas cocidas', 'Alubias rojas cocidas', 'Frijoles', 'Judías pintas', 'Habichuelas']],
    ['habichuela', ['Alubias negras cocidas', 'Habichuelas']],
    ['alubias', ['Habichuelas']],
    ['habas', ['Habitas', 'Habas']],
    ['soja', ['Edamame', 'Tofu firme', 'Tempeh', 'Salsa de soja']],
    ['legumbres', LEGUMBRES],
  ];
  for (const [palabra, textos] of casos) {
    for (const t of textos) {
      it(`«${palabra}» quita «${t}»`, () => {
        expect(eliminadoEn(comida(t).p2, palabra)).toBe(true);
      });
    }
  }
  it('«legumbres» no quita las judías verdes; «habas» no quita otra cosa', () => {
    expect(eliminadoEn('Judías verdes al vapor (150 g)', 'legumbres')).toBe(false);
    expect(eliminadoEn('Pechuga de pollo (150 g)', 'habas')).toBe(false);
  });
  it('sin acentos también: «judias» quita las alubias', () => {
    expect(eliminadoEn('Alubias blancas cocidas (150 g)', 'judias')).toBe(true);
  });

  const quitaDelCatalogo = (palabra) => {
    const { catalogo } = filtrarCatalogo(catalogoApp(), { ...BASE, eliminatedFoods: [palabra] }, 2174);
    return new Set(catalogoApp().filter((d) => !catalogo.some((x) => x.id === d.id)).map((d) => d.id));
  };
  it('en el catálogo de main, «frijoles» quita el burrito de alubias negras', () => {
    expect(quitaDelCatalogo('frijoles').has('burrito_legumbres')).toBe(true);
  });
  it('en el catálogo de main, «judías» quita el burrito y las alubias blancas', () => {
    const q = quitaDelCatalogo('judías');
    expect(q.has('burrito_legumbres')).toBe(true);
    expect(catalogoApp().filter((d) => /alubias blancas/i.test(d.nombre)).every((d) => q.has(d.id))).toBe(true);
  });
  it('en el catálogo de main, «soja» quita el bowl con edamame y la sopa de miso con tofu', () => {
    const q = quitaDelCatalogo('soja');
    expect(q.has('bowl_salmon_teriyaki')).toBe(true);
    expect(catalogoApp().filter((d) => /tofu/i.test(d.nombre)).every((d) => q.has(d.id))).toBe(true);
  });
  it('en el catálogo de main, «legumbres» quita garbanzos, lentejas, alubias, el burrito, el edamame y el tofu', () => {
    const q = quitaDelCatalogo('legumbres');
    for (const id of ['burrito_legumbres', 'bowl_salmon_teriyaki']) expect(q.has(id), id).toBe(true);
    expect(catalogoApp().filter((d) => /garbanzo|lenteja|alubia|tofu/i.test(d.nombre)).every((d) => q.has(d.id))).toBe(true);
  });
  it('en el catálogo de main, «alubias» sigue quitando el burrito y las alubias blancas', () => {
    const q = quitaDelCatalogo('alubias');
    expect(q.has('burrito_legumbres')).toBe(true);
  });
});
