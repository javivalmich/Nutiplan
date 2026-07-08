// Vocabulario cerrado de verdura (D-028, C7) — 32 ejes. Cargado desde
// verduraVocabulary.json, versionado (C3: version !== 1 -> throw, sin
// fallback silencioso, mismo trato que el lateral de confirmaciones).
//
// CRITERIO DE DOMINIO (ratificado, rige casos futuros): función culinaria
// en el plato por encima de botánica; coherencia entre ingredientes
// análogos por encima de precisión individual. Los ejes son convenciones
// léxicas de este proyecto, NO afirmaciones botánicas. Causas por caso:
// - maiz: entra porque su uso predominante en este catálogo (grano dulce
//   en ensalada/salteado) cumple función de verdura. La tortilla/harina de
//   maíz sería cereal -- el vocabulario clasifica por uso dominante del
//   token; la Leyenda del cuaderno instruye al cocinero a no contar el
//   maíz-tortilla.
// - edamame: entra por coherencia con "guisantes" (ya en canon) -- misma
//   función culinaria (legumbre fresca de vaina).
// - setas: eje propio (hongo, no hortaliza; perfil y papel en plato
//   distintos de champiñones, que queda como eje separado).
// - FUERA con causa de dominio (exclusiones definitivas, no deuda):
//   aceitunas (condimento), pepinillos (encurtido), chile/guindilla
//   (picante).
// - mezclum: NO es eje. Colapsa por instrucción de la Leyenda hacia
//   "lechuga" (representa "hojas de ensalada", no estrictamente lechuga).
//   Sin mecanismo de alias en v1 -- deuda de diseño para v2.
//
// Orden alfabético global de los 32 ejes en el JSON (no agrupado por
// procedencia scaffold/freeform/dominio) -- diffs estables, C10-friendly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const VERDURA_VOCABULARY_PATH = path.resolve(__dirname, './verduraVocabulary.json');

/** Lanzada por loadVerduraVocabulary cuando version !== 1 (C3). */
export class VerduraVocabularyVersionError extends Error {}

/**
 * Carga y valida el vocabulario cerrado de verdura.
 * @param {string} [vocabPath]
 * @returns {{version: number, ejes: ReadonlyArray<string>, ejesSet: ReadonlySet<string>}}
 */
export function loadVerduraVocabulary(vocabPath = VERDURA_VOCABULARY_PATH) {
  const raw = fs.readFileSync(vocabPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (parsed.version !== 1) {
    throw new VerduraVocabularyVersionError(
      `verduraVocabulary: version "${parsed.version}" no soportada (se esperaba 1).`
    );
  }
  const ejes = Object.freeze([...parsed.ejes]);
  const ejesSet = new Set(ejes);
  return Object.freeze({ version: parsed.version, ejes, ejesSet: Object.freeze(ejesSet) });
}
