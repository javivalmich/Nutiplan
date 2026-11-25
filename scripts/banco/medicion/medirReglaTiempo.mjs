// MEDICIÓN del prototipo de tiempo de cocina y experiencia (reglaTiempoDificultad.mjs). No cambia reglas.
// Genera N semanas seguidas de un perfil por la entrada de la app (generarPlan), con tiempoCocina y experiencia
// fijados, y vuelca por semana lo que mide el informe: red y filtro por hueco, platos y especies servidos, pescado
// (y cuántos al horno), legumbre, proteína corta, energía y el menú (para los ejemplos).
//
// Perfiles: los 18 de la medición de la guarnición (12 del banco, 2 de perfilesExtra.mjs y 4 sintéticos).
// Uso (desde la raíz del repo; el hook hace falta también para el control, que no filtra):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/reglaTiempoDificultad.mjs \
//     scripts/banco/medicion/medirReglaTiempo.mjs <salida.json> <perfil> <tiempoCocina> <experiencia> [semanas]
import fs from 'node:fs';

const [salida, perfilId, tiempoCocina, experiencia, semArg] = process.argv.slice(2);
const SEM = Number(semArg || 200);
const { generarPlan, platosRecientesPara } = await import('../../../src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import('../../../src/data/freeformPool.js');
const { objetivoDe } = await import('../../../src/plan/racionesApp.js');
const { catalogoApp } = await import('../../../src/plan/catalogo.js');
const { conPlatosDieta } = await import('../../../src/plan/platosDieta.js');
const { tuplaDe } = await import('../../../src/plan/textos/componer.js');
const { proteinaPrincipal, familiaProteica, ESPECIES_PESCADO_MARISCO } = await import('../../../src/engine2/dishes/bases.js');
const { composicionSemana } = await import('../metricas.mjs');
const { PERFILES: BANCO } = await import('../perfiles.mjs');
const { PERFILES_EXTRA } = await import('./perfilesExtra.mjs');

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const M62 = { gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', trainingDays: ['Martes'] };
export const SINTETICOS = {
  'sin-carne-ave-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['pollo', 'pavo', 'ternera', 'cerdo', 'conejo', 'jamón', 'lacón', 'guanciale'] },
  'solo-pollo-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['pavo', 'ternera', 'cerdo', 'conejo', 'jamón', 'lacón', 'guanciale'] },
  'sin-garbanzos-guisantes-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['garbanzos', 'guisantes'] },
  'sin-legumbres-2000': { ...BASE, ...M62, mealsPerDay: 4, intolerances: ['legumbres'] },
};
const delBanco = BANCO.find((x) => x.id === perfilId) || PERFILES_EXTRA.find((x) => x.id === perfilId);
const perfilBase = SINTETICOS[perfilId] || (delBanco && delBanco.perfil);
if (!perfilBase) throw new Error(`medirReglaTiempo: perfil desconocido ${perfilId}`);
const KCAL = delBanco ? delBanco.kcal : 2000;
const perfil = { ...JSON.parse(JSON.stringify(perfilBase)), tiempoCocina, experiencia };
const dieta = perfil.dieta || 'omnivora';

const catalogo = conPlatosDieta(catalogoApp(), perfil, { reserva: true });
const porId = new Map(catalogo.map((d) => [d.id, d]));
const obj = objetivoDe(perfil, KCAL);
const { vigenteDe } = globalThis.__reglaTiempo;
const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const especie = (id) => (porId.has(id) ? proteinaPrincipal(porId.get(id)) : null);
const alHorno = (id) => {
  const t = tuplaDe(id);
  if (t) return t.cookM === 'horno';
  return /_af\b|_af_|horno/.test(id); // texto libre: airfryer u horno en el id
};

const l = console.log; console.log = console.warn = console.error = () => {};
const semanas = [];
let ant = null;
for (let s = 60; s < 60 + SEM; s++) {
  const recientes = platosRecientesPara(ant, s - 1, s);
  const plan = generarPlan(JSON.parse(JSON.stringify(perfil)), KCAL, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: `banco-${perfilId}`, saveMealMemory: () => {}, platosRecientes: recientes });
  ant = plan;
  const c = composicionSemana(plan, porId, recientes);
  const log = plan.decisionLog || [];
  const eventos = log.filter((e) => typeof e.causa === 'string' && e.causa.startsWith('regla_tiempo'));
  const red = eventos.filter((e) => e.causa === 'regla_tiempo_red');
  const fijos = new Map(); // día|momento → causa de los huecos que coloca el paso 1 (ancla) o el capricho
  for (const e of log) {
    const causa = e.causa || e.cause;
    if (e.day && e.momento && /^ancla|^sobra|capricho/.test(String(causa))) fijos.set(`${e.day}|${e.momento}`, causa);
  }
  const menu = [];
  let cortas = 0; let principales = 0; let fueraKcal = 0; let pescado = 0; let pescadoHorno = 0; let legumbre = 0;
  let protDia = 0; let kcalDia = 0; let dias = 0;
  let lvServidos = 0; let lvCumplen = 0; let lvAncla = 0;
  const servidos = [];
  plan.days.forEach((d, k) => {
    const dia = DIAS[k];
    const meals = d.meals.filter(Boolean);
    if (!meals.some((m) => m.sugerencia) && d.raciones) { protDia += d.raciones.proteina; kcalDia += d.raciones.kcal; dias += 1; }
    const fila = { dia };
    for (const m of meals) {
      if (m.time !== 'Comida' && m.time !== 'Cena') continue;
      const momento = m.time === 'Comida' ? 'comida' : 'cena';
      const ids = [m._dishId, m._dishId2].filter(Boolean);
      const ev = eventos.find((e) => e.day === dia && (e.momento === momento || e.momento === 'capricho'));
      const fijo = fijos.get(`${dia}|${momento}`);
      const como = m.sugerencia ? 'sugerencia' : ev ? (ev.causa === 'regla_tiempo_red' ? 'red' : 'filtro') : fijo ? `fijo (${fijo})` : '';
      fila[momento] = { titulo: m.title, ids, como };
      if (m.sugerencia) continue;
      principales += 1;
      if (m.nutricion && m.nutricion.proteina < 0.95 * m.nutricion.objetivoProteina) cortas += 1;
      if (m.nutricion && Math.abs(m.nutricion.kcal - m.nutricion.objetivoKcal) > 0.05 * m.nutricion.objetivoKcal) fueraKcal += 1;
      if (m._guarnicion) legumbre += 1;
      for (const id of ids) {
        servidos.push(id);
        if (ESPECIES_PESCADO_MARISCO.has(especie(id))) { pescado += 1; if (alHorno(id)) pescadoHorno += 1; }
        if (porId.has(id) && familiaProteica(porId.get(id)) === 'legumbre') legumbre += 1;
      }
      if (k < 5) {
        lvServidos += 1;
        if (String(como).startsWith('fijo (ancla') || String(como).startsWith('fijo (sobra')) lvAncla += 1;
        const v = vigenteDe(m._dishId);
        if ((tiempoCocina !== 'poco' || v.poco === 'sí') && (experiencia !== 'novato' || v.dificultad === 'fácil')) lvCumplen += 1;
      }
    }
    menu.push(fila);
  });
  const especies = {};
  for (const id of servidos) { const e = especie(id); if (e) especies[e] = (especies[e] || 0) + 1; }
  semanas.push({
    s, motor: plan.motor, red: red.length, filtros: eventos.length - red.length,
    redPor: red.map((e) => `${e.day}/${e.momento}`),
    servidos, especies, pescado, pescadoHorno, legumbre, cortas, principales, fueraKcal,
    protDia: dias ? (100 * protDia) / dias / obj.proteina : 0, kcalDia: dias ? (100 * kcalDia) / dias / KCAL : 0,
    lvServidos, lvCumplen, lvAncla,
    d099: { repetido: c.platoRepetidoEnSemana, anterior: c.platoDeSemanaAnterior, masDeDos: c.especieMasDeDosVeces, mismoDia: c.especieMismoDia, seguidos: c.especieDiasSeguidosSinAncla, legCena: c.legumbreEnCena },
    menu,
  });
}
fs.writeFileSync(salida, JSON.stringify({ perfil: perfilId, dieta, kcal: KCAL, tiempoCocina, experiencia, semanas }));
l(`${perfilId} ${tiempoCocina}+${experiencia}: ${semanas.length} semanas → ${salida}`);
