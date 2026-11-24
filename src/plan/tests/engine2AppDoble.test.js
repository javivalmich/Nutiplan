// La app monta la comida con primero y segundo (D-116; etapa 2, paso 6 de
// scripts/banco/medicion/estructura-comida.md, sección 12).
// Si el motor pone un segundo en la comida, el plan lleva las dos partes en p1 y p2, la compra de
// los dos platos y las raciones de la comida entera.

import { describe, it, expect } from 'vitest';
import { generarPlan as generarPlanSinInterruptor, platosRecientesPara, recalcularDia } from '../generarPlan.js';
import { metaEngine2, adaptarSiProcede } from '../engine2App.js';
import { esComidaDoble, compraPorPlato, componerComidaDoble, tituloDoble } from '../textos/comidaDoble.js';
import { ajustarDia } from '../racionesApp.js';
import { medirComida } from '../medidor/medir.js';
import { leerComida } from '../medidor/leerComida.js';
import { catalogoApp } from '../catalogo.js';
import { aplicarAjustesD099 } from '../../engine2/dishes/ajustesD099.js';
import { aplicarNombresD105 } from '../../engine2/dishes/alinosD105.js';
import { esCompuestoLegumbre, esSegundoDeLegumbre } from '../../engine2/dishes/bases.js';
import { COMPOSICION } from '../../engine2/nutrientes/composicion.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
// Paso 8: la regla de D-116 y D-117 está apagada por defecto (interruptor reglaLegumbre).
// Estos tests prueban su código, así que la encienden.
const generarPlan = (a0, a1, opts = {}) => generarPlanSinInterruptor(a0, a1, { reglaLegumbre: true, ...opts });

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const H74 = { ...BASE, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const CATALOGO = aplicarNombresD105(aplicarAjustesD099(catalogoApp()));
const porId = new Map(CATALOGO.map((d) => [d.id, d]));
const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const segundosDe = (plan) => (plan.decisionLog || []).filter((e) => e.causa === 'segundo_de_legumbre');
const comidaDe = (plan, dia) => plan.days[DIAS.indexOf(dia)].meals.find((m) => m && m.time === 'Comida');

function semanas(perfil, kcal, userId, n = 6) {
  const out = [];
  let ant = null;
  for (let w = 60; w < 60 + n; w++) {
    const plan = generarPlan(clonar(perfil), kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, w - 1, w) });
    out.push(plan);
    ant = plan;
  }
  return out;
}

