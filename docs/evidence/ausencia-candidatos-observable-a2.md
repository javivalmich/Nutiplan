# Reconocimiento (solo lectura): ausencia de candidatos-observable para A2 en el corpus

- **Ancla sellada:** `0be9a30417e08ca703c0592e04278f6f1a16cd5a` (merge D-064, "criterio de equivalencia entre observables a efectos de comparación", Frente B A2, 1b-EQ). Verificado mediante `git log -1` antes de escribir este documento; verificado `git status --porcelain` sin salida (working tree limpio) en el mismo momento.
- **Fecha de ejecución:** 2026-07-23.
- **Naturaleza:** reconocimiento de solo lectura. Demuestra un hecho documental — qué contiene y qué no contiene el corpus versionado a este ancla — sobre la existencia de candidatos-observable propuestos para A2 (Frente B, subfrente α). No decide, no propone, no valora, no recomienda.

## Enunciado que este documento demuestra

> El corpus no identifica, enumera ni propone candidatos-observable para A2.

Este enunciado es documental: afirma algo sobre el contenido del corpus a este ancla, bajo el método declarado en la Fase 1. No afirma que no puedan derivarse candidatos, ni que el predicado no los admita, ni nada sobre su naturaleza. Ver Fase 3 para el alcance exacto.

---

## Fase 1 — Método declarado

### 1.1 — Documentos inspeccionados, con ruta, líneas y grado de inspección

**Gobierno normativo (inspección íntegra):**

| Ruta | Líneas | Modo |
|---|---|---|
| `DECISIONS.md` | 2875 | Íntegro por secciones: lectura corrida de `DECISIONS.md:2239-2364` (D-047, D-048 e inicio de D-049) y `:2590-2875` (cola de D-057 a D-064); el resto (`DECISIONS.md:1-2238` y `:2365-2589`) cubierto mediante barrido de cadenas literales (1.2), sin lectura corrida — ver 1.4 |
| `CLAUDE.md` | 71 | Íntegro |
| `docs/spec/plan-observable.md` | 120 | Íntegro |
| `docs/spec/protocolo-evaluacion.md` | 72 | Íntegro |

**`docs/evidence/` — enumeración real del directorio** (26 ficheros; obtenida por listado de directorio sobre el árbol de trabajo al ancla declarado):

```
docs/evidence/R-1-productores-plan.md
docs/evidence/R-1a-corpus-hojas-A2.md
docs/evidence/R-completitud-base-relacion-r1.md
docs/evidence/R-relacion-artefactos-r1.md
docs/evidence/decidibilidad-mandato-d048-p3.md
docs/evidence/dependencia-r1-operacionalizacion-fidelidad.md
docs/evidence/fase-1/checkpoint4_ave_measure.mjs
docs/evidence/fase-1/checkpoint5_plateType_inventory.mjs
docs/evidence/plan-observable/2026-07-18-engine2-conformidad-v1.0.md
docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md
docs/evidence/plan-observable/gen-legacy-2026-07-18.mjs
docs/evidence/protocolo-evaluacion/2026-07-18-R-protocolo-de-facto.md
docs/evidence/protocolo-evaluacion/R-0-reconocimiento-frente-B.md
docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md
docs/evidence/protocolo-evaluacion/R-B1-representacion-consumida-evaluacion.md
docs/evidence/protocolo-evaluacion/R-B2-0-decidibilidad-superficie-publica.md
docs/evidence/variedad-verdura/baseline-variedad-verdura.md
docs/evidence/variedad-verdura/veg_variety_engine2.mjs
docs/evidence/variedad-verdura/veg_variety_engine2_freq.md
docs/evidence/variedad-verdura/veg_variety_engine2_freq.mjs
docs/evidence/variedad-verdura/veg_variety_engine2_intensity.md
docs/evidence/variedad-verdura/veg_variety_engine2_intensity.mjs
docs/evidence/variedad-verdura/veg_variety_engine2_paso5.md
docs/evidence/variedad-verdura/veg_variety_engine2_paso5.mjs
docs/evidence/variedad-verdura/veg_variety_engine2_v2diag.mjs
docs/evidence/variedad-verdura/veg_variety_legacy.mjs
```

