// runWalk - la preferencia B no mira la sugerencia de la comida libre
// (decision de Javi, 2026-11-14; amplia D-114). La comida del dia libre
// (sabado) no se sirve: el plato elegido queda solo como sugerencia. La
// preferencia B (no tres comidas seguidas con el mismo tempFeel) no la cuenta
// como comida anterior: con la sugerencia como «ayer» o «anteayer», no hay
// racha de dos comidas servidas y B no se aplica. Fuera de eso, B sigue igual.

import { describe, it, expect } from 'vitest';
import { runWalk } from '../runWalk.js';
import { satisfaceVerdura } from '../frequencies.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';
import { proteinaPrincipal } from '../../dishes/bases.js';
import { DAYS_ORDER } from '../../skeleton/days.js';
import { MOMENTOS } from '../../dishes/schema.js';

const SEEDS = 16;

function beats7() {
  return DAYS_ORDER.map((day) => ({ day, density: 'medio', slotRole: 'rotativo', ...(day === 'Sabado' ? { fixedRole: 'libre' } : {}) }));
}

/**
 * Ancla sintetica en todos los huecos menos el abierto (mismo patron que
 * runWalk.sugerencia.test.js), con el tempFeel indicado en algunos huecos.
 */
function anclasConTempFeel(abierto, tempFeelPorHueco) {
  const anchors = [];
  const dishes = [];
  let n = 0;
  for (const day of DAYS_ORDER) {
    for (const momento of MOMENTOS) {
      if (day === abierto.day && momento === abierto.momento) continue;
      const id = `anchorFill${n++}`;
      anchors.push({ anchorId: id, cookDay: day, leftoverDays: [] });
      dishes.push({ id, rol: 'ancla', momento: [momento], plateType: `ancla_${day}_${momento}`, tempFeel: tempFeelPorHueco[`${day}::${momento}`] || 'neutro', energiaCocina: 'medio' });
    }
  }
  return { anchors, dishes };
}

const real = loadCatalog().filter((d) => d.rol === 'rotativo');
const vista = (d) => resolveDishComposition(d);
const deComida = (d) => d.momento.length === 1 && d.momento[0] === 'comida';
// Dos platos reales de comida, de ave o carne y con verdura (el paso 4 los deja
// en el mismo nivel) y de distinta proteina: solo los separa el tempFeel. El resto
// de la semana son anclas sinteticas sin alino, asi que D-105 no interviene.
const apto = (d) => deComida(d) && ['ave', 'carne'].includes(vista(d).proteinType) && satisfaceVerdura(vista(d));
const muyCaliente = real.find((d) => apto(d) && d.tempFeel === 'muy_caliente');
const caliente = real.find((d) => apto(d) && d.tempFeel === 'caliente' && proteinaPrincipal(d) !== proteinaPrincipal(muyCaliente));

function ganadores(abierto, tempFeelPorHueco, etiqueta) {
  const { anchors, dishes } = anclasConTempFeel(abierto, tempFeelPorHueco);
  const weekArc = { beats: beats7(), anchors };
  const catalog = [...dishes, muyCaliente, caliente];
  const out = new Set();
  let evidencia = null;
  for (let seed = 0; seed < SEEDS; seed++) {
    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `${etiqueta}-${seed}` });
    out.add(slots.find((s) => s.day === abierto.day && s.momento === abierto.momento).dishId);
    evidencia = decisionLog.find((e) => e.day === abierto.day && e.momento === abierto.momento).evidencia;
  }
  return { ganadores: out, evidencia };
}

describe('runWalk: la preferencia B no mira la sugerencia de la comida libre', () => {
  it('fixtures reales localizadas', () => {
    expect(muyCaliente).toBeDefined();
    expect(caliente).toBeDefined();
  });

  it('domingo: viernes y la sugerencia del sabado «muy caliente» no vetan un domingo «muy caliente»', () => {
    const { ganadores: g, evidencia } = ganadores({ day: 'Domingo', momento: 'comida' },
      { 'Viernes::comida': 'muy_caliente', 'Sabado::comida': 'muy_caliente' }, 'b-domingo');
    expect([...g].sort()).toEqual([muyCaliente.id, caliente.id].sort());
    expect(evidencia).toContain('preferencia B no aplica: la comida del Sabado es la sugerencia de la comida libre');
  });

  it('la cena del sabado se sirve: la cena del domingo sigue aplicando B', () => {
    const cenaMuyCaliente = { ...muyCaliente, id: `${muyCaliente.id}::cena`, nombre: `${muyCaliente.nombre} (cena)`, momento: ['cena'] };
    const cenaCaliente = { ...caliente, id: `${caliente.id}::cena`, nombre: `${caliente.nombre} (cena)`, momento: ['cena'] };
    const { anchors, dishes } = anclasConTempFeel({ day: 'Domingo', momento: 'cena' }, { 'Viernes::cena': 'muy_caliente', 'Sabado::cena': 'muy_caliente' });
    const weekArc = { beats: beats7(), anchors };
    for (let seed = 0; seed < SEEDS; seed++) {
      const { slots, decisionLog } = runWalk({ weekArc, catalog: [...dishes, cenaMuyCaliente, cenaCaliente], seed: `b-cena-${seed}` });
      expect(slots.find((s) => s.day === 'Domingo' && s.momento === 'cena').dishId).toBe(cenaCaliente.id);
      expect(decisionLog.find((e) => e.day === 'Domingo' && e.momento === 'cena').evidencia).toContain('preferencia B aplicada');
    }
  });

  it('fuera del dia libre nada cambia: miercoles y jueves «muy caliente» vetan un viernes «muy caliente»', () => {
    const { ganadores: g, evidencia } = ganadores({ day: 'Viernes', momento: 'comida' },
      { 'Miercoles::comida': 'muy_caliente', 'Jueves::comida': 'muy_caliente' }, 'b-viernes');
    expect([...g]).toEqual([caliente.id]);
    expect(evidencia).toContain('preferencia B aplicada: descarta tempFeel="muy_caliente"');
  });
});
