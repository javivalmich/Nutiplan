// Control de discriminacion B.3 (checkpoint curaduria): corregir el
// cajon sopa_crema vía applyPlateTypeCorrections, cableado en
// generateScaffold ANTES de assembleDish/derivePlateType.

import { describe, it, expect } from 'vitest';
import {
  PLATETYPE_CORRECTIONS,
  PESCADO_PLANCHA_CORRECTIONS,
  CRUDO_CORRECTIONS,
  REVIEW_CORRECTIONS,
  RESOLVED_CORRECTIONS,
  applyPlateTypeCorrections,
  applyPlateTypeCorrectionsToPool,
  comboIdentityKey,
} from '../legacyCombos.plateTypeCorrections.js';
import {
  LUNCH_COMBOS_RAW,
  DINNER_COMBOS_RAW,
  TRAINING_DINNERS_RAW,
} from '../legacyCombos.data.js';
import { generateScaffold } from '../../../../scripts/phaseB2/generateScaffold.js';

const RAW_POOL = [...LUNCH_COMBOS_RAW, ...DINNER_COMBOS_RAW, ...TRAINING_DINNERS_RAW];

function plateTypeDistribution(combos) {
  const dist = {};
  for (const c of combos) dist[c.plateType] = (dist[c.plateType] ?? 0) + 1;
  return dist;
}

describe('ROJO: sin correccion, el pool RAW tiene 15 entradas sopa_crema', () => {
  it('plateType:"sopa_crema" aparece 15 veces en el universo RAW', () => {
    const sopaCrema = RAW_POOL.filter((c) => c.plateType === 'sopa_crema');
    expect(sopaCrema.length).toBe(15);
  });
});

describe('VERDE: con applyPlateTypeCorrectionsToPool, el oracle de las 14 corregidas se cumple', () => {
  const corregido = applyPlateTypeCorrectionsToPool(RAW_POOL);

  it('sopa_crema baja de 15 a 1 (el caso cookM null, antes ambiguo, resuelto por Javi via RESOLVED_CORRECTIONS)', () => {
    const sopaCrema = corregido.filter((c) => c.plateType === 'sopa_crema');
    expect(sopaCrema.length).toBe(1);
    expect(sopaCrema[0].P).toBe('huevo');
    expect(sopaCrema[0].cookM).toBeFalsy();
    // Ya NO es un caso ambiguo: Javi confirmo sopa_crema explicitamente
    // (RESOLVED_CORRECTIONS), asi que reviewPlateType ya no se marca.
    expect(sopaCrema[0].reviewPlateType).toBeUndefined();
  });

  // DIVERGENCIA INTENCIONAL (PR2, checkpoint enum-24): las reglas
  // ESPECIFICAS pescado_plancha y crudo ganan sobre la GENERICA de PR1
  // para 6 identityKeys que tambien aparecen en PLATETYPE_CORRECTIONS:
  //   - merluza/brocoli, gambas/calabacin, gambas/calabaza:
  //     "plancha_verdura" -> "pescado_plancha"
  //   - atun/tomate-pepino, huevo/tomate, atun/tomate-pimientos:
  //     "ensalada" -> "crudo"
  // Ver precedencia documentada en legacyCombos.plateTypeCorrections.js.
  const GANADAS_POR_REGLA_ESPECIFICA = new Map([
    ...PESCADO_PLANCHA_CORRECTIONS.map((e) => [e.identityKey, 'pescado_plancha']),
    ...CRUDO_CORRECTIONS.map((e) => [e.identityKey, 'crudo']),
  ]);

  it('oracle exacto (PR1): las entradas no superadas por una regla especifica caen en el tipo esperado de PR1', () => {
    const porIdentidad = new Map(corregido.map((c) => [comboIdentityKey(c), c]));
    for (const entry of PLATETYPE_CORRECTIONS) {
      if (entry.cookM === null) continue; // caso ambiguo, verificado aparte
      if (GANADAS_POR_REGLA_ESPECIFICA.has(entry.identityKey)) continue; // divergencia documentada arriba
      const combo = porIdentidad.get(entry.identityKey);
      expect(combo).toBeDefined();
      expect(combo.plateType).toBe(entry.valorElegido);
    }
  });

  it('oracle exacto (PR2): las entradas superadas por una regla especifica caen en pescado_plancha/crudo, no en el tipo de PR1', () => {
    const porIdentidad = new Map(corregido.map((c) => [comboIdentityKey(c), c]));
    for (const [identityKey, valorEsperado] of GANADAS_POR_REGLA_ESPECIFICA) {
      const combo = porIdentidad.get(identityKey);
      expect(combo).toBeDefined();
      expect(combo.plateType).toBe(valorEsperado);
    }
  });

  it('ningun combo fuera del alcance documentado (PR1 + PR2 + resoluciones humanas) cambia de plateType', () => {
    const identityKeysCorregidas = new Set([
      ...PLATETYPE_CORRECTIONS.map((e) => e.identityKey),
      ...PESCADO_PLANCHA_CORRECTIONS.map((e) => e.identityKey),
      ...CRUDO_CORRECTIONS.map((e) => e.identityKey),
      ...REVIEW_CORRECTIONS.map((e) => e.identityKey),
      ...RESOLVED_CORRECTIONS.map((e) => e.identityKey),
    ]);
    for (let i = 0; i < RAW_POOL.length; i++) {
      const key = comboIdentityKey(RAW_POOL[i]);
      if (identityKeysCorregidas.has(key)) continue;
      expect(corregido[i].plateType).toBe(RAW_POOL[i].plateType);
    }
  });
});

