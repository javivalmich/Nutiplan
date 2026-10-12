// Aliños (D-105): nombres visibles sin los aliños con ajo y reglas de aliño
// del menú. Semanas reales (catálogo de 241 platos, varias semillas y perfiles).

import { describe, it, expect } from 'vitest';
import { materializePlan } from '../materializePlan.js';
import { loadCatalog } from '../dishes/loadCatalog.js';
import { aplicarAjustesD099 } from '../dishes/ajustesD099.js';
import {
  nombreVisible, aplicarNombresD105, alinoDe, ALINOS_CON_AJO, TOPE_AJILLO_SEMANA,
} from '../dishes/alinosD105.js';
import { elegirAlternativa } from '../walk/alternativa.js';

const catalog = loadCatalog();
const PERFILES = [
  { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] },
  { trainingDays: [] },
];
const SEMILLAS = Array.from({ length: 25 }, (_, i) => 70001 + i);
const semana = (seed, profile, extra = {}) => materializePlan({ profile, seed, strategy: 'mantenimiento_equilibrado', catalog, ...extra });
function* casos(extra) {
  for (const profile of PERFILES) for (const seed of SEMILLAS) yield { profile, seed, plan: semana(seed, profile, extra) };
}
const servidos = (plan) => plan.days.flatMap((d) => d.meals.filter((m) => !m.libre).map((m) => ({ ...m, day: d.day })));
const relajada = (plan) => plan.decisionLog.some((e) => typeof e.evidencia === 'string' && e.evidencia.includes('alino sin aplicar'));

describe('D-105 · nombre visible', () => {
  it('quita los aliños con ajo y deja los demás', () => {
    expect(nombreVisible('Merluza al horno con ajo, perejil y guindilla con judías verdes y patata')).toBe('Merluza al horno con judías verdes y patata');
    expect(nombreVisible('Pechuga de pollo a la plancha con limón, orégano y ajo con brócoli')).toBe('Pechuga de pollo a la plancha con brócoli');
    expect(nombreVisible('Huevos en tortilla con pimentón ahumado y ajo con zanahoria')).toBe('Huevos en tortilla con zanahoria');
    expect(nombreVisible('Ternera magra a la plancha con romero, limón y ajo con espinacas y patata')).toBe('Ternera magra a la plancha con espinacas y patata');
    expect(nombreVisible('Lomo de cerdo a la plancha con mostaza y miel con brócoli')).toBe('Lomo de cerdo a la plancha con mostaza y miel con brócoli');
    expect(nombreVisible('Pechuga de pavo salteado con curry y cúrcuma con calabacín')).toBe('Pechuga de pavo salteado con curry y cúrcuma con calabacín');
  });

  it('en gambas y conejo queda «al ajillo»; las formas cortas no se tocan', () => {
    expect(nombreVisible('Gambas salteado con ajo, perejil y guindilla con calabacín y arroz blanco')).toBe('Gambas al ajillo con calabacín y arroz blanco');
    expect(nombreVisible('Conejo al horno con ajo, perejil y guindilla con espinacas')).toBe('Conejo al ajillo con espinacas');
    expect(nombreVisible('Conejo al horno con romero, limón y ajo con espinacas y boniato')).toBe('Conejo al horno con espinacas y boniato');
    expect(nombreVisible('Pasta integral al ajillo con gambas')).toBe('Pasta integral al ajillo con gambas');
    expect(nombreVisible('Alubias blancas al ajillo con pimientos')).toBe('Alubias blancas al ajillo con pimientos');
    expect(nombreVisible('Pollo al ajillo con patatas nuevas')).toBe('Pollo al ajillo con patatas nuevas');
  });

  it('es idempotente y no deja ningún aliño con ajo en el catálogo', () => {
    const conNombres = aplicarNombresD105(aplicarAjustesD099(catalog));
    expect(conNombres).toHaveLength(catalog.length);
    for (const d of conNombres) {
      expect(nombreVisible(d.nombre)).toBe(d.nombre);
      for (const a of ALINOS_CON_AJO) expect(d.nombre).not.toContain(a);
    }
  });

  it('no modifica el catálogo cargado (dishes.json, D-028)', () => {
    const antes = catalog.map((d) => d.nombre);
    aplicarNombresD105(catalog);
    expect(catalog.map((d) => d.nombre)).toEqual(antes);
    expect(antes.some((n) => n.includes('ajo, perejil y guindilla'))).toBe(true);
  });

  it('alinoDe lee el aliño de la tupla; los platos libres no tienen, salvo el pollo al ajillo', () => {
    const tupla = catalog.find((d) => d.id.startsWith('[') && d.id.includes('"ajillo"'));
    expect(alinoDe(tupla)).toBe('ajillo');
    expect(alinoDe({ id: 'pollo_ajillo_patatas' })).toBe('ajillo');
    expect(alinoDe({ id: 'pad_thai_gambas' })).toBe(null);
  });
});

