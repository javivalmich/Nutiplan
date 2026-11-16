// Alternativas y la comida con primero y segundo (D-116; etapa 2, paso 7 de
// scripts/banco/medicion/estructura-comida.md, sección 12).
// Cambiar una comida doble la deja en plato único: el segundo sale de la comida, de la compra y de
// platosSemana. Al cambiar otra comida de la semana, el segundo cuenta como un plato más.

import { describe, it, expect } from 'vitest';
import { generarPlan, platosRecientesPara, regenerarComida } from '../generarPlan.js';
import { metaEngine2 } from '../engine2App.js';
import { esComidaDoble } from '../textos/comidaDoble.js';
import { medirComida } from '../medidor/medir.js';
import { catalogoApp } from '../catalogo.js';
import { aplicarAjustesD099 } from '../../engine2/dishes/ajustesD099.js';
import { aplicarNombresD105 } from '../../engine2/dishes/alinosD105.js';
import { proteinaPrincipal, esCompuestoLegumbre } from '../../engine2/dishes/bases.js';
import { COMPOSICION } from '../../engine2/nutrientes/composicion.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const H74 = { ...BASE, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const CATALOGO = aplicarNombresD105(aplicarAjustesD099(catalogoApp()));
const porId = new Map(CATALOGO.map((d) => [d.id, d]));
const porNombre = new Map(CATALOGO.map((d) => [d.nombre, d]));
const DESEOS = ['comfort', 'ligero', 'rapido', 'diferente'];
const optsDe = (userId, w) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId, saveMealMemory: () => {} });

function semanas(perfil, kcal, userId, n) {
  const out = [];
  let ant = null;
  for (let w = 60; w < 60 + n; w++) {
    const plan = generarPlan(clonar(perfil), kcal, { ...optsDe(userId, w), platosRecientes: platosRecientesPara(ant, w - 1, w) });
    out.push({ plan, w });
    ant = plan;
  }
  return out;
}
const doblesDe = (plan) => plan.days.flatMap((d, i) => d.meals.filter((m) => m && esComidaDoble(m)).map((m) => ({ i, m })));
const comidaDe = (plan, i) => plan.days[i].meals.find((m) => m && m.time === 'Comida');

