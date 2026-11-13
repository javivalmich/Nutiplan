// Auditoría B, detalle (MEDICIÓN): por momento y familia, cuántos platos del catálogo rotativo de
// omni-2174 cubren la verdura del día; cuántas veces el paso 4 atiende cada suelo y cuántas cae a
// «frecuencia corta sin candidato» (9 perfiles con pescado × 8 semanas); y pescado servido según la
// sugerencia del sábado (lee el JSON de auditoriaPescado.mjs).
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/auditoriaPescadoDetalle.mjs <auditoria.json>
import fs from 'node:fs';
const R = new URL('../../../', import.meta.url).href;
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { filtrarCatalogo } = await import(R + 'src/plan/engine2App.js');
const { resolveDishComposition } = await import(R + 'src/engine2/dishes/compositionResolver.js');
const { satisfaceVerdura } = await import(R + 'src/engine2/walk/frequencies.js');
const { generarPlan, platosRecientesPara } = await import(R + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, clonar, SEMANA_INICIAL } = await import(R + 'scripts/banco/perfiles.mjs');
const log = console.log; console.log = console.error = () => {};
const P = PERFILES.find((p) => p.id === 'omni-2174');
const cat = filtrarCatalogo(catalogoApp(), P.perfil, P.kcal, {}).catalogo;
const t = {};
for (const d of cat) { if (d.rol !== 'rotativo') continue; let v; try { v = resolveDishComposition(d); } catch { continue; }
  const fam = v.proteinType === 'marisco' ? 'pescado' : v.proteinType; for (const mo of d.momento) { const k = `${mo}|${fam}`; const x = t[k] = t[k] || { n: 0, verdura: 0, desconocida: 0 }; x.n++; if (satisfaceVerdura(v)) x.verdura++; if (v.verdura.origen === 'desconocida') x.desconocida++; } }
log('omni-2174, catálogo rotativo: por momento y familia, cuántos cubren la verdura del día (y cuántos tienen verdura «desconocida»)');
for (const [k, x] of Object.entries(t).sort()) log(`  ${k.padEnd(18)} ${String(x.n).padStart(3)} platos, cubren verdura ${String(x.verdura).padStart(3)} (${Math.round(100 * x.verdura / x.n)} %), desconocida ${x.desconocida}`);
// Frecuencias cortas sin candidato y veces que el suelo de legumbre o de pescado se atiende, en los perfiles con pescado.
const cuenta = { sinCand: {}, atendida: {}, verduraNivel: 0, huecos: 0 };
for (const p of PERFILES.filter((x) => !['sin-pescado-2000', 'vegetariana-2000', 'vegana-1400'].includes(x.id))) {
  let ant = null;
  for (let s = SEMANA_INICIAL; s < SEMANA_INICIAL + 8; s++) {
    const plan = generarPlan(clonar(p.perfil), p.kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
    for (const e of plan.decisionLog) {
      if (typeof e.decisionId !== 'string' || !e.decisionId.startsWith('walk-select') || !e.plato) continue;
      cuenta.huecos++;
      const ev = e.evidencia || '';
      const m = ev.match(/sin candidato en el pool post-A\/B: \[([^\]]*)\]/); if (m) { const k = `${m[1]} (${e.momento})`; cuenta.sinCand[k] = (cuenta.sinCand[k] || 0) + 1; }
      const a = ev.match(/target="(\w+)" corto/); if (a) { const k = `${a[1]} (${e.momento})`; cuenta.atendida[k] = (cuenta.atendida[k] || 0) + 1; }
      if (/sin verdura aun; nivel preferente/.test(ev)) cuenta.verduraNivel++;
    }
    ant = plan;
  }
}
log('\nHuecos elegidos por el walk (9 perfiles con pescado × 8 semanas):', cuenta.huecos, '; con nivel de verdura:', cuenta.verduraNivel);
log('  suelo atendido:', JSON.stringify(cuenta.atendida));
log('  frecuencia corta sin candidato:', JSON.stringify(cuenta.sinCand));
// Sugerencia del sábado: pescado servido en las semanas en que la sugerencia es pescado, frente al resto.
const d = JSON.parse(fs.readFileSync(process.argv[2]));
const CON_PESCADO = PERFILES.filter((x) => !['sin-pescado-2000', 'vegetariana-2000', 'vegana-1400'].includes(x.id)).map((x) => x.id);
let a = [0, 0], b = [0, 0];
for (const id of CON_PESCADO) for (const s of d.perfiles[id].semanas) { if (s.sugerencia == null) continue; const x = (s.sugerencia === 'pescado' || s.sugerencia === 'marisco') ? a : b; x[0] += s.pescado; x[1]++; }
log(`\nSugerencia del sábado de pescado: ${a[1]} semanas, ${(a[0] / a[1]).toFixed(2)} pescados servidos de media; otras semanas con sugerencia: ${b[1]}, ${(b[0] / b[1]).toFixed(2)}`);
