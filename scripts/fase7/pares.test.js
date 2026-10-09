import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { blind, serialize } from '../../src/eval/blind/blind.js';
import {
  CONTEXTO, DESCRIPCION_PERFIL, MANIFIESTO_SHA256,
  semillaDeSha, validarManifiesto, formarPares, construirSalidas,
} from './pares.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, 'pares-run.mjs');
const SHA_VALIDO = 'abcdef0123456789abcdef0123456789abcdef01';

const nombreCaso = (k) => `S${String(k + 1).padStart(2, '0')}`;

// Contenido opaco: no deriva del id ni del motor.
function vistaSintetica(n) {
  return {
    days: Array.from({ length: 7 }, (_, d) => ({
      meals: [
        { momento: 'comida', plato: `plato ${n}-${d + 1}-c` },
        { momento: 'cena', plato: `plato ${n}-${d + 1}-n` },
      ],
    })),
  };
}

// 20 casos (10 P1, 10 P2), dos planes por caso, en orden de entrada fijo.
function manifiestoSintetico() {
  const casos = [];
  const planes = [];
  for (let k = 0; k < 20; k++) {
    const caso = nombreCaso(k);
    const entrada = { caso, perfil: k < 10 ? 'P1' : 'P2', semilla: k, planes: [] };
    for (const motor of ['legacy', 'engine2']) {
      const id = `${caso}-${motor}`;
      const archivo = `planes/${id}.json`;
      entrada.planes.push({ id, motor, archivo, sha256Plan: 'x' });
      planes.push({ id, motor, archivo });
    }
    casos.push(entrada);
  }
  return { casos, planes };
}

function itemsSinteticos(manifiesto) {
  return manifiesto.planes.map((p, n) => ({ id: p.id, view: vistaSintetica(n) }));
}

describe('semillaDeSha', () => {
  it('toma los 8 primeros caracteres hexadecimales', () => {
    expect(semillaDeSha(SHA_VALIDO)).toBe(parseInt('abcdef01', 16));
    expect(semillaDeSha('0'.repeat(40))).toBe(0);
    expect(semillaDeSha('f'.repeat(40))).toBe(0xFFFFFFFF);
  });
  it('rechaza formas inválidas', () => {
    expect(() => semillaDeSha(SHA_VALIDO.toUpperCase())).toThrow();
    expect(() => semillaDeSha(SHA_VALIDO.slice(0, 39))).toThrow();
    expect(() => semillaDeSha(`${SHA_VALIDO}0`)).toThrow();
    expect(() => semillaDeSha(`${'g'.repeat(40)}`)).toThrow();
    expect(() => semillaDeSha(12345)).toThrow();
    expect(() => semillaDeSha(undefined)).toThrow();
  });
});

