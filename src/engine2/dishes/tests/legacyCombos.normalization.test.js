// Fase 2, Paso B.1 (correccion) — invariante de seguridad de las
// normalizaciones de legacyCombos.data.js.
//
// legacyCombos.data.js es un SNAPSHOT NORMALIZADO (paritario salvo
// colapso documentado de colisiones de identidad), no una copia
// inmutable byte a byte de buildPlan.js. La propiedad que debe
// preservarse es COMPORTAMIENTO OBSERVABLE identico al motor vivo, no
// igualdad literal de arrays.
//
// Invariante de seguridad: tras CUALQUIER normalizacion, los snapshots
// dorados post-Fase-1 (generados por la suite de buildPlan.js, motor
// vivo congelado) siguen IDENTICOS byte a byte. legacyCombos.data.js no
// es importado por buildPlan.js ni por la suite que produce esos
// snapshots, asi que esto deberia cumplirse por construccion — este test
// fija esa garantia con un hash SHA-256, para que no se rompa por
// accidente en el futuro si alguien empieza a usar esta copia desde el
// motor vivo o a tocar buildPlan.js "para sincronizar".
//
// Hashes de referencia capturados ANTES de aplicar la NORMALIZACION #1
// (cerdo+brocoli+mostaza_miel+plancha, density "media"->"baja" colapsada
// en legacyCombos.data.js) — ver legacyCombos.normalizations.js.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const BUILD_PLAN_PATH = path.join(REPO_ROOT, 'src/engine/buildPlan.js');
const SNAPSHOT_BASELINE_PATH = path.join(
  REPO_ROOT,
  'src/engine/tests/__snapshots__/buildPlan.baseline.test.js.snap'
);
const SNAPSHOT_GOLDEN_PATH = path.join(
  REPO_ROOT,
  'src/engine/tests/__snapshots__/buildPlan.snapshot.test.js.snap'
);

const EXPECTED_SHA256 = {
  'buildPlan.js': '5bd7bbbff4b12bb288929a5d2edec34323b638cc93d5430c7d6883c9d03e61f1',
  'buildPlan.baseline.test.js.snap': 'cd6fd734f938de1d46519edfdabc32c3062b06f6ae7d314b1df7adf6b04b4fbb',
  'buildPlan.snapshot.test.js.snap': '8796ab924f08e45b7a7710d2e01b4a86be6f2641064b9a2be545427992abaa21',
};

function sha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

describe('invariante de seguridad: buildPlan.js y los snapshots dorados NO cambian por normalizar legacyCombos.data.js', () => {
  it('buildPlan.js sigue byte a byte identico (motor vivo congelado, nunca se edita desde aqui)', () => {
    expect(sha256(BUILD_PLAN_PATH)).toBe(EXPECTED_SHA256['buildPlan.js']);
  });

  it('buildPlan.baseline.test.js.snap sigue byte a byte identico', () => {
    expect(sha256(SNAPSHOT_BASELINE_PATH)).toBe(EXPECTED_SHA256['buildPlan.baseline.test.js.snap']);
  });

  it('buildPlan.snapshot.test.js.snap sigue byte a byte identico', () => {
    expect(sha256(SNAPSHOT_GOLDEN_PATH)).toBe(EXPECTED_SHA256['buildPlan.snapshot.test.js.snap']);
  });
});
