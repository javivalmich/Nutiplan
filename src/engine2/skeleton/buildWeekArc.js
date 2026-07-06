// Constructor de weekArc - Fase 3, Checkpoint 3A/3B. Entrada: {profile,
// seed, strategy}. Salida: {weekArc, decisionLog}. Stateless (R4): no
// importa MemoryStore, no importa eval/.
//
// Orden de construccion (fijo, sin scoring, sin "mejor"):
//   0. Esqueleto (plantilla): elegido UNICAMENTE por seed entre A/B/C
//      (CP3B). Sin filtros. RNG con namespace propio, independiente del
//      de la eleccion de ancla -- cambiar uno no cambia el otro para la
//      misma seed.
//   1. Citas fijas (restricciones, primero): Sabado=libre, Domingo=familiar,
//      dias de entreno del perfil.
//   2. Ancla: eleccion UNICAMENTE por seed entre las referencias de CP2
//      SUPERVIVIENTES del veto de intolerancias (D-023, F4-P2b-i-bis) --
//      el filtrado ocurre ANTES del sorteo, el RNG nunca ve a los
//      vetados. Sin ningun otro filtro (ni estacion, ni estrategia, ni
//      temperatura). Cero supervivientes es un resultado VALIDO: la
//      presencia de ancla no es requisito de validez del plan (contrato
//      de ausencia, D-023) -- ver chooseAnchor.
//   3. Sobras/aprovechamiento: dentro de shelfLifeDays del ancla elegida,
//      pero NUNCA sobre un dia con fixedRole (libre/familiar/entreno) --
//      la cita fija (paso 1) tiene precedencia y el dia se SALTA, sin
//      compensar el hueco. shelfLifeDays es techo, no cuota: la ventana
//      puede quedar por debajo, incluso en cero.
//   3.5. Capricho (CP3C): recorre caprichoPreference de la plantilla
//      buscando el primer dia que NO sea fixedRole bloqueante NI este ya
//      ocupado por el ancla (cookDay o leftoverDays). A diferencia de las
//      sobras (que tienen techo de calendario), el capricho se DESPLAZA
//      por la lista declarada -- solo se trunca a cero si NINGUN dia
//      cumple las dos condiciones (perfil sin espacio, mismo caso limite
//      que el batch).
//   4. Densidad: leida de la plantilla elegida, ya escrita y valida por
//      construccion -- nunca calculada aqui.
//
// strategy es METADATO PASIVO: se copia al output, no decide nada
// estructural (ver test de desacople en tests/buildWeekArc.test.js).

import { DAYS_ORDER, isSameDay } from './days.js';
import { TEMPLATE_A } from './templateA.js';
import { TEMPLATE_B } from './templateB.js';
import { TEMPLATE_C } from './templateC.js';
import { mulberry32, seedFromString } from './rng.js';
import { ANCHORS } from '../dishes/anchors.js';
import { filterSurvivors } from '../walk/vetoes.js';
import { resolveDishComposition } from '../dishes/compositionResolver.js';

export const TEMPLATES = Object.freeze([TEMPLATE_A, TEMPLATE_B, TEMPLATE_C]);

function resolveSeed(seed) {
  return typeof seed === 'number' ? seed >>> 0 : seedFromString(String(seed));
}

/**
 * Esqueleto (plantilla A/B/C) elegido UNICAMENTE por seed. Sin filtros de
 * ningun tipo -- ni estrategia, ni estacion, ni nada del perfil. RNG con
 * namespace propio ("::skeleton") para que la eleccion de plantilla y la
 * eleccion de ancla sean independientes entre si para la misma seed
 * (cambiar el catalogo de anclas no afecta que plantilla sale, y
 * viceversa).
 */
