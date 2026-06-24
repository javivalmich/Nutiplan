// Catalogo de anclas — Fase 3, Checkpoint 2: valida la anotacion manual
// (rol/batchable/leftoverQuality/shelfLifeDays/energiaCocina) contra los
// enums del esquema (CP1) y fija las 6 identidades para detectar drift.

import { describe, it, expect } from 'vitest';
import { ANCHORS } from '../anchors.js';
import { LEFTOVER_QUALITIES, ENERGIA_COCINA_NIVELES } from '../schema.js';

describe('catalogo de anclas — forma y enums', () => {
  it('tiene exactamente 6 anclas', () => {
    expect(ANCHORS.length).toBe(6);
  });

  it('cada ancla tiene rol="ancla" y batchable=true', () => {
    for (const a of ANCHORS) {
      expect(a.rol).toBe('ancla');
      expect(a.batchable).toBe(true);
    }
  });

  it('leftoverQuality de cada ancla esta en el enum del esquema', () => {
    for (const a of ANCHORS) expect(LEFTOVER_QUALITIES).toContain(a.leftoverQuality);
  });

  it('energiaCocina de cada ancla esta en el enum del esquema', () => {
    for (const a of ANCHORS) expect(ENERGIA_COCINA_NIVELES).toContain(a.energiaCocina);
  });

  it('shelfLifeDays es un entero >= 0 en cada ancla', () => {
    for (const a of ANCHORS) {
      expect(Number.isInteger(a.shelfLifeDays)).toBe(true);
      expect(a.shelfLifeDays).toBeGreaterThanOrEqual(0);
    }
  });

  it('las 6 identityKey son unicas entre si (ninguna colision, ningun dual sin resolver)', () => {
    const keys = ANCHORS.map((a) => a.identityKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('catalogo de anclas — fija las 6 identidades (drift detectable)', () => {
  it('coincide con las 6 identidades confirmadas en CP2', () => {
    const keys = ANCHORS.map((a) => a.identityKey).sort();
    expect(keys).toEqual([
      '["caliente_clasico","ternera","patata","zanahoria",null,"ajillo","guisado"]',
      '["legumbre","garbanzos",null,"berenjena",null,"curry_ligero","salteado"]',
      '["legumbre","garbanzos",null,"pimientos",null,"pimenton_ajo","guisado"]',
      '["legumbre","lentejas","arroz","zanahoria",null,"pimenton_ajo","guisado"]',
      '["sopa_crema","atun",null,"tomate","pimientos",null,"crudo"]',
      '["sopa_crema","huevo",null,"tomate",null,null,"crudo"]',
    ].sort());
  });
});
