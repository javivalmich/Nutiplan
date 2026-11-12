// Diagnóstico de las comidas cuyas kcal declaradas (m.nutricion) difieren de las releídas del
// texto más que el umbral del banco (máx(15 kcal, 3 %)), con lo decidido frente a la compra por
// ingrediente. Y recuento de las líneas de aceite aromatizado con ajo (adaptación SIBO).
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/diagSibo.mjs [perfil] [--detalle]
const R = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(R + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, clonar, SEMANA_INICIAL, SEMANAS_POR_DEFECTO, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { medirComida } = await import(R + 'src/plan/medidor/medir.js');
const { racionesCalculadas } = await import(R + 'scripts/banco/metricas.mjs');
const { COMPOSICION } = await import(R + 'src/engine2/nutrientes/composicion.js');

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--')) || 'sibo-2000';
const detalle = args.includes('--detalle');
const p = PERFILES.find((x) => x.id === id);
const log = console.log;
const err = console.error;
let ant = null;
const casos = [];
let conAromatizado = 0, conAromatizadoYAove = 0, lineasAceite = 0, comidas = 0;
for (let s = SEMANA_INICIAL; s < SEMANA_INICIAL + SEMANAS_POR_DEFECTO; s++) {
  console.log = console.error = () => {};
  const plan = generarPlan(clonar(p.perfil), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
  console.log = log; console.error = err;
  for (const day of plan.days) {
    const calc = racionesCalculadas(day, p.perfil, p.kcal);
    day.meals.forEach((m, i) => {
      if (!m) return;
      comidas++;
      const items = leerComida(m).items;
      const aceites = items.filter((x) => x.clave === 'aove' || x.clave === 'aceite_semillas');
      lineasAceite += aceites.length;
      const arom = (m.shopping || []).some((l) => /aromatizado/i.test(l));
      if (arom) { conAromatizado++; if (items.some((x) => x.clave === 'aove')) conAromatizadoYAove++; }
      if (!m.nutricion) return;
      const rel = medirComida(m, COMPOSICION).kcal;
      const dk = rel - m.nutricion.kcal;
      if (Math.abs(dk) <= Math.max(15, 0.03 * m.nutricion.kcal)) return;
      const res = calc.comidas[String(i)];
      const dec = new Map(); for (const x of res.items) dec.set(x.clave, (dec.get(x.clave) || 0) + x.gramos);
      const com = new Map(); for (const x of items) com.set(x.clave, (com.get(x.clave) || 0) + x.gramos);
      const dif = [];
      for (const k of new Set([...dec.keys(), ...com.keys()])) { const a = dec.get(k) || 0, b = com.get(k) || 0; if (Math.abs(a - b) >= 1) dif.push(`${k}: decidido ${a} / compra ${b}`); }
      casos.push({ s, dia: day.name, time: m.time, title: m.title, declarada: m.nutricion.kcal, releida: Math.round(rel), dk: Math.round(dk), aromatizado: arom, aceites: aceites.map((x) => `${x.texto} → ${x.clave} ${x.gramos} g (${x.como})`), dif });
    });
  }
  ant = plan;
}
const porCausa = { aromatizado: casos.filter((c) => c.aromatizado).length, otras: casos.filter((c) => !c.aromatizado).length };
log(`${id}: ${comidas} comidas; kcal declaradas ≠ releídas: ${casos.length} (con aceite aromatizado ${porCausa.aromatizado}, otras ${porCausa.otras})`);
log(`  comidas con «aceite aromatizado»: ${conAromatizado} (con AOVE además: ${conAromatizadoYAove}); líneas de aceite releídas: ${lineasAceite}`);
if (detalle) log(JSON.stringify(casos, null, 1));
else for (const c of casos) log(`  s${c.s} ${c.dia} ${c.time} «${c.title}»: declarada ${c.declarada}, releída ${c.releida} (${c.dk > 0 ? '+' : ''}${c.dk}) ${c.dif.join('; ')}`);
