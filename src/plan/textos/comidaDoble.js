// comidaDoble — la comida con primero y segundo (D-116): un compuesto de
// legumbre de primero y un compuesto de proteína con verdura de segundo.
//
// Es UNA comida del plan (la forma del plan no cambia, D-116.7): el primero va
// en p1, el segundo en p2, y la compra y la receta de los dos, seguidas.
// Lo que hace falta para volver a escribir cada plato con sus gramos (su
// tupla y sus gramos de partida) va en `_doble`, junto con `corte`: cuántas
// líneas de la compra son del primero.
//
// El primero parte de media ración (D-116.6): la legumbre a 50 g en seco (el
// mínimo de su rango), y el hidrato, la verdura y el aceite a la mitad. El
// segundo se compone entero.
//
// Funciones puras: no importan nada del motor viejo ni deciden cantidades
// (eso es de las raciones, racionesApp.js).

import { componerPlato, recomponer } from './componer.js';
import { escribirCompuesto } from './compuestos.js';

export const LEGUMBRE_MEDIA_RACION = 50; // g en seco: el mínimo del rango de la legumbre
const ACEITE_MINIMO = 5; // ml

const minuscula = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const mitad = (x, min = 0) => Math.max(min, Math.round(x / 2 / 5) * 5);
const identidad = (plato) => plato;

/**
 * ¿Es una comida con primero y segundo, con los datos de los dos platos para
 * volver a escribirlos? (`_dishId2`, y en `_doble` cada plato con su
 * `_componer` y el corte de la compra.)
 */
export function esComidaDoble(meal) {
  const d = meal && meal._dishId2 && meal._doble;
  return !!(d && d.primero && d.primero._componer && d.segundo && d.segundo._componer && Number.isInteger(d.corte));
}

/**
 * Comida que dice tener segundo (`_dishId2`) pero no trae los datos de sus dos
 * platos completos: un plan guardado a medias, editado a mano o de otra
 * versión. Se trata como texto libre (revisión independiente, 2026-11-17).
 */
export function esComidaDobleIncompleta(meal) {
  return !!(meal && meal._dishId2) && !esComidaDoble(meal);
}

/** Título de la comida doble: «Lentejas con zanahoria; de segundo, pechuga de pollo con brócoli». */
export function tituloDoble(nombrePrimero, nombreSegundo) {
  return `${nombrePrimero}; de segundo, ${minuscula(nombreSegundo)}`;
}

/** Lo que se guarda de cada plato: lo justo para volver a escribirlo. */
function datosDe(plato) {
  return { time: 'Comida', title: plato.title, _componer: plato._componer };
}

/** El primero, a media ración. */
function primeroAMedias(dish, targetKcal, ancla) {
  const P0 = componerPlato(dish, 'comida', targetKcal, { ancla });
  if (!P0._componer) throw new Error(`comidaDoble: el primero no es un plato compuesto (${dish.id})`);
  const g = P0._componer.gramos;
  const gramos = {
    ...g,
    P: mitad(g.P, LEGUMBRE_MEDIA_RACION),
    ...(g.C != null ? { C: mitad(g.C) } : {}),
    ...(g.V != null ? { V: mitad(g.V) } : {}),
    ...(g.V2 != null ? { V2: mitad(g.V2) } : {}),
    aove: mitad(g.aove || 15, ACEITE_MINIMO),
  };
  const componer = { ...P0._componer, gramos };
  const t = escribirCompuesto({ ...componer, ancla: P0._ancla || null });
  return { ...P0, title: t.title, p1: t.p1, p2: t.p2, shopping: t.shopping, recipe: t.recipe, _componer: componer };
}

/**
 * Une dos platos ya escritos en una sola comida.
 * @param {object} P primero (title, p1, p2, shopping, recipe)
 * @param {object} S segundo
 * @param {object} resto los demás campos de la comida (se conservan)
 */
