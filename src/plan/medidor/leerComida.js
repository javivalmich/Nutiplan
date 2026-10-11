// leerComida — convierte una comida del plan (tal como la ve el usuario) en
// ingredientes canónicos con gramos, para poder medir lo que lleva de verdad.
//
// Lee la lista de la compra de la comida (meal.shopping), que es la parte con
// cantidades más estructurada: «Pechuga de pollo (230g)», «Huevos (3 ud)»,
// «Aguacate (1/2)», «AOVE (15ml)», «Mejillones (700g en concha / 280g limpio)».
// Si un ingrediente con aporte no trae cantidad (típico del aceite), la busca
// en el texto de la comida (p1/p2) y, si no la hay, lo deja anotado como
// «sinCantidad» en vez de inventarla.
//
// Vive en src/plan (capa de la app), no en src/eval: eval no puede importar
// engine2 (tripwire inverso). Nada de engine2 lo importa.

import { INGREDIENTES } from '../../engine2/nutrientes/ingredientes.js';

// Orden importante: lo más específico primero.
const RECONOCER = [
  [/lo que t[uú] elijas/, null],
  [/hueso de jam[oó]n|caldo|fumet|dashi/, 'caldo'],
  [/vino blanco/, 'vino'],
  [/^1 huevo batido/, 'huevo'],
  [/claras? de huevo/, 'clara'],
  [/huevo/, 'huevo'],
  [/pechuga de pollo cocida/, 'pollo_cocido'],
  [/pollo picado/, 'pollo_picado'],
  [/pollo en trozos|muslo/, 'pollo_muslo'],
  [/pechuga de pollo|^pollo/, 'pollo_pechuga'],
  [/pavo picado/, 'pavo_picado'],
  [/jam[oó]n serrano o pavo/, 'jamon_cocido'],
  [/pechuga de pavo|^pavo/, 'pavo_pechuga'],
  [/(carne picada de )?ternera picada|carne picada/, 'ternera_picada'],
  [/ternera|solomillo/, 'ternera_magra'],
  [/lomo de cerdo/, 'cerdo_lomo'],
  [/conejo/, 'conejo'],
  [/jam[oó]n (serrano|ib[eé]rico)/, 'jamon_serrano'],
  [/lac[oó]n/, 'lacon'],
  [/chorizo/, 'chorizo'],
  [/morcilla/, 'morcilla'],
  [/panceta/, 'panceta'],
  [/salm[oó]n ahumado/, 'salmon_ahumado'],
  [/salm[oó]n/, 'salmon'],
  [/merluza|pescado blanco/, 'merluza'],
  [/bacalao/, 'bacalao'],
  [/dorada/, 'dorada'],
  [/corvina|lubina/, 'corvina'],
  [/sardina/, 'sardina'],
  [/bonito/, 'bonito'],
  [/at[uú]n/, 'atun_conserva'],
  [/gamba/, 'gambas'],
  [/calamar/, 'calamar'],
  [/mejill[oó]n/, 'mejillon'],
  [/berberecho/, 'berberecho'],
  [/tofu/, 'tofu'],
  [/salsa de pescado/, 'condimento'],
  [/lentejas.*cocidas/, 'lentejas_cocidas'],
  [/lenteja/, 'lentejas_seco'],
  [/garbanzos cocidos/, 'garbanzos_cocidos'],
  [/garbanzo/, 'garbanzos_seco'],
  [/alubias negras cocidas/, 'alubias_cocidas'],
  [/alubia|fabes/, 'alubias_seco'],
  [/edamame/, 'edamame'],
  [/guisante/, 'guisantes'],
  [/hummus/, 'hummus'],
  [/arroz integral cocido/, 'arroz_integral_cocido'],
  [/fideos de arroz/, 'fideos_arroz_seco'],
  [/^arroz/, 'arroz_seco'],
  [/pasta (corta )?integral/, 'pasta_integral_seco'],
  [/fideos|pasta(?! de miso)/, 'pasta_seco'],
  [/gnocchi/, 'gnocchi'],
  [/quinoa/, 'quinoa_seco'],
  [/boniato/, 'boniato'],
  [/patata/, 'patata'],
  [/pan rallado/, 'pan_rallado'],
  [/pan de centeno/, 'pan_centeno'],
  [/pan integral|pan brioche/, 'pan_integral'],
  [/^pan/, 'pan_blanco'],
  [/pita|tortilla integral|obleas de gyoza/, 'tortilla_trigo'],
  [/tortillas? de ma[ií]z|cancha/, 'tortilla_maiz'],
  [/avena/, 'avena'],
  [/muesli|granola/, 'muesli'],
  [/harina/, 'harina'],
  [/masa para empanada/, 'masa_empanada'],
  [/^ma[ií]z/, 'maiz'],
  [/croqueta/, 'croquetas'],
  [/acelga/, 'acelga'],
  [/alcachofa/, 'alcachofa'],
  [/berenjena/, 'berenjena'],
  [/br[oó]coli/, 'brocoli'],
  [/calabac[ií]n/, 'calabacin'],
  [/^semillas/, 'semillas'],
  [/calabaza/, 'calabaza'],
  [/cebolla|cebolleta|puerro/, 'cebolla'],
  [/champi[ñn]|setas/, 'champinon'],
  [/coliflor/, 'coliflor'],
  [/col de bruselas/, 'coles_bruselas'],
  [/^col |repollo|pak choi|col china|col morada/, 'col'],
  [/esp[aá]rrago/, 'esparrago'],
  [/espinaca/, 'espinaca'],
  [/grelos/, 'grelos'],
  [/jud[ií]as verdes/, 'judia_verde'],
  [/lechuga|mezclum|r[uú]cula/, 'lechuga'],
  [/pepinillo/, 'pepinillo'],
  [/pepino/, 'pepino'],
  [/pimiento (rojo seco|chorice)|carne de pimiento/, 'condimento'],
  [/pimiento(?!.*molido)/, 'pimiento'],
  [/tomate (triturado|frito|casero|rallado)|salsa de tomate/, 'tomate_triturado'],
  [/tomate cherry/, 'tomate_cherry'],
  [/tomate/, 'tomate'],
  [/zanahoria/, 'zanahoria'],
  [/brotes de soja/, 'brotes_soja'],
  [/alga/, 'algas'],
  [/aceituna/, 'aceituna'],
  [/pl[aá]tano/, 'platano'],
  [/fresas|frutos? rojos|frutas del bosque|frutas congeladas/, 'frutos_rojos'],
  [/pi[ñn]a/, 'pina'],
  [/^fruta/, 'fruta'],
  [/lim[oó]n|lima(?! kaffir)|^lima/, 'limon'],
  [/aguacate/, 'aguacate'],
  [/coco rallado/, 'coco_rallado'],
  [/leche de coco/, 'leche_coco'],
  [/leche desnatada/, 'leche_desnatada'],
  [/bebida vegetal/, 'bebida_vegetal'],
  [/leche/, 'leche_semi'],
  [/yogur griego 0|yogur griego natural/, 'yogur_griego_0'],
  [/yogur/, 'yogur_natural'],
  [/skyr|queso fresco batido/, 'skyr'],
  [/queso crema/, 'queso_crema'],
  [/mozzarella/, 'mozzarella'],
  [/feta/, 'feta'],
  [/parmesano|queso rallado/, 'queso_curado'],
  [/queso/, 'queso_fresco'],
  [/mantequilla de cacahuete/, 'crema_cacahuete'],
  [/mantequilla/, 'mantequilla'],
  [/aove|aceite de oliva/, 'aove'],
  [/aceite/, 'aceite_semillas'],
  [/almendra/, 'almendra'],
  [/nueces o almendras|nuez(?! moscada)|nueces/, 'nuez'],
  [/pistacho/, 'pistacho'],
  [/cacahuete/, 'cacahuete'],
  [/semillas/, 'semillas'],
  [/tahini/, 'tahini'],
  [/alioli/, 'alioli'],
  [/mayonesa/, 'mayonesa_ligera'],
  [/miel|az[uú]car/, 'miel'],
  [/salsa de soja|soja baja/, 'salsa_soja'],
  [/miso/, 'miso'],
  [/ketchup/, 'ketchup'],
  [/.*/, 'condimento'],
];

