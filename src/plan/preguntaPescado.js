// Pregunta del pescado en el cuestionario (D-118: el tope semanal de pescado y
// marisco es un campo del perfil, pescadoMaxSemana, de 2 a 4; sin él, el motor
// usa 3). Decisión de Javi del 2026-11-25:
//   - Opciones 2, 3, 4 y «Tú decides». «Tú decides» no guarda el campo: queda
//     el valor por defecto del motor, así que un perfil guardado antes de la
//     pregunta funciona igual.
//   - No hay «sin límite» (D-118.1 solo admite de 2 a 4).
//   - Solo con dieta omnívora, y no si el usuario excluyó pescado y marisco.
// El perfil se guarda entero (localStorage y user_data.data.profile), y
// engine2App pasa el campo al motor (conTopePescado).

import { dietaDe } from '../engine2/nutrientes/dietas.js';
import { PESCADO_MAX_SEMANA } from '../engine2/contracts/profile.js';

export const PREGUNTA_PESCADO = '¿Cuántas veces a la semana quieres pescado o marisco?';
export const AYUDA_PESCADO = 'Cuenta las comidas y las cenas. Si un día no hay otro plato que encaje, puede salir una vez más.';

export const OPCIONES_PESCADO = Object.freeze([
  Object.freeze({ valor: 2, label: '2 veces', desc: 'Como mucho 2 a la semana' }),
  Object.freeze({ valor: 3, label: '3 veces', desc: 'Como mucho 3 a la semana' }),
  Object.freeze({ valor: 4, label: '4 veces', desc: 'Como mucho 4 a la semana' }),
  Object.freeze({ valor: 'auto', label: 'Tú decides', desc: `Lo dejamos en ${PESCADO_MAX_SEMANA.defecto} a la semana` }),
]);

const VALORES = new Set(OPCIONES_PESCADO.map((o) => o.valor));

/** La pregunta se ve con dieta omnívora y si el usuario puede comer pescado o marisco. */
export function preguntaPescadoVisible(profile) {
  if (dietaDe(profile) !== 'omnivora') return false;
  const intol = (profile && profile.intolerances) || [];
  return !(intol.includes('pescado') && intol.includes('mariscos'));
}

/** Opción marcada: la del perfil o, sin el campo, «Tú decides». */
export function respuestaPescado(profile) {
  return profile && 'pescadoMaxSemana' in profile ? profile.pescadoMaxSemana : 'auto';
}

/** Perfil nuevo con la respuesta: 2, 3 o 4 en pescadoMaxSemana; «Tú decides» quita el campo. */
export function conRespuestaPescado(profile, valor) {
  if (!VALORES.has(valor)) throw new Error(`pregunta del pescado: opción no válida ${JSON.stringify(valor)}`);
  const { pescadoMaxSemana: _quitado, ...resto } = profile || {};
  return valor === 'auto' ? resto : { ...resto, pescadoMaxSemana: valor };
}
