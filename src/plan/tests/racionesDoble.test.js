// Raciones de la comida con primero y segundo (D-116.6; etapa 2, paso 5 de
// scripts/banco/medicion/estructura-comida.md, sección 12).
// Los dos platos se racionan como una sola comida, con el objetivo de siempre; la legumbre del
// primero tiene de tope lo que ese plato recibe como plato único a 2174 kcal; cada plato se vuelve
// a escribir con sus gramos. Cifras de referencia: sección 4 del informe y
// scripts/banco/medicion/estructura-comida-final/resumen.md (prototipo de medición).

import { describe, it, expect } from 'vitest';
import { generarPlanEngine2 } from '../engine2App.js';
import { generarPlan, platosRecientesPara } from '../generarPlan.js';
import { ajustarDia, topeLegumbre } from '../racionesApp.js';
import { componerComidaDoble, compraPorPlato } from '../textos/comidaDoble.js';
import { leerComida } from '../medidor/leerComida.js';
import { medirComida } from '../medidor/medir.js';
import { catalogoApp } from '../catalogo.js';
import { aplicarAjustesD099 } from '../../engine2/dishes/ajustesD099.js';
import { aplicarNombresD105 } from '../../engine2/dishes/alinosD105.js';
import { esCompuestoLegumbre, esSegundoDeLegumbre } from '../../engine2/dishes/bases.js';
import { COMPOSICION } from '../../engine2/nutrientes/composicion.js';
import { INGREDIENTES } from '../../engine2/nutrientes/ingredientes.js';
import { papelDe } from '../../engine2/nutrientes/raciones.js';
import { tuplaDe } from '../textos/componer.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const CATALOGO = aplicarNombresD105(aplicarAjustesD099(catalogoApp()));
const PRIMEROS = CATALOGO.filter(esCompuestoLegumbre);
const SEGUNDOS = CATALOGO.filter(esSegundoDeLegumbre);
const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
// Los perfiles sintéticos del banco de 1434, 2174 y 3714 kcal.
const PERFILES = {
  1434: { ...BASE, gender: 'female', age: 32, weight: 60, height: 163, activity: 'light', goal: 'fatLossGeneral', mealsPerDay: 4, trainingDays: ['Martes', 'Jueves'] },
  2174: { ...BASE, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] },
  3714: { ...BASE, gender: 'male', age: 28, weight: 90, height: 185, activity: 'active', goal: 'muscleGain', mealsPerDay: 5, trainingDays: ['Lunes', 'Martes', 'Jueves', 'Viernes'] },
};
const clonar = (x) => JSON.parse(JSON.stringify(x));
const esLegumbre = (clave) => (INGREDIENTES[clave] || {}).grupo === 'legumbre';
const esProteico = (clave) => !!COMPOSICION[clave] && papelDe(clave, COMPOSICION[clave]) === 'proteico';
const mediana = (xs) => { const o = [...xs].sort((a, b) => a - b); return o.length % 2 ? o[(o.length - 1) / 2] : (o[o.length / 2 - 1] + o[o.length / 2]) / 2; };

// Lo que el prototipo calculaba con un plan de referencia (omni-2174, semana 60, miércoles):
// gramos en seco de legumbre de cada primero como plato único a 2174 kcal.
const TOPES_PROTOTIPO = {
  '["legumbre","lentejas",null,"zanahoria",null,"pimenton_ajo","guisado"]': 125,
  '["legumbre","garbanzos",null,"espinacas",null,"pimenton_ajo","guisado"]': 120,
  '["legumbre","alubias",null,"pimientos",null,"ajillo","guisado"]': 130,
  '["legumbre","garbanzos",null,"brocoli",null,"curry_ligero","salteado"]': 120,
  '["legumbre","lentejas","arroz","zanahoria",null,"pimenton_ajo","guisado"]': 100,
  '["legumbre","lentejas",null,"espinacas",null,"pimenton_ajo","guisado"]': 125,
  '["legumbre","lentejas",null,"pimientos",null,"pimenton_ajo","guisado"]': 120,
  '["legumbre","lentejas",null,"calabacin",null,"ajillo","guisado"]': 125,
  '["legumbre","garbanzos",null,"zanahoria",null,"pimenton_ajo","guisado"]': 120,
  '["legumbre","garbanzos",null,"tomate",null,"ajillo","salteado"]': 120,
  '["legumbre","garbanzos",null,"pimientos",null,"pimenton_ajo","guisado"]': 115,
  '["legumbre","alubias",null,"acelgas",null,"ajillo","guisado"]': 130,
  '["legumbre","garbanzos",null,"berenjena",null,"curry_ligero","salteado"]': 120,
  '["legumbre","garbanzos",null,"alcachofa",null,"limon_hierbas","guisado"]': 120,
};

