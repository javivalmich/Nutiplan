# Registro de semillas de la primera Fase 7

Índice de esta carpeta. No es fuente de verdad: los hashes están en `manifiesto.json` y se comprueban con `comprobarPaquete.mjs`; las decisiones están en `DECISIONS.md` (D-087, D-088) y en `revision-semillas.json`.

## Qué acredita

`registro-semillas.json` es el registro que consume `scripts/fase7/generarCasos.mjs --registro` (contrato en `scripts/fase7/casos.js:157-187`). Ancla: `289d90d` (A2). `usos` es el conjunto conservador de semillas que deben tratarse como usadas dentro del perímetro declarado. La ventana de evaluación 2001–2010 (D-088) no interseca `usos`: es libre respecto del perímetro y de las reglas de revisión, no en términos absolutos. Las limitaciones están en el propio registro.

## Archivos

| Archivo | Qué es |
|---|---|
| `registro-semillas.json` | Registro final (127 entradas en `usos`, una por aportación) |
| `revision-semillas.json` | Revisión definitiva: 842 grupos de A2 con su clase, tabla A2 → `dd01`, reglas F-RV.1–F-RV.14, comprobaciones e incidencias |
| `revision-semillas.parcial.json` | Revisión parcial exacta usada como entrada de la consolidación |
| `borrador-2aa1157.json` / `.md` | Borrador del escáner en `2aa1157` (829 grupos) |
| `borrador-289d90d.json` / `.md` | Borrador del escáner en `289d90d` (842 grupos) |
| `frv11.mjs`, `frv11p.mjs` | F-RV.11: literales exactos de un intervalo, sin contexto (`frv11p` parametrizado) |
| `frv11_hits-1001-1010-2aa1157.json`, `frv11_hits-2001-2010-289d90d.json` | Salidas de F-RV.11 |
| `frv11b.mjs`, `frv11b_hits-2aa1157.json`, `frv11b_hits-289d90d.json` | F-RV.11b: cotas y constantes de 4+ cifras |
| `frv13.mjs`, `frv13_resultado.json`, `frv13b.mjs`, `frv13b_resultado.json` | F-RV.13: semillas enteras derivadas por `_hashStr` |
| `consolidarUsos.mjs`, `usos-consolidados.json` | Consolidación de U y regla de ventana |
| `probarRegistro.mjs` | Prueba el registro con `verificarSemillas` del código del repo |
| `comprobarPaquete.mjs`, `manifiesto.json` | Comprobación de hashes de esta carpeta |
| `.gitattributes` | `* -text`: los archivos se guardan byte a byte, sin conversión de fin de línea |

Los guiones escriben sus salidas con nombre fijo (`frv11_hits.json`, `frv11b_hits.json`…); aquí están renombradas por ancla. El contenido no cambia.

## Reproducción

Desde una carpeta fuera del repo, con el repo en `289d90d` y el árbol limpio:

```
node frv11p.mjs <repo> borrador-289d90d.json 2001 2010     -> frv11_hits_2001-2010.json
node frv11b.mjs <repo>                                       -> frv11b_hits.json
node consolidarUsos.mjs revision-semillas.parcial.json       -> usos-consolidados.json
node probarRegistro.mjs <repo> registro-semillas.json        -> RESULTADO: OK
```

`frv11.mjs`, `frv13.mjs` y `frv13b.mjs` se ejecutaron sobre el perímetro de `2aa1157`; F-RV.13 no depende del perímetro (función pura sobre entradas fijas). Todas las salidas de esta carpeta las reprodujo el titular en su equipo con hash idéntico, salvo `probarRegistro.mjs`, cuya reproducción precede a D-089.
