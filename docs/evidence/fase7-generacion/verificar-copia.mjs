import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ORIG = 'C:/Users/javiv/fase7-materiales/generacion-2001-2010';
const COPIA = process.argv[2];
if (!COPIA) { console.log('uso: node verificar-copia.mjs <carpeta de la copia>'); process.exit(2); }

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const MF = 'manifiesto-generacion.json';
let ok = true;
const chk = (c, m) => { console.log((c ? 'OK   ' : 'FALLO') + ' ' + m); if (!c) ok = false; };

const shaMO = sha(fs.readFileSync(path.join(ORIG, MF)));
const shaMC = sha(fs.readFileSync(path.join(COPIA, MF)));
console.log('sha256 manifiesto original:', shaMO);
console.log('sha256 manifiesto copia:   ', shaMC);
chk(shaMO === shaMC, 'manifiesto idéntico');

const declarados = new Map();
(function rec(x) {
  if (Array.isArray(x)) return x.forEach(rec);
  if (x && typeof x === 'object') {
    if ('sha256Plan' in x && typeof x.archivo === 'string') declarados.set(x.archivo, x.sha256Plan);
    Object.values(x).forEach(rec);
  }
})(JSON.parse(fs.readFileSync(path.join(ORIG, MF), 'utf8')));

const raiz = fs.readdirSync(COPIA).sort().join('|');
chk(raiz === ['manifiesto-generacion.json', 'planes'].join('|'), `raíz de la copia = manifiesto + planes (${raiz})`);
const enCopia = fs.readdirSync(path.join(COPIA, 'planes')).sort().map((f) => 'planes/' + f);
chk(enCopia.length === 40 && declarados.size === 40, `40 archivos (copia ${enCopia.length}, declarados ${declarados.size})`);
chk(enCopia.join('|') === [...declarados.keys()].sort().join('|'), 'mismos nombres que el manifiesto original');

let n = 0;
for (const [a, h] of declarados) if (sha(fs.readFileSync(path.join(COPIA, a))) === h) n++; else console.log('  difiere:', a);
chk(n === 40, `sha256Plan ${n}/40 contra el manifiesto original`);

console.log(ok ? 'VEREDICTO: COPIA VERIFICADA' : 'VEREDICTO: COPIA NO VERIFICADA');
process.exit(ok ? 0 : 1);