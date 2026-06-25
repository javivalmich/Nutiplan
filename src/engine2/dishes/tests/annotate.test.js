// Fase 2, Paso B.2, Commit 4: anotador interactivo probado SOLO contra un
// fixture de 2 platos (uno normal, uno tipo ancla con campos ya
// arrastrados salvo nombre). PROHIBIDO ejecutar sobre el scaffold real
// en esta sesion: este test nunca toca
// scripts/phaseB2/output/dishes.scaffold.json.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  annotateScaffold,
  parseFieldAnswer,
  promptFor,
  EDITORIAL_FIELDS,
} from '../../../../scripts/phaseB2/annotate.js';
import { validateDish } from '../schema.js';

let fixturePath;

function fixtureScaffold() {
  return [
    // Plato "normal": todo en TODO.
    {
      id: '["caliente_clasico","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]',
      nombre: 'TODO',
      rol: 'TODO',
      batchable: 'TODO',
      leftoverQuality: 'TODO',
      shelfLifeDays: 'TODO',
      energiaCocina: 'TODO',
      momento: ['comida', 'cena'],
      tempFeel: 'caliente',
      plateType: 'caliente_arroz',
    },
    // Plato "ancla": 5 campos arrastrados de CP2, solo nombre pendiente.
    {
      id: '["caliente_clasico","ternera","patata","zanahoria",null,"ajillo","guisado"]',
      nombre: 'TODO',
      rol: 'ancla',
      batchable: true,
      leftoverQuality: 'alta',
      shelfLifeDays: 4,
      energiaCocina: 'alto',
      momento: ['comida'],
      tempFeel: 'muy_caliente',
      plateType: 'caliente_patata',
    },
  ];
}

beforeEach(() => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'annotate-test-'));
  fixturePath = path.join(tmpDir, 'dishes.scaffold.fixture.json');
  fs.writeFileSync(fixturePath, JSON.stringify(fixtureScaffold(), null, 2));
});

afterEach(() => {
  fs.rmSync(path.dirname(fixturePath), { recursive: true, force: true });
});

function makeScriptedAsk(answers) {
  let i = 0;
  return async () => {
    if (i >= answers.length) throw new Error('makeScriptedAsk: se acabaron las respuestas guionizadas');
    return answers[i++];
  };
}

describe('parseFieldAnswer — validacion de sintaxis pura (sin terminal)', () => {
  it('rechaza un valor de enum invalido para rol', () => {
    expect(parseFieldAnswer('rol', 'capricho_mal_escrito')).toHaveProperty('error');
  });

  it('acepta un valor de enum valido para rol', () => {
    expect(parseFieldAnswer('rol', 'capricho')).toEqual({ skip: false, value: 'capricho' });
  });

  it('respuesta vacia -> skip (el campo sigue TODO, nunca se decide un valor por defecto)', () => {
    expect(parseFieldAnswer('rol', '   ')).toEqual({ skip: true });
  });

  it('shelfLifeDays rechaza no-enteros y negativos', () => {
    expect(parseFieldAnswer('shelfLifeDays', '2.5')).toHaveProperty('error');
    expect(parseFieldAnswer('shelfLifeDays', '-1')).toHaveProperty('error');
    expect(parseFieldAnswer('shelfLifeDays', '3')).toEqual({ skip: false, value: 3 });
  });

  it('batchable acepta solo true/false (case-insensitive)', () => {
    expect(parseFieldAnswer('batchable', 'True')).toEqual({ skip: false, value: true });
    expect(parseFieldAnswer('batchable', 'si')).toHaveProperty('error');
  });
});

