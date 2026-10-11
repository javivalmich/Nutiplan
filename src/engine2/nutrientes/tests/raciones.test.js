import { describe, it, expect } from 'vitest';
import { ajustarComida, racionesDia, PROTEINA_MIN_POR_KG } from '../raciones.js';
import { COMPOSICION } from '../composicion.js';
import { INGREDIENTES } from '../ingredientes.js';

const pollo = (g = 200) => [{ clave: 'pollo_pechuga', gramos: g }, { clave: 'arroz_seco', gramos: 70 }, { clave: 'brocoli', gramos: 200 }, { clave: 'aove', gramos: 13.8 }];
const dia = (extra = {}) => ({
  comidas: [
    { id: 'd', momento: 'desayuno', items: [{ clave: 'avena', gramos: 50 }, { clave: 'yogur_griego_0', gramos: 125 }, { clave: 'fruta', gramos: 150, unidad: 'ud' }] },
    { id: 'c', momento: 'comida', items: pollo() },
    { id: 'n', momento: 'cena', items: [{ clave: 'merluza', gramos: 200 }, { clave: 'patata', gramos: 200 }, { clave: 'judia_verde', gramos: 200 }, { clave: 'aove', gramos: 13.8 }] },
  ],
  objetivo: { kcal: 2400, proteina: 140, pesoKg: 75 },
  composicion: COMPOSICION,
  ...extra,
});

describe('raciones — una comida', () => {
  it('llega a sus calorías y a su proteína cuando tiene proteína y energía que ajustar', () => {
    const r = ajustarComida(pollo(), { kcal: 900, proteina: 50, proteinaMin: 22 }, COMPOSICION);
    expect(Math.abs(r.kcal - 900) / 900).toBeLessThan(0.05);
    expect(r.proteina).toBeGreaterThanOrEqual(48);
  });

  it('la verdura no cambia y todo queda en medidas de casa', () => {
    const r = ajustarComida(pollo(), { kcal: 1100, proteina: 60, proteinaMin: 22 }, COMPOSICION);
    expect(r.items.find((i) => i.clave === 'brocoli').gramos).toBe(200);
    for (const i of r.items.filter((x) => x.papel !== 'fijo')) expect(i.gramos % 5).toBe(0);
  });

  it('respeta el máximo humano de cada ingrediente aunque falten calorías', () => {
    const r = ajustarComida(pollo(), { kcal: 3000, proteina: 60, proteinaMin: 22 }, COMPOSICION);
    for (const i of r.items) if (i.clave === 'arroz_seco') expect(i.gramos).toBeLessThanOrEqual(160);
    expect(r.items.find((i) => i.clave === 'arroz_seco').limitado).toBe('maximo');
  });

  it('lo que se escribe en unidades se redondea a unidades enteras', () => {
    const r = ajustarComida([{ clave: 'huevo', gramos: 106, unidad: 'ud' }, { clave: 'pan_integral', gramos: 60 }], { kcal: 600, proteina: 30, proteinaMin: 22 }, COMPOSICION);
    const h = r.items.find((i) => i.clave === 'huevo');
    expect(h.gramos / INGREDIENTES.huevo.gUd).toBe(Math.round(h.gramos / INGREDIENTES.huevo.gUd));
  });

  it('la proteína no se infla para llenar calorías si el plato no tiene hidrato', () => {
    const r = ajustarComida([{ clave: 'pollo_pechuga', gramos: 200 }, { clave: 'calabacin', gramos: 250 }], { kcal: 900, proteina: 45, proteinaMin: 22 }, COMPOSICION);
    expect(r.items[0].gramos).toBeLessThan(220);
  });
});

describe('raciones — un día', () => {
  it('el día llega a su objetivo de calorías (±5 %) y de proteína', () => {
    const r = racionesDia(dia());
    expect(Math.abs(r.total.kcal - 2400) / 2400).toBeLessThan(0.05);
    expect(r.total.proteina).toBeGreaterThanOrEqual(140 * 0.95);
  });

  it('desayuno, comida y cena tienen al menos 0,3 g de proteína por kg', () => {
    const r = racionesDia(dia());
    for (const id of ['d', 'c', 'n']) expect(r.comidas[id].proteina).toBeGreaterThanOrEqual(Math.floor(PROTEINA_MIN_POR_KG * 75) - 1);
  });

  it('la comida libre no se toca', () => {
    const d = dia();
    d.comidas[1] = { ...d.comidas[1], libre: true };
    const r = racionesDia(d);
    expect(r.comidas.c).toBeUndefined();
  });

  it('el batido se descuenta de la comida a la que acompaña: menos proteína en ese plato', () => {
    const sin = racionesDia(dia());
    const con = racionesDia(dia({ aparte: [{ nombre: 'batido', kcal: 120, proteina: 24, momento: 'cena' }] }));
    const merluza = (r) => r.comidas.n.items.find((i) => i.clave === 'merluza').gramos;
    expect(merluza(con)).toBeLessThan(merluza(sin) - 50);
    expect(con.comidas.c.items.find((i) => i.clave === 'pollo_pechuga').gramos).toBeGreaterThanOrEqual(sin.comidas.c.items.find((i) => i.clave === 'pollo_pechuga').gramos - 5);
    expect(con.log.some((e) => e.causa === 'aparte_descontado')).toBe(true);
  });

  it('el batido nunca deja una comida por debajo de su proteína mínima', () => {
    const con = racionesDia(dia({ aparte: [{ nombre: 'batido', kcal: 240, proteina: 48, momento: 'cena' }] }));
    expect(con.comidas.n.proteina).toBeGreaterThanOrEqual(Math.floor(PROTEINA_MIN_POR_KG * 75) - 1);
  });

  it('si un plato no llega, se añade pan; si el perfil no lo permite, fruta', () => {
    const corto = (vetados) => racionesDia({
      comidas: [{ id: 'c', momento: 'comida', items: [{ clave: 'pollo_pechuga', gramos: 200 }, { clave: 'calabacin', gramos: 250 }] }],
      objetivo: { kcal: 2600, proteina: 140, pesoKg: 75 }, composicion: COMPOSICION, vetados,
    });
    expect(corto(new Set()).comidas.c.items.some((i) => i.clave === 'pan_integral' && i.anadido)).toBe(true);
    const sinPan = corto(new Set(['pan_integral']));
    expect(sinPan.comidas.c.items.some((i) => i.clave === 'pan_integral')).toBe(false);
    expect(sinPan.comidas.c.items.some((i) => i.clave === 'fruta' && i.anadido)).toBe(true);
    expect(sinPan.log.some((e) => e.causa === 'acompanamiento_anadido')).toBe(true);
  });

  it('toda decisión deja su causa y el resultado es determinista', () => {
    const a = racionesDia(dia());
    expect(a.log.filter((e) => e.causa === 'raciones_por_objetivo')).toHaveLength(3);
    expect(JSON.stringify(racionesDia(dia()))).toBe(JSON.stringify(a));
  });
});
