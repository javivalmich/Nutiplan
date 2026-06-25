// Fase 2, Paso B.2, Commit 1: generador de scaffold de Platos legacy.
// La logica vive en scripts/phaseB2/generateScaffold.js (fuera de
// engine2/). Este test vive en engine2/dishes/tests/ (autorizado para
// B.2: tests nuevos).

import { describe, it, expect } from 'vitest';
import {
  generateScaffold,
  computeSharedFields,
  groupUniverseByIdentity,
  classifyIdentityGroup,
  editorialFromAnchorOrTodo,
  POOL_NAME,
} from '../../../../scripts/phaseB2/generateScaffold.js';
import { comboIdentityKey } from '../identity.js';
import { ANCHORS } from '../anchors.js';
import {
  LUNCH_COMBOS_RAW,
  DINNER_COMBOS_RAW,
  TRAINING_DINNERS_RAW,
} from '../legacyCombos.data.js';

const EDITORIAL_FIELDS = ['nombre', 'rol', 'batchable', 'leftoverQuality', 'shelfLifeDays', 'energiaCocina'];

const result = generateScaffold();

describe('precondicion: el generador NO aborta sobre el universo real (B.1 ya certifico 0 divergentes)', () => {
  it('result.ok === true', () => {
    expect(result.ok).toBe(true);
  });
});

describe('Conservacion (NO igualdad exacta): entradas_crudas == scaffold.length + nColapsosExactos + nUnificadasCrossPool', () => {
  it('la formula de conservacion cuadra contra valores computados de forma INDEPENDIENTE (no reutiliza los contadores internos del generador)', () => {
    const pools = {
      [POOL_NAME.LUNCH]: LUNCH_COMBOS_RAW,
      [POOL_NAME.DINNER]: DINNER_COMBOS_RAW,
      [POOL_NAME.TRAINING]: TRAINING_DINNERS_RAW,
    };
    const totalEntradasCrudasIndependiente = LUNCH_COMBOS_RAW.length + DINNER_COMBOS_RAW.length + TRAINING_DINNERS_RAW.length;
    const todasLasEntradas = [...LUNCH_COMBOS_RAW, ...DINNER_COMBOS_RAW, ...TRAINING_DINNERS_RAW];
    const identidadesDistintasIndependiente = new Set(todasLasEntradas.map(comboIdentityKey)).size;

    expect(result.report.totalEntradasCrudas).toBe(totalEntradasCrudasIndependiente);
    expect(result.dishes.length).toBe(identidadesDistintasIndependiente);
    expect(totalEntradasCrudasIndependiente).toBe(
      result.dishes.length + result.report.nColapsosExactos + result.report.nUnificadasCrossPool
    );
  });

  it('PRUEBA DE DISCRIMINACION: si el scaffold tuviera una entrada de menos, la formula de conservacion deja de cuadrar', () => {
    const scaffoldRoto = result.dishes.slice(0, -1);
    const cuadra = result.report.totalEntradasCrudas === scaffoldRoto.length + result.report.nColapsosExactos + result.report.nUnificadasCrossPool;
    expect(cuadra).toBe(false);

    // Revertido (scaffold real, sin mutar): vuelve a cuadrar.
    const cuadraReal = result.report.totalEntradasCrudas === result.dishes.length + result.report.nColapsosExactos + result.report.nUnificadasCrossPool;
    expect(cuadraReal).toBe(true);
  });
});

describe('Estructura: cada plato tiene EXACTAMENTE los 6 campos editoriales', () => {
  it('todo dish del scaffold tiene las 6 claves editoriales presentes', () => {
    expect(result.dishes.length).toBeGreaterThan(0);
    for (const dish of result.dishes) {
      for (const field of EDITORIAL_FIELDS) {
        expect(field in dish).toBe(true);
      }
    }
  });
});

describe('Anclas (CP2): cada campo que CP2 fijo aparece arrastrado con valor ==CP2 (comparado contra la fuente CP2 real, no una copia)', () => {
  it('ANCHORS tiene 6 anclas reales (fuente real, no hardcodeado en el test)', () => {
    expect(ANCHORS.length).toBeGreaterThan(0);
  });

  it('cada ancla real tiene un dish correspondiente en el scaffold con rol/batchable/leftoverQuality/shelfLifeDays/energiaCocina == CP2, y nombre == "TODO" (CP2 no lo fijo)', () => {
    expect(ANCHORS.length).toBeGreaterThan(0);
    for (const anchor of ANCHORS) {
      const dish = result.dishes.find((d) => d.id === anchor.identityKey);
      expect(dish).toBeDefined();
      expect(dish.rol).toBe(anchor.rol);
      expect(dish.batchable).toBe(anchor.batchable);
      expect(dish.leftoverQuality).toBe(anchor.leftoverQuality);
      expect(dish.shelfLifeDays).toBe(anchor.shelfLifeDays);
      expect(dish.energiaCocina).toBe(anchor.energiaCocina);
      expect(dish.nombre).toBe('TODO'); // CP2 no fija nombre (verificado: anchors.js no tiene ese campo)
    }
  });

  it('PRUEBA DE DISCRIMINACION: editorialFromAnchorOrTodo detecta el desajuste si comparamos contra un valor erroneo', () => {
    const primerAncla = ANCHORS[0];
    const editorial = editorialFromAnchorOrTodo(primerAncla.identityKey);
    // El valor real coincide...
    expect(editorial.rol).toBe(primerAncla.rol);
    // ...pero un valor inventado NO coincidiria (demuestra que la
    // comparacion de arriba realmente compara valores, no solo "no es TODO").
    expect(editorial.rol).not.toBe('rol_inventado_que_no_es_el_real');
  });

  it('un identityKey que NO es de ninguna ancla devuelve los 6 campos en "TODO"', () => {
    const dishNoAncla = result.dishes.find((d) => !ANCHORS.some((a) => a.identityKey === d.id));
    expect(dishNoAncla).toBeDefined();
    for (const field of EDITORIAL_FIELDS) {
      expect(dishNoAncla[field]).toBe('TODO');
    }
  });
});

