// Resumen de la medición del prototipo de tiempo de cocina y experiencia (medirReglaTiempo.mjs). No cambia reglas.
// Lee los JSON <perfil>__<tiempoCocina>__<experiencia>.json de una carpeta y escribe el informe en Markdown.
// Uso: node scripts/banco/medicion/resumenReglaTiempo.mjs <carpeta con los json> <informe.md>
import fs from 'node:fs';
import path from 'node:path';

const [carpeta, salida] = process.argv.slice(2);
const COMBOS = [['poco', 'novato'], ['poco', 'intermedio'], ['normal', 'novato'], ['normal', 'intermedio']];
const CONTROL = 'normal+intermedio';
const etiqueta = (t, x) => `${t}+${x}`;
const n1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace('.', ',') : '—');
const n2 = (x) => (Number.isFinite(x) ? x.toFixed(2).replace('.', ',') : '—');
const pct = (a, b) => (b ? `${n1((100 * a) / b)} %` : '—');
const dif = (x, c, dec = 2) => {
  if (!Number.isFinite(x) || !Number.isFinite(c)) return '—';
  const d = x - c;
  const s = (dec === 1 ? n1 : n2)(Math.abs(d));
  return d === 0 ? '=' : `${d > 0 ? '+' : '−'}${s}`;
};

// ─── Carga ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const datos = new Map(); // perfil → combo → json
for (const f of fs.readdirSync(carpeta).filter((x) => x.endsWith('.json') && x.includes('__'))) {
  const j = JSON.parse(fs.readFileSync(path.join(carpeta, f), 'utf8'));
  const c = etiqueta(j.tiempoCocina, j.experiencia);
  if (!datos.has(j.perfil)) datos.set(j.perfil, {});
  datos.get(j.perfil)[c] = j;
}
const perfiles = [...datos.keys()].sort();
for (const p of perfiles) for (const [t, x] of COMBOS) if (!datos.get(p)[etiqueta(t, x)]) throw new Error(`falta ${p} ${t}+${x}`);
const dietaDe = (p) => datos.get(p)[CONTROL].dieta;
const DIETAS = ['omnivora', 'vegetariana', 'vegana'].filter((d) => perfiles.some((p) => dietaDe(p) === d));
const NOMBRE_DIETA = { omnivora: 'omnívora', vegetariana: 'vegetariana', vegana: 'vegana' };

// ─── Métricas de un conjunto de semanas ─────────────────────────────────────────────────────────────────────────────
function metricas(semanas) {
  const N = semanas.length;
  const sum = (f) => semanas.reduce((a, s) => a + f(s), 0);
  const servidos = semanas.flatMap((s) => s.servidos);
  const veces = new Map(); for (const id of servidos) veces.set(id, (veces.get(id) || 0) + 1);
  const top10 = [...veces.values()].sort((a, b) => b - a).slice(0, 10).reduce((a, x) => a + x, 0);
  const especiesSem = sum((s) => Object.keys(s.especies).length) / N;
  const maxEspecie = sum((s) => Math.max(0, ...Object.values(s.especies))) / N;
  const huecos = sum((s) => s.red + s.filtros);
  return {
    N,
    red: sum((s) => s.red), huecos, semanasRed: semanas.filter((s) => s.red > 0).length,
    redSem: sum((s) => s.red) / N,
    lvCumplen: sum((s) => s.lvCumplen), lvServidos: sum((s) => s.lvServidos), lvAncla: sum((s) => s.lvAncla),
    distintos: veces.size, servidos: servidos.length, top10,
    repetido: sum((s) => s.d099.repetido), anterior: sum((s) => s.d099.anterior), masDeDos: sum((s) => s.d099.masDeDos),
    mismoDia: sum((s) => s.d099.mismoDia), seguidos: sum((s) => s.d099.seguidos),
    especiesSem, maxEspecie,
    pescado: sum((s) => s.pescado) / N, pescadoHorno: sum((s) => s.pescadoHorno) / N, legumbre: sum((s) => s.legumbre) / N,
    cortas: sum((s) => s.cortas) / N, protDia: sum((s) => s.protDia) / N, kcalDia: sum((s) => s.kcalDia) / N,
    fueraKcal: sum((s) => s.fueraKcal), principales: sum((s) => s.principales),
  };
}
const de = (p, c) => metricas(datos.get(p)[c].semanas);
// Por dieta: se juntan las semanas de sus perfiles (cada perfil pesa igual: 200 semanas cada uno).
const deDieta = (d, c) => metricas(perfiles.filter((p) => dietaDe(p) === d).flatMap((p) => datos.get(p)[c].semanas));

