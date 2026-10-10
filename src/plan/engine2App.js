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
// engine2 veta estas dos por su cuenta (vetoes.js).
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
  return [meal.title, meal.p1, meal.p2, ...(meal.shopping || [])].filter(Boolean).join(' · ');
}

/**
 * Quita del catálogo los platos que llevan algo vetado por el perfil
 * (intolerancias que engine2 no veta y alimentos eliminados). Compone cada
 * plato una vez para leer su texto real.
 */
export function filtrarCatalogo(catalog, profile, targetKcal, opts) {
  const intol = (profile.intolerances || []).filter((i) => !VETO_PROPIO_ENGINE2.has(i));
  const eliminados = (profile.eliminatedFoods || []).map((f) => String(f).toLowerCase().trim()).filter(Boolean);
  if (!intol.length && !eliminados.length) return { catalogo: catalog, quitados: [] };

  const textos = new Map();
  for (let i = 0; i < catalog.length; i += 20) {
    const lote = catalog.slice(i, i + 20);
    const meals = componerDia(profile, targetKcal, opts, 0, lote.map((d) => specPara(d, d.momento.includes('comida') ? 'comida' : 'cena')));
    lote.forEach((d, k) => textos.set(d.id, `${d.nombre} · ${textoCompuesto(meals[k] || {})}`.toLowerCase()));
  }
  const quitados = [];
  const catalogo = catalog.filter((d) => {
    const prot = proteinaDe(d);
    const texto = textos.get(d.id) || d.nombre.toLowerCase();
    const motivo = intol.find((i) => (PROTEINA_INTOLERANCIA[i] && PROTEINA_INTOLERANCIA[i].has(prot))
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
 * @param {object} profile perfil de la app (mismo que recibe buildPlan)
 * @param {number} targetKcal
 * @param {object} opts mismas opciones que buildPlan + platosRecientes (nombres de la semana anterior)
 */
export function generarPlanEngine2(profile, targetKcal, opts = {}) {
  const base = buildPlan(clonar(profile), targetKcal, opcionesLegacy(opts));
  const { catalogo, quitados } = filtrarCatalogo(opts.catalogo, profile, targetKcal, opts);

  const intolEngine2 = (profile.intolerances || []).filter((i) => VETO_PROPIO_ENGINE2.has(i));
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
    const marca = (meal, dish) => ({ ...meal, title: dish.nombre, _motor: 'engine2', _dishId: dish.id });

    let nuevaComida;
    if (comida2.libre) {
      const libre = day.meals.find((m) => m && m.time === 'Comida') || null;
      nuevaComida = libre ? { ...libre, p2: `Si prefieres cocinar: ${comida2.dish.nombre}.`, sugerencia: marca(comida, comida2.dish) } : null;
      memL.push('libre');
    } else {
      nuevaComida = marca(comida, comida2.dish);
      const nota = notaAncla(resumenAncla, d2.day, causaDe.get(`${d2.day}|comida`));
      if (nota) nuevaComida.slotNote = nota;
      platosSemana.push(comida2.dish.nombre);
      memL.push(claveMemoria(proteinaDe(comida2.dish)));
    }
    let nuevaCena = marca(cena, cena2.dish);
    const notaCena = notaAncla(resumenAncla, d2.day, causaDe.get(`${d2.day}|cena`));
    if (notaCena) nuevaCena.slotNote = notaCena;
    platosSemana.push(cena2.dish.nombre);
    memD.push(claveMemoria(proteinaDe(cena2.dish)));

    let meals;
    if (mealsPerDay === 2) {
      // Igual que el motor viejo: una comida principal un 25 % más grande y sin cena.
      const principal = comida2.libre ? nuevaComida : {
        ...nuevaComida,
        title: `${nuevaComida.title} (comida principal)`,
        p1: String(nuevaComida.p1 || '').replace(/\((\d+)g\)/g, (full, g) => `(${Math.round(parseInt(g, 10) * 1.25)}g)`),
      };
      meals = day.meals.map((m) => (m && m.time === 'Comida' ? principal : m));
      nuevaCena = null;
    } else {
      meals = day.meals.map((m) => {
        if (m && m.time === 'Comida') return nuevaComida;
        if (m && m.time === 'Cena') return nuevaCena;
        return m;
      });
    }
    return { ...day, meals };
  });

  if (typeof opts.saveMealMemory === 'function') opts.saveMealMemory(opts.weekNumber ?? 0, memL, memD);

  return {
    ...base,
    days,
    weekWarnings: [],
    weekProblems: [],
    weekScore: null,
    motor: 'engine2',
    platosSemana,
    platosSemanaAnterior: opts.platosRecientes || [],
    decisionLog: e2.decisionLog,
    ...(quitados.length ? { platosQuitadosPorPerfil: quitados.length } : {}),
  };
}
