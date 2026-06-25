// Fase 2, Paso B.2, Commit 4 — runner CLI del anotador. Ejecutar con:
//   node scripts/phaseB2/runAnnotate.js
// Anota INTERACTIVAMENTE scripts/phaseB2/output/dishes.scaffold.json,
// campo a campo, solo los platos con algun "TODO" pendiente.
//
// NO se ejecuta en esta sesion (Fase 2 / Paso B.2): la anotacion real de
// los 178 platos es trabajo de Javi, despues de este paso. Este archivo
// existe y queda listo para que el lo corra cuando quiera; annotate.js
// (la logica) ya esta probado contra un fixture en
// src/engine2/dishes/tests/annotate.test.js.

import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { annotateScaffold } from './annotate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCAFFOLD_PATH = path.join(__dirname, 'output', 'dishes.scaffold.json');

const rl = readline.createInterface({ input, output });
const ask = (prompt) => rl.question(prompt);

annotateScaffold(SCAFFOLD_PATH, ask, { log: console.log })
  .then(({ restantes }) => {
    console.log(`\nPasada terminada. Quedan ${restantes.length} campo(s) "TODO".`);
    rl.close();
  })
  .catch((err) => {
    console.error(err);
    rl.close();
    process.exitCode = 1;
  });
