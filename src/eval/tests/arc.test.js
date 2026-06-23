// Paso 4 (Fase 0.5) — domingoReconfortante (effectiveMood), diaFacilTrasElaborado
// (metadata.facilidad) y densidadDiaria (classifyDayDensity), tres sub-métricas
// independientes sobre comida+cena legibles.

import { describe, it, expect } from 'vitest';
import { computeDensidadDiaria, computeDomingoReconfortante, computeDiaFacilTrasElaborado } from '../metrics/arc.js';

function meal(time, { density = 'media', facilidad = 'alta' } = {}) {
  return { time, metadata: { facilidad }, _spec: { tmpl: 'caliente_clasico', density } };
}
function noLegible(time) {
  return { time, _spec: { recomposable: false, isFree: true } };
}
function day(name, meals, effectiveMood = 'rutina') {
  return { name, meals, effectiveMood };
}

describe('computeDomingoReconfortante', () => {
  it('true cuando Domingo.effectiveMood === "reconfortante" (patrón comfort activo)', () => {
    const plan = { days: [day('Domingo', [meal('Comida'), meal('Cena')], 'reconfortante')] };
    const result = computeDomingoReconfortante(plan);
    expect(result.status).toBe('computed');
    expect(result.polarity).toBe('higher_is_better');
    expect(result.valor).toBe(true);
    expect(result.evidencias.some((e) => e.includes('effectiveMood: "reconfortante"'))).toBe(true);
  });

  it('false cuando Domingo.effectiveMood no es "reconfortante"', () => {
    const plan = { days: [day('Domingo', [meal('Comida'), meal('Cena')], 'libre')] };
    expect(computeDomingoReconfortante(plan).valor).toBe(false);
  });

  it('null si no hay día Domingo en plan.days', () => {
    const plan = { days: [day('Lunes', [meal('Comida'), meal('Cena')])] };
    expect(computeDomingoReconfortante(plan).valor).toBeNull();
  });
});

describe('computeDiaFacilTrasElaborado', () => {
  it('detecta un día elaborado (facilidad media) seguido de un día fácil (ambas comidas alta)', () => {
    const plan = {
      days: [
        day('Lunes', [meal('Comida', { facilidad: 'media' }), meal('Cena', { facilidad: 'alta' })]),
        day('Martes', [meal('Comida', { facilidad: 'alta' }), meal('Cena', { facilidad: 'alta' })]),
      ],
    };
    const result = computeDiaFacilTrasElaborado(plan);
    expect(result.status).toBe('computed');
    expect(result.polarity).toBe('higher_is_better');
    expect(result.valor).toEqual([{ elaborado: 'Lunes', facilDespues: 'Martes' }]);
  });

  it('no detecta patrón si el día siguiente también es elaborado', () => {
    const plan = {
      days: [
        day('Lunes', [meal('Comida', { facilidad: 'media' }), meal('Cena', { facilidad: 'alta' })]),
        day('Martes', [meal('Comida', { facilidad: 'media' }), meal('Cena', { facilidad: 'alta' })]),
      ],
    };
    expect(computeDiaFacilTrasElaborado(plan).valor).toEqual([]);
  });

  it('excluye de la comparación días con menos de 2 comidas legibles, sin inventar clasificación', () => {
    const plan = {
      days: [
        day('Sábado', [noLegible('Comida'), meal('Cena', { facilidad: 'media' })]),
        day('Domingo', [meal('Comida', { facilidad: 'alta' }), meal('Cena', { facilidad: 'alta' })], 'reconfortante'),
      ],
    };
    const result = computeDiaFacilTrasElaborado(plan);
    expect(result.valor).toEqual([]);
    expect(result.evidencias.some((e) => e.includes('Sábado') && e.includes('excluidos'))).toBe(true);
  });
});

describe('computeDensidadDiaria', () => {
  it('status computed, polarity null (diagnóstico), incluye clasificación por día', () => {
    const plan = { days: [day('Lunes', [meal('Comida'), meal('Cena')])] };
    const result = computeDensidadDiaria(plan);
    expect(result.status).toBe('computed');
    expect(result.polarity).toBeNull();
    expect(result.valor.Lunes.status).toBe('computed');
  });
});
