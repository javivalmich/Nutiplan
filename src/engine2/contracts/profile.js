// validateProfile — Fase 4, Componente P0-4. Vive en contracts/ junto a
// weeklyTargets.js (Componente P0-3): misma naturaleza, contrato
// transversal sin domicilio en dishes/, memory/ o skeleton/.
//
// Regla ratificada: el validador reconoce UNICAMENTE los campos
// consumidos por P1 — hoy, trainingDays (array de dias del vocabulario
// DAYS_ORDER, importado del skeleton, no duplicado). Crece con
// consumidores futuros. Sin placeholders de campos sin consumidor: no se
// valida nada que P1 no consuma todavia.

import { DAYS_ORDER } from '../skeleton/days.js';

export class ProfileValidationError extends Error {
  constructor(violations) {
    super(`Perfil invalido:\n- ${violations.join('\n- ')}`);
    this.name = 'ProfileValidationError';
    this.violations = violations;
  }
}

/**
 * Valida un Profile contra los campos consumidos por P1. Lanza
 * ProfileValidationError con TODAS las violaciones encontradas — sin
 * fallback silencioso (mismo principio que validateDish, ver
 * dishes/schema.js).
 * @param {object} profile
 * @returns {true}
 */
export function validateProfile(profile) {
  const errors = [];

  if (!profile || !('trainingDays' in profile)) {
    errors.push('falta el campo "trainingDays"');
  } else if (!Array.isArray(profile.trainingDays)) {
    errors.push(`"trainingDays" debe ser un array, recibido: ${JSON.stringify(profile.trainingDays)}`);
  } else {
    for (const day of profile.trainingDays) {
      if (!DAYS_ORDER.includes(day)) {
        errors.push(`"trainingDays" contiene un dia fuera del vocabulario DAYS_ORDER: "${day}"`);
      }
    }
  }

  if (errors.length) throw new ProfileValidationError(errors);
  return true;
}
