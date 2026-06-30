// Fase 2, Paso B.2, Commit 1 — generador de scaffold de Platos legacy.
// Vive en scripts/ (fuera de engine2/), importa de src/engine2/dishes/.
// SOLO legacy (LUNCH/DINNER/TRAINING). FREEFORM queda fuera (Paso C).
//
// REGLA DE COLISION E IDENTIDAD (version corregida tras verificacion --
// sustituye la regla original del enunciado, que agrupaba el universo
// fusionado y comparaba objetos completos; eso producia 5 falsos
// positivos de "divergencia" en duales cross-pool, porque LUNCH/DINNER/
// TRAINING tienen esquemas con campos editoriales DISTINTOS por diseño
// (familiar/facil en LUNCH, saciante en DINNER/TRAINING). La pertenencia
// a un pool no es identidad ni divergencia: es el `momento` (CP1, set).
//
//   IDENTIDAD: tmpl, P, C, V, V2, S, cookM (identity.js:34-40, los unicos
//   campos que lee comboIdentityKey).
//
//   COMPARTIDOS: interseccion de los campos no-identidad presentes en los
//   3 origenes, calculada en runtime (NO hardcodeada) — ver
//   computeSharedFields(). Verificado: ['plateType','density'].
//
//   DE POOL (no entran en la comparacion de divergencia): el resto
//   (familiar/facil en LUNCH; saciante en DINNER/TRAINING; slot/emoji/
//   title en TRAINING).
//
// Clasificacion por grupo de identidad (sobre el universo fusionado):
//   1. INTRA-ORIGEN: si el mismo origen aporta >1 miembro al grupo,
//      deben ser deepEqual (objeto completo) entre si, o es DIVERGENCIA
//      REAL -> ABORTA (replica la politica original de Paso B.1, intacta
//      aqui).
//   2. INTER-ORIGEN: si distintos origenes aportan al grupo, solo se
//      comparan los campos COMPARTIDOS. Si concuerdan -> se UNIFICAN en
//      un solo Dish con momento = set de los pools de procedencia. Si
//      algun COMPARTIDO difiere -> DIVERGENCIA REAL -> ABORTA.
//
// Conservacion: entradas_crudas == scaffold.length + nColapsosExactos +
// nUnificadasCrossPool (todo computado en runtime, ver generateScaffold()).

import { comboIdentityKey } from '../../src/engine2/dishes/identity.js';
import { assembleDish } from '../../src/engine2/dishes/assemble.js';
import { ANCHORS } from '../../src/engine2/dishes/anchors.js';
import { applyPlateTypeCorrectionsToPool } from '../../src/engine2/dishes/legacyCombos.plateTypeCorrections.js';
import {
  LUNCH_COMBOS_RAW,
  DINNER_COMBOS_RAW,
  TRAINING_DINNERS_RAW,
} from '../../src/engine2/dishes/legacyCombos.data.js';

export const IDENTITY_FIELDS = Object.freeze(['tmpl', 'P', 'C', 'V', 'V2', 'S', 'cookM']);

export const POOL_NAME = Object.freeze({
  LUNCH: 'LUNCH_COMBOS',
  DINNER: 'DINNER_COMBOS',
  TRAINING: 'TRAINING_DINNERS',
});

/**
 * Campos compartidos: interseccion de las claves no-identidad presentes
 * en los 3 origenes legacy. Calculado en runtime, no hardcodeado.
 * @param {{LUNCH_COMBOS: object[], DINNER_COMBOS: object[], TRAINING_DINNERS: object[]}} pools
 * @returns {string[]}
 */
