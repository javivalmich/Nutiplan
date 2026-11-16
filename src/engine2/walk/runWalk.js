// Seleccion del walk — Fase 4, Componentes P1b + P2b-i (vetos duros,
// D-022) + P2b-ii (frecuencias, D-024) + P2b-iii (identidad de verdura,
// D-044). Entrada: {weekArc, catalog, seed, memoryStore, profile}. Salida:
// {slots, decisionLog}. Rellena los huecos que
// expandWeekArc (P1a, NO se toca aqui) deja abiertos: rotativo y capricho.
// Prohibido score/ranking (CLAUDE.md invariante 1): solo pools por rol,
// prioridades ordenadas (primera respuesta valida gana) y desempate por
// RNG sembrado sobre candidatos ya equivalentes.
//
// DOS STREAMS DE RNG BAJO EL NOMBRE "walk" (D-019): expandWeekArc.js usa
// mulberry32(seedFromString(`${seed}::walk`)) para su propio desempate de
// momento del ancla (paso 0 de su cascada). Este modulo NO puede compartir
// esa misma instancia (expandWeekArc no la expone, y no se toca su
// codigo), asi que crear un generador con el mismo string "::walk"
// reiniciaria la secuencia desde el indice 0 y correlacionaria por
// coincidencia numerica el primer desempate de seleccion con el desempate
// de ancla de expandWeekArc — no es un bug de determinismo (la seed sigue
// fijando el resultado), pero es una dependencia accidental innecesaria.
// Por eso este modulo usa su PROPIO sub-namespace, "::walk::select":
// mismo namespace logico ("walk"), stream independiente.
//
// CASCADA DE SELECCION por hueco abierto (D-019, orden fijo):
//   Paso 1 (respetar lo colocado): un hueco con abierto=false no se toca.
//   Paso 2 (vetos duros, D-022/vetoes.js): ANTES de construir ningun pool,
//     se calcula UNA VEZ el universo vetado del catalogo (rol="rotativo"/
//     "capricho" -- el ancla no pasa por aqui) segun profile.intolerances.
//     Los pools de capricho y generico excluyen esos ids junto con
//     usedIds -- un plato vetado no aparece en ninguna colocacion ni
//     estructura del espacio de decision (principio ratificado D-022).
//   CAPRICHO (dia con slotRole="capricho", ambos huecos abiertos por
//     construccion — ver assertNoCaprichoCollision en buildWeekArc.js):
//     se resuelve ANTES que el resto de la semana, en una fase propia.
//     Asimetria consciente respecto al ancla: aqui la SELECCION precede a
//     la COLOCACION (se elige el plato primero; su propio set de momento
//     decide donde cae), mientras que el ancla ya trae el plato y solo
//     cae donde su set lo permite. UN capricho por semana, nunca dos: el
//     hueco hermano (el momento no elegido) pasa a rotativo normal, con
//     preferencias A/B incluidas (deja de ser "el hueco capricho" en
//     cuanto el otro momento se lleva la eleccion).
//       - pool = catalogo con rol="capricho", ids no usados en la semana.
//       - Pool vacio (estado real del catalogo hoy: 0/241 rol="capricho")
//         -> DEGRADACION explicita: se registra un evento en el log
//         ("capricho_degradado_a_rotativo") y NINGUN hueco se marca fuera
//         de la cascada generica — los dos huecos del dia se resuelven
//         como cualquier otro hueco rotativo, con A/B incluidas.
//       - Pool no vacio: SOLO reglas duras (rol + no-repeticion). Las
//         preferencias A/B NO aplican al capricho (exencion ratificada:
//         A/B tejen variedad en lo ordinario: el capricho es la excepcion
//         consciente de la semana, no otro rotativo mas). >1 candidato ->
//         RNG, causa literal "capricho de la semana"; 1 candidato ->
//         directo, sin RNG. Momento: unico -> directo; ambiguo -> RNG
//         (mismo patron que el eslabon 0 de expandWeekArc, stream propio).
//   GENERICO (todo hueco abierto restante, recorrido Lunes->Domingo,
//     comida luego cena — incluye el hermano del ancla, el hermano del
//     capricho y el capricho degradado):
//       - pool = catalogo con rol="rotativo", momento admite el hueco,
//         ids no usados en la semana. Pool vacio -> LANZA (sin fallback:
//         estado inalcanzable hoy queda medido, no encubierto).
//       - Paso 3, preferencia A: descarta candidatos cuyo plateType
//         coincide con el plato de AYER en el MISMO momento. Sin dia
//         anterior en la semana (Lunes) -> no aplica (vacuamente
//         satisfecha, no es imposibilidad: no hay restriccion que
//         evaluar). Si descartar TODO deja el pool vacio -> "satisfecha
//         por imposibilidad", se revierte a los candidatos previos a A.
//       - Paso 3, preferencia B: sobre el resultado de A, descarta
//         candidatos cuyo tempFeel repetiria 3 dias consecutivos en el
//         mismo momento (necesita 2 dias previos en la semana). Misma
//         regla de imposibilidad que A, aplicada SOBRE el conjunto
//         post-A (por eso A tiene prioridad sobre B: la restriccion de A
//         ya esta fijada cuando B evalua).
//       - Paso 4 (frecuencias, D-024/frequencies.js): sobre candidatesB
//         (post A/B), particion en niveles con fallback -- nunca suma.
//         Verdura (sub-regla diaria, PREVIA a los contadores semanales):
//         si el dia no tiene verdura y hay candidatos que la cubren, nivel
//         preferente = esos. Si no, contadores semanales en orden
//         declarado (legumbre->pescado): la primera frecuencia corta
//         (contador < target), sin veda (dia de ultimo incremento = hoy o
//         ayer) Y con candidatos que la cubran, es el nivel preferente.
//         Ninguna corta con candidatos -> fallback HONESTO al conjunto
//         completo, causa "frecuencia_corta_sin_candidato". Ninguna corta
//         en absoluto -> el paso no interviene (sin entrada de log).
//       - Paso 5 (identidad de verdura, D-044/frequencies.js): sobre el
//         nivel ganador de paso 4, particion por coste minimo de
//         repeticion de identidad -- memoria GLOBAL (observa P1a y P1b
//         sin distincion), politica LOCAL (solo aqui, en candidatos del
//         rotativo). INV-1: particion vacia -> revierte al nivel de paso
//         4 completo, misma semantica que frecuencia_corta_sin_candidato.
//         Pool de 1 candidato (ya resuelto por paso 4) -> paso 5 no se
//         evalua. Sin efecto (todos empatan) -> sin entrada de log.
//       - Paso 6: 1 candidato final (del nivel de paso 5) -> directo, sin
//         RNG. >1 -> RNG (stream "::walk::select"). El RNG NUNCA ve el
//         pool pre-filtros: solo los candidatos que sobreviven
//         pool+no-repeticion+A+B+paso4+paso5.
//
// energiaCocina (D-018/D-019): no participa en ninguna decision de
// seleccion; se registra en la entrada del log SOLO para los platos
// ELEGIDOS aqui (P1a no la lee ni la registra, sigue intacta desde el
// catalogo — ver expandWeekArc.js).
//
// MemoryStore: se recibe por inyeccion y NUNCA se invoca (P1b, como P1a,
// es stateless en esta fase — R4).

