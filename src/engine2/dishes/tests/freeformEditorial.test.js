// B.3 (checkpoint enum-24): filas editoriales para el xlsx a partir de
// FREEFORM_COMBOS (64 entradas). NO se integran en el scaffold tuplar.

import { describe, it, expect } from 'vitest';
import {
  buildFreeformEditorialRows,
  FREEFORM_PLATE_TYPE_MAP,
  FREEFORM_PLATE_TYPE_ID_OVERRIDES,
  resolveFreeformPlateType,
} from '../../../../scripts/phaseB2/freeformEditorial.js';
import { FREEFORM_COMBOS } from '../../../data/FREEFORM_COMBOS.js';
import { PLATE_TYPES } from '../schema.js';

describe('buildFreeformEditorialRows: cobertura completa de las 64 entradas', () => {
  it('produce exactamente 64 filas, una por entrada freeform, identificadas por identity.id', () => {
    const rows = buildFreeformEditorialRows();
    expect(rows.length).toBe(64);
    expect(rows.length).toBe(FREEFORM_COMBOS.length);
    expect(new Set(rows.map((r) => r.id)).size).toBe(64); // todos los id unicos
  });

  it('ninguna fila usa comboIdentityKey (no tiene tupla tmpl/P/C/V/V2/S/cookM): el id es el identity.id original', () => {
    const rows = buildFreeformEditorialRows();
    for (const row of rows) {
      expect(row.id).not.toMatch(/^\[/); // comboIdentityKey serializa como array JSON; identity.id es un slug plano
    }
  });
});

describe('PRUEBA DE DISCRIMINACION: plateType freeform sin regla de mapeo -> reviewPlateType:true', () => {
  it('rojo: un plateType libre inventado, fuera de FREEFORM_PLATE_TYPE_MAP y sin override D-011, NO esta resuelto', () => {
    expect(FREEFORM_PLATE_TYPE_MAP['plateType_inventado']).toBeUndefined(); // ROJO: sin regla
    const fantasma = { identity: { id: 'fantasma_sin_id_override', plateType: 'plateType_inventado' } };
    const resuelto = resolveFreeformPlateType(fantasma);
    expect(resuelto).toEqual({ plateType: 'plateType_inventado', reviewPlateType: true }); // ROJO: sin regla, no inventa
  });

  it('verde: las 64 entradas caen en su categoria canonica, sin reviewPlateType (D-011 resuelve las 3 antes pendientes)', () => {
    const rows = buildFreeformEditorialRows();
    const mapeadas = rows.filter((r) => !r.reviewPlateType);
    expect(mapeadas.length).toBe(64);
    for (const row of mapeadas) {
      expect(PLATE_TYPES.includes(row.plateType)).toBe(true); // VERDE: cae en el enum canonico
    }
  });

  it('ninguna fila queda con reviewPlateType tras D-011', () => {
    const rows = buildFreeformEditorialRows();
    expect(rows.filter((r) => r.reviewPlateType)).toEqual([]);
  });
});

describe('D-011: remapeos por identity.id (papas_mojo_pollo, bibimbap_ternera_huevo, gyozas_verduras)', () => {
  it('FREEFORM_PLATE_TYPE_ID_OVERRIDES tiene exactamente esos 3 identity.id', () => {
    expect(Object.keys(FREEFORM_PLATE_TYPE_ID_OVERRIDES).sort()).toEqual(
      ['bibimbap_ternera_huevo', 'gyozas_verduras', 'papas_mojo_pollo'].sort()
    );
  });

  it('las 3 entradas resuelven al plateType ratificado y ya no llevan reviewPlateType', () => {
    const rows = buildFreeformEditorialRows();
    const porId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(porId.papas_mojo_pollo.plateType).toBe('caliente_patata');
    expect(porId.papas_mojo_pollo.reviewPlateType).toBeUndefined();
    expect(porId.bibimbap_ternera_huevo.plateType).toBe('bowl');
    expect(porId.bibimbap_ternera_huevo.reviewPlateType).toBeUndefined();
    expect(porId.gyozas_verduras.plateType).toBe('masa');
    expect(porId.gyozas_verduras.reviewPlateType).toBeUndefined();
  });

  it('PRUEBA DE DISCRIMINACION: el override por id GANA sobre la tabla generica y sobre REVISION_EXPLICITA', () => {
    // bibimbap_ternera_huevo tiene plateType libre "bibimbap", que NO esta
    // en FREEFORM_PLATE_TYPE_MAP (ausente a proposito). Sin el override
    // D-011 quedaria reviewPlateType:true; con el override, resuelve a "bowl".
    expect(FREEFORM_PLATE_TYPE_MAP['bibimbap']).toBeUndefined();
    const combo = FREEFORM_COMBOS.find((c) => c.identity.id === 'bibimbap_ternera_huevo');
    expect(resolveFreeformPlateType(combo)).toEqual({ plateType: 'bowl', reviewPlateType: false });
  });
});

describe('Vuelco de tags existentes a columnas canonicas', () => {
  it('una fila con tags completos en el dataset freeform los vuelca tal cual (ej. gazpacho_huevo_atun)', () => {
    const rows = buildFreeformEditorialRows();
    const gazpacho = rows.find((r) => r.id === 'gazpacho_huevo_atun');
    expect(gazpacho.proteinType).toBe('pescado');
    expect(gazpacho.digestiveLoad).toBe('low');
    expect(gazpacho.satietyScore).toBe(3);
    expect(gazpacho.energyDensity).toBe('low');
    expect(gazpacho.containsGluten).toBe(true);
    expect(gazpacho.containsLactosa).toBe(false);
    expect(gazpacho.lightMealCompatible).toBe(true);
    expect(gazpacho.avoidInAggressiveCut).toBe(false);
    expect(gazpacho.familiar).toBe(true);
  });

  it('congelable queda TODO para todas las filas (no existe en el dataset freeform de origen)', () => {
    const rows = buildFreeformEditorialRows();
    expect(rows.every((r) => r.congelable === 'TODO')).toBe(true);
  });
});
