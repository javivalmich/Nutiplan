// «Rama sin comida doble»: MEDICIÓN, no producto. Hook de carga que aplica en memoria, sin modificar ningún
// archivo de src/, esta variante (Javi, 2026-11-22, «solo medir»):
//
//   El walk arranca siempre con la regla de D-116 y D-117 apagada, por el mismo camino que usa su red de
//   seguridad (D-116.5, repetirSinRegla): sin días de legumbre sorteados, sin segundos y con el paso 4 de D-024
//   como antes. Sin sorteo, runWalk no mira la red y devuelve la semana tal cual. Todo lo demás de la rama sigue
//   activo: tope de pescado (D-118), familia en días seguidos (D-115, con su propia red), raciones, SIBO.
//
// Uso (desde la raíz del repo, con el árbol de HEAD):
//   node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesSinComidaDoble.mjs \
//     scripts/banco/medicion/cortasProteina.mjs <raíz> <salida.json> <perfil> [semanas]
import { register } from 'node:module';

process.stderr.write('[variantesSinComidaDoble] la regla de D-116 y D-117 apagada siempre\n');

const ANCLA = '    resultado = walkConRedDeFamilia(input, { sinRegla: false, intentos });';
const NUEVO = '    resultado = walkConRedDeFamilia(input, { sinRegla: true, intentos });';

const hooks = `
const ANCLA = ${JSON.stringify(ANCLA)};
const NUEVO = ${JSON.stringify(NUEVO)};
export async function load(url, contexto, siguiente) {
  const r = await siguiente(url, contexto);
  if (!url.endsWith('/src/engine2/walk/runWalk.js')) return r;
  const t = String(r.source);
  if (t.split(ANCLA).length !== 2) throw new Error('variantesSinComidaDoble: ancla no encontrada (o repetida) en runWalk.js');
  return { ...r, source: t.replace(ANCLA, () => NUEVO) };
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
