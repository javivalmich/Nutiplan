// compareD2.test.js — Fase 4, Componente P2c (D2). Falsables obligatorios
// del encargo D2: reproducibilidad (seed gobierna el artefacto), honestidad
// de presentacion (no_observable/needs_* nunca lleva numero engine2), y
// que humanScoreAdapter.js no cambio durante D2.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  buildComparisonArtifact, SUBMETRICS, deriveSeed, TRANSLATION_TABLE,
} from './compareD2.js';
import { FIXTURES } from '../../src/engine/tests/baselineFixtures.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

describe('control 1 -- reproducibilidad: misma seed -> mismo artefacto', () => {
  it('dos ejecuciones consecutivas producen JSON.stringify identico (byte a byte)', () => {
    const a1 = buildComparisonArtifact();
    const a2 = buildComparisonArtifact();
    expect(JSON.stringify(a1)).toBe(JSON.stringify(a2));
  });

  it('las 9 seeds derivadas son estables y coinciden con hash(userId+weekNumber)', () => {
    const seeds = FIXTURES.map(deriveSeed);
    expect(seeds).toEqual(FIXTURES.map((f) => `${f.userId}${f.weekNumber}`));
    expect(new Set(seeds).size).toBe(9); // sin colisiones entre las 9 fixtures
  });
});

describe('control 1b -- mutacion de seed produce artefacto distinto', () => {
  it('reconstruir densidadDiaria de fat_loss_general con una seed distinta cambia el valor', async () => {
    const { loadCatalog } = await import('../../src/engine2/dishes/loadCatalog.js');
    const { buildWeekArc } = await import('../../src/engine2/skeleton/buildWeekArc.js');
    const { runWalk } = await import('../../src/engine2/walk/runWalk.js');
    const { adaptHumanScore } = await import('./humanScoreAdapter.js');

    const fixture = FIXTURES.find((f) => f.name === 'fat_loss_general');
    const catalog = loadCatalog();
    const profile = { trainingDays: [], intolerances: [] };

    const seedA = deriveSeed(fixture);
    const seedB = `${seedA}-mutada`;

    function runWith(seed) {
      const { weekArc } = buildWeekArc({ profile, seed, strategy: fixture.expectedStrategy });
      const { slots } = runWalk({
        weekArc, catalog, seed, profile,
      });
      return adaptHumanScore({ slots, catalog });
    }

    const reportA = runWith(seedA);
    const reportB = runWith(seedB);
    expect(JSON.stringify(reportA.densidadDiaria.valor)).not.toBe(JSON.stringify(reportB.densidadDiaria.valor));
  });
});

describe('control 2 -- honestidad de presentacion: no_observable/needs_* jamas lleva numero engine2', () => {
  const artifact = buildComparisonArtifact();

  it('para toda fixture y submetrica con estado no_observable/needs_history/needs_engine2, engine2.valor es null', () => {
    const estadosSinValor = new Set(['no_observable', 'needs_history', 'needs_engine2']);
    for (const fixture of artifact.fixtures) {
      for (const key of SUBMETRICS) {
        const m = fixture.submetrics[key];
        if (estadosSinValor.has(m.engine2.estado)) {
          expect(m.engine2.valor, `${fixture.name}/${key}`).toBeNull();
          expect(m.engine2.valor, `${fixture.name}/${key}`).not.toBe(0);
          expect(m.comparableDirecto, `${fixture.name}/${key}`).toBe(false);
        }
      }
    }
  });

  it('comparableDirecto es true UNICAMENTE para densidadDiaria (unica submetrica con estado completa en D1)', () => {
    for (const fixture of artifact.fixtures) {
      for (const key of SUBMETRICS) {
        const esperado = key === 'densidadDiaria';
        expect(fixture.submetrics[key].comparableDirecto, `${fixture.name}/${key}`).toBe(esperado);
      }
    }
  });

  it('las 9 fixtures del baseline estan presentes y ninguna se inventa', () => {
    expect(artifact.fixtures.map((f) => f.name).sort()).toEqual(FIXTURES.map((f) => f.name).sort());
  });

  it('la tabla de traduccion no aproxima campos sin concepto analogo (goal/weight/activity/hambre/experiencia = SIN_TRADUCCION)', () => {
    const sinTraduccion = TRANSLATION_TABLE.filter((r) => r.analogoEngine2 === 'SIN_TRADUCCION').map((r) => r.campo);
    expect(sinTraduccion.sort()).toEqual(['activity', 'experiencia', 'goal', 'hambre', 'weight'].sort());
  });
});

describe('control 3 -- el adaptador de D1 no cambio durante D2', () => {
  it('sha256 de humanScoreAdapter.js coincide con el registrado antes de empezar D2', () => {
    const adapterPath = path.resolve(__dirname, 'humanScoreAdapter.js');
    const ANTES_DE_D2 = '66cc3b31cd7e83852c3c35f0cce288164a71610c0251be038eb9388b6270d511';
    expect(sha256(adapterPath)).toBe(ANTES_DE_D2);
  });
});