import { expandWeekArc } from './expandWeekArc.js';
import { DAYS_ORDER } from '../skeleton/days.js';
import { mulberry32, seedFromString } from '../skeleton/rng.js';
import { MOMENTOS } from '../dishes/schema.js';
import { computeVetoUniverse } from './vetoes.js';
import {
  proteinaPrincipal, familiaProteica, esCompuestoLegumbre, esSegundoDeLegumbre, TOPE_PROTEINA_SEMANA,
} from '../dishes/bases.js';
import { alinoDe, TOPE_AJILLO_SEMANA } from '../dishes/alinosD105.js';
import {
  initFrequencyState, registerConsumption, chooseFrequencyLevel, chooseIdentityLevel,
} from './frequencies.js';
import {
  reglaLegumbreActiva, sortearDiasLegumbre, elegirSegundo, claveSegundo, infraccionesD099,
} from './legumbre.js';

/** D-107: cenas de huevo por semana como mucho, con dieta vegetariana (decisión de Javi). */
export const TOPE_CENAS_HUEVO = 3;

function selectRng(seed) {
  return mulberry32(seedFromString(`${seed}::walk::select`));
}

function findDish(catalog, id) {
  const dish = catalog.find((d) => d.id === id);
  if (!dish) {
    throw new Error(`runWalk: plato no encontrado en catalogo, id=${JSON.stringify(id)}`);
  }
  return dish;
}

function slotKey(day, momento) {
  return `${day}::${momento}`;
}

const FILL_RE = /^(.+)\/(comida|cena) <- (.+)$/;
const DISCARD_RE = /^(\S+) queda SIN/;

/**
 * Reformatea una entrada del decisionLog de expandWeekArc (P1a) al shape
 * unificado de este modulo, SIN perder causas: una colocacion se
 * convierte en entrada de relleno (day/momento/plato); un evento sin
 * colocacion (colision_sin_hueco) se conserva como entrada de evento
 * (evento:true, sin plato/momento) — no se descarta (D-019, correccion 2).
 */
function reshapeP1aEntry(entry) {
  const fillMatch = entry.consequence.match(FILL_RE);
  if (fillMatch) {
    const [, day, momento, plato] = fillMatch;
    return {
      decisionId: entry.decisionId,
      day,
      momento,
      plato,
      causa: entry.cause,
      evidencia: entry.evidence,
      alternativasDescartadas: [],
    };
  }
  const discardMatch = entry.consequence.match(DISCARD_RE);
  return {
    decisionId: entry.decisionId,
    day: discardMatch ? discardMatch[1] : undefined,
    momento: undefined,
    plato: undefined,
    causa: entry.cause,
    evidencia: entry.evidence,
    alternativasDescartadas: [],
    evento: true,
  };
}

/**
 * Rellena los huecos abiertos que expandWeekArc (P1a) deja tras colocar
 * ancla+sobras. No reestructura P1a, no lo modifica: lo consume tal cual.
 *
 * fuenteEditorial (D-036, dato de entrada del walk, OPCIONAL): ausente ⇒
 * comportamiento identico al actual (todas las composiciones resuelven sin
 * fuente, C2/no-regresion). Este modulo NUNCA la carga de disco -- la
 * recibe por inyeccion del caller y la reenvia a los DOS productores de
 * vista que gobierna (computeVetoUniverse, vistaPorDefecto vía
 * initFrequencyState/registerConsumption/chooseFrequencyLevel/
 * chooseIdentityLevel -- paso 5, D-044, mismo productor, cero nueva
 * entrada en la allowlist); el tercer productor (anchorVista) vive en
 * buildWeekArc.js, fuera de este modulo.
 * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number|string), memoryStore?: object, profile?: {intolerances?: string[]}, fuenteEditorial?: {version: number, confirmed: object}}} input
 * @returns {{slots: object[], segundos: {day: string, momento: 'comida', dishId: string, primero: string}[], decisionLog: object[]}}
 */
