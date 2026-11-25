// Compara dos salidas de medirDiseno.mjs (antes y después de un cambio de reglas): menús idénticos,
// comida del domingo, pescado, legumbre, verdura, calorías, proteína, reglas de D-099.3 y restricciones,
// y la sensación térmica de la comida de cada día. MEDICIÓN, no cambia reglas. Se escribió para la
// ampliación de D-114 (la preferencia B no mira la sugerencia, b5a5723).
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/compararPreferenciaB.mjs <antes.json> <despues.json>
import fs from 'node:fs';
const R = new URL('../../../', import.meta.url).href;
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { conPlatosDieta } = await import(R + 'src/plan/platosDieta.js');
const { aplicarNombresD105 } = await import(R + 'src/engine2/dishes/alinosD105.js');
const { aplicarAjustesD099 } = await import(R + 'src/engine2/dishes/ajustesD099.js');
const tf = new Map();
for (const dieta of [undefined, 'vegetariana', 'vegana']) for (const d of aplicarNombresD105(aplicarAjustesD099(conPlatosDieta(catalogoApp(), { dieta }, { reserva: true })))) if (!tf.has(d.nombre)) tf.set(d.nombre, d.tempFeel);
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const f2 = (x) => x.toFixed(2);
const media = (xs) => xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
const clave = (r) => `${r.perfil}|${r.s}`;
const porB = new Map(b.filas.map((r) => [clave(r), r]));
const perfiles = [...new Set(a.filas.map((r) => r.perfil))];
const CON_PESCADO = (p) => !['vegetariana-2000', 'vegana-1400', 'sin-pescado-2000'].includes(p);
const menu = (r) => r.platos.map((p) => `${p.d}${p.mo}${p.t}`).join('|');
const dom = (r) => r.platos.find((p) => p.d === 6 && p.mo === 'C');
const racha3 = (r) => { // comidas servidas seguidas con el mismo tempFeel; la sugerencia del sábado corta la racha
  let n = 0;
  const c = r.platos.filter((p) => p.mo === 'C').sort((x, y) => x.d - y.d);
  for (let i = 2; i < c.length; i++) {
    const t = [c[i - 2], c[i - 1], c[i]];
    if (t.some((p) => p.libre)) continue;
    const v = t.map((p) => tf.get(p.t));
    if (v[0] && v[0] === v[1] && v[1] === v[2]) n += 1;
  }
  return n;
};
console.log(`semanas: ${a.filas.length} antes, ${b.filas.length} después`);
const filas = [];
for (const p of [...perfiles, 'TODOS (9 con pescado)']) {
  const xa = p.startsWith('TODOS') ? a.filas.filter((r) => CON_PESCADO(r.perfil)) : a.filas.filter((r) => r.perfil === p);
  const xb = xa.map((r) => porB.get(clave(r)));
  const iguales = xa.filter((r, k) => menu(r) === menu(xb[k])).length;
  const domIgual = xa.filter((r, k) => dom(r) && dom(xb[k]) && dom(r).t === dom(xb[k]).t).length;
  const muyDom = (xs) => xs.filter((r) => dom(r) && tf.get(dom(r).t) === 'muy_caliente').length;
  const m = (xs, f) => f2(media(xs.map(f)));
  const s = (xs, f) => xs.reduce((t, r) => t + f(r), 0);
  filas.push([p, xa.length, iguales, domIgual, `${muyDom(xa)} → ${muyDom(xb)}`, `${m(xa, (r) => r.pescado)} → ${m(xb, (r) => r.pescado)}`, `${m(xa, (r) => r.legumbre)} → ${m(xb, (r) => r.legumbre)}`,
    `${m(xa, (r) => r.diasSinVerdura)} → ${m(xb, (r) => r.diasSinVerdura)}`, `${m(xa, (r) => r.desvio)} → ${m(xb, (r) => r.desvio)}`, `${xa.filter((r) => !r.dentro).length} → ${xb.filter((r) => !r.dentro).length}`,
    `${m(xa, (r) => r.protDia)} → ${m(xb, (r) => r.protDia)}`, `${m(xa, (r) => r.familiaDiasSeguidosSinAncla)} → ${m(xb, (r) => r.familiaDiasSeguidosSinAncla)}`,
    `${s(xa, racha3)} → ${s(xb, racha3)}`,
    `${s(xa, (r) => Object.values(r.d099).reduce((t, v) => t + v, 0))} → ${s(xb, (r) => Object.values(r.d099).reduce((t, v) => t + v, 0))}`,
    `${s(xa, (r) => r.vetados + r.eliminados)} → ${s(xb, (r) => r.vetados + r.eliminados)}`]);
}
const cab = ['Perfil', 'Semanas', 'Menú idéntico', 'Comida del domingo igual', 'Domingos «muy caliente»', 'Pescado/sem', 'Legumbre/sem', 'Días sin verdura/sem', 'Desvío kcal %', 'Fuera ±5 %', 'Proteína/día', 'Familia días seguidos (sin ancla)/sem', '3 comidas servidas seguidas con el mismo tempFeel', 'D-099.3 (suma de reglas)', 'Vetados o eliminados'];
console.log([`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`, ...filas.map((r) => `| ${r.join(' | ')} |`)].join('\n'));
// Sensación térmica de la comida de cada día (9 perfiles con pescado), antes → después.
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S (sugerencia)', 'D'];
const dist = (o, d) => { const c = {}; for (const r of o.filas.filter((x) => CON_PESCADO(x.perfil))) { const p = r.platos.find((x) => x.d === d && x.mo === 'C'); const t = p ? tf.get(p.t) || '?' : '—'; c[t] = (c[t] || 0) + 1; } return c; };
for (let d = 0; d < 7; d++) { const ca = dist(a, d); const cb = dist(b, d); console.log(`${DIAS[d]}: ${['frio', 'caliente', 'muy_caliente', '?'].map((k) => `${k} ${ca[k] || 0} → ${cb[k] || 0}`).join(' · ')}`); }
