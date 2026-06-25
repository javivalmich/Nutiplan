// Fase 2, Paso B.1, Parte 1: gate de colision sobre el universo completo
// de entrada (LUNCH_RAW ∪ DINNER_RAW ∪ TRAINING_RAW ∪ FREEFORM). La logica
// vive en scripts/phaseB1/collisionGate.js (fuera de engine2/); este test
// vive en engine2/dishes/tests/ segun lo autorizado para este paso.

import { describe, it, expect } from 'vitest';
import {
  runCollisionGate,
  diffGroup,
  classifyGroup,
  groupByIdentityKey,
  auditKeyShapeVariants,
} from '../../../../scripts/phaseB1/collisionGate.js';
import { loadUniverse } from '../../../../scripts/phaseB1/loadUniverse.js';

const universe = loadUniverse();
const { LUNCH_COMBOS_RAW, DINNER_COMBOS_RAW, TRAINING_DINNERS_RAW, FREEFORM_COMBOS, comboIdentityKey } = universe;

describe('auditoria previa de forma (claves reales observadas por origen)', () => {
  it('documenta las variantes de clave top-level de cada origen (informativo, no bloqueante: ver decision editorial Paso B.1)', () => {
    const lunchVariants = auditKeyShapeVariants(LUNCH_COMBOS_RAW);
    const dinnerVariants = auditKeyShapeVariants(DINNER_COMBOS_RAW);
    const trainingVariants = auditKeyShapeVariants(TRAINING_DINNERS_RAW);

    // Hallazgo confirmado (Paso B.1): heterogeneidad cosmetica por
    // S/V2 omitidas (no null explicito) — no afecta a ninguna colision
    // real bajo la semantica de union-de-claves + equivalencia
    // ausente===undefined===""===null acordada con Javi.
    expect(lunchVariants.length).toBe(4);
    expect(dinnerVariants.length).toBe(3);
    expect(trainingVariants.length).toBe(1);

    // eslint-disable-next-line no-console
    console.log('[auditoria de forma] LUNCH_RAW variantes:', JSON.stringify(lunchVariants));
    // eslint-disable-next-line no-console
    console.log('[auditoria de forma] DINNER_RAW variantes:', JSON.stringify(dinnerVariants));
    // eslint-disable-next-line no-console
    console.log('[auditoria de forma] TRAINING_RAW variantes:', JSON.stringify(trainingVariants));
  });
});

describe('verificacion explicita de los hallazgos de Paso 0 (Commit 2)', () => {
  const dinnerGroups = groupByIdentityKey(DINNER_COMBOS_RAW, comboIdentityKey);

  it('Caso A: DINNER · ternera·espinacas·ajillo·plancha → COLAPSABLE', () => {
    const key = comboIdentityKey({
      tmpl: 'caliente_clasico', P: 'ternera', C: null, V: 'espinacas', S: 'ajillo', cookM: 'plancha',
    });
    const members = dinnerGroups.get(key);
    expect(members).toBeDefined();
    expect(members.length).toBe(2);
    expect(classifyGroup(members)).toBe('COLAPSABLE');
  });

  it('Caso B (HISTORICO): DINNER · cerdo·brocoli·mostaza_miel·plancha era DIVERGENTE (density), ahora colapsado por NORMALIZACION #1', () => {
    // Este caso ya NO es una colision en legacyCombos.data.js: la
    // divergencia (density "media" vs "baja") se colapso a un unico
    // registro con density:"baja" (ver legacyCombos.normalizations.js,
    // normalizacion #1). El grupo ahora tiene 1 solo miembro.
    const key = comboIdentityKey({
      tmpl: 'caliente_clasico', P: 'cerdo', C: null, V: 'brocoli', S: 'mostaza_miel', cookM: 'plancha',
    });
    const members = dinnerGroups.get(key);
    expect(members).toBeDefined();
    expect(members.length).toBe(1);
    expect(members[0].density).toBe('baja');
  });
});

describe('regresion: ningun grupo legacy queda divergente tras la normalizacion documentada', () => {
  it('LUNCH_RAW, DINNER_RAW y TRAINING_RAW no tienen NINGUN grupo divergente (la unica conocida, cerdo·brocoli, fue colapsada)', () => {
    const result = runCollisionGate(universe);
    const divergenciasLegacy = result.divergences.filter((d) => d.origen !== 'FREEFORM');
    // Si aparece CUALQUIER grupo divergente legacy, es un hallazgo nuevo
    // no documentado en legacyCombos.normalizations.js: el test debe
    // fallar para que se reporte, no para que se ignore.
    expect(divergenciasLegacy).toEqual([]);
  });
});

