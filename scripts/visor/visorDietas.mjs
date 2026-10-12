// visorDietas — semanas vegetarianas y veganas de la app (engine2 por la capa
// de la app, como en producción) y la hoja de platos nuevos (D-107), en una
// página HTML para revisarlas.
//
// Uso:
//   node --import ./scripts/medidor/resolverVite.mjs scripts/visor/visorDietas.mjs <salida.html> [semanas]
// No escribe en el repo.

import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { generarPlanEngine2 } from '../../src/plan/engine2App.js';
import { loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';
import { FREEFORM_POOL } from '../../src/data/freeformPool.js';
import { PLATOS_DIETA, DESAYUNOS_DIETA, TENTEMPIES_DIETA } from '../../src/data/PLATOS_DIETA.js';
import { medirComida, medirPlan } from '../../src/plan/medidor/medir.js';
import { objetivoDe } from '../../src/plan/racionesApp.js';
import { COMPOSICION } from '../../src/engine2/nutrientes/composicion.js';
import { calcTDEE, calcTarget } from '../../src/engine/nutrition.js';

const salida = process.argv[2];
if (!salida) { console.error('uso: visorDietas.mjs <salida.html> [semanas]'); process.exit(1); }
const N = Number(process.argv[3] ?? 10);

const PERFIL = {
  intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {},
  gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes', 'Jueves'],
};
const kcal = calcTarget(calcTDEE(PERFIL.gender, PERFIL.age, PERFIL.weight, PERFIL.height, PERFIL.activity), PERFIL.goal, 0);
const catalog = loadCatalog();
const propios = new Set([...DESAYUNOS_DIETA, ...TENTEMPIES_DIETA].map((m) => m.title));

const comidaVista = (m) => {
  const n = medirComida(m, COMPOSICION);
  return {
    momento: m.time, titulo: m.title,
    nuevo: /^dieta_/.test(m._dishId || '') || propios.has(m.title),
    p1: m.p1 || '', p2: m.p2 || '', compra: m.shopping || [], receta: (m.recipe || []).filter((x) => typeof x === 'string'),
    kcal: n.kcal, prot: n.proteina, libre: n.libre,
  };
};

const dietas = {};
for (const dieta of ['vegetariana', 'vegana']) {
  const P = { ...PERFIL, dieta };
  let prev = [];
  dietas[dieta] = [];
  for (let w = 1; w <= N; w++) {
    const plan = generarPlanEngine2(P, kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: `visor-${dieta}`, saveMealMemory: () => {}, platosRecientes: prev, catalogo: catalog });
    prev = plan.platosSemana || [];
    const med = medirPlan(plan, { ...objetivoDe(P, kcal), peso: P.weight }, COMPOSICION);
    dietas[dieta].push({
      semana: w,
      desvio: med.desvioSemana,
      cortas: med.comidasPrincipalesCortas,
      minProt: med.minProteinaComida,
      cambios: (plan.decisionLog || []).filter((e) => /^desayuno_/.test(e.causa || '')).length,
      dias: plan.days.map((d) => ({ dia: d.name, comidas: d.meals.filter(Boolean).map(comidaVista) })),
    });
  }
}

const platos = PLATOS_DIETA.map((p) => ({
  id: p.identity.id, titulo: p.identity.title, dieta: p.dieta, proteina: p.identity.protein,
  momento: p.engine2.momento, tipo: p.engine2.plateType, energia: p.engine2.energiaCocina, temp: p.engine2.tempFeel,
  batch: p.engine2.batchable, dias: p.engine2.shelfLifeDays, tiempo: p.behavior.tiempo,
  p1: p.content.p1, p2: p.content.p2, compra: p.content.shopping, receta: p.content.recipe,
}));
const desayunos = [...DESAYUNOS_DIETA, ...TENTEMPIES_DIETA].map((m) => ({ titulo: m.title, momento: m.time === 'Desayuno' ? 'Desayuno' : 'Tentempié', p1: m.p1, p2: m.p2, compra: m.shopping, receta: m.recipe }));

let head = 'sin git';
try { head = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* sin git */ }
const datos = { head, generado: new Date().toISOString().slice(0, 10), kcal, perfil: 'Mujer, 34 años, 62 kg, actividad moderada, mantener peso, 4 comidas al día', dietas, platos, desayunos };
const plantilla = fs.readFileSync(new URL('./visorDietas.template.html', import.meta.url), 'utf8');
fs.writeFileSync(salida, plantilla.replace('/*__DATOS__*/null', JSON.stringify(datos).replace(/</g, '\\u003c')));
console.log(`visorDietas: ${N} semanas por dieta y ${platos.length} platos nuevos en ${salida}`);
