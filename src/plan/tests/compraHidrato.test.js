// La compra del hidrato en seco (arroz, pasta, quinoa) dice «en seco», igual que el texto del plato, en todas
// las plantillas (bowl, pasta, plato clásico, ensalada y legumbre). La patata y el boniato no van en seco.
import { describe, it, expect } from 'vitest';
import { componerPlato, tuplaDe, recomponer } from '../textos/componer.js';
import { HIDRATOS } from '../textos/compuestos.js';
import { adaptarSiProcede } from '../adaptar.js';
import { leerComida } from '../medidor/leerComida.js';
import { catalogoApp } from '../catalogo.js';

const conHidrato = catalogoApp().filter((d) => { const t = tuplaDe(d.id); return t && t.C; });
const lineaDe = (m, C) => m.shopping.find((l) => l.startsWith(HIDRATOS[C].compra));

describe('compra del hidrato: «en seco» como en el texto', () => {
  it('hay platos de las cinco plantillas con hidrato', () => {
    expect(new Set(conHidrato.map((d) => tuplaDe(d.id).tmpl))).toEqual(new Set(['caliente_clasico', 'pasta', 'bowl', 'ensalada', 'legumbre']));
  });

  it('cada plato con hidrato en seco lo compra «en seco», con los gramos del texto', () => {
    for (const d of conHidrato) {
      const { C } = tuplaDe(d.id);
      const m = componerPlato(d, d.momento.includes('comida') ? 'comida' : 'cena', 2174);
      const linea = lineaDe(m, C);
      const g = (linea.match(/\((\d+) g/) || [])[1];
      if (HIDRATOS[C].seco) {
        expect([d.nombre, linea]).toEqual([d.nombre, `${HIDRATOS[C].compra} (${g} g en seco)`]);
        expect(`${m.p1} ${m.p2}`.toLowerCase()).toContain(`${HIDRATOS[C].compra} (${g} g en seco)`.toLowerCase());
      } else {
        expect([d.nombre, linea]).toEqual([d.nombre, `${HIDRATOS[C].compra} (${g} g)`]);
      }
    }
  });

  it('se lee con los mismos gramos y las raciones la vuelven a escribir igual', () => {
    for (const d of conHidrato.filter((x) => HIDRATOS[tuplaDe(x.id).C].seco)) {
      const { C } = tuplaDe(d.id);
      const m = componerPlato(d, 'comida', 2174);
      const clave = HIDRATOS[C].clave;
      expect(leerComida(m).items.find((it) => it.clave === clave).gramos).toBe(m._componer.gramos.C);
      expect(lineaDe(recomponer(m, new Map([[clave, 55]])), C)).toBe(`${HIDRATOS[C].compra} (55 g en seco)`);
    }
  });

  it('con SIBO, la pasta sin gluten también va «en seco»', () => {
    const d = conHidrato.find((x) => tuplaDe(x.id).C === 'pasta');
    const m = adaptarSiProcede(componerPlato(d, 'comida', 2000), { intolerances: ['sibo'] });
    expect(m.shopping.some((l) => /^Pasta sin gluten \(\d+ g en seco\)$/.test(l))).toBe(true);
  });

  it('el día de aprovechar, la nota va detrás: «(70 g en seco, del domingo)»', () => {
    const d = conHidrato.find((x) => tuplaDe(x.id).C === 'arroz' && tuplaDe(x.id).tmpl === 'bowl');
    const m = componerPlato(d, 'comida', 2174, { ancla: { base: 'arroz', rol: 'aprovechar', cuando: 'el domingo' } });
    expect(lineaDe(m, 'arroz')).toMatch(/^Arroz \(\d+ g en seco, del domingo\)$/);
  });
});
