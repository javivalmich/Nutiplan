// verificar-evidencia.mjs — verifica el versionado de la evidencia de la ejecución del modo pares (D-094, F-094.5).
// Uso, desde la raíz del repo:
//   node <ruta>\verificar-evidencia.mjs <carpeta-contenido> --puerta              (antes de crear la rama)
//   node <ruta>\verificar-evidencia.mjs <carpeta-contenido> --pre                 (copia de trabajo, antes del commit)
//   node <ruta>\verificar-evidencia.mjs <carpeta-contenido> HEAD                  (commit de la rama)
//   node <ruta>\verificar-evidencia.mjs <carpeta-contenido> HEAD <sha-rama>       (merge en main)
// Solo lee: no escribe ni modifica nada.
// Código de salida 0 si todos los controles pasan; 1 si alguno falla.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const A11 = '660eb6b5de6e3a04e369ea65ac0ec149a04ce3b4';
const RAIZ = 'c:/users/javiv/app-comida';
const ORIGIN = 'https://github.com/javivalmich/Nutiplan.git';
const RAMA = 'docs/evidencia-pares';
const ASUNTO_RAMA = 'Evidencia de la ejecucion del modo pares (D-094)';
const ASUNTO_MERGE = 'Merge evidencia ejecucion modo pares';
const DIRS = ['docs/evidence/fase7-pares/', 'docs/evidence/fase7-criterio/comprobacion-d094/'];
const ESPERADOS = {
  'docs/evidence/fase7-pares/.gitattributes': '705fd4d6451a31d36b3df7de96f83f30ac976c9b4a6d1e51671d8e2f33e2d0da',
  'docs/evidence/fase7-pares/README.md': '754b65d106bbd1baf28a716df316943853b74201829063c5c7b2c8cb1da7352f',
  'docs/evidence/fase7-pares/consola-ejecucion-d094.txt': '384101ccff3c10ca59478839209917164f1f3917aac40582dd4f0f3813ce218b',
  'docs/evidence/fase7-pares/stdout.txt': '078e43b64dbd1836b26ca9f3d4e5bf928da85a32833bd66ba5471c917adbaf2f',
  'docs/evidence/fase7-pares/stderr.txt': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'docs/evidence/fase7-pares/transcripcion-preparacion-d094.txt': 'a5a6a027285595f9031336f04c7f3c5aa72062de239e464f7103079c9355a029',
  'docs/evidence/fase7-criterio/comprobacion-d094/README.md': '5401118bcf560f094c904089fc920ba705924cedae5d75d71770cf24a06430db',
  'docs/evidence/fase7-criterio/comprobacion-d094/verificar-d094.mjs': '9931be9c835679dec3dcf4342cfb3e1898010a99c538bcb639556aca94a8032d',
  'docs/evidence/fase7-criterio/comprobacion-d094/d094-entrada.txt': '7c123b7253ec5adeb0464a87669bb432c011834cf4e491ac5b14ab8f83d28a4b',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/1-puerta.txt': 'a303ba7e90883930bfb9914190441928b9229c063d3fe2c0d95d5ecd43d719cb',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/2-checkout.txt': '779b5a6b0f82bb247ca62a21ae06aaa727f7cea70c14352a6f75eff406bb6cac',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/3-aplicar.txt': '8ef70acfcb4cd5484c9edd005f6b4a9c9cd6d2e5876ed27034a928e75fd0fc17',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/4-pre.txt': 'b3415caa591389900cb720b34fede3d4443f575ab7d0768f0d748d301cd7715e',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/5-add.txt': '6057f53f80391a7bda9a92b40ce0ac688727b12650dd4ecee8531e47924ac6ac',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/5-commit.txt': 'e1587ddfea6960e66b351bec3253763cc4fbfc0ef94ea2dddee8916d2839a351',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/6-rama.txt': '1e7850421465239093252deb3a420067f4587e1163df1c911503a36621cb7722',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/6b-rama.txt': 'f59ec0bbf9065d09c99aac50e1e685daa9863b958b27da1383318abdbe9b63ee',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/7-checkout.txt': '6057f53f80391a7bda9a92b40ce0ac688727b12650dd4ecee8531e47924ac6ac',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/7b-checkout.txt': '6878c32723d0cc340b614f2e3d2b694ceb82820faa4cfd98f1d6d75d704d46ba',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/8-merge.txt': '26a1912a0b0aaf6eb0be446732f0ea1ae3ac479295c3f9e725b2420c8bf19eab',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/9-main.txt': '5882e3dd6bf10e9cd435fb16d00fab8d8078f8ab0049c3d27e17036129a79d72',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/10-push.txt': 'd60f45d58b747e9821815773123c6d587e112882d78af8346a98f6488d0f8bd0',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/11-branch.txt': 'd47475046fa0476b546dd31e7374b3dc557cb266086ef679c61a9165b13f5faf',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/12-log.txt': '88cca898aa08713158daa0d515706b70606e203f07d1c0ead730f04cb12a837f',
  'docs/evidence/fase7-criterio/comprobacion-d094/salidas/12-status.txt': '5fbcb2990ad25e368c12219bf3ddca36e464d044e7acac16696fa8cd54159185',
};
const RUTAS = Object.keys(ESPERADOS).sort();

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const blobId = (b) => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`, 'utf8'), b])).digest('hex');
let raiz = process.cwd();
const git = (args) => execFileSync('git', args, { cwd: raiz, encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 });
const gitTxt = (args) => git(args).toString('utf8').replace(/\r?\n$/, '');
const lista = (s) => s.split(/\r?\n/).filter(Boolean).sort();
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let fallos = 0;
function control(id, pasa, detalle) { if (!pasa) fallos++; console.log(`${pasa ? 'PASA' : 'FALLA'}  ${id}  ${detalle}`); }
function ficherosBajo(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...ficherosBajo(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out.sort();
}

const contenido = process.argv[2];
if (!contenido) { console.log('Falta la carpeta de contenido'); process.exit(1); }
const arg = process.argv[3] || 'HEAD';
const shaRama = process.argv[4] || '';
const modo = arg === '--puerta' ? 'puerta' : arg === '--pre' ? 'pre' : 'commit';

raiz = gitTxt(['rev-parse', '--show-toplevel']);
const head = gitTxt(['rev-parse', 'HEAD']);
const rama = gitTxt(['rev-parse', '--abbrev-ref', 'HEAD']);
const commit = modo === 'commit' ? gitTxt(['rev-parse', `${arg}^{commit}`]) : head;
console.log('verificar-evidencia');
console.log(`  modo:              ${modo}`);
console.log(`  commit verificado: ${modo === 'commit' ? commit : '(copia de trabajo)'}`);
console.log(`  padres:            ${gitTxt(['log', '-1', '--format=%P', commit])}`);
console.log(`  asunto:            ${gitTxt(['log', '-1', '--format=%s', commit])}`);
console.log(`  rama actual:       ${rama}`);
console.log(`  HEAD actual:       ${head}`);
console.log(`  raíz del repo:     ${raiz}`);
console.log(`  ancla de partida:  ${A11}`);
console.log(`  sha de la rama:    ${shaRama || '(no indicado)'}`);
console.log(`  node:              ${process.version}`);
console.log(`  fecha:             ${new Date().toISOString()}`);

// Común: la carpeta de contenido tiene exactamente los 25 ficheros, con sus sha256.
let enContenido = [];
try { enContenido = ficherosBajo(contenido); } catch {}
control('C-0', igual(enContenido, RUTAS), `la carpeta de contenido tiene exactamente ${RUTAS.length} ficheros (encontrados: ${enContenido.length})`);
let malos = 0;
for (const r of RUTAS) {
  let h = '(ausente)';
  try { h = sha256(fs.readFileSync(path.join(contenido, r))); } catch {}
  if (h !== ESPERADOS[r]) { malos++; console.log(`      distinto: ${r} ${h}`); }
}
control('C-1', malos === 0, `sha256 de los ${RUTAS.length} ficheros de contenido iguales a los fijados (distintos: ${malos})`);

if (modo === 'puerta') {
  control('P-1', raiz.toLowerCase() === RAIZ, `raíz del repo ${raiz}`);
  control('P-2', rama === 'main', `rama ${rama}`);
  control('P-3', head === A11, `HEAD ${head}`);
  const estado = gitTxt(['status', '--porcelain', '--untracked-files=all']);
  control('P-4', estado === '', `árbol limpio (${estado === '' ? 'sin cambios' : lista(estado).length + ' líneas en status'})`);
  let origin = '';
  try { origin = gitTxt(['remote', 'get-url', 'origin']); } catch {}
  control('P-5', origin === ORIGIN, `origin ${origin}`);
  for (const d of DIRS) {
    const enArbol = gitTxt(['ls-tree', '-r', '--name-only', A11, '--', d]);
    control('P-6', enArbol === '' && !fs.existsSync(path.join(raiz, d)), `${d} no existe en A11 ni en disco`);
  }
  let originMain = '';
  try { originMain = gitTxt(['rev-parse', 'origin/main']); } catch {}
  control('P-7', originMain === A11, `origin/main ${originMain}`);
  let ramaExiste = true;
  try { git(['rev-parse', '--verify', '--quiet', `refs/heads/${RAMA}`]); } catch { ramaExiste = false; }
  control('P-8', !ramaExiste, `la rama ${RAMA} no existe todavía`);
}

if (modo === 'pre') {
  control('P-1', raiz.toLowerCase() === RAIZ, `raíz del repo ${raiz}`);
  control('R-1', rama === RAMA, `rama ${rama}`);
  control('R-2', head === A11, `HEAD ${head}`);
  for (const r of RUTAS) {
    let h = '(ausente)', id = '', idPropio = '';
    try {
      const bytes = fs.readFileSync(path.join(raiz, r));
      h = sha256(bytes); idPropio = blobId(bytes);
      id = gitTxt(['hash-object', `--path=${r}`, r]);
    } catch {}
    control(`V-a ${r.replace(/^docs\/evidence\//, '')}`, h === ESPERADOS[r] && id === idPropio, `sha256 en disco ${h}; sin conversión al añadir: ${id !== '' && id === idPropio ? 'sí' : 'no'}`);
  }
  const attr = lista(gitTxt(['check-attr', 'text', '--', ...RUTAS]));
  const unset = attr.filter((l) => l.endsWith(': text: unset'));
  control('V-a.3', unset.length === RUTAS.length, `atributo text unset en ${unset.length} de ${RUTAS.length} rutas`);
  if (unset.length !== RUTAS.length) attr.forEach((l) => console.log('      ' + l));
  const estado = lista(gitTxt(['status', '--porcelain', '--untracked-files=all']));
  const estadoEsperado = RUTAS.map((r) => '?? ' + r).sort();
  control('V-a.2', igual(estado, estadoEsperado), `git status: ${estado.length} entradas (esperadas ${estadoEsperado.length})`);
  if (!igual(estado, estadoEsperado)) estado.forEach((l) => console.log('      ' + l));
}

