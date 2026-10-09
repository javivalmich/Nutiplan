// verificar-d093.mjs — verifica el versionado de D-093 (no se versiona en el PR de D-093).
// Uso, desde la raíz del repo:
//   node <ruta>\verificar-d093.mjs <ruta>\d093-entrada.txt --puerta   (antes de crear la rama)
//   node <ruta>\verificar-d093.mjs <ruta>\d093-entrada.txt --pre      (V-a: copia de trabajo, antes del commit)
//   node <ruta>\verificar-d093.mjs <ruta>\d093-entrada.txt [commit]   (blobs de un commit; por defecto HEAD)
// Solo lee: no escribe ni modifica nada.
// Código de salida 0 si todos los controles pasan; 1 si alguno falla.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const A9 = 'aa63f901f389d8fad8acc4c90c37b3a7aa9cf843';
const RAIZ = 'c:/users/javiv/app-comida';
const ORIGIN = 'https://github.com/javivalmich/Nutiplan.git';
const RAMA = 'docs/d-093-criterio';
const SHA_DEC_A9 = '412de41c37d8be4034b3e53e684e9f01bcbce594e9b752a676d5aed289b08d25';
const SUB = 'docs/evidence/fase7-criterio/comprobacion-d092/';
const SHA_ENTRADA = '3e90860eaee23aa45edd4e880043e8a57e651f8f1a7dd51cf09a07f797cf99ef';
const ESPERADOS = {
  'README.md': 'db0dfce5abbd4296ebe8d1d74393abc071bf06feb4bc2ac14b353c70c0849e29',
  'verificar-d092.mjs': '9e98051dfcf388972d543454fcc2d053edd70f9e6f3e12498a15ba7c9f5d6597',
  'd092-entrada.txt': '137729d61490ad97b0457ecdcb43929f4e24d58b17d087074e6e33ea24317241',
  'verificar-rama.txt': 'df0243293d2167965c4cef589cb677d9467ebd1f362193523c3bbcd42454ad0d',
  'verificar-main.txt': '4a87faff9f91be76a51a4c8624515f3054a81513e4f506b30f14f11ae7a14c3b',
};
const RUTAS_SUB = Object.keys(ESPERADOS).map((f) => SUB + f).sort();
const RUTAS_DIFF = ['DECISIONS.md', ...RUTAS_SUB].sort();

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const blobId = (b) => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`, 'utf8'), b])).digest('hex');
let raiz = process.cwd();
const git = (args) => execFileSync('git', args, { cwd: raiz, encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 });
const gitTxt = (args) => git(args).toString('utf8').replace(/\r?\n$/, '');
const lista = (s) => s.split(/\r?\n/).filter(Boolean).sort();
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let fallos = 0;
function control(id, pasa, detalle) { if (!pasa) fallos++; console.log(`${pasa ? 'PASA' : 'FALLA'}  ${id}  ${detalle}`); }

const rutaEntrada = process.argv[2];
if (!rutaEntrada) { console.log('Falta la ruta de d093-entrada.txt'); process.exit(1); }
const arg = process.argv[3] || 'HEAD';
const modo = arg === '--puerta' ? 'puerta' : arg === '--pre' ? 'pre' : 'commit';

raiz = gitTxt(['rev-parse', '--show-toplevel']);
const head = gitTxt(['rev-parse', 'HEAD']);
const rama = gitTxt(['rev-parse', '--abbrev-ref', 'HEAD']);
const commit = modo === 'commit' ? gitTxt(['rev-parse', `${arg}^{commit}`]) : head;
console.log('verificar-d093');
console.log(`  modo:              ${modo}`);
console.log(`  commit verificado: ${modo === 'commit' ? commit : '(copia de trabajo)'}`);
console.log(`  padres:            ${gitTxt(['log', '-1', '--format=%P', commit])}`);
console.log(`  rama actual:       ${rama}`);
console.log(`  HEAD actual:       ${head}`);
console.log(`  raíz del repo:     ${raiz}`);
console.log(`  ancla de partida:  ${A9}`);
console.log(`  node:              ${process.version}`);
console.log(`  fecha:             ${new Date().toISOString()}`);

// Comunes
const entrada = fs.readFileSync(rutaEntrada);
control('E-0', sha256(entrada) === SHA_ENTRADA, `d093-entrada.txt sha256 ${sha256(entrada)}`);
const decA9 = git(['cat-file', 'blob', `${A9}:DECISIONS.md`]);
control('A-0', sha256(decA9) === SHA_DEC_A9, `DECISIONS.md en A9 sha256 ${sha256(decA9)}`);
const decEsperado = Buffer.concat([decA9, Buffer.from('\n', 'utf8'), entrada]);

if (modo === 'puerta') {
  control('P-1', raiz.toLowerCase() === RAIZ, `raíz del repo ${raiz}`);
  control('P-2', rama === 'main', `rama ${rama}`);
  control('P-3', head === A9, `HEAD ${head}`);
  const estado = gitTxt(['status', '--porcelain', '--untracked-files=all']);
  control('P-4', estado === '', `árbol limpio (${estado === '' ? 'sin cambios' : lista(estado).length + ' líneas en status'})`);
  let origin = '';
  try { origin = gitTxt(['remote', 'get-url', 'origin']); } catch {}
  control('P-5', origin === ORIGIN, `origin ${origin}`);
  const enArbol = gitTxt(['ls-tree', '-r', '--name-only', A9, '--', SUB]);
  control('P-6', enArbol === '' && !fs.existsSync(path.join(raiz, SUB)), `${SUB} no existe en A9 ni en disco`);
}

if (modo === 'pre') {
  control('P-1', raiz.toLowerCase() === RAIZ, `raíz del repo ${raiz}`);
  control('R-1', rama === RAMA, `rama ${rama}`);
  control('R-2', head === A9, `HEAD ${head}`);
  const idDec = gitTxt(['hash-object', '--path=DECISIONS.md', 'DECISIONS.md']);
  control('V-a.1', idDec === blobId(decEsperado), `DECISIONS.md: blob que generaría git add ${idDec}; esperado ${blobId(decEsperado)} (sha256 esperado ${sha256(decEsperado)})`);
  for (const [f, esperado] of Object.entries(ESPERADOS)) {
    const ruta = SUB + f;
    let h = '(ausente)', id = '', idPropio = '';
    try {
      const bytes = fs.readFileSync(path.join(raiz, ruta));
      h = sha256(bytes); idPropio = blobId(bytes);
      id = gitTxt(['hash-object', `--path=${ruta}`, ruta]);
    } catch {}
    control(`V-a ${f}`, h === esperado && id === idPropio, `sha256 en disco ${h}; sin conversión al añadir: ${id !== '' && id === idPropio ? 'sí' : 'no'}`);
  }
  const estado = lista(gitTxt(['status', '--porcelain', '--untracked-files=all']));
  const estadoEsperado = [' M DECISIONS.md', ...RUTAS_SUB.map((r) => '?? ' + r)].sort();
  control('V-a.2', igual(estado, estadoEsperado), `git status: ${estado.length} entradas (esperadas ${estadoEsperado.length})`);
  if (!igual(estado, estadoEsperado)) estado.forEach((l) => console.log('      ' + l));
}

if (modo === 'commit') {
  const padres = gitTxt(['log', '-1', '--format=%P', commit]).split(' ');
  control('V-p', padres[0] === A9, `primer padre ${padres[0]} (${padres.length} padre(s))`);
  const decCommit = git(['cat-file', 'blob', `${commit}:DECISIONS.md`]);
  control('V-b', decCommit.equals(decEsperado), `DECISIONS.md blob = A9 + LF + entrada (sha256 commit ${sha256(decCommit)}; sha256 esperado ${sha256(decEsperado)})`);
  const enArbol = lista(gitTxt(['ls-tree', '-r', '--name-only', commit, '--', SUB]));
  control('V-c.0', igual(enArbol, RUTAS_SUB), `la subcarpeta contiene exactamente ${RUTAS_SUB.length} rutas (encontradas: ${enArbol.length})`);
  for (const [f, esperado] of Object.entries(ESPERADOS)) {
    let h = '(ausente)';
    try { h = sha256(git(['cat-file', 'blob', `${commit}:${SUB}${f}`])); } catch {}
    control(`V-c ${f}`, h === esperado, `sha256 blob ${h}`);
  }
  const diff = lista(gitTxt(['diff', '--name-only', A9, commit]));
  control('V-d', igual(diff, RUTAS_DIFF), `git diff --name-only ${A9.slice(0, 7)}..${commit.slice(0, 7)} = ${diff.length} rutas`);
  if (!igual(diff, RUTAS_DIFF)) diff.forEach((r) => console.log('      ' + r));
}

console.log(`RESULTADO: ${fallos === 0 ? 'TODO PASA' : fallos + ' FALLO(S)'}`);
process.exit(fallos === 0 ? 0 : 1);
