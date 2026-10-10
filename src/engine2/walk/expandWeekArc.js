// Expansion del walk — Fase 4, Componente P1a. Entrada: {weekArc, catalog,
// seed}. Salida: {slots, decisionLog}. Stateless, como buildWeekArc (R4):
// no importa MemoryStore, no importa eval/.
//
// weekArc.beats[] trae UNA entrada por dia (deuda registrada en F3, ver
// buildWeekArc.js). expandWeekArc parte cada beat en dos huecos
// {day, momento:"comida"} / {day, momento:"cena"} = 14 huecos. Este PR
// NO selecciona platos libres (P1b, PR siguiente): solo coloca el
// ancla y sus sobras segun la cascada de momento (D-018), y deja el
// resto ABIERTO.
//
// Cascada de momento (D-018, orden fijo, sin scoring):
//   0. Ancla en cookDay: momento unico del plato -> ese momento. Momento
//      ambos -> desempate por RNG namespace "::walk" (independiente de
//      "::skeleton"), causa en el log.
//   1. Sobra con momento unico -> ese momento (mismo plato que el ancla:
//      mismo set, sin necesidad de heredar nada).
//   2. Sobra con momento ambos -> HEREDA el momento YA resuelto para el
//      ancla del mismo anchor (sin nuevo sorteo).
//   3. Colision (dos colocaciones reclaman el mismo dia+momento): la
//      segunda en orden de procesamiento toma el momento restante SI su
//      propio set de momento lo admite; si no lo admite, esa colocacion
//      se descarta para ese dia (no se fuerza contra el set del plato
//      real). Causa en el log siempre, incluida la rama de descarte.
//
// momento es SIEMPRE un set (nunca escalar, ver BUG 6 / D-018): el orden
// de recorrido usa MOMENTOS (schema.js) para que el resultado no dependa
// del orden en que el catalogo escribio el array.

import { llevaBase, encajaYaCocinada } from '../dishes/bases.js';
import { evaluateVeto } from './vetoes.js';
import { DAYS_ORDER } from '../skeleton/days.js';
import { mulberry32, seedFromString } from '../skeleton/rng.js';
import { MOMENTOS } from '../dishes/schema.js';

function walkRng(seed) {
  return mulberry32(seedFromString(`${seed}::walk`));
}

function findDish(catalog, dishId) {
  const dish = catalog.find((d) => d.id === dishId);
  if (!dish) {
    throw new Error(`expandWeekArc: plato no encontrado en catalogo, id=${JSON.stringify(dishId)}`);
  }
  return dish;
}

function esAmbos(momento) {
  return momento.includes('comida') && momento.includes('cena');
}

function otroMomento(momento) {
  return momento === 'comida' ? 'cena' : 'comida';
}

function slotKey(day, momento) {
  return `${day}::${momento}`;
}

/**
 * Construye los 14 huecos base (7 dias x {comida, cena}), cada uno
 * heredando day/density/fixedRole del beat correspondiente. El marcado
 * de entreno (fixedRole="entreno") aplica UNICAMENTE a la cena (p2:
 * TRAINING_DINNERS sustituye la cena en buildPlan.js) -- la comida de un
 * dia de entreno queda sin fixedRole, abierta como cualquier otro hueco.
 * libre/familiar SI se propagan a ambos momentos: son caracter de dia
 * completo, no un override de una sola comida.
 * @param {object[]} beats
 * @returns {Map<string, object>} slotKey -> hueco
 */
function huecosBase(beats) {
  const slots = new Map();
  for (const beat of beats) {
    for (const momento of MOMENTOS) {
      const esCenaEntreno = beat.fixedRole === 'entreno' && momento === 'cena';
      const fixedRole = beat.fixedRole && (beat.fixedRole !== 'entreno' || esCenaEntreno)
        ? beat.fixedRole
        : undefined;
      slots.set(slotKey(beat.day, momento), {
        day: beat.day,
        momento,
        density: beat.density,
        ...(fixedRole ? { fixedRole } : {}),
        slotRole: beat.slotRole,
        abierto: true,
      });
    }
  }
  return slots;
}

/**
 * Expande weekArc a 14 huecos y coloca ancla+sobras segun la cascada de
 * momento. No selecciona platos libres (rotativo/capricho quedan
 * abiertos: son P1b).
 * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number|string)}} input
 * @returns {{slots: object[], decisionLog: object[]}}
 */
