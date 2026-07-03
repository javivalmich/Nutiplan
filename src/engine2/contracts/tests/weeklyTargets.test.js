// Tests de WeeklyTargets — Fase 4, Componente P0-3. Falsables v1/v2 segun
// el prompt de sesion 2026-07-03 (ver DECISIONS.md, asiento de F4-P0).
// Sin consumidor en P0 por diseño (declarado, no accidental).

import { describe, it, expect } from 'vitest';
import { DEFAULT_WEEKLY_TARGETS, WEEKLY_TARGETS_FIELDS, isWeeklyTargetsShape } from '../weeklyTargets.js';

describe('WeeklyTargets — v1: DEFAULT_WEEKLY_TARGETS es inmutable', () => {
  it('reasignar un campo lanza en modo estricto', () => {
    expect(() => {
      DEFAULT_WEEKLY_TARGETS.pescado = 99;
    }).toThrow(TypeError);
  });

  it('esta congelado (Object.isFrozen)', () => {
    expect(Object.isFrozen(DEFAULT_WEEKLY_TARGETS)).toBe(true);
  });
});

describe('WeeklyTargets — v2: el default cumple el shape declarado', () => {
  it('DEFAULT_WEEKLY_TARGETS satisface isWeeklyTargetsShape', () => {
    expect(isWeeklyTargetsShape(DEFAULT_WEEKLY_TARGETS)).toBe(true);
  });

  it('contiene exactamente los campos declarados en WEEKLY_TARGETS_FIELDS', () => {
    expect(Object.keys(DEFAULT_WEEKLY_TARGETS).sort()).toEqual([...WEEKLY_TARGETS_FIELDS].sort());
  });
});
