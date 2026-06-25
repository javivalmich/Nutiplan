// Fase 2, Paso B.2, Commit 2: test anti-TODO sobre dishes.scaffold.json.
//
// CONTROL DE DISCRIMINACION OBLIGATORIO (las dos caras):
//   - sobre el scaffold REAL -> ROJO (lleno de TODO; es lo esperado: el
//     scaffold real tiene 178 platos, ninguno anotado todavia por Javi).
//     Este rojo es una senal de trabajo pendiente, NO un fallo del
//     sistema. "Control verificado", no "verde". El test de esta seccion
//     se deja DELIBERADAMENTE en rojo en este commit: es un recordatorio
//     vivo de que la anotacion real (trabajo de Javi) no se ha hecho.
//   - sobre un fixture sintetico SIN TODOs -> VERDE.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findTodoFields } from '../../../../scripts/phaseB2/antiTodo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCAFFOLD_PATH = path.resolve(__dirname, '../../../../scripts/phaseB2/output/dishes.scaffold.json');

function dishLimpioFixture(overrides = {}) {
  return {
    id: '["tmpl","P",null,"V",null,"S","cookM"]',
    nombre: 'Plato de prueba',
    rol: 'rotativo',
    batchable: false,
    leftoverQuality: 'media',
    shelfLifeDays: 3,
    energiaCocina: 'medio',
    momento: ['comida'],
    tempFeel: 'caliente',
    plateType: 'caliente_arroz',
    ...overrides,
  };
}

describe('CARA VERDE: fixture sintetico sin ningun TODO', () => {
  it('findTodoFields devuelve [] sobre un fixture totalmente anotado', () => {
    const fixtureLimpio = [dishLimpioFixture(), dishLimpioFixture({ id: '["otro","combo",null,"V",null,"S","cookM"]' })];
    expect(findTodoFields(fixtureLimpio)).toEqual([]);
  });

  it('PRUEBA DE DISCRIMINACION: si UN solo campo de un solo plato vuelve a "TODO", el control lo detecta', () => {
    const fixtureConUnTodo = [dishLimpioFixture(), dishLimpioFixture({ id: '["otro","combo",null,"V",null,"S","cookM"]', energiaCocina: 'TODO' })];
    const pendientes = findTodoFields(fixtureConUnTodo);
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0]).toEqual({ id: '["otro","combo",null,"V",null,"S","cookM"]', field: 'energiaCocina' });
  });
});

describe('CARA ROJA (esperada): scaffold REAL — anotacion de Javi pendiente', () => {
  const scaffoldReal = JSON.parse(fs.readFileSync(SCAFFOLD_PATH, 'utf-8'));

  it('el scaffold real existe y tiene platos (precondicion)', () => {
    expect(scaffoldReal.length).toBeGreaterThan(0);
  });

  it('DEBE FALLAR hoy: el scaffold real tiene campos editoriales pendientes ("TODO"). Este rojo es el estado correcto hasta que Javi anote.', () => {
    const pendientes = findTodoFields(scaffoldReal);
    if (pendientes.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[anti-TODO] ${pendientes.length} campos pendientes en el scaffold real (de ${scaffoldReal.length} platos). Primeros 5:`, JSON.stringify(pendientes.slice(0, 5), null, 2));
    }
    expect(pendientes).toEqual([]);
  });
});
