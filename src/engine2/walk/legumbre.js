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
import {
  familiaProteica, proteinaPrincipal, esCompuestoLegumbre, TOPE_PROTEINA_SEMANA,
} from '../dishes/bases.js';

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
  // La evidencia dice los dias realmente sorteados: si no caben los pedidos (el
  // ancla ocupa dias, sin dos seguidos), se sortean menos (D-117.1).
  const n = dias.length;
  const dicho = (k) => (k === 1 ? '1 dia' : `${k} dias`);
  const cuantos = n === pedidos
    ? ''
    : n === 0 ? `se piden ${dicho(pedidos)}, pero no cabe ningun dia; ` : `se piden ${dicho(pedidos)}, pero solo ${n === 1 ? 'cabe' : 'caben'} ${n}; `;
  const sorteo = n ? `se ${n === 1 ? 'sortea' : 'sortean'} ${dicho(n)} entre ${validos} conjuntos validos de ${n}` : 'no se sortea ninguno';
  registrar('dias_legumbre_sorteados',
    `suelo de legumbre ${suelo}; ${legAncla.length} ya las pone el ancla; ${cuantos}${sorteo} `
      + `(sin el dia libre, sin dias seguidos, sin los dias del ancla) con RNG «::walk::estructura»: [${dias.join(', ')}]`,
    { dias, pedidos, sorteados: n });
  return { dias: new Set(dias), rng };
}

/** Clave del segundo de la comida de `day` en el mapa de huecos del walk. */
export const claveSegundo = (day) => `${day}::comida::segundo`;

/**
 * Segundo de un primero de legumbre ya colocado en la comida de `day` (D-116).
 *
 * Candidatos: platos rotativos que valen de segundo (compuesto de proteina con
 * verdura, sin cereal, de ave o carne), sin usar en la semana ni en la
 * anterior y sin vetar. En el catalogo son platos de cena: aqui se admiten en
 * la comida. Pasan por los mismos filtros que cualquier hueco y en el mismo
 * orden, cada uno con su vuelta atras: tope por especie, separacion por
 * especie, familia en dias seguidos y alino; despues el paso 5 (identidad de
 * verdura) y el azar sembrado («::walk::estructura»). El paso 4 no lo dirige.
 *
 * Si ningun candidato cumple el tope de 2 por especie, la legumbre va como
 * plato unico (D-116.4). El segundo se guarda en el mapa de huecos del walk
 * con una clave propia: asi los huecos siguientes lo ven como un plato mas
 * (no repetir, tope, separacion, familia, alino) sin ser uno de los 14 huecos.
 * Quien llama registra su consumo.
 * @returns {object|null} el plato elegido, o null si la legumbre va como plato unico
 */
export function elegirSegundo({
  rng, primero, day, i, slots, catalog, usedIds, usedNames, recientes, vetoedIds, sinFamilia, uso,
  proteinaDe, familiaDe, alinoDe, topeProteina, topeAjillo, esSegundo, nivelIdentidad, decisionLog, registrar,
}) {
  const nombrePrimero = primero.nombre || primero.id;
  let pool = catalog.filter((d) => d.rol === 'rotativo' && esSegundo(d) && !usedIds.has(d.id) && !usedNames.has(d.nombre || d.id)
    && !vetoedIds.has(d.id) && !recientes.has(d.nombre || d.id));
  if (!pool.length) {
    registrar(day, 'segundo_sin_candidato', `«${nombrePrimero}» se queda sin segundo: ningun plato de proteina con verdura disponible (sin usar en la semana ni en la anterior)`);
    return null;
  }
  const puestos = [...slots.values()].filter((s) => !s.abierto && s.dishId);
  const dist = (s) => Math.abs(DAYS_ORDER.indexOf(s.day) - i);
  const notas = [];
  const filtrar = (nombre, pred, detalle) => {
    const f = pool.filter(pred);
    if (f.length === pool.length) return false;
    if (f.length) { notas.push(`${nombre}: descarta ${pool.length - f.length} candidatos${detalle ? ` de ${detalle}` : ''}`); pool = f; return true; }
    notas.push(`${nombre} sin aplicar: dejaria el segundo sin candidatos`);
    return false;
  };

  const cuenta = new Map();
  for (const s of puestos) { const pr = proteinaDe(s.dishId); if (pr) cuenta.set(pr, (cuenta.get(pr) || 0) + 1); }
  const bajoTope = (d) => (cuenta.get(proteinaDe(d.id)) || 0) < topeProteina;
  if (!pool.some(bajoTope)) {
    registrar(day, 'segundo_sin_tope_plato_unico', `«${nombrePrimero}» va como plato unico: ningun segundo disponible cumple el tope de proteina (${topeProteina}/semana)`);
    return null;
  }
  filtrar(`tope de proteina (${topeProteina}/semana)`, bajoTope);

  const cercanas = new Set(puestos.filter((s) => dist(s) <= 1).map((s) => proteinaDe(s.dishId)).filter(Boolean));
  filtrar('proteina separada', (d) => !cercanas.has(proteinaDe(d.id)), [...cercanas].join(', '));

  if (!sinFamilia) {
    const familias = new Set(puestos.filter((s) => dist(s) === 1 && !(s.fixedRole === 'libre' && s.momento === 'comida'))
      .map((s) => familiaDe(s.dishId)).filter(Boolean));
    if (filtrar('familia en dias seguidos', (d) => !familias.has(familiaDe(d.id)), [...familias].join(', '))) uso.familiaDescarto = true;
  }

  const alinosHoy = new Set();
  let ajillos = 0;
  for (const s of puestos) {
    const al = alinoDe(s.dishId);
    if (!al) continue;
    if (s.day === day) alinosHoy.add(al);
    if (al === 'ajillo') ajillos += 1;
  }
  filtrar('alino', (d) => { const al = alinoDe(d.id); return !al || (!alinosHoy.has(al) && !(al === 'ajillo' && ajillos >= topeAjillo)); });

  const { nivel, causa: causaIdentidad } = nivelIdentidad(pool);
  const k = Math.floor(rng() * nivel.length);
  const elegido = nivel[k];
  slots.set(claveSegundo(day), {
    day, momento: 'comida', dishId: elegido.id, abierto: false, segundo: true, primero: primero.id,
  });
  usedIds.add(elegido.id);
  usedNames.add(elegido.nombre || elegido.id);
  decisionLog.push({
    decisionId: `walk-select-${decisionLog.length}`,
    day,
    momento: 'comida_segundo',
    plato: elegido.id,
    primero: primero.id,
    causa: 'segundo_de_legumbre',
    evidencia: `«${nombrePrimero}» no va como plato unico: segundo de proteina con verdura; ${notas.join('; ')}${notas.length ? '; ' : ''}`
      + `RNG «::walk::estructura» -> indice ${k} de ${nivel.length} candidatos${causaIdentidad ? ' tras el paso 5' : ''}`,
    alternativasDescartadas: nivel.filter((d) => d.id !== elegido.id).map((d) => d.id),
  });
  return elegido;
}

