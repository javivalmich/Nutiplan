// alergenos — qué intolerancias o alimentos a evitar del perfil afecta un
// ingrediente o una línea de texto de un plato.
//
// Cubre las 10 opciones que ofrece la app (src/ui/constants.js, INTOLERANCES):
// lactosa, gluten, huevo, frutos_secos, mariscos, pescado, soja, cerdo,
// legumbres y picante. Criterio conservador: ante la duda, el ingrediente se
// marca (es mejor quitar un plato de más que servir uno que no se puede comer).
// Las excepciones («sin gluten», «bebida vegetal», «fideos de arroz»…) se
// aplican antes que las reglas.
//
// Se usa sobre cada línea de la lista de la compra y sobre el texto del plato
// (título, preparación y receta), donde aparecen las salsas y los
// condimentos que no van en la compra.

const R = (s) => new RegExp(s, 'i');

export const ALERGENOS = Object.freeze({
  gluten: {
    si: R('\\bpan\\b|pan de|pan integral|pan rallado|baguette|brioche|pita|tortilla (integral|de trigo)|wrap|pasta|espagueti|macarr|tallar|lasa[ñn]a|fideo|fideu|harina|cusc[uú]s|bulgur|seit[aá]n|cebada|centeno|espelta|trigo|avena|muesli|granola|cereal|galleta|bizcocho|\\bmasas?\\b|empanad|hojaldre|croqueta|rebozad|empanizad|gyoza|ramen|udon|cerveza|salsa de soja|soja baja|teriyaki|ponzu|tostada|picatoste|gnocchi|[ñn]oqui|bechamel|tempura|panko'),
    no: R('(\\S+ )?(de |integral )?sin gluten|(cancha|ma[ií]z|almendras?|semillas?|s[eé]samo|pipas?|cacahuetes?|frutos secos) tostad[ao]s?|pasta de (miso|s[eé]samo|curry|tomate|gochujang|aceitunas)|fideos de arroz|harina de (ma[ií]z|arroz|garbanzo)|tortillas? de ma[ií]z|pan de ma[ií]z|tamari'),
  },
  lactosa: {
    si: R('leche|yogur|queso|mozzarella|parmesano|feta|reques[oó]n|ricotta|burrata|mantequilla|nata\\b|bechamel|k[eé]fir|skyr|batido de|cuajada|natillas|helado|crema de leche|ghee'),
    no: R('yogur griego sin lactosa|queso fresco batido sin lactosa|leche de tigre|leche de coco|bebida vegetal|leche vegetal|(\\S+ )?sin lactosa|leche de (almendra|avena|soja|arroz)|mantequilla de cacahuete|yogur(es)? (de soja|vegetal|de coco)|nata vegetal|bechamel vegetal|queso vegano'),
  },
  huevo: {
    si: R('huevo|clara|yema|tortilla(?!s? (integral|de trigo|de ma[ií]z|grande))|revuelto|mayonesa|alioli|carbonara|shakshuka|rebozad|brioche|merengue|flan|pasta fresca|croqueta'),
    no: R('sin huevo|tortillas? de ma[ií]z|revuelto de tofu|mayonesa vegana|alioli vegano'),
  },
  frutos_secos: {
    si: R('almendra|nuez|nueces|avellana|pistacho|anacardo|cacahuete|man[ií]\\b|pi[ñn]ones?|macadamia|pecana|frutos secos|pesto|praline|turr[oó]n|mazap[aá]n|romesco|mantequilla de cacahuete|crema de cacahuete'),
    no: R('nuez moscada'),
  },
  mariscos: {
    si: R('gamba|langostino|cigala|bogavante|langosta|cangrejo|n[eé]cora|calamar|chipir[oó]n|sepia|pulpo|mejill[oó]n|almeja|berberecho|navaja|vieira|\\bostras?\\b|marisco|fideu[aá]|surimi|paella de marisco'),
    no: null,
  },
  pescado: {
    si: R('pescado|salm[oó]n|merluza|bacalao|dorada|lubina|corvina|sardina|at[uú]n|bonito|caballa|boquer[oó]n|anchoa|rape|lenguado|trucha|rodaballo|pez espada|emperador|marmitako|fumet|dashi|katsuobushi|salsa de pescado|surimi|panga|abadejo|salmonete|jurel'),
    no: null,
  },
  soja: {
    si: R('soja|tofu|edamame|miso|tempeh|teriyaki|ponzu|tamari|natto|yuba|gochujang|bebida de soja|leche de soja'),
    no: R('brotes de soja'),
  },
  cerdo: {
    si: R('cerdo|lomo(?! de (salm[oó]n|at[uú]n|bacalao))|jam[oó]n(?! de pavo)|bacon|beicon|panceta|chorizo|morcilla|lac[oó]n|salchich|guanciale|sobrasada|\\bunto\\b|manteca|torrezno|costilla|codillo|cochinillo|chistorra|fuet|salami|mortadela|pepperoni|cocido (madrile|gallego|monta|lebaniego|express)|fabada|carrillada|secreto|pluma ib|presa ib'),
    no: R('jam[oó]n de pavo|bacon de pavo|chorizo vegetal|pechuga de pavo'),
  },
  legumbres: {
    si: R('lenteja|garbanzo|alubia|jud[ií]as? blanca|jud[ií]as? pinta|frijol|fabes|fabada|habas?\\b|guisante|soja|tofu|edamame|hummus|falafel|cocido (madrile|gallego|monta|lebaniego|express)|azuki|altramuz|miso|tempeh'),
    no: R('jud[ií]as? verdes?|brotes de soja'),
  },
  picante: {
    si: R('picante|guindilla|cayena|chile|chili|jalape[ñn]o|tabasco|sriracha|harissa|wasabi|gochujang|piment[oó]n picante|curry picante|pimienta de cayena|ras el hanout|piri piri|aj[ií] (amarillo|panca|picante)|salsa brava|bravas'),
    no: R('pimiento|piment[oó]n dulce|piment[oó]n ahumado(?! picante)|sin picante|chile suave'),
  },
});

export const CLAVES_ALERGENOS = Object.freeze(Object.keys(ALERGENOS));

/** Alérgenos de una línea de texto (sin las excepciones que lo descartan). */
export function alergenosDeTexto(texto) {
  const t = String(texto || '');
  const out = new Set();
  for (const [clave, { si, no }] of Object.entries(ALERGENOS)) {
    if (!si.test(t)) continue;
    // La excepción solo anula si no queda ninguna otra mención del alérgeno.
    if (no) {
      const sinExcepciones = t.replace(new RegExp(no.source, 'gi'), ' ');
      if (!si.test(sinExcepciones)) continue;
    }
    out.add(clave);
  }
  return out;
}
