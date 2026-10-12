// engine2App — plan completo de la app a partir de lo que elige engine2.
//
// engine2 decide qué plato va en cada comida y cena, lo escribe (D-108:
// textos propios para los platos compuestos; los platos libres traen el suyo)
// y decide sus cantidades (D-100). Desde D-110 también elige los desayunos
// y tentempiés (desayunosApp.js). Del motor viejo quedan, sin copiar ni
// tocar su código, la estructura de la semana (qué huecos tiene cada día),
// el día libre y la estrategia (buildPlan() normal).
// Este módulo está fuera de src/engine2, así que engine2 sigue sin importar
// nada de src/engine (CLAUDE.md, reglas 2 y 7).
//
// Seguridad alimentaria: engine2 solo sabe vetar gluten y lactosa. El resto
// de intolerancias y los alimentos eliminados del perfil se resuelven ANTES:
// se quitan del catálogo los platos cuya proteína o cuyo texto compuesto
// (título, preparación y compra) los contiene.

import { buildPlan } from '../engine/buildPlan.js';
import { materializePlan } from '../engine2/materializePlan.js';
import { resolveDishComposition } from '../engine2/dishes/compositionResolver.js';
import { ajustarPlan, ajustarDia } from './racionesApp.js';
import { elegirAlternativa } from '../engine2/walk/alternativa.js';
import { aplicarAjustesD099 } from '../engine2/dishes/ajustesD099.js';
import { alergenosDeTexto } from '../engine2/nutrientes/alergenos.js';
import { fodmapRestante, protagonistaFodmap } from '../engine2/nutrientes/fodmap.js';
import { animalDeTexto, dietaDe, VETADOS_POR_DIETA } from '../engine2/nutrientes/dietas.js';
import { ponerDesayunos, alternativaDesayuno } from './desayunosApp.js';
import { conPlatosDieta } from './platosDieta.js';
import { componerPlato, gramosDeBase } from './textos/componer.js';
import { nombreDeBase } from './textos/compuestos.js';
import { limpiarComidaLegacy } from './textos/legacy.js';
import { adaptarSiProcede, conSibo, conDieta } from './adaptar.js';
import { evaluateVeto } from '../engine2/walk/vetoes.js';
import { aplicarNombresD105, nombreVisible } from '../engine2/dishes/alinosD105.js';

export const DIA_ENGINE2 = Object.freeze({
  Lunes: 'Lunes', Martes: 'Martes', 'Miércoles': 'Miercoles', Jueves: 'Jueves',
  Viernes: 'Viernes', 'Sábado': 'Sabado', Domingo: 'Domingo',
});
const DIA_LEGIBLE = Object.freeze({
  Lunes: 'lunes', Martes: 'martes', Miercoles: 'miércoles', Jueves: 'jueves',
  Viernes: 'viernes', Sabado: 'sábado', Domingo: 'domingo',
});

// ─── Motor viejo (desayunos, tentempiés y estructura de la semana) ──────────

const clonar = (v) => JSON.parse(JSON.stringify(v));

function opcionesLegacy(opts) {
  return { ...opts, saveMealMemory: () => {} };
}

// ─── Filtro de seguridad del catálogo ───────────────────────────────────────

