import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import {
  FREEFORM_COMBOS,
  loadFreeFormCombos
} from "./data/FREEFORM_COMBOS";
import { FREEFORM_POOL } from "./data/freeformPool.js";
import {
  ACT_MULT, GOAL_ADJ, PROTEIN_FACTOR, FAT_FACTOR,
  simpleHash, _hashStr,
  computeTrend, getNutricionistaFeedback, adherenciaPct,
  calcTDEE, calcTarget, calcMacros,
  computeStrategy, getMealRules, computeCheckinAdjustment,
  getAgeFromDOB, getPastProteinFrequency,
  FOOD_DB, searchFoods, calcFoodKcal, getDefaultAlts,
  validateFreeFormPool,
  buildPlan,
} from "./engine/index.js";
import { SUPABASE_URL, SUPABASE_KEY, SDB, _sbToLocalPlan } from "./data/sdb.js";
import {
  __PERF,
  __TRACE,
  __NP_AUTHORED_IDS,
  _bcGet,
  _bcPost,
  _bc,
  getWeekNumber
} from "./data/runtime.js";
import {
  trackUserAction,
  traceSetPlan,
  _checkPostActionOverwrite,
  _planTs
} from "./data/echoGuard";
import {
  PDB, SyncEngine,
  loadData, saveData, clearData,
  loadMealMemory, saveMealMemory,
  loadProgress, saveProgress, addWeekProgress,
  _isObj, _validateProfile
} from "./data/db.js";
import { InvitationStore } from "./data/invitations.js";
import {
  THEME,
  STRATEGIES,
  COPY,
  ACTIVITIES,
  GOALS,
  INTOLERANCES,
  DAYS_SHORT,
  DAYS_ES,
  ACT_LABELS,
  GOAL_LABELS,
  GOAL_COLORS,
  NUTIPLAN_LOGO,
  SANS_EMOJI,
  SERIF_EMOJI,
  EMOJI_FONTS,
  AD_SLOTS,
} from "./ui/constants";
import { EyeIcon, EyeOffIcon } from "./ui/common/Icons";
import { ResetPasswordView } from "./ui/views/ResetPasswordView.jsx";
import { AdminPanel } from "./ui/views/AdminPanel.jsx";
import { AuthView } from "./ui/views/AuthView.jsx";
import { NutritionistDashboard } from "./ui/views/NutritionistDashboard.jsx";
import { OriginalPlanApp } from "./ui/views/OriginalPlanApp.jsx";
import { Stepper }   from "./ui/common/Stepper";
import { DOBPicker } from "./ui/common/DOBPicker";
import { NutiMessage } from "./ui/common/NutiMessage";
import { AdBanner } from "./ui/common/AdBanner";






if (typeof window !== "undefined") {
  window.__NP_simpleHash       = simpleHash;
}





function useFonts() {
  useEffect(() => {
    // FIX 8: guard prevents duplicate injection on React StrictMode / HMR
    const href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500;600&display=swap";
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement("link");
    l.href = href; l.rel = "stylesheet";
    document.head.appendChild(l);
  }, []);
}


// ─── NUTIPLAN LOGO ─────────────────────────────────────────────────────────
// Embedded PNG logo (160×160, base64). In production replace with a hosted URL.

// Emoji-safe font stacks — explicit emoji families ensure Unicode emoji glyphs
// are not shadowed by the loaded DM Sans web font on Windows / older Android.

// ═══════════════════════════════════════════════════════════════════════════
// COPY SYSTEM — tono cercano, sin juicio, práctico
// Uso: COPY.onboarding.welcome  |  COPY.plan.dayOff[0]
// Para añadir textos: añade solo aquí. Nunca en el JSX directamente.
// ═══════════════════════════════════════════════════════════════════════════

// ── NutiMessage — componente de guía conversacional ──────────────────────
/**
 * Mensaje corto de Nuti — el asistente de NutiPlan.
 * Solo UI. Sin lógica. Portable a cualquier parte del app.
 *
 * Props:
 *   message   {string}   Texto del mensaje (usa COPY.nuti.* para consistencia)
 *   variant   {"tip"|"success"|"info"|"nudge"}  Estilo visual (default: "tip")
 *   compact   {boolean}  Sin avatar, solo texto+icono (default: false)
 *   style     {object}   Override de estilo del contenedor
 */



