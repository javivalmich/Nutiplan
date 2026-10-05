// casos — lógica pura del generador de casos de Fase 7 (D-087, puntos 3 y 5).
//
// Sin imports y sin ejecutar motores: define los perfiles, su traducción a la
// entrada nativa de cada motor, las verificaciones por caso y la comprobación
// de semillas contra un registro. La ejecución de los motores y la escritura
// de archivos están en generarCasos.mjs.
//
// Este módulo sí conoce cada motor (nombres de día, día libre, estrategia):
// es el lado del productor, no el cegado.

export const GENERADOR_VERSION = 1;
export const ESTRATEGIA = 'mantenimiento_equilibrado';
export const SEMILLAS_EVALUACION = Object.freeze([1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010]);

// Perfil base: snapshot de legacy, verbatim de
// src/engine/tests/buildPlan.snapshot.test.js (PROFILE). trainingDays lo fija
// cada perfil experimental.
export const PERFIL_BASE_LEGACY = Object.freeze({
  weight: 74,
  goal: 'maintain',
  activity: 'moderate',
  intolerances: [],
  trainingDays: [],
  extras: {},
  mealsPerDay: 3,
  tiempoCocina: 'normal',
  experiencia: 'intermedio',
  simpleMode: false,
  dob: '1990-01-01',
  gender: 'male',
  height: 178,
});
export const TARGET_KCAL_LEGACY = 2000;
// Opciones del snapshot (BASE_OPTS), sin las funciones: saveMealMemory se
// sustituye por una función vacía y rng por mulberry32(semilla) al ejecutar.
export const OPCIONES_LEGACY = Object.freeze({
  month: 5,
  weekNumber: 23,
  pastProteins: {},
  freeFormPool: [],
});

// Traducción de cada campo del perfil base a cada motor. engine2 solo admite
// en su entrada trainingDays (en profile) y strategy (FIXTURE_INPUT de
// src/engine2/tests/materializePlan.test.js).
export const TRADUCCION_PERFIL_BASE = Object.freeze([
  { campo: 'weight', legacy: 'se pasa tal cual', engine2: 'no representable; no se pasa' },
  { campo: 'goal', legacy: 'se pasa tal cual ("maintain")', engine2: `equivale a strategy="${ESTRATEGIA}"; se verifica en la salida de ambos` },
  { campo: 'activity', legacy: 'se pasa tal cual', engine2: 'no representable; no se pasa' },
  { campo: 'intolerances', legacy: 'se pasa tal cual (vacío)', engine2: 'no representable; vacío en ambos' },
  { campo: 'trainingDays', legacy: 'según perfil, con nombres de día de legacy', engine2: 'según perfil, con nombres de día de engine2' },
  { campo: 'extras', legacy: 'se pasa tal cual (vacío)', engine2: 'no representable; no se pasa' },
  { campo: 'mealsPerDay', legacy: 'se pasa tal cual (3; el desayuno lo excluye el cegado)', engine2: 'no representable; engine2 emite comida y cena' },
  { campo: 'tiempoCocina', legacy: 'se pasa tal cual', engine2: 'no representable; no se pasa' },
  { campo: 'experiencia', legacy: 'se pasa tal cual', engine2: 'no representable; no se pasa' },
  { campo: 'simpleMode', legacy: 'se pasa tal cual', engine2: 'no representable; no se pasa' },
  { campo: 'dob', legacy: 'se pasa tal cual', engine2: 'no representable; no se pasa' },
  { campo: 'gender', legacy: 'se pasa tal cual', engine2: 'no representable; no se pasa' },
  { campo: 'height', legacy: 'se pasa tal cual', engine2: 'no representable; no se pasa' },
]);

const NOMBRE_DIA = Object.freeze({
  legacy: { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' },
  engine2: { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miercoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sabado', domingo: 'Domingo' },
});

export const PERFILES = Object.freeze({
  P1: Object.freeze({ entreno: Object.freeze(['lunes', 'miercoles', 'viernes']) }),
  P2: Object.freeze({ entreno: Object.freeze([]) }),
});

const clonar = (v) => JSON.parse(JSON.stringify(v));

export class CasoError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CasoError';
  }
}

function perfilDe(perfilId) {
  const p = PERFILES[perfilId];
  if (!p) throw new CasoError(`perfil desconocido: ${JSON.stringify(perfilId)}`);
  return p;
}

export function diasEntreno(perfilId, motor) {
  const nombres = NOMBRE_DIA[motor];
  if (!nombres) throw new CasoError(`motor desconocido: ${JSON.stringify(motor)}`);
  return perfilDe(perfilId).entreno.map((d) => nombres[d]);
}

// Entradas nativas (datos puros, sin funciones).
export function entradaLegacy(perfilId, semilla) {
  return {
    profile: { ...clonar(PERFIL_BASE_LEGACY), trainingDays: diasEntreno(perfilId, 'legacy') },
    targetKcal: TARGET_KCAL_LEGACY,
    opts: clonar(OPCIONES_LEGACY),
    semilla,
  };
}

