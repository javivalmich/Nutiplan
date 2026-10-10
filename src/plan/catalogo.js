// catalogo — el catálogo de platos de engine2 para la app (navegador).
//
// engine2/dishes/loadCatalog.js lee el JSON con node:fs y no funciona en el
// navegador. Aquí se importa el mismo archivo como módulo JSON (Vite) y se
// valida plato a plato con el mismo esquema (engine2/dishes/schema.js).

import platos from '../../scripts/phaseB2/output/dishes.json';
import { validateDish } from '../engine2/dishes/schema.js';

let cache = null;

export function catalogoApp() {
  if (cache) return cache;
  const ids = new Set();
  for (const d of platos) {
    validateDish(d);
    if (ids.has(d.id)) throw new Error(`catalogo: id duplicado ${d.id}`);
    ids.add(d.id);
  }
  cache = Object.freeze(platos.map((d) => Object.freeze({ ...d, momento: Object.freeze([...d.momento]) })));
  return cache;
}
