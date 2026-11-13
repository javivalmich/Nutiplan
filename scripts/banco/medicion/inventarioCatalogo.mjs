// Inventario del catálogo de engine2 para decidir qué platos faltan: MEDICIÓN, no cambia reglas ni propone platos.
// Todo sale de funciones del motor (filtrarCatalogo, aplicarAjustesD099, componerPlato, ajustarDia, leerComida,
// medirComida, familiaDe del banco); aquí solo se recorre el catálogo y se cuentan resultados.
//
//   1. platos por familia × momento × estructura, por perfil (catálogo tal como lo ve el walk);
//   2. por plato: kcal de referencia, proteína por 100 kcal y kcal por gramo servido (plato de partida, sin raciones);
//   3. a 3714 kcal (perfil omni-3714): platos cuya proteína topa antes del objetivo de la comida y lo que se añade;
//   4. a 1434 kcal (perfil omni-1434): gramos totales de la comida ya ajustada;
//   5. celdas familia × momento × estructura con menos de 5 platos (sale de 1).
//
// Estructura (definición OPERATIVA de este script, no del motor; el motor no la tiene):
//   redactado   = id que no empieza por «[» (ficha libre; metricas.mjs: esRedactado);
//   con segundo = plato compuesto de la plantilla caliente_clasico (proteína + guarnición);
//   plato único = plato compuesto de pasta, legumbre, bowl, ensalada o sopa_crema.
// Un plato de momento comida+cena cuenta en las dos columnas.
//
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/inventarioCatalogo.mjs <directorio-de-salida>
import fs from 'node:fs';
import path from 'node:path';

