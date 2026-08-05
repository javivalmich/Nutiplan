# R-0 — Reconocimiento Fork B: disposicion sustantiva de ii-auto / regla de cierre de (ii)

## Naturaleza

Acto de reconocimiento, read-only. Demuestra; no decide. El asiento posterior (Fork B) consume esta demostración y dispone la consecuencia. Actos separados.

## HEAD

```
commit aedf8cf79bd118b73d731d738d681fa459c86914
Merge: 2c3346f a613f6b
Author: Javi <javivalmich@gmail.com>
Date:   Fri Jul 31 18:50:10 2026 +0200

    merge: evidencia R-0 forma-cierre-ii
```

Parents literales: `2c3346f6e1e55d357ab30b650d6448794c3c4d9a` `a613f6b21c9b1631d5fd93c77f5b785e55fb248d`.

## Perímetro inspeccionado

- **DECISIONS.md ÍNTEGRO @ HEAD.** El fichero tiene **3448 líneas** (`wc -l DECISIONS.md`).
- **Secuencia de encabezados.** Extracción con `grep -n '^## D-0[0-9][0-9]' DECISIONS.md` produce 80 encabezados, de `D-001` (línea 14) a `D-080` (línea 3406).
- **Método de verificación append-only / sin huecos.** Se extrajo el número de cada encabezado (`grep -oP '^## D-\K[0-9]{3}'`) y se recorrió la secuencia comprobando que cada valor es exactamente el anterior + 1 (`awk` con acumulador), sin declarar la secuencia por conteo de encabezados ni por fuente externa. Resultado: secuencia consecutiva 001→080 sin huecos ni repeticiones, terminando en 080. Esto verifica la estructura interna del contenido en HEAD; no verifica ausencia de reescritura de historia (fuera de alcance de este reconocimiento, que opera sobre el árbol de trabajo en HEAD, no sobre `git log --follow` del fichero).
- **Remisiones seguidas.** Ninguna. Los asientos candidatos (D-078, D-080) remiten por fundamento a `plan-observable.md` §2/§4/§5 y a `protocolo-evaluacion.md`, pero este reconocimiento no sigue esas remisiones: permanecen fuera de perímetro, declarado explícito abajo. No se siguió ninguna spec.
- **Fuera de perímetro por diseño (declarado explícito):** `CLAUDE.md`; specs no invocadas por remisión seguida (`plan-observable.md`, `protocolo-evaluacion.md` — citadas por los asientos pero no leídas aquí); `docs/evidence/` (incluidos los R-0 previos de la cadena ii-auto/ii-med, citados por los asientos pero no reabiertos ni releídos como fuente propia de este barrido); los `.xlsx`; cualquier material no-DECISIONS.md.

## Conjunto de términos de barrido

Lista literal: `ii-auto`, `\(ii\)`, `ii-med`, `cierre`, `cerrad`, `suficiencia`, `muestreo`, `reproducibilidad`.

El alcance de cualquier resultado negativo de este reconocimiento queda acotado a este conjunto de términos y al perímetro declarado arriba (DECISIONS.md íntegro @ HEAD). Ningún término adicional fue barrido.

## Discriminación aplicada

Tres categorías, aplicadas línea por línea sobre cada asiento contenedor de un hit, no sobre la frase aislada:

1. **Clasificación de estatus** (NO cuenta como A ni como B): un asiento que caracteriza, cataloga, cita, difiere o declara la naturaleza/estatus de ii-auto, ii-med o (ii) — sin resolver su contenido sustantivo ni adoptar una regla de cierre. Ejemplo de criterio literal: un asiento que dice "no procede clasificar", "queda abierta", "difiere a acto futuro" cae aquí.
2. **Disposición sustantiva de ii-auto (A)**: un asiento cuyo texto decide el contenido de la evaluación de ii-auto — no su pregunta propia, no su extensión normativa formal, no su estatus organizativo, sino la respuesta sustantiva al eje de muestreo/reproducibilidad que ii-auto representa.
3. **Regla de cierre de (ii) (B)**: un asiento cuyo texto adopta, con carácter normativo, una regla que permite declarar cerrada (ii) sin que conste disposición sustantiva de ii-auto — por ejemplo, una regla que baste con disponer ii-med, o que ii-auto haya devenido irrelevante para el cierre.

Criterio literal usado para discriminar: se buscaron verbos decisorios ("se decide", "se dispone", "queda resuelto", "se adopta la regla") aplicados directamente al contenido sustantivo de ii-auto (para A) o a una regla de cierre de (ii) (para B), distinguiéndolos de menciones que solo catalogan, refieren cruzado, o declaran expresamente "no decide"/"no resuelve"/"queda abierta".

## Asientos candidatos — exhibición literal íntegra

Todo asiento que contiene un hit de `ii-auto`, `ii-med` o `\(ii\)` en sentido no-enumerativo (es decir, referido al (ii) de Frente B, no a una lista genérica "(i)...(ii)...(iii)") se exhibe íntegro a continuación. Rangos calculados en sitio contra los encabezados inmediatamente siguientes; sin solapamiento; ningún encabezado ambiguo.

### D-075 (líneas 3313–3332)

