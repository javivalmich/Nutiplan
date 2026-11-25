// Pregunta del pescado en el cuestionario (D-118, pendiente «el cuestionario»; decisión de Javi del 2026-11-25):
// opciones 2, 3, 4 y «Tú decides»; «Tú decides» no guarda el campo y queda el 3 por defecto del motor.
// Solo con dieta omnívora, y no si el usuario excluyó pescado y marisco.
import { describe, it, expect } from 'vitest';
import { OPCIONES_PESCADO, preguntaPescadoVisible, respuestaPescado, conRespuestaPescado } from '../preguntaPescado.js';
import { generarPlan } from '../generarPlan.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const BASE = { gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: [], intolerances: [], eliminatedFoods: [], dieta: 'omnivora', hambre: 'media', experiencia: 'intermedio', tiempoCocina: 'normal', kcalAdjust: 0, extras: {} };
const opts = (w) => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: 'banco-pregunta-pescado', saveMealMemory: () => {} });
// Lo que hace la app al guardar y recargar el perfil (localStorage y user_data.data.profile guardan el perfil en JSON).
const guardado = (p) => JSON.parse(JSON.stringify(p));
const fijado = (plan) => plan.decisionLog.find((e) => e.causa === 'tope_pescado_semana_fijado');
// day.id lleva Date.now() del motor viejo (buildPlan.js:44); se compara sin él, como el banco (banco.mjs:55).
const sinIdDeDia = (plan) => JSON.stringify(plan, (k, v) => (k === 'id' && typeof v === 'string' && /^day-\d-\d+$/.test(v) ? v.replace(/-\d+$/, '') : v));

describe('pregunta del pescado: opciones y visibilidad', () => {
  it('ofrece 2, 3, 4 y «Tú decides», en ese orden', () => {
    expect(OPCIONES_PESCADO.map((o) => o.valor)).toEqual([2, 3, 4, 'auto']);
    expect(OPCIONES_PESCADO[3].label).toBe('Tú decides');
  });

  it('se muestra solo con dieta omnívora (también sin dieta, que es omnívora)', () => {
    expect(preguntaPescadoVisible(BASE)).toBe(true);
    expect(preguntaPescadoVisible({ ...BASE, dieta: undefined })).toBe(true);
    expect(preguntaPescadoVisible({ ...BASE, dieta: 'vegetariana' })).toBe(false);
    expect(preguntaPescadoVisible({ ...BASE, dieta: 'vegana' })).toBe(false);
  });

  it('se oculta si el usuario excluyó pescado y marisco; con solo uno de los dos, se muestra', () => {
    expect(preguntaPescadoVisible({ ...BASE, intolerances: ['pescado', 'mariscos'] })).toBe(false);
    expect(preguntaPescadoVisible({ ...BASE, intolerances: ['pescado'] })).toBe(true);
    expect(preguntaPescadoVisible({ ...BASE, intolerances: ['mariscos'] })).toBe(true);
  });

  it('sin el campo, la respuesta preseleccionada es «Tú decides»', () => {
    expect(respuestaPescado(BASE)).toBe('auto');
    expect(respuestaPescado({ ...BASE, pescadoMaxSemana: 4 })).toBe(4);
  });
});

describe('pregunta del pescado: lo que se guarda', () => {
  it('2, 3 y 4 se guardan como pescadoMaxSemana', () => {
    for (const v of [2, 3, 4]) expect(guardado(conRespuestaPescado(BASE, v)).pescadoMaxSemana).toBe(v);
  });

  it('«Tú decides» no escribe el campo, y lo quita si había uno', () => {
    expect('pescadoMaxSemana' in conRespuestaPescado(BASE, 'auto')).toBe(false);
    expect('pescadoMaxSemana' in guardado(conRespuestaPescado({ ...BASE, pescadoMaxSemana: 2 }, 'auto'))).toBe(false);
  });

  it('no cambia el resto del perfil ni el perfil de entrada', () => {
    const p = { ...BASE, pescadoMaxSemana: 2 };
    const n = conRespuestaPescado(p, 4);
    expect(p.pescadoMaxSemana).toBe(2);
    const { pescadoMaxSemana, ...resto } = n;
    expect(pescadoMaxSemana).toBe(4);
    expect(resto).toEqual(BASE);
  });

  it('un valor que no es de las opciones no se acepta', () => {
    for (const v of [1, 5, '3', null, undefined, 2.5]) expect(() => conRespuestaPescado(BASE, v)).toThrow();
  });
});

describe('pregunta del pescado: llega al motor', { timeout: 120000 }, () => {
  it('2, 3 y 4 llegan a pescadoMaxSemana de engine2', () => {
    for (const v of [2, 3, 4]) {
      const plan = generarPlan(guardado(conRespuestaPescado(BASE, v)), 2000, opts(60));
      expect(plan.motor).toBe('engine2');
      expect(fijado(plan).tope).toBe(v);
      expect(fijado(plan).evidencia).not.toMatch(/por defecto/);
    }
  });

  it('«Tú decides» da el 3 por defecto y el mismo plan que un perfil guardado antes de la pregunta', () => {
    const antiguo = guardado(BASE);
    const auto = guardado(conRespuestaPescado(BASE, 'auto'));
    const a = generarPlan(antiguo, 2000, opts(61));
    const b = generarPlan(auto, 2000, opts(61));
    expect(fijado(b).tope).toBe(3);
    expect(fijado(b).evidencia).toMatch(/por defecto/);
    expect(sinIdDeDia(b)).toBe(sinIdDeDia(a));
  });
});
