// Tope semanal de pescado y marisco, y legumbre a 4: MEDICIÓN, no producto. Hook de carga que se usa junto a
// medirEstructura.mjs (--ec=off, la app tal cual) y aplica en memoria, sin modificar ningún archivo de src/:
//
//   --topePescado=N   pescado y marisco, como una sola familia (por especie: atún, bacalao, berberechos, bonito,
//                     calamares, corvina, dorada, gambas, mejillones, merluza, salmón, sardinas), como mucho N platos
//                     servidos por semana (comida, cena y segundos; no la sugerencia de la comida libre, que no se
//                     sirve). En cada hueco, si ya se han servido N, se quitan del pool los platos de pescado o
//                     marisco, justo después del tope de 2 por especie (runWalk.js), y el hueco sigue por la cascada
//                     normal. Si quitar el pescado lo dejara sin candidatos, no se aplica y lo dice el log. El suelo
//                     de pescado de D-024 (3) no cambia.
//   --legumbre=4      el suelo de legumbre (DEFAULT_WEEKLY_TARGETS.legumbre, contracts/weeklyTargets.js), que con
//                     D-117.6 es el número de días sorteados, pasa de 3 a 4.
//
// Uso (desde la raíz del repo):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesPescado.mjs \
//     scripts/banco/medicion/medirEstructura.mjs <salida.json> --ec=off --topePescado=3 [--legumbre=4] [--semanas 200]
import { register } from 'node:module';

const valor = (n) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : null; };
const tope = valor('topePescado') ? Number(valor('topePescado')) : null;
const legumbre = valor('legumbre') ? Number(valor('legumbre')) : null;
if (tope != null && !(tope >= 0)) throw new Error('variantesPescado: --topePescado debe ser un número');
if (legumbre != null && legumbre !== 4) throw new Error('variantesPescado: --legumbre solo admite 4');
process.stderr.write(`[variantesPescado] tope de pescado ${tope == null ? 'sin tope' : tope}; legumbre ${legumbre || 3}\n`);

export const PESCADO = new Set(['atun', 'bacalao', 'berberechos', 'bonito', 'calamares', 'corvina', 'dorada', 'gambas', 'mejillones', 'merluza', 'salmon', 'sardinas']);
globalThis.__tp = {
  /** Quita el pescado y el marisco del pool del hueco si la semana ya llega al tope. */
  filtrar({ base0, slots, proteinaCache, day, momento, pushEvent }) {
    if (tope == null) return base0;
    const servidos = [...slots.values()].filter((s) => !s.abierto && s.dishId && !(s.fixedRole === 'libre' && s.momento === 'comida'));
    const n = servidos.filter((s) => PESCADO.has(proteinaCache(s.dishId))).length;
    if (n < tope) return base0;
    const sin = base0.filter((d) => !PESCADO.has(proteinaCache(d.id)));
    if (sin.length === base0.length) return base0;
    if (!sin.length) { pushEvent(day, 'tope_pescado_semana_sin_aplicar', `${momento}: ya salen ${n} platos de pescado o marisco (tope ${tope}), pero quitarlos dejaria el hueco sin candidatos`); return base0; }
    pushEvent(day, 'tope_pescado_semana', `${momento}: ya salen ${n} platos de pescado o marisco (tope ${tope}): fuera ${base0.length - sin.length} candidatos`);
    return sin;
  },
};

const CAMBIOS = [];
if (tope != null) {
  CAMBIOS.push(['/src/engine2/walk/runWalk.js', '      const base0 = poolTope.length ? poolTope : pool;',
    '      const base0 = globalThis.__tp.filtrar({ base0: poolTope.length ? poolTope : pool, slots, proteinaCache, day, momento, pushEvent });']);
}
if (legumbre) CAMBIOS.push(['/src/engine2/contracts/weeklyTargets.js', '  legumbre: 3,', `  legumbre: ${legumbre},`]);

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
    if (t.split(a).length !== 2) throw new Error('variantesPescado: ancla no encontrada (o repetida) en ' + sufijo + ': ' + ancla);
    t = t.replace(a, () => nuevo.split('\\n').join(nl));
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
