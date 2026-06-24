// Zigzag estatico de las plantillas A/B/C - Fase 3, Checkpoint 3A/3B.
//
// Las secuencias validas se declaran, no se optimizan; nunca se calcula
// una mejor. Este test recorre cada plantilla YA ESCRITA y verifica que
// no contiene una transicion prohibida (3 dias consecutivos de la misma
// categoria de densidad) -- es una aserción sobre datos declarados, no
// una validacion de runtime ni un calculo de la "secuencia optima".

import { describe, it, expect } from 'vitest';
import { TEMPLATE_A } from '../templateA.js';
import { TEMPLATE_B } from '../templateB.js';
import { TEMPLATE_C } from '../templateC.js';
import { DAYS_ORDER } from '../days.js';

const TODAS_LAS_PLANTILLAS = [TEMPLATE_A, TEMPLATE_B, TEMPLATE_C];

describe.each(TODAS_LAS_PLANTILLAS)('plantilla $skeletonId - zigzag estatico (aserción sobre datos declarados)', (template) => {
  it('cubre los 7 dias de la semana', () => {
    for (const day of DAYS_ORDER) {
      expect(template.density[day]).toBeDefined();
    }
  });

  it('NO contiene 3 dias consecutivos de la misma categoria de densidad (dense-dense-dense ni light-light-light)', () => {
    const secuencia = DAYS_ORDER.map((day) => template.density[day]);
    for (let i = 0; i + 2 < secuencia.length; i++) {
      const tripleta = [secuencia[i], secuencia[i + 1], secuencia[i + 2]];
      const esTripletaProhibida = tripleta[0] === tripleta[1] && tripleta[1] === tripleta[2];
      expect(esTripletaProhibida, `dias ${DAYS_ORDER[i]}-${DAYS_ORDER[i + 1]}-${DAYS_ORDER[i + 2]}: ${tripleta.join('-')}`).toBe(false);
    }
  });

  it('Sabado (libre) y Domingo (familiar) llevan una densidad ya escrita que no es "denso" (compatibilidad con las citas fijas, sin recalculo)', () => {
    expect(template.density.Sabado).not.toBe('denso');
    expect(template.density.Domingo).not.toBe('denso');
  });

  it('batchDayPreference cubre los 6 dias relevantes (Sabado se omite: siempre bloqueado) y el primario es el primer elemento', () => {
    const sinSabado = new Set(DAYS_ORDER.filter((d) => d !== 'Sabado'));
    expect(new Set(template.batchDayPreference)).toEqual(sinSabado);
    expect(template.batchDayPreference[0]).toBe(template.batchDay);
  });
});

describe('plantilla C (doble pico)', () => {
  it('tiene DOS picos de densidad "denso" (doble pico, no progresion monotona de uno solo)', () => {
    const diasDensos = DAYS_ORDER.filter((day) => TEMPLATE_C.density[day] === 'denso');
    expect(diasDensos.length).toBe(2);
  });

  it('batchDay y densidad son decisiones independientes: batchDay no tiene por que coincidir con un pico denso', () => {
    // batchDay paso de Jueves a Miercoles (censo de ventanas de sobras,
    // ver PR) precisamente porque Jueves chocaba con el finde fijo -- la
    // posicion optima para cocinar en cantidad y la posicion optima de
    // densidad son ejes distintos del diseno, no el mismo dato.
    expect(TEMPLATE_C.batchDay).toBe('Miercoles');
    expect(TEMPLATE_C.density.Miercoles).toBe('medio'); // no es un pico, y esta bien que no lo sea
  });
});

describe('plantilla A (pico unico)', () => {
  it('tiene UN solo pico de densidad "denso"', () => {
    const diasDensos = DAYS_ORDER.filter((day) => TEMPLATE_A.density[day] === 'denso');
    expect(diasDensos.length).toBe(1);
  });

  it('batchDay = Lunes (firma de identidad de A)', () => {
    expect(TEMPLATE_A.batchDay).toBe('Lunes');
  });
});

describe('plantilla B (pico unico)', () => {
  it('tiene UN solo pico de densidad "denso"', () => {
    const diasDensos = DAYS_ORDER.filter((day) => TEMPLATE_B.density[day] === 'denso');
    expect(diasDensos.length).toBe(1);
  });

  it('batchDay = Martes (firma de identidad de B)', () => {
    expect(TEMPLATE_B.batchDay).toBe('Martes');
  });
});

describe('las tres plantillas conviven sin colisionar', () => {
  it('A, B y C tienen skeletonId y batchDay distintos entre si', () => {
    const ids = TODAS_LAS_PLANTILLAS.map((t) => t.skeletonId);
    const batchDays = TODAS_LAS_PLANTILLAS.map((t) => t.batchDay);
    expect(new Set(ids).size).toBe(3);
    expect(new Set(batchDays).size).toBe(3);
  });

  it('los 3 picos unicos (A, B) y el doble pico (C) caen en dias distintos entre variantes', () => {
    const picosPorVariante = TODAS_LAS_PLANTILLAS.map((t) => DAYS_ORDER.filter((d) => t.density[d] === 'denso'));
    // A=[Miercoles], B=[Viernes], C=[Lunes,Jueves] -- ninguna comparte
    // TODOS sus picos con otra (aunque podrian solaparse parcialmente,
    // aqui no lo hacen, lo cual ayuda a diferenciar el ritmo de cada una).
    const [picosA, picosB, picosC] = picosPorVariante;
    expect(picosA).not.toEqual(picosB);
    expect(picosA).not.toEqual(picosC);
    expect(picosB).not.toEqual(picosC);
  });
});
