// Estructura de la comida: MEDICIÓN, no cambia reglas. Genera N semanas seguidas por perfil del
// banco (mismas semillas que el banco, desde la semana 60) con el walk transformado en memoria por
// estructuraComida.mjs, monta la comida con primero y segundo, la raciona con ajustarDia y vuelca una
// fila por semana. Con --ec=off mide las reglas actuales con las mismas métricas.
// Los perfiles vegetariano y vegano no se miden: la regla no se les aplica (no hay segundos).
// Uso: node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/estructuraComida.mjs \
//        scripts/banco/medicion/medirEstructura.mjs <salida.json> --ec=suelo3,pescado,todas [--semanas 200]
//        [--perfiles omni-2174,omni-1434] [--texto <salida.md>]
import fs from 'node:fs';

const R = new URL('../../../', import.meta.url).href;
const { generarPlan, platosRecientesPara } = await import(R + 'src/plan/generarPlan.js');
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { conPlatosDieta } = await import(R + 'src/plan/platosDieta.js');
const { FREEFORM_POOL } = await import(R + 'src/data/freeformPool.js');
const { DAYS_ORDER } = await import(R + 'src/engine2/skeleton/days.js');
const { PERFILES, clonar, SEMANA_INICIAL, MES } = await import(R + 'scripts/banco/perfiles.mjs');
const { restriccionesSemana } = await import(R + 'scripts/banco/metricas.mjs');
const { resolveDishComposition } = await import(R + 'src/engine2/dishes/compositionResolver.js');
const { aplicarAjustesD099 } = await import(R + 'src/engine2/dishes/ajustesD099.js');
const { aplicarNombresD105 } = await import(R + 'src/engine2/dishes/alinosD105.js');
const { satisfaceVerdura } = await import(R + 'src/engine2/walk/frequencies.js');
const { medirPlan } = await import(R + 'src/plan/medidor/medir.js');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { objetivoDe, batidoDelDia, vetadosDe, ajustarDia } = await import(R + 'src/plan/racionesApp.js');
const { racionesDia, papelDe } = await import(R + 'src/engine2/nutrientes/raciones.js');
const { COMPOSICION } = await import(R + 'src/engine2/nutrientes/composicion.js');
const { INGREDIENTES } = await import(R + 'src/engine2/nutrientes/ingredientes.js');
const { componerPlato } = await import(R + 'src/plan/textos/componer.js');
const { instalar, construirPS, esCompuestoLegumbre } = await import(R + 'scripts/banco/medicion/estructuraComidaLogica.mjs');

const args = process.argv.slice(2);
const salida = args[0];
if (!salida || salida.startsWith('--')) throw new Error('Falta el archivo de salida');
const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const SEMANAS = Number(valor('--semanas') || 200);
const soloPerfiles = valor('--perfiles') ? valor('--perfiles').split(',') : null;
const salidaTexto = valor('--texto');
const flags = globalThis.__ecFlags || { off: true };
const silencio = (f) => { const l = console.log, e = console.error, w = console.warn; console.log = console.error = console.warn = () => {}; try { return f(); } finally { console.log = l; console.error = e; console.warn = w; } };
const MOM = { Desayuno: 'desayuno', Comida: 'comida', Cena: 'cena' };
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const famDe = (d) => { try { const v = resolveDishComposition(d); return { familia: v.proteinType || null, especie: (v.tupla && v.tupla.P) || v.claveP || null }; } catch { return { familia: null, especie: null }; } };
const verdura = (d) => { try { return satisfaceVerdura(resolveDishComposition(d)); } catch { return false; } };
const esLeg = (clave) => (INGREDIENTES[clave] || {}).grupo === 'legumbre';
const esProteico = (clave) => !!COMPOSICION[clave] && papelDe(clave, COMPOSICION[clave]) === 'proteico';

// ─── Tope de la legumbre del primero: lo que recibe el plato único a 2174 kcal ───────────────
// (antes de instalar la lógica: globalThis.__ec no existe y el código transformado no hace nada).
const topes = new Map();
{
  const p = PERFILES.find((x) => x.id === 'omni-2174');
  const plan = silencio(() => generarPlan(clonar(p.perfil), p.kcal, { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: SEMANA_INICIAL, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: [] }));
  const day = plan.days[2];
  const iComida = day.meals.findIndex((m) => m && m.time === 'Comida');
  const comidas = [];
  day.meals.forEach((m, i) => {
    if (!m) return;
    const b = m._base || m;
    const l = leerComida(b);
    comidas.push({ id: String(i), momento: MOM[b.time] || 'tentempie', libre: l.libre || !!(b._spec && b._spec.isFree), items: l.items.map((it) => ({ clave: it.clave, gramos: it.gramos, unidad: it.como === 'ud' ? 'ud' : 'g', fijo: /estimado/.test(it.como) })) });
  });
  for (const d of aplicarAjustesD099(catalogoApp()).filter(esCompuestoLegumbre)) {
    const items = leerComida(silencio(() => componerPlato(d, 'comida', p.kcal))).items.map((it) => ({ clave: it.clave, gramos: it.gramos, unidad: it.como === 'ud' ? 'ud' : 'g', fijo: /estimado/.test(it.como) }));
    const r = racionesDia({ comidas: comidas.map((c) => (c.id === String(iComida) ? { ...c, items } : c)), aparte: [], objetivo: objetivoDe(p.perfil, p.kcal), composicion: COMPOSICION, vetados: vetadosDe(p.perfil) });
    topes.set(d.id, Math.round(r.comidas[String(iComida)].items.filter((i) => esLeg(i.clave)).reduce((a, i) => a + i.gramos, 0)));
  }
}
if (!flags.off) instalar(flags);

