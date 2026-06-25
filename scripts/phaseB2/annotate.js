// Fase 2, Paso B.2, Commit 4 — anotador interactivo. Vive en scripts/
// (fuera de engine2/). Herramienta de terminal para que Javi anote los
// platos del scaffold sin editar JSON crudo.
//
// REGLA DURA: el anotador NUNCA decide un valor; solo pregunta, valida
// la SINTAXIS de la respuesta y la escribe. Si el usuario no responde un
// campo (respuesta vacia), ese campo SIGUE siendo "TODO".
//
// HALLAZGO (verificado, no asumido): ningun dish del scaffold lleva un
// titulo legible. assembleDish() (src/engine2/dishes/assemble.js) no
// incluye "title" en el Dish que produce; los combos legacy genericos
// (LUNCH_COMBOS_RAW/DINNER_COMBOS_RAW) no tienen ese campo en absoluto.
// Solo TRAINING_DINNERS_RAW trae title/emoji/slot, y esos quedaron
// deliberadamente FUERA del Dish (Fase 2 / Paso B.2 / Commit 1: metadata
// diferida al ensamblador de presentacion). Por tanto este anotador NO
// puede sugerir un titulo de combo: NO existe en la fuente que consume
// (dishes.scaffold.json). No se inventa.

import fs from 'node:fs';
import { ROLES, LEFTOVER_QUALITIES, ENERGIA_COCINA_NIVELES } from '../../src/engine2/dishes/schema.js';
import { findTodoFields } from './antiTodo.js';

export const EDITORIAL_FIELDS = Object.freeze(['nombre', 'rol', 'batchable', 'leftoverQuality', 'shelfLifeDays', 'energiaCocina']);

const ENUM_FIELDS = {
  rol: ROLES,
  leftoverQuality: LEFTOVER_QUALITIES,
  energiaCocina: ENERGIA_COCINA_NIVELES,
};

/**
 * Valida sintacticamente la respuesta cruda (string) para un campo dado.
 * NUNCA decide un valor por defecto: una respuesta vacia significa "no
 * responder" (el campo sigue TODO), señalado devolviendo { skip: true }.
 * @param {string} field
 * @param {string} rawAnswer
 * @returns {{ skip: true } | { skip: false, value: any } | { error: string }}
 */
export function parseFieldAnswer(field, rawAnswer) {
  const trimmed = rawAnswer.trim();
  if (trimmed === '') return { skip: true };

  if (ENUM_FIELDS[field]) {
    if (!ENUM_FIELDS[field].includes(trimmed)) {
      return { error: `Valor invalido. Debe ser uno de: ${ENUM_FIELDS[field].join(', ')}` };
    }
    return { skip: false, value: trimmed };
  }

  if (field === 'batchable') {
    const lower = trimmed.toLowerCase();
    if (lower === 'true') return { skip: false, value: true };
    if (lower === 'false') return { skip: false, value: false };
    return { error: 'Valor invalido. Debe ser "true" o "false".' };
  }

  if (field === 'shelfLifeDays') {
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < 0 || !/^\d+$/.test(trimmed)) {
      return { error: 'Valor invalido. Debe ser un entero >= 0.' };
    }
    return { skip: false, value: n };
  }

  if (field === 'nombre') {
    return { skip: false, value: trimmed };
  }

  return { error: `Campo desconocido: "${field}"` };
}

/**
 * Mensaje de prompt para un campo (sin terminal real: solo construye el
 * texto, para que sea testeable).
 * @param {string} field
 * @returns {string}
 */
export function promptFor(field) {
  if (ENUM_FIELDS[field]) {
    return `${field} [${ENUM_FIELDS[field].join('|')}] (vacio = dejar TODO): `;
  }
  if (field === 'batchable') return 'batchable [true|false] (vacio = dejar TODO): ';
  if (field === 'shelfLifeDays') return 'shelfLifeDays (entero >= 0) (vacio = dejar TODO): ';
  if (field === 'nombre') return 'nombre (texto libre) (vacio = dejar TODO): ';
  throw new Error(`Campo desconocido: "${field}"`);
}

/**
 * Recorre dishes.scaffold.json SOLO los platos con algun campo "TODO",
 * pregunta CAMPO A CAMPO solo los pendientes (los arrastrados de anclas
 * ya rellenos no se re-preguntan), valida sintaxis, y escribe el
 * scaffold de forma incremental (cada respuesta aceptada persiste antes
 * de continuar) y resumible (si `dishes` ya tiene algunos TODO resueltos
 * de una pasada anterior, retoma desde el primer TODO restante).
 *
 * `ask` es una funcion inyectada (prompt: string) => Promise<string> —
 * en produccion, basada en readline; en tests, una funcion sincrona o
 * async que devuelve respuestas predeterminadas. Esto hace el anotador
 * testeable SIN terminal real.
 *
 * @param {string} scaffoldPath ruta del JSON a anotar (NUNCA el scaffold
 *   real en esta sesion — eso lo ejecuta Javi despues)
 * @param {(prompt: string) => Promise<string>} ask
 * @param {{ log?: (msg: string) => void }} [opts]
 * @returns {Promise<{ dishes: object[], restantes: { id: string, field: string }[] }>}
 */
export async function annotateScaffold(scaffoldPath, ask, opts = {}) {
  const log = opts.log || (() => {});
  const dishes = JSON.parse(fs.readFileSync(scaffoldPath, 'utf-8'));

  for (const dish of dishes) {
    const pendientesDelPlato = EDITORIAL_FIELDS.filter((f) => dish[f] === 'TODO');
    if (pendientesDelPlato.length === 0) continue; // ya completo: no se re-pregunta nada

    log(`\n=== ${dish.id} ===`);
    log(`momento=${JSON.stringify(dish.momento)} tempFeel=${dish.tempFeel} plateType=${dish.plateType}`);
    // Sin titulo de combo legible disponible (ver hallazgo de cabecera).

    for (const field of pendientesDelPlato) {
      // eslint-disable-next-line no-await-in-loop
      const finalValue = await askFieldUntilValid(field, ask, log);
      if (finalValue.skip) continue; // respuesta vacia: el campo SIGUE "TODO"
      dish[field] = finalValue.value;
      // Escritura incremental: persiste tras CADA respuesta aceptada, no
      // al final. Si Javi sale a mitad, lo ya respondido no se pierde.
      fs.writeFileSync(scaffoldPath, JSON.stringify(dishes, null, 2) + '\n');
    }
  }

  const restantes = findTodoFields(dishes);
  log(`\nQuedan ${restantes.length} campo(s) "TODO".`);
  return { dishes, restantes };
}

async function askFieldUntilValid(field, ask, log) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const rawAnswer = await ask(promptFor(field));
    const parsed = parseFieldAnswer(field, rawAnswer);
    if (parsed.error) {
      log(parsed.error);
      continue; // RECHAZA: vuelve a preguntar el mismo campo
    }
    return parsed;
  }
}
