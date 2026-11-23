// Prototipo 2: legumbre de bote como guarnición, decidida dentro del walk. MEDICIÓN, no producto (Javi, 2026-11-23).
// Hook de carga que aplica en memoria, sin modificar ningún archivo de src/:
//
//   - D-116 y D-117 apagadas siempre (el camino de la red: sinRegla), con todo lo demás de HEAD activo (tope de pescado
//     3, D-115, raciones, SIBO).
//   - En la COMIDA, después de elegir el plato del hueco: si el plato admite legumbre (hidratos-legumbre.csv) y el
//     perfil puede comer alguna de su lista, se elige con la semilla en dos pasos, sin pesos: primero entre «hidrato
//     original» y «legumbre» (uniforme entre las dos); si sale legumbre, cuál de su lista (uniforme entre las válidas).
//   - En la cena, ninguna guarnición de legumbre (D-099.3 no deja legumbre en la cena).
//   - La guarnición cuenta como consumo de legumbre para D-024: sube el contador semanal de legumbre y marca el día (la
//     veda de días seguidos), así que los huecos siguientes ven la semana menos corta de legumbre.
//   - Tope de 3 legumbres por semana (guarnición y platos de legumbre servidos): con 3, ni guarnición ni platos de
//     legumbre en el pool (vuelta atrás si no queda otro candidato); guisantes y habitas juntos, como mucho
//     1; preferencia por no repetir legumbre, con vuelta atrás. Sin el suelo de 2 del prototipo 1: el suelo es el de
//     D-024, que ahora cuenta la guarnición.
//   - --compuestosSoloSinOtro (subvariante b): un plato compuesto de legumbre (tmpl «legumbre») solo entra en el pool de
//     un hueco si no queda otro candidato; se dice en el log. Los redactados de legumbre (fabada, cocido, hummus…) no
//     cambian.
//   - Seguridad, ingredientes y ración, como el prototipo 1 (variantesGuarnicion.mjs, guarnicion-legumbre.md).
//
// Uso (desde la raíz del repo, con el árbol de HEAD):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesGuarnicion2.mjs \
//     scripts/banco/medicion/cortasProteina.mjs <raíz> <salida.json> <perfil> [semanas] [--compuestosSoloSinOtro] [--soloOmnivora]
//     [--sueloGuarnicion] [--baseGuarnicion=N]
//   --soloOmnivora: la (b) no se aplica a dietas vegetariana ni vegana (como D-116.9).
//   --sueloGuarnicion: suelo de 2 legumbres por semana que actúa solo por la guarnición: desde el jueves, si la semana va
//     corta, el siguiente hueco que admite guarnición la lleva sin el paso de la mitad (con vuelta atrás y causa).
//   --baseGuarnicion=N: gramos de partida de la guarnición (150 por defecto; rango 80-240).
//   --redD099: si la semana acaba con infracción de D-099.3 y la (b) había sacado compuestos de legumbre del pool, se
//     repite el walk entero con la misma semilla sin esa exclusión (causa en el log); si sigue con infracción, se anota
//     con causa propia.
//   --racionGuarnicion2: ración de la guarnición de 100-160 g escurridos con salida en 130 g (sin crecer con la
//     amplitud del objetivo). Si faltan kcal, crece primero el proteico del plato dentro de su rango, después la legumbre
//     hasta su máximo y por último el pan (como crecerSiFalta en la comida doble); causa en el log de raciones.
//   --hidratoSeguidos: preferencias con vuelta atrás: no repetir el mismo hidrato de plantilla en días seguidos (filtro
//     del pool, antes de las preferencias A y B) y no poner guarnición de legumbre en días seguidos, aunque sea de otra.
import fs from 'node:fs';
import { register } from 'node:module';

