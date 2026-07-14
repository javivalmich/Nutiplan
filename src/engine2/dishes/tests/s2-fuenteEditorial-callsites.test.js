// EDITORIAL-S2 (D-028 §2) — T6 [invariante central del PR], GENERATIVO
// (Fork I.2, ratificado tras revision de sesion): la version anterior
// enumeraba 6 call-sites a mano, con numero de linea -- se rompio al
// desplazarse esas lineas por comentarios nuevos, y un SEPTIMO call-site
// (p.ej. anadido en S3) habria pasado el test sin ser visto. Esta version
// barre el arbol VERSIONADO completo (git ls-files, nunca fs.readdir --
// asi los artefactos no versionados de sesiones previas, p.ej.
// scripts/diag/ o scripts/phaseB2/input/, quedan fuera sin necesidad de
// una lista de exclusion a mano) y encuentra CUALQUIER invocacion de las
// funciones exportadas por compositionResolver.js por AST real (acorn +
// acorn-walk, mismas librerias que ya usa el repo en
// src/engine/tests/tripwires/checkers.js para tripwire-no-score /
// tripwire-eval-isolation) -- nunca texto/regex, para que un comentario no
// pueda alterar el resultado en ninguna direccion.
//
// COBERTURA DEL METODO (declarada, no descubierta): cubre imports
// ESTATICOS (`import { X } from '.../compositionResolver.js'`, con o sin
// alias) y las invocaciones directas de esos identificadores
// (`X(args)`). NO cubre `require()` (CommonJS) ni `import()` dinamico
// seguido de acceso a propiedad -- verificado por barrido que NINGUNO de
// los dos patrones aparece en el arbol versionado referenciando
// compositionResolver.js (ver informe de PR); si alguno se introdujera en
// el futuro, este checker no lo veria, y eso es una limitacion declarada,
// no un descubrimiento posterior.
//
// EXCLUSION de los tests del propio S2 (que SI inyectan fuenteEditorial a
// proposito): por PATRON DE NOMBRE exacto (*.test.js / *.test.jsx), nunca
// por carpeta "tests/" generica -- mismo principio que
// tripwire-engine2-engine-isolation.test.js:36-41 (CLAUDE.md invariante
// 7): un archivo de PRODUCCION colado bajo tests/ sigue siendo escaneado;
// solo se exime por terminar en ".test.js".

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
import { simple as walkSimple } from 'acorn-walk';
import { describe, it, expect } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');

const RESOLVER_MODULE_SUFFIX = 'dishes/compositionResolver.js';

// Aridad MAXIMA permitida en produccion, por funcion exportada -- el
// argumento siguiente (fuenteEditorial, directo o via {fuenteEditorial})
// esta reservado a los call-sites ratificados en
// ALLOWLISTED_FUENTE_EDITORIAL_CALLSITES. resolveScaffoldComposition/
// resolveFreeformComposition tienen 2 args REQUERIDOS (tupla|combo, dishId)
// antes del 3o opcional.
const MAX_PRODUCTION_ARITY = Object.freeze({
  resolveDishComposition: 1,
  resolveCatalogComposition: 1,
  resolveScaffoldComposition: 2,
  resolveFreeformComposition: 2,
  ejesVerdura: 1,
});

// Allowlist de call-sites de produccion ratificados para pasar
// fuenteEditorial. Clave por (file, name) EXACTO: no basta con el nombre de
// funcion, asi un futuro call-site en OTRO archivo con la misma funcion no
// hereda la allowlist silenciosamente.
//
// (D-035, PR-1a, F-W2->A): la cadena del export V5
// (buildPlatosRows -> resolveCatalogComposition).
//
// (D-036/D-037, PR-1b, F-1b-1->A/F-1b-2->C): los TRES productores de vista
// del walk que D-036 identifica como los unicos autorizados a inyectar la
// fuente -- computeVetoUniverse (vetoes.js), anchorVista (buildWeekArc.js) y
// vistaPorDefecto (frequencies.js). Toda apertura futura de la frontera
// exige modificacion visible de esta lista: la friccion es deliberada (ver
// D-037).
const ALLOWLISTED_FUENTE_EDITORIAL_CALLSITES = Object.freeze([
  Object.freeze({ file: 'scripts/phaseB2/exportCuadernoV5.js', name: 'resolveCatalogComposition', maxArity: 2 }),
  Object.freeze({ file: 'src/engine2/walk/vetoes.js', name: 'resolveDishComposition', maxArity: 2 }),
  Object.freeze({ file: 'src/engine2/skeleton/buildWeekArc.js', name: 'resolveDishComposition', maxArity: 2 }),
  Object.freeze({ file: 'src/engine2/walk/frequencies.js', name: 'resolveDishComposition', maxArity: 2 }),
]);

