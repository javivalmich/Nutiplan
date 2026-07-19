# Verificación de conformidad — engine2 vs. `plan-observable.md` v1.0

**HEAD verificado:** `569fc1c` (merge D-056, orquestador `materializePlan` — Frente A/Fase 7)
**Instrumento:** generación real de un plan por la ruta de producción de engine2 + observación del objeto retornado (§0.4). Ninguna comparación entre motores; ningún juicio sobre legacy. Simétrico al instrumento usado en `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md`.
**Fecha:** 2026-07-18
**Especificación verificada:** `docs/spec/plan-observable.md`, versión 1.0 (D-052)
**Motor verificado:** engine2 (`src/engine2/materializePlan.js`), único productor de objeto de plan observable identificado en `src/engine2/` (Gate 2.5, verificación de existencia previa a esta R)

> **Nota sobre la forma de este documento.** Replica la estructura y el método del artefacto
> gemelo de legacy (`2026-07-18-legacy-conformidad-v1.0.md`), ya ratificados por Javi para este
> directorio (ver §2 de aquel documento). No se repite aquí la discusión de ubicación/forma del
> artefacto — no aporta nada nuevo para engine2. La numeración de secciones de este documento
> por tanto omite el equivalente al §2 del gemelo (que trataba esa discusión) y salta de §1
> (Generación) a §2 (Cotejo cláusula a cláusula), para no fabricar una sección sin contenido.

---

## §1 — Generación del objeto

- **Fixture:** `FIXTURE_INPUT`, la entrada ya versionada en `materializePlan.test.js` — no se
  inventa perfil nuevo. `profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] }`,
  `strategy: 'mantenimiento_equilibrado'`.
- **Catálogo:** `loadCatalog()` (`src/engine2/dishes/loadCatalog.js`), ruta de producción, sin
  fixture de catálogo alternativo.
- **Seeds usadas — dos generaciones, con causa distinta cada una:**
  - **seed=0** (la seed literal de `FIXTURE_INPUT`): generación primaria, usada para §4.1,
    §4.2.1-4, §4.3, §4.4, §4.5, §4.6, §4.7.
  - **seed=1** (mismo profile/strategy, seed alternativa): generación adicional, usada
    específicamente para §4.2.5. Causa: con seed=0, `buildWeekArc` no produce `leftoverDays`
    para este profile/catálogo, y sin sobra no hay repetición real de plato que observar —
    seed=0 generó 0 ocurrencias de `dish.id` repetido en las 14 posiciones. seed=1, con el
    mismo profile/strategy, sí produce una repetición real (ver §2, cláusula §4.2.5). Se cita
    ambas generaciones explícitamente para que el veredicto de cada cláusula quede trazado a la
    seed que lo sostiene.
- **Invocación exacta (reproducible por un tercero):**

```js
import { materializePlan } from './src/engine2/materializePlan.js';
import { loadCatalog } from './src/engine2/dishes/loadCatalog.js';

const FIXTURE_INPUT = {
  profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] },
  seed: 0, // o 1, ver arriba
  strategy: 'mantenimiento_equilibrado',
};

const catalog = loadCatalog();
const plan = materializePlan({ ...FIXTURE_INPUT, catalog });
```

### Hashes SHA-256 (objeto completo, `JSON.stringify(plan)`)

Generado en 3 corridas independientes (procesos `node` separados), sin proyección ni exclusión
de ningún campo — a diferencia del artefacto de legacy, el objeto de engine2 no contiene ningún
campo con sufijo variable entre corridas (no existe un `day.id` timestamped; `days[].day` es el
nombre del día, valor fijo de `DAYS_ORDER`).

| Corrida | seed=0 | seed=1 |
|---|---|---|
| 1 | `549b67f1af233b9a5e12401388091b474da8aa9d60f7457aa91635ccf225d1c0` | `bf1aa25d561019ec83c44677f698868d129ff0e83e43958f75108721056a11c2` |
| 2 | `549b67f1af233b9a5e12401388091b474da8aa9d60f7457aa91635ccf225d1c0` | `bf1aa25d561019ec83c44677f698868d129ff0e83e43958f75108721056a11c2` |
| 3 | `549b67f1af233b9a5e12401388091b474da8aa9d60f7457aa91635ccf225d1c0` | `bf1aa25d561019ec83c44677f698868d129ff0e83e43958f75108721056a11c2` |

Byte-idéntico en las 3 corridas, para ambas seeds, sobre el **objeto completo sin proyección**.
Esto excede la reproducibilidad observada en legacy (que solo alcanzó byte-igualdad tras excluir
`day.id`); no se interpreta como propiedad general de engine2 frente a legacy — es simplemente lo
que este objeto, con esta entrada, exhibe.

