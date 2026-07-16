// ============================================================
// EXTENSIÓN — Runner de vistas de frecuencia adicionales sobre la campaña
// anclada de variedad de verdura (engine2). NO toca el motor: ningún
// archivo bajo src/engine2/ (ni src/engine/, ni src/eval/) se modifica.
// Solo añade este runner y su artefacto de salida en esta carpeta.
//
// Propósito: la baseline anclada (baseline-variedad-verdura.md) mide
// variedad a nivel de IDENTIDAD de verdura agregada (histograma de
// maxVegDays, vocabulario). Este runner añade tres vistas complementarias
// sobre la MISMA campaña (mismas semillas, mismo perfil, N=500):
//   Vista A — combinación de identidades por plato con >=2 ejes de verdura.
//   Vista B — frecuencia de selección por plato (dishId), universo
//             COMPLETO de huecos (sin el filtro de origen que aplica la
//             métrica de verdura), marcando los platos con eje V2.
//   Vista C — frecuencia por identidad individual (eje-agnóstica).
//
// RÉPLICA DELIBERADA (mismo patrón que veg_variety_engine2_v2diag.mjs,
// banner citado): veg_variety_engine2.mjs es un script de tope de nivel
// que no exporta runWeek/collectWeekObservations/runCampaign — imposible
// importarlas sin ejecutar sus side effects (console.log inmediato). Este
// runner reconstruye el mismo procedimiento de generación (buildWeekArc +
// runWalk, mismo PROFILE, N=500, seed=i+1) a partir de las MISMAS
// primitivas importadas (buildWeekArc, runWalk, loadCatalog,
// resolveDishComposition) que usa el runner anclado.
//
// GATE DE VALIDEZ: en el mismo recorrido de slots, este runner también
// recalcula las 4 cifras headline de la baseline anclada (pctMax3, hist,
// meanDistinct, vocabSize) exactamente con la misma lógica de
// collectWeekObservations/computeWeekMetric que veg_variety_engine2.mjs —
// si no coinciden con la baseline anclada, el runner se detiene (exit 1)
// sin escribir el artefacto: las vistas nuevas solo son válidas si nacen
// de la MISMA campaña que ya se verificó reproducible.
//
// Vista B universo: TODOS los platos seleccionados en huecos NO libres
// (mismo criterio de día que la métrica de verdura, día.libre excluido),
// sin filtrar por vista.origen ni vista.verdura.origen -- a diferencia de
// Vista A/C, que sí aplican esos dos filtros (mismos que la baseline
// anclada) porque solo tiene sentido hablar de "identidad de verdura" en
// ese universo. Un plato freeform o de origen "desconocida" SI cuenta en
// Vista B (fue seleccionado), pero contribuye 0 identidades a Vista C y
// nunca aparece en Vista A.
//
// Marcado V2 en Vista B: vista.tupla.V2 !== null (campo ya expuesto por
// resolveScaffoldComposition, compositionResolver.js:222/228 -- no hace
// falta reparsear la tupla como hace v2diag.mjs, que sí necesitaba
// bypasear la fusión; aquí solo necesitamos saber si V2 existe).
//
// Determinismo: el runner ejecuta la campaña completa DOS VECES
// internamente y compara el contenido completo del artefacto (string) —
// solo escribe a disco si son idénticas. Ejecútese además dos veces desde
// la shell para confirmar también a nivel de proceso.
// Ejecutable: node docs/evidence/variedad-verdura/veg_variety_engine2_freq.mjs
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
const OUTPUT_PATH = path.join(__dirname, 'veg_variety_engine2_freq.md');

// PROFILE verbatim del runner anclado (veg_variety_engine2.mjs:29-43) —
// misma campaña, mismo perfil.
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

// Baseline anclada en baseline-variedad-verdura.md, sección 4 (ENGINE2
// PRINCIPAL). Gate de validez de este runner.
const EXPECTED_BASELINE = {
  pctMax3: '98.6%',
  hist: { 1: 0, 2: 7, 3: 208, 4: 222, '5+': 63 },
  meanDistinct: '6.47',
  vocabSize: 17,
};

function pct(n, total) { return total ? (n / total * 100).toFixed(1) + '%' : '-'; }

// ─── Agrupación de slots por día (idéntica a veg_variety_engine2.mjs:86-97) ───
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

// ─── Métrica headline compartida (idéntica a veg_variety_engine2.mjs:47-56) ───
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

