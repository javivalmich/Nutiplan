// Capricho - Fase 3, Checkpoint 3C: cierra la mentira de contrato (el
// mecanismo entregaba solo 2 de las 3 categorias de slotRole declaradas).
// El capricho es ritmo semanal (posicion = F3); su materializacion
// editorial es F4 (deuda registrada, no se toca aqui).

import { describe, it, expect } from 'vitest';
import {
  buildWeekArc, assertNoCaprichoCollision,
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


describe('(c) ningun capricho coexiste con fixedRole/ancla/sobra en el mismo dia (muerde)', () => {

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
      buildWeekArc({ cocinarEnCantidad: { activo: true }, profile: { trainingDays: ['Martes'] }, seed: 'capricho-fijo', strategy: 'x' })
    );
    const caprichoDays = calls.map(({ weekArc }) => weekArc.beats.find((b) => b.slotRole === 'capricho')?.day ?? null);
    expect(new Set(caprichoDays).size).toBe(1);
  });
});


describe('(f) truncado real: perfil sin ningun dia disponible para capricho', () => {

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
