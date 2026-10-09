// entrega-run — CLI de la función de entrega de la primera Fase 7 (D-095).
//
// Lee la vista del evaluador y el manifiesto; nunca la clave (no existe
// argumento para ella). La lógica vive en entrega.js; aquí solo hay lectura y
// escritura de ficheros y cálculo de sha256.
//
// Su existencia no autoriza la ejecución sobre el material de evaluación:
// requiere el asiento de designación (D-095, "Autorización y límites").
//
// Uso:
//   fase1 | reanudacion | reconocimiento
//     --vista <ruta> --vista-sha256 <64 hex> --manifiesto <ruta> --salida-dir <ruta>
//     --plazo <texto> --direccion <texto> --confirmo-ejecucion
//     (reanudacion: además --extraccion <ruta>)
//   comprobar
//     --vista <ruta> --vista-sha256 <64 hex> --manifiesto <ruta> --salida-dir <ruta>
//     --fase <valoraciones|reanudacion|reconocimiento> --hoja <ruta>
//     (fase reanudacion: además --extraccion <ruta>)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { MANIFIESTO_SHA256, validarManifiesto } from './pares.js';
import {
  FASES, validarVista, terminosDelManifiesto, producirEntrega, comprobarHoja,
  comprobacionTecnica, serializarJson,
} from './entrega.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

function fail(msg) {
  console.error(`entrega-run: ${msg}`);
  process.exit(1);
}

const COMUNES = ['--vista', '--vista-sha256', '--manifiesto', '--salida-dir'];
const SUBCOMANDOS = {
  fase1: { valores: [...COMUNES, '--plazo', '--direccion'], banderas: ['--confirmo-ejecucion'], fase: 'valoraciones' },
  reanudacion: { valores: [...COMUNES, '--plazo', '--direccion', '--extraccion'], banderas: ['--confirmo-ejecucion'], fase: 'reanudacion' },
  reconocimiento: { valores: [...COMUNES, '--plazo', '--direccion'], banderas: ['--confirmo-ejecucion'], fase: 'reconocimiento' },
  comprobar: { valores: [...COMUNES, '--fase', '--hoja', '--extraccion'], banderas: [], fase: null },
};

// Argumentos estrictos: cualquier argumento desconocido, repetido o sin valor aborta.
function parsearArgs(spec, argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (spec.banderas.includes(a)) {
      if (a in out) fail(`argumento repetido: ${a}`);
      out[a] = true;
    } else if (spec.valores.includes(a)) {
      if (a in out) fail(`argumento repetido: ${a}`);
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) fail(`falta el valor de ${a}`);
      out[a] = v;
      i += 1;
    } else {
      fail(`argumento no admitido: ${a}`);
    }
  }
  return out;
}

function requerir(args, nombres) {
  for (const n of nombres) if (!(n in args)) fail(`falta ${n}`);
}

function leer(ruta) {
  try {
    return fs.readFileSync(path.resolve(ruta));
  } catch (e) {
    return fail(e.message);
  }
}

function cargarEntradas(args) {
  if (!/^[0-9a-f]{64}$/.test(args['--vista-sha256'])) fail('--vista-sha256: deben ser 64 caracteres hexadecimales en minúscula');
  const bytesVista = leer(args['--vista']);
  if (sha256(bytesVista) !== args['--vista-sha256']) fail('el sha256 de la vista no coincide con --vista-sha256');
  const bytesManifiesto = leer(args['--manifiesto']);
  if (sha256(bytesManifiesto) !== MANIFIESTO_SHA256) fail('el sha256 del manifiesto no es el fijado por D-091');
  let vista;
  let manifiesto;
  try {
    vista = JSON.parse(bytesVista.toString('utf8'));
    manifiesto = JSON.parse(bytesManifiesto.toString('utf8'));
    validarVista(vista);
    validarManifiesto(manifiesto);
  } catch (e) {
    fail(e.message);
  }
  return { vista, terminosManifiesto: terminosDelManifiesto(manifiesto) };
}

function dirSalida(args) {
  const dir = path.resolve(args['--salida-dir']);
  const rel = path.relative(ROOT, dir);
  if (!rel.startsWith('..') && !path.isAbsolute(rel)) fail(`la salida debe estar fuera del repositorio: ${dir}`);
  let st;
  try {
    st = fs.statSync(dir);
  } catch (e) {
    return fail(e.message);
  }
  if (!st.isDirectory()) fail(`--salida-dir no es un directorio: ${dir}`);
  return dir;
}

function leerExtraccion(ruta) {
  try {
    return JSON.parse(leer(ruta).toString('utf8'));
  } catch (e) {
    return fail(`--extraccion: ${e.message}`);
  }
}

