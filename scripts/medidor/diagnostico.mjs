// diagnostico — mide lo que de verdad llevan los planes de los dos motores
// (kcal, proteína, hidratos, grasa) frente al objetivo de cada usuario, con
// los criterios de src/eval/medidor/medir.js.
//
// Genera, para varios perfiles tipo, semanas seguidas como en producción:
//   - engine2 por la capa de la app (src/plan/engine2App.js), con
//     platosRecientes de la semana anterior;
//   - legacy con buildPlan y su memoria de proteínas, como en producción.
// El objetivo diario sale de las mismas funciones que usa la app
// (calcTDEE, calcTarget, calcMacros, computeStrategy).
//
// Uso:
//   node --import ./scripts/medidor/resolverVite.mjs scripts/medidor/diagnostico.mjs --composicion <composicion.json> --salida <informe.json> [--semanas 8]
// No escribe en el repo.

import fs from 'node:fs';
import { buildPlan } from '../../src/engine/buildPlan.js';
import { calcTDEE, calcTarget, calcMacros, computeStrategy, getPastProteinFrequency } from '../../src/engine/nutrition.js';
import { generarPlanEngine2 } from '../../src/plan/engine2App.js';
import { loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';
import { FREEFORM_POOL } from '../../src/data/freeformPool.js';
import { medirPlan } from '../../src/eval/medidor/medir.js';

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const rutaComp = arg('--composicion');
const salida = arg('--salida');
const SEMANAS = Number(arg('--semanas', 8));
if (!rutaComp || !salida) { console.error('uso: diagnostico.mjs --composicion <composicion.json> --salida <informe.json> [--semanas 8]'); process.exit(1); }

const comp = JSON.parse(fs.readFileSync(rutaComp, 'utf8'));
const composicion = comp.ingredientes || comp;

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
export const PERFILES = [
  { id: 'H74-mantener', gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 3, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] },
  { id: 'M60-perder', gender: 'female', age: 32, weight: 60, height: 163, activity: 'light', goal: 'fatLossGeneral', mealsPerDay: 4, trainingDays: ['Martes', 'Jueves'] },
  { id: 'H90-ganar', gender: 'male', age: 28, weight: 90, height: 185, activity: 'active', goal: 'muscleGain', mealsPerDay: 5, trainingDays: ['Lunes', 'Martes', 'Jueves', 'Viernes'] },
  { id: 'M68-mantener', gender: 'female', age: 45, weight: 68, height: 166, activity: 'sedentary', goal: 'maintain', mealsPerDay: 3, trainingDays: [] },
  { id: 'H82-definir', gender: 'male', age: 40, weight: 82, height: 176, activity: 'moderate', goal: 'fatLoss', mealsPerDay: 4, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] },
];

const catalogo = loadCatalog();
const clon = (o) => JSON.parse(JSON.stringify(o));

function objetivoDe(p) {
  const kcal = calcTarget(calcTDEE(p.gender, p.age, p.weight, p.height, p.activity), p.goal, p.kcalAdjust || 0);
  const estrategia = computeStrategy(p);
  const macros = calcMacros(kcal, p.weight, p.goal, p.activity, estrategia);
  return { kcal, proteina: macros.protein, peso: p.weight, estrategia };
}

const resultados = [];
for (const perfil0 of PERFILES) {
  const perfil = { ...BASE, ...perfil0 };
  const obj = objetivoDe(perfil);
  const memoria = [];
  let recientes = [];
  for (let s = 0; s < SEMANAS; s++) {
    const weekNumber = 40 + s;
    const opts = { month: 9, freeFormPool: FREEFORM_POOL, weekNumber, userId: `diag-${perfil.id}` };
    const pastProteins = getPastProteinFrequency(memoria);
    const legacy = buildPlan(clon(perfil), obj.kcal, { ...opts, pastProteins, saveMealMemory: (wk, L, D) => { memoria.unshift({ week: wk, L, D }); memoria.length = Math.min(memoria.length, 4); } });
    const e2 = generarPlanEngine2(clon(perfil), obj.kcal, { ...opts, pastProteins: {}, catalogo, platosRecientes: recientes });
    recientes = e2.platosSemana;
    for (const [motor, plan] of [['legacy', legacy], ['engine2', e2]]) {
      const m = medirPlan(plan, { kcal: obj.kcal, proteina: obj.proteina, peso: obj.peso }, composicion);
      resultados.push({ perfil: perfil.id, motor, semana: weekNumber, objetivo: obj, ...m });
    }
  }
}

