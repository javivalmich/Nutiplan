// I-4: ingredientes que la ficha escribe por piezas y cuya cantidad se decide
// en gramos. La compra muestra solo los gramos decididos: lo que se muestra es
// lo que se calculó, y se vuelve a leer igual.
import { describe, it, expect } from 'vitest';
import { reescribirComida } from '../cantidades.js';
import { leerComida } from '../medidor/leerComida.js';
import { componerPlato } from '../textos/componer.js';
import { catalogoApp } from '../catalogo.js';

const decidir = (meal, clave, gramos) => reescribirComida(meal, leerComida(meal).items.map((it) => ({ ...it, despues: it.clave === clave ? gramos : it.gramos }))).meal;
const linea = (meal, re) => meal.shopping.find((s) => re.test(s));
const leido = (meal, clave) => leerComida(meal).items.filter((i) => i.clave === clave).reduce((a, i) => a + i.gramos, 0);
const plato = (nombre) => {
  const d = catalogoApp().find((x) => x.nombre === nombre);
  return componerPlato(d, d.momento.includes('comida') ? 'comida' : 'cena', 2000);
};

describe('patata por piezas (I-4, punto 2): solo gramos', () => {
  const CALDOS = ['Caldo gallego de grelos (completo)', 'Caldo gallego de grelos (ligero)', 'Caldo gallego de repollo (completo)'];
  const CUATRO = [...CALDOS, 'Cocido madrileño express'];

  it('reproduce el caso de los 400 g: 350 g decididos se muestran y se releen como 350 g', () => {
    const m = decidir(plato('Caldo gallego de grelos (ligero)'), 'patata', 350);
    expect(linea(m, /patata/i)).toBe('Patata (350 g)');
    expect(leido(m, 'patata')).toBe(350);
  });

  it('en los cuatro platos, cualquier cantidad (también 200 g, la de la ficha) se escribe solo en gramos', () => {
    for (const nombre of CUATRO) {
      const base = plato(nombre);
      for (let g = 100; g <= 490; g += 10) {
        const m = decidir(base, 'patata', g);
        expect(linea(m, /patata/i)).toBe(`Patata (${g} g)`);
        expect(leido(m, 'patata')).toBe(g);
        expect(leerComida(m).sinCantidad).toEqual([]);
      }
    }
  });

  it('el cocido («Patata (1)», sin tamaño) también', () => {
    const cocido = plato('Cocido madrileño express');
    expect(linea(cocido, /patata/i)).toBe('Patata (1)');
    expect(linea(decidir(cocido, 'patata', 130), /patata/i)).toBe('Patata (130 g)');
    expect(linea(decidir(cocido, 'patata', 200), /patata/i)).toBe('Patata (200 g)');
  });

  it('volver a ajustar una línea ya escrita da lo mismo que ajustarla desde la ficha', () => {
    const caldo = plato('Caldo gallego de grelos (completo)');
    const dosVeces = decidir(decidir(caldo, 'patata', 350), 'patata', 260);
    expect(linea(dosVeces, /patata/i)).toBe('Patata (260 g)');
    expect(linea(decidir(decidir(caldo, 'patata', 350), 'patata', 350), /patata/i)).toBe('Patata (350 g)');
  });

  it('no cambia nada más de la comida ni la patata escrita en gramos de otros platos', () => {
    const caldo = plato('Caldo gallego de grelos (ligero)');
    for (const g of [200, 350]) {
      const m = decidir(caldo, 'patata', g);
      expect(m.shopping.filter((s) => !/patata/i.test(s))).toEqual(caldo.shopping.filter((s) => !/patata/i.test(s)));
      expect([m.p1, m.p2, m.recipe]).toEqual([caldo.p1, caldo.p2, caldo.recipe]);
    }
    const otro = { p1: 'Merluza (200g) al horno', p2: 'Patata (200g g) — cocer', shopping: ['Merluza (200g)', 'Patata (200g)'] };
    expect(decidir(otro, 'patata', 300).shopping).toEqual(['Merluza (200g)', 'Patata (300g)']);
    expect(decidir(otro, 'patata', 200)).toEqual(otro);
  });
});

describe('pan con una parte aparte: «Pan duro (40g) + 30g para tostar» (I-4, punto 4)', () => {
  const gazpacho = () => plato('Gazpacho con huevo duro, atún y pan');

  it('la ficha se lee como la suma de las dos partes', () => {
    expect(linea(gazpacho(), /pan duro/i)).toBe('Pan duro (40g) + 30g para tostar');
    expect(leido(gazpacho(), 'pan_blanco')).toBe(70);
  });

  it('reproduce el descuadre: lo decidido se reparte entre las dos partes y suma lo decidido', () => {
    const m = decidir(gazpacho(), 'pan_blanco', 100);
    expect(linea(m, /pan duro/i)).toBe('Pan duro (55g) + 45g para tostar');
    expect(leido(m, 'pan_blanco')).toBe(100);
  });

  it('en todo su rango, lo que se muestra suma lo decidido y conserva la proporción', () => {
    for (let g = 30; g <= 140; g += 10) {
      if (g === 70) continue; // la cantidad de partida: la línea no se toca
      const m = decidir(gazpacho(), 'pan_blanco', g);
      const [, dentro, aparte] = linea(m, /pan duro/i).match(/\((\d+)g\) \+ (\d+)g para tostar/).map(Number);
      expect(dentro + aparte).toBe(g);
      expect(leido(m, 'pan_blanco')).toBe(g);
      expect(Math.abs(aparte - (g * 30) / 70)).toBeLessThanOrEqual(2.5);
    }
  });
});
