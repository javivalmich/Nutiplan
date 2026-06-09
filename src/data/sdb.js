// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE CONFIG
// ═══════════════════════════════════════════════════════════════════════════
// This implementation uses the Supabase REST API directly via fetch —
// zero external dependencies, fully self-contained.

export const SUPABASE_URL   = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_KEY   = import.meta.env.VITE_SUPABASE_ANON_KEY;

import { syncRealtimeAuth } from "./supabaseClient.js";

// ─── SDB — Async Supabase layer ────────────────────────────────────────────
// This is the ONLY place that talks to Supabase.
// Components NEVER call SDB directly — they call PDB (synchronous, localStorage).
// SyncEngine bridges the two layers.
export const SDB = {
  _token: null,      // Supabase JWT access token (set on sign-in)
  _refresh: null,    // Refresh token (persisted across page loads)
  _uid: null,        // Supabase user UUID

  // ── HTTP helpers ──────────────────────────────────────────────────────────
  _h: (extra) => ({
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + (SDB._token || SUPABASE_KEY),
    "Content-Type": "application/json",
    ...extra,
  }),

  // Timeout helper: rejects after ms milliseconds
  _timeout: (ms) => new Promise((_, rej) =>
    setTimeout(() => rej(new Error("SDB timeout after " + ms + "ms")), ms)
  ),

  _rest: async (path, opts = {}, _retried = false) => {
    try {
      const r = await Promise.race([
        fetch(SUPABASE_URL + "/rest/v1" + path, {
          ...opts, headers: SDB._h(opts.headers || {}),
        }),
        SDB._timeout(12000), // 12s hard timeout
      ]);
      const txt = await r.text();
      const body = txt ? JSON.parse(txt) : null;

      // 401 → try silent token refresh once, then retry
      if (r.status === 401 && !_retried) {
        console.warn("[SDB] 401 received — attempting token refresh");
        const refreshed = await SDB.restoreSession();
        if (refreshed) return SDB._rest(path, opts, true); // retry with new token
        console.warn("[SDB] Token refresh failed — user must re-login");
        return { data: null, error: "session_expired" };
      }

      if (!r.ok) {
        console.warn("[SDB]", r.status, path, body);
        return { data: null, error: body };
      }
      return { data: body, error: null };
    } catch(e) {
      const isTimeout = e.message?.includes("timeout");
      const isOffline = !navigator.onLine || e.message?.includes("fetch") || e.message?.includes("network");
      if (isTimeout || isOffline) {
        console.info("[SDB] Offline/timeout for", path, "— will sync when online");
      } else {
        console.warn("[SDB] Unexpected error", path, e.message);
      }
      return { data: null, error: e.message };
    }
  },

  _auth: async (path, payload) => {
    try {
      const r = await fetch(SUPABASE_URL + "/auth/v1" + path, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) return { data: null, error: body?.msg || body?.error_description || "auth error" };
      return { data: body, error: null };
    } catch(e) { return { data: null, error: e.message }; }
  },

  // ── Session persistence ───────────────────────────────────────────────────
  _saveTokens: (access, refresh, uid) => {
    SDB._token = access; SDB._refresh = refresh; SDB._uid = uid;
    syncRealtimeAuth(access);
    // Store refresh token in its own key (never mixed with user data)
    try { localStorage.setItem("pf_sb_rt", JSON.stringify({ r: refresh, u: uid })); } catch(e) {}
  },
  _clearTokens: () => {
    SDB._token = null; SDB._refresh = null; SDB._uid = null;
    syncRealtimeAuth(null);
    try { localStorage.removeItem("pf_sb_rt"); } catch(e) {}
  },

  // Attempt silent re-auth using stored refresh token. Returns true if ok.
  restoreSession: async () => {
    try {
      const raw = localStorage.getItem("pf_sb_rt");
      if (!raw) return false;
      const { r: rt, u: uid } = JSON.parse(raw);
      if (!rt) return false;
      const { data, error } = await SDB._auth("/token?grant_type=refresh_token", { refresh_token: rt });
      if (error || !data?.access_token) {
        // Solo borrar tokens cuando Supabase
        // rechaza explícitamente el refresh token.
        // Errores transitorios/red/offline NO deben
        // destruir la sesión persistida.
        const isAuthError =
          (typeof error === "string" &&
            error.includes("invalid_grant")) ||
          (typeof error === "object" &&
            (
              error?.error === "invalid_grant" ||
              error?.message?.includes?.("invalid_grant")
            )) ||
          (data?.error === "invalid_grant");

        if (isAuthError) {
          SDB._clearTokens();
        }

        return false;
      }
      SDB._saveTokens(data.access_token, data.refresh_token, data.user?.id || uid);
      return true;
    } catch(e) { return false; }
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  signUp: async (email, pass, role) => {
    const { data, error } = await SDB._auth("/signup", {
      email, password: pass, data: { role },
    });
    if (error || !data?.user) return { error };
    SDB._saveTokens(data.access_token, data.refresh_token, data.user.id);
    // Create profile row (upsert — safe to retry)
    await SDB._rest("/profiles", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: data.user.id, email: email.toLowerCase(), role }),
    });
    return { user: { id: data.user.id, email: email.toLowerCase(), role, supabase: true } };
  },

  signIn: async (email, pass) => {
    const { data, error } = await SDB._auth("/token?grant_type=password", { email, password: pass });
    if (error || !data?.access_token) return { error: error || "Credenciales incorrectas" };
    SDB._saveTokens(data.access_token, data.refresh_token, data.user?.id);
    // Fetch profile to get role
    const { data: profiles } = await SDB._rest(
      `/profiles?id=eq.${data.user.id}&select=id,email,role`
    );
    const profile = profiles?.[0];
    if (!profile) {
      // Profile row missing (user created outside app) — create it
      const role = data.user.user_metadata?.role || "user";
      await SDB._rest("/profiles", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ id: data.user.id, email: email.toLowerCase(), role }),
      });
      return { user: { id: data.user.id, email: email.toLowerCase(), role, supabase: true } };
    }
    return { user: { id: profile.id, email: profile.email, role: profile.role, supabase: true } };
  },

  signOut: async () => {
    if (SDB._token) {
      await fetch(SUPABASE_URL + "/auth/v1/logout", {
        method: "POST", headers: SDB._h(),
      }).catch(() => {});
    }
    SDB._clearTokens();
  },

  // ── Password reset ────────────────────────────────────────────────────────
  // Envía el email de recuperación. Supabase devuelve 200 aunque el email
  // no exista (seguridad anti-enumeración).
  resetPassword: async (email) => {
    const _email = email.trim().toLowerCase();
    console.log("[resetPassword] start", { email: _email });
    try {
      const r = await fetch(SUPABASE_URL + "/auth/v1/recover", {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: _email, redirect_to: window.location.origin + window.location.pathname }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const err  = body?.msg || body?.error_description || "Error enviando email.";
        console.warn("[resetPassword] error HTTP", { status: r.status, error: err });
        return { ok: false, error: err };
      }
      console.log("[resetPassword] success — email enviado a", _email);
      return { ok: true };
    } catch(e) {
      console.warn("[resetPassword] exception", e?.message);
      return { ok: false, error: "Sin conexión. Inténtalo de nuevo." };
    }
  },

  // Actualiza la contraseña del usuario autenticado (requiere token activo).
  updatePassword: async (newPassword) => {
    if (!SDB._token) return { ok: false, error: "Sesión no válida. Abre el link del email." };
    try {
      const r = await fetch(SUPABASE_URL + "/auth/v1/user", {
        method: "PUT",
        headers: SDB._h(),
        body: JSON.stringify({ password: newPassword }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, error: body?.msg || "Error actualizando contraseña." };
      return { ok: true };
    } catch(e) {
      return { ok: false, error: "Error de conexión." };
    }
  },

  // ── Plans ─────────────────────────────────────────────────────────────────
  getActivePlan: async (uid) => {
    // BUG FIX: order by created_at DESC so if the cloud transiently has more
    // than one active row (e.g. two devices upserted concurrently, or the
    // PATCH after POST in upsertPlan failed), we still return the freshest.
    // This makes the system self-heal: next sync from either device picks the
    // newest plan and the older active flag eventually gets reset by upsertPlan.
    const { data } = await SDB._rest(
      `/plans?uid=eq.${uid}&is_active=eq.true&order=created_at.desc&limit=1&select=*`
    );
    return data?.[0] ? _sbToLocalPlan(data[0]) : null;
  },

  // Lee un plan por ID.
  // Usado principalmente para planes propios (RLS: auth.uid() = uid).
  // Para planes de invitación, validate() ya devuelve el plan inline;
  // este método es fallback del modo offline.
  getPlanById: async (planId) => {
    if (!SDB._token || !planId) return null;
    try {
      console.info("[PLAN_FETCH] getPlanById start — planId:", planId);
      // Lectura directa: funciona para planes propios (RLS lo permite).
      // Para planes ajenos, solo funciona si se llega aquí desde el modo
      // offline (ownerUid conocido en localStorage). El flujo online usa
      // redeem_invitation_and_get_plan que ya devuelve el plan en validate().
      const { data, error } = await SDB._rest(`/plans?id=eq.${planId}&select=*&limit=1`);
      if (error) {
        console.warn("[PLAN_FETCH] getPlanById error:", error);
        return null;
      }
      if (!data?.[0]) {
        console.warn("[PLAN_FETCH] getPlanById — plan not found or RLS blocked:", planId);
        return null;
      }
      console.info("[PLAN_FETCH] getPlanById ok — plan:", data[0].id);
      return _sbToLocalPlan(data[0]);
    } catch(e) {
      console.warn("[PLAN_FETCH] getPlanById exception:", e.message);
      return null;
    }
  },

  upsertPlan: async (plan) => {
    if (!SDB._token) return;
    // FIX 4: usa la RPC set_active_plan que ejecuta UPDATE+INSERT en una sola
    // transacción atómica en el servidor. Elimina la ventana POST→PATCH donde
    // podían existir 0 ó 2 planes activos simultáneamente.
    // El índice único parcial plans_one_active_per_user garantiza a nivel de DB
    // que nunca haya más de un plan activo por usuario.
    const sbPlan = _localToSbPlan(plan);
    const upsertRes = await SDB._rest("/rpc/set_active_plan", {
      method: "POST",
      body: JSON.stringify({ p_uid: plan.uid, p_plan: sbPlan }),
    });
    if (upsertRes.error) {
      throw new Error("upsertPlan failed: " + JSON.stringify(upsertRes.error));
    }
  },

  // ── Assignments ───────────────────────────────────────────────────────────
  getAssignmentsForNutritionist: async (nid) => {
    const { data } = await SDB._rest(`/assignments?nid=eq.${nid}&select=*`);
    return data || [];
  },

  upsertAssignment: async (a) => {
    if (!SDB._token) return;
    await SDB._rest("/assignments?on_conflict=nid,cid", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: a.id, nid: a.nid, cid: a.cid, status: a.status || 'active', created_at: new Date(a.createdAt || Date.now()).toISOString() }),
    });
  },

  deleteAssignment: async (cid, nid) => {
    if (!SDB._token) return;
    await SDB._rest(`/assignments?cid=eq.${cid}&nid=eq.${nid}`, { method: "DELETE" });
  },

  findClient: async (search) => {
    const { data, error } = await SDB._rest("/rpc/find_client", {
      method: "POST", body: JSON.stringify({ p_search: search }),
    });
    if (error) return { error };
    return { ok: true, data: data || [] };
  },

  requestAssignment: async (cid) => {
    const { error } = await SDB._rest("/rpc/request_assignment", {
      method: "POST", body: JSON.stringify({ p_cid: cid }),
    });
    if (error) return { error };
    return { ok: true };
  },

  respondToAssignment: async (nid, accept) => {
    const { error } = await SDB._rest("/rpc/respond_to_assignment", {
      method: "POST", body: JSON.stringify({ p_nid: nid, p_accept: accept }),
    });
    if (error) return { error };
    return { ok: true };
  },

  getPendingAssignmentsForClient: async (cid) => {
    // assignments_nid_fkey: verify FK name against PostgREST if this fails at runtime
    const { data } = await SDB._rest(
      `/assignments?cid=eq.${cid}&status=eq.pending&select=id,nid,cid,status,created_at,profiles!assignments_nid_fkey(id,email,display_name)`
    );
    return (data || []).map(r => ({
      id: r.id,
      nid: r.nid,
      cid: r.cid,
      status: r.status,
      created_at: r.created_at,
      nutritionist: r.profiles || null,
    }));
  },

  // ── Checkins ──────────────────────────────────────────────────────────────
  insertCheckin: async (uid, ci) => {
    if (!SDB._token) return;
    await SDB._rest("/checkins", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: ci.id, uid, payload: ci, created_at: new Date(ci.created_at || Date.now()).toISOString() }),
    });
  },

  getCheckins: async (uid) => {
    const { data } = await SDB._rest(
      `/checkins?uid=eq.${uid}&order=created_at.desc&limit=24&select=id,payload,created_at`
    );
    return (data || []).map(r => ({ ...r.payload, id: r.id, created_at: r.created_at }));
  },

  // ── User data (profile, progress, meal_memory) ───────────────────────────
  getUserData: async (uid, key) => {
    const { data: rows } = await SDB._rest(
      `/user_data?uid=eq.${uid}&select=data&limit=1`
    );
    return rows?.[0]?.data?.[key] ?? null;
  },

  setUserData: async (uid, key, value) => {
    if (!SDB._token) return;

    const { data: rows } = await SDB._rest(
      `/user_data?uid=eq.${uid}&select=data&limit=1`
    );

    const current = rows?.[0]?.data || {};

    await SDB._rest("/user_data", {
      method: "POST",
      headers: {
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        uid,
        data: {
          ...current,
          [key]: value
        }
      }),
    });
  },

  // ── Preferences ──────────────────────────────────────────────────────────
  getPreferences: async (uid) => {
    const { data: rows } = await SDB._rest(
      `/preferences?uid=eq.${uid}&select=data&limit=1`
    );
    return rows?.[0]?.data ?? null;
  },

  upsertPreferences: async (uid, prof) => {
    if (!SDB._token) return;
    await SDB._rest("/preferences", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        uid,
        data: {
          gender:         prof.gender,
          age:            prof.age,
          weight:         prof.weight,
          height:         prof.height,
          activity:       prof.activity,
          goal:           prof.goal,
          kcalAdjust:     prof.kcalAdjust      ?? 0,
          intolerances:   prof.intolerances    ?? [],
          eliminatedFoods: prof.eliminatedFoods ?? [],
          trainingDays:   prof.trainingDays    ?? [],
        },
      }),
    });
  },

  // ── Progress ──────────────────────────────────────────────────────────────
  getProgress: async (uid) => {
    const { data } = await SDB._rest(
      `/progress?uid=eq.${uid}&order=year.desc,week_num.desc&limit=52`
    );
    if (!data?.length) return null;
    // Reshape to match the local { weeks:[], foodLikes:{}, ... } format
    return {
      weeks: data.map(r => ({
        week:      r.week_num,
        year:      r.year,
        weight:    r.weight_kg,
        bodyFat:   r.body_fat_pct,
        notes:     r.notes,
        ...(r.payload || {}),
      })),
      foodLikes:    data[0]?.payload?.foodLikes    ?? {},
      foodDislikes: data[0]?.payload?.foodDislikes ?? {},
      failPatterns: data[0]?.payload?.failPatterns ?? [],
    };
  },

  upsertProgressWeek: async (uid, weekNum, year, weekData) => {
    if (!SDB._token) return;
    await SDB._rest("/progress", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        uid,
        week_num:     weekNum,
        year:         year,
        weight_kg:    weekData.weight   ?? null,
        body_fat_pct: weekData.bodyFat  ?? null,
        notes:        weekData.notes    ?? null,
        payload:      weekData,
      }),
    });
  },

  // ── Meal Memory ───────────────────────────────────────────────────────────
  getMealMemory: async (uid) => {
    const { data: rows } = await SDB._rest(
      `/meal_memory?uid=eq.${uid}&select=week_num,data&order=week_num.desc&limit=3`
    );
    return (rows || []).map(r => ({
      week: r.week_num,
      L:    r.data?.lunch_proteins  || [],
      D:    r.data?.dinner_proteins,
    }));
  },

  upsertMealMemory: async (uid, weekNum, L, D, extraData = {}) => {
    if (!SDB._token) return;
    await SDB._rest("/meal_memory?on_conflict=uid,week_num", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        uid,
        week_num: weekNum,
        data: {
          lunch_proteins:  L || [],
          dinner_proteins: D,
          food_likes:      extraData.foodLikes    || {},
          food_dislikes:   extraData.foodDislikes || {},
          fail_patterns:   extraData.failPatterns || [],
        },
      }),
    });
  },

  // ── Clients (nutritionist reads clients list with latest plan) ────────────
  getClientsProfiles: async (nid) => {
    // Join assignments → profiles in a single call via Supabase PostgREST embed
    const { data } = await SDB._rest(
      `/assignments?nid=eq.${nid}&select=cid,profiles!assignments_cid_fkey(id,email,role,display_name)`
    );
    return (data || []).map(r => r.profiles).filter(Boolean);
  },

  // ── Cross-device poll (replaces BroadcastChannel for different devices) ───
  // Returns the plan only if it's newer than what we have locally.
  pollPlanUpdate: async (uid, localTs) => {
    // FIX 2: compara updated_at en lugar de created_at. Así un plan del
    // nutricionista con created_at antiguo (editado hoy) sigue siendo detectado
    // como nuevo. Fallback a created_at si updated_at no está presente.
    const { data } = await SDB._rest(
      `/plans?uid=eq.${uid}&is_active=eq.true&order=updated_at.desc&select=id,updated_at&limit=1`
    );
    const remote = data?.[0];
    if (!remote) return null;
    const remoteTs = typeof remote.updated_at === "number"
      ? remote.updated_at
      : new Date(remote.updated_at).getTime();
    if (remoteTs > (localTs || 0)) {
      return await SDB.getActivePlan(uid);
    }
    return null;
  },

  // ── Nutritionist applications ──────────────────────────────────────────────
  submitNutriApplication: async (userId, data) => {
    const { error } = await SDB._rest("/nutritionist_applications", {
      method: "POST",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({
        user_id:          userId,
        full_name:        data.full_name,
        license_number:   data.license_number,
        specialty:        data.specialty,
        phone:            data.phone,
        dni:              data.dni,
        dni_document_url: data.dni_document_url || null,
      }),
    });
    if (error) return { error };
    return { ok: true };
  },

  getNutriApplicationStatus: async (userId) => {
    const { data } = await SDB._rest(
      `/nutritionist_applications?user_id=eq.${userId}&order=submitted_at.desc&limit=1`
    );
    const status = data?.[0]?.status ?? null;
    return status; // 'pending' | 'approved' | 'rejected' | null
  },

  // ── Admin methods (javivalmich@gmail.com only — validated server-side) ─────
  getProfileById: async (userId) => {
    const { data } = await SDB._rest(
      `/profiles?id=eq.${userId}&select=id,email,role,display_name,is_active&limit=1`
    );
    return data?.[0] ?? null;
  },

  adminGetApplications: async () => {
    const { data, error } = await SDB._rest("/rpc/admin_get_applications", {
      method: "POST",
      body: "{}",
    });
    if (error) return { error };
    return { ok: true, data: data || [] };
  },

  adminGetUsers: async () => {
    const { data, error } = await SDB._rest("/rpc/get_all_users", {
      method: "POST",
      body: "{}",
    });
    if (error) return { error };
    return { ok: true, data: data || [] };
  },

  adminApproveApplication: async (appId, notes = "") => {
    const { data, error } = await SDB._rest("/rpc/approve_nutritionist_application", {
      method: "POST",
      body: JSON.stringify({ app_id: appId, notes }),
    });
    if (error) return { error };
    return { ok: true, data };
  },

  adminRejectApplication: async (appId, notes = "") => {
    const { data, error } = await SDB._rest("/rpc/reject_nutritionist_application", {
      method: "POST",
      body: JSON.stringify({ app_id: appId, notes }),
    });
    if (error) return { error };
    return { ok: true, data };
  },

  adminSetUserRole: async (userId, role) => {
    const { data, error } = await SDB._rest("/rpc/set_user_role", {
      method: "POST",
      body: JSON.stringify({ target_id: userId, new_role: role }),
    });
    if (error) return { error };
    return { ok: true, data };
  },

  adminSetUserActive: async (userId, active) => {
    const { data, error } = await SDB._rest("/rpc/set_user_active", {
      method: "POST",
      body: JSON.stringify({ target_id: userId, active }),
    });
    if (error) return { error };
    return { ok: true, data };
  },

  // ── DNI Document Storage ──────────────────────────────────────────────────
  uploadDniDocument: async (userId, file) => {
    const ext  = file.type.includes("pdf") ? "pdf" : "jpg";
    const path = `${userId}/dni.${ext}`;
    try {
      const r = await Promise.race([
        fetch(`${SUPABASE_URL}/storage/v1/object/nutritionist-docs/${path}`, {
          method:  "POST",
          headers: {
            "Authorization": "Bearer " + SDB._token,
            "Content-Type":  file.type,
          },
          body: file,
        }),
        SDB._timeout(30000),
      ]);
      if (!r.ok) {
        const txt = await r.text();
        return { error: txt };
      }
      return { ok: true, url: `${SUPABASE_URL}/storage/v1/object/nutritionist-docs/${path}` };
    } catch(e) {
      return { error: e.message };
    }
  },

  getDniDocumentUrl: async (userId, dniDocumentUrl) => {
    let path;
    if (dniDocumentUrl) {
      const marker = "/nutritionist-docs/";
      const idx = dniDocumentUrl.indexOf(marker);
      path = idx >= 0 ? dniDocumentUrl.slice(idx + marker.length) : `${userId}/dni.jpg`;
    } else {
      path = `${userId}/dni.jpg`;
    }
    try {
      const r = await Promise.race([
        fetch(`${SUPABASE_URL}/storage/v1/object/sign/nutritionist-docs/${path}`, {
          method:  "POST",
          headers: SDB._h({}),
          body:    JSON.stringify({ expiresIn: 60 }),
        }),
        SDB._timeout(10000),
      ]);
      const txt  = await r.text();
      const body = txt ? JSON.parse(txt) : null;
      if (!r.ok) return { error: body };
      const rel = body?.signedURL || body?.signedUrl || "";
      const signedUrl = rel.startsWith("http") ? rel : `${SUPABASE_URL}/storage/v1${rel}`;
      return { ok: true, signedUrl };
    } catch(e) {
      return { error: e.message };
    }
  },

  adminPromoteToAdmin: async (userId) => {
    const { error } = await SDB._rest("/rpc/promote_to_admin", {
      method: "POST",
      body:   JSON.stringify({ target_id: userId }),
    });
    if (error) return { error };
    return { ok: true };
  },

  adminDemoteFromAdmin: async (userId) => {
    const { error } = await SDB._rest("/rpc/demote_from_admin", {
      method: "POST",
      body:   JSON.stringify({ target_id: userId }),
    });
    if (error) return { error };
    return { ok: true };
  },

  // ── Per-table DELETE helpers (reset / account deletion) ────────────────────
  // 1:1 wrappers over the _rest calls in App.jsx:1867-1872.
  // No guard on _token — call sites do not have one.
  deleteUserData:    uid => SDB._rest(`/user_data?uid=eq.${uid}`,   { method: "DELETE" }),
  deletePreferences: uid => SDB._rest(`/preferences?uid=eq.${uid}`, { method: "DELETE" }),
  deleteProgress:    uid => SDB._rest(`/progress?uid=eq.${uid}`,    { method: "DELETE" }),
  deletePlans:       uid => SDB._rest(`/plans?uid=eq.${uid}`,       { method: "DELETE" }),
  deleteMealMemory:  uid => SDB._rest(`/meal_memory?uid=eq.${uid}`, { method: "DELETE" }),
  deleteCheckins:    uid => SDB._rest(`/checkins?uid=eq.${uid}`,    { method: "DELETE" }),

  // ── Account removal via Edge Function (App.jsx:1903) ─────────────────────
  deleteAccount: uid => SDB._rest("/functions/v1/delete-user", {
    method: "POST",
    body: JSON.stringify({ uid }),
  }),

  // ── Invitations (App.jsx:1688, 3628, 3732) ───────────────────────────────
  createInvitation: (token, ownerUid, planId, expiresAt) =>
    SDB._rest("/plan_invitations", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        token,
        owner_uid:  ownerUid,
        plan_id:    planId,
        expires_at: expiresAt,
      }),
    }),

  redeemInvitation: (pToken, requesterId) =>
    SDB._rest("/rpc/redeem_invitation_and_get_plan", {
      method: "POST",
      body: JSON.stringify({ p_token: pToken, p_requester_id: requesterId }),
    }),

  markInvitationUsed: (token, usedBy) =>
    SDB._rest(`/plan_invitations?token=eq.${token}`, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ used_by: usedBy, used_at: new Date().toISOString() }),
    }),

  // ── Internal state accessors (App.jsx:3630, 3882-3885) ───────────────────
  getUid: () => SDB._uid,

  withTemporaryToken: (token, fn) => {
    const prev = SDB._token;
    SDB._token = token;
    try { return fn(); }
    finally { SDB._token = prev; }
  },
};

