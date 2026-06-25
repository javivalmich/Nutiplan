// Fase 2, Paso B.1 — carga del universo completo de entrada para el gate
// y el conteo de frecuencia. Vive en scripts/ (fuera de engine2/), importa
// de src/engine2/dishes/ y de src/data/FREEFORM_COMBOS.js. Sin logica de
// negocio propia: solo ensambla referencias a los modulos de datos reales.

import { comboIdentityKey } from '../../src/engine2/dishes/identity.js';
import {
  LUNCH_COMBOS_RAW,
  DINNER_COMBOS_RAW,
  TRAINING_DINNERS_RAW,
} from '../../src/engine2/dishes/legacyCombos.data.js';
import { FREEFORM_COMBOS } from '../../src/data/FREEFORM_COMBOS.js';

export function loadUniverse() {
  return {
    LUNCH_COMBOS_RAW,
    DINNER_COMBOS_RAW,
    TRAINING_DINNERS_RAW,
    FREEFORM_COMBOS,
    comboIdentityKey,
  };
}
