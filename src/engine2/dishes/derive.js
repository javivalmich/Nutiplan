// Derivaciones propias de engine2 para el esquema de Plato (Fase 3,
// Checkpoint 1). Puras, deterministas, identificadores ASCII (precedente:
// BUG 1 de Fase 1 fue un desajuste por tilde).
//
// engine2 NUNCA importa src/engine/buildPlan.js en produccion (CLAUDE.md,
// regla de aislamiento). deriveTempFeelEngine2 es una copia deliberada de
// deriveTempFeel (src/engine/buildPlan.js) — no una llamada a ella. Su
// unico consumidor autorizado fuera de aqui es el parity test
// (tests/parity.deriveTempFeel.test.js), que la compara contra el
// original para detectar drift entre ambas copias.

/**
 * Temperatura percibida del plato. Copia paritaria de
 * deriveTempFeel(combo) en src/engine/buildPlan.js.
 * @param {{tmpl?: string, cookM?: string}} combo
 * @returns {'frio'|'caliente'|'muy_caliente'}
 */
export function deriveTempFeelEngine2(combo) {
  const tmpl = combo.tmpl || '';
  const cookM = combo.cookM || '';
  if (tmpl === 'ensalada' || tmpl === 'bowl' || cookM === 'crudo') return 'frio';
  if (tmpl === 'sopa_crema' || cookM === 'guisado') return 'muy_caliente';
  return 'caliente';
}

/**
 * Tipo de plato. Campo directo del combo del motor viejo + fallback de
 * produccion (no null) — identico a comboToPoolEntry en buildPlan.js.
 * @param {{plateType?: string}} combo
 * @returns {string}
 */
export function derivePlateType(combo) {
  return combo.plateType || 'caliente_arroz';
}

/**
 * Momento del dia en que se sirve el plato: conjunto NO VACIO de
 * {"comida","cena"}, derivado UNICAMENTE de la pertenencia estructural
 * del combo a los pools del motor viejo:
 *   LUNCH_COMBOS -> "comida"
 *   DINNER_COMBOS -> "cena"
 *   TRAINING_DINNERS -> "cena"
 * Nunca lee ni parsea el campo `slot` (string libre con emoji en
 * TRAINING_DINNERS, p.ej. "Cena" + emoji "🏋️" en campos separados) —
 * un match por igualdad de ese string reintrodujo BUG 6 en Fase 1.
 * Un combo puede pertenecer a mas de un pool (recetas identicas servidas
 * tanto en comida como en cena en el motor viejo); en ese caso el
 * conjunto resultante tiene mas de un elemento.
 * @param {Array<'LUNCH_COMBOS'|'DINNER_COMBOS'|'TRAINING_DINNERS'>} pools
 * @returns {Array<'comida'|'cena'>}
 */
export function deriveMomento(pools) {
  const momentoSet = new Set();
  if (pools.includes('LUNCH_COMBOS')) momentoSet.add('comida');
  if (pools.includes('DINNER_COMBOS')) momentoSet.add('cena');
  if (pools.includes('TRAINING_DINNERS')) momentoSet.add('cena');
  return [...momentoSet];
}
