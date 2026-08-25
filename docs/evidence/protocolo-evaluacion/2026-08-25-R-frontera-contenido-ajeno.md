# R-0 — Aplicación de la frontera contenido/ajeno (C-α, D-083) a los rasgos de las emisiones observadas en Acto A

Género: reconocimiento (R-0). Demuestra; no decide. Sin asiento en `DECISIONS.md`. La disposición ya fue tomada (D-083); este R deriva su aplicación evidencial sobre un perímetro concreto.

Sin instrumento: derivación textual, no ejecución. No hay script ni volcados crudos propios; las fuentes se citan por etiqueta de cláusula, exhibidas `[V]` en terminal en el ancla de corpus.

Estado: BORRADOR para revisión. `<<PENDIENTE SELLO: commit de incorporación a docs/evidence/protocolo-evaluacion/>>`.

---

## 0. Cláusula de seguridad metodológica

Este R aplica el criterio C-α dispuesto en D-083 (1.a–1.d). D-083 punto 2 (Completitud) afirma que el criterio es intensional y determinante sobre todo rasgo observable conforme a §4, sin remanente de interpretación en aplicación posterior. En consecuencia este acto es **R pura**: no dispone ninguna clasificación nueva ni resuelve residual dispositivo alguno.

Si un rasgo de este perímetro resultara **no derivable** bajo C-α, eso constituiría un **hallazgo sobre la completitud práctica de D-083** —a devolver como resultado—, no una autorización para disponer una clasificación nueva. Es cláusula de seguridad, no puerta de salida. El resultado de este R sobre ese punto se registra en §5.

---

## 1. Anclas y corpus `[V]`

- **Ancla de corpus:** `324bc87` (HEAD -> main; `git log -1` en terminal fresca).
- **§4** — Contrato normativo del objeto de plan observable: `plan-observable.md:42-68` `[V, terminal, 324bc87]`, §4.0–§4.7 completos (§4.7 incluido en el rango).
- **Criterio C-α:** `DECISIONS.md:3553` (D-083), cuerpo 1.a–1.d + puntos 2–4 `[V, terminal, 324bc87]`.
- **Cláusula de no-inferencia:** `protocolo-evaluacion.md:53` (§6 ítem 1), exhibida verbatim en el R-0 de Acto A `[V]`.
- **Inventario de rasgos:** derivado de las once divergencias (§8) y del `day.id` (§7, §10) registrados como datos en el R-0 de Acto A (`docs/evidence/protocolo-evaluacion/2026-08-23-R-emision-efectiva-productores.md`) `[V]`.

---

## 2. Objeto y hard stop

**Unidad de análisis:** el rasgo observable.

Este R **NO** clasifica: valores concretos (`97`, `null`, `"Lunes"`, cadenas de warnings, …), resultados de ejecución, ni diferencias entre productores como tales.

**Criterio:** exclusivamente D-083 (1.a–1.d), con **1.c operativo en toda la clasificación** — la pertenencia de un rasgo a contenido evaluado o a información ajena se determina por su relación con la normación positiva de §4, **con anterioridad e independencia** de si el rasgo permite o no inferir el productor.

**Hard stop:** este R no deriva nada sobre cegado, suficiencia, ii-med ni conformidad con §4. Clasifica presencia/estructura de cada rasgo. No juzga si un mecanismo clasificado ajeno satisface, además, una propiedad normada por §4 (eso es conformidad, acto separado).

**Perímetro congelado:**

| Elemento | Estado |
|---|---|
| Rasgos surgidos de divergencias 1–11 | Dentro |
| `day.id` | Dentro |
| Divergencia 11 (`undefined` en `decisionLog[18]`) | Fuera |
| Valores concretos | Fuera |
| Aplicación al cegado / suficiencia | Fuera |

Rasgos observables **no surgidos como divergencia** (p. ej. campos de día `mood`, `special`, `effectiveMood`, `shakeEnabled` de `buildPlan`; claves internas del objeto `dish` de `materializePlan` distintas de `dish.id`) quedan **fuera del perímetro declarado** de este R. No se clasifican aquí; su terminológica cercanía no expande el perímetro.

---

## 3. Clasificación de rasgos