// ─── Campaña completa: un único recorrido de slots alimenta el gate
// headline (observations) Y las tres vistas nuevas (dishStats/
// identityStats/comboStats) ───────────────────────────────────────────
function runFullCampaign(catalog) {
  const catalogById = new Map(catalog.map((d) => [d.id, d]));
  const weeksObservations = [];
  const dishStats = new Map();     // dishId -> { nombre, esV2, total, weeks: Set<seedIndex> }
  const identityStats = new Map(); // identidad -> { total, weeks: Set<seedIndex> }
  const comboStats = new Map();    // "id1|id2" -> { total, weeks: Set<seedIndex>, dishIds: Set<dishId> }

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
          throw new Error(`veg_variety_engine2_freq: hueco sin dishId en ${day.day}/${slot ? slot.momento : '?'} (walk incompleto)`);
        }
        const dishId = slot.dishId;
        const dish = catalogById.get(dishId);
        const vista = resolveDishComposition(dish, {});

        // Vista B: universo COMPLETO (sin filtro de origen) -- ver banner.
        if (!dishStats.has(dishId)) {
          dishStats.set(dishId, {
            nombre: dish.nombre,
            esV2: Boolean(vista.tupla && vista.tupla.V2 !== null),
            total: 0,
            weeks: new Set(),
          });
        }
        const dstat = dishStats.get(dishId);
        dstat.total += 1;
        dstat.weeks.add(i);

        // Vista A/C y gate headline: mismos dos buckets excluidos que la
        // baseline anclada (freeform, verdura "desconocida").
        if (vista.origen === 'freeform') continue;
        if (vista.verdura.origen === 'desconocida') continue;

        const ids = vista.verdura.valorEfectivo;
        for (const id of ids) {
          observations.push({ v: id, day: dayIndex });
          if (!identityStats.has(id)) identityStats.set(id, { total: 0, weeks: new Set() });
          const istat = identityStats.get(id);
          istat.total += 1;
          istat.weeks.add(i);
        }

        if (ids.length >= 2) {
          const key = [...ids].sort().join('|');
          if (!comboStats.has(key)) comboStats.set(key, { total: 0, weeks: new Set(), dishIds: new Set() });
          const cstat = comboStats.get(key);
          cstat.total += 1;
          cstat.weeks.add(i);
          cstat.dishIds.add(dishId);
        }
      }
      dayIndex++;
    }
    weeksObservations.push(observations);
  }

  return {
    headline: runCampaignHeadline(weeksObservations),
    dishStats,
    identityStats,
    comboStats,
  };
}

// ─── Serialización determinista de las tres vistas ────────────────────
function buildViewA(comboStats) {
  const rows = [...comboStats.entries()].map(([key, s]) => ({
    combinacion: key,
    aparicionesTotales: s.total,
    pctSemanas: pct(s.weeks.size, N),
    weeksCount: s.weeks.size,
    nDishIdsDistintos: s.dishIds.size,
  }));
  rows.sort((a, b) => b.aparicionesTotales - a.aparicionesTotales || a.combinacion.localeCompare(b.combinacion));
  return rows;
}

function buildViewB(dishStats) {
  const rows = [...dishStats.entries()].map(([dishId, s]) => ({
    dishId,
    nombre: s.nombre,
    esV2: s.esV2,
    aparicionesTotales: s.total,
    pctSemanas: pct(s.weeks.size, N),
    weeksCount: s.weeks.size,
  }));
  rows.sort((a, b) => b.aparicionesTotales - a.aparicionesTotales
    || a.nombre.localeCompare(b.nombre)
    || a.dishId.localeCompare(b.dishId));
  return rows;
}

function buildViewC(identityStats) {
  const rows = [...identityStats.entries()].map(([identidad, s]) => ({
    identidad,
    aparicionesTotales: s.total,
    pctSemanas: pct(s.weeks.size, N),
    weeksCount: s.weeks.size,
  }));
  rows.sort((a, b) => b.aparicionesTotales - a.aparicionesTotales || a.identidad.localeCompare(b.identidad));
  return rows;
}

// ─── Reconciliación (Fase 3.2): suma de Vista C derivable de Vista A+B ─
function reconcile(viewA, viewB, viewC) {
  const sumC = viewC.reduce((acc, r) => acc + r.aparicionesTotales, 0);
  // Cada fila de Vista A aporta 2 identidades por aparicion (combos de
  // exactamente 2 ejes -- el catalogo actual no tiene tuplas con mas de
  // V/V2, ver R-0.1 del reconocimiento previo).
  const sumFromA = viewA.reduce((acc, r) => acc + r.aparicionesTotales * 2, 0);
  return { sumC, sumFromA };
}

function fmtRowsA(rows) {
  return rows.map((r) => `| ${r.combinacion} | ${r.aparicionesTotales} | ${r.pctSemanas} | ${r.nDishIdsDistintos} |`).join('\n');
}
function fmtRowsB(rows) {
  return rows.map((r) => `| \`${r.dishId}\` | ${r.nombre} | ${r.esV2 ? 'sí' : 'no'} | ${r.aparicionesTotales} | ${r.pctSemanas} |`).join('\n');
}
function fmtRowsC(rows) {
  return rows.map((r) => `| ${r.identidad} | ${r.aparicionesTotales} | ${r.pctSemanas} |`).join('\n');
}

