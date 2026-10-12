// raciones — decide los gramos de cada ingrediente de un día para que el día
// llegue a su objetivo de calorías y proteína con raciones de cocina normal.
//
// Criterios acordados con Javi el 2026-10-11, como prioridades ordenadas (la
// primera que no se puede cumplir manda, y se anota la causa):
//   1. Seguridad (intolerancias y alimentos eliminados): ya resuelta antes;
//      aquí no se añade ningún ingrediente nuevo, solo se cambian cantidades.
//   2. Proteína mínima en cada comida principal: 0,3 g por kg de peso.
//   3. Calorías del día en su objetivo (la semana debe quedar en ±5 %).
//   4. Raciones humanas: cada ingrediente entre un mínimo y un máximo de
//      cocina doméstica, redondeado a medidas de casa (5 g, huevos enteros…).
//
// Reparto del día por rangos (punto medio de cada uno): desayuno 22,5 %,
// comida 37,5 %, cena 27,5 %, tentempiés 12,5 % entre todos. Si un momento no
// existe ese día, el resto se reparte en proporción. La comida libre del
// sábado conserva su parte (se come fuera del plan) y no se ajusta.
// Lo que el usuario toma aparte (el batido) se descuenta entero de la comida
// a la que acompaña, sin bajar de su proteína mínima.
//
// Cómo se ajusta cada comida, sin puntuar nada: los ingredientes se dividen en
//   - proteicos (carne, pescado, huevo, tofu, lácteos con 8 g de proteína o
//     más por 100 g),
//   - energéticos (cereales, pan, patata, legumbre, fruta, lácteos, frutos
//     secos, aguacate),
//   - fijos (verdura, aceite, salsas, condimentos), que no cambian.
// Con dos factores, uno para cada grupo, se resuelven dos ecuaciones: la
// proteína de la comida y sus calorías. Si un ingrediente se sale de su
// rango, se fija en el límite y se vuelve a resolver con los demás.
//
// Función pura: no importa nada del motor viejo ni de eval.

import { INGREDIENTES } from './ingredientes.js';

export const PROTEINA_MIN_POR_KG = 0.3;
export const REPARTO = Object.freeze({ desayuno: 0.225, comida: 0.375, cena: 0.275, tentempie: 0.125 });
// Máximo de cada momento (límite alto de su rango): lo que no cabe en una
// comida solo se pasa a otra hasta este tope.
export const TOPE = Object.freeze({ desayuno: 0.25, comida: 0.40, cena: 0.30, tentempie: 0.15 });
const PRINCIPALES = new Set(['desayuno', 'comida', 'cena']);
const DENSIDAD_LACTEO_PROTEICO = 8; // g de proteína por 100 g

// Rango humano por ingrediente: [mínimo, máximo, paso] en gramos.
const RANGO_GRUPO = Object.freeze({
  proteina: [80, 300, 5],
  legumbre: [50, 130, 5],
  hidrato: [40, 160, 5],
  fruta: [80, 250, 10],
  lacteo: [100, 450, 25],
  frutoSeco: [10, 40, 5],
  otro: [60, 300, 10],
});
const RANGO = Object.freeze({
  jamon_serrano: [20, 100, 5], jamon_cocido: [20, 100, 5], lacon: [40, 150, 10], chorizo: [20, 80, 5],
  morcilla: [30, 100, 10], panceta: [20, 80, 5], salmon_ahumado: [30, 120, 5],
  atun_conserva: [50, 200, 5], mejillon: [100, 400, 10], berberecho: [80, 300, 10], tofu: [80, 250, 5], tofu_sedoso: [80, 250, 10],
  tempeh: [80, 200, 5], seitan: [80, 250, 5], soja_texturizada: [30, 90, 5],
  lentejas_cocidas: [120, 400, 10], garbanzos_cocidos: [120, 400, 10], alubias_cocidas: [120, 400, 10],
  hummus: [30, 120, 5], edamame: [50, 200, 10], guisantes: [50, 200, 10],
  avena: [30, 90, 5], muesli: [30, 90, 5], patata: [100, 350, 10], boniato: [100, 350, 10],
  pan_blanco: [30, 100, 10], pan_integral: [30, 100, 10], pan_centeno: [30, 100, 10],
  yogur_griego_0: [125, 300, 25], yogur_natural: [125, 300, 25],
  arroz_integral_cocido: [100, 450, 10], gnocchi: [150, 400, 10], masa_empanada: [80, 250, 10], maiz: [40, 150, 10],
  frutos_rojos: [80, 250, 10], pina: [80, 250, 10],
  leche_semi: [150, 400, 10], leche_desnatada: [150, 400, 10], bebida_vegetal: [150, 400, 10],
  skyr: [100, 400, 25], queso_fresco: [30, 150, 10], requeson: [60, 250, 10], queso_burgos_0: [60, 250, 10],
  yogur_soja: [125, 300, 25], queso_crema: [15, 60, 5], mozzarella: [30, 150, 10],
  feta: [20, 100, 10], queso_curado: [10, 40, 5],
  semillas: [5, 20, 5], crema_cacahuete: [10, 40, 5],
  aove: [5, 20, 5], aceite_semillas: [5, 20, 5],
});
// Rango en unidades para lo que se escribe en unidades: [mín, máx, paso en unidades].
const RANGO_UD = Object.freeze({
  huevo: [1, 5, 1], clara: [2, 8, 1], fruta: [1, 2, 1], platano: [1, 2, 1], aguacate: [0.5, 1.5, 0.5],
  tortilla_trigo: [1, 4, 1], tortilla_maiz: [1, 5, 1], croquetas: [4, 14, 1], yogur_griego_0: [1, 3, 1],
  yogur_natural: [1, 3, 1], yogur_soja: [1, 3, 1],
});
// Siempre fijos aunque su grupo se ajuste.
const SIEMPRE_FIJO = new Set(['levadura_nutricional', 'harina', 'pan_rallado', 'tahini', 'leche_coco', 'coco_rallado', 'algas', 'aceituna', 'pepinillo']);

