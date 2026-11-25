// Gramos de la guarnición de legumbre y pan en las comidas que la llevan: MEDICIÓN, no cambia reglas (Javi, 2026-11-23).
// Se usa con el hook variantesGuarnicion2.mjs y sus opciones (--baseGuarnicion=N…). Por cada comida con guarnición:
// gramos de la legumbre, si está en el máximo de su rango (240 g por la amplitud del objetivo), gramos de pan y kcal
// frente al objetivo de la comida.
// Uso: node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesGuarnicion2.mjs \
//        scripts/banco/medicion/gramosGuarnicion.mjs <raíz> <perfil del banco> <semanas> [--opciones del hook]
import { pathToFileURL } from 'node:url';

const [raizArg, perfilId, semArg] = process.argv.slice(2);
const raiz = pathToFileURL(raizArg.replace(/\/?$/, '/')).href;
const { generarPlan, platosRecientesPara } = await import(raiz + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(raiz + 'src/data/freeformPool.js');
const { PERFILES } = await import(raiz + 'scripts/banco/perfiles.mjs');
const { leerComida } = await import(raiz + 'src/plan/medidor/leerComida.js');
const p = PERFILES.find((x) => x.id === perfilId);
const l = console.log; console.log = console.warn = console.error = () => {};
const filas = [];
let ant = null;
for (let s = 60; s < 60 + Number(semArg); s++) {
  const plan = generarPlan(JSON.parse(JSON.stringify(p.perfil)), p.kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: `banco-${perfilId}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
  ant = plan;
  for (const d of plan.days) for (const m of d.meals.filter((x) => x && x._guarnicion && !x.sugerencia)) {
    const items = leerComida(m).items;
    const g = items.filter((it) => it.clave === m._guarnicion.clave).reduce((a, it) => a + it.gramos, 0);
    const pan = items.filter((it) => String(it.clave).startsWith('pan')).reduce((a, it) => a + it.gramos, 0);
    filas.push({ g, pan, kcal: m.nutricion.kcal, oK: m.nutricion.objetivoKcal });
  }
}
console.log = l;
const media = (f) => filas.reduce((a, x) => a + f(x), 0) / filas.length;
const hist = {};
for (const x of filas) hist[x.g] = (hist[x.g] || 0) + 1;
l(`${perfilId}: ${filas.length} comidas con guarnición; legumbre ${media((x) => x.g).toFixed(0)} g de media (mín. ${Math.min(...filas.map((x) => x.g))}, máx. ${Math.max(...filas.map((x) => x.g))}); en 240 g o más: ${filas.filter((x) => x.g >= 240).length}; con pan: ${filas.filter((x) => x.pan > 0).length} (${media((x) => x.pan).toFixed(0)} g de media en todas); kcal/objetivo ${(100 * media((x) => x.kcal / x.oK)).toFixed(1)} %`);
l(`gramos de legumbre: ${Object.entries(hist).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v}`).join(' ')}`);
