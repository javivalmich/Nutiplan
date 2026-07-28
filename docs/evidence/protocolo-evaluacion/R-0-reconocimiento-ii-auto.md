# R-0 — Reconocimiento de ii-auto

**Naturaleza:** Acto de reconocimiento read-only. Reconstruye, contra el repo vivo y solo desde el corpus versionado, qué es ii-auto. Es descriptivo: no resuelve, no ordena, no propone resolución.

**Ancla:** `64792d1` (`git log -1`: Merge `abb468f a1bd5d6`, "merge: D-075 asiento particion normativa (ii) en ii-auto / ii-med").

**Alcance:** `DECISIONS.md` (asientos D-047, D-061, D-065, D-072, D-074, D-075), `docs/evidence/protocolo-evaluacion/R-0-observacion-vs-muestreo-ii.md`, `docs/spec/protocolo-evaluacion.md` §2/§4/§5, `docs/spec/plan-observable.md` §4.2.

---

## (a) El (ii) padre: qué era "(ii)" antes de partirse

El contenido que hoy se llama "(ii)" nace, sin ese rótulo numérico, como el segundo de tres componentes que D-065 registra dentro de la cuestión abierta 2.a (sustrato de evaluación):

> "D-061 (`DECISIONS.md:2685`) registra como cuestión abierta el sustrato de evaluación, con tres componentes: sobre qué observable evalúa el juez la tesis; la suficiencia de C v1 para soportar el protocolo (`DECISIONS.md:2271`); y la relación —que la propia entrada califica de 'nunca derivada'— entre C v1 y la definición contractual del objeto" (`DECISIONS.md:2889-2894`).

El contenido mismo remonta a D-047: *"La suficiencia de C v1 para soportar el protocolo de evaluación NO forma parte de este frente y queda heredada explícitamente al Frente B"* (`DECISIONS.md:2271`).

El rótulo literal "(ii)" para este componente aparece por primera vez en **D-072**, que enumera los tres componentes de 2.a con numeración romana:

> "Alcance (dentro): los tres componentes de 2.a según `DECISIONS.md:2889-2894` — (i) el observable; (ii) la suficiencia de C v1 para soportar el protocolo (`:2271`); (iii) la relación —«nunca derivada»— entre C v1 y la definición contractual del objeto" (`DECISIONS.md:3263`).

Verificación de que D-072 es el primer uso de esta etiqueta para este contenido: un `grep` de `\(ii\)` sobre todo `DECISIONS.md` anterior a la línea 3263 encuentra cuatro apariciones, todas en contextos ajenos al sustrato de evaluación: `DECISIONS.md:853` (contrato de ausencia sobre fixture), `:2114` (coste de repetición monótono en días), `:2457` (doble ancla de hash), `:3212` (lista de objetos de higiene arrastrados). Ninguna referida al sustrato de evaluación. D-061 (`:2685`) y D-065 (`:2889-2894`) ya listan el contenido pero sin numeración romana.

**Conclusión (a):** el (ii) padre = "la suficiencia de C v1 para soportar el protocolo [de evaluación]" (`DECISIONS.md:2271`), componente de la cuestión abierta 2.a fijada en D-061 (`:2685`) y numerado por primera vez como "(ii)" en D-072 (`:3263`). D-072 lo deja abierto: *"Estado: abierto. Ningún componente resuelto"* (`DECISIONS.md:3271`).

---

## (b) La partición D-075

D-075 (`DECISIONS.md:3313-3332`) fija la partición. Texto de la decisión:

> "Se adopta la partición normativa. (ii) deja de tratarse como requisito único y se escinde en dos sub-cuestiones con estatus distinto" (`DECISIONS.md:3321`).

El asiento se autocalifica de forma explícita respecto de su propio alcance:

> "**Naturaleza:** Decisión normativa. Adopta una partición sobre terreno ya demostrado; no reconoce, no demuestra" (`DECISIONS.md:3315`).

La demostración de terreno que D-075 adopta como normativa procede de un acto separado:

> "**Fuente de la demostración:** `docs/evidence/protocolo-evaluacion/R-0-observacion-vs-muestreo-ii.md` (sellado en `abb468f`). El R-0 demuestra la partición del terreno; este asiento la adopta como normativa. Actos separados" (`DECISIONS.md:3317`).

