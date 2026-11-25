// Estructura de la comida (primero de legumbre y segundo de proteína): MEDICIÓN, no producto.
// Hook de carga que aplica en memoria, sin modificar ningún archivo de src/:
//   - en runWalk.js: los días de legumbre se sortean con la semilla antes del walk; en la comida
//     de esos días el nivel de legumbre va por delante de la verdura del día; fuera de ellos el
//     suelo semanal de legumbre no actúa; tras colocar un primero de legumbre se elige un segundo;
//   - en racionesApp.js: la comida con primero y segundo se raciona como una sola comida y se
//     vuelve a escribir plato a plato; la legumbre del primero tiene un tope propio.
// La lógica vive en globalThis.__ec, que instala estructuraComidaLogica.mjs (la llama el medidor).
//
//   --ec=off                 reglas actuales (el hook no transforma nada)
//   --ec=suelo2|suelo3       días de legumbre que se sortean cada semana (por defecto 3)
//   --ec=pescado|sinPescado  el segundo puede ser pescado o marisco, o no (por defecto sí)
//   --ec=todas|lentejas      llevan segundo todos los compuestos de legumbre, o solo los de lentejas
//   --ec=antesAB             (a) en la comida de un día sorteado, el nivel de legumbre va antes que A y B
//   --ec=topePlatoUnico      (b) si ningún segundo cumple el tope de 2 por especie, ese día la legumbre va
//                            como plato único
//   --ec=protAjustada        (c) en la comida con segundo, la proteína se calcula con la legumbre ya ajustada
//   --ec=red                 red de seguridad: si la semana termina con alguna infracción de D-099.3, se repite
//                            el walk entero sin segundos (legumbre como plato único), con la misma semilla
//   --ec=motor               el walk es el del motor real (D-116 y D-117 ya implementadas en src/engine2): el hook
//                            no toca runWalk.js y solo aplica lo de racionesApp.js, que sigue sin implementar
//                            (src/plan). Sirve para medir el motor real con las mismas métricas. No se combina.
// Se combinan con comas: --ec=suelo2,sinPescado,todas. No se combina con contrafactualesDiseno.mjs.
// Si un ancla no aparece exactamente una vez, falla.
//
// Desde que el motor implementa la regla (2026-11-15), las variantes del hook se aplican sobre el walk
// ANTERIOR a la implementación: runWalk.js y materializePlan.js se leen de git (commit BASE_HOOK, o
// --ec-base=<commit>), no del árbol de trabajo. Así el prototipo sigue siendo reproducible como referencia
// (compararMotorHook.mjs). El resto de src/ es el del árbol de trabajo.
//
// Desde que src/plan raciona y escribe la comida doble (etapa 2, pasos 3 a 5), las raciones del prototipo
// se aplican sobre racionesApp.js ANTERIOR a esos pasos (commit BASE_RACIONES), también con --ec=motor. Así
// el prototipo sigue sirviendo de referencia. Para medir lo que hace src/plan, sin prototipo: --ec=off
// (y, mientras la app no monte la comida doble, medirEstructura.mjs --montar src).
import { register } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BASE_HOOK = 'ba52d21';
const BASE_RACIONES = '96a2143';