export function runWalk(input) {
  // Red de seguridad de la regla de legumbre (D-116.5; decision de Javi del
  // 2026-11-15). El segundo añade apariciones de proteina a la semana; en un
  // catalogo con pocas especies puede dejarla con alguna infraccion de
  // D-099.3, o gastar el ultimo plato que valia para un hueco posterior. En
  // los dos casos el walk se repite ENTERO con la regla de D-116 y D-117
  // apagada, con la misma seed: sin dias de legumbre sorteados, sin segundos y
  // con el paso 4 de D-024 como antes. Repetir sin segundos pero con los dias
  // sorteados dejaba la legumbre como plato unico esos dias, y la proteina
  // peor que sin la regla (medido: scripts/banco/medicion/estructura-comida-final/variantes-red.md).
  // Por D-099.3, solo si habia algun segundo: sin ellos no hay nada que retirar.
  // Por pool vacio, siempre que la regla estuviera activa, aunque no se hubiera
  // colocado ningun segundo (decision de Javi del 2026-11-17): la regla cambia
  // que platos se gastan, y la semana sin ella puede no quedarse sin platos.
  //
  // Orden de las redes. Cada intento, con la regla o sin ella, pasa por la red
  // del filtro de familia (walkConRedDeFamilia): primero con el filtro y, solo
  // si el walk se queda sin platos y el filtro habia descartado algo, sin el.
  // La red de la regla mira lo que sale de ahi (la semana, o el fallo por pool
  // vacio) y, si repite, la repeticion EMPIEZA OTRA VEZ CON el filtro de
  // familia. No hay bucle: son llamadas fijas, sin recursion. Como mucho 4
  // walks por semana (con la regla: con filtro y sin el; sin la regla: con
  // filtro y sin el). Las dos causas no se suman: el intento con la regla o
  // falla o devuelve una semana. La semana sin la regla ya no se repite.
  const intentos = [];
  let resultado;
  try {
    resultado = walkConRedDeFamilia(input, { sinRegla: false, intentos });
  } catch (err) {
    if (!(err && err.poolVacio && err.reglaActiva)) throw conWalks(err, intentos);
    try {
      return repetirSinRegla(input, intentos, {
        causa: 'regla_legumbre_retirada_pool_vacio',
        motivo: err.segundosColocados > 0
          ? `con los segundos el walk se quedaba sin platos (${err.message})`
          : `con la regla (dias de legumbre sorteados, sin ningun segundo colocado) el walk se quedaba sin platos (${err.message})`,
        dias: err.diasLegumbre || [],
      });
    } catch (err2) {
      if (err2 && err2.poolVacio) err2.segundosColocadosConLaRegla = err.segundosColocados;
      throw conWalks(err2, intentos);
    }
  }
  // Solo con la regla en marcha (dias de legumbre sorteados): sin ella no hay segundos ni red (D-116.9, D-117).
  const sorteo = resultado.decisionLog.find((e) => e.causa === 'dias_legumbre_sorteados');
  if (!sorteo) return resultado;
  const infracciones = infraccionesD099(input, resultado);
  if (!infracciones.length) return resultado;
  if (!resultado.segundos.length) return anotarInfraccion(resultado, infracciones, 'infraccion_d099_sin_segundos', 'sin ningun segundo: la red de D-116.5 solo actua si los habia');
  const familiaRetirada = resultado.decisionLog.some((e) => e.causa === 'familia_dias_seguidos_retirada');
  return repetirSinRegla(input, intentos, {
    causa: 'regla_legumbre_retirada_d099',
    motivo: `con los segundos la semana incumplia D-099.3 (${infracciones.join('; ')})`
      + (familiaRetirada ? '; la semana descartada ya se habia rehecho sin el filtro de familia, y la repeticion vuelve a empezar con el' : ''),
    dias: sorteo.dias,
    extra: { infracciones, semanaDescartada: { familiaRetirada } },
  });
}

const describirWalks = (intentos) => intentos.map((x) => `${x.sinRegla ? 'sin' : 'con'} la regla, ${x.sinFamilia ? 'sin' : 'con'} filtro de familia`);
// El fallo que sale de runWalk lleva los walks que se intentaron (diagnostico; como mucho 4).
function conWalks(err, intentos) {
  if (err && typeof err === 'object') err.walks = describirWalks(intentos);
  return err;
}

// La repeticion de la red: la semana entera con la regla de D-116 y D-117 apagada.
function repetirSinRegla(input, intentos, { causa, motivo, dias, extra = {} }) {
  const semana = walkConRedDeFamilia(input, { sinRegla: true, intentos });
  semana.decisionLog.push({
    decisionId: `walk-select-${semana.decisionLog.length}`,
    day: undefined,
    momento: undefined,
    plato: undefined,
    causa,
    evidencia: `${motivo}; se repite el walk entero con la regla de D-116 y D-117 apagada, con la misma semilla: `
      + `sin dias de legumbre sorteados (eran [${dias.join(', ')}]), sin segundos y con el paso 4 de D-024 como antes`,
    alternativasDescartadas: [],
    evento: true,
    diasDescartados: dias,
    ...extra,
    walks: describirWalks(intentos),
  });
  const quedan = infraccionesD099(input, semana);
  return quedan.length
    ? anotarInfraccion(semana, quedan, 'infraccion_d099_regla_retirada', 'con la regla de D-116 y D-117 apagada: la red ya no repite mas')
    : semana;
}

// Una semana que termina con infracciones de D-099.3 que la red no arregla
// (no tenia segundos, o ya se repitio con la regla apagada). No se repite
// nada; queda en el log con su propia causa.
function anotarInfraccion(resultado, infracciones, causa, detalle) {
  resultado.decisionLog.push({
    decisionId: `walk-select-${resultado.decisionLog.length}`,
    day: undefined,
    momento: undefined,
    plato: undefined,
    causa,
    evidencia: `la semana incumple D-099.3 (${infracciones.join('; ')}) ${detalle}; la semana se queda asi`,
    alternativasDescartadas: [],
    evento: true,
    infracciones,
  });
  return resultado;
}

function walkConRedDeFamilia(input, { sinRegla, intentos = [] }) {
  // Red de seguridad del filtro de familia (decision de Javi, 2026-11-13).
  // Ese filtro mira un hueco cada vez: en un catalogo muy corto puede gastar
  // antes de tiempo los platos que valian para un hueco posterior y dejarlo
  // sin ninguno. Si el walk falla por pool vacio y el filtro habia descartado
  // algun candidato, se repite ENTERO sin el filtro (misma seed: mismo
  // resultado siempre) antes de propagar el fallo, y se dice en el log.
  const uso = { familiaDescarto: false };
  try {
    intentos.push({ sinRegla, sinFamilia: false });
    return walkUnaVez(input, { sinFamilia: false, uso, sinRegla });
  } catch (err) {
    if (!(err && err.poolVacio) || !uso.familiaDescarto) throw err;
    intentos.push({ sinRegla, sinFamilia: true });
    const resultado = walkUnaVez(input, { sinFamilia: true, uso: { familiaDescarto: false }, sinRegla });
    resultado.decisionLog.push({
      decisionId: `walk-select-${resultado.decisionLog.length}`,
      day: undefined,
      momento: undefined,
      plato: undefined,
      causa: 'familia_dias_seguidos_retirada',
      evidencia: `con el filtro «familia en dias seguidos» el walk se quedaba sin platos (${err.message}); `
        + 'se repite la semana entera sin ese filtro, antes de dar el fallo por bueno',
      alternativasDescartadas: [],
      evento: true,
    });
    return resultado;
  }
}

