// componer — la comida o cena de un plato de engine2, sin pasar por el motor
// viejo (D-108).
//   - Plato compuesto (tupla): texto propio de engine2 (compuestos.js).
//   - Plato libre (freeform y platos de dieta): su texto redactado a mano.
// Con el ancla de la semana (cocinar de una vez y aprovechar otro día), la
// receta lo dice: el día de cocinar, cuánto hacer y cuánto guardar; el día de
// aprovechar, usar lo ya cocinado en vez de cocinarlo en crudo.

import { FREEFORM_COMBOS } from '../../data/FREEFORM_COMBOS.js';
import { PLATOS_DIETA } from '../../data/PLATOS_DIETA.js';
import { leerComida } from '../medidor/leerComida.js';
import { escribirCompuesto, gramosDePartida, clavesDe, pasoAprovechar, pasoCocinarDeMas, huecoDeBase, PROTEINAS } from './compuestos.js';

const libres = new Map([...FREEFORM_COMBOS, ...PLATOS_DIETA].filter((f) => f && f.identity).map((f) => [f.identity.id, f]));

/** Tupla de un plato compuesto, o null si es un plato libre. */
export function tuplaDe(dishId) {
  if (typeof dishId !== 'string' || !dishId.startsWith('[')) return null;
  try {
    const t = JSON.parse(dishId);
    if (!Array.isArray(t) || t.length !== 7) return null;
    const [tmpl, P, C, V, V2, S, cookM] = t;
    return PROTEINAS[P] ? { tmpl, P, C, V, V2, S, cookM } : null;
  } catch {
    return null;
  }
}

// Clave del medidor de cada ingrediente base del ancla, en platos libres.
const CLAVES_BASE = Object.freeze({
  pollo: ['pollo_pechuga', 'pollo_muslo', 'pollo_cocido'], pavo: ['pavo_pechuga'], ternera: ['ternera_magra', 'ternera_picada'],
  cerdo: ['cerdo_lomo'], garbanzos: ['garbanzos_seco', 'garbanzos_cocidos', 'hummus'], alubias: ['alubias_seco', 'alubias_cocidas'],
  arroz: ['arroz_seco', 'arroz_integral_cocido'], quinoa: ['quinoa_seco'],
});

/** Gramos del ingrediente base del ancla en una comida ya escrita. */
export function gramosDeBase(meal, base) {
  const claves = CLAVES_BASE[base] || [];
  return Math.round(leerComida(meal).items.filter((i) => claves.includes(i.clave)).reduce((a, i) => a + i.gramos, 0));
}

const PASO_ANCLA = /^(Usa (el|la|los|las) .+ que (cocinaste|cociste) |(Cocina|Cuece) de una vez )/;

/**
 * Pasos del ancla en un plato libre (su receta es la redactada a mano): al
 * principio, qué hacer con el ingrediente base. Idempotente.
 */
export function aplicarAnclaLibre(meal) {
  const a = meal && meal._ancla;
  if (!a || !Array.isArray(meal.recipe)) return meal;
  const receta = meal.recipe.filter((p) => !(typeof p === 'string' && PASO_ANCLA.test(p)));
  let paso;
  if (a.rol === 'aprovechar') paso = `${pasoAprovechar(a.base, a.cuando)} Sáltate el paso de cocinarlo en esta receta.`;
  else if (a.guardar && a.guardar.length) paso = pasoCocinarDeMas(a.base, gramosDeBase(meal, a.base), a.guardar);
  return { ...meal, recipe: paso ? [paso, ...receta] : receta };
}

/**
 * Comida de un plato de engine2.
 * @param {{id:string, nombre:string, plateType:string, batchable?:boolean, shelfLifeDays?:number}} dish
 * @param {'comida'|'cena'} momento
 * @param {number} targetKcal
 * @param {{ancla?: object}} [extra]
 */
export function componerPlato(dish, momento, targetKcal, { ancla = null } = {}) {
  const time = momento === 'cena' ? 'Cena' : 'Comida';
  const tupla = tuplaDe(dish.id);
  if (tupla) {
    const gramos = gramosDePartida(tupla, targetKcal);
    const componer = { tupla, nombre: dish.nombre, momento, batchable: !!dish.batchable, shelfLifeDays: dish.shelfLifeDays || 0, gramos };
    const anclaPlato = ancla && huecoDeBase(tupla, ancla.base) ? ancla : null;
    const t = escribirCompuesto({ ...componer, ancla: anclaPlato });
    return {
      time, emoji: t.emoji, title: t.title, p1: t.p1, p2: t.p2, shopping: t.shopping, recipe: t.recipe,
      metadata: { plateType: dish.plateType },
      // _spec: para las regeneraciones del motor viejo (planes antiguos), con el nombre de engine2.
      _spec: { ...tupla, slot: time, plateType: dish.plateType, title: dish.nombre },
      _componer: componer,
      ...(anclaPlato ? { _ancla: anclaPlato } : {}),
    };
  }
  const ficha = libres.get(dish.id);
  if (!ficha) throw new Error(`componerPlato: sin texto para ${dish.id}`);
  const c = ficha.content;
  const meal = {
    time,
    emoji: ficha.identity.emoji || (time === 'Cena' ? '🌙' : '☀️'),
    title: dish.nombre,
    p1: c.p1 || '', p2: c.p2 || '',
    shopping: [...(c.shopping || [])],
    recipe: [...(c.recipe || [])],
    metadata: { plateType: ficha.identity.plateType || dish.plateType },
    _spec: { ...ficha, slot: time },
    ...(ancla ? { _ancla: ancla } : {}),
  };
  return aplicarAnclaLibre(meal);
}

/**
 * Vuelve a escribir un plato compuesto con los gramos que han decidido las
 * raciones (por clave del medidor). Lo que falte se queda como estaba.
 */
export function recomponer(meal, gramosPorClave) {
  const c = meal && meal._componer;
  if (!c) return meal;
  const claves = clavesDe(c.tupla);
  const P = PROTEINAS[c.tupla.P];
  const g = (hueco) => (claves[hueco] && gramosPorClave.has(claves[hueco]) ? gramosPorClave.get(claves[hueco]) : c.gramos[hueco]);
  const gramos = {
    P: P.unidad === 'ud' ? Math.max(1, Math.round((gramosPorClave.has(claves.P) ? gramosPorClave.get(claves.P) : c.gramos.P * P.gUd) / P.gUd)) : Math.round(g('P')),
    C: c.tupla.C ? Math.round(g('C')) : undefined,
    V: c.tupla.V ? Math.round(g('V')) : undefined,
    V2: c.tupla.V2 ? Math.round(g('V2')) : undefined,
    aove: gramosPorClave.has('aove') ? Math.round(gramosPorClave.get('aove') / 0.92 / 5) * 5 || 5 : c.gramos.aove,
  };
  const t = escribirCompuesto({ ...c, gramos, ancla: meal._ancla || null });
  return { ...meal, title: t.title, p1: t.p1, p2: t.p2, shopping: t.shopping, recipe: t.recipe };
}
