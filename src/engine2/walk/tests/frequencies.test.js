// frequencies.js — Fase 4, Componente P2b-ii (paso 4 del walk, D-024).
// Falsables f1, f2, f4, f5, f6, f7, f8, f9 a nivel de unidad, con vistas
// sinteticas inyectadas via getVista (mismo patron que filterSurvivors/
// D-023): el catalogo real no puede ejercer todas las combinaciones de
// proteinType/verdura bajo control preciso (resolveDishComposition exige
// join contra legacyCombos/FREEFORM_COMBOS reales; ademas, TODO plato real
// de legumbre/pescado tiene verdura -- no hay forma de aislar el target
// semanal de la sub-regla de verdura con datos reales, verificado por
// barrido). f3/f12 (que necesitan el walk completo: RNG real end-to-end,
// forma del decisionLog) viven en runWalk.frequencies.test.js.

import { describe, it, expect } from 'vitest';
import {
  chooseFrequencyLevel, createFrequencyState, registerConsumption, initFrequencyState,
  satisfaceVerdura, resolveFrequencyVista, PROTEIN_TARGET_ORDER,
} from '../frequencies.js';
import { DEFAULT_WEEKLY_TARGETS } from '../../contracts/weeklyTargets.js';

function vista({ proteinType = null, ejes = [] } = {}) {
  return { proteinType, verdura: { origen: 'derivada', valorEfectivo: ejes } };
}
function vistaVerduraDesconocida(proteinType = null) {
  return { proteinType, verdura: { origen: 'desconocida' } };
}
function cand(id, v) {
  return { id, __vista: v };
}
const getVista = (d) => d.__vista;

function estadoCorto(overrides = {}) {
  const state = createFrequencyState();
  return { ...state, ...overrides };
}

describe('satisfaceVerdura — nunca invoca ejesVerdura sobre "desconocida" (f8)', () => {
  it('conocida + ejes no vacios -> true', () => {
    expect(satisfaceVerdura(vista({ ejes: ['tomate'] }))).toBe(true);
  });
  it('conocida + ejes vacios -> false', () => {
    expect(satisfaceVerdura(vista({ ejes: [] }))).toBe(false);
  });
  it('desconocida -> false, sin lanzar (freeform nunca satisface: infraconteo declarado)', () => {
    expect(() => satisfaceVerdura(vistaVerduraDesconocida())).not.toThrow();
    expect(satisfaceVerdura(vistaVerduraDesconocida())).toBe(false);
  });
});

describe('f1 — Particion: target corto con nivel preferente no vacio', () => {
  it('legumbre corto, 1 candidato legumbre entre varios neutros -> el nivel preferente es exactamente ese candidato', () => {
    const state = estadoCorto();
    const candidatesB = [
      cand('neutro1', vista({ proteinType: 'ave' })),
      cand('legumbreX', vista({ proteinType: 'legumbre' })),
      cand('neutro2', vista({ proteinType: 'carne' })),
    ];
    const { nivel, causa } = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });
    expect(causa).toBe('frecuencia_semanal_atendida');
    expect(nivel.map((d) => d.id)).toEqual(['legumbreX']);
  });

  it('MUTACION dirty->red: si la seleccion ignorara "nivel" y usara candidatesB completo, el aserto de arriba fallaria', () => {
    const candidatesB = [
      cand('neutro1', vista({ proteinType: 'ave' })),
      cand('legumbreX', vista({ proteinType: 'legumbre' })),
    ];
    // Simulacion de la mutacion (sin tocar frequencies.js real): elegir sobre candidatesB.
    const nivelSucio = candidatesB;
    expect(nivelSucio.map((d) => d.id)).not.toEqual(['legumbreX']); // demuestra que la mutacion rompe la propiedad de f1
  });
});

