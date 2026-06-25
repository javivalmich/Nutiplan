// Fase 2, Paso B.2, Commit 3 — runner CLI del promotor. Ejecutar con:
//   node scripts/phaseB2/runPromote.js
// Lee scripts/phaseB2/output/dishes.scaffold.json. Si queda algun "TODO",
// aborta e imprime la lista (sin escribir dishes.json). Si NO queda
// ningun TODO, valida cada dish y escribe scripts/phaseB2/output/
// dishes.json.
//
// NO se ejecuta sobre el scaffold real en la sesion de Fase 2 / Paso B.2
// (el scaffold real esta sucio por diseno hasta que Javi anote) — existe
// y esta probado contra fixtures (ver tests), pero correrlo ahora
// simplemente abortaria, que es el comportamiento correcto y esperado.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promote } from './promote.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCAFFOLD_PATH = path.join(__dirname, 'output', 'dishes.scaffold.json');
const DISHES_PATH = path.join(__dirname, 'output', 'dishes.json');

const scaffold = JSON.parse(fs.readFileSync(SCAFFOLD_PATH, 'utf-8'));
const result = promote(scaffold);

if (!result.ok) {
  console.log(`=== PROMOTE ABORTADO: ${result.pendientes.length} campo(s) "TODO" pendientes ===`);
  console.log(JSON.stringify(result.pendientes.slice(0, 20), null, 2));
  if (result.pendientes.length > 20) console.log(`... y ${result.pendientes.length - 20} mas.`);
  console.log('\nNO se escribe dishes.json (salida parcial prohibida).');
  process.exitCode = 1;
} else {
  fs.writeFileSync(DISHES_PATH, JSON.stringify(result.dishes, null, 2) + '\n');
  console.log(`=== PROMOTE OK: ${result.dishes.length} platos escritos en ${DISHES_PATH} ===`);
}