function chooseSkeleton(seed, decisionLog) {
  const rng = mulberry32(resolveSeed(`${seed}::skeleton`));
  const index = Math.floor(rng() * TEMPLATES.length);
  const template = TEMPLATES[index];
  decisionLog.push({
    decisionId: `cp3a-${decisionLog.length}`,
    cause: 'eleccion_esqueleto_por_seed',
    evidence: `seed=${JSON.stringify(seed)} -> indice ${index} de ${TEMPLATES.length} plantillas (A/B/C, sin filtros)`,
    consequence: `esqueleto elegido: ${template.skeletonId}`,
  });
  return template;
}

/**
 * Citas fijas: Sabado=libre y Domingo=familiar son universales (no
 * dependen del perfil). Los dias de entreno SI vienen del perfil. Si un
 * dia de entreno declarado coincide con Sabado/Domingo, libre/familiar
 * tienen precedencia (el descanso no se sacrifica por un entreno mal
 * declarado) -- se registra como causa propia en el decision log.
 */
export function computeFixedRoles(profile, decisionLog) {
  const fixedRoles = {};
  let nextId = decisionLog.length;

  fixedRoles.Sabado = 'libre';
  decisionLog.push({
    decisionId: `cp3a-${nextId++}`,
    cause: 'cita_fija_libre',
    evidence: 'Sabado es siempre el dia libre del esqueleto (regla universal, no depende del perfil)',
    consequence: 'beats.Sabado.fixedRole = "libre"',
  });

  fixedRoles.Domingo = 'familiar';
  decisionLog.push({
    decisionId: `cp3a-${nextId++}`,
    cause: 'cita_fija_familiar',
    evidence: 'Domingo es siempre el cierre familiar del esqueleto (regla universal, no depende del perfil)',
    consequence: 'beats.Domingo.fixedRole = "familiar"',
  });

  const trainingDays = profile.trainingDays || [];
  for (const day of DAYS_ORDER) {
    if (fixedRoles[day]) continue; // libre/familiar ya tienen precedencia
    const declarado = trainingDays.find((td) => isSameDay(td, day));
    if (declarado) {
      fixedRoles[day] = 'entreno';
      decisionLog.push({
        decisionId: `cp3a-${nextId++}`,
        cause: 'cita_fija_entreno',
        evidence: `"${declarado}" esta en profile.trainingDays`,
        consequence: `beats.${day}.fixedRole = "entreno"`,
      });
    }
  }

  return fixedRoles;
}

/**
 * Vista de composicion de un ancla, resuelta por su identityKey (que ES
 * el dish.id real del catalogo, ver anchors.js/CompositionResolver). Punto
 * de wiring por defecto de chooseAnchor -- los tests pueden inyectar un
 * getVista sintetico (ver vetoes.js:filterSurvivors) para ejercer estados
 * hoy inalcanzables con el catalogo real.
 */
function anchorVista(anchor) {
  return resolveDishComposition({ id: anchor.identityKey });
}

/**
 * Ancla elegida UNICAMENTE por seed, entre las anclas SUPERVIVIENTES del
 * veto (D-023): el filtrado (paso 1, filterSurvivors) ocurre ANTES del
 * sorteo (paso 2) -- el RNG nunca ve a los vetados, por construccion, no
 * por descarte posterior (f17/f20). Sin veto activo (intolerancias vacio/
 * ausente), supervivientes === anchors (mismo orden, misma longitud): el
 * sorteo es byte-identico al camino pre-D-023 (f19).
 *
 * Cero supervivientes -> CONTRATO DE AUSENCIA (D-023): la presencia de un
 * ancla no es requisito de validez del plan. Se registra la ausencia y
 * sus consecuencias en una unica entrada del log, y se devuelve null --
 * el resto de buildWeekArc (batchDay/leftoverDays/beats) queda vacio por
 * construccion, no por rama especial (ver buildWeekArc()).
 * @param {ReadonlyArray<object>} anchors catalogo de anclas (ANCHORS en produccion)
 * @param {(number|string)} seed
 * @param {string[]} [intolerancias]
 * @param {object[]} decisionLog
 * @param {(anchor: object) => object} [getVista] inyeccion para tests (ver filterSurvivors)
 * @returns {object|null}
 */
