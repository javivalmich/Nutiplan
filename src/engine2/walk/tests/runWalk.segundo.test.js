// runWalk - la legumbre compuesta no va como plato unico (D-116): primero y segundo.
// Tras colocar en la comida un plato compuesto de legumbre, el walk elige un
// segundo: un compuesto de proteina con verdura, sin cereal, de ave o de carne
// (ni pescado, ni marisco, ni huevo). El segundo se come: no repite plato y
// pasa por el tope y la separacion por especie, la familia en dias seguidos y
// el alino, con la misma vuelta atras. Si ninguno cumple el tope de 2 por
// especie, la legumbre va como plato unico. La sugerencia de la comida libre
// y los platos redactados de legumbre no llevan segundo. Solo omnivoros.

import { describe, it, expect } from 'vitest';
import { runWalk as runWalkSinInterruptor } from '../runWalk.js';
import { materializePlan as materializePlanSinInterruptor } from '../../materializePlan.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';
import { proteinaPrincipal, familiaProteica, esCompuestoLegumbre, esSegundoDeLegumbre } from '../../dishes/bases.js';
import { DAYS_ORDER } from '../../skeleton/days.js';
import { MOMENTOS } from '../../dishes/schema.js';
// Paso 8: la regla de D-116 y D-117 está apagada por defecto (interruptor reglaLegumbre).
// Estos tests prueban su código, así que la encienden.
const runWalk = (input) => runWalkSinInterruptor({ reglaLegumbre: true, ...input });
const materializePlan = (input) => materializePlanSinInterruptor({ reglaLegumbre: true, ...input });

const SEEDS = 16;

function beats7() {
  return DAYS_ORDER.map((day) => ({ day, density: 'medio', slotRole: 'rotativo', ...(day === 'Sabado' ? { fixedRole: 'libre' } : {}) }));
}

/** Ancla sintetica en todos los huecos menos los indicados; `forma` puede sustituir el plato de un ancla. */
function anchorEverythingExcept(openSlots, forma = () => ({})) {
  const openSet = new Set(openSlots.map(({ day, momento }) => `${day}::${momento}`));
  const anchors = [];
  const dishes = [];
  let n = 0;
  for (const day of DAYS_ORDER) {
    for (const momento of MOMENTOS) {
      if (openSet.has(`${day}::${momento}`)) continue;
      const dish = { id: `anchorFill${n++}`, rol: 'ancla', momento: [momento], plateType: `ancla_${day}_${momento}`, tempFeel: 'neutro', energiaCocina: 'medio', ...forma(day, momento) };
      anchors.push({ anchorId: dish.id, cookDay: day, leftoverDays: [] });
      dishes.push(dish);
    }
  }
  return { anchors, dishes };
}

const real = loadCatalog().filter((d) => d.rol === 'rotativo');
const vista = (d) => resolveDishComposition(d);
const porNombre = (n) => real.find((d) => d.nombre === n);
const de = (momento, d) => (d ? { ...d, momento: [momento] } : d);
const clasicoSinCereal = (d) => { const t = vista(d).tupla; return !!t && t.tmpl === 'caliente_clasico' && !t.C; };

const lentejas = de('comida', porNombre('Lentejas con pimentón con zanahoria'));
const fabada = de('comida', porNombre('Fabada asturiana simplificada'));
const segundosReales = real.filter(esSegundoDeLegumbre);
const pollos = segundosReales.filter((d) => proteinaPrincipal(d) === 'pollo').slice(0, 3);
const pavo = segundosReales.find((d) => proteinaPrincipal(d) === 'pavo');
const ternera = segundosReales.find((d) => proteinaPrincipal(d) === 'ternera');
const pescadoClasico = real.find((d) => clasicoSinCereal(d) && vista(d).proteinType === 'pescado');
const huevoClasico = real.find((d) => clasicoSinCereal(d) && vista(d).proteinType === 'huevo');
const huevoCena = de('cena', real.find((d) => d.momento.includes('cena') && vista(d).proteinType === 'huevo' && !clasicoSinCereal(d)));

