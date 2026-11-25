// Resumen de variantesComidaDoble.mjs: MEDICIÓN, no cambia reglas. Lee las salidas de medirEstructura.mjs de cada
// variante y los registros del diagnóstico de los primeros, y escribe las tablas.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/resumenVariantesComidaDoble.mjs <carpeta> [salida.md]
//   <carpeta> con v-actual.json, v-tope.json, v-topeSegundo.json, v-topeSegundo10.json, v-noUsados.json, v-noUsadosPrimeros.json,
//   diag-actual.json y diag-noUsados.json
import fs from 'node:fs';
import path from 'node:path';

const R = new URL('../../../', import.meta.url).href;
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { aplicarAjustesD099 } = await import(R + 'src/engine2/dishes/ajustesD099.js');
const { aplicarNombresD105 } = await import(R + 'src/engine2/dishes/alinosD105.js');
const { esCompuestoLegumbre } = await import(R + 'src/engine2/dishes/bases.js');
const { tuplaDe } = await import(R + 'src/plan/textos/componer.js');

const [dir, salida] = process.argv.slice(2);
if (!dir) throw new Error('Falta la carpeta');
const leer = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const V = { actual: leer('v-actual.json'), tope: leer('v-tope.json'), topeSegundo: leer('v-topeSegundo.json'), topeSegundo10: leer('v-topeSegundo10.json'), noUsados: leer('v-noUsados.json'), noUsadosPrimeros: leer('v-noUsadosPrimeros.json') };
const NOMBRE = { actual: 'Motor actual', tope: 'Aceite con tope (5 + 15); falta: legumbre y pan o fruta', topeSegundo: 'Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida)', topeSegundo10: 'Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta', noUsados: 'Legumbre y aliño no usados en la semana', noUsadosPrimeros: 'Legumbre no usada en la semana y aliño no usado por otro primero' };
const CAT = aplicarNombresD105(aplicarAjustesD099(catalogoApp()));
const PRIMEROS = CAT.filter(esCompuestoLegumbre);
const nombre = new Map(CAT.map((d) => [d.id, d.nombre]));
const rol = new Map(CAT.map((d) => [d.id, d.rol]));
const tupla = (id) => tuplaDe(id) || {};