describe('la app monta la comida doble (D-116)', { timeout: 120000 }, () => {
  const planes = semanas(H74, 2174, 'banco-omni-2174');
  const dobles = planes.flatMap((plan) => segundosDe(plan).map((e) => ({ plan, e, m: comidaDe(plan, e.day) })));

  it('hay semanas con segundos, y todas son de engine2', () => {
    expect(planes.every((p) => p.motor === 'engine2')).toBe(true);
    expect(dobles.length).toBeGreaterThanOrEqual(15);
  });

  it('cada día con segundo lleva las dos partes: el primero en p1 y el segundo en p2', () => {
    for (const { e, m } of dobles) {
      const primero = porId.get(e.primero);
      const segundo = porId.get(e.plato);
      expect(esComidaDoble(m)).toBe(true);
      expect(m._motor).toBe('engine2');
      expect(m._dishId).toBe(e.primero);
      expect(m._dishId2).toBe(e.plato);
      expect(m.title).toBe(tituloDoble(primero.nombre, segundo.nombre));
      expect(m.p1).toMatch(/^De primero: (Lentejas|Garbanzos|Alubias blancas) \(\d+ g en seco\)/);
      expect(m.p2).toMatch(/^De segundo: /);
      expect(m.recipe[0]).toMatch(/^De primero, /);
      expect(m.recipe.some((x) => /^De segundo, /.test(x))).toBe(true);
    }
  });

  it('la compra incluye el segundo, y la comida se lee igual junta que plato a plato', () => {
    for (const { m } of dobles) {
      const [c1, c2] = compraPorPlato(m);
      expect(c1.length).toBeGreaterThan(0);
      expect(c2[0]).toMatch(/^(Pechuga de pollo|Pechuga de pavo|Ternera magra|Lomo de cerdo|Conejo troceado) \(\d+ g\)/);
      const sueltos = [...leerComida({ p1: m.p1, shopping: c1 }).items, ...leerComida({ p2: m.p2, shopping: c2 }).items];
      expect(leerComida(m).items.map((it) => `${it.clave}:${it.gramos}`)).toEqual(sueltos.map((it) => `${it.clave}:${it.gramos}`));
    }
  });

  it('medirComida da las calorías y la proteína de los dos platos', () => {
    for (const { m } of dobles) {
      const leido = medirComida(m, COMPOSICION);
      expect(m.nutricion).toBeTruthy();
      expect(Math.abs(leido.kcal - m.nutricion.kcal)).toBeLessThanOrEqual(45);
      expect(Math.abs(leido.proteina - m.nutricion.proteina)).toBeLessThanOrEqual(2);
      const [c1] = compraPorPlato(m);
      const soloPrimero = medirComida({ p1: m.p1, shopping: c1 }, COMPOSICION);
      expect(leido.proteina).toBeGreaterThan(soloPrimero.proteina + 15);
      expect(m.nutricion.proteina).toBeGreaterThanOrEqual(0.95 * m.nutricion.objetivoProteina);
    }
  });

  it('el segundo sigue en platosSemana, y la sugerencia de la comida libre no lleva segundo', () => {
    for (const plan of planes) {
      const lista = metaEngine2(plan).platosSemana;
      for (const e of segundosDe(plan)) expect(lista).toContain(porId.get(e.plato).nombre);
      for (const d of plan.days) for (const m of d.meals.filter(Boolean)) if (m.sugerencia) { expect(m._dishId2).toBeUndefined(); expect(m.sugerencia._dishId2).toBeUndefined(); }
    }
  });

  it('una comida de legumbre sin segundo y las cenas siguen como plato único', () => {
    for (const plan of planes) {
      const conSegundo = new Set(segundosDe(plan).map((e) => e.day));
      plan.days.forEach((d, i) => {
        for (const m of d.meals.filter(Boolean)) {
          if (m.time === 'Comida' && conSegundo.has(DIAS[i])) continue;
          expect(esComidaDoble(m)).toBe(false);
          expect(m._dishId2).toBeUndefined();
        }
      });
    }
  });

  it('misma semilla, mismo plan; y recalcular el día deja la comida doble igual', () => {
    const opts = { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 60, userId: 'banco-omni-2174', saveMealMemory: () => {}, platosRecientes: [] };
    const sinId = (p) => JSON.stringify(p, (k, v) => (k === 'id' && typeof v === 'string' && /^day-\d-\d+$/.test(v) ? '' : v));
    expect(sinId(generarPlan(clonar(H74), 2174, opts))).toBe(sinId(generarPlan(clonar(H74), 2174, opts)));
    const { plan, e } = dobles[0];
    const i = DIAS.indexOf(e.day);
    const otra = recalcularDia(plan, plan.days[i], clonar(H74), 2174);
    expect(otra.meals.find((m) => m && m.time === 'Comida')).toEqual(comidaDe(plan, e.day));
  });

  it('con el batido, la comida doble se vuelve a racionar y sigue escrita plato a plato', () => {
    const { plan, e } = dobles[0];
    const perfil = { ...clonar(H74), extras: { proteinShake: { enabled: true, scoops: 1, kcalPerScoop: 120, proteinPerScoop: 24, timing: 'manana' } } };
    const dia = ajustarDia(plan.days[DIAS.indexOf(e.day)], perfil, 2174).day;
    const m = dia.meals.find((x) => x && x.time === 'Comida');
    expect(esComidaDoble(m)).toBe(true);
    expect(m.p1).toMatch(/^De primero: /);
    expect(m.p2).toMatch(/^De segundo: /);
  });
});

