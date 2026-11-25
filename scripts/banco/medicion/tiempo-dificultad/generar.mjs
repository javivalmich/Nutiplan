// Hoja de anotación de tiempo y dificultad de los platos de comida y cena de
// engine2 (2026-11-25). Solo datos: no cambia src/ ni el motor.
//
// Uso (desde la raíz del repo):
//   node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/tiempo-dificultad/generar.mjs
//
// La evaluación del cocinero es la definitiva: «Vigente» = cocinero, salvo lo
// que Javi rellene en sus columnas, que prevalece. La propuesta antigua
// (propuestasPlantilla.mjs, propuestasLibres.mjs) queda solo como referencia.
//
// Si la hoja ya existe, conserva por id lo escrito en las columnas de Javi y en
// las del cocinero, y en «Incoherencias» el tipo y el archivo de cada una (por
// id y descripción). Si hay anotaciones de un id que ya no está en el catálogo,
// se para. Las columnas «Vigente» y «tramo_poco_tiempo» son fórmulas.

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


// ─── Columnas ────────────────────────────────────────────────────────────────

const COLS = [
  ['id', 'id', 22], ['nombre', 'Nombre', 62], ['momento', 'Momento', 14], ['origen', 'Origen', 18],
  ['tipo', 'Tipo de cocción', 18], ['pasos', 'Nº pasos', 9], ['energia', 'energiaCocina actual', 12], ['lote', 'De lote', 8],
  // Vigente: Javi si lo ha escrito; si no, el cocinero. Fórmulas.
  ['vActivo', 'VIGENTE activo_min', 10], ['vEspera', 'VIGENTE espera_min', 10], ['vTotal', 'VIGENTE total_min', 10],
  ['vPrevia', 'VIGENTE preparación previa', 11], ['vPoco', 'VIGENTE tramo_poco_tiempo', 11],
  ['vDificultad', 'VIGENTE dificultad', 11], ['vTramo', 'VIGENTE tramo de minutos activos', 11],
  // De Javi (amarillas): vacías = de acuerdo con el cocinero.
  ['jActivo', 'JAVI activo_min', 10], ['jEspera', 'JAVI espera_min', 10], ['jPrevia', 'JAVI preparación previa', 11],
  ['jDificultad', 'JAVI dificultad', 11], ['jComentario', 'JAVI comentarios', 40],
  // Del cocinero (verdes).
  ['cActivo', 'COCINERO activo_min', 10], ['cEspera', 'COCINERO espera_min', 10], ['cTotal', 'COCINERO total_min', 10],
  ['cPrevia', 'COCINERO preparación previa', 11], ['cPoco', 'COCINERO tramo_poco_tiempo', 11],
  ['cDificultad', 'COCINERO dificultad', 12], ['cConfianza', 'COCINERO confianza', 11],
  ['cMotivo', 'COCINERO motivo', 60], ['cIncoherencia', 'COCINERO incoherencia', 45],
  ['omnivora', 'En omnívora', 10], ['vegetariana', 'En vegetariana', 11], ['vegana', 'En vegana', 9],
  // Propuesta antigua (gris): solo referencia.
  ['tramo', 'ANTIGUA minutos activos (referencia)', 14], ['dificultad', 'ANTIGUA dificultad (referencia)', 13],
  ['espera', 'ANTIGUA espera >30 min sin vigilar', 13], ['motivo', 'ANTIGUA motivo', 50],
];
const letraN = (i) => (i >= 26 ? letraN(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));
const letra = (clave) => {
  const i = COLS.findIndex((c) => c[0] === clave);
  if (i < 0) throw new Error(`Columna desconocida: ${clave}`);
  return letraN(i);
};
const DE_JAVI = ['jActivo', 'jEspera', 'jPrevia', 'jDificultad', 'jComentario'];
// Columnas de Javi que entraron después (2026-11-25): una hoja anterior puede no tenerlas.
const DE_JAVI_NUEVAS = ['jActivo', 'jEspera', 'jPrevia'];
// Columnas retiradas: si una hoja antigua las trae con algo escrito, no la sobrescribo.
const RETIRADAS = ['JAVI minutos activos'];
const DEL_COCINERO = ['cActivo', 'cEspera', 'cTotal', 'cPrevia', 'cDificultad', 'cConfianza', 'cMotivo', 'cIncoherencia'];
const SI_NO = ['sí', 'no'];
const CONFIANZAS = ['alta', 'media', 'baja'];
const TIPOS_INCOHERENCIA = ['nombre/receta', 'falta paso', 'falta en compra', 'técnica', 'seguridad', 'concordancia'];

