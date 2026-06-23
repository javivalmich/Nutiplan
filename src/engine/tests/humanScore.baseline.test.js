// Paso 6 (Fase 0.5) — integración: humanScore sobre las 9 fixtures reales del
// baseline aprobado (buildPlan.baseline.test.js). Vive en src/engine/tests/
// (no en src/eval/) porque combina buildPlan (engine) + humanScore (eval) —
// el tripwire inverso prohíbe que código bajo src/eval/** importe el motor,
// no que un test de integración externo combine ambos para medir.
//
// Además de la snapshot de vitest (abajo), este test vuelca el resultado a
// src/eval/baseline.json: el artefacto versionado contra el que se medirá
// engine2 (CLAUDE.md). Con el orden de claves estable de humanScore, el
// artefacto es determinista byte a byte salvo por day.id (excluido, igual
// que en buildPlan.baseline.test.js, por el no-determinismo conocido de
// planSeed=Date.now(), buildPlan.js:2261).

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIXTURES, runBaseline } from './baselineFixtures.js';
import { humanScore } from '../../eval/humanScore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASELINE_ARTIFACT_PATH = path.resolve(__dirname, '../../eval/baseline.json');

describe('humanScore — integración sobre las 9 fixtures del baseline', () => {
  it.each(FIXTURES.map((f) => [f.name, f]))('%s — humanScore(result) coincide con la snapshot congelada', (_name, fixture) => {
    const result = runBaseline(fixture);
    const score = humanScore(result);
    expect(score).toMatchSnapshot(fixture.name);
  });

  it('artefacto versionado src/eval/baseline.json existe y está sincronizado con las 9 fixtures', () => {
    const computed = {};
    for (const fixture of FIXTURES) {
      const result = runBaseline(fixture);
      computed[fixture.name] = humanScore(result);
    }
    expect(fs.existsSync(BASELINE_ARTIFACT_PATH)).toBe(true);
    const onDisk = JSON.parse(fs.readFileSync(BASELINE_ARTIFACT_PATH, 'utf8'));
    expect(onDisk).toEqual(computed);
  });
});
