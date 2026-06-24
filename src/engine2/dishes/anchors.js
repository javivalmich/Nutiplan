// Catalogo de anclas — Fase 3, Checkpoint 2. Anotacion A MANO, contra la
// IDENTIDAD (comboIdentityKey, src/engine2/dishes/identity.js), no contra
// el combo crudo: si un ancla fuera dual (vive en mas de un pool del
// motor viejo), se anota UNA sola vez. Ninguna de las 6 de este catalogo
// es dual (verificado: 1 sola instancia cada una en todo el universo
// LUNCH_COMBOS+DINNER_COMBOS+TRAINING_DINNERS).
//
// Seleccion (CP2b, gate de batchability depurado + cobertura de eje,
// confirmada por Javi): 2 cremas frias, 3 legumbres (2 garbanzos por
// metodo distinto + 1 lentejas), 1 guiso de carne.
//
// Campos anotados aqui (R7: ASCII, R3: cero macros/nutricion):
//   rol             — siempre "ancla" en este catalogo.
//   batchable       — siempre true (es la razon de ser de la seleccion).
//   leftoverQuality — "baja" | "media" | "alta": como aguanta la sobra.
//   shelfLifeDays   — entero >= 0: dias seguros en nevera.
//   energiaCocina   — "bajo" | "medio" | "alto": esfuerzo/tiempo de cocina.
// NO se anota aqui: id, nombre, momento, tempFeel, plateType — esos son
// derivados (derive.js, CP1) o se asignan al ensamblar el Dish completo
// en CP3. Este catalogo es solo la anotacion manual contra la identidad.

import { comboIdentityKey } from './identity.js';

const cremaTomateHuevo = {
  tmpl: 'sopa_crema', P: 'huevo', C: null, V: 'tomate', cookM: 'crudo',
};
const cremaTomatePimientosAtun = {
  tmpl: 'sopa_crema', P: 'atun', C: null, V: 'tomate', V2: 'pimientos', cookM: 'crudo',
};
const lentejasArrozZanahoria = {
  tmpl: 'legumbre', P: 'lentejas', C: 'arroz', V: 'zanahoria', S: 'pimenton_ajo', cookM: 'guisado',
};
const garbanzosPimientosGuisados = {
  tmpl: 'legumbre', P: 'garbanzos', C: null, V: 'pimientos', S: 'pimenton_ajo', cookM: 'guisado',
};
const garbanzosBerenjenaSalteados = {
  tmpl: 'legumbre', P: 'garbanzos', C: null, V: 'berenjena', S: 'curry_ligero', cookM: 'salteado',
};
const terneraPatataZanahoria = {
  tmpl: 'caliente_clasico', P: 'ternera', C: 'patata', V: 'zanahoria', S: 'ajillo', cookM: 'guisado',
};

/**
 * Catalogo de anclas — Fase 3. Cada entrada anota a mano los 5 campos
 * editoriales del esquema de Plato (CP1) contra una identidad estable.
 */
export const ANCHORS = [
  {
    identityKey: comboIdentityKey(cremaTomateHuevo),
    rol: 'ancla',
    batchable: true,
    // Servicio en frio: no hay degradacion por recalentado (no se
    // recalienta nunca). Aguanta muy bien en nevera mientras se sirva fria.
    leftoverQuality: 'alta',
    // Crema CRUDA de tomate (sin coccion que reduzca carga microbiana):
    // vida util de nevera mas corta que un guiso cocido. 3 dias, no 4.
    shelfLifeDays: 3,
    // crudo: sin coccion, solo triturar — minimo esfuerzo.
    energiaCocina: 'bajo',
  },
  {
    identityKey: comboIdentityKey(cremaTomatePimientosAtun),
    rol: 'ancla',
    batchable: true,
    // A diferencia de #1 (huevo), el pescado en una preparacion cruda y
    // fria SI se nota al segundo dia (textura/sabor se degradan antes
    // que el huevo) — no mejora reposando. Por eso baja a "media" en vez
    // de "alta" como #1.
    leftoverQuality: 'media',
    // Pescado crudo en frio acorta la vida util respecto a #1 (huevo):
    // estrictamente menor, 2 dias en vez de 3.
    shelfLifeDays: 2,
    energiaCocina: 'bajo',
  },
  {
    identityKey: comboIdentityKey(lentejasArrozZanahoria),
    rol: 'ancla',
    batchable: true,
    // Legumbre guisada: clasico de tupper, mejora de un dia para otro.
    leftoverQuality: 'alta',
    shelfLifeDays: 4,
    // guisado: coccion larga a fuego lento — esfuerzo medio (vigilancia,
    // no preparacion compleja).
    energiaCocina: 'medio',
  },
  {
    identityKey: comboIdentityKey(garbanzosPimientosGuisados),
    rol: 'ancla',
    batchable: true,
    leftoverQuality: 'alta',
    shelfLifeDays: 4,
    energiaCocina: 'medio',
  },
  {
    identityKey: comboIdentityKey(garbanzosBerenjenaSalteados),
    rol: 'ancla',
    batchable: true,
    // Salteado: textura de la verdura se resiente algo mas al recalentar
    // que un guisado, pero sigue siendo una sobra razonable.
    leftoverQuality: 'media',
    shelfLifeDays: 3,
    // salteado: coccion rapida, menos vigilancia que un guisado.
    energiaCocina: 'bajo',
  },
  {
    identityKey: comboIdentityKey(terneraPatataZanahoria),
    rol: 'ancla',
    batchable: true,
    // Guiso de carne clasico: la sobra es, si acaso, mejor que el dia 1.
    leftoverQuality: 'alta',
    shelfLifeDays: 4,
    // guisado de carne: dorado + coccion larga — mas pasos y tiempo que
    // un guisado de legumbre.
    energiaCocina: 'alto',
  },
];