const valorCelda = (celda) => {
  const v = celda.value;
  if (v && typeof v === 'object' && 'result' in v) return v.result;
  if (v && typeof v === 'object' && 'richText' in v) return v.richText.map((t) => t.text).join('');
  return v;
};
const vacio = (v) => v == null || v === '';

// ─── Anotaciones que ya hubiera ──────────────────────────────────────────────

async function leerAnotaciones() {
  const previas = new Map();
  const incoherencias = new Map();
  if (!fs.existsSync(SALIDA)) return { previas, incoherencias };
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SALIDA);
  const hoja = wb.getWorksheet('Platos');
  if (!hoja) throw new Error('La hoja existente no tiene la pestaña «Platos»: no la sobrescribo.');
  const col = new Map();
  hoja.getRow(1).eachCell((c, n) => col.set(String(c.value), n));
  const nCol = (clave) => col.get(COLS.find((c) => c[0] === clave)[1]);
  const faltan = [...DE_JAVI, ...DEL_COCINERO].filter((k) => !nCol(k) && !DE_JAVI_NUEVAS.includes(k));
  if (faltan.length) throw new Error(`La hoja existente no tiene las columnas ${faltan.join(', ')}: no la sobrescribo.`);
  for (const titulo of RETIRADAS) {
    const n = col.get(titulo);
    if (!n) continue;
    hoja.eachRow((fila, i) => {
      if (i > 1 && !vacio(valorCelda(fila.getCell(n)))) {
        throw new Error(`La columna retirada «${titulo}» tiene datos (fila ${i}): no la sobrescribo.`);
      }
    });
  }
  const claves = [...DE_JAVI, ...DEL_COCINERO].filter((k) => nCol(k));
  hoja.eachRow((fila, i) => {
    if (i === 1) return;
    const v = Object.fromEntries(claves.map((k) => [k, valorCelda(fila.getCell(nCol(k)))]));
    if (claves.some((k) => !vacio(v[k]))) previas.set(String(fila.getCell(nCol('id')).value), v);
  });
  const inc = wb.getWorksheet('Incoherencias');
  if (inc) {
    const ci = new Map();
    inc.getRow(1).eachCell((c, n) => ci.set(String(c.value), n));
    inc.eachRow((fila, i) => {
      if (i === 1) return;
      const id = valorCelda(fila.getCell(ci.get('id')));
      if (vacio(id)) return;
      incoherencias.set(`${id}\n${valorCelda(fila.getCell(ci.get('Descripción')))}`, {
        tipo: valorCelda(fila.getCell(ci.get('Tipo'))), archivo: valorCelda(fila.getCell(ci.get('Archivo del texto'))),
      });
    });
  }
  return { previas, incoherencias };
}

const { previas, incoherencias: incPrevias } = await leerAnotaciones();
const ids = new Set(filas.map((f) => f.id));
const huerfanas = [...previas.keys()].filter((id) => !ids.has(id));
if (huerfanas.length) throw new Error(`Hay anotaciones de platos que ya no existen: ${huerfanas.join(', ')}`);
for (const f of filas) Object.assign(f, previas.get(f.id) || {});

