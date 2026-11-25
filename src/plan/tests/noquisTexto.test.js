// Ñoquis con espinacas y requesón: el texto del plato debe llevar la misma
// cantidad de requesón que la compra. La ficha escribía una sola cantidad para
// dos ingredientes («salsa de espinacas y requesón (150g)»): al cambiar las
// raciones el requesón, el texto no sabía de cuál de los dos era el «150g» y
// lo dejaba como estaba (150 g en el texto, 210 g en la compra).
import { describe, it, expect } from 'vitest';
import { platosDeDieta } from '../platosDieta.js';
import { componerPlato } from '../textos/componer.js';
import { leerComida } from '../medidor/leerComida.js';
import { reescribirComida } from '../cantidades.js';

const plato = platosDeDieta('vegetariana').find((d) => d.id === 'dieta_noquis_espinacas_requeson');
const enTexto = (meal, nombre) => ((`${meal.p1} ${meal.p2}`.toLowerCase().match(new RegExp(nombre + String.raw`[^·(]*\((\d+)\s*g\)`)) || [])[1]);
const enCompra = (meal, clave) => leerComida(meal).items.filter((it) => it.clave === clave).reduce((a, it) => a + it.gramos, 0);

describe('Ñoquis con espinacas y requesón: texto y compra', () => {
  it('la ficha existe y nombra el requesón y las espinacas con su cantidad', () => {
    expect(plato).toBeDefined();
    const meal = componerPlato(plato, 'comida', 2000);
    expect(Number(enTexto(meal, 'requesón'))).toBe(enCompra(meal, 'requeson'));
    expect(Number(enTexto(meal, 'espinacas'))).toBe(enCompra(meal, 'espinaca'));
  });

  for (const gramos of [100, 210, 300]) {
    it(`con ${gramos} g de requesón decididos, el texto dice ${gramos} g y las espinacas no cambian`, () => {
      const meal = componerPlato(plato, 'comida', 2000);
      const items = leerComida(meal).items.map((it) => ({ ...it, despues: it.clave === 'requeson' ? gramos : it.gramos }));
      const antesEspinaca = enCompra(meal, 'espinaca');
      const { meal: escrita, sinCambiar } = reescribirComida(meal, items);
      expect(enCompra(escrita, 'requeson')).toBe(gramos);
      expect(Number(enTexto(escrita, 'requesón'))).toBe(gramos);
      expect(Number(enTexto(escrita, 'espinacas'))).toBe(antesEspinaca);
      expect(sinCambiar).toBe(0);
    });
  }
});