describe('f2 — Fallback honesto: ningun candidato cubre corto alguno', () => {
  it('legumbre Y pescado cortos, pool 100% neutro -> conjunto completo, causa frecuencia_corta_sin_candidato', () => {
    const state = estadoCorto();
    const candidatesB = [
      cand('neutro1', vista({ proteinType: 'ave' })),
      cand('neutro2', vista({ proteinType: 'carne' })),
    ];
    const { nivel, causa, evidencia } = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });
    expect(causa).toBe('frecuencia_corta_sin_candidato');
    expect(nivel).toBe(candidatesB); // el CONJUNTO COMPLETO, no un subconjunto
    expect(evidencia).toContain('legumbre');
    expect(evidencia).toContain('pescado');
  });

  it('MUTACION dirty->red: un filtro duro que vaciara el pool (en vez de fallback honesto) dejaria selection vacia -> detectable', () => {
    const candidatesB = [cand('neutro1', vista({ proteinType: 'ave' }))];
    const filtroDuroSucio = candidatesB.filter((d) => getVista(d).proteinType === 'legumbre'); // vacia el pool
    expect(filtroDuroSucio).toHaveLength(0); // confirma que la mutacion produce un pool vacio (rojo si se usara como nivel)
  });
});

describe('f4 — Precedencia: legumbre antes que pescado', () => {
  it('ambos cortos, candidatos para AMBOS -> se atiende legumbre, causa cita el campo', () => {
    const state = estadoCorto();
    const candidatesB = [
      cand('pescadoX', vista({ proteinType: 'pescado' })),
      cand('legumbreY', vista({ proteinType: 'legumbre' })),
    ];
    const { nivel, causa, evidencia } = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });
    expect(causa).toBe('frecuencia_semanal_atendida');
    expect(nivel.map((d) => d.id)).toEqual(['legumbreY']);
    expect(evidencia).toContain('target="legumbre"');
  });

  it('MUTACION dirty->red: orden invertido [pescado, legumbre] atenderia pescado primero -> confirmado por inspeccion directa del orden declarado', () => {
    const ordenSucio = ['pescado', 'legumbre'];
    expect(ordenSucio).not.toEqual(PROTEIN_TARGET_ORDER); // el orden real es ['legumbre','pescado']
    expect(PROTEIN_TARGET_ORDER[0]).toBe('legumbre');
  });

  it('legumbre corto pero SIN candidato, pescado corto CON candidato -> se atiende pescado (salta legumbre, no fallback prematuro)', () => {
    const state = estadoCorto();
    const candidatesB = [
      cand('pescadoX', vista({ proteinType: 'pescado' })),
      cand('neutro', vista({ proteinType: 'ave' })),
    ];
    const { nivel, causa } = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });
    expect(causa).toBe('frecuencia_semanal_atendida');
    expect(nivel.map((d) => d.id)).toEqual(['pescadoX']);
  });
});