describe('regla especial FREEFORM: duplicado de identity.id es SIEMPRE divergente', () => {
  it('FREEFORM_COMBOS real no tiene duplicados de identity.id (gate no aborta por esta causa)', () => {
    const ids = FREEFORM_COMBOS.map((c) => c.identity.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('un duplicado SINTETICO de identity.id es clasificado DIVERGENTE por el gate, sin comparacion estructural', () => {
    const sinteticoConDuplicado = [
      { freeForm: true, identity: { id: 'plato_x', title: 'Plato X v1' } },
      { freeForm: true, identity: { id: 'plato_x', title: 'Plato X v2 (texto distinto, mismo id)' } },
    ];
    const result = runCollisionGate({
      LUNCH_COMBOS_RAW: [],
      DINNER_COMBOS_RAW: [],
      TRAINING_DINNERS_RAW: [],
      FREEFORM_COMBOS: sinteticoConDuplicado,
      comboIdentityKey,
    });
    expect(result.aborted).toBe(true);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0].origen).toBe('FREEFORM');
    expect(result.divergences[0].identityKey).toBe('plato_x');
  });
});

describe('control discriminante del gate (fixture sintetico)', () => {
  function baseUniverseConUnaColision() {
    return {
      LUNCH_COMBOS_RAW: [
        { tmpl: 'sintetico', P: 'x', C: null, V: 'y', S: 'z', cookM: 'plancha', plateType: 'a', density: 'media' },
        { tmpl: 'sintetico', P: 'x', C: null, V: 'y', S: 'z', cookM: 'plancha', plateType: 'a', density: 'media' },
      ],
      DINNER_COMBOS_RAW: [],
      TRAINING_DINNERS_RAW: [],
      FREEFORM_COMBOS: [],
      comboIdentityKey,
    };
  }

  it('con divergencia sintetica: el gate ABORTA y la incluye en el inventario', () => {
    const universoConDivergencia = baseUniverseConUnaColision();
    universoConDivergencia.LUNCH_COMBOS_RAW[1].density = 'baja'; // divergencia deliberada

    const result = runCollisionGate(universoConDivergencia);
    expect(result.aborted).toBe(true);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0].origen).toBe('LUNCH_RAW');
    expect(Object.keys(result.divergences[0].diff)).toContain('density');
  });

  it('sin la divergencia (revertida): el gate PASA', () => {
    const universoSinDivergencia = baseUniverseConUnaColision(); // density igual en ambos miembros
    const result = runCollisionGate(universoSinDivergencia);
    expect(result.aborted).toBe(false);
    expect(result.divergences).toHaveLength(0);
    expect(result.perOrigin.LUNCH_RAW.nGruposColapsables).toBe(1);
  });
});

describe('reporte agregado obligatorio', () => {
  it('reporta nEntradas / nClavesUnicas / nGruposColapsables / nGruposDivergentes por origen', () => {
    const result = runCollisionGate(universe);
    for (const origen of ['LUNCH_RAW', 'DINNER_RAW', 'TRAINING_RAW', 'FREEFORM']) {
      expect(result.perOrigin[origen]).toBeDefined();
      expect(typeof result.perOrigin[origen].nEntradas).toBe('number');
      expect(typeof result.perOrigin[origen].nClavesUnicas).toBe('number');
      expect(typeof result.perOrigin[origen].nGruposColapsables).toBe('number');
      expect(typeof result.perOrigin[origen].nGruposDivergentes).toBe('number');
    }
    // eslint-disable-next-line no-console
    console.log('[reporte agregado gate]', JSON.stringify(result.perOrigin, null, 2));
  });

  it('el gate real (universo completo actual) PASA tras la normalizacion documentada — la unica divergencia conocida (cerdo·brocoli) fue colapsada con causa registrada', () => {
    // Hasta la normalizacion #1 (legacyCombos.normalizations.js), el gate
    // abortaba aqui (ver informe Fase 2 / Paso B.1). Tras colapsar la
    // colision divergente eligiendo el valor coherente con el resto del
    // dataset, el gate pasa: solo quedan grupos colapsables (idénticos).
    const result = runCollisionGate(universe);
    expect(result.aborted).toBe(false);
    expect(result.divergences).toEqual([]);
    expect(result.perOrigin.DINNER_RAW.nGruposDivergentes).toBe(0);
    expect(result.perOrigin.DINNER_RAW.nGruposColapsables).toBe(1); // ternera·espinacas, duplicado identico
  });
});
