// materializePlan — Frente A/Fase 7. Orquestador de materializacion del
// plan observable (docs/spec/plan-observable.md v1.0, §4). Cada asercion
// traza a su clausula en el nombre del test. Ninguna heuristica nueva: solo
// verifica que la agrupacion/propagacion/concatenacion estructural preserve
// lo que buildWeekArc/runWalk ya calculan.

import { describe, it, expect } from 'vitest';
import { materializePlan } from '../materializePlan.js';
import { buildWeekArc } from '../skeleton/buildWeekArc.js';
import { runWalk } from '../walk/runWalk.js';
import { loadCatalog } from '../dishes/loadCatalog.js';
import { DAYS_ORDER } from '../skeleton/days.js';
import { MOMENTOS } from '../dishes/schema.js';

const FIXTURE_INPUT = {
  profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] },
  seed: 0,
  strategy: 'mantenimiento_equilibrado',
};

describe('materializePlan — §4.1 claves obligatorias', () => {
  it('el objeto retornado expone exactamente days, strategy, weekWarnings, weekProblems, weekScore, decisionLog', () => {
    const catalog = loadCatalog();
    const plan = materializePlan({ ...FIXTURE_INPUT, catalog });
    expect(Object.keys(plan).sort()).toEqual(
      ['days', 'decisionLog', 'strategy', 'weekProblems', 'weekScore', 'weekWarnings'].sort(),
    );
  });
});

describe('materializePlan — §4.2.1-2 days como coleccion enumerable, orden estable, posicion identificable', () => {
  const catalog = loadCatalog();
  const plan = materializePlan({ ...FIXTURE_INPUT, catalog });

  it('days es un array de 7 elementos', () => {
    expect(Array.isArray(plan.days)).toBe(true);
    expect(plan.days).toHaveLength(7);
  });

  it('el orden de days coincide con DAYS_ORDER (Lunes..Domingo)', () => {
    expect(plan.days.map((d) => d.day)).toEqual(DAYS_ORDER);
  });

  it('cada elemento es identificable por su posicion (indice <-> day estable)', () => {
    DAYS_ORDER.forEach((day, i) => {
      expect(plan.days[i].day).toBe(day);
    });
  });
});

describe('materializePlan — §4.2.3-4 cada dia expone meals enumerable, cada comida identificable sin ambiguedad', () => {
  const catalog = loadCatalog();
  const plan = materializePlan({ ...FIXTURE_INPUT, catalog });

  it('cada dia expone meals como array de 2 (comida/cena, modelo de 14 posiciones)', () => {
    for (const d of plan.days) {
      expect(Array.isArray(d.meals)).toBe(true);
      expect(d.meals).toHaveLength(2);
    }
  });

  it('dentro de cada dia, momento no se repite (identificacion no ambigua)', () => {
    for (const d of plan.days) {
      const momentos = d.meals.map((m) => m.momento);
      expect(new Set(momentos).size).toBe(momentos.length);
      expect(momentos.sort()).toEqual([...MOMENTOS].sort());
    }
  });
});

describe('materializePlan — §4.2.5 identidad de plato establecible por observacion', () => {
  const catalog = loadCatalog();
  const plan = materializePlan({ ...FIXTURE_INPUT, catalog });

  it('cada comida expone el plato materializado (no solo un id opaco) con su identidad de identity.js', () => {
    for (const d of plan.days) {
      for (const m of d.meals) {
        expect(m.dish).toBeDefined();
        expect(typeof m.dish.id).toBe('string');
        expect(m.dish.id.length).toBeGreaterThan(0);
      }
    }
  });

  it('el id de cada plato materializado coincide con el id que ya trae el catalogo (identidad de identity.js, no reinventada)', () => {
    const catalogIds = new Set(catalog.map((dish) => dish.id));
    for (const d of plan.days) {
      for (const m of d.meals) {
        expect(catalogIds.has(m.dish.id)).toBe(true);
      }
    }
  });

  it('dos ocurrencias del mismo dishId en el plan son identificables como la misma identidad por observacion (objeto plato byte-identico)', () => {
    // seed=1 (mismo profile/strategy): buildWeekArc produce leftoverDays no
    // vacio (ancla+sobra), condicion necesaria para tener una repeticion
    // real que observar. FIXTURE_INPUT (seed=0) no la produce para este
    // profile/catalogo -- ver reporte.
    const planConRepeticion = materializePlan({ ...FIXTURE_INPUT, seed: 1, catalog });
    const byId = new Map();
    for (const d of planConRepeticion.days) {
      for (const m of d.meals) {
        if (!byId.has(m.dish.id)) byId.set(m.dish.id, []);
        byId.get(m.dish.id).push(m.dish);
      }
    }
    const repetidos = [...byId.values()].filter((occurrences) => occurrences.length > 1);
    expect(repetidos.length).toBeGreaterThan(0);
    for (const occurrences of repetidos) {
      const serialized = occurrences.map((o) => JSON.stringify(o));
      expect(new Set(serialized).size).toBe(1);
    }
  });
});

