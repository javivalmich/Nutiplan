// MEDICIÓN: ¿cuántos segundos repiten el de la semana anterior? Uso desde la raíz:
//   node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/repeticionSegundos.mjs .
// ¿Repite el motor el segundo de la semana anterior? Por la entrada de la app, perfiles del banco, 200 semanas.
import { pathToFileURL } from 'node:url';
const R = pathToFileURL(process.argv[2] + '/').href;
const { generarPlan, platosRecientesPara } = await import(R + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, clonar, SEMANA_INICIAL, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const callar = (f) => { const l = console.log, e = console.error, w = console.warn; console.log = console.error = console.warn = () => {}; try { return f(); } finally { console.log = l; console.error = e; console.warn = w; } };
let total = 0; let repetidos = 0; let semanas = 0;
for (const p of PERFILES.filter((x) => ['omni-2174', 'omni-1434', 'sin-pescado-2000', 'celiaco-2400'].includes(x.id))) {
  let ant = null; let segAnt = new Set(); let rep = 0; let n = 0;
  for (let s = SEMANA_INICIAL; s < SEMANA_INICIAL + 200; s++) {
    const plan = callar(() => generarPlan(clonar(p.perfil), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) }));
    const segs = (plan.decisionLog || []).filter((e) => e.causa === 'segundo_de_legumbre').map((e) => e.plato);
    n += segs.length; rep += segs.filter((id) => segAnt.has(id)).length; semanas += 1;
    segAnt = new Set(segs); ant = plan;
  }
  total += n; repetidos += rep;
  console.log(JSON.stringify({ perfil: p.id, segundos: n, repiten_segundo_de_la_semana_anterior: rep }));
}
console.log(JSON.stringify({ semanas, segundos: total, repetidos }));
