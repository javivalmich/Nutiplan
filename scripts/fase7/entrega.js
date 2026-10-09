// entrega — lógica pura de la función de entrega de la primera Fase 7 (D-095).
//
// Sin acceso a ficheros, red, Date, Math.random ni entorno. Solo importa
// exceljs y jszip. Construye el HTML y las hojas .xlsx a partir de la vista del
// evaluador (nunca de la clave), comprueba y extrae las hojas recibidas y
// busca identificadores prohibidos. La lectura/escritura de ficheros y el
// sha256 viven en entrega-run.mjs.

import ExcelJS from 'exceljs';
import JSZip from 'jszip';

export class EntregaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EntregaError';
  }
}

// ---------------------------------------------------------------- Literales

export const FASES = Object.freeze(['valoraciones', 'reanudacion', 'reconocimiento']);

export const ESCALA = Object.freeze(['Claramente A', 'Algo A', 'Igual', 'Algo B', 'Claramente B']);
export const OPCIONES_RECONOCIMIENTO = Object.freeze(['Sí', 'No', 'No lo sé']);

const ACLARACION_EQUILIBRIO = 'Juzga solo por los platos que ves; no se muestran cantidades ni información nutricional.';

export const PREGUNTA_PRINCIPAL = Object.freeze({
  id: 'principal',
  cabecera: '¿Qué semana recomendarías a esta persona?',
  lista: ESCALA,
});
export const DIMENSIONES = Object.freeze([
  Object.freeze({ id: 'variedad', cabecera: '¿Qué semana tiene más variedad?', lista: ESCALA }),
  Object.freeze({ id: 'coherencia', cabecera: '¿Qué semana parece más una semana real?', lista: ESCALA }),
  Object.freeze({
    id: 'equilibrio',
    cabecera: `¿Qué semana parece más equilibrada?\n${ACLARACION_EQUILIBRIO}`,
    lista: ESCALA,
  }),
]);
export const PREGUNTA_RECONOCIMIENTO = Object.freeze({
  id: 'reconocimiento',
  cabecera: '¿Vienen A y B de sistemas distintos?',
  lista: OPCIONES_RECONOCIMIENTO,
});

export const CABECERA_COMENTARIO = 'Comentario (opcional)';
const CABECERAS_IDENT = Object.freeze(['Par', 'Etiqueta A', 'Etiqueta B']);
const RAYA = '—';

const PIE_COMUN = 'Una vez enviado, no se puede modificar.';
const CONSERVA = 'Conserva los archivos hasta que se te indique que la evaluación ha terminado.';

export const INSTRUCCIONES = Object.freeze({
  valoraciones: Object.freeze([
    'Vas a ver 20 pares de semanas de comidas y cenas. En cada par hay dos semanas, A y B, para la persona que se describe encima del par.',
    'Abre el archivo .html con cualquier navegador para ver los pares. Responde en la hoja “Respuestas” de este archivo.',
    'En cada fila, elige una opción de la lista para cada pregunta. El comentario es opcional.',
    `Cuando termines, envía este archivo a {DIRECCIÓN} antes del {PLAZO}. ${PIE_COMUN}`,
    CONSERVA,
  ]),
  reanudacion: Object.freeze([
    'En algunos pares faltan respuestas. La hoja “Respuestas” contiene solo esos pares. Las preguntas ya respondidas aparecen con “—”. No las modifiques.',
    'Puedes volver a consultar el archivo .html que recibiste. En cada pregunta abierta, elige una opción de la lista.',
    `Cuando termines, envía este archivo a {DIRECCIÓN} antes del {PLAZO}. ${PIE_COMUN}`,
    CONSERVA,
  ]),
  reconocimiento: Object.freeze([
    'Para cada uno de los 20 pares, responde a la pregunta de la hoja “Respuestas” eligiendo una opción de la lista.',
    'Puedes volver a consultar el archivo .html que recibiste.',
    `Cuando termines, envía este archivo a {DIRECCIÓN} antes del {PLAZO}. ${PIE_COMUN}`,
    CONSERVA,
  ]),
});

export const MENSAJE_ENVIO = 'Te adjunto el material. Las instrucciones están en la hoja “Instrucciones” del archivo .xlsx.';
export const AVISO_RECEPCION_NO_VALIDA = 'El archivo recibido no se puede abrir o no contiene la hoja “Respuestas”. Envíalo de nuevo antes del {PLAZO}.';

