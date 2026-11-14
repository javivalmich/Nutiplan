// Lógica de la medición «primero de legumbre y segundo de proteína» (MEDICIÓN, no producto).
// La instala el medidor en globalThis.__ec; la llama el código de src/ transformado en memoria
// por estructuraComida.mjs. Solo filtros, prioridades ordenadas y desempate con RNG sembrado.
//
// Reglas medidas (supuestos fijados por Javi el 2026-11-14 y los que hubo que cerrar para medir):
//   - Días de legumbre: se sortean con la semilla (RNG propio «::walk::estructura») entre los
//     conjuntos válidos de N días: ni el día de la comida libre, ni dos días seguidos, ni un día
//     donde el ancla ya colocó un plato. Las legumbres del ancla cuentan para los N.
//   - En la comida de un día sorteado el nivel de legumbre va antes que la verdura del día. Fuera
//     de esos días el suelo semanal de legumbre no actúa, y el día anterior y el siguiente a uno
//     sorteado no llevan legumbre a la comida (si quedan candidatos).
//   - Primero: un compuesto de la plantilla «legumbre» (alcance «todas») o solo los de lentejas
//     (alcance «lentejas»). Los platos redactados de legumbre no cambian: siguen como plato único.
//   - Segundo: un compuesto «proteína con verdura» sin cereal (plantilla caliente_clasico, C vacío),
//     de ave o carne (y de pescado o marisco si se permite); nunca de huevo. En el catálogo todos
//     son platos de cena: aquí se admiten en la comida. Pasa por los mismos filtros que cualquier
//     hueco (plato no repetido, semana anterior, tope y separación por especie, familia en días
//     seguidos, aliño) y por el paso 5; el paso 4 no lo dirige. Cuenta como consumo.
//   - Raciones: los dos platos son una sola comida. El primero parte de media ración (legumbre
//     50 g en seco, que es el mínimo de su rango; verdura y aceite a la mitad) y la legumbre se
//     ajusta con tope en lo que el plato único recibe a 2174 kcal.
const R = new URL('../../../', import.meta.url).href;
const { resolveDishComposition } = await import(R + 'src/engine2/dishes/compositionResolver.js');
const { proteinaPrincipal, familiaProteica, TOPE_PROTEINA_SEMANA } = await import(R + 'src/engine2/dishes/bases.js');
const { alinoDe, TOPE_AJILLO_SEMANA } = await import(R + 'src/engine2/dishes/alinosD105.js');
const { chooseIdentityLevel, registerConsumption } = await import(R + 'src/engine2/walk/frequencies.js');
const { DAYS_ORDER } = await import(R + 'src/engine2/skeleton/days.js');
const { mulberry32, seedFromString } = await import(R + 'src/engine2/skeleton/rng.js');
const { componerPlato, recomponer, tuplaDe } = await import(R + 'src/plan/textos/componer.js');
const { escribirCompuesto } = await import(R + 'src/plan/textos/compuestos.js');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { INGREDIENTES } = await import(R + 'src/engine2/nutrientes/ingredientes.js');
const { rangoDe, AMPLITUD_MAX, KCAL_RACION_NORMAL } = await import(R + 'src/engine2/nutrientes/raciones.js');

const famMemo = new Map();
export function familia(d) {
  if (!famMemo.has(d.id)) { let f = null; try { f = resolveDishComposition(d).proteinType || null; } catch { f = null; } famMemo.set(d.id, f); }
  return famMemo.get(d.id);
}
export const esLegumbre = (d) => familia(d) === 'legumbre';
export const esCompuestoLegumbre = (d) => { const t = tuplaDe(d.id); return !!t && t.tmpl === 'legumbre'; };
const minuscula = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/** Combina primero y segundo, ya escritos, en una sola comida (los dos platos en p1 y p2). */
function combinar(P, S, resto) {
  return {
    ...resto,
    p1: `De primero: ${[P.p1, P.p2].filter(Boolean).join(' · ')}`,
    p2: `De segundo: ${[S.p1, S.p2].filter(Boolean).join(' · ')}`,
    shopping: [...(P.shopping || []), ...(S.shopping || [])],
    recipe: [`De primero, ${minuscula(P.title)}:`, ...(P.recipe || []), `De segundo, ${minuscula(S.title)}:`, ...(S.recipe || [])],
  };
}

