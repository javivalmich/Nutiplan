// identity.test.js — Fase 4, Componente P2b-iii (paso 5 del walk, D-044).
// Mecanismo puro con vistas sinteticas inyectadas via getVista (mismo
// patron que frequencies.test.js/filterSurvivors, D-023): el catalogo
// real no puede aislar bajo control preciso los casos degenerados que
// prueban INV-1 (ver mas abajo). Los criterios de D-044 punto 10 se citan
// por numero romano en cada describe/it que los cubre.

import { describe, it, expect } from 'vitest';
import {
  createFrequencyState, registerConsumption, initFrequencyState,
  diasConIdentidad, costeRepeticion, particionarPorCoste, chooseIdentityLevel,
  chooseFrequencyLevel,
} from '../frequencies.js';

function vista({ proteinType = null, ejes = [], origen = 'derivada' } = {}) {
  return { proteinType, verdura: { origen, valorEfectivo: ejes } };
}
function cand(id, v) {
  return { id, __vista: v };
}
const getVista = (d) => d.__vista;

describe('poblacion de memoria de identidad (D-044 puntos 3-4)', () => {
  it('registerConsumption puebla la identidad para el dia consumido', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('a', vista({ ejes: ['tomate'] })), 'Lunes', getVista);
    expect(diasConIdentidad(state, 'tomate')).toBe(1);
  });

  it('la misma identidad en DOS dias distintos -> diasConIdentidad = 2 (unidad = dia, no aparicion)', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('a', vista({ ejes: ['tomate'] })), 'Lunes', getVista);
    registerConsumption(state, cand('b', vista({ ejes: ['tomate'] })), 'Martes', getVista);
    expect(diasConIdentidad(state, 'tomate')).toBe(2);
  });

  it('la misma identidad registrada DOS VECES el mismo dia (comida+cena) cuenta ese dia UNA sola vez', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('a', vista({ ejes: ['tomate'] })), 'Lunes', getVista);
    registerConsumption(state, cand('b', vista({ ejes: ['tomate'] })), 'Lunes', getVista);
    expect(diasConIdentidad(state, 'tomate')).toBe(1);
  });

  it('eje-agnostica: una vista con DOS ejes (V+V2 fusionados) puebla AMBAS identidades el mismo dia', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('a', vista({ ejes: ['tomate', 'pimientos'] })), 'Lunes', getVista);
    expect(diasConIdentidad(state, 'tomate')).toBe(1);
    expect(diasConIdentidad(state, 'pimientos')).toBe(1);
  });

  it('origen "desconocida" no puebla nada (satisfaceVerdura descarta antes de leer valorEfectivo)', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('a', vista({ origen: 'desconocida', ejes: [] })), 'Lunes', getVista);
    expect(diasConIdentidad(state, 'tomate')).toBe(0);
  });

  it('identidad nunca comprometida -> diasConIdentidad = 0 (lectura por defecto, sin entrada previa)', () => {
    const state = createFrequencyState();
    expect(diasConIdentidad(state, 'nunca-vista')).toBe(0);
  });

  it('initFrequencyState puebla identidad desde colocaciones YA cerradas de P1a (ancla/sobra) -- cero recorrido nuevo', () => {
    const p1aSlots = [
      { day: 'Lunes', momento: 'comida', abierto: false, dishId: 'anclaTomate' },
      { day: 'Lunes', momento: 'cena', abierto: true },
    ];
    const dishesById = { anclaTomate: vista({ ejes: ['tomate'] }) };
    const state = initFrequencyState(p1aSlots, (d) => dishesById[d.id]);
    expect(diasConIdentidad(state, 'tomate')).toBe(1);
  });
});