export function instruccionesDeFase(fase, { plazo, direccion }) {
  if (!FASES.includes(fase)) throw new EntregaError(`fase desconocida: ${JSON.stringify(fase)}`);
  if (typeof plazo !== 'string' || plazo.length === 0) throw new EntregaError('plazo: vacío');
  if (typeof direccion !== 'string' || direccion.length === 0) throw new EntregaError('dirección: vacía');
  return INSTRUCCIONES[fase].map((p) => p.split('{PLAZO}').join(plazo).split('{DIRECCIÓN}').join(direccion));
}

function especFase(fase) {
  if (fase === 'valoraciones' || fase === 'reanudacion') {
    return { preguntas: [PREGUNTA_PRINCIPAL, ...DIMENSIONES], comentario: true };
  }
  if (fase === 'reconocimiento') return { preguntas: [PREGUNTA_RECONOCIMIENTO], comentario: false };
  throw new EntregaError(`fase desconocida: ${JSON.stringify(fase)}`);
}

function cabecerasDeFase(fase) {
  const { preguntas, comentario } = especFase(fase);
  return [...CABECERAS_IDENT, ...preguntas.map((q) => q.cabecera), ...(comentario ? [CABECERA_COMENTARIO] : [])];
}

// ----------------------------------------------------------- Forma de la vista

function esObjetoPlano(v) {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function clavesExactas(v, claves, donde) {
  if (!esObjetoPlano(v)) throw new EntregaError(`${donde}: debe ser un objeto plano`);
  const real = Object.keys(v).sort();
  const esperado = [...claves].sort();
  if (real.length !== esperado.length || real.some((k, i) => k !== esperado[i])) {
    throw new EntregaError(`${donde}: claves ${JSON.stringify(real)}, se esperaban exactamente ${JSON.stringify(esperado)}`);
  }
}

function textoNoVacio(v, donde) {
  if (typeof v !== 'string' || v.trim().length === 0) throw new EntregaError(`${donde}: debe ser un texto no vacío`);
}

// F-095.2: forma exacta de pares.js:142–150 (y de blind.js:76–116 para dias).
export function validarVista(vista) {
  clavesExactas(vista, ['contexto', 'pares'], 'vista');
  textoNoVacio(vista.contexto, 'vista.contexto');
  if (!Array.isArray(vista.pares) || vista.pares.length !== 20) {
    throw new EntregaError('vista.pares: se esperaba un array de exactamente 20 pares');
  }
  vista.pares.forEach((p, k) => {
    const w = `vista.pares[${k}]`;
    clavesExactas(p, ['par', 'perfil', 'A', 'B'], w);
    if (p.par !== k + 1) throw new EntregaError(`${w}.par: se esperaba ${k + 1}`);
    textoNoVacio(p.perfil, `${w}.perfil`);
    for (const lado of ['A', 'B']) {
      const wl = `${w}.${lado}`;
      clavesExactas(p[lado], ['etiqueta', 'dias'], wl);
      textoNoVacio(p[lado].etiqueta, `${wl}.etiqueta`);
      const dias = p[lado].dias;
      if (!Array.isArray(dias) || dias.length !== 7) throw new EntregaError(`${wl}.dias: se esperaban 7 días`);
      dias.forEach((d, i) => {
        const wd = `${wl}.dias[${i}]`;
        clavesExactas(d, i === 5 ? ['dia', 'cena'] : ['dia', 'comida', 'cena'], wd);
        if (d.dia !== i + 1) throw new EntregaError(`${wd}.dia: se esperaba ${i + 1}`);
        if (i !== 5) textoNoVacio(d.comida, `${wd}.comida`);
        textoNoVacio(d.cena, `${wd}.cena`);
      });
    }
  });
}

// Los nombres de cada par en el orden en que aparecen en la tabla:
// por día, A comida, A cena, B comida, B cena (sin la comida del día 6).
function nombresDePar(par) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const a = par.A.dias[i];
    const b = par.B.dias[i];
    if (i !== 5) out.push(a.comida);
    out.push(a.cena);
    if (i !== 5) out.push(b.comida);
    out.push(b.cena);
  }
  return out;
}

export function nombresDeVista(vista) {
  return vista.pares.map(nombresDePar);
}

