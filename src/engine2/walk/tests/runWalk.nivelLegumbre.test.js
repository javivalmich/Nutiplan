// runWalk - el dia de legumbre dirige la comida (D-117.2 a D-117.5, modifica D-024).
// En la comida de un dia sorteado, el nivel de legumbre (platos compuestos de
// legumbre) va antes que las preferencias A y B y antes que la verdura del dia;
// A y B siguen actuando dentro del nivel, con su vuelta atras. Fuera de los
// dias sorteados el suelo semanal de legumbre no actua, y el dia de al lado de
// uno sorteado no lleva legumbre a la comida si quedan otros candidatos.

import { describe, it, expect } from 'vitest';
import { runWalk } from '../runWalk.js';
import { satisfaceVerdura } from '../frequencies.js';
import { buildWeekArc } from '../../skeleton/buildWeekArc.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { aplicarAjustesD099 } from '../../dishes/ajustesD099.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';
import { familiaProteica, esCompuestoLegumbre } from '../../dishes/bases.js';
import { DAYS_ORDER } from '../../skeleton/days.js';
import { MOMENTOS } from '../../dishes/schema.js';

const SEEDS = 16;

function beats7() {
  return DAYS_ORDER.map((day) => ({ day, density: 'medio', slotRole: 'rotativo', ...(day === 'Sabado' ? { fixedRole: 'libre' } : {}) }));
}

/** Ancla sintetica en todos los huecos menos los indicados; `forma` permite fijar plateType/tempFeel de un ancla. */
function anchorEverythingExcept(openSlots, forma = () => ({})) {
  const openSet = new Set(openSlots.map(({ day, momento }) => `${day}::${momento}`));
  const anchors = [];
  const dishes = [];
  let n = 0;
  for (const day of DAYS_ORDER) {
    for (const momento of MOMENTOS) {
      if (openSet.has(`${day}::${momento}`)) continue;
      const id = `anchorFill${n++}`;
      anchors.push({ anchorId: id, cookDay: day, leftoverDays: [] });
      dishes.push({ id, rol: 'ancla', momento: [momento], plateType: `ancla_${day}_${momento}`, tempFeel: 'neutro', energiaCocina: 'medio', ...forma(day, momento) });
    }
  }
  return { anchors, dishes };
}

const real = loadCatalog().filter((d) => d.rol === 'rotativo');
const tipo = (d) => resolveDishComposition(d).proteinType;
const conVerdura = (d) => satisfaceVerdura(resolveDishComposition(d));
const porNombre = (n) => real.find((d) => d.nombre === n);
const de = (momento, d) => (d ? { ...d, momento: [momento] } : d);

const lentejas = de('comida', porNombre('Lentejas con pimentón con zanahoria'));
const garbanzos = de('comida', porNombre('Garbanzos con pimentón con espinacas'));
const fabada = de('comida', porNombre('Fabada asturiana simplificada'));
const carbonara = de('comida', porNombre('Pasta carbonara'));
const aveComida = de('comida', real.find((d) => d.momento.includes('comida') && tipo(d) === 'ave' && conVerdura(d)
  && d.tempFeel !== lentejas.tempFeel && d.plateType !== lentejas.plateType));
const cenas = ['ave', 'carne', 'pescado', 'huevo'].map((t) => de('cena', real.find((d) => d.momento.includes('cena') && tipo(d) === t)));

const comida = (r, day) => r.slots.find((s) => s.day === day && s.momento === 'comida').dishId;
const entrada = (r, day) => r.decisionLog.find((e) => e.day === day && e.momento === 'comida');
const sorteados = (r) => r.decisionLog.find((e) => e.causa === 'dias_legumbre_sorteados').dias;
const MIERCOLES = [{ day: 'Miercoles', momento: 'comida' }, { day: 'Miercoles', momento: 'cena' }];

