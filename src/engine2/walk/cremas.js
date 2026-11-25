// Crema repetida dentro de su ventana de conservación (D-122). Solo filtros con vuelta atrás y una regla fija para
// la pareja; sin pesos (CLAUDE.md, invariante 1). Toda elección deja su causa en el log.
//
// Dos platos distintos pueden llevar la misma crema («Crema de calabacín con gambas encima» y «Crema de calabacín con
// huevos encima»). Si salen en la misma semana, la segunda es la crema que se guardó: va 2 o 3 días después (aguanta
// 3 días en la nevera, como las bases del ancla, bases.js:31) y una sola vez. La ficha libre de crema
// (crema_calabacin_queso_huevo) tiene la compra y la receta cerradas: no se repite con ninguna.
//
// Referencia de comportamiento: el hook medido (scripts/banco/medicion/variantesCremaRepetida.mjs --soloPlantilla).

import { DAYS_ORDER } from '../skeleton/days.js';

/** Días que aguanta la crema guardada: la segunda va 2 o 3 días después de la primera. */
export const DISTANCIAS_CREMA = Object.freeze([2, 3]);

/** El vegetal de una crema por su nombre visible («Crema de calabacín con…» → «calabacín»), o null si no es crema. */
export function vegetalDeCrema(nombre) {
  const m = String(nombre || '').match(/^crema (?:fría )?de ([a-záéíóúñ]+)/i);
  return m ? m[1].toLowerCase() : null;
}

const esPlantilla = (id) => typeof id === 'string' && id.startsWith('[');
const servido = (s) => !s.abierto && s.dishId && !(s.fixedRole === 'libre' && s.momento === 'comida');

/**
 * Filtro del pool de un hueco, con vuelta atrás: una crema cuyo vegetal ya está en la semana solo entra 2 o 3 días
 * después de la primera, una vez, y solo si las dos son de plantilla.
 */
export function filtrarCremas({ pool, day, momento, slots, nombrePorId, decisionLog }) {
  const i = DAYS_ORDER.indexOf(day);
  const puestas = [];
  for (const s of slots.values()) {
    if (!servido(s)) continue;
    const v = vegetalDeCrema(nombrePorId.get(s.dishId));
    if (v) puestas.push({ v, i: DAYS_ORDER.indexOf(s.day), day: s.day, id: s.dishId });
  }
  if (!puestas.length) return pool;
  const motivo = (d) => {
    const v = vegetalDeCrema(d.nombre || nombrePorId.get(d.id));
    if (!v) return null;
    const mismas = puestas.filter((x) => x.v === v);
    if (!mismas.length) return null;
    if (mismas.length >= 2) return `ya hay 2 cremas de ${v}`;
    if (!esPlantilla(d.id) || !esPlantilla(mismas[0].id)) return `crema de ${v} repetida con una ficha libre`;
    const dist = i - mismas[0].i;
    return DISTANCIAS_CREMA.includes(dist) ? null : `crema de ${v} a ${dist} días de la del ${mismas[0].day}`;
  };
  const fuera = pool.filter((d) => motivo(d));
  if (!fuera.length) return pool;
  const anota = (causa, evidencia) => decisionLog.push({ decisionId: `crema-${decisionLog.length}`, day, momentoCrema: momento, causa, evidencia, evento: true, alternativasDescartadas: [] });
  const sin = pool.filter((d) => !motivo(d));
  if (!sin.length) {
    anota('crema_repetida_sin_aplicar', `${day}/${momento}: todos los candidatos repiten crema fuera de su ventana; no se aplica`);
    return pool;
  }
  anota('crema_repetida_fuera_de_ventana', `${day}/${momento}: fuera ${fuera.length} candidatos (${[...new Set(fuera.map(motivo))].join('; ')}): una crema repetida va 2 o 3 días después de la primera`);
  return sin;
}

/**
 * Parejas de crema de la semana ya hecha: dos cremas de plantilla con el mismo vegetal a 2 o 3 días. La primera se
 * cocina el doble; la segunda es la crema guardada. Fuera de la ventana (la regla no se pudo aplicar) no hay pareja.
 * @returns {{vegetal: string, cocinar: {day, momento, dishId}, aprovechar: {day, momento, dishId}}[]}
 */
export function parejasDeCrema(slots, nombrePorId) {
  const cremas = slots.filter((s) => servido(s) && esPlantilla(s.dishId) && vegetalDeCrema(nombrePorId.get(s.dishId)))
    .map((s) => ({ s, v: vegetalDeCrema(nombrePorId.get(s.dishId)), i: DAYS_ORDER.indexOf(s.day) }))
    .sort((a, b) => a.i - b.i);
  const out = [];
  const usadas = new Set();
  for (let a = 0; a < cremas.length; a++) {
    for (let b = a + 1; b < cremas.length; b++) {
      if (usadas.has(a) || usadas.has(b) || cremas[a].v !== cremas[b].v || !DISTANCIAS_CREMA.includes(cremas[b].i - cremas[a].i)) continue;
      usadas.add(a); usadas.add(b);
      const hueco = ({ s }) => ({ day: s.day, momento: s.momento, dishId: s.dishId });
      out.push({ vegetal: cremas[a].v, cocinar: hueco(cremas[a]), aprovechar: hueco(cremas[b]) });
    }
  }
  return out;
}