const RAIZ = new URL('../../../', import.meta.url);
const SUB_B = process.argv.includes('--compuestosSoloSinOtro');
// Cambios de Javi del 2026-11-23 sobre la (b): solo en dietas omnívoras; suelo de 2 por la guarnición; ración de partida.
const SUB_B_OMNI = process.argv.includes('--soloOmnivora');
const SUELO_G = process.argv.includes('--sueloGuarnicion');
const baseArg = process.argv.find((a) => a.startsWith('--baseGuarnicion='));
// Ajuste de la ración (Javi, 2026-11-23): rango 100-160 g, salida 130 g y orden de crecimiento proteico → legumbre → pan.
const RACION2 = process.argv.includes('--racionGuarnicion2');
const BASE_GUARNICION = baseArg ? Number(baseArg.split('=')[1]) : RACION2 ? 130 : 150;
const DIA_MITAD = 3; // jueves (índice en DAYS_ORDER): desde aquí, el suelo de 2 mira si la semana va corta
const SUELO_LEGUMBRES = 2;
// Última ronda (Javi, 2026-11-23): red de D-099.3 para la (b) y preferencias de hidrato y legumbre en días seguidos.
const RED_D099 = process.argv.includes('--redD099');
const PREF_SEGUIDOS = process.argv.includes('--hidratoSeguidos');
const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']; // DAYS_ORDER
// Hidrato de plantilla de un plato: la C de su tupla (como lo cuenta el medidor); los redactados no tienen.
const hidratoDe = (id) => { try { const t = JSON.parse(id); return Array.isArray(t) ? t[2] || null : null; } catch { return null; } };
const huecoDe = (slots, day, momento) => [...slots.values()].find((x) => x.day === day && x.momento === momento);
process.stderr.write(`[variantesGuarnicion2] guarnición en el walk; subvariante ${SUB_B ? 'b' : 'a'}${SUB_B_OMNI ? ', b solo omnívora' : ''}${SUELO_G ? ', suelo de 2 por la guarnición' : ''}${RED_D099 ? ', red de D-099.3' : ''}${PREF_SEGUIDOS ? ', sin hidrato ni guarnición en días seguidos' : ''}${RACION2 ? ', ración 100-160 g y crece proteico → legumbre → pan' : ''}; ración de partida ${BASE_GUARNICION} g\n`);

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