const TEXTO_INTOLERANCIA = Object.freeze({
  pescado: /salm[oó]n|merluza|bacalao|dorada|sardina|at[uú]n|bonito|pescado|corvina|anchoa|boquer[oó]n|caballa|lubina/i,
  mariscos: /gamba|calamar|marisco|mejill[oó]n|berberecho|pulpo|langostino|sepia|almeja|fideu[aá]|paella de gambas/i,
  cerdo: /cerdo|lomo|jam[oó]n|bacon|beicon|guanciale|chorizo|lac[oó]n|morcilla|panceta|salchich|carbonara|cocido|fabada/i,
  huevo: /huevo|tortilla|revuelto|shakshuka|carbonara|ensaladilla|mayonesa|claras/i,
  legumbres: /lenteja|garbanzo|alubia|jud[ií]a blanca|hummus|falafel|fabada|cocido|edamame|soja|tofu|guisante/i,
  frutos_secos: /nuez|nueces|almendra|pistacho|cacahuete|anacardo|avellana|frutos secos|pi[ñn]ones|sésamo|tahini/i,
});
const PROTEINA_INTOLERANCIA = Object.freeze({
  pescado: new Set(['salmon', 'merluza', 'bacalao', 'dorada', 'sardinas', 'atun', 'bonito', 'corvina']),
  mariscos: new Set(['gambas', 'calamares', 'mejillones', 'berberechos']),
  cerdo: new Set(['cerdo', 'jamon', 'lacon', 'guanciale']),
  huevo: new Set(['huevo']),
  legumbres: new Set(['lentejas', 'garbanzos', 'alubias', 'alubias_negras', 'tofu']),
});
// Gluten y lactosa: engine2 sabe vetarlas por su ficha editorial (vetoes.js),
// pero trata como vetado todo plato cuya ficha no lo dice («desconocida»), y
// así deja a un celíaco con ~30 platos. Desde D-103 se vetan aquí: si la ficha
// dice que lo lleva, o si sus ingredientes o su texto lo llevan (alergenos.js).
const VETO_PROPIO_ENGINE2 = new Set(['gluten', 'lactosa']);

function proteinaDe(dish) {
  try {
    const v = resolveDishComposition(dish);
    return (v.tupla && v.tupla.P) || v.claveP || null;
  } catch {
    return null;
  }
}

function textoCompuesto(meal) {
  return [meal.title, meal.p1, meal.p2, ...(meal.shopping || []), ...((meal.recipe || []).filter((x) => typeof x === 'string'))].filter(Boolean).join(' · ');
}

export { adaptarSiProcede };

/**
 * Intolerancias del perfil, y alimentos que su dieta no come, que afectan a
 * una comida compuesta (por sus ingredientes y su texto). La comida se mira
 * ya adaptada (como la verá el usuario): con SIBO solo cuenta lo alto en
 * FODMAP que no tiene sustituto, o un plato cuyo protagonista es el ajo o la
 * cebolla; con dieta vegetariana o vegana, lo de origen animal que queda
 * (carne, pescado, marisco, huevo, lácteo, miel).
 */
export function intoleranciasDe(meal, profile) {
  const intol = new Set((profile && profile.intolerances) || []);
  const vetadosDieta = VETADOS_POR_DIETA[dietaDe(profile)];
  if ((!intol.size && !vetadosDieta.length) || !meal) return [];
  const adaptada = adaptarSiProcede(meal, profile);
  const texto = textoCompuesto(adaptada);
  const out = [...alergenosDeTexto(texto)].filter((a) => intol.has(a));
  if (intol.has('sibo') && (protagonistaFodmap(textoCompuesto(meal)) || fodmapRestante(texto))) out.push('sibo');
  if (vetadosDieta.length) for (const c of animalDeTexto(texto)) if (vetadosDieta.includes(c)) out.push(c);
  return out;
}

/**
 * Quita del catálogo los platos que llevan algo vetado por el perfil
 * (intolerancias que engine2 no veta y alimentos eliminados). Compone cada
 * plato una vez para leer su texto real.
 */
/** Compone cada plato del catálogo una vez (D-108: textos de engine2). */
export function componerPlatos(catalog, profile, targetKcal) {
  return new Map(catalog.map((d) => [d.id, componerPlato(d, d.momento.includes('comida') ? 'comida' : 'cena', targetKcal)]));
}

