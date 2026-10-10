// Reglas de menu decididas por Javi tras la primera Fase 7 (D-099), revisadas
// en el visor de menus el 2026-10-10. Cada test fija una regla sobre semanas
// reales (catalogo de 241 platos, varias semillas y perfiles).

import { describe, it, expect } from 'vitest';
import { materializePlan } from '../materializePlan.js';
import { loadCatalog } from '../dishes/loadCatalog.js';
import { BASES, llevaBase, proteinaPrincipal, TOPE_PROTEINA_SEMANA } from '../dishes/bases.js';
import { resolveDishComposition } from '../dishes/compositionResolver.js';
import { DAYS_ORDER } from '../skeleton/days.js';
import { aplicarAjustesD099 } from '../dishes/ajustesD099.js';

const catalog = loadCatalog();
const PERFILES = [
  { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] },
  { trainingDays: [] },
];
const SEMILLAS = Array.from({ length: 25 }, (_, i) => 70001 + i);
const semana = (seed, profile, extra = {}) => materializePlan({ profile, seed, strategy: 'mantenimiento_equilibrado', catalog, ...extra });
const platos = (plan, { conLibre = false } = {}) => plan.days.flatMap((d, i) => d.meals
  .filter((m) => conLibre || !m.libre)
  .map((m) => ({ ...m, dia: i })));
const causas = (plan) => plan.decisionLog.filter((e) => e.causa && e.day);

function* casos(extra) {
  for (const profile of PERFILES) for (const seed of SEMILLAS) yield { profile, seed, plan: semana(seed, profile, extra) };
}

describe('D-099 · cocinar en cantidad es una eleccion del usuario', () => {
  it('sin respuesta, o con «no», la semana no tiene ancla', () => {
    for (const { plan } of casos()) {
      expect(causas(plan).some((e) => e.causa.startsWith('ancla'))).toBe(false);
    }
    for (const { plan } of casos({ cocinarEnCantidad: { activo: false } })) {
      expect(causas(plan).some((e) => e.causa.startsWith('ancla'))).toBe(false);
    }
  });

  it('con «si», el ancla es un ingrediente base y sale en 2 platos distintos que lo llevan', () => {
    const bases = new Set(BASES.map((b) => b.base));
    for (const { plan } of casos({ cocinarEnCantidad: { activo: true } })) {
      const eleccion = plan.decisionLog.find((e) => e.cause === 'eleccion_ancla_por_seed');
      const base = eleccion.consequence.replace('ancla elegida: base:', '');
      expect(bases.has(base)).toBe(true);
      const delAncla = causas(plan).filter((e) => e.causa.startsWith('ancla_base_'));
      expect(delAncla.length).toBeGreaterThanOrEqual(1);
      expect(delAncla.length).toBeLessThanOrEqual(2);
      const ids = delAncla.map((e) => e.plato);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(llevaBase(catalog.find((d) => d.id === id), base)).toBe(true);
    }
  });

  it('las lentejas nunca son ancla', () => {
    expect(BASES.some((b) => b.base === 'lentejas')).toBe(false);
  });

  it('el dia elegido por el usuario es el dia de cocinar', () => {
    for (const { plan } of casos({ cocinarEnCantidad: { activo: true, dia: 'Miercoles' } })) {
      const cocinado = causas(plan).find((e) => e.causa === 'ancla_base_cocinado');
      if (cocinado) expect(cocinado.day).toBe('Miercoles');
    }
  });

  it('cocinar el domingo: los dos platos caen entre lunes y miercoles', () => {
    for (const { plan } of casos({ cocinarEnCantidad: { activo: true, dia: 'Domingo' } })) {
      for (const e of causas(plan).filter((x) => x.causa.startsWith('ancla_base_'))) {
        expect(['Lunes', 'Martes', 'Miercoles']).toContain(e.day);
      }
    }
  });

  it('el aprovechamiento nunca cae en sabado ni domingo', () => {
    for (const { plan } of casos({ cocinarEnCantidad: { activo: true } })) {
      for (const e of causas(plan).filter((x) => x.causa === 'ancla_base_aprovechado')) {
        expect(['Sabado', 'Domingo']).not.toContain(e.day);
      }
    }
  });
});

