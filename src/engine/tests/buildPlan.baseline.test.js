// Fase 0 — baseline de snapshots por la ruta REAL de seed de produccion
// (hash(userId + weekNumber), sin opts.rng). Ver CLAUDE.md y el gate del
// Paso 6: tabla estrategia -> perfil aprobada explicitamente antes de
// generar estos fixtures.
//
// Distinto del snapshot dorado existente (buildPlan.snapshot.test.js, que
// usa opts.rng manual) — este archivo NO lo toca ni lo reemplaza. Cada
// fixture aqui tiene su propio __snapshots__/buildPlan.baseline.test.js.snap.

import { describe, it, expect } from 'vitest';
import { computeStrategy } from '../nutrition.js';
import { _hashStr } from '../hash.js';
import { mulberry32 } from '../rng.js';
import { FIXTURES, buildProfile, runBaseline, serialiseDays } from './baselineFixtures.js';

describe('baseline — gate: ningún perfil define strategyOverride', () => {
  it.each(FIXTURES.map((f) => [f.name, f]))('%s no define profile.strategyOverride', (_name, fixture) => {
    expect(fixture.profile.strategyOverride).toBeUndefined();
  });
});

describe('baseline — gate: computeStrategy(perfil) coincide con la tabla aprobada', () => {
  it.each(FIXTURES.map((f) => [f.name, f]))('%s → computeStrategy = %s', (_name, fixture) => {
    expect(computeStrategy(buildProfile(fixture.profile))).toBe(fixture.expectedStrategy);
  });
});

describe('baseline — snapshots congelados (ruta hash(userId+weekNumber), sin opts.rng)', () => {
  it.each(FIXTURES.map((f) => [f.name, f]))('%s — result.strategy y result.days', (_name, fixture) => {
    const result = runBaseline(fixture);
    expect(result.strategy).toBe(fixture.expectedStrategy);
    expect(serialiseDays(result.days)).toMatchSnapshot(fixture.name);
  });
});

describe('baseline — confirmación 2: las ramas de los 3 perfiles extra SE EJECUTAN', () => {
  it('intolerancias (lactosa) → "bebida vegetal" sustituye a "leche semidesnatada" en el desayuno', () => {
    const fixture = FIXTURES.find((f) => f.name.includes('intolerancias'));
    const result = runBaseline(fixture);
    const json = JSON.stringify(result.days);
    expect(json).toContain('bebida vegetal');
    expect(json).not.toContain('leche semidesnatada');
    expect(json).not.toContain('yogur griego');
  });

  it('trainingDays → cada día de entreno tiene special:"entrenamiento"', () => {
    const fixture = FIXTURES.find((f) => f.name.includes('trainingDays'));
    const result = runBaseline(fixture);
    for (const day of fixture.profile.trainingDays) {
      const dayObj = result.days.find((d) => d.name === day);
      expect(dayObj).toBeTruthy();
      expect(dayObj.special).toBe('entrenamiento');
    }
  });

  it('isSimple (experiencia novato) → useWildcard queda desactivado: ningún meal tiene wildcard:true', () => {
    const fixture = FIXTURES.find((f) => f.name.includes('isSimple'));
    const result = runBaseline(fixture);
    const anyWildcard = result.days.some((d) => d.meals.some((m) => m && m.wildcard === true));
    expect(anyWildcard).toBe(false);
  });

  it('isSimple → mismo userId+weekNumber, solo cambia simpleMode/experiencia: el plan resultante es distinto al no-simple equivalente (la rama altera la secuencia de _rnd)', () => {
    const fixture = FIXTURES.find((f) => f.name.includes('isSimple'));
    const simpleResult = runBaseline(fixture);
    const nonSimpleResult = runBaseline({
      ...fixture,
      profile: { ...fixture.profile, experiencia: 'intermedio' },
    });
    expect(JSON.stringify(serialiseDays(simpleResult.days)))
      .not.toBe(JSON.stringify(serialiseDays(nonSimpleResult.days)));
  });
});

describe('baseline — confirmación 3: la ruta sin opts.rng usa de verdad mulberry32(_hashStr(userId+weekNumber))', () => {
  it('reproducir manualmente la fórmula documentada en buildPlan.js:26 da un plan byte-idéntico al de no pasar opts.rng', () => {
    const fixture = FIXTURES.find((f) => f.name.startsWith('mantenimiento_equilibrado (base)'));

    const manualSeed = _hashStr(String(fixture.userId) + ':' + fixture.weekNumber);
    const manualRng = mulberry32(manualSeed);

    const viaProductionPath = runBaseline(fixture); // sin opts.rng — usa el fallback interno
    const viaManualFormula = runBaseline(fixture, { rng: manualRng }); // mismo cálculo, hecho a mano aquí

    expect(serialiseDays(viaProductionPath.days)).toEqual(serialiseDays(viaManualFormula.days));

    // Y de control: una semilla manual distinta (otro hash) NO coincide —
    // confirma que la igualdad de arriba no es casualidad/aleatoriedad fija.
    const wrongRng = mulberry32(manualSeed + 1);
    const viaWrongFormula = runBaseline(fixture, { rng: wrongRng });
    expect(JSON.stringify(serialiseDays(viaWrongFormula.days)))
      .not.toBe(JSON.stringify(serialiseDays(viaProductionPath.days)));
  });
});

describe('baseline — hallazgo: ningún reasonWinner es "unknown" en ninguna fixture', () => {
  it.each(FIXTURES.map((f) => [f.name, f]))('%s — qaTrace.smartPick no contiene reasonWinner:"unknown"', (_name, fixture) => {
    const result = runBaseline(fixture, { qaTrace: true });
    const unknowns = result.qaTrace.smartPick.filter((e) => e.reasonWinner === 'unknown');
    expect(unknowns).toEqual([]);
  });
});
