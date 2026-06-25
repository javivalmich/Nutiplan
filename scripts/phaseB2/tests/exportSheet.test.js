// Tests de scripts/phaseB2/exportSheet.js (utilidad de hoja de
// anotacion). READ-ONLY: nunca tocan dishes.scaffold.json real, ni
// generan el .xlsx real en estos tests (usan fixtures + rutas temp).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import {
  estaPreAnotado,
  sortDishesByFrequency,
  buildRows,
  writeWorkbook,
  exportSheet,
} from '../exportSheet.js';
import { ANCHORS } from '../../../src/engine2/dishes/anchors.js';

function dishFixture(overrides = {}) {
  return {
    id: '["tmpl","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]',
    nombre: 'TODO',
    rol: 'TODO',
    batchable: 'TODO',
    leftoverQuality: 'TODO',
    shelfLifeDays: 'TODO',
    energiaCocina: 'TODO',
    momento: ['comida'],
    tempFeel: 'caliente',
    plateType: 'caliente_arroz',
    ...overrides,
  };
}

function anchorDishFixture(overrides = {}) {
  return dishFixture({
    rol: 'ancla',
    batchable: true,
    leftoverQuality: 'alta',
    shelfLifeDays: 4,
    energiaCocina: 'alto',
    ...overrides,
  });
}

describe('estaPreAnotado', () => {
  it('false si cualquiera de los 5 campos (sin nombre) sigue TODO', () => {
    expect(estaPreAnotado(dishFixture())).toBe(false);
  });

  it('true si los 5 campos (sin nombre) NO son TODO, aunque nombre siga TODO', () => {
    expect(estaPreAnotado(anchorDishFixture())).toBe(true);
  });

  it('PRUEBA DE DISCRIMINACION: revertir un solo campo a TODO vuelve a dar false', () => {
    const anclaRota = anchorDishFixture({ energiaCocina: 'TODO' });
    expect(estaPreAnotado(anclaRota)).toBe(false);
  });

  it('las 6 ANCHORS reales, ensambladas con sus 5 campos editoriales, dan estaPreAnotado=true', () => {
    expect(ANCHORS.length).toBe(6);
    for (const anchor of ANCHORS) {
      const dish = dishFixture({
        rol: anchor.rol,
        batchable: anchor.batchable,
        leftoverQuality: anchor.leftoverQuality,
        shelfLifeDays: anchor.shelfLifeDays,
        energiaCocina: anchor.energiaCocina,
      });
      expect(estaPreAnotado(dish)).toBe(true);
    }
  });
});

describe('sortDishesByFrequency', () => {
  it('ordena descendente por frecuencia; los ausentes del mapa (frecuencia 0) van al final', () => {
    const dishes = [
      dishFixture({ id: 'A' }),
      dishFixture({ id: 'B' }),
      dishFixture({ id: 'C' }),
    ];
    const frequencyMap = new Map([['B', 5], ['A', 2]]); // 'C' ausente -> 0
    const ordenado = sortDishesByFrequency(dishes, frequencyMap);
    expect(ordenado.map((d) => d.id)).toEqual(['B', 'A', 'C']);
  });

  it('desempate lexicografico estricto por identityKey en empates (incluido frecuencia 0)', () => {
    const dishes = [
      dishFixture({ id: 'Z' }),
      dishFixture({ id: 'A' }),
      dishFixture({ id: 'M' }),
    ];
    const ordenado = sortDishesByFrequency(dishes, new Map()); // todos a 0
    expect(ordenado.map((d) => d.id)).toEqual(['A', 'M', 'Z']);
  });

  it('PRUEBA DE DISCRIMINACION: no muta el array de entrada', () => {
    const dishes = [dishFixture({ id: 'Z' }), dishFixture({ id: 'A' })];
    const original = [...dishes];
    sortDishesByFrequency(dishes, new Map());
    expect(dishes).toEqual(original); // sin mutar
  });
});

describe('buildRows', () => {
  it('produce las 10 columnas esperadas, con "Nombre sugerido" via deriveTituloSugerido (no reimplementado)', () => {
    const rows = buildRows([dishFixture()]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      numero: 1,
      nombreSugerido: 'Pollo con arroz y brócoli a la plancha',
      momento: 'comida',
      plateType: 'caliente_arroz',
      rol: 'TODO',
      batchable: 'TODO',
      leftoverQuality: 'TODO',
      shelfLifeDays: 'TODO',
      energiaCocina: 'TODO',
      yaAnotado: 'no',
    });
  });

  it('batchable boolean se muestra como "si"/"no"; "ya anotado" es "sí" para un ancla', () => {
    const rows = buildRows([anchorDishFixture()]);
    expect(rows[0].batchable).toBe('si');
    expect(rows[0].yaAnotado).toBe('sí');
  });

  it('momento con 2 elementos se muestra unido con " + "', () => {
    const rows = buildRows([dishFixture({ momento: ['comida', 'cena'] })]);
    expect(rows[0].momento).toBe('comida + cena');
  });
});

