// Fase 2, Paso B.2, Commit 1 — runner CLI del generador de scaffold.
// Ejecutar con: node scripts/phaseB2/runGenerateScaffold.js
// Escribe scripts/phaseB2/output/dishes.scaffold.json (fuera de
// src/engine2/dishes/, ver restriccion de alcance de B.2). Si el
// generador aborta (divergencia real), NO escribe nada (salida parcial
// prohibida) e imprime el inventario de divergencias con exit code 1.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateScaffold } from './generateScaffold.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'dishes.scaffold.json');

const result = generateScaffold();

if (!result.ok) {
  console.log('=== GENERADOR ABORTADO: divergencia real detectada ===');
  console.log(JSON.stringify(result.divergences, null, 2));
  console.log('\nNO se escribe dishes.scaffold.json (salida parcial prohibida).');
  process.exitCode = 1;
} else {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result.dishes, null, 2) + '\n');
  console.log('=== Scaffold generado ===');
  console.log(JSON.stringify(result.report, null, 2));
  console.log(`\nEscrito: ${OUTPUT_PATH}`);
  const todos = result.dishes.filter((d) =>
    ['nombre', 'rol', 'batchable', 'leftoverQuality', 'shelfLifeDays', 'energiaCocina'].some((f) => d[f] === 'TODO')
  );
  console.log(`Platos con al menos un campo editorial "TODO": ${todos.length} / ${result.dishes.length}`);
}
