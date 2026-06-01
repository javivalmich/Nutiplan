import { simpleHash } from "../engine/index.js";
import { __TRACE } from "./runtime.js";

// ═══════════════════════════════════════════════════════════════════════════
// PLAN WRITE GUARD — Steps 1-4
// Capa mínima de observabilidad + protección contra sobrescrituras stale.
// Sin librerías externas. Solo console.log/warn.
//
// Activar trace completo: __NP_TRACE.enable()
// Ver quién escribió qué: __NP_TRACE.dump()
// ═══════════════════════════════════════════════════════════════════════════


// Ventana de protección post-acción de usuario. 800ms cubre redes lentas (3G/WiFi
// congestionado) donde el echo del WebSocket puede llegar hasta ~600ms tarde.
const _POST_ACTION_WINDOW_MS = 800;

// ── Seguimiento de acciones de usuario ───────────────────────────────────
let _lastUserActionTs   = 0;
let _lastUserActionName = "";

// Extrae el timestamp de frescura de un plan con precedencia explícita:
//   updated_at (campo del backend, más fiable) → created_at → 0.
// Usa ?? en lugar de || para no descartar el valor 0 como falsy.
function _planTs(p) {
  if (!p) return 0;
  if (p.updated_at != null) return p.updated_at;
  if (p.created_at != null) return p.created_at;
  return 0;
}

// Decide si un plan entrante debe aceptarse dado el plan actual.
//
// source === "user"  → bypass con validación mínima de forma (id requerido).
// Fuentes externas   → prioridad: updated_at > hash > rechazo por stale.
function shouldAcceptPlan(current, incoming, source) {
  if (source === "user") {
    if (!incoming || !incoming.id) {
      console.warn("[PLAN-WRITE] rejected", { source, reason: "invalid-user-plan", incoming });
      return { accept: false, reason: "invalid-user-plan" };
    }
    return { accept: true, reason: "user-action" };
  }

  if (!current) return { accept: true, reason: "no-current" };
  if (!incoming) {
    console.warn("[PLAN-WRITE] rejected", { source, reason: "incoming-null" });
    return { accept: false, reason: "incoming-null" };
  }

  const curTs       = _planTs(current);
  const incTs       = _planTs(incoming);
  const hasValidTs  = incoming.updated_at != null || incoming.created_at != null;

  // Regla 1: timestamp posterior → siempre aceptar, independientemente del hash.
  // Un updated_at mayor significa que el backend procesó un cambio más reciente.
  if (incTs > curTs) return { accept: true, reason: `newer-ts(Δ=${incTs - curTs}ms)` };

  // Regla 2: sin timestamp fiable → usar hash como único criterio de novedad.
  if (!hasValidTs) {
    if (simpleHash(current) === simpleHash(incoming)) {
      __TRACE.log("plan-write:skipped", { source, reason: "same-hash-no-ts" });
      return { accept: false, reason: "same-hash-no-ts" };
    }
    return { accept: true, reason: "hash-differs-no-ts" };
  }

  // Regla 3: timestamp más antiguo → stale, rechazar.
  if (incTs < curTs) {
    console.warn("[PLAN-WRITE] rejected", { source, reason: `stale(inc=${incTs}<cur=${curTs})` });
    return { accept: false, reason: `stale(inc=${incTs}<cur=${curTs})` };
  }

  // Regla 4: timestamps iguales → hash decide.
  // (incTs === curTs — puede ser un plan editado sin bump de updated_at)
  if (simpleHash(current) === simpleHash(incoming)) {
    __TRACE.log("plan-write:skipped", { source, reason: "same-hash" });
    return { accept: false, reason: "same-hash" };
  }

  return { accept: true, reason: "ok" };
}

// Loguea + evalúa la escritura. Devuelve el resultado de shouldAcceptPlan.
function traceSetPlan(source, current, incoming) {
  const result = shouldAcceptPlan(current, incoming, source);
  const curTs  = _planTs(current);
  const incTs  = _planTs(incoming);

  __TRACE.log(`plan-write:${result.accept ? "accepted" : "rejected"}`, {
    source, reason: result.reason,
    curId: current?.id, incId: incoming?.id, curTs, incTs,
    icon: result.accept ? "✓" : "✗",
  });
  return result;
}

function trackUserAction(actionName) {
  _lastUserActionTs   = Date.now();
  _lastUserActionName = actionName;
  __TRACE.log("user-action", { action: actionName, ts: _lastUserActionTs });
  console.log(`[USER-ACTION] ${actionName} @ ${_lastUserActionTs}`);
}

// Devuelve true (bloquear) solo si TODAS estas condiciones se cumplen:
//   1. Fuente externa (no "user") escribe dentro de _POST_ACTION_WINDOW_MS
//   2. El incoming NO tiene updated_at posterior al current   ← dato genuinamente nuevo
//   3. El incoming NO tiene hash distinto al current          ← contenido genuinamente nuevo
//
// Si alguna de 2 ó 3 se cumple, el backend trajo datos reales → dejar pasar.
function _checkPostActionOverwrite(source, current, incoming) {
  if (_lastUserActionTs === 0) return false;
  if (source === "user")       return false;

  const delta = Date.now() - _lastUserActionTs;
  if (delta >= _POST_ACTION_WINDOW_MS) return false;

  const curTs = _planTs(current);
  const incTs = _planTs(incoming);

  // updated_at posterior → respuesta legítima del backend, dejar pasar
  if (incTs > curTs) return false;

  // Hash distinto → contenido genuinamente nuevo, dejar pasar
  if (incoming && simpleHash(current) !== simpleHash(incoming)) return false;

  // Sin mejora real: bloquear
  console.warn(
    `[PLAN-WRITE] ⚠ POST-ACTION OVERWRITE BLOQUEADO: ` +
    `"${source}" ${delta}ms después de "${_lastUserActionName}" — sin datos nuevos`,
    { action: _lastUserActionName, writer: source, deltaMs: delta, curTs, incTs }
  );
  return true;
}

if (typeof window !== "undefined") {
  window.__NP_shouldAcceptPlan = shouldAcceptPlan;
}

export {
  trackUserAction,
  traceSetPlan,
  _checkPostActionOverwrite,
  _planTs
};
