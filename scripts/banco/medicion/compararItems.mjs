// Compara dos volcados de volcarItems.mjs (base y variante): comidas que cambian, adónde va la
// energía (qué ingredientes suben y bajan) y, por perfil, semanas fuera de ±5 %, proteína media
// del día y comidas principales cortas de proteína (aproximación: < 0,3 g/kg releídos).
// Uso: node scripts/banco/medicion/compararItems.mjs <base.json> <variante.json>
import fs from 'node:fs';

const R = new URL('../../../', import.meta.url).href;
const { PERFILES } = await import(R + 'scripts/banco/perfiles.mjs');

// Los 12 ingredientes (más los dos aceites, que la variante no toca) que alguna ficha pide por
// debajo de su mínimo: ver fichasBajoMinimo.mjs.
const BAJO_MINIMO = new Set(['yogur_natural', 'yogur_griego_0', 'aguacate', 'clara', 'avena', 'pasta_seco', 'mejillon', 'guisantes', 'queso_fresco', 'tortilla_maiz', 'garbanzos_cocidos', 'leche_semi']);

const [fBase, fVar] = process.argv.slice(2);
const base = JSON.parse(fs.readFileSync(fBase));
const vari = JSON.parse(fs.readFileSync(fVar));
const V = new Map(vari.comidas.map((c) => [c.k, c]));

let cambiadas = 0, directas = 0, redis = 0, dkDir = 0, dkRed = 0, otroPlato = 0;
const por = {};
for (const b of base.comidas) {
  const a = V.get(b.k);
  if (!a) continue;
  if (a.title !== b.title) { otroPlato++; continue; }
  const d = {};
  for (const c of new Set([...Object.keys(a.it), ...Object.keys(b.it)])) { const x = (a.it[c] || 0) - (b.it[c] || 0); if (Math.abs(x) >= 0.5) d[c] = x; }
  if (!Object.keys(d).length) continue;
  cambiadas++;
  const dir = Object.keys(d).some((c) => BAJO_MINIMO.has(c) && d[c] < 0);
  if (dir) { directas++; dkDir += a.kcal - b.kcal; } else { redis++; dkRed += a.kcal - b.kcal; }
  for (const [c, x] of Object.entries(d)) {
    const r = por[c] = por[c] || { sube: 0, gSube: 0, maxSube: 0, baja: 0, gBaja: 0, maxBaja: 0 };
    if (x > 0) { r.sube++; r.gSube += x; r.maxSube = Math.max(r.maxSube, x); } else { r.baja++; r.gBaja += x; r.maxBaja = Math.min(r.maxBaja, x); }
  }
}
console.log(`Comidas que cambian: ${cambiadas} de ${base.comidas.length} (directas ${directas}, Δkcal ${Math.round(dkDir)}; por redistribución ${redis}, Δkcal ${Math.round(dkRed)}); con otro plato: ${otroPlato}`);
for (const [c, r] of Object.entries(por).sort((x, y) => Math.abs(y[1].gSube) + Math.abs(y[1].gBaja) - Math.abs(x[1].gSube) - Math.abs(x[1].gBaja))) {
  console.log(`  ${c.padEnd(22)} sube en ${String(r.sube).padStart(3)} (+${Math.round(r.gSube)} g, máx +${Math.round(r.maxSube)}) | baja en ${String(r.baja).padStart(3)} (${Math.round(r.gBaja)} g, máx ${Math.round(r.maxBaja)})`);
}

const peso = Object.fromEntries(PERFILES.map((p) => [p.id, Number(p.perfil.weight)]));
const resumen = (d, id) => {
  const sem = d.semanas.filter((s) => s.perfil === id).map((s) => s.desvio);
  if (!sem.length) return null;
  const com = d.comidas.filter((c) => c.k.startsWith(id + '|'));
  const dias = new Map();
  for (const c of com) { const k = c.k.split('|').slice(0, 3).join('|'); dias.set(k, (dias.get(k) || 0) + c.prot); }
  const cortas = com.filter((c) => ['Desayuno', 'Comida', 'Cena'].includes(c.time) && c.prot < 0.3 * peso[id] - 0.5).length;
  return `fuera de ±5 %: ${sem.filter((x) => Math.abs(x) > 5).length} semanas, desvío ${Math.min(...sem).toFixed(1)} … ${Math.max(...sem).toFixed(1)} %, proteína/día ${([...dias.values()].reduce((a, b) => a + b, 0) / dias.size).toFixed(1)} g, principales cortas ${cortas}`;
};
console.log('\nPor perfil (base / variante):');
for (const p of PERFILES) {
  const a = resumen(base, p.id), b = resumen(vari, p.id);
  if (!a && !b) continue;
  console.log(`  ${p.id}\n    base     ${a}\n    variante ${b}`);
}
