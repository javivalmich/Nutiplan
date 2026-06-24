// PRNG sembrado, propio de engine2 — Fase 3, Checkpoint 3A. mulberry32:
// algoritmo de dominio publico (no logica de negocio de buildPlan.js), asi
// que esto NO es una derivacion que necesite parity test como
// deriveTempFeelEngine2: R6 solo exige que la MISMA seed produzca el MISMO
// resultado dentro de engine2, no que coincida byte a byte con la
// secuencia del motor viejo. engine2 no importa src/engine/rng.js en
// produccion (regla de aislamiento) — esta es una copia independiente del
// mismo algoritmo publico, no una copia de la implementacion del legacy.

/**
 * @param {number} seed entero (se normaliza a uint32)
 * @returns {() => number} generador determinista: misma seed -> misma secuencia.
 */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash deterministico de string -> entero de 32 bits, para poder usar
 * seeds de tipo string (p. ej. hash(userId+weekNumber) de F0) ademas de
 * numericas.
 * @param {string} str
 * @returns {number}
 */
export function seedFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}