Criterio de partición aplicado: `.md` = artefacto documental (superficie donde una propuesta de candidato-observable, de existir, se formularía en prosa); `.mjs` = script instrumental (código de medición, no propuesta normativa). El detalle de inspección por fichero `.md`:

| Ruta | Líneas | Modo |
|---|---|---|
| `docs/evidence/R-1-productores-plan.md` | 267 | Íntegro |
| `docs/evidence/R-1a-corpus-hojas-A2.md` | 90 | Íntegro |
| `docs/evidence/R-completitud-base-relacion-r1.md` | 131 | Íntegro |
| `docs/evidence/R-relacion-artefactos-r1.md` | 90 | Íntegro |
| `docs/evidence/decidibilidad-mandato-d048-p3.md` | 24 | Íntegro |
| `docs/evidence/dependencia-r1-operacionalizacion-fidelidad.md` | 44 | Íntegro |
| `docs/evidence/plan-observable/2026-07-18-engine2-conformidad-v1.0.md` | 345 | Íntegro |
| `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md` | 274 | Íntegro |
| `docs/evidence/protocolo-evaluacion/2026-07-18-R-protocolo-de-facto.md` | 167 | Íntegro |
| `docs/evidence/protocolo-evaluacion/R-0-reconocimiento-frente-B.md` | 120 | Íntegro |
| `docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md` | 68 | Íntegro |
| `docs/evidence/protocolo-evaluacion/R-B1-representacion-consumida-evaluacion.md` | 48 | Íntegro |
| `docs/evidence/protocolo-evaluacion/R-B2-0-decidibilidad-superficie-publica.md` | 36 | Íntegro |
| `docs/evidence/variedad-verdura/baseline-variedad-verdura.md` | 152 | Parcial: líneas 1-30 leídas íntegras; resto cubierto por barrido de cadenas (1.2) — ver 1.4 |
| `docs/evidence/variedad-verdura/veg_variety_engine2_freq.md` | 342 | No inspeccionado íntegro; cubierto por barrido de cadenas (1.2) — ver 1.4 |
| `docs/evidence/variedad-verdura/veg_variety_engine2_intensity.md` | 387 | No inspeccionado íntegro; cubierto por barrido de cadenas (1.2) — ver 1.4 |
| `docs/evidence/variedad-verdura/veg_variety_engine2_paso5.md` | 188 | No inspeccionado íntegro; cubierto por barrido de cadenas (1.2) — ver 1.4 |

Los 9 ficheros `.mjs` de `docs/evidence/` recibieron barrido de cadenas idéntico (búsquedas 7-8 y 12-13 de 1.2), con criterio único y tratamiento uniforme; ninguno fue inspeccionado como lectura de prosa íntegra, por el criterio de partición declarado arriba.

### 1.2 — Patrones de búsqueda empleados literalmente

Todos ejecutados sobre el árbol de trabajo, con el repositorio en el ancla declarada. Se listan incluidos los que no produjeron resultado, con su alcance:

