// BUG 3 + BUG 6 (Fase 1, Checkpoint 3) — TRAINING_DINNERS.
//
// BUG 3: la rama de cena de entreno (isTrain(day)) registraba siempre
// usedD.push("pollo")/usedDPlate.push("caliente_arroz")/recordMeal("pollo",
// "caliente_arroz",...) sin mirar el td real elegido (TRAINING_DINNERS[idx]),
// que rota entre pollo/ternera/pavo. Esto inflaba weeklyProteinCount.ave de
// forma fantasma cuando la cena real era de pollo/pavo, y además ocultaba
// por completo el consumo real de ternera (familia "vacuno", CULINARY_FAMILY
// buildPlan.js:165-171), que nunca se contaba.
//
// BUG 6: TRAINING_DINNERS usaba slot:"Cena 🏋️", que no coincide con la
// comparación slot==="Cena" de composeMeal (buildPlan.js:446), así que la
// cena de entreno quedaba etiquetada time:"Desayuno".
//
// Fix: slot:"Cena" en origen (el emoji 🏋️ viaja vía day.special, no vía
// slot) + registro con td.P/td.plateType reales en vez de literales.

import { describe, it, expect, vi } from 'vitest';
import { buildPlan } from '../buildPlan.js';

function buildWithTrainingDays(trainingDays, weekNumber) {
  const profile = {
    weight: 80,
    goal: 'mildGain',
    activity: 'moderate',
    intolerances: [],
    trainingDays,
    extras: {},
    mealsPerDay: 3,
    tiempoCocina: 'normal',
    experiencia: 'intermedio',
    simpleMode: false,
    dob: '1990-01-01',
    gender: 'male',
    height: 178,
  };
  return buildPlan(profile, 2400, {
    month: 5,
    weekNumber,
    userId: 'training-dinners-test',
    pastProteins: {},
    freeFormPool: [],
    saveMealMemory: vi.fn(),
    qaTrace: true,
  });
}

describe('buildPlan — TRAINING_DINNERS registra proteína/plateType reales y slot correcto (BUG 3 + BUG 6)', () => {
  it('cena de entreno de TERNERA: cruza de familia "ave"→"vacuno" correctamente', () => {
    // Con trainingDays:["Martes"], el único día de entreno cae en
    // TRAINING_DINNERS[1] = ternera (usedD.length===1 al llegar a Martes,
    // tras la cena normal del Lunes). Verificado empíricamente.
    const result = buildWithTrainingDays(['Martes'], 99);
    const martes = result.days.find((d) => d.name === 'Martes');
    const dinner = martes.meals.find((m) => m.time === 'Cena');

    expect(dinner).toBeTruthy();
    expect(dinner.time).toBe('Cena');
    expect(dinner.metadata.plateType).toBe('caliente_patata');
    expect(dinner._spec.P).toBe('ternera');

    const weekly = result.qaTrace.weekValidation.weeklyProteinCount;
    // La cena de ternera debe contarse como vacuno, NUNCA como ave.
    expect(weekly.vacuno).toBeGreaterThanOrEqual(1);
    // ave no debe llevar un crédito fantasma por esta cena: su recuento
    // proviene únicamente de las comidas reales de pollo/pavo de la semana.
    const aveDeOtrasComidas = (weekly.pollo || 0) + (weekly.pavo || 0);
    expect(weekly.ave).toBe(aveDeOtrasComidas);
  });

  it('cubre los 3 TRAINING_DINNERS (pollo, ternera, pavo) en una sola semana', () => {
    // trainingDays consecutivos desde Lunes hacen que usedD.length valga
    // 0, 1, 2 en cada día de entreno → TRAINING_DINNERS[0..2] completo.
    const result = buildWithTrainingDays(['Lunes', 'Martes', 'Miércoles'], 100);

    const expected = {
      Lunes:     { P: 'pollo',   plateType: 'caliente_arroz'  },
      Martes:    { P: 'ternera', plateType: 'caliente_patata' },
      Miércoles: { P: 'pavo',    plateType: 'caliente_boniato' },
    };

    Object.keys(expected).forEach((dayName) => {
      const day = result.days.find((d) => d.name === dayName);
      const dinner = day.meals.find((m) => m.time === 'Cena');
      expect(dinner, `${dayName}: cena no encontrada por time==="Cena"`).toBeTruthy();
      expect(dinner.time).toBe('Cena');
      expect(dinner._spec.P).toBe(expected[dayName].P);
      expect(dinner.metadata.plateType).toBe(expected[dayName].plateType);
    });

    // El registro semanal refleja las 3 proteínas reales, no "pollo" ×3.
    const weekly = result.qaTrace.weekValidation.weeklyProteinCount;
    expect(weekly.ternera).toBeGreaterThanOrEqual(1);
    expect(weekly.vacuno).toBeGreaterThanOrEqual(1);
    expect(weekly.pavo).toBeGreaterThanOrEqual(1);
  });
});
