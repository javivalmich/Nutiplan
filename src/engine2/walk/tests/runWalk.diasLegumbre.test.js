// runWalk - dias de legumbre sorteados con la semilla (D-117, modifica D-024).
// Antes del walk se sortean 3 dias de legumbre con un RNG propio
// («::walk::estructura»): ni el dia de la comida libre, ni dos dias seguidos,
// ni un dia donde el ancla ya coloco un plato. Las legumbres del ancla cuentan
// para los 3. Solo dietas omnivoras. Un perfil sin platos compuestos de
// legumbre (SIBO) no sortea ningun dia.

import { describe, it, expect } from 'vitest';
import { runWalk } from '../runWalk.js';
import { expandWeekArc } from '../expandWeekArc.js';
import { buildWeekArc } from '../../skeleton/buildWeekArc.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { aplicarAjustesD099 } from '../../dishes/ajustesD099.js';
import { familiaProteica, esCompuestoLegumbre } from '../../dishes/bases.js';
import { DAYS_ORDER } from '../../skeleton/days.js';

const catalog = aplicarAjustesD099(loadCatalog());
const sinLegumbre = catalog.filter((d) => familiaProteica(d) !== 'legumbre');
const semana = (seed, extra = {}) => buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x', ...extra }).weekArc;
const sorteo = (log) => log.filter((e) => e.causa === 'dias_legumbre_sorteados');
const idx = (d) => DAYS_ORDER.indexOf(d);