```
3313|## D-075 — Asiento: partición normativa de (ii) en ii-auto / ii-med
3314|
3315|**Naturaleza:** Decisión normativa. Adopta una partición sobre terreno ya demostrado; no reconoce, no demuestra.
3316|
3317|**Fuente de la demostración:** `docs/evidence/protocolo-evaluacion/R-0-observacion-vs-muestreo-ii.md` (sellado en `abb468f`). El R-0 demuestra la partición del terreno; este asiento la adopta como normativa. Actos separados.
3318|
3319|**Pregunta resuelta (F-δ-Q):** ¿Se asienta (ii) —la suficiencia de C v1 para soportar el protocolo de evaluación— como partición normativa en ii-auto / ii-med, con ii-auto autónomo e ii-med mediado por la relación C v1↔objeto, o permanece (ii) como requisito único, dejando esa partición solo como hecho demostrado sin adopción normativa?
3320|
3321|**Decisión:** Se adopta la partición normativa. (ii) deja de tratarse como requisito único y se escinde en dos sub-cuestiones con estatus distinto:
3322|
3323|- **ii-auto** — eje de muestreo/reproducibilidad. Su evaluación no enruta por el contrato del objeto (`plan-observable.md` §4.2) y, por tanto, no requiere la relación C v1↔objeto. El tamaño de muestra N (§5.6 del protocolo) es el caso limpio: cuenta iteraciones semanales sin invocar la colección `days`. Sub-cuestión autónoma.
3324|
3325|- **ii-med** — eje de cegado (§6.1 del protocolo, no-filtración del productor). Su evaluación enruta por el contrato del objeto —el contenido evaluado es el objeto— y queda **mediada** por la relación C v1↔objeto: juzgar si C v1 basta para blindar la identidad del productor exige saber qué campos del objeto exceden a C v1. Mediación, no herencia ni prerrequisito. La caracterización precisa de esa relación permanece en **divergencia registrada y no resuelta** (dos caracterizaciones incompatibles en corpus: C v1↔proyección vs. C v1↔definición contractual del objeto); este asiento no la resuelve y la deja viva como deuda aguas abajo.
3326|
3327|**Alcance / lo que este asiento NO hace:**
3328|- No resuelve la relación C v1↔objeto ni elige entre sus dos caracterizaciones divergentes.
3329|- No fija orden de trabajo entre ii-auto e ii-med.
3330|- No cierra (ii): ii-auto queda listo para trabajarse de forma autónoma; ii-med queda bloqueado por la divergencia de caracterización, que es su propio acto.
3331|
3332|**Consecuencia:** ii-auto es descargable sin resolver la relación C v1↔objeto. ii-med no, hasta que la divergencia de caracterización se asiente por separado.
3333|
```

**Clasificación provisional: NO-CANDIDATO** (ni A ni B). Motivo anclado: `:3330` declara expresamente "No cierra (ii)"; el asiento es constitutivo de la partición, no dispone contenido sustantivo de ii-auto (no hay verbo decisorio aplicado a su evaluación, solo caracterización de su eje) ni adopta regla de cierre de (ii).

### D-076 (líneas 3334–3347)

```
3334|## D-076 — Constitución de ii-auto: pregunta propia y extensión normativa
3335|
3336|**Contexto / dependencia.** D-075 (`DECISIONS.md:3313-3332`) escinde (ii) en dos sub-cuestiones autónomas y caracteriza ii-auto como «eje de muestreo/reproducibilidad» cuya evaluación no enruta por el contrato del objeto (`plan-observable.md §4.2`) y no requiere la relación C v1↔objeto (`DECISIONS.md:3323`). D-075 no fija una pregunta propia dedicada a ii-auto ni delimita su extensión normativa. El R-0 de reconocimiento (`docs/evidence/protocolo-evaluacion/R-0-reconocimiento-ii-auto.md`, sellado en `4c886f5`, vigente en `7edb6dc`) demuestra ambos huecos: el corpus no fija oración interrogativa dedicada a ii-auto (`R-0-reconocimiento-ii-auto.md:69`, `:112`), y no distingue de forma expresa si ii-auto adopta el mapeo completo de muestreo o solo el caso de §5.6 (`R-0-reconocimiento-ii-auto.md:63`, `:115`). El R-0 demuestra; este asiento decide. Actos separados.
3337|
3338|**Decisión 1 — Pregunta propia (constitutiva).** Se fija como pregunta propia de ii-auto:
3339|
3340|> «¿Se fija ii-auto como el eje de muestreo/reproducibilidad, sin dependencia de la relación C v1↔objeto?»
3341|
3342|Redactada de novo sobre la caracterización literal de `DECISIONS.md:3323`. No se consume la formulación candidata del R-0 (`R-0-reconocimiento-ii-auto.md:73`), que el propio R-0 sella como NO FIJADA POR EL CORPUS y no consumible. El acto de asentar responde afirmativamente esta pregunta al fijar ii-auto como tal eje sobre la base de `:3323`.
3343|
3344|**Decisión 2 — Extensión normativa.** La extensión normativa de ii-auto se fija en §5.6 del protocolo de evaluación (tamaño de muestra N, «el caso limpio» que D-075 cita literal en `DECISIONS.md:3323`). El mapeo completo de las demás cláusulas de muestreo/reproducibilidad (§5.5 semillas, §5.8 agregación, etc.) permanece demostrado en el R-0 previo (`docs/evidence/protocolo-evaluacion/R-0-observacion-vs-muestreo-ii.md`, sellado en `abb468f`) pero NO se adopta como normativo en este asiento. Su adopción, si procede, será acto propio futuro.
3345|
3346|**Alcance.** Este asiento constituye la pregunta propia y fija la extensión mínima (§5.6). No resuelve el contenido sustantivo de evaluación de ii-auto (acto resolutivo, futuro) ni el estatus de ii-auto como frente operativo vs. sub-cuestión (acto de estatus, futuro).
3347|
```

**Clasificación provisional: NO-CANDIDATO** (ni A ni B). Motivo anclado: `:3346` declara expresamente "No resuelve el contenido sustantivo de evaluación de ii-auto (acto resolutivo, futuro)". El asiento fija pregunta propia y extensión formal (§5.6), no disposición sustantiva. No trata cierre de (ii).

### D-077 (líneas 3348–3357)

