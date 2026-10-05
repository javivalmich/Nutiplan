// Escáner de semillas (Fase 7): capa git, CLI y escritura del borrador.
// Produce el BORRADOR del que, tras revisión manual, saldrá el registro de semillas.
//   node scripts/fase7/escanearSemillas.mjs --salida <dir> [--consulta <desde>-<hasta>]
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  ESCANER_VERSION, CLASES_ADMITIDAS, TERMINOS, FUENTES, REGLAS,
  ocurrenciasDeTexto, agrupar, intersecta, esBinario,
} from './semillas.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOTE = 1000;
const MAX_MD = 300;

function git(repo, args, input) {
  return execFileSync('git', args, {
    cwd: repo, input, maxBuffer: 1 << 30, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
  });
}
const gitTexto = (repo, args) => git(repo, args).toString('utf8');

// Lee objetos con `git cat-file --batch` por lotes; llama cb(sha, tipo, buffer).
function leerObjetos(repo, shas, cb) {
  for (let i = 0; i < shas.length; i += LOTE) {
    const lote = shas.slice(i, i + LOTE);
    const out = git(repo, ['cat-file', '--batch'], `${lote.join('\n')}\n`);
    let pos = 0;
    for (let k = 0; k < lote.length; k++) {
      const nl = out.indexOf(0x0a, pos);
      const cab = out.subarray(pos, nl).toString('utf8').split(' ');
      if (cab[1] === 'missing') throw new Error(`objeto ausente: ${cab[0]}`);
      const tam = Number(cab[2]);
      cb(cab[0], cab[1], out.subarray(nl + 1, nl + 1 + tam));
      pos = nl + 1 + tam + 1;
    }
  }
}

const decodificador = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
const decodificar = (buf) => decodificador.decode(buf);

function parsearCommit(buf) {
  const corte = buf.indexOf('\n\n');
  const cabecera = decodificar(corte < 0 ? buf : buf.subarray(0, corte));
  const mensaje = corte < 0 ? '' : decodificar(buf.subarray(corte + 2));
  const tree = /^tree ([0-9a-f]+)/m.exec(cabecera)[1];
  return { tree, mensaje };
}