// -------------------------------------------------------------------- HTML

export function escaparHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function deshacerEscapeHtml(s) {
  return s.replace(/&(amp|lt|gt|quot);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"' }[e]));
}

const ESTILO_HTML = [
  'table{border-collapse:collapse}',
  'th,td{border:1px solid #000;padding:4px;vertical-align:top}',
  'td.n{white-space:pre-wrap}',
].join('\n');

function tablaDePar(par) {
  const filas = [];
  for (let i = 0; i < 7; i++) {
    const a = par.A.dias[i];
    const b = par.B.dias[i];
    const celda = (nombre) => (nombre === undefined
      ? `<td class="v">${RAYA}</td>`
      : `<td class="n">${escaparHtml(nombre)}</td>`);
    filas.push(`<tr><th>${i + 1}</th>${celda(a.comida)}${celda(a.cena)}${celda(b.comida)}${celda(b.cena)}</tr>`);
  }
  return [
    '<table>',
    '<thead>',
    `<tr><th rowspan="2">Día</th><th colspan="2">A (${escaparHtml(par.A.etiqueta)})</th><th colspan="2">B (${escaparHtml(par.B.etiqueta)})</th></tr>`,
    '<tr><th>Comida</th><th>Cena</th><th>Comida</th><th>Cena</th></tr>',
    '</thead>',
    '<tbody>',
    ...filas,
    '</tbody>',
    '</table>',
  ].join('\n');
}

export function construirHtml(vista) {
  validarVista(vista);
  const partes = [
    '<!DOCTYPE html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Pares</title>',
    '<style>',
    ESTILO_HTML,
    '</style>',
    '</head>',
    '<body>',
    '<h1>Pares</h1>',
    `<p>${escaparHtml(vista.contexto)}</p>`,
  ];
  for (const p of vista.pares) {
    partes.push(`<h2>Par ${p.par}</h2>`, `<p>${escaparHtml(p.perfil)}</p>`, tablaDePar(p));
  }
  partes.push('</body>', '</html>');
  return `${partes.join('\n')}\n`;
}

// Extrae del HTML (ya como texto) los nombres, con el escape deshecho, y el
// número de celdas «—». Devuelve un array de 20 arrays de 26 nombres.
export function extraerNombresHtml(html) {
  const cuerpos = html.split('<h2>').slice(1);
  return cuerpos.map((c) => {
    const nombres = [...c.matchAll(/<td class="n">([^<]*)<\/td>/g)].map((m) => deshacerEscapeHtml(m[1]));
    const rayas = [...c.matchAll(/<td class="v">([^<]*)<\/td>/g)].map((m) => m[1]);
    return { nombres, rayas };
  });
}

// 5.d: compara byte a byte (sobre el texto UTF-8 ya decodificado) los nombres
// del HTML con los de la vista: 13 por plan, 26 por par; y 2 celdas «—» por par.
export function comprobarNombresHtml(htmlBytes, vista) {
  let html;
  try {
    html = new TextDecoder('utf-8', { fatal: true }).decode(htmlBytes);
  } catch (e) {
    throw new EntregaError(`html: no es UTF-8 válido (${e.message})`);
  }
  const extraidos = extraerNombresHtml(html);
  const esperados = nombresDeVista(vista);
  if (extraidos.length !== esperados.length) {
    throw new EntregaError(`html: se esperaban ${esperados.length} pares y hay ${extraidos.length}`);
  }
  const enc = new TextEncoder();
  const iguales = (x, y) => {
    const bx = enc.encode(x);
    const by = enc.encode(y);
    return bx.length === by.length && bx.every((v, i) => v === by[i]);
  };
  esperados.forEach((nombres, k) => {
    const got = extraidos[k];
    if (nombres.length !== 26) throw new EntregaError(`par ${k + 1}: la vista no tiene 26 nombres`);
    if (got.nombres.length !== 26) {
      throw new EntregaError(`html: par ${k + 1}: se esperaban 26 nombres y hay ${got.nombres.length}`);
    }
    if (got.rayas.length !== 2 || got.rayas.some((r) => r !== RAYA)) {
      throw new EntregaError(`html: par ${k + 1}: se esperaban 2 celdas «${RAYA}» (comida del día 6)`);
    }
    nombres.forEach((n, j) => {
      if (!iguales(n, got.nombres[j])) {
        throw new EntregaError(`html: par ${k + 1}, nombre ${j + 1}: no coincide byte a byte con la vista`);
      }
    });
  });
}

// ------------------------------------------------------------ Normalización

// 6.d: se eliminan los espacios exteriores y se ignoran las mayúsculas; nada más.
export function normalizarValor(literal, lista) {
  if (typeof literal !== 'string') return null;
  const x = literal.trim().toLowerCase();
  for (const op of lista) {
    if (op.toLowerCase() === x) return op;
  }
  return null;
}

// ------------------------------------------------------------------ Hojas

const METADATOS_CORE = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
  '<dc:creator></dc:creator>',
  '<dc:title></dc:title>',
  '<dc:subject></dc:subject>',
  '<dc:description></dc:description>',
  '<cp:keywords></cp:keywords>',
  '<cp:lastModifiedBy></cp:lastModifiedBy>',
  '<dcterms:created xsi:type="dcterms:W3CDTF">2000-01-01T00:00:00Z</dcterms:created>',
  '<dcterms:modified xsi:type="dcterms:W3CDTF">2000-01-01T00:00:00Z</dcterms:modified>',
  '</cp:coreProperties>',
].join('');

