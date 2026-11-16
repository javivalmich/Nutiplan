// Revisión independiente, arreglo 4 (2026-11-17): una comida con _dishId2 pero sin los datos de sus dos platos
// (_doble ausente o incompleto: un plan guardado a medias, editado a mano o de otra versión) se trata como texto
// libre: no se vuelve a racionar (se queda como está) y deja su causa en el log. Las demás comidas del día sí.
import { describe, it, expect } from 'vitest';
import { generarPlan } from '../generarPlan.js';
import { ajustarDia } from '../racionesApp.js';
import { esComidaDoble } from '../textos/comidaDoble.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const H74 = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const plan = generarPlan(clonar(H74), 2174, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 60, userId: 'banco-omni-2174', saveMealMemory: () => {}, platosRecientes: [] });
const dia = plan.days.find((d) => d.meals.some((m) => m && esComidaDoble(m)));
const k = dia.meals.findIndex((m) => m && esComidaDoble(m));

const ROTAS = {
  'sin _doble ni _base': (m) => { delete m._doble; delete m._base; },
  'sin el segundo': (m) => { delete m._doble.segundo; delete m._base; },
  'con un plato sin _componer': (m) => { delete m._doble.primero._componer; delete m._base; },
  'con _base también rota': (m) => { delete m._doble; delete m._base._doble; },
};

describe('comida con _dishId2 y _doble incompleto', () => {
  it('el caso existe', () => {
    expect(k).toBeGreaterThanOrEqual(0);
  });

  for (const [nombre, romper] of Object.entries(ROTAS)) {
    it(`${nombre}: se queda como está, con su causa en el log, y el resto del día se raciona`, () => {
      const meals = clonar(dia.meals);
      romper(meals[k]);
      expect(esComidaDoble(meals[k])).toBe(false);
      const antes = clonar(meals[k]);
      const r = ajustarDia({ ...dia, meals }, clonar(H74), 2174);
      expect(r.day.meals[k]).toEqual(antes);
      expect(r.log.some((e) => e.causa === 'comida_doble_incompleta_texto_libre')).toBe(true);
      r.day.meals.forEach((m, j) => { if (m && j !== k && m.time !== 'Comida') expect(m.nutricion).toBeTruthy(); });
    });
  }
});
