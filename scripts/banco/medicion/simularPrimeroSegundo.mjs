// Comida con primero (legumbre) y segundo (proteína con verdura) frente al plato único, plato a plato,
// a 1434, 2174 y 3714 kcal. MEDICIÓN en memoria con racionesDia; no toca src/.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/simularPrimeroSegundo.mjs
const R = new URL('../../../', import.meta.url).href;
const { generarPlan } = await import(R + 'src/plan/generarPlan.js');
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { aplicarAjustesD099 } = await import(R + 'src/engine2/dishes/ajustesD099.js');
const { resolveDishComposition } = await import(R + 'src/engine2/dishes/compositionResolver.js');
const { componerPlato, tuplaDe } = await import(R + 'src/plan/textos/componer.js');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { INGREDIENTES } = await import(R + 'src/engine2/nutrientes/ingredientes.js');
const { COMPOSICION } = await import(R + 'src/engine2/nutrientes/composicion.js');
const { racionesDia, papelDe } = await import(R + 'src/engine2/nutrientes/raciones.js');
const { objetivoDe, batidoDelDia, vetadosDe } = await import(R + 'src/plan/racionesApp.js');
const { PERFILES, clonar, SEMANA_INICIAL, MES } = await import(R + 'scripts/banco/perfiles.mjs');

const callado = (f) => { const l = console.log, e = console.error, w = console.warn; console.log = console.error = console.warn = () => {}; try { return f(); } finally { console.log = l; console.error = e; console.warn = w; } };
const MOM = { Desayuno: 'desayuno', Comida: 'comida', Cena: 'cena' };
const fam = (d) => { try { return resolveDishComposition(d).proteinType; } catch { return null; } };
const cat = aplicarAjustesD099(catalogoApp());
const legumbres = cat.filter((d) => fam(d) === 'legumbre');
// Primeros: los compuestos de legumbre sin cereal (legumbre + verdura). Segundos: proteína con verdura, sin cereal.
const primeros = legumbres.filter((d) => { const t = tuplaDe(d.id); return t && !t.C; });
const segundos = cat.filter((d) => { const t = tuplaDe(d.id); return t && t.tmpl === 'caliente_clasico' && !t.C && ['ave', 'carne', 'pescado', 'huevo', 'marisco'].includes(fam(d)); });
const med = (xs) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r0 = (x) => Math.round(x);

function contexto(id) {
  const p = PERFILES.find((x) => x.id === id);
  const plan = callado(() => generarPlan(clonar(p.perfil), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: SEMANA_INICIAL, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: [] }));
  const day = plan.days[2];
  const iComida = day.meals.findIndex((m) => m && m.time === 'Comida');
  const comidas = [];
  day.meals.forEach((m, i) => {
    if (!m) return;
    const b = m._base || m;
    const lectura = leerComida(b);
    comidas.push({ id: String(i), momento: MOM[b.time] || 'tentempie', libre: lectura.libre || !!(b._spec && b._spec.isFree), items: lectura.items.map((it) => ({ clave: it.clave, gramos: it.gramos, unidad: it.como === 'ud' ? 'ud' : 'g', fijo: /estimado/.test(it.como), ...(b.masa ? { masa: true } : {}) })) });
  });
  return { p, day, iComida, comidas, objetivo: objetivoDe(p.perfil, p.kcal), vetados: vetadosDe(p.perfil), batido: batidoDelDia(p.perfil, day) };
}
function itemsDe(d, kcal) {
  const m = callado(() => componerPlato(d, 'comida', kcal));
  return leerComida(m).items.map((it) => ({ clave: it.clave, gramos: it.gramos, unidad: it.como === 'ud' ? 'ud' : 'g', fijo: /estimado/.test(it.como) }));
}
function racionar(ctx, items) {
  const comidas = ctx.comidas.map((c) => (c.id === String(ctx.iComida) ? { ...c, items } : c));
  const r = racionesDia({ comidas, aparte: ctx.batido ? [ctx.batido] : [], objetivo: ctx.objetivo, composicion: COMPOSICION, vetados: ctx.vetados });
  const c = r.comidas[String(ctx.iComida)];
  const g = (pred) => c.items.filter((i) => pred(i)).reduce((a, i) => a + i.gramos, 0);
  const esLeg = (i) => (INGREDIENTES[i.clave] || {}).grupo === 'legumbre';
  const esProt = (i) => COMPOSICION[i.clave] && papelDe(i.clave, COMPOSICION[i.clave]) === 'proteico';
  return { kcal: c.kcal, prot: c.proteina, oK: c.objetivo.kcal, oP: c.objetivo.proteina, gTotal: r0(g(() => true)), gLeg: r0(g(esLeg)), gProt: r0(g(esProt)), anadidos: c.items.filter((i) => i.anadido).map((i) => `${i.clave} ${r0(i.gramos)}`).join('+'), limites: c.items.filter((i) => i.limitado).map((i) => `${i.clave}:${i.limitado}`).join(' '), diaKcal: r.total.kcal, diaProt: r.total.proteina };
}
const resumen = (xs, etiqueta) => {
  const n = xs.length; if (!n) return `${etiqueta}: —`;
  const corta = xs.filter((x) => x.prot < 0.95 * x.oP).length;
  const kFuera = xs.filter((x) => Math.abs(x.kcal - x.oK) > 0.05 * x.oK).length;
  const kAlta = xs.filter((x) => x.kcal > 1.05 * x.oK).length;
  return `${etiqueta.padEnd(34)} n=${String(n).padStart(4)} | kcal med ${r0(med(xs.map((x) => x.kcal)))}/${xs[0].oK} (mín ${Math.min(...xs.map((x) => x.kcal))}, máx ${Math.max(...xs.map((x) => x.kcal))}; fuera ±5 %: ${kFuera}, por arriba ${kAlta}) | prot med ${r0(med(xs.map((x) => x.prot)))}/${xs[0].oP} (mín ${Math.min(...xs.map((x) => x.prot))}, máx ${Math.max(...xs.map((x) => x.prot))}; cortas <95 %: ${corta}) | g totales med ${r0(med(xs.map((x) => x.gTotal)))} | legumbre seca med ${r0(med(xs.map((x) => x.gLeg)))} g | proteico med ${r0(med(xs.map((x) => x.gProt)))} g | con extra ${xs.filter((x) => x.anadidos).length} | día kcal med ${r0(med(xs.map((x) => x.diaKcal)))} prot ${r0(med(xs.map((x) => x.diaProt)))}`;
};