export function computeSharedFields(pools) {
  function nonIdentityKeys(combos) {
    const s = new Set();
    for (const combo of combos) {
      for (const key of Object.keys(combo)) {
        if (!IDENTITY_FIELDS.includes(key)) s.add(key);
      }
    }
    return s;
  }
  const [first, ...rest] = Object.values(pools).map(nonIdentityKeys);
  return [...first].filter((key) => rest.every((s) => s.has(key))).sort();
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Agrupa todos los combos del universo legacy (fusionado) por
 * comboIdentityKey, anotando el origen de cada miembro.
 * @param {{LUNCH_COMBOS: object[], DINNER_COMBOS: object[], TRAINING_DINNERS: object[]}} pools
 * @returns {Map<string, {combo: object, origen: string}[]>}
 */
export function groupUniverseByIdentity(pools) {
  const groups = new Map();
  for (const [origen, combos] of Object.entries(pools)) {
    for (const combo of combos) {
      const key = comboIdentityKey(combo);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ combo, origen });
    }
  }
  return groups;
}

/**
 * Clasifica un grupo de identidad. Devuelve, si NO es divergente, el
 * poolMembership (origenes distintos, orden estable) y el combo
 * representativo a pasar a assembleDish (cualquiera vale: los campos que
 * derive.js usa -- tmpl/cookM/plateType -- estan garantizados iguales
 * por identidad + por la comparacion de COMPARTIDOS).
 * @param {{combo: object, origen: string}[]} members
 * @param {string[]} sharedFields
 * @returns {{ divergente: false, poolMembership: string[], representativeCombo: object, nColapsoExacto: boolean, trainingMetadata: object|null } | { divergente: true, motivo: string, identityKeyContext?: string, diff: object }}
 */
export function classifyIdentityGroup(members, sharedFields) {
  const byOrigen = new Map();
  for (const m of members) {
    if (!byOrigen.has(m.origen)) byOrigen.set(m.origen, []);
    byOrigen.get(m.origen).push(m.combo);
  }

  // 1. Intra-origen: deben ser deepEqual entre si.
  for (const [origen, combos] of byOrigen) {
    if (combos.length < 2) continue;
    const allEqual = combos.every((c) => deepEqual(c, combos[0]));
    if (!allEqual) {
      return {
        divergente: true,
        motivo: `intra-origen (${origen}): ${combos.length} miembros, no son deepEqual entre si`,
        diff: { origen, combos },
      };
    }
  }

  const origenes = [...byOrigen.keys()];

  // 2. Inter-origen: solo se comparan los campos COMPARTIDOS.
  if (origenes.length > 1) {
    for (const field of sharedFields) {
      const values = new Set(members.map((m) => m.combo[field]));
      if (values.size > 1) {
        return {
          divergente: true,
          motivo: `inter-origen, campo compartido "${field}" no concuerda`,
          diff: { field, valoresPorOrigen: members.map((m) => ({ origen: m.origen, valor: m.combo[field] })) },
        };
      }
    }
  }

  const nColapsoExacto = origenes.length === 1 && members.length > 1;

  // Metadata de TRAINING_DINNERS (slot/emoji/title) diferida al
  // ensamblador de presentacion (no es campo de Dish ni editorial) — ver
  // banner de cabecera. Se reporta, no se descarta en silencio.
  const trainingMember = members.find((m) => m.origen === POOL_NAME.TRAINING);
  const trainingMetadata = trainingMember
    ? { slot: trainingMember.combo.slot, emoji: trainingMember.combo.emoji, title: trainingMember.combo.title }
    : null;

  return {
    divergente: false,
    poolMembership: origenes,
    representativeCombo: members[0].combo,
    nColapsoExacto,
    trainingMetadata,
  };
}

