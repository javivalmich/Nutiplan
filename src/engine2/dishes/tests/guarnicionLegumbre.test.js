// Paso 3 de la legumbre como guarnición: la lista de legumbres válidas de cada
// plato de plantilla, del inventario (scripts/banco/medicion/inventario/
// hidratos-legumbre.csv), como módulo del catálogo. Sin efecto en los menús.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { GUARNICION_LEGUMBRE, legumbresGuarnicion } from '../guarnicionLegumbre.js';
import { INGREDIENTES } from '../../nutrientes/ingredientes.js';
import platos from '../../../../scripts/phaseB2/output/dishes.json';

const CSV = new URL('../../../../scripts/banco/medicion/inventario/hidratos-legumbre.csv', import.meta.url);

// Nombre del inventario → ingrediente (las del paso 2, más garbanzos, guisantes y edamame, que ya existían).
const CLAVE = {
  garbanzos: 'garbanzos_cocidos',
  'alubias blancas': 'alubias_blancas_cocidas',
  'alubias rojas': 'alubias_rojas_cocidas',
  'alubias pintas': 'alubias_pintas_cocidas',
  'alubias negras': 'alubias_negras_cocidas',
  'lentejas pardinas': 'lentejas_pardinas_cocidas',
  'lentejas beluga': 'lentejas_beluga_cocidas',
  habitas: 'habitas',
  guisantes: 'guisantes',
  edamame: 'edamame',
};

function leerCsv() {
  const [cab, ...filas] = fs.readFileSync(CSV, 'utf8').replace(new RegExp('^' + String.fromCharCode(0xfeff)), '').split(/\r?\n/).filter(Boolean);
  const campos = cab.split(';');
  return filas.map((l) => {
    const v = []; let cur = ''; let q = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ';') { v.push(cur); cur = ''; } else cur += ch;
    }
    v.push(cur);
    return Object.fromEntries(campos.map((c, i) => [c, v[i]]));
  });
}

const DEL_CSV = leerCsv().filter((f) => f.origen === 'plantilla' && f.admite_legumbre === 'sí');
const IDS = Object.keys(GUARNICION_LEGUMBRE);

describe('lista de legumbres por plato (guarnicionLegumbre.js)', () => {
  it('tiene los 61 platos de plantilla con «sí» del inventario', () => {
    expect(DEL_CSV).toHaveLength(61);
    expect(IDS).toHaveLength(61);
  });

  it('coincide con el .csv, plato a plato y en el mismo orden de legumbres', () => {
    const esperado = Object.fromEntries(DEL_CSV.map((f) => [f.id, f.legumbres_validas.split(',').map((x) => CLAVE[x.trim()])]));
    expect(GUARNICION_LEGUMBRE).toEqual(esperado);
  });

  it('cada id existe en el catálogo y es una tupla de plantilla en JSON (si cambia una plantilla, este test avisa)', () => {
    const delCatalogo = new Set(platos.map((d) => d.id));
    for (const id of IDS) {
      expect(delCatalogo.has(id), id).toBe(true);
      const t = JSON.parse(id);
      expect(Array.isArray(t) && t.length === 7, id).toBe(true);
      expect(typeof t[2], `${id}: hueco de hidrato`).toBe('string');
    }
  });

  it('cada legumbre de la lista es un ingrediente de legumbre del medidor', () => {
    for (const [id, lista] of Object.entries(GUARNICION_LEGUMBRE)) {
      expect(lista.length, id).toBeGreaterThan(0);
      expect(new Set(lista).size, id).toBe(lista.length);
      for (const c of lista) expect(INGREDIENTES[c] && INGREDIENTES[c].grupo, `${id}: ${c}`).toBe('legumbre');
    }
  });

  it('ningún plato de pescado o marisco lleva una legumbre que el inventario descartó', () => {
    // Base por proteína y ajustes de hidratos-legumbre.md (§2).
    const BASE = {
      bacalao: ['garbanzos', 'alubias blancas', 'lentejas pardinas'],
      merluza: ['guisantes', 'alubias blancas', 'lentejas beluga'],
      dorada: ['lentejas beluga', 'guisantes', 'alubias blancas'],
      salmon: ['lentejas beluga', 'alubias blancas'],
      sardinas: ['alubias blancas', 'garbanzos', 'lentejas beluga'],
      atun: ['alubias blancas', 'garbanzos', 'lentejas beluga'],
      calamares: ['garbanzos', 'alubias blancas', 'habitas'],
      gambas: ['garbanzos', 'alubias blancas', 'habitas'],
    };
    let vistos = 0;
    for (const [id, lista] of Object.entries(GUARNICION_LEGUMBRE)) {
      const [tmpl, P, , V, , S, cookM] = JSON.parse(id);
      if (!BASE[P]) continue;
      vistos++;
      const vale = new Set(BASE[P]);
      if (tmpl === 'ensalada' || cookM === 'crudo') ['garbanzos', 'alubias blancas', 'lentejas beluga'].forEach((x) => vale.add(x));
      if (/curry/.test(S || '')) ['garbanzos', 'lentejas pardinas', 'alubias rojas'].forEach((x) => vale.add(x));
      if (/alcachofa/.test(V || '')) vale.add('habitas');
      if (P === 'salmon' && S === 'soja_jengibre') ['edamame', 'lentejas beluga'].forEach((x) => vale.add(x));
      const claves = new Set([...vale].map((x) => CLAVE[x]));
      for (const c of lista) {
        expect(claves.has(c), `${id}: ${c}`).toBe(true);
        if (V === 'judias') expect(c.startsWith('alubias_'), `${id}: alubias con judías verdes`).toBe(false);
        if (c === 'guisantes') expect(['merluza', 'dorada'], id).toContain(P);
      }
    }
    expect(vistos).toBe(24);
  });

  it('legumbresGuarnicion devuelve la lista del plato, o null si no admite guarnición', () => {
    const [id] = IDS;
    expect(legumbresGuarnicion(id)).toEqual(GUARNICION_LEGUMBRE[id]);
    expect(legumbresGuarnicion('["bowl","pollo","arroz","brocoli",null,"soja_jengibre","salteado"]')).toBe(null);
    expect(legumbresGuarnicion(undefined)).toBe(null);
  });

  it('es de solo lectura', () => {
    expect(Object.isFrozen(GUARNICION_LEGUMBRE)).toBe(true);
    expect(Object.isFrozen(GUARNICION_LEGUMBRE[IDS[0]])).toBe(true);
  });
});
