// runWalk - Fase 4, Componente P1b. Falsables v1-v13 (D-019). Los ciclos
// de mutacion r1-r5 se demuestran manualmente en la sesion (no viven como
// codigo de test permanente, mismo patron que P1a/D-018).

import { describe, it, expect } from 'vitest';
import { runWalk } from '../runWalk.js';
import { expandWeekArc } from '../expandWeekArc.js';
import { buildWeekArc } from '../../skeleton/buildWeekArc.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';
import { DAYS_ORDER } from '../../skeleton/days.js';
import { MOMENTOS } from '../../dishes/schema.js';

const DIAS = DAYS_ORDER;

function beat(day, overrides = {}) {
  return { day, density: 'medio', slotRole: 'rotativo', ...overrides };
}

function beats7(overridesByDay = {}) {
  return DIAS.map((day) => beat(day, overridesByDay[day] || {}));
}

function rot(id, overrides = {}) {
  return {
    id, rol: 'rotativo', momento: ['comida', 'cena'], tempFeel: 'caliente', plateType: `tipo_${id}`, energiaCocina: 'medio', ...overrides,
  };
}

function genRotativos(n, prefix = 'rot') {
  return Array.from({ length: n }, (_, i) => rot(`${prefix}${i}`, { plateType: `tipo${i % 5}` }));
}

/**
 * Cubre con anclas TODOS los huecos de la semana excepto los indicados en
 * openSlots (day/momento). Aisla el pool del hueco bajo prueba: sin esto,
 * cualquier plato rotativo "de relleno" para otros dias es visible
 * tambien en Lunes (se evalua primero, nada esta consumido aun) y
 * contamina el pool que se quiere controlar con precision (plateType,
 * tempFeel de "ayer"/"anteayer"). overridesBySlot permite fijar el
 * plateType/tempFeel exacto de un ancla concreta (para jugar el papel de
 * "ayer"/"anteayer" en los tests de preferencia A/B).
 */
function anchorEverythingExcept(openSlots, overridesBySlot = {}) {
  const openSet = new Set(openSlots.map(({ day, momento }) => `${day}::${momento}`));
  const anchors = [];
  const dishes = [];
  let n = 0;
  for (const day of DIAS) {
    for (const momento of MOMENTOS) {
      const key = `${day}::${momento}`;
      if (openSet.has(key)) continue;
      const id = `anchorFill${n++}`;
      const override = overridesBySlot[key] || {};
      anchors.push({ anchorId: id, cookDay: day, leftoverDays: [] });
      dishes.push({
        ...rot(id), rol: 'ancla', momento: [momento], plateType: `ancla_${day}_${momento}`, tempFeel: 'neutro', ...override,
      });
    }
  }
  return { anchors, dishes };
}

describe('runWalk - v1: semana real (catalogo 241), degradacion de capricho visible', () => {
  const catalog = loadCatalog();
  const { weekArc } = buildWeekArc({
    profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] },
    seed: 0,
    strategy: 'mantenimiento_equilibrado',
  });
  const p1a = expandWeekArc({ weekArc, catalog, seed: 0 });
  const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 0 });

  it('14 huecos, cero abiertos', () => {
    expect(slots).toHaveLength(14);
    expect(slots.every((s) => s.abierto === false)).toBe(true);
    expect(slots.every((s) => typeof s.dishId === 'string' && s.dishId.length > 0)).toBe(true);
  });

  it('los huecos ya colocados por P1a quedan byte-identicos', () => {
    const colocadosP1a = p1a.slots.filter((s) => !s.abierto);
    expect(colocadosP1a.length).toBeGreaterThan(0);
    for (const s of colocadosP1a) {
      const final = slots.find((x) => x.day === s.day && x.momento === s.momento);
      expect(final.dishId).toBe(s.dishId);
    }
  });

  it('el catalogo real no tiene platos rol="capricho": degradacion registrada como evento', () => {
    expect(catalog.some((d) => d.rol === 'capricho')).toBe(false);
    const evento = decisionLog.find((d) => d.causa === 'capricho_degradado_a_rotativo');
    expect(evento).toBeDefined();
    expect(evento.evento).toBe(true);
    expect(evento.evidencia.length).toBeGreaterThan(0);
  });

  it('14 entradas de relleno (no-evento), cada una con plato/causa/alternativasDescartadas', () => {
    const rellenos = decisionLog.filter((d) => !d.evento);
    expect(rellenos).toHaveLength(14);
    for (const r of rellenos) {
      expect(typeof r.plato).toBe('string');
      expect(typeof r.causa).toBe('string');
      expect(r.causa.length).toBeGreaterThan(0);
      expect(Array.isArray(r.alternativasDescartadas)).toBe(true);
    }
  });
});

