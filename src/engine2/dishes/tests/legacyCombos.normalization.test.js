// Fase 2, Paso B.1 (correccion) — invariante de PARIDAD REAL de
// legacyCombos.data.js, no de "el motor viejo no cambio".
//
// HALLAZGO del invariante anterior (version por hash SHA-256 de
// buildPlan.js y los snapshots dorados): legacyCombos.data.js no es
// importado por buildPlan.js ni por su suite de snapshots, asi que esos
// hashes son INMUNES a cualquier cambio en la copia — el test pasaba por
// construccion, no discriminaba nada. Sustituido por este invariante.
//
// La pregunta correcta: ¿la copia normalizada es EXACTAMENTE el literal
// vivo de buildPlan.js, salvo las normalizaciones documentadas en
// legacyCombos.normalizations.js? Dos partes:
//
//   1. ACOTACION: re-extrae el array literal real de buildPlan.js (mismos
//      marcadores de texto que Control 2 de paridad), le aplica
//      PROGRAMATICAMENTE las normalizaciones declaradas, y exige
//      IGUALDAD ESTRUCTURAL EXACTA con el export correspondiente de
//      legacyCombos.data.js. Cualquier diferencia no cubierta por una
//      normalizacion documentada -> FALLA.
//
//   2. DISCRIMINACION: (a) inyectar una entrada fantasma en la copia ->
//      debe detectarse: rojo. (b) mutar temporalmente el valorElegido
//      declarado -> debe dejar de cuadrar: rojo. Revertir ambos -> verde.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { comboIdentityKey } from '../identity.js';
import {
  LUNCH_COMBOS_RAW,
  DINNER_COMBOS_RAW,
  TRAINING_DINNERS_RAW,
} from '../legacyCombos.data.js';
import { NORMALIZATIONS } from '../legacyCombos.normalizations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const BUILD_PLAN_PATH = path.join(REPO_ROOT, 'src/engine/buildPlan.js');

// ── Extraccion del literal VIVO de buildPlan.js como datos reales (no solo conteo) ──

function extractLiveLiteralArray(sourceText, startMarker, endMarker) {
  const startIdx = sourceText.indexOf(startMarker);
  if (startIdx === -1) throw new Error(`Marcador de inicio no encontrado: "${startMarker}"`);
  const contentStart = startIdx + startMarker.length;
  const endIdx = sourceText.indexOf(endMarker, contentStart);
  if (endIdx === -1) throw new Error(`Marcador de fin no encontrado: "${endMarker}"`);
  const segment = sourceText.slice(contentStart, endIdx);
  // eslint-disable-next-line no-new-func
  return new Function(`return [${segment}];`)();
}

// ── Aplicacion programatica de las normalizaciones declaradas ──────────

/**
 * Colapsa, en orden, los grupos de identidad cubiertos por una
 * normalizacion declarada: conserva la PRIMERA aparicion (con el campo
 * divergente sobreescrito al valorElegido) y descarta apariciones
 * posteriores del mismo identityKey. Combos sin normalizacion pasan
 * intactos.
 * @param {object[]} liveArray
 * @param {object[]} normalizations
 * @param {string} origen
 * @returns {object[]}
 */
function applyNormalizations(liveArray, normalizations, origen) {
  const relevantByKey = new Map(
    normalizations.filter((n) => n.origen === origen).map((n) => [n.identityKey, n])
  );
  const yaColapsado = new Set();
  const result = [];

  for (const combo of liveArray) {
    const key = comboIdentityKey(combo);
    const norm = relevantByKey.get(key);
    if (!norm) {
      result.push(combo);
      continue;
    }
    if (yaColapsado.has(key)) continue; // descarta apariciones posteriores ya colapsadas
    yaColapsado.add(key);
    result.push({ ...combo, [norm.campoDivergente]: norm.valorElegido });
  }
  return result;
}

const buildPlanSource = fs.readFileSync(BUILD_PLAN_PATH, 'utf-8');