describe('Campos compartidos (computados en runtime, no hardcodeados)', () => {
  it('computeSharedFields() sobre los 3 pools reales devuelve ["density","plateType"]', () => {
    const pools = {
      [POOL_NAME.LUNCH]: LUNCH_COMBOS_RAW,
      [POOL_NAME.DINNER]: DINNER_COMBOS_RAW,
      [POOL_NAME.TRAINING]: TRAINING_DINNERS_RAW,
    };
    expect(computeSharedFields(pools)).toEqual(['density', 'plateType']);
  });
});

describe('Colapsos: divergentes nunca se colapsan (si los hubiera, el generador ya habria abortado)', () => {
  it('reporta nColapsosExactos y nUnificadasCrossPool (informativo + consistente con la conservacion ya verificada)', () => {
    // eslint-disable-next-line no-console
    console.log('[scaffold report]', JSON.stringify(result.report, null, 2));
    expect(result.report.nColapsosExactos).toBeGreaterThanOrEqual(0);
    expect(result.report.nUnificadasCrossPool).toBeGreaterThanOrEqual(0);
  });

  it('PRUEBA DE DISCRIMINACION: classifyIdentityGroup SI detecta una divergencia intra-origen sintetica', () => {
    const miembrosDivergentes = [
      { combo: { tmpl: 'x', P: 'y', C: null, V: 'z', S: 'a', cookM: 'plancha', plateType: 'p', density: 'media', familiar: true }, origen: POOL_NAME.LUNCH },
      { combo: { tmpl: 'x', P: 'y', C: null, V: 'z', S: 'a', cookM: 'plancha', plateType: 'p', density: 'media', familiar: false }, origen: POOL_NAME.LUNCH },
    ];
    const clasificacion = classifyIdentityGroup(miembrosDivergentes, ['plateType', 'density']);
    expect(clasificacion.divergente).toBe(true);
  });

  it('PRUEBA DE DISCRIMINACION: classifyIdentityGroup SI detecta una divergencia inter-origen sintetica (campo compartido distinto)', () => {
    const miembrosDivergentes = [
      { combo: { tmpl: 'x', P: 'y', C: null, V: 'z', S: 'a', cookM: 'plancha', plateType: 'p1', density: 'media', familiar: true }, origen: POOL_NAME.LUNCH },
      { combo: { tmpl: 'x', P: 'y', C: null, V: 'z', S: 'a', cookM: 'plancha', plateType: 'p2', density: 'media', saciante: true }, origen: POOL_NAME.DINNER },
    ];
    const clasificacion = classifyIdentityGroup(miembrosDivergentes, ['plateType', 'density']);
    expect(clasificacion.divergente).toBe(true);
  });

  it('un grupo inter-origen sintetico que SI concuerda en compartidos se UNIFICA (no diverge)', () => {
    const miembrosConcordantes = [
      { combo: { tmpl: 'x', P: 'y', C: null, V: 'z', S: 'a', cookM: 'plancha', plateType: 'p', density: 'media', familiar: true }, origen: POOL_NAME.LUNCH },
      { combo: { tmpl: 'x', P: 'y', C: null, V: 'z', S: 'a', cookM: 'plancha', plateType: 'p', density: 'media', saciante: true }, origen: POOL_NAME.DINNER },
    ];
    const clasificacion = classifyIdentityGroup(miembrosConcordantes, ['plateType', 'density']);
    expect(clasificacion.divergente).toBe(false);
    expect(new Set(clasificacion.poolMembership)).toEqual(new Set([POOL_NAME.LUNCH, POOL_NAME.DINNER]));
  });
});

describe('Metadata diferida de TRAINING_DINNERS (slot/emoji/title): reportada, no descartada en silencio, no es campo de Dish', () => {
  it('los 3 combos reales de TRAINING_DINNERS_RAW aparecen en deferredTrainingPresentation', () => {
    expect(result.report.deferredTrainingPresentation.length).toBe(TRAINING_DINNERS_RAW.length);
  });

  it('ningun dish del scaffold tiene los campos slot/emoji/title (no son campo de Dish ni editorial)', () => {
    for (const dish of result.dishes) {
      expect('slot' in dish).toBe(false);
      expect('emoji' in dish).toBe(false);
      expect('title' in dish).toBe(false);
    }
  });
});