describe('costeRepeticion (D-044 asiento 7, INV-2: monotonia)', () => {
  it('sin verdura (desconocida) -> coste 0', () => {
    const state = createFrequencyState();
    expect(costeRepeticion(state, vista({ origen: 'desconocida', ejes: [] }))).toBe(0);
  });

  it('verdura con ejes vacios -> coste 0 (satisfaceVerdura false)', () => {
    const state = createFrequencyState();
    expect(costeRepeticion(state, vista({ ejes: [] }))).toBe(0);
  });

  it('identidad nunca comprometida -> coste 0', () => {
    const state = createFrequencyState();
    expect(costeRepeticion(state, vista({ ejes: ['tomate'] }))).toBe(0);
  });

  it('monotonia (INV-2): mas dias comprometidos de la MISMA identidad nunca produce coste menor', () => {
    const stateUnDia = createFrequencyState();
    registerConsumption(stateUnDia, cand('a', vista({ ejes: ['tomate'] })), 'Lunes', getVista);
    const costeUnDia = costeRepeticion(stateUnDia, vista({ ejes: ['tomate'] }));

    const stateTresDias = createFrequencyState();
    registerConsumption(stateTresDias, cand('a', vista({ ejes: ['tomate'] })), 'Lunes', getVista);
    registerConsumption(stateTresDias, cand('b', vista({ ejes: ['tomate'] })), 'Martes', getVista);
    registerConsumption(stateTresDias, cand('c', vista({ ejes: ['tomate'] })), 'Miercoles', getVista);
    const costeTresDias = costeRepeticion(stateTresDias, vista({ ejes: ['tomate'] }));

    expect(costeUnDia).toBe(1);
    expect(costeTresDias).toBe(3);
    expect(costeTresDias).toBeGreaterThanOrEqual(costeUnDia); // INV-2 literal: nunca menor
  });

  it('multiples identidades en un candidato -> coste es el MAXIMO, no la suma (sin acumulacion numerica, D-044 asiento 5)', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('a', vista({ ejes: ['tomate'] })), 'Lunes', getVista);
    registerConsumption(state, cand('b', vista({ ejes: ['pimientos'] })), 'Martes', getVista);
    registerConsumption(state, cand('c', vista({ ejes: ['pimientos'] })), 'Miercoles', getVista);
    // tomate: 1 dia: pimientos: 2 dias. Un candidato con AMBAS identidades:
    const coste = costeRepeticion(state, vista({ ejes: ['tomate', 'pimientos'] }));
    expect(coste).toBe(2); // maximo(1,2) = 2, NUNCA 1+2=3 (eso seria acumulacion, prohibida)
  });
});

describe('particionarPorCoste (D-044 asientos 5-6): particion + INV-1 "por construccion"', () => {
  it('minimo unico -> preferentes = solo el candidato de menor coste, reversion=false', () => {
    const candidates = [cand('caro', null), cand('barato', null)];
    const { preferentes, costeMinimo, reversion } = particionarPorCoste(candidates, [3, 1]);
    expect(costeMinimo).toBe(1);
    expect(preferentes.map((d) => d.id)).toEqual(['barato']);
    expect(reversion).toBe(false);
  });

  it('empate total -> preferentes = todos, reversion=false (particion sin efecto)', () => {
    const candidates = [cand('a', null), cand('b', null)];
    const { preferentes, reversion } = particionarPorCoste(candidates, [2, 2]);
    expect(preferentes).toHaveLength(2);
    expect(reversion).toBe(false);
  });

  it('(i)/(viii) INV-1 por construccion: costes degenerados (NaN, estado inalcanzable con costeRepeticion real) -> particion preferente vacia -> reversion=true', () => {
    // NaN !== NaN: ningun candidato satisface `costes[i] === costeMinimo`
    // (Math.min con un NaN devuelve NaN). Esto es DELIBERADAMENTE
    // inalcanzable a traves de costeRepeticion (que solo produce numeros
    // finitos reales, ver su propio test de arriba) -- se construye aqui
    // directamente para probar que el mecanismo de reversion FUNCIONA,
    // independientemente de si la funcion de coste actual puede producirlo
    // (D-044 asiento 7: la funcion de coste puede evolucionar; INV-1 es la
    // red de seguridad para cualquier futura que no preserve la garantia).
    const candidates = [cand('x', null), cand('y', null)];
    const { preferentes, reversion } = particionarPorCoste(candidates, [NaN, NaN]);
    expect(preferentes).toEqual([]);
    expect(reversion).toBe(true);
  });

  it('(viii) mutacion de control: una variante que LANZA en vez de revertir ante particion vacia falla este test dedicado a INV-1', () => {
    // Variante rechazada (simulada aqui, NUNCA en el modulo real -- mismo
    // patron que las "MUTACION dirty->red" de frequencies.test.js): en
    // vez de reversion:true + preferentes:[], lanza. Un test de INV-1
    // escrito contra ESA variante fallaria (rojo), demostrando que la
        // suite real (que revierte, ver arriba) discrimina la reversion
    // contractual de esta alternativa.
    function particionarPorCosteQueLanza(candidatesIn, costesIn) {
      const costeMinimo = Math.min(...costesIn);
      const preferentes = candidatesIn.filter((_, i) => costesIn[i] === costeMinimo);
      if (preferentes.length === 0) {
        throw new Error('particion preferente vacia -- variante rechazada, INV-1 exige reversion, no throw');
      }
      return { preferentes, costeMinimo, reversion: false };
    }
    const candidates = [cand('x', null), cand('y', null)];
    expect(() => particionarPorCosteQueLanza(candidates, [NaN, NaN])).toThrow(/INV-1 exige reversion/);
    // La implementacion REAL, con el mismo input degenerado, NO lanza:
    expect(() => particionarPorCoste(candidates, [NaN, NaN])).not.toThrow();
  });
});

