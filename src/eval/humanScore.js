// humanScore — métricas humanas (termómetro, no termostato; CLAUDE.md regla 2).
// Lee el objeto `plan` ya construido por el motor (viejo o engine2) y nunca
// decide nada: prohibido importar desde src/engine/ ni src/engine2/
// (vigilado por tripwire-reverse-isolation.test.js).
//
// Firma estable: humanScore(plan, { history } = {}). Hoy `history` va vacío
// y las sub-métricas que lo requieren quedan en stub ("needs_history"); cuando
// exista MemoryStore (Fase 5) se enchufa ahí sin cambiar esta firma.
//
// Cada sub-métrica devuelve { valor, status, evidencias[], polarity }, con
// status ∈ {"computed", "needs_history", "needs_engine2"}. humanScore NUNCA
// devuelve un escalar agregado ni un score global — solo el objeto completo,
// con claves estables y orden determinista (apto para snapshot).

import { computeRepeticionSalsa, computeRepeticionTecnica } from './metrics/repetition.js';
import { computePlatoCuchara } from './metrics/cuchara.js';
import { computeDensidadDiaria, computeDomingoReconfortante, computeDiaFacilTrasElaborado } from './metrics/arc.js';
import { computeContinuidadEntrenoHidrato } from './metrics/continuidad.js';

export function humanScore(plan, { history } = {}) {
  return {
    repeticionSalsa: computeRepeticionSalsa(plan),
    repeticionTecnica: computeRepeticionTecnica(plan),
    platoCuchara: computePlatoCuchara(plan),
    densidadDiaria: computeDensidadDiaria(plan),
    domingoReconfortante: computeDomingoReconfortante(plan),
    diaFacilTrasElaborado: computeDiaFacilTrasElaborado(plan),
    continuidadEntrenoHidrato: computeContinuidadEntrenoHidrato(plan),

    // Multi-semana — fuera de scope en Fase 0.5 (decisión: Opción B). No se
    // genera memoria artificial, pastProteins ni semanas sintéticas.
    repeticionProteinaMismoDia: {
      valor: null,
      status: 'needs_history',
      polarity: null,
      evidencias: [
        'Requiere histórico multi-semana (proteína del mismo día en semanas previas). Fuera de scope en Fase 0.5.',
      ],
    },
    sorpresaEditorial: {
      valor: null,
      status: 'needs_history',
      polarity: null,
      evidencias: [
        'Requiere histórico multi-semana para comparar contra semanas previas y detectar variación editorial. Fuera de scope en Fase 0.5.',
      ],
    },

    // ── needs_engine2 ────────────────────────────────────────────────────
    // Conceptos sin observable en el objeto `plan` actual (regla de
    // honestidad de métricas: no se inventan proxies heurísticos). Grep
    // sobre src/engine/buildPlan.js confirma que no existe ningún campo de
    // sobras/aprovechamiento/lote/caducidad — cada meal y su shopping list
    // son independientes, sin relación entre días ni entre semanas. Solo
    // engine2 (con MemoryStore/decisionLog) podría modelar esto de forma
    // honesta, registrando la causa de cada decisión.
    usoSobrasVidaUtil: { valor: null, status: 'needs_engine2', polarity: null, evidencias: [] },
    alternanciaBatch: { valor: null, status: 'needs_engine2', polarity: null, evidencias: [] },
    coherenciaCompraPerecederos: { valor: null, status: 'needs_engine2', polarity: null, evidencias: [] },
  };
}