// ─── Shape converters ─────────────────────────────────────────────────────
// Supabase columns use snake_case; PDB/localStorage uses the original camelCase.
function _localToSbPlan(p) {
  return {
    id:              p.id,
    uid:             p.uid,
    is_active:       p.is_active ?? true,
    created_by:      p.created_by || "system",
    nutritionist_id: p.nutritionist_id || null,
    strategy:        p.strategy || null,
    calories:        p.calories || null,
    profile_data:    p.profile || null,
    days:            p.days    || [],
    week_num:        p.weekNum || p.week_num || null,
    extras:          p.extras  || {},
    week_warnings:   p.weekWarnings || null,
    week_score:      Number.isFinite(p.weekScore) ? p.weekScore : null,
    created_at:      p.created_at || Date.now(),
  };
}

// CYCLE RESOLUTION (OPCIÓN B): la línea original era:
//   weekScore: r.week_score != null ? r.week_score
//              : (PDB.getPlans(r.uid).find(p => p.id === r.id)?.weekScore ?? null)
// Ese fallback requería importar PDB → ciclo sdb.js ↔ App.jsx.
// Se simplifica a r.week_score ?? null. El fallback era best-effort:
// weekScore es null en Supabase solo cuando el plan nunca fue sincronizado con score,
// y en ese caso PDB local tampoco lo tendría disponible de forma fiable.
export function _sbToLocalPlan(r) {
  return {
    id:              r.id,
    uid:             r.uid,
    is_active:       r.is_active,
    created_by:      r.created_by,
    nutritionist_id: r.nutritionist_id,
    strategy:        r.strategy,
    calories:        r.calories,
    profile:         r.profile_data,
    days:            r.days || [],
    weekNum:         r.week_num,
    extras:          r.extras || {},
    weekWarnings:    r.week_warnings,
    weekScore:       r.week_score ?? null,
    created_at:      typeof r.created_at === "number" ? r.created_at : new Date(r.created_at).getTime(),
    updated_at:      typeof r.updated_at === "number" ? r.updated_at : new Date(r.updated_at).getTime(),
  };
}
