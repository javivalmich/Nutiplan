// Pasos de receta por nivel de energiaCocina en el catálogo de engine2 (investigación del cuestionario, 2026-11-25).
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/pasosReceta.mjs
const R = new URL('../../../', import.meta.url);
const { catalogoApp } = await import(new URL('src/plan/catalogo.js', R));
const mod = await import(new URL('src/plan/textos/componer.js', R)).catch(()=>null);
const comp = mod && (mod.componerPlato);
const cat = catalogoApp();
const t = {};
const rangos = (n)=> n<=3?'1-3':n<=5?'4-5':n<=7?'6-7':'8+';
let fallos=0;
for (const d of cat) {
  let n;
  try { const m = comp(d, d.momento.includes('comida')?'comida':'cena', 2000); n = (m.recipe||[]).length; } catch(e){ fallos++; continue; }
  const k = d.energiaCocina+' '+rangos(n); t[k]=(t[k]||0)+1;
}
console.log(Object.fromEntries(Object.entries(t).sort()), 'fallos', fallos, 'componer?', !!comp);
