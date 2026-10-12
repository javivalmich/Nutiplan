// dietas — vegetariana y vegana (D-107).
//
// Tres piezas, como las intolerancias (alergenos.js) y SIBO (fodmap.js):
//   1. animalDeTexto: qué alimentos de origen animal lleva un texto (carne,
//      pescado, marisco, huevo, lácteo, miel). Criterio conservador: ante la
//      duda, se marca.
//   2. adaptarTextoDieta / adaptarComidaDieta: cambia solo lo SECUNDARIO que
//      tiene un sustituto de uso normal (caldo de pollo → caldo de verduras,
//      dashi → caldo de kombu; en vegana, leche → bebida de soja, yogur →
//      yogur de soja, miel → sirope de arce, mayonesa → mayonesa vegana,
//      «queso rallado al gusto» → levadura nutricional…). La proteína
//      principal no se cambia nunca: un plato de pollo no pasa a ser de tofu.
//   3. Lo que sigue llevando algo que la dieta no come, no se ofrece.

export const DIETAS = Object.freeze(['omnivora', 'vegetariana', 'vegana']);

export const VETADOS_POR_DIETA = Object.freeze({
  omnivora: Object.freeze([]),
  vegetariana: Object.freeze(['carne', 'pescado', 'marisco']),
  vegana: Object.freeze(['carne', 'pescado', 'marisco', 'huevo', 'lacteo', 'miel']),
});

/** Dieta del perfil (omnívora si no dice nada o dice algo desconocido). */
export function dietaDe(profile) {
  const d = profile && profile.dieta;
  return DIETAS.includes(d) ? d : 'omnivora';
}

const R = (s) => new RegExp(s, 'i');

// Qué lleva cada categoría (si) y qué menciones no cuentan (no).
export const ANIMAL = Object.freeze({
  carne: {
    si: R('pollo|pavo|ternera|vacuno|\\bvaca\\b|\\bbuey\\b|cerdo|cordero|conejo|cabrito|\\bpato\\b|\\blomo\\b|jam[oó]n|bacon|beicon|panceta|tocino|chorizo|morcilla|salchich|lac[oó]n|guanciale|sobrasada|\\bfuet\\b|salami|mortadela|pepperoni|chistorra|\\bcarnes?\\b|hamburguesa|alb[oó]ndiga|pechuga|contramuslo|\\bmuslos?\\b|solomillo|entrecot|carrillada|costilla|codillo|fiambre|pastrami|\\bpat[eé]\\b|foie|kebab|cocido (madrile|gallego|monta|lebaniego|express)|fabada|gelatina|manteca|caldo de (huesos|cocido)|hueso de jam'),
    no: R('carne de pimiento|(hamburguesas?|alb[oó]ndigas?) (vegetal(es)?|veganas?|de (lentejas|garbanzos?|alubias|tofu|soja|seit[aá]n|tempeh|quinoa|setas|verduras|avena))|carne (vegetal|de soja)|chorizo vegetal|bacon vegetal|manteca de (cacahuete|cacao|karit[eé])|lomo de (salm[oó]n|at[uú]n|bacalao)'),
  },
  pescado: {
    si: R('pescado|salm[oó]n|merluza|bacalao|(?<![a-záéíóúñ] )\\bdorada\\b|filetes? de dorada|lubina|corvina|sardina|at[uú]n|bonito|caballa|boquer[oó]n|anchoa|rape|lenguado|trucha|rodaballo|pez espada|emperador|marmitako|fumet|dashi|katsuobushi|surimi|panga|abadejo|salmonete|jurel|ceviche|leche de tigre|huevas|caviar|colatura'),
    no: R('caldo de kombu|dashi de kombu'),
  },
  marisco: {
    si: R('gamba|langostino|cigala|bogavante|langosta|cangrejo|n[eé]cora|calamar|chipir[oó]n|sepia|pulpo|mejill[oó]n|almeja|berberecho|navaja|vieira|\\bostras?\\b|marisco|fideu[aá]|surimi'),
    no: null,
  },
  huevo: {
    si: R('huevo|\\bclaras?\\b|yema|tortillas? (de (patatas?|calabac|espinac|cebolla|champi|verdura|ajos|bacalao|queso|jam|at[uú]n|camarones)|francesas?|espa[ñn]ola|paisana)|en tortilla|revuelto|mayonesa|alioli|carbonara|shakshuka|rebozad|brioche|merengue|\\bflan\\b|pasta fresca|croqueta|quiche'),
    no: R('sin huevo|tortillas? de (ma[ií]z|trigo|garbanzo)|tortillas? integral(es)?|revuelto de tofu|mayonesa vegana|alioli vegano|revuelto vegano'),
  },
  lacteo: {
    si: R('leche|yogur|queso|mozzarella|parmesano|pecorino|feta|reques[oó]n|ricotta|burrata|mascarpone|mantequilla|\\bnata\\b|bechamel|k[eé]fir|skyr|cuajada|natillas|helado|crema de leche|ghee|suero de leche|whey'),
    no: R('leche de (coco|tigre|soja|avena|almendras?|arroz)|bebida (vegetal|de soja|de avena|de almendras?)|yogur(es)? (de soja|vegetal|de coco)|queso vegano|queso vegetal|mantequilla de (cacahuete|almendras?|frutos secos)|nata vegetal|nata de (soja|avena|coco)|bechamel vegetal|crema de leche de coco'),
  },
  miel: {
    si: R('\\bmiel\\b'),
    no: null,
  },
});

