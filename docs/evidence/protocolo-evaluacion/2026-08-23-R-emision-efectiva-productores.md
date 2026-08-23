# R-0 - Reconocimiento tecnico de emision efectiva de productores (Acto A)

Genero: reconocimiento (R-0). Demuestra; no decide. Sin asiento en DECISIONS.md.

Estado: BORRADOR para revision. Los campos marcados `<<PENDIENTE SELLO>>` se rellenan
al versionar los artefactos (hashes) y al incorporar el instrumento (commit propio).

---

## 1. Anclas (dos, distintos)

- **Codigo observado**: `46cea91b00d2be0720f2dcb6aa41e2b82cab7511` [V, `git log -1` en terminal
  fresca al inicio de la sesion]. Este ancla fija el estado de los dos productores en el
  momento de la observacion.
- **Instrumento de observacion**: `<<PENDIENTE SELLO: commit de incorporacion del instrumento
  a docs/evidence/protocolo-evaluacion/>>`. El instrumento NO existia en `46cea91`; se incorpora
  despues como artefacto de evidencia y se ancla a su propio commit.

Cadena de trazabilidad, con eslabones distinguibles temporal y causalmente:

    46cea91 (codigo observado) -> instrumento versionado (commit posterior)
    -> ejecuciones -> JSON crudos (run1, run2, materializePlan) -> este R-0

El R-0 no afirma que el instrumento fuera reproducible en `46cea91`: el instrumento se anade
despues. La reproducibilidad se enuncia como: ejecutar el instrumento versionado contra el
estado de codigo de `46cea91`.

---

## 2. Objeto de A (lo que este reconocimiento observa)

Emision efectiva de ambos productores bajo ejecucion, cada uno con entrada nativa a su propia
firma. El objeto es el objeto realmente retornado por cada productor.

Este reconocimiento NO:
- aplica la frontera contenido/ajeno a ningun campo;
- aplica D-083 a ningun campo (D-083 queda disponible como referencia, no aplicado);
- concluye conformidad con `docs/spec/plan-observable.md` §4;
- evalua §6.1-§6.3 ni suficiencia;
- propone arquitectura de cegado;
- convierte ninguna divergencia en defecto normativo.

### 2.1 Que NO es objeto de A (encuadre)

El instrumento de observacion (script de ejecucion y diff) es soporte de ejecucion y
trazabilidad, no objeto del reconocimiento. A es exclusivamente la observacion de las
emisiones. El instrumento responde a "como se produjo y contrasto la observacion"; el R-0
responde a "que se observo"; los JSON crudos son "los objetos efectivamente emitidos".

---

## 3. Entradas nativas por productor (F-A1(b))

Cada productor se ejecuta con una entrada valida para su propia firma, tomada verbatim de su
propio corpus de tests. No se fabrica correspondencia semantica entre las firmas. La
comparabilidad de A es comparabilidad de observacion, no de entrada; no se afirma que las dos
emisiones sean equivalentes por haber sido alimentadas con "la misma" entrada.

- **Productor 1** - `src/engine/buildPlan.js`, firma `buildPlan(profile, targetKcal, opts = {})`
  (`src/engine/buildPlan.js:33` [V]). Entrada verbatim de
  `src/engine/tests/buildPlan.snapshot.test.js:16-55` [V]: `SEED = 123456` (:16),
  `PROFILE` (:18-32), `TARGET_KCAL = 2000` (:34), `BASE_OPTS` con `freeFormPool: []` y
  `saveMealMemory: vi.fn()` (:36-42), invocacion `run(seed)` (:49-55) que pasa
  `{ ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed) }`. El `rng: mulberry32(seed)`
  en `opts` es la forma nativa del test, no una decision de este acto sobre donde entra la semilla.

- **Productor 2** - `src/engine2/materializePlan.js`, firma
  `materializePlan({ profile, seed, strategy, catalog })`. Entrada verbatim de
  `src/engine2/tests/materializePlan.test.js:15-19` [V]: `FIXTURE_INPUT` con
  `profile.trainingDays = ['Lunes','Miercoles','Viernes']`, `seed: 0`,
  `strategy: 'mantenimiento_equilibrado'`, mas `catalog = loadCatalog()` (:23-24).

Las entradas de ambos productores son distintas entre si; esta diferencia esta declarada y es
condicion de F-A1(b).

---

## 4. Corpus normativo exhibido verbatim [V, terminal]

Corpus disponible como referencia. Su exhibicion aqui no constituye evaluacion de las emisiones
contra el; la aplicacion a campos concretos corresponde a actos posteriores.

- `docs/spec/plan-observable.md:42-68` - §4, Contrato normativo del objeto de plan observable.
- `docs/spec/protocolo-evaluacion.md:51-57` - §6, Propiedades del cegado. El item 1 (`:53`) es la
  clausula de no-inferencia: "El protocolo no debera introducir informacion ajena al contenido
  evaluado que permita inferir el productor de un plan."