const R = new URL('../../../', import.meta.url).href;
const { generarPlan } = await import(R + 'src/plan/generarPlan.js');
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { filtrarCatalogo } = await import(R + 'src/plan/engine2App.js');
const { aplicarAjustesD099 } = await import(R + 'src/engine2/dishes/ajustesD099.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { PERFILES, clonar, SEMANA_INICIAL, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const { familiaDe } = await import(R + 'scripts/banco/metricas.mjs');
const { componerPlato } = await import(R + 'src/plan/textos/componer.js');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { medirComida } = await import(R + 'src/plan/medidor/medir.js');
const { ajustarDia } = await import(R + 'src/plan/racionesApp.js');
const { COMPOSICION } = await import(R + 'src/engine2/nutrientes/composicion.js');
const { papelDe } = await import(R + 'src/engine2/nutrientes/raciones.js');

const salida = process.argv[2];
if (!salida) throw new Error('Falta el directorio de salida');
fs.mkdirSync(salida, { recursive: true });
const log = console.log;
const callado = (f) => { const l = console.log, e = console.error, w = console.warn; console.log = console.error = console.warn = () => {}; try { return f(); } finally { console.log = l; console.error = e; console.warn = w; } };

const PERFIL_DE = { omnívoro: 'omni-2174', vegetariano: 'vegetariana-2000', vegano: 'vegana-1400', celíaco: 'celiaco-2400', SIBO: 'sibo-2000' };
const porId = (id) => PERFILES.find((p) => p.id === id);
const MOMENTOS = ['comida', 'cena'];
const ESTRUCTURAS = ['plato único', 'con segundo', 'redactado'];
const KCAL_REF = 2000; // objetivo con el que se compone el plato de referencia (solo afecta a los gramos de partida de verdura)

const tmplDe = (d) => (d.id.startsWith('[') ? JSON.parse(d.id)[0] : null);
const estructuraDe = (d) => (!d.id.startsWith('[') ? 'redactado' : tmplDe(d) === 'caliente_clasico' ? 'con segundo' : 'plato único');
const mediana = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const f1 = (x) => (Number.isFinite(x) ? (Math.round(x * 10) / 10).toString() : '—');
const f2 = (x) => (Number.isFinite(x) ? (Math.round(x * 100) / 100).toFixed(2) : '—');
const tabla = (cab, filas) => [`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`, ...filas.map((f) => `| ${f.join(' | ')} |`)].join('\n');

// ─── Catálogo por perfil, tal como lo ve el walk ────────────────────────────────────────────────
const base = catalogoApp();
const catalogos = {};
for (const [nombre, id] of Object.entries(PERFIL_DE)) {
  const p = porId(id);
  const { catalogo, quitados } = callado(() => filtrarCatalogo(base, clonar(p.perfil), p.kcal, {}));
  catalogos[nombre] = { id, quitados: quitados.length, platos: aplicarAjustesD099(catalogo) };
}
const familiaMemo = new Map();
const familia = (d) => { if (!familiaMemo.has(d.id)) familiaMemo.set(d.id, familiaDe(d).familia); return familiaMemo.get(d.id); };

// ─── 1. Platos por familia × momento × estructura ──────────────────────────────────────────────
const todasFamilias = [...new Set(Object.values(catalogos).flatMap((c) => c.platos.map(familia)))].sort();
const celdas = {}; // perfil → clave → n
for (const [nombre, c] of Object.entries(catalogos)) {
  celdas[nombre] = {};
  for (const d of c.platos) for (const m of MOMENTOS) if (d.momento.includes(m)) {
    const k = `${familia(d)}|${m}|${estructuraDe(d)}`;
    celdas[nombre][k] = (celdas[nombre][k] || 0) + 1;
  }
}
log(`# Inventario del catálogo (script: scripts/banco/medicion/inventarioCatalogo.mjs)\n`);
log(`Catálogo base: scripts/phaseB2/output/dishes.json vía catalogoApp() = ${base.length} platos.`);
log(`Por perfil: filtrarCatalogo(catalogoApp(), perfil, kcal, {}) + aplicarAjustesD099, como en materializePlan.\n`);
log('## 0. Tamaño del catálogo por perfil\n');
log(tabla(['Perfil', 'Perfil del banco', 'Platos', 'Quitados por el filtro', 'con momento comida', 'con momento cena', 'redactados', 'compuestos'], Object.entries(catalogos).map(([n, c]) => [n, c.id, c.platos.length, c.quitados, c.platos.filter((d) => d.momento.includes('comida')).length, c.platos.filter((d) => d.momento.includes('cena')).length, c.platos.filter((d) => !d.id.startsWith('[')).length, c.platos.filter((d) => d.id.startsWith('[')).length])));
log('\nFamilia sin resolver (familiaDe → sin_familia / sin_resolver / desconocido), por perfil:');
for (const [n, c] of Object.entries(catalogos)) log(`- ${n}: ${c.platos.filter((d) => /^(sin_familia|sin_resolver|desconocido)$/.test(familia(d))).length}`);

log('\n## 1. Platos por familia × momento × estructura (celdas con menos de 5 platos marcadas con *)\n');
const cab1 = ['Familia', ...MOMENTOS.flatMap((m) => ESTRUCTURAS.map((e) => `${m} · ${e}`))];
for (const [nombre] of Object.entries(catalogos)) {
  log(`### ${nombre} (${catalogos[nombre].id})\n`);
  const filas = todasFamilias.map((f) => [f, ...MOMENTOS.flatMap((m) => ESTRUCTURAS.map((e) => { const n = celdas[nombre][`${f}|${m}|${e}`] || 0; return n < 5 ? `${n}*` : String(n); }))]);
  filas.push(['**total**', ...MOMENTOS.flatMap((m) => ESTRUCTURAS.map((e) => String(todasFamilias.reduce((a, f) => a + (celdas[nombre][`${f}|${m}|${e}`] || 0), 0))))]);
  log(tabla(cab1, filas) + '\n');
}
log('Plantilla de los platos compuestos (para reagrupar «estructura» si se prefiere otra definición), omnívoro:');
{
  const t = {};
  for (const d of catalogos['omnívoro'].platos) { const k = tmplDe(d) || 'redactado'; t[k] = (t[k] || 0) + 1; }
  log(tabla(['Plantilla', 'Platos'], Object.entries(t).map(([k, v]) => [k, v])) + '\n');
}

// ─── 5. Huecos (de la tabla 1) ─────────────────────────────────────────────────────────────────
log('## 5. Huecos: celdas familia × momento × estructura con menos de 5 platos, por perfil\n');
{
  const filas = [];
  for (const nombre of Object.keys(catalogos)) {
    let ceros = 0, unoACuatro = 0, total = 0;
    const lista = [];
    for (const f of todasFamilias) for (const m of MOMENTOS) for (const e of ESTRUCTURAS) {
      total += 1;
      const n = celdas[nombre][`${f}|${m}|${e}`] || 0;
      if (n === 0) ceros += 1; else if (n < 5) { unoACuatro += 1; lista.push(`${f}/${m}/${e}=${n}`); }
    }
    filas.push([nombre, total, ceros, unoACuatro, lista.join('; ') || '—']);
  }
  log(tabla(['Perfil', 'Celdas', 'Con 0 platos', 'Con 1–4', 'Celdas con 1–4 (familia/momento/estructura=n)'], filas) + '\n');
  log('Las celdas con 0 platos se ven con `0*` en las tablas de la sección 1 (incluye combinaciones que no existen por diseño, p. ej. familias de carne en el perfil vegano).\n');
}

// ─── 2. Por plato: referencia ─────────────────────────────────────────────────────────────────
const union = new Map();
for (const c of Object.values(catalogos)) for (const d of c.platos) if (!union.has(d.id)) union.set(d.id, d);
const dishes = [...union.values()];
const perfilesDe = (d) => Object.entries(catalogos).filter(([, c]) => c.platos.some((x) => x.id === d.id)).map(([n]) => n);

const ref = new Map();
let errores = 0;
for (const d of dishes) {
  const momento = d.momento.includes('comida') ? 'comida' : 'cena';
  try {
    const meal = callado(() => componerPlato(d, momento, KCAL_REF));
    const lect = leerComida(meal);
    const x = medirComida(meal, COMPOSICION);
    const gramos = lect.items.reduce((a, i) => a + i.gramos, 0);
    ref.set(d.id, { id: d.id, nombre: d.nombre, familia: familia(d), estructura: estructuraDe(d), tmpl: tmplDe(d) || 'redactado', momentos: d.momento.join('+'), perfiles: perfilesDe(d).join('+'), kcal: x.kcal, prot: x.proteina, gramos: Math.round(gramos), p100: x.kcal ? (x.proteina / x.kcal) * 100 : NaN, dens: gramos ? x.kcal / gramos : NaN, lecturaIncompleta: lect.libre || lect.sinCantidad.length > 0 || x.sinDato.length > 0 });
  } catch (e) { errores += 1; }
}
const R2 = [...ref.values()];
const terciles = (vals) => { const s = [...vals].sort((a, b) => a - b); const n = s.length; return [s[Math.ceil(n / 3) - 1], s[Math.ceil((2 * n) / 3) - 1]]; };
const tercil = (v, [c1, c2]) => (v <= c1 ? 1 : v <= c2 ? 2 : 3);
const cutP = terciles(R2.filter((r) => Number.isFinite(r.p100)).map((r) => r.p100));
const cutD = terciles(R2.filter((r) => Number.isFinite(r.dens)).map((r) => r.dens));
for (const r of R2) { r.tP = Number.isFinite(r.p100) ? tercil(r.p100, cutP) : null; r.tD = Number.isFinite(r.dens) ? tercil(r.dens, cutD) : null; }

log('## 2. Por plato: kcal de referencia, proteína por 100 kcal y densidad energética\n');
log(`Plato de partida (componerPlato a ${KCAL_REF} kcal, sin raciones; leerComida + medirComida). Universo: unión de los 5 catálogos = ${dishes.length} platos únicos; medidos ${R2.length}; errores al componer ${errores}.`);
log(`Platos con lectura incompleta (ingrediente sin cantidad, sin datos o sin reconocer; sus kcal están por debajo): ${R2.filter((r) => r.lecturaIncompleta).length}.`);
log(`Cortes de tercil (T1 ≤ c1 < T2 ≤ c2 < T3): proteína/100 kcal c1=${f2(cutP[0])}, c2=${f2(cutP[1])} · kcal/g c1=${f2(cutD[0])}, c2=${f2(cutD[1])}.\n`);
{
  const fams = [...new Set(R2.map((r) => r.familia))].sort();
  log(tabla(['Familia', 'Platos', 'kcal ref. (mediana)', 'kcal ref. mín–máx', 'prot/100 kcal (mediana)', 'kcal/g (mediana)', 'prot/100 kcal T1·T2·T3', 'kcal/g T1·T2·T3'], fams.map((f) => {
    const xs = R2.filter((r) => r.familia === f);
    const c = (k, t) => xs.filter((r) => r[k] === t).length;
    return [f, xs.length, f1(mediana(xs.map((r) => r.kcal))), `${Math.min(...xs.map((r) => r.kcal))}–${Math.max(...xs.map((r) => r.kcal))}`, f2(mediana(xs.map((r) => r.p100))), f2(mediana(xs.map((r) => r.dens))), `${c('tP', 1)}·${c('tP', 2)}·${c('tP', 3)}`, `${c('tD', 1)}·${c('tD', 2)}·${c('tD', 3)}`];
  })) + '\n');
  log('Terciles por perfil (platos del catálogo de cada perfil que caen en cada tercil, con los cortes de arriba):\n');
  log(tabla(['Perfil', 'Platos medidos', 'prot/100 kcal T1·T2·T3', 'kcal/g T1·T2·T3'], Object.keys(catalogos).map((n) => {
    const xs = R2.filter((r) => r.perfiles.split('+').includes(n));
    const c = (k, t) => xs.filter((r) => r[k] === t).length;
    return [n, xs.length, `${c('tP', 1)}·${c('tP', 2)}·${c('tP', 3)}`, `${c('tD', 1)}·${c('tD', 2)}·${c('tD', 3)}`];
  })) + '\n');
  log('Cruce tercil de proteína × tercil de densidad (platos):\n');
  log(tabla(['prot/100 kcal \\ kcal/g', 'T1 (poco densos)', 'T2', 'T3 (muy densos)'], [1, 2, 3].map((a) => [`T${a}`, ...[1, 2, 3].map((b) => R2.filter((r) => r.tP === a && r.tD === b).length)])) + '\n');
}

// ─── 3 y 4. Raciones reales con ajustarDia ───────────────────────────────────────────────────
// Día de companions: el miércoles (índice 2) del plan real de cada perfil del banco, semana SEMANA_INICIAL.
// Se sustituye la comida (o la cena) por el plato medido, se llama a ajustarDia (el mismo cálculo que la app)
// y se lee el resultado de ese hueco. El resto del día es el mismo para todos los platos.
function contexto(idPerfil) {
  const p = porId(idPerfil);
  const plan = callado(() => generarPlan(clonar(p.perfil), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: SEMANA_INICIAL, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: [] }));
  const day = plan.days[2];
  const iComida = day.meals.findIndex((m) => m && m.time === 'Comida');
  const iCena = day.meals.findIndex((m) => m && m.time === 'Cena');
  return { p, day, iComida, iCena, motor: plan.motor };
}
const clavesAnadibles = new Set(['pan_integral', 'pan_sin_gluten', 'fruta', 'nuez']);
const kcalDe = (clave, g) => (COMPOSICION[clave] ? (COMPOSICION[clave].kcal * g) / 100 : 0);

