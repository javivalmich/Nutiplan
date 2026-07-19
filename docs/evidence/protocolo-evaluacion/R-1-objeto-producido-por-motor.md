# R-1 — Reconocimiento (solo lectura): objeto producido por cada motor como resultado de la generación del plan

- **Estado del repo en el que se ejecutó:** `main @ cd10667`
- **Fecha de ejecución:** 2026-07-19
- **Anclaje normativo:** `DECISIONS.md:2335` (D-048, punto 3): *"La definición formal de ese objeto en cada motor no forma parte de esta decisión y queda encomendada al reconocimiento R-1 del Frente B."*
- **Anclaje disparador:** `docs/evidence/protocolo-evaluacion/R-B1-representacion-consumida-evaluacion.md` — demostró que la forma observable del objeto queda remitida a este trabajo.

---

## R-1 — Reconocimiento (solo lectura): objeto producido por cada motor como resultado de la generación del plan

**Anclaje normativo:** `DECISIONS.md:2335` (D-048, punto 3): *"La definición formal de ese objeto en cada motor no forma parte de esta decisión y queda encomendada al reconocimiento R-1 del Frente B."*
**Anclaje disparador:** `docs/evidence/protocolo-evaluacion/R-B1-representacion-consumida-evaluacion.md`.
**Precondición.** `git log -1` → `main @ cd10667`. Cumplida.

---

### Legacy (`src/engine/`)

**Punto(s) de producción.** Superficie única: `buildPlan()`, `buildPlan.js:33`. Re-exportada sin alteración por el barrel público: `index.js:26`. Ninguna otra función exportada del archivo produce un plan (`WEEKLY_CAP`, `deriveTempFeel` no lo son). Sin ambigüedad de superficie.

**Artefacto producido.** Objeto plano en el `return` final:
```
buildPlan.js:2808-2815
return { days, strategy, weekWarnings: validation.warnings, weekProblems: validation.problems,
  weekScore: validation.score, ...(QA_TRACE ? { qaTrace: {...} } : {}) };
```

**Descripción del objeto:**
- `days` (`buildPlan.js:2268`): un elemento por día, dos puntos de construcción textualmente idénticos (`:2319` y `:2508`): `{name, id, special, mood, effectiveMood, meals, shakeEnabled}`.
  - `meals` (`:2492-2503`): array de 2 a 5 elementos según `mealsPerDay`, cada uno producido por `composeMeal()` (`:356`) o por un `build()` estático. Forma observada (`:1106-1111`): `{time, emoji, title, p1, p2, shopping:[], recipe:[], metadata:{facilidad, tiempo, familiar}}`. Rama `freeForm` de `composeMeal` construye su propio `metadata` (`:393-410`) con claves adicionales (`saciedad`, `comfort`, `plateType`, condicionalmente `glutenFreeAdapted`).
- `strategy` (`:2810`): `computeStrategy(profile)` (`:55`), importado de `nutrition.js`.
- `weekWarnings`/`weekProblems`/`weekScore`: renombrados desde `validateWeek(days)` (`:2807`, función interna no exportada, `:2518`), que retorna `{warnings, problems, score, _qaWeekValidation}` (`:2803`).
- `qaTrace` (`:2814`): condicional a `QA_TRACE`, `{weekValidation, smartPick}`.
- Sin anotación de tipo/schema/validación asociada al retorno en el archivo.

**Ambigüedades abiertas:** ninguna de superficie; las dos ramas de construcción de `days` no están colapsadas en un literal compartido.

---

### Engine2 (`src/engine2/`)

**Punto(s) de producción — tres superficies plausibles, sin resolver.** No existe `src/engine2/index.js`. Tres funciones exportadas en archivos distintos:
1. `buildWeekArc()` — `buildWeekArc.js:333`, retorna `{weekArc, decisionLog}` (`:428`).
2. `runWalk()` — `runWalk.js:181`, retorna `{slots, decisionLog}` (`:414`).
3. `materializePlan()` — `materializePlan.js:33`, invoca a las dos anteriores internamente (`:38-43`) y ensambla su propio retorno.

Ningún archivo agrupa las tres bajo una superficie única. Esta R no resuelve cuál constituye "el" resultado del motor.

**Artefactos y descripción:**

- **`buildWeekArc()`**: `weekArc` construido en `:420-426`: `{skeletonId, strategy, ...batchDay?, anchors, beats}`. El propio código anota `strategy` (`:422`): *"metadato pasivo: no participa en ninguna decision de arriba"*. `decisionLog`: entradas `{decisionId, cause, evidence, consequence}` (`:410-415`).

- **`runWalk()`**: `slots` = `orderedSlots` (`:412`), un elemento por `DAYS_ORDER × MOMENTOS` (`days.js:10-12`, `schema.js:19` → `['comida','cena']`). Forma de slot (`:207-209`): `{...slot, dishId, abierto:false}`. `decisionLog` mezcla tres formas de entrada: reshape P1a (`:138-150`) `{decisionId, day, momento, plato, causa, evidencia, alternativasDescartadas}`; `pushFill` (`:207-221`) añade `energiaCocina`; `pushEvent` (`:224-234`) añade `evento:true` con `momento`/`plato` en `undefined`.

- **`materializePlan()`**: única con anotación de tipo explícita en el código (`:26-32`):
  `@returns {{days: object[], strategy: string, weekWarnings: [], weekProblems: [], weekScore: null, decisionLog: object[]}}`.
  Retorno real (`:55-62`): `days` = `DAYS_ORDER.map(day => ({day, meals: MOMENTOS.map(momento => ({momento, dish: findDish(catalog, slot.dishId)}))}))` (`:47-53`); `strategy` = `weekArc.strategy` (el mismo valor "pasivo" de arriba); `weekWarnings`/`weekProblems` = literales `[]` fijos (`:58-59`); `weekScore` = literal `null` fijo (`:60`); `decisionLog` = `[...arcLog, ...walkLog]` (`:61`) — concatenación sin reshape: mezcla claves en inglés (`cause`, `evidence`) de `arcLog` con claves en español (`causa`, `evidencia`) de `walkLog`.

**Ambigüedades abiertas:**
- Tres superficies producen tres objetos distintos; ningún export central declara cuál es "el" resultado del motor.
- Solo `materializePlan()` coincide en claves de primer nivel con el contrato de shape (`CLAUDE.md:17-25`) — hecho de nombres, sin valorar equivalencia semántica.
- Heterogeneidad de forma en `decisionLog` (tres variantes de entrada, sin reshape entre `arcLog`/`walkLog`) registrada como hecho de construcción, sin calificarla.
- `dish` (dentro de `days[].meals[]`) es el objeto de catálogo resuelto por `findDish()` (`:18-24`); su esquema interno no se traza — fuera de esta superficie de producción.

---

**Cierre.** Legacy: superficie única, objeto único, descrito con citas. Engine2: tres superficies exportadas con objetos de forma distinta y sin punto de agregación público único en el repositorio; se describen las tres sin resolver cuál constituye "el" objeto producido por el motor.
