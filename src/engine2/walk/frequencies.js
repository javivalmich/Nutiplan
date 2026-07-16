// Frecuencias — Fase 4, Componente P2b-ii (paso 4 del walk, D-024).
// "Prioriza sin sumar": particion en niveles con fallback -- NUNCA
// agregacion numerica de cobertura por plato (CLAUDE.md invariante 1). Se
// inserta en runWalk.js DESPUES de las preferencias A/B (opera sobre sus
// supervivientes, candidatesB) y ANTES del desempate RNG final -- el RNG
// nunca ve el pool completo cuando hay nivel preferente, solo el nivel
// ganador (mismo invariante que el veto de paso 2 y el ancla de D-023).
//
// vistaPorDefecto (D-036, PR-1b) es uno de los TRES productores de vista
// ratificados: recibe fuenteEditorial (dato de entrada del walk, nunca
// cargado de disco por este modulo) y la pasa al resolver. satisfaceVerdura
// (predicado de dominio) permanece completamente ajeno a fuenteEditorial --
// consume la vista ya resuelta, ver su propio banner y D-037 (tripwire
// estructural).
//
// Mecanismo (D-024, asiento 1): nivel preferente = supervivientes de A/B
// que cubren la frecuencia atendida; si no-vacio, la seleccion ocurre solo
// dentro de el; si vacio para TODAS las frecuencias cortas, fallback al
// conjunto completo con causa "frecuencia_corta_sin_candidato" (asiento
// 2/f2 -- fallback HONESTO, no un filtro que vacia el pool).
//
// Concurrencia (asiento 2): UNA frecuencia por hueco -- la primera corta
// de la lista declarada CON CANDIDATOS DISPONIBLES. Orden de precedencia
// vigente para el catalogo y objetivos actuales: legumbre >= pescado.
//
// Verdura (asiento 3): sub-regla DIARIA, evaluada ANTES que los
// contadores semanales -- si el dia no tiene verdura aun y hay candidatos
// que la cubren (origen "derivada" o "confirmada", valorEfectivo no
// vacio -- D-033, F-SV1->A: pie de igualdad), ese es el nivel preferente
// del hueco. Infraconteo declarado: freeform sin confirmar
// ("desconocida") JAMAS satisface el predicado -- sesgo conservador, nunca
// de menos. El paso ramifica sobre origen y JAMAS invoca ejesVerdura sobre
// "desconocida" (ver satisfaceVerdura: lee vista.verdura.origen
// directamente, nunca llama al helper que lanza).
//
// origen="confirmada" (D-028 §2, EDITORIAL-S2, Fork D.2): satisfaceVerdura
// la consume en pie de igualdad con "derivada" (D-033, F-SV1->A, retira el
// throw declarado en EDITORIAL-S2 -- "conocida" tiene dos formas). La
// frontera se reubica (D-033, F-SV2->A2, enumeracion positiva): lanza
// sobre cualquier origen fuera de {derivada, confirmada, desconocida}.
//
// Activacion y veda (asiento 4): una frecuencia semanal "va corta" si su
// contador < target, evaluado en cada hueco. Veda de un dia por EVENTO de
// contador (incrementDays, por CUALQUIER via de consumo -- ancla, sobra,
// capricho o seleccion libre): activa si el dia es hoy o el dia anterior;
// mientras dure, el paso 4 no atiende esa frecuencia. Verdura queda EXENTA
// de la veda (atenderla a diario es su trabajo).
//
// Contador (asiento 5): consumo, no cocinado -- incrementa una vez por
// colocacion consumida, sin importar el origen. Estado local del walk,
// recomputable desde las colocaciones del propio paseo (initFrequencyState
// desde P1a, registerConsumption desde capricho/generico), sin
// persistencia. proteinType es mutuamente excluyente -- un plato
// incrementa como maximo un contador semanal.
//
// Tolerancia a ids no resolubles (verificacion previa a esta
// implementacion, D-024): catalogos sinteticos de tests preexistentes
// (runWalk.test.js v6-v13) usan ids como "rot0"/"anchorFillN" que no
// parsean como tupla scaffold ni tienen entrada en FREEFORM_COMBOS --
// resolveDishComposition lanza "origen indeterminado" para ESOS, nunca
// para un plato real (D-021: 241/241 del catalogo real tienen origen
// determinable). resolveFrequencyVista sustituye, SOLO para ese error
// especifico, una vista neutral (proteinType fuera de cualquier target,
// verdura sin ejes) -- verificado analiticamente antes de escribir este
// modulo: un pool 100% no-resoluble cae siempre a fallback (f2), cero
// efecto sobre que plato gana en las fixtures existentes. Cualquier OTRO
// error del resolver (join de density fallido, P_TO_PROTEINTYPE
// incompleto, etc. -- todos indicando un bug real de catalogo) se
// RE-LANZA sin capturar: el resolver no se toca, y sus fallos reales no
// se ocultan.
//
// PASO 5 -- identidad de verdura (D-044, Componente P2b-iii). Memoria
// GLOBAL (observa todo compromiso de identidad, P1a y P1b, sin
// distincion de origen -- D-044 punto 1) + politica LOCAL (interviene
// solo en la fase de candidatos del rotativo -- D-044 punto 1). Vive en
// este modulo: reutiliza el mismo recorrido de registerConsumption/
// initFrequencyState que puebla el resto del estado (D-044 punto 3:
// "cero recorridos nuevos"), y el mismo productor de vista ya ratificado
// (vistaPorDefecto, D-036/D-037) -- cero nueva entrada en la allowlist
// de s2-fuenteEditorial-callsites.test.js.
//
// Poblacion (D-044 puntos 3-4): por cada colocacion consumida que
// satisface verdura (mismo predicado satisfaceVerdura, eje-agnostico --
// V y V2 fusionados en valorEfectivo, norma de
// docs/evidence/variedad-verdura/baseline-variedad-verdura.md), cada
// identidad de valorEfectivo suma el DIA (no la aparicion) al resumen
// interno. Lectura expuesta EXCLUSIVAMENTE via diasConIdentidad -- la
// politica no conoce la representacion interna (D-044 punto 4).
//
// Politica (D-044 puntos 5-8): paso 5, posterior y separado de paso 4
// (chooseFrequencyLevel) -- opera sobre candidatesFinal (su nivel
// ganador), particion binaria preferentes (coste minimo de repeticion,
// D-044 asiento 5: minimo es comparacion, no acumulacion) / resto. INV-1
// (D-044 asiento 6): particion vacia -> revierte al conjunto completo,
// MISMA semantica que frecuencia_corta_sin_candidato (D-024 asiento 1) --
// ver particionarPorCoste. INV-2 (D-044 asiento 7): costeRepeticion debe
// ser monotono; la forma concreta (maximo de diasConIdentidad sobre las
// identidades del candidato) es decision de implementacion, puede
// evolucionar sin tocar D-044. Log: dos causas unicamente
// (identidad_verdura_preferencia_aplicada,
// identidad_verdura_reversion_nivel_vacio) -- sin efecto, sin entrada
// (D-044 punto 8, mismo principio que paso 4).

