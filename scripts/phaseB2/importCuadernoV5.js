// EDITORIAL-D3 (D-028, eslabón 4 de la cadena editorial) — ingesta del
// cuaderno v5 anotado por el cocinero hacia el almacén lateral de
// confirmaciones (dishCompositionConfirmations.json). Pura: recibe un
// workbook de ExcelJS ya cargado y el catálogo/vocabulario ya parseados;
// el I/O (leer el xlsx, leer/escribir el lateral y el acta) vive en
// runImportCuadernoV5.js.
//
// CONTRATO ESTRUCTURAL: hojas "Platos" + "Meta" y columnas exactamente
// las que exportCuadernoV5.js genera (buildPlatosColumns() es la fuente
// única compartida) -- hoja ausente/renombrada o columnas reordenadas se
// rechazan con causa, nunca se adaptan (D-028, eslabón 4).
//
// MAPEO fila->dishId: posicional vía columna Nº contra loadCatalog()[n-1]
// (mismo contrato posicional que el generador), con chequeo de integridad
// extra (nombre y fuente de la fila deben coincidir con el plato en esa
// posición) como defensa contra celdas editadas a mano.
//
// CUSTODIA (invariante editorial D-028): solo entra al lateral una
// confirmación con confirmar_valor no vacío Y "por" no vacío. Ninguna
// heurística, ningún pre-relleno, cruza a la capa confirmada.
//
// ATOMICIDAD: esta función es pura y solo devuelve {lateral, report} si
// TODAS las filas son válidas: cualquier fallo lanza antes de devolver
// nada, así que el runner (el único que escribe a disco) nunca llega a
// escribir sobre un resultado parcial.

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { CATALOG_PATH, loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';
import { resolveCatalogComposition } from '../../src/engine2/dishes/compositionResolver.js';
import { buildPlatosColumns, COMPOSITION_FIELDS, META_SHEET_NAME, META_HASH_KEY } from './exportCuadernoV5.js';
import { loadVerduraVocabulary } from './verduraVocabulary.js';

export const PLATOS_SHEET_NAME = 'Platos';

/** Hoja ausente/renombrada o columnas reordenadas frente al contrato del generador. */
export class StructuralContractError extends Error {}
/** El hash portado en la hoja Meta no coincide con el sha256 actual de dishes.json. */
export class CatalogMismatchError extends Error {}
/** Nº fuera de rango/duplicado, o nombre/fuente de fila != dishes[n-1] (mapeo posicional roto). */
export class IntegrityError extends Error {}
/** confirmar_valor relleno con "por" vacío (invariante de custodia D-028). */
export class CustodyError extends Error {}
/** Valor de gluten/lactosa fuera de {sí, no}. */
export class CompositionTypeError extends Error {}
/** Código de verdura fuera del vocabulario cerrado, o vacío sin usar el sentinela. */
export class VerduraVocabularyError extends Error {}
/** El lateral ya tiene confirmaciones -- política single-write (D-028, eslabón 4). */
export class SingleWriteError extends Error {}

/**
 * Extrae texto plano de una celda de ExcelJS. Un Date (posible si Excel
 * auto-formatea una fecha tecleada a mano) se normaliza a "YYYY-MM-DD".
 * @param {*} value
 * @returns {string}
 */
function cellText(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    return value.text ?? value.richText?.map((r) => r.text).join('') ?? value.result ?? String(value);
  }
  return String(value).trim();
}

/**
 * Verifica el contrato estructural (C.f. banner del módulo): hojas
 * "Platos" + "Meta" presentes, cabecera de "Platos" idéntica y en el
 * mismo orden que buildPlatosColumns().
 * @param {import('exceljs').Workbook} workbook
 * @returns {{wsPlatos: object, wsMeta: object}}
 */
export function assertStructuralContract(workbook) {
  const wsPlatos = workbook.getWorksheet(PLATOS_SHEET_NAME);
  if (!wsPlatos) {
    throw new StructuralContractError(`Hoja "${PLATOS_SHEET_NAME}" no encontrada en el workbook.`);
  }
  const wsMeta = workbook.getWorksheet(META_SHEET_NAME);
  if (!wsMeta) {
    throw new StructuralContractError(`Hoja "${META_SHEET_NAME}" no encontrada en el workbook.`);
  }

  const expectedHeaders = buildPlatosColumns().map((c) => c.header);
  const actualHeaders = (wsPlatos.getRow(1).values ?? []).slice(1);
  const coincide =
    actualHeaders.length === expectedHeaders.length &&
    expectedHeaders.every((h, i) => actualHeaders[i] === h);
  if (!coincide) {
    throw new StructuralContractError(
      `Cabeceras de "${PLATOS_SHEET_NAME}" no coinciden con el contrato del generador (hoja renombrada, ` +
      `columnas reordenadas, o ausentes).\nesperado: ${JSON.stringify(expectedHeaders)}\n` +
      `actual:   ${JSON.stringify(actualHeaders)}`
    );
  }

  return { wsPlatos, wsMeta };
}

