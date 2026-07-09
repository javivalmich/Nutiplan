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
//   - fuenteEditorial (D-028 §2, EDITORIAL-S2, opcional, INYECTADA -- este
//                                    modulo NUNCA la carga de disco. Shape
//                                    D-028 §4: {version, confirmed:
//                                    {"<dishId>": {gluten?, lactosa?,
//                                    verdura?: {valor, por, fecha}}}}, la
//                                    misma clave dish.id que assemble.js
//                                    (comboIdentityKey, scaffold) y
//                                    freeformPromote.js (identity.id,
//                                    freeform) ya usan en todo el catalogo
//                                    -- ningun mecanismo de identidad
//                                    nuevo, ninguna reimplementacion.
//
// Contrato de vista: EL MISMO shape para los 241 platos, independiente
// del origen (scaffold/freeform) — ver CLAUDE.md, D-021. La
// implementacion interna tiene dos mecanismos (tupla vs FREEFORM_COMBOS)
// pero el shape de salida es indistinguible para el consumidor salvo por
// el campo informativo "origen" (vista.origen, TOP-LEVEL: 'scaffold'|
// 'freeform') y la presencia/ausencia de "tupla".
//
// CONTRATO DE COMPOSICION gluten/lactosa/verdura (D-028 §2, enmienda a
// D-021, EDITORIAL-S2): cada campo es { origen, valorEfectivo?,
// valorDerivado? } con origen ∈ {'confirmada','derivada','desconocida'} --
// NO confundir con vista.origen de arriba (mismo nombre lexico, objeto
// contractual distinto: uno es scaffold/freeform, el otro es la
// procedencia del DATO de composicion de un eje). valorEfectivo presente
// ⟺ origen !== 'desconocida' (I1). valorDerivado presente solo cuando
// origen='confirmada' Y existia una derivacion que la confirmacion
// sobreescribe (I2) -- por eso NUNCA aparece si el eje era 'desconocida'
// antes de confirmarse. Precedencia: confirmada > derivada > desconocida.
// Sin fuenteEditorial inyectada, ningun campo puede resolver 'confirmada'
// -- comportamiento identico al de antes de D-028 §2 (garantia de
// no-regresion, C2).
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
 * Construye un campo del contrato de composicion D-028 §2:
 * { origen, valorEfectivo?, valorDerivado? }. Nucleo unico compartido por
 * gluten/lactosa/verdura, scaffold/freeform -- la precedencia
 * confirmada > derivada > desconocida se decide UNA vez, aqui, no en cada
 * call-site.
 * @param {*} valorDerivado el valor que la derivacion estructural resuelve
 *   para este eje, o undefined si ese eje no deriva para este origen
 *   (p.ej. gluten en scaffold, verdura en freeform).
 * @param {{valor: *, por: string, fecha: string}|undefined} confirmado
 *   entrada de fuenteEditorial.confirmed[dishId][campo], o undefined si no
 *   hay confirmacion para ese eje.
 * @returns {{origen: string, valorEfectivo?: *, valorDerivado?: *}}
 */
function buildCampoComposicion(valorDerivado, confirmado) {
  const hayDerivacion = valorDerivado !== undefined;
  if (confirmado) {
    const campo = { origen: 'confirmada', valorEfectivo: confirmado.valor };
    if (hayDerivacion) campo.valorDerivado = valorDerivado;
    return campo;
  }
  if (hayDerivacion) return { origen: 'derivada', valorEfectivo: valorDerivado };
  return { origen: 'desconocida' };
}

/**
 * Resuelve la vista de composicion de un plato de origen scaffold, dada
 * su tupla ya parseada. Pura salvo el join de density contra
 * legacyCombos.data.js (modulo, no disco) y la lectura de fuenteEditorial
 * (objeto ya en memoria, nunca disco -- ver banner del modulo).
 * @param {{tmpl, P, C, V, V2, S, cookM}} tupla
 * @param {string} dishId clave de identidad (dish.id) -- para mensajes de
 *   error y para indexar fuenteEditorial.confirmed
 * @param {{version: number, confirmed: object}} [fuenteEditorial]
 * @returns {object} vista, congelada en profundidad
 */
export function resolveScaffoldComposition(tupla, dishId, fuenteEditorial) {
  const claveP = tupla.P;
  const proteinType = P_TO_PROTEINTYPE[claveP];
  if (!proteinType) {
    throw new Error(
      `resolveDishComposition: plato "${dishId}" tiene P="${claveP}" sin entrada en P_TO_PROTEINTYPE.`
    );
  }
  assertProteinTypeVocabulary(proteinType, dishId);

  const confirmadoPlato = fuenteEditorial?.confirmed?.[dishId];
  const ejesVerduraDerivados = [tupla.V, tupla.V2].filter((v) => v !== null);

  const vista = {
    origen: 'scaffold',
    tupla,
    claveP,
    proteinType,
    containsGluten: buildCampoComposicion(undefined, confirmadoPlato?.gluten),
    containsLactosa: buildCampoComposicion(undefined, confirmadoPlato?.lactosa),
    density: resolveScaffoldDensity(dishId),
    verdura: buildCampoComposicion(ejesVerduraDerivados, confirmadoPlato?.verdura),
  };
  return deepFreeze(vista);
}

