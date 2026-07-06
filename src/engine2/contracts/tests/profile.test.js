// Tests de validateProfile — Fase 4, Componente P0-4. Falsables v1/r1/r2
// segun el prompt de sesion 2026-07-03 (ver DECISIONS.md, asiento de F4-P0).
// Regla ratificada: el validador reconoce UNICAMENTE los campos consumidos
// por P1 — hoy, trainingDays (vocabulario DAYS_ORDER, importado del
// skeleton, no duplicado).

import { describe, it, expect } from 'vitest';
import { validateProfile, ProfileValidationError, INTOLERANCE_VALUES } from '../profile.js';
import { DAYS_ORDER } from '../../skeleton/days.js';

describe('validateProfile — v1: trainingDays valido acepta', () => {
  it('acepta un array de dias del vocabulario DAYS_ORDER', () => {
    expect(validateProfile({ trainingDays: ['Lunes', 'Miercoles'] })).toBe(true);
  });

  it('acepta trainingDays vacio', () => {
    expect(validateProfile({ trainingDays: [] })).toBe(true);
  });
});

describe('validateProfile — r1: dia fuera del vocabulario rechaza nombrando campo y valor', () => {
  it('lanza ProfileValidationError nombrando "trainingDays" y el dia ofensivo', () => {
    expect(() => validateProfile({ trainingDays: ['Lunes', 'Frutas'] })).toThrow(ProfileValidationError);
    try {
      validateProfile({ trainingDays: ['Lunes', 'Frutas'] });
    } catch (err) {
      expect(err.message).toContain('trainingDays');
      expect(err.message).toContain('Frutas');
    }
  });

  it('el vocabulario valido es exactamente DAYS_ORDER (sin duplicar la lista)', () => {
    expect(() => validateProfile({ trainingDays: [...DAYS_ORDER] })).not.toThrow();
  });
});

describe('validateProfile — r2: trainingDays no-array rechaza igual de explicito', () => {
  it('lanza ProfileValidationError nombrando "trainingDays" cuando es un string', () => {
    expect(() => validateProfile({ trainingDays: 'Lunes' })).toThrow(ProfileValidationError);
    try {
      validateProfile({ trainingDays: 'Lunes' });
    } catch (err) {
      expect(err.message).toContain('trainingDays');
    }
  });

  it('lanza cuando trainingDays esta ausente', () => {
    expect(() => validateProfile({})).toThrow(ProfileValidationError);
  });
});

describe('validateProfile — f16: intolerances (D-022, primer consumidor P2), enum cerrado {gluten, lactosa}', () => {
  it('vocabulario cerrado es exactamente [gluten, lactosa]', () => {
    expect(INTOLERANCE_VALUES).toEqual(['gluten', 'lactosa']);
  });

  it('acepta intolerances ausente (campo opcional)', () => {
    expect(validateProfile({ trainingDays: [] })).toBe(true);
  });

  it('acepta intolerances: []', () => {
    expect(validateProfile({ trainingDays: [], intolerances: [] })).toBe(true);
  });

  it('acepta intolerances: ["gluten"]', () => {
    expect(validateProfile({ trainingDays: [], intolerances: ['gluten'] })).toBe(true);
  });

  it('acepta intolerances: ["lactosa"]', () => {
    expect(validateProfile({ trainingDays: [], intolerances: ['lactosa'] })).toBe(true);
  });

  it('acepta intolerances: ["gluten", "lactosa"]', () => {
    expect(validateProfile({ trainingDays: [], intolerances: ['gluten', 'lactosa'] })).toBe(true);
  });

  it('rechaza un valor fuera del enum, nombrando el campo y el valor ofensivo', () => {
    expect(() => validateProfile({ trainingDays: [], intolerances: ['marisco'] })).toThrow(ProfileValidationError);
    try {
      validateProfile({ trainingDays: [], intolerances: ['marisco'] });
    } catch (err) {
      expect(err.message).toContain('intolerances');
      expect(err.message).toContain('marisco');
    }
  });

  it('rechaza intolerances no-array (mismo patron que trainingDays r2)', () => {
    expect(() => validateProfile({ trainingDays: [], intolerances: 'gluten' })).toThrow(ProfileValidationError);
    try {
      validateProfile({ trainingDays: [], intolerances: 'gluten' });
    } catch (err) {
      expect(err.message).toContain('intolerances');
    }
  });
});
