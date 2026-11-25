// guarnicionLegumbre — genera src/engine2/dishes/guarnicionLegumbre.js a partir
// del inventario hidratos-legumbre.csv (paso 3 de la legumbre como guarnición,
// plan-implementacion.md).
//
// Toma los platos de plantilla con «sí» en admite_legumbre y su columna
// legumbres_validas, en el mismo orden, con cada legumbre como ingrediente del
// medidor (src/engine2/nutrientes/ingredientes.js). Se escribe como módulo JS,
// no como .json, para que lo importen igual la app (Vite), node y los tests.
//
// Uso:
//   node scripts/banco/medicion/inventario/guarnicionLegumbre.mjs [--salida src/engine2/dishes/guarnicionLegumbre.js]

import fs from 'node:fs';
import { INGREDIENTES } from '../../../../src/engine2/nutrientes/ingredientes.js';

const args = process.argv.slice(2);
const i = args.indexOf('--salida');
const salida = i >= 0 && args[i + 1] ? args[i + 1] : 'src/engine2/dishes/guarnicionLegumbre.js';
const CSV = new URL('./hidratos-legumbre.csv', import.meta.url);

// Nombre del inventario → ingrediente.
const CLAVE = Object.freeze({
  garbanzos: 'garbanzos_cocidos',
  'alubias blancas': 'alubias_blancas_cocidas',
  'alubias rojas': 'alubias_rojas_cocidas',
  'alubias pintas': 'alubias_pintas_cocidas',
  'alubias negras': 'alubias_negras_cocidas',
  'lentejas pardinas': 'lentejas_pardinas_cocidas',
  'lentejas beluga': 'lentejas_beluga_cocidas',
  habitas: 'habitas',
  guisantes: 'guisantes',
  edamame: 'edamame',
});

function leerCsv(texto) {
  const [cab, ...filas] = texto.replace(new RegExp('^' + String.fromCharCode(0xfeff)), '').split(/\r?\n/).filter(Boolean);
  const campos = cab.split(';');
  return filas.map((l) => {
    const v = []; let cur = ''; let q = false;
    for (let k = 0; k < l.length; k++) {
      const ch = l[k];
      if (q) { if (ch === '"' && l[k + 1] === '"') { cur += '"'; k++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ';') { v.push(cur); cur = ''; } else cur += ch;
    }
    v.push(cur);
    return Object.fromEntries(campos.map((c, n) => [c, v[n]]));
  });
}

const lista = {};
for (const f of leerCsv(fs.readFileSync(CSV, 'utf8'))) {
  if (f.origen !== 'plantilla' || f.admite_legumbre !== 'sí') continue;
  if (lista[f.id]) throw new Error(`id repetido en el inventario: ${f.id}`);
  lista[f.id] = f.legumbres_validas.split(',').map((x) => x.trim()).filter(Boolean).map((n) => {
    const c = CLAVE[n];
    if (!c) throw new Error(`legumbre sin ingrediente: «${n}» (${f.id})`);
    if (!INGREDIENTES[c] || INGREDIENTES[c].grupo !== 'legumbre') throw new Error(`${c} no es un ingrediente de legumbre`);
    return c;
  });
}

const cuerpo = Object.entries(lista).map(([id, l]) => `  ${JSON.stringify(id)}: Object.freeze(${JSON.stringify(l)}),`).join('\n');
fs.writeFileSync(salida, `// Generado por scripts/banco/medicion/inventario/guarnicionLegumbre.mjs a partir de
// hidratos-legumbre.csv. No editar a mano.
//
// Legumbres válidas como guarnición de cada plato de plantilla (id = tupla de la
// plantilla en JSON), en el orden del inventario, como ingredientes del medidor.
// Un plato que no está aquí no admite guarnición de legumbre. Aún no lo usa
// nadie (paso 3 de la legumbre como guarnición).

export const GUARNICION_LEGUMBRE = Object.freeze({
${cuerpo}
});

/** Lista de legumbres válidas como guarnición del plato, o null si no admite. */
export function legumbresGuarnicion(dishId) {
  return Object.prototype.hasOwnProperty.call(GUARNICION_LEGUMBRE, dishId) ? GUARNICION_LEGUMBRE[dishId] : null;
}
`);
console.log(`${Object.keys(lista).length} platos → ${salida}`);
