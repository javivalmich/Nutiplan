# Campaña F-M — Descomposición por vía + intervención de paso 5 (D-044, criterio vi)

## 1. Qué mide y por qué

Re-ejecución de la campaña anclada de D-042 (mismas semillas, mismo
PROFILE, mismo catálogo) con el mecanismo de identidad de variedad (paso
5, D-044) activo dentro de `runWalk`. Responde al criterio de aceptación
(vi) de D-044 (DECISIONS.md:2122-2126): "menos concentración de identidad
en la ruta rotativa". Añade sobre las métricas globales ya ancladas una
descomposición por vía (rotativo vs. ancla/sobra) que no existía antes de
este artefacto (F-M4-B), y una medición de la frecuencia de intervención
del propio mecanismo.

## 2. Metadatos de la campaña

| Campo | Valor |
|---|---|
| Repositorio | `app-comida` |
| HEAD en el momento de la medición | `54c76f864821bcac589bd1914e8b91d8024ce36c` |
| N (semanas) | 500 |
| Semillas | 1..500 (`seed = i + 1`) |
| PROFILE | idéntico, verbatim, a `veg_variety_engine2.mjs:29-43` |
| Catálogo | `scripts/phaseB2/output/dishes.json`, resuelto vía `CATALOG_PATH` (`loadCatalog.js:17`) |
| SHA-256 del catálogo | `a8fe0abb0ff6509dd0a2d9b11ebdc5627674bace395b099bb624ddcc8c2c25c7` |

Nota (F-M6): ninguno de los cuatro artefactos anclados registra un hash
del catálogo (hallazgo del R-0, Bloque 2). Este es el primer artefacto de
esta carpeta que lo hace; no hay hash previo con el que compararlo. La
comparabilidad con D-042 se sostiene, en cambio, por el hecho verificado
en el R-0 de que `dishes.json` no tiene commits propios entre `7024bda`
(código con el que se generó la baseline anclada) y `54c76f864821bcac589bd1914e8b91d8024ce36c`.

## 3. Definición de las métricas

**Compartidas (verbatim, F-M3):**
- `pctMax3` / histograma `maxVegDays` / `meanDistinct` / `vocabSize`:
  definición de `baseline-variedad-verdura.md:66-70`.
- Universo de inclusión: idéntico a la baseline anclada — excluye huecos
  con `vista.origen === 'freeform'` y con `vista.verdura.origen ===
  'desconocida'`, y excluye días `fixedRole === 'libre'`.

**Nuevas (F-M, sin comparativa histórica — nacen en este artefacto):**
- **Vía**: para cada aparición de identidad, se clasifica el hueco que la
  produjo por la causa de su colocación en el decisionLog — rotativo
  (`seleccion_rotativo_candidato_unico` / `seleccion_rotativo_desempate_rng`,
  `runWalk.js:375`/`:380`) vs. ancla/sobra (`ancla_momento_unico`,
  `ancla_desempate_rng`, `sobra_momento_unico`,
  `sobra_hereda_momento_ancla`, `colision_momento_restante` —
  `expandWeekArc.js:163,171,182,188,137`) vs. capricho (verificado en 0
  ocurrencias bajo el catálogo real, ver sección 5).
- **Intervención de paso 5**: numerador = casado de prosa sobre
  `evidencia` (`"nivel preferente = "` para preferencia aplicada,
  `"particion preferente vacia (INV-1"` para reversión INV-1 —
  `frequencies.js:464-465` y `:451-452`); denominador = total de
  entradas `seleccion_rotativo_*`. Pool-de-1 y evaluado-sin-efecto son
  indistinguibles por diseño del contrato (sin efecto = sin entrada,
  `frequencies.js:439-441` y `:456-458`) — la limitación es propiedad
  del contrato de D-044 punto 8, no defecto del instrumento.

## 4. Resultados — headline (comparación con las cuatro anclas, sin recalcular sus cifras)

| Métrica | ENGINE2 D-042 (`baseline-variedad-verdura.md`, 9b8d489 (código 7024bda)) | LEGACY D-042 (misma fuente) | ESTA CAMPAÑA (paso 5 activo) |
|---|---|---|---|
| % semanas `maxVegDays>=3` | 98.6% | 69.6% | **83.2%** |
| Histograma `maxVegDays` | `{"1":0,"2":7,"3":208,"4":222,"5+":63}` | `{"1":0,"2":152,"3":249,"4":88,"5+":11}` | `{"1":0,"2":84,"3":246,"4":170,"5+":0}` |
| Identidades distintas/semana (media) | 6.47 | 7.96 | **7.79** |
| Vocabulario observado | 17 | 17 | 17 |

