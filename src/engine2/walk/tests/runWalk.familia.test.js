// runWalk - no repetir familia proteica en dias seguidos (decision de Javi,
// 2026-11-13; extiende D-099.3.e, que separa por proteina principal).
// Familia = proteinType del plato, con pescado y marisco como UNA sola familia.
// Solo dietas omnivoras. Es un filtro con vuelta atras: si dejaria el hueco sin
// candidatos, no se aplica y la evidencia lo dice. No mira la comida y la cena
// del mismo dia, no cuenta la sugerencia de la comida libre y no toca los
// platos del ancla (P1a los coloca antes del walk).

import { describe, it, expect } from 'vitest';
import { runWalk } from '../runWalk.js';
import { expandWeekArc } from '../expandWeekArc.js';
import { satisfaceVerdura } from '../frequencies.js';
import { buildWeekArc } from '../../skeleton/buildWeekArc.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { aplicarAjustesD099 } from '../../dishes/ajustesD099.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';
import { proteinaPrincipal, familiaProteica } from '../../dishes/bases.js';
import { DAYS_ORDER } from '../../skeleton/days.js';
import { MOMENTOS } from '../../dishes/schema.js';

const SEEDS = 16;

function beats7() {
  return DAYS_ORDER.map((day) => ({ day, density: 'medio', slotRole: 'rotativo', ...(day === 'Sabado' ? { fixedRole: 'libre' } : {}) }));
}

/** Ancla sintetica en todos los huecos menos los indicados (mismo patron que runWalk.frequencies.test.js). */
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
const tipo = (d) => resolveDishComposition(d).proteinType;
const conVerdura = (d) => satisfaceVerdura(resolveDishComposition(d));
// Copias de platos reales con el momento fijado, para aislar cada hueco.
const de = (momento, cond) => { const d = real.find(cond); return d ? { ...d, momento: [momento] } : d; };

const pescadoCena = de('cena', (d) => d.momento.includes('cena') && tipo(d) === 'pescado');
const mariscoComida = de('comida', (d) => d.momento.includes('comida') && tipo(d) === 'marisco' && conVerdura(d));
const aveComida = de('comida', (d) => d.momento.includes('comida') && tipo(d) === 'ave' && conVerdura(d));
const pescadoComida = de('comida', (d) => d.momento.includes('comida') && tipo(d) === 'pescado' && conVerdura(d)
  && proteinaPrincipal(d) !== proteinaPrincipal(pescadoCena));
const mariscoCena = de('cena', (d) => d.momento.includes('cena') && tipo(d) === 'marisco');
const aveCena = de('cena', (d) => d.momento.includes('cena') && tipo(d) === 'ave');

const NOTA = 'familia en dias seguidos';

