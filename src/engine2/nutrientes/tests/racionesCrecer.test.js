// D-116.6, modificado (2026-11-16): un proteico marcado con crecerSiFalta crece dentro de su rango solo
// cuando ya no queda ningún energético libre y faltan kcal. Sin marca, ajustarComida no cambia.
import { describe, it, expect } from 'vitest';
import { ajustarComida, racionesDia } from '../raciones.js';
import { COMPOSICION } from '../composicion.js';

const items = (marca) => [
  { clave: 'lentejas_seco', gramos: 50, unidad: 'g', ampliado: -30 }, // máximo 100 g
  { clave: 'aove', gramos: 9.2, unidad: 'g', ampliado: -10 },
  { clave: 'pollo_pechuga', gramos: 175, unidad: 'g', ...(marca ? { crecerSiFalta: true } : {}) },
  { clave: 'aove', gramos: 13.8, unidad: 'g', ampliado: -10 },
];
const g = (r, clave) => r.items.filter((i) => i.clave === clave).reduce((a, i) => a + i.gramos, 0);

describe('ajustarComida: proteico que crece si falta energía', () => {
  it('sin marca, el proteico se queda en lo que pide la proteína', () => {
    const r = ajustarComida(items(false), { kcal: 1300, proteina: 60, proteinaMin: 20 }, COMPOSICION, 1);
    expect(r.crecido).toBeUndefined();
    expect(r.kcal).toBeLessThan(1100);
  });

  it('con marca, la legumbre y el aceite llegan a su máximo y después crece el proteico, sin pasar de su rango', () => {
    const r = ajustarComida(items(true), { kcal: 1300, proteina: 60, proteinaMin: 20 }, COMPOSICION, 1);
    expect(g(r, 'lentejas_seco')).toBe(100);
    expect(g(r, 'aove')).toBe(20);
    expect(g(r, 'pollo_pechuga')).toBeGreaterThan(200);
    expect(g(r, 'pollo_pechuga')).toBeLessThanOrEqual(300);
    expect(r.crecido).toEqual([{ clave: 'pollo_pechuga', antes: expect.any(Number), despues: g(r, 'pollo_pechuga') }]);
  });

  it('si aún queda un energético libre, el proteico no crece', () => {
    const r = ajustarComida(items(true), { kcal: 700, proteina: 60, proteinaMin: 20 }, COMPOSICION, 1);
    expect(r.crecido).toBeUndefined();
  });

  it('racionesDia deja la causa en el log', () => {
    const r = racionesDia({ comidas: [{ id: 'c', momento: 'comida', items: items(true) }], objetivo: { kcal: 3714, proteina: 60, pesoKg: 90 }, composicion: COMPOSICION, vetados: new Set(['pan_integral', 'pan_sin_gluten', 'fruta']) });
    expect(r.log.some((e) => e.causa === 'proteico_crece_por_energia' && /pollo_pechuga/.test(e.detalle))).toBe(true);
  });
});

describe('ajustarComida: el proteico marcado crece también desde su mínimo', () => {
  it('si la proteína pedía menos que su mínimo y faltan kcal, crece desde el mínimo', () => {
    // Poca proteína pedida (el proteico se queda en su mínimo de 80 g) y muchas kcal.
    const r = ajustarComida(items(true), { kcal: 1300, proteina: 20, proteinaMin: 10 }, COMPOSICION, 1);
    expect(g(r, 'lentejas_seco')).toBe(100);
    expect(g(r, 'aove')).toBe(20);
    expect(g(r, 'pollo_pechuga')).toBeGreaterThan(80);
    expect(r.crecido).toBeTruthy();
  });
});
