// Resolver de composicion — Fase 4, Componente P2a (infraestructura
// composicional). Decision D-021 (DECISIONS.md): el schema de Dish
// (schema.js) NO crece. La composicion es una VISTA DERIVADA calculada
// en carga sobre la salida de loadCatalog(), nunca escrita de vuelta a
// dishes.json — este modulo solo LEE, no muta el catalogo.
//
// Fuentes de datos declaradas (data-only; JAMAS importa buildPlan.js,
// regla de aislamiento de CLAUDE.md):
//   - dish.id                    -> tupla {tmpl,P,C,V,V2,S,cookM} de los
//                                    178 platos de origen scaffold (el id
//                                    ES el JSON de comboIdentityKey).
//   - src/data/FREEFORM_COMBOS.js -> join por identity.id, los 63 platos
//                                    de origen freeform.
//   - legacyCombos.data.js        -> density, join por identidad, los 178
//                                    de origen scaffold.
//
// Contrato de vista: EL MISMO shape para los 241 platos, independiente
// del origen (scaffold/freeform) — ver CLAUDE.md, D-021. La
// implementacion interna tiene dos mecanismos (tupla vs FREEFORM_COMBOS)
// pero el shape de salida es indistinguible para el consumidor salvo por
// el campo informativo "origen" y la presencia/ausencia de "tupla".
//
// UnresolvableOriginError (D-024, F4-P2b-ii, añadido sin cambio de
// semantica): clase nombrada para el UNICO caso de origen indeterminado
// (ni tupla scaffold ni entrada freeform) -- antes un Error generico. El
// mensaje y la condicion de lanzamiento no cambian; el unico cambio es
// que un consumidor puede distinguir este caso por TIPO (instanceof) en
// vez de por texto del mensaje. Todo OTRO fallo del resolver (join de
// density, P_TO_PROTEINTYPE incompleto, mapeo de energyDensity, etc.)
// sigue siendo Error generico -- indican un bug real de catalogo, no un
// caso a distinguir por un consumidor tolerante.

import { FREEFORM_COMBOS } from '../../data/FREEFORM_COMBOS.js';
import { LUNCH_COMBOS_RAW, DINNER_COMBOS_RAW, TRAINING_DINNERS_RAW } from './legacyCombos.data.js';
import { groupCombosByIdentity } from './identity.js';

/** Vocabulario cerrado de proteinType (8 valores). */
export const PROTEIN_TYPES = Object.freeze([
  'pescado', 'marisco', 'legumbre', 'ave', 'carne', 'huevo', 'cereal', 'vegetal',
]);

// Tabla canonica NUEVA de engine2 (D-021): NO es copia paritaria del
// motor viejo (el legacy usa otra taxonomia, CULINARY_FAMILY, con otro
// proposito). "carne" agrupa vacuno+cerdo deliberadamente. El veto de
// cerdo NO opera sobre esta capa: opera sobre claveP (la clave P cruda,
// ver resolveDishComposition) — el resolver expone ambas capas por
// separado para que P2b elija la que corresponda.
export const P_TO_PROTEINTYPE = Object.freeze({
  pollo: 'ave',
  pavo: 'ave',
  conejo: 'carne',
  ternera: 'carne',
  cerdo: 'carne',
  salmon: 'pescado',
  merluza: 'pescado',
  bacalao: 'pescado',
  dorada: 'pescado',
  sardinas: 'pescado',
  atun: 'pescado',
  gambas: 'marisco',
  calamares: 'marisco',
  huevo: 'huevo',
  lentejas: 'legumbre',
  garbanzos: 'legumbre',
  alubias: 'legumbre',
});

// Normalizacion LEXICA (freeform declara low/medium/high; el vocabulario
// de la vista es baja/media/alta). Cambia vocabulario, no significado.
const ENERGY_DENSITY_LEXICAL = Object.freeze({ low: 'baja', medium: 'media', high: 'alta' });

/** Ver banner del modulo (D-024): unico lanzado cuando dish.id no es tupla scaffold ni tiene entrada freeform. */
export class UnresolvableOriginError extends Error {}

const freeformById = new Map(FREEFORM_COMBOS.map((combo) => [combo.identity.id, combo]));

// Mismo mecanismo de join que CP2 (anchors.js): agrupar por
// comboIdentityKey y usar esa clave como indice. dish.id de un plato
// scaffold ES esa misma clave por construccion (assemble.js), asi que
// el join es una lectura directa de mapa, no una busqueda difusa.
const legacyByIdentity = groupCombosByIdentity([
  ...LUNCH_COMBOS_RAW,
  ...DINNER_COMBOS_RAW,
  ...TRAINING_DINNERS_RAW,
]);

function deepFreeze(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze(value[key]);
  }
  return value;
}

/**
 * Intenta leer dish.id como tupla scaffold (JSON de comboIdentityKey).
 * @param {string} id
 * @returns {{tmpl, P, C, V, V2, S, cookM}|null} null si no es una tupla scaffold valida
 */
function parseScaffoldTuple(id) {
  let parsed;
  try {
    parsed = JSON.parse(id);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length !== 7) return null;
  const [tmpl, P, C, V, V2, S, cookM] = parsed;
  return { tmpl, P, C, V, V2, S, cookM };
}

