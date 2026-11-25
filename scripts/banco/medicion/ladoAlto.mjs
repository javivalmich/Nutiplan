// Lado alto: cantidad máxima, a 3714 kcal, de cada ingrediente que la ficha pide por debajo de
// su mínimo. Cada ficha afectada se pone en su momento en cada uno de los 7 días de la semana 60
// de omni-3714, se ajusta el día (ajustarDia) y se toma el máximo releído. Con --import de una
// variante, mide la variante.
// Uso: node --import ./scripts/banco/resolver.mjs [--import <variante>] scripts/banco/medicion/ladoAlto.mjs
const R = new URL('../../../', import.meta.url).href;
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { conPlatosDieta } = await import(R + 'src/plan/platosDieta.js');
const { componerPlato } = await import(R + 'src/plan/textos/componer.js');
const { catalogoDesayunos } = await import(R + 'src/plan/desayunosApp.js');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { rangoDe, papelDe } = await import(R + 'src/engine2/nutrientes/raciones.js');
const { COMPOSICION } = await import(R + 'src/engine2/nutrientes/composicion.js');
const { generarPlan } = await import(R + 'src/plan/generarPlan.js');
const { ajustarDia } = await import(R + 'src/plan/racionesApp.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, clonar, SEMANA_INICIAL, MES } = await import(R + 'scripts/banco/perfiles.mjs');

const KCAL = 3714;
const P = PERFILES.find((x) => x.id === 'omni-3714');
const log = console.log;
console.log = console.error = () => {};
const plan = generarPlan(clonar(P.perfil), KCAL, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: SEMANA_INICIAL, userId: 'banco-' + P.id, saveMealMemory: () => {}, platosRecientes: [] });
const B = { intolerances: [], eliminatedFoods: [], extras: {} };
const fichas = new Map();
for (const p of [B, { ...B, dieta: 'vegetariana' }, { ...B, dieta: 'vegana' }]) {
  for (const d of conPlatosDieta(catalogoApp(), p, { reserva: true })) for (const mo of d.momento) { try { const m = componerPlato(d, mo, KCAL); const k = `plato|${mo}|${m.title}`; if (!fichas.has(k)) fichas.set(k, { momento: mo, m }); } catch { /* no componible */ } }
  for (const x of catalogoDesayunos(p)) { const k = `${x.tipo}|${x.meal.title}`; if (!fichas.has(k)) fichas.set(k, { momento: x.tipo === 'desayuno' ? 'desayuno' : 'tentempie', m: x.meal }); }
}
const SLOT = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena' };
const out = [];
for (const [k, { momento, m }] of fichas) {
  const bajo = leerComida(m).items.filter((it) => {
    if (/estimado/.test(it.como)) return false;
    const r = rangoDe(it.clave, it.como === 'ud' ? 'ud' : 'g');
    return papelDe(it.clave, COMPOSICION[it.clave]) !== 'fijo' && r && it.gramos < r[0] - 0.05;
  });
  if (!bajo.length) continue;
  const claves = [...new Set(bajo.map((b) => b.clave))];
  const ficha = Object.fromEntries(claves.map((c) => [c, bajo.filter((b) => b.clave === c).reduce((a, b) => a + b.gramos, 0)]));
  const max = {};
  const ej = {};
  for (const day of plan.days) {
    const i = day.meals.findIndex((x) => x && (SLOT[momento] ? x.time === SLOT[momento] : !['Desayuno', 'Comida', 'Cena'].includes(x.time)));
    if (i < 0 || (day.meals[i]._spec && day.meals[i]._spec.isFree)) continue;
    const meals = [...day.meals];
    meals[i] = { ...m, time: meals[i].time };
    const { day: aj } = ajustarDia({ ...day, meals }, P.perfil, KCAL);
    const items = leerComida(aj.meals[i]).items;
    for (const c of claves) {
      const g = items.filter((x) => x.clave === c).reduce((a, x) => a + x.gramos, 0);
      if (max[c] == null || g > max[c]) { max[c] = Math.round(g * 10) / 10; ej[c] = items.filter((x) => x.clave === c).map((x) => x.texto).join(' + '); }
    }
  }
  out.push({ ficha: k, pide: ficha, maximo: max, texto: ej });
}
log(JSON.stringify(out, null, 1));