export function filtrarCatalogo(catalogBase, profile, targetKcal, opts) {
  // D-107: con dieta vegetariana o vegana entran sus platos propios; en el
  // último intento de generarPlan, también los de reserva (D-109).
  const catalog = conPlatosDieta(catalogBase, profile, { reserva: !!(opts && opts.platosReserva) });
  const todas = profile.intolerances || [];
  const intol = todas.filter((i) => !VETO_PROPIO_ENGINE2.has(i));
  const eliminados = (profile.eliminatedFoods || []).map((f) => String(f).toLowerCase().trim()).filter(Boolean);
  if (!todas.length && !eliminados.length && !conDieta(profile)) return { catalogo: catalog, quitados: [] };

  const compuestos = componerPlatos(catalog, profile, targetKcal, opts);
  const textos = new Map();
  for (const d of catalog) textos.set(d.id, `${d.nombre} · ${textoCompuesto(compuestos.get(d.id) || {})}`.toLowerCase());
  const quitados = [];
  const catalogo = catalog.filter((d) => {
    const prot = proteinaDe(d);
    const texto = textos.get(d.id) || d.nombre.toLowerCase();
    // Por ingredientes y texto (alergenos.js, las 10 intolerancias de la app,
    // también gluten y lactosa además del veto propio de engine2) y, por si
    // acaso, las reglas anteriores por proteína y por texto.
    const m = compuestos.get(d.id);
    const porIngrediente = intoleranciasDe(m ? { ...m, title: `${d.nombre} · ${m.title || ''}` } : { title: d.nombre }, profile)[0];
    const porFicha = todas.filter((i) => VETO_PROPIO_ENGINE2.has(i)).find((i) => evaluateVeto(d, [i]).some((v) => v.motivo === 'valor'));
    const motivo = porIngrediente || porFicha
      || intol.find((i) => (PROTEINA_INTOLERANCIA[i] && PROTEINA_INTOLERANCIA[i].has(prot))
      || (TEXTO_INTOLERANCIA[i] && TEXTO_INTOLERANCIA[i].test(texto)))
      || eliminados.find((e) => texto.includes(e) || (prot && prot.includes(e)));
    if (motivo) quitados.push({ id: d.id, nombre: d.nombre, motivo });
    return !motivo;
  });
  return { catalogo, quitados };
}

// ─── Memoria de proteínas del motor viejo (por si se vuelve a él) ───────────

const LEGUMBRE = new Set(['lentejas', 'garbanzos', 'alubias', 'alubias_negras']);
const PESCADO = new Set(['salmon', 'merluza', 'bacalao', 'dorada', 'sardinas', 'atun', 'bonito', 'corvina']);
const MARISCO = new Set(['gambas', 'calamares', 'mejillones', 'berberechos']);
function claveMemoria(prot) {
  if (!prot) return 'pollo';
  if (LEGUMBRE.has(prot)) return 'legumbre';
  if (PESCADO.has(prot)) return 'pescado';
  if (MARISCO.has(prot)) return 'marisco';
  return prot;
}

// ─── Plan completo ───────────────────────────────────────────────────────────

function notaAncla(resumen, day, causa) {
  if (!resumen) return null;
  const { el, verbo, lo, cocinar } = nombreDeBase(resumen.base);
  if (causa === 'ancla_base_cocinado') {
    if (resumen.cocinadoAntes) return `🥘 Usa ${el} que ${verbo} el domingo; mañana ${lo} aprovechas en otro plato.`;
    const otro = resumen.diasAprovechar.length ? ` y guarda para el ${resumen.diasAprovechar.map((d) => DIA_LEGIBLE[d] || d).join(' y el ')}` : '';
    return `🥘 Hoy ${cocinar} ${el.replace(/^(el|la|los|las) /, '')} de más${otro}.`;
  }
  if (causa === 'ancla_base_aprovechado') {
    const cuando = resumen.cocinadoAntes ? 'el domingo' : `el ${DIA_LEGIBLE[resumen.diaCocinar] || resumen.diaCocinar}`;
    return `♻️ Aprovecha ${el} que ${verbo} ${cuando}.`;
  }
  return null;
}

/**
 * Posiciones de la comida y la cena en un día del motor viejo. Son las
 * comidas principales (etiquetadas «Comida» o «Cena»): la primera es la
 * comida y la última la cena. Con una sola, decide su etiqueta.
 */
export function huecosPrincipales(meals) {
  const idx = [];
  (meals || []).forEach((m, k) => { if (m && (m.time === 'Comida' || m.time === 'Cena')) idx.push(k); });
  if (idx.length >= 2) return [idx[0], idx[idx.length - 1]];
  if (idx.length === 1) return meals[idx[0]].time === 'Cena' ? [-1, idx[0]] : [idx[0], -1];
  return [-1, -1];
}

/**
 * @param {object} profile perfil de la app (mismo que recibe buildPlan)
 * @param {number} targetKcal
 * @param {object} opts mismas opciones que buildPlan + platosRecientes (nombres de la semana anterior)
 */
