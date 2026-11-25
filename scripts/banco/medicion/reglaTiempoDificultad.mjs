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
//   - Red del hueco: si el filtro deja el hueco sin candidatos, ese hueco se queda sin el filtro, con causa en el log
//     («regla_tiempo_red»).
//   - Red de la semana (2026-11-25, como la red de D-099.3 de la guarnición): el filtro mira un hueco cada vez y puede
//     gastar entre semana las proteínas rápidas (tope de 2 por especie), de modo que el fin de semana solo le queda una
//     especie y la separación por proteína ya no se puede aplicar. Si la semana filtrada incumple D-099.3, se repite
//     entera con la misma semilla sin el filtro y se queda la repetición solo si incumple MENOS
//     («regla_tiempo_retirada_d099»); si no mejora, se queda la filtrada («regla_tiempo_d099_sin_retirar»). Como
//     mucho una repetición por semana.
//   - La sugerencia de la comida libre no es un plato servido: no se filtra. No hay capricho entre semana: el
//     esqueleto lo retira (src/engine2/skeleton/buildWeekArc.js:412, caprichoDay = undefined) y el capricho de la
//     semana es la comida libre del sábado (buildWeekArc.js:84). El ancla de «cocinar en cantidad» (expandWeekArc)
//     NO se filtra: se cuenta aparte.
//   - Variante «bote» (argumento --bote): con tiempoCocina = «poco», los platos de legumbre que no son de poco tiempo
//     solo por el remojo o la cocción larga cuentan con su tiempo con legumbre de bote (columnas bote_* de
//     vigente.csv). La dificultad no cambia.
//
// Valores de cada plato: «Vigente» de la hoja de tiempo y dificultad (PR #34, rama datos/tiempo-dificultad, commit
// 1d04de5), copiados en regla-tiempo-dificultad/vigente.csv.
//
// Uso (desde la raíz del repo):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/reglaTiempoDificultad.mjs \
//     scripts/banco/medicion/medirReglaTiempo.mjs <salida.json> <perfil> <tiempoCocina> <experiencia> [semanas] [--bote]
import fs from 'node:fs';
import { register } from 'node:module';

const RAIZ = new URL('../../../', import.meta.url);
const ENTRE_SEMANA = new Set(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes']);
const BOTE = process.argv.includes('--bote');

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
  .map((f) => [f.id, {
    poco: f.poco, dificultad: f.dificultad, activo: Number(f.activo), total: Number(f.total), previa: f.previa,
    botePoco: f.bote_tramo_poco_tiempo || null,
  }]));

const vigenteDe = (id) => {
  const v = VIGENTE.get(id);
  if (!v) throw new Error(`reglaTiempoDificultad: el plato «${id}» no está en vigente.csv`);
  return v;
};
/** ¿Cuenta el plato como de poco tiempo? Con --bote, el tramo con legumbre de bote si el plato lo tiene. */
const pocoDe = (id) => {
  const v = vigenteDe(id);
  return BOTE && v.botePoco ? v.botePoco === 'sí' : v.poco === 'sí';
};

