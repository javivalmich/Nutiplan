# DECISIONS.md — Registro append-only de decisiones de arquitectura

Invariante de Fase 0. Append-only real: las entradas nuevas van al final; las previas NO se
reescriben ni se borran. Cada entrada registra la causa verdadera con evidencia verificada en
runtime (SHA, archivo:línea o salida de comando). Una decisión vieja no registrada en su día se
añade hoy etiquetada como registro tardío, sin fingir que es de antes.

Formato:
## <ID> — [YYYY-MM-DD] <título>
- Decisión/Hallazgo:
- Evidencia:
- Decide:

## D-001 — [2026-06-26] Instanciación de este registro (deuda de F0)
- Decisión/Hallazgo: el decision log append-only, invariante de F0, nunca se instanció como
  archivo. Se crea ahora en la raíz, junto a CLAUDE.md.
- Evidencia: barrido del repo sin resultado (git grep / git log --all / find / filesystem). Lo
  único llamado decisionLog era el objeto runtime por-semana en buildWeekArc.js (no es esto).
- Decide: Javi.

## D-002 — [2026-06-26] Cierre de la Deuda #5 (carrera entre tripwires)
- Decisión/Hallazgo: la Deuda #5 figuraba abierta; estaba resuelta. Causalidad confirmada por
  estrés en esta corrida (A1.4/A1.5).
- Evidencia: SHA de reubicación = `d764de566c3e01f4b6898aebf5827e51a6c9cda6`
  ("fix(tests): aislar fixtures de tripwire self-test fuera de ENGINE2_ROOT"), A1.3.
  Estrés con fix = 32/32 corridas paralelas, 0 fallos (A1.4).
  Estrés revertido (worktree desechable `../_efimero_a1`, fixtures de vuelta bajo
  `src/engine2/`) = 2/32 corridas fallaron, error `ENOENT ... __selftest_eval_isolation__/violation.js`
  en `tripwire-no-score.test.js:128` (A1.5).
  Causa: fixtures dentro de ENGINE2_ROOT → colisión del escaneo recursivo de un archivo de
  tripwire con el mkdir/rmSync del self-test del otro, corriendo en workers paralelos de
  vitest → ENOENT; el remedio por-subdirectorio de F0 (`bcf8e3a`) era insuficiente porque
  arreglaba el nombre, no el scope.
- Decide: Javi.

## D-003 — [2026-06-26] Corrección D10 al roadmap (Fase 2, tarea 1)
- Decisión/Hallazgo: de los tres helpers que el roadmap daba por reutilizables, dos hechos se
  confirman y uno NO se sostiene bajo grep fresco en esta corrida.
- Evidencia:
  - `computeApetencia`: declarada dentro de `buildPlan()` en `src/engine/buildPlan.js:1171`
    (`function computeApetencia(combo) {`), bajo `export function buildPlan(...)` en línea 26.
    Grep `export.*computeApetencia` en todo `src/`: vacío → no se exporta (A3.1, confirmado).
  - `cuisineExperience`: <PENDING_VERIFICATION — el hecho NO se sostiene>. Grep fresco
    (`grep -rn "cuisineExperience" src/`) en esta corrida muestra que SÍ existe, como campo de
    datos en `src/engine/buildPlan.js` (líneas 1239, 1296, 1557, 1879, 2406, 2449), no como
    helper exportado. La premisa "cuisineExperience inexistente" del roadmap actual es
    incorrecta tal cual está formulada y requiere revisión por Javi antes de reconciliar el
    roadmap (A3.2, NO confirmado).
  - `deriveTempFeelEngine2`: existe en `src/engine2/dishes/derive.js:18`
    (`export function deriveTempFeelEngine2(combo) {`) (A3.3, confirmado).
- Decide: Javi.

