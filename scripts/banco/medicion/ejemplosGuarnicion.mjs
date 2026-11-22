// Semanas de ejemplo del prototipo de guarnición, tal como las vería el usuario: MEDICIÓN, no cambia reglas.
// Escribe, para cada semana pedida, la comida y la cena de cada día (título, preparación, compra y receta) y las causas
// de la guarnición del log. Las semanas se generan seguidas desde la 60 (cada una con los platos de la anterior).
// Uso: node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesGuarnicion.mjs \
//        scripts/banco/medicion/ejemplosGuarnicion.mjs <raíz> <salida.md> <perfil del banco> <semana> [<semana> …] [--opciones del hook]
// También vale con variantesGuarnicion2.mjs (y --compuestosSoloSinOtro).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const [raizArg, salida, perfilId, ...semanasArg] = process.argv.slice(2);
const raiz = pathToFileURL(raizArg.replace(/\/?$/, '/')).href;
const { generarPlan, platosRecientesPara } = await import(raiz + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(raiz + 'src/data/freeformPool.js');
const { PERFILES } = await import(raiz + 'scripts/banco/perfiles.mjs');
const p = PERFILES.find((x) => x.id === perfilId);
if (!p) throw new Error(`ejemplosGuarnicion: perfil desconocido ${perfilId}`);
const pedidas = new Set(semanasArg.filter((a) => !a.startsWith('--')).map(Number));
const hasta = Math.max(...pedidas);
const l = console.log; console.log = console.warn = console.error = () => {};
const L = [];
let ant = null;
for (let s = 60; s <= hasta; s++) {
  const plan = generarPlan(JSON.parse(JSON.stringify(p.perfil)), p.kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: `banco-${perfilId}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
  ant = plan;
  if (!pedidas.has(s)) continue;
  L.push(`## ${perfilId}, semana ${s} (${p.kcal} kcal)`, '');
  for (const d of plan.days) {
    L.push(`### ${d.name}`, '');
    for (const m of d.meals.filter((x) => x && (x.time === 'Comida' || x.time === 'Cena'))) {
      const r = m.sugerencia || m;
      L.push(`**${m.time}${m.sugerencia ? ' (comida libre; sugerencia)' : ''}: ${r.title}**${r._guarnicion ? ` — guarnición de ${r._guarnicion.legumbre} en lugar de ${r._guarnicion.hidratoOriginal}` : ''}`, '');
      if (r.p1) L.push(`- ${r.p1}`);
      if (r.p2) L.push(`- ${r.p2}`);
      if (r.shopping && r.shopping.length) L.push(`- Compra: ${r.shopping.join(' · ')}`);
      if (r._guarnicion && r.recipe) L.push(`- Receta: ${r.recipe.filter((x) => typeof x === 'string').join(' ')}`);
      L.push('');
    }
  }
  const causas = (plan.decisionLog || []).filter((e) => typeof e.causa === 'string' && e.causa.startsWith('guarnicion_'));
  L.push('Causas de la guarnición en el log:', '', ...causas.map((e) => `- ${e.day ? `${e.day}, ${e.momentoGuarnicion}: ` : ''}\`${e.causa}\` — ${e.evidencia}`), '');
}
console.log = l;
fs.writeFileSync(salida, L.join('\n'));
l(`${pedidas.size} semanas → ${salida}`);