describe('alternativas de una comida doble (D-116)', { timeout: 180000 }, () => {
  const USER = 'banco-omni-2174';
  const planes = semanas(H74, 2174, USER, 4);
  const casos = planes.flatMap(({ plan, w }) => doblesDe(plan).flatMap(({ i, m }) => DESEOS.map((deseo) => ({ plan, w, i, m, deseo }))));

  it('hay comidas dobles que cambiar', () => {
    expect(casos.length).toBeGreaterThanOrEqual(40);
  });

  it('cambiar una comida doble devuelve un plato único, sin el segundo en la comida ni en la compra', () => {
    for (const { plan, w, i, m, deseo } of casos) {
      const n = regenerarComida(plan, i, 'Comida', deseo, clonar(H74), 2174, optsDe(USER, w));
      expect(n).toBeTruthy();
      const nueva = comidaDe(n, i);
      const segundo = porId.get(m._dishId2);
      expect(nueva._motor).toBe('engine2');
      expect(nueva._dishId).not.toBe(m._dishId);
      expect(nueva._dishId).not.toBe(m._dishId2);
      expect(nueva._dishId2).toBeUndefined();
      expect(nueva._doble).toBeUndefined();
      expect(nueva._base._dishId2).toBeUndefined();
      expect(esComidaDoble(nueva)).toBe(false);
      expect(nueva.title).toBe(porId.get(nueva._dishId).nombre);
      expect(nueva.title).not.toMatch(/; de segundo, /);
      expect(`${nueva.p1} ${nueva.p2}`).not.toMatch(/De primero:|De segundo:/);
      expect((nueva.recipe || []).some((x) => /^De (primero|segundo), /.test(x))).toBe(false);
      // Lo que queda es lo que se mide: las raciones del día se recalculan con el plato nuevo.
      expect(nueva.nutricion).toBeTruthy();
      expect(Math.abs(medirComida(nueva, COMPOSICION).kcal - nueva.nutricion.kcal)).toBeLessThanOrEqual(45);
      // Las demás comidas del día y de la semana no cambian de plato.
      n.days.forEach((d, k) => d.meals.forEach((x, j) => { if (x && !(k === i && x.time === 'Comida')) expect(x.title).toBe(plan.days[k].meals[j].title); }));
      expect(segundo).toBeTruthy();
    }
  });

  it('la alternativa de una comida doble nunca es un compuesto de legumbre (decisión de Javi, 2026-11-16)', () => {
    for (const { plan, w, i, deseo } of casos) {
      const n = regenerarComida(plan, i, 'Comida', deseo, clonar(H74), 2174, optsDe(USER, w));
      const nueva = comidaDe(n, i);
      expect([deseo, nueva.title, esCompuestoLegumbre(porId.get(nueva._dishId))]).toEqual([deseo, nueva.title, false]);
      expect(n.decisionLog.some((e) => e.causa === 'alternativa_sin_legumbre_compuesta' && e.deseo === deseo)).toBe(true);
    }
  });

  it('el segundo sale de platosSemana y entra el plato nuevo en lugar del primero', () => {
    for (const { plan, w, i, m, deseo } of casos) {
      const n = regenerarComida(plan, i, 'Comida', deseo, clonar(H74), 2174, optsDe(USER, w));
      const nueva = comidaDe(n, i);
      const antes = metaEngine2(plan).platosSemana;
      const despues = metaEngine2(n).platosSemana;
      const primero = porId.get(m._dishId).nombre;
      const segundo = porId.get(m._dishId2).nombre;
      expect(antes).toContain(primero);
      expect(antes).toContain(segundo);
      expect(despues).not.toContain(primero);
      expect(despues).not.toContain(segundo);
      expect(despues).toContain(nueva.title);
      expect(despues.length).toBe(antes.length - 1);
      expect(n.platosSemana).toEqual(despues);
      // La semana siguiente ya puede llevar ese plato: no está entre los recientes.
      expect(platosRecientesPara(n, w, w + 1)).not.toContain(segundo);
    }
  });

  it('el cambio queda en el decision log con su causa', () => {
    const { plan, w, i, m } = casos[0];
    const n = regenerarComida(plan, i, 'Comida', 'ligero', clonar(H74), 2174, optsDe(USER, w));
    const e = n.decisionLog.find((x) => x.causa === 'alternativa_retira_segundo');
    expect(e).toBeTruthy();
    expect(e.plato).toBe(m._dishId2);
    expect(e.detalle).toContain(porId.get(m._dishId2).nombre);
  });

  it('al cambiar la cena de un día con comida doble, el segundo cuenta: ni el mismo plato ni su especie', () => {
    for (const { plan, w } of planes) {
      for (const { i, m } of doblesDe(plan)) {
        if (!plan.days[i].meals.some((x) => x && x.time === 'Cena' && x._dishId)) continue;
        for (const deseo of DESEOS) {
          const n = regenerarComida(plan, i, 'Cena', deseo, clonar(H74), 2174, optsDe(USER, w));
          const cena = n.days[i].meals.find((x) => x && x.time === 'Cena');
          expect(cena._dishId).not.toBe(m._dishId2);
          expect(proteinaPrincipal(porNombre.get(cena.title))).not.toBe(proteinaPrincipal(porId.get(m._dishId2)));
          // La comida doble de ese día no se toca.
          expect(esComidaDoble(comidaDe(n, i))).toBe(true);
          expect(comidaDe(n, i).title).toBe(m.title);
          expect(metaEngine2(n).platosSemana).toContain(porId.get(m._dishId2).nombre);
        }
      }
    }
  });

  it('con una sola comida principal, el plato único conserva «(comida principal)»', () => {
    const P2 = { ...H74, mealsPerDay: 2 };
    const { plan, w } = semanas(P2, 2174, 'doble-2comidas', 1)[0];
    const d = doblesDe(plan)[0];
    expect(d).toBeTruthy();
    const n = regenerarComida(plan, d.i, 'Comida', 'ligero', clonar(P2), 2174, optsDe('doble-2comidas', w));
    const nueva = comidaDe(n, d.i);
    expect(nueva.title).toMatch(/ \(comida principal\)$/);
    expect(nueva.title).not.toMatch(/; de segundo, /);
    expect(nueva._dishId2).toBeUndefined();
    expect(metaEngine2(n).platosSemana).not.toContain(porId.get(d.m._dishId2).nombre);
  });

  it('el plan que vuelve de la base de datos (solo los días) se cambia igual', () => {
    const { plan, w, i, m } = casos[0];
    const guardado = { days: clonar(plan.days) };
    const n = regenerarComida(guardado, i, 'Comida', 'ligero', clonar(H74), 2174, optsDe(USER, w));
    expect(comidaDe(n, i)._dishId2).toBeUndefined();
    expect(metaEngine2(n).platosSemana).not.toContain(porId.get(m._dishId2).nombre);
  });
});