## D-004 — [2026-06-26] Tercer tripwire documentado en la constitución
- Decisión/Hallazgo: reflejar en CLAUDE.md el tripwire engine2→engine como invariante.
- Evidencia: existencia confirmada en `src/engine/tests/tripwire-engine2-engine-isolation.test.js`
  (A2.1). Excepción por patrón de nombre en líneas 38-41 (`isExemptFromEngineLegacyIsolation`):
  `*.test.jsx?` o segmento `__selftest_*__`, nunca carpeta `tests/` genérica (A2.2). Control ya
  en repo: líneas 119-129, sobre `src/engine2/dishes/tests/parity.deriveTempFeel.test.js:18`.
  Discriminación producción-vs-test verificada en worktree desechable `../_efimero_a2`: mismo
  import, mismo directorio `src/engine2/dishes/__discrim_check__/` — `violation.js` reportado
  como violación, `violation.test.js` no aparece en la lista (A2.3).
- Decide: Javi.

## D-005 — [2026-06-26] Resolución de D-003 (D10 re-verificado en main)

- **Decisión/Hallazgo:**
  D-003 queda RESUELTA tras verificación fresca en main. La reconciliación del roadmap en
  consecuencia es decisión de Javi (el log solo registra los hechos verificados).

- **Evidencia A1 (cuisineExperience existe en runtime):**
  - definición del campo en el objeto comida: `src/engine/buildPlan.js:1239` →
    `cuisineExperience:cxp,`
  - asignación desde el helper: `src/engine/buildPlan.js:1226` →
    `var cxp = deriveCuisineExperience(combo);`

- **Evidencia A2 (deriveCuisineExperience):**
  - declaración: `src/engine/buildPlan.js:189` → `function deriveCuisineExperience(combo) {`
  - anidamiento en buildPlan(): `export function buildPlan(...)` en línea 26; único
    `function`/`export function` de nivel superior del archivo desde esa línea
    (`grep -n "^function \|^export function " src/engine/buildPlan.js` solo devuelve
    líneas 18 y 26 en todo el fichero); cierre de `buildPlan()` es la última línea del
    archivo, línea 2806 (`}` final, archivo de 2806 líneas). 26 < 189 < 2806.
  - export: `grep -rn "export.*deriveCuisineExperience" src/` → vacío (no exportada)

- **Evidencia A3 (consistencia de helpers):**
  - computeApetencia: declaración `src/engine/buildPlan.js:1171`; export
    `grep -rn "export.*computeApetencia" src/` → vacío (no exportada)
  - deriveTempFeelEngine2: declaración `src/engine2/dishes/derive.js:18` →
    `export function deriveTempFeelEngine2(combo) {`

- **Hechos verificados (sin inferencia añadida):**
  - cuisineExperience existe en runtime.
  - deriveCuisineExperience existe como helper local, no exportado.
  - computeApetencia es local, no exportada.
  - deriveTempFeelEngine2 es implementación propia de engine2.

- **Decide:** Javi.

## D-006 — [2026-06-30] Cajón sopa_crema: plateType corregido, tempFeel pendiente
- Hallazgo: 15 entradas legacy con plateType:"sopa_crema" cuyo cookM real es plancha/crudo/guisado
  (oracle en A.5). Daño colateral: derive.js:22 deriva tempFeel "muy_caliente" por tmpl==='sopa_crema',
  afectando incluso a los crudo.
- Resuelto en este checkpoint: plateType corregido vía legacyCombos.plateTypeCorrections.js (seam nuevo,
  NO legacyCombos.normalizations.js — ese archivo solo cubre colisiones de identidad, ver B.0 de este
  checkpoint), 14 entradas corregidas + enum cerrado (schema.js) + tripwire.
- Pendiente (deuda): la tempFeel "muy_caliente" en los crudo/plancha NO se corrige aquí — su raíz es
  tmpl:"sopa_crema", y arreglarla diverge la paridad de deriveTempFeel o arrastra la derivación de
  estructura (blast radius mayor). Se aborda en checkpoint aparte.
- Decide: Javi.

