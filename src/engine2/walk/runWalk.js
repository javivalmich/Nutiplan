// Seleccion del walk — Fase 4, Componente P1b. Entrada: {weekArc, catalog,
// seed, memoryStore}. Salida: {slots, decisionLog}. Rellena los huecos que
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
//       - Paso 6: 1 candidato final -> directo, sin RNG. >1 -> RNG
//         (stream "::walk::select"). El RNG NUNCA ve el pool pre-filtros:
//         solo los candidatos que sobreviven pool+no-repeticion+A+B.
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
 * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number|string), memoryStore?: object}} input
 * @returns {{slots: object[], decisionLog: object[]}}
 */
export function runWalk(input) {
  // input.memoryStore se recibe por inyeccion y NUNCA se lee ni se invoca aqui (D-019, v13):
  // no se desestructura para que quede estructuralmente imposible tocarlo por accidente.
  const { weekArc, catalog, seed } = input;
  const { slots: p1aSlots, decisionLog: p1aRawLog } = expandWeekArc({ weekArc, catalog, seed });

  const slots = new Map();
  for (const slot of p1aSlots) slots.set(slotKey(slot.day, slot.momento), { ...slot });

  const usedIds = new Set();
  for (const slot of slots.values()) {
    if (!slot.abierto && slot.dishId) usedIds.add(slot.dishId);
  }

  const decisionLog = p1aRawLog.map(reshapeP1aEntry);
  const rng = selectRng(seed);

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

  // ─── CAPRICHO ────────────────────────────────────────────────────────
  const caprichoSlot = [...slots.values()].find((s) => s.slotRole === 'capricho');
  if (caprichoSlot) {
    const caprichoDay = caprichoSlot.day;
    const caprichoPool = catalog.filter((d) => d.rol === 'capricho' && !usedIds.has(d.id));

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

      const pool = catalog.filter((d) => d.rol === 'rotativo' && d.momento.includes(momento) && !usedIds.has(d.id));
      if (pool.length === 0) {
        throw new Error(
          `runWalk: pool rotativo vacio para ${day}/${momento} `
            + `(rol="rotativo", momento admite "${momento}", excluidos los ids ya usados en la semana)`,
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

      let chosen;
      let causa;
      let alternativas;
      let notaRng = '';
      if (candidatesB.length === 1) {
        [chosen] = candidatesB;
        causa = 'seleccion_rotativo_candidato_unico';
        alternativas = [];
      } else {
        const idx = Math.floor(rng() * candidatesB.length);
        chosen = candidatesB[idx];
        causa = 'seleccion_rotativo_desempate_rng';
        alternativas = candidatesB.filter((d) => d.id !== chosen.id).map((d) => d.id);
        notaRng = `; RNG namespace "::walk::select" -> indice ${idx} de ${candidatesB.length} candidatos equivalentes tras pool+A+B`;
      }

      pushFill(day, momento, chosen.id, causa, `${notaA}; ${notaB}${notaRng}`, alternativas);
    }
  }

  const orderedSlots = DAYS_ORDER.flatMap((day) => MOMENTOS.map((momento) => slots.get(slotKey(day, momento))));

  return { slots: orderedSlots, decisionLog };
}