---

## §2 — Cotejo cláusula a cláusula de §4

Recorrido en orden de cláusula. Única cita de código de productor permitida:
`materializePlan.js:33` (firma) y `materializePlan.js:55-62` (return). El resto de citas en esta
sección son fragmentos del **objeto observado** (generado en §1), no del motor.

### §4.0 — Regla de contención estructural

**Veredicto: no aplicable al objeto.**
Misma razón que en el gemelo de legacy: §4.0 regula el proceso de redacción de revisiones
futuras de la propia norma, no una obligación sobre el objeto de plan. No hay estado del objeto
que pudiera satisfacerla o violarla.

### §4.1 — Claves obligatorias

**Veredicto: conforme.**
El objeto generado (seed=0) expone exactamente las claves del contrato, más `decisionLog`:

```
TOP KEYS: ["days","decisionLog","strategy","weekProblems","weekScore","weekWarnings"]
```

`decisionLog` presente — contractualmente opcional y "solo engine2" (`CLAUDE.md:17-28`); su
presencia no es no conformidad, es el caso previsto por la propia norma para este motor.

### §4.2.1 — `days` como colección enumerable en orden estable

**Veredicto: conforme.**
`days` es un array de 7 elementos. Orden observado en `days[].day`:
`Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo` — idéntico en las 6 corridas de §1
(3 por seed, 2 seeds).

### §4.2.2 — Posición corresponde establemente a una unidad temporal

**Veredicto: conforme.**
La posición (índice 0–6) corresponde uno a uno con `days[i].day`, idéntica en todas las
corridas de ambas seeds. A diferencia de legacy, el objeto de engine2 no tiene un campo `id`
adjunto al día — la unidad temporal se identifica directamente por `day` (nombre), que es a la
vez el valor y el criterio de estabilidad de posición. No hay campo separado cuya estabilidad
quede en duda (la nota de alcance sobre `day.id` del gemelo de legacy no tiene equivalente aquí).

### §4.2.3 — Cada unidad temporal expone sus comidas como colección enumerable

**Veredicto: conforme.**
Cada elemento de `days` expone `meals` como array de 2 elementos (`comida`, `cena`) — modelo de
14 posiciones semanales, la "unidad base" ya congelada como hecho compartido con legacy en C v1
(D-047). Ejemplo, `days[0]` (seed=0):

```
"meals": [ { "momento": "comida", "dish": {...} }, { "momento": "cena", "dish": {...} } ]
```

### §4.2.4 — Cada comida identificable dentro de su unidad temporal de forma no ambigua

**Veredicto: conforme, sobre este objeto.**
En los 7 días de ambas generaciones, `meals[].momento` no se repite dentro de un mismo día
(siempre `["comida","cena"]`, sin duplicados). A diferencia de la fixture de legacy (3
comidas/día, incluye Desayuno), el modelo de engine2 es fijo en 2 comidas/día
(`MOMENTOS = ['comida','cena']`, `schema.js:19`) — no hay variabilidad de `mealsPerDay` que
ejercitar; el veredicto cubre la totalidad del espacio de valores de `momento` que engine2 puede
producir hoy, no solo esta fixture.

### §4.2.5 — Identidad de platos/componentes establecible por observación

**Veredicto: conforme, verificado con seed=1 (ver §1 para la causa de la elección de seed).**

Con seed=0, el objeto generado no contiene ninguna repetición de `dish.id` entre las 14
posiciones (0 ocurrencias repetidas) — esta entrada no ejercita la cláusula sustantivamente, se
declara honestamente en vez de forzar un veredicto vacío como si fuera prueba positiva.

Con seed=1 (mismo profile/strategy), el objeto generado sí contiene una recurrencia real:
el plato de id `["legumbre","garbanzos",null,"pimientos",null,"pimenton_ajo","guisado"]`
("Garbanzos con pimientos guisado") aparece en `Martes/comida` y `Jueves/comida`. Comparación
por observación del objeto, sin ejecutar el motor de nuevo (las dos ocurrencias ya están en el
mismo objeto generado una vez):

```
JSON.stringify(ocurrenciaMartes) === JSON.stringify(ocurrenciaJueves)  →  true
```

Los dos objetos `dish` son byte-idénticos en todos los campos observados
(`id, nombre, rol, batchable, leftoverQuality, shelfLifeDays, energiaCocina, momento, tempFeel,
plateType`). Estos son exactamente los `REQUIRED_FIELDS` de `schema.js:33-44` — el hallazgo
metodológico registrado en D-056 (los campos crudos de combo no sobreviven a `loadCatalog()`)
se reafirma aquí: la identidad se verifica sobre el conjunto de campos que el catálogo
materializado garantiza, el mismo instrumento con que se verificó legacy en su artefacto
gemelo, no por recomputación ni por mecanismo de id adicional.

