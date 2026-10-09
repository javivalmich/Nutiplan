import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { execPath } from 'node:process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {
  validarVista, construirHtml, escaparHtml, deshacerEscapeHtml, extraerNombresHtml,
  comprobarNombresHtml, nombresDeVista, construirLibro, resumenLibro, normalizarValor,
  comprobacionTecnica, comprobarHoja, comprobarIdentificadores, terminosDelManifiesto,
  producirEntrega, abiertasDeExtraccion, instruccionesDeFase, ESCALA, OPCIONES_RECONOCIMIENTO,
  PREGUNTA_PRINCIPAL, DIMENSIONES, PREGUNTA_RECONOCIMIENTO, INSTRUCCIONES,
} from './entrega.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUN = path.join(__dirname, 'entrega-run.mjs');
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const enc = new TextEncoder();

// Vista sintética con la estructura de blind.js:76–116: dias = [{dia, comida?, cena}],
// sin la clave comida en el día 6.
const NOMBRES_RAROS = ['Ensalada 🥗 <fresca> & "sana"', '  Arroz  con   pollo  ', 'Tarta de limón & nata', 'Sopa\nde pescado'];
function planSintetico(k, lado) {
  const dias = [];
  for (let i = 1; i <= 7; i++) {
    const d = { dia: i };
    if (i !== 6) d.comida = `Comida ${k}${lado}${i}`;
    d.cena = `Cena ${k}${lado}${i}`;
    dias.push(d);
  }
  return dias;
}
function vistaSintetica() {
  const pares = [];
  for (let k = 1; k <= 20; k++) {
    pares.push({
      par: k,
      perfil: `Perfil sintético ${k % 2}`,
      A: { etiqueta: `P-A${String(k).padStart(3, '0')}`, dias: planSintetico(k, 'a') },
      B: { etiqueta: `P-B${String(k).padStart(3, '0')}`, dias: planSintetico(k, 'b') },
    });
  }
  pares[0].A.dias[0].comida = NOMBRES_RAROS[0];
  pares[0].A.dias[0].cena = NOMBRES_RAROS[1];
  pares[0].B.dias[2].cena = NOMBRES_RAROS[2];
  pares[0].B.dias[3].comida = NOMBRES_RAROS[3];
  return { contexto: 'Contexto sintético de prueba.', pares };
}
const clon = (x) => JSON.parse(JSON.stringify(x));

const MANIFIESTO_SINTETICO = {
  casos: [],
  planes: [
    { id: 'plan-zz-001', motor: 'x', archivo: 'carpeta/fichero-zz-001.json' },
    { id: 'plan-zz-002', motor: 'y', archivo: 'fichero-zz-002.json' },
  ],
};
const TERMINOS = terminosDelManifiesto(MANIFIESTO_SINTETICO);
const PARAMS = { plazo: 'el 1 de enero', direccion: 'buzon@ejemplo.test' };

async function modificar(bytes, fn) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes);
  fn(wb.getWorksheet('Respuestas'), wb);
  return new Uint8Array(await wb.xlsx.writeBuffer());
}
async function libroDe(fase, vista, extra = {}) {
  return construirLibro(fase, vista, { ...PARAMS, ...extra });
}
// Rellena la fila de un par (r = par + 1 en valoraciones/reconocimiento).
const COL = { principal: 4, variedad: 5, coherencia: 6, equilibrio: 7, comentario: 8 };

describe('F-095.2 forma de la vista', () => {
  it('acepta la vista sintética', () => {
    expect(() => validarVista(vistaSintetica())).not.toThrow();
  });
  it('rechaza una entrada con forma de clave', () => {
    const v = vistaSintetica();
    const clave = {
      sha: 'a'.repeat(40),
      seed: 1,
      manifiestoSha256: 'b'.repeat(64),
      pares: v.pares.map((p) => ({
        par: p.par,
        caso: 'c',
        A: { etiqueta: p.A.etiqueta, id: 'x', motor: 'legacy' },
        B: { etiqueta: p.B.etiqueta, id: 'y', motor: 'engine2' },
      })),
    };
    expect(() => validarVista(clave)).toThrow();
    const conExtra = clon(v);
    conExtra.sha = 'a'.repeat(40);
    expect(() => validarVista(conExtra)).toThrow();
    const lado = clon(v);
    lado.pares[3].A.id = 'x';
    expect(() => validarVista(lado)).toThrow();
    const par = clon(v);
    par.pares[3].caso = 'c';
    expect(() => validarVista(par)).toThrow();
    const lado2 = clon(v);
    lado2.pares[3].B.motor = 'legacy';
    expect(() => validarVista(lado2)).toThrow();
  });
  it('rechaza números de par, nº de pares y dias mal formados', () => {
    const a = clon(vistaSintetica());
    a.pares.pop();
    expect(() => validarVista(a)).toThrow();
    const b = clon(vistaSintetica());
    b.pares[4].par = 9;
    expect(() => validarVista(b)).toThrow();
    const c = clon(vistaSintetica());
    c.pares[0].A.dias[5].comida = 'algo';
    expect(() => validarVista(c)).toThrow();
    const d = clon(vistaSintetica());
    delete d.pares[0].A.dias[0].comida;
    expect(() => validarVista(d)).toThrow();
    const e = clon(vistaSintetica());
    e.pares[0].A.dias.pop();
    expect(() => validarVista(e)).toThrow();
  });
});

