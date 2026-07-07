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

// f10 (D-024, F4-P2b-ii): guardarrail de politica -- valores LITERALES
// ratificados. Solo este test se toca si la politica cambia (p.ej. la
// pregunta abierta de F5 sobre legumbre->4 se resuelve). NO es uno de los
// tripwires constitucionales de CI (no-score/eval-isolation/
// engine-isolation/platetype-enum) -- deliberadamente sin la palabra
// "tripwire" en el nombre para no colisionar con el filtro
// `-t "tripwire"` que el ritual usa para verificar esos 4 guardianes.
describe('WeeklyTargets — f10: guardarrail de politica (D-024) — valores ratificados literales', () => {
  it('DEFAULT_WEEKLY_TARGETS === {pescado:3, legumbre:3, verduraDiaria:1}', () => {
    expect(DEFAULT_WEEKLY_TARGETS).toEqual({ pescado: 3, legumbre: 3, verduraDiaria: 1 });
  });
});
