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
const sinArreglo = (r) => r.decisionLog.filter((e) => e.causa === 'infraccion_d099_sin_segundos');

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
      expect(sinArreglo(r)).toHaveLength(0);
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

  it('sin segundos no hay nada que retirar: la semana no se repite, y la infraccion queda con su propia causa', () => {
    // Un plato repetido por catalogo corto (D-107), sin ningun segundo en la semana. La lenteja (sin hueco
    // de comida abierto) solo hace que la regla este en marcha.
    const abiertos = [{ day: 'Lunes', momento: 'cena' }, { day: 'Miercoles', momento: 'cena' }];
    const a = anchorEverythingExcept(abiertos);
    const r = runWalk({ weekArc: { beats: beats7(), anchors: a.anchors }, catalog: [...a.dishes, lentejas, pollos[0]], seed: 'red-sin-segundos', maxRepeticiones: 2 });
    expect(r.decisionLog.some((e) => e.causa === 'dias_legumbre_sorteados')).toBe(true);
    expect(r.segundos).toEqual([]);
    expect(r.slots.filter((x) => x.dishId === pollos[0].id)).toHaveLength(2);
    expect(retirada(r)).toHaveLength(0);
    const ev = sinArreglo(r);
    expect(ev).toHaveLength(1);
    expect(ev[0].evento).toBe(true);
    expect(ev[0].infracciones).toContain(`plato repetido: ${pollos[0].nombre}`);
    expect(ev[0].evidencia).toContain('sin ningun segundo');
  });

  it('si aun sin segundos la semana incumple, se anotan las dos causas y no se repite mas', () => {
    // Lunes, miercoles y viernes cenan pollo (solo hay dos): con o sin segundo, algo se repite (D-107).
    const abiertos = [{ day: 'Lunes', momento: 'cena' }, ...MIERCOLES, { day: 'Viernes', momento: 'cena' }];
    const a = anchorEverythingExcept(abiertos);
    for (let s = 0; s < 8; s++) {
      const input = { weekArc: { beats: beats7(), anchors: a.anchors }, catalog: [...a.dishes, lentejas, ...pollos], seed: `red-sin-arreglo-${s}`, maxRepeticiones: 2 };
      const r = runWalk(input);
      expect(r.segundos).toEqual([]);
      expect(retirada(r)).toHaveLength(1);
      const ev = sinArreglo(r);
      expect(ev).toHaveLength(1);
      expect(ev[0].evidencia).toContain('aun despues de retirar los segundos');
      expect(ev[0].infracciones).toEqual(infraccionesD099(input, r));
      expect(ev[0].infracciones.length).toBeGreaterThan(0);
    }
  });

  it('sin la regla (dieta vegetariana o perfil sin compuestos de legumbre) no se anota nada', () => {
    const abiertos = [{ day: 'Lunes', momento: 'cena' }, { day: 'Miercoles', momento: 'cena' }];
    const a = anchorEverythingExcept(abiertos);
    const base = { weekArc: { beats: beats7(), anchors: a.anchors }, seed: 'red-sin-regla', maxRepeticiones: 2 };
    for (const r of [runWalk({ ...base, catalog: [...a.dishes, pollos[0]] }), runWalk({ ...base, catalog: [...a.dishes, lentejas, pollos[0]], profile: { dieta: 'vegetariana' } })]) {
      expect(r.slots.filter((x) => x.dishId === pollos[0].id)).toHaveLength(2);
      expect(sinArreglo(r)).toHaveLength(0);
    }
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

// Orden de las dos redes (D-115.7 y D-116.5). Cada intento pasa primero por la red del filtro de
// familia; la de D-099 mira la semana que sale de ahi y, si la rehace sin segundos, la repeticion
// vuelve a empezar CON el filtro de familia. Sin bucle: como mucho 4 walks por semana.
describe('runWalk: las dos redes en la misma semana', () => {
  // Caso sintetico encontrado por busqueda (semilla «buscar-10060»): con segundos, el walk se queda sin
  // platos con el filtro de familia; sin el filtro sale, pero con infracciones de D-099.3; sin segundos
  // y otra vez con el filtro, la semana cumple.
  const abiertos = [{ day: 'Martes', momento: 'comida' }, { day: 'Martes', momento: 'cena' }, { day: 'Lunes', momento: 'cena' }, { day: 'Miercoles', momento: 'comida' }];
  const nombres = ['Lentejas con pimentón con zanahoria', 'Pechuga de pavo a la plancha con limón, orégano y ajo con brócoli',
    'Lomo de cerdo a la plancha con mostaza y miel con brócoli', 'Pechuga de pollo salteado con hierbas provenzales con champiñones',
    'Nuggets caseros de pollo al airfryer con patata gajo'];
  const a = anchorEverythingExcept(abiertos);
  const input = { weekArc: { beats: beats7(), anchors: a.anchors }, catalog: [...a.dishes, ...nombres.map((n) => real.find((d) => d.nombre === n))], seed: 'buscar-10060' };

  it('fixtures localizadas', () => {
    expect(input.catalog.every(Boolean)).toBe(true);
  });

  it('la red de familia actua dentro del intento con segundos, y la repeticion sin segundos empieza con el filtro', () => {
    const r = runWalk(input);
    const [ev] = retirada(r);
    expect(ev).toBeDefined();
    expect(ev.semanaDescartada).toEqual({ familiaRetirada: true });
    expect(ev.walks).toEqual(['con segundos, con filtro de familia', 'con segundos, sin filtro de familia', 'sin segundos, con filtro de familia']);
    expect(ev.evidencia).toContain('vuelve a empezar con el');
    // La semana que se queda es la del tercer walk: con el filtro, sin segundos y sin infracciones.
    expect(r.decisionLog.some((e) => e.causa === 'familia_dias_seguidos_retirada')).toBe(false);
    expect(r.segundos).toEqual([]);
    expect(infraccionesD099(input, r)).toEqual([]);
    expect(sinArreglo(r)).toHaveLength(0);
  });

  it('es determinista y no pasa de 4 walks', () => {
    expect(JSON.stringify(runWalk(input))).toBe(JSON.stringify(runWalk(input)));
    let vistas = 0;
    for (let s = 0; s < 40; s++) {
      const otra = { ...input, seed: `dos-redes-${s}` };
      let r;
      try { r = runWalk(otra); } catch (err) {
        // Catalogo de 5 platos para 4 huecos y un segundo: con algunas semillas no hay platos. No lo causa
        // la regla: sin ella (dieta vegetariana) esas semillas fallan igual.
        expect(err.poolVacio).toBe(true);
        expect(() => runWalk({ ...otra, profile: { dieta: 'vegetariana' } })).toThrow(/pool rotativo vacio/);
        continue;
      }
      vistas += 1;
      for (const e of retirada(r)) expect(e.walks.length).toBeLessThanOrEqual(4);
      expect(retirada(r).length).toBeLessThanOrEqual(1);
      expect(r.decisionLog.filter((e) => e.causa === 'familia_dias_seguidos_retirada').length).toBeLessThanOrEqual(1);
    }
    expect(vistas).toBeGreaterThan(10);
  });
});

// Red del pool vacio (D-116.5, decision de Javi del 2026-11-15). El segundo gasta un plato: si era el
// ultimo que valia para un hueco posterior, el walk se queda sin platos. Antes de fallar (y de que la
// app caiga al motor viejo), la semana se repite entera sin segundos, con la misma semilla.
describe('runWalk: red de los segundos ante un pool vacio', () => {
  const pollo = { ...real.find(esSegundoDeLegumbre), momento: ['cena'] };
  const pescado = { ...real.find((d) => d.momento.includes('cena') && familiaProteica(d) === 'pescado'), momento: ['cena'] };
  const abiertos = [{ day: 'Martes', momento: 'comida' }, { day: 'Martes', momento: 'cena' }, { day: 'Jueves', momento: 'cena' }];
  const a = anchorEverythingExcept(abiertos);
  // Caso minimo: dos cenas para dos huecos de cena; con el segundo, la del jueves se queda sin plato.
  const input = { weekArc: { beats: beats7(), anchors: a.anchors }, catalog: [...a.dishes, lentejas, pollo, pescado], seed: 'red-pool' };
  const porPool = (r) => r.decisionLog.filter((e) => e.causa === 'segundos_retirados_pool_vacio');

  it('fixtures localizadas', () => {
    expect(pollo.id).toBeDefined();
    expect(pescado.id).toBeDefined();
  });

  it('si con los segundos el walk se queda sin platos, se repite sin segundos y el log lo dice', () => {
    for (let s = 0; s < 8; s++) {
      const r = runWalk({ ...input, seed: `red-pool-${s}` });
      expect(r.slots.every((x) => !x.abierto && x.dishId)).toBe(true);
      expect(r.segundos).toEqual([]);
      expect(r.slots.find((x) => x.day === 'Martes' && x.momento === 'comida').dishId).toBe(lentejas.id);
      expect(new Set(['Martes', 'Jueves'].map((d) => r.slots.find((x) => x.day === d && x.momento === 'cena').dishId))).toEqual(new Set([pollo.id, pescado.id]));
      const ev = porPool(r);
      expect(ev).toHaveLength(1);
      expect(ev[0].evento).toBe(true);
      expect(ev[0].evidencia).toContain('pool rotativo vacio para Jueves/cena');
      expect(ev[0].walks).toEqual(['con segundos, con filtro de familia', 'sin segundos, con filtro de familia']);
      expect(retirada(r)).toHaveLength(0);
      expect(infraccionesD099({ ...input, seed: `red-pool-${s}` }, r)).toEqual([]);
    }
  });

  it('es determinista', () => {
    expect(JSON.stringify(runWalk(input))).toBe(JSON.stringify(runWalk(input)));
  });

  it('si tampoco sin segundos hay platos, falla como antes', () => {
    // Una sola cena para dos huecos de cena: falta con segundos y sin ellos.
    const corto2 = { ...input, catalog: [...a.dishes, lentejas, pollo] };
    expect(() => runWalk(corto2)).toThrow(/pool rotativo vacio/);
  });

  it('sin la regla no hay segundos y no cambia nada: ese caso no falla', () => {
    const r = runWalk({ ...input, profile: { dieta: 'vegetariana' } });
    expect(porPool(r)).toHaveLength(0);
  });
});