export function entradaEngine2(perfilId, semilla) {
  return {
    profile: { trainingDays: diasEntreno(perfilId, 'engine2') },
    seed: semilla,
    strategy: ESTRATEGIA,
  };
}

// ─── Verificaciones por caso (abortan; nunca corrigen) ───────────────────────

export function verificarEstrategia(plan, motor) {
  if (!plan || plan.strategy !== ESTRATEGIA) {
    throw new CasoError(`${motor}: estrategia ${JSON.stringify(plan && plan.strategy)}, se esperaba "${ESTRATEGIA}"`);
  }
}

// Premisa de la regla posicional de D-087, punto 3: el día libre de ambos
// motores es el día 6 (sábado) y solo ese.
export function verificarDiaLibreLegacy(plan) {
  if (!plan || !Array.isArray(plan.days) || plan.days.length !== 7) {
    throw new CasoError('legacy: el plan no tiene 7 días');
  }
  const libres = plan.days.map((d, i) => (d && d.special === 'libre' ? i : -1)).filter((i) => i >= 0);
  if (libres.length !== 1 || libres[0] !== 5 || plan.days[5].name !== NOMBRE_DIA.legacy.sabado) {
    throw new CasoError(`legacy: día libre en posiciones ${JSON.stringify(libres.map((i) => i + 1))}, se esperaba solo la 6 (sábado)`);
  }
}

export function verificarDiaLibreEngine2(plan) {
  if (!plan || !Array.isArray(plan.days) || plan.days.length !== 7) {
    throw new CasoError('engine2: el plan no tiene 7 días');
  }
  if (plan.days[5].day !== NOMBRE_DIA.engine2.sabado) {
    throw new CasoError(`engine2: el día 6 es ${JSON.stringify(plan.days[5].day)}, se esperaba "Sabado"`);
  }
  const log = Array.isArray(plan.decisionLog) ? plan.decisionLog : [];
  const libres = log.filter((e) => e && e.cause === 'cita_fija_libre');
  const esperado = `beats.${NOMBRE_DIA.engine2.sabado}.fixedRole = "libre"`;
  if (libres.length !== 1 || libres[0].consequence !== esperado) {
    throw new CasoError(`engine2: decisionLog no registra un único día libre en el sábado (${libres.length} entradas cita_fija_libre)`);
  }
}

// Determinismo (protocolo §5.1) sobre la vista adaptada: el plan crudo de
// legacy lleva un id de día con marca temporal que cambia entre ejecuciones.
export function verificarDeterminismo(vista1, vista2, motor) {
  if (JSON.stringify(vista1) !== JSON.stringify(vista2)) {
    throw new CasoError(`${motor}: dos ejecuciones con la misma entrada producen vistas distintas`);
  }
}

// ─── Semillas: comprobación contra un registro declarado ─────────────────────
//
// Registro (JSON):
//   { "version": 1, "ancla": "<sha de 40 hex>", "perimetro": "<qué se revisó>",
//     "completo": true, "usos": [ { "desde": n, "hasta": m, "origen": "..." } ] }
//
// La comprobación solo acredita no-uso respecto del perímetro que el registro
// declara. Falla si el registro falta, está mal formado, no se declara
// completo o alguna semilla cae en un uso registrado.
export function verificarSemillas(semillas, registro) {
  if (!registro || typeof registro !== 'object') throw new CasoError('registro de semillas ausente');
  if (registro.version !== 1) throw new CasoError('registro de semillas: versión no soportada');
  if (typeof registro.ancla !== 'string' || !/^[0-9a-f]{40}$/.test(registro.ancla)) {
    throw new CasoError('registro de semillas: ancla ausente o no es un sha completo');
  }
  if (typeof registro.perimetro !== 'string' || registro.perimetro.trim().length === 0) {
    throw new CasoError('registro de semillas: perímetro no declarado');
  }
  if (registro.completo !== true) throw new CasoError('registro de semillas: no se declara completo');
  if (!Array.isArray(registro.usos)) throw new CasoError('registro de semillas: usos debe ser un array');
  registro.usos.forEach((u, k) => {
    if (!u || !Number.isInteger(u.desde) || !Number.isInteger(u.hasta) || u.desde > u.hasta
      || typeof u.origen !== 'string' || u.origen.length === 0) {
      throw new CasoError(`registro de semillas: usos[${k}] mal formado`);
    }
  });
  if (!Array.isArray(semillas) || semillas.length === 0 || !semillas.every(Number.isInteger)) {
    throw new CasoError('semillas: lista vacía o con valores no enteros');
  }
  for (const s of semillas) {
    const uso = registro.usos.find((u) => s >= u.desde && s <= u.hasta);
    if (uso) throw new CasoError(`semilla ${s} ya usada: ${uso.origen} (${uso.desde}–${uso.hasta})`);
  }
}

export function idPlan(perfilId, semilla, motor) {
  return `${perfilId}-${semilla}-${motor}`;
}

export function listaCasos() {
  const casos = [];
  for (const perfilId of Object.keys(PERFILES)) {
    for (const semilla of SEMILLAS_EVALUACION) casos.push({ perfilId, semilla });
  }
  return casos;
}