// exceljs escribe «Unknown» si autor/último autor están vacíos y usa la hora
// actual en las fechas: se reescribe docProps/core.xml con valores fijos.
async function fijarMetadatos(bytes) {
  const zip = await JSZip.loadAsync(bytes);
  if (!zip.file('docProps/core.xml')) throw new EntregaError('xlsx: falta docProps/core.xml');
  zip.file('docProps/core.xml', METADATOS_CORE);
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

function aplicarValidacion(cell, lista) {
  cell.dataValidation = {
    type: 'list',
    allowBlank: true,
    showErrorMessage: true,
    errorStyle: 'stop',
    formulae: [`"${lista.join(',')}"`],
  };
}

// abiertas: solo para la reanudación. Array de { par, preguntas: { id: bool } }
// con los pares que se piden de nuevo y qué preguntas están abiertas.
export async function construirLibro(fase, vista, { plazo, direccion, abiertas } = {}) {
  validarVista(vista);
  const instrucciones = instruccionesDeFase(fase, { plazo, direccion });
  const { preguntas, comentario } = especFase(fase);

  let filasPares;
  if (fase === 'reanudacion') {
    if (!Array.isArray(abiertas) || abiertas.length === 0) {
      throw new EntregaError('reanudación: no hay pares abiertos');
    }
    filasPares = abiertas.map((a) => {
      const par = vista.pares.find((p) => p.par === a.par);
      if (!par) throw new EntregaError(`reanudación: par inexistente ${a.par}`);
      return { par, abiertas: a.preguntas };
    });
  } else {
    filasPares = vista.pares.map((par) => ({ par, abiertas: null }));
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = '';
  wb.lastModifiedBy = '';
  wb.company = '';
  wb.title = '';
  wb.subject = '';
  wb.keywords = '';
  wb.description = '';

  const wsI = wb.addWorksheet('Instrucciones');
  wsI.getColumn(1).width = 110;
  instrucciones.forEach((p, i) => {
    const c = wsI.getCell(i + 1, 1);
    c.value = p;
    c.alignment = { wrapText: true, vertical: 'top' };
  });
  await wsI.protect('', {});

  const ws = wb.addWorksheet('Respuestas');
  const cabeceras = cabecerasDeFase(fase);
  cabeceras.forEach((h, i) => {
    const c = ws.getCell(1, i + 1);
    c.value = h;
    c.font = { bold: true };
    c.alignment = { wrapText: true, vertical: 'top' };
    ws.getColumn(i + 1).width = i < 3 ? 14 : 30;
  });
  filasPares.forEach(({ par, abiertas: ab }, k) => {
    const r = k + 2;
    ws.getCell(r, 1).value = par.par;
    ws.getCell(r, 2).value = par.A.etiqueta;
    ws.getCell(r, 3).value = par.B.etiqueta;
    preguntas.forEach((q, j) => {
      const c = ws.getCell(r, 4 + j);
      const abierta = ab === null ? true : ab[q.id] === true;
      if (abierta) {
        c.protection = { locked: false };
        aplicarValidacion(c, q.lista);
      } else {
        c.value = RAYA;
      }
    });
    if (comentario) {
      const c = ws.getCell(r, 4 + preguntas.length);
      c.protection = { locked: false };
      c.alignment = { wrapText: true, vertical: 'top' };
    }
  });
  await ws.protect('', {});

  const crudo = await wb.xlsx.writeBuffer();
  return fijarMetadatos(crudo);
}

// ------------------------------------------------- Lectura de hojas (resumen)

function textoDeCelda(cell) {
  if (cell.value === null || cell.value === undefined) return null;
  const t = cell.text;
  return typeof t === 'string' ? t : String(t);
}

async function abrirLibro(bytes) {
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(bytes);
    return { abre: true, wb };
  } catch (e) {
    return { abre: false, error: String((e && e.message) || e) };
  }
}

// Resumen estructural de un .xlsx releído: valores, validaciones, protección
// (de hoja y de cada celda) y metadatos (entradas docProps/* leídas con jszip).
export async function resumenLibro(bytes) {
  const abierto = await abrirLibro(bytes);
  if (!abierto.abre) throw new EntregaError(`xlsx: no se puede releer (${abierto.error})`);
  const hojas = abierto.wb.worksheets.map((ws) => {
    const celdas = [];
    ws.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        celdas.push({
          celda: cell.address,
          valor: textoDeCelda(cell),
          bloqueada: !(cell.protection && cell.protection.locked === false),
          validacion: cell.dataValidation ? JSON.parse(JSON.stringify(cell.dataValidation)) : null,
        });
      });
    });
    return {
      nombre: ws.name,
      proteccion: ws.sheetProtection ? JSON.parse(JSON.stringify(ws.sheetProtection)) : null,
      celdas,
    };
  });
  const zip = await JSZip.loadAsync(bytes);
  const docProps = {};
  for (const nombre of Object.keys(zip.files).filter((n) => n.startsWith('docProps/') && !zip.files[n].dir).sort()) {
    docProps[nombre] = await zip.file(nombre).async('string');
  }
  return { hojas, docProps };
}

