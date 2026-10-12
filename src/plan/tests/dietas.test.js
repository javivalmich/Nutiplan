// Dietas vegetariana y vegana (D-107).
import { describe, it, expect } from 'vitest';
import { generarPlan, regenerarComida } from '../generarPlan.js';
import { filtrarCatalogo, intoleranciasDe } from '../engine2App.js';
import { catalogoApp } from '../catalogo.js';
import { platosDeDieta } from '../platosDieta.js';
import { objetivoDe } from '../racionesApp.js';
import { medirPlan } from '../medidor/medir.js';
import { leerComida, reconocer } from '../medidor/leerComida.js';
import { COMPOSICION } from '../../engine2/nutrientes/composicion.js';
import { animalDeTexto, adaptarTextoDieta, adaptarComidaDieta, dietaDe } from '../../engine2/nutrientes/dietas.js';
import { PLATOS_DIETA, DESAYUNOS_DIETA, TENTEMPIES_DIETA } from '../../data/PLATOS_DIETA.js';
import { FREEFORM_COMBOS } from '../../data/FREEFORM_COMBOS.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
import { validateFreeFormCombo } from '../../engine/validation.js';
import { resolveDishComposition } from '../../engine2/dishes/compositionResolver.js';
import vocabulario from '../../../scripts/phaseB2/verduraVocabulary.json';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const PERFILES = [
  [{ ...BASE, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] }, 2000],
  [{ ...BASE, gender: 'male', age: 28, weight: 90, height: 185, activity: 'active', goal: 'muscleGain', mealsPerDay: 5, trainingDays: ['Lunes', 'Jueves'] }, 3400],
];
const O = (w, u, prev = []) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: u, saveMealMemory: () => {}, platosRecientes: prev });
const texto = (m) => [m.title, m.p1, m.p2, ...(m.shopping || []), ...((m.recipe || []).filter((x) => typeof x === 'string'))].join(' · ');
const NO_COME = { vegetariana: ['carne', 'pescado', 'marisco'], vegana: ['carne', 'pescado', 'marisco', 'huevo', 'lacteo', 'miel'] };

describe('qué es de origen animal y qué se adapta', () => {
  it('detecta lo animal sin falsos positivos habituales', () => {
    const a = (t) => [...animalDeTexto(t)].sort();
    expect(a('Dorada (200g) al horno')).toEqual(['pescado']);
    expect(a('Patata · cebolla dorada en AOVE')).toEqual([]);
    expect(a('Carne de pimiento choricero (1 cda)')).toEqual([]);
    expect(a('Hamburguesa de lentejas con pan')).toEqual([]);
    expect(a('Tortillas de maíz (3 ud) · Calienta las tortillas en una sartén')).toEqual([]);
    expect(a('Tortilla de patatas')).toEqual(['huevo']);
    expect(a('Leche de coco light · bebida de soja · yogur de soja natural · mayonesa vegana')).toEqual([]);
    expect(a('Caldo de pollo (300ml)')).toEqual(['carne']);
    expect(a('Yogur griego 0% (125g) · 1 cda miel')).toEqual(['lacteo', 'miel']);
  });

  it('cambia solo lo secundario y adaptar dos veces da lo mismo', () => {
    expect(adaptarTextoDieta('Caldo de pollo (300ml)', 'vegetariana')).toBe('Caldo de verduras (300ml)');
    expect(adaptarTextoDieta('Yogur griego 0% (125g)', 'vegetariana')).toBe('Yogur griego 0% (125g)');
    expect(adaptarTextoDieta('Avena con leche semidesnatada (200ml) y 1 cda miel', 'vegana')).toBe('Avena con bebida de soja (200ml) y 1 cda sirope de arce');
    expect(adaptarTextoDieta('Pechuga de pollo (200g)', 'vegana')).toBe('Pechuga de pollo (200g)');
    const m = { title: 'Muesli con yogur', p1: 'Yogur griego 0% (125g) · leche', p2: 'queso rallado al gusto', shopping: ['Yogur griego 0% (125g)', 'Miel (1 cdita)'], recipe: ['Mezcla con la leche.'] };
    const una = adaptarComidaDieta(m, 'vegana');
    expect(adaptarComidaDieta(una, 'vegana')).toEqual(una);
    expect([...animalDeTexto(texto(una))]).toEqual([]);
    expect(adaptarComidaDieta(m, 'omnivora')).toBe(m);
  });

  it('el perfil sin dieta es omnívoro', () => {
    expect(dietaDe({})).toBe('omnivora');
    expect(dietaDe({ dieta: 'vegana' })).toBe('vegana');
    expect(dietaDe({ dieta: 'otra' })).toBe('omnivora');
  });
});

