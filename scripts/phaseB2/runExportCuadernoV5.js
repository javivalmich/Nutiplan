// EDITORIAL-D2 (D-028) — runner del generador reproducible del cuaderno
// v5. Ejecuta la verificación de hash de dishes.json, construye las filas,
// escribe el cuaderno único en output/ y el almacén lateral vacío-versionado
// (si no existe ya -- no pisa confirmaciones reales de una ingesta futura).
//
// DEUDA REGISTRADA: la cadena legacy (exportCocinero.js + importAnotacion.js
// + runImportAnotacion.js + el v4.xlsx) muere en el PR de ingesta, eslabón
// 4 de D-028. Este runner es un flujo aparte que no la toca.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  verifyCatalogHash,
  buildPlatosRows,
  buildWorkbook,
  countActiveCells,
  hashRows,
  buildEmptyConfirmationsLateral,
  EXPECTED_TOTAL_ROWS,
  EXPECTED_ACTIVE_COUNTS,
} from './exportCuadernoV5.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_XLSX = path.resolve(__dirname, './output/Anotacion_cocinero_v5.xlsx');
const OUTPUT_LATERAL = path.resolve(__dirname, './output/dishCompositionConfirmations.json');

function ensureConfirmationsLateral(destPath) {
  if (fs.existsSync(destPath)) {
    return { created: false };
  }
  fs.writeFileSync(destPath, JSON.stringify(buildEmptyConfirmationsLateral()));
  return { created: true };
}

async function main() {
  const catalogHash = verifyCatalogHash();

  const rows = buildPlatosRows();
  const counts = countActiveCells(rows);
  const dumpHash = hashRows(rows);

  const wb = await buildWorkbook(rows);
  await wb.xlsx.writeFile(OUTPUT_XLSX);

  const lateral = ensureConfirmationsLateral(OUTPUT_LATERAL);

  console.log(`dishes.json sha256: ${catalogHash}`);
  console.log(`Total filas: ${rows.length} (esperado ${EXPECTED_TOTAL_ROWS})`);
  console.log(
    `Celdas activas -- gluten: ${counts.gluten} (esperado ${EXPECTED_ACTIVE_COUNTS.gluten}), ` +
    `lactosa: ${counts.lactosa} (esperado ${EXPECTED_ACTIVE_COUNTS.lactosa}), ` +
    `verdura: ${counts.verdura} (esperado ${EXPECTED_ACTIVE_COUNTS.verdura})`
  );
  console.log(`sha256 del dump de filas (vía B, reproducibilidad de contenido): ${dumpHash}`);
  console.log(`Cuaderno escrito en: ${OUTPUT_XLSX}`);
  console.log(
    lateral.created
      ? `Almacén lateral creado vacío-versionado en: ${OUTPUT_LATERAL}`
      : `Almacén lateral ya existía, no se ha tocado: ${OUTPUT_LATERAL}`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
