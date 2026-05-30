// ─── NUTRITIONAL ENGINE — PUBLIC API ─────────────────────────────────────────
// Re-exporta todo lo público del motor nutricional.
// Fase 2: sólo funciones puras. buildPlan se añade en Fase 3.

export { ACT_MULT, GOAL_ADJ, PROTEIN_FACTOR, FAT_FACTOR } from './constants.js';

export { simpleHash, _hashStr } from './hash.js';

export { computeTrend, getNutricionistaFeedback, adherenciaPct } from './progress.js';

export {
  calcTDEE,
  calcTarget,
  calcMacros,
  computeStrategy,
  getMealRules,
  computeCheckinAdjustment,
  getAgeFromDOB,
  getPastProteinFrequency,
} from './nutrition.js';

export { FOOD_DB, searchFoods, calcFoodKcal, getDefaultAlts } from './foods.js';

export { validateFreeFormCombo, validateFreeFormPool } from './validation.js';

export { buildPlan } from './buildPlan.js';
