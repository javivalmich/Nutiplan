// Ceviche: el pescado se come crudo, así que tiene que haber estado congelado
// (anisakis): al menos 5 días a -20 °C en casa, o comprado ya congelado. La
// ficha admitía pescado «muy fresco» sin congelar (hoja de tiempo y dificultad,
// pestaña «Incoherencias», tipo seguridad; 2026-11-25). Mismo criterio que el
// carpaccio y el bowl de salmón crudo (compuestos.js).
import { describe, it, expect } from 'vitest';
import { catalogoApp } from '../catalogo.js';
import { componerPlato } from '../textos/componer.js';
import { leerComida } from '../medidor/leerComida.js';
import { reescribirComida } from '../cantidades.js';

const plato = catalogoApp().find((d) => d.id === 'ceviche_pescado_blanco');
const textos = (meal) => [meal.title, meal.p1, meal.p2, ...(meal.shopping || []), ...(meal.recipe || [])].filter((x) => typeof x === 'string');
const FRESCO = /muy fresc|fresc[oa] o (ultra)?congelad|sin congelar/i;
const EXIGE = /congelad\w* (al menos|como mínimo|mínimo) 5 días a -20 ?°C/i;
const COMPRADO = /(comprad\w*|cómpral\w*) ya congelad/i;
const compraPescado = (meal) => meal.shopping.find((s) => /corvina|lubina|pescado/i.test(s));

describe('Ceviche: pescado congelado previamente (anisakis)', () => {
  it('el plato está en el catálogo', () => {
    expect(plato).toBeDefined();
  });

  for (const momento of ['comida', 'cena']) {
    for (const kcal of [1434, 2000, 3714]) {
      it(`${momento} a ${kcal} kcal: no ofrece pescado fresco sin congelar`, () => {
        const meal = componerPlato(plato, momento, kcal);
        for (const t of textos(meal)) expect(t).not.toMatch(FRESCO);
      });
    }
  }

  it('la compra pide el pescado congelado (5 días a -20 °C o comprado ya congelado) y conserva los gramos', () => {
    const meal = componerPlato(plato, 'comida', 2000);
    const linea = compraPescado(meal);
    expect(linea).toMatch(EXIGE);
    expect(linea).toMatch(COMPRADO);
    const pescado = leerComida(meal).items.filter((it) => /corvina|lubina|pescado/.test(it.clave));
    expect(pescado.reduce((a, it) => a + it.gramos, 0)).toBe(180);
  });

  it('la receta lo exige antes de cortar el pescado', () => {
    const { recipe } = componerPlato(plato, 'comida', 2000);
    const exige = recipe.findIndex((p) => EXIGE.test(p) && COMPRADO.test(p));
    const cortar = recipe.findIndex((p) => /cortar el pescado/i.test(p));
    expect(exige).toBeGreaterThanOrEqual(0);
    expect(cortar).toBeGreaterThan(exige);
  });

  it('con otra ración de pescado, el texto reescrito sigue exigiendo la congelación', () => {
    const meal = componerPlato(plato, 'comida', 2000);
    const items = leerComida(meal).items.map((it) => ({ ...it, despues: /corvina|lubina|pescado/.test(it.clave) ? 230 : it.gramos }));
    const { meal: escrita } = reescribirComida(meal, items);
    const linea = compraPescado(escrita);
    expect(linea).toMatch(/230 ?g/);
    expect(linea).toMatch(EXIGE);
    for (const t of textos(escrita)) expect(t).not.toMatch(FRESCO);
  });
});
