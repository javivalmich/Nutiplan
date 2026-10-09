import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ORIG = 'C:/Users/javiv/fase7-materiales/generacion-2001-2010';
const REGEN = 'C:/Users/javiv/fase7-materiales/regeneracion-765b90a';
const REG_SHA = 'cee27373cfaacc4658bf27241c6d82b1c36d6e10220ce2a315d01db363bc002b';
const HEAD = '765b90a265ade50ac07e99fab82012d565611e98';

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const manifiesto = (d) => JSON.parse(fs.readFileSync(path.join(d, 'manifiesto-generacion.json'), 'utf8'));

function declarados(m, campo) {
  const mapa = new Map(); const huerfanos = [];
  (function rec(x) {
    if (Array.isArray(x)) return x.forEach(rec);
    if (x && typeof x === 'object') {
      if (campo in x) {
        if (typeof x.archivo !== 'string') huerfanos.push(Object.keys(x).join(','));
        else if (mapa.has(x.archivo)) throw new Error(`archivo duplicado (${campo}): ${x.archivo}`);
        else mapa.set(x.archivo, x[campo]);
      }
      Object.values(x).forEach(rec);
    }
  })(m);
  return { mapa, huerfanos };
}

function enDisco(d) {
  const mapa = new Map();
  for (const f of fs.readdirSync(path.join(d, 'planes')).sort())
    mapa.set('planes/' + f, sha(fs.readFileSync(path.join(d, 'planes', f))));
  return mapa;
}

let ok = true;
const chk = (cond, msg) => { console.log((cond ? 'OK   ' : 'FALLO') + ' ' + msg); if (!cond) ok = false; };

const mO = manifiesto(ORIG), mR = manifiesto(REGEN);
const pO = declarados(mO, 'sha256Plan'), pR = declarados(mR, 'sha256Plan');
if (pO.huerfanos.length || pR.huerfanos.length) {
  console.log('HARD STOP: sha256Plan sin archivo en el mismo objeto. Claves:', pO.huerfanos, pR.huerfanos);
  process.exit(2);
}
const dO = enDisco(ORIG), dR = enDisco(REGEN);

console.log('--- (0) procedencia');
for (const [n, m] of [['orig', mO], ['regen', mR]]) {
  chk(m.registroSemillas?.sha256 === REG_SHA, `${n}: sha256 del registro = cee27373…002b`);
  chk(m.codigo?.head === HEAD, `${n}: codigo.head = 765b90a`);
  chk(m.codigo?.arbolLimpio === true, `${n}: arbolLimpio = true`);
}

console.log('--- (iii) nombres');
const nombres = (mp) => [...mp.keys()].sort().join('|');
chk(dO.size === 40 && dR.size === 40, `40 archivos en disco (orig ${dO.size}, regen ${dR.size})`);
chk(pO.mapa.size === 40 && pR.mapa.size === 40, `40 sha256Plan declarados (orig ${pO.mapa.size}, regen ${pR.mapa.size})`);
chk(nombres(dO) === nombres(dR), 'mismos nombres en disco orig/regen');
chk(nombres(dO) === nombres(pO.mapa), 'nombres en disco orig = manifiesto orig');

console.log('--- (ii) original conservado vs manifiesto original');
let c2 = 0; for (const [a, h] of pO.mapa) if (dO.get(a) === h) c2++; else console.log('  difiere:', a);
chk(c2 === 40, `${c2}/40`);

console.log('--- (i) regenerado vs manifiesto original');
let c1 = 0; for (const [a, h] of pO.mapa) if (dR.get(a) === h) c1++; else console.log('  difiere:', a);
chk(c1 === 40, `${c1}/40`);

console.log('--- coherencia interna regen (manifiesto regen vs su disco)');
let c3 = 0; for (const [a, h] of pR.mapa) if (dR.get(a) === h) c3++;
chk(c3 === 40, `${c3}/40`);

console.log('--- secundaria (no criterio): sha256Vista orig vs regen');
const vO = declarados(mO, 'sha256Vista').mapa, vR = declarados(mR, 'sha256Vista').mapa;
let cv = 0; for (const [a, h] of vO) if (vR.get(a) === h) cv++;
console.log(`  ${cv}/${vO.size}`);

console.log(ok ? 'VEREDICTO: REPRODUCE (F-EG.2 satisfecho)' : 'VEREDICTO: NO REPRODUCE');
process.exit(ok ? 0 : 1);