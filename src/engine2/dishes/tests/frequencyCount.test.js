// Fase 2, Paso B.1, Parte 2: conteo de frecuencia de platos legacy
// servidos en las snapshots congeladas. La logica vive en
// scripts/phaseB1/frequencyCount.js (fuera de engine2/, importa solo
// comboIdentityKey real, sin replicar logica de identidad).

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { comboIdentityKey } from '../identity.js';
import { loadUniverse } from '../../../../scripts/phaseB1/loadUniverse.js';
import {
  discoverMealSnapshots,
  extractLegacyMeals,
  extractAllMeals,
  countFreeformOccurrencesRaw,
  buildFrequencyRanking,
} from '../../../../scripts/phaseB1/frequencyCount.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, '../../../..', 'src');

const discovery = discoverMealSnapshots(SRC_ROOT);
const { relevant, skipped, parseErrors } = discovery;

describe('1. Descubrimiento de snapshots (sin listas hardcodeadas)', () => {
  it('no hay errores de parseo bloqueantes sobre archivos relevantes', () => {
    expect(parseErrors).toEqual([]);
  });

  it('descubre al menos 1 snapshot relevante (con _spec.tmpl)', () => {
    expect(relevant.length).toBeGreaterThan(0);
  });

  it('reporta rutas y nº de escenarios por snapshot relevante (informativo)', () => {
    // eslint-disable-next-line no-console
    console.log('[discovery] relevantes:', relevant.map((r) => `${r.path} -> ${r.scenarios.length} escenario(s)`));
    // eslint-disable-next-line no-console
    console.log('[discovery] descartadas:', skipped.map((s) => `${s.path} -- ${s.reason}`));
    for (const r of relevant) {
      expect(typeof r.path).toBe('string');
      expect(r.scenarios.length).toBeGreaterThan(0);
    }
  });

  it('comparacion DESCRIPTIVA (no normativa) con la referencia historica 9+1 escenarios', () => {
    const totalEscenarios = relevant.reduce((sum, r) => sum + r.scenarios.length, 0);
    const coincideConHistorico = totalEscenarios === 10 && relevant.length === 2;
    // eslint-disable-next-line no-console
    console.log(
      `[discovery] total escenarios=${totalEscenarios} (referencia historica opcional: 9+1=10). ` +
      `Coincide: ${coincideConHistorico}`
    );
    // No se aborta ni se exige igualdad: es solo una nota descriptiva.
    expect(typeof coincideConHistorico).toBe('boolean');
  });
});

describe('2. Clave de conteo (usa comboIdentityKey real, sin logica manual)', () => {
  const legacyMeals = extractLegacyMeals(relevant);

  it('todo meal extraido tiene _spec.tmpl (el filtro funciona)', () => {
    expect(legacyMeals.length).toBeGreaterThan(0);
    for (const m of legacyMeals) expect(m._spec.tmpl).toBeTruthy();
  });

  it('comboIdentityKey real reconstruye una identidad valida (string JSON de 7 elementos) para cada meal', () => {
    for (const m of legacyMeals.slice(0, 5)) {
      const key = comboIdentityKey(m._spec);
      const parsed = JSON.parse(key);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(7);
    }
  });
});

describe('3. FREEFORM — verificacion redundante de consistencia (no es decision nueva)', () => {
  it('0 ocurrencias textuales de "freeForm" en TODOS los .snap descubiertos (confirmado, redundante con Paso A)', () => {
    const occurrences = countFreeformOccurrencesRaw(SRC_ROOT);
    const total = occurrences.reduce((sum, o) => sum + o.occurrences, 0);
    // eslint-disable-next-line no-console
    console.log('[freeform check]', JSON.stringify(occurrences));
    expect(total).toBe(0);
  });

  it('ningun meal (de cualquier tipo, no solo legacy) tiene forma freeForm (identity.id presente, _spec ausente)', () => {
    const allMeals = extractAllMeals(relevant);
    const freeformShaped = allMeals.filter((m) => m.freeForm === true || (m.identity && m.identity.id));
    expect(freeformShaped).toEqual([]);
  });
});

describe('4. Ranking de frecuencia (orden descendente, desempate lexicografico estricto)', () => {
  const legacyMeals = extractLegacyMeals(relevant);
  const ranking = buildFrequencyRanking(legacyMeals, comboIdentityKey);

  it('el ranking esta ordenado: descendente por count, empates en orden lexicografico estricto de identityKey', () => {
    for (let i = 1; i < ranking.length; i++) {
      const prev = ranking[i - 1];
      const curr = ranking[i];
      if (prev.count === curr.count) {
        expect(prev.identityKey < curr.identityKey).toBe(true);
      } else {
        expect(prev.count).toBeGreaterThan(curr.count);
      }
    }
  });

  it('top-30 (informativo)', () => {
    // eslint-disable-next-line no-console
    console.log('[top-30]', JSON.stringify(ranking.slice(0, 30), null, 2));
    expect(ranking.length).toBeGreaterThan(0);
  });
});

describe('5. Conservacion (OBLIGATORIO): Σ apariciones == nº de meals con _spec.tmpl', () => {
  it('la suma de counts del ranking es exactamente igual al nº de meals legacy extraidos', () => {
    const legacyMeals = extractLegacyMeals(relevant);
    const ranking = buildFrequencyRanking(legacyMeals, comboIdentityKey);
    const sumaRanking = ranking.reduce((sum, r) => sum + r.count, 0);
    expect(sumaRanking).toBe(legacyMeals.length);
  });
});

