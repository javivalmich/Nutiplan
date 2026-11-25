// Variantes de los mínimos de ración (MEDICIÓN, no producto; propuesta D-112, sin decidir).
// Al cargar src/engine2/nutrientes/raciones.js inserta una regla tras el cálculo del rango de
// cada ingrediente en ajustarComida. No modifica el archivo: transforma el texto en memoria; si
// un ancla no aparece exactamente una vez, falla.
//
// «Bajo el mínimo» = la ficha pide menos que el mínimo del rango, no es aceite (su «por debajo»
// es la conversión de 5 ml a 4,6 g) ni lo ha añadido engine2 (pan, fruta, frutos secos).
//   --variante=B        (por defecto) lo que está bajo el mínimo queda fijo en la ficha.
//   --variante=A        el mínimo pasa a ser lo que pide la ficha (y el paso, si es mayor).
//   --variante=B-escala B; pero dentro de una masa, lo que está bajo el mínimo escala con ella (A).
//   --variante=B-fija   B; pero si una masa tiene algo bajo el mínimo, toda la masa queda fija.
// Las «masas» se reconocen aquí por el conjunto de claves de la comida (solo para medir; la
// propuesta es marcarlas en la ficha): crepes {avena, huevo, leche_semi}; batido de soja
// {bebida_vegetal, tofu_sedoso, platano, avena}; hamburguesa de tofu {tofu, avena}; pizza
// proteica {harina, yogur_griego_0}.
//
// Uso (después del resolver del banco):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesMinimos.mjs \
//        <script> … [--variante=B|A|B-escala|B-fija]
import { register } from 'node:module';

const ANCLA_FN = 'export function ajustarComida(';
const ANCLA = "let rango = papel === 'fijo' ? null : rangoDe(it.clave, it.unidad);";
const MASA = `
function __masaVariante(items) {
  const k = new Set(items.map((i) => i.clave));
  if (k.has('leche_semi') && k.has('avena') && k.has('huevo') && k.has('skyr')) return new Set(['avena', 'huevo', 'leche_semi']);
  if (k.has('bebida_vegetal') && k.has('tofu_sedoso') && k.has('avena')) return new Set(['bebida_vegetal', 'tofu_sedoso', 'platano', 'avena']);
  if (k.has('tofu') && k.has('avena') && k.has('pan_integral')) return new Set(['tofu', 'avena']);
  if (k.has('harina') && k.has('yogur_griego_0') && k.has('mozzarella')) return new Set(['harina', 'yogur_griego_0']);
  return null;
}
`;
const BAJO = "(rango && !it.anadido && it.gramos < rango[0] - 0.05 && !(it.clave === 'aove' || it.clave === 'aceite_semillas'))";
const A = '[it.gramos, rango[1], Math.min(rango[2], it.gramos)]';
const REGLAS = {
  B: `\n    if ${BAJO} rango = null; // VARIANTE B`,
  A: `\n    if ${BAJO} rango = ${A}; // VARIANTE A`,
  'B-escala': `\n    if ${BAJO} rango = (__masaVariante(items) && __masaVariante(items).has(it.clave)) ? ${A} : null; // VARIANTE B-escala`,
  'B-fija': `\n    { const __m = __masaVariante(items); // VARIANTE B-fija
      const __bajo = __m && items.some((x) => __m.has(x.clave) && !x.anadido && rangoDe(x.clave, x.unidad) && x.gramos < rangoDe(x.clave, x.unidad)[0] - 0.05);
      if (__bajo && __m.has(it.clave)) rango = null; else if ${BAJO} rango = null; }`,
};

const arg = process.argv.find((a) => a.startsWith('--variante='));
const variante = arg ? arg.slice('--variante='.length) : 'B';
if (!REGLAS[variante]) throw new Error(`variantesMinimos: variante desconocida «${variante}»`);
process.stderr.write(`[variantesMinimos] variante ${variante}\n`);

const hooks = `
const ANCLA = ${JSON.stringify(ANCLA)}, ANCLA_FN = ${JSON.stringify(ANCLA_FN)};
const REGLA = ${JSON.stringify(REGLAS[variante])}, MASA = ${JSON.stringify(MASA)};
export async function load(url, contexto, siguiente) {
  const r = await siguiente(url, contexto);
  if (!url.endsWith('/src/engine2/nutrientes/raciones.js')) return r;
  const texto = String(r.source);
  if (texto.split(ANCLA).length !== 2 || texto.split(ANCLA_FN).length !== 2) throw new Error('variantesMinimos: ancla no encontrada en raciones.js');
  return { ...r, source: texto.replace(ANCLA_FN, MASA + ANCLA_FN).replace(ANCLA, ANCLA + REGLA) };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