// ------------------------------------------------------ Comprobación técnica

export async function comprobacionTecnica(bytes) {
  const abierto = await abrirLibro(bytes);
  if (!abierto.abre) return { abre: false, contieneRespuestas: false, error: abierto.error };
  const ws = abierto.wb.getWorksheet('Respuestas');
  return { abre: true, contieneRespuestas: Boolean(ws), error: null };
}

// ------------------------------------------------- Comprobación y extracción

const INCIDENCIAS_DE_VALOR = new Set(['valor-no-valido', 'valor-en-celda-bloqueada']);

const sinCR = (s) => s.replace(/\r\n/g, '\n');

function respuestaVacia(abierta) {
  return { literal: null, valido: null, ausente: abierta, abierta };
}

// Pares esperados en la hoja de una fase.
//  - valoraciones/reconocimiento: los 20.
//  - reanudación: los pares sin respuesta principal válida en la extracción de
//    las valoraciones, con las preguntas abiertas = las ausentes.
export function validarExtraccionValoraciones(ext, vista) {
  if (!esObjetoPlano(ext) || ext.fase !== 'valoraciones' || !Array.isArray(ext.pares) || ext.pares.length !== 20) {
    throw new EntregaError('extracción de valoraciones: forma no válida');
  }
  ext.pares.forEach((p, k) => {
    const v = vista.pares[k];
    if (!esObjetoPlano(p) || p.par !== v.par || p.etiquetaA !== v.A.etiqueta || p.etiquetaB !== v.B.etiqueta) {
      throw new EntregaError(`extracción de valoraciones: el par ${k + 1} no corresponde a la vista`);
    }
    if (!esObjetoPlano(p.respuestas)) throw new EntregaError(`extracción de valoraciones: par ${k + 1} sin respuestas`);
    for (const q of [PREGUNTA_PRINCIPAL, ...DIMENSIONES]) {
      const r = p.respuestas[q.id];
      if (!esObjetoPlano(r) || typeof r.ausente !== 'boolean') {
        throw new EntregaError(`extracción de valoraciones: par ${k + 1}, pregunta ${q.id} no válida`);
      }
    }
  });
}

