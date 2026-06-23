// Paso 1 (Fase 0.5) — shape base de humanScore + stubs needs_history, sin
// lógica de negocio. Contrato: ver CLAUDE.md y src/eval/humanScore.js.

import { describe, it, expect } from 'vitest';
import { humanScore } from '../humanScore.js';

function fakePlanMinimal() {
  return { days: [], weekWarnings: [], weekScore: 0 };
}

const VALID_STATUSES = ['computed', 'needs_history', 'needs_engine2'];
const VALID_POLARITIES = ['lower_is_better', 'higher_is_better', 'target_range', null];

describe('humanScore — shape base', () => {
  it('es una función con firma humanScore(plan, { history } = {})', () => {
    expect(typeof humanScore).toBe('function');
    expect(humanScore.length).toBe(1);
  });

  it('no lanza si no se pasa history', () => {
    expect(() => humanScore(fakePlanMinimal())).not.toThrow();
  });

  it('devuelve un OBJETO de sub-métricas, nunca un escalar ni un array', () => {
    const result = humanScore(fakePlanMinimal());
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(false);
  });

  it('cada sub-métrica respeta el contrato { valor, status, evidencias, polarity }', () => {
    const result = humanScore(fakePlanMinimal());
    for (const metric of Object.values(result)) {
      expect(metric).toHaveProperty('valor');
      expect(VALID_STATUSES).toContain(metric.status);
      expect(Array.isArray(metric.evidencias)).toBe(true);
      expect(VALID_POLARITIES).toContain(metric.polarity);
    }
  });

  it('orden de claves es determinista entre llamadas (apto para snapshot)', () => {
    const a = Object.keys(humanScore(fakePlanMinimal()));
    const b = Object.keys(humanScore(fakePlanMinimal()));
    expect(a).toEqual(b);
  });

  it('stubs needs_history conocidos: repeticionProteinaMismoDia, sorpresaEditorial', () => {
    const result = humanScore(fakePlanMinimal());
    expect(result.repeticionProteinaMismoDia.status).toBe('needs_history');
    expect(result.repeticionProteinaMismoDia.valor).toBeNull();
    expect(result.sorpresaEditorial.status).toBe('needs_history');
    expect(result.sorpresaEditorial.valor).toBeNull();
  });

  it('sub-métricas computadas (Paso 3): repeticionSalsa, repeticionTecnica, platoCuchara', () => {
    const result = humanScore(fakePlanMinimal());
    expect(result.repeticionSalsa.status).toBe('computed');
    expect(result.repeticionTecnica.status).toBe('computed');
    expect(result.platoCuchara.status).toBe('computed');
  });

  it('sub-métrica computada (Paso 4): coherenciaArco', () => {
    const result = humanScore(fakePlanMinimal());
    expect(result.coherenciaArco.status).toBe('computed');
  });
});
