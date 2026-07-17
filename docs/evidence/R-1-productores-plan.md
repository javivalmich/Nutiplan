# Informe R-1 — Productores del plan (Frente B)

**HEAD de reconocimiento:** `6523de9`
**Instrumento:** lectura estática estricta, sin ejecución de motores
**Fecha:** 2026-07-17

Encomendado por D-048 (`DECISIONS.md:2348`, sección "Herencia"): documentar qué constituye
"el plan generado" en cada motor — qué produce cada uno, con qué campos y qué semántica
puede demostrarse mediante lectura estática. Sin comparar los dos motores; sin ejecutar
ningún motor.

---

## §1 Cimiento

- `git log -1` → HEAD = `6523de9` (merge de D-048). Confirmado antes de escribir este informe.
- `git status` → working tree limpio; rama `main` ahead of `origin/main` by 2 commits (no bloqueante).
- Contrato de shape normativo, `CLAUDE.md:17-25`:
  ```
  { days, strategy, weekWarnings, weekProblems, weekScore, decisionLog? }
  ```
  con las siguientes notas normativas literales: `strategy` y `weekProblems` consumidos por
  `OriginalPlanApp.jsx` y `NutritionistDashboard.jsx`; `weekScore` es campo de compatibilidad
  de display, engine2 no puntúa; `decisionLog` opcional, solo engine2.

---

## §2 Productor del plan en legacy

Legacy tiene **un productor de plan identificado**: la función que contiene el `buildPlan.js`
canónico (Constitución CLAUDE.md:12), ensamblado en tres niveles anidados más una pasada de
validación final.

### 2.1 Nivel semana — return final

`buildPlan.js:2807-2815`:
```js
var validation = validateWeek(days);
return {
  days:         days,
  strategy:     strategy,
  weekWarnings: validation.warnings,
  weekProblems: validation.problems,
  weekScore:    validation.score,
  ...(QA_TRACE ? { qaTrace: { weekValidation: validation._qaWeekValidation, smartPick: __qaSmartPickTraces } } : {}),
};
```
Coincide exactamente con el contrato de shape (`CLAUDE.md:18-20`) salvo por `qaTrace`, campo
adicional no normativo, condicionado a un flag de debug (`QA_TRACE`).

`strategy` se produce una sola vez, aguas arriba, por llamada directa: `buildPlan.js:55`,
`const strategy = computeStrategy(profile);` — productor único, sin ramas condicionales en
su asignación. Se consume después en heurísticas de puntuación del motor viejo (p. ej.
`buildPlan.js:1780`, `buildPlan.js:1794`) y se reexporta sin transformación en el return final.

### 2.2 Nivel día — `buildPlan.js:2268-2508`

El array `days` se construye con un único `.map()` sobre `dayNames`:
```js
const days = dayNames.map(function(day, _dayIdx){
  ...
  return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:..., mood:..., effectiveMood:...,
          meals:meals, shakeEnabled:...};
});
```
(apertura `:2268`, return del objeto día `:2508`). Cada objeto `day` es ensamblado a partir de
un array `meals` construido dentro del mismo closure según el número de comidas del día (`n`),
combinando hasta cinco funciones productoras de `meal` (desayuno, almuerzo, comida, merienda,
cena) seleccionadas por rama condicional (`buildPlan.js:2492-2503`).

### 2.3 Nivel meal — `composeMeal()` y tres productores adicionales

Productor principal: `composeMeal(spec)`, `buildPlan.js:356` en adelante. Contempla una rama
`freeForm` (`:359-`) que construye un objeto `metadata` completo, incluido `saciedad` derivado
de `behavior.satietyScore` (`:393-397`):
```js
var __ff_metadata = {
  saciedad: (__ff_behavior.satietyScore >= 4) ? "alta"
          : (__ff_behavior.satietyScore >= 3) ? "media"
          : "baja",
  facilidad: "media",
  ...
};
```

