// Fase 2, Paso B.2 — runner CLI del importador xlsx. Ejecutar con:
//   node scripts/phaseB2/runImportAnotacion.js
//
// Lee scripts/phaseB2/input/Anotacion_cocinero_242_v4.xlsx + scripts/phaseB2/
// output/dishes.scaffold.json. Escribe de vuelta dishes.scaffold.json (176
// de 178 dishes con sus campos editoriales resueltos; los 2 con
// reviewPlateType pendiente quedan intactos, en "TODO"). Si el subconjunto
// promovible (176) pasa promote.js sin modificar su logica, escribe
// scripts/phaseB2/output/dishes.json.
//
// STOP (sin escribir nada) si: el numero de exclusiones != 2, el matching
// posicional/tripwire de nombre falla, o promote.js no acepta el
// subconjunto.

import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';
import { readPlatosRows, buildImportResult } from './importAnotacion.js';
import { promote } from './promote.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.join(__dirname, 'input', 'Anotacion_cocinero_242_v4.xlsx');
const SCAFFOLD_PATH = path.join(__dirname, 'output', 'dishes.scaffold.json');
const DISHES_PATH = path.join(__dirname, 'output', 'dishes.json');

// Casos A (atun/arroz/crudo, Nº38) y B (huevo/calabaza/zanahoria) resueltos:
// RESOLVED_CORRECTIONS en legacyCombos.plateTypeCorrections.js. 0 reviewPlateType
// pendientes -- los 178 scaffold dishes son promovibles.
const EXPECTED_EXCLUDED = 0;

async function main() {
  const scaffoldDishes = JSON.parse(fs.readFileSync(SCAFFOLD_PATH, 'utf-8'));

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);
  const xlsxRows = readPlatosRows(wb);

  const { scaffoldUpdated, promotable, excluded, shelfLifeConversions } = buildImportResult(xlsxRows, scaffoldDishes);

  console.log(`=== IMPORT ANOTACION ===`);
  console.log(`Filas scaffold en xlsx: ${xlsxRows.filter((r) => r.fuente === 'scaffold').length}`);
  console.log(`Excluidas (reviewPlateType pendiente): ${excluded.length}`);
  excluded.forEach((e) => console.log(`  - Nº${e.n} id=${e.id} nombre="${e.nombre}"`));
  console.log(`Promovibles: ${promotable.length}`);
  console.log('Conversion shelfLifeDays (rango->minimo):');
  shelfLifeConversions.forEach((c) => console.log(`  "${c.raw}" -> ${c.parsed} (${c.count} filas)`));

  if (excluded.length !== EXPECTED_EXCLUDED) {
    console.log(`\n=== ABORTADO: se esperaban ${EXPECTED_EXCLUDED} exclusiones (reviewPlateType), se encontraron ${excluded.length} ===`);
    console.log('NO se escribe dishes.scaffold.json ni dishes.json.');
    process.exitCode = 1;
    return;
  }

  const result = promote(promotable);
  if (!result.ok) {
    console.log(`\n=== ABORTADO: promote.js reporta ${result.pendientes.length} campo(s) "TODO" pendientes en el subconjunto promovible ===`);
    console.log(JSON.stringify(result.pendientes.slice(0, 20), null, 2));
    console.log('NO se escribe dishes.scaffold.json ni dishes.json.');
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(SCAFFOLD_PATH, JSON.stringify(scaffoldUpdated, null, 2) + '\n');
  fs.writeFileSync(DISHES_PATH, JSON.stringify(result.dishes, null, 2) + '\n');
  console.log(`\n=== IMPORT OK: ${result.dishes.length} platos escritos en ${DISHES_PATH} ===`);
  console.log(`dishes.scaffold.json actualizado (${scaffoldUpdated.length} entradas, ${excluded.length} siguen con TODO pendiente).`);
}

main().catch((err) => {
  console.error(`\n=== ABORTADO: ${err.message} ===`);
  console.error('NO se escribe dishes.scaffold.json ni dishes.json.');
  process.exitCode = 1;
});
