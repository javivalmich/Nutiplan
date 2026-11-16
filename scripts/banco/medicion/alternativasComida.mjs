// Alternativas de la comida: MEDICIÓN, no cambia reglas. Para cada comida servida de N semanas seguidas de varios
// perfiles del banco, pide la alternativa con cada deseo (regenerarComida, como el botón de la app) y cuenta, por deseo:
// alternativas sin candidato (engine2 no encuentra plato), con el deseo relajado y que dan un compuesto de legumbre
// como plato único. Separa las comidas dobles de las de plato único.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/alternativasComida.mjs <salida.json> [semanas]
import fs from 'node:fs';

const R = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara, regenerarComida } = await import(R + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, MES, clonar } = await import(R + 'scripts/banco/perfiles.mjs');
const { esCompuestoLegumbre } = await import(R + 'src/engine2/dishes/bases.js');
const SEM = Number(process.argv[3] || 20);
const DESEOS = ['comfort', 'ligero', 'rapido', 'diferente'];
const l = console.log; console.log = console.warn = console.error = () => {};
const out = {};
for (const id of ['omni-2174', 'omni-1434', 'sin-pescado-2000']) {
  const p = PERFILES.find((x) => x.id === id);
  let ant = null;
  for (let s = 60; s < 60 + SEM; s++) {
    const o = { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {} };
    const plan = generarPlan(clonar(p.perfil), p.kcal, { ...o, platosRecientes: platosRecientesPara(ant, s - 1, s) });
    ant = plan;
    plan.days.forEach((d, i) => {
      const m = d.meals.find((x) => x && x.time === 'Comida');
      if (!m || m.sugerencia || m._motor !== 'engine2' || !m._dishId) return;
      const tipo = m._dishId2 ? 'doble' : 'unico';
      for (const deseo of DESEOS) {
        const k = `${id}|${tipo}|${deseo}`;
        const r = (out[k] = out[k] || { n: 0, sinCandidato: 0, motorViejo: 0, relajado: 0, legumbreCompuesta: 0 });
        r.n += 1;
        const n = regenerarComida(plan, i, 'Comida', deseo, clonar(p.perfil), p.kcal, o);
        if (!n) { r.motorViejo += 1; continue; }
        if (n.alternativaSinCambio) { r.sinCandidato += 1; continue; }
        const nueva = n.days[i].meals.find((x) => x && x.time === 'Comida');
        const log = n.decisionLog.slice((plan.decisionLog || []).length);
        if (log.some((e) => e.causa === 'alternativa_deseo_relajado')) r.relajado += 1;
        if (esCompuestoLegumbre({ id: nueva._dishId })) r.legumbreCompuesta += 1;
      }
    });
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(out));
const tot = {};
for (const [k, r] of Object.entries(out)) { const [, tipo, deseo] = k.split('|'); const t = (tot[`${tipo} ${deseo}`] = tot[`${tipo} ${deseo}`] || { n: 0, sinCandidato: 0, motorViejo: 0, relajado: 0, legumbreCompuesta: 0 }); for (const c of Object.keys(r)) t[c] += r[c]; }
l(JSON.stringify(tot, null, 1));
