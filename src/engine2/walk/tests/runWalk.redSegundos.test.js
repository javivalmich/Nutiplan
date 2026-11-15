// runWalk - red de seguridad de los segundos (D-116.5).
// El segundo añade apariciones de proteina a la semana y, en un catalogo con
// pocas especies, puede dejarla con alguna infraccion de D-099.3 (plato
// repetido en la semana o de la anterior, una especie mas de 2 veces, el mismo
// dia o en dias seguidos salvo el ancla, legumbre en la cena). Si la semana
// termina asi, el walk se repite ENTERO sin segundos, con la misma semilla: los
// dias sorteados siguen y la legumbre va como plato unico. El log lo dice con
// la causa segundos_retirados_d099 y la lista de infracciones.

import { describe, it, expect } from 'vitest';
import { runWalk } from '../runWalk.js';
import { infraccionesD099 } from '../legumbre.js';
import { buildWeekArc } from '../../skeleton/buildWeekArc.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { aplicarAjustesD099 } from '../../dishes/ajustesD099.js';
import { proteinaPrincipal, familiaProteica, esSegundoDeLegumbre } from '../../dishes/bases.js';
import { DAYS_ORDER } from '../../skeleton/days.js';
import { MOMENTOS } from '../../dishes/schema.js';

function beats7() {
  return DAYS_ORDER.map((day) => ({ day, density: 'medio', slotRole: 'rotativo', ...(day === 'Sabado' ? { fixedRole: 'libre' } : {}) }));
}

function anchorEverythingExcept(openSlots) {
  const openSet = new Set(openSlots.map(({ day, momento }) => `${day}::${momento}`));
  const anchors = [];
  const dishes = [];
  let n = 0;
  for (const day of DAYS_ORDER) {
    for (const momento of MOMENTOS) {
      if (openSet.has(`${day}::${momento}`)) continue;
      const id = `anchorFill${n++}`;
      anchors.push({ anchorId: id, cookDay: day, leftoverDays: [] });
      dishes.push({ id, rol: 'ancla', momento: [momento], plateType: `ancla_${day}_${momento}`, tempFeel: 'neutro', energiaCocina: 'medio' });
    }
  }
  return { anchors, dishes };
}

const real = loadCatalog().filter((d) => d.rol === 'rotativo');
const lentejas = { ...real.find((d) => d.nombre === 'Lentejas con pimentón con zanahoria'), momento: ['comida'] };
const pollos = real.filter((d) => esSegundoDeLegumbre(d) && proteinaPrincipal(d) === 'pollo').slice(0, 2);
const MIERCOLES = [{ day: 'Miercoles', momento: 'comida' }, { day: 'Miercoles', momento: 'cena' }];
const retirada = (r) => r.decisionLog.filter((e) => e.causa === 'segundos_retirados_d099');

describe('runWalk: red de seguridad de los segundos (D-116.5)', () => {
  // El miercoles solo hay pollo para el segundo y para la cena: con segundo, pollo dos veces el mismo dia.
  const { anchors, dishes } = anchorEverythingExcept(MIERCOLES);
  const corto = { weekArc: { beats: beats7(), anchors }, catalog: [...dishes, lentejas, ...pollos], seed: 'red-segundos' };

  it('si con los segundos la semana incumple D-099.3, se repite sin segundos y el log lo dice', () => {
    for (let s = 0; s < 8; s++) {
      const input = { ...corto, seed: `red-segundos-${s}` };
      const r = runWalk(input);
      expect(r.slots).toHaveLength(14);
      expect(r.slots.every((x) => !x.abierto && x.dishId)).toBe(true);
      expect(r.segundos).toEqual([]);
      expect(r.decisionLog.some((e) => e.causa === 'segundo_de_legumbre')).toBe(false);
      // Los dias sorteados siguen y la legumbre va como plato unico.
      expect(r.decisionLog.find((e) => e.causa === 'dias_legumbre_sorteados').dias).toEqual(['Miercoles']);
      expect(r.slots.find((x) => x.day === 'Miercoles' && x.momento === 'comida').dishId).toBe(lentejas.id);
      const ev = retirada(r);
      expect(ev).toHaveLength(1);
      expect(ev[0].evento).toBe(true);
      expect(ev[0].infracciones).toEqual(['Miercoles: pollo dos veces el mismo dia']);
      expect(ev[0].evidencia).toContain('pollo dos veces el mismo dia');
      expect(infraccionesD099(input, r)).toEqual([]);
    }
  });

  it('es determinista: dos ejecuciones dan lo mismo', () => {
    expect(JSON.stringify(runWalk(corto))).toBe(JSON.stringify(runWalk(corto)));
  });

  it('sin infracciones no se retira nada', () => {
    const ternera = real.find((d) => esSegundoDeLegumbre(d) && proteinaPrincipal(d) === 'ternera');
    const r = runWalk({ ...corto, catalog: [...dishes, lentejas, pollos[0], ternera] });
    expect(r.segundos).toHaveLength(1);
    expect(retirada(r)).toHaveLength(0);
  });

  it('sin segundos no hay nada que retirar: una semana que ya incumplia sin ellos no se repite', () => {
    // Un plato repetido por catalogo corto (D-107), sin ningun segundo en la semana: la red no es para eso.
    const abiertos = [{ day: 'Lunes', momento: 'cena' }, { day: 'Miercoles', momento: 'cena' }];
    const a = anchorEverythingExcept(abiertos);
    const r = runWalk({ weekArc: { beats: beats7(), anchors: a.anchors }, catalog: [...a.dishes, pollos[0]], seed: 'red-sin-segundos', maxRepeticiones: 2 });
    expect(r.slots.filter((x) => x.dishId === pollos[0].id)).toHaveLength(2);
    expect(retirada(r)).toHaveLength(0);
  });

  it('catalogo real sin pescado ni marisco: ninguna semana sale con infracciones, y la red actua alguna vez', () => {
    const catalog = aplicarAjustesD099(loadCatalog()).filter((d) => !['pescado'].includes(familiaProteica(d)));
    let retiradas = 0;
    let conSegundos = 0;
    let recientes = [];
    for (let s = 0; s < 60; s++) {
      const seed = `red-real-${s}`;
      const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });
      const input = { weekArc, catalog, seed, platosRecientes: recientes };
      const r = runWalk(input);
      expect(infraccionesD099(input, r)).toEqual([]);
      if (retirada(r).length) { retiradas += 1; expect(r.segundos).toEqual([]); } else if (r.segundos.length) conSegundos += 1;
      recientes = [...r.slots.map((x) => x.dishId), ...r.segundos.map((x) => x.dishId)];
    }
    expect(retiradas).toBeGreaterThan(0);
    expect(conSegundos).toBeGreaterThan(retiradas);
  });

  it('catalogo real completo: ninguna semana sale con infracciones de D-099.3', () => {
    const catalog = aplicarAjustesD099(loadCatalog());
    let recientes = [];
    for (let s = 0; s < 40; s++) {
      const seed = `red-omni-${s}`;
      const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });
      const input = { weekArc, catalog, seed, platosRecientes: recientes };
      const r = runWalk(input);
      expect(infraccionesD099(input, r)).toEqual([]);
      recientes = [...r.slots.map((x) => x.dishId), ...r.segundos.map((x) => x.dishId)];
    }
  });
});
