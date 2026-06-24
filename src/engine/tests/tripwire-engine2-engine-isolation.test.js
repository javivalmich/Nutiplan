// Tripwire: prohibe que codigo de PRODUCCION de src/engine2/** importe
// desde src/engine/** (motor viejo). engine2 reutiliza logica del motor
// viejo via copia propia + parity test (ver derive.js,
// deriveTempFeelEngine2), nunca via import directo en produccion — la
// unica excepcion legitima es el propio parity test, que SI necesita
// importar el legacy para detectar drift entre ambas copias.
//
// Excepcion por PATRON DE NOMBRE, no por "estar bajo una carpeta tests/"
// generica (a diferencia del tripwire no-score, que excluye cualquier
// segmento "tests"): aqui solo se exime un archivo *.test.js o un
// directorio de self-test (__selftest_*__, patron de Fase 0/Paso 0.5).
// Asi un archivo de produccion accidentalmente colocado bajo tests/ NO
// queda exento solo por la carpeta — tiene que llamarse *.test.js.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkEngineLegacyIsolationImports } from './tripwires/checkers.js';

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

// Excepcion por PATRON DE NOMBRE: *.test.js, o vivir bajo un directorio
// __selftest_*__. Nunca por "tests" como segmento generico de ruta.
function isExemptFromEngineLegacyIsolation(filePath) {
  if (/\.test\.jsx?$/.test(path.basename(filePath))) return true;
  return filePath.split(path.sep).some((seg) => /^__selftest_.*__$/.test(seg));
}

describe('tripwire engine2→engine — checker fixtures (pass/fail)', () => {
  it('PASA: import licito sin tocar engine/', () => {
    const code = `import { deriveTempFeelEngine2 } from './derive.js';`;
    expect(checkEngineLegacyIsolationImports(code)).toEqual([]);
  });

  it('FALLA: import relativo a ../engine/', () => {
    const code = `import { deriveTempFeel } from '../engine/buildPlan.js';`;
    const v = checkEngineLegacyIsolationImports(code);
    expect(v).toHaveLength(1);
    expect(v[0].source).toBe('../engine/buildPlan.js');
  });

  it('FALLA: import relativo profundo a ../../../engine/', () => {
    const code = `import { deriveTempFeel } from '../../../engine/buildPlan.js';`;
    expect(checkEngineLegacyIsolationImports(code)).toHaveLength(1);
  });

  it('FALLA: require() a ../engine/', () => {
    const code = `const { deriveTempFeel } = require('../engine/buildPlan.js');`;
    expect(checkEngineLegacyIsolationImports(code)).toHaveLength(1);
  });

  it('PASA: "engine2/" NO matchea el patron de "engine/" (no es self-violacion)', () => {
    const code = `import { deriveTempFeelEngine2 } from '../engine2/dishes/derive.js';`;
    expect(checkEngineLegacyIsolationImports(code)).toEqual([]);
  });
});

describe('control positivo (regla) — un import real a ../engine/ en archivo de PRODUCCION es detectado', () => {
  const selfTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tripwire-engine2-engine-prod-'));
  const selfTestFile = path.join(selfTestDir, 'violation.js'); // NO termina en .test.js

  it('un archivo de produccion colado en engine2/ con import a ../engine/ se reporta como violacion', () => {
    fs.writeFileSync(selfTestFile, "import { deriveTempFeel } from '../engine/buildPlan.js';\n", 'utf8');
    try {
      expect(isExemptFromEngineLegacyIsolation(selfTestFile)).toBe(false);
      const violations = checkEngineLegacyIsolationImports(fs.readFileSync(selfTestFile, 'utf8'));
      expect(violations).toHaveLength(1);
      expect(violations[0].source).toBe('../engine/buildPlan.js');
    } finally {
      fs.rmSync(selfTestDir, { recursive: true, force: true });
    }
  });
});

describe('control positivo (excepcion) — el mismo import en un *.test.js queda exento', () => {
  const selfTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tripwire-engine2-engine-test-'));
  const selfTestFile = path.join(selfTestDir, 'violation.test.js'); // SI termina en .test.js

  it('un *.test.js con el mismo import no se escanea (exento por patron de nombre)', () => {
    fs.writeFileSync(selfTestFile, "import { deriveTempFeel } from '../engine/buildPlan.js';\n", 'utf8');
    try {
      // El contenido SI seria una violacion si se escaneara (la regla en si
      // funciona) — lo que cambia es que el archivo queda exento por nombre.
      const violations = checkEngineLegacyIsolationImports(fs.readFileSync(selfTestFile, 'utf8'));
      expect(violations).toHaveLength(1);
      expect(isExemptFromEngineLegacyIsolation(selfTestFile)).toBe(true);
    } finally {
      fs.rmSync(selfTestDir, { recursive: true, force: true });
    }
  });
});

describe('tripwire engine2→engine — src/engine2/ real (excluyendo *.test.js y dirs __selftest_*__)', () => {
  const files = listJsFiles(ENGINE2_ROOT).filter((f) => !isExemptFromEngineLegacyIsolation(f));

  it('ningun archivo de produccion importa desde src/engine/', () => {
    const allViolations = [];
    for (const file of files) {
      const violations = checkEngineLegacyIsolationImports(fs.readFileSync(file, 'utf8'));
      for (const v of violations) allViolations.push({ file, ...v });
    }
    expect(allViolations).toEqual([]);
  });

  it('caso real: parity.deriveTempFeel.test.js importa de ../../../engine/ y por eso NO entra en el escaneo de produccion', () => {
    const parityTestPath = path.resolve(ENGINE2_ROOT, 'dishes/tests/parity.deriveTempFeel.test.js');
    expect(fs.existsSync(parityTestPath)).toBe(true);
    expect(isExemptFromEngineLegacyIsolation(parityTestPath)).toBe(true);
    expect(files).not.toContain(parityTestPath);
    // Y si se le aplicara el checker de todos modos, si reportaria el import
    // real a engine/ — la exencion es por nombre, no porque el contenido
    // sea inocuo.
    const violations = checkEngineLegacyIsolationImports(fs.readFileSync(parityTestPath, 'utf8'));
    expect(violations.length).toBeGreaterThan(0);
  });
});
