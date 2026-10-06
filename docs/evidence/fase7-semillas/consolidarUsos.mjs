// Consolida U (usos) a partir de revision-semillas(.parcial).json y aplica la regla de ventana de F-RV.5(a):
// primer intervalo [k*1000+1, k*1000+10], k >= 1, con intersección vacía con U.
// Uso: node consolidarUsos.mjs <revision.json>   (escribe usos-consolidados.json en el directorio actual)
import fs from 'node:fs';
const rev = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const entradas = [];
for (const [id, e] of Object.entries(rev.clasificaciones)) {
  for (const u of e.aportaUsos ?? []) {
    if (!Number.isInteger(u.desde) || !Number.isInteger(u.hasta) || u.desde > u.hasta) throw new Error(`aportaUsos inválido en ${id}`);
    entradas.push({ desde: u.desde, hasta: u.hasta, grupo: id, clase: e.clase, documental: Boolean(u.origen) });
  }
}
entradas.sort((a, b) => a.desde - b.desde || a.hasta - b.hasta || (a.grupo < b.grupo ? -1 : 1));
const U = [];
for (const x of entradas) {
  const ult = U[U.length - 1];
  if (ult && x.desde <= ult.hasta + 1) { ult.hasta = Math.max(ult.hasta, x.hasta); ult.grupos.add(x.grupo); if (x.documental) ult.conDocumental = true; }
  else U.push({ desde: x.desde, hasta: x.hasta, grupos: new Set([x.grupo]), conDocumental: x.documental });
}
const toca = (a, b) => U.some((u) => u.desde <= b && u.hasta >= a);
const pruebas = [];
let ventana = null;
for (let k = 1; k <= 1000000 && !ventana; k++) {
  const a = k * 1000 + 1, b = k * 1000 + 10;
  const choques = U.filter((u) => u.desde <= b && u.hasta >= a).map((u) => `${u.desde}-${u.hasta} (${[...u.grupos].sort().join(',')})`);
  pruebas.push({ k, intervalo: [a, b], libre: choques.length === 0, choques });
  if (choques.length === 0) ventana = [a, b];
}
const out = {
  revision: process.argv[2].split(/[\\/]/).pop(),
  entradas: entradas.length,
  U: U.map((u) => ({ desde: u.desde, hasta: u.hasta, grupos: [...u.grupos].sort(), conDocumental: u.conDocumental })),
  regla: 'primer [k*1000+1, k*1000+10], k>=1, con intersección vacía con U',
  pruebas, ventana,
};
fs.writeFileSync('usos-consolidados.json', JSON.stringify(out, null, 1) + '\n');
console.log(`entradas de aportaUsos: ${entradas.length}; intervalos de U tras fusionar: ${U.length}`);
for (const u of U) console.log(`  ${u.desde}-${u.hasta}${u.conDocumental ? '  [incluye origen documental]' : ''}  <- ${u.grupos.size} grupos`);
for (const p of pruebas) console.log(`k=${p.k} [${p.intervalo.join('-')}] ${p.libre ? 'LIBRE' : 'choca con ' + p.choques.map((c) => c.split(' ')[0]).join(', ')}`);
console.log(`ventana: ${ventana ? ventana.join('-') : 'ninguna'}`);
