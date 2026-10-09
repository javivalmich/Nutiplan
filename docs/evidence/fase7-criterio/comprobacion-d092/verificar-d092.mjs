// verificar-d092.mjs — verifica los blobs del commit de D-092 (no se versiona en el PR de D-092).
// Uso, desde la raíz del repo:
//   node <ruta>\verificar-d092.mjs <ruta>\d092-entrada.txt [commit]
// Por defecto verifica HEAD. Solo lee: no escribe ni modifica nada.
// Código de salida 0 si todos los controles pasan; 1 si alguno falla.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

const ANCLA = 'ff0779974492f68ee704a91f73393fbb8b0b08de';
const CARPETA = 'docs/evidence/fase7-criterio/';
const SHA_ENTRADA = '137729d61490ad97b0457ecdcb43929f4e24d58b17d087074e6e33ea24317241';
const ESPERADOS = {
  '.gitattributes': '705fd4d6451a31d36b3df7de96f83f30ac976c9b4a6d1e51671d8e2f33e2d0da',
  'README.md': 'b2482beb7dba4976f9eb6c98cc5b32987d9464c7c39808e5da83e2127041018d',
  'freeze-r0-motivo-v2.md': 'ac38535a71e0fadc5933ae47f5b2170de9b7f63bf463f97df67f0cdd2282ffdb',
  'fase0.txt': 'ecf72d84c9b29324f20e21844faf25562ce3b6ccfd85b2dc8a20a0ba868d96e4',
  'fase1.txt': '8043cd84b8f6d9aa1867732a739a0f910cb599e3daf3e4ec299c34791760c909',
  'fase2.txt': '5bb32cd9487888f8a3368db088618773d858770da3617915bd326ab68fe7e714',
  'fase2-total.txt': '90f12a442e6e1161fe0a6cbb37ea5df5bb4fe0268196cd367ee86968bd0d0216',
  'fase3.txt': '8edcf741b6f59bcd2aae01b14bff5d7f63a726d46a86aaf47f0d9f48fbc24d95',
};
const RUTAS_DIFF = ['CLAUDE.md', 'DECISIONS.md', ...Object.keys(ESPERADOS).map((f) => CARPETA + f)].sort();
const VIEJO = Buffer.from('hasta que el nuevo gana una evaluación ciega.', 'utf8');
const NUEVO = Buffer.from('hasta que el nuevo cumple la condición de sustitución que fija `DECISIONS.md` para la evaluación ciega.', 'utf8');

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const git = (args) => execFileSync('git', args, { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 });
const gitTxt = (args) => git(args).toString('utf8').replace(/\r?\n$/, '');
const lista = (s) => s.split(/\r?\n/).filter(Boolean).sort();
let fallos = 0;
function control(id, pasa, detalle) { if (!pasa) fallos++; console.log(`${pasa ? 'PASA' : 'FALLA'}  ${id}  ${detalle}`); }
function contar(hay, aguja) { let n = 0, i = -1; while ((i = hay.indexOf(aguja, i + 1)) !== -1) n++; return n; }

const rutaEntrada = process.argv[2];
if (!rutaEntrada) { console.log('Falta la ruta de d092-entrada.txt'); process.exit(1); }
const objetivo = process.argv[3] || 'HEAD';

const commit = gitTxt(['rev-parse', `${objetivo}^{commit}`]);
console.log('verificar-d092');
console.log(`  commit verificado: ${commit}`);
console.log(`  padres:            ${gitTxt(['log', '-1', '--format=%P', commit])}`);
console.log(`  rama actual:       ${gitTxt(['rev-parse', '--abbrev-ref', 'HEAD'])}`);
console.log(`  HEAD actual:       ${gitTxt(['rev-parse', 'HEAD'])}`);
console.log(`  ancla de partida:  ${ANCLA}`);
console.log(`  node:              ${process.version}`);
console.log(`  fecha:             ${new Date().toISOString()}`);

// Entrada de referencia
const entrada = fs.readFileSync(rutaEntrada);
control('E-0', sha256(entrada) === SHA_ENTRADA, `d092-entrada.txt sha256 ${sha256(entrada)}`);

// V-b: CLAUDE.md
const claudeAncla = git(['cat-file', 'blob', `${ANCLA}:CLAUDE.md`]);
const claudeCommit = git(['cat-file', 'blob', `${commit}:CLAUDE.md`]);
const n = contar(claudeAncla, VIEJO);
let claudeEsperado = null;
if (n === 1) {
  const i = claudeAncla.indexOf(VIEJO);
  claudeEsperado = Buffer.concat([claudeAncla.subarray(0, i), NUEVO, claudeAncla.subarray(i + VIEJO.length)]);
}
control('V-b.1', n === 1 && claudeCommit.equals(claudeEsperado),
  `CLAUDE.md blob = ancla con una sola sustitución (ocurrencias en ancla: ${n}; sha256 ancla ${sha256(claudeAncla)}; sha256 commit ${sha256(claudeCommit)})`);

// V-b: DECISIONS.md
const decAncla = git(['cat-file', 'blob', `${ANCLA}:DECISIONS.md`]);
const decCommit = git(['cat-file', 'blob', `${commit}:DECISIONS.md`]);
const decEsperado = Buffer.concat([decAncla, Buffer.from('\n', 'utf8'), entrada]);
control('V-b.2', decCommit.equals(decEsperado),
  `DECISIONS.md blob = ancla + LF + entrada (sha256 ancla ${sha256(decAncla)}; sha256 commit ${sha256(decCommit)}; sha256 esperado ${sha256(decEsperado)})`);

// V-c: carpeta de evidencia
const enArbol = lista(gitTxt(['ls-tree', '-r', '--name-only', commit, '--', CARPETA]));
const esperadasCarpeta = Object.keys(ESPERADOS).map((f) => CARPETA + f).sort();
control('V-c.0', JSON.stringify(enArbol) === JSON.stringify(esperadasCarpeta), `la carpeta contiene exactamente ${esperadasCarpeta.length} rutas (encontradas: ${enArbol.length})`);
for (const [f, esperado] of Object.entries(ESPERADOS)) {
  let h = '(ausente)';
  try { h = sha256(git(['cat-file', 'blob', `${commit}:${CARPETA}${f}`])); } catch {}
  control(`V-c ${f}`, h === esperado, `sha256 blob ${h}`);
}

// V-d: rutas del diff desde el ancla
const diff = lista(gitTxt(['diff', '--name-only', ANCLA, commit]));
control('V-d', JSON.stringify(diff) === JSON.stringify(RUTAS_DIFF), `git diff --name-only ${ANCLA.slice(0, 7)}..${commit.slice(0, 7)} = ${diff.length} rutas`);
if (JSON.stringify(diff) !== JSON.stringify(RUTAS_DIFF)) diff.forEach((r) => console.log('      ' + r));

console.log(`RESULTADO: ${fallos === 0 ? 'TODO PASA' : fallos + ' FALLO(S)'}`);
process.exit(fallos === 0 ? 0 : 1);
