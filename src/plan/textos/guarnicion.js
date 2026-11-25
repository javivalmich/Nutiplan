// guarnicion — un plato de plantilla con la legumbre de guarnición en lugar de
// su hidrato (paso 9 de la legumbre como guarnición; D-120).
//
// Función pura sobre el plato del catálogo: el nombre nuevo («Conejo al horno
// con espinacas y garbanzos»), la tupla con la legumbre en el hueco del hidrato
// (componerPlato la escribe: compra, preparación y receta) y la marca
// _guarnicion, que lleva la comida hasta las raciones (racionesApp.js) y las
// alternativas (engine2App.js). El id del plato no cambia.
//
// Aún no lo usa ningún plan: la decisión de poner guarnición es del paso 4.

import { legumbresGuarnicion } from '../../engine2/dishes/guarnicionLegumbre.js';
import { tuplaDe } from './componer.js';
import { LEGUMBRES_GUARNICION, claveHidratoGuarnicion } from './compuestos.js';

const PALABRA_HIDRATO = Object.freeze({ arroz: /arroz( blanco| integral)?/i, patata: /patatas?/i, boniato: /boniato/i, quinoa: /quinoa/i });

/** El nombre del plato con la legumbre donde decía el hidrato (la última vez que lo dice). */
export function nombreConGuarnicion(nombre, hidrato, legumbre) {
  const re = PALABRA_HIDRATO[hidrato];
  const m = re ? [...nombre.matchAll(new RegExp(re.source, 'gi'))].pop() : null;
  return m ? `${nombre.slice(0, m.index)}${legumbre}${nombre.slice(m.index + m[0].length)}` : `${nombre} con ${legumbre}`;
}

/**
 * El plato con la legumbre `clave` de guarnición. Solo una legumbre de la lista
 * del plato (guarnicionLegumbre.js): fuera de ella, error.
 * @param {{id:string, nombre:string}} dish plato del catálogo (con el nombre visible)
 * @param {string} clave ingrediente del medidor (garbanzos_cocidos, habitas…)
 */
export function conGuarnicion(dish, clave) {
  const lista = legumbresGuarnicion(dish.id);
  if (!lista || !lista.includes(clave)) throw new Error(`conGuarnicion: ${clave} no es una legumbre de guarnición de ${dish.id}`);
  const tupla = tuplaDe(dish.id);
  const l = LEGUMBRES_GUARNICION[clave];
  const frio = tupla.tmpl === 'ensalada' || tupla.cookM === 'crudo';
  return {
    ...dish,
    nombre: nombreConGuarnicion(dish.nombre, tupla.C, l.nombre),
    _tuplaGuarnicion: { ...tupla, C: claveHidratoGuarnicion(clave, frio) },
    _guarnicion: { clave, legumbre: l.nombre, hidratoOriginal: tupla.C, nombreOriginal: dish.nombre },
  };
}
