// adaptar — una comida tal como la verá el usuario: adaptada a su dieta
// (D-107: caldo de verduras, bebida de soja…) y, con SIBO, a bajo en FODMAP
// (D-104). Lo usan engine2App (al componer y al filtrar) y racionesApp (al
// volver a escribir un plato con sus cantidades).
//
// La comida con primero y segundo (D-116, textos/comidaDoble.js) no se adapta
// entera: se adapta cada plato por separado, antes de unirlos (al componerla y
// al volver a escribirla con sus cantidades). Adaptada entera, la sustitución
// del aceite por el aromatizado con ajo (SIBO) solo alcanzaría al primer aceite
// de la compra, y el texto del segundo nombraría otro aceite que su compra.

import { adaptarComidaFodmap } from '../engine2/nutrientes/fodmap.js';
import { adaptarComidaDieta, dietaDe } from '../engine2/nutrientes/dietas.js';

export const conSibo = (profile) => ((profile && profile.intolerances) || []).includes('sibo');
export const conDieta = (profile) => dietaDe(profile) !== 'omnivora';

export function adaptarSiProcede(meal, profile) {
  if (!meal) return meal;
  if (meal._dishId2 && meal._doble) return meal; // comida doble: ya adaptada, plato a plato
  let m = meal;
  if (conDieta(profile) && m.adaptadoDieta !== dietaDe(profile)) m = adaptarComidaDieta(m, dietaDe(profile));
  if (conSibo(profile) && !m.adaptadoFodmap) m = adaptarComidaFodmap(m);
  return m;
}
