// Fase 0 — trazas QA bajo opts.qaTrace.
//
// WEEK VALIDATION DEBUG dejo de imprimirse incondicionalmente (era un
// console.log siempre activo en buildPlan.js). Su payload, junto con las
// trazas de smartPick (__trace), ahora solo se expone bajo result.qaTrace
// cuando opts.qaTrace === true — clave ausente del todo en caso contrario.

import { describe, it, expect, vi } from 'vitest';
import { buildPlan } from '../buildPlan.js';

const PROFILE = {
  weight:       74,
  goal:         "maintain",
  activity:     "moderate",
  intolerances: [],
  trainingDays: [],
  extras:       {},
  mealsPerDay:  3,
  tiempoCocina: "normal",
  experiencia:  "intermedio",
  simpleMode:   false,
  dob:          "1990-01-01",
  gender:       "male",
  height:       178,
};

const TARGET_KCAL = 2000;

const BASE_OPTS = {
  month:          5,
  weekNumber:     23,
  userId:         'user-qatrace',
  pastProteins:   {},
  freeFormPool:   [],
  saveMealMemory: vi.fn(),
};

function serialiseDays(days) {
  return days.map(({ id: _id, ...rest }) => rest);
}

describe('buildPlan — qaTrace ausente por defecto', () => {
  it('result.qaTrace no existe sin opts.qaTrace', () => {
    const result = buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL, { ...BASE_OPTS, saveMealMemory: vi.fn() });
    expect('qaTrace' in result).toBe(false);
  });

  it('stdout no contiene "WEEK VALIDATION DEBUG" sin opts.qaTrace', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL, { ...BASE_OPTS, saveMealMemory: vi.fn() });
    const loggedWeekValidationDebug = spy.mock.calls.some((args) => args[0] === 'WEEK VALIDATION DEBUG');
    spy.mockRestore();
    expect(loggedWeekValidationDebug).toBe(false);
  });
});

describe('buildPlan — qaTrace presente bajo opts.qaTrace:true', () => {
  it('result.qaTrace tiene el shape aprobado', () => {
    const result = buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL, { ...BASE_OPTS, saveMealMemory: vi.fn(), qaTrace: true });
    expect(result.qaTrace).toBeTruthy();
    expect(result.qaTrace.weekValidation).toMatchObject({
      deductions: expect.any(Number),
      rawScore: expect.any(Number),
    });
    expect(Array.isArray(result.qaTrace.smartPick)).toBe(true);
    expect(result.qaTrace.smartPick.length).toBeGreaterThan(0);
    for (const entry of result.qaTrace.smartPick) {
      expect(entry).toHaveProperty('winnerId');
      expect(entry).toHaveProperty('scored');
      expect(entry).toHaveProperty('reasonWinner');
    }
  });

  it('stdout sigue sin "WEEK VALIDATION DEBUG" aunque opts.qaTrace:true (no se reintroduce console.log)', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL, { ...BASE_OPTS, saveMealMemory: vi.fn(), qaTrace: true });
    const loggedWeekValidationDebug = spy.mock.calls.some((args) => args[0] === 'WEEK VALIDATION DEBUG');
    spy.mockRestore();
    expect(loggedWeekValidationDebug).toBe(false);
  });

  it('ningun reasonWinner es "unknown" en esta corrida (si aparece, es HALLAZGO, no esperado)', () => {
    const result = buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL, { ...BASE_OPTS, saveMealMemory: vi.fn(), qaTrace: true });
    const unknowns = result.qaTrace.smartPick.filter((e) => e.reasonWinner === 'unknown');
    expect(unknowns).toEqual([]);
  });
});

describe('buildPlan — qaTrace es puramente observacional (test de no-perturbación)', () => {
  it('mismo userId+weekNumber: result.days es byte-idéntico con y sin opts.qaTrace (excluyendo day.id)', () => {
    const withTrace = buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL, { ...BASE_OPTS, saveMealMemory: vi.fn(), qaTrace: true });
    const withoutTrace = buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL, { ...BASE_OPTS, saveMealMemory: vi.fn() });
    expect(JSON.stringify(serialiseDays(withTrace.days))).toBe(JSON.stringify(serialiseDays(withoutTrace.days)));
  });

  it('mismo userId+weekNumber: weekWarnings/weekProblems/weekScore son idénticos con y sin opts.qaTrace', () => {
    const withTrace = buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL, { ...BASE_OPTS, saveMealMemory: vi.fn(), qaTrace: true });
    const withoutTrace = buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL, { ...BASE_OPTS, saveMealMemory: vi.fn() });
    expect(withTrace.weekScore).toBe(withoutTrace.weekScore);
    expect(JSON.stringify(withTrace.weekWarnings)).toBe(JSON.stringify(withoutTrace.weekWarnings));
    expect(JSON.stringify(withTrace.weekProblems)).toBe(JSON.stringify(withoutTrace.weekProblems));
  });
});

describe('buildPlan — opts.trace existente queda intacto (no se fusiona con qaTrace)', () => {
  it('opts.trace:true sigue logueando "[smartPick TRACE]" por stdout, sin result.qaTrace', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL, { ...BASE_OPTS, saveMealMemory: vi.fn(), trace: true });
    const loggedSmartPickTrace = spy.mock.calls.some((args) => args[0] === '[smartPick TRACE]');
    spy.mockRestore();
    expect(loggedSmartPickTrace).toBe(true);
    expect('qaTrace' in result).toBe(false);
  });
});
