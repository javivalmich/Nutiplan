import { describe, it, expect } from 'vitest';
import { leerComida, reconocer, gramosDe } from '../leerComida.js';
import { medirComida, medirPlan } from '../medir.js';
import { INGREDIENTES } from '../../../engine2/nutrientes/ingredientes.js';

// Composición de juguete (por 100 g), solo para comprobar las cuentas.
const COMP = {
  pollo_pechuga: { kcal: 100, proteina: 20, hidratos: 0, grasa: 2 },
  arroz_seco: { kcal: 350, proteina: 7, hidratos: 78, grasa: 1 },
  aove: { kcal: 900, proteina: 0, hidratos: 0, grasa: 100 },
  huevo: { kcal: 140, proteina: 12, hidratos: 1, grasa: 10 },
  brocoli: { kcal: 30, proteina: 3, hidratos: 4, grasa: 0 },
};

describe('leerComida', () => {
  it('reconoce ingredientes por su nombre de compra', () => {
    expect(reconocer('Pechuga de pollo')).toBe('pollo_pechuga');
    expect(reconocer('Arroz basmati')).toBe('arroz_seco');
    expect(reconocer('Semillas de calabaza')).toBe('semillas');
    expect(reconocer('Tomate cherry')).toBe('tomate_cherry');
    expect(reconocer('Sal y especias básicas')).toBe('condimento');
    expect(reconocer('Lo que tú elijas hoy')).toBe(null);
  });

  it('todas las claves que reconoce existen en el vocabulario de ingredientes', () => {
    for (const n of ['Pechuga de pollo', 'Lentejas pardinas cocidas', 'Pan de pueblo', 'Yogur griego 0%', 'Mejillones frescos', 'Queso feta']) {
      expect(INGREDIENTES[reconocer(n)]).toBeTruthy();
    }
  });

  it('entiende gramos, ml, unidades, fracciones, cucharadas y «en concha / limpio»', () => {
    expect(gramosDe('pollo_pechuga', '230g').gramos).toBe(230);
    expect(gramosDe('arroz_seco', '85g seco').gramos).toBe(85);
    expect(gramosDe('huevo', '3 ud').gramos).toBe(3 * INGREDIENTES.huevo.gUd);
    expect(gramosDe('aguacate', '1/2').gramos).toBe(INGREDIENTES.aguacate.gUd / 2);
    expect(gramosDe('aove', '15ml').gramos).toBeCloseTo(15 * 0.92);
    expect(gramosDe('miel', '1 cda').gramos).toBe(INGREDIENTES.miel.gCda);
    expect(gramosDe('mejillon', '700g en concha / 280g limpio').gramos).toBe(280);
  });

  it('el aceite sin cantidad en la compra se busca en el texto; si no está, se estima y se marca', () => {
    const conTexto = leerComida({ p1: 'Pollo · 15ml AOVE', shopping: ['AOVE'] });
    expect(conTexto.items[0]).toMatchObject({ clave: 'aove', como: 'ml (texto)' });
    const sinTexto = leerComida({ p1: 'Tostadas · AOVE', shopping: ['AOVE'] });
    expect(sinTexto.items[0].como).toMatch(/estimado/);
  });

  it('los condimentos no cuentan y la comida libre se marca', () => {
    const r = leerComida({ shopping: ['Sal', 'mostaza (condimento)', 'Pechuga de pollo (200g)'] });
    expect(r.items.map((i) => i.clave)).toEqual(['pollo_pechuga']);
    expect(leerComida({ shopping: ['Lo que tú elijas hoy'] }).libre).toBe(true);
  });
});

describe('medir', () => {
  const comida = { time: 'Comida', title: 'Pollo con arroz', p1: 'Pollo (200g) · 10ml AOVE', shopping: ['Pechuga de pollo (200g)', 'Arroz blanco (80g)', 'AOVE'] };

  it('suma los nutrientes de una comida a partir de los gramos', () => {
    const m = medirComida(comida, COMP);
    // 200 g pollo + 80 g arroz + 9,2 g aceite
    expect(m.kcal).toBe(Math.round(200 + 280 + 82.8));
    expect(m.proteina).toBe(Math.round(40 + 5.6));
  });

  it('un ingrediente sin dato de composición se informa, no se inventa', () => {
    const m = medirComida({ shopping: ['Salmón (150g)'] }, COMP);
    expect(m.kcal).toBe(0);
    expect(m.sinDato).toEqual(['salmon']);
  });

  it('mide la semana frente al objetivo y excluye el día libre', () => {
    const dia = (name, extra = []) => ({ name, meals: [
      { time: 'Desayuno', shopping: ['Huevos (2 ud)'] },
      { time: 'Comida', ...comida },
      { time: 'Cena', shopping: ['Pechuga de pollo (150g)', 'Brócoli (200g)'] },
      ...extra,
    ] });
    const plan = { days: [dia('Lunes'), dia('Sábado', [{ time: 'Comida', shopping: ['Lo que tú elijas hoy'] }])] };
    const r = medirPlan(plan, { kcal: 1000, proteina: 90, peso: 70 }, COMP);
    expect(r.dias[1].libre).toBe(true);
    expect(r.mediaDia.kcal).toBe(r.dias[0].total.kcal);
    expect(r.minProteinaComida).toBe(21);
    expect(r.comidasPrincipales).toBe(3);
    // desayuno con 2 huevos: ~13 g de proteína, por debajo de 21
    expect(r.comidasPrincipalesCortas).toBe(1);
  });
});
