// Auditoría B: pescado y familias proteicas. MEDICIÓN, no cambia reglas.
// Para los 12 perfiles del banco y 8 semanas (como el banco), mide:
//   - pescado servido por semana (pescado + marisco; la comida libre del sábado no cuenta como
//     servida, pero su plato sugerido sí lo elige el walk y cuenta para el suelo semanal);
//   - por cada hueco de pescado servido, qué lo produjo: P1a (ancla o sobras), el suelo semanal
//     de pescado (paso 4), el nivel de verdura del paso 4, candidato único o desempate al azar
//     entre candidatos equivalentes (y qué parte de ese nivel final era pescado);
//   - la proporción de pescado en los candidatos tras cada filtro del walk, en comida y en cena;
//   - la proporción de pescado del catálogo filtrado por perfil (rotativo), en comida y en cena;
//   - las rachas de 5 o más días con pescado y la causa de cada día;
//   - con --alternativas, la proporción de pescado en las alternativas (regenerarComida) de la
//     semana 60, por deseo.
// Necesita el hook contrafactualesPescado.mjs (instrumenta el walk; con --sin=… desactiva reglas).
// Uso: node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/contrafactualesPescado.mjs \
//        scripts/banco/medicion/auditoriaPescado.mjs [--sin=suelo,…] [--alternativas] [--json <salida>]
import fs from 'node:fs';

