// Tests de loadCatalog — Fase 4, Componente P0-1. Falsables v1/r1/r2/v2/v3/r3
// segun el prompt de sesion 2026-07-03 (ver DECISIONS.md, asiento de F4-P0).
//
// r1/r2 inyectan violaciones sobre una COPIA EFIMERA del catalogo real en
// tmpdir (nunca sobre scripts/phaseB2/output/dishes.json) — el catalogo
// real no se muta en ningun momento de esta suite.

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadCatalog, CATALOG_PATH } from '../loadCatalog.js';

let scratchDir = null;

afterEach(() => {
  if (scratchDir) {
    fs.rmSync(scratchDir, { recursive: true, force: true });
    scratchDir = null;
  }
});

function writeEphemeralCatalog(dishes) {
  scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loadCatalog-efimero-'));
  const file = path.join(scratchDir, 'dishes.json');
  fs.writeFileSync(file, JSON.stringify(dishes), 'utf8');
  return file;
}

describe('loadCatalog — v1: 241 platos cargan y validan, ids unicos', () => {
  it('carga exactamente 241 platos con ids unicos', () => {
    const catalog = loadCatalog();
    expect(catalog).toHaveLength(241);
    expect(new Set(catalog.map((d) => d.id)).size).toBe(241);
  });
});

describe('loadCatalog — r1: campo requerido ausente aborta identificando plato y campo', () => {
  it('lanza sin cargar nada si un plato pierde un campo requerido', () => {
    const base = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const mutated = base.map((d, i) => (i === 3 ? { ...d } : d));
    delete mutated[3].shelfLifeDays;
    const efimeroPath = writeEphemeralCatalog(mutated);

    expect(() => loadCatalog(efimeroPath)).toThrow(/shelfLifeDays/);
    try {
      loadCatalog(efimeroPath);
    } catch (err) {
      expect(err.message).toContain(mutated[3].id);
    }
  });
});

describe('loadCatalog — r2: id duplicado aborta identificando el id', () => {
  it('lanza nombrando el id repetido', () => {
    const base = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const dupId = base[0].id;
    const mutated = base.map((d, i) => (i === 1 ? { ...d, id: dupId } : d));
    const efimeroPath = writeEphemeralCatalog(mutated);

    expect(() => loadCatalog(efimeroPath)).toThrow(new RegExp(dupId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});

describe('loadCatalog — v2: dos cargas consecutivas son estructuralmente identicas', () => {
  it('toEqual entre dos llamadas', () => {
    expect(loadCatalog()).toEqual(loadCatalog());
  });
});

describe('loadCatalog — v3: orden estable (propiedad de contrato, no efecto colateral)', () => {
  it('dos cargas devuelven los ids en identica secuencia', () => {
    const idsA = loadCatalog().map((d) => d.id);
    const idsB = loadCatalog().map((d) => d.id);
    expect(idsA).toEqual(idsB);
  });
});

describe('loadCatalog — r3: freeze profundo, no solo superficial', () => {
  it('push sobre el array devuelto lanza en modo estricto', () => {
    const catalog = loadCatalog();
    expect(() => catalog.push({})).toThrow(TypeError);
  });

  it('asignar un campo del primer plato lanza en modo estricto', () => {
    const catalog = loadCatalog();
    expect(() => {
      catalog[0].nombre = 'mutado';
    }).toThrow(TypeError);
  });

  it('mutar un campo ANIDADO (momento) lanza — demuestra freeze recursivo, no solo del objeto plato', () => {
    const catalog = loadCatalog();
    const dishWithMomento = catalog.find((d) => Array.isArray(d.momento) && d.momento.length > 0);
    expect(() => {
      dishWithMomento.momento.push('comida');
    }).toThrow(TypeError);
  });
});
