// Tests del adaptador estructural de legacy (D-086, punto 3).
// Fixture: salida cruda versionada del R-0 (no se ejecuta el motor).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toEvalView, canonicalMomento } from '../evalView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.resolve(__dirname, '../../../docs/evidence/protocolo-evaluacion/out/r0-buildPlan-run1.raw.json');
const loadRaw = () => JSON.parse(fs.readFileSync(RAW, 'utf8'));

describe('evalView legacy — sobre la salida del R-0', () => {
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

  it('emite todos los momentos que trae el plan, en vocabulario canónico', () => {
    const view = toEvalView(loadRaw());
    for (const day of view.days) {
      expect(day.meals.map((m) => m.momento)).toEqual(['desayuno', 'comida', 'cena']);
    }
  });

  it('plato es meal.title literal, en el mismo orden', () => {
    const raw = loadRaw();
    const view = toEvalView(raw);
    raw.days.forEach((day, i) => {
      day.meals.forEach((meal, j) => {
        expect(view.days[i].meals[j].plato).toBe(meal.title);
      });
    });
  });

  it('no muta el plan recibido', () => {
    const raw = loadRaw();
    const before = JSON.stringify(raw);
    toEvalView(raw);
    expect(JSON.stringify(raw)).toBe(before);
  });
});

describe('evalView legacy — normalización de momento y fallos', () => {
  it('canonicalMomento: minúsculas, sin tildes, espacios -> _', () => {
    expect(canonicalMomento('Comida')).toBe('comida');
    expect(canonicalMomento('Media mañana')).toBe('media_manana');
  });

  it('no normaliza el plato', () => {
    const plan = { days: [{ meals: [{ time: 'Cena', title: '  Ñoquis CON Tomate  ' }] }] };
    expect(toEvalView(plan).days[0].meals[0].plato).toBe('  Ñoquis CON Tomate  ');
  });

  it('lanza si falta title o time', () => {
    expect(() => toEvalView({ days: [{ meals: [{ time: 'Cena' }] }] })).toThrow(/title/);
    expect(() => toEvalView({ days: [{ meals: [{ title: 'X' }] }] })).toThrow(/time/);
    expect(() => toEvalView({})).toThrow(/days/);
  });
});
