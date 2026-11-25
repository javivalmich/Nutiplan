// Legumbre como guarnición en el walk (pasos 4, 5 y 7 de la legumbre como
// guarnición; D-119, D-024, D-099.3 y el asiento del hidrato en días seguidos).
// Solo filtros, un orden de prioridades y azar sembrado (CLAUDE.md,
// invariante 1). Toda elección deja su causa en el log.
//
// Referencia de comportamiento: el prototipo medido en memoria
// (scripts/banco/medicion/variantesGuarnicion2.mjs, opciones
// --compuestosSoloSinOtro --soloOmnivora --sueloGuarnicion --redD099
// --hidratoSeguidos --racionGuarnicion3 --topeEscalado), con una diferencia:
// el RNG es el de engine2 (mulberry32 sobre seedFromString), no la copia FNV
// del prototipo.
//
// RNG propio, «::guarnicion»: no consume el stream «::walk::select» de la
// selección, así que donde no hay guarnición el walk elige lo mismo.
//
// Solo actúa con la regla de D-116 y D-117 apagada (D-116.12): las dos no se
// han medido nunca juntas.

import { DAYS_ORDER } from '../skeleton/days.js';
import { mulberry32, seedFromString } from '../skeleton/rng.js';
import { legumbresGuarnicion } from '../dishes/guarnicionLegumbre.js';

/** Tope de legumbres por semana: guarniciones y platos de legumbre servidos (paso 5). */
export const TOPE_LEGUMBRES_SEMANA = 3;
/** Suelo de legumbres por semana que pone la guarnición, desde el jueves (paso 5). */
export const SUELO_LEGUMBRES_GUARNICION = 2;
const DIA_MITAD = 3; // índice del jueves en DAYS_ORDER
/** Guisantes y habitas, juntos, como mucho 1 vez por semana (paso 5). */
const VERDES = new Set(['guisantes', 'habitas']);
// Legumbre ya servida esta semana por un plato de legumbre (su especie), para no repetirla de guarnición.
const USADA_POR_ESPECIE = Object.freeze({
  garbanzos: ['garbanzos_cocidos'],
  lentejas: ['lentejas_pardinas_cocidas', 'lentejas_beluga_cocidas'],
  alubias: ['alubias_blancas_cocidas'],
  alubias_negras: ['alubias_negras_cocidas'],
});

const hidratoDe = (id) => { try { const t = JSON.parse(id); return Array.isArray(t) ? t[2] || null : null; } catch { return null; } };
const servido = (s) => !s.abierto && s.dishId && !(s.fixedRole === 'libre' && s.momento === 'comida');
const esVegetal = (profile) => profile?.dieta === 'vegetariana' || profile?.dieta === 'vegana';

/**
 * Estado de la guarnición de un walk (uno por walk, también en las repeticiones de las redes).
 * @param {object} o
 * @param {string|number} o.seed
 * @param {object} [o.profile] dieta: la elección de guarnición y la (b) son solo de dietas omnívoras
 * @param {string[]} [o.legumbres] legumbres de guarnición que el perfil puede comer (las decide la app)
 * @param {boolean} [o.sinExclusionB] la repetición de la red de D-099.3: sin la (b)
 */
export function crearGuarnicion({ seed, profile, legumbres = [], sinExclusionB = false }) {
  return {
    rng: mulberry32(seedFromString(`${seed}::guarnicion`)),
    guarniciones: [],
    posibles: new Set(esVegetal(profile) ? [] : legumbres),
    conB: !sinExclusionB && !esVegetal(profile),
  };
}

function anotar(decisionLog, extra) {
  decisionLog.push({ decisionId: `guarnicion-${decisionLog.length}`, evento: true, alternativasDescartadas: [], ...extra });
}

function legumbresDeLaSemana(g, slots, familiaCache) {
  let platos = 0;
  for (const s of slots.values()) if (servido(s) && familiaCache(s.dishId) === 'legumbre') platos += 1;
  return platos + g.guarniciones.length;
}

/**
 * Filtros del pool de un hueco, con vuelta atrás (paso 5 y la (b) del paso 4):
 *   - tope de 3 legumbres en la semana: con 3, fuera los platos de legumbre;
 *   - (b), en omnívoras: un compuesto de legumbre como plato solo si el hueco no tiene otro candidato.
 */