describe('la comida doble y el ancla de la semana (cocinar de una vez)', { timeout: 180000 }, () => {
  const planes = semanas({ ...H74, cocinarEnCantidad: { activo: true, dia: 'Domingo' } }, 2174, 'banco-omni-2174-ancla', 16);
  const dobles = planes.flatMap((plan) => plan.days.flatMap((d) => d.meals.filter((m) => m && esComidaDoble(m)).map((m) => ({ plan, d, m }))));
  const conAncla = dobles.filter(({ m }) => m._ancla);

  it('la comida doble que coloca el ancla lleva la receta del ancla en el primero', () => {
    expect(conAncla.length).toBeGreaterThan(0);
    for (const { m } of conAncla) {
      const receta = m.recipe.join(' ');
      const iSegundo = m.recipe.findIndex((x) => /^De segundo, /.test(x));
      const delPrimero = m.recipe.slice(0, iSegundo).join(' ');
      if (m._ancla.rol === 'aprovechar') expect(delPrimero).toMatch(/Usa (el|la|los|las) .+ que (cocinaste|cociste) /);
      else if (m._ancla.guardar && m._ancla.guardar.length) expect(delPrimero).toMatch(/(Cocina|Cuece) de una vez \d+ g/);
      expect(receta).toMatch(/De segundo, /);
      expect(m.slotNote).toBeTruthy();
    }
  });

  it('el día de cocinar de más, lo que se guarda son los gramos del otro día', () => {
    const cocinar = conAncla.filter(({ m }) => m._ancla.rol === 'cocinar' && m._ancla.guardar && m._ancla.guardar.length);
    for (const { m } of cocinar) {
      const paso = m.recipe.find((x) => /de una vez/.test(x));
      const hoy = Number((m.p1.match(/\((\d+) g en seco\)/) || [])[1]);
      const total = hoy + m._ancla.guardar.reduce((a, x) => a + x.gramos, 0);
      expect(paso).toContain(`de una vez ${total} g`);
      expect(paso).toContain(`${hoy} g para hoy`);
    }
  });
});

describe('la comida doble con una sola comida principal, con SIBO y con dietas', { timeout: 120000 }, () => {
  it('mealsPerDay 2: la comida doble es la principal y su título lo dice', () => {
    const planes = semanas({ ...H74, mealsPerDay: 2 }, 2174, 'doble-2comidas', 4);
    const dobles = planes.flatMap((plan) => plan.days.flatMap((d) => d.meals.filter((m) => m && esComidaDoble(m))));
    expect(dobles.length).toBeGreaterThan(0);
    for (const m of dobles) {
      expect(m.title).toMatch(/; de segundo, .+ \(comida principal\)$/);
      expect(m.p1).toMatch(/^De primero: /);
      expect(m.p2).toMatch(/^De segundo: /);
      expect(m.nutricion).toBeTruthy();
    }
  });

  it('SIBO, vegetariana y vegana no tienen segundos: ninguna comida doble', () => {
    const M62 = { ...BASE, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] };
    for (const [extra, userId] of [[{ intolerances: ['sibo'] }, 'banco-sibo-2000'], [{ dieta: 'vegetariana' }, 'banco-vegetariana-2000'], [{ dieta: 'vegana' }, 'banco-vegana-1400']]) {
      for (const plan of semanas({ ...M62, ...extra }, 2000, userId, 3)) {
        expect(segundosDe(plan)).toEqual([]);
        for (const d of plan.days) for (const m of d.meals.filter(Boolean)) expect(m._dishId2).toBeUndefined();
      }
    }
  });

  it('si un perfil con SIBO llevara una comida doble, cada plato se adapta por separado', () => {
    const sibo = { ...H74, intolerances: ['sibo'] };
    const p = CATALOGO.filter(esCompuestoLegumbre)[0];
    const s = CATALOGO.filter(esSegundoDeLegumbre)[0];
    const m = componerComidaDoble(p, s, 2000, { porPlato: (plato) => adaptarSiProcede(plato, sibo) });
    const [c1, c2] = compraPorPlato(m);
    // El texto de cada plato nombra el mismo aceite que su compra (decisión de Javi del 2026-11-12).
    expect(m.p1).toContain('aceite aromatizado con ajo (10 ml)');
    expect(c1).toContain('Aceite aromatizado con ajo (10 ml)');
    expect(m.p2).toContain('aceite aromatizado con ajo (15 ml)');
    expect(c2).toContain('Aceite aromatizado con ajo (15 ml)');
    expect(m.shopping.some((l) => /^AOVE/.test(l))).toBe(false);
    // Ya adaptada: volver a pasarla por la adaptación no la toca.
    expect(adaptarSiProcede(m, sibo)).toBe(m);
    // Y las raciones la vuelven a escribir adaptada, plato a plato.
    const r = ajustarDia({ name: 'Lunes', meals: [m] }, sibo, 2000).day.meals[0];
    const [r1, r2] = compraPorPlato(r);
    expect(r1.some((l) => /^Aceite aromatizado con ajo \(\d+ ml\)/.test(l))).toBe(true);
    expect(r2.some((l) => /^Aceite aromatizado con ajo \(\d+ ml\)/.test(l))).toBe(true);
    expect(r.shopping.some((l) => /^AOVE/.test(l))).toBe(false);
    expect(r.p1).toMatch(/aceite aromatizado con ajo \(\d+ ml\)/);
    expect(r.p2).toMatch(/aceite aromatizado con ajo \(\d+ ml\)/);
  });
});
