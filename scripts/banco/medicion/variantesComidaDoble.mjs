// Variantes de la comida doble (aceite y elección del primero): MEDICIÓN, no producto. Hook de carga que se usa
// junto a medirEstructura.mjs (--ec=off, la app tal cual) y aplica en memoria, sin modificar ningún archivo de src/:
//
//   --aceite=actual        sin cambios
//   --aceite=tope          la comida doble no lleva más aceite que el máximo de un plato único en esa comida
//                          (rango del aceite en raciones.js, 20 g): el del primero queda en 5 g y el del segundo
//                          como mucho en 15 g. Lo que falte de kcal lo cubre la legumbre hasta su tope y, después,
//                          el pan o la fruta, como hoy.
//   --aceite=topeSegundo   como «tope», y antes del pan o la fruta crece el segundo (el proteico) dentro de su rango
//                          (lo pedido por Javi el 2026-11-16)
//   --aceite=topeSegundo10 como «topeSegundo», con el aceite repartido 10 g y 10 g (el primero es un guiso, que
//                          pocha la cebolla en el aceite; el segundo es una plancha o un horno)
//
//   --primero=actual       sin cambios
//   --primero=noUsados     en la comida de un día sorteado, dentro del nivel de legumbre y antes de A y B, se
//                          prefiere una legumbre que no salga ya en la semana y, después, un aliño que no salga ya en
//                          la semana (en ningún plato servido, segundos incluidos). Cada preferencia se relaja si deja
//                          el hueco sin candidatos, con su causa en el log.
//   --primero=noUsadosPrimeros  igual, pero el aliño se compara solo con los otros primeros de la semana
//
//   --diag-primero=<salida.json>  registra, en cada comida de un día sorteado con nivel de legumbre, qué compuestos de
//                          legumbre quedan tras cada filtro de runWalk.js (no cambia nada). Se escribe al salir.
//
// Uso (desde la raíz del repo):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesComidaDoble.mjs \
//     scripts/banco/medicion/medirEstructura.mjs <salida.json> --ec=off --aceite=tope [--semanas 200]
import fs from 'node:fs';
import { register } from 'node:module';

const valor = (n, def) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : def; };
const aceite = valor('aceite', 'actual');
const primero = valor('primero', 'actual');
const diag = valor('diag-primero', null);
if (!['actual', 'tope', 'topeSegundo', 'topeSegundo10'].includes(aceite)) throw new Error(`variantesComidaDoble: --aceite=${aceite} desconocido`);
if (!['actual', 'noUsados', 'noUsadosPrimeros'].includes(primero)) throw new Error(`variantesComidaDoble: --primero=${primero} desconocido`);
process.stderr.write(`[variantesComidaDoble] aceite ${aceite}, primero ${primero}${diag ? `, diagnóstico en ${diag}` : ''}\n`);

// ─── Lógica (hilo principal; la llama el código transformado) ────────────────
const registros = [];
globalThis.__vcd = {
  aceite, primero,
  /** Preferencias del primero (variantes noUsados*): legumbre y aliño que no salen ya en la semana. */
  preferir({ day, candidatesA, slots, catalog, proteinaCache, alinoDe, esCompuestoLegumbre, pushEvent }) {
    const porId = new Map(catalog.map((d) => [d.id, d]));
    const servidos = [...slots.values()].filter((s) => !s.abierto && s.dishId && !(s.fixedRole === 'libre' && s.momento === 'comida'));
    let c = candidatesA;
    const legUsadas = new Set(servidos.map((s) => proteinaCache(s.dishId)).filter(Boolean));
    const f1 = c.filter((d) => !legUsadas.has(proteinaCache(d.id)));
    if (f1.length && f1.length < c.length) { pushEvent(day, 'primero_legumbre_no_usada', `primero: descarta ${c.length - f1.length} de ${c.length} candidatos de legumbre que ya salen esta semana (${[...legUsadas].join(', ')})`); c = f1; }
    else if (!f1.length) pushEvent(day, 'primero_legumbre_no_usada_sin_aplicar', `primero: todas las legumbres candidatas ya salen esta semana; no se aplica`);
    const deAlino = primero === 'noUsadosPrimeros' ? servidos.filter((s) => s.momento === 'comida' && !s.segundo && porId.has(s.dishId) && esCompuestoLegumbre(porId.get(s.dishId))) : servidos;
    const alinos = new Set(deAlino.map((s) => alinoDe(porId.get(s.dishId))).filter(Boolean));
    const f2 = c.filter((d) => !alinos.has(alinoDe(d)));
    if (f2.length && f2.length < c.length) { pushEvent(day, 'primero_alino_no_usado', `primero: descarta ${c.length - f2.length} de ${c.length} candidatos con un aliño que ya sale ${primero === 'noUsadosPrimeros' ? 'en otro primero' : 'esta semana'} (${[...alinos].join(', ')})`); c = f2; }
    else if (!f2.length) pushEvent(day, 'primero_alino_no_usado_sin_aplicar', `primero: todos los candidatos llevan un aliño que ya sale; no se aplica`);
    return c;
  },
  registrar(r) { registros.push(r); },
};
if (diag) process.on('exit', () => fs.writeFileSync(diag, JSON.stringify(registros)));

