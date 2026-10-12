// elegirDesayunos — desayunos y tentempiés de la semana (D-110).
//
// Como desayuna una persona de verdad: con rutina. Decisiones de Javi:
//   - Dos desayunos de diario que se alternan de lunes a viernes (L, X y V el
//     primero; M y J el segundo) y uno distinto el fin de semana (sábado y
//     domingo). Cambian cada semana.
//   - Tentempiés igual: dos a media mañana y dos por la tarde, alternos todos
//     los días de la semana, cambiando cada semana.
//
// Sin puntuación ni ranking (constitución, regla 1): cada hueco se rellena
// con una escalera de filtros, del más estricto al más suelto; el primer
// escalón con candidatos gana y, dentro de él, desempata el RNG sembrado.
// Cada elección deja su causa y el escalón en el que se resolvió.
//
// Los candidatos llegan ya filtrados por la app (intolerancias, dieta,
// alimentos eliminados) y con su ficha (src/data/DESAYUNOS.js):
//   { id, tipo: 'desayuno'|'tentempie', grupo, ficha: { rapido, finde, llevar, base } }
// grupo: orden de preferencia que decide la app (0 primero): los desayunos
// con proteína que las raciones pueden ajustar van antes; el cambio semanal
// se relaja antes que la proteína.

import { mulberry32, seedFromString } from '../skeleton/rng.js';
import { stripAccents } from '../skeleton/days.js';

const FIN_DE_SEMANA = new Set(['sabado', 'domingo']);
const esFinde = (dia) => FIN_DE_SEMANA.has(stripAccents(dia).toLowerCase());

/**
 * Rellena n elecciones bajando por la escalera. Cada escalón es
 * [nombre, (candidato, elegidos) => boolean].
 */
function elegirN(candidatos, n, escalones, rng) {
  const elegidos = [];
  const pasos = [];
  for (const [nombre, admite] of escalones) {
    while (elegidos.length < n) {
      const pool = candidatos.filter((c) => !elegidos.includes(c) && admite(c, elegidos));
      if (!pool.length) break;
      const idx = Math.floor(rng() * pool.length);
      elegidos.push(pool[idx]);
      pasos.push({ id: pool[idx].id, escalon: nombre, candidatos: pool.length, indice: idx });
    }
    if (elegidos.length >= n) break;
  }
  return { elegidos, pasos };
}

/**
 * @param {{
 *   candidatos: Array<{id:string, tipo:string, grupo:number, ficha:{rapido:boolean, finde:boolean, llevar:boolean, base:string}}>,
 *   dias: Array<{dia:string, huecos:string[]}>,
 *   seed: string,
 *   soloRapidos?: boolean,
 *   recientes?: string[],
 * }} args
 * @returns {{ porDia: Object<string, Object<string, string>>, decisionLog: object[] }}
 */
