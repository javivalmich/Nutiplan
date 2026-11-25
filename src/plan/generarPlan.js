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
import { generarPlanEngine2, regenerarComidaEngine2, regenerarDesayunoEngine2, metaEngine2 } from './engine2App.js';
import { catalogoApp } from './catalogo.js';
import { ajustarDia } from './racionesApp.js';

// Paso 9 (D-120): una comida con guarnición de legumbre tampoco va al motor viejo (perdería la guarnición).
export const AVISO_GUARNICION_SIN_ALTERNATIVA = 'No hay otro plato que encaje con el menú de esta semana para cambiar esta comida; se queda como está.';
export const AVISO_COMIDA_DOBLE_SIN_ALTERNATIVA = 'No hay otro plato que encaje con el menú de esta semana para cambiar esta comida de primero y segundo; se queda como está.';

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

// D-107: red para cuando engine2 no llega a llenar la semana con los platos recientes vetados. La usa
// generarPlan con dieta vegetariana o vegana y, desde D-123, «Regenerar plan» con todas las dietas.
const RED_D107 = Object.freeze([
  { platosRecientes: [], aviso: 'repite platos de la semana anterior' },
  { platosRecientes: [], maxRepeticiones: 2, aviso: 'repite platos en la semana (hasta 2 veces): hay pocos platos para esta dieta' },
  { platosRecientes: [], maxRepeticiones: 7, aviso: 'repite platos en la semana: hay muy pocos platos para esta dieta' },
  // Último recurso (vegana, celíaca y sin soja o sin legumbres, p. ej.:
  // no queda ninguna cena, o ningún plato): los platos de reserva, sin
  // gluten, soja ni legumbres. Son cenas más cortas y se repiten; antes
  // eso que cenar platos de comida (D-109, decisión de Javi).
  { platosRecientes: [], maxRepeticiones: 7, platosReserva: true, aviso: 'cenas más cortas y repetidas: hay muy pocos platos para esta dieta' },
]);

export function generarPlan(profile, targetKcal, opts = {}) {
  if (profile && profile._regenContext) return buildPlan(profile, targetKcal, opts);
  if (motorPara(profile) === 'legacy') return { ...buildPlan(profile, targetKcal, opts), motor: 'legacy' };
  try {
    return generarPlanEngine2(profile, targetKcal, { ...opts, catalogo: opts.catalogo || catalogoApp() });
  } catch (err) {
    // D-107: con dieta vegetariana o vegana el catálogo es más corto. Antes que
    // el motor viejo (que no conoce las dietas), se reintenta dejando que
    // vuelva algún plato de la semana anterior.
    // Si aun así no llega (vegana y sin soja, p. ej.), se deja repetir platos
    // dentro de la semana: el motor viejo no conoce las dietas y serviría carne.
    if (profile && (profile.dieta === 'vegetariana' || profile.dieta === 'vegana')) {
      const intentos = RED_D107;
      for (const { aviso, ...extra } of intentos) {
        try {
          const plan = generarPlanEngine2(profile, targetKcal, { ...opts, ...extra, catalogo: opts.catalogo || catalogoApp() });
          return { ...plan, motorAviso: `${aviso} (${String(err && err.message ? err.message : err)})` };
        } catch (err2) {
          console.error('[generarPlan] engine2 falló también:', aviso, err2);
        }
      }
    }
    console.error('[generarPlan] engine2 falló; se usa el motor viejo', err);
    return { ...buildPlan(perfilParaMotorViejo(profile), targetKcal, opts), motor: 'legacy', motorFallo: String(err && err.message ? err.message : err) };
  }
}

