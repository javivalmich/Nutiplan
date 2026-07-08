// EDITORIAL-D3 (D-028, eslabón 4) — runner de la ingesta del cuaderno v5.
// Ejecutar con:
//   node scripts/phaseB2/runImportCuadernoV5.js [ruta-al-xlsx]
//
// Hace TODO el I/O (leer el xlsx, leer el lateral existente, escribir el
// lateral + el acta) alrededor de la función pura buildIngestResult()
// (importCuadernoV5.js). Atomicidad: si buildIngestResult lanza, ESTA
// función no llega a la sección de escritura -- ni el lateral ni el acta
// se tocan.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ExcelJS from 'exceljs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildIngestResult } from './importCuadernoV5.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_XLSX_PATH = path.resolve(__dirname, './output/Anotacion_cocinero_v5.xlsx');
const DEFAULT_LATERAL_PATH = path.resolve(__dirname, './output/dishCompositionConfirmations.json');
const DEFAULT_REPORT_PATH = path.resolve(__dirname, './output/ingestaReport.json');

/**
 * Ejecuta la ingesta completa (I/O real). Lanza sin escribir nada si
 * buildIngestResult rechaza el cuaderno (atomicidad).
 * @param {{xlsxPath?: string, lateralPath?: string, reportPath?: string}} [opts]
 * @returns {Promise<{lateral: object, report: object}>}
 */
export async function runImportCuadernoV5(opts = {}) {
  const xlsxPath = opts.xlsxPath ?? DEFAULT_XLSX_PATH;
  const lateralPath = opts.lateralPath ?? DEFAULT_LATERAL_PATH;
  const reportPath = opts.reportPath ?? DEFAULT_REPORT_PATH;

  const xlsxBuffer = fs.readFileSync(xlsxPath);
  const cuadernoSha256 = createHash('sha256').update(xlsxBuffer).digest('hex');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(xlsxBuffer);

  let existingLateral;
  if (fs.existsSync(lateralPath)) {
    existingLateral = JSON.parse(fs.readFileSync(lateralPath, 'utf8'));
    if (existingLateral.version !== 1) {
      throw new Error(`Lateral existente en "${lateralPath}" tiene version="${existingLateral.version}" (se esperaba 1).`);
    }
  }

  const { lateral, report } = buildIngestResult(workbook, { existingLateral, cuadernoSha256 });

  fs.writeFileSync(lateralPath, JSON.stringify(lateral));
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  return { lateral, report };
}

async function main() {
  const xlsxPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_XLSX_PATH;
  const { lateral, report } = await runImportCuadernoV5({ xlsxPath });

  const confirmedCount = Object.keys(lateral.confirmed).length;
  console.log('=== INGESTA CUADERNO V5 (D-028, eslabón 4) ===');
  console.log(`Cuaderno: ${xlsxPath}`);
  console.log(`sha256 dishes.json: ${report.sha256Catalogo}`);
  console.log(`Platos con al menos un campo confirmado: ${confirmedCount}`);
  console.log(
    `Conteos -- gluten: ${report.conteos.gluten}, lactosa: ${report.conteos.lactosa}, verdura: ${report.conteos.verdura}`
  );
  console.log(`Fechas estampadas por la ingesta (fila sin fecha propia): ${report.estampadas.length}`);
  report.estampadas.forEach((e) => console.log(`  - ${e}`));
  console.log(`Lateral escrito en: ${DEFAULT_LATERAL_PATH}`);
  console.log(`Acta escrita en: ${DEFAULT_REPORT_PATH}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error(`\n=== ABORTADO: ${err.message} ===`);
    console.error('NO se ha escrito el lateral ni el acta.');
    process.exitCode = 1;
  });
}
