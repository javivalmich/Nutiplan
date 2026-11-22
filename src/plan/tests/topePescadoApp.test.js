// Tope semanal de pescado y marisco en la app (2026-11-16): engine2App pasa pescadoMaxSemana al perfil reducido
// solo si el perfil lo trae; sin él, el motor usa 3. Las alternativas lo respetan. SIBO incluido.
import { describe, it, expect } from 'vitest';
import { generarPlan, platosRecientesPara, regenerarComida } from '../generarPlan.js';
import { catalogoApp } from '../catalogo.js';
import { esPescadoOMarisco } from '../../engine2/dishes/bases.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const M62 = { ...BASE, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const porId = new Map(catalogoApp().map((d) => [d.id, d]));
const opts = (userId, w) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId, saveMealMemory: () => {} });
const pescadoDe = (m) => [m._dishId, m._dishId2].filter(Boolean).filter((id) => porId.has(id) && esPescadoOMarisco(porId.get(id))).length;
const pescados = (plan) => plan.days.reduce((a, d) => a + d.meals.filter((m) => m && (m.time === 'Comida' || m.time === 'Cena') && !m.sugerencia).reduce((b, m) => b + pescadoDe(m), 0), 0);
function semanas(perfil, userId, n) {
  const out = [];
  let ant = null;
  for (let w = 60; w < 60 + n; w++) {
    const p = generarPlan(clonar(perfil), 2000, { ...opts(userId, w), platosRecientes: platosRecientesPara(ant, w - 1, w) });
    out.push({ p, w });
    ant = p;
  }
  return out;
}
// El tope no se aplica si dejaría el hueco sin candidatos, y cede si obligaría a una infracción de D-099.3.
const relajado = (p) => p.decisionLog.some((e) => e.causa === 'tope_pescado_semana_sin_aplicar' || e.causa === 'tope_pescado_semana_cede_d099');
const fijado = (p) => p.decisionLog.find((e) => e.causa === 'tope_pescado_semana_fijado');

describe('tope de pescado y marisco en la app', { timeout: 300000 }, () => {
  it('sin el campo: como mucho 3 por semana, y el log dice que es el valor por defecto', () => {
    for (const { p } of semanas(M62, 'banco-sin-lactosa-2000', 6)) {
      expect(p.motor).toBe('engine2');
      if (!relajado(p)) expect(pescados(p)).toBeLessThanOrEqual(3);
      expect(fijado(p).evidencia).toMatch(/por defecto/);
    }
  });

  it('con pescadoMaxSemana 2 en el perfil de la app: como mucho 2', () => {
    for (const { p } of semanas({ ...M62, pescadoMaxSemana: 2 }, 'banco-sin-lactosa-2000', 6)) {
      expect(p.motor).toBe('engine2');
      if (!relajado(p)) expect(pescados(p)).toBeLessThanOrEqual(2);
      expect(fijado(p).tope).toBe(2);
    }
  });

  it('SIBO: como mucho 3 sin el campo y 2 con tope de 2', () => {
    const sibo = { ...M62, intolerances: ['sibo'] };
    for (const [perfil, tope] of [[sibo, 3], [{ ...sibo, pescadoMaxSemana: 2 }, 2]]) {
      for (const { p } of semanas(perfil, 'banco-sibo-2000', 6)) {
        expect(p.motor).toBe('engine2');
        if (!relajado(p)) expect(pescados(p)).toBeLessThanOrEqual(tope);
        expect(fijado(p).tope).toBe(tope);
      }
    }
  });

  it('las alternativas respetan el tope: con la semana ya en el tope, el plato nuevo no es pescado', () => {
    let casos = 0;
    const perfil = { ...M62, pescadoMaxSemana: 2 };
    for (const { p, w } of semanas(perfil, 'banco-sin-lactosa-2000', 8)) {
      if (pescados(p) < 2) continue;
      p.days.forEach((d, i) => {
        const m = d.meals.find((x) => x && x.time === 'Cena' && x._dishId);
        if (!m || pescadoDe(m)) return;
        const n = regenerarComida(p, i, 'Cena', 'ligero', clonar(perfil), 2000, opts('banco-sin-lactosa-2000', w));
        if (!n || n.alternativaSinCambio) return;
        const log = n.decisionLog.filter((e) => e.deseo === 'ligero');
        if (log.some((e) => e.causa === 'alternativa_tope_pescado_sin_aplicar')) return;
        casos += 1;
        expect(log.some((e) => e.causa === 'alternativa_tope_pescado')).toBe(true);
        expect(pescadoDe(n.days[i].meals.find((x) => x && x.time === 'Cena'))).toBe(0);
      });
    }
    expect(casos).toBeGreaterThan(5);
  });
});