Tres productores adicionales de objetos `meal`, con **metadata reducida** respecto a
`composeMeal()`:
- Pool de desayunos (`ALL_BF_ENTRIES`, `buildPlan.js:1390` en adelante) — cada entrada tiene
  su propia función `fn` que retorna el objeto `meal`; no pasa por `composeMeal()`.
- Snacks de mañana/tarde (`SNACKS_AM`, `buildPlan.js:1122`; `SNACKS_PM`, `buildPlan.js:1138`) —
  objetos `meal` literales con `metadata:{facilidad, tiempo, familiar}` — **sin campo `saciedad`**.
- `libreComida()`, `buildPlan.js:1377-1385` — objeto `meal` literal para el día libre, con
  `metadata:{facilidad:"alta", tiempo:0, familiar:true}` — **sin campo `saciedad`**.

### 2.4 `validateWeek` — warnings/problems/score

`validateWeek(days)` es la pasada de integridad post-generación que produce el objeto
consumido en el return final (§2.1). Verificado el hueco de productor señalado en hallazgos
secundarios: en el cómputo de ritmo semanal, `buildPlan.js:2593-2602`, cada `meal` se lee por
`m.metadata.saciedad`, con un default explícito cuando el productor no lo emitió:
```js
var densities = meals.map(function(m){ return (m.metadata&&m.metadata.saciedad)||"media"; });
```
(`buildPlan.js:2597`). Esto confirma por lectura que el hueco está en los productores del §2.3
(pool de desayunos, snacks, `libreComida()`), no en `validateWeek`, que compensa con un valor
por defecto. El return de `validateWeek` (`warnings`, `problems`, `score`, `_qaWeekValidation`)
está en `buildPlan.js:2803`.

---

## §3 Productor del plan en engine2

### 3.1 No-localización verificada por triple vía

1. **Sin archivo en la raíz de `src/engine2/`**: `find src/engine2 -maxdepth 1 -type f` →
   único resultado `.gitkeep`. No existe un `buildPlan.js`/`index.js` equivalente que ensamble
   un objeto de plan.
2. **Sin clave `days:` construida fuera de tests**: búsqueda de `days:` en `src/engine2/` fuera
   de `tests/` no produce ningún archivo que construya esa clave como parte de un objeto de plan
   (los dos únicos hits, `inMemoryStore.test.js` y `dedup.snapshotConsistency.test.js`, son
   archivos de test sin relación con el contrato de shape).
3. **Sin importadores de engine2 fuera de engine2 en producción**: `grep` de imports reales de
   `engine2/` fuera de `src/engine2/` solo encuentra dos hits, ambos *strings* dentro de tests
   de tripwire de aislamiento (`src/engine/tests/tripwire-engine2-engine-isolation.test.js:67`,
   `src/engine/tests/tripwire-reverse-isolation.test.js:40`), no imports reales de módulos de
   producto.

Conclusión de la triple vía: en este HEAD, ningún código de producto invoca ni ensambla un
objeto que cumpla el contrato de shape desde `engine2/`.

### 3.2 La cadena `buildWeekArc` → `expandWeekArc` → `runWalk`

Existe una cadena de tres funciones que sí produce estructuras propias, verificadas por
lectura:

**`buildWeekArc`** (`src/engine2/skeleton/buildWeekArc.js:333-429`) retorna:
```js
return { weekArc, decisionLog };
```
(`:428`), con `weekArc` conteniendo `skeletonId`, `strategy`, `batchDay?`, `anchors`, `beats`.
`strategy` se asigna en la construcción de `weekArc` (`:422`) con comentario del propio código:
```js
strategy, // metadato pasivo: no participa en ninguna decision de arriba
```
Verificado: ninguna función posterior en la cadena (`expandWeekArc`, `runWalk`) lee `weekArc.strategy`
— se produce y no se propaga a ningún consumidor localizado.

**`expandWeekArc`** (`src/engine2/walk/expandWeekArc.js:97-`) recibe `weekArc` y produce `slots`
(vía `huecosBase(weekArc.beats)` más la función interna `place()`) y su propio `decisionLog`,
con entradas de shape `{decisionId, cause, evidence, consequence}` (`:111-116`).

