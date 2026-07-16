// runWalk.identidad.test.js — Fase 4, Componente P2b-iii (paso 5 del
// walk: identidad de verdura, D-044). Integracion end-to-end contra el
// walk real (RNG real, decisionLog real, catalogo real) -- el mecanismo
// puro (particion, INV-1, INV-2, apagable, narracion) vive en
// identity.test.js con vistas sinteticas; este archivo cubre lo que solo
// el walk completo puede probar: que un ancla real (P1a) compromete una
// identidad que influye en una eleccion rotativa (P1b) posterior, con RNG
// y log reales (D-044 punto 10, criterios v y vii).
//
// Fixtures reales localizadas dinamicamente (mismo principio que
// runWalk.frequencies.test.js: nunca ids hardcodeados sin verificar) --
// ver "fixtures reales localizadas" mas abajo para la traza exacta de
// como se encontraron.

import { describe, it, expect } from 'vitest';
import { runWalk } from '../runWalk.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';
import { DAYS_ORDER } from '../../skeleton/days.js';
import { MOMENTOS } from '../../dishes/schema.js';

const DIAS = DAYS_ORDER;
const catalogReal = loadCatalog();

// Ancla real cuya verdura deriva estructuralmente de su tupla (D-021: sin
// necesidad de fuenteEditorial -- V/V2 siempre se derivan para scaffold).
const anclaTomate = catalogReal.find((d) => d.id === '["sopa_crema","huevo",null,"tomate",null,null,"crudo"]');
// Rotativo/comida que REPITE la identidad del ancla ('tomate').
const rotativoRepite = catalogReal.find((d) => d.id === '["pasta","pollo","pasta","tomate",null,"tomate_casero","salteado"]');
// Rotativo/comida con identidad DISJUNTA ('brocoli') -- ni proteinType
// coincide con un target de frecuencias (ambos son "ave", fuera de
// {legumbre,pescado}), para que el paso 4 no discrimine entre ambos antes
// de que el paso 5 tenga oportunidad de hacerlo.
const rotativoNuevo = catalogReal.find((d) => d.id === '["caliente_clasico","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]');

function beat(day, overrides = {}) {
  return { day, density: 'medio', slotRole: 'rotativo', ...overrides };
}
function beats7() {
  return DIAS.map((day) => beat(day));
}

/** Ancla sintetica (no resoluble, D-024) para cada hueco EXCLUIDO -- aisla
 * el pool del hueco objetivo (mismo patron que anchorEverythingExcept de
 * runWalk.frequencies.test.js), generalizado para excluir varios huecos
 * ya cerrados por OTRO mecanismo (aqui, un ancla real). */
function anchorFillExcluding(excludedSlots) {
  const excludedSet = new Set(excludedSlots.map(({ day, momento }) => `${day}::${momento}`));
  const anchors = [];
  const dishes = [];
  let n = 0;
  for (const day of DIAS) {
    for (const momento of MOMENTOS) {
      const key = `${day}::${momento}`;
      if (excludedSet.has(key)) continue;
      const id = `anchorFill${n++}`;
      anchors.push({ anchorId: id, cookDay: day, leftoverDays: [] });
      dishes.push({
        id, rol: 'ancla', momento: [momento], plateType: `ancla_${day}_${momento}`, tempFeel: 'neutro', energiaCocina: 'medio',
      });
    }
  }
  return { anchors, dishes };
}

