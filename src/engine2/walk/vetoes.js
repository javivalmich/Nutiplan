// Vetos duros — Fase 4, Componente P2b-i (paso 2 del walk). Principio
// ratificado (DECISIONS.md, D-022): "Los vetos actuan antes de cualquier
// mecanismo de seleccion; un plato vetado no forma parte del espacio de
// decision." computeVetoUniverse/evaluateVeto se aplican UNICAMENTE al
// espacio de decision del walk (catalog con rol="rotativo"/"capricho").
// El ancla SI pasa por veto desde D-023 (F4-P2b-i-bis) -- pero por un
// mecanismo propio (chooseAnchor + filterSurvivors, ver mas abajo y
// buildWeekArc.js), no por computeVetoUniverse: el filtrado del ancla
// ocurre ANTES del sorteo por seed, sobre un catalogo de 6 referencias sin
// campo "rol" relevante aqui, no sobre el catalogo de 241 platos del walk.
//
// Fuente de containsGluten/containsLactosa: EXCLUSIVAMENTE
// CompositionResolver (D-021) via resolveDishComposition -- nunca una
// derivacion heuristica propia (p.ej. por tmpl="pasta"). Asiento D-022:
// "un veto declarado no puede resolverse mediante una inferencia no
// verificada cuando existe una fuente editorial prevista para ese dato"
// (la anotacion del cocinero via XLSX). Cada campo llega con la forma
// D-028 §2: { origen: 'confirmada'|'derivada'|'desconocida', valorEfectivo? }.
// Sin fuente editorial inyectada en el resolver, scaffold (178/241)
// resuelve origen="desconocida" en ambos campos -- contrato de dominio
// (D-022, terminologia renombrada por D-023): "desconocida" se trata como
// vetado si el campo esta en la lista de intolerancias activas
// ("desconocida" != "libre de") porque un origen desconocido no puede
// demostrarse compatible con un requisito de exclusion.
//
// origen="confirmada" (EDITORIAL-S2, D-028 §2): este modulo AUN NO lo
// consume -- evaluateVetoFromVista LANZA si lo recibe (Fork D.2,
// consumidor de dominio: interpreta el origen, tiene consecuencia
// observable sobre si un plato queda vetado). Es una frontera
// arquitectonica declarada, no un bug: S3 la retira cuando decida la
// semantica de veto sobre confirmaciones.

import { resolveDishComposition } from '../dishes/compositionResolver.js';

const FIELD_TO_COMPOSITION_KEY = Object.freeze({
  gluten: 'containsGluten',
  lactosa: 'containsLactosa',
});

/**
 * Nucleo puro del veto: evalua una VISTA de composicion ya resuelta (no un
 * plato) contra la lista de intolerancias activas. Separado de
 * evaluateVeto (que resuelve el plato) para que el mecanismo sea testeable
 * con vistas sinteticas -- p.ej. origen="scaffold" + campo.origen="derivada",
 * un origen hoy inalcanzable con el catalogo real sin fuente editorial
 * (CompositionResolver siempre resuelve scaffold a "desconocida" sin ella,
 * D-021) pero que el mecanismo debe tratar identico a freeform el dia que
 * la ingesta del cocinero lo puebla -- sin esta funcion, esa simetria de
 * codigo (no solo de datos) no tiene forma de probarse hoy.
 *
 * LANZA si algun campo.origen==="confirmada" (D-028 §2, EDITORIAL-S2, Fork
 * D.2): este consumidor de dominio aun no ha negociado que significa vetar
 * (o no) sobre una confirmacion editorial -- ver banner del modulo.
 * @param {object} vista salida de resolveDishComposition (o sintetica equivalente)
 * @param {string[]} [intolerancias]
 * @returns {{campo: string, motivo: 'valor'|'desconocida'}[]}
 */
export function evaluateVetoFromVista(vista, intolerancias) {
  if (!intolerancias || intolerancias.length === 0) return [];

  const razones = [];
  for (const campo of intolerancias) {
    const campoComposicion = vista[FIELD_TO_COMPOSITION_KEY[campo]];
    if (campoComposicion.origen === 'confirmada') {
      throw new Error(
        `evaluateVetoFromVista: campo "${campo}" trae origen="confirmada" -- este consumidor aun no ha ` +
        'negociado S3 (D-028 §2, EDITORIAL-S2, Fork D.2: consumidor de dominio, frontera arquitectonica).'
      );
    }
    if (campoComposicion.origen === 'desconocida') {
      razones.push({ campo, motivo: 'desconocida' });
    } else if (campoComposicion.valorEfectivo === true) {
      razones.push({ campo, motivo: 'valor' });
    }
  }
  return razones;
}

