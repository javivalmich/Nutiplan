// composicion — genera src/engine2/nutrientes/composicion.js (kcal,
// proteína, hidratos, grasa, fibra y agua por 100 g de cada ingrediente) a
// partir de la descarga de BEDCA (scripts/medidor/bajarBedca.mjs) y de las
// fuentes elegidas en src/engine2/nutrientes/fuentesBedca.js.
//
// Comprueba cada alimento: la energía de BEDCA frente a la calculada con sus
// macros (4 kcal/g proteína e hidratos, 9 grasa, 2 fibra) y que agua + macros
// no pasen de 100 g. Lo que no cuadra queda en «avisos», no se corrige.
//
// Uso:
//   node scripts/medidor/composicion.mjs --bedca <bedca.json> [--salida src/engine2/nutrientes/composicion.js]
// Se escribe como módulo JS (no JSON) para que lo importen igual la app
// (Vite), node y los tests.

import fs from 'node:fs';
import crypto from 'node:crypto';
import { FUENTES } from '../../src/engine2/nutrientes/fuentesBedca.js';
import { INGREDIENTES } from '../../src/engine2/nutrientes/ingredientes.js';

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const rutaBedca = arg('--bedca');
const salida = arg('--salida', 'src/engine2/nutrientes/composicion.js');
if (!rutaBedca) { console.error('uso: composicion.mjs --bedca <bedca.json> [--salida <composicion.js>]'); process.exit(1); }

const crudo = fs.readFileSync(rutaBedca);
const bedca = JSON.parse(crudo);
const porId = new Map(bedca.alimentos.map((a) => [a.id, a]));

const r1 = (x) => Math.round(x * 10) / 10;

function deBedca(id) {
  const a = porId.get(id);
  if (!a) throw new Error(`BEDCA no tiene el alimento ${id}`);
  const v = {};
  for (const c of a.componentes) v[c.eur] = c;
  const num = (eur) => (v[eur] && v[eur].valor != null ? v[eur].valor : 0);
  const e = v.ENERC;
  if (!e || e.valor == null) throw new Error(`BEDCA ${id} (${a.nombre}) no tiene energía`);
  const kcal = e.unidad === 'kJ' ? e.valor / 4.184 : e.valor;
  return {
    kcal: Math.round(kcal), proteina: r1(num('PROT')), hidratos: r1(num('CHO')), grasa: r1(num('FAT')), fibra: r1(num('FIBT')),
    agua: v.WATER && v.WATER.valor != null ? r1(v.WATER.valor) : null,
    fuente: { bedca: id, nombre: a.nombre, grupo: a.grupo },
  };
}

const resultado = {};
const avisos = [];
function resolver(clave, pila = []) {
  if (resultado[clave]) return resultado[clave];
  const f = FUENTES[clave];
  if (!f) throw new Error(`Sin fuente para ${clave}`);
  if (pila.includes(clave)) throw new Error(`Receta circular: ${[...pila, clave].join(' → ')}`);
  let c;
  if (f.bedca) c = deBedca(f.bedca);
  else if (f.receta) {
    const suma = f.receta.reduce((a, [, x]) => a + x, 0);
    if (Math.abs(suma - 1) > 1e-6) throw new Error(`La receta de ${clave} no suma 1 (${suma})`);
    c = { kcal: 0, proteina: 0, hidratos: 0, grasa: 0, fibra: 0, agua: null };
    for (const [k, x] of f.receta) {
      const p = resolver(k, [...pila, clave]);
      for (const m of ['kcal', 'proteina', 'hidratos', 'grasa', 'fibra']) c[m] += p[m] * x;
    }
    for (const m of ['proteina', 'hidratos', 'grasa', 'fibra']) c[m] = r1(c[m]);
    c.kcal = Math.round(c.kcal);
    c.fuente = { receta: f.receta };
  } else if (f.etiqueta) c = { ...f.etiqueta, agua: null, fuente: { etiqueta: true } };
  else throw new Error(`Fuente de ${clave} sin tipo`);
  if (f.nota) c.fuente.nota = f.nota;

  const atwater = 4 * c.proteina + 4 * c.hidratos + 9 * c.grasa + 2 * c.fibra;
  if (c.kcal > 40 && Math.abs(atwater - c.kcal) / c.kcal > 0.15) {
    avisos.push(`${clave}: energía ${c.kcal} kcal frente a ${Math.round(atwater)} por sus macros (${c.fuente.nombre || 'derivado'})`);
  }
  if (c.agua != null && c.agua + c.proteina + c.hidratos + c.grasa + c.fibra > 105) {
    avisos.push(`${clave}: agua + macros = ${r1(c.agua + c.proteina + c.hidratos + c.grasa + c.fibra)} g por 100 g (${c.fuente.nombre})`);
  }
  resultado[clave] = c;
  return c;
}

const faltan = [];
for (const [clave, ing] of Object.entries(INGREDIENTES)) {
  if (ing.despreciable) continue;
  if (!FUENTES[clave]) { faltan.push(clave); continue; }
  resolver(clave);
}
if (faltan.length) { console.error(`Ingredientes sin fuente: ${faltan.join(', ')}`); process.exit(1); }

const ingredientes = {};
for (const clave of Object.keys(INGREDIENTES)) if (resultado[clave]) ingredientes[clave] = resultado[clave];

const datos = {
  fuente: bedca.fuente,
  bedcaDescargado: bedca.descargado,
  bedcaSha256: crypto.createHash('sha256').update(crudo).digest('hex'),
  unidades: 'por 100 g de parte comestible, en el estado del ingrediente (crudo, seco, cocido…)',
  avisos,
  ingredientes,
};
fs.writeFileSync(salida, `// Generado por scripts/medidor/composicion.mjs a partir de BEDCA. No editar a mano.\nexport const COMPOSICION_DATOS = ${JSON.stringify(datos, null, 1)};\nexport const COMPOSICION = COMPOSICION_DATOS.ingredientes;\n`);
console.log(`${Object.keys(ingredientes).length} ingredientes → ${salida}`);
if (avisos.length) { console.log('Avisos:'); for (const a of avisos) console.log(`  - ${a}`); }
