// Hoja de anotación de tiempo y dificultad de los platos de comida y cena de
// engine2 (2026-11-25). Solo datos: no cambia src/ ni el motor.
//
// Uso (desde la raíz del repo):
//   node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/tiempo-dificultad/generar.mjs
//
// Si la hoja ya existe, conserva lo escrito en las tres columnas de Javi
// (por id). Si hay anotaciones de un id que ya no está en el catálogo, se para.

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { catalogoApp } from '../../../../src/plan/catalogo.js';
import { conPlatosDieta } from '../../../../src/plan/platosDieta.js';
import { componerPlato, tuplaDe } from '../../../../src/plan/textos/componer.js';
import { filtrarCatalogo } from '../../../../src/plan/engine2App.js';
import { LIBRES, LIBRES_ESPERA_LARGA } from './propuestasLibres.mjs';
import { proponerPlantilla } from './propuestasPlantilla.mjs';

const SALIDA = fileURLToPath(new URL('./anotacion-tiempo.xlsx', import.meta.url));
const TRAMOS = ['≤15', '15–30', '30–45', '>45'];
const DIFICULTADES = ['fácil', 'media', 'elaborada'];
const DIF = { F: 'fácil', M: 'media', E: 'elaborada' };
const KCAL = 2000;

// ─── Platos ──────────────────────────────────────────────────────────────────

const comun = catalogoApp();
const todos = [...new Map(['vegetariana', 'vegana']
  .flatMap((dieta) => conPlatosDieta(comun, { dieta }, { reserva: true }))
  .concat(comun).map((d) => [d.id, d])).values()];
const idsComunes = new Set(comun.map((d) => d.id));

// Qué platos puede ver cada dieta, sin intolerancias (los de reserva, D-109, no cuentan).
const pool = Object.fromEntries(['omnivora', 'vegetariana', 'vegana'].map((dieta) => [
  dieta, new Set(filtrarCatalogo(comun, { dieta, intolerances: [], eliminatedFoods: [] }, KCAL).catalogo.map((d) => d.id)),
]));

const filas = todos.map((d) => {
  const meal = componerPlato(d, d.momento.includes('comida') ? 'comida' : 'cena', KCAL);
  const tupla = tuplaDe(d.id);
  let p;
  if (tupla) p = proponerPlantilla(tupla, meal.recipe);
  else {
    const f = LIBRES[d.id];
    if (!f) throw new Error(`Falta la propuesta de «${d.id}» en propuestasLibres.mjs`);
    p = { tipo: f[0], tramo: f[1], dificultad: f[2], motivo: f[3], esperaLarga: LIBRES_ESPERA_LARGA.has(d.id) };
  }
  return {
    id: d.id,
    nombre: d.nombre,
    momento: d.momento.length === 2 ? 'comida y cena' : d.momento[0],
    origen: tupla ? 'plantilla' : idsComunes.has(d.id) ? 'texto libre' : 'texto libre (dieta)',
    tipo: p.tipo,
    pasos: meal.recipe.length,
    energia: d.energiaCocina,
    lote: d.batchable ? 'sí' : 'no',
    espera: p.esperaLarga ? 'sí' : 'no',
    tramo: TRAMOS[p.tramo - 1],
    dificultad: DIF[p.dificultad],
    motivo: p.motivo,
    omnivora: pool.omnivora.has(d.id) ? 'sí' : 'no',
    vegetariana: pool.vegetariana.has(d.id) ? 'sí' : 'no',
    vegana: pool.vegana.has(d.id) ? 'sí' : 'no',
  };
});
const ORDEN_ORIGEN = ['plantilla', 'texto libre', 'texto libre (dieta)'];
filas.sort((a, b) => ORDEN_ORIGEN.indexOf(a.origen) - ORDEN_ORIGEN.indexOf(b.origen) || a.nombre.localeCompare(b.nombre, 'es'));

// ─── Anotaciones que ya hubiera ──────────────────────────────────────────────

