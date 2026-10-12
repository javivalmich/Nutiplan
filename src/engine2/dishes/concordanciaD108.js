// Concordancia de los nombres de plato (D-108).
//
// Los nombres de los platos compuestos se generaron con plantillas que no
// conciertan el participio con la proteína: «Ternera magra salteado»,
// «Garbanzos estofadas», «Huevos revuelto». scripts/phaseB2/output/dishes.json
// no se modifica (hash de D-028): el nombre visible se corrige aquí, en la
// misma capa que los nombres de D-105 (nombreVisible).
//   - El participio que sigue a la proteína concierta con ella.
//   - «Garbanzos con pimientos guisado» → «Garbanzos guisados con pimientos»
//     (el participio va junto a lo que se guisa).
// Idempotente.

const CABEZAS = [
  [/^Pechuga de (pollo|pavo)/, 'f', 's'],
  [/^Ternera( magra)?/, 'f', 's'],
  [/^Lomo de cerdo/, 'm', 's'],
  [/^Conejo/, 'm', 's'],
  [/^Salmón/, 'm', 's'],
  [/^Bacalao( fresco)?/, 'm', 's'],
  [/^Merluza/, 'f', 's'],
  [/^Dorada/, 'f', 's'],
  [/^Sardinas/, 'f', 'p'],
  [/^Calamares/, 'm', 'p'],
  [/^Gambas/, 'f', 'p'],
  [/^Huevos/, 'm', 'p'],
  [/^Garbanzos/, 'm', 'p'],
  [/^Lentejas/, 'f', 'p'],
  [/^Alubias( blancas)?/, 'f', 'p'],
];
const PARTICIPIO = '(saltead|guisad|revuelt|estofad|asad|hornead)(?:o|a|os|as)';

const forma = (raiz, g, n) => `${raiz}${g === 'f' ? 'a' : 'o'}${n === 'p' ? 's' : ''}`;

export function concordarNombre(nombre) {
  if (typeof nombre !== 'string') return nombre;
  for (const [re, g, n] of CABEZAS) {
    const m = nombre.match(re);
    if (!m) continue;
    const cabeza = m[0];
    const resto = nombre.slice(cabeza.length);
    // «Garbanzos con pimientos guisado» → «Garbanzos guisados con pimientos»
    const alFinal = resto.match(new RegExp(`^ (con .+?) ${PARTICIPIO}$`));
    if (alFinal) return `${cabeza} ${forma(alFinal[2], g, n)} ${alFinal[1]}`;
    // «Ternera magra salteado con…» → «Ternera magra salteada con…»
    return cabeza + resto.replace(new RegExp(`^ ${PARTICIPIO}\\b`), (x, raiz) => ` ${forma(raiz, g, n)}`);
  }
  return nombre;
}
