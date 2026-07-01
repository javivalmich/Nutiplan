// Fase 2, Paso B.2 — importador xlsx (v4 anotado por el cocinero) hacia los
// campos editoriales de dishes.scaffold.json. Vive en scripts/ (fuera de
// engine2/). Pura: no lee/escribe disco (eso lo hace runImportAnotacion.js);
// recibe filas ya leidas y el scaffold ya parseado.
//
// MATCHING (A.2 verificado, no es disyuntiva abierta): el xlsx no lleva
// columna de identidad y el join por nombre NO es 1:1 (15 filas con nombre
// repetido en 6 grupos). El unico discriminador estable es el Nº posicional
// -- A.2 confirmo que casa exacto entre el v4 y el orden de
// dishes.scaffold.json. Se recupera identity.id (dish.id) POR POSICION, no
// por nombre. El nombre del xlsx es solo un TRIPWIRE de coherencia: si no
// coincide con el nombre regenerado por regenerateNombreSugerido(dish), es
// una señal de que el matching posicional se rompio (drift entre el v4 y el
// scaffold actual) -- se lanza en vez de promover a ciegas.
//
// Procesa SOLO fuente=scaffold (178). fuente=freeform se ignora por
// completo (integracion estructural diferida a Paso C).
//
// Excluye las filas con dish.reviewPlateType (pendientes de que Javi
// confirme el plateType) -- nunca se promueven con un tipo asignado
// provisionalmente, aunque el xlsx traiga sus campos editoriales completos.
//
// Escribe SOLO los campos del contrato Dish que son responsabilidad de esta
// anotacion: nombre, rol, batchable, leftoverQuality, shelfLifeDays,
// energiaCocina. containsGluten/containsLactosa/congelable/proteinType
// quedan fuera de contrato (schema.js no los tiene) -- no se promueven.

import { regenerateNombreSugerido } from './exportCocinero.js';

export const FIELDS_TO_WRITE = Object.freeze([
  'nombre', 'rol', 'batchable', 'leftoverQuality', 'shelfLifeDays', 'energiaCocina',
]);

// DECISIONS.md D-008: suggestNameFromTuple ignoraba cookM:"crudo" en la rama
// caliente_clasico (defaulteaba silenciosamente a "a la plancha"). El v4.xlsx
// se genero ANTES del fix, asi que su columna "Nombre sugerido" quedo
// congelada con el texto viejo para estos 3 identityKeys. Son la UNICA
// excepcion documentada al tripwire de nombre: para ellos se promueve el
// nombre REGENERADO (ya corregido), no el texto congelado del xlsx. Ningun
// otro identityKey esta en esta lista -- el tripwire sigue protegiendo todo
// lo demas sin relajarse.
export const KNOWN_NAME_CORRECTIONS = Object.freeze(new Set([
  '["caliente_clasico","atun","arroz","tomate",null,"limon_hierbas","crudo"]',
  '["caliente_clasico","atun",null,"tomate",null,"vinagreta","crudo"]',
  '["caliente_clasico","atun",null,"lechuga","pepino",null,"crudo"]',
]));

/**
 * Convierte shelfLifeDays a entero. Decision de Javi: un rango "N-M" se
 * promueve al MINIMO (N). Un entero (string o number) se devuelve tal cual.
 * @param {string|number} raw
 * @returns {number}
 */
export function parseShelfLifeDays(raw) {
  const str = String(raw).trim();
  const rangeMatch = str.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) return Number(rangeMatch[1]);
  const n = Number(str);
  if (!Number.isInteger(n)) throw new Error(`shelfLifeDays invalido: "${raw}"`);
  return n;
}

/**
 * "si"/"no" (con o sin tilde, case-insensitive) -> boolean. Cualquier otro
 * valor lanza: un valor ambiguo no debe silenciarse como false.
 * @param {string} raw
 * @returns {boolean}
 */
export function parseBatchable(raw) {
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === 'si' || normalized === 'sí') return true;
  if (normalized === 'no') return false;
  throw new Error(`batchable invalido: "${raw}"`);
}

/**
 * Extrae texto plano de una celda de ExcelJS (puede venir como string,
 * numero, o objeto richText/formula).
 * @param {*} value
 * @returns {string}
 */
function cellText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return value.text ?? value.richText?.map((r) => r.text).join('') ?? value.result ?? String(value);
  }
  return value;
}

// Cabeceras reales del xlsx (ver scripts/phaseB2/exportCocinero.js,
// wsPlatos.columns) que no coinciden literalmente con la clave interna que
// usa este importador. El resto de cabeceras (rol, batchable,
// leftoverQuality, shelfLifeDays, energiaCocina, fuente, plateType, ...) ya
// coinciden tal cual y no necesitan mapeo.
const HEADER_KEY_MAP = Object.freeze({
  'Nº': 'n',
  'Nombre sugerido': 'nombre',
  'ya anotado': 'yaAnotado',
  'revisar tipo': 'revisarTipo',
});

/**
 * Lee la hoja "Platos" de un workbook de ExcelJS ya cargado y la vuelca a
 * objetos planos indexados por una clave normalizada por columna (no asume
 * un orden de columnas fijo; usa la cabecera real, mapeada via
 * HEADER_KEY_MAP para las que no coinciden literalmente).
 * @param {import('exceljs').Workbook} workbook
 * @returns {object[]}
 */
