# Reconocimiento (solo lectura): relación entre los dos artefactos titulados "R-1"

- **HEAD de reconocimiento:** `426f278` (merge de R-1a sobre `79f31ae`). Confirmado por `git log -1` antes de escribir este documento.
- **`git status --porcelain`:** sin salida (working tree limpio). Confirmado antes de escribir este documento.
- **Naturaleza:** reconocimiento read-only. Demuestra; no decide. No propone, no concluye normativamente, no valora suficiencia ni cierre de ninguna cuestión.
- **Artefactos bajo examen:**
  - **A** = `docs/evidence/R-1-productores-plan.md`
  - **B** = `docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md`
- Ambas rutas verificadas existentes a `426f278` mediante `git cat-file -e` antes de leer su contenido.

---

## Eje 1 — Relación entre A y B

### A — qué demuestra, ancla, mandato, candidatos

- **Ancla declarada:** HEAD `6523de9`, fecha `2026-07-17` (`docs/evidence/R-1-productores-plan.md:3,5`).
- **Mandato declarado:** "Encomendado por D-048 (`DECISIONS.md:2348`, sección 'Herencia'): documentar qué constituye 'el plan generado' en cada motor — qué produce cada uno, con qué campos y qué semántica puede demostrarse mediante lectura estática. Sin comparar los dos motores; sin ejecutar ningún motor." (`docs/evidence/R-1-productores-plan.md:7-10`).
- **Objeto demostrado — legacy:** productor único, `buildPlan.js:2807-2815`, return con `days, strategy, weekWarnings, weekProblems, weekScore` más `qaTrace` condicional a `QA_TRACE` (`docs/evidence/R-1-productores-plan.md:36-49`). `strategy` producido en `buildPlan.js:55` (`docs/evidence/R-1-productores-plan.md:51-54`).
- **Objeto demostrado — engine2:** en §3.1, no-localización verificada por "triple vía" (ausencia de archivo raíz equivalente a `buildPlan.js`; ausencia de clave `days:` construida fuera de tests; ausencia de importadores de producto) — "en este HEAD, ningún código de producto invoca ni ensambla un objeto que cumpla el contrato de shape desde `engine2/`" (`docs/evidence/R-1-productores-plan.md:113-129`). En §3.2 documenta una **cadena** de tres funciones: `buildWeekArc` (`src/engine2/skeleton/buildWeekArc.js:333-429`, retorno `{weekArc, decisionLog}`, cita en `docs/evidence/R-1-productores-plan.md:136-139`) → `expandWeekArc` (`src/engine2/walk/expandWeekArc.js:97-`, cita en `docs/evidence/R-1-productores-plan.md:148-150`) → `runWalk` (`src/engine2/walk/runWalk.js:181-415`, retorno `{slots, decisionLog}`, cita en `docs/evidence/R-1-productores-plan.md:152-156`). Verifica explícitamente que `runWalk` **no se llama fuera de sus propios tests**: "único conjunto de importadores de `runWalk` en todo `src/`: [cuatro archivos de test], todos bajo `src/engine2/walk/tests/`. Ningún módulo de producto lo invoca." (`docs/evidence/R-1-productores-plan.md:174-178`). En §3.3 verifica por grep que `reconcile` no existe como función implementada, solo dos comentarios (`docs/evidence/R-1-productores-plan.md:180-185`).
- **Conjunto de candidatos que establece A para engine2 (enumerado):** `buildWeekArc`, `expandWeekArc`, `runWalk` — tres eslabones de una cadena, con verificación de no-invocación en producción del último eslabón. `materializePlan` no aparece mencionado en ningún punto del artefacto — confirmado por grep de la cadena `"materializePlan"` sobre el archivo, sin resultados.

### B — qué demuestra, ancla, mandato, candidatos

