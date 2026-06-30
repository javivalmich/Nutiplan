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
