// generarPlan — punto único por el que la app genera un plan semanal.
//
// Decide qué motor se usa y nunca deja al usuario sin plan:
//   - Por defecto, engine2 (src/plan/engine2App.js).
//   - VITE_MOTOR_PLAN=legacy (variable de entorno del despliegue) vuelve al
//     motor viejo para todos sin tocar código; profile.motorPlan = 'legacy' |
//     'engine2' lo fija para un usuario concreto.
//   - Las regeneraciones parciales de la app (cambiar una comida, recalcular
//     un día con o sin batido) llevan profile._regenContext y van siempre al
//     motor viejo, que es quien sabe hacerlas; trabajan sobre las mismas
//     fichas de plato, así que valen también para un plan de engine2.
//   - Si engine2 falla, se registra el error y se devuelve el plan del motor
//     viejo (plan.motor = 'legacy', plan.motorFallo = mensaje).
// El motor viejo no se borra ni se modifica.

import { buildPlan } from '../engine/buildPlan.js';
import { generarPlanEngine2 } from './engine2App.js';
import { catalogoApp } from './catalogo.js';

function motorPorDefecto() {
  let env;
  try {
    env = import.meta.env && import.meta.env.VITE_MOTOR_PLAN;
  } catch {
    env = undefined;
  }
  return env === 'legacy' ? 'legacy' : 'engine2';
}

export function motorPara(profile) {
  if (profile && (profile.motorPlan === 'legacy' || profile.motorPlan === 'engine2')) return profile.motorPlan;
  return motorPorDefecto();
}

export function generarPlan(profile, targetKcal, opts = {}) {
  if (profile && profile._regenContext) return buildPlan(profile, targetKcal, opts);
  if (motorPara(profile) === 'legacy') return { ...buildPlan(profile, targetKcal, opts), motor: 'legacy' };
  try {
    return generarPlanEngine2(profile, targetKcal, { ...opts, catalogo: opts.catalogo || catalogoApp() });
  } catch (err) {
    console.error('[generarPlan] engine2 falló; se usa el motor viejo', err);
    return { ...buildPlan(profile, targetKcal, opts), motor: 'legacy', motorFallo: String(err && err.message ? err.message : err) };
  }
}

/**
 * Platos que el nuevo plan no debe repetir: los de la semana anterior.
 * - Si el plan guardado es de otra semana, sus platos son la semana anterior.
 * - Si es de la misma semana (se regenera), se reutiliza la semana anterior
 *   que ya usó ese plan.
 * Para planes antiguos sin platosSemana se usan los títulos de comida y cena.
 */
export function platosRecientesPara(planGuardado, semanaGuardada, semanaNueva) {
  if (!planGuardado || !Array.isArray(planGuardado.days)) return [];
  if (semanaGuardada === semanaNueva) return planGuardado.platosSemanaAnterior || [];
  if (Array.isArray(planGuardado.platosSemana)) return planGuardado.platosSemana;
  const titulos = [];
  for (const d of planGuardado.days) {
    for (const m of d.meals || []) if (m && (m.time === 'Comida' || m.time === 'Cena') && m.title) titulos.push(m.title);
  }
  return titulos;
}