function racionar(ctx, d, momento) {
  const idx = momento === 'comida' ? ctx.iComida : ctx.iCena;
  if (idx < 0) return null;
  const compuesta = callado(() => componerPlato(d, momento, ctx.p.kcal));
  const meal = { ...compuesta, time: momento === 'cena' ? 'Cena' : 'Comida', title: d.nombre, _motor: 'engine2', _dishId: d.id };
  const meals = ctx.day.meals.map((m, i) => (i === idx ? meal : m));
  const original = leerComida(meal);
  const r = callado(() => ajustarDia({ ...ctx.day, meals }, clonar(ctx.p.perfil), ctx.p.kcal));
  const out = r.day.meals[idx];
  const lect = leerComida(out);
  const entradas = r.log.filter((e) => e.momento === momento && e.id === String(idx));
  const lim = (entradas.find((e) => e.causa === 'raciones_por_objetivo') || {}).detalle || '';
  const limitados = ((lim.match(/en su límite: (.*)$/) || [])[1] || '').split(', ').filter(Boolean).map((s) => { const m = s.match(/^(.+) \((maximo|minimo)\)$/); return m ? { clave: m[1], tipo: m[2] } : null; }).filter(Boolean);
  const proteicoMax = limitados.filter((x) => x.tipo === 'maximo' && papelDe(x.clave, COMPOSICION[x.clave]) === 'proteico').map((x) => x.clave);
  const anadidos = (out.acompanamientos || []).filter((c) => !original.items.some((i) => i.clave === c));
  const gAnadido = lect.items.filter((i) => anadidos.includes(i.clave)).reduce((a, i) => a + i.gramos, 0);
  const kAnadido = lect.items.filter((i) => anadidos.includes(i.clave)).reduce((a, i) => a + kcalDe(i.clave, i.gramos), 0);
  const extrasG = {};
  for (const i of lect.items) if (anadidos.includes(i.clave)) extrasG[i.clave] = Math.round((extrasG[i.clave] || 0) + i.gramos);
  const ampliados = entradas.filter((e) => e.causa === 'acompanamiento_ampliado').map((e) => (e.detalle.match(/^más (\S+) /) || [])[1]).filter(Boolean);
  const n = out.nutricion;
  return {
    objKcal: n.objetivoKcal, objProt: n.objetivoProteina, kcal: n.kcal, prot: n.proteina,
    gramos: Math.round(lect.items.reduce((a, i) => a + i.gramos, 0)),
    proteicoMax, protCorta: n.proteina < n.objetivoProteina * 0.95 ? Math.round(n.objetivoProteina - n.proteina) : 0,
    anadidos: anadidos.join('+'), extrasG, gAnadido: Math.round(gAnadido), kAnadido: Math.round(kAnadido), ampliados: ampliados.join('+'),
    minimos: limitados.filter((x) => x.tipo === 'minimo').map((x) => x.clave).join('+'),
    maximos: limitados.filter((x) => x.tipo === 'maximo').map((x) => x.clave).join('+'),
    libre: lect.libre,
  };
}

