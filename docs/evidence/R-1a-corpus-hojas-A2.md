# R-1a — Reconocimiento (solo lectura): corpus gobernado sobre las dos hojas abiertas de A2 (D-062)

- **Estado del repo en el que se ejecuta:** `main @ 79f31aecb1ba476db7684115d8c5af927156626d` (merge `48358d6` + `2ef727b`, D-062)
- **Fecha de ejecución:** 2026-07-22
- **Naturaleza:** reconocimiento read-only. Demuestra qué fija y qué deja abierto el corpus gobernado. No fija criterios, no compara observables, no declara ningún observable.

---

## Subtarea previa — identidad de candidatos y de "R-1"

### 1. Artefacto(s) versionado(s) que demuestran candidatos de producción de engine2

Existen **dos artefactos distintos**, en rutas distintas, con títulos que empiezan ambos por "R-1":

**(i)** `docs/evidence/R-1-productores-plan.md` — HEAD de reconocimiento `6523de9`, fecha `2026-07-17` (`docs/evidence/R-1-productores-plan.md:3,5`). Cadena identificada para engine2: `buildWeekArc` (`src/engine2/skeleton/buildWeekArc.js:333-429`, cita del artefacto en `docs/evidence/R-1-productores-plan.md:136`) → `expandWeekArc` (`src/engine2/walk/expandWeekArc.js:97-`, `docs/evidence/R-1-productores-plan.md:148`) → `runWalk` (`src/engine2/walk/runWalk.js:181-415`, `docs/evidence/R-1-productores-plan.md:152`). Este artefacto declara explícitamente, en su §3.1, que en su HEAD **no existe** un productor de plan completo en engine2 (triple vía de no-localización, `docs/evidence/R-1-productores-plan.md:113-129`). `materializePlan` no aparece mencionado en ningún punto de este artefacto (confirmado por ausencia — no se localiza la cadena de caracteres "materializePlan" en el archivo).

**(ii)** `docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md` — estado del repo `main @ cd10667`, fecha `2026-07-19` (`docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md:3-4`). Este artefacto sí enumera tres superficies candidatas para engine2, textual (`docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md:43-46`):
> "**Punto(s) de producción — tres superficies plausibles, sin resolver.** No existe `src/engine2/index.js`. Tres funciones exportadas en archivos distintos: 1. `buildWeekArc()` — `buildWeekArc.js:333`, retorna `{weekArc, decisionLog}` (`:428`). 2. `runWalk()` — `runWalk.js:181`, retorna `{slots, decisionLog}` (`:414`). 3. `materializePlan()` — `materializePlan.js:33`, invoca a las dos anteriores internamente (`:38-43`) y ensambla su propio retorno."

La hipótesis de traspaso (materializePlan / buildWeekArc / runWalk) queda confirmada contra este segundo artefacto, no contra el primero. El propio artefacto (ii) cierra sin resolver cuál de las tres constituye "el" objeto producido (`docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md:68`): *"se describen las tres sin resolver cuál constituye 'el' objeto producido por el motor."*

Un tercer artefacto, `docs/evidence/protocolo-evaluacion/R-B2-0-decidibilidad-superficie-publica.md`, examina expresamente (ii) — *"Objeto examinado: `docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md`, tal como quedó fijado en `af52914`"* (`:5`) — y concluye, textual (`docs/evidence/protocolo-evaluacion/R-B2-0-decidibilidad-superficie-publica.md:15`): *"R-1 agota su mandato en la descripción de las tres superficies candidatas y no establece una regla de resolución entre ellas."*

### 2. Entrada D-049 y el objeto que rotula "R-1 productores de plan"

`DECISIONS.md:2351` — encabezado literal: *"## D-049 — R-1 Frente B: Reconocimiento de productores de plan"*.

D-049 remite su evidencia al artefacto (i): `DECISIONS.md:2375` — *"Véase Informe R-1 (`docs/evidence/R-1-productores-plan.md`, HEAD `6523de9`), generado exclusivamente mediante lectura estática, sin ejecución de motores."*

### 3. ¿Es el "R-1" del artefacto (ii) el mismo objeto que el "R-1" de D-049?

