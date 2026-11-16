// Comidas dobles fuera de ±5 % de las kcal de su comida: MEDICIÓN, no cambia reglas. Genera N semanas seguidas por
// perfil del banco por la entrada de la app (generarPlan), busca las comidas dobles cuyas kcal se apartan más de un 5 %
// del objetivo de su comida y, con la réplica de las raciones del banco (metricas.mjs, racionesCalculadas), dice qué
// ingredientes quedaron en su mínimo o en su máximo, y si se añadió pan o fruta.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/fueraComidaDoble.mjs <salida.md> [--semanas 200]
import fs from 'node:fs';

const R = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(R + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, MES, SEMANA_INICIAL, clonar } = await import(R + 'scripts/banco/perfiles.mjs');
const { racionesCalculadas } = await import(R + 'scripts/banco/metricas.mjs');
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { aplicarNombresD105 } = await import(R + 'src/engine2/dishes/alinosD105.js');
const { aplicarAjustesD099 } = await import(R + 'src/engine2/dishes/ajustesD099.js');

const salida = process.argv[2];
if (!salida || salida.startsWith('--')) throw new Error('Falta el archivo de salida');
const iS = process.argv.indexOf('--semanas');
const SEMANAS = iS > 0 ? Number(process.argv[iS + 1]) : 200;
const nombre = new Map(aplicarNombresD105(aplicarAjustesD099(catalogoApp())).map((d) => [d.id, d.nombre]));
const silencio = (f) => { const l = console.log, e = console.error, w = console.warn; console.log = console.error = console.warn = () => {}; try { return f(); } finally { console.log = l; console.error = e; console.warn = w; } };
const n1 = (x) => x.toFixed(1).replace('.', ',');

const casos = [];
const totales = {};
for (const p of PERFILES) {
  let ant = null;
  totales[p.id] = { dobles: 0, desvios: [] };
  for (let s = SEMANA_INICIAL; s < SEMANA_INICIAL + SEMANAS; s++) {
    const plan = silencio(() => generarPlan(clonar(p.perfil), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) }));
    ant = plan;
    for (const day of plan.days) {
      const k = day.meals.findIndex((m) => m && m._dishId2);
      if (k < 0) continue;
      const m = day.meals[k];
      const n = m.nutricion;
      const desvio = (n.kcal - n.objetivoKcal) / n.objetivoKcal;
      totales[p.id].dobles += 1;
      totales[p.id].desvios.push(desvio);
      if (Math.abs(desvio) <= 0.05) continue;
      const calc = racionesCalculadas(day, clonar(p.perfil), p.kcal).comidas[String(k)];
      const limitados = calc.items.filter((it) => it.limitado).map((it) => `${it.clave} en su ${it.limitado}`);
      const reparto = (plan.decisionLog || []).find((e) => e.day === day.name && e.causa === 'reparto_del_resto');
      const resto = reparto ? Number((reparto.detalle.match(/^(-?\d+) kcal/) || [])[1]) : 0;
      casos.push({ perfil: p.id, semana: s, nombreDia: day.name, primero: nombre.get(m._dishId), segundo: nombre.get(m._dishId2), kcal: n.kcal, objetivo: n.objetivoKcal, desvio, limitados, anadidos: m.acompanamientos || [], replica: calc.kcal === n.kcal, resto, dia: `${day.raciones.kcal} / ${day.raciones.objetivoKcal}` });
    }
  }
  process.stderr.write(`${p.id} `);
}

const L = ['# Comidas dobles fuera de ±5 % de las kcal de su comida', '',
  `Salida de \`fueraComidaDoble.mjs\`. ${SEMANAS} semanas seguidas por perfil, por la entrada de la app (\`generarPlan\`), con el motor de hoy. Desviación = (kcal de la comida − objetivo de la comida) / objetivo. Los ingredientes en su mínimo o su máximo salen de la réplica de las raciones del banco (\`metricas.mjs\`, \`racionesCalculadas\`); «réplica igual» dice si da las mismas kcal que la app.`, '',
  '## Por perfil', '',
  '| Perfil | Comidas dobles | Fuera de ±5 % | Por encima | Por debajo | Desviación media de las de fuera | Máxima | Desviación máxima de todas las comidas dobles |', '|---|---|---|---|---|---|---|---|'];