const tramoDe = (min) => TRAMOS[min <= 15 ? 0 : min <= 30 ? 1 : min <= 45 ? 2 : 3];
const pocoDe = (activo, total, previa) => (Number(activo) <= 30 && Number(total) <= 45 && previa === 'no' ? 'sí' : 'no');
for (const f of filas) {
  if (vacio(f.cActivo)) throw new Error(`Falta la evaluación del cocinero de «${f.id}»: sin ella no hay Vigente.`);
  f.cPoco = pocoDe(f.cActivo, f.cTotal, f.cPrevia);
  f.vActivo = vacio(f.jActivo) ? f.cActivo : f.jActivo;
  f.vEspera = vacio(f.jEspera) ? f.cEspera : f.jEspera;
  f.vTotal = vacio(f.jActivo) && vacio(f.jEspera) ? f.cTotal : Number(f.vActivo) + Number(f.vEspera);
  f.vPrevia = vacio(f.jPrevia) ? f.cPrevia : f.jPrevia;
  f.vPoco = pocoDe(f.vActivo, f.vTotal, f.vPrevia);
  f.vDificultad = vacio(f.jDificultad) ? f.cDificultad : f.jDificultad;
  f.vTramo = tramoDe(Number(f.vActivo));
}
const conJavi = filas.filter((f) => DE_JAVI.some((k) => !vacio(f[k]))).length;

// ─── Libro ───────────────────────────────────────────────────────────────────

const wb = new ExcelJS.Workbook();
wb.calcProperties.fullCalcOnLoad = true;
const relleno = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const AZUL = 'FFDDEBF7';
const AMARILLO = 'FFFFF2CC';
const GRIS = 'FFEDEDED';
const VERDE = 'FFE2EFDA';

const leeme = wb.addWorksheet('Leeme');
leeme.getColumn(1).width = 110;
const n = (o) => filas.filter((f) => f.origen === o).length;
[
  ['Tiempo y dificultad de los platos de comida y cena', true],
  [`${filas.length} platos: ${n('plantilla')} de plantilla, ${n('texto libre')} de texto libre y ${n('texto libre (dieta)')} de texto libre de dieta (vegetariana/vegana).`],
  [''],
  ['Qué columnas mandan', true],
  ['VIGENTE (azul) es lo que vale: la evaluación del cocinero (verde), salvo lo que Javi escriba en sus columnas (amarillo).'],
  ['Si Javi rellena activo, espera, preparación previa o dificultad, ese valor prevalece. Si toca activo o espera,'],
  ['el total vigente pasa a ser activo + espera. Vigente y tramo_poco_tiempo son fórmulas: se recalculan solas.'],
  ['ANTIGUA (gris, al final) es la propuesta anterior: solo referencia, no cuenta en ningún resumen.'],
  ['Los resúmenes («Resumen», «Cambios») usan Vigente. «Incoherencias»: una por fila, con su tipo y el archivo del texto.'],
  [''],
  ['Criterio (columnas del cocinero)', true],
  ['Cada plato se evalúa leyendo su receta, como lo haría en casa una persona normal, con utensilios normales, para 1-2 raciones.'],
  ['Se evalúa la opción principal de la receta (la primera que da); si la alternativa cambia mucho el resultado, lo dice el motivo.'],
  ['activo_min: minutos con las manos ocupadas (cortar, saltear, vigilar, remover, montar). Lo que va en paralelo va en paralelo.'],
  ['espera_min: minutos sin intervención (horno, olla, reposo, frío). total_min = activo + espera, de empezar a comer.'],
  ['Cuenta lo que tarda en hervir el agua (8 min para pasta y arroz) y en calentarse el horno (10 min).'],
  ['preparación previa: remojo la noche anterior, o congelar el pescado o la carne para comerlos crudos.'],
  ['tramo_poco_tiempo: «sí» si activo ≤ 30, total ≤ 45 y sin preparación previa.'],
  ['dificultad: fácil (no falla aunque no sepas cocinar), media (atención o punto: sofrito y guiso, salsa, dos sartenes a la vez,'],
  ['punto del pescado o el marisco, vuelta a una tortilla fina), elaborada (técnica o precisión: masa, plegar, bechamel,'],
  ['risotto o paella, tortilla de patatas, huevo pochado). Cremas: fácil. Verduras rellenas: media.'],
  ['Platos de lote: se evalúa el día que se cocinan; el motivo dice cuánto se tarda en recalentar.'],
  [''],
  ['De dónde sale cada columna', true],
  ['Nº pasos: pasos de la receta que escribe la app a 2000 kcal. energiaCocina y De lote (batchable): ficha del catálogo.'],
  ['Nombre: el del catálogo (scripts/phaseB2/output/dishes.json). En plantilla, la app muestra el nombre corregido (D-105, D-108).'],
  ['En omnívora / vegetariana / vegana: si el plato entra en el catálogo de esa dieta, sin intolerancias ni los platos de reserva.'],
  ['Las columnas de Javi y del cocinero, y el tipo y archivo de «Incoherencias», se conservan al regenerar la hoja.'],
].forEach(([t, negrita]) => {
  const fila = leeme.addRow([t]);
  fila.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  if (negrita) fila.font = { bold: true };
});

