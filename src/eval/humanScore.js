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

export function humanScore(plan, { history } = {}) {
  return {
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
  };
}
