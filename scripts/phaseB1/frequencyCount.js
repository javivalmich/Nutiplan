// Fase 2, Paso B.1, Parte 2 — descubrimiento de snapshots y conteo de
// frecuencia de platos legacy servidos. Vive en scripts/ (fuera de
// engine2/), importa solo de src/engine2/dishes/identity.js para la
// reconstruccion de identidad (no replica logica manual).
//
// Descubrimiento SIN listas hardcodeadas: escanea recursivamente
// cualquier directorio "__snapshots__" bajo src/, lee cada *.snap, y
// considera "relevante" (consumible por el conteo) cualquier archivo cuyo
// contenido incluya al menos un meal con _spec.tmpl. Esto evita asumir
// nombres de archivo o una cantidad esperada de escenarios.

import fs from 'node:fs';
import path from 'node:path';

/**
 * Escanea recursivamente un directorio buscando subdirectorios
 * "__snapshots__" y devuelve la lista de archivos *.snap encontrados.
 * @param {string} rootDir
 * @returns {string[]} rutas absolutas de archivos .snap
 */
export function findSnapshotFiles(rootDir) {
  const found = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__snapshots__') {
          for (const f of fs.readdirSync(fullPath)) {
            if (f.endsWith('.snap')) found.push(path.join(fullPath, f));
          }
        } else {
          walk(fullPath);
        }
      }
    }
  }
  walk(rootDir);
  return found.sort();
}

/**
 * Parsea un archivo .snap (formato vitest: `exports[`KEY`] = `VALUE`;`)
 * y devuelve los valores evaluados de cada bloque exports[].
 * Asume (verificar antes de usar sobre un archivo nuevo) que ni KEY ni
 * VALUE contienen backticks sin escapar.
 * @param {string} snapFilePath
 * @returns {{key: string, value: any}[]}
 */
export function parseSnapshotFile(snapFilePath) {
  const text = fs.readFileSync(snapFilePath, 'utf-8');
  const re = /exports\[`([^`]*)`\]\s*=\s*`([^`]*)`;/g;
  const blocks = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    const [, key, literal] = match;
    // eslint-disable-next-line no-new-func
    const value = new Function(`return (${literal});`)();
    blocks.push({ key, value });
  }
  return blocks;
}

/**
 * Descubre, bajo rootDir, todos los .snap cuyo contenido tiene al menos
 * un meal con _spec.tmpl (snapshots "relevantes" para el conteo de
 * combos legacy). No asume nombres de archivo ni cantidad de escenarios.
 *
 * Pre-filtro textual antes de evaluar: solo se intenta el parseo (new
 * Function, costoso y fragil ante contenido malformado) sobre archivos
 * cuyo texto crudo contiene la subcadena "_spec". Si un archivo SIN esa
 * subcadena fallara al evaluarse no importaria (se descarta igual); si
 * un archivo CON esa subcadena fallara al evaluarse, se considera un
 * bloqueo real (parseError) en vez de descartarlo en silencio.
 * @param {string} rootDir
 * @returns {{ relevant: { path: string, scenarios: {key: string, days: any[]}[] }[], skipped: { path: string, reason: string }[], parseErrors: { path: string, error: string }[] }}
 */
export function discoverMealSnapshots(rootDir) {
  const files = findSnapshotFiles(rootDir);
  const relevant = [];
  const skipped = [];
  const parseErrors = [];

  for (const file of files) {
    const rawText = fs.readFileSync(file, 'utf-8');
    if (!rawText.includes('_spec')) {
      skipped.push({ path: file, reason: 'no contiene la subcadena "_spec" (irrelevante para combos legacy)' });
      continue;
    }
    try {
      const blocks = parseSnapshotFile(file);
      const scenarios = blocks
        .map((b) => ({ key: b.key, days: b.value }))
        .filter((s) => hasAnyLegacyMeal(s.days));
      if (scenarios.length > 0) {
        relevant.push({ path: file, scenarios });
      } else {
        skipped.push({ path: file, reason: 'contiene "_spec" pero ningun meal con _spec.tmpl tras parsear' });
      }
    } catch (err) {
      parseErrors.push({ path: file, error: err.message });
    }
  }

  return { relevant, skipped, parseErrors };
}

function hasAnyLegacyMeal(days) {
  if (!Array.isArray(days)) return false;
  for (const day of days) {
    for (const meal of day.meals || []) {
      if (meal._spec && meal._spec.tmpl) return true;
    }
  }
  return false;
}

/**
 * Extrae todos los meals con _spec.tmpl (combos legacy) de un conjunto de
 * snapshots descubiertas, en el orden en que aparecen.
 * @param {{ scenarios: {days: any[]}[] }[]} discoveredSnapshots
 * @returns {object[]} meals
 */
export function extractLegacyMeals(discoveredSnapshots) {
  const meals = [];
  for (const snap of discoveredSnapshots) {
    for (const scenario of snap.scenarios) {
      for (const day of scenario.days) {
        for (const meal of day.meals || []) {
          if (meal._spec && meal._spec.tmpl) meals.push(meal);
        }
      }
    }
  }
  return meals;
}

/**
 * Extrae todos los meals (cualquiera, sin filtrar) de un conjunto de
 * snapshots — para la verificacion redundante de FREEFORM.
 * @param {{ scenarios: {days: any[]}[] }[]} discoveredSnapshots
 * @returns {object[]} meals
 */
export function extractAllMeals(discoveredSnapshots) {
  const meals = [];
  for (const snap of discoveredSnapshots) {
    for (const scenario of snap.scenarios) {
      for (const day of scenario.days) {
        for (const meal of day.meals || []) meals.push(meal);
      }
    }
  }
  return meals;
}

/**
 * Verificacion redundante de FREEFORM: cuenta ocurrencias textuales de la
 * subcadena "freeForm" en TODOS los .snap descubiertos (no solo los
 * relevantes para combos legacy) — robusto a archivos con contenido
 * malformado que no se puede evaluar con new Function (ver
 * parseErrors de discoverMealSnapshots).
 * @param {string} rootDir
 * @returns {{ path: string, occurrences: number }[]}
 */
export function countFreeformOccurrencesRaw(rootDir) {
  const files = findSnapshotFiles(rootDir);
  return files.map((file) => {
    const text = fs.readFileSync(file, 'utf-8');
    const matches = text.match(/freeForm/g);
    return { path: file, occurrences: matches ? matches.length : 0 };
  });
}

/**
 * Construye el ranking de frecuencia: identityKey -> nº apariciones,
 * orden descendente por frecuencia, desempate ESTRICTAMENTE lexicografico
 * por identityKey serializado (no por orden de insercion).
 * @param {object[]} legacyMeals
 * @param {(combo: object) => string} comboIdentityKey
 * @returns {{ identityKey: string, count: number }[]}
 */
export function buildFrequencyRanking(legacyMeals, comboIdentityKey) {
  const counts = new Map();
  for (const meal of legacyMeals) {
    const key = comboIdentityKey(meal._spec);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([identityKey, count]) => ({ identityKey, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.identityKey < b.identityKey ? -1 : a.identityKey > b.identityKey ? 1 : 0;
    });
}
