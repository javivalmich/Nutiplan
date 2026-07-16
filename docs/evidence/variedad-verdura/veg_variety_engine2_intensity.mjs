// ============================================================
// EXTENSIÓN — Vista D: intensidad intra-semana, sobre la campaña anclada
// de variedad de verdura (engine2). NO toca el motor: ningún archivo bajo
// src/engine2/ (ni src/engine/, ni src/eval/) se modifica. Solo añade
// este runner y su artefacto de salida en esta carpeta.
//
// Propósito: la baseline anclada (baseline-variedad-verdura.md) y el
// artefacto de frecuencia (veg_variety_engine2_freq.md) miden EN CUÁNTAS
// SEMANAS aparece cada unidad (plato/combinación/identidad), pero no
// cuántas veces aparece DENTRO de cada semana afectada. Una media de "2.0
// apariciones/semana" puede significar "siempre exactamente 2" o "mitad
// semanas con 1, mitad con 3" -- el histograma de intensidad distingue
// ambos casos. Esta vista añade esa dimensión, distinta de "en cuántas
// semanas aparece".
//
// RÉPLICA DELIBERADA (mismo patrón que veg_variety_engine2_v2diag.mjs y
// veg_variety_engine2_freq.mjs, banners citados): ni veg_variety_engine2.mjs
// ni veg_variety_engine2_freq.mjs exportan sus funciones de campaña (scripts
// de tope de nivel, con console.log/fs.writeFileSync inmediatos) --
// imposible importarlas sin ejecutar sus side effects. Este runner
// reconstruye el mismo procedimiento de generación (buildWeekArc + runWalk,
// mismo PROFILE, N=500, seed=i+1) a partir de las MISMAS primitivas
// importadas (buildWeekArc, runWalk, loadCatalog, resolveDishComposition)
// que usan ambos runners anclados.
//
// UNIVERSO Y DEFINICIONES: IDÉNTICOS al runner de frecuencia anclado
// (veg_variety_engine2_freq.mjs), citados aquí en vez de reinventados:
//   - Día libre excluido para las tres unidades (freq.mjs:172).
//   - Vista B (unidad "plato"): universo COMPLETO, sin filtro de origen
//     (freq.mjs:181) -- un plato freeform o "desconocida" cuenta como
//     seleccionado pero no aporta identidad alguna.
//   - Vista A/C (unidades "combinación" e "identidad"): excluyen
//     vista.origen==='freeform' y vista.verdura.origen==='desconocida'
//     (freq.mjs:196-197).
//   - Combinación: solo platos con >=2 identidades en valorEfectivo
//     (freq.mjs:208), clave = identidades ordenadas alfabéticamente y
//     unidas con "|" (misma clave que Vista A, fusión V/V2 confirmada
//     simétrica aguas abajo -- ver informe de Fase 1 de la sesión que
//     construyó veg_variety_engine2_freq.mjs).
//
// GATES DE VALIDEZ (los tres deben pasar o el runner no escribe artefacto):
//   1. Headline recalculado idéntico a la baseline anclada (mismo gate que
//      veg_variety_engine2_freq.mjs).
//   2. Reconciliación con el artefacto de frecuencia YA COMMITEADO
//      (veg_variety_engine2_freq.md, leído de disco en esta misma carpeta):
//      para cada unidad, apariciones totales (entero exacto) y % de
//      semanas (string formateado con la MISMA función pct(), comparación
//      exacta de string) deben coincidir; además, el conjunto de claves
//      debe ser IDÉNTICO (ninguna unidad de más ni de menos). El parseo
//      del artefacto anclado separa columnas por la subcadena " | "
//      (espacio-pipe-espacio), NO por "|" a secas -- necesario porque la
//      clave de combinación usa "|" SIN espacios alrededor ("lechuga|pepino")
//      y colisionaría con el delimitador de la tabla si se partiera por
//      "|" ingenuamente (ver hallazgo de defecto de formato, banner final).
//   3. Invariante interno: para cada unidad, suma(histograma de intensidad)
//      === semanas afectadas (por construcción; se afirma como gate
//      defensivo, no debería poder fallar).
//
// HALLAZGO DE FORMATO (fuera de alcance de esta Fase, NO se repara aquí):
// la tabla de Vista A en veg_variety_engine2_freq.md usa "|" tanto como
// separador de columna markdown como parte literal de la clave de
// combinación ("lechuga|pepino"), lo cual rompe el renderizado de columnas
// de esa tabla en cualquier visor markdown estricto (el contenido de datos
// es correcto -- es un defecto de PRESENTACIÓN, no de cifras). Este runner
// lo sortea parseando por " | " en vez de "|", pero el defecto persiste en
// el artefacto ya commiteado y no se corrige aquí (no forma parte del
// encargo de Vista D).
//
// Determinismo: el runner ejecuta la campaña completa DOS VECES
// internamente y compara el contenido íntegro del artefacto (string) --
// solo escribe a disco si son idénticas.
// Ejecutable: node docs/evidence/variedad-verdura/veg_variety_engine2_intensity.mjs
// Independiente del runner legacy: NO importa nada de src/engine/**.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWeekArc } from '../../../src/engine2/skeleton/buildWeekArc.js';
import { runWalk } from '../../../src/engine2/walk/runWalk.js';
import { loadCatalog } from '../../../src/engine2/dishes/loadCatalog.js';
import { resolveDishComposition } from '../../../src/engine2/dishes/compositionResolver.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, 'veg_variety_engine2_intensity.md');
const FREQ_ARTIFACT_PATH = path.join(__dirname, 'veg_variety_engine2_freq.md');