| Id | Rasgo | Fuente §4 | C-α | Resultado |
|---|---|---|---|---|
| R1 | Presencia de `days` | §4.1, §4.2 | 1.a | **contenido evaluado** |
| R2 | Presencia de `strategy` | §4.1, §4.3 | 1.a | **contenido evaluado** |
| R3 | Presencia de `weekWarnings` | §4.1, §4.4 | 1.a | **contenido evaluado** |
| R4 | Presencia de `weekProblems` | §4.1, §4.4 | 1.a | **contenido evaluado** |
| R5 | Presencia de `weekScore` | §4.1, §4.5 | 1.a + 1.d | **contenido evaluado** (presencia/estructura; semántica remitida no incorporada) |
| R6 | Presencia de `decisionLog` | §4.1, §4.6 | 1.a | **contenido evaluado** |
| R7 | Identidad posicional de la unidad temporal (día) | §4.2.1, §4.2.2 | 1.a | **contenido evaluado** |
| R8 | Campo `id` del objeto-día (`day.id`, `buildPlan`) | §4.2.2 norma la posición, no un campo `id` | 1.b.i | **información ajena** |
| R9 | Campo `day` del objeto-día (`materializePlan`): mecanismo de identificación de la unidad temporal adicional al posicional | §4.2.2 norma la posición, no un campo `day` portador de identificador | 1.b.i | **información ajena** |
| R10 | Grafía de los nombres de día (con tildes / sin tildes) | §4 no norma grafía ni convención de nombrado | 1.b.iii | **información ajena** |
| R11 | Existencia de colección enumerable de comidas por día | §4.2.3 | 1.a | **contenido evaluado** |
| R12 | Identificabilidad no ambigua de la comida dentro del día | §4.2.4 | 1.a | **contenido evaluado** |
| R13 | Campo/mecanismo del identificador de comida (`time`/`momento`) y su grafía (mayúsc./minúsc.) | §4.2.4 norma la propiedad, no el mecanismo | 1.b.i / 1.b.iii | **información ajena** |
| R14 | Conjunto de claves del objeto-comida (no comparte ninguna entre productores) | §4 no norma key-set de comida; §4.0 | 1.b.i | **información ajena** |
| R15 | Propiedad de identidad del plato exigida por §4.2.5 | §4.2.5 | 1.a | **contenido evaluado** |
| R16 | Formato de `dish.id` (slug simple / array serializado) | §4.2.5 no impone mecanismo de representación de identidad | 1.b.iii | **información ajena** |
| R17 | Conjunto de claves de las entradas de `decisionLog` (en/es; conjuntos distintos) | §4.6 norma colección/entrada, no el key-set de entrada | 1.b.i | **información ajena** |

### Notas de derivación (solo rasgos que la requieren)

- **R5 (1.d).** §4.5 norma la presencia de `weekScore` como clave obligatoria y remite su semántica (`CLAUDE.md:17-28`). Por 1.d, la presencia/estructura es contenido evaluado; la semántica remitida fuera de §4 **no** queda incorporada por esta disposición. El valor (`97` / `null`) no se clasifica.
- **R6.** §4.1 enumera `decisionLog` como clave (opcional) del contrato; §4.6 norma su estructura si está presente. Presencia normada (aun opcional) + estructura normada → contenido, **por 1.a y con independencia de la variación entre productores** (uno la omite, otro la expone). Ver §6.
- **R8 / R9.** El único mecanismo de identidad de la unidad temporal que §4 norma es el **posicional** (§4.2.2). §4 no norma ningún campo `id` (R8, `buildPlan`) ni ningún campo `day` portador de identificador (R9, `materializePlan`): son **dos mecanismos distintos**, cada uno derivado de su rasgo exacto observado, con el mismo resultado. Ninguna de las dos clasificaciones se apoya en §5.5 (D-083 punto 4: §5.5 es precedente contextual, no norma del cegado).
- **R13 / R14.** §4.2.4 norma la *propiedad* de identificabilidad; §4.0 impide imponer organización interna no establecida. El nombre de campo, su grafía y el key-set concreto del objeto-comida realizan esa propiedad pero no están normados como estructura → ajenos. Las propiedades normadas quedan en R12 y R15.
- **R16.** Cláusula bisagra: §4.2.5 declara expresamente que la obligación de identidad **«no impone ningún mecanismo concreto de representación de identidad»**. El formato de `dish.id` es mecanismo/serialización → no normado como estructura → 1.b.iii. Que ese formato satisfaga **además** la propiedad de identidad exigida por §4.2.5 (R15) es **conformidad** — acto separado, fuera del hard stop.

