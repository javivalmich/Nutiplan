// Zigzag estatico de la plantilla C - Fase 3, Checkpoint 3A.
//
// Las secuencias validas se declaran, no se optimizan; nunca se calcula
// una mejor. Este test recorre la plantilla C YA ESCRITA y verifica que
// no contiene una transicion prohibida (3 dias consecutivos de la misma
// categoria de densidad) -- es una aserción sobre datos declarados, no
// una validacion de runtime ni un calculo de la "secuencia optima".

import { describe, it, expect } from 'vitest';
import { TEMPLATE_C } from '../templateC.js';
import { DAYS_ORDER } from '../days.js';

describe('plantilla C - zigzag estatico (aserción sobre datos declarados)', () => {
  it('cubre los 7 dias de la semana', () => {
    for (const day of DAYS_ORDER) {
      expect(TEMPLATE_C.density[day]).toBeDefined();
    }
  });

  it('NO contiene 3 dias consecutivos de la misma categoria de densidad (dense-dense-dense ni light-light-light)', () => {
    const secuencia = DAYS_ORDER.map((day) => TEMPLATE_C.density[day]);
    for (let i = 0; i + 2 < secuencia.length; i++) {
      const tripleta = [secuencia[i], secuencia[i + 1], secuencia[i + 2]];
      const esTripletaProhibida = tripleta[0] === tripleta[1] && tripleta[1] === tripleta[2];
      expect(esTripletaProhibida, `dias ${DAYS_ORDER[i]}-${DAYS_ORDER[i + 1]}-${DAYS_ORDER[i + 2]}: ${tripleta.join('-')}`).toBe(false);
    }
  });

  it('tiene DOS picos de densidad "denso" (doble pico, no progresion monotona de uno solo)', () => {
    const diasDensos = DAYS_ORDER.filter((day) => TEMPLATE_C.density[day] === 'denso');
    expect(diasDensos.length).toBe(2);
  });

  it('el batchDay de la plantilla coincide con uno de los picos densos', () => {
    expect(TEMPLATE_C.density[TEMPLATE_C.batchDay]).toBe('denso');
  });

  it('Sabado (libre) y Domingo (familiar) llevan una densidad ya escrita que no es "denso" (compatibilidad con las citas fijas, sin recalculo)', () => {
    expect(TEMPLATE_C.density.Sabado).not.toBe('denso');
    expect(TEMPLATE_C.density.Domingo).not.toBe('denso');
  });
});
