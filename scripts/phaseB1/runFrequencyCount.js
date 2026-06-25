// Fase 2, Paso B.1, Parte 2 — runner CLI del conteo de frecuencia. Ejecutar con:
//   node scripts/phaseB1/runFrequencyCount.js
// Imprime el descubrimiento de snapshots, el top-30 y la cobertura del
// universo. No escribe ningun archivo de salida.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { comboIdentityKey } from '../../src/engine2/dishes/identity.js';
import { loadUniverse } from './loadUniverse.js';
import {
  discoverMealSnapshots,
  extractLegacyMeals,
  countFreeformOccurrencesRaw,
  buildFrequencyRanking,
} from './frequencyCount.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, '../../src');

const { relevant, skipped, parseErrors } = discoverMealSnapshots(SRC_ROOT);

console.log('=== Snapshots descubiertas (relevantes para combos legacy) ===');
for (const r of relevant) console.log(`${r.path} -> ${r.scenarios.length} escenario(s)`);
console.log('\n=== Snapshots descartadas ===');
for (const s of skipped) console.log(`${s.path} -- ${s.reason}`);
if (parseErrors.length > 0) {
  console.log('\n=== ERRORES DE PARSEO (bloqueo) ===');
  for (const p of parseErrors) console.log(`${p.path} -- ${p.error}`);
}

console.log('\n=== Verificacion FREEFORM (textual, sobre todos los .snap) ===');
for (const f of countFreeformOccurrencesRaw(SRC_ROOT)) console.log(`${f.path}: ${f.occurrences}`);

const legacyMeals = extractLegacyMeals(relevant);
const ranking = buildFrequencyRanking(legacyMeals, comboIdentityKey);

console.log(`\n=== Conservacion ===\nmeals con _spec.tmpl: ${legacyMeals.length} | suma ranking: ${ranking.reduce((s, r) => s + r.count, 0)}`);

console.log('\n=== Top-30 ===');
ranking.slice(0, 30).forEach((r, i) => console.log(`${i + 1}. ${r.identityKey} -> ${r.count}`));

const universe = loadUniverse();
const universeKeys = new Set([
  ...universe.LUNCH_COMBOS_RAW.map(comboIdentityKey),
  ...universe.DINNER_COMBOS_RAW.map(comboIdentityKey),
  ...universe.TRAINING_DINNERS_RAW.map(comboIdentityKey),
]);
const servedKeys = new Set(ranking.map((r) => r.identityKey));
const noServidos = [...universeKeys].filter((k) => !servedKeys.has(k));

console.log(`\n=== Cobertura del universo ===\nplatos distintos servidos >=1 vez: ${servedKeys.size}\nplatos del universo con frecuencia 0: ${noServidos.length}`);