const MIERCOLES = [{ day: 'Miercoles', momento: 'comida' }, { day: 'Miercoles', momento: 'cena' }];
const arco = (anchors) => ({ beats: beats7(), anchors });
const dishAt = (r, day, momento) => r.slots.find((s) => s.day === day && s.momento === momento).dishId;
const causas = (r, causa) => r.decisionLog.filter((e) => e.causa === causa);
const porId = new Map(real.map((d) => [d.id, d]));

describe('runWalk: segundo plato tras un primero de legumbre (D-116)', () => {
  it('fixtures reales localizadas: los segundos son de ave o carne, platos de cena del catalogo', () => {
    for (const d of [lentejas, fabada, pavo, ternera, pescadoClasico, huevoClasico, huevoCena]) expect(d).toBeDefined();
    expect(pollos).toHaveLength(3);
    expect(segundosReales.length).toBeGreaterThan(15);
    for (const d of segundosReales) expect(['ave', 'carne']).toContain(familiaProteica(d));
    expect(esSegundoDeLegumbre(pescadoClasico)).toBe(false);
    expect(esSegundoDeLegumbre(huevoClasico)).toBe(false);
    expect(esSegundoDeLegumbre(lentejas)).toBe(false);
  });

  it('la legumbre compuesta lleva un segundo de ave o carne, y queda en el log con su causa', () => {
    const { anchors, dishes } = anchorEverythingExcept(MIERCOLES);
    const catalog = [...dishes, lentejas, pollos[0], ternera, huevoCena];
    for (let seed = 0; seed < SEEDS; seed++) {
      const r = runWalk({ weekArc: arco(anchors), catalog, seed: `seg-${seed}` });
      expect(r.slots).toHaveLength(14);
      expect(dishAt(r, 'Miercoles', 'comida')).toBe(lentejas.id);
      expect(r.segundos).toHaveLength(1);
      const [s] = r.segundos;
      expect(s).toMatchObject({ day: 'Miercoles', momento: 'comida', primero: lentejas.id });
      expect([pollos[0].id, ternera.id]).toContain(s.dishId);
      const [e] = causas(r, 'segundo_de_legumbre');
      expect(e).toMatchObject({ day: 'Miercoles', momento: 'comida_segundo', plato: s.dishId, primero: lentejas.id });
      expect(e.evidencia).toContain('::walk::estructura');
      // El segundo se come: la cena de ese dia no lo repite, ni repite su especie.
      const cena = dishAt(r, 'Miercoles', 'cena');
      expect(cena).not.toBe(s.dishId);
      expect(proteinaPrincipal(porId.get(cena))).not.toBe(proteinaPrincipal(porId.get(s.dishId)));
    }
  });

  it('nunca pescado ni huevo de segundo; sin ningun segundo posible no se sortean dias (A1) y el log lo dice', () => {
    let { anchors, dishes } = anchorEverythingExcept(MIERCOLES);
    for (let seed = 0; seed < SEEDS; seed++) {
      const r = runWalk({ weekArc: arco(anchors), catalog: [...dishes, lentejas, pescadoClasico, huevoClasico, pollos[0], huevoCena], seed: `seg-fam-${seed}` });
      expect(r.segundos.map((s) => s.dishId)).toEqual([pollos[0].id]);
    }
    // Segunda revisión, A1 (2026-11-22): sin ningún plato que valga de segundo, no hay días sorteados y D-024
    // sigue como antes; la legumbre del miércoles sale por la cascada de siempre, como plato único.
    ({ anchors, dishes } = anchorEverythingExcept(MIERCOLES));
    const r = runWalk({ weekArc: arco(anchors), catalog: [...dishes, lentejas, pescadoClasico, huevoClasico], seed: 'seg-ninguno' });
    expect(r.segundos).toEqual([]);
    expect(causas(r, 'dias_legumbre_sorteados')).toEqual([]);
    expect(causas(r, 'dias_legumbre_sin_sorteo')).toHaveLength(1);
    expect(causas(r, 'dias_legumbre_sin_sorteo')[0].motivo).toBe('sin_segundo_posible');
    expect(causas(r, 'segundo_sin_candidato')).toEqual([]);
  });

  it('(b) si ningun segundo cumple el tope de 2 por especie, la legumbre va como plato unico', () => {
    // Lunes y martes cenan pollo (no hay otra cosa): el miercoles el unico segundo que queda es el tercer pollo.
    const abiertos = [{ day: 'Lunes', momento: 'cena' }, { day: 'Martes', momento: 'cena' }, ...MIERCOLES];
    const { anchors, dishes } = anchorEverythingExcept(abiertos);
    const catalog = [...dishes, lentejas, ...pollos];
    for (let seed = 0; seed < SEEDS; seed++) {
      const r = runWalk({ weekArc: arco(anchors), catalog, seed: `seg-tope-${seed}` });
      expect(dishAt(r, 'Miercoles', 'comida')).toBe(lentejas.id);
      expect(r.segundos).toEqual([]);
      const ev = causas(r, 'segundo_sin_tope_plato_unico');
      expect(ev).toHaveLength(1);
      expect(ev[0].day).toBe('Miercoles');
      expect(ev[0].evento).toBe(true);
    }
  });

  it('separacion por especie y familia en dias seguidos: el segundo no repite lo de la cena de la vispera', () => {
    const abiertos = [{ day: 'Martes', momento: 'cena' }, ...MIERCOLES];
    const { anchors, dishes } = anchorEverythingExcept(abiertos);
    const catalog = [...dishes, lentejas, pollos[0], pollos[1], ternera, huevoCena];
    let vistos = 0;
    for (let seed = 0; seed < 32; seed++) {
      const r = runWalk({ weekArc: arco(anchors), catalog, seed: `seg-sep-${seed}` });
      const vispera = porId.get(dishAt(r, 'Martes', 'cena'));
      const [s] = r.segundos;
      if (!s || !esSegundoDeLegumbre(vispera)) continue;
      vistos += 1;
      expect(proteinaPrincipal(porId.get(s.dishId))).not.toBe(proteinaPrincipal(vispera));
      expect(familiaProteica(porId.get(s.dishId))).not.toBe(familiaProteica(vispera));
    }
    expect(vistos).toBeGreaterThan(0);
  });

  it('si la familia dejaria el segundo sin candidatos, no se aplica y la evidencia lo dice', () => {
    const abiertos = [{ day: 'Martes', momento: 'cena' }, ...MIERCOLES];
    const { anchors, dishes } = anchorEverythingExcept(abiertos);
    const catalog = [...dishes, lentejas, pollos[0], pavo, huevoCena];
    let vistos = 0;
    for (let seed = 0; seed < 32; seed++) {
      const r = runWalk({ weekArc: arco(anchors), catalog, seed: `seg-fam-sin-${seed}` });
      if (familiaProteica(porId.get(dishAt(r, 'Martes', 'cena'))) !== 'ave') continue;
      vistos += 1;
      expect(r.segundos).toHaveLength(1);
      expect(causas(r, 'segundo_de_legumbre')[0].evidencia).toContain('familia en dias seguidos sin aplicar');
    }
    expect(vistos).toBeGreaterThan(0);
  });

  it('la legumbre que sale por azar fuera de un dia sorteado tambien lleva segundo', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Viernes', momento: 'comida' }]);
    const r = runWalk({ weekArc: arco(anchors), catalog: [...dishes, lentejas, ternera], seed: 'seg-azar' });
    expect(r.decisionLog.find((e) => e.causa === 'dias_legumbre_sorteados').dias).toEqual([]);
    expect(r.segundos).toEqual([{ day: 'Viernes', momento: 'comida', dishId: ternera.id, primero: lentejas.id }]);
  });

  it('un primero de legumbre que coloca el ancla tambien lleva segundo', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Miercoles', momento: 'cena' }], (day, momento) => (
      day === 'Miercoles' && momento === 'comida' ? { id: lentejas.id, nombre: lentejas.nombre } : {}));
    const r = runWalk({ weekArc: arco(anchors), catalog: [...dishes, ternera, huevoCena], seed: 'seg-ancla' });
    expect(r.segundos).toEqual([{ day: 'Miercoles', momento: 'comida', dishId: ternera.id, primero: lentejas.id }]);
    expect(dishAt(r, 'Miercoles', 'cena')).toBe(huevoCena.id);
  });

  it('la sugerencia de la comida libre no lleva segundo (D-114)', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Sabado', momento: 'comida' }]);
    const r = runWalk({ weekArc: arco(anchors), catalog: [...dishes, lentejas, ternera], seed: 'seg-sugerencia' });
    expect(dishAt(r, 'Sabado', 'comida')).toBe(lentejas.id);
    expect(r.segundos).toEqual([]);
    expect(causas(r, 'segundo_de_legumbre')).toHaveLength(0);
  });

  it('un plato redactado de legumbre (fabada) sigue como plato unico', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Viernes', momento: 'comida' }]);
    // La lenteja compuesta solo de cena: hay regla, pero el viernes solo puede salir la fabada.
    const r = runWalk({ weekArc: arco(anchors), catalog: [...dishes, de('cena', lentejas), fabada, ternera], seed: 'seg-redactado' });
    expect(dishAt(r, 'Viernes', 'comida')).toBe(fabada.id);
    expect(r.segundos).toEqual([]);
  });

  it('solo dietas omnivoras: con dieta vegetariana no hay segundos', () => {
    const { anchors, dishes } = anchorEverythingExcept(MIERCOLES);
    const r = runWalk({ weekArc: arco(anchors), catalog: [...dishes, lentejas, pollos[0], ternera, huevoCena], seed: 'seg-veg', profile: { dieta: 'vegetariana' } });
    expect(r.segundos).toEqual([]);
  });

  it('es determinista: misma semilla, mismos segundos y mismo log', () => {
    const { anchors, dishes } = anchorEverythingExcept(MIERCOLES);
    const input = { weekArc: arco(anchors), catalog: [...dishes, lentejas, ...pollos, pavo, ternera, huevoCena], seed: 'seg-det' };
    expect(JSON.stringify(runWalk(input))).toBe(JSON.stringify(runWalk(input)));
  });
});

