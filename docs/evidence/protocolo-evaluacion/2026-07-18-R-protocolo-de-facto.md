# R de facto — cláusulas madre, invariantes y unidades temporales del protocolo de evaluación

**HEAD verificado:** `b5684be` (ambos reconocimientos se ejecutaron sobre ese commit)
**Instrumento:** reconocimiento de solo lectura.
**Fecha:** 2026-07-18

> **Nota sobre la forma de este documento.** La estructura (encabezado HEAD/instrumento/fecha, secciones
> numeradas) sigue la convención de facto establecida por `docs/evidence/R-1-productores-plan.md` y
> heredada por `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md`. Esta forma es
> **convención heredada, no exigencia** de norma alguna, tal como declara ese mismo artefacto de
> conformidad respecto de su propia forma.

---

## Sección 1 — R de cláusulas madre e invariantes de facto

### Objetivo 1 — Cláusulas madre de la spec v1.0

**1.1 — Ruta y versión.** `docs/spec/plan-observable.md`. Versión declarada: 1.0 (línea 3), estado "ratificada por D-052" (línea 4).

**1.2 — Texto literal de las cláusulas solicitadas:**

§1.2.b (`docs/spec/plan-observable.md:21`):
"2. No deberá regular: (a) el proceso interno de generación del plan; (b) el diseño del protocolo ciego de evaluación, que será objeto de norma propia; (c) la implementación concreta de ningún productor."

§4.2.1 (`docs/spec/plan-observable.md:49`):
"1. days deberá ser una colección enumerable cuyos elementos representen, en orden estable, las unidades temporales definidas por el protocolo de evaluación vigente."

§7.5 (`docs/spec/plan-observable.md:110`):
"§7.5 — Posición vinculante para la evaluación. Ningún plan podrá entrar en evaluación comparativa si su motor no se encuentra en posición verificable con verificación de conformidad registrada. La evaluación de planes no conformes queda fuera de protocolo."

**1.3 — Cláusulas que mencionan "protocolo de evaluación" / "evaluación" / delegan materia a norma futura** (texto literal, archivo:línea; ninguna usa la frase exacta "segunda especificación" — ausencia observada):

- `docs/spec/plan-observable.md:13` — "El protocolo de evaluación que operará sobre este objeto será materia de norma propia."
- `docs/spec/plan-observable.md:21` — ya citada en 1.2 (§1.2.b).
- `docs/spec/plan-observable.md:49` — ya citada en 1.2 (§4.2.1).
- `docs/spec/plan-observable.md:72` — "§5.0 ... Regula la transformación como función del objeto; no regula el diseño del protocolo que consumirá su resultado (§1.2.b)." — remite explícitamente a §1.2.b.
- `docs/spec/plan-observable.md:110` — ya citada en 1.2 (§7.5).
- `docs/spec/plan-observable.md:15` (dudosa) — "Si la evaluación requiere una propiedad que algún motor existente no expone, este documento deberá exigirla igualmente." — habla de "la evaluación" pero no delega materia; la incluyo marcada como dudosa por mención explícita del término.
- `docs/spec/plan-observable.md:36` (dudosa) — "donde CLAUDE.md fija el contrato mínimo, este documento fija las obligaciones adicionales que la evaluación requiere." — mención del término sin delegar; dudosa por el mismo criterio.

**1.4 — Índice de secciones (solo títulos):**

§0 — Género y principios del documento
§1 — Alcance
§2 — Definiciones
§3 — Relación con normas existentes
§4 — Contrato normativo del objeto de plan observable
§5 — Requisitos de proyección
§6 — Condiciones de fidelidad
§7 — Obligaciones de conformidad por motor
§8 — Estado y versionado

### Objetivo 2 — Protocolo de evaluación de facto: invariantes

**I-1.** PRNG mulberry32 reproducido byte-a-byte en todo script de medición, nunca reimplementado ni parametrizado distinto.
Evidencia: `analysis/baseline_n1000.mjs:3-11`, `analysis/phase2_measure.mjs:3-11`, `analysis/gate2_measure.test.js:15-23`, `analysis/gate2b_measure.test.js:13-21`, `analysis/gate4_veg_baseline.test.js:10-18`, `analysis/gate4_closure.test.js:15-23`, `analysis/gate4_seed1_check.test.js:3-11`, `analysis/gate4_find_seed.test.js:4-12`, `analysis/gate4_protein_guard.test.js:12-20` (9 archivos independientes, implementación idéntica carácter por carácter).

