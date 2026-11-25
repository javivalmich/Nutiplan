// La comida con primero y segundo (D-116) como función pura (etapa 2, paso 3 de
// scripts/banco/medicion/estructura-comida.md, sección 12). Referencia: construirPS del
// prototipo de medición (scripts/banco/medicion/estructuraComidaLogica.mjs).

import { describe, it, expect } from 'vitest';
import { componerComidaDoble, recomponerDoble, compraPorPlato, esComidaDoble, platosDe, tituloDoble, LEGUMBRE_MEDIA_RACION } from '../textos/comidaDoble.js';
import { componerPlato, recomponer } from '../textos/componer.js';
import { leerComida } from '../medidor/leerComida.js';
import { catalogoApp } from '../catalogo.js';
import { aplicarAjustesD099 } from '../../engine2/dishes/ajustesD099.js';
import { aplicarNombresD105 } from '../../engine2/dishes/alinosD105.js';
import { esCompuestoLegumbre, esSegundoDeLegumbre } from '../../engine2/dishes/bases.js';

const CATALOGO = aplicarNombresD105(aplicarAjustesD099(catalogoApp()));
const PRIMEROS = CATALOGO.filter(esCompuestoLegumbre);
const SEGUNDOS = CATALOGO.filter(esSegundoDeLegumbre);
const KCAL = [1434, 2174, 3714];
const pares = () => PRIMEROS.flatMap((p) => SEGUNDOS.map((s) => [p, s]));
const claves = (items) => items.map((it) => `${it.clave}:${it.gramos}`);

describe('comida doble: primero de legumbre y segundo de proteína (D-116)', () => {
  it('el catálogo tiene 14 primeros y 23 segundos', () => {
    expect(PRIMEROS.length).toBe(14);
    expect(SEGUNDOS.length).toBe(23);
  });

  it('título, p1 y p2 siguen el formato del prototipo', () => {
    const p = PRIMEROS.find((d) => d.nombre === 'Lentejas con pimentón con zanahoria');
    const s = SEGUNDOS.find((d) => d.nombre === 'Pechuga de pollo a la plancha con brócoli');
    const m = componerComidaDoble(p, s, 2000);
    expect(m.time).toBe('Comida');
    expect(m.title).toBe('Lentejas con pimentón con zanahoria; de segundo, pechuga de pollo a la plancha con brócoli');
    expect(m.title).toBe(tituloDoble(p.nombre, s.nombre));
    expect(m.p1).toBe('De primero: Lentejas (50 g en seco) guisadas con pimentón ahumado y ajo · 1 zanahoria (60 g) · caldo de verduras · AOVE (10 ml)');
    expect(m.p2).toBe('De segundo: Pechuga de pollo (175 g) a la plancha con limón, orégano y ajo · ½ brócoli al vapor (165 g) · AOVE (15 ml)');
    expect(m._dishId).toBe(p.id);
    expect(m._dishId2).toBe(s.id);
    expect(esComidaDoble(m)).toBe(true);
    expect(esComidaDoble(componerPlato(p, 'comida', 2000))).toBe(false);
  });

  it('la compra y la receta de los dos platos van seguidas, con el primero delante', () => {
    for (const [p, s] of pares()) {
      const m = componerComidaDoble(p, s, 2174);
      const S = componerPlato(s, 'comida', 2174);
      const [c1, c2] = compraPorPlato(m);
      expect(c2).toEqual(S.shopping);
      expect(m.shopping).toEqual([...c1, ...c2]);
      expect(c1[0]).toMatch(/^(Lentejas|Garbanzos|Alubias blancas) \(\d+ g en seco/);
      const iSegundo = m.recipe.findIndex((x) => x.startsWith('De segundo, '));
      expect(m.recipe[0].startsWith('De primero, ')).toBe(true);
      expect(m.recipe.slice(iSegundo + 1)).toEqual(S.recipe);
    }
  });

  it('el primero parte de media ración: legumbre a 50 g en seco, y hidrato, verdura y aceite a la mitad', () => {
    for (const kcal of KCAL) {
      for (const p of PRIMEROS) {
        const entero = componerPlato(p, 'comida', kcal)._componer.gramos;
        const g = componerComidaDoble(p, SEGUNDOS[0], kcal)._doble.primero._componer.gramos;
        const mitad = (x) => Math.round(x / 2 / 5) * 5;
        expect(g.P).toBe(LEGUMBRE_MEDIA_RACION);
        expect(g.V).toBe(mitad(entero.V));
        if (entero.C != null) expect(g.C).toBe(mitad(entero.C));
        expect(g.aove).toBe(10);
      }
    }
  });

  it('el segundo va entero', () => {
    for (const s of SEGUNDOS) {
      const m = componerComidaDoble(PRIMEROS[0], s, 2174);
      expect(m._doble.segundo._componer.gramos).toEqual(componerPlato(s, 'comida', 2174)._componer.gramos);
    }
  });

  it('14 × 23: la compra junta se relee igual que la de los dos platos por separado', () => {
    for (const kcal of KCAL) {
      for (const [p, s] of pares()) {
        const m = componerComidaDoble(p, s, kcal);
        const { primero, segundo } = platosDe(m);
        const sueltos = [...leerComida(recomponer(primero, new Map())).items, ...leerComida(recomponer(segundo, new Map())).items];
        const junto = leerComida(m);
        expect(junto.sinCantidad).toEqual([]);
        expect(claves(junto.items)).toEqual(claves(sueltos));
      }
    }
  });

  it('volver a escribirla sin gramos nuevos la deja igual; con gramos nuevos, cada plato lleva los suyos', () => {
    const p = PRIMEROS.find((d) => d.nombre === 'Lentejas con pimentón con zanahoria');
    const s = SEGUNDOS.find((d) => d.nombre === 'Pechuga de pollo a la plancha con brócoli');
    const m = componerComidaDoble(p, s, 2174);
    expect(recomponerDoble(m, new Map(), new Map())).toEqual(m);
    // El aceite está en los dos platos: cada uno se escribe con el suyo.
    const r = recomponerDoble(m, new Map([['lentejas_seco', 75], ['aove', 4.6]]), new Map([['pollo_pechuga', 160], ['aove', 18.4]]));
    expect(r.p1).toContain('Lentejas (75 g en seco)');
    expect(r.p1).toContain('AOVE (5 ml)');
    expect(r.p2).toContain('Pechuga de pollo (160 g)');
    expect(r.p2).toContain('AOVE (20 ml)');
    expect(r.title).toBe(m.title);
    expect(compraPorPlato(r)[0]).toContain('AOVE (5 ml)');
    expect(compraPorPlato(r)[1]).toContain('AOVE (20 ml)');
  });

  it('con el ancla de la semana, el primero lleva la receta de aprovechar', () => {
    const p = PRIMEROS.find((d) => d.nombre === 'Garbanzos guisados con pimientos');
    const m = componerComidaDoble(p, SEGUNDOS[0], 2174, { ancla: { base: 'garbanzos', rol: 'aprovechar', cuando: 'el lunes' } });
    expect(m._ancla).toMatchObject({ base: 'garbanzos', rol: 'aprovechar' });
    expect(m.recipe.join(' ')).toContain('Usa los garbanzos que cociste el lunes');
    expect(compraPorPlato(m)[0][0]).toBe('Garbanzos (50 g en seco, del lunes)');
  });
});
