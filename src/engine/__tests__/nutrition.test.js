// ─── NUTRITIONAL ENGINE — REGRESSION TESTS ───────────────────────────────────
// Valores anclados a la verificación Phase 5 (git HEAD vs refactor, exact match).
// Perfiles: P1–P4.  Todos los valores son los capturados en la comparación real.

import { describe, it, expect } from 'vitest';
import {
  calcTDEE,
  calcTarget,
  calcMacros,
  computeStrategy,
  computeCheckinAdjustment,
  getAgeFromDOB,
} from '../nutrition.js';
import { adherenciaPct, computeTrend } from '../progress.js';

// ─── PERFILES DE REFERENCIA ───────────────────────────────────────────────────

const P1 = { gender:'male',   age:35, weight:90, height:180, activity:'moderate',  goal:'fatLoss',        kcalAdjust:0    };
const P2 = { gender:'female', age:28, weight:65, height:165, activity:'active',    goal:'maintain',       kcalAdjust:50   };
const P3 = { gender:'male',   age:22, weight:75, height:178, activity:'veryActive',goal:'muscleGain',     kcalAdjust:0    };
const P4 = { gender:'female', age:45, weight:80, height:160, activity:'sedentary', goal:'fatLossGeneral', kcalAdjust:-100 };

// ─── 1. calcTDEE ──────────────────────────────────────────────────────────────
describe('calcTDEE', () => {
  it('P1 male/35/90kg/180cm/moderate → 2875', () => {
    expect(calcTDEE(P1.gender, P1.age, P1.weight, P1.height, P1.activity)).toBe(2875);
  });
  it('P2 female/28/65kg/165cm/active → 2381', () => {
    expect(calcTDEE(P2.gender, P2.age, P2.weight, P2.height, P2.activity)).toBe(2381);
  });
  it('P3 male/22/75kg/178cm/veryActive → 3339', () => {
    expect(calcTDEE(P3.gender, P3.age, P3.weight, P3.height, P3.activity)).toBe(3339);
  });
  it('P4 female/45/80kg/160cm/sedentary → 1697', () => {
    expect(calcTDEE(P4.gender, P4.age, P4.weight, P4.height, P4.activity)).toBe(1697);
  });
});

// ─── 2. calcTarget ────────────────────────────────────────────────────────────
describe('calcTarget', () => {
  it('P1 fatLoss − 500 → 2375', () => {
    expect(calcTarget(2875, P1.goal, P1.kcalAdjust)).toBe(2375);
  });
  it('P2 maintain +50 kcalAdjust → 2431', () => {
    expect(calcTarget(2381, P2.goal, P2.kcalAdjust)).toBe(2431);
  });
  it('P3 muscleGain +400 → 3739', () => {
    expect(calcTarget(3339, P3.goal, P3.kcalAdjust)).toBe(3739);
  });
  it('P4 fatLossGeneral −350, floor capped to 1247 (edge case: min 1200 + adjust)', () => {
    // tdee=1697, GOAL_ADJ[fatLossGeneral]=-350, kcalAdjust=-100 → 1697-350-100=1247 (>=1200)
    expect(calcTarget(1697, P4.goal, P4.kcalAdjust)).toBe(1247);
  });
});

// ─── 3. computeStrategy ───────────────────────────────────────────────────────
describe('computeStrategy', () => {
  it('P1 fatLoss, hambre media → "definicion_flexible"', () => {
    expect(computeStrategy({ goal:'fatLoss', hambre:'media' })).toBe('definicion_flexible');
  });
  it('P1 fatLoss, hambre alta → "definicion_saciante"', () => {
    expect(computeStrategy({ goal:'fatLoss', hambre:'alta' })).toBe('definicion_saciante');
  });
  it('P2 maintain → "mantenimiento_equilibrado"', () => {
    expect(computeStrategy({ goal:'maintain' })).toBe('mantenimiento_equilibrado');
  });
  it('P3 muscleGain → "volumen_agresivo"', () => {
    expect(computeStrategy({ goal:'muscleGain' })).toBe('volumen_agresivo');
  });
  it('P4 fatLossGeneral → "fat_loss_general"', () => {
    expect(computeStrategy({ goal:'fatLossGeneral' })).toBe('fat_loss_general');
  });
  it('strategyOverride wins regardless of goal', () => {
    expect(computeStrategy({ goal:'fatLoss', strategyOverride:'volumen_limpio' })).toBe('volumen_limpio');
  });
  it('mildGain → "volumen_limpio"', () => {
    expect(computeStrategy({ goal:'mildGain' })).toBe('volumen_limpio');
  });
});