const resumen = wb.addWorksheet('Resumen');
const hojaCambios = wb.addWorksheet('Cambios');
const hojaInc = wb.addWorksheet('Incoherencias', { views: [{ state: 'frozen', ySplit: 1 }] });

const platos = wb.addWorksheet('Platos', { views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }] });
platos.columns = COLS.map(([key, header, width]) => ({ key, header, width }));
const cabecera = platos.getRow(1);
cabecera.font = { bold: true };
cabecera.height = 45;
cabecera.alignment = { wrapText: true, vertical: 'middle' };
filas.forEach((f, i) => {
  const r = i + 2;
  const c = (k) => `${letra(k)}${r}`;
  const fila = platos.addRow({
    ...f,
    vActivo: { formula: `IF(${c('jActivo')}="",${c('cActivo')},${c('jActivo')})`, result: f.vActivo },
    vEspera: { formula: `IF(${c('jEspera')}="",${c('cEspera')},${c('jEspera')})`, result: f.vEspera },
    vTotal: { formula: `IF(AND(${c('jActivo')}="",${c('jEspera')}=""),${c('cTotal')},${c('vActivo')}+${c('vEspera')})`, result: f.vTotal },
    vPrevia: { formula: `IF(${c('jPrevia')}="",${c('cPrevia')},${c('jPrevia')})`, result: f.vPrevia },
    vPoco: { formula: `IF(AND(${c('vActivo')}<=30,${c('vTotal')}<=45,${c('vPrevia')}="no"),"sí","no")`, result: f.vPoco },
    vDificultad: { formula: `IF(${c('jDificultad')}="",${c('cDificultad')},${c('jDificultad')})`, result: f.vDificultad },
    vTramo: { formula: `IF(${c('vActivo')}<=15,"≤15",IF(${c('vActivo')}<=30,"15–30",IF(${c('vActivo')}<=45,"30–45",">45")))`, result: f.vTramo },
    cPoco: { formula: `IF(AND(${c('cActivo')}<=30,${c('cTotal')}<=45,${c('cPrevia')}="no"),"sí","no")`, result: f.cPoco },
  });
  for (const k of ['nombre', 'motivo', 'jComentario', 'cMotivo', 'cIncoherencia']) fila.getCell(k).alignment = { wrapText: true, vertical: 'top' };
  for (const k of ['vActivo', 'vEspera', 'vTotal', 'vPrevia', 'vPoco', 'vDificultad', 'vTramo']) fila.getCell(k).fill = relleno(AZUL);
  for (const k of DE_JAVI) fila.getCell(k).fill = relleno(AMARILLO);
  for (const k of [...DEL_COCINERO, 'cPoco']) fila.getCell(k).fill = relleno(VERDE);
  for (const k of ['tramo', 'dificultad', 'espera', 'motivo']) fila.getCell(k).fill = relleno(GRIS);
  const lista = (k, valores) => {
    fila.getCell(k).dataValidation = {
      type: 'list', allowBlank: true, formulae: [`"${valores.join(',')}"`],
      showErrorMessage: true, errorTitle: 'Valor no válido', error: `Elige: ${valores.join(', ')}`,
    };
  };
  const minutos = (k) => {
    fila.getCell(k).dataValidation = {
      type: 'whole', operator: 'between', allowBlank: true, formulae: [0, 600],
      showErrorMessage: true, errorTitle: 'Valor no válido', error: 'Minutos: un número entero entre 0 y 600',
    };
  };
  minutos('jActivo');
  minutos('jEspera');
  lista('jPrevia', SI_NO);
  lista('jDificultad', DIFICULTADES);
  minutos('cActivo');
  minutos('cEspera');
  minutos('cTotal');
  lista('cPrevia', SI_NO);
  lista('cDificultad', DIFICULTADES);
  lista('cConfianza', CONFIANZAS);
});
const ultima = filas.length + 1;
platos.autoFilter = { from: 'A1', to: `${letra(COLS.at(-1)[0])}${ultima}` };

