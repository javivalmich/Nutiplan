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
  deriveTituloSugerido,
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

  it('(c) si el usuario NO responde un campo SIN sugerencia (respuesta vacia), ese campo SIGUE "TODO" — no se decide solo. "nombre" es la excepcion: SI tiene sugerencia, asi que Enter la confirma (ver bloque dedicado de discriminacion del invariante mas abajo)', async () => {
    const ask = makeScriptedAsk([
      '', // nombre del plato normal: Enter -> CONFIRMA la sugerencia (no es "sin responder")
      '', // rol: sin responder (rol no tiene sugerencia)
      'false',
      'media',
      '3',
      'medio',
      '', // nombre del ancla: Enter -> CONFIRMA la sugerencia
    ]);

    const { dishes, restantes } = await annotateScaffold(fixturePath, ask);

    const platoNormal = dishes.find((d) => d.id.includes('pollo'));
    expect(platoNormal.rol).toBe('TODO'); // sigue TODO: el usuario no respondio (sin sugerencia)
    expect(platoNormal.nombre).toBe('Pollo con arroz y brócoli a la plancha'); // Enter confirmo la sugerencia
    expect(platoNormal.batchable).toBe(false); // este SI se respondio

    const ancla = dishes.find((d) => d.id.includes('ternera'));
    expect(ancla.nombre).toBe('Ternera con patata y zanahoria guisado'); // Enter confirmo la sugerencia

    expect(restantes.length).toBeGreaterThan(0);
    expect(restantes).toEqual([{ id: platoNormal.id, field: 'rol' }]);
  });

  it('escritura incremental y resumible: tras una pasada parcial (sale antes de llegar al ancla), releer el fixture en disco refleja lo ya respondido y deja el resto en TODO', async () => {
    // Solo 6 respuestas: cubren el plato normal completo. Al llegar al
    // ancla (nombre pendiente), makeScriptedAsk se queda sin respuestas y
    // lanza -- simula que Javi sale a mitad de la pasada.
    const ask = makeScriptedAsk(['Pollo con arroz', 'rotativo', 'false', 'media', '3', 'medio']);
    await annotateScaffold(fixturePath, ask).catch(() => {});

    const enDisco = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
    const platoNormal = enDisco.find((d) => d.id.includes('pollo'));
    expect(platoNormal.rol).toBe('rotativo'); // persistido en disco, no solo en memoria
    expect(platoNormal.nombre).toBe('Pollo con arroz');

    const anclaParcial = enDisco.find((d) => d.id.includes('ternera'));
    expect(anclaParcial.nombre).toBe('TODO'); // nunca se llego a preguntar: sigue TODO

    // Segunda pasada (resumible): retoma justo en el ancla, sin
    // re-preguntar nada del plato normal (ya completo, se salta).
    const ask2 = makeScriptedAsk(['']); // Enter -> confirma la sugerencia derivada
    const { restantes } = await annotateScaffold(fixturePath, ask2);
    expect(restantes).toEqual([]);

    const final = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
    expect(final.find((d) => d.id.includes('ternera')).nombre).toBe('Ternera con patata y zanahoria guisado');
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

describe('deriveTituloSugerido — derivacion pura desde la tupla de identidad (dish.id)', () => {
  it('es determinista: misma tupla -> mismo titulo en 2 llamadas', () => {
    const dish = { id: '["caliente_clasico","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]' };
    const a = deriveTituloSugerido(dish);
    const b = deriveTituloSugerido(dish);
    expect(a).toEqual(b);
  });

  it('caso CON C (carbohidrato presente)', () => {
    const dish = { id: '["caliente_clasico","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]' };
    expect(deriveTituloSugerido(dish).titulo).toBe('Pollo con arroz y brócoli a la plancha');
  });

  it('caso SIN C (C=null)', () => {
    const dish = { id: '["caliente_clasico","pollo",null,"brocoli",null,"limon_hierbas","plancha"]' };
    expect(deriveTituloSugerido(dish).titulo).toBe('Pollo con brócoli a la plancha');
  });

  it('caso CON V2 (dos verduras encadenadas)', () => {
    const dish = { id: '["caliente_clasico","pollo",null,"brocoli","pimientos","limon_hierbas","plancha"]' };
    expect(deriveTituloSugerido(dish).titulo).toBe('Pollo con brócoli y pimientos a la plancha');
  });

  it('slug SIN mapeo conocido: se incluye crudo en el titulo y se reporta en slugsSinMapear (no peta, no inventa tilde)', () => {
    const dish = { id: '["x","pollo",null,"kale_morado",null,"ajillo","plancha"]' };
    const { titulo, slugsSinMapear } = deriveTituloSugerido(dish);
    expect(titulo).toBe('Pollo con kale_morado a la plancha');
    expect(slugsSinMapear).toEqual(['kale_morado']);
  });
});

describe('DISCRIMINACION DEL INVARIANTE (las 3 caras): la sugerencia de nombre NUNCA se auto-escribe sin confirmacion', () => {
  it('CARA 1 — Enter (respuesta vacia) -> nombre = la sugerencia derivada, confirmada explicitamente', async () => {
    const ask = makeScriptedAsk(['', 'rotativo', 'false', 'media', '3', 'medio', '']);
    const { dishes } = await annotateScaffold(fixturePath, ask);
    const platoNormal = dishes.find((d) => d.id.includes('pollo'));
    expect(platoNormal.nombre).toBe('Pollo con arroz y brócoli a la plancha');
    expect(platoNormal.nombre).not.toBe('TODO');
  });

  it('CARA 2 — texto del usuario -> nombre = el texto, NO la sugerencia', async () => {
    const ask = makeScriptedAsk(['Pollo casero de mi receta', 'rotativo', 'false', 'media', '3', 'medio', 'Ternera de mi receta']);
    const { dishes } = await annotateScaffold(fixturePath, ask);
    const platoNormal = dishes.find((d) => d.id.includes('pollo'));
    expect(platoNormal.nombre).toBe('Pollo casero de mi receta');
    expect(platoNormal.nombre).not.toBe('Pollo con arroz y brócoli a la plancha'); // no la sugerencia
  });

  it('CARA 3 — el usuario sale ANTES de llegar a "nombre" -> el campo SIGUE "TODO" (la sugerencia nunca se auto-escribe sin que se le muestre y conteste)', async () => {
    // 0 respuestas: el primer campo pendiente del primer plato CON algun
    // TODO es "nombre" (EDITORIAL_FIELDS[0]) -> ask() se llama y lanza de
    // inmediato, antes de que exista ninguna respuesta (ni Enter ni texto).
    const ask = makeScriptedAsk([]);
    await annotateScaffold(fixturePath, ask).catch(() => {});

    const enDisco = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
    const platoNormal = enDisco.find((d) => d.id.includes('pollo'));
    expect(platoNormal.nombre).toBe('TODO'); // nunca se le pregunto: sigue TODO, no se decidio nada
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