describe('6. Reproducibilidad POR REGLA (no solo repetible) — OBLIGATORIO', () => {
  const legacyMeals = extractLegacyMeals(relevant);

  function shuffle(array, seed) {
    // Fisher-Yates con PRNG determinista sembrado (no Math.random: la
    // baraja debe ser reproducible para que el test sea estable, pero
    // SI debe reordenar realmente la entrada).
    let s = seed;
    function next() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    }
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  it('orden natural vs entrada barajada producen el MISMO ranking byte a byte (incluido el orden de empatados)', () => {
    const rankingNatural = buildFrequencyRanking(legacyMeals, comboIdentityKey);
    const mealsBarajados = shuffle(legacyMeals, 42);
    const rankingBarajado = buildFrequencyRanking(mealsBarajados, comboIdentityKey);

    expect(JSON.stringify(rankingBarajado)).toBe(JSON.stringify(rankingNatural));
  });

  it('barajar con una semilla DISTINTA tambien produce el mismo ranking (no es casualidad de una sola baraja)', () => {
    const rankingNatural = buildFrequencyRanking(legacyMeals, comboIdentityKey);
    const mealsBarajados2 = shuffle(legacyMeals, 999);
    const rankingBarajado2 = buildFrequencyRanking(mealsBarajados2, comboIdentityKey);

    expect(JSON.stringify(rankingBarajado2)).toBe(JSON.stringify(rankingNatural));
  });

  it('DISCRIMINACION: sustituir el desempate lexicografico por "orden de primera aparicion" SI cambia el resultado con entrada barajada', () => {
    // Implementacion alternativa deliberadamente mas debil: desempate por
    // orden de insercion (Map conserva la primera vez que se vio la
    // clave), NO por orden lexicografico de identityKey.
    function buildRankingPorOrdenDeInsercion(meals) {
      const counts = new Map();
      for (const meal of meals) {
        const key = comboIdentityKey(meal._spec);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      // Sin comparador de desempate: Array.prototype.sort es estable, asi
      // que los empates conservan el orden de iteracion del Map (= orden
      // de primera aparicion en la entrada).
      return [...counts.entries()]
        .map(([identityKey, count]) => ({ identityKey, count }))
        .sort((a, b) => b.count - a.count);
    }

    const rankingNaturalPorInsercion = buildRankingPorOrdenDeInsercion(legacyMeals);
    const mealsBarajados = shuffle(legacyMeals, 7);
    const rankingBarajadoPorInsercion = buildRankingPorOrdenDeInsercion(mealsBarajados);

    // Con la entrada barajada, el orden de PRIMERA APARICION de cada
    // identityKey cambia -> el desempate por insercion DEBE producir un
    // orden distinto entre empatados en al menos un caso. Si esto fuera
    // igual, el control no discriminaria.
    expect(JSON.stringify(rankingBarajadoPorInsercion)).not.toBe(JSON.stringify(rankingNaturalPorInsercion));

    // Revertido (desempate lexicografico real, la funcion del repo): el
    // ranking SI vuelve a ser identico pase lo que pase con el orden de
    // entrada — confirmado en los 2 tests anteriores de esta seccion.
    const rankingNaturalReal = buildFrequencyRanking(legacyMeals, comboIdentityKey);
    const rankingBarajadoReal = buildFrequencyRanking(shuffle(legacyMeals, 7), comboIdentityKey);
    expect(JSON.stringify(rankingBarajadoReal)).toBe(JSON.stringify(rankingNaturalReal));
  });
});

describe('7. Cobertura del universo (observacion, no decision)', () => {
  it('reporta servidos vs frecuencia-0 por origen (LUNCH/DINNER/TRAINING)', () => {
    const universe = loadUniverse();
    const legacyMeals = extractLegacyMeals(relevant);
    const ranking = buildFrequencyRanking(legacyMeals, comboIdentityKey);
    const servedKeys = new Set(ranking.map((r) => r.identityKey));

    const porOrigen = {
      LUNCH: universe.LUNCH_COMBOS_RAW,
      DINNER: universe.DINNER_COMBOS_RAW,
      TRAINING: universe.TRAINING_DINNERS_RAW,
    };

    const reporte = {};
    for (const [origen, combos] of Object.entries(porOrigen)) {
      const keys = combos.map(comboIdentityKey);
      const servidos = keys.filter((k) => servedKeys.has(k));
      const noServidos = keys.filter((k) => !servedKeys.has(k));
      reporte[origen] = { total: keys.length, servidos: servidos.length, frecuenciaCero: noServidos.length };
    }

    // eslint-disable-next-line no-console
    console.log('[cobertura universo]', JSON.stringify(reporte, null, 2));

    for (const origen of Object.keys(porOrigen)) {
      expect(reporte[origen].servidos + reporte[origen].frecuenciaCero).toBe(reporte[origen].total);
    }
  });
});

describe('8. FREEFORM summary (coincide con la verificacion de la seccion 3)', () => {
  it('nº de freeform observados en snapshots == 0, consistente con la seccion 3', () => {
    const allMeals = extractAllMeals(relevant);
    const freeformCount = allMeals.filter((m) => m.freeForm === true).length;
    expect(freeformCount).toBe(0);
  });
});
