// Comidas dobles en día de ancla, con su receta completa: MEDICIÓN, no cambia reglas. Perfil omni-2174-ancla del
// banco (cocina el domingo anterior); con un día como tercer argumento, el mismo perfil cocinando ese día.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/anclaDoble.mjs <salida.md> [día]
const R = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(R + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const l = console.log; console.log = console.warn = console.error = () => {};
const p0 = PERFILES.find((x) => x.id === 'omni-2174-ancla'); const dia = process.argv[3]; const p = dia ? { ...p0, perfil: { ...p0.perfil, cocinarEnCantidad: { activo: true, dia } } } : p0; let ant = null; const vistos = {}; const cuenta = { cocinar: 0, aprovechar: 0, cocinarConGuardar: 0 };
const out = [];
for (let s = 60; s < 260; s++) {
  const plan = generarPlan(JSON.parse(JSON.stringify(p.perfil)), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) }); ant = plan;
  plan.days.forEach((d) => { for (const m of d.meals.filter((x) => x && x._dishId2 && x._ancla)) {
    const rol = m._ancla.rol; cuenta[rol]++; if (rol === 'cocinar' && m._ancla.guardar && m._ancla.guardar.length) cuenta.cocinarConGuardar++;
    const clave = `${rol === 'cocinar' && m._ancla.guardar && m._ancla.guardar.length ? 'cocinar' : rol}|${m._ancla.base}`;
    if (vistos[clave]) continue; vistos[clave] = true;
    const n = m.nutricion;
    out.push(`### Semana ${s}, ${d.name}: ${rol === 'cocinar' ? 'día de cocinar de más' : 'día de aprovechar'} (base: ${m._ancla.base})`, '',
      `**${m.title}** (${n.kcal} de ${n.objetivoKcal} kcal; ${n.proteina} de ${n.objetivoProteina} g de proteína)`, '', ...(m.slotNote ? [`> ${m.slotNote}`, ''] : []),
      `- ${m.p1}`, `- ${m.p2}`, '', 'Compra:', ...m.shopping.map((x) => `- ${x}`), '', 'Receta:', ...m.recipe.map((x, k) => `${k + 1}. ${x}`), '');
  } });
}
(await import('node:fs')).writeFileSync(process.argv[2], out.join('\n'));
l(JSON.stringify(cuenta));