/**
 * Aridad maxima efectiva para una llamada dada: la allowlisted si (file,
 * name) coincide EXACTO con una entrada, si no la baseline de
 * MAX_PRODUCTION_ARITY. Extraida como funcion pura para poder probar el
 * scoping por archivo sin depender del arbol versionado real.
 * @param {string} relPath
 * @param {{name: string}} call
 * @returns {number}
 */
export function effectiveMaxArity(relPath, call) {
  const allowed = ALLOWLISTED_FUENTE_EDITORIAL_CALLSITES.find(
    (entry) => entry.file === relPath && entry.name === call.name
  );
  return allowed ? allowed.maxArity : MAX_PRODUCTION_ARITY[call.name];
}

/**
 * Analiza codigo fuente por AST (nunca texto) buscando invocaciones de las
 * funciones exportadas por compositionResolver.js, resolviendo alias de
 * import (`import { X as Y }`) a su nombre CANONICO. Un comentario que
 * mencione "fuenteEditorial" o el nombre de una funcion no genera ninguna
 * entrada -- solo CallExpression real sobre un identificador importado de
 * ese modulo.
 * Pre-filtro SANO antes de parsear: si el texto crudo no contiene la
 * subcadena "compositionResolver", el archivo no puede tener un import
 * estatico de ese modulo (todo import estatico contiene literalmente esa
 * subcadena en su specifier) -- se salta sin parsear, evitando que
 * sintaxis ajena (p.ej. JSX, que acorn base no entiende) haga fallar el
 * barrido en archivos que provadamente no referencian el resolver. Un
 * archivo que SI contiene la subcadena pero no parsea limpio hace FALLAR
 * el barrido con el error real (no se traga silenciosamente).
 * @param {string} code
 * @returns {{name: string, argCount: number, line: number}[]}
 */
export function findResolverCalls(code) {
  if (!code.includes('compositionResolver')) return [];
  const ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });

  const localToCanonical = new Map();
  for (const node of ast.body) {
    if (node.type !== 'ImportDeclaration') continue;
    if (typeof node.source.value !== 'string' || !node.source.value.endsWith(RESOLVER_MODULE_SUFFIX)) continue;
    for (const spec of node.specifiers) {
      if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier' && spec.imported.name in MAX_PRODUCTION_ARITY) {
        localToCanonical.set(spec.local.name, spec.imported.name);
      }
    }
  }
  if (localToCanonical.size === 0) return [];

  const calls = [];
  walkSimple(ast, {
    CallExpression(node) {
      if (node.callee.type !== 'Identifier') return;
      const canonical = localToCanonical.get(node.callee.name);
      if (!canonical) return;
      calls.push({ name: canonical, argCount: node.arguments.length, line: node.loc.start.line });
    },
  });
  return calls;
}

// Excepcion por PATRON DE NOMBRE, nunca por carpeta "tests/" generica (ver
// banner del modulo).
function isExemptFromResolverArityCheck(relPath) {
  return /\.test\.jsx?$/.test(path.basename(relPath));
}

/** Arbol VERSIONADO bajo src/ y scripts/ (git ls-files -- nunca fs.readdir). */
function listVersionedJsFiles() {
  const out = execSync('git ls-files -- src scripts', { cwd: REPO_ROOT, encoding: 'utf8' });
  return out.split('\n').filter((p) => p && /\.jsx?$/.test(p));
}