describe('HTML', () => {
  const vista = vistaSintetica();
  const html = construirHtml(vista);

  it('ida y vuelta del escape: emoji, <, &, comillas, espacios repetidos y exteriores', () => {
    for (const n of NOMBRES_RAROS) expect(deshacerEscapeHtml(escaparHtml(n))).toBe(n);
    expect(escaparHtml('a&b<c>"d"')).toBe('a&amp;b&lt;c&gt;&quot;d&quot;');
    const extraidos = extraerNombresHtml(html);
    expect(extraidos).toHaveLength(20);
    extraidos.forEach((e, k) => expect(e.nombres).toEqual(nombresDeVista(vista)[k]));
    expect(extraidos[0].nombres).toContain(NOMBRES_RAROS[1]);
    expect(extraidos[0].nombres).toContain(NOMBRES_RAROS[3]);
    expect(() => comprobarNombresHtml(enc.encode(html), vista)).not.toThrow();
  });
  it('13 nombres por plan, 26 por par', () => {
    nombresDeVista(vista).forEach((n) => expect(n).toHaveLength(26));
  });
  it('la comida del día 6 es «—» en A y en B', () => {
    for (const e of extraerNombresHtml(html)) expect(e.rayas).toEqual(['—', '—']);
    const fila6 = html.split('\n').filter((l) => l.startsWith('<tr><th>6</th>'));
    expect(fila6).toHaveLength(20);
    for (const l of fila6) {
      expect(l).toMatch(/^<tr><th>6<\/th><td class="v">—<\/td><td class="n">[^<]*<\/td><td class="v">—<\/td><td class="n">[^<]*<\/td><\/tr>$/);
    }
  });
  it('estructura: sin scripts, recursos externos, comentarios ni generador; contexto una vez', () => {
    expect(html.startsWith('<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<title>Pares</title>')).toBe(true);
    expect(html).not.toMatch(/<script|<link|<img|<iframe|src=|href=|<!--|generator|http/i);
    expect(html.match(/<style>/g)).toHaveLength(1);
    expect(html.match(/white-space:pre-wrap/g)).toHaveLength(1);
    expect(html.split(vista.contexto)).toHaveLength(2);
    expect(html).toContain('<h2>Par 1</h2>\n<p>Perfil sintético 1</p>');
    expect(html).toContain('<h2>Par 20</h2>');
    expect(html).toContain('<th colspan="2">A (P-A001)</th><th colspan="2">B (P-B001)</th>');
    expect(html).toContain('<tr><th>Comida</th><th>Cena</th><th>Comida</th><th>Cena</th></tr>');
    expect(html.includes('\r')).toBe(false);
    expect(html.endsWith('</html>\n')).toBe(true);
  });
  it('determinismo: dos construcciones coinciden byte a byte', () => {
    expect(construirHtml(clon(vista))).toBe(html);
  });
  it('la comprobación 5.d detecta una alteración de un nombre', () => {
    const roto = html.replace('Comida 3a1', 'Comida 3a1 ');
    expect(roto).not.toBe(html);
    expect(() => comprobarNombresHtml(enc.encode(roto), vista)).toThrow(/par 3/);
  });
});

