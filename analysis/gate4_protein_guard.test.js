// ============================================================
// GATE 4 (5c) — Protein coupling guard
// Instrumentación versionada (co-firmada, fix/sync-gates-medicion,
// D-015/D-016): WEEKLY_CAP se importa de producción (ya no hay copia
// local desincronizada). El resto de analysis/ sigue siendo scratch
// ad-hoc y NO versionado (.gitignore).
// Runner: vitest run analysis/gate4_protein_guard.test.js
// ============================================================
import { describe, it, vi } from 'vitest';
import { buildPlan, WEEKLY_CAP } from '../src/engine/buildPlan.js';

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const PROFILE = {
  weight:74, goal:'maintain', activity:'moderate', intolerances:[], trainingDays:[],
  extras:{}, mealsPerDay:3, tiempoCocina:'normal', experiencia:'intermedio',
  simpleMode:false, dob:'1990-01-01', gender:'male', height:178,
};
const TARGET_KCAL = 2000;
const BASE_OPTS_NO_FF = { month:5, weekNumber:23, pastProteins:{}, freeFormPool:[] };
function run(seed) {
  return buildPlan(JSON.parse(JSON.stringify(PROFILE)), TARGET_KCAL,
    { ...BASE_OPTS_NO_FF, saveMealMemory: vi.fn(), rng: mulberry32(seed) });
}
function getMeal(day, t){ return (day.meals||[]).find(m=>m&&m.time===t)||null; }
function protKey(meal){
  if(!meal||!meal._spec) return 'none';
  const spec=meal._spec;
  if(spec.isFree===true) return 'libre';
  if(spec.freeForm===true) return 'freeform';
  return (typeof spec.P==='string'&&spec.P)?spec.P:'none';
}
const FAMILY = { pollo:'ave', pavo:'ave', conejo:'ave' };
// WEEKLY_CAP: importada de producción (buildPlan.js) — D-015, fix/sync-gates-medicion.
// Antes era copia local desincronizada (pescado/legumbre/ave con valores pre-ae6b9e3).

describe('Stage 5c — protein coupling guard', () => {
  it('N=200 protein diversity + WEEKLY_CAP hits', () => {
    const N = 200;
    let sumDistinct = 0, sumFamilies = 0;
    const capHits = {};
    for (let i = 0; i < N; i++) {
      const r = run(i + 1);
      const allProts = [];
      r.days.forEach(day => {
        if (day.special === 'libre') return;
        allProts.push(protKey(getMeal(day,'Comida')));
        allProts.push(protKey(getMeal(day,'Cena')));
      });
      const real = allProts.filter(p => p!=='none'&&p!=='freeform'&&p!=='libre');
      const distinct = new Set(real);
      sumDistinct += distinct.size;
      const fams = new Set([...distinct].map(p=>FAMILY[p]||p));
      sumFamilies += fams.size;
      // count per protein/family for WEEKLY_CAP comparison
      const counts = {};
      real.forEach(p => {
        counts[p] = (counts[p]||0)+1;
        const f = FAMILY[p];
        if (f) counts[f] = (counts[f]||0)+1;
      });
      Object.keys(WEEKLY_CAP).forEach(k => {
        if ((counts[k]||0) >= WEEKLY_CAP[k]) capHits[k] = (capHits[k]||0) + 1;
      });
    }
    console.log('=== STAGE 5c — protein coupling guard (N=200) ===');
    console.log('distintas/semana (media):', (sumDistinct/N).toFixed(2));
    console.log('familias/semana (media):', (sumFamilies/N).toFixed(2));
    console.log('WEEKLY_CAP hits (% semanas):', JSON.stringify(
      Object.fromEntries(Object.entries(capHits).map(([k,v])=>[k,(v/N*100).toFixed(1)+'%']))
    ));
  });
});
