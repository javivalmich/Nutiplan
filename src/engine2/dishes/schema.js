// Esquema de Plato — Fase 3, Checkpoint 1. Ver CLAUDE.md: contrato de
// salida F3 y constitucion de engine2. Identificadores ASCII (precedente:
// BUG 1 de Fase 1 fue un desajuste por tilde).
//
// 10 campos, cero macros / equivalencias / densidades energeticas (eso es
// Fase 5 — reconciliacion nutricional, fuera de alcance de F3).
//
// Derivados deterministicamente de src/engine/buildPlan.js en este
// checkpoint (ver src/engine2/dishes/derive.js):
//   plateType <- campo directo del combo + fallback de produccion
//   tempFeel  <- copia propia de engine2, paritaria con el motor viejo
//   momento   <- conjunto no vacio de {"comida","cena"} por pertenencia
//                estructural a los pools del motor viejo
//
// Anotados a mano sobre los anclas catalogados en Checkpoint 2 (NO
// derivados aqui, NO tienen funcion de derivacion):
//   rol, batchable, leftoverQuality, shelfLifeDays, energiaCocina

export const MOMENTOS = Object.freeze(['comida', 'cena']);
export const TEMP_FEELS = Object.freeze(['frio', 'caliente', 'muy_caliente']);
export const ENERGIA_COCINA_NIVELES = Object.freeze(['bajo', 'medio', 'alto']);
export const LEFTOVER_QUALITIES = Object.freeze(['baja', 'media', 'alta']);

const REQUIRED_FIELDS = Object.freeze([
  'id',
  'nombre',
  'rol',
  'batchable',
  'leftoverQuality',
  'shelfLifeDays',
  'energiaCocina',
  'momento',
  'tempFeel',
  'plateType',
]);

export class DishSchemaError extends Error {
  constructor(violations) {
    super(`Plato invalido:\n- ${violations.join('\n- ')}`);
    this.name = 'DishSchemaError';
    this.violations = violations;
  }
}

/**
 * Valida un Plato contra el esquema de Fase 3. Lanza DishSchemaError con
 * TODAS las violaciones encontradas — sin fallback silencioso: un campo
 * invalido o ausente es un error, nunca un default (asi se escondio
 * BUG 6 en el motor viejo: un slot sin resolver se rellenaba con un
 * valor por defecto en vez de fallar de forma audible).
 * @param {object} dish
 * @returns {true}
 */
export function validateDish(dish) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (!(field in dish)) errors.push(`falta el campo "${field}"`);
  }
  if (errors.length) throw new DishSchemaError(errors);

  if (typeof dish.id !== 'string' || dish.id.length === 0) {
    errors.push('"id" debe ser un string no vacio');
  }
  if (typeof dish.nombre !== 'string' || dish.nombre.length === 0) {
    errors.push('"nombre" debe ser un string no vacio');
  }
  if (typeof dish.rol !== 'string' || dish.rol.length === 0) {
    errors.push('"rol" debe ser un string no vacio');
  }
  if (typeof dish.batchable !== 'boolean') {
    errors.push('"batchable" debe ser boolean');
  }
  if (!LEFTOVER_QUALITIES.includes(dish.leftoverQuality)) {
    errors.push(`"leftoverQuality" debe ser uno de: ${LEFTOVER_QUALITIES.join(', ')}`);
  }
  if (!Number.isInteger(dish.shelfLifeDays) || dish.shelfLifeDays < 0) {
    errors.push('"shelfLifeDays" debe ser un entero >= 0');
  }
  if (!ENERGIA_COCINA_NIVELES.includes(dish.energiaCocina)) {
    errors.push(`"energiaCocina" debe ser uno de: ${ENERGIA_COCINA_NIVELES.join(', ')}`);
  }
  if (
    !Array.isArray(dish.momento) ||
    dish.momento.length === 0 ||
    !dish.momento.every((m) => MOMENTOS.includes(m)) ||
    new Set(dish.momento).size !== dish.momento.length
  ) {
    errors.push(`"momento" debe ser un subconjunto no vacio y sin duplicados de: ${MOMENTOS.join(', ')}`);
  }
  if (!TEMP_FEELS.includes(dish.tempFeel)) {
    errors.push(`"tempFeel" debe ser uno de: ${TEMP_FEELS.join(', ')}`);
  }
  if (typeof dish.plateType !== 'string' || dish.plateType.length === 0) {
    errors.push('"plateType" debe ser un string no vacio');
  }

  if (errors.length) throw new DishSchemaError(errors);
  return true;
}