```
3348|## D-077 — Estatus de ii-auto: no decidible como está formulado; subordinación a acto de criterio
3349|
3350|**Contexto / dependencia.** D-076 (`DECISIONS.md:3346`) difirió de propia mano el estatus de ii-auto —frente operativo propio vs. sub-cuestión— a un «acto de estatus, futuro»; este es ese acto. Al abrirlo, el reconocimiento previo estableció que la distinción sobre la que descansaría la clasificación no está fijada por el corpus sellado: `DECISIONS.md:3346` (D-076) deja el estatus frente-vs-sub-cuestión diferido de propia mano como acto futuro, sin resolverlo; el R-0 de reconocimiento (`docs/evidence/protocolo-evaluacion/R-0-reconocimiento-ii-auto.md:106`, sellado en `4c886f5`, vigente en `7edb6dc`) sella la promovibilidad de ii-auto —si su naturaleza puede tratarse operativamente como frente propio— como NO LOCALIZADA, sin que el corpus lo declare en un sentido ni en otro; y D-046 (`DECISIONS.md:2209-2237`) define «frente» únicamente como mecanismo organizativo que reemplaza al roadmap numerado, sin contrastarlo con «sub-cuestión» ni fijar criterio de promoción entre ambos.
3351|
3352|**Decisión 1 — No decidibilidad.** La cuestión de estatus de ii-auto —«frente operativo propio vs. sub-cuestión»—, tal como está formulada, NO ES DECIDIBLE sobre el corpus vigente: presupone un contraste frente/sub-cuestión cuyo criterio no está fijado (D-046 define «frente» solo organizativamente; la promovibilidad quedó NO LOCALIZADO en el R-0).
3353|
3354|**Decisión 2 — Subordinación.** La cuestión se RETIRA como está planteada y queda SUBORDINADA a un acto futuro de criterio que fije, con carácter general, la distinción «frente operativo» vs. «sub-cuestión». Hasta que ese acto exista, no procede clasificar ii-auto en ninguno de los dos sentidos.
3355|
3356|**Alcance.** Este asiento no clasifica ii-auto (ni promueve a frente ni ratifica sub-cuestión) ni define el criterio frente/sub-cuestión: solo constata su ausencia en el corpus sellado y difiere la definición a acto futuro. No afirma exhaustividad —no sostiene que el criterio no exista en ninguna parte, sino que los hechos sellados citados no lo fijan—; el barrido de perímetro amplio del reconocimiento de sesión no se adopta como normativo.
3357|
```

**Clasificación provisional: NO-CANDIDATO** (ni A ni B). Motivo anclado: este asiento decide una cuestión de **estatus** (frente operativo vs. sub-cuestión), expresamente excluida de A por el criterio de discriminación; `:3356` declara "no clasifica ii-auto... ni define el criterio". No dispone contenido sustantivo, no toca cierre de (ii). Relevante como antecedente citado por D-080 (`:3436`) para el Fork B.

### D-078 (líneas 3358–3385)

```
3358|## D-078 — [2026-07-29] Asiento de Rama 1: adjudicación de la co-referencia proyección ↔ definición contractual del objeto
3359|
3360|Tipo. Decisión normativa (asiento). Decide sobre terreno exhibido por `docs/evidence/protocolo-evaluacion/R-0-caracterizacion-cv1-objeto.md`, sellado en el árbol de `f43db50`. El R-0 demuestra; este asiento decide. Actos separados.
3361|
3362|Ancla. `origin/main @ f43db50`.
3363|
3364|Objeto. Adjudicar si «proyección» (`plan-observable.md §2`, D-058 `DECISIONS.md:2610`) y «definición contractual del objeto» (`plan-observable.md §2/§4`, D-061 `DECISIONS.md:2685`, D-072 `DECISIONS.md:3263`) co-refieren, y verificar la incompatibilidad consignada en D-075 `DECISIONS.md:3325`. Precondición de ii-med.
3365|
3366|Perímetro leído. `docs/spec/plan-observable.md §2 (:24-32) + §4 (:42-68) + §5 (:70-82)`, literal contra `f43db50`. El perímetro incorpora §5 («Requisitos de proyección») por ratificación previa al acto, para que toda conclusión negativa quede acotada a un perímetro que contiene la sección nominalmente más relevante al término en disputa.
3367|
3368|Exhibición decisiva.
3369|
3370|* `plan-observable.md:30`: «Plan observable» = objeto que satisface el contrato de §4.
3371|* `plan-observable.md:31`: «Proyección» = transformación de un plan observable a la representación que consumirá la evaluación, sujeta a §5.
3372|* `plan-observable.md:74` (§5.1): toda proyección deberá computarse exclusivamente a partir del plan observable.
3373|
3374|Decisión 1 — Co-referencia: negativa. «Proyección» y «definición contractual del objeto» no co-refieren. §2 los fija como entidades distintas ligadas por una relación funcional: la proyección es una transformación del objeto (`:31`), computada exclusivamente a partir del plan observable (`:74`). El objeto es lo que satisface el contrato de §4 (`:30`); la proyección es aguas abajo de él.
3375|
3376|Decisión 2 — Verificación de D-075. La incompatibilidad consignada en D-075 `DECISIONS.md:3325` no queda confirmada tras la lectura literal de `plan-observable.md` §2 y §5. La lectura de esas secciones muestra que «proyección» y «definición contractual del objeto» designan entidades distintas, por lo que las dos relaciones comparadas —[C v1↔proyección] (D-058 `:2610`) y [C v1↔definición contractual del objeto] (D-061 `:2685`, D-072 `:3263`)— dejan de constituir caracterizaciones rivales de un mismo término.
3377|
3378|Alcance append-only. Este asiento no deroga D-075 ni ningún asiento previo. La partición ii-auto/ii-med de D-075 permanece vigente; únicamente su calificación de la relación C v1↔objeto como «divergencia incompatible» deja de estar sostenida por el literal de §2/§5, conforme a la Decisión 2.
3379|
3380|Residual acotado — no decidido en este asiento. En qué lado de la distinción objeto/proyección cae C v1 exige el literal de D-047 (`DECISIONS.md`), fuera del perímetro leído. Este asiento no lo pronuncia. Pasa a ser el siguiente reconocimiento de la cadena de Rama 1.
3381|
3382|Efecto sobre ii-med. ii-med (D-075 `:3325`) permanece bloqueado únicamente por el reconocimiento del residual C v1↔lado (lectura de D-047). Resuelto ese reconocimiento, ii-med queda desbloqueado: su formulación —qué campos del objeto §4 exceden a C v1— dispone ya de la relación objeto/proyección fijada por este asiento.
3383|
3384|Estado. Rama 1: co-referencia adjudicada (negativa); incompatibilidad de D-075 no confirmada por el literal de §2/§5; relación objeto↔proyección fijada (`:30`, `:31`, `:74`). Residual C v1↔lado diferido al reconocimiento de D-047, que es ahora el único bloqueo de ii-med.
3385|
```

