// Tope semanal de pescado y marisco (perfil pescadoMaxSemana, de 2 a 4; 3 si no viene; 2026-11-16). Pescado y
// marisco como una familia, por especie (también los platos de cereal con atún o gambas). En cada hueco, si la
// semana ya llega al tope, el pescado sale del pool justo después del tope por especie, con vuelta atrás si dejaría
// el hueco sin candidatos; las dos cosas dejan su causa en el log. El suelo de pescado del paso 4 es el menor entre
// 3 y el tope, y el log lo dice. Los segundos de la comida doble nunca son pescado: no aplica.
import { describe, it, expect } from 'vitest';
import { materializePlan } from '../../materializePlan.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { esPescadoOMarisco } from '../../dishes/bases.js';

const catalog = loadCatalog();
const porId = new Map(catalog.map((d) => [d.id, d]));
const plan = (seed, extra = {}) => materializePlan({ profile: { trainingDays: [], ...extra }, seed, strategy: 'mantenimiento_equilibrado', catalog });
/** Platos de pescado o marisco servidos en la semana (comida, segundo y cena; no la sugerencia de la comida libre). */
const pescados = (p) => p.days.flatMap((d) => d.meals.filter((m) => !m.libre).flatMap((m) => [m.dish, m.segundo].filter(Boolean)))
  .filter((d) => esPescadoOMarisco(porId.get(d.id) || d)).length;
const SEEDS = Array.from({ length: 24 }, (_, k) => `tope-pescado-${k}`);
const CASOS = [['tope de 2', { pescadoMaxSemana: 2 }, 2], ['tope de 3', { pescadoMaxSemana: 3 }, 3], ['tope de 4', { pescadoMaxSemana: 4 }, 4], ['perfil sin el campo (vale 3)', {}, 3]];

describe('tope semanal de pescado y marisco', () => {
  for (const [nombre, extra, tope] of CASOS) {
    it(`${nombre}: ninguna semana pasa del tope, salvo con la causa de vuelta atrás`, () => {
      for (const s of SEEDS) {
        const p = plan(s, extra);
        const relajado = p.decisionLog.some((e) => e.causa === 'tope_pescado_semana_sin_aplicar' || e.causa === 'tope_pescado_semana_cede_d099');
        if (!relajado) expect([s, pescados(p) <= tope]).toEqual([s, true]);
      }
    });

    it(`${nombre}: el log dice el tope y el suelo de pescado (el menor entre 3 y el tope)`, () => {
      const p = plan(SEEDS[0], extra);
      const e = p.decisionLog.find((x) => x.causa === 'tope_pescado_semana_fijado');
      expect(e).toBeTruthy();
      expect(e.tope).toBe(tope);
      expect(e.suelo).toBe(Math.min(3, tope));
      expect(e.evidencia).toContain(`suelo de pescado ${Math.min(3, tope)}`);
      expect(e.evidencia).toContain(Object.keys(extra).length ? 'del perfil' : 'por defecto');
    });
  }

  it('el filtro actúa y deja su causa (tope de 2)', () => {
    const n = SEEDS.reduce((a, s) => a + plan(s, { pescadoMaxSemana: 2 }).decisionLog.filter((e) => e.causa === 'tope_pescado_semana').length, 0);
    expect(n).toBeGreaterThan(24);
  });

  it('con tope de 2, el paso 4 trabaja con un suelo de pescado de 2', () => {
    // La evidencia del paso 4 va dentro de la entrada del hueco: «target="pescado" corto (contador N/S)».
    const ev = SEEDS.flatMap((s) => plan(s, { pescadoMaxSemana: 2 }).decisionLog.map((e) => (e.evidencia || '').match(/target="pescado" corto \(contador \d\/(\d)\)/)).filter(Boolean));
    expect(ev.length).toBeGreaterThan(0);
    for (const m of ev) expect(m[1]).toBe('2');
    const sinTope = SEEDS.flatMap((s) => plan(s).decisionLog.map((e) => (e.evidencia || '').match(/target="pescado" corto \(contador \d\/(\d)\)/)).filter(Boolean));
    for (const m of sinTope) expect(m[1]).toBe('3');
  });

  it('un valor fuera de rango no se acepta', () => {
    expect(() => plan(SEEDS[0], { pescadoMaxSemana: 5 })).toThrow(/pescadoMaxSemana/);
  });

  it('misma semilla, mismo plan', () => {
    expect(JSON.stringify(plan('tope-pescado-3', { pescadoMaxSemana: 2 }))).toBe(JSON.stringify(plan('tope-pescado-3', { pescadoMaxSemana: 2 })));
  });
});