import { resolveDishComposition, UnresolvableOriginError } from '../dishes/compositionResolver.js';
import { DAYS_ORDER } from '../skeleton/days.js';
import { DEFAULT_WEEKLY_TARGETS } from '../contracts/weeklyTargets.js';

export const PROTEIN_TARGET_ORDER = Object.freeze(['legumbre', 'pescado']);

// VISTA_NEUTRAL construye el shape de composicion a mano (D-028 §2:
// { origen, valorEfectivo }), fuera del resolver -- decision S2 (delegada,
// sin asiento): NO se centraliza en un constructor exportado por
// compositionResolver.js. Esta vista no es una resolucion real: es la
// politica de FALLBACK propia de frequencies.js para el caso degenerado
// "id no resoluble" (ver banner del modulo) -- nunca afirma venir del
// resolver, así que atarla a un constructor del resolver sugeriria una
// procedencia que no tiene. El mapeo es trivial (dos campos, contrato ya
// documentado en compositionResolver.js:17-36) y de un unico uso.
const VISTA_NEUTRAL = Object.freeze({
  proteinType: null,
  verdura: Object.freeze({ origen: 'derivada', valorEfectivo: Object.freeze([]) }),
});

/**
 * Vista de composicion para el paso 4, tolerante a ids no resolubles (ver
 * banner del modulo). Discrimina por TIPO (instanceof UnresolvableOriginError),
 * no por texto de mensaje -- re-lanza cualquier OTRO error (un bug real de
 * catalogo no se enmascara). onIrresoluble(dishId) se invoca UNA vez por
 * sustitucion, para que el llamador (registerConsumption/chooseFrequencyLevel)
 * pueda narrar la neutralizacion en el decision log (D-024 addendum, riesgo
 * nombrado: un id corrupto en el catalogo REAL atravesaria como neutral sin
 * lanzar -- este log es la alarma que lo hace visible).
 * @param {{id: string}} dish
 * @param {(dishId: string) => void} [onIrresoluble]
 * @param {{fuenteEditorial?: {version: number, confirmed: object}}} [opts]
 * @returns {object}
 */
