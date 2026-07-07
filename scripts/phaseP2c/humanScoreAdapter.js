// humanScoreAdapter.js — Fase 4, Componente P2c (D1). Traduce la salida de
// runWalk ({slots, decisionLog}) al contrato de reporte ratificado en
// DECISIONS.md (D-025): por cada submetrica de humanScore, terna
// {valor, cobertura, estado}, con motivo cuando estado !== "completa".
//
// NO importa src/eval/**: las submetricas medibles se implementan aqui
// directamente contra el contrato de engine2 (D-025) -- el instrumento
// evalua el contrato de engine2 sin depender de las asunciones
// estructurales del instrumento legacy (planReader.js/humanScore.js).
// Import legal de src/engine2/ desde scripts/ (precedente:
// scripts/phaseB1/runFrequencyCount.js:8).
//
// estado clasifica la OBSERVABILIDAD de la metrica en engine2, no el
// resultado de la ejecucion: un "no_observable" nunca es error, y la
// clasificacion de una submetrica no cambia segun el plan concreto que se
// mida (p. ej. continuidadEntrenoHidrato sigue "parcial" aunque el plan no
// tenga ningun dia de entreno).

import { resolveDishComposition } from '../../src/engine2/dishes/compositionResolver.js';
import { DAYS_ORDER } from '../../src/engine2/skeleton/days.js';

export const ESTADOS = Object.freeze({
  COMPLETA: 'completa',
  PARCIAL: 'parcial',
  NO_OBSERVABLE: 'no_observable',
  NEEDS_HISTORY: 'needs_history',
  NEEDS_ENGINE2: 'needs_engine2',
});

const DENSITY_VALUE = Object.freeze({ baja: 0, media: 1, alta: 2 });
const CUCHARA_TMPLS = new Set(['legumbre', 'sopa_crema']);

function findDish(catalog, id) {
  const dish = catalog.find((d) => d.id === id);
  if (!dish) {
    throw new Error(`humanScoreAdapter: plato no encontrado en catalogo, id=${JSON.stringify(id)}`);
  }
  return dish;
}

/**
 * Slots con plato colocado (dishId presente), cada uno con su vista de
 * composicion ya resuelta (resolveDishComposition, D-021). Base comun de
 * todas las submetricas medibles de este adaptador.
 */
function resolveFilledSlots(slots, catalog) {
  return slots
    .filter((s) => s.dishId)
    .map((s) => ({ ...s, vista: resolveDishComposition(findDish(catalog, s.dishId)) }));
}

function noObservableMetric(motivo) {
  return {
    valor: null, cobertura: { legibles: 0, total: 0 }, estado: ESTADOS.NO_OBSERVABLE, motivo,
  };
}
function needsHistoryMetric(motivo) {
  return {
    valor: null, cobertura: { legibles: 0, total: 0 }, estado: ESTADOS.NEEDS_HISTORY, motivo,
  };
}
function needsEngine2Metric(motivo) {
  return {
    valor: null, cobertura: { legibles: 0, total: 0 }, estado: ESTADOS.NEEDS_ENGINE2, motivo,
  };
}

// ─── densidadDiaria (completa: density simetrico para los 241, D-021) ───
function computeDensidadDiaria(filled, totalSlots) {
  const porDia = new Map(DAYS_ORDER.map((day) => [day, []]));
  for (const slot of filled) porDia.get(slot.day).push(slot.vista.density);

  const valor = {};
  for (const day of DAYS_ORDER) {
    const densidades = porDia.get(day);
    if (densidades.length < 2) {
      valor[day] = { status: 'unknown', density: null, classification: null };
      continue;
    }
    const density = densidades.reduce((sum, d) => sum + (DENSITY_VALUE[d] ?? 0), 0);
    const classification = density >= 3 ? 'denso' : density <= 1 ? 'ligero' : 'intermedio';
    valor[day] = { status: 'computed', density, classification };
  }

  return {
    valor,
    cobertura: { legibles: filled.length, total: totalSlots },
    estado: ESTADOS.COMPLETA,
  };
}

// ─── repeticionSalsa / repeticionTecnica (parcial: tupla solo scaffold) ─
function buildRepetitionMetric(filled, totalSlots, field) {
  const scaffold = filled.filter((s) => s.vista.origen === 'scaffold');
  const occurrences = new Map();
  for (const s of scaffold) {
    const value = s.vista.tupla[field];
    if (!value) continue;
    if (!occurrences.has(value)) occurrences.set(value, []);
    occurrences.get(value).push({ day: s.day, momento: s.momento });
  }
  const conteos = {};
  for (const [value, ocurrencias] of occurrences) conteos[value] = ocurrencias.length;

  return {
    valor: { conteos },
    cobertura: { legibles: scaffold.length, total: totalSlots },
    estado: ESTADOS.PARCIAL,
    motivo: `derivable_parcial: vocabulario de tupla (${field}) solo recuperable para origen scaffold via `
      + 'resolveDishComposition; freeform no declara tupla (D-021).',
  };
}