for (const p of PERFILES) {
  const t = totales[p.id];
  if (!t.dobles) continue;
  const c = casos.filter((x) => x.perfil === p.id);
  const abs = c.map((x) => Math.abs(x.desvio));
  L.push(`| ${p.id} | ${t.dobles} | ${c.length} | ${c.filter((x) => x.desvio > 0).length} | ${c.filter((x) => x.desvio < 0).length} | ${c.length ? `${n1(100 * abs.reduce((a, b) => a + b, 0) / abs.length)} %` : '—'} | ${c.length ? `${n1(100 * Math.max(...abs))} %` : '—'} | ${n1(100 * Math.max(...t.desvios.map(Math.abs)))} % |`);
}
const cuenta = (xs) => { const o = {}; for (const x of xs) o[x] = (o[x] || 0) + 1; return Object.entries(o).sort((a, b) => b[1] - a[1]); };
L.push('', '## Qué llevan', '', `Primeros: ${cuenta(casos.map((x) => x.primero)).map(([k, n]) => `${k} ${n}`).join(' · ')}.`, '',
  `Segundos: ${cuenta(casos.map((x) => x.segundo)).map(([k, n]) => `${k} ${n}`).join(' · ')}.`, '',
  '## Qué no deja ajustar', '', `Ingredientes en su mínimo o su máximo (en cuántas de las ${casos.length}): ${cuenta(casos.flatMap((x) => x.limitados)).map(([k, n]) => `${k} ${n}`).join(' · ')}.`, '',
  `Con pan o fruta añadidos: ${casos.filter((x) => x.anadidos.length).length} de ${casos.length}. Réplica igual que la app: ${casos.filter((x) => x.replica).length} de ${casos.length}.`, '',
  `Por encima de su objetivo: ${casos.filter((x) => x.desvio > 0).length}; de ellas, ${casos.filter((x) => x.desvio > 0 && x.resto < 0).length} en días en que el reparto del resto bajó el objetivo de la comida (otras comidas del día no bajaban de sus mínimos), y ${casos.filter((x) => x.desvio > 0 && x.limitados.filter((l) => / en su minimo$/.test(l)).length >= 3).length} con la legumbre y los dos aceites en su mínimo.`, '',
  `Por debajo de su objetivo: ${casos.filter((x) => x.desvio < 0).length}; de ellas, ${casos.filter((x) => x.desvio < 0 && x.limitados.some((l) => /(pollo|pavo|ternera|cerdo|conejo)\S* en su minimo$/.test(l))).length} con el proteico del segundo en su mínimo, que hoy no puede crecer (\`ajustarComida\` solo hace crecer un proteico que no esté en ningún límite).`, '',
  '## Todas', '', '| Perfil | Semana | Día | Primero | Segundo | kcal / objetivo de la comida | Desviación | En su mínimo o máximo | Añadido | Reparto del resto del día (kcal) | Día: kcal / objetivo |', '|---|---|---|---|---|---|---|---|---|---|---|',
  ...casos.map((x) => `| ${x.perfil} | ${x.semana} | ${x.nombreDia} | ${x.primero} | ${x.segundo} | ${x.kcal} / ${x.objetivo} | ${n1(100 * x.desvio)} % | ${x.limitados.join(', ') || '—'} | ${x.anadidos.join(', ') || '—'} | ${x.resto || '—'} | ${x.dia} |`));
fs.writeFileSync(salida, `${L.join('\n')}\n`);
console.log(`\n${casos.length} comidas dobles fuera de ±5 % → ${salida}`);