function walkUnaVez(input, { sinFamilia, uso, sinRegla }) {
  // input.memoryStore se recibe por inyeccion y NUNCA se lee ni se invoca aqui (D-019, v13):
  // no se desestructura para que quede estructuralmente imposible tocarlo por accidente.
  const {
    weekArc, catalog, seed, profile, fuenteEditorial, platosRecientes = [], maxRepeticiones = 1,
  } = input;
  // Prototipo (visor): platos servidos la semana anterior quedan fuera de los pools.
  // Se compara por nombre visible: dos ids con el mismo nombre son el mismo plato para el usuario.
  // Sin nombre (catalogos sinteticos de test), la clave es el id.
  const nombrePorId = new Map(catalog.map((d) => [d.id, d.nombre || d.id]));
  const recientes = new Set(platosRecientes.map((id) => nombrePorId.get(id) ?? id));
  const usedNames = new Set();
  const protPorId = new Map(catalog.map((d) => [d.id, d]));
  const protMemo = new Map();
  const famMemo = new Map();
  const familiaCache = (id) => { if (!famMemo.has(id)) famMemo.set(id, protPorId.has(id) ? familiaProteica(protPorId.get(id)) : null); return famMemo.get(id); };
  const proteinaCache = (id) => { if (!protMemo.has(id)) protMemo.set(id, protPorId.has(id) ? proteinaPrincipal(protPorId.get(id)) : null); return protMemo.get(id); };
  const { slots: p1aSlots, decisionLog: p1aRawLog } = expandWeekArc({ weekArc, catalog, seed, platosRecientes, intolerancias: profile?.intolerances ?? [] });

  const slots = new Map();
  for (const slot of p1aSlots) slots.set(slotKey(slot.day, slot.momento), { ...slot });

  const usedIds = new Set();
  for (const slot of slots.values()) {
    if (!slot.abierto && slot.dishId) { usedIds.add(slot.dishId); usedNames.add(nombrePorId.get(slot.dishId)); }
  }

  const decisionLog = p1aRawLog.map(reshapeP1aEntry);
  const rng = selectRng(seed);

  const intolerancias = profile?.intolerances ?? [];
  const { vetoedIds, conteo: conteoVetos, activo: vetoActivo } = computeVetoUniverse(catalog, intolerancias, { fuenteEditorial });

  // Dias de legumbre (D-117): se sortean con la semilla antes de elegir nada.
  // Solo dietas omnivoras; null si la regla no actua (dieta, o perfil sin
  // platos compuestos de legumbre).
  // Con sinRegla (la repeticion de la red de D-116.5) la regla esta apagada: ni sorteo, ni segundos.
  const legumbre = !sinRegla && reglaLegumbreActiva(profile)
    ? sortearDiasLegumbre({
      p1aSlots, catalog, vetoedIds, seed,
      registrar: (causa, evidencia, extra = {}) => decisionLog.push({
        decisionId: `walk-select-${decisionLog.length}`, day: undefined, momento: undefined, plato: undefined, causa, evidencia, alternativasDescartadas: [], evento: true, ...extra,
      }),
    })
    : null;

  // Paso 4 (frecuencias, D-024): el estado arranca desde lo que P1a ya
  // coloco (ancla + sobras tambien son consumo, asiento 5).
  const freqState = initFrequencyState(p1aSlots, undefined, fuenteEditorial);

  function pushFill(day, momento, dishId, causa, evidencia, alternativasDescartadas) {
    const key = slotKey(day, momento);
    slots.set(key, { ...slots.get(key), dishId, abierto: false });
    usedIds.add(dishId);
    usedNames.add(nombrePorId.get(dishId));
    const dish = findDish(catalog, dishId);
    decisionLog.push({
      decisionId: `walk-select-${decisionLog.length}`,
      day,
      momento,
      plato: dishId,
      causa,
      evidencia,
      alternativasDescartadas,
      energiaCocina: dish.energiaCocina,
    });
  }

  // D-117.2, modificado (decision de Javi del 2026-11-17): dentro del nivel de
  // legumbre de un dia sorteado, y antes de las preferencias A y B, se prefiere
  // un primero cuya legumbre no salga ya en la semana (en ningun plato servido,
  // los del ancla incluidos) y, despues, uno cuyo aliño no lleve ya otro primero
  // de la semana. Cada preferencia es un filtro con vuelta atras: si dejaria el
  // hueco sin candidatos no se aplica, y las dos dejan su causa en el log. Sin
  // pesos. La sugerencia de la comida libre no es un plato servido.
  function preferirPrimero(day, candidatos) {
    const servidos = [...slots.values()].filter((s2) => !s2.abierto && s2.dishId && !(s2.fixedRole === 'libre' && s2.momento === 'comida'));
    let c = candidatos;
    const legUsadas = new Set(servidos.map((s2) => proteinaCache(s2.dishId)).filter(Boolean));
    const sinLeg = c.filter((d) => !legUsadas.has(proteinaCache(d.id)));
    if (sinLeg.length && sinLeg.length < c.length) {
      pushEvent(day, 'primero_legumbre_no_usada', `primero: descarta ${c.length - sinLeg.length} de ${c.length} candidatos de legumbre que ya salen esta semana (${[...legUsadas].join(', ')})`);
      c = sinLeg;
    } else if (!sinLeg.length) {
      pushEvent(day, 'primero_legumbre_no_usada_sin_aplicar', 'primero: todas las legumbres candidatas ya salen esta semana; no se aplica');
    }
    const primeros = servidos.filter((s2) => s2.momento === 'comida' && !s2.segundo && protPorId.has(s2.dishId) && esCompuestoLegumbre(protPorId.get(s2.dishId)));
    const alinos = new Set(primeros.map((s2) => alinoDe(protPorId.get(s2.dishId))).filter(Boolean));
    const sinAlino = c.filter((d) => !alinos.has(alinoDe(d)));
    if (sinAlino.length && sinAlino.length < c.length) {
      pushEvent(day, 'primero_alino_no_usado', `primero: descarta ${c.length - sinAlino.length} de ${c.length} candidatos con un aliño que ya sale en otro primero (${[...alinos].join(', ')})`);
      c = sinAlino;
    } else if (!sinAlino.length) {
      pushEvent(day, 'primero_alino_no_usado_sin_aplicar', 'primero: todos los candidatos llevan un aliño que ya sale; no se aplica');
    }
    return c;
  }

  function pushEvent(day, causa, evidencia) {
    decisionLog.push({
      decisionId: `walk-select-${decisionLog.length}`,
      day,
      momento: undefined,
      plato: undefined,
      causa,
      evidencia,
      alternativasDescartadas: [],
      evento: true,
    });
  }

  // Segundo de un primero de legumbre (D-116): la legumbre compuesta no va
  // como plato unico. Vale para la que elige el walk y para la que coloco el
  // ancla; nunca para la sugerencia de la comida libre (D-114). El segundo se
  // come: cuenta para los suelos, la verdura del dia y la identidad.
  function segundoDe(day, i, slot, primeroId) {
    if (!legumbre || slot.fixedRole === 'libre') return;
    const primero = protPorId.get(primeroId);
    if (!primero || !esCompuestoLegumbre(primero)) return;
    const elegido = elegirSegundo({
      rng: legumbre.rng, primero, day, i, slots, catalog, usedIds, usedNames, recientes, vetoedIds, sinFamilia, uso,
      proteinaDe: proteinaCache,
      familiaDe: familiaCache,
      alinoDe: (id) => (protPorId.has(id) ? alinoDe(protPorId.get(id)) : null),
      topeProteina: TOPE_PROTEINA_SEMANA,
      topeAjillo: TOPE_AJILLO_SEMANA,
      esSegundo: esSegundoDeLegumbre,
      nivelIdentidad: (candidatos) => chooseIdentityLevel({ candidatesFinal: candidatos, state: freqState, fuenteEditorial }),
      decisionLog,
      registrar: pushEvent,
    });
    if (elegido) registerConsumption(freqState, elegido, day, undefined, fuenteEditorial);
  }

  function getDishAt(day, momento) {
    const slot = slots.get(slotKey(day, momento));
    if (!slot || slot.abierto || !slot.dishId) return null;
    return findDish(catalog, slot.dishId);
  }

  // ─── VETOS (paso 2, D-022) ───────────────────────────────────────────
  // Causa UNA VEZ por construccion de universo, no por hueco: los vetados
  // existieron cero veces en el espacio de decision, no "se descartaron"
  // hueco a hueco.
  if (vetoActivo) {
    const resumenPorCampo = intolerancias
      .map((campo) => `${campo}: ${conteoVetos[campo].valor} por valor + ${conteoVetos[campo].desconocida} por desconocida`)
      .join('; ');
    pushEvent(
      undefined,
      'veto_universo_reducido',
      `intolerancias=[${intolerancias.join(', ')}]; ${vetoedIds.size} platos excluidos del espacio de decision del walk `
        + `(rol="rotativo"/"capricho") antes de cualquier construccion de pool; ${resumenPorCampo}`,
    );
  }

  // ─── CAPRICHO ────────────────────────────────────────────────────────
  const caprichoSlot = [...slots.values()].find((s) => s.slotRole === 'capricho');
  if (caprichoSlot) {
    const caprichoDay = caprichoSlot.day;
    const caprichoPool = catalog.filter((d) => d.rol === 'capricho' && !usedIds.has(d.id) && !usedNames.has(d.nombre || d.id) && !vetoedIds.has(d.id) && !recientes.has(d.nombre || d.id));

    if (caprichoPool.length === 0) {
      pushEvent(
        caprichoDay,
        'capricho_degradado_a_rotativo',
        `pool de rol="capricho" vacio en el catalogo (0 candidatos sin usar); `
          + `ambos huecos de ${caprichoDay} se procesan como rotativo normal en la cascada generica`,
      );
    } else {
      let chosen;
      let causaDish;
      let evidenciaDish;
      let alternativasDish;
      if (caprichoPool.length === 1) {
        [chosen] = caprichoPool;
        causaDish = 'capricho_candidato_unico';
        evidenciaDish = `unico candidato rol="capricho" disponible: "${chosen.id}"`;
        alternativasDish = [];
      } else {
        const idx = Math.floor(rng() * caprichoPool.length);
        chosen = caprichoPool[idx];
        causaDish = 'capricho de la semana';
        evidenciaDish = `RNG namespace "::walk::select" -> indice ${idx} de ${caprichoPool.length} candidatos rol="capricho"`;
        alternativasDish = caprichoPool.filter((d) => d.id !== chosen.id).map((d) => d.id);
      }

      let momento;
      let evidenciaMomento;
      if (chosen.momento.length === 1) {
        [momento] = chosen.momento;
        evidenciaMomento = `momento unico: "${momento}"`;
      } else {
        const idx = Math.floor(rng() * MOMENTOS.length);
        momento = MOMENTOS[idx];
        evidenciaMomento = `momento ambiguo; RNG namespace "::walk::select" -> indice ${idx} de ${MOMENTOS.length} (${MOMENTOS.join(', ')}) -> "${momento}"`;
      }

      pushFill(caprichoDay, momento, chosen.id, causaDish, `${evidenciaDish}; ${evidenciaMomento}`, alternativasDish);
      registerConsumption(freqState, chosen, caprichoDay, undefined, fuenteEditorial); // asiento 5: capricho tambien es consumo
    }
  }

  // ─── GENERICO (rotativo, incluye hermanos de ancla/capricho y capricho
  // degradado) ────────────────────────────────────────────────────────
  for (let i = 0; i < DAYS_ORDER.length; i++) {
    const day = DAYS_ORDER[i];
    for (const momento of MOMENTOS) {
      const key = slotKey(day, momento);
      const slot = slots.get(key);
      if (!slot.abierto) { // Paso 1: ya colocado, la cadena no corre.
        if (momento === 'comida') segundoDe(day, i, slot, slot.dishId);
        continue;
      }
      // La comida del dia libre es una sugerencia, no un plato servido (D-099.3.i, D-114).
      const esSugerencia = slot.fixedRole === 'libre' && momento === 'comida';

      let pool = catalog.filter((d) => d.rol === 'rotativo' && d.momento.includes(momento) && !usedIds.has(d.id) && !usedNames.has(d.nombre || d.id) && !vetoedIds.has(d.id) && !recientes.has(d.nombre || d.id));
      // D-107: con un catálogo muy corto (dieta vegana y sin soja, p. ej.) la
      // app puede pedir que un plato se repita en la semana, hasta
      // maxRepeticiones veces y nunca dos veces el mismo día. Solo si no
      // queda ningún plato sin repetir; se dice en el log.
      if (pool.length === 0 && maxRepeticiones > 1) {
        const veces = new Map();
        const hoy = new Set();
        for (const s2 of slots.values()) {
          if (s2.abierto || !s2.dishId) continue;
          veces.set(s2.dishId, (veces.get(s2.dishId) || 0) + 1);
          if (s2.day === day) hoy.add(s2.dishId);
        }
        pool = catalog.filter((d) => d.rol === 'rotativo' && d.momento.includes(momento) && !vetoedIds.has(d.id)
          && !hoy.has(d.id) && (veces.get(d.id) || 0) < maxRepeticiones);
        if (pool.length) pushEvent(day, 'repeticion_por_catalogo_corto', `${day}/${momento}: no queda ningún plato sin repetir; se admite repetir (hasta ${maxRepeticiones} veces por semana): ${pool.length} candidatos`);
      }
      if (pool.length === 0) {
        const errPool = new Error(
          `runWalk: pool rotativo vacio para ${day}/${momento} `
            + `(rol="rotativo", momento admite "${momento}", excluidos los ids ya usados en la semana y los vetados)`,
        );
        errPool.poolVacio = true; // lo leen la red del filtro de familia y la de los segundos
        errPool.segundosColocados = [...slots.values()].filter((s) => s.segundo).length;
        errPool.diasLegumbre = legumbre ? [...legumbre.dias] : [];
        errPool.reglaActiva = !!legumbre; // con la regla apagada (o sin compuestos de legumbre) no hay sorteo
        throw errPool;
      }

      // Prototipo (visor): tope de proteina principal por semana. Si dejaria el
      // hueco sin candidatos, no se aplica y se dice en la evidencia.
      const cuentaProteina = new Map();
      for (const s2 of slots.values()) {
        if (s2.abierto || !s2.dishId) continue;
        const pr = proteinaCache(s2.dishId);
        if (pr) cuentaProteina.set(pr, (cuentaProteina.get(pr) || 0) + 1);
      }
      const poolTope = pool.filter((d) => (cuentaProteina.get(proteinaCache(d.id)) || 0) < TOPE_PROTEINA_SEMANA);
      const notaTope = poolTope.length === pool.length
        ? ''
        : poolTope.length
          ? `tope de proteina (${TOPE_PROTEINA_SEMANA}/semana): descarta ${pool.length - poolTope.length} candidatos de ${[...cuentaProteina].filter(([, n]) => n >= TOPE_PROTEINA_SEMANA).map(([pr]) => pr).join(', ')}; `
          : `tope de proteina sin aplicar: dejaria el hueco sin candidatos; `;

      // Prototipo (visor): una proteina que ya sale ese dia, el anterior o el
      // siguiente no se repite aqui (separar las dos veces de la semana). Si no
      // queda ningun candidato, no se aplica y se dice en la evidencia.
      const base0 = poolTope.length ? poolTope : pool;
      const cercanas = new Set();
      for (const s2 of slots.values()) {
        if (s2.abierto || !s2.dishId) continue;
        if (Math.abs(DAYS_ORDER.indexOf(s2.day) - i) <= 1) {
          const pr = proteinaCache(s2.dishId);
          if (pr) cercanas.add(pr);
        }
      }
      const poolSeparado = base0.filter((d) => !cercanas.has(proteinaCache(d.id)));
      const notaSeparada = poolSeparado.length === base0.length
        ? ''
        : poolSeparado.length
          ? `proteina separada: descarta ${base0.length - poolSeparado.length} candidatos de ${[...cercanas].join(', ')} (ya salen ese dia o el de al lado); `
          : 'proteina separada sin aplicar: dejaria el hueco sin candidatos; ';

      // D-107 (dieta vegetariana): huevo como mucho una vez al dia y en como
      // mucho TOPE_CENAS_HUEVO cenas por semana. Si dejaria el hueco sin
      // candidatos, no se aplica y se dice.
      // Familia en dias seguidos (decision de Javi, 2026-11-13; extiende
      // D-099.3.e): una familia proteica (proteinType, con pescado y marisco
      // como una sola) que ya sale el dia anterior o el siguiente no se repite
      // aqui. Solo dietas omnivoras. No mira el mismo dia. La sugerencia de la
      // comida libre no es un plato servido: ni se filtra ni cuenta como
      // vecina. Los platos del ancla los coloca P1a y no pasan por aqui. Si no
      // queda ningun candidato, no se aplica y se dice en la evidencia.
      const baseF = poolSeparado.length ? poolSeparado : base0;
      let baseH = baseF;
      let notaFamilia = '';
      if (!sinFamilia && profile?.dieta !== 'vegetariana' && profile?.dieta !== 'vegana' && !esSugerencia) {
        const familiasCercanas = new Set();
        for (const s2 of slots.values()) {
          if (s2.abierto || !s2.dishId) continue;
          if (s2.fixedRole === 'libre' && s2.momento === 'comida') continue;
          if (Math.abs(DAYS_ORDER.indexOf(s2.day) - i) !== 1) continue;
          const fam = familiaCache(s2.dishId);
          if (fam) familiasCercanas.add(fam);
        }
        const poolFamilia = baseF.filter((d) => !familiasCercanas.has(familiaCache(d.id)));
        if (poolFamilia.length === baseF.length) notaFamilia = '';
        else if (poolFamilia.length) {
          baseH = poolFamilia;
          uso.familiaDescarto = true;
          notaFamilia = `familia en dias seguidos: descarta ${baseF.length - poolFamilia.length} candidatos de ${[...familiasCercanas].join(', ')} (ya salen el dia de al lado); `;
        } else notaFamilia = `familia en dias seguidos sin aplicar: dejaria el hueco sin candidatos (${[...familiasCercanas].join(', ')} ya salen el dia de al lado); `;
      }
      let poolHuevo = baseH;
      let notaHuevo = '';
      if (profile?.dieta === 'vegetariana') {
        let huevoHoy = false;
        let cenasHuevo = 0;
        for (const s2 of slots.values()) {
          if (s2.abierto || !s2.dishId || proteinaCache(s2.dishId) !== 'huevo') continue;
          if (s2.day === day) huevoHoy = true;
          if (s2.momento === 'cena') cenasHuevo += 1;
        }
        const sinHuevo = huevoHoy || (momento === 'cena' && cenasHuevo >= TOPE_CENAS_HUEVO);
        if (sinHuevo) {
          const f = baseH.filter((d) => proteinaCache(d.id) !== 'huevo');
          const motivo = huevoHoy ? 'ya sale huevo hoy' : `ya hay ${cenasHuevo} cenas de huevo esta semana`;
          if (f.length === baseH.length) notaHuevo = '';
          else if (f.length) { poolHuevo = f; notaHuevo = `huevo: descarta ${baseH.length - f.length} candidatos (${motivo}); `; } else notaHuevo = `huevo sin aplicar (${motivo}): dejaria el hueco sin candidatos; `;
        }
      }

      // D-105 (aliños): el mismo aliño no sale en la comida y la cena del mismo
      // dia, y el ajillo sale como mucho TOPE_AJILLO_SEMANA veces por semana.
      // Si dejaria el hueco sin candidatos, no se aplica y se dice.
      const base1 = poolHuevo;
      const alinosHoy = new Set();
      let ajillosSemana = 0;
      for (const s2 of slots.values()) {
        if (s2.abierto || !s2.dishId) continue;
        const al = alinoDe(findDish(catalog, s2.dishId));
        if (!al) continue;
        if (s2.day === day) alinosHoy.add(al);
        if (al === 'ajillo') ajillosSemana += 1;
      }
      const poolAlino = base1.filter((d) => {
        const al = alinoDe(d);
        return !al || (!alinosHoy.has(al) && !(al === 'ajillo' && ajillosSemana >= TOPE_AJILLO_SEMANA));
      });
      const notaAlino = poolAlino.length === base1.length
        ? ''
        : poolAlino.length
          ? `alino: descarta ${base1.length - poolAlino.length} candidatos (${[
            alinosHoy.size ? `alino ya servido hoy: ${[...alinosHoy].join(', ')}` : '',
            ajillosSemana >= TOPE_AJILLO_SEMANA ? `ajillo ya sale ${ajillosSemana}/${TOPE_AJILLO_SEMANA} esta semana` : '',
          ].filter(Boolean).join('; ')}); `
          : 'alino sin aplicar: dejaria el hueco sin candidatos; ';

      const ayer = i > 0 ? getDishAt(DAYS_ORDER[i - 1], momento) : null;
      let candidatesA = poolAlino.length ? poolAlino : base1;
      // Dia de legumbre (D-117.2, modifica D-024): en la comida de un dia
      // sorteado, el nivel de legumbre (platos compuestos de legumbre) va
      // ANTES que las preferencias A y B y que la verdura del dia. A y B
      // siguen actuando dentro del nivel, con su vuelta atras. Sin candidato,
      // el hueco sigue como siempre y el log lo dice. (El dia libre nunca se
      // sortea: un dia de legumbre no es la sugerencia.)
      let nivelLegumbre = null;
      if (legumbre && momento === 'comida' && legumbre.dias.has(day)) {
        const nivel = candidatesA.filter(esCompuestoLegumbre);
        if (nivel.length) {
          nivelLegumbre = { candidatos: nivel.length, de: candidatesA.length };
          candidatesA = preferirPrimero(day, nivel);
        } else {
          pushEvent(day, 'dia_legumbre_sin_candidato', `${day} es dia de legumbre, pero ninguno de los ${candidatesA.length} candidatos del hueco (tras no repetir plato, tope y separacion por proteina, familia y alino) es un compuesto de legumbre; el hueco sigue con el paso 4 de siempre`);
        }
      }
      let notaA;
      if (!ayer) {
        notaA = `preferencia A no aplica: no hay dia anterior en la semana para ${day}/${momento}`;
      } else {
        const afterA = candidatesA.filter((d) => d.plateType !== ayer.plateType);
        if (afterA.length > 0) {
          candidatesA = afterA;
          notaA = `preferencia A aplicada: descarta plateType="${ayer.plateType}" (igual que ayer en ${momento})`;
        } else {
          notaA = `preferencia A satisfecha por imposibilidad: los ${pool.length} candidatos comparten plateType="${ayer.plateType}" con ayer`;
        }
      }

      const anteayer = i > 1 ? getDishAt(DAYS_ORDER[i - 2], momento) : null;
      // La sugerencia de la comida libre no es una comida servida (decision de
      // Javi, 2026-11-14; amplia D-114): B no la cuenta como comida anterior.
      // Con ella como «ayer» o «anteayer» no hay racha de dos comidas servidas.
      const diaSugerenciaPrevia = [i - 1, i - 2].filter((j) => j >= 0).map((j) => DAYS_ORDER[j])
        .find((d) => momento === 'comida' && slots.get(slotKey(d, momento))?.fixedRole === 'libre');
      let candidatesB = candidatesA;
      let notaB;
      if (diaSugerenciaPrevia) {
        notaB = `preferencia B no aplica: la comida del ${diaSugerenciaPrevia} es la sugerencia de la comida libre, no una comida servida`;
      } else if (!ayer || !anteayer || ayer.tempFeel !== anteayer.tempFeel) {
        notaB = `preferencia B no aplica: no hay racha de 2 dias previos con el mismo tempFeel en ${momento}`;
      } else {
        const objetivoTempFeel = ayer.tempFeel;
        const afterB = candidatesA.filter((d) => d.tempFeel !== objetivoTempFeel);
        if (afterB.length > 0) {
          candidatesB = afterB;
          notaB = `preferencia B aplicada: descarta tempFeel="${objetivoTempFeel}" (evitaria 3 consecutivos en ${momento})`;
        } else {
          notaB = `preferencia B satisfecha por imposibilidad: los ${candidatesA.length} candidatos post-A tienen tempFeel="${objetivoTempFeel}", igual que los 2 dias previos`;
        }
      }

      // Paso 4 (frecuencias, D-024): opera sobre candidatesB (post A/B),
      // ANTES del desempate final -- el RNG solo ve el nivel ganador.
      //
      // Sugerencia de la comida libre (decision de Javi, 2026-11-13): la
      // comida del dia libre no se sirve; el plato elegido queda solo como
      // sugerencia (materializePlan lo marca `libre`, D-099.3.i). No es
      // consumo: el paso 4 no la dirige, y mas abajo no sube los contadores
      // de los suelos ni marca la verdura del dia. Sigue en usedIds/usedNames
      // (no repetir plato) y cuenta para el tope y la separacion por proteina.
      // (esSugerencia se calcula al abrir el hueco.)
      //
      // Con dias de legumbre sorteados (D-117): en la comida de un dia
      // sorteado el nivel ya esta fijado arriba (antes de A y B) y el paso 4
      // no vuelve a partir; en los demas huecos el suelo semanal de legumbre
      // no actua, y el dia de al lado de uno sorteado no lleva legumbre a la
      // comida si quedan otros candidatos (sustituye, para la legumbre, a la
      // veda de D-024).
      let paso4;
      if (esSugerencia) paso4 = { nivel: candidatesB, causa: null, evidencia: null };
      else if (nivelLegumbre) {
        paso4 = {
          nivel: candidatesB,
          causa: 'dia_legumbre_sorteado',
          evidencia: `paso 4: ${day} es dia de legumbre (sorteado con la semilla); nivel preferente = ${nivelLegumbre.candidatos} compuestos de legumbre de ${nivelLegumbre.de} candidatos, fijado antes que las preferencias A y B y que la verdura del dia; ${candidatesB.length} tras A y B`,
        };
      } else if (legumbre) {
        let baseB = candidatesB;
        const vecino = momento === 'comida' && [i - 1, i + 1].some((j) => j >= 0 && j < DAYS_ORDER.length && legumbre.dias.has(DAYS_ORDER[j]));
        if (vecino) {
          const sin = candidatesB.filter((d) => familiaCache(d.id) !== 'legumbre');
          if (sin.length && sin.length < candidatesB.length) baseB = sin;
        }
        paso4 = chooseFrequencyLevel({
          day, candidatesB: baseB, state: freqState, fuenteEditorial, suelosInactivos: ['legumbre'],
        });
        if (baseB !== candidatesB) {
          paso4 = {
            ...paso4,
            causa: paso4.causa || 'vecino_de_dia_legumbre',
            evidencia: `${paso4.evidencia ? `${paso4.evidencia}; ` : 'paso 4: '}nivel preferente sin legumbre (${baseB.length} de ${candidatesB.length} candidatos post-A/B): el dia de al lado es dia de legumbre`,
          };
        }
      } else {
        paso4 = chooseFrequencyLevel({
          day, candidatesB, state: freqState, fuenteEditorial,
        });
      }
      const { nivel: candidatesFinal, causa: causaFreq, evidencia: notaFreq } = paso4;
      const notaSugerencia = esSugerencia
        ? '; sugerencia de la comida libre: no es consumo (no cuenta para los suelos semanales ni para la verdura del dia; el paso 4 no la dirige)'
        : '';

      // Paso 5 (identidad de verdura, D-044): opera sobre candidatesFinal
      // (post paso4), ANTES del desempate final -- mismo principio que
      // paso4: el RNG solo ve el nivel ganador. Paso separado del de
      // frecuencias (ejes independientes, D-044 punto 5): lee freqState
      // pero nunca lo muta (chooseIdentityLevel es de solo lectura).
      const { nivel: candidatesIdentidad, causa: causaIdentidad, evidencia: notaIdentidad } = chooseIdentityLevel({
        candidatesFinal, state: freqState, fuenteEditorial,
      });

      let chosen;
      let causa;
      let alternativas;
      let notaRng = '';
      if (candidatesIdentidad.length === 1) {
        [chosen] = candidatesIdentidad;
        causa = 'seleccion_rotativo_candidato_unico';
        alternativas = [];
      } else {
        const idx = Math.floor(rng() * candidatesIdentidad.length);
        chosen = candidatesIdentidad[idx];
        causa = 'seleccion_rotativo_desempate_rng';
        alternativas = candidatesIdentidad.filter((d) => d.id !== chosen.id).map((d) => d.id);
        notaRng = `; RNG namespace "::walk::select" -> indice ${idx} de ${candidatesIdentidad.length} candidatos equivalentes tras pool+A+B${causaFreq ? '+paso4' : ''}${causaIdentidad ? '+paso5' : ''}`;
      }

      pushFill(
        day,
        momento,
        chosen.id,
        causa,
        `${notaTope}${notaSeparada}${notaFamilia}${notaHuevo}${notaAlino}${notaA}; ${notaB}${notaSugerencia}${notaFreq ? `; ${notaFreq}` : ''}${notaIdentidad ? `; ${notaIdentidad}` : ''}${notaRng}`,
        alternativas,
      );
      if (!esSugerencia) registerConsumption(freqState, chosen, day, undefined, fuenteEditorial);
      if (momento === 'comida' && !esSugerencia) segundoDe(day, i, slot, chosen.id);
    }
  }

  // Paso 4 (frecuencias, D-024 addendum): narracion de la neutralizacion,
  // UNA VEZ por walk (no por hueco) -- si algun id resulto irresoluble
  // (tolerancia de resolveFrequencyVista), se registra aqui con el conteo
  // y los ids, para que un id corrupto de catalogo real (riesgo nombrado
  // en D-024) sea visible en vez de deslizarse en silencio como neutral.
  if (freqState.idsIrresolubles.size > 0) {
    const ids = [...freqState.idsIrresolubles].sort();
    pushEvent(
      undefined,
      'paso4_ids_irresolubles',
      `${ids.length} id(s) no resolubles por CompositionResolver (origen indeterminado) fueron tratados `
        + `como vista neutral (sin cobertura de target ni verdura) por el paso 4: [${ids.join(', ')}]`,
    );
  }

  const orderedSlots = DAYS_ORDER.flatMap((day) => MOMENTOS.map((momento) => slots.get(slotKey(day, momento))));

  // Segundos (D-116): no son huecos; van aparte, en orden de dia.
  const segundos = DAYS_ORDER.map((day) => slots.get(claveSegundo(day))).filter(Boolean)
    .map((s) => ({ day: s.day, momento: s.momento, dishId: s.dishId, primero: s.primero }));

  return { slots: orderedSlots, segundos, decisionLog };
}
