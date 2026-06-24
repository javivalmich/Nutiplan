// Invariante de dedup — Fase 3, Checkpoint 2b: para toda identidad de
// combo con mas de una instancia, todas las instancias deben coincidir
// en plateType y density. Un conflicto es un problema de datos, no algo
// que el codigo deba resolver eligiendo una de las dos en silencio
// (groupCombosByIdentity lanza, ver identity.js).
//
// Extrae los combos reales de las 9 fixtures del baseline aprobado
// (src/engine/tests/__snapshots__/buildPlan.baseline.test.js.snap) de
// forma autocontenida — mismo patron que parity.deriveTempFeel.test.js
// para buildPlan.js: el snapshot serializa JS valido (con comas finales,
// que eval() acepta), asi que no hace falta un parser dedicado.
//
// HALLAZGO (no un bug de este test): los datos reales NO estan limpios.
// DINNER_COMBOS tiene dos entradas literales separadas para la misma
// receta (cerdo+brocoli+mostaza_miel+plancha, buildPlan.js:857 y :877)
// con density distinta ("media" vs "baja"), mismo plateType. Es un
// problema de calidad de datos del motor viejo (congelado, fuera de la
// lista de bugs verificados en Fase 1) — engine2 no lo arregla aqui,
// solo lo documenta como hallazgo detectado por el invariante. Por eso
// la demo de discriminacion (rojo/verde) usa un fixture SINTETICO
// limpio por construccion, separado de este hallazgo: de esta forma, si
// el hallazgo se resuelve algun dia en buildPlan.js, la demo de
// discriminacion no depende de ese estado.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { groupCombosByIdentity, comboIdentityKey } from '../identity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAP_PATH = path.resolve(__dirname, '../../../engine/tests/__snapshots__/buildPlan.baseline.test.js.snap');
const SNAP_SRC = fs.readFileSync(SNAP_PATH, 'utf8');

function extractFixtures() {
  const re = /exports\[`(.*?)`\] = `\n([\s\S]*?)\n`;/g;
  const fixtures = [];
  let m;
  while ((m = re.exec(SNAP_SRC)) !== null) {
    fixtures.push({ name: m[1], days: eval(m[2]) });
  }
  return fixtures;
}

function extractRealCombos(fixtures) {
  const combos = [];
  for (const fixture of fixtures) {
    for (const day of fixture.days) {
      for (const meal of day.meals || []) {
        if (meal._spec && meal._spec.tmpl) combos.push(meal._spec);
      }
    }
  }
  return combos;
}

const fixtures = extractFixtures();
const realCombos = extractRealCombos(fixtures);

describe('sanity del extractor (control positivo: si esto falla, el resto del archivo no mide nada)', () => {
  it('encuentra las 9 fixtures del baseline y un numero no trivial de combos reales', () => {
    expect(fixtures.length).toBe(9);
    expect(realCombos.length).toBeGreaterThan(100);
  });
});

describe('invariante de dedup sobre los snapshots reales — hallazgo documentado', () => {
  it('groupCombosByIdentity SI lanza sobre los datos reales: duplicado de density en DINNER_COMBOS (buildPlan.js:857/:877)', () => {
    let error = null;
    try {
      groupCombosByIdentity(realCombos);
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeNull();
    expect(error.message).toMatch(/Identidad inconsistente/);
    expect(error.message).toMatch(/"cerdo"/);
    expect(error.message).toMatch(/density=\[baja,media\]|density=\[media,baja\]/);
  });

  it('quitando esa unica identidad conflictiva, el resto de los datos reales SI son consistentes', () => {
    const conflictKey = comboIdentityKey({
      tmpl: 'caliente_clasico', P: 'cerdo', C: null, V: 'brocoli', V2: null, S: 'mostaza_miel', cookM: 'plancha',
    });
    const combosLimpios = realCombos.filter((c) => comboIdentityKey(c) !== conflictKey);
    expect(combosLimpios.length).toBeLessThan(realCombos.length);
    expect(() => groupCombosByIdentity(combosLimpios)).not.toThrow();

    const groups = groupCombosByIdentity(combosLimpios);
    const conMultiples = [...groups.values()].filter((instances) => instances.length > 1);
    expect(conMultiples.length).toBeGreaterThan(0); // la invariante se sigue ejercitando de verdad
  });
});

describe('discriminacion (fixture sintetico, limpio por construccion — independiente del hallazgo de arriba)', () => {
  const comboBase = {
    tmpl: 'caliente_clasico', P: 'pollo', C: 'arroz', V: 'brocoli', V2: null,
    S: 'limon_hierbas', cookM: 'plancha', plateType: 'caliente_arroz', density: 'media',
  };
  const comboOtraReceta = {
    tmpl: 'ensalada', P: 'atun', C: null, V: 'lechuga', V2: 'tomate',
    S: 'vinagreta', cookM: 'crudo', plateType: 'ensalada', density: 'baja',
  };
  const datosLimpios = [comboBase, { ...comboBase }, comboOtraReceta]; // comboBase repetido = identidad con 2 instancias, consistentes

  it('confirma que el fixture esta limpio antes de empezar', () => {
    expect(() => groupCombosByIdentity(datosLimpios)).not.toThrow();
  });

  it('ROJO: inyectar un combo con plateType distinto bajo la identidad de comboBase hace lanzar', () => {
    const comboConflictivo = { ...comboBase, plateType: 'plateType_distinto' };
    expect(comboIdentityKey(comboConflictivo)).toBe(comboIdentityKey(comboBase)); // misma identidad

    const datosSucios = [...datosLimpios, comboConflictivo];
    expect(() => groupCombosByIdentity(datosSucios)).toThrow(/Identidad inconsistente/);
  });

  it('VERDE: quitando el combo conflictivo, vuelve a no lanzar', () => {
    expect(() => groupCombosByIdentity(datosLimpios)).not.toThrow();
  });

  it('ROJO: inyectar un combo con density distinta (mismo plateType) bajo la misma identidad tambien hace lanzar', () => {
    const comboConflictivo = { ...comboBase, density: 'alta' };
    const datosSucios = [...datosLimpios, comboConflictivo];
    expect(() => groupCombosByIdentity(datosSucios)).toThrow(/Identidad inconsistente/);
  });

  it('VERDE: sin ese combo, vuelve a no lanzar', () => {
    expect(() => groupCombosByIdentity(datosLimpios)).not.toThrow();
  });
});
