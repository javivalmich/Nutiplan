// blind — transformación común de cegado (protocolo-evaluacion.md §6;
// D-085; D-086).
//
// Recibe únicamente items { id, view }:
//   - id: identificador opaco que pone quien llama. Solo se usa para construir
//     la clave; no interviene en la vista del evaluador.
//   - view: contrato común { days: [ { meals: [ { momento, plato } ] } ] },
//     ya adaptado por cada productor.
//
// Este módulo no importa nada (ni de los motores ni de fuera) y no conoce
// claves propias de ningún motor. Cualquier clave fuera del contrato común
// hace fallar la llamada: así no puede colarse información de origen.
//
// Reglas (D-086, D-087):
//   - Exactamente 7 días por plan. Posición del día: 1..7, por orden.
//   - Lista blanca de momentos: comida, cena. Exactamente una de cada por día,
//     en todos los días (la entrada se exige completa). Otros momentos
//     canónicos (p. ej. desayuno) se excluyen por esta regla general, igual
//     para todos los planes.
//   - Exclusión posicional (D-087, punto 3): la comida de la posición 6 no se
//     muestra en ningún plan. Se exige en la entrada, pero no se emite. La
//     regla es solo de posición: no mira el contenido del plato.
//     Resultado: 13 posiciones por plan.
//   - plato: literal, sin normalizar ni recortar. Vacío o solo espacios -> error.
//   - Ante cualquier anomalía: error. Nunca corrección ni omisión silenciosa.
//
// Aleatorización: mulberry32 sembrado (copia local; ver más abajo). Misma
// entrada + misma semilla -> salida idéntica byte a byte.

export const BLIND_VERSION = 2;
export const DIAS_POR_PLAN = 7;
export const MOMENTOS_VISTA = Object.freeze(['comida', 'cena']);
// Posición (1..7) cuya comida no se emite (D-087, punto 3).
export const DIA_SIN_COMIDA_EN_VISTA = 6;

const MOMENTO_CANONICO = /^[a-z][a-z_]*$/;
const ALFABETO_ETIQUETA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LONGITUD_ETIQUETA = 4;

export class BlindError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BlindError';
  }
}

// Copia local de mulberry32 (algoritmo de dominio público). Local porque
// src/eval/** no puede importar de los motores (tripwire inverso).
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function exactKeys(value, keys, where) {
  if (!isPlainObject(value)) {
    throw new BlindError(`${where}: debe ser un objeto plano`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((k, i) => k !== expected[i])) {
    throw new BlindError(`${where}: claves ${JSON.stringify(actual)}, se esperaban exactamente ${JSON.stringify(expected)}`);
  }
}

function projectView(view, where) {
  exactKeys(view, ['days'], `${where}.view`);
  if (!Array.isArray(view.days) || view.days.length !== DIAS_POR_PLAN) {
    throw new BlindError(`${where}.view.days: se esperaban exactamente ${DIAS_POR_PLAN} días`);
  }
  return view.days.map((day, i) => {
    const w = `${where}.view.days[${i}]`;
    exactKeys(day, ['meals'], w);
    if (!Array.isArray(day.meals)) {
      throw new BlindError(`${w}.meals: debe ser un array`);
    }
    const encontrados = {};
    day.meals.forEach((meal, j) => {
      const wm = `${w}.meals[${j}]`;
      exactKeys(meal, ['momento', 'plato'], wm);
      if (typeof meal.momento !== 'string' || !MOMENTO_CANONICO.test(meal.momento)) {
        throw new BlindError(`${wm}.momento: no es un momento canónico (${JSON.stringify(meal.momento)})`);
      }
      if (typeof meal.plato !== 'string' || meal.plato.trim().length === 0) {
        throw new BlindError(`${wm}.plato: vacío o no es string`);
      }
      if (!MOMENTOS_VISTA.includes(meal.momento)) return; // excluido por lista blanca
      if (Object.prototype.hasOwnProperty.call(encontrados, meal.momento)) {
        throw new BlindError(`${w}: más de un momento "${meal.momento}"`);
      }
      encontrados[meal.momento] = meal.plato;
    });
    for (const m of MOMENTOS_VISTA) {
      if (!Object.prototype.hasOwnProperty.call(encontrados, m)) {
        throw new BlindError(`${w}: falta el momento "${m}"`);
      }
    }
    // Orden de claves fijo: dia, comida, cena. En la posición excluida, la
    // clave comida se omite (no null): esa posición no forma parte de la vista.
    const dia = i + 1;
    if (dia === DIA_SIN_COMIDA_EN_VISTA) {
      return { dia, cena: encontrados.cena };
    }
    return { dia, comida: encontrados.comida, cena: encontrados.cena };
  });
}

function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new BlindError('items: debe ser un array no vacío');
  }
  const ids = new Set();
  items.forEach((item, k) => {
    const where = `items[${k}]`;
    exactKeys(item, ['id', 'view'], where);
    if (typeof item.id !== 'string' || item.id.length === 0) {
      throw new BlindError(`${where}.id: debe ser un string no vacío`);
    }
    if (ids.has(item.id)) {
      throw new BlindError(`${where}.id: duplicado (${JSON.stringify(item.id)})`);
    }
    ids.add(item.id);
  });
}

function generarEtiqueta(rng) {
  let out = 'P-';
  for (let i = 0; i < LONGITUD_ETIQUETA; i++) {
    out += ALFABETO_ETIQUETA[Math.floor(rng() * ALFABETO_ETIQUETA.length)];
  }
  return out;
}

/**
 * @param {{id: string, view: object}[]} items
 * @param {number} seed entero en [0, 2^32 - 1]
 * @returns {{
 *   evaluador: { version: number, planes: { etiqueta: string, dias: { dia: number, comida?: string, cena: string }[] }[] },
 *   clave: { version: number, seed: number, entradas: { etiqueta: string, id: string }[] }
 * }}
 */
export function blind(items, seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) {
    throw new BlindError('seed: debe ser un entero en [0, 2^32 - 1]');
  }
  validarItems(items);
  const proyectados = items.map((item, k) => ({ id: item.id, dias: projectView(item.view, `items[${k}]`) }));

  const rng = mulberry32(seed);

  // Barajado Fisher-Yates del orden de presentación.
  const orden = proyectados.map((_, k) => k);
  for (let k = orden.length - 1; k > 0; k--) {
    const r = Math.floor(rng() * (k + 1));
    [orden[k], orden[r]] = [orden[r], orden[k]];
  }

  // Etiquetas aleatorias únicas, independientes del id y del contenido.
  const usadas = new Set();
  const planes = [];
  const entradas = [];
  for (const k of orden) {
    let etiqueta;
    do {
      etiqueta = generarEtiqueta(rng);
    } while (usadas.has(etiqueta));
    usadas.add(etiqueta);
    planes.push({ etiqueta, dias: proyectados[k].dias });
    entradas.push({ etiqueta, id: proyectados[k].id });
  }

  return {
    evaluador: { version: BLIND_VERSION, planes },
    clave: { version: BLIND_VERSION, seed, entradas },
  };
}

// Serialización fija: orden de claves de construcción, sangría de 2, LF,
// salto final. La escritura a disco debe hacerse en UTF-8 sin BOM.
export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