Diagnóstico V2 de referencia (no recalculado aquí): `veg_variety_engine2_v2diag.mjs`
(commit `d076ce7`) — el fenómeno de repetición existe
prácticamente íntegro en el eje V, con o sin V2 (D-043).

La interpretación de los cambios observados asume la invarianza de la
ruta P1a, que permanece sin modificaciones en esta implementación. Bajo
ese supuesto estructural —el paso 5 interviene únicamente en la ruta
rotativa, expandWeekArc no cambia, y las semillas son idénticas—, el
delta observado se atribuye íntegramente a la política aplicada sobre la
ruta rotativa. Es una deducción respaldada por el código, no una
medición apareada: no existe toggle de runtime del paso 5 (R-0 F-M,
runWalk.js:365-367, invocación incondicional), por lo que un brazo
ON/OFF exigiría modificar el motor y queda fuera del alcance de esta
campaña de evidencia.

La política desplaza engine2 hacia un régimen de menor concentración de
identidades sin reproducir el perfil estadístico de legacy. `pctMax3`
83.2% queda entre legacy (69.6%) y el engine2 pre-paso-5 (98.6%);
`meanDistinct` 7.79 se aproxima a legacy (7.96) sin igualarlo.

## 5. Resultados — descomposición por vía e intensidad, por identidad

Columnas: identidad | apariciones totales | semanas afectadas (%) |
apariciones vía rotativo | apariciones vía ancla/sobra | apariciones vía
capricho | % rotativo | suma-vía coincide con total | media/semana
afectada | histograma de intensidad {1,2,3,"4+"}.

| identidad | total | semanas (%) | rotativo | ancla/sobra | capricho | % rotativo | suma OK | media | histograma |
|---|---|---|---|---|---|---|---|---|---|
| zanahoria | 739 | 302 (60.4%) | 139 | 600 | 0 | 18.8% | true | 2.45 | {1: 139, 2: 0, 3: 52, "4+": 111} |
| pimientos | 716 | 389 (77.8%) | 213 | 503 | 0 | 29.7% | true | 1.84 | {1: 213, 2: 84, 3: 33, "4+": 59} |
| tomate | 654 | 392 (78.4%) | 234 | 420 | 0 | 35.8% | true | 1.67 | {1: 214, 2: 94, 3: 84, "4+": 0} |
| espinacas | 401 | 401 (80.2%) | 401 | 0 | 0 | 100.0% | true | 1.00 | {1: 401, 2: 0, 3: 0, "4+": 0} |
| calabacin | 358 | 358 (71.6%) | 358 | 0 | 0 | 100.0% | true | 1.00 | {1: 358, 2: 0, 3: 0, "4+": 0} |
| berenjena | 352 | 198 (39.6%) | 121 | 231 | 0 | 34.4% | true | 1.78 | {1: 121, 2: 0, 3: 77, "4+": 0} |
| pepino | 291 | 283 (56.6%) | 291 | 0 | 0 | 100.0% | true | 1.03 | {1: 275, 2: 8, 3: 0, "4+": 0} |
| lechuga | 263 | 252 (50.4%) | 263 | 0 | 0 | 100.0% | true | 1.04 | {1: 241, 2: 11, 3: 0, "4+": 0} |
| judias | 257 | 257 (51.4%) | 257 | 0 | 0 | 100.0% | true | 1.00 | {1: 257, 2: 0, 3: 0, "4+": 0} |
| brocoli | 230 | 230 (46.0%) | 230 | 0 | 0 | 100.0% | true | 1.00 | {1: 230, 2: 0, 3: 0, "4+": 0} |
| alcachofa | 173 | 173 (34.6%) | 173 | 0 | 0 | 100.0% | true | 1.00 | {1: 173, 2: 0, 3: 0, "4+": 0} |
| esparragos | 160 | 160 (32.0%) | 160 | 0 | 0 | 100.0% | true | 1.00 | {1: 160, 2: 0, 3: 0, "4+": 0} |
| champiñones | 151 | 151 (30.2%) | 151 | 0 | 0 | 100.0% | true | 1.00 | {1: 151, 2: 0, 3: 0, "4+": 0} |
| puerro | 132 | 132 (26.4%) | 132 | 0 | 0 | 100.0% | true | 1.00 | {1: 132, 2: 0, 3: 0, "4+": 0} |
| calabaza | 81 | 81 (16.2%) | 81 | 0 | 0 | 100.0% | true | 1.00 | {1: 81, 2: 0, 3: 0, "4+": 0} |
| acelgas | 71 | 71 (14.2%) | 71 | 0 | 0 | 100.0% | true | 1.00 | {1: 71, 2: 0, 3: 0, "4+": 0} |
| coles | 66 | 66 (13.2%) | 66 | 0 | 0 | 100.0% | true | 1.00 | {1: 66, 2: 0, 3: 0, "4+": 0} |

