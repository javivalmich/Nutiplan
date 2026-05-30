// ─── NUTRITION ENGINE ────────────────────────────────────────────────────────
// Extraído de App.jsx — NO modificar lógica, sólo se mueven las definiciones.

import { ACT_MULT, GOAL_ADJ, PROTEIN_FACTOR, FAT_FACTOR } from './constants.js';

export function calcTDEE(gender,age,weight,height,activity) {
  const bmr = gender==="male"
    ? 10*weight+6.25*height-5*age+5
    : 10*weight+6.25*height-5*age-161;
  return Math.round(bmr*(ACT_MULT[activity]||1.55));
}

export function calcTarget(tdee, goal, kcalAdjust) {
  var adj = kcalAdjust || 0;
  return Math.max(1200, tdee + (GOAL_ADJ[goal]||0) + adj);
}

export function calcMacros(kcal, weight, goal, activity, strategy) {
  var act  = activity || "moderate";
  var strat= strategy || "mantenimiento_equilibrado";
  var pf   = (PROTEIN_FACTOR[act]||PROTEIN_FACTOR.moderate)[goal] || 1.8;
  var ff   = FAT_FACTOR[strat] || FAT_FACTOR.mantenimiento_equilibrado;
  var protein = Math.round(weight * pf);
  // fat = max(minimum g/kg, pct of kcal)
  var fatFromPct  = Math.round((kcal * ff.pct) / 9);
  var fatFromMin  = Math.round(weight * ff.min);
  var fat  = Math.max(fatFromPct, fatFromMin);
  var carbs= Math.max(50, Math.round((kcal - protein*4 - fat*9) / 4));
  return {protein, fat, carbs, proteinFactor:pf, fatPct:Math.round(fat*9/kcal*100)};
}

export function computeStrategy(profile) {
  if (profile.strategyOverride) return profile.strategyOverride;
  var g = profile.goal;
  var h = profile.hambre || "media";
  if (g === "fatLossGeneral") return "fat_loss_general";
  if (g === "fatLoss" || g === "mildFatLoss") {
    return h === "alta" ? "definicion_saciante" : "definicion_flexible";
  }
  if (g === "maintain") return "mantenimiento_equilibrado";
  if (g === "mildGain") return "volumen_limpio";
  return "volumen_agresivo";
}

// ─── MEAL RULES ─────────────────────────────────────────────────────────────
// Real multipliers applied in buildPlan to protein/carb/fat/veggie portions
export function getMealRules(strategy) {
  switch(strategy) {
    case "fat_loss_general": return {
      // Medium portions, familiar foods, medium-high volume — feels satisfying but not overwhelming
      proteinMult: 1.00,
      carbMult:    1.00,  // full carb portions — density comes from food selection, not restriction
      fatMult:     1.00,  // keep fats for palatability and satiety
      veggieMult:  1.10,  // moderate veg boost without excess volume
      saciante:    false,
      denseCarbs:  false,
      tipPlate:"Platos conocidos y fáciles. No hace falta ser perfecto — el 80% constante gana al 100% esporádico."
    };
    case "definicion_saciante": return {
      proteinMult:1.15, carbMult:0.80, fatMult:0.90, veggieMult:1.40,
      saciante:true, denseCarbs:false,
      tipPlate:"Añade +100g de verdura a cada cena. Reduce el arroz o patata en un 20%."
    };
    case "definicion_flexible": return {
      proteinMult:1.10, carbMult:0.90, fatMult:0.95, veggieMult:1.15,
      saciante:false, denseCarbs:false,
      tipPlate:"Variedad y constancia. 1 comida libre semanal sin culpa."
    };
    case "mantenimiento_equilibrado": return {
      proteinMult:1.00, carbMult:1.00, fatMult:1.00, veggieMult:1.00,
      saciante:false, denseCarbs:true,
      tipPlate:"Equilibrio. Ajusta raciones según tu hambre del día."
    };
    case "volumen_limpio": return {
      proteinMult:1.10, carbMult:1.20, fatMult:1.05, veggieMult:0.90,
      saciante:false, denseCarbs:true,
      tipPlate:"Aumenta el arroz o pasta en 20g. La proteína post-entreno es crítica."
    };
    case "volumen_agresivo": return {
      proteinMult:1.15, carbMult:1.40, fatMult:1.15, veggieMult:0.80,
      saciante:false, denseCarbs:true,
      tipPlate:"Raciones grandes. Si no llegas a calorías, añade arroz extra o frutos secos."
    };
    default: return {proteinMult:1,carbMult:1,fatMult:1,veggieMult:1,saciante:false,denseCarbs:true,tipPlate:""};
  }
}

