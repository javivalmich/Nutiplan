// MEDICIÓN: perfiles sintéticos (no son del banco) con varias intolerancias, por la entrada de la app. Uso:
//   node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/perfilesSinteticosApp.mjs .
// Perfiles sintéticos (no son del banco) por la entrada de la app: ¿cuántas semanas caen al motor viejo?
import { pathToFileURL } from 'node:url';
const R = pathToFileURL(process.argv[2] + '/').href;
const { generarPlan, platosRecientesPara } = await import(R + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, clonar, SEMANA_INICIAL, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const callar = (f) => { const l = console.log, e = console.error, w = console.warn; console.log = console.error = console.warn = () => {}; try { return f(); } finally { console.log = l; console.error = e; console.warn = w; } };
const base = PERFILES.find((p) => p.id === 'celiaco-2400');
const casos = [['lactosa', 'gluten'], ['lactosa', 'gluten', 'pescado', 'mariscos'], ['gluten', 'pescado', 'mariscos'], ['lactosa', 'gluten', 'huevo']];
for (const intol of casos) {
  const perfil = { ...clonar(base.perfil), intolerances: intol };
  let ant = null; let legacy = 0; let segundos = 0; let red = 0; let pool = 0; const fallos = new Map();
  for (let s = SEMANA_INICIAL; s < SEMANA_INICIAL + 200; s++) {
    const plan = callar(() => generarPlan(clonar(perfil), base.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'sint-' + intol.join('-'), saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) }));
    if (plan.motor === 'legacy') { legacy++; const k = String(plan.motorFallo).replace(/\(.*$/, '').trim(); fallos.set(k, (fallos.get(k) || 0) + 1); }
    const log = plan.decisionLog || [];
    segundos += log.filter((e) => e.causa === 'segundo_de_legumbre').length;
    red += log.filter((e) => e.causa === 'segundos_retirados_d099').length;
    pool += log.filter((e) => e.causa === 'segundos_retirados_pool_vacio').length;
    ant = plan;
  }
  console.log(JSON.stringify({ intol: intol.join('+'), semanas: 200, legacy, segundos, redD099: red, redPool: pool, fallos: Object.fromEntries(fallos) }));
}
