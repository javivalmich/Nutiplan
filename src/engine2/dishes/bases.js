// Bases de ancla — prototipo del visor (2026-10-10, reglas de Javi).
//
// El ancla de la semana ya no es un plato sino un INGREDIENTE que se cocina
// una vez y se aprovecha en dos platos distintos: el dia de cocinar sale un
// plato que lo lleva y, con lo que sobra, otro dia sale OTRO plato que
// tambien lo lleva. Las lentejas no son base: guisadas o en ensalada ya son
// el plato y no se pueden reaprovechar en otro.
//
// Reglas del segundo plato (el aprovechamiento):
//   - distinto nombre que el primero (y, si se puede, distinto tipo de plato);
//   - carne (pollo, pavo, ternera, cerdo): solo platos donde la carne entra ya
//     cocinada (ensalada, bowl, pasta, salteado, wok, sopa o crema con la
//     carne encima, wrap...). Nada que pida cocinarla en crudo (al horno, a la
//     plancha, airfryer, hamburguesa, carpaccio).
//   - legumbres y cereales: cualquier otro plato que los lleve.
// Sin score: solo filtros; el desempate entre candidatos validos es RNG
// sembrado (CLAUDE.md, invariante 1).

import { resolveDishComposition, UnresolvableOriginError } from './compositionResolver.js';

export const BASES = Object.freeze([
  { base: 'garbanzos', tipo: 'legumbre', etiqueta: 'garbanzos' },
  { base: 'alubias', tipo: 'legumbre', etiqueta: 'alubias' },
  { base: 'pollo', tipo: 'carne', etiqueta: 'pollo' },
  { base: 'pavo', tipo: 'carne', etiqueta: 'pavo' },
  { base: 'ternera', tipo: 'carne', etiqueta: 'ternera' },
  { base: 'cerdo', tipo: 'carne', etiqueta: 'cerdo' },
  { base: 'arroz', tipo: 'cereal', etiqueta: 'arroz' },
  { base: 'quinoa', tipo: 'cereal', etiqueta: 'quinoa' },
].map((b) => Object.freeze({
  ...b, identityKey: `base:${b.base}`, shelfLifeDays: 3, maxServicios: 2,
})));

function vistaSegura(dish) {
  try {
    return resolveDishComposition(dish);
  } catch (err) {
    if (err instanceof UnresolvableOriginError) return null;
    throw err;
  }
}

const NOMBRE = {
  garbanzos: /garbanzo|hummus/i,
  alubias: /alubias blancas|fabada/i,
  pollo: /pollo/i,
  pavo: /pavo/i,
  ternera: /ternera/i,
  cerdo: /cerdo|lomo/i,
  arroz: /\barroz\b/i,
  quinoa: /quinoa/i,
};

/** ¿Lleva el plato este ingrediente base? */
export function llevaBase(dish, base) {
  if (/falafel/i.test(dish.nombre) && base === 'garbanzos') return false; // se hace con garbanzo crudo remojado
  if (base === 'arroz' && dish.plateType === 'arroz_plato') return false; // paella/risotto: el arroz se cuece en el plato
  const vista = vistaSegura(dish);
  const P = vista && vista.tupla ? vista.tupla.P : vista && vista.claveP;
  const C = vista && vista.tupla ? vista.tupla.C : null;
  if (P === base || C === base) return true;
  return NOMBRE[base].test(dish.nombre);
}

const ENCAJA_TIPO = new Set(['ensalada', 'bowl', 'pasta', 'salteado_wok', 'arroz_plato', 'sopa_crema', 'guiso', 'masa', 'bocado_mano', 'en_salsa']);
const NO_ENCAJA_NOMBRE = /hamburguesa|nuggets|crujiente|al horno|a la plancha|carpaccio|al ajillo con patatas/i;

/** Para carne: ¿el plato admite la carne ya cocinada? */
export function encajaYaCocinada(dish) {
  if (NO_ENCAJA_NOMBRE.test(dish.nombre)) {
    // «Crema de X con pechuga de pollo encima» lleva «a la plancha» solo en la tupla, no en el nombre.
    return false;
  }
  const vista = vistaSegura(dish);
  const cookM = vista && vista.tupla ? vista.tupla.cookM : null;
  return ENCAJA_TIPO.has(dish.plateType) || cookM === 'salteado' || /encima/i.test(dish.nombre);
}

/** Proteina principal del plato (la del catalogo: tupla.P o claveP). */
export function proteinaPrincipal(dish) {
  const vista = vistaSegura(dish);
  if (!vista) return null;
  return (vista.tupla && vista.tupla.P) || vista.claveP || null;
}

/** Tope de veces que una misma proteina principal sale en la semana (comida + cena). */
export const TOPE_PROTEINA_SEMANA = 2;