**Clasificación provisional: NO-CANDIDATO** (ni A ni B). Motivo anclado: el asiento dispone sobre Rama 1 (co-referencia proyección↔objeto) como precondición de **ii-med**; no menciona ii-auto en ningún punto de su texto (0 hits de `ii-auto` en este rango) y no dispone contenido sustantivo de ii-auto. No adopta regla de cierre de (ii): `:3378` es alcance append-only sobre D-075, sin tocar (ii).

### D-079 (líneas 3386–3405)

```
3386|## D-079 — [2026-07-30] Cierre de Rama 1: disposición del residual C v1↔lado y desbloqueo de ii-med
3387|
3388|**Contexto / dependencia.** D-078 (`DECISIONS.md:3358`) dejó dos remisiones encadenadas. Primera: el residual «en qué lado de la distinción objeto/proyección cae C v1» se difirió como «el siguiente reconocimiento de la cadena de Rama 1» (`DECISIONS.md:3380`) —reconocimiento, no asiento—. Segunda: fijó el régimen de dependencia de ii-med — ii-med «permanece bloqueado únicamente por el reconocimiento del residual C v1↔lado (lectura de D-047); resuelto ese reconocimiento, ii-med queda desbloqueado» porque su formulación dispone ya de la relación objeto/proyección fijada por D-078 (`DECISIONS.md:3382`).
3389|
3390|Ese reconocimiento se ejecutó y quedó sellado como evidencia versionada en `docs/evidence/R-0-reconocimiento-D-047.md` (vigente en `e701705`). Su conclusión terminal es negativa respecto de D-047: «D-047 no ubica C v1 en la dicotomía objeto/proyección. Desarrolla un marco conceptual propio» (`R-0-reconocimiento-D-047.md:76`), y «entre ese marco y la distinción objeto/proyección permanece fuera del perímetro de D-047» (`:79`), sostenido por el literal en `:59`.
3391|
3392|El R-0 demuestra; este asiento decide. El reconocimiento respondió a la pregunta que tenía encomendada —¿fija D-047 el lado?— con un no. Este asiento no la reabre ni intenta obtener de D-047 lo que el R-0 demostró ausente: dispone el residual ya reconocido y declara su efecto sobre ii-med conforme a `DECISIONS.md:3382`.
3393|
3394|**Decisión 1 — Disposición del residual C v1↔lado.** El reconocimiento del residual C v1↔lado queda concluido con resultado negativo respecto de D-047: el corpus, por vía de D-047, no adjudica en qué lado de la distinción objeto/proyección cae C v1, y la reconciliación entre el marco propio de D-047 y esa distinción permanece fuera de su perímetro (`R-0-reconocimiento-D-047.md:76`, `:79`). El residual no se transforma en una decisión positiva sobre la ubicación de C v1 ni queda resuelto con carácter general; lo que este asiento dispone es la conclusión del reconocimiento, no la del contenido sustantivo de la cuestión.
3395|
3396|**Decisión 2 — Efecto sobre la dependencia de ii-med.** Conforme al régimen fijado en D-078 (`DECISIONS.md:3382`), el reconocimiento del residual C v1↔lado ha quedado resuelto en los términos que documenta `docs/evidence/R-0-reconocimiento-D-047.md`. Con ello queda satisfecha la única precondición documental que D-078 imponía sobre ii-med. En consecuencia, ii-med deja de estar bloqueado. El desbloqueo no deriva de una adjudicación positiva del lado de C v1 —que este asiento no realiza—, sino de que la dependencia establecida por D-078 exigía la resolución del reconocimiento y no una determinada respuesta sustantiva a ese reconocimiento.
3397|
3398|**Distinción preservada.** Este asiento mantiene separadas dos cosas: resolver un reconocimiento (cumplido: el R-0 respondió a su pregunta) y resolver el contenido sustantivo de la cuestión reconocida (no cumplido: dónde cae C v1 sigue sin adjudicarse). El desbloqueo de ii-med se apoya en la primera, no en la segunda. Se evita por tanto toda formulación que infiera que «el lado deja de importar»: el lado no se decide aquí, y su no-decisión no es obstáculo para ii-med bajo el régimen de D-078.
3399|
3400|**Alcance append-only.** No deroga D-047, D-075 ni D-078 ni ningún asiento previo. No desarrolla el marco conceptual de D-047 ni cita literalmente la Decisión 1 de D-078. No decide ii-med: únicamente lo desbloquea, dejándolo listo para su propio asiento —qué campos del objeto §4 exceden a C v1—, que queda fuera del presente. No toca la disposición de (ii) post-D-077 (Fork B), en cola. No incorpora los `.xlsx`.
3401|
3402|**Estado.** El residual C v1↔lado queda dispuesto en los términos de este asiento. El bloqueo documental identificado por D-078 (`DECISIONS.md:3382`) queda levantado. ii-med queda desbloqueado y pendiente únicamente de su asiento propio.
3403|
3404|**Referencias.** D-047 (`DECISIONS.md:2239-2324`), D-075 (`DECISIONS.md:3313-3332`), D-078 (`DECISIONS.md:3358-3384`, en particular `:3380`, `:3382`), `docs/evidence/R-0-reconocimiento-D-047.md` (`:59`, `:76`, `:79`).
3405|
```

