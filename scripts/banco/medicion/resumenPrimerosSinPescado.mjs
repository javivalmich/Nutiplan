// Primeros sin legumbre ni aliño repetidos, en los perfiles sin pescado ni marisco: MEDICIÓN, no cambia reglas.
// Compara dos salidas de medirEstructura.mjs (motor y variante --primero=noUsadosPrimeros de
// variantesComidaDoble.mjs), con los perfiles sintéticos de variantesRed.mjs.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/resumenPrimerosSinPescado.mjs \
//        <motor.json> <variante.json> [salida.md]
// Código de salida: 0 si la variante no empeora infracciones de D-099.3, comidas cortas de proteína ni semanas
// con la red en ningún perfil; 1 si empeora alguna.
import fs from 'node:fs';

const R = new URL('../../../', import.meta.url).href;
const { tuplaDe } = await import(R + 'src/plan/textos/componer.js');
const [fA, fV, salida] = process.argv.slice(2);
if (!fA || !fV) throw new Error('Uso: resumenPrimerosSinPescado.mjs <motor.json> <variante.json> [salida.md]');
const A = JSON.parse(fs.readFileSync(fA, 'utf8'));
const V = JSON.parse(fs.readFileSync(fV, 'utf8'));
const n2 = (x) => x.toFixed(2).replace('.', ',');
const n1 = (x) => x.toFixed(1).replace('.', ',');
const media = (xs, f) => xs.reduce((a, x) => a + f(x), 0) / (xs.length || 1);
const d099 = (r) => Object.values(r.d099).reduce((a, b) => a + b, 0);
const red = (r) => (r.causas.regla_legumbre_retirada_d099 || 0) + (r.causas.regla_legumbre_retirada_pool_vacio || 0) > 0;
const t = (id) => tuplaDe(id) || {};
const repite = (ids, f) => { const v = ids.map(f); return v.length - new Set(v).size > 0; };
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : '—');
const perfiles = [...new Set(A.filas.map((r) => r.perfil))];

const fila = (nombre, xs) => {
  const dos = xs.filter((r) => r.primeros.length >= 2);
  const dobles = xs.flatMap((r) => r.legumbres.filter((l) => l.ps));
  return {
    infr: xs.reduce((a, r) => a + d099(r), 0), cortas: media(xs, (r) => r.cortas), dobCortas: dobles.filter((l) => l.prot < 0.95 * l.oP).length, red: xs.filter(red).length,
    celdas: [nombre, xs.reduce((a, r) => a + d099(r), 0), n2(media(xs, (r) => r.cortas)), dobles.filter((l) => l.prot < 0.95 * l.oP).length, xs.filter(red).length,
      `${n1(media(xs, (r) => (100 * r.protDia) / r.objProt))} %`, n2(media(xs, (r) => r.segundos)), dos.length,
      `${dos.filter((r) => repite(r.primeros, (id) => t(id).P)).length} (${pct(dos.filter((r) => repite(r.primeros, (id) => t(id).P)).length, dos.length)})`,
      `${dos.filter((r) => repite(r.primeros, (id) => t(id).S)).length} (${pct(dos.filter((r) => repite(r.primeros, (id) => t(id).S)).length, dos.length)})`,
      `${dos.filter((r) => repite(r.primeros, (id) => `${t(id).P}|${t(id).S}`)).length} (${pct(dos.filter((r) => repite(r.primeros, (id) => `${t(id).P}|${t(id).S}`)).length, dos.length)})`,
      n1((100 * xs.reduce((a, r) => a + (r.causas.dia_legumbre_sin_candidato || 0), 0)) / xs.length)],
  };
};
const L = ['# Primeros sin legumbre ni aliño repetidos, en los perfiles sin pescado ni marisco', '',
  `Salida de \`resumenPrimerosSinPescado.mjs\`. ${A.semanas} semanas seguidas por perfil, por la entrada de la app (\`generarPlan\`), con el motor tras el aceite 10 + 10 (D-116.6) y la variante «legumbre no usada en la semana y aliño no usado por otro primero» aplicada en memoria (\`variantesComidaDoble.mjs --primero=noUsadosPrimeros\`). «gluten-sin-pescado-2000» y «lactosa-gluten-sin-pescado-2000» son sintéticos (\`variantesRed.mjs\`).`, '',
  '| Perfil | Variante | Infracciones de D-099.3 | Comidas y cenas cortas de proteína/sem | Comidas dobles cortas | Semanas con la red | Proteína del día | Comidas dobles/sem | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso | Día sorteado sin legumbre /100 sem |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
let empeora = 0;
const motivos = [];
for (const p of perfiles) {
  const a = fila('Motor', A.filas.filter((r) => r.perfil === p));
  const v = fila('Variante', V.filas.filter((r) => r.perfil === p));
  L.push(`| ${p} | ${a.celdas.join(' | ')} |`, `| | ${v.celdas.join(' | ')} |`);
  if (v.infr > a.infr) { empeora += 1; motivos.push(`${p}: infracciones ${a.infr} → ${v.infr}`); }
  if (v.cortas > a.cortas + 1e-9 || v.dobCortas > a.dobCortas) { empeora += 1; motivos.push(`${p}: cortas de proteína ${n2(a.cortas)} → ${n2(v.cortas)} por semana (comidas dobles ${a.dobCortas} → ${v.dobCortas})`); }
  if (v.red > a.red) { empeora += 1; motivos.push(`${p}: semanas con la red ${a.red} → ${v.red}`); }
}
L.push('', `Planes que no son de engine2: motor ${A.filas.filter((r) => r.motor !== 'engine2').length} · variante ${V.filas.filter((r) => r.motor !== 'engine2').length}.`, '',
  empeora ? `**La variante empeora:** ${motivos.join('; ')}.` : '**La variante no empeora** infracciones de D-099.3, comidas cortas de proteína ni semanas con la red en ninguno de los tres perfiles.');
const texto = L.join('\n');
console.log(texto);
if (salida) fs.writeFileSync(salida, `${texto}\n`);
process.exit(empeora ? 1 : 0);
