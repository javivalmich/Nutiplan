// Diseño medido de pescado y legumbres: MEDICIÓN, no producto. Hook de carga que aplica en
// memoria los contrafactuales de diseño (no modifica ningún archivo de src/):
//   --cf=A           en la comida, los suelos semanales se evalúan antes que la verdura del día
//   --cf=A2          como A y, dentro del nivel del suelo, primero los que cubren la verdura del día
//   --cf=B           no repetir familia proteica en días seguidos (definición del README), solo
//                    omnívoros; filtro con vuelta atrás, colocado tras «proteína separada»
//   --cf=Bm          como B, contando pescado y marisco como una sola familia
//   --cf=S           la sugerencia de la comida libre del sábado no cuenta como consumo (ni para
//                    los suelos ni para la verdura del día) y el paso 4 no la dirige
//   --cf=leg2        suelo semanal de legumbre 2 en lugar de 3
//   --cf=sinNiveles  sin paso 4 ni paso 5 (se conservan los filtros de D-099 y las preferencias)
//   --cf=azar        azar puro sobre el pool del hueco (sin tope, separación, huevo, aliño,
//                    preferencias A y B, paso 4 ni paso 5). Con --azarNivel=base0 el azar es
//                    sobre lo que deja el tope por especie; con --azarNivel=baseH, sobre lo que
//                    dejan el tope y la separación por especie (para la separación sola, añadir
//                    el hook contrafactualesPescado.mjs con --sin=tope)
// Se combinan con comas (C = A,B). La lógica vive en globalThis.__cf, que define medirDiseno.mjs.
// Si un ancla no aparece exactamente una vez, falla.
import { register } from 'node:module';

const arg = process.argv.find((a) => a.startsWith('--cf='));
const cf = arg ? arg.slice('--cf='.length).split(',').filter(Boolean) : [];
const VALIDOS = ['A', 'A2', 'B', 'Bm', 'S', 'leg2', 'sinNiveles', 'azar'];
for (const c of cf) if (!VALIDOS.includes(c)) throw new Error(`contrafactualesDiseno: contrafactual desconocido «${c}»`);
globalThis.__cfFlags = Object.fromEntries(VALIDOS.map((c) => [c, cf.includes(c)]));
const argNivel = process.argv.find((a) => a.startsWith('--azarNivel='));
globalThis.__cfFlags.azarNivel = argNivel ? argNivel.slice('--azarNivel='.length) : 'pool';
if (!['pool', 'base0', 'baseH'].includes(globalThis.__cfFlags.azarNivel)) throw new Error('contrafactualesDiseno: --azarNivel desconocido');
process.stderr.write(`[contrafactualesDiseno] contrafactuales: ${cf.length ? cf.join(', ') : 'ninguno (reglas actuales)'}\n`);

const W = '/src/engine2/walk/runWalk.js';
const F = '/src/engine2/walk/frequencies.js';
const CAMBIOS = [
  [W, '  const decisionLog = p1aRawLog.map(reshapeP1aEntry);',
    '  const decisionLog = p1aRawLog.map(reshapeP1aEntry);\n  if (globalThis.__cf) globalThis.__cf.inicio(p1aSlots);'],
  // B: filtro de familia, tras «proteína separada» y antes del huevo.
  [W, '      const baseH = poolSeparado.length ? poolSeparado : base0;',
    '      let baseH = poolSeparado.length ? poolSeparado : base0;\n      if (globalThis.__cf && (globalThis.__cf.flags.B || globalThis.__cf.flags.Bm) && profile?.dieta !== \'vegetariana\' && profile?.dieta !== \'vegana\') baseH = globalThis.__cf.filtroFamilia({ day, momento, i, slots, base: baseH });'],
  // A: el paso 4 necesita saber el momento del hueco.
  [W, '      const { nivel: candidatesFinal, causa: causaFreq, evidencia: notaFreq } = chooseFrequencyLevel({',
    '      if (globalThis.__cf) globalThis.__cf.momento = momento;\n      const { nivel: candidatesFinal, causa: causaFreq, evidencia: notaFreq } = chooseFrequencyLevel({'],
  // sinNiveles y azar: el nivel final es candidatesB o el pool entero.
  [W, '      const { nivel: candidatesIdentidad, causa: causaIdentidad, evidencia: notaIdentidad } = chooseIdentityLevel({',
    '      const { nivel: candidatesIdentidad, causa: causaIdentidad, evidencia: notaIdentidad } = (globalThis.__cf && globalThis.__cf.flags.azar) ? { nivel: (globalThis.__cf.flags.azarNivel === "baseH" ? baseH : globalThis.__cf.flags.azarNivel === "base0" ? base0 : pool), causa: null, evidencia: null } : (globalThis.__cf && globalThis.__cf.flags.sinNiveles) ? { nivel: candidatesB, causa: null, evidencia: null } : chooseIdentityLevel({'],
  [W, "      let notaRng = '';",
    "      let notaRng = '';\n      if (globalThis.__cf) globalThis.__cf.hueco({ day, momento, causaFreq, notaFreq, final: candidatesIdentidad });"],
  // S: la sugerencia del sábado no se registra como consumo.
  [W, '      registerConsumption(freqState, chosen, day, undefined, fuenteEditorial);',
    "      if (!(globalThis.__cf && globalThis.__cf.flags.S && day === 'Sabado' && momento === 'comida')) registerConsumption(freqState, chosen, day, undefined, fuenteEditorial);"],
  [F, 'export function chooseFrequencyLevel({',
    'export function chooseFrequencyLevel(input) {\n  return globalThis.__cf && globalThis.__cf.elegirNivel ? globalThis.__cf.elegirNivel(input, __nivelOriginal, { satisfaceVerdura, resolver: input.getVista || vistaPorDefecto(input.state, input.fuenteEditorial) }) : __nivelOriginal(input);\n}\nfunction __nivelOriginal({'],
];
if (globalThis.__cfFlags.leg2) CAMBIOS.push(['/src/engine2/contracts/weeklyTargets.js', '  legumbre: 3,', '  legumbre: 2,']);

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
    if (t.split(a).length !== 2) throw new Error('contrafactualesDiseno: ancla no encontrada en ' + sufijo + ': ' + ancla);
    t = t.replace(a, () => nuevo.split('\\n').join(nl));
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
