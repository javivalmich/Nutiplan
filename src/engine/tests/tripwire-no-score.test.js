// Tripwire: prohibe identificadores de DECISION score/rank/topN/weight dentro
// de src/engine2/. Constitucion (CLAUDE.md, regla 1): "Prohibido score, ranking,
// top-N o agregacion numerica de candidatos en src/engine2/."
//
// Excluye **/tests/** de este tripwire (los tests pueden necesitar nombrar
// los conceptos prohibidos para verificar que NO aparecen en produccion).
// weekScore esta permitido por nombre EXACTO (clave de compatibilidad de
// display documentada en CLAUDE.md).

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkNoScoreIdentifiers } from './tripwires/checkers.js';

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

function isUnderTestsDir(filePath) {
  return filePath.split(path.sep).includes('tests');
}

describe('tripwire — checker fixtures (pass/fail)', () => {
  it('PASA: weekScore permitido por allowlist exacta', () => {
    const code = `export function f(){ return { days: [], weekWarnings: [], weekScore: 100, decisionLog: [] }; }`;
    expect(checkNoScoreIdentifiers(code)).toEqual([]);
  });

  it('PASA: comentarios y strings nunca matchean (solo AST)', () => {
    const code = `
      // score, rank, topN, weight — nada de esto se usa aqui
      const message = "no rankeamos nada, ni hay topN ni weight";
      export function f(){ return message; }
    `;
    expect(checkNoScoreIdentifiers(code)).toEqual([]);
  });

  it('FALLA: variable score', () => {
    const code = `const score = computeFit(dish);`;
    const v = checkNoScoreIdentifiers(code);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ name: 'score', kind: 'variable-declarator' });
  });

  it('FALLA: propiedad rank en objeto', () => {
    const code = `const x = { rank: 1 };`;
    const v = checkNoScoreIdentifiers(code);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ name: 'rank', kind: 'object-property-key' });
  });

  it('FALLA: variable topN', () => {
    const code = `const topN = candidates.slice(0, 3);`;
    const v = checkNoScoreIdentifiers(code);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ name: 'topN', kind: 'variable-declarator' });
  });

  it('FALLA: asignacion a member dish.weight', () => {
    const code = `dish.weight = 0.8;`;
    const v = checkNoScoreIdentifiers(code);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ name: 'weight', kind: 'member-assignment' });
  });

  it('FALLA: parametro de funcion llamado dishScore (substring case-insensitive)', () => {
    const code = `function pick(dishScore) { return dishScore; }`;
    const v = checkNoScoreIdentifiers(code);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ name: 'dishScore', kind: 'function-param' });
  });

  it('FALLA: weekScoreInternal NO esta en la allowlist (solo nombre exacto)', () => {
    const code = `const weekScoreInternal = 1;`;
    const v = checkNoScoreIdentifiers(code);
    expect(v).toHaveLength(1);
    expect(v[0].name).toBe('weekScoreInternal');
  });
});

describe('tripwire — src/engine2/ real (excluyendo **/tests/**)', () => {
  const files = listJsFiles(ENGINE2_ROOT).filter((f) => !isUnderTestsDir(f));

  it('no contiene identificadores de decision prohibidos', () => {
    const allViolations = [];
    for (const file of files) {
      const code = fs.readFileSync(file, 'utf8');
      const violations = checkNoScoreIdentifiers(code);
      for (const v of violations) allViolations.push({ file, ...v });
    }
    expect(allViolations).toEqual([]);
  });
});
