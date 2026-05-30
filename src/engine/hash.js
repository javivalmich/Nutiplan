// ─── HASH UTILITIES ─────────────────────────────────────────────────────────
// Extraído de App.jsx — NO modificar lógica, sólo se mueven las definiciones.

// Huella compacta del contenido de un plan. Detecta "mismo plan, escrito otra vez".
export function simpleHash(plan) {
  if (!plan) return "";
  try {
    const s = JSON.stringify({
      id:         plan.id,
      updated_at: plan.updated_at,
      created_at: plan.created_at,
      days:       plan.days,
    });
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return h.toString(36);
  } catch { return ""; }
}

// Hash determinista de string — usado por buildPlan para variantes de wording/AOVE
export const _hashStr = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) + h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
};