- **Ancla declarada:** "Estado del repo... `main @ cd10667`", fecha de ejecución `2026-07-19` (`docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md:3-4`).
- **Mandato declarado:** "Anclaje normativo: `DECISIONS.md:2335` (D-048, punto 3)" — el mismo punto 3 de D-048 que cita A, formulado igual. Añade un "Anclaje disparador" que A no tiene: `docs/evidence/protocolo-evaluacion/R-B1-representacion-consumida-evaluacion.md` — "demostró que la forma observable del objeto queda remitida a este trabajo" (`docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md:5-6`).
- **Objeto demostrado — legacy:** "Superficie única: `buildPlan()`, `buildPlan.js:33`. Re-exportada sin alteración por el barrel público: `index.js:26`" (`docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md:20`) — dato del barrel `index.js:26` que A no aporta. Return citado en `buildPlan.js:2808-2815`, mismos campos que A (`docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md:22-27`).
- **Objeto demostrado — engine2:** "Punto(s) de producción — tres superficies plausibles, sin resolver. No existe `src/engine2/index.js`. Tres funciones exportadas en archivos distintos: 1. `buildWeekArc()` — `buildWeekArc.js:333`, retorna `{weekArc, decisionLog}` (`:428`). 2. `runWalk()` — `runWalk.js:181`, retorna `{slots, decisionLog}` (`:414`). 3. `materializePlan()` — `materializePlan.js:33`, invoca a las dos anteriores internamente (`:38-43`) y ensambla su propio retorno." (`docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md:43-46`). Cierra sin resolver: "Ningún archivo agrupa las tres bajo una superficie única. Esta R no resuelve cuál constituye 'el' resultado del motor." (`:48`) y, en el cierre del documento: "se describen las tres sin resolver cuál constituye 'el' objeto producido por el motor." (`:68`). Señala que solo `materializePlan()` "coincide en claves de primer nivel con el contrato de shape (`CLAUDE.md:17-25`) — hecho de nombres, sin valorar equivalencia semántica" (`:62`).
- **Conjunto de candidatos que establece B para engine2 (enumerado):** `buildWeekArc`, `runWalk`, `materializePlan` — tres superficies exportadas presentadas en paralelo, no como cadena. `expandWeekArc` no aparece mencionado en ningún punto del artefacto — confirmado por grep de la cadena `"expandWeekArc"` sobre el archivo, sin resultados. B tampoco verifica invocación en producción de ninguna de las tres superficies — confirmado por grep de `"producci"`, `"producto"`, `"llamad"`, `"invoc"`, `"importad"` sobre el archivo: los únicos hits son la superficie legacy (`:20`), la asignación de `strategy` (`:32`) y `materializePlan` "invoca a las dos anteriores internamente" (`:46`) — ninguno verifica call-sites de producción externos al propio motor. `reconcile` no aparece mencionado en ningún punto — confirmado por grep, sin resultados.

### Confrontación

**Sub-objeto legacy.** Mismo objeto demostrado en ambos: `buildPlan()` como productor único, return con los mismos campos, mismo tratamiento de `qaTrace` como condicional a `QA_TRACE`. Cita de línea del return: A usa `buildPlan.js:2807-2815` (incluye la línea de `var validation = validateWeek(days);`); B usa `buildPlan.js:2808-2815` (solo el `return {`). No hay contradicción de contenido; B añade un dato que A no tiene (reexportación por el barrel `index.js:26`).

**Sub-objeto engine2.** Los dos conjuntos de candidatos difieren en composición: A incluye `expandWeekArc` y no incluye `materializePlan`; B incluye `materializePlan` y no incluye `expandWeekArc`. Solo `buildWeekArc` y `runWalk` son comunes a ambos conjuntos.

Verificación independiente del estado de código en cada ancla (existencia de archivo, no lectura de contenido — no se re-derivan candidatos, se verifica la fecha del ancla): `git cat-file -e 6523de9:src/engine2/materializePlan.js` → no existe en el HEAD de A; `git cat-file -e cd10667:src/engine2/materializePlan.js` → existe en el HEAD de B. D-056, el asiento que crea `materializePlan.js` (`DECISIONS.md:2547`, título "Orquestador de materialización del plan observable (`materializePlan.js`)"), tiene "HEAD de reconocimiento: `5e7eb5c`" fechado `2026-07-18` (`DECISIONS.md:2549`) — cronológicamente entre el ancla de A (`2026-07-17`) y el ancla de B (`2026-07-19`). El conjunto de candidatos de engine2 que examina cada artefacto corresponde, pues, a estados de código materialmente distintos.