describe('runWalk - v2: capricho (fixture propio, catalogo real no tiene rol="capricho")', () => {
  it('set unico -> se coloca directo, sin RNG, causa capricho_candidato_unico', () => {
    const weekArc = { beats: beats7({ Jueves: { slotRole: 'capricho' } }), anchors: [] };
    const catalog = [...genRotativos(20), { ...rot('capUnico'), rol: 'capricho', momento: ['cena'] }];
    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v2-unico' });

    const jCena = slots.find((s) => s.day === 'Jueves' && s.momento === 'cena');
    const jComida = slots.find((s) => s.day === 'Jueves' && s.momento === 'comida');
    expect(jCena.dishId).toBe('capUnico');
    expect(jComida.dishId).not.toBe('capUnico');
    expect(catalog.find((d) => d.id === jComida.dishId).rol).toBe('rotativo');

    const entry = decisionLog.find((d) => d.plato === 'capUnico');
    expect(entry.causa).toBe('capricho_candidato_unico');
  });

  it('exactamente UN capricho por semana (nunca dos)', () => {
    const weekArc = { beats: beats7({ Martes: { slotRole: 'capricho' } }), anchors: [] };
    const catalog = [...genRotativos(20), { ...rot('capA'), rol: 'capricho', momento: ['comida'] }, { ...rot('capB'), rol: 'capricho', momento: ['cena'] }];
    const { slots } = runWalk({ weekArc, catalog, seed: 'v2-uno' });
    const usados = slots.filter((s) => s.dishId === 'capA' || s.dishId === 'capB');
    expect(usados).toHaveLength(1);
  });

  it('set ambiguo -> desempate RNG determinista; el hermano pasa a rotativo', () => {
    const weekArc = { beats: beats7({ Jueves: { slotRole: 'capricho' } }), anchors: [] };
    const catalog = [...genRotativos(20), { ...rot('capAmbiguo'), rol: 'capricho', momento: ['comida', 'cena'] }];

    const r1 = runWalk({ weekArc, catalog, seed: 'v2-ambiguo' });
    const r2 = runWalk({ weekArc, catalog, seed: 'v2-ambiguo' });
    expect(JSON.stringify(r1.slots)).toBe(JSON.stringify(r2.slots));

    const entry = r1.decisionLog.find((d) => d.plato === 'capAmbiguo');
    expect(entry.causa).toBe('capricho_candidato_unico'); // unico candidato del pool, aunque su momento sea ambiguo
    expect(entry.evidencia).toContain('momento ambiguo');

    const hermanoMomento = entry.momento === 'comida' ? 'cena' : 'comida';
    const hermano = r1.slots.find((s) => s.day === 'Jueves' && s.momento === hermanoMomento);
    expect(hermano.dishId).not.toBe('capAmbiguo');
    expect(catalog.find((d) => d.id === hermano.dishId).rol).toBe('rotativo');
  });

  it('set ambiguo -> semillas distintas pueden resolver a momentos distintos (desempate real)', () => {
    const weekArc = { beats: beats7({ Jueves: { slotRole: 'capricho' } }), anchors: [] };
    const catalog = [...genRotativos(20), { ...rot('capAmbiguo'), rol: 'capricho', momento: ['comida', 'cena'] }];
    const resultados = new Set();
    for (let seed = 0; seed < 20; seed++) {
      const { decisionLog } = runWalk({ weekArc, catalog, seed });
      const entry = decisionLog.find((d) => d.plato === 'capAmbiguo');
      resultados.add(entry.momento);
    }
    expect(resultados.size).toBe(2);
  });

  it('pool capricho vacio (catalogo sin rol="capricho") -> degradacion, ambos huecos rotativos', () => {
    const weekArc = { beats: beats7({ Jueves: { slotRole: 'capricho' } }), anchors: [] };
    const catalog = genRotativos(20);
    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v2-vacio' });
    const jComida = slots.find((s) => s.day === 'Jueves' && s.momento === 'comida');
    const jCena = slots.find((s) => s.day === 'Jueves' && s.momento === 'cena');
    expect(jComida.abierto).toBe(false);
    expect(jCena.abierto).toBe(false);
    const evento = decisionLog.find((d) => d.causa === 'capricho_degradado_a_rotativo');
    expect(evento).toBeDefined();
    expect(evento.day).toBe('Jueves');
  });
});

