// Correcciones de plateType — Fase 2, checkpoints curaduria (PR1: cajon
// sopa_crema; PR2: enum a 24, pescado_plancha, crudo). NO es
// legacyCombos.normalizations.js: ese archivo documenta exclusivamente
// colapsos de colision de comboIdentityKey (ver su docstring); esto es
// una reinterpretacion categorica de plateType, un caso distinto que
// merece su propio seam.
//
// Contrato (ampliado en PR2, ratificado): canonaliza plateType por
// (cookM, P, tmpl) hacia la categoria mas fina del enum, mediante una
// tabla de reglas fijas explicitas. No infiere, no generaliza, no
// reinterpreta el combo mas alla del plateType. Nunca toca identidad
// (tmpl/P/C/V/V2/S/cookM) ni ningun otro campo, no muta
// legacyCombos.data.js — opera sobre una COPIA del combo. Append-only:
// cada combo efectivamente corregido se documenta como entrada causal,
// citando su identityKey. Cualquier combinacion sin regla fija ->
// sin tocar + reviewPlateType:true.
//
// PRECEDENCIA: una regla ESPECIFICA (identityKey explicito, p.ej.
// pescado_plancha o crudo) GANA sobre una regla GENERICA (patron
// cookM+P aplicado a un plateType de origen, p.ej. la familia
// sopa_crema de PR1). Ver applyPlateTypeCorrections: las tablas
// especificas se evaluan antes que el fallback generico.

import { comboIdentityKey } from './identity.js';

// ─── PR1: cajon sopa_crema (regla GENERICA por cookM+P, sin tocar) ────
//
// Regla (solo aplica a combo.plateType === 'sopa_crema'):
//   cookM "plancha" + P "huevo"  -> huevo_plancha
//   cookM "plancha" + P otro     -> plancha_verdura (salvo que una regla
//                                    ESPECIFICA de PR2 gane, ver abajo)
//   cookM "crudo"                -> ensalada (salvo regla ESPECIFICA de
//                                    PR2 "crudo", ver abajo)
//   cookM "guisado"               -> guiso
//   cookM null/ausente           -> sin corregir; queda sopa_crema +
//                                   reviewPlateType:true (TODO cocinero)
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

// ─── PR2: pescado_plancha (regla ESPECIFICA, gana sobre la generica) ──
//
// cookM "plancha" + P pescado/marisco + verdura unica (sin base de
// arroz/patata/boniato, sin segunda verdura/aderezo de ensalada
// compuesta). Oracle ratificado (7 entradas): incluye las que la regla
// generica de PR1 manda a "plancha_verdura" desde plateType origen
// "sopa_crema" (132,133,243 en legacyCombos.data.js) y las que ya
// estaban mal etiquetadas como "pescado_horno" con cookM "plancha"
// (222,275). EXCLUYE explicitamente las ensaladas compuestas (tmpl
// "ensalada" con V2 + aderezo: lineas 112,163,165,195,238) — ratificado
// por Javi, se quedan "ensalada".
export const PESCADO_PLANCHA_CORRECTIONS = Object.freeze([
  { identityKey: '["sopa_crema","merluza",null,"brocoli",null,"limon_hierbas","plancha"]', cookM: 'plancha', P: 'merluza', valorElegido: 'pescado_plancha', causa: 'cookM plancha + pescado + verdura unica (gana sobre la generica sopa_crema->plancha_verdura)' },
  { identityKey: '["sopa_crema","gambas",null,"calabacin",null,"ajillo","plancha"]', cookM: 'plancha', P: 'gambas', valorElegido: 'pescado_plancha', causa: 'cookM plancha + marisco + verdura unica (gana sobre la generica sopa_crema->plancha_verdura)' },
  { identityKey: '["caliente_clasico","sardinas",null,"tomate",null,"ajillo","plancha"]', cookM: 'plancha', P: 'sardinas', valorElegido: 'pescado_plancha', causa: 'cookM plancha + pescado + verdura unica, hoy mal etiquetado pescado_horno' },
  { identityKey: '["sopa_crema","gambas",null,"calabaza",null,"ajillo","plancha"]', cookM: 'plancha', P: 'gambas', valorElegido: 'pescado_plancha', causa: 'cookM plancha + marisco + verdura unica (gana sobre la generica sopa_crema->plancha_verdura)' },
  { identityKey: '["caliente_clasico","gambas",null,"calabacin",null,"ajillo","plancha"]', cookM: 'plancha', P: 'gambas', valorElegido: 'pescado_plancha', causa: 'cookM plancha + marisco + verdura unica' },
  { identityKey: '["caliente_clasico","calamares",null,"pimientos",null,"ajillo","plancha"]', cookM: 'plancha', P: 'calamares', valorElegido: 'pescado_plancha', causa: 'cookM plancha + marisco + verdura unica' },
  { identityKey: '["caliente_clasico","salmon",null,"esparragos",null,"limon_hierbas","plancha"]', cookM: 'plancha', P: 'salmon', valorElegido: 'pescado_plancha', causa: 'cookM plancha + pescado + verdura unica, hoy mal etiquetado pescado_horno' },
]);

