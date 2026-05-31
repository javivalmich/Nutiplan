// ═══════════════════════════════════════════════════════════════════════════
// PERF INSTRUMENTATION — opt-in observability
// ─────────────────────────────────────────────────────────────────────────────
// Activar desde la consola:   __NP_PERF.enable()
// Ver resultados:              __NP_PERF.report()
// Resetear:                    __NP_PERF.reset()
// Desactivar:                  __NP_PERF.disable()
//
// Cuando está OFF (default en producción) el overhead es:
//   • 1 lectura de localStorage cacheada por tick → casi cero
//   • ningún performance.now() llamado
//   • ningún Map.set
//
// No introduce dependencias nuevas. Reversible borrando este bloque + los
// call sites marcados con "// PERF".
// ═══════════════════════════════════════════════════════════════════════════
const __PERF = (() => {
  // Cache del flag durante 1s para no leer localStorage en cada call
  let _enabledCache = null;
  let _enabledCacheAt = 0;
  const enabled = () => {
    const now = Date.now();
    if (_enabledCache !== null && (now - _enabledCacheAt) < 1000) return _enabledCache;
    try { _enabledCache = (localStorage.getItem("np_perf") === "1"); }
    catch (e) { _enabledCache = false; }
    _enabledCacheAt = now;
    return _enabledCache;
  };
  const _t = new Map();   // label -> {count,total,min,max,last}
  const _r = new Map();   // component name -> count
  const record = (label, ms) => {
    let s = _t.get(label);
    if (!s) { s = { count: 0, total: 0, min: Infinity, max: 0, last: 0 }; _t.set(label, s); }
    s.count++; s.total += ms;
    if (ms < s.min) s.min = ms;
    if (ms > s.max) s.max = ms;
    s.last = ms;
  };
  return {
    enabled,
    // Wrap síncrono. NO-op si está desactivado.
    time(label, fn) {
      if (!enabled()) return fn();
      const t0 = performance.now();
      try { return fn(); }
      finally { record(label, performance.now() - t0); }
    },
    // Wrap async.
    async timeAsync(label, fn) {
      if (!enabled()) return await fn();
      const t0 = performance.now();
      try { return await fn(); }
      finally { record(label, performance.now() - t0); }
    },
    // Marca manual: devuelve un token, llamar measure(token) al cerrar.
    mark() { return enabled() ? performance.now() : null; },
    measure(label, t0) {
      if (!enabled() || t0 == null) return;
      record(label, performance.now() - t0);
    },
    // Contador puro (sin tiempo): para counts de eventos/renders.
    count(label) {
      if (!enabled()) return;
      let s = _t.get(label);
      if (!s) { s = { count: 0, total: 0, min: 0, max: 0, last: 0 }; _t.set(label, s); }
      s.count++; s.last = s.count;
    },
    // Contador de renders, separado para reportar aparte.
    render(name) {
      if (!enabled()) return;
      _r.set(name, (_r.get(name) || 0) + 1);
    },
    report() {
      const timing = [];
      _t.forEach((s, label) => {
        timing.push({
          label,
          count: s.count,
          total_ms: +s.total.toFixed(1),
          avg_ms: +(s.total / s.count).toFixed(2),
          min_ms: +s.min.toFixed(2),
          max_ms: +s.max.toFixed(2),
          last_ms: +s.last.toFixed(2),
        });
      });
      timing.sort((a, b) => b.total_ms - a.total_ms);
      console.log("%c[NutiPlan PERF] Timings (ordenado por total_ms desc):",
        "font-weight:bold;color:#e8a045;font-size:12px");
      console.table(timing);
      const renders = [];
      _r.forEach((c, name) => renders.push({ component: name, renders: c }));
      renders.sort((a, b) => b.renders - a.renders);
      console.log("%c[NutiPlan PERF] Renders por componente:",
        "font-weight:bold;color:#e8a045;font-size:12px");
      console.table(renders);
    },
    reset() { _t.clear(); _r.clear(); console.info("[NutiPlan PERF] Reset."); },
    enable() {
      try { localStorage.setItem("np_perf", "1"); } catch (e) {}
      _enabledCache = true; _enabledCacheAt = Date.now();
      console.info("[NutiPlan PERF] ON. Usa __NP_PERF.report() tras una sesión normal.");
    },
    disable() {
      try { localStorage.removeItem("np_perf"); } catch (e) {}
      _enabledCache = false; _enabledCacheAt = Date.now();
      console.info("[NutiPlan PERF] OFF.");
    },
  };
})();
if (typeof window !== "undefined") { window.__NP_PERF = __PERF; }