export function filtrarPoolGuarnicion(g, { pool, day, momento, decisionLog, esCompuestoLegumbre, slots, familiaCache }) {
  const anota = (causa, evidencia) => anotar(decisionLog, { day, momentoGuarnicion: momento, causa, evidencia });
  let out = pool;
  const total = legumbresDeLaSemana(g, slots, familiaCache);
  if (total >= TOPE_LEGUMBRES_SEMANA) {
    const sin = out.filter((d) => familiaCache(d.id) !== 'legumbre');
    if (sin.length && sin.length < out.length) {
      anota('legumbre_tope_semana', `${day}/${momento}: la semana ya lleva ${total} legumbres (tope ${TOPE_LEGUMBRES_SEMANA}): fuera ${out.length - sin.length} platos de legumbre`);
      out = sin;
    } else if (!sin.length) anota('legumbre_tope_semana_sin_aplicar', `${day}/${momento}: solo quedan platos de legumbre; no se aplica el tope`);
  }
  if (g.conB) {
    const sin = out.filter((d) => !esCompuestoLegumbre(d));
    if (sin.length && sin.length < out.length) {
      anota('legumbre_compuesta_fuera_hay_otro', `${day}/${momento}: fuera ${out.length - sin.length} compuestos de legumbre como plato único; quedan ${sin.length} candidatos`);
      out = sin;
    } else if (!sin.length) anota('legumbre_compuesta_sin_otro_candidato', `${day}/${momento}: solo quedan compuestos de legumbre; se admiten`);
  }
  return out;
}

/** Hidratos servidos un día (la comida con guarnición cuenta como «legumbre»). */
function hidratosDelDia(g, slots, day) {
  const out = new Set();
  if (!day) return out;
  for (const s of slots.values()) {
    if (s.day !== day || !servido(s)) continue;
    const h = s.momento === 'comida' && g.guarniciones.some((x) => x.day === day) ? 'legumbre' : hidratoDe(s.dishId);
    if (h) out.add(h);
  }
  return out;
}

/**
 * No repetir el mismo hidrato de plantilla en días seguidos (todas las dietas): preferencia con vuelta atrás frente
 * al día anterior y al siguiente si ya está decidido. Va antes de las preferencias A y B.
 */
export function hidratoPoolGuarnicion(g, { pool, day, i, momento, decisionLog, slots }) {
  const cerca = new Set([...hidratosDelDia(g, slots, DAYS_ORDER[i - 1]), ...hidratosDelDia(g, slots, DAYS_ORDER[i + 1])]);
  if (!cerca.size) return pool;
  const sin = pool.filter((d) => !cerca.has(hidratoDe(d.id)));
  if (sin.length === pool.length) return pool;
  const anota = (causa, evidencia) => anotar(decisionLog, { day, momentoGuarnicion: momento, causa, evidencia });
  if (sin.length) {
    anota('hidrato_dias_seguidos_evitado', `${day}/${momento}: fuera ${pool.length - sin.length} candidatos con ${[...cerca].join(', ')}, el hidrato del día de al lado; quedan ${sin.length}`);
    return sin;
  }
  anota('hidrato_dias_seguidos_sin_aplicar', `${day}/${momento}: todos los candidatos llevan ${[...cerca].join(', ')}, el hidrato del día de al lado; no se aplica`);
  return pool;
}

/**
 * Después de elegir el plato de un hueco: ¿hidrato original o legumbre? (paso 4, con las reglas del paso 5).
 * El primer paso es un desempate con la semilla entre dos opciones igual de válidas (el hidrato del plato o una
 * legumbre de su lista); el segundo, otro desempate entre las legumbres que quedan tras los filtros. Sin pesos.
 */