**`runWalk`** (`src/engine2/walk/runWalk.js:181-415`) retorna:
```js
const orderedSlots = DAYS_ORDER.flatMap((day) => MOMENTOS.map((momento) => slots.get(slotKey(day, momento))));
return { slots: orderedSlots, decisionLog };
```
(`:412-414`) — un array plano de 14 huecos (7 días × 2 momentos). Internamente, `runWalk`
llama a `expandWeekArc` (`:187`) y **reshapea** sus entradas de `decisionLog` con
`reshapeP1aEntry` (`:197`, `decisionLog = p1aRawLog.map(reshapeP1aEntry)`), y luego añade sus
propias entradas con un shape distinto vía `pushFill` (`:212-221`):
```js
decisionLog.push({
  decisionId: `walk-select-${decisionLog.length}`,
  day, momento, plato: dishId, causa, evidencia, alternativasDescartadas,
  energiaCocina: dish.energiaCocina,
});
```
Este shape (`day/momento/plato/causa/evidencia/alternativasDescartadas/energiaCocina`) es
incompatible con el shape `{decisionId, cause, evidence, consequence}` de `buildWeekArc`/
`expandWeekArc`; la existencia de una función de reshape (`reshapeP1aEntry`) es evidencia
directa de que los dos shapes no nacieron unificados y requieren traducción explícita para
convivir dentro de un mismo array.

**Verificado que `runWalk` no se llama fuera de sus propios tests**: único conjunto de
importadores de `runWalk` en todo `src/`:
`runWalk.test.js`, `runWalk.identidad.test.js`, `runWalk.fuenteEditorial.test.js`,
`runWalk.frequencies.test.js`, todos bajo `src/engine2/walk/tests/`. Ningún módulo de producto
lo invoca.

### 3.3 `reconcile` ausente

`grep -rn "reconcile" src` (sin distinguir mayúsculas) solo produce dos comentarios, ninguno
código ejecutable: `buildPlan.js:2752` ("Macros reales → Fase 5 (reconcile)."),
`NutritionistDashboard.jsx:121` (comentario sobre "async reconcile from SDB"). No existe una
función `reconcile` implementada en este HEAD.

---

## §4 Significado demostrable por campo, cada motor por separado

### 4.1 Legacy

| Campo | Productor localizado | Semántica demostrable por lectura |
|---|---|---|
| `days` | `buildPlan.js:2268-2508` | Array de 7 objetos día, cada uno con `meals` ensamblado desde hasta 5 sub-productores |
| `strategy` | `buildPlan.js:55` (`computeStrategy(profile)`) | Productor único, sin ramas; consumido en heurísticas de puntuación (`:1780`, `:1794`) y reexportado sin transformación |
| `weekWarnings` / `weekProblems` / `weekScore` | `validateWeek(days)`, return en `buildPlan.js:2803` | Pasada de integridad post-generación; mapeados 1:1 al return final (`:2811-2813`) |
| `qaTrace` | `buildPlan.js:2790-2814` | Condicionado al flag `QA_TRACE`; no forma parte del contrato normativo de `CLAUDE.md:17-25` |
| `decisionLog` | — | No emitido por legacy en ningún camino localizado; contractualmente opcional y exclusivo de engine2 (`CLAUDE.md:25`) |

Hueco de productor constatado: `meal.metadata.saciedad` no está garantizado en los objetos
`meal` producidos por el pool de desayunos, snacks o `libreComida()` (§2.3); el consumidor
(`validateWeek`, `:2597`) compensa con un default `"media"`. Es un hueco en el productor, no en
el consumidor.

### 4.2 Engine2

