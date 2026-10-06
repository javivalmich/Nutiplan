// F-RV.13: evalúa exactamente _hashStr (src/engine/hash.js, blob 308ef701…) sobre las entradas
// acreditadas de los 9 grupos de legacy. No ejecuta ningún motor.
// Uso: node frv13.mjs <repo>   (ejecútese fuera del repo; escribe frv13_resultado.json en el directorio actual)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const REPO = process.argv[2];
const BLOB = '308ef701e2af084fd43fadbf2cb1f78d80595853';
const fuente = execFileSync('git', ['-C', REPO, 'cat-file', 'blob', BLOB]);
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'frv13-')), 'hash.mjs');
fs.writeFileSync(tmp, fuente);
const { _hashStr } = await import(pathToFileURL(tmp).href);
const casos = [
  { grupos: ['G0364', 'G0370', 'G0361', 'G0409'], entrada: 'user-abc:23', origen: "buildPlan.snapshot.test.js@c4248d9: runSeeded('user-abc', 23) -> buildPlan.js@bd40735:29 String(userId)+':'+weekNumber", suma: 0 },
  { grupos: ['G0367'], entrada: 'user-xyz:23', origen: "buildPlan.snapshot.test.js@c4248d9:105 runSeeded('user-xyz', 23)", suma: 0 },
  { grupos: ['G0366'], entrada: 'user-abc:24', origen: "buildPlan.snapshot.test.js@c4248d9:111 runSeeded('user-abc', 24)", suma: 0 },
  { grupos: ['G0380', 'G0379'], entrada: 'baseline-mantenimiento:13', origen: "buildPlan.baseline.test.js@53ba827/f64b15a/adfb8ea: fixture 'mantenimiento_equilibrado (base)' userId 'baseline-mantenimiento', weekNumber 13", suma: 0 },
  { grupos: ['G0410'], entrada: 'baseline-mantenimiento:13', origen: 'idem, mulberry32(manualSeed + 1)', suma: 1 },
];
const res = casos.map((c) => {
  const h = _hashStr(c.entrada);
  const valor = h + c.suma;
  return { ...c, hash: h, valorPasado: valor, valorEfectivoUint32: valor >>> 0, en1001a1010: valor >= 1001 && valor <= 1010 };
});
const out = { hashJsBlob: BLOB, resultados: res };
fs.writeFileSync('frv13_resultado.json', JSON.stringify(out, null, 1) + '\n');
for (const r of res) console.log(`${r.grupos.join(',')} | '${r.entrada}'${r.suma ? ' +1' : ''} -> ${r.valorPasado} | en 1001-1010: ${r.en1001a1010}`);
