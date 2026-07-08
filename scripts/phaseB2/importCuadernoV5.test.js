// importCuadernoV5.test.js — EDITORIAL-D3 (D-028, eslabón 4). Falsables
// obligatorios de la ingesta: contrato estructural, hash portado vs
// catálogo actual, mapeo posicional + integridad, custodia, fecha/
// estampado, vocabulario cerrado de verdura, tipos, atomicidad estricta
// (aserto de filesystem), C10 (independencia del orden físico),
// single-write, acta de ingesta, y no-regresión de alcance sobre la
// lista NO-TOCAR completa.
//
// Cuadernos sintéticos = salida real del generador enmendado
// (buildPlatosRows()/buildWorkbook() de exportCuadernoV5.js) +
// mutaciones controladas sobre celdas concretas (mismo idioma que
// exportCuadernoV5.test.js). Cada describe incluye un control positivo +
// un control "dirty" que demuestra que el test discrimina de verdad.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ExcelJS from 'exceljs';
import {
  buildIngestResult,
  assertStructuralContract,
  StructuralContractError,
  CatalogMismatchError,
  IntegrityError,
  CustodyError,
  CompositionTypeError,
  VerduraVocabularyError,
  SingleWriteError,
} from './importCuadernoV5.js';
import { runImportCuadernoV5 } from './runImportCuadernoV5.js';
import { buildPlatosRows, buildWorkbook } from './exportCuadernoV5.js';
import { loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');

async function buildRealWorkbook(rowsOverride) {
  const rows = rowsOverride ?? buildPlatosRows();
  const wb = await buildWorkbook(rows);
  return { rows, wb, wsPlatos: wb.getWorksheet('Platos') };
}

function findRowByN(ws, n) {
  let found;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (row.getCell('n').value === n) found = row;
  });
  if (!found) throw new Error(`findRowByN: no se encontró Nº=${n}`);
  return found;
}

function makeTmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('contrato estructural: hoja ausente / renombrada / columnas reordenadas', () => {
  it('un workbook real generado pasa el contrato (control positivo)', async () => {
    const { wb } = await buildRealWorkbook();
    expect(() => assertStructuralContract(wb)).not.toThrow();
  });

  it('hoja "Platos" ausente -> StructuralContractError', async () => {
    const { wb, wsPlatos } = await buildRealWorkbook();
    wb.removeWorksheet(wsPlatos.id);
    expect(() => assertStructuralContract(wb)).toThrow(StructuralContractError);
  });

  it('hoja "Meta" ausente -> StructuralContractError', async () => {
    const { wb } = await buildRealWorkbook();
    wb.removeWorksheet(wb.getWorksheet('Meta').id);
    expect(() => assertStructuralContract(wb)).toThrow(StructuralContractError);
  });

  it('hoja "Platos" renombrada -> StructuralContractError', () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('PlatosRenombrada');
    wb.addWorksheet('Meta');
    expect(() => assertStructuralContract(wb)).toThrow(StructuralContractError);
  });

  it('dirty: columnas de "Platos" reordenadas -> StructuralContractError (el control SI discrimina)', async () => {
    const { wb, wsPlatos } = await buildRealWorkbook();
    const row1 = wsPlatos.getRow(1);
    const tmp = row1.getCell(4).value;
    row1.getCell(4).value = row1.getCell(5).value;
    row1.getCell(5).value = tmp;
    expect(() => assertStructuralContract(wb)).toThrow(StructuralContractError);
  });
});

describe('mapeo posicional + integridad (nombre/fuente de fila vs. dishes[n-1])', () => {
  it('un cuaderno real sin alterar se ingiere sin lanzar, 0 confirmaciones (control positivo)', async () => {
    const { wb } = await buildRealWorkbook();
    const { lateral } = buildIngestResult(wb, { now: () => '2026-07-08' });
    expect(lateral).toEqual({ version: 1, confirmed: {} });
  });

  it('dirty: nombre de fila alterado (Nº intacto) -> IntegrityError (el control SI discrimina)', async () => {
    const { wb, wsPlatos } = await buildRealWorkbook();
    const row = wsPlatos.getRow(2);
    row.getCell('nombre').value = `${row.getCell('nombre').value} (alterado)`;
    expect(() => buildIngestResult(wb)).toThrow(IntegrityError);
  });

  it('dirty: fuente de fila alterada -> IntegrityError (el control SI discrimina)', async () => {
    const { wb, wsPlatos } = await buildRealWorkbook();
    const row = wsPlatos.getRow(2);
    row.getCell('fuente').value = row.getCell('fuente').value === 'scaffold' ? 'freeform' : 'scaffold';
    expect(() => buildIngestResult(wb)).toThrow(IntegrityError);
  });
});

