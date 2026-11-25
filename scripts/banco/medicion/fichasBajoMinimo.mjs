// Lista los ingredientes ajustables que alguna ficha (platos del catálogo, platos de dieta y
// desayunos/tentempiés; omnívora, vegetariana y vegana) pide por debajo del mínimo de su rango.
// Resultado al escribirlo: 12 ingredientes más los dos aceites (aove, aceite_semillas, cuyo
// «por debajo» es la conversión de 5 ml a 4,6 g).
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/fichasBajoMinimo.mjs
const R = new URL('../../../', import.meta.url).href;
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { conPlatosDieta } = await import(R + 'src/plan/platosDieta.js');
const { componerPlato } = await import(R + 'src/plan/textos/componer.js');
const { catalogoDesayunos } = await import(R + 'src/plan/desayunosApp.js');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { rangoDe, papelDe } = await import(R + 'src/engine2/nutrientes/raciones.js');
const { COMPOSICION } = await import(R + 'src/engine2/nutrientes/composicion.js');

const B = { intolerances: [], eliminatedFoods: [], extras: {} };
const comidas = new Map();
const add = (origen, m) => { if (m && !comidas.has(origen + m.title)) comidas.set(origen + m.title, { origen, m }); };
for (const p of [B, { ...B, dieta: 'vegetariana' }, { ...B, dieta: 'vegana' }]) {
  for (const d of conPlatosDieta(catalogoApp(), p, { reserva: true })) { try { add('plato', componerPlato(d, d.momento[0], 2000)); } catch { /* plato no componible a ese momento */ } }
  for (const x of catalogoDesayunos(p)) add(x.tipo, x.meal);
}
const por = {};
const fichas = new Set();
for (const { origen, m } of comidas.values()) for (const it of leerComida(m).items) {
  if (/estimado/.test(it.como)) continue;
  const r = rangoDe(it.clave, it.como === 'ud' ? 'ud' : 'g');
  if (papelDe(it.clave, COMPOSICION[it.clave]) === 'fijo' || !r || it.gramos >= r[0] - 0.05) continue;
  (por[it.clave] = por[it.clave] || []).push(`${origen}: «${m.title}» pide «${it.texto}» = ${it.gramos} g (mín ${r[0]} g)`);
  if (!['aove', 'aceite_semillas'].includes(it.clave)) fichas.add(origen + m.title);
}
const sinAceite = Object.keys(por).filter((c) => !['aove', 'aceite_semillas'].includes(c));
console.log(`${sinAceite.length} ingredientes (sin contar aceites) en ${fichas.size} fichas; con aceites, ${Object.keys(por).length}.`);
for (const [k, v] of Object.entries(por).sort((a, b) => b[1].length - a[1].length)) { console.log(`${k}: ${v.length}`); for (const x of v) console.log('   ' + x); }