1. `candidato` (insensible a mayúsculas) sobre `DECISIONS.md` completo (2875 líneas) → 38 coincidencias. Todas revisadas; ninguna enumera candidatos-observable de A2 (detalle de las relevantes en Fase 2).
2. `candidato` (insensible a mayúsculas) sobre `docs/` completo → 9 ficheros con coincidencia; los 9 examinados (listado: `R-1a-corpus-hojas-A2.md`, `R-completitud-base-relacion-r1.md`, `R-relacion-artefactos-r1.md`, `protocolo-evaluacion/R-B2-0-decidibilidad-superficie-publica.md`, `protocolo-evaluacion/2026-07-18-R-protocolo-de-facto.md`, `plan-observable/2026-07-18-legacy-conformidad-v1.0.md`, `R-1-productores-plan.md`, `variedad-verdura/veg_variety_engine2_paso5.mjs`, `variedad-verdura/veg_variety_engine2_paso5.md`).
3. `candidatos?-observable|observable candidato|candidato de A2|candidatos de A2` (insensible a mayúsculas) sobre el repositorio completo → **0 coincidencias**.
4. `\(A2` sobre `DECISIONS.md` → coincidencias únicamente en materia no relacionada (tripwire de aislamiento `A2.1`-`A2.3`, `DECISIONS.md:56-61`) y en los títulos de D-063/D-064.
5. `1b-|A2\)` sobre `DECISIONS.md` → coincidencias en materia no relacionada (`F4-P1b`, `DECISIONS.md:435`; `F-1b-1`, `F-1b-2`, `DECISIONS.md:1696,1733`; `F-SV1→A, F-SV2→A2`, `DECISIONS.md:1447`) y en los títulos de D-063/D-064 (`1b-P1`, `1b-EQ`).
6. Glob `docs/evidence/*A2*` → único resultado: `docs/evidence/R-1a-corpus-hojas-A2.md`.
7. `A2|candidato.?observable|Frente B|D-062|D-063|D-064` (insensible a mayúsculas) sobre `docs/evidence/variedad-verdura/` (10 ficheros, `.md` y `.mjs`) → 3 coincidencias, las 3 subcadenas de valores hexadecimales SHA-256 (p. ej. `...0a2d9b...`), sin relación con el rótulo "A2"; **0 coincidencias genuinas**.
8. `candidat|observable` (insensible a mayúsculas) sobre `docs/evidence/variedad-verdura/` → 6 coincidencias en 2 ficheros; la única en un `.md` es `seleccion_rotativo_candidato_unico` (`docs/evidence/variedad-verdura/veg_variety_engine2_paso5.md:45`), un identificador de causa del mecanismo de selección rotativa de engine2 (`runWalk.js:375`, citado en la misma línea) — materia distinta, ver Fase 2 (no registrado como fila propia por no versar sobre A2 en absoluto, a diferencia de los objetos de la Fase 2).
9. `^# \|^Fecha\|^\*\*Fecha\|HEAD` sobre los 4 ficheros `.md` de `docs/evidence/variedad-verdura/` → confirma cabeceras y anclas: `baseline-variedad-verdura.md` (sin HEAD explícito en cabecera, fecha de medición `2026-07-16`, ver 1.1), `veg_variety_engine2_paso5.md` (título "Campaña F-M ... D-044, criterio vi", HEAD `54c76f864821bcac589bd1914e8b91d8024ce36c`).
10. `^## D-04[5-9]|^## D-05|^## D-06` sobre `DECISIONS.md` → localiza los encabezados de todos los asientos D-045 a D-064, usado para acotar el rango de lectura íntegra de 1.1.
11. `candidato` (insensible a mayúsculas) sobre `DECISIONS.md:2365-2589` (rango D-049 cola a D-057, no cubierto por lectura corrida según 1.1) → **0 coincidencias** dentro de ese rango, confirmado por inspección del listado completo de líneas devuelto por la búsqueda 1 (ninguna línea del rango 2365-2589 aparece en los 38 resultados).
12. `A2|candidato.?observable|Frente B|D-062|D-063|D-064` (insensible a mayúsculas, mismo patrón de la búsqueda 7) sobre los 3 ficheros `.mjs` de `docs/evidence/` fuera de `variedad-verdura/` (`fase-1/checkpoint4_ave_measure.mjs`, `fase-1/checkpoint5_plateType_inventory.mjs`, `plan-observable/gen-legacy-2026-07-18.mjs`) → 4 coincidencias, las 4 en `gen-legacy-2026-07-18.mjs` (líneas 21,27,32,33), todas subcadenas de la palabra `sha256` (p. ej. `createHash('sha256')` contiene la subcadena "a2"), sin relación con el rótulo "A2"; **0 coincidencias genuinas**. Los dos ficheros de `fase-1/` no producen ninguna coincidencia.
13. `candidat|observable` (insensible a mayúsculas, mismo patrón de la búsqueda 8) sobre los mismos 3 ficheros → 4 coincidencias, las 4 en `gen-legacy-2026-07-18.mjs:1-3,9`, comentarios de cabecera que usan la expresión "plan observable" (referencia al objeto normado por `docs/spec/plan-observable.md` — el mismo uso adjetival de "observable" ya descartado como no pertinente en otros puntos de este documento, p. ej. Fase 2.3-2.4), no candidato-observable de A2. Los dos ficheros de `fase-1/` no producen ninguna coincidencia.
14. `A2` (sensible a mayúsculas, sin agrupar con otros patrones) sobre `DECISIONS.md` completo → **16 líneas con coincidencia, 16 ocurrencias totales** (ninguna línea contiene más de una aparición de la subcadena "A2"): `DECISIONS.md:56,57,61,76,1447,1483,1633,1690,2398,2549,2552,2555,2822,2846,2848,2875`. Clasificación completa de las 16:
    - Tripwire de aislamiento engine/engine2, rótulos `A2.1`, `A2.2`, `A2.3` y "Evidencia A2 (deriveCuisineExperience)": `:56,57,61,76`.
    - D-033, rótulo `F-SV2 → A2` (2026-07-13): `:1447,1483`.
    - Subcadena "A2" dentro de `SHA256` (`BASELINE_SHA256_HEAD`), sin relación con ningún rótulo "A2": `:1633,1690`.
    - D-050, rótulo de bifurcación de arquitectura `B-A2-B`: `:2398`.
    - D-056, rótulo de reconocimiento `R-A2`: `:2549,2552`.
    - D-056, rótulo de bifurcación `F-A2a` (distinto de `R-A2` del mismo asiento): `:2555`.
    - Título de asiento "Frente B (A2, ...)" (D-063, D-064): `:2822,2848`.
    - Nombre de fichero `R-1a-corpus-hojas-A2.md`, citado como evidencia: `:2846,2875`.

