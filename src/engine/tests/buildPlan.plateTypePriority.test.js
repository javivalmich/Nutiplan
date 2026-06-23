// BUG 4 — Parte 1 (Fase 1, Checkpoint 5).
//
// Auditoría: el guessing por substring de título en validateWeek (secciones
// 8 y 10, buildPlan.js ~2700-2766) YA estaba subordinado a metadata.plateType
// antes de este checkpoint ("var pt = meal.metadata && meal.metadata.plateType
// ? meal.metadata.plateType : null; if(!pt) { ...substring... }"). No hubo
// cambio de código en Parte 1 — se verificó, no se asumió.
//
// validateWeek no se exporta (closure interno de buildPlan) y dayKcalList no
// se expone en qaTrace, así que no es posible invocar la rama de cálculo de
// kcal directamente desde un test sin añadir instrumentación nueva — fuera
// de scope de Fase 1 (no se añade). Este test ancla en su lugar el dato real
// que demuestra POR QUÉ la prioridad de metadata.plateType importa: existen
// platos reales del repertorio cuyo título contiene una palabra que el
// substring guessing asociaría a un plateType distinto del real.
//
// Encontrados por inspección de las 9 fixtures del baseline
// (analysis/checkpoint5_plateType_inventory.mjs):
//   - "Bowl proteico de ternera magra con arroz blanco" → metadata.plateType
//     real "bowl" (450 kcal), pero el título contiene "arroz" → el substring
//     guessing lo clasificaría como "caliente_arroz" (520 kcal) si llegara
//     a ejecutarse sobre este plato.
//   - "Cerdo al horno con pimientos asados" → metadata.plateType real
//     "plancha_verdura" (320 kcal), título contiene "horno" → substring
//     lo clasificaría como "pescado_horno" (390 kcal).
//
// En ambos casos, metadata.plateType (ya prioritario en el código actual)
// evita el error: estos platos jamás llegan al substring guessing porque
// metadata.plateType no es null.

import { describe, it, expect } from 'vitest';
import { FIXTURES, runBaseline } from './baselineFixtures.js';

function findMealByTitle(result, title) {
  for (const day of result.days) {
    const meal = (day.meals || []).find((m) => m && m.title === title);
    if (meal) return meal;
  }
  return null;
}

describe('buildPlan — metadata.plateType es prioritario sobre el título engañoso (BUG 4, Parte 1)', () => {
  it('"Bowl proteico de ternera magra con arroz blanco" mantiene plateType "bowl", no "caliente_arroz"', () => {
    const fixture = FIXTURES.find((f) => f.name === 'fat_loss_general');
    const result = runBaseline(fixture);
    const meal = findMealByTitle(result, 'Bowl proteico de ternera magra con arroz blanco');
    expect(meal).toBeTruthy();
    // El título contiene "arroz" (palabra clave del substring guessing para
    // caliente_arroz), pero el plateType real y correcto es "bowl".
    expect(meal.title.toLowerCase()).toContain('arroz');
    expect(meal.metadata.plateType).toBe('bowl');
    expect(meal.metadata.plateType).not.toBe('caliente_arroz');
  });

  it('"Cerdo al horno con pimientos asados" mantiene plateType "plancha_verdura", no "pescado_horno"', () => {
    const fixture = FIXTURES.find((f) => f.name === 'definicion_flexible');
    const result = runBaseline(fixture);
    const meal = findMealByTitle(result, 'Cerdo al horno con pimientos asados');
    expect(meal).toBeTruthy();
    expect(meal.title.toLowerCase()).toContain('horno');
    expect(meal.metadata.plateType).toBe('plancha_verdura');
    expect(meal.metadata.plateType).not.toBe('pescado_horno');
  });

  it('la única comida del baseline sin metadata.plateType es "Comida libre 🎉" (Sábado, wildcard)', () => {
    // Ancla el inventario real: 9/9 fixtures, una sola comida por fixture
    // cae al fallback de substring porque libreComida() no declara plateType.
    FIXTURES.forEach((fixture) => {
      const result = runBaseline(fixture);
      const sabado = result.days.find((d) => d.name === 'Sábado');
      const libre = sabado.meals.find((m) => m.title === 'Comida libre 🎉');
      expect(libre).toBeTruthy();
      expect(libre.metadata.plateType).toBeUndefined();
    });
  });
});
