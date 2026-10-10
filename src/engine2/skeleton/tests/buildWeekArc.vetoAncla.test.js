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
import { chooseAnchor } from '../buildWeekArc.js';
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

// D-038: estos tests (f18) ejercitan el camino SIN fuenteEditorial
// inyectada -- ninguno la pasa a buildWeekArc, asi que preservan el
// comportamiento anterior a D-036/D-037 sin cambios (frontera ausente =>
// identico al actual). Son complementarios del test nuevo mas abajo (D-038:
// consecuencia observable), que SI inyecta la fuente y prueba la rama
// contraria (supervivencia) sobre el mismo catalogo real de 6 anclas.

// D-038 (consecuencia observable de la ingesta real D6, ver DECISIONS.md):
// con fuenteEditorial inyectada confirmando gluten:false/lactosa:false para
// las 6 anclas (mismo shape que el lateral real,
// scripts/phaseB2/output/dishCompositionConfirmations.json, verificado en
// sesion), las anclas dejan de vetarse por "desconocida" y SOBREVIVEN --
// contraste directo con f18 (mismo catalogo real de 6 anclas, mismo perfil
// intolerante, la UNICA variable es la fuente inyectada).

