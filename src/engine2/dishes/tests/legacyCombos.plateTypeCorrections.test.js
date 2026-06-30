// Control de discriminacion B.3 (checkpoint curaduria): corregir el
// cajon sopa_crema vía applyPlateTypeCorrections, cableado en
// generateScaffold ANTES de assembleDish/derivePlateType.

import { describe, it, expect } from 'vitest';
import {
  PLATETYPE_CORRECTIONS,
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

  it('sopa_crema baja de 15 a 1 (solo el caso ambiguo cookM null sobrevive)', () => {
    const sopaCrema = corregido.filter((c) => c.plateType === 'sopa_crema');
    expect(sopaCrema.length).toBe(1);
    expect(sopaCrema[0].P).toBe('huevo');
    expect(sopaCrema[0].cookM).toBeFalsy();
    expect(sopaCrema[0].reviewPlateType).toBe(true);
  });

  it('oracle exacto: cada una de las 14 entradas corregidas cae en el tipo esperado', () => {
    const porIdentidad = new Map(corregido.map((c) => [comboIdentityKey(c), c]));
    for (const entry of PLATETYPE_CORRECTIONS) {
      if (entry.cookM === null) continue; // caso ambiguo, verificado aparte
      const combo = porIdentidad.get(entry.identityKey);
      expect(combo).toBeDefined();
      expect(combo.plateType).toBe(entry.valorElegido);
    }
  });

  it('ningun combo fuera de sopa_crema cambia de plateType (alcance limitado)', () => {
    const identityKeysCorregidas = new Set(PLATETYPE_CORRECTIONS.map((e) => e.identityKey));
    for (let i = 0; i < RAW_POOL.length; i++) {
      const key = comboIdentityKey(RAW_POOL[i]);
      if (identityKeysCorregidas.has(key)) continue;
      expect(corregido[i].plateType).toBe(RAW_POOL[i].plateType);
    }
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
