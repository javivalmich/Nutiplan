// ─── MEMORYSTORE — INTERFAZ (sin implementación de storage) ───────────────
// Definido en CLAUDE.md, sección "Contrato MemoryStore". Solo firmas + JSDoc.
// engine2 depende de esta interfaz, no de un storage concreto.

/**
 * @param {string} userId
 * @param {number} weekNumber
 * @returns {{ plan: object, decisionLog: object[] } | null}
 */
export function getWeek(userId, weekNumber) {
  throw new Error('MemoryStore.getWeek: sin implementación (Fase 0 — solo contrato)');
}

/**
 * @param {string} userId
 * @param {number} weekNumber
 * @param {object} plan
 * @param {object[]} decisionLog
 * @returns {void}
 */
export function saveWeek(userId, weekNumber, plan, decisionLog) {
  throw new Error('MemoryStore.saveWeek: sin implementación (Fase 0 — solo contrato)');
}

/**
 * @param {string} userId
 * @returns {object[] | null} Dish[]
 */
export function getRepertoire(userId) {
  throw new Error('MemoryStore.getRepertoire: sin implementación (Fase 0 — solo contrato)');
}

/**
 * @param {string} userId
 * @param {string} dishId
 * @param {*} signal
 * @returns {void}
 */
export function recordFeedback(userId, dishId, signal) {
  throw new Error('MemoryStore.recordFeedback: sin implementación (Fase 0 — solo contrato)');
}
