// Resumen de variantesRed.mjs: MEDICIÓN, no cambia reglas. Lee las salidas de medirEstructura.mjs de «hoy»
// (ba52d21, sin la regla), de la red anterior (sin segundos y con los días sorteados, hasta 3622d54) y de la red
// con la regla apagada (el motor desde ff2fa23), y escribe una tabla por perfil.
// Uso: node scripts/banco/medicion/resumenVariantesRed.mjs <hoy.json> <anterior.json> <reglaApagada.json> [salida.md]
import fs from 'node:fs';

const [fHoy, fActual, fSinRegla, salida] = process.argv.slice(2);
if (!fHoy || !fActual || !fSinRegla) throw new Error('Uso: resumenVariantesRed.mjs <hoy.json> <actual.json> <sinRegla.json> [salida.md]');
const VARIANTES = [['Hoy (ba52d21)', fHoy], ['Red anterior (sin segundos, días sorteados)', fActual], ['Red con la regla apagada (D-024)', fSinRegla]]
  .map(([nombre, f]) => [nombre, JSON.parse(fs.readFileSync(f, 'utf8'))]);
const n2 = (x) => x.toFixed(2).replace('.', ',');
const n1 = (x) => x.toFixed(1).replace('.', ',');
const media = (xs, f) => xs.reduce((a, x) => a + f(x), 0) / xs.length;
const suma = (xs, f) => xs.reduce((a, x) => a + (f(x) || 0), 0);
const d099 = (r) => Object.values(r.d099).reduce((a, b) => a + b, 0);
// Nombres de antes y de después de la red con la regla apagada.
const redD099 = (r) => (r.causas.segundos_retirados_d099 || 0) + (r.causas.regla_legumbre_retirada_d099 || 0) > 0;
const redPool = (r) => (r.causas.segundos_retirados_pool_vacio || 0) + (r.causas.regla_legumbre_retirada_pool_vacio || 0) > 0;
const perfiles = [...new Set(VARIANTES[0][1].filas.map((r) => r.perfil))];

const L = ['# Variantes de la red de seguridad de D-116.5', '',
  `Salida de \`resumenVariantesRed.mjs\`. ${VARIANTES[0][1].semanas} semanas seguidas por perfil, por la entrada de la app (\`generarPlan\`), con la comida doble montada y los segundos en \`platosSemana\` (\`medirEstructura.mjs\`). Medido en memoria con \`variantesRed.mjs\`.`, ''];
for (const p of perfiles) {
  L.push(`## ${p}`, '', '| Variante | Comidas y cenas cortas de proteína/sem | Legumbre/sem | Comidas con segundo/sem | Proteína del día (% del objetivo) | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Semanas con infracción y sin segundos |', '|---|---|---|---|---|---|---|---|');
  for (const [nombre, m] of VARIANTES) {
    const xs = m.filas.filter((r) => r.perfil === p);
    if (!xs.length) { L.push(`| ${nombre} | — | — | — | — | — | — | — |`); continue; }
    L.push(`| ${nombre} | ${n2(media(xs, (r) => r.cortas))} | ${n2(media(xs, (r) => r.legumbre))} | ${n2(media(xs, (r) => r.segundos))} | ${n1(media(xs, (r) => (100 * r.protDia) / r.objProt))} % | ${suma(xs, d099)} | ${xs.filter(redD099).length} / ${xs.filter(redPool).length} | ${xs.filter((r) => r.causas.infraccion_d099_sin_segundos || r.causas.infraccion_d099_regla_retirada).length} |`);
  }
  L.push('');
}
L.push('Las semanas «con la red» son las que se repitieron sin segundos (D-099) o tras quedarse sin platos (pool vacío). En «Hoy» no hay regla ni red. Planes que no son de engine2: '
  + VARIANTES.map(([nombre, m]) => `${nombre}: ${m.filas.filter((r) => r.motor !== 'engine2').length}`).join(' · ') + '.');
const texto = L.join('\n');
console.log(texto);
if (salida) fs.writeFileSync(salida, `${texto}\n`);
