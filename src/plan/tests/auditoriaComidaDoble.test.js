// Auditoría de la comida con primero y segundo (D-116): todo lo que lee o cambia una comida ya
// creada. Cada bloque es un camino de la app, con la acción del usuario que lo dispara.
// Lo que hoy se comporta mal y no se arregla en src/plan queda escrito como lo que es («hoy…»),
// para que el test avise si cambia.

import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import { generarPlan as generarPlanSinInterruptor, platosRecientesPara, recalcularDia, regenerarComida as regenerarComidaSinInterruptor, usaRaciones } from '../generarPlan.js';
import { metaEngine2 } from '../engine2App.js';
import { esComidaDoble, compraPorPlato } from '../textos/comidaDoble.js';
import { leerComida } from '../medidor/leerComida.js';
import { topeLegumbre } from '../racionesApp.js';
import { tuplaDe } from '../textos/componer.js';
import { INGREDIENTES } from '../../engine2/nutrientes/ingredientes.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
// Paso 8: la regla de D-116 y D-117 está apagada por defecto (interruptor reglaLegumbre).
// Estos tests prueban su código, así que la encienden.
const generarPlan = (a0, a1, opts = {}) => generarPlanSinInterruptor(a0, a1, { reglaLegumbre: true, ...opts });
const regenerarComida = (a0, a1, a2, a3, a4, a5, opts = {}) => regenerarComidaSinInterruptor(a0, a1, a2, a3, a4, a5, { reglaLegumbre: true, ...opts });

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const H74 = { ...BASE, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const USER = 'banco-omni-2174';
const opts = (w, extra = {}) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: USER, saveMealMemory: () => {}, ...extra });
const comidaDe = (day) => day.meals.find((m) => m && m.time === 'Comida');
const legumbre = (m) => leerComida(m).items.filter((it) => it.plato === 1 && (INGREDIENTES[it.clave] || {}).grupo === 'legumbre').reduce((a, it) => a + it.gramos, 0);
const lecturaPorPlato = (m) => { const [c1, c2] = compraPorPlato(m); return [...leerComida({ p1: m.p1, shopping: c1 }).items, ...leerComida({ p2: m.p2, shopping: c2 }).items].map((it) => `${it.clave}:${it.gramos}`); };
const lectura = (m) => leerComida(m).items.map((it) => `${it.clave}:${it.gramos}`);

// Dos semanas seguidas, como en la app (la segunda recibe los platos de la primera).
const s60 = generarPlan(clonar(H74), 2174, opts(60, { platosRecientes: [] }));
const s61 = generarPlan(clonar(H74), 2174, opts(61, { platosRecientes: platosRecientesPara(s60, 60, 61) }));
const iDoble = s61.days.findIndex((d) => esComidaDoble(comidaDe(d)));
const doble = comidaDe(s61.days[iDoble]);

// cloneAndScalePlan vive en la vista (OriginalPlanApp.jsx) y no se exporta: se lee su código tal cual.
function cloneAndScalePlanDeLaVista() {
  const fuente = fs.readFileSync(new URL('../../ui/views/OriginalPlanApp.jsx', import.meta.url), 'utf8');
  const inicio = fuente.indexOf('function cloneAndScalePlan(');
  const fin = fuente.indexOf('return cloned;', inicio);
  expect(inicio).toBeGreaterThan(0);
  expect(fin).toBeGreaterThan(inicio);
  return new Function(`${fuente.slice(inicio, fin)}return cloned;\n}\nreturn cloneAndScalePlan;`)();
}

