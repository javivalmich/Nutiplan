// Carga del catalogo de platos — Fase 4, Componente P0-1 (infraestructura
// del walk). Vive en dishes/ junto al resto de modulos de catalogo
// (schema.js, derive.js, identity.js): no hay necesidad de una carpeta
// catalog/ nueva, este archivo es un consumidor mas del mismo dominio.
//
// Ruta actual (scripts/phaseB2/output/dishes.json) es la canonica
// ratificada para este checkpoint — ver DECISIONS.md. La mudanza a una
// ruta de producto es un asiento futuro, fuera de alcance de P0.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDish, DishSchemaError } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const CATALOG_PATH = path.resolve(__dirname, '../../../scripts/phaseB2/output/dishes.json');

function deepFreeze(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze(value[key]);
  }
  return value;
}

function describeDish(dish, index) {
  if (dish && typeof dish.id === 'string' && dish.id.length > 0) return `id="${dish.id}"`;
  if (dish && typeof dish.nombre === 'string' && dish.nombre.length > 0) return `nombre="${dish.nombre}"`;
  return `indice ${index}`;
}

/**
 * Carga el catalogo de platos desde catalogPath (por defecto CATALOG_PATH),
 * valida cada plato contra el esquema de schema.js (validateDish, sin
 * duplicar su logica) y devuelve el array congelado en profundidad:
 * Object.freeze recursivo sobre el array, cada plato y sus campos
 * anidados (p. ej. "momento"). Un plato invalido o un id duplicado aborta
 * la carga entera identificando el plato/campo/id ofensivo — nunca un
 * skip silencioso (mismo principio que validateDish, ver schema.js:56-59).
 * @param {string} [catalogPath]
 * @returns {ReadonlyArray<object>}
 */
export function loadCatalog(catalogPath = CATALOG_PATH) {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  const dishes = JSON.parse(raw);

  const seenIds = new Set();
  dishes.forEach((dish, index) => {
    try {
      validateDish(dish);
    } catch (err) {
      if (err instanceof DishSchemaError) {
        throw new DishSchemaError([`plato ${describeDish(dish, index)}: ${err.violations.join('; ')}`]);
      }
      throw err;
    }
    if (seenIds.has(dish.id)) {
      throw new Error(`catalogo invalido: id de plato duplicado "${dish.id}"`);
    }
    seenIds.add(dish.id);
  });

  return deepFreeze(dishes);
}
