// legacy — arreglos de texto en lo que aún escribe el motor viejo
// (desayunos y tentempiés) (D-108). El motor viejo no se toca: se arregla su
// salida.
//   - Cantidades dobles: «200g yogur griego 0% (125g)» → «200 g yogur griego 0%»
//     (el número de delante es la ración; el paréntesis venía de la etiqueta
//     del ingrediente).

const DOBLE = /(\b\d+)\s*(g|ml) ([a-záéíóúñü][^·()]{1,40}?) \(\d+\s*(?:g|ml)\)/gi;

export function limpiarTexto(texto) {
  if (typeof texto !== 'string') return texto;
  return texto.replace(DOBLE, (m, n, u, nombre) => `${n} ${u} ${nombre}`);
}

/** Desayuno o tentempié del motor viejo con el texto arreglado. Idempotente. */
export function limpiarComidaLegacy(meal) {
  if (!meal) return meal;
  return {
    ...meal,
    p1: limpiarTexto(meal.p1),
    p2: limpiarTexto(meal.p2),
    recipe: Array.isArray(meal.recipe) ? meal.recipe.map(limpiarTexto) : meal.recipe,
  };
}
