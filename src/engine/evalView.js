// evalView — adaptador estructural de la salida de buildPlan al contrato común
// de vista de evaluación (D-086, punto 3):
//
//   { days: [ { meals: [ { momento, plato } ] } ] }
//
// Solo traduce estructura. No decide qué se expone al evaluador (eso es del
// cegado, src/eval/blind/) ni corrige anomalías: si el plan no trae lo que el
// contrato necesita, lanza error.
//
// - days: en el orden del plan.
// - momento: meal.time en vocabulario canónico (minúsculas, sin tildes,
//   espacios -> "_"). Es una normalización de etiqueta, no de contenido.
//   Se emiten TODOS los momentos que traiga el plan; la lista blanca
//   (comida, cena) la aplica el cegado.
// - plato: meal.title, literal. No se normaliza ni se recorta.
//
// No modifica buildPlan.js ni ninguna heurística del motor viejo
// (CLAUDE.md, regla 5). No muta el plan recibido.

export function canonicalMomento(label) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export function toEvalView(plan) {
  if (!plan || !Array.isArray(plan.days)) {
    throw new Error('evalView(legacy): plan.days no es un array');
  }
  return {
    days: plan.days.map((day, i) => {
      if (!day || !Array.isArray(day.meals)) {
        throw new Error(`evalView(legacy): days[${i}].meals no es un array`);
      }
      return {
        meals: day.meals.map((meal, j) => {
          if (!meal || typeof meal.time !== 'string' || meal.time.length === 0) {
            throw new Error(`evalView(legacy): days[${i}].meals[${j}].time ausente o no es string`);
          }
          if (typeof meal.title !== 'string') {
            throw new Error(`evalView(legacy): days[${i}].meals[${j}].title ausente o no es string`);
          }
          return { momento: canonicalMomento(meal.time), plato: meal.title };
        }),
      };
    }),
  };
}
