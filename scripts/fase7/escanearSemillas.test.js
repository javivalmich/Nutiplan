// Integración del escáner contra un repo git TEMPORAL (nunca el repo real).
// Ningún fixture usa enteros 2001-2010.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { escanear, escribirSalida } from './escanearSemillas.mjs';

let tmp;
let repo;
const sha = {};

const ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@example.com',
  GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@example.com',
};
const git = (...args) => execFileSync(
  'git', ['-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', ...args],
  { cwd: repo, env: ENV, encoding: 'utf8', windowsHide: true },
).trim();
const escribir = (rel, contenido) => fs.writeFileSync(path.join(repo, rel), contenido);
const commit = (msg) => {
  git('add', '-A');
  git('commit', '-q', '-m', msg);
  return git('rev-parse', 'HEAD');
};
const sinFecha = (json) => ({ ...json, cabecera: { ...json.cabecera, fecha: null } });
const quitaFecha = (md) => md.split('\n').filter((l) => !l.startsWith('- Fecha:')).join('\n');

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'escaner-semillas-'));
  repo = path.join(tmp, 'repo');
  fs.mkdirSync(repo);
  git('init', '-q', '-b', 'main');

  escribir('a.txt', 'seed: 5\nhola\n');
  escribir('dup1.txt', 'const seeds = [2, 4, 6]\n');
  sha.c1 = commit('inicial\n\nusa semilla 7 aqui');

  escribir('a.txt', 'seed: 6\nhola\n'); // blob modificado
  escribir('dup2.txt', 'const seeds = [2, 4, 6]\n'); // mismo blob, otra ruta
  fs.writeFileSync(path.join(repo, 'bin.dat'), Buffer.from([1, 2, 0, 3, 4]));
  sha.c2 = commit('segundo');

  git('checkout', '-q', '-b', 'otra', sha.c1);
  escribir('o.txt', 'for (let seed = 1; seed < 50; i++)\nseed: base + i\n');
  sha.c3 = commit('rama otra');
  git('tag', 'etiqueta', sha.c3);
  git('checkout', '-q', 'main');
  sha.blobDup = git('rev-parse', 'HEAD:dup1.txt');
  sha.blobA1 = git('rev-parse', `${sha.c1}:a.txt`);
  sha.blobA2 = git('rev-parse', 'HEAD:a.txt');
  sha.blobBin = git('rev-parse', 'HEAD:bin.dat');
});

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5 });
});

