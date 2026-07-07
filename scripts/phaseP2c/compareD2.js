// compareD2.js — Fase 4, Componente P2c (D2). Construye el artefacto de
// comparacion engine2 vs baseline legacy sobre las 9 fixtures del baseline
// aprobado (src/engine/tests/baselineFixtures.js), usando el adaptador D1
// (humanScoreAdapter.js) SIN MODIFICARLO.
//
// NO importa src/eval/** como modulo: el baseline se lee como dato
// (fs.readFileSync + JSON.parse sobre src/eval/baseline.json), nunca via
// import estatico/dinamico del paquete de evaluacion.
// NO toca src/engine2/**, src/eval/**, src/engine/**.
//
// Estrategia de comparacion E1 (ratificada por Javi, sesion P2c-D2): por
// cada una de las 9 fixtures legacy se construye la entrada engine2
// ANALOGA donde el concepto exista (trainingDays, intolerances); el resto
// del profile legacy (goal, weight, activity, hambre, experiencia) se
// declara SIN_TRADUCCION en TRANSLATION_TABLE, sin aproximaciones
// forzadas.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadCatalog } from '../../src/engine2/dishes/loadCatalog.js';
import { buildWeekArc } from '../../src/engine2/skeleton/buildWeekArc.js';
import { runWalk } from '../../src/engine2/walk/runWalk.js';
import { adaptHumanScore, ESTADOS } from './humanScoreAdapter.js';
import { FIXTURES } from '../../src/engine/tests/baselineFixtures.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BASELINE_PATH = path.resolve(__dirname, '../../src/eval/baseline.json');

function stripAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ─── Tabla de traduccion (global, por campo de profile legacy) ───────────
// Fuente: exploracion en vivo (sesion P2c-D2) de
// src/engine2/skeleton/buildWeekArc.js, src/engine2/walk/runWalk.js y
// src/engine2/contracts/profile.js. engine2 (F3/F4 actual) SOLO lee
// profile.trainingDays y profile.intolerances; el resto del profile
// legacy no tiene consumidor en engine2.
export const TRANSLATION_TABLE = Object.freeze([
  {
    campo: 'trainingDays',
    analogoEngine2: 'fixedRole "entreno" via profile.trainingDays',
    ubicacion: 'src/engine2/skeleton/buildWeekArc.js:100,105-113 (asignacion); '
      + 'src/engine2/walk/expandWeekArc.js:60-81 (propagacion a la cena del dia); '
      + 'src/engine2/contracts/profile.js:38-48 (validacion contra DAYS_ORDER exacto)',
    motivo: 'Traduccion directa. Se despojan tildes (p.ej. "Miércoles" -> '
      + '"Miercoles") porque DAYS_ORDER es ASCII por diseno (R7) y '
      + 'validateProfile compara contra ese vocabulario exacto -- no aplica '
      + 'la tolerancia a tildes de isSameDay. Es normalizacion de formato, '
      + 'no un cambio de concepto.',
  },
  {
    campo: 'intolerances',
    analogoEngine2: 'profile.intolerances (veto de ancla y de rotativo/capricho)',
    ubicacion: 'src/engine2/skeleton/buildWeekArc.js:332-333 (D-023, veto de ancla); '
      + 'src/engine2/walk/runWalk.js:177-178 (D-022, veto de rotativo/capricho); '
      + 'src/engine2/contracts/profile.js:17,50-60 (vocabulario cerrado gluten/lactosa)',
    motivo: 'Traduccion directa, sin normalizacion: el vocabulario legacy '
      + '(["lactosa","gluten"]) coincide exactamente con INTOLERANCE_VALUES.',
  },
  {
    campo: 'goal',
    analogoEngine2: 'SIN_TRADUCCION',
    motivo: 'engine2 no lee profile.goal en ningun archivo; confirmado por el '
      + 'test de control negativo de buildWeekArc.test.js que verifica que '
      + 'leer profile.goal romperia el desacoplo documentado (strategy es '
      + 'metadato pasivo).',
  },
  {
    campo: 'weight',
    analogoEngine2: 'SIN_TRADUCCION',
    motivo: 'Sin referencia alguna a profile.weight en src/engine2/.',
  },
  {
    campo: 'activity',
    analogoEngine2: 'SIN_TRADUCCION',
    motivo: 'Sin referencia alguna a profile.activity en src/engine2/.',
  },
  {
    campo: 'hambre',
    analogoEngine2: 'SIN_TRADUCCION',
    motivo: 'engine2 no modela apetito/saciedad; no hay campo ni concepto '
      + 'analogo en el walk ni en el esqueleto.',
  },
  {
    campo: 'experiencia',
    analogoEngine2: 'SIN_TRADUCCION',
    motivo: 'engine2 no modela nivel de experiencia ni "modo simple" '
      + '(simpleMode del motor viejo); sin campo ni concepto analogo.',
  },
]);

export function translateProfile(legacyProfile) {
  const trainingDays = (legacyProfile.trainingDays || []).map(stripAccents);
  const intolerances = legacyProfile.intolerances || [];
  return { trainingDays, intolerances };
}

