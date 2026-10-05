// Tests del adaptador estructural de engine2 (D-086, punto 3).
// Fixture: salida cruda versionada del R-0 (no se ejecuta el motor).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toEvalView } from '../evalView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.resolve(__dirname, '../../../docs/evidence/protocolo-evaluacion/out/r0-materializePlan.raw.json');
const loadRaw = () => JSON.parse(fs.readFileSync(RAW, 'utf8'));

describe('evalView engine2 — sobre la salida del R-0', () => {
  it('emite 7 días con la forma exacta del contrato común', () => {
    const view = toEvalView(loadRaw());
    expect(Object.keys(view)).toEqual(['days']);
    expect(view.days).toHaveLength(7);
    for (const day of view.days) {
      expect(Object.keys(day)).toEqual(['meals']);
      for (const meal of day.meals) {
        expect(Object.keys(meal)).toEqual(['momento', 'plato']);
      }
    }
  });

  it('momento pasa tal cual', () => {
    const view = toEvalView(loadRaw());
    for (const day of view.days) {
      expect(day.meals.map((m) => m.momento)).toEqual(['comida', 'cena']);
    }
  });

  it('plato es meal.dish.nombre literal, en el mismo orden', () => {
    const raw = loadRaw();
    const view = toEvalView(raw);
    raw.days.forEach((day, i) => {
      day.meals.forEach((meal, j) => {
        expect(view.days[i].meals[j].plato).toBe(meal.dish.nombre);
      });
    });
  });

  it('no muta el plan recibido', () => {
    const raw = loadRaw();
    const before = JSON.stringify(raw);
    toEvalView(raw);
    expect(JSON.stringify(raw)).toBe(before);
  });

  it('lanza si falta dish.nombre o momento', () => {
    expect(() => toEvalView({ days: [{ meals: [{ momento: 'cena', dish: {} }] }] })).toThrow(/dish\.nombre/);
    expect(() => toEvalView({ days: [{ meals: [{ dish: { nombre: 'X' } }] }] })).toThrow(/momento/);
    expect(() => toEvalView({})).toThrow(/days/);
  });
});