/**
 * Infracciones de D-099.3 de una semana ya elegida, con los segundos dentro
 * (D-116.5). Se mira sobre los platos SERVIDOS: sin la sugerencia de la comida
 * libre. Devuelve una lista de textos; vacia si la semana cumple.
 *   - plato repetido en la semana, o de la semana anterior (por nombre visible);
 *   - una especie (proteina principal) mas de 2 veces;
 *   - una especie dos veces el mismo dia, o en dias seguidos (salvo cuando
 *     las dos apariciones son platos del ancla);
 *   - legumbre en la cena.
 * Es una comprobacion (filtro booleano), no una medida que decida entre semanas.
 * @param {{catalog: ReadonlyArray<object>, platosRecientes?: string[]}} input
 * @param {{slots: object[], segundos: object[], decisionLog: object[]}} resultado
 * @returns {string[]}
 */
export function infraccionesD099(input, resultado) {
  const porId = new Map(input.catalog.map((d) => [d.id, d]));
  const nombre = (id) => (porId.get(id) && porId.get(id).nombre) || id;
  const anclas = new Set(resultado.decisionLog
    .filter((e) => typeof e.causa === 'string' && e.causa.startsWith('ancla_base') && e.day && e.momento)
    .map((e) => `${e.day}::${e.momento}`));
  const servidos = resultado.slots
    .filter((s) => s.dishId && !(s.fixedRole === 'libre' && s.momento === 'comida'))
    .map((s) => ({ day: s.day, momento: s.momento, id: s.dishId, ancla: anclas.has(`${s.day}::${s.momento}`) }));
  for (const s of resultado.segundos || []) servidos.push({ day: s.day, momento: 'comida', id: s.dishId, ancla: false });

  const out = [];
  const nombres = servidos.map((s) => nombre(s.id));
  const repetidos = nombres.filter((n, k) => nombres.indexOf(n) !== k);
  if (repetidos.length) out.push(`plato repetido: ${[...new Set(repetidos)].join(', ')}`);
  const recientes = new Set((input.platosRecientes || []).map(nombre));
  const anteriores = nombres.filter((n) => recientes.has(n));
  if (anteriores.length) out.push(`plato de la semana anterior: ${anteriores.join(', ')}`);

  const especie = (s) => (porId.has(s.id) ? proteinaPrincipal(porId.get(s.id)) : null);
  const veces = new Map();
  for (const s of servidos) { const e = especie(s); if (e) veces.set(e, (veces.get(e) || 0) + 1); }
  const sobreTope = [...veces].filter(([, n]) => n > TOPE_PROTEINA_SEMANA);
  if (sobreTope.length) out.push(`especie mas de ${TOPE_PROTEINA_SEMANA} veces: ${sobreTope.map(([e, n]) => `${e} ${n}`).join(', ')}`);

  for (let i = 0; i < DAYS_ORDER.length; i++) {
    const hoy = servidos.filter((s) => s.day === DAYS_ORDER[i]);
    const esp = hoy.map(especie).filter(Boolean);
    const dobles = esp.filter((e, k) => esp.indexOf(e) !== k);
    if (dobles.length) out.push(`${DAYS_ORDER[i]}: ${[...new Set(dobles)].join(', ')} dos veces el mismo dia`);
    if (i === DAYS_ORDER.length - 1) continue;
    const manana = servidos.filter((s) => s.day === DAYS_ORDER[i + 1]);
    for (const e of new Set(esp)) {
      const h = hoy.filter((s) => especie(s) === e);
      const m = manana.filter((s) => especie(s) === e);
      if (m.length && !(h.some((s) => s.ancla) && m.some((s) => s.ancla))) out.push(`${e} en ${DAYS_ORDER[i]} y ${DAYS_ORDER[i + 1]}`);
    }
  }

  const cenaLegumbre = servidos.filter((s) => s.momento === 'cena' && porId.has(s.id) && familiaProteica(porId.get(s.id)) === 'legumbre');
  if (cenaLegumbre.length) out.push(`legumbre en la cena: ${cenaLegumbre.map((s) => s.day).join(', ')}`);
  return out;
}
