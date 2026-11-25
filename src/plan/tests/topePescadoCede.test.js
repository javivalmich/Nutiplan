// El tope semanal de pescado y marisco cede si aplicarlo obligaría a una infracción de D-099.3 (la misma especie el
// mismo día, en días seguidos o más de 2 veces por semana). Decisión de Javi del 2026-11-16, para el valor por
// defecto y para el que elija el usuario. Caso conocido: sibo-2000 (sin legumbre ni red de D-116.5), con el tope de 3
// servía conejo en la comida y en la cena del domingo (semanas 106 y 135).
import { describe, it, expect } from 'vitest';
import { generarPlan, platosRecientesPara } from '../generarPlan.js';
import { catalogoApp } from '../catalogo.js';
import { aplicarAjustesD099 } from '../../engine2/dishes/ajustesD099.js';
import { proteinaPrincipal, ESPECIES_PESCADO_MARISCO } from '../../engine2/dishes/bases.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const SIBO = { ...BASE, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'], intolerances: ['sibo'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const porId = new Map(aplicarAjustesD099(catalogoApp()).map((d) => [d.id, d]));
const especie = (id) => (porId.has(id) ? proteinaPrincipal(porId.get(id)) : null);

/** Especies servidas por día (comida, segundo y cena; sin la sugerencia de la comida libre). */
function especiesPorDia(plan) {
  return plan.days.map((d) => d.meals.filter((m) => m && (m.time === 'Comida' || m.time === 'Cena') && !m.sugerencia)
    .flatMap((m) => [m._dishId, m._dishId2].filter(Boolean)).map(especie).filter(Boolean));
}
/** Infracciones de D-099.3 por especie: el mismo día, en días seguidos y más de 2 por semana. */
function infracciones(plan) {
  const dias = especiesPorDia(plan);
  const out = [];
  dias.forEach((esp, i) => {
    const dobles = esp.filter((e, k) => esp.indexOf(e) !== k);
    if (dobles.length) out.push(`${plan.days[i].name}: ${dobles.join(', ')} dos veces`);
    if (i < dias.length - 1) for (const e of new Set(esp)) if (dias[i + 1].includes(e)) out.push(`${e} en ${plan.days[i].name} y ${plan.days[i + 1].name}`);
  });
  const cuenta = {};
  for (const e of dias.flat()) cuenta[e] = (cuenta[e] || 0) + 1;
  for (const [e, n] of Object.entries(cuenta)) if (n > 2) out.push(`${e} ${n} veces`);
  return out;
}

describe('el tope de pescado cede ante una infracción de D-099.3 (sibo-2000)', { timeout: 300000 }, () => {
  const semanas = [];
  let ant = null;
  for (let w = 60; w <= 140; w++) {
    const p = generarPlan(clonar(SIBO), 2000, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: 'banco-sibo-2000', saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, w - 1, w) });
    semanas.push({ w, p });
    ant = p;
  }

  it('ninguna semana incumple D-099.3 por especie (antes, las semanas 106 y 135)', () => {
    expect(semanas.flatMap(({ w, p }) => infracciones(p).map((x) => `semana ${w}: ${x}`))).toEqual([]);
  });

  it('el tope cede alguna vez, con su causa, y solo entonces la semana pasa de 3 platos de pescado', () => {
    const ceden = semanas.filter(({ p }) => p.decisionLog.some((e) => e.causa === 'tope_pescado_semana_cede_d099'));
    expect(ceden.length).toBeGreaterThan(0);
    for (const { w, p } of semanas) {
      const pescados = especiesPorDia(p).flat().filter((e) => ESPECIES_PESCADO_MARISCO.has(e)).length;
      if (!ceden.some((x) => x.w === w)) expect([w, pescados <= 3]).toEqual([w, true]);
    }
    const e = ceden[0].p.decisionLog.find((x) => x.causa === 'tope_pescado_semana_cede_d099');
    expect(e.evidencia).toMatch(/D-099\.3/);
  });
});
