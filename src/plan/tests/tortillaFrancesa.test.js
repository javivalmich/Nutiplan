// Tortillas de plantilla («Huevos en tortilla con …»): son tortillas francesas
// dobladas. Se baten, se cuajan a fuego medio y se doblan, sin darles la vuelta
// (Javi, 2026-11-25; hoja de tiempo y dificultad, PR #34: así quedan en fácil).
// Antes la receta decía «cuaja la tortilla 2-3 min por cada lado».
import { describe, it, expect } from 'vitest';
import { catalogoApp } from '../catalogo.js';
import { componerPlato, tuplaDe } from '../textos/componer.js';
import { filtrarCatalogo } from '../engine2App.js';

const tortillas = catalogoApp().filter((d) => {
  const t = tuplaDe(d.id);
  return t && t.P === 'huevo' && t.cookM === 'tortilla';
});
const VUELTA = /por cada lado|(?<!sin )dar(le|les)? la vuelta|dale la vuelta|gírala|voltea/i;

describe('Tortillas de plantilla: francesa doblada, sin vuelta', () => {
  it('hay 3 en el catálogo', () => {
    expect(tortillas.map((d) => d.nombre)).toHaveLength(3);
  });

  for (const d of tortillas) {
    for (const momento of ['comida', 'cena']) {
      for (const kcal of [1434, 2000, 3714]) {
        it(`${d.nombre} (${momento}, ${kcal} kcal)`, () => {
          const { recipe } = componerPlato(d, momento, kcal);
          const pasos = recipe.filter((p) => typeof p === 'string');
          const paso = pasos.find((p) => /huevos/i.test(p) && /tortilla/i.test(p));
          expect(paso, pasos.join(' / ')).toBeDefined();
          expect(paso).toMatch(/^Bate los huevos/);
          expect(paso).toMatch(/fuego medio/);
          expect(paso).toMatch(/dóbla\w*/);
          expect(paso).toMatch(/sin darle la vuelta/);
          for (const p of pasos) expect(p).not.toMatch(VUELTA);
        });
      }
    }
  }

  // El texto no debe parecer un lácteo a los filtros por texto: «cuajada» lo es
  // (alergenos.js, dietas.js) y quitaba las tortillas a quien no toma lactosa.
  const PERFIL = { intolerances: [], eliminatedFoods: [], gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4 };
  for (const [caso, perfil] of [['sin lactosa', { intolerances: ['lactosa'] }], ['vegetariana', { dieta: 'vegetariana' }]]) {
    it(`las 3 siguen en el catálogo ${caso}`, () => {
      const ids = new Set(filtrarCatalogo(catalogoApp(), { ...PERFIL, ...perfil }, 2000).catalogo.map((d) => d.id));
      for (const d of tortillas) expect(ids.has(d.id), d.nombre).toBe(true);
    });
  }
});
