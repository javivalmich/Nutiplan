// Comidas cortas de proteína en perfiles sintéticos sin segundo posible: MEDICIÓN, no cambia reglas. Genera N semanas
// seguidas por la entrada de la app (generarPlan) del árbol <raíz> y vuelca, por semana: comidas y cenas servidas por
// debajo del 95 % de su objetivo de proteína, proteína del día frente a su objetivo, pescado, comidas dobles y si hubo
// sorteo de días de legumbre. Sirve para comparar dos árboles (esta rama y main, exportado con git archive) con el
// mismo medidor.
//   Perfiles SINTÉTICOS (como sin-lactosa-2000 sin la lactosa, 2000 kcal):
//     sin-carne-ave-2000: alimentos eliminados pollo, pavo, ternera, cerdo, conejo, jamón, lacón y guanciale
//     un-segundo-2000:    pollo, pavo, ternera, cerdo y alcachofa (solo «Conejo al ajillo con espinacas» vale de segundo)
// Uso: node --import <resolver> scripts/banco/medicion/cortasProteina.mjs <raíz> <salida.json> <perfil> [semanas]
// Resumen: node scripts/banco/medicion/cortasProteina.mjs --resumen <salida.md> <etiqueta>=<archivo.json> ...
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const n2 = (x) => x.toFixed(2).replace('.', ',');
const n1 = (x) => x.toFixed(1).replace('.', ',');
if (process.argv[2] === '--resumen') {
  const salida = process.argv[3];
  const L = ['| Medición | Semanas | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Legumbre como plato único/sem | Pescado/sem | Comidas dobles/sem | Semanas con días sorteados |', '|---|---|---|---|---|---|---|---|'];
  const familias = [];
  for (const arg of process.argv.slice(4)) {
    const [etiqueta, f] = arg.split('=');
    const { semanas } = JSON.parse(fs.readFileSync(f, 'utf8'));
    const m = (k) => semanas.reduce((a, s) => a + s[k], 0) / semanas.length;
    const lu = semanas.every((s) => s.legumbreUnico != null) ? n2(m('legumbreUnico')) : '—';
    L.push(`| ${etiqueta} | ${semanas.length} | ${n2(m('cortas'))} | ${n1(m('protDia'))} % | ${lu} | ${n2(m('pescado'))} | ${n2(m('dobles'))} | ${semanas.filter((s) => s.sorteo).length} |`);
    if (semanas.every((s) => s.servidosPor)) familias.push([etiqueta, semanas]);
  }
  // Por familia proteica del plato: servidos y cortos de proteína por semana.
  if (familias.length) {
    const claves = [...new Set(familias.flatMap(([, ss]) => ss.flatMap((s) => Object.keys(s.servidosPor))))].sort();
    L.push('', '| Medición | ' + claves.map((k) => `${k}: servidos / cortos`).join(' | ') + ' |', '|---|' + claves.map(() => '---|').join(''));
    for (const [etiqueta, ss] of familias) {
      const m = (o, k) => ss.reduce((a, s) => a + (s[o][k] || 0), 0) / ss.length;
      L.push(`| ${etiqueta} | ` + claves.map((k) => `${n2(m('servidosPor', k))} / ${n2(m('cortasPor', k))}`).join(' | ') + ' |');
    }
  }
  const texto = L.join('\n');
  console.log(texto);
  if (salida) fs.writeFileSync(salida, `${texto}\n`);
  process.exit(0);
}

const [raizArg, salidaArg, perfilId] = process.argv.slice(2);
const SEM = Number(process.argv.slice(5).find((x) => /^\d+$/.test(x)) || 200);
const raiz = pathToFileURL(raizArg.replace(/\/?$/, '/')).href;
const ACT = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(raiz + 'src/plan/generarPlan.js');
const { objetivoDe } = await import(raiz + 'src/plan/racionesApp.js');
const { FREEFORM_POOL } = await import(raiz + 'src/data/freeformPool.js');
const { catalogoApp } = await import(ACT + 'src/plan/catalogo.js');
const { proteinaPrincipal, familiaProteica, ESPECIES_PESCADO_MARISCO } = await import(ACT + 'src/engine2/dishes/bases.js');

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const M62 = { gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', trainingDays: ['Martes'] };
const PERFILES = {
  'sin-carne-ave-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['pollo', 'pavo', 'ternera', 'cerdo', 'conejo', 'jamón', 'lacón', 'guanciale'] },
  'un-segundo-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['pollo', 'pavo', 'ternera', 'cerdo', 'alcachofa'] },
};
const perfil = PERFILES[perfilId];
if (!perfil) throw new Error(`cortasProteina: perfil desconocido ${perfilId}`);
const porId = new Map(catalogoApp().map((d) => [d.id, d]));
const obj = objetivoDe(perfil, 2000);
const l = console.log; console.log = console.warn = console.error = () => {};
const semanas = [];
let ant = null;
for (let s = 60; s < 60 + SEM; s++) {
  const plan = generarPlan(JSON.parse(JSON.stringify(perfil)), 2000, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: `banco-${perfilId}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
  ant = plan;
  let cortas = 0; let pescado = 0; let dobles = 0; let prot = 0; let dias = 0; let legumbreUnico = 0;
  const servidosPor = {}; const cortasPor = {};
  for (const d of plan.days) {
    const meals = d.meals.filter(Boolean);
    if (!meals.some((m) => m.sugerencia) && d.raciones) { prot += d.raciones.proteina; dias += 1; }
    for (const m of meals) {
      if ((m.time !== 'Comida' && m.time !== 'Cena') || m.sugerencia) continue;
      const fam = (porId.has(m._dishId) && familiaProteica(porId.get(m._dishId))) || 'sin familia';
      const corta = !!(m.nutricion && m.nutricion.proteina < 0.95 * m.nutricion.objetivoProteina);
      servidosPor[fam] = (servidosPor[fam] || 0) + 1;
      if (corta) { cortas += 1; cortasPor[fam] = (cortasPor[fam] || 0) + 1; }
      if (fam === 'legumbre' && !m._dishId2) legumbreUnico += 1;
      if (m._dishId2) dobles += 1;
      for (const id of [m._dishId, m._dishId2].filter(Boolean)) if (porId.has(id) && ESPECIES_PESCADO_MARISCO.has(proteinaPrincipal(porId.get(id)))) pescado += 1;
    }
  }
  semanas.push({ s, motor: plan.motor, cortas, pescado, dobles, legumbreUnico, servidosPor, cortasPor, protDia: dias ? (100 * prot) / dias / obj.proteina : 0, sorteo: (plan.decisionLog || []).some((e) => e.causa === 'dias_legumbre_sorteados') });
}
fs.writeFileSync(salidaArg, JSON.stringify({ perfil: perfilId, semanas }));
l(`${semanas.length} semanas → ${salidaArg} (motores: ${[...new Set(semanas.map((x) => x.motor))].join(', ')})`);