export function abiertasDeExtraccion(ext, vista) {
  validarExtraccionValoraciones(ext, vista);
  return ext.pares
    .filter((p) => p.respuestas.principal.ausente)
    .map((p) => ({
      par: p.par,
      preguntas: Object.fromEntries([PREGUNTA_PRINCIPAL, ...DIMENSIONES].map((q) => [q.id, p.respuestas[q.id].ausente])),
    }));
}

function paresEsperados(fase, vista, extraccionValoraciones) {
  const todos = vista.pares.map((p) => ({
    par: p.par, etiquetaA: p.A.etiqueta, etiquetaB: p.B.etiqueta, abiertas: null,
  }));
  if (fase !== 'reanudacion') return todos;
  if (!extraccionValoraciones) throw new EntregaError('reanudación: falta la extracción de las valoraciones');
  const ab = abiertasDeExtraccion(extraccionValoraciones, vista);
  return ab.map((a) => ({ ...todos[a.par - 1], abiertas: a.preguntas }));
}

// Devuelve la comprobación técnica y, si la supera, la extracción y el informe.
export async function comprobarHoja({ bytes, fase, vista, extraccionValoraciones = null, sha256 = null }) {
  validarVista(vista);
  const { preguntas, comentario } = especFase(fase);
  const esperados = paresEsperados(fase, vista, extraccionValoraciones);

  const abierto = await abrirLibro(bytes);
  const tecnico = abierto.abre
    ? { abre: true, contieneRespuestas: Boolean(abierto.wb.getWorksheet('Respuestas')), error: null }
    : { abre: false, contieneRespuestas: false, error: abierto.error };
  if (!tecnico.abre || !tecnico.contieneRespuestas) {
    const informe = [
      `Comprobación de la hoja de ${fase}`,
      ...(sha256 ? [`sha256 de la hoja: ${sha256}`] : []),
      'Resultado técnico: NO SUPERADO',
      `Se puede abrir: ${tecnico.abre ? 'sí' : 'no'}`,
      `Contiene la hoja «Respuestas»: ${tecnico.contieneRespuestas ? 'sí' : 'no'}`,
      'No se extrae nada.',
    ].join('\n') + '\n';
    return { tecnico, extraccion: null, informe };
  }

  const ws = abierto.wb.getWorksheet('Respuestas');
  const incidencias = [];
  const cabecerasEsperadas = cabecerasDeFase(fase);

  // Cabeceras: se asignan por literal, solo si es único en la fila 1.
  const porCabecera = new Map();
  const colsEnHoja = Math.max(ws.columnCount, cabecerasEsperadas.length);
  for (let c = 1; c <= colsEnHoja; c++) {
    const t = textoDeCelda(ws.getCell(1, c));
    if (t === null) continue;
    const clave = sinCR(t);
    if (!porCabecera.has(clave)) porCabecera.set(clave, []);
    porCabecera.get(clave).push(c);
  }
  const columnaDe = new Map();
  cabecerasEsperadas.forEach((h, i) => {
    const cols = porCabecera.get(h) || [];
    if (cols.length === 0) {
      incidencias.push({ tipo: 'cabecera-ausente', cabecera: h });
    } else if (cols.length > 1) {
      incidencias.push({ tipo: 'cabecera-duplicada', cabecera: h, columnas: cols });
    } else {
      columnaDe.set(h, cols[0]);
      if (cols[0] !== i + 1) {
        incidencias.push({
          tipo: 'cabecera-fuera-de-posicion', cabecera: h, esperada: i + 1, encontrada: cols[0],
        });
      }
    }
  });
  for (const [h, cols] of porCabecera) {
    if (!cabecerasEsperadas.includes(h)) incidencias.push({ tipo: 'cabecera-no-reconocida', cabecera: h, columnas: cols });
  }

  // Filas con contenido.
  const cPar = columnaDe.get('Par');
  const cA = columnaDe.get('Etiqueta A');
  const cB = columnaDe.get('Etiqueta B');
  const filas = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    if (!row.hasValues) continue;
    const txt = (c) => (c ? textoDeCelda(row.getCell(c)) : null);
    filas.push({ r, par: txt(cPar), a: txt(cA), b: txt(cB) });
  }

  const usadas = new Set();
  const pares = esperados.map((e) => {
    const coincide = filas.filter((f) => f.par === String(e.par) && f.a === e.etiquetaA && f.b === e.etiquetaB);
    let fila = null;
    if (coincide.length === 1) {
      fila = coincide[0];
      usadas.add(fila.r);
    } else if (coincide.length > 1) {
      coincide.forEach((f) => usadas.add(f.r));
      incidencias.push({ tipo: 'fila-duplicada', par: e.par, filas: coincide.map((f) => f.r) });
    } else {
      const mismoNumero = filas.filter((f) => f.par === String(e.par));
      if (mismoNumero.length > 0) {
        mismoNumero.forEach((f) => usadas.add(f.r));
        incidencias.push({ tipo: 'etiquetas-no-coinciden', par: e.par, filas: mismoNumero.map((f) => f.r) });
      } else {
        incidencias.push({ tipo: 'fila-ausente', par: e.par });
      }
    }

    const respuestas = {};
    for (const q of preguntas) {
      const abierta = e.abiertas === null ? true : e.abiertas[q.id] === true;
      const c = columnaDe.get(q.cabecera);
      if (!fila || !c) {
        respuestas[q.id] = respuestaVacia(abierta);
        continue;
      }
      const literal = textoDeCelda(ws.getCell(fila.r, c));
      if (!abierta) {
        // 6.f: lo escrito en una celda «—» se ignora y se registra.
        if (literal !== null && literal !== RAYA) {
          incidencias.push({
            tipo: 'valor-en-celda-bloqueada', par: e.par, pregunta: q.id, literal,
          });
        }
        respuestas[q.id] = { literal, valido: null, ausente: false, abierta: false };
        continue;
      }
      const valido = normalizarValor(literal, q.lista);
      if (literal !== null && valido === null) {
        incidencias.push({
          tipo: 'valor-no-valido', par: e.par, pregunta: q.id, literal,
        });
      }
      respuestas[q.id] = { literal, valido, ausente: valido === null, abierta: true };
    }
    const out = {
      par: e.par, etiquetaA: e.etiquetaA, etiquetaB: e.etiquetaB, asignada: fila !== null, respuestas,
    };
    if (comentario) {
      const c = columnaDe.get(CABECERA_COMENTARIO);
      out.comentario = fila && c ? textoDeCelda(ws.getCell(fila.r, c)) : null;
    }
    return out;
  });
  for (const f of filas) {
    if (!usadas.has(f.r)) incidencias.push({ tipo: 'fila-no-reconocida', fila: f.r });
  }

  const estructuraAlterada = incidencias.some((i) => !INCIDENCIAS_DE_VALOR.has(i.tipo));
  const extraccion = {
    fase,
    ...(sha256 ? { hojaSha256: sha256 } : {}),
    estructuraAlterada,
    pares,
    incidencias,
  };

  // Informe.
  let validas = 0;
  let ausentes = 0;
  let noValidas = 0;
  let completos = 0;
  for (const p of pares) {
    let completo = true;
    for (const q of preguntas) {
      const r = p.respuestas[q.id];
      if (!r.abierta) continue;
      if (r.ausente) {
        ausentes += 1;
        completo = false;
        if (r.literal !== null) noValidas += 1;
      } else {
        validas += 1;
      }
    }
    if (completo) completos += 1;
  }
  const informe = [
    `Comprobación de la hoja de ${fase}`,
    ...(sha256 ? [`sha256 de la hoja: ${sha256}`] : []),
    'Resultado técnico: superado (se abre y contiene la hoja «Respuestas»)',
    `Estructura: ${estructuraAlterada ? 'alterada' : 'íntegra'}`,
    `Pares esperados: ${pares.length}; asignados: ${pares.filter((p) => p.asignada).length}`,
    `Preguntas con valor válido: ${validas}`,
    `Preguntas ausentes: ${ausentes} (de ellas, con un valor no válido: ${noValidas})`,
    `Pares completos: ${completos} de ${pares.length}`,
    `Incidencias: ${incidencias.length}`,
    ...incidencias.map((i) => `- ${JSON.stringify(i)}`),
  ].join('\n') + '\n';
  return { tecnico, extraccion, informe };
}

