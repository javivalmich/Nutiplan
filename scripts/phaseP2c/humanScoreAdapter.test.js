// humanScoreAdapter.test.js — Fase 4, Componente P2c (D1, D-025). Falsables
// obligatorios del contrato ratificado: discriminacion de estados, cobertura
// honesta, ausencia de valor != fallo, densidadDiaria simetrica.
//
// NO importa src/eval/**: fixtures via catalogo real (loadCatalog) y
// resolveDishComposition (import legal desde scripts/, D-025).

import { describe, it, expect } from 'vitest';
import { adaptHumanScore, ESTADOS } from './humanScoreAdapter.js';
import { loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';
import { resolveDishComposition } from '../../src/engine2/dishes/compositionResolver.js';
import { DAYS_ORDER } from '../../src/engine2/skeleton/days.js';
import { MOMENTOS } from '../../src/engine2/dishes/schema.js';

const catalogReal = loadCatalog();
const scaffold = catalogReal.filter((d) => resolveDishComposition(d).origen === 'scaffold');
const freeform = catalogReal.filter((d) => resolveDishComposition(d).origen === 'freeform');

// Fixtures citadas en vivo (verificadas contra el catalogo real, sesion P2c-D1):
const scaffoldA = scaffold.find((d) => d.id === '["caliente_clasico","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]');
const scaffoldB = scaffold.find((d) => resolveDishComposition(d).tupla.S === 'limon_hierbas' && d.id !== scaffoldA.id);
const scaffoldCuchara = scaffold.find((d) => d.id === '["legumbre","lentejas",null,"zanahoria",null,"pimenton_ajo","guisado"]');
const freeformA = freeform.find((d) => d.id === 'pisto_manchego_huevo');

it('fixtures reales localizadas', () => {
  expect(scaffoldA).toBeDefined();
  expect(scaffoldB).toBeDefined();
  expect(scaffoldB.id).not.toBe(scaffoldA.id);
  expect(scaffoldCuchara).toBeDefined();
  expect(freeformA).toBeDefined();
  expect(resolveDishComposition(scaffoldA).tupla.S).toBe('limon_hierbas');
  expect(resolveDishComposition(scaffoldB).tupla.S).toBe('limon_hierbas');
  expect(resolveDishComposition(scaffoldCuchara).tupla.tmpl).toBe('legumbre');
  expect(resolveDishComposition(freeformA).origen).toBe('freeform');
});

function slot(day, momento, dishId, overrides = {}) {
  return {
    day, momento, density: 'medio', slotRole: 'rotativo', abierto: false, dishId, ...overrides,
  };
}

/** 14 huecos (7 dias x comida/cena), plato asignado por pick(day, momento). */
function fullWeekSlots(pick, overridesByKey = {}) {
  const out = [];
  for (const day of DAYS_ORDER) {
    for (const momento of MOMENTOS) {
      out.push(slot(day, momento, pick(day, momento), overridesByKey[`${day}::${momento}`] || {}));
    }
  }
  return out;
}

describe('contrato de terna (D-025): las 12 submetricas de humanScore, estado fijado por D0', () => {
  const catalog = [scaffoldA, freeformA];
  const slots = fullWeekSlots((day, momento) => (momento === 'comida' ? scaffoldA.id : freeformA.id));
  const report = adaptHumanScore({ slots, catalog });

  it('cada submetrica devuelve {valor, cobertura:{legibles,total}, estado}', () => {
    for (const key of Object.keys(report)) {
      const m = report[key];
      expect(m, key).toHaveProperty('valor');
      expect(m, key).toHaveProperty('cobertura');
      expect(m.cobertura, key).toHaveProperty('legibles');
      expect(m.cobertura, key).toHaveProperty('total');
      expect(m, key).toHaveProperty('estado');
    }
  });

  it('f1 -- discriminacion de estados: enum exacto por submetrica (D0, no re-derivar)', () => {
    expect(report.densidadDiaria.estado).toBe(ESTADOS.COMPLETA);
    expect(report.repeticionSalsa.estado).toBe(ESTADOS.PARCIAL);
    expect(report.repeticionTecnica.estado).toBe(ESTADOS.PARCIAL);
    expect(report.platoCuchara.estado).toBe(ESTADOS.PARCIAL);
    expect(report.continuidadEntrenoHidrato.estado).toBe(ESTADOS.PARCIAL);
    expect(report.domingoReconfortante.estado).toBe(ESTADOS.NO_OBSERVABLE);
    expect(report.diaFacilTrasElaborado.estado).toBe(ESTADOS.NO_OBSERVABLE);
    expect(report.repeticionProteinaMismoDia.estado).toBe(ESTADOS.NEEDS_HISTORY);
    expect(report.sorpresaEditorial.estado).toBe(ESTADOS.NEEDS_HISTORY);
    expect(report.usoSobrasVidaUtil.estado).toBe(ESTADOS.NEEDS_ENGINE2);
    expect(report.alternanciaBatch.estado).toBe(ESTADOS.NEEDS_ENGINE2);
    expect(report.coherenciaCompraPerecederos.estado).toBe(ESTADOS.NEEDS_ENGINE2);
  });

  it('motivo presente (string no vacio) siempre que estado !== completa', () => {
    for (const key of Object.keys(report)) {
      const m = report[key];
      if (m.estado !== ESTADOS.COMPLETA) {
        expect(typeof m.motivo, key).toBe('string');
        expect(m.motivo.length, key).toBeGreaterThan(0);
      } else {
        expect(m.motivo, key).toBeUndefined();
      }
    }
  });
});

describe('f4 -- densidadDiaria simetrica: plan mixto scaffold+freeform, cobertura 14/14', () => {
  it('los 14 huecos cuentan hacia densidad sin importar el origen del plato', () => {
    const catalog = [scaffoldA, freeformA];
    const slots = fullWeekSlots((day, momento) => (momento === 'comida' ? scaffoldA.id : freeformA.id));
    const { densidadDiaria } = adaptHumanScore({ slots, catalog });

    expect(densidadDiaria.cobertura).toEqual({ legibles: 14, total: 14 });
    for (const day of DAYS_ORDER) {
      expect(densidadDiaria.valor[day].status, day).toBe('computed');
    }
  });

  it('un dia con menos de 2 comidas legibles (hueco sin colocar) queda unknown, sin inflar cobertura', () => {
    const catalog = [scaffoldA, freeformA];
    const slots = fullWeekSlots((day, momento) => (momento === 'comida' ? scaffoldA.id : freeformA.id));
    const lunesComida = slots.find((s) => s.day === 'Lunes' && s.momento === 'comida');
    lunesComida.dishId = undefined;
    lunesComida.abierto = true;

    const { densidadDiaria } = adaptHumanScore({ slots, catalog });
    expect(densidadDiaria.cobertura).toEqual({ legibles: 13, total: 14 });
    expect(densidadDiaria.valor.Lunes.status).toBe('unknown');
  });
});

describe('f2 -- cobertura honesta: metricas parciales reportan exactamente la fraccion de slots scaffold', () => {
  it('k=2 scaffold + resto freeform (14 huecos): repeticionSalsa/Tecnica/platoCuchara reportan legibles=2, total=14', () => {
    const catalog = [scaffoldA, scaffoldB, freeformA];
    const keys = fullWeekSlots(() => null).map((s) => `${s.day}::${s.momento}`);
    const dosScaffold = new Set([keys[0], keys[1]]); // Lunes::comida, Lunes::cena
    const slots = fullWeekSlots((day, momento) => {
      const key = `${day}::${momento}`;
      if (key === keys[0]) return scaffoldA.id;
      if (key === keys[1]) return scaffoldB.id;
      return freeformA.id;
    });

    const report = adaptHumanScore({ slots, catalog });
    expect(report.repeticionSalsa.cobertura).toEqual({ legibles: 2, total: 14 });
    expect(report.repeticionTecnica.cobertura).toEqual({ legibles: 2, total: 14 });
    expect(report.platoCuchara.cobertura).toEqual({ legibles: 2, total: 14 });
    // ambos scaffold comparten S="limon_hierbas": conteo exacto, no inflado por los freeform.
    expect(report.repeticionSalsa.valor.conteos.limon_hierbas).toBe(2);
    expect(dosScaffold.size).toBe(2); // guarda de la propia fixture
  });
});

describe('f3 -- ausencia de valor != fallo: no_observable produce null, nunca 0', () => {
  it('domingoReconfortante y diaFacilTrasElaborado: valor null incluso con semana real completa', () => {
    const catalog = [scaffoldA, freeformA];
    const slots = fullWeekSlots((day, momento) => (momento === 'comida' ? scaffoldA.id : freeformA.id));
    const { domingoReconfortante, diaFacilTrasElaborado } = adaptHumanScore({ slots, catalog });

    expect(domingoReconfortante.valor).toBeNull();
    expect(diaFacilTrasElaborado.valor).toBeNull();
    // Guarda explicita: ninguno de los dos es 0 (0 seria falso-positivo de "no ocurre", no "no medible").
    expect(domingoReconfortante.valor).not.toBe(0);
    expect(diaFacilTrasElaborado.valor).not.toBe(0);
  });
});

describe('platoCuchara: cuenta solo tmpl legumbre/sopa_crema, solo origen scaffold', () => {
  it('1 scaffold cuchara + 1 scaffold no-cuchara + freeform: count=1, cobertura scaffold=2/14', () => {
    const catalog = [scaffoldCuchara, scaffoldA, freeformA];
    const keys = fullWeekSlots(() => null).map((s) => `${s.day}::${s.momento}`);
    const slots = fullWeekSlots((day, momento) => {
      const key = `${day}::${momento}`;
      if (key === keys[0]) return scaffoldCuchara.id;
      if (key === keys[1]) return scaffoldA.id;
      return freeformA.id;
    });

    const { platoCuchara } = adaptHumanScore({ slots, catalog });
    expect(platoCuchara.valor.count).toBe(1);
    expect(platoCuchara.cobertura).toEqual({ legibles: 2, total: 14 });
  });
});

describe('continuidadEntrenoHidrato: gate de dia simetrico (fixedRole), hidrato solo scaffold', () => {
  it('cena entreno con scaffold (tupla.C truthy): tieneHidrato=true, cobertura 1/1', () => {
    const catalog = [scaffoldA];
    const slots = [slot('Miercoles', 'cena', scaffoldA.id, { fixedRole: 'entreno' })];
    const { continuidadEntrenoHidrato } = adaptHumanScore({ slots, catalog });

    expect(continuidadEntrenoHidrato.cobertura).toEqual({ legibles: 1, total: 1 });
    expect(continuidadEntrenoHidrato.valor.conHidrato).toBe(1);
    expect(continuidadEntrenoHidrato.valor.detalle[0].tieneHidrato).toBe(true);
  });

  it('cena entreno con freeform (sin tupla): status unknown, excluido del numerador pero no del denominador', () => {
    const catalog = [freeformA];
    const slots = [slot('Miercoles', 'cena', freeformA.id, { fixedRole: 'entreno' })];
    const { continuidadEntrenoHidrato } = adaptHumanScore({ slots, catalog });

    expect(continuidadEntrenoHidrato.cobertura).toEqual({ legibles: 0, total: 1 });
    expect(continuidadEntrenoHidrato.valor.detalle[0].status).toBe('unknown');
  });

  it('sin cenas fixedRole=entreno en el plan: cobertura 0/0, estado sigue parcial (clasificacion fija, no depende de la ejecucion)', () => {
    const catalog = [scaffoldA];
    const slots = fullWeekSlots(() => scaffoldA.id);
    const { continuidadEntrenoHidrato } = adaptHumanScore({ slots, catalog });

    expect(continuidadEntrenoHidrato.cobertura).toEqual({ legibles: 0, total: 0 });
    expect(continuidadEntrenoHidrato.estado).toBe(ESTADOS.PARCIAL);
    expect(continuidadEntrenoHidrato.valor).toBeNull();
  });
});