const ctx3714 = contexto('omni-3714');
const ctx1434 = contexto('omni-1434');
log('## 3 y 4. Raciones con ajustarDia (src/plan/racionesApp.js)\n');
log(`Contexto fijo: miércoles de la semana ${SEMANA_INICIAL} del perfil del banco (userId banco-<perfil>, motor ${ctx3714.motor}/${ctx1434.motor}); se sustituye la comida o la cena por cada plato y se lee ese hueco. Objetivos del hueco leídos de meal.nutricion.objetivoKcal/objetivoProteina.\n`);

const filas = [];
for (const d of dishes) for (const m of MOMENTOS) if (d.momento.includes(m)) {
  const base = ref.get(d.id);
  if (!base) continue;
  let a, b;
  try { a = racionar(ctx3714, d, m); b = racionar(ctx1434, d, m); } catch { continue; }
  if (a && b) filas.push({ id: d.id, nombre: d.nombre, momento: m, familia: base.familia, estructura: base.estructura, tmpl: base.tmpl, perfiles: base.perfiles, a, b });
}
const csv = [['id', 'nombre', 'momento', 'familia', 'estructura', 'plantilla', 'perfiles', 'kcalRef', 'protRef', 'gramosRef', 'protPor100kcal', 'kcalPorGramo', 'tercilProt', 'tercilDens', 'lecturaIncompleta',
  '3714_objKcal', '3714_kcal', '3714_objProt', '3714_prot', '3714_gramos', '3714_proteicoEnMax', '3714_protCorta_g', '3714_anadidos', '3714_gAnadido', '3714_kcalAnadido', '3714_ampliados', '3714_enMinimo', '3714_enMaximo',
  '1434_objKcal', '1434_kcal', '1434_objProt', '1434_prot', '1434_gramos', '1434_anadidos', '1434_gAnadido', '1434_enMinimo', '1434_enMaximo'].join(';')];
