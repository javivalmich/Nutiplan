// Utilidad (no es paso de Fase 2 nuevo) — exporta una hoja de anotacion
// para un colaborador externo (cocinero/nutricionista) que no toca repo
// ni terminal. Vive en scripts/ (fuera de engine2/). READ-ONLY sobre el
// dato: lee dishes.scaffold.json, no lo modifica, no toca el Dish, no
// toca promote.js ni generateScaffold.js.
//
// DECISION DE LIBRERIA (verificada empiricamente, no asumida): el
// paquete "xlsx" (SheetJS Community, unica version publicada en npm,
// 0.18.5) NO escribe data validation (dropdowns) — probado escribiendo
// ws['!dataValidation'] y releyendo el archivo: el campo no sobrevive el
// ciclo. Sustituido por "exceljs" (si soporta dataValidation nativo,
// verificado con el mismo round-trip). Acordado con Javi.
//
// El nombre sugerido REUTILIZA deriveTituloSugerido de annotate.js (no
// se reimplementa: divergeria de lo que el anotador de terminal le
// mostraria a Javi).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { deriveTituloSugerido, EDITORIAL_FIELDS } from './annotate.js';
import { discoverMealSnapshots, extractLegacyMeals, buildFrequencyRanking } from '../phaseB1/frequencyCount.js';
import { comboIdentityKey } from '../../src/engine2/dishes/identity.js';
import { ROLES, LEFTOVER_QUALITIES, ENERGIA_COCINA_NIVELES } from '../../src/engine2/dishes/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../..');
export const SCAFFOLD_PATH = path.join(__dirname, 'output', 'dishes.scaffold.json');
export const OUTPUT_XLSX_PATH = path.join(__dirname, 'output', 'dishes.anotacion.xlsx');

const EDITORIAL_FIELDS_SIN_NOMBRE = EDITORIAL_FIELDS.filter((f) => f !== 'nombre');

/**
 * Campos editoriales (sin nombre) que CP2 fijo de verdad para un dish.
 * "ya anotado" = sí si los 5 (rol/batchable/leftoverQuality/
 * shelfLifeDays/energiaCocina) NO son "TODO". El nombre se trata aparte
 * (siempre lleva sugerencia editable, nunca decide "ya anotado").
 * @param {object} dish
 * @returns {boolean}
 */
export function estaPreAnotado(dish) {
  return EDITORIAL_FIELDS_SIN_NOMBRE.every((f) => dish[f] !== 'TODO');
}

/**
 * Calcula la frecuencia de servicio real (Fase 2 / Paso B.1) por
 * identityKey, reutilizando el descubrimiento de snapshots y el ranking
 * ya construidos en scripts/phaseB1/frequencyCount.js — NO se reinventa
 * un ranking nuevo.
 * @param {string} srcRoot ruta a app-comida/src
 * @returns {Map<string, number>} identityKey -> nº apariciones (solo claves con >=1)
 */
export function computeFrequencyMap(srcRoot) {
  const { relevant } = discoverMealSnapshots(srcRoot);
  const legacyMeals = extractLegacyMeals(relevant);
  const ranking = buildFrequencyRanking(legacyMeals, comboIdentityKey);
  return new Map(ranking.map((r) => [r.identityKey, r.count]));
}

/**
 * Ordena los dishes por frecuencia de servicio descendente (Paso B.1).
 * Los nunca servidos (frecuencia 0, ausentes del ranking) van al final.
 * Desempate: orden lexicografico estricto de identityKey (mismo criterio
 * que buildFrequencyRanking, extendido de forma uniforme a los de
 * frecuencia 0 para que el orden sea reproducible).
 * @param {object[]} dishes
 * @param {Map<string, number>} frequencyMap
 * @returns {object[]} copia ordenada (no muta la entrada)
 */
