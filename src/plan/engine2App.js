// engine2App — plan completo de la app a partir de lo que elige engine2.
//
// engine2 solo decide QUÉ plato va en cada comida y cena. Todo lo demás
// (cantidades ajustadas a kcal y estrategia, receta, compra por comida,
// desayunos, tentempiés, día libre, batido) sale del motor viejo SIN copiar ni
// tocar su código:
//   1. buildPlan() normal → estructura de la semana, desayunos y tentempiés.
//   2. buildPlan() con profile._regenContext.dayPortionsRegen (la vía que ya
//      usa la app para el batido: «recompone un día desde sus _spec») →
//      compone las comidas y cenas que eligió engine2, día a día, con el mismo
//      ajuste por día que usaría el motor viejo.
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
import { comboIdentityKey } from '../engine2/dishes/identity.js';
import { LUNCH_COMBOS_RAW, DINNER_COMBOS_RAW, TRAINING_DINNERS_RAW } from '../engine2/dishes/legacyCombos.data.js';
import { FREEFORM_COMBOS } from '../data/FREEFORM_COMBOS.js';
import { ajustarPlan, ajustarDia } from './racionesApp.js';
import { elegirAlternativa } from '../engine2/walk/alternativa.js';
import { aplicarAjustesD099 } from '../engine2/dishes/ajustesD099.js';
import { alergenosDeTexto } from '../engine2/nutrientes/alergenos.js';
import { adaptarComidaFodmap, fodmapRestante, protagonistaFodmap } from '../engine2/nutrientes/fodmap.js';
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

// ─── Ficha del motor viejo para cada plato de engine2 ───────────────────────

let fichas = null;
function fichaDe(dishId) {
  if (!fichas) {
    fichas = new Map();
    const raw = [
      ...LUNCH_COMBOS_RAW.map((c) => ({ ...c, slot: 'Comida' })),
      ...DINNER_COMBOS_RAW.map((c) => ({ ...c, slot: 'Cena' })),
      ...TRAINING_DINNERS_RAW.map((c) => ({ ...c })),
    ];
    for (const c of raw) {
      const k = comboIdentityKey(c);
      if (!fichas.has(k)) fichas.set(k, c);
    }
    for (const f of FREEFORM_COMBOS) if (f && f.identity && !fichas.has(f.identity.id)) fichas.set(f.identity.id, f);
  }
  return fichas.get(dishId) || null;
}

/** _spec que entiende composeMeal: la ficha legacy, con momento y el nombre de engine2 como título. */
export function specPara(dish, momento) {
  const ficha = fichaDe(dish.id);
  if (!ficha) throw new Error(`engine2App: sin ficha del motor viejo para ${dish.id}`);
  const slot = momento === 'cena' ? 'Cena' : 'Comida';
  if (ficha.freeForm === true) return { ...ficha, slot };
  const spec = { ...ficha, slot, title: dish.nombre };
  delete spec.emoji; // las cenas post-entreno traen 🏋️ propio; aquí manda el momento
  return spec;
}

// ─── Componer con el motor viejo ────────────────────────────────────────────

const clonar = (v) => JSON.parse(JSON.stringify(v));

function opcionesLegacy(opts) {
  return { ...opts, saveMealMemory: () => {} };
}

