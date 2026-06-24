// Tripwire: prohibe que src/engine2/** importe desde src/eval/** (CLAUDE.md,
// regla 2: "eval/ jamas se importa desde engine2/. Las metricas humanas miden,
// no deciden."). A diferencia del tripwire de identificadores, este SI aplica
// tambien a los tests de engine2 (no hay excepcion para tests/).

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkEvalIsolationImports } from './tripwires/checkers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENGINE2_ROOT = path.resolve(__dirname, '../../engine2');

function listJsFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJsFiles(full));
    else if (entry.isFile() && /\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe('tripwire — checker fixtures (pass/fail)', () => {
  it('PASA: import licito fuera de eval/', () => {
    const code = `import { _hashStr } from '../engine/hash.js';`;
    expect(checkEvalIsolationImports(code)).toEqual([]);
  });

  it('FALLA: import relativo a ../eval/', () => {
    const code = `import { humanScore } from '../eval/humanScore.js';`;
    const v = checkEvalIsolationImports(code);
    expect(v).toHaveLength(1);
    expect(v[0].source).toBe('../eval/humanScore.js');
  });

  it('FALLA: import relativo profundo a ../../eval/', () => {
    const code = `import { humanScore } from '../../eval/humanScore.js';`;
    expect(checkEvalIsolationImports(code)).toHaveLength(1);
  });

  it('FALLA: require() a eval/', () => {
    const code = `const { humanScore } = require('../eval/humanScore.js');`;
    const v = checkEvalIsolationImports(code);
    expect(v).toHaveLength(1);
    expect(v[0].source).toBe('../eval/humanScore.js');
  });
});

// CONTROL POSITIVO end-to-end: ver justificacion en tripwire-no-score.test.js.
// Aqui probamos que un import real a ../eval/ colado en src/engine2/ es
// detectado por el MISMO escaneo recursivo que protege el directorio real.
// Fixture fuera de ENGINE2_ROOT (tmpdir unico via mkdtempSync): el escaneo
// "real" de este archivo y del de tripwire-no-score.test.js recorre
// ENGINE2_ROOT completo sin excluir subdirectorios __selftest_*__, asi que
// un fixture vivo ahi seria visible para el escaneo del otro archivo de
// tripwire mientras corren en paralelo en workers distintos de vitest
// (carrera mkdir/rmSync vs listJsFiles). Sacar el fixture del arbol
// escaneado la descarta por construccion, no por suerte de timing.
describe('tripwire — autotest end-to-end (el escaneo real SI detecta una violacion real)', () => {
  const selfTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tripwire-eval-isolation-'));
  const selfTestFile = path.join(selfTestDir, 'violation.js');

  it('un import a ../eval/ colado en src/engine2/ es detectado por el escaneo real', () => {
    fs.writeFileSync(selfTestFile, "import { humanScore } from '../eval/humanScore.js';\n", 'utf8');
    try {
      const files = listJsFiles(selfTestDir);
      const allViolations = [];
      for (const file of files) {
        const violations = checkEvalIsolationImports(fs.readFileSync(file, 'utf8'));
        for (const v of violations) allViolations.push({ file, ...v });
      }
      expect(allViolations.length).toBeGreaterThan(0);
      expect(allViolations.some((v) => v.file === selfTestFile)).toBe(true);
    } finally {
      fs.rmSync(selfTestDir, { recursive: true, force: true });
    }
  });
});

describe('tripwire — src/engine2/ real (incluyendo tests/)', () => {
  const files = listJsFiles(ENGINE2_ROOT);

  it('ningun archivo importa desde src/eval/', () => {
    const allViolations = [];
    for (const file of files) {
      const code = fs.readFileSync(file, 'utf8');
      const violations = checkEvalIsolationImports(code);
      for (const v of violations) allViolations.push({ file, ...v });
    }
    expect(allViolations).toEqual([]);
  });
});
