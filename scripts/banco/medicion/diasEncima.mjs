// Días por encima del 105 % de su objetivo de kcal: MEDICIÓN, no cambia reglas. Genera N semanas seguidas de un perfil
// del banco por la entrada de la app (generarPlan) del árbol <raíz> y vuelca, por día servido (sin el de la comida
// libre), sus kcal frente al objetivo, si la comida es doble, si es legumbre compuesta como plato único y si el
// desayuno son las crepes de avena. Para medir «hoy» (ba52d21) sin worktree, como en aceiteDoble.mjs.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/diasEncima.mjs <raíz> <salida.json> [perfil] [semanas]
// Resumen: node scripts/banco/medicion/diasEncima.mjs --resumen <hoy.json> <ahora.json> [salida.md]
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

if (process.argv[2] === '--resumen') {
  const [fH, fA, salida] = process.argv.slice(3);
  const H = JSON.parse(fs.readFileSync(fH, 'utf8'));
  const A = JSON.parse(fs.readFileSync(fA, 'utf8'));
  const n1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace('.', ',') : '—');
  const fila = (nombre, ds) => {
    const enc = ds.filter((d) => d.kcal > 1.05 * d.objetivo).map((d) => (100 * (d.kcal - d.objetivo)) / d.objetivo);
    return `| ${nombre} | ${ds.length} | ${enc.length} (${ds.length ? Math.round((100 * enc.length) / ds.length) : 0} %) | ${enc.length ? `${n1(enc.reduce((a, b) => a + b, 0) / enc.length)} %` : '—'} | ${enc.length ? `${n1(Math.max(...enc))} %` : '—'} |`;
  };
  const L = [`# Días por encima del 105 % de su objetivo de kcal (${A.perfil}, ${A.semanas} semanas)`, '',
    'Salida de `diasEncima.mjs`. Días servidos (sin el de la comida libre) por la entrada de la app (`generarPlan`). «Hoy» es `ba52d21`, antes de D-116 y D-117; «ahora», esta rama. La desviación es la de los días por encima.', '',
    '| Grupo de días | Días | Por encima del 105 % | Desviación media | Máxima |', '|---|---|---|---|---|',
    fila('Hoy: todos', H.dias), fila('Ahora: todos', A.dias), '| | | | | |',
    fila('Hoy: comida de legumbre compuesta como plato único', H.dias.filter((d) => d.legumbreUnico)), fila('Ahora: comida doble', A.dias.filter((d) => d.doble)),
    fila('Hoy: sin legumbre compuesta en la comida', H.dias.filter((d) => !d.legumbreUnico)), fila('Ahora: sin comida doble', A.dias.filter((d) => !d.doble)), '| | | | | |',
    fila('Hoy: crepes en el desayuno', H.dias.filter((d) => d.crepes)), fila('Ahora: crepes en el desayuno', A.dias.filter((d) => d.crepes)),
    fila('Hoy: crepes y legumbre compuesta como plato único', H.dias.filter((d) => d.crepes && d.legumbreUnico)), fila('Ahora: crepes y comida doble', A.dias.filter((d) => d.crepes && d.doble)),
    fila('Hoy: crepes, sin legumbre compuesta', H.dias.filter((d) => d.crepes && !d.legumbreUnico)), fila('Ahora: crepes, sin comida doble', A.dias.filter((d) => d.crepes && !d.doble))];
  const texto = L.join('\n');
  console.log(texto);
  if (salida) fs.writeFileSync(salida, `${texto}\n`);
  process.exit(0);
}

const raiz = pathToFileURL(process.argv[2].replace(/\/?$/, '/')).href;
const ACT = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(raiz + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(raiz + 'src/data/freeformPool.js');
const { PERFILES, MES } = await import(ACT + 'scripts/banco/perfiles.mjs');
const { tuplaDe } = await import(ACT + 'src/plan/textos/componer.js');
const perfilId = process.argv[4] || 'omni-1434';
const SEM = Number(process.argv[5] || 200);
const p = PERFILES.find((x) => x.id === perfilId);
const l = console.log; console.log = console.warn = console.error = () => {};
const dias = [];
let ant = null;
for (let s = 60; s < 60 + SEM; s++) {
  const plan = generarPlan(JSON.parse(JSON.stringify(p.perfil)), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
  ant = plan;
  for (const d of plan.days) {
    const meals = d.meals.filter(Boolean);
    if (meals.some((m) => m.sugerencia) || !d.raciones) continue;
    const comida = meals.find((m) => m.time === 'Comida');
    const t = comida && tuplaDe(comida._dishId);
    dias.push({ s, dia: d.name, kcal: d.raciones.kcal, objetivo: d.raciones.objetivoKcal, doble: !!(comida && comida._dishId2), legumbreUnico: !!(t && t.tmpl === 'legumbre' && !comida._dishId2), crepes: meals.some((m) => m.time === 'Desayuno' && /crepes/i.test(m.title || '')) });
  }
}
fs.writeFileSync(process.argv[3], JSON.stringify({ perfil: perfilId, semanas: SEM, dias }));
l(`${dias.length} días → ${process.argv[3]}`);