// ─── platoCuchara (parcial: tmpl solo scaffold) ─────────────────────────
function computePlatoCuchara(filled, totalSlots) {
  const scaffold = filled.filter((s) => s.vista.origen === 'scaffold');
  const ocurrencias = scaffold
    .filter((s) => CUCHARA_TMPLS.has(s.vista.tupla.tmpl))
    .map((s) => ({ day: s.day, momento: s.momento }));

  return {
    valor: { count: ocurrencias.length, ocurrencias },
    cobertura: { legibles: scaffold.length, total: totalSlots },
    estado: ESTADOS.PARCIAL,
    motivo: 'derivable_parcial: tmpl solo recuperable para origen scaffold via resolveDishComposition; '
      + 'freeform no declara tupla (D-021).',
  };
}

// ─── continuidadEntrenoHidrato (parcial: gate de dia simetrico, hidrato solo scaffold) ─
function computeContinuidadEntrenoHidrato(filled) {
  const entrenoCenas = filled.filter((s) => s.momento === 'cena' && s.fixedRole === 'entreno');

  if (entrenoCenas.length === 0) {
    return {
      valor: null,
      cobertura: { legibles: 0, total: 0 },
      estado: ESTADOS.PARCIAL,
      motivo: 'derivable_parcial: no hay cenas con fixedRole="entreno" en este plan (gate de dia simetrico, '
        + 'lado-plato/hidrato solo recuperable para origen scaffold).',
    };
  }

  const detalle = entrenoCenas.map((s) => (
    s.vista.origen === 'scaffold'
      ? {
        day: s.day, status: 'computed', tieneHidrato: !!s.vista.tupla.C, carb: s.vista.tupla.C || null,
      }
      : {
        day: s.day, status: 'unknown', tieneHidrato: null, carb: null,
      }
  ));
  const legibles = detalle.filter((d) => d.status === 'computed');
  const conHidrato = legibles.filter((d) => d.tieneHidrato).length;

  return {
    valor: {
      diasEntrenamiento: entrenoCenas.length, conHidrato, deTotalLegibles: legibles.length, detalle,
    },
    cobertura: { legibles: legibles.length, total: entrenoCenas.length },
    estado: ESTADOS.PARCIAL,
    motivo: 'derivable_parcial: lado-plato (hidrato, tupla.C) solo recuperable para origen scaffold via '
      + 'resolveDishComposition; el gate de dia (fixedRole="entreno") es simetrico.',
  };
}

/**
 * Adapta la salida de runWalk ({slots, decisionLog} -- decisionLog no se usa
 * aqui) al contrato de reporte D-025: terna {valor, cobertura, estado} por
 * submetrica de humanScore, con motivo cuando estado !== "completa".
 * @param {{slots: object[], catalog: ReadonlyArray<object>}} input
 * @returns {object}
 */
export function adaptHumanScore({ slots, catalog }) {
  const filled = resolveFilledSlots(slots, catalog);
  const totalSlots = slots.length;

  return {
    densidadDiaria: computeDensidadDiaria(filled, totalSlots),
    repeticionSalsa: buildRepetitionMetric(filled, totalSlots, 'S'),
    repeticionTecnica: buildRepetitionMetric(filled, totalSlots, 'cookM'),
    platoCuchara: computePlatoCuchara(filled, totalSlots),
    continuidadEntrenoHidrato: computeContinuidadEntrenoHidrato(filled),

    domingoReconfortante: noObservableMetric(
      'no_observable: engine2 no tiene equivalente a day.effectiveMood (patron "comfort domingo" del motor '
        + 'viejo); ningun campo de slot/weekArc lo deriva.',
    ),
    diaFacilTrasElaborado: noObservableMetric(
      'no_observable: engine2 no tiene equivalente a meal.metadata.facilidad; el esquema de Dish '
        + '(schema.js, 10 campos) no lo declara.',
    ),

    repeticionProteinaMismoDia: needsHistoryMetric(
      'needs_history: requiere historico multi-semana (proteina del mismo dia en semanas previas); sin '
        + 'MemoryStore (Fase 5) no hay historico que leer.',
    ),
    sorpresaEditorial: needsHistoryMetric(
      'needs_history: requiere historico multi-semana para comparar contra semanas previas; sin '
        + 'MemoryStore (Fase 5) no hay historico que leer.',
    ),

    usoSobrasVidaUtil: needsEngine2Metric(
      'needs_engine2: requiere modelar sobras/aprovechamiento a traves de MemoryStore (Fase 5); el walk '
        + 'actual es stateless (R4).',
    ),
    alternanciaBatch: needsEngine2Metric(
      'needs_engine2: requiere modelar cocinado por lotes a traves de MemoryStore (Fase 5); el walk actual '
        + 'es stateless (R4).',
    ),
    coherenciaCompraPerecederos: needsEngine2Metric(
      'needs_engine2: requiere modelar compra/caducidad a traves de MemoryStore (Fase 5); el walk actual es '
        + 'stateless (R4).',
    ),
  };
}
