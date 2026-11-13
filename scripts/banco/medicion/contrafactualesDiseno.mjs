// Diseño medido de pescado y legumbres: MEDICIÓN, no producto. Hook de carga que aplica en
// memoria los contrafactuales de diseño (no modifica ningún archivo de src/):
//   --cf=A           en la comida, los suelos semanales se evalúan antes que la verdura del día
//   --cf=A2          como A y, dentro del nivel del suelo, primero los que cubren la verdura del día
//   --cf=Bd          amplía la regla de familia al mismo día: comida y cena de distinta familia
//   --cf=sinBm       deshace Bm (implementada en src/ el 2026-11-13): sin el filtro «no repetir
//                    familia proteica en días seguidos». «Bm» se sigue aceptando y no hace nada.
//   --cf=sinS        deshace S (implementada en src/ el 2026-11-13): la sugerencia de la comida
//                    libre del sábado vuelve a contar como consumo y el paso 4 vuelve a dirigirla.
//                    «S» se sigue aceptando y no hace nada.
//   --cf=leg2        suelo semanal de legumbre 2 en lugar de 3
//   --cf=sinNiveles  sin paso 4 ni paso 5 (se conservan los filtros de D-099 y las preferencias)
//   --cf=azar        azar puro sobre el pool del hueco (sin tope, separación, familia, huevo,
//                    aliño, preferencias A y B, paso 4 ni paso 5). Con --azarNivel=base0 el azar
//                    es sobre lo que deja el tope por especie; con --azarNivel=baseF, sobre lo
//                    que dejan el tope y la separación por especie (para la separación sola,
//                    añadir el hook contrafactualesPescado.mjs con --sin=tope)
// Se combinan con comas. --cf=sinS,sinBm reproduce la línea anterior a las dos reglas.
// La variante «B» con pescado y marisco como familias distintas (definición del README) se
// midió antes de implementar Bm y ya no está en este hook (ver el historial de este archivo).
// La lógica de A vive en globalThis.__cf, que define medirDiseno.mjs.
// Si un ancla no aparece exactamente una vez, falla.
import { register } from 'node:module';

const arg = process.argv.find((a) => a.startsWith('--cf='));
const cf = arg ? arg.slice('--cf='.length).split(',').filter(Boolean) : [];
const VALIDOS = ['A', 'A2', 'Bm', 'Bd', 'sinBm', 'S', 'sinS', 'leg2', 'sinNiveles', 'azar'];
for (const c of cf) if (!VALIDOS.includes(c)) throw new Error(`contrafactualesDiseno: contrafactual desconocido «${c}»`);
globalThis.__cfFlags = Object.fromEntries(VALIDOS.map((c) => [c, cf.includes(c)]));
const argNivel = process.argv.find((a) => a.startsWith('--azarNivel='));
globalThis.__cfFlags.azarNivel = argNivel ? argNivel.slice('--azarNivel='.length) : 'pool';
if (!['pool', 'base0', 'baseF'].includes(globalThis.__cfFlags.azarNivel)) throw new Error('contrafactualesDiseno: --azarNivel desconocido');
process.stderr.write(`[contrafactualesDiseno] contrafactuales: ${cf.length ? cf.join(', ') : 'ninguno (reglas actuales)'}\n`);

const W = '/src/engine2/walk/runWalk.js';
const F = '/src/engine2/walk/frequencies.js';
const G = 'globalThis.__cf';
const CAMBIOS = [
  [W, '  const decisionLog = p1aRawLog.map(reshapeP1aEntry);',
    `  const decisionLog = p1aRawLog.map(reshapeP1aEntry);\n  if (${G}) ${G}.inicio(p1aSlots);`],
  // A necesita el momento del hueco; sinS deshace la sugerencia.
  [W, "      const esSugerencia = slot.fixedRole === 'libre' && momento === 'comida';",
    `      if (${G}) ${G}.momento = momento;\n      const esSugerencia = !(${G} && ${G}.flags.sinS) && slot.fixedRole === 'libre' && momento === 'comida';`],
  // sinBm deshace el filtro de familia.
  [W, "      if (!sinFamilia && profile?.dieta !== 'vegetariana' && profile?.dieta !== 'vegana' && !esSugerencia) {",
    `      if (!sinFamilia && !(${G} && ${G}.flags.sinBm) && profile?.dieta !== 'vegetariana' && profile?.dieta !== 'vegana' && !esSugerencia) {`],
  // Bd: también el mismo día.
  [W, '          if (Math.abs(DAYS_ORDER.indexOf(s2.day) - i) !== 1) continue;',
    `          { const dist = Math.abs(DAYS_ORDER.indexOf(s2.day) - i); if (!(dist === 1 || (dist === 0 && ${G} && ${G}.flags.Bd))) continue; }`],
  // sinNiveles y azar: el nivel final es candidatesB o el pool entero.
  [W, '      const { nivel: candidatesIdentidad, causa: causaIdentidad, evidencia: notaIdentidad } = chooseIdentityLevel({',
    `      const { nivel: candidatesIdentidad, causa: causaIdentidad, evidencia: notaIdentidad } = (${G} && ${G}.flags.azar) ? { nivel: (${G}.flags.azarNivel === "baseF" ? baseF : ${G}.flags.azarNivel === "base0" ? base0 : pool), causa: null, evidencia: null } : (${G} && ${G}.flags.sinNiveles) ? { nivel: candidatesB, causa: null, evidencia: null } : chooseIdentityLevel({`],
  [W, "      let notaRng = '';",
    `      let notaRng = '';\n      if (${G}) ${G}.hueco({ day, momento, causaFreq, notaFreq, notaFamilia, esSugerencia, omnivoro: profile?.dieta !== 'vegetariana' && profile?.dieta !== 'vegana', final: candidatesIdentidad });`],
  [F, 'export function chooseFrequencyLevel({',
    `export function chooseFrequencyLevel(input) {\n  return ${G} && ${G}.elegirNivel ? ${G}.elegirNivel(input, __nivelOriginal, { satisfaceVerdura, resolver: input.getVista || vistaPorDefecto(input.state, input.fuenteEditorial) }) : __nivelOriginal(input);\n}\nfunction __nivelOriginal({`],
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
