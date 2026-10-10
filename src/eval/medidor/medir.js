// medir — lo que lleva de verdad un plan (kcal, proteína, hidratos, grasa) y
// cómo queda frente al objetivo del usuario, con los criterios acordados con
// Javi el 2026-10-11:
//   1. Proteína mínima en cada comida principal (desayuno, comida, cena):
//      0,3 g por kg de peso.
//   2. Calorías de la semana dentro de ±5 % del objetivo; cada día, ±10 %.
//   3. Reparto del día en rangos: desayuno 20–25 %, comida 35–40 %,
//      cena 25–30 %, tentempiés 10–15 % (todos juntos). Si el día no tiene
//      tentempiés (3 comidas o menos), su parte (12,5 % de media) se reparte
//      en proporción entre las demás: cada límite se divide entre 0,875.
// La comida libre del sábado no se mide (no hay plato fijo): ese día queda
// fuera de los totales y se informa aparte.
//
// Es un instrumento de medida (eval): nada de engine2 lo importa.

import { leerComida } from './leerComida.js';

export const CRITERIOS = Object.freeze({
  proteinaMinPorKgComida: 0.3,
  margenSemana: 0.05,
  margenDia: 0.10,
  reparto: Object.freeze({
    desayuno: [0.20, 0.25],
    comida: [0.35, 0.40],
    cena: [0.25, 0.30],
    tentempies: [0.10, 0.15],
  }),
});

const PRINCIPALES = new Set(['Desayuno', 'Comida', 'Cena']);
const momentoDe = (time) => (time === 'Desayuno' ? 'desayuno' : time === 'Comida' ? 'comida' : time === 'Cena' ? 'cena' : 'tentempies');

const cero = () => ({ kcal: 0, proteina: 0, hidratos: 0, grasa: 0 });
const sumar = (a, b) => ({ kcal: a.kcal + b.kcal, proteina: a.proteina + b.proteina, hidratos: a.hidratos + b.hidratos, grasa: a.grasa + b.grasa });
const redondear = (t) => ({ kcal: Math.round(t.kcal), proteina: Math.round(t.proteina), hidratos: Math.round(t.hidratos), grasa: Math.round(t.grasa) });

/**
 * Nutrientes de una comida.
 * @param {object} meal comida del plan
 * @param {Record<string,{kcal:number,proteina:number,hidratos:number,grasa:number}>} composicion por 100 g
 */
export function medirComida(meal, composicion) {
  const lectura = leerComida(meal);
  let total = cero();
  const sinDato = [];
  for (const it of lectura.items) {
    const c = composicion[it.clave];
    if (!c) { sinDato.push(it.clave); continue; }
    const f = it.gramos / 100;
    total = sumar(total, { kcal: c.kcal * f, proteina: c.proteina * f, hidratos: c.hidratos * f, grasa: c.grasa * f });
  }
  return { ...redondear(total), libre: lectura.libre, sinCantidad: lectura.sinCantidad, sinDato, estimados: lectura.items.filter((i) => /estimado/.test(i.como)).length };
}

/**
 * Mide un plan semanal frente a su objetivo.
 * @param {{days: {name:string, meals: object[]}[]}} plan
 * @param {{kcal:number, proteina:number, peso:number}} objetivo objetivo diario
 * @param {object} composicion
 */
export function medirPlan(plan, objetivo, composicion) {
  const minProtComida = CRITERIOS.proteinaMinPorKgComida * objetivo.peso;
  const dias = [];
  for (const d of plan.days) {
    const comidas = (d.meals || []).filter(Boolean).map((m) => ({ momento: momentoDe(m.time), principal: PRINCIPALES.has(m.time), titulo: m.title, ...medirComida(m, composicion) }));
    const libre = comidas.some((c) => c.libre);
    const total = comidas.reduce((a, c) => sumar(a, c), cero());
    const porMomento = {};
    for (const c of comidas) porMomento[c.momento] = (porMomento[c.momento] || 0) + c.kcal;
    const reparto = {};
    const escala = 'tentempies' in porMomento ? 1 : 1 / 0.875;
    for (const [mom, [lo0, hi0]] of Object.entries(CRITERIOS.reparto)) {
      if (!(mom in porMomento)) continue;
      const lo = lo0 * escala;
      const hi = hi0 * escala;
      const pct = total.kcal ? porMomento[mom] / total.kcal : 0;
      reparto[mom] = { pct: Math.round(pct * 1000) / 10, dentro: pct >= lo - 1e-9 && pct <= hi + 1e-9 };
    }
    dias.push({
      dia: d.name,
      libre,
      total: redondear(total),
      desvioKcal: objetivo.kcal ? Math.round(((total.kcal / objetivo.kcal) - 1) * 1000) / 10 : null,
      kcalDentro: !libre && Math.abs(total.kcal / objetivo.kcal - 1) <= CRITERIOS.margenDia,
      proteinaDentro: !libre && total.proteina >= objetivo.proteina,
      comidas: comidas.map((c) => ({ ...c, proteinaSuficiente: c.principal && !c.libre ? c.proteina >= minProtComida : null })),
      reparto,
    });
  }
  const medibles = dias.filter((d) => !d.libre);
  const media = medibles.reduce((a, d) => sumar(a, d.total), cero());
  const n = medibles.length || 1;
  const mediaDia = redondear({ kcal: media.kcal / n, proteina: media.proteina / n, hidratos: media.hidratos / n, grasa: media.grasa / n });
  const principales = medibles.flatMap((d) => d.comidas.filter((c) => c.principal));
  return {
    objetivo,
    minProteinaComida: Math.round(minProtComida),
    mediaDia,
    desvioSemana: Math.round(((mediaDia.kcal / objetivo.kcal) - 1) * 1000) / 10,
    semanaDentro: Math.abs(mediaDia.kcal / objetivo.kcal - 1) <= CRITERIOS.margenSemana,
    diasFueraKcal: medibles.filter((d) => !d.kcalDentro).length,
    diasSinProteina: medibles.filter((d) => !d.proteinaDentro).length,
    comidasPrincipalesCortas: principales.filter((c) => c.proteinaSuficiente === false).length,
    comidasPrincipales: principales.length,
    dias,
  };
}
