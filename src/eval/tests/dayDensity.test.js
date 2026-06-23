// Paso 4 (Fase 0.5) — classifyDayDensity. Observable: meal._spec.density.

import { describe, it, expect } from 'vitest';
import { classifyDayDensity } from '../dayDensity.js';

function legible(time, density) {
  return { time, _spec: { tmpl: 'caliente_clasico', density } };
}
function noLegible(time) {
  return { time, _spec: { recomposable: false } };
}
function day(meals) {
  return { name: 'X', meals };
}

describe('classifyDayDensity', () => {
  it('denso cuando density(comida)+density(cena) >= 3', () => {
    const d = day([legible('Comida', 'alta'), legible('Cena', 'media')]); // 2+1=3
    expect(classifyDayDensity(d)).toEqual({ status: 'computed', density: 3, classification: 'denso' });
  });

  it('ligero cuando suma <= 1', () => {
    const d = day([legible('Comida', 'baja'), legible('Cena', 'baja')]); // 0+0=0
    expect(classifyDayDensity(d)).toEqual({ status: 'computed', density: 0, classification: 'ligero' });
  });

  it('intermedio cuando suma == 2', () => {
    const d = day([legible('Comida', 'media'), legible('Cena', 'media')]); // 1+1=2
    expect(classifyDayDensity(d)).toEqual({ status: 'computed', density: 2, classification: 'intermedio' });
  });

  it('unknown si falta una comida principal legible (p.ej. sábado libre)', () => {
    const d = day([noLegible('Comida'), legible('Cena', 'media')]);
    expect(classifyDayDensity(d)).toEqual({ status: 'unknown', density: null, classification: null });
  });

  it('unknown si no hay comidas principales en absoluto', () => {
    expect(classifyDayDensity(day([]))).toEqual({ status: 'unknown', density: null, classification: null });
  });
});