describe('writeWorkbook (contra ruta temporal, NUNCA el xlsx real)', () => {
  let tmpDir;
  let outPath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-sheet-test-'));
    outPath = path.join(tmpDir, 'fixture.xlsx');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('escribe 2 pestañas: "Leyenda" (texto integro) y "Platos" (cabecera + N filas)', async () => {
    const rows = buildRows([dishFixture({ id: '["tmpl","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]' }), anchorDishFixture({ id: '["tmpl","ternera","patata","zanahoria",null,"ajillo","guisado"]' })]);
    await writeWorkbook(outPath, rows, 'linea1\nlinea2');

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(outPath);
    expect(wb.worksheets.map((w) => w.name)).toEqual(['Leyenda', 'Platos']);

    const leyenda = wb.getWorksheet('Leyenda');
    expect(leyenda.getCell('A1').value).toBe('linea1');
    expect(leyenda.getCell('A2').value).toBe('linea2');

    const platos = wb.getWorksheet('Platos');
    expect(platos.rowCount).toBe(3); // cabecera + 2 filas
    expect(platos.getRow(1).getCell(1).value).toBe('Nº');
  });

  it('dropdowns reales (dataValidation) en rol/batchable/leftoverQuality/energiaCocina, leidos del enum real de schema.js', async () => {
    const rows = buildRows([dishFixture({ id: '["tmpl","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]' })]);
    await writeWorkbook(outPath, rows, 'leyenda');

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(outPath);
    const platos = wb.getWorksheet('Platos');

    const rolDV = platos.getCell('E2').dataValidation;
    expect(rolDV.type).toBe('list');
    expect(rolDV.formulae[0]).toContain('ancla');
    expect(rolDV.formulae[0]).toContain('rotativo');
    expect(rolDV.formulae[0]).toContain('capricho');

    const batchableDV = platos.getCell('F2').dataValidation;
    expect(batchableDV.formulae[0]).toBe('"si,no"');

    const leftoverDV = platos.getCell('G2').dataValidation;
    expect(leftoverDV.formulae[0]).toContain('alta');

    const energiaDV = platos.getCell('I2').dataValidation;
    expect(energiaDV.formulae[0]).toContain('alto');
  });

  it('shelfLifeDays valida entero entre 1 y 7', async () => {
    const rows = buildRows([dishFixture({ id: '["tmpl","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]' })]);
    await writeWorkbook(outPath, rows, 'leyenda');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(outPath);
    const dv = wb.getWorksheet('Platos').getCell('H2').dataValidation;
    expect(dv).toEqual({ type: 'whole', operator: 'between', allowBlank: true, formulae: [1, 7] });
  });

  it('PRUEBA DE DISCRIMINACION: las filas "ya anotado"=sí quedan sombreadas; las "no" quedan sin sombrear', async () => {
    const rows = buildRows([dishFixture({ id: '["tmpl","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]' }), anchorDishFixture({ id: '["tmpl","ternera","patata","zanahoria",null,"ajillo","guisado"]' })]);
    await writeWorkbook(outPath, rows, 'leyenda');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(outPath);
    const platos = wb.getWorksheet('Platos');

    expect(platos.getCell('B2').fill).toBeUndefined(); // fila "no" (dish normal)
    expect(platos.getCell('B3').fill).toEqual({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }); // fila "sí" (ancla)
  });
});

describe('exportSheet (orquestador) — contra fixtures temporales, READ-ONLY sobre la entrada', () => {
  let tmpDir;
  let scaffoldPath;
  let outputPath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-sheet-orq-test-'));
    scaffoldPath = path.join(tmpDir, 'dishes.scaffold.fixture.json');
    outputPath = path.join(tmpDir, 'out.xlsx');
    fs.writeFileSync(scaffoldPath, JSON.stringify([dishFixture({ id: '["tmpl","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]' }), anchorDishFixture({ id: '["tmpl","ternera","patata","zanahoria",null,"ajillo","guisado"]' })], null, 2));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('NO modifica el scaffold de entrada (read-only)', async () => {
    const antes = fs.readFileSync(scaffoldPath, 'utf-8');
    await exportSheet({ scaffoldPath, outputPath, leyendaTexto: 'leyenda', srcRoot: path.resolve(process.cwd(), 'src') });
    const despues = fs.readFileSync(scaffoldPath, 'utf-8');
    expect(despues).toBe(antes);
  });

  it('devuelve nFilas y nPreAnotados correctos para el fixture (1 normal + 1 ancla)', async () => {
    const result = await exportSheet({ scaffoldPath, outputPath, leyendaTexto: 'leyenda', srcRoot: path.resolve(process.cwd(), 'src') });
    expect(result.nFilas).toBe(2);
    expect(result.nPreAnotados).toBe(1);
    expect(fs.existsSync(outputPath)).toBe(true);
  });
});
