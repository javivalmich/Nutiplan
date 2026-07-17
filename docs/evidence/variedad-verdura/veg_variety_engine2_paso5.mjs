// ============================================================
// CAMPAÑA F-M — Runner hermano: descomposición por vía + intervención de
// paso 5 (Fase 4, Componente P2b-iii, D-044 criterio de aceptación (vi)).
// Propósito: medir la dirección de cambio que exige el criterio (vi) —
// "menos concentración de identidad en la ruta rotativa" — sobre la MISMA
// campaña ancha de D-042 (N=500, semillas 1..500), ahora con el mecanismo
// de identidad de variedad (paso 5, D-044) activo dentro de runWalk.
//
// RÉPLICA DELIBERADA (mismo patrón que veg_variety_engine2_v2diag.mjs y
// veg_variety_engine2_freq.mjs, banners citados): reconstruye el mismo
// andamiaje de generación (buildWeekArc + runWalk, mismo PROFILE, N=500,
// seed=i+1) que veg_variety_engine2.mjs @ 9b8d489 — ese fichero NO se
// toca ni se importa (F-M1: es un script de tope de nivel sin exports,
// imposible importar sus funciones sin ejecutar sus side effects).
// ADVERTENCIA DE DERIVA (mismo patrón que v2diag.mjs:16-18): cualquier
// modificación del andamiaje canónico en veg_variety_engine2.mjs, en
// veg_variety_engine2_freq.mjs (de donde se replica la agrupación por
// día y la cabecera compartida), o en las primitivas del motor
// (buildWeekArc/runWalk/loadCatalog/resolveDishComposition/frequencies.js)
// obliga a revisar esta copia antes de reutilizar la campaña — la deriva
// debe ser auditable, no silenciosa.
//
// "Las diferencias observadas respecto a D-042 son el objeto de medida,
// no un fallo del runner" (F-M2).
// "Toda métrica compartida con campañas anteriores se implementa
// reutilizando exactamente la definición ya versionada; únicamente se
// añaden métricas nuevas" (F-M3).
//
// Régimen: no toca src/engine2/** (solo lo importa), no toca ninguno de
// los cuatro artefactos anclados de esta carpeta. Independiente del
// runner legacy: NO importa nada de src/engine/**.
// Ejecutable: node docs/evidence/variedad-verdura/veg_variety_engine2_paso5.mjs
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildWeekArc } from '../../../src/engine2/skeleton/buildWeekArc.js';
import { runWalk } from '../../../src/engine2/walk/runWalk.js';
import { loadCatalog, CATALOG_PATH } from '../../../src/engine2/dishes/loadCatalog.js';
import { resolveDishComposition } from '../../../src/engine2/dishes/compositionResolver.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const OUTPUT_PATH = path.join(__dirname, 'veg_variety_engine2_paso5.md');

// ─── F-M6: ritual de anclaje — hash del catálogo y HEAD del repo ──────
const catalogBytes = fs.readFileSync(CATALOG_PATH);
const CATALOG_SHA256 = crypto.createHash('sha256').update(catalogBytes).digest('hex');
const HEAD_SHA = execSync('git rev-parse HEAD', { cwd: REPO_ROOT }).toString().trim();

// PROFILE verbatim de veg_variety_engine2.mjs:29-43 (F-M1: copia, no
// import — ese fichero no exporta nada).
const PROFILE = {
  weight: 74,
  goal: 'maintain',
  activity: 'moderate',
  intolerances: [],
  trainingDays: [],
  extras: {},
  mealsPerDay: 3,
  tiempoCocina: 'normal',
  experiencia: 'intermedio',
  simpleMode: false,
  dob: '1990-01-01',
  gender: 'male',
  height: 178,
};

const N = 500; // veg_variety_engine2.mjs:128

