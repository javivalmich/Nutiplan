# Reconocimiento (solo lectura): completitud de la base demostrativa sobre la relación A/B

- **HEAD de reconocimiento:** `03f5ea3`. Confirmado por `git log -1` antes de escribir este documento.
- **`git status --porcelain`:** sin salida (working tree limpio). Confirmado antes de escribir este documento.
- **Naturaleza:** reconocimiento read-only. Demuestra; no decide.
- **Artefactos de referencia:**
  - **A** = `docs/evidence/R-1-productores-plan.md`
  - **B** = `docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md`
  - Ambos titulados "R-1". Un reconocimiento previo (`docs/evidence/R-relacion-artefactos-r1.md`) demostró que difieren materialmente en su sub-objeto engine2 y que B no está citado en `DECISIONS.md`.
- **Pregunta única de este acto:** ¿existe en el corpus gobernado alguna fuente primaria que establezca o condicione la relación entre A y B? Todo lo leído a continuación responde a esa pregunta y a ninguna otra.

---

## Modo 1 — Genealogía estructural sobre `docs/evidence/protocolo-evaluacion/`

### 1. Contenido real del directorio

`git ls-files docs/evidence/protocolo-evaluacion/` a `03f5ea3` devuelve exactamente cinco ficheros:

```
docs/evidence/protocolo-evaluacion/2026-07-18-R-protocolo-de-facto.md
docs/evidence/protocolo-evaluacion/R-0-reconocimiento-frente-B.md
docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md
docs/evidence/protocolo-evaluacion/R-B1-representacion-consumida-evaluacion.md
docs/evidence/protocolo-evaluacion/R-B2-0-decidibilidad-superficie-publica.md
```

Los tres artefactos exigidos por el mandato de este acto existen a `03f5ea3`: `R-B1-representacion-consumida-evaluacion.md`, `R-1-objeto-producido-por-motor.md` (= B) y `R-B2-0-decidibilidad-superficie-publica.md`. El directorio contiene además dos ficheros no exigidos explícitamente por el mandato: `2026-07-18-R-protocolo-de-facto.md` y `R-0-reconocimiento-frente-B.md`. Los cinco se examinan.

### 2. Por artefacto: ancla, mandato, referencias emitidas y recibidas

**`2026-07-18-R-protocolo-de-facto.md`**
- Ancla declarada: HEAD `b5684be` (`:3`), fecha `2026-07-18` (`:5`).
- Mandato/naturaleza: reconocimiento de solo lectura sobre cláusulas madre e invariantes de facto del protocolo de evaluación; sella, "como evidencia versionada, dos reconocimientos de solo lectura ejecutados sobre HEAD `b5684be`" (`:167`); decisiones derivadas constan en D-054, norma resultante `docs/spec/protocolo-evaluacion.md` v1.0 (`:167`).
- Referencias emitidas: a **A** por ruta completa, cuatro veces — `:8` (convención de forma), `:70` (ancla a commit, I-5), `:79` (forma convencional del artefacto, I-8), `:90` (ritual de anclaje git log/git status). Ninguna de las cuatro citas versa sobre el contenido de engine2 ni sobre candidatos de producción; todas son sobre la forma/convención documental o el dato de fecha/HEAD de A. Ninguna referencia a **B** (confirmado por grep de `"objeto-producido-por-motor"` sobre este fichero, sin resultados). Cita extensamente `docs/spec/plan-observable.md` (p. ej. `:19,23-40`) y otros artefactos de `docs/evidence/` fuera de este subcorpus (`docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md`, `docs/evidence/variedad-verdura/baseline-variedad-verdura.md`).
- Referencias recibidas: ninguna. Grep de `"2026-07-18-R-protocolo-de-facto"` sobre el resto del subcorpus, sin resultados.

**`R-0-reconocimiento-frente-B.md`**
- Ancla declarada: HEAD `c41558e` (`:3`), fecha `2026-07-19` (`:5`).
- Mandato: "Re-derivación desde fuentes primarias versionadas del repositorio. Responde: ¿por qué el Frente B empezó donde empezó? Corpus: raíces `DECISIONS.md` D-047, D-048 y `docs/spec/protocolo-evaluacion.md` §6/§6.1... No cita R-A9 ni D-058." (`:7-10`).
- Referencias emitidas: a `DECISIONS.md` (D-047, D-048) y `docs/spec/protocolo-evaluacion.md`, `docs/spec/plan-observable.md`. Ninguna referencia a **A** ni a **B** por ruta — confirmado por grep de `"R-1-productores-plan"` y de `"objeto-producido-por-motor"` sobre este fichero, ambos sin resultados.
- Referencias recibidas: citado por `R-B1-representacion-consumida-evaluacion.md:13,28,32` (ver más abajo).

