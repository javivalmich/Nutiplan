// Tripwire: todo plateType del scaffold generado debe pertenecer al enum
// cerrado de schema.js (PLATE_TYPES). Fase 2, checkpoint curaduria.

import { describe, it, expect } from 'vitest';
import { generateScaffold } from '../../../../scripts/phaseB2/generateScaffold.js';
import { PLATE_TYPES } from '../schema.js';

describe('tripwire: plateType del scaffold real ∈ PLATE_TYPES', () => {
  it('ninguna dish del scaffold real tiene plateType fuera del enum', () => {
    const { dishes } = generateScaffold();
    const fueraDeEnum = dishes.filter((d) => !PLATE_TYPES.includes(d.plateType));
    expect(fueraDeEnum).toEqual([]);
  });
});

describe('PRUEBA DE DISCRIMINACION: un plateType inventado en el scaffold debe detectarse', () => {
  it('rojo: inyectar un plateType inventado en una dish fixture hace fallar el chequeo', () => {
    const { dishes } = generateScaffold();
    const dishesConFantasma = [...dishes, { ...dishes[0], id: 'fantasma', plateType: 'plateType_inventado' }];

    const fueraDeEnumSucio = dishesConFantasma.filter((d) => !PLATE_TYPES.includes(d.plateType));
    expect(fueraDeEnumSucio).not.toEqual([]); // ROJO esperado
    expect(fueraDeEnumSucio.map((d) => d.id)).toEqual(['fantasma']);
  });

  it('verde: sin la dish fantasma, el scaffold real vuelve a cuadrar', () => {
    const { dishes } = generateScaffold();
    const fueraDeEnumLimpio = dishes.filter((d) => !PLATE_TYPES.includes(d.plateType));
    expect(fueraDeEnumLimpio).toEqual([]); // VERDE esperado
  });
});
