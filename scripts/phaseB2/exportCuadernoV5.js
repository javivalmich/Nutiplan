// EDITORIAL-D2 (D-028, eslabón 2 de la cadena editorial) — generador
// reproducible del cuaderno de anotación del cocinero, v5. Lee dishes.json
// canónico + la vista de composición de compositionResolver.js (solo
// lectura, sin mutar nada) y produce un cuaderno conforme al contrato de
// D-028: confirmada > derivada > desconocida, asimetría scaffold/freeform
// declarada en el contrato (gluten/lactosa se piden en scaffold, verdura
// se pide en freeform).
//
// PATRÓN ESTRANGULADOR: este archivo reemplaza, para el flujo EDITORIAL,
// a exportCocinero.js -- que NO SE TOCA (diff cero) porque
// importAnotacion.js/runImportAnotacion.js siguen importando de él para
// el flujo de ingesta del v4.xlsx viejo. Cero imports desde
// exportCocinero.js aquí: ni diccionarios de nombres, ni
// PREVIOUS_ANNOTATIONS, ni idKind.js. "nombre" sale ya promovido de
// dishes.json -- no hay generación de nombre en este generador.
//
// DEUDA REGISTRADA: la cadena legacy (exportCocinero.js + importAnotacion.js
// + runImportAnotacion.js + el v4.xlsx) muere en el PR de ingesta, eslabón
// 4 de D-028. Hasta entonces coexiste con este generador sin tocarse.
//
// Reproducibilidad: vía B (dump determinista + sha256), no la vía A
// (hash del binario .xlsx). Verificado en vivo: ExcelJS empaqueta cada
// entrada del zip vía JSZip sin exponer fecha fija por entrada en la API
// pública de workbook.xlsx.writeFile(); dos ejecuciones con contenido
// idéntico y workbook.created/modified fijados producen sha256 de binario
// distintos. La igualdad se verifica sobre el dump de celdas, no el
// fichero.