/** Compone una lista de specs en el día dayIdx (0-6) con el ajuste del motor viejo para ese día. */
function componerDia(profile, targetKcal, opts, dayIdx, specs) {
  const p = clonar(profile);
  p._regenContext = { dayPortionsRegen: { dayIdx, meals: specs.map((s) => ({ _spec: s })), shakeEnabledOverride: false } };
  return buildPlan(p, targetKcal, opcionesLegacy(opts)).days[dayIdx].meals;
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

const conSibo = (profile) => ((profile && profile.intolerances) || []).includes('sibo');

/** Una comida tal como la verá un usuario con SIBO (adaptada a bajo en FODMAP). */
export function adaptarSiProcede(meal, profile) {
  return meal && conSibo(profile) && !meal.adaptadoFodmap ? adaptarComidaFodmap(meal) : meal;
}

/**
 * Intolerancias del perfil que afectan a una comida compuesta (por sus
 * ingredientes y su texto). Con SIBO, la comida se mira ya adaptada: solo
 * cuenta lo alto en FODMAP que no tiene sustituto, o un plato cuyo
 * protagonista es el ajo o la cebolla.
 */
export function intoleranciasDe(meal, profile) {
  const intol = new Set((profile && profile.intolerances) || []);
  if (!intol.size || !meal) return [];
  const out = [...alergenosDeTexto(textoCompuesto(meal))].filter((a) => intol.has(a));
  if (intol.has('sibo')) {
    const adaptada = adaptarSiProcede(meal, profile);
    if (protagonistaFodmap(textoCompuesto(meal)) || fodmapRestante(textoCompuesto(adaptada))) out.push('sibo');
    // Con SIBO, trigo y lactosa se cambian por sin gluten y sin lactosa: no cuentan si ya están adaptados.
  }
  return out;
}

/**
 * Quita del catálogo los platos que llevan algo vetado por el perfil
 * (intolerancias que engine2 no veta y alimentos eliminados). Compone cada
 * plato una vez para leer su texto real.
 */
/** Compone cada plato del catálogo una vez (en lotes de 20) con el perfil dado. */
export function componerPlatos(catalog, profile, targetKcal, opts) {
  const out = new Map();
  for (let i = 0; i < catalog.length; i += 20) {
    const lote = catalog.slice(i, i + 20);
    const meals = componerDia(profile, targetKcal, opts, 0, lote.map((d) => specPara(d, d.momento.includes('comida') ? 'comida' : 'cena')));
    lote.forEach((d, k) => out.set(d.id, meals[k] || null));
  }
  return out;
}

export function filtrarCatalogo(catalog, profile, targetKcal, opts) {
  const todas = profile.intolerances || [];
  const intol = todas.filter((i) => !VETO_PROPIO_ENGINE2.has(i));
  const eliminados = (profile.eliminatedFoods || []).map((f) => String(f).toLowerCase().trim()).filter(Boolean);
  if (!todas.length && !eliminados.length) return { catalogo: catalog, quitados: [] };

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
  const base = resumen.base;
  if (causa === 'ancla_base_cocinado') {
    if (resumen.cocinadoAntes) return `🥘 Usa el ${base} que cocinaste el domingo; mañana lo aprovechas en otro plato.`;
    const otro = resumen.diasAprovechar.length ? ` y guarda para el ${resumen.diasAprovechar.map((d) => DIA_LEGIBLE[d] || d).join(' y el ')}` : '';
    return `🥘 Hoy cocina ${base} de más${otro}.`;
  }
  if (causa === 'ancla_base_aprovechado') {
    const cuando = resumen.cocinadoAntes ? 'el domingo' : `el ${DIA_LEGIBLE[resumen.diaCocinar] || resumen.diaCocinar}`;
    return `♻️ Aprovecha el ${base} que cocinaste ${cuando}.`;
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
    },
    seed: `${opts.userId ?? 'anon'}:${opts.weekNumber ?? 0}`,
    strategy: base.strategy,
    catalog: catalogo,
    platosRecientes: opts.platosRecientes || [],
    cocinarEnCantidad: profile.cocinarEnCantidad,
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
    const [comida, cena] = componerDia(profile, targetKcal, opts, i, [specPara(comida2.dish, 'comida'), specPara(cena2.dish, 'cena')]);
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
      meals = day.meals.map((m, k) => (k === iPrincipal ? { ...principal, time: 'Comida' } : m));
      nuevaCena = null;
    } else {
      meals = day.meals.map((m, k) => {
        if (k === iComida) return nuevaComida;
        if (k === iCena) return nuevaCena;
        return m;
      });
    }
    return { ...day, meals };
  });

  if (typeof opts.saveMealMemory === 'function') opts.saveMealMemory(opts.weekNumber ?? 0, memL, memD);

  const adaptados = conSibo(profile) ? days.map((d) => ({ ...d, meals: d.meals.map((m) => adaptarSiProcede(m, profile)) })) : days;
  const seguros = desayunosSeguros(adaptados, profile, targetKcal, opts);

  const plan = {
    ...base,
    days: seguros.days,
    weekWarnings: [],
    weekProblems: [],
    weekScore: null,
    motor: 'engine2',
    platosSemana,
    platosSemanaAnterior: opts.platosRecientes || [],
    ancla: resumenAncla,
    decisionLog: [...e2.decisionLog, ...seguros.log],
    ...(quitados.length ? { platosQuitadosPorPerfil: quitados.length } : {}),
  };
  // La base de datos solo guarda los días del plan (no los campos de arriba):
  // lo que engine2 necesita para recalcular y para las alternativas va también
  // dentro del primer día.
  plan.days = guardarMeta(plan.days, { ancla: resumenAncla, platosSemana, platosSemanaAnterior: opts.platosRecientes || [] });
  // Raciones de engine2: gramos según el objetivo del usuario (D-100).
  return conRaciones ? { ...ajustarPlan(plan, profile, targetKcal), raciones: 'engine2' } : plan;
}

