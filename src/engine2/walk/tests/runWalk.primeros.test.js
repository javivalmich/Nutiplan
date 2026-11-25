// runWalk - eleccion del primero en un dia de legumbre (D-117.2, modificado el 2026-11-16).
// Dentro del nivel de legumbre, antes de las preferencias A y B, se prefiere un primero cuya legumbre no
// salga ya en la semana (en ningun plato servido) y, despues, uno cuyo aliño no lleve ya otro primero de la
// semana. Cada preferencia se relaja si dejaria el hueco sin candidatos, y las dos dejan su causa en el log.
// Sin pesos: filtros con vuelta atras.

import { describe, it, expect } from 'vitest';
import { materializePlan as materializePlanSinInterruptor } from '../../materializePlan.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { proteinaPrincipal, familiaProteica } from '../../dishes/bases.js';
import { alinoDe } from '../../dishes/alinosD105.js';
// Paso 8: la regla de D-116 y D-117 está apagada por defecto (interruptor reglaLegumbre).
// Estos tests prueban su código, así que la encienden.
const materializePlan = (input) => materializePlanSinInterruptor({ reglaLegumbre: true, ...input });

const catalog = loadCatalog();
const porId = new Map(catalog.map((d) => [d.id, d]));
const plan = (seed) => materializePlan({ profile: { trainingDays: [] }, seed, strategy: 'mantenimiento_equilibrado', catalog });
const SEEDS = Array.from({ length: 40 }, (_, k) => `primeros-${k}`);
const lista = (evidencia) => (evidencia.match(/\(([^)]*)\)$/) || [])[1].split(', ').filter(Boolean);
const elegido = (log, k) => log.slice(k + 1).find((e) => e.momento === 'comida' && e.plato && e.day === log[k].day);

describe('runWalk: el primero prefiere legumbre y aliño no usados (D-117.2)', () => {
  const planes = SEEDS.map((s) => plan(s));
  const eventos = (causa) => planes.flatMap((p) => p.decisionLog.map((e, k) => ({ e, k, log: p.decisionLog })).filter(({ e }) => e.causa === causa));

  it('las cuatro causas salen en el log', () => {
    for (const causa of ['primero_legumbre_no_usada', 'primero_legumbre_no_usada_sin_aplicar', 'primero_alino_no_usado', 'primero_alino_no_usado_sin_aplicar']) {
      expect([causa, eventos(causa).length > 0]).toEqual([causa, true]);
    }
  });

  it('si se aplica la legumbre no usada, el primero elegido no lleva ninguna de las que ya salen', () => {
    for (const { e, k, log } of eventos('primero_legumbre_no_usada')) {
      const plato = porId.get(elegido(log, k).plato);
      expect(lista(e.evidencia)).not.toContain(proteinaPrincipal(plato));
    }
  });

  // Segunda revisión, B1 (2026-11-22): la evidencia lista solo legumbres (antes, todas las proteínas servidas).
  it('la evidencia de la legumbre no usada lista solo legumbres', () => {
    const legumbres = new Set(catalog.filter((d) => familiaProteica(d) === 'legumbre').map(proteinaPrincipal));
    const casos = eventos('primero_legumbre_no_usada');
    expect(casos.length).toBeGreaterThan(0);
    for (const { e } of casos) {
      expect(lista(e.evidencia).length).toBeGreaterThan(0);
      expect(lista(e.evidencia).filter((x) => !legumbres.has(x))).toEqual([]);
    }
  });

  it('si se aplica el aliño no usado, el primero elegido no lleva el de otro primero', () => {
    for (const { e, k, log } of eventos('primero_alino_no_usado')) {
      const plato = porId.get(elegido(log, k).plato);
      expect(lista(e.evidencia)).not.toContain(alinoDe(plato));
    }
  });

  it('misma semilla, mismo plan', () => {
    expect(JSON.stringify(plan('primeros-3'))).toBe(JSON.stringify(plan('primeros-3')));
  });
});