describe('runWalk - v3: hueco hermano del dia-ancla se rellena como rotativo normal', () => {
  it('el momento no colocado por el ancla se llena con un plato rol="rotativo", ignorando slotRole heredado', () => {
    const weekArc = {
      beats: beats7({ Lunes: { slotRole: 'ancla', anchorRef: 'anclaX' } }),
      anchors: [{ anchorId: 'anclaX', cookDay: 'Lunes', leftoverDays: [] }],
    };
    const catalog = [...genRotativos(20), { ...rot('anclaX'), rol: 'ancla', momento: ['comida'] }];
    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v3-seed' });

    const lunesComida = slots.find((s) => s.day === 'Lunes' && s.momento === 'comida');
    const lunesCena = slots.find((s) => s.day === 'Lunes' && s.momento === 'cena');
    expect(lunesComida.dishId).toBe('anclaX');
    expect(lunesCena.abierto).toBe(false);
    expect(lunesCena.dishId).not.toBe('anclaX');
    expect(catalog.find((d) => d.id === lunesCena.dishId).rol).toBe('rotativo');

    const entry = decisionLog.find((d) => d.day === 'Lunes' && d.momento === 'cena');
    expect(entry.causa.startsWith('seleccion_rotativo_')).toBe(true);
  });
});

describe('runWalk - v4: no-repeticion (salvo sobras)', () => {
  it('semana real: cada id aparece una vez, salvo el ancla que puede repetirse en cookDay+leftoverDays', () => {
    const catalog = loadCatalog();
    const { weekArc } = buildWeekArc({
      profile: { trainingDays: ['Martes', 'Jueves'] },
      seed: 3,
      strategy: 'volumen_limpio',
    });
    const { slots } = runWalk({ weekArc, catalog, seed: 3 });
    const anclaId = weekArc.anchors[0].anchorId;
    const conteo = new Map();
    for (const s of slots) conteo.set(s.dishId, (conteo.get(s.dishId) || 0) + 1);
    for (const [id, count] of conteo) {
      if (id === anclaId) {
        expect(count).toBe(1 + weekArc.anchors[0].leftoverDays.length);
      } else {
        expect(count).toBe(1);
      }
    }
  });
});

describe('runWalk - v5: pools por rol (capricho solo capricho; rotativo solo rotativo; ancla nunca libre)', () => {
  it('ningun hueco generico se rellena con un plato rol="ancla"', () => {
    const catalog = loadCatalog();
    const { weekArc } = buildWeekArc({
      profile: { trainingDays: [] },
      seed: 7,
      strategy: 'definicion_saciante',
    });
    const { slots } = runWalk({ weekArc, catalog, seed: 7 });
    const anclaId = weekArc.anchors[0].anchorId;
    for (const s of slots) {
      const dish = catalog.find((d) => d.id === s.dishId);
      if (dish.rol === 'ancla') {
        expect(s.dishId).toBe(anclaId);
      }
    }
  });

  it('el hueco capricho (pool no vacio) solo elige entre rol="capricho"', () => {
    const weekArc = { beats: beats7({ Viernes: { slotRole: 'capricho' } }), anchors: [] };
    const catalog = [...genRotativos(20), { ...rot('capX'), rol: 'capricho', momento: ['comida'] }];
    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v5-capricho' });
    const entry = decisionLog.find((d) => d.plato === 'capX');
    expect(entry).toBeDefined();
    expect(catalog.find((d) => d.id === entry.plato).rol).toBe('capricho');
  });
});

