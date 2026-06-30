// Ensamblador de Plato — Fase 2, Paso 0, Commit 3. Une identidad + derive.js
// (CP1) + anotacion editorial de anchors.js (CP2) en un Dish completo que
// validateDish (schema.js) pueda aceptar. Sin identificadores de scoring
// (score/rank/ranking/weight/weighted/topN) — seguro bajo el tripwire AST
// (ver src/engine/tests/tripwire-no-score.test.js).
//
// poolMembership lo calcula el llamador (interseccion de comboIdentityKey
// contra cada pool RAW de legacyCombos.data.js) — este modulo no conoce los
// pools ni los importa, para mantenerse puro y testeable sin I/O.

import { comboIdentityKey } from './identity.js';
import { deriveMomento, deriveTempFeelEngine2, derivePlateType } from './derive.js';

/**
 * @param {{tmpl?: string, P?: string, C?: string|null, V?: string, V2?: string, S?: string, cookM?: string, plateType?: string}} combo
 * @param {Array<'LUNCH_COMBOS'|'DINNER_COMBOS'|'TRAINING_DINNERS'>} poolMembership
 * @param {{nombre: string, rol: string, batchable: boolean, leftoverQuality: string, shelfLifeDays: number, energiaCocina: string}} editorial
 * @returns {object} Dish — shape de schema.js, sin validar (el llamador decide si valida)
 */
export function assembleDish(combo, poolMembership, editorial) {
  return {
    id: comboIdentityKey(combo),
    ...editorial,
    momento: deriveMomento(poolMembership),
    tempFeel: deriveTempFeelEngine2(combo),
    plateType: derivePlateType(combo),
    ...(combo.reviewPlateType ? { reviewPlateType: true } : {}),
  };
}
