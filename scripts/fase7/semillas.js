// Reglas puras del escáner de semillas (Fase 7). Sin I/O.
// Produce ocurrencias por línea y las agrupa; no clasifica ni decide nada.

export const ESCANER_VERSION = 1;

export const CLASES_ADMITIDAS = ['uso', 'mencion/designacion', 'falso_positivo', 'R4_sin_resolver'];

export const TERMINOS = ['seed', 'semilla', 'mulberry32('];

// Fuentes de las expresiones (se publican tal cual en la cabecera del borrador).
export const FUENTES = {
  CONTEXTO: String.raw`seed|semilla|mulberry32\(`,
  LIT: String.raw`(?<![\w$]|\d\.)-?\d+(?![\w]|\.\d)`,
  TOKEN: String.raw`[\w$]*(?:seed|semilla)[\w$]*`,
};
const { LIT, TOKEN } = FUENTES;

export const REGLAS = {
  'R2-a': String.raw`(${LIT})\s*(?:–|-|\.\.)\s*(${LIT})`,
  'R2-b': String.raw`(${LIT})\s+a\s+(${LIT})`,
  'R2-c': String.raw`for\s*\(\s*(?:let|var|const)?\s*(${TOKEN})\s*=\s*(${LIT})\s*;\s*\1\s*(<=|<)\s*(${LIT})`,
  R3: String.raw`\[\s*${LIT}(?:\s*,\s*${LIT})*\s*,?\s*\]`,
  'R1-a': String.raw`(${TOKEN})["'${'`'}]?[\s:=(]*(${LIT})`,
  'R1-b': String.raw`mulberry32\(\s*(${LIT})\s*\)`,
  R4: 'línea con CONTEXTO sin coincidencia de R1, R2 ni R3',
};

const RE_CONTEXTO = new RegExp(FUENTES.CONTEXTO, 'i');
const nuevo = (fuente) => new RegExp(fuente, 'gid');

const ent = (s) => Number(s) + 0; // +0 normaliza -0

// Divide en líneas por \n, quitando un \r final; numeración desde 1 la pone quien consume.
export function dividirLineas(texto) {
  return texto.split('\n').map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l));
}

export function tieneContexto(linea) {
  return RE_CONTEXTO.test(linea);
}

// Analiza una línea. Devuelve { coincidencias, literalesNoConsumidos }.
// Cada coincidencia: { regla, valores, banderas, inicio }.
export function analizarLinea(linea) {
  if (!tieneContexto(linea)) return { coincidencias: [], literalesNoConsumidos: [] };

  const lits = [...linea.matchAll(nuevo(LIT))].map((m) => ({
    valor: ent(m[0]), ini: m.index, fin: m.index + m[0].length,
  }));
  const consumidos = [];
  const coincidencias = [];
  const solapa = (a, b) => consumidos.some(([i, f]) => a < f && b > i);

  // Una coincidencia se descarta si alguno de sus LIT cae en un tramo ya consumido.
  const aceptar = (regla, m, spansLit, valores, banderas) => {
    if (spansLit.some(([a, b]) => solapa(a, b))) return;
    consumidos.push([m.index, m.index + m[0].length]);
    coincidencias.push({ regla, valores, banderas, inicio: m.index });
  };
  const rango = (m, desde, hasta, extra, spansLit) => {
    const banderas = { ...extra };
    if (desde > hasta) banderas.rangoInvertido = true;
    aceptar('R2', m, spansLit, [desde, hasta], banderas);
  };

  // R2
  for (const m of linea.matchAll(nuevo(REGLAS['R2-a']))) {
    rango(m, ent(m[1]), ent(m[2]), {}, [m.indices[1], m.indices[2]]);
  }
  for (const m of linea.matchAll(nuevo(REGLAS['R2-b']))) {
    rango(m, ent(m[1]), ent(m[2]), {}, [m.indices[1], m.indices[2]]);
  }
  for (const m of linea.matchAll(nuevo(REGLAS['R2-c']))) {
    const exclusivo = m[3] === '<';
    const hasta = exclusivo ? ent(m[4]) - 1 : ent(m[4]);
    rango(m, ent(m[2]), hasta, exclusivo ? { limiteExclusivoConvertido: true } : {}, [m.indices[2], m.indices[4]]);
  }
  // R3
  for (const m of linea.matchAll(nuevo(REGLAS.R3))) {
    const fin = m.index + m[0].length;
    const dentro = lits.filter((l) => l.ini >= m.index && l.fin <= fin);
    aceptar('R3', m, dentro.map((l) => [l.ini, l.fin]), dentro.map((l) => l.valor), {});
  }
  // R1
  for (const m of linea.matchAll(nuevo(REGLAS['R1-a']))) {
    aceptar('R1', m, [m.indices[2]], [ent(m[2])], {});
  }
  for (const m of linea.matchAll(nuevo(REGLAS['R1-b']))) {
    aceptar('R1', m, [m.indices[1]], [ent(m[1])], {});
  }

  coincidencias.sort((a, b) => a.inicio - b.inicio);
  if (coincidencias.length === 0) {
    coincidencias.push({ regla: 'R4', valores: null, banderas: {}, inicio: 0 });
  }
  const literalesNoConsumidos = lits
    .filter((l) => !consumidos.some(([i, f]) => l.ini >= i && l.fin <= f))
    .map((l) => l.valor);
  return { coincidencias, literalesNoConsumidos };
}

