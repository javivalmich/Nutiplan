// Fase 2, Paso 0, Commit 2: verifica que legacyCombos.data.js es una copia
// fiel de los pools del motor viejo (LUNCH_COMBOS, DINNER_COMBOS,
// TRAINING_DINNERS en src/engine/buildPlan.js), ANTES de filter/map.
//
// Dos controles independientes, con distinto poder de deteccion:
//
//   Control 1 (cobertura observada): todo plato servido en las snapshots
//   congeladas POST-Fase-1 (ver informe Fase 2 / Paso A) debe tener su
//   identityKey dentro de la copia RAW. No detecta combos que existen en
//   buildPlan.js pero que nunca ganaron un smartPick.
//
//   Control 2 (paridad de cardinalidad de ARRAY): compara el numero de
//   entradas literales de cada RAW contra el numero de entradas literales
//   del array correspondiente en buildPlan.js, leido como texto fuente
//   (buildPlan.js no exporta sus pools — no se puede importar, solo leer
//   como texto para contar; Regla 5 (CLAUDE.md): no se modifica el motor
//   vivo). Usa LONGITUD DE ARRAY, no cardinalidad de identityKeys unicas:
//   dos entradas distintas pueden colisionar en la misma identityKey
//   (colision legitima del dataset viejo), lo que haria
//   len(set) < len(array) sin que la copia este incompleta.
//
// Ambos controles incluyen una prueba de discriminacion: se demuestra que
// el control falla cuando se introduce el defecto que se supone detecta.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { comboIdentityKey } from '../identity.js';
import {
  LUNCH_COMBOS_RAW,
  DINNER_COMBOS_RAW,
  TRAINING_DINNERS_RAW,
} from '../legacyCombos.data.js';
import { NORMALIZATIONS } from '../legacyCombos.normalizations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const BUILD_PLAN_PATH = path.join(REPO_ROOT, 'src/engine/buildPlan.js');
const SNAPSHOT_DIR = path.join(REPO_ROOT, 'src/engine/tests/__snapshots__');

// ── Helpers de lectura de snapshots congelados ──────────────────────────

