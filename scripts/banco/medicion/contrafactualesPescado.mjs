// Auditoría B (pescado y familias proteicas): MEDICIÓN, no producto. Hook de carga que
//   1. instrumenta runWalk.js: anota, por cada hueco de comida y cena que elige el walk, los
//      candidatos que quedan tras cada filtro (pool, tope de proteína, proteína separada, huevo,
//      aliño, preferencias A y B, paso 4 y paso 5) y la causa del paso 4;
//   2. con --sin=<regla>[,<regla>…], desactiva reglas en memoria para medir el contrafactual:
//        suelo       suelo semanal de pescado (DEFAULT_WEEKLY_TARGETS.pescado 3 → 0)
//        legumbre    suelo semanal de legumbre (3 → 0)
//        separacion  proteína separada (misma especie el día de al lado)
//        tope        tope de 2 veces por semana de la misma proteína principal
//        verdura     sub-regla diaria de verdura del paso 4
//        prefA       preferencia A (plateType distinto del de ayer en el mismo momento)
// No modifica ningún archivo de src/: transforma el texto al cargarlo. Si un ancla no aparece
// exactamente una vez, falla.
// Uso: node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/contrafactualesPescado.mjs \
//        scripts/banco/medicion/auditoriaPescado.mjs [--sin=suelo,…]
import { register } from 'node:module';

const INSTRUMENTA = [
  ['/src/engine2/walk/runWalk.js', '  const decisionLog = p1aRawLog.map(reshapeP1aEntry);',
    '  const decisionLog = p1aRawLog.map(reshapeP1aEntry);\n  if (globalThis.__audPescado) globalThis.__audPescado.inicio(p1aSlots);'],
  ['/src/engine2/walk/runWalk.js', "      let notaRng = '';",
    "      let notaRng = '';\n      if (globalThis.__audPescado) globalThis.__audPescado.hueco({ day, momento, etapas: { pool, tope: base0, separacion: baseH, huevo: poolHuevo, alino: poolAlino.length ? poolAlino : base1, prefA: candidatesA, prefB: candidatesB, paso4: candidatesFinal, paso5: candidatesIdentidad }, causaFreq, notaFreq });"],
];
const CONTRAFACTUALES = {
  suelo: [['/src/engine2/contracts/weeklyTargets.js', '  pescado: 3,', '  pescado: 0,']],
  legumbre: [['/src/engine2/contracts/weeklyTargets.js', '  legumbre: 3,', '  legumbre: 0,']],
  separacion: [['/src/engine2/walk/runWalk.js', 'const poolSeparado = base0.filter((d) => !cercanas.has(proteinaCache(d.id)));', 'const poolSeparado = base0;']],
  tope: [['/src/engine2/walk/runWalk.js', 'const poolTope = pool.filter((d) => (cuentaProteina.get(proteinaCache(d.id)) || 0) < TOPE_PROTEINA_SEMANA);', 'const poolTope = pool;']],
  verdura: [['/src/engine2/walk/frequencies.js', '  if (!state.diasConVerdura.has(day)) {', '  if (false) {']],
  prefA: [['/src/engine2/walk/runWalk.js', 'const afterA = candidatesA.filter((d) => d.plateType !== ayer.plateType);', 'const afterA = candidatesA;']],
};

const arg = process.argv.find((a) => a.startsWith('--sin='));
const sin = arg ? arg.slice('--sin='.length).split(',').filter(Boolean) : [];
for (const s of sin) if (!CONTRAFACTUALES[s]) throw new Error(`contrafactualesPescado: regla desconocida «${s}»`);
const cambios = [...INSTRUMENTA, ...sin.flatMap((s) => CONTRAFACTUALES[s])];
process.stderr.write(`[contrafactualesPescado] reglas desactivadas: ${sin.length ? sin.join(', ') : 'ninguna'}\n`);

const hooks = `
const CAMBIOS = ${JSON.stringify(cambios)};
export async function load(url, contexto, siguiente) {
  const r = await siguiente(url, contexto);
  const mios = CAMBIOS.filter(([sufijo]) => url.endsWith(sufijo));
  if (!mios.length) return r;
  let t = String(r.source);
  const nl = t.includes('\\r\\n') ? '\\r\\n' : '\\n';
  for (const [sufijo, ancla, nuevo] of mios) {
    const a = ancla.split('\\n').join(nl);
    if (t.split(a).length !== 2) throw new Error('contrafactualesPescado: ancla no encontrada en ' + sufijo + ': ' + ancla);
    t = t.replace(a, nuevo.split('\\n').join(nl));
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