// ─── 4. calcMacros ────────────────────────────────────────────────────────────
describe('calcMacros', () => {
  it('P1 fatLoss/moderate/definicion_flexible → {protein:180,fat:72,carbs:252,proteinFactor:2,fatPct:27}', () => {
    const r = calcMacros(2375, 90, 'fatLoss', 'moderate', 'definicion_flexible');
    expect(r.protein).toBe(180);
    expect(r.fat).toBe(72);
    expect(r.carbs).toBe(252);
    expect(r.proteinFactor).toBe(2);
    expect(r.fatPct).toBe(27);
  });
  it('P2 maintain/active/mantenimiento_equilibrado → {protein:124,fat:76,carbs:313,proteinFactor:1.9,fatPct:28}', () => {
    const r = calcMacros(2431, 65, 'maintain', 'active', 'mantenimiento_equilibrado');
    expect(r.protein).toBe(124);
    expect(r.fat).toBe(76);
    expect(r.carbs).toBe(313);
    expect(r.proteinFactor).toBe(1.9);
    expect(r.fatPct).toBe(28);
  });
  it('P3 muscleGain/veryActive/volumen_agresivo → {protein:188,fat:133,carbs:448,proteinFactor:2.5,fatPct:32}', () => {
    const r = calcMacros(3739, 75, 'muscleGain', 'veryActive', 'volumen_agresivo');
    expect(r.protein).toBe(188);
    expect(r.fat).toBe(133);
    expect(r.carbs).toBe(448);
    expect(r.proteinFactor).toBe(2.5);
    expect(r.fatPct).toBe(32);
  });
  it('P4 edge case — carbs floored to 50, fat=64 (GOAL_ADJ floor)', () => {
    // kcal=1247 is very low → carbs = max(50, calculated) = 50
    const r = calcMacros(1247, 80, 'fatLossGeneral', 'sedentary', 'fat_loss_general');
    expect(r.protein).toBe(120);
    expect(r.fat).toBe(64);
    expect(r.carbs).toBe(50);          // <-- edge case: floor applied
    expect(r.proteinFactor).toBe(1.5);
    expect(r.fatPct).toBe(46);
  });
});

// ─── 5. computeCheckinAdjustment ─────────────────────────────────────────────
describe('computeCheckinAdjustment', () => {
  // P1 (fatLoss) × C1: sinCambio, adherencia:3, hambre:2, energia:3
  it('P1+C1 sinCambio → delta:-150, sin overrides', () => {
    const r = computeCheckinAdjustment(
      { pesoTrend:'sinCambio', adherencia:3, hambre:2, energia:3 },
      'fatLoss'
    );
    expect(r.delta).toBe(-150);
    expect(r.reasons).toEqual(['Peso estancado en déficit → −150 kcal']);
    expect(r.strategyOverride).toBeNull();
    expect(r.simpleMode).toBe(false);
  });

  // P1 (fatLoss) × C2: sube, adherencia:4, hambre:5, energia:2
  it('P1+C2 hambre alta + energía baja → delta:130, strategyOverride:definicion_saciante', () => {
    const r = computeCheckinAdjustment(
      { pesoTrend:'baja', adherencia:4, hambre:5, energia:2 },
      'fatLoss'
    );
    expect(r.delta).toBe(130);
    expect(r.reasons).toEqual([
      'Hambre alta → +50 kcal + Definición saciante (platos más voluminosos)',
      'Energía muy baja → +80 kcal en hidratos',
    ]);
    expect(r.strategyOverride).toBe('definicion_saciante');
    expect(r.simpleMode).toBe(false);
  });

  // P2 (maintain) × C1: baja, adherencia:3, hambre:2, energia:3 → no triggers
  it('P2+C1 maintain no triggers → delta:0', () => {
    const r = computeCheckinAdjustment(
      { pesoTrend:'baja', adherencia:3, hambre:2, energia:3 },
      'maintain'
    );
    expect(r.delta).toBe(0);
    expect(r.reasons).toEqual([]);
    expect(r.strategyOverride).toBeNull();
    expect(r.simpleMode).toBe(false);
  });

  // P2 (maintain) × C2: energia muy baja → +80
  it('P2+C2 energía muy baja → delta:80', () => {
    const r = computeCheckinAdjustment(
      { pesoTrend:'baja', adherencia:3, hambre:2, energia:2 },
      'maintain'
    );
    expect(r.delta).toBe(80);
    expect(r.reasons).toEqual(['Energía muy baja → +80 kcal en hidratos']);
    expect(r.strategyOverride).toBeNull();
    expect(r.simpleMode).toBe(false);
  });

  // Adherencia muy baja → simpleMode true
  it('adherencia<=1 en déficit → simpleMode:true + definicion_flexible', () => {
    const r = computeCheckinAdjustment(
      { pesoTrend:'baja', adherencia:1, hambre:2, energia:3 },
      'fatLoss'
    );
    expect(r.simpleMode).toBe(true);
    expect(r.strategyOverride).toBe('definicion_flexible');
  });

  // Volumen sin progreso + buena adherencia
  it('muscleGain + sinCambio + adherencia>=4 → +100 kcal extra', () => {
    const r = computeCheckinAdjustment(
      { pesoTrend:'sinCambio', adherencia:4, hambre:2, energia:3 },
      'muscleGain'
    );
    expect(r.delta).toBe(250); // +150 (vol sinCambio) + 100 (buena adh)
    expect(r.reasons).toContain('Peso estancado en volumen → +150 kcal');
    expect(r.reasons).toContain('Buena adherencia sin progreso → +100 kcal adicionales');
  });
});

