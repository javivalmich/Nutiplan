// Nivel de legumbre solo con segundo posible: MEDICIÓN, no producto. Hook de carga que aplica en memoria, sin
// modificar ningún archivo de src/, esta variante de D-117.2 (Javi, 2026-11-22, «solo medir»):
//
//   En la comida de un día sorteado, el nivel de legumbre solo se fija si ese día hay al menos un segundo posible:
//   un plato que vale de segundo (rotativo, esSegundoDeLegumbre), sin usar en la semana ni en la anterior, sin vetar,
//   que cumpla a la vez, con los platos ya puestos, el tope por especie (2/semana), la separación por especie (mismo
//   día o el de al lado) y la familia en días seguidos (si el walk la aplica). El tope de pescado no hace falta: un
//   segundo nunca es pescado (D-116.2). Si no hay ninguno, el día sigue la cascada normal de los días no sorteados
//   (suelo de legumbre inactivo, D-117.4), con la causa `dia_legumbre_sin_segundo_posible` en el log.
//
// Uso (desde la raíz del repo, con el árbol de HEAD):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesNivelSegundo.mjs \
//     scripts/banco/medicion/cortasProteina.mjs <raíz> <salida.json> <perfil> [semanas]
import { register } from 'node:module';

process.stderr.write('[variantesNivelSegundo] el nivel de legumbre del día sorteado pide un segundo posible\n');

globalThis.__ns = {
  /** ¿Hay algún segundo que cumpla a la vez tope por especie, separación y familia con lo ya puesto? */
  haySegundo({ i, slots, catalog, usedIds, usedNames, recientes, vetoedIds, sinFamilia, proteinaDe, familiaDe, esSegundo, tope, DAYS_ORDER }) {
    const pool = catalog.filter((d) => d.rol === 'rotativo' && esSegundo(d) && !usedIds.has(d.id) && !usedNames.has(d.nombre || d.id)
      && !vetoedIds.has(d.id) && !recientes.has(d.nombre || d.id));
    if (!pool.length) return { hay: false, motivo: 'ningún plato que valga de segundo sin usar en la semana ni en la anterior' };
    const puestos = [...slots.values()].filter((s) => !s.abierto && s.dishId);
    const dist = (s) => Math.abs(DAYS_ORDER.indexOf(s.day) - i);
    const cuenta = new Map();
    for (const s of puestos) { const p = proteinaDe(s.dishId); if (p) cuenta.set(p, (cuenta.get(p) || 0) + 1); }
    const cercanas = new Set(puestos.filter((s) => dist(s) <= 1).map((s) => proteinaDe(s.dishId)).filter(Boolean));
    const familias = new Set(sinFamilia ? [] : puestos.filter((s) => dist(s) === 1 && !(s.fixedRole === 'libre' && s.momento === 'comida'))
      .map((s) => familiaDe(s.dishId)).filter(Boolean));
    const vale = (d) => (cuenta.get(proteinaDe(d.id)) || 0) < tope && !cercanas.has(proteinaDe(d.id)) && !familias.has(familiaDe(d.id));
    return pool.some(vale)
      ? { hay: true }
      : { hay: false, motivo: `ninguno de los ${pool.length} platos que valen de segundo cumple a la vez el tope por especie (${tope}/semana), la separación por especie${sinFamilia ? '' : ' y la familia en días seguidos'}` };
  },
};

const ANCLA = "      if (legumbre && momento === 'comida' && legumbre.dias.has(day)) {";
const NUEVO = `      const __seg = legumbre && momento === 'comida' && legumbre.dias.has(day)
        ? globalThis.__ns.haySegundo({ i, slots, catalog, usedIds, usedNames, recientes, vetoedIds, sinFamilia, proteinaDe: proteinaCache, familiaDe: familiaCache, esSegundo: esSegundoDeLegumbre, tope: TOPE_PROTEINA_SEMANA, DAYS_ORDER })
        : null;
      if (__seg && !__seg.hay) pushEvent(day, 'dia_legumbre_sin_segundo_posible', \`\${day} es dia de legumbre, pero no hay segundo posible (\${__seg.motivo}); el dia sigue la cascada normal\`);
      if (legumbre && momento === 'comida' && legumbre.dias.has(day) && __seg && __seg.hay) {`;

const hooks = `
const ANCLA = ${JSON.stringify(ANCLA)};
const NUEVO = ${JSON.stringify(NUEVO)};
export async function load(url, contexto, siguiente) {
  const r = await siguiente(url, contexto);
  if (!url.endsWith('/src/engine2/walk/runWalk.js')) return r;
  let t = String(r.source);
  const nl = t.includes('\\r\\n') ? '\\r\\n' : '\\n';
  const a = ANCLA.split('\\n').join(nl);
  if (t.split(a).length !== 2) throw new Error('variantesNivelSegundo: ancla no encontrada (o repetida) en runWalk.js');
  t = t.replace(a, () => NUEVO.split('\\n').join(nl));
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