**I-2.** Semillas como rango secuencial documentado, nunca aleatorio ni ad-hoc — con una variante de convención no resuelta.
Evidencia mayoritaria (seed = i + 1, rango 1..N): `analysis/gate2_measure.test.js:236-237`, `analysis/gate4_veg_baseline.test.js:97-98`, `analysis/gate4_closure.test.js:78-79`, `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:24` ("Semillas 1..500 ... seed = i + 1").
Variante divergente: `analysis/baseline_n1000.mjs:35` y `analysis/stage2a_n1000.mjs:39` usan `for (let seed = 0; seed < 1000; seed++)` — rango 0..999, sin el offset +1. La invariante real es "rango secuencial fijo, documentado" — el punto de partida (0 vs 1) no está unificado entre campañas.

**I-3.** Self-check de determinismo obligatorio y bloqueante antes de cualquier medición (mismo seed, dos ejecuciones, comparación por igualdad de string).
Evidencia: `analysis/gate2_measure.test.js:128-163` (Stage 0, "BLOQUEANTE", `throw new Error('NONDETERMINISMO...')`), `analysis/gate2b_measure.test.js:188-230` (Stage 0c, mismo patrón, tres vectores distintos verificados), `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md:25-61` (generación por triplicado + hash SHA-256 para verificar reproducibilidad antes de aceptar el artefacto).

**I-4.** Doble ancla script+artefacto: toda cifra citable tiene un script versionado ejecutable por un tercero y un documento que declara el resultado exacto esperado.
Evidencia: `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md:265-274` (§Reproducibilidad: comando exacto + hash a comparar) junto a `docs/evidence/plan-observable/gen-legacy-2026-07-18.mjs:1-9` (script co-ubicado, cabecera que referencia el propio artefacto); `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:102-135` (§5 "Contrato de reproducción": invariantes + comando exacto) junto a los scripts pareados citados en `baseline-variedad-verdura.md:129-130`.

**I-5.** Toda cifra citable ancla a un commit/HEAD específico del repositorio, no a un momento conversacional.
Evidencia: `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md:3` ("HEAD verificado: 0ffc686"), `docs/evidence/R-1-productores-plan.md:3` ("HEAD de reconocimiento: 6523de9"), `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:21` ("Commit | 7024bda...").

**I-6.** Distinción explícita entre cifra citable (reproducible, con ancla) y cifra fantasma (sin script/artefacto/commit que la sustente) — la segunda se retira, no se disputa.
Evidencia: `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md:30-58` (objeto completo declarado "no reproducible entre corridas" vs. proyección reproducible con hash ancla); `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:144-152` (§7: cifra conversacional "~49,8%" declarada "no reproducible... no hay artefacto, script ni commit que la sustente" y "retirada como referencia").

**I-7.** Separación medición/decisión: el instrumento mide y registra veredictos; no compara motores ni prescribe acción, y separa no-conformidades de candidatos a revisión de norma.
Evidencia: `docs/spec/plan-observable.md:98` (§7.0: "no describe el estado de conformidad de ningún motor; dicho estado es materia de evidencia versionada... no de esta norma"); `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md:4` ("Ninguna comparación entre motores; ningún juicio sobre engine2"); `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md:243-254` (tablas separadas "No conformidades" vs. "Candidatas §8.2").

**I-8.** Forma convencional del artefacto de evidencia (cabecera HEAD/Instrumento/Fecha + secciones numeradas + tabla de veredictos), heredada por convención de facto y explícitamente no exigida por norma.
Evidencia: `docs/evidence/R-1-productores-plan.md:1-5` (mismo esqueleto de cabecera); `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md:9-13` (nota explícita: "sigue la convención de facto establecida por docs/evidence/R-1-productores-plan.md... convención heredada, no exigencia de plan-observable.md v1.0").

**I-9.** Fecha absoluta en formato ISO (YYYY-MM-DD) como unidad temporal de todo artefacto de evidencia.
Evidencia: `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md:5` ("Fecha: 2026-07-18"), `docs/evidence/R-1-productores-plan.md:5` ("Fecha: 2026-07-17"), `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:22` ("Fecha de la medición | 2026-07-16").

