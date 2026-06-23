// Paso 3 (Fase 0.5) — repeticionSalsa y repeticionTecnica. Solo operan sobre
// comida+cena legibles; desayuno/libre/freeForm no participan (decisión 5).

import { describe, it, expect } from 'vitest';
import { computeRepeticionSalsa, computeRepeticionTecnica } from '../metrics/repetition.js';

function legibleMeal(time, overrides = {}) {
  return {
    time,
    _spec: { tmpl: 'caliente_clasico', P: 'pollo', C: 'arroz', V: 'brocoli', S: 'mostaza_miel', cookM: 'plancha', ...overrides },
  };
}

function breakfastMeal() {
  return { time: 'Desayuno', _spec: { recomposable: false } };
}

function freeFormMeal(time) {
  return { time, _spec: { freeForm: true, identity: { protein: 'pollo' }, nutrition: {}, behavior: {} } };
}

function libreMeal() {
  return { time: 'Comida', _spec: { recomposable: false, isFree: true } };
}

function day(name, meals) {
  return { name, meals };
}

describe('computeRepeticionSalsa', () => {
  it('cuenta repeticiones de S solo en comida/cena legibles, ignora desayuno/libre/freeForm', () => {
    const plan = {
      days: [
        day('Lunes', [breakfastMeal(), legibleMeal('Comida', { S: 'mostaza_miel' }), legibleMeal('Cena', { S: 'ajillo' })]),
        day('Martes', [breakfastMeal(), legibleMeal('Comida', { S: 'mostaza_miel' }), legibleMeal('Cena', { S: 'ajillo' })]),
        day('Miércoles', [breakfastMeal(), libreMeal(), legibleMeal('Cena', { S: 'mostaza_miel' })]),
        day('Jueves', [breakfastMeal(), freeFormMeal('Comida'), legibleMeal('Cena', { S: 'limon_hierbas' })]),
      ],
    };
    const result = computeRepeticionSalsa(plan);
    expect(result.status).toBe('computed');
    expect(result.polarity).toBe('lower_is_better');
    expect(result.valor.conteos).toEqual({ mostaza_miel: 3, ajillo: 2, limon_hierbas: 1 });
    expect(result.valor.repeticionesDestacadas).toEqual([{ value: 'mostaza_miel', count: 3 }]);
  });

  it('evidencias son auditables: incluyen valor, conteo y ubicación temporal exacta', () => {
    const plan = {
      days: [
        day('Lunes', [legibleMeal('Comida', { S: 'mostaza_miel' })]),
        day('Jueves', [legibleMeal('Cena', { S: 'mostaza_miel' })]),
        day('Sábado', [legibleMeal('Comida', { S: 'mostaza_miel' })]),
      ],
    };
    const result = computeRepeticionSalsa(plan);
    expect(result.evidencias).toContain('mostaza_miel aparece 3 veces: lunes comida, jueves cena, sábado comida');
  });

  it('sin repetición (count 1) no genera evidencia, pero sí cuenta', () => {
    const plan = { days: [day('Lunes', [legibleMeal('Comida', { S: 'ajillo' })])] };
    const result = computeRepeticionSalsa(plan);
    expect(result.valor.conteos).toEqual({ ajillo: 1 });
    expect(result.evidencias).toEqual([]);
  });

  it('meal sin S (null) no se cuenta', () => {
    const plan = { days: [day('Lunes', [legibleMeal('Comida', { S: null })])] };
    const result = computeRepeticionSalsa(plan);
    expect(result.valor.conteos).toEqual({});
  });

  it('plan sin days no lanza error', () => {
    expect(() => computeRepeticionSalsa({ days: [] })).not.toThrow();
  });
});

describe('computeRepeticionTecnica', () => {
  it('cuenta repeticiones de cookM solo en comida/cena legibles', () => {
    const plan = {
      days: [
        day('Lunes', [legibleMeal('Comida', { cookM: 'horno' }), legibleMeal('Cena', { cookM: 'plancha' })]),
        day('Martes', [legibleMeal('Comida', { cookM: 'horno' }), legibleMeal('Cena', { cookM: 'horno' })]),
      ],
    };
    const result = computeRepeticionTecnica(plan);
    expect(result.valor.conteos).toEqual({ horno: 3, plancha: 1 });
    expect(result.valor.repeticionesDestacadas).toEqual([{ value: 'horno', count: 3 }]);
  });
});
