// Tests del esquema de Plato (Fase 3, Checkpoint 1): validador + tests
// de determinismo de las derivaciones + test anti-BUG-6 (espejo del bug
// de Fase 1 sobre la cena de entreno: un slot que no resuelve no debe
// caer en un default silencioso).

import { describe, it, expect } from 'vitest';
import { validateDish, DishSchemaError, MOMENTOS, TEMP_FEELS } from '../schema.js';
import { deriveTempFeelEngine2, derivePlateType, deriveMomento } from '../derive.js';

function validDishFixture(overrides = {}) {
  return {
    id: 'guiso_lentejas',
    nombre: 'Guiso de lentejas',
    rol: 'ancla',
    batchable: true,
    leftoverQuality: 'alta',
    shelfLifeDays: 3,
    energiaCocina: 'medio',
    momento: ['comida'],
    tempFeel: 'muy_caliente',
    plateType: 'legumbre',
    ...overrides,
  };
}

describe('validateDish — esquema valido', () => {
  it('PASA con un plato completo y bien formado', () => {
    expect(validateDish(validDishFixture())).toBe(true);
  });

  it('PASA con momento de dos elementos (receta servida en comida y cena)', () => {
    expect(validateDish(validDishFixture({ momento: ['comida', 'cena'] }))).toBe(true);
  });
});

describe('validateDish — sin fallback silencioso: campo invalido o ausente lanza', () => {
  it('FALLA si falta un campo requerido', () => {
    const dish = validDishFixture();
    delete dish.shelfLifeDays;
    expect(() => validateDish(dish)).toThrow(DishSchemaError);
  });

  it('FALLA si "momento" es un array vacio (no resuelve a ningun pool)', () => {
    expect(() => validateDish(validDishFixture({ momento: [] }))).toThrow(DishSchemaError);
  });

  it('FALLA si "momento" no es un array sino un escalar', () => {
    expect(() => validateDish(validDishFixture({ momento: 'comida' }))).toThrow(DishSchemaError);
  });

  it('FALLA si "momento" tiene duplicados', () => {
    expect(() => validateDish(validDishFixture({ momento: ['comida', 'comida'] }))).toThrow(DishSchemaError);
  });

  it('FALLA si "momento" incluye un valor fuera del enum (p.ej. "desayuno")', () => {
    expect(() => validateDish(validDishFixture({ momento: ['desayuno'] }))).toThrow(DishSchemaError);
  });

  it('FALLA si "tempFeel" no esta en el enum', () => {
    expect(() => validateDish(validDishFixture({ tempFeel: 'tibio' }))).toThrow(DishSchemaError);
  });

  it('FALLA si "shelfLifeDays" no es entero', () => {
    expect(() => validateDish(validDishFixture({ shelfLifeDays: 2.5 }))).toThrow(DishSchemaError);
  });

  it('FALLA si "batchable" no es boolean', () => {
    expect(() => validateDish(validDishFixture({ batchable: 'si' }))).toThrow(DishSchemaError);
  });

  it('reporta todas las violaciones encontradas, no solo la primera', () => {
    try {
      validateDish(validDishFixture({ momento: [], tempFeel: 'tibio', batchable: 'si' }));
      throw new Error('no deberia llegar aqui');
    } catch (e) {
      expect(e).toBeInstanceOf(DishSchemaError);
      expect(e.violations.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('determinismo de las derivaciones (mismo input -> mismo output)', () => {
  const combos = [
    { tmpl: 'ensalada', cookM: 'plancha' },
    { tmpl: 'sopa_crema', cookM: 'guisado' },
    { tmpl: 'caliente_clasico', cookM: 'horno', plateType: 'caliente_patata' },
    { tmpl: 'caliente_clasico', cookM: 'plancha' }, // sin plateType -> fallback
  ];

  it('deriveTempFeelEngine2 es estable en 50 invocaciones repetidas', () => {
    for (const combo of combos) {
      const first = deriveTempFeelEngine2(combo);
      for (let i = 0; i < 50; i++) {
        expect(deriveTempFeelEngine2(combo)).toBe(first);
      }
      expect(TEMP_FEELS).toContain(first);
    }
  });

  it('derivePlateType es estable y aplica el fallback de produccion sin null', () => {
    expect(derivePlateType({ plateType: 'caliente_patata' })).toBe('caliente_patata');
    expect(derivePlateType({})).toBe('caliente_arroz');
    for (let i = 0; i < 50; i++) {
      expect(derivePlateType({})).toBe('caliente_arroz');
    }
  });

  it('deriveMomento es estable y el orden de los pools de entrada no cambia el resultado', () => {
    expect(deriveMomento(['LUNCH_COMBOS'])).toEqual(['comida']);
    expect(deriveMomento(['DINNER_COMBOS'])).toEqual(['cena']);
    const a = deriveMomento(['LUNCH_COMBOS', 'DINNER_COMBOS']);
    const b = deriveMomento(['DINNER_COMBOS', 'LUNCH_COMBOS']);
    expect(new Set(a)).toEqual(new Set(['comida', 'cena']));
    expect(new Set(b)).toEqual(new Set(['comida', 'cena']));
  });

  it('deriveMomento nunca devuelve un conjunto vacio si se le pasa al menos un pool conocido', () => {
    for (const pool of ['LUNCH_COMBOS', 'DINNER_COMBOS', 'TRAINING_DINNERS']) {
      expect(deriveMomento([pool]).length).toBeGreaterThan(0);
    }
  });
});

describe('anti-BUG-6: una cena de entreno nunca debe perder su "cena" por como luce el slot', () => {
  // Espejo del bug de Fase 1: el slot real en TRAINING_DINNERS es el string
  // "Cena" (campo `slot`) mas un campo `emoji` aparte ("🏋️") — nunca
  // concatenado. Momento NUNCA lee ese campo; se deriva solo de la
  // pertenencia al pool TRAINING_DINNERS. Este test fija esa garantia.
  it('un combo de TRAINING_DINNERS resuelve momento.includes("cena") === true', () => {
    const momento = deriveMomento(['TRAINING_DINNERS']);
    expect(momento.includes('cena')).toBe(true);
  });

  it('sigue siendo true aunque el combo tambien pertenezca a LUNCH_COMBOS (caso real: ternera+patata+espinacas)', () => {
    const momento = deriveMomento(['LUNCH_COMBOS', 'TRAINING_DINNERS']);
    expect(momento.includes('cena')).toBe(true);
    expect(new Set(momento)).toEqual(new Set(['comida', 'cena']));
  });

  it('MOMENTOS no incluye "desayuno": el enum es total sobre {comida, cena}', () => {
    expect(MOMENTOS).toEqual(['comida', 'cena']);
  });
});
