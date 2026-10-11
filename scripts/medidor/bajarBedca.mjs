// bajarBedca — descarga la Base de Datos Española de Composición de Alimentos
// (BEDCA, AESAN) a un único JSON, para que el medidor de raciones use datos
// oficiales y no valores copiados a mano.
//
// Se ejecuta en el ordenador de Javi (desde el entorno de Claude bedca.net no
// es accesible). Usa el servicio público de consultas de BEDCA
// (https://www.bedca.net/bdpub/procquery.php), con las mismas consultas XML
// que el cliente de referencia statickidz/bedca-api (MIT):
//   nivel 3 = grupos de alimentos, nivel 1 = alimentos de un grupo,
//   nivel 2 = composición completa de un alimento.
//
// Uso (Windows CMD, desde la carpeta del repo):
//   node scripts\medidor\bajarBedca.mjs
//   node scripts\medidor\bajarBedca.mjs --salida C:\ruta\bedca.json
//   node scripts\medidor\bajarBedca.mjs --inseguro   (solo si falla el certificado de bedca.net)
//
// Guarda cada alimento en una caché (carpeta bedca-cache junto a la salida),
// así que si se corta, al volver a ejecutarlo continúa donde se quedó.
// Al terminar escribe el JSON y su sha256. No escribe nada en el repo.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const URL_BEDCA = 'https://www.bedca.net/bdpub/procquery.php';
const args = process.argv.slice(2);
const arg = (nombre, defecto) => {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : defecto;
};
const SALIDA = path.resolve(arg('--salida', path.join(os.homedir(), 'Downloads', 'bedca.json')));
const CACHE = path.join(path.dirname(SALIDA), 'bedca-cache');
const PARALELO = 4;

if (args.includes('--inseguro')) {
  // El cliente de referencia desactiva la verificación TLS; aquí solo si se pide.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('Aviso: verificación del certificado desactivada (--inseguro).');
}

// ─── Consultas XML (mismas que statickidz/bedca-api) ─────────────────────────

const XML_GRUPOS = `<?xml version="1.0" encoding="utf-8"?><foodquery><type level="3"/><selection><atribute name="fg_id"/><atribute name="fg_ori_name"/><atribute name="fg_eng_name"/></selection><order ordtype="ASC"><atribute3 name="fg_id"/></order></foodquery>`;

const xmlGrupo = (id) => `<?xml version="1.0" encoding="utf-8"?><foodquery><type level="1"/><selection><atribute name="f_id"/><atribute name="f_ori_name"/><atribute name="langual"/><atribute name="f_eng_name"/><atribute name="f_origen"/></selection><condition><cond1><atribute1 name="foodgroup_id"/></cond1><relation type="EQUAL"/><cond3>${id}</cond3></condition><condition><cond1><atribute1 name="f_origen"/></cond1><relation type="EQUAL"/><cond3>BEDCA</cond3></condition><order ordtype="ASC"><atribute3 name="f_eng_name"/></order></foodquery>`;

const CAMPOS_ALIMENTO = ['f_id', 'f_ori_name', 'f_eng_name', 'sci_name', 'edible_portion', 'f_origen',
  'c_id', 'c_ori_name', 'c_eng_name', 'eur_name', 'componentgroup_id', 'best_location', 'v_unit',
  'value_type', 'vt_descripcion', 'mu_descripcion', 'ref_id'];
const xmlAlimento = (id) => `<?xml version="1.0" encoding="utf-8"?><foodquery><type level="2"/><selection>${CAMPOS_ALIMENTO.map((c) => `<atribute name="${c}"/>`).join('')}</selection><condition><cond1><atribute1 name="f_id"/></cond1><relation type="EQUAL"/><cond3>${id}</cond3></condition><condition><cond1><atribute1 name="publico"/></cond1><relation type="EQUAL"/><cond3>1</cond3></condition><order ordtype="ASC"><atribute3 name="componentgroup_id"/></order></foodquery>`;