## D-007 — [2026-06-30] Enum plateType a 24 + re-derivación 242 + freeform en anotación
- Decisión: enum a 24 (rename pescado_salsa→en_salsa; add pescado_plancha, airfryer, crudo). Re-derivación de los
  178 (pescado+plancha→pescado_plancha con precedencia sobre la genérica de PR1; "X en crudo"→crudo) y fusión
  editorial de los 64 freeform en el xlsx.
- Regla de precedencia: la regla específica (pescado+plancha, crudo) gana a la genérica (sopa_crema→
  plancha_verdura/ensalada de PR1) — implementada en legacyCombos.plateTypeCorrections.js evaluando
  PESCADO_PLANCHA_CORRECTIONS/CRUDO_CORRECTIONS por identityKey antes del fallback genérico por cookM+P.
- Casos a revisión humana: línea 121 (atún, tmpl caliente_clasico, cookM crudo, base arroz — contradictorio,
  sin regla fija) y, en el lote freeform, bibimbap_ternera_huevo (dudoso pese a sugerir salteado_wok),
  gyozas_verduras y papas_mojo_pollo (plateType libre sin ninguna regla de mapeo) → reviewPlateType:true.
- Nota: freeform entra como filas EDITORIALES (scripts/phaseB2/output/freeform.editorial.json, 64 filas,
  discriminador propio identity.id); su integración estructural (slug↔tupla) sigue diferida a Paso C.
- Decide: Javi.

## D-008 — [2026-07-01] Bug del generador de nombres (cookM "crudo" ignorado) + 3 combos re-nombrados
- Hallazgo: `suggestNameFromTuple()` (scripts/phaseB2/exportCocinero.js), rama `caliente_clasico`, construye
  `methodChar` con un ternario que solo cubre horno/guisado/salteado/vapor/revuelto/tortilla; cualquier otro
  cookM (incluido "crudo") caía en el `else` final ("a la plancha") por defecto silencioso — no una decisión.
  El diccionario COOK_LABEL ya tenía una entrada para "crudo" ("en conserva"), pero se calculaba en la variable
  `cookDesc` y nunca se usaba (código muerto).
- Blast radius verificado (A.1): de los 115 combos `caliente_clasico`, solo los 3 con cookM:"crudo" caían mal
  (el resto de valores no cubiertos por el ternario, "plancha", coincide por casualidad con el texto correcto).
  Ningún otro cookM afectado en todo el universo legacy (184 combos comparados).
- Decisión (Javi): cookM:"crudo" se lee "en crudo" en el nombre (no "en conserva": engaña, crudo es general,
  no solo lata). Fix: se añadió el caso explícito al ternario de `methodChar`.
- 3 combos re-nombrados (identityKey): atún/arroz/tomate/crudo (Nº38, caso 121 de D-007 — plateType ratificado
  como "bowl" vía RESOLVED_CORRECTIONS en legacyCombos.plateTypeCorrections.js, promovido por primera vez),
  atún/tomate/vinagreta y atún/lechuga/pepino (ambos plateType "ensalada", YA estaban en dishes.json en main
  con el nombre erróneo — corregidos in place, solo el campo nombre, sin tocar sus otros campos).
- Control de discriminación: exactamente esos 3 nombres cambian (verificado comparando el nombre promovido
  contra el "Nombre sugerido" congelado del v4.xlsx para los 178 scaffold); los 175 restantes son idénticos
  byte a byte al xlsx.
- dishes.json pasa de 177 a 178. antiTodo.test.js pasa a VERDE (0 pendientes) sin necesidad de editar su
  semántica — la aserción siempre fue `expect(pendientes).toEqual([])`.
- Decide: Javi.