---

## 4. Rasgos observados que permanecen fuera de clasificación (valores, no rasgos estructurales)

- **Cardinalidad observada de `meals`** (3 en `buildPlan`, 2 en `materializePlan`). §4.2.3 norma la *existencia* de colección enumerable (clasificado en R11, contenido), **no** su cardinalidad. El número concreto es valor de instancia; permanece fuera, igual que `weekScore = 97` o los 15 warnings. *(Precisión ratificada: separar el rasgo estructural —R11— del valor observado —aquí—.)*
- **Valores de todo rasgo contenido:** `weekScore` (`97`/`null`), `weekWarnings` (15 cadenas / `[]`), `weekProblems` (`[]`/`[]`), nombres concretos, etc. Fuera por objeto: no se clasifican valores.
- **Estabilidad entre corridas** (divergencia 10): es comportamiento, no rasgo normado por §4; §5 (medición) no rige este R (A no está sujeto a §5). El campo que la divergencia concierne, `day.id`, se clasifica en R8.

---

## 5. Resultado sobre este perímetro

Ningún rasgo del perímetro resultó no derivable bajo C-α. La cláusula de seguridad (§0) **no se activó**. Esto constituye **únicamente el resultado de esta aplicación concreta** y **no una verificación general de la completitud de D-083**. Que no haya aparecido un contraejemplo dentro de este perímetro no demuestra la completitud general del criterio; simplemente no la pone en cuestión aquí.

---

## 6. Observación acotada (no derivación) — 1.c en acto

Se registra que un rasgo clasificado contenido evaluado puede coincidir con capacidad de inferencia del productor. Caso observado: la **presencia de `decisionLog`** (R6, contenido) difiere entre productores — `buildPlan` no la expone, `materializePlan` sí—.

Por **1.c**, esta coincidencia no altera su clasificación: sigue siendo contenido evaluado. Las consecuencias de esta clasificación quedan fuera del objeto de este R.

---

## 7. Anexo descriptivo — correspondencia con las divergencias observadas (1–11)

Puramente descriptivo. La R clasifica rasgos (§3); este anexo mapea de vuelta a las divergencias de A. No es unidad primaria de clasificación.

| Div. (R-0 de A, §8) | Rasgo(s) | Estado |
|---|---|---|
| 1 — `decisionLog` presente/ausente | R6 | contenido |
| 2 — `weekScore` número / `null` | R5 (presencia) | contenido; valor fuera |
| 3 — `weekWarnings` 15 / `[]` | R3 (presencia) | contenido; valores fuera; F-A1(b) (entradas nativas distintas) |
| 4 — cardinalidad `meals` 3 / 2 | R11 (existencia) | contenido; cardinalidad fuera (valor) |
| 5 — identificador comida `time` / `momento` (+ grafía) | R12 (propiedad) + R13 (mecanismo/grafía) | contenido + ajeno |
| 6 — grafía nombres de día | R10 | ajeno |
| 7 — objeto-comida no comparte claves | R14 (key-set); propiedades en R12/R15 | ajeno |
| 8 — `dish.id` alterna formato | R16 (formato); propiedad en R15 | ajeno |
| 9 — `decisionLog` key-sets en/es | R17 | ajeno |
| 10 — estabilidad entre corridas | no rasgo §4 (§5, fuera); campo en R8 | fuera |
| 11 — `undefined` en `decisionLog[18]` | fuera del perímetro | fuera (doble motivo) |

**R9 no corresponde a una divergencia numerada:** es la contraparte de identificación de día del lado `materializePlan` (el campo `day`), surgida en la descripción estructural de A (§6.2) e incluida junto a `day.id` dentro del objeto de perímetro. Se clasifica por su rasgo exacto, no por analogía con `day.id`.

**Divergencia 11 — doble motivo de exclusión:** (i) es integridad de serialización de un *valor*, no un rasgo estructural; (ii) las claves que lo portan (`momento`, `plato` de la entrada de `decisionLog`) no están normadas por §4.6 (el key-set de entrada no está normado) → serían ajenas de todos modos. Fuera por ambas vías.

---

## 8. Hard stop

A termina aquí. No se deriva procedimiento de cegado, ni suficiencia, ni conformidad §4, ni resolución de la dependencia (c) de D-058. La disposición fue D-083; esto fue su aplicación evidencial sobre el perímetro declarado.