**Clasificación provisional: NO-CANDIDATO** (ni A ni B), pero **cita central para el Veredicto de B**. Motivo anclado: `:3400` declara literalmente "No toca la disposición de (ii) post-D-077 (Fork B), en cola" — confirma expresamente que (ii) permanece sin disponer y que su disposición está reservada a un acto identificado como «Fork B», no adoptado aquí. El asiento no menciona ii-auto en ningún punto de su texto (0 hits de `ii-auto` en este rango).

### D-080 (líneas 3406–3448)

```
3406|## D-080 — [2026-07-31] Asiento de ii-med: disposición estructural de los campos del objeto §4 que exceden a C v1
3407|
3408|**Naturaleza.** Decisión normativa (asiento). Dispone sobre terreno demostrado; no reconoce, no demuestra. Único acto normativo de ii-med en el plano estructural. El R-0 demuestra; este asiento decide. Actos separados.
3409|
3410|**Ancla.** `origin/main @ 0b60969`.
3411|
3412|**Fuente de la demostración.** `docs/evidence/protocolo-evaluacion/R-0-reconocimiento-ii-med.md` (sellado en el árbol de `0b60969`, leído sobre HEAD `61b8e3c`). El R-0 exhibe la diferencia de conjuntos entre el contrato del objeto y C v1 (Exhibit D, `:48-55`; diferencia, `:80-81`) sin calificarla (`:83`). Este asiento la dispone normativamente.
3413|
3414|**Contexto / dependencia.** D-075 (`DECISIONS.md:3313-3332`) escindió (ii) en ii-auto / ii-med y caracterizó ii-med como eje mediado por la relación C v1↔objeto (`:3325`). D-078 (`DECISIONS.md:3358`) adjudicó negativamente la co-referencia proyección↔definición contractual del objeto y fijó la relación objeto↔proyección (`:3384`). D-079 (`DECISIONS.md:3386`) dispuso el residual C v1↔lado y desbloqueó ii-med, dejándolo «listo para su propio asiento —qué campos del objeto §4 exceden a C v1—» (`:3400`). Este es ese asiento. Su pregunta es, literal, la que D-078/D-079 formulan: qué campos del objeto §4 exceden a C v1 — plano estructural, no informativo.
3415|
3416|**Objeto de la comparación (los dos lados, corpus vivo @ 0b60969).**
3417|- C v1: «la semana como 14 posiciones (7 días × {comida, cena})» (`DECISIONS.md:2261`), congelada con ese alcance y solo ese, con la suficiencia heredada a este frente (`:2271`) y la composición excluida por D-047 (`:2294`). Acarrea el andamiaje temporal de `plan-observable.md:49-52` (§4.2.1–§4.2.4).
3418|- Contrato del objeto: `plan-observable.md` §4 (`:42-68`).
3419|
3420|**Decisión 1 — Criterio estructural de exceso.** Un elemento constituye exceso respecto de C v1 si, y solo si, forma parte de las obligaciones estructurales del contrato del objeto en `plan-observable.md` §4 —sea clave obligatoria (§4.1) u obligación anidada— y su satisfacción no queda garantizada por el andamiaje temporal que C v1 congela. El criterio es de presencia de obligación contractual, no de contenido informativo del campo. Un campo cuenta como exceso con independencia del valor concreto que su instanciación pueda portar.
3421|
3422|**Decisión 2 — Disposición del conjunto de exceso.** Bajo el criterio de la Decisión 1, exceden a C v1:
3423|- composición / identidad de plato — obligación anidada §4.2.5 (`plan-observable.md:53`), excluida de C v1 por D-047 (`DECISIONS.md:2294`);
3424|- `strategy` — §4.3 (`plan-observable.md:55`);
3425|- `weekWarnings` — §4.4 (`plan-observable.md:57-59`);
3426|- `weekProblems` — §4.4 (`plan-observable.md:57-59`);
3427|- `weekScore` — §4.5 (`plan-observable.md:61`), con independencia del valor concreto que contenga;
3428|- `decisionLog` — §4.6 (`plan-observable.md:63-66`), campo opcional del contrato; entra al conjunto de exceso dejando constancia expresa de su carácter opcional.
3429|
3430|Este conjunto coincide con el exhibido por el R-0 (Exhibit D). El asiento lo cita como demostrado y lo dispone; no lo recomputa.
3431|
3432|**No entran (consecuencia del criterio, no decisión adicional).** Las normas del contrato que no son campos del objeto: la regla de contención estructural (§4.0, `plan-observable.md:44`) y la autosuficiencia del objeto (§4.7, `plan-observable.md:68`). El asiento dispone sobre campos del objeto, no sobre normas de interpretación del contrato. El andamiaje temporal §4.2.1–§4.2.4 (`plan-observable.md:49-52`) no excede: es precisamente lo que C v1 congela (R-0, Exhibit C).
3433|
3434|**Fuera de alcance — β preservado.** Este asiento NO valora si la ausencia en C v1 de los campos anteriores satisface la obligación de no-inferencia del productor de `protocolo-evaluacion.md:53` (§6, ítem 1). Esa valoración —el eje de cegado— cambia de pregunta: deja de ser comparación estructural contrato↔C v1 y pasa a ser evaluación frente al requisito del protocolo. Es puente argumental no fijado por la cadena D-078 → D-079 y merece acto normativo propio. ii-med, tal como D-079 lo desbloqueó, se cierra en el plano estructural; el plano de cegado queda expresamente fuera.
3435|
3436|**Cierre de ii-med.** Con la Decisión 1 y la Decisión 2, ii-med queda resuelto en su plano estructural: el conjunto de campos del objeto §4 que exceden a C v1 queda dispuesto normativamente. (ii) NO queda cerrada: la disposición de (ii) post-D-077 (Fork B — si (ii) cierra sobre ii-med en solitario o exige disposición propia de la no-decidibilidad de ii-auto sellada en D-077) permanece en cola, aguas abajo de este asiento.
3437|
3438|**Consecuencias de higiene (registradas, no resueltas aquí).**
3439|- El fantasma «§6.1 del protocolo» vuelve al saco de higiene sin destino asignado. El R-0 ii-med (`R-0-reconocimiento-ii-med.md:98-101`) atribuyó su retirada «al asiento de ii-med, primer acto que cita el cegado de forma normativa»; esa atribución presuponía que ii-med citaría el cegado. Bajo el alcance estructural aquí adoptado, ii-med NO cita el cegado de forma normativa, por lo que no es el hogar de esa retirada. La regla de citación (`protocolo-evaluacion.md:53` o «§6, ítem 1», no «§6.1 del protocolo») se retirará en el acto propio que toque el plano de cegado. No se retira aquí por vía indirecta.
3440|- Colisión de líneas `:53` entre specs, registrada: `plan-observable.md:53` designa §4.2.5 (composición); `protocolo-evaluacion.md:53` designa §6 ítem 1 (cegado). Toda cita de este asiento al primero va calificada.
3441|
3442|**Alcance append-only.** No deroga D-047, D-075, D-078 ni D-079 ni ningún asiento previo. No resuelve en qué lado de la distinción objeto/proyección cae C v1 (no reabierto; dispuesto negativamente por D-078/D-079). No valora suficiencia de cegado (β, fuera). No toca Fork B (en cola). No incorpora los `.xlsx`.
3443|
3444|**Estado.** ii-med: resuelto en el plano estructural. Conjunto de exceso dispuesto. Plano de cegado: fuera de alcance, acto propio pendiente. (ii): abierta, pendiente de Fork B.
3445|
3446|**Referencias.** D-047 (`DECISIONS.md:2239-2324`), D-075 (`DECISIONS.md:3313-3332`), D-078 (`DECISIONS.md:3358-3384`), D-079 (`DECISIONS.md:3386-3404`), `plan-observable.md` §4 (`:42-68`), `docs/evidence/protocolo-evaluacion/R-0-reconocimiento-ii-med.md`.
3447|
3448|**Decide:** Javi.
```

