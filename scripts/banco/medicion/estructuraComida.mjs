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
// Se combinan con comas: --ec=suelo2,sinPescado,todas. No se combina con contrafactualesDiseno.mjs.
// Si un ancla no aparece exactamente una vez, falla.
import { register } from 'node:module';

const arg = process.argv.find((a) => a.startsWith('--ec='));
const partes = arg ? arg.slice('--ec='.length).split(',').filter(Boolean) : ['off'];
const VALIDOS = ['off', 'suelo2', 'suelo3', 'pescado', 'sinPescado', 'todas', 'lentejas', 'antesAB', 'topePlatoUnico', 'protAjustada'];
for (const p of partes) if (!VALIDOS.includes(p)) throw new Error(`estructuraComida: opción desconocida «${p}»`);
const flags = {
  off: partes.includes('off'),
  suelo: partes.includes('suelo2') ? 2 : 3,
  pescado: !partes.includes('sinPescado'),
  alcance: partes.includes('lentejas') ? 'lentejas' : 'todas',
  antesAB: partes.includes('antesAB'),
  topePlatoUnico: partes.includes('topePlatoUnico'),
  protAjustada: partes.includes('protAjustada'),
};
globalThis.__ecFlags = flags;
process.stderr.write(`[estructuraComida] ${flags.off ? 'reglas actuales' : `suelo ${flags.suelo}, segundo ${flags.pescado ? 'con' : 'sin'} pescado, alcance ${flags.alcance}${flags.antesAB ? ', (a)' : ''}${flags.topePlatoUnico ? ', (b)' : ''}${flags.protAjustada ? ', (c)' : ''}`}\n`);

const W = '/src/engine2/walk/runWalk.js';
const RA = '/src/plan/racionesApp.js';
const RN = '/src/engine2/nutrientes/raciones.js';
const G = 'globalThis.__ec';
const ARGS = '{ day, i, slot, slots, catalog, usedIds, usedNames, recientes, vetoedIds, freqState, fuenteEditorial, sinFamilia, uso, decisionLog }';
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
];

const hooks = `
const CAMBIOS = ${JSON.stringify(CAMBIOS)};
export async function load(url, contexto, siguiente) {
  const r = await siguiente(url, contexto);
  const mios = CAMBIOS.filter(([sufijo]) => url.endsWith(sufijo));
  if (!mios.length) return r;
  let t = String(r.source);
  const nl = t.includes('\\r\\n') ? '\\r\\n' : '\\n';
  for (const [sufijo, ancla, nuevo] of mios) {
    const a = ancla.split('\\n').join(nl);
    if (t.split(a).length !== 2) throw new Error('estructuraComida: ancla no encontrada (o repetida) en ' + sufijo + ': ' + ancla);
    t = t.replace(a, () => nuevo.split('\\n').join(nl));
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