function buildMarkdown({
  headline, viewA, viewB, viewC, reconciliation, sumB2Contrib,
}) {
  const gateOk = headline.pctMax3 === EXPECTED_BASELINE.pctMax3
    && histEquals(headline.hist, EXPECTED_BASELINE.hist)
    && headline.meanDistinct === EXPECTED_BASELINE.meanDistinct
    && headline.vocabSize === EXPECTED_BASELINE.vocabSize;

  return `# Vistas de frecuencia adicionales sobre variedad de verdura (engine2)

## 1. Qué mide y por qué

Extensión de la campaña anclada en \`baseline-variedad-verdura.md\`. Esa
campaña mide variedad a nivel de identidad agregada (histograma de
\`maxVegDays\`, tamaño de vocabulario) pero no permite responder "¿con qué
frecuencia se selecciona CADA plato?" ni "¿con qué frecuencia aparece CADA
combinación de identidades en un mismo plato?". Este runner añade tres
vistas complementarias sobre la MISMA secuencia de planes generados,
sin modificar el motor ni la métrica original.

## 2. Metadatos de la campaña

Idénticos a la campaña anclada (mismo PROFILE, N=500, semillas 1..500,
\`seed = i + 1\`, RNG mulberry32 vía \`selectRng\`/\`buildWeekArc\`). Ver
\`baseline-variedad-verdura.md\`, sección 2.

## 3. Definición de las vistas

- **Universo Vista A/C**: idéntico al de la baseline anclada — excluye
  huecos con \`vista.origen === 'freeform'\` y huecos con
  \`vista.verdura.origen === 'desconocida'\`, y excluye días
  \`fixedRole === 'libre'\`.
- **Universo Vista B**: TODOS los huecos no-libres, sin el filtro de
  origen anterior — ver banner del runner para la justificación.
- **Vista A** (combinación de identidades): para cada plato seleccionado
  con >=2 identidades en \`valorEfectivo\`, clave = identidades ordenadas
  alfabéticamente y unidas con \`|\` (fusión V/V2 confirmada simétrica
  aguas abajo — ver informe de Fase 1 de esta sesión; ninguna posición
  se trata de forma distinta en ningún consumidor real).
- **Vista B** (por plato): \`dishId\` → nombre → apariciones totales → %
  semanas con >=1 aparición. Marca \`esV2\` = true si \`vista.tupla.V2 !==
  null\` (solo aplica a origen scaffold).
- **Vista C** (por identidad individual): misma regla de identidad que la
  baseline anclada (eje-agnóstica, D-042/D-043).

## 4. Gate de validez frente a la baseline anclada

| Métrica | Esperado | Observado | OK |
|---|---|---|---|
| % semanas maxVegDays>=3 | ${EXPECTED_BASELINE.pctMax3} | ${headline.pctMax3} | ${headline.pctMax3 === EXPECTED_BASELINE.pctMax3} |
| Histograma | ${JSON.stringify(EXPECTED_BASELINE.hist)} | ${JSON.stringify(headline.hist)} | ${histEquals(headline.hist, EXPECTED_BASELINE.hist)} |
| Media identidades/semana | ${EXPECTED_BASELINE.meanDistinct} | ${headline.meanDistinct} | ${headline.meanDistinct === EXPECTED_BASELINE.meanDistinct} |
| Vocabulario | ${EXPECTED_BASELINE.vocabSize} | ${headline.vocabSize} | ${headline.vocabSize === EXPECTED_BASELINE.vocabSize} |

**Gate global: ${gateOk ? 'OK' : 'FALLO'}**

## 5. Resultados — Vista A (combinaciones de identidades, >=2 ejes)

| combinación | apariciones totales | % semanas >=1 | nº dishId distintos |
|---|---|---|---|
${fmtRowsA(viewA)}

## 6. Resultados — Vista B (por plato, universo completo)

| dishId | nombre | eje V2 | apariciones totales | % semanas >=1 |
|---|---|---|---|---|
${fmtRowsB(viewB)}

## 7. Resultados — Vista C (por identidad individual)

| identidad | apariciones totales | % semanas >=1 |
|---|---|---|
${fmtRowsC(viewC)}

## 8. Reconciliación (Vista C derivable de Vista A + Vista B)

Relación exacta: cada aparición de un plato en el universo A/C contribuye
tantas identidades a la suma de Vista C como elementos tenga su
\`valorEfectivo\` (0 para freeform/"desconocida" — no entran en A/C; 1 para
un plato con solo V; 2 para un plato con V+V2, que es exactamente lo que
cuenta Vista A). Por tanto:

\`suma(Vista C) = 2 x suma(Vista A) + suma(apariciones de platos del
universo A/C con exactamente 1 identidad)\`

- Suma de apariciones, Vista C: **${reconciliation.sumC}**
- 2 x suma de apariciones, Vista A: **${reconciliation.sumFromA}**
- Apariciones de platos con exactamente 1 identidad (universo A/C): **${sumB2Contrib}**
- Reconstrucción: 2 x ${reconciliation.sumFromA / 2} + ${sumB2Contrib} = **${reconciliation.sumFromA + sumB2Contrib}**
- Coincide con suma de Vista C: **${reconciliation.sumFromA + sumB2Contrib === reconciliation.sumC}**

## 9. Contrato de reproducción

Mismo contrato que \`baseline-variedad-verdura.md\`, sección 5 (mismo
commit, mismas semillas, mismo PROFILE, mismo catálogo). Reproducir con:

\`\`\`
node docs/evidence/variedad-verdura/veg_variety_engine2_freq.mjs
\`\`\`

El runner ejecuta la campaña completa dos veces y compara el contenido
íntegro de este artefacto; una reproducción válida debe imprimir
\`determinismo: true\` y no debe reescribir este archivo con contenido
distinto.
`;
}

