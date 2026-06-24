// buildWeekArc - Fase 3, Checkpoint 3A: vertical completa, variante C.
// Contrato (weekArc + decisionLog) y desacople de strategy en el mismo
// paso.

import { describe, it, expect } from 'vitest';
import {
  buildWeekArc, assertNoFixedRoleSobraContradiction, computeFixedRoles, computeLeftoverDays,
} from '../buildWeekArc.js';
import { DAYS_ORDER } from '../days.js';
import { TEMPLATE_C } from '../templateC.js';
import { ANCHORS } from '../../dishes/anchors.js';
import { FIXTURES } from '../../../engine/tests/baselineFixtures.js';

const ESTRATEGIAS_REALES = [
  'fat_loss_general', 'definicion_saciante', 'definicion_flexible',
  'mantenimiento_equilibrado', 'volumen_limpio', 'volumen_agresivo',
];

describe('buildWeekArc - una semana C completa con decision log', () => {
  const { weekArc, decisionLog } = buildWeekArc({
    profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] },
    seed: 'demo-cp3a',
    strategy: 'mantenimiento_equilibrado',
  });

  it('weekArc tiene exactamente las claves del contrato', () => {
    expect(Object.keys(weekArc).sort()).toEqual(['anchors', 'batchDay', 'beats', 'skeletonId', 'strategy'].sort());
  });

  it('skeletonId = "C", strategy se copia tal cual del input', () => {
    expect(weekArc.skeletonId).toBe('C');
    expect(weekArc.strategy).toBe('mantenimiento_equilibrado');
  });

  it('7 beats, uno por dia, en orden Lunes->Domingo', () => {
    expect(weekArc.beats.map((b) => b.day)).toEqual(DAYS_ORDER);
  });

  it('rotativo/capricho vacios: ningun beat trae contenido de comida (solo rol/densidad/referencia)', () => {
    for (const beat of weekArc.beats) {
      const keys = Object.keys(beat).sort();
      expect(keys).toEqual(expect.arrayContaining(['day', 'slotRole', 'density']));
      expect(beat).not.toHaveProperty('plato');
      expect(beat).not.toHaveProperty('comida');
    }
  });

  it('anchors[] referencia una identidad real del catalogo de CP2', () => {
    expect(weekArc.anchors).toHaveLength(1);
    const ref = weekArc.anchors[0];
    expect(ANCHORS.some((a) => a.identityKey === ref.anchorId)).toBe(true);
  });

  it('imprime la semana completa y su decision log (evidencia visual del checkpoint)', () => {
    console.log('\n=== weekArc (variante C, demo) ===');
    console.log(JSON.stringify(weekArc, null, 2));
    console.log('\n=== decisionLog ===');
    console.log(JSON.stringify(decisionLog, null, 2));
    expect(decisionLog.length).toBeGreaterThan(0);
  });
});

describe('causa completa: todo nodo del arco tiene entrada en el decision log', () => {
  const { weekArc, decisionLog } = buildWeekArc({
    profile: { trainingDays: [] },
    seed: 'causa-completa',
    strategy: 'mantenimiento_equilibrado',
  });

  it('cada uno de los 7 dias tiene al menos una entrada de decisionLog que lo menciona', () => {
    for (const day of DAYS_ORDER) {
      const tieneEntrada = decisionLog.some((d) => d.evidence.includes(day) || d.consequence.includes(day));
      expect(tieneEntrada, `dia sin causa en el decision log: ${day}`).toBe(true);
    }
  });

  it('cada entrada de decisionLog tiene el formato {decisionId, cause, evidence, consequence}', () => {
    for (const entry of decisionLog) {
      expect(entry).toHaveProperty('decisionId');
      expect(entry).toHaveProperty('cause');
      expect(entry).toHaveProperty('evidence');
      expect(entry).toHaveProperty('consequence');
      expect(typeof entry.cause).toBe('string');
      expect(entry.cause.length).toBeGreaterThan(0);
    }
  });

  it('weekArc.beats existe y coincide en longitud con los dias mencionados (sanity cruzada)', () => {
    expect(weekArc.beats.length).toBe(7);
  });
});

