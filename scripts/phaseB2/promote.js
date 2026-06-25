// Fase 2, Paso B.2, Commit 3 — promotor: dishes.scaffold.json ->
// dishes.json, SOLO si no queda ningun "TODO". Vive en scripts/ (fuera
// de engine2/). Si queda algun TODO, aborta con la lista, sin salida
// parcial. Cada dish promovido se valida contra validateDish real
// (schema.js) antes de aceptar la promocion.

import { findTodoFields } from './antiTodo.js';
import { validateDish } from '../../src/engine2/dishes/schema.js';

/**
 * @param {object[]} scaffoldDishes
 * @returns {{ ok: true, dishes: object[] } | { ok: false, pendientes: { id: string, field: string }[] }}
 */
export function promote(scaffoldDishes) {
  const pendientes = findTodoFields(scaffoldDishes);
  if (pendientes.length > 0) {
    return { ok: false, pendientes };
  }

  // Ningun TODO: cada dish DEBE validar contra el esquema real antes de
  // aceptarse como promocion. Si alguno no valida, lanza (sin try/catch
  // silencioso: un dish que no valida es un bug del scaffold, no algo a
  // descartar en silencio).
  for (const dish of scaffoldDishes) {
    validateDish(dish);
  }

  return { ok: true, dishes: scaffoldDishes };
}
