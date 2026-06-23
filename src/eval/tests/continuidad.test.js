// Paso 5 (Fase 0.5) — continuidadEntrenoHidrato. Observable: day.special ===
// "entrenamiento" + cena._spec.C (hidrato).

import { describe, it, expect } from 'vitest';
import { computeContinuidadEntrenoHidrato } from '../metrics/continuidad.js';

function cena(C) {
  return { time: 'Cena', _spec: { tmpl: 'caliente_clasico', P: 'pollo', C } };
}
function cenaNoLegible() {
  return { time: 'Cena', _spec: { recomposable: false } };
}
function day(name, special, meals) {
  return { name, special, meals };
}

describe('computeContinuidadEntrenoHidrato', () => {
  it('detecta hidrato presente en cena de día de entrenamiento', () => {
    const plan = { days: [day('Lunes', 'entrenamiento', [cena('arroz')])] };
    const result = computeContinuidadEntrenoHidrato(plan);
    expect(result.status).toBe('computed');
    expect(result.polarity).toBe('higher_is_better');
    expect(result.valor.conHidrato).toBe(1);
    expect(result.evidencias).toContain('Lunes (entrenamiento) → cena con hidrato (arroz)');
  });

  it('detecta ausencia de hidrato (_spec.C null) en cena de día de entrenamiento', () => {
    const plan = { days: [day('Martes', 'entrenamiento', [cena(null)])] };
    const result = computeContinuidadEntrenoHidrato(plan);
    expect(result.valor.conHidrato).toBe(0);
    expect(result.evidencias).toContain('Martes (entrenamiento) → cena sin hidrato (_spec.C ausente)');
  });

  it('ignora días sin day.special==="entrenamiento"', () => {
    const plan = { days: [day('Miércoles', null, [cena('patata')])] };
    const result = computeContinuidadEntrenoHidrato(plan);
    expect(result.valor).toBeNull();
    expect(result.evidencias[0]).toMatch(/No hay días/);
  });

  it('cena no legible en día de entrenamiento queda excluida, no inventa clasificación', () => {
    const plan = { days: [day('Jueves', 'entrenamiento', [cenaNoLegible()])] };
    const result = computeContinuidadEntrenoHidrato(plan);
    expect(result.valor.deTotalComputados).toBe(0);
    expect(result.evidencias).toContain('Jueves (entrenamiento) → cena no legible, excluido de la comparación');
  });
});