**Clasificación provisional: NO-CANDIDATO** (ni A ni B), **pieza central del Veredicto**. Motivo anclado:
- Respecto de A: el asiento entero dispone sobre **ii-med** (campos del objeto §4 que exceden a C v1); ii-auto aparece únicamente en `:3436` por remisión a D-077 ("la no-decidibilidad de ii-auto sellada en D-077"), no como objeto de disposición sustantiva propia. 0 verbos decisorios aplicados al contenido sustantivo de ii-auto.
- Respecto de B: `:3436` declara literalmente "(ii) NO queda cerrada" y enmarca la propia pregunta de si basta con disponer ii-med, o si además hace falta disponer la no-decidibilidad de ii-auto, como pregunta **abierta y remitida a un acto futuro llamado «Fork B»** ("permanece en cola, aguas abajo de este asiento"). Esto es la formulación explícita de la pregunta (B) como NO RESUELTA por este asiento — no la adopción de una regla que la resuelva.
- `:3444` ratifica: "(ii): abierta, pendiente de Fork B."

## Asientos leídos, no candidatos

### Grupo 1 — Autodeclaración expresa de no decidir la suficiencia de C v1 / (ii)

| Asiento | Hit(s) | Motivo de descarte (autodeclaración, línea) |
|---|---|---|
| D-047 (`:2239-2324`) | `:2271` (suficiencia) | Origen de (ii): "La suficiencia de C v1 para soportar el protocolo de evaluación NO forma parte de este frente y queda heredada explícitamente al Frente B" (`:2271`). Defiere, no dispone. |
| D-061 (`:2668-2697`) | `:2668` (cerradas, header), `:2675` (cerradas, sección), `:2685`, `:2691` (suficiencia) | Cataloga (ii) entre las "Cuestiones abiertas" (§2.a), no entre las cerradas (`:2685`); `:2691` fija solo orden de trabajo, no resuelve. Alcance explícito: "no afirma que C v1 sea o no suficiente" (§4, tras `:2691`). |
| D-062 (`:2698-2821`) | `:2707`, `:2794` (suficiencia) | Autodeclaración literal: "No decide la suficiencia de ningún sustrato" (`:2794`). |
| D-065 (`:2877-2971`) | `:2891`, `:2901`, `:2908`, `:2921` (cerrad), `:2956` (suficiencia) | Autodeclaración literal: "No responde ningún componente de 2.a. No fija observable. No decide la suficiencia de..." (`:2956`). `:2921` discute duplicidad de designación «R-1», ajena a (ii). |
| D-066 (`:2972-3066`) | `:3005`, `:3048` (suficiencia) | Autodeclaración literal: "No decide la suficiencia de C v1 (`DECISIONS.md:2271`)" (`:3048`). |
| D-067 (`:3067-3142`) | `:3117`, `:3119`, `:3129` (cerrad) | Higiene documental sobre duplicidad de designación «R-1» y sobre si un objeto figura en el inventario de D-061; no trata ii-auto ni cierre de (ii). |
| D-068 (`:3143-3193`) | `:3162`, `:3163`, `:3164` (cierre/cerrad), `:3185` (suficiencia), `:3212` (`(ii)`, ver Grupo 2) | Cuestión documental sobre la relación «vehículo de observación» ⇿ «observable» de 2.a. Autodeclaración literal: "No decide la suficiencia de C v1, mencionada en `:2685`, ni deriva su relación con la definición contractual del objeto" (`:3185`). |
| D-072 (`:3257-3274`) | `:3263` (`(ii)`, suficiencia) | Apertura del frente 2.a: fija alcance (los tres componentes, incluido (ii), quedan "dentro" del frente), no resuelve ninguno. Autodeclaración: "constituye el frente y fija su alcance; no resuelve ningún componente" (`:3259`). |
| D-073 (`:3275-3284`) | `:3283` (`(ii)`) | Resuelve 2.a(i) (el observable), no (ii). Autodeclaración literal: "(i) queda resuelto; (ii) y (iii) permanecen abiertos" (`:3283`). |
| D-074 (`:3285-3312`) | `:3289`, `:3294`, `:3297`, `:3300`, `:3301`, `:3305`, `:3306`, `:3309` (suficiencia/`(ii)`) | Corrección documental sobre el alcance de `:2691` citado por D-072. Autodeclaración literal: "No decide si (ii) y (iii) son serializables: `:2691` no lo resuelve y este asiento tampoco" (`:3306`); "este asiento no lo toca" respecto al estado de apertura de (ii) (`:3309`). |