/**
 * Resuelve la vista de composicion de un plato de origen freeform, dado
 * su combo de FREEFORM_COMBOS.js ya localizado. Pura salvo la lectura de
 * fuenteEditorial (objeto ya en memoria, nunca disco -- ver banner del
 * modulo).
 * @param {object} combo entrada de FREEFORM_COMBOS.js
 * @param {string} dishId clave de identidad (dish.id) -- para mensajes de
 *   error y para indexar fuenteEditorial.confirmed
 * @param {{version: number, confirmed: object}} [fuenteEditorial]
 * @returns {object} vista, congelada en profundidad
 */
export function resolveFreeformComposition(combo, dishId, fuenteEditorial) {
  assertProteinTypeVocabulary(combo.identity.proteinType, dishId);

  const confirmadoPlato = fuenteEditorial?.confirmed?.[dishId];

  const vista = {
    origen: 'freeform',
    claveP: combo.identity.protein,
    proteinType: combo.identity.proteinType,
    containsGluten: buildCampoComposicion(combo.identity.containsGluten, confirmadoPlato?.gluten),
    containsLactosa: buildCampoComposicion(combo.identity.containsLactosa, confirmadoPlato?.lactosa),
    density: resolveFreeformDensity(combo, dishId),
    verdura: buildCampoComposicion(undefined, confirmadoPlato?.verdura),
  };
  return deepFreeze(vista);
}

/**
 * Resuelve la vista de composicion de un plato individual, localizando
 * su fuente (tupla scaffold o FREEFORM_COMBOS) por dish.id. Mismo shape
 * de salida para scaffold y freeform (ver banner del modulo).
 *
 * fuenteEditorial (D-028 §2, EDITORIAL-S2) es OPCIONAL e INYECTADA: sin
 * ella, resultado identico al de antes de D-028 §2 (C2, no-regresion).
 * Este modulo NUNCA la carga de disco -- ver banner. La clave de
 * fuenteEditorial.confirmed es dish.id, la MISMA identidad que assemble.js
 * (comboIdentityKey, scaffold) y freeformPromote.js (identity.id,
 * freeform) ya asignan en todo el catalogo -- ningun mecanismo nuevo.
 * @param {{id: string}} dish plato tal y como lo devuelve loadCatalog()
 * @param {{fuenteEditorial?: {version: number, confirmed: object}}} [opts]
 * @returns {object} vista de composicion, congelada en profundidad
 */
export function resolveDishComposition(dish, { fuenteEditorial } = {}) {
  const tupla = parseScaffoldTuple(dish.id);
  if (tupla) return resolveScaffoldComposition(tupla, dish.id, fuenteEditorial);

  const combo = freeformById.get(dish.id);
  if (!combo) {
    throw new UnresolvableOriginError(
      `resolveDishComposition: plato "${dish.id}" no es una tupla scaffold y no tiene entrada ` +
      'en FREEFORM_COMBOS (origen indeterminado).'
    );
  }
  return resolveFreeformComposition(combo, dish.id, fuenteEditorial);
}

/**
 * Resuelve la vista de composicion de un catalogo completo (p. ej. la
 * salida de loadCatalog()). Orden estable: la vista en la posicion i
 * corresponde al plato en la posicion i de dishes.
 * @param {ReadonlyArray<{id: string}>} dishes
 * @param {{fuenteEditorial?: {version: number, confirmed: object}}} [opts]
 * @returns {object[]}
 */
export function resolveCatalogComposition(dishes, { fuenteEditorial } = {}) {
  return dishes.map((dish) => resolveDishComposition(dish, { fuenteEditorial }));
}

/**
 * Lectura segura de los ejes de verdura de una vista. ACCESSOR (Fork F.2,
 * EDITORIAL-S2): expone el payload (valorEfectivo) sin interpretar el
 * origen -- 'derivada' y 'confirmada' devuelven igual. LANZA UNICAMENTE
 * sobre origen "desconocida" -- no hay valorEfectivo que devolver (la
 * ausencia de contribucion refleja ausencia de informacion, no ausencia
 * de verdura).
 * @param {object} vista
 * @returns {string[]}
 */
export function ejesVerdura(vista) {
  if (vista.verdura.origen === 'desconocida') {
    throw new Error(
      'ejesVerdura: origen "desconocida" — no hay ejes que leer (freeform no declara verdura ' +
      'estructuralmente; desconocida no equivale a sin verdura).'
    );
  }
  return vista.verdura.valorEfectivo;
}
