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
