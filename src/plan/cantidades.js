// cantidades — escribe en el texto de una comida (lo que ve el usuario: p1,
// p2, receta y lista de la compra) las cantidades nuevas que ha decidido
// engine2 (src/engine2/nutrientes/raciones.js).
//
// La comida la compuso el motor viejo con sus cantidades; aquí solo se
// cambian números, nunca ingredientes ni pasos:
//   - Compra: cada línea ya está ligada a su ingrediente; se cambian los
//     números de su paréntesis («Pechuga de pollo (230g)» → «(275g)»,
//     «Huevos (3 ud)» → «(4 ud)», «(700g en concha / 280g limpio)» en
//     proporción).
//   - Texto (p1, p2, receta): se trocea por «·», «+» y comas; cada trozo se
//     atribuye a un ingrediente por su cantidad antigua (si solo uno la
//     tenía) o por su nombre, y se cambian sus números.
// Lo que no se puede atribuir con seguridad se deja como estaba y se cuenta
// en «sinCambiar», para medirlo.

import { INGREDIENTES } from '../engine2/nutrientes/ingredientes.js';

const normal = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const r5 = (x) => Math.max(5, Math.round(x / 5) * 5);
const entero = (x) => Math.max(1, Math.round(x));

function fraccion(x) {
  const medios = Math.round(x * 2);
  const ent = Math.floor(medios / 2);
  const medio = medios % 2 === 1;
  if (ent === 0) return medio ? '½' : '1';
  return `${ent}${medio ? '½' : ''}`;
}
const leerNum = (s) => {
  if (s === '½') return 0.5;
  if (/^\d+\/\d+$/.test(s)) { const [a, b] = s.split('/').map(Number); return a / b; }
  return Number(String(s).replace(',', '.'));
};

/** Raíces del nombre para reconocerlo en el texto: palabras de 4 letras o más, sin el final (plural, género). */
const VACIAS = new Set(['fresco', 'fresca', 'frescos', 'frescas', 'para', 'temporada', 'natural', 'light', 'magra', 'magro', 'cocido', 'cocidos', 'cocidas', 'congelado', 'congelados']);
function raices(nombre) {
  return normal(nombre).split(/[^a-zñ]+/).filter((w) => w.length >= 4 && !VACIAS.has(w)).map((w) => w.slice(0, Math.max(4, w.length - 2)));
}

/**
 * Cambio de un ingrediente: valores mostrados antes y después.
 * @param {{clave, como, gramos:number, despues:number, texto:string, nombre:string}} it
 */
function cambioDe(it) {
  const ing = INGREDIENTES[it.clave];
  const f = it.despues / it.gramos;
  const paren = (it.texto.match(/\(([^)]*)\)/) || [])[1] || '';
  const valores = []; // { unidad: 'g'|'ml'|'n', antes, despues }
  if (it.como === 'ud') {
    const m = paren.match(/^(\d+\/\d+|½|\d+(?:[.,]\d+)?)/) || it.nombre.match(/^(\d+)/);
    const unidades = it.despues / ing.gUd;
    if (m) valores.push({ unidad: 'n', antes: leerNum(m[1]), despues: unidades, mediaUd: Number.isInteger(unidades) ? false : true });
    for (const g of paren.matchAll(/(\d+)\s*g\b/g)) valores.push({ unidad: 'g', antes: Number(g[1]), despues: r5(Number(g[1]) * f) });
  } else {
    const gs = [...paren.matchAll(/(\d+(?:[.,]\d+)?)\s*g\b/g)].map((x) => leerNum(x[1]));
    gs.forEach((v, i) => valores.push({ unidad: 'g', antes: v, despues: i === gs.length - 1 && it.como === 'g' ? Math.round(it.despues) : r5(v * f) }));
    if (it.como === 'ml (texto)') valores.push({ unidad: 'ml', antes: Math.round(it.gramos / (ing.gMl || 1)), despues: r5(it.despues / (ing.gMl || 1)) });
    const ml = paren.match(/(\d+(?:[.,]\d+)?)\s*ml/);
    if (ml) valores.push({ unidad: 'ml', antes: leerNum(ml[1]), despues: it.como === 'ml' ? r5(it.despues / (ing.gMl || 1)) : r5(leerNum(ml[1]) * f) });
    const cuentas = [...paren.matchAll(/(\d+)\s*(?:-\s*(\d+)\s*)?(unidades|unidad|ud|lonchas?|rebanadas?|piezas?)\b/g)];
    for (const c of cuentas) valores.push({ unidad: 'n', antes: Number(c[1]), despues: entero(Number(c[1]) * f), hasta: c[2] ? Number(c[2]) : null });
  }
  return { ...it, f, valores, raices: raices(it.nombre) };
}

