// Resumen de variantesPescado.mjs: MEDICIÓN, no cambia reglas. Lee las salidas de medirEstructura.mjs del motor
// actual y de las variantes (tope de pescado y marisco de 2, 3 y 4 por semana; 3 con legumbre a 4) y escribe las
// tablas: reparto de proteínas por semana, distribución del pescado, qué ocupa los huecos, comidas cortas de
// proteína, proteína del día e infracciones de D-099.3.
// Uso: node scripts/banco/medicion/resumenPescado.mjs <carpeta> [salida.md]
//   <carpeta> con p-actual.json, p-t2.json, p-t3.json, p-t4.json y p-t3l4.json
import fs from 'node:fs';
import path from 'node:path';

const [dir, salida] = process.argv.slice(2);
if (!dir) throw new Error('Falta la carpeta');
const VAR = [['actual', 'Motor actual (sin tope)'], ['t4', 'Tope de 4'], ['t3', 'Tope de 3'], ['t2', 'Tope de 2'], ['t3l4', 'Tope de 3 y legumbre a 4']];
const D = Object.fromEntries(VAR.map(([k]) => [k, JSON.parse(fs.readFileSync(path.join(dir, `p-${k}.json`), 'utf8'))]));

const GRUPO = (e) => {
  if (['atun', 'bacalao', 'berberechos', 'bonito', 'calamares', 'corvina', 'dorada', 'gambas', 'mejillones', 'merluza', 'salmon', 'sardinas'].includes(e)) return 'pescado';
  if (['pollo', 'pavo'].includes(e)) return 'ave';
  if (e === 'ternera') return 'carne roja';
  if (['cerdo', 'jamon', 'lacon', 'guanciale'].includes(e)) return 'cerdo';
  if (e === 'conejo') return 'conejo';
  if (e === 'huevo') return 'huevo';
  if (['lentejas', 'garbanzos', 'alubias', 'alubias_negras'].includes(e)) return 'legumbre';
  return 'otro';
};
const GRUPOS = ['pescado', 'ave', 'carne roja', 'cerdo', 'conejo', 'huevo', 'legumbre', 'otro'];
const ANIMAL = new Set(['pescado', 'ave', 'carne roja', 'cerdo', 'conejo', 'huevo']);
const n2 = (x) => (Number.isFinite(x) ? x.toFixed(2).replace('.', ',') : '—');
const n1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace('.', ',') : '—');
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : '—');
const media = (xs, f) => xs.reduce((a, x) => a + f(x), 0) / (xs.length || 1);
const tabla = (cab, filas) => [`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`, ...filas.map((r) => `| ${r.join(' | ')} |`)].join('\n');

/** Por semana: platos por grupo y comidas (comida o cena servida) sin proteína animal. */
function semana(r) {
  const g = Object.fromEntries(GRUPOS.map((x) => [x, 0]));
  const porComida = new Map();
  for (const [dia, momento, especie] of r.platos) {
    const k = GRUPO(especie);
    g[k] += 1;
    const c = `${dia}|${momento}`;
    porComida.set(c, (porComida.get(c) || false) || ANIMAL.has(k));
  }
  return { ...g, sinAnimal: [...porComida.values()].filter((x) => !x).length };
}
const d099 = (r) => Object.values(r.d099).reduce((a, b) => a + b, 0);
const perfiles = [...new Set(D.actual.filas.map((r) => r.perfil))];
const OMNI8 = perfiles.filter((p) => p !== 'sibo-2000');

const L = ['# Pescado y marisco: reparto actual y topes semanales', '',
  `Salida de \`resumenPescado.mjs\`. ${D.actual.semanas} semanas seguidas por perfil, por la entrada de la app (\`generarPlan\`), con las variantes en memoria de \`variantesPescado.mjs\` (sin tocar \`src/\`). Platos servidos: comida, segundo de la comida doble y cena, sin la sugerencia de la comida libre del sábado. Pescado y marisco, por especie (también los bowls de atún o gambas). Carne roja = ternera; cerdo = lomo, jamón, lacón y guanciale; «otro» = tofu, mozzarella o sin proteína principal. «Comidas sin proteína animal»: comidas o cenas servidas sin carne, pescado ni huevo. Salvo que se diga otra cosa, los 8 perfiles omnívoros sin SIBO (1600 semanas); sibo-2000 aparte.`, ''];