export function reconocer(nombre) {
  const n = String(nombre).toLowerCase().trim();
  for (const [re, clave] of RECONOCER) if (re.test(n)) return clave;
  return 'condimento';
}

const num = (s) => {
  if (s === '½') return 0.5;
  if (/^\d+\/\d+$/.test(s)) { const [a, b] = s.split('/').map(Number); return a / b; }
  return Number(String(s).replace(',', '.'));
};

/**
 * Gramos de un ingrediente a partir del texto entre paréntesis.
 * Devuelve { gramos, como } o null si no se puede saber.
 */
export function gramosDe(clave, cantidad) {
  const ing = INGREDIENTES[clave];
  const q = String(cantidad).toLowerCase();
  let m;
  // «700g en concha / 280g limpio», «1 unidad / 70g», «2, o en conserva 80g»: manda el último peso en gramos.
  const pesos = [...q.matchAll(/(\d+(?:[.,]\d+)?)\s*g\b/g)].map((x) => num(x[1]));
  if (pesos.length) return { gramos: pesos[pesos.length - 1], como: 'g' };
  if ((m = q.match(/(\d+(?:[.,]\d+)?)\s*ml/))) return { gramos: num(m[1]) * (ing.gMl || 1), como: 'ml' };
  if ((m = q.match(/(\d+\/\d+|½|\d+(?:[.,]\d+)?)\s*cdas?\b/))) return { gramos: num(m[1]) * (ing.gCda || 15), como: 'cda' };
  if ((m = q.match(/(\d+\/\d+|½|\d+(?:[.,]\d+)?)\s*cditas?\b/))) return { gramos: num(m[1]) * (ing.gCdita || 5), como: 'cdita' };
  if ((m = q.match(/(\d+)\s*hojas?\b/)) && ing.gHoja) return { gramos: num(m[1]) * ing.gHoja, como: 'hoja' };
  if ((m = q.match(/(\d+)\s*lonchas?\b/)) && ing.gLoncha) return { gramos: num(m[1]) * ing.gLoncha, como: 'loncha' };
  if ((m = q.match(/^(\d+)\s*-\s*(\d+)/)) && ing.gUd) return { gramos: ((num(m[1]) + num(m[2])) / 2) * ing.gUd, como: 'ud' };
  if ((m = q.match(/^(\d+\/\d+|½|\d+(?:[.,]\d+)?)\s*(ud|unidad|unidades|grandes?|medianas?|pieza)?\b/)) && ing.gUd) {
    return { gramos: num(m[1]) * ing.gUd, como: 'ud' };
  }
  return null;
}