// El motor viejo no conoce las dietas (D-107). Si hay que usarlo de reserva,
// se le pasan como intolerancias y alimentos eliminados (sus proteínas de
// carne, pescado y marisco); no garantiza todo (salsas, caldos), por eso la
// reserva es solo para que el usuario no se quede sin plan.
const PROTEINAS_ANIMALES = ['pollo', 'pavo', 'ternera', 'cerdo', 'conejo', 'lacon', 'jamon', 'guanciale', 'salmon', 'merluza', 'bacalao', 'dorada', 'sardinas', 'atun', 'bonito', 'corvina', 'gambas', 'calamares', 'mejillones', 'berberechos'];
function perfilParaMotorViejo(profile) {
  const dieta = profile && profile.dieta;
  if (dieta !== 'vegetariana' && dieta !== 'vegana') return profile;
  const intol = new Set([...(profile.intolerances || []), 'pescado', 'mariscos', 'cerdo', ...(dieta === 'vegana' ? ['huevo', 'lactosa'] : [])]);
  return { ...profile, intolerances: [...intol], eliminatedFoods: [...new Set([...(profile.eliminatedFoods || []), ...PROTEINAS_ANIMALES])] };
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
  // Con la misma semana se reutiliza la anterior (sus desayunos ya van dentro).
  if (semanaGuardada === semanaNueva) return meta.platosSemanaAnterior || [];
  // D-110: también los desayunos y tentempiés, para que cambien cada semana.
  if (Array.isArray(meta.platosSemana)) return [...meta.platosSemana, ...(meta.desayunosSemana || [])];
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
  if (!plan || !plan.days || !plan.days[dayIdx]) return null;
  const conDieta = profile && (profile.dieta === 'vegetariana' || profile.dieta === 'vegana');
  const deEngine2 = plan.days.some((d) => (d.meals || []).some((m) => m && m._motor === 'engine2'));
  // Desayunos y tentempiés: en un plan de engine2 los cambia engine2 con su
  // catálogo, para todos (D-110; antes, solo con dieta o intolerancias).
  if (time !== 'Comida' && time !== 'Cena') {
    if (!deEngine2) return null;
    try {
      return regenerarDesayunoEngine2(plan, dayIdx, time, profile, targetKcal, opts);
    } catch (err) {
      console.error('[regenerarComida] sin alternativa segura para', time, err);
      return { ...plan, alternativaSinCambio: true };
    }
  }
  const meal = plan.days[dayIdx].meals.find((m) => m && m.time === time);
  // Se mira la comida, no el plan: el que vuelve de la base de datos no trae plan.motor.
  if (!meal || meal._motor !== 'engine2' || !meal._dishId) return null;
  try {
    return regenerarComidaEngine2(plan, dayIdx, time, deseo, profile, targetKcal, { ...opts, catalogo: opts.catalogo || catalogoApp() });
  } catch (err) {
    console.error('[regenerarComida] engine2 falló', err);
    // Comida con primero y segundo (D-116): el motor viejo perdería el segundo y podría servir legumbre
    // como plato único (D-116.1). Se queda como está, con un aviso (decisión de Javi del 2026-11-16).
    // También si está incompleta (`_dishId2` sin los datos de sus dos platos; B5 de la segunda revisión).
    if (meal._guarnicion && !meal._dishId2) {
      return {
        ...plan,
        alternativaSinCambio: true,
        alternativaAviso: AVISO_GUARNICION_SIN_ALTERNATIVA,
        decisionLog: [...(plan.decisionLog || []), { causa: 'alternativa_sin_candidato_guarnicion', day: plan.days[dayIdx].name, momento: time, deseo, plato: meal._dishId, detalle: `engine2 no encuentra alternativa (${String(err && err.message ? err.message : err)}); la comida con guarnición de legumbre (${meal._guarnicion.clave}) se queda como está, sin ir al motor viejo` }],
      };
    }
    if (meal._dishId2) {
      return {
        ...plan,
        alternativaSinCambio: true,
        alternativaAviso: AVISO_COMIDA_DOBLE_SIN_ALTERNATIVA,
        decisionLog: [...(plan.decisionLog || []), { causa: 'alternativa_sin_candidato_comida_doble', day: plan.days[dayIdx].name, momento: time, deseo, plato: meal._dishId, detalle: `engine2 no encuentra alternativa (${String(err && err.message ? err.message : err)}); la comida de primero y segundo se queda como está, sin ir al motor viejo` }],
      };
    }
    // Con dieta, el motor viejo serviría carne: mejor no cambiar el plato.
    return conDieta ? { ...plan, alternativaSinCambio: true } : null;
  }
}

// ─── «Regenerar plan»: la semana entera, con engine2 (D-123, revierte D-102) ───

export const AVISO_REGENERAR_FALLO = 'No se ha podido regenerar el menú. Sigues con el plan que tenías.';

/**
 * Otro menú para la misma semana. Misma semilla de la semana más el número de regeneración (que se guarda en el
 * plan y vuelve a 0 la semana siguiente), y los platos de la semana anterior y los del plan actual se evitan
 * (filtro). Si con eso algún hueco se queda sin platos, la red de D-107 (vaciar recientes y luego permitir
 * repeticiones), con cualquier dieta. Si engine2 tampoco así llega, se queda el plan actual con un aviso: nunca
 * el motor viejo.
 * @returns {{ ok: boolean, plan: object, aviso?: string }}
 */
export function regenerarSemana(planActual, profile, targetKcal, opts = {}) {
  if (!planActual || !Array.isArray(planActual.days) || !planActual.days.length) return { ok: false, plan: planActual, aviso: AVISO_REGENERAR_FALLO };
  const meta = metaEngine2(planActual);
  const anterior = meta.platosSemanaAnterior || [];
  const actuales = [...(Array.isArray(meta.platosSemana) ? meta.platosSemana : titulosComidaCena(planActual)), ...(meta.desayunosSemana || [])];
  const regeneracion = (Number.isInteger(meta.regeneraciones) && meta.regeneraciones > 0 ? meta.regeneraciones : 0) + 1;
  const comun = { ...opts, regeneracion, platosSemanaAnterior: anterior, catalogo: opts.catalogo || catalogoApp() };
  const intentos = [{ platosRecientes: [...new Set([...anterior, ...actuales])] }, ...RED_D107];
  let primerError = null;
  for (const { aviso, ...extra } of intentos) {
    try {
      const plan = generarPlanEngine2(profile, targetKcal, { ...comun, ...extra });
      const decisionLog = [...(plan.decisionLog || []), {
        causa: aviso ? 'regenerar_semana_red_d107' : 'regenerar_semana',
        detalle: `regeneración ${regeneracion} de la semana ${opts.weekNumber ?? 0}: se evitan ${anterior.length} platos de la semana anterior y ${actuales.length} del plan actual`
          + (aviso ? `; con ese filtro no llegaba (${String(primerError && primerError.message ? primerError.message : primerError)}): ${aviso}` : ''),
      }];
      return { ok: true, plan: { ...plan, decisionLog, ...(aviso ? { motorAviso: `${aviso} (${String(primerError && primerError.message ? primerError.message : primerError)})` } : {}) } };
    } catch (err) {
      if (!primerError) primerError = err;
      console.error('[regenerarSemana] engine2 falló', aviso || 'con los platos recientes', err);
    }
  }
  return { ok: false, plan: planActual, aviso: AVISO_REGENERAR_FALLO };
}

function titulosComidaCena(plan) {
  const t = [];
  for (const d of plan.days) for (const m of d.meals || []) if (m && (m.time === 'Comida' || m.time === 'Cena') && m.title) t.push(m.title);
  return t;
}
