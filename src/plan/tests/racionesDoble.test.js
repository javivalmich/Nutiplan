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
import { papelDe, REPARTO } from '../../engine2/nutrientes/raciones.js';
import { PERFILES as BANCO } from '../../../scripts/banco/perfiles.mjs';
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

  it('en semanas reales, gramos, calorías y proteína dentro de lo medido (variantes-comida-doble.md, 10 + 10)', () => {
    // D-116.6, modificado el 2026-11-16: la legumbre llega antes a su tope (el aceite ya no sube) y a 3714 kcal
    // crece el segundo (también desde su mínimo, antes que el pan). Medianas de 200 semanas por perfil con el
    // motor de hoy, a 1434 / 2174 / 3714 kcal: legumbre seca 50 / 115 / 120 g; segundo 100 / 165 / 300 g. Aquí
    // son 8 semanas (unas 24 comidas): la mediana de la muestra se mueve unos gramos.
    const REF = { 1434: { legumbre: 50, proteico: 100 }, 2174: { legumbre: 115, proteico: 165 }, 3714: { legumbre: 120, proteico: 300 } };
    for (const kcal of Object.keys(PERFILES)) {
      const filas = semanasReales(Number(kcal));
      const ref = REF[kcal];
      expect(filas.length).toBeGreaterThanOrEqual(20);
      expect(Math.abs(mediana(filas.map((f) => f.legumbre)) - ref.legumbre)).toBeLessThanOrEqual(15);
      expect(Math.abs(mediana(filas.map((f) => f.proteico)) - ref.proteico)).toBeLessThanOrEqual(15);
      for (const f of filas) {
        expect(f.legumbre).toBeLessThanOrEqual(TOPES_PROTOTIPO[f.p.id]);
        expect(f.proteico).toBeLessThanOrEqual(300);
      }
      // Calorías: ninguna por debajo del 95 % de su objetivo. Por encima, el caso conocido y su límite están en
      // «límite de la comida doble frente al objetivo de su comida», más abajo. Ninguna corta de proteína.
      expect(filas.filter((f) => f.m.nutricion.kcal < 0.95 * f.m.nutricion.objetivoKcal).length).toBe(0);
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

// D-116.6, modificado (decisión de Javi del 2026-11-16, variante 10 + 10 de variantes-comida-doble.md): la
// comida doble no lleva más aceite que el máximo de un plato único en esa comida (20 g), 10 g en cada plato.
// Lo que falte de kcal lo cubre la legumbre hasta su tope, después el segundo dentro de su rango y después
// el pan o la fruta.
describe('aceite de la comida doble y segundo que crece (D-116.6, modificado)', { timeout: 120000 }, () => {
  const planes = Object.fromEntries(Object.entries(PERFILES).map(([kcal, perfil]) => {
    const out = [];
    let ant = null;
    for (let w = 60; w < 66; w++) {
      const plan = generarPlan(clonar(perfil), Number(kcal), { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: `banco-omni-${kcal}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, w - 1, w) });
      out.push(plan);
      ant = plan;
    }
    return [kcal, out];
  }));
  const dobles = (kcal) => planes[kcal].flatMap((p) => p.days.flatMap((d) => d.meals.filter((m) => m && m._dishId2)));
  const ml = (t) => Number((t.match(/AOVE \((\d+) ml\)/) || [])[1]);

  it('cada plato lleva como mucho 10 ml de aceite; los dos, como mucho 20 ml', () => {
    for (const kcal of Object.keys(PERFILES)) {
      expect(dobles(kcal).length).toBeGreaterThanOrEqual(15);
      for (const m of dobles(kcal)) {
        expect(ml(m.p1)).toBeLessThanOrEqual(10);
        expect(ml(m.p2)).toBeLessThanOrEqual(10);
        const aceite = leerComida(m).items.filter((it) => it.clave === 'aove').reduce((a, it) => a + it.gramos, 0);
        expect(aceite).toBeLessThanOrEqual(20);
      }
    }
  });

  it('a 3714 kcal el segundo crece dentro de su rango y lo dice el log; la legumbre no pasa de su tope', () => {
    const crece = planes[3714].flatMap((p) => p.decisionLog.filter((e) => e.causa === 'proteico_crece_por_energia'));
    expect(crece.length).toBeGreaterThan(0);
    for (const e of crece) expect(e.detalle).toMatch(/crece el segundo .*legumbre en su tope, aceite en su máximo/);
    for (const m of dobles(3714)) {
      const items = leerComida(m).items;
      const segundo = items.filter((it) => it.plato === 2 && esProteico(it.clave)).reduce((a, it) => a + it.gramos, 0);
      expect(segundo).toBeLessThanOrEqual(300);
      expect(items.filter((it) => it.plato === 1 && esLegumbre(it.clave)).reduce((a, it) => a + it.gramos, 0)).toBeLessThanOrEqual(topeLegumbre(tuplaDe(m._dishId)));
      expect(Math.abs(m.nutricion.kcal - m.nutricion.objetivoKcal)).toBeLessThanOrEqual(0.05 * m.nutricion.objetivoKcal);
    }
  });

  it('un plato único no cambia: el aceite sigue con su rango de siempre y su proteico no crece', () => {
    for (const p of planes[3714]) {
      expect(p.decisionLog.filter((e) => e.causa === 'proteico_crece_por_energia').every((e) => {
        const dia = p.days.find((d) => d.name === e.day);
        return dia && dia.meals.some((m) => m && m._dishId2);
      })).toBe(true);
    }
  });
});

// Límite de las comidas dobles frente al objetivo de su comida (2026-11-16, scripts/banco/medicion/
// estructura-comida-final/fuera-comida-doble.md; segunda revisión, M3 y B3, 2026-11-22): (a) ninguna por debajo
// del 95 % (omni-1434, omni-2174 y sin-lactosa-2000); (b) en todos los perfiles del banco, ninguna por encima del
// 105 %, salvo el caso con nombre: omni-1434, en un día en que el reparto del resto le bajó el objetivo (otras
// comidas del día no bajan de sus mínimos), y entonces nunca por encima del 105 % de su objetivo sin el reparto
// (domingos con crepes de avena en el desayuno; semana 118, entre otras). Casos conocidos de (a) antes del
// arreglo: omni-2174 semana 159 y sin-lactosa-2000 semana 97 (el proteico del segundo en su mínimo, sin crecer).
// El objetivo sin el reparto se calcula con el reparto del día de raciones.js (REPARTO), no con una copia.
describe('límite de la comida doble frente al objetivo de su comida', { timeout: 600000 }, () => {
  const CASO_CON_NOMBRE = 'omni-1434';
  const CON_BAJO_95 = new Set(['omni-1434', 'omni-2174', 'sin-lactosa-2000']);
  const hasta = (id) => (id === CASO_CON_NOMBRE ? 120 : id === 'omni-2174' ? 160 : 100);
  const MOMENTO = { Desayuno: 'desayuno', Comida: 'comida', Cena: 'cena' };
  /** Objetivo de la comida antes del reparto del resto: su parte del día (la misma cuenta que racionesDia). */
  const objetivoSinReparto = (day, kcal) => {
    const meals = day.meals.filter(Boolean);
    const tentempies = meals.filter((m) => !MOMENTO[m.time]).length || 1;
    const total = meals.reduce((a, m) => a + (MOMENTO[m.time] ? REPARTO[MOMENTO[m.time]] : REPARTO.tentempie / tentempies), 0);
    return (kcal * REPARTO.comida) / total;
  };
  const filas = [];
  for (const c of BANCO) {
    let ant = null;
    for (let w = 60; w <= hasta(c.id); w++) {
      const plan = generarPlan(clonar(c.perfil), c.kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: `banco-${c.id}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, w - 1, w) });
      ant = plan;
      for (const day of plan.days) {
        const m = day.meals.find((x) => x && x._dishId2);
        if (!m) continue;
        const reparto = plan.decisionLog.find((e) => e.day === day.name && e.causa === 'reparto_del_resto');
        const resto = reparto ? Number((reparto.detalle.match(/^(-?\d+) kcal/) || [])[1]) : 0;
        filas.push({ id: c.id, w, dia: day.name, kcal: m.nutricion.kcal, objetivo: m.nutricion.objetivoKcal, sinReparto: objetivoSinReparto(day, c.kcal), resto });
      }
    }
  }

  it('hay comidas dobles en los perfiles del banco que las llevan', () => {
    const conDobles = new Set(filas.map((f) => f.id));
    for (const id of ['omni-1434', 'omni-2174', 'omni-2600-3comidas', 'omni-3714', 'celiaco-2400', 'sin-lactosa-2000', 'sin-pescado-2000', 'omni-2174-ancla', 'omni-2000-sin-atun']) expect(conDobles.has(id)).toBe(true);
  });

  it('ninguna comida doble por debajo del 95 % de su objetivo', () => {
    const f95 = filas.filter((f) => CON_BAJO_95.has(f.id));
    expect(f95.length).toBeGreaterThan(200);
    expect(f95.filter((f) => f.kcal < 0.95 * f.objetivo).map((f) => `${f.id} ${f.w} ${f.dia}: ${f.kcal} de ${f.objetivo}`)).toEqual([]);
  });

  it('ninguna comida doble por encima del 105 % en ningún perfil, salvo el caso con nombre de omni-1434', () => {
    const encima = filas.filter((f) => f.kcal > 1.05 * f.objetivo);
    expect(encima.filter((f) => f.id !== CASO_CON_NOMBRE).map((f) => `${f.id} ${f.w} ${f.dia}: ${f.kcal} de ${f.objetivo}`)).toEqual([]);
    expect(encima.length).toBeGreaterThan(0); // el caso con nombre existe (omni-1434, domingos con crepes)
    for (const f of encima) {
      expect([f.id, f.w, f.dia, f.resto < 0]).toEqual([CASO_CON_NOMBRE, f.w, f.dia, true]);
      expect(f.kcal).toBeLessThanOrEqual(1.05 * f.sinReparto);
    }
    expect(encima.some((f) => f.w === 118 && f.dia === 'Domingo')).toBe(true);
  });
});

// Segunda revisión, M1 (2026-11-22): el segundo solo crece cuando la legumbre del primero ya no puede crecer más
// (está en su tope); si la legumbre está en su mínimo, crece antes la legumbre. El log dice lo que de verdad pasó:
// el estado de la legumbre y del aceite, y cuánto crece cada uno (después > antes).
// Caso conocido antes del arreglo: omni-1434, semanas 60 a 67, el segundo crecía con la legumbre a 50 g (tope 120).
describe('M1: la legumbre crece antes que el segundo', { timeout: 300000 }, () => {
  const entradas = [];
  let ant = null;
  for (let w = 60; w < 68; w++) {
    const plan = generarPlan(clonar(PERFILES[1434]), 1434, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: 'banco-omni-1434', saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, w - 1, w) });
    ant = plan;
    for (const e of plan.decisionLog.filter((x) => x.causa === 'proteico_crece_por_energia' || x.causa === 'legumbre_crece_por_energia')) {
      const m = plan.days.find((d) => d.name === e.day).meals.find((x) => x && x._dishId2);
      if (!m) continue;
      const leg = leerComida(m).items.filter((it) => it.plato === 1 && esLegumbre(it.clave)).reduce((a, it) => a + it.gramos, 0);
      entradas.push({ w, e, leg, tope: topeLegumbre(tuplaDe(m._dishId)) });
    }
  }

  it('cuando crece el segundo, la legumbre del primero está en su tope', () => {
    const conSegundo = entradas.filter((x) => x.e.causa === 'proteico_crece_por_energia');
    expect(conSegundo.map((x) => `${x.w} ${x.e.day}: legumbre ${x.leg} de ${x.tope}`).filter((t, k) => conSegundo[k].leg < conSegundo[k].tope)).toEqual([]);
  });

  it('hay casos en que crece antes la legumbre, y el log lo dice', () => {
    const conLegumbre = entradas.filter((x) => /crece la legumbre/.test(x.e.detalle));
    expect(conLegumbre.length).toBeGreaterThan(0);
    for (const x of conLegumbre) expect(x.leg).toBeGreaterThan(50);
  });

  it('el log no dice «en su tope» ni «en su máximo» si no es verdad, y cada «antes → después» crece', () => {
    for (const x of entradas) {
      if (/legumbre en su tope/.test(x.e.detalle)) expect(x.leg).toBe(x.tope);
      for (const [, a, d] of x.e.detalle.matchAll(/(\d+(?:[.,]\d+)?) → (\d+(?:[.,]\d+)?) g/g)) expect(Number(d)).toBeGreaterThan(Number(a));
    }
  });
});
