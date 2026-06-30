// Correcciones de plateType — Fase 2, checkpoint curaduria (cajon
// sopa_crema). NO es legacyCombos.normalizations.js: ese archivo
// documenta exclusivamente colapsos de colision de comboIdentityKey
// (ver su docstring); esto es una reinterpretacion categorica de
// plateType, un caso distinto que merece su propio seam.
//
// Contrato: corrige SOLO plateType, SOLO donde el plateType del
// snapshot ("sopa_crema") contradice el cookM real del combo. Deriva
// por cookM+proteina (regla fija, ver applyPlateTypeCorrections). No
// toca identidad (tmpl/P/C/V/V2/S/cookM), no toca ningun otro campo,
// no muta legacyCombos.data.js — opera sobre una COPIA del combo.
// Append-only: cada combo efectivamente corregido se documenta aqui
// como entrada causal, citando su identityKey y su cookM.
//
// Regla (solo aplica a combo.plateType === 'sopa_crema'):
//   cookM "plancha" + P "huevo"  -> huevo_plancha
//   cookM "plancha" + P otro     -> plancha_verdura
//   cookM "crudo"                -> ensalada
//   cookM "guisado"              -> guiso
//   cookM null/ausente           -> sin corregir; queda sopa_crema +
//                                   reviewPlateType:true (TODO cocinero)
// El caso null no matchea ninguna rama de corrección: queda fuera de
// applyPlateTypeCorrections por construccion, no por exclusion manual.

import { comboIdentityKey } from './identity.js';

export const PLATETYPE_CORRECTIONS = Object.freeze([
  { identityKey: '["sopa_crema","pollo",null,"brocoli",null,"limon_hierbas","plancha"]', cookM: 'plancha', P: 'pollo', valorElegido: 'plancha_verdura', causa: 'cookM plancha + proteina != huevo' },
  { identityKey: '["sopa_crema","merluza",null,"brocoli",null,"limon_hierbas","plancha"]', cookM: 'plancha', P: 'merluza', valorElegido: 'plancha_verdura', causa: 'cookM plancha + proteina != huevo' },
  { identityKey: '["sopa_crema","gambas",null,"calabacin",null,"ajillo","plancha"]', cookM: 'plancha', P: 'gambas', valorElegido: 'plancha_verdura', causa: 'cookM plancha + proteina != huevo' },
  { identityKey: '["sopa_crema","huevo",null,"espinacas",null,"limon_hierbas","plancha"]', cookM: 'plancha', P: 'huevo', valorElegido: 'huevo_plancha', causa: 'cookM plancha + proteina huevo' },
  { identityKey: '["sopa_crema","atun",null,"tomate","pepino",null,"crudo"]', cookM: 'crudo', P: 'atun', valorElegido: 'ensalada', causa: 'cookM crudo' },
  { identityKey: '["sopa_crema","bacalao",null,"zanahoria","calabaza","ajillo","guisado"]', cookM: 'guisado', P: 'bacalao', valorElegido: 'guiso', causa: 'cookM guisado' },
  { identityKey: '["sopa_crema","huevo",null,"tomate",null,null,"crudo"]', cookM: 'crudo', P: 'huevo', valorElegido: 'ensalada', causa: 'cookM crudo' },
  { identityKey: '["sopa_crema","pollo",null,"puerro",null,"provenzal","guisado"]', cookM: 'guisado', P: 'pollo', valorElegido: 'guiso', causa: 'cookM guisado' },
  { identityKey: '["sopa_crema","pollo",null,"calabaza",null,"provenzal","plancha"]', cookM: 'plancha', P: 'pollo', valorElegido: 'plancha_verdura', causa: 'cookM plancha + proteina != huevo' },
  { identityKey: '["sopa_crema","huevo",null,"calabacin","zanahoria",null,"plancha"]', cookM: 'plancha', P: 'huevo', valorElegido: 'huevo_plancha', causa: 'cookM plancha + proteina huevo' },
  { identityKey: '["sopa_crema","gambas",null,"calabaza",null,"ajillo","plancha"]', cookM: 'plancha', P: 'gambas', valorElegido: 'plancha_verdura', causa: 'cookM plancha + proteina != huevo' },
  { identityKey: '["sopa_crema","atun",null,"tomate","pimientos",null,"crudo"]', cookM: 'crudo', P: 'atun', valorElegido: 'ensalada', causa: 'cookM crudo' },
  { identityKey: '["sopa_crema","pollo",null,"zanahoria","calabacin",null,"guisado"]', cookM: 'guisado', P: 'pollo', valorElegido: 'guiso', causa: 'cookM guisado' },
  { identityKey: '["sopa_crema","pollo",null,"puerro","zanahoria",null,"guisado"]', cookM: 'guisado', P: 'pollo', valorElegido: 'guiso', causa: 'cookM guisado' },
  // cookM null/ausente: NO se corrige, solo se documenta el caso ambiguo.
  { identityKey: '["sopa_crema","huevo",null,"calabaza","zanahoria",null,null]', cookM: null, P: 'huevo', valorElegido: 'sopa_crema', causa: 'cookM null/ausente: sin regla, queda reviewPlateType:true' },
]);

/**
 * Deriva el plateType corregido para un combo con plateType "sopa_crema",
 * segun la regla cookM+proteina. Devuelve null si el combo no aplica
 * (plateType distinto de "sopa_crema") o si cookM es null/ausente (caso
 * ambiguo, sin regla).
 * @param {{plateType?: string, P?: string, cookM?: string}} combo
 * @returns {string|null}
 */
function deriveCorrectedPlateType(combo) {
  if (combo.plateType !== 'sopa_crema') return null;
  if (combo.cookM === 'plancha') return combo.P === 'huevo' ? 'huevo_plancha' : 'plancha_verdura';
  if (combo.cookM === 'crudo') return 'ensalada';
  if (combo.cookM === 'guisado') return 'guiso';
  return null; // null/ausente: sin regla, caso ambiguo
}

/**
 * Aplica la correccion de plateType a un combo, sin mutarlo. Si el
 * combo no es plateType:"sopa_crema", lo devuelve intacto (misma
 * referencia). Si es sopa_crema con cookM ambiguo (null/ausente),
 * devuelve una copia marcada reviewPlateType:true, sin cambiar
 * plateType (TODO cocinero). En el resto de casos, devuelve una copia
 * con plateType corregido segun la regla.
 * @param {object} combo
 * @returns {object}
 */
export function applyPlateTypeCorrections(combo) {
  if (combo.plateType !== 'sopa_crema') return combo;

  const corregido = deriveCorrectedPlateType(combo);
  if (corregido === null) {
    return { ...combo, reviewPlateType: true };
  }
  return { ...combo, plateType: corregido };
}

/**
 * Aplica applyPlateTypeCorrections a cada combo de un pool (array).
 * @param {object[]} pool
 * @returns {object[]}
 */
export function applyPlateTypeCorrectionsToPool(pool) {
  return pool.map(applyPlateTypeCorrections);
}

// Verificacion de auto-consistencia del log: cada identityKey declarado
// en PLATETYPE_CORRECTIONS debe corresponder a una correccion real
// (queda comprobado en el test de paridad — ver
// tests/legacyCombos.plateTypeCorrections.test.js). comboIdentityKey se
// re-exporta aqui solo para que ese test no necesite otro import.
export { comboIdentityKey };