**I-10.** Tamaño de muestra siempre un entero redondo grande, declarado explícitamente en el propio artefacto/script (nunca implícito ni derivado).
Evidencia: `analysis/gate2_measure.test.js:222` (`const N = 500;`), `analysis/gate4_protein_guard.test.js:46` (`const N = 200;`), `analysis/baseline_n1000.mjs:35` (`seed < 1000`). El valor de N varía por campaña (200/500/1000); lo invariante es que siempre se declara explícitamente, nunca se omite.

**Observadas sin recurrencia (no promovidas a invariante):**

- Nomenclatura de archivo con fecha-ISO incrustada en el propio nombre (`2026-07-18-legacy-conformidad-v1.0.md`, `gen-legacy-2026-07-18.mjs`): solo aparece en `docs/evidence/plan-observable/`. La campaña de verdura (`docs/evidence/variedad-verdura/baseline-variedad-verdura.md`, `veg_variety_engine2.mjs`, `veg_variety_legacy.mjs`) no incrusta fecha en el nombre de archivo.
- Ritual documentado explícito de anclaje (`git log -1` + `git status` como sección "§1 Cimiento" escrita en el propio artefacto): solo en `docs/evidence/R-1-productores-plan.md:14-17`. El artefacto de conformidad plan-observable (`2026-07-18-legacy-conformidad-v1.0.md`) declara el HEAD en la cabecera pero no documenta el paso de `git status` como sección propia.

**Ausencia observada:** el corpus solicitado mencionaba "baselines de verdura N=1000 de la campaña de repetición". No existe tal artefacto: la campaña de verdura documentada en `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:23` usa N=500 ("N (semanas por motor) | 500"), no N=1000. Los dos scripts con N=1000 localizados en el repo (`analysis/baseline_n1000.mjs`, `analysis/stage2a_n1000.mjs`) miden coincidencia de proteína con el slot-hint, no variedad de verdura.

---

## Sección 2 — Micro-R de unidades temporales

Anclaje verificado: HEAD = `b5684be`, árbol limpio. Cumple condición previa.

### 1. Unidad de muestreo / unidad de observación / objeto producido, por instrumento

**A. `analysis/baseline_n1000.mjs`**

- Unidad de muestreo: bucle exterior `for (let seed = 0; seed < 1000; seed++) {` (baseline_n1000.mjs:35), una llamada a `buildPlan(...)` por iteración con `rng: mulberry32(seed)` nuevo (baseline_n1000.mjs:41-42) — cada iteración es una semana.
- Unidad de observación: dentro de la iteración, `hintEntries.forEach((e, i) => {` (baseline_n1000.mjs:64), indexado por día vía `const day = dayOrder[i];` (baseline_n1000.mjs:65) sobre `ORDERED_DAYS` de 6 elementos (baseline_n1000.mjs:27) — la unidad de observación es el día.
- Objeto producido distinto de las dos anteriores: ausente. Cada observación de día se vuelca directamente en el acumulador global `stats[day]` (baseline_n1000.mjs:66-71); no se retiene ningún objeto por semana.

**B. `analysis/stage2a_n1000.mjs`** — misma estructura que A:

- Muestreo: `for (let seed = 0; seed < 1000; seed++) {` (stage2a_n1000.mjs:39), `buildPlan(...)` una vez por iteración (stage2a_n1000.mjs:45-46).
- Observación: `hintEntries.forEach((e, i) => {` (stage2a_n1000.mjs:67), día vía `dayOrder[i]` (stage2a_n1000.mjs:68).
- Objeto producido: ausente, igual que en A — acumulación directa en `stats[day]` (stage2a_n1000.mjs:69-78).

**C. `analysis/gate2_measure.test.js` — Stage 2**