// Escribe sin sobrescribir, relee y comprueba el sha256 de cada fichero.
function escribirYVerificar(dir, ficheros) {
  const destinos = ficheros.map((f) => ({ ...f, ruta: path.join(dir, f.nombre), sha: sha256(f.bytes) }));
  for (const d of destinos) if (fs.existsSync(d.ruta)) fail(`no se sobrescribe un archivo existente: ${d.ruta}`);
  const escritos = [];
  const abortar = (msg) => {
    const lista = escritos.length > 0 ? ` Ya escritos: ${escritos.join(', ')}` : ' No se ha escrito nada.';
    fail(`${msg}.${lista}`);
  };
  for (const d of destinos) {
    try {
      fs.writeFileSync(d.ruta, d.bytes, { flag: 'wx' });
    } catch (e) {
      abortar(e.message);
    }
    escritos.push(d.ruta);
  }
  for (const d of destinos) {
    if (sha256(fs.readFileSync(d.ruta)) !== d.sha) abortar(`el sha256 releído no coincide con el examinado: ${d.ruta}`);
  }
  for (const d of destinos) console.log(`${d.sha}  ${d.ruta}`);
}

const utf8 = (s) => new TextEncoder().encode(s);

async function main() {
  const [sub, ...resto] = process.argv.slice(2);
  const spec = SUBCOMANDOS[sub];
  if (!spec) fail(`subcomando desconocido (${Object.keys(SUBCOMANDOS).join(' | ')})`);
  const args = parsearArgs(spec, resto);
  requerir(args, COMUNES);

  if (sub !== 'comprobar') {
    requerir(args, ['--plazo', '--direccion']);
    if (!args['--confirmo-ejecucion']) {
      fail('falta --confirmo-ejecucion. Este comando produce material de evaluación; no se ejecuta por defecto.');
    }
    if (sub === 'reanudacion') requerir(args, ['--extraccion']);
    else if ('--extraccion' in args) fail('--extraccion solo se admite en reanudacion');
  } else {
    requerir(args, ['--fase', '--hoja']);
    if (!FASES.includes(args['--fase'])) fail(`--fase: ${FASES.join(' | ')}`);
    if (args['--fase'] === 'reanudacion') requerir(args, ['--extraccion']);
    else if ('--extraccion' in args) fail('--extraccion solo se admite con --fase reanudacion');
  }

  const dir = dirSalida(args);
  const { vista, terminosManifiesto } = cargarEntradas(args);

  if (sub !== 'comprobar') {
    let ficheros;
    try {
      ficheros = await producirEntrega({
        fase: spec.fase,
        vista,
        terminosManifiesto,
        plazo: args['--plazo'],
        direccion: args['--direccion'],
        extraccionValoraciones: sub === 'reanudacion' ? leerExtraccion(args['--extraccion']) : null,
      });
    } catch (e) {
      fail(`${e.message}. No se ha escrito nada.`);
    }
    escribirYVerificar(dir, ficheros);
    return;
  }

  const fase = args['--fase'];
  const hojaAbs = path.resolve(args['--hoja']);
  const bytes = leer(hojaAbs);
  const carpetaValida = path.basename(path.dirname(hojaAbs)) === 'valida';

  const tecnico = await comprobacionTecnica(bytes);
  console.log(`Resultado técnico: se puede abrir: ${tecnico.abre ? 'sí' : 'no'}; contiene la hoja «Respuestas»: ${tecnico.contieneRespuestas ? 'sí' : 'no'}`);
  if (!tecnico.abre || !tecnico.contieneRespuestas) {
    console.log('No supera la comprobación técnica: no se extrae nada.');
    process.exitCode = 2;
    return;
  }
  if (!carpetaValida) {
    console.log('El fichero no está en una carpeta «valida»: se termina tras informar del resultado técnico.');
    return;
  }
  const otros = fs.readdirSync(path.dirname(hojaAbs)).filter((n) => n !== path.basename(hojaAbs));
  if (otros.length > 0) fail('la carpeta «valida» debe contener como máximo un fichero');

  let resultado;
  try {
    resultado = await comprobarHoja({
      bytes,
      fase,
      vista,
      extraccionValoraciones: fase === 'reanudacion' ? leerExtraccion(args['--extraccion']) : null,
      sha256: sha256(bytes),
    });
  } catch (e) {
    fail(`${e.message}. No se ha escrito nada.`);
  }
  escribirYVerificar(dir, [
    { nombre: `informe-${fase}.txt`, bytes: utf8(resultado.informe) },
    { nombre: `extraccion-${fase}.json`, bytes: utf8(serializarJson(resultado.extraccion)) },
  ]);
}

main().catch((e) => fail(e.message));
