// Regeneración por el motor viejo (paso 1 de la legumbre como guarnición; Javi, 2026-11-23; D-103).
// Cuando cambiar una comida va por el motor viejo (OriginalPlanApp.jsx, si regenerarComida devuelve null), su
// resultado se comprueba con las intolerancias y los alimentos eliminados antes de aceptarlo. El motor viejo solo
// mira la proteína y el hidrato de su ficha (buildPlan.js:843-845): con «frijoles» eliminado, hoy dejaría pasar el
// burrito de alubias negras.
import { describe, it, expect } from 'vitest';
import { comprobarRegeneracionViejo } from '../regeneracionSegura.js';

const BASE = { intolerances: [], eliminatedFoods: [], gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4 };
const comidaVieja = { time: 'Comida', title: 'Pechuga de pollo a la plancha con arroz', p1: 'Pechuga de pollo (150 g)', p2: 'Arroz (80 g en seco)', shopping: ['Pechuga de pollo (150 g)', 'Arroz (80 g)'] };
const cena = { time: 'Cena', title: 'Merluza al horno con calabacín', p1: 'Merluza (150 g)', p2: 'Calabacín (200 g)', shopping: ['Merluza (150 g)', 'Calabacín (200 g)'] };
// Lo que traería el motor viejo (FREEFORM_COMBOS: «Burrito de alubias negras, arroz y verduras»).
const burrito = { time: 'Comida', title: 'Burrito de alubias negras, arroz y verduras', p1: 'Tortilla integral · alubias negras (120 g) · arroz (60 g)', p2: 'Pimiento · cebolla · aguacate', shopping: ['Alubias negras cocidas (120 g)', 'Tortillas integrales (2)', 'Arroz (60 g)'] };
const habitas = { time: 'Comida', title: 'Habitas salteadas con jamón', p1: 'Habitas (200 g) salteadas', p2: 'Jamón serrano (40 g)', shopping: ['Habitas (200 g)', 'Jamón serrano (40 g)'] };
const ternera = { time: 'Comida', title: 'Ternera a la plancha con patata', p1: 'Ternera (150 g)', p2: 'Patata (250 g)', shopping: ['Ternera (150 g)', 'Patata (250 g)'] };

const plan = (comida) => ({ days: [{ name: 'Lunes', meals: [comida, cena] }], decisionLog: [] });

describe('regeneración por el motor viejo: se comprueba antes de aceptarla', () => {
  it('con «frijoles» eliminado, el burrito de alubias negras no entra: la comida se queda como estaba, con aviso y causa', () => {
    const antes = plan(comidaVieja);
    const r = comprobarRegeneracionViejo(antes, plan(burrito), 0, 'Comida', { ...BASE, eliminatedFoods: ['frijoles'] });
    expect(r.alternativaSinCambio).toBe(true);
    expect(r.days[0].meals[0].title).toBe(comidaVieja.title);
    const e = r.decisionLog.find((x) => x.causa === 'alternativa_motor_viejo_rechazada');
    expect(e).toBeTruthy();
    expect(e.day).toBe('Lunes');
    expect(e.momento).toBe('Comida');
    expect(e.detalle).toMatch(/frijoles/);
  });
  it('con intolerancia a legumbres, las habitas no entran', () => {
    const r = comprobarRegeneracionViejo(plan(comidaVieja), plan(habitas), 0, 'Comida', { ...BASE, intolerances: ['legumbres'] });
    expect(r.alternativaSinCambio).toBe(true);
    expect(r.decisionLog.find((x) => x.causa === 'alternativa_motor_viejo_rechazada').detalle).toMatch(/legumbres/);
  });
  it('con «legumbres» eliminado, el burrito no entra', () => {
    const r = comprobarRegeneracionViejo(plan(comidaVieja), plan(burrito), 0, 'Comida', { ...BASE, eliminatedFoods: ['legumbres'] });
    expect(r.alternativaSinCambio).toBe(true);
  });
  it('una alternativa que el perfil puede comer se acepta tal cual', () => {
    const despues = plan(ternera);
    const r = comprobarRegeneracionViejo(plan(comidaVieja), despues, 0, 'Comida', { ...BASE, eliminatedFoods: ['frijoles'], intolerances: ['legumbres'] });
    expect(r).toBe(despues);
    expect(r.alternativaSinCambio).toBeUndefined();
  });
  it('solo mira la comida que se cambia: la cena del día no cuenta', () => {
    const despues = { days: [{ name: 'Lunes', meals: [ternera, { ...cena, title: 'Burrito de alubias negras' }] }] };
    expect(comprobarRegeneracionViejo(plan(comidaVieja), despues, 0, 'Comida', { ...BASE, eliminatedFoods: ['frijoles'] })).toBe(despues);
  });
});
