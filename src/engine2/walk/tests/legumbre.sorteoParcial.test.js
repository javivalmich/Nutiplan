// Revisión independiente, arreglo 3 (2026-11-16): si no caben 3 días de legumbre (el ancla ocupa días, sin dos
// seguidos), se sortean 2 o 1, y la evidencia del log dice los días realmente sorteados, no los pedidos.
import { describe, it, expect } from 'vitest';
import { sortearDiasLegumbre } from '../legumbre.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { esCompuestoLegumbre } from '../../dishes/bases.js';
import { DAYS_ORDER } from '../../skeleton/days.js';
import { MOMENTOS } from '../../dishes/schema.js';

const catalog = loadCatalog();
const primero = catalog.find((d) => d.rol === 'rotativo' && esCompuestoLegumbre(d));
const otro = catalog.find((d) => d.rol === 'rotativo' && d.momento.includes('cena') && !esCompuestoLegumbre(d));

/** Huecos de la semana con el ancla en los días dados (un plato que no es de legumbre) y el sábado libre. */
function huecos(diasDelAncla) {
  return DAYS_ORDER.flatMap((day) => MOMENTOS.map((momento) => ({
    day, momento, ...(day === 'Sabado' ? { fixedRole: 'libre' } : {}),
    ...(diasDelAncla.includes(day) ? { abierto: false, dishId: otro.id } : { abierto: true }),
  })));
}
function sortear(diasDelAncla) {
  const log = [];
  const r = sortearDiasLegumbre({ p1aSlots: huecos(diasDelAncla), catalog, vetoedIds: new Set(), seed: 'sorteo', registrar: (causa, evidencia, extra) => log.push({ causa, evidencia, ...extra }) });
  return { r, e: log.find((x) => x.causa === 'dias_legumbre_sorteados') };
}

describe('sorteo de los días de legumbre cuando no caben 3', () => {
  it('los casos existen', () => {
    expect(primero && otro).toBeTruthy();
  });

  it('caben 3: la evidencia dice 3', () => {
    const { r, e } = sortear([]);
    expect(r.dias.size).toBe(3);
    expect(e.sorteados).toBe(3);
    expect(e.evidencia).toMatch(/se sortean 3 dias entre \d+ conjuntos validos de 3/);
  });

  it('caben 2 (el ancla ocupa de lunes a jueves): se sortean 2 y la evidencia lo dice', () => {
    const { r, e } = sortear(['Lunes', 'Martes', 'Miercoles', 'Jueves']);
    expect([...r.dias]).toEqual(['Viernes', 'Domingo']);
    expect(e.pedidos).toBe(3);
    expect(e.sorteados).toBe(2);
    expect(e.evidencia).toMatch(/se piden 3 dias, pero solo caben 2/);
    expect(e.evidencia).toMatch(/se sortean 2 dias entre 1 conjuntos validos de 2/);
    expect(e.evidencia).toContain('[Viernes, Domingo]');
  });

  it('cabe 1 (el ancla ocupa de lunes a viernes): se sortea 1 y la evidencia lo dice', () => {
    const { r, e } = sortear(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes']);
    expect([...r.dias]).toEqual(['Domingo']);
    expect(e.sorteados).toBe(1);
    expect(e.evidencia).toMatch(/se piden 3 dias, pero solo cabe 1/);
    expect(e.evidencia).toMatch(/se sortea 1 dia entre 1 conjuntos validos de 1/);
  });

  it('no cabe ninguno: la evidencia lo dice', () => {
    const { r, e } = sortear(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Domingo']);
    expect(r.dias.size).toBe(0);
    expect(e.sorteados).toBe(0);
    expect(e.evidencia).toMatch(/no cabe ningun dia/);
  });
});
