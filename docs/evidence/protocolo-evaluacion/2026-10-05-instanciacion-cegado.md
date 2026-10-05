# Evidencia — Primera instanciación del cegado (protocolo-evaluacion.md §6)

HEAD: `2edc5ee60b8b63e92b9fc872194666b545f4e13f` · Fecha: 2026-10-05 · Instrumento: vitest 4.1.7 (Windows 10) · Decisiones: D-083, D-085, D-086

## 1. Objeto

Registra la primera instanciación del procedimiento de cegado, como exige la Nota normativa de §6 (`docs/spec/protocolo-evaluacion.md:57`) antes de cualquier evaluación de Fase 7. No ejecuta la Fase 7, no genera ninguna vista de evaluador ni clave de evaluación y no fija el diseño experimental.

## 2. Código instanciado

Blobs en `2edc5ee` (`git ls-tree -r 2edc5ee`):

| Archivo | Función | Blob |
|---|---|---|
| `src/engine/evalView.js` | Adaptador de legacy al contrato común | `0475678a13ebb67ca2f8ee607d2918334a294309` |
| `src/engine2/evalView.js` | Adaptador de engine2 al contrato común | `710ee89cca71f2e34e7b4a02a4ffe53380d02da6` |
| `src/eval/blind/blind.js` | Transformación común de cegado | `f95352439a097afca2434fed2c80313374070e44` |
| `scripts/fase7/blind-run.mjs` | Runner (no ejecutado) | `eb2ab14f321e6bd39e2103a8e033338b23bda60a` |
| `src/engine/tests/evalView.test.js` | Tests del adaptador de legacy | `3ac6218f8246dabe72b57532f70aedfb5592286c` |
| `src/engine2/tests/evalView.test.js` | Tests del adaptador de engine2 | `5bb421a57741035dbad02f67d68bbac4f7abefa5` |
| `src/eval/blind/tests/blind.test.js` | Tests del cegado | `dd21b29ea8fcca332f9410623903b9f3a8daa895` |
| `scripts/fase7/blind.integration.test.js` | Integración sobre las salidas del R-0 | `c70d2cabbb8db345144ae9c929ed449d292554be` |

Los adaptadores no modifican `src/engine/buildPlan.js` ni `src/engine2/materializePlan.js`.

## 3. Contrato

Entrada del cegado: items `{ id, view }`, con `view = { days: [ { meals: [ { momento, plato } ] } ] }`. Cada productor adapta su salida a este contrato (D-086, punto 3). Cualquier clave fuera del contrato hace fallar la llamada.

Salida para el evaluador: `{ version, planes: [ { etiqueta, dias: [ { dia, comida, cena } ] } ] }`, con días 1–7 por posición, lista blanca de momentos `comida` y `cena`, nombre del plato literal y planes en orden barajado con etiqueta aleatoria.

Clave, separada de la vista: `{ version, seed, entradas: [ { etiqueta, id } ] }`. El runner añade el motor a cada entrada y escribe vista y clave en archivos distintos.

Fallos sin corrección: número de días distinto de 7, ausencia de comida o de cena, momento duplicado, plato vacío, momento no canónico, claves extra, ids duplicados o semilla inválida.

## 4. Correspondencia con §6

| §6 | Propiedad | Acreditación |
|---|---|---|
| Ítem 1 (`:53`) | La vista no contiene información ajena: solo posición del día, momento y plato, más una etiqueta aleatoria; sin ids, nombres de motor, claves propias, desayuno ni metadatos | `blind.test.js` (lista blanca, separación, exclusión); `blind.integration.test.js` (cadenas prohibidas sobre las salidas reales) |
| Ítem 2 (`:54`) | Común (D-085): una única función sin imports y sin claves de motor, invariante a los ids, que deja ambos motores con forma idéntica | `blind.integration.test.js` (forma idéntica, rechazo de plan crudo y de campo de origen, invariancia al intercambio y renombrado de ids, comprobación estática del código); tripwire `tripwire-reverse-isolation.test.js` |
| Ítem 3 (`:55`) | Reproducible y auditable: misma entrada y semilla dan salida idéntica byte a byte; serialización fija (LF, sin BOM); semilla declarada en la clave; doble ejecución con aborto en el runner; código versionado con blob | `blind.test.js` (determinismo, semillas 1 y 2 sobre el fixture, serialización); §2 de este documento |

Fixtures de integración: `docs/evidence/protocolo-evaluacion/out/r0-buildPlan-run1.raw.json` y `out/r0-materializePlan.raw.json`, ya versionados. Los tests no ejecutan ningún motor.

## 5. Resultado

Comando, desde la raíz del repo en `2edc5ee`:

    npx vitest run src/engine/tests/evalView.test.js src/engine2/tests/evalView.test.js src/eval/blind scripts/fase7 src/engine/tests/tripwire

Resultado observado: 8 archivos de test, 71 tests superados, 0 fallidos. Corresponden 39 a la instanciación (7 + 5 + 19 + 8) y 32 a los cuatro tripwires existentes (`eval-isolation`, `engine2-engine-isolation`, `reverse-isolation`, `no-score`).

## 6. Límites declarados

1. El estilo de los nombres de plato puede delatar el origen. Es contenido y no se altera (D-086, punto 5).
2. La vista cubre solo comida y cena durante 7 días. La diferencia funcional del resto no queda acreditada ni negada (D-086, punto 2).
3. El runner existe pero no se ha ejecutado. Ejecutarlo sobre planes de evaluación requiere el diseño experimental y la autorización del titular.
4. Fuera de esta instanciación y pendientes: semillas, perfiles, N, escala, forma de comparación y designación del evaluador externo.
