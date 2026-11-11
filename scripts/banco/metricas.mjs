// Métricas del banco I-0. Funciones puras: reciben un plan ya generado (o el
// catálogo) y devuelven recuentos. MIDEN, NO DECIDEN: nada de src/engine2 ni
// de src/plan importa este archivo (termómetro, no termostato).
//
// Dos familias de medidas, que no se mezclan:
//   - de CATÁLOGO (qué hay disponible y si sus cantidades sobreviven a
//     escribirse y releerse), sin generar ningún plan;
//   - de MENÚS GENERADOS (qué sale de verdad en una semana).

import crypto from 'node:crypto';
import { leerComida } from '../../src/plan/medidor/leerComida.js';
import { medirComida } from '../../src/plan/medidor/medir.js';
import { reescribirComida } from '../../src/plan/cantidades.js';
import { componerPlato, recomponer } from '../../src/plan/textos/componer.js';
import { racionesDia, rangoDe, papelDe, AMPLITUD_MAX } from '../../src/engine2/nutrientes/raciones.js';
import { INGREDIENTES } from '../../src/engine2/nutrientes/ingredientes.js';
import { COMPOSICION } from '../../src/engine2/nutrientes/composicion.js';
import { objetivoDe, batidoDelDia, vetadosDe } from '../../src/plan/racionesApp.js';
import { intoleranciasDe, filtrarCatalogo } from '../../src/plan/engine2App.js';
import { resolveDishComposition } from '../../src/engine2/dishes/compositionResolver.js';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MOMENTO = { Desayuno: 'desayuno', Comida: 'comida', Cena: 'cena' };
const normal = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const inc = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };

// Tolerancia DECLARADA de «decidido ≠ compra» (y de la ida y vuelta de
// catálogo): una diferencia de menos de 5 g entre lo que decide el cálculo y
// lo que se relee de la compra se cuenta aparte, como redondeo de escritura
// (p. ej. gramos ↔ ml). De 5 g en adelante es un descuadre. Lo que no llega a
// 0,05 g no es diferencia. Cambiar este valor exige regenerar la línea base.
export const TOLERANCIA_G = 5;
const IGUAL_G = 0.05;

// ─── Familia y especie de un plato ───────────────────────────────────────────

/** Familia proteica (proteinType del resolvedor) y especie (clave P) de un plato. */
export function familiaDe(dish) {
  if (!dish) return { familia: 'desconocido', especie: null };
  try {
    const v = resolveDishComposition(dish);
    return { familia: v.proteinType || 'sin_familia', especie: (v.tupla && v.tupla.P) || v.claveP || null };
  } catch {
    return { familia: 'sin_resolver', especie: null };
  }
}

const esRedactado = (id) => typeof id === 'string' && !id.startsWith('[');

// ─── Menús generados: composición de la semana ───────────────────────────────

/**
 * Huecos de comida y cena de la semana con su plato, familia y especie.
 * La comida libre del sábado se devuelve como sugerencia (no cuenta como servida).
 */
export function huecosSemana(plan, porId) {
  const out = [];
  plan.days.forEach((d, i) => {
    for (const time of ['Comida', 'Cena']) {
      const m = (d.meals || []).find((x) => x && x.time === time);
      if (!m) continue;
      const real = m.sugerencia || m;
      const id = real._dishId || null;
      const titulo = String(real.title || '').replace(/ \(comida principal\)$/, '');
      out.push({
        dia: i, nombreDia: d.name || DIAS[i], momento: MOMENTO[time], id, titulo,
        libre: !!m.sugerencia, motor: real._motor || 'legacy', redactado: esRedactado(id),
        ancla: typeof real._causa === 'string' && real._causa.startsWith('ancla_base'),
        ...familiaDe(id ? porId.get(id) : null),
      });
    }
  });
  return out;
}

