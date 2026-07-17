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

## D-012 — [2026-07-02] Deuda: warning de proteína matemáticamente inerte (motor viejo)
- Decisión/Hallazgo: el warning "[AJUSTE] Proteína estimada insuficiente" en `validateWeek` compara
  `estProtein = 100×proteinMult` (con `proteinMult` acotado por reglas de estrategia, tope observado
  115) contra un umbral fijo `<130`. Con `estProtein` máximo 115 < 130 en todas las estrategias, el
  warning dispara SIEMPRE, para toda estrategia — no es señal, es ruido constante. El objetivo real
  (`targetProtein`, vía `calcMacros`) ya está calculado en `buildPlan()` (línea 57) y por tanto en
  scope de clausura de `validateWeek` (línea 2508), pero el chequeo de proteína no lo usa.
- Evidencia:
  - `src/engine/buildPlan.js:2739-2748`: bloque completo, con comentario propio ya fechando el
    placeholder ("PLACEHOLDER conocido (Fase 1) ... Macros reales → Fase 5 (reconcile)").
  - `src/engine/buildPlan.js:57`: `const targetProtein = calcMacros(targetKcal,profile.weight,
    profile.goal,profile.activity,strategy).protein;` — calculado, sin conexión con el warning de
    la línea 2746.
  - `validateWeek` declarada en `src/engine/buildPlan.js:2508`, dentro de `buildPlan()` (abre en
    línea 26, cierra en línea 2806) → `targetProtein` está en su scope de clausura.
- Decide: no se toca el motor viejo (congelado, CLAUDE.md invariante 5). Explica el 100% de
  `weekWarnings≥1` observado en `gate4_closure`. Resolución diferida a Fase 5 (reconcile), ya
  fechada en el propio comentario del código.

## D-013 — [2026-07-02] Deuda: chequeo de kcal ciego a targetKcal/baseScale (motor viejo)
- Decisión/Hallazgo: el chequeo de calorías diarias en `validateWeek` sale de `PLATE_KCAL`, tabla
  estática por `plateType` (`src/engine/buildPlan.js:2611-2699`), mientras que las raciones reales de
  cada plato escalan por `baseScale` (rango observado 0.88-1.58) en función de `targetKcal` del
  perfil. Consecuencia: falsos negativos en superávit (un plato con `baseScale` alto se contabiliza
  con el kcal estático de tabla, más bajo que el real) y falsos positivos en déficit (mismo mecanismo
  a la inversa).
- Evidencia: `src/engine/buildPlan.js:2611` (`var PLATE_KCAL = {`) hasta `2699` (cierre de la tabla,
  última entrada `bol_fruta: 470,`); el chequeo de patrón de kcal diaria/consecutiva que consume esta
  tabla es el mismo bloque de `validateWeek` que produce los warnings de las líneas 2725-2737.
- Decide: no se toca el motor viejo (congelado). Misma resolución que D-012 — Fase 5 (reconcile), que
  ya tiene como mandato calcular macros/raciones reales en vez de heurísticas estáticas.

