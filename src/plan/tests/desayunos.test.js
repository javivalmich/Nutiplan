// Desayunos y tentempiés de engine2 (D-110).
import { describe, it, expect } from 'vitest';
import { generarPlan, platosRecientesPara, regenerarComida } from '../generarPlan.js';
import { intoleranciasDe } from '../engine2App.js';
import { catalogoDesayunos, tieneProteinaAjustable } from '../desayunosApp.js';
import { objetivoDe } from '../racionesApp.js';
import { medirPlan } from '../medidor/medir.js';
import { leerComida, reconocer } from '../medidor/leerComida.js';
import { COMPOSICION } from '../../engine2/nutrientes/composicion.js';
import { adaptarComidaLactosa } from '../../engine2/nutrientes/lactosa.js';
import { alergenosDeTexto } from '../../engine2/nutrientes/alergenos.js';
import { elegirDesayunos } from '../../engine2/desayunos/elegirDesayunos.js';
import { DESAYUNOS, TENTEMPIES } from '../../data/DESAYUNOS.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const MUJER = { ...BASE, gender: 'female', age: 40, weight: 60, height: 160, activity: 'light', goal: 'loseWeight', mealsPerDay: 5, trainingDays: [] };
const HOMBRE = { ...BASE, gender: 'male', age: 34, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 5, trainingDays: ['Lunes', 'Jueves'] };
const O = (w, u, prev = []) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: u, saveMealMemory: () => {}, platosRecientes: prev });
const texto = (m) => [m.title, m.p1, m.p2, ...(m.shopping || []), ...((m.recipe || []).filter((x) => typeof x === 'string'))].join(' · ');
const huecos = (plan, time) => plan.days.map((d) => d.meals.find((m) => m && m.time === time));
const LABORABLES = [0, 1, 2, 3, 4];

/** Varias semanas seguidas, cada una con los platos y desayunos de la anterior. */
function semanas(P, kcal, n, u) {
  const out = [];
  let prev = [];
  for (let w = 41; w < 41 + n; w++) {
    const plan = generarPlan(P, kcal, O(w, u, prev));
    prev = platosRecientesPara(plan, w, w + 1);
    out.push(plan);
  }
  return out;
}