console.log(`primeros (legumbre + verdura, compuestos): ${primeros.length}; segundos (proteína + verdura, sin cereal): ${segundos.length} → ${JSON.stringify(segundos.reduce((o, d) => { const f = fam(d); o[f] = (o[f] || 0) + 1; return o; }, {}))}`);
const detalle = [];
for (const id of ['omni-1434', 'omni-2174', 'omni-3714']) {
  const ctx = contexto(id);
  console.log(`\n=== ${id}: objetivo día ${ctx.objetivo.kcal} kcal, ${ctx.objetivo.proteina} g prot, peso ${ctx.objetivo.pesoKg} kg (mín. por comida ${r0(0.3 * ctx.objetivo.pesoKg)} g); tomas del día: ${ctx.comidas.map((c) => c.momento).join(', ')}`);
  // U: plato único actual, todos los de legumbre
  const U = legumbres.map((d) => ({ d, ...racionar(ctx, itemsDe(d, ctx.p.kcal)) }));
  console.log(resumen(U.filter((x) => x.d.rol === 'rotativo'), 'U  plato único (18 rotativos)'));
  console.log(resumen(U.filter((x) => tuplaDe(x.d.id) && !tuplaDe(x.d.id).C), 'U  legumbre+verdura (14 comp.)'));
  for (const x of U) console.log(`     U ${x.d.nombre.slice(0, 50).padEnd(50)} ${x.kcal}/${x.oK} kcal  ${x.prot}/${x.oP} g  ${x.gTotal} g  leg ${x.gLeg}  prot ${x.gProt}  ${x.anadidos}  [${x.limites}]`);
  // PS
  const a = []; const b = []; const c = [];
  for (const L of primeros) for (const S of segundos) {
    const iL = itemsDe(L, ctx.p.kcal); const iS = itemsDe(S, ctx.p.kcal);
    // a) tal cual: los dos platos en la misma comida, raciones actuales sin tocar
    a.push({ L, S, f: fam(S), ...racionar(ctx, [...iL, ...iS]) });
    // b) primero en media ración fija (todo el primero a la mitad y fijo); el segundo se ajusta
    b.push({ L, S, f: fam(S), ...racionar(ctx, [...iL.map((i) => ({ ...i, gramos: i.gramos / 2, fijo: true })), ...iS]) });
    // c) primero en media ración fija, salvo que la legumbre puede crecer (energético) desde la mitad
    c.push({ L, S, f: fam(S), ...racionar(ctx, [...iL.map((i) => ((INGREDIENTES[i.clave] || {}).grupo === 'legumbre' ? { ...i, gramos: Math.max(50, i.gramos / 2) } : { ...i, gramos: i.gramos / 2, fijo: true })), ...iS]) });
  }
  console.log(resumen(a, 'PSa primero+segundo, raciones hoy'));
  console.log(resumen(b, 'PSb primero media ración fija'));
  console.log(resumen(c, 'PSc primero ½, legumbre ajustable'));
  for (const f of ['ave', 'carne', 'pescado', 'marisco', 'huevo']) { console.log('  ' + resumen(a.filter((x) => x.f === f), `PSa segundo ${f}`)); console.log('  ' + resumen(b.filter((x) => x.f === f), `PSb segundo ${f}`)); }
  const ej = (xs, t) => { const x = xs.find((y) => /Lentejas con pimentón con zanahoria/.test(y.L.nombre) && /Pechuga de pollo a la plancha/.test(y.S.nombre)); if (x) console.log(`  ej. ${t}: «${x.L.nombre}» + «${x.S.nombre}» → ${x.kcal}/${x.oK} kcal, ${x.prot}/${x.oP} g, ${x.gTotal} g, legumbre seca ${x.gLeg} g, proteico ${x.gProt} g, extra: ${x.anadidos || '—'} [${x.limites}]`); };
  ej(a, 'PSa'); ej(b, 'PSb'); ej(c, 'PSc');
  for (const [t, xs] of [['PSa', a], ['PSb', b], ['PSc', c]]) console.log('  ' + resumen(xs.filter((x) => x.f !== 'huevo'), t + ' sin segundos de huevo'));
  const extras = (xs) => { const o = {}; for (const x of xs) for (const e of (x.anadidos ? x.anadidos.split('+') : [])) { const k = e.split(' ')[0]; o[k] = (o[k] || 0) + 1; } return JSON.stringify(o); };
  console.log(`  extras PSa ${extras(a)} · PSb ${extras(b)} · U ${extras(U)}`);
}