describe('runWalk: el dia de legumbre va antes que A, B y la verdura (D-117)', () => {
  it('fixtures reales localizadas', () => {
    for (const d of [lentejas, garbanzos, fabada, carbonara, aveComida, ...cenas]) expect(d).toBeDefined();
    expect(esCompuestoLegumbre(lentejas)).toBe(true);
    expect(esCompuestoLegumbre(fabada)).toBe(false);
    expect(familiaProteica(fabada)).toBe('legumbre');
    expect(conVerdura(fabada)).toBe(false);
    expect(conVerdura(carbonara)).toBe(false);
  });

  it('antes que la preferencia B: con dos comidas previas «muy caliente», el guiso de legumbre sale igual', () => {
    const { anchors, dishes } = anchorEverythingExcept(MIERCOLES, (day, momento) => (
      momento === 'comida' && (day === 'Lunes' || day === 'Martes') ? { tempFeel: lentejas.tempFeel } : {}));
    const catalog = [...dishes, lentejas, aveComida, ...cenas];
    for (let seed = 0; seed < SEEDS; seed++) {
      const r = runWalk({ weekArc: { beats: beats7(), anchors }, catalog, seed: `nivel-B-${seed}` });
      expect(sorteados(r)).toEqual(['Miercoles']);
      expect(comida(r, 'Miercoles')).toBe(lentejas.id);
      expect(entrada(r, 'Miercoles').evidencia).toContain('preferencia B satisfecha por imposibilidad');
      expect(entrada(r, 'Miercoles').evidencia).toContain('es dia de legumbre');
    }
  });

  it('antes que la preferencia A: aunque ayer se comio el mismo tipo de plato', () => {
    const { anchors, dishes } = anchorEverythingExcept(MIERCOLES, (day, momento) => (
      momento === 'comida' && day === 'Martes' ? { plateType: lentejas.plateType } : {}));
    const catalog = [...dishes, lentejas, aveComida, ...cenas];
    for (let seed = 0; seed < SEEDS; seed++) {
      const r = runWalk({ weekArc: { beats: beats7(), anchors }, catalog, seed: `nivel-A-${seed}` });
      expect(comida(r, 'Miercoles')).toBe(lentejas.id);
      expect(entrada(r, 'Miercoles').evidencia).toContain('preferencia A satisfecha por imposibilidad');
    }
  });

  it('A y B siguen actuando dentro del nivel: entre dos legumbres, B descarta la que repite sensacion', () => {
    const tibia = { ...garbanzos, tempFeel: 'caliente' };
    const { anchors, dishes } = anchorEverythingExcept(MIERCOLES, (day, momento) => (
      momento === 'comida' && (day === 'Lunes' || day === 'Martes') ? { tempFeel: lentejas.tempFeel } : {}));
    const catalog = [...dishes, lentejas, tibia, aveComida, ...cenas];
    for (let seed = 0; seed < SEEDS; seed++) {
      const r = runWalk({ weekArc: { beats: beats7(), anchors }, catalog, seed: `nivel-dentro-${seed}` });
      expect(comida(r, 'Miercoles')).toBe(tibia.id);
      expect(entrada(r, 'Miercoles').evidencia).toContain('preferencia B aplicada');
    }
  });

  it('el nivel son los compuestos de legumbre: un plato redactado (fabada) no entra en el', () => {
    const { anchors, dishes } = anchorEverythingExcept(MIERCOLES);
    const catalog = [...dishes, lentejas, fabada, aveComida, ...cenas];
    for (let seed = 0; seed < SEEDS; seed++) {
      const r = runWalk({ weekArc: { beats: beats7(), anchors }, catalog, seed: `nivel-redactado-${seed}` });
      expect(comida(r, 'Miercoles')).toBe(lentejas.id);
    }
  });

  it('sin candidato de legumbre el hueco sigue como siempre y el log lo dice', () => {
    const { anchors, dishes } = anchorEverythingExcept(MIERCOLES);
    // La unica legumbre compuesta solo vale para la cena (y D-099 no se aplica aqui): hay regla, pero no candidato.
    const catalog = [...dishes, de('cena', lentejas), aveComida, ...cenas];
    const r = runWalk({ weekArc: { beats: beats7(), anchors }, catalog, seed: 'nivel-sin-candidato' });
    expect(sorteados(r)).toEqual(['Miercoles']);
    expect(comida(r, 'Miercoles')).toBe(aveComida.id);
    const ev = r.decisionLog.filter((e) => e.causa === 'dia_legumbre_sin_candidato');
    expect(ev).toHaveLength(1);
    expect(ev[0].day).toBe('Miercoles');
  });

  it('fuera de los dias sorteados el suelo semanal de legumbre no actua', () => {
    // Viernes/comida abierto y su cena anclada: el viernes no es elegible y no hay dias sorteados.
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Viernes', momento: 'comida' }]);
    const catalog = [...dishes, de('cena', lentejas), fabada, carbonara];
    const vistos = new Set();
    for (let seed = 0; seed < 32; seed++) {
      const r = runWalk({ weekArc: { beats: beats7(), anchors }, catalog, seed: `nivel-suelo-${seed}` });
      expect(sorteados(r)).toEqual([]);
      vistos.add(comida(r, 'Viernes'));
      expect(entrada(r, 'Viernes').evidencia).not.toContain('target="legumbre"');
    }
    // Con el suelo de D-024 saldria siempre la fabada; ahora decide el azar entre los dos.
    expect(vistos).toEqual(new Set([fabada.id, carbonara.id]));
  });

  it('el dia de al lado de uno sorteado no lleva legumbre a la comida si quedan otros candidatos', () => {
    const abiertos = [...MIERCOLES, { day: 'Jueves', momento: 'comida' }, { day: 'Jueves', momento: 'cena' }];
    const { anchors, dishes } = anchorEverythingExcept(abiertos);
    const catalog = [...dishes, lentejas, garbanzos, aveComida, ...cenas];
    let conVecinoAntes = 0;
    for (let seed = 0; seed < 48; seed++) {
      const r = runWalk({ weekArc: { beats: beats7(), anchors }, catalog, seed: `nivel-vecino-${seed}` });
      const [dia] = sorteados(r);
      expect(sorteados(r)).toHaveLength(1);
      const otro = dia === 'Miercoles' ? 'Jueves' : 'Miercoles';
      expect(esCompuestoLegumbre({ id: comida(r, dia) })).toBe(true);
      expect(comida(r, otro)).toBe(aveComida.id);
      if (otro === 'Miercoles') {
        // El miercoles se elige antes que el jueves: no lo protege el filtro de familia, sino esta regla.
        conVecinoAntes += 1;
        expect(entrada(r, otro).evidencia).toContain('el dia de al lado es dia de legumbre');
      }
    }
    expect(conVecinoAntes).toBeGreaterThan(0);
  });

  it('si en el dia de al lado solo hay legumbre, sale legumbre', () => {
    const abiertos = [...MIERCOLES, { day: 'Jueves', momento: 'comida' }, { day: 'Jueves', momento: 'cena' }];
    const { anchors, dishes } = anchorEverythingExcept(abiertos);
    const catalog = [...dishes, lentejas, garbanzos, ...cenas];
    for (let seed = 0; seed < SEEDS; seed++) {
      const r = runWalk({ weekArc: { beats: beats7(), anchors }, catalog, seed: `nivel-vecino-solo-${seed}` });
      expect(r.slots.every((s) => !s.abierto && s.dishId)).toBe(true);
    }
  });

  it('catalogo real: la comida de cada dia sorteado es un compuesto de legumbre, o el log dice que no habia', () => {
    const catalog = aplicarAjustesD099(loadCatalog());
    const porId = new Map(catalog.map((d) => [d.id, d]));
    let legumbres = 0;
    const N = 40;
    for (let s = 0; s < N; s++) {
      const seed = `nivel-real-${s}`;
      const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });
      const r = runWalk({ weekArc, catalog, seed });
      const dias = sorteados(r);
      for (const d of dias) {
        const sinCandidato = r.decisionLog.some((e) => e.causa === 'dia_legumbre_sin_candidato' && e.day === d);
        if (!sinCandidato) expect(esCompuestoLegumbre(porId.get(comida(r, d)))).toBe(true);
      }
      legumbres += r.slots.filter((x) => !(x.fixedRole === 'libre' && x.momento === 'comida') && familiaProteica(porId.get(x.dishId)) === 'legumbre').length;
      // Ninguna legumbre en la cena (D-099.3) y ninguna sugerencia dirigida.
      expect(r.slots.some((x) => x.momento === 'cena' && familiaProteica(porId.get(x.dishId)) === 'legumbre')).toBe(false);
    }
    // Con el suelo de D-024 salian 1,3 por semana; con los dias sorteados, cerca de 3.
    expect(legumbres / N).toBeGreaterThan(2.7);
  });

  it('con dieta vegetariana el paso 4 sigue como en D-024', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Viernes', momento: 'comida' }]);
    const catalog = [...dishes, de('cena', lentejas), fabada, carbonara];
    for (let seed = 0; seed < SEEDS; seed++) {
      const r = runWalk({ weekArc: { beats: beats7(), anchors }, catalog, seed: `nivel-veg-${seed}`, profile: { dieta: 'vegetariana' } });
      expect(comida(r, 'Viernes')).toBe(fabada.id);
    }
  });
});
