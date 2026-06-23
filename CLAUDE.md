# CLAUDE.md — Constitución del proyecto

> Este archivo gobierna **todas** las sesiones de Claude Code en este repo. Léelo entero al empezar cada sesión. Si una instrucción de sesión contradice este archivo, gana este archivo y avísame.

## Qué es este proyecto
App de menús diarios/semanales personalizados. El motor actual (`buildPlan.js`) puntúa y selecciona comidas. Estamos construyendo un motor nuevo (`engine2/`) que **simula decisión humana experta** en vez de optimizar: narrativa → platos → raciones → verificación nutricional. Migración por **patrón estrangulador**: el motor viejo sigue sirviendo usuarios hasta que el nuevo gana una evaluación ciega.

## Constitución de engine2 (innegociable)
1. **Prohibido `score`, ranking, top-N o agregación numérica de candidatos** en `src/engine2/`. Solo: filtros (vetos), prioridades ordenadas (primera respuesta válida gana) y desempates con RNG sembrado. Vigilado por tripwire de CI.
2. **`eval/` jamás se importa desde `engine2/`.** Las métricas humanas miden, no deciden. Termómetro, no termostato. Vigilado por tripwire de CI.
3. **Toda decisión registra su causa** en el decision log. Una elección sin causa textual es un bug.
4. **Archivo canónico del motor viejo: `buildPlan.js`.** `main_buildPlan_tmp.js` está DEPRECATED: no se lee, no se edita, no se importa.
5. **Motor viejo congelado:** ninguna heurística nueva ni evolución de las existentes (`weeklySaucePen` y compañía quedan como están). Solo se tocan los bugs listados en la Fase 1.
6. **Determinismo:** misma seed → mismo plan, byte a byte, en ambos motores. `seed = hash(userId + weekNumber)`.

## Contrato de shape entre motores
Ambos motores devuelven EXACTAMENTE estas claves (verificado en buildPlan.js:2780
y en los call-sites de producto):
{ days, strategy, weekWarnings, weekProblems, weekScore, decisionLog? }
- strategy y weekProblems: consumidos por OriginalPlanApp.jsx y NutritionistDashboard.jsx.
  engine2 DEBE emitirlos (aunque weekProblems vaya como []).
- weekScore: campo de COMPATIBILIDAD de display. engine2 NO puntúa; su valor en engine2
  se decide en Fase 7 (placeholder o derivado del contrato de reconcile). Allowlisted en el tripwire.
- decisionLog: opcional, solo engine2.

## Contrato MemoryStore (interfaz, sin implementación de storage)
```
getWeek(userId, weekNumber)        -> { plan, decisionLog } | null
saveWeek(userId, weekNumber, plan, decisionLog) -> void
getRepertoire(userId)              -> Dish[] | null
recordFeedback(userId, dishId, signal) -> void
```

## Normas de trabajo (cómo trabajamos Javi y Claude Code)
- **Una fase = una sesión = una rama = un PR.** Nombre de rama: `fase-N-descripcion`.
- **Criteria-first:** antes de implementar, propón el plan y la lista de tests, y espera visto bueno. Especialmente estricto en `reconcile` (Fase 5).
- **Audita lo que existe, no la intención inferida.** Si falta contexto, pregunta antes de concluir. No asumas comportamiento que no esté en el código.
- **Engagement punto por punto:** ante varias propuestas, responde a cada una por separado y surfacea desacuerdos razonados de forma explícita. No aceptes en bloque.
- **Idioma:** español en sesiones técnicas.

## Estructura objetivo
```
src/engine/        # motor viejo (buildPlan.js, nutrition.js, foods.js, ...)
src/engine/tests/  # tests vitest (importan '../X.js')
src/engine2/       # motor nuevo
src/eval/          # métricas humanas (humanScore) — NUNCA importado por engine2
archive/           # buildPlan.js viejo + tmp, al final (Fase 7)
```

## Comandos
- Tests: `npm test` (vitest run)
- Lint: `npm run lint`
- Un solo archivo de test: `npx vitest run src/engine/tests/<archivo>`

## Orden de fases (roadmap v2)
`0 → 0.5 → 1 → 3 → 2 (continua) → 4 → 5 → 6 → 7`
**Fase actual: 1.** No trabajes fases futuras en esta sesión.
