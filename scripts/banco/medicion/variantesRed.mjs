// Variantes de la red de seguridad de D-116.5 (D-099 y pool vacío): MEDICIÓN, no producto. Hook de carga
// que se usa junto a medirEstructura.mjs; aplica en memoria, sin modificar ningún archivo de src/:
//   --red=actual        sin cambios: el motor tal cual. Desde ff2fa23 la red ya repite con la regla apagada; la
//                       red anterior (sin segundos, con los días sorteados) se mide con el motor de 3622d54.
//   --red=sinRegla      hasta 3622d54, la repetición con la regla apagada del todo (sin sorteo, D-024 como antes);
//                       desde ff2fa23 es lo que ya hace el motor y no transforma nada (igual que --red=actual)
//   --red=hoy           sin cambios en src/; para medir el motor de ba52d21 con las mismas métricas
//   --red-anterior      con --red=sinRegla, aplica los cambios en memoria sobre un motor anterior a ff2fa23
// En todos los casos añade a la lista de perfiles del banco (en memoria) dos perfiles SINTÉTICOS, de 2000 kcal
// como sin-pescado-2000: «gluten-sin-pescado-2000» y «lactosa-gluten-sin-pescado-2000».
// Uso (desde la raíz del repo o del worktree que se mida):
//   node --import ./scripts/banco/resolver.mjs --import <esta ruta> --import ./scripts/banco/medicion/estructuraComida.mjs \
//     scripts/banco/medicion/medirEstructura.mjs <salida.json> --ec=motor --red=sinRegla \
//     --perfiles sin-pescado-2000,gluten-sin-pescado-2000,lactosa-gluten-sin-pescado-2000 --semanas 200
import { register } from 'node:module';

const arg = process.argv.find((a) => a.startsWith('--red='));
const red = arg ? arg.slice('--red='.length) : 'actual';
if (!['actual', 'sinRegla', 'hoy'].includes(red)) throw new Error(`variantesRed: opción desconocida «${red}»`);
process.stderr.write(`[variantesRed] ${red}\n`);

const PERFILES_EXTRA = `  { id: 'gluten-sin-pescado-2000', kcal: 2000, perfil: { ...BASE, ...M62, mealsPerDay: 4, intolerances: ['gluten', 'pescado', 'mariscos'] } },
  { id: 'lactosa-gluten-sin-pescado-2000', kcal: 2000, perfil: { ...BASE, ...M62, mealsPerDay: 4, intolerances: ['lactosa', 'gluten', 'pescado', 'mariscos'] } },
]);`;
const CAMBIOS = [
  ['/scripts/banco/perfiles.mjs', ']);', PERFILES_EXTRA, 1],
  ...(red === 'sinRegla' && process.argv.includes('--red-anterior') ? [
    ['/src/engine2/walk/runWalk.js', 'walkConRedDeFamilia(input, { sinSegundos: true, intentos })',
      'walkConRedDeFamilia({ ...input, profile: { ...(input.profile || {}), __sinRegla: true } }, { sinSegundos: true, intentos })', 2],
    ['/src/engine2/walk/legumbre.js', "return profile?.dieta !== 'vegetariana' && profile?.dieta !== 'vegana';",
      "return !profile?.__sinRegla && profile?.dieta !== 'vegetariana' && profile?.dieta !== 'vegana';", 1],
  ] : []),
];
const hooks = `
const CAMBIOS = ${JSON.stringify(CAMBIOS)};
export async function load(url, contexto, siguiente) {
  const r = await siguiente(url, contexto);
  const mios = CAMBIOS.filter(([sufijo]) => url.endsWith(sufijo));
  if (!mios.length) return r;
  let t = String(r.source);
  for (const [sufijo, ancla, nuevo, veces] of mios) {
    const n = t.split(ancla).length - 1;
    if (n !== veces) throw new Error('variantesRed: ancla encontrada ' + n + ' veces (se esperaban ' + veces + ') en ' + sufijo + ': ' + ancla);
    t = t.split(ancla).join(nuevo);
  }
  return { ...r, source: t };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
