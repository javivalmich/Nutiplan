// El lector y la comida con primero y segundo (D-116; etapa 2, paso 4 de
// scripts/banco/medicion/estructura-comida.md, sección 12).
// Un aceite sin cantidad en la compra toma su cantidad del texto. En la comida doble hay un aceite
// por plato: cada uno se lee en el texto de SU plato (el primero en p1, el segundo en p2).

import { describe, it, expect } from 'vitest';
import { leerComida } from '../leerComida.js';
import { componerComidaDoble, compraPorPlato, platosDe } from '../../textos/comidaDoble.js';
import { recomponer } from '../../textos/componer.js';
import { catalogoApp } from '../../catalogo.js';
import { aplicarAjustesD099 } from '../../../engine2/dishes/ajustesD099.js';
import { aplicarNombresD105 } from '../../../engine2/dishes/alinosD105.js';
import { esCompuestoLegumbre, esSegundoDeLegumbre } from '../../../engine2/dishes/bases.js';
import { adaptarComidaFodmap } from '../../../engine2/nutrientes/fodmap.js';

const CATALOGO = aplicarNombresD105(aplicarAjustesD099(catalogoApp()));
const PRIMEROS = CATALOGO.filter(esCompuestoLegumbre);
const SEGUNDOS = CATALOGO.filter(esSegundoDeLegumbre);
const pares = () => PRIMEROS.flatMap((p) => SEGUNDOS.map((s) => [p, s]));
const claves = (items) => items.map((it) => `${it.clave}:${it.gramos}`);
const ML = 0.92; // g por ml de aceite
const aceites = (meal) => leerComida(meal).items.filter((it) => it.clave === 'aove');
/** La misma comida, con la línea de aceite del plato `n` (1 o 2) sin cantidad en la compra. */
function sinCantidadDeAceite(meal, n) {
  const [c1, c2] = compraPorPlato(meal);
  const quitar = (lineas) => lineas.map((l) => (/^(AOVE|Aceite)/.test(l) ? l.replace(/\s*\(.*$/, '') : l));
  return { ...meal, shopping: n === 1 ? [...quitar(c1), ...c2] : [...c1, ...quitar(c2)] };
}

describe('leerComida: la comida doble se lee igual junta que plato a plato', () => {
  it('14 × 23: los mismos ingredientes y gramos, y cada uno con su plato', () => {
    for (const kcal of [1434, 2174, 3714]) {
      for (const [p, s] of pares()) {
        const m = componerComidaDoble(p, s, kcal);
        const { primero, segundo } = platosDe(m);
        const l1 = leerComida(recomponer(primero, new Map())).items;
        const l2 = leerComida(recomponer(segundo, new Map())).items;
        const junto = leerComida(m).items;
        expect(claves(junto)).toEqual(claves([...l1, ...l2]));
        expect(junto.map((it) => it.plato)).toEqual([...l1.map(() => 1), ...l2.map(() => 2)]);
      }
    }
  });

  it('14 × 23 con SIBO (aceite aromatizado con ajo): igual junta que plato a plato', () => {
    for (const [p, s] of pares()) {
      const m = componerComidaDoble(p, s, 2000, { porPlato: adaptarComidaFodmap });
      const { primero, segundo } = platosDe(m);
      const l1 = leerComida(adaptarComidaFodmap(recomponer(primero, new Map()))).items;
      const l2 = leerComida(adaptarComidaFodmap(recomponer(segundo, new Map()))).items;
      expect(claves(leerComida(m).items)).toEqual(claves([...l1, ...l2]));
      expect(aceites(m).map((it) => it.gramos)).toEqual([10 * ML, 15 * ML].map((g) => Math.round(g * 10) / 10));
    }
  });

  it('14 × 23: un aceite sin cantidad en la compra se lee en el texto de su plato, no en el del otro', () => {
    for (const adaptar of [(x) => x, adaptarComidaFodmap]) {
      for (const [p, s] of pares()) {
        const m = componerComidaDoble(p, s, 2000, { porPlato: adaptar });
        // El primero lleva 10 ml y el segundo 15 ml.
        expect(aceites(sinCantidadDeAceite(m, 2)).map((it) => [it.plato, it.gramos, it.como])).toEqual([[1, 9.2, 'ml'], [2, 13.8, 'ml (texto)']]);
        expect(aceites(sinCantidadDeAceite(m, 1)).map((it) => [it.plato, it.gramos, it.como])).toEqual([[1, 9.2, 'ml (texto)'], [2, 13.8, 'ml']]);
      }
    }
  });

  it('una comida de un solo plato se lee como antes (sin marca de plato)', () => {
    const m = recomponer(platosDe(componerComidaDoble(PRIMEROS[0], SEGUNDOS[0], 2000)).segundo, new Map());
    expect(leerComida(m).items.every((it) => !('plato' in it))).toBe(true);
    expect(aceites({ ...m, shopping: m.shopping.map((l) => l.replace(/^AOVE.*$/, 'AOVE')) }).map((it) => [it.gramos, it.como])).toEqual([[13.8, 'ml (texto)']]);
  });
});
