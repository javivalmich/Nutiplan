// lactosa — desayunos y tentempiés sin lactosa (D-110).
//
// Con intolerancia a la lactosa, el motor viejo cambiaba el yogur del desayuno
// por un vaso de bebida vegetal (y el desayuno se quedaba sin proteína). Aquí
// se cambian la leche, el yogur, el kéfir y el queso fresco por su versión sin
// lactosa, que se encuentra en cualquier supermercado. Lo que no tiene versión
// sin lactosa habitual (requesón, queso curado) se queda y el desayuno se
// descarta al filtrar por intolerancias.
//
// Solo se aplica a desayunos y tentempiés (decisión de alcance de D-110: los
// platos de comida y cena siguen filtrándose como antes).
// Idempotente: adaptar dos veces da lo mismo.

const CAMBIOS = [
  [/\bleche (semidesnatada|desnatada|entera)\b/gi, 'leche sin lactosa'],
  [/\bleche\b(?! sin lactosa| de (coco|tigre|almendras?|arroz|avena|soja))/gi, 'leche sin lactosa'],
  [/\byogur griego( 0 ?%)?(?! sin lactosa)/gi, 'yogur griego sin lactosa'],
  [/\byogur( natural)?\b(?! sin lactosa| de soja| vegetal| de coco| griego)/gi, 'yogur sin lactosa'],
  [/\bqueso fresco batido( 0 ?%)?(?! sin lactosa)/gi, 'queso fresco batido sin lactosa'],
  [/\bskyr\b(?! sin lactosa)/gi, 'skyr sin lactosa'],
  [/\bk[eé]fir( natural)?\b(?! sin lactosa)/gi, 'kéfir sin lactosa'],
  [/\bqueso (fresco|crema)( light)?( tipo burgos)?( 0 ?%)?(?! batido| sin lactosa)/gi, 'queso sin lactosa'],
  // «Pon el queso batido…» en la receta.
  [/\bqueso\b(?! sin lactosa| fresco| crema| curado| rallado| feta| parmesano| manchego| de cabra| vegano)( batido)?/gi, 'queso sin lactosa'],
];

/** Texto con leche, yogur, kéfir y queso fresco sin lactosa. */
export function adaptarTextoLactosa(texto) {
  let t = String(texto ?? '');
  for (const [re, por] of CAMBIOS) {
    t = t.replace(re, (m) => (m[0] === m[0].toUpperCase() ? por.charAt(0).toUpperCase() + por.slice(1) : por));
  }
  return t;
}

/** Comida (desayuno o tentempié) con sus textos sin lactosa. */
export function adaptarComidaLactosa(meal) {
  if (!meal || meal.adaptadoLactosa) return meal;
  const a = (x) => (typeof x === 'string' ? adaptarTextoLactosa(x) : x);
  return {
    ...meal,
    title: a(meal.title), p1: a(meal.p1), p2: a(meal.p2),
    shopping: (meal.shopping || []).map(a), recipe: (meal.recipe || []).map(a),
    adaptadoLactosa: true,
  };
}
