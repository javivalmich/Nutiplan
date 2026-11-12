// Vuelca, para los perfiles del banco y 8 semanas, cada comida con sus ingredientes releídos
// (gramos por clave), kcal y proteína, y el desvío semanal. Sirve para comparar el motor con una
// variante (varianteB.mjs) o el antes y el después de un cambio.
// Uso: node --import ./scripts/banco/resolver.mjs [--import <variante>] \
//        scripts/banco/medicion/volcarItems.mjs <salida.json> [--perfil <id> …]
import fs from 'node:fs';

const R = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(R + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, clonar, SEMANA_INICIAL, SEMANAS_POR_DEFECTO, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { medirComida, medirPlan } = await import(R + 'src/plan/medidor/medir.js');
const { objetivoDe } = await import(R + 'src/plan/racionesApp.js');
const { COMPOSICION } = await import(R + 'src/engine2/nutrientes/composicion.js');

const args = process.argv.slice(2);
const salida = args[0];
if (!salida || salida.startsWith('--')) throw new Error('Falta el archivo de salida');
const soloPerfiles = args.flatMap((a, i) => (a === '--perfil' ? [args[i + 1]] : []));
const perfiles = soloPerfiles.length ? PERFILES.filter((p) => soloPerfiles.includes(p.id)) : PERFILES;

const out = { comidas: [], semanas: [] };
const log = console.log;
const err = console.error;
for (const p of perfiles) {
  let ant = null;
  const o = objetivoDe(p.perfil, p.kcal);
  for (let s = SEMANA_INICIAL; s < SEMANA_INICIAL + SEMANAS_POR_DEFECTO; s++) {
    console.log = console.error = () => {};
    const plan = generarPlan(clonar(p.perfil), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
    console.log = log; console.error = err;
    const m = medirPlan(plan, { kcal: p.kcal, proteina: o.proteina, peso: o.pesoKg }, COMPOSICION);
    out.semanas.push({ perfil: p.id, s, desvio: m.desvioSemana, kcalDia: m.mediaDia.kcal, protDia: m.mediaDia.proteina });
    plan.days.forEach((d, i) => d.meals.forEach((ml, j) => {
      if (!ml) return;
      const x = medirComida(ml, COMPOSICION);
      const it = {};
      for (const y of leerComida(ml).items) it[y.clave] = Math.round(((it[y.clave] || 0) + y.gramos) * 10) / 10;
      out.comidas.push({ k: `${p.id}|${s}|${i}|${j}`, title: ml.title, time: ml.time, kcal: x.kcal, prot: x.proteina, it, compra: ml.shopping });
    }));
    ant = plan;
  }
}
fs.writeFileSync(salida, JSON.stringify(out));
log(`${out.comidas.length} comidas, ${out.semanas.length} semanas → ${salida}`);
