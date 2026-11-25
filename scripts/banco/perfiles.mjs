// Perfiles SINTÉTICOS del banco I-0. Ninguno es un usuario real ni procede de
// producción. Las calorías se fijan a mano (no se calculan del perfil) para
// que la línea base no dependa de calcTDEE/calcTarget.
//
// Semillas: la app usa seed = `${userId}:${weekNumber}`. El banco usa
// userId = `banco-${id}` y semanas consecutivas desde SEMANA_INICIAL, cada una
// con los platos de la anterior (platosRecientesPara), como en producción.
// No coincide con las semillas del visor (90001–90010, D-099.9) ni con Fase 7.

const BASE = Object.freeze({ intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {} });
const H74 = { gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', trainingDays: ['Lunes', 'Miércoles', 'Viernes'] };
const M60 = { gender: 'female', age: 32, weight: 60, height: 163, activity: 'light', goal: 'fatLossGeneral', trainingDays: ['Martes', 'Jueves'] };
const H90 = { gender: 'male', age: 28, weight: 90, height: 185, activity: 'active', goal: 'muscleGain', trainingDays: ['Lunes', 'Martes', 'Jueves', 'Viernes'] };
const M62 = { gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', trainingDays: ['Martes'] };

export const SEMANA_INICIAL = 60;
export const SEMANAS_POR_DEFECTO = 8;
export const MES = 9;

export const PERFILES = Object.freeze([
  { id: 'omni-1434', kcal: 1434, perfil: { ...BASE, ...M60, mealsPerDay: 4 } },
  { id: 'omni-2174', kcal: 2174, perfil: { ...BASE, ...H74, mealsPerDay: 4 } },
  { id: 'omni-2600-3comidas', kcal: 2600, perfil: { ...BASE, ...H74, mealsPerDay: 3 } },
  { id: 'omni-3714', kcal: 3714, perfil: { ...BASE, ...H90, mealsPerDay: 5 } },
  { id: 'celiaco-2400', kcal: 2400, perfil: { ...BASE, ...H74, mealsPerDay: 4, intolerances: ['gluten'] } },
  { id: 'sin-lactosa-2000', kcal: 2000, perfil: { ...BASE, ...M62, mealsPerDay: 4, intolerances: ['lactosa'] } },
  { id: 'sin-pescado-2000', kcal: 2000, perfil: { ...BASE, ...M62, mealsPerDay: 4, intolerances: ['pescado', 'mariscos'] } },
  { id: 'sibo-2000', kcal: 2000, perfil: { ...BASE, ...M62, mealsPerDay: 4, intolerances: ['sibo'] } },
  { id: 'vegetariana-2000', kcal: 2000, perfil: { ...BASE, ...M62, mealsPerDay: 4, dieta: 'vegetariana' } },
  { id: 'vegana-1400', kcal: 1400, perfil: { ...BASE, ...M60, mealsPerDay: 4, dieta: 'vegana' } },
  { id: 'omni-2174-ancla', kcal: 2174, perfil: { ...BASE, ...H74, mealsPerDay: 4, cocinarEnCantidad: { activo: true, dia: 'Domingo' } } },
  { id: 'omni-2000-sin-atun', kcal: 2000, perfil: { ...BASE, ...M62, mealsPerDay: 4, eliminatedFoods: ['atún'] } },
]);

export const clonar = (o) => JSON.parse(JSON.stringify(o));
