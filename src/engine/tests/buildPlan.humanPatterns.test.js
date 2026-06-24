// BUG 2 (Fase 1, Checkpoint 1) — belovedRepeat tenía 0 consumidores en todo
// el repo (selección, scoring, validación, snapshots, trazas QA, salida
// pública) y se eliminó por completo junto con su tirada de _rnd(). Este
// test es una regresión estática: si el campo reaparece en HUMAN_PATTERNS,
// debe fallar.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_PLAN_PATH = path.resolve(__dirname, '../buildPlan.js');

describe('buildPlan — HUMAN_PATTERNS ya no expone belovedRepeat (BUG 2)', () => {
  it('el código fuente no contiene la cadena "belovedRepeat"', () => {
    const code = fs.readFileSync(BUILD_PLAN_PATH, 'utf8');
    expect(code).not.toMatch(/belovedRepeat/);
  });

  it('HUMAN_PATTERNS conserva exactamente sus 3 claves vivas', () => {
    const code = fs.readFileSync(BUILD_PLAN_PATH, 'utf8');
    const match = code.match(/var HUMAN_PATTERNS = \{([\s\S]*?)\};/);
    expect(match).not.toBeNull();
    const body = match[1];
    expect(body).toMatch(/tuesdayRoutine/);
    expect(body).toMatch(/fridayFatigue/);
    expect(body).toMatch(/sundayComfort/);
  });
});