export function generarPlanEngine2(profile, targetKcal, opts = {}) {
  // opts.raciones === false deja las cantidades del motor viejo (solo para comparar).
  const conRaciones = opts.raciones !== false;
  const base = buildPlan(clonar(profile), targetKcal, opcionesLegacy(opts));
  const { catalogo, quitados } = filtrarCatalogo(opts.catalogo, profile, targetKcal, opts);

  // El catálogo ya llega filtrado por todas las intolerancias (filtrarCatalogo).
  const intolEngine2 = [];
  const e2 = materializePlan({
    profile: {
      trainingDays: (profile.trainingDays || []).map((d) => DIA_ENGINE2[d] || d),
      intolerances: intolEngine2,
      dieta: dietaDe(profile),
    },
    seed: `${opts.userId ?? 'anon'}:${opts.weekNumber ?? 0}`,
    strategy: base.strategy,
    catalog: catalogo,
    platosRecientes: opts.platosRecientes || [],
    cocinarEnCantidad: profile.cocinarEnCantidad,
    maxRepeticiones: opts.maxRepeticiones,
  });

  // Ancla de la semana (si la hay), para las notas del día.
  const log = e2.decisionLog;
  const anclaLog = log.find((e) => e.cause === 'eleccion_ancla_por_seed');
  const diaLog = log.find((e) => e.cause === 'dia_cocinar_elegido' || (typeof e.cause === 'string' && e.cause.startsWith('batchday')));
  const sobrasLog = log.find((e) => e.cause === 'aprovechamiento_sobras');
  const resumenAncla = anclaLog ? {
    base: anclaLog.consequence.replace('ancla elegida: base:', ''),
    cocinadoAntes: /domingo anterior/.test(diaLog ? diaLog.consequence : ''),
    diaCocinar: diaLog ? (diaLog.consequence.match(/= (\w+)/) || [])[1] : null,
    diasAprovechar: sobrasLog && sobrasLog.consequence.startsWith('sobras servidas en: ')
      ? sobrasLog.consequence.replace('sobras servidas en: ', '').split(', ') : [],
  } : null;
  const causaDe = new Map();
  for (const e of log) if (e.day && e.momento && e.causa) causaDe.set(`${e.day}|${e.momento}`, e.causa);

  const mealsPerDay = Number(profile.mealsPerDay) || 3;
  const platosSemana = [];
  const memL = [];
  const memD = [];

  const days = base.days.map((day, i) => {
    const d2 = e2.days[i];
    const comida2 = d2.meals.find((m) => m.momento === 'comida');
    const cena2 = d2.meals.find((m) => m.momento === 'cena');
    // D-108: comida y cena las escribe engine2 (sin el motor viejo), con la
    // receta del ancla si toca cocinar de una vez o aprovechar.
    const anclaDe = (momento) => anclaDelHueco(resumenAncla, causaDe.get(`${d2.day}|${momento}`));
    const comida = componerPlato(comida2.dish, 'comida', targetKcal, { ancla: anclaDe('comida') });
    const cena = componerPlato(cena2.dish, 'cena', targetKcal, { ancla: anclaDe('cena') });
    const marca = (meal, dish, momento) => {
      const c = causaDe.get(`${d2.day}|${momento}`);
      return { ...meal, time: momento === 'cena' ? 'Cena' : 'Comida', title: dish.nombre, _motor: 'engine2', _dishId: dish.id, ...(c && c.startsWith('ancla_base') ? { _causa: c } : {}) };
    };
    // Comida y cena por su posición en el día, no por la etiqueta: el motor
    // viejo a veces etiqueta «Cena» una comida de ficha libre (D-106).
    const [iComida, iCena] = huecosPrincipales(day.meals);

    let nuevaComida;
    if (comida2.libre) {
      const iLibre = iComida >= 0 ? iComida : (mealsPerDay === 2 ? iCena : -1);
      const libre = iLibre >= 0 ? day.meals[iLibre] : null;
      nuevaComida = libre ? { ...libre, time: 'Comida', p2: `Si prefieres cocinar: ${comida2.dish.nombre}.`, sugerencia: marca(comida, comida2.dish, 'comida') } : null;
      memL.push('libre');
    } else {
      nuevaComida = marca(comida, comida2.dish, 'comida');
      const nota = notaAncla(resumenAncla, d2.day, causaDe.get(`${d2.day}|comida`));
      if (nota) nuevaComida.slotNote = nota;
      platosSemana.push(comida2.dish.nombre);
      memL.push(claveMemoria(proteinaDe(comida2.dish)));
    }
    let nuevaCena = marca(cena, cena2.dish, 'cena');
    const notaCena = notaAncla(resumenAncla, d2.day, causaDe.get(`${d2.day}|cena`));
    if (notaCena) nuevaCena.slotNote = notaCena;
    platosSemana.push(cena2.dish.nombre);
    memD.push(claveMemoria(proteinaDe(cena2.dish)));

    let meals;
    if (mealsPerDay === 2) {
      // Una comida principal y sin cena. Con raciones de engine2, su tamaño lo
      // decide el reparto del día; sin ellas, como el motor viejo: un 25 % más
      // grande (solo en el texto principal).
      const principal = comida2.libre || conRaciones ? { ...nuevaComida, ...(comida2.libre ? {} : { title: `${nuevaComida.title} (comida principal)` }) } : {
        ...nuevaComida,
        title: `${nuevaComida.title} (comida principal)`,
        p1: String(nuevaComida.p1 || '').replace(/\((\d+)g\)/g, (full, g) => `(${Math.round(parseInt(g, 10) * 1.25)}g)`),
      };
      const iPrincipal = iComida >= 0 ? iComida : iCena; // la única principal, se llame como se llame
      meals = day.meals.map((m, k) => (k === iPrincipal ? { ...principal, time: 'Comida' } : limpiarComidaLegacy(m)));
      nuevaCena = null;
    } else {
      meals = day.meals.map((m, k) => {
        if (k === iComida) return nuevaComida;
        if (k === iCena) return nuevaCena;
        return limpiarComidaLegacy(m);
      });
    }
    return { ...day, meals };
  });

  if (typeof opts.saveMealMemory === 'function') opts.saveMealMemory(opts.weekNumber ?? 0, memL, memD);

  const adaptados = conSibo(profile) || conDieta(profile) ? days.map((d) => ({ ...d, meals: d.meals.map((m) => adaptarSiProcede(m, profile)) })) : days;
  // D-110: desayunos y tentempiés de engine2 (rutina semanal), para todos.
  const seguros = ponerDesayunos(adaptados, profile, { seed: `${opts.userId ?? 'anon'}:${opts.weekNumber ?? 0}`, platosRecientes: opts.platosRecientes || [] });

  const plan = {
    ...base,
    days: seguros.days,
    weekWarnings: [],
    weekProblems: [],
    weekScore: null,
    motor: 'engine2',
    platosSemana,
    platosSemanaAnterior: opts.platosRecientes || [],
    desayunosSemana: seguros.desayunosSemana,
    ancla: resumenAncla,
    decisionLog: [...e2.decisionLog, ...seguros.log],
    ...(quitados.length ? { platosQuitadosPorPerfil: quitados.length } : {}),
  };
  // La base de datos solo guarda los días del plan (no los campos de arriba):
  // lo que engine2 necesita para recalcular y para las alternativas va también
  // dentro del primer día.
  plan.days = guardarMeta(plan.days, { ancla: resumenAncla, platosSemana, platosSemanaAnterior: opts.platosRecientes || [], desayunosSemana: seguros.desayunosSemana });
  // Raciones de engine2: gramos según el objetivo del usuario (D-100).
  if (!conRaciones) return plan;
  return { ...cantidadesDelAncla(ajustarPlan(plan, profile, targetKcal), profile, targetKcal), raciones: 'engine2' };
}