import ExcelJS from 'exceljs';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { CATALOG_PATH, loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';
import { resolveCatalogComposition } from '../../src/engine2/dishes/compositionResolver.js';
import { loadVerduraVocabulary } from './verduraVocabulary.js';

/** Hash ratificado en D-028 para dishes.json canónico (241 platos: 178 scaffold + 63 freeform). */
export const EXPECTED_CATALOG_SHA256 =
  'a8fe0abb0ff6509dd0a2d9b11ebdc5627674bace395b099bb624ddcc8c2c25c7';

/** Lanzada por verifyCatalogHash cuando dishes.json no coincide con el hash ratificado. */
export class CatalogHashMismatchError extends Error {}

/**
 * Verifica el hash de dishes.json antes de leerlo (D-028, principio de
 * secuencia: "una discrepancia de procedencia no se resuelve adoptando el
 * artefacto"). Lanza CatalogHashMismatchError si difiere.
 * @param {string} [catalogPath]
 * @returns {string} el hash actual (== EXPECTED_CATALOG_SHA256 si no lanzó)
 */
export function verifyCatalogHash(catalogPath = CATALOG_PATH) {
  const raw = fs.readFileSync(catalogPath);
  const actual = createHash('sha256').update(raw).digest('hex');
  if (actual !== EXPECTED_CATALOG_SHA256) {
    throw new CatalogHashMismatchError(
      `dishes.json no coincide con el hash ratificado en D-028: esperado ${EXPECTED_CATALOG_SHA256}, ` +
      `actual ${actual}.`
    );
  }
  return actual;
}

export const COMPOSITION_FIELDS = Object.freeze(['gluten', 'lactosa', 'verdura']);

/**
 * LANZA si un campo de composicion (D-028 §2, contrato del resolver) trae
 * un origen no contemplado (ni derivada, ni confirmada, ni desconocida).
 * D-034 (BP-1→A, BP-2b) negoció S3: 'confirmada' ya es un caso válido de
 * render, con el mismo vocabulario de display que 'derivada' -- la
 * frontera de Fork D.2 no desaparece, se reubica de 'confirmada' a
 * "origen no contemplado" (doctrina D-033/F-SV2→A2, frontera positiva).
 * @param {string} origen
 * @param {string} nombreCampo solo para el mensaje de error
 */
function assertOrigenContemplado(origen, nombreCampo) {
  if (origen !== 'derivada' && origen !== 'confirmada' && origen !== 'desconocida') {
    throw new Error(
      `buildPlatosRows: campo "${nombreCampo}" trae origen="${origen}" no contemplado ` +
      '(D-034: solo derivada, confirmada o desconocida).'
    );
  }
}

// origen_actual del cuaderno (D-028 §4) usa el mismo vocabulario
// derivada/desconocida que D-028 §2 ya usa para estos dos estados --
// 'confirmada' (D-034, BP-1→A) entra por la misma rama que 'derivada':
// vista.containsX.origen se escribe TAL CUAL en *_origen_actual, sin
// traduccion.

function valorActualBooleano(campo) {
  if (campo.origen === 'desconocida') return 'desconocida';
  return campo.valorEfectivo ? 'sí' : 'no';
}

function valorActualVerdura(verdura) {
  if (verdura.origen === 'desconocida') return 'desconocida';
  // Ejes crudos del catálogo (códigos internos, p. ej. "brocoli"), sin
  // diccionario de labels -- D-028 no fija la representación de verdura
  // (sub-contrato futuro); ver Leyenda.
  return verdura.valorEfectivo.length ? verdura.valorEfectivo.join(', ') : 'sin verdura';
}

/**
 * Construye las filas del cuaderno a partir del catálogo y su vista de
 * composición. Orden estable: fila i corresponde a dishes[i] (mismo
 * contrato posicional que loadCatalog()/resolveCatalogComposition()).
 * @param {{dishes?: ReadonlyArray<object>, vistas?: object[]}} [opts]
 *   Overrides para tests; por defecto lee dishes.json canónico vía
 *   loadCatalog() y resuelve su composición vía resolveCatalogComposition().
 * @returns {object[]} filas, cero campos de confirmación rellenados (invariante de custodia)
 */
export function buildPlatosRows(opts = {}) {
  const dishes = opts.dishes ?? loadCatalog();
  const vistas = opts.vistas ?? resolveCatalogComposition(dishes);
  if (dishes.length !== vistas.length) {
    throw new Error(
      `buildPlatosRows: dishes (${dishes.length}) y vistas (${vistas.length}) desalineados.`
    );
  }

  const rows = [];
  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    const vista = vistas[i];
    assertOrigenContemplado(vista.containsGluten.origen, 'gluten');
    assertOrigenContemplado(vista.containsLactosa.origen, 'lactosa');
    assertOrigenContemplado(vista.verdura.origen, 'verdura');
    rows.push({
      n: i + 1,
      nombre: dish.nombre,
      fuente: vista.origen,
      gluten_valor_actual: valorActualBooleano(vista.containsGluten),
      gluten_origen_actual: vista.containsGluten.origen,
      gluten_confirmar_valor: '',
      lactosa_valor_actual: valorActualBooleano(vista.containsLactosa),
      lactosa_origen_actual: vista.containsLactosa.origen,
      lactosa_confirmar_valor: '',
      verdura_valor_actual: valorActualVerdura(vista.verdura),
      verdura_origen_actual: vista.verdura.origen,
      verdura_confirmar_valor: '',
      por: '',
      fecha: '',
    });
  }
  return rows;
}

/**
 * Cuenta, por campo, cuántas filas tienen la celda de confirmación activa
 * (origen_actual === "desconocida"). Conteos esperados sobre el catálogo
 * real (D-028): gluten=178, lactosa=178, verdura=63.
 * @param {object[]} rows
 * @returns {{gluten: number, lactosa: number, verdura: number}}
 */
export function countActiveCells(rows) {
  return {
    gluten: rows.filter((r) => r.gluten_origen_actual === 'desconocida').length,
    lactosa: rows.filter((r) => r.lactosa_origen_actual === 'desconocida').length,
    verdura: rows.filter((r) => r.verdura_origen_actual === 'desconocida').length,
  };
}

/** Conteos esperados sobre dishes.json canónico ratificado en D-028. */
export const EXPECTED_TOTAL_ROWS = 241;
export const EXPECTED_ACTIVE_COUNTS = Object.freeze({ gluten: 178, lactosa: 178, verdura: 63 });

/**
 * Dump determinista de las filas para verificar reproducibilidad (vía B:
 * contenido de celdas, no el binario .xlsx -- ver banner del módulo).
 * @param {object[]} rows
 * @returns {string}
 */
export function dumpRows(rows) {
  return JSON.stringify(rows);
}

/**
 * sha256 del dump determinista de filas.
 * @param {object[]} rows
 * @returns {string}
 */
export function hashRows(rows) {
  return createHash('sha256').update(dumpRows(rows)).digest('hex');
}