### §4.3 — Estructura de `strategy`

**Veredicto: conforme.**
`strategy` está presente como valor de tipo string ligado directamente al objeto:

```
"strategy": "mantenimiento_equilibrado"
```

Coincide con `FIXTURE_INPUT.strategy` y con `weekArc.strategy` (el valor que `buildWeekArc`
calcula internamente) — recuperable por observación directa del objeto, sin pasos adicionales,
sin ser recalculado por el orquestador.

### §4.4.1 — `weekWarnings`/`weekProblems` como colecciones enumerables, vacía admitida

**Veredicto: conforme.**
`weekWarnings`: array, 0 elementos. `weekProblems`: array, 0 elementos. Ambas colecciones
vacías, admitidas como valor conforme por la propia cláusula.

### §4.4.2 — Cada elemento autosuficiente

**Veredicto: conforme, vacuamente — limitación estructural, no de esta entrada.**
A diferencia del gemelo de legacy (donde `weekWarnings` tenía 15 elementos reales que permitían
verificar autosuficiencia por contenido), `materializePlan` retorna `weekWarnings: []` y
`weekProblems: []` **siempre**, por diseño (F-A4/F-A5a de D-056: un validador de engine2 que
compute advertencias reales es responsabilidad de otro componente, fuera de este frente). No hay
ningún elemento que evaluar bajo esta cláusula, con ninguna entrada — no es una carencia de esta
generación en particular, es una propiedad del productor tal como está hoy. Se deja constancia
explícita: esta cláusula no ha sido probada sustantivamente para engine2, a diferencia de §4.6.

### §4.5 — `weekScore`

**Veredicto: conforme.**
`weekScore` está presente: `"weekScore": null`. Por prevalencia de `CLAUDE.md:17-28` (§4.5,
§3.2), la norma no exige más que la presencia de la clave. El valor `null` es, per D-056
(F-A3a), la ejecución explícita de la reserva semántica que `CLAUDE.md:17-28` dejó abierta para
Fase 7 ("placeholder o derivado del contrato de reconcile") — no es una omisión ni una deuda
pendiente, es la decisión ya tomada y ratificada en ese asiento.

### §4.6 — `decisionLog`

**Veredicto: conforme — verificación sustantiva.**
`decisionLog` está presente (a diferencia de legacy, donde la cláusula era condicional no
disparada). Verificación sobre el objeto de seed=0:

- **Colección única ligada al objeto:** `Array.isArray(plan.decisionLog) === true`, un solo
  array, no dos colecciones paralelas.
- **Cardinalidad:** `decisionLog.length === 32`, igual a la suma de las dos fuentes observadas
  por separado (`arcLog.length === 17` + `walkLog.length === 15`).
- **Cada entrada autosuficiente, pese a heterogeneidad de shape (F-A4b, D-056) — sin
  normalización:**

```
SAMPLE arcLog[0]:
{
  "decisionId": "cp3a-0",
  "cause": "eleccion_esqueleto_por_seed",
  "evidence": "seed=0 -> indice 2 de 3 plantillas (A/B/C, sin filtros)",
  "consequence": "esqueleto elegido: C"
}

SAMPLE walkLog[0]:
{
  "decisionId": "walk-0",
  "day": "Martes",
  "momento": "cena",
  "plato": "[\"sopa_crema\",\"atun\",null,\"tomate\",\"pimientos\",null,\"crudo\"]",
  "causa": "ancla_momento_unico",
  "evidencia": "plato \"[...]\" solo admite momento=[cena]",
  "alternativasDescartadas": []
}
```

Las dos procedencias usan claves distintas (`cause`/`evidence`/`consequence` vs.
`causa`/`evidencia`/`alternativasDescartadas`) — la heterogeneidad de shape que F-A4b ratificó
explícitamente no normalizar. Ambas entradas, sin embargo, son autosuficientes por sí mismas: el
significado de cada una es recuperable de su propio texto, sin estado externo al objeto — que es
lo que §4.6.2 exige, no homogeneidad estructural entre procedencias.

### §4.7 — Autosuficiencia del objeto

**Veredicto: conforme.**
Verificado sobre el objeto generado (seed=0), sin `QA_TRACE` activo en esta generación:

```
has qaTrace on top level: false
has qaTrace on days[0]: false
has qaTrace on days[0].meals[0]: false
```

Ningún campo instrumental o condicionado por mecanismos de depuración presente. Las claves de
nivel superior observadas coinciden exactamente con el contrato (`§4.1`); no hay campos ajenos
que evaluar bajo esta cláusula.

---

## §3 — Resumen de veredictos

