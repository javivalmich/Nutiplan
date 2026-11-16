// racionesApp — aplica a un día (o a un plan) de la app las raciones que
// decide engine2 (src/engine2/nutrientes/raciones.js) y las escribe en los
// textos de cada comida (src/plan/cantidades.js).
//
// El objetivo de cada usuario sale de las mismas funciones que la app ya usa
// para mostrarlo (calcMacros y computeStrategy del motor viejo, que viven en
// nutrition.js). Este módulo está fuera de src/engine2, así que engine2 sigue
// sin importar nada de src/engine.

import { calcMacros, computeStrategy } from '../engine/nutrition.js';
import { racionesDia, rangoDe, papelDe, AMPLITUD_MAX, KCAL_RACION_NORMAL } from '../engine2/nutrientes/raciones.js';
import { COMPOSICION } from '../engine2/nutrientes/composicion.js';
import { INGREDIENTES } from '../engine2/nutrientes/ingredientes.js';
import { leerComida } from './medidor/leerComida.js';
import { reescribirComida } from './cantidades.js';
import { adaptarComidaFodmap } from '../engine2/nutrientes/fodmap.js';
import { recomponer, aplicarAnclaLibre } from './textos/componer.js';
import { escribirCompuesto, gramosDePartida } from './textos/compuestos.js';
import { esComidaDoble, esComidaDobleIncompleta, recomponerDoble, platosDe } from './textos/comidaDoble.js';
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
  pan_sin_gluten: { intolerancias: [], palabras: ['pan'] },
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
  // D-110: el pan sin gluten solo se añade a quien no puede tomar el integral por gluten o SIBO.
  if (!intol.has('gluten') && !intol.has('sibo')) v.add('pan_sin_gluten');
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
    } else if (a.clave === 'pan_sin_gluten') {
      p2 += momento === 'desayuno' ? ` · Pan sin gluten tostado (${g} g)` : ` · Pan sin gluten (${g} g) para acompañar`;
      shopping.push(`Pan sin gluten (${g} g)`);
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

/**
 * I-4. Clave con que se lee cada ingrediente de un plato compuesto una vez
 * adaptado al perfil, frente a la clave del compuesto. La adaptación cambia
 * el nombre de algunos ingredientes («Pasta integral» → «Pasta sin gluten» con
 * SIBO), así que la comida adaptada se lee con otra clave (pasta_seco) que la
 * que recomponer() busca (pasta_integral_seco). Se adapta cada línea de la
 * compra sin adaptar por separado y se compara su lectura.
 * @returns {Map<string, string>} clave leída en la comida adaptada → clave del compuesto
 */
export function clavesDeAdaptacion(meal, profile) {
  const mapa = new Map();
  if (!meal || !meal._componer) return mapa;
  const sinAdaptar = recomponer(meal, new Map());
  for (const linea of sinAdaptar.shopping || []) {
    const antes = leerComida({ shopping: [linea] }).items[0];
    if (!antes) continue;
    const adaptada = adaptarSiProcede({ time: meal.time, title: '', p1: '', p2: '', shopping: [linea], recipe: [] }, profile);
    const despues = leerComida({ shopping: adaptada.shopping || [] }).items.find((it) => it.gramos === antes.gramos) || null;
    if (despues && despues.clave !== antes.clave) mapa.set(despues.clave, antes.clave);
  }
  return mapa;
}

// ─── Comida con primero y segundo (D-116.6) ─────────────────────────────────

export const KCAL_TOPE_LEGUMBRE = 2174;
const esLegumbre = (clave) => (INGREDIENTES[clave] || {}).grupo === 'legumbre';
const itemDe = (it) => ({ clave: it.clave, gramos: it.gramos, unidad: it.como === 'ud' ? 'ud' : 'g', fijo: /estimado/.test(it.como) });
const topes = new Map();

/**
 * Tope de la legumbre de un primero (D-116.6): los gramos en seco que ese
 * plato recibe como plato único a 2174 kcal.
 *
 * Se calcula con las mismas raciones de siempre (racionesDia), con el plato
 * solo en la comida de un día de 2174 kcal de cuatro comidas (desayuno,
 * comida, cena y un tentempié; las otras tres no intervienen) y sin
 * restricciones. Depende solo del plato: no hace falta un plan de referencia.
 * La proteína del objetivo no interviene, porque el plato único de legumbre
 * no lleva ingredientes proteicos (la legumbre es energética en las raciones).
 * Da los mismos 14 valores que el prototipo de medición, que los sacaba de un
 * plan de referencia (racionesDoble.test.js).
 * @param {object} tupla tupla del plato compuesto de legumbre
 * @returns {number} gramos en seco
 */
export function topeLegumbre(tupla, composicion = COMPOSICION) {
  const clave = JSON.stringify(tupla);
  if (composicion === COMPOSICION && topes.has(clave)) return topes.get(clave);
  const plato = escribirCompuesto({ tupla, nombre: '', momento: 'comida', gramos: gramosDePartida(tupla, KCAL_TOPE_LEGUMBRE) });
  const otra = (id, momento) => ({ id, momento, libre: true, items: [] });
  const r = racionesDia({
    comidas: [otra('d', 'desayuno'), { id: 'c', momento: 'comida', libre: false, items: leerComida(plato).items.map(itemDe) }, otra('n', 'cena'), otra('t', 'tentempie')],
    aparte: [], objetivo: { kcal: KCAL_TOPE_LEGUMBRE, proteina: 0, pesoKg: 0 }, composicion, vetados: vetadosDe({}),
  });
  const tope = Math.round(r.comidas.c.items.filter((i) => esLegumbre(i.clave)).reduce((a, i) => a + i.gramos, 0));
  if (composicion === COMPOSICION) topes.set(clave, tope);
  return tope;
}

// D-116.6, modificado (decisión de Javi del 2026-11-16): la comida doble no
// lleva más aceite que el máximo de un plato único en esa comida (20 g): 10 g
// en cada plato. El primero es un guiso que pocha la cebolla en el aceite; el
// segundo, una plancha o un horno.
export const ACEITE_MAX_POR_PLATO_DOBLE = 10;
const ACEITES = new Set(['aove', 'aceite_semillas']);

/**
 * Lo que la comida doble añade a un ingrediente al entrar en las raciones:
 *   - cada aceite, su máximo en la comida doble (10 g por plato);
 *   - el proteico del segundo, la marca para crecer dentro de su rango si la
 *     legumbre ya está en su tope, el aceite en su máximo y faltan kcal;
 *   - la legumbre del primero, su tope como máximo (en lugar del máximo
 *     general de la legumbre, que además crece con el objetivo).
 */
export function extraDoble(m, it, targetKcal, composicion = COMPOSICION) {
  if (ACEITES.has(it.clave)) {
    const rango = rangoDe(it.clave, 'g');
    return rango ? { ampliado: ACEITE_MAX_POR_PLATO_DOBLE - rango[1] } : {};
  }
  if (it.plato === 2 && composicion[it.clave] && papelDe(it.clave, composicion[it.clave]) === 'proteico') return { crecerSiFalta: true };
  if (it.plato !== 1 || !esLegumbre(it.clave)) return {};
  const rango = rangoDe(it.clave, 'g');
  const tope = topeLegumbre(m._doble.primero._componer.tupla, composicion);
  if (!rango || !tope) return {};
  // ajustarComida suma `ampliado` al máximo del rango y después lo multiplica por la amplitud
  // del objetivo: con esta cuenta el máximo queda en el tope, sea cual sea el objetivo.
  const amplitud = Math.min(AMPLITUD_MAX, Math.max(1, targetKcal / KCAL_RACION_NORMAL));
  return { ampliado: (tope + 0.5) / amplitud - rango[1] };
}

/**
 * Escribe la comida doble con los gramos decididos: cada plato con los suyos
 * (el mismo ingrediente puede estar en los dos, el aceite por ejemplo), cada
 * uno adaptado al perfil, y lo que añaden las raciones (pan, fruta), detrás del
 * segundo. Nunca pasa por reescribirComida.
 */
function escribirDoble(m, items, anadidos, profile) {
  const { primero, segundo } = platosDe(m);
  const gramosDe = (n, plato) => {
    const deAdaptacion = clavesDeAdaptacion(plato, profile);
    const porClave = new Map();
    for (const it of items) {
      if (it.plato !== n) continue;
      const clave = deAdaptacion.get(it.clave) || it.clave;
      if (!porClave.has(clave)) porClave.set(clave, it.despues);
    }
    return porClave;
  };
  return recomponerDoble(m, gramosDe(1, primero), gramosDe(2, segundo), {
    trasPrimero: (p) => adaptarSiProcede(p, profile),
    trasSegundo: (s) => adaptarSiProcede(anadir(s, anadidos, 'comida'), profile),
  });
}

export function ajustarDia(day, profile, targetKcal, { composicion = COMPOSICION } = {}) {
  const actuales = day.meals || [];
  const meals = actuales.map((m) => (m ? baseDe(m) : m));
  const lecturas = meals.map((m) => (m ? leerComida(m) : null));
  const comidas = [];
  // Una comida con segundo sin los datos de sus dos platos se trata como texto
  // libre: no se vuelve a racionar (se queda como está), conserva su parte del
  // día y lo dice el log (revisión independiente, 2026-11-17).
  const incompletas = new Set();
  const logPropio = [];
  meals.forEach((m, i) => {
    if (m && esComidaDobleIncompleta(m)) {
      incompletas.add(i);
      logPropio.push({ causa: 'comida_doble_incompleta_texto_libre', momento: MOMENTO[m.time] || 'tentempie', id: String(i), detalle: `«${m.title || ''}» dice llevar segundo (_dishId2) pero no trae los datos de sus dos platos (_doble): se trata como texto libre y no se vuelve a racionar` });
    }
  });
  meals.forEach((m, i) => {
    if (!m) return;
    const lectura = lecturas[i];
    const libre = lectura.libre || !!(m._spec && m._spec.isFree) || incompletas.has(i);
    comidas.push({
      id: String(i),
      momento: MOMENTO[m.time] || 'tentempie',
      libre,
      items: lectura.items.map((it) => ({ ...itemDe(it), ...(m.masa ? { masa: true } : {}), ...(esComidaDoble(m) ? extraDoble(m, it, targetKcal, composicion) : {}) })),
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
    const anadidos = res.items.slice(n).filter((x) => x.anadido);
    const doble = esComidaDoble(m);
    if (doble) {
      // D-116: los dos platos se vuelven a escribir, cada uno con sus gramos y ya con lo añadido.
      escrita = { meal: escribirDoble(m, items, anadidos, profile), sinCambiar: 0 };
    } else if (m._componer) {
      // D-108: un plato compuesto se vuelve a escribir entero con sus gramos
      // nuevos (y se vuelve a adaptar a la dieta o a SIBO del perfil).
      // Los gramos se leyeron de la comida adaptada: se pasan a la clave del compuesto.
      const deAdaptacion = clavesDeAdaptacion(m, profile);
      const porClave = new Map();
      for (const it of items) {
        const clave = deAdaptacion.get(it.clave) || it.clave;
        if (!porClave.has(clave)) porClave.set(clave, it.despues);
      }
      const sinAdaptar = recomponer(m, porClave);
      delete sinAdaptar.adaptadoDieta;
      delete sinAdaptar.adaptadoFodmap;
      escrita = { meal: sinAdaptar, sinCambiar: 0 };
    } else {
      escrita = reescribirComida(m, items);
      if (m._ancla) escrita = { ...escrita, meal: aplicarAnclaLibre(escrita.meal) };
    }
    sinCambiar += escrita.sinCambiar;
    let conAnadidos = doble ? escrita.meal : anadir(escrita.meal, anadidos, MOMENTO[m.time] || 'tentempie');
    if (doble) { /* ya adaptada, plato a plato */ } else if (m._componer) conAnadidos = adaptarSiProcede(conAnadidos, profile);
    else if (conAnadidos.acompanamientos && ((profile && profile.intolerances) || []).includes('sibo')) conAnadidos = { ...adaptarComidaFodmap(conAnadidos), title: conAnadidos.title };
    // Lo que no son cantidades (nota del ancla, marcas de la app) se conserva de la comida actual.
    const actual = { ...actuales[i] };
    delete actual.acompanamientos;
    return {
      ...actual,
      ...(m._ancla ? { _ancla: m._ancla } : {}),
      p1: conAnadidos.p1, p2: conAnadidos.p2, shopping: conAnadidos.shopping, recipe: conAnadidos.recipe,
      ...(conAnadidos.acompanamientos ? { acompanamientos: conAnadidos.acompanamientos } : {}),
      ...(doble ? { _doble: conAnadidos._doble } : {}),
      _base: m,
      nutricion: { kcal: res.kcal, proteina: res.proteina, objetivoKcal: res.objetivo.kcal, objetivoProteina: res.objetivo.proteina },
    };
  });
  return {
    day: { ...day, meals: nuevas, raciones: { kcal: r.total.kcal, proteina: r.total.proteina, objetivoKcal: targetKcal, batido: batido ? true : false } },
    log: [...logPropio, ...r.log].map((e) => ({ ...e, day: day.name })),
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
