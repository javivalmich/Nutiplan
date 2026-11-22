// Prototipo: legumbre de bote como guarnición. MEDICIÓN, no producto (Javi, 2026-11-22 y 2026-11-23). Hook de carga
// que aplica en memoria, sin modificar ningún archivo de src/, las reglas de
// scripts/banco/medicion/inventario/hidratos-legumbre.md, con las decisiones de Javi del 2026-11-23:
//
//   - D-116 y D-117 apagadas siempre: el walk arranca por el camino de la red (sinRegla), sin sorteo ni segundos y con
//     D-024 como antes. Todo lo demás de HEAD sigue activo (tope de pescado 3, D-115, raciones, SIBO).
//   - Después del walk, cada comida o cena cuyo plato admite legumbre (hidratos-legumbre.csv, «sí») elige con la semilla,
//     sin pesos, entre su hidrato original y las legumbres de su lista que el perfil puede comer. Los huecos del ancla
//     (cocinar de más, aprovechar) y la sugerencia de la comida libre no se tocan.
//   - Legumbres de la semana, contando guarnición y platos de legumbre del walk: tope de 3; suelo de 2 (si va corta, se
//     pone legumbre en los siguientes huecos que la admitan, en orden de la semana, con causa); sin ninguna legumbre
//     posible para el perfil, el suelo no actúa, con causa.
//   - Guisantes y habitas, juntos, como mucho 1 de las legumbres de la semana. En la cena, como mucho 1.
//   - Preferencia por no repetir la misma legumbre en la semana, con vuelta atrás y causa.
//   - Ingredientes nuevos (en memoria): alubias blancas de bote (BEDCA 898), alubias rojas y pintas de bote
//     (aproximación: la nutrición de la alubia negra hervida, BEDCA 900) y habitas (BEDCA 2194). Lentejas pardina y
//     beluga leen como lentejas_cocidas; alubias negras, como alubias_cocidas (BEDCA 900).
//   - Ración de la guarnición: 80 a 240 g escurridos, de 10 en 10 (ver guarnicion-legumbre.md).
//
// Seguridad (seguridad-legumbres.md): la lista de cada plato se filtra por perfil, cerrando en el prototipo los huecos
// de los filtros de hoy: intolerancia a legumbres o SIBO, ninguna legumbre; soja, sin edamame; alimentos eliminados
// por sinónimos (alubia, judía, frijol, haba, legumbre, soja…), no solo por la palabra exacta; y alergenosDeTexto del
// texto de la legumbre contra las intolerancias del perfil.
//
// Uso (desde la raíz del repo, con el árbol de HEAD):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesGuarnicion.mjs \
//     scripts/banco/medicion/cortasProteina.mjs <raíz> <salida.json> <perfil> [semanas] [--sinSuelo]
// Con --sinSuelo: la variante sin suelo (solo el tope de 3 y las demás reglas).
import fs from 'node:fs';
import { register } from 'node:module';

const RAIZ = new URL('../../../', import.meta.url);
const SIN_SUELO = process.argv.includes('--sinSuelo');
process.stderr.write(`[variantesGuarnicion] legumbre como guarnición; D-116 y D-117 apagadas; ${SIN_SUELO ? 'sin suelo' : 'suelo de 2'}\n`);

// ─── Inventario (hidratos-legumbre.csv) ─────────────────────────────────────────────────────────────────────────────
function leerCsv(texto) {
  const filas = []; let fila = []; let campo = ''; let comillas = false;
  const t = texto.replace(/^﻿/, '');
  for (let k = 0; k < t.length; k++) {
    const ch = t[k];
    if (comillas) {
      if (ch === '"' && t[k + 1] === '"') { campo += '"'; k++; } else if (ch === '"') comillas = false; else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === ';') { fila.push(campo); campo = ''; } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[k + 1] === '\n') k++;
      fila.push(campo); campo = ''; if (fila.length > 1 || fila[0]) filas.push(fila); fila = [];
    } else campo += ch;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const [cab, ...resto] = filas;
  return resto.map((f) => Object.fromEntries(cab.map((c, k) => [c, f[k]])));
}
const INVENTARIO = new Map(leerCsv(fs.readFileSync(new URL('scripts/banco/medicion/inventario/hidratos-legumbre.csv', RAIZ), 'utf8'))
  .filter((f) => f.origen === 'plantilla' && f.admite_legumbre === 'sí')
  .map((f) => [f.id, f.legumbres_validas.split(',').map((x) => x.trim()).filter(Boolean)]));

