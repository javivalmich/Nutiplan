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