describe('hojas .xlsx', () => {
  const vista = vistaSintetica();

  it('valoraciones: cabeceras, validaciones, protección, bloqueo y metadatos tras releer', async () => {
    const bytes = await libroDe('valoraciones', vista);
    const r = await resumenLibro(bytes);
    expect(r.hojas.map((h) => h.nombre)).toEqual(['Instrucciones', 'Respuestas']);
    const resp = r.hojas[1];
    const celda = (a) => resp.celdas.find((c) => c.celda === a);
    expect(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'].map((a) => celda(a).valor)).toEqual([
      'Par', 'Etiqueta A', 'Etiqueta B',
      '¿Qué semana recomendarías a esta persona?',
      '¿Qué semana tiene más variedad?',
      '¿Qué semana parece más una semana real?',
      '¿Qué semana parece más equilibrada?\nJuzga solo por los platos que ves; no se muestran cantidades ni información nutricional.',
      'Comentario (opcional)',
    ]);
    // Protección de hoja sin contraseña.
    for (const h of r.hojas) {
      expect(h.proteccion.sheet).toBe(true);
      expect(h.proteccion.password).toBeUndefined();
      expect(h.proteccion.hashValue).toBeUndefined();
    }
    const lista = `"${ESCALA.join(',')}"`;
    for (let k = 0; k < 20; k++) {
      const row = k + 2;
      // identificación: bloqueada, sin validación
      for (const [col, esperado] of [['A', k + 1], ['B', vista.pares[k].A.etiqueta], ['C', vista.pares[k].B.etiqueta]]) {
        const c = celda(`${col}${row}`);
        expect(c.valor).toBe(String(esperado));
        expect(c.bloqueada).toBe(true);
        expect(c.validacion).toBeNull();
      }
      // respuestas: desbloqueadas, con lista
      for (const col of ['D', 'E', 'F', 'G']) {
        const c = celda(`${col}${row}`);
        expect(c.bloqueada).toBe(false);
        expect(c.validacion.type).toBe('list');
        expect(c.validacion.formulae).toEqual([lista]);
        expect(c.valor).toBeNull();
      }
      // comentario: desbloqueado, sin validación
      const com = celda(`H${row}`);
      expect(com.bloqueada).toBe(false);
      expect(com.validacion).toBeNull();
    }
    expect(celda('A1').bloqueada).toBe(true);
    // Instrucciones: un párrafo por fila, columna A, literales sustituidos.
    const ins = r.hojas[0].celdas.map((c) => c.valor);
    expect(ins).toEqual(instruccionesDeFase('valoraciones', PARAMS));
    expect(ins[3]).toBe('Cuando termines, envía este archivo a buzon@ejemplo.test antes del el 1 de enero. Una vez enviado, no se puede modificar.');
    expect(ins.join('\n')).not.toMatch(/\{PLAZO\}|\{DIRECCIÓN\}/);
    // Metadatos: leídos directamente de docProps/*.
    const core = r.docProps['docProps/core.xml'];
    for (const tag of ['dc:creator', 'cp:lastModifiedBy', 'dc:title', 'dc:subject', 'cp:keywords', 'dc:description']) {
      expect(core).toContain(`<${tag}></${tag}>`);
    }
    expect(core).not.toMatch(/Unknown/);
    expect(core).toContain('<dcterms:created xsi:type="dcterms:W3CDTF">2000-01-01T00:00:00Z</dcterms:created>');
    expect(core).toContain('<dcterms:modified xsi:type="dcterms:W3CDTF">2000-01-01T00:00:00Z</dcterms:modified>');
    expect(r.docProps['docProps/app.xml']).toContain('<Company></Company>');
    expect(Object.keys(r.docProps).sort()).toEqual(['docProps/app.xml', 'docProps/core.xml']);
    // Y también leyendo el ZIP en crudo.
    const zip = await JSZip.loadAsync(bytes);
    expect(await zip.file('docProps/core.xml').async('string')).toBe(core);
  });

  it('reconocimiento: 4 columnas, lista Sí/No/No lo sé, mismo bloqueo', async () => {
    const bytes = await libroDe('reconocimiento', vista);
    const resp = (await resumenLibro(bytes)).hojas[1];
    const celda = (a) => resp.celdas.find((c) => c.celda === a);
    expect(['A1', 'B1', 'C1', 'D1'].map((a) => celda(a).valor)).toEqual(['Par', 'Etiqueta A', 'Etiqueta B', '¿Vienen A y B de sistemas distintos?']);
    expect(celda('E1')).toBeUndefined();
    for (let r = 2; r <= 21; r++) {
      expect(celda(`D${r}`).bloqueada).toBe(false);
      expect(celda(`D${r}`).validacion.formulae).toEqual([`"${OPCIONES_RECONOCIMIENTO.join(',')}"`]);
      expect(celda(`A${r}`).bloqueada).toBe(true);
      expect(celda(`E${r}`)).toBeUndefined();
    }
    expect(OPCIONES_RECONOCIMIENTO).toEqual(['Sí', 'No', 'No lo sé']);
  });

  it('determinismo: dos construcciones coinciden en valores, validaciones, protección y metadatos', async () => {
    const a = JSON.stringify(await resumenLibro(await libroDe('valoraciones', vista)));
    const b = JSON.stringify(await resumenLibro(await libroDe('valoraciones', vista)));
    expect(a).toBe(b);
  });

  it('reanudación: solo pares sin principal válida; «—» bloqueadas, abiertas desbloqueadas; sin respuestas previas', async () => {
    const ab = [
      { par: 2, preguntas: { principal: true, variedad: true, coherencia: false, equilibrio: false } },
      { par: 7, preguntas: { principal: true, variedad: false, coherencia: true, equilibrio: true } },
    ];
    const bytes = await libroDe('reanudacion', vista, { abiertas: ab });
    const resp = (await resumenLibro(bytes)).hojas[1];
    const celda = (a) => resp.celdas.find((c) => c.celda === a);
    expect(celda('A2').valor).toBe('2');
    expect(celda('B2').valor).toBe(vista.pares[1].A.etiqueta);
    expect(celda('A3').valor).toBe('7');
    expect(celda('A4')).toBeUndefined();
    // fila 2: principal y variedad abiertas; coherencia y equilibrio «—» bloqueadas
    for (const [col, abierta] of [['D', true], ['E', true], ['F', false], ['G', false]]) {
      const c = celda(`${col}2`);
      expect(c.bloqueada).toBe(!abierta);
      if (abierta) {
        expect(c.valor).toBeNull();
        expect(c.validacion.type).toBe('list');
      } else {
        expect(c.valor).toBe('—');
        expect(c.validacion).toBeNull();
      }
    }
    // fila 3: variedad «—»
    expect(celda('E3').valor).toBe('—');
    expect(celda('E3').bloqueada).toBe(true);
    expect(celda('F3').bloqueada).toBe(false);
    // comentario siempre desbloqueado; identificación bloqueada
    expect(celda('H2').bloqueada).toBe(false);
    expect(celda('A2').bloqueada).toBe(true);
    // ninguna celda contiene un valor de la escala
    expect(resp.celdas.some((c) => ESCALA.includes(c.valor))).toBe(false);
    // instrucciones de la reanudación
    expect((await resumenLibro(bytes)).hojas[0].celdas.map((c) => c.valor)).toEqual(instruccionesDeFase('reanudacion', PARAMS));
  });

  it('los literales de instrucciones corresponden a los del Anexo (A.6–A.8)', () => {
    expect(INSTRUCCIONES.valoraciones).toHaveLength(5);
    expect(INSTRUCCIONES.reanudacion).toHaveLength(4);
    expect(INSTRUCCIONES.reconocimiento).toHaveLength(4);
    expect(() => instruccionesDeFase('valoraciones', { plazo: '', direccion: 'x' })).toThrow();
  });
});

