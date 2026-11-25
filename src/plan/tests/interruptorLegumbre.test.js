// Paso 8 de la legumbre como guarnición: D-116 y D-117 apagadas con un
// interruptor (reglaLegumbre), sin borrar su código. Apagado por defecto.
import { describe, it, expect } from 'vitest';
import { generarPlan, platosRecientesPara, regenerarComida, recalcularDia } from '../generarPlan.js';
import { esComidaDoble } from '../textos/comidaDoble.js';
import { leerComida } from '../medidor/leerComida.js';
import { materializePlan } from '../../engine2/materializePlan.js';
import { catalogoApp } from '../catalogo.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const H74 = { ...BASE, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const optsDe = (userId, w, extra = {}) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId, saveMealMemory: () => {}, ...extra });

function semanas(extra, n = 4) {
  const out = [];
  let ant = null;
  for (let w = 60; w < 60 + n; w++) {
    const plan = generarPlan(clonar(H74), 2174, { ...optsDe('interruptor', w, extra), platosRecientes: platosRecientesPara(ant, w - 1, w) });
    out.push(plan);
    ant = plan;
  }
  return out;
}
const causas = (plan) => (plan.decisionLog || []).map((e) => e.causa);
const dobles = (plan) => plan.days.flatMap((d, i) => d.meals.filter((m) => m && esComidaDoble(m)).map((m) => ({ i, m })));

describe('interruptor de la regla de legumbre (paso 8)', { timeout: 240000 }, () => {
  const apagada = semanas({});
  const encendida = semanas({ reglaLegumbre: true });

  it('por defecto está apagada: sin sorteo de días, sin segundos, sin comida doble y con su causa en el log', () => {
    for (const plan of apagada) {
      const c = causas(plan);
      expect(c.filter((x) => x === 'regla_legumbre_apagada')).toHaveLength(1);
      expect(c).not.toContain('dias_legumbre_sorteados');
      expect(c).not.toContain('dias_legumbre_sin_sorteo');
      expect(c.some((x) => typeof x === 'string' && x.startsWith('regla_legumbre_retirada'))).toBe(false);
      expect(dobles(plan)).toEqual([]);
      expect(plan.days.every((d) => d.meals.every((m) => !m || !m._dishId2))).toBe(true);
    }
  });

  it('la causa va al empezar el walk, antes de elegir ningún plato', () => {
    const log = apagada[0].decisionLog;
    const k = log.findIndex((e) => e.causa === 'regla_legumbre_apagada');
    const primeraEleccion = log.findIndex((e) => e.day && e.momento && typeof e.decisionId === 'string' && e.decisionId.startsWith('walk-select'));
    expect(k).toBeGreaterThanOrEqual(0);
    expect(primeraEleccion).toBeGreaterThan(k);
  });

  it('con reglaLegumbre: true el código de D-116 y D-117 sigue actuando', () => {
    expect(encendida.some((p) => causas(p).includes('dias_legumbre_sorteados'))).toBe(true);
    expect(encendida.some((p) => dobles(p).length > 0)).toBe(true);
    expect(encendida.every((p) => !causas(p).includes('regla_legumbre_apagada'))).toBe(true);
  });

  it('materializePlan también lleva el interruptor, apagado por defecto', () => {
    const input = { profile: { trainingDays: [], intolerances: [], dieta: 'omnivora' }, seed: 'interruptor:60', strategy: 'mixto', catalog: catalogoApp() };
    const sin = materializePlan(input);
    const con = materializePlan({ ...input, reglaLegumbre: true });
    expect(sin.decisionLog.map((e) => e.causa)).toContain('regla_legumbre_apagada');
    expect(con.decisionLog.map((e) => e.causa)).not.toContain('regla_legumbre_apagada');
  });

  it('las alternativas leen el mismo interruptor: apagado, un plato único puede cambiarse por un compuesto de legumbre', () => {
    const plan = apagada[0];
    const i = plan.days.findIndex((d) => d.meals.some((m) => m && m.time === 'Comida' && m._dishId));
    const sin = regenerarComida(clonar(plan), i, 'Comida', 'diferente', clonar(H74), 2174, optsDe('interruptor', 60));
    const con = regenerarComida(clonar(plan), i, 'Comida', 'diferente', clonar(H74), 2174, optsDe('interruptor', 60, { reglaLegumbre: true }));
    expect(causas(sin)).not.toContain('alternativa_sin_legumbre_compuesta');
    expect(causas(con)).toContain('alternativa_sin_legumbre_compuesta');
  });
});

describe('un plan guardado con comida doble se sigue leyendo, racionando y regenerando igual', { timeout: 240000 }, () => {
  const plan = semanas({ reglaLegumbre: true }).find((p) => dobles(p).length > 0);
  const [{ i, m }] = dobles(plan);
  const guardado = { days: clonar(plan.days) };

  it('se lee igual: los dos platos y los mismos gramos', () => {
    const antes = leerComida(m);
    const despues = leerComida(guardado.days[i].meals.find((x) => x.time === 'Comida'));
    expect(despues).toEqual(antes);
    expect(antes.items.some((it) => it.plato === 2)).toBe(true);
  });

  it('se raciona igual: recalcular el día deja la comida doble como estaba', () => {
    const g = clonar(guardado);
    const r = recalcularDia(g, g.days[i], clonar(H74), 2174);
    const comida = r.meals.find((x) => x.time === 'Comida');
    expect(esComidaDoble(comida)).toBe(true);
    expect(comida.shopping).toEqual(m.shopping);
    expect(comida._dishId2).toBe(m._dishId2);
  });

  it('se regenera igual con la regla apagada que encendida', () => {
    const sin = regenerarComida(clonar(guardado), i, 'Comida', 'diferente', clonar(H74), 2174, optsDe('interruptor', 60));
    const con = regenerarComida(clonar(guardado), i, 'Comida', 'diferente', clonar(H74), 2174, optsDe('interruptor', 60, { reglaLegumbre: true }));
    expect(sin).toEqual(con);
    expect(causas(sin)).toContain('alternativa_sin_legumbre_compuesta');
    expect(causas(sin)).toContain('alternativa_retira_segundo');
  });
});