const COLS = [
  ['id', 'id', 22], ['nombre', 'Nombre', 62], ['momento', 'Momento', 14], ['origen', 'Origen', 18],
  ['tipo', 'Tipo de cocción', 18], ['pasos', 'Nº pasos', 9], ['energia', 'energiaCocina actual', 12],
  ['lote', 'De lote', 8], ['espera', 'Espera >30 min sin vigilar', 13],
  ['tramo', 'PROPUESTA minutos activos', 14], ['dificultad', 'PROPUESTA dificultad', 13], ['motivo', 'Motivo', 58],
  ['jTramo', 'JAVI minutos activos', 14], ['jDificultad', 'JAVI dificultad', 13], ['jComentario', 'JAVI comentarios', 40],
  ['vTramo', 'Vigente minutos', 11], ['vDificultad', 'Vigente dificultad', 11],
  ['omnivora', 'En omnívora', 10], ['vegetariana', 'En vegetariana', 11], ['vegana', 'En vegana', 9],
];
const letra = (clave) => String.fromCharCode(65 + COLS.findIndex((c) => c[0] === clave));
const DE_JAVI = ['jTramo', 'jDificultad', 'jComentario'];

async function leerAnotaciones() {
  const previas = new Map();
  if (!fs.existsSync(SALIDA)) return previas;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SALIDA);
  const hoja = wb.getWorksheet('Platos');
  if (!hoja) throw new Error('La hoja existente no tiene la pestaña «Platos»: no la sobrescribo.');
  const col = new Map();
  hoja.getRow(1).eachCell((c, n) => col.set(String(c.value), n));
  const nCol = (clave) => {
    const n = col.get(COLS.find((c) => c[0] === clave)[1]);
    if (!n) throw new Error(`La hoja existente no tiene la columna de «${clave}»: no la sobrescribo.`);
    return n;
  };
  hoja.eachRow((fila, i) => {
    if (i === 1) return;
    const v = Object.fromEntries(DE_JAVI.map((k) => [k, fila.getCell(nCol(k)).value]));
    if (DE_JAVI.some((k) => v[k] != null && v[k] !== '')) previas.set(String(fila.getCell(nCol('id')).value), v);
  });
  return previas;
}

const previas = await leerAnotaciones();
const ids = new Set(filas.map((f) => f.id));
const huerfanas = [...previas.keys()].filter((id) => !ids.has(id));
if (huerfanas.length) throw new Error(`Hay anotaciones de platos que ya no existen: ${huerfanas.join(', ')}`);
for (const f of filas) Object.assign(f, previas.get(f.id) || {});
for (const f of filas) {
  f.vTramo = f.jTramo || f.tramo;
  f.vDificultad = f.jDificultad || f.dificultad;
}

// ─── Libro ───────────────────────────────────────────────────────────────────

const wb = new ExcelJS.Workbook();
wb.calcProperties.fullCalcOnLoad = true;
const relleno = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const AZUL = 'FFDDEBF7';
const AMARILLO = 'FFFFF2CC';
const GRIS = 'FFEDEDED';

