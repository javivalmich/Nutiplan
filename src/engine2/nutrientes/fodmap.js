// fodmap — adapta un plato a una dieta baja en FODMAP (SIBO) en vez de
// quitarlo: «ternera con ajo y perejil» pasa a «ternera con perejil».
//
// Dos pasos (D-104):
//   1. adaptarTextoFodmap: cambia lo que tiene sustituto de uso habitual en
//      dietas bajas en FODMAP: el ajo se quita (o se usa aceite aromatizado
//      con ajo, sin trozos), la cebolla y el puerro pasan a su parte verde,
//      el trigo a sin gluten, los lácteos a sin lactosa y la miel a sirope de
//      arce.
//   2. fodmapRestante: lo que queda alto en FODMAP y no tiene sustituto
//      razonable porque es parte central del plato (legumbres, coliflor,
//      setas, espárragos, alcachofa, aguacate, manzana, pera…, o un plato
//      cuyo protagonista es el ajo o la cebolla). Ese plato no se ofrece.
//
// Es una adaptación orientativa: la dieta baja en FODMAP se hace por fases y
// la debe guiar un profesional (la app lo avisa).

const CAMBIOS = [
  // Lo ya adaptado no se vuelve a tocar (adaptar dos veces da lo mismo).
  [/aceite aromatizado con ajo/gi, 'ACEITEAJO'],
  [/\bal aceite de ajo\b/gi, 'al ACEITEDEAJO'],
  // «Al ajillo»: el aceite aromatizado con ajo da el sabor sin los fructanos
  // (son solubles en agua, no en aceite).
  [/\bal ajillo\b/gi, 'al ACEITEDEAJO'],
  [/\bsalsa de ajo, perejil y guindilla\b/gi, 'salsa de perejil y guindilla con ACEITEAJO'],
  // Ajo: pasos de receta cuyo protagonista es el ajo.
  [/\b(dora|sofr[ií]e|saltea|pocha|calienta)\s+(el\s+)?ajo\s+(laminado|picado|machacado)?[^.·]*/gi, 'Calienta ACEITEAJO (sin trozos de ajo)'],
  [/\b(a[ñn]ade|echa)\s+(los\s+|el\s+)?ajos?\b[^.·]*/gi, 'añade 1 cda de ACEITEAJO'],
  [/\bincorpora(r)?\s+(el\s+)?(sofrito de\s+)?ajo\b/gi, 'incorpora el ACEITEAJO'],
  [/\bsofrito (suave )?de ajo( y aove)?/gi, 'ACEITEAJO'],
  [/\bajo y jengibre\b/gi, 'jengibre'],
  [/\bajos?\s+(enteros?|laminados?|picados?|machacados?|en polvo|rallados?)(\s+(sin pelar|y laminados?|y picados?))*/gi, 'ajo'],
  [/\s*\+\s*ajo\b/gi, ''],
  [/,\s*ajo\b/gi, ''],
  [/\bajo,\s*/gi, ''],
  [/\s+y\s+ajo\b/gi, ''],
  [/\bajo\s+y\s+/gi, ''],
  [/\s+con\s+ajo\b/gi, ''],
  [/\s+de\s+ajo\b/gi, ''],
  [/\s*·\s*ajo\b/gi, ''],
  [/^\s*ajo\b\s*(·\s*)?/gi, ''],
  // Cebolla, cebolleta y puerro: su parte verde.
  [/\bcebollas?\s+(morada|dulce|blanca|roja|tierna)s?\b/gi, 'cebolleta (parte verde)'],
  [/\bcebolleta\b(?! \(parte verde)/gi, 'cebolleta (parte verde)'],
  [/\bcebollas?\b/gi, 'cebolleta (parte verde)'],
  [/\bpuerros?\b(?! \(parte verde)/gi, 'puerro (parte verde)'],
  // Verduras de acompañamiento con sustituto: el champiñón en conserva y
  // escurrido es bajo en FODMAP (el manitol pasa al líquido); el espárrago
  // se cambia por judías verdes. Los guisantes de adorno se quitan.
  [/\bchampi[ñn]ones\b(?! en conserva)/gi, 'champiñones en conserva'],
  [/\besp[aá]rragos?( verdes| trigueros)?\b/gi, 'judías verdes'],
  [/\s*[·,]\s*guisantes\b/gi, ''],
  [/\s+y\s+guisantes\b/gi, ''],
  // Trigo, lácteos y miel.
  [/\bpan rallado( integral)?\b(?! sin gluten)/gi, 'pan rallado sin gluten'],
  [/\bpan\s+(integral|de pueblo|de centeno|blanco|de molde|brioche)(\s+para burger)?\b/gi, 'pan sin gluten'],
  [/\bpan\b(?! sin gluten| rallado)/gi, 'pan sin gluten'],
  [/\bpasta\s+(corta\s+)?integral\b/gi, 'pasta sin gluten'],
  [/\bpasta\b(?! sin gluten| de (?!trigo))/gi, 'pasta sin gluten'],
  [/\bfideos\s+(finos|integrales)\b/gi, 'fideos sin gluten'],
  [/\bharina\s+(de trigo|integral)\b/gi, 'harina de arroz'],
  [/\bharina\b(?! de (arroz|ma[ií]z))/gi, 'harina de arroz'],
  [/\btortilla integral( grande)?\b/gi, 'tortilla de maíz'],
  [/\bpitas?( integral)?\b(?! sin gluten)/gi, 'pita sin gluten'],
  [/\b(muesli|granola)( sin azúcar)?( añadido)?\b/gi, 'copos de avena sin gluten'],
  [/\bleche (semidesnatada|desnatada|entera)\b/gi, 'leche sin lactosa'],
  [/\bleche o bebida vegetal\b/gi, 'leche sin lactosa'],
  [/\bleche\b(?! sin lactosa| de (coco|tigre|almendras?|arroz|avena|soja))/gi, 'leche sin lactosa'],
  [/\byogur(?! sin lactosa)( griego)?( natural)?( 0\s?%)?/gi, 'yogur sin lactosa'],
  [/\bqueso (fresco|crema)( light)?( batido)?\b/gi, 'queso sin lactosa'],
  [/(?<!sin )\bnata\b(?! sin lactosa)/gi, 'nata sin lactosa'],
  [/\bmiel\b/gi, 'sirope de arce'],
  // Fruta genérica: las que convienen.
  [/\bfruta de temporada\b(?! \()/gi, 'fruta de temporada (naranja, kiwi, fresas o uva)'],
  [/\(manzana, pera, naranja o kiwi\)/gi, '(naranja o kiwi)'],
];

const LIMPIEZA = [
  [/\s{2,}/g, ' '],
  [/\s+([,.)])/g, '$1'],
  [/\s*·\s*/g, ' · '],
  [/\(\s+/g, '('],
  [/,\s*,/g, ','],
  [/·\s*·/g, '·'],
  [/\bcon\s+y\b/gi, 'con'],
  [/\bcon\s*(·|,|$)/gi, '$1'],
  [/\by\s*(·|,|$)/gi, '$1'],
  [/^\s*[·,]\s*/g, ''],
  [/\s*[·,]\s*$/g, ''],
];

// Conserva la mayúscula inicial de lo sustituido («Pasta integral» → «Pasta sin gluten»).
const conMayuscula = (original, nuevo) => (/^[A-ZÁÉÍÓÚÑ]/.test(original) ? nuevo.charAt(0).toUpperCase() + nuevo.slice(1) : nuevo);

export function adaptarTextoFodmap(texto) {
  if (texto == null) return texto;
  let t = String(texto);
  for (const [re, por] of CAMBIOS) t = t.replace(re, (m) => conMayuscula(m, m.replace(new RegExp(re.source, re.flags.replace('g', '')), por)));
  for (const [re, por] of LIMPIEZA) t = t.replace(re, por);
  t = t.replace(/ACEITEAJO/g, 'aceite aromatizado con ajo').replace(/ACEITEDEAJO/g, 'aceite de ajo').replace(/\(parte verde\) \(/g, '(parte verde, ');
  return t.trim().replace(/^[a-záéíóúñ]/, (c) => (/^[A-ZÁÉÍÓÚÑ]/.test(String(texto).trim()) ? c.toUpperCase() : c));
}

// Platos cuyo protagonista es el ajo, la cebolla, el puerro o el espárrago:
// no se adaptan, no se ofrecen.
const PROTAGONISTA = /sopa de ajo|caldo de ajo|sopa castellana|ajo ?blanco|sopa de cebolla|cebolla caramelizada|crema de puerro|^\s*esp[aá]rragos/i;
export function protagonistaFodmap(texto) {
  const m = String(texto || '').match(PROTAGONISTA);
  return m ? m[0].toLowerCase() : null;
}

/** Líneas de la compra: el ajo suelto desaparece; el resto se adapta. */
export function adaptarCompraFodmap(lineas) {
  const out = [];
  let aceiteAjo = false;
  for (const l of lineas || []) {
    if (/^\s*ajos?\b/i.test(l)) { aceiteAjo = true; continue; }
    if (/^\s*guisantes\b/i.test(l)) continue;
    if (/^\s*aceite aromatizado con ajo/i.test(l)) { aceiteAjo = true; continue; }
    const a = adaptarTextoFodmap(l);
    if (a) out.push(a);
  }
  if (aceiteAjo) out.push('Aceite aromatizado con ajo (opcional)');
  return out;
}

const RESTANTE = /lenteja|garbanzo|alubia|jud[ií]as? (blanca|pinta)|fabes|frijol|guisante|hummus|falafel|\bhabas?\b|edamame|cusc[uú]s|bulgur|seit[aá]n|centeno|cebada|coliflor|champi[ñn]ones(?! en conserva)|champi[ñn][oó]n\b|\bsetas?\b|shiitake|esp[aá]rrago|alcachofa|aguacate|guacamole|anacardo|pistacho|manzana|\bperas?\b|mango|sand[ií]a|melocot[oó]n|ciruela|cereza|\bajo\b|ajillo|\bcebolla\b|sopa de cebolla|crema de puerro|inulina|agave/i;

/** Lo alto en FODMAP que queda tras adaptar (null si nada). */
export function fodmapRestante(texto) {
  const t = String(texto || '').replace(/aceite aromatizado con ajo[^·,.)]*/gi, ' ').replace(/sin gluten|sin lactosa|aceite de ajo/gi, ' ');
  const m = t.match(RESTANTE);
  return m ? m[0].toLowerCase() : null;
}

/** Adapta una comida completa (título, preparación, compra y receta). */
export function adaptarComidaFodmap(meal) {
  if (!meal) return meal;
  return {
    ...meal,
    title: adaptarTextoFodmap(meal.title),
    p1: adaptarTextoFodmap(meal.p1),
    p2: adaptarTextoFodmap(meal.p2),
    shopping: adaptarCompraFodmap(meal.shopping),
    recipe: Array.isArray(meal.recipe) ? meal.recipe.map((p) => (typeof p === 'string' ? adaptarTextoFodmap(p) : p)) : meal.recipe,
    adaptadoFodmap: true,
  };
}
