// Regeneración por el motor viejo, comprobada antes de aceptarla (paso 1 de la legumbre como guarnición; Javi,
// 2026-11-23; D-103).
//
// Cambiar una comida va por el motor viejo cuando engine2 no puede (regenerarComida devuelve null: plan del motor
// viejo, comida que no es de engine2, o engine2 falla sin dieta). El motor viejo está congelado y solo mira la
// proteína y el hidrato de su ficha contra los alimentos eliminados (buildPlan.js:843-845): con «frijoles»
// eliminado deja pasar un burrito de alubias negras. Aquí se mira la comida que trae, ya escrita, con las mismas
// reglas que engine2: intolerancias, SIBO y dieta (intoleranciasDe) y alimentos eliminados con sus sinónimos
// (eliminados.js). Si lleva algo que el perfil no puede comer, la comida se queda como estaba: el plan de antes, con
// alternativaSinCambio (la app avisa, como cuando engine2 no tiene alternativa) y la causa en el decisionLog.
import { intoleranciasDe } from './engine2App.js';
import { eliminadoEn } from './eliminados.js';

const textoDe = (m) => [m.title, m.p1, m.p2, ...(m.shopping || []), ...((m.recipe || []).filter((x) => typeof x === 'string'))].filter(Boolean).join(' · ');

/**
 * @returns el plan nuevo si la comida que trae el motor viejo vale para el perfil; si no, el de antes con
 *   alternativaSinCambio y la causa en el decisionLog.
 */
export function comprobarRegeneracionViejo(planAntes, planDespues, dayIdx, time, profile) {
  const dia = planDespues && planDespues.days && planDespues.days[dayIdx];
  const nueva = dia && (dia.meals || []).find((m) => m && m.time === time);
  if (!nueva) return planDespues;
  const motivos = [...new Set(intoleranciasDe(nueva, profile))].map((i) => `intolerancia: ${i}`);
  const texto = textoDe(nueva);
  for (const e of (profile && profile.eliminatedFoods) || []) {
    if (String(e).trim() && eliminadoEn(texto, e)) motivos.push(`alimento eliminado: «${String(e).trim()}»`);
  }
  if (!motivos.length) return planDespues;
  const nombreDia = (planAntes.days[dayIdx] && planAntes.days[dayIdx].name) || dia.name;
  return {
    ...planAntes,
    alternativaSinCambio: true,
    decisionLog: [...(planAntes.decisionLog || []), {
      causa: 'alternativa_motor_viejo_rechazada', day: nombreDia, momento: time,
      detalle: `el motor viejo proponía «${nueva.title}», que lleva algo que el perfil no puede comer (${motivos.join('; ')}): la comida se queda como estaba`,
    }],
  };
}