describe('custodia: solo confirmar_valor + por no vacíos entran al lateral', () => {
  it('confirmar_valor + por rellenos -> entra al lateral (control positivo)', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const scaffoldIdx = rows.findIndex((r) => r.fuente === 'scaffold');
    const dishId = loadCatalog()[scaffoldIdx].id;
    const row = findRowByN(wsPlatos, scaffoldIdx + 1);
    row.getCell('gluten_confirmar_valor').value = 'sí';
    row.getCell('por').value = 'javi';
    row.getCell('fecha').value = '2026-07-01';

    const { lateral } = buildIngestResult(wb, { now: () => '2026-07-08' });
    expect(lateral.confirmed[dishId]).toEqual({ gluten: { valor: true, por: 'javi', fecha: '2026-07-01' } });
  });

  it('dirty: confirmar_valor relleno con "por" vacío -> CustodyError (el control SI discrimina)', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const scaffoldIdx = rows.findIndex((r) => r.fuente === 'scaffold');
    const row = findRowByN(wsPlatos, scaffoldIdx + 1);
    row.getCell('gluten_confirmar_valor').value = 'sí';
    // "por" deliberadamente vacío
    expect(() => buildIngestResult(wb)).toThrow(CustodyError);
  });
});

describe('fecha: estampado por la ingesta cuando la fila confirmada la deja vacía', () => {
  it('fecha vacía en fila confirmada -> se estampa la fecha de ingesta y aparece en el acta', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const scaffoldIdx = rows.findIndex((r) => r.fuente === 'scaffold');
    const dishId = loadCatalog()[scaffoldIdx].id;
    const row = findRowByN(wsPlatos, scaffoldIdx + 1);
    row.getCell('gluten_confirmar_valor').value = 'no';
    row.getCell('por').value = 'javi';
    // fecha vacía

    const { lateral, report } = buildIngestResult(wb, { now: () => '2026-07-08' });
    expect(lateral.confirmed[dishId].gluten.fecha).toBe('2026-07-08');
    expect(report.estampadas).toEqual([`${dishId}:gluten`]);
  });

  it('dirty: fecha presente en la fila -> se respeta tal cual y NO aparece en estampadas (el control SI discrimina)', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const scaffoldIdx = rows.findIndex((r) => r.fuente === 'scaffold');
    const dishId = loadCatalog()[scaffoldIdx].id;
    const row = findRowByN(wsPlatos, scaffoldIdx + 1);
    row.getCell('gluten_confirmar_valor').value = 'no';
    row.getCell('por').value = 'javi';
    row.getCell('fecha').value = '2026-01-15';

    const { lateral, report } = buildIngestResult(wb, { now: () => '2026-07-08' });
    expect(lateral.confirmed[dishId].gluten.fecha).toBe('2026-01-15');
    expect(report.estampadas).toEqual([]);
  });
});

describe('vocabulario cerrado de verdura en la ingesta (C7)', () => {
  function freeformN(rows) {
    return rows.findIndex((r) => r.fuente === 'freeform') + 1;
  }

  it('lista de códigos canónicos separados por coma -> entra al lateral (control positivo)', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const n = freeformN(rows);
    const dishId = loadCatalog()[n - 1].id;
    const row = findRowByN(wsPlatos, n);
    row.getCell('verdura_confirmar_valor').value = 'maiz, edamame';
    row.getCell('por').value = 'javi';
    row.getCell('fecha').value = '2026-07-01';

    const { lateral } = buildIngestResult(wb);
    expect(lateral.confirmed[dishId].verdura.valor).toEqual(['maiz', 'edamame']);
  });

  it('"[]" se acepta como "confirmado: sin verdura", distinguible de ausencia de campo', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const n = freeformN(rows);
    const dishId = loadCatalog()[n - 1].id;
    const row = findRowByN(wsPlatos, n);
    row.getCell('verdura_confirmar_valor').value = '[]';
    row.getCell('por').value = 'javi';
    row.getCell('fecha').value = '2026-07-01';

    const { lateral } = buildIngestResult(wb);
    expect(lateral.confirmed[dishId].verdura.valor).toEqual([]);
    expect(Object.prototype.hasOwnProperty.call(lateral.confirmed, dishId)).toBe(true);
    // un plato sin esa confirmación ni siquiera aparece como clave (ausencia != []):
    const otroFreeformIdx = rows.findIndex((r, i) => r.fuente === 'freeform' && i !== n - 1);
    const otroDishId = loadCatalog()[otroFreeformIdx].id;
    expect(Object.prototype.hasOwnProperty.call(lateral.confirmed, otroDishId)).toBe(false);
  });

  it('dirty: código fuera del canon ("aceitunas") -> VerduraVocabularyError (el control SI discrimina)', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const n = freeformN(rows);
    const row = findRowByN(wsPlatos, n);
    row.getCell('verdura_confirmar_valor').value = 'aceitunas';
    row.getCell('por').value = 'javi';
    expect(() => buildIngestResult(wb)).toThrow(VerduraVocabularyError);
  });

  it('dirty: "brócoli" con tilde (no es el código canónico "brocoli") -> VerduraVocabularyError', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const n = freeformN(rows);
    const row = findRowByN(wsPlatos, n);
    row.getCell('verdura_confirmar_valor').value = 'brócoli';
    row.getCell('por').value = 'javi';
    expect(() => buildIngestResult(wb)).toThrow(VerduraVocabularyError);
  });
});