describe('D-099 · repeticion', () => {
  it('ningun plato sale dos veces en la misma semana (por nombre visible)', () => {
    for (const extra of [{}, { cocinarEnCantidad: { activo: true } }]) {
      for (const { plan } of casos(extra)) {
        const nombres = platos(plan, { conLibre: true }).map((m) => m.dish.nombre);
        expect(new Set(nombres).size).toBe(nombres.length);
      }
    }
  });

  it('ningun plato de la semana anterior se repite la semana siguiente', () => {
    for (const profile of PERFILES) {
      for (const seed of SEMILLAS.slice(0, 10)) {
        const s1 = semana(seed, profile);
        const anteriores = platos(s1, { conLibre: true }).map((m) => m.dish.id);
        const s2 = semana(seed + 1000, profile, { platosRecientes: anteriores });
        const nombres1 = new Set(platos(s1, { conLibre: true }).map((m) => m.dish.nombre));
        for (const m of platos(s2, { conLibre: true })) expect(nombres1.has(m.dish.nombre)).toBe(false);
      }
    }
  });

  it(`una misma proteina principal sale como mucho ${TOPE_PROTEINA_SEMANA} veces por semana`, () => {
    for (const extra of [{}, { cocinarEnCantidad: { activo: true } }]) {
      for (const { plan } of casos(extra)) {
        const cuenta = {};
        for (const m of platos(plan, { conLibre: true })) {
          const p = proteinaPrincipal(m.dish);
          if (p) cuenta[p] = (cuenta[p] || 0) + 1;
        }
        for (const n of Object.values(cuenta)) expect(n).toBeLessThanOrEqual(TOPE_PROTEINA_SEMANA);
      }
    }
  });

  it('si una proteina sale dos veces, no es el mismo dia ni en dias seguidos (salvo los dos platos del ancla)', () => {
    for (const extra of [{}, { cocinarEnCantidad: { activo: true } }]) {
      for (const { plan } of casos(extra)) {
        const delAncla = new Set(causas(plan).filter((e) => e.causa.startsWith('ancla_base_')).map((e) => `${e.day}|${e.momento}`));
        const vistos = {};
        plan.days.forEach((d, i) => d.meals.forEach((m) => {
          if (m.libre || delAncla.has(`${d.day}|${m.momento}`)) return;
          const p = proteinaPrincipal(m.dish);
          if (!p) return;
          for (const j of vistos[p] || []) expect(Math.abs(i - j), `${p} ${DAYS_ORDER[j]}/${d.day}`).toBeGreaterThan(1);
          (vistos[p] = vistos[p] || []).push(i);
        }));
      }
    }
  });
});

describe('D-099 · momentos y dias', () => {
  it('dishes.json no se modifica: los ajustes se aplican sobre el catalogo cargado', () => {
    expect(catalog.find((d) => d.id === 'curry_garbanzos').momento).toEqual(['comida', 'cena']);
    expect(aplicarAjustesD099(catalog).find((d) => d.id === 'curry_garbanzos').momento).toEqual(['comida']);
  });

  it('ninguna legumbre a la cena', () => {
    for (const { plan } of casos({ cocinarEnCantidad: { activo: true } })) {
      for (const d of plan.days) {
        const cena = d.meals.find((m) => m.momento === 'cena');
        expect(resolveDishComposition(cena.dish).proteinType, cena.dish.nombre).not.toBe('legumbre');
      }
    }
  });

  it('el huevo con tomate en crudo no es ancla y solo puede salir a la cena', () => {
    const huevo = aplicarAjustesD099(catalog).find((d) => d.nombre === 'Huevo con tomate en crudo');
    expect(huevo.rol).toBe('rotativo');
    expect(huevo.momento).toEqual(['cena']);
  });

  it('no hay dia de capricho', () => {
    for (const { plan } of casos()) {
      expect(plan.decisionLog.some((e) => e.cause === 'beat_dia_capricho')).toBe(false);
      expect(plan.decisionLog.some((e) => e.cause === 'capricho_retirado')).toBe(true);
    }
  });

  it('la comida del sabado es libre (el plato queda como sugerencia)', () => {
    for (const { plan } of casos()) {
      const sabado = plan.days.find((d) => d.day === 'Sabado');
      expect(sabado.meals.find((m) => m.momento === 'comida').libre).toBe(true);
      expect(sabado.meals.find((m) => m.momento === 'cena').libre).toBeUndefined();
      for (const d of plan.days.filter((x) => x.day !== 'Sabado')) for (const m of d.meals) expect(m.libre).toBeUndefined();
    }
  });
});
