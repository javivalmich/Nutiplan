// Tripwire: todo plateType del scaffold generado debe pertenecer al enum
// cerrado de schema.js (PLATE_TYPES). Fase 2, checkpoint curaduria.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { generateScaffold } from '../../../../scripts/phaseB2/generateScaffold.js';
import { buildFreeformDishes } from '../../../../scripts/phaseB2/freeformPromote.js';
import { readPlatosRows } from '../../../../scripts/phaseB2/importAnotacion.js';
import { FREEFORM_COMBOS } from '../../../data/FREEFORM_COMBOS.js';
import { PLATE_TYPES, validateDish } from '../schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, '../../../../scripts/phaseB2/input/Anotacion_cocinero_242_v4.xlsx');
const DISHES_JSON_PATH = path.resolve(__dirname, '../../../../scripts/phaseB2/output/dishes.json');

async function loadRealXlsxRows() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);
  return readPlatosRows(wb);
}

describe('tripwire: plateType del scaffold real ∈ PLATE_TYPES', () => {
  it('ninguna dish del scaffold real tiene plateType fuera del enum', () => {
    const { dishes } = generateScaffold();
    const fueraDeEnum = dishes.filter((d) => !PLATE_TYPES.includes(d.plateType));
    expect(fueraDeEnum).toEqual([]);
  });
});

describe('PRUEBA DE DISCRIMINACION: un plateType inventado en el scaffold debe detectarse', () => {
  it('rojo: inyectar un plateType inventado en una dish fixture hace fallar el chequeo', () => {
    const { dishes } = generateScaffold();
    const dishesConFantasma = [...dishes, { ...dishes[0], id: 'fantasma', plateType: 'plateType_inventado' }];

    const fueraDeEnumSucio = dishesConFantasma.filter((d) => !PLATE_TYPES.includes(d.plateType));
    expect(fueraDeEnumSucio).not.toEqual([]); // ROJO esperado
    expect(fueraDeEnumSucio.map((d) => d.id)).toEqual(['fantasma']);
  });

  it('verde: sin la dish fantasma, el scaffold real vuelve a cuadrar', () => {
    const { dishes } = generateScaffold();
    const fueraDeEnumLimpio = dishes.filter((d) => !PLATE_TYPES.includes(d.plateType));
    expect(fueraDeEnumLimpio).toEqual([]); // VERDE esperado
  });
});

describe('tripwire: plateType del catalogo completo (scaffold 178 + freeform 63) ∈ PLATE_TYPES', () => {
  it('ninguna dish freeform promovida tiene plateType fuera del enum (Paso C, ampliacion de alcance)', async () => {
    const { dishes: scaffoldDishes } = generateScaffold();
    const xlsxRows = await loadRealXlsxRows();
    const { dishes: freeformDishes } = buildFreeformDishes(FREEFORM_COMBOS, xlsxRows);

    const catalogoCompleto = [...scaffoldDishes, ...freeformDishes];
    expect(catalogoCompleto.length).toBe(178 + 63);

    const fueraDeEnum = catalogoCompleto.filter((d) => !PLATE_TYPES.includes(d.plateType));
    expect(fueraDeEnum).toEqual([]);
  });

  it('PRUEBA DE DISCRIMINACION: un plateType inventado en una dish freeform fixture se detecta igual que en el scaffold', async () => {
    const xlsxRows = await loadRealXlsxRows();
    const { dishes: freeformDishes } = buildFreeformDishes(FREEFORM_COMBOS, xlsxRows);
    const conFantasma = [...freeformDishes, { ...freeformDishes[0], id: 'fantasma_freeform', plateType: 'plateType_inventado' }];

    const fueraDeEnumSucio = conFantasma.filter((d) => !PLATE_TYPES.includes(d.plateType));
    expect(fueraDeEnumSucio.map((d) => d.id)).toEqual(['fantasma_freeform']); // ROJO esperado

    const fueraDeEnumLimpio = freeformDishes.filter((d) => !PLATE_TYPES.includes(d.plateType));
    expect(fueraDeEnumLimpio).toEqual([]); // VERDE esperado, sin la dish fantasma
  });
});

describe('tripwire: dishes.json real (241) — catalogo completo escrito en disco', () => {
  it('241 platos, todos con id unico, plateType en el enum, y validos contra validateDish', () => {
    const dishesReal = JSON.parse(fs.readFileSync(DISHES_JSON_PATH, 'utf-8'));
    expect(dishesReal.length).toBe(241);
    expect(new Set(dishesReal.map((d) => d.id)).size).toBe(241);

    const fueraDeEnum = dishesReal.filter((d) => !PLATE_TYPES.includes(d.plateType));
    expect(fueraDeEnum).toEqual([]);

    for (const d of dishesReal) validateDish(d);
  });
});

describe('PRUEBA DE DISCRIMINACION: rename pescado_salsa -> en_salsa (enum-24)', () => {
  it('rojo: el valor viejo "pescado_salsa" ya NO pertenece al enum', () => {
    expect(PLATE_TYPES.includes('pescado_salsa')).toBe(false); // ROJO: ya no es valido
  });

  it('verde: "en_salsa" (su reemplazo) sí pertenece al enum, junto con pescado_plancha/airfryer/crudo', () => {
    expect(PLATE_TYPES.includes('en_salsa')).toBe(true);
    expect(PLATE_TYPES.includes('pescado_plancha')).toBe(true);
    expect(PLATE_TYPES.includes('airfryer')).toBe(true);
    expect(PLATE_TYPES.includes('crudo')).toBe(true);
    expect(PLATE_TYPES.length).toBe(24);
  });
});