// ─── 6. getAgeFromDOB ────────────────────────────────────────────────────────
describe('getAgeFromDOB', () => {
  const TODAY = new Date('2026-05-29');

  it('1989-05-01 → 37 (cumpleaños ya pasó este año)', () => {
    expect(getAgeFromDOB('1989-05-01', TODAY)).toBe(37);
  });
  it('1989-12-01 → 36 (cumpleaños aún no ha llegado este año)', () => {
    expect(getAgeFromDOB('1989-12-01', TODAY)).toBe(36);
  });
  it('dob inválido → 0', () => {
    expect(getAgeFromDOB('not-a-date', TODAY)).toBe(0);
  });
  it('dob vacío → 0', () => {
    expect(getAgeFromDOB('', TODAY)).toBe(0);
  });
  it('dob null → 0', () => {
    expect(getAgeFromDOB(null, TODAY)).toBe(0);
  });
  it('cumpleaños exactamente hoy → cuenta como ya cumplido', () => {
    expect(getAgeFromDOB('2000-05-29', TODAY)).toBe(26);
  });
});

// ─── 7. adherenciaPct ────────────────────────────────────────────────────────
describe('adherenciaPct', () => {
  it('4 días → 80%', () => {
    expect(adherenciaPct(4)).toBe(80);
  });
  it('5 (máximo) → 100%', () => {
    expect(adherenciaPct(5)).toBe(100);
  });
  it('0 (sin valor) → 60% (fallback n||3 → escala 1-5)', () => {
    // n||3 means missing/0 defaults to 3 → 60%
    expect(adherenciaPct(0)).toBe(60);
  });
  it('1 (mínimo) → 20%', () => {
    expect(adherenciaPct(1)).toBe(20);
  });
});

// ─── 8. computeTrend ─────────────────────────────────────────────────────────
// computeTrend(weeks) — cada elemento: { peso (actual), pesoInicial (inicio semana) }
// diff = last.peso − first.pesoInicial  |  weeks = nº de semanas con datos
describe('computeTrend', () => {
  it('P1: 2 semanas, bajada de 2.5 kg → {diff:-2.5, weeks:2}', () => {
    const weeks = [
      { peso: 92.5, pesoInicial: 92.5 },
      { peso: 90.0, pesoInicial: 92.5 },
    ];
    const r = computeTrend(weeks);
    expect(r.diff).toBeCloseTo(-2.5, 1);
    expect(r.weeks).toBe(2);
  });
  it('P2: 2 semanas, bajada de 1.2 kg → {diff:-1.2, weeks:2}', () => {
    const weeks = [
      { peso: 65.6, pesoInicial: 65.6 },
      { peso: 64.4, pesoInicial: 65.6 },
    ];
    const r = computeTrend(weeks);
    expect(r.diff).toBeCloseTo(-1.2, 1);
    expect(r.weeks).toBe(2);
  });
  it('sin registros (array vacío) → null', () => {
    expect(computeTrend([])).toBeNull();
  });
  it('un solo elemento → null (insuficiente)', () => {
    expect(computeTrend([{ peso:80, pesoInicial:80 }])).toBeNull();
  });
  it('sin campos peso/pesoInicial → null', () => {
    expect(computeTrend([{ foo:1 }, { foo:2 }])).toBeNull();
  });
});