### Grupo 2 — Enumeraciones "(i)/(ii)/(iii)" sin relación con el (ii) de Frente B

| Asiento | Hit(s) | Motivo de descarte |
|---|---|---|
| D-023 (`:746-889`) | `:853` | "(ii)" es marcador de lista dentro de una enumeración de tests ratificados ("(i) ... (ii) y (iii) los dos barridos mecánicos..."), sin relación con el (ii) de Frente B (D-048/D-072), que aún no existía en el corpus en esa fecha. |
| D-044 (`:2025-2156`) | `:2114` | "(ii)" es marcador de lista dentro de criterios de aceptación (INV-1/INV-2) de la política de repetición del motor viejo. |
| D-053 (`:2448-2466`) | `:2457` | "(ii)" es marcador de lista dentro de F-V2 (doble ancla de hash: "(i) el del objeto completo... y (ii) el de una proyección estable..."). |
| D-069 (`:3194-3226`) | `:3212` | "(ii)" es marcador de lista dentro de una enumeración de objetos de higiene arrastrados en traspaso de sesión ("(i) referencia irresoluble a «§6.1»... (ii) alias «juez de Fase 7»..."). |

### Grupo 3 — "cierre"/"cerrad" con referente distinto de (ii)

| Asiento | Hit(s) | Motivo de descarte |
|---|---|---|
| D-005 (`:64-98`) | `:81` | "cierre de `buildPlan()`" — cierre de función en código fuente. |
| D-006 (`:99-110`) | `:105` | "enum cerrado" — vocabulario cerrado de `plateType`, sentido léxico distinto. |
| D-013 (`:250-262`) | `:257` | "cierre de la tabla" — cierre de un literal de objeto en código fuente. |
| D-021 (`:560-652`) | `:584` | "vocabulario cerrado de 8" — enum cerrado de `proteinType`. |
| D-022 (`:653-745`) | `:675` | "enum cerrado `{gluten, lactosa}`" — sentido léxico distinto. |
| D-025 (`:1068-1115`) | `:1157`* | "insumo-cierre-F4.md" — nombre de artefacto de la Fase 4, no relacionado con (ii). *(línea 1157 cae en D-025 por rango de encabezados; referencia a cierre de Fase 4.) |
| D-029 (`:1239-1319`) | `:1239` (header) | "Vocabulario cerrado de verdura" — sentido léxico distinto. |
| D-030 (`:1320-1361`) | `:1339`, `:1342` | "vocabulario cerrado de verdura" (EDITORIAL-D3/D4) — mismo sentido léxico. |
| D-041 (`:1886-1965`) | `:1886` (header), `:1923` | "cierre formal de la fase" — cierre de Fase 4, no de (ii) (D-041 es anterior a D-048, que crea (ii)). |
| D-045 (`:2157-2208`) | `:2187`, `:2206` | "cierre F-M" — cierre de un componente de Fase 4. |
| D-046 (`:2209-2238`) | `:2230` | referencia retrospectiva a "cierre formal de Fase 4". |
| D-051 (`:2406-2423`) | `:2411` | "cierre de un bucle" — cierre de bucle en código fuente. |
| D-055 (`:2493-2546`) | `:2512` | "cierre F-M con impacto registrado" — remite al cierre de Fase 4 (D-045), no a (ii). |
| D-058 (`:2599-2624`) | `:2599` (header), `:2611`, `:2617`, `:2623` | "cierre del Frente A" — cierre de un frente distinto (Frente A, Fase 7), anterior y ajeno a (ii) (que nace en Frente B). |
| D-062 (`:2698-2821`) | `:2772` (además de `:2707`/`:2794`, Grupo 1) | "Cláusula de cierre" — título de una cláusula sobre el alcance de la admisibilidad A1, no cierre de (ii). |

### Grupo 4 — "muestreo"/"reproducibilidad" generales del protocolo, sin relación con ii-auto

