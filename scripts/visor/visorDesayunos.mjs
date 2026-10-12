// visorDesayunos — desayunos y tentempiés de engine2 (D-110): la rutina de
// varias semanas seguidas para varios perfiles, como la genera la app, y la
// hoja del catálogo con su ficha, en una página HTML para revisarlos.
//
// Uso:
//   npx vite-node scripts/visor/visorDesayunos.mjs <salida.html> [semanas]
// No escribe en el repo.

import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { generarPlan, platosRecientesPara } from '../../src/plan/generarPlan.js';
import { FREEFORM_POOL } from '../../src/data/freeformPool.js';
import { DESAYUNOS, TENTEMPIES } from '../../src/data/DESAYUNOS.js';
import { medirComida, medirPlan } from '../../src/plan/medidor/medir.js';
import { objetivoDe } from '../../src/plan/racionesApp.js';
import { tieneProteinaAjustable } from '../../src/plan/desayunosApp.js';
import { COMPOSICION } from '../../src/engine2/nutrientes/composicion.js';

const salida = process.argv[2];
if (!salida) { console.error('uso: visorDesayunos.mjs <salida.html> [semanas]'); process.exit(1); }
const N = Number(process.argv[3] ?? 4);
console.error = () => {};

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const MUJER = { ...BASE, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 5, trainingDays: ['Martes'] };
const HOMBRE = { ...BASE, gender: 'male', age: 34, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 5, trainingDays: ['Lunes', 'Jueves'] };
const PERFILES = [
  ['omnivora', 'Omnívora', 'Hombre, 74 kg, mantener peso, 5 comidas al día', HOMBRE, 2400],
  ['vegetariana', 'Vegetariana', 'Mujer, 62 kg, mantener peso, 5 comidas al día', { ...MUJER, dieta: 'vegetariana' }, 2000],
  ['vegana', 'Vegana', 'Mujer, 62 kg, mantener peso, 5 comidas al día', { ...MUJER, dieta: 'vegana' }, 2000],
  ['lactosa', 'Sin lactosa', 'Mujer, 62 kg, mantener peso, intolerancia a la lactosa', { ...MUJER, intolerances: ['lactosa'] }, 2000],
  ['celiaca', 'Celíaca', 'Hombre, 74 kg, celiaquía, 4 comidas al día', { ...HOMBRE, intolerances: ['gluten'], mealsPerDay: 4 }, 2400],
  ['poco', 'Poco tiempo', 'Mujer, 62 kg, poco tiempo para cocinar', { ...MUJER, tiempoCocina: 'poco' }, 2000],
];
const NOMBRE_HUECO = { Desayuno: 'Desayuno', Almuerzo: 'Media mañana', Merienda: 'Merienda' };

const vista = (m) => {
  const n = medirComida(m, COMPOSICION);
  return { titulo: m.title, p1: m.p1 || '', p2: m.p2 || '', compra: m.shopping || [], receta: (m.recipe || []).filter((x) => typeof x === 'string'), kcal: n.kcal, prot: n.proteina };
};

const perfiles = PERFILES.map(([id, nombre, quien, P, kcal]) => {
  const semanas = [];
  let prev = [];
  for (let w = 41; w < 41 + N; w++) {
    const plan = generarPlan(P, kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: `visor-desayunos-${id}`, saveMealMemory: () => {}, platosRecientes: prev });
    prev = platosRecientesPara(plan, w, w + 1);
    const med = medirPlan(plan, { ...objetivoDe(P, kcal), peso: P.weight }, COMPOSICION);
    const huecos = ['Desayuno', 'Almuerzo', 'Merienda'].filter((h) => plan.days.some((d) => d.meals.some((m) => m && m.time === h)));
    const cortos = med.dias.flatMap((d) => d.comidas.filter((c) => c.momento === 'desayuno' && c.proteinaSuficiente === false)).length;
    semanas.push({
      semana: w - 40, desvio: med.desvioSemana, cortos,
      rutina: (plan.decisionLog || []).filter((e) => e.causa === 'desayuno_elegido').map((e) => e.detalle.replace(/\(escalón «(.+)»; RNG.*\)$/, '— $1')),
      dias: plan.days.map((d) => d.name),
      filas: huecos.map((h) => ({ hueco: NOMBRE_HUECO[h], celdas: plan.days.map((d) => { const m = d.meals.find((x) => x && x.time === h); return m ? vista(m) : null; }) })),
    });
  }
  return { id, nombre, quien, kcal, semanas };
});

const catalogo = [...DESAYUNOS, ...TENTEMPIES].map((m) => ({
  id: m.id, tipo: m.tipo, titulo: m.title, ...m.ficha, tiempo: m.metadata.tiempo,
  proteico: m.tipo === 'desayuno' ? tieneProteinaAjustable(m) : null,
  p1: m.p1, p2: m.p2, compra: m.shopping, receta: m.recipe, ...(({ kcal, proteina }) => ({ kcal, prot: proteina }))(medirComida(m, COMPOSICION)),
}));

let head = 'sin git';
try { head = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* sin git */ }
const datos = { head, generado: new Date().toISOString().slice(0, 10), semanas: N, perfiles, catalogo };
const plantilla = fs.readFileSync(new URL('./visorDesayunos.template.html', import.meta.url), 'utf8');
fs.writeFileSync(salida, plantilla.replace('/*__DATOS__*/null', JSON.stringify(datos).replace(/</g, '\\u003c')));
console.log(`visorDesayunos: ${perfiles.length} perfiles × ${N} semanas y ${catalogo.length} desayunos y tentempiés en ${salida}`);