Además de la diferencia de composición, difiere el tipo de verificación aplicada y la conclusión alcanzada: A enmarca los tres elementos como cadena y verifica explícitamente que el último eslabón (`runWalk`) no tiene call-sites de producción, concluyendo (§3.1) ausencia de productor completo en ese HEAD. B enmarca los tres elementos como superficies paralelas sin verificar call-sites de producción de ninguna, y concluye explícitamente la no-resolución entre ellas, sin afirmar ausencia.

### Clasificación

La relación no es uniforme entre los dos sub-objetos examinados:

- **Sub-objeto legacy:** la evidencia sostiene **identidad** (mismo objeto demostrado, mismas citas de campo, mismo return) — B añade un dato adicional (barrel) sin contradecir a A.
- **Sub-objeto engine2:** la evidencia sostiene **diferencia material** — conjuntos de candidatos distintos en composición (`expandWeekArc` vs `materializePlan`), sobre anclas de código verificadamente distintas, con métodos de verificación distintos (verificación de no-invocación en A, ausente en B) y conclusiones distintas (ausencia-por-triple-vía en A, pluralidad-sin-resolver en B).

Dado que el Eje 1 pide clasificar "la relación" entre A y B como conjunto, y esa relación se bifurca según el sub-objeto (identidad en legacy, diferencia material en engine2), una única etiqueta global no está sostenida uniformemente por las citas: forzar "identidad", "equivalencia", "inclusión", "complementariedad" o "diferencia material" como veredicto único sobre el par completo de artefactos suprimiría una de las dos mitades verificadas. Se reporta la clasificación por sub-objeto arriba; el veredicto global se deja como **NO CLASIFICABLE bajo una sola de las cinco categorías**, con la evidencia citada arriba sosteniendo cada mitad por separado.

---

## Eje 2 — Posición en el corpus

### 1. Citas de A y B en DECISIONS.md

Cadenas buscadas mediante grep sobre `DECISIONS.md` en el repo vivo a `426f278`:

- `"R-1-productores-plan.md"` → 3 coincidencias: `DECISIONS.md:2375`, `:2456`, `:2465`.
  - `:2375` — "Véase Informe R-1 (`docs/evidence/R-1-productores-plan.md`, HEAD `6523de9`), generado exclusivamente mediante lectura estática, sin ejecución de motores."
  - `:2456` — cita la ruta como convención de facto para forma de artefactos de verificación de conformidad.
  - `:2465` — "Referencias: D-048, D-049 (con `docs/evidence/R-1-productores-plan.md`), D-050, D-051, `CLAUDE.md:17-28`."
- `"protocolo-evaluacion/R-1-objeto-producido-por-motor.md"` → 0 coincidencias.
- `"R-1-objeto-producido-por-motor"` (cadena sin ruta, por si se citara con ruta relativa distinta) → 0 coincidencias.
- `"R-1"` (rótulo) → 23 coincidencias totales; de ellas, 11 son falsos positivos por subcadena de `"PR-1"` (`DECISIONS.md:1336,1358,1631,1637,1664,1665,1688,1740,1756,1785,1791`, todas en la sección de PR-1a/PR-1b sobre `fuenteEditorial`, materia distinta). Las 12 coincidencias genuinas de `"R-1"` como rótulo de reconocimiento: `DECISIONS.md:2335,2346,2349,2351,2355,2370,2372,2375,2385,2411,2456,2465` — todas dentro del bloque D-048/D-049 (`:2333-2465`). Ninguna de las 12 cita, menciona o referencia la ruta de B. Todas las que apuntan a un artefacto concreto por ruta (`:2375`, `:2456`, `:2465`) apuntan exclusivamente a A.
- D-049 (`DECISIONS.md:2351`), título literal "R-1 Frente B: Reconocimiento de productores de plan", remite su evidencia únicamente al artefacto A (`:2375`).

### 2. ¿Determina el corpus cuál de los dos artefactos consume A2?

"A2" identificado en el corpus como el acto posterior a A1 (D-062, `DECISIONS.md:2698-2819`, "Frente B (A1): marco de admisibilidad del observable de evaluación") dentro del subfrente α: la propia D-062 remite dos veces a "la evaluación de candidatos" como acto siguiente y distinto de sí misma (`DECISIONS.md:2709`, `:2803`, `:2807`).