/**
 * Comida con primero y segundo, antes de ajustar raciones.
 * @param {object} actual comida del plan que hoy ocupa el hueco (el primero como plato único)
 * @param {number} tope gramos en seco de legumbre del plato único a 2174 kcal
 */
export function construirPS(actual, primero, segundo, kcal, tope) {
  const base = actual._base || actual;
  const P0 = componerPlato(primero, 'comida', kcal, { ancla: base._ancla || null });
  const g = P0._componer.gramos;
  const mitad = (x, min = 0) => Math.max(min, Math.round(x / 2 / 5) * 5);
  const gramos = { ...g, P: mitad(g.P, 50), ...(g.C != null ? { C: mitad(g.C) } : {}), ...(g.V != null ? { V: mitad(g.V) } : {}), ...(g.V2 != null ? { V2: mitad(g.V2) } : {}), aove: mitad(g.aove || 15, 5) };
  const componer = { ...P0._componer, gramos };
  const t = escribirCompuesto({ ...componer, ancla: P0._ancla || null });
  const P = { ...P0, title: t.title, p1: t.p1, p2: t.p2, shopping: t.shopping, recipe: t.recipe, _componer: componer };
  const S = componerPlato(segundo, 'comida', kcal);
  const n1 = leerComida(P).items.length;
  const meal = combinar(P, S, {
    time: 'Comida', emoji: P.emoji, title: `${primero.nombre}; de segundo, ${minuscula(segundo.nombre)}`, metadata: P.metadata,
    _motor: 'engine2', _dishId: primero.id, _dishId2: segundo.id,
    ...(actual._causa ? { _causa: actual._causa } : {}), ...(actual.slotNote ? { slotNote: actual.slotNote } : {}), ...(P._ancla ? { _ancla: P._ancla } : {}),
    _ps: { primero: P, segundo: S, n1, tope },
  });
  const junto = leerComida(meal).items;
  const sueltos = [...leerComida(P).items, ...leerComida(S).items];
  if (junto.length !== sueltos.length || junto.some((it, k) => it.clave !== sueltos[k].clave || Math.abs(it.gramos - sueltos[k].gramos) > 0.01)) {
    throw new Error(`construirPS: la compra de los dos platos no se relee igual junta que por separado (${primero.nombre} + ${segundo.nombre})`);
  }
  return meal;
}