export function chooseAnchor(anchors, seed, intolerancias, decisionLog, getVista = anchorVista) {
  const vetoActivo = Boolean(intolerancias && intolerancias.length > 0);
  const supervivientes = filterSurvivors(anchors, intolerancias, getVista);

  if (vetoActivo) {
    decisionLog.push({
      decisionId: `cp3a-${decisionLog.length}`,
      cause: 'veto_ancla_universo_reducido',
      evidence: `intolerancias=[${intolerancias.join(', ')}]; ${supervivientes.length} de ${anchors.length} anclas catalogadas sobreviven el veto `
        + '(D-023: un plato cuyo estado respecto al campo vetado es desconocido no puede demostrarse compatible con un requisito de exclusion)',
      consequence: supervivientes.length
        ? `sorteo restringido a ${supervivientes.length} anclas supervivientes`
        : 'cero supervivientes: sin sorteo posible',
    });
  }

  if (supervivientes.length === 0) {
    decisionLog.push({
      decisionId: `cp3a-${decisionLog.length}`,
      cause: 'ancla_ausente',
      evidence: `intolerancias=[${(intolerancias || []).join(', ')}]; 0 de ${anchors.length} anclas catalogadas sobreviven el veto -- `
        + 'ningun superviviente disponible para el sorteo por seed',
      consequence: 'semana sin ancla (D-023: la presencia de ancla no es requisito de validez): sin batchDay, sin leftoverDays, '
        + 'ningun beat con slotRole "ancla" (los dias que lo habrian sido degradan a rotativo/capricho por construccion); '
        + 'capricho, fixedRoles y vetos del walk operan con normalidad',
    });
    return null;
  }

  const rng = mulberry32(resolveSeed(seed));
  const index = Math.floor(rng() * supervivientes.length);
  const anchor = supervivientes[index];
  decisionLog.push({
    decisionId: `cp3a-${decisionLog.length}`,
    cause: 'eleccion_ancla_por_seed',
    evidence: vetoActivo
      ? `seed=${JSON.stringify(seed)} -> indice ${index} de ${supervivientes.length} anclas supervivientes del veto (de ${anchors.length} catalogadas)`
      : `seed=${JSON.stringify(seed)} -> indice ${index} de ${anchors.length} anclas catalogadas en CP2 (sin filtros)`,
    consequence: `ancla elegida: ${anchor.identityKey}`,
  });
  return anchor;
}

/**
 * batchDay resuelto recorriendo batchDayPreference (lista ESCRITA A MANO,
 * ver templateC.js) hasta el primer dia no bloqueante (libre/entreno --
 * familiar NO bloquea). NO es una busqueda del mejor dia en runtime: la
 * plantilla ya declaro el orden; aqui solo se recorre. Domingo cierra
 * siempre la lista como red de seguridad (familiar nunca bloquea), asi
 * que el recorrido siempre termina sin necesitar wraparound ciclico.
 */
function resolveBatchDay(batchDayPreference, fixedRoles, decisionLog) {
  const BLOCKING = new Set(['libre', 'entreno']);
  const primario = batchDayPreference[0];
  const batchDay = batchDayPreference.find((day) => !BLOCKING.has(fixedRoles[day]));

  if (batchDay === primario) {
    decisionLog.push({
      decisionId: `cp3a-${decisionLog.length}`,
      cause: 'batchday_de_plantilla',
      evidence: `plantilla C fija batchDay=${primario}; ningun fixedRole bloqueante en ese dia`,
      consequence: `batchDay efectivo = ${batchDay}`,
    });
  } else {
    decisionLog.push({
      decisionId: `cp3a-${decisionLog.length}`,
      cause: 'batchday_desplazado',
      evidence: `plantilla C fija batchDay=${primario} (fixedRole="${fixedRoles[primario]}" lo bloquea); `
        + `batchDayPreference declarado = [${batchDayPreference.join(', ')}]`,
      consequence: `batchDay efectivo = ${batchDay} (primer dia no bloqueante de la lista declarada)`,
    });
  }

  return batchDay;
}

