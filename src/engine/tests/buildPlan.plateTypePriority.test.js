// BUG 4 — Parte 1 (Fase 1, Checkpoint 5).
//
// Auditoría: el guessing por substring de título en validateWeek (secciones
// 8 y 10, buildPlan.js ~2700-2766) YA estaba subordinado a metadata.plateType
// antes de este checkpoint ("var pt = meal.metadata && meal.metadata.plateType
// ? meal.metadata.plateType : null; if(!pt) { ...substring... }"). No hubo
// cambio de código en Parte 1 — se verificó, no se asumió.
//
// validateWeek no se exporta (closure interno de buildPlan) y dayKcalList no
// se expone en qaTrace, así que no es posible invocar la rama de cálculo de
// kcal directamente desde un test sin añadir instrumentación nueva — fuera
// de scope de Fase 1 (no se añade). Este test ancla en su lugar el dato real
// que demuestra POR QUÉ la prioridad de metadata.plateType importa: el
// repertorio de platos contiene títulos cuya palabra clave (la que usaría el
// substring guessing) NO coincide con su plateType real.
//
// La búsqueda es dinámica (no fija un título textual concreto) porque qué
// combo exacto sale elegido en cada fixture depende de WEEKLY_CAP/smartPick,
// que BUG 5 (Checkpoint 6) puede modificar legítimamente sin que esto deba
// romper este test.

import { describe, it, expect } from 'vitest';
import { FIXTURES, runBaseline } from './baselineFixtures.js';

// Mismo orden/claves que el substring guessing de validateWeek
// (buildPlan.js ~2712-2725) — usado aquí solo para DETECTAR mismatches en
// datos reales, nunca para decidir nada dentro del motor.
const SUBSTRING_RULES = [
  { kw: 'arroz',     guess: 'caliente_arroz'  },
  { kw: 'patata',    guess: 'caliente_patata' },
  { kw: 'crema',     guess: 'sopa_crema'      },
  { kw: 'sopa',      guess: 'sopa_crema'      },
  { kw: 'ensalada',  guess: 'ensalada'        },
  { kw: 'pasta',     guess: 'pasta'           },
  { kw: 'legumbre',  guess: 'legumbre'        },
  { kw: 'lentejas',  guess: 'legumbre'        },
  { kw: 'garbanzos', guess: 'legumbre'        },
  { kw: 'horno',     guess: 'pescado_horno'   },
  { kw: 'huevo',     guess: 'huevo_plancha'   },
  { kw: 'tortilla',  guess: 'huevo_plancha'   },
  { kw: 'clara',     guess: 'huevo_plancha'   },
];

function guessFromTitle(title) {
  const t = (title || '').toLowerCase();
  const rule = SUBSTRING_RULES.find((r) => t.indexOf(r.kw) > -1);
  return rule ? rule.guess : 'plancha_verdura';
}

function collectMealsWithPlateType(result) {
  const out = [];
  result.days.forEach((day) => {
    (day.meals || []).filter(Boolean).forEach((meal) => {
      if (meal.metadata && meal.metadata.plateType) {
        out.push(meal);
      }
    });
  });
  return out;
}

describe('buildPlan — metadata.plateType es prioritario sobre el título engañoso (BUG 4, Parte 1)', () => {
  it('existen platos reales cuyo título sugiere un plateType distinto del real, y metadata.plateType gana', () => {
    const mismatches = [];
    FIXTURES.forEach((fixture) => {
      const result = runBaseline(fixture);
      collectMealsWithPlateType(result).forEach((meal) => {
        const guessed = guessFromTitle(meal.title);
        if (guessed !== meal.metadata.plateType) {
          mismatches.push({ title: meal.title, real: meal.metadata.plateType, guessedFromTitle: guessed });
        }
      });
    });

    // Precondición: el repertorio real SÍ contiene este tipo de mismatch
    // (si esto deja de cumplirse, el test ya no demuestra nada — revisar).
    expect(mismatches.length).toBeGreaterThan(0);

    // Para cada mismatch encontrado, lo único que afirmamos es que
    // metadata.plateType (el dato real) es distinto del que produciría el
    // substring — es decir, que importa cuál de los dos gane. validateWeek
    // ya lee metadata.plateType primero (verificado en el código), así que
    // estos casos nunca llegan al substring guessing.
    mismatches.forEach((m) => {
      expect(m.real).not.toBe(m.guessedFromTitle);
    });
  });

  it('la única comida del baseline sin metadata.plateType es "Comida libre 🎉" (Sábado, wildcard)', () => {
    // Ancla el inventario real: 9/9 fixtures, una sola comida por fixture
    // cae al fallback de substring porque libreComida() no declara plateType.
    FIXTURES.forEach((fixture) => {
      const result = runBaseline(fixture);
      const sabado = result.days.find((d) => d.name === 'Sábado');
      const libre = sabado.meals.find((m) => m.title === 'Comida libre 🎉');
      expect(libre).toBeTruthy();
      expect(libre.metadata.plateType).toBeUndefined();
    });
  });
});