describe('runWalk - v6: preferencia A observable (plateType distinto de ayer, mismo momento)', () => {
  it('con alternativa disponible, descarta el candidato cuyo plateType repite el de ayer', () => {
    const { anchors, dishes } = anchorEverythingExcept(
      [{ day: 'Martes', momento: 'comida' }],
      { 'Lunes::comida': { plateType: 'tipoA' } },
    );
    const weekArc = { beats: beats7(), anchors };
    const catalog = [
      ...dishes,
      rot('repiteAyer', { plateType: 'tipoA', momento: ['comida'] }),
      rot('distintoDeAyer', { plateType: 'tipoB', momento: ['comida'] }),
    ];
    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v6-a' });
    const martes = slots.find((s) => s.day === 'Martes' && s.momento === 'comida');
    expect(martes.dishId).toBe('distintoDeAyer');
    const entry = decisionLog.find((d) => d.day === 'Martes' && d.momento === 'comida');
    expect(entry.evidencia).toContain('preferencia A aplicada');
  });

  it('sin alternativa (todos comparten plateType con ayer) -> se selecciona igual, log registra imposibilidad', () => {
    const { anchors, dishes } = anchorEverythingExcept(
      [{ day: 'Miercoles', momento: 'comida' }],
      { 'Martes::comida': { plateType: 'unico' } },
    );
    const weekArc = { beats: beats7(), anchors };
    const catalog = [
      ...dishes,
      rot('miercolesComidaX', { plateType: 'unico', momento: ['comida'] }),
      rot('miercolesComidaY', { plateType: 'unico', momento: ['comida'] }),
    ];
    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v6-imposible' });
    const entry = decisionLog.find((d) => d.day === 'Miercoles' && d.momento === 'comida');
    expect(entry.evidencia).toContain('preferencia A satisfecha por imposibilidad');
  });
});

describe('runWalk - v7: preferencia B observable (evita 3 dias consecutivos con el mismo tempFeel)', () => {
  it('con alternativa disponible, descarta el candidato que repetiria el tempFeel de los dos dias previos', () => {
    const { anchors, dishes } = anchorEverythingExcept(
      [{ day: 'Miercoles', momento: 'comida' }],
      {
        'Lunes::comida': { tempFeel: 'frio' },
        'Martes::comida': { tempFeel: 'frio' },
      },
    );
    const weekArc = { beats: beats7(), anchors };
    const catalog = [
      ...dishes,
      rot('repitePatron', { plateType: 'p1', tempFeel: 'frio', momento: ['comida'] }),
      rot('rompePatron', { plateType: 'p2', tempFeel: 'caliente', momento: ['comida'] }),
    ];
    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v7-b' });
    const miercoles = slots.find((s) => s.day === 'Miercoles' && s.momento === 'comida');
    expect(miercoles.dishId).toBe('rompePatron');
    const entry = decisionLog.find((d) => d.day === 'Miercoles' && d.momento === 'comida');
    expect(entry.evidencia).toContain('preferencia B aplicada');
  });

  it('sin alternativa -> se selecciona igual, log registra imposibilidad de B', () => {
    const { anchors, dishes } = anchorEverythingExcept(
      [{ day: 'Miercoles', momento: 'comida' }],
      {
        'Lunes::comida': { tempFeel: 'frio' },
        'Martes::comida': { tempFeel: 'frio' },
      },
    );
    const weekArc = { beats: beats7(), anchors };
    const catalog = [
      ...dishes,
      rot('miercolesComidaA', { plateType: 'p3', tempFeel: 'frio', momento: ['comida'] }),
      rot('miercolesComidaB', { plateType: 'p4', tempFeel: 'frio', momento: ['comida'] }),
    ];
    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v7-imposible' });
    const entry = decisionLog.find((d) => d.day === 'Miercoles' && d.momento === 'comida');
    expect(entry.evidencia).toContain('preferencia B satisfecha por imposibilidad');
  });
});

