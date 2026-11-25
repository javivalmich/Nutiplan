// Barrido de fichas (MEDICIÓN, no corrige nada): tramos del texto del plato (p1 y p2) que llevan
// UNA sola cifra en gramos o ml y nombran DOS o más ingredientes de la compra, como los ñoquis
// («salsa de espinacas y requesón (150g)»). Los tramos se cortan igual que reescribirTexto
// (src/plan/cantidades.js) y los ingredientes se reconocen con sus mismas raíces.
// Clases:
//   ambigua  la cifra es la cantidad de dos o más de los ingredientes nombrados: el texto no se
//            reescribe cuando cambia uno de ellos (el caso de los ñoquis);
//   de uno   la cifra es la cantidad de uno solo de los nombrados: ese se reescribe bien y el otro
//            va sin cifra;
//   de nadie la cifra no es la cantidad de ninguno de los nombrados (un total, p. ej. una salsa).
// Además comprueba el mecanismo: sube un 40 % cada ingrediente al que corresponde la cifra y mira
// si la compra cambia y el tramo del texto se queda igual (texto desfasado de la compra).
// Universo: platos redactados del catálogo, platos de dieta y desayunos y tentempiés. Los platos
// compuestos no entran: su texto se genera con las cantidades.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/barridoCifraCompartida.mjs
const R = new URL('../../../', import.meta.url).href;
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { platosDeDieta } = await import(R + 'src/plan/platosDieta.js');
const { catalogoDesayunos } = await import(R + 'src/plan/desayunosApp.js');
const { componerPlato } = await import(R + 'src/plan/textos/componer.js');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { reescribirComida } = await import(R + 'src/plan/cantidades.js');
const log = console.log; console.log = console.error = console.warn = () => {};

const normal = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const VACIAS = new Set(['fresco', 'fresca', 'frescos', 'frescas', 'para', 'temporada', 'natural', 'light', 'magra', 'magro', 'cocido', 'cocidos', 'cocidas', 'congelado', 'congelados']);
const raices = (nombre) => normal(nombre).split(/[^a-zñ]+/).filter((w) => w.length >= 4 && !VACIAS.has(w)).map((w) => w.slice(0, Math.max(4, w.length - 2)));
const SEPARADOR = /\s·\s|\s\+\s|,\s|\s—\s/;
const TOKEN = /(\d+(?:[.,]\d+)?)\s*(g\b|ml\b)/g;
const num = (s) => Number(String(s).replace(',', '.'));

const fichas = [];
const BASE = { intolerances: [], eliminatedFoods: [] };
const vistos = new Set();
const anadir = (origen, titulo, meal) => { const k = `${titulo}|${meal.p1}|${meal.p2}`; if (vistos.has(k)) return; vistos.add(k); fichas.push({ origen, titulo, meal }); };
for (const d of catalogoApp()) {
  if (String(d.id).startsWith('[')) continue;
  try { anadir('catálogo redactado', d.nombre, componerPlato(d, d.momento.includes('comida') ? 'comida' : 'cena', 2000)); } catch { /* sin texto propio */ }
}
for (const dieta of ['vegetariana', 'vegana']) for (const d of platosDeDieta(dieta, { reserva: true })) {
  try { anadir('plato de dieta', d.nombre || d.titulo, componerPlato(d, d.momento.includes('comida') ? 'comida' : 'cena', 2000)); } catch { /* idem */ }
}
for (const perfil of [BASE, { ...BASE, dieta: 'vegetariana' }, { ...BASE, dieta: 'vegana' }]) for (const x of catalogoDesayunos(perfil)) anadir('desayuno o tentempié', x.meal.title, x.meal);

const hallazgos = [];
for (const f of fichas) {
  const items = leerComida(f.meal).items.filter((it) => it.gramos > 0);
  for (const campo of ['p1', 'p2']) {
    for (const tramo of String(f.meal[campo] || '').split(SEPARADOR)) {
      const tokens = [...tramo.matchAll(TOKEN)];
      if (tokens.length !== 1) continue;
      const n = normal(tramo);
      const nombrados = items.filter((it) => raices(it.nombre).some((w) => n.includes(w)));
      const claves = [...new Set(nombrados.map((it) => it.clave))];
      if (claves.length < 2) continue;
      const cifra = num(tokens[0][1]);
      const unidad = tokens[0][2];
      const cantidadEscrita = (it) => [...String(it.texto).matchAll(TOKEN)].filter((m) => m[2] === unidad).map((m) => num(m[1]));
      const coincide = nombrados.filter((it) => cantidadEscrita(it).some((v) => Math.abs(v - cifra) < 1e-9));
      const clase = new Set(coincide.map((it) => it.clave)).size >= 2 ? 'ambigua' : coincide.length ? 'de uno' : 'de nadie';
      // Mecanismo: ¿la compra cambia y el tramo no?
      const desfasan = [];
      for (const it of coincide) {
        const despues = Math.round(it.gramos * 1.4);
        const { meal: escrita } = reescribirComida(f.meal, items.map((x) => ({ ...x, despues: x === it ? despues : x.gramos })));
        const compraCambia = JSON.stringify(escrita.shopping) !== JSON.stringify(f.meal.shopping);
        if (compraCambia && String(escrita[campo]).includes(tramo)) desfasan.push(it.nombre);
      }
      hallazgos.push({ origen: f.origen, titulo: f.titulo, campo, tramo: tramo.trim(), nombrados: nombrados.map((it) => it.texto), clase, desfasan });
    }
  }
}
log(`Fichas revisadas: ${fichas.length} (${Object.entries(fichas.reduce((a, f) => { a[f.origen] = (a[f.origen] || 0) + 1; return a; }, {})).map(([k, v]) => `${k} ${v}`).join(', ')})`);
const porClase = (c) => hallazgos.filter((h) => h.clase === c);
log(`Tramos con una cifra y dos o más ingredientes nombrados: ${hallazgos.length}, en ${new Set(hallazgos.map((h) => h.titulo)).size} fichas`);
for (const c of ['ambigua', 'de uno', 'de nadie']) {
  const hs = porClase(c);
  log(`\n── ${c}: ${hs.length} tramos, ${new Set(hs.map((h) => h.titulo)).size} fichas; con texto que se desfasa de la compra: ${hs.filter((h) => h.desfasan.length).length}`);
  for (const h of hs) log(`  [${h.origen}] ${h.titulo} · ${h.campo}: «${h.tramo}» ← ${h.nombrados.join(' | ')}${h.desfasan.length ? `  ⇒ se desfasa al cambiar: ${h.desfasan.join(', ')}` : ''}`);
}
