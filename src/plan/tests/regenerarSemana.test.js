// «Regenerar plan» de la semana entera, con engine2 (D-123, que revierte D-102).
// Misma semana: la semilla es semana + contador de regeneraciones, y los platos de la semana anterior y los del
// plan actual se evitan (filtro). Si con eso un hueco se queda sin platos, la red de D-107 (vaciar recientes y
// luego permitir repeticiones), para todas las dietas. Nunca el motor viejo de reserva.
import { describe, it, expect } from 'vitest';
import { generarPlan, platosRecientesPara, regenerarSemana } from '../generarPlan.js';
import { intoleranciasDe, metaEngine2 } from '../engine2App.js';
import { eliminadoEn } from '../eliminados.js';
import { catalogoApp } from '../catalogo.js';
import { esPescadoOMarisco } from '../../engine2/dishes/bases.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const H74 = { ...BASE, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes', 'Jueves'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const opts = (userId, w) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId, saveMealMemory: () => {} });
// El plan como lo guarda la base de datos (solo los días y los campos de display).
const recargar = (p) => clonar({ days: p.days, strategy: p.strategy, weekWarnings: p.weekWarnings, weekScore: p.weekScore, weekProblems: p.weekProblems });

// Semana 60 de un usuario y su semana 61 (la «actual»), como en la app.
function semanaActual(perfil, userId) {
  const s60 = generarPlan(clonar(perfil), 2200, opts(userId, 60));
  const s61 = generarPlan(clonar(perfil), 2200, { ...opts(userId, 61), platosRecientes: platosRecientesPara(s60, 60, 61) });
  return { s60, s61 };
}
const regenerar = (plan, perfil, userId) => regenerarSemana(recargar(plan), clonar(perfil), 2200, opts(userId, 61));
const comidasYCenas = (plan) => plan.days.flatMap((d) => d.meals.filter((m) => m && (m.time === 'Comida' || m.time === 'Cena')));
const titulos = (plan) => comidasYCenas(plan).map((m) => m.title);
const textoDe = (m) => [m.title, m.p1, m.p2, ...(m.shopping || []), ...((m.recipe || []).filter((x) => typeof x === 'string'))].filter(Boolean).join(' · ');

