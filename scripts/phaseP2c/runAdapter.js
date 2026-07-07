// Fase 4, Componente P2c (D1) — runner CLI del adaptador humanScore.
// Ejecutar con: node scripts/phaseP2c/runAdapter.js
//
// Genera UN plan de engine2 (buildWeekArc + runWalk, catalogo real, seed
// fija) y lo adapta al contrato de reporte D-025 (terna valor/cobertura/
// estado por submetrica). Solo imprime -- ninguna comparacion contra
// baseline.json (eso es D2, fuera de alcance de este PR).

import { loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';
import { buildWeekArc } from '../../src/engine2/skeleton/buildWeekArc.js';
import { runWalk } from '../../src/engine2/walk/runWalk.js';
import { adaptHumanScore } from './humanScoreAdapter.js';

const SEED = 0;
const PROFILE = { trainingDays: ['Miercoles'] };

const catalog = loadCatalog();
const { weekArc } = buildWeekArc({ profile: PROFILE, seed: SEED, strategy: 'x' });
const { slots } = runWalk({
  weekArc, catalog, seed: SEED, profile: PROFILE,
});

const report = adaptHumanScore({ slots, catalog });

console.log(`=== Adaptador humanScore (D-025) -- seed=${SEED}, trainingDays=[${PROFILE.trainingDays.join(', ')}] ===\n`);
for (const [key, metric] of Object.entries(report)) {
  console.log(`--- ${key} ---`);
  console.log(`estado: ${metric.estado}`);
  console.log(`cobertura: ${metric.cobertura.legibles}/${metric.cobertura.total}`);
  if (metric.motivo) console.log(`motivo: ${metric.motivo}`);
  console.log(`valor: ${JSON.stringify(metric.valor)}`);
  console.log('');
}