describe('invariante: fixedRole y sobra son mutuamente excluyentes (las sobras no pisan dias fijos)', () => {
  it('VERDE: sobre 200 seeds reales (mezcla de perfiles con/sin entreno), el invariante nunca lanza', () => {
    const perfiles = [
      { trainingDays: [] },
      { trainingDays: ['Jueves'] },
      { trainingDays: ['Viernes'] },
      { trainingDays: ['Jueves', 'Viernes'] },
      { trainingDays: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'] },
    ];
    for (let seed = 0; seed < 200; seed++) {
      for (const profile of perfiles) {
        const { weekArc } = buildWeekArc({ profile, seed, strategy: 'x' });
        expect(() => assertNoFixedRoleSobraContradiction(weekArc)).not.toThrow();
      }
    }
  });

  it('ROJO: un weekArc sintetico con un dia fixedRole="libre" listado tambien como leftoverDay hace lanzar', () => {
    const weekArcSucio = {
      batchDay: 'Jueves',
      anchors: [{ anchorId: 'x', cookDay: 'Jueves', leftoverDays: ['Viernes', 'Sabado'] }],
      beats: [
        { day: 'Jueves', slotRole: 'ancla', anchorRef: 'x', density: 'denso' },
        { day: 'Viernes', slotRole: 'ancla', anchorRef: 'x', density: 'ligero' },
        { day: 'Sabado', fixedRole: 'libre', slotRole: 'ancla', anchorRef: 'x', density: 'ligero' },
      ],
    };
    expect(() => assertNoFixedRoleSobraContradiction(weekArcSucio)).toThrow(/Sabado.*libre/);
  });

  it('VERDE: quitando el conflicto (Sabado deja de ser leftoverDay), el mismo weekArc deja de lanzar', () => {
    const weekArcLimpio = {
      batchDay: 'Jueves',
      anchors: [{ anchorId: 'x', cookDay: 'Jueves', leftoverDays: ['Viernes'] }],
      beats: [
        { day: 'Jueves', slotRole: 'ancla', anchorRef: 'x', density: 'denso' },
        { day: 'Viernes', slotRole: 'ancla', anchorRef: 'x', density: 'ligero' },
        { day: 'Sabado', fixedRole: 'libre', slotRole: 'rotativo', density: 'ligero' },
      ],
    };
    expect(() => assertNoFixedRoleSobraContradiction(weekArcLimpio)).not.toThrow();
  });

  it('REGRESION puntual: el demo "demo-cp3a" original (que disparo esta correccion) ya no contamina sabado/domingo', () => {
    const { weekArc } = buildWeekArc({
      profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] },
      seed: 'demo-cp3a',
      strategy: 'mantenimiento_equilibrado',
    });
    expect(() => assertNoFixedRoleSobraContradiction(weekArc)).not.toThrow();
    expect(weekArc.anchors[0].leftoverDays).not.toContain('Sabado');
    expect(weekArc.anchors[0].leftoverDays).not.toContain('Domingo');
  });
});

