// Decodificación y criterio de la primera Fase 7 (D-093; autorizado por D-098).
// Lee la clave, las dos extracciones selladas y el manifiesto, con sha256 fijados.
// No escribe ficheros: el informe sale por stdout. Sin dependencias del repositorio.
// Uso: node decodificar.mjs --clave <ruta> --ext-valoraciones <ruta> --ext-reconocimiento <ruta> --manifiesto <ruta>
// Código de salida: 0 informe emitido; 2 error o entrada no válida (no se emite resultado).

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SHA = {
  '--clave': '97cf01877e8d6587f17e2a5375095f6652a18b16de0b193a9bb54ce0631336b6',
  '--ext-valoraciones': 'b82a30f3b63887c8ab2595453ed31511e9c8d43b72dc48e261a00bcd8804e46b',
  '--ext-reconocimiento': 'ea50ab3678bea8ab2a9ec3965175ad6d0fc63e699444c1d50543f9764e47315b',
  '--manifiesto': '51e6cbf7c5305447f1ed6e46ca094cbe442740965b3abd8882894bdefe240a98',
};
const SEMILLA_CLAVE = 2457331441; // D-091
const ESCALA = ['Claramente A', 'Algo A', 'Igual', 'Algo B', 'Claramente B']; // D-095, A.2
const DESDE_A = [2, 1, 0, -1, -2]; // puntuación si engine2 es A (D-093, punto 4)
const DIMENSIONES = ['variedad', 'coherencia', 'equilibrio'];
const RECONOCIMIENTO = ['Sí', 'No', 'No lo sé'];
const DELTA = 0.5; // D-093, punto 5.d
const T_95_9 = 1.8331129326536335; // t(0,95; 9); D-093, punto 5.c (≈ 1,833)
const VETO = 3; // D-093, punto 5.e

class Fallo extends Error {}
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const fmt = (x, d) => {
  const s = x.toFixed(d).replace('.', ',');
  return /^-0,0+$/.test(s) ? s.slice(1) : s.replace(/^-/, '−');
};
const n4 = (x) => fmt(x, 4);
const n2 = (x) => fmt(x, 2);

function args(argv) {
  if (argv.length !== 8) throw new Fallo('uso: --clave --ext-valoraciones --ext-reconocimiento --manifiesto, cada uno con su ruta');
  const out = {};
  for (let i = 0; i < 8; i += 2) {
    if (!(argv[i] in SHA) || argv[i] in out) throw new Fallo(`argumento no válido: ${argv[i]}`);
    out[argv[i]] = argv[i + 1];
  }
  return out;
}

