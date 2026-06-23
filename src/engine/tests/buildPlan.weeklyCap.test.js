// BUG 5 (Fase 1, Checkpoint 6) — valores nuevos de WEEKLY_CAP, verificados
// contra recomendaciones AESAN 2022 (decisión del usuario, no del motor):
//   pescado 2→3, legumbre 2→4, ave 4→3 (marisco/pasta/ternera/cerdo sin cambios)
//
// El leak estructural de los días de entreno (TRAINING_DINNERS bypasa
// exceedsWeeklyCap) NO se toca aquí — documentado como deuda, Fase 5.
//
// legumbre: en un barrido de 1200 combinaciones (6 estrategias × 200
// weekNumber, sin trainingDays) el conteo real de legumbre NUNCA superó 2,
// ni con el cap viejo ni con el nuevo — el cap no era vinculante en la
// práctica. No se escribe test de "legumbre permite 4" porque no hay
// ningún escenario real que lo demuestre sin fabricar uno artificial.

import { describe, it, expect } from 'vitest';
import { FIXTURES, runBaseline } from './baselineFixtures.js';

describe('buildPlan — WEEKLY_CAP.ave=3 bloquea la 4ª ave en selección normal (BUG 5)', () => {
  it('fixtures sin trainingDays (sin leak) nunca superan 3 unidades de "ave"', () => {
    const sinTrainingDays = FIXTURES.filter((f) => (f.profile.trainingDays || []).length === 0);
    expect(sinTrainingDays.length).toBeGreaterThan(0);
    sinTrainingDays.forEach((fixture) => {
      const result = runBaseline(fixture, { qaTrace: true });
      const ave = result.qaTrace.weekValidation.weeklyProteinCount.ave || 0;
      expect(ave, `${fixture.name}: ave=${ave} debería estar capado en 3`).toBeLessThanOrEqual(3);
    });
  });
});

describe('buildPlan — WEEKLY_CAP.pescado=3 permite un 3er pescado donde antes se bloqueaba (BUG 5)', () => {
  it('al menos un fixture real alcanza pescado=3 (antes el cap lo bloqueaba en 2)', () => {
    const conTres = FIXTURES.some((fixture) => {
      const result = runBaseline(fixture, { qaTrace: true });
      return (result.qaTrace.weekValidation.weeklyProteinCount.pescado || 0) === 3;
    });
    expect(conTres).toBe(true);
  });

  it('ningún fixture supera 3 (el cap sigue siendo un tope real, no se ha eliminado)', () => {
    FIXTURES.forEach((fixture) => {
      const result = runBaseline(fixture, { qaTrace: true });
      const pescado = result.qaTrace.weekValidation.weeklyProteinCount.pescado || 0;
      expect(pescado, `${fixture.name}: pescado=${pescado}`).toBeLessThanOrEqual(3);
    });
  });
});

describe('buildPlan — el aviso de ave lee el umbral real, no un número hardcodeado (BUG 5 + DRY de Checkpoint 5)', () => {
  it('definicion_flexible (ave=3, justo en el cap): NO dispara el aviso', () => {
    const fixture = FIXTURES.find((f) => f.name === 'definicion_flexible');
    const result = runBaseline(fixture, { qaTrace: true });
    expect(result.qaTrace.weekValidation.weeklyProteinCount.ave).toBe(3);
    expect(result.weekWarnings.some((w) => w.includes('Demasiada ave'))).toBe(false);
  });

  it('definicion_saciante (ave=4, por encima del cap por el leak de entreno): SÍ dispara el aviso con el conteo real', () => {
    const fixture = FIXTURES.find((f) => f.name === 'definicion_saciante');
    const result = runBaseline(fixture, { qaTrace: true });
    const ave = result.qaTrace.weekValidation.weeklyProteinCount.ave;
    expect(ave).toBe(4);
    const warning = result.weekWarnings.find((w) => w.includes('Demasiada ave'));
    expect(warning).toBeTruthy();
    // El texto refleja el conteo real (4), no el cap (3) ni ningún literal fijo.
    expect(warning).toContain('(4 veces)');
  });
});