// ─── Comparación contra los cuatro artefactos anclados (D-044 punto 9,
// DECISIONS.md:2102-2105) — cifras citadas, NUNCA recalculadas aquí ────
const ANCLA_BASELINE = {
  ruta: 'baseline-variedad-verdura.md', commit: '9b8d489 (código 7024bda)',
  pctMax3: '98.6%', hist: { 1: 0, 2: 7, 3: 208, 4: 222, '5+': 63 }, meanDistinct: '6.47', vocabSize: 17,
}; // baseline-variedad-verdura.md:88-91
const ANCLA_LEGACY = {
  ruta: 'baseline-variedad-verdura.md (bloque LEGACY)', commit: '9b8d489 (código 7024bda)',
  pctMax3: '69.6%', hist: { 1: 0, 2: 152, 3: 249, 4: 88, '5+': 11 }, meanDistinct: '7.96', vocabSize: 17,
}; // baseline-variedad-verdura.md:97-100
const ANCLA_V2DIAG = { ruta: 'veg_variety_engine2_v2diag.mjs', commit: 'd076ce7' }; // D-043, DECISIONS.md:2016-2017
// Vista C anclada (freq.md:293-311) — top identidades por apariciones totales.
const ANCLA_FREQ_VISTA_C = {
  ruta: 'veg_variety_engine2_freq.md', commit: '666b3ad',
  tomate: { total: 949, pctSemanas: '79.6%' },
  zanahoria: { total: 825, pctSemanas: '58.4%' },
  pimientos: { total: 823, pctSemanas: '66.4%' },
}; // freq.md:295-297
// Intensidad anclada (intensity.md:358-360) — top identidades.
const ANCLA_INTENSITY = {
  ruta: 'veg_variety_engine2_intensity.md', commit: '94ae734',
  tomate: { semanasAfectadas: 398, total: 949, media: '2.38', hist: { 1: 134, 2: 85, 3: 100, '4+': 79 } },
  zanahoria: { semanasAfectadas: 292, total: 825, media: '2.83', hist: { 1: 102, 2: 24, 3: 35, '4+': 131 } },
  pimientos: { semanasAfectadas: 332, total: 823, media: '2.48', hist: { 1: 122, 2: 65, 3: 56, '4+': 89 } },
}; // intensity.md:358-360

// ─── Métricas compartidas — definición verbatim (F-M3) ─────────────────
// baseline-variedad-verdura.md:66-70 ("maxVegDays: para cada semana, se
// agrupan las observaciones por identidad de verdura (Map<identidad,
// Set<day>>); maxVegDays es el mayor número de días distintos en los que
// aparece una misma identidad"). Idéntica a veg_variety_engine2.mjs:47-56.
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

function pct(n, total) { return total ? (n / total * 100).toFixed(1) + '%' : '-'; }

// veg_variety_engine2.mjs:60-82 (idéntica).
function runCampaignHeadline(weeksObservations) {
  const total = weeksObservations.length;
  let weeksWithMax3 = 0;
  const hist = {
    1: 0, 2: 0, 3: 0, 4: 0, '5+': 0,
  };
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
  return ['1', '2', '3', '4', '5+'].every((k) => String(a[k]) === String(b[k]));
}

// veg_variety_engine2.mjs:86-97 / veg_variety_engine2_freq.mjs:98-111 (idéntica).
function groupSlotsByDay(slots) {
  const days = [];
  let current = null;
  for (const slot of slots) {
    if (!current || current.day !== slot.day) {
      current = {
        day: slot.day, libre: false, comida: null, cena: null,
      };
      days.push(current);
    }
    if (slot.fixedRole === 'libre') current.libre = true;
    current[slot.momento] = slot;
  }
  return days;
}