describe('runWalk - v8: prioridad A sobre B (A restringe, B queda satisfecha por imposibilidad sobre el resto)', () => {
  it('el elegido respeta A (plateType distinto de ayer) aunque B no pueda discriminar mas', () => {
    // Lunes y Martes (anclas) fuerzan una racha de tempFeel "frio" en comida, y Martes fija
    // plateType="pAyer". Para Miercoles/comida:
    // - candidatoX: plateType="pAyer" (falla A) y tempFeel "caliente" (pasaria B solo).
    // - candidatoY: plateType distinto (pasa A) y tempFeel "frio" (fallaria B en solitario).
    // Tras aplicar A primero, el pool post-A = {candidatoY}. B se evalua SOLO sobre ese
    // conjunto: eliminarlo lo dejaria vacio -> imposibilidad -> gana candidatoY (el que respeta A).
    const { anchors, dishes } = anchorEverythingExcept(
      [{ day: 'Miercoles', momento: 'comida' }],
      {
        'Lunes::comida': { tempFeel: 'frio' },
        'Martes::comida': { tempFeel: 'frio', plateType: 'pAyer' },
      },
    );
    const weekArc = { beats: beats7(), anchors };
    const catalog = [
      ...dishes,
      rot('candidatoX', { plateType: 'pAyer', tempFeel: 'caliente', momento: ['comida'] }),
      rot('candidatoY', { plateType: 'pDistinto', tempFeel: 'frio', momento: ['comida'] }),
    ];
    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v8-prioridad' });
    const miercoles = slots.find((s) => s.day === 'Miercoles' && s.momento === 'comida');
    expect(miercoles.dishId).toBe('candidatoY');
    const entry = decisionLog.find((d) => d.day === 'Miercoles' && d.momento === 'comida');
    expect(entry.evidencia).toContain('preferencia A aplicada');
    expect(entry.evidencia).toContain('preferencia B satisfecha por imposibilidad');
  });
});

