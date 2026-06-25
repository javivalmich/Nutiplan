// Enums del Plato — negativos discriminantes contra validateDish.
//
// Fase 2, Paso 0, Commit 1: endurece el contrato implicito de "rol"
// (Paso A lo encontro como hallazgo: rol solo exigia string no vacio).
// Este test fija el enum y demuestra que el control realmente discrimina
// (no solo que pasa en verde por casualidad).
//
// Fase 2, Paso B.1, Parte 3 (limpieza): se consolidan aqui los negativos
// de leftoverQuality y energiaCocina que vivian en el huerfano
// validator.controlPositivo.test.js (Paso A) — ese archivo solo
// comprobaba CONTAINMENT del valor en el enum (anchors.test.js ya lo
// hacia tambien), nunca ejercitaba el rechazo real de validateDish con
// DishSchemaError. Se migran aqui para no perder esa cobertura al
// eliminar el huerfano (ver informe Fase 2 / Paso B.1).

import { describe, it, expect } from 'vitest';
import { validateDish, DishSchemaError, ROLES, LEFTOVER_QUALITIES, ENERGIA_COCINA_NIVELES } from '../schema.js';
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

describe('leftoverQuality — enum cerrado (baja, media, alta)', () => {
  it('NEGATIVO: rechaza un valor fuera de enum ("regular")', () => {
    expect(LEFTOVER_QUALITIES).not.toContain('regular');
    expect(() => validateDish(validDishFixture({ leftoverQuality: 'regular' }))).toThrow(DishSchemaError);
  });

  it('PRUEBA DE DISCRIMINACION: el rechazo depende del valor, no es un falso positivo estructural', () => {
    const dish = validDishFixture({ leftoverQuality: 'regular' });
    expect(() => validateDish(dish)).toThrow(DishSchemaError);

    const dishConValorValido = { ...dish, leftoverQuality: 'alta' };
    expect(validateDish(dishConValorValido)).toBe(true);

    expect(() => validateDish(dish)).toThrow(DishSchemaError);
  });
});

describe('energiaCocina — enum cerrado (bajo, medio, alto)', () => {
  it('NEGATIVO: rechaza un valor fuera de enum ("extremo")', () => {
    expect(ENERGIA_COCINA_NIVELES).not.toContain('extremo');
    expect(() => validateDish(validDishFixture({ energiaCocina: 'extremo' }))).toThrow(DishSchemaError);
  });

  it('PRUEBA DE DISCRIMINACION: el rechazo depende del valor, no es un falso positivo estructural', () => {
    const dish = validDishFixture({ energiaCocina: 'extremo' });
    expect(() => validateDish(dish)).toThrow(DishSchemaError);

    const dishConValorValido = { ...dish, energiaCocina: 'medio' };
    expect(validateDish(dishConValorValido)).toBe(true);

    expect(() => validateDish(dish)).toThrow(DishSchemaError);
  });
});