for (const f of filas) {
  const r = ref.get(f.id);
  csv.push([f.id.replace(/;/g, ','), f.nombre, f.momento, f.familia, f.estructura, f.tmpl, f.perfiles, r.kcal, r.prot, r.gramos, f2(r.p100), f2(r.dens), r.tP, r.tD, r.lecturaIncompleta ? 1 : 0,
    f.a.objKcal, f.a.kcal, f.a.objProt, f.a.prot, f.a.gramos, f.a.proteicoMax.join('+'), f.a.protCorta, f.a.anadidos, f.a.gAnadido, f.a.kAnadido, f.a.ampliados, f.a.minimos, f.a.maximos,
    f.b.objKcal, f.b.kcal, f.b.objProt, f.b.prot, f.b.gramos, f.b.anadidos, f.b.gAnadido, f.b.minimos, f.b.maximos].join(';'));
}
fs.writeFileSync(path.join(salida, 'platos.csv'), csv.join('\n'));
fs.writeFileSync(path.join(salida, 'platos.json'), JSON.stringify({ ref: R2, filas, cutP, cutD }, null, 1));
log(`Platos × momento racionados: ${filas.length} (comida ${filas.filter((f) => f.momento === 'comida').length}, cena ${filas.filter((f) => f.momento === 'cena').length}). CSV por plato: ${path.relative(process.cwd(), path.join(salida, 'platos.csv')).replace(/\\/g, '/')}\n`);

