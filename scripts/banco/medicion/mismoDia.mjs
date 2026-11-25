// Un mismo día en varios perfiles, con la misma semilla: MEDICIÓN, no cambia reglas (Javi, 2026-11-23).
// Genera las semanas seguidas desde la 60 con el userId del primer perfil (banco-<perfil>) para todos, así que el walk
// elige los mismos platos y solo cambian las raciones. Escribe cada comida del día con su objetivo y lo que da (kcal y
// proteína), su preparación con cantidades y, si lo hay, el batido; y las causas de raciones de la guarnición.
// Uso: node --import ./scripts/banco/resolver.mjs [--import <hook>] scripts/banco/medicion/mismoDia.mjs \
//        <raíz> <salida.md> <semana> <día> <perfil> [<perfil> …] [--opciones del hook]
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const [raizArg, salida, semArg, dia, ...resto] = process.argv.slice(2);
const ids = resto.filter((a) => !a.startsWith('--'));
const raiz = pathToFileURL(raizArg.replace(/\/?$/, '/')).href;
const { generarPlan, platosRecientesPara } = await import(raiz + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(raiz + 'src/data/freeformPool.js');
const { batidoDelDia, objetivoDe } = await import(raiz + 'src/plan/racionesApp.js');
const { PERFILES } = await import(new URL('../perfiles.mjs', import.meta.url).href);
const { PERFILES_EXTRA } = await import(new URL('./perfilesExtra.mjs', import.meta.url).href);
const semana = Number(semArg);
const l = console.log; console.log = console.warn = console.error = () => {};
const L = [];
for (const id of ids) {
  const p = PERFILES.find((x) => x.id === id) || PERFILES_EXTRA.find((x) => x.id === id);
  if (!p) throw new Error(`mismoDia: perfil desconocido ${id}`);
  let ant = null; let plan = null;
  for (let s = 60; s <= semana; s++) {
    plan = generarPlan(JSON.parse(JSON.stringify(p.perfil)), p.kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: `banco-${ids[0]}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
    ant = plan;
  }
  const d = plan.days.find((x) => x.name === dia || x.day === dia);
  const obj = objetivoDe(p.perfil, p.kcal);
  const b = batidoDelDia(p.perfil, d);
  L.push(`### ${id}: ${p.kcal} kcal y ${obj.proteina} g de proteína al día (${p.perfil.goal}${b ? `; batido ${b.kcal} kcal y ${b.proteina} g, con la ${b.momento}` : ''})`, '');
  for (const m of d.meals.filter(Boolean)) {
    const r = m.sugerencia || m;
    const n = m.nutricion;
    L.push(`**${m.time}: ${r.title}**${n ? ` — objetivo ${n.objetivoKcal} kcal y ${n.objetivoProteina} g de proteína; da ${n.kcal} kcal y ${n.proteina} g` : ''}`, '');
    if (r.p1) L.push(`- ${r.p1}`);
    if (r.p2) L.push(`- ${r.p2}`);
    L.push('');
  }
  if (d.raciones) L.push(`Día: ${d.raciones.kcal} kcal y ${d.raciones.proteina} g de proteína${b ? ' (con el batido)' : ''}.`, '');
  const causas = (plan.decisionLog || []).filter((e) => e.causa === 'guarnicion_crece_por_energia' && (e.day === d.name || e.day === dia));
  for (const e of causas) L.push(`- \`${e.causa}\` — ${e.detalle || e.evidencia}`);
  L.push('');
}
console.log = l;
fs.writeFileSync(salida, L.join('\n'));
l(`${ids.length} perfiles → ${salida}`);