/**
 * El almacén lateral de confirmaciones nace vacío-versionado (invariante
 * de custodia D-028: ningún pre-relleno nace confirmado).
 * @returns {{version: number, confirmed: object}}
 */
export function buildEmptyConfirmationsLateral() {
  return { version: 1, confirmed: {} };
}

const FIELD_LABELS = Object.freeze({ gluten: 'Gluten', lactosa: 'Lactosa', verdura: 'Verdura' });
const GREY_FILL = Object.freeze({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } });

export const META_SHEET_NAME = 'Meta';
export const META_HASH_KEY = 'sha256_dishes_json';

/**
 * Construye el texto de la Leyenda, interpolando los ejes canónicos de
 * verdura desde el vocabulario cerrado (fuente única -- ningún listado
 * duplicado a mano que pueda driftear del archivo real).
 * @param {ReadonlyArray<string>} ejesVerdura
 * @returns {string}
 */
function buildLeyendaText(ejesVerdura) {
  return `CÓMO ANOTAR — cuaderno v5 (D-028)

INVARIANTE DE CUSTODIA: lo que no marques en una columna "confirmar" NO entra al motor. Una fila con las celdas de confirmación vacías se queda en su valor derivado (o "desconocida" si no hay derivación) tal cual está hoy -- no se pierde nada por dejarla en blanco, y nada se activa hasta que tú lo confirmes.

Por cada campo (Gluten, Lactosa, Verdura) hay tres columnas:
• valor actual — lo que el catálogo sabe hoy: "desconocida" si no hay derivación, o el valor derivado si lo hay.
• origen actual — "derivada" (el motor lo calculó) o "desconocida" (nadie lo sabe todavía).
• confirmar — tu columna. Rellénala SOLO donde "origen actual"="desconocida" (esas celdas están desbloqueadas). En las celdas del lado ya derivado (relleno gris) no hace falta que hagas nada.

ASIMETRÍA (por qué unos campos se piden y otros no):
• Gluten y Lactosa se piden en platos de fuente "scaffold" (no se conocen). En "freeform" ya vienen calculados -- no los toques.
• Verdura se pide en platos de fuente "freeform" (no se conoce). En "scaffold" ya viene calculada -- no la toques.

EXCEPCIÓN POR INICIATIVA: si ves un valor derivado (celda gris) que crees que está mal, puedes corregirlo aunque no te lo pidamos: Revisión > Desproteger hoja (no tiene contraseña, no hace falta pedir nada a nadie) y rellena esa celda de confirmación también. Es una excepción, no la norma: por defecto esas celdas quedan bloqueadas para que quede claro qué se pide y qué no.

VERDURA — códigos internos: la columna "valor actual" de Verdura muestra los ejes tal como los usa el catálogo por dentro (p. ej. "brocoli", "zanahoria"), sin traducir a nombres bonitos. No es un error ni un dato roto -- la forma final de representar verdura es un sub-contrato futuro de D-028, todavía no decidido. "(ninguna)" significa que ese plato no tiene verdura derivada, no que falte un dato.

Verdura (confirmación):
- Deja la celda en blanco si no has revisado ese plato.
- Escribe uno o varios códigos separados por comas si confirmas las verduras.
- Si confirmas que el plato no lleva ninguna verdura, escribe exactamente «vacío» o «[]». No dejes la celda en blanco para indicar "sin verdura".

Códigos válidos -- lista cerrada de ${ejesVerdura.length} ejes (cualquier otro código se rechaza):
${ejesVerdura.join(', ')}.

VERDURA — qué cuenta y qué no: No cuentan como verdura del plato: aceitunas (condimento), pepinillos (encurtido), chile/guindilla (picante). El maíz cuenta como verdura solo cuando es grano dulce (ensalada, salteado); NO cuando es tortilla o harina de maíz. Edamame y setas SÍ cuentan.

por / fecha — una vez por fila: quién confirmó y cuándo, para la fila entera (no hace falta repetir por cada campo). fecha es la fecha de tu confirmación; si la dejas vacía, se registrará la fecha de ingesta.

DEUDA REGISTRADA: la cadena vieja (exportCocinero.js + importAnotacion.js + el v4.xlsx) sigue viva para su propio flujo y no se toca en este PR; muere en el PR de ingesta (eslabón 4 de D-028). Este cuaderno v5 es un flujo aparte, no sustituye a esa cadena todavía.`;
}

/**
 * Columnas de la hoja "Platos", en orden. Fuente única compartida con la
 * ingesta (importCuadernoV5.js) para el contrato estructural -- ningún
 * literal de cabecera duplicado a mano que pueda driftear del generador
 * real.
 * @returns {{header: string, key: string, width: number}[]}
 */
