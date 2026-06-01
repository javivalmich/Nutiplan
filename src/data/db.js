import {
  __PERF,
  _bcPost,
  __NP_AUTHORED_IDS,
  getWeekNumber
} from "./runtime.js";
import { SDB } from "./sdb.js";

// ── SCHEMA VERSION ────────────────────────────────────────────────────────
// Bump this number whenever the stored data shape changes.
// Migration runs once on boot before any user data is read.
const SCHEMA_VERSION = 3;

// Lightweight validator helpers — no external deps
function _isObj(v)  { return v !== null && typeof v === "object" && !Array.isArray(v); }
function _isArr(v)  { return Array.isArray(v); }
// Safe deep clone via JSON round-trip (handles dates as timestamps already)
function _clone(v)  { try { return JSON.parse(JSON.stringify(v)); } catch(e) { return null; } }

// Validate & repair a plan object. Returns null if unrecoverable.
function _validatePlan(p) {
  if (!_isObj(p)) return null;
  if (typeof p.id !== "string") return null;
  if (!_isArr(p.days)) p.days = [];
  if (typeof p.created_at !== "number") p.created_at = Date.now();
  if (typeof p.is_active !== "boolean") p.is_active = false;
  if (!p.uid || typeof p.uid !== "string") return null; // can't recover ownerless plan
  return p;
}

// Validate & repair a user profile object.
function _validateProfile(pr) {
  if (!_isObj(pr)) return null;
  const defaults = { gender:"male", age:30, weight:70, height:170, activity:"moderado",
    goal:"maintain", kcalAdjust:0, intolerances:[], eliminatedFoods:[], trainingDays:[] };
  return { ...defaults, ...pr };
}

// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM DB — multi-user localStorage layer
// ═══════════════════════════════════════════════════════════════════════════