// PROFILE verbatim de los runners anclados.
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

const N = 500;

const EXPECTED_BASELINE = {
  pctMax3: '98.6%',
  hist: { 1: 0, 2: 7, 3: 208, 4: 222, '5+': 63 },
  meanDistinct: '6.47',
  vocabSize: 17,
};

function pct(n, total) { return total ? (n / total * 100).toFixed(1) + '%' : '-'; }

function groupSlotsByDay(slots) {
  const days = [];
  let current = null;
  for (const slot of slots) {
    if (!current || current.day !== slot.day) {
      current = { day: slot.day, libre: false, comida: null, cena: null };
      days.push(current);
    }
    if (slot.fixedRole === 'libre') current.libre = true;
    current[slot.momento] = slot;
  }
  return days;
}

function computeWeekMetric(observations) {
  const daysByVeg = new Map();
  for (const { v, day } of observations) {
    if (!daysByVeg.has(v)) daysByVeg.set(v, new Set());
    daysByVeg.get(v).add(day);
  }
  let maxVegDays = 0;
  daysByVeg.forEach((days) => { if (days.size > maxVegDays) maxVegDays = days.size; });
  return { maxVegDays, distinctVegs: daysByVeg.size };
}

function runCampaignHeadline(weeksObservations) {
  const total = weeksObservations.length;
  let weeksWithMax3 = 0;
  const hist = { 1: 0, 2: 0, 3: 0, 4: 0, '5+': 0 };
  let sumDistinct = 0;
  const vocabulary = new Set();

  for (const obs of weeksObservations) {
    const { maxVegDays, distinctVegs } = computeWeekMetric(obs);
    if (maxVegDays >= 3) weeksWithMax3++;
    const bucket = maxVegDays >= 5 ? '5+' : (maxVegDays === 0 ? 1 : maxVegDays);
    hist[bucket] = (hist[bucket] || 0) + 1;
    sumDistinct += distinctVegs;
    obs.forEach(({ v }) => vocabulary.add(v));
  }

  return {
    pctMax3: pct(weeksWithMax3, total),
    hist,
    meanDistinct: (sumDistinct / total).toFixed(2),
    vocabSize: vocabulary.size,
  };
}

function histEquals(a, b) {
  return ['1', '2', '3', '4', '5+'].every((k) => a[k] === b[k]);
}