/** Ancla del hueco (D-108): cocinar de una vez o aprovechar lo cocinado. */
function anclaDelHueco(resumen, causa) {
  if (!resumen || !causa || !causa.startsWith('ancla_base')) return null;
  const aprovechar = causa === 'ancla_base_aprovechado' || resumen.cocinadoAntes;
  return {
    base: resumen.base,
    rol: aprovechar ? 'aprovechar' : 'cocinar',
    cuando: resumen.cocinadoAntes ? 'el domingo' : `el ${DIA_LEGIBLE[resumen.diaCocinar] || resumen.diaCocinar}`,
  };
}

/**
 * El día de cocinar de más, la receta dice cuánto guardar para cada día que
 * se aprovecha (con los gramos ya ajustados de esos días) (D-108).
 */
function cantidadesDelAncla(plan, profile, targetKcal) {
  const sitios = [];
  plan.days.forEach((d, i) => d.meals.forEach((m, j) => { if (m && m._ancla) sitios.push({ i, j, m }); }));
  const cocinar = sitios.find((s) => s.m._ancla.rol === 'cocinar');
  if (!cocinar) return plan;
  const base = cocinar.m._ancla.base;
  const guardar = sitios
    .filter((s) => s.m._ancla.rol === 'aprovechar' && s.m._ancla.base === base)
    .map((s) => ({ dia: (DIA_LEGIBLE[DIA_ENGINE2[plan.days[s.i].name]] || plan.days[s.i].name).toLowerCase(), gramos: gramosDeBase(s.m, base) }))
    .filter((x) => x.gramos > 0);
  if (!guardar.length) return plan;
  const days = plan.days.slice();
  const dia = days[cocinar.i];
  const meals = dia.meals.slice();
  const m = meals[cocinar.j];
  const ancla = { ...m._ancla, guardar };
  meals[cocinar.j] = { ...m, _ancla: ancla, ...(m._base ? { _base: { ...m._base, _ancla: ancla } } : {}) };
  days[cocinar.i] = ajustarDia({ ...dia, meals }, profile, targetKcal).day;
  return { ...plan, days };
}