describe('escanear (repo temporal)', () => {
  it('registra refs, head y commits de todas las ramas', () => {
    const { json } = escanear({ repo });
    const c = json.cabecera;
    expect(c.head).toBe(sha.c2);
    expect(c.refs.map((r) => r.nombre).sort()).toEqual(['refs/heads/main', 'refs/heads/otra', 'refs/tags/etiqueta']);
    expect(c.refs.find((r) => r.nombre === 'refs/heads/otra').sha).toBe(sha.c3);
    expect(c.numeroCommits).toBe(3);
    expect(c.mensajes).toBe(3);
    expect(c.exclusiones.join(' ')).toMatch(/reflog/);
    expect(c.exclusiones.join(' ')).toMatch(/inalcanzables/);
  });

  it('deduplica blobs, conserva rutas y primer commit (orden topológico)', () => {
    const { json } = escanear({ repo });
    const todas = json.grupos.flatMap((g) => g.ocurrencias);
    const dup = todas.filter((o) => o.blob === sha.blobDup);
    expect(dup).toHaveLength(1); // una ocurrencia R3, no dos
    expect(dup[0].rutas).toEqual(['dup1.txt', 'dup2.txt']);
    expect(dup[0].primerCommit).toBe(sha.c1);
    expect(dup[0].indicePrimerCommit).toBe(0);
    // el blob de a.txt del primer commit aparece también en la rama "otra": una sola vez
    expect(todas.filter((o) => o.blob === sha.blobA1)).toHaveLength(1);
    // blob modificado: versión nueva con primer commit c2
    const nuevo = todas.find((o) => o.blob === sha.blobA2);
    expect(nuevo.valores).toEqual([6]);
    expect(nuevo.primerCommit).toBe(sha.c2);
    expect(json.cabecera.blobsTexto).toBe(4); // a(v1), a(v2), dup, o.txt
  });

  it('inventaría binarios sin escanearlos', () => {
    const { json } = escanear({ repo });
    expect(json.cabecera.binarios).toBe(1);
    expect(json.binarios).toEqual([{
      tipo: 'binario', blob: sha.blobBin, rutas: ['bin.dat'], primerCommit: sha.c2, indicePrimerCommit: json.binarios[0].indicePrimerCommit, tamano: 5,
    }]);
    expect(json.grupos.flatMap((g) => g.ocurrencias).some((o) => o.blob === sha.blobBin)).toBe(false);
  });

  it('escanea mensajes de commit con origen "mensaje"', () => {
    const { json } = escanear({ repo });
    const m = json.grupos.flatMap((g) => g.ocurrencias).filter((o) => o.origen === 'mensaje');
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ regla: 'R1', valores: [7], commit: sha.c1, linea: 3, blob: null });
  });

  it('for con < y R4 de la rama; grupos ordenados con ids estables', () => {
    const { json } = escanear({ repo });
    const g = json.grupos;
    expect(g.map((x) => x.id)).toEqual(g.map((_, i) => `G${String(i + 1).padStart(4, '0')}`));
    const f = g.find((x) => x.clave.texto.startsWith('for (let seed'));
    expect(f.clave.valores).toEqual([1, 49]);
    expect(f.ocurrencias[0].banderas).toEqual({ limiteExclusivoConvertido: true });
    expect(g.find((x) => x.clave.regla === 'R4').clave.valores).toBeNull();
    expect(g.every((x) => x.clasificacion === null && x.nota === null)).toBe(true);
    const total = g.reduce((n, x) => n + x.ocurrencias.length, 0);
    expect(total).toBe(6); // a v1, a v2, R3, for, R4, mensaje
  });

  it('es determinista salvo la fecha', () => {
    const a = escanear({ repo, fecha: 'x' });
    const b = escanear({ repo, fecha: 'y' });
    expect(sinFecha(a.json)).toEqual(sinFecha(b.json));
    expect(quitaFecha(a.md)).toBe(quitaFecha(b.md));
    expect(JSON.stringify(sinFecha(a.json))).toBe(JSON.stringify(sinFecha(b.json)));
  });

  it('con consulta añade intersecciones y todos los R4', () => {
    const { md, json } = escanear({ repo, consulta: { desde: 40, hasta: 60 } });
    expect(json.cabecera.consulta).toEqual({ desde: 40, hasta: 60 });
    expect(md).toMatch(/## Consulta 40-60: grupos R1-R3 que intersectan/);
    expect(md).toMatch(/## Consulta: todos los grupos R4/);
    const parteI = md.split('## Consulta: todos los grupos R4')[0].split('que intersectan')[1];
    expect(parteI).toMatch(/for \(let seed/);
    expect(parteI).not.toMatch(/seed: 5/);
  });

  it('rechaza un working tree sucio', () => {
    escribir('sucio.txt', 'x\n');
    try {
      expect(() => escanear({ repo })).toThrow(/no está limpio/);
    } finally {
      fs.rmSync(path.join(repo, 'sucio.txt'));
    }
    expect(() => escanear({ repo })).not.toThrow();
  });
});

describe('escribirSalida', () => {
  it('escribe UTF-8 sin BOM y con LF, y devuelve sha256 correctos', () => {
    const r = escribirSalida(path.join(tmp, 'salida'), escanear({ repo }));
    for (const [ruta, shaEsperado] of [[r.rutaJson, r.shaJson], [r.rutaMd, r.shaMd]]) {
      const buf = fs.readFileSync(ruta);
      expect(buf.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))).toBe(false);
      expect(buf.includes(0x0d)).toBe(false);
      expect(crypto.createHash('sha256').update(buf).digest('hex')).toBe(shaEsperado);
    }
    expect(path.basename(r.rutaJson)).toBe('borrador-semillas.json');
    expect(path.basename(r.rutaMd)).toBe('borrador-semillas.md');
  });
});