/** Composición por familias, repeticiones consecutivas y reglas de menú de D-099 (solo se cuentan, no se imponen). */
export function composicionSemana(plan, porId, platosSemanaAnterior = []) {
  const huecos = huecosSemana(plan, porId);
  const servidos = huecos.filter((h) => !h.libre);
  const r = {
    servidos: servidos.length,
    porFamilia: {}, porFamiliaComida: {}, porFamiliaCena: {}, porEspecie: {},
    sugerenciaSabado: (huecos.find((h) => h.libre) || {}).familia || null,
    redactadosComida: 0, redactadosCena: 0,
    // Pares de días seguidos que comparten familia / especie (cada familia compartida cuenta una vez por par de días).
    familiaDiasSeguidos: 0, familiaDiasSeguidosSinAncla: 0, especieDiasSeguidos: 0, especieDiasSeguidosSinAncla: 0,
    familiaDiasSeguidosPorFamilia: {},
    familiaMismoDia: 0,
    rachaPescado: 0,
    // Reglas de D-099.3 medidas sobre lo servido.
    platoRepetidoEnSemana: 0, platoDeSemanaAnterior: 0, especieMasDeDosVeces: 0, legumbreEnCena: 0,
  };
  for (const h of servidos) {
    inc(r.porFamilia, h.familia);
    inc(h.momento === 'comida' ? r.porFamiliaComida : r.porFamiliaCena, h.familia);
    if (h.especie) inc(r.porEspecie, h.especie);
    if (h.redactado) r[h.momento === 'comida' ? 'redactadosComida' : 'redactadosCena'] += 1;
    if (h.momento === 'cena' && h.familia === 'legumbre') r.legumbreEnCena += 1;
  }
  const delDia = (i) => servidos.filter((h) => h.dia === i);
  let racha = 0;
  for (let i = 0; i < 7; i++) {
    const hoy = delDia(i);
    const esPescado = hoy.some((h) => h.familia === 'pescado' || h.familia === 'marisco');
    racha = esPescado ? racha + 1 : 0;
    r.rachaPescado = Math.max(r.rachaPescado, racha);
    if (hoy.length === 2 && hoy[0].familia === hoy[1].familia) r.familiaMismoDia += 1;
    if (i === 6) break;
    const man = delDia(i + 1);
    for (const [campo, clave] of [['familia', 'familiaDiasSeguidos'], ['especie', 'especieDiasSeguidos']]) {
      const comunes = [...new Set(hoy.map((h) => h[campo]).filter(Boolean))].filter((v) => man.some((h) => h[campo] === v));
      for (const v of comunes) {
        r[clave] += 1;
        if (campo === 'familia') inc(r.familiaDiasSeguidosPorFamilia, v);
        const porAncla = hoy.some((h) => h[campo] === v && h.ancla) && man.some((h) => h[campo] === v && h.ancla);
        if (!porAncla) r[`${clave}SinAncla`] += 1;
      }
    }
  }
  const titulos = servidos.map((h) => h.titulo);
  r.platoRepetidoEnSemana = titulos.length - new Set(titulos).size;
  const anteriores = new Set(platosSemanaAnterior);
  r.platoDeSemanaAnterior = titulos.filter((t) => anteriores.has(t)).length;
  r.especieMasDeDosVeces = Object.values(r.porEspecie).filter((n) => n > 2).length;
  r.pescado = (r.porFamilia.pescado || 0) + (r.porFamilia.marisco || 0);
  r.legumbre = r.porFamilia.legumbre || 0;
  return r;
}

// ─── Menús generados: restricciones ──────────────────────────────────────────

const textoDe = (m) => [m.title, m.p1, m.p2, ...(m.shopping || []), ...((m.recipe || []).filter((x) => typeof x === 'string'))].filter(Boolean).join(' · ');

/** Comidas del plan (también la sugerencia del sábado) con algo que el perfil no puede tomar. */
export function restriccionesSemana(plan, perfil) {
  const eliminados = (perfil.eliminatedFoods || []).map(normal).filter(Boolean);
  const r = { comidas: 0, conVetado: 0, conEliminado: 0, detalle: [] };
  for (const d of plan.days) for (const m0 of (d.meals || []).filter(Boolean)) {
    for (const m of [m0, m0.sugerencia].filter(Boolean)) {
      r.comidas += 1;
      const vetos = intoleranciasDe(m, perfil);
      const texto = normal(textoDe(m));
      const elim = eliminados.filter((e) => texto.includes(e));
      if (vetos.length) r.conVetado += 1;
      if (elim.length) r.conEliminado += 1;
      if (vetos.length || elim.length) r.detalle.push(`${d.name} ${m.time}: ${m.title} → ${[...vetos, ...elim].join(', ')}`);
    }
  }
  return r;
}

// ─── Menús generados: cantidades calculadas, compra y texto ──────────────────

/**
 * Raciones calculadas de un día, con la MISMA entrada que construye
 * src/plan/racionesApp.js (ajustarDia). Es una réplica de solo lectura para
 * poder ver los gramos decididos, que el plan no guarda; se valida contra
 * meal.nutricion.kcal (si la réplica se desvía, `replicaDistinta` lo cuenta).
 */
