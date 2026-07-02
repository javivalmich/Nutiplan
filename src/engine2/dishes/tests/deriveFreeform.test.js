// Fase 2, Paso C — derivaciones especificas freeform (tempFeel, momento).
// Ver src/engine2/dishes/deriveFreeform.js y CLAUDE.md Decision F.

import { describe, it, expect } from 'vitest';
import {
  deriveMomentoFreeform,
  deriveTempFeelFreeform,
  FREEFORM_TEMPFEEL_OVERRIDES,
} from '../deriveFreeform.js';

describe('deriveMomentoFreeform', () => {
  it('slot ["C"] -> ["comida"]', () => {
    expect(deriveMomentoFreeform(['C'])).toEqual(['comida']);
  });

  it('slot ["Ce"] -> ["cena"]', () => {
    expect(deriveMomentoFreeform(['Ce'])).toEqual(['cena']);
  });

  it('slot ["C","Ce"] -> ["comida","cena"] (orden canonico MOMENTOS)', () => {
    expect(deriveMomentoFreeform(['C', 'Ce'])).toEqual(['comida', 'cena']);
  });

  it('slot vacio lanza', () => {
    expect(() => deriveMomentoFreeform([])).toThrow(/invalido o vacio/);
  });

  it('PRUEBA DE DISCRIMINACION: slot "Al" (sin equivalente legacy) lanza, no se resuelve en silencio', () => {
    expect(() => deriveMomentoFreeform(['Al'])).toThrow(/sin equivalente/);
  });
});

describe('deriveTempFeelFreeform — F.1 derivacion general', () => {
  it.each([
    ['crudo', 'frio'],
    ['ensalada', 'frio'],
    ['guiso', 'muy_caliente'],
    ['legumbre', 'muy_caliente'],
    ['airfryer', 'caliente'],
    ['arroz_plato', 'caliente'],
    ['bocado_mano', 'caliente'],
    ['en_salsa', 'caliente'],
    ['gratinado', 'caliente'],
    ['masa', 'caliente'],
    ['pasta', 'caliente'],
    ['caliente_patata', 'caliente'],
    ['pescado_plancha', 'caliente'],
    ['plancha_verdura', 'caliente'],
    ['salteado_wok', 'caliente'],
  ])('plateType "%s" -> tempFeel "%s"', (plateType, esperado) => {
    expect(deriveTempFeelFreeform(plateType, 'id_sin_override')).toBe(esperado);
  });

  it('plateType sin regla F.1 ni override lanza', () => {
    expect(() => deriveTempFeelFreeform('plateType_inventado', 'id_sin_override')).toThrow(/no tiene regla F.1/);
  });
});

describe('deriveTempFeelFreeform — F.2 categorias obligatorias (sopa_crema, bowl, tortilla)', () => {
  it('con override presente, devuelve el tempFeel de la tabla', () => {
    expect(deriveTempFeelFreeform('sopa_crema', 'gazpacho_huevo_atun')).toBe('frio');
    expect(deriveTempFeelFreeform('bowl', 'bibimbap_ternera_huevo')).toBe('caliente');
    expect(deriveTempFeelFreeform('tortilla', 'shakshuka')).toBe('muy_caliente');
  });

  it('PRUEBA DE DISCRIMINACION (r2): sin override para una categoria obligatoria, LANZA — no hay valor por defecto', () => {
    expect(() => deriveTempFeelFreeform('sopa_crema', 'id_freeform_sin_ratificar')).toThrow(/exige entrada/);
    expect(() => deriveTempFeelFreeform('bowl', 'id_freeform_sin_ratificar')).toThrow(/exige entrada/);
    expect(() => deriveTempFeelFreeform('tortilla', 'id_freeform_sin_ratificar')).toThrow(/exige entrada/);
  });
});

describe('deriveTempFeelFreeform — F.3 excepcion (consulta la tabla ANTES que la derivacion general, para cualquier plateType)', () => {
  it('ensalada_lentejas_feta (plateType "ensalada", fuera de las 3 categorias F.2) usa el override, NO la derivacion general', () => {
    // La derivacion general para "ensalada" da "frio" (F.1) -- el override
    // da "caliente" (es una ensalada TIBIA). Si la funcion consultase F.1
    // primero, este test fallaria.
    expect(deriveTempFeelFreeform('ensalada', 'ensalada_lentejas_feta')).toBe('caliente');
  });
});

describe('FREEFORM_TEMPFEEL_OVERRIDES — cobertura completa', () => {
  it('tiene exactamente 18 entradas (17 obligatorias por categoria + 1 excepcion F.3)', () => {
    expect(Object.keys(FREEFORM_TEMPFEEL_OVERRIDES).length).toBe(18);
  });

  it('exactamente 6 entradas quedan pendienteCocinero:true', () => {
    const pendientes = Object.entries(FREEFORM_TEMPFEEL_OVERRIDES).filter(([, v]) => v.pendienteCocinero);
    expect(pendientes.length).toBe(6);
    expect(pendientes.map(([id]) => id).sort()).toEqual(
      [
        'crema_calabacin_queso_huevo',
        'sopa_miso_tofu',
        'hummus_pita_pollo',
        'buddha_bowl_completo',
        'tortilla_patatas_completa',
        'ensalada_lentejas_feta',
      ].sort()
    );
  });
});
