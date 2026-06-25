// Fase 2, Paso B.2, Commit 2 — utilidad anti-TODO. Vive en scripts/
// (fuera de engine2/). Pura: no lee disco, recibe el array de dishes ya
// cargado por el llamador (test o runner).

const EDITORIAL_FIELDS = Object.freeze(['nombre', 'rol', 'batchable', 'leftoverQuality', 'shelfLifeDays', 'energiaCocina']);

/**
 * Lista todos los campos editoriales pendientes ("TODO") en un array de
 * dishes (scaffold). Vacio significa "listo para promote.js".
 * @param {object[]} dishes
 * @returns {{ id: string, field: string }[]}
 */
export function findTodoFields(dishes) {
  const pendientes = [];
  for (const dish of dishes) {
    for (const field of EDITORIAL_FIELDS) {
      if (dish[field] === 'TODO') pendientes.push({ id: dish.id, field });
    }
  }
  return pendientes;
}
