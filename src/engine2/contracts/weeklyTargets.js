// WeeklyTargets — Fase 4, Componente P0-3. Vive en contracts/ (nueva
// carpeta): describe forma/semantica de contratos transversales que no
// pertenecen a un dominio existente (dishes/ es catalogo, memory/ es
// storage, skeleton/ es plantillas+RNG) — este y profile.js (Componente
// P0-4) comparten esa naturaleza.
//
// Dos niveles, decision ratificada (ver DECISIONS.md):
//   1) Contrato/shape: que campos existen y su semantica de SUELO/CUOTA.
//      NO es WEEKLY_CAP (motor viejo): un techo no produce ritmo, solo
//      evita excesos. WeeklyTargets es un piso a alcanzar durante la
//      semana, no un limite a no superar.
//   2) DEFAULT_WEEKLY_TARGETS: valores provisionales — ratificacion de
//      negocio pendiente para P2. Recordatorio F5: revisar legumbre a 4
//      (AESAN).
//
// Sin consumidor en P0 por diseño (declarado, no accidental).

/**
 * @typedef {object} WeeklyTargets
 * @property {number} pescado - suelo semanal de raciones de pescado (no techo).
 * @property {number} legumbre - suelo semanal de raciones de legumbre (no techo).
 * @property {number} verduraDiaria - suelo diario de raciones de verdura (no techo).
 */

export const WEEKLY_TARGETS_FIELDS = Object.freeze(['pescado', 'legumbre', 'verduraDiaria']);

/**
 * Valores provisionales — ratificacion de negocio pendiente para P2.
 * Recordatorio F5: revisar legumbre a 4 (AESAN).
 * @type {WeeklyTargets}
 */
export const DEFAULT_WEEKLY_TARGETS = Object.freeze({
  pescado: 2,
  legumbre: 2,
  verduraDiaria: 1,
});

/**
 * Verifica que un objeto cumple el shape declarado de WeeklyTargets: los
 * campos de WEEKLY_TARGETS_FIELDS presentes y numericos, sin exigir nada
 * sobre su magnitud (eso es ratificacion de negocio, fuera de P0).
 * @param {*} target
 * @returns {boolean}
 */
export function isWeeklyTargetsShape(target) {
  if (target === null || typeof target !== 'object') return false;
  return WEEKLY_TARGETS_FIELDS.every((field) => typeof target[field] === 'number' && Number.isFinite(target[field]));
}