// ─── Datos de la semana que deben sobrevivir a la base de datos ─────────────

function guardarMeta(days, meta) {
  return days.map((d, i) => (i === 0 ? { ...d, _engine2: meta } : d));
}

/**
 * Datos de engine2 de un plan (ancla, platos de la semana y de la anterior),
 * tanto si el plan está entero como si viene de la base de datos, que solo
 * guarda los días.
 */
export function metaEngine2(plan) {
  const d0 = (plan && plan.days && plan.days[0] && plan.days[0]._engine2) || {};
  return {
    ancla: plan.ancla !== undefined ? plan.ancla : d0.ancla || null,
    platosSemana: plan.platosSemana || d0.platosSemana || null,
    platosSemanaAnterior: plan.platosSemanaAnterior || d0.platosSemanaAnterior || [],
    desayunosSemana: plan.desayunosSemana || d0.desayunosSemana || [],
  };
}

// ─── Alternativa de una comida (botón «🔄 Alternativas») ─────────────────────

const MOMENTO_DE = Object.freeze({ Comida: 'comida', Cena: 'cena' });

/**
 * Cambia la comida o la cena de un día de un plan de engine2 por otro plato
 * del catálogo que respete las reglas del menú (src/engine2/walk/alternativa.js)
 * y el deseo del usuario, y vuelve a calcular las raciones del día.
 * @param {object} plan plan de engine2 (plan.motor === 'engine2')
 * @param {number} dayIdx 0-6
 * @param {'Comida'|'Cena'} time
 * @param {string} deseo comfort | ligero | rapido | diferente
 * @param {object} profile
 * @param {number} targetKcal
 * @param {object} opts mismas opciones que generarPlanEngine2 (catalogo, userId, weekNumber…)
 * @returns {object} plan nuevo
 */
