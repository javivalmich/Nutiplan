// Resumen del prototipo de guarnición: MEDICIÓN. Una fila por perfil con main, HEAD y las dos variantes del prototipo
// (con suelo de 2 y sin suelo), a partir de las salidas de cortasProteina.mjs.
// Uso: node scripts/banco/medicion/resumenGuarnicion.mjs <dir> <salida.md> <perfil> [<perfil> …]
//   (en <dir>: g-<perfil>-main.json, g-<perfil>-head.json, g-<perfil>-proto.json y g-<perfil>-sinsuelo.json)
import fs from 'node:fs';
import path from 'node:path';

const [dir, salida, ...perfiles] = process.argv.slice(2);
const n2 = (x) => x.toFixed(2).replace('.', ',');
const n1 = (x) => x.toFixed(1).replace('.', ',');
const leer = (p, v) => JSON.parse(fs.readFileSync(path.join(dir, `g-${p}-${v}.json`), 'utf8')).semanas;
const media = (ss, f) => ss.reduce((a, s) => a + f(s), 0) / ss.length;
const leg = (s) => s.legGuarnicion + s.legPlato;
const L = ['## Comidas y cenas cortas de proteína por semana (proteína del día)', '',
  '| Perfil | main | HEAD | Con suelo | Sin suelo | Sin suelo − con suelo |', '|---|---|---|---|---|---|'];
const L2 = ['## Legumbres por semana (guarnición + plato) y distribución', '',
  '| Perfil | main | HEAD | Con suelo | Sin suelo | Sin suelo: semanas con 0 / 1 / 2 / 3 / más de 3 |', '|---|---|---|---|---|---|'];
for (const p of perfiles) {
  const v = Object.fromEntries(['main', 'head', 'proto', 'sinsuelo'].map((k) => [k, leer(p, k)]));
  const c = (k) => `${n2(media(v[k], (s) => s.cortas))} (${n1(media(v[k], (s) => s.protDia))} %)`;
  const dif = media(v.sinsuelo, (s) => s.cortas) - media(v.proto, (s) => s.cortas);
  L.push(`| ${p} | ${c('main')} | ${c('head')} | ${c('proto')} | ${c('sinsuelo')} | ${dif >= 0 ? '+' : ''}${n2(dif)} |`);
  const l = (k) => `${n2(media(v[k], (s) => s.legGuarnicion))} + ${n2(media(v[k], (s) => s.legPlato))}`;
  const dist = [0, 1, 2, 3].map((n) => v.sinsuelo.filter((s) => leg(s) === n).length).join(' / ') + ` / ${v.sinsuelo.filter((s) => leg(s) > 3).length}`;
  L2.push(`| ${p} | ${l('main')} | ${l('head')} | ${l('proto')} | ${l('sinsuelo')} | ${dist} |`);
}
const texto = [...L, '', ...L2, ''].join('\n');
fs.writeFileSync(salida, texto);
console.log(texto);