const arg = process.argv.find((a) => a.startsWith('--ec='));
const partes = arg ? arg.slice('--ec='.length).split(',').filter(Boolean) : ['off'];
const VALIDOS = ['off', 'motor', 'suelo2', 'suelo3', 'pescado', 'sinPescado', 'todas', 'lentejas', 'antesAB', 'topePlatoUnico', 'protAjustada', 'red'];
if (partes.includes('motor') && partes.length > 1) throw new Error('estructuraComida: «motor» no se combina con otras opciones');
for (const p of partes) if (!VALIDOS.includes(p)) throw new Error(`estructuraComida: opción desconocida «${p}»`);
const motor = partes.includes('motor');
const flags = {
  off: partes.includes('off'),
  motor,
  suelo: partes.includes('suelo2') ? 2 : 3,
  pescado: !partes.includes('sinPescado') && !motor,
  alcance: partes.includes('lentejas') ? 'lentejas' : 'todas',
  antesAB: partes.includes('antesAB'),
  topePlatoUnico: partes.includes('topePlatoUnico'),
  protAjustada: partes.includes('protAjustada'),
  red: partes.includes('red'),
};
globalThis.__ecFlags = flags;
process.stderr.write(`[estructuraComida] ${flags.off ? 'reglas actuales' : motor ? 'walk del motor real; solo las raciones de la comida doble van en memoria' : `suelo ${flags.suelo}, segundo ${flags.pescado ? 'con' : 'sin'} pescado, alcance ${flags.alcance}${flags.antesAB ? ', (a)' : ''}${flags.topePlatoUnico ? ', (b)' : ''}${flags.protAjustada ? ', (c)' : ''}${flags.red ? ', red de seguridad' : ''}`}\n`);

const W = '/src/engine2/walk/runWalk.js';
const RA = '/src/plan/racionesApp.js';
const RN = '/src/engine2/nutrientes/raciones.js';
const G = 'globalThis.__ec';
const ARGS = '{ day, i, slot, slots, catalog, usedIds, usedNames, recientes, vetoedIds, freqState, fuenteEditorial, sinFamilia, uso, decisionLog }';
const SOLO_RACIONES = (c) => c[0] === RA;
const CAMBIOS = flags.off ? [] : [
  // Sorteo de los días de legumbre, antes de elegir nada.
  [W, '  const rng = selectRng(seed);',
    `  const rng = selectRng(seed);\n  const __ec = ${G} && ${G}.activo(profile) ? ${G}.inicio({ p1aSlots, seed, decisionLog }) : null;`],
  // Un primero de legumbre que ya colocó el ancla también lleva segundo.
  [W, '      if (!slot.abierto) continue; // Paso 1: ya colocado, la cadena no corre.',
    `      if (!slot.abierto) { if (__ec && momento === 'comida') ${G}.segundo(__ec, slot.dishId, ${ARGS}); continue; }`],
  // Paso 4: en la comida de un día de legumbre, el nivel de legumbre va primero.
  [W, '        : chooseFrequencyLevel({',
    `        : (__ec ? ${G}.nivelFn(__ec, momento, chooseFrequencyLevel) : chooseFrequencyLevel)({`],
  // Tras colocar la comida, el segundo (si el plato elegido es un primero de legumbre).
  [W, '      if (!esSugerencia) registerConsumption(freqState, chosen, day, undefined, fuenteEditorial);',
    `      if (!esSugerencia) registerConsumption(freqState, chosen, day, undefined, fuenteEditorial);\n      if (__ec && momento === 'comida' && !esSugerencia) ${G}.segundo(__ec, chosen.id, ${ARGS});`],
  // Red de seguridad: con infracciones de D-099.3, la semana se repite sin segundos.
  [W, '    return walkUnaVez(input, { sinFamilia: false, uso });',
    `    if (${G} && ${G}.flags.red && ${G}.activo(input.profile)) return ${G}.red(input, walkUnaVez(input, { sinFamilia: false, uso }), () => walkUnaVez(input, { sinFamilia: false, uso: { familiaDescarto: false } }));\n    return walkUnaVez(input, { sinFamilia: false, uso });`],
  // (a) En la comida de un día sorteado, el nivel de legumbre antes que las preferencias A y B.
  [W, '      let candidatesA = poolAlino.length ? poolAlino : base1;',
    `      let candidatesA = poolAlino.length ? poolAlino : base1;\n      if (__ec && ${G}.flags.antesAB) candidatesA = ${G}.antesAB(__ec, day, momento, candidatesA);`],
  // (c) En la comida con segundo, los factores de proteína y energía se resuelven a la vez.
  [RN, '    if (P.length && sp.proteina > 0) fP = Math.max(0, (Pr - se.proteina) / sp.proteina);',
    `    const __ps = !!(${G} && ${G}.flags.protAjustada && estado.some((e) => e.ps));\n    if (__ps) ({ fP, fE } = ${G}.factores({ sp, se, K, Pr, nP: P.length, nE: E.length }));\n    else if (P.length && sp.proteina > 0) fP = Math.max(0, (Pr - se.proteina) / sp.proteina);`],
  [RN, '    if (E.length && se.kcal > 0) fE = Math.max(0, (K - sp.kcal * fP) / se.kcal);',
    '    if (!__ps && E.length && se.kcal > 0) fE = Math.max(0, (K - sp.kcal * fP) / se.kcal);'],
  // Raciones: tope propio de la legumbre del primero y escritura plato a plato.
  [RA, "      items: lectura.items.map((it) => ({ clave: it.clave, gramos: it.gramos, unidad: it.como === 'ud' ? 'ud' : 'g', fijo: /estimado/.test(it.como), ...(m.masa ? { masa: true } : {}) })),",
    `      items: lectura.items.map((it, __k) => ({ clave: it.clave, gramos: it.gramos, unidad: it.como === 'ud' ? 'ud' : 'g', fijo: /estimado/.test(it.como), ...(m.masa ? { masa: true } : {}), ...(m._ps && ${G} ? ${G}.itemExtra(m, it, __k, targetKcal) : {}) })),`],
  [RA, '    if (m._componer) {',
    `    if (m._ps && ${G}) { escrita = { meal: ${G}.escribirPS(m, items), sinCambiar: 0 }; } else if (m._componer) {`],
].filter((c) => !motor || SOLO_RACIONES(c));