/** Un día real del plan (miércoles de la semana 60) con la comida cambiada por cada comida doble. */
function medir(kcal) {
  const perfil = PERFILES[kcal];
  const plan = generarPlanEngine2(clonar(perfil), kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 60, userId: `doble-${kcal}`, catalogo: catalogoApp(), platosRecientes: [] });
  const day = plan.days[2];
  const k = day.meals.findIndex((m) => m && m.time === 'Comida');
  const filas = [];
  for (const p of PRIMEROS) {
    for (const s of SEGUNDOS) {
      const meals = day.meals.slice();
      meals[k] = { ...componerComidaDoble(p, s, kcal), _motor: 'engine2' };
      const r = ajustarDia({ ...day, meals }, clonar(perfil), kcal);
      const m = r.day.meals[k];
      const items = leerComida(m).items;
      const g = (pred) => Math.round(items.filter((it) => pred(it)).reduce((a, it) => a + it.gramos, 0));
      filas.push({ p, s, m, items, sinCambiar: r.sinCambiar, legumbre: g((it) => it.plato === 1 && esLegumbre(it.clave)), proteico: g((it) => esProteico(it.clave)), total: g(() => true) });
    }
  }
  return filas;
}

/**
 * Semanas seguidas por la entrada de la app (mismas semillas que el banco), con la comida doble
 * en los días en que el motor puso un segundo: las comidas que de verdad salen.
 */