describe('validarManifiesto', () => {
  it('acepta el manifiesto sintético y devuelve los mapas', () => {
    const m = manifiestoSintetico();
    const r = validarManifiesto(m);
    expect(r.casoPorId['S01-legacy']).toBe('S01');
    expect(r.perfilPorCaso.S01).toBe('P1');
    expect(r.perfilPorCaso.S20).toBe('P2');
    expect(r.motorPorId['S05-engine2']).toBe('engine2');
  });
  it('rechaza un número de casos distinto de 20', () => {
    const m = manifiestoSintetico();
    m.casos.pop();
    expect(() => validarManifiesto(m)).toThrow(/20 casos/);
    expect(() => validarManifiesto({ ...manifiestoSintetico(), casos: 'no' })).toThrow();
  });
  it('rechaza un caso sin exactamente 2 planes', () => {
    const m = manifiestoSintetico();
    m.casos[0].planes.pop();
    expect(() => validarManifiesto(m)).toThrow(/2 planes/);
  });
  it('rechaza un caso sin un plan de cada motor', () => {
    const m = manifiestoSintetico();
    m.casos[0].planes[1].motor = 'legacy';
    expect(() => validarManifiesto(m)).toThrow(/legacy y uno engine2/);
  });
  it('rechaza perfiles distintos de P1/P2 o con reparto distinto de 10 y 10', () => {
    const m1 = manifiestoSintetico();
    m1.casos[0].perfil = 'P3';
    expect(() => validarManifiesto(m1)).toThrow(/P1 o P2/);
    const m2 = manifiestoSintetico();
    m2.casos[0].perfil = 'P2';
    expect(() => validarManifiesto(m2)).toThrow(/10 casos P1/);
  });
  it('rechaza un manifiesto que no es un objeto', () => {
    expect(() => validarManifiesto(null)).toThrow(/debe ser un objeto/);
  });
  it('rechaza planes que no es un array', () => {
    const m = manifiestoSintetico();
    m.planes = 'no';
    expect(() => validarManifiesto(m)).toThrow(/manifiesto\.planes: debe ser un array/);
  });
  it('rechaza un caso con nombre vacío', () => {
    const m = manifiestoSintetico();
    m.casos[0].caso = '';
    expect(() => validarManifiesto(m)).toThrow(/casos\[0\]\.caso: vacío/);
  });
  it('rechaza nombres de caso duplicados', () => {
    const m = manifiestoSintetico();
    m.casos[1].caso = m.casos[0].caso;
    expect(() => validarManifiesto(m)).toThrow(/casos\[1\]\.caso: duplicado/);
  });
  it('rechaza un id vacío dentro de casos[].planes[]', () => {
    const m = manifiestoSintetico();
    m.casos[0].planes[0].id = '';
    expect(() => validarManifiesto(m)).toThrow(/casos\[0\]\.planes\[0\]\.id: vacío/);
  });
  it('rechaza un id duplicado dentro de planes[] raíz', () => {
    // casos[] intacto y válido: el primer error es el duplicado en planes[].
    const m = manifiestoSintetico();
    m.planes[1].id = m.planes[0].id;
    expect(() => validarManifiesto(m)).toThrow(/planes\[1\]\.id: duplicado/);
  });
  it('rechaza ids duplicados', () => {
    const m = manifiestoSintetico();
    m.casos[1].planes[0].id = m.casos[0].planes[0].id;
    expect(() => validarManifiesto(m)).toThrow(/duplicado/);
  });
  it('rechaza que los ids de planes[] difieran de los de casos[]', () => {
    const m = manifiestoSintetico();
    m.planes[0].id = 'otro-id';
    expect(() => validarManifiesto(m)).toThrow(/no coincide/);
    const m2 = manifiestoSintetico();
    m2.planes.pop();
    expect(() => validarManifiesto(m2)).toThrow(/no coincide/);
  });
  it('rechaza motor o archivo distintos entre planes[] y casos[]', () => {
    const m1 = manifiestoSintetico();
    m1.planes[0].motor = 'engine2';
    expect(() => validarManifiesto(m1)).toThrow(/motor distinto/);
    const m2 = manifiestoSintetico();
    m2.planes[0].archivo = 'planes/otro.json';
    expect(() => validarManifiesto(m2)).toThrow(/archivo distinto/);
  });
});

