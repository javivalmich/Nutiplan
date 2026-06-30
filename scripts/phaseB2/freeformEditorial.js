// Fase 2, checkpoint enum-24, Paso B.3 — filas editoriales para el xlsx
// del cocinero a partir de FREEFORM_COMBOS (64 entradas). NO se integran
// en el scaffold tuplar (dishes.scaffold.json): cada entrada freeform ya
// trae su propio discriminador estable (identity.id), no pasa por
// comboIdentityKey ni se mezcla con la identidad tupla (tmpl/P/C/V/V2/S/
// cookM). La integracion estructural (slug<->tupla) sigue diferida al
// Paso C.
//
// Mapeo de plateType ratificado por Javi: el plateType LIBRE de cada
// freeform (identity.plateType, vocabulario propio del dataset freeform,
// fuera del enum cerrado de schema.js) se traduce al plateType CANONICO
// del enum de 24 mediante esta tabla fija. Cualquier plateType libre que
// no aparezca en la tabla -> NO se inventa: la fila queda con su
// plateType original + reviewPlateType:true (TODO cocinero).

import { FREEFORM_COMBOS } from '../../src/data/FREEFORM_COMBOS.js';

export const FREEFORM_PLATE_TYPE_MAP = Object.freeze({
  // arroz_plato
  paella: 'arroz_plato', fideua: 'arroz_plato', risotto: 'arroz_plato',
  // pasta
  pasta_carbonara: 'pasta', pasta_norma: 'pasta', gnocchi: 'pasta',
  // masa
  pizza: 'masa', empanada: 'masa',
  // gratinado
  moussaka: 'gratinado',
  // guiso
  cocido_legumbre: 'guiso', guiso_legumbre: 'guiso', guiso_verduras: 'guiso', marmitako: 'guiso', curry: 'guiso',
  // sopa_crema
  caldo_grelos: 'sopa_crema', caldo_repollo: 'sopa_crema', caldo_ligero: 'sopa_crema',
  sopa_castellana: 'sopa_crema', sopa_miso: 'sopa_crema', ramen: 'sopa_crema',
  sopa_coco: 'sopa_crema', crema_verduras: 'sopa_crema', sopa_fria: 'sopa_crema',
  // plancha_verdura
  menestra: 'plancha_verdura', esparragos_plato: 'plancha_verdura',
  // pescado_plancha
  sardinas_plancha: 'pescado_plancha',
  // en_salsa
  mejillones_salsa: 'en_salsa', marisco_vapor: 'en_salsa', pollo_ajillo: 'en_salsa', teriyaki: 'en_salsa',
  // salteado_wok (bibimbap NO entra: dudoso, ver REVISION explicita abajo)
  wok: 'salteado_wok', pad_thai: 'salteado_wok',
  // bocado_mano
  tacos: 'bocado_mano', burrito: 'bocado_mano', wrap: 'bocado_mano', quesadilla: 'bocado_mano',
  bao: 'bocado_mano', pita_rellena: 'bocado_mano', hamburguesa: 'bocado_mano',
  // airfryer
  airfryer_pollo: 'airfryer', airfryer_pescado: 'airfryer', airfryer_verduras: 'airfryer',
  croquetas_af: 'airfryer', nuggets_af: 'airfryer',
  // ensalada
  ensalada: 'ensalada', ensalada_pasta: 'ensalada', ensalada_legumbre: 'ensalada', ensaladilla: 'ensalada',
  // bowl
  bowl: 'bowl', bowl_salmon: 'bowl', bol_fruta: 'bowl', hummus_bowl: 'bowl', falafel_bowl: 'bowl',
  // tortilla
  tortilla: 'tortilla', shakshuka: 'tortilla', huevos_rellenos: 'tortilla',
  // crudo
  carpaccio: 'crudo', ceviche: 'crudo',
});

// Dudoso por nombre, ratificado explicitamente como NO autoasignado
// aunque su plateType libre ("bibimbap") podria sugerir salteado_wok.
const REVISION_EXPLICITA = Object.freeze(['bibimbap']);

const EDITORIAL_TODO_FREEFORM = Object.freeze({
  rol: 'TODO',
  batchable: 'TODO',
  leftoverQuality: 'TODO',
  shelfLifeDays: 'TODO',
  congelable: 'TODO',
});

/**
 * Construye las filas editoriales del xlsx para las 64 entradas
 * freeform. Cada fila usa identity.id como discriminador (NO
 * comboIdentityKey: las entradas freeform no tienen la tupla tmpl/P/C/
 * V/V2/S/cookM). Vuelca los tags ya existentes del dataset freeform a
 * las columnas canonicas; congelable queda TODO (no existe en el
 * dataset freeform de origen).
 * @returns {object[]}
 */
export function buildFreeformEditorialRows() {
  return FREEFORM_COMBOS.map((combo) => {
    const { identity, nutrition, behavior } = combo;
    const plateTypeLibre = identity.plateType;
    const mapeado = REVISION_EXPLICITA.includes(plateTypeLibre) ? undefined : FREEFORM_PLATE_TYPE_MAP[plateTypeLibre];

    const row = {
      id: identity.id,
      nombre: identity.title,
      freeform: true,
      plateTypeLibre,
      plateType: mapeado ?? plateTypeLibre,
      proteinType: identity.proteinType ?? 'TODO',
      digestiveLoad: behavior?.digestiveLoad ?? 'TODO',
      satietyScore: behavior?.satietyScore ?? 'TODO',
      energyDensity: nutrition?.energyDensity ?? 'TODO',
      containsGluten: identity.containsGluten ?? 'TODO',
      containsLactosa: identity.containsLactosa ?? 'TODO',
      glutenFreeAdaptable: identity.glutenFreeAdaptable ?? false,
      lightMealCompatible: behavior?.lightMealCompatible ?? 'TODO',
      avoidInAggressiveCut: behavior?.avoidInAggressiveCut ?? 'TODO',
      familiar: behavior?.familiar ?? 'TODO',
      ...EDITORIAL_TODO_FREEFORM,
    };

    if (mapeado === undefined) {
      row.reviewPlateType = true;
    }

    return row;
  });
}