const liveLunch = extractLiveLiteralArray(buildPlanSource, 'const LUNCH_COMBOS = [', '\n  ].filter(function(m){');
const liveDinner = extractLiveLiteralArray(buildPlanSource, 'const DINNER_COMBOS = [', '\n  ].filter(function(m){');
const liveTraining = extractLiveLiteralArray(buildPlanSource, 'const TRAINING_DINNERS = [', '\n  ];');

describe('invariante de paridad real: copia normalizada === literal vivo + normalizaciones declaradas', () => {
  it('precondicion: el literal vivo de buildPlan.js tiene la cardinalidad esperada (101/81/3)', () => {
    expect(liveLunch.length).toBe(101);
    expect(liveDinner.length).toBe(81);
    expect(liveTraining.length).toBe(3);
  });

  it('LUNCH_COMBOS_RAW === literal vivo (sin normalizaciones declaradas en este origen)', () => {
    const normalizado = applyNormalizations(liveLunch, NORMALIZATIONS, 'LUNCH_COMBOS_RAW');
    expect(LUNCH_COMBOS_RAW).toEqual(normalizado);
  });

  it('DINNER_COMBOS_RAW === literal vivo + NORMALIZACION #1 aplicada (cerdo+brocoli -> density "baja")', () => {
    const normalizado = applyNormalizations(liveDinner, NORMALIZATIONS, 'DINNER_COMBOS_RAW');
    expect(normalizado.length).toBe(80); // 81 vivos - 1 colapsada
    expect(DINNER_COMBOS_RAW).toEqual(normalizado);
  });

  it('TRAINING_DINNERS_RAW === literal vivo (sin normalizaciones declaradas en este origen)', () => {
    const normalizado = applyNormalizations(liveTraining, NORMALIZATIONS, 'TRAINING_DINNERS_RAW');
    expect(TRAINING_DINNERS_RAW).toEqual(normalizado);
  });
});

describe('ACOTACION — discriminacion: una entrada fantasma en la copia DEBE detectarse', () => {
  it('inyectar una entrada extra en la copia (simulada) rompe la igualdad; sin ella, cuadra', () => {
    const normalizado = applyNormalizations(liveLunch, NORMALIZATIONS, 'LUNCH_COMBOS_RAW');

    const copiaConFantasma = [...LUNCH_COMBOS_RAW, { tmpl: 'fantasma', P: 'x', C: null, V: 'y', S: 'z', cookM: 'plancha', plateType: 'a', density: 'media', familiar: true, facil: true }];
    expect(copiaConFantasma).not.toEqual(normalizado);

    // Sin la entrada fantasma (la copia real), SI cuadra.
    expect(LUNCH_COMBOS_RAW).toEqual(normalizado);
  });

  it('un campo de mas (no documentado) en una entrada de la copia tambien rompe la igualdad', () => {
    const normalizado = applyNormalizations(liveDinner, NORMALIZATIONS, 'DINNER_COMBOS_RAW');

    const copiaConCampoExtra = DINNER_COMBOS_RAW.map((c, i) => (i === 0 ? { ...c, campoNoDocumentado: true } : c));
    expect(copiaConCampoExtra).not.toEqual(normalizado);

    expect(DINNER_COMBOS_RAW).toEqual(normalizado);
  });
});

describe('DISCRIMINACION — mutar temporalmente el valorElegido declarado debe romper la igualdad', () => {
  it('si la normalizacion declarada dijera "media" en vez de "baja", la copia real (que tiene "baja") dejaria de cuadrar', () => {
    const normalizacionMutada = NORMALIZATIONS.map((n) =>
      n.origen === 'DINNER_COMBOS_RAW' ? { ...n, valorElegido: 'media' } : n
    );

    const normalizadoConMutacion = applyNormalizations(liveDinner, normalizacionMutada, 'DINNER_COMBOS_RAW');
    expect(DINNER_COMBOS_RAW).not.toEqual(normalizadoConMutacion);

    // Revertido (normalizacion real, sin mutar): vuelve a cuadrar.
    const normalizadoReal = applyNormalizations(liveDinner, NORMALIZATIONS, 'DINNER_COMBOS_RAW');
    expect(DINNER_COMBOS_RAW).toEqual(normalizadoReal);
  });
});
