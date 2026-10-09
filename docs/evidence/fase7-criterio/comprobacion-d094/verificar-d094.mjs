// verificar-d094.mjs — verifica el versionado de D-094 (no se versiona en el PR de D-094).
// Uso, desde la raíz del repo:
//   node <ruta>\verificar-d094.mjs <ruta>\d094-entrada.txt --puerta              (antes de crear la rama)
//   node <ruta>\verificar-d094.mjs <ruta>\d094-entrada.txt --pre                 (copia de trabajo, antes del commit)
//   node <ruta>\verificar-d094.mjs <ruta>\d094-entrada.txt HEAD                  (commit de la rama)
//   node <ruta>\verificar-d094.mjs <ruta>\d094-entrada.txt HEAD <sha-rama>       (merge en main)
// Solo lee: no escribe ni modifica nada.
// Código de salida 0 si todos los controles pasan; 1 si alguno falla.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const A10 = '38cd9eea1ef50cacc57aa176b8fc3fe53b7a3b9d';
const RAIZ = 'c:/users/javiv/app-comida';
const ORIGIN = 'https://github.com/javivalmich/Nutiplan.git';
const RAMA = 'docs/d-094-autorizacion-pares';
const ASUNTO_RAMA = 'D-094 autorizacion de una unica ejecucion del modo pares';
const ASUNTO_MERGE = 'Merge D-094 autorizacion modo pares';
const SHA_DEC_A10 = 'a4691660de43a859e9c0dcc2673e610c3bac84cebfb05f01e586961b09b8b72e';
const SUB = 'docs/evidence/fase7-criterio/comprobacion-d093/';
const SHA_ENTRADA = '7c123b7253ec5adeb0464a87669bb432c011834cf4e491ac5b14ab8f83d28a4b';
const BLOBS_CODIGO = {
  'scripts/fase7/pares-run.mjs': 'df12fa7e98287510612034019dca4f08024469d2',
  'scripts/fase7/pares.js': '85f636c37e671d3d6af8e4da66ce1058c340593d',
};
const ESPERADOS = {
  'README.md': '06164b8e4cc26c89368837ba64eb40c03b6902a1ae9977dafff4c17ff1c4252b',
  'verificar-d093.mjs': 'f96406c61173e2adfdeb560428b9fe832c9681873277bfda373727c35f4f948f',
  'd093-entrada.txt': '3e90860eaee23aa45edd4e880043e8a57e651f8f1a7dd51cf09a07f797cf99ef',
  'salidas/1-puerta.txt': '4c8332fda400482c15da74ec5452748e2dcecbc0f5eead4628bd398859774992',
  'salidas/1-puerta.txttype': '8ec338231b3eeb7e0646542ccf180478969702e97ec4fe03cbff5ef559887cbf',
  'salidas/2-check-attr.txt': '8e9cf06cd12438da13b7e07b635af5fbb6a3e0c421aa51555c8c386df0a593b8',
  'salidas/2-check-attr.txttype': '212db553a60d7546f432f80a1b836d5cea539f74c8c1177c9fba02e19d0be858',
  'salidas/3-rama.txt': 'af096ccee2e0dd22c04b0e2f44ec9fc40f34757d6b0bc01c52c9e268f7f57ff0',
  'salidas/4-aplicar.txt': '2b0199f2d3ddb3cd7009fc64eeabb57e81d7da87285d742b5247eb8c5a3a7b2a',
  'salidas/5-pre.txt': 'd43436ed1a2ac2809289265ef01b37cf96abcd43a145062f214dce337d347dd1',
  'salidas/6-rama.txt': '81dc5e81bb1ee82a1520b75f1e73a7d376ab85d8380441db5e7c1dc7867bfe07',
  'salidas/7-main.txt': '8e5bc15198f4020822a925e83685526fc24638cf5a9343f56606d3264dbecc0b',
  'salidas/8-log.txt': '808bbebcf487f06b77ae0326b83b31b889bbc319fc13c7697923ce6841f95ea0',
  'salidas/8-push.txt': 'afebe6ab0c0741130c4eb55544f8b16d21beb721df905bc2d17bf736b93cd7b6',
  'salidas/8-status.txt': '5fbcb2990ad25e368c12219bf3ddca36e464d044e7acac16696fa8cd54159185',
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
if (!rutaEntrada) { console.log('Falta la ruta de d094-entrada.txt'); process.exit(1); }
const arg = process.argv[3] || 'HEAD';
const shaRama = process.argv[4] || '';
const modo = arg === '--puerta' ? 'puerta' : arg === '--pre' ? 'pre' : 'commit';

raiz = gitTxt(['rev-parse', '--show-toplevel']);
const head = gitTxt(['rev-parse', 'HEAD']);
const rama = gitTxt(['rev-parse', '--abbrev-ref', 'HEAD']);
const commit = modo === 'commit' ? gitTxt(['rev-parse', `${arg}^{commit}`]) : head;
console.log('verificar-d094');
console.log(`  modo:              ${modo}`);
console.log(`  commit verificado: ${modo === 'commit' ? commit : '(copia de trabajo)'}`);
console.log(`  padres:            ${gitTxt(['log', '-1', '--format=%P', commit])}`);
console.log(`  asunto:            ${gitTxt(['log', '-1', '--format=%s', commit])}`);
console.log(`  rama actual:       ${rama}`);
console.log(`  HEAD actual:       ${head}`);
console.log(`  raíz del repo:     ${raiz}`);
console.log(`  ancla de partida:  ${A10}`);
console.log(`  sha de la rama:    ${shaRama || '(no indicado)'}`);
console.log(`  node:              ${process.version}`);
console.log(`  fecha:             ${new Date().toISOString()}`);

// Comunes
const entrada = fs.readFileSync(rutaEntrada);
control('E-0', sha256(entrada) === SHA_ENTRADA, `d094-entrada.txt sha256 ${sha256(entrada)}`);
const decA10 = git(['cat-file', 'blob', `${A10}:DECISIONS.md`]);
control('A-0', sha256(decA10) === SHA_DEC_A10, `DECISIONS.md en A10 sha256 ${sha256(decA10)}`);
const decEsperado = Buffer.concat([decA10, Buffer.from('\n', 'utf8'), entrada]);

if (modo === 'puerta') {
  control('P-1', raiz.toLowerCase() === RAIZ, `raíz del repo ${raiz}`);
  control('P-2', rama === 'main', `rama ${rama}`);
  control('P-3', head === A10, `HEAD ${head}`);
  const estado = gitTxt(['status', '--porcelain', '--untracked-files=all']);
  control('P-4', estado === '', `árbol limpio (${estado === '' ? 'sin cambios' : lista(estado).length + ' líneas en status'})`);
  let origin = '';
  try { origin = gitTxt(['remote', 'get-url', 'origin']); } catch {}
  control('P-5', origin === ORIGIN, `origin ${origin}`);
  const enArbol = gitTxt(['ls-tree', '-r', '--name-only', A10, '--', SUB]);
  control('P-6', enArbol === '' && !fs.existsSync(path.join(raiz, SUB)), `${SUB} no existe en A10 ni en disco`);
  let originMain = '';
  try { originMain = gitTxt(['rev-parse', 'origin/main']); } catch {}
  control('P-7', originMain === A10, `origin/main ${originMain}`);
  let ramaExiste = true;
  try { git(['rev-parse', '--verify', '--quiet', `refs/heads/${RAMA}`]); } catch { ramaExiste = false; }
  control('P-8', !ramaExiste, `la rama ${RAMA} no existe todavía`);
  const txt = entrada.toString('utf8');
  control('E-1', !decA10.toString('utf8').includes('## D-094 '), 'la cabecera «## D-094 » no aparece en DECISIONS.md de A10');
  const cabeceras = txt.split('\n').filter((l) => l.startsWith('## D-'));
  control('E-2', cabeceras.length === 1 && txt.startsWith('## D-094 — '), `la entrada tiene una sola cabecera de asiento y es la de D-094 (${cabeceras.length})`);
  control('E-3', entrada.indexOf(0x0d) === -1 && decA10.indexOf(0x0d) === -1 && txt.endsWith('\n') && entrada[0] !== 0xef, 'sin CR en la entrada ni en el blob de A10; entrada sin BOM y con salto final');
}

if (modo === 'pre') {
  control('P-1', raiz.toLowerCase() === RAIZ, `raíz del repo ${raiz}`);
  control('R-1', rama === RAMA, `rama ${rama}`);
  control('R-2', head === A10, `HEAD ${head}`);
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
  const attr = lista(gitTxt(['check-attr', 'text', '--', ...RUTAS_SUB]));
  const unset = attr.filter((l) => l.endsWith(': text: unset'));
  control('V-a.3', unset.length === RUTAS_SUB.length, `atributo text unset en ${unset.length} de ${RUTAS_SUB.length} rutas`);
  if (unset.length !== RUTAS_SUB.length) attr.forEach((l) => console.log('      ' + l));
  const estado = lista(gitTxt(['status', '--porcelain', '--untracked-files=all']));
  const estadoEsperado = [' M DECISIONS.md', ...RUTAS_SUB.map((r) => '?? ' + r)].sort();
  control('V-a.2', igual(estado, estadoEsperado), `git status: ${estado.length} entradas (esperadas ${estadoEsperado.length})`);
  if (!igual(estado, estadoEsperado)) estado.forEach((l) => console.log('      ' + l));
}

if (modo === 'commit') {
  const padres = gitTxt(['log', '-1', '--format=%P', commit]).split(' ');
  const asunto = gitTxt(['log', '-1', '--format=%s', commit]);
  control('V-p', padres[0] === A10, `primer padre ${padres[0]} (${padres.length} padre(s))`);
  if (padres.length === 1) {
    control('V-r', rama === RAMA, `rama actual ${rama} (commit de la rama)`);
    control('V-s', asunto === ASUNTO_RAMA, `asunto «${asunto}»`);
  } else {
    control('V-r', rama === 'main' && padres.length === 2, `rama actual ${rama}; ${padres.length} padres (merge)`);
    control('V-q', /^[0-9a-f]{40}$/.test(shaRama) && padres[1] === shaRama, `segundo padre ${padres[1]}; sha de la rama indicado ${shaRama || '(ninguno)'}`);
    control('V-s', asunto === ASUNTO_MERGE, `asunto «${asunto}»`);
  }
  const decCommit = git(['cat-file', 'blob', `${commit}:DECISIONS.md`]);
  control('V-b', decCommit.equals(decEsperado), `DECISIONS.md blob = A10 + LF + entrada (sha256 commit ${sha256(decCommit)}; sha256 esperado ${sha256(decEsperado)})`);
  const enArbol = lista(gitTxt(['ls-tree', '-r', '--name-only', commit, '--', SUB]));
  control('V-c.0', igual(enArbol, RUTAS_SUB), `la subcarpeta contiene exactamente ${RUTAS_SUB.length} rutas (encontradas: ${enArbol.length})`);
  for (const [f, esperado] of Object.entries(ESPERADOS)) {
    let h = '(ausente)';
    try { h = sha256(git(['cat-file', 'blob', `${commit}:${SUB}${f}`])); } catch {}
    control(`V-c ${f}`, h === esperado, `sha256 blob ${h}`);
  }
  const diff = lista(gitTxt(['diff', '--name-only', A10, commit]));
  control('V-d', igual(diff, RUTAS_DIFF), `git diff --name-only ${A10.slice(0, 7)}..${commit.slice(0, 7)} = ${diff.length} rutas (esperadas ${RUTAS_DIFF.length})`);
  if (!igual(diff, RUTAS_DIFF)) diff.forEach((r) => console.log('      ' + r));
  for (const [ruta, esperado] of Object.entries(BLOBS_CODIGO)) {
    let id = '(ausente)';
    try { id = gitTxt(['rev-parse', `${commit}:${ruta}`]); } catch {}
    control(`V-e ${path.basename(ruta)}`, id === esperado, `blob ${id}`);
  }
}

console.log(`RESULTADO: ${fallos === 0 ? 'TODO PASA' : fallos + ' FALLO(S)'}`);
process.exit(fallos === 0 ? 0 : 1);