**Desenlace (c): el corpus NO resuelve la identidad entre ambos artefactos.**

Evidencia que sostiene (c):

- Grep de la cadena `R-1` sobre la totalidad de `DECISIONS.md` (todas las coincidencias reportadas: `DECISIONS.md:1336,1358,2335,2346,2349,2351,2355,2370,2372,2375,2385,2411,2456,2465`). Ninguna coincidencia cita, menciona o referencia la ruta `docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md`. Todas las citas de "R-1" que apuntan a un artefacto concreto apuntan a `docs/evidence/R-1-productores-plan.md` (p. ej. `DECISIONS.md:2375`, `:2456`, `:2465`).
- El artefacto (ii) no cita a D-049 ni a `docs/evidence/R-1-productores-plan.md` en ningún punto de su propio texto (confirmado por ausencia — no se localiza "D-049" ni "R-1-productores-plan" en el archivo). Su "Anclaje normativo" declarado es directamente `DECISIONS.md:2335` (D-048 punto 3) — el mismo mandato que ya invocaba D-049 (`DECISIONS.md:2348-2349`, sección "Herencia") — sin mencionar que ese mandato ya había producido un artefacto R-1 dos días antes.
- El artefacto (ii) se ejecuta sobre un HEAD posterior (`cd10667`, 2026-07-19) al de (i) (`6523de9`, 2026-07-17), y sobre un estado de código materialmente distinto: `materializePlan.js` no existe en el HEAD de (i) (ausente del artefacto) y sí en el HEAD de (ii) (D-056 crea `materializePlan.js` en HEAD de reconocimiento `5e7eb5c`, fecha `2026-07-18`, `DECISIONS.md:2549` — es decir, entre las fechas de ejecución de (i) y (ii)).
- Ningún asiento de DECISIONS.md (incluidos D-058, D-059, D-060, D-061, D-062 — todos posteriores a 2026-07-19) menciona el artefacto (ii) ni resuelve si sustituye, complementa o es independiente del R-1 de D-049. Confirmado por grep: la cadena "objeto-producido-por-motor" no aparece en `DECISIONS.md` (búsqueda sin resultados).

Esta no-resolución queda registrada aquí como **precondición abierta de la hoja de equivalencia** (sección siguiente): cualquier afirmación sobre "candidatos-observable de engine2" depende de qué artefacto (i, ii, o ambos) se tome como fuente de candidatos, y el corpus no fija cuál rige.

---

## Hoja 1 — Verificación de finalidad (A1-P1)

### Lo que el corpus FIJA

- La cláusula P1 en sí misma: `DECISIONS.md:2715-2717` — *"**A1-P1 — Finalidad respecto al predicado.** El observable deberá definirse con la finalidad de contrastar el predicado fijado en `DECISIONS.md:2333`, y no un predicado distinto."*
- Su fuente declarada: `DECISIONS.md:2718` — *"Fuente: `DECISIONS.md:2333`."* — y el predicado remitido, `DECISIONS.md:2333`: *"1. Tesis. Engine2 pretende aproximar el proceso de decisión de un nutricionista humano experto mejor de lo que lo aproxima el motor legacy. Es una afirmación sobre el motor, independiente de cualquier diseño experimental."*
- La condición de necesidad declarada para P1: `DECISIONS.md:2719-2720` — *"Necesidad: sin ella, un observable medible en el plan pero ajeno al predicado no contrastaría la tesis, sino otra propiedad cualquiera."*
- La condición de neutralidad declarada: `DECISIONS.md:2723-2724` — *"Neutralidad: enunciada como finalidad respecto al predicado; no nombra rasgo ni candidato. No prejuzga qué constituye evidencia del predicado (ver hojas abiertas)."*

### Lo que el corpus DEJA ABIERTO