// ─── Informe ────────────────────────────────────────────────────────────────────────────────────────────────────────
const L = [];
const semanasPor = datos.get(perfiles[0])[CONTROL].semanas.length;
L.push('# Prototipo: tiempo de cocina y experiencia en comidas y cenas entre semana (medición)', '');
L.push(`Generado por \`scripts/banco/medicion/resumenReglaTiempo.mjs\`. ${perfiles.length} perfiles × ${semanasPor} semanas (60 a ${59 + semanasPor}) × 4 combinaciones de tiempo de cocina y experiencia.`, '');
L.push('## Regla medida', '');
L.push('- **Poco tiempo:** de lunes a viernes, en comida y cena, solo platos con `tramo_poco_tiempo = sí`. **Novato:** solo platos fáciles. Las dos a la vez: las dos condiciones.');
L.push('- Fin de semana sin filtro. Las opciones normal, mucho, intermedio y avanzado, sin filtro. Sin pesos.');
L.push('- El filtro va **después** de las demás reglas del hueco (no repetir plato, guarnición, cremas, tope de proteína y de pescado, separación por proteína y por familia, huevo, aliño) y **antes** de las preferencias A y B, las frecuencias y la identidad de verdura.');
L.push('- **Red:** si el filtro deja el hueco sin candidatos, ese hueco se queda sin el filtro y se cuenta.');
L.push('- Valores de cada plato: columnas «Vigente» de la hoja de tiempo y dificultad (PR #34, commit `1d04de5`), copiadas en `regla-tiempo-dificultad/vigente.csv`. 230 de 288 platos tienen `tramo_poco_tiempo = sí`; 185 son fáciles; 171 cumplen las dos cosas.');
L.push('- Prototipo en memoria (`reglaTiempoDificultad.mjs`), sin tocar `src/`. El capricho entre semana se filtra igual. El ancla de «cocinar en cantidad» no se filtra (se cuenta aparte). La sugerencia de la comida libre no se filtra.');
L.push('- Control: normal+intermedio (sin filtro). Con «poco», la app ya elige desayunos rápidos (`desayunosApp.js`): eso también entra en la proteína y la energía del día.', '');

// 1. Red
L.push('## 1. Cuántas veces actúa la red', '');
L.push('Huecos filtrados = comidas y cenas de lunes a viernes por las que pasa el filtro (sin ancla ni sugerencia). «Cumplen» = platos servidos de lunes a viernes que cumplen la condición, contando los de la red y los del ancla.', '');
L.push('| Dieta | Combinación | Huecos filtrados | Red (huecos) | Red por hueco | Red por semana | Semanas con red | Servidos L-V que cumplen |', '|---|---|---|---|---|---|---|---|');
for (const d of DIETAS) for (const [t, x] of COMBOS.slice(0, 3)) {
  const m = deDieta(d, etiqueta(t, x));
  L.push(`| ${NOMBRE_DIETA[d]} | ${t}+${x} | ${m.huecos} | ${m.red} | ${pct(m.red, m.huecos)} | ${n2(m.redSem)} | ${m.semanasRed} de ${m.N} | ${pct(m.lvCumplen, m.lvServidos)} |`);
}
L.push('', 'Por perfil (poco+novato):', '');
L.push('| Perfil | Dieta | Red por hueco | Red por semana | Semanas con red | Servidos L-V que cumplen | Huecos L-V del ancla (sin filtro) | Dónde actúa la red (top 3) |', '|---|---|---|---|---|---|---|---|');
for (const p of perfiles) {
  const j = datos.get(p)['poco+novato'];
  const m = metricas(j.semanas);
  const donde = new Map(); for (const s of j.semanas) for (const h of s.redPor) donde.set(h, (donde.get(h) || 0) + 1);
  const top = [...donde].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h, n]) => `${h} ${n}`).join(' · ') || '—';
  L.push(`| ${p} | ${NOMBRE_DIETA[j.dieta]} | ${pct(m.red, m.huecos)} | ${n2(m.redSem)} | ${m.semanasRed} | ${pct(m.lvCumplen, m.lvServidos)} | ${m.lvAncla} | ${top} |`);
}
L.push('');

// 2. Repetición
L.push('## 2. Repetición de platos y especies frente al control', '');
L.push(`Platos distintos servidos en las ${semanasPor} semanas de cada perfil (media por perfil), parte de los servidos que se llevan los 10 platos más frecuentes, infracciones de D-099.3 (suma) y especies por semana.`, '');
L.push('| Dieta | Combinación | Platos distintos/perfil | Top 10 platos | Repetido en la semana | De la semana anterior | Especie >2 veces | Especie mismo día | Especie días seguidos | Especies distintas/sem | Especie más repetida/sem |', '|---|---|---|---|---|---|---|---|---|---|---|');
for (const d of DIETAS) {
  const ps = perfiles.filter((p) => dietaDe(p) === d);
  for (const [t, x] of COMBOS) {
    const c = etiqueta(t, x);
    const ms = ps.map((p) => de(p, c));
    const m = deDieta(d, c);
    const distintos = ms.reduce((a, q) => a + q.distintos, 0) / ms.length;
    const top10 = ms.reduce((a, q) => a + q.top10 / q.servidos, 0) / ms.length;
    L.push(`| ${NOMBRE_DIETA[d]} | ${c}${c === CONTROL ? ' (control)' : ''} | ${n1(distintos)} | ${n1(100 * top10)} % | ${m.repetido} | ${m.anterior} | ${m.masDeDos} | ${m.mismoDia} | ${m.seguidos} | ${n2(m.especiesSem)} | ${n2(m.maxEspecie)} |`);
  }
}
L.push('');