// ─── SyncEngine ───────────────────────────────────────────────────────────
// Write queue: PDB writes are instant/synchronous for the UI.
// SyncEngine mirrors them to Supabase async + fire-and-forget.
// Queue is drained when online + authenticated.
const SyncEngine = {
  _q:    [],     // pending { fn, retries } ops
  _busy: false,
  _online: typeof navigator !== "undefined" ? navigator.onLine : true,

  init() {
    if (typeof window === "undefined") return;
    window.addEventListener("online",  () => { SyncEngine._online = true;  SyncEngine._drain(); });
    window.addEventListener("offline", () => { SyncEngine._online = false; });
  },

  // ── One-time data migration: localStorage → Supabase ────────────────────
  // Called after first successful Supabase sign-in.
  // Guarded by "pf_sb_migrated" flag so it never runs twice.
  async migrateExistingData() {
    if (!SDB._token) return;
    try {
      const already = localStorage.getItem("pf_sb_migrated");
      if (already) return;

      console.info("[SyncEngine] ── Migrating localStorage → Supabase ──");
      const year = new Date().getFullYear();
      const users = PDB.getUsers();
      let migrated = 0;

      for (const u of users) {
        console.info(`[SyncEngine]   Migrating user: ${u.email}`);

        // 1. Active plan
        const plan = PDB.getActivePlan(u.id);
        if (plan && plan.uid) {
          await SDB.upsertPlan({ ...plan, uid: u.id }).catch(e =>
            console.warn("    ✗ plan:", e.message)
          );
          console.info(`    ✓ plan (${plan.id})`);
        }

        // 2. Assignments (nutritionist clients)
        if (u.role === "nutritionist") {
          const asgns = PDB.getAssignments().filter(a => a.nid === u.id);
          for (const a of asgns) {
            await SDB.upsertAssignment(a).catch(() => {});
          }
          if (asgns.length) console.info(`    ✓ assignments (${asgns.length})`);
        }

        // 3. Progress → dedicated progress table
        const progRaw = PDB._g("nutri_v2_prog_" + u.id) || PDB._g("pf_progress_" + u.id);
        if (progRaw?.weeks?.length) {
          for (const w of progRaw.weeks) {
            await SDB.upsertProgressWeek(u.id, w.week || 1, year, {
              ...w,
              foodLikes:    progRaw.foodLikes    || {},
              foodDislikes: progRaw.foodDislikes || {},
              failPatterns: progRaw.failPatterns || [],
            }).catch(() => {});
          }
          await SDB.setUserData(u.id, "progress", progRaw).catch(() => {});
          console.info(`    ✓ progress (${progRaw.weeks.length} weeks)`);
        }

        // 4. Meal memory → dedicated meal_memory table
        const memRaw = PDB._g("nutri_v2_mem_" + u.id) || PDB._g("pf_mem_" + u.id);
        if (Array.isArray(memRaw) && memRaw.length) {
          for (const m of memRaw) {
            await SDB.upsertMealMemory(u.id, m.week, m.L || [], m.D || {}).catch(() => {});
          }
          console.info(`    ✓ meal_memory (${memRaw.length} entries)`);
        }

        // 5. Profile → preferences table
        const profRaw = PDB._g("pf_profile_" + u.id) || plan?.profile;
        if (profRaw) {
          await SDB.upsertPreferences(u.id, profRaw).catch(() => {});
          await SDB.setUserData(u.id, "profile", profRaw).catch(() => {});
          console.info("    ✓ preferences");
        }

        migrated++;
      }

      localStorage.setItem("pf_sb_migrated", "1");
      console.info(`[SyncEngine] ── Migration complete: ${migrated} users ✓ ──`);
    } catch(e) {
      console.warn("[SyncEngine] Migration error (will retry next login):", e.message);
      // Don't set the flag — allow retry on next login
    }
  },

  push(fn) {
    // FIX (stability P1): bounded queue. Without a cap, prolonged offline use
    // (airplane, tunnel) lets _q grow unbounded — each entry retains a closure.
    // On low-end mobiles this can OOM in long sessions. Drop oldest on overflow,
    // mirroring the same "best-effort" guarantee the queue already provides
    // (5-retry then drop). Cap chosen empirically: 500 ops ≈ ~50 KB of closures,
    // which is more than enough for hours of normal use.
    const MAX_QUEUE = 500;
    if (SyncEngine._q.length >= MAX_QUEUE) {
      const dropped = SyncEngine._q.shift();
      console.warn("[SyncEngine] Queue full (>" + MAX_QUEUE + "), dropping oldest op (retries=" + (dropped?.retries || 0) + ")");
    }
    SyncEngine._q.push({ fn, retries: 0 });
    SyncEngine._drain();
  },

  async _drain() {
    if (SyncEngine._busy || !SyncEngine._online || !SDB._token) return;
    const __t0 = __PERF.mark();  // PERF — total time of one drain pass
    let __ops = 0;
    SyncEngine._busy = true;
    while (SyncEngine._q.length > 0) {
      const item = SyncEngine._q[0];
      try {
        await item.fn();
        SyncEngine._q.shift();
        item._failedAt = null; // reset backoff on success
        __ops++;
      } catch(e) {
        item.retries = (item.retries || 0) + 1;
        if (item.retries >= 5) {
          console.warn("[SyncEngine] Dropping op after 5 retries:", e.message);
          SyncEngine._q.shift();
          continue;
        }
        // Exponential backoff: 1s, 2s, 4s, 8s, then drop
        const backoffMs = Math.min(1000 * Math.pow(2, item.retries - 1), 8000);
        console.info(`[SyncEngine] Retry ${item.retries}/5 in ${backoffMs}ms`);
        SyncEngine._busy = false;
        setTimeout(() => SyncEngine._drain(), backoffMs);
        __PERF.measure("SyncEngine._drain", __t0);  // PERF — partial drain
        return; // exit — will resume after backoff
      }
    }
    SyncEngine._busy = false;
    if (__ops > 0) {
      __PERF.measure("SyncEngine._drain", __t0);  // PERF — sólo si hubo trabajo
      __PERF.count("SyncEngine._drain:ops=" + __ops);  // distribución de ops por flush
    }
  },

  // Persist queue to localStorage so ops survive page refresh
  _persistQueue() {
    try {
      const serializable = SyncEngine._q.map(item => ({
        retries: item.retries || 0,
        // We can't serialize the fn — just log it was pending
        _type: item._type || "unknown",
      }));
      localStorage.setItem("pf_sync_q_count", String(serializable.length));
    } catch(e) {}
  },

  // Called on login: pull Supabase data into localStorage (merge, newer wins)
  async pullFromCloud(uid) {
    if (!SDB._token) return;
    try {
      // 1. Active plan (highest priority — nutritionist may have updated it)
      const plan = await SDB.getActivePlan(uid);
      if (plan) {
        const local = PDB.getActivePlan(uid);
        const cloudTs = plan.updated_at || plan.created_at || 0;
        const localTs = local?.updated_at || local?.created_at || 0;
        if (cloudTs >= localTs) {
          const plans = PDB.getPlans(uid).map(p => ({...p, is_active: false}));
          const merged = [...plans.filter(p => p.id !== plan.id), {...plan, is_active: true}];
          try { localStorage.setItem("pf_plans_"+uid, JSON.stringify(merged)); } catch(e) {}
          _bcPost({ type:"PLAN_UPDATED", uid, ts: Date.now() });
          console.info("[SyncEngine] pullFromCloud: plan merged (cloud wins by", cloudTs - localTs, "ms)");
        }
      } else {
        // BUG FIX (device sync): cloud returned NO active plan, but local has
        // one. This means a previous upsertPlan crashed between PATCH and POST
        // (or before the new ordered POST-first fix). Recover by pushing the
        // local plan back to cloud — restores convergence between devices.
        const local = PDB.getActivePlan(uid);
        if (local && local.uid) {
          console.warn("[SyncEngine] pullFromCloud: cloud has NO active plan; pushing local plan as recovery");
          SyncEngine.push(() => SDB.upsertPlan({ ...local, uid }));
        }
      }

      // 2. Preferences → local profile key
      const prefs = await SDB.getPreferences(uid);
      if (prefs) {
        try { localStorage.setItem("pf_profile_"+uid, JSON.stringify({...prefs, updatedAt: Date.now()})); } catch(e) {}
        console.info("[SyncEngine] pullFromCloud: preferences merged");
      }

      // 3. Progress
      const prog = await SDB.getProgress(uid);
      if (prog) {
        // Write to the PK() key format that loadProgress() reads
        PDB._s(PK(uid), prog);
        console.info("[SyncEngine] pullFromCloud: progress merged");
      }

      // 4. Meal memory
      const mem = await SDB.getMealMemory(uid);
      if (mem?.length) {
        PDB._s(MK(uid), mem);
        console.info("[SyncEngine] pullFromCloud: meal_memory merged");
      }

    } catch(e) {
      console.warn("[SyncEngine] pullFromCloud error:", e.message);
    }
  },

  // Called once after first Supabase sign-in: push local data to cloud
  async pushToCloud(uid) {
    if (!SDB._token) return;
    try {
      const plan = PDB.getActivePlan(uid);
      if (plan && plan.uid) {
        await SDB.upsertPlan({...plan, uid});
      }
      const asgns = PDB.getClientsOf(uid);
      for (const a of asgns) {
        await SDB.upsertAssignment({...a, nid: uid});
      }
    } catch(e) {
      console.warn("[SyncEngine] pushToCloud error:", e);
    }
  },
};