const leeme = wb.addWorksheet('Leeme');
leeme.getColumn(1).width = 110;
const n = (o) => filas.filter((f) => f.origen === o).length;
[
  ['Tiempo y dificultad de los platos de comida y cena', true],
  [`${filas.length} platos: ${n('plantilla')} de plantilla, ${n('texto libre')} de texto libre y ${n('texto libre (dieta)')} de texto libre de dieta (vegetariana/vegana).`],
  [''],
  ['Qué tienes que hacer', true],
  ['En «Platos», las columnas amarillas son tuyas. Déjalas vacías si estás de acuerdo con la propuesta (azul).'],
  ['Si no, elige en el desplegable el tramo o la dificultad correctos. En comentarios puedes escribir lo que quieras.'],
  ['Las columnas «Vigente» y la pestaña «Resumen» (parte derecha) se actualizan solas con tus correcciones.'],
  [''],
  ['Criterio de minutos activos', true],
  ['Cuenta el tiempo que estás ocupado el día que se cocina el plato (no el día de recalentar sobras).'],
  ['Cuenta: lavar, pelar, cortar, picar, sazonar, plancha, salteado, revuelto, remover, formar, rellenar, montar y servir.'],
  ['No cuenta: horno, airfryer, hervir arroz/pasta/patata, cocción larga tapada, remojo, marinado, enfriado y reposo.'],
  ['Dos cosas a la vez no suman enteras: mientras se hace algo solo, se prepara lo siguiente.'],
  ['Tramos: ≤15 (hasta 15 incluido), 15–30 (más de 15 y hasta 30), 30–45 (más de 30 y hasta 45), >45.'],
  ['Cocina doméstica normal, sin prisa y sin ser experto. Legumbres de bote, caldo, hummus o masa ya hechos solo si la receta los pide así.'],
  ['«Espera >30 min sin vigilar» = sí: el plato tarda en estar listo aunque casi no pida atención. Míralo para entre semana.'],
  [''],
  ['Criterio de dificultad', true],
  ['fácil: una o dos preparaciones sencillas (cortar, hervir, plancha, bandeja de horno, montar); cuesta estropearlo.'],
  ['media: sofrito y cocción, salsa, varias cosas en paralelo o un punto que vigilar (pescado a la plancha, huevo, arroz).'],
  ['elaborada: tres o más preparaciones, o una técnica que pide práctica (masa, capas, bechamel, mantecar, formar piezas).'],
  [''],
  ['De dónde sale cada columna', true],
  ['Nº pasos: pasos de la receta que escribe la app a 2000 kcal. En algunos de plantilla, el último es solo «Se conserva bien…».'],
  ['energiaCocina actual y De lote (batchable): ficha del plato en el catálogo. «De lote» = se puede cocinar de más y guardar.'],
  ['Tipo de cocción: en plantilla, el del id del plato; en texto libre no existe el campo y lo he puesto yo.'],
  ['PROPUESTA y Motivo: míos, estimados leyendo la receta; no están medidos. En plantilla salen de una regla por componentes'],
  ['(propuestasPlantilla.mjs); en texto libre, plato a plato (propuestasLibres.mjs).'],
  ['En omnívora / vegetariana / vegana: si el plato entra en el catálogo de esa dieta, sin intolerancias ni los platos de reserva.'],
].forEach(([t, negrita]) => {
  const fila = leeme.addRow([t]);
  fila.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  if (negrita) fila.font = { bold: true };
});

const resumen = wb.addWorksheet('Resumen');

const platos = wb.addWorksheet('Platos', { views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }] });
platos.columns = COLS.map(([key, header, width]) => ({ key, header, width }));
const cabecera = platos.getRow(1);
cabecera.font = { bold: true };
cabecera.height = 45;
cabecera.alignment = { wrapText: true, vertical: 'middle' };
filas.forEach((f, i) => {
  const r = i + 2;
  const fila = platos.addRow({
    ...f,
    vTramo: { formula: `IF(${letra('jTramo')}${r}="",${letra('tramo')}${r},${letra('jTramo')}${r})`, result: f.vTramo },
    vDificultad: { formula: `IF(${letra('jDificultad')}${r}="",${letra('dificultad')}${r},${letra('jDificultad')}${r})`, result: f.vDificultad },
  });
  for (const k of ['nombre', 'motivo', 'jComentario']) fila.getCell(k).alignment = { wrapText: true, vertical: 'top' };
  for (const k of ['tramo', 'dificultad', 'motivo']) fila.getCell(k).fill = relleno(AZUL);
  for (const k of DE_JAVI) fila.getCell(k).fill = relleno(AMARILLO);
  const lista = (k, valores) => {
    fila.getCell(k).dataValidation = {
      type: 'list', allowBlank: true, formulae: [`"${valores.join(',')}"`],
      showErrorMessage: true, errorTitle: 'Valor no válido', error: `Elige: ${valores.join(', ')}`,
    };
  };
  lista('jTramo', TRAMOS);
  lista('jDificultad', DIFICULTADES);
});
const ultima = filas.length + 1;
platos.autoFilter = { from: 'A1', to: `${letra('vegana')}${ultima}` };

// ─── Resumen ─────────────────────────────────────────────────────────────────