- El propio D-062 registra la cuestión sin resolverla: `DECISIONS.md:2800-2803` — *"Verificación de finalidad (P1): el corpus fija el predicado pero no fija qué constituye evidencia de él (`DECISIONS.md:2330` certifica que el corpus normativo no define qué se mide). El criterio para juzgar si un candidato concreto contrasta el predicado se resuelve en la evaluación de candidatos."*
- La cita de respaldo de esa hoja abierta, `DECISIONS.md:2330`, contiene literalmente: *"Una micro-verificación documental de solo lectura, anclada a `c315d2e`, constató que no existe formulación operacional de la tesis en el corpus normativo: CLAUDE.md:6 describe el proceso del motor y el mecanismo de migración ('evaluación ciega') sin definir qué se mide; ninguna entrada previa de DECISIONS.md la fija."*
- No se localiza en `DECISIONS.md` ningún criterio adicional, posterior a D-062, que
defina qué constituye "evidencia observable del predicado" a efectos de P1 (grep de
"constituye evidencia" y de "contrasta el predicado" sobre `DECISIONS.md` sin
resultados fuera del propio D-062). Ver «Alcance de la demostración».

---

## Hoja 2 — Equivalencia entre observables

### Lo que el corpus FIJA

- La única cláusula del corpus que toca la equivalencia entre observables es A1-P3, `DECISIONS.md:2736-2738`: *"**A1-P3 — Obtención equivalente para ambos motores.** El observable deberá poder obtenerse de forma equivalente para los planes de ambos motores."*
- Su fuente declarada: `DECISIONS.md:2739-2740` — *"Fuente: `DECISIONS.md:2333` (forma comparativa del predicado) y `DECISIONS.md:2339` (la tesis como afirmación sobre el motor, relativa a legacy)."*
- Su alcance declarado, explícitamente acotado a la obtención, no al contenido: `DECISIONS.md:2745-2746` — *"Neutralidad: exige equivalencia de obtención, no un contenido concreto; no rinde aún veredicto comparativo — el veredicto pertenece al diseño experimental."*

### Lo que el corpus DEJA ABIERTO

- El propio D-062 registra la cuestión de la equivalencia como hoja abierta distinta de P3: `DECISIONS.md:2804-2807` — *"Equivalencia entre observables: queda abierta la cuestión de cuándo dos observables formalmente obtenibles en ambos motores pueden considerarse equivalentes a efectos de comparación. No pertenece al espacio de admisibilidad y deberá resolverse durante la evaluación de candidatos."*
- No se localiza en el corpus gobernado ningún criterio de equivalencia entre observables anterior o posterior a D-062. Grep de "equivalen" sobre `DECISIONS.md`, `docs/spec/*.md` y `docs/evidence/**/*.md` no produce ninguna otra ocurrencia que trate la equivalencia de observables a efectos de comparación entre motores (las demás ocurrencias de "equivalen" en el corpus tratan materias distintas: sustitución de platos, `DECISIONS.md:1917`; ausencia de dato equivalente en engine2 para un campo concreto no relacionado, `DECISIONS.md:1093`; convención documental, `DECISIONS.md:2435`).
- Dado el hallazgo de la subtarea previa: la pregunta de equivalencia presupone un conjunto de candidatos sobre el que aplicarse, y ese conjunto depende de qué artefacto R-1 se tome como base (ver Subtarea, desenlace c). El corpus no fija esa base, por lo que la propia noción de "dos observables formalmente obtenibles en ambos motores" carece hoy de un universo de candidatos único y resuelto sobre el que aplicarse.

---

## Cierre

Este documento demuestra el contenido literal del corpus gobernado sobre las dos hojas de A2 y sobre la identidad de los artefactos "R-1". No fija criterios, no compara observables, no declara ningún observable, no resuelve la identidad más allá de lo que el propio corpus permite demostrar.

## Alcance de la demostración

1. Barrido. Este reconocimiento agota su mandato sobre `DECISIONS.md` para las dos
cadenas literales consultadas ("constituye evidencia", "contrasta el predicado").
No establece nada sobre el resto del corpus gobernado: `CLAUDE.md` y `docs/spec/**`
no fueron barridos, y un criterio redactado con otra literalidad no habría sido
capturado por esas dos cadenas.

2. Ancla del resultado heredado. La certificación citada en `DECISIONS.md:2330`
está anclada a `c315d2e`, no a `79f31ae`. El grep realizado por este reconocimiento
constituye su re-verificación parcial en el ancla vigente, con el alcance enunciado
en el punto 1.