describe('findResolverCalls — checker fixtures (pass/fail), control positivo del mecanismo', () => {
  it('detecta una invocacion directa, aridad correcta', () => {
    const code = `import { resolveDishComposition } from '../dishes/compositionResolver.js';\nresolveDishComposition(dish);`;
    expect(findResolverCalls(code)).toEqual([{ name: 'resolveDishComposition', argCount: 1, line: 2 }]);
  });

  it('detecta una invocacion con un argumento EXTRA (aridad 2)', () => {
    const code = `import { resolveDishComposition } from '../dishes/compositionResolver.js';\nresolveDishComposition(dish, { fuenteEditorial });`;
    expect(findResolverCalls(code)).toEqual([{ name: 'resolveDishComposition', argCount: 2, line: 2 }]);
  });

  it('sigue el ALIAS de import a su nombre canonico', () => {
    const code = `import { resolveDishComposition as resolver } from '../dishes/compositionResolver.js';\nresolver(dish, extra);`;
    expect(findResolverCalls(code)).toEqual([{ name: 'resolveDishComposition', argCount: 2, line: 2 }]);
  });

  it('un COMENTARIO que menciona fuenteEditorial o el nombre de la funcion NO genera ninguna entrada', () => {
    const code = `// resolveDishComposition(dish, { fuenteEditorial }) -- solo prosa, no codigo\nconst x = 1;`;
    expect(findResolverCalls(code)).toEqual([]);
  });

  it('una funcion de MISMO NOMBRE pero NO importada de compositionResolver.js no cuenta (namesake)', () => {
    const code = `import { resolveDishComposition } from './otroModuloCualquiera.js';\nresolveDishComposition(dish, extra, masExtra);`;
    expect(findResolverCalls(code)).toEqual([]);
  });

  it('sin ningun import del modulo, ninguna invocacion cuenta aunque el nombre coincida', () => {
    const code = `function resolveDishComposition(a, b) { return a + b; }\nresolveDishComposition(1, 2);`;
    expect(findResolverCalls(code)).toEqual([]);
  });
});

describe('S2 — T6 [invariante central, GENERATIVO] barrido del arbol versionado completo', () => {
  it('control positivo: el barrido SI encuentra invocaciones reales (no es un barrido vacio que pase por no mirar nada)', () => {
    const files = listVersionedJsFiles().filter((f) => !isExemptFromResolverArityCheck(f));
    let total = 0;
    for (const f of files) total += findResolverCalls(fs.readFileSync(path.resolve(REPO_ROOT, f), 'utf8')).length;
    expect(total).toBeGreaterThan(0);
  });

  it('TODA invocacion de produccion del resolver (arbol versionado, excluidos *.test.js) tiene aridad <= la maxima declarada -- ninguna pasa fuenteEditorial salvo el call-site ratificado en ALLOWLISTED_FUENTE_EDITORIAL_CALLSITES', () => {
    const files = listVersionedJsFiles().filter((f) => !isExemptFromResolverArityCheck(f));
    const violaciones = [];
    for (const relPath of files) {
      const code = fs.readFileSync(path.resolve(REPO_ROOT, relPath), 'utf8');
      for (const call of findResolverCalls(code)) {
        const max = effectiveMaxArity(relPath, call);
        if (call.argCount > max) {
          violaciones.push(`${relPath}:${call.line} ${call.name}(...${call.argCount} args, max ${max})`);
        }
      }
    }
    expect(violaciones).toEqual([]);
  });

  it('scoping de la allowlist: (file, name) debe coincidir EXACTO -- el mismo nombre de funcion en OTRO archivo no hereda la aridad ampliada', () => {
    expect(effectiveMaxArity('src/engine2/dishes/walk.js', { name: 'resolveCatalogComposition' })).toBe(
      MAX_PRODUCTION_ARITY.resolveCatalogComposition
    );
    expect(
      effectiveMaxArity('scripts/phaseB2/exportCuadernoV5.js', { name: 'resolveCatalogComposition' })
    ).toBe(2);
  });

  it('control positivo: el call-site allowlisted (cadena del export V5) SIGUE presente en el arbol versionado -- una allowlist obsoleta no pasa desapercibida', () => {
    const files = listVersionedJsFiles().filter((f) => !isExemptFromResolverArityCheck(f));
    for (const entry of ALLOWLISTED_FUENTE_EDITORIAL_CALLSITES) {
      expect(files).toContain(entry.file);
      const code = fs.readFileSync(path.resolve(REPO_ROOT, entry.file), 'utf8');
      const calls = findResolverCalls(code).filter(
        (c) => c.name === entry.name && c.argCount === entry.maxArity
      );
      expect(calls.length).toBeGreaterThan(0);
    }
  });

  it('control positivo (exencion): un *.test.js con una invocacion de aridad excedida NO se escanea', () => {
    const selfTestDir = fs.mkdtempSync(path.join(REPO_ROOT, '.tmp-s2-t6-'));
    const selfTestFile = path.join(selfTestDir, 'violation.test.js');
    try {
      fs.writeFileSync(
        selfTestFile,
        "import { resolveDishComposition } from '../dishes/compositionResolver.js';\nresolveDishComposition(dish, { fuenteEditorial });\n",
        'utf8'
      );
      const relFromRepo = path.relative(REPO_ROOT, selfTestFile).replace(/\\/g, '/');
      expect(isExemptFromResolverArityCheck(relFromRepo)).toBe(true);
      // El contenido SI seria una violacion si se escaneara -- el checker
      // en si funciona; lo que cambia es que el archivo queda exento por
      // nombre, mismo patron que el tripwire de aislamiento engine2/engine.
      const calls = findResolverCalls(fs.readFileSync(selfTestFile, 'utf8'));
      expect(calls).toEqual([{ name: 'resolveDishComposition', argCount: 2, line: 2 }]);
    } finally {
      fs.rmSync(selfTestDir, { recursive: true, force: true });
    }
  });
});

