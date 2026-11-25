// «Lentejas guisadas con arroz y zanahoria» (el único compuesto de legumbre con hidrato, del ancla): el texto
// nombra el arroz con «en seco», la receta lo cocina (o, el día de aprovechar, dice cómo usar el ya cocido) y
// la compra pone «en seco». Antes solo salía en la compra («Arroz (70 g)»). Plato único y comida doble.
import { describe, it, expect } from 'vitest';
import { componerPlato, recomponer } from '../textos/componer.js';
import { componerComidaDoble, platosDe, compraPorPlato } from '../textos/comidaDoble.js';
import { leerComida } from '../medidor/leerComida.js';
import { catalogoApp } from '../catalogo.js';
import { aplicarAjustesD099 } from '../../engine2/dishes/ajustesD099.js';
import { aplicarNombresD105 } from '../../engine2/dishes/alinosD105.js';
import { esSegundoDeLegumbre } from '../../engine2/dishes/bases.js';

const CATALOGO = aplicarNombresD105(aplicarAjustesD099(catalogoApp()));
const plato = CATALOGO.find((d) => d.nombre === 'Lentejas guisadas con arroz y zanahoria');
const segundo = CATALOGO.filter(esSegundoDeLegumbre)[0];
const APROVECHAR = { base: 'arroz', rol: 'aprovechar', cuando: 'el domingo' };
const COCINAR = { base: 'arroz', rol: 'cocinar', cuando: 'el lunes', guardar: [{ dia: 'miércoles', gramos: 70 }] };
const arrozDe = (m) => leerComida(m).items.filter((it) => it.clave === 'arroz_seco').reduce((a, it) => a + it.gramos, 0);

describe('el arroz de «Lentejas guisadas con arroz y zanahoria»', () => {
  it('el plato existe y lleva arroz en la tupla', () => {
    expect(plato).toBeTruthy();
    expect(JSON.parse(plato.id)[2]).toBe('arroz');
  });

  describe('plato único', () => {
    const m = componerPlato(plato, 'comida', 2174);

    it('el texto nombra el arroz con «en seco», y la compra también', () => {
      expect(`${m.p1} · ${m.p2}`).toMatch(/Arroz \(70 g en seco\)/);
      expect(m.shopping).toContain('Arroz (70 g en seco)');
      expect(arrozDe(m)).toBe(70);
    });

    it('la receta cocina el arroz y lo sirve con las lentejas', () => {
      expect(m.recipe.some((x) => /^Cuece el arroz/.test(x))).toBe(true);
      expect(m.recipe.some((x) => /^Sirve las lentejas con el arroz/.test(x))).toBe(true);
    });

    it('el día de aprovechar dice cómo usar el arroz ya cocido y no lo cuece', () => {
      const a = componerPlato(plato, 'comida', 2174, { ancla: APROVECHAR });
      expect(a.recipe.some((x) => /^Usa el arroz que cociste el domingo/.test(x))).toBe(true);
      expect(a.recipe.some((x) => /^Cuece el arroz/.test(x))).toBe(false);
      expect(a.shopping).toContain('Arroz (70 g en seco, del domingo)');
    });

    it('el día de cocinar de más dice cuánto cocer y cuánto guardar, junto al arroz', () => {
      const c = componerPlato(plato, 'comida', 2174, { ancla: COCINAR });
      const k = c.recipe.findIndex((x) => /de una vez/.test(x));
      expect(c.recipe[k]).toBe('Cuece de una vez 140 g de arroz en seco: 70 g para hoy y 70 g para el miércoles. Guarda lo que sobra en un táper en la nevera (aguanta 3 días).');
      expect(c.recipe[k + 1]).toMatch(/^Cuece el arroz/);
    });

    it('las raciones lo vuelven a escribir con sus gramos', () => {
      const r = recomponer(m, new Map([['arroz_seco', 55]]));
      expect(r.p2).toContain('Arroz (55 g en seco)');
      expect(r.shopping).toContain('Arroz (55 g en seco)');
    });
  });

  describe('comida doble', () => {
    const m = componerComidaDoble(plato, segundo, 2174, { ancla: APROVECHAR });
    const [c1] = compraPorPlato(m);

    it('el primero nombra su arroz a media ración, con «en seco», en el texto y en la compra', () => {
      const g = platosDe(m).primero._componer.gramos.C;
      expect(g).toBe(35);
      expect(m.p1).toContain(`Arroz (${g} g en seco)`);
      expect(c1).toContain(`Arroz (${g} g en seco, del domingo)`);
    });

    it('la receta del primero usa el arroz ya cocido', () => {
      const i2 = m.recipe.findIndex((x) => /^De segundo, /.test(x));
      const delPrimero = m.recipe.slice(0, i2);
      expect(delPrimero.some((x) => /^Usa el arroz que cociste el domingo/.test(x))).toBe(true);
      expect(delPrimero.some((x) => /^Sirve las lentejas con el arroz/.test(x))).toBe(true);
    });

    it('se lee igual junta que plato a plato', () => {
      const [a, b] = compraPorPlato(m);
      const sueltos = [...leerComida({ p1: m.p1, shopping: a }).items, ...leerComida({ p2: m.p2, shopping: b }).items];
      expect(leerComida(m).items.map((it) => `${it.clave}:${it.gramos}`)).toEqual(sueltos.map((it) => `${it.clave}:${it.gramos}`));
    });
  });
});