describe('annotateScaffold — fixture de 2 platos (normal + ancla)', () => {
  it('(a) RESPETA los campos ya arrastrados del ancla: no los re-pregunta', async () => {
    // Si el anotador preguntara los 5 campos arrastrados del ancla,
    // makeScriptedAsk se quedaria sin respuestas y lanzaria. Solo le damos
    // respuestas para los 2 "nombre" pendientes (uno por plato) + el resto
    // del plato normal.
    const ask = makeScriptedAsk([
      'Pollo con arroz y brocoli', // nombre del plato normal (se pregunta primero: EDITORIAL_FIELDS[0])
      'rotativo', // rol del plato normal
      'false', // batchable del plato normal
      'media', // leftoverQuality del plato normal
      '3', // shelfLifeDays del plato normal
      'medio', // energiaCocina del plato normal
      'Ternera guisada con patata y zanahoria', // nombre del ancla (UNICO pendiente)
    ]);

    const { dishes, restantes } = await annotateScaffold(fixturePath, ask);

    const ancla = dishes.find((d) => d.rol === 'ancla');
    expect(ancla.batchable).toBe(true); // arrastrado, no preguntado
    expect(ancla.leftoverQuality).toBe('alta'); // arrastrado
    expect(ancla.shelfLifeDays).toBe(4); // arrastrado
    expect(ancla.energiaCocina).toBe('alto'); // arrastrado
    expect(ancla.nombre).toBe('Ternera guisada con patata y zanahoria'); // unico pendiente, respondido

    expect(restantes).toEqual([]);
  });

  it('(b) RECHAZA un enum invalido y vuelve a preguntar el mismo campo', async () => {
    const ask = makeScriptedAsk([
      'Pollo con arroz y brocoli', // nombre del plato normal
      'rol_invalido', // rechazado
      'rotativo', // aceptado tras el rechazo
      'false',
      'media',
      '3',
      'medio',
      'Ternera guisada con patata y zanahoria',
    ]);

    const mensajes = [];
    const { dishes } = await annotateScaffold(fixturePath, ask, { log: (m) => mensajes.push(m) });

    const platoNormal = dishes.find((d) => d.rol !== 'ancla' && d.rol !== 'TODO');
    expect(platoNormal.rol).toBe('rotativo');
    expect(mensajes.some((m) => m.includes('Valor invalido'))).toBe(true);
  });

  it('(c) si el usuario NO responde un campo (respuesta vacia), ese campo SIGUE "TODO" — no se decide solo', async () => {
    const ask = makeScriptedAsk([
      '', // nombre del plato normal: sin responder
      '', // rol: sin responder
      'false',
      'media',
      '3',
      'medio',
      '', // nombre del ancla: sin responder
    ]);

    const { dishes, restantes } = await annotateScaffold(fixturePath, ask);

    const platoNormal = dishes.find((d) => d.id.includes('pollo'));
    expect(platoNormal.rol).toBe('TODO'); // sigue TODO: el usuario no respondio
    expect(platoNormal.nombre).toBe('TODO');
    expect(platoNormal.batchable).toBe(false); // este SI se respondio

    const ancla = dishes.find((d) => d.id.includes('ternera'));
    expect(ancla.nombre).toBe('TODO');

    expect(restantes.length).toBeGreaterThan(0);
    expect(restantes).toEqual(
      expect.arrayContaining([
        { id: platoNormal.id, field: 'rol' },
        { id: platoNormal.id, field: 'nombre' },
        { id: ancla.id, field: 'nombre' },
      ])
    );
  });

  it('escritura incremental y resumible: tras una pasada parcial, releer el fixture en disco refleja lo ya respondido', async () => {
    const ask = makeScriptedAsk(['Pollo con arroz', 'rotativo', 'false', 'media', '3', 'medio', '']);
    await annotateScaffold(fixturePath, ask);

    const enDisco = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
    const platoNormal = enDisco.find((d) => d.id.includes('pollo'));
    expect(platoNormal.rol).toBe('rotativo'); // persistido en disco, no solo en memoria
    expect(platoNormal.nombre).toBe('Pollo con arroz');

    // Segunda pasada (resumible): el ancla aun tiene nombre=TODO en disco;
    // retomamos justo ahi sin re-preguntar nada del plato normal (ya
    // completo, se salta).
    const ask2 = makeScriptedAsk(['Ternera guisada con patata y zanahoria']);
    const { restantes } = await annotateScaffold(fixturePath, ask2);
    expect(restantes).toEqual([]);
  });

  it('cada Dish completamente anotado (todos los campos respondidos) pasa validateDish real', async () => {
    const ask = makeScriptedAsk([
      'Pollo con arroz y brocoli', 'rotativo', 'false', 'media', '3', 'medio',
      'Ternera guisada con patata y zanahoria',
    ]);
    const { dishes } = await annotateScaffold(fixturePath, ask);
    for (const dish of dishes) {
      expect(validateDish(dish)).toBe(true);
    }
  });
});

describe('promptFor — mensajes de enum reflejan el esquema real (no hardcodeados)', () => {
  it('el prompt de rol/leftoverQuality/energiaCocina contiene los valores reales del enum', () => {
    expect(promptFor('rol')).toContain('ancla');
    expect(promptFor('rol')).toContain('rotativo');
    expect(promptFor('rol')).toContain('capricho');
    expect(promptFor('leftoverQuality')).toContain('alta');
    expect(promptFor('energiaCocina')).toContain('alto');
  });

  it('EDITORIAL_FIELDS son exactamente los 6 campos editoriales del esquema', () => {
    expect(EDITORIAL_FIELDS).toEqual(['nombre', 'rol', 'batchable', 'leftoverQuality', 'shelfLifeDays', 'energiaCocina']);
  });
});