// ─── Parseo del artefacto de frecuencia YA COMMITEADO (gate 2) ────────
// Separa columnas por " | " (espacio-pipe-espacio), no por "|" a secas --
// ver banner del modulo (colisión con la clave de combinación).
function parseAnchoredFreqArtifact(mdPath) {
  const raw = fs.readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');

  function sectionLines(startMarker, endMarker) {
    const startIdx = lines.findIndex((l) => l.startsWith(startMarker));
    if (startIdx === -1) throw new Error(`parseAnchoredFreqArtifact: seccion "${startMarker}" no encontrada en ${mdPath}`);
    let endIdx = lines.findIndex((l, i) => i > startIdx && l.startsWith(endMarker));
    if (endIdx === -1) endIdx = lines.length;
    return lines.slice(startIdx, endIdx);
  }

  function dataRows(section) {
    const tableLines = section.filter((l) => l.startsWith('|'));
    // primeras dos lineas de tabla = cabecera + separador "|---|---|..."
    return tableLines.slice(2);
  }

  function splitRow(row) {
    const trimmed = row.trim();
    const inner = trimmed.replace(/^\|\s?/, '').replace(/\s?\|$/, '');
    return inner.split(' | ').map((c) => c.trim());
  }

  const comboRows = dataRows(sectionLines('## 5.', '## 6.'));
  const dishRows = dataRows(sectionLines('## 6.', '## 7.'));
  const identityRows = dataRows(sectionLines('## 7.', '## 8.'));

  const combos = new Map();
  for (const row of comboRows) {
    const [combinacion, total, pctSemanas] = splitRow(row);
    combos.set(combinacion, { total: Number(total), pctSemanas });
  }

  const dishes = new Map();
  for (const row of dishRows) {
    const [dishIdRaw, , , total, pctSemanas] = splitRow(row);
    const dishId = dishIdRaw.replace(/^`|`$/g, '');
    dishes.set(dishId, { total: Number(total), pctSemanas });
  }

  const identities = new Map();
  for (const row of identityRows) {
    const [identidad, total, pctSemanas] = splitRow(row);
    identities.set(identidad, { total: Number(total), pctSemanas });
  }

  return { combos, dishes, identities };
}

// ─── Campaña completa: un único recorrido de slots alimenta el gate
// headline (observations) Y los contadores por-semana de las tres
// unidades (dishId / combo-key / identidad) ─────────────────────────────
function runFullCampaign(catalog) {
  const catalogById = new Map(catalog.map((d) => [d.id, d]));
  const weeksObservations = [];

  // Map<unitKey, Map<weekIndex, count>>
  const dishWeekCounts = new Map();
  const comboWeekCounts = new Map();
  const identityWeekCounts = new Map();
  const dishMeta = new Map(); // dishId -> { nombre, esV2 }

  function bump(map, key, weekIdx) {
    if (!map.has(key)) map.set(key, new Map());
    const perWeek = map.get(key);
    perWeek.set(weekIdx, (perWeek.get(weekIdx) || 0) + 1);
  }

  for (let i = 0; i < N; i++) {
    const seed = i + 1;
    const { weekArc } = buildWeekArc({ profile: PROFILE, seed, strategy: 'x' });
    const { slots } = runWalk({ weekArc, catalog, seed, profile: PROFILE });
    const days = groupSlotsByDay(slots);

    const observations = [];
    let dayIndex = 0;
    for (const day of days) {
      if (day.libre) continue;
      for (const slot of [day.comida, day.cena]) {
        if (!slot || !slot.dishId) {
          throw new Error(`veg_variety_engine2_intensity: hueco sin dishId en ${day.day}/${slot ? slot.momento : '?'} (walk incompleto)`);
        }
        const dishId = slot.dishId;
        const dish = catalogById.get(dishId);
        const vista = resolveDishComposition(dish, {});

        // Unidad "plato": universo COMPLETO (freq.mjs:181).
        bump(dishWeekCounts, dishId, i);
        if (!dishMeta.has(dishId)) {
          dishMeta.set(dishId, { nombre: dish.nombre, esV2: Boolean(vista.tupla && vista.tupla.V2 !== null) });
        }

        // Unidades "combinación"/"identidad": mismos dos filtros que
        // Vista A/C (freq.mjs:196-197).
        if (vista.origen === 'freeform') continue;
        if (vista.verdura.origen === 'desconocida') continue;

        const ids = vista.verdura.valorEfectivo;
        for (const id of ids) {
          observations.push({ v: id, day: dayIndex });
          bump(identityWeekCounts, id, i);
        }
        if (ids.length >= 2) {
          const key = [...ids].sort().join('|');
          bump(comboWeekCounts, key, i);
        }
      }
      dayIndex++;
    }
    weeksObservations.push(observations);
  }

  return {
    headline: runCampaignHeadline(weeksObservations),
    dishWeekCounts,
    comboWeekCounts,
    identityWeekCounts,
    dishMeta,
  };
}

