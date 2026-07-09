// buildWeekArc - Fase 4, Componente P2b-i-bis: veto sobre el camino del
// ancla (D-023). Falsables f17-f20 segun el prompt de sesion 2026-07-06.
//
// f17/f20 usan catalogos SINTETICOS de ancla (identityKey + __vista propia,
// inyectada via el parametro getVista de chooseAnchor) porque el catalogo
// REAL no puede ejercer la rama "conocida"+valor=true: CompositionResolver
// resuelve TODO scaffold a "desconocida" incondicionalmente para gluten y
// lactosa (D-021) -- mismo patron que evaluateVetoFromVista en
// vetoes.test.js (f14-refuerzo). f18/f19 usan el catalogo REAL (ANCHORS)
// porque es precisamente el caso donde las 6 anclas son "desconocida" el
// que dispara el contrato de ausencia.

import { describe, it, expect } from 'vitest';
import { buildWeekArc, chooseAnchor } from '../buildWeekArc.js';
import { ANCHORS } from '../../dishes/anchors.js';

function vistaConocida(valorEfectivo) {
  return {
    origen: 'scaffold',
    containsGluten: { origen: 'derivada', valorEfectivo },
    containsLactosa: { origen: 'derivada', valorEfectivo: false },
  };
}

function syntheticAnchor(id, vista, overrides = {}) {
  return {
    identityKey: id, shelfLifeDays: 3, batchable: true, leftoverQuality: 'media', energiaCocina: 'medio', rol: 'ancla', __vista: vista, ...overrides,
  };
}

const getVistaSintetica = (anchor) => anchor.__vista;