function readSnapshotDayArrays(snapFileName) {
  const text = fs.readFileSync(path.join(SNAPSHOT_DIR, snapFileName), 'utf-8');
  // Cada bloque tiene forma: exports[`KEY`] = `VALUE`;
  // Verificado (informe): ni KEY ni VALUE contienen backticks en estos dos
  // archivos (conteo total de backticks == 4 * nº de exports), asi que el
  // split por backtick es seguro aqui.
  const re = /exports\[`[^`]*`\]\s*=\s*`([^`]*)`;/g;
  const dayArrays = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    const literal = match[1];
    // eslint-disable-next-line no-new-func
    const days = new Function(`return (${literal});`)();
    dayArrays.push(days);
  }
  return dayArrays;
}

function extractServedLegacyMeals(dayArrays) {
  const meals = [];
  for (const days of dayArrays) {
    for (const day of days) {
      for (const meal of day.meals || []) {
        if (meal._spec && meal._spec.tmpl) meals.push(meal);
      }
    }
  }
  return meals;
}

function buildRawIdentitySet() {
  const keys = new Set();
  for (const combo of [...LUNCH_COMBOS_RAW, ...DINNER_COMBOS_RAW, ...TRAINING_DINNERS_RAW]) {
    keys.add(comboIdentityKey(combo));
  }
  return keys;
}

// ── Helper de lectura de cardinalidad real en buildPlan.js (como texto) ──

function countLiteralEntries(sourceText, startMarker, endMarker) {
  const startIdx = sourceText.indexOf(startMarker);
  const endIdx = sourceText.indexOf(endMarker, startIdx);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Marcador no encontrado: "${startMarker}" o "${endMarker}"`);
  }
  const segment = sourceText.slice(startIdx, endIdx);
  return (segment.match(/\{tmpl:/g) || []).length;
}

describe('Control 1 — cobertura observada: todo plato servido en snapshots POST-Fase-1 tiene identityKey en la copia RAW', () => {
  const rawIdentitySet = buildRawIdentitySet();

  const baselineDays = readSnapshotDayArrays('buildPlan.baseline.test.js.snap');
  const goldenDays = readSnapshotDayArrays('buildPlan.snapshot.test.js.snap');
  const servedMeals = [
    ...extractServedLegacyMeals(baselineDays),
    ...extractServedLegacyMeals(goldenDays),
  ];

  it('hay al menos un plato legacy servido en las snapshots (control no vacio)', () => {
    expect(servedMeals.length).toBeGreaterThan(0);
  });

  it('TODOS los platos legacy servidos en las snapshots tienen su identityKey en LUNCH_RAW ∪ DINNER_RAW ∪ TRAINING_RAW', () => {
    const orphans = [];
    for (const meal of servedMeals) {
      const key = comboIdentityKey(meal._spec);
      if (!rawIdentitySet.has(key)) {
        orphans.push({ identityKey: key, _spec: meal._spec, title: meal.title });
      }
    }
    if (orphans.length > 0) {
      throw new Error(
        `ERROR DE COPIA: ${orphans.length} identityKey(s) servidos ausentes de la copia RAW:\n` +
        orphans.map((o) => `  identityKey=${o.identityKey} title="${o.title}" _spec=${JSON.stringify(o._spec)}`).join('\n')
      );
    }
    expect(orphans).toEqual([]);
  });

  it('PRUEBA DE DISCRIMINACION: el control de cobertura SI detecta un identityKey ausente', () => {
    // Construye un set RAW deliberadamente incompleto (sin el primer plato
    // legacy servido observado) y comprueba que el control lo detecta.
    const firstMeal = servedMeals[0];
    const incompleteSet = new Set(rawIdentitySet);
    incompleteSet.delete(comboIdentityKey(firstMeal._spec));

    const orphansContraIncompleto = servedMeals.filter(
      (m) => !incompleteSet.has(comboIdentityKey(m._spec))
    );
    expect(orphansContraIncompleto.length).toBeGreaterThan(0);

    // Confirma que, contra el set RAW real (completo), ese mismo plato SI esta.
    expect(rawIdentitySet.has(comboIdentityKey(firstMeal._spec))).toBe(true);
  });
});

describe('Control 2 — paridad de cardinalidad de ARRAY (RAW vs buildPlan.js, ajustada por normalizaciones documentadas)', () => {
  const buildPlanSource = fs.readFileSync(BUILD_PLAN_PATH, 'utf-8');

  const lunchCountInSource = countLiteralEntries(
    buildPlanSource,
    'const LUNCH_COMBOS = [',
    '\n  ].filter(function(m){'
  );
  const dinnerCountInSource = countLiteralEntries(
    buildPlanSource,
    'const DINNER_COMBOS = [',
    '\n  ].filter(function(m){'
  );
  const trainingCountInSource = countLiteralEntries(
    buildPlanSource,
    'const TRAINING_DINNERS = [',
    '\n  ];'
  );

  function entradasEliminadasPorNormalizacion(origen) {
    return NORMALIZATIONS
      .filter((n) => n.origen === origen)
      .reduce((sum, n) => sum + n.entradasEliminadas, 0);
  }

  it('LUNCH_COMBOS_RAW.length === nº de entradas literales de LUNCH_COMBOS en buildPlan.js (sin normalizaciones en este origen)', () => {
    expect(entradasEliminadasPorNormalizacion('LUNCH_COMBOS_RAW')).toBe(0);
    expect(LUNCH_COMBOS_RAW.length).toBe(lunchCountInSource);
  });

  it('DINNER_COMBOS_RAW.length === nº de entradas literales en buildPlan.js MENOS las eliminadas por normalizacion documentada', () => {
    const eliminadas = entradasEliminadasPorNormalizacion('DINNER_COMBOS_RAW');
    expect(eliminadas).toBe(1); // NORMALIZACION #1 (cerdo+brocoli+mostaza_miel+plancha)
    expect(DINNER_COMBOS_RAW.length).toBe(dinnerCountInSource - eliminadas);
  });

  it('TRAINING_DINNERS_RAW.length === nº de entradas literales de TRAINING_DINNERS en buildPlan.js (sin normalizaciones en este origen)', () => {
    expect(entradasEliminadasPorNormalizacion('TRAINING_DINNERS_RAW')).toBe(0);
    expect(TRAINING_DINNERS_RAW.length).toBe(trainingCountInSource);
  });

  it('PRUEBA DE DISCRIMINACION: el control de cardinalidad SI detecta una entrada de mas o de menos', () => {
    // Simula una copia con una entrada de menos (sin tocar el archivo real).
    const fakeRawConUnaDeMenos = LUNCH_COMBOS_RAW.slice(0, -1);
    expect(fakeRawConUnaDeMenos.length).not.toBe(lunchCountInSource);

    // Simula una copia con una entrada de mas (duplicando la primera).
    const fakeRawConUnaDeMas = [...LUNCH_COMBOS_RAW, LUNCH_COMBOS_RAW[0]];
    expect(fakeRawConUnaDeMas.length).not.toBe(lunchCountInSource);

    // Confirma que, sin la mutacion, la cardinalidad real SI coincide.
    expect(LUNCH_COMBOS_RAW.length).toBe(lunchCountInSource);
  });

  it('cada normalizacion documentada declara nEliminadas consistente con la reduccion real observada (LUNCH/DINNER/TRAINING)', () => {
    for (const origenNombre of ['LUNCH_COMBOS_RAW', 'DINNER_COMBOS_RAW', 'TRAINING_DINNERS_RAW']) {
      const sourceCount = { LUNCH_COMBOS_RAW: lunchCountInSource, DINNER_COMBOS_RAW: dinnerCountInSource, TRAINING_DINNERS_RAW: trainingCountInSource }[origenNombre];
      const rawArray = { LUNCH_COMBOS_RAW, DINNER_COMBOS_RAW, TRAINING_DINNERS_RAW }[origenNombre];
      expect(rawArray.length).toBe(sourceCount - entradasEliminadasPorNormalizacion(origenNombre));
    }
  });
});

describe('Dato informativo para Paso B: colisiones de identityKey por pool (no detiene el test)', () => {
  function reportCollisions(pool, poolName) {
    const counts = new Map();
    for (const combo of pool) {
      const key = comboIdentityKey(combo);
      if (!counts.has(key)) counts.set(key, []);
      counts.get(key).push(combo);
    }
    const collisions = [...counts.entries()].filter(([, instances]) => instances.length > 1);
    const totalEntries = pool.length;
    const uniqueKeys = counts.size;
    return { poolName, totalEntries, uniqueKeys, collisions };
  }

  it('reporta colisiones internas (informativo)', () => {
    const reports = [
      reportCollisions(LUNCH_COMBOS_RAW, 'LUNCH_COMBOS_RAW'),
      reportCollisions(DINNER_COMBOS_RAW, 'DINNER_COMBOS_RAW'),
      reportCollisions(TRAINING_DINNERS_RAW, 'TRAINING_DINNERS_RAW'),
    ];
    for (const r of reports) {
      // eslint-disable-next-line no-console
      console.log(
        `[colisiones ${r.poolName}] entradas=${r.totalEntries} unicas=${r.uniqueKeys} ` +
        `colisiones=${r.totalEntries - r.uniqueKeys}`
      );
      for (const [key, instances] of r.collisions) {
        // eslint-disable-next-line no-console
        console.log(`  ${key} x${instances.length}: ${instances.map((i) => JSON.stringify(i)).join(' | ')}`);
      }
    }
    // No assertions de fallo: es informativo, no un criterio de PARATE.
    expect(reports.length).toBe(3);
  });
});