export function racionesCalculadas(day, perfil, kcal) {
  const meals = (day.meals || []).map((m) => (m ? (m._base || m) : m));
  const lecturas = meals.map((m) => (m ? leerComida(m) : null));
  const comidas = [];
  meals.forEach((m, i) => {
    if (!m) return;
    const l = lecturas[i];
    comidas.push({
      id: String(i), momento: MOMENTO[m.time] || 'tentempie', libre: l.libre || !!(m._spec && m._spec.isFree),
      items: l.items.map((it) => ({ clave: it.clave, gramos: it.gramos, unidad: it.como === 'ud' ? 'ud' : 'g', fijo: /estimado/.test(it.como) })),
    });
  });
  const batido = batidoDelDia(perfil, day);
  const r = racionesDia({ comidas, aparte: batido ? [batido] : [], objetivo: objetivoDe(perfil, kcal), composicion: COMPOSICION, vetados: vetadosDe(perfil) });
  return { lecturas, comidas: r.comidas };
}

const porClave = (items, campo = 'gramos') => {
  const m = new Map();
  for (const it of items) m.set(it.clave, (m.get(it.clave) || 0) + it[campo]);
  return m;
};

// Cantidad escrita en el texto (p1/p2) para un ingrediente de la compra.
const CUENTA = /(?:^|[\s(])(\d+\/\d+|\d*½|\d+)(?=\s+(?!g\b|ml\b|min|minutos|kcal|cm|veces)[a-záéíóúñ])/gi;
const numero = (s) => {
  if (s === '½') return 0.5;
  if (/½$/.test(s)) return Number(s.slice(0, -1)) + 0.5;
  if (/^\d+\/\d+$/.test(s)) { const [a, b] = s.split('/').map(Number); return a / b; }
  return Number(s);
};
function textoFrenteACompra(meal, it) {
  const raiz = normal(it.nombre).split(/[^a-zñ]+/).find((w) => w.length >= 4);
  if (!raiz) return 'sin_cantidad_en_texto';
  const tramos = `${meal.p1 || ''} · ${meal.p2 || ''}`.split('·').filter((t) => normal(t).includes(raiz.slice(0, Math.max(4, raiz.length - 2))));
  if (it.como === 'ud') {
    const ud = it.gramos / INGREDIENTES[it.clave].gUd;
    const cuentas = tramos.flatMap((t) => [...t.matchAll(CUENTA)].map((m) => numero(m[1])));
    if (!cuentas.length) return 'sin_cantidad_en_texto';
    return cuentas.some((c) => Math.abs(c - ud) < 1e-6) ? 'igual' : 'distinta';
  }
  const gramos = tramos.flatMap((t) => [...t.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:g\b|ml\b)/g)].map((m) => Number(m[1].replace(',', '.'))));
  if (!gramos.length) return 'sin_cantidad_en_texto';
  const paren = (it.texto.match(/\(([^)]*)\)/) || [])[1] || '';
  const enCompra = [...paren.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:g\b|ml\b)/g)].map((m) => Number(m[1].replace(',', '.')));
  return gramos.some((g) => enCompra.some((c) => Math.abs(c - g) < 1e-6)) ? 'igual' : 'distinta';
}

const VIGILADOS = ['arroz_seco', 'pasta_seco', 'pasta_integral_seco', 'quinoa_seco', 'patata', 'boniato', 'lentejas_seco', 'garbanzos_seco', 'alubias_seco', 'pan_integral', 'pan_blanco', 'pan_sin_gluten'];