const rango = (k) => `Platos!$${letra(k)}$2:$${letra(k)}$${ultima}`;
// «comida» incluye los platos de «comida y cena».
const MOMENTOS = [['Todos', null], ['Comida', '*comida*'], ['Cena', '*cena*']];
const vale = (f, momento) => momento == null || f.momento.includes(momento.replaceAll('*', ''));

/** Celda COUNTIFS con su resultado ya calculado. condiciones: [columna, [valores]] (varios valores se suman). */
function contar(momento, condiciones) {
  let combos = [[]];
  for (const [k, valores] of condiciones) combos = combos.flatMap((c) => valores.map((v) => [...c, [k, v]]));
  // «=» delante: sin él, Excel leería «>45» como «mayor que 45».
  const formula = combos.map((c) => {
    const partes = c.map(([k, v]) => `${rango(k)},"=${v}"`);
    if (momento) partes.push(`${rango('momento')},"${momento}"`);
    return `COUNTIFS(${partes.join(',')})`;
  }).join('+');
  const result = filas.filter((f) => vale(f, momento) && condiciones.every(([k, vs]) => vs.includes(f[k]))).length;
  return { formula, result };
}

resumen.columns = [{ width: 44 }, ...Array.from({ length: 7 }, (_, i) => ({ width: i === 3 ? 4 : 11 }))];
const titulo = (t) => { resumen.addRow([t]).font = { bold: true }; };
const encabezado = (primera) => {
  const r = resumen.addRow([primera, ...MOMENTOS.map((m) => m[0]), '', ...MOMENTOS.map((m) => m[0])]);
  r.font = { bold: true };
  r.eachCell((c) => { c.fill = relleno(GRIS); });
};
const linea = (etiqueta, condProp, condVig) => resumen.addRow([
  etiqueta, ...MOMENTOS.map((m) => contar(m[1], condProp)), '', ...MOMENTOS.map((m) => contar(m[1], condVig)),
]);

titulo('Izquierda: según la PROPUESTA. Derecha: VIGENTE (con las correcciones de Javi).');
resumen.addRow(['«Comida» y «Cena» incluyen los platos que valen para las dos, así que no suman «Todos».']);

for (const [nombre, dieta] of [['omnívora', 'omnivora'], ['vegetariana', 'vegetariana'], ['vegana', 'vegana']]) {
  const base = [[dieta, ['sí']]];
  resumen.addRow([]);
  titulo(`Dieta ${nombre} (sin intolerancias)`);
  encabezado('Minutos activos');
  for (const t of TRAMOS) linea(t, [...base, ['tramo', [t]]], [...base, ['vTramo', [t]]]);
  linea('Total', base, base);
  encabezado('Dificultad');
  for (const d of DIFICULTADES) linea(d, [...base, ['dificultad', [d]]], [...base, ['vDificultad', [d]]]);
  linea('Total', base, base);
  encabezado('«Poco tiempo» + «no me gusta cocinar» (entre semana)');
  for (const [etiqueta, tramos, extra] of [
    ['Estricto: ≤15 y fácil', TRAMOS.slice(0, 1), []],
    ['  … sin espera larga', TRAMOS.slice(0, 1), [['espera', ['no']]]],
    ['Amplio: hasta 30 y fácil', TRAMOS.slice(0, 2), []],
    ['  … sin espera larga', TRAMOS.slice(0, 2), [['espera', ['no']]]],
  ]) {
    linea(etiqueta, [...base, ...extra, ['tramo', tramos], ['dificultad', ['fácil']]], [...base, ...extra, ['vTramo', tramos], ['vDificultad', ['fácil']]]);
  }
}
resumen.addRow([]);
resumen.addRow(['El catálogo no distingue días: «entre semana» son los mismos platos. No se aplican topes ni vetos semanales.']);

await wb.xlsx.writeFile(SALIDA);

// ─── Consola ─────────────────────────────────────────────────────────────────

console.log(`${SALIDA}\n${filas.length} platos; anotaciones conservadas: ${previas.size}`);
resumen.eachRow((r) => {
  const v = r.values.slice(1).map((x) => (x && typeof x === 'object' ? x.result : x ?? ''));
  console.log(v.slice(0, 4).join(' | '));
});