const r1 = (x) => Math.round(x * 10) / 10;

export const FALTA_PARA_ACOMPANAR = 0.05;
export const KCAL_RACION_NORMAL = 2200;
export const AMPLITUD_MAX = 1.4;
const PAN = { clave: 'pan_integral', gramos: 60, unidad: 'g', nombre: 'pan para acompañar' };
const FRUTA = { clave: 'fruta', gramos: 150, unidad: 'ud', nombre: 'fruta de postre' };
const FRUTOS_SECOS = { clave: 'nuez', gramos: 20, unidad: 'g', nombre: 'un puñado de nueces' };
export const ACOMPANAMIENTOS = Object.freeze({
  comida: [PAN, FRUTA],
  cena: [PAN, FRUTA],
  desayuno: [FRUTA, { ...PAN, nombre: 'una tostada' }],
  tentempie: [FRUTA, FRUTOS_SECOS],
});

/** Familia de un acompañamiento: el pan es pan, sea integral, blanco o de centeno. */
function familiaDe(clave) {
  if (clave.startsWith('pan_')) return 'pan';
  const g = INGREDIENTES[clave] && INGREDIENTES[clave].grupo;
  return g === 'fruta' || g === 'frutoSeco' ? g : clave;
}

function papelDe(clave, comp) {
  const ing = INGREDIENTES[clave];
  if (!ing || ing.despreciable || SIEMPRE_FIJO.has(clave)) return 'fijo';
  if (ing.grupo === 'proteina') return 'proteico';
  if (ing.grupo === 'lacteo') return comp && comp.proteina >= DENSIDAD_LACTEO_PROTEICO ? 'proteico' : 'energetico';
  if (clave === 'aguacate' || clave === 'aove' || clave === 'aceite_semillas') return 'energetico';
  if (['hidrato', 'legumbre', 'fruta', 'frutoSeco', 'otro'].includes(ing.grupo)) return 'energetico';
  return 'fijo';
}

/** Rango [mín, máx, paso] en gramos para un ingrediente tal como se escribe. */
export function rangoDe(clave, unidad) {
  const ing = INGREDIENTES[clave];
  if (unidad === 'ud' && RANGO_UD[clave] && ing.gUd) {
    const [a, b, p] = RANGO_UD[clave];
    return [a * ing.gUd, b * ing.gUd, p * ing.gUd];
  }
  if (RANGO[clave]) return RANGO[clave];
  if (ing && ing.estado === 'seco' && ing.grupo === 'legumbre') return RANGO_GRUPO.legumbre;
  if (ing && ing.grupo === 'legumbre') return [50, 300, 10];
  return (ing && RANGO_GRUPO[ing.grupo]) || null;
}

const aporte = (comp, gramos) => ({ kcal: comp.kcal * gramos / 100, proteina: comp.proteina * gramos / 100 });

function suma(items, composicion, gramosDe) {
  let kcal = 0;
  let proteina = 0;
  for (const it of items) {
    const c = composicion[it.clave];
    if (!c) continue;
    const a = aporte(c, gramosDe(it));
    kcal += a.kcal;
    proteina += a.proteina;
  }
  return { kcal, proteina };
}

