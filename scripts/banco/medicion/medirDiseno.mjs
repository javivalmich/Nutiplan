// Diseño medido de pescado y legumbres: MEDICIÓN, no cambia reglas. Genera N semanas seguidas por
// perfil del banco (mismas semillas que el banco, desde la semana 60) y vuelca una fila por semana:
// pescado y legumbre servidos, días sin verdura, racha de pescado, kcal y proteína, reglas de
// D-099.3, restricciones, motor, y qué hizo el paso 4 (suelos atendidos, nivel de verdura, cortas
// sin candidato) y el filtro de familia del contrafactual B. Cada fila lleva además los platos de
// comida y cena (título, familia, especie, tipo de plato, kcal releídas) y las kcal de cada toma.
// Necesita el hook contrafactualesDiseno.mjs (con --cf=… aplica los contrafactuales en memoria).
// Uso: node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/contrafactualesDiseno.mjs \
//        scripts/banco/medicion/medirDiseno.mjs <salida.json> [--cf=A,B] [--semanas 80]
import fs from 'node:fs';

const R = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(R + 'src/plan/generarPlan.js');
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { conPlatosDieta } = await import(R + 'src/plan/platosDieta.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { DAYS_ORDER } = await import(R + 'src/engine2/skeleton/days.js');
const { PERFILES, clonar, SEMANA_INICIAL, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const { familiaDe, huecosSemana, composicionSemana, restriccionesSemana } = await import(R + 'scripts/banco/metricas.mjs');
const { filtrarCatalogo } = await import(R + 'src/plan/engine2App.js');
const { resolveDishComposition } = await import(R + 'src/engine2/dishes/compositionResolver.js');
const { satisfaceVerdura } = await import(R + 'src/engine2/walk/frequencies.js');
const { medirPlan, medirComida } = await import(R + 'src/plan/medidor/medir.js');
const { objetivoDe } = await import(R + 'src/plan/racionesApp.js');
const { COMPOSICION } = await import(R + 'src/engine2/nutrientes/composicion.js');

const args = process.argv.slice(2);
const salida = args[0];
if (!salida || salida.startsWith('--')) throw new Error('Falta el archivo de salida');
const iSem = args.indexOf('--semanas');
const SEMANAS = iSem >= 0 ? Number(args[iSem + 1]) : 80;
const flags = globalThis.__cfFlags || {};

const famMemo = new Map();
const familia = (d) => { if (!famMemo.has(d.id)) famMemo.set(d.id, familiaDe(d).familia); return famMemo.get(d.id); };
const esPescado = (f) => f === 'pescado' || f === 'marisco';
const verMemo = new Map();
const cubreVerdura = (d) => { if (!verMemo.has(d.id)) { let v = false; try { v = satisfaceVerdura(resolveDishComposition(d)); } catch { v = false; } verMemo.set(d.id, v); } return verMemo.get(d.id); };

// ─── Lógica de los contrafactuales (la llama el walk transformado por el hook) ──────────────
let walk = null;
let porIdWalk = new Map();
globalThis.__cf = {
  flags,
  momento: null,
  inicio() { walk = { B: { evaluados: 0, aplicado: 0, sinCandidato: 0 }, huecos: [] }; },
  hueco(h) {
    // Filtro de familia (Bm, en src/): se lee de la evidencia del hueco.
    if (h.omnivoro && !h.esSugerencia && !flags.sinBm) {
      walk.B.evaluados += 1;
      if (/^familia en dias seguidos sin aplicar/.test(h.notaFamilia || '')) walk.B.sinCandidato += 1;
      else if (h.notaFamilia) walk.B.aplicado += 1;
    }
    walk.huecos.push({ day: h.day, momento: h.momento, causaFreq: h.causaFreq, target: (String(h.notaFreq || '').match(/target="(\w+)"/) || [])[1] || null, sinCand: (String(h.notaFreq || '').match(/sin candidato en el pool post-A\/B: \[([^\]]*)\]/) || [])[1] || null });
  },
  // A: en la comida, primero los suelos semanales; si ninguno se puede atender, lo de siempre.
  elegirNivel: (flags.A || flags.A2) ? (input, original, { satisfaceVerdura: sv, resolver }) => {
    if (globalThis.__cf.momento !== 'comida') return original(input);
    const { day, state, candidatesB } = input;
    const sinVerduraHoy = !state.diasConVerdura.has(day);
    const semanal = original({ ...input, state: { ...state, diasConVerdura: new Set([...state.diasConVerdura, day]) } });
    if (semanal.causa !== 'frecuencia_semanal_atendida') return original(input);
    if (flags.A2 && sinVerduraHoy) {
      const conVerdura = semanal.nivel.filter((d) => sv(resolver(d)));
      if (conVerdura.length > 0 && conVerdura.length < semanal.nivel.length) {
        return { ...semanal, nivel: conVerdura, evidencia: `${semanal.evidencia}; dentro del nivel, ${conVerdura.length} de ${semanal.nivel.length} cubren la verdura de ${day} (de ${candidatesB.length} post-A/B)` };
      }
    }
    return semanal;
  } : null,
};

const silencio = (f) => { const l = console.log, e = console.error, w = console.warn; console.log = console.error = console.warn = () => {}; try { return f(); } finally { console.log = l; console.error = e; console.warn = w; } };

const out = { cf: Object.keys(flags).filter((k) => flags[k]), semanas: SEMANAS, semanaInicial: SEMANA_INICIAL, catalogo: {}, filas: [] };
for (const p of PERFILES) {
  const catalogoPerfil = conPlatosDieta(catalogoApp(), p.perfil, { reserva: true });
  const porId = new Map(catalogoPerfil.map((d) => [d.id, d]));
  porIdWalk = porId;
  const lista = silencio(() => filtrarCatalogo(catalogoApp(), p.perfil, p.kcal, {}).catalogo);
  for (const d of lista) if (!porId.has(d.id)) porId.set(d.id, d);
  const rot = (mo) => lista.filter((d) => d.rol === 'rotativo' && d.momento.includes(mo));
  const cuenta = (xs) => ({ n: xs.length, pescado: xs.filter((d) => esPescado(familia(d))).length, legumbre: xs.filter((d) => familia(d) === 'legumbre').length });
  out.catalogo[p.id] = { comida: cuenta(rot('comida')), cena: cuenta(rot('cena')) };
  const obj = objetivoDe(p.perfil, p.kcal);
  let ant = null;
  for (let s = SEMANA_INICIAL; s < SEMANA_INICIAL + SEMANAS; s++) {
    const recientes = platosRecientesPara(ant, s - 1, s);
    const opts = { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: recientes };
    walk = null;
    const plan = silencio(() => generarPlan(clonar(p.perfil), p.kcal, opts));
    const huecos = huecosSemana(plan, porId);
    const servidos = huecos.filter((h) => !h.libre);
    const sug = huecos.find((h) => h.libre);
    const c = composicionSemana(plan, porId, recientes);
    const x = restriccionesSemana(plan, p.perfil);
    const m = medirPlan(plan, { kcal: p.kcal, proteina: obj.proteina, peso: obj.pesoKg }, COMPOSICION);
    // Días sin verdura: ningún plato SERVIDO del día cubre la verdura (predicado del motor).
    let diasSinVerdura = 0; let sabadoSinVerdura = 0; let especieMismoDia = 0;
    for (let i = 0; i < 7; i++) {
      const hoy = servidos.filter((h) => h.dia === i);
      if (!hoy.some((h) => h.id && porId.has(h.id) && cubreVerdura(porId.get(h.id)))) { diasSinVerdura += 1; if (i === 5) sabadoSinVerdura += 1; }
      if (hoy.length === 2 && hoy[0].especie && hoy[0].especie === hoy[1].especie) especieMismoDia += 1;
    }
    const paso4 = { verdura: { comida: 0, cena: 0 }, suelo: {}, sinCand: {} };
    if (walk) for (const h of walk.huecos) {
      if (h.causaFreq === 'frecuencia_verdura_diaria') paso4.verdura[h.momento] += 1;
      if (h.causaFreq === 'frecuencia_semanal_atendida') { const k = `${h.target}|${h.momento}`; paso4.suelo[k] = (paso4.suelo[k] || 0) + 1; }
      if (h.causaFreq === 'frecuencia_corta_sin_candidato') { const k = `${h.sinCand}|${h.momento}`; paso4.sinCand[k] = (paso4.sinCand[k] || 0) + 1; }
    }
    // Platos de comida y cena, con las kcal releídas, y kcal de cada toma del día.
    const DIAS_PLAN = ['Comida', 'Cena'];
    const platos = huecos.map((h) => {
      const m0 = (plan.days[h.dia].meals || []).find((x) => x && x.time === (h.momento === 'comida' ? 'Comida' : 'Cena'));
      const d = h.id ? porId.get(h.id) : null;
      let tupla = null; try { tupla = d ? (resolveDishComposition(d).tupla || null) : null; } catch { tupla = null; }
      return { d: h.dia, mo: h.momento === 'comida' ? 'C' : 'N', libre: h.libre, t: h.titulo, f: h.familia, e: h.especie, pt: d ? d.plateType : null, comp: !!tupla, c: tupla ? tupla.C : undefined, kcal: m0 && !h.libre ? medirComida(m0, COMPOSICION).kcal : null };
    });
    const tomas = plan.days.map((dd) => (dd.meals || []).filter(Boolean).map((x) => [x.time, medirComida(x, COMPOSICION).kcal]));
    out.filas.push({
      platos, tomas,
      perfil: p.id, s, motor: plan.motor || 'legacy', aviso: plan.motorAviso ? String(plan.motorAviso).slice(0, 80) : null,
      pescado: c.pescado, pescadoComida: servidos.filter((h) => h.momento === 'comida' && esPescado(h.familia)).length, pescadoCena: servidos.filter((h) => h.momento === 'cena' && esPescado(h.familia)).length,
      legumbre: c.legumbre, rachaPescado: c.rachaPescado, sugerencia: sug ? sug.familia : null,
      diasSinVerdura, sabadoSinVerdura,
      desvio: m.desvioSemana, dentro: m.semanaDentro, kcalDia: m.mediaDia.kcal, protDia: m.mediaDia.proteina, cortas: m.comidasPrincipalesCortas, diasFueraKcal: m.diasFueraKcal,
      d099: { platoRepetidoEnSemana: c.platoRepetidoEnSemana, platoDeSemanaAnterior: c.platoDeSemanaAnterior, especieMasDeDosVeces: c.especieMasDeDosVeces, legumbreEnCena: c.legumbreEnCena, especieDiasSeguidosSinAncla: c.especieDiasSeguidosSinAncla, especieMismoDia },
      familiaDiasSeguidos: c.familiaDiasSeguidos, familiaDiasSeguidosSinAncla: c.familiaDiasSeguidosSinAncla, familiaMismoDia: c.familiaMismoDia,
      vetados: x.conVetado, eliminados: x.conEliminado,
      paso4, B: walk ? walk.B : null, huecosWalk: walk ? walk.huecos.length : 0,
    });
    ant = plan;
  }
  process.stderr.write(`  ${p.id} listo\n`);
}
fs.writeFileSync(salida, JSON.stringify(out));
console.log(`${out.filas.length} semanas → ${salida}`);
