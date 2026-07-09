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

| Norma / eslabón | Asiento en DECISIONS.md | Cita | Dónde vive | Clasificación |
|---|---|---|---|---|
| EDITORIAL-D0 | No tiene entrada propia | Mencionado en prosa dentro de D-028, `DECISIONS.md:1163` ("Nace de un D0 read-only (EDITORIAL-D0)...") y `DECISIONS.md:1225` ("Evidencia: EDITORIAL-D0 read-only, ritual verificado...") | Diagnóstico read-only, sin PR ni commit propio | Sin asiento — huella indirecta en D-028 |
| EDITORIAL-D1 | Escribió D-028 (`DECISIONS.md:1160`) | PR #20, merge `a9c0c06364a2c48d1e5fdf82bc0f391c9436f6b3` | `DECISIONS.md` (+80 líneas) | Con asiento (D-028) |
| EDITORIAL-D2 | Sin asiento propio | PR #21, merge `35169c7d4c66da451a9c8e6705e76e0cd137e1a3` | `scripts/phaseB2/exportCuadernoV5.js` (creado, 256 líneas) + tests + runner | Sin asiento — implementación referida genéricamente en D-028 §"generador reproducible" (`DECISIONS.md:1169`), sin nombrar el fichero |
| EDITORIAL-D3 | Sin asiento propio | PR #22, merge `3e76b162919b55fb39b51c76508f6ca87762cf27` | `scripts/phaseB2/importCuadernoV5.js`, `scripts/phaseB2/verduraVocabulary.js` (+`.json`, +tests) | Sin asiento |
| EDITORIAL-D4 | Escribió D-029 (`DECISIONS.md:1239`) | PR #23, merge `70cd8ceb9992f7f4dfb0d726962559c126c86c6a` | `DECISIONS.md` (+80 líneas) | Con asiento (D-029) |
| EDITORIAL-D5 | Sin asiento, sin huella directa | Sesión editorial humana con el cocinero. Sin commit ni PR por naturaleza — no hay salto de numeración entre PR #23 (D4) y PR #24 (D6), consistente con la ausencia de huella | Huella indirecta: las confirmaciones ingeridas en D6 (`dishCompositionConfirmations.json`) | Sin asiento — confirmada factualmente por el propietario del proyecto, no reconstruible desde git |
| EDITORIAL-D6 | Sin asiento propio | PR #24, merge `2bb31c4a7a325e40855ab92bb14aa406e0806e03` — "419 confirmaciones del cocinero" citado literalmente en el mensaje de merge | `scripts/phaseB2/output/dishCompositionConfirmations.json`, `ingestaReport.json` (ingesta real) | Sin asiento |
| C4 | No existe en ningún fichero del repo | — (búsqueda `\bC4\b` sobre `*.js`/`*.md`/`*.json`, 0 resultados) | No vive en ningún sitio | NO-NORMA (ver §3) |
| Frontera D-001 | `DECISIONS.md:14-19` | commit `37d817c30867cfb4240d75ffd5793b6872e61f2c` (2026-06-24, catálogo de 6 anclas de `anchors.js`), anterior a D-001 (2026-06-26) | `src/engine2/dishes/anchors.js` | Anterior a la frontera del registro formal (ver §4) |

## 3. C4: declarada NO-NORMA

`C4` tiene cero apariciones en el repositorio completo (código, tests,
`DECISIONS.md`, comentarios). Se declara **NO-NORMA**: queda retirada de todo
prompt o documento futuro de esta serie.

El proyecto sí usa activamente, dentro de la cadena editorial (D-028 y su
implementación), los criterios `C1`, `C2`, `C2-bis`, `C3`, `C7`, `C8` —
verificados en vivo:

- `C1`: contexto distinto (clusters de `src/engine/__tests__/nutrition.test.js`, no relacionado con la serie editorial).
- `C2` / `C2-bis`: `src/engine2/dishes/compositionResolver.js:47,267`; `scripts/phaseB2/exportCuadernoV5.test.js:322`.
- `C3`: `DECISIONS.md:1289`; `scripts/phaseB2/verduraVocabulary.js:2,36`.
- `C7`: `scripts/phaseB2/exportCuadernoV5.js:271`; `scripts/phaseB2/importCuadernoV5.js:156,170`.
- `C8`: `src/engine2/dishes/tests/compositionResolver.test.js:333`.

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
