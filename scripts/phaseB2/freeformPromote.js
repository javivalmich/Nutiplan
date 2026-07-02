// Fase 2, Paso C — promotor de FREEFORM_COMBOS.js -> dishes.json. Vive en
// scripts/ (fuera de engine2/). Pura: no lee/escribe disco (eso lo hace
// runFreeformPromote.js); recibe filas de xlsx ya leidas y FREEFORM_COMBOS
// ya importado.
//
// JOIN por titulo normalizado (minusculas + NFD sin diacriticos + sin
// puntuacion + espacios colapsados) <-> identity.title. NO fuzzy matching:
// exige exactamente 1 match por combo, exactamente 1 consumo por fila
// xlsx. Cualquier ambiguo/sin-match/duplicado -> lanza (FALLAR DURO, ver
// CLAUDE.md Decision D).
//
// Excluye bol_fruta_yogur explicitamente (Decision A: momento={comida,cena}
// no admite el slot legacy "Al") — queda registrado como exclusion
// documentada, no se descarta en silencio.

import { resolveFreeformPlateType } from './freeformEditorial.js';
import { deriveTempFeelFreeform, deriveMomentoFreeform } from '../../src/engine2/dishes/deriveFreeform.js';
import { validateDish } from '../../src/engine2/dishes/schema.js';
import { parseShelfLifeDays, parseBatchable } from './importAnotacion.js';

export const EXCLUDED_FREEFORM_IDS = Object.freeze([
  { id: 'bol_fruta_yogur', causa: 'momento={comida,cena} no admite el slot legacy "Al" (Decision A)' },
]);

const EXCLUDED_ID_SET = new Set(EXCLUDED_FREEFORM_IDS.map((e) => e.id));

export const FIELDS_TO_PROMOTE = Object.freeze([
  'rol', 'batchable', 'leftoverQuality', 'shelfLifeDays', 'energiaCocina',
]);

/**
 * minusculas + NFD sin diacriticos + sin puntuacion + espacios colapsados.
 * @param {string} s
 * @returns {string}
 */
export function normalizeTitle(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Empareja las filas xlsx fuente=freeform con FREEFORM_COMBOS por titulo
 * normalizado. Lanza (FALLAR DURO) ante cualquier ambiguo, sin-match, o
 * fila del xlsx no consumida exactamente una vez.
 * @param {object[]} xlsxRows filas crudas de readPlatosRows (todas las fuentes)
 * @param {object[]} combos FREEFORM_COMBOS
 * @returns {Map<string, object>} identity.id -> fila xlsx emparejada
 */
export function joinFreeformXlsx(xlsxRows, combos) {
  const freeformRows = xlsxRows.filter((r) => r.fuente === 'freeform');

  const rowsByNormTitle = new Map(); // normTitle -> fila[]
  for (const row of freeformRows) {
    const key = normalizeTitle(row.nombre);
    if (!rowsByNormTitle.has(key)) rowsByNormTitle.set(key, []);
    rowsByNormTitle.get(key).push(row);
  }

  const ambiguosXlsx = [...rowsByNormTitle.entries()].filter(([, rows]) => rows.length > 1);
  if (ambiguosXlsx.length > 0) {
    throw new Error(
      `joinFreeformXlsx: ${ambiguosXlsx.length} titulo(s) normalizado(s) con >1 fila xlsx: ` +
      JSON.stringify(ambiguosXlsx.map(([key, rows]) => ({ key, n: rows.map((r) => r.n) })))
    );
  }

  const joined = new Map();
  const sinMatch = [];
  const consumedKeys = new Set();

  for (const combo of combos) {
    const key = normalizeTitle(combo.identity.title);
    const rows = rowsByNormTitle.get(key);
    if (!rows) {
      sinMatch.push({ id: combo.identity.id, title: combo.identity.title });
      continue;
    }
    joined.set(combo.identity.id, rows[0]);
    consumedKeys.add(key);
  }

  if (sinMatch.length > 0) {
    throw new Error(`joinFreeformXlsx: ${sinMatch.length} combo(s) freeform sin fila xlsx: ${JSON.stringify(sinMatch)}`);
  }

  const noConsumidas = [...rowsByNormTitle.keys()].filter((k) => !consumedKeys.has(k));
  if (noConsumidas.length > 0) {
    throw new Error(`joinFreeformXlsx: ${noConsumidas.length} fila(s) xlsx freeform no consumidas por ningun combo: ${JSON.stringify(noConsumidas)}`);
  }

  if (joined.size !== combos.length || rowsByNormTitle.size !== freeformRows.length) {
    throw new Error(
      `joinFreeformXlsx: tripwire de cobertura fallido (joined=${joined.size}, combos=${combos.length}, ` +
      `xlsxDistinct=${rowsByNormTitle.size}, xlsxRows=${freeformRows.length}).`
    );
  }

  return joined;
}

/**
 * Construye los Dish promovibles a partir de FREEFORM_COMBOS + el join con
 * el xlsx. Excluye bol_fruta_yogur (Decision A). Cada Dish resultante pasa
 * validateDish antes de aceptarse.
 * @param {object[]} combos FREEFORM_COMBOS
 * @param {object[]} xlsxRows filas crudas de readPlatosRows
 * @returns {{ dishes: object[], excluded: {id: string, causa: string}[], joinReport: { totalFreeform: number, totalPromotable: number } }}
 */
export function buildFreeformDishes(combos, xlsxRows) {
  const joined = joinFreeformXlsx(xlsxRows, combos);

  const dishes = [];
  for (const combo of combos) {
    if (EXCLUDED_ID_SET.has(combo.identity.id)) continue;

    const xr = joined.get(combo.identity.id);
    const { plateType, reviewPlateType } = resolveFreeformPlateType(combo);
    if (reviewPlateType) {
      throw new Error(`buildFreeformDishes: ${combo.identity.id} sigue con reviewPlateType tras D-011 (inesperado).`);
    }

    const dish = {
      id: combo.identity.id,
      nombre: combo.identity.title,
      rol: xr.rol,
      batchable: parseBatchable(xr.batchable),
      leftoverQuality: xr.leftoverQuality,
      shelfLifeDays: parseShelfLifeDays(xr.shelfLifeDays),
      energiaCocina: xr.energiaCocina,
      momento: deriveMomentoFreeform(combo.behavior.slot),
      tempFeel: deriveTempFeelFreeform(plateType, combo.identity.id),
      plateType,
    };

    validateDish(dish);
    dishes.push(dish);
  }

  return {
    dishes,
    excluded: EXCLUDED_FREEFORM_IDS,
    joinReport: {
      totalFreeform: combos.length,
      totalPromotable: dishes.length,
    },
  };
}
