// Alimentos eliminados: lo que el usuario escribe en texto libre (OriginalPlanApp.jsx) y lo que quita del plan.
//
// Hasta ahora era una búsqueda literal de la palabra en el texto del plato: quien escribía «frijoles» seguía
// recibiendo el burrito de alubias negras, y quien escribía «legumbres», todas las legumbres. Desde el paso 1 de la
// legumbre como guarnición (Javi, 2026-11-23; D-103), además de la búsqueda literal, sin acentos, algunas palabras
// tienen sinónimos. Criterio conservador, como alergenos.js: ante la duda, se quita.
//   - «alubias», «judías» y «frijoles»: todas las alubias (blancas, rojas, pintas, negras), frijoles y fabes. Quien
//     escribe «judías» sigue perdiendo también las judías verdes, por la búsqueda literal (decisión de Javi).
//   - «habas»: también las habitas.
//   - «soja»: también edamame, tofu, tempeh y miso.
//   - «legumbres»: lo mismo que la intolerancia a legumbres (alergenos.js), con sus excepciones (judías verdes,
//     brotes de soja).
import { alergenosDeTexto } from '../engine2/nutrientes/alergenos.js';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const ALUBIAS = /alubia|frijol|judias? (blanca|pinta|roja|negra)|fabes|fabada/;
const SINONIMOS = Object.freeze([
  [/^legumbres?$/, (t, original) => alergenosDeTexto(original).has('legumbres')],
  [/^(alubias?|judias?|frijol(es)?)$/, (t) => ALUBIAS.test(t)],
  [/^habas?$/, (t) => /\bhab(as?|itas?)\b/.test(t)],
  [/^soja$/, (t) => /soja|edamame|tofu|tempeh|\bmiso\b/.test(t)],
]);

/** ¿Quita la palabra que escribió el usuario un plato con este texto? */
export function eliminadoEn(texto, palabra) {
  const p = norm(palabra);
  if (!p) return false;
  const t = norm(texto);
  if (t.includes(p)) return true;
  return SINONIMOS.some(([re, quita]) => re.test(p) && quita(t, String(texto || '')));
}
