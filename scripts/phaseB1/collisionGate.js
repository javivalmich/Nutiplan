// Fase 2, Paso B.1, Parte 1 — gate de colision sobre el universo completo
// de entrada (LUNCH_COMBOS_RAW, DINNER_COMBOS_RAW, TRAINING_DINNERS_RAW,
// FREEFORM_COMBOS). Vive fuera de src/engine2/ (importa de ahi, no al
// reves). Funciones puras: ningun I/O aqui (el I/O de snapshots vive en
// frequencyCount.js).
//
// Decision editorial fijada por Javi (Fase 2, Paso B.1):
//   - NO normalizar ni mutar los combos de origen.
//   - La comparacion colapsable-vs-divergente usa la UNION de claves de
//     los miembros del grupo, con la MISMA equivalencia que usa
//     comboIdentityKey (identity.js): ausente === undefined === "" === null
//     se consideran el mismo valor para esta comparacion.
//   - Cualquier diferencia de valor real (tras esa normalizacion) ->
//     DIVERGENTE.
//   - FREEFORM es un espacio de identidad aparte (combo.identity.id, NO
//     comboIdentityKey): cualquier duplicado de identity.id es SIEMPRE
//     DIVERGENTE, sin comparacion estructural (regla especial del gate,
//     no un hallazgo informativo).

function normalizeFieldValue(value) {
  if (value === undefined || value === null || value === '') return null;
  return value;
}

/**
 * @param {object[]} members
 * @returns {string[]} claves ordenadas, union de Object.keys() de todos los miembros
 */
export function unionKeys(members) {
  const keys = new Set();
  for (const member of members) {
    for (const key of Object.keys(member)) keys.add(key);
  }
  return [...keys].sort();
}

/**
 * Diff campo a campo de un grupo de miembros con la misma identityKey,
 * usando la union de claves y la equivalencia ausente===undefined===""===null.
 * @param {object[]} members
 * @returns {Record<string, any[]>} solo los campos con valores normalizados distintos; valores SIN normalizar (para reporte fiel)
 */
export function diffGroup(members) {
  const keys = unionKeys(members);
  const diff = {};
  for (const key of keys) {
    const normalized = members.map((m) => normalizeFieldValue(m[key]));
    const distinctNormalized = new Set(normalized);
    if (distinctNormalized.size > 1) {
      diff[key] = members.map((m) => m[key]);
    }
  }
  return diff;
}

/**
 * @param {object[]} members
 * @returns {'COLAPSABLE'|'DIVERGENTE'}
 */
export function classifyGroup(members) {
  return Object.keys(diffGroup(members)).length === 0 ? 'COLAPSABLE' : 'DIVERGENTE';
}

/**
 * Agrupa combos por su clave de identidad (insertion-order preservado).
 * @param {object[]} combos
 * @param {(combo: object) => string} keyFn
 * @returns {Map<string, object[]>}
 */
export function groupByIdentityKey(combos, keyFn) {
  const groups = new Map();
  for (const combo of combos) {
    const key = keyFn(combo);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(combo);
  }
  return groups;
}

/**
 * Reporta, por origen, las variantes de conjunto de claves top-level
 * observadas (auditoria de forma previa, antes de comparar nada).
 * @param {object[]} combos
 * @returns {{variant: string[], count: number}[]} variantes con su conteo
 */
export function auditKeyShapeVariants(combos) {
  const variants = new Map();
  for (const combo of combos) {
    const keys = JSON.stringify(Object.keys(combo).sort());
    variants.set(keys, (variants.get(keys) || 0) + 1);
  }
  return [...variants.entries()].map(([variant, count]) => ({
    variant: JSON.parse(variant),
    count,
  }));
}

/**
 * Gate de colision sobre el universo completo. Funcion pura: recibe los
 * 4 arrays de origen ya cargados por el llamador.
 * @param {{
 *   LUNCH_COMBOS_RAW: object[], DINNER_COMBOS_RAW: object[],
 *   TRAINING_DINNERS_RAW: object[], FREEFORM_COMBOS: object[],
 *   comboIdentityKey: (combo: object) => string,
 * }} input
 * @returns {{aborted: boolean, perOrigin: Record<string, object>, divergences: object[]}}
 */
export function runCollisionGate({
  LUNCH_COMBOS_RAW,
  DINNER_COMBOS_RAW,
  TRAINING_DINNERS_RAW,
  FREEFORM_COMBOS,
  comboIdentityKey,
}) {
  const origins = {
    LUNCH_RAW: { combos: LUNCH_COMBOS_RAW, keyFn: comboIdentityKey, isFreeform: false },
    DINNER_RAW: { combos: DINNER_COMBOS_RAW, keyFn: comboIdentityKey, isFreeform: false },
    TRAINING_RAW: { combos: TRAINING_DINNERS_RAW, keyFn: comboIdentityKey, isFreeform: false },
    FREEFORM: { combos: FREEFORM_COMBOS, keyFn: (c) => c.identity.id, isFreeform: true },
  };

  const perOrigin = {};
  const divergences = [];

  for (const [originName, { combos, keyFn, isFreeform }] of Object.entries(origins)) {
    const groups = groupByIdentityKey(combos, keyFn);
    let nGruposColapsables = 0;
    let nGruposDivergentes = 0;

    for (const [key, members] of groups) {
      if (members.length < 2) continue;

      if (isFreeform) {
        // Regla especial (Parte 1.7): duplicado de identity.id es SIEMPRE
        // divergente, no se compara estructura.
        nGruposDivergentes++;
        divergences.push({
          origen: originName,
          identityKey: key,
          nMiembros: members.length,
          diff: { 'identity.id': members.map((m) => m.identity.id) },
          motivo: 'duplicado de identity.id en FREEFORM (regla especial del gate)',
        });
        continue;
      }

      const diff = diffGroup(members);
      if (Object.keys(diff).length === 0) {
        nGruposColapsables++;
      } else {
        nGruposDivergentes++;
        divergences.push({ origen: originName, identityKey: key, nMiembros: members.length, diff });
      }
    }

    perOrigin[originName] = {
      nEntradas: combos.length,
      nClavesUnicas: groups.size,
      nGruposColapsables,
      nGruposDivergentes,
    };
  }

  return { aborted: divergences.length > 0, perOrigin, divergences };
}