// ─── AGE FROM DATE OF BIRTH ──────────────────────────────────────────────────
// Firma final: (dob, today = new Date()) — "today" inyectable para tests.
export function getAgeFromDOB(dob, today = new Date()) {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

// ─── PAST PROTEIN FREQUENCY ──────────────────────────────────────────────────
// Firma final: (mealMemoryData) — el caller pasa loadMealMemory() como argumento.
// Elimina la dependencia directa en localStorage.
export function getPastProteinFrequency(mealMemoryData) {
  try {
    var mem = Array.isArray(mealMemoryData) ? mealMemoryData : [];
    var freq = {};
    mem.forEach(function(week, wi) {
      var weight = wi + 1;
      (week.L||[]).concat(week.D||[]).forEach(function(p) {
        freq[p] = (freq[p]||0) + weight;
      });
    });
    return freq;
  } catch { return {}; }
}

// Check-in → calorie delta + macro hint + strategy override + simpleMode
export function computeCheckinAdjustment(checkin, goal) {
  var delta = 0;
  var reasons = [];
  var strategyOverride = null;
  var simpleMode = false;
  var isCutting = (goal === "fatLoss" || goal === "mildFatLoss" || goal === "fatLossGeneral");
  var isBulking  = (goal === "mildGain" || goal === "muscleGain");

  if (isCutting && checkin.pesoTrend === "sinCambio") {
    delta -= 150;
    reasons.push("Peso estancado en déficit → −150 kcal");
  } else if (isCutting && checkin.pesoTrend === "sube") {
    delta -= 250;
    reasons.push("Peso sube en déficit → −250 kcal");
  } else if (isBulking && checkin.pesoTrend === "sinCambio") {
    delta += 150;
    reasons.push("Peso estancado en volumen → +150 kcal");
  }

  // Hambre alta en déficit → más volumen + cambio de estrategia
  if (checkin.hambre >= 4 && isCutting) {
    delta += 50;
    if(goal === "fatLossGeneral") {
      reasons.push("Hambre alta → +50 kcal · Añade un snack proteico a media tarde (yogur, huevo, fruta)");
    } else {
      strategyOverride = "definicion_saciante";
      reasons.push("Hambre alta → +50 kcal + Definición saciante (platos más voluminosos)");
    }
  }

  // Adherencia baja → simplificar plan + estrategia flexible
  if (checkin.adherencia <= 1) {
    simpleMode = true;
    strategyOverride = strategyOverride || "definicion_flexible";
    reasons.push("Adherencia muy baja → plan simplificado con comidas fáciles y familiares");
  } else if (checkin.adherencia <= 2 && isCutting) {
    simpleMode = true;
    strategyOverride = strategyOverride || "definicion_flexible";
    reasons.push("Adherencia baja → plan simplificado + Definición flexible");
  }

  // Energía muy baja → más hidratos
  if (checkin.energia <= 2) {
    delta += 80;
    reasons.push("Energía muy baja → +80 kcal en hidratos");
  }

  // Buena adherencia + volumen sin progreso
  if (checkin.adherencia >= 4 && isBulking && checkin.pesoTrend === "sinCambio") {
    delta += 100;
    reasons.push("Buena adherencia sin progreso → +100 kcal adicionales");
  }

  return {delta:delta, reasons:reasons, strategyOverride:strategyOverride, simpleMode:simpleMode};
}
