// ============================================================
// GATE 2 — Medición estadística del motor actual
// Instrumentación versionada (co-firmada, fix/sync-gates-medicion,
// D-015/D-016): WEEKLY_CAP se importa de producción (ya no hay copia
// local desincronizada) y opts.__noSlotHint es un flag real de
// buildPlan.js (ya no una sonda inexistente). El resto de analysis/
// sigue siendo scratch ad-hoc y NO versionado (.gitignore).
// Runner: vitest run analysis/gate2_measure.test.js
// ============================================================

import { describe, it, vi } from 'vitest';
import { buildPlan, WEEKLY_CAP } from '../src/engine/buildPlan.js';

// ─── PRNG (copiado verbatim del snapshot test) ───────────────
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── PROFILE / TARGET_KCAL / BASE_OPTS (copiados verbatim del snapshot test) ─
const PROFILE = {
  weight:       74,
  goal:         'maintain',       // → computeStrategy → "mantenimiento_equilibrado"
  activity:     'moderate',
  intolerances: [],
  trainingDays: [],
  extras:       {},
  mealsPerDay:  3,
  tiempoCocina: 'normal',
  experiencia:  'intermedio',
  simpleMode:   false,
  dob:          '1990-01-01',
  gender:       'male',
  height:       178,
};
const TARGET_KCAL = 2000;
const BASE_OPTS = {
  month:          5,       // June — deterministic seasonal pool
  weekNumber:     23,
  pastProteins:   {},
  freeFormPool:   [],      // neutralises CURRENT_WEEK Date dependency
};

// ─── CATEGORY MAP ────────────────────────────────────────────
// Replicado de CULINARY_FAMILY (buildPlan.js:160-168) +
// normalización del pool (L1202-1219)
const CATEGORY_MAP = {
  // ave (WEEKLY_CAP cap=4)
  pollo: 'ave',     pavo: 'ave',     conejo: 'ave',
  // pescado (WEEKLY_CAP cap=2)
  salmon: 'pescado', merluza: 'pescado', bacalao: 'pescado',
  dorada: 'pescado', sardinas: 'pescado', atun: 'pescado',
  // marisco (WEEKLY_CAP cap=1)
  gambas: 'marisco', calamares: 'marisco',
  // legumbre (WEEKLY_CAP cap=2)
  lentejas: 'legumbre', garbanzos: 'legumbre', alubias: 'legumbre',
  // singles con cap explícito
  ternera: 'ternera',
  cerdo:   'cerdo',
  huevo:   'huevo',
};

// plateType "pasta" overrides la categoría proteínica
// (pasta-pollo es un "día de pasta" aunque la familia sea ave)
function toCategory(rawP, plateType) {
  if (plateType === 'pasta') return 'pasta';
  if (!rawP)                 return 'unknown';
  return CATEGORY_MAP[rawP] || rawP;
}

// Key que usa WEEKLY_CAP para el tracking de caps
function toCapKey(rawP) {
  if (!rawP) return null;
  return CATEGORY_MAP[rawP] || rawP;
}

// WEEKLY_CAP: importada de producción (buildPlan.js) — D-015, fix/sync-gates-medicion.
// Antes era copia local desincronizada (pescado/legumbre/ave con valores pre-ae6b9e3).

// ─── RUNNER ──────────────────────────────────────────────────
// Instancia NUEVA de mulberry32 por cada llamada — nunca reutilizar
function run(seed, extraOpts = {}) {
  return buildPlan(
    JSON.parse(JSON.stringify(PROFILE)),
    TARGET_KCAL,
    { ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed), ...extraOpts },
  );
}

// ─── EXTRACCIÓN POR MEAL ─────────────────────────────────────
function getMealInfo(day, timeLabel) {
  if (day.special === 'libre') return { category: 'libre', rawP: null, plateType: null };
  const meal = day.meals && day.meals.find(m => m && m.time === timeLabel);
  if (!meal || !meal._spec) return { category: 'unknown', rawP: null, plateType: null };
  if (meal._spec.isFree)    return { category: 'libre',   rawP: null, plateType: null };
  const rawP     = meal._spec.P     || null;
  const plateType= meal._spec.plateType || null;
  return { category: toCategory(rawP, plateType), rawP, plateType };
}