const R = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara, regenerarComida } = await import(R + 'src/plan/generarPlan.js');
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { conPlatosDieta } = await import(R + 'src/plan/platosDieta.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { DAYS_ORDER } = await import(R + 'src/engine2/skeleton/days.js');
const { PERFILES, clonar, SEMANA_INICIAL, SEMANAS_POR_DEFECTO, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const { familiaDe, huecosSemana } = await import(R + 'scripts/banco/metricas.mjs');
const { filtrarCatalogo } = await import(R + 'src/plan/engine2App.js');

const args = process.argv.slice(2);
const conAlternativas = args.includes('--alternativas');
const iJson = args.indexOf('--json');
const salidaJson = iJson >= 0 ? args[iJson + 1] : null;
const sinArg = args.find((a) => a.startsWith('--sin='));
const etiqueta = sinArg ? `sin ${sinArg.slice(6)}` : 'reglas actuales';

const famMemo = new Map();
const familia = (d) => { if (!famMemo.has(d.id)) famMemo.set(d.id, familiaDe(d).familia); return famMemo.get(d.id); };
const esPescado = (f) => f === 'pescado' || f === 'marisco';

// Lo que anota el walk instrumentado.
let walk = null;
globalThis.__audPescado = {
  inicio(p1aSlots) { walk = { p1a: new Map(p1aSlots.filter((s) => !s.abierto && s.dishId).map((s) => [`${s.day}|${s.momento}`, s])), huecos: new Map() }; },
  hueco(h) { walk.huecos.set(`${h.day}|${h.momento}`, h); },
};
const silencio = (f) => { const l = console.log, e = console.error; console.log = console.error = () => {}; try { return f(); } finally { console.log = l; console.error = e; } };
const ETAPAS = ['pool', 'tope', 'separacion', 'huevo', 'alino', 'prefA', 'prefB', 'paso4', 'paso5'];

const out = { etiqueta, perfiles: {} };
for (const p of PERFILES) {
  const catalogoPerfil = conPlatosDieta(catalogoApp(), p.perfil, { reserva: true });
  const porId = new Map(catalogoPerfil.map((d) => [d.id, d]));
  const lista = silencio(() => filtrarCatalogo(catalogoApp(), p.perfil, p.kcal, {}).catalogo);
  const rot = (mo) => lista.filter((d) => d.rol === 'rotativo' && d.momento.includes(mo));
  const prop = (xs) => ({ n: xs.length, pescado: xs.filter((d) => esPescado(familia(d))).length });
  const r = {
    catalogo: { comida: prop(rot('comida')), cena: prop(rot('cena')) },
    semanas: [], causas: {}, etapas: { comida: {}, cena: {} }, rachas: [], sugerenciaPescado: 0, alternativas: {},
  };
  for (const mo of ['comida', 'cena']) for (const e of ETAPAS) r.etapas[mo][e] = { huecos: 0, sumaFraccion: 0 };
  let ant = null;
  for (let s = SEMANA_INICIAL; s < SEMANA_INICIAL + SEMANAS_POR_DEFECTO; s++) {
    const opts = { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) };
    walk = null;
    const plan = silencio(() => generarPlan(clonar(p.perfil), p.kcal, opts));
    const huecos = huecosSemana(plan, porId);
    const servidos = huecos.filter((h) => !h.libre);
    const sug = huecos.find((h) => h.libre);
    if (sug && esPescado(sug.familia)) r.sugerenciaPescado += 1;
    const causaDe = (h) => {
      const k = `${DAYS_ORDER[h.dia]}|${h.momento}`;
      if (!walk) return { causa: 'sin_walk' };
      if (walk.p1a.has(k)) return { causa: 'P1a (ancla o sobras)' };
      const w = walk.huecos.get(k);
      if (!w) return { causa: 'capricho u otro' };
      const final = w.etapas.paso5;
      const frac = final.filter((d) => esPescado(familia(d))).length / final.length;
      if (w.causaFreq === 'frecuencia_semanal_atendida' && /target="pescado"/.test(w.notaFreq || '')) return { causa: 'suelo semanal de pescado', frac };
      if (w.causaFreq === 'frecuencia_verdura_diaria') return { causa: final.length === 1 ? 'nivel de verdura, candidato único' : 'nivel de verdura del día', frac };
      if (final.length === 1) return { causa: 'candidato único', frac };
      return { causa: w.causaFreq === 'frecuencia_corta_sin_candidato' ? 'azar (frecuencia corta sin candidato)' : 'azar entre equivalentes', frac };
    };
    // Proporción de pescado tras cada filtro.
    if (walk) for (const w of walk.huecos.values()) for (const e of ETAPAS) {
      const xs = w.etapas[e];
      if (!xs || !xs.length) continue;
      const t = r.etapas[w.momento][e];
      t.huecos += 1; t.sumaFraccion += xs.filter((d) => esPescado(familia(d))).length / xs.length;
    }
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const hoy = servidos.filter((h) => h.dia === i && esPescado(h.familia));
      dias.push(hoy.map((h) => ({ momento: h.momento, titulo: h.titulo, especie: h.especie, ...causaDe(h) })));
      for (const h of hoy) {
        const c = causaDe(h);
        const x = r.causas[c.causa] = r.causas[c.causa] || { huecos: 0, sumaFrac: 0, conFrac: 0 };
        x.huecos += 1;
        if (c.frac != null) { x.sumaFrac += c.frac; x.conFrac += 1; }
      }
    }
    let racha = 0, inicio = 0, max = 0;
    for (let i = 0; i < 7; i++) {
      if (dias[i].length) { if (!racha) inicio = i; racha += 1; } else racha = 0;
      if (racha > max) max = racha;
      if (racha >= 5 && (i === 6 || !dias[i + 1].length)) r.rachas.push({ semana: s, desde: DAYS_ORDER[inicio], dias: racha, detalle: dias.slice(inicio, i + 1).map((d, k) => `${DAYS_ORDER[inicio + k]}: ${d.map((x) => `${x.momento} «${x.titulo}» (${x.especie}) ← ${x.causa}${x.frac != null ? `, ${Math.round(x.frac * 100)} % pescado en el nivel final` : ''}`).join(' | ')}`) });
    }
    r.semanas.push({ semana: s, pescado: servidos.filter((h) => esPescado(h.familia)).length, comida: servidos.filter((h) => h.momento === 'comida' && esPescado(h.familia)).length, cena: servidos.filter((h) => h.momento === 'cena' && esPescado(h.familia)).length, racha: max, sugerencia: sug ? sug.familia : null });
    if (conAlternativas && s === SEMANA_INICIAL) {
      for (const deseo of ['comfort', 'ligero', 'rapido', 'diferente']) {
        const a = r.alternativas[deseo] = { total: 0, pescado: 0, desdePescado: 0, desdePescadoAPescado: 0 };
        for (const h of servidos) {
          const time = h.momento === 'comida' ? 'Comida' : 'Cena';
          let n;
          try { n = silencio(() => regenerarComida(plan, h.dia, time, deseo, p.perfil, p.kcal, opts)); } catch { continue; }
          const m = n && (n.days[h.dia].meals || []).find((x) => x && x.time === time);
          if (!m || !m._dishId || !porId.has(m._dishId)) continue;
          const f = familia(porId.get(m._dishId));
          a.total += 1; if (esPescado(f)) a.pescado += 1;
          if (esPescado(h.familia)) { a.desdePescado += 1; if (esPescado(f)) a.desdePescadoAPescado += 1; }
        }
      }
    }
    ant = plan;
  }
  out.perfiles[p.id] = r;
}

