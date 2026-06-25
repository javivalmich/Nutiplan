// Fase 2, Paso B.2, Commit 4 — anotador interactivo. Vive en scripts/
// (fuera de engine2/). Herramienta de terminal para que Javi anote los
// platos del scaffold sin editar JSON crudo.
//
// REGLA DURA: el anotador NUNCA decide un valor; solo pregunta, valida
// la SINTAXIS de la respuesta y la escribe. Si el usuario no responde un
// campo (respuesta vacia), ese campo SIGUE siendo "TODO".
//
// HALLAZGO (verificado, no asumido): ningun dish del scaffold lleva un
// titulo legible PRE-CALCULADO. assembleDish() (src/engine2/dishes/
// assemble.js:21-30) no incluye "title" en el Dish que produce; los
// combos legacy genericos (LUNCH_COMBOS_RAW/DINNER_COMBOS_RAW) no tienen
// ese campo en absoluto. Solo TRAINING_DINNERS_RAW trae title/emoji/
// slot, y esos quedaron deliberadamente FUERA del Dish (Fase 2 / Paso
// B.2 / Commit 1: metadata diferida al ensamblador de presentacion).
//
// RETOQUE (Fase 2 / Paso B.2, commit aislado posterior): aunque el Dish
// no trae un titulo, SI trae `id` = comboIdentityKey(combo) =
// JSON.stringify([tmpl,P,C,V,V2,S,cookM]) (identity.js:34-40). A partir
// de esa tupla se puede DERIVAR un titulo legible (deriveTituloSugerido,
// abajo) — es una sugerencia EFIMERA mostrada en pantalla, nunca
// persistida ni auto-escrita: `nombre` solo deja de ser "TODO" si el
// usuario confirma (Enter acepta la sugerencia como confirmacion
// explicita) o escribe su propio texto.

import fs from 'node:fs';
import { ROLES, LEFTOVER_QUALITIES, ENERGIA_COCINA_NIVELES } from '../../src/engine2/dishes/schema.js';
import { findTodoFields } from './antiTodo.js';

// Vocabulario real verificado contra legacyCombos.data.js (LUNCH_COMBOS_RAW
// + DINNER_COMBOS_RAW + TRAINING_DINNERS_RAW), campos P/C/V/V2/S/cookM.
// Token -> forma legible con tilde. Si un slug no esta aqui, se usa tal
// cual (sin inventar acento) y se reporta como sin-mapear.
const TOKEN_LABELS = Object.freeze({
  // P (proteinas)
  pollo: 'pollo', pavo: 'pavo', ternera: 'ternera', cerdo: 'cerdo', conejo: 'conejo',
  salmon: 'salmón', merluza: 'merluza', bacalao: 'bacalao', dorada: 'dorada',
  sardinas: 'sardinas', gambas: 'gambas', calamares: 'calamares', atun: 'atún',
  huevo: 'huevo', lentejas: 'lentejas', garbanzos: 'garbanzos', alubias: 'alubias',
  // C (carbohidratos)
  arroz: 'arroz', patata: 'patata', boniato: 'boniato', quinoa: 'quinoa', pasta: 'pasta',
  // V / V2 (verduras)
  acelgas: 'acelgas', alcachofa: 'alcachofa', berenjena: 'berenjena', brocoli: 'brócoli',
  calabacin: 'calabacín', calabaza: 'calabaza', champiñones: 'champiñones', coles: 'coles',
  esparragos: 'espárragos', espinacas: 'espinacas', judias: 'judías', lechuga: 'lechuga',
  pepino: 'pepino', pimientos: 'pimientos', puerro: 'puerro', tomate: 'tomate',
  zanahoria: 'zanahoria',
  // tokens de S (S es compuesto, se separa por "_" y cada token se mapea)
  ajillo: 'ajillo', curry: 'curry', ligero: 'ligero', limon: 'limón', hierbas: 'hierbas',
  mostaza: 'mostaza', miel: 'miel', pimenton: 'pimentón', ajo: 'ajo', provenzal: 'provenzal',
  romero: 'romero', soja: 'soja', jengibre: 'jengibre', casero: 'casero', vinagreta: 'vinagreta',
});