### 1.3 — Estrategias no basadas en término

- Lectura corrida de `DECISIONS.md:2239-2364` (D-047, D-048 e inicio de D-049) y `:2590-2875` (cola de D-057 a D-064): cada asiento leído de principio a fin dentro de esos rangos, sin apoyarse en coincidencias de grep, para detectar una enumeración de candidatos que pudiera estar redactada sin usar las cadenas literales buscadas.
- Lectura corrida completa de los 13 artefactos `.md` de `docs/evidence/` marcados "Íntegro" en 1.1 (fuera de `variedad-verdura/`), de principio a fin.
- Lectura corrida completa de `CLAUDE.md`, `docs/spec/plan-observable.md` y `docs/spec/protocolo-evaluacion.md`.
- Recorrido de la cadena genealógica de artefactos "R-1"/"R-0"/"R-B1"/"R-B2-0" mediante las citas cruzadas (emitidas/recibidas) que esos mismos artefactos declaran, siguiendo `docs/evidence/R-relacion-artefactos-r1.md` y `docs/evidence/R-completitud-base-relacion-r1.md` como mapas de esa genealogía, para verificar que ningún nodo de la cadena queda fuera del listado de 1.1.
- Verificación de la partición temporal: comprobación de que `docs/evidence/variedad-verdura/*` antecede a la apertura de Frente B — `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:22` fecha la medición el `2026-07-16`; `docs/evidence/variedad-verdura/veg_variety_engine2_paso5.md:1` titula la campaña bajo "D-044, criterio vi"; D-048 (fundación de Frente B, `DECISIONS.md:2325`) es del `2026-07-17`, un día después. Esta comprobación teórica (no solo léxica) sostiene el criterio de 1.4 para no leer esos ficheros íntegros.

### 1.4 — Qué no se inspeccionó y por qué