describe('catálogo', () => {
  it('ids propios, fichas completas y todo lo que lleva cantidad se puede medir', () => {
    const ids = new Set();
    for (const m of [...DESAYUNOS, ...TENTEMPIES]) {
      expect(ids.has(m.id), m.id).toBe(false);
      ids.add(m.id);
      expect(typeof m.ficha.base, m.id).toBe('string');
      expect(leerComida(m).sinCantidad, m.id).toEqual([]);
      for (const s of m.shopping) {
        if (!/\d+\s*(g|ml|ud)\b|\(\d/.test(s)) continue;
        const clave = reconocer(s.replace(/\s*\(.*$/, ''));
        if (clave === 'condimento') expect(s, m.id).toMatch(/c[uú]rcuma|piment[oó]n|canela|jengibre/i);
      }
    }
    expect(DESAYUNOS.length).toBeGreaterThanOrEqual(35);
    expect(TENTEMPIES.length).toBeGreaterThanOrEqual(16);
    expect(TENTEMPIES.filter((t) => t.ficha.llevar).length).toBeGreaterThanOrEqual(8);
  });

  it('sin lactosa: leche, yogur, kéfir y queso fresco pasan a su versión sin lactosa (idempotente)', () => {
    const P = { ...BASE, intolerances: ['lactosa'] };
    let conLacteo = 0;
    for (const m0 of [...DESAYUNOS, ...TENTEMPIES]) {
      const m = adaptarComidaLactosa(m0);
      expect(adaptarComidaLactosa({ ...m, adaptadoLactosa: false })).toEqual({ ...m, adaptadoLactosa: true });
      if (/yogur griego|leche semidesnatada|queso fresco batido|k[eé]fir/i.test(texto(m0))) {
        conLacteo += 1;
        if (!/reques[oó]n|parmesano/i.test(texto(m0))) expect(alergenosDeTexto(texto(m)).has('lactosa'), m0.id).toBe(false);
      }
    }
    expect(conLacteo).toBeGreaterThan(15);
    // Siguen llegando a la proteína: el yogur sin lactosa es griego.
    const yogur = catalogoDesayunos(P).find((c) => c.id === 'des_yogur_granola');
    expect(yogur.meal.title).toBe('Bol de yogur sin lactosa con granola y fruta');
    expect(yogur.meal.shopping[0]).toBe('Yogur griego sin lactosa (2 ud / 250g)');
    expect(tieneProteinaAjustable(yogur.meal)).toBe(true);
  });
});

describe('la rutina de la semana', { timeout: 600000 }, () => {
  it('dos desayunos de diario alternos, uno distinto el fin de semana, y dos tentempiés alternos en cada hueco', () => {
    for (const [P, kcal] of [[MUJER, 1600], [HOMBRE, 2400]]) {
      for (const plan of semanas(P, kcal, 4, `rutina${P.weight}`)) {
        const des = huecos(plan, 'Desayuno').map((m) => m.title);
        expect(new Set([des[0], des[2], des[4]]).size).toBe(1);
        expect(new Set([des[1], des[3]]).size).toBe(1);
        expect(des[0]).not.toBe(des[1]);
        expect(des[5]).toBe(des[6]);
        expect([des[0], des[1]]).not.toContain(des[5]);
        for (const t of ['Almuerzo', 'Merienda']) {
          const x = huecos(plan, t).map((m) => m.title);
          expect(new Set(x).size, t).toBe(2);
          for (let i = 2; i < 7; i++) expect(x[i], t).toBe(x[i - 2]);
        }
        const alm = new Set(huecos(plan, 'Almuerzo').map((m) => m.title));
        for (const m of huecos(plan, 'Merienda')) expect(alm.has(m.title)).toBe(false);
        // Entre semana, desayunos rápidos; a media mañana, algo que se lleva.
        const ficha = new Map([...DESAYUNOS, ...TENTEMPIES].map((x) => [x.title, x.ficha]));
        for (const i of LABORABLES) expect(ficha.get(des[i]).rapido, des[i]).toBe(true);
        for (const m of huecos(plan, 'Almuerzo')) expect(ficha.get(m.title).llevar, m.title).toBe(true);
        for (const m of plan.days.flatMap((d) => d.meals)) if (m && m.time !== 'Comida' && m.time !== 'Cena') expect(m._motor).toBe('engine2');
      }
    }
  });

  it('cambian cada semana', () => {
    const planes = semanas(HOMBRE, 2400, 5, 'cambio');
    for (let k = 1; k < planes.length; k++) {
      const antes = new Set(planes[k - 1].days.flatMap((d) => d.meals.filter((m) => m && m.time !== 'Comida' && m.time !== 'Cena').map((m) => m.title)));
      const ahora = planes[k].days.flatMap((d) => d.meals.filter((m) => m && m.time !== 'Comida' && m.time !== 'Cena').map((m) => m.title));
      expect(ahora.filter((t) => antes.has(t)), `semana ${41 + k}`).toEqual([]);
    }
  });

  it('con poco tiempo para cocinar, también el fin de semana es rápido', () => {
    const ficha = new Map(DESAYUNOS.map((x) => [x.title, x.ficha]));
    for (const plan of semanas({ ...HOMBRE, tiempoCocina: 'poco' }, 2400, 3, 'poco')) {
      for (const m of huecos(plan, 'Desayuno')) expect(ficha.get(m.title).rapido, m.title).toBe(true);
    }
  });

  it('misma semilla, mismos desayunos; y cada elección deja su causa', () => {
    const a = generarPlan(HOMBRE, 2400, O(43, 'semilla'));
    const b = generarPlan(HOMBRE, 2400, O(43, 'semilla'));
    expect(JSON.stringify(a.days.map((d) => d.meals))).toBe(JSON.stringify(b.days.map((d) => d.meals)));
    const causas = a.decisionLog.filter((e) => e.causa === 'desayuno_elegido');
    expect(causas.length).toBe(7); // 2 de diario, 1 de fin de semana, 2 de media mañana y 2 de merienda
    for (const e of causas) expect(e.detalle).toMatch(/escalón «.+»; RNG/);
    expect(a.decisionLog.some((e) => e.causa === 'rutina_semanal')).toBe(true);
  });

  it('elegirDesayunos sin candidatos de fin de semana ni tentempiés lo dice y no falla', () => {
    const c = (id, rapido, base) => ({ id, tipo: 'desayuno', grupo: 0, ficha: { rapido, finde: false, llevar: false, base } });
    const r = elegirDesayunos({ candidatos: [c('a', true, 'x')], dias: [{ dia: 'Lunes', huecos: ['Desayuno', 'Almuerzo'] }, { dia: 'Sábado', huecos: ['Desayuno', 'Almuerzo'] }], seed: 's' });
    expect(r.porDia).toEqual({ Lunes: { Desayuno: 'a' }, Sábado: { Desayuno: 'a' } });
    expect(r.decisionLog.map((e) => e.causa)).toEqual(expect.arrayContaining(['desayuno_unico_de_diario', 'desayuno_finde_igual_que_diario', 'sin_tentempie_posible']));
  });
});

describe('lo que la persona come', { timeout: 600000 }, () => {
  const INTOL = ['gluten', 'lactosa', 'huevo', 'frutos_secos', 'mariscos', 'pescado', 'soja', 'cerdo', 'legumbres', 'picante', 'sibo'];
  it('ningún desayuno ni tentempié lleva algo vetado, y ningún hueco se queda vacío', () => {
    for (const i of INTOL) {
      const P = { ...HOMBRE, intolerances: [i] };
      for (const plan of semanas(P, 2400, 2, `intol-${i}`)) {
        for (const d of plan.days) for (const m of d.meals) {
          expect(m, `${i} ${d.name}`).not.toBeNull();
          if (m.time !== 'Comida' && m.time !== 'Cena') expect(intoleranciasDe(m, P), `${i} ${d.name} ${m.title}`).toEqual([]);
        }
      }
    }
    // Alimentos eliminados.
    const P = { ...HOMBRE, eliminatedFoods: ['plátano', 'yogur'] };
    for (const plan of semanas(P, 2400, 2, 'elim')) {
      for (const d of plan.days) for (const m of d.meals) if (m.time !== 'Comida' && m.time !== 'Cena') expect(texto(m).toLowerCase(), m.title).not.toMatch(/pl[aá]tano|yogur/);
    }
  });

  it('el desayuno llega a la proteína mínima, también vegano con pocas calorías', () => {
    const perfiles = [[MUJER, 1600], [HOMBRE, 2400], [{ ...MUJER, weight: 55, mealsPerDay: 4, dieta: 'vegana' }, 1400], [{ ...MUJER, weight: 62, goal: 'maintain', activity: 'moderate', dieta: 'vegetariana' }, 2000], [{ ...HOMBRE, intolerances: ['lactosa'] }, 2400], [{ ...HOMBRE, intolerances: ['gluten'], mealsPerDay: 4 }, 2400]];
    for (const [P, kcal] of perfiles) {
      for (const plan of semanas(P, kcal, 3, `prot-${P.weight}-${P.dieta || ''}-${P.intolerances.join('')}`)) {
        const med = medirPlan(plan, { ...objetivoDe(P, kcal), peso: P.weight }, COMPOSICION);
        const cortos = med.dias.flatMap((d) => d.comidas.filter((c) => c.momento === 'desayuno' && c.proteinaSuficiente === false).map((c) => `${d.nombre || ''} ${c.titulo}`));
        expect(cortos, `${P.dieta || 'omnívora'} ${kcal}`).toEqual([]);
      }
    }
  });

  it('con celiaquía, si falta energía se acompaña con pan sin gluten (y nunca con integral)', () => {
    const P = { ...HOMBRE, intolerances: ['gluten'], mealsPerDay: 4 };
    let conPanSG = 0;
    for (const plan of semanas(P, 2400, 3, 'celiaco')) {
      const med = medirPlan(plan, { ...objetivoDe(P, 2400), peso: P.weight }, COMPOSICION);
      expect(Math.abs(med.desvioSemana)).toBeLessThanOrEqual(5);
      for (const d of plan.days) for (const m of d.meals) {
        if (!m) continue;
        expect(texto(m)).not.toMatch(/pan integral/i);
        if (/Pan sin gluten/.test(m.p2 || '')) conPanSG += 1;
      }
    }
    expect(conPanSG).toBeGreaterThan(0);
    // A quien puede comer gluten no se le añade pan sin gluten.
    const omni = generarPlan(HOMBRE, 2400, O(41, 'omni'));
    expect(omni.days.some((d) => d.meals.some((m) => m && /para acompañar.*sin gluten|Pan sin gluten \(\d+ g\)/.test(m.p2 || '')))).toBe(false);
  });

  it('vegetariana: el huevo puede salir dos veces al día (desayuno y comida o cena), nunca dos entre comida y cena', () => {
    const P = { ...MUJER, goal: 'maintain', dieta: 'vegetariana' };
    let dosVeces = 0;
    for (const plan of semanas(P, 2000, 6, 'huevo')) {
      for (const d of plan.days) {
        const conHuevo = d.meals.filter((m) => m && /huevo|tortilla|revuelto|claras/i.test(`${m.title} ${(m.shopping || []).join(' ')}`) && !/tofu/i.test(m.title));
        const principales = conHuevo.filter((m) => m.time === 'Comida' || m.time === 'Cena');
        expect(principales.length).toBeLessThanOrEqual(1);
        if (conHuevo.length === 2) dosVeces += 1;
      }
    }
    expect(dosVeces).toBeGreaterThan(0);
  });
});

describe('alternativas de desayuno y tentempié', { timeout: 300000 }, () => {
  it('para todos los perfiles: del catálogo de engine2, cada clic da otro y respeta lo que no come', () => {
    for (const P of [HOMBRE, { ...HOMBRE, intolerances: ['lactosa', 'frutos_secos'] }, { ...MUJER, dieta: 'vegana' }]) {
      const plan = generarPlan(P, 2000, O(42, 'alt'));
      for (const [dia, time] of [[0, 'Desayuno'], [5, 'Desayuno'], [2, 'Almuerzo'], [3, 'Merienda']]) {
        let p = plan;
        let antes = p.days[dia].meals.find((m) => m && m.time === time).title;
        const vistos = new Set([antes]);
        for (let k = 0; k < 3; k++) {
          const n = regenerarComida(p, dia, time, 'diferente', P, 2000, O(42, 'alt'));
          const m = n.days[dia].meals.find((x) => x && x.time === time);
          expect(m._motor).toBe('engine2');
          expect(intoleranciasDe(m, P), `${time} ${m.title}`).toEqual([]);
          expect(m.title, `${time}: el clic no cambia`).not.toBe(antes);
          antes = m.title;
          vistos.add(m.title);
          p = n;
        }
        expect(vistos.size, time).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
