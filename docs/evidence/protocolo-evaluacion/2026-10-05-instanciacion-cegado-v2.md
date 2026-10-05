# Evidencia — Instanciación del cegado v2 (protocolo-evaluacion.md §6; D-087)

HEAD: `7596c3e19ace1490502e86141ed1ccc85095d18e` · Fecha: 2026-10-05 · Instrumento: vitest 4.1.7 (Windows 10) · Decisiones: D-083, D-085, D-086, D-087 · Antecedente: `docs/evidence/protocolo-evaluacion/2026-10-05-instanciacion-cegado.md` (v1, no modificado)

## 1. Objeto

Registra la versión 2 del procedimiento de cegado, que incorpora la regla del punto 3 de D-087 (exclusión de la comida del día 6). No ejecuta la Fase 7, no genera ninguna vista de evaluador ni clave de evaluación y no fija el criterio de superación.

## 2. Cambio respecto a v1

- `BLIND_VERSION` pasa de 1 a 2.
- Nueva constante `DIA_SIN_COMIDA_EN_VISTA = 6`. En esa posición la salida es `{ dia, cena }`: la clave `comida` se omite, no se emite como `null`.
- La regla es solo posicional. No lee el contenido del plato ni ninguna clave propia de los motores, y el código del módulo no contiene referencias al día libre (comprobado por test estático).
- La entrada se sigue exigiendo completa: el día 6 necesita exactamente una comida no vacía y una cena. Una entrada sin comida el día 6 falla.
- Resultado: 13 posiciones evaluables por plan.

La verificación de la premisa de la regla (que el día libre de ambos motores es el día 6) no forma parte del cegado. Corresponde al generador de casos (D-087, punto 3).

## 3. Código

El merge de v2 modificó solo estos 3 archivos. Blobs en `7596c3e` (`git ls-tree -r HEAD`):

| Archivo | Función | Blob |
|---|---|---|
| `src/eval/blind/blind.js` | Transformación común de cegado, v2 | `a92f21e5ca2d0a6980dab5ca4e1b69ab448713e0` |
| `src/eval/blind/tests/blind.test.js` | Tests del cegado | `0ecb22703186a7b32d40722e8f2557279ee23c2d` |
| `scripts/fase7/blind.integration.test.js` | Integración sobre las salidas del R-0 | `eb726f1a5dc616ad7cc714e27b3c12e9e7bc36b5` |

Sin cambios respecto a v1, con los blobs que constan en la evidencia v1: `src/engine/evalView.js`, `src/engine2/evalView.js`, `src/engine/tests/evalView.test.js`, `src/engine2/tests/evalView.test.js` y `scripts/fase7/blind-run.mjs`.

## 4. Correspondencia con §6 y D-087

| Norma | Propiedad | Acreditación |
|---|---|---|
| §6 ítem 1 (`:53`) | La vista no contiene información ajena; la comida del día 6 de ningún plan aparece serializada | `blind.test.js` (lista blanca por día, 13 posiciones, plato excluido ausente, sin `null`); `blind.integration.test.js` («Comida libre» y la comida del día 6 de ambos planes del R-0 ausentes) |
| §6 ítem 2 (`:54`) | Común: la exclusión es la misma regla posicional para todos los planes, sin conocimiento del origen ni del día libre | `blind.integration.test.js` (forma idéntica con 13 posiciones; comprobación estática ampliada a `libre`, `special`, `fixedRole`; invariancia a ids) |
| §6 ítem 3 (`:55`) | Reproducible y auditable, sin relajar respecto a v1 | `blind.test.js` (determinismo byte a byte, semillas 1 y 2, serialización LF sin BOM); §3 de este documento |
| D-087 punto 3 | Exclusión simétrica, nombres sin alterar, 13 posiciones, entrada completa exigida | `blind.test.js` (día 6 sin comida, con dos comidas o con comida vacía: fallo; cena del día 6 literal) |

Durante la preparación se comprobó que los tests detectan cuatro mutaciones del código: quitar la exclusión, emitir `comida: null`, excluir por contenido y dejar de exigir la comida del día 6. Con el código restaurado, todos pasan.

## 5. Resultado

Comando, desde la raíz del repo en `7596c3e`:

    npx vitest run src/engine/tests/evalView.test.js src/engine2/tests/evalView.test.js src/eval/blind scripts/fase7 src/engine/tests/tripwire

Resultado observado: 8 archivos de test, 79 tests superados, 0 fallidos. Corresponden 47 a la instanciación (7 + 5 + 26 + 9) y 32 a los cuatro tripwires existentes (`eval-isolation`, `engine2-engine-isolation`, `reverse-isolation`, `no-score`).

## 6. Límites declarados

1. El estilo de los nombres de plato puede delatar el origen. Es contenido y no se altera (D-086, punto 5).
2. La diferencia en cómo cada motor materializa el día libre queda registrada como diferencia funcional y no se declara equivalente (D-087, punto 3).
3. La premisa de la regla posicional no está verificada por el cegado. La verificará el generador de casos, que abortará el caso si no se cumple.
4. El runner existe pero no se ha ejecutado. Pendientes: generador de casos, acreditación de semillas, asiento del criterio de superación y designación del evaluador.
