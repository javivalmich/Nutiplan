# Baseline reproducible de variedad de verdura (engine2 vs legacy)

## 1. Qué mide y por qué

Esta campaña mide **variedad de verdura**: la recurrencia con la que se repite
la misma identidad de verdura (`valorEfectivo`) a lo largo de una semana
generada. La unidad estadística es la **identidad de verdura**, no la posición
del eje en el plato (V / V2). Cada identidad presente en un hueco es una
observación de presencia independiente, con independencia de si llegó por el
eje V o por un eje V2 adicional.

Esto es **distinto de cobertura** (¿cuántos huecos llevan verdura?) — aquí no
se mide si hay verdura, sino si la que hay se repite día tras día dentro de la
misma semana.

## 2. Metadatos de la campaña

| Campo | Valor |
|---|---|
| Repositorio | `app-comida` |
| Commit | `7024bda735464fd416e421a6aa1a6755ebc5fb79` |
| Fecha de la medición | 2026-07-16 |
| N (semanas por motor) | 500 |
| Semillas | 1..500 (una semana por semilla, `seed = i + 1` para `i` en `0..499`) |
| RNG | `mulberry32` (definido inline en cada runner; engine2 pasa el entero `seed` directamente a `buildWeekArc`/`runWalk`, legacy lo envuelve como `rng: mulberry32(seed)`) |
| PROFILE | ver bloque literal abajo — idéntico en ambos runners |

```js
const PROFILE = {
  weight:       74,
  goal:         'maintain',
  activity:     'moderate',
  intolerances: [],
  trainingDays: [],
  extras:       {},
  mealsPerDay:  3,
  tiempoCocina: 'normal',
  experiencia:  'intermedio',
  simpleMode:   false,
  dob:          '1990-01-01',
  gender:       'male',
  height:       178,
};
```

Legacy además fija `TARGET_KCAL = 2000` y `BASE_OPTS_NO_FF = { month: 5,
weekNumber: 23, pastProteins: {}, freeFormPool: [] }` (régimen nativo sin
inyección de FreeForm).

## 3. Definición exacta de la métrica

- **Buckets excluidos por motor:**
  - engine2: huecos con `vista.origen === 'freeform'`, y huecos con
    `vista.verdura.origen === 'desconocida'` (no se invoca `ejesVerdura` sobre
    ellos — guard obligatorio).
  - legacy: huecos cuyo `vegKey` resuelve a `'none'`, `'freeform'` o
    `'libre'`.
  - Ambos motores excluyen días marcados como libres: engine2 vía el campo
    canónico `slot.fixedRole === 'libre'` (el runner lo agrega en una
    variable local `day.libre` por conveniencia de iteración, pero el campo
    de origen es `fixedRole`); legacy vía `day.special === 'libre'`.
- **Regla de identidad:** cada identidad de `valorEfectivo` cuenta como una
  observación de presencia independiente, sin importar el eje del que
  provenga (V, V2, o ejes futuros). La unidad es la identidad, no la
  posición.
- **`maxVegDays`:** para cada semana, se agrupan las observaciones por
  identidad de verdura (`Map<identidad, Set<day>>`); `maxVegDays` es el mayor
  número de días distintos en los que aparece una misma identidad. Una semana
  "varia" tiene `maxVegDays` bajo; una semana con la misma verdura repetida
  muchos días tiene `maxVegDays` alto.
- **Las 4 cifras reportadas por motor:**
  1. `% semanas con maxVegDays >= 3` (proporción de semanas donde alguna
     identidad se repite 3 días o más).
  2. Histograma completo de `maxVegDays` (buckets `1, 2, 3, 4, 5+`).
  3. Media de identidades distintas de verdura por semana (`distinctVegs`).
  4. Tamaño del vocabulario de verdura observado en toda la campaña (unión de
     identidades vistas en las 500 semanas).

## 4. Resultados

Estas cifras son el **resultado esperado EXACTO** (igualdad, no aproximación)
de una reproducción válida bajo el contrato de la sección 5.

### ENGINE2 (régimen nativo, sin kcal, sin FreeForm) — PRINCIPAL

| Métrica | Valor |
|---|---|
| % semanas `maxVegDays>=3` | **98.6%** |
| Histograma `maxVegDays` | `{1: 0, 2: 7, 3: 208, 4: 222, "5+": 63}` |
| Identidades distintas/semana (media) | **6.47** |
| Vocabulario observado | **17** |

### LEGACY (régimen nativo, `kcal=2000`, `freeFormPool: []`) — REFERENCIA HISTÓRICA

| Métrica | Valor |
|---|---|
| % semanas `maxVegDays>=3` | **69.6%** |
| Histograma `maxVegDays` | `{1: 0, 2: 152, 3: 249, 4: 88, "5+": 11}` |
| Identidades distintas/semana (media) | **7.96** |
| Vocabulario observado | **17** |

## 5. Contrato de reproducción

**Invariantes que definen una reproducción VÁLIDA:**
- El commit indicado en la sección 2.
- Semillas 1..500, en ese orden, una semana por semilla.
- El `PROFILE` (y para legacy, `TARGET_KCAL`/`BASE_OPTS_NO_FF`) verbatim tal
  como aparecen en esta página y en los runners de esta carpeta.
- La definición de métrica de la sección 3, sin modificación.
- Los ejecutables de esta carpeta (`veg_variety_engine2.mjs`,
  `veg_variety_legacy.mjs`), sin modificar más allá de rutas de import.
- El catálogo `dishes.json` a este commit (`scripts/phaseB2/output/dishes.json`,
  resuelto internamente por `loadCatalog.js` vía `import.meta.url` — no
  depende de la ubicación del runner que lo invoca). De este catálogo, a este
  commit, salen las 17 identidades del vocabulario y el porcentaje de platos
  con eje V2 que alimenta a `resolveDishComposition`. Si el catálogo cambia,
  la cifra cambia legítimamente.

**Cambios que INVALIDAN la comparabilidad** (convierten la ejecución en OTRA
campaña, no en un fallo de reproducción):
- Modificar el catálogo (`dishes.json`) o su vocabulario de verdura.
- Modificar la definición de la métrica (sección 3).
- Modificar el mecanismo de generación (`buildWeekArc`/`runWalk` en engine2, o
  `buildPlan` en legacy).

**Cómo reproducir**, desde la raíz del repositorio:

```
node docs/evidence/variedad-verdura/veg_variety_engine2.mjs
node docs/evidence/variedad-verdura/veg_variety_legacy.mjs
```

El runner de engine2 ejecuta la campaña de N=500 dos veces y compara el JSON
resultante para verificar determinismo (`run1 === run2`); una reproducción
válida debe imprimir `true`.

## 6. Límites de comparabilidad

Legacy y engine2 no comparten régimen de control: difieren en (1) targeting
calórico, (2) freeFormPool inyectable, (3) aridad del eje de verdura (legacy
único, engine2 permite doble). Las cifras son líneas base independientes, NO
un delta atribuible al algoritmo de selección.

## 7. Procedencia y estado del ~49,8 % previo

Existe una cifra conversacional previa de ~49,8% de variedad de verdura que
circuló como referencia informal. Esa cifra **no es reproducible** con el
estado actual del repositorio: no hay artefacto, script ni commit que la
sustente. No se afirma que fuera incorrecta — no se sabe, y determinarlo no
es necesario. Simplemente queda **retirada como referencia**: este artefacto
(sección 4, ambas líneas base) la sustituye como referencia de variedad de
verdura para el proyecto.