// ─── Métrica nueva 1: descomposición por vía (F-M, 1.4) ────────────────
// Causas literales de P1a (ancla/sobra) que identifican una colocación:
//   'ancla_momento_unico'        expandWeekArc.js:163
//   'ancla_desempate_rng'        expandWeekArc.js:171
//   'sobra_momento_unico'        expandWeekArc.js:182
//   'sobra_hereda_momento_ancla' expandWeekArc.js:188
//   'colision_momento_restante'  expandWeekArc.js:137 (colisión resuelta;
//     pierde la distinción ancla-vs-sobra de ORIGEN, pero sigue siendo
//     inequívocamente P1a — ninguna otra fase del walk emite esta causa)
// Causas de P1b genérico (rotativo):
//   'seleccion_rotativo_candidato_unico' runWalk.js:375
//   'seleccion_rotativo_desempate_rng'   runWalk.js:380
// Causas de P1b capricho: bajo el catálogo real (0/241 rol="capricho",
// comentario runWalk.js:41) esta rama nunca coloca un plato — el pool
// está vacío en todas las semanas y degrada siempre a rotativo genérico
// vía el EVENTO 'capricho_degradado_a_rotativo' (runWalk.js:268, sin
// plato asociado, no participa de esta clasificación). Las causas
// 'capricho_candidato_unico' (runWalk.js:279) y 'capricho de la semana'
// (runWalk.js:285) quedan declaradas para completar la clasificación;
// el runner VERIFICA por conteo que su frecuencia es 0 (aviso en stdout
// si no lo es, sin exit≠0 — es verificación de supuesto, no gate de
// validez).
const VIA_ANCLA_SOBRA = new Set([
  'ancla_momento_unico', 'ancla_desempate_rng',
  'sobra_momento_unico', 'sobra_hereda_momento_ancla',
  'colision_momento_restante',
]);
const VIA_ROTATIVO = new Set(['seleccion_rotativo_candidato_unico', 'seleccion_rotativo_desempate_rng']);
const VIA_CAPRICHO = new Set(['capricho_candidato_unico', 'capricho de la semana']);

function clasificarVia(causa) {
  if (VIA_ROTATIVO.has(causa)) return 'rotativo';
  if (VIA_ANCLA_SOBRA.has(causa)) return 'ancla_sobra';
  if (VIA_CAPRICHO.has(causa)) return 'capricho';
  throw new Error(`veg_variety_engine2_paso5: causa de colocacion no reconocida en la clasificacion de via: "${causa}"`);
}

// Esta métrica (descomposición por vía, por identidad) NACE AQUÍ: no
// existe comparativa histórica porque su definición no estaba versionada
// antes de este artefacto (F-M4-B).
function buildCausaPorHueco(decisionLog) {
  const map = new Map();
  for (const entry of decisionLog) {
    if (entry.plato === undefined) continue; // evento, no colocacion
    map.set(`${entry.day}::${entry.momento}`, entry.causa);
  }
  return map;
}

// ─── Métrica nueva 2: intervención de paso 5 (F-M, 1.5, F-M7-A) ────────
// Casado de prosa sobre las dos formas verificadas del texto emitido por
// chooseIdentityLevel (frequencies.js:436-467). El campo `causa` propio
// de paso 5 (identidad_verdura_preferencia_aplicada /
// identidad_verdura_reversion_nivel_vacio) NUNCA se concatena en el
// `evidencia` final del hueco (ver runWalk.js:365-367 y :390 — solo el
// texto `evidencia` de chooseIdentityLevel, no su `causa`, se embebe) —
// por eso el conteo se hace por PROSA, no por el nombre literal de la
// causa. El parseo depende de la redacción ACTUAL de `notaIdentidad` en
// frequencies.js; el gate de exhaustividad que sigue existe para que
// cualquier cambio de redacción rompa este runner de forma inmediata y
// ruidosa, nunca en silencio.
const PATRON_PREFERENCIA = 'nivel preferente = '; // frequencies.js:464-465 (identidad_verdura_preferencia_aplicada)
const PATRON_REVERSION = 'particion preferente vacia (INV-1'; // frequencies.js:451-452 (identidad_verdura_reversion_nivel_vacio)

// Gate de exhaustividad (obligatorio): toda entrada del decisionLog cuya
// evidencia contenga "paso 5:" debe casar con EXACTAMENTE uno de los dos
// patrones. Cero, ambos, o una tercera variante -> exit != 0 imprimiendo
// la entrada problemática (semilla, día, momento, evidencia completa).
function verificarExhaustividadPaso5(decisionLog, seed) {
  for (const entry of decisionLog) {
    if (!entry.evidencia || !entry.evidencia.includes('paso 5:')) continue;
    const matchPref = entry.evidencia.includes(PATRON_PREFERENCIA);
    const matchRev = entry.evidencia.includes(PATRON_REVERSION);
    const matches = (matchPref ? 1 : 0) + (matchRev ? 1 : 0);
    if (matches !== 1) {
      console.error('\nERROR: gate de exhaustividad paso 5 (patrones de prosa) fallo.');
      console.error('seed:', seed, '| day:', entry.day, '| momento:', entry.momento);
      console.error('coincidencias:', matches, '(esperado exactamente 1)');
      console.error('evidencia completa:', entry.evidencia);
      process.exit(1);
    }
  }
}

