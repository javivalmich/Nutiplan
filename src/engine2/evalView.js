// evalView — adaptador estructural de la salida de materializePlan al contrato
// común de vista de evaluación (D-086, punto 3):
//
//   { days: [ { meals: [ { momento, plato } ] } ] }
//
// Solo traduce estructura. No decide qué se expone al evaluador (eso es del
// cegado, src/eval/blind/) ni corrige anomalías: si el plan no trae lo que el
// contrato necesita, lanza error.
//
// - days: en el orden del plan.
// - momento: meal.momento tal cual (engine2 ya lo emite en vocabulario
//   canónico). Si no lo fuera, el cegado lo rechaza; aquí no se corrige.
// - plato: meal.dish.nombre, literal. No se normaliza ni se recorta.
//
// No importa nada de src/engine/ ni de src/eval/ (CLAUDE.md, reglas 2 y 7).
// No modifica materializePlan.js. No muta el plan recibido.

export function toEvalView(plan) {
  if (!plan || !Array.isArray(plan.days)) {
    throw new Error('evalView(engine2): plan.days no es un array');
  }
  return {
    days: plan.days.map((day, i) => {
      if (!day || !Array.isArray(day.meals)) {
        throw new Error(`evalView(engine2): days[${i}].meals no es un array`);
      }
      return {
        meals: day.meals.map((meal, j) => {
          if (!meal || typeof meal.momento !== 'string' || meal.momento.length === 0) {
            throw new Error(`evalView(engine2): days[${i}].meals[${j}].momento ausente o no es string`);
          }
          if (!meal.dish || typeof meal.dish.nombre !== 'string') {
            throw new Error(`evalView(engine2): days[${i}].meals[${j}].dish.nombre ausente o no es string`);
          }
          return { momento: meal.momento, plato: meal.dish.nombre };
        }),
      };
    }),
  };
}