export const CATEGORIAS_ANIMALES = Object.freeze(Object.keys(ANIMAL));

/** Categorías de origen animal que lleva un texto (sin las menciones que no cuentan). */
export function animalDeTexto(texto) {
  const t = String(texto || '');
  const out = new Set();
  for (const [clave, { si, no }] of Object.entries(ANIMAL)) {
    if (!si.test(t)) continue;
    // La excepción solo anula si no queda ninguna otra mención.
    if (no) {
      const resto = t.replace(new RegExp(no.source, 'gi'), ' ');
      if (!si.test(resto)) continue;
    }
    out.add(clave);
  }
  return out;
}

// Cambios en las dos dietas (lo secundario de origen animal en un plato que
// no lo es: el caldo, el dashi, la salsa de pescado, la gelatina).
const CAMBIOS_VEGETARIANA = [
  [/\bcaldo de (pollo|carne|huesos|cocido)\b/gi, 'caldo de verduras'],
  [/,? de sobre dashi \+ agua o caldo de alga kombu/gi, ', alga kombu en agua'],
  [/\bcaldo dashi\b/gi, 'caldo de kombu'],
  [/\bdashi\b(?! de kombu)/gi, 'caldo de kombu'],
  [/\bsalsa de pescado\b/gi, 'salsa de soja'],
  [/\bgelatina\b(?! vegetal)/gi, 'agar-agar'],
];

// Solo en vegana: lácteos, huevo de salsa y miel con sustituto habitual.
const CAMBIOS_VEGANA = [
  [/\bleche o bebida vegetal\b/gi, 'bebida de soja'],
  [/\bleche (semidesnatada|desnatada|entera|sin lactosa)( sin lactosa)?\b/gi, 'bebida de soja'],
  [/\bleche\b(?! de (coco|tigre|soja|avena|almendras?|arroz))/gi, 'bebida de soja'],
  [/\b(queso fresco batido|skyr)( 0\s?%)?/gi, 'yogur de soja natural'],
  [/\byogur(?! de soja| vegetal| de coco)( griego)?( natural)?( 0\s?%)?( sin lactosa)?/gi, 'yogur de soja natural'],
  [/\b(queso rallado|parmesano( rallado)?) al gusto\b/gi, 'levadura nutricional al gusto'],
  [/\bparmesano (rallado )?\(opcional\)/gi, 'levadura nutricional (opcional)'],
  [/\bmantequilla\b(?! de (cacahuete|almendras?|frutos secos))/gi, 'aceite de oliva'],
  [/\bnata( para cocinar| de cocinar| ligera| light)?\b(?! vegetal| de (soja|avena|coco))/gi, 'nata vegetal'],
  [/\bmayonesa( ligera)?\b(?! vegana)/gi, 'mayonesa vegana'],
  [/\balioli\b(?! vegano)/gi, 'alioli vegano'],
  [/\bbechamel( ligera)?\b(?! vegetal)/gi, 'bechamel vegetal'],
  [/\bmiel\b/gi, 'sirope de arce'],
];

const LIMPIEZA = [
  [/\s{2,}/g, ' '],
  [/\s+([,.)])/g, '$1'],
  [/\(\s+/g, '('],
  [/,\s*,/g, ','],
];

const conMayuscula = (original, nuevo) => (/^[A-ZÁÉÍÓÚÑ]/.test(original) ? nuevo.charAt(0).toUpperCase() + nuevo.slice(1) : nuevo);

/** Cambios de texto de una dieta (lista vacía en omnívora). */
function cambiosDe(dieta) {
  if (dieta === 'vegana') return [...CAMBIOS_VEGETARIANA, ...CAMBIOS_VEGANA];
  if (dieta === 'vegetariana') return CAMBIOS_VEGETARIANA;
  return [];
}

/** Texto con lo secundario de origen animal cambiado por su sustituto. Idempotente. */
export function adaptarTextoDieta(texto, dieta) {
  if (texto == null) return texto;
  const cambios = cambiosDe(dieta);
  if (!cambios.length) return texto;
  let t = String(texto);
  for (const [re, por] of cambios) t = t.replace(re, (m) => conMayuscula(m, m.replace(new RegExp(re.source, re.flags.replace('g', '')), por)));
  for (const [re, por] of LIMPIEZA) t = t.replace(re, por);
  return t;
}

/** Comida completa adaptada a la dieta (título, preparación, compra y receta). */
export function adaptarComidaDieta(meal, dieta) {
  if (!meal || !cambiosDe(dieta).length) return meal;
  const a = (x) => adaptarTextoDieta(x, dieta);
  return {
    ...meal,
    title: a(meal.title),
    p1: a(meal.p1),
    p2: a(meal.p2),
    shopping: Array.isArray(meal.shopping) ? meal.shopping.map(a) : meal.shopping,
    recipe: Array.isArray(meal.recipe) ? meal.recipe.map((p) => (typeof p === 'string' ? a(p) : p)) : meal.recipe,
    adaptadoDieta: dieta,
  };
}