**`R-B1-representacion-consumida-evaluacion.md`**
- Ancla declarada: "Estado del repo... `main @ 65e9483`" (`:3`), fecha `2026-07-19` (`:4`).
- Mandato: responde a la pregunta de qué objeto consume "el juez de Fase 7" (`:1,9`), fijando el corpus de partida por cita explícita a R-0 (`:13`).
- Referencias emitidas: a `R-0-reconocimiento-frente-B.md:8-10` (`:13`, `:32`), a `DECISIONS.md:2330,2335,2344,2346,2320` y a `docs/spec/protocolo-evaluacion.md:57`, `CLAUDE.md:6`. Ninguna referencia por ruta a **A** ni a **B** — confirmado por grep de `"R-1-productores-plan"` y `"objeto-producido-por-motor"` sobre este fichero, ambos sin resultados. Sí reproduce, entre comillas, la frase de `DECISIONS.md:2335` que remite "al reconocimiento R-1 del Frente B" (`:23`) — mención del rótulo genérico "R-1", sin ruta, sin identificar cuál de los dos artefactos.
- Referencias recibidas: citado por **B** (`R-1-objeto-producido-por-motor.md:6,13`, como "Anclaje disparador") y por `R-B2-0-decidibilidad-superficie-publica.md:28`.

**B = `R-1-objeto-producido-por-motor.md`**
- Ancla declarada: "Estado del repo... `main @ cd10667`" (`:3`), fecha `2026-07-19` (`:4`).
- Mandato: "Anclaje normativo: `DECISIONS.md:2335` (D-048, punto 3)" (`:5`); "Anclaje disparador: `docs/evidence/protocolo-evaluacion/R-B1-representacion-consumida-evaluacion.md` — demostró que la forma observable del objeto queda remitida a este trabajo" (`:6`).
- Referencias emitidas: a `DECISIONS.md:2335` y a `R-B1-representacion-consumida-evaluacion.md` (`:6,13`). Ninguna referencia a **A** — confirmado por grep de `"R-1-productores-plan"` y de `"D-049"` sobre este fichero, ambos sin resultados (verificación ya realizada en el reconocimiento previo, no repetida aquí más que por esta constancia).
- Referencias recibidas: citado y examinado íntegramente por `R-B2-0-decidibilidad-superficie-publica.md:5,19,24,32`.

**`R-B2-0-decidibilidad-superficie-publica.md`**
- Ancla declarada: "Estado del repo en el que se ejecutó la lectura: `main @ af52914`" (`:3`), fecha `2026-07-19` (`:4`).
- Mandato/objeto: "Objeto examinado: `docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md`, tal como quedó fijado en `af52914`" (`:5`); pregunta: "¿El R-1 versionado contiene criterios suficientes para decidir cuál es la superficie pública de producción de engine2, o únicamente describe las superficies candidatas?" (`:11`).
- Referencias emitidas: a **B** por ruta, cuatro veces (`:5,19,24,32`); a `R-B1-representacion-consumida-evaluacion.md` (`:28`, como "disparador que motivó este reconocimiento"); a `DECISIONS.md:2335` (`:28`). Ninguna referencia por ruta a **A** — confirmado por grep de `"R-1-productores-plan"` sobre este fichero, sin resultados.
- Referencias recibidas: ninguna. Grep de `"R-B2-0-decidibilidad-superficie-publica"` sobre el resto del subcorpus, sin resultados.

### 3. Cadena documental reconstruida

A partir de las referencias emitidas/recibidas (punto 2), el subcorpus se organiza en dos componentes desconectados entre sí:

- **Cadena principal:** `R-0-reconocimiento-frente-B.md` → (citado por) `R-B1-representacion-consumida-evaluacion.md` → (citado como disparador por) **B** (`R-1-objeto-producido-por-motor.md`) → (examinado íntegramente por) `R-B2-0-decidibilidad-superficie-publica.md`. En ningún eslabón de esta cadena aparece una referencia por ruta a **A**.
- **Nodo aislado:** `2026-07-18-R-protocolo-de-facto.md` — no cita ni es citado por ningún otro fichero del subcorpus. Su única conexión con los artefactos bajo examen es la cita repetida de **A** (cuatro veces, `:8,70,79,90`), exclusivamente sobre forma/convención documental, nunca sobre contenido de engine2.

No existe ningún arco de la cadena que una el nodo que cita a **A** con la cadena que produce/examina **B**.

### 4. ¿Establece o condiciona algún artefacto del subcorpus la relación entre A y B?

Sobre esta pregunta, con archivo:línea:

- Ningún fichero del subcorpus cita simultáneamente la ruta de **A** y la ruta de **B**. Confirmado por los grep del punto 2, artefacto por artefacto, y por el grep agregado ya reportado: `"R-1-productores-plan"` solo aparece en `2026-07-18-R-protocolo-de-facto.md:8,70,79,90`; `"objeto-producido-por-motor"` solo aparece en `R-B2-0-decidibilidad-superficie-publica.md:5,19,24,32` (mencionando a B, no a A).
- Ninguna referencia a **A** en el subcorpus versa sobre su contenido relativo a engine2 (candidatos de producción, cadena `buildWeekArc`/`expandWeekArc`/`runWalk`); las cuatro citas de `2026-07-18-R-protocolo-de-facto.md` versan exclusivamente sobre la forma del artefacto (cabecera, fecha, ritual de anclaje) — es decir, ninguna de ellas se refiere a A por contenido relevante a la pregunta de este acto, solo por convención documental.
- Se buscó explícitamente si algún artefacto del subcorpus se refiere a **A** por contenido sin nombrar su ruta (advertencia del mandato). `R-B1-representacion-consumida-evaluacion.md:23` reproduce la frase de `DECISIONS.md:2335` que remite "al reconocimiento R-1 del Frente B" — mención del rótulo genérico, sin ruta y sin contenido propio que permita identificar cuál de los dos artefactos titulados "R-1" es el referido; no se localiza en el subcorpus ninguna otra mención de contenido (sin ruta) que sea identificable como referencia a A. `R-B2-0-decidibilidad-superficie-publica.md:15,32` usa igualmente el rótulo desnudo "R-1" para referirse a **B** —el objeto que examina—, no a A.
- `R-B2-0-decidibilidad-superficie-publica.md:28` declara expresamente el origen del mandato de B: "`DECISIONS.md:2335` (D-048, punto 3) encomendó la definición formal del objeto a este mismo R-1 — mandato delegado aquí, no remitido a otro sitio." Esta frase fija que el mandato de D-048 punto 3 recae sobre B según R-B2-0, sin mencionar a A y sin comparar ambos artefactos.

**No se localiza, en ninguno de los cinco ficheros de `docs/evidence/protocolo-evaluacion/`, una fuente primaria que establezca o condicione la relación entre A y B.** Esta ausencia es el resultado de este Modo, con la constancia del barrido citado arriba.

---

## Modo 2 — Barrido de existencia sobre `CLAUDE.md` y `docs/spec/**`

### 1. Contenido real de `docs/spec/`

`git ls-files docs/spec/` a `03f5ea3` devuelve exactamente dos ficheros:

```
docs/spec/plan-observable.md
docs/spec/protocolo-evaluacion.md
```

### 2. Grep de cadenas requeridas

Cadenas buscadas sobre `CLAUDE.md`, `docs/spec/plan-observable.md` y `docs/spec/protocolo-evaluacion.md`:

- `"R-1"` → 2 coincidencias, ambas en `docs/spec/`, ninguna en `CLAUDE.md`:
  - `docs/spec/plan-observable.md:38` — "Este documento se apoya en, pero no repite: D-048 (tesis y objeto de evaluación), D-049/R-1 (estado de productores), D-050 (arquitectura del frente y frontera de decisión), D-051 (contrato corregido)."
  - `docs/spec/protocolo-evaluacion.md:72` — "...el mismo precedente que fija la nota sobre la forma del documento en `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md` para la convención heredada de R-1."
- `"productores-plan"` → 0 coincidencias en los tres ficheros.
- `"objeto-producido-por-motor"` → 0 coincidencias en los tres ficheros.
- `"protocolo-evaluacion"` → 1 coincidencia (además de la propia ruta del fichero, no contada): `docs/spec/protocolo-evaluacion.md:65` — autorreferencia de identidad del documento (§8.1).
- `"docs/evidence"` → 2 coincidencias, ambas en `docs/spec/`: `docs/spec/plan-observable.md:98` (§7.0, remite el estado de conformidad de motores a "evidencia versionada (`docs/evidence/`)"); `docs/spec/protocolo-evaluacion.md:34` (§3.3, cita D-053 sobre ubicación de artefactos en `docs/evidence/<nombre-spec>/`) y `:72` (ya citada arriba).

Ninguna de las coincidencias de `"R-1"` cita la ruta de A ni la ruta de B. Ambas usan el rótulo desnudo "R-1" — la primera (`plan-observable.md:38`) ligado explícitamente a D-049 ("D-049/R-1"); la segunda (`protocolo-evaluacion.md:72`) ligado a la convención de forma de artefactos, mismo tema ya observado en `2026-07-18-R-protocolo-de-facto.md`.

### 3. Lectura íntegra de `CLAUDE.md` y `docs/spec/**`