- Muestreo: `for (let i = 0; i < N; i++) {` con `N = 500` (gate2_measure.test.js:222, gate2_measure.test.js:236), `run(i + 1)` una vez por iteración (gate2_measure.test.js:237).
- Observación: `lunchCats.push(days.map(d => lunchInfo(d).category));` y línea equivalente para `dinnerCats` (gate2_measure.test.js:238-239) — inspecciona los 7 elementos de `days`, uno por día.
- Objeto producido, distinto de las dos unidades anteriores: sí existe — cada iteración retiene un vector de 7 categorías por semana en `lunchCats`/`dinnerCats`/`lunchRaws`/`dinnerRaws` (gate2_measure.test.js:238-241), reutilizado después en T1-T5. A diferencia de A/B, aquí la iteración produce un objeto semanal propio, no solo un efecto lateral acumulado.

**D. `analysis/gate2b_measure.test.js` — Stage 2 (salsa)**

- Muestreo: `for (let i = 0; i < N; i++) {` con `N = 500` (gate2b_measure.test.js:335, gate2b_measure.test.js:349), `run(i + 1)` por iteración (gate2b_measure.test.js:350).
- Observación: `collectWeek(r.days)` (gate2b_measure.test.js:351) itera `days.forEach(day => {` excluyendo `day.special === 'libre'` (gate2b_measure.test.js:124-125) — unidad = día. Pero el propio instrumento declara textualmente dos unidades de observación distintas dentro de la misma unidad de muestreo: "apariciones" a nivel de comida ("instancias de meal (mismo día cuenta doble si L+D tienen la misma salsa)") y "días-distintos" a nivel de día ("nº de días donde apareció esa salsa ≥1 vez") — cita literal en gate2b_measure.test.js:402-403. El array `allSauces` que alimenta "apariciones" combina lunch+dinner en 12 valores por semana (gate2b_measure.test.js:352), es decir opera a nivel de comida, no de día.
- Objeto producido: ausente — conteos volcados directamente en acumuladores (`sauceApps[sk]`, `sauceDays[sk]`, gate2b_measure.test.js:376-386), sin objeto semanal retenido, como en A/B.

**E. `analysis/gate4_veg_baseline.test.js`** (cuarto instrumento, por relevancia directa al artefacto de §2)

- Muestreo: `for (let i = 0; i < N; i++) {` con `N = 500` (gate4_veg_baseline.test.js:90, gate4_veg_baseline.test.js:97), `run(i + 1)` por iteración (gate4_veg_baseline.test.js:98).
- Observación: `collectWeek(r.days)` (gate4_veg_baseline.test.js:99) itera por día excluyendo `special === 'libre'` (gate4_veg_baseline.test.js:74-75); dentro de la iteración también se combina a nivel de comida en `allVegs`/`allProts` (gate4_veg_baseline.test.js:100, gate4_veg_baseline.test.js:120).
- Objeto producido: sí — un escalar `maxDD` por semana ("mayor nº de días distintos en que aparece una misma verdura", gate4_veg_baseline.test.js:103-112), más `calabacinDD`, `distinctProteinsPerWeek`, `distinctFamiliesPerWeek` (gate4_veg_baseline.test.js:114-126) — objetos resumen por semana, en la misma línea que C.

### 2. Declaración de unidad en los artefactos de evidencia

`docs/evidence/variedad-verdura/baseline-variedad-verdura.md` — declara explícitamente:
"N (semanas por motor) | 500" — baseline-variedad-verdura.md:23
"Semillas | 1..500 (una semana por semilla, `seed = i + 1` para `i` en `0..499`)" — baseline-variedad-verdura.md:24

Los runners que generan estos números confirman la misma unidad: `veg_variety_legacy.mjs:131` `for (let i = 0; i < N; i++) { const r = run(i + 1); ... }` y `veg_variety_engine2.mjs:130-131`.

`docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md` — este artefacto no ejecuta una campaña multi-semilla: es la verificación estructural de un único objeto de plan (`weekNumber: 13`, 2026-07-18-legacy-conformidad-v1.0.md:21). La palabra "semana" no aparece en ningún punto de este documento (búsqueda verificada, cero coincidencias). La expresión "unidad temporal" sí aparece, pero únicamente como repetición literal de los títulos de cláusula de la especificación: 2026-07-18-legacy-conformidad-v1.0.md:120, :128, :137 — en ningún caso el documento glosa esa expresión con una afirmación del tipo "la unidad temporal es el día". Lo que sí se observa y cita es la cardinalidad y el nombrado del array: "`days` es un array de 7 elementos [...] `Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo`" (2026-07-18-legacy-conformidad-v1.0.md:116-118), de lo cual el día como referente de cada elemento es inferible por el propio contenido observado, pero no es una declaración textual de "unidad" en el sentido en que sí lo hace el artefacto de variedad-verdura para "semana".

