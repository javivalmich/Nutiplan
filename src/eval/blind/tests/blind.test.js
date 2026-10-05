// Tests del cegado común (D-085, D-086). Vistas escritas a mano: este archivo
// no puede importar adaptadores ni motores (tripwire inverso de src/eval/**).
import { describe, it, expect } from 'vitest';
import { blind, serialize, BlindError, MOMENTOS_VISTA } from '../blind.js';

const DIAS = 7;

function makeView({ conDesayuno = false, prefijo = 'Plato' } = {}) {
  return {
    days: Array.from({ length: DIAS }, (_, i) => ({
      meals: [
        ...(conDesayuno ? [{ momento: 'desayuno', plato: `${prefijo} desayuno ${i + 1}` }] : []),
        { momento: 'comida', plato: `${prefijo} comida ${i + 1}` },
        { momento: 'cena', plato: `${prefijo} cena ${i + 1}` },
      ],
    })),
  };
}

const items = () => [
  { id: 'id-secreto-A', view: makeView({ conDesayuno: true, prefijo: 'Alfa' }) },
  { id: 'id-secreto-B', view: makeView({ prefijo: 'Beta' }) },
];

describe('blind — forma de la salida', () => {
  it('lista blanca de claves en todos los niveles', () => {
    const { evaluador, clave } = blind(items(), 1);
    expect(Object.keys(evaluador)).toEqual(['version', 'planes']);
    expect(Object.keys(clave)).toEqual(['version', 'seed', 'entradas']);
    for (const plan of evaluador.planes) {
      expect(Object.keys(plan)).toEqual(['etiqueta', 'dias']);
      expect(plan.dias).toHaveLength(DIAS);
      for (const d of plan.dias) expect(Object.keys(d)).toEqual(['dia', 'comida', 'cena']);
    }
    expect(MOMENTOS_VISTA).toEqual(['comida', 'cena']);
  });

  it('excluye el desayuno por regla general', () => {
    const out = serialize(blind(items(), 1).evaluador);
    expect(out).not.toMatch(/desayuno/i);
  });
});

describe('blind — fidelidad', () => {
  it('plato literal, byte a byte', () => {
    const raro = '  Pollo  al horno (220 g) — ÑAM \t';
    const view = makeView();
    view.days[3].meals[1].plato = raro;
    const { evaluador } = blind([{ id: 'x', view }], 1);
    expect(evaluador.planes[0].dias[3].cena).toBe(raro);
  });

  it('orden de días y pertenencia comida/cena', () => {
    const { evaluador } = blind([{ id: 'x', view: makeView({ prefijo: 'Z' }) }], 1);
    evaluador.planes[0].dias.forEach((d, i) => {
      expect(d.dia).toBe(i + 1);
      expect(d.comida).toBe(`Z comida ${i + 1}`);
      expect(d.cena).toBe(`Z cena ${i + 1}`);
    });
  });

  it('no muta los items recibidos', () => {
    const input = items();
    const before = JSON.stringify(input);
    blind(input, 1);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe('blind — determinismo y aleatorización', () => {
  it('misma entrada + misma semilla -> salida idéntica byte a byte', () => {
    const a = blind(items(), 12345);
    const b = blind(items(), 12345);
    expect(serialize(a.evaluador)).toBe(serialize(b.evaluador));
    expect(serialize(a.clave)).toBe(serialize(b.clave));
  });

  it('para este fixture, las semillas 1 y 2 producen salidas distintas', () => {
    const s1 = blind(items(), 1);
    const s2 = blind(items(), 2);
    expect(serialize(s1.evaluador)).not.toBe(serialize(s2.evaluador));
    expect(serialize(s1.clave)).not.toBe(serialize(s2.clave));
  });

  it('etiquetas únicas y con formato fijo', () => {
    const many = Array.from({ length: 30 }, (_, k) => ({ id: `id-${k}`, view: makeView() }));
    const { evaluador } = blind(many, 7);
    const etiquetas = evaluador.planes.map((p) => p.etiqueta);
    expect(new Set(etiquetas).size).toBe(etiquetas.length);
    for (const e of etiquetas) expect(e).toMatch(/^P-[A-HJKMNP-Z2-9]{4}$/);
  });
});

describe('blind — separación vista/clave', () => {
  it('la vista del evaluador no contiene ningún id', () => {
    const { evaluador, clave } = blind(items(), 1);
    const out = serialize(evaluador);
    expect(out).not.toContain('id-secreto-A');
    expect(out).not.toContain('id-secreto-B');
    expect(clave.entradas.map((e) => e.id).sort()).toEqual(['id-secreto-A', 'id-secreto-B']);
    expect(clave.entradas.map((e) => e.etiqueta)).toEqual(evaluador.planes.map((p) => p.etiqueta));
  });

  it('cambiar los ids no cambia la vista del evaluador', () => {
    const base = items();
    const renamed = base.map((it, k) => ({ id: `otro-${k}`, view: it.view }));
    expect(serialize(blind(base, 99).evaluador)).toBe(serialize(blind(renamed, 99).evaluador));
  });

  it('serialize: LF, salto final, sin BOM', () => {
    const out = serialize(blind(items(), 1).evaluador);
    expect(out.endsWith('\n')).toBe(true);
    expect(out).not.toContain('\r');
    expect(out.charCodeAt(0)).not.toBe(0xfeff);
  });
});

describe('blind — fallos, sin corrección', () => {
  const conView = (mutar) => {
    const view = makeView();
    mutar(view);
    return [{ id: 'x', view }];
  };

  it('6 días', () => {
    expect(() => blind(conView((v) => v.days.pop()), 1)).toThrow(BlindError);
  });
  it('falta la cena', () => {
    expect(() => blind(conView((v) => v.days[2].meals.pop()), 1)).toThrow(/falta el momento "cena"/);
  });
  it('dos comidas el mismo día', () => {
    expect(() => blind(conView((v) => v.days[0].meals.push({ momento: 'comida', plato: 'Otra' })), 1)).toThrow(/más de un momento "comida"/);
  });
  it('plato vacío o solo espacios', () => {
    expect(() => blind(conView((v) => { v.days[0].meals[0].plato = '   '; }), 1)).toThrow(/plato/);
  });
  it('momento no canónico', () => {
    expect(() => blind(conView((v) => { v.days[0].meals[0].momento = 'Comida'; }), 1)).toThrow(/momento canónico/);
  });
  it('clave extra en la comida, el día o la vista', () => {
    expect(() => blind(conView((v) => { v.days[0].meals[0].emoji = 'x'; }), 1)).toThrow(/claves/);
    expect(() => blind(conView((v) => { v.days[0].name = 'Lunes'; }), 1)).toThrow(/claves/);
    expect(() => blind(conView((v) => { v.strategy = 'x'; }), 1)).toThrow(/claves/);
  });
  it('item con algo más que id y view', () => {
    expect(() => blind([{ id: 'x', view: makeView(), motor: 'A' }], 1)).toThrow(/claves/);
  });
  it('ids duplicados, id vacío, lista vacía, semilla inválida', () => {
    expect(() => blind([{ id: 'x', view: makeView() }, { id: 'x', view: makeView() }], 1)).toThrow(/duplicado/);
    expect(() => blind([{ id: '', view: makeView() }], 1)).toThrow(/id/);
    expect(() => blind([], 1)).toThrow(/no vacío/);
    expect(() => blind(items(), -1)).toThrow(/seed/);
    expect(() => blind(items(), 1.5)).toThrow(/seed/);
  });
});