/**
 * Sobras dentro de shelfLifeDays del ancla: dias 1..shelfLifeDays-1
 * despues del cookDay (el propio cookDay es "fresco", no sobra). Se
 * trunca al final de la semana -- no da la vuelta a la semana siguiente
 * (el arco es semanal).
 *
 * Dias con fixedRole (libre, familiar, entreno) son INTRANSITABLES para
 * sobras: la cita fija tiene precedencia sobre el aprovechamiento. Un dia
 * fijo dentro de la ventana se SALTA -- no se ocupa, no se compensa
 * desplazando el rango. shelfLifeDays es techo de calendario, no cuota:
 * la ventana efectiva puede quedar por debajo, incluso en cero, si todos
 * los dias candidatos son fijos.
 *
 * (Nota: el dia de entreno se trata COMPLETO como fijo aqui porque el
 * esqueleto actual no distingue comida/cena por dia -- beats[] tiene una
 * sola entrada por dia. Proteger solo la cena de entreno requeriria esa
 * granularidad, que no existe en F3 -- deuda registrada para F4.)
 */
export function computeLeftoverDays(cookDay, shelfLifeDays, fixedRoles, decisionLog) {
  const cookIdx = DAYS_ORDER.indexOf(cookDay);
  const leftoverDays = [];
  const saltados = [];
  for (let offset = 1; offset <= shelfLifeDays - 1 && cookIdx + offset < DAYS_ORDER.length; offset++) {
    const day = DAYS_ORDER[cookIdx + offset];
    if (fixedRoles[day]) {
      saltados.push(`${day} (fixedRole="${fixedRoles[day]}")`);
    } else {
      leftoverDays.push(day);
    }
  }
  decisionLog.push({
    decisionId: `cp3a-${decisionLog.length}`,
    cause: 'aprovechamiento_sobras',
    evidence: `cookDay=${cookDay}, shelfLifeDays=${shelfLifeDays} del ancla elegida`
      + (saltados.length ? `; saltados por ser dias fijos: ${saltados.join(', ')}` : ''),
    consequence: leftoverDays.length
      ? `sobras servidas en: ${leftoverDays.join(', ')}`
      : 'sin dias de sobra disponibles (truncado a cero: todos los dias candidatos eran fijos, o no quedaba semana)',
  });
  return leftoverDays;
}

/**
 * Capricho (CP3C): recorre caprichoPreference (lista ESCRITA A MANO, ver
 * templateA/B/C.js) hasta el primer dia que NO sea fixedRole bloqueante
 * (libre/entreno -- familiar NO bloquea, igual que en batchDay) Y que NO
 * este ya ocupado por el ancla (cookDay o cualquier leftoverDay). A
 * diferencia de las sobras, el capricho no tiene techo de calendario --
 * cualquier dia disponible le sirve -- asi que se DESPLAZA por la lista
 * declarada en vez de truncar al primer choque. Solo se trunca a cero si
 * NINGUN dia de la lista cumple ambas condiciones (perfil sin espacio,
 * mismo caso limite que el batch). Distingue "desplazado" de "truncado"
 * en la causa -- no son lo mismo.
 */
