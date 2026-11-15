// Legumbre en el walk: dias sorteados (D-117, modifica D-024) y comida con
// primero y segundo (D-116). Solo filtros, un orden de prioridades y azar
// sembrado (CLAUDE.md, invariante 1). Toda eleccion deja su causa en el log.
//
// RNG propio, «::walk::estructura»: el sorteo de los dias y el desempate de
// los segundos no consumen el stream «::walk::select» de la seleccion.
//
// Referencia de comportamiento: la variante medida en memoria antes de
// implementarla (scripts/banco/medicion/estructuraComidaLogica.mjs, opciones
// suelo3, sinPescado, todas, antesAB, topePlatoUnico y red).

import { DAYS_ORDER } from '../skeleton/days.js';
import { mulberry32, seedFromString } from '../skeleton/rng.js';
import { DEFAULT_WEEKLY_TARGETS } from '../contracts/weeklyTargets.js';
import { familiaProteica, esCompuestoLegumbre } from '../dishes/bases.js';

/** La regla es solo de dietas omnivoras (D-116.9, D-117.8). */
export function reglaLegumbreActiva(profile) {
  return profile?.dieta !== 'vegetariana' && profile?.dieta !== 'vegana';
}

/** Todos los conjuntos de n indices de `elegibles` sin dos dias seguidos, en orden fijo. */
function conjuntosSinSeguidos(elegibles, n) {
  const out = [];
  const rec = (desde, acc) => {
    if (acc.length === n) { out.push(acc); return; }
    for (let k = desde; k < elegibles.length; k++) {
      if (!acc.some((a) => Math.abs(a - elegibles[k]) === 1)) rec(k + 1, [...acc, elegibles[k]]);
    }
  };
  rec(0, []);
  return out;
}

/**
 * Sorteo de los dias de legumbre de la semana (D-117.1), una vez por walk.
 * Entre todos los conjuntos validos de dias: sin el dia de la comida libre,
 * sin dos dias seguidos y sin los dias donde el ancla ya coloco un plato (ni
 * los vecinos de una legumbre del ancla). Las legumbres del ancla cuentan para
 * el suelo. Si el perfil no tiene ningun plato compuesto de legumbre (SIBO),
 * no se sortea nada y la regla no actua: devuelve null y lo dice en el log.
 * @returns {{dias: Set<string>, rng: () => number}|null}
 */
export function sortearDiasLegumbre({ p1aSlots, catalog, vetoedIds, seed, registrar }) {
  const porId = new Map(catalog.map((d) => [d.id, d]));
  const colocados = p1aSlots.filter((s) => !s.abierto && s.dishId);
  const esLegumbre = (id) => porId.has(id) && familiaProteica(porId.get(id)) === 'legumbre';
  const hayPrimeros = catalog.some((d) => d.rol === 'rotativo' && !vetoedIds.has(d.id) && esCompuestoLegumbre(d))
    || colocados.some((s) => porId.has(s.dishId) && esCompuestoLegumbre(porId.get(s.dishId)));
  if (!hayPrimeros) {
    registrar('dias_legumbre_sin_sorteo',
      'el catalogo del perfil no tiene ningun plato compuesto de legumbre: no se sortean dias de legumbre y el paso 4 sigue como en D-024');
    return null;
  }
  const suelo = DEFAULT_WEEKLY_TARGETS.legumbre;
  const rng = mulberry32(seedFromString(`${seed}::walk::estructura`));
  const libres = new Set(p1aSlots.filter((s) => s.fixedRole === 'libre').map((s) => s.day));
  const delAncla = new Set(colocados.map((s) => s.day));
  const legAncla = colocados.filter((s) => s.momento === 'comida' && esLegumbre(s.dishId)).map((s) => DAYS_ORDER.indexOf(s.day));
  const elegibles = DAYS_ORDER.map((d, i) => i)
    .filter((i) => !libres.has(DAYS_ORDER[i]) && !delAncla.has(DAYS_ORDER[i]) && !legAncla.some((j) => Math.abs(j - i) === 1));
  const pedidos = Math.max(0, suelo - legAncla.length);
  let elegidos = [];
  let validos = 0;
  for (let n = pedidos; n >= 1; n--) {
    const c = conjuntosSinSeguidos(elegibles, n);
    if (c.length) { validos = c.length; elegidos = c[Math.floor(rng() * c.length)]; break; }
  }
  const dias = elegidos.map((i) => DAYS_ORDER[i]);
  registrar('dias_legumbre_sorteados',
    `suelo de legumbre ${suelo}; ${legAncla.length} ya las pone el ancla; se sortean ${pedidos} dias entre ${validos} conjuntos validos `
      + `(sin el dia libre, sin dias seguidos, sin los dias del ancla) con RNG «::walk::estructura»: [${dias.join(', ')}]`,
    { dias, pedidos });
  return { dias: new Set(dias), rng };
}