const n1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace('.', ',') : '—');
const n2 = (x) => (Number.isFinite(x) ? x.toFixed(2).replace('.', ',') : '—');
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : '—');
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const med = (xs) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const max = (xs) => (xs.length ? Math.max(...xs) : NaN);
const tabla = (cab, filas) => [`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`, ...filas.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const L = [];
const log = (s = '') => L.push(s);
const perfiles = [...new Set(V.actual.filas.map((r) => r.perfil))];
const conDobles = perfiles.filter((p) => V.actual.filas.some((r) => r.perfil === p && r.legumbres.some((l) => l.ps)));
const filas = (v, p) => V[v].filas.filter((r) => !p || r.perfil === p);
const dobles = (xs) => xs.flatMap((r) => r.legumbres.filter((l) => l.ps));
const d099 = (r) => Object.values(r.d099).reduce((a, b) => a + b, 0);

log('# Variantes de la comida doble: aceite y elección del primero');
log();
log(`Salida de \`resumenVariantesComidaDoble.mjs\`. ${V.actual.semanas} semanas seguidas por perfil, por la entrada de la app (\`generarPlan\`), con las variantes aplicadas en memoria por \`variantesComidaDoble.mjs\` (sin tocar \`src/\`). «Motor actual» es esta rama tal cual. Planes que no son de engine2: ${Object.entries(V).map(([k, x]) => `${k} ${x.filas.filter((r) => r.motor !== 'engine2').length}`).join(' · ')}.`);
log();

// ─── 1. Aceite ───────────────────────────────────────────────────────────────
log('## 1. Aceite de la comida doble');
log();
log('Aceite en ml (AOVE y aceite de semillas de la compra; sin cantidad, 10 ml); el día no incluye la comida libre del sábado. «Fuera de ±5 %» y «cortas» son comidas dobles frente al objetivo de su comida (kcal) y al 95 % de su objetivo de proteína. Legumbre en seco y segundo (el proteico del segundo plato), en gramos, medianas.');
log();
const COLS1 = ['Variante', 'Doble: ml media (máx.)', 'Día: ml media (máx.)', 'Dobles', 'Fuera de ±5 % de kcal', 'Cortas de proteína', 'Comidas y cenas cortas/sem', 'Proteína del día', 'Doble: proteína / objetivo (mediana)', 'Legumbre (g)', 'Segundo (g)', 'Con pan o fruta', 'Semanas fuera de ±5 %'];
const fila1 = (v, p) => {
  const xs = filas(v, p); const d = dobles(xs); const dias = xs.flatMap((r) => r.mlDias);
  return [NOMBRE[v], `${n1(media(d.map((l) => l.ml)))} (${n1(max(d.map((l) => l.ml)))})`, `${n1(media(dias))} (${n1(max(dias))})`, d.length,
    `${d.filter((l) => Math.abs(l.kcal - l.oK) > 0.05 * l.oK).length} (${pct(d.filter((l) => Math.abs(l.kcal - l.oK) > 0.05 * l.oK).length, d.length)})`,
    d.filter((l) => l.prot < 0.95 * l.oP).length, n2(media(xs.map((r) => r.cortas))), `${n1(media(xs.map((r) => (100 * r.protDia) / r.objProt)))} %`,
    `${Math.round(100 * med(d.map((l) => l.prot / l.oP)))} %`, n1(med(d.map((l) => l.gLeg))), n1(med(d.map((l) => l.gSeg))), pct(d.filter((l) => l.extra).length, d.length), xs.filter((r) => !r.dentro).length];
};
for (const p of conDobles) {
  log(`### ${p}`);
  log();
  log(tabla(COLS1, ['actual', 'tope', 'topeSegundo', 'topeSegundo10'].map((v) => fila1(v, p))));
  log();
}
log('### Todos los perfiles con comida doble');
log();
log(tabla(COLS1, ['actual', 'tope', 'topeSegundo', 'topeSegundo10'].map((v) => fila1(v, null))));
log();

// ─── 2. Primeros ─────────────────────────────────────────────────────────────
log('## 2. Los primeros de la semana');
log();
const ultimo = (regs) => { const m = new Map(); for (const r of regs) m.set(`${r.seed}|${r.day}`, r); return [...m.values()]; };
const diagA = ultimo(leer('diag-actual.json'));
const ETAPAS = [['pool', 'Pool (rotativo, sin usar, no vetado, no de la semana anterior)'], ['tope', 'Tope de proteína (2 por especie)'], ['separada', 'Proteína separada (mismo día o al lado)'], ['familia', 'Familia en días seguidos'], ['alino', 'Aliño (mismo día; ajillo 2 por semana)'], ['A', 'Nivel de legumbre y preferencia A'], ['B', 'Preferencia B'], ['paso5', 'Paso 5 (identidad de verdura)']];
const OMNI = ['omni-1434', 'omni-2174', 'omni-2600-3comidas', 'omni-3714', 'celiaco-2400', 'sin-lactosa-2000', 'omni-2174-ancla', 'omni-2000-sin-atun'];
const deSemilla = (r) => r.seed.replace(/^banco-/, '').replace(/:\d+$/, '');
const semanaDe = (r) => Number(r.seed.split(':').pop());

log('### 2.1 Diagnóstico: dónde se pierden los primeros');
log();
log('Registro de `runWalk.js` (motor actual, sin cambios), en cada comida de un día sorteado que llegó al nivel de legumbre (línea 645, `candidatesA.filter(esCompuestoLegumbre)`): qué compuestos de legumbre quedan tras cada filtro. Las líneas son las de `src/engine2/walk/runWalk.js`: pool 498, tope 534, separación 553, familia 582, aliño 622 y 636, nivel 645 y preferencia A 657, preferencia B 680, paso 5 746 (`chooseIdentityLevel`) y desempate con RNG 759. Si un walk se repite (red de familia), cuenta el último.');
log();
const ej = diagA.filter((r) => deSemilla(r) === 'omni-2174' && semanaDe(r) < 80);
log(`**20 semanas de ejemplo (omni-2174, semanas 60 a 79): ${ej.length} comidas de día sorteado.** Media de compuestos de legumbre que quedan tras cada filtro, y en cuántas comidas queda cada primero:`);
log();
const rotativos = PRIMEROS.filter((d) => rol.get(d.id) === 'rotativo');
const tablaEtapas = (regs) => tabla(['Primero', ...ETAPAS.map(([, t]) => t), 'Elegido'], [
  ['**Media de candidatos**', ...ETAPAS.map(([k]) => n1(media(regs.map((r) => r[k].length)))), '—'],
  ...PRIMEROS.map((d) => [`${d.nombre}${rol.get(d.id) !== 'rotativo' ? ` (${rol.get(d.id)})` : ''}`, ...ETAPAS.map(([k]) => regs.filter((r) => r[k].includes(d.id)).length), regs.filter((r) => r.elegido === d.id).length]),
]);
log(tablaEtapas(ej));
log();
const todasOmni = diagA.filter((r) => OMNI.includes(deSemilla(r)));
log(`**Los 8 perfiles omnívoros sin SIBO, 200 semanas: ${todasOmni.length} comidas de día sorteado.**`);
log();
log(tablaEtapas(todasOmni));
log();
// Pérdida por filtro: para cada primero rotativo, de las comidas en que estaba en el pool, en cuántas lo quita cada filtro.
log('Dónde se pierde cada primero (de las comidas en que estaba en el pool, en cuántas lo quita cada filtro), 8 perfiles omnívoros:');
log();
log(tabla(['Primero', 'En el pool', ...ETAPAS.slice(1).map(([, t]) => `Lo quita: ${t}`), 'Llega al RNG', 'Elegido', 'Elegido cuando llega al RNG'], rotativos.map((d) => {
  const en = todasOmni.filter((r) => r.pool.includes(d.id));
  const quita = ETAPAS.slice(1).map(([k], j) => en.filter((r) => r[ETAPAS[j][0]].includes(d.id) && !r[k].includes(d.id)).length);
  const llega = en.filter((r) => r.paso5.includes(d.id));
  const elegido = todasOmni.filter((r) => r.elegido === d.id).length;
  return [d.nombre, en.length, ...quita, llega.length, elegido, pct(elegido, llega.length)];
})));
log();
const enPool = rotativos.map((d) => todasOmni.filter((r) => r.pool.includes(d.id)).length);
// Por qué el filtro de aliño quita los primeros al ajillo.
const ajillo = rotativos.filter((d) => tupla(d.id).S === 'ajillo');
const quitados = todasOmni.flatMap((r) => ajillo.filter((d) => r.familia.includes(d.id) && !r.alino.includes(d.id)).map(() => r));
const porTope = quitados.filter((r) => r.ajillosSemana >= 2 && !(r.alinosHoy || []).includes('ajillo')).length;
const porHoy = quitados.filter((r) => r.ajillosSemana < 2 && (r.alinosHoy || []).includes('ajillo')).length;
const ambos = quitados.filter((r) => r.ajillosSemana >= 2 && (r.alinosHoy || []).includes('ajillo')).length;
log(`Los ${ajillo.length} primeros al ajillo los quita el filtro de aliño (líneas 615 a 625) ${quitados.length} veces: ${porTope} por el tope de 2 ajillos por semana (\`TOPE_AJILLO_SEMANA\`, \`alinosD105.js:42\`), ${porHoy} porque ese día ya sale un ajillo y ${ambos} por las dos cosas. En las comidas de día sorteado, el ajillo ya había salido 2 veces en la semana en ${todasOmni.filter((r) => r.ajillosSemana >= 2).length} de ${todasOmni.length}.`);
// Quién gasta los 2 ajillos de la semana: platos al ajillo servidos, por hueco (menú de cada semana del motor actual).
const { alinoDe } = await import(R + 'src/engine2/dishes/alinosD105.js');
const porNombre = new Map(CAT.map((d) => [d.nombre, d]));
const huecoAjillo = { comida: 0, primero: 0, segundo: 0, cena: 0 };
for (const r of V.actual.filas.filter((x) => OMNI.includes(x.perfil))) for (const linea of r.menu) {
  const m = linea.match(/^[LMXJVSD]([C2N])(\*?) (.*)$/); if (!m || m[2]) continue;
  const nombre0 = m[3].replace(/ \(comida principal\)$/, '');
  const [n1x, n2x] = nombre0.split('; de segundo, ');
  const d = porNombre.get(n1x) || porNombre.get(n1x.charAt(0).toUpperCase() + n1x.slice(1));
  if (m[1] === '2') { const d2 = porNombre.get(nombre0) || porNombre.get(nombre0.charAt(0).toUpperCase() + nombre0.slice(1)); if (d2 && alinoDe(d2) === 'ajillo') huecoAjillo.segundo += 1; continue; }
  if (!d || alinoDe(d) !== 'ajillo') continue;
  if (m[1] === 'N') huecoAjillo.cena += 1; else if (esCompuestoLegumbre(d)) huecoAjillo.primero += 1; else huecoAjillo.comida += 1;
  void n2x;
}
const semanasOmni = V.actual.filas.filter((x) => OMNI.includes(x.perfil)).length;
log(`Quién gasta los ajillos (platos al ajillo servidos por semana, motor actual, 8 perfiles omnívoros): ${Object.entries(huecoAjillo).map(([k, n]) => `${k === 'comida' ? 'comida de plato único' : k} ${n2(n / semanasOmni)}`).join(', ')}. De los 23 segundos posibles, ${PRIMEROS.length ? CAT.filter((d) => d.rol === 'rotativo' && tupla(d.id).tmpl === 'caliente_clasico' && !tupla(d.id).C && alinoDe(d) === 'ajillo' && ['pollo', 'pavo', 'ternera', 'cerdo', 'conejo'].includes(tupla(d.id).P)).length : 0} son al ajillo.`);
log();
log(`En el pool, cada primero rotativo está entre ${Math.min(...enPool)} y ${Math.max(...enPool)} de ${todasOmni.length} comidas. Los ${PRIMEROS.length - rotativos.length} primeros del ancla (rol «ancla») nunca están en el pool del walk: solo los coloca el ancla.`);
log();

// Reparto, repeticiones, sorteados sin legumbre, D-099.3 y red, por variante.
log('### 2.2 Variante: legumbre y aliño no usados al elegir el primero');
log();
log('En la comida de un día sorteado, dentro del nivel de legumbre y antes de las preferencias A y B, se prefiere un primero cuya legumbre no salga ya en la semana (en ningún plato servido) y, después, uno cuyo aliño no salga ya: en la variante «no usados en la semana», en ningún plato servido (segundos incluidos); en la otra, en ningún otro primero. Cada preferencia se relaja si dejaría el hueco sin candidatos y lo dice en el log (`primero_legumbre_no_usada`, `primero_alino_no_usado` y sus `_sin_aplicar`). Sin pesos.');
log();
const VAR2 = ['actual', 'noUsados', 'noUsadosPrimeros'];
const repite = (xs, f) => { const v = xs.map(f); return v.length - new Set(v).size > 0; };
const fila2 = (v, ps) => {
  const xs = V[v].filas.filter((r) => ps.includes(r.perfil));
  const conDos = xs.filter((r) => r.primeros.length >= 2);
  const c = (k) => xs.reduce((a, r) => a + (r.causas[k] || 0), 0);
  return [NOMBRE[v], conDos.length, `${conDos.filter((r) => repite(r.primeros, (id) => tupla(id).P)).length} (${pct(conDos.filter((r) => repite(r.primeros, (id) => tupla(id).P)).length, conDos.length)})`,
    `${conDos.filter((r) => repite(r.primeros, (id) => tupla(id).S)).length} (${pct(conDos.filter((r) => repite(r.primeros, (id) => tupla(id).S)).length, conDos.length)})`,
    `${conDos.filter((r) => repite(r.primeros, (id) => `${tupla(id).P}|${tupla(id).S}`)).length} (${pct(conDos.filter((r) => repite(r.primeros, (id) => `${tupla(id).P}|${tupla(id).S}`)).length, conDos.length)})`,
    n2(media(xs.map((r) => r.segundos))), n2(media(xs.map((r) => r.legumbre))), n1((100 * c('dia_legumbre_sin_candidato')) / xs.length), xs.reduce((a, r) => a + d099(r), 0),
    `${xs.filter((r) => r.causas.regla_legumbre_retirada_d099).length} / ${xs.filter((r) => r.causas.regla_legumbre_retirada_pool_vacio).length}`,
    `${c('primero_legumbre_no_usada')} / ${c('primero_legumbre_no_usada_sin_aplicar')}`, `${c('primero_alino_no_usado')} / ${c('primero_alino_no_usado_sin_aplicar')}`,
    n2(media(xs.map((r) => r.cortas))), `${n1(media(xs.map((r) => (100 * r.protDia) / r.objProt)))} %`, n2(media(xs.map((r) => r.d115.familiaDiasSeguidosSinAncla)))];
};
const COLS2 = ['Variante', 'Semanas con 2 o más primeros', 'Repiten legumbre', 'Repiten aliño', 'Repiten guiso (legumbre y aliño)', 'Comidas dobles/sem', 'Legumbre/sem', 'Día sorteado sin legumbre /100 sem', 'Infracciones de D-099.3', 'Semanas con la red (D-099 / pool vacío)', 'Legumbre no usada: aplicada / sin aplicar', 'Aliño no usado: aplicada / sin aplicar', 'Comidas y cenas cortas/sem', 'Proteína del día', 'Familia en días seguidos/sem'];
log('**Los 8 perfiles omnívoros sin SIBO**');
log();
log(tabla(COLS2, VAR2.map((v) => fila2(v, OMNI))));
log();
for (const p of conDobles) {
  log(`**${p}**`);
  log();
  log(tabla(COLS2, VAR2.map((v) => fila2(v, [p]))));
  log();
}
log('**Reparto de los 14 primeros** (comidas dobles servidas, 8 perfiles omnívoros, 200 semanas):');
log();
const reparto = (v) => { const c = new Map(); for (const r of V[v].filas.filter((x) => OMNI.includes(x.perfil))) for (const id of r.primeros) c.set(id, (c.get(id) || 0) + 1); return c; };
const R0 = Object.fromEntries(VAR2.map((v) => [v, reparto(v)]));
const tot = Object.fromEntries(VAR2.map((v) => [v, [...R0[v].values()].reduce((a, b) => a + b, 0)]));
log(tabla(['Primero', 'Legumbre', 'Aliño', 'Rol', ...VAR2.map((v) => NOMBRE[v])], [
  ...PRIMEROS.map((d) => [d.nombre, tupla(d.id).P, tupla(d.id).S, rol.get(d.id), ...VAR2.map((v) => `${R0[v].get(d.id) || 0} (${pct(R0[v].get(d.id) || 0, tot[v])})`)]),
  ['**Total**', '', '', '', ...VAR2.map((v) => tot[v])],
]));
log();
const porLeg = (v) => { const c = {}; for (const [id, n] of R0[v]) { const k = tupla(id).P; c[k] = (c[k] || 0) + n; } return c; };
log(`Por legumbre: ${VAR2.map((v) => `${NOMBRE[v]}: ${Object.entries(porLeg(v)).map(([k, n]) => `${k} ${pct(n, tot[v])}`).join(', ')}`).join(' · ')}.`);
log();
const texto = L.join('\n');
console.log(texto);
if (salida) fs.writeFileSync(salida, `${texto}\n`);