export function resolveFrequencyVista(dish, onIrresoluble = () => {}, { fuenteEditorial } = {}) {
  try {
    return resolveDishComposition(dish, { fuenteEditorial });
  } catch (err) {
    if (err instanceof UnresolvableOriginError) {
      onIrresoluble(dish.id);
      return VISTA_NEUTRAL;
    }
    throw err;
  }
}

/**
 * Predicado de verdura del dia (asiento 3, D-033 F-SV1->A/F-SV2->A2):
 * "derivada" y "confirmada" conocen la verdura en pie de igualdad --
 * satisface con al menos un eje. NUNCA invoca ejesVerdura (que lanza
 * sobre "desconocida") -- lee vista.verdura.origen directamente,
 * ramificando sobre el origen. "desconocida" retorna false ANTES de
 * leer valorEfectivo (disciplina f8: ese campo no existe en ese origen,
 * compositionResolver.js:193).
 *
 * LANZA sobre cualquier origen fuera de {derivada, confirmada,
 * desconocida} (D-033, F-SV2->A2: enumeracion positiva con frontera --
 * las fronteras se declaran, no se heredan por omision; mismo principio
 * que instalo el throw retirado de EDITORIAL-S2).
 * @param {object} vista
 * @returns {boolean}
 */
export function satisfaceVerdura(vista) {
  const { origen } = vista.verdura;
  if (origen === 'desconocida') return false;
  if (origen === 'derivada' || origen === 'confirmada') {
    return vista.verdura.valorEfectivo.length > 0;
  }
  throw new Error(
    `satisfaceVerdura: origen no contemplado "${origen}" ` +
    '(D-033, F-SV2->A2: enumeracion positiva con frontera; '
    + 'D-028 §2 define derivada|confirmada|desconocida).'
  );
}

function diaAnterior(day) {
  const idx = DAYS_ORDER.indexOf(day);
  return idx > 0 ? DAYS_ORDER[idx - 1] : null;
}

/**
 * Estado local de frecuencias del walk (asiento 5): contadores semanales
 * (legumbre/pescado), dias de ultimo incremento por campo (para la veda,
 * asiento 4), dias que ya tienen verdura (asiento 3), ids que resultaron
 * irresolubles (D-024 addendum: sustituidos por vista neutral -- narrados
 * una vez por walk en runWalk.js, ver banner del modulo) y memoria de
 * identidad de verdura (D-044 punto 3: identidad -> dias distintos en que
 * fue comprometida; representacion interna, la politica de paso 5 solo
 * consulta diasConIdentidad). Recomputable desde las colocaciones del
 * propio paseo -- sin persistencia (MemoryStore no se toca, R4).
 * @returns {object}
 */
export function createFrequencyState() {
  const contadores = {};
  const incrementDays = {};
  for (const campo of PROTEIN_TARGET_ORDER) {
    contadores[campo] = 0;
    incrementDays[campo] = new Set();
  }
  return {
    contadores,
    incrementDays,
    diasConVerdura: new Set(),
    idsIrresolubles: new Set(),
    diasPorIdentidadVerdura: new Map(),
  };
}

/**
 * Vista por defecto de un dish dado un state: usa el catalogo real, y
 * cualquier id irresoluble se acumula en state.idsIrresolubles (para la
 * narracion de una linea por walk en runWalk.js).
 *
 * PRODUCTOR de vista (D-036, F-1b-1->A): recibe fuenteEditorial (dato de
 * entrada del walk, nunca cargado de disco por este modulo) y la pasa al
 * resolver. Call-site ratificado en la allowlist del tripwire de aridad
 * (D-037, s2-fuenteEditorial-callsites.test.js).
 * @param {object} state
 * @param {{version: number, confirmed: object}} [fuenteEditorial]
 */
function vistaPorDefecto(state, fuenteEditorial) {
  return (dish) => resolveFrequencyVista(dish, (id) => state.idsIrresolubles.add(id), { fuenteEditorial });
}

