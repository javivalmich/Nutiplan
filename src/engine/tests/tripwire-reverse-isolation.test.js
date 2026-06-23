// Tripwire inverso: prohibe que src/eval/** importe o haga require desde
// src/engine/** o src/engine2/** (regla transversal Fase 0.5: eval -/-> engine,
// eval -/-> engine2; ver CLAUDE.md regla 2). humanScore solo lee el objeto
// `plan` ya construido — nunca el motor que lo construyo.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkEvalEngineIsolationImports } from './tripwires/checkers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVAL_ROOT = path.resolve(__dirname, '../../eval');

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

describe('tripwire inverso — checker fixtures (pass/fail)', () => {
  it('PASA: import licito sin tocar engine/engine2', () => {
    const code = `import { describe } from 'vitest';`;
    expect(checkEvalEngineIsolationImports(code)).toEqual([]);
  });

  it('FALLA: import relativo a ../engine/', () => {
    const code = `import { buildPlan } from '../engine/buildPlan.js';`;
    const v = checkEvalEngineIsolationImports(code);
    expect(v).toHaveLength(1);
    expect(v[0].source).toBe('../engine/buildPlan.js');
  });

  it('FALLA: import relativo profundo a ../engine2/', () => {
    const code = `import { getWeek } from '../engine2/memory/contract.js';`;
    const v = checkEvalEngineIsolationImports(code);
    expect(v).toHaveLength(1);
    expect(v[0].source).toBe('../engine2/memory/contract.js');
  });

  it('FALLA: require() a ../engine/', () => {
    const code = `const { buildPlan } = require('../engine/buildPlan.js');`;
    const v = checkEvalEngineIsolationImports(code);
    expect(v).toHaveLength(1);
    expect(v[0].source).toBe('../engine/buildPlan.js');
  });

  it('FALLA: require() a ../engine2/', () => {
    const code = `const { getWeek } = require('../engine2/memory/contract.js');`;
    expect(checkEvalEngineIsolationImports(code)).toHaveLength(1);
  });
});

// CONTROL POSITIVO end-to-end: archivo infractor creado dinamicamente bajo
// src/eval/, escaneado por el MISMO recorrido recursivo que protege el
// directorio real, con cleanup garantizado en finally. Subdirectorio propio
// para evitar carreras si en el futuro hay otros tripwires de eval/ corriendo
// en paralelo.
describe('tripwire inverso — autotest end-to-end (el escaneo real SI detecta una violacion real)', () => {
  const selfTestDir = path.join(EVAL_ROOT, '__selftest_engine_isolation__');
  const selfTestFile = path.join(selfTestDir, 'violation.js');

  it('un import a ../engine/ colado en src/eval/ es detectado por el escaneo real', () => {
    fs.mkdirSync(selfTestDir, { recursive: true });
    fs.writeFileSync(selfTestFile, "import { buildPlan } from '../engine/buildPlan.js';\n", 'utf8');
    try {
      const files = listJsFiles(selfTestDir);
      const allViolations = [];
      for (const file of files) {
        const violations = checkEvalEngineIsolationImports(fs.readFileSync(file, 'utf8'));
        for (const v of violations) allViolations.push({ file, ...v });
      }
      expect(allViolations.length).toBeGreaterThan(0);
      expect(allViolations.some((v) => v.file === selfTestFile)).toBe(true);
    } finally {
      fs.rmSync(selfTestDir, { recursive: true, force: true });
    }
  });
});

describe('tripwire inverso — src/eval/ real (incluyendo tests/)', () => {
  const files = listJsFiles(EVAL_ROOT);

  it('ningun archivo importa desde src/engine/ ni src/engine2/', () => {
    const allViolations = [];
    for (const file of files) {
      const code = fs.readFileSync(file, 'utf8');
      const violations = checkEvalEngineIsolationImports(code);
      for (const v of violations) allViolations.push({ file, ...v });
    }
    expect(allViolations).toEqual([]);
  });
});
