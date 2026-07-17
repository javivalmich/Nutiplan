// Generación del plan observable de legacy usado en la verificación de
// conformidad con docs/spec/plan-observable.md v1.0
// (docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md).
//
// Ruta de producción: buildPlan() invocado vía runBaseline(), sin opts.rng.
// Fixture declarado por nombre desde src/engine/tests/baselineFixtures.js
// — no se inventa perfil nuevo.
//
// Comando de generación: node docs/evidence/plan-observable/gen-legacy-2026-07-18.mjs
import { createHash } from 'node:crypto';
import { FIXTURES, runBaseline, serialiseDays } from '../../../src/engine/tests/baselineFixtures.js';

const FIXTURE_NAME = 'mantenimiento_equilibrado (base)';
const fixture = FIXTURES.find(f => f.name === FIXTURE_NAME);
if (!fixture) throw new Error(`Fixture no encontrada: ${FIXTURE_NAME}`);

const plan = runBaseline(fixture);

// Objeto completo, tal como lo retorna el productor (buildPlan.js:2807-2815).
const jsonFull = JSON.stringify(plan, null, 2);
const hashFull = createHash('sha256').update(jsonFull, 'utf8').digest('hex');

// Proyección reproducible: criterio serialiseDays() de baselineFixtures.js
// (excluye day.id de cada elemento de days; resto del objeto sin tocar).
const planProjected = { ...plan, days: serialiseDays(plan.days) };
const jsonProjected = JSON.stringify(planProjected, null, 2);
const hashProjected = createHash('sha256').update(jsonProjected, 'utf8').digest('hex');

console.log('fixture:', fixture.name);
console.log('userId:', fixture.userId);
console.log('weekNumber:', fixture.weekNumber);
console.log('sha256_full:', hashFull);
console.log('sha256_projected:', hashProjected);
