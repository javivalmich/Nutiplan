// classifyDayDensity — función única (decisión Fase 0.5, punto 2) que
// centraliza la clasificación denso/ligero de un día, para recalibrar
// umbrales en un solo sitio.
//
// Observable real: meal._spec.density ∈ {"baja","media","alta"} — campo
// directo del combo (src/engine/buildPlan.js, p.ej. línea 706:
// "{tmpl:'caliente_clasico', ..., density:'media', ...}"; _spec===combo,
// ver buildPlan.js:695 `_spec:spec`). NO es un proxy: es el campo que el
// propio motor ya asigna a cada plato.
//
// Calculado sobre comida+cena (desayuno fuera). Mapeo baja=0, media=1,
// alta=2; densidad_dia = density(comida)+density(cena). denso => >=3;
// ligero => <=1; el resto (=2) queda como "intermedio" (no nombrado en la
// decisión original, tercer bucket necesario para cubrir todos los casos).
// Si el día tiene menos de dos comidas legibles (sábado libre, freeForm,
// cena sin _spec legible): status:"unknown", sin inventar clasificación.

import { getMainMeals, isLegibleMeal } from './planReader.js';

const DENSITY_VALUE = { baja: 0, media: 1, alta: 2 };

export function classifyDayDensity(day) {
  const mains = getMainMeals(day).filter(isLegibleMeal);
  if (mains.length < 2) {
    return { status: 'unknown', density: null, classification: null };
  }
  const density = mains.reduce((sum, m) => sum + (DENSITY_VALUE[m._spec.density] ?? 0), 0);
  const classification = density >= 3 ? 'denso' : density <= 1 ? 'ligero' : 'intermedio';
  return { status: 'computed', density, classification };
}
