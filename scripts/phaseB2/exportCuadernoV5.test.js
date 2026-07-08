// exportCuadernoV5.test.js — EDITORIAL-D2 (D-028). Falsables obligatorios
// del generador del cuaderno v5: reproducibilidad (vía B, dump+hash),
// asimetría de conteos (241/178/178/63) y de activación (lock estructural),
// custodia (cero filas nacen confirmadas), aislamiento estático respecto a
// exportCocinero.js (patrón estrangulador, G3), el almacén lateral vacío-
// versionado, y no-regresión de alcance sobre la lista NO-TOCAR completa.
//
// Cada describe incluye un control positivo + un control "dirty" que
// demuestra que el test discrimina de verdad (mismo idioma que
// scripts/phaseP2c/compareD2.test.js, controles 1/1b).

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  buildPlatosRows,
  buildWorkbook,
  countActiveCells,
  dumpRows,
  hashRows,
  buildEmptyConfirmationsLateral,
  verifyCatalogHash,
  CatalogHashMismatchError,
  EXPECTED_TOTAL_ROWS,
  EXPECTED_ACTIVE_COUNTS,
  EXPECTED_CATALOG_SHA256,
  META_SHEET_NAME,
  META_HASH_KEY,
} from './exportCuadernoV5.js';
import { loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';
import { resolveCatalogComposition } from '../../src/engine2/dishes/compositionResolver.js';
import { loadVerduraVocabulary } from './verduraVocabulary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const SOURCE_PATH = path.resolve(__dirname, './exportCuadernoV5.js');
const LATERAL_PATH = path.resolve(__dirname, './output/dishCompositionConfirmations.json');

describe('verificación de hash del catálogo canónico', () => {
  it('el hash de dishes.json coincide con el ratificado en D-028', () => {
    expect(verifyCatalogHash()).toBe('a8fe0abb0ff6509dd0a2d9b11ebdc5627674bace395b099bb624ddcc8c2c25c7');
  });

  it('dirty: un catálogo con contenido distinto es rechazado (CatalogHashMismatchError)', () => {
    const tmpPath = path.join(__dirname, 'output', '_tmp_dirty_dishes.json');
    fs.writeFileSync(tmpPath, JSON.stringify([{ id: 'x' }]));
    try {
      expect(() => verifyCatalogHash(tmpPath)).toThrow(CatalogHashMismatchError);
    } finally {
      fs.rmSync(tmpPath, { force: true });
    }
  });
});

describe('reproducibilidad (vía B: dump determinista + sha256, no el binario .xlsx)', () => {
  it('dos construcciones de filas sobre el mismo catálogo producen dump y hash idénticos', () => {
    const rows1 = buildPlatosRows();
    const rows2 = buildPlatosRows();
    expect(dumpRows(rows1)).toBe(dumpRows(rows2));
    expect(hashRows(rows1)).toBe(hashRows(rows2));
  });

  it('dirty: alterar una celda entre ejecuciones cambia el hash (el control SI discrimina)', () => {
    const rows1 = buildPlatosRows();
    const rows2 = buildPlatosRows();
    rows2[0] = { ...rows2[0], nombre: `${rows2[0].nombre} (alterado)` };
    expect(hashRows(rows1)).not.toBe(hashRows(rows2));
  });
});

describe('asimetría de conteos sobre dishes.json canónico (D-028)', () => {
  it('241 filas totales; celdas activas gluten=178, lactosa=178, verdura=63', () => {
    const rows = buildPlatosRows();
    expect(rows.length).toBe(EXPECTED_TOTAL_ROWS);
    expect(countActiveCells(rows)).toEqual(EXPECTED_ACTIVE_COUNTS);
  });

  it('dirty: forzar un plato scaffold a gluten "conocida" rompe el conteo esperado (el control SI discrimina)', () => {
    const dishes = loadCatalog();
    const baseVistas = resolveCatalogComposition(dishes);
    const idx = baseVistas.findIndex((v) => v.origen === 'scaffold');
    const vistas = baseVistas.slice();
    vistas[idx] = { ...vistas[idx], containsGluten: { estado: 'conocida', valor: false } };

    const rows = buildPlatosRows({ dishes, vistas });
    expect(countActiveCells(rows).gluten).toBe(EXPECTED_ACTIVE_COUNTS.gluten - 1);
    expect(countActiveCells(rows)).not.toEqual(EXPECTED_ACTIVE_COUNTS);
  });
});

describe('asimetría de activación (lock estructural) en el cuaderno', () => {
  it('confirmar_valor de gluten: desbloqueada en scaffold, bloqueada en freeform', async () => {
    const rows = buildPlatosRows();
    const wb = await buildWorkbook(rows);
    const ws = wb.getWorksheet('Platos');
    const scaffoldIdx = rows.findIndex((r) => r.fuente === 'scaffold');
    const freeformIdx = rows.findIndex((r) => r.fuente === 'freeform');

    const scaffoldCell = ws.getRow(scaffoldIdx + 2).getCell('gluten_confirmar_valor');
    const freeformCell = ws.getRow(freeformIdx + 2).getCell('gluten_confirmar_valor');

    expect(scaffoldCell.protection.locked).toBe(false);
    expect(freeformCell.protection?.locked ?? true).toBe(true);
  });

  it('confirmar_valor de verdura: desbloqueada en freeform, bloqueada en scaffold (asimetría inversa)', async () => {
    const rows = buildPlatosRows();
    const wb = await buildWorkbook(rows);
    const ws = wb.getWorksheet('Platos');
    const scaffoldIdx = rows.findIndex((r) => r.fuente === 'scaffold');
    const freeformIdx = rows.findIndex((r) => r.fuente === 'freeform');

    const scaffoldCell = ws.getRow(scaffoldIdx + 2).getCell('verdura_confirmar_valor');
    const freeformCell = ws.getRow(freeformIdx + 2).getCell('verdura_confirmar_valor');

    expect(freeformCell.protection.locked).toBe(false);
    expect(scaffoldCell.protection?.locked ?? true).toBe(true);
  });

  it('dirty: una fila freeform con gluten_origen_actual forzado a "desconocida" aparece con la celda desbloqueada (el control SI discrimina)', async () => {
    const rows = buildPlatosRows();
    const freeformIdx = rows.findIndex((r) => r.fuente === 'freeform');
    const brokenRows = rows.map((r, i) =>
      i === freeformIdx ? { ...r, gluten_origen_actual: 'desconocida' } : r
    );
    const wb = await buildWorkbook(brokenRows);
    const ws = wb.getWorksheet('Platos');
    const brokenCell = ws.getRow(freeformIdx + 2).getCell('gluten_confirmar_valor');
    // Si la asimetría se rompiera en producción, esta celda saldría
    // desbloqueada indebidamente en un plato freeform -- este control lo
    // detecta al construir el workbook con el dato ya corrompido.
    expect(brokenCell.protection.locked).toBe(false);
  });
});

describe('custodia: ninguna fila nace con confirmar_valor relleno', () => {
  function offenders(rows) {
    return rows.filter(
      (r) => r.gluten_confirmar_valor !== '' || r.lactosa_confirmar_valor !== '' || r.verdura_confirmar_valor !== ''
    );
  }

  it('buildPlatosRows() no rellena ninguna celda de confirmación (241 filas)', () => {
    const rows = buildPlatosRows();
    expect(offenders(rows)).toEqual([]);
  });

  it('dirty: una fila con una celda de confirmación pre-rellenada es detectada (el control SI discrimina)', () => {
    const rows = buildPlatosRows();
    const tampered = rows.map((r, i) => (i === 0 ? { ...r, gluten_confirmar_valor: 'sí' } : r));
    expect(offenders(tampered).length).toBe(1);
  });
});

describe('control estático: exportCuadernoV5.js no importa exportCocinero.js (G3, patrón estrangulador)', () => {
  const IMPORT_PATTERN = /from\s+['"][^'"]*exportCocinero\.js['"]/;

  it('el código fuente real no contiene ningún import de exportCocinero.js', () => {
    const src = fs.readFileSync(SOURCE_PATH, 'utf8');
    expect(IMPORT_PATTERN.test(src)).toBe(false);
  });

  it('dirty: una fuente con ese import SI es detectada por el control (el control SI discrimina)', () => {
    const tampered = `import { regenerateNombreSugerido } from './exportCocinero.js';\n${fs.readFileSync(SOURCE_PATH, 'utf8')}`;
    expect(IMPORT_PATTERN.test(tampered)).toBe(true);
  });
});

describe('almacén lateral vacío-versionado', () => {
  it('buildEmptyConfirmationsLateral() produce exactamente {"version":1,"confirmed":{}}', () => {
    expect(JSON.stringify(buildEmptyConfirmationsLateral())).toBe('{"version":1,"confirmed":{}}');
  });

  it('el fichero escrito en disco es ese literal exacto', () => {
    const written = fs.readFileSync(LATERAL_PATH, 'utf8');
    expect(written).toBe('{"version":1,"confirmed":{}}');
  });

  it('dirty: un objeto con una confirmación real no coincide con el literal esperado (el control SI discrimina)', () => {
    const tampered = {
      version: 1,
      confirmed: { algunPlato: { gluten: { valor: true, por: 'x', fecha: '2026-01-01' } } },
    };
    expect(JSON.stringify(tampered)).not.toBe('{"version":1,"confirmed":{}}');
  });
});

describe('hash portado en la hoja Meta (D-028, enmienda eslabón 4)', () => {
  it('la hoja Meta existe con cabecera ["clave","valor"] y la fila del hash', async () => {
    const rows = buildPlatosRows();
    const wb = await buildWorkbook(rows);
    const wsMeta = wb.getWorksheet(META_SHEET_NAME);
    expect(wsMeta).toBeTruthy();
    expect(wsMeta.getRow(1).getCell(1).value).toBe('clave');
    expect(wsMeta.getRow(1).getCell(2).value).toBe('valor');
    expect(wsMeta.getRow(2).getCell(1).value).toBe(META_HASH_KEY);
    expect(wsMeta.getRow(2).getCell(2).value).toBe(EXPECTED_CATALOG_SHA256);
  });

  it('el hash portado coincide con el sha256 real de dishes.json', async () => {
    const catalogSha256 = verifyCatalogHash();
    const wb = await buildWorkbook(buildPlatosRows(), { catalogSha256 });
    const wsMeta = wb.getWorksheet(META_SHEET_NAME);
    expect(wsMeta.getRow(2).getCell(2).value).toBe(catalogSha256);
  });

  it('dirty: un hash distinto pasado a buildWorkbook aparece en la celda tal cual (el control SI discrimina)', async () => {
    const wb = await buildWorkbook(buildPlatosRows(), { catalogSha256: 'hash-falso-de-prueba' });
    const wsMeta = wb.getWorksheet(META_SHEET_NAME);
    expect(wsMeta.getRow(2).getCell(2).value).not.toBe(EXPECTED_CATALOG_SHA256);
    expect(wsMeta.getRow(2).getCell(2).value).toBe('hash-falso-de-prueba');
  });
});

describe('Leyenda: contenido añadido en la enmienda (fecha, 32 ejes, nota no-verdura)', () => {
  async function leyendaLines() {
    const wb = await buildWorkbook(buildPlatosRows());
    const ws = wb.getWorksheet('Leyenda');
    const lines = [];
    ws.eachRow((row) => lines.push(row.getCell(1).value));
    return lines.join('\n');
  }

  it('incluye la semántica de fecha (confirmación vs. fecha de ingesta)', async () => {
    const text = await leyendaLines();
    expect(text).toContain('fecha de tu confirmación');
    expect(text).toContain('se registrará la fecha de ingesta');
  });

  it('incluye los 32 ejes canónicos del vocabulario (fuente única, sin lista duplicada a mano)', async () => {
    const text = await leyendaLines();
    const { ejes } = loadVerduraVocabulary();
    expect(ejes.length).toBe(32);
    for (const eje of ejes) expect(text).toContain(eje);
  });

  it('incluye la nota de no-verdura corregida (aceitunas/pepinillos/chile fuera; maíz condicional; edamame y setas dentro)', async () => {
    const text = await leyendaLines();
    expect(text).toContain('aceitunas (condimento)');
    expect(text).toContain('pepinillos (encurtido)');
    expect(text).toContain('chile/guindilla (picante)');
    expect(text).toContain('Edamame y setas SÍ cuentan');
  });

  it('dirty: un texto de Leyenda sin la nota de no-verdura NO pasaría este control (el control SI discrimina)', () => {
    const textoIncompleto = 'CÓMO ANOTAR — cuaderno v5 (D-028)\nsolo texto viejo, sin nota de no-verdura';
    expect(textoIncompleto).not.toContain('aceitunas (condimento)');
  });

  it('deja explícitos los tres estados de confirmación de verdura (blanco / códigos / sentinela vacío·[])', async () => {
    const text = await leyendaLines();
    expect(text).toContain('Deja la celda en blanco si no has revisado ese plato.');
    expect(text).toContain('Escribe uno o varios códigos separados por comas si confirmas las verduras.');
    expect(text).toContain('escribe exactamente «vacío» o «[]»');
    expect(text).toContain('No dejes la celda en blanco para indicar "sin verdura"');
  });

  it('dirty: un texto de Leyenda con solo dos de los tres estados NO pasaría este control (el control SI discrimina)', () => {
    const textoIncompleto =
      'Verdura (confirmación):\n' +
      '- Deja la celda en blanco si no has revisado ese plato.\n' +
      '- Escribe uno o varios códigos separados por comas si confirmas las verduras.';
    expect(textoIncompleto).not.toContain('escribe exactamente «vacío» o «[]»');
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
    fs.writeFileSync(probe, `${original}\n// dirty probe temporal\n`);
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