const lunchInfo  = day => getMealInfo(day, 'Comida');
const dinnerInfo = day => getMealInfo(day, 'Cena');

// ─── FORMATEO ────────────────────────────────────────────────
function pad(s, w)  { return String(s).padEnd(w); }
function rpad(s, w) { return String(s).padStart(w); }
function pct(n, total) {
  if (total === 0 || n === 0) return '   -';
  return (n / total * 100).toFixed(1).padStart(5) + '%';
}
function hdr(title) {
  console.log('\n' + '─'.repeat(72));
  console.log('  ' + title);
  console.log('─'.repeat(72));
}

// ─── TESTS ───────────────────────────────────────────────────
describe('Gate 2 — Medición estadística del motor', () => {

  // ==========================================================
  // STAGE 0 — SELF-CHECK DE DETERMINISMO  (BLOQUEANTE)
  // ==========================================================
  it('Stage 0 — self-check de determinismo', () => {
    hdr('STAGE 0 — SELF-CHECK DE DETERMINISMO');
    console.log('  seed=12345, profile mantenimiento_equilibrado, kcal=2000\n');

    const a = run(12345);
    const b = run(12345);   // instancia mk(12345) recién creada

    const lA = a.days.map(d => lunchInfo(d).category);
    const lB = b.days.map(d => lunchInfo(d).category);
    const dA = a.days.map(d => dinnerInfo(d).category);
    const dB = b.days.map(d => dinnerInfo(d).category);

    console.log('  Almuerzo  A:', lA.join(', '));
    console.log('  Almuerzo  B:', lB.join(', '));
    console.log('  Cena      A:', dA.join(', '));
    console.log('  Cena      B:', dB.join(', '));

    const lunchOK  = JSON.stringify(lA) === JSON.stringify(lB);
    const dinnerOK = JSON.stringify(dA) === JSON.stringify(dB);
    const fullOK   = JSON.stringify(a.days.map(d => d.meals))
                   === JSON.stringify(b.days.map(d => d.meals));

    console.log('\n  Almuerzo idéntico :', lunchOK  ? 'SÍ ✓' : 'NO ✗');
    console.log('  Cena idéntica     :', dinnerOK ? 'SÍ ✓' : 'NO ✗');
    console.log('  Meals completas   :', fullOK   ? 'SÍ ✓' : 'NO ✗');

    if (!lunchOK || !dinnerOK) {
      for (let i = 0; i < lA.length; i++) {
        if (lA[i] !== lB[i]) console.log(`  !! Almuerzo día ${i} (${a.days[i].name}): A="${lA[i]}" B="${lB[i]}"`);
        if (dA[i] !== dB[i]) console.log(`  !! Cena    día ${i} (${a.days[i].name}): A="${dA[i]}" B="${dB[i]}"`);
      }
      throw new Error('NONDETERMINISMO FUERA DE opts.rng — DETENER ANÁLISIS');
    }

    console.log('\n  → RESULTADO: DETERMINISTA ✓');
  });

  // ==========================================================
  // STAGE 1 — ESTRUCTURA DEL OUTPUT  (read-only)
  // ==========================================================
  it('Stage 1 — estructura del output y ruta del campo proteína', () => {
    hdr('STAGE 1 — ESTRUCTURA DEL OUTPUT (seed 12345)');

    const days = run(12345).days;

    // Rutas de acceso
    console.log('  Ruta almuerzo: day.meals.find(m => m.time==="Comida")._spec.P → toCategory()');
    console.log('  Ruta cena    : day.meals.find(m => m.time==="Cena")._spec.P   → toCategory()');
    console.log('  Día libre    : day.special === "libre" → "libre"\n');

    // Slots esperados (mantenimiento_equilibrado)
    const SLOT_PROT = {
      Lunes:'pollo', Martes:'pescado', Miércoles:'ternera',
      Jueves:'legumbre', Viernes:'pavo', Sábado:'libre', Domingo:'pollo'
    };
    const SLOT_DINNER = {
      Lunes:'plancha_verdura', Martes:'pescado_horno', Miércoles:'plancha_verdura',
      Jueves:'huevo_plancha', Viernes:'sopa_crema', Sábado:'libre', Domingo:'plancha_verdura'
    };

    console.log('  ┌──────────────┬──────────────┬──────────┬──────────────────┬──────────┬─────────────┐');
    console.log('  │ Día          │ lunch rawP   │ cat      │ dinner rawP      │ cat      │ slot_match  │');
    console.log('  ├──────────────┼──────────────┼──────────┼──────────────────┼──────────┼─────────────┤');
    days.forEach(day => {
      const li = lunchInfo(day);
      const di = dinnerInfo(day);
      const slotP = SLOT_PROT[day.name] || '-';
      // Slot match: si la categoría real coincide con la familia del slot
      const slotFam = toCategory(slotP, null); // e.g. "pollo"→"ave" en CATEGORY_MAP... pero pollo→"ave"
      // Mapear slotP a categoría
      const slotCat = CATEGORY_MAP[slotP] || slotP; // pavo→ave, pollo→ave, etc.
      const lunchMatch = li.category === slotCat || li.category === slotP;
      const matchIcon  = (slotP === 'libre') ? '-' : lunchMatch ? '✓' : '✗';
      const rawL = li.rawP || (day.special === 'libre' ? 'libre' : 'null');
      const rawD = di.rawP || (day.special === 'libre' ? 'libre' : 'null');
      console.log(
        `  │ ${pad(day.name,12)} │ ${pad(rawL,12)} │ ${pad(li.category,8)} │ ${pad(rawD,16)} │ ${pad(di.category,8)} │ slot=${pad(slotP,6)}${matchIcon}   │`
      );
    });
    console.log('  └──────────────┴──────────────┴──────────┴──────────────────┴──────────┴─────────────┘');

    // Wildcard check
    const wildcardDay = days.find(d => d.meals && d.meals.some(m => m && m.wildcard));
    if (wildcardDay) {
      console.log(`\n  Wildcard activo en: ${wildcardDay.name} (slotHint ignorado para este día)`);
    } else {
      console.log('\n  No hay día wildcard en esta semana (depende del seed)');
    }
  });

  // ==========================================================
  // STAGE 2 — DISTRIBUCIÓN + ENTROPÍA  (N=500)
  // ==========================================================
  it('Stage 2 — distribución y entropía N=500', () => {
    const N = 500;
    hdr(`STAGE 2 — DISTRIBUCIÓN + ENTROPÍA | N=${N} semanas | seeds 1..${N}`);
    console.log('  Estrategia  : mantenimiento_equilibrado');
    console.log('  Profile     : weight=74, goal=maintain, activity=moderate, tiempoCocina=normal');
    console.log('  Target kcal : 2000');
    console.log('  Una instancia mk(i+1) nueva por cada semana\n');

    // ── Recolección única ──────────────────────────────────────
    // Cada semana: array de 7 {category, rawP, plateType} para almuerzo y cena
    const lunchCats  = [];  // lunchCats[i] = [cat_lun, ..., cat_dom]
    const dinnerCats = [];
    const lunchRaws  = [];  // rawP arrays (para T4)
    const dinnerRaws = [];

    for (let i = 0; i < N; i++) {
      const { days } = run(i + 1);
      lunchCats.push(days.map(d => lunchInfo(d).category));
      dinnerCats.push(days.map(d => dinnerInfo(d).category));
      lunchRaws.push(days.map(d => lunchInfo(d).rawP));
      dinnerRaws.push(days.map(d => dinnerInfo(d).rawP));
    }

    // ── T1 / T2: histograma días/semana ────────────────────────
    function printDistTable(label, catVecs) {
      const catSet = new Set();
      catVecs.forEach(w => w.forEach(c => catSet.add(c)));
      const cats = [...catSet].sort();

      // hist[cat][d] = número de semanas en que aparece exactamente d días
      const hist = {};
      cats.forEach(c => {
        hist[c] = Array(8).fill(0);
        catVecs.forEach(w => { hist[c][w.filter(x => x === c).length]++; });
      });

      // Ancho de columna
      const CW = 9;
      console.log(`\n  ${label}`);
      let h = `  ${'Categoría'.padEnd(12)}`;
      for (let d = 0; d <= 7; d++) h += `|${rpad(d + 'd', CW)}`;
      h += '| moda';
      console.log(h);
      console.log('  ' + '-'.repeat(12 + 8 * CW + 10));

      cats.forEach(c => {
        let row = `  ${pad(c, 12)}`;
        let modeD = 0, modeV = hist[c][0];
        for (let d = 0; d <= 7; d++) {
          if (hist[c][d] > modeV) { modeV = hist[c][d]; modeD = d; }
          row += `|${rpad(hist[c][d] > 0 ? pct(hist[c][d], N) : '-', CW)}`;
        }
        row += `|  ${modeD}d (${pct(modeV, N).trim()})`;
        console.log(row);
      });
    }

    printDistTable('T1 — ALMUERZO: días/semana por categoría', lunchCats);
    printDistTable('T2 — CENA: días/semana por categoría', dinnerCats);

    // ── T3: proteínas distintas por semana ─────────────────────
    hdr('T3 — Nº PROTEÍNAS DISTINTAS/SEMANA (almuerzo, excl. "libre")');
    const distinctHist = {};
    let totalEntropy = 0;

    lunchCats.forEach(w => {
      const nonFree = w.filter(c => c !== 'libre');
      const uniq = new Set(nonFree).size;
      distinctHist[uniq] = (distinctHist[uniq] || 0) + 1;

      // Entropía de Shannon
      const counts = {};
      nonFree.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
      const total = nonFree.length;
      if (total > 0) {
        const H = -Object.values(counts).reduce((acc, c) => {
          const p = c / total; return acc + p * Math.log2(p);
        }, 0);
        totalEntropy += H;
      }
    });

    const meanH   = totalEntropy / N;
    const maxH6   = Math.log2(6);   // 6 categorías posibles de proteína no-libre
    const maxH7   = Math.log2(7);   // si se incluye pasta

    const keys = Object.keys(distinctHist).map(Number).sort((a,b) => a-b);
    let cumul = 0;
    console.log(`  ${'Distintas'.padEnd(12)} | ${'N sem'.padStart(6)} | ${'%'.padStart(7)} | ${'Cumul%'.padStart(7)}`);
    console.log('  ' + '-'.repeat(42));
    keys.forEach(k => {
      cumul += distinctHist[k];
      console.log(
        `  ${pad(k + ' proteínas', 12)} | ${rpad(distinctHist[k], 6)} | ${pct(distinctHist[k], N)} | ${pct(cumul, N)}`
      );
    });
    console.log(`\n  Entropía media   : ${meanH.toFixed(3)} bits`);
    console.log(`  Máximo teórico   : ${maxH6.toFixed(3)} bits (6 cats) / ${maxH7.toFixed(3)} (7 con pasta)`);
    console.log(`  Relativa (6 cats): ${(meanH / maxH6 * 100).toFixed(1)}% del máximo`);

    // ── T4: choque con WEEKLY_CAP ──────────────────────────────
    hdr('T4 — CHOQUE CON WEEKLY_CAP (% semanas donde count >= cap)');

    // Contar cap keys combinando lunch + dinner
    const capHits = {};
    const capCats = Object.keys(WEEKLY_CAP);
    capCats.forEach(c => { capHits[c] = 0; });

    for (let i = 0; i < N; i++) {
      const weekCount = {};
      [...lunchRaws[i], ...dinnerRaws[i]].forEach(rawP => {
        if (!rawP) return;
        const ck = toCapKey(rawP);
        if (ck) weekCount[ck] = (weekCount[ck] || 0) + 1;
      });
      capCats.forEach(cat => {
        if ((weekCount[cat] || 0) >= WEEKLY_CAP[cat]) capHits[cat]++;
      });
    }

    console.log(`  ${'Cat'.padEnd(10)} | ${'Cap'.padStart(4)} | ${'N sem hit'.padStart(10)} | ${'%'.padStart(7)} | Diagnóstico`);
    console.log('  ' + '-'.repeat(64));
    capCats.forEach(cat => {
      const cap  = WEEKLY_CAP[cat];
      const hits = capHits[cat];
      const p    = (hits / N * 100).toFixed(1);
      const diag = hits >= N * 0.75 ? '⚠ LÍMITE DOMINANTE (>75% sem)'  :
                   hits >= N * 0.40 ? '→ activo en >40% semanas'         :
                   hits >= N * 0.10 ? '→ activo en >10% semanas'         :
                                      '  raramente toca el cap';
      console.log(`  ${pad(cat,10)} | ${rpad(cap,4)} | ${rpad(hits,10)} | ${p.padStart(6)}% | ${diag}`);
    });

    // ── T5: distribución POR DÍA (decisión Stage 3) ────────────
    hdr('T5 — DISTRIBUCIÓN POR DÍA DE LA SEMANA (almuerzo, N=500)');
    console.log('  Para cada día: % de veces que cada categoría fue elegida');
    console.log('  slot= = categoría indicada por WEEK_SLOTS[mantenimiento_equilibrado]\n');

    // Slot categories para la estrategia del perfil
    const SLOT_CAT = {
      Lunes:'ave',      Martes:'pescado',  Miércoles:'ternera',
      Jueves:'legumbre', Viernes:'ave',    Sábado:'libre',   Domingo:'ave'
    };
    const DAY_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

    // Todas las categorías de almuerzo (excl libre)
    const allCats = new Set();
    lunchCats.forEach(w => w.forEach(c => { if (c !== 'libre') allCats.add(c); }));
    const catList = [...allCats].sort();

    // Cabecera
    const CW2 = 9;
    let hLine = `  ${'Día'.padEnd(12)}`;
    catList.forEach(c => { hLine += `|${rpad(pad(c, CW2-1), CW2)}`; });
    hLine += '| slot_cat    | slot%  | top_cat     | top%';
    console.log(hLine);
    console.log('  ' + '-'.repeat(12 + catList.length * CW2 + 40));

    let slotDominates = 0;
    DAY_NAMES.forEach((dayName, di) => {
      const counts = {};
      catList.forEach(c => { counts[c] = 0; });
      lunchCats.forEach(w => {
        const cat = w[di];
        if (cat !== 'libre') counts[cat] = (counts[cat] || 0) + 1;
      });
      const dayTotal = Object.values(counts).reduce((a, b) => a + b, 0);

      let row = `  ${pad(dayName, 12)}`;
      let topCat = '', topCnt = 0;
      catList.forEach(c => {
        const cnt = counts[c] || 0;
        if (cnt > topCnt) { topCnt = cnt; topCat = c; }
        row += `|${rpad(cnt > 0 ? pct(cnt, dayTotal) : '-', CW2)}`;
      });

      const slotCat  = SLOT_CAT[dayName] || '-';
      const slotCnt  = counts[slotCat] || 0;
      const slotPctV = dayTotal > 0 ? (slotCnt / dayTotal * 100).toFixed(1) + '%' : '-';
      const topPctV  = dayTotal > 0 ? (topCnt  / dayTotal * 100).toFixed(1) + '%' : '-';

      // ¿La categoría del slot es la más frecuente?
      if (dayName !== 'Sábado' && topCat === slotCat) slotDominates++;

      row += `| ${pad(slotCat, 11)} | ${rpad(slotPctV, 6)} | ${pad(topCat, 11)} | ${topPctV}`;
      console.log(row);
    });

    // ── Lectura final ──────────────────────────────────────────
    hdr('LECTURA FINAL — ¿La proteína es diversa o el slot impone patrón?');

    // Entropía inter-semana: ¿varía la distribución entre semanas?
    // Usando índice de Gini-Simpson simplificado: varianza del vector semanal
    const weekEntropies = lunchCats.map(w => {
      const nonFree = w.filter(c => c !== 'libre');
      const uq = new Set(nonFree).size;
      return uq;
    });
    const meanDistinct = weekEntropies.reduce((a,b)=>a+b,0) / N;
    const varDistinct  = weekEntropies.reduce((a,b) => a + (b-meanDistinct)**2, 0) / N;

    console.log(`\n  Proteínas distintas/semana (almuerzo, excl libre):`);
    console.log(`    Media = ${meanDistinct.toFixed(2)} | σ = ${Math.sqrt(varDistinct).toFixed(2)}`);
    console.log(`    Min   = ${Math.min(...weekEntropies)} | Max = ${Math.max(...weekEntropies)}`);
    console.log(`\n  Entropía media de Shannon = ${meanH.toFixed(3)} bits (${(meanH/maxH6*100).toFixed(1)}% del máximo teórico 6-cats)`);
    console.log(`\n  Patrón por día (T5):`);
    console.log(`    Días donde la cat del slot es la más frecuente: ${slotDominates}/6 días laborables`);
    if (slotDominates >= 4) {
      console.log('    → El slot SÍSF impone un patrón por día visible. Stage 3 RECOMENDADO.');
    } else {
      console.log('    → El slot impone patrón moderado o bajo. Ver columna slot% en T5.');
    }
    console.log('\n  (Stage 3 condicional: ver tabla T5 para evidencia por día)');
  });

  // ════════════════════════════════════════════════════════════
  //  STAGE 3 — COMPARACIÓN A/B: con y sin slotHint  (N=500)
  //  opts.__noSlotHint === true (flag permanente default-off, D-015,
  //  fix/sync-gates-medicion): desactiva el slotBonus (:1782-1789) y la
  //  inyección forzosa al top-N (injectedHint, :2070-2083) en buildPlan.js.
  //  Con el flag ausente/false el comportamiento de producción es
  //  byte-idéntico — ver baselines/snapshots.
  // ════════════════════════════════════════════════════════════
  it('Stage 3 — impacto de slotHint por día A vs B (N=500)', { timeout: 30000 }, () => {
    const N = 500;
    const DAY_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
    const SLOT_CAT = {
      Lunes:     'ave',
      Martes:    'pescado',
      Miércoles: 'ternera',
      Jueves:    'legumbre',
      Viernes:   'ave',
      Sábado:    'libre',
      Domingo:   'ave',
    };

    // Ejecuta N semanas en el escenario indicado
    function runScenario(noSlotHint) {
      // perDay[dayIdx] = { [category]: count }
      const perDay = DAY_NAMES.map(() => ({}));
      const totals = DAY_NAMES.map(() => 0);

      for (let i = 0; i < N; i++) {
        const seed = i + 1;
        const result = buildPlan(
          JSON.parse(JSON.stringify(PROFILE)),
          TARGET_KCAL,
          { ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed),
            ...(noSlotHint ? { __noSlotHint: true } : {}) },
        );
        result.days.forEach((day, dIdx) => {
          const info = lunchInfo(day);
          perDay[dIdx][info.category] = (perDay[dIdx][info.category] || 0) + 1;
          totals[dIdx]++;
        });
      }
      return { perDay, totals };
    }

    const A = runScenario(false);
    const B = runScenario(true);

    // ── Tabla delta ──────────────────────────────────────────
    const sep = '─'.repeat(106);
    hdr('STAGE 3 — DISTRIBUCIÓN POR DÍA A (slotHint ON) vs B (slotHint OFF), N=500');
    console.log('  Para cada día: slot_cat% en A y B, y delta (B−A)');
    console.log('  Δ>0 = slot_cat aparece MÁS SIN slotHint (incoherente); Δ<0 = slot reduce la cat slot\n');

    const headerS3 = '  Día         | slot_cat    | A slot%  | B slot%  |   Δ(B-A) | A top_cat   | A top%   | B top_cat   | B top%';
    console.log(headerS3);
    console.log('  ' + '─'.repeat(104));

    DAY_NAMES.forEach((day, dIdx) => {
      const slotCat = SLOT_CAT[day];
      if (slotCat === 'libre') {
        console.log(`  ${day.padEnd(11)} | ${'libre'.padEnd(11)} | ${'─'.padStart(7)} | ${'─'.padStart(7)} | ${'─'.padStart(8)} | ${'─'.padEnd(11)} | ${'─'.padStart(7)} | ${'─'.padEnd(11)} | ${'─'.padStart(7)}`);
        return;
      }

      const aMap = A.perDay[dIdx];
      const bMap = B.perDay[dIdx];
      const aTotal = A.totals[dIdx] || 1;
      const bTotal = B.totals[dIdx] || 1;

      const aPct  = ((aMap[slotCat] || 0) / aTotal * 100);
      const bPct  = ((bMap[slotCat] || 0) / bTotal * 100);
      const delta = bPct - aPct;

      // top cat A
      const aTopCat = Object.entries(aMap).sort((x,y)=>y[1]-x[1])[0] || ['─', 0];
      const bTopCat = Object.entries(bMap).sort((x,y)=>y[1]-x[1])[0] || ['─', 0];
      const aTopPct = (aTopCat[1] / aTotal * 100).toFixed(1) + '%';
      const bTopPct = (bTopCat[1] / bTotal * 100).toFixed(1) + '%';

      const aPctV  = aPct.toFixed(1) + '%';
      const bPctV  = bPct.toFixed(1) + '%';
      const deltaV = (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%';

      console.log(
        `  ${day.padEnd(11)} | ${slotCat.padEnd(11)} | ${aPctV.padStart(7)} | ${bPctV.padStart(7)} | ${deltaV.padStart(8)} | ${aTopCat[0].padEnd(11)} | ${aTopPct.padStart(7)} | ${bTopCat[0].padEnd(11)} | ${bTopPct.padStart(7)}`
      );
    });

    // ── Tabla completa por categoría (solo días con slot visible) ────────────
    hdr('STAGE 3 — DISTRIBUCIÓN COMPLETA POR DÍA × CATEGORÍA');
    const CATS = ['ave','cerdo','huevo','legumbre','marisco','pasta','pescado','ternera'];

    DAY_NAMES.forEach((day, dIdx) => {
      if (SLOT_CAT[day] === 'libre') return;
      const aMap = A.perDay[dIdx];
      const bMap = B.perDay[dIdx];
      const aTotal = A.totals[dIdx] || 1;
      const bTotal = B.totals[dIdx] || 1;

      console.log(`\n  ${day} (slot=${SLOT_CAT[day]})`);
      console.log('    Cat         |   A%     |   B%     |   Δ(B-A)');
      console.log('    ' + '─'.repeat(46));
      CATS.forEach(cat => {
        const a = ((aMap[cat]||0)/aTotal*100);
        const b = ((bMap[cat]||0)/bTotal*100);
        if (a === 0 && b === 0) return;
        const d = b - a;
        const dV = (d>=0?'+':'')+d.toFixed(1)+'%';
        const marker = cat === SLOT_CAT[day] ? ' ←slot' : '';
        console.log(`    ${cat.padEnd(11)} | ${(a.toFixed(1)+'%').padStart(7)} | ${(b.toFixed(1)+'%').padStart(7)} | ${dV.padStart(8)}${marker}`);
      });
    });

    // ── Interpretación ──────────────────────────────────────
    hdr('STAGE 3 — INTERPRETACIÓN');
    console.log('  slotHint descarta 4 pts de score cuando protein coincide con slot.');
    console.log('  Si Δ(B-A) << 0 → sin slotHint, la categoría del slot cae → slotHint TIENE EFECTO causal.');
    console.log('  Si Δ(B-A) ≈ 0  → pool + WEEKLY_CAP ya convergen al slot sin necesidad del hint.');
    console.log('  Si Δ(B-A) >> 0 → sin slotHint aparece MÁS (paradoja: hint en realidad reprimía esa cat).\n');
  });

});
