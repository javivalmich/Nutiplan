// T-INV (D-036) -- Fase 4, PR-1b. Invariante de unicidad logica de
// instancia: una ejecucion del walk (buildWeekArc + runWalk) con la MISMA
// fuenteEditorial inyectada debe producir vistas de composicion que
// provengan de esa instancia exacta, observable en DOS productores
// independientes (computeVetoUniverse via runWalk, anchorVista via
// buildWeekArc/chooseAnchor). Ambos canales son deterministas
// (agregados/estructurales), no dependen de que el RNG elija un candidato
// concreto -- por eso no se comprueba "que plato gana", sino conteos
// (conteoVetos.gluten.valor) y presencia/ausencia estructural del ancla.

import { describe, it, expect } from 'vitest';
import { runWalk } from '../runWalk.js';
import { buildWeekArc } from '../../skeleton/buildWeekArc.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';
import { ANCHORS } from '../../dishes/anchors.js';

const catalogReal = loadCatalog();

function conteoGlutenValor(decisionLog) {
  const evento = decisionLog.find((d) => d.causa === 'veto_universo_reducido');
  const match = evento.evidencia.match(/gluten: (\d+) por valor \+ (\d+) por desconocida/);
  return { valor: Number(match[1]), desconocida: Number(match[2]) };
}

describe('T-INV (D-036) -- unicidad logica de instancia de fuenteEditorial a traves del walk', () => {
  const targetRotativo = catalogReal.find(
    (d) => d.rol === 'rotativo'
      && resolveDishComposition(d).origen === 'freeform'
      && resolveDishComposition(d).containsGluten.valorEfectivo === false,
  );

  it('fixture real localizada (rotativo freeform con gluten derivado=false)', () => {
    expect(targetRotativo).toBeDefined();
  });

  it('canal veto (runWalk/computeVetoUniverse) y canal ancla (buildWeekArc/anchorVista) reflejan la MISMA fuenteEditorial inyectada', () => {
    const profile = { trainingDays: [], intolerances: ['gluten'] };
    const seed = 'T-INV-seed';

    // Baseline: sin fuenteEditorial, comportamiento identico al actual (D-036, C2/no-regresion).
    const { weekArc: weekArcBase } = buildWeekArc({ profile, seed, strategy: 'x' });
    const { decisionLog: logBase } = runWalk({
      weekArc: weekArcBase, catalog: catalogReal, seed, profile,
    });
    const conteoBase = conteoGlutenValor(logBase);
    expect(weekArcBase.anchors).toEqual([]); // las 6 anclas son "desconocida" sin fuente (f18 vigente)

    const fuenteEditorial = {
      version: 1,
      confirmed: {
        [targetRotativo.id]: { gluten: { valor: true, por: 'T-INV', fecha: '2026-07-14' } },
        ...Object.fromEntries(
          // D-099: «Huevo con tomate en crudo» dejo de ser ancla (ahora rotativo):
          // confirmarlo moveria el conteo «desconocida» del canal veto.
          ANCHORS.filter((a) => catalogReal.find((d) => d.id === a.identityKey)?.rol === 'ancla')
            .map((a) => [a.identityKey, { gluten: { valor: false, por: 'T-INV', fecha: '2026-07-14' } }]),
        ),
      },
    };

    const { weekArc } = buildWeekArc({
      profile, seed, strategy: 'x', fuenteEditorial,
    });
    const { decisionLog } = runWalk({
      weekArc, catalog: catalogReal, seed, profile, fuenteEditorial,
    });
    const conteo = conteoGlutenValor(decisionLog);

    // Canal 1 (computeVetoUniverse via runWalk): el override sube el conteo "valor" en exactamente 1;
    // "desconocida" no se mueve (el rotativo overrideado no estaba ahi -- era "derivada", falso).
    expect(conteo.valor).toBe(conteoBase.valor + 1);
    expect(conteo.desconocida).toBe(conteoBase.desconocida);

    // Canal 2 retirado (D-099): el ancla ya no es un plato del catalogo sino un
    // ingrediente base, y solo existe si el usuario elige cocinar en cantidad.
    expect(weekArc.anchors).toEqual([]);
  });
});
