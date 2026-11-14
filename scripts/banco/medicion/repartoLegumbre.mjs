// Reparto de la legumbre por día de la semana, platos de legumbre servidos y platos de rol ancla,
// sobre una salida de medirDiseno.mjs. MEDICIÓN, no cambia reglas.
// Uso: node scripts/banco/medicion/repartoLegumbre.mjs <salida de medirDiseno.json>
import fs from 'node:fs';
const f = process.argv[2];
const o = JSON.parse(fs.readFileSync(f, 'utf8'));
const D = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const CON_PESCADO = (p) => !['vegetariana-2000', 'vegana-1400', 'sin-pescado-2000'].includes(p);
const ANCLA_RE = [/^Lentejas.*arroz y zanahoria/, /^Garbanzos (guisados )?con pimientos/, /^Garbanzos.*berenjena/, /^Ternera.*patata y zanahoria/, /^At.n con tomate y pimientos/]; const ANCLA = { includes: (t) => ANCLA_RE.some((re) => re.test(t)) };
console.log(`archivo ${f} cf=${o.cf.join(',') || 'ninguno'} semanas=${o.semanas}`);
const perfiles = [...new Set(o.filas.map((r) => r.perfil))];
const f2 = (x) => x.toFixed(2);
function bloque(nombre, filas) {
  const n = filas.length;
  const serv = filas.flatMap((r) => r.platos.filter((p) => !p.libre).map((p) => ({ ...p, perfil: r.perfil, s: r.s })));
  const leg = serv.filter((p) => p.f === 'legumbre');
  const porDia = D.map((_, i) => leg.filter((p) => p.d === i).length / n);
  const cena = leg.filter((p) => p.mo === 'N').length;
  const hist = {}; for (const r of filas) { const k = r.platos.filter((p) => !p.libre && p.f === 'legumbre').length; hist[k] = (hist[k] || 0) + 1; }
  console.log(`\n## ${nombre}: ${n} semanas · legumbre/sem ${f2(leg.length / n)} · pescado/sem ${f2(filas.reduce((a, r) => a + r.pescado, 0) / n)} · en cena ${cena}`);
  console.log('  legumbre por día (por semana): ' + D.map((d, i) => `${d} ${f2(porDia[i])}`).join(' · '));
  console.log('  semanas con k legumbres: ' + Object.keys(hist).sort().map((k) => `${k}: ${hist[k]} (${Math.round(100 * hist[k] / n)} %)`).join(' · '));
  // patrón de días
  const pat = {}; for (const r of filas) { const k = r.platos.filter((p) => !p.libre && p.f === 'legumbre').map((p) => D[p.d]).join('') || '—'; pat[k] = (pat[k] || 0) + 1; }
  console.log('  patrones de días: ' + Object.entries(pat).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} ${v}`).join(' · '));
  return { n, leg, serv };
}
const todas = o.filas.filter((r) => CON_PESCADO(r.perfil));
const B = bloque('9 perfiles con pescado', todas);
bloque('8 perfiles con pescado sin SIBO (SIBO no tiene platos de legumbre)', todas.filter((r) => r.perfil !== 'sibo-2000'));
for (const p of perfiles) bloque(p, o.filas.filter((r) => r.perfil === p));
// Platos de legumbre: veces por 100 semanas (8 perfiles con pescado sin SIBO)
{
  const filas = todas.filter((r) => r.perfil !== 'sibo-2000');
  const n = filas.length; const c = {}; const esp = {};
  for (const r of filas) for (const p of r.platos) if (!p.libre && p.f === 'legumbre') { c[p.t] = (c[p.t] || 0) + 1; esp[p.e] = (esp[p.e] || 0) + 1; }
  console.log(`\n## Platos de legumbre servidos, por 100 semanas (8 perfiles omnívoros sin SIBO, ${n} semanas)`);
  for (const [t, v] of Object.entries(c).sort((a, b) => b[1] - a[1])) console.log(`  ${(100 * v / n).toFixed(1).padStart(6)}  ${t}`);
  console.log('  por especie /sem: ' + Object.entries(esp).map(([k, v]) => `${k} ${f2(v / n)}`).join(' · '));
  // especie de legumbre repetida > 2 y días seguidos
  let masDe2 = 0; let dosIguales = 0; let seguidos = 0;
  for (const r of filas) { const l = r.platos.filter((p) => !p.libre && p.f === 'legumbre'); const e = {}; for (const p of l) e[p.e] = (e[p.e] || 0) + 1; if (Object.values(e).some((v) => v > 2)) masDe2++; if (Object.values(e).some((v) => v === 2)) dosIguales++; const ds = l.map((p) => p.d).sort(); if (ds.some((d, i) => i && d - ds[i - 1] === 1)) seguidos++; }
  console.log(`  semanas con una legumbre >2 veces: ${masDe2}; con una legumbre 2 veces: ${dosIguales}; con legumbre en días seguidos: ${seguidos}`);
  // paso 4
  const suelo = {}; const sinC = {}; let verdC = 0; let verdN = 0;
  for (const r of filas) { for (const [k, v] of Object.entries(r.paso4.suelo)) suelo[k] = (suelo[k] || 0) + v; for (const [k, v] of Object.entries(r.paso4.sinCand)) sinC[k] = (sinC[k] || 0) + v; verdC += r.paso4.verdura.comida; verdN += r.paso4.verdura.cena; }
  console.log(`  paso 4 por semana: verdura comida ${f2(verdC / n)} cena ${f2(verdN / n)} · suelo ${Object.entries(suelo).map(([k, v]) => `${k} ${f2(v / n)}`).join(' · ')} · sin candidato ${Object.entries(sinC).map(([k, v]) => `${k} ${f2(v / n)}`).join(' · ')}`);
  console.log(`  kcal: desvío medio ${f2(filas.reduce((a, r) => a + r.desvio, 0) / n)} · semanas fuera ±5 %: ${filas.filter((r) => !r.dentro).length} · prot/día media ${f2(filas.reduce((a, r) => a + r.protDia, 0) / n)} · días sin verdura/sem ${f2(filas.reduce((a, r) => a + r.diasSinVerdura, 0) / n)}`);
  // Qué hay el viernes y el jueves a la comida cuando L y X son legumbre
  const lx = filas.filter((r) => { const l = r.platos.filter((p) => !p.libre && p.f === 'legumbre').map((p) => p.d); return l.includes(0) && l.includes(2); });
  const famDia = (d) => { const c2 = {}; for (const r of lx) { const p = r.platos.find((x) => x.d === d && x.mo === 'C'); const k = p ? (p.libre ? 'libre' : p.f) : '—'; c2[k] = (c2[k] || 0) + 1; } return JSON.stringify(c2); };
  console.log(`  semanas con legumbre L y X: ${lx.length}; comida del viernes: ${famDia(4)}; comida del domingo: ${famDia(6)}; del jueves: ${famDia(3)}`);
}
// rol ancla
console.log('\n## Platos de rol ancla servidos (todas las semanas, por perfil)');
for (const p of perfiles) {
  const filas = o.filas.filter((r) => r.perfil === p); const c = {};
  for (const r of filas) for (const x of r.platos) if (ANCLA.includes(x.t)) { const k = `${x.t}${x.libre ? ' [sugerencia]' : ''} @${D[x.d]}`; c[k] = (c[k] || 0) + 1; }
  console.log(`  ${p}: ${Object.keys(c).length ? Object.entries(c).map(([k, v]) => `${k}=${v}`).join(' · ') : 'ninguno'}`);
}