// ─── Recolección por semana ─────────────────────────────────────────────
function runWeek(seed, catalog) {
  const { weekArc } = buildWeekArc({ profile: PROFILE, seed, strategy: 'x' });
  return runWalk({
    weekArc, catalog, seed, profile: PROFILE,
  });
}

function collectWeekData(slots, decisionLog, catalog, seedIndex) {
  const causaPorHueco = buildCausaPorHueco(decisionLog);
  const days = groupSlotsByDay(slots);
  const headlineObservations = [];
  const identityWeekCounts = new Map(); // identidad -> apariciones esta semana
  const identityViaWeekCounts = new Map(); // identidad -> {rotativo,ancla_sobra,capricho} esta semana

  let dayIndex = 0;
  for (const day of days) {
    if (day.libre) continue;
    for (const slot of [day.comida, day.cena]) {
      if (!slot || !slot.dishId) {
        throw new Error(`veg_variety_engine2_paso5: hueco sin dishId en ${day.day}/${slot ? slot.momento : '?'} (seed=${seedIndex + 1})`);
      }
      const dish = catalog.find((d) => d.id === slot.dishId);
      const vista = resolveDishComposition(dish, {});
      if (vista.origen === 'freeform') continue; // bucket excluido (idéntico a la baseline anclada)
      if (vista.verdura.origen === 'desconocida') continue; // bucket excluido (guard obligatorio)

      const causa = causaPorHueco.get(`${slot.day}::${slot.momento}`);
      if (causa === undefined) {
        throw new Error(`veg_variety_engine2_paso5: hueco colocado sin causa en decisionLog, ${slot.day}/${slot.momento} (seed=${seedIndex + 1})`);
      }
      const via = clasificarVia(causa);

      for (const id of vista.verdura.valorEfectivo) {
        headlineObservations.push({ v: id, day: dayIndex });
        identityWeekCounts.set(id, (identityWeekCounts.get(id) || 0) + 1);
        if (!identityViaWeekCounts.has(id)) {
          identityViaWeekCounts.set(id, {
            rotativo: 0, ancla_sobra: 0, capricho: 0,
          });
        }
        identityViaWeekCounts.get(id)[via] += 1;
      }
    }
    dayIndex++;
  }
  return { headlineObservations, identityWeekCounts, identityViaWeekCounts };
}

// ─── Campaña completa ────────────────────────────────────────────────
function runFullCampaign(catalog) {
  const weeksObservations = [];
  const identityAgg = new Map();
  let denominadorRotativo = 0;
  let numPreferencia = 0;
  let numReversion = 0;
  let caprichoCount = 0;

  for (let i = 0; i < N; i++) {
    const seed = i + 1;
    const { slots, decisionLog } = runWeek(seed, catalog);

    verificarExhaustividadPaso5(decisionLog, seed);

    for (const entry of decisionLog) {
      if (entry.plato === undefined) continue;
      if (VIA_ROTATIVO.has(entry.causa)) {
        denominadorRotativo += 1;
        if (entry.evidencia && entry.evidencia.includes('paso 5:')) {
          if (entry.evidencia.includes(PATRON_PREFERENCIA)) numPreferencia += 1;
          else if (entry.evidencia.includes(PATRON_REVERSION)) numReversion += 1;
        }
      } else if (VIA_CAPRICHO.has(entry.causa)) {
        caprichoCount += 1;
      }
    }

    const { headlineObservations, identityWeekCounts, identityViaWeekCounts } = collectWeekData(slots, decisionLog, catalog, i);
    weeksObservations.push(headlineObservations);

    for (const [id, count] of identityWeekCounts.entries()) {
      if (!identityAgg.has(id)) {
        identityAgg.set(id, {
          total: 0, weeksAffected: new Set(), porVia: { rotativo: 0, ancla_sobra: 0, capricho: 0 }, weeklyCounts: new Map(),
        });
      }
      const agg = identityAgg.get(id);
      agg.total += count;
      agg.weeksAffected.add(i);
      agg.weeklyCounts.set(i, count);
    }
    for (const [id, via] of identityViaWeekCounts.entries()) {
      const agg = identityAgg.get(id);
      agg.porVia.rotativo += via.rotativo;
      agg.porVia.ancla_sobra += via.ancla_sobra;
      agg.porVia.capricho += via.capricho;
    }
  }

  if (caprichoCount !== 0) {
    console.warn(`\nAVISO: se esperaba 0 colocaciones vía capricho (pool rol="capricho" vacío en el catálogo real, runWalk.js:41); se observaron ${caprichoCount}.`);
  }

  return {
    headline: runCampaignHeadline(weeksObservations),
    identityAgg,
    denominadorRotativo,
    numPreferencia,
    numReversion,
    caprichoCount,
  };
}