## D-009 — [2026-07-02] Paso C: promoción de 63 combos freeform a dishes.json (178→241)
- Decisión/Hallazgo: se integran estructuralmente los 64 combos de `src/data/FREEFORM_COMBOS.js`
  (diferido desde D-007) mediante un JOIN por título normalizado (minúsculas + NFD sin diacríticos +
  sin puntuación + espacios colapsados) contra las filas `fuente=freeform` de
  `scripts/phaseB2/input/Anotacion_cocinero_242_v4.xlsx`, hoja `Platos`. Se promueven únicamente
  `rol`, `batchable`, `leftoverQuality`, `shelfLifeDays`, `energiaCocina` desde el xlsx;
  `dish.id = identity.id` y `dish.nombre = identity.title` vienen directos de FREEFORM_COMBOS (no del
  xlsx). `bol_fruta_yogur` queda excluido: `behavior.slot=["Al"]` no tiene equivalente en el
  vocabulario legacy de `momento` ({comida,cena}).
- Evidencia:
  - Auditoría de join (`scripts/diag/check_title_join.mjs`, descartable): 64 filas xlsx freeform, 64
    combos, 0 ambiguos, 0 sin-match, cobertura 1:1 exacta.
  - Implementación: `scripts/phaseB2/freeformPromote.js` (`normalizeTitle`, `joinFreeformXlsx`,
    `buildFreeformDishes`), runner `scripts/phaseB2/runFreeformPromote.js`.
  - `deriveMomentoFreeform` (`src/engine2/dishes/deriveFreeform.js`): slot `"C"/"Ce"` → `comida/cena`;
    slot `"Al"` lanza (sin mapeo) — por eso `bol_fruta_yogur` se excluye ANTES de llamarla, no dentro.
  - Ejecución real: `node scripts/phaseB2/runFreeformPromote.js` → "PROMOCION OK: 178 + 63 = 241
    platos escritos". `dishes.json`: 241 entradas, 241 ids únicos (verificado en
    `tripwire-platetype-enum.test.js`, describe "dishes.json real (241)").
  - Idempotencia (v4): dos ejecuciones independientes desde el mismo `dishes.json` de 178 producen
    salida byte-idéntica (`diff` vacío, 3399 líneas ambas). Una segunda ejecución sobre el `dishes.json`
    ya de 241 aborta por el guard de colisión de ids sin escribir nada (archivo sin cambios).
  - `npm test`: 51 archivos / 522 tests, VERDE. `antiTodo.test.js` (lee `dishes.scaffold.json`, ajeno a
    esta promoción) sigue VERDE sin tocar su semántica.
- Decide: Javi.

## D-010 — [2026-07-02] FREEFORM_TEMPFEEL_OVERRIDES + corrección del gap bibimbap post-gate
- Decisión/Hallazgo: se crea `deriveTempFeelFreeform` (`src/engine2/dishes/deriveFreeform.js`), función
  de derivación específica para freeform (F, CLAUDE.md), paritaria en contrato pero NO en
  implementación con `deriveTempFeelEngine2` del scaffold (que queda intacta). Regla: consulta PRIMERO
  `FREEFORM_TEMPFEEL_OVERRIDES` (por `identity.id`, para cualquier plateType — F.3); si no hay entrada
  y el plateType final (post-remapeo D-011) pertenece a `{sopa_crema, bowl, tortilla}`, LANZA (F.2, sin
  valor por defecto); en cualquier otro caso aplica la derivación general F.1 por plateType, o lanza si
  tampoco hay regla ahí.
- Corrección registrada como parte de esta misma causa: la tabla de overrides ratificada en sesión
  (17 obligatorias + 1 excepción F.3 = 18) se definió sobre el plateType LIBRE del xlsx, mientras que
  F.2 exige aplicarla sobre el plateType FINAL, post-remapeo D-011. `bibimbap_ternera_huevo` remapea a
  `bowl` (D-011) pero el ANEXO original no traía fila para "Bibimbap..." — el tripwire de este mismo
  checkpoint lo detectó (`deriveTempFeelFreeform` habría lanzado al promoverlo, sin valor por defecto
  posible). Javi confirmó el gap como error de la sesión (no del repo) y ratificó
  `bibimbap_ternera_huevo → caliente, pendienteCocinero:false`. La tabla queda en 18 entradas: 9
  `sopa_crema` + 5 `bowl` + 3 `tortilla` (las 17 obligatorias) + 1 excepción F.3
  (`ensalada_lentejas_feta`, plateType `ensalada`, ensalada TIBIA — la derivación general daría "frio",
  incorrecto).