// ─── Estadística de intensidad por unidad ──────────────────────────────
function buildIntensityStats(weekCountsMap) {
  const rows = [];
  for (const [key, perWeek] of weekCountsMap.entries()) {
    const counts = [...perWeek.values()];
    const weeksAfectadas = counts.length;
    const total = counts.reduce((a, b) => a + b, 0);
    const hist = { 1: 0, 2: 0, 3: 0, '4+': 0 };
    for (const c of counts) {
      const bucket = c >= 4 ? '4+' : c;
      hist[bucket] = (hist[bucket] || 0) + 1;
    }
    const sumHist = hist[1] + hist[2] + hist[3] + hist['4+'];
    if (sumHist !== weeksAfectadas) {
      throw new Error(`buildIntensityStats: invariante rota para "${key}" -- suma(hist)=${sumHist} !== semanasAfectadas=${weeksAfectadas}`);
    }
    rows.push({
      key, weeksAfectadas, total, media: (total / weeksAfectadas).toFixed(2), hist, pctSemanas: pct(weeksAfectadas, N),
    });
  }
  return rows;
}

function sortRows(rows, tieBreak) {
  return [...rows].sort((a, b) => b.total - a.total || tieBreak(a, b));
}

// ─── Reconciliación (gate 2) ────────────────────────────────────────────
function reconcileUnit(label, rows, anchoredMap, keyFn) {
  const problems = [];
  const anchoredKeys = new Set(anchoredMap.keys());
  const ownKeys = new Set(rows.map(keyFn));

  for (const k of anchoredKeys) if (!ownKeys.has(k)) problems.push(`clave "${k}" presente en el artefacto anclado pero ausente en este runner (unidad ${label})`);
  for (const k of ownKeys) if (!anchoredKeys.has(k)) problems.push(`clave "${k}" presente en este runner pero ausente en el artefacto anclado (unidad ${label})`);

  for (const row of rows) {
    const k = keyFn(row);
    const anchored = anchoredMap.get(k);
    if (!anchored) continue; // ya reportado arriba
    if (anchored.total !== row.total) {
      problems.push(`unidad ${label} "${k}": total anclado=${anchored.total} vs recomputado=${row.total}`);
    }
    if (anchored.pctSemanas !== row.pctSemanas) {
      problems.push(`unidad ${label} "${k}": % semanas anclado=${anchored.pctSemanas} vs recomputado=${row.pctSemanas}`);
    }
  }
  return problems;
}

// ─── Serialización determinista del artefacto ──────────────────────────
function fmtHist(hist) {
  return `{1: ${hist[1]}, 2: ${hist[2]}, 3: ${hist[3]}, "4+": ${hist['4+']}}`;
}

function fmtSummaryRows(rows, labelFn) {
  return rows.map((r) => `| ${labelFn(r)} | ${r.weeksAfectadas} | ${r.total} | ${r.media} |`).join('\n');
}

function fmtDetailRows(rows, labelFn) {
  return rows.slice(0, 15).map((r) => `| ${labelFn(r)} | ${r.weeksAfectadas} | ${r.total} | ${r.media} | ${fmtHist(r.hist)} |`).join('\n');
}