/**
 * Ajusta una comida a su objetivo. Devuelve los gramos nuevos y lo que pasó.
 * @param {{clave:string, gramos:number, unidad?:string}[]} items
 * @param {{kcal:number, proteina:number, proteinaMin:number}} meta
 * @param {number} [amplitud] factor (≥ 1) para el máximo de los energéticos
 */
export function ajustarComida(items, meta, composicion, amplitud = 1) {
  const estado = items.map((it) => {
    const comp = composicion[it.clave];
    const papel = comp && !it.fijo ? papelDe(it.clave, comp) : 'fijo';
    let rango = papel === 'fijo' ? null : rangoDe(it.clave, it.unidad);
    // D-108: un acompañamiento que la comida ya tenía (pan, fruta, frutos
    // secos) no se repite: se amplía el máximo de lo que ya había.
    if (rango && it.ampliado) rango = [rango[0], rango[1] + it.ampliado, rango[2]];
    // Quien necesita mucha energía come raciones de hidrato más grandes: el
    // máximo de los energéticos crece con el objetivo (nunca el de la proteína
    // ni el del aceite).
    if (rango && papel === 'energetico' && amplitud > 1 && INGREDIENTES[it.clave].grupo !== 'grasa') {
      const [a, b, p] = rango;
      rango = [a, Math.max(b, Math.floor((b * amplitud) / p) * p), p];
    }
    return { ...it, papel: rango ? papel : 'fijo', rango, nuevo: it.gramos, limitado: null };
  });
  const libres = () => estado.filter((e) => e.papel !== 'fijo' && !e.limitado);

  for (let vuelta = 0; vuelta < 6; vuelta++) {
    const fijos = estado.filter((e) => e.papel === 'fijo' || e.limitado);
    const f = suma(fijos, composicion, (e) => e.nuevo);
    const P = libres().filter((e) => e.papel === 'proteico');
    const E = libres().filter((e) => e.papel === 'energetico');
    const sp = suma(P, composicion, (e) => e.gramos);
    const se = suma(E, composicion, (e) => e.gramos);
    const K = meta.kcal - f.kcal;
    const Pr = meta.proteina - f.proteina;
    // Primero la proteína: los proteicos se dimensionan para llegar a la
    // proteína de la comida contando lo que ya aportan los energéticos a su
    // cantidad de partida. Después los energéticos completan las calorías.
    // (Así lo haría un nutricionista: la ración de proteína por necesidad, el
    // hidrato para la energía.)
    let fP = 1;
    let fE = 1;
    if (P.length && sp.proteina > 0) fP = Math.max(0, (Pr - se.proteina) / sp.proteina);
    // Sin energéticos libres, la proteína no se infla para llenar calorías:
    // lo que falte lo cubre un acompañamiento (pan, fruta).
    if (E.length && se.kcal > 0) fE = Math.max(0, (K - sp.kcal * fP) / se.kcal);
    if (!P.length && !E.length) break;
    let cambio = false;
    for (const e of libres()) {
      const fx = e.papel === 'proteico' ? fP : fE;
      const g = e.gramos * fx;
      const [min, max] = e.rango;
      if (g < min) { e.nuevo = min; e.limitado = 'minimo'; cambio = true; } else if (g > max) { e.nuevo = max; e.limitado = 'maximo'; cambio = true; } else e.nuevo = g;
    }
    if (!cambio) break;
  }

  // Medidas de casa.
  for (const e of estado) {
    if (e.papel === 'fijo') continue;
    const [min, max, paso] = e.rango;
    e.nuevo = Math.min(max, Math.max(min, Math.round(e.nuevo / paso) * paso));
  }
  const total = suma(estado, composicion, (e) => e.nuevo);
  return {
    items: estado.map((e) => ({ clave: e.clave, unidad: e.unidad, antes: e.gramos, gramos: r1(e.nuevo), papel: e.papel, limitado: e.limitado, ...(e.anadido ? { anadido: true } : {}) })),
    kcal: Math.round(total.kcal),
    proteina: Math.round(total.proteina),
  };
}

/**
 * Raciones de un día.
 * @param {object} entrada
 * @param {{id:string, momento:'desayuno'|'comida'|'cena'|'tentempie', libre?:boolean, items:{clave:string,gramos:number,unidad?:string}[]}[]} entrada.comidas
 * @param {{nombre:string, kcal:number, proteina:number, momento?:string}[]} [entrada.aparte] lo que se toma aparte (batido) y la comida a la que acompaña
 * @param {{kcal:number, proteina:number, pesoKg:number}} entrada.objetivo
 * @param {Record<string,{kcal:number,proteina:number}>} entrada.composicion por 100 g
 * @param {Set<string>} [entrada.vetados] ingredientes que el perfil no permite añadir
 */