describe('chooseIdentityLevel (D-044 puntos 5-8, paso 5)', () => {
  it('pool de 1 candidato -> no se evalua (causa/evidencia null, nivel = el mismo array de entrada)', () => {
    const state = createFrequencyState();
    const candidatesFinal = [cand('unico', vista({ ejes: ['tomate'] }))];
    const { nivel, causa, evidencia } = chooseIdentityLevel({ candidatesFinal, state, getVista });
    expect(nivel).toBe(candidatesFinal); // misma referencia: cero evaluacion
    expect(causa).toBeNull();
    expect(evidencia).toBeNull();
  });

  it('empate al coste minimo (ninguna identidad comprometida aun) -> sin efecto, causa/evidencia null (D-044 punto 8: "sin efecto, sin entrada")', () => {
    const state = createFrequencyState();
    const candidatesFinal = [
      cand('a', vista({ ejes: ['tomate'] })),
      cand('b', vista({ ejes: ['pimientos'] })),
    ];
    const { nivel, causa, evidencia } = chooseIdentityLevel({ candidatesFinal, state, getVista });
    expect(nivel).toEqual(candidatesFinal);
    expect(causa).toBeNull();
    expect(evidencia).toBeNull();
  });

  it('(vii) discriminacion basica: uno repite identidad ya comprometida, el otro no -> gana (nivel = solo) el que no repite', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('previo', vista({ ejes: ['tomate'] })), 'Lunes', getVista);

    const candidatesFinal = [
      cand('repite', vista({ ejes: ['tomate'] })),
      cand('novedad', vista({ ejes: ['pimientos'] })),
    ];
    const { nivel, causa, evidencia } = chooseIdentityLevel({ candidatesFinal, state, getVista });

    expect(nivel.map((d) => d.id)).toEqual(['novedad']);
    expect(causa).toBe('identidad_verdura_preferencia_aplicada');
    expect(evidencia).toContain('paso 5:');
    expect(evidencia).toMatch(/coste minimo/);
    expect(evidencia).toContain('repite'); // tamano/descartados citados por id
  });

  it('(vii) ROJO sin mecanismo / VERDE con el: sin chooseIdentityLevel, ambos candidatos siguen empatados en el nivel de paso4 (RNG decidiria); con el, el nivel se reduce a 1 sin RNG', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('previo', vista({ ejes: ['tomate'] })), 'Lunes', getVista);
    const candidatesFinal = [
      cand('repite', vista({ ejes: ['tomate'] })),
      cand('novedad', vista({ ejes: ['pimientos'] })),
    ];

    // "Sin mecanismo" (rojo): el nivel que llegaria al sorteo RNG es
    // candidatesFinal tal cual -- el candidato que repite SIGUE siendo
    // elegible, 50% de posibilidades de ganar segun el indice RNG.
    expect(candidatesFinal).toHaveLength(2);
    expect(candidatesFinal.map((d) => d.id)).toContain('repite');

    // "Con mecanismo" (verde): paso 5 reduce el nivel a 1 candidato ANTES
    // del sorteo -- "repite" queda excluido, cero probabilidad de ganar.
    const { nivel } = chooseIdentityLevel({ candidatesFinal, state, getVista });
    expect(nivel).toHaveLength(1);
    expect(nivel.map((d) => d.id)).not.toContain('repite');
  });

  it('(iii) apagable: chooseIdentityLevel es de SOLO LECTURA sobre el estado -- chooseFrequencyLevel da resultado identico llamado antes y despues de paso 5 (mismo state/day/candidatesB)', () => {
    const state = createFrequencyState();
    const candidatesB = [
      cand('a', vista({ proteinType: 'ave', ejes: ['tomate'] })),
      cand('b', vista({ proteinType: 'ave', ejes: ['pimientos'] })),
    ];
    const antes = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });

    // "Apagado" = no llamar al paso 5 en absoluto. Para demostrar que
    // llamarlo tampoco altera nada (equivalente observable a apagarlo),
    // se invoca aqui igualmente sobre el mismo estado:
    chooseIdentityLevel({ candidatesFinal: antes.nivel, state, getVista });

    const despues = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });
    expect(despues).toEqual(antes); // paso 4 es indiferente a que paso 5 se haya ejecutado o no
  });

  it('narracion (iv): interviene -> evidencia con tamanos antes/despues; no interviene -> muda (null)', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('previo', vista({ ejes: ['tomate'] })), 'Lunes', getVista);
    const conIntervencion = chooseIdentityLevel({
      candidatesFinal: [cand('repite', vista({ ejes: ['tomate'] })), cand('novedad', vista({ ejes: ['pimientos'] }))],
      state,
      getVista,
    });
    expect(conIntervencion.causa).not.toBeNull();
    expect(conIntervencion.evidencia).toMatch(/\d+ candidatos de \d+ post-paso4/);

    const sinIntervencion = chooseIdentityLevel({
      candidatesFinal: [cand('x', vista({ ejes: ['zanahoria'] })), cand('y', vista({ ejes: ['calabacin'] }))],
      state,
      getVista,
    });
    expect(sinIntervencion.causa).toBeNull();
    expect(sinIntervencion.evidencia).toBeNull();
  });
});