describe('normalización (6.d)', () => {
  it('trim y mayúsculas, nada más', () => {
    expect(normalizarValor('  claramente a ', ESCALA)).toBe('Claramente A');
    expect(normalizarValor('IGUAL', ESCALA)).toBe('Igual');
    expect(normalizarValor('Claramente  A', ESCALA)).toBeNull();
    expect(normalizarValor('Sí', OPCIONES_RECONOCIMIENTO)).toBe('Sí');
    expect(normalizarValor('sí', OPCIONES_RECONOCIMIENTO)).toBe('Sí');
    expect(normalizarValor('si', OPCIONES_RECONOCIMIENTO)).toBeNull();
    expect(normalizarValor('', ESCALA)).toBeNull();
    expect(normalizarValor(null, ESCALA)).toBeNull();
  });
});

describe('comprobación y extracción de hojas recibidas', () => {
  const vista = vistaSintetica();

  async function valoracionesRellenas(rellenar) {
    const base = await libroDe('valoraciones', vista);
    return modificar(base, (ws) => rellenar(ws));
  }
  const completa = (ws) => {
    for (let r = 2; r <= 21; r++) {
      ws.getCell(r, COL.principal).value = 'Claramente A';
      ws.getCell(r, COL.variedad).value = 'algo b';
      ws.getCell(r, COL.coherencia).value = '  Igual ';
      ws.getCell(r, COL.equilibrio).value = 'CLARAMENTE B';
    }
  };

  it('recepción no válida: fichero que no se abre', async () => {
    expect(await comprobacionTecnica(enc.encode('esto no es un xlsx'))).toMatchObject({ abre: false, contieneRespuestas: false });
    expect(await comprobacionTecnica(new Uint8Array(0))).toMatchObject({ abre: false });
    const r = await comprobarHoja({ bytes: enc.encode('basura'), fase: 'valoraciones', vista });
    expect(r.tecnico.abre).toBe(false);
    expect(r.extraccion).toBeNull();
    expect(r.informe).toContain('NO SUPERADO');
  });

  it('recepción no válida: fichero sin hoja «Respuestas»', async () => {
    const base = await libroDe('valoraciones', vista);
    const sin = await modificar(base, (ws, wb) => { wb.getWorksheet('Respuestas').name = 'Otra'; });
    expect(await comprobacionTecnica(sin)).toEqual({ abre: true, contieneRespuestas: false, error: null });
    const r = await comprobarHoja({ bytes: sin, fase: 'valoraciones', vista });
    expect(r.extraccion).toBeNull();
    expect(r.informe).toContain('Contiene la hoja «Respuestas»: no');
  });

  it('hoja íntegra y completa: extrae valores válidos canónicos y literales', async () => {
    const bytes = await valoracionesRellenas((ws) => { completa(ws); ws.getCell(3, COL.comentario).value = 'ok'; });
    const r = await comprobarHoja({ bytes, fase: 'valoraciones', vista, sha256: sha256(bytes) });
    expect(r.tecnico).toEqual({ abre: true, contieneRespuestas: true, error: null });
    const e = r.extraccion;
    expect(e.estructuraAlterada).toBe(false);
    expect(e.incidencias).toEqual([]);
    expect(e.pares).toHaveLength(20);
    expect(e.pares[0].respuestas.coherencia).toEqual({ literal: '  Igual ', valido: 'Igual', ausente: false, abierta: true });
    expect(e.pares[0].respuestas.variedad.valido).toBe('Algo B');
    expect(e.pares[1].comentario).toBe('ok');
    expect(JSON.stringify(e)).not.toMatch(/"(sha|seed|manifiestoSha256|caso|motor)"/);
    expect(r.informe).toContain('Pares completos: 20 de 20');
  });

  it('valores no válidos: se registran literalmente y cuentan como ausentes', async () => {
    const bytes = await valoracionesRellenas((ws) => {
      completa(ws);
      ws.getCell(2, COL.principal).value = 'si';
      ws.getCell(3, COL.variedad).value = null;
    });
    const { extraccion: e, informe } = await comprobarHoja({ bytes, fase: 'valoraciones', vista });
    expect(e.pares[0].respuestas.principal).toEqual({ literal: 'si', valido: null, ausente: true, abierta: true });
    expect(e.pares[1].respuestas.variedad).toEqual({ literal: null, valido: null, ausente: true, abierta: true });
    expect(e.incidencias).toEqual([{ tipo: 'valor-no-valido', par: 1, pregunta: 'principal', literal: 'si' }]);
    expect(e.estructuraAlterada).toBe(false);
    expect(informe).toContain('Pares completos: 18 de 20');
  });

  it('hoja alterada: cabecera cambiada, fila con etiquetas distintas, fila extra y fila duplicada', async () => {
    const bytes = await valoracionesRellenas((ws) => {
      completa(ws);
      ws.getCell(1, COL.variedad).value = '¿Cuál tiene variedad?'; // cabecera alterada
      ws.getCell(4, 2).value = 'P-XXXX'; // par 3: etiqueta A cambiada
      ws.getCell(6, 1).value = 6; // par 5 -> duplicado del 6 (misma etiqueta que la de la fila 7? no: etiquetas distintas)
      ws.getCell(22, 1).value = 99; // fila extra
      ws.getCell(22, 4).value = 'Igual';
    });
    const { extraccion: e } = await comprobarHoja({ bytes, fase: 'valoraciones', vista });
    expect(e.estructuraAlterada).toBe(true);
    const tipos = e.incidencias.map((i) => i.tipo);
    expect(tipos).toContain('cabecera-ausente');
    expect(tipos).toContain('cabecera-no-reconocida');
    expect(tipos).toContain('etiquetas-no-coinciden');
    expect(tipos).toContain('fila-no-reconocida');
    // variedad: ninguna columna asignable -> todas ausentes, sin reconstruir
    for (const p of e.pares) expect(p.respuestas.variedad).toMatchObject({ valido: null, ausente: true });
    // par 3: no asignable -> todo ausente
    expect(e.pares[2].asignada).toBe(false);
    expect(e.pares[2].respuestas.principal).toMatchObject({ valido: null, ausente: true });
    // par 5: su fila se identifica ahora como 6 con etiquetas del 5 -> no coincide
    expect(e.pares[4].asignada).toBe(false);
    // el resto sigue asignado
    expect(e.pares[0].asignada).toBe(true);
    expect(e.pares[0].respuestas.principal.valido).toBe('Claramente A');
    expect(e.pares[0].respuestas.coherencia.valido).toBe('Igual');
  });

  it('hoja alterada: columnas reordenadas se asignan por cabecera literal y se registran', async () => {
    const bytes = await valoracionesRellenas((ws) => {
      completa(ws);
      const h = ws.getCell(1, COL.principal).value;
      ws.getCell(1, COL.principal).value = ws.getCell(1, COL.variedad).value;
      ws.getCell(1, COL.variedad).value = h;
    });
    const { extraccion: e } = await comprobarHoja({ bytes, fase: 'valoraciones', vista });
    expect(e.estructuraAlterada).toBe(true);
    expect(e.incidencias.filter((i) => i.tipo === 'cabecera-fuera-de-posicion')).toHaveLength(2);
    // los valores siguen a la cabecera literal: principal quedó en la columna 5 (valor «algo b»)
    expect(e.pares[0].respuestas.principal.valido).toBe('Algo B');
    expect(e.pares[0].respuestas.variedad.valido).toBe('Claramente A');
  });

  it('fila duplicada: no se asigna', async () => {
    const bytes = await valoracionesRellenas((ws) => {
      completa(ws);
      ws.getCell(22, 1).value = 2;
      ws.getCell(22, 2).value = vista.pares[1].A.etiqueta;
      ws.getCell(22, 3).value = vista.pares[1].B.etiqueta;
      ws.getCell(22, COL.principal).value = 'Igual';
    });
    const { extraccion: e } = await comprobarHoja({ bytes, fase: 'valoraciones', vista });
    expect(e.incidencias).toContainEqual({ tipo: 'fila-duplicada', par: 2, filas: [3, 22] });
    expect(e.pares[1].asignada).toBe(false);
    expect(e.pares[1].respuestas.principal.ausente).toBe(true);
  });

  it('reconocimiento: Sí vale, si no vale', async () => {
    const base = await libroDe('reconocimiento', vista);
    const bytes = await modificar(base, (ws) => {
      ws.getCell(2, 4).value = 'Sí';
      ws.getCell(3, 4).value = 'si';
      ws.getCell(4, 4).value = ' no LO sé ';
    });
    const { extraccion: e } = await comprobarHoja({ bytes, fase: 'reconocimiento', vista });
    expect(e.pares[0].respuestas.reconocimiento.valido).toBe('Sí');
    expect(e.pares[1].respuestas.reconocimiento).toMatchObject({ literal: 'si', valido: null, ausente: true });
    expect(e.pares[2].respuestas.reconocimiento.valido).toBe('No lo sé');
    expect(e.pares[3].respuestas.reconocimiento.ausente).toBe(true);
    expect(e.pares[0].comentario).toBeUndefined();
  });

  it('reanudación (6.f): solo celdas abiertas; un valor en una celda «—» se ignora y se registra', async () => {
    // Valoraciones: par 2 sin principal ni variedad; par 7 sin principal ni coherencia/equilibrio.
    const baseVal = await valoracionesRellenas((ws) => {
      completa(ws);
      ws.getCell(3, COL.principal).value = null;
      ws.getCell(3, COL.variedad).value = null;
      ws.getCell(8, COL.principal).value = 'nada';
      ws.getCell(8, COL.coherencia).value = null;
      ws.getCell(8, COL.equilibrio).value = null;
    });
    const val = (await comprobarHoja({ bytes: baseVal, fase: 'valoraciones', vista })).extraccion;
    const abiertas = abiertasDeExtraccion(val, vista);
    expect(abiertas).toEqual([
      { par: 2, preguntas: { principal: true, variedad: true, coherencia: false, equilibrio: false } },
      { par: 7, preguntas: { principal: true, variedad: false, coherencia: true, equilibrio: true } },
    ]);
    const hoja = await libroDe('reanudacion', vista, { abiertas });
    const rellena = await modificar(hoja, (ws) => {
      ws.getCell(2, COL.principal).value = ' algo a';
      ws.getCell(2, COL.variedad).value = 'Igual';
      ws.getCell(2, COL.coherencia).value = 'Claramente B'; // celda «—»: se ignora
      ws.getCell(3, COL.principal).value = 'Claramente B';
      ws.getCell(3, COL.coherencia).value = 'quizá';
    });
    const r = await comprobarHoja({
      bytes: rellena, fase: 'reanudacion', vista, extraccionValoraciones: val,
    });
    const e = r.extraccion;
    expect(e.pares.map((p) => p.par)).toEqual([2, 7]);
    expect(e.pares[0].respuestas.principal).toMatchObject({ valido: 'Algo A', ausente: false, abierta: true });
    expect(e.pares[0].respuestas.variedad.valido).toBe('Igual');
    expect(e.pares[0].respuestas.coherencia).toEqual({
      literal: 'Claramente B', valido: null, ausente: false, abierta: false,
    });
    expect(e.incidencias).toContainEqual({
      tipo: 'valor-en-celda-bloqueada', par: 2, pregunta: 'coherencia', literal: 'Claramente B',
    });
    expect(e.incidencias).toContainEqual({
      tipo: 'valor-no-valido', par: 7, pregunta: 'coherencia', literal: 'quizá',
    });
    expect(e.pares[1].respuestas.principal.valido).toBe('Claramente B');
    expect(e.pares[1].respuestas.equilibrio).toMatchObject({ valido: null, ausente: true, abierta: true });
    // Las celdas «—» intactas no generan incidencia.
    expect(e.incidencias.filter((i) => i.pregunta === 'variedad')).toEqual([]);
    expect(e.estructuraAlterada).toBe(false);
    // Una fila de un par que no estaba abierto se trata como no reconocida.
    const conExtra = await modificar(hoja, (ws) => {
      ws.getCell(4, 1).value = 3;
      ws.getCell(4, 2).value = vista.pares[2].A.etiqueta;
      ws.getCell(4, 3).value = vista.pares[2].B.etiqueta;
      ws.getCell(4, 4).value = 'Igual';
    });
    const r2 = await comprobarHoja({
      bytes: conExtra, fase: 'reanudacion', vista, extraccionValoraciones: val,
    });
    expect(r2.extraccion.incidencias).toContainEqual({ tipo: 'fila-no-reconocida', fila: 4 });
    expect(r2.extraccion.estructuraAlterada).toBe(true);
  });

  it('la extracción y el informe son deterministas', async () => {
    const bytes = await valoracionesRellenas(completa);
    const a = await comprobarHoja({ bytes, fase: 'valoraciones', vista });
    const b = await comprobarHoja({ bytes, fase: 'valoraciones', vista });
    expect(JSON.stringify(a.extraccion)).toBe(JSON.stringify(b.extraccion));
    expect(a.informe).toBe(b.informe);
  });
});