// ─── Desayunos y tentempiés que respetan las intolerancias ───────────────────

/**
 * Los desayunos y tentempiés aún los pone el motor viejo, que no conoce todas
 * las intolerancias de la app (soja, picante) y a veces deja el alimento en la
 * compra o en el título (yogur o queso con lactosa, jamón con cerdo,
 * cacahuete con frutos secos). Cada uno que lleve algo que el perfil no puede
 * comer se cambia por otro del mismo momento que sí pueda, sacado de otras
 * semanas del motor viejo (en orden fijo, así que es determinista). Si no
 * hay ninguno, se quita y se anota.
 */
function desayunosSeguros(days, profile, targetKcal, opts) {
  const log = [];
  const afectados = [];
  days.forEach((d, i) => d.meals.forEach((m, j) => {
    if (m && m.time !== 'Comida' && m.time !== 'Cena' && intoleranciasDe(m, profile).length) afectados.push([i, j]);
  }));
  if (!afectados.length) return { days, log };

  const usados = new Set(days.flatMap((d) => d.meals.filter(Boolean).map((m) => m.title)));
  const candidatos = new Map(); // time -> comidas limpias en orden
  let semilla = 0;
  const siguiente = (time) => {
    const lista = candidatos.get(time) || [];
    while (!lista.length && semilla < 30) {
      semilla += 1;
      const alt = buildPlan(clonar(profile), targetKcal, opcionesLegacy({ ...opts, userId: `${opts.userId ?? 'anon'}#desayuno${semilla}` }));
      for (const d of alt.days) for (const m0 of d.meals) {
        const m = adaptarSiProcede(m0, profile);
        if (!m || m.time === 'Comida' || m.time === 'Cena' || intoleranciasDe(m, profile).length || usados.has(m.title)) continue;
        if (!candidatos.has(m.time)) candidatos.set(m.time, []);
        if (!candidatos.get(m.time).some((x) => x.title === m.title)) candidatos.get(m.time).push(m);
      }
      candidatos.set(time, candidatos.get(time) || []);
      if ((candidatos.get(time) || []).length) break;
    }
    const l = candidatos.get(time) || [];
    // Se reutilizan si hace falta (un desayuno puede repetirse en la semana); el primero, el más antiguo.
    if (!l.length) return null;
    const m = l.shift();
    l.push(m);
    return m;
  };

  const nuevos = days.map((d) => ({ ...d, meals: d.meals.slice() }));
  for (const [i, j] of afectados) {
    const viejo = nuevos[i].meals[j];
    const motivo = intoleranciasDe(viejo, profile).join(', ');
    const nuevo = siguiente(viejo.time);
    nuevos[i].meals[j] = nuevo ? clonar(nuevo) : null;
    log.push({ causa: 'desayuno_cambiado_por_intolerancia', day: nuevos[i].name, momento: viejo.time, detalle: `«${viejo.title}» lleva ${motivo} → ${nuevo ? `«${nuevo.title}»` : 'sin sustituto: se quita'}` });
  }
  return { days: nuevos, log };
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
    seed: `${opts.userId ?? 'anon'}:${opts.weekNumber ?? 0}`,
  });

  const [compuesta] = componerDia(profile, targetKcal, opts, dayIdx, [specPara(dish, momento)]);
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
