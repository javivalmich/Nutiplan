// Revisión independiente, arreglo 5 (2026-11-17): los segundos de la comida de legumbre son platos que el catálogo
// marca solo como de cena (D-116.2), y los primeros, solo como de comida. Si el catálogo cambia y un segundo pasa a
// valer también para la comida (o un primero para la cena), este test avisa: el walk los podría servir dos veces de
// formas distintas (de segundo y como comida, o de primero y como cena).
import { describe, it, expect } from 'vitest';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { materializePlan } from '../../materializePlan.js';
import { esCompuestoLegumbre, esSegundoDeLegumbre } from '../../dishes/bases.js';

const catalog = loadCatalog();
const porId = new Map(catalog.map((d) => [d.id, d]));

describe('momentos de los primeros y los segundos de la comida de legumbre', () => {
  it('en el catálogo, los primeros son solo de comida y los segundos solo de cena', () => {
    const primeros = catalog.filter(esCompuestoLegumbre);
    const segundos = catalog.filter(esSegundoDeLegumbre);
    expect(primeros.length).toBe(14);
    expect(segundos.length).toBe(23);
    expect(primeros.filter((d) => d.momento.length !== 1 || d.momento[0] !== 'comida').map((d) => d.nombre)).toEqual([]);
    expect(segundos.filter((d) => d.momento.length !== 1 || d.momento[0] !== 'cena').map((d) => d.nombre)).toEqual([]);
  });

  it('en semanas reales, cada primero sale en la comida y cada segundo es un plato de cena', () => {
    let n = 0;
    for (let s = 0; s < 20; s++) {
      const plan = materializePlan({ profile: { trainingDays: [] }, seed: `momentos-${s}`, strategy: 'mantenimiento_equilibrado', catalog });
      for (const d of plan.days) {
        for (const m of d.meals) {
          if (!m.segundo) continue;
          n += 1;
          expect(m.momento).toBe('comida');
          expect(porId.get(m.dish.id).momento).toEqual(['comida']);
          expect(porId.get(m.segundo.id).momento).toEqual(['cena']);
        }
      }
    }
    expect(n).toBeGreaterThan(30);
  });
});
