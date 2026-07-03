// expandWeekArc - Fase 4, Componente P1a. Falsables v1-v7 + r1/r2 (D-018).

import { describe, it, expect } from 'vitest';
import { expandWeekArc } from '../expandWeekArc.js';
import { buildWeekArc } from '../../skeleton/buildWeekArc.js';
import { DAYS_ORDER } from '../../skeleton/days.js';
import { mulberry32, seedFromString } from '../../skeleton/rng.js';
import { MOMENTOS } from '../../dishes/schema.js';

const DIAS = DAYS_ORDER;

function beat(day, overrides = {}) {
  return { day, density: 'medio', slotRole: 'rotativo', ...overrides };
}

function beats7(overridesByDay = {}) {
  return DIAS.map((day) => beat(day, overridesByDay[day] || {}));
}

describe('expandWeekArc - v1: weekArc real -> 14 huecos', () => {
  // seed=0 (mismo fixture que buildWeekArc.test.js): skeletonId="C",
  // ancla = atun/tomate/pimientos crudo, cookDay="Martes", leftoverDays=[],
  // entreno en Lunes/Miercoles/Viernes.
  const { weekArc } = buildWeekArc({
    profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] },
    seed: 0,
    strategy: 'mantenimiento_equilibrado',
  });
  const catalog = [
    { id: weekArc.anchors[0].anchorId, momento: ['cena'] },
  ];
  const { slots } = expandWeekArc({ weekArc, catalog, seed: 0 });

  it('produce exactamente 14 huecos, 2 por dia en orden Lunes->Domingo', () => {
    expect(slots).toHaveLength(14);
    expect(slots.map((s) => s.day)).toEqual(DIAS.flatMap((d) => [d, d]));
    expect(slots.map((s) => s.momento)).toEqual(DIAS.flatMap(() => ['comida', 'cena']));
  });

  it('el marcado de entreno aplica solo a la cena; la comida del mismo dia queda sin fixedRole', () => {
    for (const day of ['Lunes', 'Miercoles', 'Viernes']) {
      const comida = slots.find((s) => s.day === day && s.momento === 'comida');
      const cena = slots.find((s) => s.day === day && s.momento === 'cena');
      expect(comida.fixedRole).toBeUndefined();
      expect(cena.fixedRole).toBe('entreno');
    }
  });

  it('libre/familiar se propagan a ambos momentos del dia', () => {
    for (const day of ['Sabado', 'Domingo']) {
      const beatDia = weekArc.beats.find((b) => b.day === day);
      const comida = slots.find((s) => s.day === day && s.momento === 'comida');
      const cena = slots.find((s) => s.day === day && s.momento === 'cena');
      expect(comida.fixedRole).toBe(beatDia.fixedRole);
      expect(cena.fixedRole).toBe(beatDia.fixedRole);
    }
  });

  it('densidad heredada correctamente en ambos momentos de cada dia', () => {
    for (const beatDia of weekArc.beats) {
      const comida = slots.find((s) => s.day === beatDia.day && s.momento === 'comida');
      const cena = slots.find((s) => s.day === beatDia.day && s.momento === 'cena');
      expect(comida.density).toBe(beatDia.density);
      expect(cena.density).toBe(beatDia.density);
    }
  });
});

describe('expandWeekArc - v2: ancla con momento unico', () => {
  const weekArc = {
    beats: beats7(),
    anchors: [{ anchorId: 'dishUnico', cookDay: 'Lunes', leftoverDays: [] }],
  };
  const catalog = [{ id: 'dishUnico', momento: ['comida'] }];
  const { slots, decisionLog } = expandWeekArc({ weekArc, catalog, seed: 'v2-seed' });

  it('coloca el ancla en su unico momento posible, sin RNG', () => {
    const lunesComida = slots.find((s) => s.day === 'Lunes' && s.momento === 'comida');
    const lunesCena = slots.find((s) => s.day === 'Lunes' && s.momento === 'cena');
    expect(lunesComida.dishId).toBe('dishUnico');
    expect(lunesComida.abierto).toBe(false);
    expect(lunesCena.abierto).toBe(true);
  });

  it('causa registrada: ancla_momento_unico', () => {
    const causa = decisionLog.find((d) => d.consequence.includes('dishUnico'));
    expect(causa.cause).toBe('ancla_momento_unico');
  });
});