// ─── Cambios en memoria ──────────────────────────────────────────────────────
const RW = '/src/engine2/walk/runWalk.js';
const RA = '/src/plan/racionesApp.js';
const RN = '/src/engine2/nutrientes/raciones.js';
const G = 'globalThis.__vcd';
const ids = (xs) => `${xs}.filter(esCompuestoLegumbre).map((d) => d.id)`;
const CAMBIOS = [];
if (primero !== 'actual') {
  CAMBIOS.push([RW, '          candidatesA = nivel;',
    `          candidatesA = nivel;\n          candidatesA = ${G}.preferir({ day, candidatesA, slots, catalog, proteinaCache, alinoDe, esCompuestoLegumbre, pushEvent });`]);
}
if (diag) {
  CAMBIOS.push([RW, '      pushFill(\n        day,\n        momento,\n        chosen.id,',
    `      if (nivelLegumbre) ${G}.registrar({ seed, day, pool: ${ids('pool')}, tope: ${ids('base0')}, separada: ${ids('baseF')}, familia: ${ids('baseH')}, alino: ${ids('candidatesA0')}, nivel: nivelLegumbre.candidatos, A: ${ids('candidatesA')}, B: ${ids('candidatesB')}, paso5: ${ids('candidatesIdentidad')}, elegido: chosen.id, ajillosSemana, alinosHoy: [...alinosHoy], sinFamilia: !!sinFamilia, sinRegla: !!sinRegla });\n      pushFill(\n        day,\n        momento,\n        chosen.id,`]);
  CAMBIOS.push([RW, '      let candidatesA = poolAlino.length ? poolAlino : base1;',
    '      let candidatesA = poolAlino.length ? poolAlino : base1;\n      const candidatesA0 = candidatesA;']);
}
if (aceite !== 'actual') {
  // El aceite de cada plato de la comida doble con su máximo propio: 5 g el del primero y 15 g el del segundo (20 g
  // entre los dos, el máximo de un plato único). `ampliado` se suma al máximo del rango (el aceite no crece con la
  // amplitud del objetivo). Con topeSegundo, el proteico del segundo queda marcado para crecer.
  CAMBIOS.push([RA, "  if (it.plato !== 1 || !esLegumbre(it.clave)) return {};",
    `  if (it.clave === 'aove' || it.clave === 'aceite_semillas') return { ampliado: (${G}.aceite === 'topeSegundo10' ? 10 : it.plato === 1 ? 5 : 15) - rangoDe(it.clave, 'g')[1] };\n  if (it.plato === 2 && ${G}.aceite.startsWith('topeSegundo') && papelDe(it.clave, composicion[it.clave]) === 'proteico') return { crecer: true };\n  if (it.plato !== 1 || !esLegumbre(it.clave)) return {};`]);
  CAMBIOS.push([RA, "import { racionesDia, rangoDe, AMPLITUD_MAX, KCAL_RACION_NORMAL } from '../engine2/nutrientes/raciones.js';",
    "import { racionesDia, rangoDe, AMPLITUD_MAX, KCAL_RACION_NORMAL, papelDe } from '../engine2/nutrientes/raciones.js';"]);
  // topeSegundo: si no queda ningún energético libre (legumbre en su tope y aceite en su máximo) y faltan kcal,
  // crece el proteico marcado hasta su máximo, antes de que racionesDia añada pan o fruta.
  CAMBIOS.push([RN, '  // Medidas de casa.\n',
    `  {\n    const crecen = estado.filter((e) => e.crecer && e.papel === 'proteico' && e.rango && !e.limitado);\n    if (crecen.length && !estado.some((e) => e.papel === 'energetico' && !e.limitado)) {\n      const falta = meta.kcal - suma(estado, composicion, (e) => e.nuevo).kcal;\n      if (falta > 0) for (const e of crecen) { const g = e.nuevo + (falta * 100) / composicion[e.clave].kcal / crecen.length; if (g >= e.rango[1]) { e.nuevo = e.rango[1]; e.limitado = 'maximo'; } else e.nuevo = g; }\n    }\n  }\n  // Medidas de casa.\n`]);
}

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
    if (t.split(a).length !== 2) throw new Error('variantesComidaDoble: ancla no encontrada (o repetida) en ' + sufijo + ': ' + ancla);
    t = t.replace(a, () => nuevo.split('\\n').join(nl));
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
