# Verificación de conformidad — legacy vs. `plan-observable.md` v1.0

**HEAD verificado:** `0ffc686` (merge D-052, ratificación de `docs/spec/plan-observable.md` v1.0)
**Instrumento:** generación real de un plan por la ruta de producción + observación del objeto retornado (§0.4). Ninguna comparación entre motores; ningún juicio sobre engine2.
**Fecha:** 2026-07-18
**Especificación verificada:** `docs/spec/plan-observable.md`, versión 1.0 (D-052)
**Motor verificado:** legacy (`buildPlan.js`), único productor identificado por R-1 (`docs/evidence/R-1-productores-plan.md`)

> **Nota sobre la forma de este documento.** La estructura (encabezado HEAD/instrumento/fecha,
> secciones numeradas, tabla de veredictos) sigue la convención de facto establecida por
> `docs/evidence/R-1-productores-plan.md`. Esta forma es **convención heredada, no exigencia
> de `plan-observable.md` v1.0** — la spec no prescribe forma ni ubicación del artefacto de
> verificación (ver §2 de este documento).

---

## §1 — Generación del objeto (Fase 1)

- **Fixture:** `mantenimiento_equilibrado (base)`, declarada en `src/engine/tests/baselineFixtures.js` (sin perfil inventado).
- **userId:** `baseline-mantenimiento`
- **weekNumber:** `13`
- **Ruta de generación:** `buildPlan()` invocado vía `runBaseline(fixture)` (`src/engine/tests/baselineFixtures.js`), sin `opts.rng` — seed implícita `hash(userId + weekNumber)`.
- **Comando exacto:** `node docs/evidence/plan-observable/gen-legacy-2026-07-18.mjs` (script versionado en este mismo directorio).

### Hashes SHA-256

Se generó el objeto por triplicado (más dos corridas adicionales durante la construcción del
script) con el mismo fixture/userId/weekNumber, sin `opts.rng`, para verificar reproducibilidad.

**Objeto completo, tal como lo retorna el productor** — **no reproducible entre corridas**:

| Corrida | SHA-256 (objeto completo) |
|---|---|
| 1 | `2da9e1bba3ea67fbd56084a83db18d1b89373037bfcf9c1d6a50438c6d9ca18d` |
| 2 | `375b5607f655022e1298ed753e5d33e6f025881c3d7d0ece41d462514045278b` |
| 3 | `8722b37770d4e83257c649a9fe83602986a9223eee196c23a28275df64bc8eb3` |

Diff línea a línea entre corridas: la única diferencia observada, en las tres, está en un
único campo del objeto, repetido una vez por día (7 ocurrencias):

```
<       "id": "day-0-1784329070284",
---
>       "id": "day-0-1784329089224",
```

Todo el resto del objeto (`days[].meals`, `strategy`, `weekWarnings`, `weekProblems`,
`weekScore`) es byte-idéntico entre corridas. La causa del sufijo variable en `day.id` no se
explica en este artefacto — la evidencia es puramente observacional (§0.4): se documenta el
patrón (`day-N-<entero variable>`) y su alcance (7/7 días, ningún otro campo), no su origen.

**Proyección reproducible** — criterio `serialiseDays()` de `src/engine/tests/baselineFixtures.js`
(excluye `day.id` de cada elemento de `days`; el resto del objeto, sin tocar). Este es el ancla
que un tercero puede regenerar y cotejar ejecutando el mismo comando:

```
sha256(proyección sin day.id) = ac7df51bbb39756e154cc1334bba59b4f724a93ef5289e618421dc520edb7c98
```

Verificado reproducible en 3 corridas independientes (dos durante la construcción del script,
una final desde su ubicación versionada en este directorio).

---

## §2 — Hallazgo pre-§4 (Gate F-V1) — candidato §8.2

