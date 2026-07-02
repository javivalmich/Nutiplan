// Fase 2, Paso C — promotor de FREEFORM_COMBOS.js -> dishes.json.
// Ver scripts/phaseB2/freeformPromote.js y CLAUDE.md (Decisiones A-G).

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import {
  normalizeTitle,
  joinFreeformXlsx,
  buildFreeformDishes,
  EXCLUDED_FREEFORM_IDS,
} from '../../../../scripts/phaseB2/freeformPromote.js';
import { readPlatosRows } from '../../../../scripts/phaseB2/importAnotacion.js';
import { FREEFORM_COMBOS } from '../../../data/FREEFORM_COMBOS.js';
import { DishSchemaError, PLATE_TYPES } from '../schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, '../../../../scripts/phaseB2/input/Anotacion_cocinero_242_v4.xlsx');

async function loadRealXlsxRows() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);
  return readPlatosRows(wb);
}

describe('normalizeTitle', () => {
  it('minusculas + NFD sin diacriticos + sin puntuacion + espacios colapsados', () => {
    expect(normalizeTitle('Fideuá de marisco')).toBe('fideua de marisco');
    expect(normalizeTitle('  Caldo gallego,  de grelos (completo)  ')).toBe('caldo gallego de grelos completo');
    expect(normalizeTitle('Tom Kha Gai — sopa tailandesa de pollo y coco')).toBe('tom kha gai sopa tailandesa de pollo y coco');
  });

  it('dos titulos visualmente distintos que normalizan igual son iguales tras normalizar', () => {
    expect(normalizeTitle('Ensalada Griega')).toBe(normalizeTitle('  ensalada   griega  '));
  });
});

function fixtureCombo(id, title, slot = ['C']) {
  return { identity: { id, title, plateType: 'ensalada' }, behavior: { slot } };
}

function fixtureXlsxRow(n, nombre, overrides = {}) {
  // Shape de readPlatosRows() (importAnotacion.js): cabeceras ya mapeadas
  // via HEADER_KEY_MAP ('Nº' -> 'n', 'Nombre sugerido' -> 'nombre').
  return {
    n, nombre, fuente: 'freeform',
    rol: 'rotativo', batchable: 'no', leftoverQuality: 'media', shelfLifeDays: '2-3', energiaCocina: 'medio',
    ...overrides,
  };
}

describe('joinFreeformXlsx — casos limpios y de discriminacion (r3)', () => {
  it('empareja 1:1 por titulo normalizado', () => {
    const combos = [fixtureCombo('a', 'Plato Uno'), fixtureCombo('b', 'Plato Dos')];
    const rows = [fixtureXlsxRow(1, 'Plato Uno'), fixtureXlsxRow(2, 'Plato Dos')];
    const joined = joinFreeformXlsx(rows, combos);
    expect(joined.get('a').n).toBe(1);
    expect(joined.get('b').n).toBe(2);
  });

  it('PRUEBA DE DISCRIMINACION (r3): titulo del xlsx modificado (deja de matchear) -> lanza y lista el sin-match', () => {
    const combos = [fixtureCombo('a', 'Plato Uno')];
    const rowsRotas = [fixtureXlsxRow(1, 'Plato Uno Modificado')];
    expect(() => joinFreeformXlsx(rowsRotas, combos)).toThrow(/sin fila xlsx/);
  });

  it('revertido (titulo restaurado): vuelve a emparejar', () => {
    const combos = [fixtureCombo('a', 'Plato Uno')];
    const rows = [fixtureXlsxRow(1, 'Plato Uno')];
    expect(() => joinFreeformXlsx(rows, combos)).not.toThrow();
  });

  it('fila xlsx duplicada con el mismo titulo normalizado -> lanza (ambiguo)', () => {
    const combos = [fixtureCombo('a', 'Plato Uno')];
    const rows = [fixtureXlsxRow(1, 'Plato Uno'), fixtureXlsxRow(2, 'Plato Uno')];
    expect(() => joinFreeformXlsx(rows, combos)).toThrow(/>1 fila xlsx/);
  });

  it('fila xlsx sobrante (ningun combo la reclama) -> lanza (no consumida)', () => {
    const combos = [fixtureCombo('a', 'Plato Uno')];
    const rows = [fixtureXlsxRow(1, 'Plato Uno'), fixtureXlsxRow(2, 'Plato Sobrante')];
    expect(() => joinFreeformXlsx(rows, combos)).toThrow(/no consumidas/);
  });

  it('ignora filas fuente != freeform', () => {
    const combos = [fixtureCombo('a', 'Plato Uno')];
    const rows = [fixtureXlsxRow(1, 'Plato Uno'), { ...fixtureXlsxRow(2, 'Otro Scaffold'), fuente: 'scaffold' }];
    expect(() => joinFreeformXlsx(rows, combos)).not.toThrow();
  });
});

describe('buildFreeformDishes — exclusion documentada (Decision A)', () => {
  it('EXCLUDED_FREEFORM_IDS contiene bol_fruta_yogur con su causa', () => {
    expect(EXCLUDED_FREEFORM_IDS).toEqual([
      { id: 'bol_fruta_yogur', causa: expect.stringContaining('Al') },
    ]);
  });

  it('bol_fruta_yogur nunca aparece en los dishes promovidos, incluso si el xlsx trae una fila para el', () => {
    const combos = [
      fixtureCombo('bol_fruta_yogur', 'Bol de fruta', ['Al']),
      fixtureCombo('otro_plato', 'Otro Plato', ['C']),
    ];
    const rows = [fixtureXlsxRow(1, 'Bol de fruta'), fixtureXlsxRow(2, 'Otro Plato')];
    const { dishes, excluded } = buildFreeformDishes(combos, rows);
    expect(dishes.map((d) => d.id)).toEqual(['otro_plato']);
    expect(excluded.map((e) => e.id)).toContain('bol_fruta_yogur');
  });
});

describe('buildFreeformDishes — integracion con datos reales (63 promovibles)', () => {
  it('con el xlsx real, produce exactamente 63 dishes validos (64 combos - 1 exclusion)', async () => {
    const xlsxRows = await loadRealXlsxRows();
    const { dishes, excluded, joinReport } = buildFreeformDishes(FREEFORM_COMBOS, xlsxRows);

    expect(joinReport.totalFreeform).toBe(64);
    expect(joinReport.totalPromotable).toBe(63);
    expect(dishes.length).toBe(63);
    expect(excluded).toEqual([{ id: 'bol_fruta_yogur', causa: expect.any(String) }]);
    expect(dishes.some((d) => d.id === 'bol_fruta_yogur')).toBe(false);

    for (const dish of dishes) {
      expect(PLATE_TYPES.includes(dish.plateType)).toBe(true);
      expect(dish.momento.length).toBeGreaterThan(0);
      expect(dish.momento.every((m) => ['comida', 'cena'].includes(m))).toBe(true);
    }

    // Todos los ids son unicos.
    expect(new Set(dishes.map((d) => d.id)).size).toBe(63);
  });

  it('PRUEBA DE DISCRIMINACION (r1): inyectar un plateType fuera de enum en un dish real hace fallar validateDish', async () => {
    const xlsxRows = await loadRealXlsxRows();
    const { dishes } = buildFreeformDishes(FREEFORM_COMBOS, xlsxRows);
    const dishSucio = { ...dishes[0], plateType: 'plateType_inventado' };
    const { validateDish } = await import('../schema.js');
    expect(() => validateDish(dishSucio)).toThrow(DishSchemaError);
  });
});
