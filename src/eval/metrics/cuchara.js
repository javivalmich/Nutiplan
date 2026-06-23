// Sub-métrica "plato de cuchara" (Paso 3, Fase 0.5).
//
// cuchara = _spec.tmpl ∈ {'legumbre', 'sopa_crema'}.
//
// Esta definición es DELIBERADAMENTE idéntica a metadata.comfort del motor
// (src/engine/buildPlan.js:689: `comfort: tmpl==="legumbre"||tmpl==="sopa_crema"`):
// no es coincidencia, es alineación con la categoría que el propio motor ya
// usa para clasificar estos platos. humanScore lee _spec.tmpl directamente
// (la fuente), no metadata.comfort, porque metadata es derivado y _spec es
// el campo canónico (CLAUDE.md: "toda decisión registra su causa").
//
// LIMITACIÓN CONOCIDA Y ACEPTADA: los guisos/estofados con caldo que el motor
// clasifica bajo el cajón genérico "caliente_clasico" (116/185 combos — ver
// enumeración de tmpl en la sesión de Fase 0.5) NO cuentan como cuchara. Es
// un sub-conteo honesto: el límite es el del propio motor, que no distingue
// "guisado con caldo" de "plancha seca" a nivel de tmpl. Deliberadamente NO
// se parsean títulos ni p1/p2 para rescatar estos casos — eso sería el proxy
// heurístico que la regla de honestidad de métricas prohíbe sin aprobación.

import { collectLegibleMainMeals } from '../planReader.js';

const CUCHARA_TMPLS = new Set(['legumbre', 'sopa_crema']);
const DESTACADA_THRESHOLD = 4; // provisional

export function computePlatoCuchara(plan) {
  const ocurrencias = [];
  for (const { day, time, meal } of collectLegibleMainMeals(plan)) {
    if (CUCHARA_TMPLS.has(meal._spec.tmpl)) {
      ocurrencias.push({ day, time });
    }
  }

  const count = ocurrencias.length;
  const evidencias = [];
  if (count > 0) {
    const ubicaciones = ocurrencias.map((o) => `${o.day.toLowerCase()} ${o.time.toLowerCase()}`).join(', ');
    evidencias.push(`plato de cuchara (tmpl legumbre/sopa_crema) aparece ${count} veces: ${ubicaciones}`);
  }
  if (count >= DESTACADA_THRESHOLD) {
    evidencias.push(`umbral provisional de repetición destacada (>=${DESTACADA_THRESHOLD}) alcanzado: ${count} veces`);
  }

  return {
    valor: { count, ocurrencias, umbralDestacadaProvisional: DESTACADA_THRESHOLD },
    status: 'computed',
    polarity: 'lower_is_better',
    evidencias,
  };
}