// ─── Montaje de las comidas con primero y segundo sobre el plan ya generado ──────────────────
function aplicarEstructura(plan, p, visible) {
  const segs = (plan.decisionLog || []).filter((e) => e.causa === 'segundo_de_legumbre');
  if (!segs.length) return plan;
  const days = plan.days.slice();
  const nombres = [];
  for (const e of segs) {
    const i = DAYS_ORDER.indexOf(e.day);
    const day = days[i];
    const k = day.meals.findIndex((m) => m && m.time === 'Comida');
    const actual = day.meals[k];
    if (!actual || actual._dishId !== e.primero) throw new Error(`aplicarEstructura: la comida del ${e.day} no es el primero esperado`);
    const primero = visible.get(e.primero);
    const segundo = visible.get(e.plato);
    const meals = day.meals.slice();
    meals[k] = construirPS(actual, primero, segundo, p.kcal, topes.get(e.primero) || 0);
    days[i] = ajustarDia({ ...day, meals }, clonar(p.perfil), p.kcal).day;
    nombres.push(segundo.nombre);
  }
  const platosSemana = [...(plan.platosSemana || []), ...nombres];
  if (days[0] && days[0]._engine2) days[0] = { ...days[0], _engine2: { ...days[0]._engine2, platosSemana } };
  return { ...plan, days, platosSemana };
}

// ─── Lectura de la semana ────────────────────────────────────────────────────────────────────
function apariciones(plan, visible) {
  const out = [];
  plan.days.forEach((d, i) => {
    for (const time of ['Comida', 'Cena']) {
      const m = (d.meals || []).find((x) => x && x.time === time);
      if (!m) continue;
      const real = m.sugerencia || m;
      const libre = !!m.sugerencia;
      const ancla = typeof real._causa === 'string' && real._causa.startsWith('ancla_base');
      const uno = (id, rol) => { const dish = id ? visible.get(id) : null; out.push({ dia: i, momento: MOM[time], rol, id, nombre: dish ? dish.nombre : String(real.title || ''), libre, ancla, redactado: typeof id === 'string' && !id.startsWith('['), verdura: dish ? verdura(dish) : false, ...famDe(dish || { id }) }); };
      uno(real._dishId || null, real._dishId2 ? 'primero' : 'unico');
      if (real._dishId2) uno(real._dishId2, 'segundo');
    }
  });
  return out;
}

