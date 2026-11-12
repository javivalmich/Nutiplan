// Gramos de los ingredientes de masa de 4 fichas (crepes, batido, hamburguesa de tofu, pizza)
// a 1434, 2174 y 3714 kcal: cada ficha se pone en los 7 días de la semana 60 del perfil y se
// ajusta el día; mín–máx de gramos y de la proporción frente a un ingrediente de referencia.
// Uso: node --import ./scripts/banco/resolver.mjs [--import ./scripts/banco/medicion/variantesMinimos.mjs] \
//        scripts/banco/medicion/proporcionMasas.mjs [--variante=…]
const R = new URL('../../../', import.meta.url).href;
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { conPlatosDieta } = await import(R + 'src/plan/platosDieta.js');
const { componerPlato } = await import(R + 'src/plan/textos/componer.js');
const { catalogoDesayunos } = await import(R + 'src/plan/desayunosApp.js');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { generarPlan } = await import(R + 'src/plan/generarPlan.js');
const { ajustarDia } = await import(R + 'src/plan/racionesApp.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, clonar, SEMANA_INICIAL, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const log = console.log; console.log = console.error = () => {};
const OBJ = [['omni-1434', 1434], ['omni-2174', 2174], ['omni-3714', 3714]];
const FICHAS = [
  { t: /^Crepes de avena/, mo: 'desayuno', masa: ['avena', 'huevo', 'leche_semi'], ref: 'avena' },
  { t: /^Batido de bebida de soja/, mo: 'desayuno', masa: ['bebida_vegetal', 'tofu_sedoso', 'platano', 'avena'], ref: 'bebida_vegetal' },
  { t: /^Hamburguesa de tofu y avena/, mo: 'cena', masa: ['tofu', 'avena'], ref: 'tofu' },
  { t: /^Pizza proteica/, mo: 'cena', masa: ['harina', 'yogur_griego_0'], ref: 'harina' },
];
const B = { intolerances: [], eliminatedFoods: [], extras: {} };
const res = {};
for (const [pid, kcal] of OBJ) {
  const P = PERFILES.find((x) => x.id === pid);
  const plan = generarPlan(clonar(P.perfil), kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: SEMANA_INICIAL, userId: 'banco-' + pid, saveMealMemory: () => {}, platosRecientes: [] });
  for (const f of FICHAS) {
    let m = null;
    for (const p of [B, { ...B, dieta: 'vegana' }]) {
      if (m) break;
      if (f.mo === 'desayuno') { const x = catalogoDesayunos(p).find((y) => f.t.test(y.meal.title)); if (x) m = x.meal; }
      else { const d = conPlatosDieta(catalogoApp(), p, { reserva: true }).find((y) => { try { return f.t.test(componerPlato(y, f.mo, kcal).title); } catch { return false; } }); if (d) m = componerPlato(d, f.mo, kcal); }
    }
    const slot = f.mo === 'desayuno' ? 'Desayuno' : 'Cena';
    const filas = [];
    for (const day of plan.days) {
      const i = day.meals.findIndex((x) => x && x.time === slot);
      if (i < 0) continue;
      const meals = [...day.meals]; meals[i] = { ...m, time: slot };
      const { day: aj } = ajustarDia({ ...day, meals }, P.perfil, kcal);
      const g = {}; for (const it of leerComida(aj.meals[i]).items) g[it.clave] = (g[it.clave] || 0) + it.gramos;
      filas.push(g);
    }
    const base = {}; for (const it of leerComida(m).items) base[it.clave] = (base[it.clave] || 0) + it.gramos;
    const r = {};
    for (const c of f.masa) { const v = filas.map((g) => g[c] || 0); r[c] = `${Math.round(Math.min(...v))}–${Math.round(Math.max(...v))}`; }
    for (const c of f.masa) if (c !== f.ref) { const v = filas.map((g) => (g[c] || 0) / (g[f.ref] || 1)); r[c + '/' + f.ref] = `${Math.min(...v).toFixed(2)}–${Math.max(...v).toFixed(2)} (ficha ${(base[c] / base[f.ref]).toFixed(2)})`; }
    (res[m.title] = res[m.title] || {})[kcal] = r;
  }
}
log(JSON.stringify(res, null, 1));