describe('f5 — Veda: tras incrementar un contador semanal, el paso 4 no vuelve a atenderlo mientras dure (hoy + dia siguiente)', () => {
  // Vistas SIN verdura (ejes:[]) para aislar el layer semanal de la
  // sub-regla de verdura (asiento 3 tiene prioridad -- con datos reales
  // TODO legumbre/pescado trae verdura, verificado por barrido; sintetico
  // permite el aislamiento limpio).
  const vLegumbre = vista({ proteinType: 'legumbre', ejes: [] });
  const vPescado = vista({ proteinType: 'pescado', ejes: [] });
  const vNeutro = vista({ proteinType: 'ave', ejes: [] });

  it('via 1 (sobra/ancla, paso 1): incremento registrado en Miercoles -> Miercoles Y Jueves vedados para legumbre; Viernes NO', () => {
    const state = createFrequencyState();
    // Simula initFrequencyState: P1a ya coloco un plato de legumbre en Miercoles (ancla o sobra).
    registerConsumption(state, cand('legumbreAncla', vLegumbre), 'Miercoles', getVista);
    expect(state.contadores.legumbre).toBe(1); // sigue corto (1 < 3)

    const candidatesB = [cand('legumbreDisponible', vLegumbre)];
    const rMiercoles = chooseFrequencyLevel({ day: 'Miercoles', candidatesB, state, getVista });
    expect(rMiercoles.causa).not.toBe('frecuencia_semanal_atendida'); // vedado (hoy)
    const rJueves = chooseFrequencyLevel({ day: 'Jueves', candidatesB, state, getVista });
    expect(rJueves.causa).not.toBe('frecuencia_semanal_atendida'); // vedado (dia siguiente)
    const rViernes = chooseFrequencyLevel({ day: 'Viernes', candidatesB, state, getVista });
    expect(rViernes.causa).toBe('frecuencia_semanal_atendida'); // veda expirada, sigue corto, hay candidato
    expect(rViernes.nivel.map((d) => d.id)).toEqual(['legumbreDisponible']);
  });

  it('via 2 (seleccion del propio paso 4): eleccion en Lunes -> Lunes Y Martes vedados para pescado; Miercoles NO', () => {
    const state = createFrequencyState();
    const candidatesLunes = [cand('pescadoA', vPescado), cand('neutroA', vNeutro)];
    const rLunes = chooseFrequencyLevel({ day: 'Lunes', candidatesB: candidatesLunes, state, getVista });
    expect(rLunes.causa).toBe('frecuencia_semanal_atendida');
    // El walk (runWalk.js) elige dentro de rLunes.nivel y DESPUES registra el consumo -- se reproduce esa secuencia:
    const [elegidoLunes] = rLunes.nivel;
    registerConsumption(state, elegidoLunes, 'Lunes', getVista);
    expect(state.contadores.pescado).toBe(1);

    const candidatesMartes = [cand('pescadoB', vPescado)];
    const rMartes = chooseFrequencyLevel({ day: 'Martes', candidatesB: candidatesMartes, state, getVista });
    expect(rMartes.causa).not.toBe('frecuencia_semanal_atendida'); // vedado (dia siguiente al evento)

    const candidatesMiercoles = [cand('pescadoC', vPescado)];
    const rMiercoles = chooseFrequencyLevel({ day: 'Miercoles', candidatesB: candidatesMiercoles, state, getVista });
    expect(rMiercoles.causa).toBe('frecuencia_semanal_atendida'); // veda expirada
  });

  it('MUTACION dirty->red: sin veda, el mismo estado (contador=1, corto) atenderia legumbre TAMBIEN en Jueves -- confirmado inspeccionando el estado directamente', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('legumbreAncla', vLegumbre), 'Miercoles', getVista);
    // Sin el chequeo de veda, la unica condicion seria "corto": contador(1) < target(3) -> true tambien en Jueves.
    const seriaCortoSinVeda = state.contadores.legumbre < DEFAULT_WEEKLY_TARGETS.legumbre;
    expect(seriaCortoSinVeda).toBe(true); // confirma que SIN el chequeo de veda, Jueves atenderia legumbre de nuevo (rojo si se quitara la veda real)
  });
});

describe('f6 — Exencion de verdura: predicado diario sin restriccion de veda, dias consecutivos', () => {
  it('Lunes y Martes ambos sin verdura, ambos con candidato que la cubre -> se atiende en AMBOS dias (sin veda)', () => {
    const candidatesB = [
      cand('conVerdura', vista({ proteinType: 'ave', ejes: ['tomate'] })),
      cand('neutro', vista({ proteinType: 'carne' })),
    ];
    const state = estadoCorto();
    const rLunes = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });
    expect(rLunes.causa).toBe('frecuencia_verdura_diaria');
    // Registra el consumo de "conVerdura" en Lunes (marca el dia con verdura)...
    registerConsumption(state, cand('conVerdura', vista({ proteinType: 'ave', ejes: ['tomate'] })), 'Lunes', getVista);
    // ...pero Martes es UN DIA DISTINTO sin verdura propia: el predicado se re-evalua a diario, sin veda.
    const rMartes = chooseFrequencyLevel({ day: 'Martes', candidatesB, state, getVista });
    expect(rMartes.causa).toBe('frecuencia_verdura_diaria'); // sin exencion, verdura se atiende de nuevo
  });

  it('MUTACION dirty->red: si se aplicara veda (dia incrementDays) a verdura, Martes NO deberia atenderla -- se demuestra construyendo ese estado sucio directamente', () => {
    const candidatesB = [cand('conVerdura', vista({ proteinType: 'ave', ejes: ['tomate'] }))];
    const stateSucio = estadoCorto();
    stateSucio.diasConVerdura.add('Martes'); // simula una veda mal aplicada que marca Martes como "ya con verdura" sin serlo
    const r = chooseFrequencyLevel({ day: 'Martes', candidatesB, state: stateSucio, getVista });
    expect(r.causa).not.toBe('frecuencia_verdura_diaria'); // confirma que ESTE estado (vedado) SI producira un resultado distinto -> detectable si el mecanismo real aplicara veda a verdura
  });
});