export function regenerarComidaEngine2(plan, dayIdx, time, deseo, profile, targetKcal, opts = {}) {
  const momento = MOMENTO_DE[time];
  const day = plan.days[dayIdx];
  const mealIdx = day.meals.findIndex((m) => m && m.time === time);
  const actual = day.meals[mealIdx];
  if (!momento || !actual || !actual._dishId) throw new Error(`regenerarComidaEngine2: ${time} del día ${dayIdx} no es un plato de engine2`);

  const { catalogo } = filtrarCatalogo(opts.catalogo, profile, targetKcal, opts);
  const catalog = aplicarNombresD105(aplicarAjustesD099(catalogo));
  const diaE2 = (d) => DIA_ENGINE2[d.name] || d.name;
  const semana = plan.days.flatMap((d) => ['Comida', 'Cena'].map((t) => {
    const m = d.meals.find((x) => x && x.time === t);
    return { day: diaE2(d), momento: MOMENTO_DE[t], dishId: m && m._dishId ? m._dishId : null };
  }));
  const meta = metaEngine2(plan);
  const causa = actual._causa || (plan.decisionLog || []).filter((e) => e.day === diaE2(day) && e.momento === momento && typeof e.causa === 'string').map((e) => e.causa).pop();
  const esAncla = !!(meta.ancla && causa && causa.startsWith('ancla_base'));

  const { dish, decisionLog } = elegirAlternativa({
    catalog, semana, day: diaE2(day), momento, actualId: actual._dishId, deseo,
    platosRecientes: (meta.platosSemanaAnterior || []).map(nombreVisible),
    intolerancias: [], // el catálogo ya llega filtrado (filtrarCatalogo)
    anclaBase: esAncla ? meta.ancla.base : null,
    dieta: dietaDe(profile),
    seed: `${opts.userId ?? 'anon'}:${opts.weekNumber ?? 0}`,
  });

  const compuesta = componerPlato(dish, momento, targetKcal, { ancla: esAncla && actual._ancla && decisionLog.some((e) => e.causa === 'alternativa_mantiene_ancla') ? actual._ancla : null });
  const principal = / \(comida principal\)$/.test(actual.title || '');
  const nueva = adaptarSiProcede({ ...compuesta, time, title: `${dish.nombre}${principal ? ' (comida principal)' : ''}`, _motor: 'engine2', _dishId: dish.id, ...(esAncla && actual._causa ? { _causa: actual._causa } : {}) }, profile);
  const mantieneAncla = esAncla && decisionLog.some((e) => e.causa === 'alternativa_mantiene_ancla');
  if (mantieneAncla && actual.slotNote) nueva.slotNote = actual.slotNote;

  const meals = day.meals.slice();
  meals[mealIdx] = nueva;
  const ajustado = plan.raciones === 'engine2' || day.raciones ? ajustarDia({ ...day, meals }, profile, targetKcal) : { day: { ...day, meals }, log: [] };
  let days = plan.days.slice();
  days[dayIdx] = ajustado.day;
  const platosSemana = (meta.platosSemana || []).map((n) => (n === actual.title || n === (actual.title || '').replace(/ \(comida principal\)$/, '') ? dish.nombre : n));
  days = guardarMeta(days, { ...((days[0] && days[0]._engine2) || {}), ancla: meta.ancla, platosSemanaAnterior: meta.platosSemanaAnterior, platosSemana });
  return {
    ...plan,
    days,
    platosSemana,
    decisionLog: [...(plan.decisionLog || []).filter((e) => !(e.day === day.name && e.causa && String(e.causa).startsWith('raciones'))), ...decisionLog.map((e) => ({ ...e, deseo })), ...ajustado.log],
  };
}

/**
 * Alternativa de un desayuno o tentempié (D-110): la da el catálogo de
 * desayunos de engine2 (desayunosApp.js), para todos los perfiles, con lo que
 * el perfil puede comer. Se toma el siguiente al actual en su orden fijo,
 * prefiriendo los que no salen ya en la semana: cada clic da uno distinto.
 * @returns {object} plan nuevo
 */
export function regenerarDesayunoEngine2(plan, dayIdx, time, profile, targetKcal) {
  const day = plan.days[dayIdx];
  const mealIdx = day.meals.findIndex((m) => m && m.time === time);
  const actual = day.meals[mealIdx];
  if (!actual || time === 'Comida' || time === 'Cena') throw new Error(`regenerarDesayunoEngine2: no hay ${time} el día ${dayIdx}`);
  const nueva = alternativaDesayuno(plan, dayIdx, time, profile);
  if (!nueva) throw new Error(`regenerarDesayunoEngine2: sin alternativa para ${time}`);
  const meals = day.meals.slice();
  meals[mealIdx] = nueva;
  const ajustado = plan.raciones === 'engine2' || day.raciones ? ajustarDia({ ...day, meals }, profile, targetKcal) : { day: { ...day, meals }, log: [] };
  const days = plan.days.slice();
  days[dayIdx] = ajustado.day;
  return {
    ...plan,
    days,
    decisionLog: [...(plan.decisionLog || []), { causa: 'alternativa_desayuno', day: day.name, momento: time, detalle: `«${actual.title}» → «${nueva.title}»` }, ...ajustado.log],
  };
}