/** Cantidades de una semana: calculado frente a compra, compra frente a texto, raciones elevadas. */
export function cantidadesSemana(plan, perfil, kcal) {
  const r = {
    comidasAjustadas: 0, replicaDistinta: 0,
    ingredientes: 0, decididoIgualQueCompra: 0, dentroDeTolerancia: 0, fueraDeTolerancia: 0, calculadoAusenteEnCompra: 0,
    dentroPorClave: {}, fueraPorClave: {}, mayorDiferenciaG: 0,
    kcalDeclaradaDistintaDeReleida: 0, mayorDiferenciaKcal: 0,
    textoIgual: 0, textoDistinto: 0, textoSinCantidad: 0, textoDistintoPorClave: {},
    enTechoBase: 0, sobreTechoBase: 0, enTechoPorClave: {}, maximoG: {},
    panAnadido: 0, frutaAnadida: 0, principales: 0, huevosMaxComida: 0, huevosMaxDia: 0,
    ejemplos: [],
  };
  for (const day of plan.days) {
    const calc = racionesCalculadas(day, perfil, kcal);
    let huevosDia = 0;
    (day.meals || []).forEach((m, i) => {
      if (!m) return;
      if (m.time === 'Comida' || m.time === 'Cena') {
        r.principales += 1;
        const ac = m.acompanamientos || [];
        if (ac.some((a) => a.startsWith('pan_'))) r.panAnadido += 1;
        if (ac.includes('fruta')) r.frutaAnadida += 1;
      }
      const final = leerComida(m);
      const huevos = final.items.filter((it) => it.clave === 'huevo').reduce((a, it) => a + it.gramos / INGREDIENTES.huevo.gUd, 0);
      r.huevosMaxComida = Math.max(r.huevosMaxComida, Math.round(huevos * 10) / 10);
      huevosDia += huevos;
      // Raciones elevadas (sobre lo que se ve en la compra).
      for (const it of final.items) {
        const rango = rangoDe(it.clave, it.como === 'ud' ? 'ud' : 'g');
        if (VIGILADOS.includes(it.clave)) r.maximoG[it.clave] = Math.max(r.maximoG[it.clave] || 0, it.gramos);
        if (!rango || papelDe(it.clave, COMPOSICION[it.clave]) === 'fijo') continue;
        if (it.gramos > rango[1] + 0.5) { r.sobreTechoBase += 1; inc(r.enTechoPorClave, it.clave); } else if (it.gramos >= rango[1] - 0.5) { r.enTechoBase += 1; inc(r.enTechoPorClave, it.clave); }
      }
      // Texto frente a compra.
      for (const it of final.items) {
        if (/estimado|texto/.test(it.como)) continue;
        const v = textoFrenteACompra(m, it);
        if (v === 'igual') r.textoIgual += 1; else if (v === 'distinta') { r.textoDistinto += 1; inc(r.textoDistintoPorClave, it.clave); } else r.textoSinCantidad += 1;
      }
      // Calculado frente a compra.
      const res = calc.comidas[String(i)];
      if (!res || !m.nutricion) return;
      r.comidasAjustadas += 1;
      if (res.kcal !== m.nutricion.kcal) { r.replicaDistinta += 1; return; }
      const releida = medirComida(m, COMPOSICION).kcal;
      const dk = Math.abs(releida - m.nutricion.kcal);
      r.mayorDiferenciaKcal = Math.max(r.mayorDiferenciaKcal, dk);
      if (dk > Math.max(15, 0.03 * m.nutricion.kcal)) r.kcalDeclaradaDistintaDeReleida += 1;
      const decidido = porClave(res.items.filter((x) => x.papel !== 'fijo' || x.anadido));
      const compra = porClave(final.items);
      for (const [clave, g] of decidido) {
        r.ingredientes += 1;
        if (!compra.has(clave)) { r.calculadoAusenteEnCompra += 1; continue; }
        const dif = Math.round((compra.get(clave) - g) * 10) / 10;
        if (Math.abs(dif) <= IGUAL_G) { r.decididoIgualQueCompra += 1; continue; }
        r.mayorDiferenciaG = Math.max(r.mayorDiferenciaG, Math.abs(dif));
        if (Math.abs(dif) < TOLERANCIA_G) { r.dentroDeTolerancia += 1; inc(r.dentroPorClave, clave); continue; }
        r.fueraDeTolerancia += 1;
        inc(r.fueraPorClave, clave);
        if (r.ejemplos.length < 6) {
          const linea = final.items.find((x) => x.clave === clave);
          r.ejemplos.push(`${day.name} ${m.time} «${m.title}»: ${clave} decidido ${g} g → compra «${linea ? linea.texto : '?'}» = ${compra.get(clave)} g`);
        }
      }
    });
    r.huevosMaxDia = Math.max(r.huevosMaxDia, Math.round(huevosDia * 10) / 10);
  }
  return r;
}

// ─── Huella del plan (para detectar cambios antes/después) ───────────────────

export function huellaPlan(plan) {
  const visible = plan.days.map((d) => (d.meals || []).map((m) => (m ? [m.time, m.title, m.p1, m.p2, m.shopping, m.recipe, m.sugerencia ? m.sugerencia.title : null] : null)));
  return crypto.createHash('sha256').update(JSON.stringify(visible)).digest('hex').slice(0, 16);
}