/**
 * Lee el hash portado de la hoja Meta (cabecera ["clave","valor"] +
 * fila ["sha256_dishes_json", <hash>]), validado por celda exacta.
 * @param {object} wsMeta
 * @returns {string}
 */
export function readMetaHash(wsMeta) {
  const row1 = (wsMeta.getRow(1).values ?? []).slice(1);
  const row2 = (wsMeta.getRow(2).values ?? []).slice(1);
  if (row1[0] !== 'clave' || row1[1] !== 'valor') {
    throw new StructuralContractError(`Hoja "${META_SHEET_NAME}" no tiene la cabecera esperada ["clave","valor"].`);
  }
  if (row2[0] !== META_HASH_KEY) {
    throw new StructuralContractError(`Hoja "${META_SHEET_NAME}" no tiene la fila "${META_HASH_KEY}" en A2.`);
  }
  return row2[1];
}

/**
 * Vuelca la hoja "Platos" a objetos planos, uno por fila, con las mismas
 * claves que buildPlatosColumns() (asume contrato estructural ya
 * verificado -- lee por posición, no por cabecera).
 * @param {object} wsPlatos
 * @returns {object[]}
 */
export function readPlatosRows(wsPlatos) {
  const keys = buildPlatosColumns().map((c) => c.key);
  const rows = [];
  wsPlatos.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = (row.values ?? []).slice(1);
    const obj = {};
    keys.forEach((k, i) => { obj[k] = cellText(raw[i]); });
    rows.push(obj);
  });
  return rows;
}

const VERDURA_EMPTY_SENTINELS = new Set(['[]', 'vacio', 'vacío']);

/**
 * "sí"/"no" (con o sin tilde, case-insensitive) -> boolean. Cualquier
 * otro valor lanza CompositionTypeError.
 * @param {string} campo
 * @param {string} raw
 * @param {number} n
 * @returns {boolean}
 */
function parseBooleanValue(campo, raw, n) {
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'si' || normalized === 'sí') return true;
  if (normalized === 'no') return false;
  throw new CompositionTypeError(`Fila Nº=${n}: valor de "${campo}" inválido ("${raw}"); se esperaba sí/no.`);
}

/**
 * Lista de códigos separados por coma, validada contra el vocabulario
 * cerrado (C7). El sentinela "vacío"/"[]" (case-insensitive) representa
 * "confirmado: sin verdura" -- [] distinguible de ausencia de campo.
 * @param {string} raw
 * @param {{ejesSet: ReadonlySet<string>}} vocabulary
 * @param {number} n
 * @returns {string[]}
 */
function parseVerduraValue(raw, vocabulary, n) {
  const normalized = raw.trim().toLowerCase();
  if (VERDURA_EMPTY_SENTINELS.has(normalized)) return [];

  const codigos = normalized.split(',').map((c) => c.trim()).filter((c) => c.length > 0);
  if (codigos.length === 0) {
    throw new VerduraVocabularyError(
      `Fila Nº=${n}: verdura confirmada vacía sin usar el sentinela "vacío"/"[]" (C7).`
    );
  }
  const desconocidos = codigos.filter((c) => !vocabulary.ejesSet.has(c));
  if (desconocidos.length > 0) {
    throw new VerduraVocabularyError(
      `Fila Nº=${n}: código(s) de verdura fuera del vocabulario cerrado: ${desconocidos.join(', ')}.`
    );
  }
  return codigos;
}

function parseCompositionValue(campo, raw, vocabulary, n) {
  return campo === 'verdura' ? parseVerduraValue(raw, vocabulary, n) : parseBooleanValue(campo, raw, n);
}

/**
 * Construye el resultado de la ingesta (lateral + acta) a partir de un
 * workbook ya cargado y el catálogo/vocabulario ya resueltos. Pura: no
 * hace I/O, no escribe nada -- ver banner del módulo (atomicidad).
 *
 * @param {import('exceljs').Workbook} workbook
 * @param {object} [opts]
 * @param {string} [opts.catalogPath] ruta de dishes.json contra la que se verifica el hash portado
 * @param {ReadonlyArray<object>} [opts.dishes] por defecto loadCatalog(catalogPath)
 * @param {object[]} [opts.vistas] por defecto resolveCatalogComposition(dishes)
 * @param {{ejesSet: ReadonlySet<string>}} [opts.vocabulary] por defecto loadVerduraVocabulary()
 * @param {{version: number, confirmed: object}} [opts.existingLateral] lateral ya presente en disco (o undefined/vacío)
 * @param {() => string} [opts.now] inyectable para tests deterministas
 * @param {string} [opts.cuadernoSha256] sha256 del binario xlsx (para el acta; el runner lo calcula)
 * @returns {{lateral: {version: number, confirmed: object}, report: object}}
 */
