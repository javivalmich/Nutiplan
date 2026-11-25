// Catálogo de segundos (proteína con verdura, sin cereal) y de sopas o cremas por perfil, y textos
// de un primero y un segundo a 2174 kcal. MEDICIÓN, no cambia reglas.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/catalogoSegundosSopa.mjs
const R = new URL('../../../', import.meta.url).href;
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { filtrarCatalogo } = await import(R + 'src/plan/engine2App.js');
const { aplicarAjustesD099 } = await import(R + 'src/engine2/dishes/ajustesD099.js');
const { aplicarNombresD105 } = await import(R + 'src/engine2/dishes/alinosD105.js');
const { resolveDishComposition } = await import(R + 'src/engine2/dishes/compositionResolver.js');
const { componerPlato, tuplaDe } = await import(R + 'src/plan/textos/componer.js');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { PERFILES, clonar } = await import(R + 'scripts/banco/perfiles.mjs');
const callado = (f) => { const l = console.log, e = console.error, w = console.warn; console.log = console.error = console.warn = () => {}; try { return f(); } finally { console.log = l; console.error = e; console.warn = w; } };
const fam = (d) => { try { return resolveDishComposition(d).proteinType; } catch { return null; } };
for (const p of PERFILES) {
  const cat = aplicarNombresD105(aplicarAjustesD099(callado(() => filtrarCatalogo(catalogoApp(), clonar(p.perfil), p.kcal, {}).catalogo)));
  const rot = cat.filter((d) => d.rol === 'rotativo');
  const seg = rot.filter((d) => { const t = tuplaDe(d.id); return t && t.tmpl === 'caliente_clasico' && !t.C; });
  const c = (xs) => JSON.stringify(xs.reduce((o, d) => { const f = fam(d); o[f] = (o[f] || 0) + 1; return o; }, {}));
  const sopa = rot.filter((d) => d.plateType === 'sopa_crema' || (tuplaDe(d.id) && tuplaDe(d.id).tmpl === 'sopa_crema'));
  console.log(`${p.id}: rotativos ${rot.length} | segundos (clásico sin cereal) ${seg.length} ${c(seg)} | de ellos con momento comida ${seg.filter((d) => d.momento.includes('comida')).length} ${c(seg.filter((d) => d.momento.includes('comida')))} | sopa/crema ${sopa.length} ${c(sopa)} comida ${sopa.filter((d) => d.momento.includes('comida')).length}`);
  if (p.id === 'omni-2174') {
    for (const d of sopa) console.log('   sopa:', d.nombre, '|', d.momento.join('+'), '|', fam(d), '|', tuplaDe(d.id) ? 'compuesto' : 'redactado', '|', d.plateType);
    const L = cat.find((d) => /Lentejas con piment.n con zanahoria/.test(d.nombre)); const S = cat.find((d) => /Pechuga de pollo a la plancha.*br.coli$/.test(d.nombre));
    for (const d of [L, S]) { const m = componerPlato(d, 'comida', 2174); console.log(JSON.stringify({ title: m.title, p1: m.p1, p2: m.p2, shopping: m.shopping, recipe: m.recipe, gramos: m._componer.gramos }, null, 1)); console.log(leerComida(m).items.map((i) => `${i.clave}:${i.gramos}:${i.como}`).join(' | ')); }
    const a = componerPlato(L, 'comida', 2174); const b = componerPlato(S, 'comida', 2174);
    const j = leerComida({ shopping: [...a.shopping, ...b.shopping], p1: a.p1 + ' · ' + b.p1, p2: a.p2 + ' · ' + b.p2 });
    console.log('junto:', j.items.map((i) => `${i.clave}:${i.gramos}`).join(' | '));
  }
}