function semanasReales(kcal, semanas = 8) {
  const perfil = PERFILES[kcal];
  const porId = new Map(CATALOGO.map((d) => [d.id, d]));
  const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
  const filas = [];
  let ant = null;
  for (let w = 60; w < 60 + semanas; w++) {
    const plan = generarPlan(clonar(perfil), kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: `banco-omni-${kcal}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, w - 1, w) });
    for (const e of (plan.decisionLog || []).filter((x) => x.causa === 'segundo_de_legumbre')) {
      const day = plan.days[DIAS.indexOf(e.day)];
      const k = day.meals.findIndex((m) => m && m.time === 'Comida');
      const actual = day.meals[k];
      const p = porId.get(e.primero);
      const s = porId.get(e.plato);
      const meals = day.meals.slice();
      meals[k] = { ...componerComidaDoble(p, s, kcal, { ancla: (actual._base || actual)._ancla || null }), _motor: 'engine2' };
      const m = ajustarDia({ ...day, meals }, clonar(perfil), kcal).day.meals[k];
      const items = leerComida(m).items;
      const g = (pred) => Math.round(items.filter((it) => pred(it)).reduce((a, it) => a + it.gramos, 0));
      filas.push({ p, s, m, legumbre: g((it) => it.plato === 1 && esLegumbre(it.clave)), proteico: g((it) => esProteico(it.clave)), total: g(() => true) });
    }
    ant = plan;
  }
  return filas;
}

describe('raciones de la comida doble (D-116.6)', { timeout: 120000 }, () => {
  const porKcal = Object.fromEntries(Object.keys(PERFILES).map((kcal) => [kcal, medir(Number(kcal))]));
  const todas = Object.values(porKcal).flat();

  it('el tope de la legumbre de cada primero es el que calculaba el prototipo', () => {
    expect(PRIMEROS.length).toBe(Object.keys(TOPES_PROTOTIPO).length);
    for (const p of PRIMEROS) expect([p.nombre, topeLegumbre(tuplaDe(p.id))]).toEqual([p.nombre, TOPES_PROTOTIPO[p.id]]);
  });

  it('la legumbre del primero nunca pasa de su tope ni baja de 50 g', () => {
    for (const f of todas) {
      expect(f.legumbre).toBeLessThanOrEqual(TOPES_PROTOTIPO[f.p.id]);
      expect(f.legumbre).toBeGreaterThanOrEqual(50);
    }
  });

  it('cada plato se vuelve a escribir con sus gramos: el texto dice lo que deciden las raciones', () => {
    for (const f of todas) {
      expect(f.sinCambiar).toBe(0);
      expect(f.m.p1.startsWith('De primero: ')).toBe(true);
      expect(f.m.p2.startsWith('De segundo: ')).toBe(true);
      expect(f.m._dishId2).toBe(f.s.id);
      // Lo que se lee de la comida escrita son las calorías y la proteína que decidieron las raciones
      // (el aceite se escribe en ml redondeados a 5: de ahí el margen).
      const leido = medirComida(f.m, COMPOSICION);
      expect(Math.abs(leido.kcal - f.m.nutricion.kcal)).toBeLessThanOrEqual(45);
      expect(Math.abs(leido.proteina - f.m.nutricion.proteina)).toBeLessThanOrEqual(2);
      // La legumbre del primero y la proteína del segundo salen en el texto de su plato con los gramos de la compra.
      const [c1, c2] = compraPorPlato(f.m);
      const gramos = (linea) => `(${(linea.match(/(\d+) g/) || [])[1]} g`;
      expect(f.m.p1).toContain(gramos(c1[0]));
      expect(f.m.p2).toContain(gramos(c2[0]));
    }
  });

  it('el aceite de cada plato se escribe en su plato', () => {
    for (const f of todas) {
      const aceites = f.items.filter((it) => it.clave === 'aove');
      expect(aceites.map((it) => it.plato)).toEqual([1, 2]);
      const ml = (texto) => Number((texto.match(/AOVE \((\d+) ml\)/) || [])[1]);
      expect(Math.round(aceites[0].gramos / 0.92)).toBe(ml(f.m.p1));
      expect(Math.round(aceites[1].gramos / 0.92)).toBe(ml(f.m.p2));
    }
  });

  it('en semanas reales, gramos, calorías y proteína dentro de lo medido con el prototipo (sección 4)', () => {
    // Medianas del prototipo (estructura-comida-final/resumen.md), a 1434 / 2174 / 3714 kcal:
    // legumbre seca 50 / 75 / 105 g; proteico 95 / 160 / 260 g; total 451 (384–639) / 597 (527–792) /
    // 927 (777–1287) g; proteína de la comida 37 de 36 / 57 de 51 / 100 de 83 g.
    const REF = { 1434: { legumbre: 50, proteico: 95, total: [384, 639], proteina: 37 }, 2174: { legumbre: 75, proteico: 160, total: [527, 792], proteina: 57 }, 3714: { legumbre: 105, proteico: 260, total: [777, 1287], proteina: 100 } };
    const FUERA = { 1434: 4, 2174: 0, 3714: 0 };
    for (const kcal of Object.keys(PERFILES)) {
      const filas = semanasReales(Number(kcal));
      const ref = REF[kcal];
      expect(filas.length).toBeGreaterThanOrEqual(20);
      expect(Math.abs(mediana(filas.map((f) => f.legumbre)) - ref.legumbre)).toBeLessThanOrEqual(5);
      // 8 semanas (unas 24 comidas) frente a las 200 del prototipo: la mediana de la muestra se mueve unos gramos.
      expect(Math.abs(mediana(filas.map((f) => f.proteico)) - ref.proteico)).toBeLessThanOrEqual(15);
      expect(Math.abs(mediana(filas.map((f) => f.m.nutricion.proteina)) - ref.proteina)).toBeLessThanOrEqual(3);
      for (const f of filas) {
        expect(f.legumbre).toBeLessThanOrEqual(TOPES_PROTOTIPO[f.p.id]);
        expect(f.total).toBeGreaterThanOrEqual(ref.total[0]);
        expect(f.total).toBeLessThanOrEqual(ref.total[1]);
      }
      // Calorías: todas a menos de un 10 % del objetivo de la comida y casi todas dentro de ±5 %
      // (en estas mismas semanas el prototipo deja fuera 4 de 23, 0 de 24 y 0 de 24, con el mismo texto;
      // en su medición completa, 127 de 4783). Ninguna comida doble corta de proteína (prototipo: 13 de 4783 bajo el 95 %).
      const desvio = (f) => Math.abs(f.m.nutricion.kcal - f.m.nutricion.objetivoKcal) / f.m.nutricion.objetivoKcal;
      expect(Math.max(...filas.map(desvio))).toBeLessThan(0.10);
      expect(filas.filter((f) => desvio(f) > 0.05).length).toBeLessThanOrEqual(FUERA[kcal]);
      expect(filas.filter((f) => f.m.nutricion.proteina < 0.95 * f.m.nutricion.objetivoProteina).length).toBe(0);
    }
  });

  it('recalcular el día da lo mismo (parte siempre de la comida de partida)', () => {
    const f = porKcal[2174][0];
    const perfil = clonar(PERFILES[2174]);
    const dia = { name: 'Miércoles', meals: [f.m] };
    const una = ajustarDia(dia, perfil, 2174).day;
    const dos = ajustarDia(una, perfil, 2174).day;
    expect(dos.meals[0]).toEqual(una.meals[0]);
  });
});