// ─── Red ─────────────────────────────────────────────────────────────────────

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function consulta(xml, etiqueta) {
  let ultimo;
  for (let intento = 1; intento <= 4; intento++) {
    try {
      const res = await fetch(URL_BEDCA, { method: 'POST', headers: { 'Content-Type': 'text/xml' }, body: xml });
      const texto = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${texto.slice(0, 200)}`);
      return texto;
    } catch (err) {
      ultimo = err;
      await espera(1000 * intento);
    }
  }
  const causa = ultimo && ultimo.cause ? ` (${ultimo.cause.code || ultimo.cause.message})` : '';
  throw new Error(`No se pudo consultar ${etiqueta}: ${ultimo && ultimo.message}${causa}`);
}

// ─── XML → objetos (lectura genérica de etiquetas hoja) ──────────────────────

const decodificar = (s) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&')
  .trim();

function hojas(bloque) {
  const out = {};
  for (const m of bloque.matchAll(/<([a-zA-Z_][\w]*)(?:\s[^>]*)?>([^<]*(?:<!\[CDATA\[[\s\S]*?\]\]>[^<]*)*)<\/\1>/g)) {
    if (!(m[1] in out)) out[m[1]] = decodificar(m[2]);
  }
  return out;
}

// Trozos del XML que empiezan en cada aparición de <campo>: no depende del
// nombre de la etiqueta que envuelve cada registro.
function trozos(xml, campo) {
  const marca = `<${campo}>`;
  const partes = xml.split(marca).slice(1);
  return partes.map((p) => marca + p);
}

function leerAlimento(xml) {
  const cabecera = hojas(xml);
  if (!cabecera.f_id) return null;
  return {
    id: cabecera.f_id,
    nombre: cabecera.f_ori_name,
    nombreEn: cabecera.f_eng_name || null,
    cientifico: cabecera.sci_name || null,
    porcionComestible: cabecera.edible_portion || null,
    origen: cabecera.f_origen || null,
    componentes: trozos(xml, 'c_id').map((v) => {
      const h = hojas(v);
      return {
        id: h.c_id, nombre: h.c_ori_name, nombreEn: h.c_eng_name || null, eur: h.eur_name || null,
        valor: h.best_location === '' || h.best_location == null ? null : Number(String(h.best_location).replace(',', '.')),
        unidad: h.v_unit || null, por: h.mu_descripcion || null, tipo: h.vt_descripcion || h.value_type || null,
      };
    }),
  };
}

// ─── Descarga ────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  console.log(`Descargando BEDCA → ${SALIDA}`);

  const xmlGrupos = await consulta(XML_GRUPOS, 'los grupos');
  fs.writeFileSync(path.join(CACHE, '_grupos.xml'), xmlGrupos);
  const grupos = trozos(xmlGrupos, 'fg_id').map(hojas).filter((g) => g.fg_id);
  if (!grupos.length) {
    console.error('La respuesta de grupos no tiene el formato esperado. Primeros 600 caracteres:');
    console.error(xmlGrupos.slice(0, 600));
    console.error(`Respuesta completa guardada en ${path.join(CACHE, '_grupos.xml')}. Envíasela a Claude.`);
    process.exit(1);
  }
  console.log(`${grupos.length} grupos de alimentos.`);

  const lista = [];
  for (const g of grupos) {
    const xml = await consulta(xmlGrupo(g.fg_id), `el grupo ${g.fg_id}`);
    for (const f of trozos(xml, 'f_id').map(hojas)) {
      if (f.f_id) lista.push({ id: f.f_id, nombre: f.f_ori_name, grupo: g.fg_ori_name, grupoId: g.fg_id });
    }
  }
  if (!lista.length) {
    console.error('No se encontró ningún alimento en los grupos. Revisa la caché y envíasela a Claude.');
    process.exit(1);
  }
  console.log(`${lista.length} alimentos. Bajando su composición (se puede cortar y reanudar)…`);

  let hechos = 0;
  let fallos = 0;
  const cola = [...lista];
  async function trabajador() {
    while (cola.length) {
      const f = cola.shift();
      const archivo = path.join(CACHE, `${f.id}.xml`);
      if (!fs.existsSync(archivo)) {
        try {
          fs.writeFileSync(archivo, await consulta(xmlAlimento(f.id), `el alimento ${f.id}`));
          await espera(150);
        } catch (err) {
          fallos++;
          console.error(`  ✗ ${f.id} ${f.nombre}: ${err.message}`);
          continue;
        }
      }
      hechos++;
      if (hechos % 50 === 0) console.log(`  ${hechos}/${lista.length}`);
    }
  }
  await Promise.all(Array.from({ length: PARALELO }, trabajador));

  const alimentos = [];
  const sinFormato = [];
  for (const f of lista) {
    const archivo = path.join(CACHE, `${f.id}.xml`);
    if (!fs.existsSync(archivo)) continue;
    const a = leerAlimento(fs.readFileSync(archivo, 'utf8'));
    if (!a || !a.componentes.length) { sinFormato.push(f.id); continue; }
    alimentos.push({ ...a, grupo: f.grupo, grupoId: f.grupoId });
  }

  const datos = {
    fuente: 'BEDCA — Base de Datos Española de Composición de Alimentos (AESAN), https://www.bedca.net',
    descargado: new Date().toISOString(),
    alimentos,
  };
  fs.writeFileSync(SALIDA, JSON.stringify(datos));
  const sha = crypto.createHash('sha256').update(fs.readFileSync(SALIDA)).digest('hex');
  console.log('');
  console.log(`Listo: ${alimentos.length} alimentos con composición; ${fallos} sin descargar; ${sinFormato.length} con formato inesperado.`);
  if (sinFormato.length) console.log(`  Formato inesperado (ver caché): ${sinFormato.slice(0, 10).join(', ')}${sinFormato.length > 10 ? '…' : ''}`);
  if (fallos) console.log('  Vuelve a ejecutar el mismo comando para reintentar los que fallaron.');
  console.log(`Archivo: ${SALIDA}`);
  console.log(`sha256:  ${sha}`);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  if (/certificate|CERT|SSL|TLS/i.test(String(err.message))) {
    console.error('Parece un problema con el certificado de bedca.net. Prueba a añadir --inseguro al comando.');
  }
  process.exit(1);
});