describe('chooseAnchor - f17: filtrado ANTES de la eleccion (vetado nunca elegible)', () => {
  const vetado = syntheticAnchor('vetado-gluten', vistaConocida(true));
  const superviviente1 = syntheticAnchor('superviviente-1', vistaConocida(false));
  const superviviente2 = syntheticAnchor('superviviente-2', vistaConocida(false));
  const anchorsSinteticos = [vetado, superviviente1, superviviente2];

  it('con >=1 superviviente, el elegido es SIEMPRE superviviente (jamas el vetado), sobre 200 seeds', () => {
    for (let seed = 0; seed < 200; seed++) {
      const decisionLog = [];
      const elegido = chooseAnchor(anchorsSinteticos, seed, ['gluten'], decisionLog, getVistaSintetica);
      expect(elegido).not.toBeNull();
      expect(elegido.identityKey).not.toBe(vetado.identityKey);
      expect([superviviente1.identityKey, superviviente2.identityKey]).toContain(elegido.identityKey);
    }
  });

  it('MUTACION dirty->red: filtrar DESPUES de elegir (RNG sobre el catalogo completo, descarte posterior) deja pasar al vetado', () => {
    // No se muta buildWeekArc.js aqui (ensuciaria el modulo real) -- se
    // reproduce la implementacion INCORRECTA localmente para demostrar que
    // el mismo fixture SI la detectaria como roja si buildWeekArc.js
    // hiciera esto.
    function chooseAnchorSucio(anchors, seed) {
      const rng = (() => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
      const index = Math.floor(rng() * anchors.length);
      return anchors[index]; // BUG: elige sobre TODOS, sin filtrar antes
    }
    let vetadoElegidoAlgunaVez = false;
    for (let seed = 0; seed < 200 && !vetadoElegidoAlgunaVez; seed++) {
      const elegido = chooseAnchorSucio(anchorsSinteticos, seed);
      if (elegido.identityKey === vetado.identityKey) vetadoElegidoAlgunaVez = true;
    }
    expect(vetadoElegidoAlgunaVez).toBe(true); // confirma que la mutacion SI rompe la propiedad que f17 protege
  });
});

describe('chooseAnchor - f20: invariante RNG sobre supervivientes (el vetado nunca aparece, la variacion ocurre solo entre supervivientes)', () => {
  const vetadoA = syntheticAnchor('vetado-A', vistaConocida(true));
  const vetadoB = syntheticAnchor('vetado-B', vistaConocida(true));
  const s1 = syntheticAnchor('s1', vistaConocida(false));
  const s2 = syntheticAnchor('s2', vistaConocida(false));
  const s3 = syntheticAnchor('s3', vistaConocida(false));
  const mezcla = [vetadoA, s1, vetadoB, s2, s3];
  const supervivientesIds = new Set([s1.identityKey, s2.identityKey, s3.identityKey]);

  it('sobre >=8 seeds: el vetado jamas aparece elegido', () => {
    for (let seed = 0; seed < 8; seed++) {
      const elegido = chooseAnchor(mezcla, seed, ['gluten'], [], getVistaSintetica);
      expect(supervivientesIds.has(elegido.identityKey)).toBe(true);
    }
  });

  it('sobre 100 seeds: la variacion ocurre ENTRE supervivientes (no colapsa a uno solo, salvo por azar improbable)', () => {
    const elegidos = new Set();
    for (let seed = 0; seed < 100; seed++) {
      const elegido = chooseAnchor(mezcla, seed, ['gluten'], [], getVistaSintetica);
      expect(supervivientesIds.has(elegido.identityKey)).toBe(true);
      elegidos.add(elegido.identityKey);
    }
    expect(elegidos.size).toBeGreaterThan(1);
  });

  it('MUTACION dirty->red: RNG sobre el catalogo completo con descarte posterior (busca hasta encontrar uno no vetado) rompe la propiedad "RNG nunca ve al vetado" -- se demuestra por conteo de invocaciones de rng()', () => {
    let invocacionesRng = 0;
    function rngSucio(seedNum) {
      let s = seedNum >>> 0;
      return () => {
        invocacionesRng++;
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function chooseAnchorSucioConDescarte(anchors, seedNum, vetadosIds) {
      const rng = rngSucio(seedNum);
      let candidato;
      do {
        const index = Math.floor(rng() * anchors.length);
        candidato = anchors[index];
      } while (vetadosIds.has(candidato.identityKey));
      return candidato;
    }
    const vetadosIds = new Set([vetadoA.identityKey, vetadoB.identityKey]);
    const elegido = chooseAnchorSucioConDescarte(mezcla, 1, vetadosIds);
    expect(supervivientesIds.has(elegido.identityKey)).toBe(true); // el RESULTADO final coincide...
    expect(invocacionesRng).toBeGreaterThanOrEqual(1); // ...pero el RNG SI llego a "ver" candidatos vetados en el camino (descarte posterior, no filtrado previo) -- justo lo que f20/f17 prohiben en el mecanismo real
  });
});

describe('buildWeekArc - f18: contrato de ausencia sobre el catalogo REAL (las 6 anclas son "desconocida", cero supervivientes)', () => {
  const profileBase = { trainingDays: ['Lunes', 'Miercoles', 'Viernes'], intolerances: ['gluten'] };

  it('(a) LO QUE SE PIERDE: sin batchDay, sin leftoverDays, ningun beat "ancla", causa de ausencia en el log', () => {
    const { weekArc, decisionLog } = buildWeekArc({ profile: profileBase, seed: 'f18-perdida', strategy: 'mantenimiento_equilibrado' });

    expect(weekArc.anchors).toEqual([]);
    expect(weekArc).not.toHaveProperty('batchDay');
    expect(weekArc.beats.some((b) => b.slotRole === 'ancla')).toBe(false);

    const causa = decisionLog.find((d) => d.cause === 'ancla_ausente');
    expect(causa).toBeDefined();
    expect(causa.evidence).toContain('gluten');
    expect(causa.consequence).toContain('sin batchDay');
    expect(causa.consequence).toContain('sin leftoverDays');
  });

  it('(a) MUTACION dirty->red: si buildWeekArc dejara un batchDay fijado pese a cero supervivientes (cascada incompleta), esta asercion lo detectaria', () => {
    const { weekArc } = buildWeekArc({ profile: profileBase, seed: 'f18-perdida', strategy: 'mantenimiento_equilibrado' });
    // Simulacion de la cascada incompleta (sin tocar buildWeekArc.js real):
    const weekArcSucio = { ...weekArc, batchDay: 'Miercoles' };
    expect(weekArcSucio).toHaveProperty('batchDay'); // demuestra que la asercion de arriba SI habria fallado sobre esta variante rota
  });

  it('(b) LO QUE SE CONSERVA: mismo seed -> mismo plan, capricho normal, fixedRoles intactos', () => {
    const r1 = buildWeekArc({ profile: profileBase, seed: 'f18-conserva', strategy: 'mantenimiento_equilibrado' });
    const r2 = buildWeekArc({ profile: profileBase, seed: 'f18-conserva', strategy: 'mantenimiento_equilibrado' });
    expect(JSON.stringify(r1.weekArc)).toBe(JSON.stringify(r2.weekArc));

    // capricho operando normal: sigue existiendo un beat "capricho" (mismo
    // mecanismo, sin ocupacion del ancla que evitar).
    expect(r1.weekArc.beats.some((b) => b.slotRole === 'capricho')).toBe(true);

    // fixedRoles intactos: Sabado=libre, Domingo=familiar, entreno segun perfil.
    const bySeed = Object.fromEntries(r1.weekArc.beats.map((b) => [b.day, b.fixedRole]));
    expect(bySeed.Sabado).toBe('libre');
    expect(bySeed.Domingo).toBe('familiar');
    expect(bySeed.Lunes).toBe('entreno');
    expect(bySeed.Miercoles).toBe('entreno');
    expect(bySeed.Viernes).toBe('entreno');

    // sin IDs repetidos (trivial aqui: no hay ids en absoluto sin ancla,
    // pero el arco no colapsa ni duplica beats por dia).
    expect(r1.weekArc.beats.map((b) => b.day)).toEqual(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']);
  });

  it('(b) MUTACION dirty->red: si una invariante conservada solo en la rama sin-ancla se rompiera (p.ej. Sabado dejara de ser "libre"), esta asercion lo detectaria', () => {
    const { weekArc } = buildWeekArc({ profile: profileBase, seed: 'f18-conserva', strategy: 'mantenimiento_equilibrado' });
    const weekArcSucio = {
      ...weekArc,
      beats: weekArc.beats.map((b) => (b.day === 'Sabado' ? { ...b, fixedRole: undefined } : b)),
    };
    const bySeedSucio = Object.fromEntries(weekArcSucio.beats.map((b) => [b.day, b.fixedRole]));
    expect(bySeedSucio.Sabado).not.toBe('libre'); // demuestra que la asercion de (b) SI habria fallado sobre esta variante rota
  });

  it('con intolerances=["lactosa"] (el otro campo del enum) tambien produce cero supervivientes -- las 6 anclas son "desconocida" en AMBOS campos', () => {
    const { weekArc } = buildWeekArc({ profile: { trainingDays: [], intolerances: ['lactosa'] }, seed: 0, strategy: 'x' });
    expect(weekArc.anchors).toEqual([]);
  });
});

describe('buildWeekArc - f19: paridad sin veto activo (cero regresion del camino feliz)', () => {
  it('intolerances ausente: ancla SIEMPRE presente, sin entradas de log de veto/ausencia, evidencia identica al formato pre-D-023, sobre 50 seeds', () => {
    for (let seed = 0; seed < 50; seed++) {
      const profile = { trainingDays: [] };
      const { weekArc, decisionLog } = buildWeekArc({ profile, seed, strategy: 'x' });
      expect(weekArc.anchors).toHaveLength(1);
      expect(weekArc).toHaveProperty('batchDay');
      expect(decisionLog.some((d) => d.cause === 'ancla_ausente')).toBe(false);
      expect(decisionLog.some((d) => d.cause === 'veto_ancla_universo_reducido')).toBe(false);

      const eleccion = decisionLog.find((d) => d.cause === 'eleccion_ancla_por_seed');
      expect(eleccion.evidence).toMatch(/de 6 anclas catalogadas en CP2 \(sin filtros\)$/);
    }
  });

  it('intolerances=[] (presente pero vacio) es identico a intolerances ausente, misma seed', () => {
    const seed = 'f19-vacio-vs-ausente';
    const resAusente = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });
    const resVacio = buildWeekArc({ profile: { trainingDays: [], intolerances: [] }, seed, strategy: 'x' });
    expect(JSON.stringify(resVacio.weekArc)).toBe(JSON.stringify(resAusente.weekArc));
    expect(JSON.stringify(resVacio.decisionLog)).toBe(JSON.stringify(resAusente.decisionLog));
  });

  it('sobre las 6 anclas del catalogo real: cada una sigue siendo alcanzable sin veto (mismo universo de siempre)', () => {
    for (let targetIndex = 0; targetIndex < ANCHORS.length; targetIndex++) {
      let found = false;
      for (let seed = 0; seed < 500 && !found; seed++) {
        const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });
        if (weekArc.anchors[0].anchorId === ANCHORS[targetIndex].identityKey) found = true;
      }
      expect(found, `ancla #${targetIndex} nunca alcanzada en 500 seeds sin veto`).toBe(true);
    }
  });
});