// ─── La regla ───────────────────────────────────────────────────────────────────────────────────────────────────────
const regla = {
  bote: BOTE,
  apagada: false,
  vigenteDe,
  pocoDe,
  /** Filtra los candidatos de un hueco. Devuelve los candidatos con los que sigue el hueco. */
  filtrar({ candidatos, day, momento, profile, esSugerencia, pushEvent }) {
    if (regla.apagada) return candidatos;
    const poco = profile && profile.tiempoCocina === 'poco';
    const novato = profile && profile.experiencia === 'novato';
    if (!poco && !novato) return candidatos;
    if (!ENTRE_SEMANA.has(day) || esSugerencia) return candidatos;
    const condiciones = [poco && `tramo_poco_tiempo = sí${BOTE ? ' (legumbre de bote)' : ''}`, novato && 'dificultad fácil'].filter(Boolean).join(' y ');
    const quedan = candidatos.filter((d) => (!poco || pocoDe(d.id)) && (!novato || vigenteDe(d.id).dificultad === 'fácil'));
    if (!quedan.length) {
      pushEvent(day, 'regla_tiempo_red', `${day}/${momento}: ${condiciones} dejaría el hueco sin candidatos (0 de ${candidatos.length}); el hueco sigue sin el filtro`, { momento, reglaTiempo: { red: true, antes: candidatos.length, quedan: 0 } });
      return candidatos;
    }
    pushEvent(day, 'regla_tiempo_filtro', `${day}/${momento}: ${condiciones}: quedan ${quedan.length} de ${candidatos.length} candidatos`, { momento, reglaTiempo: { red: false, antes: candidatos.length, quedan: quedan.length } });
    return quedan;
  },
  /** Ejecuta fn con el filtro apagado (la repetición de la red de la semana). */
  sinFiltro(fn) {
    regla.apagada = true;
    try { return fn(); } finally { regla.apagada = false; }
  },
  /** Red de la semana: si la semana filtrada incumple D-099.3, la repetición sin filtro, solo si incumple menos. */
  redSemana(input, semana, { infraccionesD099, repetir }) {
    const actuo = semana.decisionLog.some((e) => e.causa === 'regla_tiempo_filtro' || e.causa === 'regla_tiempo_red');
    if (!actuo) return semana;
    const antes = infraccionesD099(input, semana);
    if (!antes.length) return semana;
    let otra = null;
    let fallo = null;
    try { otra = repetir(); } catch (err) { fallo = err; }
    const despues = otra ? infraccionesD099(input, otra) : null;
    const evento = (log, causa, evidencia, extra) => log.push({
      decisionId: `walk-select-${log.length}`, day: undefined, momento: undefined, plato: undefined, causa, evidencia,
      alternativasDescartadas: [], evento: true, reglaTiempo: { semana: true, ...extra },
    });
    if (otra && despues.length < antes.length) {
      evento(otra.decisionLog, 'regla_tiempo_retirada_d099',
        `con el filtro de tiempo y experiencia la semana incumplía D-099.3 (${antes.join('; ')}); se repite entera con la misma semilla sin el filtro: ${despues.length ? despues.join('; ') : 'cumple'}; se queda la semana sin el filtro`,
        { antes, despues });
      return otra;
    }
    evento(semana.decisionLog, 'regla_tiempo_d099_sin_retirar',
      `con el filtro la semana incumple D-099.3 (${antes.join('; ')}); sin el filtro ${fallo ? `el walk falla (${fallo.message})` : `no mejora (${despues.join('; ')})`}; se queda la semana con el filtro`,
      { antes, despues });
    return semana;
  },
};
globalThis.__reglaTiempo = regla;

// ─── Cambios en memoria de src/ ─────────────────────────────────────────────────────────────────────────────────────
const RED_GUARNICION = [
  '      return redD099Guarnicion(input, resultado, {',
  '        repetir: () => walkConRedDeFamilia(input, { sinRegla: true, intentos, apagadaPorInterruptor: true, sinExclusionB: true }),',
  '        infraccionesD099,',
  '        anotarInfraccion,',
  '      });',
].join('\n');
const CON_RED_SEMANA = [
  '      const semanaFiltrada = redD099Guarnicion(input, resultado, {',
  '        repetir: () => walkConRedDeFamilia(input, { sinRegla: true, intentos, apagadaPorInterruptor: true, sinExclusionB: true }),',
  '        infraccionesD099,',
  '        anotarInfraccion,',
  '      });',
  '      return globalThis.__reglaTiempo.redSemana(input, semanaFiltrada, {',
  '        infraccionesD099,',
  '        repetir: () => globalThis.__reglaTiempo.sinFiltro(() => {',
  '          const intentos2 = [];',
  '          const r2 = walkConRedDeFamilia(input, { sinRegla: true, intentos: intentos2, apagadaPorInterruptor: true });',
  '          return redD099Guarnicion(input, r2, {',
  '            repetir: () => walkConRedDeFamilia(input, { sinRegla: true, intentos: intentos2, apagadaPorInterruptor: true, sinExclusionB: true }),',
  '            infraccionesD099,',
  '            anotarInfraccion,',
  '          });',
  '        }),',
  '      });',
].join('\n');
const CAMBIOS = [
  // El perfil del walk lleva tiempoCocina y experiencia (hoy no llegan a engine2).
  ['/src/plan/engine2App.js', '      dieta: dietaDe(profile),',
    '      dieta: dietaDe(profile),\n      tiempoCocina: profile.tiempoCocina, experiencia: profile.experiencia,'],
  // Hueco genérico: después de las reglas y del nivel del día de legumbre, antes de las preferencias A y B.
  ['/src/engine2/walk/runWalk.js', '      let notaA;',
    '      candidatesA = globalThis.__reglaTiempo.filtrar({ candidatos: candidatesA, day, momento, profile, esSugerencia, pushEvent });\n      let notaA;'],
  // Red de la semana, después de la red de D-099.3 de la guarnición (camino por defecto, regla de legumbre apagada).
  ['/src/engine2/walk/runWalk.js', RED_GUARNICION, CON_RED_SEMANA],
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
process.stderr.write(`[reglaTiempoDificultad] filtro de tiempo y experiencia entre semana, con red de hueco y de semana${BOTE ? '; variante legumbre de bote' : ''}\n`);