D-075 no fija orden entre las dos sub-cuestiones resultantes ni cierra (ii):

> "No fija orden de trabajo entre ii-auto e ii-med." / "No cierra (ii): ii-auto queda listo para trabajarse de forma autónoma; ii-med queda bloqueado por la divergencia de caracterización, que es su propio acto" (`DECISIONS.md:3329-3330`).

---

## (c) El eje "auto" vs. "med"

El corpus fija el criterio de partición de forma literal, no por interpretación: si la evaluación de la sub-cuestión **enruta o no por el contrato del objeto** (`plan-observable.md` §4.2).

> "**ii-auto** — eje de muestreo/reproducibilidad. Su evaluación no enruta por el contrato del objeto (`plan-observable.md` §4.2) y, por tanto, no requiere la relación C v1↔objeto." (`DECISIONS.md:3323`)

> "**ii-med** — eje de cegado (§6.1 del protocolo, no-filtración del productor). Su evaluación enruta por el contrato del objeto —el contenido evaluado es el objeto— y queda **mediada** por la relación C v1↔objeto" (`DECISIONS.md:3325`).

El artefacto de evidencia que sostiene esta partición (R-0 previo) formaliza el mismo criterio como distinción entre dos unidades del protocolo que no coinciden:

> "**Unidad de observación:** el día... enruta por el objeto. **Unidad de muestreo:** la semana... no invoca el contrato de `days`." (`docs/evidence/protocolo-evaluacion/R-0-observacion-vs-muestreo-ii.md:15-16`)

Ese R-0 mapea cada cláusula operativa del protocolo (`docs/spec/protocolo-evaluacion.md` §4-§6) según si enruta por el objeto, en tabla explícita (`R-0-observacion-vs-muestreo-ii.md:24-33`). Solo §6.1 (no-filtración del productor, `protocolo-evaluacion.md:53`) se marca "Sí — enruta"; el resto de cláusulas de §4/§5 se marcan "No".

**Nota de precisión sobre el alcance normativo de "auto":** el texto normativo de D-075 (`:3323`) nombra explícitamente, como contenido de ii-auto, únicamente el tamaño de muestra N: *"El tamaño de muestra N (§5.6 del protocolo) es el caso limpio: cuenta iteraciones semanales sin invocar la colección `days`."* La extensión de ii-auto a las demás cláusulas de muestreo (§5.5 semillas, §5.8 nivel de agregación, etc.) figura en el R-0 de evidencia (`R-0-observacion-vs-muestreo-ii.md:37-38`, tabla `:24-33`) como terreno demostrado, pero D-075 no repite esa lista completa en su propio texto decisorio — solo cita §5.6 como "el caso limpio". El corpus no declara de forma expresa si D-075 adopta como normativo el mapeo completo de la tabla o solo el caso de §5.6 que menciona literalmente.

---

## (d) La pregunta de ii-auto

El corpus no fija una oración interrogativa exclusiva para ii-auto (a diferencia de la pregunta resuelta que D-075 sí formula explícitamente para el acto de partición mismo, etiquetada "F-δ-Q": `DECISIONS.md:3319`). Lo que el corpus fija de ii-auto es su contenido definicional, no una frase interrogativa dedicada:

> "ii-auto — eje de muestreo/reproducibilidad. Su evaluación no enruta por el contrato del objeto (`plan-observable.md` §4.2) y, por tanto, no requiere la relación C v1↔objeto." (`DECISIONS.md:3323`)

**FORMULACIÓN CANDIDATA — NO FIJADA POR EL CORPUS. La fija el asiento, no este reconocimiento. No consumible como la pregunta de ii-auto.** Reconstruyendo el objeto de esa sub-cuestión a partir de su componente padre (`DECISIONS.md:2271`, "la suficiencia de C v1 para soportar el protocolo de evaluación") restringido al eje que D-075 le atribuye, la pregunta que ii-auto encapsula —tal como el corpus la deja fijada por composición de esas dos citas, sin frase interrogativa literal propia— es: si C v1 basta para soportar las cláusulas de muestreo/reproducibilidad del protocolo (al menos §5.6, `protocolo-evaluacion.md:47`) sin invocar la relación C v1↔objeto.