// 3. Pescado y legumbre
L.push('## 3. Pescado y legumbre por semana frente al control', '');
L.push('«Al horno»: platos de pescado o marisco cuya cocción es horno (plantilla) o airfryer u horno (texto libre). Legumbre = platos de legumbre + guarniciones de legumbre.', '');
L.push('| Dieta | Combinación | Pescado/sem | Δ control | De ellos al horno/sem | % al horno | Legumbre/sem | Δ control |', '|---|---|---|---|---|---|---|---|');
for (const d of DIETAS) {
  const c0 = deDieta(d, CONTROL);
  for (const [t, x] of COMBOS) {
    const m = deDieta(d, etiqueta(t, x));
    L.push(`| ${NOMBRE_DIETA[d]} | ${etiqueta(t, x)} | ${n2(m.pescado)} | ${dif(m.pescado, c0.pescado)} | ${n2(m.pescadoHorno)} | ${pct(m.pescadoHorno, m.pescado)} | ${n2(m.legumbre)} | ${dif(m.legumbre, c0.legumbre)} |`);
  }
}
L.push('');

// 4. Proteína y energía
L.push('## 4. Proteína corta y energía frente al control', '');
L.push('Cortas = comidas y cenas servidas por debajo del 95 % de su objetivo de proteína. Proteína y kcal del día, en % del objetivo (días sin sugerencia). Fuera de ±5 % = comidas y cenas con las kcal fuera de ±5 % de su objetivo.', '');
L.push('| Dieta | Combinación | Cortas/sem | Δ control | Proteína del día | Δ control | Kcal del día | Δ control | Fuera de ±5 % kcal |', '|---|---|---|---|---|---|---|---|---|');
for (const d of DIETAS) {
  const c0 = deDieta(d, CONTROL);
  for (const [t, x] of COMBOS) {
    const m = deDieta(d, etiqueta(t, x));
    L.push(`| ${NOMBRE_DIETA[d]} | ${etiqueta(t, x)} | ${n2(m.cortas)} | ${dif(m.cortas, c0.cortas)} | ${n1(m.protDia)} % | ${dif(m.protDia, c0.protDia, 1)} | ${n1(m.kcalDia)} % | ${dif(m.kcalDia, c0.kcalDia, 1)} | ${pct(m.fueraKcal, m.principales)} |`);
  }
}
L.push('', 'Por perfil, poco+novato frente al control:', '');
L.push('| Perfil | Pescado/sem (control) | Al horno/sem (control) | Legumbre/sem (control) | Cortas/sem (control) | Proteína del día (control) | Platos distintos (control) |', '|---|---|---|---|---|---|---|');
for (const p of perfiles) {
  const m = de(p, 'poco+novato'); const c0 = de(p, CONTROL);
  L.push(`| ${p} | ${n2(m.pescado)} (${n2(c0.pescado)}) | ${n2(m.pescadoHorno)} (${n2(c0.pescadoHorno)}) | ${n2(m.legumbre)} (${n2(c0.legumbre)}) | ${n2(m.cortas)} (${n2(c0.cortas)}) | ${n1(m.protDia)} % (${n1(c0.protDia)} %) | ${m.distintos} (${c0.distintos}) |`);
}
L.push('');

// 5. Ejemplos
L.push('## 5. Tres semanas de ejemplo de poco+novato', '');
L.push('Marca: filtro = el hueco pasó el filtro; red = el filtro lo dejaba sin candidatos y va sin él; fijo = lo colocó el ancla o el capricho; sin marca = fin de semana (sin filtro).', '');
const NOMBRE_DIA = { Miercoles: 'Miércoles', Sabado: 'Sábado' };
for (const [p, titulo] of [['omni-2174', 'Omnívora (omni-2174)'], ['vegana-1400', 'Vegana (vegana-1400)']]) {
  if (!datos.has(p)) continue;
  const j = datos.get(p)['poco+novato'];
  for (const s of j.semanas.slice(0, 3)) {
    L.push(`### ${titulo}, semana ${s.s}`, '');
    L.push('| Día | Comida | Cena |', '|---|---|---|');
    const celda = (x) => (x ? `${x.titulo}${x.como ? ` *(${x.como})*` : ''}` : '—');
    for (const f of s.menu) L.push(`| ${NOMBRE_DIA[f.dia] || f.dia} | ${celda(f.comida)} | ${celda(f.cena)} |`);
    L.push('');
  }
}
fs.writeFileSync(salida, `${L.join('\n')}\n`);
console.log(`${salida}: ${perfiles.length} perfiles`);