describe('auditoría de la comida doble: caminos que la leen o la cambian', { timeout: 180000 }, () => {
  it('la semana tiene comida doble (el caso existe)', () => {
    expect(s61.motor).toBe('engine2');
    expect(iDoble).toBeGreaterThanOrEqual(0);
  });

  describe('1. Plan compartido (el amigo canjea un código): cloneAndScalePlan', () => {
    const clone = cloneAndScalePlanDeLaVista();
    const amigo = clone(clonar(s61), 2174, 1800, clonar(H74));
    const m = comidaDe(amigo.days[iDoble]);

    it('la comida doble sigue siendo doble: mismo título, mismos platos, la misma partición de la compra', () => {
      expect(esComidaDoble(m)).toBe(true);
      expect(m.title).toBe(doble.title);
      expect(m._dishId2).toBe(doble._dishId2);
      expect(compraPorPlato(m).map((x) => x.length)).toEqual(compraPorPlato(doble).map((x) => x.length));
      expect(lectura(m)).toEqual(lecturaPorPlato(m));
    });

    it('escala los gramos del texto de los dos platos (no los ml del aceite)', () => {
      const g = (t) => Number((t.match(/\((\d+) g/) || [])[1]);
      expect(g(m.p1)).toBe(Math.round(g(doble.p1) * 1800 / 2174));
      expect(g(m.p2)).toBe(Math.round(g(doble.p2) * 1800 / 2174));
      expect(m.p1.match(/AOVE \(\d+ ml\)/)[0]).toBe(doble.p1.match(/AOVE \(\d+ ml\)/)[0]);
    });

    it('hoy: el escalado no mira los rangos ni el tope, y la nutrición del día sigue siendo la del dueño (igual que en un plato único)', () => {
      // 50 g de legumbre a 2174 kcal serían 41 g a 1800 (por debajo del mínimo de 50 g).
      expect(Math.round(50 * 1800 / 2174)).toBe(41);
      expect(legumbre(m)).toBe(Math.round(legumbre(doble) * 1800 / 2174));
      expect(m.nutricion).toEqual(doble.nutricion);
    });

    it('si el amigo activa el batido, el día se vuelve a racionar desde la comida de partida, a sus calorías', () => {
      expect(usaRaciones(amigo, iDoble)).toBe(true);
      const dia = recalcularDia(amigo, { ...amigo.days[iDoble], shakeEnabled: false }, clonar(H74), 1800);
      const r = comidaDe(dia);
      expect(esComidaDoble(r)).toBe(true);
      expect(r.nutricion.objetivoKcal).toBeLessThan(doble.nutricion.objetivoKcal);
      expect(legumbre(r)).toBeGreaterThanOrEqual(50);
      expect(legumbre(r)).toBeLessThanOrEqual(topeLegumbre(tuplaDe(r._dishId)));
      expect(lectura(r)).toEqual(lecturaPorPlato(r));
    });
  });

  describe('2. Cambio de calorías o de perfil (check-in, editar el perfil y generar, nueva semana)', () => {
    it('el plan se genera entero de nuevo: mismos menús a otras calorías, y la comida doble racionada a las nuevas', () => {
      const otro = generarPlan(clonar({ ...H74, weight: 64 }), 1800, opts(61, { platosRecientes: platosRecientesPara(s60, 60, 61) }));
      const m = comidaDe(otro.days[iDoble]);
      expect(m.title).toBe(doble.title);
      expect(m.nutricion.objetivoKcal).toBeLessThan(doble.nutricion.objetivoKcal);
      expect(Math.abs(m.nutricion.kcal - m.nutricion.objetivoKcal)).toBeLessThanOrEqual(0.1 * m.nutricion.objetivoKcal);
      expect(lectura(m)).toEqual(lecturaPorPlato(m));
    });

    it('si cambian las calorías sin rehacer el plan (el batido usa las calorías del perfil de ahora), el día se raciona a las nuevas', () => {
      const r = comidaDe(recalcularDia(s61, s61.days[iDoble], clonar(H74), 2600));
      expect(esComidaDoble(r)).toBe(true);
      expect(r.nutricion.objetivoKcal).toBeGreaterThan(doble.nutricion.objetivoKcal);
      expect(legumbre(r)).toBeLessThanOrEqual(topeLegumbre(tuplaDe(r._dishId)));
    });
  });

  describe('3. Recalcular el día (activar o quitar el batido)', () => {
    it('plan de engine2: ON y OFF dejan la comida doble igual que al principio', () => {
      const perfil = { ...clonar(H74), extras: { proteinShake: { enabled: false, scoops: 1, kcalPerScoop: 120, proteinPerScoop: 24, timing: 'post_entreno' } } };
      const on = recalcularDia(s61, { ...s61.days[iDoble], shakeEnabled: true }, perfil, 2174);
      const off = recalcularDia(s61, { ...on, shakeEnabled: false }, perfil, 2174);
      expect(esComidaDoble(comidaDe(on))).toBe(true);
      expect(comidaDe(off)).toEqual(doble);
    });

    it('motor viejo (dayPortionsRegen, planes sin raciones de engine2): una comida sin _spec se conserva intacta', () => {
      const perfil = { ...clonar(H74), _regenContext: { dayPortionsRegen: { dayIdx: iDoble, meals: clonar(s61.days[iDoble].meals), shakeEnabledOverride: true } } };
      const dia = generarPlan(perfil, 2174, opts(61)).days[iDoble];
      expect(doble._spec).toBeUndefined();
      expect(comidaDe(dia)).toEqual(doble);
    });
  });

  describe('4. Lista de la compra (pestaña «Compra» de la comida)', () => {
    it('es la de los dos platos seguidos: hay líneas repetidas (ajo, cebolla) y dos de aceite, una por plato', () => {
      const [c1, c2] = compraPorPlato(doble);
      expect(doble.shopping).toEqual([...c1, ...c2]);
      expect(doble.shopping.filter((l) => /^(AOVE|Aceite)/.test(l)).length).toBe(2);
      expect(c1.some((l) => /^(AOVE|Aceite)/.test(l)) && c2.some((l) => /^(AOVE|Aceite)/.test(l))).toBe(true);
    });
  });

  describe('5. Panel del nutricionista', () => {
    it('el resumen del paciente enseña p1: con la comida doble solo se ve el primero', () => {
      // NutritionistDashboard.jsx pinta «{m.time}: {m.p1}» en el resumen de cada día.
      const segundo = doble.title.split('; de segundo, ')[1];
      expect(doble.p1).toMatch(/^De primero: /);
      expect(doble.p1.toLowerCase()).not.toContain(segundo.slice(0, 20).toLowerCase());
    });

    it('hoy: si el nutricionista quita una línea de la compra de una comida doble, la partición de la compra deja de cuadrar', () => {
      // updateMealField cambia el campo y conserva _doble (corte), _base y nutricion.
      const editada = { ...clonar(doble), shopping: doble.shopping.filter((_, k) => k !== 1) };
      expect(compraPorPlato(editada)[1][0]).not.toBe(compraPorPlato(doble)[1][0]);
      // Volver a racionar parte de _base y descarta la edición (igual que en un plato único).
      const r = comidaDe(recalcularDia(s61, { ...s61.days[iDoble], meals: s61.days[iDoble].meals.map((x) => (x === doble ? editada : x)) }, clonar(H74), 2174));
      expect(r.shopping).toEqual(doble.shopping);
    });
  });

  describe('6. Cargar un plan guardado (la base de datos solo guarda los días)', () => {
    const guardado = { days: clonar(s61.days) };

    it('la comida doble llega entera y se lee igual', () => {
      const m = comidaDe(guardado.days[iDoble]);
      expect(m).toEqual(doble);
      expect(lectura(m)).toEqual(lecturaPorPlato(m));
    });

    it('la semana siguiente no repite el segundo, recalcular el día da lo mismo y las alternativas funcionan', () => {
      expect(platosRecientesPara(guardado, 61, 62)).toEqual(platosRecientesPara(s61, 61, 62));
      expect(metaEngine2(guardado).platosSemana).toContain(doble.title.split('; de segundo, ')[1].replace(/^./, (c) => c.toUpperCase()));
      expect(comidaDe(recalcularDia(guardado, guardado.days[iDoble], clonar(H74), 2174))).toEqual(doble);
      const n = regenerarComida(guardado, iDoble, 'Comida', 'ligero', clonar(H74), 2174, opts(61));
      expect(comidaDe(n.days[iDoble])._dishId2).toBeUndefined();
    });
  });

  describe('7. Regeneración parcial del motor viejo (si engine2 no encuentra alternativa)', () => {
    // Desde el 2026-11-16, regenerarComida no devuelve null con una comida doble: la deja como está, con un
    // aviso (regenerarComidaDobleSinAlternativa.test.js), y la vista ya no llega aquí con ella. Este bloque
    // documenta lo que haría el motor viejo si llegara.
    it('si llegara: la comida doble se cambiaría por un plato del motor viejo, el segundo se perdería y seguiría en platosSemana', () => {
      // Lo que hace la vista (regenerateMeal) cuando regenerarComida devuelve null.
      const plan = clonar(s61);
      const perfil = { ...clonar(H74), _regenContext: { dayIdx: iDoble, slot: 'Comida', semanticHint: 'diferente', currentPlan: plan, excludeSpec: null } };
      const nuevo = comidaDe(generarPlan(perfil, 2174, opts(61)).days[iDoble]);
      const k = plan.days[iDoble].meals.findIndex((m) => m && m.time === 'Comida');
      plan.days[iDoble].meals[k] = nuevo;
      plan.days[iDoble] = recalcularDia(plan, plan.days[iDoble], clonar(H74), 2174);
      const m = comidaDe(plan.days[iDoble]);
      expect(m._dishId2).toBeUndefined();
      expect(m._motor).not.toBe('engine2');
      const segundo = doble.title.split('; de segundo, ')[1];
      expect(metaEngine2(plan).platosSemana.map((x) => x.toLowerCase())).toContain(segundo.toLowerCase());
    });
  });
});