describe('tipos: gluten/lactosa fuera de {sí, no}', () => {
  it('dirty: gluten="quizás" -> CompositionTypeError (el control SI discrimina)', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const scaffoldIdx = rows.findIndex((r) => r.fuente === 'scaffold');
    const row = findRowByN(wsPlatos, scaffoldIdx + 1);
    row.getCell('gluten_confirmar_valor').value = 'quizás';
    row.getCell('por').value = 'javi';
    expect(() => buildIngestResult(wb)).toThrow(CompositionTypeError);
  });

  it('control positivo: "no" y "sí" (con/sin tilde vía normalización) se aceptan', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const scaffoldIdx = rows.findIndex((r) => r.fuente === 'scaffold');
    const dishId = loadCatalog()[scaffoldIdx].id;
    const row = findRowByN(wsPlatos, scaffoldIdx + 1);
    row.getCell('gluten_confirmar_valor').value = 'no';
    row.getCell('por').value = 'javi';
    row.getCell('fecha').value = '2026-07-01';
    const { lateral } = buildIngestResult(wb);
    expect(lateral.confirmed[dishId].gluten.valor).toBe(false);
  });
});

describe('desalineación de catálogo: hash portado != sha256 actual (+ atomicidad de filesystem)', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTmpDir('ingesta-mismatch-'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('dirty: hash portado erróneo -> CatalogMismatchError; ni lateral ni acta se crean (el control SI discrimina)', async () => {
    const { wb } = await buildRealWorkbook();
    wb.getWorksheet('Meta').getRow(2).getCell(2).value = 'hash-desalineado-de-prueba';

    const xlsxPath = path.join(tmpDir, 'cuaderno.xlsx');
    await wb.xlsx.writeFile(xlsxPath);
    const lateralPath = path.join(tmpDir, 'lateral.json');
    const reportPath = path.join(tmpDir, 'acta.json');

    await expect(runImportCuadernoV5({ xlsxPath, lateralPath, reportPath })).rejects.toThrow(CatalogMismatchError);
    expect(fs.existsSync(lateralPath)).toBe(false);
    expect(fs.existsSync(reportPath)).toBe(false);
  });

  it('control positivo: hash portado correcto -> no lanza por desalineación', async () => {
    const { wb } = await buildRealWorkbook();
    const xlsxPath = path.join(tmpDir, 'cuaderno.xlsx');
    await wb.xlsx.writeFile(xlsxPath);
    const lateralPath = path.join(tmpDir, 'lateral.json');
    const reportPath = path.join(tmpDir, 'acta.json');

    await expect(runImportCuadernoV5({ xlsxPath, lateralPath, reportPath })).resolves.toBeTruthy();
  });
});