// ─── Legumbres (las mismas que el prototipo 1) ──────────────────────────────────────────────────────────────────────
const LEG = {
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
const RANGO_GUARNICION = RACION2 ? [100, 160, 10] : [80, 240, 10];
const TOPE_LEGUMBRES = 3;
const claveH = (leg, frio) => `g_${leg.replace(/ /g, '_')}${frio ? '_frio' : ''}`;
const hidratosNuevos = [];
for (const [id, l] of Object.entries(LEG)) {
  const base = { compra: l.compra, el: l.el, g: l.g, base: BASE_GUARNICION, clave: l.clave };
  hidratosNuevos.push(`  ${claveH(id, false)}: ${JSON.stringify({ ...base,
    receta: `Escurre y enjuaga ${l.el} de bote; caliénta${l.pron} 2-3 min en una sartén con un poco del aceite y sal.`,
    recetaHorno: `Escurre y enjuaga ${l.el} de bote, séca${l.pron}, alíña${l.pron} con un poco del aceite y sal y ása${l.pron} en la misma bandeja los últimos 15 min.` })},`);
  hidratosNuevos.push(`  ${claveH(id, true)}: ${JSON.stringify({ ...base, receta: `Escurre y enjuaga ${l.el} de bote.` })},`);
}

// ─── Seguridad: legumbres que el perfil puede comer (cierra los huecos de seguridad-legumbres.md) ────────────────────
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
const USADA_POR_ESPECIE = { garbanzos: ['garbanzos'], lentejas: ['lentejas pardinas', 'lentejas beluga'], alubias: ['alubias blancas'], alubias_negras: ['alubias negras'] };

// ─── Lógica dentro del walk ─────────────────────────────────────────────────────────────────────────────────────────
globalThis.__g2 = {
  RANGO: RANGO_GUARNICION,
  RACION2,
  /**
   * --racionGuarnicion2, en el reparto de ajustarComida: la legumbre de la guarnición no pasa de su salida y el pan se
   * queda en su mínimo; lo que falte lo reparte después crecerGuarnicion, por orden.
   */
  rangoVuelta(e, estado) {
    if (!RACION2 || !e.rango) return e.rango;
    if (e.guarnicionLeg) return [e.rango[0], Math.min(e.rango[1], BASE_GUARNICION)];
    if (String(e.clave).startsWith('pan_') && estado.some((x) => x.guarnicionLeg)) return [e.rango[0], e.rango[0]];
    return e.rango;
  },
  /** Si faltan kcal en una comida con guarnición: crece el proteico, después la legumbre hasta su máximo y después el pan. */
  crecerGuarnicion(estado, faltaKcal, composicion) {
    if (!RACION2 || !estado.some((e) => e.guarnicionLeg)) return null;
    const cambios = [];
    const crecer = (e, papel) => {
      const falta = faltaKcal();
      const comp = composicion[e.clave];
      if (falta <= 0 || !e.rango || !comp || !comp.kcal) return;
      const antes = e.nuevo;
      const g = e.nuevo + (falta * 100) / comp.kcal;
      if (g >= e.rango[1]) { e.nuevo = e.rango[1]; e.limitado = 'maximo'; } else { e.nuevo = g; e.limitado = null; }
      if (e.nuevo > antes) cambios.push({ clave: e.clave, papel, antes, despues: e.nuevo });
    };
    // Los proteicos que van en unidades (huevo, con su tope de D-111) no crecen aquí.
    for (const e of estado.filter((x) => x.papel === 'proteico' && x.rango && x.limitado !== 'maximo' && (!x.unidad || x.unidad === 'g'))) crecer(e, 'proteico');
    for (const e of estado.filter((x) => x.guarnicionLeg)) crecer(e, 'legumbre');
    for (const e of estado.filter((x) => x.papel !== 'fijo' && String(x.clave).startsWith('pan_'))) crecer(e, 'pan');
    return cambios.length ? cambios : null;
  },
  textoCrecido(cambios) {
    const papel = { proteico: 'el proteico', legumbre: 'la legumbre', pan: 'el pan' };
    return `faltaban kcal en la comida con guarnición: crece ${cambios.map((x) => `${papel[x.papel]} (${x.clave} ${Math.round(x.antes)} → ${Math.round(x.despues)} g)`).join('; después ')}, por este orden y dentro de su rango`;
  },
  posibles: new Set(),
  /** Estado de la guarnición de un walk (se crea al empezar cada walk, también en sus repeticiones). */
  inicio(seed) { return { rng: rngDe(`${seed}::guarnicion`), guarniciones: [] }; },
  /**
   * Filtros del pool de cada hueco, con vuelta atrás:
   *   - tope de 3 legumbres en la semana (guarnición y platos): con 3, fuera los platos de legumbre;
   *   - subvariante b: un compuesto de legumbre como plato único solo si el hueco no tiene otro candidato.
   */
  filtrarPool(g, { pool, day, momento, decisionLog, esCompuestoLegumbre, slots, familiaCache }) {
    const anota = (causa, evidencia) => decisionLog.push({ decisionId: `guarnicion-${decisionLog.length}`, day, momentoGuarnicion: momento, causa, evidencia, evento: true });
    let out = pool;
    let platos = 0;
    for (const s of slots.values()) if (!s.abierto && s.dishId && !(s.fixedRole === 'libre' && s.momento === 'comida') && familiaCache(s.dishId) === 'legumbre') platos += 1;
    const total = platos + g.guarniciones.length;
    if (total >= TOPE_LEGUMBRES) {
      const sin = out.filter((d) => familiaCache(d.id) !== 'legumbre');
      if (sin.length && sin.length < out.length) { anota('legumbre_tope_semana', `${day}/${momento}: la semana ya lleva ${total} legumbres (tope ${TOPE_LEGUMBRES}): fuera ${out.length - sin.length} platos de legumbre`); out = sin; } else if (!sin.length) anota('legumbre_tope_semana_sin_aplicar', `${day}/${momento}: solo quedan platos de legumbre; no se aplica el tope`);
    }
    if (SUB_B && !globalThis.__g2.sinB && !(SUB_B_OMNI && ['vegetariana', 'vegana'].includes(globalThis.__g2.dieta))) {
      const sin = out.filter((d) => !esCompuestoLegumbre(d));
      if (sin.length && sin.length < out.length) { anota('legumbre_compuesta_fuera_hay_otro', `${day}/${momento}: fuera ${out.length - sin.length} compuestos de legumbre como plato único; quedan ${sin.length} candidatos`); out = sin; } else if (!sin.length) anota('legumbre_compuesta_sin_otro_candidato', `${day}/${momento}: solo quedan compuestos de legumbre; se admiten`);
    }
    return out;
  },
  /** Hidratos servidos un día (la comida con guarnición cuenta como «legumbre», como en el medidor). */
  hidratosDelDia(g, slots, day) {
    const out = new Set();
    if (!day) return out;
    for (const s of slots.values()) {
      if (s.day !== day || s.abierto || !s.dishId || (s.fixedRole === 'libre' && s.momento === 'comida')) continue;
      const h = s.momento === 'comida' && g.guarniciones.some((x) => x.day === day) ? 'legumbre' : hidratoDe(s.dishId);
      if (h) out.add(h);
    }
    return out;
  },
  /**
   * --hidratoSeguidos: preferencia, con vuelta atrás, de no repetir el hidrato de plantilla del día anterior ni del
   * siguiente (si ya está decidido). Va después de los filtros de la semana y antes de las preferencias A y B.
   */
  hidratoPool(g, { pool, day, i, momento, decisionLog, slots }) {
    if (!PREF_SEGUIDOS) return pool;
    const cerca = new Set([...this.hidratosDelDia(g, slots, DIAS[i - 1]), ...this.hidratosDelDia(g, slots, DIAS[i + 1])]);
    if (!cerca.size) return pool;
    const sin = pool.filter((d) => !cerca.has(hidratoDe(d.id)));
    if (sin.length === pool.length) return pool;
    const anota = (causa, evidencia) => decisionLog.push({ decisionId: `guarnicion-${decisionLog.length}`, day, momentoGuarnicion: momento, causa, evidencia, evento: true });
    if (sin.length) { anota('hidrato_dias_seguidos_evitado', `${day}/${momento}: fuera ${pool.length - sin.length} candidatos con ${[...cerca].join(', ')}, el hidrato del día de al lado; quedan ${sin.length}`); return sin; }
    anota('hidrato_dias_seguidos_sin_aplicar', `${day}/${momento}: todos los candidatos llevan ${[...cerca].join(', ')}, el hidrato del día de al lado; no se aplica`);
    return pool;
  },
  /**
   * --redD099: red de D-099.3 de la (b). Si la semana acaba con infracción y la (b) había sacado algún compuesto de
   * legumbre del pool, se repite el walk entero con la misma semilla sin esa exclusión; si sigue, se anota.
   */
  redD099(input, resultado, { repetir, infraccionesD099, anotarInfraccion }) {
    if (!RED_D099) return resultado;
    const inf = infraccionesD099(input, resultado);
    if (!inf.length) return resultado;
    if (!resultado.decisionLog.some((e) => e.causa === 'legumbre_compuesta_fuera_hay_otro')) {
      return anotarInfraccion(resultado, inf, 'infraccion_d099_guarnicion_sin_exclusion', 'y la (b) no había sacado ningún compuesto de legumbre del pool: la red de la (b) no repite');
    }
    this.sinB = true;
    let otra;
    try { otra = repetir(); } finally { this.sinB = false; }
    otra.decisionLog.push({ decisionId: `walk-select-${otra.decisionLog.length}`, day: undefined, momento: undefined, plato: undefined,
      causa: 'guarnicion_red_d099_sin_b',
      evidencia: `con la (b) la semana incumplía D-099.3 (${inf.join('; ')}); se repite el walk entero con la misma semilla sin sacar los compuestos de legumbre del pool (guarnición, suelo y topes siguen)`,
      alternativasDescartadas: [], evento: true, infracciones: inf });
    const quedan = infraccionesD099(input, otra);
    return quedan.length ? anotarInfraccion(otra, quedan, 'infraccion_d099_guarnicion_red_sin_b', 'también sin la exclusión de compuestos de la (b): la red ya no repite más') : otra;
  },
  /** Después de elegir el plato de un hueco: ¿hidrato original o legumbre? */
  decidir(g, { day, i, momento, dish, freqState, decisionLog, slots, familiaCache, proteinaCache }) {
    if (momento !== 'comida') return;
    const lista = INVENTARIO.get(dish.id);
    if (!lista) return;
    const validas = lista.filter((x) => globalThis.__g2.posibles.has(x));
    if (!validas.length) return;
    const anota = (causa, evidencia, extra = {}) => decisionLog.push({ decisionId: `guarnicion-${decisionLog.length}`, day, momentoGuarnicion: momento, plato: dish.id, causa, evidencia, evento: true, ...extra });
    // Platos de legumbre servidos (sin la sugerencia de la comida libre) y legumbres ya usadas.
    const usadas = new Set(g.guarniciones.map((x) => x.legumbre));
    let platos = 0;
    for (const s of slots.values()) {
      if (s.abierto || !s.dishId || (s.fixedRole === 'libre' && s.momento === 'comida')) continue;
      if (familiaCache(s.dishId) === 'legumbre') { platos += 1; for (const u of USADA_POR_ESPECIE[proteinaCache(s.dishId)] || []) usadas.add(u); }
    }
    const total = platos + g.guarniciones.length;
    if (total >= TOPE_LEGUMBRES) { anota('guarnicion_legumbre_tope', `la semana ya lleva ${total} legumbres (tope ${TOPE_LEGUMBRES}): se queda el hidrato original`); return; }
    // Suelo de 2 por la guarnición (--sueloGuarnicion): desde la mitad de la semana, si va corta, este hueco la lleva
    // sin el paso de la mitad. Nunca fuerza un plato de legumbre suelto: solo actúa aquí, en un hueco que admite guarnición.
    const porSuelo = SUELO_G && i >= DIA_MITAD && total < SUELO_LEGUMBRES;
    // --hidratoSeguidos: ninguna guarnición de legumbre el día de al lado de otra, aunque sea de otra legumbre. Con el
    // suelo pendiente, la vuelta atrás: cede solo si no queda ninguna comida servida más en la semana.
    if (PREF_SEGUIDOS) {
      const cerca = g.guarniciones.find((x) => x.day === DIAS[i - 1] || x.day === DIAS[i + 1]);
      if (cerca) {
        const quedan = DIAS.slice(i + 1).filter((dd) => { const s = huecoDe(slots, dd, 'comida'); return s && s.abierto && s.fixedRole !== 'libre'; }).length;
        if (!porSuelo || quedan > 0) { anota('guarnicion_dias_seguidos_evitada', `${day}: el ${cerca.day} ya lleva guarnición de legumbre (${cerca.legumbre}): se queda el hidrato original${porSuelo ? `; el suelo espera a otra comida (quedan ${quedan})` : ''}`); return; }
        anota('guarnicion_dias_seguidos_sin_aplicar', `${day}: el ${cerca.day} ya lleva guarnición de legumbre, pero el suelo de ${SUELO_LEGUMBRES} no tiene otra comida en la semana: no se aplica`);
      }
    }
    if (porSuelo) anota('guarnicion_suelo_semana', `${day}: la semana va corta (${total} de ${SUELO_LEGUMBRES} legumbres desde el jueves): este hueco lleva legumbre de guarnición sin el paso de la mitad`);
    // Paso 1: hidrato original o legumbre, uniforme entre las dos.
    const u1 = porSuelo ? 1 : g.rng();
    if (u1 < 0.5) { anota('guarnicion_hidrato_original', `RNG «::guarnicion» -> «hidrato original» (de: hidrato original, legumbre)`); return; }
    // Paso 2: cuál, con las reglas de la semana.
    let opciones = validas;
    const verdes = g.guarniciones.filter((x) => VERDES.has(x.legumbre)).length;
    if (verdes >= 1) { const sin = opciones.filter((x) => !VERDES.has(x)); if (sin.length < opciones.length) anota('guarnicion_guisantes_habitas', 'guisantes y habitas ya salen 1 vez esta semana: fuera de las opciones'); opciones = sin; }
    if (!opciones.length) { anota(porSuelo ? 'guarnicion_suelo_sin_legumbre_valida' : 'guarnicion_sin_legumbre_valida', `${porSuelo ? 'el suelo pedía legumbre' : 'salía legumbre'}, pero ninguna de la lista es válida esta semana: se queda el hidrato original`); return; }
    const nuevas = opciones.filter((x) => !usadas.has(x));
    if (nuevas.length && nuevas.length < opciones.length) { anota('guarnicion_legumbre_no_repetida', `fuera ${opciones.filter((x) => usadas.has(x)).join(', ')}: ya salen esta semana`); opciones = nuevas; } else if (!nuevas.length) anota('guarnicion_legumbre_no_repetida_sin_aplicar', 'todas las legumbres válidas ya salen esta semana; no se aplica');
    const k = Math.floor(g.rng() * opciones.length);
    const leg = opciones[k];
    g.guarniciones.push({ day, legumbre: leg });
    // D-024: la guarnición es consumo de legumbre (contador semanal y veda del día).
    freqState.contadores.legumbre += 1;
    freqState.incrementDays.legumbre.add(day);
    anota('guarnicion_legumbre_elegida', `RNG «::guarnicion» -> «legumbre»; después índice ${k} de ${opciones.length} (${opciones.join(', ')}); cuenta para el suelo de legumbre de D-024`, { legumbre: leg });
  },
  /** Después de materializePlan: cambia el plato de cada guarnición elegida (mismo id, tupla y nombre nuevos). */
  aplicar(e2, { bases, tuplaDe }) {
    const porDia = new Map(e2.days.map((d) => [d.day, d]));
    for (const e of e2.decisionLog) {
      if (e.causa !== 'guarnicion_legumbre_elegida') continue;
      const d = porDia.get(e.day);
      const m = d && d.meals.find((x) => x.momento === 'comida');
      if (!m || !m.dish || m.dish.id !== e.plato || m.libre) continue;
      const tupla = tuplaDe(m.dish.id);
      const frio = tupla.tmpl === 'ensalada' || tupla.cookM === 'crudo';
      const l = LEG[e.legumbre];
      m.dish = { ...m.dish, nombre: nombreCon(m.dish.nombre, tupla.C, l.nombre), _nombreOriginal: m.dish.nombre,
        _tuplaGuarnicion: { ...tupla, C: claveH(e.legumbre, frio) }, _guarnicion: { legumbre: e.legumbre, clave: l.clave, hidratoOriginal: tupla.C } };
    }
    void bases;
  },
};

// ─── Cambios en memoria de src/ ─────────────────────────────────────────────────────────────────────────────────────
const COMPOSICION_NUEVA = `  "alubias_blancas_cocidas": { "kcal": 93.1, "proteina": 6.7, "hidratos": 15.7, "grasa": 0.2, "fibra": 4.4, "agua": 72.5, "fuente": { "bedca": "898", "nombre": "Alubia blanca, en conserva" } },
  "alubias_rojas_cocidas": { "kcal": 92, "proteina": 8.4, "hidratos": 13.7, "grasa": 0.2, "fibra": 8.7, "agua": 68.9, "fuente": { "bedca": "900", "nombre": "Alubia negra, seca, remojada, hervida", "nota": "aproximación: nutrición de la alubia negra (BEDCA no tiene alubia roja)" } },
  "alubias_pintas_cocidas": { "kcal": 92, "proteina": 8.4, "hidratos": 13.7, "grasa": 0.2, "fibra": 8.7, "agua": 68.9, "fuente": { "bedca": "900", "nombre": "Alubia negra, seca, remojada, hervida", "nota": "aproximación: nutrición de la alubia negra (BEDCA solo tiene judía pinta en seco)" } },
  "habitas": { "kcal": 57.2, "proteina": 4.6, "hidratos": 8.6, "grasa": 0.4, "fibra": 4.2, "agua": 82.2, "fuente": { "bedca": "2194", "nombre": "Haba, fresca" } },
`;
const CAMBIOS = [
  ['/src/engine2/walk/runWalk.js', '    resultado = walkConRedDeFamilia(input, { sinRegla: false, intentos });',
    '    resultado = walkConRedDeFamilia(input, { sinRegla: true, intentos });\n    resultado = globalThis.__g2.redD099(input, resultado, { repetir: () => walkConRedDeFamilia(input, { sinRegla: true, intentos }), infraccionesD099, anotarInfraccion });'],
  ['/src/engine2/walk/runWalk.js', '      let candidatesA = poolAlino.length ? poolAlino : base1;',
    '      let candidatesA = globalThis.__g2.hidratoPool(__g, { pool: poolAlino.length ? poolAlino : base1, day, i, momento, decisionLog, slots });'],
  ['/src/engine2/walk/runWalk.js', '  const recientes = new Set(platosRecientes.map((id) => nombrePorId.get(id) ?? id));',
    '  const recientes = new Set(platosRecientes.map((id) => nombrePorId.get(id) ?? id));\n  const __g = globalThis.__g2.inicio(seed);'],
  ['/src/engine2/walk/runWalk.js', '      // Prototipo (visor): tope de proteina principal por semana. Si dejaria el',
    '      pool = globalThis.__g2.filtrarPool(__g, { pool, day, momento, decisionLog, esCompuestoLegumbre, slots, familiaCache });\n      // Prototipo (visor): tope de proteina principal por semana. Si dejaria el'],
  ['/src/engine2/walk/runWalk.js', '      if (!esSugerencia) registerConsumption(freqState, chosen, day, undefined, fuenteEditorial);',
    '      if (!esSugerencia) registerConsumption(freqState, chosen, day, undefined, fuenteEditorial);\n      if (!esSugerencia) globalThis.__g2.decidir(__g, { day, i, momento, dish: chosen, freqState, decisionLog, slots, familiaCache, proteinaCache });'],
  ['/src/plan/engine2App.js', '  const e2 = materializePlan({',
    '  globalThis.__g2.posibles = new Set([...legumbresDelPerfilApp(profile)].filter(([, m]) => !m).map(([id]) => id));\n  globalThis.__g2.dieta = dietaDe(profile);\n  const e2 = materializePlan({'],
  ['/src/plan/engine2App.js', '  const log = e2.decisionLog;',
    '  globalThis.__g2.aplicar(e2, { bases: globalThis.__guarnBases, tuplaDe: globalThis.__guarnTuplaDe });\n  const log = e2.decisionLog;'],
  ['/src/plan/engine2App.js', 'export function generarPlanEngine2(profile, targetKcal, opts = {}) {',
    'const legumbresDelPerfilApp = (p) => globalThis.__g2Perfil(p);\nexport function generarPlanEngine2(profile, targetKcal, opts = {}) {'],
  ['/src/plan/engine2App.js', '      platosSemana.push(comida2.dish.nombre);', '      platosSemana.push(comida2.dish._nombreOriginal || comida2.dish.nombre);'],
  ['/src/plan/textos/componer.js', '  const tupla = tuplaDe(dish.id);', '  const tupla = dish._tuplaGuarnicion || tuplaDe(dish.id);'],
  ['/src/plan/textos/componer.js', '      _componer: componer,', '      _componer: componer,\n      ...(dish._guarnicion ? { _guarnicion: dish._guarnicion } : {}),'],
  ['/src/plan/textos/compuestos.js', "  quinoa: { compra: 'Quinoa',", `${hidratosNuevos.join('\n')}\n  quinoa: { compra: 'Quinoa',`],
  ['/src/engine2/nutrientes/composicion.js', '  "alubias_cocidas": {', `${COMPOSICION_NUEVA}  "alubias_cocidas": {`],
  ['/src/engine2/nutrientes/ingredientes.js', "  alubias_cocidas: I('Alubias cocidas', 'legumbre', { estado: 'cocido' }),",
    "  alubias_cocidas: I('Alubias cocidas', 'legumbre', { estado: 'cocido' }),\n  alubias_blancas_cocidas: I('Alubias blancas cocidas', 'legumbre', { estado: 'cocido' }),\n  alubias_rojas_cocidas: I('Alubias rojas cocidas', 'legumbre', { estado: 'cocido' }),\n  alubias_pintas_cocidas: I('Alubias pintas cocidas', 'legumbre', { estado: 'cocido' }),\n  habitas: I('Habitas', 'legumbre'),"],
  ['/src/engine2/nutrientes/raciones.js', 'alubias_cocidas: [120, 400, 10],', 'alubias_cocidas: [120, 400, 10], alubias_blancas_cocidas: [120, 400, 10], alubias_rojas_cocidas: [120, 400, 10], alubias_pintas_cocidas: [120, 400, 10], habitas: [50, 200, 10],'],
  ['/src/engine2/nutrientes/raciones.js', '      rango = [Math.min(rango[0], tope), Math.min(rango[1], tope), rango[2]];\n    }',
    '      rango = [Math.min(rango[0], tope), Math.min(rango[1], tope), rango[2]];\n    }\n    if (rango && it.rangoPropio) rango = it.rangoPropio;'],
  ['/src/engine2/nutrientes/raciones.js', "    return { ...it, papel: rango ? papel : 'fijo', rango, nuevo: it.gramos, limitado: null, fijoPorFicha };",
    "    if (rango && it.rangoPropio && globalThis.__g2.RACION2) rango = it.rangoPropio;\n    return { ...it, papel: rango ? papel : 'fijo', rango, nuevo: it.gramos, limitado: null, fijoPorFicha };"],
  ['/src/engine2/nutrientes/raciones.js', '      const [min, max] = e.rango;', '      const [min, max] = globalThis.__g2.rangoVuelta(e, estado);'],
  ['/src/engine2/nutrientes/raciones.js', '  // Medidas de casa.', '  const crecidoGuarnicion = globalThis.__g2.crecerGuarnicion(estado, faltaKcal, composicion);\n  // Medidas de casa.'],
  ['/src/engine2/nutrientes/raciones.js', '    ...(crecido ? { crecido } : {}),', '    ...(crecido ? { crecido } : {}),\n    ...(crecidoGuarnicion ? { crecidoGuarnicion } : {}),'],
  ['/src/engine2/nutrientes/raciones.js', '    const deFicha = r.items.filter((i) => i.fijoPorFicha);',
    "    if (r.crecidoGuarnicion) log.push({ causa: 'guarnicion_crece_por_energia', momento: c.momento, id: c.id, detalle: globalThis.__g2.textoCrecido(r.crecidoGuarnicion) });\n    const deFicha = r.items.filter((i) => i.fijoPorFicha);"],
  ['/src/plan/medidor/leerComida.js', "  [/alubias negras cocidas/, 'alubias_cocidas'],",
    "  [/alubias blancas cocidas/, 'alubias_blancas_cocidas'],\n  [/alubias rojas cocidas/, 'alubias_rojas_cocidas'],\n  [/alubias pintas cocidas/, 'alubias_pintas_cocidas'],\n  [/habitas/, 'habitas'],\n  [/alubias negras cocidas/, 'alubias_cocidas'],"],
  ['/src/plan/racionesApp.js', '...(esComidaDoble(m) ? extraDoble(m, it, targetKcal, composicion) : {}) })),',
    '...(esComidaDoble(m) ? extraDoble(m, it, targetKcal, composicion) : {}), ...(m._guarnicion && it.clave === m._guarnicion.clave ? { rangoPropio: globalThis.__g2.RANGO, guarnicionLeg: true } : {}) })),'],
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
    if (t.split(a).length !== 2) throw new Error('variantesGuarnicion2: ancla no encontrada (o repetida) en ' + sufijo + ': ' + ancla);
    t = t.replace(a, () => nuevo.split('\\n').join(nl));
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));

// Funciones del árbol medido que el prototipo necesita (se cargan después del hook, ya con los cambios).
const raizMedida = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const base = raizMedida ? new URL(`file:///${raizMedida.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/?$/, '/')}`) : RAIZ;
globalThis.__guarnBases = await import(new URL('src/engine2/dishes/bases.js', base).href);
const { alergenosDeTexto } = await import(new URL('src/engine2/nutrientes/alergenos.js', base).href);
globalThis.__g2Perfil = (p) => legumbresDelPerfil(p, alergenosDeTexto);
globalThis.__guarnTuplaDe = (await import(new URL('src/plan/textos/componer.js', base).href)).tuplaDe;