export function escanear({ repo, consulta = null, fecha = new Date().toISOString() }) {
  if (gitTexto(repo, ['status', '--porcelain']).trim() !== '') {
    throw new Error('el árbol de trabajo no está limpio (git status --porcelain no está vacío)');
  }
  const head = gitTexto(repo, ['rev-parse', 'HEAD']).trim();
  const refs = gitTexto(repo, ['for-each-ref', '--format=%(objectname) %(refname)'])
    .split('\n').filter(Boolean).map((l) => {
      const i = l.indexOf(' ');
      return { nombre: l.slice(i + 1), sha: l.slice(0, i) };
    });
  const commits = gitTexto(repo, ['rev-list', '--all', '--topo-order', '--reverse']).split('\n').filter(Boolean);

  // Árbol y mensaje de cada commit.
  const info = new Map();
  leerObjetos(repo, commits, (sha, tipo, buf) => info.set(sha, parsearCommit(buf)));

  // Blobs y gitlinks alcanzables, con rutas y primer commit (orden topológico).
  const blobs = new Map();
  const gitlinks = new Map();
  const arbolesVistos = new Set();
  commits.forEach((sha, idx) => {
    const { tree } = info.get(sha);
    if (arbolesVistos.has(tree)) return;
    arbolesVistos.add(tree);
    const salida = git(repo, ['ls-tree', '-r', '-z', tree]).toString('utf8');
    for (const entrada of salida.split('\0')) {
      if (!entrada) continue;
      const tab = entrada.indexOf('\t');
      const [, tipo, objeto] = entrada.slice(0, tab).split(' ');
      const ruta = entrada.slice(tab + 1);
      const mapa = tipo === 'commit' ? gitlinks : blobs;
      if (tipo !== 'commit' && tipo !== 'blob') continue;
      if (!mapa.has(objeto)) mapa.set(objeto, { rutas: new Set(), primerCommit: sha, indicePrimerCommit: idx });
      mapa.get(objeto).rutas.add(ruta);
    }
  });

  const ocurrencias = [];
  const binarios = [];
  const conFFFD = [];
  let blobsTexto = 0;
  const ficha = (sha, b) => ({
    blob: sha, rutas: [...b.rutas].sort(), primerCommit: b.primerCommit, indicePrimerCommit: b.indicePrimerCommit,
  });
  leerObjetos(repo, [...blobs.keys()].sort(), (sha, tipo, buf) => {
    const b = blobs.get(sha);
    if (esBinario(buf)) {
      binarios.push({ tipo: 'binario', ...ficha(sha, b), tamano: buf.length });
      return;
    }
    blobsTexto++;
    const texto = decodificar(buf);
    const f = ficha(sha, b);
    if (texto.includes('�')) conFFFD.push(f);
    ocurrencias.push(...ocurrenciasDeTexto(texto, {
      origen: 'blob', blob: sha, commit: null, rutas: f.rutas,
      primerCommit: f.primerCommit, indicePrimerCommit: f.indicePrimerCommit,
    }));
  });
  for (const [sha, g] of gitlinks) {
    binarios.push({ tipo: 'gitlink', ...ficha(sha, g), tamano: null });
  }
  const porFicha = (a, b) => a.indicePrimerCommit - b.indicePrimerCommit || (a.blob < b.blob ? -1 : a.blob > b.blob ? 1 : 0);
  binarios.sort(porFicha);
  conFFFD.sort(porFicha);

  // Mensajes de commit.
  commits.forEach((sha, idx) => {
    ocurrencias.push(...ocurrenciasDeTexto(info.get(sha).mensaje, {
      origen: 'mensaje', blob: null, commit: sha, rutas: null, primerCommit: null, indicePrimerCommit: idx,
    }));
  });

  const grupos = agrupar(ocurrencias); // aborta si se pierde alguna ocurrencia

  const cabecera = {
    escaner: 'scripts/fase7/escanearSemillas.mjs',
    ESCANER_VERSION,
    fecha,
    head,
    refs,
    perimetro: 'commits de `git rev-list --all` (ramas locales, remotas, tags, stash)',
    primerCommitOrden: '"primer commit" = el primero en el orden de `git rev-list --all --topo-order --reverse` cuyo árbol contiene el blob (no es la fecha)',
    numeroCommits: commits.length,
    blobsTexto,
    binarios: binarios.filter((x) => x.tipo === 'binario').length,
    gitlinks: binarios.filter((x) => x.tipo === 'gitlink').length,
    mensajes: commits.length,
    exclusiones: [
      'reflog',
      'objetos inalcanzables',
      'contenido no versionado',
      'blobs binarios (byte 0x00 en los primeros 8000 bytes): solo inventariados',
      'entradas gitlink (submódulos): solo inventariadas',
    ],
    terminos: TERMINOS,
    reglas: { ...FUENTES, ...REGLAS, flags: 'gi (sin distinguir mayúsculas)', ordenDeAplicacion: 'R2 -> R3 -> R1; R4 al final' },
    clasesAdmitidas: CLASES_ADMITIDAS,
    blobsConU_FFFD: conFFFD,
    consulta,
  };
  return { json: { cabecera, grupos, binarios }, md: renderizarMd({ cabecera, grupos }) };
}

const celda = (s) => s.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
function truncar(texto) {
  const cps = [...texto];
  return cps.length > MAX_MD ? `${cps.slice(0, MAX_MD).join('')} …[TRUNCADO]` : texto;
}
const fmtValores = (g) => (g.clave.valores === null ? '—' : g.clave.valores.join(', '));
const fila = (g) => `| ${g.id} | ${g.clave.regla} | ${g.ocurrencias.length} | ${fmtValores(g)} | \`${celda(truncar(g.clave.texto))}\` |`;
const TABLA = ['| id | regla | ocurrencias | valores | texto |', '|---|---|---|---|---|'];