// ─── Serialización ──────────────────────────────────────────────────
function buildIdentityRows(identityAgg) {
  const rows = [...identityAgg.entries()].map(([identidad, agg]) => {
    const { rotativo, ancla_sobra: anclaSobra, capricho } = agg.porVia;
    const sumaVia = rotativo + anclaSobra + capricho;
    const histInt = {
      1: 0, 2: 0, 3: 0, '4+': 0,
    };
    for (const count of agg.weeklyCounts.values()) {
      const bucket = count >= 4 ? '4+' : count;
      histInt[bucket] = (histInt[bucket] || 0) + 1;
    }
    return {
      identidad,
      total: agg.total,
      weeksAffected: agg.weeksAffected.size,
      pctSemanas: pct(agg.weeksAffected.size, N),
      rotativo,
      anclaSobra,
      capricho,
      pctRotativo: pct(rotativo, sumaVia),
      sumaViaCoincide: sumaVia === agg.total,
      histInt,
      media: (agg.total / agg.weeksAffected.size).toFixed(2),
    };
  });
  rows.sort((a, b) => b.total - a.total || a.identidad.localeCompare(b.identidad));
  return rows;
}

function fmtHist(h) {
  return `{1: ${h[1]}, 2: ${h[2]}, 3: ${h[3]}, "4+": ${h['4+']}}`;
}

function fmtRowsIdentidad(rows) {
  return rows.map((r) => `| ${r.identidad} | ${r.total} | ${r.weeksAffected} (${r.pctSemanas}) | ${r.rotativo} | ${r.anclaSobra} | ${r.capricho} | ${r.pctRotativo} | ${r.sumaViaCoincide} | ${r.media} | ${fmtHist(r.histInt)} |`).join('\n');
}

