// Fixtures compartidas del baseline aprobado (Fase 0) — extraídas de
// buildPlan.baseline.test.js para reutilizar sin duplicar en
// humanScore.baseline.test.js (Paso 6, Fase 0.5) y en el generador del
// artefacto versionado, sin disparar los efectos secundarios de un archivo
// .test.js (describe/it de nivel de módulo) al importarlas desde fuera.

import { vi } from 'vitest';
import { buildPlan } from '../buildPlan.js';

const TARGET_KCAL = 2000;

const PROFILE_DEFAULTS = {
  mealsPerDay:  3,
  tiempoCocina: "normal",
  experiencia:  "intermedio",
  simpleMode:   false,
  dob:          "1990-01-01",
  gender:       "male",
  height:       178,
  extras:       {},
};

// ── Las 9 fixtures del baseline aprobado (6 estrategias + 3 extra en
// mantenimiento_equilibrado) — userId/weekNumber propios, sin opts.rng.
export const FIXTURES = [
  {
    name: 'fat_loss_general',
    expectedStrategy: 'fat_loss_general',
    userId: 'baseline-fatlossgeneral',
    weekNumber: 10,
    profile: { goal: "fatLossGeneral", weight: 90, activity: "moderate", intolerances: [], trainingDays: [] },
  },
  {
    name: 'definicion_saciante',
    expectedStrategy: 'definicion_saciante',
    userId: 'baseline-defsaciante',
    weekNumber: 11,
    profile: { goal: "fatLoss", hambre: "alta", weight: 70, activity: "active", intolerances: [], trainingDays: ["Lunes", "Miércoles", "Viernes"] },
  },
  {
    name: 'definicion_flexible',
    expectedStrategy: 'definicion_flexible',
    userId: 'baseline-defflexible',
    weekNumber: 12,
    profile: { goal: "fatLoss", hambre: "media", weight: 65, activity: "moderate", intolerances: [], trainingDays: [] },
  },
  {
    name: 'mantenimiento_equilibrado (base)',
    expectedStrategy: 'mantenimiento_equilibrado',
    userId: 'baseline-mantenimiento',
    weekNumber: 13,
    profile: { goal: "maintain", weight: 74, activity: "moderate", intolerances: [], trainingDays: [] },
  },
  {
    name: 'volumen_limpio',
    expectedStrategy: 'volumen_limpio',
    userId: 'baseline-volumenlimpio',
    weekNumber: 14,
    profile: { goal: "mildGain", weight: 80, activity: "moderate", intolerances: [], trainingDays: ["Lunes", "Jueves"] },
  },
  {
    name: 'volumen_agresivo',
    expectedStrategy: 'volumen_agresivo',
    userId: 'baseline-volumenagresivo',
    weekNumber: 15,
    profile: { goal: "muscleGain", weight: 85, activity: "active", intolerances: [], trainingDays: ["Lunes", "Martes", "Jueves", "Viernes"] },
  },
  {
    name: 'mantenimiento_equilibrado + intolerancias (lactosa+gluten)',
    expectedStrategy: 'mantenimiento_equilibrado',
    userId: 'baseline-mant-intol',
    weekNumber: 16,
    profile: { goal: "maintain", weight: 74, activity: "moderate", intolerances: ["lactosa", "gluten"], trainingDays: [] },
  },
  {
    name: 'mantenimiento_equilibrado + trainingDays',
    expectedStrategy: 'mantenimiento_equilibrado',
    userId: 'baseline-mant-training',
    weekNumber: 17,
    profile: { goal: "maintain", weight: 74, activity: "moderate", intolerances: [], trainingDays: ["Lunes", "Miércoles", "Viernes"] },
  },
  {
    name: 'mantenimiento_equilibrado + isSimple (experiencia novato)',
    expectedStrategy: 'mantenimiento_equilibrado',
    userId: 'baseline-mant-simple',
    weekNumber: 18,
    profile: { goal: "maintain", weight: 74, activity: "moderate", intolerances: [], trainingDays: [], experiencia: "novato" },
  },
];

export function buildProfile(overrides) {
  return JSON.parse(JSON.stringify({ ...PROFILE_DEFAULTS, ...overrides }));
}

export function runBaseline(fixture, extraOpts = {}) {
  return buildPlan(
    buildProfile(fixture.profile),
    TARGET_KCAL,
    {
      month: 5,
      weekNumber: fixture.weekNumber,
      userId: fixture.userId,
      pastProteins: {},
      freeFormPool: [],
      saveMealMemory: vi.fn(),
      ...extraOpts,
    },
  );
}

export function serialiseDays(days) {
  return days.map(({ id: _id, ...rest }) => rest);
}
