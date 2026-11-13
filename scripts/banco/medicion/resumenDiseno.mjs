// Resume los volcados de medirDiseno.mjs: una columna por variante, por grupo de perfiles.
// Da la media por semana, su error típico y la dispersión entre bloques de 8 semanas (el tamaño
// de la tabla de contrafactuales de la auditoría: 9 perfiles × 8 semanas = 72 semanas por bloque).
// Uso: node scripts/banco/medicion/resumenDiseno.mjs <nombre=archivo.json> [<nombre=archivo.json> …]
import fs from 'node:fs';

const GRUPOS = {
  'con pescado (9 perfiles)': (id) => !['sin-pescado-2000', 'vegetariana-2000', 'vegana-1400'].includes(id),
  'sin-pescado-2000': (id) => id === 'sin-pescado-2000',
  'vegetariana-2000': (id) => id === 'vegetariana-2000',
  'vegana-1400': (id) => id === 'vegana-1400',
};
const media = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const sd = (xs) => { const m = media(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1)); };
const f2 = (x) => x.toFixed(2);
const sumaObj = (acc, o) => { for (const [k, v] of Object.entries(o)) acc[k] = (acc[k] || 0) + v; return acc; };

const variantes = process.argv.slice(2).map((a) => { const [n, f] = a.split('='); return [n, JSON.parse(fs.readFileSync(f))]; });
for (const [g, esDelGrupo] of Object.entries(GRUPOS)) {
  console.log(`\n══ ${g} ══`);
  for (const [nombre, d] of variantes) {
    const f = d.filas.filter((r) => esDelGrupo(r.perfil));
    const n = f.length;
    const col = (k) => f.map((r) => r[k]);
    const s0 = d.semanaInicial;
    const bloques = [];
    for (let b = 0; b < d.semanas / 8; b++) bloques.push(f.filter((r) => Math.floor((r.s - s0) / 8) === b));
    const porBloque = (k) => bloques.map((x) => media(x.map((r) => r[k])));
    const pb = porBloque('pescado'); const lb = porBloque('legumbre');
    const d099 = f.reduce((a, r) => sumaObj(a, r.d099), {});
    const suelo = f.reduce((a, r) => sumaObj(a, r.paso4.suelo), {});
    const sinCand = f.reduce((a, r) => sumaObj(a, r.paso4.sinCand), {});
    const B = f.reduce((a, r) => (r.B ? sumaObj(a, r.B) : a), {});
    const motores = f.reduce((a, r) => sumaObj(a, { [r.motor]: 1 }), {});
    const avisos = f.filter((r) => r.aviso).length;
    const porSem = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +(v / n).toFixed(2)]));
    console.log(`\n── ${nombre} (${n} semanas; motor ${JSON.stringify(motores)}${avisos ? `; con aviso ${avisos}` : ''})`);
    console.log(`  pescado/sem   ${f2(media(col('pescado')))} ± ${f2(sd(col('pescado')) / Math.sqrt(n))} (ET) | comida ${f2(media(col('pescadoComida')))} · cena ${f2(media(col('pescadoCena')))} | bloques de 8 sem: ${f2(Math.min(...pb))}–${f2(Math.max(...pb))}, DT ${f2(sd(pb))}, primero ${f2(pb[0])}`);
    console.log(`  legumbre/sem  ${f2(media(col('legumbre')))} ± ${f2(sd(col('legumbre')) / Math.sqrt(n))} | bloques: ${f2(Math.min(...lb))}–${f2(Math.max(...lb))}, DT ${f2(sd(lb))}, primero ${f2(lb[0])} | semanas con <3: ${Math.round(100 * f.filter((r) => r.legumbre < 3).length / n)} %`);
    console.log(`  semanas pescado: <3 ${(100 * f.filter((r) => r.pescado < 3).length / n).toFixed(1)} % · ≥5 ${(100 * f.filter((r) => r.pescado >= 5).length / n).toFixed(1)} % · ≥6 ${(100 * f.filter((r) => r.pescado >= 6).length / n).toFixed(1)} % | racha ≥5 días: ${(100 * f.filter((r) => r.rachaPescado >= 5).length / n).toFixed(1)} % · ≥4: ${(100 * f.filter((r) => r.rachaPescado >= 4).length / n).toFixed(1)} % · máx ${Math.max(...col('rachaPescado'))}`);
    console.log(`  días sin verdura/sem ${f2(media(col('diasSinVerdura')))} (de ellos sábado ${f2(media(col('sabadoSinVerdura')))}) | semanas con alguno ${Math.round(100 * f.filter((r) => r.diasSinVerdura > 0).length / n)} % · con 2 o más ${Math.round(100 * f.filter((r) => r.diasSinVerdura >= 2).length / n)} %`);
    console.log(`  kcal: desvío medio ${f2(media(col('desvio')))} % (${Math.min(...col('desvio'))} … ${Math.max(...col('desvio'))}), semanas fuera de ±5 %: ${f.filter((r) => !r.dentro).length} | proteína/día ${media(col('protDia')).toFixed(1)} g | principales cortas/sem ${f2(media(col('cortas')))} | días fuera de ±10 %/sem ${f2(media(col('diasFueraKcal')))}`);
    console.log(`  D-099.3 (total): ${JSON.stringify(d099)} | vetados ${f.reduce((a, r) => a + r.vetados, 0)} · eliminados ${f.reduce((a, r) => a + r.eliminados, 0)}`);
    console.log(`  familia en días seguidos/sem ${f2(media(col('familiaDiasSeguidos')))} (sin ancla ${f2(media(col('familiaDiasSeguidosSinAncla')))}) | misma familia comida y cena/sem ${f2(media(col('familiaMismoDia')))}`);
    console.log(`  paso 4 por semana: verdura comida ${f2(media(f.map((r) => r.paso4.verdura.comida)))} · cena ${f2(media(f.map((r) => r.paso4.verdura.cena)))} | suelo ${JSON.stringify(porSem(suelo))} | corta sin candidato ${JSON.stringify(porSem(sinCand))}`);
    if (B.evaluados) console.log(`  filtro de familia (B): huecos evaluados ${B.evaluados}, aplicado ${B.aplicado} (${Math.round(100 * B.aplicado / B.evaluados)} %), sin candidato (no se aplica) ${B.sinCandidato} (${(100 * B.sinCandidato / B.evaluados).toFixed(1)} %; ${f2(B.sinCandidato / n)} por semana)`);
    if (g.startsWith('con pescado')) {
      const esp = f.filter((r) => r.sugerencia === 'pescado' || r.sugerencia === 'marisco'); const otr = f.filter((r) => r.sugerencia && !(r.sugerencia === 'pescado' || r.sugerencia === 'marisco'));
      console.log(`  sugerencia del sábado de pescado: ${esp.length} semanas, ${f2(media(esp.map((r) => r.pescado)))} servidos (con <3 servidos: ${esp.filter((r) => r.pescado < 3).length}); resto: ${otr.length} semanas, ${f2(media(otr.map((r) => r.pescado)))} (con <3: ${otr.filter((r) => r.pescado < 3).length})`);
    }
  }
}
// Peso del catálogo: lo que saldría eligiendo al azar según la proporción de cada momento
// (6 comidas servidas y 7 cenas por semana).
const [, d0] = variantes[0];
console.log('\n══ Peso del catálogo filtrado (rotativo), por perfil ══');
for (const [id, c] of Object.entries(d0.catalogo)) {
  const pc = c.comida.pescado / c.comida.n; const pn = c.cena.pescado / c.cena.n; const lc = c.comida.legumbre / c.comida.n; const ln = c.cena.legumbre / c.cena.n;
  console.log(`  ${id.padEnd(22)} comida ${c.comida.n} (pescado ${Math.round(100 * pc)} %, legumbre ${Math.round(100 * lc)} %) · cena ${c.cena.n} (pescado ${Math.round(100 * pn)} %, legumbre ${Math.round(100 * ln)} %) → esperado por semana: pescado ${f2(6 * pc + 7 * pn)}, legumbre ${f2(6 * lc + 7 * ln)}`);
}