function renderizarMd({ cabecera, grupos }) {
  const c = cabecera;
  const L = [];
  L.push('# Borrador de semillas (Fase 7)', '');
  L.push(`- Escáner: ${c.escaner} (versión ${c.ESCANER_VERSION})`);
  L.push(`- Fecha: ${c.fecha}`);
  L.push(`- HEAD: ${c.head}`);
  L.push(`- Perímetro: ${c.perimetro}`);
  L.push(`- Primer commit: ${c.primerCommitOrden}`);
  L.push(`- Commits: ${c.numeroCommits}; blobs de texto: ${c.blobsTexto}; binarios: ${c.binarios}; gitlinks: ${c.gitlinks}; mensajes: ${c.mensajes}`);
  L.push(`- Exclusiones: ${c.exclusiones.join('; ')}`);
  L.push(`- Términos: ${c.terminos.join(', ')}`);
  L.push(`- Clases admitidas: ${c.clasesAdmitidas.join(', ')}`);
  L.push(`- Blobs con U+FFFD: ${c.blobsConU_FFFD.length === 0 ? 'ninguno' : c.blobsConU_FFFD.map((b) => `${b.blob} (${b.rutas.join(', ')})`).join('; ')}`);
  L.push(`- Refs (${c.refs.length}):`);
  for (const r of c.refs) L.push(`  - ${r.nombre} ${r.sha}`);
  if (c.consulta) L.push(`- Consulta: ${c.consulta.desde}-${c.consulta.hasta}`);
  L.push('', '## Recuentos por regla', '', '| regla | grupos | ocurrencias |', '|---|---|---|');
  for (const regla of ['R1', 'R2', 'R3', 'R4']) {
    const gs = grupos.filter((g) => g.clave.regla === regla);
    L.push(`| ${regla} | ${gs.length} | ${gs.reduce((n, g) => n + g.ocurrencias.length, 0)} |`);
  }
  L.push('', '## Grupos', '', ...TABLA, ...grupos.map(fila));
  if (c.consulta) {
    const { desde, hasta } = c.consulta;
    L.push('', `## Consulta ${desde}-${hasta}: grupos R1-R3 que intersectan`, '');
    const hit = grupos.filter((g) => g.clave.regla !== 'R4' && intersecta(g, desde, hasta));
    L.push(...TABLA, ...hit.map(fila));
    L.push('', '## Consulta: todos los grupos R4', '');
    L.push(...TABLA, ...grupos.filter((g) => g.clave.regla === 'R4').map(fila));
  }
  return `${L.join('\n')}\n`;
}

const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

export function escribirSalida(dir, { json, md }) {
  fs.mkdirSync(dir, { recursive: true });
  const jsonTexto = `${JSON.stringify(json, null, 2)}\n`;
  const rutaJson = path.join(dir, 'borrador-semillas.json');
  const rutaMd = path.join(dir, 'borrador-semillas.md');
  fs.writeFileSync(rutaJson, jsonTexto, 'utf8');
  fs.writeFileSync(rutaMd, md, 'utf8');
  return { rutaJson, rutaMd, shaJson: sha256(jsonTexto), shaMd: sha256(md) };
}

function arg(nombre) {
  const i = process.argv.indexOf(nombre);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function main() {
  const salida = arg('--salida');
  if (!salida) fail('uso: --salida <dir> [--consulta <desde>-<hasta>]');
  let consulta = null;
  const q = arg('--consulta');
  if (q !== undefined) {
    const m = /^(\d+)-(\d+)$/.exec(q);
    if (!m || Number(m[1]) > Number(m[2])) fail(`--consulta inválida: ${q} (formato <desde>-<hasta>, desde <= hasta)`);
    consulta = { desde: Number(m[1]), hasta: Number(m[2]) };
  }
  let resultado;
  try {
    resultado = escanear({ repo: ROOT, consulta });
  } catch (e) {
    fail(e.message);
  }
  const w = escribirSalida(path.resolve(salida), resultado);
  const g = resultado.json.grupos;
  console.log(`head: ${resultado.json.cabecera.head}`);
  for (const regla of ['R1', 'R2', 'R3', 'R4']) {
    const gs = g.filter((x) => x.clave.regla === regla);
    console.log(`${regla}: ${gs.length} grupos, ${gs.reduce((n, x) => n + x.ocurrencias.length, 0)} ocurrencias`);
  }
  console.log(`${w.rutaJson} sha256=${w.shaJson}`);
  console.log(`${w.rutaMd} sha256=${w.shaMd}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main();