// Kick off SyncEngine event listeners as soon as the module loads
SyncEngine.init();

// ─── STORAGE ──────────────────────────────────────────
function SK(uid){return "nutri_v2_"+uid;}

// ── CROSS-WEEK MEMORY ─────────────────────────────────────────────────────
// Stores last 4 weeks of lunch protein sequences to avoid inter-week repetition.
// Format: {week: [{L:"pollo",D:"pavo"}, ...x7]}
function MK(uid){return "nutri_meal_memory_"+uid;}
function loadMealMemory(uid) {
  // FIX 12: safe parse
  const d = PDB._g(MK(uid));
  return Array.isArray(d) ? d : [];
}
function saveMealMemory(uid, weekNum, lunchProteins, dinnerProteins) {
  var mem = loadMealMemory(uid);
  mem = mem.filter(function(m){ return m.week !== weekNum; }).slice(-3);
  mem.push({week:weekNum, L:lunchProteins, D:dinnerProteins});
  PDB._s(MK(uid), mem);
  // FIX D: mirror to dedicated meal_memory table
  if (uid !== "anon") {
    const prog = loadProgress(uid);
    SyncEngine.push(() =>
      SDB.upsertMealMemory(uid, weekNum, lunchProteins, dinnerProteins, {
        foodLikes:    prog.foodLikes    || {},
        foodDislikes: prog.foodDislikes || {},
        failPatterns: prog.failPatterns || [],
      })
    );
  }
}