export function instalar(flags) {
  const FAMILIAS_SEGUNDO = new Set(['ave', 'carne', ...(flags.pescado ? ['pescado', 'marisco'] : [])]);
  const esPrimero = (d) => { const t = tuplaDe(d.id); return !!t && t.tmpl === 'legumbre' && (flags.alcance === 'todas' || t.P === 'lentejas'); };
  const esNivelDia = (d) => (flags.alcance === 'todas' ? esCompuestoLegumbre(d) : esLegumbre(d));
  const esSegundo = (d) => { const t = tuplaDe(d.id); return !!t && t.tmpl === 'caliente_clasico' && !t.C && FAMILIAS_SEGUNDO.has(familia(d)); };
  const evento = (log, day, causa, evidencia, extra = {}) => log.push({ decisionId: `walk-select-${log.length}`, day, momento: undefined, plato: undefined, causa, evidencia, alternativasDescartadas: [], evento: true, ...extra });

  globalThis.__ec = {
    flags,
    activo: (profile) => !flags.off && profile?.dieta !== 'vegetariana' && profile?.dieta !== 'vegana',

    /** Sorteo de los días de legumbre (una vez por walk; determinista con la semilla). */
    inicio({ p1aSlots, seed, decisionLog }) {
      const rng = mulberry32(seedFromString(`${seed}::walk::estructura`));
      const idx = (day) => DAYS_ORDER.indexOf(day);
      const libres = new Set(p1aSlots.filter((s) => s.fixedRole === 'libre').map((s) => s.day));
      const delAncla = new Set(p1aSlots.filter((s) => !s.abierto && s.dishId).map((s) => s.day));
      const legAncla = p1aSlots.filter((s) => !s.abierto && s.dishId && s.momento === 'comida' && esLegumbre({ id: s.dishId })).map((s) => idx(s.day));
      const elegibles = DAYS_ORDER.map((d, i) => i).filter((i) => !libres.has(DAYS_ORDER[i]) && !delAncla.has(DAYS_ORDER[i]) && !legAncla.some((j) => Math.abs(j - i) === 1));
      const conjuntos = (n) => {
        const out = [];
        const rec = (desde, acc) => {
          if (acc.length === n) { out.push(acc); return; }
          for (let k = desde; k < elegibles.length; k++) if (!acc.some((a) => Math.abs(a - elegibles[k]) === 1)) rec(k + 1, [...acc, elegibles[k]]);
        };
        rec(0, []);
        return out;
      };
      const pedidos = Math.max(0, flags.suelo - legAncla.length);
      let elegidos = [];
      let validos = 1;
      for (let n = pedidos; n >= 1; n--) {
        const c = conjuntos(n);
        if (c.length) { validos = c.length; elegidos = c[Math.floor(rng() * c.length)]; break; }
      }
      const dias = elegidos.map((i) => DAYS_ORDER[i]);
      evento(decisionLog, undefined, 'dias_legumbre_sorteados',
        `suelo de legumbre ${flags.suelo}; ${legAncla.length} ya las pone el ancla; se sortean ${pedidos} dias entre ${validos} conjuntos validos `
        + `(sin el dia libre, sin dias seguidos, sin los dias del ancla) con RNG «::walk::estructura»: [${dias.join(', ')}]`, { dias, pedidos });
      return { dias: new Set(dias), rng, decisionLog };
    },

    /** Paso 4 con los días de legumbre: devuelve una función con la firma de chooseFrequencyLevel. */
    nivelFn(ctx, momento, original) {
      return (input) => {
        const { day, candidatesB, state } = input;
        // Fuera de los días sorteados el suelo semanal de legumbre no actúa (ni a la comida ni a la cena).
        const neutro = { ...state, contadores: { ...state.contadores, legumbre: Infinity } };
        if (momento !== 'comida') return original({ ...input, state: neutro });
        if (ctx.dias.has(day)) {
          const nivel = candidatesB.filter(esNivelDia);
          if (nivel.length) {
            return { nivel, causa: 'dia_legumbre_sorteado', evidencia: `paso 4: ${day} es dia de legumbre (sorteado con la semilla); nivel preferente = ${nivel.length} candidatos de ${candidatesB.length} post-A/B, antes que la verdura del dia` };
          }
          evento(ctx.decisionLog, day, 'dia_legumbre_sin_candidato', `${day} es dia de legumbre, pero ningun candidato post-A/B (${candidatesB.length}) es de legumbre; el hueco sigue con el paso 4 de siempre`);
          return original({ ...input, state: neutro });
        }
        const i = DAYS_ORDER.indexOf(day);
        const vecino = [i - 1, i + 1].some((j) => j >= 0 && j < DAYS_ORDER.length && ctx.dias.has(DAYS_ORDER[j]));
        let base = candidatesB;
        if (vecino) { const sin = candidatesB.filter((d) => !esLegumbre(d)); if (sin.length && sin.length < candidatesB.length) base = sin; }
        const r = original({ ...input, candidatesB: base, state: neutro });
        if (base !== candidatesB) return { ...r, causa: r.causa || 'vecino_de_dia_legumbre', evidencia: `${r.evidencia ? `${r.evidencia}; ` : 'paso 4: '}sin legumbre: el dia de al lado es dia de legumbre (${candidatesB.length - base.length} candidatos a nivel inferior)` };
        return r;
      };
    },

    /** Segundo de un primero de legumbre ya colocado en la comida de `day`. */
    segundo(ctx, primeroId, a) {
      const { day, i, slot, slots, catalog, usedIds, usedNames, recientes, vetoedIds, freqState, fuenteEditorial, sinFamilia, uso, decisionLog } = a;
      const clave = `${day}::comida::segundo`;
      if (slot.fixedRole === 'libre' || slots.has(clave)) return;
      const porId = (id) => catalog.find((d) => d.id === id);
      const primero = porId(primeroId);
      if (!primero || !esPrimero(primero)) return;
      let pool = catalog.filter((d) => d.rol === 'rotativo' && esSegundo(d) && !usedIds.has(d.id) && !usedNames.has(d.nombre || d.id) && !vetoedIds.has(d.id) && !recientes.has(d.nombre || d.id));
      if (!pool.length) {
        evento(decisionLog, day, 'segundo_sin_candidato', `«${primero.nombre}» se queda sin segundo: ningun plato de proteina con verdura disponible (sin usar en la semana ni en la anterior)`);
        return;
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
      for (const s of puestos) { const pr = proteinaPrincipal(porId(s.dishId)); if (pr) cuenta.set(pr, (cuenta.get(pr) || 0) + 1); }
      filtrar(`tope de proteina (${TOPE_PROTEINA_SEMANA}/semana)`, (d) => (cuenta.get(proteinaPrincipal(d)) || 0) < TOPE_PROTEINA_SEMANA);
      const cercanas = new Set(puestos.filter((s) => dist(s) <= 1).map((s) => proteinaPrincipal(porId(s.dishId))).filter(Boolean));
      filtrar('proteina separada', (d) => !cercanas.has(proteinaPrincipal(d)), [...cercanas].join(', '));
      if (!sinFamilia) {
        const familias = new Set(puestos.filter((s) => dist(s) === 1 && !(s.fixedRole === 'libre' && s.momento === 'comida')).map((s) => familiaProteica(porId(s.dishId))).filter(Boolean));
        if (filtrar('familia en dias seguidos', (d) => !familias.has(familiaProteica(d)), [...familias].join(', '))) uso.familiaDescarto = true;
      }
      const alinosHoy = new Set();
      let ajillos = 0;
      for (const s of puestos) { const al = alinoDe(porId(s.dishId)); if (!al) continue; if (s.day === day) alinosHoy.add(al); if (al === 'ajillo') ajillos += 1; }
      filtrar('alino', (d) => { const al = alinoDe(d); return !al || (!alinosHoy.has(al) && !(al === 'ajillo' && ajillos >= TOPE_AJILLO_SEMANA)); });
      const { nivel, causa: causaIdentidad } = chooseIdentityLevel({ candidatesFinal: pool, state: freqState, fuenteEditorial });
      const k = Math.floor(ctx.rng() * nivel.length);
      const elegido = nivel[k];
      slots.set(clave, { day, momento: 'comida', dishId: elegido.id, abierto: false, segundo: true });
      usedIds.add(elegido.id);
      usedNames.add(elegido.nombre || elegido.id);
      decisionLog.push({
        decisionId: `walk-select-${decisionLog.length}`, day, momento: 'comida_segundo', plato: elegido.id, primero: primero.id,
        causa: 'segundo_de_legumbre',
        evidencia: `«${primero.nombre}» no va como plato unico: segundo de proteina con verdura; ${notas.join('; ')}${notas.length ? '; ' : ''}`
          + `RNG «::walk::estructura» -> indice ${k} de ${nivel.length} candidatos${causaIdentidad ? ' tras el paso 5' : ''}`,
        alternativasDescartadas: nivel.filter((d) => d.id !== elegido.id).map((d) => d.id),
      });
      registerConsumption(freqState, elegido, day, undefined, fuenteEditorial); // el segundo se come: cuenta para suelos, verdura e identidad
    },

    /** Tope propio de la legumbre del primero (lo que recibe el plato único a 2174 kcal). */
    itemExtra(m, it, k, targetKcal) {
      if (k >= m._ps.n1 || !m._ps.tope || (INGREDIENTES[it.clave] || {}).grupo !== 'legumbre') return {};
      const rango = rangoDe(it.clave, 'g');
      if (!rango) return {};
      const amplitud = Math.min(AMPLITUD_MAX, Math.max(1, targetKcal / KCAL_RACION_NORMAL));
      return { ampliado: (m._ps.tope + 0.5) / amplitud - rango[1] };
    },

    /** Vuelve a escribir los dos platos con los gramos decididos (cada uno con su texto de engine2). */
    escribirPS(m, items) {
      const mapa = (xs) => { const mp = new Map(); for (const it of xs) if (!mp.has(it.clave)) mp.set(it.clave, it.despues); return mp; };
      const P = recomponer(m._ps.primero, mapa(items.slice(0, m._ps.n1)));
      const S = recomponer(m._ps.segundo, mapa(items.slice(m._ps.n1)));
      return combinar(P, S, m);
    },
  };
  return globalThis.__ec;
}