Correccion de etiqueta registrada [V]: el objeto de A referia "protocolo-evaluacion.md §6.1".
El protocolo no tiene §6.1; `:53` es §6 item 1. La etiqueta "§6.1" existe en
`docs/spec/plan-observable.md:88` (§6.1, No adicion), con contenido distinto (condicion de
fidelidad de la proyeccion). Referente distinto; no confundir.

---

## 5. Artefactos crudos versionados (I2, ficheros separados, mismo directorio)

Cada artefacto con su hash propio. Los dos artefactos de `buildPlan` son artefactos de corrida,
no una representacion canonica del productor: el hash identifica la corrida concreta, no la
emision abstracta.

| Artefacto | Naturaleza | Hash |
|---|---|---|
| `out/r0-buildPlan-run1.raw.json` | corrida 1 de la ejecucion [V] | SHA256 `bfbdb6d7230866932ffb9ce9fea27279f3cad3d3c1b214709c3dd14e381fee5e` (incluye day.id: corrida-especifico) |
| `out/r0-buildPlan-run2.raw.json` | corrida 2 de la ejecucion [V] | SHA256 `0767309c1db2e23a45e494554ba246992e5b428dda86cbb426276256050aa98a` (incluye day.id: corrida-especifico) |
| `out/r0-materializePlan.raw.json` | emision byte-estable | SHA256 `92a5454e3eef0fecad4998fd63a72053d3a10721cddb9e90aced652c74e65ac5` |
| `r0-emision-productores.mjs` | soporte de ejecucion/diff | SHA256 `5ff4939bdd7db5c2f2413dcd28f3492c3aa45272fc64bb0e5dca5e7625166b25` |

Rutas relativas a `docs/evidence/protocolo-evaluacion/`. Los tres `.raw.json` viven en el
subdirectorio `out/`; el instrumento en el directorio raiz del perimetro de evidencia.
`run1` y `run2` son las dos ejecuciones consecutivas de la corrida [V] cotejada en terminal.

---

## 6. Descripcion estructural de las emisiones observadas

Descripcion de lo observado, en lenguaje enumerativo. No concluye conformidad.

### 6.1 Emision de `buildPlan` (run1)

- Claves de primer nivel: `days`, `strategy`, `weekWarnings`, `weekProblems`, `weekScore`.
  No aparece `decisionLog`.
- `days`: array de 7 elementos.
- Cada elemento de `days` expone: `name`, `id`, `special`, `mood`, `effectiveMood`, `meals`,
  `shakeEnabled`.
- `meals`: array de 3 elementos por dia.
- Cada elemento de `meals` expone: `time`, `emoji`, `title`, `p1`, `p2`, `shopping` (array),
  `recipe` (array), `metadata` (objeto), `_spec` (objeto); algunos exponen ademas `slotNote`
  y/o `wildcard`.
- La comida se identifica dentro del dia por el valor de `time` (cadena: "Desayuno", "Comida",
  "Cena").
- `weekWarnings`: array de 15 cadenas. `weekProblems`: array vacio. `weekScore`: numero (`97`).
- No se observaron en la emision cruda valores del repertorio que el instrumento marca
  (`function`, `undefined`, `symbol`, `bigint`, `NaN`, `Infinity`, `Map`, `Set`, referencia
  circular). El recorrido devolvio ese conjunto vacio para `buildPlan` [V].

### 6.2 Emision de `materializePlan`

- Claves de primer nivel: `days`, `strategy`, `weekWarnings`, `weekProblems`, `weekScore`,
  `decisionLog`.
- `days`: array de 7 elementos.
- Cada elemento de `days` expone: `day`, `meals`.
- `meals`: array de 2 elementos por dia.
- Cada elemento de `meals` expone: `momento` (cadena: "comida", "cena"), `dish` (objeto).
- `dish` expone: `id`, `nombre`, `rol`, `batchable`, `leftoverQuality`, `shelfLifeDays`,
  `energiaCocina`, `momento` (array), `tempFeel`, `plateType`.
- `dish.id` se observa en dos formatos: cadena-slug simple (p.ej. `"hummus_pita_pollo"`) y
  cadena que es la serializacion JSON de un array (p.ej.
  `"[\"caliente_clasico\",\"pollo\",...]"`).
- `weekWarnings`: array vacio. `weekProblems`: array vacio. `weekScore`: `null`.
- `decisionLog`: array de 32 elementos [V]. Los elementos no comparten un unico conjunto de
  claves; se observan cuatro conjuntos distintos [V]:
  - `[decisionId, cause, evidence, consequence]` - 17 elementos (indices 0-16).
  - `[decisionId, day, momento, plato, causa, evidencia, alternativasDescartadas]` - 1 (indice 17).
  - `[decisionId, day, momento, plato, causa, evidencia, alternativasDescartadas, evento]` - 1 (indice 18).
  - `[decisionId, day, momento, plato, causa, evidencia, alternativasDescartadas, energiaCocina]` - 13 (indices 19-31).
  - El elemento de indice 18 expone `momento` y `plato` con valor `undefined` [V].
  - El contenido semantico de `decisionLog` (que decide el motor y por que) queda fuera del
    objeto de A. Se describe su existencia, longitud, estructura de claves y presencia de
    `undefined`; no su significado.
