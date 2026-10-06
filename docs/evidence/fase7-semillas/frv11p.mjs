// F-RV.11 (parametrizado): literales enteros exactos en [desde, hasta] con la LIT versionada (scripts/fase7/semillas.js @2aa1157),
// sin exigir contexto, en blobs de texto (binario = NUL en primeros 8000 bytes) y mensajes de commit del perímetro.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
// Uso: node frv11.mjs <repo> <borrador-semillas.json> <desde> <hasta> [ruta a semillas.js; por defecto <repo>/scripts/fase7/semillas.js]
// Escribe frv11_hits_<desde>-<hasta>.json en el directorio actual (ejecútese fuera del repo).
const REPO = process.argv[2];
const BORRADOR = process.argv[3];
const DESDE = Number(process.argv[4]);
const HASTA = Number(process.argv[5]);
if (!Number.isInteger(DESDE) || !Number.isInteger(HASTA) || DESDE > HASTA) throw new Error('intervalo inválido');
const SEMILLAS = process.argv[6] ?? path.join(REPO, 'scripts', 'fase7', 'semillas.js');
const { FUENTES } = await import(pathToFileURL(path.resolve(SEMILLAS)).href);
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { maxBuffer: 1 << 30 });
const LIT = new RegExp(FUENTES.LIT, 'g');
const commits = git('rev-list', '--all').toString().split('\n').filter(Boolean);
const blobs = new Map();
for (const c of commits) {
  for (const e of git('ls-tree', '-r', '-z', c).toString('utf8').split('\0')) {
    if (!e) continue;
    const t = e.indexOf('\t'); const [, tipo, sha] = e.slice(0, t).split(' ');
    if (tipo === 'blob') { if (!blobs.has(sha)) blobs.set(sha, new Set()); blobs.get(sha).add(e.slice(t + 1)); }
  }
}
const dec = new TextDecoder('utf-8', { fatal: false });
const hits = [];
const scan = (texto, origen, id, rutas) => texto.split('\n').forEach((l0, i) => {
  const l = l0.endsWith('\r') ? l0.slice(0, -1) : l0;
  for (const m of l.matchAll(LIT)) { const v = Number(m[0]); if (v >= DESDE && v <= HASTA) hits.push({ origen, id, rutas, linea: i + 1, valor: v, texto: l }); }
});
let binarios = 0;
for (const [sha, rutas] of blobs) {
  const b = git('cat-file', 'blob', sha);
  if (b.subarray(0, 8000).includes(0)) { binarios++; continue; }
  scan(dec.decode(b), 'blob', sha, [...rutas].sort());
}
for (const c of commits) {
  const raw = git('cat-file', 'commit', c); const k = raw.indexOf('\n\n');
  scan(k < 0 ? '' : dec.decode(raw.subarray(k + 2)), 'mensaje', c, []);
}
const d = JSON.parse(fs.readFileSync(BORRADOR, 'utf8'));
const idx = new Map();
for (const g of d.grupos) for (const o of g.ocurrencias) {
  const k = `${o.blob ?? o.commit}:${o.linea}`; if (!idx.has(k)) idx.set(k, new Set()); idx.get(k).add(g.id);
}
for (const h of hits) h.grupos = [...(idx.get(`${h.id}:${h.linea}`) ?? [])].sort();
fs.writeFileSync(`frv11_hits_${DESDE}-${HASTA}.json`, JSON.stringify(hits, null, 1) + '\n');
const lineas = new Set(hits.map((h) => `${h.id}:${h.linea}`));
const nuevas = [...lineas].filter((k) => !idx.has(k));
console.log(`commits ${commits.length}, blobs ${blobs.size} (binarios ${binarios}), apariciones ${hits.length}, lineas ${lineas.size}, lineas sin grupo ${nuevas.length}`);
for (const h of hits) if (!idx.has(`${h.id}:${h.linea}`)) console.log(`${h.origen} ${h.id.slice(0, 7)} ${h.rutas.join(',')} L${h.linea} ${h.valor} | ${h.texto.trim().slice(0, 220)}`);