describe('runWalk - v17: identidad de verdura (P2b-iii, paso 5 del walk, D-044)', () => {
  it('fixtures reales localizadas: ancla "tomate" + rotativo que repite + rotativo disjunto, ambos "ave" (fuera de targets de paso 4)', () => {
    expect(anclaTomate).toBeDefined();
    expect(rotativoRepite).toBeDefined();
    expect(rotativoNuevo).toBeDefined();
    expect(resolveDishComposition(anclaTomate).verdura.valorEfectivo).toEqual(['tomate']);
    expect(resolveDishComposition(rotativoRepite).verdura.valorEfectivo).toEqual(['tomate']);
    expect(resolveDishComposition(rotativoNuevo).verdura.valorEfectivo).toEqual(['brocoli']);
    expect(resolveDishComposition(rotativoRepite).proteinType).toBe('ave');
    expect(resolveDishComposition(rotativoNuevo).proteinType).toBe('ave');
  });

  it('(v)+(vii): identidad comprometida SOLO por el ancla (P1a) descarta al rotativo (P1b) que la repite -- determinista en 5 seeds, sin RNG (nivel=1)', () => {
    // Lunes/comida: ancla real "tomate" (P1a). Miercoles/comida: hueco
    // objetivo, abierto, pool = {rotativoRepite, rotativoNuevo}. Martes de
    // por medio (sintetico, tempFeel/plateType neutros) para que
    // preferencia A/B no interfieran con el hueco objetivo.
    const excluidos = [{ day: 'Lunes', momento: 'comida' }, { day: 'Miercoles', momento: 'comida' }];
    const { anchors: syntheticAnchors, dishes: syntheticDishes } = anchorFillExcluding(excluidos);

    const weekArc = {
      beats: beats7(),
      anchors: [
        { anchorId: anclaTomate.id, cookDay: 'Lunes', leftoverDays: [] },
        ...syntheticAnchors,
      ],
    };
    const catalog = [...syntheticDishes, anclaTomate, rotativoRepite, rotativoNuevo];

    for (let seed = 0; seed < 5; seed++) {
      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `v17-${seed}` });
      const miercolesComida = slots.find((s) => s.day === 'Miercoles' && s.momento === 'comida');

      expect(miercolesComida.dishId).toBe(rotativoNuevo.id); // el que repite NUNCA gana
      expect(miercolesComida.dishId).not.toBe(rotativoRepite.id);

      const entry = decisionLog.find((d) => d.day === 'Miercoles' && d.momento === 'comida');
      expect(entry.causa).toBe('seleccion_rotativo_candidato_unico'); // paso 5 ya redujo el nivel a 1: sin RNG
      expect(entry.evidencia).toContain('paso 5:');
      expect(entry.evidencia).toMatch(/coste minimo/);
      expect(entry.evidencia).toContain(rotativoRepite.id); // descartado, citado por id
    }
  });

  it('control -- SIN el ancla previa comprometiendo "tomate" (memoria vacia), ambos candidatos empatan: paso 5 no interviene, decide el sorteo (rojo del criterio vii)', () => {
    // Mismo hueco objetivo y mismo pool, pero AHORA el ancla de Lunes es
    // sintetica (no resoluble -> vista neutral, no compromete "tomate").
    // Sin memoria previa, ambos candidatos tienen coste 0: paso 5 no
    // discrimina (causa null) y el desempate queda en manos del RNG --
    // ambos ids deben aparecer ganando en algunas de las seeds.
    const excluidos = [{ day: 'Miercoles', momento: 'comida' }];
    const { anchors: syntheticAnchors, dishes: syntheticDishes } = anchorFillExcluding(excluidos);
    const weekArc = { beats: beats7(), anchors: syntheticAnchors };
    const catalog = [...syntheticDishes, rotativoRepite, rotativoNuevo];

    const ganadores = new Set();
    for (let seed = 0; seed < 8; seed++) {
      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `v17-control-${seed}` });
      const miercolesComida = slots.find((s) => s.day === 'Miercoles' && s.momento === 'comida');
      ganadores.add(miercolesComida.dishId);
      const entry = decisionLog.find((d) => d.day === 'Miercoles' && d.momento === 'comida');
      expect(entry.evidencia).not.toContain('paso 5:'); // sin memoria previa, empate: paso 5 muda (D-044 punto 8)
    }
    // Sin el mecanismo influyendo (memoria vacia), AMBOS candidatos ganan
    // en algun seed -- confirma que la exclusion determinista del test
    // anterior viene del paso 5, no de otra causa estructural del pool.
    expect([...ganadores].sort()).toEqual([rotativoNuevo.id, rotativoRepite.id].sort());
  });
});
