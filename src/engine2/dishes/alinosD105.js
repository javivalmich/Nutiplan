// Aliños: nombre visible y aliño de cada plato (D-105, 2026-10-12).
//
// El catálogo heredado del motor viejo usa 10 aliños y 4 llevan ajo; el más
// frecuente, `ajillo`, se escribe «ajo, perejil y guindilla» dentro del
// nombre. engine2 enseñaba el aliño completo en el nombre de cada plato
// (el motor viejo lo escondía en el título), y en un tercio de las cenas se
// leía «ajo, perejil y guindilla».
//
//   - nombreVisible(nombre): quita del nombre los 4 aliños con ajo. Solo se
//     conserva «al ajillo» en gambas y conejo, donde es el nombre del plato.
//     Los otros 6 aliños (mostaza y miel, curry, soja y jengibre, hierbas
//     provenzales, tomate casero, vinagre de Módena) siguen en el nombre: dan
//     el carácter del plato y no llevan ajo. Las formas cortas que ya existen
//     («Pasta integral al ajillo con…», «Lentejas con pimentón con…») no se
//     tocan. Es una función pura de texto: se aplica igual a los nombres del
//     catálogo y a los nombres guardados de la semana anterior, para que un
//     plato no pueda repetirse justo la semana del cambio.
//   - aplicarNombresD105(catalog): devuelve el catálogo con los nombres
//     visibles, sin mutarlo. scripts/phaseB2/output/dishes.json no se toca
//     (sha256 ratificado en D-028), igual que ajustesD099.js.
//   - alinoDe(dish): aliño del plato (campo S de la tupla) o null. Lo usan
//     las reglas de aliño del menú (runWalk.js, alternativa.js).

export const ALINOS_CON_AJO = Object.freeze([
  'ajo, perejil y guindilla',
  'limón, orégano y ajo',
  'pimentón ahumado y ajo',
  'romero, limón y ajo',
]);

// Platos donde «al ajillo» es el nombre del plato: se conserva en esa forma.
const AJILLO_CLASICO = /^(Gambas|Conejo)\b/;
const METODO = '(?:a la plancha|al horno|guisado|salteado|revuelto|en tortilla|al vapor)';

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CON_ALINO = new RegExp(` con (?:${ALINOS_CON_AJO.map(escapar).join('|')})(?= con |$)`);
const AJILLO_LARGO = new RegExp(` ${METODO} con ajo, perejil y guindilla(?= con |$)`);

/** Aliño máximo de ajillo por semana (comida + cena). */
export const TOPE_AJILLO_SEMANA = 2;

// Platos libres (sin tupla) que son, de hecho, un ajillo.
const ALINO_FREEFORM = Object.freeze({ pollo_ajillo_patatas: 'ajillo' });

/**
 * Nombre que ve el usuario. Idempotente: nombreVisible(nombreVisible(x)) === nombreVisible(x).
 * @param {string} nombre
 * @returns {string}
 */
export function nombreVisible(nombre) {
  if (typeof nombre !== 'string') return nombre;
  if (AJILLO_CLASICO.test(nombre) && AJILLO_LARGO.test(nombre)) {
    return nombre.replace(AJILLO_LARGO, ' al ajillo');
  }
  return nombre.replace(CON_ALINO, '');
}

/**
 * Catálogo con los nombres visibles (copias congeladas solo de los platos
 * cuyo nombre cambia; el resto, los mismos objetos).
 * @param {ReadonlyArray<object>} catalog
 * @returns {ReadonlyArray<object>}
 */
export function aplicarNombresD105(catalog) {
  return catalog.map((d) => {
    const nombre = nombreVisible(d.nombre);
    return nombre === d.nombre ? d : Object.freeze({ ...d, nombre });
  });
}

/**
 * Aliño del plato: campo S de la tupla scaffold, o la entrada de
 * ALINO_FREEFORM; null si no tiene.
 * @param {{id: string}} dish
 * @returns {string|null}
 */
export function alinoDe(dish) {
  if (!dish || typeof dish.id !== 'string') return null;
  if (ALINO_FREEFORM[dish.id]) return ALINO_FREEFORM[dish.id];
  if (!dish.id.startsWith('[')) return null;
  try {
    const tupla = JSON.parse(dish.id);
    return Array.isArray(tupla) && tupla.length === 7 ? tupla[5] : null;
  } catch {
    return null;
  }
}