export function serializarJson(valor) {
  return `${JSON.stringify(valor, null, 2)}\n`;
}

// ------------------------------------------------- Comprobación F-095.7

const TERMINOS_FIJOS = Object.freeze([
  'legacy', 'engine2', 'nutiplan', 'javivalmich', 'clave', 'semilla', 'seed',
  'C:\\', '/Users/', '/home/',
]);

// Términos derivados del manifiesto: los id y los nombres de archivo de sus planes.
export function terminosDelManifiesto(manifiesto) {
  const out = new Set();
  const planes = [
    ...((manifiesto && manifiesto.planes) || []),
    ...(((manifiesto && manifiesto.casos) || []).flatMap((c) => (c && c.planes) || [])),
  ];
  for (const p of planes) {
    if (!p) continue;
    if (typeof p.id === 'string' && p.id.length > 0) out.add(p.id);
    if (typeof p.archivo === 'string' && p.archivo.length > 0) {
      out.add(p.archivo);
      const base = p.archivo.split(/[\\/]/).pop();
      if (base) out.add(base);
    }
  }
  return [...out].sort();
}

function buscar(texto, terminos, donde, hallazgos) {
  const t = texto.toLowerCase();
  for (const termino of terminos) {
    if (termino.length > 0 && t.includes(termino.toLowerCase())) hallazgos.push({ donde, termino });
  }
}