function chooseCapricho(caprichoPreference, fixedRoles, batchDay, leftoverDays, decisionLog) {
  // "Mismo invariante que las sobras": CUALQUIER fixedRole es
  // intransitable, incluido "familiar" -- a diferencia de batchDay (donde
  // familiar NUNCA bloquea, por ser la red de seguridad universal). El
  // capricho no tiene ese privilegio: si Domingo es familiar, el
  // capricho lo respeta igual que las sobras.
  const ocupados = new Set([batchDay, ...leftoverDays]);
  const primario = caprichoPreference[0];
  const capricho = caprichoPreference.find((day) => !fixedRoles[day] && !ocupados.has(day));

  if (!capricho) {
    decisionLog.push({
      decisionId: `cp3a-${decisionLog.length}`,
      cause: 'capricho_truncado',
      evidence: `caprichoPreference declarado = [${caprichoPreference.join(', ')}]; ningun dia esta libre de fixedRole bloqueante y sin ocupar por el ancla (batchDay=${batchDay}, leftoverDays=[${leftoverDays.join(', ')}])`,
      consequence: 'sin dia de capricho disponible (truncado a cero: perfil sin espacio)',
    });
  } else if (capricho === primario) {
    decisionLog.push({
      decisionId: `cp3a-${decisionLog.length}`,
      cause: 'capricho_de_plantilla',
      evidence: `plantilla fija caprichoDay=${primario}; ningun fixedRole bloqueante ni ocupacion del ancla en ese dia`,
      consequence: `capricho realizado en ${capricho}`,
    });
  } else {
    const razonPrimario = fixedRoles[primario] ? `fixedRole="${fixedRoles[primario]}"` : 'ocupado por el ancla (cookDay o sobra)';
    decisionLog.push({
      decisionId: `cp3a-${decisionLog.length}`,
      cause: 'capricho_desplazado',
      evidence: `plantilla fija caprichoDay=${primario} (bloqueado: ${razonPrimario}); `
        + `caprichoPreference declarado = [${caprichoPreference.join(', ')}]`,
      consequence: `capricho realizado en ${capricho} (primer dia disponible de la lista declarada)`,
    });
  }

  return capricho;
}

/**
 * @param {{profile: object, seed: (number|string), strategy: string}} input
 * @returns {{weekArc: object, decisionLog: object[]}}
 */
export function buildWeekArc({ profile, seed, strategy }) {
  const decisionLog = [];

  // 0. Esqueleto (plantilla A/B/C) por seed, sin filtros.
  const template = chooseSkeleton(seed, decisionLog);

  // 1. Citas fijas (restricciones, primero).
  const fixedRoles = computeFixedRoles(profile, decisionLog);

  // 2. Ancla por seed, filtrada por veto (D-023) antes del sorteo. Puede
  // no haber superviviente -- ver contrato de ausencia en chooseAnchor.
  const intolerancias = profile?.intolerances ?? [];
  const anchor = chooseAnchor(ANCHORS, seed, intolerancias, decisionLog);

  // batchDay/leftoverDays solo tienen sentido si hay algo que cocinar: sin
  // ancla superviviente, ambos quedan vacios por construccion (D-023,
  // contrato de ausencia), no por rama especial -- el resto de la cascada
  // (capricho, beats) ya esta escrito para tolerar batchDay=undefined.
  const batchDay = anchor
    ? resolveBatchDay(template.batchDayPreference, fixedRoles, decisionLog)
    : undefined;

  // 3. Sobras dentro de shelfLifeDays del ancla. Dias fijos (paso 1) son
  // intransitables: la cita fija tiene precedencia sobre la sobra.
  const leftoverDays = anchor
    ? computeLeftoverDays(batchDay, anchor.shelfLifeDays, fixedRoles, decisionLog)
    : [];
  const leftoverDaySet = new Set(leftoverDays);

  // 3.5. Capricho: recorre caprichoPreference; nunca pisa fixedRole ni el
  // arco del ancla (cookDay/leftoverDays) -- ver chooseCapricho.
  const caprichoDay = chooseCapricho(template.caprichoPreference, fixedRoles, batchDay, leftoverDays, decisionLog);

  // 4. beats[]: densidad de la plantilla elegida (nunca calculada en
  // runtime), fixedRole si aplica, slotRole segun relacion con el ancla
  // o el capricho.
  const beats = DAYS_ORDER.map((day) => {
    const isAnchorDay = day === batchDay;
    const isLeftoverDay = leftoverDaySet.has(day);
    const isCaprichoDay = day === caprichoDay;
    const slotRole = isAnchorDay || isLeftoverDay ? 'ancla' : isCaprichoDay ? 'capricho' : 'rotativo';

    const beat = {
      day,
      ...(fixedRoles[day] ? { fixedRole: fixedRoles[day] } : {}),
      slotRole,
      ...(slotRole === 'ancla' ? { anchorRef: anchor.identityKey } : {}),
      density: template.density[day],
    };

    let cause;
    let evidence;
    if (isAnchorDay) {
      cause = 'beat_dia_ancla';
      evidence = `${day} es el batchDay efectivo; densidad de plantilla ${template.skeletonId} = "${template.density[day]}"`;
    } else if (isLeftoverDay) {
      cause = 'beat_dia_sobra';
      evidence = `${day} cae dentro de shelfLifeDays del ancla cocinada en ${batchDay}`;
    } else if (isCaprichoDay) {
      cause = 'beat_dia_capricho';
      evidence = `${day} es el dia de capricho resuelto (ver decision capricho_de_plantilla/capricho_desplazado); densidad de plantilla ${template.skeletonId} = "${template.density[day]}"`;
    } else if (fixedRoles[day]) {
      cause = 'beat_dia_fijo';
      evidence = `${day} tiene fixedRole="${fixedRoles[day]}" (ver cita fija); densidad de plantilla ${template.skeletonId} = "${template.density[day]}"`;
    } else {
      cause = 'beat_dia_rotativo';
      evidence = `${day} sin cita fija ni relacion con el ancla; densidad de plantilla ${template.skeletonId} = "${template.density[day]}"; slotRole="rotativo" vacio para F4`;
    }

    decisionLog.push({
      decisionId: `cp3a-${decisionLog.length}`,
      cause,
      evidence,
      consequence: JSON.stringify(beat),
    });

    return beat;
  });

  const weekArc = {
    skeletonId: template.skeletonId,
    strategy, // metadato pasivo: no participa en ninguna decision de arriba
    ...(anchor ? { batchDay } : {}), // ausencia estructural (D-023), no valor centinela -- ver "sin batchDay"
    anchors: anchor ? [{ anchorId: anchor.identityKey, cookDay: batchDay, leftoverDays }] : [],
    beats,
  };

  return { weekArc, decisionLog };
}