- Evidencia:
  - Auditoría de cobertura (`scripts/diag/audit_overrides_coverage.mjs`, descartable): exactamente 17
    combos (excluyendo `bol_fruta_yogur`) tienen plateType final en `{sopa_crema, bowl, tortilla}`;
    antes de la corrección el ANEXO cubría 16 (faltaba `bibimbap_ternera_huevo`, mapeado a `bowl` por
    D-011).
  - Resolución de los 17 nombres del ANEXO a `identity.id` real por título normalizado
    (`scripts/diag/resolve_overrides.mjs` + `resolve_overrides2.mjs`, descartables): 17/17 resuelven a
    exactamente 1 combo (algunos por igualdad normalizada exacta, otros porque el ANEXO usa el título
    abreviado del xlsx en vez del título literal de FREEFORM_COMBOS — resueltos por coincidencia de
    subsecuencia/conjunto de palabras, sin ambigüedad en ningún caso).
  - `deriveFreeform.test.js`: 6 pendienteCocinero:true confirmados
    (`crema_calabacin_queso_huevo`, `sopa_miso_tofu`, `hummus_pita_pollo`, `buddha_bowl_completo`,
    `tortilla_patatas_completa`, `ensalada_lentejas_feta`).
  - r2 (falsable, CLAUDE.md): eliminar temporalmente `gazpacho_huevo_atun` de
    `FREEFORM_TEMPFEEL_OVERRIDES` → `deriveTempFeelFreeform` lanza
    ("exige entrada en FREEFORM_TEMPFEEL_OVERRIDES (F.2) y no la tiene"), cascada roja en
    `freeformPromote.test.js` y `tripwire-platetype-enum.test.js` (6 tests). Revertido: `npm test`
    verde (51/51 archivos, 522/522 tests) antes de continuar.
- Decide: Javi.

## D-011 — [2026-07-02] Remapeos de plateType por identity.id (papas_mojo_pollo, bibimbap_ternera_huevo, gyozas_verduras)
- Decisión: `FREEFORM_PLATE_TYPE_ID_OVERRIDES` (`scripts/phaseB2/freeformEditorial.js`), tabla por
  `identity.id` (no por plateType libre, para que una futura entrada freeform con el mismo libre no
  herede la resolución sin ratificación propia). Gana sobre `FREEFORM_PLATE_TYPE_MAP` genérica y sobre
  `REVISION_EXPLICITA`: `papas_mojo_pollo` (libre `patatas_canarias`) → `caliente_patata`;
  `bibimbap_ternera_huevo` (libre `bibimbap`) → `bowl`; `gyozas_verduras` (libre `gyozas`) → `masa`.
  `REVISION_EXPLICITA` queda vacía (antes contenía `'bibimbap'`, bloqueo ya innecesario: la resolución
  por id tiene precedencia).
- Evidencia:
  - `resolveFreeformPlateType()` implementa la precedencia (0. override por id, 1. tabla genérica salvo
    bloqueo, 2. sin regla → plateType libre intacto + `reviewPlateType:true`).
  - `buildFreeformEditorialRows()` refactorizada para usar `resolveFreeformPlateType()` (fuente única,
    sin lógica duplicada); `freeformEditorial.test.js` actualizado: las 64 filas resuelven sin
    `reviewPlateType` (antes 61 mapeadas + 3 pendientes), con tests de discriminación que verifican que
    el override por id gana sobre la tabla genérica y sobre `REVISION_EXPLICITA`.
  - `scripts/diag/verify_full_derivation.mjs` (descartable): las 63 entradas promovibles (excluyendo
    `bol_fruta_yogur`) resuelven `plateType` + `tempFeel` + `momento` sin lanzar, con
    `reviewPlateType` siempre `false`.
- Decide: Javi.
