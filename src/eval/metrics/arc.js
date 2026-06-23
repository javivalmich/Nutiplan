// Sub-métricas de "coherencia de arco" (Paso 4, Fase 0.5) — tres claves
// independientes en humanScore (densidadDiaria, domingoReconfortante,
// diaFacilTrasElaborado), cada una atada a un observable real del motor
// (gate de honestidad: no se computa nada cuyo observable no esté citado
// con archivo:línea).
//
// 1) densidadDiaria: classifyDayDensity (../dayDensity.js) — meal._spec.density.
//    Diagnóstico, sin juicio direccional propio (polarity: null).
//
// 2) domingoReconfortante: observable = day.effectiveMood. El motor activa
//    el patrón "COMFORT DEL DOMINGO" en src/engine/buildPlan.js:2353-2356
//    ("if(day==='Domingo' && HUMAN_PATTERNS.sundayComfort && dayMood!=='libre')
//    dayMood = 'reconfortante';") y lo expone tal cual en el objeto día como
//    effectiveMood (buildPlan.js:2502 `effectiveMood:dayMood`). No se infiere
//    nada: se lee directamente el campo que el motor ya etiquetó.
//
// 3) diaFacilTrasElaborado: observable = meal.metadata.facilidad. El motor
//    asigna facilidad:"alta"|"media" en composeMeal (buildPlan.js:686-687:
//    `facilidad: (P && P.facil && (!C || C.time <= 20)) ? "alta" : "media"`,
//    sibling de _spec dentro del meal, no anidado en _spec). El campo nunca
//    toma valor "baja" en el código actual (ver grep de distintos valores en
//    la sesión) — "elaborado" se define como "al menos una comida principal
//    con facilidad !== 'alta'" (la única alternativa real observada), NO
//    como un proxy inventado de "elaboración" textual.
//
// Ambas comidas principales (comida+cena) deben ser legibles para que un día
// participe en cualquiera de estas comparaciones; si no, el día queda
// "unknown" y no cuenta a favor ni en contra (decisión Fase 0.5, regla
// adicional de densidad/ligereza, aplicada aquí también por consistencia).

import { classifyDayDensity } from '../dayDensity.js';
import { getMainMeals, isLegibleMeal } from '../planReader.js';

function classifyDayFacilidad(day) {
  const mains = getMainMeals(day).filter(isLegibleMeal);
  if (mains.length < 2) {
    return { status: 'unknown', classification: null };
  }
  const todasFaciles = mains.every((m) => m.metadata && m.metadata.facilidad === 'alta');
  return { status: 'computed', classification: todasFaciles ? 'facil' : 'elaborado' };
}

export function computeDensidadDiaria(plan) {
  const days = (plan && plan.days) || [];
  const densidadPorDia = {};
  for (const day of days) {
    densidadPorDia[day.name] = classifyDayDensity(day);
  }
  const evidencias = days.map((d) => {
    const c = densidadPorDia[d.name];
    return c.status === 'computed'
      ? `${d.name}: densidad=${c.density} (${c.classification})`
      : `${d.name}: densidad=unknown (menos de 2 comidas legibles)`;
  });
  return {
    valor: densidadPorDia,
    status: 'computed',
    polarity: null, // diagnóstico, sin juicio direccional propio
    evidencias,
  };
}

export function computeDomingoReconfortante(plan) {
  const days = (plan && plan.days) || [];
  const domingo = days.find((d) => d.name === 'Domingo');
  const valor = domingo ? domingo.effectiveMood === 'reconfortante' : null;
  const evidencias = [
    domingo
      ? `Domingo → effectiveMood: "${domingo.effectiveMood}"` +
        (valor
          ? ' (patrón comfort domingo activo, buildPlan.js:2354-2356)'
          : ' (patrón comfort domingo NO activo en este plan)')
      : 'No hay día "Domingo" en plan.days — no se puede evaluar.',
  ];
  return { valor, status: 'computed', polarity: 'higher_is_better', evidencias };
}

export function computeDiaFacilTrasElaborado(plan) {
  const days = (plan && plan.days) || [];
  const facilidadPorDia = {};
  for (const day of days) facilidadPorDia[day.name] = classifyDayFacilidad(day);

  const pares = [];
  const diasOmitidos = [];
  for (let i = 0; i < days.length - 1; i++) {
    const hoy = days[i];
    const maniana = days[i + 1];
    const fHoy = facilidadPorDia[hoy.name];
    const fManiana = facilidadPorDia[maniana.name];
    if (fHoy.status !== 'computed' || fManiana.status !== 'computed') {
      if (fHoy.status !== 'computed' && !diasOmitidos.includes(hoy.name)) diasOmitidos.push(hoy.name);
      if (fManiana.status !== 'computed' && !diasOmitidos.includes(maniana.name)) diasOmitidos.push(maniana.name);
      continue;
    }
    if (fHoy.classification === 'elaborado' && fManiana.classification === 'facil') {
      pares.push({ elaborado: hoy.name, facilDespues: maniana.name });
    }
  }

  const evidencias = [
    ...pares.map((p) => `${p.elaborado} (elaborado) → ${p.facilDespues} (fácil): patrón de arco coherente`),
    ...(diasOmitidos.length
      ? [`Días excluidos de la comparación elaborado→fácil por datos insuficientes: ${diasOmitidos.join(', ')}`]
      : []),
  ];

  return { valor: pares, status: 'computed', polarity: 'higher_is_better', evidencias };
}
