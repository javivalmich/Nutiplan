// ─── RNG DETERMINISTA ───────────────────────────────────────────────────────
// Promovido desde src/engine/tests/buildPlan.snapshot.test.js (estaba inline
// en el test). mulberry32: PRNG rapido, suficiente para variedad de menus —
// NO es criptografico.

/**
 * @param {number} seed entero (se normaliza a uint32)
 * @returns {() => number} generador determinista: misma seed -> misma secuencia.
 *   Cada llamada devuelve un float en [0, 1).
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