function buildMarkdown({
  headline, identityRows, denominadorRotativo, numPreferencia, numReversion, caprichoCount,
}) {
  const pctPreferencia = pct(numPreferencia, denominadorRotativo);
  const pctReversion = pct(numReversion, denominadorRotativo);
  const pctSinIntervencion = pct(denominadorRotativo - numPreferencia - numReversion, denominadorRotativo);

  return `# Campaña F-M — Descomposición por vía + intervención de paso 5 (D-044, criterio vi)

## 1. Qué mide y por qué

Re-ejecución de la campaña anclada de D-042 (mismas semillas, mismo
PROFILE, mismo catálogo) con el mecanismo de identidad de variedad (paso
5, D-044) activo dentro de \`runWalk\`. Responde al criterio de aceptación
(vi) de D-044 (DECISIONS.md:2122-2126): "menos concentración de identidad
en la ruta rotativa". Añade sobre las métricas globales ya ancladas una
descomposición por vía (rotativo vs. ancla/sobra) que no existía antes de
este artefacto (F-M4-B), y una medición de la frecuencia de intervención
del propio mecanismo.

## 2. Metadatos de la campaña

| Campo | Valor |
|---|---|
| Repositorio | \`app-comida\` |
| HEAD en el momento de la medición | \`${HEAD_SHA}\` |
| N (semanas) | ${N} |
| Semillas | 1..${N} (\`seed = i + 1\`) |
| PROFILE | idéntico, verbatim, a \`veg_variety_engine2.mjs:29-43\` |
| Catálogo | \`scripts/phaseB2/output/dishes.json\`, resuelto vía \`CATALOG_PATH\` (\`loadCatalog.js:17\`) |
| SHA-256 del catálogo | \`${CATALOG_SHA256}\` |

Nota (F-M6): ninguno de los cuatro artefactos anclados registra un hash
del catálogo (hallazgo del R-0, Bloque 2). Este es el primer artefacto de
esta carpeta que lo hace; no hay hash previo con el que compararlo. La
comparabilidad con D-042 se sostiene, en cambio, por el hecho verificado
en el R-0 de que \`dishes.json\` no tiene commits propios entre \`7024bda\`
(código con el que se generó la baseline anclada) y \`${HEAD_SHA}\`.

## 3. Definición de las métricas

**Compartidas (verbatim, F-M3):**
- \`pctMax3\` / histograma \`maxVegDays\` / \`meanDistinct\` / \`vocabSize\`:
  definición de \`baseline-variedad-verdura.md:66-70\`.
- Universo de inclusión: idéntico a la baseline anclada — excluye huecos
  con \`vista.origen === 'freeform'\` y con \`vista.verdura.origen ===
  'desconocida'\`, y excluye días \`fixedRole === 'libre'\`.

**Nuevas (F-M, sin comparativa histórica — nacen en este artefacto):**
- **Vía**: para cada aparición de identidad, se clasifica el hueco que la
  produjo por la causa de su colocación en el decisionLog — rotativo
  (\`seleccion_rotativo_candidato_unico\` / \`seleccion_rotativo_desempate_rng\`,
  \`runWalk.js:375\`/\`:380\`) vs. ancla/sobra (\`ancla_momento_unico\`,
  \`ancla_desempate_rng\`, \`sobra_momento_unico\`,
  \`sobra_hereda_momento_ancla\`, \`colision_momento_restante\` —
  \`expandWeekArc.js:163,171,182,188,137\`) vs. capricho (verificado en 0
  ocurrencias bajo el catálogo real, ver sección 5).
- **Intervención de paso 5**: numerador = casado de prosa sobre
  \`evidencia\` (\`"nivel preferente = "\` para preferencia aplicada,
  \`"particion preferente vacia (INV-1"\` para reversión INV-1 —
  \`frequencies.js:464-465\` y \`:451-452\`); denominador = total de
  entradas \`seleccion_rotativo_*\`. Pool-de-1 y evaluado-sin-efecto son
  indistinguibles por diseño del contrato (sin efecto = sin entrada,
  \`frequencies.js:439-441\` y \`:456-458\`) — la limitación es propiedad
  del contrato de D-044 punto 8, no defecto del instrumento.

## 4. Resultados — headline (comparación con las cuatro anclas, sin recalcular sus cifras)

| Métrica | ENGINE2 D-042 (\`baseline-variedad-verdura.md\`, ${ANCLA_BASELINE.commit}) | LEGACY D-042 (misma fuente) | ESTA CAMPAÑA (paso 5 activo) |
|---|---|---|---|
| % semanas \`maxVegDays>=3\` | ${ANCLA_BASELINE.pctMax3} | ${ANCLA_LEGACY.pctMax3} | **${headline.pctMax3}** |
| Histograma \`maxVegDays\` | \`${JSON.stringify(ANCLA_BASELINE.hist)}\` | \`${JSON.stringify(ANCLA_LEGACY.hist)}\` | \`${JSON.stringify(headline.hist)}\` |
| Identidades distintas/semana (media) | ${ANCLA_BASELINE.meanDistinct} | ${ANCLA_LEGACY.meanDistinct} | **${headline.meanDistinct}** |
| Vocabulario observado | ${ANCLA_BASELINE.vocabSize} | ${ANCLA_LEGACY.vocabSize} | ${headline.vocabSize} |

Diagnóstico V2 de referencia (no recalculado aquí): \`${ANCLA_V2DIAG.ruta}\`
(commit \`${ANCLA_V2DIAG.commit}\`) — el fenómeno de repetición existe
prácticamente íntegro en el eje V, con o sin V2 (D-043).

## 5. Resultados — descomposición por vía e intensidad, por identidad

Columnas: identidad | apariciones totales | semanas afectadas (%) |
apariciones vía rotativo | apariciones vía ancla/sobra | apariciones vía
capricho | % rotativo | suma-vía coincide con total | media/semana
afectada | histograma de intensidad {1,2,3,"4+"}.

| identidad | total | semanas (%) | rotativo | ancla/sobra | capricho | % rotativo | suma OK | media | histograma |
|---|---|---|---|---|---|---|---|---|---|
${fmtRowsIdentidad(identityRows)}

Comparación puntual con Vista C anclada (\`${ANCLA_FREQ_VISTA_C.ruta}\`,
commit \`${ANCLA_FREQ_VISTA_C.commit}\`, sin recalcular) y con intensidad
anclada (\`${ANCLA_INTENSITY.ruta}\`, commit \`${ANCLA_INTENSITY.commit}\`,
sin recalcular), para las tres identidades de mayor volumen en D-042:

| identidad | Vista C D-042 (total / %sem) | Intensidad D-042 (sem.afectadas / media / hist) | Esta campaña (total / %sem / media / hist) |
|---|---|---|---|
| tomate | ${ANCLA_FREQ_VISTA_C.tomate.total} / ${ANCLA_FREQ_VISTA_C.tomate.pctSemanas} | ${ANCLA_INTENSITY.tomate.semanasAfectadas} / ${ANCLA_INTENSITY.tomate.media} / ${fmtHist(ANCLA_INTENSITY.tomate.hist)} | ver fila \`tomate\` arriba |
| zanahoria | ${ANCLA_FREQ_VISTA_C.zanahoria.total} / ${ANCLA_FREQ_VISTA_C.zanahoria.pctSemanas} | ${ANCLA_INTENSITY.zanahoria.semanasAfectadas} / ${ANCLA_INTENSITY.zanahoria.media} / ${fmtHist(ANCLA_INTENSITY.zanahoria.hist)} | ver fila \`zanahoria\` arriba |
| pimientos | ${ANCLA_FREQ_VISTA_C.pimientos.total} / ${ANCLA_FREQ_VISTA_C.pimientos.pctSemanas} | ${ANCLA_INTENSITY.pimientos.semanasAfectadas} / ${ANCLA_INTENSITY.pimientos.media} / ${fmtHist(ANCLA_INTENSITY.pimientos.hist)} | ver fila \`pimientos\` arriba |

**Vía capricho — verificación de supuesto:** ${caprichoCount} colocaciones
observadas (esperado 0, runWalk.js:41). ${caprichoCount === 0 ? 'Supuesto confirmado.' : 'AVISO: el supuesto no se cumplio, ver stdout de la corrida.'}

Esta sección (descomposición por vía) es una **baseline fundacional**, no
un delta contra una vía histórica: durante el R-0 se constató que la
cifra utilizada como referencia conversacional carecía de definición y
artefacto versionados. Se retiró antes de convertirse en insumo de
diseño.

## 6. Resultados — intervención de paso 5

| | conteo | % del denominador |
|---|---|---|
| Denominador (huecos rotativos, causa \`seleccion_rotativo_*\`) | ${denominadorRotativo} | 100% |
| Preferencia aplicada (\`identidad_verdura_preferencia_aplicada\`) | ${numPreferencia} | ${pctPreferencia} |
| Reversión INV-1 (\`identidad_verdura_reversion_nivel_vacio\`) | ${numReversion} | ${pctReversion} |
| Sin intervención registrada (pool-de-1 o evaluado-sin-efecto, indistinguibles) | ${denominadorRotativo - numPreferencia - numReversion} | ${pctSinIntervencion} |

## 7. Gates internos

- **Exhaustividad de paso 5** (obligatorio, corre semana a semana en las
  dos corridas de determinismo): toda entrada con \`"paso 5:"\` en
  \`evidencia\` casó con exactamente uno de los dos patrones de prosa. Sin
  fallos → el runner no habría llegado a escribir este artefacto.
- **Determinismo**: doble corrida completa, comparación estructural del
  artefacto íntegro. Ver resultado impreso en stdout de la corrida
  (\`determinismo: true\` requerido para escribir este fichero).
- **Sin gate de igualdad contra la baseline** (F-M2): las diferencias de
  la sección 4 frente a D-042 son el objeto de medida, no un fallo del
  runner.

## 8. Deuda registrada para el asiento de cierre

Exponer \`causaIdentidad\` (el campo \`causa\` que devuelve
\`chooseIdentityLevel\`, hoy usado internamente en \`runWalk.js:365-367\`
solo para decidir si concatenar \`notaIdentidad\`) como campo estructurado
propio del \`decisionLog\` — en vez de depender del casado de prosa sobre
\`evidencia\` que usa la sección 6 de este artefacto — queda registrado
como mejora de observabilidad futura, condicionada a que estas campañas
se consoliden como parte del proceso habitual de validación. No era
requisito de esta campaña.

## 9. Contrato de reproducción

Mismo contrato de parámetros que \`baseline-variedad-verdura.md\`, sección
5 (mismo HEAD citado arriba, mismas semillas, mismo PROFILE, mismo
catálogo — hash citado en sección 2). Reproducir con:

\`\`\`
node docs/evidence/variedad-verdura/veg_variety_engine2_paso5.mjs
\`\`\`

El runner ejecuta la campaña completa dos veces, corre el gate de
exhaustividad de paso 5 en cada una, y compara el contenido íntegro del
artefacto; una reproducción válida debe imprimir \`determinismo: true\` y
no debe reescribir este archivo con contenido distinto.
`;
}