if (modo === 'commit') {
  const padres = gitTxt(['log', '-1', '--format=%P', commit]).split(' ');
  const asunto = gitTxt(['log', '-1', '--format=%s', commit]);
  control('V-p', padres[0] === A11, `primer padre ${padres[0]} (${padres.length} padre(s))`);
  if (padres.length === 1) {
    control('V-r', rama === RAMA, `rama actual ${rama} (commit de la rama)`);
    control('V-s', asunto === ASUNTO_RAMA, `asunto «${asunto}»`);
  } else {
    control('V-r', rama === 'main' && padres.length === 2, `rama actual ${rama}; ${padres.length} padres (merge)`);
    control('V-q', /^[0-9a-f]{40}$/.test(shaRama) && padres[1] === shaRama, `segundo padre ${padres[1]}; sha de la rama indicado ${shaRama || '(ninguno)'}`);
    control('V-s', asunto === ASUNTO_MERGE, `asunto «${asunto}»`);
  }
  const enArbol = lista(gitTxt(['ls-tree', '-r', '--name-only', commit, '--', ...DIRS]));
  control('V-c.0', igual(enArbol, RUTAS), `las dos carpetas contienen exactamente ${RUTAS.length} rutas (encontradas: ${enArbol.length})`);
  for (const r of RUTAS) {
    let h = '(ausente)';
    try { h = sha256(git(['cat-file', 'blob', `${commit}:${r}`])); } catch {}
    control(`V-c ${r.replace(/^docs\/evidence\//, '')}`, h === ESPERADOS[r], `sha256 blob ${h}`);
  }
  const diff = lista(gitTxt(['diff', '--name-only', A11, commit]));
  control('V-d', igual(diff, RUTAS), `git diff --name-only ${A11.slice(0, 7)}..${commit.slice(0, 7)} = ${diff.length} rutas (esperadas ${RUTAS.length})`);
  if (!igual(diff, RUTAS)) diff.forEach((r) => console.log('      ' + r));
}

console.log(`RESULTADO: ${fallos === 0 ? 'TODO PASA' : fallos + ' FALLO(S)'}`);
process.exit(fallos === 0 ? 0 : 1);
