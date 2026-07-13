// Tests de vetoes.js — Fase 4, Componente P2b-i (paso 2 del walk).
// Falsables f13-f16 segun el prompt de sesion 2026-07-06 (ver DECISIONS.md,
// D-022). f14 (uniformidad scaffold/freeform via el resolver) y f15
// (contrato de dominio sobre "desconocida", D-023) se verifican aqui a
// nivel de unidad, contra el catalogo real (loadCatalog) para evitar
// fixtures que no resuelven via CompositionResolver.

import { describe, it, expect } from 'vitest';
import { evaluateVeto, evaluateVetoFromVista, computeVetoUniverse } from '../vetoes.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';

const catalog = loadCatalog();

function find(pred) {
  return catalog.find(pred);
}

describe('evaluateVeto — f14: uniformidad — scaffold y freeform via la MISMA funcion, el mismo resolver', () => {
  const freeformGlutenTrue = find((d) => {
    const v = resolveDishComposition(d);
    return v.origen === 'freeform' && v.containsGluten.origen === 'derivada' && v.containsGluten.valorEfectivo === true;
  });
  const freeformGlutenFalse = find((d) => {
    const v = resolveDishComposition(d);
    return v.origen === 'freeform' && v.containsGluten.origen === 'derivada' && v.containsGluten.valorEfectivo === false;
  });
  const scaffoldDish = find((d) => resolveDishComposition(d).origen === 'scaffold');

  it('fixtures reales localizadas (freeform true, freeform false, scaffold)', () => {
    expect(freeformGlutenTrue).toBeDefined();
    expect(freeformGlutenFalse).toBeDefined();
    expect(scaffoldDish).toBeDefined();
  });

  it('freeform con containsGluten=true se veta con motivo "valor"', () => {
    expect(evaluateVeto(freeformGlutenTrue, ['gluten'])).toEqual([{ campo: 'gluten', motivo: 'valor' }]);
  });

  it('freeform con containsGluten=false NO se veta', () => {
    expect(evaluateVeto(freeformGlutenFalse, ['gluten'])).toEqual([]);
  });

  it('f15: scaffold (origen "desconocida") se veta con motivo "desconocida" — contrato de dominio (D-023: un origen desconocido no puede demostrarse compatible con la exclusion), MISMA funcion, sin heuristica propia (p.ej. por tmpl)', () => {
    expect(evaluateVeto(scaffoldDish, ['gluten'])).toEqual([{ campo: 'gluten', motivo: 'desconocida' }]);
  });

  it('scaffold viola ambos campos a la vez cuando ambos estan en la lista de intolerancias (ambos campos son "desconocida")', () => {
    expect(evaluateVeto(scaffoldDish, ['gluten', 'lactosa'])).toEqual([
      { campo: 'gluten', motivo: 'desconocida' },
      { campo: 'lactosa', motivo: 'desconocida' },
    ]);
  });
});

// f14 (refuerzo): el catalogo real NUNCA produce origen="scaffold" +
// campo.origen="derivada" para gluten/lactosa sin fuente editorial --
// CompositionResolver resuelve scaffold a "desconocida" incondicionalmente
// sin ella (D-021, no depende de datos). Sin este bloque, ningun fixture
// ejercia la rama "valor" del veto con origen="scaffold": los tests de
// arriba prueban scaffold solo por la rama "desconocida" (f15), nunca por
// la rama "valor" (f14). Vista sintetica via evaluateVetoFromVista (nucleo
// puro, sin resolver) para cubrir ese caso hoy inalcanzable con datos
// reales pero que el mecanismo debe tratar identico a freeform
// (uniformidad de CODIGO, no solo de datos).
describe('evaluateVetoFromVista — f14 (refuerzo): scaffold con campo.origen="derivada" (sintetico) se veta POR VALOR, misma rama que freeform', () => {
  const vistaScaffoldDerivadaVetada = {
    origen: 'scaffold',
    containsGluten: { origen: 'derivada', valorEfectivo: true },
    containsLactosa: { origen: 'derivada', valorEfectivo: false },
  };
  const vistaScaffoldDerivadaLibre = {
    origen: 'scaffold',
    containsGluten: { origen: 'derivada', valorEfectivo: false },
    containsLactosa: { origen: 'derivada', valorEfectivo: false },
  };

  it('caso positivo: scaffold "derivada" + valorEfectivo=true se veta con motivo "valor" (NO "desconocida")', () => {
    expect(evaluateVetoFromVista(vistaScaffoldDerivadaVetada, ['gluten'])).toEqual([{ campo: 'gluten', motivo: 'valor' }]);
  });

  it('caso negativo: scaffold "derivada" + valorEfectivo=false NO se veta', () => {
    expect(evaluateVetoFromVista(vistaScaffoldDerivadaLibre, ['gluten'])).toEqual([]);
  });
});

describe('evaluateVeto — atajo estructural: sin intolerancias activas, el resolver NUNCA se invoca', () => {
  it('un id inexistente (que haria lanzar al resolver) no lanza si intolerancias esta vacio', () => {
    expect(() => evaluateVeto({ id: 'id_inventado_sin_mapeo' }, [])).not.toThrow();
    expect(evaluateVeto({ id: 'id_inventado_sin_mapeo' }, [])).toEqual([]);
  });

  it('intolerancias undefined se trata igual que []', () => {
    expect(evaluateVeto({ id: 'id_inventado_sin_mapeo' }, undefined)).toEqual([]);
  });
});