## D-014 — [2026-07-02] Deuda: asimetría estructural de scoring contra freeform (motor viejo)
- Decisión/Hallazgo: `inflateFreeFormForPool` (`src/engine/buildPlan.js:1262-1310`, bloque de retorno
  en `1277-1309`) anula explícitamente (`null`) los campos `facil`, `saciante`, `sauce`, `cookM`,
  `veggie`, `culinaryStyle`, `cuisineExperience`, `tempFeel`, `apetencia` para todo combo freeform que
  entra al pool de `smartPick` — el propio comentario del bloque lo declara intencional ("NO
  introducir inferencias nuevas aquí", líneas 1246-1261). En cambio `comboToPoolEntry`
  (`src/engine/buildPlan.js:1211-1244`), el camino legacy, calcula y puebla esos mismos campos vía
  `computeApetencia`, `deriveCuisineExperience`, `deriveTempFeel` (líneas 1225-1227). Como esos campos
  alimentan bonus favorables en el scoring de `smartPick`, solo el legacy puede cobrarlos — asimetría
  estructural, no accidental.
- Evidencia: causa trazada de los 30/64 combos muertos observados en `gate2b` (T10b). Confirmado por
  lectura directa de ambas funciones en `src/engine/buildPlan.js` (líneas citadas arriba), sin
  necesidad de instrumentación adicional.
- Decide: NO es una feature a preservar en la migración. `engine2` resuelve esta asimetría
  arquitectónicamente (sin scoring numérico, CLAUDE.md invariante 1); el diseño de selección de
  Fase 4 en adelante debe conocer esta causa para no reproducirla por descuido al portar heurísticas
  del motor viejo como referencia.

## D-015 — [2026-07-02] Deuda: drift de la suite de medición (`analysis/gate2_measure.test.js`, `analysis/gate4_protein_guard.test.js`)
- Decisión/Hallazgo: dos problemas independientes en la suite de medición (no en el motor de
  producción):
  1. `gate2_measure.test.js:78` y `gate4_protein_guard.test.js:33` mantienen copias locales
     hardcodeadas de `WEEKLY_CAP` con los valores previos al commit `ae6b9e3` (pescado 2→3,
     legumbre 2→4, ave 4→3) — ambas copias siguen en pescado:2, legumbre:2, ave:4. La comparación
     T4 de `gate2_measure` (choque con `WEEKLY_CAP`) es inválida para pescado/legumbre/ave: mide
     contra un cap que ya no rige en producción.
  2. `gate2_measure.test.js:434,462` construye un flag `__noSlotHint` que se pasa a `buildPlan` para
     intentar desactivar `slotBonus` en un stage de comparación A/B (Stage 3). `buildPlan.js` nunca
     lee `__noSlotHint` — el `slotBonus` real (`src/engine/buildPlan.js:1778-1781,1904`) depende solo
     de `slotHint`, sin gate por ese flag. La conclusión A/B de ese stage es artefacto: ambas ramas
     ejecutan la misma lógica de producción dos veces.
- Evidencia:
  - `WEEKLY_CAP` de producción vigente: `pescado:3, legumbre:4, ave:3` (commit `ae6b9e3`, "fix(engine):
    BUG 5 — nuevos valores de WEEKLY_CAP").
  - `analysis/gate2_measure.test.js:78`: `const WEEKLY_CAP = { pescado: 2, marisco: 1, legumbre: 2,
    ternera: 2, cerdo: 2, ave: 4 };` — valores pre-`ae6b9e3`.
  - `analysis/gate4_protein_guard.test.js:33`: `const WEEKLY_CAP = {pescado:2, marisco:1, legumbre:2,
    pasta:2, ternera:2, cerdo:2, ave:4};` — mismo drift.
  - `grep -rn "__noSlotHint" src/` → vacío: el flag no existe en ningún archivo de producción bajo
    `src/`, solo en `analysis/gate2_measure.test.js` (líneas 434, 462).
- Decide: no se toca la suite de medición en este PR (fuera de scope — solo documental). Resolución:
  PR de sincronización de gates, próximo, con fork pendiente de ratificar sobre la sonda
  `__noSlotHint` (si se implementa de verdad en el motor o se retira del gate).

## D-016 — [2026-07-03] Ratificación de la sonda __noSlotHint: opción (a), flag permanente default-off
- Decisión/Hallazgo: de las dos resoluciones abiertas por D-015 para `__noSlotHint`, se ratifica la
  opción (a) — flag permanente `opts.__noSlotHint` en `buildPlan.js`, default ausente/false, que
  condiciona los dos canales reales del hint de slot: el bonus suave (`src/engine/buildPlan.js:1786-1789`)
  y la inyección forzosa al top-N (`injectedHint`, `src/engine/buildPlan.js:2075-2083`). Se descarta la
  opción (b) — sonda temporal a revertir tras la medición — por ser exactamente el protocolo que ya
  produjo la medición inválida sin detección que D-015 documentó (el comentario de
  `gate2_measure.test.js` prometía una sonda "temporal" que nunca se insertó, y Stage 3 corrió dos
  veces la misma lógica de producción sin que nadie lo notara).
- Evidencia:
  - Con el flag ausente/false, `opts.__noSlotHint !== true` evalúa igual que la condición previa
    (`if(slotHint)` / `if(slotHint && slotHint.protein)`) — cambio de comportamiento nulo por
    construcción, no solo verificado empíricamente.
  - Paridad confirmada sin regenerar snapshots: `buildPlan.baseline.test.js` + `buildPlan.snapshot.test.js`
    + `humanScore.baseline.test.js` → 3 archivos, 59 tests, verde, `.snap` intactos.
  - Con el flag activo (`gate2_measure.test.js` Stage 3, escenario B), el efecto causal del slotHint
    ahora es real y medible: Δ(B−A) por día = Lunes −73.6%, Martes −51.2%, Miércoles −29.2%,
    Jueves −8.2%, Viernes −0.4%, Domingo −0.4% (Sábado = libre, sin categoría de slot). Antes de esta
    sesión el flag no existía en producción, así que Stage 3 medía dos veces el mismo escenario A sin
    saberlo.
  - `npm test`: 51 archivos / 522 tests, VERDE (incluye `analysis/gate2_measure.test.js` y
    `analysis/gate4_protein_guard.test.js`, ambos parte del run por defecto).
- Decide: Javi (ratificación de sesión 2026-07-02, ejecutada en fix/sync-gates-medicion 2026-07-03).

## D-017 — [2026-07-03] Fase 4, Componente P0 (infraestructura del walk): decisiones ratificadas
- Decisión/Hallazgo: sesión de implementación de F4-P0 en rama `feature/f4-p0-infra` (desde
  `main` en `eb213df`). Cuatro componentes: `loadCatalog`, `MemoryStore` en memoria, `WeeklyTargets`,
  `validateProfile`. Se ratifican seis decisiones de esta sesión, causas literales del prompt
  2026-07-03:
  1. **Frontera informacional P1/P2**: `validateProfile` (`src/engine2/contracts/profile.js`)
     reconoce ÚNICAMENTE `trainingDays` — el campo consumido hoy por P1. `WeeklyTargets`
     (`src/engine2/contracts/weeklyTargets.js`) es un contrato/shape declarado en P0 SIN consumidor:
     su ratificación de valores de negocio queda para P2. Ningún placeholder de campo sin consumidor
     en ninguno de los dos.
  2. **Catálogo congelado**: `loadCatalog` (`src/engine2/dishes/loadCatalog.js`) lee
     `scripts/phaseB2/output/dishes.json` (ruta actual, ratificada como canónica para este
     checkpoint — la mudanza a ruta de producto es asiento futuro), valida cada plato con
     `validateDish` (`schema.js`, reutilizado sin duplicar) y devuelve el catálogo congelado en
     profundidad (`Object.freeze` recursivo sobre array, platos y campos anidados, p. ej. `momento`).
  3. **`getWeek` de semana no guardada → `null`**: la ausencia es valor del dominio, no error.
  4. **`saveWeek` sobre semana existente → sobreescribe**: último gana, sin merge ni versión previa
     retenida.
  5. **Desdoble `WeeklyTargets`**: nivel 1 = contrato/shape (`pescado`, `legumbre`, `verduraDiaria`,
     semántica de SUELO/CUOTA — nunca techo, explícitamente no es `WEEKLY_CAP`). Nivel 2 =
     `DEFAULT_WEEKLY_TARGETS` congelado con valores provisionales (`pescado:2, legumbre:2,
     verduraDiaria:1`) — ratificación de negocio pendiente para P2. Recordatorio F5: revisar
     legumbre a 4 (AESAN).
  6. **`profile` solo-consumidores-P1**: ver punto 1 — `validateProfile` no valida ningún campo que
     P1 no consuma todavía.
- Evidencia:
  - D0 verificado antes de tocar código: `main` = `eb213dfe2ab356f4f3f2143229be40ecf5159f0c`, marcador
    "Fase actual: 4" en `CLAUDE.md:58`, catálogo 241 platos (`node -e` sobre
    `scripts/phaseB2/output/dishes.json`), suite 51 archivos / 522 tests VERDE, `contract.js`
    solo-firmas (4 funciones, cada una `throw new Error(... 'sin implementación')`).
  - Falsables demostrados ROJO→revert→VERDE con mutación deliberada sobre copia efímera o sobre el
    módulo en construcción (nunca sobre artefactos reales): `loadCatalog` r1 (campo ausente), r2 (id
    duplicado), r3 (freeze superficial vs recursivo); `inMemoryStore` v2 (aislamiento entre usuarios),
    v3 (aislamiento entre semanas); `validateProfile` r1+r2 (vocabulario fuera de rango, no-array).
  - Suite final: 55 archivos / 546 tests VERDE (522 base + 24 nuevos: 8 `loadCatalog` + 6
    `inMemoryStore` + 4 `weeklyTargets` + 6 `profile`).
  - Tripwires verdes sobre los 4 módulos nuevos (escaneo recursivo automático de `src/engine2/`, sin
    tocar su configuración): `tripwire-no-score.test.js`, `tripwire-eval-isolation.test.js`,
    `tripwire-engine2-engine-isolation.test.js`, `tripwire-reverse-isolation.test.js` → 4 archivos,
    32 tests, VERDE.
  - `git diff --stat` entre `main` y `feature/f4-p0-infra` sobre `src/engine/**`,
    `src/engine2/skeleton/**`, `src/engine2/dishes/{schema,derive,deriveFreeform,assemble,identity,
    legacyCombos*}.js`, `scripts/**`, `dishes.json` → vacío (intactos).
- Decide: Javi (ratificación de sesión 2026-07-03, ejecutada en `feature/f4-p0-infra`).

## D-018 — [2026-07-03] Fase 4, Componente P1 (walk): paquete completo de decisiones ratificadas
- Decisión/Hallazgo: sesión de planificación 2026-07-03 ratifica el paquete completo de decisiones
  P1 antes de implementar, causas literales del encargo de sesión (no reconstruidas):
  1. **Partición P1a/P1b**: P1a (esta rama, `feature/f4-p1a-expansion`) implementa
     `expandWeekArc` — expansión de `weekArc.beats[]` (7, uno por día) a 14 huecos
     (comida+cena) y la colocación de ancla+sobras vía cascada de momento. P1b (PR siguiente,
     contra este mismo asiento) selecciona los platos libres de los huecos que P1a deja abiertos
     (rotativo/capricho) — fuera de alcance de P1a.
  2. **Cadena activa 1-3-6 con posiciones 2/4/5 reservadas**: de la cadena de pasos declarada para
     P1, los eslabones 2, 4 y 5 quedan reservados (composición, composición, modelo-de-usuario) —
     no se implementan en ningún PR de esta sesión, ni P1a ni P1b.
  3. **Cascada de momento con eslabón 0**: ver cabecera de `src/engine2/walk/expandWeekArc.js` —
     eslabón 0 (ancla en cookDay: momento único → directo, momento ambos → desempate RNG
     `::walk`), eslabón 1 (sobra momento único → directo), eslabón 2 (sobra momento ambos → hereda
     el momento YA resuelto del ancla, sin nuevo sorteo), eslabón 3 (colisión: la segunda
     colocación toma el momento restante si su propio set lo admite; si no, se descarta para ese
     día — nunca se fuerza contra el set real del plato).
  4. **Preferencias A≻B contractuales con "satisfecha por imposibilidad"**: fuera de alcance de
     P1a (no hay preferencias A≻B en la cascada de momento de esta rama); se deja registrado aquí
     para que P1b no lo relitigue.
  5. **INVARIANTE RNG**: "el RNG nunca reintroduce candidatos descartados; solo desempata entre
     equivalentes tras los pasos activos". En P1a esto se cumple por construcción: el desempate
     `::walk` solo interviene cuando el momento del plato-ancla es genuinamente ambiguo (ambos
     valores admitidos), nunca para forzar un momento que el plato no admite.
  6. **`energiaCocina` preservada sin consumir**: campo del esquema de Plato (CP1) que P1a no lee
     ni descarta — sigue viajando en el catálogo para consumidores futuros.
  7. **`humanScore` reportado no gate**: fuera de alcance de P1a (constitución de `engine2`: `eval/`
     jamás se importa desde `engine2/` — `expandWeekArc.js` no lo importa).
  8. **`MemoryStore` inyectado no leído**: P1a es stateless, como `buildWeekArc` (R4) — no importa
     `src/engine2/memory/`.
- Evidencia:
  - Pre-check p1 (read-only, catálogo real `scripts/phaseB2/output/dishes.json`, 241 platos, 32
    `batchable`): 3 platos `batchable` con `momento` ambos (`curry_garbanzos`,
    `pollo_teriyaki_arroz`, `ensalada_lentejas_feta`), ninguno `rol:"ancla"`. De los 6 platos
    `rol:"ancla"` (los que resuelve `chooseAnchor` en `buildWeekArc`), los 6 tienen `momento` de un
    solo valor — cero ambigüedad real alcanzable hoy; el eslabón 0 de desempate RNG se verifica con
    fixture construido (v3, v5).
  - p2: `src/engine/buildPlan.js:2434-2443` confirma que `TRAINING_DINNERS` sustituye la CENA
    (objetos con `slot:"Cena"` en `buildPlan.js:1157-1165`), nunca la comida.
  - p3: `src/engine2/skeleton/buildWeekArc.js:285-336` — `beats[]` es un array de 7 (uno por día,
    sin distinguir comida/cena, deuda explícita para F4 en el comentario de
    `computeLeftoverDays`), shape `{day, fixedRole?, slotRole, anchorRef?, density}`; `anchors[]`
    es `[{anchorId, cookDay, leftoverDays}]`. Sin desajuste con lo asumido.
  - Falsables v1-v7 demostrados verdes: `src/engine2/walk/tests/expandWeekArc.test.js`, 17 tests.
  - r1 (rompe herencia de momento en sobra) y r2 (rompe namespace RNG `::walk`→`::skeleton`)
    demostrados ROJO con mutación deliberada sobre `expandWeekArc.js`, revertidos, checksum MD5
    idéntico pre/post-mutación (`870859ab79e22aa2de06fc2ccbeff648`) y suite verde tras cada revert.
  - `npm test`: 56 archivos / 563 tests VERDE (546 base F4-P0 + 17 nuevos de `expandWeekArc`).
  - Tripwires (`tripwire-no-score`, `tripwire-eval-isolation`, `tripwire-engine2-engine-isolation`,
    `tripwire-reverse-isolation`) verdes sobre `src/engine2/walk/` sin tocar su configuración: 4
    archivos, 32 tests, VERDE.
  - `git diff --stat main` sobre `src/engine/**`, `src/engine2/skeleton/**`,
    `src/engine2/dishes/**` (incluido `loadCatalog.js`, consumido no modificado),
    `src/engine2/memory/**`, `src/engine2/contracts/**`, `scripts/**`, `dishes.json` → vacío
    (intactos).
- Decide: Javi (ratificación de sesión 2026-07-03, ejecutada en `feature/f4-p1a-expansion`; los
  elementos de P1b quedan marcados explícitamente para el PR siguiente contra este mismo asiento).

## D-019 — [2026-07-03] Fase 4, Componente P1b (selección libre del walk): paquete de decisiones
- Decisión/Hallazgo: sesión de implementación de F4-P1b en rama `feature/f4-p1b-seleccion`
  (desde `main` en `48509ac`, P1a ya mergeado). Un solo módulo nuevo: `src/engine2/walk/runWalk.js`
  (rellena los huecos abiertos que `expandWeekArc.js` deja tras colocar ancla+sobras — ese
  archivo NO se toca, se consume tal cual). Se ratifican cinco decisiones de esta sesión, causas
  literales del prompt 2026-07-03:
  1. **Pool de capricho vacío → degradación explícita a rotativo, con causa en el log.** El
     catálogo real (`scripts/phaseB2/output/dishes.json`, 241 platos) tiene 0 platos con
     `rol:"capricho"` (235 `rotativo` + 6 `ancla` = 241 — verificado, ver Evidencia). v1 (falsable
     central de semana real) corre sobre ese catálogo real, con la degradación visible como
     entrada de evento (`capricho_degradado_a_rotativo`) en el decisionLog: ambos huecos del día
     capricho se procesan como rotativo normal (con preferencias A/B incluidas, ya no son "el
     hueco capricho"). No es una nota de deuda aparte: es el estado honesto del catálogo hoy. El
     camino capricho verdadero (pool no vacío, set único y set ambiguo) se cubre con fixture
     propio en v2. Hueco NORMAL (rotativo) con pool vacío → lanza, sin fallback (deja medido que
     hoy es inalcanzable en el catálogo real, en vez de encubrirlo).
  2. **Preferencias A/B NO aplican al hueco capricho** (exención ratificada: A/B tejen variedad
     en lo ordinario; el capricho es la excepción consciente de la semana, no otro rotativo más).
     Solo reglas duras (rol="capricho" + no-repetición). Desempate entre ≥2 candidatos capricho
     válidos: paso 6 puro, causa literal `"capricho de la semana"`. 1 candidato → directo, sin
     RNG, causa `capricho_candidato_unico`. El hueco hermano (momento no elegido) pasa a rotativo
     normal, con A/B incluidas — la exención es solo del propio hueco capricho.
  3. **Sub-namespace RNG `::walk::select`, distinto de `::walk`.** `expandWeekArc.js` (P1a) usa
     `mulberry32(seedFromString(`${seed}::walk`))` para su propio desempate de momento del ancla;
     ese generador es interno, no se expone y `runWalk.js` no puede compartirlo sin tocar P1a
     (prohibido). Reutilizar literalmente `${seed}::walk` reiniciaría la secuencia desde el índice
     0 y correlacionaría por coincidencia numérica el primer desempate de selección con el de
     ancla de P1a — no rompe el determinismo (la seed sigue fijando el resultado) pero es una
     dependencia accidental innecesaria. `runWalk.js` usa su propio stream,
     `${seed}::walk::select` (mismo namespace lógico "walk", stream independiente), documentado en
     el JSDoc de cabecera del módulo.
  4. **Preferencia A vacuamente satisfecha sin "ayer"** (Lunes, o cualquier hueco sin día anterior
     en la semana): no es "imposibilidad" (no hay restricción real que evaluar), es "no aplica" —
     causa distinta en el log (`preferencia A no aplica: no hay dia anterior...`) de la
     imposibilidad genuina (`preferencia A satisfecha por imposibilidad: ...`). Mismo criterio
     para B con menos de 2 días previos en la semana.
  5. **decisionLog conserva `colision_sin_hueco` como entrada de evento, no la descarta.** El log
     final de `runWalk` = 14 entradas de relleno (una por hueco, shape uniforme
     `{day, momento, plato, causa, evidencia, alternativasDescartadas[, energiaCocina]}` — las que
     v11 cuenta y valida) + entradas de evento preservadas sin pérdida de causa
     (`evento:true`, shape `{day, causa, evidencia, alternativasDescartadas:[]}`, sin `plato`):
     reformar el shape de las entradas heredadas de P1a a este envoltorio uniforme sí; perder
     causas (incluida `colision_sin_hueco`, el único evento que P1a puede producir) no.
     `energiaCocina` solo aparece en las entradas de relleno que `runWalk` selecciona (P1a no la
     lee ni la registra, sigue intacta desde el catálogo — D-018).
- Evidencia:
  - Catálogo real: `node -e "..."` sobre `scripts/phaseB2/output/dishes.json` → 241 platos, conteo
    por rol `{ rotativo: 235, ancla: 6 }` — 0 `capricho`. Confirmado además por
    `src/engine2/dishes/tests/schema.rolEnum.test.js` / `annotate.test.js` (ninguno anota
    `rol:"capricho"` en el universo actual): el hueco editorial capricho está pendiente de sesión
    con el cocinero, no es un bug de esta implementación.
  - Falsables v1-v13 demostrados verdes: `src/engine2/walk/tests/runWalk.test.js`, 24 tests.
  - Ciclos de mutación r1-r5 (CLAUDE.md: TDD, cada falsable "sucio" mutación→rojo→revert→checksum
    idéntico→verde), checksum de `runWalk.js` constante en las 5 vueltas:
    `cf02f0e49549856aa1533b5eda591732`.
    - r1 (guarda de no-repetición deshabilitada en el pool rotativo) → v4 ROJO (`expected 2 to be
      1`) → revert → checksum idéntico → verde.
    - r2 (rol="ancla" colado en el pool rotativo) → v5 no detectó el mutante por azar (el ancla
      libre del catálogo real es 1 de ~200 candidatos, baja probabilidad); se construyó un
      escenario dedicado (única candidata de cena = un plato `rol:"ancla"` no usado, con 7
      rotativos legítimos para el resto de días) → mutante coloca la ancla en Martes/cena
      (verificado directamente sobre `slots`) → revert → checksum idéntico → verde (la misma
      ancla deja de aparecer en cualquier hueco).
    - r3 (preferencia A neutralizada a "no aplica" siempre) → v6 ROJO (2/2, evidencia deja de
      contener "preferencia A aplicada"/"satisfecha por imposibilidad") → revert → checksum
      idéntico → verde.
    - r4 (preferencia B neutralizada a "no aplica" siempre) → v7 ROJO (2/2, mismo patrón) →
      revert → checksum idéntico → verde.
    - r5 (EL CENTRAL: RNG desempatando sobre `pool` pre-filtros en vez de `candidatesB`
      post-filtros) → v10 ROJO (`Miercoles` deja de ser consistente entre semillas: el candidato
      que preferencia A debía excluir por construcción vuelve a ganar cuando gana la tirada) →
      revert → checksum idéntico → verde.
  - `npm test` (`npx vitest run`): 57 archivos / 587 tests VERDE (563 base P1a + 24 nuevos de
    `runWalk`).
  - Lint: `npx eslint src/engine2/walk/runWalk.js src/engine2/walk/tests/runWalk.test.js` → 0
    problemas. (El lint global del repo reporta 123 errores preexistentes en archivos ajenos a
    esta sesión — p. ej. `App.jsx` — no tocados aquí.)
  - Tripwires (`tripwire-no-score`, `tripwire-eval-isolation`, `tripwire-engine2-engine-isolation`,
    `tripwire-reverse-isolation`) verdes sobre `src/engine2/walk/` sin tocar su configuración: 4
    archivos, 32 tests, VERDE.
  - `git diff --stat main` sobre `src/engine/**`, `src/engine2/skeleton/**`,
    `src/engine2/dishes/**`, `src/engine2/memory/**`, `src/engine2/contracts/**`, `scripts/**`,
    `dishes.json` → vacío (intactos). Único archivo nuevo de producción:
    `src/engine2/walk/runWalk.js`; único archivo de test nuevo:
    `src/engine2/walk/tests/runWalk.test.js`.
- Decide: Javi (ratificación de sesión 2026-07-03, ejecutada en `feature/f4-p1b-seleccion`; dos
  correcciones sobre el plan original de la sesión — v1 sobre catálogo real en vez de fixture, y
  preservación de `colision_sin_hueco` como evento — incorporadas antes de empezar el TDD, no
  relitigadas después).

## D-020 — [2026-07-03] MEDICIÓN humanScore de P1b: BLOQUEADA por incompatibilidad de shape
- Decisión/Hallazgo: la MEDICIÓN prevista en el encargo de P1b ("humanScore de N semanas engine2
  vs baseline, en repetición y continuidad") no se ejecuta esta sesión: `humanScore` y sus
  sub-métricas no saben leer la salida de `runWalk` (`{slots, decisionLog}`).
  `collectLegibleMainMeals`/`isLegibleMeal` (`src/eval/planReader.js:12`) exigen
  `meal._spec.tmpl` de tipo string para considerar un meal legible; `computeRepeticionSalsa` y
  `computeRepeticionTecnica` (`src/eval/metrics/repetition.js:17`) leen `meal._spec.S` y
  `meal._spec.cookM` respectivamente — vocabulario del combo legacy. El esquema de Dish de
  engine2 (`src/engine2/dishes/schema.js:1-18`) excluye ese vocabulario por diseño ("10 campos,
  cero macros / equivalencias / densidades energeticas"; los 5 campos editoriales de Fase 3 son
  `rol, batchable, leftoverQuality, shelfLifeDays, energiaCocina`, ninguno mapea 1:1 a
  `tmpl/S/cookM`). No existe adaptador `runWalk → plan.days[].meals[]._spec` en ningún punto del
  árbol (`grep -rniE "reconcile|toLegacyPlan|adaptPlan" src/engine2/` → vacío).
- Se descarta explícitamente construir un adaptador ad-hoc esta sesión: un traductor parcial (p.
  ej. solo para los 178 platos por tupla legacy, sin cobertura de los 63 promovidos desde
  `FREEFORM_COMBOS`, D-009) reproduciría la asimetría estructural ya diagnosticada en D-014
  (`inflateFreeFormForPool` anulando campos derivados solo para el pool freeform) — el mismo
  patrón de daño, en la herramienta de medición en vez de en el motor. Y correr `humanScore` sin
  adaptador reportaría "0 meals legibles" en las sub-métricas de repetición/continuidad, un
  resultado que PARECE dato (evidencias vacías) pero es artefacto de shape, no ausencia real de
  repetición — viola la regla de honestidad de métricas que el propio `humanScore.js` declara en
  su cabecera para los casos `needs_engine2`.
- El criterio de aceptación de Fase 4 tenía por tanto un prerrequisito no declarado (adaptador
  engine2→humanScore) que no se identificó hasta esta sesión. La medición se difiere a P2: el
  resolver de composición de esa fase (tupla para los 178 + `FREEFORM_COMBOS` para los 63) es el
  punto natural donde los 241 platos del catálogo se pueden leer de forma simétrica hacia un
  `_spec`-equivalente, sin la asimetría de D-014.
- Evidencia: citas de línea arriba (`planReader.js:12`, `repetition.js:17`, `schema.js:1-18`);
  grep de adaptador → vacío; único consumidor real de `humanScore` en el árbol es
  `src/engine/tests/humanScore.baseline.test.js` (motor viejo), confirmado por
  `grep -rln "humanScore"` fuera de `src/eval/`.
- Decide: Javi (ratificación de sesión 2026-07-03, causa literal: "NO se mide. No construyas
  adaptador ad-hoc ni parcial — un adaptador que lee los 178 por tupla pero no los 63 freeform
  reproduce la asimetría de medición de D-014 [...], y '0 meals legibles' produciría métricas
  vacías que parecen dato").

## D-021 — [2026-07-06] Fase 4, Componente P2a ("infraestructura composicional"): resolver de
  composición sin crecer el schema de Dish
- Decisión/Hallazgo: el schema de Plato (`src/engine2/dishes/schema.js`, 10 campos) NO crece para
  dar cabida a proteinType/density/gluten/lactosa/verdura. La composición es una VISTA DERIVADA
  calculada en carga sobre la salida de `loadCatalog()`, nunca escrita de vuelta a `dishes.json`:
  `loadCatalog() → CompositionResolver → consumidores (P2b/P2c)`. Renombre del checkpoint, de
  "resolver de composición" a **"infraestructura composicional"** (más preciso: no es un resolver
  aislado, es la capa que hace legible el catálogo para P2b/P2c sin tocar su contrato).
  - Implementación: `src/engine2/dishes/compositionResolver.js` (único módulo nuevo).
    `resolveDishComposition(dish)` / `resolveCatalogComposition(dishes)` como orquestadores;
    `resolveScaffoldComposition(tupla, dishId)` / `resolveFreeformComposition(combo, dishId)`
    exportadas como funciones puras independientes (mismo patrón que `derive.js`/`assemble.js`:
    piezas puras, testeables sin I/O, compuestas por un orquestador delgado).
  - Fuentes de datos declaradas (data-only, ninguna importa `buildPlan.js`): `dish.id` (es
    literalmente el JSON de `comboIdentityKey` para los 178 scaffold — el "join" es una lectura de
    mapa, no una búsqueda difusa); `src/data/FREEFORM_COMBOS.js` (join por `identity.id`, los 63
    freeform); `legacyCombos.data.js` vía `groupCombosByIdentity` (density de los 178, mismo
    mecanismo que `anchors.js` en CP2).
  - Contrato de vista, idéntico shape base para los 241 independientemente del origen:
    `{origen, claveP, proteinType, containsGluten, containsLactosa, density, verdura}` +
    `tupla` (solo scaffold, ausente en freeform — verificado estructuralmente, no por valor
    `undefined`). **Justificación contractual de paridad de intención** (aplica también de cara a
    P2b): "engine2 implementa el contrato declarado de los vetos de forma uniforme; las asimetrías
    accidentales del legacy no forman parte del contrato observable que se desea preservar."
  - **`proteinType`** (vocabulario cerrado de 8: pescado, marisco, legumbre, ave, carne, huevo,
    cereal, vegetal): freeform lee `identity.proteinType` directo; scaffold usa la tabla NUEVA
    `P_TO_PROTEINTYPE` (17 claves, no es copia paritaria del legacy — el legacy usa otra taxonomía,
    `CULINARY_FAMILY` — "carne" agrupa vacuno+cerdo deliberadamente). El veto de cerdo NO opera
    sobre esta capa: opera sobre `claveP` (la clave `P` cruda / `identity.protein`), que el resolver
    expone por separado para que P2b elija la capa correcta.
  - **`density`**: scaffold hereda `baja/media/alta` de `legacyCombos.data.js` sin traducir; freeform
    normaliza LÉXICAMENTE `low/medium/high → baja/media/alta` (cambia vocabulario, no significado).
  - **`containsGluten`/`containsLactosa`**: freeform los declara (`identity.containsGluten/
    containsLactosa`, boolean); scaffold no tiene fuente estructural hoy (`legacyCombos.data.js` no
    tiene esos campos, verificado por grep, 0 ocurrencias) → estado DESCONOCIDO explícito, mismo
    patrón de unión etiquetada que verdura. No se deriva por `tmpl==="pasta"` ni heurística similar
    — esa derivación (si se ratifica) es decisión de P2b, fuera de alcance aquí.
  - **`verdura`**: unión etiquetada por origen — scaffold `{estado:"conocida", ejes:[V,V2 no-nulos]}`
    (`ejes:[]` es "sin verdura" DEMOSTRADO, p. ej. `pasta+huevo` con `V:null`); freeform
    `{estado:"desconocida"}` SIN campo `ejes` (ausencia estructural, no `ejes:[]`). Frase ratificada
    para el JSDoc: *"La ausencia de contribución refleja ausencia de información, no ausencia de
    verdura."* Helper de lectura `ejesVerdura(vista)` lanza sobre estado desconocido.
  - La vista completa va `Object.freeze` en profundidad (campos planos y anidados: `tupla`,
    `verdura`, `verdura.ejes`).
  - **Nota para P2b (ratificada ahora como POLÍTICA, no como contrato de P2a)**: los valores
    `pescado:3, legumbre:3, verduraDiaria:1` para `DEFAULT_WEEKLY_TARGETS`
    (`src/engine2/contracts/weeklyTargets.js:32-35`, hoy `{pescado:2, legumbre:2, verduraDiaria:1}`,
    marcados en el propio código como "provisionales — ratificación de negocio pendiente para P2").
    Razones ratificadas: pescado 3 alineado con AESAN (coincide con el cap legacy vigente por razón
    propia, no por herencia); legumbre 3 con el recordatorio ya existente en el código ("F5: revisar
    a 4, AESAN"); `verduraDiaria` 1 = presencia diaria. Es POLÍTICA, no contrato: el contrato
    `WeeklyTargets` (shape + semántica SUELO/CUOTA, nunca techo) no cambia, solo los defaults —
    pueden cambiar sin re-ratificar el contrato. **Alcance de P2a: solo se asienta la ratificación
    aquí. `weeklyTargets.js` NO se toca en esta sesión** — la actualización del default aterriza en
    P2b junto a su consumidor (un concern por PR).
  - Causas literales de sesión 2026-07-03/04 (prompt de P2a) y aclaración de sesión 2026-07-06
    (valores 3/3/1, elíptica en el prompt original — aclarada por Javi a petición explícita en vez
    de asumida).
- Evidencia:
  - D2 (diagnóstico previo) confirmado en runtime: 241 platos, 178 resuelven como tupla de 7
    elementos vía `JSON.parse(dish.id)`, 63 hacen join limpio contra `FREEFORM_COMBOS` por
    `identity.id`, 0 platos sin origen determinable (`neither: 0`); `bol_fruta_yogur` confirmado
    fuera de los 241 (`dishes.find(d => d.id === 'bol_fruta_yogur')` → `undefined`).
  - `P_TO_PROTEINTYPE` (17 claves) verificado 1:1 contra el universo real de valores `P` en
    `legacyCombos.data.js` (`grep -oE 'P:"[a-z_]+"' | sort -u` → exactamente 17, sin huecos).
  - `FREEFORM_COMBOS.js`: 64 combos, 0 sin `containsGluten`, 0 sin `containsLactosa`, 0 sin
    `nutrition.energyDensity`; valores de `energyDensity` = `{low, medium, high}` (los 3 del mapeo
    léxico, sin huecos).
  - Falsables demostrados ROJO→revert→checksum→VERDE con mutación deliberada sobre el módulo en
    construcción (nunca sobre `dishes.json`/`FREEFORM_COMBOS.js`/`legacyCombos.data.js` reales):
    r1 (freeform sin entrada en `FREEFORM_COMBOS` → silenciar el throw hace fallar el test de r1),
    r2 (clave P ausente de `P_TO_PROTEINTYPE` → default silencioso hace fallar r2 nombrando la
    clave), r3 (energyDensity fuera del mapeo léxico → default silencioso hace fallar r3), r4
    (control negativo: inyectar `ejes:[]` en la vista freeform hace fallar 3 tests — v5 estructural
    + 2 de r4 — confirmando que la unión etiquetada, no un valor centinela, es lo que sostiene la
    distinción "desconocida ≠ sin verdura"), r5 (quitar `deepFreeze` hace fallar las 4 mutaciones:
    campo plano, `verdura` anidado, array `ejes`, `tupla` anidada), v6 (invertir el orden en
    `resolveCatalogComposition` hace fallar el test de estabilidad de orden). Cada mutación
    verificada con `sha256sum` idéntico antes/después del revert.
  - Suite final: 58 archivos / 613 tests VERDE (587 base de P1b + 26 nuevos de
    `compositionResolver.test.js`).
  - Tripwires verdes sin modificar su configuración: `-t "tripwire"` → 5 archivos / 34 tests VERDE
    (incluye `tripwire-no-score`, `tripwire-eval-isolation`, `tripwire-engine2-engine-isolation`,
    `tripwire-reverse-isolation`); grep manual de `score|rank(ing)?|top-?N` y de imports
    `.../eval/` o `.../engine/` sobre `compositionResolver.js` → limpio.
  - `git diff --stat origin/main -- src/engine src/engine2/skeleton src/engine2/walk
    src/engine2/memory src/engine2/contracts scripts src/engine2/dishes/loadCatalog.js
    src/engine2/dishes/schema.js dishes.json` → vacío (todas las rutas protegidas intactas).
  - `sha256sum scripts/phaseB2/output/dishes.json` idéntico antes/después de toda la sesión
    (`a8fe0abb...`) — el resolver es vista, nunca escritura.
- Decide: Javi (ratificación de sesión 2026-07-03/04, ejecutada en `feature/f4-p2a-composicion`;
  aclaración de valores 3/3/1 ratificada en sesión 2026-07-06).

## D-022 — [2026-07-06] Fase 4, Componente P2b-i (paso 2 del walk): vetos duros
- Decisión/Hallazgo: Fase 1 de esta sesión (mini-D0 read-only) confirmó dos STOPs antes de
  implementar — (d) el camino del ancla (`chooseAnchor`, `src/engine2/skeleton/buildWeekArc.js:111-126`,
  docstring literal "Ancla elegida ÚNICAMENTE por seed... Sin filtros de ningún tipo"; colocación en
  `expandWeekArc.js:154`, lookup directo por id) no pasa por ningún punto de veto hoy — su aplicación
  queda fuera de alcance, asiento propio futuro; (b) D-021 delega expresamente a P2b la derivación de
  `containsGluten`/`containsLactosa` para scaffold (178/241, hoy `estado:"desconocida"` en ambos
  campos). Javi resuelve ambos STOPs por ratificación explícita, cuatro asientos:
  1. **Principio** (cita literal del prompt de sesión, gobierna el mecanismo): *"Los vetos actúan
     antes de cualquier mecanismo de selección; un plato vetado no forma parte del espacio de
     decisión."*
  2. **Fuente canónica de `containsGluten`/`containsLactosa` para scaffold**: anotación editorial del
     cocinero (XLSX, ingesta en PR propio, siguiente en cola — NO entra en este PR). Prohibida
     cualquier derivación heurística (cita literal): *"un veto declarado no puede resolverse mediante
     una inferencia no verificada cuando existe una fuente editorial prevista para ese dato."* Cierra
     la delegación que D-021 hizo a P2b — no se deriva por `tmpl==="pasta"` ni heurística análoga en
     `vetoes.js`.
  3. **Política ante estado `"desconocida"` en campo vetado**: FAIL-CLOSED con causa
     (`"desconocida" != "libre de"`). Transitoria sobre el catálogo real: la ingesta del cocinero
     (asiento 2) la reduce al residuo sin anotar. Nota de secuencia: el PR de ingesta mergea
     inmediatamente después de este.
  4. **Frontera de `validateProfile` crece con su primer consumidor P2**: `intolerances` opcional,
     enum cerrado `{gluten, lactosa}` (`INTOLERANCE_VALUES`, `src/engine2/contracts/profile.js`),
     rechazo explícito de cualquier otro valor. Sin anticipación de vocabulario (mismo principio que
     D-017 punto 1/6: no se valida nada que ningún consumidor use todavía).
  - **Implementación**: `src/engine2/walk/vetoes.js` (módulo nuevo, único concern de esta sesión).
    `evaluateVeto(dish, intolerancias)` — pura, invoca `resolveDishComposition` (D-021) UNA vez por
    plato, devuelve TODAS las razones de veto que aplican (no solo la primera, necesario para el
    conteo por campo); atajo estructural: con `intolerancias` vacío/ausente, NUNCA invoca el resolver
    (preserva compatibilidad retro con fixtures de tests preexistentes que usan ids sintéticos no
    resolubles). `computeVetoUniverse(catalog, intolerancias)` — construye el universo vetado UNA VEZ
    por semana (no por hueco), restringido al espacio de decisión del walk (`rol="rotativo"` o
    `"capricho"` — el ancla, `rol="ancla"`, queda fuera por construcción, coherente con el STOP (d) de
    Fase 1); devuelve `{vetoedIds, conteo, activo}`.
  - `runWalk.js` (`src/engine2/walk/runWalk.js`): recibe `profile` en su input (nuevo, opcional — sin
    call-sites de producción que romper, único consumidor era su propio test); calcula el universo de
    vetos una vez al principio (Paso 2 de la cascada, entre Paso 1 "respetar lo colocado" y Paso 3
    "preferencia A" — hueco que ya existía en la numeración de D-019); añade `!vetoedIds.has(d.id)` a
    los DOS únicos puntos de construcción de pool (capricho: línea `caprichoPool`; genérico: línea
    `pool`) — mismo mecanismo para ambos, sin asimetría. Decision log: UNA entrada `causa:
    "veto_universo_reducido"` por semana (no por hueco) cuando `intolerancias.length > 0`, con conteo
    por campo y por motivo (`valor` vs `desconocida`) en la evidencia — los vetados existieron cero
    veces en el espacio de decisión, la ausencia del log por-hueco es consecuencia del principio, no
    cláusula del contrato.
  - `validateProfile` (`src/engine2/contracts/profile.js`): exporta `INTOLERANCE_VALUES = ['gluten',
    'lactosa']`; `intolerances` opcional (`'intolerances' in profile`), rechaza no-array y cualquier
    valor fuera del enum, nombrando campo y valor ofensivo (mismo patrón que `trainingDays`).
- Evidencia:
  - Falsables demostrados ROJO→revert→VERDE con mutación deliberada sobre el módulo en construcción:
    f13 (veto desactivado: se quita `!vetoedIds.has(d.id)` de ambos filtros de pool en `runWalk.js`
    → `f13+f15` en `runWalk.test.js` falla, `gazpacho_huevo_atun` ocupa el hueco en vez del candidato
    libre), f14 (asimetría: `evaluateVeto` devuelve `[]` temprano si `vista.origen === 'scaffold'`
    → 4 tests caen en `vetoes.test.js`/`runWalk.test.js`), f15 (fail-open: rama `estado ===
    "desconocida"` deja de empujar razón de veto → mismos 4 tests caen), f16 (enum abierto: chequeo
    `!INTOLERANCE_VALUES.includes(valor)` sustituido por `typeof valor !== 'string'` → el test de
    rechazo de `"marisco"` cae en `profile.test.js`). Las 4 mutaciones revertidas; `sha256sum` de
    `runWalk.js` idéntico antes/después del ciclo f13 (restaurado desde backup exacto).
  - Suite dirigida tras cada revert: `npx vitest run src/engine2` → 31 archivos / 401 tests VERDE.
  - Fixtures de test sobre catálogo REAL (`loadCatalog()`, 241 platos: 235 `rol="rotativo"`, 6
    `rol="ancla"`, 0 `rol="capricho"`) localizadas dinámicamente (nunca ids hardcodeados) vía
    `resolveDishComposition`: freeform con `containsGluten=true` (`gazpacho_huevo_atun`), freeform con
    `containsGluten=false` (`fabada_simplificada`), scaffold (`catalog[0]`, mismo plato "primer plato
    del catálogo" de D-021, `estado:"desconocida"` en ambos campos).
  - Tripwires verdes sin modificar su configuración: `-t "tripwire"` → 5 archivos / 34 tests VERDE.
    Grep manual de `score|rank(ing)?|top-?N` sobre `vetoes.js` → limpio; grep de imports
    `.../engine/` o `.../eval/` sobre `vetoes.js`/`runWalk.js`/`profile.js` → limpio.
  - `git diff --stat origin/main -- src/engine src/engine2/skeleton src/engine2/walk/expandWeekArc.js
    src/engine2/dishes/compositionResolver.js scripts src/engine2/memory dishes.json` → vacío (F3,
    resolver, motor viejo y catálogo intactos — ninguno de los caminos prohibidos se tocó).
  - `sha256sum scripts/phaseB2/output/dishes.json` idéntico (`a8fe0abb...`) — sin ingesta en este PR.
  - Suite completa (`npx vitest run`): 640 VERDE / 2 timeout preexistentes en `analysis/
    gate2_measure.test.js` y `analysis/gate4_protein_guard.test.js` — deuda ya registrada en D-015,
    no tocados por esta sesión, no relacionados con `engine2`.
  - **Addendum (mismo PR, commit pequeño posterior)**: verificación pedida por Javi — ningún fixture
    de `vetoes.test.js` cubría `origen="scaffold"` + `estado="conocida"` (vetado POR VALOR, no por
    desconocida); los únicos fixtures scaffold eran datos reales, y `CompositionResolver` resuelve
    scaffold a `"desconocida"` incondicionalmente (D-021, no depende de datos) — ese estado es hoy
    estructuralmente inalcanzable con el catálogo real. Se separó `evaluateVeto` en un núcleo puro
    `evaluateVetoFromVista(vista, intolerancias)` (recibe la vista ya resuelta) + un envoltorio
    delgado `evaluateVeto(dish, intolerancias)` que la invoca sobre `resolveDishComposition(dish)` —
    mismo patrón pureza/orquestador que `compositionResolver.js`. Con `evaluateVetoFromVista` se
    añadieron 2 fixtures SINTÉTICOS (`vetoes.test.js`, describe "f14 (refuerzo)"): caso positivo
    (`origen:"scaffold"`, `containsGluten:{estado:"conocida",valor:true}` → vetado motivo `"valor"`)
    y caso negativo (`valor:false` → no vetado). Falsable demostrado ROJO→revert→VERDE: mutación
    `estadoCampo.valor === true && vista.origen !== 'scaffold'` (scaffold escapa SOLO de la rama
    "valor") → exactamente 1 test cae (el caso positivo nuevo); los 11 tests restantes de
    `vetoes.test.js` (incluidos los de f15/desconocida) y los 28 de `runWalk.test.js` permanecen
    VERDE — aislamiento f14/f15 confirmado. Revertido; `npx vitest run src/engine2` → 31 archivos /
    403 tests VERDE (401 + 2 nuevos); `-t "tripwire"` → 5/34 VERDE. `evaluateVeto` (contrato público,
    consumido por `runWalk.js`/`computeVetoUniverse`) sin cambio de comportamiento.
- Decide: Javi (ratificación de sesión 2026-07-06, ejecutada en
  `feature/f4-p2b-i-vetos-duros` sobre `test/f4-p2a-gluten-lactosa-cobertura`).

## D-023 — [2026-07-06] Fase 4, Componente P2b-i-bis: veto sobre el camino del ancla
- Decisión/Hallazgo: D-022 (STOP (d) de su Fase 1) dejó fuera de alcance, como asiento propio
  futuro, el hecho de que `chooseAnchor` (`src/engine2/skeleton/buildWeekArc.js`) y su colocación
  en `expandWeekArc.js` no pasan por ningún punto de veto. Ritual v2 de esta sesión (repetido:
  actividad de repo desde D-022, PR #17 mergeado) confirmó que el repo sigue en silencio sobre el
  ancla como invariante de validez: `git grep` sobre `weekArc.anchors` fuera de `tests/` no arroja
  ninguna declaración de invariante ni lenguaje de truncamiento (`buildWeekArc.js` usa `flatMap`/
  `for...of` sobre `weekArc.anchors`, ambos ya tolerantes a array vacío por construcción;
  `expandWeekArc.js:153` itera `for (const anchor of weekArc.anchors)`, vacío también sin lanzar);
  cero tests de presencia obligatoria (`weekArc.anchors).toHaveLength(1)` solo aparece atado a
  fixtures/seeds concretas, nunca como aserción general del contrato). Javi ratifica cuatro asientos:
  1. **Contrato del ancla** (decisión nueva, el silencio de arriba es la evidencia): *"La presencia
     de un ancla en una semana no forma parte del contrato de validez del plan. Cuando no existe
     ninguna ancla elegible, el motor genera igualmente un plan válido y registra explícitamente la
     ausencia y sus consecuencias."* El ancla conserva su papel en el modelo; deja de ser requisito
     de validez.
  2. **Principio transversal**: *"Dato confirmado puede entrar al motor; propuesta editorial puede
     ayudar al editor humano, nunca al motor."* Origen: hallazgo del cuaderno del cocinero
     (`anotado_por="reglas cocinero v3 (revisar)"` en 242/242 filas, `ya-anotado="sí"` en solo 6/242,
     y esas 6 por metadata de batchability ajena a alérgenos, no por confirmación editorial de
     gluten/lactosa).
  3. **Micro-ingesta de las 6 anclas: descartada.** Procedencia demostrada: `gluten`/`lactosa` de las
     6 filas del cuaderno salen de `proposeGluten`/`proposeLactosa` (heurística), no de confirmación
     humana; la marca `"(revisar)"` es evidencia textual de no-confirmación. Consecuencia: las 6
     filas de ancla quedan como ítem de máxima prioridad del contrato de salida de la próxima sesión
     editorial (no de este PR).
  4. **Terminología**: el contrato semántico de exclusión por desconocida se formula como contrato de
     dominio (*"un plato cuyo estado respecto al campo vetado es desconocido no puede demostrarse
     compatible con un requisito de exclusión"*), no como mecanismo de seguridad. Los asientos
     históricos que dicen "fail-closed" (D-022, este mismo archivo) NO se reescriben; la terminología
     nueva rige desde aquí en adelante (comentarios/nombres de test, ver Implementación).
  - **Implementación**: `src/engine2/walk/vetoes.js` gana `filterSurvivors(candidates, intolerancias,
    getVista)` — filtro genérico que reutiliza `evaluateVetoFromVista` (cero duplicación de criterio
    de veto); con intolerancias vacío/ausente devuelve `candidates` sin resolver ninguna vista (mismo
    atajo estructural que `evaluateVeto`/`computeVetoUniverse`, preserva paridad byte a byte del
    camino feliz). `getVista` es punto de inyección: producción resuelve por
    `resolveDishComposition({id: anchor.identityKey})` (el `identityKey` de un ancla ES su `dish.id`
    real, mismo mecanismo de join que CP2/D-021); los tests inyectan vistas sintéticas para ejercer
    `estado="conocida"+valor=true`, hoy inalcanzable con el catálogo real (D-021: scaffold resuelve
    siempre `"desconocida"` en gluten/lactosa).
  - `src/engine2/skeleton/buildWeekArc.js`: `chooseAnchor` (ahora exportado) recibe
    `(anchors, seed, intolerancias, decisionLog, getVista?)` — filtra ANTES del sorteo
    (`filterSurvivors`), el RNG solo ve supervivientes, nunca el catálogo completo (invariante
    preservado por construcción, no por descarte posterior). Cero supervivientes → registra causa
    `"ancla_ausente"` (una entrada, ausencia + consecuencias) y devuelve `null`. `buildWeekArc()`:
    `batchDay`/`leftoverDays` solo se calculan si hay ancla (`anchor ? ... : undefined/[]`); el resto
    de la cascada (`chooseCapricho`, el `beats.map`) NO necesitó ninguna rama nueva — ya toleraba
    `batchDay=undefined`/`leftoverDays=[]` por construcción (`día === undefined` nunca es cierto para
    un día real; `Set` vacío nunca tiene coincidencias), confirmando "transición del modelo, no
    colección de casos especiales". `weekArc.batchDay` pasa a ser ausencia ESTRUCTURAL (spread
    condicional) cuando no hay ancla, no un valor centinela — mismo principio que "ausencia de
    verdura" en D-021.
  - `profile.intolerances` ya estaba en el contrato (D-022); ningún campo nuevo en `profile.js`.
    `chooseAnchor` recibe `intolerancias` porque `profile` ya estaba en scope en `buildWeekArc()`
    (cita del prompt de sesión: `buildWeekArc.js:257→267` en el estado pre-PR).
  - Tests existentes actualizados (no re-escritos): `buildWeekArc.test.js` — el fixture
    `"...+ intolerancias (lactosa+gluten)"` de `baselineFixtures.js` activa el veto sobre las 6 anclas
    reales (todas `"desconocida"`), así que la aserción previa ("intolerancias NO cambia la
    estructura") quedó reemplazada por una que afirma el NUEVO contrato (semana sin ancla, ver
    D-023); dos barridos mecánicos de `batchDay`/sobras que iteraban las 9 fixtures excluyen
    explícitamente esa fixture (comentario cita D-023) porque su premisa ("toda fixture tiene ancla
    para alguna seed") deja de sostenerse bajo veto activo.
- Evidencia:
  - Falsables demostrados ROJO→revert→VERDE con mutación deliberada sobre el módulo real en
    construcción (`sha256sum` de `buildWeekArc.js`/`vetoes.js` idéntico antes/después de cada ciclo,
    `628627ef...`/`054de828...`):
    f17+f20 (RNG sobre el catálogo completo, `anchors.length`/`anchors[index]` en vez de
    `supervivientes` → 3 tests caen: la propiedad "el vetado nunca es elegido" y "la variación ocurre
    solo entre supervivientes"); f18 (cascada incompleta: `batchDay` calculado y expuesto en
    `weekArc` SIEMPRE, ignorando ausencia de ancla → 5 tests caen, incluido un `TypeError` al
    intentar leer `anchor.identityKey` con `anchor=null` — la propia cascada revienta antes de que la
    aserción llegue a evaluarse); f19 (log `"veto_ancla_universo_reducido"` emitido incondicionalmente,
    también sin veto activo → cae la aserción de "cero regresión del camino feliz"). Las 3 mutaciones
    revertidas una por una, checksum verificado idéntico tras cada reversión.
  - f17/f20 usan catálogos SINTÉTICOS de ancla (mismo patrón que `vetoes.test.js` "f14 (refuerzo)"):
    el catálogo real no puede ejercer `estado="conocida"+valor=true` (D-021, scaffold es
    incondicionalmente `"desconocida"`), así que el mecanismo se prueba con vistas inyectadas vía
    `getVista`, no con datos reales.
  - f18/f19 usan el catálogo REAL (`ANCHORS`, 6 anclas) — es precisamente el caso donde las 6 son
    `"desconocida"` el que dispara el contrato de ausencia (cualquier intolerancia activa → 0
    supervivientes) o, sin veto, lo confirma intacto (ancla siempre presente, log sin nuevas
    entradas, evidencia literal `"...(sin filtros)"` byte-idéntica a la de D-022/CP3A).
  - Suite dirigida: `npx vitest run src/engine2` → 32 archivos / 417 tests VERDE (403 base + 1 test
    nuevo de contrato en `buildWeekArc.test.js` + 13 de `buildWeekArc.vetoAncla.test.js`). Suite
    completa del repo: `npx vitest run` → 60 archivos / 658 tests VERDE. Tripwires sin modificar su
    configuración: `-t "tripwire"` → 5 archivos / 34 tests VERDE.
  - `eslint` sobre los 6 archivos tocados/creados → 0 problemas.
  - `git diff --stat origin/main` → exactamente 5 archivos modificados
    (`buildWeekArc.js`, `buildWeekArc.test.js`, `runWalk.test.js`, `vetoes.test.js`, `vetoes.js`) + 1
    archivo nuevo (`buildWeekArc.vetoAncla.test.js`); `expandWeekArc.js`, `runWalk.js`,
    `compositionResolver.js`, `templateA/B/C.js`, `dishes/`, `memory/`, `contracts/`, `scripts/`,
    motor viejo (`src/engine`) intactos. `sha256sum scripts/phaseB2/output/dishes.json` idéntico
    (`a8fe0abb...`) — sin ingesta en este PR (asiento 3 la descarta explícitamente).
  - Grep manual de `score|rank(ing)?|top-?N` sobre los archivos tocados → limpio; grep de imports
    `.../engine/` o `.../eval/` → limpio (el único import nuevo entre carpetas de `engine2/` es
    `buildWeekArc.js` → `../walk/vetoes.js` y `../dishes/compositionResolver.js`, ambos dentro de
    `engine2/`, ninguno es `engine/` ni `eval/`).
  - Renombradas las 3 ocurrencias de "fail-closed" en tests (`runWalk.test.js:479`,
    `vetoes.test.js:4,44`) al vocabulario de contrato de dominio (asiento 4). El comentario de
    producción en `vetoes.js:17` y el asiento histórico D-022 de este archivo NO se tocan (cita
    literal del propio D-022 se conserva).
- Decide: Javi (ratificación de sesión 2026-07-06, ejecutada en `feature/f4-p2b-i-bis-veto-ancla`
  sobre `main` post-D-022).
- **Addendum (mismo PR, previo al push) — ratificación del before/after de los 3 tests preexistentes
  modificados, y corrección de una afirmación de esta misma entrada**:
  1. Ratificados con diff literal los 3 cambios sobre tests preexistentes: (i)
     `buildWeekArc.test.js` — "intolerancias NO cambia la estructura" reemplazada (no ajustada) por
     una aserción que verifica el contrato de ausencia (D-023 asiento 1) sobre el mismo fixture; (ii)
     y (iii) los dos barridos mecánicos de `batchDay`/sobras excluyen la fixture con intolerancias
     activas vía `FIXTURES_CON_ANCLA = FIXTURES.filter((f) => !(f.profile.intolerances?.length))`.
     Javi cita textualmente: *"3 tests preexistentes actualizados por derogación de premisa,
     ratificados con diff literal; la exclusión de la fixture con intolerancias en los barridos es
     válida mientras D-021 mantenga 'desconocida' incondicional en scaffold — el PR de ingesta del
     catálogo confirmado debe revisitarla."* Registrado como deuda de seguimiento: cuando la ingesta
     del cuaderno del cocinero aterrice (asiento 3 de esta misma entrada) y alguna de las 6 anclas
     deje de resolver `"desconocida"`, `FIXTURES_CON_ANCLA` puede volver a ser `FIXTURES` completo
     para esa fixture — no antes.
  2. **Verificación pedida — `FIXTURES_CON_ANCLA` es filtro intensional, no lista extensional**:
     confirmado por lectura directa del código
     (`src/engine2/skeleton/tests/buildWeekArc.test.js:421`): `FIXTURES.filter((f) =>
     !(f.profile.intolerances?.length))` excluye por la CONDICIÓN "veto activo" (longitud de
     `intolerances` > 0), no por nombre de fixture hardcodeado. Sin cambio necesario.
  3. **Verificación pedida — `vetoes.js:17` ("política FAIL-CLOSED")**: `git blame` confirma que la
     línea (y todo el banner de cabecera del módulo, líneas 1-20) pertenece íntegramente al commit
     `b542c279` (D-022, 2026-07-06 18:41:59), anterior a `filterSurvivors` de esta sesión — es
     terminología vieja en producción, no nueva. **Corrección de esta misma entrada D-023**: el
     bullet de Evidencia que afirma *"El comentario de producción en `vetoes.js:17`... NO se
     toca"* queda SUPERADO por este addendum — sí se tocó, en este mismo PR. Cambio aplicado:
     "política FAIL-CLOSED (D-022)" → "contrato de dominio (D-022, terminología renombrada por
     D-023)"; la cita literal entrecomillada de D-022 (*"un veto declarado no puede resolverse
     mediante..."*) se conserva intacta, solo se renombra la ETIQUETA descriptiva alrededor de la
     cita, no la cita en sí ni el asiento histórico D-022 de este archivo (append-only respetado).
     Corrección adicional en el mismo banner (líneas 5-8, mismo commit `b542c279`, misma
     obsolescencia): el texto afirmaba *"el ancla... no pasa por ningún punto de veto hoy... su
     aplicación es asiento propio, fuera de alcance aquí"* — literalmente cierto bajo D-022, FALSO
     desde esta misma entrada D-023. Corregido para reflejar que el ancla SÍ pasa por veto desde
     D-023, por un mecanismo propio (`chooseAnchor`/`filterSurvivors`, no `computeVetoUniverse`).
  - Suite tras el addendum: `npx vitest run src/engine2` → 32 archivos / 417 tests VERDE (sin
    cambio de conteo: solo prosa de comentarios, ningún comportamiento tocado). `eslint` sobre
    `vetoes.js` → 0 problemas.
  - Autorización: con las 2 verificaciones resueltas, Javi autoriza push de la rama
    `feature/f4-p2b-i-bis-veto-ancla` y apertura de PR. Sin merge — revisión de diff y merge quedan
    en manos de Javi.

## D-024 — [2026-07-07] Fase 4, Componente P2b-ii (paso 4 del walk): frecuencias, prioriza sin sumar
- Decisión/Hallazgo: Fase 0 de esta sesión (verificación de superficie, read-only) confirmó sin
  contradicción: (a) la cascada de `runWalk.js` es pool base → preferencia A → preferencia B →
  desempate RNG (`runWalk.js:274-333` en el estado pre-PR), punto de inserción del paso 4 entre B y
  el RNG; (b) `ejesVerdura`/`verdura.estado` (`compositionResolver.js:158,181,225-233`) — scaffold
  `{estado:'conocida',ejes:[...]}`, freeform `{estado:'desconocida'}`, `ejesVerdura` lanza si
  `estado!=='conocida'`; (c) `DEFAULT_WEEKLY_TARGETS` = `{pescado:2,legumbre:2,verduraDiaria:1}`
  (`weeklyTargets.js:32-36`), archivo declarado *"sin consumidor en P0 por diseño"*. Javi ratifica
  seis asientos:
  1. **Mecanismo**: partición en niveles con fallback. Nivel preferente = supervivientes de A/B que
     cubren la frecuencia atendida; si no-vacío, la selección ocurre solo dentro de él; si vacío,
     conjunto completo con causa `frecuencia_corta_sin_candidato`. El RNG desempata solo dentro del
     nivel ganador (invariante constitucional intacto: partición booleana, nunca suma).
  2. **Concurrencia**: el paso atiende UNA frecuencia por hueco — la primera corta de la lista
     declarada con candidatos disponibles. Cita literal: *"Orden de precedencia vigente para el
     catálogo y objetivos actuales: legumbre ≻ pescado."* (Evidencia: barrido F1 de 1.200
     combinaciones, legumbre nunca supera 2 de forma natural.) Contar cobertura de múltiples cortas
     por plato = sumar = prohibido.
  3. **Verdura**: sub-regla diaria PREVIA a los contadores semanales — si el día no tiene verdura y
     hay candidatos que la cubren (`estado:'conocida'`, ejes no vacíos), ese es el nivel preferente.
     Infraconteo declarado: freeform (`'desconocida'`) NUNCA satisface el predicado — sesgo
     conservador, se prioriza de más, nunca de menos; el paso ramifica sobre `estado` y JAMÁS invoca
     `ejesVerdura` sobre `'desconocida'` (el throw del resolver es contrato, no obstáculo).
     Corrección futura: anotación editorial (sesión de ingesta ya en cola desde D-022/D-023).
  4. **Activación y veda**: una frecuencia semanal "va corta" si su contador < target, evaluado en
     cada hueco. Veda de un día por EVENTO de contador: el estado registra los días en que cada
     contador se incrementó (por CUALQUIER vía: ancla, sobra, capricho o selección libre); la veda
     está activa si ese día es hoy o el día anterior, y el paso 4 no atiende esa frecuencia mientras
     dure. Verdura queda EXENTA de la veda (predicado diario: atenderla a diario es su trabajo).
  5. **Contador**: consumo, no cocinado — incrementa una vez por colocación consumida, venga de
     ancla, sobra, capricho o selección libre. Estado local del walk, recomputable desde las
     colocaciones del propio paseo, sin persistencia (R4 intacto). Un plato incrementa como máximo
     un contador semanal (`proteinType` mutuamente excluyente).
  6. **Targets ratificados**: `DEFAULT_WEEKLY_TARGETS = {pescado:3, legumbre:3, verduraDiaria:1}`.
     Semántica: SUELOS, no cuotas ni techos. Pescado 3 por AESAN (coincide con el cap legacy por
     razón propia, no por herencia). Legumbre→4 (AESAN) queda como pregunta ABIERTA de F5, NO como
     target actual (el universo real no la produce hoy: verificado, ninguna legumbre real supera 3).
  - **STOP y resolución previa a implementar (contradicción encontrada, no en Fase 0 sino al mapear
    el punto de inserción contra el catálogo de tests existente)**: `resolveDishComposition` es la
    ÚNICA fuente de `proteinType`/`verdura` (no hay atajo, no es campo crudo del schema) y lanza
    "origen indeterminado" sobre cualquier `id` no resoluble; `runWalk.test.js` v6-v13 usan ids
    sintéticos (`rot()`/`genRotativos()`/`anchorEverythingExcept()` → `anchorFillN`) que NO resuelven
    — con contadores en 0 al arrancar, el paso 4 habría lanzado antes de llegar a la aserción en la
    mayoría del archivo (confirmado empíricamente: `resolveDishComposition({id:'rot0'})` y
    `({id:'anchorFillN'})` lanzan). Javi pidió verificación en tres puntos antes de decidir:
    1. **Inercia de selección**: tupla neutral diseñada — `{tmpl,P:'pollo',C,V:null,V2:null,S,cookM}`
       → `P_TO_PROTEINTYPE.pollo==='ave'` (`compositionResolver.js:39`, fuera de
       `{legumbre,pescado}`) y `ejes=[V,V2].filter(v=>v!==null)===[]` (`compositionResolver.js:158`,
       no satisface verdura) → confirmado por citas: bajo los asientos 1-3, un pool 100%-neutral cae
       SIEMPRE a fallback honesto (f2) en todo hueco de v6-v13 — cero efecto sobre qué plato gana.
    2. **Sensibilidad de log**: enumeración exhaustiva de `toHaveLength`/igualdad estricta sobre
       decisionLog en `runWalk.test.js` (líneas 75/99/130/139/362/430/492 en el estado pre-PR) —
       ninguna se rompe si el paso 4 se pliega dentro de la MISMA entrada de relleno existente (no
       entradas nuevas); cero uso de `.evidencia).toBe(...)` o `.causa).toBe(...)` sobre las causas
       propias del bucle genérico. Cero igualdades estrictas en riesgo.
    3. **Colisiones**: `comboIdentityKey` de la tupla neutral (`["caliente_clasico","pollo","arroz",
       null,null,null,"guisado"]`) verificado contra los 241 platos reales (`dishes.json`) — sin
       colisión.
    - Resolución (ratificada, cero igualdades estrictas encontradas → nada que subir): la resolución
      de composición se envuelve en captura DENTRO de `frequencies.js` únicamente (el resolver no se
      toca); un `id` no resoluble ("origen indeterminado", único mensaje capturado — cualquier OTRO
      error del resolver se re-lanza sin capturar, un bug real de catálogo no se enmascara) se trata
      como la vista neutral verificada arriba. Confirmado en runtime: los 417 tests pre-existentes de
      `src/engine2` siguieron VERDES sin modificar ni un test tras integrar el paso 4.
  - **Implementación**: `src/engine2/walk/frequencies.js` (módulo nuevo). `resolveFrequencyVista`
    (captura tolerante, ver arriba), `satisfaceVerdura` (lee `estado` directo, nunca invoca
    `ejesVerdura`), `createFrequencyState`/`registerConsumption`/`initFrequencyState` (estado
    recomputable: contadores, días de incremento por campo, días con verdura), `chooseFrequencyLevel`
    (núcleo puro de la cascada, `getVista` inyectable para tests — mismo patrón que
    `filterSurvivors`/D-023). `runWalk.js`: `initFrequencyState(p1aSlots)` tras calcular `usedIds`;
    `registerConsumption` tras la colocación del capricho Y tras cada selección genérica;
    `chooseFrequencyLevel` entre `candidatesB` (fin de B) y la selección final — el RNG solo ve
    `candidatesFinal` (el nivel). `weeklyTargets.js`: valores actualizados a `{pescado:3,legumbre:3,
    verduraDiaria:1}`, docstring corregido (ya no "sin consumidor": paso 4 es su primer consumidor).
- Evidencia:
  - Falsables demostrados ROJO→revert→VERDE con mutación deliberada sobre el módulo real en
    construcción (`sha256sum` de `frequencies.js`/`runWalk.js`/`weeklyTargets.js` idéntico
    antes/después de CADA ciclo — `1c50003f...`/`a9b05466...`/`744d43e1...`):
    f1+f3 (ignorar `nivel`, RNG sobre `candidatesB` completo en `runWalk.js` → el neutro sin target
    ni verdura gana en el fixture real de `runWalk.frequencies.test.js`); f2 (fallback devuelve
    `nivel:[]` en vez de `candidatesB` → cae la aserción de conjunto completo); f4 (orden
    `['pescado','legumbre']` invertido → legumbre deja de atenderse primero, 2 tests caen); f5
    (`vedado=false` siempre → ambas vías de incremento, sobra/ancla Y selección propia, dejan de
    vedar el día siguiente); f7 (sub-regla de verdura desactivada → legumbre gana en vez de verdura
    pese a evaluarse primero por asiento); f8 (`ejesVerdura(vista)` en vez de leer `estado` → lanza
    literalmente sobre `'desconocida'`, 2 tests caen con el mismo mensaje que el resolver real); f9
    (`initFrequencyState` deduplica por `dishId`, "cocinado" en vez de "consumo" → 3 incrementos
    esperados bajan a 1); f10 (`weeklyTargets.js` revertido a `{pescado:2,legumbre:2}` → tripwire
    literal cae). Las 8 mutaciones revertidas una por una; checksums idénticos tras cada reversión.
  - Suite dirigida: `npx vitest run src/engine2` → 34 archivos / 447 tests VERDE (417 base + 24 en
    `frequencies.test.js` + 5 en `runWalk.frequencies.test.js` + 1 tripwire en `weeklyTargets.test.js`).
    Suite completa: `npx vitest run` → 62 archivos / 688 tests VERDE. Tripwires (`-t "tripwire"`) → 6
    archivos / 35 tests VERDE. `eslint` sobre los 6 archivos tocados/creados → 0 problemas.
  - `git diff --stat origin/main -- src/engine src/engine2/dishes src/engine2/memory
    src/engine2/skeleton src/engine2/walk/expandWeekArc.js src/engine2/walk/vetoes.js scripts` →
    vacío (resolver, F3, ancla/veto del walk, motor viejo, scripts intactos — ninguna ruta prohibida
    tocada). `sha256sum scripts/phaseB2/output/dishes.json` idéntico (`a8fe0abb...`).
  - Grep manual de `score|rank(ing)?|top-?N` sobre `frequencies.js` → limpio (confirmado también por
    el tripwire automático `tripwire-no-score.test.js`, que escanea `src/engine2/` recursivo sin lista
    manual); grep de imports `.../engine/` o `.../eval/` sobre `frequencies.js`/`runWalk.js` → limpio.
  - Fixtures reales localizadas dinámicamente (nunca ids hardcodeados) vía `loadCatalog()` +
    `resolveDishComposition`: 18 platos `proteinType==='legumbre'` con `momento` incluye `'comida'`;
    plato neutro sin verdura (`["pasta","huevo","pasta",null,null,"ajillo","revuelto"]`) — único
    hallado en el catálogo real sin ejes de verdura. Verificado por barrido: NINGÚN plato real de
    legumbre/pescado carece de verdura — los tests de la veda a nivel de mecanismo puro (f5) usan
    vistas sintéticas para aislar el layer semanal de la sub-regla de verdura; el nivel de
    integración (f3/f12) usa el catálogo real aceptando que la narración puede ser
    `frecuencia_verdura_diaria` en vez de `frecuencia_semanal_atendida` cuando ambas coinciden — la
    propiedad probada (RNG restringido al nivel, narrabilidad) es válida en cualquiera de los dos
    casos.
  - Cero aserciones preexistentes tocadas (v1-v14 de `runWalk.test.js`, todo `expandWeekArc.test.js`,
    todo `buildWeekArc.test.js`/`buildWeekArc.vetoAncla.test.js`, `vetoes.test.js`) — confirmado por
    la suite verde sin modificar ni un `expect` de sesiones anteriores.
- Decide: Javi (ratificación de sesión 2026-07-07, ejecutada en `feature/f4-p2b-ii-frecuencias`
  sobre `main` post-D-023).
- **Addendum (mismo PR, previo a autorización de push) — ratificación POST-HOC CON ENMIENDAS de la
  tolerancia a ids irresolubles (asiento previo: captura por regex de mensaje)**:
  1. **Discriminación por tipo, no por mensaje**: `compositionResolver.js` gana
     `export class UnresolvableOriginError extends Error {}` — AÑADIDO DE SUPERFICIE, sin cambio de
     semántica: el único punto de lanzamiento del caso "origen indeterminado"
     (`resolveDishComposition`, antes `new Error(...)`) pasa a `new UnresolvableOriginError(...)`,
     mismo mensaje, misma condición. Verificado que ningún test de `compositionResolver.test.js`
     dependía del tipo genérico (`r1` solo hace `.toThrow(/id_inventado_sin_mapeo_alguno/)`, regex
     de mensaje). `frequencies.js` (`resolveFrequencyVista`) discrimina ahora por
     `instanceof UnresolvableOriginError`, no por `/origen indeterminado/.test(err.message)`.
  2. **Narración de la neutralización**: `createFrequencyState` gana `idsIrresolubles: new Set()`;
     `resolveFrequencyVista(dish, onIrresoluble)` invoca el callback una vez por sustitución;
     `registerConsumption`/`chooseFrequencyLevel` sin `getVista` explícito construyen su propio
     resolver por defecto atado a `state.idsIrresolubles`. `runWalk.js`, al final del walk (una vez,
     no por hueco): si `freqState.idsIrresolubles.size > 0`, una entrada `evento:true`,
     `causa:'paso4_ids_irresolubles'`, evidencia con conteo + ids ordenados. Verificado (`runWalk.
     frequencies.test.js`, describe "v16"): catálogo 100% sintético (patrón v6-v13) produce
     EXACTAMENTE 1 entrada de este tipo citando los ids sintéticos; catálogo real produce 0. Cero
     test preexistente afectado — confirmado con la suite completa VERDE (690 tests) y
     específicamente: la entrada es `evento:true` (fuera de `rellenos`, no toca `toHaveLength(14)` de
     v1/v11), causa distinta de toda causa preexistente (sin colisión con `.find` por causa), sin
     `day`/`momento` (no colisiona con búsquedas por día). El punto 2 de la verificación de Fase 0
     (`.toContain` tolerante a texto añadido) sigue cubriendo esto: la nueva entrada es aditiva, no
     reescribe ninguna evidencia existente.
  3. **Riesgo nombrado + invariante compensatorio**: la tolerancia (capturar `UnresolvableOriginError`
     y sustituir vista neutral) tiene un riesgo real: un `id` CORRUPTO en el catálogo real (typo,
     entrada mal generada) atravesaría el paso 4 como neutral — sin cobertura de target ni verdura —
     EN SILENCIO si no fuera por el punto 2. Invariante compensatorio citado: D-021 verificó en
     runtime *"241 platos, 178 resuelven como tupla... 63 hacen join limpio... 0 platos sin origen
     determinable (`neither: 0`)"* — el catálogo real de HOY no tiene ids corruptos, por eso los 417
     tests base + todos los de esta sesión sobre catálogo real (`loadCatalog()`) producen CERO
     entradas `paso4_ids_irresolubles` (verificado, punto 2 de este addendum). Si el catálogo
     cambiara y se colara un id corrupto, la entrada narrada del punto 2 ES la alarma — deja de ser
     silencio. La tolerancia es, por tanto, aceptable HOY (protege tests, no oculta nada del catálogo
     real) pero condicionada a que D-021 siga siendo cierto; si `neither` dejara de ser 0, este
     addendum deja de sostenerse y requiere revisión.
  4. **Falsables faltantes en el reporte anterior — f6 y f12, mutación dirty→red real sobre el módulo
     (ausentes en la primera pasada; corregido aquí)**:
     f6 (`frequencies.js`: condición de verdura mutada a
     `!diasConVerdura.has(day) && !diasConVerdura.has(diaAnterior(day))` — veda errónea aplicada a
     verdura — el test "Lunes y Martes... se atiende en AMBOS días" cae: Martes pasa de
     `frecuencia_verdura_diaria` a `frecuencia_corta_sin_candidato`); f12 (`frequencies.js`: ambas
     plantillas de evidencia mutadas para omitir `"descartados a nivel inferior: [...]"` — el test de
     `runWalk.frequencies.test.js` que verifica `.toMatch(/descartados a nivel inferior/)` cae,
     evidencia recibida sin esa cláusula). Ambas revertidas; `sha256sum` de `frequencies.js`
     idéntico tras cada reversión (verificado junto con las 8 mutaciones previas + esta ronda: 3
     mutaciones nuevas — narración, f6, f12 — 11 en total para esta componente).
  5. **Delta de tripwires 5/34 → 6/35, explicado**: NO es un tripwire constitucional nuevo. Causa:
     el describe de `weeklyTargets.test.js` para f10 se nombró *"...tripwire de política..."* — la
     palabra "tripwire" en el NOMBRE del test coincidió con el filtro `-t "tripwire"` que el ritual
     usa para correr los 4 guardianes de CI (`tripwire-no-score`, `tripwire-eval-isolation`,
     `tripwire-engine2-engine-isolation`, `tripwire-platetype-enum`) — vitest filtra por substring de
     nombre de test/describe, no por archivo. Ningún guardián nuevo se añadió. Corregido: renombrado
     a *"guardarrail de política"* (comentario explícito en el archivo citando por qué se evita la
     palabra) — el conteo vuelve a 5 archivos / 34 tests tras el rename, verificado.
  - Suite tras el addendum completo: `npx vitest run` → 62 archivos / 690 tests VERDE (688 + 2 de
    "v16: narración de neutralización"). `-t "tripwire"` → 5 archivos / 34 tests VERDE (delta
    explicado y corregido, punto 5). `eslint` sobre los 6 archivos tocados → 0 problemas.
  - Regla de proceso ratificada por Javi, efectiva desde ahora (no solo para esta sesión):
    **"Verificación limpia no autoriza implementación."** Un análisis que confirma "cero efecto" es
    INPUT para que Javi autorice, nunca sustituto de esa autorización explícita. Guardado como
    memoria de feedback para sesiones futuras.

## D-025 — [2026-07-07] Contrato del adaptador humanScore (F4-P2c): criterio de
  satisfacción de D-020 vía medición parcial tipificada
- Decisión. D-020 queda satisfecho midiendo lo medible hoy, sin esperar
  desbloqueos que el diagnóstico D0 demostró inexistentes: la asimetría
  de tupla es permanente por diseño (D-021, freeform sin tupla), y
  ninguna anotación pendiente de la sesión editorial alimenta
  submétricas actuales.
- Contrato de reporte. El adaptador produce, por cada submétrica, la
  terna obligatoria valor / cobertura / estado, con motivo cuando el
  estado no es `completa`. `estado` clasifica la observabilidad de la
  métrica en engine2, no el resultado de la ejecución: un
  `no_observable` nunca es interpretable como error. La cobertura sola
  no discrimina — un 0/14 por limitación estructural y un 0/14 por
  fallo de ejecución serían indistinguibles sin el estado. El estado
  hace auditable la ausencia, no solo visible.
- Enum de estado: {completa, parcial, no_observable, needs_history,
  needs_engine2}. Los dos últimos reutilizan el vocabulario
  preexistente de humanScore.js para las categorías que ya describía,
  evitando sinónimos nuevos para estados ya nombrados.
- Vocabulario de ausencia (dos categorías, con nombre propio):
  - derivable_parcial: existe información relacionada pero incompleta.
    Hoy: vocabulario de tupla (tmpl/S/cookM/C), recuperable solo para
    origen scaffold vía resolveDishComposition → repeticionSalsa,
    repeticionTecnica, platoCuchara, lado-plato de
    continuidadEntrenoHidrato.
  - no_observable: engine2 no contiene ningún dato equivalente, ni
    derivable → effectiveMood (domingoReconfortante),
    metadata.facilidad (diaFacilTrasElaborado).
- Racional del vocabulario: evita que en el futuro se intente "subir
  la cobertura" de una métrica de la segunda categoría — no hay dato
  del que derivar. Análogo al escopado de precedencias: la limitación
  queda declarada, no implícita.
- Ubicación: scripts/ (subdirectorio de fase). El adaptador es
  instrumento de evaluación, no pieza del motor: pertenece al tooling,
  no al runtime. Precedente: F2 (scripts/phaseB1/). No importa
  src/eval/**: el instrumento evalúa el contrato de engine2 sin
  depender de las asunciones estructurales del instrumento legacy.
- Deuda registrada (baja prioridad, fuera de este PR): no existe
  actualmente un control automático que impida importar el adaptador
  desde el motor.
- Alcance de comparación: el baseline legacy (post-Fase-1, commit
  3799dc1) nunca midió meals freeform (fixtures con freeFormPool: [],
  isLegibleMeal excluye freeform). Toda comparación engine2↔baseline
  debe reportar cobertura junto al valor; los denominadores diferirán
  estructuralmente (engine2: 14 huecos fijos, sin
  desayuno/almuerzo/merienda).
- Decide: Javi (ratificación POST-HOC CON ENMIENDAS de sesión 2026-07-07, mismo PR/rama).

## D-026 — [2026-07-07] D-020 queda satisfecho: medición comparativa ejecutada (F4-P2c-D2)
- Decisión/Hallazgo: D-020 queda satisfecho. La medición comparativa
  engine2 vs baseline legacy, bajo el contrato de terna de D-025, se
  ejecutó sobre las 9 fixtures del baseline aprobado
  (`src/engine/tests/baselineFixtures.js`) mediante la estrategia de
  comparación E1 (ratificada por Javi, sesión 2026-07-07): por cada
  fixture legacy se construyó la entrada engine2 análoga donde el
  concepto existe (`trainingDays`, `intolerances`); el resto del
  profile legacy (`goal`, `weight`, `activity`, `hambre`,
  `experiencia`) se declaró SIN_TRADUCCION, sin aproximaciones
  forzadas.
- Artefacto: `scripts/phaseP2c/output/comparacion-D2.{json,md}`,
  introducido en el commit `02c30c77e8dc082e4f9d11c7226e5344dd9a3ef9`
  (junto con `scripts/phaseP2c/compareD2.js` y
  `scripts/phaseP2c/compareD2.test.js`).
- Contrato de reporte: el de D-025 (terna valor/cobertura/estado por
  submétrica). No se re-narra aquí; este asiento cita, no repite.
- Controles falsables verificados en `compareD2.test.js`:
  reproducibilidad por seed (misma seed → mismo artefacto; seed
  mutada → artefacto distinto), honestidad de presentación
  (no_observable/needs_history/needs_engine2 nunca lleva valor
  numérico engine2, ni siquiera 0), y sha256 de
  `humanScoreAdapter.js` sin cambios respecto a D1.
- Fuera de alcance de este PR (por instrucción explícita, sin roadmap
  vigente en el repo — ver Fork F1, sesión P2c-D2): la deuda de
  control automático que impida importar el adaptador desde el motor
  ya quedó registrada en D-025 y no se duplica aquí.
- Decide: Javi.

## D-027 — [2026-07-07] Cierre del gate F4: comparabilidad de métricas parciales en D2
- Decisión/Hallazgo: Las submetricas con estado `parcial` solo son
  comparables entre engine2 y la fixture legacy correspondiente
  (comparación vertical). No son comparables transversalmente entre
  fixtures: la cobertura depende de la combinación seed × legibilidad del
  plan generado. Adicionalmente, toda fixture cuyo único diferenciador
  legacy sea un campo SIN_TRADUCCION (goal, hambre, experiencia, weight,
  activity) es, del lado engine2, otra realización del mismo espacio de
  generación que su fixture base — cualquier comparación entre ambas
  mediría varianza de seed, no el efecto del campo. Alcance: catálogo y
  fixtures actuales de D2.
- Evidencia: comparacion-D2.{md,json} (HEAD a62c935); lectura
  interpretativa en scripts/phaseP2c/output/insumo-cierre-F4.md.
- Decide: Javi.

## D-028 — [2026-07-08] Contrato de consumo de composición confirmada + secuencia de la cadena editorial (enmienda a D-021)
- Decisión/Hallazgo: se fija el contrato que gobierna cómo el motor consume gluten/lactosa/verdura
  cuando existe confirmación humana del cocinero, y se corrige el orden de trabajo de la cadena
  editorial. Nace de un D0 read-only (EDITORIAL-D0) que demostró que el material de anotación
  existente (Anotacion_cocinero_242_v4.xlsx) no tiene consumidor en el motor: aunque el cocinero
  anote alérgenos, ninguna ruta de código los persiste, y compositionResolver fija "desconocida"
  incondicional para scaffold. Recoger confirmaciones sin consumidor es coste humano al vacío.

  PRINCIPIO DE SECUENCIA (registro como invariante de la fase editorial):
  la cadena correcta es contrato de consumo -> generador reproducible -> sesión editorial ->
  ingesta -> motor. El trabajo humano de anotación NO se solicita hasta que existe un contrato
  que define qué campos se consumen, cómo se representan y qué garantías exige. Unifica dos
  principios previos: "dato confirmado entra al motor solo con consumidor definido" +
  "verificar, nunca deducir procedencia". Corolario: un XLSX no es una fuente; una fuente es
  reproducible desde un generador conocido; una discrepancia de procedencia no se resuelve
  adoptando el artefacto.

  CONTRATO DE COMPOSICIÓN (gluten, lactosa, verdura):

  1. Tres estados con precedencia estricta: confirmada > derivada > desconocida. La confirmación
     es una capa que cubre la derivación donde existe; la derivación de D-021 NO se deroga, sigue
     siendo el defecto. Esto es una ENMIENDA a D-021: se admite un tercer origen (confirmado) con
     precedencia sobre el derivado. La composición sigue sin almacenarse como campo del dish; lo
     que se almacena es la confirmación, aparte.

  2. Valor efectivo vs. traza: el resolver expone valorEfectivo + origen (confirmada|derivada|
     desconocida) + valorDerivado (presente solo si hubo derivación sobreescrita por confirmación).
     Propósito: hacer detectable por barrido el caso confirmado != derivado — la señal de
     divergencia que habría cazado la discrepancia D-1 de las 6 anclas antes de producción.

  3. Asimetría scaffold/freeform declarada como parte del contrato, no detalle de implementación:
     - gluten:  scaffold=desconocida (SE ANOTA) | freeform=derivada (conocida)
     - lactosa: scaffold=desconocida (SE ANOTA) | freeform=derivada (conocida)
     - verdura: scaffold=derivada (slot V)      | freeform=desconocida (SE ANOTA)
     El cuaderno NO pide el lado ya derivado (sería trabajo redundante). Excepción por iniciativa
     del cocinero: el contrato admite una confirmación que corrija un derivado que el cocinero
     considere erróneo, pero el cuaderno no lo solicita. El lado derivado se MUESTRA en modo
     lectura (bloqueado) junto a la celda activa, para que el cocinero vea el punto de partida sin
     abrir otro fichero.

  4. Almacén lateral, no campo del esquema: las confirmaciones viven en
     dishCompositionConfirmations.json (nombre que describe el dato — colección de confirmaciones
     sobre composición — no su efecto). Estructura: { "version": 1, "confirmed": { "<dishId>":
     { "gluten": {valor, por, fecha}, ... } } }. Solo aparecen campos efectivamente confirmados;
     ausencia = cae a derivada/desconocida. Razón: la confirmación editorial no describe el plato,
     describe nuestro conocimiento del plato — es metadato, no dato estructural. dishes.json
     conserva sus 10 REQUIRED_FIELDS intactos; validateDish, schema.js y el tripwire de esquema no
     se tocan; snapshots antiguos no se rompen. La regla "el esquema crece por demanda" se respeta
     sin hacer crecer el esquema: el consumidor demandado se satisface con tabla lateral.

  5. Comportamiento del resolver (sin fijar firma — eso es implementación): el resolver consulta
     opcionalmente el almacén de confirmaciones antes de aplicar la derivación estructural. Sin
     almacén, se comporta byte a byte como hoy (garantía de no-regresión, testeable dirty->red).

  INVARIANTE DE CUSTODIA EDITORIAL: al almacén de confirmaciones solo entra dato con confirmación
  humana explícita (ya anotado=sí AND por no vacío). Ninguna propuesta heurística, ningún
  pre-relleno, ninguna derivación cruza a la capa confirmada. La derivación vive en el resolver;
  la confirmación vive en el lateral; nunca se copia una en la otra. Testeable: control que
  intenta ingerir una fila "ya anotado=no" y verifica rechazo.

  FRONTERAS (lo que este contrato NO decide): no fija la representación interna de un eje de
  verdura (sub-contrato posterior); no rescata congelable/proteinType/glutenFreeAdaptable ni los
  demás tags huérfanos del scaffold (D-4 del D0) — siguen sin consumidor y fuera; es contrato de
  composición-para-consumo, no un rescate general de tags.

- Evidencia: EDITORIAL-D0 read-only, ritual verificado (HEAD==origin/main==bace88a, 0 archivos
  tocados). Hallazgos citados en vivo: la sesión editorial no tiene consumidor
  (importAnotacion.js:23-26 descarta gluten/lactosa "fuera de contrato — no se promueven";
  compositionResolver.js:168-169/194 fija desconocida incondicional para scaffold/freeform);
  esquema hoy = 10 REQUIRED_FIELDS (schema.js:33-44), composición nunca almacenada
  (compositionResolver.js:1-5, ratificado en D-021); asimetría verificada en vivo sobre el
  catálogo real (hash a8fe0abb…): gluten/lactosa desconocida=178 scaffold, verdura desconocida=63
  freeform; el v4 no tiene columna verdura (D-2 del D0); procedencia del v4 no reproducible desde
  el exportCocinero.js del árbol (D-1/D-5 del D0: nombre sin _v4, 18 vs 17 columnas, anotado_por
  y "reglas cocinero v3" ausentes en todo el repo, PREVIOUS_ANNOTATIONS divergente de xlsx y de
  dishes.json). Contrato ratificado punto por punto: §1 coexistencia, §2 asimetría, §3 lateral,
  §4 sin firma, §5 invariante, más cuatro ajustes (valorEfectivo/traza; derivados en lectura;
  renombre a dishCompositionConfirmations.json; campo version).
- Decide: Javi.
## D-029 — [2026-07-08] Vocabulario cerrado de verdura y criterio de clasificación de dominio
- Decisión/Hallazgo: se asienta el vocabulario canónico de ejes de verdura
  definido en verduraVocabulary.json (versión 1) y el criterio de dominio que lo
  gobierna, ratificado por consulta al cocinero (experto de dominio) e
  implementado en el eslabón 4 de D-028 (PR fase-editorial-d3-ingesta). Este
  asiento registra decisiones YA consolidadas por implementación y validación;
  no introduce interpretación nueva.

  CRITERIO DE DOMINIO (regirá casos futuros de clasificación):
  - Función culinaria en el plato por encima de la naturaleza botánica.
  - Coherencia entre ingredientes análogos por encima de la precisión individual:
    ingredientes con la misma función culinaria se clasifican igual.
  - Los ejes del vocabulario son CONVENCIONES LÉXICAS de este proyecto, NO
    afirmaciones botánicas. Que un token pertenezca al vocabulario de verdura
    significa "en este proyecto este token se clasifica como eje de verdura",
    no una aseveración sobre su naturaleza botánica.
  - Cuando un mismo token puede desempeñar más de un papel culinario y el
    vocabulario no distingue esos roles, se clasifica según el papel culinario
    que se adopta como convención para este proyecto.

  VOCABULARIO: el conjunto vigente es el contenido de verduraVocabulary.json
  (versión 1). El fichero es la fuente canónica; este asiento fija el criterio y
  las causas, no la enumeración.

  CASOS FRONTERA QUE MOTIVARON EL CRITERIO (los nombres son ejemplos
  ilustrativos del tipo de caso, no parte de la norma; el conjunto vigente vive
  en verduraVocabulary.json):
  - Función culinaria por encima de la botánica — un token cuya naturaleza
    botánica difiere de su uso culinario dominante (ej.: maíz cuando se emplea
    como grano dulce en ensalada/salteado, botánicamente cereal): se clasifica
    por función, y la Leyenda instruye sobre la forma que NO cuenta (ej.: el
    mismo token como harina o tortilla).
  - Coherencia entre análogos — un ingrediente análogo a otro ya presente en el
    vocabulario (ej.: edamame respecto a los guisantes, ambos legumbre fresca de
    vaina con la misma función): entra por coherencia entre análogos.
  - Eje propio — un ingrediente con perfil y papel en plato propios, distinto de
    cualquier hortaliza (ej.: setas, hongo con perfil umami, a menudo sustituto
    de proteína): eje propio, separado del eje hortícola más cercano (ej.:
    champiñones queda como eje distinto).
  - Exclusión por dominio — ingredientes que aportan sabor/acidez en dosis
    pequeñas y no son componente hortícola del plato (ejs.: aceitunas
    —condimento—, pepinillos —encurtido—, chile/guindilla —picante—): fuera del
    vocabulario v1 por criterio de dominio. Un plato cuya única "verdura" sea uno
    de estos se confirma como [] (sin verdura).
  - Colapso a un eje existente — una mezcla comercial de hojas (ej.: mezclum):
    no es eje propio en v1; colapsa por instrucción de Leyenda hacia el eje de
    hoja más cercano (ej.: lechuga), documentando que representa el concepto
    "hojas de ensalada".

  VERSIONADO Y CRECIMIENTO: verduraVocabulary.json lleva { "version": 1, ... };
  version !== 1 -> throw al cargar (misma regla C3 que el lateral de D-028). El
  vocabulario crece por PR de datos ratificado, nunca por anticipación. La
  asimetría de coste es intencional: ampliar es barato (el código nuevo rechaza
  -> se añade el eje -> re-ingesta sobre lateral aún vacío), encoger o re-mapear
  es caro (tocaría confirmaciones ya custodiadas). Por eso las decisiones "fuera
  del v1" son revisables por evidencia futura, no inmutables.

  DEUDAS REGISTRADAS (no resueltas aquí):
  - Mezcla de hojas: posible separación futura en un eje de "hojas de ensalada"
    distinto del eje de lechuga (v2 del vocabulario).
  - Token de doble rol: el vocabulario léxico plano no expresa el papel
    culinario; la clasificación por papel-convención basta mientras un uso
    predomine. Si un token pasa a tener dos usos co-dominantes, la aproximación
    deja de bastar y requeriría decisión arquitectónica (ejes con rol, o canon
    por-plato). Trigger de revisión: alta de platos que introduzcan un token en
    un papel culinario no contemplado por su clasificación actual.

- Evidencia:
  DOMINIO — consulta al cocinero (experto de dominio) sobre los casos frontera;
  criterio adoptado: función culinaria sobre botánica, coherencia entre análogos,
  ejes como convención léxica del proyecto. Las decisiones de inclusión,
  exclusión y colapso recogidas arriba son las respuestas del experto ratificadas
  por Javi.
  IMPLEMENTACIÓN — verduraVocabulary.json y verduraVocabulary.js creados en el
  commit 6c68d5c (PR #22, merge 3e76b16); criterio de dominio documentado en la
  cabecera de verduraVocabulary.js; version !== 1 -> throw. Consumido por la
  ingesta con validación estricta (importCuadernoV5.js: código fuera del canon ->
  VerduraVocabularyError; [] aceptado como "sin verdura confirmado" distinguible
  de ausencia).
- Decide: Javi.

## D-030 — [2026-07-13] Reconstrucción documental de la cadena editorial (EDITORIAL-D0..D6)

RECONSTRUCCIÓN, fecha 2026-07-09. Este asiento se escribe hoy sobre hechos
verificados en git; NO preserva el rationale del momento de cada decisión.
Fuente del diagnóstico: docs/auditoria-registro-2026-07-09.md.

  Mapa de los siete eslabones de la cadena editorial, cada uno con lo que
  produjo y su merge:
  - EDITORIAL-D0: diagnóstico read-only. Sin PR ni commit propio — es
    diagnóstico, no cambio. Su prosa quedó recogida en D-028
    (DECISIONS.md:1163-1225 de este mismo archivo).
  - EDITORIAL-D1: contrato de consumo de composición confirmada. PR #20,
    merge a9c0c06364a2c48d1e5fdf82bc0f391c9436f6b3 — produjo la entrada D-028.
  - EDITORIAL-D2: generador reproducible del cuaderno de anotación v5. PR #21,
    merge 35169c7d4c66da451a9c8e6705e76e0cd137e1a3 — creó
    scripts/phaseB2/exportCuadernoV5.js (D-028 lo describía sin nombrarlo;
    nombrarlo explícitamente es un hallazgo del informe de PR-1,
    docs/auditoria-registro-2026-07-09.md).
  - EDITORIAL-D3: ingesta del cuaderno hacia el almacén lateral, más el
    vocabulario cerrado de verdura. PR #22, merge
    3e76b162919b55fb39b51c76508f6ca87762cf27 — creó
    scripts/phaseB2/importCuadernoV5.js y verduraVocabulary.{js,json}.
  - EDITORIAL-D4: vocabulario cerrado de verdura y criterio de clasificación
    de dominio. PR #23, merge 70cd8ceb9992f7f4dfb0d726962559c126c86c6a —
    produjo la entrada D-029.
  - EDITORIAL-D5: sesión editorial humana con el cocinero. Sin commit por
    naturaleza — es sesión humana, no cambio de código. Confirmada
    factualmente por el propietario. Sin huella directa propia: la huella de
    D5 es la misma que la de D6, las 419 confirmaciones que D6 ingirió.
  - EDITORIAL-D6: ingesta real de las confirmaciones producidas en D5. PR #24,
    merge 2bb31c4a7a325e40855ab92bb14aa406e0806e03 — ingesta real de 419
    campos confirmados (241 platos) hacia
    scripts/phaseB2/output/dishCompositionConfirmations.json.

  Este asiento no clasifica ni deroga nada. Es un mapa, no un juicio.

- Evidencia: hashes de merge re-verificados en vivo (`git show <hash> --stat`)
  contra el estado real del repositorio en el momento de escribir este
  asiento; docs/auditoria-registro-2026-07-09.md (informe de PR-1, fuente del
  diagnóstico y del hallazgo de D2).
- Decide: Javi.

## D-031 — [2026-07-13] La ingesta real materializa "confirmado entra al motor"

RECONSTRUCCIÓN, fecha 2026-07-09. Este asiento se escribe hoy sobre hechos
verificados en git; NO preserva el rationale del momento de cada decisión.
Fuente del diagnóstico: docs/auditoria-registro-2026-07-09.md.

  Entrada separada de D-030 porque su objeto no es un eslabón más de la
  cadena, sino el principio que la cadena existía para hacer verdadero: los
  datos confirmados por el cocinero entran al motor; las propuestas
  editoriales nunca.

  Hito: PR #24, merge 2bb31c4a7a325e40855ab92bb14aa406e0806e03 — 419 campos
  confirmados (241 platos) ingeridos vía scripts/phaseB2/importCuadernoV5.js
  hacia el almacén lateral (scripts/phaseB2/output/dishCompositionConfirmations.json).

  PUNTO DE MATERIALIZACIÓN EN CÓDIGO (lo que hace de esto un principio y no
  un fichero): src/engine2/dishes/compositionResolver.js:247 lee el
  confirmado por dishId (`fuenteEditorial?.confirmed?.[dishId]`);
  :253-256 construyen cada campo de composición (containsGluten,
  containsLactosa, verdura) pasando el valor confirmado a
  buildCampoComposicion junto al valor derivado. buildCampoComposicion
  (líneas 185-194) da precedencia al confirmado sobre el derivado: si hay
  confirmado, origen='confirmada' y ese es el valorEfectivo, exista o no
  derivación; solo cuando no hay confirmado se usa el derivado. El hito no es
  "existe un JSON con datos" sino "el confirmado gana al derivado en la
  construcción de cada campo de composición".

  CONSECUENCIA REGISTRADA, NO DECIDIDA: la condición temporal que sostenía la
  congelación de exportCocinero.js — "coexiste con este generador sin
  tocarse" hasta que la cadena legacy muriera "en el PR de ingesta, eslabón 4
  de D-028" (comentario en scripts/phaseB2/exportCuadernoV5.js:9-19) — venció
  con este hito. La decisión sobre el futuro de la cadena legacy
  (exportCocinero.js + importAnotacion.js + runImportAnotacion.js + el
  v4.xlsx) queda para roadmap. No se decide aquí.

- Evidencia: PR #24, merge 2bb31c4a7a325e40855ab92bb14aa406e0806e03, re-
  verificado en vivo (`git show 2bb31c4 --stat`; conteos en
  scripts/phaseB2/output/ingestaReport.json: gluten 178 + lactosa 178 +
  verdura 63 = 419); src/engine2/dishes/compositionResolver.js:185-194,247,253-256
  leído en vivo; scripts/phaseB2/exportCuadernoV5.js:9-19 leído en vivo.
- Decide: Javi.

## D-032 — [2026-07-13] evaluateVetoFromVista como consumidor puro de valorEfectivo (F-V1→A1)

Decisión (fork F-V1, opción A1, ratificada 2026-07-13):
`evaluateVetoFromVista` (src/engine2/walk/vetoes.js) pasa a ser un
consumidor puro de `valorEfectivo`. No ramifica por `origen`. El throw
sobre `origen="confirmada"` (vetoes.js:65-68 al HEAD a0d95c0) se retira
porque la decisión que custodiaba ya no está pendiente: la precedencia
entre confirmada, derivada y desconocida es responsabilidad exclusiva de
`buildCampoComposicion` (compositionResolver.js:185-194 al mismo HEAD),
aguas arriba del veto, conforme al contrato D-028 §2.

Consecuencia de dominio: un plato con `gluten=false` confirmado por el
cocinero sobrevive al veto de un intolerante al gluten; con `gluten=true`
confirmado, es vetado con motivo "valor". El eje lactosa se comporta de
forma simétrica. La ausencia de valor mantiene el comportamiento vigente
(veto con motivo "desconocida") — no se decide aquí, ya estaba en código.

Causa en el momento de la decisión: el reconocimiento R-0 (2026-07-13,
sobre HEAD a0d95c0) verificó que el veto ya consume la vista con
precedencia resuelta (evaluateVetoFromVista recibe el resultado de
resolveDishComposition, vetoes.js:93) y que el camino confirmada es
estructuralmente inalcanzable en producción sin el cableado de
fuenteEditorial (tripwire de aridad en
src/engine2/dishes/tests/s2-fuenteEditorial-callsites.test.js:156-169).
Mantener una rama por origen en el consumidor reintroduciría lógica de
precedencia fuera de su función de custodia.

Fuera de alcance de esta decisión: (1) el cableado de
dishCompositionConfirmations.json a call-sites de producción — concern
separado, PR posterior; (2) el eje verdura, que no participa del veto
(FIELD_TO_COMPOSITION_KEY, vetoes.js:35-38) y pertenece al throw
`satisfaceVerdura`; (3) cualquier cambio al tratamiento de vistas
derivadas, que es comportamiento vigente.

Precondición registrada para el PR de código (PR-3): verificar y citar
cómo `buildCampoComposicion` puebla `valorEfectivo` para cada origen
(confirmada y derivada) antes de fijar criterios de aceptación, de modo
que estos descansen sobre comportamiento observado y no sobre suposición
implícita.

Referencias: D-028 §2 (contrato {origen, valorEfectivo?, valorDerivado?}),
D-023 (anclas), informe R-0 de 2026-07-13.

## D-033 — satisfaceVerdura: confirmada cuenta como conocida (F-SV1→A, F-SV2→A2) [2026-07-13]

**Contexto.** Segundo throw de S3 (frontera arquitectónica declarada
en EDITORIAL-S2, Fork D.2). `satisfaceVerdura` (src/engine2/walk/
frequencies.js) lanzaba ante `origen === 'confirmada'` porque el
predicado se escribió en el mundo de dos estados, donde
`origen === 'derivada'` significaba "conocida". Tras D-028 §2,
"conocida" tiene dos formas: derivada y confirmada.

**Hechos verificados en R-0 (HEAD 64bdc6e, 801/801):**
- El predicado actual es `origen === 'derivada' &&
  valorEfectivo.length > 0`. `origen` es portante, no accesorio:
  `desconocida` no trae `valorEfectivo` (compositionResolver.js:193),
  por lo que alguna guarda sobre origen debe sobrevivir (disciplina
  f8: nunca leer el valor sobre desconocida).
- Territorios disjuntos por construcción: en scaffold, verdura nunca
  es `desconocida` (derivación siempre presente,
  compositionResolver.js:218,228); en freeform, nunca es `derivada`
  (valorDerivado siempre undefined, compositionResolver.js:256).
  No existe conflicto derivada-vs-confirmada que arbitrar en este eje.
- El lateral contiene 63/63 confirmaciones de verdura sobre freeform;
  cero sobre scaffold. Una creencia previa de que cubrían dos
  poblaciones quedó falsificada por el reconocimiento.
- Únicos call-sites: registerConsumption y chooseFrequencyLevel
  (walk runtime). Sin consumidores de tooling.

**Decisión F-SV1 → A.** Una verdura confirmada satisface el predicado
del día en pie de igualdad con una derivada. Causa verdadera: la
confirmación es la palabra del cocinero sobre la composición real del
plato, con autoridad igual o mayor que una derivación de tupla; el
principio rector de la cadena EDITORIAL es que el dato confirmado
entra al motor. Consecuencia observable (solo tras el futuro PR de
cableado de fuenteEditorial, no antes): los platos freeform con
verdura confirmada dejan de ser invisibles para el cómputo semanal
(diasConVerdura) y para la preferencia de candidatos con verdura.

**Decisión F-SV2 → A2.** Formulación por enumeración positiva con
frontera: `derivada` y `confirmada` se enumeran como orígenes que
conocen la verdura; un origen no contemplado lanza. Causa verdadera:
misma doctrina que instaló el throw de S2 — las fronteras se declaran,
no se heredan por omisión. Si D-028 §2 creciera, este punto volvería
a preguntar en vez de suponer. Se descarta A1
(`origen !== 'desconocida'`) porque dejaría pasar en silencio
cualquier origen futuro como "conocido". Precedente: los helpers de
verdura ya lanzan ante estado no contemplado.

**Salvaguardas registradas para el PR de implementación (PR-4):**
1. Retirada segura por construcción: sin cableado de fuenteEditorial
   a call-sites de producción, `origen='confirmada'` es inalcanzable
   en runtime (corroborado: runWalk.frequencies.test.js sin
   ocurrencias). El wiring es PR posterior e independiente.
2. Precondición verificada: comprobar en el lateral si existe alguna
   confirmación de verdura con `valor: []` (cocinero afirmando
   "sin verdura"). El predicado la maneja (`length > 0` → false),
   pero los criterios de aceptación deben citar el caso observado,
   no supuesto.
3. VISTA_NEUTRAL (frequencies.js:78-81) queda fuera de alcance:
   política de fallback para irresolubles, shape `derivada`, no toca
   `confirmada`. NO TOCAR.
4. Test discriminante ratificado: vista sintética
   `{origen:'confirmada', valorEfectivo:['tomate']}` → true bajo A
   (false bajo la alternativa B descartada); control por mutación
   `valorEfectivo: []` → false.

Ratificado por Javi el 2026-07-13 sobre reporte R-0 en vivo.

## D-034 — buildPlatosRows: render de la fila confirmada (BP-1→A, BP-2a, BP-2b) [2026-07-13]

**Contexto.** Tercer y último throw de S3 (frontera arquitectónica
declarada en EDITORIAL-S2, Fork D.2). `buildPlatosRows`
(scripts/phaseB2/exportCuadernoV5.js) lanza vía `assertNoConfirmada`
ante `origen === 'confirmada'` en cada campo de cada fila. La pregunta
—qué muestra el cuaderno en una fila ya confirmada— es editorial: la
respondió el cocinero desde el oficio; la cara de custodia la ratificó
el arquitecto.

**Hechos verificados en R-0 (HEAD e434faf, 805/805):**
- El throw sigue vivo (exportCuadernoV5.js:76-83, llamado :125-127) y
  es inalcanzable en producción: el runner llama buildPlatosRows() sin
  fuenteEditorial (runExportCuadernoV5.js:39), luego ningún campo
  resuelve 'confirmada'. El propio código lo documenta (:71-72).
- El render de origen='confirmada' NO existe hoy: el throw corta antes
  de ensamblar la fila (:128). No es una modificación de comportamiento
  sino la definición primera de un estado nunca renderizado.
- confirmar_valor nace en blanco por literal incondicional '' (:134,
  137,140), vigilado por el test de custodia (:143-160). El lateral
  real (419 confirmaciones, 178 gluten + 178 lactosa + 63 verdura,
  15 de ellas verdura con valor:[], commit 2c5d4bb) NUNCA se lee de
  vuelta hacia el generador: lo escribe runImportCuadernoV5.js, no el
  export. No existe ruta import→export, ni para prellenar ni para
  vaciar.
- El bit de activación de la celda de confirmación es hoy
  origen_actual === 'desconocida' (:296-315): solo desconocida se
  desbloquea.
- valorActualVerdura usa hoy '(ninguna)' para el vacío derivado (:100).
- Hueco de cobertura: assertNoConfirmada se prueba para gluten y
  verdura, no para lactosa (:277-320).

**Decisión BP-1 → A (display por inyección) — arquitecto.** El valor
confirmado llega a valor_actual porque el runner inyecta el lateral
como fuenteEditorial y el resolver ejecuta la precedencia que ya sabe
hacer (buildCampoComposicion, compositionResolver.js:185-193). El
lateral NO se reescribe; 'confirmada' permanece distinguible en la
fuente; confirmar_valor sigue siendo el literal ''. Causa verdadera:
es la única lectura compatible con la guarda de idempotencia del runner
y con la doctrina de custodia de los dos throws previos. Se descarta B
(promoción: escribir el confirmado de vuelta en dishes.json y consumir
la entrada del lateral) porque colapsaría 'confirmada' en 'derivada',
destruiría el rastro de origen que PR-3/PR-4 protegen, y contradiría
el hash-gate del catálogo canónico.

**Decisión BP-2a → valor "sin verdura" — cocinero.** valor_actual de
una verdura confirmada muestra el valor confirmado. Para el vacío
confirmado (los 15 con valor:[]), la celda dice "sin verdura" como
afirmación culinaria sobre el plato — NO '(ninguna)', NO
"sin verdura — confirmado por ti". Causa verdadera (palabra del
cocinero): (1) '(ninguna)', con su paréntesis-comodín, colisiona
tipográficamente con 'desconocida', el estado del que precisamente hay
que distinguirlo en un repaso en diagonal; (2) añadir la procedencia a
la celda de valor viola la separación que el cuaderno ya sostiene —una
verdura confirmada con contenido dice "brócoli, zanahoria", no
"brócoli, zanahoria — confirmado por ti"; la procedencia se lee en las
columnas por/fecha. El vacío confirmado no es excepción a esa regla.
Corolario de coherencia: "sin verdura" reemplaza a '(ninguna)' para
AMBOS orígenes (derivada y confirmada), porque la afirmación es sobre
el plato, no sobre quién la hizo; derivada-vacía y confirmada-vacía
dicen lo mismo en valor_actual y se separan por origen_actual. Si el
diseño necesita marcar el vacío como valor especial frente a una lista
de códigos, se distingue por estilo (cursiva, otro tono de gris), no
por más palabras.

**Decisión BP-2b → celda editable siempre — cocinero.** La celda de
confirmación de una fila confirmada nace en blanco Y editable. El
predicado de activación pasa de `origen === 'desconocida'` a
`origen !== 'derivada'`: se desbloquean desconocida y confirmada; solo
la derivada firme queda gris-bloqueada. Causa verdadera (palabra del
cocinero): la protección contra el error accidental no es el candado
sino el ritual de firma ya existente —una escritura sin `por` no se
importa; un blanco no hace nada porque blanco significa "no tocado"—.
El candado solo añadiría fricción a la corrección, y la fricción en las
correcciones produce el peor resultado: datos que se saben mal y se
quedan mal por pereza. Analogía del oficio: corregir un escandallo es
tachar y escribir encima con firma y fecha, no pedir la llave. Cláusula
de reapertura: el candado tendría sentido el día que haya varios
anotadores y se quiera impedir que uno pise la firma de otro sin
ceremonia. Ese día no es hoy; cuando llegue, esta decisión se revisa.

**Límite de custodia para el lado ingesta (fuera de este PR;
gobierna el futuro PR de re-ingesta).** En el mundo de segunda pasada,
una celda de confirmación en blanco sobre una fila ya confirmada
significa "no tocado en esta ronda", NUNCA revocación de la
confirmación existente. El importador no debe interpretar blanco como
borrado. Es la regla que el propio cocinero estableció ("blanco
significa no tocado"), no una restricción impuesta. Hoy es inobservable
porque el ciclo de re-ingesta no existe; se asienta ahora para cerrar
la puerta antes de que se abra.

**Salvaguardas para el PR de implementación (PR-5):**
1. Retirada segura por construcción: sin fuenteEditorial en el runner,
   'confirmada' es inalcanzable en producción. El cableado del runner
   (inyectar el lateral) es PR posterior e independiente; el render se
   define y testea con vistas sintéticas.
2. El sucesor del test del throw cubre los TRES campos (gluten,
   lactosa, verdura), cerrando el hueco de lactosa observado en R-0.
3. El test de custodia (confirmar_valor nace '') debe permanecer verde
   sin cambios: BP-1→A no toca esa celda.
4. Casos de render a fijar por test: verdura confirmada con contenido
   → join de ejes; verdura confirmada vacía → "sin verdura"; derivada
   vacía → "sin verdura" (unificación BP-2a); activación desbloqueada
   para confirmada (BP-2b).

Ratificado por Javi (BP-1) y el cocinero (BP-2a, BP-2b) el 2026-07-13
sobre reporte R-0 en vivo.

## D-035 — Plan de wiring de fuenteEditorial: dos PRs, costura por opts, resolución de unidad del lateral [2026-07-14]

**Contexto.** Tras D-034 el motor y el cuaderno saben tratar el mundo
confirmado, pero ningún camino de producción inyecta el lateral
(verificado en R-0 sobre HEAD 8dac5f8: `runExportCuadernoV5.js:39`
llama `buildPlatosRows()` sin argumentos; el test
`s2-fuenteEditorial-callsites.test.js:156` afirma que ningún
call-site de producción pasa `fuenteEditorial` al resolver).

**F-W1 → A (ratificado): dos PRs separados.**
- PR-1a — wiring del cuaderno: inyección del lateral en la cadena
  del export V5. Superficie de test: cuaderno. Rojo esperado:
  recaptura de `BASELINE_SHA256_HEAD` (`exportCuadernoV5.test.js:596`,
  valor pre-wiring `5fc6c30c8ca26050704a8405811e2a6de7453f9f9e693f18849cf95fbcff1a55`)
  y el tripwire de aridad S2. La recaptura es la razón de ser
  declarada del PR, no colateral.
- PR-1b — wiring del motor: inyección del lateral en el runtime del
  walk. Superficie de test: planes. Arrastra derogaciones de registro
  (las 6 anclas cuya justificación era la ausencia de confirmación,
  y D-023), que tendrán su propia ronda de forks antes de código.
Causa real: superficies observables distintas con rojos distintos;
evidencia R-0 de que el walk no tiene hoy ningún camino receptor;
precedente de un concern por PR (D-032).
Rechazada la opción B (PR único): mezclaba cableado mecánico con
derogaciones de decisiones y acoplaba el revert de ambas superficies.

**F-W2 → A (ratificado): costura por `opts.fuenteEditorial` en
`buildPlatosRows`.**
El runner carga el lateral y llama
`buildPlatosRows({ fuenteEditorial })`; internamente
`exportCuadernoV5.js` pasa la fuente a `resolveCatalogComposition`.
Esto extiende de forma aditiva el módulo asentado en D-034 — se
declara aquí explícitamente.
Rechazada la opción B (runner construye vistas por `opts.vistas`):
duplicaba la lógica de defaults de `exportCuadernoV5.js:112-113` en
un segundo lugar (riesgo de drift) y resignificaba una costura de
test como vía de inyección de producción sin declararlo.

**Tripwire de aridad: reescritura declarada.**
`s2-fuenteEditorial-callsites.test.js` pasa de "ningún call-site de
producción pasa fuenteEditorial" a allowlist explícita con un único
call-site ratificado (la cadena del export V5). Conserva su función
de tripwire para el resto del árbol: en particular, el walk no puede
cablearse silenciosamente antes de PR-1b. La retirada total fue
rechazada. La reescritura viaja en PR-1a.

**Resolución de unidad del lateral (cierra la discrepancia B5 del
R-0 de 2026-07-14).**
El lateral `dishCompositionConfirmations.json` contiene
**241 registros-plato** que suman **419 confirmaciones-eje**
(gluten 178, lactosa 178, verdura 63). Verificado en vivo sobre
`d.confirmed`. Vocabulario vinculante a partir de este asiento:
"registros-plato" y "confirmaciones-eje" son unidades distintas y
todo conteo debe declarar la suya. Corrección de una derivación
errónea en notas de sesión previas: las 178 anotaciones scaffold de
verdura NO son confirmaciones (no llevan `por`); solo las 63
freeform de verdura lo son.

**Adenda: los 15 `valor:[]` de verdura.**
De las 63 confirmaciones-eje de verdura, 15 tienen
`valor: []`. Semántica asentada: `valor:[]` confirmado significa
"sin verdura" **confirmado por el cocinero** — es información
positiva, distinta de `desconocida` (`desconocida ≠ sin-verdura`,
criterio ya vigente del vocabulario v1). En el cuaderno de segunda
pasada estos 15 deben renderizar "sin verdura" como valor confirmado,
no como ausencia.

**Criterios de aceptación anticipados para PR-1a (falsables,
rojo→verde observado):**
1. `BASELINE_SHA256_HEAD` recapturado tras verificación del dump.
2. Filas con confirmación desbloqueadas por eje: gluten 178,
   lactosa 178, verdura 63.
3. Exactamente 15 renders de "sin verdura" confirmado.
4. Tripwire de aridad en verde con allowlist de un solo call-site.

## D-036 — Topología de inyección de fuenteEditorial en el walk (F-1b-1 → A) [2026-07-14]

**Decisión.** fuenteEditorial entra al motor exclusivamente por su frontera
pública: como campo opcional del input de runWalk y de buildWeekArc, cargado
por el caller. engine2 no importa directamente el soporte físico de la fuente
editorial ni conoce su ubicación; la recibe exclusivamente como dato de
entrada.

La construcción de vistas se concentra en los productores: computeVetoUniverse
(veto), anchorVista (ancla) y vistaPorDefecto (frecuencias). Los predicados de
dominio —hoy evaluateVetoFromVista y satisfaceVerdura— permanecen
completamente ajenos a fuenteEditorial: consumen vistas ya resueltas, conforme
al límite construido en D-032/D-033 (los consumidores reciben vistas; los
productores las construyen).

**Invariante canónico.** Toda resolución de composición durante una ejecución
del walk utiliza exactamente la misma instancia de fuenteEditorial,
suministrada desde la frontera del motor. La propiedad protegida es observable
(unicidad lógica de la instancia por ejecución), no el mecanismo por el que el
caller la obtenga.

**Consecuencia sobre evaluateVeto.** La resolución de composición deja de
formar parte de sus responsabilidades. Cualquier supervivencia de evaluateVeto
deberá respetar esa separación de responsabilidades y quedar fuera del camino
de producción cuando actúe únicamente como adaptador o helper de pruebas. La
forma concreta se decidirá en el PR de código.

**Causa.** El R-0 de 1b identificó tres productores independientes de vistas
que cierran hoy sobre resolveDishComposition(dish) sin opts (vetoes.js:87,
buildWeekArc.js:126, frequencies.js:100) y verificó que ningún módulo de src/
importa el lateral (dishCompositionConfirmations.json). La topología adoptada
preserva esa separación: el lateral es un dato de entrada del motor, no
conocimiento interno del motor. Las alternativas —inyección local por costura
y singleton interno del motor— fueron descartadas por romper esa propiedad o
por impedir que el tripwire pudiera seguir observando la apertura de la
frontera.

## D-037 — Contrato dual del tripwire de fuenteEditorial (F-1b-2 → C) [2026-07-14]

**Decisión.** El tripwire de aridad (s2-fuenteEditorial-callsites.test.js) se
reescribe en dos bloques independientes, cada uno demostrando una propiedad
distinta:

1. **Tripwire positivo (enumerativo).** Únicamente los call-sites expresamente
ratificados pueden suministrar fuenteEditorial. Allowlist tras PR-1b:
computeVetoUniverse, anchorVista, vistaPorDefecto (los tres productores de
D-036) más el call-site ya ratificado del export (exportCuadernoV5.js →
resolveCatalogComposition). Toda apertura futura de la frontera exige
modificación visible del test: la fricción es deliberada y es parte del
mecanismo de gobernanza.

2. **Tripwire negativo (estructural).** La propiedad se define por rol, no por
nombre: los predicados del dominio no reciben dependencias editoriales. Hoy la
materializan evaluateVetoFromVista y satisfaceVerdura; si un predicado se
divide o se renombra, el asiento sigue describiendo la propiedad correcta y el
test actualiza qué funciones implementan el rol. Este bloque no depende de la
allowlist.

**Exclusión de alcance.** La rama de medición
(scripts/phaseP2c/humanScoreAdapter.js) queda deliberadamente fuera del
dominio de fuenteEditorial en PR-1b. Es una decisión de alcance de este PR, no
una prohibición arquitectónica permanente: cualquier incorporación futura
requerirá su propia decisión y la actualización correspondiente del tripwire
positivo.

**Causa.** D-036 fija dos propiedades independientes —quién puede suministrar
la fuente y quién jamás la toca— y ambas deben ser falsables por separado. Un
contrato solo enumerativo dejaría la segunda protegida por convención; un
contrato solo estructural (por capas) perdería la granularidad del gate de
ratificación. La separación en dos bloques hace además que el motivo de un
fallo sea inmediatamente evidente.

## D-038 — Actualización del asiento 3 de D-023 a la luz de la ingesta D6 [2026-07-14]

**Decisión.** Se actualiza el alcance del asiento 3 de D-023 ("micro-ingesta
de las 6 anclas: descartada"). Su justificación —procedencia heurística de
gluten/lactosa vía proposeGluten/proposeLactosa, marca "(revisar)" como
evidencia de no-confirmación— dejó de ser una descripción correcta del estado
del sistema tras la ingesta real (D6): las 6 anclas tienen hoy entrada
confirmada limpia en el lateral (gluten:false, lactosa:false, fecha
2026-07-08, sin marcas). La decisión de D-023 fue correcta con los datos
disponibles en su momento; lo que se asienta es el cambio del mundo, no un
error de la decisión.

**Consecuencia observable.** Con el wiring de D-036, las 6 anclas dejan de
vetarse por "desconocida" para perfiles con intolerancia a gluten o lactosa y
pasan a sobrevivir conforme a la composición confirmada disponible en el
lateral (mecanismo introducido por D-032). La fixture del test f18 ("las 6
anclas son desconocida, cero supervivientes") deja de sostenerse sobre el
catálogo real; su reescritura corresponde al diseño de PR-1b.

**Lo que permanece vigente.** Permanecen vigentes sin modificación los
siguientes apartados de D-023: (1) El contrato del ancla: la ausencia de ancla
elegible sigue sin invalidar el plan — cae la fixture, no el contrato. (2) El
principio transversal "dato confirmado puede entrar al motor; propuesta
editorial puede ayudar al editor humano, nunca al motor": PR-1b no lo deroga,
lo cumple por primera vez. (4) La terminología de D-022: intacta.

**Campo por del lateral.** Contrato verificado en exportCuadernoV5.js ("quién
confirmó y cuándo, para la fila entera") y reforzado por el invariante de
custodia del importador (rechaza confirmaciones sin firma): el campo por
identifica al autor del acto de confirmación registrado en el cuaderno. No
identifica al ejecutor de la ingesta ni expresa, por sí mismo, la procedencia
del criterio o conocimiento que motivó dicha confirmación.

**Causa.** Tabla U5 del micro-R-0 de cruce anclas↔lateral (sesión 2026-07-14):
las 6 identityKey de ANCHORS presentes en dishCompositionConfirmations.json
con confirmación en ambos ejes de veto, sin eje verdura (consistente con el
particionado del lateral: verdura solo existe en el subconjunto freeform).

## D-039 — [2026-07-15] Excepción de negación para el lateral en .gitignore; reubicación registrada como deuda

- **Decisión/Hallazgo.** El R-0 de buildPlatosRows detectó que
  `scripts/phaseB2/output/` está ignorado mientras el lateral
  `dishCompositionConfirmations.json` sigue tracked solo porque git no
  re-ignora archivos ya trackeados — trampa latente sobre el activo bajo
  invariante de custodia. Se ratifica la opción A: reescribir la regla a
  contenidos (`output/*`) y negar explícitamente el lateral. El directorio
  conserva su semántica de artefactos generados; el lateral es excepción
  deliberada mientras resida ahí. La opción B (reubicar el lateral fuera de
  `output/`) queda como deuda arquitectónica futura; al ejecutarse, la
  excepción desaparece con el traslado.
- **Evidencia (roja, antes del cambio — `.gitignore:48` = `scripts/phaseB2/output/`).**
  ```
  $ git check-ignore --no-index -v scripts/phaseB2/output/dishCompositionConfirmations.json
  .gitignore:48:scripts/phaseB2/output/	scripts/phaseB2/output/dishCompositionConfirmations.json
  (exit 0)
  $ git check-ignore --no-index -v scripts/phaseB2/output/dummy_prueba.xlsx
  .gitignore:48:scripts/phaseB2/output/	scripts/phaseB2/output/dummy_prueba.xlsx
  (exit 0)
  ```
- **Evidencia (verde, tras el cambio — `.gitignore:51-52` = `scripts/phaseB2/output/*` + negación del lateral).**
  ```
  $ git check-ignore --no-index -v scripts/phaseB2/output/dishCompositionConfirmations.json
  .gitignore:52:!scripts/phaseB2/output/dishCompositionConfirmations.json	scripts/phaseB2/output/dishCompositionConfirmations.json
  (exit 0 -- ver nota)
  $ git check-ignore --no-index -v scripts/phaseB2/output/dummy_prueba.xlsx
  .gitignore:51:scripts/phaseB2/output/*	scripts/phaseB2/output/dummy_prueba.xlsx
  (exit 0)
  ```
  **Nota sobre el exit code de `-v`:** `git check-ignore -v` (git 2.54.0)
  devuelve exit 0 en ambos casos (antes y después) porque imprime *cualquier*
  patrón que coincida, incluida una negación — el exit code de `-v` no
  distingue "ignorado" de "excluido por negación". Sin `-v`, el exit code SÍ
  es el correcto y falsable: `git check-ignore --no-index -q
  dishCompositionConfirmations.json` → exit 1 (no ignorado) tras el cambio;
  `dummy_prueba.xlsx` → exit 0 (sigue ignorado) en ambos momentos.
  Corroborado funcionalmente con el mecanismo real que importa (`git add` /
  `git status --ignored`): un archivo nuevo en `output/` sigue marcado `!!`
  (ignorado) y `git add -n` lo rechaza ("ignored by one of your .gitignore
  files", exit 1); `git add -n
  scripts/phaseB2/output/dishCompositionConfirmations.json` tiene éxito
  (exit 0) -- el lateral deja de estar atrapado por la regla de directorio.
- **Decide.** Javi.

## D-040 — [2026-07-15] La anotación original del cocinero es activo canónico y vive bajo control de versiones

- **Decisión/Hallazgo.** La anotación original del cocinero
  (`Anotacion_cocinero_242_v4.xlsx`) constituye un activo canónico del
  proyecto: es insustituible (no hay generador que la reproduzca; es
  captura única de la sesión editorial del cocinero) y forma parte de los
  datos necesarios para reproducir el catálogo (los 63 platos freeform de
  `dishes.json`, D-009) y la suite de pruebas (leída en vivo por
  `freeformPromote.test.js` y `tripwire-platetype-enum.test.js`). Por tanto
  debe permanecer bajo control de versiones en su ubicación canónica,
  `scripts/phaseB2/input/`. Hasta ahora vivía solo en disco, sin rastrear:
  un `git clean` o un clon limpio la habría perdido y roto la suite. Se
  versiona. Consecuencia adicional: existía una copia byte-idéntica (sha256
  `655f0a55567b48ff9f557c917467094a7382634e2c59b824346d0ec113d6e417`) en
  `scripts/phaseB2/output/`, sin lector ni escritor conocido en el árbol de
  código (verificado por recon read-only, R-0b), ignorada por `output/*`
  (D-039). Se elimina para no mantener el activo duplicado con dos estatus
  distintos (uno versionado, otro ignorado) sin procedencia. La fuente
  única y versionada queda en `input/`.
- **Evidencia.**
  - sha256 idéntico confirmado en vivo (P3, `certutil -hashfile`, ambas
    rutas): `655f0a55567b48ff9f557c917467094a7382634e2c59b824346d0ec113d6e417`.
  - `.gitattributes` — línea añadida `*.xlsx binary` (no existía cobertura
    previa para `.xlsx`; el archivo ya cubría `*.snap`/`*.js`/`*.jsx`).
  - `git add -f scripts/phaseB2/input/Anotacion_cocinero_242_v4.xlsx` →
    `git status --porcelain` sobre esa ruta: `A  scripts/phaseB2/input/Anotacion_cocinero_242_v4.xlsx`.
  - Borrado de la copia huérfana (`del`/`rm` sobre
    `scripts/phaseB2/output/Anotacion_cocinero_242_v4.xlsx`, no
    `git rm`: no estaba tracked): `dir`/`ls` posterior de `output/` ya no la
    lista (siguen `Anotacion_cocinero_v5.xlsx` y
    `dishCompositionConfirmations.json`); `git status --porcelain` no
    reportó ninguna línea sobre esa ruta (era untracked + ignorada; su
    borrado es invisible a git, tal como predicho).
- **Decide.** Javi.

## D-041 — [2026-07-15] Reformulación del criterio C de la Fase 4 y cierre formal de la fase

- Decisión/Hallazgo: el criterio de aceptación C de la Fase 4
  ("humanScore(engine2) > baseline en repetición y continuidad")
  presuponía un universo de datos homogéneo que el proyecto nunca
  adoptó, y quedó doblemente obsoleto por decisiones posteriores ya
  asentadas: (1) la infraestructura de medición ratificada en
  D-025/D-026 produce ternas tipificadas valor/cobertura/estado, no
  veredictos comparativos "mejor/peor" — ningún formato del artefacto
  puede expresar "engine2 > baseline" literalmente; (2) las cuatro
  submétricas de repetición/continuidad (repeticionSalsa,
  repeticionTecnica, platoCuchara, continuidadEntrenoHidrato) leen
  ejes de la tupla combinatoria {tmpl,S,cookM,C} que por contrato
  (D-021) solo existen para los 178 platos scaffold: los 63 freeform
  no carecen de esos ejes por deuda de implementación sino porque
  fueron modelados de otra forma (combos curados sin descomposición
  combinatoria; D-025 declaró la asimetría "permanente por diseño").
  Un reconocimiento read-only sobre la fuente freeform
  (src/data/FREEFORM_COMBOS.js) confirmó que la carencia no es
  levantable sin modelado nuevo: S no tiene campo estructurado (solo
  texto de receta); cookM no tiene campo dedicado (tags[] abierto y
  esporádico); C tiene como candidato más próximo scaling.primario,
  que es texto libre cuya semántica ("ingrediente primario de
  escalado") mezcla carbohidratos con legumbres y exige juicio de
  dominio caso por caso. Para tmpl existe un dato relacionado: el
  instrumento consume tupla.tmpl; el dato disponible en freeform es
  identity.plateType (remapeado sin heurística por tabla curada,
  freeformEditorial.js); existe al menos una transformación
  documentada en la que ambos difieren
  (legacyCombos.plateTypeCorrections.js:38: tmpl='sopa_crema' ->
  plateType final 'plancha_verdura'), por lo que no pueden
  considerarse equivalentes por contrato — sustituir uno por otro
  redefiniría la métrica, y aun redefinida, el valor 'legumbre' de
  CUCHARA_TMPLS es inalcanzable desde el mapa freeform existente
  (cero vías de salida hacia 'legumbre'). Diseñar un vocabulario de
  ejes para freeform (análogo a lo hecho con gluten/lactosa/verdura
  en D-028) sería una decisión de modelado nueva, no el completado de
  un campo definido, y queda explícitamente fuera del cierre de F4.
  SE DECIDE: (a) el criterio C se reformula así — "las submétricas de
  repetición y continuidad producen lecturas tipificadas honestas
  (terna valor/cobertura/estado, contrato D-025) sobre el subconjunto
  del catálogo para el que el instrumento fue diseñado y cuyos datos
  existen conforme al contrato vigente (origen scaffold), con la
  cobertura declarada explícitamente en el artefacto; el origen
  freeform queda fuera de estas métricas por contrato de datos, no
  por deuda"; (b) con el criterio así reformulado, la Fase 4 queda
  CERRADA: A (semana completa con causa por comida) y B (determinismo)
  verdes por test; C satisfecho por el artefacto
  scripts/phaseP2c/output/comparacion-D2.{md,json} (generado en
  02c30c77, verificado VÁLIDO a HEAD b11cb0b por reconocimiento
  read-only: los cambios posteriores en la cadena productora son
  ortogonales a la tipificación, y humanScoreAdapter.js — único
  módulo que tipifica — no tiene commits en el rango), que reporta
  las cuatro submétricas en estado parcial|computed con valores
  extraídos y cobertura scaffold declarada, más densidadDiaria en
  completa|computed sobre los 241; D (tripwires) verde en suite
  836/836. Fronteras que F4 cierra SIN incluir, por diseño y no por
  olvido: el walk es stateless — no lee MemoryStore (D-019, blindado
  por test con store envenenado); la variación inter-semana y las
  submétricas needs_history (repeticionProteinaMismoDia,
  sorpresaEditorial) quedan para la fase que conecte el histórico; la
  energía de cocina no participa en la selección (banner y test de
  control en runWalk); la gramática de variación (T4, condicional) no
  fue necesitada por la cascada.
- Evidencia: enum de estados y clasificación estática:
  humanScoreAdapter.js:22-28,13-17. Asimetría de tupla por contrato:
  D-021 (tupla ausente en freeform, verificado estructuralmente),
  D-025 ("permanente por diseño"; contrato de terna sin veredicto).
  No-derivabilidad freeform: reconocimiento read-only sobre
  FREEFORM_COMBOS.js a HEAD b11cb0b (S/cookM sin campo; C:
  scaling.primario con contraejemplos garbanzos/fabes; tmpl:
  divergencia documentada legacyCombos.plateTypeCorrections.js:38 y
  'legumbre' sin vía de salida en FREEFORM_PLATE_TYPE_MAP,
  freeformEditorial.js:18-55). Validez del artefacto a HEAD:
  reconocimiento read-only 02c30c77..b11cb0b (productores ortogonales,
  humanScoreAdapter.js sin commits). Mecanismo F4: runWalk.js:168
  (entrada), 14/14 slots con causa (runWalk.test.js), determinismo por
  JSON idéntico, tripwires en suite 836/836.
- Decide: Javi.

## D-042 — [2026-07-16] Retiro del ~49,8% como referencia de variedad de verdura; sustitución por artefacto reproducible

- Contexto: existía una cifra conversacional (~49,8% de semanas con alguna
  verdura repetida >=3 días) usada informalmente como referencia de variedad
  de verdura. Se verificó que esa cifra NO está versionada en el repo y NO es
  reproducible con el estado actual: el gate legacy (`analysis/gate4_veg_baseline.test.js`,
  N=500) produce 69,6% para "alguna verdura >=3 días" y 38,0% para
  "calabacín específico >=3 días" — ninguna de las dos coincide con 49,8%.
- Decisión/Hallazgo: se retira el ~49,8% como referencia de variedad de
  verdura. NO se afirma que fuera "incorrecto" — no se sabe y no hace falta —
  se retira porque no es reproducible ni está sustentado por artefacto
  versionado. La nueva referencia oficial de variedad de verdura pasa a ser
  la campaña reproducible anclada en
  `docs/evidence/variedad-verdura/baseline-variedad-verdura.md` (commit
  9b8d489), con sus dos ejecutables regenerables
  (`veg_variety_engine2.mjs`, `veg_variety_legacy.mjs`). Este asiento
  referencia esa ruta; no duplica sus cifras (evidencia y norma viven
  separadas).
- Causa/Principio: una cifra usada como ancla de decisión debe existir como
  artefacto reproducible versionado antes de construir sobre ella. El
  ~49,8% violaba ese principio; el artefacto de
  `docs/evidence/variedad-verdura/` lo satisface (dos ejecutables `.mjs`
  regenerables con `node`, fuera del test runner, con contrato de
  reproducción explícito en la sección 5 del artefacto).
- Evidencia: `analysis/gate4_veg_baseline.test.js` (N=500) → "% semanas con
  calabacín >=3 días: 38.0%", "% semanas con ALGUNA verdura >=3 días: 69.6%".
  Artefacto de referencia: `docs/evidence/variedad-verdura/baseline-variedad-verdura.md`.
- Decide: Javi.

## D-043 — [2026-07-16] Diagnóstico F-E2: el eje V2 no condiciona el headline de variedad de verdura

- Contexto: tras anclar la baseline de variedad de verdura (D-042), quedaba
  abierta la pregunta pre-registrada de si la métrica headline (semanas con
  `maxVegDays>=3`) dependía del eje secundario V2, dado que el extractor
  cuenta ambos ejes de verdura (V y V2) fusionados en una sola observación
  por hueco, lo cual solo puede inflar la métrica, nunca desinflarla. El
  gatillo pre-registrado ("si la primera medición deja pregunta abierta")
  se cumplió y motivó este diagnóstico.
- Método: campaña doble apareada por semana/semilla — brazo control (V+V2)
  frente a brazo V-solo, ambos extraídos de la MISMA secuencia de planes
  generados — con gate interno que exige que el brazo control reproduzca
  la baseline anclada en D-042 como condición de validez del diagnóstico.
- Decisión/Hallazgo: la incertidumbre sobre la contribución de V2 queda
  resuelta. El fenómeno de repetición de identidad que mide la baseline
  existe prácticamente íntegro en el eje primario V, con o sin V2. El
  diagnóstico elimina V2 como incertidumbre principal para el diseño del
  mecanismo de variedad: el mecanismo podrá diseñarse tomando el eje
  primario como objeto de control, sin necesidad de modelar V2 como factor
  determinante del headline. Esto NO declara V2 irrelevante — declara que
  deja de condicionar la arquitectura del mecanismo.
- Evidencia: `docs/evidence/variedad-verdura/veg_variety_engine2_v2diag.mjs`
  (commit d076ce7), autoverificante (gate de brazo control + determinismo
  por doble corrida, exit code). Este asiento referencia esa ruta; no
  duplica sus cifras (evidencia y norma viven separadas).
- Alcance: decisión documental; ningún cambio de código. El diseño del
  mecanismo de identidad de variedad queda habilitado y se abrirá como
  frente propio con su propio reconocimiento previo.
- Decide: Javi.

## D-044 — [2026-07-16] Contrato del mecanismo de identidad de variedad (Fase 4, Componente P2b-iii): memoria global, política local

- Contexto: D-042/D-043 cerraron la caracterización del fenómeno (la
  referencia de variedad de verdura pasó a ser el artefacto reproducible de
  `docs/evidence/variedad-verdura/`, y el eje V2 quedó descartado como
  condicionante del diseño). Un reconocimiento read-only posterior (R-0,
  sesión 2026-07-16) auditó el terreno arquitectónico que recibiría un
  mecanismo de identidad — estado de `FrequencyState`, contrato de vetos,
  puntos de contacto con P1a/P1b — sin encontrar contradicciones ni
  bloqueos. Este asiento ratifica el contrato del mecanismo sobre ese
  terreno, previo a su implementación (que se abre como frente propio).
- Decisión/Hallazgo: Javi ratifica el contrato en diez asientos:
  1. **Principio rector**: la memoria de identidad es global; la política
     de decisión es local. La memoria observa todo compromiso de identidad
     de verdura — las colocaciones de ancla y sobras de P1a y las
     selecciones libres de P1b, sin distinción de origen. La política
     interviene únicamente donde la arquitectura aún permite elegir: la
     fase de candidatos de la ruta rotativa. Todo lo demás en este asiento
     es consecuencia de este principio.
  2. **Naturaleza**: el mecanismo es una política de priorización, no de
     exclusión — responde "¿cuáles preferimos primero?", nunca "¿está
     permitido?". El precedente arquitectónico es la partición por niveles
     del paso de frecuencias (D-024), no el sistema de vetos: los vetos
     existentes eliminan candidatos antes del sorteo sin consultar ningún
     estado semanal; el mecanismo de identidad, como el de frecuencias, sí
     consulta memoria acumulada durante el paseo.
  3. **Estado**: memoria intra-semana, misma vida que el estado de
     frecuencias — nace y muere dentro de una única ejecución del walk,
     recomputable desde las colocaciones del propio paseo, sin persistencia
     entre semanas (MemoryStore queda intacto). Unidad de observación: cada
     identidad de verdura presente en `valorEfectivo` de un plato
     comprometido, con independencia del eje del que provenga (V, V2 o ejes
     futuros) — norma ya ratificada en
     `docs/evidence/variedad-verdura/baseline-variedad-verdura.md`: "la
     unidad estadística es la identidad de verdura, no la posición del eje
     en el plato". Unidad temporal: el día — días distintos con la
     identidad comprometida, no la aparición. El día es la unidad
     narrativa del motor (decision log, veda de frecuencias, ejes de la
     campaña de evidencia); un contrato expresado en días sobrevive a
     cualquier cambio futuro en cómo el batch-cooking reparte una misma
     identidad entre momentos o raciones del mismo día.
  4. **Lectura**: la política consulta exclusivamente el resumen de días
     distintos con la identidad comprometida; no conoce ni depende de cómo
     la memoria representa ese resumen internamente.
  5. **Política**: entre los candidatos del nivel vigente (el que entrega
     el paso de frecuencias), se prefieren aquellos cuya incorporación
     aumente menos la repetición de identidades ya comprometidas. Partición
     binaria preferentes/resto — sin ranking total, sin umbrales absolutos,
     sin acumulación numérica entre candidatos (mismo invariante
     constitucional que gobierna frecuencias: priorizar sin sumar). Se
     inserta como paso posterior y separado del paso de frecuencias: son
     ejes independientes — frecuencia/cobertura de un lado,
     identidad/variedad del otro — y el mecanismo debe poder apagarse sin
     afectar el comportamiento de frecuencias.
  6. **INV-1 (degradación)**: la política nunca reduce el pool a cero. Si
     la partición preferente queda vacía, revierte al conjunto completo del
     nivel vigente con la MISMA semántica de reversión que el fallback ya
     existente del paso de frecuencias (D-024, asiento 1: nivel preferente
     vacío → conjunto completo, causa declarada) — la misma, no una análoga
     nueva. La reversión opera exclusivamente sobre el subconjunto ya
     entregado por los pasos anteriores (veto, no-repetición, preferencias
     A/B, frecuencias); nunca reabre candidatos que un paso previo ya
     descartó. Consecuencia contractual: un plan generado con el mecanismo
     activo existe si y solo si existía sin él — el mecanismo no puede ser
     la causa de que un hueco quede sin candidato.
  7. **INV-2 (monotonía)**: la función de coste de repetición queda abierta
     a la implementación — el contrato exige la propiedad, no el
     algoritmo. La propiedad exigida: una identidad con más días
     comprometidos nunca produce un coste menor que la misma identidad con
     menos días comprometidos.
  8. **Observabilidad**: el mecanismo registra en el log de decisiones
     existente únicamente dos causas — preferencia aplicada (con los
     tamaños de pool antes/después de la partición) y degradación por
     reversión (INV-1). La ausencia de entrada del mecanismo en un hueco
     significa ausencia de intervención; "se evaluó y no tuvo efecto" no
     genera entrada (mismo principio ya vigente en frecuencias: huecos sin
     intervención no llevan entrada del paso).
  9. **Fundamento en evidencia**: los cuatro artefactos anclados en
     `docs/evidence/variedad-verdura/` (`baseline-variedad-verdura.md`,
     `veg_variety_engine2_v2diag.mjs`/D-043, `veg_variety_engine2_freq.md`,
     `veg_variety_engine2_intensity.md`) sostienen el trazado causal del
     fenómeno gobernado: la repetición de identidad producida por anclas
     (`shelfLifeDays` culinarios, CP2b) es diseño ya ratificado y queda
     fuera del alcance de esta política — no es un defecto a corregir, es
     aprovechamiento de sobras funcionando como se diseñó. El fenómeno que
     esta política gobierna es la acumulación de identidades en la ruta
     ROTATIVA, la única donde la arquitectura deja margen de elección.
  10. **Criterios de aceptación** (falsables, a nivel de contrato): (i) el
     mecanismo nunca vacía un pool no vacío (INV-1, verificable por
     construcción); (ii) el coste de repetición es monótono en días
     comprometidos (INV-2, verificable con vistas sintéticas); (iii) el
     mecanismo es apagable sin alterar ningún resultado del paso de
     frecuencias; (iv) toda intervención queda narrada con tamaños
     antes/después, toda no-intervención queda muda; (v) observación
     cruzada P1a→rotativo: una identidad presente ÚNICAMENTE en
     colocaciones de ancla/sobra debe influir en la priorización de las
     selecciones rotativas posteriores de la misma semana (la memoria es
     global, no se reinicia al entrar en P1b); (vi) impacto: una
     re-ejecución de la campaña anclada (D-042) con el mecanismo activo
     debe mostrar la dirección de cambio esperada (menos concentración de
     identidad en la ruta rotativa) — artefacto futuro, no exigible en este
     asiento; (vii) discriminación básica: ante dos candidatos del mismo
     nivel donde uno incorpora una identidad ya comprometida en la semana y
     el otro no, la política prefiere al que no la repite (rojo sin
     mecanismo, verde con él) — el caso mínimo de la semántica de
     preferencia; (viii) mutación de control de INV-1: una variante del
     mecanismo que, ante partición preferente vacía, lanzara en lugar de
     revertir, debe fallar los tests de INV-1 — demostrando que la suite
     discrimina la reversión contractual de su alternativa rechazada.
- Evidencia: `docs/evidence/variedad-verdura/baseline-variedad-verdura.md`
  (norma de unidad de identidad, independiente de V/V2); D-042 (artefacto
  reproducible como única referencia válida); D-043 (V2 descartado como
  condicionante de diseño); D-024 (precedente arquitectónico de partición
  por niveles y su fallback ante nivel vacío); D-023 (contrato de ausencia
  del ancla; CP2b como origen ratificado de la repetición por sobras).
  Reconocimiento read-only previo de esta sesión (R-0, 2026-07-16) sobre
  `src/engine2/walk/frequencies.js`, `vetoes.js`, `runWalk.js`,
  `expandWeekArc.js`, `buildWeekArc.js` y `compositionResolver.js`:
  confirmó que ningún veto existente consulta estado mutable (el
  precedente de estado es frecuencias, no vetos); que la información que
  llega a P1a no trae composición resuelta — solo `dishId` crudo — y que
  la identidad de verdura se obtiene recién en `registerConsumption`,
  mediante la vista ya resuelta allí (`vistaPorDefecto`), tanto para las
  colocaciones de P1a (vía `initFrequencyState`) como para las selecciones
  de P1b, por lo que el mecanismo no requiere ninguna nueva resolución ni
  nueva entrada en la allowlist D-036/D-037: reutiliza el productor de
  vista ya autorizado; y que ningún gate de la suite exige estabilidad
  byte-a-byte del plan de engine2 — el mecanismo no colisiona con ningún
  tripwire existente por esa vía. Ningún cambio de código en este asiento.
- Decide: Javi (ratificación de sesión 2026-07-16, PR documental en rama
  `docs/asiento-contrato-identidad-variedad` sobre `main` post-D-043).

## D-045 — [2026-07-17] Cierre F-M: impacto del paso 5 sobre la baseline de variedad de verdura (criterio vi de D-044)

- Contexto: D-044 dejó el criterio de aceptación (vi) — impacto de la
  política de identidad de variedad sobre la campaña anclada de D-042 —
  como "artefacto futuro, no exigible en ese asiento". F-M cierra ese
  criterio: re-ejecuta la campaña anclada (mismas semillas, mismo
  PROFILE, mismo catálogo) con el paso 5 activo, mediante un runner
  hermano que no modifica `engine2/**` ni ninguno de los cuatro
  artefactos anclados en `docs/evidence/variedad-verdura/`. Un
  reconocimiento read-only previo de F-M auditó accesibilidad y
  completitud del `decisionLog` para esta medición antes de construir el
  runner.
- Decisión/Hallazgo (dirección, sin veredicto de valor): el paso 5
  desplaza engine2 hacia un régimen de menor concentración de identidades
  y mayor variedad, interviniendo en la mayoría de los huecos rotativos,
  sin reproducir el perfil estadístico de legacy. Las cifras no se
  transcriben a este asiento — viven en el artefacto (misma disciplina de
  no duplicar cifras entre artefacto y asiento ya aplicada en D-042/D-043).
- Causa/Lección (retirada del ~55,7% conversacional): durante el R-0 se
  constató que la cifra utilizada como referencia conversacional carecía
  de definición y artefacto versionados. Se retiró antes de convertirse
  en insumo de diseño. Tercer caso de la serie, tras el ~49,8% (retirado
  en D-042) y el "23/241 platos con V2" (referencia conversacional
  retirada en F-E2, sellada en D-043; la medición real fue sustancialmente
  menor): la
  no-versión de una DEFINICIÓN de métrica es tan
  fantasma como la no-versión de una cifra — ninguna referencia
  conversacional entra al diseño sin artefacto reproducible que la
  sostenga, ni siquiera cuando trae consigo su propia definición
  operativa.
- Deuda registrada (observabilidad, no requisito de este cierre): exponer
  la causa de paso 5 (el `causa` que devuelve `chooseIdentityLevel`, hoy
  consumido internamente sin concatenarse nunca en `evidencia` — solo su
  texto narrativo lo hace) como campo estructurado propio del
  `decisionLog`, en vez de depender del casado de prosa que usa el runner
  de F-M. Condicionada a que estas campañas de evidencia se consoliden
  como parte del proceso habitual de validación; mientras tanto, el gate
  de exhaustividad de prosa del runner mitiga la deriva silenciosa de esa
  dependencia.
- Evidencia: `docs/evidence/variedad-verdura/veg_variety_engine2_paso5.mjs`
  y `veg_variety_engine2_paso5.md`, ancladas en el commit de merge de F-M
  (`5b0d503`, mergea `cb6bc36`). D-044 (contrato del mecanismo, criterio
  vi). D-042 (baseline comparada, artefacto de referencia).
- Decide / consecuencia para Fase 7: la no-convergencia con legacy que
  muestra la campaña queda como input explícito del encuadre de Fase 7
  (engine2 vs. legacy) — el paso 5 acerca los perfiles estadísticos sin
  igualarlos, lo que obliga a Fase 7 a resolver si la tesis de
  humanización de engine2 busca distinción deliberada de legacy o solo
  una repetición más realista del mismo fenómeno. Javi (ratificación de
  sesión 2026-07-17, PR documental en rama `docs/asiento-cierre-fm` sobre
  `main` post-F-M).

## D-046 — [2026-07-17] Gobierno por frentes reemplaza al roadmap numerado como fuente normativa
- Decisión/Hallazgo:
  Hallazgo: incoherencia entre el estado declarado en CLAUDE.md y el estado real del
  proyecto. CLAUDE.md fija "Fase actual: 4. No trabajes fases futuras en esta sesión",
  pero D-041 cerró formalmente la Fase 4 y D-042…D-045 documentan trabajo posterior que ya
  no siguió la secuencia del roadmap numerado y se organizó mediante frentes autocontenidos
  (F-M, etc.). Los ficheros de roadmap del snapshot de trabajo nunca fueron versionados en
  el repo vivo.
  Resolución: a partir de D-046, el modelo de frentes documentado mediante DECISIONS.md y
  CLAUDE.md se declara como mecanismo normativo para organizar el trabajo futuro. El roadmap
  numerado conservado en CLAUDE.md pasa a considerarse referencia histórica y deja de imponer
  un orden vinculante de ejecución. NO se afirma que el roadmap fuera incorrecto ni que las
  fases 5/6 desaparezcan; se constata que dejó de mantenerse como fuente normativa durante la
  evolución D-042…D-045.
  Consecuencia: las decisiones nuevas —incluida Fase 7— se abren y cierran como frentes
  independientes, respetando los contratos existentes, sin quedar condicionadas por la
  numeración histórica del roadmap. En CLAUDE.md se sustituye el concepto de "Fase actual"
  por el de "Frente activo".
- Evidencia:
  - HEAD de main en el reconocimiento: 72b2fba913a7ceb0c5664551d3247c201705820e (D-045, merge).
  - Incoherencia: CLAUDE.md:58 ("Fase actual: 4. No trabajes fases futuras en esta sesión")
    vs. D-041 (cierre formal de Fase 4, 2026-07-15) y D-042…D-045 (2026-07-13…2026-07-17),
    posteriores, sin número de fase del roadmap en su identificación de frente.
  - Ausencia de roadmap versionado: `git log --all --diff-filter=A` sobre *roadmap* sin
    resultados; no existe fichero de roadmap ni de "estado post-F2" en el repo vivo. Ya
    constatado en D-026 ("sin roadmap vigente en el repo"). Único uso de "roadmap" en el
    repo: la sección CLAUDE.md:56 ("Orden de fases (roadmap v2)").
  - Fuente: informe R-0.1 (reconocimiento documental Fase 7), esta sesión.
- Decide: Javi.

## D-047 — Frente A / Fase 7: Congelación de la representación canónica de evaluación (C v1)

Fecha: 2026-07-17 · HEAD de reconocimiento: 3c18f77 · Tipo: docs-only

### Por qué (pregunta del frente)
El Frente A no perseguía producir una C "útil" para el protocolo. Perseguía responder una pregunta de reconocimiento, anterior a todo diseño de evaluación: ¿qué terreno común observable existe realmente entre el motor legacy (`src/engine/`) y engine2 (`src/engine2/`) sin introducir interpretación? El protocolo de evaluación (Frente B) y su implementación (Frente C) quedan fuera de este asiento por construcción.

### Principios de C (causas, pre-registradas antes de generar material comparativo)
1. C es representación canónica de EVALUACIÓN, no formato de plan. Su reutilización como formato interno queda fuera de alcance.
2. C es lenguaje intermedio, no adaptador: ambos motores expresan C; C no deriva del vocabulario nativo de ninguno. Las dos flechas entran a C.
3. Cierre semántico: C contiene hechos, no criterios de juicio. Ninguna propiedad se añade para satisfacer una necesidad del protocolo.
4. Minimalidad e independencia: C es la intersección mínima de hechos compartidos; cada propiedad se justifica; quitar una no afecta la expresabilidad de otra.
5. Simetría de transformaciones: la transformación motor→C es idéntica en estructura para ambos motores y se especifica antes de todo material comparativo.
6. C maximiza simetría, no información: ante conflicto entre conservar información de un motor y mantener simetría, gana la simetría.
7. Contrato vs. documentación: C es un conjunto de identificadores verificables estructuralmente; el significado humano vive en documentación separada y revisable, no en el contrato.
8. Estabilidad de identidad: un identificador F nunca se reutiliza para otro significado. Su documentación evoluciona y puede excluirse de una versión futura de C; su identidad contractual no cambia.
9. Separación de instrumentos: ningún instrumento amplía su contrato durante su ejecución. Si el reconocimiento estático resulta insuficiente, la necesidad de un instrumento dinámico se registra como hallazgo; no se satisface mutando el instrumento actual.

### Contrato v1
Ninguna categoría inventada. Cada candidata debe citar productor explícito (`archivo:línea`) o regla ya versionada que la derive. "Derivable" sin cita no es respuesta válida. El contenido de C v1 es el conjunto de hechos que el reconocimiento ha demostrado compartidos entre ambos motores — no un objetivo de diseño.

### C v1 — contenido
- Unidad base (dentro): la semana como 14 posiciones (7 días × {comida, cena}).
  - Legacy: `dayNames`, `buildPlan.js:2215`; cena condicionada por `n=profile.mealsPerDay`, `buildPlan.js:2216`, `:2435`.
  - Engine2: `huecosBase`, `expandWeekArc.js:69-88`, sobre `MOMENTOS` (`schema.js:19`) y `DAYS_ORDER` (`days.js:10`).

Hoy, el único conjunto de hechos que el reconocimiento ha podido demostrar como compartido es la unidad base.

### Hallazgo (límite del reconocimiento)
El reconocimiento estático, bajo el contrato de C v1, no ha podido demostrar un conjunto compartido de hechos de composición entre legacy y engine2 sin introducir interpretación. Esto NO afirma que tal terreno común no exista; afirma que este instrumento, con estas reglas, no puede certificarlo. El único conjunto de hechos que el reconocimiento ha podido demostrar como compartido es la estructura temporal de la semana. Ninguna candidata inicial de composición sobrevivió al reconocimiento sin introducir interpretación.

### Consecuencia (gobernanza)
C v1 queda congelada con ese alcance. La suficiencia de C v1 para soportar el protocolo de evaluación NO forma parte de este frente y queda heredada explícitamente al Frente B.

### Candidatas excluidas de v1 (consecuencias del contrato, no decisiones del frente)
Ninguna se descarta por criterio de diseño; todas por aplicación estricta del contrato previamente congelado. Cada exclusión separa lo que observó la sonda de lo que el contrato hizo con esa observación.

F1 (verdura):
- Hallazgo del reconocimiento: el productor engine2 introduce lógica adicional respecto al productor localizado en legacy — rama por origen y umbral (`frequencies.js:168-170`), fusión con filtrado (`compositionResolver.js:218`) — ausentes en el campo legacy `combo.V` (`buildPlan.js:1244`).
- Aplicación del contrato: el reconocimiento ya no puede demostrar que ambos productores representen el mismo hecho observable sin interpretación.
- Consecuencia: F1 no entra en C v1.

F2 (proteína):
- Hallazgo del reconocimiento: el productor legacy aplica fallback condicional por `tmpl` (`buildPlan.js:1219`) inexistente en el productor engine2, que en su lugar lanza (`compositionResolver.js:209-213`).
- Aplicación del contrato: el reconocimiento ya no puede demostrar que ambos productores representen el mismo hecho observable sin interpretación.
- Consecuencia: F2 no entra en C v1.

F3 (hidrato):
- Hallazgo del reconocimiento: engine2 no produce el hecho en producción; el único acceso a `tupla.C` es una aserción de test (`compositionResolver.test.js:92`) sin consumidor en `walk/` ni `contracts/`. Legacy sí lo produce (`!!cena._spec.C`, `continuidad.js:37`).
- Aplicación del contrato: al faltar el productor en un lado, no hay hecho compartido; el principio de simetría (6) lo excluye.
- Consecuencia: F3 no entra en C v1.

Identidad de plato:
- Hallazgo del reconocimiento: no existe identificador estable común; legacy no tiene implementación de identidad de combo en el objeto retornado (`identity.js:18` la declara engine2-only); engine2 sí (`comboIdentityKey`, `identity.js:32` → `dish.id`, `assemble.js:22`).
- Aplicación del contrato: regla pre-registrada — si no existe identificador estable común, no hay rescate por traducción.
- Consecuencia: identidad de plato no entra en C v1.

### Identidades preservadas (principio 8)
F1, F2 y F3 conservan su identidad contractual como candidatas a versiones futuras de C, si un reconocimiento posterior demuestra que el terreno común se ha ampliado (p. ej. si un frente de construcción produce en engine2 un productor simétrico del hecho hoy ausente o divergente).

### Evidencia versionada (ancla reproducible)
Reconocimiento por lectura estática estricta sobre el repo vivo en HEAD 3c18f77. Dos instrumentos, ambos SOLO LECTURA, sin ejecución de motores.

Sonda de localización de productores:

| ID | Legacy | Engine2 |
|----|--------|---------|
| F1 | `combo.V`, buildPlan.js:1244 | regla `satisfaceVerdura`, frequencies.js:166 (D-024/D-033) sobre `verdura`, compositionResolver.js:228,256 |
| F2 | `protKey`, buildPlan.js:1219-1223 | `proteinType`, compositionResolver.js:209,252 |
| F3 | `!!cena._spec.C`, continuidad.js:37 (sobre `_spec`, buildPlan.js:701-702) | no existe (solo aserción de test, compositionResolver.test.js:92) |
| Unidad base | dayNames, buildPlan.js:2215; buildPlan.js:2216,:2435 | huecosBase, expandWeekArc.js:69-88 |
| Identidad de plato | no existe (identity.js:18: engine2-only) | comboIdentityKey, identity.js:32 → dish.id, assemble.js:22 |

Sonda de proyección (F1/F2):

| ID | Resultado | Evidencia |
|----|-----------|-----------|
| F1 | introduce lógica | frequencies.js:168-170; compositionResolver.js:218 |
| F2 | introduce lógica | buildPlan.js:1219; compositionResolver.js:209-213 |

### Herencia a Frente B
Dado que el único hecho compartido es el andamiaje temporal, el Frente B hereda la pregunta: ¿sobre qué evalúa el juez la tesis de humanización? B no puede "añadir F1"; solo puede "construir un terreno común nuevo que justifique F1". Esa distinción de gobernanza es consecuencia directa de congelar C v1 ahora.

### Aprendizaje metodológico
F2 es la evidencia central del valor del contrato: la intuición inicial la señalaba como el caso más sólido y el reconocimiento la excluyó al encontrar lógica adicional donde no se esperaba. El contrato obligó a verificar una intuición antes de admitirla como hecho — no impidió la intuición, que es inevitable, sino su promoción sin evidencia. Este es el resultado de más alcance del frente.

## D-048 — Frente B: Tesis, objeto de evaluación y separación de niveles

Fecha: 2026-07-17 · HEAD de referencia: `c315d2e` · Tipo: decisión fundacional

### Contexto
D-045 dejó explícitamente abierta la interpretación de la tesis de humanización ("distinción deliberada de legacy o repetición más realista del mismo fenómeno", DECISIONS.md:2200-2207). D-047 heredó al Frente B la pregunta "¿sobre qué evalúa el juez la tesis de humanización?" (DECISIONS.md:2320). Una micro-verificación documental de solo lectura, anclada a `c315d2e`, constató que no existe formulación operacional de la tesis en el corpus normativo: CLAUDE.md:6 describe el proceso del motor y el mecanismo de migración ("evaluación ciega") sin definir qué se mide; ninguna entrada previa de DECISIONS.md la fija. La presente entrada es por tanto una decisión fundacional, no un hallazgo de reconocimiento.

### Decide
1. Tesis. Engine2 pretende aproximar el proceso de decisión de un nutricionista humano experto mejor de lo que lo aproxima el motor legacy. Es una afirmación sobre el motor, independiente de cualquier diseño experimental.
2. Regla de evidencia. La evaluación del proceso de decisión se realizará a partir de evidencia observable en el plan generado, ya que el proceso interno del motor no constituye un objeto directamente evaluable.
3. Objeto de evaluación. El plan generado por el motor. La definición formal de ese objeto en cada motor no forma parte de esta decisión y queda encomendada al reconocimiento R-1 del Frente B. Toda representación que se construya para hacer el plan observable por un juez humano es un vehículo de observación, no el objeto evaluado; deberá ser proyección fiel del plan, y el protocolo deberá minimizar la influencia de la representación sobre el juicio.
4. Diseño experimental: abierto. Las dos lecturas de D-045 ("distinción deliberada", "repetición más realista") se reclasifican: no son tesis alternativas, sino familias de diseño experimental para contrastar la tesis del punto 1. Su elección pertenece al diseño del protocolo, posterior a esta entrada, junto con la forma del experimento (comparación A/B, evaluación ciega tipo Turing, ranking, preferencia u otras).

### Causa
Separar tres niveles hasta ahora entremezclados — qué afirma el proyecto (tesis), qué entidad se evalúa (objeto), cómo se diseña el experimento (protocolo) — evita dos fallos: que la tesis deba reescribirse si cambia el protocolo experimental, y que la representación, un artefacto propio, se convierta en lo evaluado. La disyuntiva de D-045 se difiere al nivel al que pertenece.

### Consecuencias provisionales para el trabajo del Frente B
Las siguientes consecuencias se derivan del estado actual del repositorio y del alcance de esta decisión. No forman parte de la tesis y podrán revisarse únicamente mediante una decisión posterior que las sustituya explícitamente.

- Descartada la observación asimétrica (juez ve UI legacy y un artefacto ad hoc para engine2): la asimetría de presentación contamina el juicio, incompatible con el punto 3.
- Descartada la observación de estructuras crudas (juez lee objetos serializados): traslada al juez interpretación técnica de estructuras no diseñadas para consumo humano.
- El reconocimiento previo (R-0 del Frente B) constató que no existe hoy ningún artefacto observable por un juez humano que represente un plan de engine2; la construcción de un vehículo de observación es, en consecuencia, trabajo previsible del frente, subordinado a lo que R-1 establezca sobre el objeto.

### Herencia
R-1 (Frente B): documentar formalmente qué constituye "el plan generado" en cada motor — qué produce cada uno, con qué campos y qué semántica puede demostrarse mediante reconocimiento — como base para el diseño de la proyección fiel y, después, del protocolo experimental.

## D-049 — R-1 Frente B: Reconocimiento de productores de plan

Fecha: 2026-07-17 · HEAD de reconocimiento: `6523de9` · Tipo: reconocimiento (lectura estática estricta)

### Qué preguntó R-1
Encomendado por D-048: documentar qué garantiza cada productor que constituye "el plan generado" en cada motor — qué produce, con qué campos, con qué semántica demostrable por lectura estática. Instrumento: solo lectura, sin ejecución. Sin comparar los dos motores.

### Qué encontró
El reconocimiento distingue deliberadamente entre productor identificado y contrato normativo. Las conclusiones se basan exclusivamente en productores localizados mediante lectura estática. Legacy tiene un productor de plan identificado: `buildPlan()` retorna `{days, strategy, weekWarnings, weekProblems, weekScore, qaTrace?}` (`buildPlan.js:2807-2815`), ensamblado en tres niveles (return final; objeto `day`, `:2268-2508`; objeto `meal` vía `composeMeal()` y tres productores adicionales). Detalle y citas por nivel en el informe. Engine2: en el estado actual del repositorio (HEAD `6523de9`), no se ha identificado mediante este reconocimiento un productor del objeto de plan definido por el contrato de shape. Se ha localizado únicamente un productor de `{slots, decisionLog}` (`runWalk.js:412-414`), array plano de 14 huecos, no llamado fuera de sus propios tests. Verificado por triple vía: sin archivo en la raíz de `src/engine2/`, sin clave `days:` construida fuera de tests, sin importadores de engine2 fuera de engine2.

### Dependencia arquitectónica que aparece
El objeto de evaluación fijado por D-048 (el plan generado) está materializado en un solo motor según este reconocimiento. El contrato de shape (`CLAUDE.md:17-25`) es normativo respecto a engine2, y este reconocimiento no ha localizado código que lo cumpla en este HEAD. `reconcile` (Fase 5) no está implementado (`grep` sin resultados). Esto es una ausencia constatada por lectura estática en este estado del código, no una imposibilidad conceptual del motor.

### Hallazgos secundarios (registrados, no resueltos)
- `strategy` en engine2 (`buildWeekArc.js:422`) marcado "metadato pasivo" por el propio código; ninguna función posterior lo consume — se produce y no se propaga.
- `decisionLog` en engine2: dos shapes incompatibles conviven (`buildWeekArc` vs. `runWalk`), sin productor que los fusione. No se ha localizado un `decisionLog` único del plan.
- `meal.metadata.saciedad` en legacy no garantizado en todos los meals (solo en los de `composeMeal()`); `validateWeek` compensa con default (`buildPlan.js:2597`). Hueco en el productor, no en el consumidor.

### Qué quedó fuera
- Comparación entre los dos objetos: fuera del alcance de R-1 por diseño.
- Contenido concreto de `days`/`slots` (qué plato cae en qué hueco): depende de RNG sembrado + estado acumulado; registrado como "requiere ejecución", no ejecutado. Reconocimiento dinámico (R-2) queda nombrado como posibilidad futura, no abierto.
- Qué debe hacer Frente B ante la dependencia arquitectónica: decisión posterior, no la responde R-1.

### Evidencia
Véase Informe R-1 (`docs/evidence/R-1-productores-plan.md`, HEAD `6523de9`), generado exclusivamente mediante lectura estática, sin ejecución de motores.

### Herencia
La decisión siguiente hereda la pregunta: ¿puede Frente B completar el diseño del protocolo antes de que exista el productor de plan de engine2, o debe detenerse en una especificación de requisitos? Es decisión de arquitectura, fuera del alcance de este reconocimiento.

## D-050 — B-A1 Frente B: Arquitectura del frente ante la dependencia del productor de plan

Fecha: 2026-07-17 · HEAD de referencia: `53fc0a7` · Tipo: decisión de arquitectura

### Contexto
D-049 heredó la pregunta: ¿puede Frente B completar el diseño del protocolo antes de que exista el productor de plan de engine2, o debe detenerse en una especificación de requisitos? El reconocimiento constató que el objeto de evaluación fijado por D-048 está materializado en un solo motor: legacy tiene productor identificado (`buildPlan.js:2807-2815`, según R-1); en engine2 el contrato de shape (`CLAUDE.md:17-25`) es normativo y este reconocimiento no localizó código que lo cumpla en ese HEAD.

### Decide
1. Descarte de B-A1-A (diseñar el protocolo completo contra el contrato de shape). No por prudencia general: contradice dos decisiones asentadas. D-047 prohibió construir terreno común a partir de contratos no demostrados; D-049 demostró que en este HEAD el contrato de shape es norma respecto a engine2, no productor existente. Diseñar "como si" el objeto existiera volvería a mezclar especificación con estado observado.
2. Ratificación de B-A1-C con criterio de frontera. Frente B puede decidir únicamente aquello cuya validez no dependa de la implementación concreta del productor de plan de engine2. Todo lo demás solo puede especificarse como requisito. La frontera viene determinada por la dependencia demostrada en D-049, no por conveniencia metodológica.
3. Partición resultante.

    Decisiones posibles en el estado actual del repositorio (normativa del protocolo): qué constituye evidencia admisible; reglas de cegado; reglas de comparación; criterios de aceptación/rechazo; requisitos que deberá cumplir cualquier representación para ser considerada proyección válida. Nada de esto presupone que engine2 produzca hoy un plan. (La tesis que contrasta el experimento está ya fijada en D-048 y no se redecide aquí.)

    Especificaciones posibles en el estado actual del repositorio: las propiedades que deberá satisfacer el productor de plan; las que deberá satisfacer la proyección; las condiciones de fidelidad que deberán demostrarse cuando el productor exista. Regla de lenguaje: siempre obligación ("deberá"), nunca descripción ("es").

    Decisiones diferidas por dependencia demostrada: la implementación concreta del vehículo de observación; la verificación de fidelidad de ese vehículo; la validación experimental del protocolo completo. Las tres dependen del productor ausente.
4. Inversión de la dependencia. El productor de plan de engine2 deja de ser solo una deuda del motor con su contrato de shape; pasa a ser una dependencia contractual del protocolo de evaluación. El protocolo pasa a fijar parte del contrato observable que deberá satisfacer el productor de plan. La implementación del productor continúa siendo responsabilidad del motor; los criterios para considerarlo evaluable pasan a venir definidos parcialmente por Frente B. Esto evita que el futuro frente de construcción implemente un objeto correcto para el motor pero insuficiente para el protocolo.
5. Resolución. Frente B no se suspende. Su siguiente trabajo no es diseñar el vehículo, sino redactar la especificación normativa del objeto de plan observable que el productor deberá materializar: qué propiedades mínimas deberá exponer para que una proyección fiel y un protocolo ciego sean posibles. Conforme a B-A2-B, esa especificación vivirá como documento versionado propio, separado de este registro (DECISIONS.md registra por qué se decidió y qué gobernanza introduce; la especificación es un artefacto normativo que evolucionará antes de estabilizarse). Su ubicación se determinará tras inspección de las convenciones documentales existentes del repositorio; solo si no existe lugar claramente adecuado se creará uno. La especificación se ratificará con asiento posterior.

### Alcance
Decisión documental; ningún cambio de código. Ninguna afirmación de este asiento describe estado de engine2; toda referencia a su plan es normativa.

### Herencia
Frente B: redacción de la especificación normativa del objeto de plan observable. Futuro frente de construcción del productor: recibirá esa especificación como criterio de aceptación parcial.

## D-051 — Corrección del contrato de shape: cita muerta y formulación de garantía mínima

Fecha: 2026-07-18 · HEAD de referencia: `68433b8` · Tipo: corrección normativa

### Contexto
Una micro-verificación documental (sesión 2026-07-17, solo lectura sobre `main @ 68433b8`), previa a la redacción de la especificación normativa encomendada por D-050, constató una doble contradicción entre el contrato de shape (`CLAUDE.md:17-25`) y el productor de plan de legacy identificado por R-1 (D-049): (1) el contrato afirma "verificado en buildPlan.js:2780", pero esa línea contiene el cierre de un bucle ajeno al return; el return real está en `buildPlan.js:2808-2815`; (2) el contrato afirma que ambos motores devuelven "EXACTAMENTE" un conjunto de claves que excluye `qaTrace`, mientras el productor real emite `qaTrace?` condicionalmente bajo el flag `QA_TRACE` (spread en `buildPlan.js:2814`). `qaTrace` no aparece mencionado en ninguna línea de `CLAUDE.md`.

### Decide
1. Corrección de la cita. La referencia de verificación pasa de `buildPlan.js:2780` a `buildPlan.js:2808-2815`, acotada al productor legacy (único con productor identificado en este estado, según D-049).
2. Reformulación del contrato como garantía mínima. "Ambos motores devuelven EXACTAMENTE estas claves" se sustituye por "Todo productor de plan deberá garantizar la presencia de estas claves". La intención del contrato siempre fue fijar qué pueden asumir los consumidores, no inventariar el return. La enumeración exhaustiva era una afirmación más fuerte que esa intención, y el código la falsifica bajo `QA_TRACE` activo.
3. Estatus de los campos instrumentales. Los campos instrumentales o condicionados por mecanismos de depuración (p.ej. `qaTrace` bajo `QA_TRACE`) no forman parte del contrato y no podrán ser utilizados por consumidores como requisitos funcionales. Esta regla es genérica por diseño: futuros campos instrumentales quedan cubiertos sin necesidad de nueva corrección normativa.

### Alcance
Corrección documental de `CLAUDE.md` exclusivamente; ningún cambio de código. Quedan expresamente fuera: el hueco de `meal.metadata.saciedad` (registrado en D-049), los productores parciales de `decisionLog` en engine2 (ídem), `reconcile`, y todo contenido de la especificación normativa de Frente B, que se redactará sobre el contrato ya corregido.

### Herencia
La especificación normativa del objeto de plan observable (D-050) se redacta sobre esta versión del contrato, sin necesidad de cargar excepciones a la norma superior.
