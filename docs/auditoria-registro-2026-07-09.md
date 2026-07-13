# Auditoría del registro — 2026-07-09

## 1. Objeto y método

Auditoría del registro documental (`DECISIONS.md`) contra la cadena editorial
EDITORIAL-D0..D6, más tres normas tratadas hasta ahora como contrato vigente
sin asiento propio en el registro formal. Read-only: no modifica código de
producción ni `DECISIONS.md`. Ejecutada el 2026-07-09 sobre
`a6921cafef8bd8d919165bcd940a81e1710d7cae` (798/798 tests, 68 archivos).

Método: cada afirmación estructural de este informe fue re-verificada contra
el estado real del repositorio (`git log`, `git show`, `grep`) en el momento
de escribir este documento, no asumida a partir de auditorías o memorias
previas.

## 2. Tabla de hallazgos

Vocabulario de clasificación (exactamente uno de los tres, sin variantes):
`ASENTADA` (existe entrada propia en DECISIONS.md para esa norma o ese
eslabón — que el eslabón haya *producido* una entrada no lo hace ASENTADA,
el eslabón y su producto son objetos distintos), `SIN ASIENTO, EN USO` (no
hay entrada, pero la norma se aplica o aparece como contrato en algún punto
del repo, con cita archivo:línea), `SIN ASIENTO, SIN USO` (no hay entrada ni
aparición en ningún sitio).

