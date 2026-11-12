// I-4: ingredientes escritos por piezas cuya cantidad se decide en gramos.
// La compra muestra los gramos decididos (valor único) y las piezas solo como
// orientación: lo que se muestra es lo que se calculó, y se vuelve a leer igual.
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

describe('patata por piezas (I-4, punto 2)', () => {
  const CALDOS = ['Caldo gallego de grelos (completo)', 'Caldo gallego de grelos (ligero)', 'Caldo gallego de repollo (completo)'];

  it('reproduce el caso de los 400 g: 350 g decididos ya no se muestran ni se releen como 2 patatas', () => {
    const m = decidir(plato('Caldo gallego de grelos (ligero)'), 'patata', 350);
    expect(linea(m, /patata/i)).toBe('Patata (350 g, aprox. 2 grandes)');
    expect(leido(m, 'patata')).toBe(350);
  });

  it('en los cuatro platos, cualquier cantidad decidida se muestra en gramos y se relee igual', () => {
    for (const nombre of [...CALDOS, 'Cocido madrileño express']) {
      const base = plato(nombre);
      for (let g = 100; g <= 490; g += 10) {
        if (g === 200) continue; // la cantidad de partida: la línea no se toca
        const m = decidir(base, 'patata', g);
        expect(linea(m, /patata/i).startsWith(`Patata (${g} g, `)).toBe(true);
        expect(leido(m, 'patata')).toBe(g);
        expect(leerComida(m).sinCantidad).toEqual([]);
      }
    }
  });

  it('las piezas orientan: exactas sin «aprox.», concordadas, y «ud» si la ficha no decía tamaño', () => {
    const caldo = plato('Caldo gallego de repollo (completo)');
    expect(linea(decidir(caldo, 'patata', 100), /patata/i)).toBe('Patata (100 g, ½ grande)');
    expect(linea(decidir(caldo, 'patata', 250), /patata/i)).toBe('Patata (250 g, aprox. 1½ grandes)');
    expect(linea(decidir(caldo, 'patata', 300), /patata/i)).toBe('Patata (300 g, 1½ grandes)');
    expect(linea(decidir(caldo, 'patata', 400), /patata/i)).toBe('Patata (400 g, 2 grandes)');
    const cocido = plato('Cocido madrileño express');
    expect(linea(decidir(cocido, 'patata', 130), /patata/i)).toBe('Patata (130 g, aprox. ½ ud)');
    expect(linea(decidir(cocido, 'patata', 300), /patata/i)).toBe('Patata (300 g, 1½ ud)');
  });

  it('volver a ajustar una línea ya escrita así da lo mismo que ajustarla desde la ficha', () => {
    const caldo = plato('Caldo gallego de grelos (completo)');
    const dosVeces = decidir(decidir(caldo, 'patata', 350), 'patata', 260);
    expect(linea(dosVeces, /patata/i)).toBe(linea(decidir(caldo, 'patata', 260), /patata/i));
    expect(linea(dosVeces, /patata/i)).toBe('Patata (260 g, aprox. 1½ grandes)');
  });

  it('no cambia nada más de la comida ni la patata escrita en gramos de otros platos', () => {
    const caldo = plato('Caldo gallego de grelos (ligero)');
    const m = decidir(caldo, 'patata', 350);
    expect(m.shopping.filter((s) => !/patata/i.test(s))).toEqual(caldo.shopping.filter((s) => !/patata/i.test(s)));
    expect([m.p1, m.p2, m.recipe]).toEqual([caldo.p1, caldo.p2, caldo.recipe]);
    const otro = { p1: 'Merluza (200g) al horno', p2: 'Patata (200g g) — cocer', shopping: ['Merluza (200g)', 'Patata (200g)'] };
    expect(decidir(otro, 'patata', 300).shopping).toEqual(['Merluza (200g)', 'Patata (300g)']);
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
