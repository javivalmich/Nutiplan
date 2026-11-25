// I-4, punto 1: el lector entiende «½» y «N½» en las cantidades por piezas.
// Antes, «1½» se leía como 1 y «½» sin palabra detrás no se leía: lo escrito
// por cantidades.js (que usa esas formas) no se podía volver a leer.
import { describe, it, expect } from 'vitest';
import { gramosDe, leerComida } from '../leerComida.js';
import { reescribirComida } from '../../cantidades.js';

describe('lector: medias piezas', () => {
  it('lee «½» y «N½», con y sin palabra detrás', () => {
    expect(gramosDe('patata', '½')).toEqual({ gramos: 100, como: 'ud' });
    expect(gramosDe('patata', '½ grande')).toEqual({ gramos: 100, como: 'ud' });
    expect(gramosDe('patata', '1½')).toEqual({ gramos: 300, como: 'ud' });
    expect(gramosDe('patata', '1½ grande')).toEqual({ gramos: 300, como: 'ud' });
    expect(gramosDe('aguacate', '1½')).toEqual({ gramos: 210, como: 'ud' });
    expect(gramosDe('mejillon', '14½ unidades')).toEqual({ gramos: 101.5, como: 'ud' });
  });

  it('lo que ya se leía se sigue leyendo igual', () => {
    expect(gramosDe('patata', '1 grande')).toEqual({ gramos: 200, como: 'ud' });
    expect(gramosDe('patata', '2')).toEqual({ gramos: 400, como: 'ud' });
    expect(gramosDe('aguacate', '1/2')).toEqual({ gramos: 70, como: 'ud' });
    expect(gramosDe('huevo', '3 ud')).toEqual({ gramos: 159, como: 'ud' });
    expect(gramosDe('huevo', '2-3')).toEqual({ gramos: 132.5, como: 'ud' });
    expect(gramosDe('pollo_pechuga', '1,5 kg')).toBe(null);
  });

  it('el aguacate que escribe la app se vuelve a leer con lo decidido', () => {
    const meal = { p1: 'Huevos revueltos · aguacate', p2: '', shopping: ['Huevos (2 ud)', 'Aguacate (1/2)'] };
    for (const decidido of [70, 140, 210]) {
      const items = leerComida(meal).items.map((it) => ({ ...it, despues: it.clave === 'aguacate' ? decidido : it.gramos }));
      const escrita = reescribirComida(meal, items).meal;
      const releido = leerComida(escrita);
      expect(releido.sinCantidad).toEqual([]);
      expect(releido.items.find((i) => i.clave === 'aguacate').gramos).toBe(decidido);
    }
  });

  it('«Patata (½)» ya no desaparece de la lectura', () => {
    const r = leerComida({ p1: '', p2: '', shopping: ['Patata (½)'] });
    expect(r.sinCantidad).toEqual([]);
    expect(r.items).toMatchObject([{ clave: 'patata', gramos: 100, como: 'ud' }]);
  });
});