// Ocurrencias de un texto completo. `base` aporta origen/blob/commit/rutas/primerCommit/...
export function ocurrenciasDeTexto(texto, base) {
  const out = [];
  dividirLineas(texto).forEach((linea, i) => {
    const { coincidencias, literalesNoConsumidos } = analizarLinea(linea);
    for (const c of coincidencias) {
      out.push({
        regla: c.regla,
        valores: c.valores,
        banderas: c.banderas,
        texto: linea,
        ...base,
        linea: i + 1,
        literalesNoConsumidos,
      });
    }
  });
  return out;
}

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const claveGrupo = (o) => JSON.stringify([o.regla, o.texto, o.valores]);

export function compararOcurrencias(a, b) {
  return cmp(a.origen, b.origen)
    || cmp(a.indicePrimerCommit, b.indicePrimerCommit)
    || cmp(a.blob ?? a.commit ?? '', b.blob ?? b.commit ?? '')
    || cmp(a.linea, b.linea);
}

// Agrupa por (regla + texto + valores). No descarta ninguna ocurrencia.
export function agrupar(ocurrencias) {
  const mapa = new Map();
  for (const o of ocurrencias) {
    const k = claveGrupo(o);
    if (!mapa.has(k)) mapa.set(k, { regla: o.regla, texto: o.texto, valores: o.valores, ocurrencias: [] });
    mapa.get(k).ocurrencias.push(o);
  }
  const grupos = [...mapa.entries()]
    .sort(([ka], [kb]) => {
      const a = JSON.parse(ka);
      const b = JSON.parse(kb);
      return cmp(a[0], b[0]) || cmp(a[1], b[1]) || cmp(JSON.stringify(a[2]), JSON.stringify(b[2]));
    })
    .map(([, g], i) => ({
      id: `G${String(i + 1).padStart(4, '0')}`,
      clave: { regla: g.regla, texto: g.texto, valores: g.valores },
      clasificacion: null,
      nota: null,
      ocurrencias: [...g.ocurrencias].sort(compararOcurrencias),
    }));
  comprobarAgrupacion(grupos, ocurrencias.length);
  return grupos;
}

// Comprobación obligatoria: ninguna ocurrencia se pierde al agrupar.
export function comprobarAgrupacion(grupos, detectadas) {
  const total = grupos.reduce((n, g) => n + g.ocurrencias.length, 0);
  if (total !== detectadas) {
    throw new Error(`agrupación inconsistente: ${total} ocurrencias en grupos, ${detectadas} detectadas`);
  }
}

// ¿Intersecta el grupo R1-R3 con [desde, hasta]? Un rango invertido se toma como el
// intervalo entre sus dos extremos (criterio conservador: muestra más, no menos).
export function intersecta(grupo, desde, hasta) {
  const { regla, valores } = grupo.clave;
  if (valores === null) return false;
  if (regla === 'R2') {
    const lo = Math.min(valores[0], valores[1]);
    const hi = Math.max(valores[0], valores[1]);
    return lo <= hasta && hi >= desde;
  }
  return valores.some((v) => v >= desde && v <= hasta);
}

// Binario = byte 0x00 en los primeros 8000 bytes.
export function esBinario(bytes) {
  const n = Math.min(bytes.length, 8000);
  for (let i = 0; i < n; i++) if (bytes[i] === 0) return true;
  return false;
}