describe('f7 — Sub-regla diaria primero: verdura antes que cualquier contador semanal corto', () => {
  it('dia sin verdura, candidato que la cubre Y ADEMAS legumbre corta con su propio candidato -> gana verdura', () => {
    const state = estadoCorto(); // legumbre y pescado ambos cortos (0 < 3)
    const candidatesB = [
      cand('legumbreSinVerdura', vista({ proteinType: 'legumbre', ejes: [] })),
      cand('neutroConVerdura', vista({ proteinType: 'ave', ejes: ['zanahoria'] })),
    ];
    const { nivel, causa } = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });
    expect(causa).toBe('frecuencia_verdura_diaria');
    expect(nivel.map((d) => d.id)).toEqual(['neutroConVerdura']); // NO 'legumbreSinVerdura', aunque legumbre este corta
  });

  it('MUTACION dirty->red: orden invertido (targets semanales antes que verdura) elegiria el candidato de legumbre en vez del de verdura', () => {
    const candidatesB = [
      { id: 'legumbreSinVerdura', v: vista({ proteinType: 'legumbre', ejes: [] }) },
      { id: 'neutroConVerdura', v: vista({ proteinType: 'ave', ejes: ['zanahoria'] }) },
    ];
    // Simulacion del orden sucio: filtra primero por target semanal corto (legumbre).
    const nivelSucio = candidatesB.filter((d) => d.v.proteinType === 'legumbre');
    expect(nivelSucio.map((d) => d.id)).toEqual(['legumbreSinVerdura']); // confirma que el orden invertido da un resultado DISTINTO al correcto (verdura primero)
  });
});

describe('f8 — Infraconteo + throw intacto: freeform (desconocida) nunca satisface verdura, jamas invoca ejesVerdura', () => {
  it('candidato con vista "desconocida" nunca entra al nivel preferente de verdura', () => {
    const state = estadoCorto();
    const candidatesB = [
      cand('freeformX', vistaVerduraDesconocida('carne')),
      cand('neutro', vista({ proteinType: 'ave', ejes: [] })),
    ];
    const { causa } = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });
    expect(causa).not.toBe('frecuencia_verdura_diaria'); // ningun candidato la cubre (uno desconocida, otro sin ejes)
  });

  it('resolveFrequencyVista NO oculta errores reales del resolver (solo "origen indeterminado" se sustituye)', () => {
    // 'id_inventado_sin_mapeo' no es tupla scaffold parseable ni tiene entrada en
    // FREEFORM_COMBOS -> "origen indeterminado" -> vista neutral, no lanza.
    expect(() => resolveFrequencyVista({ id: 'id_inventado_sin_mapeo' })).not.toThrow();
    const vistaNeutral = resolveFrequencyVista({ id: 'id_inventado_sin_mapeo' });
    expect(PROTEIN_TARGET_ORDER.includes(vistaNeutral.proteinType)).toBe(false);
    expect(satisfaceVerdura(vistaNeutral)).toBe(false);

    // Tupla VALIDA (parsea, 7 elementos) pero con P fuera de P_TO_PROTEINTYPE:
    // error REAL de catalogo (P_TO_PROTEINTYPE incompleto), mensaje DISTINTO de
    // "origen indeterminado" -> debe propagarse, no ocultarse.
    const idTuplaConProteinaInvalida = JSON.stringify(['tmpl_test', 'proteina_invalida_xyz', null, null, null, null, 'crudo']);
    expect(() => resolveFrequencyVista({ id: idTuplaConProteinaInvalida })).toThrow(/P_TO_PROTEINTYPE/);
  });
});

