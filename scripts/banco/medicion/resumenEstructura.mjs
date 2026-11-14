// Resumen de las mediciones de medirEstructura.mjs: MEDICIÓN, no cambia reglas.
// Uso: node scripts/banco/medicion/resumenEstructura.mjs <carpeta con los .json> > tablas.md
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('Falta la carpeta de los .json');
const ORDEN = ['off', 's2-pescado-todas', 's2-sinPescado-todas', 's2-pescado-lentejas', 's2-sinPescado-lentejas', 's3-pescado-todas', 's3-sinPescado-todas', 's3-pescado-lentejas', 's3-sinPescado-lentejas'];
const NOMBRE = { off: 'Hoy', 's2-pescado-todas': '2 · con pescado · todas', 's2-sinPescado-todas': '2 · sin pescado · todas', 's2-pescado-lentejas': '2 · con pescado · lentejas', 's2-sinPescado-lentejas': '2 · sin pescado · lentejas', 's3-pescado-todas': '3 · con pescado · todas', 's3-sinPescado-todas': '3 · sin pescado · todas', 's3-pescado-lentejas': '3 · con pescado · lentejas', 's3-sinPescado-lentejas': '3 · sin pescado · lentejas' };
const datos = {};
for (const k of ORDEN) { const f = path.join(dir, `${k}.json`); if (fs.existsSync(f)) datos[k] = JSON.parse(fs.readFileSync(f, 'utf8')); }
const claves = ORDEN.filter((k) => datos[k]);
const OMNI8 = ['omni-1434', 'omni-2174', 'omni-2600-3comidas', 'omni-3714', 'celiaco-2400', 'sin-lactosa-2000', 'omni-2174-ancla', 'omni-2000-sin-atun'];
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '—');
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const med = (xs) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const suma = (xs, f) => xs.reduce((a, x) => a + (f(x) || 0), 0);
const tabla = (cab, filas) => [`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`, ...filas.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const log = (s = '') => console.log(s);
const filasDe = (k, perfiles) => datos[k].filas.filter((r) => perfiles.includes(r.perfil));
const porVariante = (perfiles, columnas) => tabla(['Variante (suelo · segundo · alcance)', ...columnas.map((c) => c[0])], claves.map((k) => { const xs = filasDe(k, perfiles); return [NOMBRE[k], ...columnas.map((c) => c[1](xs))]; }));
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)} %` : '—');

log(`Semanas por perfil: ${datos[claves[0]].semanas}. Perfiles medidos: ${[...new Set(datos[claves[0]].filas.map((r) => r.perfil))].join(', ')}.`);
log(`Planes que no son de engine2 (fallo y motor viejo): ${claves.map((k) => `${NOMBRE[k]}: ${datos[k].filas.filter((r) => r.motor !== 'engine2').length}`).join(' · ')}.\n`);

log('### Pescado (8 perfiles omnívoros sin SIBO)\n');
log(porVariante(OMNI8, [
  ['Pescado/sem', (xs) => f2(media(xs.map((r) => r.pescado)))],
  ['en comida', (xs) => f2(media(xs.map((r) => r.pescadoComida)))],
  ['de segundo', (xs) => f2(media(xs.map((r) => r.pescadoSegundo)))],
  ['en cena', (xs) => f2(media(xs.map((r) => r.pescadoCena)))],
  ...[0, 1, 2, 3, 4, 5, 6].map((n) => [`${n}`, (xs) => pct(xs.filter((r) => r.pescado === n).length, xs.length)]),
  ['7 o más', (xs) => pct(xs.filter((r) => r.pescado >= 7).length, xs.length)],
  ['Racha máx. (media)', (xs) => f2(media(xs.map((r) => r.rachaPescado)))],
]));
log('\nLas columnas 0–7 son el porcentaje de semanas con ese número de platos de pescado o marisco servidos (comida, segundo y cena).\n');

log('### Legumbre (8 perfiles omnívoros sin SIBO)\n');
log(porVariante(OMNI8, [
  ['Legumbre/sem', (xs) => f2(media(xs.map((r) => r.legumbre)))],
  ...[0, 1, 2, 3].map((n) => [`${n}`, (xs) => pct(xs.filter((r) => r.legumbre === n).length, xs.length)]),
  ['4 o más', (xs) => pct(xs.filter((r) => r.legumbre >= 4).length, xs.length)],
  ['Con segundo/sem', (xs) => f2(media(xs.map((r) => r.segundos)))],
  ['Plato único/sem', (xs) => f2(media(xs.map((r) => r.legumbres.filter((l) => !l.ps).length)))],
  ['de ellos redactados', (xs) => f2(media(xs.map((r) => r.legumbres.filter((l) => !l.ps && l.red).length)))],
  ['Fuera de día sorteado/sem', (xs) => f2(media(xs.map((r) => r.legumbres.filter((l) => !l.sorteado).length)))],
  ['Día sorteado sin legumbre /100 sem', (xs) => f1((100 * suma(xs, (r) => r.causas.dia_legumbre_sin_candidato)) / xs.length)],
]));
log();
log('Días de legumbre (comidas de legumbre por semana en cada día):\n');
log(porVariante(OMNI8, [
  ...DIAS.map((d, i) => [d, (xs) => f2(suma(xs, (r) => r.legumbres.filter((l) => l.d === i).length) / xs.length)]),
  ['Patrones más frecuentes', (xs) => { const c = {}; for (const r of xs) c[r.diasLeg || '—'] = (c[r.diasLeg || '—'] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p, n]) => `${p} ${Math.round((100 * n) / xs.length)} %`).join(', '); }],
]));
log();
log('Segundos por familia (por semana) y platos de legumbre como plato único más frecuentes:\n');
log(porVariante(OMNI8, [
  ...['ave', 'carne', 'pescado', 'marisco'].map((f) => [f, (xs) => f2(suma(xs, (r) => r.famSegundos[f]) / xs.length)]),
  ['Plato único: los 4 que más salen (por 100 semanas)', (xs) => { const c = {}; for (const r of xs) for (const l of r.legumbres) if (!l.ps) c[l.t] = (c[l.t] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t, n]) => `${t.slice(0, 28)} ${f1((100 * n) / xs.length)}`).join('; '); }],
]));

log('\n### Proteína y calorías (8 perfiles omnívoros sin SIBO)\n');
const legs = (xs, ps) => xs.flatMap((r) => r.legumbres.filter((l) => l.ps === ps));
log(porVariante(OMNI8, [
  ['Con segundo: proteína / objetivo (mediana)', (xs) => { const l = legs(xs, true); return l.length ? `${Math.round(100 * med(l.map((x) => x.prot / x.oP)))} %` : '—'; }],
  ['cortas (<95 %)', (xs) => { const l = legs(xs, true); return l.length ? `${l.filter((x) => x.prot < 0.95 * x.oP).length} de ${l.length}` : '—'; }],
  ['Plato único de legumbre: proteína / objetivo', (xs) => { const l = legs(xs, false); return l.length ? `${Math.round(100 * med(l.map((x) => x.prot / x.oP)))} %` : '—'; }],
  ['cortas', (xs) => { const l = legs(xs, false); return l.length ? `${l.filter((x) => x.prot < 0.95 * x.oP).length} de ${l.length}` : '—'; }],
  ['Comidas: proteína / objetivo (media)', (xs) => `${f1((100 * suma(xs, (r) => r.protComidas)) / suma(xs, (r) => r.objComidas))} %`],
  ['Comidas y cenas cortas /sem', (xs) => f2(media(xs.map((r) => r.cortas)))],
  ['Bajo 0,3 g/kg /sem', (xs) => f2(media(xs.map((r) => r.bajoMinimo)))],
  ['Proteína/día (g)', (xs) => f1(media(xs.map((r) => r.protDia)))],
  ['% del objetivo', (xs) => `${f1(100 * media(xs.map((r) => r.protDia / r.objProt)))} %`],
]));
log();
log(porVariante(OMNI8, [
  ['Desvío medio de kcal', (xs) => `${f2(media(xs.map((r) => r.desvio)))} %`],
  ['Semanas fuera de ±5 %', (xs) => `${xs.filter((r) => !r.dentro).length} de ${xs.length}`],
  ['Días fuera/sem', (xs) => f2(media(xs.map((r) => r.diasFueraKcal)))],
  ['Con segundo: kcal fuera de ±5 % del objetivo de la comida', (xs) => { const l = legs(xs, true); return l.length ? `${l.filter((x) => Math.abs(x.kcal - x.oK) > 0.05 * x.oK).length} de ${l.length}` : '—'; }],
  ['Días sin verdura/sem', (xs) => f2(media(xs.map((r) => r.diasSinVerdura)))],
]));

log('\n### Gramos de la comida de legumbre a 1434 y 3714 kcal (medianas)\n');
for (const perfil of ['omni-1434', 'omni-2174', 'omni-3714']) {
  log(`**${perfil}**\n`);
  log(porVariante([perfil], [
    ['Con segundo: g totales', (xs) => f1(med(legs(xs, true).map((x) => x.g)))],
    ['mín–máx', (xs) => { const l = legs(xs, true).map((x) => x.g); return l.length ? `${Math.min(...l)}–${Math.max(...l)}` : '—'; }],
    ['legumbre seca (g)', (xs) => f1(med(legs(xs, true).map((x) => x.gLeg)))],
    ['proteico (g)', (xs) => f1(med(legs(xs, true).map((x) => x.gProt)))],
    ['con pan o fruta', (xs) => { const l = legs(xs, true); return l.length ? pct(l.filter((x) => x.extra).length, l.length) : '—'; }],
    ['kcal / objetivo', (xs) => { const l = legs(xs, true); return l.length ? `${Math.round(med(l.map((x) => x.kcal)))} / ${Math.round(med(l.map((x) => x.oK)))}` : '—'; }],
    ['proteína / objetivo', (xs) => { const l = legs(xs, true); return l.length ? `${Math.round(med(l.map((x) => x.prot)))} / ${Math.round(med(l.map((x) => x.oP)))}` : '—'; }],
    ['Plato único: g totales', (xs) => f1(med(legs(xs, false).map((x) => x.g)))],
    ['proteína / objetivo ', (xs) => { const l = legs(xs, false); return l.length ? `${Math.round(med(l.map((x) => x.prot)))} / ${Math.round(med(l.map((x) => x.oP)))}` : '—'; }],
  ]));
  log();
}

log('### Huecos sin candidato y filtros que no se pudieron aplicar (8 perfiles, por 100 semanas)\n');
const c100 = (xs, f) => f1((100 * suma(xs, f)) / xs.length);
log(porVariante(OMNI8, [
  ['Segundo sin candidato', (xs) => c100(xs, (r) => r.causas.segundo_sin_candidato)],
  ['Día de legumbre sin candidato', (xs) => c100(xs, (r) => r.causas.dia_legumbre_sin_candidato)],
  ['Suelo corto sin candidato (paso 4)', (xs) => c100(xs, (r) => r.causas.frecuencia_corta_sin_candidato)],
  ['Walk repetido sin familia', (xs) => c100(xs, (r) => r.causas.familia_dias_seguidos_retirada)],
  ['Huecos: tope sin aplicar', (xs) => c100(xs, (r) => r.sinAplicar.tope)],
  ['separación', (xs) => c100(xs, (r) => r.sinAplicar.separada)],
  ['familia', (xs) => c100(xs, (r) => r.sinAplicar.familia)],
  ['aliño', (xs) => c100(xs, (r) => r.sinAplicar.alino)],
  ['Segundos: tope', (xs) => c100(xs, (r) => r.sinAplicarSegundo.tope)],
  ['separación ', (xs) => c100(xs, (r) => r.sinAplicarSegundo.separada)],
  ['familia ', (xs) => c100(xs, (r) => r.sinAplicarSegundo.familia)],
  ['aliño ', (xs) => c100(xs, (r) => r.sinAplicarSegundo.alino)],
]));

log('\n### Reglas de D-099.3, D-114 y D-115 y restricciones (los 10 perfiles medidos, total de casos)\n');
const TODOS = [...new Set(datos[claves[0]].filas.map((r) => r.perfil))];
log(porVariante(TODOS, [
  ['Plato repetido en la semana', (xs) => suma(xs, (r) => r.d099.platoRepetidoEnSemana)],
  ['Plato de la semana anterior', (xs) => suma(xs, (r) => r.d099.platoDeSemanaAnterior)],
  ['Especie más de 2 veces', (xs) => suma(xs, (r) => r.d099.especieMasDeDosVeces)],
  ['Especie dos veces el mismo día', (xs) => suma(xs, (r) => r.d099.especieMismoDia)],
  ['Especie en días seguidos (sin ancla)', (xs) => suma(xs, (r) => r.d099.especieDiasSeguidosSinAncla)],
  ['Legumbre en cena', (xs) => suma(xs, (r) => r.d099.legumbreEnCena)],
  ['D-114: sugerencia con segundo', (xs) => suma(xs, (r) => r.d114.sugerenciaConSegundo)],
  ['D-115: familia en días seguidos (sin ancla)', (xs) => suma(xs, (r) => r.d115.familiaDiasSeguidosSinAncla)],
  ['de ellas, legumbre', (xs) => suma(xs, (r) => r.d115.porFamilia.legumbre)],
  ['Comidas con vetado', (xs) => suma(xs, (r) => r.vetados)],
  ['con eliminado', (xs) => suma(xs, (r) => r.eliminados)],
]));

log('\n### Por perfil: pescado, legumbre, calorías y proteína\n');
for (const k of claves) {
  log(`**${NOMBRE[k]}**\n`);
  log(tabla(['Perfil', 'Pescado/sem', 'Legumbre/sem', 'Con segundo/sem', 'Desvío kcal', 'Fuera de ±5 %', 'Proteína/día (% obj.)', 'Cortas/sem', 'D-115 sin ancla', 'Día sorteado sin legumbre', 'Segundo sin candidato'],
    TODOS.map((p) => { const xs = filasDe(k, [p]); return [p, f2(media(xs.map((r) => r.pescado))), f2(media(xs.map((r) => r.legumbre))), f2(media(xs.map((r) => r.segundos))), `${f2(media(xs.map((r) => r.desvio)))} %`, xs.filter((r) => !r.dentro).length, `${f1(100 * media(xs.map((r) => r.protDia / r.objProt)))} %`, f2(media(xs.map((r) => r.cortas))), suma(xs, (r) => r.d115.familiaDiasSeguidosSinAncla), suma(xs, (r) => r.causas.dia_legumbre_sin_candidato), suma(xs, (r) => r.causas.segundo_sin_candidato)]; })));
  log();
}
