import { describe, it, expect } from 'vitest';
import { reescribirComida } from '../cantidades.js';
import { leerComida } from '../medidor/leerComida.js';

const conDespues = (meal, nuevos) => leerComida(meal).items.map((it) => ({ ...it, despues: nuevos[it.clave] ?? it.gramos }));

describe('cantidades — escribir las raciones nuevas en la comida', () => {
  it('cambia la compra y el texto del ingrediente, y deja igual lo que no cambia', () => {
    const meal = { p1: 'Pechuga de pollo (230g) a la plancha · 15ml AOVE', p2: 'Arroz blanco (85g g seco) — cocer · Brócoli (250g) al vapor 8 min', shopping: ['Pechuga de pollo (230g)', 'Arroz blanco (85g)', 'Brócoli (250g)', 'AOVE'] };
    const { meal: m } = reescribirComida(meal, conDespues(meal, { pollo_pechuga: 180, arroz_seco: 120 }));
    expect(m.shopping).toEqual(['Pechuga de pollo (180g)', 'Arroz blanco (120g)', 'Brócoli (250g)', 'AOVE']);
    expect(m.p1).toBe('Pechuga de pollo (180g) a la plancha · 15ml AOVE');
    expect(m.p2).toBe('Arroz blanco (120g g seco) — cocer · Brócoli (250g) al vapor 8 min');
  });

  it('no confunde dos ingredientes con la misma cantidad', () => {
    const meal = { p1: '3 huevos revueltos · 60g espinacas frescas salteadas', p2: '1 tostada pan integral (60g)', shopping: ['Huevos (3 ud)', 'Espinacas frescas (60g)', 'Pan integral (60g)'] };
    const { meal: m } = reescribirComida(meal, conDespues(meal, { pan_integral: 30, huevo: 106 }));
    expect(m.p1).toBe('2 huevos revueltos · 60g espinacas frescas salteadas');
    expect(m.p2).toBe('1 tostada pan integral (30g)');
    expect(m.shopping).toEqual(['Huevos (2 ud)', 'Espinacas frescas (60g)', 'Pan integral (30g)']);
  });

  it('unidades, fracciones y «en concha / limpio» en proporción', () => {
    const meal = { p1: 'Mejillones al vapor', p2: '', shopping: ['Mejillones frescos (700g en concha / 280g limpio)', 'Aguacate (1/2)'] };
    const { meal: m } = reescribirComida(meal, conDespues(meal, { mejillon: 350, aguacate: 140 }));
    expect(m.shopping).toEqual(['Mejillones frescos (875g en concha / 350g limpio)', 'Aguacate (1)']);
  });

  it('concuerda singular y plural, y no toca los minutos de la receta', () => {
    const meal = { p1: 'Crema de calabacín · 2 huevos duros encima', p2: 'Hervir 10 min', shopping: ['Huevos (2 ud)', 'Calabacín (300g)'] };
    const { meal: m } = reescribirComida(meal, conDespues(meal, { huevo: 53 }));
    expect(m.p1).toBe('Crema de calabacín · 1 huevo duro encima');
    expect(m.p2).toBe('Hervir 10 min');
  });

  it('lo escrito se vuelve a leer con las cantidades nuevas', () => {
    const meal = { p1: 'Merluza (200g) al horno · 15ml AOVE', p2: 'Patata (200g g) — cocer', shopping: ['Merluza (200g)', 'Patata (200g)', 'AOVE'] };
    const { meal: m } = reescribirComida(meal, conDespues(meal, { merluza: 150, patata: 300, aove: 18.4 }));
    const leido = Object.fromEntries(leerComida(m).items.map((i) => [i.clave, i.gramos]));
    expect(leido).toMatchObject({ merluza: 150, patata: 300 });
    expect(leido.aove).toBeCloseTo(18.4, 0);
    expect(m.p1).toBe('Merluza (150g) al horno · 20ml AOVE');
  });
});
