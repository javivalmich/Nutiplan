// racionesApp — aplica a un día (o a un plan) de la app las raciones que
// decide engine2 (src/engine2/nutrientes/raciones.js) y las escribe en los
// textos de cada comida (src/plan/cantidades.js).
//
// El objetivo de cada usuario sale de las mismas funciones que la app ya usa
// para mostrarlo (calcMacros y computeStrategy del motor viejo, que viven en
// nutrition.js). Este módulo está fuera de src/engine2, así que engine2 sigue
// sin importar nada de src/engine.

import { calcMacros, computeStrategy } from '../engine/nutrition.js';
import { racionesDia } from '../engine2/nutrientes/raciones.js';
import { COMPOSICION } from '../engine2/nutrientes/composicion.js';
import { leerComida } from './medidor/leerComida.js';
import { reescribirComida } from './cantidades.js';
import { adaptarComidaFodmap } from '../engine2/nutrientes/fodmap.js';
import { recomponer, aplicarAnclaLibre } from './textos/componer.js';
import { adaptarSiProcede } from './adaptar.js';

const MOMENTO = Object.freeze({ Desayuno: 'desayuno', Comida: 'comida', Cena: 'cena' });

export function objetivoDe(profile, targetKcal) {
  const estrategia = computeStrategy(profile);
  const { protein } = calcMacros(targetKcal, profile.weight, profile.goal, profile.activity, estrategia);
  return { kcal: targetKcal, proteina: protein, pesoKg: Number(profile.weight) || 70 };
}

// A qué comida acompaña el batido según cuándo lo toma el usuario. El perfil
// no guarda la hora del entreno: «post-entreno» se asocia a la cena (entreno
// por la tarde, lo más habitual); revisable cuando la app pregunte la hora.
const MOMENTO_BATIDO = Object.freeze({ manana: 'desayuno', post_entreno: 'cena', noche: 'cena' });

/** ¿Toma el batido ese día? Misma regla que la tarjeta del batido en la app. */
export function batidoDelDia(profile, day) {
  const sk = profile && profile.extras && profile.extras.proteinShake;
  const global = !!(sk && sk.enabled);
  const override = day ? day.shakeEnabled : undefined;
  const toma = (global && override !== false) || (!global && override === true);
  if (!toma || !sk) return null;
  const scoops = sk.scoops || 1;
  return { nombre: 'batido de proteína', kcal: scoops * (sk.kcalPerScoop || 120), proteina: scoops * (sk.proteinPerScoop || 24), momento: MOMENTO_BATIDO[sk.timing] || 'cena' };
}

// Lo que engine2 puede añadir como acompañamiento, y si el perfil lo veta.
const VETO_ANADIDO = Object.freeze({
  pan_integral: { intolerancias: ['gluten', 'sibo'], palabras: ['pan', 'trigo', 'gluten'] },
  fruta: { intolerancias: [], palabras: ['fruta'] },
  nuez: { intolerancias: ['frutos_secos'], palabras: ['nuez', 'nueces', 'frutos secos'] },
});
export function vetadosDe(profile) {
  const intol = new Set((profile && profile.intolerances) || []);
  const elim = ((profile && profile.eliminatedFoods) || []).map((f) => String(f).toLowerCase().trim()).filter(Boolean);
  const v = new Set();
  for (const [clave, regla] of Object.entries(VETO_ANADIDO)) {
    if (regla.intolerancias.some((i) => intol.has(i)) || elim.some((e) => regla.palabras.some((w) => e.includes(w) || w.includes(e)))) v.add(clave);
  }
  return v;
}

/** Escribe en la comida los acompañamientos que ha añadido engine2. */
function anadir(meal, anadidos, momento) {
  if (!anadidos.length) return meal;
  let p2 = meal.p2 || '';
  const shopping = [...(meal.shopping || [])];
  for (const a of anadidos) {
    const g = Math.round(a.gramos);
    if (a.clave === 'pan_integral') {
      p2 += momento === 'desayuno' ? ` · Pan integral tostado (${g} g)` : ` · Pan integral (${g} g) para acompañar`;
      shopping.push(`Pan integral (${g} g)`);
    } else if (a.clave === 'fruta') {
      const ud = Math.max(1, Math.round(a.gramos / 150));
      const txt = ud === 1 ? '1 pieza de fruta de temporada' : `${ud} piezas de fruta de temporada`;
      p2 += momento === 'comida' || momento === 'cena' ? ` · De postre: ${txt}` : ` · ${txt.charAt(0).toUpperCase()}${txt.slice(1)}`;
      shopping.push(`Fruta de temporada (${ud} ud)`);
    } else if (a.clave === 'nuez') {
      p2 += ` · Nueces (${g} g)`;
      shopping.push(`Nueces (${g} g)`);
    }
  }
  return { ...meal, p2: p2.replace(/^ · /, ''), shopping, acompanamientos: anadidos.map((a) => a.clave) };
}