describe('atomicidad estricta: una fila inválida entre varias válidas', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTmpDir('ingesta-atomic-'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('dirty: 2 confirmaciones válidas + 1 fila con custodia rota -> nada se escribe, ni lateral ni acta (el control SI discrimina)', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const scaffoldIdxs = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.fuente === 'scaffold')
      .slice(0, 3)
      .map(({ i }) => i);

    for (const idx of scaffoldIdxs.slice(0, 2)) {
      const row = findRowByN(wsPlatos, idx + 1);
      row.getCell('gluten_confirmar_valor').value = 'sí';
      row.getCell('por').value = 'javi';
      row.getCell('fecha').value = '2026-07-01';
    }
    // 3ª fila: confirmar_valor relleno, "por" vacío -> custodia rota
    const badRow = findRowByN(wsPlatos, scaffoldIdxs[2] + 1);
    badRow.getCell('lactosa_confirmar_valor').value = 'no';

    const xlsxPath = path.join(tmpDir, 'cuaderno.xlsx');
    await wb.xlsx.writeFile(xlsxPath);
    const lateralPath = path.join(tmpDir, 'lateral.json');
    const reportPath = path.join(tmpDir, 'acta.json');

    await expect(runImportCuadernoV5({ xlsxPath, lateralPath, reportPath })).rejects.toThrow(CustodyError);
    expect(fs.existsSync(lateralPath)).toBe(false);
    expect(fs.existsSync(reportPath)).toBe(false);
  });
});

describe('C10: el significado del lateral no depende del orden físico de las filas', () => {
  it('mismas confirmaciones, cuaderno con filas en orden físico distinto -> mismo lateral byte a byte', async () => {
    const rowsA = buildPlatosRows();
    const rowsB = [...rowsA].reverse();
    const wbA = await buildWorkbook(rowsA);
    const wbB = await buildWorkbook(rowsB);
    const wsA = wbA.getWorksheet('Platos');
    const wsB = wbB.getWorksheet('Platos');

    const scaffoldIdx = rowsA.findIndex((r) => r.fuente === 'scaffold');
    const n = scaffoldIdx + 1;
    for (const ws of [wsA, wsB]) {
      const row = findRowByN(ws, n);
      row.getCell('gluten_confirmar_valor').value = 'sí';
      row.getCell('por').value = 'javi';
      row.getCell('fecha').value = '2026-07-01';
    }

    const resultA = buildIngestResult(wbA);
    const resultB = buildIngestResult(wbB);
    expect(JSON.stringify(resultA.lateral)).toBe(JSON.stringify(resultB.lateral));
  });

  it('dirty: un valor distinto entre las dos versiones SI rompe la igualdad (el control SI discrimina)', async () => {
    const rowsA = buildPlatosRows();
    const rowsB = [...rowsA].reverse();
    const wbA = await buildWorkbook(rowsA);
    const wbB = await buildWorkbook(rowsB);
    const wsA = wbA.getWorksheet('Platos');
    const wsB = wbB.getWorksheet('Platos');

    const scaffoldIdx = rowsA.findIndex((r) => r.fuente === 'scaffold');
    const n = scaffoldIdx + 1;
    const rowA = findRowByN(wsA, n);
    rowA.getCell('gluten_confirmar_valor').value = 'sí';
    rowA.getCell('por').value = 'javi';
    rowA.getCell('fecha').value = '2026-07-01';

    const rowB = findRowByN(wsB, n);
    rowB.getCell('gluten_confirmar_valor').value = 'no'; // valor distinto
    rowB.getCell('por').value = 'javi';
    rowB.getCell('fecha').value = '2026-07-01';

    const resultA = buildIngestResult(wbA);
    const resultB = buildIngestResult(wbB);
    expect(JSON.stringify(resultA.lateral)).not.toBe(JSON.stringify(resultB.lateral));
  });
});

describe('single-write: lateral ya poblado se rechaza, vacío-versionado se acepta', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTmpDir('ingesta-singlewrite-'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('dirty: lateral con una confirmación previa -> SingleWriteError, contenido previo intacto byte a byte (el control SI discrimina)', async () => {
    const { wb } = await buildRealWorkbook();
    const xlsxPath = path.join(tmpDir, 'cuaderno.xlsx');
    await wb.xlsx.writeFile(xlsxPath);
    const lateralPath = path.join(tmpDir, 'lateral.json');
    const reportPath = path.join(tmpDir, 'acta.json');
    const previo = JSON.stringify({
      version: 1,
      confirmed: { algunPlato: { gluten: { valor: true, por: 'x', fecha: '2026-01-01' } } },
    });
    fs.writeFileSync(lateralPath, previo);

    await expect(runImportCuadernoV5({ xlsxPath, lateralPath, reportPath })).rejects.toThrow(SingleWriteError);
    expect(fs.readFileSync(lateralPath, 'utf8')).toBe(previo);
    expect(fs.existsSync(reportPath)).toBe(false);
  });

  it('control positivo: lateral vacío-versionado ({"version":1,"confirmed":{}}) permite la escritura', async () => {
    const { wb } = await buildRealWorkbook();
    const xlsxPath = path.join(tmpDir, 'cuaderno.xlsx');
    await wb.xlsx.writeFile(xlsxPath);
    const lateralPath = path.join(tmpDir, 'lateral.json');
    const reportPath = path.join(tmpDir, 'acta.json');
    fs.writeFileSync(lateralPath, JSON.stringify({ version: 1, confirmed: {} }));

    await expect(runImportCuadernoV5({ xlsxPath, lateralPath, reportPath })).resolves.toBeTruthy();
    expect(fs.existsSync(reportPath)).toBe(true);
  });

  it('control positivo: lateral inexistente permite la escritura', async () => {
    const { wb } = await buildRealWorkbook();
    const xlsxPath = path.join(tmpDir, 'cuaderno.xlsx');
    await wb.xlsx.writeFile(xlsxPath);
    const lateralPath = path.join(tmpDir, 'lateral.json');
    const reportPath = path.join(tmpDir, 'acta.json');

    await expect(runImportCuadernoV5({ xlsxPath, lateralPath, reportPath })).resolves.toBeTruthy();
    expect(fs.existsSync(lateralPath)).toBe(true);
  });
});