function formatoN(v) {
  return Number.isInteger(v) ? String(v) : fraccion(v);
}

/** Cambia los números del paréntesis (y un «+ Ng» detrás) de una línea de la compra. */
function reescribirLinea(c) {
  let usados = c.valores.slice();
  const tomar = (unidad, antes) => {
    const i = usados.findIndex((v) => v.unidad === unidad && Math.abs(v.antes - antes) < 1e-9);
    if (i < 0) return null;
    const [v] = usados.splice(i, 1);
    return v;
  };
  let linea = c.texto.replace(/\(([^)]*)\)/, (todo, paren) => {
    let p = paren;
    p = p.replace(/(\d+(?:[.,]\d+)?)(\s*)(g\b|ml)/g, (m, n, esp, u) => {
      const v = tomar(u === 'ml' ? 'ml' : 'g', leerNum(n));
      return v ? `${v.despues}${esp}${u}` : m;
    });
    p = p.replace(/(\d+)\s*-\s*(\d+)(\s*)(unidades|unidad|ud|lonchas?|rebanadas?|piezas?)\b/, (m, a, b, esp, u) => {
      const v = tomar('n', Number(a));
      if (!v) return m;
      const fb = entero(Number(b) * c.f);
      return v.despues === fb ? `${v.despues}${esp}${u}` : `${v.despues}-${fb}${esp}${u}`;
    });
    p = p.replace(/^(\d+\/\d+|½|\d+(?:[.,]\d+)?)(?=\s|$|\s*(ud|unidad|unidades|lonchas?|rebanadas?|piezas?|grandes?|medianas?)\b)/, (m, n) => {
      const v = tomar('n', leerNum(n));
      return v ? formatoN(v.despues) : m;
    });
    return `(${p})`;
  });
  if (!/\(/.test(c.texto) && c.como === 'ud') {
    linea = linea.replace(/^(\d+)/, (m, n) => { const v = tomar('n', Number(n)); return v ? formatoN(v.despues) : m; });
  }
  linea = linea.replace(/\)\s*\+\s*(\d+)\s*g\b/, (m, n) => m.replace(n, String(r5(Number(n) * c.f))));
  return linea;
}

