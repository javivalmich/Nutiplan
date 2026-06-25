// Fase 2, Paso 0, Commit 3: control positivo REAL de assembleDish contra
// un ancla sin ambiguedad de pool (terneraPatataZanahoria, caliente_clasico
// + guisado, presente UNICAMENTE en LUNCH_COMBOS_RAW — verificado antes de
// fijar el fixture, ver informe Fase 2 / Paso 0: los 6 ANCHORS tienen
// correspondencia 1:1 con un pool RAW; ninguno esta sin combo legacy
// asociado. Las dos cremas (tmpl:'sopa_crema') se evitan a proposito:
// cremaTomateHuevo -> LUNCH_COMBOS, cremaTomatePimientosAtun -> DINNER_COMBOS,
// confirmando la ambiguedad de pool que el enunciado pedia evitar).

import { describe, it, expect } from 'vitest';
import { assembleDish } from '../assemble.js';
import { validateDish, DishSchemaError } from '../schema.js';
import { comboIdentityKey } from '../identity.js';
import { ANCHORS } from '../anchors.js';
import {
  LUNCH_COMBOS_RAW,
  DINNER_COMBOS_RAW,
  TRAINING_DINNERS_RAW,
} from '../legacyCombos.data.js';

const POOLS = {
  LUNCH_COMBOS: LUNCH_COMBOS_RAW,
  DINNER_COMBOS: DINNER_COMBOS_RAW,
  TRAINING_DINNERS: TRAINING_DINNERS_RAW,
};

function computePoolMembership(identityKey) {
  const membership = [];
  for (const [poolName, combos] of Object.entries(POOLS)) {
    if (combos.some((c) => comboIdentityKey(c) === identityKey)) membership.push(poolName);
  }
  return membership;
}

// Ancla elegida: terneraPatataZanahoria (ultima entrada de ANCHORS, ver
// anchors.js:39-41 y :106-115). identityKey real:
const TERNERA_IDENTITY_KEY =
  '["caliente_clasico","ternera","patata","zanahoria",null,"ajillo","guisado"]';

const ANCHOR_TERNERA = ANCHORS.find((a) => a.identityKey === TERNERA_IDENTITY_KEY);
const COMBO_TERNERA = LUNCH_COMBOS_RAW.find(
  (c) => comboIdentityKey(c) === TERNERA_IDENTITY_KEY
);

describe('pre-condiciones del fixture (verificadas, no asumidas)', () => {
  it('ANCHOR_TERNERA existe en ANCHORS', () => {
    expect(ANCHOR_TERNERA).toBeDefined();
    expect(ANCHOR_TERNERA.rol).toBe('ancla');
  });

  it('el combo real existe en LUNCH_COMBOS_RAW y SOLO ahi (sin ambiguedad de pool)', () => {
    expect(COMBO_TERNERA).toBeDefined();
    const membership = computePoolMembership(TERNERA_IDENTITY_KEY);
    expect(membership).toEqual(['LUNCH_COMBOS']);
  });
});

describe('control positivo real: assembleDish(combo real, membership real, editorial real) -> Dish valido', () => {
  it('validateDish ACEPTA el Dish ensamblado', () => {
    const poolMembership = computePoolMembership(TERNERA_IDENTITY_KEY);
    const dish = assembleDish(COMBO_TERNERA, poolMembership, {
      nombre: 'Ternera guisada con patata y zanahoria',
      rol: ANCHOR_TERNERA.rol,
      batchable: ANCHOR_TERNERA.batchable,
      leftoverQuality: ANCHOR_TERNERA.leftoverQuality,
      shelfLifeDays: ANCHOR_TERNERA.shelfLifeDays,
      energiaCocina: ANCHOR_TERNERA.energiaCocina,
    });

    expect(dish.id).toBe(TERNERA_IDENTITY_KEY);
    expect(dish.momento).toEqual(['comida']);
    expect(dish.tempFeel).toBe('muy_caliente'); // cookM:"guisado" -> muy_caliente (derive.js:22)
    expect(dish.plateType).toBe('caliente_patata'); // campo directo del combo real

    expect(validateDish(dish)).toBe(true);
  });
});

describe('control negativo obligatorio: falta un campo editorial requerido', () => {
  function assembleSinEnergiaCocina() {
    const poolMembership = computePoolMembership(TERNERA_IDENTITY_KEY);
    const editorial = {
      nombre: 'Ternera guisada con patata y zanahoria',
      rol: ANCHOR_TERNERA.rol,
      batchable: ANCHOR_TERNERA.batchable,
      leftoverQuality: ANCHOR_TERNERA.leftoverQuality,
      shelfLifeDays: ANCHOR_TERNERA.shelfLifeDays,
      // energiaCocina omitido a proposito
    };
    return assembleDish(COMBO_TERNERA, poolMembership, editorial);
  }

  it('validateDish RECHAZA el Dish ensamblado sin energiaCocina', () => {
    const dish = assembleSinEnergiaCocina();
    expect(() => validateDish(dish)).toThrow(DishSchemaError);
  });
});

describe('control de discriminacion: el positivo SI puede ponerse rojo', () => {
  it('romper un derivado requerido (tempFeel) tumba la validacion, y revertir la repara', () => {
    const poolMembership = computePoolMembership(TERNERA_IDENTITY_KEY);
    const dishValido = assembleDish(COMBO_TERNERA, poolMembership, {
      nombre: 'Ternera guisada con patata y zanahoria',
      rol: ANCHOR_TERNERA.rol,
      batchable: ANCHOR_TERNERA.batchable,
      leftoverQuality: ANCHOR_TERNERA.leftoverQuality,
      shelfLifeDays: ANCHOR_TERNERA.shelfLifeDays,
      energiaCocina: ANCHOR_TERNERA.energiaCocina,
    });

    // Confirma verde antes de mutar.
    expect(validateDish(dishValido)).toBe(true);

    // Rompe temporalmente el campo tempFeel (derivado requerido).
    const dishRoto = { ...dishValido, tempFeel: 'tibio' };
    expect(() => validateDish(dishRoto)).toThrow(DishSchemaError);

    // Revierte: el original (sin mutar) sigue validando.
    expect(validateDish(dishValido)).toBe(true);
  });
});
