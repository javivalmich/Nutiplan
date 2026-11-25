// Prototipo: tiempo de cocina y experiencia en comidas y cenas de lunes a viernes. MEDICIÓN, no producto (Javi,
// 2026-11-25). Hook de carga que aplica en memoria, sin modificar ningún archivo de src/, esta regla sin pesos:
//
//   - tiempoCocina = «poco»    → de lunes a viernes, en comida y cena, solo platos con tramo_poco_tiempo = sí.
//   - experiencia  = «novato»  → de lunes a viernes, en comida y cena, solo platos de dificultad fácil.
//   - Las dos a la vez → las dos condiciones. Sábado y domingo, sin filtro. «normal», «mucho», «intermedio» y
//     «avanzado», sin filtro.
//   - El filtro va DESPUÉS de las demás reglas del hueco (no repetir plato, guarnición, cremas, tope de proteína,
//     tope de pescado, separación por proteína y por familia, huevo, aliño y nivel del día de legumbre) y ANTES de las
//     preferencias A y B, las frecuencias (paso 4) y la identidad de verdura (paso 5).
//   - Red: si el filtro deja el hueco sin candidatos, ese hueco se queda sin el filtro, con causa en el log
//     («regla_tiempo_red»).
//   - La sugerencia de la comida libre no es un plato servido: no se filtra. El capricho, si cae entre semana, se
//     filtra igual (con su red). El ancla de «cocinar en cantidad» (expandWeekArc) NO se filtra: se cuenta aparte.
//
// Valores de cada plato: «Vigente» de la hoja de tiempo y dificultad (PR #34, rama datos/tiempo-dificultad, commit
// 1d04de5), copiados en regla-tiempo-dificultad/vigente.csv.
//
// Uso (desde la raíz del repo):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/reglaTiempoDificultad.mjs \
//     scripts/banco/medicion/medirReglaTiempo.mjs <salida.json> <perfil> <tiempoCocina> <experiencia> [semanas]
import fs from 'node:fs';
import { register } from 'node:module';

const RAIZ = new URL('../../../', import.meta.url);
const ENTRE_SEMANA = new Set(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes']);

// ─── Vigente (vigente.csv) ──────────────────────────────────────────────────────────────────────────────────────────
function leerCsv(texto) {
  const filas = []; let fila = []; let campo = ''; let comillas = false;
  for (let k = 0; k < texto.length; k++) {
    const ch = texto[k];
    if (comillas) {
      if (ch === '"' && texto[k + 1] === '"') { campo += '"'; k++; } else if (ch === '"') comillas = false; else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === ';') { fila.push(campo); campo = ''; } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && texto[k + 1] === '\n') k++;
      fila.push(campo); campo = ''; if (fila.length > 1 || fila[0]) filas.push(fila); fila = [];
    } else campo += ch;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const [cab, ...resto] = filas;
  return resto.map((f) => Object.fromEntries(cab.map((c, k) => [c, f[k]])));
}
export const VIGENTE = new Map(leerCsv(fs.readFileSync(new URL('scripts/banco/medicion/regla-tiempo-dificultad/vigente.csv', RAIZ), 'utf8'))
  .map((f) => [f.id, { poco: f.poco, dificultad: f.dificultad, activo: Number(f.activo), total: Number(f.total), previa: f.previa }]));

const vigenteDe = (id) => {
  const v = VIGENTE.get(id);
  if (!v) throw new Error(`reglaTiempoDificultad: el plato «${id}» no está en vigente.csv`);
  return v;
};

// ─── La regla ───────────────────────────────────────────────────────────────────────────────────────────────────────
globalThis.__reglaTiempo = {
  vigenteDe,
  /** Filtra los candidatos de un hueco. Devuelve los candidatos con los que sigue el hueco. */
  filtrar({ candidatos, day, momento, profile, esSugerencia, pushEvent }) {
    const poco = profile && profile.tiempoCocina === 'poco';
    const novato = profile && profile.experiencia === 'novato';
    if (!poco && !novato) return candidatos;
    if (!ENTRE_SEMANA.has(day) || esSugerencia) return candidatos;
    const condiciones = [poco && 'tramo_poco_tiempo = sí', novato && 'dificultad fácil'].filter(Boolean).join(' y ');
    const quedan = candidatos.filter((d) => {
      const v = vigenteDe(d.id);
      return (!poco || v.poco === 'sí') && (!novato || v.dificultad === 'fácil');
    });
    if (!quedan.length) {
      pushEvent(day, 'regla_tiempo_red', `${day}/${momento}: ${condiciones} dejaría el hueco sin candidatos (0 de ${candidatos.length}); el hueco sigue sin el filtro`, { momento, reglaTiempo: { red: true, antes: candidatos.length, quedan: 0 } });
      return candidatos;
    }
    pushEvent(day, 'regla_tiempo_filtro', `${day}/${momento}: ${condiciones}: quedan ${quedan.length} de ${candidatos.length} candidatos`, { momento, reglaTiempo: { red: false, antes: candidatos.length, quedan: quedan.length } });
    return quedan;
  },
};

// ─── Cambios en memoria de src/ ─────────────────────────────────────────────────────────────────────────────────────
const CAMBIOS = [
  // El perfil del walk lleva tiempoCocina y experiencia (hoy no llegan a engine2).
  ['/src/plan/engine2App.js', '      dieta: dietaDe(profile),',
    '      dieta: dietaDe(profile),\n      tiempoCocina: profile.tiempoCocina, experiencia: profile.experiencia,'],
  // Hueco genérico: después de las reglas y del nivel del día de legumbre, antes de las preferencias A y B.
  ['/src/engine2/walk/runWalk.js', '      let notaA;',
    '      candidatesA = globalThis.__reglaTiempo.filtrar({ candidatos: candidatesA, day, momento, profile, esSugerencia, pushEvent });\n      let notaA;'],
  // Capricho entre semana: mismo filtro (comida o cena, aún sin decidir).
  ['/src/engine2/walk/runWalk.js', '    const caprichoPool = catalog.filter(',
    '    let caprichoPool = catalog.filter('],
  ['/src/engine2/walk/runWalk.js', '    if (caprichoPool.length === 0) {',
    "    caprichoPool = globalThis.__reglaTiempo.filtrar({ candidatos: caprichoPool, day: caprichoDay, momento: 'capricho', profile, esSugerencia: false, pushEvent });\n    if (caprichoPool.length === 0) {"],
];

const hooks = `
const CAMBIOS = ${JSON.stringify(CAMBIOS)};
export async function load(url, contexto, siguiente) {
  const r = await siguiente(url, contexto);
  const mios = CAMBIOS.filter(([sufijo]) => url.endsWith(sufijo));
  if (!mios.length) return r;
  let t = String(r.source);
  const nl = t.includes('\\r\\n') ? '\\r\\n' : '\\n';
  for (const [sufijo, ancla, nuevo] of mios) {
    const a = ancla.split('\\n').join(nl);
    if (t.split(a).length !== 2) throw new Error('reglaTiempoDificultad: ancla no encontrada (o repetida) en ' + sufijo + ': ' + ancla);
    t = t.replace(a, () => nuevo.split('\\n').join(nl));
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
process.stderr.write('[reglaTiempoDificultad] filtro de tiempo y experiencia entre semana, con red\n');