describe('acta de ingesta: conteos por campo y estampadas exactas', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTmpDir('ingesta-acta-'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('conteos y estampadas exactos para un cuaderno con confirmaciones conocidas', async () => {
    const { rows, wb, wsPlatos } = await buildRealWorkbook();
    const dishes = loadCatalog();
    const scaffoldIdx = rows.findIndex((r) => r.fuente === 'scaffold');
    const freeformIdx = rows.findIndex((r) => r.fuente === 'freeform');
    const dishIdScaffold = dishes[scaffoldIdx].id;

    const rowScaffold = findRowByN(wsPlatos, scaffoldIdx + 1);
    rowScaffold.getCell('gluten_confirmar_valor').value = 'sí';
    rowScaffold.getCell('lactosa_confirmar_valor').value = 'no';
    rowScaffold.getCell('por').value = 'javi';
    // fecha vacía -> estampada para ambos campos

    const rowFreeform = findRowByN(wsPlatos, freeformIdx + 1);
    rowFreeform.getCell('verdura_confirmar_valor').value = 'tomate';
    rowFreeform.getCell('por').value = 'javi';
    rowFreeform.getCell('fecha').value = '2026-06-01'; // no estampada

    const xlsxPath = path.join(tmpDir, 'cuaderno.xlsx');
    await wb.xlsx.writeFile(xlsxPath);
    const lateralPath = path.join(tmpDir, 'lateral.json');
    const reportPath = path.join(tmpDir, 'acta.json');

    const { report } = await runImportCuadernoV5({ xlsxPath, lateralPath, reportPath });
    expect(report.conteos).toEqual({ gluten: 1, lactosa: 1, verdura: 1 });
    expect(report.estampadas.slice().sort()).toEqual(
      [`${dishIdScaffold}:gluten`, `${dishIdScaffold}:lactosa`].sort()
    );
    expect(fs.existsSync(reportPath)).toBe(true);
    const acta = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(acta.conteos).toEqual({ gluten: 1, lactosa: 1, verdura: 1 });
  });
});

describe('no-regresión de alcance: la lista NO-TOCAR queda sin diff frente a origin/main', () => {
  const NO_TOCAR = [
    'scripts/phaseB2/exportCocinero.js',
    'scripts/phaseB2/importAnotacion.js',
    'scripts/phaseB2/runImportAnotacion.js',
    'scripts/phaseB2/freeformPromote.js',
    'scripts/phaseB2/runFreeformPromote.js',
    'scripts/phaseB2/output/dishes.json',
    'src/engine2',
  ];

  it('git diff --stat contra origin/main está vacío para todos los archivos/carpetas NO-TOCAR', () => {
    const out = execSync(`git diff --stat origin/main -- ${NO_TOCAR.join(' ')}`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(out.trim()).toBe('');
  });

  it('dirty: un archivo de la lista con una línea añadida SI aparece en el diff (el control SI discrimina)', () => {
    const probe = path.resolve(REPO_ROOT, 'scripts/phaseB2/importAnotacion.js');
    const original = fs.readFileSync(probe, 'utf8');
    fs.writeFileSync(probe, `${original}\n// dirty probe temporal D3\n`);
    try {
      const out = execSync(`git diff --stat origin/main -- ${NO_TOCAR.join(' ')}`, {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      expect(out.trim()).not.toBe('');
    } finally {
      fs.writeFileSync(probe, original);
    }
  });
});
