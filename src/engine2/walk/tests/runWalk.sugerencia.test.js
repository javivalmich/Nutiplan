// runWalk - la sugerencia de la comida libre no es consumo (decision de Javi,
// 2026-11-13). La comida del dia libre (sabado) es libre: el plato que elige el
// walk queda solo como sugerencia (materializePlan lo marca `libre`, D-099.3.i).
// Por eso no sube los contadores de los suelos semanales ni marca la verdura
// del dia, y el paso 4 no la dirige. Sigue contando para no repetir plato.

import { describe, it, expect } from 'vitest';
import { runWalk } from '../runWalk.js';
import { satisfaceVerdura } from '../frequencies.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';
import { proteinaPrincipal } from '../../dishes/bases.js';
import { alinoDe } from '../../dishes/alinosD105.js';
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
const vista = (d) => resolveDishComposition(d);
const soloDe = (momento) => (d) => d.momento.length === 1 && d.momento[0] === momento;
const sinAlino = (d) => !alinoDe(d);

// Platos reales, elegidos por lo que son (no por su id). Los alinos se eligen
// distintos donde dos platos comparten dia, para que el filtro de D-105 no intervenga.
const aveComidaConVerdura = real.find((d) => soloDe('comida')(d) && vista(d).proteinType === 'ave' && satisfaceVerdura(vista(d)));
const carneCenaConVerdura = real.find((d) => soloDe('cena')(d) && vista(d).proteinType === 'carne' && satisfaceVerdura(vista(d))
  && alinoDe(d) !== alinoDe(aveComidaConVerdura));
const carneCenaSinVerdura = real.find((d) => soloDe('cena')(d) && sinAlino(d) && vista(d).proteinType === 'carne' && !satisfaceVerdura(vista(d)));
const pescadoComida = real.find((d) => soloDe('comida')(d) && vista(d).proteinType === 'pescado' && alinoDe(d) !== alinoDe(aveComidaConVerdura));
// Estos dos valen tambien para la comida en el catalogo: aqui se dejan solo de cena, para que
// no entren en el hueco de la sugerencia.
const soloCena = (d) => (d ? { ...d, momento: ['cena'] } : d);
const pescadoCenaSinVerdura = soloCena(real.find((d) => d.momento.includes('cena') && sinAlino(d) && vista(d).proteinType === 'pescado' && !satisfaceVerdura(vista(d))
  && proteinaPrincipal(d) !== proteinaPrincipal(pescadoComida)));
const aveCenaSinVerdura = soloCena(real.find((d) => d.momento.includes('cena') && sinAlino(d) && vista(d).proteinType === 'ave' && !satisfaceVerdura(vista(d))));
const dosMomentos = real.find((d) => d.momento.includes('comida') && d.momento.includes('cena'));
const otraCena = real.find((d) => soloDe('cena')(d) && d.id !== dosMomentos.id && proteinaPrincipal(d) !== proteinaPrincipal(dosMomentos));

describe('runWalk: la sugerencia de la comida libre no es consumo', () => {
  it('fixtures reales localizadas', () => {
    for (const d of [aveComidaConVerdura, carneCenaConVerdura, carneCenaSinVerdura, pescadoComida, pescadoCenaSinVerdura, aveCenaSinVerdura, dosMomentos, otraCena]) expect(d).toBeDefined();
  });

  it('no marca la verdura del dia: la cena del sabado sigue buscando verdura', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Sabado', momento: 'comida' }, { day: 'Sabado', momento: 'cena' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, aveComidaConVerdura, carneCenaConVerdura, carneCenaSinVerdura];
    for (let seed = 0; seed < SEEDS; seed++) {
      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `sugerencia-verdura-${seed}` });
      expect(slots.find((s) => s.day === 'Sabado' && s.momento === 'comida').dishId).toBe(aveComidaConVerdura.id);
      expect(slots.find((s) => s.day === 'Sabado' && s.momento === 'cena').dishId).toBe(carneCenaConVerdura.id);
      const cena = decisionLog.find((e) => e.day === 'Sabado' && e.momento === 'cena');
      expect(cena.evidencia).toContain('Sabado sin verdura aun');
    }
  });

  it('no sube el contador del suelo ni veda el dia siguiente: la cena del domingo atiende el suelo de pescado con el contador a 0', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Sabado', momento: 'comida' }, { day: 'Domingo', momento: 'cena' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, pescadoComida, pescadoCenaSinVerdura, aveCenaSinVerdura];
    for (let seed = 0; seed < SEEDS; seed++) {
      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `sugerencia-suelo-${seed}` });
      expect(slots.find((s) => s.day === 'Sabado' && s.momento === 'comida').dishId).toBe(pescadoComida.id);
      expect(slots.find((s) => s.day === 'Domingo' && s.momento === 'cena').dishId).toBe(pescadoCenaSinVerdura.id);
      const cena = decisionLog.find((e) => e.day === 'Domingo' && e.momento === 'cena');
      expect(cena.evidencia).toContain('target="pescado" corto (contador 0/3)');
    }
  });

  it('el paso 4 no dirige la sugerencia y el log dice por que', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Sabado', momento: 'comida' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, aveComidaConVerdura, pescadoComida];
    const ganadores = new Set();
    for (let seed = 0; seed < SEEDS; seed++) {
      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `sugerencia-paso4-${seed}` });
      ganadores.add(slots.find((s) => s.day === 'Sabado' && s.momento === 'comida').dishId);
      const entry = decisionLog.find((e) => e.day === 'Sabado' && e.momento === 'comida');
      expect(entry.evidencia).not.toContain('paso 4:');
      expect(entry.evidencia).toContain('sugerencia de la comida libre');
    }
    expect([...ganadores].sort()).toEqual([aveComidaConVerdura.id, pescadoComida.id].sort());
  });

  it('sigue contando para no repetir plato: lo sugerido no vuelve a salir en la semana', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Sabado', momento: 'comida' }, { day: 'Domingo', momento: 'cena' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, dosMomentos, otraCena];
    for (let seed = 0; seed < SEEDS; seed++) {
      const { slots } = runWalk({ weekArc, catalog, seed: `sugerencia-repetir-${seed}` });
      expect(slots.find((s) => s.day === 'Sabado' && s.momento === 'comida').dishId).toBe(dosMomentos.id);
      expect(slots.find((s) => s.day === 'Domingo' && s.momento === 'cena').dishId).toBe(otraCena.id);
    }
  });

  it('fuera del dia libre nada cambia: una comida de martes si marca la verdura del dia', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Martes', momento: 'comida' }, { day: 'Martes', momento: 'cena' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, aveComidaConVerdura, carneCenaConVerdura, carneCenaSinVerdura];
    for (let seed = 0; seed < SEEDS; seed++) {
      const { decisionLog } = runWalk({ weekArc, catalog, seed: `sugerencia-martes-${seed}` });
      const cena = decisionLog.find((e) => e.day === 'Martes' && e.momento === 'cena');
      expect(cena.evidencia).not.toContain('sin verdura aun');
    }
  });
});