// 3
log('### 3. A 3714 kcal (omni-3714): proteína que topa y lo que se añade\n');
{
  const obj = (m) => { const x = filas.find((f) => f.momento === m); return x ? `${x.a.objKcal} kcal y ${x.a.objProt} g de proteína` : '—'; };
  log(`Objetivo del hueco: comida ${obj('comida')}; cena ${obj('cena')}.`);
  log('Definiciones: «topa» = algún ingrediente proteico queda en su máximo (límite que registra el log de raciones). «Proteína corta» = proteína final < 95 % del objetivo de proteína de esa comida (el 5 % es FALTA_PARA_ACOMPANAR del motor). «Extra» = acompañamiento añadido por el motor (pan, pan sin gluten, fruta, nuez); «ampliado» = el motor agranda un ingrediente que el plato ya tenía de esa familia en vez de añadir.\n');
  const resumen = [];
  for (const m of MOMENTOS) {
    const xs = filas.filter((f) => f.momento === m);
    const topa = xs.filter((f) => f.a.proteicoMax.length);
    const corta = xs.filter((f) => f.a.protCorta > 0);
    const conExtra = xs.filter((f) => f.a.anadidos);
    const conAmp = xs.filter((f) => f.a.ampliados);
    resumen.push([m, xs.length, topa.length, corta.length, conExtra.length, conAmp.length, f1(mediana(conExtra.map((f) => f.a.gAnadido))), `${Math.min(...conExtra.map((f) => f.a.gAnadido))}–${Math.max(...conExtra.map((f) => f.a.gAnadido))}`, f1(mediana(conExtra.map((f) => f.a.kAnadido)))]);
  }
  log(tabla(['Momento', 'Platos', 'Proteico en máximo', 'Proteína corta (<95 %)', 'Con extra añadido', 'Con ingrediente ampliado', 'g de extra (mediana)', 'g de extra mín–máx', 'kcal de extra (mediana)'], resumen) + '\n');
  log('Por familia y momento (proteico en máximo / proteína corta / con extra · de total de platos):\n');
  const fams = [...new Set(filas.map((f) => f.familia))].sort();
  log(tabla(['Familia', ...MOMENTOS.map((m) => `${m}: topa · corta · extra / total`), 'Pan o extra: g medianos (comida · cena)'], fams.map((fa) => {
    const c = MOMENTOS.map((m) => { const xs = filas.filter((f) => f.familia === fa && f.momento === m); return `${xs.filter((f) => f.a.proteicoMax.length).length} · ${xs.filter((f) => f.a.protCorta > 0).length} · ${xs.filter((f) => f.a.anadidos).length} / ${xs.length}`; });
    const g = MOMENTOS.map((m) => f1(mediana(filas.filter((f) => f.familia === fa && f.momento === m && f.a.anadidos).map((f) => f.a.gAnadido))));
    return [fa, ...c, g.join(' · ')];
  })) + '\n');
  log('Por estructura y momento (mismas tres cifras):\n');
  log(tabla(['Estructura', ...MOMENTOS.map((m) => `${m}: topa · corta · extra / total`)], ESTRUCTURAS.map((e) => [e, ...MOMENTOS.map((m) => { const xs = filas.filter((f) => f.estructura === e && f.momento === m); return `${xs.filter((f) => f.a.proteicoMax.length).length} · ${xs.filter((f) => f.a.protCorta > 0).length} · ${xs.filter((f) => f.a.anadidos).length} / ${xs.length}`; })])) + '\n');
  const topaYCorta = filas.filter((f) => f.a.proteicoMax.length && f.a.protCorta > 0);
  const cortaSinTopa = filas.filter((f) => !f.a.proteicoMax.length && f.a.protCorta > 0);
  log(tabla(['Momento', 'Proteína corta (total)', 'de ellos, con proteico en máximo («topa»)', 'de ellos, sin ingrediente proteico en máximo'], MOMENTOS.map((m) => [m, filas.filter((f) => f.momento === m && f.a.protCorta > 0).length, topaYCorta.filter((f) => f.momento === m).length, cortaSinTopa.filter((f) => f.momento === m).length])) + '\n');
  log('Los «cortos sin topar» son platos cuya proteína no la da un ingrediente que el motor trate como proteico (p. ej. legumbre como plato único): no hay nada que ampliar en la proteína. Familias de esos platos: ' + Object.entries(cortaSinTopa.reduce((o, f) => { o[f.familia] = (o[f.familia] || 0) + 1; return o; }, {})).map(([k, v]) => `${k}=${v}`).join(', ') + '.\n');
  log('Pan y fruta por separado (platos×momento a 3714 kcal; el motor los añade solo si el plato, con todo en su máximo, queda >5 % por debajo de su objetivo de kcal):\n');
  {
    const filasExtra = [];
    for (const m of MOMENTOS) for (const c of ['pan_integral', 'pan_sin_gluten', 'fruta', 'nuez']) {
      const xs = filas.filter((f) => f.momento === m && f.a.extrasG[c]);
      if (!xs.length) continue;
      const gs = xs.map((f) => f.a.extrasG[c]);
      filasExtra.push([m, c, xs.length, f1(mediana(gs)), `${Math.min(...gs)}–${Math.max(...gs)}`, f1(mediana(gs.map((g) => kcalDe(c, g))))]);
    }
    log(tabla(['Momento', 'Extra', 'Platos', 'g (mediana)', 'g mín–máx', 'kcal (mediana)'], filasExtra) + '\n');
    log('Extras (pan + fruta) por plato×momento: total de platos con algún extra y kcal medianas del conjunto de extras:\n');
    log(tabla(['Momento', 'Con algún extra', 'kcal de extras (mediana)', 'kcal de extras mín–máx', '% del objetivo de kcal de la comida (mediana)'], MOMENTOS.map((m) => { const xs = filas.filter((f) => f.momento === m && f.a.anadidos); return [m, xs.length, f1(mediana(xs.map((f) => f.a.kAnadido))), `${Math.min(...xs.map((f) => f.a.kAnadido))}–${Math.max(...xs.map((f) => f.a.kAnadido))}`, f1(mediana(xs.map((f) => (100 * f.a.kAnadido) / f.a.objKcal)))]; })) + '\n');
  }
  const peores = topaYCorta.sort((x, y) => y.a.protCorta - x.a.protCorta);
  log(`Platos donde la proteína topa Y queda corta (${peores.length}); los 25 con más déficit, a 3714 kcal:\n`);
  log(tabla(['Plato', 'Momento', 'Familia', 'Estructura', 'Obj. prot (g)', 'Prot final (g)', 'Déficit (g)', 'Proteico en máx.', 'Extra (g)', 'kcal extra', 'kcal final / obj.'], peores.slice(0, 25).map((f) => [f.nombre.slice(0, 60), f.momento, f.familia, f.estructura, f.a.objProt, f.a.prot, f.a.protCorta, f.a.proteicoMax.join('+'), Object.entries(f.a.extrasG).map(([k, v]) => `${k} ${v}`).join(', ') || (f.a.ampliados ? `ampl. ${f.a.ampliados}` : '—'), f.a.kAnadido || '—', `${f.a.kcal}/${f.a.objKcal}`])) + '\n');
  const cuantos = filas.filter((f) => f.a.anadidos);
  const porExtra = {};
  for (const f of cuantos) for (const c of f.a.anadidos.split('+')) porExtra[c] = (porExtra[c] || 0) + 1;
  log('Extras añadidos a 3714 kcal (platos×momento): ' + (Object.entries(porExtra).map(([k, v]) => `${k}=${v}`).join(', ') || 'ninguno') + '.\n');
}