describe('F-095.7 comprobación de identificadores', () => {
  it('caso negativo: el material limpio no tiene coincidencias (HTML y todas las entradas ZIP)', async () => {
    const vista = vistaSintetica();
    const html = enc.encode(construirHtml(vista));
    const xlsx = { 'a.xlsx': await libroDe('valoraciones', vista), 'b.xlsx': await libroDe('reconocimiento', vista) };
    expect(await comprobarIdentificadores({ html, xlsx, terminosManifiesto: TERMINOS })).toEqual([]);
  });
  it('caso positivo: detecta cada término, sin distinguir mayúsculas, en el HTML y en las entradas ZIP', async () => {
    const vista = vistaSintetica();
    for (const t of ['Legacy', 'ENGINE2', 'Nutiplan', 'javivalmich', 'Clave', 'semilla', 'SEED', 'C:\\Users\\x', '/Users/x', '/home/x', 'PLAN-ZZ-001', 'Fichero-ZZ-002.json', 'carpeta/fichero-zz-001.json']) {
      const v = clon(vista);
      v.pares[4].A.dias[1].cena = `Plato ${t} raro`;
      const h = await comprobarIdentificadores({ html: enc.encode(construirHtml(v)), terminosManifiesto: TERMINOS });
      expect(h.length, t).toBeGreaterThan(0);
      expect(h[0].donde).toBe('html');
    }
    // En un xlsx: el término está en una entrada interna (hoja compartida) y en un nombre de entrada.
    const base = await libroDe('reconocimiento', vista);
    const zip = await JSZip.loadAsync(base);
    zip.file('docProps/extra-engine2.txt', 'nada');
    zip.file('xl/comentario.txt', 'contiene la palabra Semilla aquí');
    const sucio = await zip.generateAsync({ type: 'uint8array' });
    const h = await comprobarIdentificadores({ xlsx: { 's.xlsx': sucio }, terminosManifiesto: TERMINOS });
    expect(h.map((x) => x.termino).sort()).toEqual(['engine2', 'semilla']);
    expect(h.some((x) => x.donde === 's.xlsx:docProps/extra-engine2.txt (nombre)')).toBe(true);
  });
  it('terminosDelManifiesto: id, archivo y nombre de archivo, sin duplicados', () => {
    expect(TERMINOS).toEqual(['carpeta/fichero-zz-001.json', 'fichero-zz-001.json', 'fichero-zz-002.json', 'plan-zz-001', 'plan-zz-002']);
  });
});

