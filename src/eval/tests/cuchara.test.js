// Paso 3 (Fase 0.5) — platoCuchara = _spec.tmpl ∈ {'legumbre','sopa_crema'},
// idéntico a metadata.comfort del motor (buildPlan.js:689) por decisión
// explícita. caliente_clasico (guisos/estofados incluidos) NO cuenta como
// cuchara: limitación conocida y aceptada del motor, no proxy heurístico.

import { describe, it, expect } from 'vitest';
import { computePlatoCuchara } from '../metrics/cuchara.js';

function meal(time, tmpl) {
  return { time, _spec: { tmpl, P: 'pollo', C: 'arroz', V: 'brocoli', S: 'ajillo', cookM: 'plancha' } };
}

function day(name, meals) {
  return { name, meals };
}

describe('computePlatoCuchara', () => {
  it('cuenta legumbre y sopa_crema, ignora caliente_clasico (incluidos guisados con S/cookM "guisado")', () => {
    const plan = {
      days: [
        day('Lunes', [meal('Comida', 'legumbre'), meal('Cena', 'caliente_clasico')]),
        day('Martes', [meal('Comida', 'sopa_crema'), meal('Cena', 'caliente_clasico')]),
        day('Miércoles', [meal('Comida', 'pasta'), meal('Cena', 'bowl')]),
      ],
    };
    const result = computePlatoCuchara(plan);
    expect(result.status).toBe('computed');
    expect(result.polarity).toBe('lower_is_better');
    expect(result.valor.count).toBe(2);
    expect(result.valor.ocurrencias).toEqual([
      { day: 'Lunes', time: 'Comida' },
      { day: 'Martes', time: 'Comida' },
    ]);
  });

  it('un guisado clasificado como caliente_clasico NO cuenta como cuchara (límite del motor, no del checker)', () => {
    const guisoEnCajonGenerico = meal('Cena', 'caliente_clasico');
    guisoEnCajonGenerico._spec.cookM = 'guisado';
    const plan = { days: [day('Lunes', [guisoEnCajonGenerico])] };
    const result = computePlatoCuchara(plan);
    expect(result.valor.count).toBe(0);
  });

  it('evidencia incluye ubicación temporal exacta', () => {
    const plan = { days: [day('Jueves', [meal('Cena', 'legumbre')])] };
    const result = computePlatoCuchara(plan);
    expect(result.evidencias).toContain('plato de cuchara (tmpl legumbre/sopa_crema) aparece 1 veces: jueves cena');
  });

  it('umbral provisional (>=4) genera evidencia adicional al alcanzarse', () => {
    const plan = {
      days: [
        day('Lunes', [meal('Comida', 'legumbre')]),
        day('Martes', [meal('Comida', 'sopa_crema')]),
        day('Miércoles', [meal('Cena', 'legumbre')]),
        day('Jueves', [meal('Cena', 'sopa_crema')]),
      ],
    };
    const result = computePlatoCuchara(plan);
    expect(result.valor.count).toBe(4);
    expect(result.evidencias.some((e) => e.includes('umbral provisional'))).toBe(true);
  });

  it('sin cuchara en la semana: count 0, sin evidencias', () => {
    const plan = { days: [day('Lunes', [meal('Comida', 'pasta')])] };
    const result = computePlatoCuchara(plan);
    expect(result.valor.count).toBe(0);
    expect(result.evidencias).toEqual([]);
  });
});