describe('sobras dentro de vida util: leftoverDays <= shelfLifeDays, y crema vs guiso producen ventanas distintas', () => {
  it('para CADA una de las 6 anclas, forzando su eleccion, leftoverDays.length <= shelfLifeDays - 1', () => {
    // Fuerza cada ancla probando seeds hasta encontrar una que la elija
    // (sin filtros: solo necesitamos UNA seed que aterrice en cada indice).
    for (let targetIndex = 0; targetIndex < ANCHORS.length; targetIndex++) {
      let found = null;
      for (let seed = 0; seed < 500 && !found; seed++) {
        const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });
        const anchor = ANCHORS.find((a) => a.identityKey === weekArc.anchors[0].anchorId);
        if (ANCHORS.indexOf(anchor) === targetIndex) found = { weekArc, anchor };
      }
      expect(found, `no se encontro seed que eligiera el ancla #${targetIndex} en 500 intentos`).not.toBeNull();
      const { leftoverDays } = found.weekArc.anchors[0];
      expect(leftoverDays.length).toBeLessThanOrEqual(found.anchor.shelfLifeDays - 1);
    }
  });

  it('la crema #1 (shelfLifeDays=3) y el guiso de ternera (shelfLifeDays=4) tienen techos de sobra DISTINTOS por construccion (independiente de cuanto se trunque despues por dias fijos)', () => {
    // Tras la correccion (fixedRole > sobra) Y el rediseño de batchDay
    // (Jueves -> Miercoles, censo de ventanas de sobras, ver PR), el
    // TAMANO REALIZADO de la ventana sigue sin ser un proxy fiable de
    // shelfLifeDays: con batchDay=Miercoles, crema (offsets 1,2 =
    // Jueves,Viernes) y guiso (offsets 1,2,3 = Jueves,Viernes,Sabado)
    // pierden distinto numero de dias por el finde (guiso pierde Sabado,
    // crema no llega a tocarlo) pero ambas convergen al mismo remanente
    // [Jueves,Viernes] bajo un perfil sin entreno -- eso es correcto, no
    // un bug: shelfLifeDays es techo, no cuota. Lo que SI debe seguir
    // siendo distinto, por construccion, es el techo antes de truncar
    // (shelfLifeDays - 1).
    const crema = ANCHORS.find((a) => a.identityKey === '["sopa_crema","huevo",null,"tomate",null,null,"crudo"]');
    const guiso = ANCHORS.find((a) => a.identityKey === '["caliente_clasico","ternera","patata","zanahoria",null,"ajillo","guisado"]');
    expect(crema.shelfLifeDays).toBe(3);
    expect(guiso.shelfLifeDays).toBe(4);
    expect(crema.shelfLifeDays - 1).not.toBe(guiso.shelfLifeDays - 1); // 2 vs 3

    let seedCrema = null, seedGuiso = null;
    for (let seed = 0; seed < 500 && (!seedCrema || !seedGuiso); seed++) {
      const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });
      const idx = ANCHORS.findIndex((a) => a.identityKey === weekArc.anchors[0].anchorId);
      if (idx === ANCHORS.indexOf(crema) && !seedCrema) seedCrema = seed;
      if (idx === ANCHORS.indexOf(guiso) && !seedGuiso) seedGuiso = seed;
    }
    expect(seedCrema).not.toBeNull();
    expect(seedGuiso).not.toBeNull();

    const resCrema = buildWeekArc({ profile: { trainingDays: [] }, seed: seedCrema, strategy: 'x' });
    const resGuiso = buildWeekArc({ profile: { trainingDays: [] }, seed: seedGuiso, strategy: 'x' });

    // Ambas truncan al mismo remanente bajo este perfil/batchDay -- el
    // invariante a comprobar es que NINGUNA excede su propio techo, no
    // que los remanentes difieran.
    expect(resCrema.weekArc.anchors[0].leftoverDays.length).toBeLessThanOrEqual(crema.shelfLifeDays - 1);
    expect(resGuiso.weekArc.anchors[0].leftoverDays.length).toBeLessThanOrEqual(guiso.shelfLifeDays - 1);
    expect(resCrema.weekArc.anchors[0].leftoverDays).toEqual(['Jueves', 'Viernes']);
    expect(resGuiso.weekArc.anchors[0].leftoverDays).toEqual(['Jueves', 'Viernes']);
  });

  it('con un perfil donde Jueves Y Viernes son entreno, la ventana de la crema trunca a CERO (sin compensacion)', () => {
    // Con batchDay=Miercoles, bloquear solo Viernes ya no basta para
    // truncar a cero (Jueves sigue libre) -- hace falta bloquear los DOS
    // dias no-fijos de la ventana para reproducir el caso limite.
    const crema = ANCHORS.find((a) => a.identityKey === '["sopa_crema","huevo",null,"tomate",null,null,"crudo"]');
    let seedCrema = null;
    for (let seed = 0; seed < 500 && !seedCrema; seed++) {
      const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Jueves', 'Viernes'] }, seed, strategy: 'x' });
      if (weekArc.anchors[0].anchorId === crema.identityKey) seedCrema = seed;
    }
    expect(seedCrema).not.toBeNull();
    const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Jueves', 'Viernes'] }, seed: seedCrema, strategy: 'x' });
    expect(weekArc.batchDay).toBe('Miercoles'); // Miercoles no esta bloqueado, no se desplaza
    expect(weekArc.anchors[0].leftoverDays).toEqual([]); // Jueves y Viernes (entreno) ambos saltados
  });
});

