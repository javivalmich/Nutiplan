// Tests de vetoes.js — Fase 4, Componente P2b-i (paso 2 del walk).
// Falsables f13-f16 segun el prompt de sesion 2026-07-06 (ver DECISIONS.md,
// D-022). f14 (uniformidad scaffold/freeform via el resolver) y f15
// (fail-closed sobre "desconocida") se verifican aqui a nivel de unidad,
// contra el catalogo real (loadCatalog) para evitar fixtures que no
// resuelven via CompositionResolver.

import { describe, it, expect } from 'vitest';
import { evaluateVeto, computeVetoUniverse } from '../vetoes.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';

const catalog = loadCatalog();

function find(pred) {
  return catalog.find(pred);
}

describe('evaluateVeto — f14: uniformidad — scaffold y freeform via la MISMA funcion, el mismo resolver', () => {
  const freeformGlutenTrue = find((d) => {
    const v = resolveDishComposition(d);
    return v.origen === 'freeform' && v.containsGluten.estado === 'conocida' && v.containsGluten.valor === true;
  });
  const freeformGlutenFalse = find((d) => {
    const v = resolveDishComposition(d);
    return v.origen === 'freeform' && v.containsGluten.estado === 'conocida' && v.containsGluten.valor === false;
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

  it('f15: scaffold (estado "desconocida") se veta con motivo "desconocida" — fail-closed, MISMA funcion, sin heuristica propia (p.ej. por tmpl)', () => {
    expect(evaluateVeto(scaffoldDish, ['gluten'])).toEqual([{ campo: 'gluten', motivo: 'desconocida' }]);
  });

  it('scaffold viola ambos campos a la vez cuando ambos estan en la lista de intolerancias (ambos campos son "desconocida")', () => {
    expect(evaluateVeto(scaffoldDish, ['gluten', 'lactosa'])).toEqual([
      { campo: 'gluten', motivo: 'desconocida' },
      { campo: 'lactosa', motivo: 'desconocida' },
    ]);
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
      return v.origen === 'freeform' && v.containsGluten.valor === true;
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
      return v.origen === 'freeform' && v.containsGluten.valor === true;
    });
    const scaffoldDish = find((d) => resolveDishComposition(d).origen === 'scaffold' && d.rol === 'rotativo');
    const catalogoAislado = [freeformGlutenTrue, scaffoldDish];

    const { vetoedIds, conteo, activo } = computeVetoUniverse(catalogoAislado, ['gluten']);
    expect(activo).toBe(true);
    expect(vetoedIds.size).toBe(2);
    expect(conteo.gluten).toEqual({ valor: 1, desconocida: 1 });
  });
});