- La emision cruda contiene dos valores `undefined`, en `decisionLog[18].momento` y
  `decisionLog[18].plato` [V]. Se registra como observacion del objeto crudo; A no concluye
  nada sobre que ocurriria al serializar la emision con JSON.

---

## 7. Estabilidad de la emision (dato; A no esta sujeto a §5)

Este reconocimiento no es una medicion. Las obligaciones de §5 del protocolo (self-check de
determinismo, PRNG identico, N declarado) no son requisitos de ejecucion de A. La estabilidad
se registra como dato observado, no como cumplimiento de §5.

- **`buildPlan`**: no byte-estable en crudo. Comparacion estructural entre `run1` y `run2`
  (ejecucion [V]): las unicas rutas divergentes son `days[i].id` para i=0..6; ninguna otra ruta
  diverge (veredicto del instrumento: `soloDayId = true`) [V]. La cabecera del test del
  productor identifica `day.id` como dependiente de `Date.now()`, no de RNG ni de entradas
  (`src/engine/tests/buildPlan.snapshot.test.js:3-4`), y excluye ese campo de su propia
  comparacion de estabilidad (`serialiseDays`, :44-47).

  Formulacion S2 (observacion de los artefactos versionados, no propiedad general del productor):
  > Las diferencias observadas entre `out/r0-buildPlan-run1.raw.json` y
  > `out/r0-buildPlan-run2.raw.json` se limitan a `days[i].id`. No se observaron diferencias en
  > los restantes elementos del objeto. Esta observacion no se eleva a propiedad universal del
  > productor, y no constituye afirmacion de conformidad ni de suficiencia.

- **`materializePlan`**: en la comparacion observada de dos ejecuciones con la misma entrada,
  el resultado fue byte-identico [V]. No se eleva a propiedad general del productor.

---

## 8. Comparacion entre emisiones (datos; no defectos, no candidatos a cegado)

Se registran como datos. No se convierte ninguna divergencia en defecto normativo, en candidato
a cegado ni en recomendacion.

1. `buildPlan` no expone `decisionLog`; `materializePlan` si lo expone.
2. `weekScore`: `buildPlan` emite un numero (`97`); `materializePlan` emite `null`.
3. `weekWarnings`: `buildPlan` emite 15 cadenas; `materializePlan` emite `[]`. Observado bajo
   entradas nativas distintas (F-A1(b)); no se afirma "misma entrada, distinta salida".
4. Cardinalidad de `meals` por dia: 3 en `buildPlan`, 2 en `materializePlan`.
5. Campo identificador de la comida dentro del dia: `time` en `buildPlan` (capitalizado:
   "Desayuno"/"Comida"/"Cena"); `momento` en `materializePlan` (minusculas: "comida"/"cena").
6. Grafia de los nombres de dia: con tildes en `buildPlan` ("Miercoles", "Sabado" con tilde);
   sin tildes en `materializePlan`.
7. El objeto que representa cada comida no comparte ninguna clave entre productores.
8. (Interno a `materializePlan`) `dish.id` alterna entre dos formatos (slug simple / array
   serializado).
9. (Interno a `materializePlan`) los elementos de `decisionLog` alternan entre conjuntos de
   claves con nombres en ingles (`cause/evidence/consequence`) y en espanol
   (`causa/evidencia/alternativasDescartadas`).
10. Estabilidad entre corridas con la misma entrada: `buildPlan` difiere (solo `day.id`);
    `materializePlan` byte-identico.
11. Integridad de serializacion: `buildPlan` integra; `materializePlan` contiene 2 valores
    `undefined` en `decisionLog[18]`.

---

## 9. Hard stop

A termina aqui. La significacion de estas divergencias para el cegado - que rasgo delata el
origen, que es contenido, que es ajeno - es materia del acto siguiente (frontera
contenido/ajeno), que discrimina el fork evidencial vs. normativo. D-083 queda disponible como
referencia; no se aplica a ningun campo en este reconocimiento.

---

## 10. Backlog anotado (no forma parte de A)

- La variacion de `day.id` entre corridas (atribuida por el test del productor a `Date.now()`)
  queda anotada como materia para el acto de frontera. Si esa variacion permite o no inferir el
  productor es cuestion de ese acto, no de A.
- El fantasma "§6.1 del protocolo" citado en otros documentos: higiene aparte, no resuelta
  globalmente por este acto.
- El instrumento, al versionarse: su cabecera cita una ruta hoy en `.gitignore`
  (`scripts/diag/...`) y su funcion `readPreviousRaw()` se comporta distinto en un tercero sin
  corrida previa. Ajustar ambas cosas al mover a `docs/evidence/`, o declararlas como
  limitaciones conocidas.
