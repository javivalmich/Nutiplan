// Integración del cegado (D-085, D-086, D-087): único punto donde conviven los dos
// adaptadores y el módulo ciego. Usa las salidas crudas versionadas del R-0;
// no ejecuta ningún motor ni escribe artefactos.
//
// Propiedad crítica que se acredita aquí: el módulo ciego solo recibe
// { id, view } con el contrato común, no puede recibir nada más, no inspecciona
// el origen (sin imports, sin claves de motor en su código) y su vista del
// evaluador no depende de los ids.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toEvalView as legacyView } from '../../src/engine/evalView.js';
import { toEvalView as engine2View } from '../../src/engine2/evalView.js';
import { blind, serialize } from '../../src/eval/blind/blind.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/evidence/protocolo-evaluacion/out');
const BLIND_SRC = path.join(ROOT, 'src/eval/blind/blind.js');

const rawLegacy = () => JSON.parse(fs.readFileSync(path.join(OUT, 'r0-buildPlan-run1.raw.json'), 'utf8'));
const rawEngine2 = () => JSON.parse(fs.readFileSync(path.join(OUT, 'r0-materializePlan.raw.json'), 'utf8'));

const ID_L = 'id-opaco-1';
const ID_E = 'id-opaco-2';
const items = () => [
  { id: ID_L, view: legacyView(rawLegacy()) },
  { id: ID_E, view: engine2View(rawEngine2()) },
];

function shapeOf(value) {
  if (Array.isArray(value)) return value.map(shapeOf);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shapeOf(v)]));
  }
  return typeof value;
}

describe('integración — forma común tras el cegado', () => {
  it('los dos planes del R-0 quedan con estructura idéntica', () => {
    const { evaluador } = blind(items(), 1);
    expect(evaluador.planes).toHaveLength(2);
    const [a, b] = evaluador.planes.map((p) => shapeOf(p.dias));
    expect(a).toEqual(b);
    expect(a).toHaveLength(7);
    for (const plan of evaluador.planes) {
      const posiciones = plan.dias.reduce((n, d) => n + ('comida' in d ? 1 : 0) + ('cena' in d ? 1 : 0), 0);
      expect(posiciones).toBe(13);
      expect(Object.keys(plan.dias[5])).toEqual(['dia', 'cena']);
    }
  });

  it('los nombres de plato llegan literales desde cada productor', () => {
    const L = rawLegacy();
    const E = rawEngine2();
    const { evaluador, clave } = blind(items(), 1);
    const porId = Object.fromEntries(clave.entradas.map((e, k) => [e.id, evaluador.planes[k]]));
    porId[ID_L].dias.forEach((d, i) => {
      if (d.dia !== 6) expect(d.comida).toBe(L.days[i].meals.find((m) => m.time === 'Comida').title);
      expect(d.cena).toBe(L.days[i].meals.find((m) => m.time === 'Cena').title);
    });
    porId[ID_E].dias.forEach((d, i) => {
      if (d.dia !== 6) expect(d.comida).toBe(E.days[i].meals.find((m) => m.momento === 'comida').dish.nombre);
      expect(d.cena).toBe(E.days[i].meals.find((m) => m.momento === 'cena').dish.nombre);
    });
  });
});

describe('integración — la vista del evaluador no lleva origen ni material excluido', () => {
  it('sin ids, sin nombres de motor, sin claves propias de los motores', () => {
    const out = serialize(blind(items(), 1).evaluador);
    for (const prohibido of [
      ID_L, ID_E, 'legacy', 'engine2', 'buildPlan', 'materialize',
      '"title"', '"dish"', '"nombre"', '"time"', '"momento"', '"emoji"', '"recipe"', '"shopping"',
      '"metadata"', '"_spec"', 'decisionLog', 'weekScore', 'weekWarnings', 'weekProblems', 'strategy',
    ]) {
      expect(out, `aparece ${prohibido}`).not.toContain(prohibido);
    }
  });

  it('la comida del día 6 de ambos planes no aparece (en el R-0: «Comida libre» de un plan)', () => {
    const out = serialize(blind(items(), 1).evaluador);
    expect(out).not.toContain('Comida libre');
    const tituloL = rawLegacy().days[5].meals.find((m) => m.time === 'Comida').title;
    const nombreE = rawEngine2().days[5].meals.find((m) => m.momento === 'comida').dish.nombre;
    expect(out).not.toContain(JSON.stringify(tituloL));
    expect(out).not.toContain(JSON.stringify(nombreE));
  });

  it('sin desayunos de legacy', () => {
    const out = serialize(blind(items(), 1).evaluador);
    for (const day of rawLegacy().days) {
      for (const meal of day.meals.filter((m) => m.time === 'Desayuno')) {
        expect(out).not.toContain(JSON.stringify(meal.title));
      }
    }
  });
});

describe('integración — el módulo ciego solo recibe { id, view }', () => {
  it('rechaza un plan crudo de cualquier motor como vista', () => {
    expect(() => blind([{ id: 'x', view: rawLegacy() }], 1)).toThrow(/claves/);
    expect(() => blind([{ id: 'x', view: rawEngine2() }], 1)).toThrow(/claves/);
  });

  it('rechaza cualquier campo de origen añadido al item', () => {
    const [l] = items();
    expect(() => blind([{ ...l, motor: 'legacy' }], 1)).toThrow(/claves/);
  });

  it('la vista del evaluador no depende de los ids (intercambio y renombrado)', () => {
    const base = items();
    const swapped = [{ id: ID_E, view: base[0].view }, { id: ID_L, view: base[1].view }];
    const renamed = [{ id: 'q', view: base[0].view }, { id: 'r', view: base[1].view }];
    const ref = serialize(blind(base, 42).evaluador);
    expect(serialize(blind(swapped, 42).evaluador)).toBe(ref);
    expect(serialize(blind(renamed, 42).evaluador)).toBe(ref);
  });

  it('el código del módulo ciego no importa nada ni nombra claves de ningún motor ni el día libre', () => {
    const src = fs.readFileSync(BLIND_SRC, 'utf8');
    expect(src).not.toMatch(/^\s*import\s/m);
    expect(src).not.toMatch(/\brequire\s*\(/);
    expect(src).not.toMatch(/\bimport\s*\(/);
    for (const palabra of ['title', 'dish', 'nombre', 'time', 'legacy', 'engine2', 'buildPlan', 'materializePlan', 'decisionLog', 'weekScore', 'weekWarnings', 'libre', 'special', 'fixedRole']) {
      expect(src, `aparece ${palabra}`).not.toMatch(new RegExp(`\\b${palabra}\\b`));
    }
  });
});
