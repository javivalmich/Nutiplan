// datosVisor — genera semanas de prueba de ambos motores para el visor de menús.
//
// Fuera de cualquier evaluación: usa semillas de prueba (por defecto
// 90001–90010), no las de Fase 7. Misma entrada que el generador de Fase 7
// (entradaLegacy / entradaEngine2 de casos.js), pero en semanas SEGUIDAS de un
// mismo usuario: la primera mitad con P1 y la segunda con P2. Cada motor
// recibe su memoria entre semanas:
//   - legacy: la misma que en producción (OriginalPlanApp.jsx): pastProteins =
//     getPastProteinFrequency(memoria) y saveMealMemory guarda las 4 últimas
//     semanas, con weekNumber consecutivo desde el de Fase 7.
//   - engine2: platosRecientes = platos servidos la semana anterior
//     (el motor que no conoce ese campo lo ignora).
// No escribe en el repo.
//
// Uso:
//   node scripts/visor/datosVisor.mjs <salida.json> [semillaInicial] [n]

import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { buildPlan } from '../../src/engine/buildPlan.js';
import { mulberry32 } from '../../src/engine/rng.js';
import { getPastProteinFrequency } from '../../src/engine/nutrition.js';
import { materializePlan } from '../../src/engine2/materializePlan.js';
import { loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';
import { resolveDishComposition } from '../../src/engine2/dishes/compositionResolver.js';
import {
  entradaLegacy, entradaEngine2, verificarEstrategia, verificarDiaLibreLegacy, verificarDiaLibreEngine2,
} from '../fase7/casos.js';

const salida = process.argv[2];
if (!salida) { console.error('uso: datosVisor.mjs <salida.json> [semillaInicial] [n]'); process.exit(1); }
const inicio = Number(process.argv[3] ?? 90001);
const n = Number(process.argv[4] ?? 10);

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const sinTilde = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const catalog = loadCatalog();
const nombrePorId = new Map(catalog.map((d) => [d.id, d.nombre]));
const nombre = (id) => nombrePorId.get(id) ?? id;
// Proteína principal (la del catálogo de engine2: tupla.P o claveP).
function proteinaDe(dish) {
  try { const v = resolveDishComposition(dish); return (v.tupla && v.tupla.P) || v.claveP || null; } catch { return null; }
}
// Evidencia legible: corta la lista de descartados y cambia ids por nombres.
const idsPorLongitud = [...nombrePorId.keys()].sort((a, b) => b.length - a.length);
function legible(texto) {
  if (!texto) return null;
  let t = texto.split('; descartados')[0];
  for (const id of idsPorLongitud) if (t.includes(id)) t = t.split(id).join(`«${nombrePorId.get(id)}»`);
  return t;
}

function legacySemana(plan) {
  return plan.days.map((d, i) => {
    const m = (t) => d.meals.find((x) => sinTilde(x.time).toLowerCase() === t);
    const celda = (meal) => (meal ? { plato: meal.title, proteina: (meal._spec && meal._spec.P) || null } : null);
    return {
      dia: DIAS[i],
      etiqueta: d.special || null,
      desayuno: celda(m('desayuno')),
      comida: celda(m('comida')),
      cena: celda(m('cena')),
    };
  });
}

function engine2Semana(plan) {
  const log = plan.decisionLog;
  const porHueco = new Map();
  for (const e of log) if (e.day && e.momento) porHueco.set(`${e.day}|${e.momento}`, e);
  const beats = new Map();
  for (const e of log) {
    if (typeof e.cause === 'string' && e.cause.startsWith('beat_dia_')) {
      const c = JSON.parse(e.consequence);
      beats.set(c.day, c);
    }
  }
  const capricho = log.find((e) => e.causa === 'capricho_degradado_a_rotativo');
  return plan.days.map((d, i) => {
    const beat = beats.get(d.day) || {};
    const celda = (momento) => {
      const meal = d.meals.find((x) => x.momento === momento);
      if (!meal) return null;
      const e = porHueco.get(`${d.day}|${momento}`) || {};
      return {
        plato: meal.dish.nombre,
        id: meal.dish.id,
        libre: !!meal.libre,
        proteina: proteinaDe(meal.dish),
        rol: meal.dish.rol,
        batchable: meal.dish.batchable,
        causa: e.causa || null,
        evidencia: legible(e.evidencia),
      };
    };
    return {
      dia: DIAS[i],
      etiqueta: beat.fixedRole || (beat.slotRole && beat.slotRole !== 'rotativo' ? beat.slotRole : null),
      slotRole: beat.slotRole || null,
      densidad: beat.density || null,
      capricho: !!(capricho && capricho.day === d.day),
      comida: celda('comida'),
      cena: celda('cena'),
    };
  });
}

function engine2Resumen(plan) {
  const log = plan.decisionLog;
  const by = (c) => log.find((e) => e.cause === c || (typeof e.cause === 'string' && e.cause.startsWith(c))) || (c === 'batchday' ? log.find((e) => e.cause === 'dia_cocinar_elegido') : undefined);
  const conseq = (c) => (by(c) ? by(c).consequence : null);
  const ev = (c) => (by(c) ? by(c).evidence : null);
  const anclaId = (conseq('eleccion_ancla') || '').replace(/^ancla elegida: /, '');
  return {
    esqueleto: (conseq('eleccion_esqueleto') || '').replace(/^esqueleto elegido: /, ''),
    ancla: anclaId ? (anclaId.startsWith('base:') ? anclaId.slice(5) : nombre(anclaId)) : null,
    anclaBase: anclaId.startsWith('base:'),
    cocinadoAntes: /domingo anterior/.test(conseq('batchday') || ''),
    diaElegido: /elegido por el usuario/.test(conseq('batchday') || ''),
    anclaId,
    batchDay: conseq('batchday'),
    sobras: conseq('aprovechamiento_sobras'),
    sobrasEvidencia: ev('aprovechamiento_sobras'),
    capricho: conseq('capricho'),
    caprichoDegradado: !!log.find((e) => e.causa === 'capricho_degradado_a_rotativo'),
  };
}

const head = execSync('git rev-parse HEAD').toString().trim();
const cambios = execSync('git status --porcelain -- src').toString().trimEnd().split('\n').filter(Boolean).map((l) => l.slice(3));
const variante = cambios.length ? `cambios sin commit en ${cambios.join(', ')}` : null;
// Respuesta de prueba a «¿quieres cocinar en cantidad?» y día elegido (solo la usa engine2).
const COCINAR = { P1: { activo: true, dia: 'Domingo' }, P2: { activo: true, dia: 'Miercoles' } };
const semanas = [];
const corridas = [
  { perfilId: 'P1', semillas: Array.from({ length: Math.ceil(n / 2) }, (_, k) => inicio + k) },
  { perfilId: 'P2', semillas: Array.from({ length: Math.floor(n / 2) }, (_, k) => inicio + Math.ceil(n / 2) + k) },
];
for (const { perfilId, semillas } of corridas) {
  let memoriaLegacy = [];
  const historialE2 = [];
  semillas.forEach((semilla, k) => {
    const eL = entradaLegacy(perfilId, semilla);
    const weekNumber = eL.opts.weekNumber + k;
    const legacy = buildPlan(eL.profile, eL.targetKcal, {
      ...eL.opts,
      weekNumber,
      pastProteins: getPastProteinFrequency(memoriaLegacy),
      saveMealMemory: (wk, L, D) => {
        memoriaLegacy = memoriaLegacy.filter((m) => m.week !== wk).slice(-3);
        memoriaLegacy.push({ week: wk, L, D });
      },
      rng: mulberry32(semilla),
    });
    const engine2 = materializePlan({
      ...entradaEngine2(perfilId, semilla),
      catalog,
      platosRecientes: historialE2.slice(-1).flat(),
      cocinarEnCantidad: COCINAR[perfilId],
    });
    verificarEstrategia(legacy, 'legacy');
    verificarEstrategia(engine2, 'engine2');
    verificarDiaLibreLegacy(legacy);
    verificarDiaLibreEngine2(engine2);
    historialE2.push(engine2.days.flatMap((d) => d.meals.map((m) => m.dish.id)));
    semanas.push({
      n: semanas.length + 1,
      semilla,
      perfil: perfilId,
      semanaDelUsuario: k + 1,
      legacy: { dias: legacySemana(legacy) },
      engine2: { dias: engine2Semana(engine2), resumen: engine2Resumen(engine2) },
    });
  });
}

fs.writeFileSync(salida, JSON.stringify({ head, variante, generadoEn: new Date().toISOString(), semanas }, null, 1));
console.log(`datosVisor: ${semanas.length} semanas (semillas ${inicio}–${inicio + n - 1}) en ${salida} (HEAD ${head.slice(0, 7)})`);