/**
 * Selector de fecha de nacimiento — mobile-first.
 * Reemplaza el Stepper de Edad en el onboarding.
 * Compatible hacia atrás: sigue guardando profile.age calculado.
 *
 * Props:
 *   dob         {string}    "YYYY-MM-DD" (puede ser "" si no hay valor)
 *   onChange    {function}  (dob: string, age: number) => void
 *   accentColor {string}    color de acento (por defecto THEME.accent)
 *   textColor   {string}    color de texto
 *   mutedColor  {string}    color texto secundario
 *   borderColor {string}    color borde
 *   bgColor     {string}    color fondo input
 */

// ─── STRATEGY ENGINE ───────────────────────────────────────────────────────
// Maps profile → nutritional strategy → influences meal selection & tips




// ─── CONSTANTS ─────────────────────────────────────────────────────────────







// ─── STEPPER ───────────────────────────────────────────────────────────────














// ── useSyncStatus — tiny hook for the sync indicator dot ─────────────────
function useSyncStatus() {
  const [status, setStatus] = useState("synced"); // "synced" | "pending" | "offline"
  useEffect(() => {
    const check = () => {
      if (!navigator.onLine)         return setStatus("offline");
      if (SyncEngine.pendingCount() > 0) return setStatus("pending");
      setStatus("synced");
    };
    check();
    const id = setInterval(check, 2000);
    window.addEventListener("online",  check);
    window.addEventListener("offline", check);
    return () => {
      clearInterval(id);
      window.removeEventListener("online",  check);
      window.removeEventListener("offline", check);
    };
  }, []);
  return status;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
export default function PlatformNutricional() {
  __PERF.render("PlatformNutricional");  // PERF
  useFonts();
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activePlan, setActivePlan] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [recoveryToken, setRecoveryToken] = useState(null);
  const [loginBlockedMsg, setLoginBlockedMsg] = useState(null);
  const syncStatus = useSyncStatus(); // "synced" | "pending" | "offline"

  // FIX 1: ref siempre actualizado con el activePlan más reciente. Lo usa el handler
  // del WebSocket (cuyo closure se congela en el mount) para comparar created_at
  // correctamente sin necesidad de re-montar el effect cada vez que cambia activePlan.
  const activePlanRef = useRef(activePlan);
  useEffect(() => { activePlanRef.current = activePlan; }, [activePlan]);

  useEffect(() => {
    __PERF.count("effect:boot");  // PERF
    // ── BOOT SEQUENCE ────────────────────────────────────────────────────────
    // 1. migrate()          — repair stale/corrupt localStorage data
    // 2. restore Supabase   — silent token refresh (no flicker)
    // 3. set uid            — so SK/MK/PK resolve correctly
    // 4. seedDemo           — only when users array is empty (first ever load)
    // 5. pullFromCloud      — merge cloud plan (newer wins)
    // 6. setLoading(false)  — show app
    const boot = async () => {
      // Detect Supabase password-recovery link — must run before session restore.
      // PKCE Flow (?code=) takes priority; Implicit Flow (#access_token=) is the fallback.
      if (typeof window !== "undefined") {
        // ── PKCE Flow (new Supabase projects default) ─────────────────────────
        const _pkceCode = new URLSearchParams(window.location.search).get("code");
        if (_pkceCode) {
          const { data: _pkceData, error: _pkceErr } = await SDB._auth("/token?grant_type=pkce", { auth_code: _pkceCode });
          if (!_pkceErr && _pkceData?.access_token) {
            setRecoveryToken(_pkceData.access_token);
            window.history.replaceState(null, "", window.location.pathname);
            setLoading(false);
            return;
          }
          console.warn("[boot] PKCE exchange failed — falling through to implicit flow", _pkceErr);
        }
        // ── Implicit Flow (legacy Supabase projects) ──────────────────────────
        const hashStr = window.location.hash.replace(/^#/, "");
        const hp = {};
        hashStr.split("&").forEach(p => { const eq = p.indexOf("="); if (eq > -1) hp[p.slice(0, eq)] = decodeURIComponent(p.slice(eq + 1)); });
        if (hp.type === "recovery" && hp.access_token) {
          setRecoveryToken(hp.access_token);
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          setLoading(false);
          return;
        }
      }

      PDB.migrate();
      const session = PDB.getSession();
      const safeSession = _isObj(session) && session.id && session.email ? session : null;

      // Attempt silent Supabase token restore (doesn't show any UI)
      const sbRestored = await SDB.restoreSession();

      if (safeSession) {
        await SyncEngine.pullFromCloud(safeSession.id); // no-op si !SDB._token
        setUser(safeSession);
        setActivePlan(PDB.getActivePlan(safeSession.id));
      } else if (session) {
        // Corrupted session — clear it
        PDB.clearSession();
        SDB._clearTokens();
      }

      PDB.seedDemo();
      setLoading(false);
    };
    boot().catch(e => { console.error("[boot]", e); setLoading(false); });
  }, []);

  // Re-read activePlan whenever user changes or refreshKey bumps
  useEffect(() => {
    __PERF.count("effect:plan-refresh");  // PERF
    if (user) setActivePlan(PDB.getActivePlan(user.id));
  }, [user, refreshKey]);

  // ── SYNC: BroadcastChannel (instant, same-device cross-tab) ──────────────
  useEffect(() => {
    __PERF.count("effect:bc-sync");  // PERF
    if (!user || user.role !== "user" || !_bcGet()) return;
    const onMsg = (e) => {
      if (e.data?.type === "PLAN_UPDATED" && e.data?.uid === user.id) {
        const fresh = PDB.getActivePlan(user.id);
        __TRACE.event("activePlan", "broadcast:bc", activePlan, fresh, { fromTs: e.data?.ts });
        setActivePlan(fresh);
        setRefreshKey(k => k + 1);
      }
    };
    _bc.addEventListener("message", onMsg);
    return () => _bc.removeEventListener("message", onMsg);
  }, [user]);

  // ── SYNC: Supabase Realtime (instant, cross-device) ───────────────────────
  // Subscribes to INSERT/UPDATE on plans table filtered by uid.
  // When nutritionist saves a plan on any device, this fires in ~200ms.
  // Falls back gracefully if Supabase is unreachable.
  useEffect(() => {
    __PERF.count("effect:realtime-ws");  // PERF
    if (!user || user.role !== "user" || !SDB._token) return;
    let ws = null;
    let heartbeat = null;
    let closed = false;

    const connect = () => {
      try {
        // Supabase Realtime WebSocket endpoint
        const wsUrl = SUPABASE_URL.replace("https://", "wss://")
          .replace("/rest/v1", "") + "/realtime/v1/websocket"
          + "?apikey=" + SUPABASE_KEY + "&vsn=1.0.0";

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          // Join the plans channel filtered by this user's uid
          ws.send(JSON.stringify({
            topic: "realtime:public:plans:uid=eq." + user.id,
            event: "phx_join",
            payload: { access_token: SDB._token },
            ref: "1",
          }));
          // Heartbeat every 25s to keep the connection alive
          heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ topic:"phoenix", event:"heartbeat", payload:{}, ref:"hb" }));
            }
          }, 25000);
        };

        ws.onmessage = (e) => {
          const __t0 = __PERF.mark();  // PERF
          try {
            const msg = JSON.parse(e.data);
            // Realtime fires on INSERT (new plan) or UPDATE (plan edited)
            if (msg.event === "INSERT" || msg.event === "UPDATE") {
              const record = msg.payload?.record;
              if (record && record.uid === user.id && record.is_active) {
                // Convert Supabase row to local shape and merge
                const fresh = _sbToLocalPlan(record);
                __TRACE.log("realtime:incoming", { event: msg.event, planId: fresh?.id, created_at: fresh?.created_at });

                // BUG FIX (P0 race): ignore echo of our own writes.
                // Supabase Realtime delivers the event back to the originating
                // client. Without this guard, every saveToPDB → SDB.upsert →
                // realtime broadcast → setActivePlan → hydration effect →
                // setPlan cycle re-renders the entire PlanView, remounting all
                // MealCard children mid-interaction. That remount is the root
                // cause of "click on alternative does nothing".
                //
                // Strategy (two-layer):
                //   1) PRIMARY: ignore if this plan id is in our local
                //      "recently authored" set (__NP_AUTHORED_IDS). This is
                //      populated by every local PDB._savePlans for ~10s.
                //      Handles the first-plan case where currentTs=0.
                //   2) FALLBACK: created_at must be strictly newer than
                //      what we already show. Handles the case of stale
                //      authored-id sets.
                const freshTs   = fresh?.created_at || 0;
                // FIX 1: usar activePlanRef.current en lugar de activePlan del closure.
                // El effect depende solo de [user], así que activePlan quedaría congelado
                // al valor del momento del login. El ref se actualiza con cada setActivePlan.
                const currentTs = (activePlanRef.current?.created_at) || 0;
                const isOwnEcho = __NP_AUTHORED_IDS.has(fresh?.id);
                if (isOwnEcho) {
                  __TRACE.log("realtime:ignored-echo-by-id", { planId: fresh?.id });
                  __PERF.count("realtime:echo-skipped-id");
                  return;
                }
                if (freshTs <= currentTs) {
                  __TRACE.log("realtime:ignored-echo", { freshTs, currentTs });
                  __PERF.count("realtime:echo-skipped");
                  return; // don't write — it's our own change coming back
                }

                // Guard: stale por updated_at + bloqueo si overwrite tras acción usuario
                const _wsGuard = traceSetPlan("realtime", activePlanRef.current, fresh);
                if (!_wsGuard.accept || _checkPostActionOverwrite("realtime", activePlanRef.current, fresh)) {
                  __PERF.count("realtime:shouldAccept-rejected");
                  return;
                }

                // Update localStorage so offline mode stays current
                const plans = PDB.getPlans(user.id).map(p => ({...p, is_active: false}));
                const merged = [...plans.filter(p => p.id !== fresh.id), {...fresh, is_active: true}];
                try { localStorage.setItem("pf_plans_"+user.id, JSON.stringify(merged)); } catch(_) {}
                // Update React state
                __TRACE.event("activePlan", "realtime:ws", activePlan, fresh);
                setActivePlan(fresh);
                setRefreshKey(k => k + 1);
                // Broadcast to other tabs on this device
                _bcPost({ type:"PLAN_UPDATED", uid: user.id, ts: Date.now() });
                __PERF.count("realtime:plan-applied");  // PERF — útil para detectar storms
              }
            }
          } catch(_) {}
          __PERF.measure("realtime:onmessage", __t0);  // PERF
        };

        ws.onerror = () => {};
        ws.onclose = () => {
          clearInterval(heartbeat);
          heartbeat = null;
          // FIX (stability P0): re-check `closed` INSIDE the setTimeout callback,
          // not just before scheduling. If logout happens during the 5s wait,
          // the effect cleanup sets closed=true but the pending timeout would
          // still fire connect() and open a zombie WS that nobody closes.
          if (!closed) {
            setTimeout(() => {
              if (!closed) connect();
            }, 5000);
          }
        };
      } catch(e) {
        // WebSocket not available or blocked — silent fallback to polling
        console.warn("[Realtime] WebSocket unavailable, using poll fallback");
      }
    };

    connect();
    return () => {
      closed = true;
      clearInterval(heartbeat);
      if (ws) { try { ws.close(); } catch(_) {} }
    };
  }, [user]);

  // ── SYNC: storage event — catches cross-tab changes on browsers without BC ──
  useEffect(() => {
    __PERF.count("effect:storage-sync");  // PERF
    if (!user || user.role !== "user") return;
    const onStorage = (e) => {
      if (e.key === "pf_plans_" + user.id) {
        setActivePlan(PDB.getActivePlan(user.id));
        setRefreshKey(k => k + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user]);

  // ── SYNC: 30s cloud poll — cross-device sync (different phones/laptops) ────
  // BroadcastChannel handles same-device (<1ms). This catches a different
  // device: nutritionist edits on laptop → user's phone sees it within 30s.
  useEffect(() => {
    __PERF.count("effect:cloud-poll");  // PERF
    if (!user || user.role !== "user") return;
    const id = setInterval(async () => {
      // First check localStorage (free, catches same-device BC misses)
      const localFresh = PDB.getActivePlan(user.id);
      setActivePlan(prev => {
        const noChange =
          (prev?.id ?? null) === (localFresh?.id ?? null) &&
          (prev?.created_at ?? 0) === (localFresh?.created_at ?? 0) &&
          (prev?.created_by ?? '') === (localFresh?.created_by ?? '');
        if (!noChange) {
          __TRACE.event("activePlan", "poll:localStorage", prev, localFresh);
        }
        return noChange ? prev : localFresh;
      });
      // Then check Supabase for cross-device updates
      if (SDB._token) {
        const localTs = PDB.getActivePlan(user.id)?.created_at ?? 0;
        const cloudFresh = await SDB.pollPlanUpdate(user.id, localTs);
        if (cloudFresh) {
          // Cloud has a newer plan — merge it into localStorage
          await SyncEngine.pullFromCloud(user.id);
          const merged = PDB.getActivePlan(user.id);
          __TRACE.event("activePlan", "poll:cloud", activePlan, merged);
          // Guard: stale por updated_at + bloqueo si overwrite tras acción usuario
          const _pollGuard = traceSetPlan("poll:cloud", activePlanRef.current, merged);
          if (!_pollGuard.accept || _checkPostActionOverwrite("poll:cloud", activePlanRef.current, merged)) {
            __PERF.count("poll:shouldAccept-rejected");
            console.info("[POLL] stale ignored", {
              reason:   _pollGuard.reason,
              curId:    activePlanRef.current?.id,
              incId:    merged?.id,
              curTs:    _planTs(activePlanRef.current),
              incTs:    _planTs(merged),
            });
            return;
          }
          setActivePlan(merged);
          setRefreshKey(k => k + 1);
          _bcPost({ type:"PLAN_UPDATED", uid: user.id, ts: Date.now() });
        }
      }
    }, 30000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogin = async (u) => {
    // Fail-open: only block if is_active is explicitly false.
    // Network errors or missing profile → proceed normally.
    try {
      const profile = await SDB.getProfileById(u.id);
      if (profile?.is_active === false) {
        setLoginBlockedMsg("Tu cuenta ha sido desactivada. Contacta con soporte.");
        return;
      }
    } catch(e) { /* fail-open */ }
    setLoginBlockedMsg(null);
    PDB.setSession(u);
    setUser(u);
    setActivePlan(PDB.getActivePlan(u.id));
    // Drain any queued sync ops now that we have a token
    SyncEngine._drain();
  };

  const handleLogout = async () => {
    // Sign out from Supabase (revokes server-side session)
    await SDB.signOut().catch(() => {});
    PDB.clearSession();
    setUser(null);
    setActivePlan(null);
  };
  const handlePlanUpdated = () => setRefreshKey(k => k+1);

  // EMOJI FIX + LOGO: use emoji-safe font stack and show logo on loading screen
  const sans = SANS_EMOJI;
  if (loading) return (
    <div style={{background:THEME.bgPage,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:sans,color:THEME.textMuted,fontSize:14,gap:12}}>
      <img
        src={NUTIPLAN_LOGO}
        alt=""
        aria-hidden="true"
        loading="eager"
        style={{
          display:"block",
          width:"auto",
          height:80,
          maxHeight:80,
          objectFit:"contain",
          background:"transparent",
        }}
        onError={e => { e.currentTarget.style.display = "none"; }}
      />
      <span>Cargando tu plan...</span>
    </div>
  );
  if (!user && recoveryToken) return <ResetPasswordView token={recoveryToken} onDone={() => setRecoveryToken(null)} />;
  if (!user) return (
    <>
      {loginBlockedMsg && (
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,background:THEME.colorErrorDark,color:"#fff",fontFamily:SANS_EMOJI,fontSize:13,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
          <span>{loginBlockedMsg}</span>
          <button onClick={()=>setLoginBlockedMsg(null)} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:16,padding:0,flexShrink:0}}>✕</button>
        </div>
      )}
      <AuthView onLogin={handleLogin}/>
    </>
  );

  // Sync status dot — top-right corner, non-intrusive
  const syncDot = (
    <div title={
      syncStatus === "synced"  ? "Datos sincronizados con la nube ✓" :
      syncStatus === "pending" ? "Sincronizando con la nube…"        :
                                 "Sin conexión — guardado localmente"
    } style={{
      position:"fixed", top:10, right:10, zIndex:9999,
      width:9, height:9, borderRadius:"50%", cursor:"default",
      background: syncStatus === "synced"  ? THEME.colorSuccess :
                  syncStatus === "pending" ? THEME.colorWarningAlt : THEME.textMuted4,
      boxShadow: syncStatus === "pending"
        ? "0 0 0 3px #f59e0b44" : "none",
      transition:"background 0.4s, box-shadow 0.4s",
    }}/>
  );

  if (user.role === "nutritionist") return (
    <>{syncDot}<NutritionistDashboard currentUser={user} onLogout={handleLogout}/></>
  );
  return (
    <>{syncDot}<OriginalPlanApp currentUser={user} activePlanMeta={activePlan} onLogout={handleLogout} onPlanUpdated={handlePlanUpdated}/></>
  );
}