// ─── Ejecución ──────────────────────────────────────────────────────
const catalog = loadCatalog();

function buildArtifact() {
  const campaign = runFullCampaign(catalog);
  const viewA = buildViewA(campaign.comboStats);
  const viewB = buildViewB(campaign.dishStats);
  const viewC = buildViewC(campaign.identityStats);
  const reconciliation = reconcile(viewA, viewB, viewC);

  // Apariciones de platos del universo A/C con EXACTAMENTE 1 identidad:
  // dishStats no distingue universo A/C vs B por si solo (Vista B es
  // superset); recomputamos filtrando por vista real.
  let sumB2Contrib = 0;
  for (const [dishId, s] of campaign.dishStats.entries()) {
    const dish = catalog.find((d) => d.id === dishId);
    const vista = resolveDishComposition(dish, {});
    if (vista.origen === 'freeform') continue;
    if (vista.verdura.origen === 'desconocida') continue;
    if (vista.verdura.valorEfectivo.length === 1) sumB2Contrib += s.total;
  }

  const markdown = buildMarkdown({
    headline: campaign.headline, viewA, viewB, viewC, reconciliation, sumB2Contrib,
  });
  return { markdown, headline: campaign.headline, viewA, viewB, viewC };
}

const run1 = buildArtifact();
const run2 = buildArtifact();

const deterministic = run1.markdown === run2.markdown;

console.log('\n=== EXTENSIÓN — Vistas de frecuencia (N=500) ===');
console.log('\n--- Gate headline vs baseline anclada ---');
console.log(JSON.stringify(run1.headline));

console.log('\n--- Vista A (top 10) ---');
run1.viewA.slice(0, 10).forEach((r) => console.log(`${r.combinacion}: ${r.aparicionesTotales} (${r.pctSemanas}, ${r.nDishIdsDistintos} dishId)`));

console.log('\n--- Vista B (top 10) ---');
run1.viewB.slice(0, 10).forEach((r) => console.log(`${r.nombre} [${r.esV2 ? 'V2' : '-'}]: ${r.aparicionesTotales} (${r.pctSemanas})`));

console.log('\n--- Vista C (top 10) ---');
run1.viewC.slice(0, 10).forEach((r) => console.log(`${r.identidad}: ${r.aparicionesTotales} (${r.pctSemanas})`));

console.log('\n=== DETERMINISMO (doble corrida completa, artefacto completo) ===');
console.log('run1 === run2:', deterministic);

const gateOk = run1.headline.pctMax3 === EXPECTED_BASELINE.pctMax3
  && histEquals(run1.headline.hist, EXPECTED_BASELINE.hist)
  && run1.headline.meanDistinct === EXPECTED_BASELINE.meanDistinct
  && run1.headline.vocabSize === EXPECTED_BASELINE.vocabSize;

console.log('\n=== GATE DE VALIDEZ (headline vs baseline anclada) ===');
console.log('Gate OK:', gateOk);

if (!gateOk) {
  console.error('\nERROR: el headline recalculado no reproduce la baseline anclada — extension INVALIDA. No se escribe artefacto.');
}
if (!deterministic) {
  console.error('\nERROR: la campaña no es determinista entre corridas completas (artefacto difiere). No se escribe artefacto.');
}
if (!gateOk || !deterministic) {
  process.exit(1);
}

fs.writeFileSync(OUTPUT_PATH, run1.markdown, 'utf8');
console.log('\nArtefacto escrito:', OUTPUT_PATH);