/** Cantidad de aceite escrita en el texto de la comida («15ml AOVE», «AOVE (15ml)», «20ml AOVE»). */
function aceiteEnTexto(texto) {
  const t = String(texto || '');
  const m = t.match(/(\d+)\s*ml\s*(?:de\s*)?(?:aove|aceite)/i) || t.match(/(?:aove|aceite)[^·(]*\((\d+)\s*ml\)/i);
  return m ? Number(m[1]) : null;
}

/**
 * Ingredientes con gramos de una comida.
 * @returns {{ items: {clave, gramos, como, texto, nombre}[], sinCantidad: string[], libre: boolean }}
 */
export function leerComida(meal) {
  const items = [];
  const sinCantidad = [];
  let libre = false;
  const texto = `${meal.p1 || ''} · ${meal.p2 || ''}`;
  for (const s of meal.shopping || []) {
    const linea = String(s);
    const nombre = linea.replace(/\s*\(.*$/, '').trim();
    const clave = reconocer(nombre);
    if (clave === null) { libre = true; continue; }
    const ing = INGREDIENTES[clave];
    if (ing.despreciable) continue;
    const paren = (linea.match(/\(([^)]*)\)/) || [])[1];
    if (paren === 'condimento') continue; // aliño de la salsa: cantidad mínima, sin dato
    const delante = nombre.match(/^(\d+)\s/);
    let g = paren != null ? gramosDe(clave, paren) : null;
    if (!g && delante && ing.gUd) g = { gramos: Number(delante[1]) * ing.gUd, como: 'ud' };
    // «Pan duro (40g) + 30g para tostar»: lo que se añade fuera del paréntesis también cuenta.
    const extra = linea.match(/\)\s*\+\s*(\d+)\s*g\b/);
    if (g && extra) g = { gramos: g.gramos + Number(extra[1]), como: g.como };
    if (!g && (clave === 'aove' || clave === 'aceite_semillas')) {
      const ml = aceiteEnTexto(texto);
      if (ml != null) g = { gramos: ml * ing.gMl, como: 'ml (texto)' };
      // «· AOVE» sin cantidad (tostadas, desayunos): un chorrito, 10 ml. Estimado y marcado.
      else g = { gramos: 10 * ing.gMl, como: 'estimado 10 ml' };
    }
    if (!g) { sinCantidad.push(linea); continue; }
    items.push({ clave, gramos: Math.round(g.gramos * 10) / 10, como: g.como, texto: linea, nombre });
  }
  return { items, sinCantidad, libre };
}
