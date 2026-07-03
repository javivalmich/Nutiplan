// Implementacion en memoria del MemoryStore — Fase 4, Componente P0-2.
// Implementa las 4 firmas de contract.js con la semantica ESTRICTA de su
// JSDoc, sin inventar comportamiento adicional:
//   - getWeek de semana no guardada -> null (la ausencia es valor del
//     dominio, no error — decision ratificada, ver DECISIONS.md).
//   - saveWeek sobre semana existente -> sobreescribe (ultimo gana).
//   - getRepertoire: el contrato (contract.js) no define un setter de
//     repertoire, asi que en el alcance de P0 no hay via para poblarlo;
//     null es el unico valor de "vacio" consistente con su tipo declarado
//     (Dish[] | null) y con la simetria de getWeek. No se inventa un
//     setter fuera de las 4 firmas contratadas.
//   - recordFeedback: "void", sin getter en el contrato — cualquier
//     almacenamiento interno es no observable desde fuera de este modulo;
//     se registra por (userId, dishId) para no perder la señal.
//
// Factory (createInMemoryStore), no singleton de modulo: los falsables de
// aislamiento (entre usuarios, entre semanas) y de instancia nueva exigen
// poder crear estado independiente por instancia.

function weekKey(userId, weekNumber) {
  return `${userId}::${weekNumber}`;
}

/**
 * @returns {{getWeek: Function, saveWeek: Function, getRepertoire: Function, recordFeedback: Function}}
 */
export function createInMemoryStore() {
  const weeks = new Map();
  const feedback = new Map();

  return {
    getWeek(userId, weekNumber) {
      const entry = weeks.get(weekKey(userId, weekNumber));
      return entry ? { plan: entry.plan, decisionLog: entry.decisionLog } : null;
    },

    saveWeek(userId, weekNumber, plan, decisionLog) {
      weeks.set(weekKey(userId, weekNumber), { plan, decisionLog });
    },

    getRepertoire(_userId) {
      return null;
    },

    recordFeedback(userId, dishId, signal) {
      if (!feedback.has(userId)) feedback.set(userId, new Map());
      const byDish = feedback.get(userId);
      if (!byDish.has(dishId)) byDish.set(dishId, []);
      byDish.get(dishId).push(signal);
    },
  };
}