| Norma / eslabón | Asiento en DECISIONS.md | Cita | Dónde vive | Clasificación |
|---|---|---|---|---|
| EDITORIAL-D0 | No tiene entrada propia | `DECISIONS.md:1163` ("Nace de un D0 read-only (EDITORIAL-D0)...") y `DECISIONS.md:1225` ("Evidencia: EDITORIAL-D0 read-only, ritual verificado...") | Diagnóstico read-only, sin PR ni commit propio; mencionado en prosa dentro de D-028 | SIN ASIENTO, EN USO |
| EDITORIAL-D1 | No tiene entrada propia (produjo D-028, no es lo mismo) | `DECISIONS.md:1160` (cabecera de D-028); PR #20, merge `a9c0c06364a2c48d1e5fdf82bc0f391c9436f6b3` | El eslabón D1 produjo la entrada D-028; eslabón y producto son objetos distintos | SIN ASIENTO, EN USO |
| EDITORIAL-D2 | No tiene entrada propia | `scripts/phaseB2/exportCuadernoV5.js:1`, `exportCuadernoV5.test.js:1`, `runExportCuadernoV5.js:1` (comentario de cabecera literal "EDITORIAL-D2") | PR #21, merge `35169c7d4c66da451a9c8e6705e76e0cd137e1a3` | SIN ASIENTO, EN USO |
| EDITORIAL-D3 | No tiene entrada propia | `scripts/phaseB2/importCuadernoV5.js:1`, `importCuadernoV5.test.js:1`, `runImportCuadernoV5.js:1`, `verduraVocabulary.test.js:1` (comentario de cabecera literal "EDITORIAL-D3") | PR #22, merge `3e76b162919b55fb39b51c76508f6ca87762cf27` | SIN ASIENTO, EN USO |
| EDITORIAL-D4 | No tiene entrada propia (produjo D-029, no es lo mismo) | `DECISIONS.md:1239` (cabecera de D-029); PR #23, merge `70cd8ceb9992f7f4dfb0d726962559c126c86c6a` | El eslabón D4 produjo la entrada D-029; eslabón y producto son objetos distintos | SIN ASIENTO, EN USO |
| EDITORIAL-D5 | No tiene entrada propia | — (cero apariciones literales de "EDITORIAL-D5" en el árbol versionado, `git grep`) | Sesión editorial humana con el cocinero, confirmada factualmente por el propietario, fuera del repo; sin salto de numeración entre PR #23 (D4) y PR #24 (D6), consistente con la ausencia de huella textual propia | SIN ASIENTO, SIN USO |
| EDITORIAL-D6 | No tiene entrada propia | `scripts/phaseB2/output/dishCompositionConfirmations.json` (241 platos, 419 campos confirmados, verificado en vivo); `src/engine2/dishes/compositionResolver.js:217,225-228,247,253-256` (consumo de `fuenteEditorial.confirmed`) | PR #24, merge `2bb31c4a7a325e40855ab92bb14aa406e0806e03` — ingesta real ejecutada | SIN ASIENTO, EN USO |
| C4 | No tiene entrada propia | — (cero apariciones de texto) | No vive en ningún sitio del árbol versionado; ver §3 | SIN ASIENTO, SIN USO |
| Congelación de `exportCocinero.js` | No tiene entrada propia | `scripts/phaseB2/exportCuadernoV5.js:9-19` | Comentario de deuda registrada en el generador v5; condición temporal ("hasta la ingesta", eslabón 4 de D-028) vencida con D6 (PR #24, merge `2bb31c4a7a325e40855ab92bb14aa406e0806e03`) | SIN ASIENTO, EN USO |
| `exportCuadernoV5.js` (nombre concreto del fichero) | No aparece por nombre en DECISIONS.md (`git grep exportCuadernoV5 -- DECISIONS.md` → 0 resultados) | `scripts/phaseB2/exportCuadernoV5.js` (256 líneas); `scripts/phaseB2/runExportCuadernoV5.js:1` | D-028 lo describe genéricamente como "generador reproducible" (`DECISIONS.md:1169`) sin nombrarlo | SIN ASIENTO, EN USO |
| Conjunto de 6 anclas (`anchors.js`) | No tiene entrada propia (creación anterior a D-001, ver §4) | `src/engine2/dishes/anchors.js` (commit `37d817c30867cfb4240d75ffd5793b6872e61f2c`); `DECISIONS.md:767`, `DECISIONS.md:824` (D-023); `DECISIONS.md:1188` (D-028) | Referenciado como contrato de datos en D-023 y D-028, sin entrada dedicada al catálogo en sí | SIN ASIENTO, EN USO |

## 3. C4: declarada NO-NORMA

`C4` tiene cero apariciones de texto en el árbol versionado completo
(`git grep -I`, sin filtro de extensión). La búsqueda cruda sin `-I`
(`git grep -oE "\bC4\b"`) devuelve un único acierto: un falso positivo binario
en `src/assets/hero.png` — una coincidencia de bytes sin significado textual,
descartada al excluir binarios. Se declara **NO-NORMA**: queda retirada de
todo prompt o documento futuro de esta serie.

El proyecto sí usa activamente, dentro de la cadena editorial (D-028 y su
implementación), los criterios `C2`, `C2-bis`, `C3`, `C7`, `C8` — verificados
en vivo:

- `C2` / `C2-bis`: `src/engine2/dishes/compositionResolver.js:47,267`; `scripts/phaseB2/exportCuadernoV5.test.js:322`.
- `C3`: `DECISIONS.md:1289`; `scripts/phaseB2/verduraVocabulary.js:2,36`.
- `C7`: `scripts/phaseB2/exportCuadernoV5.js:271`; `scripts/phaseB2/importCuadernoV5.js:156,170`.
- `C8`: `src/engine2/dishes/tests/compositionResolver.test.js:333`.

Nota aparte: `C1` también aparece en el repo, pero en un contexto distinto y
no relacionado con la serie editorial — clusters de casuística en
`src/engine/__tests__/nutrition.test.js:120-160` (p.ej. "P1+C1 sinCambio").
No pertenece a la serie C1..C8 de la cadena editorial; se anota aquí solo
para no dejarlo fuera de la búsqueda, no porque forme parte del contrato
auditado.

`C4` nunca existió en esa serie.

## 4. Frontera documental

Regla ratificada, enunciado literal: **a partir de D-001 existe registro
formal; antes de D-001 existieron decisiones relevantes cuya trazabilidad
completa no forma parte del registro, y no se reconstruyen selectivamente.**

Ejemplo verificado: el criterio de las 6 anclas de `anchors.js`
(commit `37d817c`, 2026-06-24) es anterior a D-001 (2026-06-26,
`DECISIONS.md:14`) y no se retro-asienta.

Rationale: evitar un registro de dos velocidades donde parte del pasado
adquiere autoridad reconstruida mientras otra parte queda fuera sin
justificación distinguible. D-001 es la frontera del registro formal.

## 5. Derivaciones

Lo que se asienta en PR-2 (pendiente de ratificación de este informe):

- **D-030** — reconstrucción documental de la cadena editorial completa
  (EDITORIAL-D0..D6), marcada explícitamente como reconstrucción con fecha
  2026-07-09.
- **D-031** — entrada propia para EDITORIAL-D6 (ingesta real de las 419
  confirmaciones), separada de D-030 por ser el hito que materializa el
  principio "confirmado entra al motor; propuestas editoriales nunca".

Lo que va a roadmap, sin decidirse en esta sesión:

- El futuro de la cadena legacy (`exportCocinero.js` + `importAnotacion.js` +
  `runImportAnotacion.js` + `Anotacion_cocinero_242_v4.xlsx`), cuya condición
  de congelación temporal ("hasta la ingesta", comentario
  `scripts/phaseB2/exportCuadernoV5.js:9-19`) ya venció con D6.
- Los cuatro directorios/ficheros untracked preexistentes
  (`scripts/diag/`, `scripts/phaseB2/input/`,
  `scripts/phaseB2/output/Anotacion_cocinero_242_v4.xlsx`,
  `scripts/phaseB2/output/Anotacion_cocinero_v5.xlsx`).

Ninguna de estas dos líneas se desarrolla en este documento.