describe('materializePlan — §4.3 strategy ligada al objeto, valor de weekArc (no recalculada)', () => {
  it('strategy en el plan == weekArc.strategy calculado por buildWeekArc', () => {
    const catalog = loadCatalog();
    const { weekArc } = buildWeekArc(FIXTURE_INPUT);
    const plan = materializePlan({ ...FIXTURE_INPUT, catalog });
    expect(plan.strategy).toBe(weekArc.strategy);
    expect(plan.strategy).toBe(FIXTURE_INPUT.strategy);
  });
});

describe('materializePlan — §4.4 weekWarnings/weekProblems presentes como []', () => {
  it('ambas claves son arrays vacios', () => {
    const catalog = loadCatalog();
    const plan = materializePlan({ ...FIXTURE_INPUT, catalog });
    expect(plan.weekWarnings).toEqual([]);
    expect(plan.weekProblems).toEqual([]);
  });
});

describe('materializePlan — §4.5 weekScore presente con valor null (gate CLAUDE.md:17-28: solo presencia de clave, sin tipo exigido)', () => {
  it('weekScore es null', () => {
    const catalog = loadCatalog();
    const plan = materializePlan({ ...FIXTURE_INPUT, catalog });
    expect(plan.weekScore).toBeNull();
  });
});

describe('materializePlan — §4.6 decisionLog es UNA coleccion, cardinalidad = suma de ambas fuentes, contenido intacto', () => {
  it('decisionLog es un unico array', () => {
    const catalog = loadCatalog();
    const plan = materializePlan({ ...FIXTURE_INPUT, catalog });
    expect(Array.isArray(plan.decisionLog)).toBe(true);
  });

  it('cardinalidad == arcLog.length + walkLog.length (arco primero, walk despues)', () => {
    const catalog = loadCatalog();
    const { weekArc, decisionLog: arcLog } = buildWeekArc(FIXTURE_INPUT);
    const { decisionLog: walkLog } = runWalk({ weekArc, catalog, seed: FIXTURE_INPUT.seed, profile: FIXTURE_INPUT.profile });
    const plan = materializePlan({ ...FIXTURE_INPUT, catalog });

    expect(plan.decisionLog).toHaveLength(arcLog.length + walkLog.length);
    expect(plan.decisionLog.slice(0, arcLog.length)).toEqual(arcLog);
    expect(plan.decisionLog.slice(arcLog.length)).toEqual(walkLog);
  });

  it('CONTROL DE MUTACION discriminante: si el orquestador retornara solo uno de los dos logs, esta asercion de cardinalidad cae', () => {
    // Esta prueba documenta el fork ratificado (F-A4b: concatenacion, sin
    // normalizar shapes) frente a la alternativa descartada (retornar solo
    // un log). No se ejecuta la mutacion aqui -- ver reporte, Paso 3.
    const catalog = loadCatalog();
    const { weekArc, decisionLog: arcLog } = buildWeekArc(FIXTURE_INPUT);
    const { decisionLog: walkLog } = runWalk({ weekArc, catalog, seed: FIXTURE_INPUT.seed, profile: FIXTURE_INPUT.profile });
    const plan = materializePlan({ ...FIXTURE_INPUT, catalog });
    expect(plan.decisionLog).toHaveLength(arcLog.length + walkLog.length);
    expect(plan.decisionLog).not.toHaveLength(walkLog.length);
    expect(plan.decisionLog).not.toHaveLength(arcLog.length);
  });
});

describe('materializePlan — Determinismo (CLAUDE.md invariante 6)', () => {
  it('misma seed y entrada -> objeto byte-identico (JSON.stringify) en dos invocaciones', () => {
    const catalog = loadCatalog();
    const plan1 = materializePlan({ ...FIXTURE_INPUT, catalog });
    const plan2 = materializePlan({ ...FIXTURE_INPUT, catalog });
    expect(JSON.stringify(plan1)).toBe(JSON.stringify(plan2));
  });
});