describe('formarPares', () => {
  const m = manifiestoSintetico();
  const { casoPorId, perfilPorCaso, motorPorId } = validarManifiesto(m);
  const items = itemsSinteticos(m);

  it('reagrupa en 20 pares completos, con etiquetas únicas en todo el lote', () => {
    const r = blind(items, 7);
    const pares = formarPares(r, casoPorId);
    expect(pares.length).toBe(20);
    const etiquetas = [];
    for (const p of pares) {
      expect(casoPorId[p.A.id]).toBe(p.caso);
      expect(casoPorId[p.B.id]).toBe(p.caso);
      expect(p.A.id).not.toBe(p.B.id);
      etiquetas.push(p.A.etiqueta, p.B.etiqueta);
    }
    expect(new Set(etiquetas).size).toBe(40);
    // A es el que aparece antes en evaluador.planes; pares por primera aparición.
    const orden = r.evaluador.planes.map((p) => p.etiqueta);
    pares.forEach((p) => expect(orden.indexOf(p.A.etiqueta)).toBeLessThan(orden.indexOf(p.B.etiqueta)));
    for (let k = 1; k < pares.length; k++) {
      expect(orden.indexOf(pares[k - 1].A.etiqueta)).toBeLessThan(orden.indexOf(pares[k].A.etiqueta));
    }
  });

  it('formarPares tiene exactamente dos parámetros y su salida no contiene información de motor', () => {
    expect(formarPares.length).toBe(2);
    // ids opacos: la función solo ve etiqueta, id y días.
    const opacos = items.map((it, n) => ({ id: `u${n}`, view: it.view }));
    const mapa = Object.fromEntries(opacos.map((it, n) => [it.id, nombreCaso(Math.floor(n / 2))]));
    const pares = formarPares(blind(opacos, 11), mapa);
    expect(pares.length).toBe(20);
    pares.forEach((p) => expect(Object.keys(p.A)).toEqual(['etiqueta', 'id', 'dias']));
    expect(JSON.stringify(pares)).not.toMatch(/legacy|engine2|motor|P1|P2/);
  });

  it('lanza error ante etiqueta sin id', () => {
    const r = blind(items, 3);
    r.clave.entradas.pop();
    expect(() => formarPares(r, casoPorId)).toThrow(/sin id/);
  });
  it('lanza error ante etiqueta repetida', () => {
    const r1 = blind(items, 3);
    r1.evaluador.planes[1].etiqueta = r1.evaluador.planes[0].etiqueta;
    expect(() => formarPares(r1, casoPorId)).toThrow(/repetida/);
    const r2 = blind(items, 3);
    r2.clave.entradas[1].etiqueta = r2.clave.entradas[0].etiqueta;
    expect(() => formarPares(r2, casoPorId)).toThrow(/repetida/);
  });
  it('lanza error ante id sin caso', () => {
    const r = blind(items, 3);
    const sinCaso = { ...casoPorId };
    delete sinCaso[r.clave.entradas[0].id];
    expect(() => formarPares(r, sinCaso)).toThrow(/sin caso/);
  });
  it('lanza error ante un tercer plan de un caso', () => {
    const r = blind(items, 3);
    const extra = r.clave.entradas[0];
    const mapa = { ...casoPorId, [extra.id]: casoPorId[r.clave.entradas[1].id] };
    // fuerza que tres planes compartan caso
    const tercero = r.clave.entradas.find((e) => casoPorId[e.id] !== mapa[extra.id]);
    mapa[tercero.id] = mapa[extra.id];
    expect(() => formarPares(r, mapa)).toThrow(/tercer plan/);
  });
  it('lanza error si la clave contiene etiquetas que no aparecen en el evaluador', () => {
    const r = blind(items, 3);
    r.clave.entradas.push({ etiqueta: 'ZZ-sobrante', id: 'sobrante' });
    expect(() => formarPares(r, casoPorId)).toThrow(/no aparecen en el evaluador/);
  });
  it('lanza error ante un par incompleto', () => {
    const r = blind(items.slice(0, 3), 3);
    expect(() => formarPares(r, casoPorId)).toThrow(/incompleto/);
  });

  it('construirSalidas: forma, orden de claves y ausencia de fuga hacia el evaluador', () => {
    const r = blind(items, 5);
    const pares = formarPares(r, casoPorId);
    const { evaluador, clave } = construirSalidas({
      pares, perfilPorCaso, motorPorId, sha: SHA_VALIDO, seed: 5, manifiestoSha256: MANIFIESTO_SHA256,
    });
    expect(Object.keys(evaluador)).toEqual(['contexto', 'pares']);
    expect(evaluador.contexto).toBe(CONTEXTO);
    expect(Object.keys(evaluador.pares[0])).toEqual(['par', 'perfil', 'A', 'B']);
    expect(Object.keys(evaluador.pares[0].A)).toEqual(['etiqueta', 'dias']);
    expect(evaluador.pares.map((p) => p.par)).toEqual(Array.from({ length: 20 }, (_, k) => k + 1));
    expect(Object.keys(clave)).toEqual(['sha', 'seed', 'manifiestoSha256', 'pares']);
    expect(Object.keys(clave.pares[0])).toEqual(['par', 'caso', 'A', 'B']);
    expect(Object.keys(clave.pares[0].A)).toEqual(['etiqueta', 'id', 'motor']);
    expect(Object.isFrozen(DESCRIPCION_PERFIL)).toBe(true);
    const vista = JSON.stringify(evaluador);
    expect(vista).not.toMatch(/legacy|engine2|"caso"|"id"|"seed"|S\d\d/);
    expect(vista).not.toMatch(/P1|P2/);
    clave.pares.forEach((p, k) => {
      expect(evaluador.pares[k].A.etiqueta).toBe(p.A.etiqueta);
      expect(evaluador.pares[k].perfil).toBe(DESCRIPCION_PERFIL[perfilPorCaso[p.caso]]);
      expect(new Set([p.A.motor, p.B.motor])).toEqual(new Set(['legacy', 'engine2']));
    });
  });

  it('es determinista: misma entrada y misma semilla dan salidas idénticas', () => {
    const correr = (seed) => {
      const pares = formarPares(blind(items, seed), casoPorId);
      const s = construirSalidas({ pares, perfilPorCaso, motorPorId, sha: SHA_VALIDO, seed, manifiestoSha256: MANIFIESTO_SHA256 });
      return [serialize(s.evaluador), serialize(s.clave)];
    };
    expect(correr(42)).toEqual(correr(42));
    expect(correr(42)).not.toEqual(correr(43));
  });
});

