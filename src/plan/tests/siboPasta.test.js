// I-4, punto 5 — DEFECTO CONOCIDO, SIN CORREGIR (pendiente de autorización).
// Con SIBO, la pasta de los platos compuestos se adapta a «pasta sin gluten».
// Las raciones deciden sus gramos, pero el texto y la compra se quedan con la
// cantidad de partida (80 g).
// Causa: la comida adaptada se lee como `pasta_seco`, y recomponer() busca los
// gramos decididos con la clave del compuesto, `pasta_integral_seco`
// (src/plan/textos/componer.js, recomponer): no los encuentra y deja los de partida.
// `it.fails` documenta el defecto: cuando se corrija, este test pasará a fallar
// y habrá que quitarle la marca.
import { describe, it, expect } from 'vitest';
import { catalogoApp } from '../catalogo.js';
import { componerPlato, tuplaDe } from '../textos/componer.js';
import { clavesDe } from '../textos/compuestos.js';
import { adaptarSiProcede } from '../adaptar.js';
import { ajustarDia } from '../racionesApp.js';
import { leerComida } from '../medidor/leerComida.js';
import { racionesCalculadas } from '../../../scripts/banco/metricas.mjs';

const SIBO = { intolerances: ['sibo'], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] };
const SIN_SIBO = { ...SIBO, intolerances: [] };
const pastas = catalogoApp().filter((d) => { const t = tuplaDe(d.id); return t && /^pasta/.test(clavesDe(t).C || ''); });

/** Pasta decidida por las raciones y pasta que muestra la compra, en un día con ese plato a la comida y una cena fija. */
function pastaDecididaYMostrada(dish, perfil) {
  const comida = adaptarSiProcede(componerPlato(dish, 'comida', 2000), perfil);
  const cena = { time: 'Cena', title: 'Merluza con patata', p1: 'Merluza (200g) al horno', p2: 'Patata (200g) cocida', shopping: ['Merluza (200g)', 'Patata (200g)'] };
  const { day } = ajustarDia({ name: 'Lunes', meals: [comida, cena] }, perfil, 2000);
  const decidida = racionesCalculadas(day, perfil, 2000).comidas['0'].items.filter((i) => /^pasta/.test(i.clave)).reduce((a, i) => a + i.gramos, 0);
  const mostrada = leerComida(day.meals[0]).items.filter((i) => /^pasta/.test(i.clave)).reduce((a, i) => a + i.gramos, 0);
  return { decidida, mostrada, linea: day.meals[0].shopping.find((s) => /pasta/i.test(s)) };
}

describe('pasta de los platos compuestos: lo decidido es lo que se muestra', () => {
  it('hay platos compuestos de pasta en el catálogo', () => {
    expect(pastas.length).toBeGreaterThan(5);
  });

  it('sin SIBO, la compra muestra la pasta decidida', () => {
    for (const d of pastas) {
      const r = pastaDecididaYMostrada(d, SIN_SIBO);
      expect(r.decidida).toBeGreaterThan(80);
      expect(r.mostrada).toBe(r.decidida);
    }
  });

  it.fails('con SIBO, la compra muestra la pasta sin gluten decidida (hoy se queda en 80 g)', () => {
    for (const d of pastas) {
      const r = pastaDecididaYMostrada(d, SIBO);
      expect(r.linea).toMatch(/pasta sin gluten/i);
      expect(r.decidida).toBeGreaterThan(80);
      expect(r.mostrada).toBe(r.decidida);
    }
  });

  it('con SIBO, hoy: se decide más de 80 g y la compra dice 80 g en todos los platos de pasta', () => {
    for (const d of pastas) {
      const r = pastaDecididaYMostrada(d, SIBO);
      expect(r.decidida).toBeGreaterThan(80);
      expect(r.linea).toBe('Pasta sin gluten (80 g)');
    }
  });
});