function saveData(uid, profile, plan, weekNum, extras) {
  const __t0 = __PERF.mark();  // PERF
  if (profile) PDB._s("pf_profile_"+uid, {...profile, updatedAt:Date.now()});
  PDB._s(SK(uid), {profile, plan, weekNum, extras});
  if (profile && uid !== "anon") {
    // FIX D: mirror to dedicated preferences table (structured columns)
    SyncEngine.push(() => SDB.upsertPreferences(uid, profile));
    // Keep user_data as a fast-read backup blob
    SyncEngine.push(() => SDB.setUserData(uid, "profile", {...profile, updatedAt:Date.now()}));
  }
  __PERF.measure("saveData", __t0);  // PERF
}
function loadData(uid) {
  // FIX 12: use PDB._g for safe parse + corruption quarantine
  const d = PDB._g(SK(uid));
  if (!d || typeof d !== "object") return {profile:null, plan:null, weekNum:null, extras:{}};
  return {
    profile: d.profile  || null,
    plan:    d.plan     || null,
    weekNum: d.weekNum  || null,
    extras:  d.extras   || {},
  };
}
function clearData(uid) {
  try { localStorage.removeItem(SK(uid)); localStorage.removeItem(PK(uid)); } catch(e) {}
}

// ── PROGRESS TRACKING ────────────────────────────────────────────────────────
function PK(uid){return "nutri_progress_"+uid;}
function loadProgress(uid) {
  // FIX 12: safe parse via PDB._g
  const d = PDB._g(PK(uid));
  if (!d || typeof d !== "object") return {weeks:[], foodLikes:{}, foodDislikes:{}, failPatterns:[]};
  return {
    weeks:       Array.isArray(d.weeks)       ? d.weeks       : [],
    foodLikes:   d.foodLikes   && typeof d.foodLikes   === "object" ? d.foodLikes   : {},
    foodDislikes:d.foodDislikes&& typeof d.foodDislikes=== "object" ? d.foodDislikes: {},
    failPatterns:Array.isArray(d.failPatterns)? d.failPatterns: [],
  };
}
function saveProgress(uid, prog) {
  PDB._s(PK(uid), prog);
  // FIX D: mirror progress to dedicated `progress` table (not generic user_data)
  if (uid !== "anon") {
    const now = new Date();
    const year = now.getFullYear();
    // Sync each week entry individually (upsert by uid+week_num+year)
    if (Array.isArray(prog.weeks) && prog.weeks.length > 0) {
      const latestWeek = prog.weeks[prog.weeks.length - 1];
      SyncEngine.push(() =>
        SDB.upsertProgressWeek(uid, latestWeek.week || getWeekNumber(), year, {
          ...latestWeek,
          foodLikes:    prog.foodLikes    || {},
          foodDislikes: prog.foodDislikes || {},
          failPatterns: prog.failPatterns || [],
        })
      );
    }
    // Keep user_data as backup for fast reads
    SyncEngine.push(() => SDB.setUserData(uid, "progress", prog));
  }
}
function addWeekProgress(uid, weekNum, {peso, pesoInicial, adherencia, energia, hambre}) {
  var prog = loadProgress(uid);
  // Remove existing entry for this week
  prog.weeks = (prog.weeks||[]).filter(function(w){return w.week !== weekNum;});
  prog.weeks.push({week:weekNum, peso, pesoInicial, adherencia, energia, hambre, ts:Date.now()});
  // Keep only last 12 weeks
  prog.weeks = prog.weeks.slice(-12);
  saveProgress(uid, prog);
  return prog;
}