// Fuentes anteriores a la implementación, para las variantes del prototipo.
const argBase = process.argv.find((a) => a.startsWith('--ec-base='));
const base = argBase ? argBase.slice('--ec-base='.length) : BASE_HOOK;
const MP = '/src/engine2/materializePlan.js';
const RAIZ = fileURLToPath(new URL('../../../', import.meta.url));
const ANTERIORES = {};
if (!flags.off && !motor) {
  for (const sufijo of [W, MP]) ANTERIORES[sufijo] = execFileSync('git', ['show', `${base}:${sufijo.slice(1)}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 24 });
  process.stderr.write(`[estructuraComida] runWalk.js y materializePlan.js de ${base} (anteriores a la implementación en el motor)\n`);
}
if (!flags.off) {
  ANTERIORES[RA] = execFileSync('git', ['show', `${BASE_RACIONES}:${RA.slice(1)}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 24 });
  process.stderr.write(`[estructuraComida] racionesApp.js de ${BASE_RACIONES} (anterior a las raciones de la comida doble en src/plan)` + String.fromCharCode(10));
}

const hooks = `
const CAMBIOS = ${JSON.stringify(CAMBIOS)};
const ANTERIORES = ${JSON.stringify(ANTERIORES)};
export async function load(url, contexto, siguiente) {
  const r = await siguiente(url, contexto);
  const mios = CAMBIOS.filter(([sufijo]) => url.endsWith(sufijo));
  const anterior = Object.keys(ANTERIORES).find((sufijo) => url.endsWith(sufijo));
  if (!mios.length && !anterior) return r;
  let t = anterior ? ANTERIORES[anterior] : String(r.source);
  const nl = t.includes('\\r\\n') ? '\\r\\n' : '\\n';
  for (const [sufijo, ancla, nuevo] of mios) {
    const a = ancla.split('\\n').join(nl);
    if (t.split(a).length !== 2) throw new Error('estructuraComida: ancla no encontrada (o repetida) en ' + sufijo + ': ' + ancla);
    t = t.replace(a, () => nuevo.split('\\n').join(nl));
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