// ─── PR2: crudo (regla ESPECIFICA, gana sobre la generica) ────────────
//
// "X en crudo" de proteina cruda simple (no ensalada/bowl/pasta
// compuesta). Oracle ratificado: 3 entradas con plateType origen
// "sopa_crema" (gana sobre la regla generica sopa_crema->ensalada de
// PR1). La entrada 121 (atun, tmpl caliente_clasico, cookM crudo, base
// arroz) es contradictoria sin regla fija -> NO se autoasigna, ver
// CRUDO_REVIEW abajo.
export const CRUDO_CORRECTIONS = Object.freeze([
  { identityKey: '["sopa_crema","atun",null,"tomate","pepino",null,"crudo"]', cookM: 'crudo', P: 'atun', valorElegido: 'crudo', causa: 'proteina cruda simple (gana sobre la generica sopa_crema->ensalada)' },
  { identityKey: '["sopa_crema","huevo",null,"tomate",null,null,"crudo"]', cookM: 'crudo', P: 'huevo', valorElegido: 'crudo', causa: 'proteina cruda simple (gana sobre la generica sopa_crema->ensalada)' },
  { identityKey: '["sopa_crema","atun",null,"tomate","pimientos",null,"crudo"]', cookM: 'crudo', P: 'atun', valorElegido: 'crudo', causa: 'proteina cruda simple (gana sobre la generica sopa_crema->ensalada)' },
]);

// Casos sin regla fija: se documentan, NO se autoasignan. Quedan con su
// plateType actual + reviewPlateType:true (TODO cocinero).
// Vacio: los dos casos que llego a contener (huevo/calabaza/zanahoria y el
// caso 121 atun/arroz/crudo) ya estan resueltos, ver RESOLVED_CORRECTIONS.
export const REVIEW_CORRECTIONS = Object.freeze([]);

// ─── Resoluciones ratificadas por Javi (post-revision humana) ──────────
//
// Casos que estaban en REVIEW_CORRECTIONS o caian en el fallback ambiguo
// de PR1 (deriveSopaCremaGenericPlateType devolviendo null) y que Javi ya
// ha resuelto explicitamente. Gana sobre REVIEW_CORRECTIONS y sobre la
// regla GENERICA de PR1 -- estos identityKeys NUNCA deben volver a marcar
// reviewPlateType.
//
//   - huevo/calabaza/zanahoria (cookM ausente, antes ambiguo en PR1):
//     Javi CONFIRMA sopa_crema (crema) -- ya no es un caso ambiguo.
//   - caso 121, atun/caliente_clasico/crudo/base arroz (antes en
//     REVIEW_CORRECTIONS): Javi RATIFICA plateType="bowl" (poke). El bug de
//     nombre asociado (suggestNameFromTuple ignoraba cookM:"crudo", ver
//     DECISIONS.md D-008) se corrigio por separado.
export const RESOLVED_CORRECTIONS = Object.freeze([
  { identityKey: '["sopa_crema","huevo",null,"calabaza","zanahoria",null,null]', valorElegido: 'sopa_crema', causa: 'resuelto por Javi: confirma sopa_crema (crema), cookM ausente ya no es ambiguo' },
  { identityKey: '["caliente_clasico","atun","arroz","tomate",null,"limon_hierbas","crudo"]', valorElegido: 'bowl', causa: 'resuelto por Javi: poke, plateType=bowl (antes contradictorio en REVIEW_CORRECTIONS)' },
]);