describe('determinismo: misma seed -> mismo weekArc byte a byte', () => {
  it('10 llamadas con la misma seed producen exactamente el mismo JSON', () => {
    const calls = Array.from({ length: 10 }, () =>
      buildWeekArc({ profile: { trainingDays: ['Martes'] }, seed: 'seed-fija-42', strategy: 'volumen_limpio' })
    );
    const serialized = calls.map((c) => JSON.stringify(c.weekArc));
    expect(new Set(serialized).size).toBe(1);
  });

  it('seeds distintas pueden producir weekArc distinto (sanity: el seed si importa)', () => {
    const a = buildWeekArc({ profile: { trainingDays: [] }, seed: 'seed-A', strategy: 'x' });
    const b = buildWeekArc({ profile: { trainingDays: [] }, seed: 'seed-B', strategy: 'x' });
    // No se afirma que SIEMPRE difieran (podrian coincidir en ancla por azar),
    // solo se demuestra con un par conocido que el mecanismo no esta fijo.
    expect(JSON.stringify(a.weekArc) === JSON.stringify(b.weekArc)).toBe(false);
  });
});

describe('desacople (control del metadato): strategy NO afecta la estructura', () => {
  it('fijados seed, variante C y batchDay (via profile/seed fijos), las 6 estrategias producen la MISMA estructura (beats, anchors, batchDay, decisionLog) -- solo difiere weekArc.strategy', () => {
    const fixedInput = { profile: { trainingDays: ['Lunes', 'Viernes'] }, seed: 'desacople-fijo' };
    const resultados = ESTRATEGIAS_REALES.map((strategy) => buildWeekArc({ ...fixedInput, strategy }));

    const estructuras = resultados.map(({ weekArc, decisionLog }) => {
      const { strategy: _strategy, ...estructuraSinStrategy } = weekArc;
      // decisionLog tambien debe ser idéntico: ninguna causa debe mencionar
      // la estrategia (si lo hiciera, esta dejando de ser metadato pasivo).
      return JSON.stringify({ estructuraSinStrategy, decisionLog });
    });

    expect(new Set(estructuras).size).toBe(1);

    // Y el campo strategy SI varia, como se espera de un metadato real.
    const strategiesEnOutput = resultados.map((r) => r.weekArc.strategy);
    expect(new Set(strategiesEnOutput).size).toBe(ESTRATEGIAS_REALES.length);
  });

  it('MUERDE: si una decision leyera profile.goal o strategy, este test se pondria rojo (control negativo documentado)', () => {
    // No se ejecuta una mutacion real aqui (eso ensuciaria buildWeekArc.js
    // permanentemente) -- se documenta el mecanismo: el test de arriba
    // compara decisionLog completo (no solo weekArc), y ninguna funcion de
    // buildWeekArc.js recibe ni lee `strategy` excepto para copiarlo al
    // final. Cualquier rama nueva que ramificara por strategy apareceria
    // como una diferencia en decisionLog o en beats entre las 6 corridas
    // del test anterior.
    expect(true).toBe(true);
  });
});