export function readPlatosRows(workbook) {
  const ws = workbook.getWorksheet('Platos');
  if (!ws) throw new Error('Hoja "Platos" no encontrada en el workbook.');

  const headers = [];
  ws.getRow(1).eachCell((cell, colNumber) => { headers[colNumber] = HEADER_KEY_MAP[cell.value] ?? cell.value; });

  const rows = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = cellText(row.getCell(i).value); });
    rows.push(obj);
  });
  return rows;
}

/**
 * Construye el resultado de la importacion a partir de las filas del xlsx
 * (todas las fuentes) y el scaffold actual (178, ya parseado). Lanza (STOP)
 * ante cualquier senal de matching inestable: no hay fallback silencioso.
 *
 * @param {object[]} xlsxRows filas crudas de readPlatosRows (incluye scaffold+freeform)
 * @param {object[]} scaffoldDishes dishes.scaffold.json ya parseado (178, orden original)
 * @returns {{
 *   scaffoldUpdated: object[],
 *   promotable: object[],
 *   excluded: { id: string, n: number, nombre: string }[],
 *   shelfLifeConversions: { raw: string, parsed: number, count: number }[],
 * }}
 */
export function buildImportResult(xlsxRows, scaffoldDishes) {
  const scaffoldRows = xlsxRows.filter((r) => r.fuente === 'scaffold');

  if (scaffoldRows.length !== scaffoldDishes.length) {
    throw new Error(
      `Filas fuente=scaffold del xlsx (${scaffoldRows.length}) != dishes.scaffold.json (${scaffoldDishes.length}). ` +
      'El matching posicional exige que ambos conjuntos coincidan 1:1.'
    );
  }

  const seenN = new Set();
  const excluded = [];
  const scaffoldUpdated = scaffoldDishes.map((d) => ({ ...d }));
  const promotable = [];
  const shelfLifeTally = new Map(); // raw -> { parsed, count }

  for (const xr of scaffoldRows) {
    const n = Number(xr.n);
    if (!Number.isInteger(n) || n < 1 || n > scaffoldDishes.length) {
      throw new Error(`Nº invalido o fuera de rango en fila xlsx: "${xr.n}"`);
    }
    if (seenN.has(n)) throw new Error(`Nº duplicado en el xlsx: ${n} (matching posicional inestable)`);
    seenN.add(n);

    const dish = scaffoldDishes[n - 1];
    if (!dish) throw new Error(`No hay dish del scaffold en la posicion Nº=${n}`);

    const nombreEsperado = regenerateNombreSugerido(dish);
    if (xr.nombre !== nombreEsperado && !KNOWN_NAME_CORRECTIONS.has(dish.id)) {
      throw new Error(
        `Tripwire de nombre falló en Nº=${n}: xlsx="${xr.nombre}" vs regenerado="${nombreEsperado}" (id=${dish.id}). ` +
        'El matching posicional puede haberse roto (drift entre el v4 y el scaffold actual).'
      );
    }
    // Para los identityKeys de KNOWN_NAME_CORRECTIONS, el nombre a promover
    // es el REGENERADO (fuente de verdad tras D-008), no el texto congelado
    // del xlsx.
    const nombreAPromover = KNOWN_NAME_CORRECTIONS.has(dish.id) ? nombreEsperado : xr.nombre;

    if (dish.reviewPlateType) {
      excluded.push({ id: dish.id, n, nombre: xr.nombre });
      continue;
    }

    const shelfLifeDays = parseShelfLifeDays(xr.shelfLifeDays);
    const rawShelf = String(xr.shelfLifeDays).trim();
    const tallyEntry = shelfLifeTally.get(rawShelf) ?? { parsed: shelfLifeDays, count: 0 };
    tallyEntry.count += 1;
    shelfLifeTally.set(rawShelf, tallyEntry);

    const editorial = {
      nombre: nombreAPromover,
      rol: xr.rol,
      batchable: parseBatchable(xr.batchable),
      leftoverQuality: xr.leftoverQuality,
      shelfLifeDays,
      energiaCocina: xr.energiaCocina,
    };

    // Persiste sobre la copia completa del scaffold (para dishes.scaffold.json)...
    scaffoldUpdated[n - 1] = { ...scaffoldUpdated[n - 1], ...editorial };

    // ...y por separado, solo los 10 campos del contrato Dish (para promote.js/dishes.json).
    promotable.push({
      id: dish.id,
      nombre: editorial.nombre,
      rol: editorial.rol,
      batchable: editorial.batchable,
      leftoverQuality: editorial.leftoverQuality,
      shelfLifeDays: editorial.shelfLifeDays,
      energiaCocina: editorial.energiaCocina,
      momento: dish.momento,
      tempFeel: dish.tempFeel,
      plateType: dish.plateType,
    });
  }

  const shelfLifeConversions = [...shelfLifeTally.entries()]
    .map(([raw, { parsed, count }]) => ({ raw, parsed, count }))
    .sort((a, b) => a.raw.localeCompare(b.raw));

  return { scaffoldUpdated, promotable, excluded, shelfLifeConversions };
}
