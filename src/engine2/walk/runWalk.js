// Seleccion del walk — Fase 4, Componentes P1b + P2b-i (vetos duros,
// D-022) + P2b-ii (frecuencias, D-024). Entrada: {weekArc, catalog, seed, memoryStore, profile}. Salida:
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
//       - Paso 6: 1 candidato final (del nivel de paso 4) -> directo, sin
//         RNG. >1 -> RNG (stream "::walk::select"). El RNG NUNCA ve el
//         pool pre-filtros: solo los candidatos que sobreviven
//         pool+no-repeticion+A+B+paso4.
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
import { initFrequencyState, registerConsumption, chooseFrequencyLevel } from './frequencies.js';

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
 * initFrequencyState/registerConsumption/chooseFrequencyLevel); el tercer
 * productor (anchorVista) vive en buildWeekArc.js, fuera de este modulo.
 * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number|string), memoryStore?: object, profile?: {intolerances?: string[]}, fuenteEditorial?: {version: number, confirmed: object}}} input
 * @returns {{slots: object[], decisionLog: object[]}}
 */
export function runWalk(input) {
  // input.memoryStore se recibe por inyeccion y NUNCA se lee ni se invoca aqui (D-019, v13):
  // no se desestructura para que quede estructuralmente imposible tocarlo por accidente.
  const {
    weekArc, catalog, seed, profile, fuenteEditorial,
  } = input;
  const { slots: p1aSlots, decisionLog: p1aRawLog } = expandWeekArc({ weekArc, catalog, seed });

  const slots = new Map();
  for (const slot of p1aSlots) slots.set(slotKey(slot.day, slot.momento), { ...slot });

  const usedIds = new Set();
  for (const slot of slots.values()) {
    if (!slot.abierto && slot.dishId) usedIds.add(slot.dishId);
  }

  const decisionLog = p1aRawLog.map(reshapeP1aEntry);
  const rng = selectRng(seed);

  const intolerancias = profile?.intolerances ?? [];
  const { vetoedIds, conteo: conteoVetos, activo: vetoActivo } = computeVetoUniverse(catalog, intolerancias, { fuenteEditorial });

  // Paso 4 (frecuencias, D-024): el estado arranca desde lo que P1a ya
  // coloco (ancla + sobras tambien son consumo, asiento 5).
  const freqState = initFrequencyState(p1aSlots, undefined, fuenteEditorial);

  function pushFill(day, momento, dishId, causa, evidencia, alternativasDescartadas) {
    const key = slotKey(day, momento);
    slots.set(key, { ...slots.get(key), dishId, abierto: false });
    usedIds.add(dishId);
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
    const caprichoPool = catalog.filter((d) => d.rol === 'capricho' && !usedIds.has(d.id) && !vetoedIds.has(d.id));

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
      if (!slot.abierto) continue; // Paso 1: ya colocado, la cadena no corre.

      const pool = catalog.filter((d) => d.rol === 'rotativo' && d.momento.includes(momento) && !usedIds.has(d.id) && !vetoedIds.has(d.id));
      if (pool.length === 0) {
        throw new Error(
          `runWalk: pool rotativo vacio para ${day}/${momento} `
            + `(rol="rotativo", momento admite "${momento}", excluidos los ids ya usados en la semana y los vetados)`,
        );
      }

      const ayer = i > 0 ? getDishAt(DAYS_ORDER[i - 1], momento) : null;
      let candidatesA = pool;
      let notaA;
      if (!ayer) {
        notaA = `preferencia A no aplica: no hay dia anterior en la semana para ${day}/${momento}`;
      } else {
        const afterA = pool.filter((d) => d.plateType !== ayer.plateType);
        if (afterA.length > 0) {
          candidatesA = afterA;
          notaA = `preferencia A aplicada: descarta plateType="${ayer.plateType}" (igual que ayer en ${momento})`;
        } else {
          notaA = `preferencia A satisfecha por imposibilidad: los ${pool.length} candidatos comparten plateType="${ayer.plateType}" con ayer`;
        }
      }

      const anteayer = i > 1 ? getDishAt(DAYS_ORDER[i - 2], momento) : null;
      let candidatesB = candidatesA;
      let notaB;
      if (!ayer || !anteayer || ayer.tempFeel !== anteayer.tempFeel) {
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
      const { nivel: candidatesFinal, causa: causaFreq, evidencia: notaFreq } = chooseFrequencyLevel({
        day, candidatesB, state: freqState, fuenteEditorial,
      });

      let chosen;
      let causa;
      let alternativas;
      let notaRng = '';
      if (candidatesFinal.length === 1) {
        [chosen] = candidatesFinal;
        causa = 'seleccion_rotativo_candidato_unico';
        alternativas = [];
      } else {
        const idx = Math.floor(rng() * candidatesFinal.length);
        chosen = candidatesFinal[idx];
        causa = 'seleccion_rotativo_desempate_rng';
        alternativas = candidatesFinal.filter((d) => d.id !== chosen.id).map((d) => d.id);
        notaRng = `; RNG namespace "::walk::select" -> indice ${idx} de ${candidatesFinal.length} candidatos equivalentes tras pool+A+B${causaFreq ? '+paso4' : ''}`;
      }

      pushFill(day, momento, chosen.id, causa, `${notaA}; ${notaB}${notaFreq ? `; ${notaFreq}` : ''}${notaRng}`, alternativas);
      registerConsumption(freqState, chosen, day, undefined, fuenteEditorial);
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

  return { slots: orderedSlots, decisionLog };
}