function assertProteinTypeVocabulary(proteinType, dishId) {
  if (!PROTEIN_TYPES.includes(proteinType)) {
    throw new Error(
      `resolveDishComposition: plato "${dishId}" resuelve proteinType="${proteinType}", ` +
      `fuera del vocabulario cerrado (${PROTEIN_TYPES.join(', ')}).`
    );
  }
}

function resolveScaffoldDensity(dishId) {
  const instances = legacyByIdentity.get(dishId);
  if (!instances || instances.length === 0) {
    throw new Error(
      `resolveDishComposition: plato scaffold "${dishId}" no tiene instancia en legacyCombos.data.js (join de density fallido).`
    );
  }
  return instances[0].density;
}

function resolveFreeformDensity(combo, dishId) {
  const lexical = combo.nutrition?.energyDensity;
  const density = ENERGY_DENSITY_LEXICAL[lexical];
  if (!density) {
    throw new Error(
      `resolveDishComposition: plato freeform "${dishId}" tiene energyDensity="${lexical}", ` +
      `fuera del mapeo lexico (${Object.keys(ENERGY_DENSITY_LEXICAL).join(', ')}).`
    );
  }
  return density;
}

/**
 * Resuelve la vista de composicion de un plato de origen scaffold, dada
 * su tupla ya parseada. Pura: no lee dish.id, no hace I/O propio salvo el
 * join de density contra legacyCombos.data.js (modulo, no disco).
 * @param {{tmpl, P, C, V, V2, S, cookM}} tupla
 * @param {string} dishId solo para mensajes de error
 * @returns {object} vista, congelada en profundidad
 */
export function resolveScaffoldComposition(tupla, dishId) {
  const claveP = tupla.P;
  const proteinType = P_TO_PROTEINTYPE[claveP];
  if (!proteinType) {
    throw new Error(
      `resolveDishComposition: plato "${dishId}" tiene P="${claveP}" sin entrada en P_TO_PROTEINTYPE.`
    );
  }
  assertProteinTypeVocabulary(proteinType, dishId);

  const vista = {
    origen: 'scaffold',
    tupla,
    claveP,
    proteinType,
    containsGluten: { estado: 'desconocida' },
    containsLactosa: { estado: 'desconocida' },
    density: resolveScaffoldDensity(dishId),
    verdura: { estado: 'conocida', ejes: [tupla.V, tupla.V2].filter((v) => v !== null) },
  };
  return deepFreeze(vista);
}

/**
 * Resuelve la vista de composicion de un plato de origen freeform, dado
 * su combo de FREEFORM_COMBOS.js ya localizado. Pura: recibe el combo
 * como dato, no busca en el modulo de datos.
 * @param {object} combo entrada de FREEFORM_COMBOS.js
 * @param {string} dishId solo para mensajes de error
 * @returns {object} vista, congelada en profundidad
 */
export function resolveFreeformComposition(combo, dishId) {
  assertProteinTypeVocabulary(combo.identity.proteinType, dishId);

  const vista = {
    origen: 'freeform',
    claveP: combo.identity.protein,
    proteinType: combo.identity.proteinType,
    containsGluten: { estado: 'conocida', valor: combo.identity.containsGluten },
    containsLactosa: { estado: 'conocida', valor: combo.identity.containsLactosa },
    density: resolveFreeformDensity(combo, dishId),
    verdura: { estado: 'desconocida' },
  };
  return deepFreeze(vista);
}

/**
 * Resuelve la vista de composicion de un plato individual, localizando
 * su fuente (tupla scaffold o FREEFORM_COMBOS) por dish.id. Mismo shape
 * de salida para scaffold y freeform (ver banner del modulo).
 * @param {{id: string}} dish plato tal y como lo devuelve loadCatalog()
 * @returns {object} vista de composicion, congelada en profundidad
 */
export function resolveDishComposition(dish) {
  const tupla = parseScaffoldTuple(dish.id);
  if (tupla) return resolveScaffoldComposition(tupla, dish.id);

  const combo = freeformById.get(dish.id);
  if (!combo) {
    throw new UnresolvableOriginError(
      `resolveDishComposition: plato "${dish.id}" no es una tupla scaffold y no tiene entrada ` +
      'en FREEFORM_COMBOS (origen indeterminado).'
    );
  }
  return resolveFreeformComposition(combo, dish.id);
}

/**
 * Resuelve la vista de composicion de un catalogo completo (p. ej. la
 * salida de loadCatalog()). Orden estable: la vista en la posicion i
 * corresponde al plato en la posicion i de dishes.
 * @param {ReadonlyArray<{id: string}>} dishes
 * @returns {object[]}
 */
export function resolveCatalogComposition(dishes) {
  return dishes.map((dish) => resolveDishComposition(dish));
}

/**
 * Lectura segura de los ejes de verdura de una vista. LANZA sobre
 * estado "desconocida" — nunca devuelve [] (la ausencia de contribucion
 * refleja ausencia de informacion, no ausencia de verdura).
 * @param {object} vista
 * @returns {string[]}
 */
export function ejesVerdura(vista) {
  if (vista.verdura.estado !== 'conocida') {
    throw new Error(
      'ejesVerdura: estado "desconocida" — no hay ejes que leer (freeform no declara verdura ' +
      'estructuralmente; desconocida no equivale a sin verdura).'
    );
  }
  return vista.verdura.ejes;
}
