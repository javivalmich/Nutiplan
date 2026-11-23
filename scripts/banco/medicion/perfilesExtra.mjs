// Perfiles SINTÉTICOS extra para las mediciones de la guarnición (Javi, 2026-11-23). No están en el banco
// (scripts/banco/perfiles.mjs) para no cambiar sus cifras ni sus tests. Parten de omni-2174.
//   - omni-2174-batido: toma batido de proteína (1 cacito, 120 kcal y 24 g de proteína, después de entrenar), con los
//     valores por defecto de batidoDelDia (src/plan/racionesApp.js:36-44). Mismas kcal del día.
//   - omni-2174-volumen: objetivo de volumen (goal «mildGain», volumen limpio). Kcal = 2174 + 250, el ajuste de
//     GOAL_ADJ.mildGain (src/engine/constants.js:5) frente a «maintain», como hace calcTarget en la app.
import { PERFILES } from '../perfiles.mjs';

const base = PERFILES.find((x) => x.id === 'omni-2174');
const copia = (o) => JSON.parse(JSON.stringify(o));
export const PERFILES_EXTRA = Object.freeze([
  { id: 'omni-2174-batido', kcal: 2174, perfil: { ...copia(base.perfil), extras: { proteinShake: { enabled: true, scoops: 1, kcalPerScoop: 120, proteinPerScoop: 24, timing: 'post_entreno' } } } },
  { id: 'omni-2174-volumen', kcal: 2174 + 250, perfil: { ...copia(base.perfil), goal: 'mildGain' } },
]);
