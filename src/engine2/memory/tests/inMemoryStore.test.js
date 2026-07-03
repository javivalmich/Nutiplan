// Tests de inMemoryStore — Fase 4, Componente P0-2. Falsables v1-v5 segun
// el prompt de sesion 2026-07-03 (ver DECISIONS.md, asiento de F4-P0).
//
// Decisiones ratificadas (no relitigadas aqui): getWeek de semana no
// guardada -> null; saveWeek sobre semana existente -> sobreescribe.

import { describe, it, expect } from 'vitest';
import { createInMemoryStore } from '../inMemoryStore.js';

function samplePlan(tag) {
  return { days: [{ tag }], strategy: 'test', weekWarnings: [], weekProblems: [] };
}

describe('inMemoryStore — v1: roundtrip saveWeek + getWeek', () => {
  it('devuelve exactamente el plan y decisionLog guardados', () => {
    const store = createInMemoryStore();
    const plan = samplePlan('semana-1');
    const decisionLog = [{ causa: 'test' }];

    store.saveWeek('user-a', 1, plan, decisionLog);
    expect(store.getWeek('user-a', 1)).toEqual({ plan, decisionLog });
  });
});

describe('inMemoryStore — v2: aislamiento entre usuarios', () => {
  it('guardar para A no altera getWeek de B', () => {
    const store = createInMemoryStore();
    store.saveWeek('user-a', 1, samplePlan('a'), []);

    expect(store.getWeek('user-b', 1)).toBeNull();
  });
});

describe('inMemoryStore — v3: aislamiento entre semanas del mismo usuario', () => {
  it('guardar semana N+1 no altera getWeek(N); ambas recuperables integras', () => {
    const store = createInMemoryStore();
    const planN = samplePlan('semana-n');
    const planN1 = samplePlan('semana-n+1');

    store.saveWeek('user-a', 5, planN, [{ causa: 'n' }]);
    store.saveWeek('user-a', 6, planN1, [{ causa: 'n+1' }]);

    expect(store.getWeek('user-a', 5)).toEqual({ plan: planN, decisionLog: [{ causa: 'n' }] });
    expect(store.getWeek('user-a', 6)).toEqual({ plan: planN1, decisionLog: [{ causa: 'n+1' }] });
  });
});

describe('inMemoryStore — v4: instancia nueva sin estado previo', () => {
  it('getWeek de una instancia nueva es null', () => {
    const store = createInMemoryStore();
    expect(store.getWeek('cualquiera', 1)).toBeNull();
  });

  it('getRepertoire de una instancia nueva sigue su contrato de vacio (null, sin setter en el contrato)', () => {
    const store = createInMemoryStore();
    expect(store.getRepertoire('cualquiera')).toBeNull();
  });
});

describe('inMemoryStore — v5: sobreescritura (ultimo gana)', () => {
  it('dos saveWeek de la misma semana: getWeek devuelve el segundo', () => {
    const store = createInMemoryStore();
    store.saveWeek('user-a', 1, samplePlan('primero'), [{ causa: 'primero' }]);
    store.saveWeek('user-a', 1, samplePlan('segundo'), [{ causa: 'segundo' }]);

    expect(store.getWeek('user-a', 1)).toEqual({
      plan: samplePlan('segundo'),
      decisionLog: [{ causa: 'segundo' }],
    });
  });
});