- **`DECISIONS.md:1-2238` y `:2365-2589`** (el corpus anterior a D-047, y el tramo D-049 cola a D-057): no se leyeron de forma corrida. Cubiertos por los barridos de cadenas de 1.2 (búsquedas 1 y 11) sobre la totalidad de ambos rangos.
- **9 ficheros `.mjs` de `docs/evidence/`**: no inspeccionados como prosa (lectura corrida). Motivo declarado en 1.1: son scripts instrumentales (generación/medición), no artefactos de propuesta normativa; una enumeración de candidatos-observable, de existir, tendría forma de prosa documental, no de código ejecutable. Los 9 recibieron el mismo barrido de cadenas: 6 (`variedad-verdura/`) mediante las búsquedas 7-8, los 3 restantes (`fase-1/checkpoint4_ave_measure.mjs`, `fase-1/checkpoint5_plateType_inventory.mjs`, `plan-observable/gen-legacy-2026-07-18.mjs`) mediante las búsquedas 12-13, con patrones idénticos y resultado uniforme: sin coincidencias genuinas relacionadas con A2 en ninguno de los 9.
- **3 ficheros `.md` de `docs/evidence/variedad-verdura/`** (`veg_variety_engine2_freq.md`, 342 líneas; `veg_variety_engine2_intensity.md`, 387 líneas; `veg_variety_engine2_paso5.md`, 188 líneas) y las 122 líneas finales de `baseline-variedad-verdura.md`: no se leyeron íntegras. Cubiertos por los barridos de cadena de las búsquedas 7-8 sobre el directorio completo, con resultado sin coincidencias genuinas, y respaldados por la verificación temporal/temática de 1.3 (campaña de variedad de verdura, anclada a D-044 y fechada 2026-07-16, anterior y ajena a Frente B). Un texto que mencionara A2 con terminología completamente ajena a los patrones buscados no habría sido detectado por este método; se declara esa limitación explícitamente.
- **Ningún fichero fuera de `DECISIONS.md`, `CLAUDE.md`, `docs/spec/`, `docs/evidence/`** (p. ej. código fuente de `src/engine2/`, `analysis/`) fue inspeccionado. Motivo: el acto pregunta qué establece el *corpus* de gobierno y evidencia, no qué podría derivarse del código; derivar candidatos del código fuente sería la síntesis que este acto tiene prohibido producir.
- **No se ejecutó ningún motor ni script.** Instrumento: lectura estática exclusivamente.

---

## Fase 2 — Lo que sí existe (desambiguación)

### 2.1 — Candidatos a PRODUCTOR de plan en engine2

**Qué son.** Funciones candidatas a ser "la" función que materializa el objeto de plan en engine2 — no candidatos a qué observable medir sobre ese plan.

**Cita y definición literal.** `docs/evidence/R-1a-corpus-hojas-A2.md:15-22` documenta dos conjuntos distintos, bajo dos artefactos ambos titulados "R-1":
- `docs/evidence/R-1-productores-plan.md:136-156` (artefacto (i), HEAD `6523de9`) establece la cadena `buildWeekArc` (`src/engine2/skeleton/buildWeekArc.js:333-429`) → `expandWeekArc` (`src/engine2/walk/expandWeekArc.js:97-`) → `runWalk` (`src/engine2/walk/runWalk.js:181-415`), con verificación explícita de que `runWalk` no tiene call-sites de producción (`docs/evidence/R-1-productores-plan.md:174-178`).
- `docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md:43-46` (artefacto (ii), HEAD `cd10667`) establece, en cita literal: *"Punto(s) de producción — tres superficies plausibles, sin resolver. No existe `src/engine2/index.js`. Tres funciones exportadas en archivos distintos: 1. `buildWeekArc()` (...) 2. `runWalk()` (...) 3. `materializePlan()` (...)"*.

**Por qué NO es un candidato-observable de A2.** Ambos conjuntos responden a la pregunta "¿qué función produce el objeto de plan?" (candidato a **productor**), delegada por D-048 punto 3 (`DECISIONS.md:2335`) al reconocimiento R-1. A2 pregunta una cosa distinta: dado un objeto de plan ya producido, ¿qué **observable** se mide sobre él para contrastar el predicado? `docs/evidence/R-1-productores-plan.md:266` lo señala expresamente: *"Comparación entre los dos objetos de plan: fuera del alcance de R-1 por diseño"* — R-1 no llega siquiera a comparar objetos de plan, y menos aún a proponer qué observarlos.

### 2.2 — Candidatas RECHAZADAS a propiedad del espacio de admisibilidad (D-062)

