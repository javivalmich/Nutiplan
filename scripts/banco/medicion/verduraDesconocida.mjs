// Diseño medido: MEDICIÓN. Platos del catálogo rotativo (perfil omni-2174) con la verdura
// «desconocida», por familia proteica, y lista de los de ave. Un plato cuenta una vez aunque
// valga para comida y cena.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/verduraDesconocida.mjs
const R = new URL('../../../', import.meta.url).href;
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { filtrarCatalogo } = await import(R + 'src/plan/engine2App.js');
const { resolveDishComposition } = await import(R + 'src/engine2/dishes/compositionResolver.js');
const { satisfaceVerdura } = await import(R + 'src/engine2/walk/frequencies.js');
const { PERFILES } = await import(R + 'scripts/banco/perfiles.mjs');
const log = console.log; console.log = console.error = () => {};
const P = PERFILES.find((p) => p.id === 'omni-2174');
const cat = filtrarCatalogo(catalogoApp(), P.perfil, P.kcal, {}).catalogo.filter((d) => d.rol === 'rotativo');
const t = {}; const ave = [];
for (const d of cat) {
  let v; try { v = resolveDishComposition(d); } catch { continue; }
  const x = t[v.proteinType] = t[v.proteinType] || { n: 0, cubre: 0, desconocida: 0, sinVerdura: 0, comida: 0, cena: 0, descComida: 0, descCena: 0 };
  x.n += 1;
  const desc = v.verdura.origen === 'desconocida';
  if (satisfaceVerdura(v)) x.cubre += 1; else if (desc) x.desconocida += 1; else x.sinVerdura += 1;
  for (const mo of d.momento) { x[mo] += 1; if (desc) x[mo === 'comida' ? 'descComida' : 'descCena'] += 1; }
  if (desc && v.proteinType === 'ave') ave.push(`${d.nombre} [${d.momento.join('+')}] (${d.id.startsWith('[') ? 'compuesto' : 'redactado'})`);
}
log(`Catálogo rotativo de omni-2174: ${cat.length} platos`);
log('familia     platos | cubren verdura | «desconocida» | conocida y sin verdura | «desconocida» entre los de comida · entre los de cena');
for (const [k, x] of Object.entries(t).sort((a, b) => b[1].n - a[1].n)) log(`  ${String(k).padEnd(9)} ${String(x.n).padStart(4)} | ${String(x.cubre).padStart(3)} (${Math.round(100 * x.cubre / x.n)} %) | ${String(x.desconocida).padStart(3)} (${Math.round(100 * x.desconocida / x.n)} %) | ${String(x.sinVerdura).padStart(3)} | ${x.descComida}/${x.comida} · ${x.descCena}/${x.cena}`);
log(`\nPlatos de ave con verdura «desconocida» (${ave.length}):`);
for (const a of ave.sort()) log('  - ' + a);
