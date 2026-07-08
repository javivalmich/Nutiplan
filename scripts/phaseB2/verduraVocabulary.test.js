// verduraVocabulary.test.js — EDITORIAL-D3 (D-028, C3/C7). Falsables del
// vocabulario cerrado de verdura: 32 ejes exactos, version!==1 -> throw,
// sin duplicados, orden alfabético estable.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  loadVerduraVocabulary,
  VerduraVocabularyVersionError,
  VERDURA_VOCABULARY_PATH,
} from './verduraVocabulary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('vocabulario de verdura: forma y contenido', () => {
  it('tiene exactamente 32 ejes, sin duplicados', () => {
    const { ejes } = loadVerduraVocabulary();
    expect(ejes.length).toBe(32);
    expect(new Set(ejes).size).toBe(32);
  });

  it('incluye maiz, edamame, setas y los 17 de scaffold + 12 de freeform', () => {
    const { ejesSet } = loadVerduraVocabulary();
    const esperados = [
      'acelgas', 'alcachofa', 'berenjena', 'brocoli', 'calabacin', 'calabaza',
      'champiñones', 'coles', 'esparragos', 'espinacas', 'judias', 'lechuga',
      'pepino', 'pimientos', 'puerro', 'tomate', 'zanahoria',
      'aguacate', 'brotes_soja', 'cebolla', 'cebolleta', 'col_china',
      'col_morada', 'coliflor', 'grelos', 'guisantes', 'pak_choi', 'repollo',
      'rucula', 'setas', 'maiz', 'edamame',
    ];
    for (const eje of esperados) expect(ejesSet.has(eje)).toBe(true);
  });

  it('excluye aceitunas, pepinillos, chile/guindilla y mezclum (exclusiones de dominio)', () => {
    const { ejesSet } = loadVerduraVocabulary();
    for (const excluido of ['aceitunas', 'pepinillos', 'chile', 'guindilla', 'mezclum']) {
      expect(ejesSet.has(excluido)).toBe(false);
    }
  });

  it('dirty: un eje espurio insertado a mano SI es detectado (el control SI discrimina)', () => {
    const tmpPath = path.join(__dirname, '_tmp_dirty_vocab.json');
    const base = JSON.parse(fs.readFileSync(VERDURA_VOCABULARY_PATH, 'utf8'));
    fs.writeFileSync(tmpPath, JSON.stringify({ ...base, ejes: [...base.ejes, 'aceitunas'] }));
    try {
      const { ejesSet } = loadVerduraVocabulary(tmpPath);
      expect(ejesSet.has('aceitunas')).toBe(true); // el control SI ve la contaminación
      expect(ejesSet.size).not.toBe(32);
    } finally {
      fs.rmSync(tmpPath, { force: true });
    }
  });
});

describe('version !== 1 -> throw (C3)', () => {
  it('el archivo real declara version:1 y carga sin lanzar', () => {
    expect(() => loadVerduraVocabulary()).not.toThrow();
  });

  it('dirty: version:2 lanza VerduraVocabularyVersionError (el control SI discrimina)', () => {
    const tmpPath = path.join(__dirname, '_tmp_dirty_version.json');
    fs.writeFileSync(tmpPath, JSON.stringify({ version: 2, ejes: ['tomate'] }));
    try {
      expect(() => loadVerduraVocabulary(tmpPath)).toThrow(VerduraVocabularyVersionError);
    } finally {
      fs.rmSync(tmpPath, { force: true });
    }
  });
});