describe('CLI pares-run.mjs', () => {
  const dirsTemporales = [];
  afterEach(() => {
    while (dirsTemporales.length) {
      fs.rmSync(dirsTemporales.pop(), { recursive: true, force: true });
    }
  });
  function entorno() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pares-test-'));
    dirsTemporales.push(dir);
    const manifiesto = path.join(dir, 'manifiesto.json');
    fs.writeFileSync(manifiesto, JSON.stringify(manifiestoSintetico()));
    return {
      dir, manifiesto,
      outE: path.join(dir, 'evaluador.json'),
      outC: path.join(dir, 'clave.json'),
    };
  }
  function lanzar(e, { sha = SHA_VALIDO, confirmo = true } = {}) {
    const args = [CLI, '--manifiesto', e.manifiesto, '--sha', sha, '--salida-evaluador', e.outE, '--salida-clave', e.outC];
    if (confirmo) args.push('--confirmo-ejecucion');
    return spawnSync(process.execPath, args, { encoding: 'utf8' });
  }
  const nadaEscrito = (e) => !fs.existsSync(e.outE) && !fs.existsSync(e.outC);

  it('aborta sin escribir si falta --confirmo-ejecucion', () => {
    const e = entorno();
    const r = lanzar(e, { confirmo: false });
    expect(r.status).not.toBe(0);
    expect(nadaEscrito(e)).toBe(true);
  });
  it('aborta sin escribir si el sha es inválido', () => {
    const e = entorno();
    const r = lanzar(e, { sha: SHA_VALIDO.toUpperCase() });
    expect(r.status).not.toBe(0);
    expect(nadaEscrito(e)).toBe(true);
  });
  it('aborta sin escribir si el sha256 del manifiesto no es el fijado', () => {
    const e = entorno();
    const r = lanzar(e);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/sha256 del manifiesto/);
    expect(nadaEscrito(e)).toBe(true);
  });
});

describe('estadística de la orientación (semillas 0-999)', () => {
  const m = manifiestoSintetico();
  const { casoPorId } = validarManifiesto(m);
  const items = itemsSinteticos(m);
  const nK = Array(20).fill(0);
  const mK = Array(20).fill(0);
  const indiceCaso = Object.fromEntries(m.casos.map((c, k) => [c.caso, k]));

  for (let seed = 0; seed < 1000; seed++) {
    const pares = formarPares(blind(items, seed), casoPorId);
    for (const p of pares) {
      // El orden de entrada solo lo conoce el test: el primer plan del caso es el legacy.
      if (p.A.id === `${p.caso}-legacy`) nK[indiceCaso[p.caso]]++;
    }
    mK[indiceCaso[pares[0].caso]]++;
  }
  const N = nK.reduce((a, b) => a + b, 0);

  it('a. por caso, |n_k - 500| <= 79', () => {
    console.log(`n_k min=${Math.min(...nK)} max=${Math.max(...nK)}`);
    nK.forEach((n) => expect(Math.abs(n - 500)).toBeLessThanOrEqual(79));
  });
  it('b. global, |N - 10000| <= 353', () => {
    console.log(`N=${N}`);
    expect(Math.abs(N - 10000)).toBeLessThanOrEqual(353);
  });
  it('c. por caso, |m_k - 50| <= 34', () => {
    console.log(`m_k min=${Math.min(...mK)} max=${Math.max(...mK)}`);
    mK.forEach((n) => expect(Math.abs(n - 50)).toBeLessThanOrEqual(34));
  });
});