// T-TRIP-NEG (D-037 bloque 2, GENERATIVO por rol, no por nombre): los
// predicados de dominio -- hoy evaluateVetoFromVista (vetoes.js) y
// satisfaceVerdura (frequencies.js) -- jamas reciben fuenteEditorial. La
// propiedad se define por firma (AST, no texto): ningun parametro ni
// propiedad desestructurada de su parametro se llama "fuenteEditorial". No
// depende de ALLOWLISTED_FUENTE_EDITORIAL_CALLSITES -- es independiente del
// bloque positivo de arriba (D-036: "quien puede suministrar la fuente" y
// "quien jamas la toca" son propiedades distintas, cada una falsable por
// separado).
export function findFunctionParamNames(code, functionName) {
  const ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  let params = null;
  walkSimple(ast, {
    FunctionDeclaration(node) {
      if (node.id && node.id.name === functionName) params = node.params;
    },
  });
  if (!params) {
    throw new Error(`findFunctionParamNames: funcion "${functionName}" no encontrada en el codigo dado`);
  }
  function namesOf(param) {
    if (param.type === 'AssignmentPattern') return namesOf(param.left);
    if (param.type === 'Identifier') return [param.name];
    if (param.type === 'ObjectPattern') {
      return param.properties.filter((p) => p.type === 'Property' && p.key.type === 'Identifier').map((p) => p.key.name);
    }
    return [];
  }
  return params.flatMap(namesOf);
}

describe('T-TRIP-NEG (D-037 bloque 2) -- los predicados de dominio nunca reciben fuenteEditorial (estructural, por rol)', () => {
  it('evaluateVetoFromVista no declara fuenteEditorial en su firma', () => {
    const code = fs.readFileSync(path.resolve(REPO_ROOT, 'src/engine2/walk/vetoes.js'), 'utf8');
    expect(findFunctionParamNames(code, 'evaluateVetoFromVista')).not.toContain('fuenteEditorial');
  });

  it('satisfaceVerdura no declara fuenteEditorial en su firma', () => {
    const code = fs.readFileSync(path.resolve(REPO_ROOT, 'src/engine2/walk/frequencies.js'), 'utf8');
    expect(findFunctionParamNames(code, 'satisfaceVerdura')).not.toContain('fuenteEditorial');
  });

  it('MUTACION dirty->red (reproduccion local, sin tocar los modulos reales): si evaluateVetoFromVista declarara fuenteEditorial, el checker SI lo detectaria', () => {
    const mutado = 'export function evaluateVetoFromVista(vista, intolerancias, { fuenteEditorial } = {}) { return []; }';
    expect(findFunctionParamNames(mutado, 'evaluateVetoFromVista')).toContain('fuenteEditorial');
  });

  it('MUTACION dirty->red (reproduccion local, sin tocar los modulos reales): si satisfaceVerdura declarara fuenteEditorial como identificador directo, el checker SI lo detectaria', () => {
    const mutado = 'export function satisfaceVerdura(vista, fuenteEditorial) { return false; }';
    expect(findFunctionParamNames(mutado, 'satisfaceVerdura')).toContain('fuenteEditorial');
  });
});