describe('regenerar la semana entera con engine2', { timeout: 300000 }, () => {
  it('el plan regenerado es distinto del actual y no repite sus platos', () => {
    const { s60, s61 } = semanaActual(H74, 'regen-h74');
    const r = regenerar(s61, H74, 'regen-h74');
    expect(r.ok).toBe(true);
    expect(r.plan.motor).toBe('engine2');
    expect(titulos(r.plan)).not.toEqual(titulos(s61));
    const actuales = new Set(s61.platosSemana);
    expect(r.plan.platosSemana.filter((p) => actuales.has(p))).toEqual([]);
    // Ni los de la semana anterior (D-099.3.d).
    const anteriores = new Set(s60.platosSemana);
    expect(r.plan.platosSemana.filter((p) => anteriores.has(p))).toEqual([]);
  });

  it('misma entrada, mismo resultado (byte a byte)', () => {
    const { s61 } = semanaActual(H74, 'regen-h74');
    const a = regenerar(s61, H74, 'regen-h74');
    const b = regenerar(s61, H74, 'regen-h74');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('tres pulsaciones seguidas dan tres planes distintos entre sí y del original; misma semana y contador, mismo plan', () => {
    const { s61 } = semanaActual(H74, 'regen-h74');
    const r1 = regenerar(s61, H74, 'regen-h74');
    const r2 = regenerar(r1.plan, H74, 'regen-h74');
    const r3 = regenerar(r2.plan, H74, 'regen-h74');
    for (const r of [r1, r2, r3]) expect(r.ok).toBe(true);
    expect([r1, r2, r3].map((r) => metaEngine2(recargar(r.plan)).regeneraciones)).toEqual([1, 2, 3]);
    const firmas = [s61, r1.plan, r2.plan, r3.plan].map((p) => JSON.stringify(titulos(p)));
    expect(new Set(firmas).size).toBe(4);
    // Mismo contador (regenerar otra vez desde el mismo plan): mismo plan.
    expect(JSON.stringify(regenerar(r1.plan, H74, 'regen-h74'))).toBe(JSON.stringify(r2));
  });

  it('la semana anterior sigue siendo la de verdad, y la siguiente vuelve a contar desde 0', () => {
    const { s60, s61 } = semanaActual(H74, 'regen-h74');
    const r = regenerar(s61, H74, 'regen-h74');
    const meta = metaEngine2(recargar(r.plan));
    expect(meta.platosSemanaAnterior).toEqual(platosRecientesPara(s60, 60, 61));
    expect(platosRecientesPara(recargar(r.plan), 61, 61)).toEqual(platosRecientesPara(s60, 60, 61));
    // La semana siguiente evita los platos del plan regenerado, y no lleva contador.
    expect(platosRecientesPara(recargar(r.plan), 61, 62)).toEqual([...r.plan.platosSemana, ...r.plan.desayunosSemana]);
    const s62 = generarPlan(clonar(H74), 2200, { ...opts('regen-h74', 62), platosRecientes: platosRecientesPara(recargar(r.plan), 61, 62) });
    expect(metaEngine2(recargar(s62)).regeneraciones).toBeUndefined();
  });

  it('la primera generación no cambia: sin contador en el plan', () => {
    const { s61 } = semanaActual(H74, 'regen-h74');
    expect(s61.days[0]._engine2.regeneraciones).toBeUndefined();
  });

  it('respeta intolerancias, dieta y alimentos eliminados', () => {
    const casos = [
      { ...H74, intolerances: ['gluten', 'lactosa', 'huevo'] },
      { ...H74, intolerances: ['frutos_secos', 'mariscos', 'soja'] },
      { ...H74, intolerances: ['sibo'] },
      { ...H74, dieta: 'vegetariana' },
      { ...H74, eliminatedFoods: ['pollo', 'salmón', 'judías'] },
    ];
    casos.forEach((perfil, i) => {
      const uid = `regen-seg-${i}`;
      const { s61 } = semanaActual(perfil, uid);
      const r = regenerar(s61, perfil, uid);
      expect(r.ok, JSON.stringify(perfil.intolerances)).toBe(true);
      for (const d of r.plan.days) for (const m of d.meals) {
        if (!m) continue;
        expect(intoleranciasDe(m, perfil), `${d.name} ${m.time}: ${m.title}`).toEqual([]);
        for (const e of perfil.eliminatedFoods) expect(eliminadoEn(textoDe(m), e), `${e} en ${d.name} ${m.title}`).toBe(false);
      }
    });
  });

  it('respeta el tope de pescado del perfil', () => {
    const porId = new Map(catalogoApp().map((d) => [d.id, d]));
    const pescados = (plan) => comidasYCenas(plan).filter((m) => !m.sugerencia)
      .reduce((a, m) => a + [m._dishId, m._dishId2].filter((id) => id && porId.has(id) && esPescadoOMarisco(porId.get(id))).length, 0);
    const relajado = (p) => p.decisionLog.some((e) => e.causa === 'tope_pescado_semana_sin_aplicar' || e.causa === 'tope_pescado_semana_cede_d099');
    for (const tope of [2, 3]) {
      const perfil = { ...H74, pescadoMaxSemana: tope };
      const { s61 } = semanaActual(perfil, `regen-pescado-${tope}`);
      let plan = s61;
      for (let k = 0; k < 3; k++) {
        const r = regenerar(plan, perfil, `regen-pescado-${tope}`);
        expect(r.ok).toBe(true);
        expect(r.plan.decisionLog.find((e) => e.causa === 'tope_pescado_semana_fijado').tope).toBe(tope);
        if (!relajado(r.plan)) expect(pescados(r.plan)).toBeLessThanOrEqual(tope);
        plan = r.plan;
      }
    }
  });

  it('con un perfil muy restringido no queda ningún hueco vacío (red de D-107)', () => {
    const perfil = { ...H74, dieta: 'vegana', intolerances: ['gluten', 'soja', 'legumbres', 'frutos_secos', 'sibo'] };
    const { s61 } = semanaActual(perfil, 'regen-restringido');
    let plan = s61;
    for (let k = 0; k < 3; k++) {
      const r = regenerar(plan, perfil, 'regen-restringido');
      expect(r.ok).toBe(true);
      expect(r.plan.motor).toBe('engine2');
      for (const d of r.plan.days) {
        for (const t of ['Comida', 'Cena']) {
          const m = d.meals.find((x) => x && x.time === t);
          expect(m && m.title, `${d.name} ${t}`).toBeTruthy();
        }
        for (const m of d.meals) if (m) expect(intoleranciasDe(m, perfil), `${d.name} ${m.title}`).toEqual([]);
      }
      plan = r.plan;
    }
  });
});