const PESCADO_PLANCHA_BY_KEY = new Map(PESCADO_PLANCHA_CORRECTIONS.map((e) => [e.identityKey, e]));
const CRUDO_BY_KEY = new Map(CRUDO_CORRECTIONS.map((e) => [e.identityKey, e]));
const REVIEW_BY_KEY = new Map(REVIEW_CORRECTIONS.map((e) => [e.identityKey, e]));
const RESOLVED_BY_KEY = new Map(RESOLVED_CORRECTIONS.map((e) => [e.identityKey, e]));

/**
 * Deriva el plateType corregido para un combo con plateType "sopa_crema",
 * segun la regla GENERICA cookM+proteina de PR1. Devuelve null si el
 * combo no aplica (plateType distinto de "sopa_crema") o si cookM es
 * null/ausente (caso ambiguo, sin regla).
 * @param {{plateType?: string, P?: string, cookM?: string}} combo
 * @returns {string|null}
 */
function deriveSopaCremaGenericPlateType(combo) {
  if (combo.plateType !== 'sopa_crema') return null;
  if (combo.cookM === 'plancha') return combo.P === 'huevo' ? 'huevo_plancha' : 'plancha_verdura';
  if (combo.cookM === 'crudo') return 'ensalada';
  if (combo.cookM === 'guisado') return 'guiso';
  return null; // null/ausente: sin regla, caso ambiguo
}

/**
 * Aplica la correccion de plateType a un combo, sin mutarlo. Evalua,
 * en orden de PRECEDENCIA (especifica antes que generica):
 *   0. RESOLVED_CORRECTIONS (por identityKey) -> plateType ratificado por
 *      Javi, SIN reviewPlateType (decision humana final, maxima precedencia)
 *   1. PESCADO_PLANCHA_CORRECTIONS (por identityKey) -> pescado_plancha
 *   2. CRUDO_CORRECTIONS (por identityKey) -> crudo
 *   3. REVIEW_CORRECTIONS (por identityKey) -> reviewPlateType:true,
 *      plateType SIN cambiar
 *   4. Regla GENERICA de PR1 (deriveSopaCremaGenericPlateType, solo si
 *      plateType === "sopa_crema") -> plateType corregido, o
 *      reviewPlateType:true si cookM es ambiguo
 *   5. Si nada aplica, el combo se devuelve intacto (misma referencia)
 * @param {object} combo
 * @returns {object}
 */
export function applyPlateTypeCorrections(combo) {
  const key = comboIdentityKey(combo);

  const resuelto = RESOLVED_BY_KEY.get(key);
  if (resuelto) return { ...combo, plateType: resuelto.valorElegido };

  const pescadoPlancha = PESCADO_PLANCHA_BY_KEY.get(key);
  if (pescadoPlancha) return { ...combo, plateType: pescadoPlancha.valorElegido };

  const crudo = CRUDO_BY_KEY.get(key);
  if (crudo) return { ...combo, plateType: crudo.valorElegido };

  const review = REVIEW_BY_KEY.get(key);
  if (review) return { ...combo, reviewPlateType: true };

  if (combo.plateType !== 'sopa_crema') return combo;

  const corregidoGenerico = deriveSopaCremaGenericPlateType(combo);
  if (corregidoGenerico === null) {
    return { ...combo, reviewPlateType: true };
  }
  return { ...combo, plateType: corregidoGenerico };
}

/**
 * Aplica applyPlateTypeCorrections a cada combo de un pool (array).
 * @param {object[]} pool
 * @returns {object[]}
 */
export function applyPlateTypeCorrectionsToPool(pool) {
  return pool.map(applyPlateTypeCorrections);
}

export { comboIdentityKey };