function main() {
  const a = args(process.argv.slice(2));
  const datos = {};
  for (const k of Object.keys(SHA)) {
    const b = readFileSync(a[k]);
    const h = sha256(b);
    console.log(`${k.slice(2)} sha256 ${h} ${h === SHA[k] ? 'coincide' : 'NO COINCIDE'}`);
    if (h !== SHA[k]) throw new Fallo(`sha256 de ${k.slice(2)} distinto del fijado en D-098`);
    datos[k] = JSON.parse(b.toString('utf8'));
  }
  const clave = datos['--clave'];
  const val = datos['--ext-valoraciones'];
  const rec = datos['--ext-reconocimiento'];
  const man = datos['--manifiesto'];

  if (clave.seed !== SEMILLA_CLAVE || clave.manifiestoSha256 !== SHA['--manifiesto']) throw new Fallo('clave: semilla o manifiesto distintos de D-091/D-094');
  if (!Array.isArray(clave.pares) || clave.pares.length !== 20) throw new Fallo('clave: se esperaban 20 pares');
  for (const [e, f] of [[val, 'valoraciones'], [rec, 'reconocimiento']]) {
    if (e.fase !== f || e.estructuraAlterada !== false || !Array.isArray(e.pares) || e.pares.length !== 20) throw new Fallo(`extracción de ${f}: forma no válida o estructura alterada`);
  }
  const casos = Object.fromEntries(man.casos.map((c) => [c.caso, c]));

  const filas = clave.pares.map((cp, k) => {
    const v = val.pares[k];
    const r = rec.pares[k];
    for (const x of [v, r]) {
      if (x.par !== k + 1 || cp.par !== k + 1 || x.etiquetaA !== cp.A.etiqueta || x.etiquetaB !== cp.B.etiqueta || x.asignada !== true) {
        throw new Fallo(`par ${k + 1}: las etiquetas de la extracción no corresponden a la clave`);
      }
    }
    const motores = [cp.A.motor, cp.B.motor].sort().join(',');
    if (motores !== 'engine2,legacy') throw new Fallo(`par ${k + 1}: motores no válidos`);
    const caso = casos[cp.caso];
    if (!caso) throw new Fallo(`par ${k + 1}: caso desconocido`);
    const e2EsA = cp.A.motor === 'engine2';
    const puntua = (valor) => {
      const i = ESCALA.indexOf(valor);
      if (i < 0) return null;
      return e2EsA ? DESDE_A[i] : -DESDE_A[i];
    };
    const p = v.respuestas.principal;
    const observada = p.ausente ? null : puntua(p.valido);
    if (!p.ausente && observada === null) throw new Fallo(`par ${k + 1}: valor principal fuera de la escala`);
    return {
      par: k + 1, semilla: caso.semilla, perfil: caso.perfil,
      observada, puntuacion: observada === null ? -2 : observada, imputada: observada === null,
      dims: Object.fromEntries(DIMENSIONES.map((d) => [d, v.respuestas[d].ausente ? null : puntua(v.respuestas[d].valido)])),
      reconocimiento: r.respuestas.reconocimiento.ausente ? null : r.respuestas.reconocimiento.valido,
    };
  });

  // Bloques por semilla (D-093, punto 5.b): un par P1 y otro P2.
  const semillas = [...new Set(filas.map((f) => f.semilla))].sort((x, y) => x - y);
  if (semillas.length !== 10) throw new Fallo('se esperaban 10 semillas');
  const ds = semillas.map((s) => {
    const b = filas.filter((f) => f.semilla === s);
    if (b.length !== 2 || b.map((f) => f.perfil).sort().join(',') !== 'P1,P2') throw new Fallo(`semilla ${s}: bloque no válido`);
    return { s, d: (b[0].puntuacion + b[1].puntuacion) / 2 };
  });
  const m = ds.reduce((t, x) => t + x.d, 0) / 10;
  const sd = Math.sqrt(ds.reduce((t, x) => t + (x.d - m) ** 2, 0) / 9);
  const L = m - (T_95_9 * sd) / Math.sqrt(10);
  const media20 = filas.reduce((t, f) => t + f.puntuacion, 0) / 20;
  const menos2 = filas.filter((f) => f.observada === -2).length;
  const imputadas = filas.filter((f) => f.imputada).length;
  const veto = menos2 >= VETO;
  const nivel1 = L > -DELTA && !veto;

  console.log('');
  console.log('Datos (D-093)');
  console.log(`pares 20; respuestas principales observadas ${20 - imputadas}; imputadas (−2, punto 11.f) ${imputadas}`);
  console.log(`puntuaciones por par (desde engine2): ${filas.map((f) => `${f.par}:${f.puntuacion > 0 ? '+' : ''}${f.puntuacion}${f.imputada ? '(imp)' : ''}`).join(' ')}`);
  console.log(`d_s por semilla: ${ds.map((x) => `${x.s}:${n2(x.d)}`).join(' ')}`);
  console.log(`media de los 20 pares ${n4(media20)}; m ${n4(m)}; s_d ${n4(sd)}; t(0,95;9) ${n4(T_95_9)}; L ${n4(L)}`);
  console.log('');
  console.log('Resultado (D-093, punto 7)');
  const ln = n4(L);
  if (nivel1) {
    console.log(`Se acredita la no inferioridad de engine2 frente a legacy conforme a D-093: L = ${ln} > −0,5; pares con −2 observado: ${menos2} (veto a partir de 3; veto no activado).`);
    if (L > 0) {
      console.log(`En los 20 pares de la primera Fase 7, valorados por un único evaluador sobre la vista común de comidas y cenas (D-086.1), se observa preferencia por engine2 respecto de cero: L = ${ln} > 0. Es evidencia limitada en los términos de D-093 (punto 6.d) y no acredita la tesis de D-048.`);
    } else {
      console.log(`En los 20 pares de la primera Fase 7, valorados por un único evaluador sobre la vista común de comidas y cenas (D-086.1), no se observa preferencia por engine2 respecto de cero: L = ${ln} ≤ 0. Es evidencia limitada en los términos de D-093 (punto 6.d) y no acredita la tesis de D-048.`);
    }
  } else {
    console.log(`No se acredita la no inferioridad de engine2 frente a legacy conforme a D-093: L = ${ln} ${L > -DELTA ? '>' : '≤'} −0,5; pares con −2 observado: ${menos2} (veto a partir de 3; veto ${veto ? 'activado' : 'no activado'}).`);
    console.log('Nivel 2 no examinado: no se cumplió el nivel 1 (D-093, punto 6.b).');
  }

  console.log('');
  console.log('Dimensiones (D-093, punto 8): no forman parte del criterio.');
  const etiq = { 2: 'claramente engine2', 1: 'algo engine2', 0: 'igual', [-1]: 'algo legacy', [-2]: 'claramente legacy' };
  for (const d of DIMENSIONES) {
    const xs = filas.map((f) => f.dims[d]).filter((x) => x !== null);
    const fr = [2, 1, 0, -1, -2].map((k) => `${etiq[k]} ${xs.filter((x) => x === k).length}`).join('; ');
    console.log(`${d}: ${fr}; ausentes ${20 - xs.length}; media ${xs.length ? n2(xs.reduce((t, x) => t + x, 0) / xs.length) : '—'}`);
  }
  console.log('');
  console.log('Perfiles (D-093, punto 9): descriptivo, sin efecto sobre la decisión.');
  for (const pf of ['P1', 'P2']) {
    const xs = filas.filter((f) => f.perfil === pf).map((f) => f.puntuacion);
    const mp = xs.reduce((t, x) => t + x, 0) / xs.length;
    console.log(`${pf}: media ${n4(mp)} (${xs.length} pares)${mp < -DELTA ? ' — por debajo de −0,5' : ''}`);
  }
  console.log('');
  console.log('Reconocimiento (D-093, punto 10): se registra y se describe; no es veto.');
  console.log(RECONOCIMIENTO.map((o) => `${o} ${filas.filter((f) => f.reconocimiento === o).length}`).join('; ') + `; ausentes ${filas.filter((f) => f.reconocimiento === null).length}`);
  return 0;
}

try {
  process.exitCode = main();
} catch (e) {
  console.error(`decodificar: ${e instanceof Fallo ? e.message : `error interno (${e && e.name}: ${e && e.message})`}`);
  process.exitCode = 2;
}