// ─── Resumen (Vigente) ───────────────────────────────────────────────────────

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

resumen.columns = [{ width: 50 }, ...Array.from({ length: 7 }, () => ({ width: 12 }))];
const titulo = (hoja, t) => { hoja.addRow([t]).font = { bold: true }; };
const encabezado = (hoja, celdas) => {
  const r = hoja.addRow(celdas);
  r.font = { bold: true };
  r.eachCell((c) => { c.fill = relleno(GRIS); });
};
const linea = (etiqueta, cond) => resumen.addRow([etiqueta, ...MOMENTOS.map((m) => contar(m[1], cond))]);
const DIETAS = [['omnívora', 'omnivora'], ['vegetariana', 'vegetariana'], ['vegana', 'vegana']];

titulo(resumen, 'Resumen según VIGENTE (cocinero, con lo que Javi corrija). Se recalcula solo.');
resumen.addRow([`Platos con alguna columna de Javi escrita: ${conJavi} de ${filas.length}. «Comida» y «Cena» incluyen los que valen para las dos.`]);
resumen.addRow([]);
titulo(resumen, 'Todos los platos (todas las dietas)');
encabezado(resumen, ['Dificultad', ...MOMENTOS.map((m) => m[0])]);
for (const d of DIFICULTADES) linea(d, [['vDificultad', [d]]]);
encabezado(resumen, ['tramo_poco_tiempo (activo ≤30, total ≤45, sin previa)', ...MOMENTOS.map((m) => m[0])]);
for (const v of SI_NO) linea(v, [['vPoco', [v]]]);
linea('  con preparación previa', [['vPrevia', ['sí']]]);
encabezado(resumen, ['Confianza del cocinero', ...MOMENTOS.map((m) => m[0])]);
for (const c of CONFIANZAS) linea(c, [['cConfianza', [c]]]);

for (const [nombre, dieta] of DIETAS) {
  const base = [[dieta, ['sí']]];
  resumen.addRow([]);
  titulo(resumen, `Dieta ${nombre} (sin intolerancias)`);
  encabezado(resumen, ['Minutos activos', ...MOMENTOS.map((m) => m[0])]);
  for (const t of TRAMOS) linea(t, [...base, ['vTramo', [t]]]);
  encabezado(resumen, ['Dificultad', ...MOMENTOS.map((m) => m[0])]);
  for (const d of DIFICULTADES) linea(d, [...base, ['vDificultad', [d]]]);
  encabezado(resumen, ['Poco tiempo', ...MOMENTOS.map((m) => m[0])]);
  linea('tramo_poco_tiempo = sí', [...base, ['vPoco', ['sí']]]);
  linea('«Poco tiempo + fácil»', [...base, ['vPoco', ['sí']], ['vDificultad', ['fácil']]]);
  linea('Total de platos de la dieta', base);
}

resumen.addRow([]);
titulo(resumen, '«Poco tiempo + fácil» frente a la propuesta antigua (referencia)');
resumen.addRow(['Antigua: minutos activos hasta 30 y dificultad fácil (no miraba el total ni el remojo).']);
encabezado(resumen, ['Dieta', 'Comida antigua', 'Comida vigente', 'Cena antigua', 'Cena vigente', 'Platos comida', 'Platos cena']);
for (const [nombre, dieta] of DIETAS) {
  const base = [[dieta, ['sí']]];
  const antes = [...base, ['tramo', TRAMOS.slice(0, 2)], ['dificultad', ['fácil']]];
  const ahora = [...base, ['vPoco', ['sí']], ['vDificultad', ['fácil']]];
  resumen.addRow([nombre, contar('*comida*', antes), contar('*comida*', ahora), contar('*cena*', antes), contar('*cena*', ahora),
    contar('*comida*', base), contar('*cena*', base)]);
}
resumen.addRow([]);
resumen.addRow(['El catálogo no distingue días: «entre semana» son los mismos platos. No se aplican topes ni vetos semanales.']);

