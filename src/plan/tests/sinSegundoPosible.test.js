// Segunda revisión, A1 (2026-11-16): si el perfil no tiene ningún segundo posible (por ejemplo, omnívoro sin carne
// ni ave), no se sortean días de legumbre y D-024 sigue como antes, con su causa en el log. Sin segundo, los días
// sorteados dejaban la legumbre como plato único, con menos proteína.
import { describe, it, expect } from 'vitest';
import { generarPlan as generarPlanSinInterruptor, platosRecientesPara } from '../generarPlan.js';
import { sortearDiasLegumbre } from '../../engine2/walk/legumbre.js';
import { loadCatalog } from '../../engine2/dishes/loadCatalog.js';
import { esSegundoDeLegumbre } from '../../engine2/dishes/bases.js';
import { DAYS_ORDER } from '../../engine2/skeleton/days.js';
import { MOMENTOS } from '../../engine2/dishes/schema.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
// Paso 8: la regla de D-116 y D-117 está apagada por defecto (interruptor reglaLegumbre).
// Estos tests prueban su código, así que la encienden.
const generarPlan = (a0, a1, opts = {}) => generarPlanSinInterruptor(a0, a1, { reglaLegumbre: true, ...opts });

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const M62 = { ...BASE, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] };
const SIN_CARNE_NI_AVE = { ...M62, eliminatedFoods: ['pollo', 'pavo', 'ternera', 'cerdo', 'conejo', 'jamón', 'lacón', 'guanciale'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));

describe('sin ningún segundo posible no se sortean días de legumbre (A1)', { timeout: 120000 }, () => {
  it('en el motor: un catálogo sin segundos no sortea y lo dice el log', () => {
    const catalog = loadCatalog().filter((d) => !esSegundoDeLegumbre(d));
    const huecos = DAYS_ORDER.flatMap((day) => MOMENTOS.map((momento) => ({ day, momento, abierto: true, ...(day === 'Sabado' ? { fixedRole: 'libre' } : {}) })));
    const log = [];
    const r = sortearDiasLegumbre({ p1aSlots: huecos, catalog, vetoedIds: new Set(), seed: 'a1', registrar: (causa, evidencia, extra) => log.push({ causa, evidencia, ...extra }) });
    expect(r).toBeNull();
    const e = log.find((x) => x.causa === 'dias_legumbre_sin_sorteo');
    expect(e).toBeTruthy();
    expect(e.evidencia).toMatch(/ningun plato que valga de segundo/);
  });

  it('en la app: el perfil sin carne ni ave no sortea días, no tiene comidas dobles y sigue con D-024', () => {
    let ant = null;
    for (let w = 60; w < 66; w++) {
      const p = generarPlan(clonar(SIN_CARNE_NI_AVE), 2000, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: 'a1-sin-carne-ave', saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, w - 1, w) });
      ant = p;
      expect(p.motor).toBe('engine2');
      expect(p.decisionLog.some((e) => e.causa === 'dias_legumbre_sorteados')).toBe(false);
      expect(p.decisionLog.some((e) => e.causa === 'dias_legumbre_sin_sorteo')).toBe(true);
      expect(p.days.every((d) => d.meals.every((m) => !m || !m._dishId2))).toBe(true);
    }
  });
});