function buildMarkdown({
  headline, comboRows, dishRows, identityRows, reconciliationProblems,
}) {
  const gateHeadlineOk = headline.pctMax3 === EXPECTED_BASELINE.pctMax3
    && histEquals(headline.hist, EXPECTED_BASELINE.hist)
    && headline.meanDistinct === EXPECTED_BASELINE.meanDistinct
    && headline.vocabSize === EXPECTED_BASELINE.vocabSize;
  const gateReconcileOk = reconciliationProblems.length === 0;

  const dishLabel = (r) => `\`${r.dishId}\` ${r.nombre}${r.esV2 ? ' [V2]' : ''}`;
  const comboLabel = (r) => r.key;
  const identityLabel = (r) => r.key;

  return `# Vista D — intensidad intra-semana (variedad de verdura, engine2)

## 1. Qué mide y por qué

Extiende \`veg_variety_engine2_freq.md\` con la dimensión que ese artefacto
no responde: no "en cuántas semanas aparece" una unidad (plato/combinación/
identidad), sino "cuántas veces aparece dentro de cada semana en la que
aparece". Una media de 2 apariciones/semana puede ser "siempre 2" o "mitad
1, mitad 3" -- el histograma de intensidad por semana afectada distingue
ambos casos. Esta vista NO interpreta el fenómeno ni propone mecanismo
alguno -- solo lo mide.

## 2. Metadatos de la campaña

Idénticos a los runners anclados (mismo PROFILE, N=500, semillas 1..500,
\`seed = i + 1\`, RNG mulberry32 vía \`buildWeekArc\`/\`runWalk\`). Ver
\`baseline-variedad-verdura.md\`, sección 2.

## 3. Universo y definiciones (idénticos al runner de frecuencia anclado)

- Unidad **plato** (\`dishId\`): universo completo de huecos no-libres, sin
  filtro de origen (\`veg_variety_engine2_freq.mjs:181\`).
- Unidades **combinación** e **identidad**: excluyen \`vista.origen ===
  'freeform'\` y \`vista.verdura.origen === 'desconocida'\`
  (\`veg_variety_engine2_freq.mjs:196-197\`). Combinación requiere >=2
  identidades en \`valorEfectivo\` (\`veg_variety_engine2_freq.mjs:208\`),
  clave = identidades ordenadas alfabéticamente unidas con \`|\`.
- Día \`fixedRole === 'libre'\` excluido para las tres unidades
  (\`veg_variety_engine2_freq.mjs:172\`).

## 4. Gate de validez — headline vs baseline anclada

| Métrica | Esperado | Observado | OK |
|---|---|---|---|
| % semanas maxVegDays>=3 | ${EXPECTED_BASELINE.pctMax3} | ${headline.pctMax3} | ${headline.pctMax3 === EXPECTED_BASELINE.pctMax3} |
| Histograma | ${JSON.stringify(EXPECTED_BASELINE.hist)} | ${JSON.stringify(headline.hist)} | ${histEquals(headline.hist, EXPECTED_BASELINE.hist)} |
| Media identidades/semana | ${EXPECTED_BASELINE.meanDistinct} | ${headline.meanDistinct} | ${headline.meanDistinct === EXPECTED_BASELINE.meanDistinct} |
| Vocabulario | ${EXPECTED_BASELINE.vocabSize} | ${headline.vocabSize} | ${headline.vocabSize === EXPECTED_BASELINE.vocabSize} |

**Gate headline: ${gateHeadlineOk ? 'OK' : 'FALLO'}**

## 5. Gate de validez — reconciliación con veg_variety_engine2_freq.md

Comparación exacta (entero de apariciones totales + string de % semanas)
contra el artefacto de frecuencia ya commiteado, para las tres unidades.

**Gate reconciliación: ${gateReconcileOk ? 'OK — 0 discrepancias' : `FALLO — ${reconciliationProblems.length} discrepancia(s)`}**
${gateReconcileOk ? '' : `\n${reconciliationProblems.map((p) => `- ${p}`).join('\n')}\n`}
## 6. Resultados — tabla resumen (todas las unidades)

### 6.1 Plato (\`dishId\`)

| plato | semanas afectadas | apariciones totales | media/semana afectada |
|---|---|---|---|
${fmtSummaryRows(dishRows, dishLabel)}

### 6.2 Combinación

| combinación | semanas afectadas | apariciones totales | media/semana afectada |
|---|---|---|---|
${fmtSummaryRows(comboRows, comboLabel)}

### 6.3 Identidad individual

| identidad | semanas afectadas | apariciones totales | media/semana afectada |
|---|---|---|---|
${fmtSummaryRows(identityRows, identityLabel)}

## 7. Resultados — top-15 con histograma de intensidad

Histograma: número de semanas afectadas con exactamente 1/2/3 apariciones
de la unidad esa semana, y "4+" para 4 o más.

### 7.1 Plato (top-15)

| plato | semanas afectadas | apariciones totales | media | histograma intensidad |
|---|---|---|---|---|
${fmtDetailRows(dishRows, dishLabel)}

### 7.2 Combinación (top-15)

| combinación | semanas afectadas | apariciones totales | media | histograma intensidad |
|---|---|---|---|---|
${fmtDetailRows(comboRows, comboLabel)}

### 7.3 Identidad individual (top-15)

| identidad | semanas afectadas | apariciones totales | media | histograma intensidad |
|---|---|---|---|---|
${fmtDetailRows(identityRows, identityLabel)}

## 8. Contrato de reproducción

Mismo contrato que \`baseline-variedad-verdura.md\` y
\`veg_variety_engine2_freq.md\` (mismo commit, mismas semillas, mismo
PROFILE, mismo catálogo). Reproducir con:

\`\`\`
node docs/evidence/variedad-verdura/veg_variety_engine2_intensity.mjs
\`\`\`

El runner ejecuta la campaña completa dos veces y compara el contenido
íntegro de este artefacto; una reproducción válida debe imprimir
\`determinismo: true\` y no debe reescribir este archivo con contenido
distinto.
`;
}