const EDITORIAL_TODO = Object.freeze({
  rol: 'TODO',
  batchable: 'TODO',
  leftoverQuality: 'TODO',
  shelfLifeDays: 'TODO',
  energiaCocina: 'TODO',
  nombre: 'TODO',
  // Columnas de tags canonicos (curaduria, checkpoint plateType-enum).
  // ANCHORS (CP2) no las fija para ningun plato: quedan TODO siempre,
  // incluso para los 6 platos ya anotados.
  proteinType: 'TODO',
  digestiveLoad: 'TODO',
  satietyScore: 'TODO',
  energyDensity: 'TODO',
  containsGluten: 'TODO',
  containsLactosa: 'TODO',
  glutenFreeAdaptable: 'TODO',
  lightMealCompatible: 'TODO',
  avoidInAggressiveCut: 'TODO',
  familiar: 'TODO',
  // Columna nueva congelable: si/no/pre-cocinado.
  congelable: 'TODO',
});

/**
 * Arrastra de ANCHORS (CP2) solo los campos que CP2 realmente fijo
 * (verificado contra anchors.js:48-115: identityKey, rol, batchable,
 * leftoverQuality, shelfLifeDays, energiaCocina — "nombre" NO esta entre
 * ellos, queda en TODO incluso para anclas).
 * @param {string} identityKey
 * @returns {object} editorial parcial (TODO salvo lo que CP2 fijo)
 */
export function editorialFromAnchorOrTodo(identityKey) {
  const anchor = ANCHORS.find((a) => a.identityKey === identityKey);
  if (!anchor) return { ...EDITORIAL_TODO };
  return {
    ...EDITORIAL_TODO,
    rol: anchor.rol,
    batchable: anchor.batchable,
    leftoverQuality: anchor.leftoverQuality,
    shelfLifeDays: anchor.shelfLifeDays,
    energiaCocina: anchor.energiaCocina,
    // nombre: CP2 no lo fijo (verificado), queda "TODO".
  };
}

/**
 * Genera el scaffold completo. Aborta (sin generar salida parcial) si
 * encuentra cualquier grupo divergente.
 * @returns {{ ok: true, dishes: object[], report: object } | { ok: false, divergences: object[] }}
 */
export function generateScaffold() {
  // Correccion de plateType (cajon sopa_crema, ver
  // legacyCombos.plateTypeCorrections.js) aplicada ANTES de agrupar/derivar:
  // no muta legacyCombos.data.js, no afecta comboIdentityKey (plateType no
  // es campo de identidad).
  const pools = {
    [POOL_NAME.LUNCH]: applyPlateTypeCorrectionsToPool(LUNCH_COMBOS_RAW),
    [POOL_NAME.DINNER]: applyPlateTypeCorrectionsToPool(DINNER_COMBOS_RAW),
    [POOL_NAME.TRAINING]: applyPlateTypeCorrectionsToPool(TRAINING_DINNERS_RAW),
  };

  const totalEntradasCrudas = Object.values(pools).reduce((sum, arr) => sum + arr.length, 0);
  const sharedFields = computeSharedFields(pools);
  const groups = groupUniverseByIdentity(pools);

  const divergences = [];
  const dishes = [];
  let nColapsosExactos = 0;
  let nUnificadasCrossPool = 0;
  const deferredTrainingPresentation = [];

  for (const [identityKey, members] of groups) {
    const classification = classifyIdentityGroup(members, sharedFields);
    if (classification.divergente) {
      divergences.push({ identityKey, ...classification });
      continue;
    }

    if (classification.nColapsoExacto) nColapsosExactos++;
    if (classification.poolMembership.length > 1) nUnificadasCrossPool++;
    if (classification.trainingMetadata) {
      deferredTrainingPresentation.push({ identityKey, ...classification.trainingMetadata });
    }

    const editorial = editorialFromAnchorOrTodo(identityKey);
    const dish = assembleDish(classification.representativeCombo, classification.poolMembership, editorial);
    dishes.push(dish);
  }

  if (divergences.length > 0) {
    return { ok: false, divergences };
  }

  return {
    ok: true,
    dishes,
    report: {
      totalEntradasCrudas,
      scaffoldLength: dishes.length,
      nColapsosExactos,
      nUnificadasCrossPool,
      sharedFields,
      deferredTrainingPresentation,
    },
  };
}