/**
 * Registra el consumo de una colocacion (ancla, sobra, capricho o
 * seleccion libre -- asiento 5: el contador registra el consumo, no la
 * intencion del paso). Incrementa como maximo un contador semanal
 * (proteinType mutuamente excluyente) y marca el dia como "con verdura"
 * si el plato la satisface. getVista permite testear con vistas
 * sinteticas (mismo patron que filterSurvivors/D-023); sin getVista, usa
 * el catalogo real (con fuenteEditorial si se inyecta, D-036) y acumula
 * ids irresolubles en el propio state.
 * @param {object} state salida de createFrequencyState (mutado in-place)
 * @param {{id: string}} dish
 * @param {string} day
 * @param {(dish: object) => object} [getVista]
 * @param {{version: number, confirmed: object}} [fuenteEditorial]
 */
export function registerConsumption(state, dish, day, getVista, fuenteEditorial) {
  const vista = (getVista || vistaPorDefecto(state, fuenteEditorial))(dish);
  if (PROTEIN_TARGET_ORDER.includes(vista.proteinType)) {
    state.contadores[vista.proteinType] += 1;
    state.incrementDays[vista.proteinType].add(day);
  }
  if (satisfaceVerdura(vista)) {
    state.diasConVerdura.add(day);
    // Memoria de identidad (D-044 puntos 3-4): eje-agnostica -- V y V2 ya
    // llegan fusionados en valorEfectivo (norma de
    // baseline-variedad-verdura.md), asi que cada elemento es una
    // identidad de verdura comprometida ESTE dia, sin importar de que eje
    // provino. Unidad temporal = dia (no aparicion): un Set por
    // identidad, no un contador.
    for (const identidad of vista.verdura.valorEfectivo) {
      if (!state.diasPorIdentidadVerdura.has(identidad)) state.diasPorIdentidadVerdura.set(identidad, new Set());
      state.diasPorIdentidadVerdura.get(identidad).add(day);
    }
  }
}

/**
 * Inicializa el estado de frecuencias desde los huecos YA colocados por
 * P1a (ancla + sobras) antes de que el walk empiece a elegir nada --
 * asiento 5: esas colocaciones tambien son consumo.
 * @param {ReadonlyArray<{day: string, abierto: boolean, dishId?: string}>} p1aSlots
 * @param {(dish: object) => object} [getVista]
 * @param {{version: number, confirmed: object}} [fuenteEditorial]
 * @returns {object}
 */
export function initFrequencyState(p1aSlots, getVista, fuenteEditorial) {
  const state = createFrequencyState();
  for (const slot of p1aSlots) {
    if (!slot.abierto && slot.dishId) registerConsumption(state, { id: slot.dishId }, slot.day, getVista, fuenteEditorial);
  }
  return state;
}

/**
 * Nucleo puro de paso 4 (D-024): dado el dia, el pool post-A/B
 * (candidatesB) y el estado de frecuencias, devuelve el nivel preferente
 * sobre el que debe ocurrir el desempate final. causa/evidencia son
 * `null` cuando el paso NO interviene (f12: huecos sin intervencion no
 * llevan entrada del paso 4).
 *
 * Orden de evaluacion (D-024): (a) sub-regla diaria de verdura, PREVIA a
 * los contadores semanales (asiento 3); (b) contadores semanales, orden
 * declarado legumbre->pescado (asiento 2), saltando frecuencias vedadas o
 * ya satisfechas, y saltando (sin fallback inmediato) una corta que no
 * tenga candidatos en el pool -- solo cae a fallback si NINGUNA corta
 * tiene candidatos (asiento 2: "la primera corta... CON CANDIDATOS
 * DISPONIBLES").
 * getVista permite testear con vistas sinteticas (mismo patron que
 * registerConsumption/D-023); sin getVista, usa el catalogo real (con
 * fuenteEditorial si se inyecta, D-036) y acumula ids irresolubles en el
 * propio state.
 * @param {{day: string, candidatesB: object[], state: object, getVista?: (dish: object) => object, fuenteEditorial?: {version: number, confirmed: object}}} input
 * @returns {{nivel: object[], causa: string|null, evidencia: string|null}}
 */