**Cita y definición literal.** `DECISIONS.md:2777-2789`, sección "Candidatas rechazadas (registro; no forman parte del espacio)":
> - "Preservar la estructura semanal / andamiaje temporal": rechazada por Neutralidad — nombra un candidato. (...)
> - "Reflejar variedad / repetición": rechazada por Fuente — `DECISIONS.md:2336` reclasifica las lecturas "distinción / repetición" como familias de diseño experimental, no como contenido del predicado.
> - "Ser cuantitativo / métrico": rechazada por Necesidad (...)
> - "Ser operacionalizable": no constituye restricción independiente del corpus (...)

**Por qué NO son candidatos-observable de A2.** Estas cuatro entradas fueron propuestas y rechazadas como candidatas a **propiedad del espacio de admisibilidad** (es decir, candidatas a integrar el conjunto A1-P1...P5, `DECISIONS.md:2711-2770`), no como candidatas a **observable evaluado bajo ese espacio**. La propia entrada lo marca: la primera se rechaza explícitamente "por Neutralidad — nombra un candidato", es decir, se descarta como propiedad-marco precisamente *porque* apunta a un observable concreto; el asiento no adopta ese observable señalado, lo usa como ejemplo de lo que una propiedad-marco no puede hacer.

### 2.3 — `weekScore` en el Fundamento de D-064

**Cita literal.** `DECISIONS.md:2858`: *"El corpus exhibe un caso donde ambas cosas divergen: `weekScore` está garantizado en ambos motores y el propio contrato declara que engine2 no puntúa y que su valor será placeholder o derivado (`CLAUDE.md:22-23`). Un observable definido sobre esa clave resultaría obtenible en ambos motores sin denotar por ello la misma propiedad. El caso se cita como demostración de que existe residuo normativo entre P3 y esta hoja; no como elemento definitorio del criterio."*

**Por qué NO es un candidato-observable de A2.** El propio asiento excluye expresamente esa calidad: `weekScore` se cita como ilustración de un problema normativo (la posibilidad de que una clave obtenible en ambos motores no denote la misma propiedad), no como propuesta de observable para la evaluación de candidatos de A2.

### 2.4 — Cláusula de cierre y demarcación de D-062

**Cita literal.** `DECISIONS.md:2790-2795`, sección "Demarcación (qué NO hace este asiento)":
> - No nombra ni selecciona ningún observable.
> - No menciona ni evalúa sustrato candidato alguno; el marco existiría con independencia de cualquier caracterización de sustrato.
> - No decide la suficiencia de ningún sustrato.
> - No elige familia de diseño experimental.

Complementa `DECISIONS.md:2772-2775` ("Cláusula de cierre"): *"A1 define únicamente el espacio de admisibilidad. El cumplimiento de sus propiedades es condición necesaria de admisibilidad, pero no criterio suficiente para seleccionar un observable."*

Esta cláusula es la evidencia positiva más fuerte de que la ausencia demostrada por este documento es deliberada, no un olvido: el asiento que crea el marco bajo el cual A2 evaluaría candidatos declara, en su propio texto, que no nombra ninguno.

### 2.5 — Candidatos de fuga bajo el cegado (D-058)

**Cita literal.** `DECISIONS.md:2610` (D-058, punto 1, tercera viñeta): *"(...) la frontera entre 'contenido' legítimo y 'rasgo ajeno al contenido' que §6.1 obliga a neutralizar, no trazada por ninguna norma —con la tabla de candidatos de fuga observados (presencia de `decisionLog`, `weekScore` número vs `null`, `weekWarnings` con contenido vs `[]`) sin clasificar."*

**Por qué NO son candidatos-observable de A2.** Estos son candidatos a **rasgo que podría delatar el motor de origen** bajo el protocolo de cegado (`docs/spec/protocolo-evaluacion.md:51-57`, §6), sin clasificar entre "contenido legítimo" y "rasgo ajeno al contenido". Es un objeto del diseño del cegado, materia distinta de qué observable se mide para contrastar el predicado de humanización (A1/A2). El propio D-058 los deja "sin clasificar", no los propone como observable de evaluación.

