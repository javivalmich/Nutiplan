// Red de D-116.5 por pool vacío (revisión independiente, arreglo 2; Javi, 2026-11-17): si el walk con la regla de
// D-116 y D-117 activa se queda sin platos, la semana se repite con la regla apagada aunque no hubiera ningún
// segundo colocado. Como mucho 4 walks por semana. Catálogo recortado: 3 primeros de legumbre, ningún plato que
// valga de segundo y cenas de sobra, así que la comida se queda sin platos el jueves (con la regla o sin ella).
import { describe, it, expect } from 'vitest';
import { materializePlan } from '../../materializePlan.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { esCompuestoLegumbre, esSegundoDeLegumbre } from '../../dishes/bases.js';

const cat = loadCatalog();
const recortado = [
  ...cat.filter((d) => d.rol === 'rotativo' && esCompuestoLegumbre(d)).slice(0, 3),
  ...cat.filter((d) => d.rol === 'rotativo' && !d.momento.includes('comida') && !esSegundoDeLegumbre(d)),
];
const intentar = (seed, catalog) => { try { materializePlan({ profile: { trainingDays: [] }, seed, strategy: 'mantenimiento_equilibrado', catalog }); return null; } catch (e) { return e; } };

describe('red de D-116.5 por pool vacío sin segundos', () => {
  it('la semana se repite con la regla apagada antes de dar el fallo por bueno, y como mucho son 4 walks', () => {
    for (const seed of ['red-1', 'red-2', 'red-3']) {
      const err = intentar(seed, recortado);
      expect(err && err.poolVacio).toBe(true);
      expect(err.segundosColocadosConLaRegla).toBe(0);
      expect(err.walks.some((w) => /^con la regla/.test(w))).toBe(true);
      expect(err.walks.some((w) => /^sin la regla/.test(w))).toBe(true);
      expect(err.walks.length).toBeLessThanOrEqual(4);
    }
  });

  it('con el catálogo entero no hay fallo ni repetición', () => {
    expect(intentar('red-1', cat)).toBeNull();
  });
});