describe('producirEntrega (flujo completo en memoria)', () => {
  const vista = vistaSintetica();
  it('fase1 produce HTML y hoja de valoraciones sin términos prohibidos', async () => {
    const f = await producirEntrega({
      fase: 'valoraciones', vista, terminosManifiesto: TERMINOS, ...PARAMS,
    });
    expect(f.map((x) => x.nombre)).toEqual(['pares.html', 'respuestas-valoraciones.xlsx']);
    expect(new TextDecoder().decode(f[0].bytes).startsWith('\uFEFF')).toBe(false);
  });
  it('reconocimiento y reanudación producen su hoja', async () => {
    const r = await producirEntrega({
      fase: 'reconocimiento', vista, terminosManifiesto: TERMINOS, ...PARAMS,
    });
    expect(r.map((x) => x.nombre)).toEqual(['respuestas-reconocimiento.xlsx']);
    const base = await libroDe('valoraciones', vista);
    const rellena = await modificar(base, (ws) => {
      for (let k = 2; k <= 21; k++) {
        ws.getCell(k, COL.principal).value = k === 5 ? null : 'Igual';
        ws.getCell(k, COL.variedad).value = 'Igual';
        ws.getCell(k, COL.coherencia).value = 'Igual';
        ws.getCell(k, COL.equilibrio).value = 'Igual';
      }
    });
    const ext = (await comprobarHoja({ bytes: rellena, fase: 'valoraciones', vista })).extraccion;
    const rean = await producirEntrega({
      fase: 'reanudacion', vista, terminosManifiesto: TERMINOS, extraccionValoraciones: ext, ...PARAMS,
    });
    expect(rean.map((x) => x.nombre)).toEqual(['respuestas-reanudacion.xlsx']);
    const resp = (await resumenLibro(rean[0].bytes)).hojas[1];
    expect(resp.celdas.filter((c) => /^A\d+$/.test(c.celda)).map((c) => c.valor)).toEqual(['Par', '4']);
  });
  it('un término prohibido en un plazo o en un nombre detiene la entrega', async () => {
    await expect(producirEntrega({
      fase: 'reconocimiento', vista, terminosManifiesto: TERMINOS, plazo: 'el 1', direccion: 'x@javivalmich.test',
    })).rejects.toThrow(/identificadores prohibidos/);
    const v = clon(vista);
    v.pares[0].A.dias[0].cena = 'Plato plan-zz-001';
    await expect(producirEntrega({
      fase: 'valoraciones', vista: v, terminosManifiesto: TERMINOS, ...PARAMS,
    })).rejects.toThrow(/identificadores prohibidos/);
  });
  it('rechaza una entrada con forma de clave antes de producir nada', async () => {
    await expect(producirEntrega({
      fase: 'valoraciones', vista: { sha: 'a', seed: 1, manifiestoSha256: 'b', pares: [] }, terminosManifiesto: TERMINOS, ...PARAMS,
    })).rejects.toThrow();
  });
});

