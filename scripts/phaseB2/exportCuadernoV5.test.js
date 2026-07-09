// exportCuadernoV5.test.js — EDITORIAL-D2 (D-028). Falsables obligatorios
// del generador del cuaderno v5: reproducibilidad (vía B, dump+hash),
// asimetría de conteos (241/178/178/63) y de activación (lock estructural),
// custodia (cero filas nacen confirmadas), aislamiento estático respecto a
// exportCocinero.js (patrón estrangulador, G3), y el almacén lateral vacío-
// versionado.
//
// El bloque "no-regresión de alcance" (guard de git diff --stat contra
// origin/main) se retiró en EDITORIAL-S2-0: comparaba contra una referencia
// móvil de git, no una propiedad del código, y su "dirty" mutaba un archivo
// de producción para probarse a sí mismo. Ver mensaje del commit de retirada.
//
// Cada describe incluye un control positivo + un control "dirty" que
// demuestra que el test discrimina de verdad (mismo idioma que
// scripts/phaseP2c/compareD2.test.js, controles 1/1b).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ExcelJS from 'exceljs';
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
const SOURCE_PATH = path.resolve(__dirname, './exportCuadernoV5.js');

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

  it('dirty: forzar un plato scaffold a gluten "derivada" rompe el conteo esperado (el control SI discrimina)', () => {
    const dishes = loadCatalog();
    const baseVistas = resolveCatalogComposition(dishes);
    const idx = baseVistas.findIndex((v) => v.origen === 'scaffold');
    const vistas = baseVistas.slice();
    vistas[idx] = { ...vistas[idx], containsGluten: { origen: 'derivada', valorEfectivo: false } };

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

  it('el fichero escrito en disco es ese literal exacto (en tmpdir, no en output/ de producción)', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exportCuadernoV5-lateral-'));
    const tmpLateralPath = path.join(tmpDir, 'dishCompositionConfirmations.json');
    fs.writeFileSync(tmpLateralPath, JSON.stringify(buildEmptyConfirmationsLateral()));

    const written = fs.readFileSync(tmpLateralPath, 'utf8');
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
describe('S2 (D-028 §2) — T5 [D.2] buildPlatosRows es CONSUMIDOR DE DOMINIO: LANZA sobre confirmada', () => {
  // Doctrina Fork D.2 (adenda Fase 1 EDITORIAL-S2, generalizada mas alla de
  // los 3 sitios nombrados en el prompt de sesion): estadoAOrigenActual/
  // valorActualBooleano/valorActualVerdura tienen consecuencia observable
  // (el contenido del cuaderno exportado) -- LANZAN sobre origen=
  // "confirmada". Se testea a nivel de buildPlatosRows (la funcion
  // exportada) inyectando vistas via el override opts.vistas ya existente
  // en el modulo, mismo patron que el "dirty" de linea 80-90.
  it('lanza, nombrando el generador y S3, si una vista trae containsGluten.origen="confirmada"', () => {
    const dishes = loadCatalog();
    const baseVistas = resolveCatalogComposition(dishes);
    const idx = baseVistas.findIndex((v) => v.origen === 'scaffold');
    const vistas = baseVistas.slice();
    vistas[idx] = { ...vistas[idx], containsGluten: { origen: 'confirmada', valorEfectivo: true } };

    let thrown;
    try {
      buildPlatosRows({ dishes, vistas });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeDefined();
    expect(thrown.message).toMatch(/buildPlatosRows/);
    expect(thrown.message).toMatch(/S3/);
  });

  it('lanza tambien sobre verdura (no extrapolado de gluten: assertNoConfirmada se llama por separado para verdura, ver exportCuadernoV5.js)', () => {
    const dishes = loadCatalog();
    const baseVistas = resolveCatalogComposition(dishes);
    const idx = baseVistas.findIndex((v) => v.origen === 'freeform');
    const vistas = baseVistas.slice();
    vistas[idx] = { ...vistas[idx], verdura: { origen: 'confirmada', valorEfectivo: ['tomate'] } };

    let thrown;
    try {
      buildPlatosRows({ dishes, vistas });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeDefined();
    expect(thrown.message).toMatch(/buildPlatosRows/);
    expect(thrown.message).toMatch(/S3/);
  });
});

describe('S2 (D-028 §2) — T7 [C2-bis, REFORMULADO] gate independiente de contenido del .xlsx (Fork G)', () => {
  // El verificador queda FUERA del objeto verificado (adenda Fase 1): esta
  // funcion NO es exportCuadernoV5.js ni ninguna de sus funciones. Abre el
  // .xlsx ya escrito con una instancia FRESCA de ExcelJS y lo vuelca a una
  // forma canonica y deterministica.
  //
  // DECLARACION DE COBERTURA (cerrada, sin residuo -- cada propiedad de
  // ExcelJS que el generador REALMENTE toca (grep exhaustivo sobre
  // exportCuadernoV5.js) esta clasificada DENTRO o FUERA):
  //
  //   DENTRO del dump: nombre de cada hoja y su orden (wb.worksheets), orden
  //     de filas (eachRow con includeEmpty), orden de columnas (eachCell con
  //     includeEmpty, orden fisico de la fila), valor de celda (cell.value
  //     tal cual lo devuelve ExcelJS), tipo de celda (cell.type), bloqueo/
  //     proteccion de CELDA (cell.protection?.locked), y proteccion de HOJA
  //     -- ws.sheetProtection?.sheet (booleano: si la hoja tiene proteccion
  //     activa). Este ultimo se añade en S2 Fase 3 (hallazgo propio, no
  //     nombrado en el prompt de sesion): exportCuadernoV5.js:291
  //     (`await wsPlatos.protect('', {...})`) fija proteccion de hoja
  //     realmente, y sin ella el candado por-celda (cell.protection.locked)
  //     no tiene efecto en Excel -- omitirlo del dump dejaba invisible el
  //     mecanismo del que depende TODO el bloqueo por celda. Verificado
  //     empiricamente que ExcelJS lo devuelve al releer (`{sheet:true}`).
  //
  //   FUERA (zona gris declarada, no descubierta):
  //     - fecha de creacion/modificacion del workbook (wb.created/modified)
  //     - formato visual: relleno (GREY_FILL, exportCuadernoV5.js:283-284),
  //       negrita de cabecera (:262), ancho de columna (:299), alineacion/
  //       wrapText de Leyenda (:302), paneles congelados/views (:263)
  //     - metadatos de entrada del zip (causa documentada de la
  //       no-reproducibilidad de bytes, banner del modulo lineas 21-27)
  //     - contraseña de proteccion de hoja (vacia -- '' en :291 -- se lee
  //       el HECHO de que hay proteccion, no la contraseña en si)
  //     - validaciones de datos (dataValidation): NO APLICA. Verificado por
  //       grep ("dataValidation"/"DataValidation" -> cero resultados en
  //       exportCuadernoV5.js) y en vivo sobre el .xlsx generado y releido
  //       (wsPlatos.dataValidations.model === {}, cero celdas con
  //       cell.dataValidation). El banner de buildWorkbook
  //       (exportCuadernoV5.js:243-249) documenta la decision explicita de
  //       NO usar dropdown/data validation (D-028, eslabón 4: "si choca,
  //       solo Leyenda y decláralo explícitamente"). No hay nada que
  //       cubrir porque no hay nada que el generador escriba en ese eje.
  //     - el resto de propiedades que ExcelJS expone pero que el generador
  //       NUNCA fija (barrido exhaustivo, cero resultados): numFmt, border,
  //       hyperlink, note/comment de celda, merge de celdas, height/hidden/
  //       outlineLevel de fila, worksheet.properties, pageSetup. No aplica
  //       por la misma razon que dataValidation -- nunca se escriben.
  async function independentCanonicalDump(xlsxPath) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(xlsxPath);
    const sheets = wb.worksheets.map((ws) => {
      const rowsOut = [];
      ws.eachRow({ includeEmpty: true }, (row) => {
        const cells = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          cells.push({
            value: cell.value,
            type: cell.type,
            locked: cell.protection ? cell.protection.locked ?? null : null,
          });
        });
        rowsOut.push(cells);
      });
      return { name: ws.name, sheetProtected: ws.sheetProtection?.sheet ?? false, rows: rowsOut };
    });
    return JSON.stringify(sheets);
  }

  // Baseline recapturado en S2 Fase 3 (incluye sheetProtected, ausente en
  // el baseline de Fase 1) sobre el mismo generador de HEAD (229a491),
  // con este lector independiente, verificado estable en 2 ciclos
  // generar->escribir->leer->volcar consecutivos (ver informe de PR).
  const BASELINE_SHA256_HEAD = '47969a538e141c94a299595854d35b598ca9ee6674600a4c92d9163272e12436';

  it('sha256 del dump independiente del .xlsx generado coincide con el baseline de HEAD', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exportCuadernoV5-g3-'));
    const tmpXlsx = path.join(tmpDir, 'cuaderno.xlsx');
    try {
      const rows = buildPlatosRows();
      const wb = await buildWorkbook(rows);
      await wb.xlsx.writeFile(tmpXlsx);

      const dump = await independentCanonicalDump(tmpXlsx);
      const hash = createHash('sha256').update(dump).digest('hex');
      expect(hash).toBe(BASELINE_SHA256_HEAD);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('dirty: alterar el bloqueo de una celda de confirmacion cambia el dump independiente (el gate SI ve proteccion/bloqueo de celda)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exportCuadernoV5-g3-dirty-'));
    const tmpXlsxLimpio = path.join(tmpDir, 'limpio.xlsx');
    const tmpXlsxSucio = path.join(tmpDir, 'sucio.xlsx');
    try {
      const rows = buildPlatosRows();
      const wbLimpio = await buildWorkbook(rows);
      await wbLimpio.xlsx.writeFile(tmpXlsxLimpio);

      const wbSucio = await buildWorkbook(rows);
      const wsSucio = wbSucio.getWorksheet('Platos');
      const scaffoldIdx = rows.findIndex((r) => r.fuente === 'scaffold');
      // Desbloquea a mano una celda que el generador dejo bloqueada
      // (lado derivado de lactosa en un scaffold): mismo contenido de
      // valor, distinto bloqueo.
      wsSucio.getRow(scaffoldIdx + 2).getCell('lactosa_valor_actual').protection = { locked: false };
      await wbSucio.xlsx.writeFile(tmpXlsxSucio);

      const hashLimpio = createHash('sha256').update(await independentCanonicalDump(tmpXlsxLimpio)).digest('hex');
      const hashSucio = createHash('sha256').update(await independentCanonicalDump(tmpXlsxSucio)).digest('hex');
      expect(hashLimpio).not.toBe(hashSucio);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('dirty: una hoja SIN proteccion de hoja (protect() nunca invocado) cambia el dump independiente (el gate SI ve proteccion/bloqueo de HOJA)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exportCuadernoV5-g3-dirty-sheetprot-'));
    const tmpXlsxProtegido = path.join(tmpDir, 'protegido.xlsx');
    const tmpXlsxSinProteger = path.join(tmpDir, 'sin-proteger.xlsx');
    try {
      const rows = buildPlatosRows();

      const wbProtegido = await buildWorkbook(rows);
      await wbProtegido.xlsx.writeFile(tmpXlsxProtegido);

      // Workbook equivalente pero SIN llamar a worksheet.protect(): mismo
      // contenido de celda, mismo bloqueo declarado por celda -- la unica
      // diferencia es que la hoja nunca queda realmente protegida.
      const wbSinProteger = new ExcelJS.Workbook();
      const wsSinProteger = wbSinProteger.addWorksheet('Platos');
      wsSinProteger.columns = wbProtegido.getWorksheet('Platos').columns;
      for (const r of rows) wsSinProteger.addRow(r);
      await wbSinProteger.xlsx.writeFile(tmpXlsxSinProteger);

      const hashProtegido = createHash('sha256').update(await independentCanonicalDump(tmpXlsxProtegido)).digest('hex');
      const hashSinProteger = createHash('sha256').update(await independentCanonicalDump(tmpXlsxSinProteger)).digest('hex');
      expect(hashProtegido).not.toBe(hashSinProteger);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
