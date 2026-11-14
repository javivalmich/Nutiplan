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
// Se combinan con comas: --ec=suelo2,sinPescado,todas. No se combina con contrafactualesDiseno.mjs.
// Si un ancla no aparece exactamente una vez, falla.
import { register } from 'node:module';

const arg = process.argv.find((a) => a.startsWith('--ec='));
const partes = arg ? arg.slice('--ec='.length).split(',').filter(Boolean) : ['off'];
const VALIDOS = ['off', 'suelo2', 'suelo3', 'pescado', 'sinPescado', 'todas', 'lentejas'];
for (const p of partes) if (!VALIDOS.includes(p)) throw new Error(`estructuraComida: opción desconocida «${p}»`);
const flags = {
  off: partes.includes('off'),
  suelo: partes.includes('suelo2') ? 2 : 3,
  pescado: !partes.includes('sinPescado'),
  alcance: partes.includes('lentejas') ? 'lentejas' : 'todas',
};
globalThis.__ecFlags = flags;
process.stderr.write(`[estructuraComida] ${flags.off ? 'reglas actuales' : `suelo ${flags.suelo}, segundo ${flags.pescado ? 'con' : 'sin'} pescado, alcance ${flags.alcance}`}\n`);

const W = '/src/engine2/walk/runWalk.js';
const RA = '/src/plan/racionesApp.js';
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
