// ─── PROGRESS & FEEDBACK ────────────────────────────────────────────────────
// Extraído de App.jsx — NO modificar lógica, sólo se mueven las definiciones.

// Compute trend: kg lost/gained relative to first weigh-in
export function computeTrend(weeks) {
  if(!weeks || weeks.length < 2) return null;
  var withPeso = weeks.filter(function(w){return w.peso && w.pesoInicial;});
  if(withPeso.length < 1) return null;
  var last = withPeso[withPeso.length-1];
  var first = withPeso[0];
  var diff = (last.peso - first.pesoInicial);
  return {diff: Math.round(diff*10)/10, weeks: withPeso.length};
}

// Nutricionista feedback based on last check-in
export function getNutricionistaFeedback(progress, goal, checkinData) {
  var weeks = progress.weeks || [];
  if(weeks.length === 0) return null;
  var lastWeek = weeks[weeks.length-1];
  var adherencia = checkinData.adherencia || lastWeek.adherencia || 3;
  var hambre = checkinData.hambre || lastWeek.hambre || 3;
  var pesoTrend = checkinData.pesoTrend || "sinCambio";
  var isCutting = (goal==="fatLoss"||goal==="mildFatLoss"||goal==="fatLossGeneral");
  var isBulking = (goal==="mildGain"||goal==="muscleGain");

  // Perfect scenario
  if(adherencia >= 4 && hambre <= 3 && ((isCutting && pesoTrend==="baja")||(isBulking && pesoTrend==="sube")||(goal==="maintain"))) {
    return {type:"success", msg:"Todo va bien. No cambiamos nada esta semana — el plan está funcionando. Sigue así."};
  }
  if(adherencia >= 4 && pesoTrend==="sinCambio" && isCutting) {
    return {type:"info", msg:"Buena adherencia. El peso se está estabilizando — ajustamos −150 kcal para mantener el progreso sin notar el cambio."};
  }
  if(adherencia <= 2) {
    return {type:"warning", msg:"Esta semana ha sido complicada. Lo simplificamos: menos platos distintos, más repetición. La constancia al 70% bate a la perfección esporádica."};
  }
  if(hambre >= 4 && isCutting) {
    return {type:"info", msg:"El hambre es alta. Añadimos volumen con proteína y verdura. No bajamos calorías — solo cambiamos la composición para que te sacies más."};
  }
  if(pesoTrend==="sube" && isCutting) {
    return {type:"warning", msg:"El peso sube en déficit. Revisamos el plan — puede haber calorías ocultas. Ajustamos −250 kcal de forma suave, sin restricción agresiva."};
  }
  // Default positive
  return {type:"success", msg:"Plan activo y en marcha. Cada semana afinamos basándonos en tu respuesta real — eso es lo que te diferencia de seguir una dieta genérica."};
}

// Adherencia display (1-5 → %)
export function adherenciaPct(n) { return Math.round((n||3)/5*100); }
