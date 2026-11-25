// MEDICIÓN, no cambia reglas. Control de los pasos 4, 5 y 7 de la guarnición (D-119): genera N semanas seguidas de un perfil con el árbol <raiz> (generarPlan) y mide con
// los módulos del árbol <act> (catálogo, métricas del banco). Vuelca, por semana, el menú (plato de comida y cena y la
// legumbre de la guarnición) y las métricas de la tabla, con las mismas definiciones que cortasProteina.mjs.
// Uso: node --import <resolver> [--import <hook>] control.mjs <raiz> <act> <salida.json> <perfil> [semanas]
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const [raizArg, actArg, salida, perfilId, semArg] = process.argv.slice(2);
const SEM = Number(semArg || 200);
const url = (p) => pathToFileURL(p.replace(/\/?$/, '/')).href;
const raiz = url(raizArg);
const ACT = url(actArg);
const { generarPlan, platosRecientesPara } = await import(raiz + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(raiz + 'src/data/freeformPool.js');
const { objetivoDe } = await import(raiz + 'src/plan/racionesApp.js');
const { catalogoApp } = await import(ACT + 'src/plan/catalogo.js');
const { conPlatosDieta } = await import(ACT + 'src/plan/platosDieta.js');
const { proteinaPrincipal, familiaProteica, ESPECIES_PESCADO_MARISCO } = await import(ACT + 'src/engine2/dishes/bases.js');
const { composicionSemana } = await import(ACT + 'scripts/banco/metricas.mjs');
const { PERFILES: BANCO } = await import(ACT + 'scripts/banco/perfiles.mjs');
const { PERFILES_EXTRA } = await import(ACT + 'scripts/banco/medicion/perfilesExtra.mjs');

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const M62 = { gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', trainingDays: ['Martes'] };
const SINT = {
  'sin-carne-ave-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['pollo', 'pavo', 'ternera', 'cerdo', 'conejo', 'jamón', 'lacón', 'guanciale'] },
  'solo-pollo-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['pavo', 'ternera', 'cerdo', 'conejo', 'jamón', 'lacón', 'guanciale'] },
  'sin-garbanzos-guisantes-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['garbanzos', 'guisantes'] },
  'sin-legumbres-2000': { ...BASE, ...M62, mealsPerDay: 4, intolerances: ['legumbres'] },
};
const delBanco = BANCO.find((x) => x.id === perfilId) || PERFILES_EXTRA.find((x) => x.id === perfilId);
const perfil = SINT[perfilId] || (delBanco && delBanco.perfil);
const KCAL = delBanco ? delBanco.kcal : 2000;
if (!perfil) throw new Error(`perfil desconocido ${perfilId}`);
const porId = new Map(catalogoApp().map((d) => [d.id, d]));
const porIdBanco = new Map(conPlatosDieta(catalogoApp(), perfil, { reserva: true }).map((d) => [d.id, d]));
const obj = objetivoDe(perfil, KCAL);
const l = console.log; console.log = console.warn = console.error = () => {};
const RED = new Set(['guarnicion_red_d099_sin_b']);
const semanas = [];
let ant = null;
for (let s = 60; s < 60 + SEM; s++) {
  const recientes = platosRecientesPara(ant, s - 1, s);
  const plan = generarPlan(JSON.parse(JSON.stringify(perfil)), KCAL, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: `banco-${perfilId}`, saveMealMemory: () => {}, platosRecientes: recientes });
  ant = plan;
  const c = composicionSemana(plan, porIdBanco, recientes);
  const d099 = c.platoRepetidoEnSemana + c.platoDeSemanaAnterior + c.especieMasDeDosVeces + c.especieMismoDia + c.especieDiasSeguidosSinAncla + c.legumbreEnCena;
  let cortas = 0; let pescado = 0; let prot = 0; let dias = 0; let leg = 0; let guarn = 0; let fuera = 0; let principales = 0;
  const menu = [];
  for (const d of plan.days) {
    const meals = d.meals.filter(Boolean);
    if (!meals.some((m) => m.sugerencia) && d.raciones) { prot += d.raciones.proteina; dias += 1; }
    for (const m of meals) {
      if ((m.time !== 'Comida' && m.time !== 'Cena') || m.sugerencia || !m._dishId) continue;
      principales += 1;
      if (m.nutricion && m.nutricion.proteina < 0.95 * m.nutricion.objetivoProteina) cortas += 1;
      if (m.nutricion && Math.abs(m.nutricion.kcal - m.nutricion.objetivoKcal) > 0.05 * m.nutricion.objetivoKcal) fuera += 1;
      if (m._guarnicion) { guarn += 1; leg += 1; } else if (porId.has(m._dishId) && familiaProteica(porId.get(m._dishId)) === 'legumbre') leg += 1;
      for (const id of [m._dishId, m._dishId2].filter(Boolean)) if (porId.has(id) && ESPECIES_PESCADO_MARISCO.has(proteinaPrincipal(porId.get(id)))) pescado += 1;
      menu.push([d.name, m.time, m._dishId, m._guarnicion ? m._guarnicion.legumbre : null, m.nutricion ? m.nutricion.kcal : null, m.nutricion ? m.nutricion.proteina : null]);
    }
  }
  const log = plan.decisionLog || [];
  semanas.push({
    s, motor: plan.motor || 'engine2', cortas, pescado, leg, guarn, fuera, principales, d099,
    protDia: dias ? (100 * prot) / dias / obj.proteina : 0,
    red: log.filter((e) => RED.has(e.causa)).length,
    redSigue: log.filter((e) => e.causa === 'infraccion_d099_guarnicion_red_sin_b').length,
    menu,
  });
}
fs.writeFileSync(salida, JSON.stringify({ perfil: perfilId, semanas }));
l(`${perfilId}: ${semanas.length} semanas → ${salida}`);