// html: texto o bytes UTF-8. xlsx: { nombre: bytes }. terminosManifiesto: dato.
export async function comprobarIdentificadores({ html = null, xlsx = {}, terminosManifiesto = [] }) {
  const terminos = [...TERMINOS_FIJOS, ...terminosManifiesto];
  const hallazgos = [];
  if (html !== null) {
    const texto = typeof html === 'string' ? html : new TextDecoder('utf-8').decode(html);
    buscar(texto, terminos, 'html', hallazgos);
  }
  for (const nombre of Object.keys(xlsx).sort()) {
    const zip = await JSZip.loadAsync(xlsx[nombre]);
    for (const entrada of Object.keys(zip.files).sort()) {
      buscar(entrada, terminos, `${nombre}:${entrada} (nombre)`, hallazgos);
      if (zip.files[entrada].dir) continue;
      const contenido = await zip.file(entrada).async('string');
      buscar(contenido, terminos, `${nombre}:${entrada}`, hallazgos);
    }
  }
  return hallazgos;
}

// ------------------------------------------------------ Producción completa

function igualesBytes(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// Dos ejecuciones completas en memoria (F-095.8), comprobación 5.d y F-095.7.
// Devuelve [{ nombre, bytes }] listos para escribir; lanza EntregaError si algo falla.
export async function producirEntrega({
  fase, vista, terminosManifiesto, plazo, direccion, extraccionValoraciones = null,
}) {
  validarVista(vista);
  if (!FASES.includes(fase)) throw new EntregaError(`fase desconocida: ${JSON.stringify(fase)}`);
  if (!Array.isArray(terminosManifiesto)) throw new EntregaError('terminosManifiesto: debe ser un array');
  const abiertas = fase === 'reanudacion' ? abiertasDeExtraccion(extraccionValoraciones, vista) : undefined;
  const nombreXlsx = `respuestas-${fase}.xlsx`;
  const enc = new TextEncoder();

  const ejecutar = async () => {
    const xlsx = await construirLibro(fase, vista, { plazo, direccion, abiertas });
    const salida = { xlsx, resumen: JSON.stringify(await resumenLibro(xlsx)) };
    if (fase === 'valoraciones') salida.html = enc.encode(construirHtml(vista));
    return salida;
  };
  const r1 = await ejecutar();
  const r2 = await ejecutar();
  if (r1.resumen !== r2.resumen) throw new EntregaError('el .xlsx no es determinista (valores, validaciones, protección o metadatos)');
  if (fase === 'valoraciones' && !igualesBytes(r1.html, r2.html)) throw new EntregaError('el HTML no es determinista');

  if (r1.html) comprobarNombresHtml(r1.html, vista);

  const hallazgos = await comprobarIdentificadores({
    html: r1.html || null,
    xlsx: { [nombreXlsx]: r1.xlsx },
    terminosManifiesto,
  });
  if (hallazgos.length > 0) {
    throw new EntregaError(`identificadores prohibidos: ${hallazgos.map((h) => `${JSON.stringify(h.termino)} en ${h.donde}`).join('; ')}`);
  }

  const ficheros = [];
  if (r1.html) ficheros.push({ nombre: 'pares.html', bytes: r1.html });
  ficheros.push({ nombre: nombreXlsx, bytes: r1.xlsx });
  return ficheros;
}
