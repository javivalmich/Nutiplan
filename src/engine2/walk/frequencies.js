// Frecuencias — Fase 4, Componente P2b-ii (paso 4 del walk, D-024).
// "Prioriza sin sumar": particion en niveles con fallback -- NUNCA
// agregacion numerica de cobertura por plato (CLAUDE.md invariante 1). Se
// inserta en runWalk.js DESPUES de las preferencias A/B (opera sobre sus
// supervivientes, candidatesB) y ANTES del desempate RNG final -- el RNG
// nunca ve el pool completo cuando hay nivel preferente, solo el nivel
// ganador (mismo invariante que el veto de paso 2 y el ancla de D-023).
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
 * @returns {object}
 */
export function resolveFrequencyVista(dish, onIrresoluble = () => {}) {
  try {
    return resolveDishComposition(dish);
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
 * asiento 4), dias que ya tienen verdura (asiento 3) e ids que resultaron
 * irresolubles (D-024 addendum: sustituidos por vista neutral -- narrados
 * una vez por walk en runWalk.js, ver banner del modulo). Recomputable
 * desde las colocaciones del propio paseo -- sin persistencia (MemoryStore
 * no se toca, R4).
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
    contadores, incrementDays, diasConVerdura: new Set(), idsIrresolubles: new Set(),
  };
}

/**
 * Vista por defecto de un dish dado un state: usa el catalogo real, y
 * cualquier id irresoluble se acumula en state.idsIrresolubles (para la
 * narracion de una linea por walk en runWalk.js).
 */
function vistaPorDefecto(state) {
  return (dish) => resolveFrequencyVista(dish, (id) => state.idsIrresolubles.add(id));
}

/**
 * Registra el consumo de una colocacion (ancla, sobra, capricho o
 * seleccion libre -- asiento 5: el contador registra el consumo, no la
 * intencion del paso). Incrementa como maximo un contador semanal
 * (proteinType mutuamente excluyente) y marca el dia como "con verdura"
 * si el plato la satisface. getVista permite testear con vistas
 * sinteticas (mismo patron que filterSurvivors/D-023); sin getVista, usa
 * el catalogo real y acumula ids irresolubles en el propio state.
 * @param {object} state salida de createFrequencyState (mutado in-place)
 * @param {{id: string}} dish
 * @param {string} day
 * @param {(dish: object) => object} [getVista]
 */
export function registerConsumption(state, dish, day, getVista) {
  const vista = (getVista || vistaPorDefecto(state))(dish);
  if (PROTEIN_TARGET_ORDER.includes(vista.proteinType)) {
    state.contadores[vista.proteinType] += 1;
    state.incrementDays[vista.proteinType].add(day);
  }
  if (satisfaceVerdura(vista)) state.diasConVerdura.add(day);
}

/**
 * Inicializa el estado de frecuencias desde los huecos YA colocados por
 * P1a (ancla + sobras) antes de que el walk empiece a elegir nada --
 * asiento 5: esas colocaciones tambien son consumo.
 * @param {ReadonlyArray<{day: string, abierto: boolean, dishId?: string}>} p1aSlots
 * @param {(dish: object) => object} [getVista]
 * @returns {object}
 */
export function initFrequencyState(p1aSlots, getVista) {
  const state = createFrequencyState();
  for (const slot of p1aSlots) {
    if (!slot.abierto && slot.dishId) registerConsumption(state, { id: slot.dishId }, slot.day, getVista);
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
 * registerConsumption/D-023); sin getVista, usa el catalogo real y
 * acumula ids irresolubles en el propio state.
 * @param {{day: string, candidatesB: object[], state: object, getVista?: (dish: object) => object}} input
 * @returns {{nivel: object[], causa: string|null, evidencia: string|null}}
 */
export function chooseFrequencyLevel({
  day, candidatesB, state, getVista,
}) {
  const resolver = getVista || vistaPorDefecto(state);
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
