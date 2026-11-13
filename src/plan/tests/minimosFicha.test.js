// D-112 (borrador; decisión de Javi del 2026-11-12, variante B): lo que la
// ficha pide por debajo del mínimo del rango de un ingrediente ajustable queda
// fijo en lo que pide la ficha, a cualquier objetivo. Antes subía al mínimo y
// crecía con el objetivo: el yogur de salsa de una hamburguesa (20 g) llegaba a
// 125 g, ¼ de aguacate a ½, una clara de rebozar a 2, la cancha del ceviche a
// 145 g a 3714 kcal. Excepciones: el aceite, lo que añade engine2 y las masas de
// receta marcadas en la ficha (crepes y batido), que conservan el
// comportamiento anterior.
import { describe, it, expect } from 'vitest';
import { catalogoApp } from '../catalogo.js';
import { conPlatosDieta } from '../platosDieta.js';
import { componerPlato } from '../textos/componer.js';
import { catalogoDesayunos } from '../desayunosApp.js';
import { leerComida } from '../medidor/leerComida.js';
import { generarPlan } from '../generarPlan.js';
import { ajustarDia } from '../racionesApp.js';
import { rangoDe, papelDe, racionesDia } from '../../engine2/nutrientes/raciones.js';
import { COMPOSICION } from '../../engine2/nutrientes/composicion.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
import { PERFILES, clonar } from '../../../scripts/banco/perfiles.mjs';

const ACEITES = new Set(['aove', 'aceite_semillas']);
const B = { intolerances: [], eliminatedFoods: [], extras: {} };
const SLOT = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena' };

/** Ingredientes ajustables que la ficha pide por debajo de su mínimo (sin aceites), sumados por clave. */
function bajoMinimo(m) {
  const out = new Map();
  for (const it of leerComida(m).items) {
    if (/estimado/.test(it.como) || ACEITES.has(it.clave)) continue;
    const r = rangoDe(it.clave, it.como === 'ud' ? 'ud' : 'g');
    if (papelDe(it.clave, COMPOSICION[it.clave]) === 'fijo' || !r || it.gramos >= r[0] - 0.05) continue;
    out.set(it.clave, (out.get(it.clave) || 0) + it.gramos);
  }
  return out;
}

/** Fichas con algo por debajo del mínimo, compuestas a esas kcal. */
function fichas(kcal) {
  const out = new Map();
  for (const p of [B, { ...B, dieta: 'vegetariana' }, { ...B, dieta: 'vegana' }]) {
    for (const d of conPlatosDieta(catalogoApp(), p, { reserva: true })) {
      let m;
      try { m = componerPlato(d, d.momento[0], kcal); } catch { continue; }
      if (!out.has(m.title) && bajoMinimo(m).size) out.set(m.title, { momento: d.momento[0], m });
    }
    for (const x of catalogoDesayunos(p)) {
      if (!out.has(x.meal.title) && bajoMinimo(x.meal).size) out.set(x.meal.title, { momento: x.tipo === 'desayuno' ? 'desayuno' : 'tentempie', m: x.meal });
    }
  }
  return out;
}

/** La ficha en su momento del lunes de una semana del perfil, con el día ajustado. */
function ajustada(plan, perfil, kcal, momento, m) {
  const day = plan.days[0];
  const i = day.meals.findIndex((x) => x && (SLOT[momento] ? x.time === SLOT[momento] : !['Desayuno', 'Comida', 'Cena'].includes(x.time)));
  const meals = [...day.meals];
  meals[i] = { ...m, time: meals[i].time };
  return ajustarDia({ ...day, meals }, perfil, kcal).day.meals[i];
}

const OBJETIVOS = [['omni-1434', 1434], ['omni-2174', 2174], ['omni-3714', 3714]];

describe('D-112: lo que la ficha pide por debajo del mínimo se respeta', { timeout: 180000 }, () => {
  for (const [id, kcal] of OBJETIVOS) {
    it(`a ${kcal} kcal, cada ficha conserva su cantidad; las masas, el comportamiento anterior`, () => {
      const P = PERFILES.find((x) => x.id === id);
      const plan = generarPlan(clonar(P.perfil), kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 60, userId: 'banco-' + id, saveMealMemory: () => {}, platosRecientes: [] });
      const todas = fichas(kcal);
      let conservadas = 0;
      let masas = 0;
      for (const [titulo, { momento, m }] of todas) {
        const final = ajustada(plan, P.perfil, kcal, momento, m);
        const leido = new Map();
        for (const it of leerComida(final).items) leido.set(it.clave, (leido.get(it.clave) || 0) + it.gramos);
        if (m.masa) {
          masas++;
          // Comportamiento anterior: lo que estaba bajo el mínimo sube al menos hasta él.
          for (const [clave] of bajoMinimo(m)) expect(leido.get(clave), `${titulo}: ${clave}`).toBeGreaterThanOrEqual(rangoDe(clave, 'g')[0] - 6);
          continue;
        }
        conservadas++;
        for (const [clave, g] of bajoMinimo(m)) expect(leido.get(clave), `${titulo} a ${kcal} kcal: ${clave}`).toBeCloseTo(g, 0);
      }
      expect(masas).toBe(2);
      expect(conservadas).toBeGreaterThanOrEqual(19);
    });
  }

  it('las fichas de crepes y del batido llevan la marca de masa', () => {
    const titulos = [...catalogoDesayunos({ ...B, dieta: 'vegana' }), ...catalogoDesayunos(B)].filter((x) => x.meal.masa).map((x) => x.meal.title);
    expect(new Set(titulos)).toEqual(new Set(['Crepes de avena con queso fresco batido y fruta', 'Batido de bebida de soja, tofu sedoso, plátano y avena']));
  });

  it('la causa queda en el decision log', () => {
    const r = racionesDia({
      comidas: [
        { id: '0', momento: 'comida', items: [{ clave: 'ternera_picada', gramos: 150, unidad: 'g' }, { clave: 'yogur_natural', gramos: 20, unidad: 'g' }, { clave: 'patata', gramos: 200, unidad: 'g' }] },
        { id: '1', momento: 'cena', items: [{ clave: 'merluza', gramos: 200, unidad: 'g' }, { clave: 'patata', gramos: 200, unidad: 'g' }] },
      ],
      objetivo: { kcal: 2000, proteina: 100, pesoKg: 70 },
      composicion: COMPOSICION,
    });
    expect(r.comidas['0'].items.find((i) => i.clave === 'yogur_natural').gramos).toBe(20);
    const e = r.log.find((x) => x.causa === 'cantidad_de_la_ficha');
    expect(e && e.detalle).toMatch(/yogur_natural 20 g \(mínimo 125 g\)/);
  });
});
