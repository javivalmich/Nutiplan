// F-RV.13 (b): evalúa _hashStr (src/engine/hash.js, blob 308ef701…) sobre los pares userId:weekNumber
// literales de los fixtures del baseline de legacy. Cobertura PARCIAL de la ruta por defecto (buildPlan.js:29).
// Uso: node frv13b.mjs <repo>   (ejecútese fuera del repo; escribe frv13b_resultado.json en el directorio actual)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const REPO = process.argv[2];
const git = (...a) => execFileSync('git', ['-C', REPO, ...a]).toString('utf8');
const HASH_BLOB = '308ef701e2af084fd43fadbf2cb1f78d80595853';
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'frv13b-')), 'hash.mjs');
fs.writeFileSync(tmp, git('cat-file', 'blob', HASH_BLOB));
const { _hashStr } = await import(pathToFileURL(tmp).href);
// Fuentes de fixtures: baselineFixtures.js (única versión) y las dos versiones de buildPlan.baseline.test.js con fixtures en línea.
const FUENTES = [
  ['src/engine/tests/baselineFixtures.js', '025652cfa295cc4077432d3560482847d3d1d569'],
  ['src/engine/tests/buildPlan.baseline.test.js', git('rev-parse', '53ba827').trim()],
  ['src/engine/tests/buildPlan.baseline.test.js', git('rev-parse', 'f64b15a').trim()],
];
const RE = /userId:\s*'([^']*)',\s*\n\s*weekNumber:\s*(\d+),/g;
const pares = new Map();
for (const [ruta, blob] of FUENTES) {
  const texto = git('cat-file', 'blob', blob);
  for (const m of texto.matchAll(RE)) {
    const linea = texto.slice(0, m.index).split('\n').length;
    const k = `${m[1]}:${m[2]}`;
    if (!pares.has(k)) pares.set(k, []);
    pares.get(k).push(`${ruta}@${blob.slice(0, 7)}:${linea}`);
  }
}
const resultados = [...pares].map(([entrada, origenes]) => {
  const v = _hashStr(entrada);
  return { entrada, origenes, valor: v, en1001a1010: v >= 1001 && v <= 1010 };
}).sort((a, b) => (a.entrada < b.entrada ? -1 : 1));
fs.writeFileSync('frv13b_resultado.json', JSON.stringify({ hashJsBlob: HASH_BLOB, resultados }, null, 1) + '\n');
console.log(`pares distintos: ${resultados.length}`);
for (const r of resultados) console.log(`'${r.entrada}' -> ${r.valor} | en 1001-1010: ${r.en1001a1010} | ${r.origenes.length} origenes`);
