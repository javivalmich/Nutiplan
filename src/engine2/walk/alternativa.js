// alternativa — elige el plato que sustituye a una comida o cena cuando el
// usuario pide una alternativa en la app («🔄 Alternativas»).
//
// Usa las mismas reglas que el menú de la semana (D-099), en el mismo orden
// que runWalk, y después el deseo del usuario:
//   1. Universo: platos del momento (comida/cena), no vetados por las
//      intolerancias, que no salen ya esta semana ni salieron la anterior
//      (por nombre visible), y distintos del plato que se quita.
//   2. Tope de proteína principal por semana y proteína separada (no el mismo
//      día ni el de al lado). Si dejarían sin candidatos, no se aplican y se
//      dice.
//   2b. Aliños (D-105): no el mismo aliño que el otro plato del día, y el
//      ajillo como mucho 2 veces por semana. Si dejaría sin candidatos, no se
//      aplica y se dice.
//   3. Si el plato que se quita era parte del ancla (cocinar en cantidad), se
//      prefieren los que llevan el mismo ingrediente base, para no romper el
//      aprovechamiento.
//   4. El deseo del usuario: más reconfortante, más ligero, más rápido o
//      «sorpréndeme» (otra proteína). Si ningún candidato lo cumple, se
//      relaja este filtro, nunca los anteriores.
//   5. Que se note el cambio: no el mismo plato con otra guarnición (misma
//      proteína y mismo tipo de plato), si hay otros.
//   6. Desempate con RNG sembrado.
// Ninguna puntuación; cada paso deja su causa.

import { DAYS_ORDER } from '../skeleton/days.js';
import { mulberry32, seedFromString } from '../skeleton/rng.js';
import { computeVetoUniverse } from './vetoes.js';
import { proteinaPrincipal, TOPE_PROTEINA_SEMANA, llevaBase } from '../dishes/bases.js';
import { alinoDe, TOPE_AJILLO_SEMANA } from '../dishes/alinosD105.js';

const CUCHARA = new Set(['legumbre', 'guiso', 'sopa_crema', 'arroz_plato', 'gratinado']);
const LIGERO = new Set(['ensalada', 'plancha_verdura', 'pescado_plancha', 'pescado_horno', 'bowl', 'crudo', 'sopa_crema']);

export const DESEOS = Object.freeze({
  comfort: { texto: 'más reconfortante (plato caliente de cuchara, guiso o arroz)', cumple: (d) => d.tempFeel !== 'frio' && (CUCHARA.has(d.plateType) || d.tempFeel === 'muy_caliente') },
  ligero: { texto: 'más ligero (ensalada, plancha con verdura, pescado, bowl o crema)', cumple: (d) => LIGERO.has(d.plateType) },
  rapido: { texto: 'más rápido de preparar (poca elaboración)', cumple: (d) => d.energiaCocina === 'bajo' },
  diferente: { texto: 'sorpréndeme (otra proteína)', cumple: (d, actual) => proteinaPrincipal(d) !== proteinaPrincipal(actual) },
});

/**
 * @param {object} input
 * @param {ReadonlyArray<object>} input.catalog catálogo ya ajustado (aplicarAjustesD099) y filtrado por el perfil
 * @param {{day:string, momento:'comida'|'cena', dishId:string|null}[]} input.semana platos de la semana en curso
 * @param {string} input.day día de la comida que se cambia (Lunes … Domingo, sin tildes)
 * @param {'comida'|'cena'} input.momento
 * @param {string} input.actualId plato que se quita
 * @param {string} [input.deseo] comfort | ligero | rapido | diferente
 * @param {string[]} [input.platosRecientes] platos de la semana anterior (ids o nombres)
 * @param {string[]} [input.intolerancias] las que engine2 sabe vetar (gluten, lactosa)
 * @param {string|null} [input.anclaBase] ingrediente base si el plato que se quita era del ancla
 * @param {string|number} input.seed
 * @returns {{ dish: object, decisionLog: object[] }}
 */
