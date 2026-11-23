// Resumen del ajuste de la ración de guarnición: MEDICIÓN. Por medición (sufijos de g-<perfil>-<sufijo>.json, de
// cortasProteina.mjs): comidas cortas, proteína del día, fuera de ±5 % de kcal (por encima / por debajo), gramos del
// proteico y de la legumbre en las comidas con guarnición (mediana y mínimo), % de esas comidas con pan, legumbres/sem e
// infracciones de D-099.3. Agregado de los 9 omnívoros y tabla por perfil.
// Uso: node scripts/banco/medicion/resumenRacionGuarnicion.mjs <dir> <salida.md> --var=sufijo:etiqueta,… <perfil> [<perfil> …]
import fs from 'node:fs';
import path from 'node:path';

const [dir, salida, ...resto] = process.argv.slice(2);
const VAR = resto.find((a) => a.startsWith('--var=')).slice(6).split(',').map((x) => x.split(':'));
const perfiles = resto.filter((a) => !a.startsWith('--'));
const OMNI = ['omni-1434', 'omni-2174', 'omni-2600-3comidas', 'omni-3714', 'celiaco-2400', 'sin-lactosa-2000', 'sin-pescado-2000', 'omni-2174-ancla', 'omni-2000-sin-atun'];
const leer = (p, v) => JSON.parse(fs.readFileSync(path.join(dir, `g-${p}-${v}.json`), 'utf8')).semanas;
const n2 = (x) => x.toFixed(2).replace('.', ',');
const n1 = (x) => x.toFixed(1).replace('.', ',');
const su = (ss, f) => ss.reduce((a, s) => a + f(s), 0);
const mediana = (xs) => { const o = [...xs].sort((a, b) => a - b); return o.length ? o[Math.floor(o.length / 2)] : null; };
const g = (ss, k) => { const xs = ss.flatMap((s) => s.guarnG || []).map((x) => x[k]); return xs.length ? `${Math.round(mediana(xs))} (${Math.round(Math.min(...xs))})` : '—'; };
const FILAS = {
  'Comidas y cenas cortas/sem': (ss) => n2(su(ss, (s) => s.cortas) / ss.length),
  'Proteína del día': (ss) => `${n1(su(ss, (s) => s.protDia) / ss.length)} %`,
  'Fuera de ±5 % de kcal (por encima / por debajo)': (ss) => `${n1((100 * su(ss, (s) => s.fueraKcal)) / su(ss, (s) => s.principales))} % (${su(ss, (s) => s.fueraEncima)} / ${su(ss, (s) => s.fueraDebajo)})`,
  'Comidas con guarnición': (ss) => String(su(ss, (s) => s.legGuarnicion)),
  'Proteico en ellas, g: mediana (mínimo)': (ss) => g(ss, 0),
  'Legumbre en ellas, g: mediana (mínimo)': (ss) => g(ss, 1),
  'De ellas, con pan': (ss) => { const n = su(ss, (s) => s.legGuarnicion); return n ? `${n1((100 * su(ss, (s) => s.guarnConPan)) / n)} %` : '—'; },
  'Legumbres/sem (guarnición + plato)': (ss) => n2(su(ss, (s) => s.legGuarnicion + s.legPlato) / ss.length),
  'Infracciones de D-099.3': (ss) => String(su(ss, (s) => s.d099)),
};
const L = ['## Agregado de los 9 omnívoros (1800 semanas por medición)', '', `| Métrica | ${VAR.map(([, e]) => e).join(' | ')} |`, `|---|${VAR.map(() => '---|').join('')}`];
const datos = Object.fromEntries(VAR.map(([v]) => [v, OMNI.flatMap((p) => leer(p, v))]));
for (const [n, f] of Object.entries(FILAS)) L.push(`| ${n} | ${VAR.map(([v]) => f(datos[v])).join(' | ')} |`);
L.push('', `## Por perfil (${perfiles.length} perfiles, 200 semanas)`, '', `| Perfil | Medición | ${Object.keys(FILAS).join(' | ')} |`, `|---|---|${Object.keys(FILAS).map(() => '---|').join('')}`);
for (const p of perfiles) for (const [v, e] of VAR) { const ss = leer(p, v); L.push(`| ${p} | ${e} | ${Object.values(FILAS).map((f) => f(ss)).join(' | ')} |`); }
fs.writeFileSync(salida, L.join('\n') + '\n');
console.log(L.slice(0, 14).join('\n'));