// 1. Reparto actual.
L.push('## 1. Reparto actual, platos por semana', '');
const filaReparto = (nombre, xs) => { const s = xs.map(semana); return [nombre, ...GRUPOS.map((g) => n2(media(s, (x) => x[g]))), n2(media(s, (x) => x.sinAnimal))]; };
L.push(tabla(['Perfil', ...GRUPOS.map((g) => (g === 'pescado' ? 'pescado y marisco' : g)), 'Comidas sin proteína animal'], [
  ...perfiles.map((p) => filaReparto(p, D.actual.filas.filter((r) => r.perfil === p))),
  filaReparto('**8 omnívoros sin SIBO**', D.actual.filas.filter((r) => OMNI8.includes(r.perfil))),
]), '');
L.push('Distribución del pescado y marisco por semana (porcentaje de semanas con ese número de platos):', '');
const filaDist = (nombre, xs) => { const s = xs.map((r) => semana(r).pescado); return [nombre, n2(media(s, (x) => x)), ...[0, 1, 2, 3, 4, 5, 6].map((k) => pct(s.filter((x) => x === k).length, s.length)), pct(s.filter((x) => x >= 7).length, s.length), `${s.filter((x) => x >= 4).length} (${pct(s.filter((x) => x >= 4).length, s.length)})`]; };
L.push(tabla(['Perfil', 'Media', '0', '1', '2', '3', '4', '5', '6', '7 o más', 'Semanas con 4 o más'], [
  ...perfiles.map((p) => filaDist(p, D.actual.filas.filter((r) => r.perfil === p))),
  filaDist('**8 omnívoros sin SIBO**', D.actual.filas.filter((r) => OMNI8.includes(r.perfil))),
]), '');

// 2 y 3. Variantes.
L.push('## 2 y 3. Topes de pescado y marisco por semana', '');
L.push('En cada hueco, si la semana ya llega al tope, se quitan del pool los platos de pescado o marisco (justo después del tope de 2 por especie) y el hueco sigue por la cascada normal; si eso lo dejara sin candidatos, no se aplica. El suelo de pescado de D-024 (3) no cambia.', '');
const filaVar = (v, ps) => {
  const xs = D[v].filas.filter((r) => ps.includes(r.perfil));
  const s = xs.map(semana);
  const c = (k) => xs.reduce((a, r) => a + (r.causas[k] || 0), 0);
  return [VAR.find((x) => x[0] === v)[1], ...['pescado', 'ave', 'carne roja', 'cerdo', 'conejo', 'huevo', 'legumbre', 'otro'].map((g) => n2(media(s, (x) => x[g]))), n2(media(s, (x) => x.sinAnimal)),
    `${s.filter((x) => x.pescado >= 4).length}`, n2(media(xs, (r) => r.cortas)), `${n1(media(xs, (r) => (100 * r.protDia) / r.objProt))} %`, xs.reduce((a, r) => a + d099(r), 0),
    `${c('tope_pescado_semana')} / ${c('tope_pescado_semana_sin_aplicar')}`, n1((100 * c('dia_legumbre_sin_candidato')) / xs.length), xs.filter((r) => !r.dentro).length];
};
const COLS = ['Variante', 'Pescado y marisco/sem', 'Ave', 'Carne roja', 'Cerdo', 'Conejo', 'Huevo', 'Legumbre', 'Otro', 'Comidas sin proteína animal/sem', 'Semanas con 4 o más pescados', 'Comidas y cenas cortas de proteína/sem', 'Proteína del día', 'Infracciones de D-099.3', 'Tope aplicado / sin aplicar', 'Día sorteado sin legumbre /100 sem', 'Semanas fuera de ±5 %'];
L.push('**Los 8 perfiles omnívoros sin SIBO**', '', tabla(COLS, VAR.map(([v]) => filaVar(v, OMNI8))), '');
// Qué ocupa los huecos que deja el pescado.
L.push('**Qué ocupa los huecos que deja el pescado** (diferencia frente al motor actual, platos por semana, 8 perfiles):', '');
const base = D.actual.filas.filter((r) => OMNI8.includes(r.perfil)).map(semana);
L.push(tabla(['Variante', ...GRUPOS.map((g) => (g === 'pescado' ? 'pescado y marisco' : g)), 'Comidas sin proteína animal'], VAR.slice(1).map(([v, nombre]) => {
  const s = D[v].filas.filter((r) => OMNI8.includes(r.perfil)).map(semana);
  const dif = (g) => { const d = media(s, (x) => x[g]) - media(base, (x) => x[g]); return `${d >= 0 ? '+' : ''}${n2(d)}`; };
  return [nombre, ...GRUPOS.map(dif), dif('sinAnimal')];
})), '');
for (const p of perfiles) {
  L.push(`**${p}**`, '', tabla(COLS, VAR.map(([v]) => filaVar(v, [p]))), '');
}
const texto = L.join('\n');
console.log(texto);
if (salida) fs.writeFileSync(salida, `${texto}\n`);