// ═══════════════════════════════════════════════════════════════════════════
// OWNERSHIP TRACING — debugging multi-writer state races
// ─────────────────────────────────────────────────────────────────────────────
// El bug "Generar plan" intermitente sospecha races entre handleGenerate,
// hydration effect, realtime ws, polling, BroadcastChannel, regenerateMeal.
// Este módulo registra QUIÉN escribe estado crítico y CUÁNDO.
//
// Activar: window.__NP_TRACE.enable()      // o localStorage np_trace=1
// Ver:     __NP_TRACE.dump()               // tabla cronológica
// Resetear:__NP_TRACE.reset()
//
// Cuando OFF: zero overhead.
// ═══════════════════════════════════════════════════════════════════════════
const __TRACE = (() => {
  const MAX_EVENTS = 500;
  let _enabledCache = null;
  let _enabledCacheAt = 0;
  const enabled = () => {
    const now = Date.now();
    if (_enabledCache !== null && (now - _enabledCacheAt) < 1000) return _enabledCache;
    try { _enabledCache = (localStorage.getItem("np_trace") === "1"); }
    catch (e) { _enabledCache = false; }
    _enabledCacheAt = now;
    return _enabledCache;
  };
  const events = [];
  const _lastWriteAt = new Map(); // target -> {ts, source}
  // Resumen compacto de un plan para tracing (sin sobrecargar la consola)
  const planSummary = (p) => {
    if (!p) return null;
    return {
      id:        p.id ?? null,
      created_at:p.created_at ?? null,
      strategy:  p.strategy ?? null,
      weekNum:   p.weekNum ?? null,
      days:      Array.isArray(p.days) ? p.days.length : null,
      created_by:p.created_by ?? null,
    };
  };
  const profileSummary = (pr) => {
    if (!pr) return null;
    return {
      weight:pr.weight, height:pr.height, age:pr.age, goal:pr.goal,
      intolerances: Array.isArray(pr.intolerances) ? pr.intolerances.length : "??",
      trainingDays: Array.isArray(pr.trainingDays) ? pr.trainingDays.length : "??",
    };
  };
  const record = (target, source, prev, next, extra) => {
    if (!enabled()) return;
    const ts = Date.now();
    // Detectar writes concurrentes (<500ms del último write al mismo target)
    const last = _lastWriteAt.get(target);
    let concurrent = false;
    if (last && (ts - last.ts) < 500 && last.source !== source) {
      concurrent = true;
      console.warn(
        `[TRACE] CONCURRENT WRITE on ${target}: ${last.source} → ${source} (${ts - last.ts}ms gap)`
      );
    }
    _lastWriteAt.set(target, { ts, source });
    const ev = {
      ts,
      target,
      source,
      prev: target === "plan" || target.includes("Plan") ? planSummary(prev) :
            target === "profile" ? profileSummary(prev) :
            (typeof prev === "object" ? "[obj]" : prev),
      next: target === "plan" || target.includes("Plan") ? planSummary(next) :
            target === "profile" ? profileSummary(next) :
            (typeof next === "object" ? "[obj]" : next),
      concurrent,
      extra: extra || null,
    };
    events.push(ev);
    if (events.length > MAX_EVENTS) events.shift();
    // Log inmediato para flujo en vivo
    if (concurrent) {
      console.warn(`[TRACE+${ts}] ${target} ← ${source} (⚠ CONCURRENT)`, ev);
    } else {
      console.log(`[TRACE+${ts}] ${target} ← ${source}`, ev);
    }
  };
  return {
    enabled,
    // Wrap a setState — devuelve un setter que traza antes de invocar el original
    wrap(setState, target, source) {
      return (value) => {
        // Lee el valor previo del state no es trivial (setState no expone prev),
        // así que usamos updater functional para capturarlo
        if (typeof value === "function") {
          setState(prev => {
            const next = value(prev);
            record(target, source, prev, next);
            return next;
          });
        } else {
          // No tenemos prev — registramos null como prev
          record(target, source, "(unknown)", value);
          setState(value);
        }
      };
    },
    // Llamada manual cuando no podemos wrappear el setter
    event(target, source, prev, next, extra) { record(target, source, prev, next, extra); },
    // Trace puro (un mensaje sin estado)
    log(label, data) {
      if (!enabled()) return;
      const ts = Date.now();
      console.log(`[TRACE+${ts}] ${label}`, data);
      events.push({ ts, target:"_log", source:label, prev:null, next:data, concurrent:false });
      if (events.length > MAX_EVENTS) events.shift();
    },
    dump() {
      console.log("%c[OWNERSHIP TRACE] cronológico:",
        "font-weight:bold;color:#e8a045;font-size:12px");
      console.table(events.map(e => ({
        ts: e.ts,
        Δms: e._dt,
        target: e.target,
        source: e.source,
        concurrent: e.concurrent ? "⚠" : "",
        prev: typeof e.prev === "object" ? JSON.stringify(e.prev) : String(e.prev),
        next: typeof e.next === "object" ? JSON.stringify(e.next) : String(e.next),
      })));
      // También una tabla solo de plan writers, ordenada
      const planWrites = events.filter(e => e.target === "plan" || e.target === "activePlan");
      if (planWrites.length) {
        console.log("%c[OWNERSHIP TRACE] writers de plan/activePlan:",
          "font-weight:bold;color:#e8a045;font-size:12px");
        const bySource = {};
        planWrites.forEach(e => { bySource[e.source] = (bySource[e.source] || 0) + 1; });
        console.table(Object.entries(bySource).map(([source, count]) => ({ source, count })));
      }
    },
    reset() { events.length = 0; _lastWriteAt.clear(); console.info("[TRACE] reset"); },
    enable() {
      try { localStorage.setItem("np_trace", "1"); } catch(e) {}
      _enabledCache = true; _enabledCacheAt = Date.now();
      console.info("[TRACE] ON. Usa __NP_TRACE.dump() para ver el orden cronológico.");
    },
    disable() {
      try { localStorage.removeItem("np_trace"); } catch(e) {}
      _enabledCache = false; _enabledCacheAt = Date.now();
      console.info("[TRACE] OFF.");
    },
  };
})();
if (typeof window !== "undefined") { window.__NP_TRACE = __TRACE; }