describe('expandWeekArc - v3: ancla con momento ambiguo, desempate RNG determinista', () => {
  const weekArc = {
    beats: beats7(),
    anchors: [{ anchorId: 'dishAmbiguo', cookDay: 'Jueves', leftoverDays: [] }],
  };
  const catalog = [{ id: 'dishAmbiguo', momento: ['comida', 'cena'] }];

  it('misma semilla -> misma colocacion en dos ejecuciones', () => {
    const r1 = expandWeekArc({ weekArc, catalog, seed: 'v3-seed' });
    const r2 = expandWeekArc({ weekArc, catalog, seed: 'v3-seed' });
    expect(JSON.stringify(r1.slots)).toBe(JSON.stringify(r2.slots));
    expect(JSON.stringify(r1.decisionLog)).toBe(JSON.stringify(r2.decisionLog));

    const causa = r1.decisionLog.find((d) => d.consequence.includes('dishAmbiguo'));
    expect(causa.cause).toBe('ancla_desempate_rng');
  });

  it('semillas distintas pueden resolver a momentos distintos (el desempate es real, no un no-op)', () => {
    const resultados = new Set();
    for (let seed = 0; seed < 20; seed++) {
      const { slots } = expandWeekArc({ weekArc, catalog, seed });
      const jueves = slots.find((s) => s.day === 'Jueves' && s.dishId === 'dishAmbiguo');
      resultados.add(jueves.momento);
    }
    expect(resultados.size).toBe(2);
  });
});

describe('expandWeekArc - v4: sobra con momento ambos hereda el momento del ancla', () => {
  const weekArc = {
    beats: beats7(),
    anchors: [{ anchorId: 'dishAmbiguo', cookDay: 'Lunes', leftoverDays: ['Martes', 'Miercoles'] }],
  };
  const catalog = [{ id: 'dishAmbiguo', momento: ['comida', 'cena'] }];

  it('las sobras quedan en el MISMO momento que el ancla, para varias semillas', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { slots } = expandWeekArc({ weekArc, catalog, seed });
      const ancla = slots.find((s) => s.day === 'Lunes' && s.dishId === 'dishAmbiguo');
      const sobra1 = slots.find((s) => s.day === 'Martes' && s.dishId === 'dishAmbiguo');
      const sobra2 = slots.find((s) => s.day === 'Miercoles' && s.dishId === 'dishAmbiguo');
      expect(sobra1.momento).toBe(ancla.momento);
      expect(sobra2.momento).toBe(ancla.momento);
    }
  });

  it('causa registrada: sobra_hereda_momento_ancla', () => {
    const { decisionLog } = expandWeekArc({ weekArc, catalog, seed: 1 });
    const causaSobra = decisionLog.find((d) => d.consequence.startsWith('Martes/'));
    expect(causaSobra.cause).toBe('sobra_hereda_momento_ancla');
  });
});

describe('expandWeekArc - v5: colision construida (2 anclas, sobras al mismo dia)', () => {
  // seed=3: dishB (ambos) resuelve su ancla a "comida" en Miercoles, y su
  // sobra en Martes colisiona con la de dishA (unico "comida") que llego
  // primero -- dishB SI admite "cena" -> se reasigna. dishE (unico
  // "comida") colisiona en Sabado con dishF (unico "comida") que llego
  // primero -- dishE NO admite "cena" -> se descarta. Seed encontrado por
  // busqueda exhaustiva sobre este fixture exacto (ver sesion 2026-07-03).
  const weekArc = {
    beats: beats7(),
    anchors: [
      { anchorId: 'dishA', cookDay: 'Lunes', leftoverDays: ['Martes'] },
      { anchorId: 'dishB', cookDay: 'Miercoles', leftoverDays: ['Martes'] },
      { anchorId: 'dishF', cookDay: 'Viernes', leftoverDays: ['Sabado'] },
      { anchorId: 'dishE', cookDay: 'Domingo', leftoverDays: ['Sabado'] },
    ],
  };
  const catalog = [
    { id: 'dishA', momento: ['comida'] },
    { id: 'dishB', momento: ['comida', 'cena'] },
    { id: 'dishF', momento: ['comida'] },
    { id: 'dishE', momento: ['comida'] },
  ];
  const { slots, decisionLog } = expandWeekArc({ weekArc, catalog, seed: 3 });

  it('rama "admite": la segunda sobra (dishB) toma el momento restante en Martes', () => {
    const martesComida = slots.find((s) => s.day === 'Martes' && s.momento === 'comida');
    const martesCena = slots.find((s) => s.day === 'Martes' && s.momento === 'cena');
    expect(martesComida.dishId).toBe('dishA');
    expect(martesCena.dishId).toBe('dishB');
    const causa = decisionLog.find((d) => d.cause === 'colision_momento_restante');
    expect(causa).toBeDefined();
    expect(causa.consequence).toBe('Martes/cena <- dishB');
  });

  it('rama "no admite": la segunda sobra (dishE) se descarta, Sabado queda sin ella', () => {
    const sabadoComida = slots.find((s) => s.day === 'Sabado' && s.momento === 'comida');
    const sabadoCena = slots.find((s) => s.day === 'Sabado' && s.momento === 'cena');
    expect(sabadoComida.dishId).toBe('dishF');
    expect(sabadoCena.abierto).toBe(true);
    expect(sabadoCena.dishId).toBeUndefined();
    const causa = decisionLog.find((d) => d.cause === 'colision_sin_hueco');
    expect(causa).toBeDefined();
    expect(causa.consequence).toContain('dishE');
  });

  it('ambas ramas registran causa no vacia', () => {
    for (const d of decisionLog) {
      expect(typeof d.cause).toBe('string');
      expect(d.cause.length).toBeGreaterThan(0);
      expect(typeof d.evidence).toBe('string');
      expect(d.evidence.length).toBeGreaterThan(0);
    }
  });
});

