// validateProfile — Fase 4, Componente P0-4. Vive en contracts/ junto a
// weeklyTargets.js (Componente P0-3): misma naturaleza, contrato
// transversal sin domicilio en dishes/, memory/ o skeleton/.
//
// Regla ratificada: el validador reconoce UNICAMENTE los campos
// consumidos por P1/P2 — trainingDays (array de dias del vocabulario
// DAYS_ORDER, importado del skeleton, no duplicado) y, desde D-022
// (F4-P2b-i, primer consumidor P2), intolerances. Crece con
// consumidores futuros. Sin placeholders de campos sin consumidor: no se
// valida nada que ningun consumidor use todavia.

import { DAYS_ORDER } from '../skeleton/days.js';

/** Vocabulario cerrado de intolerances (D-022) — sin anticipacion: solo
 * los dos campos que P2b-i consume (containsGluten/containsLactosa via
 * CompositionResolver). Crece con su proximo consumidor, no antes. */
export const INTOLERANCE_VALUES = Object.freeze(['gluten', 'lactosa']);

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

  if ('intolerances' in profile) {
    if (!Array.isArray(profile.intolerances)) {
      errors.push(`"intolerances" debe ser un array, recibido: ${JSON.stringify(profile.intolerances)}`);
    } else {
      for (const valor of profile.intolerances) {
        if (!INTOLERANCE_VALUES.includes(valor)) {
          errors.push(`"intolerances" contiene un valor fuera del vocabulario cerrado (${INTOLERANCE_VALUES.join(', ')}): "${valor}"`);
        }
      }
    }
  }

  if (errors.length) throw new ProfileValidationError(errors);
  return true;
}
