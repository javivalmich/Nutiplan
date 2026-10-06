// Tests del generador que ejecutan los motores. Usan semillas de test (1 y 2),
// nunca las de evaluación (2001–2010), y no escriben archivos.
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generarCaso } from './generarCasos.mjs';
import { SEMILLAS_EVALUACION, ESTRATEGIA } from './casos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, 'generarCasos.mjs');
const SEMILLAS_TEST = [1, 2];

describe('generarCaso con motores reales (semillas de test)', () => {
  it('las semillas de test no son de evaluación', () => {
    for (const s of SEMILLAS_TEST) expect(SEMILLAS_EVALUACION).not.toContain(s);
  });

  for (const perfil of ['P1', 'P2']) {
    for (const semilla of SEMILLAS_TEST) {
      it(`${perfil}-${semilla}: pasa las cuatro verificaciones`, () => {
        const c = generarCaso(perfil, semilla);
        expect(c.planes.legacy.strategy).toBe(ESTRATEGIA);
        expect(c.planes.engine2.strategy).toBe(ESTRATEGIA);
        expect(c.vistas.legacy.days).toHaveLength(7);
        expect(c.vistas.engine2.days).toHaveLength(7);
      }, 30000);
    }
  }

  it('P1 llega como entreno a ambos motores (la traducción de nombres funciona)', () => {
    const c = generarCaso('P1', 1);
    const entrenoLegacy = c.planes.legacy.days.filter((d) => d.special === 'entrenamiento').map((d) => d.name);
    expect(entrenoLegacy).toEqual(['Lunes', 'Miércoles', 'Viernes']);
    const entrenoEngine2 = c.planes.engine2.decisionLog
      .filter((e) => e.cause === 'cita_fija_entreno').map((e) => e.consequence);
    expect(entrenoEngine2).toEqual([
      'beats.Lunes.fixedRole = "entreno"',
      'beats.Miercoles.fixedRole = "entreno"',
      'beats.Viernes.fixedRole = "entreno"',
    ]);
  }, 30000);

  it('P2 no tiene días de entreno en ningún motor', () => {
    const c = generarCaso('P2', 1);
    expect(c.planes.legacy.days.some((d) => d.special === 'entrenamiento')).toBe(false);
    expect(c.planes.engine2.decisionLog.some((e) => e.cause === 'cita_fija_entreno')).toBe(false);
  }, 30000);
});

describe('generarCasos — CLI se niega sin las condiciones', () => {
  const run = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

  it('sin --confirmo-generacion no hace nada', () => {
    const r = run([]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/--confirmo-generacion/);
  }, 30000);

  it('con salida dentro del repositorio se niega', () => {
    const r = run(['--registro', 'no-existe.json', '--salida', path.join(__dirname, 'tmp-salida'), '--confirmo-generacion']);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/fuera del repositorio/);
  }, 30000);
});