Cadenas buscadas sobre `DECISIONS.md`:
- `"evaluación de candidatos"` → 3 coincidencias: `:2709`, `:2803`, `:2807`. Ninguna nombra a A ni a B, ni fija qué artefacto aporta el conjunto de candidatos a ese acto.
- `"conjunto de candidatos"` → 0 coincidencias.
- `"A2"` → coincidencias localizadas en materias no relacionadas con este reconocimiento (`:56-76`, isolation tripwire y `deriveCuisineExperience`; `:1447-1483`, `satisfaceVerdura` F-SV2→A2) y en el propio D-062 (`:2698`, título; `:2704`, "subfrente α, ratificado en D-061 punto 2.a").

D-060 (`DECISIONS.md:2642-2667`) resuelve expresamente que "la identificación del objeto de evaluación pertenece al plano contractual... y no al plano de las implementaciones. El corpus no identifica el objeto mediante una implementación privilegiada" (`:2658`), y que "las cuestiones relativas a implementaciones concretas pertenecen al plano de evidencia y conformidad... separada de esta resolución" (`:2660`) — sin nombrar a A ni a B.

D-062, en su sección "Demarcación", declara explícitamente: "No menciona ni evalúa sustrato candidato alguno; el marco existiría con independencia de cualquier caracterización de sustrato." (`DECISIONS.md:2792-2793`) y "No nombra ni selecciona ningún observable." (`:2791`).

No se localiza, en `DECISIONS.md`, ningún asiento posterior a D-049 (`:2351`) que cite a B, que compare A y B, o que fije cuál de los dos artefactos aporta el conjunto de candidatos consumido por la evaluación de candidatos (A2). Esa ausencia es el hallazgo de esta subsección, con la constancia de las cadenas buscadas arriba.

---

## Alcance de la demostración

**Barrido efectivo.** Sobre `DECISIONS.md` completo (2820 líneas) se buscaron, mediante grep en el repo vivo a `426f278`, las cadenas literales: `"R-1-productores-plan.md"`, `"protocolo-evaluacion/R-1-objeto-producido-por-motor.md"`, `"R-1-objeto-producido-por-motor"`, `"R-1"`, `"A1"` (indirectamente, vía título de D-062), `"A2"`, `"R-B1"`, `"evaluación de candidatos"`, `"conjunto de candidatos"`, `"D-056"`, `"materializePlan"`. Sobre el artefacto A (`docs/evidence/R-1-productores-plan.md`) se buscó `"materializePlan"` (sin resultados) y `"expandWeekArc"` (con resultados, citados). Sobre el artefacto B (`docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md`) se buscaron `"expandWeekArc"` (sin resultados), `"buildWeekArc"`, `"runWalk"` (con resultados, citados), `"reconcile"` (sin resultados) y las cadenas `"producci"`, `"producto"`, `"llamad"`, `"invoc"`, `"importad"` (para verificar ausencia de comprobación de call-sites de producción).

**Anclas.** Todas las afirmaciones sobre el contenido de A y B citan archivo:línea de esos dos artefactos tal como existen en el árbol de trabajo a `426f278` (verificados existentes mediante `git cat-file -e` antes de leerlos). Todas las afirmaciones sobre `DECISIONS.md` citan línea de ese archivo en el mismo HEAD. La verificación de existencia de `src/engine2/materializePlan.js` en los HEADs `6523de9` y `cd10667` se hizo mediante `git cat-file -e` (comprobación de existencia de ruta en un commit, sin lectura de contenido) — no constituye relectura de engine2 ni re-derivación de candidatos; los conjuntos de candidatos reportados en el Eje 1 proceden en su totalidad del texto propio de A y de B, no de inspección directa del código de `engine2/`.

**Qué no se estableció.** No se barrieron `CLAUDE.md`, `docs/spec/**` ni otros artefactos de `docs/evidence/**` para el Eje 2 (la instrucción de la tarea acota el grep de citas a `DECISIONS.md`). No se comprobó si algún artefacto fuera de `DECISIONS.md` (p. ej. `docs/evidence/protocolo-evaluacion/R-B2-0-decidibilidad-superficie-publica.md`, que examina a B directamente según `docs/evidence/R-1a-corpus-hojas-A2.md:22`) fija alguna relación entre A y B — queda fuera del alcance literal de este Eje. No se ejecutó ningún motor. No se releyó el código fuente de `engine2/` para reconstruir candidatos independientemente de lo que cada artefacto declara.