// cookM -> frase verbal (no solo sustantivo): "a la plancha", "al horno"...
const COOKM_PHRASES = Object.freeze({
  plancha: 'a la plancha',
  horno: 'al horno',
  guisado: 'guisado',
  salteado: 'salteado',
  crudo: 'en crudo',
  revuelto: 'revuelto',
  tortilla: 'en tortilla',
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Mapea un slug a su forma legible. Si no hay mapeo conocido, devuelve
 * el slug tal cual (SIN inventar acento) y lo añade a `sinMapear`.
 * @param {string} slug
 * @param {Set<string>} sinMapear acumulador mutado con slugs no mapeados
 * @returns {string}
 */
function mapToken(slug, sinMapear) {
  if (slug in TOKEN_LABELS) return TOKEN_LABELS[slug];
  sinMapear.add(slug);
  return slug;
}

/**
 * Deriva un titulo legible en español a partir de la tupla de identidad
 * real de un Dish (P, C, V, V2, S, cookM — leidos via JSON.parse(dish.id),
 * unico lugar donde existen: el Dish NO los trae como campos propios,
 * ver hallazgo de cabecera). Determinista: misma tupla -> mismo titulo.
 * Sin RNG, sin red, sin azar.
 *
 * NOTA verificada contra el ejemplo de referencia (P=pollo, C=arroz,
 * V=brocoli, S=limon_hierbas, cookM=plancha -> "Pollo con arroz y brócoli
 * a la plancha"): el campo S (salsa/condimento) se LEE de la tupla pero
 * NO se renderiza en el titulo corto — el titulo de referencia con
 * S=limon_hierbas no menciona "limón" ni "hierbas". Esto replica el
 * formato de titulo corto del motor viejo (el detalle de salsa vive en
 * p1/p2, no en el titulo). S queda disponible en el resultado solo a
 * efectos de no ocultar campos (no afecta al titulo, no es un fallo).
 *
 * @param {{id: string}} dish
 * @returns {{ titulo: string, slugsSinMapear: string[] }}
 */
export function deriveTituloSugerido(dish) {
  const [, P, C, V, V2, , cookM] = JSON.parse(dish.id);
  const sinMapear = new Set();

  const proteinLabel = capitalize(mapToken(P, sinMapear));

  const acompañamientos = [];
  if (C) acompañamientos.push(mapToken(C, sinMapear));
  if (V) acompañamientos.push(mapToken(V, sinMapear));
  if (V2) acompañamientos.push(mapToken(V2, sinMapear));

  const cookMPhrase = cookM ? (COOKM_PHRASES[cookM] ?? mapToken(cookM, sinMapear)) : '';

  let titulo = proteinLabel;
  if (acompañamientos.length > 0) titulo += ` con ${acompañamientos.join(' y ')}`;
  if (cookMPhrase) titulo += ` ${cookMPhrase}`;

  return { titulo, slugsSinMapear: [...sinMapear] };
}

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
 * @param {{ tituloSugerido?: string }} [context]
 * @returns {string}
 */
export function promptFor(field, context = {}) {
  if (ENUM_FIELDS[field]) {
    return `${field} [${ENUM_FIELDS[field].join('|')}] (vacio = dejar TODO): `;
  }
  if (field === 'batchable') return 'batchable [true|false] (vacio = dejar TODO): ';
  if (field === 'shelfLifeDays') return 'shelfLifeDays (entero >= 0) (vacio = dejar TODO): ';
  if (field === 'nombre') {
    if (context.tituloSugerido) {
      return `nombre [sugerido: "${context.tituloSugerido}"] (Enter para aceptar, o escribe el tuyo): `;
    }
    return 'nombre (texto libre) (vacio = dejar TODO): ';
  }
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

    for (const field of pendientesDelPlato) {
      let finalValue;
      if (field === 'nombre') {
        const { titulo, slugsSinMapear } = deriveTituloSugerido(dish);
        if (slugsSinMapear.length > 0) {
          log(`[titulo sugerido] slug(s) sin mapear (mostrados crudos): ${slugsSinMapear.join(', ')}`);
        }
        // eslint-disable-next-line no-await-in-loop
        finalValue = await askNombreConSugerencia(titulo, ask);
      } else {
        // eslint-disable-next-line no-await-in-loop
        finalValue = await askFieldUntilValid(field, ask, log);
      }
      if (finalValue.skip) continue; // respuesta vacia (campo SIN sugerencia): SIGUE "TODO"
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

/**
 * Pregunta "nombre" mostrando la sugerencia derivada de la tupla. Enter
 * (respuesta vacia) CONFIRMA la sugerencia explicitamente — el usuario
 * la vio en pantalla y la acepto con una pulsacion; esto NO es "no
 * responder": nombre deja de ser "TODO". Texto no vacio -> se usa tal
 * cual. La sugerencia nunca se persiste por su cuenta: solo llega al
 * dish si esta funcion la devuelve porque el usuario (via Enter o texto)
 * la confirmo.
 * @param {string} tituloSugerido
 * @param {(prompt: string) => Promise<string>} ask
 * @returns {Promise<{ skip: false, value: string }>}
 */
async function askNombreConSugerencia(tituloSugerido, ask) {
  const rawAnswer = await ask(promptFor('nombre', { tituloSugerido }));
  const trimmed = rawAnswer.trim();
  if (trimmed === '') return { skip: false, value: tituloSugerido };
  return { skip: false, value: trimmed };
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