function fila(plan, p, obj, visible, recientes, s) {
  const ap = apariciones(plan, visible);
  const serv = ap.filter((a) => !a.libre);
  const fam = (a) => (a.familia === 'marisco' ? 'pescado' : a.familia);
  const esPesc = (a) => fam(a) === 'pescado';
  const cuenta = (xs, f) => { const o = {}; for (const x of xs) { const k = f(x); if (k) o[k] = (o[k] || 0) + 1; } return o; };
  // Reglas de D-099.3, D-114 y D-115, contando también los segundos.
  const nombres = serv.map((a) => a.nombre);
  const ant = new Set(recientes);
  const porEspecie = cuenta(serv, (a) => a.especie);
  let especieMismoDia = 0; let especieSeguidos = 0; let familiaSeguidos = 0; let familiaMismoDia = 0; let diasSinVerdura = 0; let rachaPescado = 0; let racha = 0;
  const seguidosPorFamilia = {};
  for (let i = 0; i < 7; i++) {
    const hoy = serv.filter((a) => a.dia === i);
    const esp = hoy.map((a) => a.especie).filter(Boolean);
    especieMismoDia += esp.length - new Set(esp).size;
    const fs2 = hoy.map(fam).filter(Boolean);
    familiaMismoDia += fs2.length - new Set(fs2).size;
    if (!hoy.some((a) => a.verdura)) diasSinVerdura += 1;
    racha = hoy.some(esPesc) ? racha + 1 : 0; rachaPescado = Math.max(rachaPescado, racha);
    if (i === 6) break;
    const man = serv.filter((a) => a.dia === i + 1);
    for (const [campo, f] of [['especie', (a) => a.especie], ['familia', fam]]) {
      for (const v of [...new Set(hoy.map(f).filter(Boolean))].filter((x) => man.some((a) => f(a) === x))) {
        const porAncla = hoy.some((a) => f(a) === v && a.ancla) && man.some((a) => f(a) === v && a.ancla);
        if (porAncla) continue;
        if (campo === 'especie') especieSeguidos += 1; else { familiaSeguidos += 1; seguidosPorFamilia[v] = (seguidosPorFamilia[v] || 0) + 1; }
      }
    }
  }
  // Comidas de legumbre (con cantidades).
  const log = plan.decisionLog || [];
  const sorteo = log.find((e) => e.causa === 'dias_legumbre_sorteados');
  const diasSorteados = sorteo ? sorteo.dias.map((d) => DAYS_ORDER.indexOf(d)) : [];
  const legumbres = [];
  let cortas = 0; let principales = 0; let protComidas = 0; let objComidas = 0;
  plan.days.forEach((d, i) => {
    for (const m of (d.meals || []).filter(Boolean)) {
      if (m.sugerencia || !(m.time === 'Comida' || m.time === 'Cena') || !m.nutricion) continue;
      const n = m.nutricion;
      principales += 1;
      if (n.proteina < 0.95 * n.objetivoProteina) cortas += 1;
      if (m.time === 'Comida') { protComidas += n.proteina; objComidas += n.objetivoProteina; }
      const dish = m._dishId ? visible.get(m._dishId) : null;
      if (m.time !== 'Comida' || !dish || famDe(dish).familia !== 'legumbre') continue;
      const items = leerComida(m).items;
      const g = (pred) => Math.round(items.filter((it) => pred(it.clave)).reduce((a, it) => a + it.gramos, 0));
      legumbres.push({ d: i, ps: !!m._dishId2, t: dish.nombre, t2: m._dishId2 ? visible.get(m._dishId2).nombre : null, f2: m._dishId2 ? famDe(visible.get(m._dishId2)).familia : null, e: famDe(dish).especie, red: !m._dishId.startsWith('['),
        kcal: n.kcal, oK: n.objetivoKcal, prot: n.proteina, oP: n.objetivoProteina, g: g(() => true), gLeg: g(esLeg), gProt: g(esProteico), extra: (m.acompanamientos || []).join('+'), sorteado: diasSorteados.includes(i) });
    }
  });
  const sinAplicar = (re, soloSegundo) => log.filter((e) => (soloSegundo ? e.causa === 'segundo_de_legumbre' : e.causa !== 'segundo_de_legumbre' && e.plato) && re.test(e.evidencia || '')).length;
  const causas = cuenta(log.filter((e) => ['segundo_sin_candidato', 'dia_legumbre_sin_candidato', 'frecuencia_corta_sin_candidato', 'familia_dias_seguidos_retirada', 'repeticion_por_catalogo_corto', 'vecino_de_dia_legumbre'].includes(e.causa)), (e) => e.causa);
  const m = medirPlan(plan, { kcal: p.kcal, proteina: obj.proteina, peso: obj.pesoKg }, COMPOSICION);
  const x = restriccionesSemana(plan, p.perfil);
  const sug = ap.filter((a) => a.libre);
  return {
    perfil: p.id, s, motor: plan.motor || 'legacy', aviso: plan.motorAviso ? String(plan.motorAviso).slice(0, 80) : null, fallo: plan.motorFallo ? String(plan.motorFallo).slice(0, 120) : null,
    pescado: serv.filter(esPesc).length, pescadoComida: serv.filter((a) => esPesc(a) && a.momento === 'comida' && a.rol !== 'segundo').length, pescadoSegundo: serv.filter((a) => esPesc(a) && a.rol === 'segundo').length, pescadoCena: serv.filter((a) => esPesc(a) && a.momento === 'cena').length, rachaPescado,
    legumbre: serv.filter((a) => a.familia === 'legumbre').length, diasLeg: serv.filter((a) => a.familia === 'legumbre').map((a) => DIAS[a.dia]).join(''), diasSorteados: diasSorteados.map((i) => DIAS[i]).join(''),
    segundos: serv.filter((a) => a.rol === 'segundo').length, famSegundos: cuenta(serv.filter((a) => a.rol === 'segundo'), (a) => a.familia),
    porFamilia: cuenta(serv, (a) => a.familia), legumbres,
    d099: { platoRepetidoEnSemana: nombres.length - new Set(nombres).size, platoDeSemanaAnterior: nombres.filter((t) => ant.has(t)).length, especieMasDeDosVeces: Object.values(porEspecie).filter((n) => n > 2).length, especieMismoDia, especieDiasSeguidosSinAncla: especieSeguidos, legumbreEnCena: serv.filter((a) => a.familia === 'legumbre' && a.momento === 'cena').length },
    d114: { sugerenciaConSegundo: sug.filter((a) => a.rol !== 'unico').length, sugerencias: sug.length },
    d115: { familiaDiasSeguidosSinAncla: familiaSeguidos, porFamilia: seguidosPorFamilia, familiaMismoDia },
    diasSinVerdura,
    desvio: m.desvioSemana, dentro: m.semanaDentro, kcalDia: m.mediaDia.kcal, protDia: m.mediaDia.proteina, objProt: obj.proteina, diasFueraKcal: m.diasFueraKcal, diasSinProteina: m.diasSinProteina, bajoMinimo: m.comidasPrincipalesCortas,
    cortas, principales, protComidas, objComidas,
    sinAplicar: { tope: sinAplicar(/tope de proteina sin aplicar/), separada: sinAplicar(/proteina separada sin aplicar/), familia: sinAplicar(/familia en dias seguidos sin aplicar/), alino: sinAplicar(/alino sin aplicar/) },
    sinAplicarSegundo: { tope: sinAplicar(/tope de proteina \(\d\/semana\) sin aplicar/, true), separada: sinAplicar(/proteina separada sin aplicar/, true), familia: sinAplicar(/familia en dias seguidos sin aplicar/, true), alino: sinAplicar(/alino sin aplicar/, true) },
    causas, vetados: x.conVetado, eliminados: x.conEliminado,
  };
}

