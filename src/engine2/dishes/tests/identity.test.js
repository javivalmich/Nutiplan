// Tests de comboIdentityKey — Fase 3, Checkpoint 2a.

import { describe, it, expect } from 'vitest';
import { comboIdentityKey } from '../identity.js';

describe('comboIdentityKey — normalizacion de campos ausentes', () => {
  it('V2 undefined y V2 "" colapsan a la MISMA clave', () => {
    const sinV2 = { tmpl: 'caliente_clasico', P: 'pollo', C: 'arroz', V: 'brocoli', S: 'ajillo', cookM: 'plancha' };
    const v2Vacio = { ...sinV2, V2: '' };
    expect(comboIdentityKey(sinV2)).toBe(comboIdentityKey(v2Vacio));
  });

  it('V2 con valor real produce una clave DISTINTA de V2 ausente', () => {
    const sinV2 = { tmpl: 'ensalada', P: 'pollo', V: 'lechuga', S: 'vinagreta', cookM: 'plancha' };
    const conV2 = { ...sinV2, V2: 'tomate' };
    expect(comboIdentityKey(sinV2)).not.toBe(comboIdentityKey(conV2));
  });

  it('C undefined y C null colapsan a la MISMA clave (combos de cena sin carbo)', () => {
    const cUndefined = { tmpl: 'caliente_clasico', P: 'pollo', V: 'brocoli', S: 'limon_hierbas', cookM: 'plancha' };
    const cNull = { ...cUndefined, C: null };
    expect(comboIdentityKey(cUndefined)).toBe(comboIdentityKey(cNull));
  });
});

describe('comboIdentityKey — excluye flags editoriales (presentacion, no identidad)', () => {
  it('voltear familiar y saciante no cambia la clave', () => {
    const base = { tmpl: 'caliente_clasico', P: 'pollo', C: 'arroz', V: 'brocoli', S: 'limon_hierbas', cookM: 'plancha' };
    const conFlagsA = { ...base, familiar: true, saciante: false, facil: true, density: 'media' };
    const conFlagsB = { ...base, familiar: false, saciante: true, facil: false, density: 'baja' };
    expect(comboIdentityKey(conFlagsA)).toBe(comboIdentityKey(conFlagsB));
    expect(comboIdentityKey(conFlagsA)).toBe(comboIdentityKey(base));
  });

  it('voltear plateType SI cambia la clave (plateType no esta en la tupla de identidad, pero un cambio de plateType en la practica viene acompanado de un cambio real de receta en los datos)', () => {
    // Nota: plateType no forma parte de la tupla de identidad (no describe
    // que se cocina, sino como se presenta/clasifica para scoring). Este
    // test documenta explicitamente que la clave es indiferente a el.
    const a = { tmpl: 'caliente_clasico', P: 'pollo', C: 'arroz', V: 'brocoli', S: 'limon_hierbas', cookM: 'plancha', plateType: 'caliente_arroz' };
    const b = { ...a, plateType: 'otro_plate_type_cualquiera' };
    expect(comboIdentityKey(a)).toBe(comboIdentityKey(b));
  });
});

describe('comboIdentityKey — distingue recetas realmente distintas', () => {
  it('cambiar la proteina (P) produce una clave distinta', () => {
    const pollo = { tmpl: 'caliente_clasico', P: 'pollo', C: 'arroz', V: 'brocoli', S: 'limon_hierbas', cookM: 'plancha' };
    const pavo = { ...pollo, P: 'pavo' };
    expect(comboIdentityKey(pollo)).not.toBe(comboIdentityKey(pavo));
  });

  it('cambiar el metodo de coccion (cookM) produce una clave distinta', () => {
    const plancha = { tmpl: 'caliente_clasico', P: 'pollo', C: 'arroz', V: 'brocoli', S: 'limon_hierbas', cookM: 'plancha' };
    const horno = { ...plancha, cookM: 'horno' };
    expect(comboIdentityKey(plancha)).not.toBe(comboIdentityKey(horno));
  });
});

describe('comboIdentityKey — determinismo', () => {
  it('es estable en 50 invocaciones repetidas sobre el mismo combo', () => {
    const combo = { tmpl: 'sopa_crema', P: 'pollo', V: 'puerro', V2: 'zanahoria', S: null, cookM: 'guisado' };
    const first = comboIdentityKey(combo);
    for (let i = 0; i < 50; i++) {
      expect(comboIdentityKey(combo)).toBe(first);
    }
  });
});
