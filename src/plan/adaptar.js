// adaptar — una comida tal como la verá el usuario: adaptada a su dieta
// (D-107: caldo de verduras, bebida de soja…) y, con SIBO, a bajo en FODMAP
// (D-104). Lo usan engine2App (al componer y al filtrar) y racionesApp (al
// volver a escribir un plato con sus cantidades).

import { adaptarComidaFodmap } from '../engine2/nutrientes/fodmap.js';
import { adaptarComidaDieta, dietaDe } from '../engine2/nutrientes/dietas.js';

export const conSibo = (profile) => ((profile && profile.intolerances) || []).includes('sibo');
export const conDieta = (profile) => dietaDe(profile) !== 'omnivora';

export function adaptarSiProcede(meal, profile) {
  if (!meal) return meal;
  let m = meal;
  if (conDieta(profile) && m.adaptadoDieta !== dietaDe(profile)) m = adaptarComidaDieta(m, dietaDe(profile));
  if (conSibo(profile) && !m.adaptadoFodmap) m = adaptarComidaFodmap(m);
  return m;
}