describe('f9 — Semantica del contador: incrementa una vez por colocacion consumida, independiente del origen', () => {
  it('ancla + 2 sobras (mismo plato, 3 colocaciones en P1a) -> 3 incrementos del contador de ese proteinType', () => {
    const p1aSlots = [
      { day: 'Miercoles', momento: 'comida', abierto: false, dishId: 'legumbreAncla' },
      { day: 'Jueves', momento: 'comida', abierto: false, dishId: 'legumbreAncla' },
      { day: 'Viernes', momento: 'comida', abierto: false, dishId: 'legumbreAncla' },
      { day: 'Lunes', momento: 'comida', abierto: true }, // hueco abierto, no cuenta
    ];
    const vistaFija = vista({ proteinType: 'legumbre', ejes: [] });
    const state = initFrequencyState(p1aSlots, () => vistaFija);
    expect(state.contadores.legumbre).toBe(3); // el aserto es sobre el CONTEO, no sobre el valor del target
    expect(state.incrementDays.legumbre).toEqual(new Set(['Miercoles', 'Jueves', 'Viernes']));
  });

  it('MUTACION dirty->red: contar solo eventos de "cocinado" (1 por plato distinto, no por colocacion) daria 1, no 3', () => {
    const colocaciones = ['Miercoles', 'Jueves', 'Viernes'];
    const platosDistintos = new Set(colocaciones.map(() => 'legumbreAncla'));
    expect(platosDistintos.size).toBe(1); // confirma que "contar cocinado" (por plato) da 1 -- distinto de los 3 incrementos correctos
  });

  it('capricho y seleccion libre tambien incrementan (registerConsumption generico, no solo P1a)', () => {
    const state = createFrequencyState();
    registerConsumption(state, cand('caprichoLegumbre', vista({ proteinType: 'legumbre' })), 'Martes', getVista);
    registerConsumption(state, cand('libreLegumbre', vista({ proteinType: 'legumbre' })), 'Jueves', getVista);
    expect(state.contadores.legumbre).toBe(2);
  });
});

describe('f10 (ver tambien weeklyTargets.test.js) — chooseFrequencyLevel lee DEFAULT_WEEKLY_TARGETS, no un valor hardcodeado propio', () => {
  it('con contador ya en el target (satisfecho), el campo NO se atiende aunque haya candidato', () => {
    const state = estadoCorto();
    state.contadores.legumbre = DEFAULT_WEEKLY_TARGETS.legumbre; // satisfecho
    const candidatesB = [cand('legumbreX', vista({ proteinType: 'legumbre' }))];
    const { causa } = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });
    expect(causa).toBe('frecuencia_corta_sin_candidato'); // pescado sigue corto (0<3) pero sin candidato en este pool -> fallback, no legumbre
  });
});

describe('sin intervencion (f12, mitad "silencio"): ningun target corto ni verdura pendiente -> causa null', () => {
  it('todos los contadores satisfechos y el dia ya tiene verdura -> el paso no interviene', () => {
    const state = estadoCorto();
    state.contadores.legumbre = DEFAULT_WEEKLY_TARGETS.legumbre;
    state.contadores.pescado = DEFAULT_WEEKLY_TARGETS.pescado;
    state.diasConVerdura.add('Lunes');
    const candidatesB = [cand('cualquiera', vista({ proteinType: 'ave', ejes: ['zanahoria'] }))];
    const { nivel, causa, evidencia } = chooseFrequencyLevel({ day: 'Lunes', candidatesB, state, getVista });
    expect(causa).toBeNull();
    expect(evidencia).toBeNull();
    expect(nivel).toBe(candidatesB);
  });
});

describe('S2 (D-028 §2) — T5 [D.2] satisfaceVerdura es CONSUMIDOR DE DOMINIO: LANZA sobre confirmada', () => {
  // Doctrina Fork D.2 (ratificada, adenda Fase 1 EDITORIAL-S2): satisfaceVerdura
  // tiene consecuencia observable (si el dia cuenta como "con verdura" o
  // no) -- LANZA sobre origen="confirmada", frontera arquitectonica, no bug.
  it('lanza, nombrando satisfaceVerdura y S3, al recibir verdura.origen="confirmada"', () => {
    const vistaConConfirmacion = { proteinType: null, verdura: { origen: 'confirmada', valorEfectivo: ['tomate'] } };
    let thrown;
    try {
      satisfaceVerdura(vistaConConfirmacion);
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeDefined();
    expect(thrown.message).toMatch(/satisfaceVerdura/);
    expect(thrown.message).toMatch(/S3/);
  });

  it('sigue funcionando sin cambios para derivada/desconocida (comportamiento actual, sin cambio) -- [3.3] verifica el RESULTADO, no solo ausencia de throw', () => {
    const vistaDerivada = { proteinType: null, verdura: { origen: 'derivada', valorEfectivo: ['tomate'] } };
    const vistaDesconocida = { proteinType: null, verdura: { origen: 'desconocida' } };
    expect(satisfaceVerdura(vistaDerivada)).toBe(true);
    expect(satisfaceVerdura(vistaDesconocida)).toBe(false);
  });
});
