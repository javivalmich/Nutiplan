// Resumen del prototipo 2 de guarnición: MEDICIÓN. Por perfil y por medición (main, HEAD y las subvariantes a y b):
// comidas cortas con su desglose (legumbre suelta, huevo, otras), proteína del día, legumbres (guarnición y plato) con su
// distribución, pan en las comidas con guarnición; y el agregado de los perfiles omnívoros con el resto de métricas.
// Uso: node scripts/banco/medicion/resumenGuarnicion2.mjs <dir> <salida.md> [--var=sufijo:etiqueta,…] <perfil> [<perfil> …]
//   (en <dir>: g-<perfil>-<sufijo>.json; por defecto main, head, va y vb)
import fs from 'node:fs';
import path from 'node:path';

const [dir, salida, ...resto] = process.argv.slice(2);
const argVar = resto.find((a) => a.startsWith('--var='));
const perfiles = resto.filter((a) => !a.startsWith('--'));
const OMNI = ['omni-1434', 'omni-2174', 'omni-2600-3comidas', 'omni-3714', 'celiaco-2400', 'sin-lactosa-2000', 'sin-pescado-2000', 'omni-2174-ancla', 'omni-2000-sin-atun'];
const VAR = argVar ? argVar.slice(6).split(',').map((x) => x.split(':')) : [['main', 'main'], ['head', 'HEAD'], ['va', '(a)'], ['vb', '(b)']];
const PROTOS = VAR.filter(([v]) => v !== 'main' && v !== 'head');
const n2 = (x) => x.toFixed(2).replace('.', ',');
const n1 = (x) => x.toFixed(1).replace('.', ',');
const leer = (p, v) => JSON.parse(fs.readFileSync(path.join(dir, `g-${p}-${v}.json`), 'utf8')).semanas;
const media = (ss, f) => ss.reduce((a, s) => a + f(s), 0) / ss.length;
const suma = (ss, f) => ss.reduce((a, s) => a + f(s), 0);
const leg = (s) => s.legGuarnicion + s.legPlato;
const cLeg = (s) => s.cortasPor.legumbre || 0;
const cHuevo = (s) => s.cortasPor.huevo || 0;
const dist = (ss) => [0, 1, 2, 3].map((n) => ss.filter((s) => leg(s) === n).length).join(' / ') + ` / ${ss.filter((s) => leg(s) > 3).length}`;

const L = ['## Por perfil', '',
  '| Perfil | Medición | Cortas/sem (legumbre suelta + huevo + otras) | Proteína del día | Legumbres/sem (guarnición + plato) | Semanas con 0 / 1 / 2 / 3 / más de 3 legumbres | Comidas con guarnición que llevan pan | Pan medio en ellas (g) |',
  '|---|---|---|---|---|---|---|---|'];
for (const p of perfiles) {
  for (const [v, et] of VAR) {
    const ss = leer(p, v);
    const g = suma(ss, (s) => s.legGuarnicion); const cp = suma(ss, (s) => s.guarnConPan || 0); const pg = suma(ss, (s) => s.panGuarn || 0);
    L.push(`| ${p} | ${et} | ${n2(media(ss, (s) => s.cortas))} (${n2(media(ss, cLeg))} + ${n2(media(ss, cHuevo))} + ${n2(media(ss, (s) => s.cortas - cLeg(s) - cHuevo(s)))}) | ${n1(media(ss, (s) => s.protDia))} % | ${n2(media(ss, leg))} (${n2(media(ss, (s) => s.legGuarnicion))} + ${n2(media(ss, (s) => s.legPlato))}) | ${dist(ss)} | ${g ? `${cp} de ${g} (${n1((100 * cp) / g)} %)` : '—'} | ${cp ? Math.round(pg / cp) : '—'} |`);
  }
}
const A = ['## Agregado de los 9 omnívoros (1800 semanas por medición)', '',
  `| Métrica | ${VAR.map(([, e]) => e).join(' | ')} |`, `|---|${VAR.map(() => '---|').join('')}`];