// Tiempo límite explícito (segunda revisión, B2): solos tardan hasta 1,7 s; con la batería en paralelo se acercan a los 5 s por defecto.
describe('runWalk: sorteo de los dias de legumbre (D-117)', { timeout: 30000 }, () => {
  it('el catalogo real tiene platos compuestos de legumbre', () => {
    expect(catalog.filter((d) => d.rol === 'rotativo' && esCompuestoLegumbre(d)).length).toBeGreaterThan(5);
    expect(sinLegumbre.some(esCompuestoLegumbre)).toBe(false);
  });

  it('sortea 3 dias: ni el dia libre, ni dias seguidos; queda en el log con su causa', () => {
    const patrones = new Set();
    for (let s = 0; s < 40; s++) {
      const seed = `dias-leg-${s}`;
      const weekArc = semana(seed);
      const libres = weekArc.beats.filter((b) => b.fixedRole === 'libre').map((b) => b.day);
      const { decisionLog } = runWalk({ weekArc, catalog, seed });
      const ev = sorteo(decisionLog);
      expect(ev).toHaveLength(1);
      expect(ev[0].evento).toBe(true);
      expect(ev[0].dias).toHaveLength(3);
      expect(ev[0].evidencia).toContain('::walk::estructura');
      for (const d of ev[0].dias) expect(libres).not.toContain(d);
      const is = ev[0].dias.map(idx).sort((a, b) => a - b);
      for (let k = 1; k < is.length; k++) expect(is[k] - is[k - 1]).toBeGreaterThan(1);
      patrones.add(ev[0].dias.join(','));
    }
    // Es un sorteo: no sale siempre el mismo conjunto (hay 7 validos con el sabado libre).
    expect(patrones.size).toBeGreaterThan(3);
  });

  it('es determinista: misma semilla, mismos dias', () => {
    const weekArc = semana('dias-leg-det');
    const a = runWalk({ weekArc, catalog, seed: 'dias-leg-det' });
    const b = runWalk({ weekArc, catalog, seed: 'dias-leg-det' });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('con ancla: ningun dia sorteado es un dia del ancla, y sus legumbres cuentan para los 3', () => {
    let conAncla = 0;
    for (let s = 0; s < 30; s++) {
      const seed = `dias-leg-ancla-${s}`;
      const weekArc = semana(seed, { cocinarEnCantidad: { activo: true, dia: 'Domingo' } });
      const p1a = expandWeekArc({ weekArc, catalog, seed }).slots.filter((x) => !x.abierto && x.dishId);
      const { decisionLog } = runWalk({ weekArc, catalog, seed });
      const [ev] = sorteo(decisionLog);
      expect(ev).toBeDefined();
      if (!p1a.length) continue;
      conAncla += 1;
      const diasAncla = new Set(p1a.map((x) => x.day));
      for (const d of ev.dias) expect(diasAncla.has(d)).toBe(false);
      const legAncla = p1a.filter((x) => x.momento === 'comida' && familiaProteica(catalog.find((d) => d.id === x.dishId)) === 'legumbre');
      expect(ev.dias.length).toBeLessThanOrEqual(3 - legAncla.length);
      // Un dia sorteado tampoco es vecino de una legumbre del ancla.
      for (const d of ev.dias) for (const l of legAncla) expect(Math.abs(idx(d) - idx(l.day))).toBeGreaterThan(1);
    }
    expect(conAncla).toBeGreaterThan(0);
  });

  it('perfil sin platos de legumbre (SIBO): no se sortea ningun dia y el log lo dice', () => {
    for (let s = 0; s < 12; s++) {
      const seed = `dias-leg-sibo-${s}`;
      const { slots, decisionLog } = runWalk({ weekArc: semana(seed), catalog: sinLegumbre, seed });
      expect(slots.every((x) => !x.abierto && x.dishId)).toBe(true);
      expect(sorteo(decisionLog)).toHaveLength(0);
      const ev = decisionLog.filter((e) => e.causa === 'dias_legumbre_sin_sorteo');
      expect(ev).toHaveLength(1);
      expect(ev[0].evento).toBe(true);
      expect(decisionLog.some((e) => e.causa === 'dia_legumbre_sin_candidato')).toBe(false);
    }
  });

  it('solo dietas omnivoras: con dieta vegetariana o vegana no hay sorteo', () => {
    for (const dieta of ['vegetariana', 'vegana']) {
      const seed = `dias-leg-${dieta}`;
      const { decisionLog } = runWalk({ weekArc: semana(seed), catalog, seed, profile: { trainingDays: [], dieta } });
      expect(decisionLog.some((e) => String(e.causa).startsWith('dias_legumbre'))).toBe(false);
    }
  });
});

// Perfil con 1 o 2 platos compuestos de legumbre (decision de Javi, 2026-11-15, igual que el hook):
// se sortean 3 dias igual; los que no se llenan siguen la cascada normal y el log lo dice
// (dia_legumbre_sin_candidato), sin el suelo semanal de D-024.
describe('runWalk: perfil con pocos compuestos de legumbre', () => {
  const compuestos = catalog.filter((d) => d.rol === 'rotativo' && esCompuestoLegumbre(d));
  const redactado = catalog.find((d) => d.nombre === 'Fabada asturiana simplificada');
  const universo = (n) => [...sinLegumbre, ...compuestos.slice(0, n), redactado];

  for (const n of [1, 2]) {
    it(`con ${n} compuesto(s): 3 dias sorteados, como mucho ${n} con legumbre compuesta, el resto sin candidato y sin suelo de D-024`, () => {
      let sinCandidato = 0;
      for (let s = 0; s < 24; s++) {
        const seed = `pocos-${n}-${s}`;
        const r = runWalk({ weekArc: semana(seed), catalog: universo(n), seed });
        const [ev] = sorteo(r.decisionLog);
        expect(ev.dias).toHaveLength(3);
        const comidaDe = (d) => r.slots.find((x) => x.day === d && x.momento === 'comida').dishId;
        const llenos = ev.dias.filter((d) => compuestos.some((c) => c.id === comidaDe(d)));
        expect(llenos.length).toBeLessThanOrEqual(n);
        const vacios = r.decisionLog.filter((e) => e.causa === 'dia_legumbre_sin_candidato').map((e) => e.day);
        expect(vacios.sort()).toEqual(ev.dias.filter((d) => !llenos.includes(d)).sort());
        sinCandidato += vacios.length;
        // Ningun hueco atiende el suelo semanal de legumbre de D-024.
        expect(r.decisionLog.some((e) => String(e.evidencia || '').includes('target="legumbre"'))).toBe(false);
      }
      expect(sinCandidato).toBeGreaterThanOrEqual(24 * (3 - n));
    });
  }
});