export function buildPlatosColumns() {
  const columns = [
    { header: 'Nº', key: 'n', width: 6 },
    { header: 'nombre', key: 'nombre', width: 46 },
    { header: 'fuente', key: 'fuente', width: 10 },
  ];
  for (const field of COMPOSITION_FIELDS) {
    columns.push(
      { header: `${FIELD_LABELS[field]} · valor actual`, key: `${field}_valor_actual`, width: 20 },
      { header: `${FIELD_LABELS[field]} · origen actual`, key: `${field}_origen_actual`, width: 16 },
      { header: `${FIELD_LABELS[field]} · confirmar`, key: `${field}_confirmar_valor`, width: 16 }
    );
  }
  columns.push({ header: 'por', key: 'por', width: 16 }, { header: 'fecha', key: 'fecha', width: 14 });
  return columns;
}

/**
 * Construye el workbook ExcelJS del cuaderno v5 (hojas "Platos" + "Meta" +
 * "Leyenda"). NOTA sobre validación de datos: se evaluó un dropdown de
 * ExcelJS para las celdas activas de verdura contra los 32 ejes, pero
 * "list" data validation de Excel es de selección ÚNICA -- no encaja con
 * el formato real de la celda (varios ejes separados por coma, más el
 * sentinela "vacío"/"[]" para "confirmado: sin verdura", C7). Forzarlo
 * sugeriría al cocinero un selector de un solo valor que no es el
 * contrato real. Se documenta solo en la Leyenda, sin dropdown (D-028,
 * eslabón 4: "si choca, solo Leyenda y decláralo explícitamente").
 * @param {object[]} rows salida de buildPlatosRows()
 * @param {{catalogSha256?: string}} [opts] catalogSha256 para la hoja Meta (por defecto, el hash ratificado en D-028)
 * @returns {Promise<ExcelJS.Workbook>}
 */
export async function buildWorkbook(rows, opts = {}) {
  const catalogSha256 = opts.catalogSha256 ?? EXPECTED_CATALOG_SHA256;
  const wb = new ExcelJS.Workbook();
  const wsPlatos = wb.addWorksheet('Platos');

  const columns = buildPlatosColumns();
  wsPlatos.columns = columns;
  wsPlatos.getRow(1).font = { bold: true };
  wsPlatos.views = [{ state: 'frozen', ySplit: 1 }];

  for (const r of rows) wsPlatos.addRow(r);

  // Asimetría estructural (lectura B, D-028 enmendada; BP-2b D-034):
  // confirmar_valor desbloqueado cuando origen_actual !== 'derivada'
  // (desconocida Y confirmada activas). Solo el lado derivado firme queda
  // bloqueado + gris; la excepción por iniciativa se documenta en la
  // Leyenda como desprotección manual, no como celda desbloqueada por
  // defecto -- así la asimetría es discriminable por test.
  for (let i = 0; i < rows.length; i++) {
    const excelRow = wsPlatos.getRow(i + 2); // +1 cabecera, +1 base-1
    for (const field of COMPOSITION_FIELDS) {
      const activo = excelRow.getCell(`${field}_origen_actual`).value !== 'derivada';
      const valorCell = excelRow.getCell(`${field}_valor_actual`);
      const confirmCell = excelRow.getCell(`${field}_confirmar_valor`);
      valorCell.protection = { locked: true };
      if (activo) {
        confirmCell.protection = { locked: false };
      } else {
        confirmCell.protection = { locked: true };
        confirmCell.fill = GREY_FILL;
        valorCell.fill = GREY_FILL;
      }
    }
    excelRow.getCell('por').protection = { locked: false };
    excelRow.getCell('fecha').protection = { locked: false };
  }

  await wsPlatos.protect('', { selectLockedCells: true, selectUnlockedCells: true });

  const wsMeta = wb.addWorksheet(META_SHEET_NAME);
  wsMeta.addRow(['clave', 'valor']);
  wsMeta.addRow([META_HASH_KEY, catalogSha256]);

  const { ejes } = loadVerduraVocabulary();
  const wsLeyenda = wb.addWorksheet('Leyenda');
  wsLeyenda.getColumn(1).width = 110;
  buildLeyendaText(ejes).split('\n').forEach((line) => {
    const row = wsLeyenda.addRow([line]);
    row.getCell(1).alignment = { wrapText: true };
  });

  return wb;
}