// ─── Cambios frente a la propuesta antigua ───────────────────────────────────

hojaCambios.columns = [{ width: 50 }, { width: 22 }, { width: 13 }, ...Array.from({ length: 5 }, () => ({ width: 12 })), { width: 60 }];
titulo(hojaCambios, 'Platos en los que Vigente cambia la dificultad o el tramo de minutos activos respecto a la propuesta antigua');
hojaCambios.addRow(['Lista fija: se escribe al generar la hoja con los valores de ese momento (no se recalcula al editar).']);
encabezado(hojaCambios, ['Nombre', 'id', 'Momento', 'Activos antigua', 'Activos vigente', 'Dificultad antigua', 'Dificultad vigente',
  'Poco tiempo + fácil', 'Motivo del cocinero']);
const pocoFacilAntes = (f) => TRAMOS.slice(0, 2).includes(f.tramo) && f.dificultad === 'fácil';
const pocoFacilAhora = (f) => f.vPoco === 'sí' && f.vDificultad === 'fácil';
const cambios = filas.filter((f) => f.vDificultad !== f.dificultad || f.vTramo !== f.tramo);
for (const f of cambios) {
  const pf = pocoFacilAntes(f) === pocoFacilAhora(f) ? (pocoFacilAhora(f) ? 'sí (igual)' : 'no (igual)') : pocoFacilAhora(f) ? 'entra' : 'sale';
  const r = hojaCambios.addRow([f.nombre, f.id, f.momento, f.tramo, f.vTramo, f.dificultad, f.vDificultad, pf, f.cMotivo]);
  for (const k of [1, 9]) r.getCell(k).alignment = { wrapText: true, vertical: 'top' };
}
hojaCambios.addRow([`${cambios.length} platos.`]);

// ─── Incoherencias ───────────────────────────────────────────────────────────

// Una por fila, sacadas de «COCINERO incoherencia» (varias en una celda van separadas por « | »).
hojaInc.columns = [
  { header: 'Plato', key: 'nombre', width: 50 }, { header: 'id', key: 'id', width: 22 }, { header: 'Momento', key: 'momento', width: 13 },
  { header: 'Tipo', key: 'tipo', width: 16 }, { header: 'Descripción', key: 'descripcion', width: 70 },
  { header: 'Archivo del texto', key: 'archivo', width: 50 },
];
hojaInc.getRow(1).font = { bold: true };
const filasInc = filas.flatMap((f) => (vacio(f.cIncoherencia) ? [] : String(f.cIncoherencia).split(' | ')
  .map((descripcion) => ({ f, descripcion, ...(incPrevias.get(`${f.id}\n${descripcion}`) || {}) }))));
for (const { f, descripcion, tipo, archivo } of filasInc) {
  const r = hojaInc.addRow({ nombre: f.nombre, id: f.id, momento: f.momento, tipo: tipo ?? null, descripcion, archivo: archivo ?? null });
  for (const k of ['nombre', 'descripcion', 'archivo']) r.getCell(k).alignment = { wrapText: true, vertical: 'top' };
  r.getCell('tipo').dataValidation = {
    type: 'list', allowBlank: true, formulae: [`"${TIPOS_INCOHERENCIA.join(',')}"`],
    showErrorMessage: true, errorTitle: 'Valor no válido', error: `Elige: ${TIPOS_INCOHERENCIA.join(', ')}`,
  };
}
const sinTipo = filasInc.filter((x) => vacio(x.tipo) || vacio(x.archivo)).length;

await wb.xlsx.writeFile(SALIDA);

// ─── Consola ─────────────────────────────────────────────────────────────────

console.log(`${SALIDA}\n${filas.length} platos; con columnas de Javi: ${conJavi}; incoherencias: ${filasInc.length} (sin tipo o archivo: ${sinTipo})`);
resumen.eachRow((r) => {
  const v = r.values.slice(1).map((x) => (x && typeof x === 'object' ? x.result : x ?? ''));
  console.log(v.slice(0, 7).join(' | '));
});