| Asiento | Hit(s) | Motivo de descarte |
|---|---|---|
| D-026 (`:1116-1144`) | `:1134` | "reproducibilidad por seed" — determinismo de artefactos de medición F4-P2c, anterior a la existencia de ii-auto. |
| D-054 (`:2467-2492`) | `:2477`, `:2479`, `:2482` | Definiciones generales de §5 (reproducibilidad/auditabilidad del proceso de medición) y §2 (unidad de muestreo semanal) del protocolo; no disponen ii-auto ni (ii). |
| D-057 (`:2577-2598`) | `:2590`, `:2594` | Conformidad §4.4.2 y comparabilidad del artefacto de `decisionLog`; "Esta divergencia es materia del Frente B... no de conformidad" (`:2590`) — remite, no dispone. |

## Veredicto (SOLO DOCUMENTAL — sin consecuencia normativa)

**Evidencia relativa a A (disposición sustantiva de ii-auto).** Los únicos asientos que mencionan `ii-auto` en el corpus son D-075 a D-080 (exhibidos íntegros arriba). Ninguno decide el contenido sustantivo de la evaluación de ii-auto:
- D-075 (`:3313-3332`) lo constituye como sub-cuestión y lo caracteriza ("eje de muestreo/reproducibilidad"), sin evaluarlo.
- D-076 (`:3334-3347`) le fija pregunta propia y extensión normativa formal (§5.6), declarando expresamente en `:3346`: "No resuelve el contenido sustantivo de evaluación de ii-auto (acto resolutivo, futuro)".
- D-077 (`:3348-3357`) decide únicamente su **estatus** (frente vs. sub-cuestión) como NO DECIDIBLE y lo subordina a acto futuro (`:3352`, `:3354`); clasificación de estatus, no disposición sustantiva, y expresamente niega clasificar (`:3356`).
- D-078, D-079 (`:3358-3405`) no mencionan `ii-auto` en ningún punto de su texto.
- D-080 (`:3406-3448`) cita a ii-auto solo por remisión a D-077 (`:3436`), sin disponer su contenido.

**Localizada: NO.**

**Evidencia relativa a B (regla adoptada de cierre de (ii) sin disponer ii-auto).** El único asiento que dispone formalmente sobre el cierre de (ii)/ii-med es D-080. Su texto declara, literal:
- `:3436`: "(ii) NO queda cerrada: la disposición de (ii) post-D-077 (Fork B — si (ii) cierra sobre ii-med en solitario o exige disposición propia de la no-decidibilidad de ii-auto sellada en D-077) permanece en cola, aguas abajo de este asiento."
- `:3444`: "(ii): abierta, pendiente de Fork B."

Esto formula la pregunta de B ("¿basta ii-med para cerrar (ii), o hace falta además disponer la no-decidibilidad de ii-auto?") como pregunta abierta remitida a un acto futuro identificado como «Fork B» — no como una regla ya adoptada que la resuelva en ningún sentido. D-079 `:3400` es consistente: "No toca la disposición de (ii) post-D-077 (Fork B), en cola." D-075 `:3330` es consistente desde el origen de la partición: "No cierra (ii)".

**Localizada: NO.**

**Resultado documental: NINGUNO** (ni A ni B constan en DECISIONS.md dentro del perímetro y term-set declarados).

## Alcance del negativo

- **QUÉ se inspeccionó:** DECISIONS.md íntegro @ HEAD `aedf8cf79bd118b73d731d738d681fa459c86914` (3448 líneas, 80 asientos D-001–D-080). Ninguna remisión a spec fue seguida (declarado en «Perímetro inspeccionado»).
- **QUÉ términos guiaron el barrido:** el conjunto declarado — `ii-auto`, `\(ii\)`, `ii-med`, `cierre`, `cerrad`, `suficiencia`, `muestreo`, `reproducibilidad`.
- **QUÉ significa el resultado negativo:** dentro de ESE perímetro (DECISIONS.md íntegro @ HEAD) y bajo ESE term-set, no consta (A) una disposición sustantiva de ii-auto, ni (B) una regla adoptada que permita cerrar (ii) sin disponer sustantivamente ii-auto.
- **QUÉ NO significa** (explícito, ontológico):
  - NO es afirmación de que A o B no existan en ninguna parte del repositorio.
  - NO cubre material fuera de DECISIONS.md (`CLAUDE.md`, specs no invocadas por remisión seguida — `plan-observable.md`, `protocolo-evaluacion.md` —, `docs/evidence/`, los `.xlsx`).
  - NO prejuzga ningún acto futuro que pudiera disponer la sustancia de ii-auto o adoptar una regla de cierre — de hecho, D-080 (`:3436`) y D-077 (`:3354`) formulan expresamente esas disposiciones como actos futuros pendientes (el propio "Fork B" y el "acto de criterio" sobre estatus, respectivamente).
  - Es ausencia DOCUMENTAL en perímetro declarado, no inexistencia ontológica.

## Deudas de higiene observadas (registradas, no resueltas)

- **Fantasma «§6.1 del protocolo».** Reaparece literal dentro de un asiento candidato: D-075 `:3325` — "ii-med — eje de cegado (§6.1 del protocolo, no-filtración del productor)". D-080 `:3439` ya registra este fantasma como "sin destino asignado" tras determinar que ii-med (estructural) no es su hogar. Este reconocimiento no le asigna destino; solo constata su recurrencia literal en `:3325`, sin resolver el acto que deba tocar el plano de cegado (β).
- **Patrón `^[#>\*\s]*D-0\d\d\b` produce ruido para ENUMERAR encabezados** (coincide también con citas internas del tipo "D-075 (`DECISIONS.md:3313-3332`)"). Este reconocimiento enumeró encabezados con `^## D-0[0-9][0-9]` (ancla estricta de nivel 2), no con el patrón amplio. El patrón filtrado-por-tag amplio sigue válido para EXTRAER un asiento conocido por posición, no para ENUMERAR encabezados.