export function chooseFrequencyLevel({
  day, candidatesB, state, getVista, fuenteEditorial,
}) {
  const resolver = getVista || vistaPorDefecto(state, fuenteEditorial);
  const vistaPorId = new Map(candidatesB.map((d) => [d.id, resolver(d)]));
  const nivelInferior = (nivel) => candidatesB.filter((d) => !nivel.includes(d)).map((d) => d.id);

  if (!state.diasConVerdura.has(day)) {
    const conVerdura = candidatesB.filter((d) => satisfaceVerdura(vistaPorId.get(d.id)));
    if (conVerdura.length > 0) {
      return {
        nivel: conVerdura,
        causa: 'frecuencia_verdura_diaria',
        evidencia: `paso 4: ${day} sin verdura aun; nivel preferente = ${conVerdura.length} candidatos de ${candidatesB.length} post-A/B que la cubren; `
          + `descartados a nivel inferior: [${nivelInferior(conVerdura).join(', ')}]`,
      };
    }
  }

  const diaAnt = diaAnterior(day);
  const cortasSinCandidato = [];
  for (const campo of PROTEIN_TARGET_ORDER) {
    const corto = state.contadores[campo] < DEFAULT_WEEKLY_TARGETS[campo];
    if (!corto) continue;
    const vedado = state.incrementDays[campo].has(day) || (diaAnt !== null && state.incrementDays[campo].has(diaAnt));
    if (vedado) continue;
    const conCobertura = candidatesB.filter((d) => vistaPorId.get(d.id).proteinType === campo);
    if (conCobertura.length > 0) {
      return {
        nivel: conCobertura,
        causa: 'frecuencia_semanal_atendida',
        evidencia: `paso 4: target="${campo}" corto (contador ${state.contadores[campo]}/${DEFAULT_WEEKLY_TARGETS[campo]}), sin veda; `
          + `nivel preferente = ${conCobertura.length} candidatos de ${candidatesB.length} post-A/B; `
          + `descartados a nivel inferior: [${nivelInferior(conCobertura).join(', ')}]`,
      };
    }
    cortasSinCandidato.push(campo);
  }

  if (cortasSinCandidato.length > 0) {
    return {
      nivel: candidatesB,
      causa: 'frecuencia_corta_sin_candidato',
      evidencia: `paso 4: frecuencia(s) corta(s) sin candidato en el pool post-A/B: [${cortasSinCandidato.join(', ')}]; `
        + `seleccion sobre el conjunto completo (${candidatesB.length} candidatos), sin nivel preferente`,
    };
  }

  return { nivel: candidatesB, causa: null, evidencia: null };
}

/**
 * Lectura del resumen de memoria de identidad (D-044, punto 4): dias
 * DISTINTOS en que la identidad de verdura dada ya fue comprometida, por
 * cualquier via de consumo (asiento 5 de D-024, extendido a identidad --
 * ancla, sobra, capricho o seleccion libre, P1a y P1b sin distincion,
 * D-044 punto 1). UNICA funcion que el paso 5 puede usar para leer
 * memoria -- no conoce ni depende de que la representacion interna sea
 * un Map<identidad,Set<dia>> (D-044 punto 4: "no conoce ni depende de
 * como la memoria representa ese resumen").
 * @param {object} state
 * @param {string} identidad
 * @returns {number}
 */
export function diasConIdentidad(state, identidad) {
  return state.diasPorIdentidadVerdura.get(identidad)?.size ?? 0;
}

/**
 * Coste de repeticion de un candidato (D-044, INV-2: la propiedad
 * exigida es monotonia, la forma queda abierta a la implementacion --
 * asiento 7). Maximo de diasConIdentidad sobre las identidades de
 * verdura del candidato: monotono por construccion -- diasConIdentidad
 * de una identidad con mas dias registrados nunca es menor que la misma
 * identidad con menos dias, y el maximo de un conjunto solo puede subir
 * o quedar igual al anadir mas identidades, nunca bajar. Sin verdura
 * (origen "desconocida", o valorEfectivo vacio) -> coste 0: un candidato
 * sin compromiso de identidad no aporta repeticion alguna. Forma
 * DECISION DE IMPLEMENTACION (D-044 asiento 7): puede evolucionar sin
 * tocar el asiento, siempre que sea monotona.
 * @param {object} state
 * @param {object} vista
 * @returns {number}
 */
export function costeRepeticion(state, vista) {
  if (!satisfaceVerdura(vista)) return 0;
  return Math.max(...vista.verdura.valorEfectivo.map((identidad) => diasConIdentidad(state, identidad)));
}