export function combinarDoble(P, S, resto) {
  const adaptado = (campo) => (P[campo] && P[campo] === S[campo] ? { [campo]: P[campo] } : {});
  return {
    ...resto,
    p1: `De primero: ${[P.p1, P.p2].filter(Boolean).join(' · ')}`,
    p2: `De segundo: ${[S.p1, S.p2].filter(Boolean).join(' · ')}`,
    shopping: [...(P.shopping || []), ...(S.shopping || [])],
    recipe: [`De primero, ${minuscula(P.title)}:`, ...(P.recipe || []), `De segundo, ${minuscula(S.title)}:`, ...(S.recipe || [])],
    ...(S.acompanamientos ? { acompanamientos: S.acompanamientos } : {}),
    ...adaptado('adaptadoDieta'), ...adaptado('adaptadoFodmap'),
    _doble: { ...resto._doble, corte: (P.shopping || []).length },
  };
}

/**
 * Comida con primero y segundo, antes de ajustar raciones.
 * @param {{id:string, nombre:string, plateType:string}} primero compuesto de legumbre
 * @param {{id:string, nombre:string, plateType:string}} segundo compuesto de proteína con verdura
 * @param {number} targetKcal
 * @param {{ancla?: object, porPlato?: (plato: object) => object}} [extra] ancla de la semana
 *   (solo afecta al primero) y lo que se le hace a cada plato antes de unirlos (adaptarlo al perfil)
 */
export function componerComidaDoble(primero, segundo, targetKcal, { ancla = null, porPlato = identidad } = {}) {
  const P = primeroAMedias(primero, targetKcal, ancla);
  const S = componerPlato(segundo, 'comida', targetKcal);
  if (!S._componer) throw new Error(`comidaDoble: el segundo no es un plato compuesto (${segundo.id})`);
  return combinarDoble(porPlato(P), porPlato(S), {
    time: 'Comida', emoji: P.emoji, title: tituloDoble(primero.nombre, segundo.nombre), metadata: P.metadata,
    _dishId: primero.id, _dishId2: segundo.id,
    ...(P._ancla ? { _ancla: P._ancla } : {}),
    _doble: { primero: datosDe(P), segundo: datosDe(S) },
  });
}

/** Los dos platos de una comida doble, con sus gramos de partida y el ancla de la comida en el primero. */
export function platosDe(meal) {
  const { primero, segundo } = meal._doble;
  return { primero: { ...primero, ...(meal._ancla ? { _ancla: meal._ancla } : {}) }, segundo };
}

/**
 * Vuelve a escribir los dos platos con los gramos que han decidido las
 * raciones (por clave del medidor, un mapa por plato) y los une de nuevo.
 * @param {object} meal comida doble
 * @param {Map<string, number>} gramosPrimero
 * @param {Map<string, number>} gramosSegundo
 * @param {{trasPrimero?: Function, trasSegundo?: Function}} [extra] lo que se le hace a cada plato ya
 *   escrito, antes de unirlos (añadir el pan o la fruta al segundo, adaptar al perfil)
 */
export function recomponerDoble(meal, gramosPrimero, gramosSegundo, { trasPrimero = identidad, trasSegundo = identidad } = {}) {
  const { primero, segundo } = platosDe(meal);
  const { acompanamientos: _a, adaptadoDieta: _d, adaptadoFodmap: _f, ...resto } = meal;
  return combinarDoble(trasPrimero(recomponer(primero, gramosPrimero)), trasSegundo(recomponer(segundo, gramosSegundo)), resto);
}

/** La compra de la comida doble, plato a plato: [líneas del primero, líneas del segundo]. */
export function compraPorPlato(meal) {
  const compra = meal.shopping || [];
  const corte = meal._doble && Number.isInteger(meal._doble.corte) ? meal._doble.corte : compra.length;
  return [compra.slice(0, corte), compra.slice(corte)];
}