describe('B.2 (checkpoint enum-24): control rojo->verde de pescado_plancha y crudo', () => {
  it('rojo: sin las reglas especificas, los combos quedan en plancha_verdura/pescado_horno/ensalada', () => {
    // Estado "sucio" = el combo RAW tal cual, sin pasar por applyPlateTypeCorrections.
    const sardinasRaw = RAW_POOL.find((c) => comboIdentityKey(c) === '["caliente_clasico","sardinas",null,"tomate",null,"ajillo","plancha"]');
    const atunCrudoRaw = RAW_POOL.find((c) => comboIdentityKey(c) === '["sopa_crema","atun",null,"tomate","pepino",null,"crudo"]');
    expect(sardinasRaw.plateType).toBe('pescado_horno'); // ROJO: mal etiquetado, sin corregir
    expect(atunCrudoRaw.plateType).toBe('sopa_crema'); // ROJO: sin corregir
  });

  it('verde: con applyPlateTypeCorrections, caen en pescado_plancha / crudo segun el oracle ratificado', () => {
    const sardinasRaw = RAW_POOL.find((c) => comboIdentityKey(c) === '["caliente_clasico","sardinas",null,"tomate",null,"ajillo","plancha"]');
    const atunCrudoRaw = RAW_POOL.find((c) => comboIdentityKey(c) === '["sopa_crema","atun",null,"tomate","pepino",null,"crudo"]');
    expect(applyPlateTypeCorrections(sardinasRaw).plateType).toBe('pescado_plancha'); // VERDE
    expect(applyPlateTypeCorrections(atunCrudoRaw).plateType).toBe('crudo'); // VERDE
  });

  it('caso 121 (atun/caliente_clasico/crudo/base arroz): ratificado por Javi como "bowl" (RESOLVED_CORRECTIONS), sin reviewPlateType', () => {
    const key121 = '["caliente_clasico","atun","arroz","tomate",null,"limon_hierbas","crudo"]';
    const combo121 = RAW_POOL.find((c) => comboIdentityKey(c) === key121);
    expect(combo121).toBeDefined();
    expect(combo121.plateType).toBe('caliente_arroz'); // origen RAW, sin corregir

    const corregido121 = applyPlateTypeCorrections(combo121);
    // Ya NO es un caso contradictorio sin regla: Javi ratifico "bowl".
    expect(corregido121.plateType).toBe('bowl');
    expect(corregido121.reviewPlateType).toBeUndefined();
  });
});

describe('PRUEBA DE DISCRIMINACION directa sobre applyPlateTypeCorrections', () => {
  it('rojo: un combo sopa_crema/plancha/pollo sin corregir queda sopa_crema', () => {
    const sucio = { tmpl: 'sopa_crema', P: 'pollo', C: null, V: 'brocoli', S: 'x', cookM: 'plancha', plateType: 'sopa_crema' };
    expect(sucio.plateType).toBe('sopa_crema'); // ROJO: estado sin corregir
  });

  it('verde: applyPlateTypeCorrections lo convierte a plancha_verdura', () => {
    const sucio = { tmpl: 'sopa_crema', P: 'pollo', C: null, V: 'brocoli', S: 'x', cookM: 'plancha', plateType: 'sopa_crema' };
    const limpio = applyPlateTypeCorrections(sucio);
    expect(limpio.plateType).toBe('plancha_verdura'); // VERDE: corregido
    expect(sucio.plateType).toBe('sopa_crema'); // no muta el original
  });
});

describe('Distribucion de plateType en el scaffold real: ANTES vs DESPUES', () => {
  it('reporta la distribucion antes (RAW) y despues (scaffold con correccion cableada)', () => {
    const antes = plateTypeDistribution(RAW_POOL);
    const { dishes } = generateScaffold();
    const despues = plateTypeDistribution(dishes);

    expect(antes.sopa_crema).toBe(15);
    expect(despues.sopa_crema).toBe(1);
    // eslint-disable-next-line no-console
    console.log('[plateType distribucion] ANTES (RAW):', antes);
    // eslint-disable-next-line no-console
    console.log('[plateType distribucion] DESPUES (scaffold):', despues);
  });
});