// ─── Legumbres ──────────────────────────────────────────────────────────────────────────────────────────────────────
// nombre: cómo va en el título; compra: el texto de la compra (lo lee leerComida); pron: pronombre de la receta.
export const LEG = {
  garbanzos: { nombre: 'garbanzos', compra: 'Garbanzos cocidos', el: 'los garbanzos', g: 'm', pron: 'los', clave: 'garbanzos_cocidos', sin: ['garbanzo'] },
  'alubias blancas': { nombre: 'alubias blancas', compra: 'Alubias blancas cocidas', el: 'las alubias blancas', g: 'f', pron: 'las', clave: 'alubias_blancas_cocidas', sin: ['alubia', 'judia', 'frijol', 'fabe'] },
  'alubias rojas': { nombre: 'alubias rojas', compra: 'Alubias rojas cocidas', el: 'las alubias rojas', g: 'f', pron: 'las', clave: 'alubias_rojas_cocidas', sin: ['alubia', 'judia', 'frijol', 'fabe'] },
  'alubias pintas': { nombre: 'alubias pintas', compra: 'Alubias pintas cocidas', el: 'las alubias pintas', g: 'f', pron: 'las', clave: 'alubias_pintas_cocidas', sin: ['alubia', 'judia', 'frijol', 'fabe'] },
  'alubias negras': { nombre: 'alubias negras', compra: 'Alubias negras cocidas', el: 'las alubias negras', g: 'f', pron: 'las', clave: 'alubias_cocidas', sin: ['alubia', 'judia', 'frijol', 'fabe'] },
  'lentejas pardinas': { nombre: 'lentejas pardinas', compra: 'Lentejas pardinas cocidas', el: 'las lentejas pardinas', g: 'f', pron: 'las', clave: 'lentejas_cocidas', sin: ['lenteja'] },
  'lentejas beluga': { nombre: 'lentejas beluga', compra: 'Lentejas beluga cocidas', el: 'las lentejas beluga', g: 'f', pron: 'las', clave: 'lentejas_cocidas', sin: ['lenteja'] },
  habitas: { nombre: 'habitas', compra: 'Habitas', el: 'las habitas', g: 'f', pron: 'las', clave: 'habitas', sin: ['haba', 'habita'] },
  guisantes: { nombre: 'guisantes', compra: 'Guisantes', el: 'los guisantes', g: 'm', pron: 'los', clave: 'guisantes', sin: ['guisante', 'arveja', 'chicharo'] },
  edamame: { nombre: 'edamame', compra: 'Edamame', el: 'el edamame', g: 'm', pron: 'lo', clave: 'edamame', sin: ['edamame', 'soja'] },
};
const VERDES = new Set(['guisantes', 'habitas']);
export const RANGO_GUARNICION = [80, 240, 10];
const BASE_GUARNICION = 150;
const claveH = (leg, frio) => `g_${leg.replace(/ /g, '_')}${frio ? '_frio' : ''}`;

// Entradas de la tabla HIDRATOS de compuestos.js (una caliente y otra fría por legumbre).
const hidratosNuevos = [];
for (const [id, l] of Object.entries(LEG)) {
  const base = { compra: l.compra, el: l.el, g: l.g, base: BASE_GUARNICION, clave: l.clave };
  hidratosNuevos.push(`  ${claveH(id, false)}: ${JSON.stringify({ ...base,
    receta: `Escurre y enjuaga ${l.el} de bote; caliénta${l.pron} 2-3 min en una sartén con un poco del aceite y sal.`,
    recetaHorno: `Escurre y enjuaga ${l.el} de bote, séca${l.pron}, alíña${l.pron} con un poco del aceite y sal y ása${l.pron} en la misma bandeja los últimos 15 min.` })},`);
  hidratosNuevos.push(`  ${claveH(id, true)}: ${JSON.stringify({ ...base, receta: `Escurre y enjuaga ${l.el} de bote.` })},`);
}