| Cláusula | Veredicto |
|---|---|
| §4.0 | No aplicable al objeto |
| §4.1 | Conforme |
| §4.2.1 | Conforme |
| §4.2.2 | Conforme |
| §4.2.3 | Conforme |
| §4.2.4 | Conforme (modelo fijo de 2 comidas/día, sin variabilidad que ejercitar) |
| §4.2.5 | Conforme (requirió seed=1; seed=0 no exhibe repetición) |
| §4.3 | Conforme |
| §4.4.1 | Conforme |
| §4.4.2 | Conforme vacuamente — limitación estructural del productor, no de esta entrada |
| §4.5 | Conforme |
| §4.6 | Conforme — verificación sustantiva (a diferencia de legacy, cláusula disparada) |
| §4.7 | Conforme |

**Recuento:** 12 cláusulas conformes, 1 no aplicable al objeto (§4.0), 0 no conformes, 0 no
verificables, 0 ambiguas — de 13 cláusulas recorridas. Igual recuento numérico que el gemelo de
legacy, con una distinción cualitativa marcada explícitamente en §4.4.2 (conformidad vacía, no
plena) y en §4.6 (conformidad sustantiva, más exigente que la de legacy por ser cláusula
disparada).

**No conformidades (§7.4):** ninguna.

**Limitaciones marcadas explícitamente (no maquilladas como conformidad plena):**
1. §4.2.5 no queda verificada por la entrada primaria (seed=0); requirió una segunda generación
   (seed=1) para exhibir el fenómeno que la cláusula exige poder observar.
2. §4.4.2 es conforme solo de forma vacía: `materializePlan` no produce, hoy, ningún elemento en
   `weekWarnings`/`weekProblems` bajo ninguna entrada — la autosuficiencia de "cada elemento" no
   ha sido puesta a prueba con contenido real, a diferencia de legacy.

**Cláusulas no aplicables al objeto:**
1. §4.0 — regla dirigida a la propia norma, no al objeto (misma razón que en el gemelo de
   legacy).

**Cláusulas no verificables sobre el objeto:** ninguna.

### Veredicto global — posición §7.2/§7.5

Con 12/13 cláusulas aplicables conformes (las 2 limitaciones marcadas arriba no son no
conformidades: §4.2.5 se satisface con la generación complementaria citada, §4.4.2 se satisface
vacuamente por la propia cláusula, que admite colección vacía), **engine2 queda en posición
"Verificable con verificación de conformidad registrada" per §7.2**, con este artefacto como la
evidencia versionada que **§7.5** exige como precondición vinculante para entrar en evaluación
comparativa. Esta R no evalúa ni compara motores — solo certifica la posición de conformidad de
engine2 frente a `plan-observable.md` v1.0, en los mismos términos en que ya se certificó
legacy.

---

## Reproducibilidad

Un tercero puede regenerar ambos objetos ejecutando el fragmento de invocación de §1 desde la
raíz del repositorio (HEAD `569fc1c`), con `seed: 0` y `seed: 1` respectivamente, y comparando
`sha256(JSON.stringify(plan))` contra:

- seed=0: `549b67f1af233b9a5e12401388091b474da8aa9d60f7457aa91635ccf225d1c0`
- seed=1: `bf1aa25d561019ec83c44677f698868d129ff0e83e43958f75108721056a11c2`

Sin proyección ni exclusión de campos — ambos hashes son sobre el objeto completo tal como lo
retorna `materializePlan`.

**Apartado autosuficiente (sin necesidad de navegar a §1):**

- **Fixture:** `FIXTURE_INPUT`, la entrada ya versionada en `materializePlan.test.js` — no se
  inventa perfil nuevo. `profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] }`,
  `strategy: 'mantenimiento_equilibrado'`.
- **Seeds:**
  - **seed=0** (la seed literal de `FIXTURE_INPUT`): generación primaria, usada para §4.1,
    §4.2.1-4, §4.3, §4.4, §4.5, §4.6, §4.7.
  - **seed=1** (mismo profile/strategy, seed alternativa): generación adicional, usada
    específicamente para §4.2.5, porque seed=0 no produce repetición de plato observable.
- **Invocación exacta (idéntica a la de §1):**

```js
import { materializePlan } from './src/engine2/materializePlan.js';
import { loadCatalog } from './src/engine2/dishes/loadCatalog.js';

const FIXTURE_INPUT = {
  profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] },
  seed: 0, // o 1, ver arriba
  strategy: 'mantenimiento_equilibrado',
};

const catalog = loadCatalog();
const plan = materializePlan({ ...FIXTURE_INPUT, catalog });
```

- **Commit:** `569fc1c` (HEAD verificado, ver cabecera de este documento).
