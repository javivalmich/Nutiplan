// Dias de la semana - Fase 3, Checkpoint 3A. Identificadores ASCII (R7).
//
// stripAccents existe porque profile.trainingDays llega con tildes desde
// el perfil legacy (p. ej. "Miercoles" con tilde, ver baselineFixtures.js).
// Comparar strings acentuados a mano es exactamente el patron que produjo
// BUG 1 en Fase 1 (desajuste por tilde) - normalizamos ambos lados ANTES
// de comparar para no repetirlo, en vez de confiar en que el dato de
// entrada siempre venga en la forma esperada.

export const DAYS_ORDER = Object.freeze([
  'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo',
]);

// \p{Diacritic} (Unicode property escape, solo texto ASCII en el archivo
// fuente -- evita caracteres literales con tilde en el propio codigo).
const DIACRITICS = /\p{Diacritic}/gu;

/**
 * @param {string} str
 * @returns {string} mismo string sin diacriticos (NFD + strip marks)
 */
export function stripAccents(str) {
  return String(str).normalize('NFD').replace(DIACRITICS, '');
}

/**
 * Compara dos nombres de dia ignorando tildes (ver nota de cabecera).
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  return stripAccents(a).toLowerCase() === stripAccents(b).toLowerCase();
}