// ─── Seguridad: legumbres que el perfil puede comer ─────────────────────────────────────────────────────────────────
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
function legumbresDelPerfil(profile, alergenosDeTexto) {
  const intol = new Set(profile.intolerances || []);
  const eliminados = (profile.eliminatedFoods || []).map(norm).filter(Boolean);
  const out = new Map();
  for (const [id, l] of Object.entries(LEG)) {
    let motivo = null;
    if (intol.has('legumbres')) motivo = 'intolerancia a legumbres';
    else if (intol.has('sibo')) motivo = 'SIBO';
    else if (intol.has('soja') && id === 'edamame') motivo = 'intolerancia a la soja';
    else {
      const al = [...alergenosDeTexto(l.compra)].filter((a) => intol.has(a));
      if (al.length) motivo = `intolerancia: ${al.join(', ')}`;
    }
    if (!motivo) {
      const texto = norm(`${l.compra} ${l.nombre}`);
      const e = eliminados.find((x) => texto.includes(x) || x.includes('legumbre') || l.sin.some((s) => x.includes(s)));
      if (e) motivo = `alimento eliminado: «${e}»`;
    }
    out.set(id, motivo);
  }
  return out;
}

// ─── RNG sembrado (sin pesos: elección uniforme entre las opciones válidas) ─────────────────────────────────────────
function rngDe(semilla) {
  let h = 2166136261;
  for (const ch of semilla) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const PALABRA_H = { arroz: /arroz( blanco| integral)?/i, patata: /patatas?/i, boniato: /boniato/i, quinoa: /quinoa/i };
function nombreCon(nombre, hidrato, legumbre) {
  const re = PALABRA_H[hidrato];
  if (!re) return `${nombre} con ${legumbre}`;
  const m = [...nombre.matchAll(new RegExp(re.source, 'gi'))].pop();
  return m ? `${nombre.slice(0, m.index)}${legumbre}${nombre.slice(m.index + m[0].length)}` : `${nombre} con ${legumbre}`;
}

// Plato de legumbre del walk → qué legumbre cuenta como usada (para no repetir).
const USADA_POR_ESPECIE = { garbanzos: ['garbanzos'], lentejas: ['lentejas pardinas', 'lentejas beluga'], alubias: ['alubias blancas'], alubias_negras: ['alubias negras'] };

globalThis.__guarn = {
  RANGO: RANGO_GUARNICION,
  /** Elige la guarnición de cada hueco de la semana y anota las causas en el log de engine2. */
  asignar(e2, { profile, seed, bases, alergenosDeTexto, tuplaDe }) {
    const log = e2.decisionLog;
    const anota = (day, momento, causa, evidencia, extra = {}) => log.push({ decisionId: `guarnicion-${log.length}`, day, momentoGuarnicion: momento, causa, evidencia, evento: true, ...extra });
    const motivos = legumbresDelPerfil(profile, alergenosDeTexto);
    const posibles = new Set([...motivos].filter(([, m]) => !m).map(([id]) => id));
    const quitadas = [...motivos].filter(([, m]) => m);
    if (quitadas.length) anota(undefined, undefined, 'guarnicion_legumbres_quitadas_por_perfil', quitadas.map(([id, m]) => `${id} (${m})`).join('; '));
    const causaDe = new Map();
    for (const e of log) if (e.day && e.momento && e.causa) causaDe.set(`${e.day}|${e.momento}`, e.causa);

    // Huecos de la semana, en orden: comida y cena de cada día.
    const huecos = [];
    let platosLeg = 0; let enCena = 0;
    const usadas = new Set();
    for (const d of e2.days) {
      for (const momento of ['comida', 'cena']) {
        const m = d.meals.find((x) => x.momento === momento);
        if (!m || !m.dish) continue;
        if (m.libre) continue;
        const fam = bases.familiaProteica(m.dish);
        if (fam === 'legumbre') {
          platosLeg += 1; if (momento === 'cena') enCena += 1;
          for (const u of USADA_POR_ESPECIE[bases.proteinaPrincipal(m.dish)] || []) usadas.add(u);
          continue;
        }
        const lista = INVENTARIO.get(m.dish.id);
        if (!lista) continue;
        const c = causaDe.get(`${d.day}|${momento}`);
        if (c && c.startsWith('ancla_base')) continue;
        const validas = lista.filter((x) => posibles.has(x));
        if (!validas.length) continue;
        huecos.push({ d, m, momento, validas, eleccion: null });
      }
    }
    const rng = rngDe(`${seed}::guarnicion`);
    let total = platosLeg; let verdes = 0;
    const cuenta = { tope: 0, cena: 0, verdes: 0, repetidaEvitada: 0, repetidaSinAplicar: 0, suelo: 0 };
    const validasAhora = (h) => {
      if (total >= 3) return { lista: [], por: 'tope' };
      if (h.momento === 'cena' && enCena >= 1) return { lista: [], por: 'cena' };
      let lista = h.validas;
      if (verdes >= 1) { const sin = lista.filter((x) => !VERDES.has(x)); if (sin.length < lista.length) { cuenta.verdes += 1; anota(h.d.day, h.momento, 'guarnicion_guisantes_habitas', 'guisantes y habitas ya salen 1 vez esta semana: fuera de las opciones'); } lista = sin; }
      if (!lista.length) return { lista, por: 'verdes' };
      const nuevas = lista.filter((x) => !usadas.has(x));
      if (nuevas.length && nuevas.length < lista.length) { cuenta.repetidaEvitada += 1; anota(h.d.day, h.momento, 'guarnicion_legumbre_no_repetida', `fuera ${lista.filter((x) => usadas.has(x)).join(', ')}: ya salen esta semana`); lista = nuevas; }
      else if (!nuevas.length) { cuenta.repetidaSinAplicar += 1; anota(h.d.day, h.momento, 'guarnicion_legumbre_no_repetida_sin_aplicar', 'todas las legumbres de la lista ya salen esta semana; no se aplica'); }
      return { lista, por: null };
    };
    const poner = (h, leg, causa, evidencia) => {
      h.eleccion = leg; total += 1; usadas.add(leg); if (VERDES.has(leg)) verdes += 1; if (h.momento === 'cena') enCena += 1;
      anota(h.d.day, h.momento, causa, evidencia, { legumbre: leg });
    };
    // 1. Elección con la semilla entre el hidrato original y las legumbres válidas.
    for (const h of huecos) {
      const { lista, por } = validasAhora(h);
      if (por === 'tope') { cuenta.tope += 1; anota(h.d.day, h.momento, 'guarnicion_legumbre_tope', 'la semana ya lleva 3 legumbres: se queda el hidrato original'); continue; }
      if (por === 'cena') { cuenta.cena += 1; anota(h.d.day, h.momento, 'guarnicion_legumbre_cena', 'ya hay 1 legumbre en las cenas de la semana: se queda el hidrato original'); continue; }
      const opciones = ['original', ...lista];
      const k = Math.floor(rng() * opciones.length);
      if (opciones[k] === 'original') anota(h.d.day, h.momento, 'guarnicion_hidrato_original', `RNG «::guarnicion» -> índice ${k} de ${opciones.length} opciones (${opciones.join(', ')})`);
      else poner(h, opciones[k], 'guarnicion_legumbre_elegida', `RNG «::guarnicion» -> índice ${k} de ${opciones.length} opciones (${opciones.join(', ')})`);
    }
    // 2. Suelo de 2: si va corta, legumbre en los siguientes huecos que la admitan. Con --sinSuelo (variante de Javi
    // del 2026-11-23) no se aplica: solo el tope de 3 y las demás reglas.
    if (SIN_SUELO) { /* variante sin suelo */ } else if (!posibles.size) anota(undefined, undefined, 'guarnicion_suelo_sin_legumbre_posible', 'el perfil no puede comer ninguna legumbre: el suelo de 2 no actúa');
    else if (total < 2) {
      for (const h of huecos) {
        if (total >= 2) break;
        if (h.eleccion) continue;
        const { lista } = validasAhora(h);
        if (!lista.length) continue;
        const leg = lista[Math.floor(rng() * lista.length)];
        cuenta.suelo += 1;
        poner(h, leg, 'guarnicion_legumbre_suelo', `la semana iba corta (${total} de 2 legumbres): se prefiere legumbre en este hueco; RNG entre ${lista.join(', ')}`);
      }
      if (total < 2) anota(undefined, undefined, 'guarnicion_suelo_sin_hueco', `la semana se queda con ${total} legumbres: no hay más huecos que admitan una válida`);
    }
    // 3. Se cambia el plato: el mismo id (las métricas lo reconocen), la tupla con la legumbre y el nombre nuevo.
    for (const h of huecos) {
      if (!h.eleccion) continue;
      const tupla = tuplaDe(h.m.dish.id);
      const frio = tupla.tmpl === 'ensalada' || tupla.cookM === 'crudo';
      const l = LEG[h.eleccion];
      h.m.dish = { ...h.m.dish, nombre: nombreCon(h.m.dish.nombre, tupla.C, l.nombre), _nombreOriginal: h.m.dish.nombre,
        _tuplaGuarnicion: { ...tupla, C: claveH(h.eleccion, frio) }, _guarnicion: { legumbre: h.eleccion, clave: l.clave, hidratoOriginal: tupla.C } };
    }
    e2.guarnicion = { platosLeg, total, cuenta, legumbres: huecos.filter((h) => h.eleccion).map((h) => ({ day: h.d.day, momento: h.momento, legumbre: h.eleccion })) };
  },
};

// ─── Cambios en memoria de src/ ─────────────────────────────────────────────────────────────────────────────────────
const COMPOSICION_NUEVA = `  "alubias_blancas_cocidas": { "kcal": 93.1, "proteina": 6.7, "hidratos": 15.7, "grasa": 0.2, "fibra": 4.4, "agua": 72.5, "fuente": { "bedca": "898", "nombre": "Alubia blanca, en conserva" } },
  "alubias_rojas_cocidas": { "kcal": 92, "proteina": 8.4, "hidratos": 13.7, "grasa": 0.2, "fibra": 8.7, "agua": 68.9, "fuente": { "bedca": "900", "nombre": "Alubia negra, seca, remojada, hervida", "nota": "aproximación: nutrición de la alubia negra (BEDCA no tiene alubia roja)" } },
  "alubias_pintas_cocidas": { "kcal": 92, "proteina": 8.4, "hidratos": 13.7, "grasa": 0.2, "fibra": 8.7, "agua": 68.9, "fuente": { "bedca": "900", "nombre": "Alubia negra, seca, remojada, hervida", "nota": "aproximación: nutrición de la alubia negra (BEDCA solo tiene judía pinta en seco)" } },
  "habitas": { "kcal": 57.2, "proteina": 4.6, "hidratos": 8.6, "grasa": 0.4, "fibra": 4.2, "agua": 82.2, "fuente": { "bedca": "2194", "nombre": "Haba, fresca" } },
`;
const CAMBIOS = [
  ['/src/engine2/walk/runWalk.js', '    resultado = walkConRedDeFamilia(input, { sinRegla: false, intentos });', '    resultado = walkConRedDeFamilia(input, { sinRegla: true, intentos });'],
  ['/src/plan/engine2App.js', '  const log = e2.decisionLog;',
    "  globalThis.__guarn.asignar(e2, { profile, seed: `${opts.userId ?? 'anon'}:${opts.weekNumber ?? 0}`, bases: globalThis.__guarnBases, alergenosDeTexto: globalThis.__guarnAlergenos, tuplaDe: globalThis.__guarnTuplaDe });\n  const log = e2.decisionLog;"],
  ['/src/plan/engine2App.js', '      platosSemana.push(comida2.dish.nombre);', '      platosSemana.push(comida2.dish._nombreOriginal || comida2.dish.nombre);'],
  ['/src/plan/engine2App.js', '    platosSemana.push(cena2.dish.nombre);', '    platosSemana.push(cena2.dish._nombreOriginal || cena2.dish.nombre);'],
  ['/src/plan/textos/componer.js', '  const tupla = tuplaDe(dish.id);', '  const tupla = dish._tuplaGuarnicion || tuplaDe(dish.id);'],
  ['/src/plan/textos/componer.js', '      _componer: componer,', '      _componer: componer,\n      ...(dish._guarnicion ? { _guarnicion: dish._guarnicion } : {}),'],
  ['/src/plan/textos/compuestos.js', "  quinoa: { compra: 'Quinoa',", `${hidratosNuevos.join('\n')}\n  quinoa: { compra: 'Quinoa',`],
  ['/src/engine2/nutrientes/composicion.js', '  "alubias_cocidas": {', `${COMPOSICION_NUEVA}  "alubias_cocidas": {`],
  ['/src/engine2/nutrientes/ingredientes.js', "  alubias_cocidas: I('Alubias cocidas', 'legumbre', { estado: 'cocido' }),",
    "  alubias_cocidas: I('Alubias cocidas', 'legumbre', { estado: 'cocido' }),\n  alubias_blancas_cocidas: I('Alubias blancas cocidas', 'legumbre', { estado: 'cocido' }),\n  alubias_rojas_cocidas: I('Alubias rojas cocidas', 'legumbre', { estado: 'cocido' }),\n  alubias_pintas_cocidas: I('Alubias pintas cocidas', 'legumbre', { estado: 'cocido' }),\n  habitas: I('Habitas', 'legumbre'),"],
  ['/src/engine2/nutrientes/raciones.js', 'alubias_cocidas: [120, 400, 10],', 'alubias_cocidas: [120, 400, 10], alubias_blancas_cocidas: [120, 400, 10], alubias_rojas_cocidas: [120, 400, 10], alubias_pintas_cocidas: [120, 400, 10], habitas: [50, 200, 10],'],
  ['/src/engine2/nutrientes/raciones.js', '      rango = [Math.min(rango[0], tope), Math.min(rango[1], tope), rango[2]];\n    }',
    '      rango = [Math.min(rango[0], tope), Math.min(rango[1], tope), rango[2]];\n    }\n    if (rango && it.rangoPropio) rango = it.rangoPropio;'],
  ['/src/plan/medidor/leerComida.js', "  [/alubias negras cocidas/, 'alubias_cocidas'],",
    "  [/alubias blancas cocidas/, 'alubias_blancas_cocidas'],\n  [/alubias rojas cocidas/, 'alubias_rojas_cocidas'],\n  [/alubias pintas cocidas/, 'alubias_pintas_cocidas'],\n  [/habitas/, 'habitas'],\n  [/alubias negras cocidas/, 'alubias_cocidas'],"],
  ['/src/plan/racionesApp.js', '...(esComidaDoble(m) ? extraDoble(m, it, targetKcal, composicion) : {}) })),',
    '...(esComidaDoble(m) ? extraDoble(m, it, targetKcal, composicion) : {}), ...(m._guarnicion && it.clave === m._guarnicion.clave ? { rangoPropio: globalThis.__guarn.RANGO } : {}) })),'],
];

const hooks = `
const CAMBIOS = ${JSON.stringify(CAMBIOS)};
export async function load(url, contexto, siguiente) {
  const r = await siguiente(url, contexto);
  const mios = CAMBIOS.filter(([sufijo]) => url.endsWith(sufijo));
  if (!mios.length) return r;
  let t = String(r.source);
  const nl = t.includes('\\r\\n') ? '\\r\\n' : '\\n';
  for (const [sufijo, ancla, nuevo] of mios) {
    const a = ancla.split('\\n').join(nl);
    if (t.split(a).length !== 2) throw new Error('variantesGuarnicion: ancla no encontrada (o repetida) en ' + sufijo + ': ' + ancla);
    t = t.replace(a, () => nuevo.split('\\n').join(nl));
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));

// Funciones del árbol medido que el prototipo necesita (se cargan después del hook, ya con los cambios).
// La raíz del árbol medido es el primer argumento del script (cortasProteina.mjs <raíz> …); si no lo hay, este repo.
const raizMedida = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const base = raizMedida ? new URL(`file:///${raizMedida.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/?$/, '/')}`) : RAIZ;
globalThis.__guarnBases = await import(new URL('src/engine2/dishes/bases.js', base).href);
globalThis.__guarnAlergenos = (await import(new URL('src/engine2/nutrientes/alergenos.js', base).href)).alergenosDeTexto;
globalThis.__guarnTuplaDe = (await import(new URL('src/plan/textos/componer.js', base).href)).tuplaDe;