/**
 * Evalua un plato (resolviendo su vista via CompositionResolver, D-021)
 * contra la lista de intolerancias activas. Devuelve TODAS las razones que
 * aplican (un plato puede violar mas de un campo a la vez) -- necesario
 * para el conteo por campo/motivo del universo, no solo la primera causa
 * de exclusion. Atajo estructural: con intolerancias vacio/ausente, NUNCA
 * invoca el resolver (evita I/O y exigir platos resolubles cuando no hay
 * veto activo).
 * @param {{id: string}} dish
 * @param {string[]} [intolerancias] subconjunto de INTOLERANCE_VALUES (profile.js)
 * @returns {{campo: string, motivo: 'valor'|'desconocida'}[]}
 */
export function evaluateVeto(dish, intolerancias) {
  if (!intolerancias || intolerancias.length === 0) return [];
  return evaluateVetoFromVista(resolveDishComposition(dish), intolerancias);
}

/**
 * Filtro generico de candidatos por veto (D-023, asiento del camino del
 * ancla): dado un array de candidatos y una funcion que resuelve la vista
 * de composicion de cada uno, devuelve los supervivientes (aquellos cuyo
 * evaluateVetoFromVista sale vacio). Atajo estructural identico a
 * evaluateVeto/computeVetoUniverse: con intolerancias vacio/ausente,
 * devuelve TODOS los candidatos SIN resolver ninguna vista (evita I/O
 * cuando no hay veto activo, y preserva paridad byte a byte del camino
 * feliz -- f19).
 *
 * getVista es el punto de inyeccion que permite testear el mecanismo con
 * vistas sinteticas (mismo patron que evaluateVetoFromVista mas arriba):
 * p.ej. para el ancla, un origen "derivada"+valorEfectivo=true es hoy
 * inalcanzable con el catalogo real sin fuente editorial (CompositionResolver
 * resuelve scaffold siempre a "desconocida" sin ella, D-021) pero el
 * mecanismo debe tratarlo identico a freeform.
 * @param {ReadonlyArray<object>} candidates
 * @param {string[]} [intolerancias]
 * @param {(candidate: object) => object} getVista
 * @returns {object[]}
 */
export function filterSurvivors(candidates, intolerancias, getVista) {
  if (!intolerancias || intolerancias.length === 0) return candidates;
  return candidates.filter((candidate) => evaluateVetoFromVista(getVista(candidate), intolerancias).length === 0);
}

/**
 * Construye el universo de vetos UNA VEZ por semana (no por hueco):
 * escanea el catalogo restringido al espacio de decision del walk
 * (rol="rotativo"/"capricho" -- el ancla no pasa por aqui, ver banner) y
 * devuelve los ids vetados mas el conteo por campo/motivo para el
 * decision log. Con intolerancias vacio/ausente, el catalogo NUNCA se
 * escanea (activo:false).
 * @param {ReadonlyArray<{id: string, rol: string}>} catalog
 * @param {string[]} [intolerancias]
 * @returns {{vetoedIds: Set<string>, conteo: object, activo: boolean}}
 */
export function computeVetoUniverse(catalog, intolerancias) {
  if (!intolerancias || intolerancias.length === 0) {
    return { vetoedIds: new Set(), conteo: {}, activo: false };
  }

  const vetoedIds = new Set();
  const conteo = {};
  for (const campo of intolerancias) conteo[campo] = { valor: 0, desconocida: 0 };

  for (const dish of catalog) {
    if (dish.rol !== 'rotativo' && dish.rol !== 'capricho') continue;
    const razones = evaluateVeto(dish, intolerancias);
    if (razones.length === 0) continue;
    vetoedIds.add(dish.id);
    for (const { campo, motivo } of razones) conteo[campo][motivo]++;
  }

  return { vetoedIds, conteo, activo: true };
}
