// Comidas cortas de proteína en perfiles sintéticos sin segundo posible: MEDICIÓN, no cambia reglas. Genera N semanas
// seguidas por la entrada de la app (generarPlan) del árbol <raíz> y vuelca, por semana: comidas y cenas servidas por
// debajo del 95 % de su objetivo de proteína, proteína del día frente a su objetivo, pescado, comidas dobles y si hubo
// sorteo de días de legumbre. Sirve para comparar dos árboles (esta rama y main, exportado con git archive) con el
// mismo medidor.
//   Perfiles SINTÉTICOS (como sin-lactosa-2000 sin la lactosa, 2000 kcal):
//     sin-carne-ave-2000: alimentos eliminados pollo, pavo, ternera, cerdo, conejo, jamón, lacón y guanciale
//     un-segundo-2000:    pollo, pavo, ternera, cerdo y alcachofa (solo un plato de conejo vale de segundo)
//     solo-pollo-2000:    pavo, ternera, cerdo, conejo, jamón, lacón y guanciale (la única carne es el pollo: 8 segundos, todos de pollo)
//     sin-garbanzos-guisantes-2000: garbanzos y guisantes eliminados
//     sin-legumbres-2000: intolerancia a legumbres
//   También vale cualquier perfil del banco (scripts/banco/perfiles.mjs), con sus kcal.
// Uso: node --import <resolver> scripts/banco/medicion/cortasProteina.mjs <raíz> <salida.json> <perfil> [semanas]
// Resumen: node scripts/banco/medicion/cortasProteina.mjs --resumen <salida.md> <etiqueta>=<archivo.json> ...
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const n2 = (x) => x.toFixed(2).replace('.', ',');
const n1 = (x) => x.toFixed(1).replace('.', ',');
if (process.argv[2] === '--resumen') {
  const salida = process.argv[3];
  const L = ['| Medición | Semanas | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Legumbre como plato único/sem | Pescado/sem | Comidas dobles/sem | Semanas con días sorteados | Infracciones de D-099.3 |', '|---|---|---|---|---|---|---|---|---|'];
  const familias = [];
  const guarnicion = ['| Medición | Legumbre/sem (guarnición + plato) | Semanas con una legumbre repetida | Semanas con el mismo hidrato en días seguidos | Pares de días seguidos con el mismo hidrato/sem | Suelo | Tope | Límite de cena | Guisantes y habitas | No repetir (aplicada / sin aplicar) | Semanas que no llegan a 2 | Semanas con 0 / 1 / 2 / 3 / más de 3 legumbres |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
  const hidratos = ['| Medición | Arroz | Patata | Boniato | Quinoa | Pasta | Legumbre (guarnición) | Sin hidrato de plantilla |', '|---|---|---|---|---|---|---|---|'];
  const repartoLeg = ['| Medición | Reparto por legumbre (por semana) |', '|---|---|'];
  const comparativa = ['| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
  const nuevas = ['| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |', '|---|---|---|---|---|---|---|---|---|---|'];
  for (const arg of process.argv.slice(4)) {
    const [etiqueta, f] = arg.split('=');
    const { semanas } = JSON.parse(fs.readFileSync(f, 'utf8'));
    const m = (k) => semanas.reduce((a, s) => a + s[k], 0) / semanas.length;
    const lu = semanas.every((s) => s.legumbreUnico != null) ? n2(m('legumbreUnico')) : '—';
    L.push(`| ${etiqueta} | ${semanas.length} | ${n2(m('cortas'))} | ${n1(m('protDia'))} % | ${lu} | ${n2(m('pescado'))} | ${n2(m('dobles'))} | ${semanas.filter((s) => s.sorteo).length} | ${semanas.every((s) => s.d099 != null) ? semanas.reduce((a, s) => a + s.d099, 0) : '—'} |`);
    if (semanas.every((s) => s.hidratoPor)) {
      const sum = (f) => semanas.reduce((a, s) => a + f(s), 0);
      const gq = (k) => sum((s) => s.guarn[k]);
      guarnicion.push(`| ${etiqueta} | ${n2(m('legGuarnicion') + m('legPlato'))} (${n2(m('legGuarnicion'))} + ${n2(m('legPlato'))}) | ${sum((s) => Number(s.legRepetida))} | ${sum((s) => Number(s.hidratoSeguidos > 0))} | ${n2(m('hidratoSeguidos'))} | ${gq('suelo')} | ${gq('tope')} | ${gq('cena')} | ${gq('verdes')} | ${gq('repetidaEvitada')} / ${gq('repetidaSinAplicar')} | ${sum((s) => Number(s.legGuarnicion + s.legPlato < 2))} | ${[0, 1, 2, 3].map((n) => sum((s) => Number(s.legGuarnicion + s.legPlato === n))).join(' / ')} / ${sum((s) => Number(s.legGuarnicion + s.legPlato > 3))} |`);
      const hq = (k) => n2(sum((s) => s.hidratoPor[k] || 0) / semanas.length);
      hidratos.push(`| ${etiqueta} | ${hq('arroz')} | ${hq('patata')} | ${hq('boniato')} | ${hq('quinoa')} | ${hq('pasta')} | ${hq('legumbre')} | ${n2(sum((s) => s.principales - Object.values(s.hidratoPor).reduce((a, x) => a + x, 0)) / semanas.length)} |`);
      const lp = {}; for (const s of semanas) for (const [k, v] of Object.entries(s.legPor)) lp[k] = (lp[k] || 0) + v;
      repartoLeg.push(`| ${etiqueta} | ${Object.entries(lp).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${n2(v / semanas.length)}`).join(' · ') || '—'} |`);
    }
    if (semanas.every((s) => s.platosPor)) {
      const g = (k) => n2(semanas.reduce((a, s) => a + (s.platosPor[k] || 0), 0) / semanas.length);
      const fuera = semanas.reduce((a, s) => a + s.fueraKcal, 0); const princ = semanas.reduce((a, s) => a + s.principales, 0);
      comparativa.push(`| ${etiqueta} | ${n2(m('cortas'))} | ${n1(m('protDia'))} % | ${n2(m('legumbre'))} | ${n2(m('pescado'))} | ${g('carneRoja')} | ${g('cerdo')} | ${g('ave')} | ${g('huevo')} | ${fuera} de ${princ} (${n1((100 * fuera) / princ)} %) | ${n1(m('mlDia'))} (${Math.round(Math.max(...semanas.map((s) => s.mlMax)))}) | ${semanas.reduce((a, s) => a + s.d099, 0)} |`);
    }
    if (semanas.every((s) => s.diasSorteados != null)) {
      const tot = (k) => semanas.reduce((a, s) => a + Number(s[k]), 0);
      nuevas.push(`| ${etiqueta} | ${n2(m('cortas'))} | ${n1(m('protDia'))} % | ${n2(m('legumbre'))} | ${n2(m('legumbreUnico'))} | ${n2(m('dobles'))} | ${tot('sorteadosSinLegumbre')} de ${tot('diasSorteados')} | ${tot('sinSegundoPosible')} | ${tot('d099')} | ${tot('red')} |`);
    }
    if (semanas.every((s) => s.servidosPor)) familias.push([etiqueta, semanas]);
  }
  // Por familia proteica del plato: servidos y cortos de proteína por semana.
  if (familias.length) {
    const claves = [...new Set(familias.flatMap(([, ss]) => ss.flatMap((s) => Object.keys(s.servidosPor))))].sort();
    L.push('', '| Medición | ' + claves.map((k) => `${k}: servidos / cortos`).join(' | ') + ' |', '|---|' + claves.map(() => '---|').join(''));
    for (const [etiqueta, ss] of familias) {
      const m = (o, k) => ss.reduce((a, s) => a + (s[o][k] || 0), 0) / ss.length;
      L.push(`| ${etiqueta} | ` + claves.map((k) => `${n2(m('servidosPor', k))} / ${n2(m('cortasPor', k))}`).join(' | ') + ' |');
    }
  }
  if (nuevas.length > 2) L.push('', ...nuevas);
  if (comparativa.length > 2) L.push('', ...comparativa);
  if (guarnicion.length > 2) L.push('', ...guarnicion, '', ...hidratos, '', ...repartoLeg);
  const texto = L.join('\n');
  console.log(texto);
  if (salida) fs.writeFileSync(salida, `${texto}\n`);
  process.exit(0);
}

const [raizArg, salidaArg, perfilId] = process.argv.slice(2);
const SEM = Number(process.argv.slice(5).find((x) => /^\d+$/.test(x)) || 200);
const raiz = pathToFileURL(raizArg.replace(/\/?$/, '/')).href;
const ACT = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(raiz + 'src/plan/generarPlan.js');
const { objetivoDe } = await import(raiz + 'src/plan/racionesApp.js');
const { FREEFORM_POOL } = await import(raiz + 'src/data/freeformPool.js');
const { catalogoApp } = await import(ACT + 'src/plan/catalogo.js');
const { proteinaPrincipal, familiaProteica, ESPECIES_PESCADO_MARISCO } = await import(ACT + 'src/engine2/dishes/bases.js');
const { composicionSemana } = await import(ACT + 'scripts/banco/metricas.mjs');
const { DAYS_ORDER } = await import(ACT + 'src/engine2/skeleton/days.js');
const { leerComida } = await import(ACT + 'src/plan/medidor/leerComida.js');
const { INGREDIENTES } = await import(ACT + 'src/engine2/nutrientes/ingredientes.js');
// ml de aceite de una comida (AOVE y aceite de semillas de la compra), como medirEstructura.mjs.
const mlAceite = (m) => leerComida(m).items.filter((it) => it.clave === 'aove' || it.clave === 'aceite_semillas').reduce((a, it) => a + it.gramos / (INGREDIENTES[it.clave].gMl || 0.92), 0);
// Reparto por proteína de cada plato servido (comida, segundo y cena), por especie.
// Especie de un plato de legumbre → nombre de la legumbre (para el reparto y las repeticiones).
const NOMBRE_LEG = { lentejas: 'lentejas pardinas', alubias: 'alubias blancas', alubias_negras: 'alubias negras', garbanzos: 'garbanzos' };
const GRUPO = { ternera: 'carneRoja', cerdo: 'cerdo', jamon: 'cerdo', lacon: 'cerdo', guanciale: 'cerdo', pollo: 'ave', pavo: 'ave', huevo: 'huevo', conejo: 'conejo' };
const { conPlatosDieta } = await import(ACT + 'src/plan/platosDieta.js');

const BASE = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} };
const M62 = { gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', trainingDays: ['Martes'] };
const PERFILES = {
  'sin-carne-ave-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['pollo', 'pavo', 'ternera', 'cerdo', 'conejo', 'jamón', 'lacón', 'guanciale'] },
  'un-segundo-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['pollo', 'pavo', 'ternera', 'cerdo', 'alcachofa'] },
  'solo-pollo-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['pavo', 'ternera', 'cerdo', 'conejo', 'jamón', 'lacón', 'guanciale'] },
  'sin-garbanzos-guisantes-2000': { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['garbanzos', 'guisantes'] },
  'sin-legumbres-2000': { ...BASE, ...M62, mealsPerDay: 4, intolerances: ['legumbres'] },
};
const { PERFILES: BANCO } = await import(ACT + 'scripts/banco/perfiles.mjs');
const delBanco = BANCO.find((x) => x.id === perfilId);
const perfil = PERFILES[perfilId] || (delBanco && delBanco.perfil);
const KCAL = delBanco ? delBanco.kcal : 2000;
if (!perfil) throw new Error(`cortasProteina: perfil desconocido ${perfilId}`);
const porId = new Map(catalogoApp().map((d) => [d.id, d]));
// Infracciones de D-099.3 sobre lo servido, con las métricas del banco (las mismas que medirEstructura.mjs).
const porIdBanco = new Map(conPlatosDieta(catalogoApp(), perfil, { reserva: true }).map((d) => [d.id, d]));
const obj = objetivoDe(perfil, KCAL);
const l = console.log; console.log = console.warn = console.error = () => {};
const semanas = [];
let ant = null;
for (let s = 60; s < 60 + SEM; s++) {
  const recientes = platosRecientesPara(ant, s - 1, s);
  const plan = generarPlan(JSON.parse(JSON.stringify(perfil)), KCAL, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: `banco-${perfilId}`, saveMealMemory: () => {}, platosRecientes: recientes });
  const c = composicionSemana(plan, porIdBanco, recientes);
  const d099 = c.platoRepetidoEnSemana + c.platoDeSemanaAnterior + c.especieMasDeDosVeces + c.especieMismoDia + c.especieDiasSeguidosSinAncla + c.legumbreEnCena;
  ant = plan;
  let cortas = 0; let pescado = 0; let dobles = 0; let prot = 0; let dias = 0; let legumbreUnico = 0;
  const servidosPor = {}; const cortasPor = {}; const platosPor = {}; let fueraKcal = 0; let principales = 0; const mlDias = [];
  const legPor = {}; const hidratoPor = {}; let legGuarnicion = 0; let legPlato = 0; const hidratosDia = [];
  let guarnConPan = 0; let panGuarn = 0;
  for (const d of plan.days) {
    const meals = d.meals.filter(Boolean);
    const hoy = new Set();
    if (!meals.some((m) => m.sugerencia) && d.raciones) { prot += d.raciones.proteina; dias += 1; }
    if (!meals.some((m) => m.sugerencia)) mlDias.push(meals.reduce((a, m) => a + mlAceite(m), 0));
    hidratosDia.push(hoy);
    for (const m of meals) {
      if ((m.time !== 'Comida' && m.time !== 'Cena') || m.sugerencia) continue;
      const fam = (porId.has(m._dishId) && familiaProteica(porId.get(m._dishId))) || 'sin familia';
      const corta = !!(m.nutricion && m.nutricion.proteina < 0.95 * m.nutricion.objetivoProteina);
      servidosPor[fam] = (servidosPor[fam] || 0) + 1;
      if (corta) { cortas += 1; cortasPor[fam] = (cortasPor[fam] || 0) + 1; }
      if (fam === 'legumbre' && !m._dishId2) legumbreUnico += 1;
      if (m._dishId2) dobles += 1;
      principales += 1;
      // Legumbre de la semana (guarnición o plato) e hidrato del plato.
      if (m._guarnicion) {
        legGuarnicion += 1; legPor[m._guarnicion.legumbre] = (legPor[m._guarnicion.legumbre] || 0) + 1;
        const pan = leerComida(m).items.filter((it) => String(it.clave).startsWith('pan')).reduce((a, it) => a + it.gramos, 0);
        if (pan > 0) { guarnConPan += 1; panGuarn += pan; }
      }
      else if (fam === 'legumbre') { legPlato += 1; const e = NOMBRE_LEG[proteinaPrincipal(porId.get(m._dishId))] || proteinaPrincipal(porId.get(m._dishId)); legPor[e] = (legPor[e] || 0) + 1; }
      let C = null; try { const t = JSON.parse(m._dishId); if (Array.isArray(t)) C = t[2]; } catch { C = null; }
      const h = m._guarnicion ? 'legumbre' : C;
      if (h) { hidratoPor[h] = (hidratoPor[h] || 0) + 1; hoy.add(h); }
      if (m.nutricion && Math.abs(m.nutricion.kcal - m.nutricion.objetivoKcal) > 0.05 * m.nutricion.objetivoKcal) fueraKcal += 1;
      for (const id of [m._dishId, m._dishId2].filter(Boolean)) {
        if (porId.has(id) && ESPECIES_PESCADO_MARISCO.has(proteinaPrincipal(porId.get(id)))) pescado += 1;
        const g = porId.has(id) ? GRUPO[proteinaPrincipal(porId.get(id))] : null;
        if (g) platosPor[g] = (platosPor[g] || 0) + 1;
      }
    }
  }
    const log = plan.decisionLog || [];
  const sorteo = log.find((e) => e.causa === 'dias_legumbre_sorteados');
  const diasSorteados = sorteo && Array.isArray(sorteo.dias) ? sorteo.dias : [];
  const sorteadosSinLegumbre = diasSorteados.filter((dia) => {
    const d = plan.days[DAYS_ORDER.indexOf(dia)];
    const m = d && d.meals.find((x) => x && x.time === 'Comida' && !x.sugerencia);
    return !(m && porId.has(m._dishId) && familiaProteica(porId.get(m._dishId)) === 'legumbre');
  }).length;
  let hidratoSeguidos = 0;
  for (let k = 0; k + 1 < hidratosDia.length; k++) if ([...hidratosDia[k]].some((x) => hidratosDia[k + 1].has(x))) hidratoSeguidos += 1;
  const g = (c) => log.filter((e) => e.causa === c).length;
  const guarn = { suelo: g('guarnicion_legumbre_suelo'), tope: g('guarnicion_legumbre_tope'), cena: g('guarnicion_legumbre_cena'), verdes: g('guarnicion_guisantes_habitas'), repetidaEvitada: g('guarnicion_legumbre_no_repetida'), repetidaSinAplicar: g('guarnicion_legumbre_no_repetida_sin_aplicar'), sinHueco: g('guarnicion_suelo_sin_hueco'), sinLegumbre: g('guarnicion_suelo_sin_legumbre_posible') };
  const legRepetida = Object.values(legPor).some((n) => n >= 2);
  const red = log.some((e) => e.causa === 'regla_legumbre_retirada_d099' || e.causa === 'regla_legumbre_retirada_pool_vacio');
  const sinSegundoPosible = log.filter((e) => e.causa === 'dia_legumbre_sin_segundo_posible').length;
  semanas.push({ s, motor: plan.motor, cortas, pescado, dobles, legumbreUnico, servidosPor, cortasPor, d099, legGuarnicion, legPlato, legPor, legRepetida, guarnConPan, panGuarn, hidratoPor, hidratoSeguidos, guarn, platosPor, fueraKcal, principales, mlDia: mlDias.length ? mlDias.reduce((a, x) => a + x, 0) / mlDias.length : 0, mlMax: Math.max(0, ...mlDias), legumbre: servidosPor.legumbre || 0, diasSorteados: diasSorteados.length, sorteadosSinLegumbre, red, sinSegundoPosible, protDia: dias ? (100 * prot) / dias / obj.proteina : 0, sorteo: (plan.decisionLog || []).some((e) => e.causa === 'dias_legumbre_sorteados') });
}
fs.writeFileSync(salidaArg, JSON.stringify({ perfil: perfilId, semanas }));
l(`${semanas.length} semanas → ${salidaArg} (motores: ${[...new Set(semanas.map((x) => x.motor))].join(', ')})`);