export function buildIngestResult(workbook, opts = {}) {
  const catalogPath = opts.catalogPath ?? CATALOG_PATH;
  const dishes = opts.dishes ?? loadCatalog(catalogPath);
  const vistas = opts.vistas ?? resolveCatalogComposition(dishes);
  const vocabulary = opts.vocabulary ?? loadVerduraVocabulary();
  const existingLateral = opts.existingLateral;
  const now = opts.now ?? (() => new Date().toISOString().slice(0, 10));

  if (dishes.length !== vistas.length) {
    throw new Error(`buildIngestResult: dishes (${dishes.length}) y vistas (${vistas.length}) desalineados.`);
  }

  const lateralYaPoblado = existingLateral && Object.keys(existingLateral.confirmed ?? {}).length > 0;
  if (lateralYaPoblado) {
    throw new SingleWriteError(
      'El almacén lateral ya tiene confirmaciones -- política single-write: no se re-ingiere sobre un lateral poblado.'
    );
  }

  const { wsPlatos, wsMeta } = assertStructuralContract(workbook);

  const cuadernoHash = readMetaHash(wsMeta);
  const catalogSha256Actual = computeCatalogSha256(catalogPath);
  if (cuadernoHash !== catalogSha256Actual) {
    throw new CatalogMismatchError(
      `El hash portado en el cuaderno (${cuadernoHash}) no coincide con el sha256 actual de dishes.json ` +
      `(${catalogSha256Actual}). El cuaderno fue generado sobre un catálogo distinto -- no se ingiere ` +
      '(D-028, principio de secuencia).'
    );
  }

  const xlsxRows = readPlatosRows(wsPlatos);
  if (xlsxRows.length !== dishes.length) {
    throw new IntegrityError(
      `Filas del cuaderno (${xlsxRows.length}) != dishes.json (${dishes.length}) -- mapeo posicional inestable.`
    );
  }

  const fechaIngestaValue = now();
  const seenN = new Set();
  const perDishIndex = new Map();
  const estampadas = [];
  const conteos = { gluten: 0, lactosa: 0, verdura: 0 };

  for (const xr of xlsxRows) {
    const n = Number(xr.n);
    if (!Number.isInteger(n) || n < 1 || n > dishes.length) {
      throw new IntegrityError(`Nº inválido o fuera de rango en el cuaderno: "${xr.n}".`);
    }
    if (seenN.has(n)) {
      throw new IntegrityError(`Nº duplicado en el cuaderno: ${n} (mapeo posicional inestable).`);
    }
    seenN.add(n);

    const dish = dishes[n - 1];
    const vista = vistas[n - 1];

    if (xr.nombre !== dish.nombre) {
      throw new IntegrityError(
        `Fila Nº=${n}: nombre del cuaderno ("${xr.nombre}") != dishes[${n - 1}].nombre ("${dish.nombre}").`
      );
    }
    if (xr.fuente !== vista.origen) {
      throw new IntegrityError(
        `Fila Nº=${n}: fuente del cuaderno ("${xr.fuente}") != origen resuelto ("${vista.origen}").`
      );
    }

    const confirmaciones = COMPOSITION_FIELDS.filter((f) => xr[`${f}_confirmar_valor`] !== '');
    if (confirmaciones.length > 0 && xr.por === '') {
      throw new CustodyError(
        `Fila Nº=${n}: hay confirmar_valor relleno pero "por" está vacío (invariante de custodia D-028).`
      );
    }
    if (confirmaciones.length === 0) continue;

    const fechaStamped = xr.fecha === '';
    const fecha = fechaStamped ? fechaIngestaValue : xr.fecha;

    const campos = {};
    for (const campo of confirmaciones) {
      const valor = parseCompositionValue(campo, xr[`${campo}_confirmar_valor`], vocabulary, n);
      campos[campo] = { valor, por: xr.por, fecha };
      conteos[campo] += 1;
      if (fechaStamped) estampadas.push(`${dish.id}:${campo}`);
    }
    perDishIndex.set(n - 1, { dishId: dish.id, campos });
  }

  // Orden determinista por índice de catálogo (punto 9), no por orden
  // físico de lectura (C10): las claves del objeto "confirmed" se
  // insertan recorriendo dishes en orden 0..N-1.
  const confirmed = {};
  for (let i = 0; i < dishes.length; i++) {
    const entry = perDishIndex.get(i);
    if (entry) confirmed[entry.dishId] = entry.campos;
  }

  const lateral = { version: 1, confirmed };
  const report = {
    fechaIngesta: fechaIngestaValue,
    sha256Cuaderno: opts.cuadernoSha256 ?? null,
    sha256Catalogo: catalogSha256Actual,
    conteos,
    estampadas,
  };

  return { lateral, report };
}

/**
 * sha256 del contenido actual de dishes.json (no del hash ratificado en
 * D-028 -- el invariante de esta ingesta es "mismo catálogo que en la
 * generación", no un hash fijo cableado).
 * @param {string} [catalogPath]
 * @returns {string}
 */
export function computeCatalogSha256(catalogPath = CATALOG_PATH) {
  const raw = fs.readFileSync(catalogPath);
  return createHash('sha256').update(raw).digest('hex');
}
