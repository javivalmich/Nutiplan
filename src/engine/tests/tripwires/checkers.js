// ─── TRIPWIRE CHECKERS ──────────────────────────────────────────────────────
// Logica pura de analisis AST, reutilizada por los tests de tripwire-no-score
// y tripwire-eval-isolation. No se importa desde src/engine2/ ni src/eval/ —
// vive en tests/ porque es tooling de CI, no logica de negocio.

import { parse } from 'acorn';
import { simple as walkSimple } from 'acorn-walk';

// Identificador de DECISION prohibido: score|rank|topN|weight como substring,
// case-insensitive. Permitido por nombre EXACTO: weekScore (compat de display).
const FORBIDDEN_PATTERN = /score|rank|topn|weight/i;
const ALLOWLIST_EXACT = new Set(['weekScore']);

function isForbiddenName(name) {
  if (typeof name !== 'string') return false;
  if (ALLOWLIST_EXACT.has(name)) return false;
  return FORBIDDEN_PATTERN.test(name);
}

/**
 * Analiza codigo fuente buscando identificadores de DECISION prohibidos
 * (score/rank/topN/weight) en posicion de:
 *  - declaracion de variable (`const score = ...`)
 *  - key de propiedad de objeto en escritura (`{ score: x }`)
 *  - parametro de funcion
 * Strings y comentarios nunca matchean porque se analiza el AST, no el texto.
 *
 * @param {string} code
 * @returns {{name: string, kind: string, line: number, column: number}[]}
 */
export function checkNoScoreIdentifiers(code) {
  const violations = [];
  const ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });

  function record(name, kind, node) {
    if (isForbiddenName(name)) {
      violations.push({ name, kind, line: node.loc.start.line, column: node.loc.start.column });
    }
  }

  walkSimple(ast, {
    VariableDeclarator(node) {
      if (node.id && node.id.type === 'Identifier') {
        record(node.id.name, 'variable-declarator', node.id);
      }
    },
    Property(node) {
      if (!node.computed && node.key) {
        if (node.key.type === 'Identifier') record(node.key.name, 'object-property-key', node.key);
        else if (node.key.type === 'Literal' && typeof node.key.value === 'string') {
          record(node.key.value, 'object-property-key', node.key);
        }
      }
    },
    AssignmentExpression(node) {
      const left = node.left;
      if (left && left.type === 'MemberExpression' && !left.computed && left.property.type === 'Identifier') {
        record(left.property.name, 'member-assignment', left.property);
      }
    },
    FunctionDeclaration(node) { recordParams(node); },
    FunctionExpression(node) { recordParams(node); },
    ArrowFunctionExpression(node) { recordParams(node); },
  });

  function recordParams(fnNode) {
    for (const p of fnNode.params) {
      if (p.type === 'Identifier') record(p.name, 'function-param', p);
    }
  }

  return violations;
}

/**
 * Analiza codigo fuente buscando imports/requires cuyo specifier apunte a
 * src/eval/** (path relativo o alias que contenga el segmento "eval/").
 *
 * @param {string} code
 * @returns {{source: string, line: number, column: number}[]}
 */
export function checkEvalIsolationImports(code) {
  const violations = [];
  const ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });

  function isEvalSpecifier(spec) {
    return typeof spec === 'string' && /(^|\/)eval\//.test(spec);
  }

  walkSimple(ast, {
    ImportDeclaration(node) {
      if (isEvalSpecifier(node.source.value)) {
        violations.push({ source: node.source.value, line: node.loc.start.line, column: node.loc.start.column });
      }
    },
    CallExpression(node) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments[0] &&
        node.arguments[0].type === 'Literal' &&
        isEvalSpecifier(node.arguments[0].value)
      ) {
        violations.push({ source: node.arguments[0].value, line: node.loc.start.line, column: node.loc.start.column });
      }
    },
  });

  return violations;
}

/**
 * Tripwire: analiza codigo fuente buscando imports/requires cuyo specifier
 * apunte a src/engine/** (path relativo que contenga el segmento "engine/",
 * NO "engine2/" — el regex exige la barra justo despues de "engine"). El
 * motor nuevo no debe depender en produccion del motor viejo: cualquier
 * reutilizacion de logica es una copia propia con parity test, no un import
 * directo (ver derive.js / deriveTempFeelEngine2).
 *
 * @param {string} code
 * @returns {{source: string, line: number, column: number}[]}
 */
export function checkEngineLegacyIsolationImports(code) {
  const violations = [];
  const ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });

  function isEngineLegacySpecifier(spec) {
    return typeof spec === 'string' && /(^|\/)engine\//.test(spec);
  }

  walkSimple(ast, {
    ImportDeclaration(node) {
      if (isEngineLegacySpecifier(node.source.value)) {
        violations.push({ source: node.source.value, line: node.loc.start.line, column: node.loc.start.column });
      }
    },
    CallExpression(node) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments[0] &&
        node.arguments[0].type === 'Literal' &&
        isEngineLegacySpecifier(node.arguments[0].value)
      ) {
        violations.push({ source: node.arguments[0].value, line: node.loc.start.line, column: node.loc.start.column });
      }
    },
  });

  return violations;
}

/**
 * Tripwire inverso: analiza codigo fuente buscando imports/requires cuyo
 * specifier apunte a src/engine/** o src/engine2/** (path relativo que
 * contenga el segmento "engine/" o "engine2/"). src/eval/ no debe depender
 * de ningun motor: humanScore solo lee el objeto `plan` ya construido.
 *
 * @param {string} code
 * @returns {{source: string, line: number, column: number}[]}
 */
export function checkEvalEngineIsolationImports(code) {
  const violations = [];
  const ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });

  function isEngineSpecifier(spec) {
    return typeof spec === 'string' && /(^|\/)engine2?\//.test(spec);
  }

  walkSimple(ast, {
    ImportDeclaration(node) {
      if (isEngineSpecifier(node.source.value)) {
        violations.push({ source: node.source.value, line: node.loc.start.line, column: node.loc.start.column });
      }
    },
    CallExpression(node) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments[0] &&
        node.arguments[0].type === 'Literal' &&
        isEngineSpecifier(node.arguments[0].value)
      ) {
        violations.push({ source: node.arguments[0].value, line: node.loc.start.line, column: node.loc.start.column });
      }
    },
  });

  return violations;
}