// ─── Informe ─────────────────────────────────────────────────────────────────
const pc = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : '—');
console.log(`\n=== ${etiqueta} ===`);
console.log('perfil                  pescado/sem media (máx) · comida · cena | racha máx · semanas racha≥5 | sugerencia sábado pescado | catálogo pescado comida · cena');
for (const [id, r] of Object.entries(out.perfiles)) {
  const s = r.semanas;
  const media = (k) => (s.reduce((a, x) => a + x[k], 0) / s.length).toFixed(1);
  console.log(`${id.padEnd(22)}  ${media('pescado')} (${Math.max(...s.map((x) => x.pescado))}) · ${media('comida')} · ${media('cena')} | ${Math.max(...s.map((x) => x.racha))} · ${s.filter((x) => x.racha >= 5).length} | ${r.sugerenciaPescado}/${s.length} | ${pc(r.catalogo.comida.pescado, r.catalogo.comida.n)} de ${r.catalogo.comida.n} · ${pc(r.catalogo.cena.pescado, r.catalogo.cena.n)} de ${r.catalogo.cena.n}`);
}
const total = {};
for (const r of Object.values(out.perfiles)) for (const [c, x] of Object.entries(r.causas)) { const t = total[c] = total[c] || { huecos: 0, sumaFrac: 0, conFrac: 0 }; t.huecos += x.huecos; t.sumaFrac += x.sumaFrac; t.conFrac += x.conFrac; }
const nTotal = Object.values(total).reduce((a, x) => a + x.huecos, 0);
console.log(`\nCausa de cada hueco de pescado servido (todos los perfiles, ${nTotal} huecos):`);
for (const [c, x] of Object.entries(total).sort((a, b) => b[1].huecos - a[1].huecos)) console.log(`  ${c.padEnd(40)} ${String(x.huecos).padStart(4)} (${pc(x.huecos, nTotal)})${x.conFrac ? `; pescado en el nivel final, media ${Math.round((100 * x.sumaFrac) / x.conFrac)} %` : ''}`);
console.log('\nPescado entre los candidatos tras cada filtro (media por hueco, todos los perfiles):');
for (const mo of ['comida', 'cena']) {
  const fila = ETAPAS.map((e) => { let h = 0, sf = 0; for (const r of Object.values(out.perfiles)) { h += r.etapas[mo][e].huecos; sf += r.etapas[mo][e].sumaFraccion; } return `${e} ${h ? Math.round((100 * sf) / h) : '—'} %`; });
  console.log(`  ${mo.padEnd(7)} ${fila.join(' → ')}`);
}
const rachas = Object.entries(out.perfiles).flatMap(([id, r]) => r.rachas.map((x) => ({ id, ...x })));
console.log(`\nRachas de 5 o más días con pescado: ${rachas.length}`);
for (const x of rachas) { console.log(`  ${x.id} semana ${x.semana}: ${x.dias} días desde el ${x.desde}`); for (const d of x.detalle) console.log(`      ${d}`); }
if (conAlternativas) {
  console.log('\nAlternativas de la semana 60 (regenerarComida), todos los perfiles:');
  for (const deseo of ['comfort', 'ligero', 'rapido', 'diferente']) {
    let t = 0, pz = 0, dp = 0, dpp = 0;
    for (const r of Object.values(out.perfiles)) { const a = r.alternativas[deseo]; if (!a) continue; t += a.total; pz += a.pescado; dp += a.desdePescado; dpp += a.desdePescadoAPescado; }
    console.log(`  ${deseo.padEnd(10)} ${pc(pz, t)} pescado (${pz}/${t}); desde un plato de pescado, ${pc(dpp, dp)} vuelve a ser pescado (${dpp}/${dp})`);
  }
}
if (salidaJson) fs.writeFileSync(salidaJson, JSON.stringify(out));