### 3. ¿Instrumento con unidad de muestreo distinta de la semana?

Se revisaron los encabezados de bucle exterior de todos los ficheros de `analysis/` (`grep` sobre `for (let seed|for (let i`) y de los dos runners de `docs/evidence/variedad-verdura/`. En todos los casos localizados el bucle exterior asocia una iteración a una única llamada productora de plan (`buildPlan`/`run`/`runWeek`) con una semilla nueva por iteración — ejemplos adicionales a los ya citados: `gate4_closure.test.js:78`, `gate4_protein_guard.test.js:49`, `phase2_measure.mjs:55`, `freeform_2a_g4_table.mjs:31`, `freeform_2a_targeted.mjs:177`. Los bucles interiores con `for (let i = 0; i < 7; i++)` (p. ej. `freeform_2a_g4_table.mjs:33`, `freeform_2a_offtarget_trace.mjs:32`) recorren los 7 días dentro de la semana ya muestreada por el bucle exterior — no constituyen una unidad de muestreo alternativa, sino la unidad de observación (día) ya descrita en el punto 1.

No se encontró, en el conjunto revisado, ningún instrumento cuya unidad de muestreo sea el día suelto, el mes o un plan multi-semana. Se declara la ausencia como observada sobre el conjunto efectivamente inspeccionado (todo `analysis/*.mjs`, `analysis/*.test.js` y los dos runners de `docs/evidence/variedad-verdura/`); no se afirma haber revisado la totalidad de artefactos históricos del repositorio fuera de ese conjunto.

### 4. Comparación §4.2.1 (plan-observable.md) vs. unidad de observación practicada

Texto literal de §4.2.1: "`days` deberá ser una colección enumerable cuyos elementos representen, en orden estable, las unidades temporales definidas por el protocolo de evaluación vigente." — plan-observable.md:49.

§2 ("Definiciones") no define el término "unidad temporal" ni "día": enumera únicamente Motor, Productor, Plan observable, Proyección y Fidelidad — plan-observable.md:24-32. La única fuente de la definición de "unidad temporal" que cita el propio §4.2.1 es "el protocolo de evaluación vigente" — un documento externo no identificado por nombre en esta especificación.

La comparación no puede establecerse de forma completa a partir de la evidencia disponible, por lo siguiente:

- La instanciación observada del objeto bajo esta especificación (el artefacto de conformidad, punto 2 arriba) muestra `days` como array de 7 elementos nombrados Lunes..Domingo (2026-07-18-legacy-conformidad-v1.0.md:116-118), lo cual coincide en granularidad con la unidad de observación que practican los cinco instrumentos de §1 (el día, dentro de una semana ya muestreada).
- Pero el texto de §4.2.1 mismo no nombra "día" en ningún punto — remite la definición a un documento no presente en el material revisado. Afirmar que §4.2.1 "coincide" con la práctica de los instrumentos requeriría leer ese protocolo de evaluación vigente, que no ha sido citado ni localizado en esta revisión.

Se declara explícitamente: no hay evidencia disponible en este reconocimiento para determinar si "el protocolo de evaluación vigente" al que remite §4.2.1 es, o no, el mismo criterio que produce el día como unidad de observación en los instrumentos de `analysis/`. La coincidencia observada es entre la instanciación concreta del objeto y la práctica de los instrumentos, no entre el texto normativo de §4.2.1 y esa práctica.

**Cláusula de cierre:** este reconocimiento no propone definiciones para la segunda especificación (el "protocolo de evaluación vigente" al que remite §4.2.1). El punto 4 declara expresamente la insuficiencia de evidencia para una comparación textual completa, en lugar de completarla por inferencia.

---

## Nota final de estatus

Este artefacto sella, como evidencia versionada, dos reconocimientos de solo lectura ejecutados sobre HEAD `b5684be`. Es descriptivo: registra lo observado, no norma nada. Las decisiones tomadas a partir de él constan en D-054; la norma resultante es `docs/spec/protocolo-evaluacion.md` v1.0.
