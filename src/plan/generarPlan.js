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
import { generarPlanEngine2, regenerarComidaEngine2, metaEngine2 } from './engine2App.js';
import { catalogoApp } from './catalogo.js';
import { ajustarDia } from './racionesApp.js';

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
  const meta = metaEngine2(planGuardado);
  if (semanaGuardada === semanaNueva) return meta.platosSemanaAnterior || [];
  if (Array.isArray(meta.platosSemana)) return meta.platosSemana;
  const titulos = [];
  for (const d of planGuardado.days) {
    for (const m of d.meals || []) if (m && (m.time === 'Comida' || m.time === 'Cena') && m.title) titulos.push(m.title);
  }
  return titulos;
}

/**
 * Vuelve a calcular las raciones de un día de un plan de engine2 después de
 * que la app lo cambie (activar o quitar el batido, regenerar una comida con
 * el motor viejo). En un plan del motor viejo devuelve el día tal cual.
 */
export function usaRaciones(plan, dayIdx) {
  // El plan que vuelve de la base de datos solo trae los días: se mira el día.
  return !!(plan && (plan.raciones === 'engine2' || (plan.days && plan.days[dayIdx] && plan.days[dayIdx].raciones)));
}

export function recalcularDia(plan, day, profile, targetKcal) {
  if (!plan || !day || !(plan.raciones === 'engine2' || day.raciones)) return day;
  return ajustarDia(day, profile, targetKcal).day;
}

/**
 * Alternativa de una comida o cena en un plan de engine2: la elige engine2 con
 * las reglas del menú. Devuelve el plan nuevo, o null si no aplica (plan del
 * motor viejo, desayuno o tentempié, comida libre) o si engine2 falla; en ese
 * caso la app sigue con el motor viejo como hasta ahora.
 */
export function regenerarComida(plan, dayIdx, time, deseo, profile, targetKcal, opts = {}) {
  if (!plan || (time !== 'Comida' && time !== 'Cena')) return null;
  const meal = plan.days[dayIdx] && plan.days[dayIdx].meals.find((m) => m && m.time === time);
  // Se mira la comida, no el plan: el que vuelve de la base de datos no trae plan.motor.
  if (!meal || meal._motor !== 'engine2' || !meal._dishId) return null;
  try {
    return regenerarComidaEngine2(plan, dayIdx, time, deseo, profile, targetKcal, { ...opts, catalogo: opts.catalogo || catalogoApp() });
  } catch (err) {
    console.error('[regenerarComida] engine2 falló; se usa el motor viejo', err);
    return null;
  }
}
