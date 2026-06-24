// BUG 1 (Fase 1, Checkpoint 2) — el mood "aminoácidos" se definía con tilde en
// WEEK_SLOTS (volumen_limpio/Miércoles, volumen_agresivo/Martes) pero
// MOOD_CONFIG y moodTags (OriginalPlanApp.jsx) ya usaban la clave ASCII
// "aminoacidos". El lookup por objeto fallaba silenciosamente: moodBonus()
// caía a MOOD_CONFIG.rutina (plateBonus:{}) en vez de aplicar el bonus real
// {caliente_arroz:2, caliente_patata:1}, y moodTags (UI) no encontraba la
// clave y no mostraba ninguna etiqueta ese día.
//
// Decisión cerrada (opción b): unificar a la clave ASCII en el productor
// (WEEK_SLOTS) y en la única comparación directa de string (apetenciaPen).
// slotNote (texto visible) no se toca. MOOD_CONFIG y moodTags no se tocan
// (ya eran ASCII).

import { describe, it, expect } from 'vitest';
import { FIXTURES, runBaseline } from './baselineFixtures.js';

const volumenLimpio = FIXTURES.find((f) => f.name === 'volumen_limpio');
const volumenAgresivo = FIXTURES.find((f) => f.name === 'volumen_agresivo');

describe('buildPlan — mood "aminoacidos" sin tilde llega íntegro a la salida pública (BUG 1)', () => {
  it('volumen_limpio: el día Miércoles expone mood y effectiveMood en ASCII', () => {
    const result = runBaseline(volumenLimpio);
    const miercoles = result.days.find((d) => d.name === 'Miércoles');
    expect(miercoles).toBeTruthy();
    expect(miercoles.mood).toBe('aminoacidos');
    expect(miercoles.effectiveMood).toBe('aminoacidos');
  });

  it('volumen_agresivo: el día Martes expone mood y effectiveMood en ASCII', () => {
    const result = runBaseline(volumenAgresivo);
    const martes = result.days.find((d) => d.name === 'Martes');
    expect(martes).toBeTruthy();
    expect(martes.mood).toBe('aminoacidos');
    expect(martes.effectiveMood).toBe('aminoacidos');
  });
});