describe('CLI: rechazos por sha256', () => {
  function entorno() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'entrega-test-'));
    const vistaPath = path.join(dir, 'vista.json');
    const manPath = path.join(dir, 'manifiesto.json');
    const vistaBytes = `${JSON.stringify(vistaSintetica(), null, 2)}\n`;
    fs.writeFileSync(vistaPath, vistaBytes);
    fs.writeFileSync(manPath, JSON.stringify(MANIFIESTO_SINTETICO));
    const salida = path.join(dir, 'salida');
    fs.mkdirSync(salida);
    return { dir, vistaPath, manPath, salida, vistaSha: sha256(enc.encode(vistaBytes)) };
  }
  const correr = (args) => spawnSync(execPath, [RUN, ...args], { encoding: 'utf8' });
  const argsFase1 = (e, over = {}) => {
    const a = {
      '--vista': e.vistaPath, '--vista-sha256': e.vistaSha, '--manifiesto': e.manPath, '--salida-dir': e.salida,
      '--plazo': 'el 1', '--direccion': 'x@ejemplo.test', ...over,
    };
    return ['fase1', ...Object.entries(a).flat(), '--confirmo-ejecucion'];
  };

  it('aborta sin escribir si el sha256 de la vista no coincide', () => {
    const e = entorno();
    const r = correr(argsFase1(e, { '--vista-sha256': '0'.repeat(64) }));
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/sha256 de la vista/);
    expect(fs.readdirSync(e.salida)).toEqual([]);
  });
  it('aborta sin escribir si el sha256 del manifiesto no es MANIFIESTO_SHA256', () => {
    const e = entorno();
    const r = correr(argsFase1(e));
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/sha256 del manifiesto/);
    expect(fs.readdirSync(e.salida)).toEqual([]);
  });
  it('no admite la clave como argumento ni la ejecución sin confirmación', () => {
    const e = entorno();
    const r1 = correr([...argsFase1(e), '--clave', 'x']);
    expect(r1.status).toBe(1);
    expect(r1.stderr).toMatch(/argumento no admitido: --clave/);
    const r2 = correr(argsFase1(e).filter((a) => a !== '--confirmo-ejecucion'));
    expect(r2.status).toBe(1);
    expect(r2.stderr).toMatch(/--confirmo-ejecucion/);
  });
  it('exige una salida fuera del repositorio', () => {
    const e = entorno();
    const r = correr(argsFase1(e, { '--salida-dir': __dirname }));
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/fuera del repositorio/);
  });
});