// Tracks plan ids authored by THIS device in the last ~10s.
// Used by the realtime ws.onmessage echo guard to drop the bounce of our own
// upserts. Populated by PDB._savePlans, drained automatically via setTimeout.
const __NP_AUTHORED_IDS = new Set();
if (typeof window !== "undefined") { window.__NP_AUTHORED_IDS = __NP_AUTHORED_IDS; }


// ── BROADCAST CHANNEL ─────────────────────────────────────────────────────
// Used for instant cross-tab sync (nutritionist saves → user tab updates now).
// Graceful no-op fallback: _bc is null on unsupported browsers (Safari <15.4).
//
// FIX (stability P1): lazy initialization. The original code created the
// BroadcastChannel at module import time, which leaked channels under HMR
// (each hot reload created a new one without closing the previous) and made
// unit testing harder. Now created only on first use, with the same null-safe
// fallback semantics preserved by _bcGet() and _bcPost().
let _bcInstance = null;
function _bcGet() {
  if (_bcInstance !== null) return _bcInstance;
  if (typeof BroadcastChannel === "undefined") {
    _bcInstance = false; // sentinel for "tried and unavailable"
    return null;
  }
  try {
    _bcInstance = new BroadcastChannel("nutiplan_sync_v1");
    return _bcInstance;
  } catch (e) {
    _bcInstance = false;
    return null;
  }
}
// Back-compat shim: code that referenced `_bc` directly still works.
// Defining `_bc` as a getter would change runtime semantics, so we keep
// the original const-name alive via a Proxy-free pattern: read through _bcGet().
const _bc = { // eslint-disable-line no-unused-vars
  // Methods used elsewhere; delegated to the lazily-resolved instance.
  addEventListener: function(...args) {
    const ch = _bcGet();
    if (ch && typeof ch.addEventListener === "function") return ch.addEventListener(...args);
  },
  removeEventListener: function(...args) {
    const ch = _bcGet();
    if (ch && typeof ch.removeEventListener === "function") return ch.removeEventListener(...args);
  },
  postMessage: function(...args) {
    const ch = _bcGet();
    if (ch && typeof ch.postMessage === "function") return ch.postMessage(...args);
  },
};
// Convenience: post a typed message (swallows if unavailable)
function _bcPost(msg) { try { const ch = _bcGet(); ch && ch.postMessage(msg); } catch(e) {} }
function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

export {
  __PERF,
  __TRACE,
  __NP_AUTHORED_IDS,
  _bcGet,
  _bcPost,
  _bc,
  getWeekNumber
};
