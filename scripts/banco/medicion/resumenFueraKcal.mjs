// Resumen de fueraKcal.mjs: MEDICIÓN. Por categoría (momento, tipo de plato, pan) y por medición: comidas, fuera de
// ±5 % (por encima / por debajo) y desviación media de las que quedan fuera; y por perfil, el % fuera.
// Uso: node scripts/banco/medicion/resumenFueraKcal.mjs <salida.md> <etiqueta>=<k.json> [<etiqueta>=<k.json> …]
import fs from 'node:fs';

const [salida, ...args] = process.argv.slice(2);
const MED = args.map((a) => { const k = a.indexOf('='); return [a.slice(0, k), JSON.parse(fs.readFileSync(a.slice(k + 1), 'utf8'))]; });
const n1 = (x) => x.toFixed(1).replace('.', ',');
const pct = (a, b) => (b ? `${n1((100 * a) / b)} %` : '—');
const juntar = (datos) => {
  const out = {};
  for (const { cat } of Object.values(datos)) {
    for (const [k, c] of Object.entries(cat)) {
      const o = (out[k] ||= { total: 0, encima: 0, debajo: 0, desvEncima: 0, desvDebajo: 0, tmplDebajo: {}, tmplEncima: {} });
      for (const x of ['total', 'encima', 'debajo', 'desvEncima', 'desvDebajo']) o[x] += c[x];
      for (const x of ['tmplDebajo', 'tmplEncima']) for (const [t, v] of Object.entries(c[x])) o[x][t] = (o[x][t] || 0) + v;
    }
  }
  return out;
};
const L = [];
const tot = (j) => Object.values(j).reduce((a, c) => ({ total: a.total + c.total, encima: a.encima + c.encima, debajo: a.debajo + c.debajo }), { total: 0, encima: 0, debajo: 0 });
L.push('## Total (9 omnívoros, 200 semanas)', '', '| Medición | Comidas y cenas | Fuera | Por encima | Por debajo |', '|---|---|---|---|---|');
for (const [et, d] of MED) { const t = tot(juntar(d)); L.push(`| ${et} | ${t.total} | ${t.encima + t.debajo} (${pct(t.encima + t.debajo, t.total)}) | ${t.encima} | ${t.debajo} |`); }
const claves = [...new Set(MED.flatMap(([, d]) => Object.keys(juntar(d))))].sort();
L.push('', '## Por categoría', '', '| Categoría | Medición | Comidas | Fuera | Por encima (desv. media) | Por debajo (desv. media) | Plantillas por debajo (las 3 primeras) |', '|---|---|---|---|---|---|---|');
for (const k of claves) {
  for (const [et, d] of MED) {
    const c = juntar(d)[k];
    if (!c) continue;
    const top = Object.entries(c.tmplDebajo).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, v]) => `${t} ${v}`).join(', ');
    L.push(`| ${k} | ${et} | ${c.total} | ${c.encima + c.debajo} (${pct(c.encima + c.debajo, c.total)}) | ${c.encima}${c.encima ? ` (+${n1((100 * c.desvEncima) / c.encima)} %)` : ''} | ${c.debajo}${c.debajo ? ` (${n1((100 * c.desvDebajo) / c.debajo)} %)` : ''} | ${top || '—'} |`);
  }
}
const perfiles = Object.keys(MED[0][1]);
L.push('', '## Por perfil (% fuera; por encima / por debajo)', '', `| Perfil | kcal | ${MED.map(([et]) => et).join(' | ')} |`, `|---|---|${MED.map(() => '---|').join('')}`);
for (const p of perfiles) {
  L.push(`| ${p} | ${MED[0][1][p].kcal} | ${MED.map(([, d]) => { const t = tot(d[p].cat); return `${pct(t.encima + t.debajo, t.total)} (${t.encima} / ${t.debajo})`; }).join(' | ')} |`);
}
fs.writeFileSync(salida, L.join('\n') + '\n');
console.log(L.join('\n'));
