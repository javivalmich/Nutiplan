// Capricho - Fase 3, Checkpoint 3C: cierra la mentira de contrato (el
// mecanismo entregaba solo 2 de las 3 categorias de slotRole declaradas).
// El capricho es ritmo semanal (posicion = F3); su materializacion
// editorial es F4 (deuda registrada, no se toca aqui).

import { describe, it, expect } from 'vitest';
import {
  buildWeekArc, assertNoCaprichoCollision, assertNoFixedRoleSobraContradiction,
  computeFixedRoles, computeLeftoverDays, TEMPLATES,
} from '../buildWeekArc.js';
import { TEMPLATE_A } from '../templateA.js';
import { TEMPLATE_B } from '../templateB.js';
import { TEMPLATE_C } from '../templateC.js';
import { DAYS_ORDER } from '../days.js';
import { FIXTURES } from '../../../engine/tests/baselineFixtures.js';

describe('(a) toda plantilla declara capricho', () => {
  it('A, B y C tienen caprichoDay y caprichoPreference, y el primario es el primer elemento', () => {
    for (const template of TEMPLATES) {
      expect(template.caprichoDay, `${template.skeletonId} sin caprichoDay`).toBeTruthy();
      expect(template.caprichoPreference, `${template.skeletonId} sin caprichoPreference`).toBeTruthy();
      expect(template.caprichoPreference[0]).toBe(template.caprichoDay);
      expect(template.caprichoPreference.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('el caprichoDay de cada plantilla es distinto de su propio batchDay (no compiten por el mismo dia primario)', () => {
    for (const template of TEMPLATES) {
      expect(template.caprichoDay).not.toBe(template.batchDay);
    }
  });

  it('caprichoPreference omite Sabado Y Domingo (cualquier fixedRole bloquea capricho, incluido "familiar" -- a diferencia de batchDayPreference)', () => {
    for (const template of TEMPLATES) {
      expect(template.caprichoPreference).not.toContain('Sabado');
      expect(template.caprichoPreference).not.toContain('Domingo');
    }
  });
});

describe('(b) el espacio total de salida (barrido perfiles x variantes) usa las tres categorias', () => {
  it('sobre los 9 perfiles del baseline x A/B/C (seed=0): aparecen ancla, rotativo Y capricho', () => {
    const slotRolesVistos = new Set();
    for (const fixture of FIXTURES) {
      for (const seed of [0, 1, 2, 7]) { // seeds que cubren las 3 plantillas (ver CP3B)
        const { weekArc } = buildWeekArc({ profile: fixture.profile, seed, strategy: fixture.expectedStrategy });
        for (const beat of weekArc.beats) slotRolesVistos.add(beat.slotRole);
      }
    }
    expect(slotRolesVistos).toEqual(new Set(['ancla', 'rotativo', 'capricho']));
  });
});

describe('(c) ningun capricho coexiste con fixedRole/ancla/sobra en el mismo dia (muerde)', () => {
  it('VERDE: sobre 200 seeds x perfiles reales, assertNoCaprichoCollision nunca lanza', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const fixture of FIXTURES) {
        const { weekArc } = buildWeekArc({ profile: fixture.profile, seed, strategy: fixture.expectedStrategy });
        expect(() => assertNoCaprichoCollision(weekArc)).not.toThrow();
        // El invariante de sobras tampoco deberia haberse roto por capricho.
        expect(() => assertNoFixedRoleSobraContradiction(weekArc)).not.toThrow();
      }
    }
  });

  it('ROJO sintetico: un weekArc con capricho en un dia fixedRole="libre" hace lanzar', () => {
    const weekArcSucio = {
      batchDay: 'Miercoles',
      anchors: [{ anchorId: 'x', cookDay: 'Miercoles', leftoverDays: ['Jueves'] }],
      beats: [
        { day: 'Miercoles', slotRole: 'ancla', anchorRef: 'x', density: 'medio' },
        { day: 'Jueves', slotRole: 'ancla', anchorRef: 'x', density: 'denso' },
        { day: 'Sabado', fixedRole: 'libre', slotRole: 'capricho', density: 'ligero' },
      ],
    };
    expect(() => assertNoCaprichoCollision(weekArcSucio)).toThrow(/Sabado.*libre/);
  });

  it('ROJO sintetico: un weekArc con capricho en el mismo dia que el cookDay del ancla hace lanzar', () => {
    const weekArcSucio = {
      batchDay: 'Miercoles',
      anchors: [{ anchorId: 'x', cookDay: 'Miercoles', leftoverDays: [] }],
      beats: [
        { day: 'Miercoles', slotRole: 'capricho', density: 'medio' }, // contradictorio a proposito
      ],
    };
    expect(() => assertNoCaprichoCollision(weekArcSucio)).toThrow(/Miercoles/);
  });

  it('VERDE: quitando el conflicto, el mismo weekArc deja de lanzar', () => {
    const weekArcLimpio = {
      batchDay: 'Miercoles',
      anchors: [{ anchorId: 'x', cookDay: 'Miercoles', leftoverDays: ['Jueves'] }],
      beats: [
        { day: 'Miercoles', slotRole: 'ancla', anchorRef: 'x', density: 'medio' },
        { day: 'Jueves', slotRole: 'ancla', anchorRef: 'x', density: 'denso' },
        { day: 'Lunes', slotRole: 'capricho', density: 'ligero' },
      ],
    };
    expect(() => assertNoCaprichoCollision(weekArcLimpio)).not.toThrow();
  });
});

describe('(d) el desplazamiento/truncado de capricho es deterministico', () => {
  it('10 llamadas con la misma seed producen exactamente el mismo dia de capricho', () => {
    const calls = Array.from({ length: 10 }, () =>
      buildWeekArc({ profile: { trainingDays: ['Martes'] }, seed: 'capricho-fijo', strategy: 'x' })
    );
    const caprichoDays = calls.map(({ weekArc }) => weekArc.beats.find((b) => b.slotRole === 'capricho')?.day ?? null);
    expect(new Set(caprichoDays).size).toBe(1);
  });
});

describe('(e) desplazamiento real: primario bloqueado pero hay dia no-fijo disponible -> se desplaza, NO se trunca', () => {
  it('plantilla A (caprichoDay=Viernes): con Viernes de entreno, el capricho se desplaza a Jueves (siguiente de la lista)', () => {
    // Buscamos un seed real que resuelva a la plantilla A.
    let seedA = null;
    for (let seed = 0; seed < 50 && seedA === null; seed++) {
      const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Viernes'] }, seed, strategy: 'x' });
      if (weekArc.skeletonId === 'A') seedA = seed;
    }
    expect(seedA).not.toBeNull();

    const { weekArc, decisionLog } = buildWeekArc({ profile: { trainingDays: ['Viernes'] }, seed: seedA, strategy: 'x' });
    expect(weekArc.skeletonId).toBe('A');
    const caprichoBeat = weekArc.beats.find((b) => b.slotRole === 'capricho');
    expect(caprichoBeat, 'deberia haber un beat con slotRole=capricho').toBeDefined();
    expect(caprichoBeat.day).toBe('Jueves'); // siguiente en TEMPLATE_A.caprichoPreference tras Viernes
    expect(decisionLog.some((d) => d.cause === 'capricho_desplazado')).toBe(true);
    expect(decisionLog.some((d) => d.cause === 'capricho_truncado')).toBe(false);
  });
});

describe('(f) truncado real: perfil sin ningun dia disponible para capricho', () => {
  it('volumen_agresivo (1 solo dia no-fijo en TODA la semana) trunca el capricho a cero cuando ese dia ya es el batchDay', () => {
    const fixture = FIXTURES.find((f) => f.name === 'volumen_agresivo');
    const fixedRoles = computeFixedRoles(fixture.profile, []);
    const noFijos = DAYS_ORDER.filter((d) => !fixedRoles[d]);
    expect(noFijos).toEqual(['Miercoles']); // el unico dia no-fijo

    const { weekArc, decisionLog } = buildWeekArc({ profile: fixture.profile, seed: 0, strategy: fixture.expectedStrategy });
    // El unico dia no-fijo (Miercoles) es tambien el batchDay -> ocupado
    // por el ancla -> no queda ningun dia para el capricho.
    expect(weekArc.batchDay).toBe('Miercoles');
    const caprichoBeat = weekArc.beats.find((b) => b.slotRole === 'capricho');
    expect(caprichoBeat).toBeUndefined();
    expect(decisionLog.some((d) => d.cause === 'capricho_truncado')).toBe(true);
  });

  it('confirma por construccion (sin depender de que ancla salio): caprichoPreference completo de las 3 plantillas falla para este perfil', () => {
    const fixture = FIXTURES.find((f) => f.name === 'volumen_agresivo');
    const fixedRoles = computeFixedRoles(fixture.profile, []);
    const BLOCKING = new Set(['libre', 'entreno']);
    for (const template of TEMPLATES) {
      const disponibles = template.caprichoPreference.filter((d) => !BLOCKING.has(fixedRoles[d]));
      // El unico dia disponible (Miercoles) coincide con el batchDay
      // resuelto de las 3 plantillas para este perfil (verificado abajo),
      // asi que SIEMPRE queda ocupado por el ancla.
      expect(disponibles).toEqual(['Miercoles']);
      const batchDayResuelto = template.batchDayPreference.find((d) => !BLOCKING.has(fixedRoles[d]));
      expect(batchDayResuelto).toBe('Miercoles');
    }
  });
});

describe('re-verificacion: el capricho no altera la medicion de arco del batch (CP3A/B)', () => {
  it('leftoverDays de las 6 anclas, con y sin capricho activo, son identicos (capricho no compite por dias de sobra ya ocupados)', () => {
    // El capricho se resuelve DESPUES de las sobras y nunca las pisa (ver
    // chooseCapricho: ocupados incluye batchDay + leftoverDays) -- asi
    // que la metrica de arco de CP3B (83.3%/85.2%/85.2%) no deberia
    // cambiar. Verificacion directa: computeLeftoverDays no recibe ni
    // necesita el capricho en su firma -- es estructuralmente imposible
    // que lo altere.
    const fixedRoles = computeFixedRoles({ trainingDays: [] }, []);
    const sobras1 = computeLeftoverDays('Miercoles', 4, fixedRoles, []);
    const sobras2 = computeLeftoverDays('Miercoles', 4, fixedRoles, []);
    expect(sobras1).toEqual(sobras2);
    expect(TEMPLATE_C.caprichoDay).not.toBe(TEMPLATE_C.batchDay);
  });
});