// 4
log('### 4. A 1434 kcal (omni-1434): gramos totales por comida\n');
{
  const obj = (m) => { const x = filas.find((f) => f.momento === m); return x ? `${x.b.objKcal} kcal y ${x.b.objProt} g de proteína` : '—'; };
  log(`Objetivo del hueco: comida ${obj('comida')}; cena ${obj('cena')}. Gramos = suma de los ingredientes releídos de la comida ya ajustada (leerComida).`);
  log('«Pequeña» = gramos totales < 80 % de la media del mismo momento (umbral de este informe). «En mínimo» = algún ingrediente ajustable queda en su mínimo (no puede bajar más).\n');
  const res = [];
  for (const m of MOMENTOS) {
    const xs = filas.filter((f) => f.momento === m);
    const med = media(xs.map((f) => f.b.gramos));
    res.push([m, xs.length, f1(med), f1(mediana(xs.map((f) => f.b.gramos))), `${Math.min(...xs.map((f) => f.b.gramos))}–${Math.max(...xs.map((f) => f.b.gramos))}`, xs.filter((f) => f.b.gramos < 0.8 * med).length, xs.filter((f) => f.b.minimos).length, f1(media(xs.map((f) => f.b.kcal - f.b.objKcal)))]);
  }
  log(tabla(['Momento', 'Platos', 'Media g', 'Mediana g', 'Mín–máx g', 'Pequeños (<80 % de la media)', 'Con ingrediente en mínimo', 'Desvío medio kcal vs objetivo'], res) + '\n');
  log('Por familia: gramos medios (comida · cena) y nº de platos pequeños / total:\n');
  const fams = [...new Set(filas.map((f) => f.familia))].sort();
  const medM = Object.fromEntries(MOMENTOS.map((m) => [m, media(filas.filter((f) => f.momento === m).map((f) => f.b.gramos))]));
  log(tabla(['Familia', 'g medios comida', 'g medios cena', 'Pequeños comida / total', 'Pequeños cena / total'], fams.map((fa) => [fa, ...MOMENTOS.map((m) => f1(media(filas.filter((f) => f.familia === fa && f.momento === m).map((f) => f.b.gramos)))), ...MOMENTOS.map((m) => { const xs = filas.filter((f) => f.familia === fa && f.momento === m); return `${xs.filter((f) => f.b.gramos < 0.8 * medM[m]).length} / ${xs.length}`; })])) + '\n');
  log('Por estructura:\n');
  log(tabla(['Estructura', 'g medios comida', 'g medios cena', 'Pequeños comida / total', 'Pequeños cena / total'], ESTRUCTURAS.map((e) => [e, ...MOMENTOS.map((m) => f1(media(filas.filter((f) => f.estructura === e && f.momento === m).map((f) => f.b.gramos)))), ...MOMENTOS.map((m) => { const xs = filas.filter((f) => f.estructura === e && f.momento === m); return `${xs.filter((f) => f.b.gramos < 0.8 * medM[m]).length} / ${xs.length}`; })])) + '\n');
  for (const m of MOMENTOS) {
    const xs = filas.filter((f) => f.momento === m).sort((x, y) => x.b.gramos - y.b.gramos).slice(0, 20);
    log(`Los 20 platos con menos gramos en ${m} a 1434 kcal (media del momento ${f1(medM[m])} g):\n`);
    log(tabla(['Plato', 'Familia', 'Estructura', 'Gramos', '% de la media', 'kcal final / obj.', 'Prot final / obj.', 'En mínimo', 'Extra'], xs.map((f) => [f.nombre.slice(0, 60), f.familia, f.estructura, f.b.gramos, `${Math.round((100 * f.b.gramos) / medM[m])} %`, `${f.b.kcal}/${f.b.objKcal}`, `${f.b.prot}/${f.b.objProt}`, f.b.minimos || '—', f.b.anadidos || '—'])) + '\n');
  }
}