export function elegirDesayunos({ candidatos, dias, seed, soloRapidos = false, recientes = [] }) {
  const rng = mulberry32(seedFromString(`${seed}::desayunos`));
  const reciente = new Set(recientes);
  const log = [];
  const nota = (causa, momento, detalle) => log.push({ causa, momento, detalle });

  const desayunos = candidatos.filter((c) => c.tipo === 'desayuno');
  const tentempies = candidatos.filter((c) => c.tipo === 'tentempie');
  const g0 = (lista) => (lista.length ? Math.min(...lista.map((c) => c.grupo || 0)) : 0);
  const gD = g0(desayunos);
  const gT = g0(tentempies);
  const nuevo = (c) => !reciente.has(c.id);
  const baseNueva = (usadas) => (c, elegidos) => !usadas.has(c.ficha.base) && !elegidos.some((e) => e.ficha.base === c.ficha.base);

  const describir = (momento, r, que) => {
    for (const p of r.pasos) nota('desayuno_elegido', momento, `${que}: «${p.id}» (escalón «${p.escalon}»; RNG "::desayunos" -> índice ${p.indice} de ${p.candidatos})`);
  };

  const huecos = new Set(dias.flatMap((d) => d.huecos));

  // ─── Desayunos ─────────────────────────────────────────────────────────
  let diario = [];
  let finde = null;
  if (huecos.has('Desayuno') && desayunos.length) {
    const r = elegirN(desayunos, 2, [
      ['rápido, nuevo esta semana, preferido y distinto del otro', (c, el) => c.ficha.rapido && nuevo(c) && c.grupo === gD && baseNueva(new Set())(c, el)],
      ['rápido, nuevo esta semana y preferido', (c) => c.ficha.rapido && nuevo(c) && c.grupo === gD],
      ['rápido y preferido (se relaja el cambio semanal)', (c) => c.ficha.rapido && c.grupo === gD],
      ['rápido, nuevo esta semana y distinto del otro', (c, el) => c.ficha.rapido && nuevo(c) && baseNueva(new Set())(c, el)],
      ['rápido (se relaja el cambio semanal)', (c) => c.ficha.rapido],
      ['cualquiera (no quedan rápidos)', () => true],
    ], rng);
    diario = r.elegidos;
    describir('Desayuno', r, 'desayuno de diario');
    if (diario.length === 1) nota('desayuno_unico_de_diario', 'Desayuno', `solo hay un desayuno posible entre semana: «${diario[0].id}» todos los días`);

    const basesDiario = new Set(diario.map((c) => c.ficha.base));
    const enDiario = (c) => diario.includes(c);
    const deFinde = (c) => (soloRapidos ? c.ficha.rapido : c.ficha.finde);
    const rf = elegirN(desayunos, 1, [
      [soloRapidos ? 'rápido (poco tiempo para cocinar), nuevo, preferido y distinto' : 'de fin de semana, nuevo, preferido y distinto', (c) => deFinde(c) && nuevo(c) && !enDiario(c) && c.grupo === gD && !basesDiario.has(c.ficha.base)],
      [soloRapidos ? 'rápido, nuevo y preferido' : 'de fin de semana, nuevo y preferido', (c) => deFinde(c) && nuevo(c) && !enDiario(c) && c.grupo === gD],
      ['nuevo, preferido y distinto de los de diario', (c) => nuevo(c) && !enDiario(c) && c.grupo === gD && (!soloRapidos || c.ficha.rapido)],
      ['preferido y distinto de los de diario (se relaja el cambio semanal)', (c) => !enDiario(c) && c.grupo === gD && (!soloRapidos || c.ficha.rapido)],
      [soloRapidos ? 'rápido y nuevo' : 'de fin de semana y nuevo', (c) => deFinde(c) && nuevo(c) && !enDiario(c)],
      ['distinto de los de diario', (c) => !enDiario(c) && (!soloRapidos || c.ficha.rapido)],
      ['distinto de los de diario (aunque no sea rápido)', (c) => !enDiario(c)],
    ], rng);
    finde = rf.elegidos[0] || diario[0] || null;
    describir('Desayuno', rf, 'desayuno de fin de semana');
    if (!rf.elegidos.length && finde) nota('desayuno_finde_igual_que_diario', 'Desayuno', `no hay otro desayuno posible: el fin de semana también «${finde.id}»`);
  } else if (huecos.has('Desayuno')) {
    nota('sin_desayuno_posible', 'Desayuno', 'ningún desayuno del catálogo vale para este perfil');
  }

  // ─── Tentempiés ────────────────────────────────────────────────────────
  const basesDesayuno = new Set([...diario, finde].filter(Boolean).map((c) => c.ficha.base));
  let almuerzo = [];
  let merienda = [];
  if (huecos.has('Almuerzo') && tentempies.length) {
    const r = elegirN(tentempies, 2, [
      ['para llevar, nuevo, preferido y distinto del desayuno', (c, el) => c.ficha.llevar && nuevo(c) && c.grupo === gT && baseNueva(basesDesayuno)(c, el)],
      ['para llevar, nuevo y distinto del desayuno', (c, el) => c.ficha.llevar && nuevo(c) && baseNueva(basesDesayuno)(c, el)],
      ['para llevar y nuevo', (c) => c.ficha.llevar && nuevo(c)],
      ['para llevar (se relaja el cambio semanal)', (c) => c.ficha.llevar],
      ['cualquiera (no quedan para llevar)', () => true],
    ], rng);
    almuerzo = r.elegidos;
    describir('Almuerzo', r, 'media mañana');
  } else if (huecos.has('Almuerzo')) {
    nota('sin_tentempie_posible', 'Almuerzo', 'ningún tentempié del catálogo vale para este perfil');
  }
  if (huecos.has('Merienda') && tentempies.length) {
    const usadas = new Set([...basesDesayuno, ...almuerzo.map((c) => c.ficha.base)]);
    const enAlmuerzo = (c) => almuerzo.includes(c);
    const r = elegirN(tentempies, 2, [
      ['nuevo, preferido y distinto del desayuno y de media mañana', (c, el) => !enAlmuerzo(c) && nuevo(c) && c.grupo === gT && baseNueva(usadas)(c, el)],
      ['nuevo y distinto del desayuno y de media mañana', (c, el) => !enAlmuerzo(c) && nuevo(c) && baseNueva(usadas)(c, el)],
      ['nuevo y distinto de los de media mañana', (c) => !enAlmuerzo(c) && nuevo(c)],
      ['distinto de los de media mañana (se relaja el cambio semanal)', (c) => !enAlmuerzo(c)],
      ['cualquiera', () => true],
    ], rng);
    merienda = r.elegidos;
    describir('Merienda', r, 'merienda');
  } else if (huecos.has('Merienda')) {
    nota('sin_tentempie_posible', 'Merienda', 'ningún tentempié del catálogo vale para este perfil');
  }

  // ─── Reparto por días ──────────────────────────────────────────────────
  const porDia = {};
  let laborable = 0;
  dias.forEach((d, i) => {
    const out = {};
    if (d.huecos.includes('Desayuno') && diario.length) {
      if (esFinde(d.dia)) out.Desayuno = finde.id;
      else { out.Desayuno = diario[laborable % diario.length].id; laborable += 1; }
    }
    if (d.huecos.includes('Almuerzo') && almuerzo.length) out.Almuerzo = almuerzo[i % almuerzo.length].id;
    if (d.huecos.includes('Merienda') && merienda.length) out.Merienda = merienda[i % merienda.length].id;
    porDia[d.dia] = out;
  });
  nota('rutina_semanal', null, `diario: ${diario.map((c) => c.id).join(' / ') || '—'}; fin de semana: ${finde ? finde.id : '—'}; media mañana: ${almuerzo.map((c) => c.id).join(' / ') || '—'}; merienda: ${merienda.map((c) => c.id).join(' / ') || '—'}`);
  return { porDia, decisionLog: log };
}
