// Fase 2, guarda id-tupla vs id-slug (D-009). Tras la promocion freeform,
// dishes.json mezcla dos formas de dish.id: tupla JSON serializada (178,
// legacy) y slug plano (63, freeform, p.ej. "gazpacho_huevo_atun"). Todo el
// tooling de scripts/phaseB2/ que hace JSON.parse(dish.id) para leer la
// tupla posicional (P, C, V, V2, S, cookM) asume la forma legacy y LANZA
// SyntaxError ante un slug. Este es el UNICO sitio con try/catch para esa
// distincion: el resto del tooling llama a esIdTupla() en vez de parsear
// a ciegas.

/**
 * @param {string} id
 * @returns {boolean} true si `id` parsea como JSON a un Array de longitud 7
 *   (la forma tupla legacy); false en cualquier otro caso, incluidos slugs
 *   planos y JSON valido no-array.
 */
export function esIdTupla(id) {
  let parsed;
  try {
    parsed = JSON.parse(id);
  } catch {
    return false;
  }
  return Array.isArray(parsed) && parsed.length === 7;
}