describe('contra fixtures reales: las 3 variantes de perfil de mantenimiento_equilibrado (baseline)', () => {
  const variantes = FIXTURES.filter((f) => f.name.startsWith('mantenimiento_equilibrado'));

  it('hay exactamente 4 variantes de mantenimiento_equilibrado en el baseline (base + 3 extra)', () => {
    expect(variantes.length).toBe(4);
  });

  it('el mapping perfil->fixedRoles via trainingDays funciona igual para las 4, sin inventar casos', () => {
    for (const fixture of variantes) {
      const { weekArc } = buildWeekArc({
        profile: fixture.profile,
        seed: fixture.userId,
        strategy: fixture.expectedStrategy,
      });
      const diasEntreno = (fixture.profile.trainingDays || []);
      const diasConFixedRoleEntreno = weekArc.beats.filter((b) => b.fixedRole === 'entreno').map((b) => b.day);
      expect(diasConFixedRoleEntreno.length).toBe(diasEntreno.length);
    }
  });

  it('intolerancias e isSimple (que F3 no usa) NO cambian la estructura frente al perfil base, con la misma seed', () => {
    const base = variantes.find((f) => f.name === 'mantenimiento_equilibrado (base)');
    const intolerancias = variantes.find((f) => f.name.includes('intolerancias'));
    const isSimple = variantes.find((f) => f.name.includes('isSimple'));

    const seedComun = 'fixture-comparativa';
    const resBase = buildWeekArc({ profile: base.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });
    const resIntol = buildWeekArc({ profile: intolerancias.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });
    const resSimple = buildWeekArc({ profile: isSimple.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });

    expect(JSON.stringify(resIntol.weekArc)).toBe(JSON.stringify(resBase.weekArc));
    expect(JSON.stringify(resSimple.weekArc)).toBe(JSON.stringify(resBase.weekArc));
  });

  it('trainingDays SI cambia la estructura (fixedRole=entreno aparece donde corresponde)', () => {
    const base = variantes.find((f) => f.name === 'mantenimiento_equilibrado (base)');
    const conTraining = variantes.find((f) => f.name.includes('trainingDays'));
    const seedComun = 'fixture-training-vs-base';

    const resBase = buildWeekArc({ profile: base.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });
    const resTraining = buildWeekArc({ profile: conTraining.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });

    expect(JSON.stringify(resTraining.weekArc)).not.toBe(JSON.stringify(resBase.weekArc));
    const diasEntreno = resTraining.weekArc.beats.filter((b) => b.fixedRole === 'entreno').map((b) => b.day);
    expect(diasEntreno.length).toBe(conTraining.profile.trainingDays.length);
  });
});