export function decidirGuarnicion(g, { day, i, momento, dish, freqState, decisionLog, slots, familiaCache, proteinaCache }) {
  const lista = legumbresGuarnicion(dish.id);
  if (!lista) return;
  const validas = lista.filter((x) => g.posibles.has(x));
  if (!validas.length) return;
  const anota = (causa, evidencia, extra = {}) => anotar(decisionLog, { day, momentoGuarnicion: momento, plato: dish.id, causa, evidencia, ...extra });
  // Sin legumbre en la cena (D-099.3).
  if (momento !== 'comida') { anota('guarnicion_legumbre_cena', `${day}: en la cena no va legumbre (D-099.3): se queda el hidrato original`); return; }
  const usadas = new Set(g.guarniciones.map((x) => x.legumbre));
  for (const s of slots.values()) {
    if (servido(s) && familiaCache(s.dishId) === 'legumbre') for (const u of USADA_POR_ESPECIE[proteinaCache(s.dishId)] || []) usadas.add(u);
  }
  const total = legumbresDeLaSemana(g, slots, familiaCache);
  if (total >= TOPE_LEGUMBRES_SEMANA) { anota('guarnicion_legumbre_tope', `la semana ya lleva ${total} legumbres (tope ${TOPE_LEGUMBRES_SEMANA}): se queda el hidrato original`); return; }
  // Suelo de 2 por la guarnición: desde el jueves, si la semana va corta, este hueco la lleva sin el primer paso.
  const porSuelo = i >= DIA_MITAD && total < SUELO_LEGUMBRES_GUARNICION;
  // Ninguna guarnición el día de al lado de otra. Con el suelo pendiente, cede solo si no queda otra comida servida.
  const cerca = g.guarniciones.find((x) => x.day === DAYS_ORDER[i - 1] || x.day === DAYS_ORDER[i + 1]);
  if (cerca) {
    const quedan = DAYS_ORDER.slice(i + 1).filter((dd) => [...slots.values()].some((s) => s.day === dd && s.momento === 'comida' && s.abierto && s.fixedRole !== 'libre')).length;
    if (!porSuelo || quedan > 0) {
      anota('guarnicion_dias_seguidos_evitada', `${day}: el ${cerca.day} ya lleva guarnición de legumbre (${cerca.legumbre}): se queda el hidrato original${porSuelo ? `; el suelo espera a otra comida (quedan ${quedan})` : ''}`);
      return;
    }
    anota('guarnicion_dias_seguidos_sin_aplicar', `${day}: el ${cerca.day} ya lleva guarnición de legumbre, pero el suelo de ${SUELO_LEGUMBRES_GUARNICION} no tiene otra comida en la semana: no se aplica`);
  }
  if (porSuelo) anota('guarnicion_suelo_semana', `${day}: la semana va corta (${total} de ${SUELO_LEGUMBRES_GUARNICION} legumbres desde el jueves): este hueco lleva legumbre de guarnición sin el primer desempate`);
  // Paso 1: hidrato original o legumbre, dos opciones igual de válidas: desempate con la semilla.
  const u1 = porSuelo ? 1 : g.rng();
  if (u1 < 0.5) { anota('guarnicion_hidrato_original', 'RNG «::guarnicion» -> «hidrato original» (de: hidrato original, legumbre); desempate entre dos opciones igual de válidas'); return; }
  // Paso 2: cuál, con las reglas de la semana.
  let opciones = validas;
  if (g.guarniciones.some((x) => VERDES.has(x.legumbre))) {
    const sin = opciones.filter((x) => !VERDES.has(x));
    if (sin.length < opciones.length) anota('guarnicion_guisantes_habitas', 'guisantes y habitas ya salen 1 vez esta semana: fuera de las opciones');
    opciones = sin;
  }
  if (!opciones.length) {
    anota(porSuelo ? 'guarnicion_suelo_sin_legumbre_valida' : 'guarnicion_sin_legumbre_valida', `${porSuelo ? 'el suelo pedía legumbre' : 'salía legumbre'}, pero ninguna de la lista es válida esta semana: se queda el hidrato original`);
    return;
  }
  const nuevas = opciones.filter((x) => !usadas.has(x));
  if (nuevas.length && nuevas.length < opciones.length) {
    anota('guarnicion_legumbre_no_repetida', `fuera ${opciones.filter((x) => usadas.has(x)).join(', ')}: ya salen esta semana`);
    opciones = nuevas;
  } else if (!nuevas.length) anota('guarnicion_legumbre_no_repetida_sin_aplicar', 'todas las legumbres válidas ya salen esta semana; no se aplica');
  const k = Math.floor(g.rng() * opciones.length);
  const leg = opciones[k];
  g.guarniciones.push({ day, legumbre: leg });
  // D-024: la guarnición es consumo de legumbre (contador semanal y veda del día).
  freqState.contadores.legumbre += 1;
  freqState.incrementDays.legumbre.add(day);
  anota('guarnicion_legumbre_elegida', `RNG «::guarnicion» -> «legumbre»; después índice ${k} de ${opciones.length} (${opciones.join(', ')}), desempate entre legumbres igual de válidas; cuenta para el suelo de legumbre de D-024`, { legumbre: leg });
}

/**
 * Red de D-099.3 de la (b) (paso 7). Si la semana acaba con infracción y la (b) había sacado algún compuesto de
 * legumbre del pool, se repite el walk entero con la misma semilla sin esa exclusión; si sigue, se anota.
 */
export function redD099Guarnicion(input, resultado, { repetir, infraccionesD099, anotarInfraccion }) {
  const inf = infraccionesD099(input, resultado);
  if (!inf.length) return resultado;
  if (!resultado.decisionLog.some((e) => e.causa === 'legumbre_compuesta_fuera_hay_otro')) {
    return anotarInfraccion(resultado, inf, 'infraccion_d099_guarnicion_sin_exclusion', 'y la (b) no había sacado ningún compuesto de legumbre del pool: la red de la (b) no repite');
  }
  const otra = repetir();
  otra.decisionLog.push({
    decisionId: `walk-select-${otra.decisionLog.length}`, day: undefined, momento: undefined, plato: undefined,
    causa: 'guarnicion_red_d099_sin_b',
    evidencia: `con la (b) la semana incumplía D-099.3 (${inf.join('; ')}); se repite el walk entero con la misma semilla sin sacar los compuestos de legumbre del pool (guarnición, suelo y topes siguen)`,
    alternativasDescartadas: [], evento: true, infracciones: inf,
  });
  const quedan = infraccionesD099(input, otra);
  return quedan.length ? anotarInfraccion(otra, quedan, 'infraccion_d099_guarnicion_red_sin_b', 'también sin la exclusión de compuestos de la (b): la red ya no repite más') : otra;
}