export function expandWeekArc({ weekArc, catalog, seed, platosRecientes = [], intolerancias = [] }) {
  const decisionLog = [];
  const slots = huecosBase(weekArc.beats);
  const occupied = new Set();
  const rng = walkRng(seed);

  function place(day, momento, dishId, cause, evidence) {
    const key = slotKey(day, momento);
    occupied.add(key);
    slots.set(key, {
      ...slots.get(key),
      dishId,
      abierto: false,
    });
    decisionLog.push({
      decisionId: `walk-${decisionLog.length}`,
      cause,
      evidence,
      consequence: `${day}/${momento} <- ${dishId}`,
    });
  }

  /**
   * Intenta colocar dishId en day/momentoDeseado. Si el hueco ya esta
   * ocupado (colision), prueba el momento restante SI el propio set de
   * momento del plato lo admite; si no, descarta la colocacion para ese
   * dia (paso 3 de la cascada). Devuelve el momento efectivo o null si se
   * descarto.
   */
  function colocar(day, momentoDeseado, dishMomento, dishId, causaDirecta, evidenciaDirecta) {
    const keyDirecta = slotKey(day, momentoDeseado);
    if (!occupied.has(keyDirecta)) {
      place(day, momentoDeseado, dishId, causaDirecta, evidenciaDirecta);
      return momentoDeseado;
    }

    const alt = otroMomento(momentoDeseado);
    const keyAlt = slotKey(day, alt);
    if (dishMomento.includes(alt) && !occupied.has(keyAlt)) {
      place(
        day, alt, dishId, 'colision_momento_restante',
        `${day}/${momentoDeseado} ya ocupado; momento de "${dishId}" admite "${alt}" y ese hueco esta libre`,
      );
      return alt;
    }

    decisionLog.push({
      decisionId: `walk-${decisionLog.length}`,
      cause: 'colision_sin_hueco',
      evidence: `${day}/${momentoDeseado} ya ocupado; momento de "${dishId}" = [${dishMomento.join(', ')}]`
        + (dishMomento.includes(alt) ? ` admite "${alt}" pero tambien esta ocupado` : ` no admite "${alt}"`),
      consequence: `${day} queda SIN la colocacion de "${dishId}" (ni ${momentoDeseado} ni ${alt} disponibles)`,
    });
    return null;
  }

  // Prototipo (visor): ancla = ingrediente base. Dia de cocinar: un plato que
  // lo lleva. Dia de sobra: OTRO plato que tambien lo lleva (para carne, uno
  // donde entre ya cocinada). Ningun plato de la semana anterior.
  const nombrePorId = new Map(catalog.map((d) => [d.id, d.nombre || d.id]));
  const recientes = new Set(platosRecientes.map((id) => nombrePorId.get(id) ?? id));
  const elegir = (lista) => lista[Math.floor(rng() * lista.length)];
  function colocarBase(day, dish, causa, evidencia) {
    const momentos = dish.momento.filter((m) => !occupied.has(slotKey(day, m))
      && slots.get(slotKey(day, m)).fixedRole !== 'entreno');
    if (!momentos.length) return null;
    const momento = momentos.length === 1 ? momentos[0] : elegir(momentos);
    place(day, momento, dish.id, causa, evidencia);
    return momento;
  }
  for (const anchor of weekArc.anchors) {
    if (anchor.base) {
      const disponibles = catalog.filter((d) => (d.rol === 'rotativo' || d.rol === 'ancla')
        && !recientes.has(d.nombre || d.id) && llevaBase(d, anchor.base)
        && evaluateVeto(d, intolerancias).length === 0);
      if (!disponibles.length) {
        decisionLog.push({ decisionId: `walk-${decisionLog.length}`, cause: 'ancla_base_sin_platos', evidence: `ningun plato con ${anchor.base} disponible`, consequence: 'semana sin ancla' });
        continue;
      }
      // Dia de cocinar con carne: un plato que cocina la pieza (no picada ni preparados).
      const paraCocinar = anchor.tipo === 'carne'
        ? disponibles.filter((d) => !/hamburguesa|nuggets|carpaccio|gyozas|croquetas|picada|al pastor|pizza|quesadilla|bao|wrap/i.test(d.nombre))
        : disponibles;
      const cabe = (d, day) => d.momento.some((m) => !occupied.has(slotKey(day, m)) && slots.get(slotKey(day, m)).fixedRole !== 'entreno');
      const diaPrimero = anchor.cocinadoAntes ? anchor.leftoverDays[0] : anchor.cookDay;
      const paraPrimero = (paraCocinar.length ? paraCocinar : disponibles).filter((d) => cabe(d, diaPrimero));
      if (!paraPrimero.length) {
        decisionLog.push({ decisionId: `walk-${decisionLog.length}`, cause: 'ancla_base_sin_platos', evidence: `ningun plato con ${anchor.base} cabe el ${diaPrimero}`, consequence: 'semana sin ancla' });
        continue;
      }
      const primero = elegir(paraPrimero);
      colocarBase(diaPrimero, primero, 'ancla_base_cocinado',
        anchor.cocinadoAntes
          ? `ancla de la semana: ${anchor.base}; cocinado el domingo anterior; primer plato que lo usa`
          : `ancla de la semana: ${anchor.base}; se cocina el ${anchor.cookDay}; ${disponibles.length} platos llevan ${anchor.base}`);
      for (const day of anchor.cocinadoAntes ? anchor.leftoverDays.slice(1) : anchor.leftoverDays) {
        let segundos = disponibles.filter((d) => d.nombre !== primero.nombre
          && cabe(d, day)
          && (anchor.tipo !== 'carne' || encajaYaCocinada(d)));
        const otroTipo = segundos.filter((d) => d.plateType !== primero.plateType);
        if (otroTipo.length) segundos = otroTipo;
        if (!segundos.length) {
          decisionLog.push({ decisionId: `walk-${decisionLog.length}`, cause: 'ancla_base_sin_segundo_plato', evidence: `ningun otro plato con ${anchor.base} encaja el ${day}`, consequence: `${day} sin aprovechamiento` });
          continue;
        }
        const segundo = elegir(segundos);
        colocarBase(day, segundo, 'ancla_base_aprovechado',
          `aprovecha el ${anchor.base} cocinado el ${anchor.cocinadoAntes ? 'domingo anterior' : anchor.cookDay} en otro plato; ${segundos.length} candidatos`
          + (anchor.tipo === 'carne' ? ' donde la carne entra ya cocinada' : ''));
      }
      continue;
    }
    const dish = findDish(catalog, anchor.anchorId);
    const ambos = esAmbos(dish.momento);

    // Paso 0: ancla en cookDay.
    let anchorMomento;
    if (!ambos) {
      anchorMomento = dish.momento[0];
      colocar(
        anchor.cookDay, anchorMomento, dish.momento, anchor.anchorId,
        'ancla_momento_unico',
        `plato "${anchor.anchorId}" solo admite momento=[${dish.momento.join(', ')}]`,
      );
    } else {
      const idx = Math.floor(rng() * MOMENTOS.length);
      anchorMomento = MOMENTOS[idx];
      colocar(
        anchor.cookDay, anchorMomento, dish.momento, anchor.anchorId,
        'ancla_desempate_rng',
        `plato "${anchor.anchorId}" admite ambos momentos; RNG namespace "::walk" -> indice ${idx} de ${MOMENTOS.length} (${MOMENTOS.join(', ')})`,
      );
    }

    // Pasos 1/2: sobras. El momento deseado nunca requiere nuevo sorteo:
    // unico -> su propio valor; ambos -> el momento YA resuelto del ancla.
    for (const day of anchor.leftoverDays) {
      if (!ambos) {
        colocar(
          day, dish.momento[0], dish.momento, anchor.anchorId,
          'sobra_momento_unico',
          `sobra de "${anchor.anchorId}" solo admite momento=[${dish.momento.join(', ')}]`,
        );
      } else {
        colocar(
          day, anchorMomento, dish.momento, anchor.anchorId,
          'sobra_hereda_momento_ancla',
          `sobra de "${anchor.anchorId}" admite ambos momentos; hereda "${anchorMomento}" del ancla cocinada en ${anchor.cookDay}`,
        );
      }
    }
  }

  const orderedSlots = DAYS_ORDER.flatMap((day) => MOMENTOS.map((momento) => slots.get(slotKey(day, momento))));

  return { slots: orderedSlots, decisionLog };
}
