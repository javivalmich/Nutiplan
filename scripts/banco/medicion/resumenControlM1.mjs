// Control de M1 (segunda revisión, 2026-11-22): MEDICIÓN, no cambia reglas. Compara dos salidas de
// medirEstructura.mjs --ec=off (antes y después del cambio) en las comidas dobles: por debajo del 95 % y por
// encima del 105 % de su objetivo de kcal, cortas de proteína, gramos de legumbre y del segundo, pan o fruta y
// aceite; y por semana, comidas y cenas cortas, proteína del día y aceite del día.
// Uso: node scripts/banco/medicion/resumenControlM1.mjs <antes.json> <despues.json> <salida.md>
import fs from 'node:fs';

const [fA, fD, salida] = process.argv.slice(2);
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8')).filas;
const A = leer(fA), D = leer(fD);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace('.', ',') : '—');
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const mediana = (xs) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const dobles = (F) => F.flatMap((r) => r.legumbres.filter((c) => c.ps).map((c) => ({ ...c, perfil: r.perfil, s: r.s })));
const stats = (F) => {
  const d = dobles(F);
  return {
    semanas: F.length, dobles: d.length,
    bajo95: d.filter((c) => c.kcal < 0.95 * c.oK).length,
    sobre105: d.filter((c) => c.kcal > 1.05 * c.oK),
    cortasDoble: d.filter((c) => c.prot < 0.95 * c.oP).length,
    pan: d.filter((c) => c.extra).length,
    gLeg: mediana(d.map((c) => c.gLeg)), gSeg: mediana(d.map((c) => c.gSeg)), ml: media(d.map((c) => c.ml)),
    cortas: media(F.map((r) => r.cortas)), protDia: media(F.map((r) => (100 * r.protDia) / r.objProt)),
    mlDia: media(F.flatMap((r) => r.mlDias)), mlDiaMax: Math.max(...F.flatMap((r) => r.mlDias)),
    lectura: F.reduce((a, r) => a + r.lecturaDoble.distintas, 0),
    legacy: F.filter((r) => r.motor !== 'engine2').length,
  };
};
const perfiles = [...new Set(D.map((r) => r.perfil))];
const L = ['# Control de M1: la legumbre crece antes que el segundo', '',
  `Salida de \`resumenControlM1.mjs\`: la app antes de M1 (\`1c23a97\`) → con M1 (\`9f708e5\`), \`medirEstructura.mjs --ec=off\`, ${A.length / perfiles.length} semanas por perfil desde la 60. Solo comidas dobles, salvo las tres últimas columnas (todas las comidas y cenas de la semana).`, '',
  '| Perfil | Comidas dobles | < 95 % kcal | > 105 % kcal | Cortas de proteína (dobles) | Con pan o fruta | Legumbre seca, mediana (g) | Segundo, mediana (g) | Aceite comida doble (ml) | Comidas y cenas cortas/sem | Proteína del día | Aceite del día (ml, máx.) |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|'];
const fila = (id, a, d) => `| ${id} | ${a.dobles} → ${d.dobles} | ${a.bajo95} → ${d.bajo95} | ${a.sobre105.length} → ${d.sobre105.length} | ${a.cortasDoble} → ${d.cortasDoble} | ${a.pan} → ${d.pan} | ${a.gLeg} → ${d.gLeg} | ${a.gSeg} → ${d.gSeg} | ${f1(a.ml)} → ${f1(d.ml)} | ${f1(a.cortas)} → ${f1(d.cortas)} | ${f1(a.protDia)} → ${f1(d.protDia)} % | ${f1(a.mlDia)} (${a.mlDiaMax}) → ${f1(d.mlDia)} (${d.mlDiaMax}) |`;
for (const p of perfiles) L.push(fila(p, stats(A.filter((r) => r.perfil === p)), stats(D.filter((r) => r.perfil === p))));
const ta = stats(A), td = stats(D);
L.push(fila('**Total**', ta, td), '');
L.push(`Lectura junta distinta de plato a plato: ${ta.lectura} → ${td.lectura}. Planes que no son de engine2: ${ta.legacy} → ${td.legacy}.`, '');
L.push('Comidas dobles por encima del 105 % con M1:', '');
for (const c of td.sobre105) L.push(`- ${c.perfil}, semana ${c.s}, día ${c.d}: ${c.kcal} de ${c.oK} kcal (+${f1((100 * c.kcal) / c.oK - 100)} %), legumbre ${c.gLeg} g, segundo ${c.gSeg} g${c.extra ? `, ${c.extra}` : ''}`);
fs.writeFileSync(salida, L.join('\n') + '\n');
console.log(L.join('\n'));