describe('runWalk: no repetir familia proteica en dias seguidos', () => {
  it('fixtures reales localizadas; pescado y marisco son la misma familia', () => {
    for (const d of [pescadoCena, mariscoComida, aveComida, pescadoComida, mariscoCena, aveCena]) expect(d).toBeDefined();
    expect(familiaProteica(pescadoCena)).toBe('pescado');
    expect(familiaProteica(mariscoComida)).toBe('pescado');
    expect(familiaProteica(aveComida)).toBe('ave');
    expect(familiaProteica({ id: 'no-resoluble' })).toBe(null);
  });

  it('tras un pescado el lunes, el marisco del martes queda descartado y la evidencia lo dice', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Lunes', momento: 'cena' }, { day: 'Martes', momento: 'comida' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, pescadoCena, mariscoComida, aveComida];
    for (let seed = 0; seed < SEEDS; seed++) {
      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `familia-${seed}` });
      expect(slots.find((s) => s.day === 'Lunes' && s.momento === 'cena').dishId).toBe(pescadoCena.id);
      expect(slots.find((s) => s.day === 'Martes' && s.momento === 'comida').dishId).toBe(aveComida.id);
      const entry = decisionLog.find((e) => e.day === 'Martes' && e.momento === 'comida');
      expect(entry.evidencia).toContain(`${NOTA}: descarta 1 candidatos de pescado`);
    }
  });

  it('si dejaria el hueco sin candidatos, no se aplica y queda en el log', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Lunes', momento: 'cena' }, { day: 'Martes', momento: 'comida' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, pescadoCena, mariscoComida, pescadoComida];
    for (let seed = 0; seed < SEEDS; seed++) {
      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `familia-sin-${seed}` });
      expect([mariscoComida.id, pescadoComida.id]).toContain(slots.find((s) => s.day === 'Martes' && s.momento === 'comida').dishId);
      const entry = decisionLog.find((e) => e.day === 'Martes' && e.momento === 'comida');
      expect(entry.evidencia).toContain(`${NOTA} sin aplicar: dejaria el hueco sin candidatos`);
    }
  });

  it('solo dietas omnivoras: con dieta vegetariana o vegana el filtro no existe', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Lunes', momento: 'cena' }, { day: 'Martes', momento: 'comida' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, pescadoCena, mariscoComida, aveComida];
    for (const dieta of ['vegetariana', 'vegana']) {
      for (let seed = 0; seed < SEEDS; seed++) {
        const { decisionLog } = runWalk({ weekArc, catalog, seed: `familia-${dieta}-${seed}`, profile: { dieta } });
        expect(decisionLog.find((e) => e.day === 'Martes' && e.momento === 'comida').evidencia).not.toContain(NOTA);
      }
    }
  });

  it('no mira el mismo dia: comida de pescado y cena de marisco no se filtran por esta regla', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Martes', momento: 'comida' }, { day: 'Martes', momento: 'cena' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, pescadoComida, mariscoCena, aveCena];
    for (let seed = 0; seed < SEEDS; seed++) {
      const { decisionLog } = runWalk({ weekArc, catalog, seed: `familia-dia-${seed}` });
      expect(decisionLog.find((e) => e.day === 'Martes' && e.momento === 'cena').evidencia).not.toContain(NOTA);
    }
  });

  it('la sugerencia de la comida libre ni se filtra ni cuenta como vecina', () => {
    // Viernes cena de pescado; la sugerencia del sabado puede ser marisco.
    let a = anchorEverythingExcept([{ day: 'Viernes', momento: 'cena' }, { day: 'Sabado', momento: 'comida' }]);
    for (let seed = 0; seed < SEEDS; seed++) {
      const { decisionLog } = runWalk({ weekArc: { beats: beats7(), anchors: a.anchors }, catalog: [...a.dishes, pescadoCena, mariscoComida, aveComida], seed: `familia-sug-${seed}` });
      expect(decisionLog.find((e) => e.day === 'Sabado' && e.momento === 'comida').evidencia).not.toContain(NOTA);
    }
    // Sugerencia de pescado el sabado; la cena del domingo no la tiene por vecina.
    a = anchorEverythingExcept([{ day: 'Sabado', momento: 'comida' }, { day: 'Domingo', momento: 'cena' }]);
    for (let seed = 0; seed < SEEDS; seed++) {
      const { slots, decisionLog } = runWalk({ weekArc: { beats: beats7(), anchors: a.anchors }, catalog: [...a.dishes, pescadoComida, mariscoCena, aveCena], seed: `familia-sug2-${seed}` });
      expect(slots.find((s) => s.day === 'Sabado' && s.momento === 'comida').dishId).toBe(pescadoComida.id);
      expect(decisionLog.find((e) => e.day === 'Domingo' && e.momento === 'cena').evidencia).not.toContain(NOTA);
    }
  });

  it('no toca el ancla: los platos que coloca P1a (cocinar y aprovechar) salen igual del walk', () => {
    const catalog = aplicarAjustesD099(loadCatalog());
    let conAncla = 0;
    for (let seed = 0; seed < 12; seed++) {
      const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed: `familia-ancla-${seed}`, strategy: 'x', cocinarEnCantidad: { activo: true, dia: 'Domingo' } });
      const p1a = expandWeekArc({ weekArc, catalog, seed: `familia-ancla-${seed}` }).slots.filter((s) => !s.abierto && s.dishId);
      const { slots } = runWalk({ weekArc, catalog, seed: `familia-ancla-${seed}` });
      if (p1a.length) conAncla += 1;
      for (const s of p1a) expect(slots.find((x) => x.day === s.day && x.momento === s.momento).dishId).toBe(s.dishId);
      expect(slots.every((s) => !s.abierto && s.dishId)).toBe(true);
    }
    expect(conAncla).toBeGreaterThan(0);
  });

  it('catalogo real: en semanas sin ancla, ninguna familia se repite en dias seguidos entre los platos servidos', () => {
    const catalog = aplicarAjustesD099(loadCatalog());
    const porId = new Map(catalog.map((d) => [d.id, d]));
    for (let seed = 0; seed < 12; seed++) {
      const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed: `familia-real-${seed}`, strategy: 'x' });
      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `familia-real-${seed}` });
      const sinAplicar = decisionLog.some((e) => String(e.evidencia || '').includes(`${NOTA} sin aplicar`));
      if (sinAplicar) continue;
      const servidos = slots.filter((s) => !(s.day === 'Sabado' && s.momento === 'comida'));
      const familias = (day) => new Set(servidos.filter((s) => s.day === day).map((s) => familiaProteica(porId.get(s.dishId))).filter(Boolean));
      for (let i = 0; i < 6; i++) {
        const hoy = familias(DAYS_ORDER[i]);
        const manana = familias(DAYS_ORDER[i + 1]);
        expect([...hoy].filter((f) => manana.has(f))).toEqual([]);
      }
    }
  });
});