**§7.3** exige que la verificación quede "registrada como evidencia versionada" y "refiera la
versión de esta especificación contra la que se verificó (§8)", pero **no prescribe, por sí
misma, ubicación ni forma del artefacto**. La ruta `docs/evidence/` solo aparece, entre
paréntesis, en **§7.0** ("dicho estado es materia de evidencia versionada (`docs/evidence/`),
no de esta norma") — una cláusula distinta, sobre el **estado de conformidad de un motor**, no
sobre el artefacto de verificación individual que exige §7.3. La ubicación de este artefacto se
infiere por cercanía terminológica entre ambas cláusulas, no por prescripción literal de §7.3.

Ubicación (`docs/evidence/plan-observable/`) y forma (convención R-1) fueron ratificadas
directamente por Javi para este artefacto — no quedan pendientes de norma. Se deja constancia
del hallazgo como candidato a futuro ciclo §8.2: *"¿debe §7.3 prescribir explícitamente
ubicación y forma del artefacto de verificación, en vez de heredarlas por cercanía con §7.0?"*

---

## §3 — Cotejo cláusula a cláusula de §4

Recorrido en orden de cláusula. Única cita de código permitida: `buildPlan.js:2807-2815`
(productor, heredada de R-1). El resto de citas en esta sección son fragmentos del **objeto**
observado, no del motor.

### §4.0 — Regla de contención estructural

**Veredicto: no aplicable al objeto.**
§4.0 es una regla dirigida a las revisiones futuras de la propia norma ("toda revisión futura
de esta sección deberá satisfacer esta misma regla"), no una obligación sobre el plan
observable. Regula el proceso de redacción de la spec, no el objeto.

*Distinción de taxonomía:* "no verificable" queda reservado para defectos de observabilidad
(§0.4 — cláusulas cuya verificación exigiría leer el proceso de generación o el código del
motor, no el objeto terminado). §4.0 no es eso: es una condición normal de preámbulo, dirigida
al redactor de la norma, no al objeto — no hay ningún estado del objeto, observable o no, que
pudiera satisfacerla o violarla. "No aplicable" es la categoría correcta.

### §4.1 — Claves obligatorias

**Veredicto: conforme.**
El objeto generado expone exactamente las claves del contrato:

```
TOP KEYS: ["days", "strategy", "weekWarnings", "weekProblems", "weekScore"]
```

`decisionLog` está ausente — contractualmente opcional (`CLAUDE.md:17-28`, referido por §4.1),
no constituye no conformidad.

### §4.2.1 — `days` como colección enumerable en orden estable

**Veredicto: conforme.**
`days` es un array de 7 elementos. El orden observado en `days[].name` es:
`Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo` — orden estable, verificado
idéntico en las 5 corridas generadas (incluidas las 3 usadas para los hashes de §1).

### §4.2.2 — Posición corresponde establemente a una unidad temporal

**Veredicto: conforme.**
La posición (índice 0–6) corresponde uno a uno con `days[i].name`, y esa correspondencia es
idéntica en todas las corridas (`days[0].name === "Lunes"` … `days[6].name === "Domingo"` en las
5 corridas). Esta cláusula regula la **posición**, no un campo `id` — ver nota de alcance al
final de esta sección.

### §4.2.3 — Cada unidad temporal expone sus comidas como colección enumerable

**Veredicto: conforme.**
Cada elemento de `days` expone `meals` como array. Ejemplo, `days[0]`:

```
"meals": [ {time:"Desayuno",...}, {time:"Comida",...}, {time:"Cena",...} ]
```

### §4.2.4 — Cada comida identificable dentro de su unidad temporal de forma no ambigua

**Veredicto: conforme, sobre este objeto.**
En los 7 días del objeto generado, `meals[].time` no se repite dentro de un mismo día
(`["Desayuno","Comida","Cena"]` en los 7 días, sin duplicados). Esta fixture tiene
`mealsPerDay: 3`; no ejercita el caso de más de 3 comidas/día (p. ej. snacks AM/PM), por lo que
el veredicto se limita al objeto observado, sin generalizar a fixtures con más comidas por día.

### §4.2.5 — Identidad de platos/componentes establecible por observación

**Veredicto: conforme.**
El objeto generado contiene una recurrencia real de plato: `"Bol de yogur con granola y
fruta"` aparece en `days[2]` (Miércoles, Desayuno) y `days[6]` (Domingo, Desayuno). Comparación
por observación del objeto, sin ejecutar el motor:

```
JSON.stringify(mie) === JSON.stringify(dom)  →  true
```

Los dos objetos `meal` son byte-idénticos en todos sus campos (`title`, `p1`, `p2`, `shopping`,
`recipe`, `metadata`, `_spec`). La identidad entre las dos ocurrencias es establecible por
igualdad de contenido, sin mecanismo de id explícito a nivel de plato — conforme con la
formulación epistemológica, no tecnológica, de §4.2.5.

**Nota de alcance sobre `day.id` (relevante a §4.2 en conjunto).** El campo `day.id` (p. ej.
`"day-0-1784329070284"`) no es reproducible entre corridas (§1). Ninguna cláusula de §4.2 exige
estabilidad de un campo `id`: §4.2.2 exige estabilidad de la **posición**, no de un identificador
adjunto, y esa estabilidad de posición está verificada (arriba). §4 guarda silencio sobre la
estabilidad de identificadores del objeto (como `day.id`) que no son ni la posición ni el
contenido del plato. Se registra como candidato §8.2, no como no conformidad: *"¿debe §4.2
pronunciarse sobre la estabilidad de campos identificadores del objeto observable (p. ej.
`day.id`), más allá de la estabilidad de posición ya exigida?"*

### §4.3 — Estructura de `strategy`

**Veredicto: conforme.**
`strategy` está presente como valor de tipo string ligado directamente al objeto:

```
"strategy": "mantenimiento_equilibrado"
```

Recuperable por observación directa del objeto, sin pasos adicionales.

### §4.4.1 — `weekWarnings`/`weekProblems` como colecciones enumerables, vacía admitida

**Veredicto: conforme.**
`weekWarnings`: array, 15 elementos. `weekProblems`: array, 0 elementos — colección vacía,
admitida como valor conforme por la propia cláusula.

### §4.4.2 — Cada elemento autosuficiente

**Veredicto: conforme.**
Los 15 elementos de `weekWarnings` son strings con el diagnóstico completo en el propio texto
(p. ej. `"[AJUSTE] Lunes: día bajo en energía (~1050 kcal) — déficit excesivo"`), sin referencias
a variables, índices externos o estado no incluido en el objeto. `weekProblems` está vacío en
este objeto — no hay elemento que evaluar, y la colección vacía ya es conforme por §4.4.1.

### §4.5 — `weekScore`

**Veredicto: conforme.**
`weekScore` está presente: `"weekScore": 97` (número). Por prevalencia de `CLAUDE.md:17-28`
(§4.5, §3.2), no se exige más que su presencia como clave; su interpretación semántica queda
fuera de esta norma.

### §4.6 — `decisionLog`

**Veredicto: conforme (cláusula condicional no disparada).**
El objeto generado no expone `decisionLog`. §4.6 solo impone obligaciones "si el plan expone
`decisionLog`" — al no exponerlo, la condición no se activa y no hay obligación exigible. Esto
es coherente con el carácter opcional y "solo engine2" del campo (`CLAUDE.md:17-28`, ya
constatado por R-1 §4.1: legacy no lo emite en ningún camino localizado).

### §4.7 — Autosuficiencia del objeto

**Veredicto: conforme.**
El objeto generado no contiene `qaTrace` ni ningún otro campo instrumental o condicionado por
mecanismos de depuración — consistente con `QA_TRACE` inactivo en esta generación. Las claves
observadas (`days, strategy, weekWarnings, weekProblems, weekScore`) coinciden exactamente con
el contrato; no hay campos ajenos que evaluar bajo esta cláusula.

---

## §4 — Resumen de veredictos

| Cláusula | Veredicto |
|---|---|
| §4.0 | No aplicable al objeto |
| §4.1 | Conforme |
| §4.2.1 | Conforme |
| §4.2.2 | Conforme |
| §4.2.3 | Conforme |
| §4.2.4 | Conforme (sobre este objeto — fixture de 3 comidas/día) |
| §4.2.5 | Conforme |
| §4.3 | Conforme |
| §4.4.1 | Conforme |
| §4.4.2 | Conforme |
| §4.5 | Conforme |
| §4.6 | Conforme (cláusula condicional no disparada) |
| §4.7 | Conforme |

**Recuento:** 12 cláusulas conformes, 1 no aplicable al objeto (§4.0), 0 no conformes, 0
no verificables, 0 ambiguas — de 13 cláusulas recorridas.

**No conformidades (§7.4):** ninguna.

**Candidatas §8.2 (defecto de redacción o silencio de la norma):**
1. §7.3 no prescribe ubicación ni forma del artefacto de verificación por sí misma (§2 de este
   documento); la ubicación se infiere solo por cercanía con §7.0, cláusula de ámbito distinto.
2. §4.2 no se pronuncia sobre la estabilidad de campos identificadores del objeto (p. ej.
   `day.id`) más allá de la estabilidad de posición ya exigida por §4.2.2 (nota de alcance,
   sección §4.2.5 de este documento).

**Cláusulas no aplicables al objeto:**
1. §4.0 — regla dirigida a la propia norma, no al objeto (ver distinción de taxonomía en la
   sección §4.0 de este documento).

**Cláusulas no verificables sobre el objeto:** ninguna.

**Alcance del resultado 12/12.** `plan-observable.md` v1.0 se redactó observando el objeto que
legacy ya produce (D-048–D-051, herencia del contrato de shape verificado en R-1). Esta
conformidad 12/12 acredita que la norma **describe bien lo existente** en legacy, no que sea una
norma exigente frente a un productor no visto durante su redacción. La primera prueba real de la
norma — con un productor de origen independiente — será engine2, sujeta a la posición vinculante
de §7.5 (ningún plan entra en evaluación comparativa sin verificación de conformidad registrada).

---

## Reproducibilidad

Un tercero puede regenerar el ancla reproducible ejecutando, desde la raíz del repositorio:

```
node docs/evidence/plan-observable/gen-legacy-2026-07-18.mjs
```

y comparando `sha256_projected` contra `ac7df51bbb39756e154cc1334bba59b4f724a93ef5289e618421dc520edb7c98`.
El `sha256_full` impreso por el script **no** será reproducible, por la causa documentada en §1.
