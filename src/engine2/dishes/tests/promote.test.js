// Fase 2, Paso B.2, Commit 3: promote.js probado SOLO contra fixtures.
// PROHIBIDO ejecutar promocion real (el scaffold real esta sucio por
// diseno hasta que Javi anote) — este test nunca lee
// scripts/phaseB2/output/dishes.scaffold.json ni escribe dishes.json.

import { describe, it, expect } from 'vitest';
import { promote } from '../../../../scripts/phaseB2/promote.js';
import { DishSchemaError } from '../schema.js';

function dishLimpioFixture(overrides = {}) {
  return {
    id: '["tmpl","P",null,"V",null,"S","cookM"]',
    nombre: 'Plato de prueba',
    rol: 'rotativo',
    batchable: false,
    leftoverQuality: 'media',
    shelfLifeDays: 3,
    energiaCocina: 'medio',
    momento: ['comida'],
    tempFeel: 'caliente',
    plateType: 'caliente_arroz',
    ...overrides,
  };
}

describe('promote — scaffold con TODOs: ABORTA y NO promueve', () => {
  it('si queda algun "TODO", result.ok es false y lista los pendientes', () => {
    const scaffoldSucio = [
      dishLimpioFixture(),
      dishLimpioFixture({ id: '["otro",null,null,"V",null,"S","cookM"]', energiaCocina: 'TODO' }),
    ];
    const result = promote(scaffoldSucio);
    expect(result.ok).toBe(false);
    expect(result.pendientes).toEqual([{ id: '["otro",null,null,"V",null,"S","cookM"]', field: 'energiaCocina' }]);
  });

  it('PRUEBA DE DISCRIMINACION: con el TODO corregido (mismo fixture, sin mutar el campo), promote SI acepta', () => {
    const scaffoldCorregido = [
      dishLimpioFixture(),
      dishLimpioFixture({ id: '["otro",null,null,"V",null,"S","cookM"]' }), // energiaCocina ya viene "medio" del fixture base
    ];
    const result = promote(scaffoldCorregido);
    expect(result.ok).toBe(true);
  });
});

describe('promote — fixture limpio (sin TODOs): escribe y CADA plato pasa validateDish', () => {
  it('result.ok es true y devuelve los dishes', () => {
    const scaffoldLimpio = [dishLimpioFixture()];
    const result = promote(scaffoldLimpio);
    expect(result.ok).toBe(true);
    expect(result.dishes).toEqual(scaffoldLimpio);
  });

  it('PRUEBA DE DISCRIMINACION: si un dish "limpio" (sin TODO) tiene un valor invalido contra el esquema real, promote LANZA en vez de promover en silencio', () => {
    // Sin TODOs (pasa el filtro de antiTodo), pero leftoverQuality fuera
    // de enum: promote.js valida con validateDish real, no solo mira
    // ausencia de "TODO".
    const scaffoldConValorInvalido = [dishLimpioFixture({ leftoverQuality: 'regular' })];
    expect(() => promote(scaffoldConValorInvalido)).toThrow(DishSchemaError);
  });

  it('revertido (valor valido): promote vuelve a aceptar', () => {
    const scaffoldValido = [dishLimpioFixture({ leftoverQuality: 'alta' })];
    const result = promote(scaffoldValido);
    expect(result.ok).toBe(true);
  });
});