Comparación puntual con Vista C anclada (`veg_variety_engine2_freq.md`,
commit `666b3ad`, sin recalcular) y con intensidad
anclada (`veg_variety_engine2_intensity.md`, commit `94ae734`,
sin recalcular), para las tres identidades de mayor volumen en D-042:

| identidad | Vista C D-042 (total / %sem) | Intensidad D-042 (sem.afectadas / media / hist) | Esta campaña (total / %sem / media / hist) |
|---|---|---|---|
| tomate | 949 / 79.6% | 398 / 2.38 / {1: 134, 2: 85, 3: 100, "4+": 79} | ver fila `tomate` arriba |
| zanahoria | 825 / 58.4% | 292 / 2.83 / {1: 102, 2: 24, 3: 35, "4+": 131} | ver fila `zanahoria` arriba |
| pimientos | 823 / 66.4% | 332 / 2.48 / {1: 122, 2: 65, 3: 56, "4+": 89} | ver fila `pimientos` arriba |

**Vía capricho — verificación de supuesto:** 0 colocaciones
observadas (esperado 0, runWalk.js:41). Supuesto confirmado.

Esta sección (descomposición por vía) es una **baseline fundacional**, no
un delta contra una vía histórica: durante el R-0 se constató que la
cifra utilizada como referencia conversacional carecía de definición y
artefacto versionados. Se retiró antes de convertirse en insumo de
diseño.

## 6. Resultados — intervención de paso 5

| | conteo | % del denominador |
|---|---|---|
| Denominador (huecos rotativos, causa `seleccion_rotativo_*`) | 5414 | 100% |
| Preferencia aplicada (`identidad_verdura_preferencia_aplicada`) | 4561 | 84.2% |
| Reversión INV-1 (`identidad_verdura_reversion_nivel_vacio`) | 0 | 0.0% |
| Sin intervención registrada (pool-de-1 o evaluado-sin-efecto, indistinguibles) | 853 | 15.8% |

Durante esta campaña no se observó ninguna activación de la rama de
reversión INV-1 (0/5414). Su corrección queda verificada por inspección
de código y por tests específicos, no por ocurrencia en esta ejecución;
en consecuencia, el gate de exhaustividad validó de facto únicamente el
patrón de preferencia aplicada.

## 7. Gates internos

- **Exhaustividad de paso 5** (obligatorio, corre semana a semana en las
  dos corridas de determinismo): toda entrada con `"paso 5:"` en
  `evidencia` casó con exactamente uno de los dos patrones de prosa. Sin
  fallos → el runner no habría llegado a escribir este artefacto.
- **Determinismo**: doble corrida completa, comparación estructural del
  artefacto íntegro. Ver resultado impreso en stdout de la corrida
  (`determinismo: true` requerido para escribir este fichero).
- **Sin gate de igualdad contra la baseline** (F-M2): las diferencias de
  la sección 4 frente a D-042 son el objeto de medida, no un fallo del
  runner.

## 8. Deuda registrada para el asiento de cierre

Exponer `causaIdentidad` (el campo `causa` que devuelve
`chooseIdentityLevel`, hoy usado internamente en `runWalk.js:365-367`
solo para decidir si concatenar `notaIdentidad`) como campo estructurado
propio del `decisionLog` — en vez de depender del casado de prosa sobre
`evidencia` que usa la sección 6 de este artefacto — queda registrado
como mejora de observabilidad futura, condicionada a que estas campañas
se consoliden como parte del proceso habitual de validación. No era
requisito de esta campaña.

## 9. Contrato de reproducción

Mismo contrato de parámetros que `baseline-variedad-verdura.md`, sección
5 (mismo HEAD citado arriba, mismas semillas, mismo PROFILE, mismo
catálogo — hash citado en sección 2). Reproducir con:

```
node docs/evidence/variedad-verdura/veg_variety_engine2_paso5.mjs
```

El runner ejecuta la campaña completa dos veces, corre el gate de
exhaustividad de paso 5 en cada una, y compara el contenido íntegro del
artefacto; una reproducción válida debe imprimir `determinismo: true` y
no debe reescribir este archivo con contenido distinto.