describe('platos nuevos', () => {
  it('tienen la forma de los freeform, ficha de engine2 válida e ids propios', () => {
    const ids = new Set(FREEFORM_COMBOS.map((c) => c.identity.id));
    for (const p of PLATOS_DIETA) {
      const v = validateFreeFormCombo(p);
      expect(v.errors, p.identity.id).toEqual([]);
      expect(ids.has(p.identity.id), p.identity.id).toBe(false);
      ids.add(p.identity.id);
      expect(p.identity.verdura.every((e) => vocabulario.ejes.includes(e)), p.identity.id).toBe(true);
      expect(resolveDishComposition({ id: p.identity.id }).verdura.valorEfectivo).toEqual(p.identity.verdura);
    }
    expect(platosDeDieta('vegana').length).toBeGreaterThan(25);
    expect(platosDeDieta('vegetariana').length).toBeGreaterThan(platosDeDieta('vegana').length);
    expect(platosDeDieta('omnivora')).toEqual([]);
  });

  it('cada plato es de verdad de su dieta y la legumbre nunca va a la cena', () => {
    for (const p of [...PLATOS_DIETA]) {
      const t = texto({ title: p.identity.title, ...p.content, shopping: p.content.shopping, recipe: p.content.recipe });
      const animal = [...animalDeTexto(t)].filter((c) => NO_COME[p.dieta].includes(c));
      expect(animal, p.identity.id).toEqual([]);
      if (p.identity.proteinType === 'legumbre') expect(p.engine2.momento, p.identity.id).toEqual(['comida']);
    }
    for (const m of [...DESAYUNOS_DIETA, ...TENTEMPIES_DIETA]) expect([...animalDeTexto(texto(m))], m.title).toEqual([]);
  });

  it('todo lo que lleva cantidad en la compra se puede medir', () => {
    for (const m of [...PLATOS_DIETA.map((p) => ({ title: p.identity.title, ...p.content })), ...DESAYUNOS_DIETA, ...TENTEMPIES_DIETA]) {
      expect(leerComida(m).sinCantidad, m.title).toEqual([]);
      for (const s of m.shopping) {
        if (!/\d+\s*(g|ml|ud)\b|\(\d/.test(s)) continue;
        const clave = reconocer(s.replace(/\s*\(.*$/, ''));
        if (clave === 'condimento') expect(s, m.title).toMatch(/jengibre|c[uú]rcuma|curry|piment[oó]n|azafr[aá]n|vinagre|laurel|maicena|mostaza/i);
      }
    }
  });

  it('los omnívoros no los ven', () => {
    const P = { ...PERFILES[0][0] };
    expect(filtrarCatalogo(catalogoApp(), P, 2000, O(1, 'o')).catalogo.some((d) => d.id.startsWith('dieta_'))).toBe(false);
    const plan = generarPlan(P, 2000, O(41, 'o'));
    expect(plan.days.some((d) => d.meals.some((m) => m && /^dieta_/.test(m._dishId || '')))).toBe(false);
  });
});

describe('planes vegetarianos y veganos', { timeout: 600000 }, () => {
  for (const dieta of ['vegetariana', 'vegana']) {
    it(`${dieta}: seis semanas seguidas con engine2, nada que no coma, sin repetir y a ±5 % de sus calorías`, () => {
      for (const [p0, kcal] of PERFILES) {
        const P = { ...p0, dieta };
        let prev = [];
        for (let w = 41; w <= 46; w++) {
          const plan = generarPlan(P, kcal, O(w, `${dieta}-${p0.weight}`, prev));
          prev = plan.platosSemana || [];
          expect(plan.motor, `${dieta} semana ${w}`).toBe('engine2');
          expect(plan.motorAviso, `${dieta} semana ${w}`).toBeUndefined();
          const titulos = [];
          let cenasHuevo = 0;
          for (const d of plan.days) {
            // D-110 (Javi): huevo como mucho una vez entre comida y cena; el
            // desayuno o el tentempié pueden llevarlo también.
            let huevos = 0;
            for (const m of d.meals) {
              if (!m) continue;
              expect(intoleranciasDe(m, P), `${d.name} ${m.time}: ${m.title}`).toEqual([]);
              const principal = m.time === 'Comida' || m.time === 'Cena';
              if (principal && animalDeTexto(texto(m)).has('huevo')) { huevos += 1; if (m.time === 'Cena') cenasHuevo += 1; }
              if (principal && !/libre/i.test(m.title)) titulos.push(m.title);
            }
            expect(huevos, `${d.name}: huevo una vez entre comida y cena`).toBeLessThanOrEqual(1);
          }
          expect(cenasHuevo).toBeLessThanOrEqual(3);
          expect(new Set(titulos).size).toBe(titulos.length);
          const med = medirPlan(plan, { ...objetivoDe(P, kcal), peso: P.weight }, COMPOSICION);
          expect(Math.abs(med.desvioSemana), `${dieta} semana ${w}`).toBeLessThanOrEqual(5);
          // Comidas y cenas llegan a la proteína mínima (0,3 g/kg).
          const cortas = med.dias.flatMap((d) => d.comidas.filter((c) => c.proteinaSuficiente === false && c.momento !== 'desayuno'));
          expect(cortas.map((c) => c.titulo)).toEqual([]);
        }
      }
    });
  }

  it('las cantidades del texto coinciden con las de la compra', () => {
    let total = 0;
    let iguales = 0;
    for (const dieta of ['vegetariana', 'vegana']) {
      const [p0, kcal] = PERFILES[0];
      const plan = generarPlan({ ...p0, dieta }, kcal, O(42, dieta));
      // Solo los platos y desayunos propios (los del motor viejo tienen su propio test).
      const propios = new Set(DESAYUNOS_DIETA.map((x) => x.title));
      for (const d of plan.days) for (const m of d.meals.filter((x) => x && (/^dieta_/.test(x._dishId || '') || propios.has(x.title)))) {
        const t = `${m.p1} ${m.p2}`;
        for (const it of leerComida(m).items) {
          // El texto escribe la cantidad justo detrás del nombre: «tofu firme (200g)».
          const v = (it.texto.match(/^[^(]+\((\d+)\s*g\)/) || [])[1];
          const nombre = it.nombre.toLowerCase().split(' ')[0];
          const enTexto = (t.toLowerCase().match(new RegExp(`${nombre}(?:\\s+[^\\s·,(]+){0,2}\\s*\\((\\d+)\\s*g`)) || [])[1];
          if (!v || !enTexto) continue;
          total += 1;
          if (enTexto === v) iguales += 1;
        }
      }
    }
    expect(total).toBeGreaterThan(20);
    expect(iguales / total).toBeGreaterThan(0.97);
  });

  it('con intolerancias que dejan pocos platos, se repite antes que servir algo que no come', () => {
    // Momentos de cada plato tal como están en el catálogo (sin estirar a la cena).
    const momentos = new Map([...catalogoApp(), ...platosDeDieta('vegana', { reserva: true }), ...platosDeDieta('vegetariana')].map((d) => [d.id, d.momento]));
    const casos = [['vegana', ['soja']], ['vegana', ['legumbres']], ['vegana', ['gluten', 'soja']], ['vegetariana', ['huevo', 'lactosa']], ['vegana', ['sibo']],
      ['vegana', ['gluten', 'legumbres']], ['vegana', ['gluten', 'soja', 'legumbres', 'frutos_secos', 'sibo']]];
    for (const [dieta, intolerances] of casos) {
      const P = { ...PERFILES[0][0], dieta, intolerances };
      let prev = [];
      for (let w = 41; w <= 43; w++) {
        const plan = generarPlan(P, 2000, O(w, `${dieta}${intolerances}`, prev));
        prev = plan.platosSemana || [];
        expect(plan.motor, `${dieta}+${intolerances}`).toBe('engine2');
        for (const d of plan.days) for (const m of d.meals) {
          if (!m) continue;
          expect(intoleranciasDe(m, P), `${dieta}+${intolerances} ${d.name} ${m.title}`).toEqual([]);
          // D-109: nunca un plato de comida a la cena; si no hay cenas, las de reserva.
          if (m.time === 'Cena' && m._dishId) expect(momentos.get(m._dishId), `${dieta}+${intolerances} ${d.name} ${m.title}`).toContain('cena');
        }
      }
    }
  });

  it('los platos de reserva solo salen cuando no queda otro plato (D-109)', () => {
    const reserva = PLATOS_DIETA.filter((p) => p.reserva);
    expect(reserva.length).toBeGreaterThanOrEqual(4);
    expect(platosDeDieta('vegana').some((d) => d.id.startsWith('dieta_reserva_'))).toBe(false);
    expect(platosDeDieta('vegana', { reserva: true }).filter((d) => d.id.startsWith('dieta_reserva_')).length).toBe(reserva.length);
    // Sirven a cualquiera: sin gluten, soja, legumbres, frutos secos ni nada alto en FODMAP.
    const todo = { ...PERFILES[0][0], dieta: 'vegana', intolerances: ['gluten', 'lactosa', 'huevo', 'frutos_secos', 'mariscos', 'pescado', 'soja', 'cerdo', 'legumbres', 'picante', 'sibo'] };
    for (const p of reserva) expect(intoleranciasDe({ title: p.identity.title, ...p.content }, todo), p.identity.id).toEqual([]);
    // Con platos de sobra no aparecen.
    for (const dieta of ['vegetariana', 'vegana']) {
      const plan = generarPlan({ ...PERFILES[0][0], dieta }, 2000, O(42, dieta));
      expect(plan.days.some((d) => d.meals.some((m) => m && /^dieta_reserva_/.test(m._dishId || '')))).toBe(false);
    }
  });

  it('las alternativas (también de desayuno) respetan la dieta y el huevo', () => {
    for (const dieta of ['vegetariana', 'vegana']) {
      const P = { ...PERFILES[0][0], dieta };
      const plan = generarPlan(P, 2000, O(42, dieta));
      for (const [dia, time] of [[1, 'Comida'], [2, 'Cena'], [3, 'Desayuno'], [4, 'Almuerzo']]) {
        let p = plan;
        const vistos = new Set();
        for (let k = 0; k < 3; k++) {
          const n = regenerarComida(p, dia, time, 'diferente', P, 2000, O(42, dieta));
          expect(n, `${dieta} ${time}`).toBeTruthy();
          const m = n.days[dia].meals.find((x) => x && x.time === time);
          expect(intoleranciasDe(m, P), `${dieta} ${time} ${m.title}`).toEqual([]);
          if (dieta === 'vegetariana') expect(n.days[dia].meals.filter((x) => x && (x.time === 'Comida' || x.time === 'Cena') && animalDeTexto(texto(x)).has('huevo')).length).toBeLessThanOrEqual(1);
          vistos.add(m.title);
          p = n;
        }
        expect(vistos.size, `${dieta} ${time}: cada clic da otro`).toBeGreaterThan(1);
      }
    }
  });
});