describe('D-105 · reglas de aliño del menú', { timeout: 60000 }, () => {
  it('los platos del plan llevan el nombre visible', () => {
    for (const { plan } of casos()) {
      for (const m of servidos(plan)) for (const a of ALINOS_CON_AJO) expect(m.dish.nombre).not.toContain(a);
    }
  });

  it('el mismo aliño no sale en la comida y la cena del mismo día', () => {
    for (const extra of [{}, { cocinarEnCantidad: { activo: true } }]) {
      for (const { plan } of casos(extra)) {
        if (relajada(plan)) continue;
        for (const d of plan.days) {
          const al = d.meals.filter((m) => !m.libre).map((m) => alinoDe(m.dish)).filter(Boolean);
          expect(new Set(al).size).toBe(al.length);
        }
      }
    }
  });

  it(`el ajillo sale como mucho ${TOPE_AJILLO_SEMANA} veces por semana`, () => {
    for (const extra of [{}, { cocinarEnCantidad: { activo: true } }]) {
      for (const { plan } of casos(extra)) {
        if (relajada(plan)) continue;
        const ajillos = servidos(plan).filter((m) => alinoDe(m.dish) === 'ajillo').length;
        expect(ajillos).toBeLessThanOrEqual(TOPE_AJILLO_SEMANA);
      }
    }
  });

  it('en estas semanas la regla nunca ha tenido que relajarse', () => {
    for (const { plan } of casos()) expect(relajada(plan)).toBe(false);
  });

  it('la semana del cambio: los nombres antiguos guardados siguen sin repetirse', () => {
    const original = new Map(catalog.map((d) => [d.id, d.nombre]));
    for (const profile of PERFILES) {
      for (const seed of SEMILLAS.slice(0, 10)) {
        const anterior = semana(seed, profile);
        const nombresAntiguos = servidos(anterior).map((m) => original.get(m.dish.id));
        const siguiente = semana(seed + 1000, profile, { platosRecientes: nombresAntiguos });
        const antes = new Set(nombresAntiguos.map(nombreVisible));
        for (const m of servidos(siguiente)) expect(antes.has(m.dish.nombre)).toBe(false);
      }
    }
  });
});

describe('D-105 · alternativas', { timeout: 60000 }, () => {
  it('la alternativa respeta el aliño del otro plato del día y el tope de ajillo', () => {
    const cat = aplicarNombresD105(aplicarAjustesD099(catalog));
    for (const profile of PERFILES) {
      for (const seed of SEMILLAS.slice(0, 10)) {
        const plan = semana(seed, profile);
        const sem = plan.days.flatMap((d) => d.meals.map((m) => ({ day: d.day, momento: m.momento, dishId: m.dish.id })));
        for (const d of plan.days) {
          for (const m of d.meals) {
            const { dish, decisionLog } = elegirAlternativa({
              catalog: cat, semana: sem, day: d.day, momento: m.momento, actualId: m.dish.id, seed: `${seed}`,
            });
            if (decisionLog.some((e) => e.causa === 'alternativa_alino_sin_aplicar')) continue;
            const otros = sem.filter((s) => !(s.day === d.day && s.momento === m.momento));
            const porId = new Map(cat.map((x) => [x.id, x]));
            const al = alinoDe(dish);
            if (!al) continue;
            const hoy = otros.filter((s) => s.day === d.day).map((s) => alinoDe(porId.get(s.dishId)));
            expect(hoy).not.toContain(al);
            if (al === 'ajillo') {
              expect(otros.filter((s) => alinoDe(porId.get(s.dishId)) === 'ajillo').length).toBeLessThan(TOPE_AJILLO_SEMANA);
            }
          }
        }
      }
    }
  });
});