describe('materializePlan: la comida lleva un segundo opcional (D-116)', () => {
  const catalog = loadCatalog();

  it('catalogo real: toda comida servida de legumbre compuesta lleva segundo, o el log dice por que no', () => {
    let conSegundo = 0;
    for (let s = 0; s < 30; s++) {
      const plan = materializePlan({ profile: { trainingDays: [] }, seed: `seg-plan-${s}`, strategy: 'x', catalog });
      expect(Object.keys(plan).sort()).toEqual(['days', 'decisionLog', 'strategy', 'weekProblems', 'weekScore', 'weekWarnings']);
      const sinSegundo = new Set(plan.decisionLog.filter((e) => ['segundo_sin_candidato', 'segundo_sin_tope_plato_unico'].includes(e.causa)).map((e) => e.day));
      const retirados = plan.decisionLog.some((e) => e.causa === 'segundos_retirados_d099');
      for (const day of plan.days) {
        expect(day.meals.map((m) => m.momento)).toEqual(['comida', 'cena']);
        const [comida, cena] = day.meals;
        expect(cena.segundo).toBeUndefined();
        if (comida.segundo) {
          conSegundo += 1;
          expect(comida.libre).toBeUndefined();
          expect(esCompuestoLegumbre(comida.dish)).toBe(true);
          expect(esSegundoDeLegumbre(comida.segundo)).toBe(true);
          expect(comida.segundo.nombre).not.toBe(cena.dish.nombre);
        } else if (esCompuestoLegumbre(comida.dish) && !comida.libre) {
          expect(sinSegundo.has(day.day) || retirados).toBe(true);
        }
      }
    }
    expect(conSegundo / 30).toBeGreaterThan(2.5);
  });
});