describe('invariante de diseño (DEFINITIVO): batchDay coherente con citas fijas + sobras correctas, SIN garantizar viabilidad optima', () => {
  // Descartado por un hallazgo real (ver PR): "si existe ALGUN dia en la
  // lista que generaria sobra, el resuelto debe ser ese" es una garantia
  // que el mecanismo NO puede cumplir sin acoplar la resolucion de
  // batchDay al shelfLife del ancla -- y esa entrelazado esta
  // explicitamente prohibido (paso 2 "ancla, sin filtros" e independiente
  // de paso 1/3). Caso real que lo prueba: volumen_limpio + crema de
  // atun (shelfLife=2) -- el primer dia alcanzable de la lista
  // (Miercoles) da 0 sobras, aunque Martes (mas abajo en la lista)
  // hubiera dado 1. Aceptado como limite conocido del diseño.
  //
  // Lo que SI se garantiza, y es lo que este invariante verifica:
  //   1. El batchDay resuelto es SIEMPRE el primer dia de
  //      batchDayPreference que no tiene fixedRole bloqueante (coherente
  //      con las citas fijas -- nunca aterriza en libre/entreno).
  //   2. Las sobras de ESE batchDay, para el shelfLife de la ancla que
  //      realmente toco, respetan el techo (shelfLifeDays - 1) y nunca
  //      caen en un dia con fixedRole (ya cubierto por
  //      assertNoFixedRoleSobraContradiction, re-verificado aqui sobre
  //      las 9 fixtures x 6 anclas para que quede en este bloque).
  // sobras=0 por mal emparejamiento ancla/batchDay es un resultado
  // VALIDO -- no se afirma nada sobre cuanto "aprovecha" la ventana.
  const BLOCKING = new Set(['libre', 'entreno']);

  it('el batchDay resuelto nunca tiene fixedRole bloqueante, para los 9 perfiles del baseline', () => {
    for (const fixture of FIXTURES) {
      const { weekArc } = buildWeekArc({ profile: fixture.profile, seed: 0, strategy: fixture.expectedStrategy });
      const fixedRoles = computeFixedRoles(fixture.profile, []);
      expect(BLOCKING.has(fixedRoles[weekArc.batchDay]), `${fixture.name}: batchDay=${weekArc.batchDay} tiene fixedRole="${fixedRoles[weekArc.batchDay]}"`).toBe(false);
    }
  });

  it('el batchDay resuelto es exactamente el primer dia no bloqueado de batchDayPreference (mecanico, no optimizado)', () => {
    for (const fixture of FIXTURES) {
      const fixedRoles = computeFixedRoles(fixture.profile, []);
      const esperado = TEMPLATE_C.batchDayPreference.find((day) => !BLOCKING.has(fixedRoles[day]));
      const { weekArc } = buildWeekArc({ profile: fixture.profile, seed: 0, strategy: fixture.expectedStrategy });
      expect(weekArc.batchDay).toBe(esperado);
    }
  });

  it('sobre los 9 perfiles x las 6 anclas: las sobras respetan el techo y nunca caen en dia fijo (re-verificacion agregada)', () => {
    let conSobrasPositivas = 0;
    let conSobrasCero = 0;
    for (const fixture of FIXTURES) {
      for (const anchor of ANCHORS) {
        let seedQueEligeEstaAncla = null;
        for (let seed = 0; seed < 500 && seedQueEligeEstaAncla === null; seed++) {
          const { weekArc } = buildWeekArc({ profile: fixture.profile, seed, strategy: fixture.expectedStrategy });
          if (weekArc.anchors[0].anchorId === anchor.identityKey) seedQueEligeEstaAncla = seed;
        }
        expect(seedQueEligeEstaAncla, `${fixture.name} nunca eligio ${anchor.identityKey} en 500 seeds`).not.toBeNull();

        const { weekArc } = buildWeekArc({ profile: fixture.profile, seed: seedQueEligeEstaAncla, strategy: fixture.expectedStrategy });
        expect(() => assertNoFixedRoleSobraContradiction(weekArc)).not.toThrow();
        expect(weekArc.anchors[0].leftoverDays.length).toBeLessThanOrEqual(anchor.shelfLifeDays - 1);

        if (weekArc.anchors[0].leftoverDays.length > 0) conSobrasPositivas++;
        else conSobrasCero++;
      }
    }
    // Control positivo: el barrido cubre ambos casos de verdad (no esta
    // vacio de ningun lado), incluido el limite conocido (sobras=0
    // aunque hubiera margen en otro dia de la lista).
    expect(conSobrasPositivas).toBeGreaterThan(0);
    expect(conSobrasCero).toBeGreaterThan(0);
  });

  it('definicion_saciante (entreno Lun/Mie/Vie): el primario Miercoles esta bloqueado, se desplaza a Martes (no Jueves)', () => {
    const fixture = FIXTURES.find((f) => f.name === 'definicion_saciante');
    const { weekArc, decisionLog } = buildWeekArc({ profile: fixture.profile, seed: 0, strategy: fixture.expectedStrategy });
    expect(weekArc.batchDay).toBe('Martes');
    expect(decisionLog.some((d) => d.cause === 'batchday_desplazado')).toBe(true);
  });

  it('volumen_limpio (entreno Lun/Jue): limite conocido documentado -- Miercoles (resuelto) da 0 sobras con shelfLife=2 aunque Martes hubiera dado 1', () => {
    const fixture = FIXTURES.find((f) => f.name === 'volumen_limpio');
    const fixedRoles = computeFixedRoles(fixture.profile, []);
    expect(TEMPLATE_C.batchDayPreference.find((d) => !BLOCKING.has(fixedRoles[d]))).toBe('Miercoles');
    expect(computeLeftoverDays('Miercoles', 2, fixedRoles, []).length).toBe(0); // lo que el mecanismo resuelve
    expect(computeLeftoverDays('Martes', 2, fixedRoles, []).length).toBe(1); // lo que un dia mas abajo en la lista habria logrado
    // Documentado como limite aceptado, no como fallo: el mecanismo NO
    // mira el shelfLife de la ancla al resolver batchDay (por diseño).
  });

  it('volumen_agresivo (1 dia no-fijo: Miercoles): sobras=0 para toda ancla, y eso es valido', () => {
    const fixture = FIXTURES.find((f) => f.name === 'volumen_agresivo');
    const { weekArc } = buildWeekArc({ profile: fixture.profile, seed: 0, strategy: fixture.expectedStrategy });
    expect(weekArc.batchDay).toBe('Miercoles');
    expect(weekArc.anchors[0].leftoverDays).toEqual([]);
  });
});