| Campo | Productor localizado | Semántica demostrable por lectura |
|---|---|---|
| `days` | Ninguno | Ausencia constatada por triple vía (§3.1) |
| `strategy` | `buildWeekArc.js:422` | Se produce, pero el propio código lo marca "metadato pasivo"; no propagado a ningún objeto de plan (no existe tal objeto) |
| `weekWarnings` / `weekProblems` / `weekScore` | Ninguno | No se ha localizado un equivalente a `validateWeek` en engine2 |
| `decisionLog` | Dos productores parciales, no fusionados en un `decisionLog` de plan | `buildWeekArc`+`expandWeekArc` producen shape `{decisionId, cause, evidence, consequence}`; `runWalk` produce un tercer array que reshapea el anterior (`reshapeP1aEntry`) y le añade entradas de shape distinto (`pushFill`, `pushEvent`). Ninguno de los dos es "el decisionLog del plan": `runWalk` no se llama en producción (§3.2) |

---

## §5 Clasificación epistemológica

**Legacy — Tabla A** (productor único, directo, verificado por lectura, sin condicionales
relevantes en la asignación):
- `days` (`buildPlan.js:2268-2508`)
- `strategy` (`buildPlan.js:55`)
- `weekWarnings`, `weekProblems`, `weekScore` (`validateWeek`, `buildPlan.js:2803`, mapeados en `:2811-2813`)

**Legacy — Tabla B** (productor verificado, pero semántica parcial o dependiente de ramas /
huecos compensados aguas abajo):
- `meal.metadata.saciedad`: productor garantizado solo en la rama `freeForm` de `composeMeal()`
  (`:393-397`); ausente en pool de desayunos, snacks y `libreComida()` (§2.3); compensado por
  default en el consumidor (`:2597`). Hueco en el productor, no en el consumidor.

**Legacy — Tabla C** (presentes en el objeto retornado pero fuera del contrato normativo, o
contractualmente opcionales y nunca emitidos):
- `qaTrace`: emitido condicionalmente bajo `QA_TRACE`; no listado en `CLAUDE.md:17-25`.
- `decisionLog`: contractualmente opcional y "solo engine2" (`CLAUDE.md:25`); legacy no lo
  emite en ningún camino localizado.

**Engine2 — Tabla D** (todos los campos del contrato de shape):
- `days`: sin productor localizado — ausencia constatada por lectura estática en este HEAD, **no
  imposibilidad conceptual** del motor.
- `strategy`: producido (`buildWeekArc.js:422`) pero pasivo; no propagado — no hay objeto de
  plan al que propagarlo.
- `weekWarnings` / `weekProblems` / `weekScore`: sin productor localizado.
- `decisionLog`: dos productores parciales de shapes incompatibles, sin fusión en un
  `decisionLog` único de plan; el candidato más cercano (`runWalk`) no tiene call-sites de
  producción.

**Fila de excepción** (aplica a toda la Tabla D): la ausencia de productor para un campo en
engine2 es un hallazgo de reconocimiento sobre el estado actual del código (`6523de9`), no una
afirmación sobre lo que engine2 puede o no puede producir en el futuro. Ningún campo de la
Tabla D fue clasificado como "requiere ejecución" — todos son ausencias verificables por
lectura estática sola.

---

## §6 Aplicación de la regla de parada por elemento

Regla de parada aplicada: para cada campo del contrato de shape, la clasificación se detiene en
el nivel más fuerte demostrable por lectura estática sola — productor único y directo (Tabla A) >
productor con hueco parcial compensado aguas abajo (Tabla B) > presente pero fuera de contrato o
contractualmente opcional y no emitido (Tabla C) > sin productor localizado (Tabla D, solo
engine2). Ningún campo se degradó a "requiere ejecución" sin antes agotar la vía de lectura
estática (triple vía, §3.1). El contenido concreto de `days`/`slots` — qué plato cae en qué
hueco — sí requiere ejecución (depende de RNG sembrado y estado acumulado) y queda
explícitamente fuera del alcance de este reconocimiento, no clasificado en ninguna tabla.

Comparación entre los dos objetos de plan: fuera del alcance de R-1 por diseño (D-048,
`DECISIONS.md:2335`, "objeto de evaluación" separado de "diseño experimental").