export function elegirAlternativa(input) {
  const { catalog, semana, day, momento, actualId, deseo, platosRecientes = [], intolerancias = [], anclaBase = null, seed } = input;
  const log = [];
  const nota = (causa, evidencia) => log.push({ decisionId: `alternativa-${log.length}`, day, momento, causa, evidencia });
  const porId = new Map(catalog.map((d) => [d.id, d]));
  const nombre = (id) => (porId.get(id) ? porId.get(id).nombre || id : id);
  const actual = porId.get(actualId) || null;
  const otros = semana.filter((s) => s.dishId && !(s.day === day && s.momento === momento));

  const usados = new Set(otros.map((s) => nombre(s.dishId)));
  if (actual) usados.add(actual.nombre || actual.id);
  const recientes = new Set(platosRecientes.map((x) => nombre(x)));
  const { vetoedIds } = computeVetoUniverse(catalog, intolerancias);

  const universo = catalog.filter((d) => d.rol !== 'capricho' && d.momento.includes(momento) && !vetoedIds.has(d.id)
    && !usados.has(d.nombre || d.id) && !recientes.has(d.nombre || d.id));
  if (!universo.length) throw new Error(`elegirAlternativa: sin platos posibles para ${day}/${momento}`);
  nota('alternativa_universo', `${universo.length} platos de ${momento}, sin repetir la semana ni la anterior${vetoedIds.size ? `, sin ${vetoedIds.size} vetados` : ''}`);

  // 2. Tope y separación de proteína (como runWalk).
  const cuenta = new Map();
  for (const s of otros) { const p = proteinaPrincipal(porId.get(s.dishId) || {}); if (p) cuenta.set(p, (cuenta.get(p) || 0) + 1); }
  let pool = universo;
  const conTope = pool.filter((d) => (cuenta.get(proteinaPrincipal(d)) || 0) < TOPE_PROTEINA_SEMANA);
  if (conTope.length) { if (conTope.length < pool.length) nota('alternativa_tope_proteina', `descarta ${pool.length - conTope.length} platos de proteínas que ya salen ${TOPE_PROTEINA_SEMANA} veces`); pool = conTope; } else nota('alternativa_tope_proteina_sin_aplicar', 'dejaría sin candidatos');
  const i = DAYS_ORDER.indexOf(day);
  const cercanas = new Set(otros.filter((s) => Math.abs(DAYS_ORDER.indexOf(s.day) - i) <= 1).map((s) => proteinaPrincipal(porId.get(s.dishId) || {})).filter(Boolean));
  const separados = pool.filter((d) => !cercanas.has(proteinaPrincipal(d)));
  if (separados.length) { if (separados.length < pool.length) nota('alternativa_proteina_separada', `descarta ${pool.length - separados.length} platos de ${[...cercanas].join(', ')} (ya salen ese día o el de al lado)`); pool = separados; } else nota('alternativa_proteina_separada_sin_aplicar', 'dejaría sin candidatos');

  // 2b. Aliños (D-105, como runWalk).
  const alinosHoy = new Set(otros.filter((s) => s.day === day).map((s) => alinoDe(porId.get(s.dishId) || {})).filter(Boolean));
  const ajillos = otros.filter((s) => alinoDe(porId.get(s.dishId) || {}) === 'ajillo').length;
  const conAlino = pool.filter((d) => { const al = alinoDe(d); return !al || (!alinosHoy.has(al) && !(al === 'ajillo' && ajillos >= TOPE_AJILLO_SEMANA)); });
  if (conAlino.length) { if (conAlino.length < pool.length) nota('alternativa_alino', `descarta ${pool.length - conAlino.length} platos por el aliño (${[alinosHoy.size ? `ya sale hoy: ${[...alinosHoy].join(', ')}` : '', ajillos >= TOPE_AJILLO_SEMANA ? `ajillo ya sale ${ajillos}/${TOPE_AJILLO_SEMANA} esta semana` : ''].filter(Boolean).join('; ')})`); pool = conAlino; } else nota('alternativa_alino_sin_aplicar', 'dejaría sin candidatos');

  // 3. Ancla.
  if (anclaBase) {
    const conBase = pool.filter((d) => llevaBase(d, anclaBase));
    if (conBase.length) { pool = conBase; nota('alternativa_mantiene_ancla', `${conBase.length} platos llevan ${anclaBase}: se mantiene el aprovechamiento`); } else nota('alternativa_rompe_ancla', `ningún candidato lleva ${anclaBase}: el plato nuevo no aprovecha lo cocinado`);
  }

  // 4. Deseo del usuario.
  const regla = deseo && DESEOS[deseo];
  if (regla) {
    const cumple = pool.filter((d) => regla.cumple(d, actual || {}));
    if (cumple.length) { pool = cumple; nota('alternativa_deseo', `${regla.texto}: ${cumple.length} platos`); } else nota('alternativa_deseo_relajado', `ningún candidato es ${regla.texto} sin romper las reglas del menú; se elige entre los ${pool.length} que las cumplen`);
  }

  // 4b. Que se note el cambio: fuera los que son el mismo plato con otra
  // guarnición (misma proteína principal y mismo tipo de plato).
  if (actual) {
    const pa = proteinaPrincipal(actual);
    const distintos = pool.filter((d) => !(proteinaPrincipal(d) === pa && d.plateType === actual.plateType));
    if (distintos.length && distintos.length < pool.length) { nota('alternativa_distinta', `descarta ${pool.length - distintos.length} platos que solo cambian la guarnición de «${actual.nombre}»`); pool = distintos; }
  }

  // 5. Desempate.
  const rng = mulberry32(seedFromString(`${seed}::alternativa::${day}::${momento}::${actualId}::${deseo || ''}`));
  const idx = pool.length === 1 ? 0 : Math.floor(rng() * pool.length);
  const dish = pool[idx];
  nota(pool.length === 1 ? 'alternativa_candidato_unico' : 'alternativa_desempate_rng', `«${dish.nombre}»${pool.length > 1 ? ` (índice ${idx} de ${pool.length})` : ''}`);
  return { dish, decisionLog: log };
}