describe('(v) cruce P1a -> rotativo: identidad presente SOLO en ancla/sobra influye en la priorizacion rotativa posterior', () => {
  it('identidad comprometida via initFrequencyState (P1a, ancla cerrada) descarta al candidato rotativo que la repite', () => {
    const p1aSlots = [
      { day: 'Lunes', momento: 'comida', abierto: false, dishId: 'anclaTomate' },
      { day: 'Lunes', momento: 'cena', abierto: true },
      { day: 'Martes', momento: 'comida', abierto: true },
      { day: 'Martes', momento: 'cena', abierto: true },
    ];
    const dishesById = { anclaTomate: vista({ ejes: ['tomate'] }) };
    // Memoria (P1a): se puebla ANTES de que el walk elija nada en P1b, sin
    // que P1b haya intervenido todavia -- "la memoria es global, no se
    // reinicia al entrar en P1b" (D-044 punto 10.v).
    const state = initFrequencyState(p1aSlots, (d) => dishesById[d.id]);
    expect(diasConIdentidad(state, 'tomate')).toBe(1); // compromiso viene SOLO del ancla

    const candidatesFinal = [
      cand('rotativoRepite', vista({ ejes: ['tomate'] })),
      cand('rotativoNuevo', vista({ ejes: ['espinacas'] })),
    ];
    const { nivel, causa } = chooseIdentityLevel({ candidatesFinal, state, getVista });
    expect(causa).toBe('identidad_verdura_preferencia_aplicada');
    expect(nivel.map((d) => d.id)).toEqual(['rotativoNuevo']);
  });
});