function texto(plan, p, s) {
  const L = [`### ${p.id}, semana ${s} (${p.kcal} kcal)`, ''];
  const sorteo = (plan.decisionLog || []).find((e) => e.causa === 'dias_legumbre_sorteados');
  if (sorteo) L.push(`Días de legumbre sorteados: ${sorteo.dias.join(', ') || '—'}.`, '');
  L.push('| Día | Comida | Cena |', '|---|---|---|');
  for (const d of plan.days) {
    const c = (d.meals || []).find((m) => m && m.time === 'Comida');
    const n = (d.meals || []).find((m) => m && m.time === 'Cena');
    const t = (m) => (!m ? '—' : m.sugerencia ? `Libre (sugerencia: ${m.sugerencia.title})` : m.title);
    L.push(`| ${d.name} | ${t(c)} | ${t(n)} |`);
  }
  L.push('');
  for (const d of plan.days) {
    const m = (d.meals || []).find((x) => x && x.time === 'Comida' && x._dishId2);
    if (!m) continue;
    const n = m.nutricion;
    L.push(`**${d.name}, comida** (${n.kcal} de ${n.objetivoKcal} kcal; ${n.proteina} de ${n.objetivoProteina} g de proteína)`, '', `- ${m.p1}`, `- ${m.p2}`, `- Compra: ${m.shopping.join(' · ')}`, '');
  }
  return L.join('\n');
}

// ─── Bucle ───────────────────────────────────────────────────────────────────────────────────
const TEXTO = { 'omni-2174': [60, 61, 62], 'omni-1434': [60], 'omni-3714': [60] };
const out = { ec: flags, semanas: SEMANAS, semanaInicial: SEMANA_INICIAL, topes: Object.fromEntries(topes), filas: [] };
const textos = [];
for (const p of PERFILES) {
  if (soloPerfiles ? !soloPerfiles.includes(p.id) : (p.perfil.dieta === 'vegetariana' || p.perfil.dieta === 'vegana')) continue;
  const visible = new Map(aplicarNombresD105(aplicarAjustesD099(conPlatosDieta(catalogoApp(), p.perfil, { reserva: true }))).map((d) => [d.id, d]));
  const obj = objetivoDe(p.perfil, p.kcal);
  let ant = null;
  for (let s = SEMANA_INICIAL; s < SEMANA_INICIAL + SEMANAS; s++) {
    const recientes = platosRecientesPara(ant, s - 1, s);
    const opts = { month: MES, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: 'banco-' + p.id, saveMealMemory: () => {}, platosRecientes: recientes };
    const plan = silencio(() => aplicarEstructura(generarPlan(clonar(p.perfil), p.kcal, opts), p, visible));
    out.filas.push(fila(plan, p, obj, visible, recientes, s));
    if (salidaTexto && TEXTO[p.id] && TEXTO[p.id].includes(s)) textos.push(texto(plan, p, s));
    ant = plan;
  }
  process.stderr.write(`  ${p.id} listo\n`);
}
fs.writeFileSync(salida, JSON.stringify(out));
if (salidaTexto) fs.writeFileSync(salidaTexto, textos.join('\n'));
console.log(`${out.filas.length} semanas → ${salida}`);