const filas = {
  'Comidas y cenas cortas/sem': (ss) => n2(media(ss, (s) => s.cortas)),
  '… de legumbre suelta': (ss) => n2(media(ss, cLeg)),
  '… de huevo': (ss) => n2(media(ss, cHuevo)),
  '… otras': (ss) => n2(media(ss, (s) => s.cortas - cLeg(s) - cHuevo(s))),
  'Proteína del día': (ss) => `${n1(media(ss, (s) => s.protDia))} %`,
  'Legumbres/sem (guarnición + plato)': (ss) => `${n2(media(ss, leg))} (${n2(media(ss, (s) => s.legGuarnicion))} + ${n2(media(ss, (s) => s.legPlato))})`,
  'Semanas con 0 / 1 / 2 / 3 / más de 3 legumbres': dist,
  'Semanas con una legumbre repetida': (ss) => String(ss.filter((s) => s.legRepetida).length),
  'Pescado/sem': (ss) => n2(media(ss, (s) => s.pescado)),
  'Arroz / patata / boniato / quinoa / pasta / legumbre, por semana': (ss) => ['arroz', 'patata', 'boniato', 'quinoa', 'pasta', 'legumbre'].map((k) => n2(media(ss, (s) => s.hidratoPor[k] || 0))).join(' / '),
  'Semanas con el mismo hidrato en días seguidos': (ss) => String(ss.filter((s) => s.hidratoSeguidos > 0).length),
  'Pares de días seguidos con el mismo hidrato/sem, por hidrato (arroz / patata / boniato / quinoa / pasta / legumbre)': (ss) => ['arroz', 'patata', 'boniato', 'quinoa', 'pasta', 'legumbre'].map((h) => n2(media(ss, (s) => (s.hidratoSeguidosPor || {})[h] || 0))).join(' / '),
  'Días con algún hidrato de plantilla, por semana': (ss) => (ss.every((s) => s.diasConHidrato != null) ? n2(media(ss, (s) => s.diasConHidrato)) : '—'),
  'Comidas y cenas fuera de ±5 % de kcal': (ss) => `${n1((100 * suma(ss, (s) => s.fueraKcal)) / suma(ss, (s) => s.principales))} %`,
  'Aceite por día (ml)': (ss) => n1(media(ss, (s) => s.mlDia)),
  'Comidas con guarnición que llevan pan': (ss) => { const g = suma(ss, (s) => s.legGuarnicion); const cp = suma(ss, (s) => s.guarnConPan || 0); return g ? `${cp} de ${g} (${n1((100 * cp) / g)} %), ${Math.round(suma(ss, (s) => s.panGuarn || 0) / Math.max(1, cp))} g de media` : '—'; },
  'Infracciones de D-099.3': (ss) => String(suma(ss, (s) => s.d099)),
};
const datos = Object.fromEntries(VAR.map(([v]) => [v, OMNI.flatMap((p) => leer(p, v))]));
for (const [nombre, f] of Object.entries(filas)) A.push(`| ${nombre} | ${VAR.map(([v]) => f(datos[v])).join(' | ')} |`);
// Veces que actúa cada regla.
const R = [`## Veces que actúa cada regla (${perfiles.length} perfiles, ${perfiles.length * 200} semanas por variante)`, '', `| Regla | ${PROTOS.map(([, e]) => e).join(' | ')} |`, `|---|${PROTOS.map(() => '---|').join('')}`];
const cuenta = (v, k) => suma(perfiles.flatMap((p) => leer(p, v)), (s) => (s.guarn && s.guarn[k]) || 0);
const REGLAS = [['Tope de 3: guarnición no puesta', 'tope'], ['Tope de 3: platos de legumbre fuera del pool', 'topePool'], ['Suelo de 2 por la guarnición (pone legumbre)', 'sueloSemana'], ['Suelo de 2: ninguna legumbre válida en el hueco', 'sueloSinValida'], ['Compuestos de legumbre fuera del pool (b)', 'compuestaFuera'], ['Compuestos de legumbre admitidos por falta de otro candidato (b)', 'compuestaSinOtro'], ['Guisantes y habitas, como mucho 1', 'verdes'], ['No repetir legumbre: aplicada', 'repetidaEvitada'], ['No repetir legumbre: sin aplicar', 'repetidaSinAplicar']];
for (const [t, k] of REGLAS) R.push(`| ${t} | ${PROTOS.map(([v]) => cuenta(v, k)).join(' | ')} |`);
const texto = [...A, '', ...R, '', ...L, ''].join('\n');
fs.writeFileSync(salida, texto);
console.log([...A, '', ...R].join('\n'));
