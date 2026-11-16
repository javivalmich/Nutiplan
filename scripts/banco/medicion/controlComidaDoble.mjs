// Control de la comida doble de src/plan frente al prototipo de medición: MEDICIÓN, no cambia reglas.
// Compara dos salidas de medirEstructura.mjs sobre las mismas semanas:
//   - la de src/plan (--ec=off; con --montar src mientras la app no monte la comida doble), y
//   - la del prototipo (--ec=motor: el walk del motor real y las raciones del prototipo).
// Escribe, por perfil: comidas dobles fuera de ±5 % de kcal, comidas dobles cortas de proteína, comidas y
// cenas cortas por semana, proteína del día, semanas fuera de ±5 %, lectura junta frente a plato a plato y
// en cuántas semanas el texto (título, p1, p2 y compra de todas las comidas) es idéntico.
// Uso: node scripts/banco/medicion/controlComidaDoble.mjs <src.json> <prototipo.json> [salida.md]
// Código de salida: 0 si nada empeora respecto al prototipo; 1 si algo empeora.
import fs from 'node:fs';

const [fSrc, fRef, salida] = process.argv.slice(2);
if (!fSrc || !fRef) throw new Error('Uso: controlComidaDoble.mjs <src.json> <prototipo.json> [salida.md]');
const src = JSON.parse(fs.readFileSync(fSrc, 'utf8'));
const ref = JSON.parse(fs.readFileSync(fRef, 'utf8'));
if (src.filas.length !== ref.filas.length) throw new Error(`Las dos mediciones no tienen las mismas semanas (${src.filas.length} y ${ref.filas.length})`);

const n1 = (x) => x.toFixed(1).replace('.', ',');
const n2 = (x) => x.toFixed(2).replace('.', ',');
const media = (xs, f) => xs.reduce((a, x) => a + f(x), 0) / xs.length;
const dobles = (xs) => xs.flatMap((r) => r.legumbres.filter((l) => l.ps));
const fueraKcal = (xs) => dobles(xs).filter((l) => Math.abs(l.kcal - l.oK) > 0.05 * l.oK).length;
const cortasDoble = (xs) => dobles(xs).filter((l) => l.prot < 0.95 * l.oP).length;
const perfiles = [...new Set(src.filas.map((r) => r.perfil))];
const par = (a, b) => (a === b ? `${a}` : `${a} (prototipo: ${b})`);

let peor = 0;
const L = ['# Control de la comida doble de `src/plan` frente al prototipo', '',
  `Salida de \`controlComidaDoble.mjs\`. ${src.semanas} semanas seguidas por perfil, por la entrada de la app (\`generarPlan\`). Entre paréntesis, la cifra del prototipo cuando es distinta.`, '',
  '| Perfil | Semanas | Comidas dobles | Dobles fuera de ±5 % de kcal | Dobles cortas de proteína | Comidas y cenas cortas/sem | Proteína del día (% del objetivo) | Semanas fuera de ±5 % | Lectura junta distinta de plato a plato | Semanas con el mismo menú | Semanas con el mismo texto |',
  '|---|---|---|---|---|---|---|---|---|---|---|'];
const total = { semanas: 0, dobles: 0, fuera: 0, cortasDoble: 0, lectura: 0, menu: 0, texto: 0 };
for (const p of perfiles) {
  const a = src.filas.filter((r) => r.perfil === p);
  const b = ref.filas.filter((r) => r.perfil === p);
  const lectura = a.reduce((o, r) => ({ comidas: o.comidas + (r.lecturaDoble ? r.lecturaDoble.comidas : 0), distintas: o.distintas + (r.lecturaDoble ? r.lecturaDoble.distintas : 0) }), { comidas: 0, distintas: 0 });
  const menu = a.filter((r, i) => r.huella === b[i].huella).length;
  const texto = a.filter((r, i) => r.huellaTexto === b[i].huellaTexto).length;
  const cortas = [media(a, (r) => r.cortas), media(b, (r) => r.cortas)];
  const prot = [media(a, (r) => (100 * r.protDia) / r.objProt), media(b, (r) => (100 * r.protDia) / r.objProt)];
  const semFuera = [a.filter((r) => !r.dentro).length, b.filter((r) => !r.dentro).length];
  if (fueraKcal(a) > fueraKcal(b) || cortasDoble(a) > cortasDoble(b) || cortas[0] > cortas[1] + 1e-9 || prot[0] < prot[1] - 1e-9 || semFuera[0] > semFuera[1] || lectura.distintas > 0 || lectura.comidas !== dobles(a).length) peor += 1;
  L.push(`| ${p} | ${a.length} | ${par(dobles(a).length, dobles(b).length)} | ${par(fueraKcal(a), fueraKcal(b))} | ${par(cortasDoble(a), cortasDoble(b))} | ${par(n2(cortas[0]), n2(cortas[1]))} | ${par(`${n1(prot[0])} %`, `${n1(prot[1])} %`)} | ${par(semFuera[0], semFuera[1])} | ${lectura.distintas} de ${lectura.comidas} | ${menu} | ${texto} |`);
  total.semanas += a.length; total.dobles += dobles(a).length; total.fuera += fueraKcal(a); total.cortasDoble += cortasDoble(a); total.lectura += lectura.distintas; total.menu += menu; total.texto += texto;
}
L.push(`| **Total** | ${total.semanas} | ${total.dobles} | ${total.fuera} | ${total.cortasDoble} | | | | ${total.lectura} | ${total.menu} | ${total.texto} |`, '',
  `Planes que no son de engine2: src/plan ${src.filas.filter((r) => r.motor !== 'engine2').length} · prototipo ${ref.filas.filter((r) => r.motor !== 'engine2').length}.`,
  peor ? `**Algo empeora respecto al prototipo en ${peor} perfil(es).**` : 'Nada empeora respecto al prototipo.');
const texto = L.join('\n');
console.log(texto);
if (salida) fs.writeFileSync(salida, `${texto}\n`);
process.exit(peor ? 1 : 0);
