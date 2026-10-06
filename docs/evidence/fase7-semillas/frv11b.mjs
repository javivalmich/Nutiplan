// F-RV.11b: falsación complementaria de cotas de campañas. Busca, en todos los blobs de texto alcanzables
// (binario = NUL en los primeros 8000 bytes) y en todos los mensajes de commit del perímetro (git rev-list --all),
// enteros literales de 4+ cifras en estas formas, y nada más:
//   P1  comparación:  <, <=, >, >=  seguido del literal (también "literal <op>")  ['>' precedido de '=' o '-' excluido: => y ->]
//   P2  constante de tamaño: N, N_xxx, xxx_N  o un identificador que contenga semanas|semillas|seeds|weeks|runs|iter|reps|trials  ( = | : ) literal
//   P3  length: literal   (p. ej. Array.from({ length: 1000 }))
// La ausencia de coincidencias solo acredita la cobertura de estos patrones.
// Uso: node frv11b.mjs <repo>   (ejecútese fuera del repo; escribe frv11b_hits.json)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const REPO = process.argv[2];
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { maxBuffer: 1 << 30 });
const NUM = String.raw`(?<![\w$.])(\d{4,})(?![\w]|\.\d)`;
const PATRONES = {
  P1: [new RegExp(String.raw`(?:<=|>=|<|(?<![=\-])>)\s*\(?\s*` + NUM, 'g'), new RegExp(NUM + String.raw`\s*(?:<=|>=|<|>)(?!=)`, 'g')],
  P2: [new RegExp(String.raw`\b(?:N|N_\w+|\w+_N)\s*[:=]\s*` + NUM, 'g'), new RegExp(String.raw`\b\w*(?:semanas|semillas|seeds|weeks|runs|iter|reps|trials)\w*\s*[:=]\s*` + NUM, 'gi')],
  P3: [new RegExp(String.raw`\blength\s*:\s*` + NUM, 'g')],
};
const commits = git('rev-list', '--all').toString().split('\n').filter(Boolean);
const blobs = new Map();
for (const c of commits) for (const e of git('ls-tree', '-r', '-z', c).toString('utf8').split('\0')) {
  if (!e) continue; const t = e.indexOf('\t'); const [, tipo, sha] = e.slice(0, t).split(' ');
  if (tipo === 'blob') { if (!blobs.has(sha)) blobs.set(sha, new Set()); blobs.get(sha).add(e.slice(t + 1)); }
}
const dec = new TextDecoder('utf-8', { fatal: false });
const grupos = new Map();
const scan = (texto, origen, id, rutas) => texto.split('\n').forEach((l0, i) => {
  const l = l0.endsWith('\r') ? l0.slice(0, -1) : l0;
  for (const [p, res] of Object.entries(PATRONES)) for (const re of res) for (const m of l.matchAll(re)) {
    const k = JSON.stringify([p, l.trim()]);
    if (!grupos.has(k)) grupos.set(k, { patron: p, texto: l.trim(), valores: new Set(), ocurrencias: [] });
    const g = grupos.get(k); g.valores.add(Number(m[1]));
    if (!g.ocurrencias.some((o) => o.id === id && o.linea === i + 1)) g.ocurrencias.push({ origen, id, rutas, linea: i + 1 });
  }
});
for (const [sha, rutas] of blobs) {
  const b = git('cat-file', 'blob', sha);
  if (b.subarray(0, 8000).includes(0)) continue;
  scan(dec.decode(b), 'blob', sha, [...rutas].sort());
}
for (const c of commits) { const raw = git('cat-file', 'commit', c); const k = raw.indexOf('\n\n'); scan(k < 0 ? '' : dec.decode(raw.subarray(k + 2)), 'mensaje', c, []); }
const lista = [...grupos.values()].map((g) => ({ ...g, valores: [...g.valores].sort((a, b) => a - b), ocurrencias: g.ocurrencias.sort((a, b) => (a.id + a.linea < b.id + b.linea ? -1 : 1)) }))
  .sort((a, b) => (a.patron + a.texto < b.patron + b.texto ? -1 : 1))
  .map((g, i) => ({ id: `C${String(i + 1).padStart(3, '0')}`, ...g }));
fs.writeFileSync('frv11b_hits.json', JSON.stringify(lista, null, 1) + '\n');
console.log(`commits ${commits.length}, blobs ${blobs.size}, grupos ${lista.length}, ocurrencias ${lista.reduce((n, g) => n + g.ocurrencias.length, 0)}`);
for (const g of lista) console.log(`${g.id} ${g.patron} [${g.valores.join(',')}] x${g.ocurrencias.length} ${g.ocurrencias[0].rutas[0] ?? 'mensaje'} | ${g.texto.slice(0, 110)}`);
