// Seguridad de las legumbres de guarnición: MEDICIÓN, no cambia reglas (Javi, 2026-11-23). Para cada legumbre que el
// prototipo de guarnición puede servir, comprueba qué filtros de la app la quitarían HOY si apareciera en el texto de
// un plato, con el texto que escribiría el prototipo («Alubias rojas cocidas (120 g)»):
//   - intolerancia «legumbres»: alergenosDeTexto (alergenos.js, por ingrediente y texto) o la expresión de
//     engine2App.js:77 (TEXTO_INTOLERANCIA.legumbres; no se exporta, copiada aquí tal cual);
//   - intolerancia «soja»: alergenosDeTexto;
//   - SIBO: fodmapRestante (fodmap.js);
//   - eliminatedFoods (texto libre en la app, OriginalPlanApp.jsx:253): filtrarCatalogo quita el plato si su texto
//     contiene lo escrito como subcadena (engine2App.js:163). Se prueban las palabras que una persona escribiría.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/seguridadLegumbres.mjs <salida.md>
import fs from 'node:fs';

const R = new URL('../../../', import.meta.url).href;
const { alergenosDeTexto } = await import(R + 'src/engine2/nutrientes/alergenos.js');
const { fodmapRestante } = await import(R + 'src/engine2/nutrientes/fodmap.js');

// Copia de engine2App.js:77 (TEXTO_INTOLERANCIA.legumbres).
const TEXTO_LEGUMBRES = /lenteja|garbanzo|alubia|jud[ií]a blanca|hummus|falafel|fabada|cocido|edamame|soja|tofu|guisante/i;

export const LEGUMBRES = [
  { id: 'garbanzos', texto: 'Garbanzos cocidos (120 g)', palabras: ['garbanzos', 'garbanzo', 'legumbres'] },
  { id: 'alubias blancas', texto: 'Alubias blancas cocidas (120 g)', palabras: ['alubias', 'alubia', 'alubias blancas', 'judías blancas', 'judías', 'legumbres'] },
  { id: 'alubias rojas', texto: 'Alubias rojas cocidas (120 g)', palabras: ['alubias', 'alubias rojas', 'judías rojas', 'frijoles', 'frijoles rojos', 'legumbres'] },
  { id: 'alubias pintas', texto: 'Alubias pintas cocidas (120 g)', palabras: ['alubias', 'alubias pintas', 'judías pintas', 'frijoles', 'legumbres'] },
  { id: 'alubias negras', texto: 'Alubias negras cocidas (120 g)', palabras: ['alubias', 'alubias negras', 'frijoles', 'frijoles negros', 'judías negras', 'legumbres'] },
  { id: 'lentejas pardinas', texto: 'Lentejas pardinas cocidas (120 g)', palabras: ['lentejas', 'lenteja', 'legumbres'] },
  { id: 'lentejas beluga', texto: 'Lentejas beluga cocidas (120 g)', palabras: ['lentejas', 'lenteja', 'legumbres'] },
  { id: 'habitas', texto: 'Habitas (120 g)', palabras: ['habas', 'haba', 'habitas', 'legumbres'] },
  { id: 'guisantes', texto: 'Guisantes (120 g)', palabras: ['guisantes', 'guisante', 'legumbres'] },
  { id: 'edamame', texto: 'Edamame (120 g)', palabras: ['edamame', 'soja', 'habas de soja', 'legumbres'] },
];

const sal = process.argv[2];
const marca = (b) => (b ? 'la quita' : '**NO la quita**');
const L = ['# Seguridad de las legumbres de guarnición (2026-11-23)', '',
  'Salida de `seguridadLegumbres.mjs`. Qué filtros de la app quitarían hoy cada legumbre si apareciera en el texto de un plato, con el texto que escribiría el prototipo. Solo comprueba; no cambia nada.', '',
  '| Legumbre | Texto | Intolerancia «legumbres»: alergenos.js | Intolerancia «legumbres»: engine2App.js:77 | Intolerancia «soja» | SIBO (fodmapRestante) |',
  '|---|---|---|---|---|---|'];
const huecos = [];
for (const l of LEGUMBRES) {
  const al = alergenosDeTexto(l.texto);
  const legA = al.has('legumbres'); const legB = TEXTO_LEGUMBRES.test(l.texto); const soja = al.has('soja'); const sibo = fodmapRestante(l.texto);
  L.push(`| ${l.id} | ${l.texto} | ${marca(legA)} | ${marca(legB)} | ${l.id === 'edamame' ? marca(soja) : (soja ? 'la quita' : 'no aplica')} | ${marca(sibo)} |`);
  if (!legA && !legB) huecos.push(`- **${l.id}**: con intolerancia a legumbres, ningún filtro la quita.`);
  else if (!legA || !legB) huecos.push(`- ${l.id}: con intolerancia a legumbres la quita solo uno de los dos filtros (${legA ? 'alergenos.js' : 'engine2App.js:77'}); basta con uno, pero no hay redundancia.`);
  if (l.id === 'edamame' && !soja) huecos.push('- **edamame**: con alergia a la soja, no se quita.');
  if (!sibo) huecos.push(`- **${l.id}**: con SIBO, fodmapRestante no la marca.`);
}
L.push('', '## eliminatedFoods (texto libre)', '', '| Legumbre | Palabra escrita por el usuario | ¿La quita? |', '|---|---|---|');
for (const l of LEGUMBRES) {
  for (const w of l.palabras) {
    const quita = l.texto.toLowerCase().includes(w.toLowerCase());
    L.push(`| ${l.id} | «${w}» | ${quita ? 'sí' : '**no**'} |`);
    if (!quita) huecos.push(`- ${l.id}: quien escribe «${w}» en sus alimentos eliminados la seguiría recibiendo.`);
  }
}
L.push('', '## Huecos', '', ...huecos, '');
fs.writeFileSync(sal, L.join('\n'));
console.log(L.join('\n'));
