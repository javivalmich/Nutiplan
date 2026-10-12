// platosDieta — los platos vegetarianos y veganos (src/data/PLATOS_DIETA.js)
// como fichas del catálogo de engine2 (D-107).
//
// Solo entran en el catálogo de quien sigue una dieta vegetariana o vegana
// (decisión de Javi): los menús de los omnívoros no cambian. Un plato vegano
// sirve también a un vegetariano.
// Los platos de reserva (D-109) solo entran si se piden (último intento de
// generarPlan, cuando a la persona no le queda ningún otro plato).

import { PLATOS_DIETA } from '../data/PLATOS_DIETA.js';
import { validateDish } from '../engine2/dishes/schema.js';
import { dietaDe } from '../engine2/nutrientes/dietas.js';

const SIRVE_A = Object.freeze({
  vegetariana: new Set(['vegetariana', 'vegana']),
  vegana: new Set(['vegana']),
});

let fichas = null;
function todasLasFichas() {
  if (!fichas) {
    fichas = PLATOS_DIETA.map((p) => {
      const ficha = Object.freeze({ id: p.identity.id, nombre: p.identity.title, ...p.engine2, momento: Object.freeze([...p.engine2.momento]), dieta: p.dieta });
      validateDish(ficha);
      return { ficha, reserva: !!p.reserva };
    });
  }
  return fichas;
}

/**
 * Fichas de engine2 de los platos que puede comer esta dieta (ninguna en
 * omnívora). Con { reserva: true }, también los de reserva.
 */
export function platosDeDieta(dieta, { reserva = false } = {}) {
  const sirve = SIRVE_A[dieta];
  if (!sirve) return [];
  return todasLasFichas().filter((x) => (reserva || !x.reserva) && sirve.has(x.ficha.dieta)).map((x) => x.ficha);
}

/** El catálogo dado, más los platos de la dieta del perfil que aún no tenga. */
export function conPlatosDieta(catalog, profile, { reserva = false } = {}) {
  const extra = platosDeDieta(dietaDe(profile), { reserva });
  if (!extra.length) return catalog;
  const ids = new Set(catalog.map((d) => d.id));
  const nuevos = extra.filter((f) => !ids.has(f.id));
  return nuevos.length ? [...catalog, ...nuevos] : catalog;
}