// ─── Ejecución ──────────────────────────────────────────────────────
const catalog = loadCatalog();

function buildArtifact() {
  const campaign = runFullCampaign(catalog);
  const identityRows = buildIdentityRows(campaign.identityAgg);
  const markdown = buildMarkdown({
    headline: campaign.headline,
    identityRows,
    denominadorRotativo: campaign.denominadorRotativo,
    numPreferencia: campaign.numPreferencia,
    numReversion: campaign.numReversion,
    caprichoCount: campaign.caprichoCount,
  });
  return { markdown, campaign, identityRows };
}

const run1 = buildArtifact();
const run2 = buildArtifact();

const deterministic = run1.markdown === run2.markdown;

console.log('\n=== CAMPAÑA F-M — paso 5, descomposición por vía (N=500) ===');
console.log('\n--- Headline ---');
console.log(JSON.stringify(run1.campaign.headline));
console.log('vs. ENGINE2 D-042:', JSON.stringify({ pctMax3: ANCLA_BASELINE.pctMax3, hist: ANCLA_BASELINE.hist, meanDistinct: ANCLA_BASELINE.meanDistinct, vocabSize: ANCLA_BASELINE.vocabSize }));
console.log('Coincide con la baseline ENGINE2 D-042 (esperado: no necesariamente, F-M2):', {
  pctMax3: run1.campaign.headline.pctMax3 === ANCLA_BASELINE.pctMax3,
  hist: histEquals(run1.campaign.headline.hist, ANCLA_BASELINE.hist),
  meanDistinct: run1.campaign.headline.meanDistinct === ANCLA_BASELINE.meanDistinct,
  vocabSize: run1.campaign.headline.vocabSize === ANCLA_BASELINE.vocabSize,
});

