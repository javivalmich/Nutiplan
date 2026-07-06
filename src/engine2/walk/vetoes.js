// Vetos duros — Fase 4, Componente P2b-i (paso 2 del walk). Principio
// ratificado (DECISIONS.md, D-022): "Los vetos actuan antes de cualquier
// mecanismo de seleccion; un plato vetado no forma parte del espacio de
// decision." Se aplica UNICAMENTE al espacio de decision del walk
// (catalog con rol="rotativo"/"capricho") -- el ancla (F3, chooseAnchor +
// colocacion en expandWeekArc) no pasa por ningun punto de veto hoy
// (verificado en Fase 1 de esta sesion, sin filtros de ningun tipo); su
// aplicacion es asiento propio, fuera de alcance aqui.
//
// Fuente de containsGluten/containsLactosa: EXCLUSIVAMENTE
// CompositionResolver (D-021) via resolveDishComposition -- nunca una
// derivacion heuristica propia (p.ej. por tmpl="pasta"). Asiento D-022:
// "un veto declarado no puede resolverse mediante una inferencia no
// verificada cuando existe una fuente editorial prevista para ese dato"
// (la anotacion del cocinero via XLSX, ingesta en PR propio siguiente en
// cola). Mientras esa ingesta no aterriza, scaffold (178/241) resuelve
// estado="desconocida" en ambos campos -- politica FAIL-CLOSED (D-022):
// "desconocida" se trata como vetado si el campo esta en la lista de
// intolerancias activas ("desconocida" != "libre de"). Transitorio: la
// ingesta reduce este universo al residuo real sin anotar.

import { resolveDishComposition } from '../dishes/compositionResolver.js';

const FIELD_TO_COMPOSITION_KEY = Object.freeze({
  gluten: 'containsGluten',
  lactosa: 'containsLactosa',
});

/**
 * Nucleo puro del veto: evalua una VISTA de composicion ya resuelta (no un
 * plato) contra la lista de intolerancias activas. Separado de
 * evaluateVeto (que resuelve el plato) para que el mecanismo sea testeable
 * con vistas sinteticas -- p.ej. origen="scaffold" + estado="conocida", un
 * estado hoy inalcanzable con el catalogo real (CompositionResolver
 * siempre resuelve scaffold a "desconocida", D-021) pero que el mecanismo
 * debe tratar identico a freeform el dia que la ingesta del cocinero lo
 * puebla -- sin esta funcion, esa simetria de codigo (no solo de datos) no
 * tiene forma de probarse hoy.
 * @param {object} vista salida de resolveDishComposition (o sintetica equivalente)
 * @param {string[]} [intolerancias]
 * @returns {{campo: string, motivo: 'valor'|'desconocida'}[]}
 */
export function evaluateVetoFromVista(vista, intolerancias) {
  if (!intolerancias || intolerancias.length === 0) return [];

  const razones = [];
  for (const campo of intolerancias) {
    const estadoCampo = vista[FIELD_TO_COMPOSITION_KEY[campo]];
    if (estadoCampo.estado === 'desconocida') {
      razones.push({ campo, motivo: 'desconocida' });
    } else if (estadoCampo.valor === true) {
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