/**
 * Particion binaria preferentes/resto por coste minimo (D-044, asiento
 * 5: "sin ranking total, sin umbrales absolutos, sin acumulacion
 * numerica entre candidatos" -- el minimo es una comparacion, no una
 * suma), con reversion INV-1 (D-044 asiento 6) si la particion
 * preferente queda vacia -- MISMA semantica que frecuencia_corta_sin_
 * candidato (D-024 asiento 1): revertir al conjunto completo, nunca
 * relanzar contra pasos previos.
 *
 * Recibe los costes YA calculados (paralelos a candidates por indice)
 * para mantener la particion agnostica de la forma de coste (D-044
 * asiento 7: costeRepeticion puede evolucionar sin tocar esta funcion).
 * Bajo un coste bien formado (numeros finitos comparables) el minimo de
 * un conjunto no vacio nunca deja vacia la particion preferente -- INV-1
 * es una red de seguridad ESTRUCTURAL, no alcanzable con costeRepeticion
 * ni con el catalogo real (verificado con costes sinteticos degenerados
 * en frequencies.test.js), y existe para cualquier funcion de coste
 * futura que no preserve esa garantia.
 * @param {object[]} candidates
 * @param {number[]} costes paralelo a candidates por indice
 * @returns {{preferentes: object[], costeMinimo: number, reversion: boolean}}
 */
export function particionarPorCoste(candidates, costes) {
  const costeMinimo = Math.min(...costes);
  const preferentes = candidates.filter((_, i) => costes[i] === costeMinimo);
  return { preferentes, costeMinimo, reversion: preferentes.length === 0 };
}

/**
 * Nucleo puro de paso 5 (D-044): dado el nivel ganador de paso 4
 * (candidatesFinal) y el estado, particiona por coste minimo de
 * repeticion de identidad. causa/evidencia son `null` cuando el paso NO
 * interviene: pool de 1 candidato (no se evalua -- D-044, Fase 2.3), o
 * particion sin efecto (todos los candidatos empatan al coste minimo --
 * "se evaluo y no tuvo efecto" no genera entrada, D-044 punto 8, mismo
 * principio que paso 4).
 *
 * getVista permite testear con vistas sinteticas (mismo patron que
 * chooseFrequencyLevel/registerConsumption); sin getVista, usa el
 * catalogo real (con fuenteEditorial si se inyecta, D-036) -- MISMO
 * productor de vista ya ratificado (vistaPorDefecto), cero nueva entrada
 * en la allowlist (D-037, s2-fuenteEditorial-callsites.test.js).
 * @param {{candidatesFinal: object[], state: object, getVista?: (dish: object) => object, fuenteEditorial?: {version: number, confirmed: object}}} input
 * @returns {{nivel: object[], causa: string|null, evidencia: string|null}}
 */
export function chooseIdentityLevel({
  candidatesFinal, state, getVista, fuenteEditorial,
}) {
  if (candidatesFinal.length <= 1) {
    return { nivel: candidatesFinal, causa: null, evidencia: null };
  }

  const resolver = getVista || vistaPorDefecto(state, fuenteEditorial);
  const costes = candidatesFinal.map((d) => costeRepeticion(state, resolver(d)));
  const { preferentes, costeMinimo, reversion } = particionarPorCoste(candidatesFinal, costes);

  if (reversion) {
    return {
      nivel: candidatesFinal,
      causa: 'identidad_verdura_reversion_nivel_vacio',
      evidencia: `paso 5: particion preferente vacia (INV-1, estado degenerado); reversion al conjunto `
        + `completo (${candidatesFinal.length} candidatos), misma semantica que frecuencia_corta_sin_candidato`,
    };
  }

  if (preferentes.length === candidatesFinal.length) {
    return { nivel: candidatesFinal, causa: null, evidencia: null };
  }

  const descartados = candidatesFinal.filter((d) => !preferentes.includes(d)).map((d) => d.id);
  return {
    nivel: preferentes,
    causa: 'identidad_verdura_preferencia_aplicada',
    evidencia: `paso 5: coste minimo de repeticion = ${costeMinimo}; nivel preferente = ${preferentes.length} candidatos de ${candidatesFinal.length} post-paso4; `
      + `descartados por mayor repeticion de identidad: [${descartados.join(', ')}]`,
  };
}
