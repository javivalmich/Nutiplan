// ─── CONSTANTS ─────────────────────────────────────────────────────────────
// Extraído de App.jsx — NO modificar lógica, sólo se mueven las definiciones.

export const ACT_MULT  = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, veryActive:1.9 };
export const GOAL_ADJ  = { fatLoss:-500, mildFatLoss:-250, fatLossGeneral:-350, maintain:0, mildGain:250, muscleGain:400 };

// Protein g/kg by activity × goal: sedentary base, force/bulk bonus
export const PROTEIN_FACTOR = {
  sedentary:  {fatLoss:1.6, mildFatLoss:1.6, fatLossGeneral:1.5, maintain:1.6, mildGain:1.8, muscleGain:2.0},
  light:      {fatLoss:1.8, mildFatLoss:1.7, fatLossGeneral:1.6, maintain:1.7, mildGain:1.9, muscleGain:2.1},
  moderate:   {fatLoss:2.0, mildFatLoss:1.8, fatLossGeneral:1.7, maintain:1.8, mildGain:2.1, muscleGain:2.2},
  active:     {fatLoss:2.1, mildFatLoss:2.0, fatLossGeneral:1.8, maintain:1.9, mildGain:2.2, muscleGain:2.4},
  veryActive: {fatLoss:2.2, mildFatLoss:2.1, fatLossGeneral:1.9, maintain:2.0, mildGain:2.3, muscleGain:2.5},
};

// Fat: minimum 0.8g/kg, strategy-tuned ceiling
export const FAT_FACTOR = {
  definicion_saciante:      {min:0.8, pct:0.22},
  definicion_flexible:      {min:0.8, pct:0.25},
  fat_loss_general:         {min:0.8, pct:0.28},
  mantenimiento_equilibrado:{min:0.9, pct:0.28},
  volumen_limpio:           {min:1.0, pct:0.28},
  volumen_agresivo:         {min:1.1, pct:0.32},
};