// Resumen por perfil y motor.
const resumen = [];
const grupos = new Map();
for (const r of resultados) {
  const k = `${r.perfil}|${r.motor}`;
  if (!grupos.has(k)) grupos.set(k, []);
  grupos.get(k).push(r);
}
const media = (xs) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
for (const [k, rs] of grupos) {
  const [perfil, motor] = k.split('|');
  const dias = rs.flatMap((r) => r.dias.filter((d) => !d.libre));
  const principales = dias.flatMap((d) => d.comidas.filter((c) => c.principal));
  const porMomento = (mom) => principales.filter((c) => c.momento === mom).map((c) => c.proteina);
  const fuera = (mom) => {
    const ds = dias.filter((d) => d.reparto[mom]);
    return ds.length ? Math.round((ds.filter((d) => !d.reparto[mom].dentro).length / ds.length) * 100) : null;
  };
  resumen.push({
    perfil, motor,
    objetivoKcal: rs[0].objetivo.kcal, objetivoProteina: rs[0].objetivo.proteina, minProteinaComida: rs[0].minProteinaComida,
    kcalDia: media(rs.map((r) => r.mediaDia.kcal)),
    desvioSemanaMedio: media(rs.map((r) => r.desvioSemana)),
    semanasDentro: `${rs.filter((r) => r.semanaDentro).length}/${rs.length}`,
    pctDiasFueraKcal: Math.round((dias.filter((d) => !d.kcalDentro).length / dias.length) * 100),
    proteinaDia: media(rs.map((r) => r.mediaDia.proteina)),
    pctDiasSinProteina: Math.round((dias.filter((d) => !d.proteinaDentro).length / dias.length) * 100),
    proteinaMedia: { desayuno: media(porMomento('desayuno')), comida: media(porMomento('comida')), cena: media(porMomento('cena')) },
    pctComidasPrincipalesCortas: Math.round((principales.filter((c) => c.proteinaSuficiente === false).length / principales.length) * 100),
    pctDiasRepartoFuera: { desayuno: fuera('desayuno'), comida: fuera('comida'), cena: fuera('cena'), tentempies: fuera('tentempies') },
    hidratosDia: media(rs.map((r) => r.mediaDia.hidratos)),
    grasaDia: media(rs.map((r) => r.mediaDia.grasa)),
  });
}

const sinDato = new Map();
for (const r of resultados) for (const d of r.dias) for (const c of d.comidas) for (const s of c.sinDato) sinDato.set(s, (sinDato.get(s) || 0) + 1);

fs.writeFileSync(salida, JSON.stringify({ generado: new Date().toISOString(), fuenteComposicion: comp.fuente || null, semanas: SEMANAS, resumen, ingredientesSinDato: Object.fromEntries(sinDato), resultados }, null, 1));
console.table(resumen.map((r) => ({
  perfil: r.perfil, motor: r.motor, objetivo: r.objetivoKcal, kcalDia: r.kcalDia, 'desvío %': r.desvioSemanaMedio,
  'días fuera ±10%': `${r.pctDiasFueraKcal}%`, protObj: r.objetivoProteina, protDia: r.proteinaDia,
  'D/C/Ce prot': `${r.proteinaMedia.desayuno}/${r.proteinaMedia.comida}/${r.proteinaMedia.cena}`,
  'comidas cortas': `${r.pctComidasPrincipalesCortas}%`,
})));
if (sinDato.size) console.log('Ingredientes sin composición:', Object.fromEntries(sinDato));
console.log(`Informe: ${salida}`);
