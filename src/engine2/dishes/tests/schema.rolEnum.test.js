// Fase 2, Paso 0, Commit 1: endurece el contrato implicito de "rol"
// (Paso A lo encontro como hallazgo: rol solo exigia string no vacio).
// Este test fija el enum y demuestra que el control realmente discrimina
// (no solo que pasa en verde por casualidad).

import { describe, it, expect } from 'vitest';
import { validateDish, DishSchemaError, ROLES } from '../schema.js';
import { ANCHORS } from '../anchors.js';

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

describe('rol — enum cerrado (ancla, rotativo, capricho)', () => {
  it('NEGATIVO: rechaza un typo ("rotatibo")', () => {
    expect(() => validateDish(validDishFixture({ rol: 'rotatibo' }))).toThrow(DishSchemaError);
  });

  it('POSITIVO: valida los 3 valores reales del enum', () => {
    for (const rol of ['ancla', 'rotativo', 'capricho']) {
      expect(validateDish(validDishFixture({ rol }))).toBe(true);
    }
  });

  it('PRUEBA DE DISCRIMINACION: el test del typo muerde de verdad', () => {
    const dish = validDishFixture({ rol: 'rotatibo' });

    // Confirma que, ANTES de cualquier mutacion, el enum real rechaza el typo.
    expect(() => validateDish(dish)).toThrow(DishSchemaError);

    // Muta temporalmente el fixture para que el typo "deje de ser invalido"
    // (lo sustituimos por un valor que SI esta en el enum real) y observa
    // que entonces el mismo validador deja de lanzar -> demuestra que el
    // rechazo de arriba no era un falso positivo estructural (p.ej. un
    // campo distinto roto) sino que depende exactamente del valor de rol.
    const dishConValorValido = { ...dish, rol: 'ancla' };
    expect(validateDish(dishConValorValido)).toBe(true);

    // Revierte: vuelve a comprobar que el typo original sigue rechazado.
    expect(() => validateDish(dish)).toThrow(DishSchemaError);
  });
});

describe('regresion: los 6 ANCHORS reales siguen validando rol', () => {
  it('los 6 ANCHORS reales (rol:"ancla") pasan validateDish tras endurecer el enum', () => {
    expect(ANCHORS.length).toBe(6);
    for (const anchor of ANCHORS) {
      expect(validateDish(validDishFixture({ rol: anchor.rol }))).toBe(true);
    }
  });
});