/** seed = hash(userId + weekNumber) (CLAUDE.md, regla de determinismo). */
export function deriveSeed(fixture) {
  return `${fixture.userId}${fixture.weekNumber}`;
}

function buildEngine2Report(fixture, catalog) {
  const profile = translateProfile(fixture.profile);
  const seed = deriveSeed(fixture);
  const { weekArc } = buildWeekArc({ profile, seed, strategy: fixture.expectedStrategy });
  const { slots } = runWalk({
    weekArc, catalog, seed, profile,
  });
  return { profile, seed, report: adaptHumanScore({ slots, catalog }) };
}

export function loadBaselineData() {
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
}

export const SUBMETRICS = Object.freeze([
  'densidadDiaria', 'repeticionSalsa', 'repeticionTecnica', 'platoCuchara',
  'continuidadEntrenoHidrato', 'domingoReconfortante', 'diaFacilTrasElaborado',
  'repeticionProteinaMismoDia', 'sorpresaEditorial', 'usoSobrasVidaUtil',
  'alternanciaBatch', 'coherenciaCompraPerecederos',
]);

/**
 * Construye el artefacto de comparacion completo: 9 fixtures x 12
 * submetricas, ambos lados (legacy leido de baseline.json, engine2 vía
 * humanScoreAdapter sin modificar). Determinista: misma FIXTURES + mismo
 * baseline.json -> mismo artefacto, byte a byte (JSON.stringify estable
 * por orden de insercion, sin Set/Map en la salida).
 */
export function buildComparisonArtifact() {
  const catalog = loadCatalog();
  const baseline = loadBaselineData();

  const fixtures = FIXTURES.map((fixture) => {
    const { profile, seed, report } = buildEngine2Report(fixture, catalog);
    const legacyReport = baseline[fixture.name];
    if (!legacyReport) {
      throw new Error(`compareD2: fixture "${fixture.name}" no encontrada en baseline.json`);
    }

    const submetrics = {};
    for (const key of SUBMETRICS) {
      const eng2 = report[key];
      submetrics[key] = {
        legacy: {
          valor: legacyReport[key].valor,
          status: legacyReport[key].status,
        },
        engine2: {
          valor: eng2.valor,
          cobertura: eng2.cobertura,
          estado: eng2.estado,
          ...(eng2.motivo ? { motivo: eng2.motivo } : {}),
        },
        comparableDirecto: eng2.estado === ESTADOS.COMPLETA,
      };
    }

    return {
      name: fixture.name,
      legacyProfile: fixture.profile,
      engine2Profile: profile,
      seed,
      submetrics,
    };
  });

  return {
    generadoPor: 'scripts/phaseP2c/compareD2.js (F4-P2c-D2, D-025/D-020)',
    recordatorio: 'estado clasifica OBSERVABILIDAD en engine2, no resultado de '
      + 'ejecucion: no_observable/needs_history/needs_engine2 nunca es error '
      + '(D-025). Asimetria estructural de denominadores: legacy usa 2-5 '
      + 'meals/dia segun mealsPerDay del profile, engine2 usa 14 huecos fijos '
      + '(7 dias x comida/cena) -- las coberturas de ambos lados NO son '
      + 'conmensurables entre si.',
    translationTable: TRANSLATION_TABLE,
    fixtures,
  };
}

function renderMarkdownSummary(artifact) {
  const lines = [];
  lines.push('# Comparacion engine2 vs baseline legacy (F4-P2c-D2)');
  lines.push('');
  lines.push(`> ${artifact.recordatorio}`);
  lines.push('');
  lines.push('## Tabla de traduccion (profile legacy -> engine2)');
  lines.push('');
  lines.push('| campo | analogo engine2 | motivo |');
  lines.push('|---|---|---|');
  for (const row of artifact.translationTable) {
    lines.push(`| ${row.campo} | ${row.analogoEngine2} | ${row.motivo.replace(/\n/g, ' ')} |`);
  }
  lines.push('');

  for (const fixture of artifact.fixtures) {
    lines.push(`## ${fixture.name}`);
    lines.push('');
    lines.push(`- seed: \`${fixture.seed}\``);
    lines.push(`- engine2Profile: \`${JSON.stringify(fixture.engine2Profile)}\``);
    lines.push('');
    lines.push('| submetrica | estado engine2 | cobertura engine2 | status legacy | comparable directo |');
    lines.push('|---|---|---|---|---|');
    for (const key of SUBMETRICS) {
      const m = fixture.submetrics[key];
      lines.push(`| ${key} | ${m.engine2.estado} | ${m.engine2.cobertura.legibles}/${m.engine2.cobertura.total} | ${m.legacy.status} | ${m.comparableDirecto ? 'si' : 'no'} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── CLI: node scripts/phaseP2c/compareD2.js -> escribe output/ ─────────
// Mismo idiom que scripts/phaseB2/exportCocinero.js:388 (precedente en repo).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const artifact = buildComparisonArtifact();
  const outDir = path.resolve(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'comparacion-D2.json'), `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'comparacion-D2.md'), renderMarkdownSummary(artifact));
  console.log('Artefacto escrito en scripts/phaseP2c/output/comparacion-D2.{json,md}');
}