const TOKEN_G = /(\d+(?:[.,]\d+)?)(\s*)(g\b|ml\b)/g;
const TOKEN_N = /(^|[\s(])(\d+\/\d+|½|\d+)(\s+)(?!(?:min|minutos|segundos|horas?|veces|cm|mm|dedos)\b)(?=[a-záéíóúñ])/gi;

// Singular y plural de lo que se cuenta: «1 huevo», «3 huevos».
const CONTABLES = [['huevo', 'huevos'], ['clara', 'claras'], ['rebanada', 'rebanadas'], ['loncha', 'lonchas'],
  ['pieza', 'piezas'], ['tostada', 'tostadas'], ['unidad', 'unidades'], ['yogur', 'yogures'], ['tortilla', 'tortillas'],
  ['croqueta', 'croquetas'], ['pita', 'pitas'], ['plátano', 'plátanos'], ['grande', 'grandes'], ['mediana', 'medianas']];
const ADJETIVOS = [['duro', 'duros'], ['cocido', 'cocidos'], ['revuelto', 'revueltos'], ['frito', 'fritos'], ['escalfado', 'escalfados'], ['pochado', 'pochados'], ['grande', 'grandes'], ['mediano', 'medianos'], ['pequeño', 'pequeños']];
function concordar(texto) {
  let t = texto;
  for (const [sg, pl] of ADJETIVOS) {
    t = t.replace(new RegExp(`(^|[\\s(])(1|½)(\\s+\\S+?)\\s+${pl}\\b`, 'gi'), (m, pre, n, nombre) => `${pre}${n}${nombre} ${sg}`);
  }
  for (const [sg, pl] of CONTABLES) {
    t = t.replace(new RegExp(`(^|[\\s(])(1|½)\\s+${pl}\\b`, 'gi'), (m, pre, n) => `${pre}${n} ${sg}`);
    t = t.replace(new RegExp(`(^|[\\s(])(\\d+(?:½)?|\\d+½)\\s+${sg}\\b(?!s)`, 'gi'), (m, pre, n) => (n === '1' ? m : `${pre}${n} ${pl}`));
  }
  return t;
}

/** Reescribe un texto libre (p1, p2, un paso de receta). */
function reescribirTexto(texto, cambios, cuenta) {
  if (!texto) return texto;
  const partes = String(texto).split(/(\s·\s|\s\+\s|,\s|\s—\s)/);
  return partes.map((trozo, i) => {
    if (i % 2 === 1) return trozo; // separador
    const tokensG = [...trozo.matchAll(TOKEN_G)];
    const tokensN = [...trozo.matchAll(TOKEN_N)];
    if (!tokensG.length && !tokensN.length) return trozo;
    const n = normal(trozo);
    const porNombre = cambios.filter((c) => c.raices.some((w) => n.includes(w)));
    // A qué ingrediente pertenece el trozo. Se mira entre TODOS los
    // ingredientes de la comida (también los que no cambian), para no tomar
    // «60g espinacas» por el pan solo porque el pan también tenía 60 g.
    let duenio = null;
    let algunaCoincide = false;
    for (const t of tokensG) {
      const unidad = t[3] === 'ml' ? 'ml' : 'g';
      const cand = cambios.filter((c) => c.valores.some((v) => v.unidad === unidad && Math.abs(v.antes - leerNum(t[1])) < 1e-9));
      if (cand.length) algunaCoincide = true;
      const nombrados = cand.filter((c) => porNombre.includes(c));
      const elegido = nombrados.length === 1 ? nombrados[0] : (cand.length === 1 && !porNombre.length ? cand[0] : null);
      if (elegido) { duenio = elegido; break; }
    }
    // Por el nombre solo si ninguna cantidad del trozo es de un ingrediente conocido.
    if (!duenio && !algunaCoincide && porNombre.length === 1) duenio = porNombre[0];
    if (!duenio || duenio.f === 1) {
      if (!duenio) {
        const mios = tokensG.filter((t) => cambios.some((c) => c.f !== 1 && c.valores.some((v) => v.unidad !== 'n' && Math.abs(v.antes - leerNum(t[1])) < 1e-9)));
        if (mios.length) cuenta.sinCambiar += mios.length;
      }
      return trozo;
    }
    let r = trozo.replace(TOKEN_G, (m, num, esp, u) => {
      const unidad = u === 'ml' ? 'ml' : 'g';
      const v = duenio.valores.find((x) => x.unidad === unidad && Math.abs(x.antes - leerNum(num)) < 1e-9);
      if (v) return `${v.despues}${esp}${u}`;
      // Otra cantidad del mismo ingrediente (p. ej. «(125g)» junto a «200g»): en proporción.
      return `${r5(leerNum(num) * duenio.f)}${esp}${u}`;
    });
    r = r.replace(TOKEN_N, (m, pre, num, esp) => {
      const v = duenio.valores.find((x) => x.unidad === 'n' && Math.abs(x.antes - leerNum(num)) < 1e-9);
      const nuevo = v ? v.despues : (duenio.como === 'ud' ? null : entero(leerNum(num) * duenio.f));
      return nuevo == null ? m : `${pre}${formatoN(nuevo)}${esp}`;
    });
    return concordar(r);
  }).join('');
}

/**
 * Aplica a una comida las cantidades nuevas.
 * @param {object} meal comida compuesta
 * @param {{clave, como, gramos, despues, texto, nombre}[]} items ingredientes leídos con su cantidad nueva
 * @returns {{ meal: object, sinCambiar: number }}
 */
export function reescribirComida(meal, items) {
  const validos = items.filter((it) => it.gramos > 0);
  const todos = validos.map((it) => (Math.abs(it.despues - it.gramos) > 0.05 ? cambioDe(it) : { ...cambioDe({ ...it, despues: it.gramos }), f: 1 }));
  const cambios = todos.filter((c) => c.f !== 1);
  if (!cambios.length) return { meal, sinCambiar: 0 };
  const cuenta = { sinCambiar: 0 };
  const porLinea = new Map(cambios.map((c) => [c.texto, c]));
  const shopping = (meal.shopping || []).map((s) => (porLinea.has(String(s)) ? reescribirLinea(porLinea.get(String(s))) : s));
  const nuevo = {
    ...meal,
    p1: reescribirTexto(meal.p1, todos, cuenta),
    p2: reescribirTexto(meal.p2, todos, cuenta),
    shopping,
    recipe: Array.isArray(meal.recipe) ? meal.recipe.map((paso) => (typeof paso === 'string' ? reescribirTexto(paso, todos, cuenta) : paso)) : meal.recipe,
  };
  return { meal: nuevo, sinCambiar: cuenta.sinCambiar };
}
