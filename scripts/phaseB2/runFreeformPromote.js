// Fase 2, Paso C — runner CLI del promotor freeform. Ejecutar con:
//   node scripts/phaseB2/runFreeformPromote.js
//
// Lee scripts/phaseB2/input/Anotacion_cocinero_242_v4.xlsx (fuente=freeform)
// + src/data/FREEFORM_COMBOS.js (64) + scripts/phaseB2/output/dishes.json
// (178, scaffold ya promovido). Escribe dishes.json fusionado (178 + 63 =
// 241). STOP (sin escribir nada) si: el numero de promovibles != 63, el
// join falla, algun dish no valida, o el id de un freeform colisiona con
// un id ya presente en dishes.json.

import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';
import { readPlatosRows } from './importAnotacion.js';
import { buildFreeformDishes } from './freeformPromote.js';
import { FREEFORM_COMBOS } from '../../src/data/FREEFORM_COMBOS.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.join(__dirname, 'input', 'Anotacion_cocinero_242_v4.xlsx');
const DISHES_PATH = path.join(__dirname, 'output', 'dishes.json');

const EXPECTED_FREEFORM_TOTAL = 64;
const EXPECTED_EXCLUDED = 1;
const EXPECTED_PROMOTABLE = 63;

async function main() {
  const existingDishes = JSON.parse(fs.readFileSync(DISHES_PATH, 'utf-8'));

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);
  const xlsxRows = readPlatosRows(wb);

  const { dishes: freeformDishes, excluded, joinReport } = buildFreeformDishes(FREEFORM_COMBOS, xlsxRows);

  console.log('=== PROMOCION FREEFORM (Paso C) ===');
  console.log(`Combos freeform totales: ${joinReport.totalFreeform}`);
  console.log(`Excluidos: ${excluded.length}`);
  excluded.forEach((e) => console.log(`  - ${e.id}: ${e.causa}`));
  console.log(`Promovibles: ${joinReport.totalPromotable}`);

  if (joinReport.totalFreeform !== EXPECTED_FREEFORM_TOTAL) {
    console.log(`\n=== ABORTADO: se esperaban ${EXPECTED_FREEFORM_TOTAL} combos freeform, se encontraron ${joinReport.totalFreeform} ===`);
    process.exitCode = 1;
    return;
  }
  if (excluded.length !== EXPECTED_EXCLUDED) {
    console.log(`\n=== ABORTADO: se esperaban ${EXPECTED_EXCLUDED} exclusiones, se encontraron ${excluded.length} ===`);
    process.exitCode = 1;
    return;
  }
  if (joinReport.totalPromotable !== EXPECTED_PROMOTABLE) {
    console.log(`\n=== ABORTADO: se esperaban ${EXPECTED_PROMOTABLE} promovibles, se encontraron ${joinReport.totalPromotable} ===`);
    process.exitCode = 1;
    return;
  }

  const existingIds = new Set(existingDishes.map((d) => d.id));
  const colisiones = freeformDishes.filter((d) => existingIds.has(d.id));
  if (colisiones.length > 0) {
    console.log(`\n=== ABORTADO: ${colisiones.length} id(s) freeform colisionan con dishes.json existente ===`);
    console.log(JSON.stringify(colisiones.map((d) => d.id)));
    process.exitCode = 1;
    return;
  }

  const merged = [...existingDishes, ...freeformDishes];
  const expectedTotal = existingDishes.length + freeformDishes.length;

  fs.writeFileSync(DISHES_PATH, JSON.stringify(merged, null, 2) + '\n');
  console.log(`\n=== PROMOCION OK: ${existingDishes.length} + ${freeformDishes.length} = ${merged.length} platos escritos en ${DISHES_PATH} ===`);
  if (merged.length !== expectedTotal) {
    throw new Error('Conteo final inconsistente (esto no deberia poder pasar).');
  }
}

main().catch((err) => {
  console.error(`\n=== ABORTADO: ${err.message} ===`);
  console.error('NO se escribe dishes.json.');
  process.exitCode = 1;
});
