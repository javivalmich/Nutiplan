// I-4, punto 5. Con SIBO, la adaptación cambia el nombre de algunos
// ingredientes de los platos compuestos («Pasta integral» → «Pasta sin
// gluten», «espárragos» → «judías verdes»), y la comida adaptada se lee con
// otra clave (pasta_seco, judia_verde) que la que recomponer() busca
// (pasta_integral_seco, esparrago). Antes no encontraba los gramos decididos y
// el texto se quedaba con los de partida (la pasta, siempre 80 g).
// Celíaco, sin lactosa, vegetariana y vegana no adaptan los compuestos con
// cambio de clave (clavesDeAdaptacion vacío): se comprueba también.
import { describe, it, expect } from 'vitest';
import { catalogoApp } from '../catalogo.js';
import { componerPlato, tuplaDe } from '../textos/componer.js';
import { clavesDe } from '../textos/compuestos.js';
import { adaptarSiProcede } from '../adaptar.js';
import { ajustarDia, clavesDeAdaptacion } from '../racionesApp.js';
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

  it('con SIBO, la compra muestra la pasta sin gluten decidida', () => {
    for (const d of pastas) {
      const r = pastaDecididaYMostrada(d, SIBO);
      expect(r.linea).toMatch(/pasta sin gluten/i);
      expect(r.decidida).toBeGreaterThan(80);
      expect(r.mostrada).toBe(r.decidida);
    }
  });

  // La verdura es fija en las raciones (D-108), así que hoy este cambio de clave
  // no produce descuadre: se comprueba que el mapa la recoge para cuando lo haga.
  it('con SIBO, la verdura que cambia de nombre (espárragos → judías verdes) queda en el mapa de claves', () => {
    const conEsparrago = catalogoApp().filter((d) => { const t = tuplaDe(d.id); return t && clavesDe(t).V === 'esparrago'; });
    expect(conEsparrago.length).toBeGreaterThan(0);
    for (const d of conEsparrago) {
      const m = adaptarSiProcede(componerPlato(d, d.momento.includes('comida') ? 'comida' : 'cena', 2000), SIBO);
      expect(clavesDeAdaptacion(m, SIBO).get('judia_verde')).toBe('esparrago');
      const items = leerComida(m).items.map((it) => ({ clave: it.clave, gramos: it.gramos }));
      const verdura = items.find((i) => i.clave === 'judia_verde');
      expect(verdura).toBeTruthy();
      // Con el mapa, los gramos leídos de las judías verdes llegan al hueco del espárrago.
      const releido = leerComida(adaptarSiProcede(m, SIBO)).items.find((i) => i.clave === 'judia_verde').gramos;
      expect(releido).toBe(verdura.gramos);
    }
  });

  it('celíaco, sin lactosa, vegetariana y vegana: ninguna adaptación de un compuesto cambia de clave', () => {
    const PERFILES = [{ ...SIN_SIBO, intolerances: ['gluten'] }, { ...SIN_SIBO, intolerances: ['lactosa'] }, { ...SIN_SIBO, dieta: 'vegetariana' }, { ...SIN_SIBO, dieta: 'vegana' }];
    const compuestos = catalogoApp().filter((d) => tuplaDe(d.id));
    for (const p of PERFILES) for (const d of compuestos) {
      const m = adaptarSiProcede(componerPlato(d, d.momento.includes('comida') ? 'comida' : 'cena', 2000), p);
      expect(clavesDeAdaptacion(m, p).size).toBe(0);
    }
  });
});