/**
 * Ajusta las cantidades de un día de la app.
 * @returns {{ day: object, log: object[], sinCambiar: number }}
 */
// Cada comida guarda su versión de partida (la que compuso el plato, antes
// de ajustar raciones) en _base. Recalcular siempre parte de ahí: así activar
// y quitar el batido, o recalcular un día varias veces, da siempre el mismo
// resultado en vez de ir derivando a partir de lo ya ajustado.
const CAMPOS_AJUSTADOS = ['nutricion', 'acompanamientos', '_base'];
function baseDe(m) {
  if (m._base) return m._base;
  const b = { ...m };
  for (const k of CAMPOS_AJUSTADOS) delete b[k];
  return b;
}

export function ajustarDia(day, profile, targetKcal, { composicion = COMPOSICION } = {}) {
  const actuales = day.meals || [];
  const meals = actuales.map((m) => (m ? baseDe(m) : m));
  const lecturas = meals.map((m) => (m ? leerComida(m) : null));
  const comidas = [];
  meals.forEach((m, i) => {
    if (!m) return;
    const lectura = lecturas[i];
    const libre = lectura.libre || !!(m._spec && m._spec.isFree);
    comidas.push({
      id: String(i),
      momento: MOMENTO[m.time] || 'tentempie',
      libre,
      items: lectura.items.map((it) => ({ clave: it.clave, gramos: it.gramos, unidad: it.como === 'ud' ? 'ud' : 'g', fijo: /estimado/.test(it.como) })),
    });
  });
  const batido = batidoDelDia(profile, day);
  const r = racionesDia({ comidas, aparte: batido ? [batido] : [], objetivo: objetivoDe(profile, targetKcal), composicion, vetados: vetadosDe(profile) });

  let sinCambiar = 0;
  const nuevas = meals.map((m, i) => {
    const res = r.comidas[String(i)];
    if (!m || !res) return actuales[i];
    const n = lecturas[i].items.length;
    const items = lecturas[i].items.map((it, k) => ({ ...it, despues: res.items[k].gramos }));
    let escrita;
    if (m._componer) {
      // D-108: un plato compuesto se vuelve a escribir entero con sus gramos
      // nuevos (y se vuelve a adaptar a la dieta o a SIBO del perfil).
      const porClave = new Map();
      for (const it of items) if (!porClave.has(it.clave)) porClave.set(it.clave, it.despues);
      const sinAdaptar = recomponer(m, porClave);
      delete sinAdaptar.adaptadoDieta;
      delete sinAdaptar.adaptadoFodmap;
      escrita = { meal: sinAdaptar, sinCambiar: 0 };
    } else {
      escrita = reescribirComida(m, items);
      if (m._ancla) escrita = { ...escrita, meal: aplicarAnclaLibre(escrita.meal) };
    }
    sinCambiar += escrita.sinCambiar;
    let conAnadidos = anadir(escrita.meal, res.items.slice(n).filter((x) => x.anadido), MOMENTO[m.time] || 'tentempie');
    if (m._componer) conAnadidos = adaptarSiProcede(conAnadidos, profile);
    else if (conAnadidos.acompanamientos && ((profile && profile.intolerances) || []).includes('sibo')) conAnadidos = { ...adaptarComidaFodmap(conAnadidos), title: conAnadidos.title };
    // Lo que no son cantidades (nota del ancla, marcas de la app) se conserva de la comida actual.
    const actual = { ...actuales[i] };
    delete actual.acompanamientos;
    return {
      ...actual,
      ...(m._ancla ? { _ancla: m._ancla } : {}),
      p1: conAnadidos.p1, p2: conAnadidos.p2, shopping: conAnadidos.shopping, recipe: conAnadidos.recipe,
      ...(conAnadidos.acompanamientos ? { acompanamientos: conAnadidos.acompanamientos } : {}),
      _base: m,
      nutricion: { kcal: res.kcal, proteina: res.proteina, objetivoKcal: res.objetivo.kcal, objetivoProteina: res.objetivo.proteina },
    };
  });
  return {
    day: { ...day, meals: nuevas, raciones: { kcal: r.total.kcal, proteina: r.total.proteina, objetivoKcal: targetKcal, batido: batido ? true : false } },
    log: r.log.map((e) => ({ ...e, day: day.name })),
    sinCambiar,
  };
}

/** Ajusta todos los días de un plan. */
export function ajustarPlan(plan, profile, targetKcal, opts = {}) {
  const log = [];
  let sinCambiar = 0;
  const days = plan.days.map((d) => {
    const r = ajustarDia(d, profile, targetKcal, opts);
    log.push(...r.log);
    sinCambiar += r.sinCambiar;
    return r.day;
  });
  return { ...plan, days, decisionLog: [...(plan.decisionLog || []), ...log], racionesSinCambiarEnTexto: sinCambiar };
}