describe('runWalk - v9: determinismo pleno (misma seed -> plan y log byte-identicos)', () => {
  it('semana real, dos ejecuciones', () => {
    const catalog = loadCatalog();
    const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Lunes'] }, seed: 42, strategy: 'volumen_limpio' });
    const r1 = runWalk({ weekArc, catalog, seed: 42 });
    const r2 = runWalk({ weekArc, catalog, seed: 42 });
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

describe('runWalk - v10 (EL CENTRAL): el RNG solo desempata entre equivalentes; nunca reintroduce descartados', () => {
  it('caso construido: 1 hueco con desempate garantizado + 1 hueco determinado por reglas; dos seeds distintas solo difieren en el de desempate', () => {
    // Todo el resto de la semana esta anclado (aislamiento total de pool). Quedan abiertos
    // exactamente Martes/comida (empate real: 2 candidatos indistinguibles por A/B) y
    // Miercoles/comida (determinado por reglas: A descarta al candidato que repite el
    // plateType del ancla de Martes/comida, dejando un unico superviviente SIEMPRE, sin
    // importar cual de los dos empatados gano el dia anterior -- ambos comparten plateType).
    // Lunes (ancla) fija plateType="otro": eso excluye a "rompeEmpate" (mismo plateType) del
    // empate de Martes via preferencia A, dejando el empate genuino limpio entre {tieA, tieB}
    // (idéntico plateType/tempFeel entre si, distinto del de Lunes). Quien gane Martes es
    // SIEMPRE plateType="empate" (tieA y tieB comparten ese valor) -> en Miercoles, A descarta
    // de nuevo por plateType="empate" y el unico superviviente es "rompeEmpate", sin importar
    // cual de los dos empatados gano el dia anterior.
    const { anchors, dishes } = anchorEverythingExcept([
      { day: 'Martes', momento: 'comida' },
      { day: 'Miercoles', momento: 'comida' },
    ], {
      'Lunes::comida': { plateType: 'otro' },
    });
    const weekArc = { beats: beats7(), anchors };
    const catalog = [
      ...dishes,
      rot('tieA', { plateType: 'empate', tempFeel: 'templado', momento: ['comida'] }),
      rot('tieB', { plateType: 'empate', tempFeel: 'templado', momento: ['comida'] }),
      rot('rompeEmpate', { plateType: 'otro', tempFeel: 'caliente', momento: ['comida'] }),
    ];

    const resultadosMartes = new Set();
    let miercolesConsistente = true;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { slots } = runWalk({ weekArc, catalog, seed });
      const martes = slots.find((s) => s.day === 'Martes' && s.momento === 'comida');
      const miercoles = slots.find((s) => s.day === 'Miercoles' && s.momento === 'comida');
      if (miercoles.dishId !== 'rompeEmpate') miercolesConsistente = false;
      resultadosMartes.add(martes.dishId);
    }
    expect(miercolesConsistente).toBe(true);
    expect(resultadosMartes.size).toBe(2);
    expect([...resultadosMartes].sort()).toEqual(['tieA', 'tieB']);
  });
});

describe('runWalk - v11: decisionLog — 14 entradas de relleno + eventos preservados', () => {
  it('colision_sin_hueco (evento de P1a) se conserva, no se descarta', () => {
    // Fixture de colision (mismo patron que expandWeekArc v5): dishE se descarta en Sabado.
    const weekArc = {
      beats: beats7(),
      anchors: [
        { anchorId: 'dishF', cookDay: 'Viernes', leftoverDays: ['Sabado'] },
        { anchorId: 'dishE', cookDay: 'Domingo', leftoverDays: ['Sabado'] },
      ],
    };
    const catalog = [
      { ...rot('dishF'), rol: 'ancla', momento: ['comida'] },
      { ...rot('dishE'), rol: 'ancla', momento: ['comida'] },
      ...genRotativos(20),
    ];
    const { decisionLog } = runWalk({ weekArc, catalog, seed: 3 });
    const evento = decisionLog.find((d) => d.causa === 'colision_sin_hueco');
    expect(evento).toBeDefined();
    expect(evento.evento).toBe(true);
    expect(evento.evidencia).toContain('dishE');

    const rellenos = decisionLog.filter((d) => !d.evento);
    expect(rellenos).toHaveLength(14);
  });

  it('energiaCocina solo presente en entradas seleccionadas (no en las heredadas de P1a)', () => {
    const weekArc = {
      beats: beats7({ Lunes: { slotRole: 'ancla', anchorRef: 'anclaX' } }),
      anchors: [{ anchorId: 'anclaX', cookDay: 'Lunes', leftoverDays: [] }],
    };
    const catalog = [{ ...rot('anclaX'), rol: 'ancla', momento: ['comida'], energiaCocina: 'alto' }, ...genRotativos(20)];
    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v11-energia' });
    const p1aEntry = decisionLog.find((d) => d.plato === 'anclaX');
    const seleccionEntry = decisionLog.find((d) => d.day === 'Lunes' && d.momento === 'cena');
    expect('energiaCocina' in p1aEntry).toBe(false);
    expect(typeof seleccionEntry.energiaCocina).toBe('string');
  });
});

describe('runWalk - v12: energiaCocina no participa en la seleccion', () => {
  it('dos catalogos identicos salvo energiaCocina -> misma seleccion', () => {
    const weekArc = { beats: beats7(), anchors: [] };
    const base = genRotativos(20);
    const catalogBajo = base.map((d) => ({ ...d, energiaCocina: 'bajo' }));
    const catalogAlto = base.map((d) => ({ ...d, energiaCocina: 'alto' }));
    const r1 = runWalk({ weekArc, catalog: catalogBajo, seed: 99 });
    const r2 = runWalk({ weekArc, catalog: catalogAlto, seed: 99 });
    expect(r1.slots.map((s) => s.dishId)).toEqual(r2.slots.map((s) => s.dishId));
  });
});

describe('runWalk - v14: vetos duros (P2b-i, paso 2 del walk, D-022)', () => {
  const catalogReal = loadCatalog();
  const dishGlutenTrue = catalogReal.find((d) => {
    if (d.rol !== 'rotativo' || !d.momento.includes('comida')) return false;
    const v = resolveDishComposition(d);
    return v.origen === 'freeform' && v.containsGluten.estado === 'conocida' && v.containsGluten.valor === true;
  });
  const dishGlutenFalse = catalogReal.find((d) => {
    if (d.rol !== 'rotativo' || !d.momento.includes('comida')) return false;
    const v = resolveDishComposition(d);
    return v.origen === 'freeform' && v.containsGluten.estado === 'conocida' && v.containsGluten.valor === false;
  });
  const dishScaffoldDesconocida = catalogReal.find((d) => d.rol === 'rotativo' && d.momento.includes('comida') && resolveDishComposition(d).origen === 'scaffold');

  it('fixtures reales localizadas: freeform gluten=true, freeform gluten=false, scaffold (desconocida)', () => {
    expect(dishGlutenTrue).toBeDefined();
    expect(dishGlutenFalse).toBeDefined();
    expect(dishScaffoldDesconocida).toBeDefined();
  });

  it('f13+f15: el vetado (por valor) y el vetado (por desconocida, fail-closed) no aparecen en ninguna colocacion; el libre los ocupa; log de universo una vez, con conteo por campo/motivo', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Lunes', momento: 'comida' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalogoAislado = [...dishes, dishGlutenTrue, dishGlutenFalse, dishScaffoldDesconocida];
    const profile = { intolerances: ['gluten'] };
    const { slots, decisionLog } = runWalk({ weekArc, catalog: catalogoAislado, seed: 'v14-valor-y-desconocida', profile });

    const lunesComida = slots.find((s) => s.day === 'Lunes' && s.momento === 'comida');
    expect(lunesComida.dishId).toBe(dishGlutenFalse.id);
    expect(slots.some((s) => s.dishId === dishGlutenTrue.id)).toBe(false);
    expect(slots.some((s) => s.dishId === dishScaffoldDesconocida.id)).toBe(false);

    const eventos = decisionLog.filter((d) => d.causa === 'veto_universo_reducido');
    expect(eventos).toHaveLength(1);
    expect(eventos[0].evento).toBe(true);
    expect(eventos[0].evidencia).toContain('gluten');
    expect(eventos[0].evidencia).toContain('2 platos');
    expect(eventos[0].evidencia).toContain('1 por valor');
    expect(eventos[0].evidencia).toContain('1 por desconocida');

    const entradaColocada = decisionLog.find((d) => d.plato === dishGlutenFalse.id);
    expect(entradaColocada.causa.startsWith('seleccion_rotativo_') || entradaColocada.causa.length > 0).toBe(true);
  });

  it('sin intolerances (perfil ausente o vacio): ambos candidatos siguen disponibles, sin log de universo (sin regresion)', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Miercoles', momento: 'comida' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalogoAislado = [...dishes, dishGlutenTrue, dishGlutenFalse];
    const { decisionLog } = runWalk({ weekArc, catalog: catalogoAislado, seed: 'v14-sin-veto' });
    expect(decisionLog.find((d) => d.causa === 'veto_universo_reducido')).toBeUndefined();
  });

  it('con intolerances=["lactosa"] (campo distinto), el vetado por gluten sigue disponible: el veto es por campo, no global', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Jueves', momento: 'comida' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalogoAislado = [...dishes, dishGlutenTrue];
    const profile = { intolerances: ['lactosa'] };
    const { slots } = runWalk({ weekArc, catalog: catalogoAislado, seed: 'v14-lactosa-no-toca-gluten', profile });
    const juevesComida = slots.find((s) => s.day === 'Jueves' && s.momento === 'comida');
    expect(juevesComida.dishId).toBe(dishGlutenTrue.id);
  });
});

describe('runWalk - v13: MemoryStore inyectado nunca se invoca', () => {
  it('store cuyos metodos lanzan -> runWalk no lanza', () => {
    const catalog = loadCatalog();
    const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed: 5, strategy: 'x' });
    const memoryStore = {
      getWeek() { throw new Error('getWeek no deberia invocarse'); },
      saveWeek() { throw new Error('saveWeek no deberia invocarse'); },
      getRepertoire() { throw new Error('getRepertoire no deberia invocarse'); },
      recordFeedback() { throw new Error('recordFeedback no deberia invocarse'); },
    };
    expect(() => runWalk({ weekArc, catalog, seed: 5, memoryStore })).not.toThrow();
  });
});