const PDB = {
  _g: k => {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) {
      // FIX: corrupted JSON — quarantine the key instead of silently returning null
      console.warn("[NutiPlan] Corrupt storage key quarantined:", k);
      try { localStorage.setItem(k + "_corrupt_" + Date.now(), localStorage.getItem(k) || ""); } catch(_) {}
      try { localStorage.removeItem(k); } catch(_) {}
      return null;
    }
  },
  _s: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {
    console.warn("[NutiPlan] Storage write failed for key:", k, e);
  } },

  // ── SCHEMA MIGRATION ──────────────────────────────────────────────────────
  // Called once on boot. Safe to call multiple times (idempotent).
  migrate: () => {
    const stored = PDB._g("pf_schema_version") || 0;
    if (stored >= SCHEMA_VERSION) return; // already up to date

    // v1→v2: pf_users entries might lack createdAt
    if (stored < 2) {
      const users = PDB._g("pf_users") || [];
      PDB._s("pf_users", users.map(u => ({
        createdAt: Date.now(), ...u
      })));
    }

    // v2→v3: validate & repair all plan arrays
    if (stored < 3) {
      const users = PDB._g("pf_users") || [];
      users.forEach(u => {
        const key   = "pf_plans_" + u.id;
        const plans = PDB._g(key);
        if (!_isArr(plans)) return;
        const repaired = plans.map(_validatePlan).filter(Boolean);
        if (repaired.length !== plans.length) {
          console.warn("[NutiPlan] Repaired plan array for user", u.id);
        }
        PDB._s(key, repaired);
      });
    }

    PDB._s("pf_schema_version", SCHEMA_VERSION);
    console.info("[NutiPlan] Storage migrated to schema v" + SCHEMA_VERSION);
  },

  // USERS
  getUsers: () => PDB._g("pf_users") || [],
  _saveUsers: u => PDB._s("pf_users", u),
  // Removes a user by id from local storage only. No Supabase side-effect.
  // Used as a rollback when post-registration validation fails after a partial local write.
  deleteUserLocal: id => PDB._saveUsers(PDB.getUsers().filter(u => u.id !== id)),
  // SUPABASE: createUser is now async — caller must await it
  createUser: async (email, pass, role) => {
    // 1. Try Supabase sign-up
    const { user: sbUser, error: sbErr } = await SDB.signUp(email.trim(), pass, role);
    if (sbUser) {
      // Supabase created the user but no session token: email confirmation is required.
      // Do NOT create a local account — the user must confirm before they can log in.
      if (!SDB._token) return { error: "CONFIRM_EMAIL" };
      // Mirror into localStorage so offline mode + legacy keys still work
      const users = PDB.getUsers();
      if (!users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        PDB._saveUsers([...users, { id: sbUser.id, email: sbUser.email, pass: "__sb__", role, createdAt: Date.now(), supabase: true }]);
      }
      return { user: sbUser };
    }
    // 2. Supabase failed — check if it's a real error (duplicate email) vs offline
    if (sbErr && typeof sbErr === "string" && sbErr.toLowerCase().includes("already")) {
      return { error: "Email ya registrado" };
    }
    // Email confirmation required (Supabase returned a confirm-related error)
    if (sbErr && typeof sbErr === "string" && (sbErr.toLowerCase().includes("confirm") || sbErr.toLowerCase().includes("not confirmed"))) {
      return { error: "CONFIRM_EMAIL" };
    }
    // 3. Fall back to localStorage (offline / Supabase unavailable)
    console.warn("[PDB] Supabase sign-up failed, falling back to localStorage:", sbErr);
    const users = PDB.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return { error: "Email ya registrado" };
    const user = { id: Date.now().toString(36)+Math.random().toString(36).slice(2), email: email.toLowerCase(), pass, role, createdAt: Date.now() };
    PDB._saveUsers([...users, user]);
    return { user };
  },

  // SUPABASE: loginUser is now async
  loginUser: async (email, pass) => {
    // 1. Try Supabase sign-in
    const { user: sbUser, error: sbErr } = await SDB.signIn(email.trim(), pass);
    if (sbUser) {
      // Ensure user exists in localStorage for offline/legacy compat
      const users = PDB.getUsers();
      if (!users.find(u => u.id === sbUser.id)) {
        PDB._saveUsers([...users, { id: sbUser.id, email: sbUser.email, pass: "__sb__", role: sbUser.role, createdAt: Date.now(), supabase: true }]);
      }
      return sbUser;
    }
    // Email not confirmed — surface specific error, do NOT fall to localStorage
    if (sbErr && typeof sbErr === "string" && (sbErr.toLowerCase().includes("not confirmed") || sbErr.toLowerCase().includes("email_not_confirmed"))) {
      return { error: "CONFIRM_EMAIL" };
    }
    // 2. Supabase unreachable — try localStorage fallback
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    if (offline || (sbErr && sbErr.toString().includes("fetch"))) {
      console.warn("[PDB] Supabase sign-in failed (offline?), trying localStorage");
      return PDB.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass) || null;
    }
    // 3. Real auth error (wrong password, etc.)
    return null;
  },
  getUserById: id => PDB.getUsers().find(u => u.id===id) || null,
  getUserByEmail: email => PDB.getUsers().find(u => u.email.toLowerCase()===email.toLowerCase()) || null,
  // Reads the client profile stored under "pf_profile_<cid>" by saveData().
  // This key is distinct from SK(uid) ("pf_user_data_<cid>"); do not substitute loadData().
  // Read-only; no side-effects.
  getClientProfile: cid => PDB._g("pf_profile_" + cid),

  // SESSION
  getSession: () => PDB._g("pf_session"),
  setSession: user => {
    PDB._s("pf_session", user);
    // Drain any queued sync ops whenever session is (re)set with a valid user
    if (user) SyncEngine._drain();
  },
  clearSession: () => {
    PDB._s("pf_session", null);
    // Note: SDB tokens are cleared separately in handleLogout via SDB.signOut()
  },

  // ASSIGNMENTS  (1 nutritionist per client)
  getAssignments: () => PDB._g("pf_assignments") || [],
  _saveAsgn: a => PDB._s("pf_assignments", a),
  getClientsOf: nutritionistId => PDB.getAssignments().filter(a => a.nid === nutritionistId),
  getNutritionistOf: clientId => PDB.getAssignments().find(a => a.cid === clientId) || null,
  assignClient: (nid, cid) => {
    let a = PDB.getAssignments().filter(x => x.cid !== cid);
    const newAsgn = { id: Date.now().toString(36), nid, cid, createdAt: Date.now() };
    a.push(newAsgn);
    PDB._saveAsgn(a);
    // SUPABASE: mirror assignment to cloud
    SyncEngine.push(() => SDB.upsertAssignment(newAsgn));
  },
  removeAssignment: cid => PDB._saveAsgn(PDB.getAssignments().filter(a => a.cid !== cid)),

  // PLANS (versioned per user)
  getPlans: uid => PDB._g("pf_plans_"+uid) || [],
  _savePlans: (uid, plans) => {
    PDB._s("pf_plans_"+uid, plans);
    // BUG FIX (device sync echo): record the active plan id as "authored
    // locally" so the realtime echo guard can skip its own bounce. We hold
    // ids for ~10s — enough for the round-trip via Supabase Realtime.
    const active = plans.find(p => p.is_active);
    if (active && active.id) {
      __NP_AUTHORED_IDS.add(active.id);
      setTimeout(() => __NP_AUTHORED_IDS.delete(active.id), 10000);
    }
    _bcPost({ type:"PLAN_UPDATED", uid, ts:Date.now() });
    // SUPABASE: mirror active plan to cloud async (fire-and-forget)
    if (active) SyncEngine.push(() => SDB.upsertPlan({ ...active, uid }));
  },
  // Clears all local plans for uid without triggering SyncEngine.push.
  // Delegates to _savePlans(uid, []): empty array → no active plan → push guard is false.
  // Broadcast (PLAN_UPDATED) still fires. Call only after the caller has deleted from Supabase.
  clearPlans: uid => PDB._savePlans(uid, []),
  getActivePlan: uid => (PDB.getPlans(uid)).find(p => p.is_active) || null,
  addPlan: (uid, planData) => {
    const plans = PDB.getPlans(uid).map(p => ({...p, is_active:false}));
    const np = { ...planData, id:Date.now().toString(36)+Math.random().toString(36).slice(2), uid, is_active:true, created_at:Date.now(), updated_at:Date.now() };
    PDB._savePlans(uid, [...plans, np]);
    return np;
  },
  updateActivePlan: (uid, patch) => {
    // FIX 6: no pisar created_at en ediciones locales (swap, regen). Solo addPlan
    // debe fijar created_at nuevo. Si no lo bumpeamos aquí, BC/poll no disparan
    // hidratación innecesaria y los cambios en vuelo del usuario no se sobreescriben.
    const plans = PDB.getPlans(uid).map(p => p.is_active ? {...p, ...patch, updated_at:Date.now()} : p);
    PDB._savePlans(uid, plans);
  },
  getPlanHistory: uid => PDB.getPlans(uid).slice(-8).reverse(),

  // CHECKINS
  getCheckins: uid => PDB._g("pf_checkins_"+uid) || [],
  addCheckin: (uid, ci) => {
    const arr = PDB.getCheckins(uid);
    const nc = {...ci, id:Date.now().toString(36), created_at:Date.now()};
    PDB._s("pf_checkins_"+uid, [...arr, nc].slice(-24));
    // SUPABASE: mirror checkin to cloud
    SyncEngine.push(() => SDB.insertCheckin(uid, nc));
    return nc;
  },

  // ── Local-only user creation (sync, no Supabase) ────────────────────────
  // Used by seedDemo and offline fallback only.
  // Real registration always goes through async PDB.createUser → SDB.signUp.
  _createUserLocal: (email, pass, role) => {
    const users = PDB.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return null;
    const user = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      email: email.toLowerCase(), pass, role, createdAt: Date.now(), demo: true,
    };
    PDB._saveUsers([...users, user]);
    return user;
  },

  // SEED DEMO — sync, uses _createUserLocal to avoid async chain issues
  // FIX F: previously called async createUser() without await — broken silently
  seedDemo: () => {
    if (PDB.getUsers().length > 0) return;
    const nutr  = PDB._createUserLocal("nutri@demo.com",  "demo123", "nutritionist");
    const maria = PDB._createUserLocal("maria@demo.com",  "demo123", "user");
    const carlos= PDB._createUserLocal("carlos@demo.com", "demo123", "user");
    if (!nutr || !maria || !carlos) return;
    // Assign both demo users to demo nutritionist
    PDB.assignClient(nutr.id,  maria.id);
    PDB.assignClient(nutr.id, carlos.id);
    console.info("[NutiPlan] Demo accounts seeded (nutri@demo.com / demo123)");
  },
};

export {
  PDB, SyncEngine,
  loadData, saveData, clearData,
  loadMealMemory, saveMealMemory,
  loadProgress, saveProgress, addWeekProgress,
  _isObj, _validateProfile
};
