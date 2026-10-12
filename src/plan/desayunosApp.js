// desayunosApp — desayunos y tentempiés de engine2 en la app (D-110).
//
// La app prepara el catálogo para el perfil (src/data/DESAYUNOS.js adaptado a
// su dieta, a SIBO y a la lactosa, y sin lo que no puede comer) y engine2
// elige la rutina de la semana (src/engine2/desayunos/elegirDesayunos.js).
// El motor viejo ya no pone desayunos ni tentempiés en un plan de engine2.

import { DESAYUNOS, TENTEMPIES } from '../data/DESAYUNOS.js';
import { elegirDesayunos } from '../engine2/desayunos/elegirDesayunos.js';
import { adaptarComidaLactosa } from '../engine2/nutrientes/lactosa.js';
import { dietaDe } from '../engine2/nutrientes/dietas.js';
import { papelDe } from '../engine2/nutrientes/raciones.js';
import { COMPOSICION } from '../engine2/nutrientes/composicion.js';
import { adaptarSiProcede } from './adaptar.js';
import { intoleranciasDe } from './engine2App.js';
import { leerComida } from './medidor/leerComida.js';

export const HUECOS_DESAYUNO = Object.freeze(['Desayuno', 'Almuerzo', 'Merienda']);
const esHueco = (m) => !!m && m.time !== 'Comida' && m.time !== 'Cena';

const textoDe = (m) => [m.title, m.p1, m.p2, ...(m.shopping || []), ...((m.recipe || []).filter((x) => typeof x === 'string'))].join(' · ').toLowerCase();

/** Comida lista para el plan: adaptada al perfil y con las marcas de engine2. */
function adaptada(item, profile) {
  let m = { time: item.time, emoji: item.emoji, title: item.title, p1: item.p1, p2: item.p2, shopping: [...item.shopping], recipe: [...item.recipe], metadata: { ...item.metadata } };
  if (((profile && profile.intolerances) || []).includes('lactosa')) m = adaptarComidaLactosa(m);
  m = adaptarSiProcede(m, profile);
  return { ...m, _motor: 'engine2', _desayunoId: item.id };
}

/**
 * ¿Lleva algo que las raciones pueden subir para llegar a la proteína del
 * desayuno (huevo, tofu, embutido, pescado, yogur griego, queso fresco…)?
 * La leche, la bebida vegetal o el yogur de soja no bastan solos.
 */
export function tieneProteinaAjustable(meal) {
  return leerComida(meal).items.some((it) => papelDe(it.clave, COMPOSICION[it.clave]) === 'proteico');
}

/**
 * Desayunos y tentempiés que puede tomar este perfil, adaptados, con su ficha
 * y su grupo de preferencia: grupo 0 los desayunos con proteína que las
 * raciones pueden ajustar (llegan a la proteína mínima también con pocas
 * calorías); grupo 1 el resto. Los tentempiés, todos en el grupo 0.
 */
export function catalogoDesayunos(profile) {
  const dieta = dietaDe(profile);
  const eliminados = ((profile && profile.eliminatedFoods) || []).map((f) => String(f).toLowerCase().trim()).filter(Boolean);
  const out = [];
  for (const item of [...DESAYUNOS, ...TENTEMPIES]) {
    if (item.ficha.soloDieta && dieta === 'omnivora') continue;
    const meal = adaptada(item, profile);
    if (intoleranciasDe(meal, profile).length) continue;
    const texto = textoDe(meal);
    if (eliminados.some((e) => texto.includes(e))) continue;
    const grupo = item.tipo === 'desayuno' && !tieneProteinaAjustable(meal) ? 1 : 0;
    out.push({ id: item.id, tipo: item.tipo, grupo, ficha: item.ficha, meal });
  }
  return out;
}

/**
 * Pone los desayunos y tentempiés de engine2 en los huecos que dejó la
 * estructura del motor viejo (desayuno, media mañana, merienda).
 * @returns {{ days: object[], log: object[], desayunosSemana: string[] }}
 */
export function ponerDesayunos(days, profile, { seed, platosRecientes = [] } = {}) {
  const catalogo = catalogoDesayunos(profile);
  const porTitulo = new Map(catalogo.map((c) => [c.meal.title, c.id]));
  const recientes = platosRecientes.map((t) => porTitulo.get(t)).filter(Boolean);
  const dias = days.map((d) => ({ dia: d.name, huecos: (d.meals || []).filter(esHueco).map((m) => m.time) }));
  const { porDia, decisionLog } = elegirDesayunos({
    candidatos: catalogo, dias, seed, soloRapidos: profile && profile.tiempoCocina === 'poco', recientes,
  });
  const porId = new Map(catalogo.map((c) => [c.id, c]));
  const desayunosSemana = new Set();
  const nuevos = days.map((d) => ({
    ...d,
    meals: (d.meals || []).map((m) => {
      if (!esHueco(m)) return m;
      const id = (porDia[d.name] || {})[m.time];
      if (!id) return null;
      const elegido = porId.get(id).meal;
      desayunosSemana.add(elegido.title);
      return JSON.parse(JSON.stringify({ ...elegido, time: m.time }));
    }),
  }));
  return { days: nuevos, log: decisionLog.map((e) => ({ ...e, motor: 'engine2' })), desayunosSemana: [...desayunosSemana] };
}

/**
 * Alternativa a un desayuno o tentempié: el siguiente del catálogo del mismo
 * tipo (en su orden fijo), prefiriendo los que no salen ya en la semana. Cada
 * clic da uno distinto.
 */
export function alternativaDesayuno(plan, dayIdx, time, profile) {
  const day = plan.days[dayIdx];
  const actual = day.meals.find((m) => m && m.time === time);
  if (!actual) return null;
  const tipo = time === 'Desayuno' ? 'desayuno' : 'tentempie';
  // A media mañana, primero los que se pueden llevar.
  const delTipo = catalogoDesayunos(profile).filter((c) => c.tipo === tipo);
  const lista = (time === 'Almuerzo' ? [...delTipo.filter((c) => c.ficha.llevar), ...delTipo.filter((c) => !c.ficha.llevar)] : delTipo).map((c) => c.meal);
  const enSemana = new Set(plan.days.flatMap((d) => (d.meals || []).filter(Boolean).map((m) => m.title)));
  const desde = lista.findIndex((m) => m.title === actual.title);
  const orden = [...lista.slice(desde + 1), ...lista.slice(0, Math.max(desde, 0))].filter((m) => m.title !== actual.title);
  const nueva = orden.find((m) => !enSemana.has(m.title)) || orden[0];
  return nueva ? JSON.parse(JSON.stringify({ ...nueva, time })) : null;
}