describe('computeVetoUniverse — construccion de universo, restringida al espacio de decision del walk', () => {
  it('sin intolerancias -> activo:false, catalogo NUNCA escaneado (ids no-parseables no lanzan)', () => {
    const catalogEnvenenado = [{ id: 'no_parseable', rol: 'rotativo' }];
    const resultado = computeVetoUniverse(catalogEnvenenado, []);
    expect(resultado.activo).toBe(false);
    expect(resultado.vetoedIds.size).toBe(0);
    expect(resultado.conteo).toEqual({});
  });

  it('ignora platos rol="ancla" (fuera del espacio de decision del walk — ver Fase 1: chooseAnchor/colocacion sin filtros)', () => {
    const freeformGlutenTrue = find((d) => {
      const v = resolveDishComposition(d);
      return v.origen === 'freeform' && v.containsGluten.valorEfectivo === true;
    });
    const catalogoMixto = [
      { id: 'no_parseable_ancla', rol: 'ancla' },
      freeformGlutenTrue,
    ];
    expect(() => computeVetoUniverse(catalogoMixto, ['gluten'])).not.toThrow();
    const resultado = computeVetoUniverse(catalogoMixto, ['gluten']);
    expect(resultado.vetoedIds.has('no_parseable_ancla')).toBe(false);
    expect(resultado.vetoedIds.has(freeformGlutenTrue.id)).toBe(true);
  });

  it('conteo por campo/motivo: separa "valor" de "desconocida"', () => {
    const freeformGlutenTrue = find((d) => {
      const v = resolveDishComposition(d);
      return v.origen === 'freeform' && v.containsGluten.valorEfectivo === true;
    });
    const scaffoldDish = find((d) => resolveDishComposition(d).origen === 'scaffold' && d.rol === 'rotativo');
    const catalogoAislado = [freeformGlutenTrue, scaffoldDish];

    const { vetoedIds, conteo, activo } = computeVetoUniverse(catalogoAislado, ['gluten']);
    expect(activo).toBe(true);
    expect(vetoedIds.size).toBe(2);
    expect(conteo.gluten).toEqual({ valor: 1, desconocida: 1 });
  });
});

describe('D-032 (F-V1→A1) — evaluateVetoFromVista es CONSUMIDOR PURO de valorEfectivo, incluida origen="confirmada"', () => {
  // Doctrina previa (Fork D.2, S2) lanzaba sobre origen="confirmada": el
  // consumidor aun no habia negociado que significa vetar sobre una
  // confirmacion editorial. D-032 (F-V1, opcion A1, ratificada 2026-07-13)
  // retira esa frontera: el consumidor NO ramifica por origen, solo lee
  // valorEfectivo -- misma rama que "derivada" (buildCampoComposicion,
  // compositionResolver.js:185-194, puebla valorEfectivo en ambos casos).

  it('confirmada + valorEfectivo=true se veta con motivo "valor" (A1)', () => {
    const vista = {
      origen: 'scaffold',
      containsGluten: { origen: 'confirmada', valorEfectivo: true },
      containsLactosa: { origen: 'desconocida' },
    };
    expect(evaluateVetoFromVista(vista, ['gluten'])).toEqual([{ campo: 'gluten', motivo: 'valor' }]);
  });

  it('confirmada + valorEfectivo=false NO veta (A1)', () => {
    const vista = {
      origen: 'scaffold',
      containsGluten: { origen: 'confirmada', valorEfectivo: false },
      containsLactosa: { origen: 'desconocida' },
    };
    expect(evaluateVetoFromVista(vista, ['gluten'])).toEqual([]);
  });

  it('discriminacion en ambos sentidos: mutar la MISMA vista confirmada de false a true a false transiciona el resultado en cada paso', () => {
    const vista = {
      origen: 'scaffold',
      containsGluten: { origen: 'confirmada', valorEfectivo: false },
      containsLactosa: { origen: 'desconocida' },
    };
    // Paso 1: false confirmado -> no veta.
    expect(evaluateVetoFromVista(vista, ['gluten'])).toEqual([]);

    // Paso 2: mutar a true -> veta con motivo "valor".
    vista.containsGluten.valorEfectivo = true;
    expect(evaluateVetoFromVista(vista, ['gluten'])).toEqual([{ campo: 'gluten', motivo: 'valor' }]);

    // Paso 3: revertir a false -> vuelve a no vetar.
    vista.containsGluten.valorEfectivo = false;
    expect(evaluateVetoFromVista(vista, ['gluten'])).toEqual([]);
  });

  it('simetria en lactosa: confirmada + valorEfectivo=true veta, valorEfectivo=false no veta', () => {
    const vistaVetada = {
      origen: 'scaffold',
      containsGluten: { origen: 'desconocida' },
      containsLactosa: { origen: 'confirmada', valorEfectivo: true },
    };
    expect(evaluateVetoFromVista(vistaVetada, ['lactosa'])).toEqual([{ campo: 'lactosa', motivo: 'valor' }]);

    const vistaLibre = {
      origen: 'scaffold',
      containsGluten: { origen: 'desconocida' },
      containsLactosa: { origen: 'confirmada', valorEfectivo: false },
    };
    expect(evaluateVetoFromVista(vistaLibre, ['lactosa'])).toEqual([]);
  });

  it('sigue funcionando sin cambios para derivada/desconocida (comportamiento vigente, D-032 no lo toca) -- verifica el RESULTADO, no solo ausencia de throw', () => {
    const vistaSinConfirmar = {
      origen: 'freeform',
      containsGluten: { origen: 'derivada', valorEfectivo: true },
      containsLactosa: { origen: 'desconocida' },
    };
    expect(evaluateVetoFromVista(vistaSinConfirmar, ['gluten', 'lactosa'])).toEqual([
      { campo: 'gluten', motivo: 'valor' },
      { campo: 'lactosa', motivo: 'desconocida' },
    ]);
  });
});