**Hueco declarado:** no se localiza en el corpus una formulación interrogativa explícita y dedicada a ii-auto (del tipo "¿...?"). Se marca como NO LOCALIZADO en ese sentido estricto; lo anterior es reconstrucción por composición de citas, no una cita única.

---

## (e) Estatus / dependencias / hojas abiertas de ii-auto

Estatus fijado literalmente por D-075:

> "ii-auto es descargable sin resolver la relación C v1↔objeto." (`DECISIONS.md:3332`)
> "ii-auto queda listo para trabajarse de forma autónoma" (`DECISIONS.md:3330`)
> "Sub-cuestión autónoma." (`DECISIONS.md:3323`)

Dependencias: el propio asiento fija la ausencia de precondición — no requiere resolver la relación C v1↔objeto (`:3323`, `:3332`), a diferencia de ii-med, que sí queda "bloqueado por la divergencia de caracterización" (`:3330`). No se localiza en el corpus ninguna otra precondición declarada sobre ii-auto.

Orden de trabajo: expresamente no fijado — "No fija orden de trabajo entre ii-auto e ii-med" (`DECISIONS.md:3329`).

Verificación de que nada posterior a D-075 toca ii-auto: D-075 es el último asiento de `DECISIONS.md` (el archivo termina en la línea 3332, dentro del cuerpo de D-075); un `grep` de "ii-auto" sobre todo el árbol trackeado solo produce coincidencias dentro de D-075 (`DECISIONS.md:3313,3319,3323,3329,3330,3332`). No hay asiento posterior que añada, module o retire estatus, dependencias o hojas abiertas de ii-auto.

Hoja abierta general en la que ii-auto se inserta: el cierre de (ii) como componente de 2.a permanece condicionado a ii-med (`:3330`); el corpus no declara que ii-auto, aunque "descargable", cierre por sí solo el componente (ii) completo.

---

## (f) Naturaleza (frente vs. sub-cuestión)

El corpus fija literalmente la naturaleza de ii-auto como **sub-cuestión**, no como frente:

> "(ii) deja de tratarse como requisito único y se escinde en dos sub-cuestiones con estatus distinto" (`DECISIONS.md:3321`)
> "Sub-cuestión autónoma." (`DECISIONS.md:3323`)

Un `grep` de la palabra "frente" en todo `DECISIONS.md` no produce ninguna coincidencia dentro del cuerpo de D-075 (`:3313-3332`); el rótulo "frente" no se aplica a ii-auto en ningún punto del corpus versionado. Esto es una ausencia demostrada, no una inferencia: el corpus usa consistentemente "sub-cuestión" para ii-auto y no usa "frente" en ese mismo asiento.

No se localiza en el corpus ningún asiento posterior a D-075 que reclasifique ii-auto como frente o que discuta explícitamente la disyuntiva frente/sub-cuestión para ii-auto en particular. Sobre si esa naturaleza de "sub-cuestión" fijada por D-075 podría en el futuro tratarse operativamente como frente propio (por ejemplo, con su propia rama de trabajo) — el corpus no lo declara ni en un sentido ni en otro: **NO LOCALIZADO**.

---

## Huecos NO LOCALIZADO (resumen)

1. **(d):** no existe en el corpus una oración interrogativa explícita y dedicada a ii-auto (distinta de la F-δ-Q de D-075, que es la pregunta sobre si adoptar la partición, no la pregunta interna de ii-auto). La pregunta reportada en (d) es reconstrucción por composición de dos citas, no una cita única.
2. **(f):** el corpus no declara si ii-auto, más allá de ser "sub-cuestión autónoma" (`DECISIONS.md:3323`), podría o debería tratarse como frente de trabajo propio. Ausencia de la palabra "frente" en D-075 confirmada por grep; ningún asiento posterior lo discute.

**Nota de precisión no clasificada como hueco:** la extensión exacta del contenido normativo de ii-auto más allá de §5.6 (ver nota en (c)) depende de si D-075 adopta el mapeo completo de la tabla del R-0 de evidencia o solo el caso de §5.6 que cita literalmente; el corpus no lo distingue de forma expresa.
