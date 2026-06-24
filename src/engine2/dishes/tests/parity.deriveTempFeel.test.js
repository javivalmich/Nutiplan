// Parity test: deriveTempFeel del motor viejo (src/engine/buildPlan.js,
// exportada en commit aislado — ver historial) vs deriveTempFeelEngine2,
// la copia propia de engine2 (src/engine2/dishes/derive.js). engine2
// nunca importa buildPlan.js en produccion; este test SI lo hace, porque
// su unico proposito es detectar drift entre ambas copias. Si este test
// se pone rojo, es un bug real de divergencia, no un fallo de wiring.
//
// Tambien incluye una asercion de consistencia sobre el campo `slot` del
// motor viejo: NUNCA decide momento (ver derive.js), pero si diverge de
// lo que la pertenencia a pool predice, es una senal de que el motor
// viejo cambio de forma incompatible con esta derivacion — un hallazgo
// para reportar, no algo que `momento` deba absorber.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveTempFeel } from '../../../engine/buildPlan.js';
import { deriveTempFeelEngine2 } from '../derive.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_PLAN_PATH = path.resolve(__dirname, '../../../engine/buildPlan.js');
const SRC = fs.readFileSync(BUILD_PLAN_PATH, 'utf8');

// Extrae el literal de array que sigue a `marker` mediante conteo de
// corchetes (no regex fragil): toma desde el primer '[' hasta su cierre
// balanceado, e ignora cualquier `.filter(...).map(...)` posterior (esos
// referencian closures de buildPlan() que no existen fuera de ella).
function extractArrayLiteral(marker) {
  const startIdx = SRC.indexOf(marker);
  if (startIdx === -1) throw new Error(`marcador no encontrado en buildPlan.js: ${marker}`);
  const bracketStart = SRC.indexOf('[', startIdx);
  let depth = 0;
  let i = bracketStart;
  for (; i < SRC.length; i++) {
    if (SRC[i] === '[') depth++;
    else if (SRC[i] === ']') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  return eval(SRC.slice(bracketStart, i));
}

const lunchCombos = extractArrayLiteral('const LUNCH_COMBOS = [');
const dinnerCombos = extractArrayLiteral('const DINNER_COMBOS = [');
const trainingCombos = extractArrayLiteral('const TRAINING_DINNERS = [');

describe('sanity del extractor (control positivo: si esto falla, el resto del archivo no mide nada)', () => {
  it('encuentra los tres pools con tamanos no triviales', () => {
    expect(lunchCombos.length).toBeGreaterThan(50);
    expect(dinnerCombos.length).toBeGreaterThan(50);
    expect(trainingCombos.length).toBe(3);
  });
});

describe('parity — deriveTempFeelEngine2 coincide 1:1 con el legacy', () => {
  it('para cada combo real de LUNCH_COMBOS, DINNER_COMBOS y TRAINING_DINNERS', () => {
    const allCombos = [...lunchCombos, ...dinnerCombos, ...trainingCombos];
    const drift = [];
    for (const combo of allCombos) {
      const legacy = deriveTempFeel(combo);
      const own = deriveTempFeelEngine2(combo);
      if (legacy !== own) drift.push({ combo, legacy, own });
    }
    expect(drift).toEqual([]);
  });
});

describe('consistencia de `slot` (solo asercion, nunca usado por momento)', () => {
  it('LUNCH_COMBOS no declara slot propio (queda en el default "Comida" via Object.assign)', () => {
    for (const c of lunchCombos) expect(c.slot).toBeUndefined();
  });

  it('DINNER_COMBOS no declara slot propio (queda en el default "Cena" via Object.assign)', () => {
    for (const c of dinnerCombos) expect(c.slot).toBeUndefined();
  });

  it('TRAINING_DINNERS declara slot="Cena" explicito en cada entry', () => {
    for (const c of trainingCombos) expect(c.slot).toBe('Cena');
  });
});
