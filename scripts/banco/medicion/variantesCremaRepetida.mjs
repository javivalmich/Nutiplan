// Crema repetida dentro de su ventana: MEDICIÓN, no producto (Javi, 2026-11-25). Hook de carga que aplica en memoria,
// sin modificar ningún archivo de src/:
//
//   - En cada hueco, una crema cuyo vegetal ya tiene otra crema en la semana (la «Crema de calabacín con gambas
//     encima» y la «Crema de calabacín con queso fresco y huevo», p. ej.) solo entra en el pool si va 2 o 3 días
//     después de la primera (la crema guardada en la nevera). Como mucho una repetición por vegetal. Fuera de la
//     ventana, o el mismo día, sale del pool, con vuelta atrás: si dejaría el hueco sin candidatos, no se aplica.
//   - Causas en el log: crema_repetida_fuera_de_ventana y crema_repetida_sin_aplicar. La repetición que queda (2 o 3
//     días después) es la que la app escribiría como «cocina el doble y guarda la mitad» / «la crema guardada».
//   - --soloPlantilla: la repetición solo vale entre dos cremas de plantilla (sopa_crema). Si una de las dos es una
//     ficha libre (crema_calabacin_queso_huevo), cuyo texto está cerrado, no se repite.
//   - El texto de la compra y la receta no se mide aquí: es de la propuesta (crema-repetida.md).
//
// Uso (desde la raíz del repo):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesCremaRepetida.mjs \
//     scripts/banco/medicion/controlGuarnicion.mjs . . <salida.json> <perfil> [semanas]
import { register } from 'node:module';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']; // DAYS_ORDER de engine2
const SOLO_PLANTILLA = process.argv.includes('--soloPlantilla');
const esPlantilla = (id) => typeof id === 'string' && id.startsWith('[');
const vegetal = (nombre) => ((String(nombre || '').match(/^crema (?:fría )?de ([a-záéíóúñ]+)/i) || [])[1] || '').toLowerCase() || null;

globalThis.__crema = {
  filtrar({ pool, day, momento, slots, nombrePorId, decisionLog }) {
    const i = DIAS.indexOf(day);
    const puestas = [];
    for (const s of slots.values()) {
      if (s.abierto || !s.dishId || (s.fixedRole === 'libre' && s.momento === 'comida')) continue;
      const v = vegetal(nombrePorId.get(s.dishId));
      if (v) puestas.push({ v, i: DIAS.indexOf(s.day), day: s.day, id: s.dishId });
    }
    if (!puestas.length) return pool;
    const motivo = (d) => {
      const v = vegetal(d.nombre || nombrePorId.get(d.id));
      if (!v) return null;
      const mismas = puestas.filter((x) => x.v === v);
      if (!mismas.length) return null;
      if (mismas.length >= 2) return `ya hay 2 cremas de ${v}`;
      if (SOLO_PLANTILLA && (!esPlantilla(d.id) || !esPlantilla(mismas[0].id))) return `crema de ${v} repetida con una ficha libre`;
      const dist = i - mismas[0].i;
      return dist === 2 || dist === 3 ? null : `crema de ${v} a ${dist} días de la del ${mismas[0].day}`;
    };
    const fuera = pool.filter((d) => motivo(d));
    const anota = (causa, evidencia) => decisionLog.push({ decisionId: `crema-${decisionLog.length}`, day, momentoCrema: momento, causa, evidencia, evento: true });
    if (!fuera.length) return pool;
    const sin = pool.filter((d) => !motivo(d));
    if (!sin.length) { anota('crema_repetida_sin_aplicar', `${day}/${momento}: todos los candidatos repiten crema fuera de su ventana; no se aplica`); return pool; }
    anota('crema_repetida_fuera_de_ventana', `${day}/${momento}: fuera ${fuera.length} candidatos (${[...new Set(fuera.map(motivo))].join('; ')}): una crema repetida va 2 o 3 días después de la primera`);
    return sin;
  },
};

const CAMBIOS = [
  ['/src/engine2/walk/runWalk.js',
    '      if (guarn) pool = filtrarPoolGuarnicion(guarn, { pool, day, momento, decisionLog, esCompuestoLegumbre, slots, familiaCache });',
    '      if (guarn) pool = filtrarPoolGuarnicion(guarn, { pool, day, momento, decisionLog, esCompuestoLegumbre, slots, familiaCache });\n      pool = globalThis.__crema.filtrar({ pool, day, momento, slots, nombrePorId, decisionLog });'],
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
    if (t.split(a).length !== 2) throw new Error('variantesCremaRepetida: ancla no encontrada (o repetida) en ' + sufijo + ': ' + ancla);
    t = t.replace(a, () => nuevo.split('\\n').join(nl));
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