console.log('\n--- Intervención de paso 5 ---');
console.log('denominador (huecos rotativos):', run1.campaign.denominadorRotativo);
console.log('preferencia aplicada:', run1.campaign.numPreferencia, `(${pct(run1.campaign.numPreferencia, run1.campaign.denominadorRotativo)})`);
console.log('reversion INV-1:', run1.campaign.numReversion, `(${pct(run1.campaign.numReversion, run1.campaign.denominadorRotativo)})`);

console.log('\n--- Vía capricho (verificación de supuesto) ---');
console.log('colocaciones vía capricho:', run1.campaign.caprichoCount, '(esperado 0)');

console.log('\n--- Identidades top-5 (por total) ---');
run1.identityRows.slice(0, 5).forEach((r) => console.log(`${r.identidad}: total=${r.total} rotativo=${r.rotativo} ancla/sobra=${r.anclaSobra} capricho=${r.capricho} %rotativo=${r.pctRotativo} sumaOK=${r.sumaViaCoincide}`));

console.log('\n=== DETERMINISMO (doble corrida completa, artefacto íntegro) ===');
console.log('determinismo:', deterministic);

if (!deterministic) {
  console.error('\nERROR: la campaña no es determinista entre corridas completas (artefacto difiere). No se escribe artefacto.');
  process.exit(1);
}

fs.writeFileSync(OUTPUT_PATH, run1.markdown, 'utf8');
console.log('\nArtefacto escrito:', OUTPUT_PATH);
