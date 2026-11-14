// Diagnóstico de los días de legumbre sorteados que se quedan sin legumbre (dia_legumbre_sin_candidato):
// imprime la evidencia del hueco de la comida en los primeros casos. MEDICIÓN, no cambia reglas.
// Límite: genera los planes sin montar la comida doble (sin aplicarEstructura de medirEstructura.mjs), así
// que los segundos no pasan a platosSemana y, desde la segunda semana, los menús no son los medidos.
// Uso: node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/estructuraComida.mjs \
//        scripts/banco/medicion/diagDiaSinLegumbre.mjs --ec=suelo3,pescado,todas
const R = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(R + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, clonar, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const { instalar } = await import(R + 'scripts/banco/medicion/estructuraComidaLogica.mjs');
instalar(globalThis.__ecFlags);
const sil = (f) => { const l = console.log, e = console.error, w = console.warn; console.log = console.error = console.warn = () => {}; try { return f(); } finally { console.log = l; console.error = e; console.warn = w; } };
const p = PERFILES.find((x) => x.id === 'omni-1434');
let ant = null; const dias = {}; let n = 0;
for (let s = 60; s < 260; s++) {
  const plan = sil(() => generarPlan(clonar(p.perfil), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) }));
  // OJO: sin aplicarEstructura, platosSemana no lleva los segundos; vale para ver la causa.
  for (const e of plan.decisionLog.filter((x) => x.causa === 'dia_legumbre_sin_candidato')) {
    dias[e.day] = (dias[e.day] || 0) + 1; n++;
    const h = plan.decisionLog.find((x) => x.day === e.day && x.momento === 'comida' && x.plato);
    if (n <= 6) console.log(s, e.day, '\n   ', (h.evidencia || '').slice(0, 600));
  }
  ant = plan;
}
console.log(n, dias);