export function racionesDia({ comidas, aparte = [], objetivo, composicion, vetados = new Set() }) {
  const log = [];
  const aparteKcal = aparte.reduce((a, x) => a + x.kcal, 0);
  const aparteProt = aparte.reduce((a, x) => a + x.proteina, 0);
  const nTentempies = comidas.filter((c) => c.momento === 'tentempie').length || 1;
  const parte = (c) => (c.momento === 'tentempie' ? REPARTO.tentempie / nTentempies : REPARTO[c.momento] || 0);
  const totalPartes = comidas.reduce((a, c) => a + parte(c), 0) || 1;
  // Los rangos acordados se definen para un día con tentempiés; sin ellos,
  // cada límite se divide entre 0,875 (la misma regla que el medidor).
  const escala = comidas.some((c) => c.momento === 'tentempie') ? 1 : 0.875;
  const kcalDia = objetivo.kcal;
  const protDia = objetivo.proteina;
  const minComida = PROTEINA_MIN_POR_KG * objetivo.pesoKg;
  // Amplitud de raciones: 1 hasta 2200 kcal; crece en proporción hasta 1,4.
  const amplitud = Math.min(AMPLITUD_MAX, Math.max(1, objetivo.kcal / KCAL_RACION_NORMAL));
  // Lo que se toma aparte (el batido) se descuenta ENTERO de la comida a la
  // que acompaña (su «momento»): así se nota en el plato, como haría un
  // nutricionista («si tomas el batido, a la cena 150 g de pollo en vez de
  // 250»). Esa comida nunca baja de su proteína mínima. Si no tiene momento,
  // o esa comida no se ajusta (libre), se descuenta de las principales en
  // proporción.
  const descuento = new Map();
  for (const x of aparte) {
    const destino = comidas.find((c) => !c.libre && c.momento === x.momento);
    const destinos = destino ? [destino] : comidas.filter((c) => !c.libre && PRINCIPALES.has(c.momento));
    const partesDestino = destinos.reduce((a, c) => a + parte(c), 0) || 1;
    for (const c of destinos) {
      const d = descuento.get(c.id) || { kcal: 0, proteina: 0 };
      const s = parte(c) / partesDestino;
      descuento.set(c.id, { kcal: d.kcal + x.kcal * s, proteina: d.proteina + x.proteina * s });
    }
    log.push({ causa: 'aparte_descontado', detalle: `${x.nombre} (${Math.round(x.kcal)} kcal, ${Math.round(x.proteina)} g de proteína) se descuenta de ${destino ? destino.momento : 'las comidas principales'}` });
  }

  let protRestante = protDia;
  let partesPrincipales = totalPartes;
  const metaDe = (c, extraKcal = 0) => {
    const s = parte(c) / totalPartes;
    const principal = PRINCIPALES.has(c.momento);
    const proteinaMin = principal ? minComida : 0;
    const d = descuento.get(c.id) || { kcal: 0, proteina: 0 };
    const proteina = principal ? Math.max(proteinaMin, protRestante * (parte(c) / partesPrincipales) - d.proteina) : 0;
    return { kcal: Math.max(0, kcalDia * s - d.kcal) + extraKcal, proteina, proteinaMin };
  };

  const resultado = new Map();
  const itemsDe = new Map(comidas.map((c) => [c.id, c.items.slice()]));
  // Primero los tentempiés (sin objetivo de proteína); la proteína del día que
  // no aportan se reparte solo entre desayuno, comida y cena.
  for (const c of comidas) {
    if (c.libre || c.momento !== 'tentempie') continue;
    const meta = { ...metaDe(c), proteina: 0, proteinaMin: 0 };
    resultado.set(c.id, { meta, ...ajustarComida(itemsDe.get(c.id), meta, composicion, amplitud) });
  }
  protRestante = Math.max(0, protDia - [...resultado.values()].reduce((a, r) => a + r.proteina, 0));
  partesPrincipales = comidas.filter((c) => PRINCIPALES.has(c.momento)).reduce((a, c) => a + parte(c), 0) || 1;
  for (const c of comidas) {
    if (c.libre || c.momento === 'tentempie') continue;
    resultado.set(c.id, { meta: metaDe(c), ...ajustarComida(itemsDe.get(c.id), metaDe(c), composicion, amplitud) });
  }

  // Acompañamientos: si un plato, con todos sus ingredientes en el máximo, se
  // queda más de un 5 % por debajo de su objetivo, se le añade lo que en
  // España acompaña a esa comida (pan, fruta de postre, un puñado de frutos
  // secos), por este orden y solo si el perfil lo permite.
  for (const c of comidas) {
    if (c.libre) continue;
    for (const ac of ACOMPANAMIENTOS[c.momento] || []) {
      const r = resultado.get(c.id);
      if (r.kcal >= (1 - FALTA_PARA_ACOMPANAR) * r.meta.kcal) break;
      const items = itemsDe.get(c.id);
      if (vetados.has(ac.clave) || !composicion[ac.clave]) continue;
      const k = items.findIndex((i) => familiaDe(i.clave) === familiaDe(ac.clave));
      if (k >= 0) {
        if (items[k].ampliado || items[k].anadido) continue;
        items[k] = { ...items[k], ampliado: ac.gramos };
      } else {
        items.push({ clave: ac.clave, gramos: ac.gramos, unidad: ac.unidad, anadido: true });
      }
      const nuevo = ajustarComida(items, r.meta, composicion, amplitud);
      log.push(k >= 0
        ? { causa: 'acompanamiento_ampliado', momento: c.momento, id: c.id, detalle: `más ${items[k].clave} en vez de añadir ${ac.nombre}: el plato llegaba a ${r.kcal} de ${Math.round(r.meta.kcal)} kcal` }
        : { causa: 'acompanamiento_anadido', momento: c.momento, id: c.id, detalle: `${ac.nombre}: el plato llegaba a ${r.kcal} de ${Math.round(r.meta.kcal)} kcal` });
      resultado.set(c.id, { meta: r.meta, ...nuevo });
    }
  }

  // Segunda pasada: lo que no ha entrado por los límites de una comida se
  // reparte entre las que aún tienen margen.
  const ajustables = comidas.filter((c) => !c.libre);
  const medibles = ajustables.reduce((a, c) => a + parte(c), 0);
  const objetivoMedible = kcalDia * (medibles / totalPartes) - [...descuento.values()].reduce((a, d) => a + d.kcal, 0);
  const conseguido = [...resultado.values()].reduce((a, r) => a + r.kcal, 0);
  const resto = objetivoMedible - conseguido;
  if (Math.abs(resto) > 0.03 * objetivoMedible) {
    const conMargen = ajustables.filter((c) => resultado.get(c.id).items.some((i) => i.papel !== 'fijo' && !i.limitado));
    const partesMargen = conMargen.reduce((a, c) => a + parte(c), 0);
    for (const c of conMargen) {
      const tope = kcalDia * (TOPE[c.momento] || TOPE.tentempie) * (1 / escala) / (c.momento === 'tentempie' ? nTentempies : 1);
      const meta0 = metaDe(c);
      const extra = Math.min(resto * (parte(c) / partesMargen), Math.max(0, tope - meta0.kcal));
      const meta = metaDe(c, extra);
      resultado.set(c.id, { meta, ...ajustarComida(itemsDe.get(c.id), meta, composicion, amplitud) });
    }
    if (conMargen.length) log.push({ causa: 'reparto_del_resto', detalle: `${Math.round(resto)} kcal que no cabían en algunas comidas se reparten entre ${conMargen.map((c) => c.momento).join(', ')}` });
  }

  for (const c of ajustables) {
    const r = resultado.get(c.id);
    const limitados = r.items.filter((i) => i.limitado).map((i) => `${i.clave} (${i.limitado})`);
    log.push({
      causa: 'raciones_por_objetivo', momento: c.momento, id: c.id,
      detalle: `objetivo ${Math.round(r.meta.kcal)} kcal y ${Math.round(r.meta.proteina)} g de proteína → ${r.kcal} kcal y ${r.proteina} g${limitados.length ? `; en su límite: ${limitados.join(', ')}` : ''}`,
    });
    if (r.meta.proteinaMin && r.proteina < r.meta.proteinaMin - 0.5) {
      log.push({ causa: 'proteina_por_debajo_del_minimo', momento: c.momento, id: c.id, detalle: `${r.proteina} g frente a ${Math.round(r.meta.proteinaMin)} g: el plato no tiene ingredientes proteicos suficientes dentro de sus rangos` });
    }
  }
  const total = { kcal: [...resultado.values()].reduce((a, r) => a + r.kcal, 0) + Math.round(aparteKcal), proteina: [...resultado.values()].reduce((a, r) => a + r.proteina, 0) + Math.round(aparteProt) };
  return { comidas: Object.fromEntries([...resultado].map(([id, r]) => [id, { items: r.items, kcal: r.kcal, proteina: r.proteina, objetivo: { kcal: Math.round(r.meta.kcal), proteina: Math.round(r.meta.proteina) } }])), total, log };
}
