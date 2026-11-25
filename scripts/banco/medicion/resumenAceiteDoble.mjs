// Resumen de aceiteDoble.mjs: MEDICIÓN. Uso: node scripts/banco/medicion/resumenAceiteDoble.mjs <hoy.json> <ahora.json>
import fs from 'node:fs';
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const hoy = leer(process.argv[2]), ahora = leer(process.argv[3]);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace('.', ',') : '—');
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const perfiles = [...new Set(ahora.map((r) => r.perfil))];
const L = ['## Aceite (ml)', '', '| Perfil | Comida doble: media (máx.) | Comida de legumbre como plato único, hoy | Resto de comidas y cenas, hoy → ahora | Día, hoy → ahora | Día con comida doble | Día máx., hoy → ahora |', '|---|---|---|---|---|---|---|'];
for (const p of perfiles) {
  const H = hoy.filter((r) => r.perfil === p), A = ahora.filter((r) => r.perfil === p);
  const dob = A.flatMap((r) => r.comidas.filter((c) => c.doble).map((c) => c.ml));
  const legHoy = H.flatMap((r) => r.comidas.filter((c) => c.legumbre && c.time === 'Comida').map((c) => c.ml));
  const otrasH = H.flatMap((r) => r.comidas.filter((c) => !c.legumbre).map((c) => c.ml));
  const otrasA = A.flatMap((r) => r.comidas.filter((c) => !c.doble && !c.legumbre).map((c) => c.ml));
  const dia = (R) => R.flatMap((r) => r.dias.filter((d) => !d.libre).map((d) => d.ml));
  const diaDoble = A.flatMap((r) => r.dias.filter((d) => d.doble).map((d) => d.ml));
  L.push(`| ${p} | ${dob.length ? `${f1(media(dob))} (${f1(Math.max(...dob))})` : '—'} | ${legHoy.length ? f1(media(legHoy)) : '—'} | ${f1(media(otrasH))} → ${f1(media(otrasA))} | ${f1(media(dia(H)))} → ${f1(media(dia(A)))} | ${diaDoble.length ? f1(media(diaDoble)) : '—'} | ${f1(Math.max(...dia(H)))} → ${f1(Math.max(...dia(A)))} |`);
}
// Primeros repetidos en la semana.
const pares = (xs, f) => { const v = xs.map(f); return v.length - new Set(v).size > 0; };
L.push('', '## Los primeros de la semana: semanas en que repiten algo (comidas dobles servidas)', '', '| Perfil | Semanas con 3 primeros | con 2 | Repiten legumbre | Repiten aliño | Repiten método | Repiten legumbre y aliño (mismo guiso, otra verdura) | Repiten verdura | 3 de la misma legumbre |', '|---|---|---|---|---|---|---|---|---|');
let tot = null;
for (const p of perfiles) {
  const A = ahora.filter((r) => r.perfil === p && r.primeros.length >= 2);
  if (!A.length) continue;
  const c = {
    tres: A.filter((r) => r.primeros.length >= 3).length, dos: A.filter((r) => r.primeros.length === 2).length,
    P: A.filter((r) => pares(r.primeros, (t) => t.P)).length, S: A.filter((r) => pares(r.primeros, (t) => t.S)).length,
    M: A.filter((r) => pares(r.primeros, (t) => t.cookM)).length, PS: A.filter((r) => pares(r.primeros, (t) => `${t.P}|${t.S}`)).length,
    V: A.filter((r) => pares(r.primeros, (t) => t.V)).length, P3: A.filter((r) => r.primeros.length >= 3 && new Set(r.primeros.map((t) => t.P)).size === 1).length,
  };
  tot = tot ? Object.fromEntries(Object.entries(tot).map(([k, v]) => [k, v + c[k]])) : { ...c };
  L.push(`| ${p} | ${c.tres} | ${c.dos} | ${c.P} | ${c.S} | ${c.M} | ${c.PS} | ${c.V} | ${c.P3} |`);
}
L.push(`| **Total** | ${tot.tres} | ${tot.dos} | ${tot.P} | ${tot.S} | ${tot.M} | ${tot.PS} | ${tot.V} | ${tot.P3} |`);
const todas = ahora.filter((r) => r.primeros.length >= 2);
const combos = {}; for (const r of todas) for (const t of r.primeros) { const k = `${t.P} ${t.S} ${t.cookM}`; combos[k] = (combos[k] || 0) + 1; }
L.push('', `Primeros por legumbre, aliño y método (comidas dobles, todas las semanas con 2 o más): ${Object.entries(combos).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}.`);
console.log(L.join('\n'));