/**
 * Invariante: en ningun weekArc puede haber un dia que sea a la vez
 * fixedRole (libre/familiar/entreno) y dia de SOBRA (leftover) del
 * ancla. La cita fija tiene precedencia (paso 1 antes que paso 3) -- si
 * esto se rompe, computeLeftoverDays dejo de respetar la jerarquia.
 * Lanza con el dia y el fixedRole en conflicto, no elige cual prevalece.
 * @param {object} weekArc
 * @returns {true}
 */
export function assertNoFixedRoleSobraContradiction(weekArc) {
  const leftoverDaySet = new Set(weekArc.anchors.flatMap((a) => a.leftoverDays));
  const conflictos = weekArc.beats.filter((b) => b.fixedRole && leftoverDaySet.has(b.day));
  if (conflictos.length) {
    throw new Error(
      `Contradiccion fixedRole/sobra en: ${conflictos.map((b) => `${b.day} (fixedRole="${b.fixedRole}")`).join(', ')}`
    );
  }
  return true;
}

/**
 * Invariante (CP3C): ningun dia con slotRole="capricho" puede tener
 * tambien fixedRole, ni coincidir con el cookDay o un leftoverDay del
 * ancla. El capricho se resuelve DESPUES de ancla+sobras precisamente
 * para que esto sea imposible por construccion -- este invariante lo
 * verifica, no lo decide.
 * @param {object} weekArc
 * @returns {true}
 */
export function assertNoCaprichoCollision(weekArc) {
  const ocupadosPorAncla = new Set(weekArc.anchors.flatMap((a) => [a.cookDay, ...a.leftoverDays]));
  const conflictos = weekArc.beats.filter((b) => b.slotRole === 'capricho' && (b.fixedRole || ocupadosPorAncla.has(b.day)));
  if (conflictos.length) {
    throw new Error(
      `Contradiccion capricho/ocupacion en: ${conflictos.map((b) => `${b.day} (fixedRole="${b.fixedRole || 'ninguno'}", ocupadoPorAncla=${ocupadosPorAncla.has(b.day)})`).join(', ')}`
    );
  }
  return true;
}