export function sortDishesByFrequency(dishes, frequencyMap) {
  return [...dishes].sort((a, b) => {
    const countA = frequencyMap.get(a.id) || 0;
    const countB = frequencyMap.get(b.id) || 0;
    if (countB !== countA) return countB - countA;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function batchableDisplay(value) {
  if (value === true) return 'si';
  if (value === false) return 'no';
  return value; // "TODO"
}

/**
 * Construye las filas de la hoja "Platos" a partir de los dishes YA
 * ordenados. Pura: no lee disco, no escribe nada.
 * @param {object[]} dishesOrdenados
 * @returns {object[]} filas con las claves exactas de las columnas pedidas
 */
export function buildRows(dishesOrdenados) {
  return dishesOrdenados.map((dish, i) => ({
    numero: i + 1,
    identityKey: dish.id,
    nombreSugerido: deriveTituloSugerido(dish).titulo,
    momento: dish.momento.join(' + '),
    plateType: dish.plateType,
    rol: dish.rol,
    batchable: batchableDisplay(dish.batchable),
    leftoverQuality: dish.leftoverQuality,
    shelfLifeDays: dish.shelfLifeDays,
    energiaCocina: dish.energiaCocina,
    yaAnotado: estaPreAnotado(dish) ? 'sí' : 'no',
  }));
}

const COLUMN_HEADERS = [
  'Nº', 'Nombre sugerido', 'momento', 'plateType', 'rol', 'batchable',
  'leftoverQuality', 'shelfLifeDays', 'energiaCocina', 'ya anotado',
];

const ANCLA_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

/**
 * Escribe el .xlsx con 2 pestañas ("Leyenda", "Platos"). Dropdowns reales
 * (data validation) en rol/batchable/leftoverQuality/energiaCocina
 * (enum leido de schema.js, no hardcodeado salvo batchable que no tiene
 * enum en el esquema) y shelfLifeDays (entero 1-7). Filas "ya anotado"
 * sombreadas.
 * @param {string} outputPath
 * @param {object[]} rows
 * @param {string} leyendaTexto
 * @returns {Promise<void>}
 */
export async function writeWorkbook(outputPath, rows, leyendaTexto) {
  const wb = new ExcelJS.Workbook();

  const leyenda = wb.addWorksheet('Leyenda');
  leyenda.getColumn(1).width = 100;
  for (const linea of leyendaTexto.split('\n')) {
    leyenda.addRow([linea]);
  }

  const platos = wb.addWorksheet('Platos');
  platos.addRow(COLUMN_HEADERS);
  platos.getRow(1).font = { bold: true };
  platos.columns = [
    { width: 6 }, { width: 40 }, { width: 14 }, { width: 16 }, { width: 12 },
    { width: 10 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 12 },
  ];

  for (const row of rows) {
    platos.addRow([
      row.numero, row.nombreSugerido, row.momento, row.plateType, row.rol,
      row.batchable, row.leftoverQuality, row.shelfLifeDays, row.energiaCocina, row.yaAnotado,
    ]);
    const excelRowIndex = row.numero + 1; // +1 por la fila de cabecera
    const excelRow = platos.getRow(excelRowIndex);

    platos.getCell(`E${excelRowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`"${ROLES.join(',')}"`] };
    platos.getCell(`F${excelRowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"si,no"'] };
    platos.getCell(`G${excelRowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`"${LEFTOVER_QUALITIES.join(',')}"`] };
    platos.getCell(`H${excelRowIndex}`).dataValidation = { type: 'whole', operator: 'between', allowBlank: true, formulae: [1, 7] };
    platos.getCell(`I${excelRowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`"${ENERGIA_COCINA_NIVELES.join(',')}"`] };

    if (row.yaAnotado === 'sí') {
      excelRow.eachCell((cell) => { cell.fill = ANCLA_FILL; });
    }
  }

  await wb.xlsx.writeFile(outputPath);
}

/**
 * Orquesta todo el flujo (lectura -> orden -> filas -> escritura). NO
 * modifica dishes.scaffold.json.
 * @param {{ scaffoldPath?: string, outputPath?: string, leyendaTexto: string, srcRoot?: string }} opts
 * @returns {Promise<{ outputPath: string, nFilas: number, nPreAnotados: number }>}
 */
export async function exportSheet(opts) {
  const scaffoldPath = opts.scaffoldPath ?? SCAFFOLD_PATH;
  const outputPath = opts.outputPath ?? OUTPUT_XLSX_PATH;
  const srcRoot = opts.srcRoot ?? path.join(REPO_ROOT, 'src');

  const dishes = JSON.parse(fs.readFileSync(scaffoldPath, 'utf-8'));
  const frequencyMap = computeFrequencyMap(srcRoot);
  const ordenados = sortDishesByFrequency(dishes, frequencyMap);
  const rows = buildRows(ordenados);

  await writeWorkbook(outputPath, rows, opts.leyendaTexto);

  return {
    outputPath,
    nFilas: rows.length,
    nPreAnotados: rows.filter((r) => r.yaAnotado === 'sí').length,
  };
}
