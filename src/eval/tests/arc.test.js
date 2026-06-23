// Paso 4 (Fase 0.5) — coherenciaArco: domingoReconfortante (effectiveMood) y
// diaFacilTrasElaborado (metadata.facilidad), ambos sobre comida+cena legibles.

import { describe, it, expect } from 'vitest';
import { computeCoherenciaArco } from '../metrics/arc.js';

function meal(time, { density = 'media', facilidad = 'alta' } = {}) {
  return { time, metadata: { facilidad }, _spec: { tmpl: 'caliente_clasico', density } };
}
function noLegible(time) {
  return { time, _spec: { recomposable: false, isFree: true } };
}
function day(name, meals, effectiveMood = 'rutina') {
  return { name, meals, effectiveMood };
}

describe('computeCoherenciaArco — domingoReconfortante', () => {
  it('true cuando Domingo.effectiveMood === "reconfortante" (patrón comfort activo)', () => {
    const plan = {
      days: [day('Domingo', [meal('Comida'), meal('Cena')], 'reconfortante')],
    };
    const result = computeCoherenciaArco(plan);
    expect(result.valor.domingoReconfortante).toBe(true);
    expect(result.evidencias.some((e) => e.includes('effectiveMood: "reconfortante"'))).toBe(true);
  });

  it('false cuando Domingo.effectiveMood no es "reconfortante"', () => {
    const plan = {
      days: [day('Domingo', [meal('Comida'), meal('Cena')], 'libre')],
    };
    const result = computeCoherenciaArco(plan);
    expect(result.valor.domingoReconfortante).toBe(false);
  });

  it('null si no hay día Domingo en plan.days', () => {
    const plan = { days: [day('Lunes', [meal('Comida'), meal('Cena')])] };
    const result = computeCoherenciaArco(plan);
    expect(result.valor.domingoReconfortante).toBeNull();
  });
});

describe('computeCoherenciaArco — diaFacilTrasElaborado', () => {
  it('detecta un día elaborado (facilidad media) seguido de un día fácil (ambas comidas alta)', () => {
    const plan = {
      days: [
        day('Lunes', [meal('Comida', { facilidad: 'media' }), meal('Cena', { facilidad: 'alta' })]),
        day('Martes', [meal('Comida', { facilidad: 'alta' }), meal('Cena', { facilidad: 'alta' })]),
      ],
    };
    const result = computeCoherenciaArco(plan);
    expect(result.valor.diaFacilTrasElaborado).toEqual([{ elaborado: 'Lunes', facilDespues: 'Martes' }]);
  });

  it('no detecta patrón si el día siguiente también es elaborado', () => {
    const plan = {
      days: [
        day('Lunes', [meal('Comida', { facilidad: 'media' }), meal('Cena', { facilidad: 'alta' })]),
        day('Martes', [meal('Comida', { facilidad: 'media' }), meal('Cena', { facilidad: 'alta' })]),
      ],
    };
    const result = computeCoherenciaArco(plan);
    expect(result.valor.diaFacilTrasElaborado).toEqual([]);
  });

  it('excluye de la comparación días con menos de 2 comidas legibles, sin inventar clasificación', () => {
    const plan = {
      days: [
        day('Sábado', [noLegible('Comida'), meal('Cena', { facilidad: 'media' })]),
        day('Domingo', [meal('Comida', { facilidad: 'alta' }), meal('Cena', { facilidad: 'alta' })], 'reconfortante'),
      ],
    };
    const result = computeCoherenciaArco(plan);
    expect(result.valor.diaFacilTrasElaborado).toEqual([]);
    expect(result.evidencias.some((e) => e.includes('Sábado') && e.includes('excluidos'))).toBe(true);
  });
});

describe('computeCoherenciaArco — shape', () => {
  it('status computed, polarity higher_is_better, incluye densidadPorDia', () => {
    const plan = { days: [day('Lunes', [meal('Comida'), meal('Cena')])] };
    const result = computeCoherenciaArco(plan);
    expect(result.status).toBe('computed');
    expect(result.polarity).toBe('higher_is_better');
    expect(result.valor.densidadPorDia.Lunes.status).toBe('computed');
  });
});
