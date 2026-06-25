// Fase 2, Paso B.1 — runner CLI del gate de colision. Ejecutar con:
//   node scripts/phaseB1/runGate.js
// Imprime el inventario completo de divergencias si el gate aborta, o el
// reporte agregado por origen si pasa. No escribe ningun archivo de salida.

import { runCollisionGate } from './collisionGate.js';
import { loadUniverse } from './loadUniverse.js';

const universe = loadUniverse();
const result = runCollisionGate(universe);

console.log('=== Gate de colision — reporte agregado por origen ===');
console.log(JSON.stringify(result.perOrigin, null, 2));

if (result.aborted) {
  console.log('\n=== GATE ABORTADO — inventario completo de divergencias ===');
  for (const d of result.divergences) {
    console.log(`\norigen=${d.origen} identityKey=${d.identityKey} nMiembros=${d.nMiembros}`);
    console.log('diff:', JSON.stringify(d.diff, null, 2));
    if (d.motivo) console.log('motivo:', d.motivo);
  }
  console.log(`\nTotal divergencias: ${result.divergences.length}`);
  console.log('Parte 2 (conteo de frecuencia) NO se ejecuta: el gate abortó.');
  process.exitCode = 1;
} else {
  console.log('\nGate OK: solo grupos colapsables. Continuar a Parte 2.');
}