describe('expandWeekArc - v6: determinismo de colocacion completo', () => {
  const { weekArc } = buildWeekArc({
    profile: { trainingDays: ['Martes', 'Jueves'] },
    seed: 42,
    strategy: 'volumen_limpio',
  });
  const catalog = [{ id: weekArc.anchors[0].anchorId, momento: ['comida', 'cena'] }];

  it('misma semilla -> expansion + colocacion + log byte-identicos', () => {
    const r1 = expandWeekArc({ weekArc, catalog, seed: 42 });
    const r2 = expandWeekArc({ weekArc, catalog, seed: 42 });
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

describe('expandWeekArc - v7/r2: independencia de streams RNG', () => {
  const profile = { trainingDays: ['Martes', 'Jueves'] };

  it('consumir N valores de ::skeleton no altera la secuencia de ::walk', () => {
    // Dos weekArc identicos (mismo seed/profile/strategy) -> mismo consumo
    // de ::skeleton en buildWeekArc. Lo que varia es SOLO cuanto se
    // invoca buildWeekArc antes de expandir (simula "consumo previo" del
    // stream ::skeleton llamando varias veces).
    const seed = 7;
    const { weekArc } = buildWeekArc({ profile, seed, strategy: 'definicion_saciante' });
    const catalog = [{ id: weekArc.anchors[0].anchorId, momento: ['comida', 'cena'] }];

    // llamada "limpia"
    const limpio = expandWeekArc({ weekArc, catalog, seed });

    // "contaminar" el stream de ::skeleton llamando buildWeekArc varias
    // veces mas antes de expandir -- cada llamada crea su PROPIO
    // generador mulberry32 (namespace ::skeleton), no hay estado
    // compartido entre llamadas, asi que esto no deberia cambiar nada.
    for (let i = 0; i < 5; i++) buildWeekArc({ profile, seed, strategy: 'definicion_saciante' });
    const contaminado = expandWeekArc({ weekArc, catalog, seed });

    expect(JSON.stringify(contaminado)).toBe(JSON.stringify(limpio));
  });

  it('mismo seed -> mismo weekArc antes y despues de que exista el walk (buildWeekArc no cambia)', () => {
    const seed = 11;
    const antes = buildWeekArc({ profile, seed, strategy: 'fat_loss_general' });
    const catalog = [{ id: antes.weekArc.anchors[0].anchorId, momento: ['comida', 'cena'] }];
    expandWeekArc({ weekArc: antes.weekArc, catalog, seed }); // "existe el walk"
    const despues = buildWeekArc({ profile, seed, strategy: 'fat_loss_general' });

    expect(JSON.stringify(despues)).toBe(JSON.stringify(antes));
  });

  it('r2: el desempate usa el namespace "::walk", no "::skeleton" (mutar el sufijo pone esto en rojo)', () => {
    // A diferencia de los dos tests anteriores (que no distinguirian una
    // rotura de namespace, por no haber estado compartido entre
    // llamadas), este SI ejecuta expandWeekArc y compara su salida real
    // contra el valor calculado de forma independiente con
    // mulberry32(seedFromString(`${seed}::walk`)) -- si expandWeekArc
    // consumiera "::skeleton" en su lugar, la salida real dejaria de
    // coincidir con esta expectativa para practicamente cualquier seed.
    const weekArc = {
      beats: beats7(),
      anchors: [{ anchorId: 'dishAmbiguo', cookDay: 'Jueves', leftoverDays: [] }],
    };
    const catalog = [{ id: 'dishAmbiguo', momento: ['comida', 'cena'] }];

    for (const seed of [0, 1, 2, 3, 4, 5]) {
      const { slots } = expandWeekArc({ weekArc, catalog, seed });
      const jueves = slots.find((s) => s.day === 'Jueves' && s.dishId === 'dishAmbiguo');
      const idxEsperado = Math.floor(mulberry32(seedFromString(`${seed}::walk`))() * MOMENTOS.length);
      expect(jueves.momento).toBe(MOMENTOS[idxEsperado]);
    }
  });
});