// ─── Ejecución ──────────────────────────────────────────────────────
const catalog = loadCatalog();
const anchoredFreq = parseAnchoredFreqArtifact(FREQ_ARTIFACT_PATH);

function buildArtifact() {
  const campaign = runFullCampaign(catalog);

  const dishStats = buildIntensityStats(campaign.dishWeekCounts).map((r) => ({
    ...r,
    dishId: r.key,
    nombre: campaign.dishMeta.get(r.key).nombre,
    esV2: campaign.dishMeta.get(r.key).esV2,
  }));
  const comboStats = buildIntensityStats(campaign.comboWeekCounts);
  const identityStats = buildIntensityStats(campaign.identityWeekCounts);

  const dishRows = sortRows(dishStats, (a, b) => a.nombre.localeCompare(b.nombre) || a.dishId.localeCompare(b.dishId));
  const comboRows = sortRows(comboStats, (a, b) => a.key.localeCompare(b.key));
  const identityRows = sortRows(identityStats, (a, b) => a.key.localeCompare(b.key));

  const problems = [
    ...reconcileUnit('plato', dishRows, anchoredFreq.dishes, (r) => r.dishId),
    ...reconcileUnit('combinación', comboRows, anchoredFreq.combos, (r) => r.key),
    ...reconcileUnit('identidad', identityRows, anchoredFreq.identities, (r) => r.key),
  ];

  const markdown = buildMarkdown({
    headline: campaign.headline, comboRows, dishRows, identityRows, reconciliationProblems: problems,
  });

  return {
    markdown, headline: campaign.headline, dishRows, comboRows, identityRows, problems,
  };
}

const run1 = buildArtifact();
const run2 = buildArtifact();

const deterministic = run1.markdown === run2.markdown;

console.log('\n=== VISTA D — intensidad intra-semana (N=500) ===');
console.log('\n--- Gate headline vs baseline anclada ---');
console.log(JSON.stringify(run1.headline));

console.log('\n--- Gate reconciliación vs veg_variety_engine2_freq.md ---');
console.log(run1.problems.length === 0 ? 'OK — 0 discrepancias' : `FALLO — ${run1.problems.length} discrepancia(s):`);
run1.problems.forEach((p) => console.log(' -', p));

console.log('\n--- Plato (top 5) ---');
run1.dishRows.slice(0, 5).forEach((r) => console.log(`${r.nombre}${r.esV2 ? ' [V2]' : ''}: semanas=${r.weeksAfectadas} total=${r.total} media=${r.media} hist=${JSON.stringify(r.hist)}`));

console.log('\n--- Combinación (top 5) ---');
run1.comboRows.slice(0, 5).forEach((r) => console.log(`${r.key}: semanas=${r.weeksAfectadas} total=${r.total} media=${r.media} hist=${JSON.stringify(r.hist)}`));

console.log('\n--- Identidad (top 5) ---');
run1.identityRows.slice(0, 5).forEach((r) => console.log(`${r.key}: semanas=${r.weeksAfectadas} total=${r.total} media=${r.media} hist=${JSON.stringify(r.hist)}`));

console.log('\n=== DETERMINISMO (doble corrida completa, artefacto completo) ===');
console.log('run1 === run2:', deterministic);

const gateHeadlineOk = run1.headline.pctMax3 === EXPECTED_BASELINE.pctMax3
  && histEquals(run1.headline.hist, EXPECTED_BASELINE.hist)
  && run1.headline.meanDistinct === EXPECTED_BASELINE.meanDistinct
  && run1.headline.vocabSize === EXPECTED_BASELINE.vocabSize;
const gateReconcileOk = run1.problems.length === 0;

console.log('\n=== GATES DE VALIDEZ ===');
console.log('Gate headline OK:', gateHeadlineOk);
console.log('Gate reconciliación OK:', gateReconcileOk);

if (!gateHeadlineOk) console.error('\nERROR: el headline recalculado no reproduce la baseline anclada.');
if (!gateReconcileOk) console.error('\nERROR: discrepancia(s) contra veg_variety_engine2_freq.md — ver detalle arriba.');
if (!deterministic) console.error('\nERROR: la campaña no es determinista entre corridas completas (artefacto difiere).');

if (!gateHeadlineOk || !gateReconcileOk || !deterministic) {
  console.error('\nNo se escribe artefacto.');
  process.exit(1);
}

fs.writeFileSync(OUTPUT_PATH, run1.markdown, 'utf8');
console.log('\nArtefacto escrito:', OUTPUT_PATH);
