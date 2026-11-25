// Aceite de la comida doble y primeros repetidos: MEDICIÓN, no cambia reglas. Genera N semanas seguidas por
// perfil del banco por la entrada de la app (generarPlan) del árbol <raíz> y vuelca, por semana, los ml de aceite
// de cada comida y de cada día y los primeros de las comidas dobles. El aceite se lee siempre con el lector de
// ESTE árbol, para que dos raíces se midan igual. Para medir «hoy» (ba52d21) sin worktree:
//   git archive ba52d21 src scripts/banco/resolver.mjs scripts/phaseB2/output/dishes.json | tar -x -C <carpeta>
//   (cd <carpeta> && node --import ./scripts/banco/resolver.mjs <este script> <carpeta> <hoy.json>)
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/aceiteDoble.mjs <raíz> <salida.json> [semanas]
// Resumen: node scripts/banco/medicion/resumenAceiteDoble.mjs <hoy.json> <ahora.json>
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const raiz = pathToFileURL(process.argv[2].replace(/\/?$/, '/')).href;
const ACT = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(raiz + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(raiz + 'src/data/freeformPool.js');
const { PERFILES, MES } = await import(ACT + 'scripts/banco/perfiles.mjs');
// Lector y composición del árbol actual para los dos (misma forma de leer el aceite).
const { leerComida } = await import(ACT + 'src/plan/medidor/leerComida.js');
const { INGREDIENTES } = await import(ACT + 'src/engine2/nutrientes/ingredientes.js');
const { tuplaDe } = await import(ACT + 'src/plan/textos/componer.js');
const SEM = Number(process.argv[4] || 200);
const ml = (m) => leerComida(m).items.filter((it) => it.clave === 'aove' || it.clave === 'aceite_semillas').reduce((a, it) => a + it.gramos / (INGREDIENTES[it.clave].gMl || 0.92), 0);
const l = console.log; console.log = console.warn = console.error = () => {};
const out = [];
for (const p of PERFILES) {
  let ant = null;
  for (let s = 60; s < 60 + SEM; s++) {
    const plan = generarPlan(JSON.parse(JSON.stringify(p.perfil)), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
    ant = plan;
    const fila = { perfil: p.id, s, motor: plan.motor, dias: [], comidas: [], primeros: [] };
    for (const d of plan.days) {
      let dia = 0; let libre = false; let hayDoble = false;
      for (const m of d.meals.filter(Boolean)) {
        if (m.sugerencia) { libre = true; continue; }
        const x = ml(m); dia += x;
        if (m.time !== 'Comida' && m.time !== 'Cena') continue;
        const t = tuplaDe(m._dishId);
        const leg = !!t && t.tmpl === 'legumbre';
        if (m._dishId2) hayDoble = true;
        fila.comidas.push({ d: fila.dias.length, time: m.time, doble: !!m._dishId2, legumbre: leg, ml: Math.round(x * 10) / 10, lineas: (m.shopping || []).filter((q) => /^(aove|aceite)/i.test(q)).length });
        if (m._dishId2) fila.primeros.push({ ...t, d: fila.dias.length });
      }
      fila.dias.push({ ml: Math.round(dia * 10) / 10, libre, doble: hayDoble });
    }
    out.push(fila);
  }
  process.stderr.write(`${p.id} `);
}
fs.writeFileSync(process.argv[3], JSON.stringify(out));
l(`\n${out.length} semanas`);
