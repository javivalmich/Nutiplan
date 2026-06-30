// B.3 (checkpoint enum-24): filas editoriales para el xlsx a partir de
// FREEFORM_COMBOS (64 entradas). NO se integran en el scaffold tuplar.

import { describe, it, expect } from 'vitest';
import { buildFreeformEditorialRows, FREEFORM_PLATE_TYPE_MAP } from '../../../../scripts/phaseB2/freeformEditorial.js';
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
  it('rojo: un plateType libre inventado, fuera de FREEFORM_PLATE_TYPE_MAP, NO esta resuelto', () => {
    expect(FREEFORM_PLATE_TYPE_MAP['plateType_inventado']).toBeUndefined(); // ROJO: sin regla
  });

  it('verde: las 61 entradas con plateType libre mapeado caen en su categoria canonica, sin reviewPlateType', () => {
    const rows = buildFreeformEditorialRows();
    const mapeadas = rows.filter((r) => !r.reviewPlateType);
    expect(mapeadas.length).toBe(61);
    for (const row of mapeadas) {
      expect(PLATE_TYPES.includes(row.plateType)).toBe(true); // VERDE: cae en el enum canonico
    }
  });

  it('las 3 entradas sin regla de mapeo (papas_mojo_pollo/patatas_canarias, gyozas_verduras/gyozas, bibimbap_ternera_huevo/bibimbap) quedan reviewPlateType:true, SIN inventar destino', () => {
    const rows = buildFreeformEditorialRows();
    const sinMapear = rows.filter((r) => r.reviewPlateType);
    expect(sinMapear.map((r) => r.id).sort()).toEqual(
      ['bibimbap_ternera_huevo', 'gyozas_verduras', 'papas_mojo_pollo'].sort()
    );
    for (const row of sinMapear) {
      expect(row.plateType).toBe(row.plateTypeLibre); // no se inventa: queda su plateType libre original
    }
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