// ─── Catálogo filtrado (sin generar planes) ──────────────────────────────────

/** Qué queda disponible para un perfil, por familia y momento. */
export function catalogoFiltrado(catalogoBase, perfil, kcal) {
  const { catalogo, quitados } = filtrarCatalogo(catalogoBase, perfil, kcal, {});
  const r = { platos: catalogo.length, quitados: quitados.length, comida: {}, cena: {}, redactados: 0, compuestos: 0 };
  for (const d of catalogo) {
    const { familia } = familiaDe(d);
    if (d.momento.includes('comida')) inc(r.comida, familia);
    if (d.momento.includes('cena')) inc(r.cena, familia);
    if (esRedactado(d.id)) r.redactados += 1; else r.compuestos += 1;
  }
  return r;
}

/**
 * Ida y vuelta de cantidades en el catálogo: para cada plato y cada ingrediente
 * ajustable, se decide cada cantidad posible de su rango (con la amplitud
 * máxima), se escribe como lo hace la app (recomponer / reescribirComida) y se
 * vuelve a leer. Cuenta dónde lo releído no es lo decidido.
 */
export function idaYVueltaCatalogo(catalogo, kcal = 2000) {
  const r = { platos: 0, ingredientes: 0, pruebas: 0, iguales: 0, dentroDeTolerancia: 0, fueraDeTolerancia: 0, ilegibles: 0, platosFueraDeTolerancia: 0, dentroPorClaveYForma: {}, fueraPorClaveYForma: {}, ilegiblesPorClaveYForma: {}, mayorDiferenciaG: {}, ejemplos: [] };
  for (const d of catalogo) {
    let meal;
    try { meal = componerPlato(d, d.momento.includes('comida') ? 'comida' : 'cena', kcal); } catch { continue; }
    r.platos += 1;
    const lectura = leerComida(meal);
    let afectado = false;
    for (const it of lectura.items) {
      const unidad = it.como === 'ud' ? 'ud' : 'g';
      const rango = /estimado/.test(it.como) ? null : rangoDe(it.clave, unidad);
      if (!rango || papelDe(it.clave, COMPOSICION[it.clave]) === 'fijo') continue;
      // Solo si es el único ingrediente con esa clave (si no, la suma no es atribuible).
      if (lectura.items.filter((x) => x.clave === it.clave).length > 1) continue;
      r.ingredientes += 1;
      const [min, max, paso] = rango;
      const tope = Math.floor((max * AMPLITUD_MAX) / paso) * paso;
      const k = `${it.clave}|${it.como}`;
      for (let g = min; g <= tope + 1e-9; g += paso) {
        const decidido = Math.round(g * 10) / 10;
        let escrita;
        if (meal._componer) escrita = recomponer(meal, new Map([[it.clave, decidido]]));
        else escrita = reescribirComida(meal, lectura.items.map((x) => ({ ...x, despues: x === it ? decidido : x.gramos }))).meal;
        const releido = leerComida(escrita).items.filter((x) => x.clave === it.clave).reduce((a, x) => a + x.gramos, 0);
        const hay = leerComida(escrita).items.some((x) => x.clave === it.clave);
        r.pruebas += 1;
        const dif = Math.round((releido - decidido) * 10) / 10;
        if (hay && Math.abs(dif) <= IGUAL_G) { r.iguales += 1; continue; }
        if (hay) r.mayorDiferenciaG[k] = Math.max(r.mayorDiferenciaG[k] || 0, Math.abs(dif));
        if (hay && Math.abs(dif) < TOLERANCIA_G) { r.dentroDeTolerancia += 1; inc(r.dentroPorClaveYForma, k); continue; }
        if (!hay) { r.ilegibles += 1; inc(r.ilegiblesPorClaveYForma, k); } else { r.fueraDeTolerancia += 1; inc(r.fueraPorClaveYForma, k); }
        afectado = true;
        if (r.ejemplos.length < 12 && !r.ejemplos.some((e) => e.startsWith(`${k} `))) {
          const linea = (escrita.shopping || []).find((s) => leerComida({ shopping: [s] }).items.some((x) => x.clave === it.clave)) || '(sin línea legible)';
          r.ejemplos.push(`${k} «${d.nombre}»: decidido ${decidido} g → «${linea}» → releído ${hay ? `${releido} g` : 'ilegible'}`);
        }
      }
    }
    if (afectado) r.platosFueraDeTolerancia += 1;
  }
  return r;
}