### 2.6 — F1/F2/F3 como candidatas a versiones futuras de C (D-047)

**Cita literal.** `DECISIONS.md:2296-2297` (D-047, "Identidades preservadas (principio 8)"): *"F1, F2 y F3 conservan su identidad contractual como candidatas a versiones futuras de C, si un reconocimiento posterior demuestra que el terreno común se ha ampliado (...)."*

**Por qué NO son candidatos-observable de A2.** F1 (verdura), F2 (proteína) y F3 (hidrato) son candidatas a ampliar **C** — el contrato mínimo de hechos de composición compartidos entre legacy y engine2 (`DECISIONS.md:2247`, "C es representación canónica de EVALUACIÓN, no formato de plan") — no candidatas a observable de A2. C es, por diseño, un contrato de hechos estructurales verificables, anterior y distinto del objeto que A1/A2 regulan (`DECISIONS.md:2249`, "C contiene hechos, no criterios de juicio"). El propio D-061 mantiene ambas cuestiones separadas: la suficiencia de C v1 es una sub-cuestión citada dentro de "sustrato de evaluación" (`DECISIONS.md:2685`), pendiente, no resuelta con F1/F2/F3 como respuesta.

---

## Fase 3 — Alcance y cierre

### 3.1 — Alcance exacto de la ausencia demostrada

La ausencia se demuestra:
- **Sobre:** `DECISIONS.md` (2875 líneas: lectura corrida de `DECISIONS.md:2239-2364` y `:2590-2875`; `DECISIONS.md:1-2238` y `:2365-2589` cubiertos por barrido de cadenas), `CLAUDE.md` (íntegro), `docs/spec/plan-observable.md` (íntegro), `docs/spec/protocolo-evaluacion.md` (íntegro), y `docs/evidence/**` según el detalle de 1.1 (13 ficheros `.md` íntegros, 4 ficheros `.md` de `variedad-verdura/` con lectura parcial o solo barrido de cadenas, 9 ficheros `.mjs` no inspeccionados como prosa pero con barrido de cadenas uniforme).
- **Bajo el método:** los patrones de búsqueda literales de 1.2, las lecturas corridas de 1.3, y las exclusiones explícitas y motivadas de 1.4.
- **Al commit:** `0be9a30417e08ca703c0592e04278f6f1a16cd5a`.

Dentro de ese alcance, no se localiza ninguna enumeración, propuesta o identificación de candidatos-observable para A2. Los seis objetos susceptibles de confusión con esa enumeración están registrados y desambiguados en la Fase 2, cada uno con cita archivo:línea y razón precisa de exclusión.

### 3.2 — Qué NO demuestra este documento

- No demuestra que no puedan derivarse candidatos-observable a partir del corpus o del código.
- No demuestra que el predicado de la tesis (`DECISIONS.md:2333`) no admita observables, ni cuántos, ni de qué naturaleza.
- No demuestra nada sobre la suficiencia, idoneidad o forma que debería tener un candidato-observable, de proponerse.
- No demuestra que la ausencia sea un defecto, un olvido o una carencia del corpus — ni tampoco que sea un acierto o una virtud. La Fase 2.4 registra evidencia de que la ausencia es consistente con la demarcación que el propio D-062 declara sobre sí mismo, pero eso es un hecho sobre el texto de D-062, no una valoración de si la ausencia general es deseable.
- No demuestra que los seis objetos registrados en la Fase 2 sean irrelevantes para un acto posterior — solo que ninguno de ellos, por su propio contenido literal citado, constituye la enumeración que este documento buscaba.
- No propone, esboza, ni sugiere de dónde podría derivarse un candidato-observable, ni qué forma podría tener.
- No agota lógicamente el corpus entero del repositorio: los perímetros de 1.4 (en particular `DECISIONS.md:1-2238` y `:2365-2589`, cubiertos solo por barrido de cadenas, y los tres ficheros `.md` de `variedad-verdura/` no leídos íntegros) quedan declarados como limitación del método, no como zona verificada con el mismo grado de certeza que el resto.