Se leyeron íntegros los tres ficheros (`CLAUDE.md`, 72 líneas; `docs/spec/plan-observable.md`, 121 líneas; `docs/spec/protocolo-evaluacion.md`, 73 líneas), con la pregunta de lectura restringida a la pregunta única de este acto.

- **`CLAUDE.md`** (72 líneas, leído íntegro): no contiene ninguna mención, directa ni por contenido sin ruta, a A, a B, ni a una relación entre ambos. El único punto de contacto temático es la sección "Contrato de shape entre motores" (`:17-28`), que fija el contrato normativo que tanto A como B usan como referencia para describir lo que cada motor produce — pero `CLAUDE.md` mismo no menciona a ninguno de los dos artefactos ni remite a "R-1".
- **`docs/spec/plan-observable.md`** (121 líneas, leído íntegro): la única mención relevante es `:38`, ya citada, que liga el rótulo "R-1" a D-049 sin nombrar artefacto por ruta. `:49` (§4.2.1) delega la definición de "unidades temporales" al "protocolo de evaluación vigente" — materia declarada fuera de alcance de este acto (suficiencia del sustrato). Ningún otro pasaje del documento, leído íntegro, contiene una referencia identificable — por ruta o por contenido citado — a A o a B, ni una declaración sobre cuál de los dos gobierna nada.
- **`docs/spec/protocolo-evaluacion.md`** (73 líneas, leído íntegro): la única mención relevante es `:72`, ya citada, sobre convención de forma heredada de "R-1" (rótulo desnudo, sin ruta). El resto del documento regula admisibilidad, reproducibilidad, cegado y separación medición/decisión sin mencionar a A, a B, ni al mandato de D-048 punto 3 que originó ambos artefactos.

**Resultado negativo declarado:** la lectura íntegra de los tres ficheros, restringida a la pregunta única, no encuentra ninguna fuente que establezca o condicione la relación entre A y B. Las únicas dos apariciones del rótulo "R-1" en estos ficheros (`plan-observable.md:38`, `protocolo-evaluacion.md:72`) usan el rótulo sin ruta y sin contenido que permita identificar cuál de los dos artefactos titulados "R-1" es el referido, ni comparar ambos.

---

## Alcance de la demostración

**Ficheros enumerados.** `docs/evidence/protocolo-evaluacion/` mediante `git ls-files` (5 ficheros, listados en Modo 1 punto 1). `docs/spec/` mediante `git ls-files` (2 ficheros, listados en Modo 2 punto 1).

**Ficheros leídos íntegros.** Los cinco ficheros de `docs/evidence/protocolo-evaluacion/`. `CLAUDE.md` íntegro. `docs/spec/plan-observable.md` íntegro. `docs/spec/protocolo-evaluacion.md` íntegro.

**Cadenas buscadas mediante grep.**
- Sobre el subcorpus `docs/evidence/protocolo-evaluacion/`: `"R-1-productores-plan"`, `"objeto-producido-por-motor"`, `"protocolo-evaluacion/R-1"`, y — para reconstruir la genealogía citada en Modo 1 punto 3 — los nombres de fichero `"2026-07-18-R-protocolo-de-facto"`, `"R-0-reconocimiento-frente-B"`, `"R-B1-representacion-consumida-evaluacion"`, `"R-1-objeto-producido-por-motor"`, `"R-B2-0-decidibilidad-superficie-publica"`, cada una contra el resto del subcorpus.
- Sobre `CLAUDE.md` y `docs/spec/**`: `"R-1"`, `"productores-plan"`, `"objeto-producido-por-motor"`, `"protocolo-evaluacion"`, `"docs/evidence"`.

**Qué no se estableció.** Este acto no determina si la ausencia demostrada implica que hace falta o no un asiento adicional, ni si la base demostrativa sobre la relación A/B queda o no agotada — esa valoración está fuera del mandato de este acto. No se releyó el código de `engine2/` ni se re-derivaron candidatos de producción; toda afirmación sobre contenido de A o B procede del texto ya citado en `docs/evidence/R-relacion-artefactos-r1.md` o de citas nuevas hechas aquí sobre el propio subcorpus documental. No se barrió `DECISIONS.md` en este acto — esa fuente ya fue barrida para esta misma pregunta por el reconocimiento previo y no se repite aquí. No se examinó ningún fichero de `docs/evidence/` fuera de `docs/evidence/protocolo-evaluacion/` y del propio artefacto A (cuya ruta vive en `docs/evidence/` directamente, no en el subcorpus): en particular, no se barrieron `docs/evidence/plan-observable/`, `docs/evidence/variedad-verdura/` ni otros subdirectorios de `docs/evidence/`, más allá de las citas que el propio subcorpus examinado hace hacia ellos (reportadas en Modo 1 punto 2 donde aparecen). No se tocó ningún fichero; no se ejecutó ningún motor.
