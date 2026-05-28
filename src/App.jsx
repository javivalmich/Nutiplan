/*
╔══════════════════════════════════════════════════════════════════════════════╗
║          NUTIPLAN — SUPABASE SQL SCHEMA  (paste into SQL Editor)            ║
║          Project: https://evjdfyuacvtelcfvetua.supabase.co                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

Run this entire block ONCE in Supabase → SQL Editor → New query → Run.
It is idempotent (IF NOT EXISTS / CREATE OR REPLACE) — safe to re-run.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0. HELPERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Auto-update updated_at on any table that has the column
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PROFILES  — public metadata, mirrors auth.users
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  role        text not null check (role in ('user','nutritionist')),
  display_name text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table profiles enable row level security;

create policy "profiles: own read"
  on profiles for select using (auth.uid() = id);
create policy "profiles: own update"
  on profiles for update using (auth.uid() = id);
create policy "profiles: service insert"
  on profiles for insert with check (true);
create policy "profiles: nutritionist reads client"
  on profiles for select using (
    exists (select 1 from assignments where nid = auth.uid() and cid = profiles.id)
  );

create index if not exists profiles_email_idx on profiles(email);

create or replace trigger profiles_updated_at
  before update on profiles
  for each row execute function touch_updated_at();

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. NUTRITIONISTS  — extended nutritionist profile
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists nutritionists (
  id            uuid primary key references profiles(id) on delete cascade,
  license_number text,
  specialty     text,
  bio           text,
  max_clients   int default 50,
  updated_at    timestamptz default now()
);
alter table nutritionists enable row level security;

create policy "nutritionists: own all"
  on nutritionists for all using (auth.uid() = id);
create policy "nutritionists: clients read"
  on nutritionists for select using (
    exists (select 1 from assignments where nid = nutritionists.id and cid = auth.uid())
  );

create or replace trigger nutritionists_updated_at
  before update on nutritionists
  for each row execute function touch_updated_at();

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. ASSIGNMENTS  — nutritionist ↔ client relationship
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists assignments (
  id          text primary key,
  nid         uuid not null references profiles(id) on delete cascade,
  cid         uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(nid, cid)
);
alter table assignments enable row level security;

create policy "assignments: nutritionist manages"
  on assignments for all using (auth.uid() = nid);
create policy "assignments: client reads own"
  on assignments for select using (auth.uid() = cid);

create index if not exists assignments_nid_idx on assignments(nid);
create index if not exists assignments_cid_idx on assignments(cid);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. PREFERENCES  — per-user dietary preferences, intolerances, goals
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists preferences (
  uid              uuid primary key references profiles(id) on delete cascade,
  gender           text,
  age              int,
  weight_kg        numeric(5,2),
  height_cm        numeric(5,1),
  activity_level   text,
  goal             text,
  kcal_adjust      int default 0,
  intolerances     text[] default '{}',
  eliminated_foods text[] default '{}',
  training_days    text[] default '{}',
  extra            jsonb default '{}',
  updated_at       timestamptz default now()
);
alter table preferences enable row level security;

create policy "preferences: own all"
  on preferences for all using (auth.uid() = uid);
create policy "preferences: nutritionist reads client"
  on preferences for select using (
    exists (select 1 from assignments where nid = auth.uid() and cid = preferences.uid)
  );
create policy "preferences: nutritionist updates client"
  on preferences for update using (
    exists (select 1 from assignments where nid = auth.uid() and cid = preferences.uid)
  );

create or replace trigger preferences_updated_at
  before update on preferences
  for each row execute function touch_updated_at();

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. PLANS  — weekly nutrition plans
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists plans (
  id              text primary key,
  uid             uuid not null references profiles(id) on delete cascade,
  is_active       boolean not null default true,
  created_by      text not null default 'system'
                    check (created_by in ('system','nutritionist')),
  nutritionist_id uuid references profiles(id),
  strategy        text,
  calories        int,
  profile_data    jsonb,
  days            jsonb not null default '[]',
  week_num        int,
  extras          jsonb default '{}',
  week_warnings   jsonb,
  week_score      int,
  created_at      bigint not null
                    default (extract(epoch from now())*1000)::bigint
);
alter table plans enable row level security;

create policy "plans: user reads own"
  on plans for select using (auth.uid() = uid);
create policy "plans: user writes own system plans"
  on plans for all using (auth.uid() = uid and created_by = 'system');
create policy "plans: nutritionist reads client"
  on plans for select using (
    exists (select 1 from assignments where nid = auth.uid() and cid = plans.uid)
  );
create policy "plans: nutritionist writes client"
  on plans for all using (
    exists (select 1 from assignments where nid = auth.uid() and cid = plans.uid)
  );

create index if not exists plans_uid_active_idx on plans(uid, is_active);
create index if not exists plans_uid_created_idx on plans(uid, created_at desc);

-- Enable Realtime (users subscribe to their own plan changes)
alter publication supabase_realtime add table plans;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. MEALS  — individual meal records within a plan day
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists meals (
  id          text primary key,
  plan_id     text not null references plans(id) on delete cascade,
  uid         uuid not null references profiles(id) on delete cascade,
  day_index   int not null,
  slot        text not null,  -- 'desayuno','almuerzo','cena','snack1','snack2'
  name        text not null,
  kcal        int,
  protein_g   numeric(6,1),
  carbs_g     numeric(6,1),
  fat_g       numeric(6,1),
  portion     text,
  tags        text[] default '{}',
  notes       text,
  eaten       boolean default false,
  eaten_at    timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table meals enable row level security;

create policy "meals: user manages own"
  on meals for all using (auth.uid() = uid);
create policy "meals: nutritionist manages client"
  on meals for all using (
    exists (select 1 from assignments where nid = auth.uid() and cid = meals.uid)
  );

create index if not exists meals_plan_idx    on meals(plan_id);
create index if not exists meals_uid_idx     on meals(uid);
create index if not exists meals_slot_idx    on meals(plan_id, day_index, slot);

create or replace trigger meals_updated_at
  before update on meals
  for each row execute function touch_updated_at();

alter publication supabase_realtime add table meals;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. PROGRESS  — weekly weight/body tracking (one row per user per week)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists progress (
  id          uuid default gen_random_uuid() primary key,
  uid         uuid not null references profiles(id) on delete cascade,
  week_num    int not null,
  year        int not null default extract(year from now())::int,
  weight_kg   numeric(5,2),
  body_fat_pct numeric(4,1),
  notes       text,
  payload     jsonb default '{}',
  recorded_at timestamptz default now(),
  unique(uid, week_num, year)
);
alter table progress enable row level security;

create policy "progress: user manages own"
  on progress for all using (auth.uid() = uid);
create policy "progress: nutritionist reads client"
  on progress for select using (
    exists (select 1 from assignments where nid = auth.uid() and cid = progress.uid)
  );

create index if not exists progress_uid_week_idx on progress(uid, week_num, year);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. MEAL_MEMORY  — learned protein/food preferences per user (rolling 3 weeks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists meal_memory (
  uid         uuid not null references profiles(id) on delete cascade,
  week_num    int not null,
  lunch_proteins  text[] default '{}',
  dinner_proteins text[] default '{}',
  food_likes   jsonb default '{}',
  food_dislikes jsonb default '{}',
  fail_patterns text[] default '{}',
  updated_at   timestamptz default now(),
  primary key (uid, week_num)
);
alter table meal_memory enable row level security;

create policy "meal_memory: user manages own"
  on meal_memory for all using (auth.uid() = uid);
create policy "meal_memory: nutritionist reads client"
  on meal_memory for select using (
    exists (select 1 from assignments where nid = auth.uid() and cid = meal_memory.uid)
  );

create index if not exists meal_memory_uid_idx on meal_memory(uid, week_num desc);

create or replace trigger meal_memory_updated_at
  before update on meal_memory
  for each row execute function touch_updated_at();

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. CHECKINS  — daily completion logs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists checkins (
  id          text primary key,
  uid         uuid not null references profiles(id) on delete cascade,
  payload     jsonb not null,
  created_at  timestamptz default now()
);
alter table checkins enable row level security;

create policy "checkins: user manages own"
  on checkins for all using (auth.uid() = uid);
create policy "checkins: nutritionist reads client"
  on checkins for select using (
    exists (select 1 from assignments where nid = auth.uid() and cid = checkins.uid)
  );

create index if not exists checkins_uid_idx on checkins(uid, created_at desc);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. USER_DATA  — generic KV store (backward compat, prefer dedicated tables)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists user_data (
  uid        uuid not null references profiles(id) on delete cascade,
  key        text not null,
  value      jsonb,
  updated_at timestamptz default now(),
  primary key (uid, key)
);
alter table user_data enable row level security;

create policy "user_data: user manages own"
  on user_data for all using (auth.uid() = uid);
create policy "user_data: nutritionist reads client"
  on user_data for select using (
    exists (select 1 from assignments where nid = auth.uid() and cid = user_data.uid)
  );

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. PLAN_INVITATIONS  — token-based "Plan con Amigo" sharing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists plan_invitations (
  token       text primary key,           -- 6-char alphanumeric, uppercase
  owner_uid   uuid not null references profiles(id) on delete cascade,
  plan_id     text not null,              -- plans.id being shared
  used_by     uuid references profiles(id),
  used_at     timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz default now()
);
alter table plan_invitations enable row level security;

-- Owner can create and read their own invitations
create policy "invitations: owner manages"
  on plan_invitations for all using (auth.uid() = owner_uid);

-- Any authenticated user can read an unused, non-expired token (for validation)
create policy "invitations: any user reads valid token"
  on plan_invitations for select using (
    used_by is null and expires_at > now()
  );

-- Any authenticated user can claim a token (mark used_by = auth.uid())
create policy "invitations: any user claims"
  on plan_invitations for update using (
    used_by is null and expires_at > now()
  ) with check (auth.uid() = used_by);

create index if not exists invitations_owner_idx on plan_invitations(owner_uid);
create index if not exists invitations_token_idx on plan_invitations(token);

-- ── use_invitation(): atomic validate + claim in one transaction ──────────
-- SECURITY DEFINER runs with table-owner privileges so the RLS "any user
-- claims" policy doesn't cause a permission gap between the SELECT and UPDATE.
-- Returns: the plan_id if claimed, NULL if token invalid/expired/already used.
create or replace function use_invitation(p_token text, p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv plan_invitations%rowtype;
  v_plan_id text;
begin
  -- Lock the row for update to prevent concurrent claims (serialised)
  select * into v_inv
  from plan_invitations
  where token = upper(trim(p_token))
    and used_by is null
    and expires_at > now()
  for update;

  if not found then
    return null;  -- invalid, expired, or already claimed
  end if;

  -- Claim the token atomically
  update plan_invitations
  set used_by  = p_user_id,
      used_at  = now()
  where token = v_inv.token;

  return v_inv.plan_id;
end;
$$;

-- Grant execution to authenticated users only
revoke all on function use_invitation(text, uuid) from public;
grant execute on function use_invitation(text, uuid) to authenticated;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION QUERY (run after to confirm all tables exist)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles','nutritionists','assignments','preferences',
                    'plans','meals','progress','meal_memory','checkins',
                    'user_data','plan_invitations')
order by tablename;

*/


import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { SEASONAL_FOODS } from "./seasonalFoods.js";
import {
  FREEFORM_COMBOS,
  loadFreeFormCombos
} from "./data/FREEFORM_COMBOS";
const THEME = {
  // ── page / card backgrounds ───────────────────────────────────────
  bgPage:          "#F7F3ED",
  bgCard:          "#FFFFFF",
  bgCard2:         "#EDE7DF",

  // ── light backgrounds ─────────────────────────────────────────────
  bgWhite:         "#FFFFFF",
  bgLightAlt:      "#F0F5FA",
  bgLightMuted:    "#EDE7DF",
  bgSuccessLight:  "#EFF2DA",
  bgErrorLight:    "#FBF0E8",

  // ── borders ───────────────────────────────────────────────────────
  borderDark:      "#C8C3B0",

  // ── text — primary / muted ────────────────────────────────────────
  textPrimary:     "#0D1B2A",
  textMuted:       "#6B7A8D",

  // ── text — light surfaces ─────────────────────────────────────────
  textDark:        "#0D1B2A",
  textDark2:       "#2C3E50",
  textMuted2:      "#6B7A8D",
  textMuted3:      "#6B7A8D",
  textMuted4:      "#6B7A8D",
  textMuted5:      "#2C3E50",

  // ── brand / accent ────────────────────────────────────────────────
  accent:          "#737520",

  // ── status ────────────────────────────────────────────────────────
  colorSuccess:      "#4ade80",
  colorSuccessDark:  "#16a34a",
  colorSuccessLight: "#CDD48A",
  colorError:        "#f87171",
  colorErrorDark:    "#dc2626",
  colorError2:       "#C4622A",
  colorWarning:      "#D88050",
  colorWarningDark:  "#C4622A",
  colorWarningAlt:   "#C4622A",
  colorInfo:         "#1F3A5F",

  // ── purple / secondary brand ──────────────────────────────────────
  colorPurple:       "#1F3A5F",
  colorPurpleLight:  "#2D5488",

  // ── goal-specific ─────────────────────────────────────────────────
  colorOrange:       "#C4622A",

  // ── alpha variants (≥3 standalone uses) ──────────────────────────
  accentBg18:    "#73752018",
  accentBg22:    "#73752022",
  purpleBg18:    "#1F3A5F18",
  errorBg18:     "#C4622A18",
  successBg18:   "#16a34a18",

  // ── gradients (≥3 standalone uses) ───────────────────────────────
  gradAccent: "linear-gradient(135deg,#737520,#4A4E10)",
  gradPurple: "linear-gradient(135deg,#1F3A5F,#0D1B2A)",
};



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

// ═══════════════════════════════════════════════════════════════════════════
// PLAN WRITE GUARD — Steps 1-4
// Capa mínima de observabilidad + protección contra sobrescrituras stale.
// Sin librerías externas. Solo console.log/warn.
//
// Activar trace completo: __NP_TRACE.enable()
// Ver quién escribió qué: __NP_TRACE.dump()
// ═══════════════════════════════════════════════════════════════════════════

// Huella compacta del contenido de un plan. Detecta "mismo plan, escrito otra vez".
function simpleHash(plan) {
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
  } catch(_) { return ""; }
}

// Ventana de protección post-acción de usuario. 800ms cubre redes lentas (3G/WiFi
// congestionado) donde el echo del WebSocket puede llegar hasta ~600ms tarde.
const _POST_ACTION_WINDOW_MS = 800;

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

// ── Seguimiento de acciones de usuario ───────────────────────────────────
let _lastUserActionTs   = 0;
let _lastUserActionName = "";

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
  window.__NP_simpleHash       = simpleHash;
}

// Tracks plan ids authored by THIS device in the last ~10s.
// Used by the realtime ws.onmessage echo guard to drop the bounce of our own
// upserts. Populated by PDB._savePlans, drained automatically via setTimeout.
const __NP_AUTHORED_IDS = new Set();
if (typeof window !== "undefined") { window.__NP_AUTHORED_IDS = __NP_AUTHORED_IDS; }


// ═══════════════════════════════════════════════════════════════════════════
// ADSENSE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════
// Publisher ID — single source of truth
const AD_CLIENT = "ca-pub-3289752970133191";

// ── Bootstrap AdSense script once per page load ───────────────────────────
// We inject the <script> tag into <head> ourselves so this works whether the
// app is embedded in index.html or rendered standalone. Guard prevents double
// injection on React StrictMode double-mount.
function _loadAdSense() {
  if (typeof document === "undefined") return;
  const existing = document.querySelector('script[src*="adsbygoogle"]');
  if (existing) return; // already injected (or present in index.html)
  const s = document.createElement("script");
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + AD_CLIENT;
  s.async = true;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}

// ── <AdBanner> — production-grade ad unit ────────────────────────────────
// Props:
//   slot        {string}  AdSense ad slot ID (from AdSense dashboard)
//   format      {string}  "auto" | "rectangle" | "horizontal"  (default "auto")
//   responsive  {boolean} whether to use data-full-width-responsive (default true)
//   style       {object}  extra wrapper style overrides
//
// Design principles:
//   • One <ins> per component instance — never re-pushed after mount
//   • Stable min-height placeholder → zero CLS (Cumulative Layout Shift)
//   • IntersectionObserver lazy-load → push only when visible
//   • Cleanup on unmount → no orphaned <ins> or listeners
//   • Memoised — won't re-render on parent updates
const AdBanner = memo(function AdBanner({
  slot,
  format      = "auto",
  responsive  = true,
  style       = {},
}) {
  const insRef   = useRef(null);
  const pushed   = useRef(false);   // guard: push() called at most once per mount
  const obsRef   = useRef(null);    // IntersectionObserver reference

  useEffect(() => {
    // Ensure the AdSense script is in the page
    _loadAdSense();

    const ins = insRef.current;
    if (!ins || pushed.current) return;

    // Lazy-push: only call adsbygoogle.push() when the banner enters the
    // viewport (avoids pushing ads for off-screen placements that were never
    // seen, which wastes impressions and slows initial load).
    const pushAd = () => {
      if (pushed.current) return;
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Swallow "All 'ins' elements already have ads" — harmless in SPA
        if (!e.message?.includes("already")) {
          console.warn("[AdBanner] adsbygoogle.push error:", e.message);
        }
      }
    };

    // IntersectionObserver — push when ≥50% visible
    if (typeof IntersectionObserver !== "undefined") {
      obsRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            pushAd();
            obsRef.current?.disconnect();
          }
        },
        { threshold: 0.5 }
      );
      obsRef.current.observe(ins);
    } else {
      // Fallback for environments without IntersectionObserver (SSR, old browsers)
      pushAd();
    }

    return () => {
      // Cleanup: disconnect observer; pushed.current stays true so re-mount
      // (StrictMode) doesn't double-push the same <ins>
      obsRef.current?.disconnect();
    };
  }, []);

  // Minimal-height placeholder eliminates CLS.
  // Heights match typical AdSense unit sizes for each format.
  const minH = format === "horizontal"  ? 90  :
               format === "rectangle"   ? 250 : 100;

  return (
    <div
      style={{
        display:    "block",
        textAlign:  "center",
        overflow:   "hidden",
        minHeight:  minH,
        background: "transparent",
        ...style,
      }}
      aria-hidden="true"
      role="presentation"
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(responsive ? { "data-full-width-responsive": "true" } : {})}
      />
    </div>
  );
});

// ── Placement constants ───────────────────────────────────────────────────
// Replace slot IDs with real ones from your AdSense dashboard.
// Using "0000000000" as a safe placeholder — AdSense ignores invalid slots
// gracefully (renders blank, no errors in production).
const AD_SLOTS = {
  planFooter:       "9418362030",  // below user plan content (plan tab)
  progressFooter:   "6346081374",  // below progress section
  numerosFooter:    "2545831920",  // below numbers/macros section (footer)
  nutriDashboard:   "5612795652",  // nutritionist clients list bottom
};

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
const NUTIPLAN_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAYAAAB/HSuDAAEAAElEQVR4nOz9ebQkaXrf933f942IzLxb7Wt3VVdXdfU63T3Tg5nBEAAXgAsoErRBiZsPYR/bMikJlmkdwvAxD0VSomWamw3pUNShbcomKVkUj8nDBSQIiRQFEhsxM5ilp2d6md73rura7pYZEe/7+I83IjPvrVu9VFX37er7+zRibt28mRGRkYmT+Tzv8z4viIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiI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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP6/8f8CwBpdtbjZc50AAAAASUVORK5CYII=";

// Emoji-safe font stacks — explicit emoji families ensure Unicode emoji glyphs
// are not shadowed by the loaded DM Sans web font on Windows / older Android.
const EMOJI_FONTS = ",'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji'";
const SANS_EMOJI  = "'DM Sans',system-ui,sans-serif" + EMOJI_FONTS;
const SERIF_EMOJI = "'Playfair Display',Georgia,serif" + EMOJI_FONTS;

// ═══════════════════════════════════════════════════════════════════════════
// COPY SYSTEM — tono cercano, sin juicio, práctico
// Uso: COPY.onboarding.welcome  |  COPY.plan.dayOff[0]
// Para añadir textos: añade solo aquí. Nunca en el JSX directamente.
// ═══════════════════════════════════════════════════════════════════════════
const COPY = {
  brand: {
    tagline:    "Come bien. Sin complicarte.",
    taglineSub: "Tu plan de la semana, listo en segundos.",
  },
  nuti: {
    // Mensajes de Nuti — guía amable del asistente
    greet:    "Hola, soy Nuti. Estoy aquí para hacértelo fácil.",
    onboard:  "Vamos a hacerlo fácil esta semana.",
    planReady:"Tu plan está listo. Sin pensar, solo cocinar.",
    dayOff:   "Un día flojo. Seguimos mañana.",
    goodDay:  "Hoy bien. Así se hace.",
    lowEnergy:"Hoy fácil. Sin pensar.",
    variety:  "Esta semana, un poco de todo. Te va a gustar.",
    streak:   "Llevas una racha. No la rompas.",
    monday:   "Lunes. Empezamos de cero, sin dramas.",
    friday:   "Casi fin de semana. Un empujón más.",
  },
  onboarding: {
    welcome:    "Cuéntanos un poco sobre ti.",
    step0:      "Datos básicos — rápido, lo prometo.",
    step1:      "¿Cuánto te mueves al día?",
    step2:      "¿Qué quieres conseguir?",
    step3:      "¿Cuántas veces comes al día?",
    step4:      "Preferencias y hábitos.",
    step5:      "¿Hay algo que no puedas o no quieras comer?",
    dobLabel:   "¿Cuándo naciste?",
    dobHint:    "Lo usamos solo para calcular tus calorías.",
    next:       "Siguiente →",
    back:       "← Atrás",
    generate:   "Generar mi plan →",
    generating: "Preparando tu plan…",
  },
  plan: {
    empty:      "Sin plan esta semana. Vamos a generarlo.",
    dayOff:     ["Un día flojo. Seguimos.", "Hoy fácil. Sin pensar.", "No pasa nada. Mañana más."],
    locked:     "Plan de tu nutricionista. Habla con él si quieres cambiarlo.",
    regenerate: "¿Regenerar el plan?",
    shared:     "Plan de tu amigo, adaptado a tus macros.",
    copied:     "¡Plan adoptado! Las raciones son las tuyas.",
  },
  auth: {
    login:          "Bienvenido de nuevo.",
    register:       "Empieza hoy. Gratis.",
    forgotPassword: "¿Olvidaste tu contraseña?",
    resetSent:      "📬 Revisa tu bandeja. El link caduca en 1 hora.",
    errorGeneric:   "Algo falló. Inténtalo de nuevo.",
    errorOffline:   "Sin conexión. Verifica tu internet.",
    errorCredentials: "Email o contraseña incorrectos.",
  },
  friend: {
    title:      "Plan con amigo",
    subtitle:   "Mismos platos. Tus raciones.",
    shareHint:  "Tu amigo recibe exactamente tu menú, con sus macros.",
    redeemHint: "Introduce el código de 6 letras de tu amigo.",
    success:    "¡Plan adoptado! Las raciones se han adaptado a tus macros.",
    errorExpired: "Código caducado o ya usado.",
    loading:    "Descargando el plan de tu amigo…",
  },
  errors: {
    generic:    "Algo salió mal. Inténtalo de nuevo.",
    noplan:     "Genera un plan primero.",
    timeout:    "Tardó demasiado. Verifica tu conexión.",
  },
};

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
function NutiMessage({ message, variant="tip", compact=false, style:extraStyle={} }) {
  const sans = SANS_EMOJI;
  const variants = {
    tip:     { bg:"#e8a04512", border:"#e8a04533", icon:"💡", color:THEME.accent },
    success: { bg:"#16a34a12", border:"#16a34a33", icon:"✅", color:THEME.colorSuccess },
    info:    { bg:"#0369a112", border:"#0369a133", icon:"ℹ️", color:THEME.colorInfo },
    nudge:   { bg:"#7c3aed12", border:"#7c3aed33", icon:"⚡", color:THEME.colorPurpleLight },
  };
  const v = variants[variant] || variants.tip;

  if (compact) {
    return (
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:8,background:v.bg,border:"1px solid "+v.border,fontFamily:sans,...extraStyle}}>
        <span style={{fontSize:14,flexShrink:0}}>{v.icon}</span>
        <span style={{fontSize:12,color:v.color,lineHeight:1.4}}>{message}</span>
      </div>
    );
  }

  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",borderRadius:12,background:v.bg,border:"1px solid "+v.border,fontFamily:sans,...extraStyle}}>
      {/* Avatar Nuti */}
      <div style={{width:32,height:32,borderRadius:"50%",background:v.color+"22",border:"1.5px solid "+v.color+"55",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>
        <img
            src={NUTIPLAN_LOGO}
            alt="Nuti"
            style={{
              display:"block",
              width:"auto",
              height:22,
              maxHeight:22,
              objectFit:"contain",
              background:"transparent",
              borderRadius:"50%",
            }}
            onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentElement.textContent="🥗";}}
          />
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,color:v.color,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Nuti</div>
        <div style={{fontSize:13,color:THEME.textPrimary,lineHeight:1.5}}>{message}</div>
      </div>
    </div>
  );
}

// ─── STORAGE ──────────────────────────────────────────
// FIX: module-scoped uid — safe from window pollution and cross-component races.
// All legacy SK/MK/PK key functions read this; PDB methods accept uid explicitly.
//
// FIX (stability P0 visibility): we keep the module-scoped variable because
// moving it to Context is invasive (touches ~30 call sites) and is deferred
// until stability is validated. But we add a dev-mode guard that logs when
// _setUid is invoked with a NEW non-anon uid while another non-anon uid is
// already active — that pattern indicates an unintended cross-user race
// (e.g. two tabs racing). In production this is a no-op (no console noise).
let _nutri_uid = "anon";
function __uid()        { return _nutri_uid; }
function _setUid(id)    {
  const next = (typeof id === "string" && id) ? id : "anon";
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV !== "production" &&
    _nutri_uid !== "anon" && next !== "anon" && _nutri_uid !== next
  ) {
    // Visible in dev only. Not a hard error — there are legitimate flows
    // (account switching in same tab) — but worth a glance.
    console.warn("[NutiPlan] _setUid transition without intermediate clearSession:", _nutri_uid, "→", next);
  }
  _nutri_uid = next;
}
function SK(){return "nutri_v2_"+__uid();}

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
// ── CROSS-WEEK MEMORY ─────────────────────────────────────────────────────
// Stores last 4 weeks of lunch protein sequences to avoid inter-week repetition.
// Format: {week: [{L:"pollo",D:"pavo"}, ...x7]}
function MK(){return "nutri_meal_memory_"+__uid();}
function loadMealMemory() {
  // FIX 12: safe parse
  const d = PDB._g(MK());
  return Array.isArray(d) ? d : [];
}
function saveMealMemory(weekNum, lunchProteins, dinnerProteins) {
  var mem = loadMealMemory();
  mem = mem.filter(function(m){ return m.week !== weekNum; }).slice(-3);
  mem.push({week:weekNum, L:lunchProteins, D:dinnerProteins});
  PDB._s(MK(), mem);
  // FIX D: mirror to dedicated meal_memory table
  if (__uid() !== "anon") {
    const uid = __uid();
    const prog = loadProgress();
    SyncEngine.push(() =>
      SDB.upsertMealMemory(uid, weekNum, lunchProteins, dinnerProteins, {
        foodLikes:    prog.foodLikes    || {},
        foodDislikes: prog.foodDislikes || {},
        failPatterns: prog.failPatterns || [],
      })
    );
  }
}
// Returns a combined "past proteins" array from previous weeks (for penalty scoring)
function getPastProteinFrequency() {
  try {
    var mem = loadMealMemory();
    var freq = {};
    mem.forEach(function(week, wi) {
      var weight = wi + 1; // more recent weeks weight more
      (week.L||[]).concat(week.D||[]).forEach(function(p) {
        freq[p] = (freq[p]||0) + weight;
      });
    });
    return freq;
  } catch(e) { return {}; }
}

function saveData(profile, plan, weekNum, extras) {
  const __t0 = __PERF.mark();  // PERF
  if (profile) PDB._s("pf_profile_"+__uid(), {...profile, updatedAt:Date.now()});
  PDB._s(SK(), {profile, plan, weekNum, extras});
  if (profile && __uid() !== "anon") {
    const uid = __uid();
    // FIX D: mirror to dedicated preferences table (structured columns)
    SyncEngine.push(() => SDB.upsertPreferences(uid, profile));
    // Keep user_data as a fast-read backup blob
    SyncEngine.push(() => SDB.setUserData(uid, "profile", {...profile, updatedAt:Date.now()}));
  }
  __PERF.measure("saveData", __t0);  // PERF
}
function loadData() {
  // FIX 12: use PDB._g for safe parse + corruption quarantine
  const d = PDB._g(SK());
  if (!d || typeof d !== "object") return {profile:null, plan:null, weekNum:null, extras:{}};
  return {
    profile: d.profile  || null,
    plan:    d.plan     || null,
    weekNum: d.weekNum  || null,
    extras:  d.extras   || {},
  };
}
function clearData() {
  try { localStorage.removeItem(SK()); localStorage.removeItem(PK()); } catch(e) {}
}

// ── PROGRESS TRACKING ────────────────────────────────────────────────────────
function PK(){return "nutri_progress_"+__uid();}
function loadProgress() {
  // FIX 12: safe parse via PDB._g
  const d = PDB._g(PK());
  if (!d || typeof d !== "object") return {weeks:[], foodLikes:{}, foodDislikes:{}, failPatterns:[]};
  return {
    weeks:       Array.isArray(d.weeks)       ? d.weeks       : [],
    foodLikes:   d.foodLikes   && typeof d.foodLikes   === "object" ? d.foodLikes   : {},
    foodDislikes:d.foodDislikes&& typeof d.foodDislikes=== "object" ? d.foodDislikes: {},
    failPatterns:Array.isArray(d.failPatterns)? d.failPatterns: [],
  };
}
function saveProgress(prog) {
  PDB._s(PK(), prog);
  // FIX D: mirror progress to dedicated `progress` table (not generic user_data)
  if (__uid() !== "anon") {
    const uid = __uid();
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
function addWeekProgress(weekNum, {peso, pesoInicial, adherencia, energia, hambre}) {
  var prog = loadProgress();
  // Remove existing entry for this week
  prog.weeks = (prog.weeks||[]).filter(function(w){return w.week !== weekNum;});
  prog.weeks.push({week:weekNum, peso, pesoInicial, adherencia, energia, hambre, ts:Date.now()});
  // Keep only last 12 weeks
  prog.weeks = prog.weeks.slice(-12);
  saveProgress(prog);
  return prog;
}
// Compute trend: kg lost/gained relative to first weigh-in
function computeTrend(weeks) {
  if(!weeks || weeks.length < 2) return null;
  var withPeso = weeks.filter(function(w){return w.peso && w.pesoInicial;});
  if(withPeso.length < 1) return null;
  var last = withPeso[withPeso.length-1];
  var first = withPeso[0];
  var diff = (last.peso - first.pesoInicial);
  return {diff: Math.round(diff*10)/10, weeks: withPeso.length};
}
// Nutricionista feedback based on last check-in
function getNutricionistaFeedback(progress, goal, checkinData) {
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
function adherenciaPct(n) { return Math.round((n||3)/5*100); }


// ─── CALCULATIONS ──────────────────────────────────────────────────────────
const ACT_MULT  = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, veryActive:1.9 };
const GOAL_ADJ  = { fatLoss:-500, mildFatLoss:-250, fatLossGeneral:-350, maintain:0, mildGain:250, muscleGain:400 };
function calcTDEE(gender,age,weight,height,activity) {
  const bmr = gender==="male"
    ? 10*weight+6.25*height-5*age+5
    : 10*weight+6.25*height-5*age-161;
  return Math.round(bmr*(ACT_MULT[activity]||1.55));
}
function calcTarget(tdee, goal, kcalAdjust) {
  var adj = kcalAdjust || 0;
  return Math.max(1200, tdee + (GOAL_ADJ[goal]||0) + adj);
}

// ── DOB Helper — compatible con el campo age existente ────────────────────
/**
 * Calcula la edad en años enteros a partir de una fecha de nacimiento.
 * @param {string} dob  — "YYYY-MM-DD"
 * @returns {number}    — edad en años (0 si la fecha es inválida)
 */
function getAgeFromDOB(dob) {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

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
function DOBPicker({ dob="", onChange, accentColor=THEME.accent, textColor=THEME.textPrimary, mutedColor=THEME.textMuted, borderColor=THEME.borderDark, bgColor=THEME.bgCard2 }) {
  const sans = SANS_EMOJI;
  const age  = getAgeFromDOB(dob);

  // Rango válido: 10–100 años atrás
  const maxDate = (() => { const d=new Date(); d.setFullYear(d.getFullYear()-10); return d.toISOString().split("T")[0]; })();
  const minDate = (() => { const d=new Date(); d.setFullYear(d.getFullYear()-100); return d.toISOString().split("T")[0]; })();

  const handleChange = (e) => {
    const val = e.target.value; // "YYYY-MM-DD"
    const computed = getAgeFromDOB(val);
    onChange(val, computed);
  };

  return (
    <div>
      <div style={{fontSize:10, color:mutedColor, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, fontFamily:sans}}>
        ¿Cuándo naciste?
      </div>
      <div style={{position:"relative"}}>
        {/* BUG FIX (mobile visual): we used to render <input type="date"> with
            appearance:none + colorScheme:dark. On iOS Safari that combination
            produces a tiny illegible widget — placeholder text is invisible,
            the calendar icon shrinks, and the user sees "a small box".
            Fix: drop appearance:none (let iOS render its native control),
            keep colorScheme:dark (aligns native picker to our theme), and
            make sure text color is always readable (not muted when empty).
            For empty state we show a visible label *above* the field instead
            of relying on the native placeholder, which iOS often hides. */}
        <input
          type="date"
          value={dob}
          min={minDate}
          max={maxDate}
          onChange={handleChange}
          style={{
            width:"100%", boxSizing:"border-box",
            // Step 7: paddingRight mayor cuando el badge de edad está visible
            // para que el texto del input no se solape con "XX años".
            padding:"14px " + (dob && age >= 10 && age <= 100 ? "68px" : "14px") + " 14px 14px",
            // Larger min height so iOS/Android render the wheel/calendar icon
            // at a usable size and the typed value never gets clipped.
            minHeight: 48,
            borderRadius:10,
            border:"1.5px solid "+(dob ? accentColor : borderColor),
            background:bgColor,
            // Always use textColor (not mutedColor). Even when empty, the
            // native day/month/year hint should be legible. On Android Chrome
            // the placeholder inherits this color directly.
            color: textColor,
            fontFamily:sans, fontSize:16, fontWeight:600,
            outline:"none",
            // Critical: colorScheme dark aligns the native control with our
            // theme on iOS 14+ and recent Android. DO NOT add appearance:none
            // here — it breaks the native picker rendering on iOS Safari.
            colorScheme:"dark",
          }}
        />
        {/* Badge de edad calculada — feedback inmediato al usuario */}
        {dob && age >= 10 && (
          <div style={{
            position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            background:accentColor+"22", border:"1px solid "+accentColor+"55",
            borderRadius:6, padding:"2px 8px",
            fontSize:12, fontWeight:700, color:accentColor, fontFamily:sans,
            pointerEvents:"none",
          }}>
            {age} años
          </div>
        )}
      </div>
      {/* Mensaje de error si la edad calculada está fuera del rango aceptable */}
      {dob && (age < 10 || age > 100) && (
        <div style={{fontSize:11, color:THEME.colorError, marginTop:5, fontFamily:sans}}>
          Introduce una fecha de nacimiento válida (10–100 años).
        </div>
      )}
    </div>
  );
}
// Protein g/kg by activity × goal: sedentary base, force/bulk bonus
const PROTEIN_FACTOR = {
  sedentary:  {fatLoss:1.6, mildFatLoss:1.6, fatLossGeneral:1.5, maintain:1.6, mildGain:1.8, muscleGain:2.0},
  light:      {fatLoss:1.8, mildFatLoss:1.7, fatLossGeneral:1.6, maintain:1.7, mildGain:1.9, muscleGain:2.1},
  moderate:   {fatLoss:2.0, mildFatLoss:1.8, fatLossGeneral:1.7, maintain:1.8, mildGain:2.1, muscleGain:2.2},
  active:     {fatLoss:2.1, mildFatLoss:2.0, fatLossGeneral:1.8, maintain:1.9, mildGain:2.2, muscleGain:2.4},
  veryActive: {fatLoss:2.2, mildFatLoss:2.1, fatLossGeneral:1.9, maintain:2.0, mildGain:2.3, muscleGain:2.5},
};
// Fat: minimum 0.8g/kg, strategy-tuned ceiling
const FAT_FACTOR = {
  definicion_saciante:      {min:0.8, pct:0.22},
  definicion_flexible:      {min:0.8, pct:0.25},
  fat_loss_general:         {min:0.8, pct:0.28},
  mantenimiento_equilibrado:{min:0.9, pct:0.28},
  volumen_limpio:           {min:1.0, pct:0.28},
  volumen_agresivo:         {min:1.1, pct:0.32},
};
function calcMacros(kcal, weight, goal, activity, strategy) {
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

// ─── STRATEGY ENGINE ───────────────────────────────────────────────────────
// Maps profile → nutritional strategy → influences meal selection & tips
const STRATEGIES = {
  fat_loss_general: {
    label:"Pérdida de peso real",
    icon:"🥗",
    color:THEME.colorOrange,
    desc:"Déficit moderado, máxima adherencia. Comidas reales y familiares, sin perfeccionismo.",
    tip:"Una comida libre a la semana está integrada en el plan. No la saltes — es parte de la estrategia."
  },
  definicion_saciante: {
    label:"Definición saciante",
    icon:"🥦",
    color:THEME.colorSuccessDark,
    desc:"Volumen alto, densidad baja. Verduras en cada comida, proteína magra, sin hambre.",
    tip:"Prioriza cremas, sopas y ensaladas grandes en la cena para saciarte sin excederte."
  },
  definicion_flexible: {
    label:"Definición flexible",
    icon:"⚖️",
    color:"#2563eb",
    desc:"Déficit moderado con variedad. Equilibrio entre saciedad y practicidad.",
    tip:"Usa sustituciones inteligentes si un día no tienes tiempo. Lo importante es la constancia."
  },
  mantenimiento_equilibrado: {
    label:"Mantenimiento equilibrado",
    icon:"🎯",
    color:THEME.colorPurple,
    desc:"Calorías de mantenimiento con macros optimizados. Sostenible a largo plazo.",
    tip:"Una vez a la semana puedes comer libre sin remordimientos — estás en mantenimiento."
  },
  volumen_limpio: {
    label:"Volumen limpio",
    icon:"💪",
    color:THEME.colorWarningDark,
    desc:"Superávit moderado con proteína alta. Ganas músculo minimizando grasa.",
    tip:"Asegura el hidrato post-entreno. La ventana anabólica importa más en volumen."
  },
  volumen_agresivo: {
    label:"Volumen agresivo",
    icon:"🔥",
    color:THEME.colorErrorDark,
    desc:"Superávit alto, proteína máxima. Para ganar masa muscular rápido.",
    tip:"Aumenta el tamaño de las raciones de arroz y pasta. Tu objetivo es superar el TDEE cada día."
  }
};

function computeStrategy(profile) {
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
function getMealRules(strategy) {
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

// Check-in → calorie delta + macro hint + strategy override + simpleMode
function computeCheckinAdjustment(checkin, goal) {
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

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const ACTIVITIES=[
  {key:"sedentary",icon:"🪑",label:"Sedentario",   desc:"Sin ejercicio, trabajo de oficina"},
  {key:"light",    icon:"🚶",label:"Ligero",        desc:"1–2 días/semana de ejercicio"},
  {key:"moderate", icon:"🏋️",label:"Moderado",      desc:"3–4 días/semana de ejercicio"},
  {key:"active",   icon:"⚡",label:"Activo",         desc:"5–6 días/semana, entrenos intensos"},
  {key:"veryActive",icon:"🔥",label:"Muy activo",   desc:"Doble sesión o trabajo físico"},
];
const GOALS=[
  {key:"fatLossGeneral",icon:"🥗",label:"Adelgazar de verdad", desc:"Pérdida sostenible — sin obsesión, sin abandono",color:"#CDD48A"},
  {key:"fatLoss",       icon:"🔻",label:"Definición",          desc:"Perder grasa — déficit 500 kcal",               color:"#737520"},
  {key:"mildFatLoss",   icon:"📉",label:"Definición suave",    desc:"Déficit 250 kcal",                              color:"#8a8c28"},
  {key:"maintain",      icon:"⚖️",label:"Mantenimiento",       desc:"Mantener peso y composición",                   color:"#4A4E10"},
  {key:"mildGain",      icon:"📈",label:"Volumen suave",       desc:"+250 kcal",                                    color:"#2D5488"},
  {key:"muscleGain",    icon:"💪",label:"Volumen",             desc:"Ganar músculo — superávit 400 kcal",            color:"#1F3A5F"},
];
const INTOLERANCES=[
  {key:"lactosa",      emoji:"🥛",label:"Lactosa"},
  {key:"gluten",       emoji:"🌾",label:"Gluten"},
  {key:"huevo",        emoji:"🥚",label:"Huevo"},
  {key:"frutos_secos", emoji:"🥜",label:"Frutos secos"},
  {key:"mariscos",     emoji:"🦐",label:"Mariscos"},
  {key:"pescado",      emoji:"🐟",label:"Pescado"},
  {key:"soja",         emoji:"🌱",label:"Soja"},
  {key:"cerdo",        emoji:"🐷",label:"Cerdo"},
  {key:"legumbres",    emoji:"🫘",label:"Legumbres"},
  {key:"picante",      emoji:"🌶️",label:"Picante"},
];
const DAYS_ES   =["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const DAYS_SHORT=["L","M","X","J","V","S","D"];
const ACT_LABELS ={sedentary:"Sedentario",light:"Ligero",moderate:"Moderado",active:"Activo",veryActive:"Muy activo"};
const GOAL_LABELS={fatLossGeneral:"Adelgazar de verdad",fatLoss:"Definición",mildFatLoss:"Definición suave",maintain:"Mantenimiento",mildGain:"Volumen suave",muscleGain:"Volumen"};
const GOAL_COLORS = {
  muscleGain:     { primary: "#1F3A5F", light: "#E6EFF7", border: "#2D5488" },
  mildGain:       { primary: "#2D5488", light: "#E6EFF7", border: "#8db8e0" },

  maintain:       { primary: "#4A4E10", light: "#EFF2DA", border: "#737520" },

  fatLoss:        { primary: "#737520", light: "#EFF2DA", border: "#CDD48A" },
  mildFatLoss:    { primary: "#8a8c28", light: "#EFF2DA", border: "#CDD48A" },
  fatLossGeneral: { primary: "#CDD48A", light: "#EFF2DA", border: "#e8efc0" },
};


// ────────────────────────────────────────────────────────────────
// validateFreeFormCombo (v3.1)
// ────────────────────────────────────────────────────────────────
//
// Validador estructural de combos freeForm.
// Se ejecuta SOLO en fase de carga.
//
// Devuelve:
// { valid:boolean, errors:[], warnings:[] }
//
// NO lanza excepciones.
// NO muta input.
//
function validateFreeFormCombo(combo, opts) {
  opts = opts || {};
  var strict = opts.strict === true;

  var errors = [];
  var warnings = [];

  function block(code, msg) { errors.push({ code: code, msg: msg }); }
  function warn(code, msg)  { warnings.push({ code: code, msg: msg }); }

  // ── ROOT ───────────────────────────────────────────────
  if (!combo || typeof combo !== "object") {
    block("E_ROOT_NOT_OBJECT", "combo no es objeto válido");
  }
  else if (combo.freeForm !== true) {
    block("E_NOT_FREEFORM", "combo.freeForm debe ser true");
  }
  else {

    // ── IDENTITY ─────────────────────────────────────────
    var id = combo.identity;

    if (!id || typeof id !== "object") {
      block("E_IDENTITY_MISSING", "identity ausente o inválido");
    } else {
      if (!id.id || typeof id.id !== "string") {
        block("E_IDENTITY_ID", "identity.id inválido");
      }
      if (!id.title || typeof id.title !== "string") {
        block("E_IDENTITY_TITLE", "identity.title inválido");
      }
      if (!id.protein || typeof id.protein !== "string") {
        block("E_IDENTITY_PROTEIN", "identity.protein inválido");
      }
      if (!id.proteinType || typeof id.proteinType !== "string") {
        warn("W_IDENTITY_PROTEINTYPE", "proteinType recomendado");
      }
      if (!id.plateType || typeof id.plateType !== "string") {
        warn("W_IDENTITY_PLATETYPE", "plateType recomendado");
      }
      if (!Array.isArray(id.tags)) {
        warn("W_IDENTITY_TAGS", "tags debería ser array");
      }
    }

    // ── NUTRITION ────────────────────────────────────────
    var n = combo.nutrition;

    if (!n || typeof n !== "object") {
      block("E_NUTRITION_MISSING", "nutrition ausente");
    } else {
      var keys = ["baseKcal","baseP","baseF","baseC"];

      for (var ni = 0; ni < keys.length; ni++) {
        var k = keys[ni];
        if (typeof n[k] !== "number" || n[k] < 0 || !isFinite(n[k])) {
          block("E_NUTRITION_" + k.toUpperCase(), k + " inválido");
        }
      }

      if (n.energyDensity &&
          ["low","medium","high"].indexOf(n.energyDensity) < 0) {
        block("E_NUTRITION_ENERGYDENSITY", "energyDensity inválida");
      }
    }

    // ── SCALING ──────────────────────────────────────────
    var s = combo.scaling;

    if (!s || typeof s !== "object") {
      block("E_SCALING_MISSING", "scaling ausente");
    } else {
      if (!s.primario || typeof s.primario !== "string") {
        block("E_SCALING_PRIMARIO", "primario requerido");
      }

      if (s.secundario && typeof s.secundario !== "string") {
        block("E_SCALING_SECUNDARIO", "secundario inválido");
      }

      if (s.noEscalar && !Array.isArray(s.noEscalar)) {
        block("E_SCALING_NOESCALAR", "noEscalar debe ser array");
      }

      if (typeof s.minScaleFactor === "number" &&
          typeof s.maxScaleFactor === "number" &&
          s.minScaleFactor >= s.maxScaleFactor) {
        block("E_SCALING_FACTORS", "minScaleFactor < maxScaleFactor requerido");
      }
    }

    // ── BEHAVIOR ─────────────────────────────────────────
    var b = combo.behavior;

    if (!b || typeof b !== "object") {
      block("E_BEHAVIOR_MISSING", "behavior ausente");
    } else {

      if (!Array.isArray(b.slot) || b.slot.length === 0) {
        block("E_BEHAVIOR_SLOT", "slot debe ser array no vacío");
      } else {
        var validSlots = ["C","Ce","Al"];

        for (var si = 0; si < b.slot.length; si++) {
          if (validSlots.indexOf(b.slot[si]) < 0) {
            block("E_BEHAVIOR_SLOT_VAL",
              "slot inválido: " + b.slot[si]);
          }
        }
      }

      if (["diario","semanal","ocasional"]
          .indexOf(b.frecuencia) < 0) {
        block("E_BEHAVIOR_FREC", "frecuencia inválida");
      }

      if (typeof b.satietyScore !== "number" ||
          b.satietyScore < 1 || b.satietyScore > 5) {
        block("E_BEHAVIOR_SATIETY", "satietyScore 1-5 requerido");
      }

      if (["low","medium","high"]
          .indexOf(b.digestiveLoad) < 0) {
        block("E_BEHAVIOR_DIGEST", "digestiveLoad inválido");
      }

      if (b.trainingProfile &&
          typeof b.trainingProfile !== "object") {
        block("E_BEHAVIOR_TRAINING", "trainingProfile inválido");
      }

      if (typeof b.lightMealCompatible !== "undefined" &&
          typeof b.lightMealCompatible !== "boolean") {
        warn("W_BEHAVIOR_LIGHT", "lightMealCompatible debería ser boolean");
      }

      if (typeof b.avoidInAggressiveCut !== "undefined" &&
          typeof b.avoidInAggressiveCut !== "boolean") {
        warn("W_BEHAVIOR_AVOID", "avoidInAggressiveCut debería ser boolean");
      }
    }

    // ── CONTENT ──────────────────────────────────────────
    var c = combo.content;

    if (!c || typeof c !== "object") {
      block("E_CONTENT_MISSING", "content ausente");
    } else {
      if (!c.p1 || typeof c.p1 !== "string") {
        block("E_CONTENT_P1", "p1 requerido");
      }

      if (!Array.isArray(c.shopping) || c.shopping.length === 0) {
        block("E_CONTENT_SHOPPING", "shopping inválido");
      }

      if (!Array.isArray(c.recipe) || c.recipe.length === 0) {
        block("E_CONTENT_RECIPE", "recipe inválido");
      }
    }
  }

  // ── RESULTADO FINAL ───────────────────────────────────
  var valid = errors.length === 0;

  if (strict) {
    var label = (combo && combo.identity && combo.identity.id) || "<no-id>";
    if (errors.length) console.warn("[validateFreeFormCombo] BLOCK", label, errors);
    if (warnings.length) console.warn("[validateFreeFormCombo] WARN", label, warnings);
  }

  return {
    valid: valid,
    errors: errors,
    warnings: warnings
  };
}


// ────────────────────────────────────────────────────────────────
// validateFreeFormPool
// ────────────────────────────────────────────────────────────────
function validateFreeFormPool(combos, opts) {
  opts = opts || {};

  var validCombos = [];
  var invalidCombos = [];

  var totalErrors = 0;
  var totalWarnings = 0;

  if (!Array.isArray(combos)) {
    return {
      validCombos: [],
      invalidCombos: [],
      summary: { total: 0, valid: 0, invalid: 0 }
    };
  }

  for (var i = 0; i < combos.length; i++) {
    var res = validateFreeFormCombo(combos[i], opts);

    totalErrors += res.errors.length;
    totalWarnings += res.warnings.length;

    if (res.valid) {
      validCombos.push(combos[i]);
    } else {
      invalidCombos.push({
        combo: combos[i],
        errors: res.errors,
        warnings: res.warnings
      });
    }
  }

  var summary = {
    total: combos.length,
    valid: validCombos.length,
    invalid: invalidCombos.length,
    totalErrors: totalErrors,
    totalWarnings: totalWarnings
  };

  if (opts.strict) {
    console.warn("[validateFreeFormPool] summary", summary);
  }

  return {
    validCombos: validCombos,
    invalidCombos: invalidCombos,
    summary: summary
  };
}


var FREEFORM_POOL_RESULT = loadFreeFormCombos(
  FREEFORM_COMBOS,
  validateFreeFormPool,
  { strict: true, healthRatioMin: 0.8 }
);

var FREEFORM_POOL = FREEFORM_POOL_RESULT.pool;


// ─── PLAN BUILDER ──────────────────────────────────────────────────────────
function buildPlan(profile,targetKcal) {
  // Ensure extras.proteinShake exists — safe for old profiles without it.
  profile.extras = profile.extras || {};
  profile.extras.proteinShake = profile.extras.proteinShake || {
    enabled:false, scoops:1, kcalPerScoop:120, proteinPerScoop:24, timing:"post_entreno"
  };
  // FASE 1 — baseScale encodes user structural size only; independent of shake.
  const strategy  =computeStrategy(profile);
  const rules     =getMealRules(strategy);
  const baseScale =Math.min(Math.max(targetKcal/1600,0.88),1.58);

  // FASE 2 — shakeFactor: proportional calibration layer, separate from baseScale.
  const _shk          = profile.extras.proteinShake;
  const shakeEnabled  = !!_shk.enabled;
  const shakeProtein  = shakeEnabled ? _shk.scoops * _shk.proteinPerScoop : 0;
  const shakeKcal     = shakeEnabled ? _shk.scoops * _shk.kcalPerScoop    : 0;
  const targetProtein = calcMacros(targetKcal,profile.weight,profile.goal,profile.activity,strategy).protein;
  const proteinCoverage = shakeEnabled ? shakeProtein / Math.max(targetProtein,80) : 0;
  const energyCoverage  = shakeEnabled ? shakeKcal    / targetKcal                 : 0;
  const shakeFactor     = 1-(proteinCoverage*0.75+energyCoverage*0.25);

  // FASE 3 — per-category calibration ratios.
  // Protein reduced most; carbs lightly; fat minimally; veggies untouched.
  const categoryFactor=(type)=>{
    switch(type){
      case "p": return shakeFactor;
      case "c": return 1-((1-shakeFactor)*0.45);
      case "f": return 1-((1-shakeFactor)*0.20);
      case "v": return 1.0;
      default:  return 1.0;
    }
  };

  // FASE 4 — r() applies baseScale + strategy mult + shake calibration per category.
  // type: "p"=protein, "c"=carb, "f"=fat, "v"=veggie, default=neutral
  const r=(base,step=5,type)=>{
    var mult=1;
    if(type==="p") mult=rules.proteinMult;
    else if(type==="c") mult=rules.carbMult;
    else if(type==="f") mult=rules.fatMult;
    else if(type==="v") mult=rules.veggieMult;
    return Math.round(base*baseScale*mult*categoryFactor(type)/step)*step;
  };
  const {intolerances:intol,trainingDays}=profile;
  const noFish    =intol.includes("pescado");
  const noPork    =intol.includes("cerdo");
  const noEgg     =intol.includes("huevo");
  const noNuts    =intol.includes("frutos_secos");
  const noLegumes =intol.includes("legumbres");
  const noGluten  =intol.includes("gluten");
  const noMariscos=intol.includes("mariscos");
  const noLactosa =intol.includes("lactosa");
  const isTrain   =(d)=>trainingDays.includes(d);
  // Soft preference: prefer seasonal vegetables for the current month (Spain).
  // Applied in smartPick as a scoring bonus — lower priority than intolerances,
  // which hard-filter combos out of the pool before scoring begins.
  const currentSeasonalVegs = SEASONAL_FOODS[new Date().getMonth()] || [];
  // Typed portion helpers — strategy multipliers applied here
  const rp=(b,s=5)=>r(b,s,"p");  // protein grams
  const rc=(b,s=5)=>r(b,s,"c");  // carb grams (rice, pasta, potato, bread)
  // Vegetable portions: capped per-ingredient via maxPortion. Legacy numeric calls (AOVE amounts)
  // are handled by the typeof guard and still cap at 250g.
  const rv=(vegKeyOrBase,base,step=5)=>{
    if(typeof vegKeyOrBase==="number") return Math.min(250,r(vegKeyOrBase,typeof base==="number"?base:5,"v"));
    const _vs=VEG[vegKeyOrBase];
    const _cap=_vs!=null&&_vs.maxPortion!=null?_vs.maxPortion:250;
    return Math.min(_cap,r(base!=null?base:(_vs!=null?_vs.base:0),step,"v"));
  };
  // Protein portion with per-ingredient hard cap, scaled smoothly by target kcal.
  const effectiveCap=(baseCap,tKcal)=>{
    const raw=1+((tKcal-2000)/2000)*0.40;
    const factor=Math.min(Math.max(raw,0.85),1.20);
    return Math.round(baseCap*factor/5)*5;
  };
  const rpFor=(protKey,tKcal)=>{
    const _ps=PROT[protKey];
    if(!_ps) return 0;
    const _step=_ps.unit==="ud"?1:5;
    const _raw=r(_ps.base,_step,"p");           // includes shakeFactor via categoryFactor
    // Cap uses meals-kcal target (tKcal minus shake) so it also reflects the shake
    // contribution — guarantees visible portion differences at high kcal where
    // baseScale is clamped and shakeFactor alone wouldn't move the result.
    const _mealsTKcal=tKcal-shakeKcal;
    const _cap=_ps.unit==="ud"
      ?(_ps.maxPortionByPlan?.[strategy]??_ps.maxPortion??_raw)
      :effectiveCap(_ps.maxPortionByPlan?.[strategy]??_ps.maxPortion??_raw,_mealsTKcal);
    return Math.min(_cap,_raw);
  };
  const rcFor=(carbKey,tKcal)=>{
    const _cs=CARB[carbKey];
    if(!_cs) return 0;
    const _raw=r(_cs.base,5,"c");
    const _mealsTKcal=tKcal-shakeKcal;
    const _declaredCap=
      _cs.maxPortionByPlan?.[strategy]
      ??_cs.maxPortion
      ??_raw;
    return Math.min(effectiveCap(_declaredCap,_mealsTKcal),_raw);
  };
  const milk      =noLactosa?"200ml bebida vegetal":"180ml leche semidesnatada";
  const yogur     =noLactosa?"bebida vegetal (180ml)":"yogur griego 0% (125g)";

  // ══════════════════════════════════════════════════════════════════════════
  // COMPOSITIONAL MEAL ENGINE — replaces hardcoded B.*/L.*/D.* objects
  // Meals are built from ingredient databases + templates, not hand-written.
  // ══════════════════════════════════════════════════════════════════════════

  // ── INGREDIENT DATABASES ─────────────────────────────────────────────────

  const PROT = {
    pollo:     {label:"Pechuga de pollo", base:175, maxPortion:220, maxPortionByPlan:{fat_loss_general:200,definicion_saciante:170,definicion_flexible:180,mantenimiento_equilibrado:220,volumen_limpio:250,volumen_agresivo:280}, protDensity:31, cook:["plancha","horno","guisado","salteado"], familiar:true,  facil:true,  isPork:false, isFish:false, isEgg:false, isSeafood:false},
    pavo:      {label:"Pechuga de pavo",  base:175, maxPortion:220, maxPortionByPlan:{fat_loss_general:200,definicion_saciante:170,definicion_flexible:180,mantenimiento_equilibrado:220,volumen_limpio:250,volumen_agresivo:280}, protDensity:29, cook:["plancha","horno","salteado"],            familiar:true,  facil:true,  isPork:false, isFish:false, isEgg:false, isSeafood:false},
    ternera:   {label:"Ternera magra",    base:170, maxPortion:200, maxPortionByPlan:{fat_loss_general:180,definicion_saciante:150,definicion_flexible:160,mantenimiento_equilibrado:200,volumen_limpio:220,volumen_agresivo:250}, protDensity:26, cook:["plancha","guisado","horno"],              familiar:true,  facil:false, isPork:false, isFish:false, isEgg:false, isSeafood:false},
    cerdo:     {label:"Lomo de cerdo",    base:170, maxPortion:200, maxPortionByPlan:{fat_loss_general:180,definicion_saciante:150,definicion_flexible:160,mantenimiento_equilibrado:200,volumen_limpio:220,volumen_agresivo:250}, protDensity:22, cook:["plancha","horno"],                        familiar:true,  facil:true,  isPork:true,  isFish:false, isEgg:false, isSeafood:false},
    conejo:    {label:"Conejo",           base:200, maxPortion:220, protDensity:21, cook:["horno","guisado"],                        familiar:true,  facil:false, isPork:false, isFish:false, isEgg:false, isSeafood:false},
    salmon:    {label:"Salmón",           base:180, maxPortion:220, maxPortionByPlan:{fat_loss_general:180,definicion_saciante:150,definicion_flexible:160,mantenimiento_equilibrado:220,volumen_limpio:240,volumen_agresivo:260}, protDensity:20, cook:["horno","plancha"],                        familiar:true,  facil:true,  isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    merluza:   {label:"Merluza",          base:200, maxPortion:240, protDensity:19, cook:["horno","vapor","plancha"],                familiar:true,  facil:true,  isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    bacalao:   {label:"Bacalao fresco",   base:200, maxPortion:240, protDensity:20, cook:["horno","plancha"],                        familiar:true,  facil:false, isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    dorada:    {label:"Dorada",           base:200, maxPortion:240, protDensity:19, cook:["horno","plancha"],                        familiar:true,  facil:false, isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    sardinas:  {label:"Sardinas",         base:180, maxPortion:200, protDensity:21, cook:["plancha","horno"],                        familiar:true,  facil:true,  isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    atun:      {label:"Atún en conserva", base:120, maxPortion:150, maxPortionByPlan:{fat_loss_general:120,definicion_saciante:100,definicion_flexible:110,mantenimiento_equilibrado:150,volumen_limpio:160,volumen_agresivo:180}, protDensity:27, cook:["crudo"],                                  familiar:true,  facil:true,  isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    gambas:    {label:"Gambas",           base:200, maxPortion:220, protDensity:18, cook:["plancha","salteado"],                     familiar:true,  facil:true,  isPork:false, isFish:false, isEgg:false, isSeafood:true},
    calamares: {label:"Calamares",        base:200, maxPortion:220, protDensity:15, cook:["plancha","salteado"],                     familiar:true,  facil:true,  isPork:false, isFish:false, isEgg:false, isSeafood:true},
    huevo:     {label:"Huevos",           base:3,   maxPortion:3,   maxPortionByPlan:{fat_loss_general:3,definicion_saciante:2,definicion_flexible:2,mantenimiento_equilibrado:3,volumen_limpio:4,volumen_agresivo:5}, protDensity:6,  cook:["plancha","revuelto","tortilla"],          familiar:true,  facil:true,  isPork:false, isFish:false, isEgg:true,  isSeafood:false, unit:"ud"},
    lentejas:  {label:"Lentejas",         base:90,  maxPortion:120, maxPortionByPlan:{fat_loss_general:90,definicion_saciante:80,definicion_flexible:80,mantenimiento_equilibrado:120,volumen_limpio:130,volumen_agresivo:150}, protDensity:24, cook:["guisado"],                                familiar:true,  facil:false, isPork:false, isFish:false, isEgg:false, isSeafood:false, isLegume:true, unit:"g seco"},
    garbanzos: {label:"Garbanzos",        base:90,  maxPortion:120, maxPortionByPlan:{fat_loss_general:90,definicion_saciante:80,definicion_flexible:80,mantenimiento_equilibrado:120,volumen_limpio:130,volumen_agresivo:150}, protDensity:19, cook:["guisado","salteado"],                     familiar:true,  facil:false, isPork:false, isFish:false, isEgg:false, isSeafood:false, isLegume:true, unit:"g seco"},
    alubias:   {label:"Alubias blancas",  base:90,  maxPortion:120, maxPortionByPlan:{fat_loss_general:90,definicion_saciante:80,definicion_flexible:80,mantenimiento_equilibrado:120,volumen_limpio:130,volumen_agresivo:150}, protDensity:22, cook:["guisado"],                                familiar:true,  facil:false, isPork:false, isFish:false, isEgg:false, isSeafood:false, isLegume:true, unit:"g seco"},
  };

  // ── CULINARY FAMILY MAP ───────────────────────────────────────────────────
  // Humans perceive similarity by family, not by exact protein name.
  // "pollo al horno" + "pavo a la plancha" = misma experiencia.
  const CULINARY_FAMILY = {
    pollo:"ave",    pavo:"ave",    conejo:"ave",
    salmon:"pescado",  merluza:"pescado", bacalao:"pescado",
    dorada:"pescado",  sardinas:"pescado", atun:"pescado",
    gambas:"marisco",  calamares:"marisco",
    lentejas:"legumbre", garbanzos:"legumbre", alubias:"legumbre",
    ternera:"vacuno",  cerdo:"cerdo",
    huevo:"huevo",
  };
  function protFamily(key){ return CULINARY_FAMILY[key] || key; }

  // ── EXPERIENCIA CULINARIA ─────────────────────────────────────────────────
  // Los usuarios NO perciben categorías nutricionales — perciben experiencias:
  // "hoy comí algo caliente y reconfortante" / "otro bowl fresco más"
  // Esta función asigna a cada combo la experiencia culinaria que generará.
  // Es el dato que validateWeek() usa para detectar monotonía de verdad.
  function deriveCuisineExperience(combo) {
    var tmpl  = combo.tmpl  || "";
    var cookM = combo.cookM || "";
    var sauce = combo.S     || "";
    var prot  = combo.P     || "";

    if(tmpl==="sopa_crema")                                         return "comfort_caliente";
    if(tmpl==="legumbre")                                           return "comfort_caliente";
    if(cookM==="guisado")                                           return "comfort_caliente";
    if(tmpl==="bowl" && (sauce==="soja_jengibre"||cookM==="salteado")) return "wok_asiatico";
    if(tmpl==="bowl")                                               return "bowl_fresco";
    if(tmpl==="ensalada")                                           return "bowl_fresco";
    if(tmpl==="pasta")                                              return "pasta_italiana";
    if(cookM==="horno" && (sauce==="limon_hierbas"||sauce==="provenzal"||sauce==="romero_limon"||sauce==="ajillo")) return "horno_mediterraneo";
    if(cookM==="horno")                                             return "horno_mediterraneo";
    if(sauce==="soja_jengibre"||sauce==="curry_ligero")             return "wok_asiatico";
    if(cookM==="plancha" && (sauce==="limon_hierbas"||sauce==="vinagreta"||!sauce)) return "plancha_ligera";
    if(cookM==="plancha")                                           return "plancha_ligera";
    return "casero_clasico";
  }

  // Temperature feel — para el check de "todos los días lo mismo frío/caliente"
  function deriveTempFeel(combo) {
    var tmpl  = combo.tmpl  || "";
    var cookM = combo.cookM || "";
    if(tmpl==="ensalada"||tmpl==="bowl"||(cookM==="crudo")) return "frio";
    if(tmpl==="sopa_crema"||cookM==="guisado")              return "muy_caliente";
    return "caliente";
  }

  // ── ELIMINATED FOODS — HARD RULE ─────────────────────────────────────────
  // Normalise the user's free-text exclusion list so it can be matched against
  // PROT keys and PROT labels. Never serve an eliminated ingredient, no matter what.
  var _eliminated = (profile.eliminatedFoods || []).map(function(f){ return f.toLowerCase().trim(); });
  function isEliminated(ingredientKey) {
    if(!ingredientKey || !_eliminated.length) return false;
    var keyLow   = ingredientKey.toLowerCase();
    var labelLow = PROT[ingredientKey] ? PROT[ingredientKey].label.toLowerCase() : "";
    return _eliminated.some(function(e){
      return e === keyLow
          || keyLow.indexOf(e)   > -1
          || e.indexOf(keyLow)   > -1
          || (labelLow && labelLow.indexOf(e) > -1)
          || (labelLow && e.indexOf(labelLow.split(" ")[0]) > -1);
    });
  }

  const CARB = {
    arroz:   {label:"Arroz blanco",   base:70,  maxPortion:80,  maxPortionByPlan:{fat_loss_general:70,definicion_saciante:50,definicion_flexible:60,mantenimiento_equilibrado:80,volumen_limpio:100,volumen_agresivo:130}, unit:"g seco",    density:"alta",  time:18, familiar:true,  cook:"cocer en agua con sal"},
    pasta:   {label:"Pasta integral", base:80,  maxPortion:85,  maxPortionByPlan:{fat_loss_general:75,definicion_saciante:55,definicion_flexible:65,mantenimiento_equilibrado:85,volumen_limpio:110,volumen_agresivo:140}, unit:"g seco",    density:"alta",  time:10, familiar:true,  cook:"cocer al dente"},
    patata:  {label:"Patata",         base:200, maxPortion:200, maxPortionByPlan:{fat_loss_general:170,definicion_saciante:130,definicion_flexible:150,mantenimiento_equilibrado:200,volumen_limpio:250,volumen_agresivo:300}, unit:"g",         density:"media", time:25, familiar:true,  cook:"cocer con piel 25 min en agua con sal"},
    boniato: {label:"Boniato",        base:175, unit:"g",         density:"media", time:35, familiar:false, cook:"hornear a 200°C"},
    quinoa:  {label:"Quinoa",         base:70,  unit:"g seco",    density:"media", time:15, familiar:false, cook:"cocer 2:1 agua"},
    pan:     {label:"Pan integral",   base:60,  unit:"g",         density:"alta",  time:2,  familiar:true,  cook:"tostar"},
  };

  const VEG = {
    brocoli:   {label:"Brócoli",           base:200, maxPortion:250, saciante:true,  familiar:true,  cookHint:"al vapor 8 min o salteado"},
    espinacas: {label:"Espinacas",         base:150, maxPortion:200, saciante:true,  familiar:true,  cookHint:"salteadas con ajo 3 min"},
    calabacin: {label:"Calabacín",         base:200, maxPortion:300, saciante:true,  familiar:true,  cookHint:"a la plancha 4 min por lado, o al horno 20 min a 200°C"},
    judias:    {label:"Judías verdes",      base:200, maxPortion:250, saciante:true,  familiar:true,  cookHint:"al vapor 10 min"},
    pimientos: {label:"Pimientos",         base:150, maxPortion:250, saciante:false, familiar:true,  cookHint:"asados al horno 25 min a 200°C, o salteados al wok 6 min"},
    zanahoria: {label:"Zanahoria",         base:150, maxPortion:200, saciante:false, familiar:true,  cookHint:"rallada cruda, o al vapor 10 min"},
    coles:     {label:"Col de Bruselas",   base:180, maxPortion:250, saciante:true,  familiar:false, cookHint:"al horno 25 min a 200°C con AOVE y sal"},
    berenjena: {label:"Berenjena",         base:200, maxPortion:300, saciante:false, familiar:true,  cookHint:"a la plancha 4 min por lado, o al horno 25 min a 200°C"},
    tomate:    {label:"Tomate cherry",     base:150, maxPortion:200, saciante:false, familiar:true,  cookHint:"crudo, o confitado al horno 30 min a 160°C"},
    lechuga:   {label:"Lechuga mixta",     base:100, maxPortion:150, saciante:false, familiar:true,  cookHint:"cruda con vinagreta"},
    acelgas:   {label:"Acelgas",           base:200, maxPortion:200, saciante:true,  familiar:true,  cookHint:"salteadas con ajo y limón 5 min"},
    pepino:    {label:"Pepino",            base:150, maxPortion:200, saciante:false, familiar:true,  cookHint:"crudo en rodajas"},
    calabaza:  {label:"Calabaza",          base:300, maxPortion:350, saciante:true,  familiar:true,  cookHint:"asada al horno 30 min a 200°C, o en crema 20 min cocida"},
    puerro:    {label:"Puerro",            base:150, maxPortion:200, saciante:true,  familiar:true,  cookHint:"pochado 10 min a fuego suave, o al horno 25 min a 200°C con AOVE"},
    champiñones:{label:"Champiñones",      base:150, maxPortion:200, saciante:false, familiar:true,  cookHint:"salteados con ajo y perejil 6 min"},
    esparragos: {label:"Espárragos",       base:150, maxPortion:200, saciante:false, familiar:true,  cookHint:"a la plancha o al vapor 5 min"},
    alcachofa:  {label:"Alcachofas",       base:150, maxPortion:250, saciante:true,  familiar:false, cookHint:"al horno 30 min a 200°C, o cocidas 25 min con limón"},
  };

  const SAUCE = {
    limon_hierbas:  {label:"limón, orégano y ajo",       fat:"½ cda AOVE", familiar:true,  style:"mediterraneo"},
    tomate_casero:  {label:"tomate casero",               fat:"½ cda AOVE", familiar:true,  style:"mediterraneo"},
    mostaza_miel:   {label:"mostaza y miel",              fat:"½ cda AOVE", familiar:true,  style:"europeo"},
    soja_jengibre:  {label:"soja baja en sal y jengibre", fat:"½ cda AOVE", familiar:false, style:"asiatico"},
    provenzal:      {label:"hierbas provenzales",         fat:"½ cda AOVE", familiar:true,  style:"mediterraneo"},
    pimenton_ajo:   {label:"pimentón ahumado y ajo",      fat:"½ cda AOVE", familiar:true,  style:"casero"},
    curry_ligero:   {label:"curry y cúrcuma",             fat:"½ cda AOVE", familiar:false, style:"asiatico"},
    vinagreta:      {label:"vinagre de Módena y mostaza", fat:"½ cda AOVE", familiar:true,  style:"mediterraneo"},
    ajillo:         {label:"ajo, perejil y guindilla",    fat:"½ cda AOVE", familiar:true,  style:"casero"},
    romero_limon:   {label:"romero, limón y ajo",         fat:"½ cda AOVE", familiar:true,  style:"mediterraneo"},
  };

  // Cook method descriptions in Spanish
  const COOK_LABEL = {
    plancha:"a la plancha", horno:"al horno", guisado:"guisado", salteado:"salteado",
    vapor:"al vapor", crudo:"en conserva", revuelto:"revuelto", tortilla:"en tortilla",
    "al dente":"al dente",
  };

  // ── P1 TEMPLATE ENGINE ────────────────────────────────────────────────────
  // Method-aware wording for p1 — eliminates the blanket "marinado con" pattern.
  // Each template embeds the cooking method so cookDesc is not appended separately.
  // Selection is deterministic: _hashStr(comboKey) picks the same variant every time.
  const P1_TEMPLATES = {
    plancha: [
      "{P} a la plancha con {S}",
      "{P} marcado a la plancha, {S}",
      "{P} a la plancha aliñado con {S}",
    ],
    horno: [
      "{P} al horno con {S}",
      "{P} asado al horno, {S}",
      "{P} horneado con {S}",
    ],
    salteado: [
      "{P} salteado con {S}",
      "{P} al wok con {S}",
      "{P} salteado, terminado con {S}",
    ],
    guisado: [
      "{P} guisado con {S}",
      "{P} estofado con {S}",
      "{P} cocinado a fuego lento con {S}",
    ],
    crudo: [
      "{P} en crudo, aliñado con {S}",
      "{P} tipo tartar con {S}",
      "{P} servido crudo con {S}",
    ],
    revuelto: [
      "{P} revueltos con {S}",
      "{P} en revuelto con {S}",
    ],
    tortilla: [
      "{P} en tortilla con {S}",
    ],
  };
  // Pick template by deterministic hash — same combo always gets same wording
  const pickP1Template = (cm, comboKey) => {
    const arr = P1_TEMPLATES[cm] || P1_TEMPLATES["plancha"];
    return arr[_hashStr(comboKey || cm) % arr.length];
  };
  // Render a P1_TEMPLATES entry: substitute {P}/{S}, strip sauce clause when no sauce
  const renderP1Tmpl = (tmpl, pLbl, sLbl) => {
    if (sLbl) return tmpl.replace("{P}", pLbl).replace("{S}", sLbl);
    // No sauce: drop " con {S}", ", {S}", " aliñado con {S}", etc.
    return tmpl
      .replace(/[\s,]*(?:marinado |aliñado |terminado )?con\s+\{S\}/g, "")
      .replace(/[\s,]+\{S\}/g, "")
      .replace("{P}", pLbl)
      .replace(/[,\s]+$/, "");
  };
  // AOVE suffix variants — deterministic by comboKey
  const _AOVE_SUFFIXES = (ml) => [
    ml + "ml AOVE",
    "un chorrito de AOVE (" + ml + "ml)",
    "aliñado con " + ml + "ml de AOVE",
    ml + "ml de aceite de oliva virgen extra",
  ];
  const pickAoveSuffix = (ml, comboKey) =>
    _AOVE_SUFFIXES(ml)[_hashStr(comboKey + "_aove") % 4];

  // ── MEAL TEMPLATE COMPOSER ────────────────────────────────────────────────
  // Returns a full meal object {time, emoji, title, p1, p2, shopping, recipe, metadata}
  // from a combination spec. All gram values use rp/rc/rv for strategy scaling.

  function composeMeal(spec) {
    const __t0 = __PERF.mark();  // PERF — composeMeal es llamado ~35 veces por plan

    if (spec && spec.freeForm === true) {

      var __ff_id        = spec.identity || {};
      var __ff_nutrition = spec.nutrition || {};
      var __ff_scaling   = spec.scaling || {};
      var __ff_behavior  = spec.behavior || {};
      var __ff_content   = spec.content || {};

      // ─────────────────────────────────────────────
      // SLOT RESOLUTION (determinista)
      // ─────────────────────────────────────────────
      // Prioridad:
      // 1) spec.slot
      // 2) behavior.slot
      // 3) fallback "Comida"
      var __slotArr = Array.isArray(__ff_behavior.slot)
        ? __ff_behavior.slot
        : (__ff_behavior.slot ? [__ff_behavior.slot] : []);

      var __ff_time = spec.slot
        || (__slotArr.indexOf("Ce") >= 0 ? "Cena"
          : __slotArr.indexOf("C")  >= 0 ? "Comida"
          : "Desayuno");

      var __ff_emoji =
        __ff_id.emoji ||
        (__ff_time === "Cena" ? "🌙"
          : __ff_time === "Desayuno" ? "🍎"
          : "☀️");

      // ─────────────────────────────────────────────
      // LEGACY METADATA COMPATIBILITY LAYER
      // ─────────────────────────────────────────────
      // IMPORTANTE: solo compatibilidad, NO fuente de verdad
      var __ff_metadata = {
        saciedad:
          (__ff_behavior.satietyScore >= 4) ? "alta"
          : (__ff_behavior.satietyScore >= 3) ? "media"
          : "baja",

        facilidad: "media",

        // conservación de señal real (no colapsada)
        tiempo: __ff_behavior.tiempo || 0,

        familiar: __ff_behavior.familiar !== false,

        comfort: __ff_behavior.digestiveLoad === "high" ? true : false,

        // plateType para validateWeek (estimación kcal diaria)
        plateType: __ff_id.plateType || null
      };

      // ── glutenFree adaptation flag (Fase 3) ──────────────────────
      if (noGluten && __ff_id.glutenFreeAdaptable === true) {
        __ff_metadata.glutenFreeAdapted = true;
        __ff_metadata.glutenFreeNote    = "Usa versión sin gluten";
      }
      // ── fin glutenFree adaptation ─────────────────────────────────

      var __ff_result = {
        time: __ff_time,
        emoji: __ff_emoji,
        title: __ff_id.title || "Plato",

        p1: __ff_content.p1 || "",
        p2: __ff_content.p2 || "",

        shopping: Array.isArray(__ff_content.shopping)
          ? __ff_content.shopping.slice()
          : [],

        recipe: Array.isArray(__ff_content.recipe)
          ? __ff_content.recipe.slice()
          : [],

        metadata: __ff_metadata,

        _spec: spec
      };

      __PERF.measure("composeMeal", __t0);

      return __ff_result;
    }

    var P   = spec.P   ? PROT[spec.P]   : null;
    var C   = spec.C   ? CARB[spec.C]   : null;
    var V   = spec.V   ? VEG[spec.V]    : null;
    var V2  = spec.V2  ? VEG[spec.V2]   : null;
    var S   = spec.S   ? SAUCE[spec.S]  : null;
    var tmpl= spec.tmpl || "caliente_clasico";
    var slot= spec.slot || "Comida";
    var emoji=spec.emoji || (slot==="Comida"?"☀️":"🌙");
    var time = slot==="Comida"?"Comida":slot==="Cena"?"Cena":"Desayuno";

    var pLabel = P?(P.unit==="ud"?(rpFor(spec.P,targetKcal)+" "+P.unit+" "+P.label):P.label+" ("+rpFor(spec.P,targetKcal)+"g)"):"";
    var cLabel = C?(C.label+" ("+rcFor(spec.C,targetKcal)+"g "+C.unit+")"):"";;
    var vLabel = V?(V.label+" ("+rv(spec.V,V.base)+"g)"):"";
    var v2Label= V2?(V2.label+" ("+rv(spec.V2,V2.base)+"g)"):"";
    var sLabel = S?S.label:"";
    var cookM  = spec.cookM || (P&&P.cook[0]) || "plancha";
    var cookDesc=COOK_LABEL[cookM]||cookM;

    // ── Build title — sauce/method-first, not protein-carb-veg structure ──
    var title;
    var pName  = P ? P.label.toLowerCase() : "";
    var vName  = V ? V.label.toLowerCase() : "";
    var v2Name = V2? V2.label.toLowerCase(): "";
    var cName  = C ? C.label.toLowerCase() : "";
    var sName  = S ? S.label : "";

    if(tmpl==="sopa_crema") {
      // Lead with the vegetable — that's what makes a cream soup
      var creamVeg = V ? V.label : (V2 ? V2.label : "verduras");
      title = "Crema de "+creamVeg.toLowerCase()
              + (V2&&V?" y "+v2Name:"")
              + (P?" · "+pName+" encima":"");
    } else if(tmpl==="ensalada") {
      // Lead with the protein and the dressing feeling
      var _ensC = C ? " con "+cName : "";
      title = pName ? (pName.charAt(0).toUpperCase()+pName.slice(1))+" en ensalada"+_ensC
                    : "Ensalada variada"+_ensC;
    } else if(tmpl==="bowl") {
      // Bowl: sauce defines character
      var bowlChar = spec.S==="soja_jengibre"   ? "asiático"
                   : spec.S==="curry_ligero"    ? "de curry"
                   : spec.S==="limon_hierbas"   ? "mediterráneo"
                   : spec.S==="tomate_casero"   ? "con tomate"
                   : "proteico";
      title = "Bowl "+bowlChar+" de "+pName+(C?" con "+cName:"");
    } else if(tmpl==="pasta") {
      // Pasta: sauce or companion defines name
      var sauceName = spec.S==="tomate_casero"  ? "al pomodoro"
                    : spec.S==="ajillo"          ? "al ajillo"
                    : spec.S==="curry_ligero"    ? "al curry"
                    : "con proteína";
      title = (C?C.label:"Pasta")+" "+sauceName+(P?" con "+pName:"");
    } else if(tmpl==="legumbre") {
      // Legume: cooking method and veg define character
      var legName = P ? P.label : "Legumbres";
      var legChar = spec.S==="curry_ligero"  ? " al curry"
                  : spec.S==="pimenton_ajo"  ? " con pimentón"
                  : spec.S==="ajillo"        ? " al ajillo"
                  : " estofadas";
      title = legName+legChar+(V?" con "+vName:"");
    } else {
      // caliente_clasico — lead with cook method + sauce character, not just protein name
      var methodChar = cookM==="horno"    ? "al horno"
                     : cookM==="guisado"  ? "guisado"
                     : cookM==="salteado" ? "salteado"
                     : cookM==="vapor"    ? "al vapor"
                     : cookM==="revuelto" ? "revuelto"
                     : cookM==="tortilla" ? "en tortilla"
                     : "a la plancha";
      var sauceChar  = spec.S==="limon_hierbas" ? " con limón y hierbas"
                     : spec.S==="mostaza_miel"  ? " con mostaza y miel"
                     : spec.S==="soja_jengibre" ? " con soja y jengibre"
                     : spec.S==="ajillo"        ? " al ajillo"
                     : spec.S==="provenzal"     ? " provenzal"
                     : spec.S==="curry_ligero"  ? " al curry"
                     : spec.S==="pimenton_ajo"  ? " con pimentón"
                     : spec.S==="romero_limon"  ? " con romero y limón"
                     : spec.S==="vinagreta"     ? " en vinagreta"
                     : "";
      // Special overrides for known classic dishes — platos con identidad fuerte
      // Cuando el usuario ve el nombre, lo recuerda. No "pavo a la plancha", sino algo real.
      var classicTitle = null;
      // Ave
      if(spec.P==="pollo"&&spec.C==="arroz"&&cookM==="plancha") classicTitle="Pollo a la plancha con arroz";
      if(spec.P==="pollo"&&spec.C==="arroz"&&cookM==="horno")   classicTitle="Pollo al horno con arroz y pimientos";
      if(spec.P==="pollo"&&spec.C==="patata"&&cookM==="horno")  classicTitle="Pollo asado al romero con patatas";
      if(spec.P==="pollo"&&spec.S==="mostaza_miel")             classicTitle="Pollo con salsa de mostaza y miel";
      if(spec.P==="pollo"&&spec.S==="soja_jengibre")            classicTitle="Pollo teriyaki con verduras";
      if(spec.P==="pollo"&&spec.S==="curry_ligero")             classicTitle="Pollo al curry con arroz";
      if(spec.P==="pollo"&&spec.V==="pimientos"&&cookM==="horno") classicTitle="Pollo al horno con pimientos y cebolla";
      if(spec.P==="pollo"&&spec.V==="berenjena"&&cookM==="horno") classicTitle="Pollo provenzal con berenjena al horno";
      if(spec.P==="pavo"&&spec.S==="curry_ligero")              classicTitle="Pavo al curry con calabacín";
      if(spec.P==="pavo"&&spec.S==="mostaza_miel")              classicTitle="Filete de pavo con mostaza y miel";
      if(spec.P==="pavo"&&cookM==="plancha"&&spec.V==="judias") classicTitle="Pavo a la plancha con judías verdes";
      if(spec.P==="conejo"&&cookM==="horno")                    classicTitle="Conejo al horno con patatas y ajo";
      if(spec.P==="conejo"&&spec.S==="ajillo")                  classicTitle="Conejo al ajillo";
      // Vacuno
      if(spec.P==="ternera"&&spec.C==="patata"&&cookM==="plancha") classicTitle="Ternera a la plancha con patatas";
      if(spec.P==="ternera"&&cookM==="guisado")                 classicTitle="Estofado de ternera con verduras";
      if(spec.P==="ternera"&&spec.S==="romero_limon")           classicTitle="Solomillo de ternera al romero con limón";
      if(spec.P==="ternera"&&spec.S==="soja_jengibre")          classicTitle="Ternera salteada al wok con soja";
      // Cerdo
      if(spec.P==="cerdo"&&spec.S==="mostaza_miel")             classicTitle="Solomillo de cerdo con mostaza y miel";
      if(spec.P==="cerdo"&&spec.S==="romero_limon")             classicTitle="Lomo de cerdo al romero con boniato";
      if(spec.P==="cerdo"&&cookM==="plancha"&&spec.C==="patata")classicTitle="Lomo de cerdo a la plancha con patatas";
      if(spec.P==="cerdo"&&spec.V==="pimientos"&&cookM==="horno") classicTitle="Cerdo al horno con pimientos asados";
      // Pescado
      if(spec.P==="salmon"&&spec.C==="boniato")                 classicTitle="Salmón al horno con boniato asado";
      if(spec.P==="salmon"&&spec.S==="soja_jengibre")           classicTitle="Salmón teriyaki con quinoa y espinacas";
      if(spec.P==="salmon"&&spec.S==="limon_hierbas")           classicTitle="Salmón al horno con limón y eneldo";
      if(spec.P==="salmon"&&spec.S==="mostaza_miel")            classicTitle="Salmón lacado con mostaza y miel";
      if(spec.P==="merluza"&&spec.C==="patata"&&spec.S==="ajillo") classicTitle="Merluza al ajillo con patatas";
      if(spec.P==="merluza"&&spec.S==="limon_hierbas")          classicTitle="Merluza al horno con limón y hierbas";
      if(spec.P==="merluza"&&spec.V==="judias")                 classicTitle="Merluza al horno con judías verdes";
      if(spec.P==="bacalao"&&spec.C==="patata"&&spec.S==="ajillo") classicTitle="Bacalao al ajillo con patatas";
      if(spec.P==="bacalao"&&spec.V==="pimientos")              classicTitle="Bacalao con pimientos asados";
      if(spec.P==="dorada"&&cookM==="horno")                    classicTitle="Dorada al horno con patatas y limón";
      if(spec.P==="sardinas"&&spec.S==="ajillo")                classicTitle="Sardinas a la plancha con tomate";
      if(spec.P==="atun"&&spec.C==="arroz")                     classicTitle="Arroz con atún y verduras";
      // Marisco
      if(spec.P==="gambas"&&spec.C==="arroz")                   classicTitle="Arroz con gambas al ajillo";
      if(spec.P==="gambas"&&cookM==="plancha")                  classicTitle="Gambas a la plancha con ajo y limón";
      if(spec.P==="calamares"&&spec.C==="arroz")                classicTitle="Calamares encebollados con arroz";
      if(spec.P==="calamares"&&cookM==="plancha")               classicTitle="Calamares a la plancha con alioli";
      // Legumbres — los más memorables
      if(spec.P==="lentejas")   classicTitle="Lentejas estofadas"+(spec.S==="pimenton_ajo"?" con pimentón ahumado":"");
      if(spec.P==="garbanzos"&&spec.V==="espinacas") classicTitle="Garbanzos con espinacas al pimentón";
      if(spec.P==="garbanzos"&&spec.S==="curry_ligero") classicTitle="Garbanzos al curry con brocoli";
      if(spec.P==="alubias")    classicTitle="Alubias estofadas con verduras";
      // Huevo
      if(spec.P==="huevo"&&cookM==="tortilla") classicTitle="Tortilla de "+(V?vName:"verduras");
      if(spec.P==="huevo"&&cookM==="revuelto") classicTitle="Revuelto de "+(V?vName:"verduras");
      if(spec.P==="huevo"&&cookM==="plancha")  classicTitle="Huevos a la plancha con "+(V?vName:"verduras");
      // Vida real — nuevos títulos
      if(spec.P==="huevo"&&spec.C==="arroz"&&cookM==="revuelto") classicTitle="Arroz con huevo revuelto y "+( V?vName:"verduras");
      if(spec.P==="huevo"&&spec.C==="patata"&&cookM==="tortilla") classicTitle="Tortilla con patata y "+(V?vName:"verduras");
      if(spec.P==="atun"&&spec.C==="arroz"&&cookM==="crudo") classicTitle="Arroz con atún, tomate y limón";
      if(spec.P==="sardinas"&&spec.C==="patata") classicTitle="Sardinas a la plancha con patatas y pimientos";
      if(spec.P==="ternera"&&spec.C==="pasta"&&cookM==="salteado") classicTitle="Pasta con ternera y salsa de tomate";
      if(spec.P==="pollo"&&spec.C==="pasta"&&spec.S==="pimenton_ajo") classicTitle="Pasta con pollo al pimentón";
      if(spec.P==="pollo"&&spec.C==="pasta"&&spec.S==="ajillo") classicTitle="Pasta con pollo al ajillo y espinacas";
      if(spec.P==="lentejas"&&spec.C==="arroz") classicTitle="Lentejas con arroz al pimentón";
      if(spec.P==="merluza"&&spec.C==="arroz"&&spec.S==="ajillo") classicTitle="Arroz con merluza al ajillo";
      // Cenas especiales
      if(spec.P==="salmon"&&!spec.C&&spec.V==="espinacas") classicTitle="Salmón a la plancha con espinacas salteadas";
      if(spec.P==="merluza"&&!spec.C&&spec.V==="judias")   classicTitle="Merluza al horno con judías y limón";
      if(spec.P==="bacalao"&&!spec.C)                       classicTitle="Bacalao a la plancha con verduras";
      if(spec.P==="pollo"&&!spec.C&&spec.V==="coles")      classicTitle="Pollo al horno con coles de Bruselas";
      if(spec.P==="ternera"&&!spec.C&&spec.S==="ajillo")   classicTitle="Ternera al ajillo con pimientos";

      title = classicTitle ||
              (P?(P.label.charAt(0).toUpperCase()+P.label.slice(1).toLowerCase()):"")+
              " "+methodChar+sauceChar+
              (V?" con "+vName:"")+
              (C?" y "+cName:"");
    }
    title = title.trim().replace(/\s+/g," ");
    if(spec.title) title = spec.title; // training dinners override

    // ── Build p1, p2 ──
    var p1, p2;
    // Stable key for deterministic template selection — same combo → same wording always
    var _comboKey = (spec.P||"")+(spec.C||"")+(spec.V||"")+(spec.S||"")+(spec.cookM||"");
    if(tmpl==="sopa_crema") {
      p1 = (V?rv(spec.V,V.base)+"g de "+V.label.toLowerCase():"")+(V2?" y "+rv(spec.V2,V2.base)+"g "+V2.label.toLowerCase():"")+", caldo y cebolla · "+rp(10)+"ml AOVE";
      p2 = (P?"+ "+pLabel+" "+cookDesc+" encima":"")+(S?" · aliñada con "+sLabel:"")+" · sal y pimienta";
    } else if(tmpl==="ensalada") {
      p1 = pLabel+(cookM!=="crudo"?" "+cookDesc:"")+" · "+(V?vLabel:"")+( V2?" + "+v2Label:"")+(S?" · "+sLabel:"");
      p2 = (C?cLabel+" de base":"")+(!C&&V2?v2Label:"")+" · "+rv(15)+"ml AOVE + vinagre de Módena · sal";
    } else if(tmpl==="bowl") {
      // Template already embeds the cooking method — no cookDesc suffix needed
      p1 = renderP1Tmpl(pickP1Template(cookM, _comboKey), pLabel, S ? sLabel : "");
      p2 = cLabel+" de base · "+(V?vLabel+" "+V.cookHint:"verduras de temporada")+(V2?" + "+v2Label:"")+" · "+rv(10)+"ml AOVE";
    } else if(tmpl==="pasta") {
      p1 = cLabel+" cocida al dente · "+pLabel+(S?" · salsa de "+sLabel:"");
      p2 = (V?vLabel+" incorporada":"")+(!V?V2?v2Label:"":"")+(V&&V2?" + "+v2Label:"")+" · "+rv(10)+"ml AOVE · queso rallado al gusto";
    } else if(tmpl==="legumbre") {
      p1 = pLabel+(S?" con "+sLabel:" guisadas con laurel y pimentón")+" · caldo de verduras";
      p2 = (V?vLabel+" añadida":"")+(V2?" + "+v2Label:"")+" · sal, comino · "+rv(10)+"ml AOVE";
    } else {
      // caliente_clasico / plancha_verdura / pescado_horno / huevo_plancha
      // Template already embeds the cooking method — append only AOVE suffix
      var _dBase = renderP1Tmpl(pickP1Template(cookM, _comboKey), pLabel, S ? sLabel : "");
      p1 = _dBase + " · " + pickAoveSuffix(rv(10), _comboKey);
      p2 = (C?cLabel+(C.cook?" — "+C.cook:"")+"":" ")+(V?" · "+vLabel+" "+V.cookHint:"")+(V2?" + "+v2Label:"")||"Verdura de temporada";
    }

    // ── Build shopping list ──
    var shopping = [];
    if(P) shopping.push(P.unit==="ud"?P.label+" ("+rpFor(spec.P,targetKcal)+" ud)":P.label+" ("+rpFor(spec.P,targetKcal)+"g)");
    if(C) shopping.push(C.label+" ("+rcFor(spec.C,targetKcal)+"g)");
    if(V) shopping.push(V.label+" ("+rv(spec.V,V.base)+"g)");
    if(V2)shopping.push(V2.label+" ("+rv(spec.V2,V2.base)+"g)");
    if(S) shopping.push(S.label.split(" y ")[0]+" (condimento)");
    shopping.push("AOVE");
    shopping.push("Sal y especias básicas");

    // ── Build recipe steps ──
    var steps = [];
    if(C && C.time > 0) {
      // C step applies to all templates — for ensalada note to cool before adding
      var _cNote = tmpl==="ensalada" ? " Enfriar antes de añadir a la ensalada." : "";
      steps.push(C.label+": "+C.cook+" — "+C.time+" min"+_cNote+".");
    }
    if(P && tmpl!=="legumbre") {
      if(S) steps.push(
        cookM==="horno"    ? "Sazona "+P.label.toLowerCase()+" con "+sLabel+" y deja reposar 5 min." :
        cookM==="salteado" ? "Mezcla "+P.label.toLowerCase()+" con "+sLabel+" justo antes de saltear." :
        cookM==="guisado"  ? "Incorpora "+sLabel+" al guiso de "+P.label.toLowerCase()+"." :
        cookM==="crudo"    ? "Aliña "+P.label.toLowerCase()+" con "+sLabel+" y deja macerar 10 min." :
        cookM==="revuelto" ? "Bate "+P.label.toLowerCase()+" con "+sLabel+"." :
        cookM==="tortilla" ? "Mezcla "+P.label.toLowerCase()+" con "+sLabel+" antes de cuajar." :
        "Aliña "+P.label.toLowerCase()+" con "+sLabel+" antes de cocinar."
      );
      var cookInstr = cookM==="horno" ? "Hornea a 200°C unos 20-25 min" :
                      cookM==="guisado" ? "Cuece a fuego suave 25-30 min con caldo" :
                      cookM==="vapor" ? "Cuece al vapor 12-15 min" :
                      cookM==="revuelto" ? "Saltea a fuego medio 3-4 min removiendo" :
                      cookM==="tortilla" ? "Cuaja a fuego medio 3-4 min por lado" :
                      cookM==="crudo" ? "Escurre y reserva" :
                      "Cocina a fuego vivo 3-4 min por lado";
      steps.push(P.label+": "+cookInstr+".");
    }
    if(P && tmpl==="legumbre") {
      // Legumbre: P is the legume itself — needs its own cooking step
      steps.push((P.label)+": cocer a fuego suave 30-35 min con caldo, laurel y sal. Incorporar sofrito de ajo"+(S?", "+sLabel:"")+" y AOVE al final.");
    }
    if(V && tmpl!=="sopa_crema") steps.push(V.label+": "+V.cookHint+".");
    if(V2 && tmpl!=="sopa_crema") steps.push(V2.label+": "+V2.cookHint+".");
    if(tmpl==="sopa_crema") {
      steps.push("Sofríe cebolla picada con AOVE a fuego medio 5 min.");
      steps.push("Añade "+(V?V.label.toLowerCase()+" troceado":"la verdura")+(V2?" y "+V2.label.toLowerCase():"")+" y cubre con caldo.");
      steps.push("Cuece tapado a fuego suave 20 min.");
      steps.push("Tritura con batidora hasta textura suave. Ajusta de sal.");
      steps.push(P?"Sirve la crema y coloca "+P.label.toLowerCase()+" "+cookDesc+" encima.":"Sirve y añade un chorrito de AOVE.");
    }
    if(steps.length < 2) steps.push("Emplata combinando todos los ingredientes. Ajusta de sal y pimienta.");
    steps.push("Sirve inmediatamente. Puedes preparar "+(C&&C.time>15?"el "+C.label.toLowerCase()+" con antelación":"los ingredientes")+" la noche anterior.");

    // ── Metadata for smartPick ──
    var _portionForProteinG = P ? rpFor(spec.P,targetKcal) : 0;
    var _proteinG = P
      ? (P.unit==="ud"
        ? Math.round(_portionForProteinG * (P.protDensity||6))
        : Math.round(_portionForProteinG * (P.protDensity||25) / 100))
      : 0;
    var metadata = {
      saciedad: (V && V.saciante) || tmpl==="sopa_crema" ? "alta" : tmpl==="ensalada" ? "media" : "media",
      facilidad: (P && P.facil && (!C || C.time <= 20)) ? "alta" : "media",
      tiempo: Math.max(C?C.time:0, P&&P.cook[0]==="horno"?25:10),
      familiar: (P&&P.familiar) && (V?V.familiar:true),
      comfort: tmpl==="legumbre"||tmpl==="sopa_crema",
      plateType: spec.plateType || null,
      proteinG: _proteinG,
    };

    const __result = {time:time, emoji:emoji, title:title, p1:p1, p2:p2, shopping:shopping, recipe:steps, metadata:metadata,
            _spec:spec};
    __PERF.measure("composeMeal", __t0);  // PERF
    return __result;
  }

  // ── COMBO LIBRARIES ───────────────────────────────────────────────────────
  // Each entry is a lightweight spec — composeMeal() builds the full meal.
  // Columns: tmpl, P(rotein), C(arb), V(eggie), V2, S(auce), cookM, plateType, density, familiar, facil, saciante

  const LUNCH_COMBOS = [
    // ── Clásicos familiares ──────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"pollo",   C:"arroz",   V:"brocoli",  S:"limon_hierbas",  cookM:"plancha",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"pollo",   C:"arroz",   V:"espinacas",S:"pimenton_ajo",   cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:"patata",  V:"judias",   S:"provenzal",      cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:"boniato", V:"calabacin",S:"pimenton_ajo",   cookM:"horno",    plateType:"caliente_boniato", density:"media", familiar:false, facil:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:"patata",  V:"judias",   S:"limon_hierbas",  cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:"arroz",   V:"pimientos",S:"pimenton_ajo",   cookM:"plancha",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"ternera", C:"patata",  V:"espinacas",S:"romero_limon",   cookM:"plancha",  plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"ternera", C:"arroz",   V:"pimientos",S:"ajillo",         cookM:"guisado",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"cerdo",   C:"patata",  V:"zanahoria",S:"mostaza_miel",   cookM:"plancha",  plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"cerdo",   C:"boniato", V:"calabacin",S:"romero_limon",   cookM:"horno",    plateType:"caliente_boniato", density:"media", familiar:false, facil:false},
    {tmpl:"caliente_clasico", P:"conejo",  C:"patata",  V:"pimientos",S:"ajillo",         cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    // ── Pescado ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"salmon",  C:"boniato", V:"espinacas",S:"limon_hierbas",  cookM:"horno",    plateType:"caliente_boniato", density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"salmon",  C:"quinoa",  V:"espinacas",S:"soja_jengibre",  cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:false, facil:false},
    {tmpl:"caliente_clasico", P:"merluza", C:"patata",  V:"judias",   S:"ajillo",         cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"bacalao", C:"patata",  V:"pimientos",S:"ajillo",         cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"dorada",  C:"patata",  V:"brocoli",  S:"limon_hierbas",  cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"sardinas",C:"arroz",   V:"tomate",   S:"ajillo",         cookM:"plancha",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    // ── Pasta ────────────────────────────────────────────────────────────
    {tmpl:"pasta",             P:"pollo",  C:"pasta",   V:"tomate",   S:"tomate_casero",  cookM:"salteado", plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    {tmpl:"pasta",             P:"atun",   C:"pasta",   V:"calabacin",S:"ajillo",         cookM:"crudo",    plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    {tmpl:"pasta",             P:"huevo",  C:"pasta",   V:null,       S:"ajillo",         cookM:"revuelto", plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    // ── Legumbre ─────────────────────────────────────────────────────────
    {tmpl:"legumbre",          P:"lentejas",C:null,     V:"zanahoria",S:"pimenton_ajo",   cookM:"guisado",  plateType:"legumbre",          density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre",          P:"garbanzos",C:null,    V:"espinacas",S:"pimenton_ajo",   cookM:"guisado",  plateType:"legumbre",          density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre",          P:"alubias", C:null,     V:"pimientos",S:"ajillo",         cookM:"guisado",  plateType:"legumbre",          density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre",          P:"garbanzos",C:null,    V:"brocoli",  S:"curry_ligero",   cookM:"salteado", plateType:"legumbre",          density:"baja",  familiar:false, facil:true},
    // ── Bowl / ensalada ─────────────────────────────────────────────────
    {tmpl:"bowl",              P:"pollo",  C:"quinoa",  V:"espinacas",S:"curry_ligero",   cookM:"plancha",  plateType:"bowl",              density:"media", familiar:false, facil:false},
    {tmpl:"bowl",              P:"pavo",   C:"quinoa",  V:"pimientos",S:"limon_hierbas",  cookM:"plancha",  plateType:"bowl",              density:"media", familiar:false, facil:false},
    {tmpl:"bowl",              P:"pollo",  C:"arroz",   V:"brocoli",  S:"soja_jengibre",  cookM:"salteado", plateType:"bowl",              density:"alta",  familiar:false, facil:false},
    {tmpl:"bowl",              P:"salmon", C:"quinoa",  V:"pepino",   S:"soja_jengibre",  cookM:"crudo",    plateType:"bowl",              density:"media", familiar:false, facil:false},
    {tmpl:"ensalada",          P:"pollo",  C:null,      V:"lechuga",  V2:"tomate",S:"vinagreta",cookM:"plancha",plateType:"ensalada",  density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada",          P:"atun",   C:null,      V:"lechuga",  V2:"tomate",S:"vinagreta",cookM:"crudo",  plateType:"ensalada",  density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada",          P:"gambas", C:null,      V:"lechuga",  V2:"pepino",S:"vinagreta",cookM:"plancha",plateType:"ensalada",  density:"baja",  familiar:true,  facil:true},
    // ── Marisco ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico",  P:"gambas", C:"arroz",   V:"calabacin",S:"ajillo",         cookM:"salteado", plateType:"caliente_arroz",   density:"alta",  familiar:true,  facil:true},
    {tmpl:"caliente_clasico",  P:"calamares",C:"arroz", V:"pimientos",S:"ajillo",         cookM:"plancha",  plateType:"caliente_arroz",   density:"alta",  familiar:true,  facil:false},
    // ── Vida real: platos que no aparecen en apps fitness pero sí en cocinas ──
    {tmpl:"caliente_clasico",  P:"huevo",  C:"arroz",   V:"espinacas",S:"ajillo",         cookM:"revuelto", plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico",  P:"huevo",  C:"patata",  V:"pimientos",S:"pimenton_ajo",   cookM:"tortilla", plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico",  P:"ternera",C:"patata",  V:"zanahoria",S:"ajillo",         cookM:"guisado",  plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico",  P:"pollo",  C:"pasta",   V:"tomate",   S:"pimenton_ajo",   cookM:"salteado", plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    {tmpl:"caliente_clasico",  P:"atun",   C:"arroz",   V:"tomate",   S:"limon_hierbas",  cookM:"crudo",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"ensalada",          P:"pollo",  C:"quinoa",  V:"tomate",   V2:"pepino",S:"limon_hierbas",cookM:"plancha",plateType:"ensalada", density:"media", familiar:false, facil:true},
    {tmpl:"caliente_clasico",  P:"merluza",C:"arroz",   V:"espinacas",S:"ajillo",         cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"pasta",             P:"ternera",C:"pasta",   V:"calabacin",S:"tomate_casero",  cookM:"salteado", plateType:"pasta",             density:"alta",  familiar:true,  facil:false},
    {tmpl:"pasta",             P:"pollo",  C:"pasta",   V:"espinacas",S:"ajillo",         cookM:"salteado", plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    {tmpl:"legumbre",          P:"lentejas",C:"arroz",  V:"zanahoria",S:"pimenton_ajo",   cookM:"guisado",  plateType:"legumbre",          density:"alta",  familiar:true,  facil:false},
    {tmpl:"bowl",              P:"atun",   C:"arroz",   V:"pepino",   V2:"tomate",S:"vinagreta",cookM:"crudo",   plateType:"bowl",          density:"media", familiar:true,  facil:true},
    {tmpl:"bowl",              P:"pollo",  C:"boniato", V:"calabacin",S:"pimenton_ajo",   cookM:"horno",    plateType:"bowl",              density:"media", familiar:false, facil:false},
    {tmpl:"caliente_clasico",  P:"sardinas",C:"patata", V:"pimientos",S:"vinagreta",      cookM:"plancha",  plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    // ── Sopa / crema ─────────────────────────────────────────────────────
    {tmpl:"sopa_crema", P:"pollo",   C:null, V:"brocoli",   S:"limon_hierbas", cookM:"plancha",  plateType:"sopa_crema", density:"baja",  familiar:true,  facil:false},
    {tmpl:"sopa_crema", P:"merluza", C:null, V:"brocoli",   S:"limon_hierbas", cookM:"plancha",  plateType:"sopa_crema", density:"baja",  familiar:true,  facil:false},
    {tmpl:"sopa_crema", P:"gambas",  C:null, V:"calabacin", S:"ajillo",        cookM:"plancha",  plateType:"sopa_crema", density:"baja",  familiar:false, facil:false},
    {tmpl:"sopa_crema", P:"huevo",   C:null, V:"espinacas", S:"limon_hierbas", cookM:"plancha",  plateType:"sopa_crema", density:"baja",  familiar:true,  facil:true},
    {tmpl:"sopa_crema", P:"atun",    C:null, V:"tomate",    V2:"pepino",       cookM:"crudo",    plateType:"sopa_crema", density:"baja",  familiar:true,  facil:true},
    {tmpl:"sopa_crema", P:"bacalao", C:null, V:"zanahoria", V2:"calabaza",     S:"ajillo",       cookM:"guisado",        plateType:"sopa_crema", density:"baja",  familiar:true,  facil:false},
    {tmpl:"sopa_crema", P:"huevo",   C:null, V:"tomate",    cookM:"crudo",     plateType:"sopa_crema", density:"baja",  familiar:true,  facil:true},
    // ── Pasta (ampliación) ────────────────────────────────────────────────
    {tmpl:"pasta", P:"gambas",  C:"pasta", V:"tomate",    S:"ajillo",        cookM:"salteado", plateType:"pasta", density:"alta",  familiar:true,  facil:true},
    {tmpl:"pasta", P:"gambas",  C:"pasta", V:"calabacin", S:"ajillo",        cookM:"salteado", plateType:"pasta", density:"alta",  familiar:false, facil:true},
    {tmpl:"pasta", P:"salmon",  C:"pasta", V:"espinacas", S:"limon_hierbas", cookM:"plancha",  plateType:"pasta", density:"alta",  familiar:false, facil:false},
    {tmpl:"pasta", P:"merluza", C:"pasta", V:"calabacin", S:"ajillo",        cookM:"plancha",  plateType:"pasta", density:"alta",  familiar:true,  facil:false},
    {tmpl:"pasta", P:"pavo",    C:"pasta", V:"tomate",    S:"tomate_casero", cookM:"salteado", plateType:"pasta", density:"alta",  familiar:true,  facil:true},
    {tmpl:"pasta", P:"cerdo",   C:"pasta", V:"pimientos", S:"pimenton_ajo",  cookM:"salteado", plateType:"pasta", density:"alta",  familiar:true,  facil:true},
    {tmpl:"pasta", P:"ternera", C:"pasta", V:"berenjena", S:"tomate_casero", cookM:"salteado", plateType:"pasta", density:"alta",  familiar:true,  facil:false},
    // ── Legumbre (ampliación) ─────────────────────────────────────────────
    {tmpl:"legumbre", P:"lentejas",  C:null, V:"espinacas", S:"pimenton_ajo", cookM:"guisado",  plateType:"legumbre", density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre", P:"lentejas",  C:null, V:"pimientos", S:"pimenton_ajo", cookM:"guisado",  plateType:"legumbre", density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre", P:"lentejas",  C:null, V:"calabacin", S:"ajillo",       cookM:"guisado",  plateType:"legumbre", density:"media", familiar:false, facil:false},
    {tmpl:"legumbre", P:"garbanzos", C:null, V:"zanahoria", S:"pimenton_ajo", cookM:"guisado",  plateType:"legumbre", density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre", P:"garbanzos", C:null, V:"tomate",    S:"ajillo",       cookM:"salteado", plateType:"legumbre", density:"media", familiar:true,  facil:true},
    {tmpl:"legumbre", P:"garbanzos", C:null, V:"pimientos", S:"pimenton_ajo", cookM:"guisado",  plateType:"legumbre", density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre", P:"alubias",   C:null, V:"acelgas",   S:"ajillo",       cookM:"guisado",  plateType:"legumbre", density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre", P:"garbanzos", C:null, V:"berenjena", S:"curry_ligero", cookM:"salteado", plateType:"legumbre", density:"baja",  familiar:false, facil:true},
    // ── Bowl (ampliación) ─────────────────────────────────────────────────
    {tmpl:"bowl", P:"salmon",  C:"arroz",  V:"espinacas", S:"soja_jengibre", cookM:"horno",   plateType:"bowl", density:"media", familiar:false, facil:false},
    {tmpl:"bowl", P:"atun",    C:"quinoa", V:"pepino",    V2:"tomate",       S:"vinagreta",   cookM:"crudo",   plateType:"bowl", density:"media", familiar:true,  facil:true},
    {tmpl:"bowl", P:"gambas",  C:"arroz",  V:"pepino",    S:"limon_hierbas", cookM:"plancha", plateType:"bowl", density:"media", familiar:false, facil:true},
    {tmpl:"bowl", P:"ternera", C:"arroz",  V:"tomate",    S:"vinagreta",     cookM:"plancha", plateType:"bowl", density:"media", familiar:false, facil:true},
    {tmpl:"bowl", P:"merluza", C:"quinoa", V:"espinacas", S:"limon_hierbas", cookM:"horno",   plateType:"bowl", density:"media", familiar:false, facil:false},
    {tmpl:"bowl", P:"pavo",    C:"boniato",V:"calabacin", S:"pimenton_ajo",  cookM:"horno",   plateType:"bowl", density:"media", familiar:false, facil:false},
    // ── Ensalada (ampliación) ─────────────────────────────────────────────
    {tmpl:"ensalada", P:"salmon",  C:null,    V:"lechuga",  V2:"pepino",    S:"limon_hierbas", cookM:"plancha", plateType:"ensalada", density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada", P:"pavo",    C:null,    V:"lechuga",  V2:"tomate",    S:"vinagreta",     cookM:"plancha", plateType:"ensalada", density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada", P:"gambas",  C:null,    V:"lechuga",  V2:"tomate",    S:"vinagreta",     cookM:"plancha", plateType:"ensalada", density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada", P:"atun",    C:null,    V:"tomate",   V2:"pepino",    S:"vinagreta",     cookM:"crudo",   plateType:"ensalada", density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada", P:"pollo",   C:"quinoa",V:"pepino",   V2:"zanahoria", S:"limon_hierbas", cookM:"plancha", plateType:"ensalada", density:"media", familiar:false, facil:true},
    // ── Conejo (ampliación) ───────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"conejo",   C:"arroz",  V:"zanahoria", S:"ajillo",        cookM:"guisado",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"conejo",   C:"boniato",V:"espinacas", S:"romero_limon",  cookM:"horno",    plateType:"caliente_boniato", density:"media", familiar:false, facil:false},
    {tmpl:"caliente_clasico", P:"conejo",   C:"arroz",  V:"berenjena", S:"pimenton_ajo",  cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    // ── Dorada (ampliación) ───────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"dorada",   C:"arroz",  V:"calabacin", S:"limon_hierbas", cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    // ── Bacalao (ampliación) ──────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"bacalao",  C:"arroz",  V:"espinacas", S:"ajillo",        cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"bacalao",  C:"boniato",V:"tomate",    S:"pimenton_ajo",  cookM:"horno",    plateType:"caliente_boniato", density:"media", familiar:false, facil:false},
    // ── Berenjena integrada en caliente ───────────────────────────────────
    {tmpl:"caliente_clasico", P:"cerdo",    C:"patata", V:"berenjena", S:"pimenton_ajo",  cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"pavo",     C:"arroz",  V:"berenjena", S:"tomate_casero", cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    // ── Calamares (ampliación) ────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"calamares",C:"arroz",  V:"calabacin", S:"ajillo",        cookM:"salteado", plateType:"caliente_arroz",   density:"alta",  familiar:true,  facil:true},
    // ── Cerdo con verduras de invierno ────────────────────────────────────
    {tmpl:"caliente_clasico", P:"cerdo",    C:"patata", V:"coles",     S:"mostaza_miel",  cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:false, facil:false},
    // ── Puerro ────────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"pollo",   C:"patata",  V:"puerro",     S:"provenzal",     cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"merluza", C:"arroz",   V:"puerro",     S:"limon_hierbas", cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"sopa_crema",       P:"pollo",   C:null,      V:"puerro",     S:"provenzal",     cookM:"guisado",  plateType:"sopa_crema",       density:"baja",  familiar:true,  facil:false},
    // ── Champiñones ──────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"ternera", C:"arroz",   V:"champiñones",S:"ajillo",        cookM:"salteado", plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"pasta",            P:"pollo",   C:"pasta",   V:"champiñones",S:"provenzal",     cookM:"salteado", plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"huevo",   C:"patata",  V:"champiñones",S:"ajillo",        cookM:"revuelto", plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    // ── Espárragos ───────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"salmon",  C:"arroz",   V:"esparragos", S:"limon_hierbas", cookM:"plancha",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"bowl",             P:"pollo",   C:"quinoa",  V:"esparragos", S:"limon_hierbas", cookM:"plancha",  plateType:"bowl",              density:"media", familiar:false, facil:true},
    {tmpl:"ensalada",         P:"gambas",  C:null,      V:"esparragos", V2:"tomate",       S:"vinagreta",    cookM:"plancha", plateType:"ensalada", density:"baja",  familiar:true,  facil:true},
    // ── Alcachofa ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"conejo",  C:"patata",  V:"alcachofa",  S:"limon_hierbas", cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"cerdo",   C:"arroz",   V:"alcachofa",  S:"ajillo",        cookM:"guisado",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre",         P:"garbanzos",C:null,     V:"alcachofa",  S:"limon_hierbas", cookM:"guisado",  plateType:"legumbre",         density:"media", familiar:false, facil:false},
  ].filter(function(m){
    if(noFish    && (PROT[m.P]&&PROT[m.P].isFish))     return false;
    if(noFish    && (PROT[m.P]&&PROT[m.P].isSeafood))  return false;
    if(noMariscos&& (PROT[m.P]&&PROT[m.P].isSeafood))  return false;
    if(noPork    && (PROT[m.P]&&PROT[m.P].isPork))     return false;
    if(noEgg     && (PROT[m.P]&&PROT[m.P].isEgg))      return false;
    if(noLegumes && (PROT[m.P]&&PROT[m.P].isLegume))   return false;
    if(noGluten  && m.tmpl==="pasta")                   return false;
    // HARD RULE: eliminatedFoods — never serve, no exceptions
    if(isEliminated(m.P)) return false;
    if(isEliminated(m.C)) return false;
    return true;
  }).map(function(m){return Object.assign({slot:"Comida"}, m);});

  // ── DINNER COMBOS ─────────────────────────────────────────────────────────
  // Dinners: lower density, veg-forward, no dense carbs unless training day
  const DINNER_COMBOS = [
    // ── Plancha + verdura (classic) ──────────────────────────────────────
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"brocoli",    S:"limon_hierbas", cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"espinacas",  S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"calabacin",  S:"provenzal",     cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"coles",      S:"romero_limon",  cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"pimientos",  S:"pimenton_ajo",  cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"berenjena",  S:"provenzal",     cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:null,  V:"brocoli",    S:"limon_hierbas", cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:null,  V:"judias",     S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:null,  V:"calabacin",  S:"curry_ligero",  cookM:"salteado",plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"ternera", C:null,  V:"espinacas",  S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"ternera", C:null,  V:"pimientos",  S:"romero_limon",  cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"cerdo",   C:null,  V:"brocoli",    S:"mostaza_miel",  cookM:"plancha", plateType:"plancha_verdura", density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"cerdo",   C:null,  V:"pimientos",  S:"ajillo",        cookM:"horno",   plateType:"plancha_verdura", density:"media", saciante:false},
    // ── Pescado ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"merluza", C:null,  V:"judias",     S:"ajillo",        cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"dorada",  C:null,  V:"calabacin",  S:"limon_hierbas", cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"bacalao", C:null,  V:"pimientos",  S:"ajillo",        cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"salmon",  C:null,  V:"espinacas",  S:"limon_hierbas", cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"sardinas",C:null,  V:"tomate",     S:"ajillo",        cookM:"plancha", plateType:"pescado_horno",  density:"baja",  saciante:false},
    // ── Huevo ────────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"espinacas",  S:"ajillo",        cookM:"revuelto",plateType:"huevo_plancha",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"calabacin",  S:"pimenton_ajo",  cookM:"tortilla",plateType:"huevo_plancha",  density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"pimientos",  S:"pimenton_ajo",  cookM:"revuelto",plateType:"huevo_plancha",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"tomate",     S:"ajillo",        cookM:"plancha", plateType:"huevo_plancha",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"zanahoria",  S:"pimenton_ajo",  cookM:"tortilla",plateType:"huevo_plancha",  density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"brocoli",    S:"limon_hierbas", cookM:"revuelto",plateType:"huevo_plancha",  density:"baja",  saciante:false},
    // ── Vida real: platos rápidos y familiares que faltan ─────────────────
    {tmpl:"caliente_clasico", P:"atun",    C:null,  V:"tomate",     S:"vinagreta",     cookM:"crudo",   plateType:"ensalada",       density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"atun",    C:null,  V:"lechuga",    V2:"pepino",       cookM:"crudo",   plateType:"ensalada",       density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:null,  V:"calabacin",  S:"mostaza_miel",  cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"ternera", C:null,  V:"espinacas",  S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"cerdo",   C:null,  V:"brocoli",    S:"mostaza_miel",  cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"merluza", C:null,  V:"calabacin",  S:"limon_hierbas", cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"dorada",  C:null,  V:"judias",     S:"ajillo",        cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"ensalada",         P:"gambas",  C:null,  V:"lechuga",    V2:"tomate",S:"limon_hierbas",cookM:"plancha",plateType:"ensalada",density:"baja",saciante:true},
    // ── Sopa / crema (saciante) ─────────────────────────────────────────
    {tmpl:"sopa_crema",       P:"pollo",   C:null,  V:"calabaza",   S:"provenzal",     cookM:"plancha", plateType:"sopa_crema",     density:"baja",  saciante:true},
    {tmpl:"sopa_crema",       P:"huevo",   C:null,  V:"calabaza",   V2:"zanahoria",    cookM:null,      plateType:"sopa_crema",     density:"baja",  saciante:true},
    {tmpl:"sopa_crema",       P:"huevo",   C:null,  V:"calabacin",  V2:"zanahoria",    cookM:"plancha", plateType:"sopa_crema",     density:"baja",  saciante:true},
    {tmpl:"sopa_crema",       P:"gambas",  C:null,  V:"calabaza",   S:"ajillo",        cookM:"plancha", plateType:"sopa_crema",     density:"baja",  saciante:true},
    {tmpl:"sopa_crema",       P:"atun",    C:null,  V:"tomate",     V2:"pimientos",    cookM:"crudo",   plateType:"sopa_crema",     density:"baja",  saciante:true},
    {tmpl:"sopa_crema",       P:"pollo",   C:null,  V:"zanahoria",  V2:"calabacin",    cookM:"guisado", plateType:"sopa_crema",     density:"baja",  saciante:true},
    // ── Ensalada ─────────────────────────────────────────────────────────
    {tmpl:"ensalada",         P:"pollo",   C:null,  V:"lechuga",    V2:"tomate",S:"vinagreta",cookM:"plancha",plateType:"ensalada",density:"baja",  saciante:true},
    {tmpl:"ensalada",         P:"atun",    C:null,  V:"lechuga",    V2:"pepino",S:"vinagreta",cookM:"crudo",  plateType:"ensalada",density:"baja",  saciante:true},
    {tmpl:"ensalada",         P:"ternera", C:null,  V:"lechuga",    V2:"tomate",S:"vinagreta",cookM:"plancha",plateType:"ensalada",density:"baja",  saciante:true},
    // ── Marisco ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"gambas",  C:null,  V:"calabacin",  S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja", saciante:false},
    {tmpl:"caliente_clasico", P:"calamares",C:null, V:"pimientos",  S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja", saciante:false},
    // ── Conejo en cena ────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"conejo",   C:null, V:"espinacas", S:"ajillo",        cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    // ── Dorada (ampliación) ───────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"dorada",   C:null, V:"espinacas", S:"limon_hierbas", cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    // ── Bacalao (ampliación) ──────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"bacalao",  C:null, V:"espinacas", S:"ajillo",        cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    // ── Berenjena en cena ─────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"ternera",  C:null, V:"berenjena", S:"pimenton_ajo",  cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",     C:null, V:"berenjena", S:"tomate_casero", cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    // ── Calamares (ampliación) ────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"calamares",C:null, V:"calabacin", S:"ajillo",        cookM:"salteado",plateType:"plancha_verdura", density:"baja",  saciante:false},
    // ── Cerdo con verduras de invierno ────────────────────────────────────
    {tmpl:"caliente_clasico", P:"cerdo",    C:null, V:"coles",     S:"mostaza_miel",  cookM:"horno",   plateType:"plancha_verdura", density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"cerdo",    C:null, V:"acelgas",   S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    // ── Puerro ────────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"pollo",    C:null, V:"puerro",    S:"provenzal",     cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"sopa_crema",       P:"pollo",    C:null, V:"puerro",    V2:"zanahoria",    cookM:"guisado", plateType:"sopa_crema",      density:"baja",  saciante:true},
    // ── Champiñones ──────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"ternera",  C:null, V:"champiñones",S:"ajillo",       cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",    C:null, V:"champiñones",S:"provenzal",    cookM:"salteado",plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",    C:null, V:"champiñones",S:"ajillo",       cookM:"revuelto",plateType:"huevo_plancha",   density:"baja",  saciante:false},
    // ── Espárragos ───────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"salmon",   C:null, V:"esparragos",S:"limon_hierbas", cookM:"plancha", plateType:"pescado_horno",   density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",    C:null, V:"esparragos",S:"ajillo",        cookM:"plancha", plateType:"huevo_plancha",   density:"baja",  saciante:false},
    // ── Alcachofa ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"conejo",   C:null, V:"alcachofa", S:"ajillo",        cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"merluza",  C:null, V:"alcachofa", S:"limon_hierbas", cookM:"horno",   plateType:"pescado_horno",   density:"baja",  saciante:false},
    // ── Cenas caliente con carbohidrato — densidad media, ≥2 carbs por proteína ──
    // Pollo
    {tmpl:"caliente_clasico", P:"pollo",   C:"arroz",  V:"brocoli",    S:"limon_hierbas", cookM:"plancha", plateType:"caliente_arroz",  density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"pollo",   C:"patata", V:"espinacas",  S:"ajillo",        cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"pollo",   C:"boniato",V:"pimientos",  S:"provenzal",     cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Pavo
    {tmpl:"caliente_clasico", P:"pavo",    C:"arroz",  V:"calabacin",  S:"curry_ligero",  cookM:"salteado",plateType:"caliente_arroz",  density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"pavo",    C:"patata", V:"judias",     S:"ajillo",        cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"pavo",    C:"boniato",V:"espinacas",  S:"mostaza_miel",  cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Ternera
    {tmpl:"caliente_clasico", P:"ternera", C:"patata", V:"pimientos",  S:"romero_limon",  cookM:"plancha", plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"ternera", C:"arroz",  V:"champiñones",S:"ajillo",        cookM:"plancha", plateType:"caliente_arroz",  density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"ternera", C:"boniato",V:"brocoli",    S:"pimenton_ajo",  cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Cerdo
    {tmpl:"caliente_clasico", P:"cerdo",   C:"patata", V:"coles",      S:"mostaza_miel",  cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"cerdo",   C:"arroz",  V:"pimientos",  S:"ajillo",        cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Merluza
    {tmpl:"caliente_clasico", P:"merluza", C:"patata", V:"judias",     S:"limon_hierbas", cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"merluza", C:"arroz",  V:"calabacin",  S:"ajillo",        cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Bacalao
    {tmpl:"caliente_clasico", P:"bacalao", C:"patata", V:"pimientos",  S:"ajillo",        cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"bacalao", C:"arroz",  V:"espinacas",  S:"limon_hierbas", cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Salmón
    {tmpl:"caliente_clasico", P:"salmon",  C:"arroz",  V:"esparragos", S:"limon_hierbas", cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"salmon",  C:"patata", V:"espinacas",  S:"limon_hierbas", cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    // Dorada
    {tmpl:"caliente_clasico", P:"dorada",  C:"patata", V:"calabacin",  S:"limon_hierbas", cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"dorada",  C:"arroz",  V:"judias",     S:"ajillo",        cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Conejo
    {tmpl:"caliente_clasico", P:"conejo",  C:"patata", V:"espinacas",  S:"romero_limon",  cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"conejo",  C:"arroz",  V:"champiñones",S:"ajillo",        cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
  ].filter(function(m){
    if(!m.P) return true;
    if(noFish    && (PROT[m.P]&&(PROT[m.P].isFish||PROT[m.P].isSeafood))) return false;
    if(noMariscos&& (PROT[m.P]&&PROT[m.P].isSeafood))  return false;
    if(noPork    && (PROT[m.P]&&PROT[m.P].isPork))     return false;
    if(noEgg     && (PROT[m.P]&&PROT[m.P].isEgg))      return false;
    // HARD RULE: eliminatedFoods — no exceptions
    if(isEliminated(m.P)) return false;
    return true;
  }).map(function(m){return Object.assign({slot:"Cena"}, m);});

  // ── BREAKFAST COMBOS ──────────────────────────────────────────────────────
  const BF_PORTIONS = {
    fat_loss_general:          {avena:50, pan:50, huevos:2, claras:4},
    definicion_saciante:       {avena:50, pan:50, huevos:2, claras:3},
    definicion_flexible:       {avena:45, pan:45, huevos:2, claras:4},
    mantenimiento_equilibrado: {avena:55, pan:60, huevos:3, claras:4},
    volumen_limpio:            {avena:65, pan:70, huevos:4, claras:5},
    volumen_agresivo:          {avena:75, pan:80, huevos:4, claras:6},
  };

  const bfP =
    BF_PORTIONS[strategy] ||
    BF_PORTIONS.mantenimiento_equilibrado;

  const BF = {
    avenaFresas:    function(){return {time:"Desayuno",emoji:"🌅",title:"Avena caliente con fresas"+(noNuts?"":" y nueces"),
      p1:"Avena ("+bfP.avena+"g) cocida con "+milk+" · 100g fresas"+(noNuts?"":" · 20g nueces"),
      p2:yogur+" · canela · Café o té",
      shopping:["Avena ("+bfP.avena+"g)","Leche o bebida vegetal (200ml)","Fresas (100g)",(noNuts?"":"Nueces (20g)"),"Yogur griego 0% (125g)","Canela"].filter(Boolean),
      recipe:["Calienta la leche a fuego medio.","Añade la avena y remueve 5 min.","Trocea las fresas, añádelas encima.",(noNuts?"":"Añade las nueces."),"Sirve con el yogur aparte y canela."].filter(Boolean),
      metadata:{facilidad:"alta",tiempo:8,familiar:true}};},
    avenaFrio:      function(){return {time:"Desayuno",emoji:"🌅",title:"Avena overnight con fruta"+(noNuts?"":" y pistachos"),
      p1:"Avena ("+bfP.avena+"g) + "+yogur+" + 100g fruta de temporada"+(noNuts?"":" + 20g pistachos")+" · preparar noche anterior",
      p2:"Canela · Café o té",
      shopping:["Avena ("+bfP.avena+"g)","Yogur griego 0% (125g)","Fruta de temporada (100g)",(noNuts?"":"Pistachos (20g)"),"Canela"].filter(Boolean),
      recipe:["Noche anterior: mezcla avena y yogur en bote.","Trocea la fruta y añade encima.","Tapa y refrigera 8h mínimo.","Por la mañana añade pistachos y canela.",(noNuts?"":"Consume frío.")].filter(Boolean),
      metadata:{facilidad:"alta",tiempo:2,familiar:true}};},
    tostadas:       function(){return {time:"Desayuno",emoji:"🌅",title:"Tostadas con tomate y jamón",
      p1:"2 rebanadas pan de centeno ("+bfP.pan+"g) · tomate rallado (70g) · AOVE",
      p2:"2 lonchas jamón serrano (40g) · "+yogur,
      shopping:["Pan de centeno ("+bfP.pan+"g)","Tomate maduro (1 ud)","Jamón serrano (40g)","Yogur griego 0% (125g)","AOVE"],
      recipe:["Tuesta el pan.","Ralla el tomate maduro encima.","Añade AOVE y sal.","Coloca el jamón.","Sirve el yogur aparte."],
      metadata:{facilidad:"alta",tiempo:5,familiar:true}};},
    huevosTostada:  function(){return {time:"Desayuno",emoji:"🌅",title:"Huevos revueltos con tostada y fruta",
      p1:bfP.huevos+" huevos revueltos con pizca de sal y pimienta · ½ cda AOVE",
      p2:"1 tostada pan integral ("+bfP.pan+"g) · "+yogur+" · 1 pieza fruta de temporada",
      shopping:["Huevos ("+bfP.huevos+" ud)","Pan integral ("+bfP.pan+"g)","Yogur griego 0% (125g)","AOVE","Fruta de temporada (1 ud)"],
      recipe:["Bate los huevos con sal y pimienta.","Calienta la sartén con AOVE a fuego medio.","Añade los huevos y remueve despacio 2-3 min.","Tuesta el pan.","Sirve los huevos encima o al lado, con la fruta troceada."],
      metadata:{facilidad:"alta",tiempo:6,familiar:true}};},
    huevoAguacate:  function(){return {time:"Desayuno",emoji:"🌅",title:"Tostada con aguacate y huevo poché",
      p1:"1 rebanada pan integral ("+bfP.pan+"g) tostada · ½ aguacate maduro chafado",
      p2:"1 huevo poché · sal, pimienta y limón · Café",
      shopping:["Pan integral ("+bfP.pan+"g)","Aguacate (1 ud)","Huevos (1 ud)","Limón (½)","Sal y pimienta"],
      recipe:["Tuesta el pan.","Chafa el aguacate con limón y sal.","Para el huevo poché: hierve agua con un chorrito de vinagre, crea un remolino y cuece el huevo 3 min.","Extiende el aguacate sobre la tostada.","Coloca el huevo encima."],
      metadata:{facilidad:"media",tiempo:10,familiar:true}};},
    tostadaSalmon:  function(){return {time:"Desayuno",emoji:"🌅",title:"Tostada con salmón ahumado y queso",
      p1:"2 tostadas pan de centeno ("+bfP.pan+"g) · 60g salmón ahumado",
      p2:"30g queso crema light · alcaparras · eneldo · Café o té",
      shopping:["Pan de centeno ("+bfP.pan+"g)","Salmón ahumado (60g)","Queso crema light (30g)","Alcaparras","Eneldo"],
      recipe:["Tuesta el pan ligeramente.","Extiende el queso crema.","Coloca el salmón encima.","Añade alcaparras y eneldo.","Sirve inmediatamente."],
      metadata:{facilidad:"alta",tiempo:4,familiar:true}};},
    revueltoVerduras:function(){return {time:"Desayuno",emoji:"🌅",title:"Revuelto de espinacas y tomate",
      p1:bfP.huevos+" huevos revueltos · 60g espinacas frescas salteadas · 60g tomate cherry",
      p2:"1 tostada pan integral ("+bfP.pan+"g) · "+yogur+" · sal, pimienta, orégano",
      shopping:["Huevos ("+bfP.huevos+" ud)","Espinacas frescas (60g)","Tomate cherry (60g)","Pan integral ("+bfP.pan+"g)","Yogur griego 0% (125g)","AOVE"],
      recipe:["Saltea las espinacas con AOVE y ajo 2 min.","Añade el tomate cherry cortado.","Bate los huevos, añade al wok.","Remueve a fuego medio hasta cuajar suave.","Sirve sobre la tostada con el yogur aparte."],
      metadata:{facilidad:"media",tiempo:8,familiar:true}};},
    yogurGranola:   function(){return {time:"Desayuno",emoji:"🌅",title:"Bol de yogur con granola y fruta",
      p1:"200g "+yogur+" · "+bfP.avena+"g granola sin azúcar añadido · 100g fruta de temporada",
      p2:"1 cda miel · Café o té",
      shopping:["Yogur griego 0% (200g)","Granola ("+bfP.avena+"g) — comprueba que sea sin gluten si lo necesitas","Fruta de temporada (100g)","Miel (1 cda)"],
      recipe:["Vierte el yogur en un bol.","Trocea la fruta y colócala encima.","Añade la granola.","Rocía con miel.","Consume inmediatamente para que la granola cruja."],
      metadata:{facilidad:"alta",tiempo:3,familiar:true}};},
    tortitasAvena:  function(){return {time:"Desayuno",emoji:"🌅",title:"Tortitas de avena y plátano",
      p1:"Avena (60g) + 1 plátano + 2 huevos · triturado y cocinado",
      p2:yogur+" · 1 cda miel · Café",
      shopping:["Avena (60g)","Plátano (1 ud)","Huevos (2 ud)","Yogur griego 0% (125g)","Miel (1 cda)"],
      recipe:["Tritura avena, plátano y huevos hasta masa homogénea.","Calienta sartén antiadherente a fuego medio con unas gotas AOVE.","Vierte círculos de masa y cocina 2 min por lado.","Sirve con yogur y miel.","Puedes preparar la masa la noche anterior."],
      metadata:{facilidad:"media",tiempo:12,familiar:true}};},
    muesliYogur:    function(){return {time:"Desayuno",emoji:"🌅",title:"Muesli con yogur y frutos secos",
      p1:bfP.avena+"g muesli sin azúcar añadido · "+yogur+" · 80g fruta fresca",
      p2:(noNuts?"Semillas de lino (8g)":"15g almendras o nueces")+" · Café o té",
      shopping:["Muesli sin azúcar ("+bfP.avena+"g)","Yogur griego 0% (125g)","Fruta fresca (80g)",(noNuts?"Semillas de lino (8g)":"Almendras (15g)")].filter(Boolean),
      recipe:["Vierte el muesli en un bol.","Añade el yogur.","Trocea la fruta y coloca encima.","Añade los frutos secos."+(noNuts?" Sustituye por semillas de lino":""),"Deja reposar 1-2 min para que el muesli se ablande ligeramente."],
      metadata:{facilidad:"alta",tiempo:3,familiar:true}};},
  };

  // ── DESAYUNOS SIN GLUTEN — alternativas cuando noGluten=true ─────────────
  const BF_SG = {
    claras_tortillaSG:function(){return {time:"Desayuno",emoji:"🌅",title:"Claras a la plancha con espinacas, tomate y fruta",
      p1:bfP.claras+" claras de huevo · 60g espinacas · 1 tomate en rodajas",
      p2:yogur+" · 1 pieza fruta de temporada · AOVE, ajo en polvo · Café o té",
      shopping:["Claras de huevo ("+bfP.claras+" ud o brik)","Espinacas frescas (60g)","Tomate (1 ud)","Yogur griego 0% (125g)","Fruta de temporada (1 ud)","AOVE","Ajo en polvo"],
      recipe:["Saltea las espinacas en sartén con AOVE y ajo en polvo 2 min.","Retira y reserva.","Bate las claras con sal y pimienta.","Cuaja las claras a fuego medio removiendo suave.","Sirve con las espinacas, el tomate crudo en rodajas, el yogur y la fruta."],
      metadata:{facilidad:"alta",tiempo:7,familiar:false}};},

    macedoniaProtSG:  function(){return {time:"Desayuno",emoji:"🌅",title:"Macedonia con yogur y semillas",
      p1:"200g mezcla de frutas frescas · 150g "+yogur,
      p2:"1 cda semillas de calabaza · zumo de ½ limón · miel · Café",
      shopping:["Frutas frescas variadas (200g)","Yogur griego 0% (150g)","Semillas de calabaza (10g)","Limón (½ ud)","Miel (1 cda)"],
      recipe:["Trocea las frutas en dados del mismo tamaño.","Aliña con zumo de limón y miel.","Sirve en bol con el yogur encima.","Esparce las semillas de calabaza.","Puede prepararse la noche anterior sin el yogur."],
      metadata:{facilidad:"alta",tiempo:5,familiar:true}};},

    bolChia: function(){return {time:"Desayuno",emoji:"🌅",title:"Bol de chía con frutas del bosque",
      p1:"150g "+yogur+" · 2 cdas semillas de chía · 100g frutas del bosque",
      p2:"1 cda miel · canela al gusto · Café o té",
      shopping:["Yogur griego 0% (150g)","Semillas de chía (20g)","Frutas del bosque (100g)","Miel (1 cda)"],
      recipe:["Mezcla el yogur con las semillas de chía.","Deja reposar 5 minutos (o prepara la noche anterior).","Añade las frutas por encima.","Aliña con miel y canela al gusto."],
      metadata:{facilidad:"alta",tiempo:5,familiar:false}};},

    yogurSemillas: function(){return {time:"Desayuno",emoji:"🌅",title:"Yogur con semillas y fruta",
      p1:"200g "+yogur+" · 1 cda semillas de lino · 1 cda semillas de calabaza",
      p2:"1 pieza fruta troceada · miel · Café o té",
      shopping:["Yogur griego 0% (200g)","Semillas de lino (10g)","Semillas de calabaza (10g)","Fruta (1 ud)","Miel (1 cda)"],
      recipe:["Vierte el yogur en un bol.","Esparce las semillas por encima.","Añade la fruta troceada.","Aliña con miel al gusto."],
      metadata:{facilidad:"alta",tiempo:3,familiar:true}};},

    batiProteicoSG: function(){return {time:"Desayuno",emoji:"🌅",title:"Batido proteico con plátano",
      p1:"250ml leche o bebida vegetal · 1 plátano maduro · 150g "+yogur,
      p2:"1 cda mantequilla de cacahuete · canela · Café o té",
      shopping:["Leche o bebida vegetal (250ml)","Plátano (1 ud)","Yogur griego 0% (150g)","Mantequilla de cacahuete (15g)"],
      recipe:["Pon todos los ingredientes en el vaso de la batidora.","Tritura hasta obtener una mezcla homogénea.","Sirve frío inmediatamente.","Puedes añadir hielo si lo prefieres más fresco."],
      metadata:{facilidad:"alta",tiempo:3,familiar:false}};},

    huevosAguacateSG: function(){return {time:"Desayuno",emoji:"🌅",title:"Huevos revueltos con aguacate",
      p1:bfP.huevos+" huevos · ½ aguacate maduro",
      p2:"AOVE, sal y pimienta · Café o té",
      shopping:["Huevos ("+bfP.huevos+" ud)","Aguacate (1 ud)","AOVE"],
      recipe:["Bate los huevos con sal y pimienta.","Cuaja a fuego lento removiendo constantemente.","Corta el aguacate en láminas.","Sirve los huevos con el aguacate al lado."],
      metadata:{facilidad:"alta",tiempo:7,familiar:true}};},

    tortillaDulce: function(){return {time:"Desayuno",emoji:"🌅",title:"Tortilla de claras con plátano",
      p1:"4 claras de huevo · 1 plátano pequeño",
      p2:"canela · 1 cda miel · Café o té",
      shopping:["Claras de huevo (4 ud o brik)","Plátano (1 ud)","Canela","Miel (1 cda)"],
      recipe:["Bate las claras con canela.","Cuaja en sartén antiadherente a fuego medio.","Dobla la tortilla.","Sirve con el plátano en rodajas y miel por encima."],
      metadata:{facilidad:"alta",tiempo:7,familiar:false}};},

    huevosJamonSG: function(){return {time:"Desayuno",emoji:"🌅",title:"Huevos a la plancha con jamón y fruta",
      p1:bfP.huevos+" huevos · 40g jamón serrano o pavo",
      p2:"1 pieza fruta de temporada · AOVE, sal y pimienta · Café o té",
      shopping:["Huevos ("+bfP.huevos+" ud)","Jamón serrano o pavo (40g)","Fruta de temporada (1 ud)","AOVE"],
      recipe:["Calienta la sartén con unas gotas de AOVE.","Cocina los huevos al gusto (plancha o revuelto).","Calienta el jamón brevemente en la sartén.","Sirve juntos con sal y pimienta y la fruta al lado."],
      metadata:{facilidad:"alta",tiempo:6,familiar:true}};},

    smoothieBol: function(){return {time:"Desayuno",emoji:"🌅",title:"Smoothie bol de frutas",
      p1:"150g frutas congeladas (mango, plátano o frutos rojos) · 100g "+yogur,
      p2:"1 cda semillas de calabaza · 1 cda coco rallado · Café o té",
      shopping:["Frutas congeladas (150g)","Yogur griego 0% (100g)","Semillas de calabaza (10g)","Coco rallado (10g)"],
      recipe:["Tritura las frutas congeladas con el yogur hasta textura espesa.","Vierte en un bol.","Decora con semillas y coco rallado.","Sirve inmediatamente — se derrite rápido."],
      metadata:{facilidad:"alta",tiempo:5,familiar:false}};},

    quesoCottonFruta: function(){return {time:"Desayuno",emoji:"🌅",title:"Queso fresco con fruta y miel",
      p1:"200g queso fresco batido (tipo Skyr o Quark) · 150g fruta de temporada",
      p2:"1 cda miel · canela · Café o té",
      shopping:["Queso fresco batido tipo Skyr (200g)","Fruta de temporada (150g)","Miel (1 cda)","Canela"],
      recipe:["Vierte el queso en un bol.","Trocea la fruta y colócala encima.","Aliña con miel y canela.","Listo en 2 minutos — ideal para días con prisa."],
      metadata:{facilidad:"alta",tiempo:2,familiar:true}};},
  };

  // ── SNACKS ────────────────────────────────────────────────────────────────
  const SNACKS_AM = [
    {time:"Almuerzo",emoji:"🍎",title:"Fruta con frutos secos",
      p1:"1 pieza fruta de temporada (manzana, pera, naranja o kiwi)",
      p2:(noNuts?"15g semillas de girasol":"20g nueces o almendras")+" · Té o agua",
      shopping:["Fruta (1 ud)",(noNuts?"Semillas de girasol (15g)":"Nueces o almendras (20g)")].filter(Boolean),
      recipe:["Lava y trocea la fruta.","Sirve con los frutos secos aparte.","Ideal para llevar en un táper."],
      metadata:{facilidad:"alta",tiempo:1,familiar:true},
      _spec:{recomposable:false}},
    {time:"Almuerzo",emoji:"🥛",title:"Yogur con fruta",
      p1:yogur+" · 80g fruta de temporada",
      p2:"1 cda miel · canela opcional",
      shopping:["Yogur griego 0% (125g)","Fruta (80g)","Miel (1 cda)"],
      recipe:["Vierte el yogur.","Trocea la fruta encima.","Añade miel y canela."],
      metadata:{facilidad:"alta",tiempo:2,familiar:true},
      _spec:{recomposable:false}},
  ];
  const SNACKS_PM = [
    {time:"Merienda",emoji:"🥛",title:"Merienda proteica",
      p1:""+yogur+" · 1 puñado frutos rojos (80g)"+(noNuts?"":" · 15g almendras"),
      p2:"Té o infusión",
      shopping:["Yogur griego 0% (125g)","Frutos rojos (80g)",(noNuts?"":"Almendras (15g)")].filter(Boolean),
      recipe:["Mezcla el yogur con los frutos rojos.",(noNuts?"":"Añade las almendras por encima."),"Sirve frío."].filter(Boolean),
      metadata:{facilidad:"alta",tiempo:2,familiar:true},
      _spec:{recomposable:false}},
    {time:"Merienda",emoji:"🍌",title:"Fruta con proteína",
      p1:"1 pieza fruta (plátano, kiwi o naranja)",
      p2:(noNuts?"":"20g cacahuetes naturales · ")+"Té o agua",
      shopping:["Fruta (1 ud)",(noNuts?"":"Cacahuetes naturales (20g)")].filter(Boolean),
      recipe:["Pela la fruta.","Sirve con los cacahuetes aparte.","Comer despacio para maximizar saciedad."].filter(Boolean),
      metadata:{facilidad:"alta",tiempo:1,familiar:true},
      _spec:{recomposable:false}},
  ];

  // ── TRAINING DINNERS (post-workout recovery) ──────────────────────────────
  const TRAINING_DINNERS = [
    {tmpl:"caliente_clasico", P:"pollo",   C:"arroz",   V:"brocoli",  S:"pimenton_ajo",  cookM:"plancha", slot:"Cena 🏋️",
     emoji:"🏋️", title:"Post-entreno: Pollo con arroz y brócoli",
     plateType:"caliente_arroz", density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"ternera", C:"patata",  V:"espinacas",S:"romero_limon",  cookM:"plancha", slot:"Cena 🏋️",
     emoji:"🏋️", title:"Post-entreno: Ternera con patata",
     plateType:"caliente_patata", density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:"boniato", V:"judias",   S:"curry_ligero",  cookM:"plancha", slot:"Cena 🏋️",
     emoji:"🏋️", title:"Post-entreno: Pavo con boniato",
     plateType:"caliente_boniato", density:"media", saciante:false},
  ];

  // ── POOL DERIVATION FROM COMBOS ───────────────────────────────────────────
  // Pools wrap combos with protein/plateType keys for smartPick scoring.
  // Each entry: {protein, plateType, density, saciante, familiar, facil, build()}

  // ── SISTEMA DE APETENCIA ──────────────────────────────────────────────────
  // Cada plato tiene tres puntuaciones latentes que describen su "feel":
  //   comfortScore  (0–3): calidez emocional — el guiso de la abuela, la sopa, el horno
  //   freshnessScore(0–3): ligereza — ensaladas, bowl, crudo, pescado, limón
  //   cravingScore  (0–3): memorabilidad — "¿me apetece esto?" — salsas potentes, platos icónicos
  // Se derivan automáticamente de las propiedades del combo.
  function computeApetencia(combo) {
    var tmpl  = combo.tmpl  || "";
    var cookM = combo.cookM || "";
    var sauce = combo.S     || "";
    var prot  = combo.P     || "";

    // comfortScore: calor emocional, cocina lenta, familiar
    var comfort = 0;
    if(tmpl==="sopa_crema")                                     comfort += 3;
    if(tmpl==="legumbre")                                       comfort += 2;
    if(cookM==="guisado")                                       comfort += 2;
    if(cookM==="horno" && combo.familiar)                       comfort += 1;
    if(sauce==="tomate_casero" || sauce==="pimenton_ajo")       comfort += 1;
    if(combo.familiar)                                          comfort += 1;
    comfort = Math.min(3, Math.round(comfort));

    // freshnessScore: ligereza, frescura, energía limpia
    var freshness = 0;
    if(tmpl==="ensalada")                                       freshness += 3;
    if(tmpl==="bowl")                                           freshness += 2;
    if(cookM==="crudo")                                         freshness += 2;
    if(cookM==="plancha" && !combo.familiar)                    freshness += 1;
    if(sauce==="limon_hierbas" || sauce==="vinagreta")          freshness += 1;
    if(prot && PROT[prot] && (PROT[prot].isFish||PROT[prot].isSeafood)) freshness += 1;
    freshness = Math.min(3, Math.round(freshness));

    // cravingScore: memorabilidad — "¿me apetece esto de verdad?"
    var craving = 0;
    if(sauce==="mostaza_miel" || sauce==="soja_jengibre")       craving += 2;
    if(sauce==="curry_ligero" || sauce==="ajillo")              craving += 1;
    if(tmpl==="pasta")                                          craving += 2;
    if(prot==="salmon"||prot==="gambas"||prot==="calamares")    craving += 1;
    if(prot==="conejo"||prot==="sardinas"||prot==="bacalao")    craving += 1;
    if(cookM==="guisado" && tmpl!=="legumbre")                  craving += 1;
    if(sauce==="romero_limon" && cookM==="horno")               craving += 1;
    craving = Math.min(3, Math.round(craving));

    return {comfort:comfort, freshness:freshness, craving:craving};
  }

  function comboToPoolEntry(combo) {
    var protKey = combo.P ? combo.P : (combo.tmpl==="legumbre"?"legumbre":"verdura");
    // Map protein families so weekly caps and same-day checks work by family
    if(PROT[combo.P] && PROT[combo.P].isLegume)   protKey = "legumbre";
    if(PROT[combo.P] && PROT[combo.P].isSeafood)  protKey = "marisco";
    if(PROT[combo.P] && PROT[combo.P].isFish)     protKey = "pescado"; // FIX: fish cap was never triggered
    // Derive culinary style from sauce, or from template type
    var sauceStyle = combo.S && SAUCE[combo.S] ? SAUCE[combo.S].style : null;
    var tmplStyle  = combo.tmpl==="bowl"    ? (combo.S==="soja_jengibre"||combo.S==="curry_ligero" ? "asiatico" : "moderno")
                   : combo.tmpl==="pasta"   ? "italiano"
                   : combo.tmpl==="legumbre"? "casero"
                   : combo.tmpl==="ensalada"? "mediterraneo"
                   : combo.tmpl==="sopa_crema" ? "casero"
                   : null;
    var ap  = computeApetencia(combo);
    var cxp = deriveCuisineExperience(combo);
    var tmp = deriveTempFeel(combo);
    return {
      protein:          protKey,
      plateType:        combo.plateType || "caliente_arroz",
      density:          combo.density   || "media",
      saciante:         combo.saciante  || false,
      familiar:         combo.familiar  || false,
      facil:            combo.facil     || false,
      sauce:            combo.S         || null,
      cookM:            combo.cookM     || null,
      veggie:           combo.V         || null,
      culinaryStyle:    sauceStyle || tmplStyle || "casero",
      cuisineExperience:cxp,
      tempFeel:         tmp,
      apetencia:        ap,
      build:            function(){ return composeMeal(combo); },
    };
  }

  // ── INFLATE FREEFORM v3.1 → POOL ENTRY ─────────────────────────────
  //
  // Adapta un combo freeForm al formato esperado por smartPick.
  //
  // Este patch NO añade scoring nuevo.
  // Solo crea compatibilidad estructural.
  //
  // La fuente de verdad completa viaja en _spec para futuros prompts
  // (Prompt 2B leerá behavior.satietyScore, digestiveLoad,
  // trainingProfile, etc).
  //
  // Los campos legacy sin equivalente directo se dejan en null.
  // Su comportamiento dependerá de las reglas existentes de smartPick.
  //
  // NO introducir inferencias nuevas aquí.
  //
  function inflateFreeFormForPool(combo) {
    // ── Filtro intolerancias freeForm (v3.2) ─────────────────────
    // noGluten y noLactosa vienen del closure de buildPlan,
    // igual que en el sistema legacy.
    // El campo puede ser undefined en combos v3.1 (sin auditar):
    // la comparación === true es deliberada para no excluir
    // combos que no declaran el campo.
    if (noGluten  && combo.identity.containsGluten  === true
        && combo.identity.glutenFreeAdaptable !== true) return null;
    if (noLactosa && combo.identity.containsLactosa === true) return null;
    // ── fin filtro intolerancias ──────────────────────────────────
    var id  = combo.identity  || {};
    var nut = combo.nutrition || {};
    var beh = combo.behavior  || {};

    return {
      // Campos usados por smartPick
      protein:           id.protein || null,
      type:              id.proteinType || null,
      plateType:         id.plateType || null,
      density:           nut.energyDensity || null,
      familiar:          (typeof beh.familiar !== "undefined")
                            ? beh.familiar
                            : null,

      // NO inferir scoring nuevo en este prompt
      facil:             null,
      saciante:          null,

      // Campos legacy sin equivalente estructural
      sauce:             null,
      cookM:             null,
      veggie:            null,
      culinaryStyle:     null,
      cuisineExperience: null,
      tempFeel:          null,
      apetencia:         null,

      // Build
      build: function() {
        return composeMeal(combo);
      },

      // Fuente de verdad v3.1
      _spec: Object.assign({}, combo, {
        freeForm: true
      })
    };
  }

  let lunchPool  = LUNCH_COMBOS.map(comboToPoolEntry);
  let dinnerPool = DINNER_COMBOS.map(comboToPoolEntry);

  // ── INJECT FREEFORM v3.1 INTO POOLS ───────────────────────────────
  //
  // Los combos freeForm conviven con los legacy.
  // smartPick sigue usando scoring legacy para todos.
  //
  // Distribución:
  //
  //   ["C"]        → lunchPool
  //   ["Ce"]       → dinnerPool
  //   ["C","Ce"]   → ambos
  //   ["Al"]       → NO inyectado todavía
  //
  // IMPORTANTE:
  // NO reutilizar la misma referencia de entry entre pools.
  // Cada pool recibe su propia entry independiente.
  //
  (function injectFreeFormIntoPools() {

    if (
      typeof FREEFORM_POOL === "undefined" ||
      !Array.isArray(FREEFORM_POOL)
    ) {
      return;
    }

    for (var i = 0; i < FREEFORM_POOL.length; i++) {

      var combo = FREEFORM_POOL[i];

      if (
        !combo ||
        !combo.behavior ||
        !Array.isArray(combo.behavior.slot)
      ) {
        continue;
      }

      var slots = combo.behavior.slot;

      if (slots.indexOf("C") >= 0) {
        var _lff = inflateFreeFormForPool(combo);
        if (_lff !== null) lunchPool.push(_lff);
      }

      if (slots.indexOf("Ce") >= 0) {
        var _dff = inflateFreeFormForPool(combo);
        if (_dff !== null) dinnerPool.push(_dff);
      }

      // slot "Al" NO se integra todavía
    }

  })();

  // ── SATURDAY FREE MEAL ────────────────────────────────────────────────────
  function libreComida(){
    return {time:"Comida",emoji:"🎉",title:"Comida libre 🎉",
      p1:"Hoy comes lo que más te apetezca — es parte del plan, no una trampa.",
      p2:"Intenta terminar cuando estés satisfecho, no lleno.",
      shopping:["Lo que tú elijas hoy"],
      recipe:["Disfruta sin culpa.","La flexibilidad integrada mejora la adherencia a largo plazo.","Vuelves al plan mañana sin dramas."],
      metadata:{facilidad:"alta",tiempo:0,familiar:true},
      _spec:{recomposable:false,isFree:true}};
  }

  // ── BREAKFAST POOL (anti-repetition + gluten/egg/fish aware) ────────────
  // Cada entrada: {key, fn, containsGluten, needsEgg, needsFish, sauce, cookM, veggie, protein}
  // REGLA: containsGluten=true → excluido si noGluten. Sin excepciones.
  var ALL_BF_ENTRIES = [
    // CON GLUTEN — solo aparecen si !noGluten
    {key:"avenaFresas",     fn:BF.avenaFresas,        containsGluten:true,  needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_avena"},
    {key:"avenaFrio",       fn:BF.avenaFrio,           containsGluten:true,  needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_avena"},
    {key:"tostadas",        fn:BF.tostadas,            containsGluten:true,  needsEgg:false, needsFish:false, sauce:null,      cookM:"plancha",  veggie:null,        protein:"bf_jamon"},
    {key:"huevosTostada",   fn:BF.huevosTostada,       containsGluten:true,  needsEgg:true,  needsFish:false, sauce:null,      cookM:"revuelto", veggie:null,        protein:"huevo"},
    {key:"huevoAguacate",   fn:BF.huevoAguacate,       containsGluten:true,  needsEgg:true,  needsFish:false, sauce:null,      cookM:"plancha",  veggie:null,        protein:"huevo"},
    {key:"tostadaSalmon",   fn:BF.tostadaSalmon,       containsGluten:true,  needsEgg:false, needsFish:true,  sauce:null,      cookM:null,       veggie:null,        protein:"salmon"},
    {key:"revueltoVerduras",fn:BF.revueltoVerduras,    containsGluten:true,  needsEgg:true,  needsFish:false, sauce:"ajillo",  cookM:"revuelto", veggie:"espinacas", protein:"huevo"},
    {key:"yogurGranola",    fn:BF.yogurGranola,        containsGluten:true,  needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"tortitasAvena",   fn:BF.tortitasAvena,       containsGluten:true,  needsEgg:true,  needsFish:false, sauce:null,      cookM:"plancha",  veggie:null,        protein:"huevo"},
    {key:"muesliYogur",     fn:BF.muesliYogur,         containsGluten:true,  needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    // SIN GLUTEN — siempre disponibles (o cuando noGluten)
    {key:"bolChia",         fn:BF_SG.bolChia,          containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"yogurSemillas",   fn:BF_SG.yogurSemillas,    containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"batiProteicoSG",  fn:BF_SG.batiProteicoSG,  containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"huevosAguacateSG",fn:BF_SG.huevosAguacateSG,containsGluten:false, needsEgg:true,  needsFish:false, sauce:null,      cookM:"revuelto", veggie:null,        protein:"huevo"},
    {key:"tortillaDulce",   fn:BF_SG.tortillaDulce,   containsGluten:false, needsEgg:true,  needsFish:false, sauce:null,      cookM:"plancha",  veggie:null,        protein:"huevo"},
    {key:"huevosJamonSG",   fn:BF_SG.huevosJamonSG,  containsGluten:false, needsEgg:true,  needsFish:false, sauce:null,      cookM:"plancha",  veggie:null,        protein:"bf_jamon"},
    {key:"smoothieBol",     fn:BF_SG.smoothieBol,     containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"quesoCottonFruta",fn:BF_SG.quesoCottonFruta,containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"claras_tortillaSG",fn:BF_SG.claras_tortillaSG,containsGluten:false,needsEgg:true, needsFish:false, sauce:"ajillo",  cookM:"plancha",  veggie:"espinacas", protein:"huevo"},
    {key:"macedoniaProtSG", fn:BF_SG.macedoniaProtSG, containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
  ];

  const breakfastPool = ALL_BF_ENTRIES.filter(function(e){
    if(e.containsGluten && noGluten) return false;  // HARD RULE: nunca gluten si noGluten
    if(e.needsEgg       && noEgg)   return false;
    if(e.needsFish      && noFish)  return false;
    if(typeof e.fn !== "function")  return false;   // guard: entrada sin builder definido
    return true;
  }).map(function(e){
    return {
      type:      "bf_"+e.key,
      // FASE 0: breakfasts are hardcoded, not driven by r()/rp() — mark non-recomposable
      build:     function(){ return Object.assign({},e.fn(),{_spec:{recomposable:false}}); },
      protein:   e.protein,
      plateType: "desayuno",
      sauce:     e.sauce,
      cookM:     e.cookM,
      veggie:    e.veggie,
    };
  });

  // Fallback de desayuno — garantizado libre de gluten si noGluten
  var bfFallback = noGluten
    ? function(){return {build:BF_SG.yogurSemillas, protein:"bf_yogur", plateType:"desayuno"};}
    : function(){return {build:BF.avenaFresas,       protein:"bf_avena", plateType:"desayuno"};};


    // ── DENSITY + PLATE TYPE PREFERENCES PER STRATEGY ───────────────────────
  var STRAT_PREF = {
    fat_loss_general:         {prefer:["media"],        avoid:[],        plateBonus:{caliente_arroz:1,caliente_patata:1,legumbre:1,pasta:0,sopa_crema:1,bowl:1,ensalada:0}},
    definicion_saciante:      {prefer:["baja"],        avoid:["alta"],  plateBonus:{sopa_crema:3,ensalada:2,plancha_verdura:1,bowl:-1,pasta:-2,caliente_arroz:-1}},
    definicion_flexible:      {prefer:["baja","media"],avoid:[],        plateBonus:{sopa_crema:1,ensalada:1}},
    mantenimiento_equilibrado:{prefer:["media"],        avoid:[],        plateBonus:{}},
    volumen_limpio:           {prefer:["media","alta"], avoid:["baja"],  plateBonus:{caliente_arroz:2,bowl:2,pasta:2,caliente_boniato:1,sopa_crema:-2,ensalada:-1}},
    volumen_agresivo:         {prefer:["alta"],         avoid:["baja"],  plateBonus:{pasta:3,caliente_arroz:3,bowl:3,caliente_boniato:2,sopa_crema:-3,ensalada:-2}},
  };

  // ── WEEKLY SLOT PLAN ─────────────────────────────────────────────────────
  // Each day gets a curated slot with intended protein category and plate type.
  // This is what makes the week feel "designed by a human", not random.
  // slotProtein: preferred protein category for lunch
  // slotDinner:  preferred plate type for dinner
  // slotNote:    visible label shown in the meal card explaining the day's logic
  // ── WEEKLY NARRATIVE SLOTS ────────────────────────────────────────────────
  // Each day has: slotProtein/slotDinner (for smartPick hint),
  // slotNote (visible to user), mood (internal rhythm label),
  // and a brief human "why" that makes the week feel designed, not random.
  var WEEK_SLOTS = {
    fat_loss_general: [
      {day:"Lunes",    slotProtein:"pollo",    slotDinner:"caliente_arroz",  mood:"reset",
       slotNote:"🔄 Lunes de reset — pollo con arroz, sencillo y completo. Sin complicaciones."},
      {day:"Martes",   slotProtein:"pasta",    slotDinner:"huevo_plancha",   mood:"comfort",
       slotNote:"🍝 Martes de pasta — hidratos de verdad, cena rápida. Sin culpa."},
      {day:"Miércoles",slotProtein:"ternera",  slotDinner:"caliente_patata", mood:"clásico",
       slotNote:"🥩 Miércoles de siempre — ternera con patata, lo que hace tu madre."},
      {day:"Jueves",   slotProtein:"legumbre", slotDinner:"plancha_verdura", mood:"fibra",
       slotNote:"🫘 Jueves de legumbre — fibra, saciedad larga, lo más barato del plan."},
      {day:"Viernes",  slotProtein:"pescado",  slotDinner:"pescado_horno",   mood:"ligero",
       slotNote:"🐟 Viernes de pescado — más ligero para llegar bien al fin de semana."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"libre",
       slotNote:"🎉 Sábado libre — esto es parte del plan. Disfruta, que mañana seguimos."},
      {day:"Domingo",  slotProtein:"pollo",    slotDinner:"caliente_arroz",  mood:"reconfortante",
       slotNote:"🍲 Domingo tranquilo — pollo con arroz para cerrar la semana con energía."},
    ],
    definicion_saciante: [
      {day:"Lunes",    slotProtein:"pollo",    slotDinner:"sopa_crema",      mood:"reset",
       slotNote:"🥦 Lunes de limpieza — empezamos ligero. La sopa de cena te sacia sin pasarte."},
      {day:"Martes",   slotProtein:"ternera",  slotDinner:"plancha_verdura", mood:"fuerza",
       slotNote:"💪 Martes de proteína densa — ternera para estar lleno y con energía."},
      {day:"Miércoles",slotProtein:"legumbre", slotDinner:"sopa_crema",      mood:"fibra",
       slotNote:"🫘 Miércoles de fibra — la legumbre de mediodía aguanta hasta la cena."},
      {day:"Jueves",   slotProtein:"pescado",  slotDinner:"plancha_verdura", mood:"omega",
       slotNote:"🐟 Jueves de pescado — omega-3, proteína limpia, verdura de volumen."},
      {day:"Viernes",  slotProtein:"pavo",     slotDinner:"ensalada",        mood:"ligero",
       slotNote:"🥗 Viernes muy ligero — llegamos al fin de semana sin sensación de pesadez."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"libre",
       slotNote:"🎉 Sábado libre — uno a la semana, sin remordimientos, es parte de la estrategia."},
      {day:"Domingo",  slotProtein:"pollo",    slotDinner:"sopa_crema",      mood:"reconfortante",
       slotNote:"🍲 Domingo de sofá — algo caliente y reconfortante para descansar bien."},
    ],
    definicion_flexible: [
      {day:"Lunes",    slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"reset",
       slotNote:"📋 Lunes limpio — plancha clásica, nada que pensar."},
      {day:"Martes",   slotProtein:"pescado",  slotDinner:"caliente_arroz",  mood:"ligero",
       slotNote:"🐟 Martes de pescado — proteína con arroz, fácil y completo."},
      {day:"Miércoles",slotProtein:"legumbre", slotDinner:"huevo_plancha",   mood:"clásico",
       slotNote:"🫘 Miércoles de legumbre — cenas huevo, que es rápido y perfecto."},
      {day:"Jueves",   slotProtein:"ternera",  slotDinner:"caliente_patata", mood:"fuerza",
       slotNote:"🥩 Jueves de ternera — cierre fuerte de semana laboral con patata."},
      {day:"Viernes",  slotProtein:"pavo",     slotDinner:"sopa_crema",      mood:"suave",
       slotNote:"🍵 Viernes suave — sopa reconfortante para entrar bien en el fin de semana."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"libre",
       slotNote:"🎉 Sábado libre — lo que más te apetezca."},
      {day:"Domingo",  slotProtein:"pollo",    slotDinner:"caliente_arroz",  mood:"familiar",
       slotNote:"🍗 Domingo de pollo con arroz — lo de siempre, que nunca falla."},
    ],
    mantenimiento_equilibrado: [
      {day:"Lunes",    slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"rutina",
       slotNote:"⚖️ Lunes de rutina — empieza la semana ordenado."},
      {day:"Martes",   slotProtein:"pescado",  slotDinner:"pescado_horno",   mood:"ligero",
       slotNote:"🐟 Martes de pescado — dos veces a la semana, como siempre."},
      {day:"Miércoles",slotProtein:"ternera",  slotDinner:"plancha_verdura", mood:"fuerza",
       slotNote:"🥩 Miércoles de ternera — mitad de semana con hierro."},
      {day:"Jueves",   slotProtein:"legumbre", slotDinner:"huevo_plancha",   mood:"fibra",
       slotNote:"🫘 Jueves de legumbre — fibra y proteína vegetal."},
      {day:"Viernes",  slotProtein:"pavo",     slotDinner:"sopa_crema",      mood:"suave",
       slotNote:"🍵 Viernes de sopa — terminas la semana sin sensación de pesadez."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"libre",
       slotNote:"🎉 Sábado libre — en mantenimiento te lo puedes permitir sin problema."},
      {day:"Domingo",  slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"familiar",
       slotNote:"🍗 Domingo familiar — el pollo de domingo nunca caduca."},
    ],
    volumen_limpio: [
      {day:"Lunes",    slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"carga",
       slotNote:"💪 Lunes de carga — pollo y arroz. Empieza la semana con glucógeno."},
      {day:"Martes",   slotProtein:"pasta",    slotDinner:"huevo_plancha",   mood:"hidratos",
       slotNote:"🍝 Martes de pasta — hidratos densos para rendir. La cena con huevo es perfecta."},
      {day:"Miércoles",slotProtein:"ternera",  slotDinner:"plancha_verdura", mood:"aminoácidos",
       slotNote:"🥩 Miércoles de ternera — aminoácidos para recuperación muscular."},
      {day:"Jueves",   slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"carga",
       slotNote:"🍗 Jueves de carga — repetimos pollo. En volumen, la constancia manda."},
      {day:"Viernes",  slotProtein:"pescado",  slotDinner:"huevo_plancha",   mood:"omega",
       slotNote:"🐟 Viernes de pescado azul — omega-3 para reducir inflamación muscular."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"recarga",
       slotNote:"🎉 Sábado de recarga — come con cabeza pero sin obsesión. Eres parte del plan."},
      {day:"Domingo",  slotProtein:"legumbre", slotDinner:"plancha_verdura", mood:"descanso",
       slotNote:"🫘 Domingo de legumbre — proteína vegetal y descanso digestivo."},
    ],
    volumen_agresivo: [
      {day:"Lunes",    slotProtein:"pasta",    slotDinner:"huevo_plancha",   mood:"carga_maxima",
       slotNote:"🔥 Lunes de máxima carga — pasta para llenar el glucógeno desde el primer día."},
      {day:"Martes",   slotProtein:"ternera",  slotDinner:"plancha_verdura", mood:"aminoácidos",
       slotNote:"🥩 Martes de ternera — proteína completa, recuperación rápida."},
      {day:"Miércoles",slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"constancia",
       slotNote:"💪 Miércoles de pollo — mitad de semana, consistencia antes que creatividad."},
      {day:"Jueves",   slotProtein:"pasta",    slotDinner:"huevo_plancha",   mood:"segunda_carga",
       slotNote:"🍝 Segunda carga de pasta — si no llegas a calorías, añade aceite o queso."},
      {day:"Viernes",  slotProtein:"ternera",  slotDinner:"plancha_verdura", mood:"cierre_fuerte",
       slotNote:"🥩 Viernes de cierre fuerte — ternera para terminar la semana con proteína densa."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"recarga_total",
       slotNote:"🎉 Sábado de recarga total — come lo que quieras. En volumen agresivo, esto es necesario."},
      {day:"Domingo",  slotProtein:"pollo",    slotDinner:"huevo_plancha",   mood:"descanso",
       slotNote:"🍗 Domingo ligero — huevo en cena para dar descanso al sistema digestivo."},
    ],
  };

  // ── WEEKLY COHERENCE LIMITS ───────────────────────────────────────────────
  // Hard limits enforced across the whole week (tracked per-week, not per-day)
  var weeklyProteinCount = {}; // protein → count
  var weeklyPlateCount   = {}; // plateType → count
  var weeklyCulinaryStyle= {}; // culinaryStyle → count
  var weeklyCuisineExp   = {}; // cuisineExperience → count ("comfort_caliente", "bowl_fresco" …)
  var weeklyTempFeel     = {}; // "caliente" / "frio" / "muy_caliente" → count
  // Hard caps: fish max 2/week across all fish species, ave (pollo+pavo+conejo) max 4/week total, etc.
  var WEEKLY_CAP = {pescado:2, marisco:1, legumbre:2, pasta:2, ternera:2, cerdo:2, ave:4};

  // ── FREEFORM FREQUENCY TRACKING ────────────────────────────────────────────
  // Tracks usage of freeForm combos within the current ISO week.
  // Structure: weeklyFreeFormIds[id] = { count: number, weekKey: string }
  // Resets automatically when the ISO week changes — no manual reset needed.
  var weeklyFreeFormIds = {};

  function getISOWeekKey(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return d.getUTCFullYear() + "-W" + String(weekNo).padStart(2, "0");
  }

  var CURRENT_WEEK = getISOWeekKey(new Date());

  function exceedsWeeklyCap(protKey, ptKey) {
    var protCount = weeklyProteinCount[protKey] || 0;
    var ptCount   = weeklyPlateCount[ptKey]     || 0;
    // Also check family cap (e.g. all fish species share the "pescado" cap)
    var fam = protFamily(protKey);
    var famCount  = (fam !== protKey) ? (weeklyProteinCount[fam] || 0) : 0;
    var cap = WEEKLY_CAP[protKey] || WEEKLY_CAP[fam];
    if(cap && (protCount >= cap || famCount >= cap)) return true;
    // Plate type cap: max 3 of any plate type per week
    if(ptCount >= 3) return true;
    return false;
  }

  function recordMeal(protKey, ptKey, styleKey, cxp, tmp) {
    weeklyProteinCount[protKey] = (weeklyProteinCount[protKey]||0) + 1;
    var fam = protFamily(protKey);
    if(fam !== protKey) {
      weeklyProteinCount[fam] = (weeklyProteinCount[fam]||0) + 1;
    }
    weeklyPlateCount[ptKey]     = (weeklyPlateCount[ptKey]||0)     + 1;
    if(styleKey) weeklyCulinaryStyle[styleKey] = (weeklyCulinaryStyle[styleKey]||0) + 1;
    if(cxp)      weeklyCuisineExp[cxp]         = (weeklyCuisineExp[cxp]||0)         + 1;
    if(tmp)      weeklyTempFeel[tmp]            = (weeklyTempFeel[tmp]||0)            + 1;
  }

  // ── SMART PICKER (15-factor scoring) ─────────────────────────────────────
  var pastFreq = getPastProteinFrequency(); // cross-week memory

  // Observability toggle — set to true from the browser console to enable structured traces.
  // Has zero runtime cost when false.
  var SMARTPICK_TRACE = false;

  function smartPick(pool, usedProteins, usedPlateTypes, usedCookMethods, fallbackBuild, slotHint, dayCtx, mood) {
    // dayCtx = {sauces:[], cookMethods:[], veggies:[], proteins:[]} — used meals in this calendar day
    if(!pool.length) {
      if(SMARTPICK_TRACE) {
        console.log("[smartPick TRACE]", {
          slotHint: slotHint || null,
          mood: mood || null,
          candidateIds: [],
          hardFilteredOutIds: [],
          scored: [],
          winnerId: "<fallback>",
          winnerScore: null,
          reasonWinner: "poolEmpty_fallbackBuild"
        });
      }
      return fallbackBuild();
    }
    var pref = STRAT_PREF[strategy] || STRAT_PREF.mantenimiento_equilibrado;
    var dc = dayCtx || {sauces:[], cookMethods:[], veggies:[], proteins:[]};

    if(SMARTPICK_TRACE) {
      var __trace = {
        slotHint: slotHint || null,
        mood: mood || null,
        candidateIds: pool.map(function(m) {
          return (m && (m.id || m.protein)) || "<no-id>";
        }),
        hardFilteredOutIds: [],
        scored: [],
        winnerId: null,
        winnerScore: null,
        reasonWinner: null
      };
    }

    var eligible = pool.filter(function(m) {
      var passes = !exceedsWeeklyCap(m.protein || m.type, m.plateType || "");
      if(SMARTPICK_TRACE && !passes) {
        __trace.hardFilteredOutIds.push({
          id: (m && (m.id || m.protein)) || "<no-id>",
          reason: "exceedsWeeklyCap",
          protein: m.protein || m.type || null,
          plateType: m.plateType || null
        });
      }
      return passes;
    });
    if(!eligible.length) {
      eligible = pool;
      if(SMARTPICK_TRACE) {
        __trace.hardFilteredOutIds.push({
          id: "<fallback>",
          reason: "weeklyCapFallback_poolEmpty",
          protein: null,
          plateType: null
        });
      }
    }

    // ── FREEFORM FREQUENCY FILTER ───────────────────────────────────────────
    // Soft-blocks combos that have reached their weekly frecuencia limit.
    // Legacy combos are never touched (early return true).
    // Fallback: if the filter would reduce eligible below min(3, pool),
    // relax the semanal limit to avoid empty pools.
    (function() {

      function getUsage(id) {
        var entry = weeklyFreeFormIds[id];
        if (!entry) return 0;
        // reset automático si cambia la semana
        if (entry.weekKey !== CURRENT_WEEK) return 0;
        return entry.count || 0;
      }

      function isAllowed(m) {
        if (!m._spec || m._spec.freeForm !== true) return true;
        var id = m._spec.identity && m._spec.identity.id;
        if (!id) return true;
        var frec = (m._spec.behavior || {}).frecuencia;
        var used = getUsage(id);
        if (frec === "ocasional") return used < 1;
        if (frec === "semanal")   return used < 2;
        return true; // diario o undefined
      }

      var filtered = eligible.filter(isAllowed);

      // fallback NO destructivo:
      // si el filtro elimina demasiado, se relaja parcialmente (no se apaga)
      if (filtered.length < Math.min(3, eligible.length)) {
        filtered = eligible.map(function(m) {
          if (!m._spec || m._spec.freeForm !== true) return m;
          var frec = (m._spec.behavior || {}).frecuencia;
          if (frec === "ocasional") return m; // mantener hard limit
          return m; // relajar semanal si es necesario
        });
      }

      eligible = filtered;

    })();
    // ── fin FREEFORM FREQUENCY FILTER ──────────────────────────────────────

    var scored = eligible.map(function(m) {
      var protKey = m.protein || m.type;
      var ptKey   = m.plateType || "";

      // 1. Protein recency (within week) — PROGRESSIVE
      // Cuanto más reciente fue el uso, mayor la penalización.
      // Esto es clave cuando el pool es pequeño (e.g. sin gluten):
      // el sistema debe distribuir incluso con pocas opciones.
      var pLast   = usedProteins.lastIndexOf(protKey);
      var pRec    = pLast === -1 ? 0 : Math.max(0, usedProteins.length - pLast);
      var protPen = pRec === 0 ? 0
                  : pRec === 1 ? 18   // usado ayer — muy alta penalización
                  : pRec === 2 ? 10   // hace 2 días — moderada
                  : pRec >= 3  ?  4   // hace 3+ días — baja
                  : 0;

      // 1b. CookMethod recency — less aggressive than protein (7 methods vs 17 proteins)
      var cmKey  = m.cookM || "";
      var cmLast = usedCookMethods ? usedCookMethods.lastIndexOf(cmKey) : -1;
      var cmRec  = cmLast === -1 ? 0 : Math.max(0, usedCookMethods.length - cmLast);
      var cookMethodRecencyPen = cmRec === 0 ? 0
                               : cmRec === 1 ? 12  // ayer — alta
                               : cmRec === 2 ?  6  // hace 2 días — moderada
                               : cmRec >= 3  ?  2  // hace 3+ días — baja
                               : 0;

      // 2. Plate type recency
      var ptLast  = usedPlateTypes ? usedPlateTypes.lastIndexOf(ptKey) : -1;
      var ptRec   = ptLast === -1 ? 0 : Math.max(0, usedPlateTypes.length - ptLast);
      var platePen= ptRec >= 2 ? 7 : ptRec * 2.5;

      // 3. Weekly plate type count
      var ptCount  = weeklyPlateCount[ptKey] || 0;
      var countPen = ptCount >= 2 ? 5 : ptCount * 1.5;

      // 4. Strategy density fit
      var denBonus= 0;
      if(m.density && pref.prefer.indexOf(m.density) > -1) denBonus -= 2.5;
      if(m.density && pref.avoid.indexOf(m.density)  > -1) denBonus += 3.5;

      // 5. Strategy plate type preference
      var ptBonus = 0;
      if(ptKey && pref.plateBonus && pref.plateBonus[ptKey] !== undefined) {
        ptBonus -= pref.plateBonus[ptKey];
      }

      // 6. Saciante flag
      var sacBonus = (strategy === "definicion_saciante" && m.saciante) ? -2.5 : 0;

      // 7. Slot hint
      var slotBonus = 0;
      if(slotHint) {
        if(slotHint.protein && (m.protein||m.type) === slotHint.protein) slotBonus -= 4;
        if(slotHint.plateType && ptKey === slotHint.plateType) slotBonus -= 3;
      }

      // 8. Familiarity bonus for fat_loss_general
      var familiarBonus = 0;
      if(strategy === "fat_loss_general") {
        if(m.familiar) familiarBonus -= 2.5;
        if(m.facil)    familiarBonus -= 1.5;
      }

      // 9. Cross-week memory: penalise proteins seen frequently in past weeks
      var memPenalty = 0;
      var pastCount = pastFreq[protKey] || 0;
      if(pastCount >= 4) memPenalty = 3.5;
      else if(pastCount >= 2) memPenalty = 1.5;

      // 10. Same-day protein repetition — STRONG penalty (family-aware)
      // Penalises pollo+pavo (both "ave") as strongly as pollo+pollo.
      var dayProtPen = 0;
      var thisFamily = protFamily(protKey);
      if(dc.proteins && dc.proteins.some(function(p){
        return p === protKey || protFamily(p) === thisFamily;
      })) {
        dayProtPen = 15; // very strong — never repeat same protein family same day
      }

      // 11. Same-day sauce repetition — STRONG penalty
      // e.g. ajillo for lunch and dinner on the same day
      var daySaucePen = 0;
      if(m.sauce && dc.sauces && dc.sauces.indexOf(m.sauce) > -1) {
        daySaucePen = 14; // avoids "al ajillo" twice in same day
      }

      // 12. Same-day cooking method repetition — MODERATE penalty
      // e.g. two consecutive plancha meals on same day
      var dayCookPen = 0;
      if(m.cookM && dc.cookMethods && dc.cookMethods.indexOf(m.cookM) > -1) {
        dayCookPen = 6;
      }

      // 13. Same-day main veggie repetition — MODERATE penalty
      // e.g. espinacas in breakfast scramble AND dinner
      var dayVeggiePen = 0;
      if(m.veggie && dc.veggies && dc.veggies.indexOf(m.veggie) > -1) {
        dayVeggiePen = 8;
      }

      // 14. Culinary style over-representation this week
      // Prevents the week from being all "casero" or all "mediterraneo"
      // Cap: max 3 meals per style per week — soft penalty beyond 2
      var stylePen = 0;
      var styleKey = m.culinaryStyle || null;
      if(styleKey) {
        var styleCount = weeklyCulinaryStyle[styleKey] || 0;
        if(styleCount >= 3) stylePen = 8;
        else if(styleCount >= 2) stylePen = 3;
      }

      // Determine if this protein type is "fish" — penalise fish-heavy days
      var isFish = m.protein && (PROT[m.protein]&&(PROT[m.protein].isFish||PROT[m.protein].isSeafood));
      var fishDayPen = 0;
      if(isFish) {
        var fishCountToday = (dc.proteins||[]).filter(function(p){
          return PROT[p] && (PROT[p].isFish || PROT[p].isSeafood);
        }).length;
        if(fishCountToday >= 1) fishDayPen = 12; // max 1 fish meal per day
      }

      // 15. Daily mood bonus — promotes meals that fit the day's emotional context
      // e.g. "comfort" day favours sopa_crema and legumbre
      // e.g. "rapido" day penalises anything not marked facil
      var moodPen = mood ? moodBonus(m, mood) : 0;

      // 16. Apetencia — fit emocional por mood del día
      // comfortScore se activa en días reconfortantes/reset
      // freshnessScore en días ligeros/fresco/omega
      // cravingScore  en días libres/recarga — queremos el plato más apetecible
      var apetenciaPen = 0;
      var ap = m.apetencia || {comfort:0, freshness:0, craving:0};
      if(mood==="reset"||mood==="rutina")                  apetenciaPen -= ap.freshness * 0.6;
      if(mood==="comfort"||mood==="reconfortante"||mood==="suave") apetenciaPen -= ap.comfort * 1.2;
      if(mood==="ligero"||mood==="omega"||mood==="descanso")       apetenciaPen -= ap.freshness * 1.2;
      if(mood==="libre"||mood==="recarga"||mood==="recarga_total") apetenciaPen -= ap.craving * 1.5;
      if(mood==="familiar"||mood==="clásico")              apetenciaPen -= ap.comfort * 0.8;
      if(mood==="carga"||mood==="carga_maxima"||mood==="aminoácidos") apetenciaPen -= ap.craving * 0.5;

      // 17. Experiencia culinaria percibida — evita que la semana se sienta
      // como "siete días de plancha" o "todo comfort_caliente".
      // El usuario no lo analiza pero lo NOTA: monotonía de experiencia.
      var cxpPen = 0;
      var cxp = m.cuisineExperience || null;
      if(cxp) {
        var cxpCount = weeklyCuisineExp[cxp] || 0;
        if(cxpCount >= 5) cxpPen = 10;       // experiencia dominante — fuerte
        else if(cxpCount >= 3) cxpPen = 4;   // ya vista varias veces — moderada
        else if(cxpCount >= 2) cxpPen = 1;   // vista — pequeño empuje a variar
      }
      // Temperatura: penaliza si casi toda la semana es del mismo feel térmico
      var tmpPen = 0;
      var tmp = m.tempFeel || null;
      if(tmp) {
        var tmpCount = weeklyTempFeel[tmp] || 0;
        if(tmpCount >= 6) tmpPen = 6;         // e.g. 6 platos calientes — pide algo fresco
        else if(tmpCount >= 4) tmpPen = 2;
      }

      // 18. Seasonal veggie bonus — prefer in-season vegetables (Spain, current month).
      // Soft preference: when the combo's main vegetable is in season, nudge its score down
      // (i.e. favour it). Intolerances remain strictly higher priority because they
      // hard-filter combos out of the pool before this scoring step ever runs.
      var seasonalBonus = (m.veggie && currentSeasonalVegs.indexOf(m.veggie) > -1) ? -1.5 : 0;

      // 19. Sopa_crema same-veggie weekly penalty — avoids "crema de X" twice in the same week
      var sopaCremaPen = (m.plateType==="sopa_crema" && m.veggie && usedProteins.indexOf("sopa:"+m.veggie) > -1) ? 8 : 0;

      var score = protPen + platePen + countPen + denBonus + ptBonus + sacBonus + slotBonus +
                  familiarBonus + memPenalty + dayProtPen + daySaucePen + dayCookPen +
                  dayVeggiePen + fishDayPen + stylePen + moodPen + apetenciaPen + cxpPen + tmpPen +
                  seasonalBonus + sopaCremaPen + cookMethodRecencyPen;

      // ── freeForm v3.1 additive penalties (Prompt 2B) ───────────────
      //
      // SOLO afecta a combos freeForm.
      // El scoring legacy sigue intacto.
      //
      // Las penalizaciones son ADITIVAS.
      // NO reemplazan penalties existentes.
      //
      // Fuente de verdad:
      //   m._spec.behavior
      //
      if (m._spec && m._spec.freeForm === true) {

        var _beh = m._spec.behavior || {};

        // ───────────────────────────────────────────────────────────
        // P1 — lightMealCompatible × moods ligeros
        //
        // Platos marcados como no compatibles con comidas ligeras
        // se penalizan en moods de descarga/suavidad.
        //
        var _lightMoods = [
          "ligero",
          "omega",
          "descanso",
          "suave"
        ];

        if (
          _beh.lightMealCompatible === false &&
          _lightMoods.indexOf(mood) >= 0
        ) {
          score += 8;
        }

        // ───────────────────────────────────────────────────────────
        // P2 — digestiveLoad high × contexto cena
        //
        // Penaliza platos digestivamente pesados durante cenas.
        //
        // IMPORTANTE:
        // La detección depende del CONTEXTO ACTUAL de smartPick,
        // no del slot exclusivo declarado por el combo.
        //
        var _dinnerPT = [
          "plancha_verdura",
          "sopa_crema",
          "huevo_plancha",
          "pescado_horno",
          "ensalada"
        ];

        var _isDinnerCtx =
          slotHint &&
          slotHint.plateType &&
          _dinnerPT.indexOf(slotHint.plateType) >= 0;

        if (
          _beh.digestiveLoad === "high" &&
          _isDinnerCtx
        ) {
          score += 10;
        }

        // ───────────────────────────────────────────────────────────
        // P3 — avoidInAggressiveCut × estrategias de definición
        //
        var _cutStrategies = [
          "definicion_saciante",
          "fat_loss_general",
          "definicion_flexible"
        ];

        var _isCutCtx =
          _cutStrategies.indexOf(strategy) >= 0;

        if (
          _beh.avoidInAggressiveCut === true &&
          _isCutCtx
        ) {
          score += 12;
        }

        // ───────────────────────────────────────────────────────────
        // P4 — satietyScore bajo × definición
        //
        // En contextos de déficit se priorizan platos más saciantes.
        //
        if (
          typeof _beh.satietyScore === "number" &&
          _beh.satietyScore < 4 &&
          _isCutCtx
        ) {
          score += 5;
        }

        // ───────────────────────────────────────────────────────────
        // P5 — trainingProfile.rest × moods de carga
        //
        // Platos marcados como orientados a descanso se penalizan
        // en días de carga/fuerza.
        //
        var _tp = _beh.trainingProfile || {};

        var _trainingMoods = [
          "fuerza",
          "carga",
          "carga_maxima",
          "hidratos",
          "segunda_carga"
        ];

        if (
          _tp.rest === true &&
          _trainingMoods.indexOf(mood) >= 0
        ) {
          score += 6;
        }

      }
      // ── fin freeForm v3.1 additive penalties ──────────────────────

      if(SMARTPICK_TRACE) {
        __trace.scored.push({
          id: (m && (m.id || m.protein)) || "<no-id>",
          score: typeof score !== "undefined" ? score : null,
          protein: m.protein || m.type || null,
          plateType: m.plateType || null,
          breakdown: {
            protPen: typeof protPen !== "undefined" ? protPen : null,
            ptPen: typeof platePen !== "undefined" ? platePen : null
          }
        });
      }
      return {m:m, score:score};
    });
    scored.sort(function(a,b){return a.score - b.score;});

    // ── SELECCIÓN ESTOCÁSTICA PONDERADA ─────────────────────────────────────
    // En lugar de siempre coger scored[0], elegimos entre los N mejores
    // con probabilidad inversamente proporcional al score.
    // Esto produce variedad humana real: misma calidad, distinta elección.
    //
    // Tamaño del grupo top-N: se adapta al pool disponible.
    //   pool grande  → top 5  (máxima variedad)
    //   pool pequeño → top 3  (e.g. restricción sin gluten)
    //   pool = 1-2   → top 1  (no hay elección posible)
    var topN = scored.length >= 6 ? 5
             : scored.length >= 4 ? 3
             : scored.length >= 3 ? 2
             : 1;
    var candidates = scored.slice(0, topN);

    // Pesos: w = 1 / (score - min_score + 1)^1.4
    // El exponente 1.4 mantiene la calidad (el peor no tiene igual prob que el mejor)
    // pero da opciones reales al 2º, 3º y 4º candidato.
    var minScore = candidates[0].score;
    var weights  = candidates.map(function(c){
      return 1 / Math.pow(Math.max(0, c.score - minScore) + 1, 1.4);
    });
    var totalW = weights.reduce(function(s,w){ return s+w; }, 0);
    var rand   = Math.random() * totalW;
    var chosen = candidates[0].m;
    var cumul  = 0;
    for(var i=0; i<candidates.length; i++){
      cumul += weights[i];
      if(rand <= cumul){ chosen = candidates[i].m; break; }
    }
    if(SMARTPICK_TRACE) {
      __trace.winnerId = (chosen && (chosen.id || chosen.protein)) || "<no-id>";
      var __winnerEntry = __trace.scored.find(function(s) {
        return s.id === __trace.winnerId;
      });
      __trace.winnerScore = __winnerEntry ? __winnerEntry.score : null;
      if(typeof candidates !== "undefined" && candidates.length > 0) {
        var top = candidates[0];
        __trace.reasonWinner =
          (__winnerEntry && top && __winnerEntry.score === top.score)
            ? "maxScore"
            : "weightedRandomTieBreak";
      } else {
        __trace.reasonWinner = "unknown";
      }
      console.log("[smartPick TRACE]", __trace);
    }
    return chosen;
  }

  // ── SIMPLIFY MODE ────────────────────────────────────────────────────────
  // Activated via check-in when adherence is very low, OR automatically when
  // the user selected "novato" cooking preference (quick meals, low effort).
  var isSimple = (profile.simpleMode === true) || (profile.experiencia === "novato");
  var SIMPLE_LUNCHES  = ["polloArroz","pavoPatata","terneraPatata","salmon","lentejas","pastaCarbonara","polloProvenzal"];
  var SIMPLE_DINNERS  = ["pavoBrocoli","polloEspinacas","merluza","tortilla","cremaCalabaza","sopaPolloCasera","revueltoEsparragos"];

  // ── DAILY MOOD & TIME-AWARE FILTERING ─────────────────────────────────────
  // Each day of the week has a human mood that influences meal selection.
  // tiempoCocina ("poco"/"normal"/"mucho") adds an extra layer:
  //   poco   → weekdays are "rapido" regardless of slot mood
  //   mucho  → weekends unlock "elaborado" moods (more complex recipes)
  var tiempoCocina = profile.tiempoCocina || "normal";

  // Mood → pool filter + scoring hint
  // comfort:   legumbre, sopa_crema, guisado preferred
  // rapido:    only facil=true, plancha/revuelto/crudo preferred
  // fresco:    ensalada, bowl, pescado preferred
  // libre:     no filter (Saturday)
  // elaborado: all pool available, complexity welcome
  var MOOD_CONFIG = {
    reset:         {facil: false, plateBonus: {plancha_verdura:2, caliente_arroz:1}},
    comfort:       {facil: false, plateBonus: {sopa_crema:3, legumbre:3, caliente_patata:1}},
    rapido:        {facil: true,  plateBonus: {plancha_verdura:3, huevo_plancha:2, ensalada:1}},
    fresco:        {facil: false, plateBonus: {ensalada:3, bowl:2, pescado_horno:2}},
    fibra:         {facil: false, plateBonus: {legumbre:4, sopa_crema:1}},
    fuerza:        {facil: false, plateBonus: {caliente_arroz:2, caliente_patata:2, caliente_boniato:1}},
    ligero:        {facil: false, plateBonus: {ensalada:2, pescado_horno:2, plancha_verdura:1}},
    reconfortante: {facil: false, plateBonus: {sopa_crema:4, legumbre:2, caliente_patata:1}},
    familiar:      {facil: true,  plateBonus: {caliente_arroz:2, caliente_patata:2, legumbre:1}},
    rutina:        {facil: false, plateBonus: {}},
    omega:         {facil: false, plateBonus: {pescado_horno:3, caliente_arroz:1}},
    hidratos:      {facil: false, plateBonus: {pasta:3, caliente_arroz:2, caliente_boniato:2}},
    aminoacidos:   {facil: false, plateBonus: {caliente_arroz:2, caliente_patata:1}},
    carga:         {facil: false, plateBonus: {caliente_arroz:3, caliente_boniato:2, pasta:1}},
    carga_maxima:  {facil: false, plateBonus: {pasta:4, caliente_arroz:3}},
    segunda_carga: {facil: false, plateBonus: {pasta:4, caliente_boniato:2}},
    cierre_fuerte: {facil: false, plateBonus: {caliente_arroz:2, caliente_patata:2}},
    recarga:       {facil: false, plateBonus: {}},
    recarga_total: {facil: false, plateBonus: {}},
    descanso:      {facil: true,  plateBonus: {huevo_plancha:3, sopa_crema:2, ensalada:1}},
    clásico:       {facil: true,  plateBonus: {caliente_patata:2, caliente_arroz:2, legumbre:1}},
    suave:         {facil: false, plateBonus: {sopa_crema:3, pescado_horno:1, plancha_verdura:1}},
    libre:         {facil: false, plateBonus: {}},
  };

  // Days that feel "laboral" (workdays) — tiempoCocina:"poco" makes these rapido
  var WORKDAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes"];

  // Returns effective mood for a day, adjusted by tiempoCocina
  function effectiveMood(slotMood, dayName) {
    if(slotMood === "libre") return "libre";
    var isWorkday = WORKDAYS.indexOf(dayName) > -1;
    if(tiempoCocina === "poco" && isWorkday) return "rapido";
    return slotMood || "rutina";
  }

  // Apply mood bonus to a pool entry's score (returns penalty/bonus number)
  function moodBonus(m, mood) {
    var cfg = MOOD_CONFIG[mood] || MOOD_CONFIG.rutina;
    var ptKey = m.plateType || "";
    var bonus = 0;
    // Plate type bonus from mood
    if(cfg.plateBonus && cfg.plateBonus[ptKey] !== undefined) {
      bonus -= cfg.plateBonus[ptKey] * 1.5; // negative = preferred
    }
    // Facil filter: if mood requires facil and meal is not facil, penalise
    if(cfg.facil && !m.facil) bonus += 8;
    return bonus;
  }

  // Track protein, plate-type and cookMethod usage per meal slot + weekly totals
  const usedL=[], usedD=[], usedB=[];
  const usedLPlate=[], usedDPlate=[];
  const usedLCook=[], usedDCook=[]; // cookMethod recency — parallel to usedL/usedD
  const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const n=profile.mealsPerDay||3;

  let snackAmIdx=0, snackPmIdx=0;

  // ── ESPONTANEIDAD ─────────────────────────────────────────────────────────
  // Un día por semana el sistema "se sale del guión" deliberadamente:
  // ignora el slotHint y elige por cravingScore máximo.
  // Esto evita que el usuario detecte el patrón y hace la semana más humana.
  // El día wildcard se elige al azar entre Martes y Jueves (días "planos").
  var WILDCARD_DAYS = ["Martes","Miércoles","Jueves"];
  var wildcardDay = WILDCARD_DAYS[Math.floor(Math.random() * WILDCARD_DAYS.length)];
  // Con tiempoCocina:"poco", el wildcard no es en día laboral intenso (L/V)
  // Solo 1 wildcard por semana — desactivable si simpleMode activo
  var useWildcard = !isSimple;

  // ── CAOS CONTROLADO — simulación de comportamiento humano ────────────────
  // Los humanos no comen perfectamente optimizados. Tienen rutinas, cansancio,
  // antojo y confort emocional. Este sistema los simula deliberadamente.
  //
  // Patrón 1 — RUTINA DEL MARTES: el desayuno del martes puede coincidir con el
  // de la semana anterior (la gente tiene desayunos fijos entre semana). No es
  // un bug — es comportamiento real. Se activa con 30% de probabilidad.
  //
  // Patrón 2 — FATIGA DEL VIERNES: el viernes, la comida tiende a ser la más
  // sencilla de la semana. Se fuerza facil=true y se reduce la penalización
  // de platos repetidos. Solo si tiempoCocina !== "mucho".
  //
  // Patrón 3 — COMFORT DEL DOMINGO: el domingo se activa mood "familiar" con
  // extra bonus de cravingScore. No hay wildcard ese día.
  //
  // Patrón 4 — REPETICIÓN QUERIDA: si un plato tiene cravingScore alto y ya
  // apareció esta semana, tiene un 20% de probabilidad de volver a aparecer
  // (en vez de ser penalizado). Simula "me apetece de nuevo esto".

  var HUMAN_PATTERNS = {
    tuesdayRoutine:  !isSimple && Math.random() < 0.30,  // 30% chance
    fridayFatigue:   tiempoCocina !== "mucho",            // siempre si no es chef
    sundayComfort:   true,                                // siempre
    belovedRepeat:   !isSimple && Math.random() < 0.20,  // 20% chance
  };

  var weekSlots = WEEK_SLOTS[strategy] || WEEK_SLOTS.mantenimiento_equilibrado;

  // Heurística de kcal por plateType para pre-ajuste de proteína
  var _PRE_KCAL = {
    plancha_verdura: 320, sopa_crema: 280, huevo_plancha: 350,
    caliente_arroz: 520,  caliente_patata: 490, ensalada: 380,
    bowl: 450, pasta: 560, legumbre: 480, libre: 600,
    pescado_horno: 390,   desayuno: 350,
  };
  // Proteína base estimada por comida con proteinMult=1 (74kg, 3 comidas)
  var _PRE_PROT_BASE = 100; // g/día a mult 1.0

  const planSeed = Date.now();
  const days=dayNames.map(function(day, _dayIdx){
    var isSat=day==="Sábado";
    var slot  = weekSlots.find(function(s){return s.day===day;}) || {};

    // Compute the effective mood for this day — adjusted by tiempoCocina
    var dayMood = effectiveMood(slot.mood || "rutina", day);

    // ── Pre-ajuste de proteinMult: si el día va a quedar corto en kcal o proteína,
    // incrementar rules.proteinMult ANTES de llamar a composeMeal().
    // Se restaura después de generar los meals del día.
    var _savedProteinMult = rules.proteinMult;
    (function() {
      if(isSat) return; // día libre — no ajustar
      var lunchPt  = slot.slotProtein === "pasta" ? "pasta"
                   : slot.slotProtein === "legumbre" ? "legumbre"
                   : "caliente_arroz";
      var dinnerPt = slot.slotDinner || "plancha_verdura";
      var _dayRegen  = profile._regenContext&&profile._regenContext.dayPortionsRegen&&profile._regenContext.dayPortionsRegen.dayIdx===dayNames.indexOf(day)?profile._regenContext.dayPortionsRegen:null;
      var _shake    = profile.extras&&profile.extras.proteinShake;
      // Shake calibration is now applied via shakeFactor inside r(), not by adjusting baseScale.
      // For the pre-boost estimate, don't add shake kcal: r() already produces calibrated portions.
      var _shakeOn  = _dayRegen!=null?!!_dayRegen.shakeEnabledOverride:false;
      var _shakeKcal= _shakeOn?((_shake&&_shake.scoops||1)*(_shake&&_shake.kcalPerScoop||120)):0;
      var _shakeProt= _shakeOn?((_shake&&_shake.scoops||1)*(_shake&&_shake.proteinPerScoop||24)):0;
      var estKcal  = (_PRE_KCAL.desayuno||350)
                   + (_PRE_KCAL[lunchPt]||400)
                   + (_PRE_KCAL[dinnerPt]||350)
                   + _shakeKcal;
      var estProt  = Math.round(_PRE_PROT_BASE * rules.proteinMult)
                   + _shakeProt;
      var needBoost = estKcal < 1500 || estProt < 130;
      if(needBoost) {
        // +0.10 si solo uno de los dos falla, +0.15 si ambos
        var boost = (estKcal < 1500 && estProt < 130) ? 0.15 : 0.10;
        rules.proteinMult = Math.min(rules.proteinMult + boost, 1.40);
      }
    })();

    // ── dayPortionsRegen: reuse same specs, only recalculate portions ─────────
    // Active when regenerateDayPortions() is called with a shakeEnabledOverride.
    // Pre-boost already ran with the correct override above.
    var _drSpec = profile._regenContext&&profile._regenContext.dayPortionsRegen&&profile._regenContext.dayPortionsRegen.dayIdx===dayNames.indexOf(day)?profile._regenContext.dayPortionsRegen:null;
    if(_drSpec&&_drSpec.meals) {
      var _drMeals = _drSpec.meals.map(function(om){
        if(!om) return null;
        // FASE 4 safe-guards: sin _spec o no recomponible → preservar intacta
        if(!om._spec) return om;
        if(om._spec.recomposable === false) return om;
        return composeMeal(om._spec);
      });
      rules.proteinMult = _savedProteinMult;
      return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:isSat?"libre":isTrain(day)?"entrenamiento":null, mood:slot.mood||null, effectiveMood:dayMood, meals:_drMeals, shakeEnabled:!!_drSpec.shakeEnabledOverride};
    }

    // ── Semantic override from regenerateMeal() ───────────────────────────
    // When the user asks to regenerate a specific plato with a semantic hint
    // (e.g. "algo más comfort"), override dayMood for that day only.
    var regenCtx = profile._regenContext || null;
    var isRegenDay = regenCtx && dayNames.indexOf(day) === regenCtx.dayIdx;
    if(isRegenDay && regenCtx.semanticHint) {
      var hintMoodMap = {
        comfort:   "reconfortante",
        ligero:    "ligero",
        rapido:    "rapido",
        diferente: "libre",
      };
      dayMood = hintMoodMap[regenCtx.semanticHint] || dayMood;
    }

    // ── Regen exclusion filter: avoid repeating same protein+template ────────
    var _regenExclP = isRegenDay && regenCtx && regenCtx.excludeSpec
      ? regenCtx.excludeSpec.P
      : null;

    // _regenExclTmpl ya no se usa: la exclusión se simplifica a proteína/tipo base
    var _filterRegen = function(pool) {
      if(!_regenExclP) return pool;

      var f = pool.filter(function(m){
        // Excluir tanto proteínas como tipos equivalentes (ej: legumbre)
        return m.protein !== _regenExclP && m.type !== _regenExclP;
      });

      return f.length > 0 ? f : pool; // fallback seguro
    };

    // ── Caos controlado: aplicar patrones de comportamiento humano ───────────
    // Patrón FATIGA DEL VIERNES — el viernes la comida es la más sencilla
    if(day==="Viernes" && HUMAN_PATTERNS.fridayFatigue && dayMood!=="libre") {
      dayMood = "rapido";
    }
    // Patrón COMFORT DEL DOMINGO — el domingo activa experiencia reconfortante
    if(day==="Domingo" && HUMAN_PATTERNS.sundayComfort && dayMood!=="libre") {
      dayMood = "reconfortante";
    }
    // chosen for THIS day to prevent repetition within the same calendar day.
    var dayCtx = {sauces:[], cookMethods:[], veggies:[], proteins:[]};
    function recordDayCtx(picked) {
      if(picked.sauce)   dayCtx.sauces.push(picked.sauce);
      if(picked.cookM)   dayCtx.cookMethods.push(picked.cookM);
      if(picked.veggie)  dayCtx.veggies.push(picked.veggie);
      if(picked.protein) dayCtx.proteins.push(picked.protein);
    }

    // Breakfast: rotate anti-repetition via breakfastPool
    // Patrón RUTINA DEL MARTES: el martes puede repetir el desayuno favorito
    // (el que tuvo menor penalización la semana pasada). Simula hábito real.
    var bfPoolForDay = breakfastPool;
    if(day==="Martes" && HUMAN_PATTERNS.tuesdayRoutine && usedB.length > 0) {
      // Busca el desayuno más familiar de los disponibles y lo pone primero
      var famFirst = breakfastPool.slice().sort(function(a,b){
        return (b.familiar?1:0)-(a.familiar?1:0);
      });
      bfPoolForDay = famFirst;
    }
    var bPicked=smartPick(bfPoolForDay, usedB, null, null, bfFallback, null, dayCtx, dayMood);
    var breakfast=bPicked.build();
    usedB.push(bPicked.protein||"bf_0");
    recordDayCtx(bPicked);

    // Lunch: slot hint + simple mode filter + weekly cap + wildcard
    var lunch;
    if(isSat){
      lunch=libreComida();
      usedLPlate.push("libre");
      usedL.push("libre");
    } else {
      var lPool = isSimple
        ? lunchPool.filter(function(m){return m.familiar&&m.facil;})
        : lunchPool;
      if(!lPool.length) lPool = lunchPool;
      if(isRegenDay) lPool = _filterRegen(lPool);

      // WILDCARD: este día ignora el slotHint y elige el plato con mayor cravingScore
      // para inyectar espontaneidad y romper la previsibilidad del sistema.
      var isWildcard = useWildcard && !isSat && day === wildcardDay;
      var lSlotHint  = isWildcard ? null : {protein: slot.slotProtein};

      var lPicked=smartPick(lPool, usedL, usedLPlate, usedLCook,
        function(){return {build:function(){return composeMeal(LUNCH_COMBOS[0]);},protein:"pollo",plateType:"caliente_arroz"};},
        lSlotHint, dayCtx, isWildcard ? "libre" : dayMood);
      lunch=lPicked.build();
      // En días wildcard: añadir nota discreta en el título para que el usuario "lo sienta"
      if(isWildcard && lunch) lunch = Object.assign({}, lunch, {wildcard:true});
      usedL.push(lPicked.protein||"pollo");
      usedLCook.push(lPicked.cookM||"");
      if(lPicked.plateType==="sopa_crema" && lPicked.veggie) usedL.push("sopa:"+lPicked.veggie);
      usedLPlate.push(lPicked.plateType||"caliente_arroz");
      recordMeal(lPicked.protein||"pollo", lPicked.plateType||"caliente_arroz", lPicked.culinaryStyle||null, lPicked.cuisineExperience||null, lPicked.tempFeel||null);
      recordDayCtx(lPicked);
      // ── freeForm frequency tracking (lunch) ──────────────────────
      if (lPicked._spec && lPicked._spec.freeForm === true) {
        var lffId = lPicked._spec.identity && lPicked._spec.identity.id;
        if (lffId) {
          var lffEntry = weeklyFreeFormIds[lffId];
          if (!lffEntry || lffEntry.weekKey !== CURRENT_WEEK) {
            weeklyFreeFormIds[lffId] = { count: 1, weekKey: CURRENT_WEEK };
          } else {
            lffEntry.count += 1;
          }
        }
      }
      // ── fin freeForm frequency tracking (lunch) ──────────────────
    }

    // Dinner: slot hint + training override + weekly cap + family-aware
    var dinner;
    if(n===2){
      dinner=null;
    } else if(isTrain(day)){
      var td = TRAINING_DINNERS[usedD.length % TRAINING_DINNERS.length];
      dinner = composeMeal(td);
      usedD.push("pollo");
      usedDPlate.push("caliente_arroz");
      recordMeal("pollo","caliente_arroz","casero");
      // training dinners don't add to dayCtx — they're overrides
    } else {
      var dPool = isSimple
        ? dinnerPool.filter(function(m){return m.plateType==="plancha_verdura"||m.plateType==="sopa_crema"||m.plateType==="huevo_plancha";})
        : dinnerPool;
      if(!dPool.length) dPool = dinnerPool;
      if(isRegenDay) dPool = _filterRegen(dPool);
      var dSlotHint = {plateType: slot.slotDinner};
      var dPicked=smartPick(dPool, usedD, usedDPlate, usedDCook,
        function(){return {build:function(){return composeMeal(DINNER_COMBOS[0]);},protein:"pavo",plateType:"plancha_verdura"};},
        dSlotHint, dayCtx, dayMood);
      dinner=dPicked.build();
      usedD.push(dPicked.protein||"pavo");
      usedDCook.push(dPicked.cookM||"");
      if(dPicked.plateType==="sopa_crema" && dPicked.veggie) usedD.push("sopa:"+dPicked.veggie);
      usedDPlate.push(dPicked.plateType||"plancha_verdura");
      recordMeal(dPicked.protein||"pavo", dPicked.plateType||"plancha_verdura", dPicked.culinaryStyle||null, dPicked.cuisineExperience||null, dPicked.tempFeel||null);
      recordDayCtx(dPicked);
      // ── freeForm frequency tracking (dinner) ─────────────────────
      if (dPicked._spec && dPicked._spec.freeForm === true) {
        var dffId = dPicked._spec.identity && dPicked._spec.identity.id;
        if (dffId) {
          var dffEntry = weeklyFreeFormIds[dffId];
          if (!dffEntry || dffEntry.weekKey !== CURRENT_WEEK) {
            weeklyFreeFormIds[dffId] = { count: 1, weekKey: CURRENT_WEEK };
          } else {
            dffEntry.count += 1;
          }
        }
      }
      // ── fin freeForm frequency tracking (dinner) ─────────────────
    }

    // Attach slot note to lunch so the UI can display it
    // If tiempoCocina:"poco" overrode the mood to "rapido", show a contextual note
    var effectiveNote = slot.slotNote;
    if(!isSat && tiempoCocina === "poco" && slot.mood !== "libre" && slot.mood !== "rapido") {
      effectiveNote = "⚡ Día rápido — recetas de menos de 15 min para que no te compliques.";
    }
    if(lunch && lunch.wildcard) {
      effectiveNote = "✨ Día sorpresa — el plan se ha salido un poco del guión. Así la semana no se vuelve predecible.";
    }
    if(lunch && effectiveNote && !isSat) {
      lunch = Object.assign({}, lunch, {slotNote: effectiveNote});
    }

    var almuerzo=(n>=4)?SNACKS_AM[snackAmIdx++%SNACKS_AM.length]:null;
    var merienda=(n>=5)?SNACKS_PM[snackPmIdx++%SNACKS_PM.length]:null;

    var meals=[];
    if(n===2){
      var bigLunch=isSat?libreComida():Object.assign({},lunch,{title:lunch.title+" (comida principal)",
        p1:lunch.p1.replace(/\((\d+)g\)/g,function(full,g){return "("+Math.round(parseInt(g)*1.25)+"g)";})});
      meals=[breakfast,bigLunch];
    } else if(n===3){
      meals=[breakfast,lunch,dinner];
    } else if(n===4){
      meals=[breakfast,almuerzo,lunch,dinner];
    } else {
      meals=[breakfast,almuerzo,lunch,merienda,dinner];
    }

    // Restaurar proteinMult tras generar todos los meals del día
    rules.proteinMult = _savedProteinMult;

    return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:isSat?"libre":isTrain(day)?"entrenamiento":null, mood:slot.mood||null, effectiveMood:dayMood, meals:meals, shakeEnabled:!!profile.extras.proteinShake.enabled};
  });

  // Persist this week's protein sequence for cross-week memory
  saveMealMemory(getWeekNumber(), usedL, usedD);

  // ── VALIDATE WEEK — pasada de integridad post-generación ─────────────────
  // Detecta problemas que el scorer local no puede ver (solo ve día a día).
  // Devuelve {warnings:[], score:0-100, problems:[]} para la UI.
  // score: 100 = semana perfectamente variada / 0 = monotonía total.
  function validateWeek(days) {
    var warnings = [];
    var problems = [];
    var deductions = 0;

    // 1. Exclusiones HARD — rastreo de ingredientes eliminados en texto
    if(_eliminated.length > 0) {
      days.forEach(function(day) {
        (day.meals||[]).forEach(function(meal) {
          if(!meal) return;
          var text = ((meal.title||"")+" "+(meal.p1||"")+" "+(meal.p2||"")).toLowerCase();
          _eliminated.forEach(function(ef) {
            if(text.indexOf(ef) > -1) {
              problems.push("❌ "+day.name+": posible rastro de '"+ef+"' — revisa '"+meal.title+"'");
              deductions += 20;
            }
          });
        });
      });
    }

    // 2. Familia proteica — demasiadas aves / pescado / etc.
    var famCount = {};
    Object.keys(weeklyCuisineExp).forEach(function(k){ famCount[k] = weeklyCuisineExp[k]; });
    var aveTotal = (weeklyProteinCount["ave"]||0);
    var pescTotal= (weeklyProteinCount["pescado"]||0);
    if(aveTotal > 4) {
      warnings.push("🍗 Demasiada ave esta semana ("+aveTotal+" veces) — considera sustituir un día.");
      deductions += 8;
    }
    if(pescTotal > 2) {
      warnings.push("🐟 Pescado "+pescTotal+" veces — lo recomendable es máximo 2/semana.");
      deductions += 10;
    }

    // 3. Experiencia culinaria percibida — monotonía de sensación
    var cxpThreshold = {
      comfort_caliente: {max:4, label:"platos de cocina de cuchara o comfort"},
      plancha_ligera:   {max:5, label:"platos a la plancha"},
      bowl_fresco:      {max:4, label:"bowls o ensaladas"},
      horno_mediterraneo:{max:5,label:"platos al horno"},
      wok_asiatico:     {max:3, label:"platos asiáticos o wok"},
      pasta_italiana:   {max:2, label:"platos de pasta"},
    };
    Object.keys(weeklyCuisineExp).forEach(function(cxp) {
      var count = weeklyCuisineExp[cxp]||0;
      var th = cxpThreshold[cxp];
      if(th && count > th.max) {
        warnings.push("🔄 "+count+" "+th.label+" esta semana — la semana se puede sentir repetitiva.");
        deductions += 6;
      }
    });

    // 4. Técnica de cocina — demasiada plancha
    var planchaCount = Object.keys(weeklyProteinCount).reduce(function(acc, k) {
      return acc; // planchaCount se mide por weeklyCuisineExp
    }, 0);
    var planchaReal = (weeklyCuisineExp["plancha_ligera"]||0) + (weeklyCuisineExp["horno_mediterraneo"]||0);
    // ya cubierto arriba

    // 5. Temperatura percibida — todo caliente o todo frío
    var calCount  = (weeklyTempFeel["caliente"]||0) + (weeklyTempFeel["muy_caliente"]||0);
    var frioCount = weeklyTempFeel["frio"]||0;
    var totalMeals= calCount + frioCount;
    if(totalMeals > 0) {
      if(frioCount === 0 && totalMeals >= 8) {
        warnings.push("🌡️ La semana tiene todos los platos calientes — añade algún bowl o ensalada.");
        deductions += 5;
      }
      if(calCount === 0 && totalMeals >= 8) {
        warnings.push("🥗 La semana tiene todo frío — en días de invierno puede notarse poco reconfortante.");
        deductions += 5;
      }
    }

    // 6. Ritmo semanal — ¿hay equilibrio ligero/denso?
    var lightDays = 0; var heavyDays = 0;
    days.forEach(function(day) {
      var meals = (day.meals||[]).filter(Boolean);
      var densities = meals.map(function(m){ return (m.metadata&&m.metadata.saciedad)||"media"; });
      var bajaCount = densities.filter(function(d){ return d==="baja"; }).length;
      var altaCount = densities.filter(function(d){ return d==="alta"; }).length;
      if(bajaCount >= 2) lightDays++;
      if(altaCount >= 2) heavyDays++;
    });
    if(lightDays >= 5) {
      warnings.push("🌿 5+ días muy ligeros seguidos — el usuario puede sentir poca energía.");
      deductions += 4;
    }
    if(heavyDays >= 4) {
      warnings.push("💪 4+ días muy densos seguidos — puede ser difícil de mantener.");
      deductions += 4;
    }

    // 7. Sauce diversity — ¿demasiada salsa ajillo / plancha seca?
    Object.keys(weeklyCulinaryStyle).forEach(function(style) {
      if((weeklyCulinaryStyle[style]||0) >= 5) {
        warnings.push("🧄 Estilo '"+style+"' domina la semana — busca más variedad de sabores.");
        deductions += 3;
      }
    });

    // 8. Calorías diarias — heurística por tipo de plato
    var PLATE_KCAL = {
      // ── Legacy plateTypes ─────────────────────────────────────
      plancha_verdura:    320,
      sopa_crema:         280,
      huevo_plancha:      350,
      caliente_arroz:     520,
      caliente_patata:    490,
      ensalada:           380,
      bowl:               450,
      pasta:              560,
      legumbre:           480,
      libre:              600,
      pescado_horno:      390,
      desayuno:           350,

      // ── freeForm plateTypes (tanda 4.1–4.6) ──────────────────
      // Españoles
      sopa_fria:          360,
      guiso_verduras:     480,
      cocido_legumbre:    635,
      guiso_legumbre:     525,
      fideua:             580,
      patatas_canarias:   560,
      caldo_grelos:       565,
      caldo_repollo:      565,
      caldo_ligero:       350,
      paella:             605,
      tortilla:           570,
      ensaladilla:        630,
      ensalada_pasta:     635,
      empanada:           580,
      sopa_castellana:    380,
      pollo_ajillo:       560,
      menestra:           320,
      marmitako:          540,
      marisco_vapor:      310,

      // Mediterráneos / internacionales
      crema_verduras:     450,
      moussaka:           560,
      shakshuka:          540,
      hummus_bowl:        610,
      falafel_bowl:       595,
      sardinas_plancha:   420,
      mejillones_salsa:   340,
      pita_rellena:       570,
      ensalada_legumbre:  440,

      // Italianos
      pasta_carbonara:    760,
      pasta_norma:        620,
      risotto:            615,
      pizza:              625,
      gnocchi:            595,

      // Asiáticos
      curry:              555,
      pad_thai:           660,
      ramen:              555,
      wok:                650,
      gyozas:             410,
      sopa_coco:          420,
      bowl_salmon:        620,
      bibimbap:           680,
      bao:                490,
      sopa_miso:          280,
      teriyaki:           650,

      // Mexicanos / burgers
      tacos:              520,
      quesadilla:         650,
      burrito:            565,
      hamburguesa:        710,

      // Airfryer
      airfryer_pollo:     550,
      airfryer_pescado:   520,
      airfryer_verduras:  525,
      croquetas_af:       515,
      nuggets_af:         535,

      // Otros
      ceviche:            410,
      carpaccio:          440,
      huevos_rellenos:    400,
      esparragos_plato:   410,
      wrap:               625,
      bol_fruta:          470,
    };
    var dayKcalList = [];
    days.forEach(function(day) {
      var meals = (day.meals||[]).filter(Boolean);
      var dayKcal = 0;
      meals.forEach(function(meal) {
        if(meal.time === "Desayuno" || meal.time === "Almuerzo" || meal.time === "Merienda") {
          dayKcal += PLATE_KCAL.desayuno;
        } else {
          var pt = meal.metadata && meal.metadata.plateType ? meal.metadata.plateType : null;
          // Derivar plateType desde título si no está en metadata
          if(!pt) {
            var t = (meal.title||"").toLowerCase();
            if(t.indexOf("arroz")>-1)         pt = "caliente_arroz";
            else if(t.indexOf("patata")>-1)    pt = "caliente_patata";
            else if(t.indexOf("crema")>-1||t.indexOf("sopa")>-1) pt = "sopa_crema";
            else if(t.indexOf("ensalada")>-1)  pt = "ensalada";
            else if(t.indexOf("pasta")>-1)     pt = "pasta";
            else if(t.indexOf("legumbre")>-1||t.indexOf("lentejas")>-1||t.indexOf("garbanzos")>-1) pt = "legumbre";
            else if(t.indexOf("horno")>-1)     pt = "pescado_horno";
            else if(t.indexOf("huevo")>-1||t.indexOf("tortilla")>-1||t.indexOf("clara")>-1) pt = "huevo_plancha";
            else                               pt = "plancha_verdura";
          }
          dayKcal += (PLATE_KCAL[pt] || 350);
        }
      });
      dayKcalList.push({name: day.name, kcal: dayKcal});
      if(dayKcal < 1500) {
        warnings.push("[AJUSTE] "+day.name+": día bajo en energía (~"+Math.round(dayKcal)+" kcal) — déficit excesivo");
        // diagnóstico nutricional — no afecta scoring
      }
    });

    // 8b. Patrón: 2 días consecutivos < 1600 kcal
    for(var ci = 0; ci < dayKcalList.length - 1; ci++) {
      if(dayKcalList[ci].kcal < 1600 && dayKcalList[ci+1].kcal < 1600) {
        warnings.push("[AJUSTE] "+dayKcalList[ci].name+"–"+dayKcalList[ci+1].name+": 2 días consecutivos bajos en energía (<1600 kcal)");
      }
    }

    // 9. Proteína diaria estimada — heurística: base ~25g desayuno + ~40g comida + ~35g cena × proteinMult
    var estProteinBase = 100; // baseline at proteinMult 1.0 con 3 comidas
    var effProteinMult = rules ? (rules.proteinMult || 1.0) : 1.0;
    var estProtein = Math.round(estProteinBase * effProteinMult);
    if(estProtein < 130) {
      warnings.push("[AJUSTE] Proteína estimada insuficiente (~"+estProtein+"g) — objetivo mínimo 130g/día");
    }

    // 10. Patrón: 3 cenas consecutivas < 400 kcal
    var dinnerKcalList = [];
    days.forEach(function(day) {
      var meals = (day.meals||[]).filter(Boolean);
      var dinner = meals.find(function(m){ return m.time === "Cena"; });
      if(dinner) {
        var pt = dinner.metadata && dinner.metadata.plateType ? dinner.metadata.plateType : null;
        if(!pt) {
          var t = (dinner.title||"").toLowerCase();
          if(t.indexOf("arroz")>-1)         pt = "caliente_arroz";
          else if(t.indexOf("patata")>-1)    pt = "caliente_patata";
          else if(t.indexOf("crema")>-1||t.indexOf("sopa")>-1) pt = "sopa_crema";
          else if(t.indexOf("ensalada")>-1)  pt = "ensalada";
          else if(t.indexOf("huevo")>-1||t.indexOf("tortilla")>-1||t.indexOf("clara")>-1) pt = "huevo_plancha";
          else                               pt = "plancha_verdura";
        }
        dinnerKcalList.push(PLATE_KCAL[pt] || 320);
      } else {
        dinnerKcalList.push(null);
      }
    });
    for(var di = 0; di < dinnerKcalList.length - 2; di++) {
      var d0 = dinnerKcalList[di], d1 = dinnerKcalList[di+1], d2 = dinnerKcalList[di+2];
      if(d0 !== null && d1 !== null && d2 !== null && d0 < 400 && d1 < 400 && d2 < 400) {
        warnings.push("[AJUSTE] "+days[di].name+"–"+days[di+2].name+": 3 cenas consecutivas de baja densidad (<400 kcal)");
      }
    }

    var rawScore = 100 - deductions;

    console.log("WEEK VALIDATION DEBUG", {
      deductions,
      rawScore,
      weeklyCuisineExp,
      weeklyProteinCount,
      weeklyTempFeel
    });

    var score = Number.isFinite(rawScore)
      ? Math.max(0, Math.min(100, rawScore))
      : 0;
    return { warnings: warnings, problems: problems, score: score };
  }

  // ── CALL validateWeek and return ─────────────────────────────────────────
  var validation = validateWeek(days);
  return {
    days:         days,
    strategy:     strategy,
    weekWarnings: validation.warnings,
    weekProblems: validation.problems,
    weekScore:    validation.score,
  };
}

// ─── STEPPER ───────────────────────────────────────────────────────────────
function Stepper({label,value,onChange,min,max,step=1,unit}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft  ] = useState(String(value));
  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    setEditing(false);
  };
  return (
    <div style={{background:THEME.bgCard2,borderRadius:10,padding:"12px 14px",border:"1px solid #30363d"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:11,color:"#8b949e",letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>onChange(Math.max(min,value-step))} style={{width:28,height:28,borderRadius:"50%",border:"1px solid #444c56",background:THEME.bgCard,color:THEME.textPrimary,fontSize:16,cursor:"pointer",lineHeight:1,flexShrink:0}}>-</button>
          {editing
            ? <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
                style={{width:64,textAlign:"center",fontSize:22,fontWeight:700,color:THEME.accent,fontFamily:"'Playfair Display',Georgia,serif",background:"transparent",border:"none",borderBottom:"2px solid #e8a045",outline:"none"}}/>
            : <div style={{textAlign:"center",minWidth:64,cursor:"text"}} onClick={()=>{setDraft(String(value));setEditing(true);}}>
                <span style={{fontSize:22,fontWeight:700,color:THEME.accent,fontFamily:"'Playfair Display',Georgia,serif"}}>{value}</span>
                {unit&&<span style={{fontSize:10,color:THEME.textMuted,marginLeft:3}}>{unit}</span>}
              </div>
          }
          <button onClick={()=>onChange(Math.min(max,value+step))} style={{width:28,height:28,borderRadius:"50%",border:"1px solid #444c56",background:THEME.bgCard,color:THEME.textPrimary,fontSize:16,cursor:"pointer",lineHeight:1,flexShrink:0}}>+</button>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))}
        style={{width:"100%",accentColor:THEME.accent,cursor:"pointer",height:4}}/>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#555f6b",marginTop:4}}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}


// ─── BASE DE DATOS DE ALIMENTOS (kcal por 100g) ────────────────────────────
const FOOD_DB = [
  // ── HUEVOS ──────────────────────────────────────────────────────────────
  {name:"Huevo frito",              kcal100:196, defaultG:60},
  {name:"Huevo cocido",             kcal100:155, defaultG:55},
  {name:"Huevo revuelto con leche", kcal100:170, defaultG:100},
  {name:"Tortilla francesa",        kcal100:155, defaultG:100},
  {name:"Tortilla de patata",       kcal100:185, defaultG:150},
  // ── LÁCTEOS ─────────────────────────────────────────────────────────────
  {name:"Leche entera",             kcal100:65,  defaultG:250},
  {name:"Leche semidesnatada",      kcal100:46,  defaultG:250},
  {name:"Leche desnatada",          kcal100:34,  defaultG:250},
  {name:"Yogur natural",            kcal100:61,  defaultG:125},
  {name:"Yogur griego 0%",          kcal100:57,  defaultG:125},
  {name:"Yogur de sabores",         kcal100:95,  defaultG:125},
  {name:"Kéfir",                    kcal100:52,  defaultG:200},
  {name:"Queso manchego",           kcal100:392, defaultG:30},
  {name:"Queso brie",               kcal100:334, defaultG:30},
  {name:"Queso fresco 0%",          kcal100:74,  defaultG:80},
  {name:"Queso en lonchas",         kcal100:330, defaultG:20},
  {name:"Mozzarella",               kcal100:280, defaultG:50},
  {name:"Parmesano rallado",        kcal100:431, defaultG:15},
  {name:"Requesón",                 kcal100:90,  defaultG:100},
  {name:"Nata para cocinar",        kcal100:195, defaultG:50},
  {name:"Mantequilla",              kcal100:717, defaultG:10},
  // ── CARNES ──────────────────────────────────────────────────────────────
  {name:"Pechuga de pollo plancha", kcal100:150, defaultG:150},
  {name:"Pechuga de pollo frita",   kcal100:215, defaultG:150},
  {name:"Muslo de pollo asado",     kcal100:215, defaultG:150},
  {name:"Pechuga de pavo plancha",  kcal100:135, defaultG:150},
  {name:"Ternera magra plancha",    kcal100:185, defaultG:150},
  {name:"Chuletón de ternera",      kcal100:270, defaultG:300},
  {name:"Hamburguesa de ternera",   kcal100:250, defaultG:150},
  {name:"Cerdo lomo plancha",       kcal100:180, defaultG:150},
  {name:"Solomillo de cerdo",       kcal100:165, defaultG:150},
  {name:"Costillas de cerdo",       kcal100:290, defaultG:200},
  {name:"Cordero chuletas",         kcal100:290, defaultG:150},
  {name:"Conejo al horno",          kcal100:160, defaultG:200},
  {name:"Pato asado",               kcal100:339, defaultG:150},
  // ── EMBUTIDOS ───────────────────────────────────────────────────────────
  {name:"Jamón serrano",            kcal100:250, defaultG:30},
  {name:"Jamón cocido",             kcal100:130, defaultG:30},
  {name:"Chorizo",                  kcal100:455, defaultG:30},
  {name:"Salchichón",               kcal100:425, defaultG:30},
  {name:"Fuet",                     kcal100:440, defaultG:30},
  {name:"Mortadela",                kcal100:311, defaultG:30},
  {name:"Pavo fiambre",             kcal100:105, defaultG:40},
  {name:"Panceta",                  kcal100:520, defaultG:30},
  {name:"Bacon",                    kcal100:476, defaultG:30},
  {name:"Morcilla",                 kcal100:350, defaultG:50},
  {name:"Salchicha frankfurt",      kcal100:290, defaultG:50},
  {name:"Salchicha fresca",         kcal100:315, defaultG:80},
  {name:"Sobrasada",                kcal100:500, defaultG:30},
  // ── PESCADO Y MARISCO ───────────────────────────────────────────────────
  {name:"Salmón a la plancha",      kcal100:183, defaultG:175},
  {name:"Salmón ahumado",           kcal100:145, defaultG:50},
  {name:"Merluza al horno",         kcal100:82,  defaultG:175},
  {name:"Dorada a la sal",          kcal100:96,  defaultG:175},
  {name:"Bacalao al horno",         kcal100:105, defaultG:150},
  {name:"Trucha al horno",          kcal100:135, defaultG:175},
  {name:"Caballa en lata",          kcal100:185, defaultG:100},
  {name:"Sardinas en aceite",       kcal100:208, defaultG:100},
  {name:"Atún al natural",          kcal100:103, defaultG:80},
  {name:"Atún en aceite",           kcal100:200, defaultG:80},
  {name:"Gambas a la plancha",      kcal100:85,  defaultG:150},
  {name:"Langostinos cocidos",      kcal100:90,  defaultG:150},
  {name:"Mejillones al vapor",      kcal100:86,  defaultG:100},
  {name:"Pulpo a la gallega",       kcal100:82,  defaultG:150},
  {name:"Calamar a la romana",      kcal100:240, defaultG:150},
  {name:"Calamar a la plancha",     kcal100:90,  defaultG:150},
  {name:"Boquerones en vinagre",    kcal100:150, defaultG:100},
  {name:"Anchoas en aceite",        kcal100:210, defaultG:20},
  // ── VEGETALES Y VERDURAS ─────────────────────────────────────────────────
  {name:"Ensalada mixta",           kcal100:25,  defaultG:150},
  {name:"Espinacas cocidas",        kcal100:23,  defaultG:150},
  {name:"Brócoli al vapor",         kcal100:34,  defaultG:180},
  {name:"Coliflor al vapor",        kcal100:25,  defaultG:180},
  {name:"Judías verdes",            kcal100:31,  defaultG:180},
  {name:"Zanahorias crudas",        kcal100:41,  defaultG:100},
  {name:"Tomate",                   kcal100:18,  defaultG:100},
  {name:"Pepino",                   kcal100:16,  defaultG:100},
  {name:"Pimiento rojo",            kcal100:31,  defaultG:100},
  {name:"Calabacín a la plancha",   kcal100:35,  defaultG:150},
  {name:"Berenjena asada",          kcal100:35,  defaultG:150},
  {name:"Espárragos al horno",      kcal100:20,  defaultG:140},
  {name:"Champiñones salteados",    kcal100:45,  defaultG:100},
  {name:"Cebolla caramelizada",     kcal100:80,  defaultG:50},
  {name:"Aguacate",                 kcal100:160, defaultG:80},
  {name:"Alcachofa cocida",         kcal100:53,  defaultG:120},
  {name:"Acelgas cocidas",          kcal100:20,  defaultG:150},
  {name:"Puerro cocido",            kcal100:31,  defaultG:100},
  {name:"Apio",                     kcal100:16,  defaultG:80},
  {name:"Remolacha cocida",         kcal100:45,  defaultG:80},
  // ── LEGUMBRES ────────────────────────────────────────────────────────────
  {name:"Lentejas cocidas",         kcal100:116, defaultG:200},
  {name:"Garbanzos cocidos",        kcal100:164, defaultG:200},
  {name:"Alubias blancas cocidas",  kcal100:130, defaultG:200},
  {name:"Judías pintas cocidas",    kcal100:127, defaultG:200},
  {name:"Edamame",                  kcal100:121, defaultG:100},
  {name:"Hummus",                   kcal100:177, defaultG:50},
  // ── CEREALES Y HARINAS ───────────────────────────────────────────────────
  {name:"Arroz blanco cocido",      kcal100:130, defaultG:180},
  {name:"Pasta cocida",             kcal100:131, defaultG:180},
  {name:"Avena cruda",              kcal100:389, defaultG:55},
  {name:"Pan blanco",               kcal100:265, defaultG:50},
  {name:"Pan de centeno",           kcal100:258, defaultG:50},
  {name:"Pan de molde",             kcal100:270, defaultG:30},
  {name:"Boniato asado",            kcal100:90,  defaultG:180},
  {name:"Patata cocida",            kcal100:87,  defaultG:180},
  {name:"Patata asada",             kcal100:93,  defaultG:180},
  {name:"Patatas fritas caseras",   kcal100:312, defaultG:150},
  {name:"Patatas fritas bolsa",     kcal100:536, defaultG:30},
  {name:"Cuscús cocido",            kcal100:112, defaultG:150},
  {name:"Quinoa cocida",            kcal100:120, defaultG:150},
  // ── FRUTAS ───────────────────────────────────────────────────────────────
  {name:"Manzana",                  kcal100:52,  defaultG:150},
  {name:"Plátano",                  kcal100:89,  defaultG:120},
  {name:"Naranja",                  kcal100:47,  defaultG:150},
  {name:"Mandarina",                kcal100:53,  defaultG:100},
  {name:"Pera",                     kcal100:57,  defaultG:150},
  {name:"Uvas",                     kcal100:69,  defaultG:100},
  {name:"Fresas",                   kcal100:32,  defaultG:150},
  {name:"Arándanos",                kcal100:57,  defaultG:100},
  {name:"Mango",                    kcal100:60,  defaultG:150},
  {name:"Piña",                     kcal100:50,  defaultG:150},
  {name:"Kiwi",                     kcal100:61,  defaultG:100},
  {name:"Sandía",                   kcal100:30,  defaultG:200},
  {name:"Melón",                    kcal100:34,  defaultG:200},
  {name:"Melocotón",                kcal100:39,  defaultG:150},
  {name:"Cereza",                   kcal100:63,  defaultG:100},
  {name:"Ciruela",                  kcal100:46,  defaultG:80},
  {name:"Higo",                     kcal100:74,  defaultG:60},
  // ── FRUTOS SECOS Y SEMILLAS ──────────────────────────────────────────────
  {name:"Almendras",                kcal100:579, defaultG:25},
  {name:"Nueces",                   kcal100:654, defaultG:25},
  {name:"Pistachos",                kcal100:562, defaultG:25},
  {name:"Avellanas",                kcal100:628, defaultG:25},
  {name:"Anacardos",                kcal100:553, defaultG:25},
  {name:"Cacahuetes",               kcal100:567, defaultG:30},
  {name:"Pipas de girasol",         kcal100:582, defaultG:30},
  {name:"Semillas de chía",         kcal100:486, defaultG:15},
  {name:"Semillas de lino",         kcal100:534, defaultG:15},
  // ── ACEITES Y GRASAS ─────────────────────────────────────────────────────
  {name:"AOVE (aceite de oliva)",   kcal100:884, defaultG:10},
  {name:"Aceite de coco",           kcal100:862, defaultG:10},
  {name:"Mantequilla de cacahuete", kcal100:588, defaultG:30},
  // ── BOLLERÍA Y DULCES ────────────────────────────────────────────────────
  {name:"Palmera de chocolate",     kcal100:430, defaultG:80},
  {name:"Palmera normal",           kcal100:390, defaultG:80},
  {name:"Croissant mantequilla",    kcal100:406, defaultG:65},
  {name:"Croissant chocolate",      kcal100:430, defaultG:65},
  {name:"Napolitana chocolate",     kcal100:380, defaultG:80},
  {name:"Donut glaseado",           kcal100:380, defaultG:50},
  {name:"Magdalena",                kcal100:390, defaultG:40},
  {name:"Bizcocho",                 kcal100:340, defaultG:60},
  {name:"Tarta de queso",           kcal100:320, defaultG:100},
  {name:"Tiramisú",                 kcal100:280, defaultG:100},
  {name:"Brownie",                  kcal100:400, defaultG:80},
  {name:"Churros",                  kcal100:315, defaultG:100},
  {name:"Porras",                   kcal100:310, defaultG:100},
  {name:"Buñuelo",                  kcal100:350, defaultG:50},
  {name:"Galletas María",           kcal100:430, defaultG:30},
  {name:"Galletas Oreo",            kcal100:470, defaultG:30},
  {name:"Galletas digestive",       kcal100:463, defaultG:30},
  {name:"Galleta de avena",         kcal100:400, defaultG:30},
  {name:"Flan",                     kcal100:130, defaultG:100},
  {name:"Arroz con leche",          kcal100:130, defaultG:200},
  {name:"Natillas",                 kcal100:120, defaultG:125},
  {name:"Helado de vainilla",       kcal100:207, defaultG:100},
  {name:"Helado de chocolate",      kcal100:230, defaultG:100},
  {name:"Sorbete de limón",         kcal100:109, defaultG:100},
  // ── CHOCOLATE ────────────────────────────────────────────────────────────
  {name:"Chocolate negro 70%",      kcal100:570, defaultG:30},
  {name:"Chocolate con leche",      kcal100:530, defaultG:30},
  {name:"Chocolate blanco",         kcal100:539, defaultG:30},
  {name:"Kinder Bueno",             kcal100:555, defaultG:43},
  {name:"Kitkat",                   kcal100:508, defaultG:41},
  {name:"Ferrero Rocher",           kcal100:567, defaultG:12},
  {name:"Snickers",                 kcal100:488, defaultG:52},
  {name:"Twix",                     kcal100:495, defaultG:58},
  {name:"Lacasitos",                kcal100:476, defaultG:40},
  // ── SNACKS SALADOS ───────────────────────────────────────────────────────
  {name:"Nachos",                   kcal100:495, defaultG:50},
  {name:"Palomitas de cine",        kcal100:375, defaultG:100},
  {name:"Palomitas microondas",     kcal100:440, defaultG:40},
  {name:"Ritz crackers",            kcal100:483, defaultG:30},
  {name:"Doritos",                  kcal100:490, defaultG:40},
  // ── BEBIDAS ALCOHÓLICAS ──────────────────────────────────────────────────
  {name:"Cerveza (lata 330ml)",     kcal100:43,  defaultG:330},
  {name:"Cerveza sin alcohol",      kcal100:28,  defaultG:330},
  {name:"Vino tinto (copa)",        kcal100:85,  defaultG:150},
  {name:"Vino blanco (copa)",       kcal100:82,  defaultG:150},
  {name:"Vino rosado (copa)",       kcal100:80,  defaultG:150},
  {name:"Cava o champán",           kcal100:76,  defaultG:150},
  {name:"Whisky",                   kcal100:250, defaultG:40},
  {name:"Gin tonic",                kcal100:80,  defaultG:250},
  {name:"Ron con cola",             kcal100:65,  defaultG:200},
  {name:"Sangría",                  kcal100:65,  defaultG:250},
  {name:"Sidra",                    kcal100:36,  defaultG:330},
  // ── BEBIDAS SIN ALCOHOL ──────────────────────────────────────────────────
  {name:"Refresco cola",            kcal100:42,  defaultG:330},
  {name:"Refresco naranja",         kcal100:45,  defaultG:330},
  {name:"Zumo naranja natural",     kcal100:45,  defaultG:200},
  {name:"Zumo de manzana",          kcal100:47,  defaultG:200},
  {name:"Batido de chocolate",      kcal100:80,  defaultG:250},
  {name:"Café con leche",           kcal100:35,  defaultG:200},
  {name:"Café solo",                kcal100:2,   defaultG:50},
  {name:"Café con azúcar",          kcal100:20,  defaultG:100},
  {name:"Zumo verde (kale-manzana)",kcal100:40,  defaultG:250},
  {name:"Agua con gas",             kcal100:0,   defaultG:330},
  // ── COMIDA RÁPIDA Y RESTAURANTE ──────────────────────────────────────────
  {name:"Pizza margarita",          kcal100:265, defaultG:200},
  {name:"Pizza pepperoni",          kcal100:300, defaultG:200},
  {name:"Hamburguesa completa",     kcal100:295, defaultG:250},
  {name:"Perrito caliente",         kcal100:280, defaultG:150},
  {name:"Patatas fritas McDonald's",kcal100:312, defaultG:115},
  {name:"Kebab de pollo",           kcal100:190, defaultG:300},
  {name:"Kebab de ternera",         kcal100:210, defaultG:300},
  {name:"Sushi (pieza)",            kcal100:145, defaultG:30},
  {name:"Sushi variado (bandeja)",  kcal100:145, defaultG:200},
  {name:"Pad thai",                 kcal100:185, defaultG:300},
  {name:"Tacos de pollo (ud)",      kcal100:185, defaultG:100},
  // ── TAPAS Y RACIONES ─────────────────────────────────────────────────────
  {name:"Croqueta de jamón",        kcal100:230, defaultG:40},
  {name:"Patatas bravas",           kcal100:200, defaultG:150},
  {name:"Pan con tomate",           kcal100:165, defaultG:80},
  {name:"Empanada gallega",         kcal100:280, defaultG:100},
  {name:"Pimientos de padrón",      kcal100:60,  defaultG:100},
  {name:"Gambas al ajillo",         kcal100:175, defaultG:150},
  {name:"Chipirones plancha",       kcal100:90,  defaultG:150},
  {name:"Jamón ibérico (tapa)",     kcal100:375, defaultG:30},
  {name:"Tabla de quesos",          kcal100:370, defaultG:80},
  {name:"Aceitunas",                kcal100:145, defaultG:50},
  {name:"Anchoas en tosta",         kcal100:215, defaultG:50},
  {name:"Pulpo a la gallega",       kcal100:82,  defaultG:150},
  {name:"Boquerones fritos",        kcal100:220, defaultG:100},
  // ── PLATOS TÍPICOS ───────────────────────────────────────────────────────
  {name:"Paella valenciana",        kcal100:130, defaultG:350},
  {name:"Cocido madrileño",         kcal100:155, defaultG:400},
  {name:"Fabada asturiana",         kcal100:180, defaultG:350},
  {name:"Gazpacho",                 kcal100:50,  defaultG:250},
  {name:"Salmorejo",                kcal100:120, defaultG:200},
  {name:"Puchero",                  kcal100:140, defaultG:350},
  {name:"Menú del día (medio)",     kcal100:250, defaultG:500},
  // ── SALSAS Y CONDIMENTOS ────────────────────────────────────────────────
  {name:"Mayonesa",                 kcal100:680, defaultG:20},
  {name:"Ketchup",                  kcal100:100, defaultG:20},
  {name:"Salsa barbacoa",           kcal100:120, defaultG:30},
  {name:"Salsa de soja",            kcal100:60,  defaultG:15},
  {name:"Mostaza",                  kcal100:66,  defaultG:15},
  {name:"Miel",                     kcal100:304, defaultG:15},
  {name:"Mermelada",                kcal100:250, defaultG:20},
  {name:"Crema de cacao (Nutella)", kcal100:539, defaultG:20},
  {name:"Guacamole",                kcal100:155, defaultG:50},
  {name:"Hummus",                   kcal100:177, defaultG:50},
];

function searchFoods(query) {
  if(!query || query.length<2) return [];
  const q = query.toLowerCase().trim();
  // Score: starts-with gets higher priority than includes
  return FOOD_DB
    .map(f=>{
      const name=f.name.toLowerCase();
      const score=name.startsWith(q)?0:name.includes(q)?1:99;
      return {f,score};
    })
    .filter(x=>x.score<99)
    .sort((a,b)=>a.score-b.score)
    .map(x=>x.f)
    .slice(0,6);
}


function calcFoodKcal(food, grams) {
  return Math.round(food.kcal100 * grams / 100);
}
function getDefaultAlts(meal) {
  if(meal.alt && meal.alt.length>0) return meal.alt;
  const p1=(meal.p1||"").toLowerCase();
  const time=(meal.time||"").toLowerCase();
  if(p1.includes("pollo"))   return ["Pavo a la plancha en lugar de pollo","Ternera magra en lugar de pollo","Solomillo de cerdo en lugar de pollo"];
  if(p1.includes("pavo"))    return ["Pollo a la plancha en lugar de pavo","Ternera magra en lugar de pavo","Solomillo de cerdo en lugar de pavo"];
  if(p1.includes("ternera")) return ["Pollo a la plancha en lugar de ternera","Pavo a la plancha en lugar de ternera","Solomillo de cerdo en lugar de ternera"];
  if(p1.includes("cerdo") || p1.includes("solomillo") || p1.includes("lomo"))
                             return ["Pollo a la plancha en lugar de cerdo","Pavo a la plancha en lugar de cerdo","Ternera magra en lugar de cerdo"];
  if(p1.includes("salmón"))  return ["Trucha al horno en lugar de salmón","Caballa al horno en lugar de salmón","Merluza al horno en lugar de salmón"];
  if(p1.includes("merluza")) return ["Bacalao al horno en lugar de merluza","Dorada al horno en lugar de merluza","Salmón al horno en lugar de merluza"];
  if(p1.includes("dorada"))  return ["Merluza al horno en lugar de dorada","Lubina a la sal en lugar de dorada","Bacalao al horno en lugar de dorada"];
  if(p1.includes("bacalao")) return ["Merluza al horno en lugar de bacalao","Dorada al horno en lugar de bacalao","Trucha al horno en lugar de bacalao"];
  if(p1.includes("trucha"))  return ["Salmón al horno en lugar de trucha","Caballa al horno en lugar de trucha","Merluza al horno en lugar de trucha"];
  if(p1.includes("gambas"))  return ["Langostinos en lugar de gambas","Merluza a la plancha si no hay gambas","Pollo a la plancha en lugar de gambas"];
  if(p1.includes("langostino")) return ["Gambas a la plancha en lugar de langostinos","Merluza a la plancha en lugar de langostinos","Pollo a la plancha"];
  if(p1.includes("atún"))    return ["Sardinas en lugar de atún","Pollo a la plancha en lugar de atún","Huevo duro en lugar de atún"];
  if(p1.includes("lentejas"))return ["Alubias blancas en lugar de lentejas","Garbanzos en lugar de lentejas","Judías pintas en lugar de lentejas"];
  if(p1.includes("alubias")) return ["Lentejas en lugar de alubias","Garbanzos en lugar de alubias","Judías pintas en lugar de alubias"];
  if(p1.includes("garbanzo"))return ["Lentejas en lugar de garbanzos","Alubias blancas en lugar de garbanzos","Judías pintas en lugar de garbanzos"];
  if(p1.includes("pasta"))   return ["Arroz blanco en lugar de pasta","Boniato asado en lugar de pasta","Patata cocida en lugar de pasta"];
  if(p1.includes("huevo") || p1.includes("tortilla") || p1.includes("revuelto"))
                             return ["Añadir jamón serrano (40g)","Pavo a la plancha en lugar de huevos","Queso fresco 0% en lugar de aguacate"];
  if(p1.includes("crema") || p1.includes("sopa"))
                             return ["Crema de calabaza en lugar de calabacín","Sopa de verduras en lugar de crema","Gazpacho frío en verano"];
  if(p1.includes("avena"))   return ["2 huevos a la plancha en lugar de avena","Tostadas con jamón en lugar de avena","Yogur griego con fruta en lugar de avena"];
  if(p1.includes("tostada")) return ["Avena caliente en lugar de tostadas","2 huevos a la plancha en lugar de tostadas","Yogur griego con fruta"];
  // second plate swaps
  if((meal.p2||"").toLowerCase().includes("arroz"))   return ["Boniato asado en lugar de arroz","Patata cocida en lugar de arroz","Quinoa cocida en lugar de arroz"];
  if((meal.p2||"").toLowerCase().includes("patata"))  return ["Boniato asado en lugar de patata","Arroz blanco en lugar de patata","Coliflor al vapor en lugar de patata"];
  if((meal.p2||"").toLowerCase().includes("boniato")) return ["Patata cocida en lugar de boniato","Arroz blanco en lugar de boniato","Coliflor al vapor en lugar de boniato"];
  return ["Cambiar proteína principal","Cambiar el hidrato del plato 2","Pedir sugerencia al nutricionista"];
}


// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM DB — multi-user localStorage layer
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE CONFIG
// ═══════════════════════════════════════════════════════════════════════════
// This implementation uses the Supabase REST API directly via fetch —
// zero external dependencies, fully self-contained.

const SUPABASE_URL   = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY   = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── SDB — Async Supabase layer ────────────────────────────────────────────
// This is the ONLY place that talks to Supabase.
// Components NEVER call SDB directly — they call PDB (synchronous, localStorage).
// SyncEngine bridges the two layers.
const SDB = {
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
    // Store refresh token in its own key (never mixed with user data)
    try { localStorage.setItem("pf_sb_rt", JSON.stringify({ r: refresh, u: uid })); } catch(e) {}
  },
  _clearTokens: () => {
    SDB._token = null; SDB._refresh = null; SDB._uid = null;
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
    await SDB._rest("/assignments", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: a.id, nid: a.nid, cid: a.cid, created_at: new Date(a.createdAt || Date.now()).toISOString() }),
    });
  },

  deleteAssignment: async (cid, nid) => {
    if (!SDB._token) return;
    await SDB._rest(`/assignments?cid=eq.${cid}&nid=eq.${nid}`, { method: "DELETE" });
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
    const { data } = await SDB._rest(`/user_data?uid=eq.${uid}&key=eq.${key}&select=value`);
    return data?.[0]?.value ?? null;
  },

  setUserData: async (uid, key, value) => {
    if (!SDB._token) return;
    await SDB._rest("/user_data", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ uid, key, value, updated_at: new Date().toISOString() }),
    });
  },

  // ── Preferences ──────────────────────────────────────────────────────────
  getPreferences: async (uid) => {
    const { data } = await SDB._rest(`/preferences?uid=eq.${uid}&limit=1`);
    if (!data?.[0]) return null;
    const r = data[0];
    return {
      gender:        r.gender,
      age:           r.age,
      weight:        r.weight_kg,
      height:        r.height_cm,
      activity:      r.activity_level,
      goal:          r.goal,
      kcalAdjust:    r.kcal_adjust   ?? 0,
      intolerances:  r.intolerances  ?? [],
      eliminatedFoods: r.eliminated_foods ?? [],
      trainingDays:  r.training_days ?? [],
      ...r.extra,
    };
  },

  upsertPreferences: async (uid, prof) => {
    if (!SDB._token) return;
    await SDB._rest("/preferences", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        uid,
        gender:          prof.gender,
        age:             prof.age,
        weight_kg:       prof.weight,
        height_cm:       prof.height,
        activity_level:  prof.activity,
        goal:            prof.goal,
        kcal_adjust:     prof.kcalAdjust ?? 0,
        intolerances:    prof.intolerances     ?? [],
        eliminated_foods: prof.eliminatedFoods ?? [],
        training_days:   prof.trainingDays     ?? [],
        extra:           {},
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
    const { data } = await SDB._rest(
      `/meal_memory?uid=eq.${uid}&order=week_num.desc&limit=3`
    );
    return (data || []).map(r => ({
      week: r.week_num,
      L:    r.lunch_proteins  || [],
      D:    r.dinner_proteins || [],
    }));
  },

  upsertMealMemory: async (uid, weekNum, L, D, extraData = {}) => {
    if (!SDB._token) return;
    await SDB._rest("/meal_memory", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        uid,
        week_num:        weekNum,
        lunch_proteins:  L || [],
        dinner_proteins: D || [],
        food_likes:      extraData.foodLikes    || {},
        food_dislikes:   extraData.foodDislikes || {},
        fail_patterns:   extraData.failPatterns || [],
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

function _sbToLocalPlan(r) {
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
    weekScore:       r.week_score != null
                     ? r.week_score
                     : (PDB.getPlans(r.uid).find(p => p.id === r.id)?.weekScore ?? null),
    created_at:      typeof r.created_at === "number" ? r.created_at : new Date(r.created_at).getTime(),
    updated_at:      typeof r.updated_at === "number" ? r.updated_at : new Date(r.updated_at).getTime(),
  };
}

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
        const progKey = "nutri_v2_prog_" + uid;
        try { localStorage.setItem(progKey, JSON.stringify(prog)); } catch(e) {}
        console.info("[SyncEngine] pullFromCloud: progress merged");
      }

      // 4. Meal memory
      const mem = await SDB.getMealMemory(uid);
      if (mem?.length) {
        const memKey = "nutri_v2_mem_" + uid;
        try { localStorage.setItem(memKey, JSON.stringify(mem)); } catch(e) {}
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

// BUG FIX — pre-flight validator for handleGenerate.
// Reasoning: the intermittent "Generar plan" bug is most likely caused by
// buildPlan() throwing on an undefined field (e.g. profile.intolerances.includes
// when intolerances is undefined). The catch in handleGenerate silently
// swallows the error, the user sees "nothing happened", and clicks again.
// This validator runs cheap checks BEFORE buildPlan and returns a reason
// string the UI can surface to the user.
function __validateProfileForGenerate(pr) {
  if (!_isObj(pr)) return { ok:false, reason:"perfil ausente" };
  if (typeof pr.weight !== "number" || pr.weight < 30 || pr.weight > 250)
    return { ok:false, reason:"peso fuera de rango (30–250kg)" };
  if (typeof pr.height !== "number" || pr.height < 130 || pr.height > 230)
    return { ok:false, reason:"altura fuera de rango (130–230cm)" };
  if (typeof pr.age !== "number" || pr.age < 10 || pr.age > 100)
    return { ok:false, reason:"edad fuera de rango (10–100)" };
  if (!Array.isArray(pr.intolerances))
    return { ok:false, reason:"intolerancias inválidas" };
  if (!Array.isArray(pr.trainingDays))
    return { ok:false, reason:"días de entreno inválidos" };
  if (!Array.isArray(pr.eliminatedFoods))
    return { ok:false, reason:"alimentos eliminados inválidos" };
  if (!pr.goal || typeof pr.goal !== "string")
    return { ok:false, reason:"objetivo no seleccionado" };
  if (!pr.gender || typeof pr.gender !== "string")
    return { ok:false, reason:"género no seleccionado" };
  if (!pr.activity || typeof pr.activity !== "string")
    return { ok:false, reason:"nivel de actividad no seleccionado" };
  return { ok:true };
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

  // SESSION
  getSession: () => PDB._g("pf_session"),
  setSession: user => {
    PDB._s("pf_session", user);
    _setUid(user ? user.id : "anon");
    // Drain any queued sync ops whenever session is (re)set with a valid user
    if (user) SyncEngine._drain();
  },
  clearSession: () => {
    PDB._s("pf_session", null);
    _setUid("anon");
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

// Inline SVG eye icons — no external dependency, shared by auth forms
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// AUTH VIEW — login / register (with two register flows)
// ═══════════════════════════════════════════════════════════════════════════
function AuthView({ onLogin }) {
  __PERF.render("AuthView");  // PERF
  const serif = SERIF_EMOJI;
  const sans  = SANS_EMOJI;
  const Dk = { bg:THEME.bgPage, card:THEME.bgCard, card2:THEME.bgCard2, border:THEME.borderDark, text:THEME.textPrimary, muted:THEME.textMuted, accent:THEME.accent };

  const [tab,        setTab]        = useState("login"); // "login" | "register" | "forgot"
  const [regMode,    setRegMode]    = useState("auto");
  const [email,      setEmail]      = useState(() => {
    try {
      return localStorage.getItem("np_remembered_email") || "";
    } catch(e) {
      return "";
    }
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [pass,       setPass]       = useState(() => {
    try {
      return localStorage.getItem("np_remembered_pass") || "";
    } catch(e) { return ""; }
  });
  const [role,       setRole]       = useState("user");
  const [nutriEmail, setNutriEmail] = useState("");
  const [error,        setError]        = useState("");
  const [info,         setInfo]         = useState(""); // mensaje éxito forgot
  const [loading,      setLoading]      = useState(false);
  const [showPass,     setShowPass]     = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false); // email confirmation pending
  const [applicationState, setApplicationState] = useState('none'); // 'none'|'submitted'|'pending'|'rejected'
  const [fullName,       setFullName]       = useState('');
  const [licenseNumber,  setLicenseNumber]  = useState('');
  const [specialty,      setSpecialty]      = useState('');
  const [phone,          setPhone]          = useState('');
  const [dni,            setDni]            = useState('');
  const [dniFile,        setDniFile]        = useState(null);
  const [dniFileError,   setDniFileError]   = useState("");

  const inp = { width:"100%", boxSizing:"border-box", padding:"11px 14px", borderRadius:8, border:"1.5px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:14, outline:"none" };

  const goTab = (t) => { setTab(t); setError(""); setInfo(""); setConfirmEmail(false); setApplicationState('none'); };
  const resetState = () => { setApplicationState('none'); setError(""); };

  // ── Validación de archivo DNI ──────────────────────────────────────────
  const handleDniFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "application/pdf"].includes(file.type)) {
      setDniFileError("Solo se aceptan archivos JPG o PDF");
      setDniFile(null); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setDniFileError("El archivo no puede superar 5MB");
      setDniFile(null); return;
    }
    setDniFile(file);
    setDniFileError("");
  };

  // ── Recuperación de contraseña ─────────────────────────────────────────
  const handleForgot = async () => {
    setError(""); setInfo(""); setLoading(true);
    if (!email.trim()) {
      setError("Introduce tu email para recuperar la contraseña.");
      setLoading(false); return;
    }
    const { ok, error: sbErr } = await SDB.resetPassword(email.trim());
    if (!ok) {
      setError(sbErr || "No se pudo enviar el email. Inténtalo más tarde.");
    } else {
      setInfo("📬 Email enviado. Revisa tu bandeja (y spam). El link caduca en 1 hora.");
    }
    setLoading(false);
  };

  // ── Login / Registro ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(""); setInfo(""); setLoading(true);
    try {
      if (tab === "login") {
        const u = await PDB.loginUser(email.trim(), pass);
        if (!u) {
          const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
          setError(isOffline ? "Sin conexión. Verifica tu internet." : "Email o contraseña incorrectos.");
          setLoading(false); return;
        }
        if (u.error === "CONFIRM_EMAIL") {
          setConfirmEmail(true);
          setLoading(false); return;
        }
        if (u.role === 'user') {
          const appStatus = await SDB.getNutriApplicationStatus(u.id);
          if (appStatus === 'pending')  { setApplicationState('pending');  setLoading(false); return; }
          if (appStatus === 'rejected') { setApplicationState('rejected'); setLoading(false); return; }
          // 'approved' or null → continue normal login flow
        }
        await SyncEngine.pullFromCloud(u.id);
        await SyncEngine.migrateExistingData();
        if (rememberMe && tab === "login") {
          try {
            const normalizedEmail = email.trim().toLowerCase();
            if (normalizedEmail) {
              localStorage.setItem("np_remembered_email", normalizedEmail);
              localStorage.setItem("np_remembered_pass", pass);
            }
          } catch(e) {}
        } else {
          try {
            localStorage.removeItem("np_remembered_email");
            localStorage.removeItem("np_remembered_pass");
          } catch(e) {}
        }
        onLogin(u);
      } else {
        if (!email.trim() || pass.length < 6) { setError("Completa todos los campos (mínimo 6 caracteres)."); setLoading(false); return; }

        if (role === 'nutritionist') {
          // Validate professional fields
          const dniRegex = /^[0-9]{8}[A-Za-z]$/;
          if (!fullName.trim())           { setError("El nombre completo es obligatorio."); setLoading(false); return; }
          if (!licenseNumber.trim())      { setError("El número de colegiado es obligatorio."); setLoading(false); return; }
          if (!specialty.trim())          { setError("La especialidad es obligatoria."); setLoading(false); return; }
          if (!phone.trim())              { setError("El teléfono es obligatorio."); setLoading(false); return; }
          if (!dniRegex.test(dni.trim())) { setError("DNI inválido — debe tener 8 dígitos y una letra (ej: 12345678A)."); setLoading(false); return; }
          if (!dniFile) { setError("El documento DNI es obligatorio."); setLoading(false); return; }

          // Create account always as role='user'
          const res = await PDB.createUser(email.trim(), pass, 'user');
          if (res.error) {
            if (res.error === "CONFIRM_EMAIL") { setConfirmEmail(true); setLoading(false); return; }
            const errMap = {
              "User already registered":     "Este email ya está registrado. Intenta iniciar sesión.",
              "Email already registered":    "Este email ya está registrado.",
              "Password should be at least": "La contraseña debe tener al menos 6 caracteres.",
              "session_expired":             "Tu sesión expiró. Vuelve a iniciar sesión.",
            };
            const mapped = Object.entries(errMap).find(([k]) => String(res.error).includes(k));
            setError(mapped ? mapped[1] : (res.error || "Error al crear cuenta."));
            setLoading(false); return;
          }

          const uploadRes = await SDB.uploadDniDocument(res.user.id, dniFile);
          if (uploadRes.error) {
            setError("Error subiendo el documento. Inténtalo de nuevo.");
            setLoading(false); return;
          }

          const appRes = await SDB.submitNutriApplication(res.user.id, {
            full_name:        fullName.trim(),
            license_number:   licenseNumber.trim(),
            specialty:        specialty.trim(),
            phone:            phone.trim(),
            dni:              dni.trim(),
            dni_document_url: uploadRes.url,
          });
          if (appRes.error) {
            setError("Error enviando la solicitud. Intenta iniciar sesión para consultar el estado.");
            setLoading(false); return;
          }

          setApplicationState('submitted');
          setLoading(false); return;
        }

        // Normal user registration (role === 'user')
        const res = await PDB.createUser(email.trim(), pass, role);
        if (res.error) {
          if (res.error === "CONFIRM_EMAIL") {
            setConfirmEmail(true);
            setLoading(false); return;
          }
          const errMap = {
            "User already registered":     "Este email ya está registrado. Intenta iniciar sesión.",
            "Email already registered":    "Este email ya está registrado.",
            "Password should be at least": "La contraseña debe tener al menos 6 caracteres.",
            "session_expired":             "Tu sesión expiró. Vuelve a iniciar sesión.",
          };
          const mapped = Object.entries(errMap).find(([k]) => String(res.error).includes(k));
          setError(mapped ? mapped[1] : (res.error || "Error al crear cuenta."));
          setLoading(false); return;
        }
        if (role === "user" && regMode === "nutri") {
          const nutr = PDB.getUserByEmail(nutriEmail.trim());
          if (!nutr || nutr.role !== "nutritionist") {
            setError("No se encontró ningún nutricionista con ese email.");
            PDB._saveUsers(PDB.getUsers().filter(u => u.id !== res.user.id));
            setLoading(false); return;
          }
          PDB.assignClient(nutr.id, res.user.id);
        }
        await SyncEngine.pushToCloud(res.user.id);
        await SyncEngine.migrateExistingData();
        onLogin(res.user);
      }
    } catch(e) {
      setError("Error de conexión. Inténtalo de nuevo.");
      console.error("[AuthView]", e);
    }
    setLoading(false);
  };

  return (
    <div style={{background:Dk.bg, minHeight:"100vh", fontFamily:sans, color:Dk.text, display:"flex", alignItems:"center", justifyContent:"center", padding:16}}>
      <div style={{width:"100%", maxWidth:400}}>
        <div style={{textAlign:"center", marginBottom:28}}>
          {/* Logo — PNG con alpha real. Sin fondo, sin filtros, aspect ratio preservado */}
          <img
            src={NUTIPLAN_LOGO}
            alt="NutiPlan"
            width={96}
            height={96}
            style={{
              display:"block",
              margin:"0 auto 8px",
              width:96,
              height:"auto",
              maxHeight:96,
              objectFit:"contain",
              background:"transparent",
              userSelect:"none",
            }}
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
          <h1 style={{fontFamily:serif, fontSize:26, color:Dk.text, margin:"0 0 4px"}}>NutiPlan</h1>
          <p style={{color:Dk.muted, fontSize:13, margin:0}}>Plataforma de nutrición personalizada</p>
        </div>

        <div style={{background:Dk.card, border:"1px solid "+Dk.border, borderRadius:16, padding:"22px 18px"}}>

          {/* ── Nutritionist application state screens ── */}
          {applicationState !== 'none' && (
            <div style={{display:"flex", flexDirection:"column", gap:14}}>
              {applicationState === 'submitted' && (
                <div style={{display:"flex", flexDirection:"column", gap:14}}>
                  <div style={{padding:"14px 16px", borderRadius:10, background:THEME.successBg18, border:"1px solid #16a34a44", color:THEME.colorSuccess, fontSize:14, lineHeight:1.6}}>
                    ✅ Solicitud enviada correctamente. El equipo la revisará en 1–3 días hábiles.
                  </div>
                  <button onClick={() => goTab('login')} style={{padding:"10px", borderRadius:10, border:"none", background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, cursor:"pointer"}}>
                    ← Volver al inicio de sesión
                  </button>
                </div>
              )}
              {applicationState === 'pending' && (
                <div style={{display:"flex", flexDirection:"column", gap:14}}>
                  <div style={{padding:"14px 16px", borderRadius:10, background:THEME.accentBg18, border:"1px solid "+THEME.accent+"44", color:THEME.accent, fontSize:14, lineHeight:1.6}}>
                    🕐 Solicitud en revisión. El equipo está verificando tus credenciales.
                  </div>
                  <button onClick={() => goTab('login')} style={{padding:"10px", borderRadius:10, border:"none", background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, cursor:"pointer"}}>
                    ← Volver al inicio de sesión
                  </button>
                </div>
              )}
              {applicationState === 'rejected' && (
                <div style={{display:"flex", flexDirection:"column", gap:14}}>
                  <div style={{padding:"14px 16px", borderRadius:10, background:THEME.errorBg18, border:"1px solid #e05a5a44", color:THEME.colorError2, fontSize:14, lineHeight:1.6}}>
                    ❌ Solicitud rechazada. Contacta con soporte para más información.
                  </div>
                  <button onClick={resetState} style={{padding:"10px", borderRadius:10, border:"none", background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, cursor:"pointer"}}>
                    ↩ Volver al formulario
                  </button>
                  <button onClick={() => goTab('login')} style={{padding:"10px", borderRadius:10, border:"none", background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, cursor:"pointer"}}>
                    ← Volver al inicio de sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Tab selector (oculto en forgot) ── */}
          {tab !== "forgot" && applicationState === 'none' && (
            <div style={{display:"flex", gap:4, marginBottom:20, background:Dk.card2, borderRadius:10, padding:4}}>
              {[["login","Iniciar sesión"],["register","Registrarse"]].map(([t,l]) => (
                <button key={t} onClick={() => goTab(t)} style={{flex:1, padding:"8px", borderRadius:7, border:"none", background:tab===t?THEME.accent:"transparent", color:tab===t?THEME.bgPage:Dk.muted, fontFamily:sans, fontSize:13, fontWeight:700, cursor:"pointer"}}>{l}</button>
              ))}
            </div>
          )}

          {/* ── Forgot password ── */}
          {tab === "forgot" && applicationState === 'none' && (
            <div>
              <button onClick={() => goTab("login")} style={{background:"none", border:"none", color:Dk.muted, cursor:"pointer", fontFamily:sans, fontSize:13, display:"flex", alignItems:"center", gap:4, padding:"0 0 16px", marginBottom:4}}>
                ← Volver al login
              </button>
              <div style={{fontFamily:serif, fontSize:18, color:Dk.text, marginBottom:6}}>🔑 Recuperar contraseña</div>
              <div style={{fontSize:12, color:Dk.muted, marginBottom:16, lineHeight:1.5}}>
                Te enviamos un link por email. Caduca en 1 hora.
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:10}}>
                <input type="email" placeholder="Tu email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleForgot()} style={inp}/>
                {error && <div style={{padding:"8px 12px", borderRadius:8, background:THEME.errorBg18, border:"1px solid #e05a5a44", color:THEME.colorError2, fontSize:13}}>{error}</div>}
                {info  && <div style={{padding:"8px 12px", borderRadius:8, background:THEME.successBg18, border:"1px solid #16a34a44", color:THEME.colorSuccess,  fontSize:13, lineHeight:1.5}}>{info}</div>}
                <button onClick={handleForgot} disabled={loading} style={{padding:"12px", borderRadius:10, border:"none", background:THEME.gradAccent, color:THEME.bgPage, fontFamily:sans, fontSize:14, fontWeight:700, cursor:"pointer", opacity:loading?0.7:1}}>
                  {loading ? "Enviando..." : "Enviar link de recuperación →"}
                </button>
              </div>
            </div>
          )}

          {/* ── Confirm email pending ── */}
          {confirmEmail && applicationState === 'none' && (
            <div style={{display:"flex", flexDirection:"column", gap:14}}>
              <div style={{padding:"14px 16px", borderRadius:10, background:THEME.successBg18, border:"1px solid #16a34a44", color:THEME.colorSuccess, fontSize:14, lineHeight:1.6}}>
                Revisa tu bandeja de entrada y confirma tu email antes de continuar.
              </div>
              <button onClick={() => goTab("login")} style={{padding:"10px", borderRadius:10, border:"none", background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, cursor:"pointer"}}>
                ← Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* ── Login / Register form ── */}
          {tab !== "forgot" && !confirmEmail && applicationState === 'none' && (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={inp}/>
              <div style={{position:"relative"}}>
                <input type={showPass?"text":"password"} placeholder="Contraseña (mín. 6 caracteres)" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={{...inp,paddingRight:42}}/>
                <button type="button" onClick={()=>setShowPass(v=>!v)} aria-label={showPass?"Ocultar contraseña":"Mostrar contraseña"} style={{position:"absolute",right:0,top:0,height:"100%",width:40,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:Dk.muted,padding:0,flexShrink:0}}>
                  {showPass ? <EyeOffIcon/> : <EyeIcon/>}
                </button>
              </div>

              {tab === "login" && (
                <label style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer", userSelect:"none"}}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{accentColor: THEME.accent, width:15, height:15, cursor:"pointer", flexShrink:0}}
                  />
                  <span style={{fontSize:13, color:Dk.muted, fontFamily:sans}}>Recuérdame</span>
                </label>
              )}

              {tab === "register" && (
                <>
                  <div>
                    <div style={{fontSize:11, color:Dk.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8}}>Tipo de cuenta</div>
                    <div style={{display:"flex", gap:8}}>
                      {[["user","👤","Usuario"],["nutritionist","🧑‍⚕️","Nutricionista"]].map(([r,ic,lbl]) => (
                        <button key={r} onClick={()=>setRole(r)} style={{flex:1, padding:"10px 6px", borderRadius:10, border:"2px solid "+(role===r?THEME.accent:Dk.border), background:role===r?THEME.accentBg18:Dk.card2, color:role===r?THEME.accent:Dk.muted, cursor:"pointer", fontFamily:sans}}>
                          <div style={{fontSize:22, marginBottom:3}}>{ic}</div>
                          <div style={{fontSize:12, fontWeight:700}}>{lbl}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {role === "user" && (
                    <div>
                      <div style={{fontSize:11, color:Dk.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8}}>¿Cómo quieres usar la app?</div>
                      <div style={{display:"flex", flexDirection:"column", gap:6}}>
                        <button onClick={()=>setRegMode("auto")} style={{padding:"11px 14px", borderRadius:10, border:"2px solid "+(regMode==="auto"?THEME.accent:Dk.border), background:regMode==="auto"?THEME.accentBg18:Dk.card2, color:Dk.text, cursor:"pointer", fontFamily:sans, textAlign:"left", display:"flex", alignItems:"center", gap:10}}>
                          <span style={{fontSize:20}}>🤖</span>
                          <div><div style={{fontSize:13, fontWeight:700, color:regMode==="auto"?THEME.accent:Dk.text}}>Plan automático</div><div style={{fontSize:11, color:Dk.muted}}>El sistema genera tu plan según tu perfil</div></div>
                          {regMode==="auto" && <span style={{marginLeft:"auto", color:THEME.accent}}>✓</span>}
                        </button>
                        <button onClick={()=>setRegMode("nutri")} style={{padding:"11px 14px", borderRadius:10, border:"2px solid "+(regMode==="nutri"?THEME.colorPurple:Dk.border), background:regMode==="nutri"?THEME.purpleBg18:Dk.card2, color:Dk.text, cursor:"pointer", fontFamily:sans, textAlign:"left", display:"flex", alignItems:"center", gap:10}}>
                          <span style={{fontSize:20}}>🧑‍⚕️</span>
                          <div><div style={{fontSize:13, fontWeight:700, color:regMode==="nutri"?THEME.colorPurpleLight:Dk.text}}>Me recomienda mi nutricionista</div><div style={{fontSize:11, color:Dk.muted}}>Te vinculas automáticamente a su consulta</div></div>
                          {regMode==="nutri" && <span style={{marginLeft:"auto", color:THEME.colorPurpleLight}}>✓</span>}
                        </button>
                      </div>
                      {regMode === "nutri" && (
                        <div style={{marginTop:8}}>
                          <input type="email" placeholder="Email de tu nutricionista" value={nutriEmail} onChange={e=>setNutriEmail(e.target.value)} style={{...inp, borderColor:THEME.colorPurple}}/>
                          <div style={{fontSize:11, color:THEME.colorPurpleLight, marginTop:5}}>Tu cuenta quedará vinculada a su consulta automáticamente.</div>
                        </div>
                      )}
                    </div>
                  )}
                  {role === "nutritionist" && (
                    <div style={{display:"flex", flexDirection:"column", gap:8}}>
                      <div style={{fontSize:11, color:Dk.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4}}>Datos profesionales</div>
                      <input type="text" placeholder="Nombre completo" value={fullName} onChange={e=>setFullName(e.target.value)} style={inp}/>
                      <input type="text" placeholder="Número de colegiado / licencia" value={licenseNumber} onChange={e=>setLicenseNumber(e.target.value)} style={inp}/>
                      <input type="text" placeholder="Especialidad" value={specialty} onChange={e=>setSpecialty(e.target.value)} style={inp}/>
                      <input type="tel" placeholder="Teléfono" value={phone} onChange={e=>setPhone(e.target.value)} style={inp}/>
                      <input type="text" placeholder="DNI (ej: 12345678A)" value={dni} onChange={e=>setDni(e.target.value)} style={inp}/>
                      <div>
                        <div style={{fontSize:11, color:Dk.muted, marginBottom:4}}>Documento DNI (JPG o PDF, máx 5MB) *</div>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.pdf"
                          onChange={handleDniFileChange}
                          style={{...inp, padding:"8px"}}
                        />
                        {dniFileError && <div style={{padding:"6px 8px", borderRadius:6, background:THEME.errorBg18, border:"1px solid #e05a5a44", color:THEME.colorError2, fontSize:12, marginTop:4}}>{dniFileError}</div>}
                      </div>
                      <div style={{fontSize:11, color:Dk.muted, lineHeight:1.5}}>Tu solicitud será revisada en 1–3 días hábiles. Recibirás acceso cuando sea aprobada.</div>
                    </div>
                  )}
                </>
              )}

              {error && <div style={{padding:"8px 12px", borderRadius:8, background:THEME.errorBg18, border:"1px solid #e05a5a44", color:THEME.colorError2, fontSize:13}}>{error}</div>}

              <button onClick={handleSubmit} disabled={loading} style={{padding:"12px", borderRadius:10, border:"none", background:THEME.gradAccent, color:THEME.bgPage, fontFamily:sans, fontSize:14, fontWeight:700, cursor:"pointer", marginTop:4, opacity:loading?0.7:1}}>
                {loading ? "..." : tab==="login" ? "Entrar →" : "Crear cuenta →"}
              </button>

              {/* Enlace "¿Olvidaste tu contraseña?" solo en login */}
              {tab === "login" && (
                <button onClick={() => goTab("forgot")} style={{background:"none", border:"none", color:Dk.muted, cursor:"pointer", fontFamily:sans, fontSize:12, textDecoration:"underline", padding:"2px 0", textAlign:"center"}}>
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          )}

          {/* Demo accounts — solo en login */}
          {tab === "login" && applicationState === 'none' && (
            <div style={{marginTop:18, paddingTop:14, borderTop:"1px solid "+Dk.border}}>
              <div style={{fontSize:11, color:Dk.muted, textAlign:"center", marginBottom:8}}>Cuentas demo (contraseña: demo123)</div>
              <div style={{display:"flex", flexDirection:"column", gap:5}}>
                {[["nutri@demo.com","🧑‍⚕️","Nutricionista"],["maria@demo.com","👤","Usuario (con nutricionista)"],["carlos@demo.com","👤","Usuario (con nutricionista)"]].map(([em,ic,lbl]) => (
                  <button key={em} onClick={()=>{setEmail(em);setPass("demo123");setTab("login");}} style={{padding:"7px 10px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:7, textAlign:"left"}}>
                    <span>{ic}</span><span style={{flex:1}}>{lbl}</span><span style={{color:Dk.border, fontSize:10}}>{em}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PANEL — visible only to javivalmich@gmail.com
// ═══════════════════════════════════════════════════════════════════════════
const AdminPanel = ({ currentUser }) => {
  const sans  = SANS_EMOJI;
  const Dk    = { bg: THEME.bgPage, card: THEME.bgCard, card2: THEME.bgCard2, border: THEME.borderDark, text: THEME.textPrimary, muted: THEME.textMuted, accent: THEME.accent };

  const [section,      setSection]      = useState("applications");
  const [applications, setApplications] = useState([]);
  const [users,        setUsers]        = useState([]);
  const [loadingApps,  setLoadingApps]  = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading,setActionLoading]= useState({}); // { [id]: true }
  const [error,        setError]        = useState(null);
  const [appErrors,    setAppErrors]    = useState({});

  const isSuperAdmin = currentUser.email === 'javivalmich@gmail.com';

  const loadApplications = async () => {
    setLoadingApps(true);
    const res = await SDB.adminGetApplications();
    setLoadingApps(false);
    if (res.error) { setError("Error cargando solicitudes"); return; }
    setApplications(res.data);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    const res = await SDB.adminGetUsers();
    setLoadingUsers(false);
    if (res.error) { setError("Error cargando usuarios"); return; }
    setUsers(res.data);
  };

  useEffect(() => {
    loadApplications();
    loadUsers();
  }, []);

  const withAction = async (id, fn) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    setError(null);
    try { await fn(); } catch(e) { setError(e.message || "Error"); }
    setActionLoading(prev => ({ ...prev, [id]: false }));
  };

  const handleApprove = (appId) => withAction(appId, async () => {
    const res = await SDB.adminApproveApplication(appId);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadApplications();
    await loadUsers();
  });

  const handleReject = (appId) => withAction(appId, async () => {
    const res = await SDB.adminRejectApplication(appId);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadApplications();
  });

  const handleSetRole = (userId, role) => withAction(userId + "_role", async () => {
    const res = await SDB.adminSetUserRole(userId, role);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadUsers();
  });

  const handleSetActive = (userId, active) => withAction(userId + "_active", async () => {
    const res = await SDB.adminSetUserActive(userId, active);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadUsers();
  });

  const handlePromote = (userId) => withAction(userId + "_promote", async () => {
    const res = await SDB.adminPromoteToAdmin(userId);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadUsers();
  });

  const handleDemote = (userId) => withAction(userId + "_demote", async () => {
    const res = await SDB.adminDemoteFromAdmin(userId);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadUsers();
  });

  const cardStyle = { background: Dk.card, borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px", marginBottom: 10 };
  const labelStyle = { fontSize: 10, color: Dk.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 };
  const valueStyle = { fontSize: 13, color: Dk.text, fontWeight: 500 };
  const btnBase = { border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: sans, fontSize: 12, fontWeight: 700, cursor: "pointer" };

  const pendingApps = applications.filter(a => a.status === "pending");

  return (
    <div style={{ fontFamily: sans }}>
      {/* Section switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ key: "applications", label: "Solicitudes" + (pendingApps.length ? ` (${pendingApps.length})` : "") },
          { key: "users",        label: "Usuarios" }].map(s => (
          <button key={s.key} onClick={() => setSection(s.key)} style={{
            ...btnBase,
            background: section === s.key ? Dk.accent : Dk.card2,
            color:      section === s.key ? "#fff" : Dk.text,
            border:     "1px solid " + (section === s.key ? Dk.accent : Dk.border),
          }}>{s.label}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: THEME.bgErrorLight, border: "1px solid " + THEME.colorError, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: THEME.colorErrorDark, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: THEME.colorErrorDark }}>✕</button>
        </div>
      )}

      {/* ── Solicitudes ── */}
      {section === "applications" && (
        <div>
          {loadingApps && <div style={{ color: Dk.muted, fontSize: 13, padding: "12px 0" }}>Cargando…</div>}
          {!loadingApps && applications.length === 0 && (
            <div style={{ color: Dk.muted, fontSize: 13, padding: "12px 0" }}>No hay solicitudes.</div>
          )}
          {applications.map(app => {
            const busy = !!actionLoading[app.id];
            const isPending = app.status === "pending";
            return (
              <div key={app.id} style={{ ...cardStyle, opacity: busy ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: Dk.text }}>{app.full_name}</div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                    background: app.status === "approved" ? THEME.successBg18 : app.status === "rejected" ? THEME.errorBg18 : THEME.accentBg22,
                    color:      app.status === "approved" ? THEME.colorSuccessDark : app.status === "rejected" ? THEME.colorErrorDark : Dk.accent,
                  }}>{app.status}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", marginBottom: 10 }}>
                  {[
                    ["Email",       app.email        || "—"],
                    ["Colegiado",   app.license_number],
                    ["Especialidad",app.specialty],
                    ["Teléfono",    app.phone],
                    ["DNI",         app.dni],
                    ["Fecha",       app.submitted_at ? new Date(app.submitted_at).toLocaleDateString("es-ES") : "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={labelStyle}>{k}</div>
                      <div style={valueStyle}>{v}</div>
                    </div>
                  ))}
                </div>
                {app.dni_document_url && (
                  <div style={{ marginBottom: 8 }}>
                    <button
                      disabled={busy}
                      onClick={async () => {
                        setAppErrors(prev => ({ ...prev, [app.id]: null }));
                        const res = await SDB.getDniDocumentUrl(app.user_id, app.dni_document_url);
                        if (res.error) {
                          setAppErrors(prev => ({ ...prev, [app.id]: "Error abriendo el documento DNI." }));
                        } else {
                          window.open(res.signedUrl, "_blank");
                        }
                      }}
                      style={{ ...btnBase, background: Dk.card2, color: Dk.text, border: "1px solid " + Dk.border }}
                    >
                      📄 Ver DNI
                    </button>
                    {appErrors[app.id] && (
                      <div style={{ fontSize: 11, color: THEME.colorError2, marginTop: 4 }}>{appErrors[app.id]}</div>
                    )}
                  </div>
                )}
                {isPending && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button disabled={busy} onClick={() => handleApprove(app.id)} style={{ ...btnBase, background: THEME.colorSuccessDark, color: "#fff", flex: 1 }}>
                      {busy ? "…" : "✅ Aprobar"}
                    </button>
                    <button disabled={busy} onClick={() => handleReject(app.id)} style={{ ...btnBase, background: THEME.colorErrorDark, color: "#fff", flex: 1 }}>
                      {busy ? "…" : "❌ Rechazar"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Usuarios ── */}
      {section === "users" && (
        <div>
          {loadingUsers && <div style={{ color: Dk.muted, fontSize: 13, padding: "12px 0" }}>Cargando…</div>}
          {!loadingUsers && users.length === 0 && (
            <div style={{ color: Dk.muted, fontSize: 13, padding: "12px 0" }}>No hay usuarios.</div>
          )}
          {users.filter(u => u.id !== currentUser.id).map(u => {
            const busyRole    = !!actionLoading[u.id + "_role"];
            const busyActive  = !!actionLoading[u.id + "_active"];
            const busyPromote = !!actionLoading[u.id + "_promote"];
            const busyDemote  = !!actionLoading[u.id + "_demote"];
            const busy        = busyRole || busyActive || busyPromote || busyDemote;
            const isAdminUser = u.role === 'admin';
            const isSuperAdminUser = u.email === 'javivalmich@gmail.com';

            return (
              <div key={u.id} style={{ ...cardStyle, opacity: busy ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: Dk.text, wordBreak: "break-all" }}>
                    {u.email}
                    {isSuperAdminUser && <span style={{ marginLeft: 6, fontSize: 10, color: THEME.colorPurpleLight, fontWeight: 700 }}>⭐ super_admin</span>}
                    {isAdminUser && !isSuperAdminUser && <span style={{ marginLeft: 6, fontSize: 10, color: Dk.accent, fontWeight: 700 }}>🔑 admin</span>}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, marginLeft: 8, flexShrink: 0,
                    background: u.is_active ? THEME.successBg18 : THEME.errorBg18,
                    color:      u.is_active ? THEME.colorSuccessDark : THEME.colorErrorDark,
                  }}>{u.is_active ? "activo" : "inactivo"}</span>
                </div>
                <div style={{ fontSize: 11, color: Dk.muted, marginBottom: 10 }}>
                  Registro: {u.created_at ? new Date(u.created_at).toLocaleDateString("es-ES") : "—"}
                </div>

                {/* Admin / super_admin row: only super_admin sees the demote button */}
                {(isAdminUser || isSuperAdminUser) ? (
                  isSuperAdmin && !isSuperAdminUser && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        disabled={busy}
                        onClick={() => handleDemote(u.id)}
                        style={{ ...btnBase, background: THEME.colorErrorDark, color: "#fff" }}
                      >
                        {busyDemote ? "…" : "✕ Quitar admin"}
                      </button>
                    </div>
                  )
                ) : (
                  /* user / nutritionist row */
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      value={u.role}
                      disabled={busy}
                      onChange={e => handleSetRole(u.id, e.target.value)}
                      style={{ flex: 1, minWidth: 120, padding: "7px 10px", borderRadius: 8, border: "1px solid " + Dk.border, background: Dk.card2, color: Dk.text, fontFamily: sans, fontSize: 12, cursor: "pointer" }}
                    >
                      <option value="user">user</option>
                      <option value="nutritionist">nutritionist</option>
                    </select>
                    <button
                      disabled={busy}
                      onClick={() => handleSetActive(u.id, !u.is_active)}
                      style={{ ...btnBase, background: u.is_active ? THEME.colorErrorDark : THEME.colorSuccessDark, color: "#fff", whiteSpace: "nowrap" }}
                    >
                      {busyActive ? "…" : u.is_active ? "Desactivar" : "Activar"}
                    </button>
                    {isSuperAdmin && (
                      <button
                        disabled={busy}
                        onClick={() => handlePromote(u.id)}
                        style={{ ...btnBase, background: Dk.accent, color: "#fff", whiteSpace: "nowrap" }}
                      >
                        {busyPromote ? "…" : "⭐ Admin"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ORIGINAL PLAN APP — 100% original code, minimal additions:
//   • logout button in hamburger menu
//   • "plan locked" badge when created_by === "nutritionist"
//   • block auto-regenerate on nutritionist plans
// ═══════════════════════════════════════════════════════════════════════════
// Hash determinista de string — usado por buildPlan para variantes de wording/AOVE
const _hashStr = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) + h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
};
// (FASE 1: SIDES_COMPLEMENTARIOS y getSideForDay eliminados — el toggle
//  per-día ahora recalcula porciones reales en lugar de mostrar tarjetas extra.)

const DEFAULT_PROFILE={gender:"female",age:30,date_of_birth:"",weight:65,height:165,activity:"moderate",goal:"fatLossGeneral",mealsPerDay:3,trainingDays:[],intolerances:[],eliminatedFoods:[],hambre:"media",experiencia:"intermedio",tiempoCocina:"normal",kcalAdjust:0,extras:{proteinShake:{enabled:false,scoops:1,kcalPerScoop:120,proteinPerScoop:24,timing:"post_entreno"}}};

const getCurrentWeekdayIndex = () => {
  const day = new Date().getDay(); // 0=domingo
  return day === 0 ? 6 : day - 1; // lunes=0, domingo=6
};

function OriginalPlanApp({ currentUser, activePlanMeta, onLogout, onPlanUpdated }) {
  __PERF.render("OriginalPlanApp");  // PERF
  // EMOJI FIX: use emoji-safe stacks defined at module level
  const sans = SANS_EMOJI;
  const serif= SERIF_EMOJI;
  const Dk={bg:THEME.bgPage,card:THEME.bgCard,card2:THEME.bgCard2,border:THEME.borderDark,text:THEME.textPrimary,muted:THEME.textMuted,accent:THEME.accent,accentLight:"#f5c060"};
  const isAdmin = currentUser?.email === 'javivalmich@gmail.com';

  const [loading,setLoading]     =useState(true);
  const [step,setStep]           =useState(0);
  const [plan,setPlan]           =useState(null);
  const [weekNum,setWeekNum]     =useState(null);
  const [profile,setProfile]     =useState(DEFAULT_PROFILE);
  const [activeDay,setActiveDay] =useState(() => getCurrentWeekdayIndex());
  const [activeTab,setActiveTab] =useState("plan");
  const [foodInput,setFoodInput] =useState("");
  const [navOpen,setNavOpen]     =useState(false);
  const [swapMode,setSwapMode]   =useState(null);
  const [swapSemantic,setSwapSemantic]=useState(null);
  const [regenScope,setRegenScope]=useState(null);
  const [openMeal,setOpenMeal]   =useState(null);
  const [mealTab,setMealTab]     =useState('compra');
  const [extras,setExtras]       =useState({});
  const [extraInput,setExtraInput]=useState({name:"",grams:""});
  const [selectedFood,setSelectedFood]=useState(null);
  const [suggestions,setSuggestions]=useState([]);
  const [extraOpen,setExtraOpen] =useState(null); // null | dayName
  const [showCheckin,setShowCheckin]=useState(false);
  const [checkin,setCheckin]     =useState({pesoTrend:"sinCambio",hambre:3,energia:3,adherencia:3,pesoActual:""});
  const [progress,setProgress]   =useState({weeks:[],foodLikes:{},foodDislikes:{},failPatterns:[]});
  const [nutriFeedback,setNutriFeedback]=useState(null);
  // Plan con Amigo state
  const [showFriendModal,setShowFriendModal] = useState(false);
  const [friendMode,setFriendMode]           = useState("menu");    // "menu"|"create"|"redeem"
  const [myToken,setMyToken]                  = useState(null);
  const [copyFeedback,setCopyFeedback]        = useState(null);     // null|"ok"|"error"
  const [inviteCreating,setInviteCreating]   = useState(false);
  const [redeemToken,setRedeemToken]          = useState("");
  const [redeemStatus,setRedeemStatus]        = useState(null);     // null|"loading"|"ok"|"error"
  const [redeemError,setRedeemError]          = useState("");
  // SYNC FIX: show a non-intrusive banner when nutritionist updates the plan
  const [planUpdatedBanner, setPlanUpdatedBanner] = useState(false);
  const [showIMCInfo,       setShowIMCInfo]       = useState(false);
  const [showTMBInfo,       setShowTMBInfo]       = useState(false);
  const [showTDEEInfo,      setShowTDEEInfo]      = useState(false);
  const [showMacrosInfo,    setShowMacrosInfo]    = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // dedicated generate guard
  const [showProfile,   setShowProfile]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const prevPlanId = useRef(null);
  const dayShakeSnapshotRef = useRef({});

  // Is this plan locked (created by nutritionist)?
  const isNutriPlan = activePlanMeta && activePlanMeta.created_by === "nutritionist";

  useEffect(()=>{
    _setUid(currentUser.id);
    __TRACE.log("hydration:start", { planMetaId: activePlanMeta?.id, planMetaCreated: activePlanMeta?.created_at });

    // BUG FIX (P0 race defense): if the incoming activePlanMeta matches what
    // we already have in `plan` state (same id + same created_at), skip the
    // re-hydration. Otherwise every echo (realtime, BC, poll re-read of same
    // record) would re-fire setPlan/setProfile, remounting children mid-click
    // and causing the "alternativas no responde" bug.
    //
    // Only short-circuit when activePlanMeta is present AND has an id we
    // recognize. The first hydration after mount always proceeds.
    if (activePlanMeta && plan && activePlanMeta.id && plan._planId &&
        activePlanMeta.id === plan._planId &&
        (activePlanMeta.created_at || 0) === (plan._created_at || 0)) {
      __TRACE.log("hydration:skipped-identical", { planId: activePlanMeta.id });
      __PERF.count("hydration:skipped-identical");
      setLoading(false);  // idempotent
      return;
    }
    // If we have a plan from PDB, load it; otherwise fall back to localStorage
    if (activePlanMeta) {
      // FIX 6: deep-clone on hydration — React state must own an isolated copy.
      // Direct references from JSON.parse can be mutated by other components
      // without triggering re-renders, causing state/storage to silently diverge.
      const clonedMeta = JSON.parse(JSON.stringify(activePlanMeta));

      // Guard: rechaza si clonedMeta es stale o si hay un overwrite justo tras acción usuario.
      const _hydGuard = traceSetPlan("hydration", plan, clonedMeta);
      if (!_hydGuard.accept || _checkPostActionOverwrite("hydration", plan, clonedMeta)) {
        __TRACE.log("hydration:blocked-by-guard", { reason: _hydGuard.reason });
        setLoading(false);
        return;
      }

      __TRACE.event("profile", "hydration:fromMeta", profile, clonedMeta.profile);
      setProfile(_validateProfile(clonedMeta.profile) || DEFAULT_PROFILE);
      __TRACE.event("plan", "hydration:fromMeta", plan, clonedMeta);
      // Annotate the plan with the source meta id so the short-circuit above
      // can match it. Internal field, never persisted.
      const _hydratedDays = (clonedMeta.days || []).map((d, i) => {
        if (!d) return d;
        if (!d.id) { d.id = "day-"+i+"-"+(clonedMeta.created_at || activePlanMeta.created_at || Date.now()); }
        return d;
      });
      setPlan({
        _planId:      activePlanMeta.id,
        _created_at:  activePlanMeta.created_at,
        days:         _hydratedDays,
        strategy:     clonedMeta.strategy,
        weekWarnings: clonedMeta.weekWarnings,
        weekScore:    clonedMeta.weekScore,
        weekProblems: clonedMeta.weekProblems,
      });
      setWeekNum(clonedMeta.weekNum || getWeekNumber());
      setExtras(clonedMeta.extras || {});
    } else {
      const {profile:pr, plan:pl, weekNum:wk, extras:ex} = loadData();
      const currentWeek = getWeekNumber();
      if(pr) { __TRACE.event("profile", "hydration:fromStorage", profile, pr); setProfile(pr); }
      if(pl && wk === currentWeek){
        __TRACE.event("plan", "hydration:storage", plan, pl);
        // Lazy migration: ensure every day has a stable id
        if(pl.days) pl.days.forEach((d,i)=>{if(d&&!d.id) d.id="day-"+i+"-"+(pl.created_at||Date.now());});
        setPlan(pl); setWeekNum(wk); if(ex) setExtras(ex);
      }
      else if(pl && pr && wk !== currentWeek){
        const kcal = calcTarget(calcTDEE(pr.gender,pr.age,pr.weight,pr.height,pr.activity), pr.goal, pr.kcalAdjust||0);
        const newPlan = __PERF.time("buildPlan:weekRollover", () => buildPlan(pr, kcal));  // PERF
        __TRACE.event("plan", "hydration:weekRollover", plan, newPlan);
        setPlan(newPlan); setWeekNum(currentWeek); setExtras({});
        saveData(pr, newPlan, currentWeek, {});
        // Also save to PDB
        PDB.addPlan(currentUser.id, { created_by:"system", strategy:newPlan.strategy, calories:kcal, profile:pr, days:newPlan.days, weekWarnings:newPlan.weekWarnings, weekScore:newPlan.weekScore, weekNum:currentWeek, extras:{} });
      }
    }
    var prog = loadProgress();
    setProgress(prog);
    setLoading(false);
    __TRACE.log("hydration:end");
  // Depend on plan identity: re-runs when nutritionist assigns/edits a plan.
  },[activePlanMeta?.id, activePlanMeta?.created_at]);

  // FIX 7: banner in its own isolated effect — clean separation of concerns,
  // no interaction with the loading state above.
  useEffect(() => {
    if (prevPlanId.current === null) {
      // First mount — just record the id, no banner
      prevPlanId.current = activePlanMeta?.id ?? null;
      return;
    }
    const incoming = activePlanMeta?.id ?? null;
    if (incoming && incoming !== prevPlanId.current) {
      setPlanUpdatedBanner(true);
      const t = setTimeout(() => setPlanUpdatedBanner(false), 6000);
      prevPlanId.current = incoming;
      return () => clearTimeout(t); // FIX: cleanup timeout to prevent memory leak
    }
    prevPlanId.current = incoming;
  }, [activePlanMeta?.id]);

  const tdee       =calcTDEE(profile.gender,profile.age,profile.weight,profile.height,profile.activity);
  const targetKcal =calcTarget(tdee,profile.goal,profile.kcalAdjust||0);
  const stratKey   =(plan && plan.strategy)||computeStrategy(profile);
  const macros     =calcMacros(targetKcal,profile.weight,profile.goal,profile.activity,stratKey);
  const goalObj    =GOALS.find(g=>g.key===profile.goal)||GOALS[0];
  const gc         =GOAL_COLORS[profile.goal]||GOAL_COLORS.fatLoss;
  const stratInfo  =STRATEGIES[stratKey]||STRATEGIES.mantenimiento_equilibrado;

  const up         =(k,v)=>setProfile(p=>({...p,[k]:v}));
  const toggleIntol=k=>setProfile(p=>({...p,intolerances:p.intolerances.includes(k)?p.intolerances.filter(x=>x!==k):[...p.intolerances,k]}));
  const toggleTrain=d=>setProfile(p=>({...p,trainingDays:p.trainingDays.includes(d)?p.trainingDays.filter(x=>x!==d):[...p.trainingDays,d]}));
  const addFood    =()=>{const f=foodInput.trim();if(f&&!profile.eliminatedFoods.includes(f)){setProfile(p=>({...p,eliminatedFoods:[...p.eliminatedFoods,f]}));setFoodInput("");}};
  const removeFood =f=>setProfile(p=>({...p,eliminatedFoods:p.eliminatedFoods.filter(x=>x!==f)}));

  // FIX 5: smart persistence — update the active plan if one exists for this
  // week and was created by "system" (user-generated). Only create a NEW plan
  // record for nutritionist plans or when no active plan exists yet.
  const saveToPDB = (prof, pl, wk, ex, createdBy) => {
    const __t0 = __PERF.mark();  // PERF
    const existing = PDB.getActivePlan(currentUser.id);
    const patch = {
      created_by: createdBy || "system",
      strategy: pl.strategy,
      calories: calcTarget(calcTDEE(prof.gender,prof.age,prof.weight,prof.height,prof.activity), prof.goal, prof.kcalAdjust||0),
      profile: _validateProfile(prof),
      days: JSON.parse(JSON.stringify(pl.days || [])), // immutable clone before persist
      weekWarnings: pl.weekWarnings,
      weekScore: pl.weekScore,
      weekNum: wk,
      extras: ex || {},
    };
    if (existing && existing.created_by !== "nutritionist" && existing.weekNum === wk) {
      // Update in-place — keeps plan history clean
      PDB.updateActivePlan(currentUser.id, patch);
    } else {
      PDB.addPlan(currentUser.id, patch);
    }
    if (onPlanUpdated) onPlanUpdated();
    __PERF.measure("saveToPDB", __t0);  // PERF
  };

  // handleGenerate — async, non-blocking, double-click proof
  // Uses isGenerating (dedicated state) separate from app-boot `loading`.
  // Microtask: setTimeout(0) yields the main thread so React flushes the
  // disabled-button render BEFORE the heavy buildPlan() calculation starts.
  // Persistence is fully decoupled via Promise.resolve().then() — UI update
  // is never blocked waiting for localStorage writes.
  //
  // BUG TRACING (opt-in via __NP_PERF.enable()): we trace every step so the
  // intermittent "nothing happens" bug can be diagnosed from the console.
  // Without enable() these traces are NO-OPs.
  const __trace = (label, extra) => {
    if (!__PERF.enabled()) return;
    const t = Date.now();
    if (extra !== undefined) console.log(`[gen:${t}] ${label}`, extra);
    else console.log(`[gen:${t}] ${label}`);
  };
  const handleGenerate = async () => {
    // Step 4: registrar acción de usuario para detectar sobrescrituras externas ~500ms
    trackUserAction("handleGenerate");
    __trace("click-received", { isGenerating, step, hasProfile: !!profile });
    if (isGenerating) {
      __trace("REJECTED: already generating (closure isGenerating=true)");
      return;
    }
    // Validate profile BEFORE setting state. If it's malformed, fail loudly
    // with a console.error AND alert the user instead of silently doing nothing.
    // This catches the most common cause of the intermittent bug: buildPlan
    // throwing on an undefined field (intolerances, trainingDays, etc.) which
    // would otherwise be swallowed by the catch.
    const validation = __validateProfileForGenerate(profile);
    if (!validation.ok) {
      __trace("REJECTED: invalid profile", validation.reason);
      console.error("[handleGenerate] profile invalid:", validation.reason, profile);
      // User-visible feedback — no more silent failures.
      alert("No se pudo generar el plan: " + validation.reason + ". Revisa los datos del perfil.");
      return;
    }
    setIsGenerating(true);
    __trace("isGenerating=true queued");
    try {
      const wk = getWeekNumber();
      const freshProfile = { ...profile, strategyOverride: null }; // immutable
      __TRACE.event("profile", "handleGenerate", profile, freshProfile);
      setProfile(freshProfile);
      __trace("setProfile queued", { weight: freshProfile.weight, age: freshProfile.age });

      // Yield to main thread → disabled button renders before CPU work
      await new Promise(resolve => setTimeout(resolve, 0));
      __trace("yield complete, starting buildPlan");
      __TRACE.log("handleGenerate:yield-complete");

      const newPlan = __PERF.time("buildPlan:handleGenerate", () => buildPlan(freshProfile, targetKcal));  // PERF
      __trace("buildPlan done", { days: newPlan?.days?.length, strategy: newPlan?.strategy });

      // Defensive: ensure buildPlan returned something usable. Without this,
      // setPlan(undefined) would re-enter the wizard branch (if(!plan)) and
      // the user would see "nothing happened" again.
      if (!newPlan || !Array.isArray(newPlan.days) || newPlan.days.length === 0) {
        __trace("REJECTED: buildPlan returned invalid shape", newPlan);
        console.error("[handleGenerate] buildPlan returned invalid shape:", newPlan);
        alert("No se pudo generar el plan. Inténtalo de nuevo o contacta soporte.");
        return; // finally still runs and clears isGenerating
      }

      // State batch — single re-render
      __TRACE.event("plan", "handleGenerate", plan, newPlan);
      // source="user" → shouldAcceptPlan devuelve siempre accept:true
      traceSetPlan("user", plan, newPlan);
      __trace("before-state", { planId: plan?._planId, planDays: plan?.days?.length });
      setPlan(newPlan);
      window.__nutiPlanDebug = newPlan; // DEBUG — audit runtime metrics
      __trace("after-state", { newPlanStrategy: newPlan?.strategy, days: newPlan?.days?.length });
      setWeekNum(wk);
      setActiveDay(0);
      setActiveTab("plan");
      __trace("state commits queued (plan, weekNum, activeDay, activeTab)");

      // Persist AFTER state update, fully decoupled (never blocks the UI).
      // FIX (stability P0): catch errors so localStorage failures or JSON-cycle
      // bugs surface in the console instead of being silently swallowed.
      // Without this, the user sees their plan on screen but it never persists,
      // and on reload it disappears — indistinguishable from "it didn't work".
      Promise.resolve().then(() => {
        try {
          saveData(freshProfile, newPlan, wk, {});
          saveToPDB(freshProfile, newPlan, wk, {}, "system");
          __trace("persist OK");
        } catch (err) {
          console.error("[handleGenerate] persist failed:", err);
        }
      }).catch(err => {
        console.error("[handleGenerate] persist (async) failed:", err);
      });
    } catch(e) {
      // BUG FIX: surface buildPlan exceptions to the user. The old behavior
      // (silent console.error + setIsGenerating(false)) is what caused the
      // "nothing happens" intermittent bug — the user clicks, sees no change,
      // clicks again. Now they get an explicit alert and we keep the trace.
      __trace("EXCEPTION in handleGenerate", e?.message);
      console.error("[handleGenerate]", e);
      alert("Error generando el plan: " + (e?.message || "error desconocido") +
            ". Revisa la consola para más detalles.");
    } finally {
      setIsGenerating(false);
      __trace("isGenerating=false (finally)");
    }
  };

  const handleCheckinSubmit=()=>{
    if (isNutriPlan) {
      // Save check-in but do NOT auto-adjust plan
      PDB.addCheckin(currentUser.id, {...checkin, planId: activePlanMeta&&activePlanMeta.id });
      setShowCheckin(false); setNavOpen(false);
      alert("✅ Check-in guardado. Tu nutricionista revisará los datos.");
      return;
    }
    var adj=computeCheckinAdjustment(checkin,profile.goal);
    var newAdj=(profile.kcalAdjust||0)+adj.delta;
    var newProfile=Object.assign({},profile,{ kcalAdjust:newAdj, strategyOverride: adj.strategyOverride || profile.strategyOverride || null, simpleMode: adj.simpleMode || false });
    setProfile(newProfile);
    var newKcal=calcTarget(tdee,newProfile.goal,newAdj);
    var wk=getWeekNumber();
    var newPlan=__PERF.time("buildPlan:checkin", () => buildPlan(newProfile,newKcal));  // PERF
    setPlan(newPlan); setWeekNum(wk); setExtras({}); setActiveDay(0);
    var pesoActualNum = parseFloat(checkin.pesoActual||"") || null;
    var prog = addWeekProgress(wk, { peso:pesoActualNum, pesoInicial:pesoActualNum && progress.weeks.length===0 ? pesoActualNum : (progress.weeks[0]&&progress.weeks[0].pesoInicial) || pesoActualNum, adherencia:checkin.adherencia, energia:checkin.energia, hambre:checkin.hambre });
    setProgress(prog);
    var fb = getNutricionistaFeedback(prog, profile.goal, checkin);
    setNutriFeedback(fb);
    saveData(newProfile,newPlan,wk,{});
    saveToPDB(newProfile, newPlan, wk, {}, "system");
    PDB.addCheckin(currentUser.id, checkin);
    setShowCheckin(false); setNavOpen(false);
  };

  const swapMeal=(dayIdx,mealIdx,altIdx)=>{
    // Step 4+5: registrar acción + logs de diagnóstico
    trackUserAction("swapMeal");
    console.log("[swapMeal] click recibido", { dayIdx, mealIdx, altIdx, planId: plan?._planId });
    const newPlan=JSON.parse(JSON.stringify(plan));
    const meal=newPlan.days[dayIdx].meals[mealIdx];
    console.log("[swapMeal] before-state", { meal: meal?.p1 });
    const altText=meal.alt[altIdx];
    const newAlt=[...meal.alt]; newAlt[altIdx]=meal.p1; meal.p1=altText; meal.alt=newAlt;
    // source="user" → siempre aceptado
    traceSetPlan("user", plan, newPlan);
    console.log("[swapMeal] after-state", { newMeal: meal?.p1 });
    setPlan(newPlan); saveData(profile,newPlan,weekNum,extras);
    // FIX 3b: persistir en PDB siempre (nutri y sistema) para que hidrataciones
    // futuras no reviertan el swap. Fix 6 garantiza que no se bumpeea created_at.
    PDB.updateActivePlan(currentUser.id, { days: newPlan.days });
    if (isNutriPlan) {
      if (onPlanUpdated) onPlanUpdated();
    }
    setSwapMode(null);
  };

  // ── Plan con Amigo handlers ──────────────────────────────────────────────
  const handleCreateInvitation = async () => {
    if (!activePlanMeta?.id) {
      alert("Genera un plan primero antes de compartirlo.");
      return;
    }
    if (inviteCreating) return;
    setInviteCreating(true);

    const token = InvitationStore.create(currentUser.id, activePlanMeta.id);

    const { error } = await SDB._rest("/plan_invitations", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        token:      token,
        owner_uid:  currentUser.id,
        plan_id:    activePlanMeta.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });

    setInviteCreating(false);

    if (error) {
      alert("No se pudo crear la invitación. Comprueba tu conexión e intenta de nuevo.");
      return;
    }

    setMyToken(token);
    setCopyFeedback(null);
    setFriendMode("create");
  };

  // Ref para garantizar idempotencia incluso si React no logra flushear el
  // setRedeemStatus("loading") antes de un segundo click muy rápido en mobile.
  // useState es asíncrono; useRef es síncrono. Defensa en profundidad.
  const _redeemInFlightRef = useRef(false);
  const _redeemReqIdRef    = useRef(0);

  const handleRedeemToken = async () => {
    const tokenRaw = redeemToken || "";
    const token    = tokenRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!token) return;

    // BUG FIX (P0): hard guard against concurrent submits. Without this, two
    // rapid taps on mobile (touch + click both firing, or fat-finger) could
    // both pass the disabled-check before React commits "loading" status.
    // The first call goes through RPC, the second sees the token already
    // consumed → "ya utilizado". Symptom matches user reports.
    if (_redeemInFlightRef.current) {
      __TRACE.log("redeem:duplicate-submit-blocked", { token });
      console.warn("[handleRedeemToken] duplicate submit blocked");
      return;
    }
    _redeemInFlightRef.current = true;
    const reqId = ++_redeemReqIdRef.current;
    __TRACE.log("redeem:start", { reqId, token, currentUserId: currentUser?.id });

    setRedeemStatus("loading");
    setRedeemError("");

    // Timeout defensivo de 15 s — evita que el estado quede congelado en "loading"
    // FIX: clearTimeout is called once in finally so it always fires.
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      __TRACE.log("redeem:timeout-fired", { reqId });
      setRedeemStatus("error");
      setRedeemError("Tiempo de espera agotado. Verifica tu conexión e inténtalo de nuevo.");
    }, 15000);

    try {
      // ── 1. Validar el token ────────────────────────────────────────────
      const result = await InvitationStore.validate(token);
      __TRACE.log("redeem:validate:result", { reqId, ok: result.ok, errorCode: result.errorCode });

      if (timedOut) return; // user already saw timeout; don't overwrite UI

      if (!result.ok) {
        // Map error codes to user-visible UX. Differentiation matters:
        //   • network/timeout → "retry"
        //   • invalid_or_used → "ask friend for new code"
        //   • session_expired → "re-login"
        setRedeemStatus("error");
        setRedeemError(result.errorMsg || "Código no válido.");
        return;
      }

      const invitation = result.invitation;
      const planId     = invitation.planId;
      if (!planId) {
        setRedeemStatus("error");
        setRedeemError("El código no contiene un plan válido. Pide uno nuevo a tu amigo.");
        return;
      }

      // ── 2. Obtener el plan del amigo ───────────────────────────────────
      // El RPC redeem_invitation_and_get_plan ya devuelve el plan inline
      // (sin round-trip adicional, sin riesgo de RLS). Solo hacer fetch
      // separado como fallback para el modo offline.
      let ownerPlan = invitation.plan || null;
      console.info("[PLAN_FETCH]", ownerPlan ? "plan from RPC inline" : "fetching from DB", "planId:", planId);

      if (!ownerPlan) {
        // Fallback online: raro (solo si validate vino del modo offline sin plan inline)
        ownerPlan = await SDB.getPlanById(planId);
        if (timedOut) return;
      }

      // Fallback: localStorage si el amigo está en el mismo dispositivo (demo/offline)
      if (!ownerPlan && invitation.ownerUid) {
        ownerPlan = PDB.getActivePlan(invitation.ownerUid);
        console.info("[PLAN_FETCH] localStorage fallback — ownerUid:", invitation.ownerUid, "found:", !!ownerPlan);
      }

      if (!ownerPlan || !ownerPlan.days?.length) {
        // Con la RPC transaccional, si llegamos aquí es porque validate()
        // devolvió un plan vacío/corrupto en el DB — muy improbable.
        // El token fue reclamado; el usuario debe pedir un código nuevo.
        setRedeemStatus("error");
        setRedeemError("No se pudo obtener el plan de tu amigo. El código se ha consumido — pide uno nuevo.");
        __TRACE.log("redeem:plan-fetch-failed-after-claim", { reqId, planId });
        return;
      }

      // ── 3. Clonar y escalar ────────────────────────────────────────────
      const freshProfile = { ...profile };
      const myKcal       = calcTarget(tdee, freshProfile.goal, freshProfile.kcalAdjust || 0);
      const ownerKcal    = ownerPlan.calories || myKcal;
      const newPlan      = cloneAndScalePlan(ownerPlan, ownerKcal, myKcal, freshProfile);
      const wk           = getWeekNumber();

      // ── 4. Persistir ──────────────────────────────────────────────────
      __TRACE.event("plan", "redeem:friendPlan", plan, newPlan);
      setPlan(newPlan);
      setWeekNum(wk);
      setActiveDay(0);
      setActiveTab("plan");
      Promise.resolve().then(() => {
        try {
          saveData(freshProfile, newPlan, wk, {});
          saveToPDB(freshProfile, newPlan, wk, {}, "friend");
        } catch(e) { console.error("[redeem persist]", e); }
      });

      // ── 5. Marcar token como usado en localStorage (cache) ─────────────
      // El RPC ya lo marcó atómicamente en cloud. No volvemos a hacer PATCH al
      // cloud — eso era una request innecesaria. Solo actualizamos la cache local.
      try {
        const all = InvitationStore._all().map(i =>
          i.token === token ? { ...i, usedBy: currentUser.id, usedAt: Date.now() } : i
        );
        InvitationStore._save(all);
      } catch(e) {}

      setRedeemStatus("ok");
      __TRACE.log("redeem:success", { reqId, planId });
      setTimeout(() => {
        // Solo cerrar si todavía estamos en este reqId (evita cerrar un modal
        // que el usuario hubiera reabierto en el ínterin)
        if (_redeemReqIdRef.current === reqId) {
          setShowFriendModal(false);
          setRedeemStatus(null);
          setRedeemToken("");
        }
      }, 1800);

    } catch(e) {
      __TRACE.log("redeem:exception", { reqId, message: e?.message });
      console.error("[handleRedeemToken]", e);
      if (!timedOut) {
        setRedeemStatus("error");
        setRedeemError("Error inesperado. Inténtalo de nuevo.");
      }
    } finally {
      clearTimeout(timeoutId);
      _redeemInFlightRef.current = false;
      __TRACE.log("redeem:done", { reqId });
    }
  };

  const handleReset=async()=>{
    if (!window.confirm("¿Empezar de cero? Se borrarán todos tus datos del plan actual.")) return;
    setLoading(true);
    setNavOpen(false);
    try {
      const uid = currentUser.id;
      await Promise.allSettled([
        SDB._rest(`/user_data?uid=eq.${uid}`,   { method: "DELETE" }),
        SDB._rest(`/preferences?uid=eq.${uid}`, { method: "DELETE" }),
        SDB._rest(`/progress?uid=eq.${uid}`,    { method: "DELETE" }),
        SDB._rest(`/meal_memory?uid=eq.${uid}`, { method: "DELETE" }),
        SDB._rest(`/plans?uid=eq.${uid}`,       { method: "DELETE" }),
        SDB._rest(`/checkins?uid=eq.${uid}`,    { method: "DELETE" }),
      ]);
      clearData();
      PDB._savePlans(uid, []);
      setPlan(null); setProfile(DEFAULT_PROFILE); setStep(0);
      if (onPlanUpdated) onPlanUpdated();
    } catch(e) {
      console.error("[handleReset]", e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile=()=>{ setNavOpen(false); setPlan(null); setStep(0); };

  const handleDeleteAccount=async()=>{
    setDeleting(true);
    try {
      const uid = currentUser.id;
      await Promise.allSettled([
        SDB._rest(`/user_data?uid=eq.${uid}`,   { method: "DELETE" }),
        SDB._rest(`/preferences?uid=eq.${uid}`, { method: "DELETE" }),
        SDB._rest(`/progress?uid=eq.${uid}`,    { method: "DELETE" }),
        SDB._rest(`/meal_memory?uid=eq.${uid}`, { method: "DELETE" }),
        SDB._rest(`/plans?uid=eq.${uid}`,       { method: "DELETE" }),
        SDB._rest(`/checkins?uid=eq.${uid}`,    { method: "DELETE" }),
      ]);
      // Requiere Edge Function "delete-user" en Supabase que:
      // 1. Borre datos de tablas por user_id
      // 2. Elimine el usuario auth usando service_role key
      try {
        await SDB._rest("/functions/v1/delete-user", { method: "POST", body: JSON.stringify({ uid }) });
      } catch(efErr) {
        console.error("[handleDeleteAccount] Edge Function no disponible:", efErr);
      }
      localStorage.clear();
      await SDB.signOut();
      onLogout();
    } catch(e) {
      console.error("[handleDeleteAccount]", e);
      alert("Error al eliminar la cuenta. Inténtalo de nuevo.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleRegenerate=()=>{
    if (isNutriPlan) { alert("🔒 Tu plan fue creado por tu nutricionista y no se puede regenerar automáticamente."); setNavOpen(false); return; }
    const wk=getWeekNumber();
    const newPlan=__PERF.time("buildPlan:regenerate", () => buildPlan(profile,targetKcal));  // PERF
    setPlan(newPlan); setWeekNum(wk); setActiveDay(0); setActiveTab("plan");
    saveData(profile,newPlan,wk,{}); setExtras({}); setNavOpen(false);
    saveToPDB(profile, newPlan, wk, {}, "system");
  };

  const regenerateMeal=(dayIdx, mealSlot, semanticHint)=>{
    // Step 4+5: registrar acción del usuario y logs de diagnóstico
    trackUserAction("regenerateMeal");
    __TRACE.log("regenerateMeal:start", { dayIdx, mealSlot, semanticHint, planId: plan?.id });
    console.log("[regenerateMeal] click recibido", { dayIdx, mealSlot, semanticHint });
    if (isNutriPlan) { alert("🔒 Plan de nutricionista — usa las alternativas disponibles o contacta con tu nutricionista."); return; }
    const newPlan=JSON.parse(JSON.stringify(plan));
    console.log("[regenerateMeal] before-state", {
      planId: plan?._planId,
      slot: mealSlot,
      mealBefore: newPlan.days[dayIdx]?.meals?.find(m => m?.time === mealSlot)?.p1,
    });
    const _rMeal=newPlan.days[dayIdx]?.meals?.find(m =>
      m && (
        m.time === mealSlot ||
        (mealSlot === "Comida" && m.time === "Comida") ||
        (mealSlot === "Cena" && m.time === "Cena") ||
        (mealSlot === "Desayuno" && m.time === "Desayuno")
      )
    );

    // ────────────────────────────────────────────────────────────────
    // Normalización de excludeSpec (LEGACY + FREEFORM v3.1)
    // ────────────────────────────────────────────────────────────────
    //
    // LEGACY:
    //   spec contiene {P, C, V, S, ...} → se pasa sin cambios
    //
    // FREEFORM:
    //   spec.freeForm === true
    //   proteína vive en identity.protein
    //   se construye objeto mínimo compatible con _filterRegen
    //
    // IMPORTANTE:
    //   _filterRegen SOLO usa excludeSpec.P
    // ────────────────────────────────────────────────────────────────

    const _resolveExcludeSpec = function(rMeal) {
      if (!rMeal || !rMeal._spec) return null;

      const spec = rMeal._spec;

      if (spec.freeForm === true) {
        const ident = spec.identity || {};

        return {
          P: ident.protein || null,

          _meta: {
            source: "freeForm",
            identityId: ident.id || null
          }
        };
      }

      // LEGACY: sin modificaciones
      return spec;
    };

    const _excludeSpec = _resolveExcludeSpec(_rMeal);

    const contextProfile = Object.assign({}, profile, {
      _regenContext: {
        dayIdx,
        slot: mealSlot,
        semanticHint: semanticHint || "diferente",
        currentPlan: newPlan,
        excludeSpec: _excludeSpec
      }
    });
    const rebuilt=__PERF.time("buildPlan:regenerateMeal", () => buildPlan(contextProfile, targetKcal));  // PERF
    if(rebuilt.days[dayIdx] && rebuilt.days[dayIdx].meals) {
      const newMeals=rebuilt.days[dayIdx].meals;
      const oldMeals=newPlan.days[dayIdx].meals;
      oldMeals.forEach(function(m,i){ if(!m) return; if(m.time===mealSlot||(mealSlot==="Comida"&&m.time==="Comida")||(mealSlot==="Cena"&&m.time==="Cena")||(mealSlot==="Desayuno"&&m.time==="Desayuno")){ if(newMeals[i]) newPlan.days[dayIdx].meals[i]=newMeals[i]; } });
    }
    __TRACE.event("plan", "regenerateMeal", plan, newPlan);
    // source="user" → siempre aceptado
    traceSetPlan("user", plan, newPlan);
    console.log("[regenerateMeal] after-state", {
      mealAfter: newPlan.days[dayIdx]?.meals?.find(m => m?.time === mealSlot)?.p1,
    });
    setPlan(newPlan); saveData(profile,newPlan,weekNum,extras); setSwapSemantic(null);
    // FIX 3: persistir en PDB para que hidrataciones futuras no revertam la comida regenerada.
    // updateActivePlan ya no bumpeea created_at (Fix 6), así que no dispara loop de hidratación.
    PDB.updateActivePlan(currentUser.id, { days: newPlan.days });
    __TRACE.log("regenerateMeal:end");
  };

  // ── rebuildDayMeals — FASE 4 ────────────────────────────────────────────────
  // Función pura: recompone las meals de un día desde sus _spec, usando el
  // shakeFactor correcto para el nuevo estado efectivo del batido.
  // Usa el pipeline exacto de buildPlan via dayPortionsRegen — sin lógica duplicada.
  // Safe-guards: meals sin _spec o con _spec.recomposable===false se preservan.
  const rebuildDayMeals = (dayIdx, meals, effectiveShake) => {
    // Clonar profile, sobreescribir enabled para que buildPlan calcule
    // el shakeFactor correcto en el closure de composeMeal.
    const clonedProfile = JSON.parse(JSON.stringify(profile));
    clonedProfile.extras = clonedProfile.extras || {};
    clonedProfile.extras.proteinShake = Object.assign(
      {enabled:false,scoops:1,kcalPerScoop:120,proteinPerScoop:24,timing:"post_entreno"},
      clonedProfile.extras.proteinShake,
      {enabled: effectiveShake}
    );
    // El contexto dayPortionsRegen le dice a buildPlan que recomponga SOLO este día
    // desde los _spec existentes — los otros días se generan pero se descartan.
    clonedProfile._regenContext = {
      dayPortionsRegen: {
        dayIdx,
        meals,
        shakeEnabledOverride: effectiveShake
      }
    };
    const rebuilt = buildPlan(clonedProfile, targetKcal);
    return rebuilt.days[dayIdx];
  };

  // ── toggleDayShake — FASE 3 ─────────────────────────────────────────────────
  // Recalcula REALMENTE las porciones del día según el nuevo estado del batido.
  // Comportamiento honesto: ON → meals reducidas + ShakeCard / OFF → meals completas.
  // Reversible: OFF→ON→OFF produce cantidades idénticas (mismo _spec + mismos factors).
  const regenerateDayPortions = (dayIdx) => {
    if (isNutriPlan) return;
    const currentDay = plan && plan.days && plan.days[dayIdx];
    if (!currentDay) return;
    trackUserAction("toggleDayShake");

    const globalEnabled = !!(
      profile.extras &&
      profile.extras.proteinShake &&
      profile.extras.proteinShake.enabled
    );
    const currentOverride = currentDay.shakeEnabled;

    let newOverride;
    if (currentOverride === undefined) {
      newOverride = !globalEnabled;
    } else {
      newOverride = !currentOverride;
    }

    const effectiveShake =
      (globalEnabled && newOverride !== false) ||
      (!globalEnabled && newOverride === true);

    const hasSnapshot =
      !!dayShakeSnapshotRef.current[dayIdx];

    console.log("[toggleShake] effectiveShake:", effectiveShake);
    console.log("[toggleShake] hasSnapshot:", hasSnapshot);

    if (hasSnapshot) {
      const snapshot = dayShakeSnapshotRef.current[dayIdx];
      delete dayShakeSnapshotRef.current[dayIdx];
      console.log("[toggleShake] restoring snapshot, day", dayIdx);
      const newPlan = JSON.parse(JSON.stringify(plan));
      newPlan.days[dayIdx] = Object.assign({}, currentDay, {
        meals: JSON.parse(JSON.stringify(snapshot)),
        shakeEnabled: newOverride,
      });
      traceSetPlan("user", plan, newPlan);
      setPlan(newPlan);
      saveData(profile, newPlan, weekNum, extras);
      PDB.updateActivePlan(currentUser.id, { days: newPlan.days });
      return;
    }

    dayShakeSnapshotRef.current[dayIdx] =
      JSON.parse(JSON.stringify(currentDay.meals));
    console.log("[toggleShake] snapshot saved, day", dayIdx);

    const rebuiltDay = rebuildDayMeals(
      dayIdx, currentDay.meals, effectiveShake
    );
    const newPlan = JSON.parse(JSON.stringify(plan));
    // Preservar slotNote de las meals originales —
    // composeMeal no lo replica, se pierde en el rebuild.
    const _mergedMeals = rebuiltDay.meals.map(function(meal, i) {
      var orig = currentDay.meals && currentDay.meals[i];
      if (!meal || !orig || !orig.slotNote) return meal;
      return Object.assign({}, meal, {slotNote: orig.slotNote});
    });
    newPlan.days[dayIdx] = Object.assign({}, rebuiltDay, {
      meals: _mergedMeals,
      shakeEnabled: newOverride,
    });
    traceSetPlan("user", plan, newPlan);
    setPlan(newPlan);
    saveData(profile, newPlan, weekNum, extras);
    PDB.updateActivePlan(currentUser.id, { days: newPlan.days });
  };

  const SEMANTIC_OPTIONS=[
    {key:"comfort",  emoji:"🫂", label:"Algo más reconfortante"},
    {key:"ligero",   emoji:"🥗", label:"Algo más ligero"},
    {key:"rapido",   emoji:"⚡", label:"Algo más rápido de preparar"},
    {key:"diferente",emoji:"🎲", label:"Sorpréndeme"},
  ];

  if(loading) return (<div style={{background:Dk.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:sans,color:Dk.muted,fontSize:14}}>Cargando tu plan...</div>);

  // ── SETUP WIZARD ─────────────────────────────────────────────────────────
  if(!plan){
    const TITLES=["Datos básicos","Actividad","Objetivo","Comidas","Perfil","Restricciones"];
    const ICONS =["📏","🏃","🎯","🍽️","🧠","🚫"];
    const bmr=Math.round(profile.gender==="male"?10*profile.weight+6.25*profile.height-5*profile.age+5:10*profile.weight+6.25*profile.height-5*profile.age-161);

    const content=()=>{
      if(step===0) return (
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <div>
            <div style={{fontSize:10,color:Dk.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Género</div>
            <div style={{display:"flex",gap:8}}>
              {[{k:"female",icon:"♀️",lbl:"Mujer"},{k:"male",icon:"♂️",lbl:"Hombre"}].map(g=>(
                <button key={g.k} onClick={()=>up("gender",g.k)} style={{flex:1,padding:"12px 8px",borderRadius:10,border:"2px solid "+(profile.gender===g.k?Dk.accent:Dk.border),background:profile.gender===g.k?Dk.accent+"18":Dk.card2,color:profile.gender===g.k?Dk.accent:Dk.muted,cursor:"pointer",fontFamily:sans,fontSize:13,fontWeight:600,textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:3}}>{g.icon}</div>{g.lbl}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <DOBPicker
              dob={profile.date_of_birth||""}
              onChange={(dob, age) => { up("date_of_birth", dob); up("age", age); }}
              accentColor={Dk.accent}
              textColor={Dk.text}
              mutedColor={Dk.muted}
              borderColor={Dk.border}
              bgColor={Dk.card2}
            />
            <Stepper label="Peso"   value={profile.weight} onChange={v=>up("weight",v)} min={40} max={180} unit="kg"/>
            <Stepper label="Altura" value={profile.height} onChange={v=>up("height",v)} min={140} max={220} unit="cm"/>
          </div>
          <div style={{background:Dk.card2,borderRadius:10,padding:"12px 14px",border:"1px solid "+Dk.border}}>
            <div style={{display:"flex",justifyContent:"space-around"}}>
              {/* TMB — con botón de información */}
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:9,color:Dk.muted,marginBottom:2,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                  TMB
                  <button type="button" onClick={()=>setShowTMBInfo(v=>!v)} aria-label={showTMBInfo?"Cerrar información del TMB":"¿Qué es el TMB?"} aria-expanded={showTMBInfo} style={{background:"none",border:"1px solid "+Dk.muted,borderRadius:"50%",width:13,height:13,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,color:Dk.muted,padding:0,lineHeight:1,flexShrink:0,fontFamily:sans}}>i</button>
                </div>
                <div style={{fontSize:17,fontWeight:700,color:Dk.accent,fontFamily:serif}}>{bmr}</div>
                <div style={{fontSize:9,color:Dk.muted}}>kcal base</div>
              </div>
              {/* IMC — con botón de información */}
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:9,color:Dk.muted,marginBottom:2,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                  IMC
                  <button type="button" onClick={()=>setShowIMCInfo(v=>!v)} aria-label={showIMCInfo?"Cerrar información del IMC":"¿Qué es el IMC?"} aria-expanded={showIMCInfo} style={{background:"none",border:"1px solid "+Dk.muted,borderRadius:"50%",width:13,height:13,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,color:Dk.muted,padding:0,lineHeight:1,flexShrink:0,fontFamily:sans}}>i</button>
                </div>
                <div style={{fontSize:17,fontWeight:700,color:Dk.accent,fontFamily:serif}}>{(profile.weight/((profile.height/100)**2)).toFixed(1)}</div>
                <div style={{fontSize:9,color:Dk.muted}}>kg/m²</div>
              </div>
              {/* TDEE — con botón de información */}
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:9,color:Dk.muted,marginBottom:2,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                  TDEE
                  <button type="button" onClick={()=>setShowTDEEInfo(v=>!v)} aria-label={showTDEEInfo?"Cerrar información del TDEE":"¿Qué es el TDEE?"} aria-expanded={showTDEEInfo} style={{background:"none",border:"1px solid "+Dk.muted,borderRadius:"50%",width:13,height:13,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,color:Dk.muted,padding:0,lineHeight:1,flexShrink:0,fontFamily:sans}}>i</button>
                </div>
                <div style={{fontSize:17,fontWeight:700,color:Dk.accent,fontFamily:serif}}>{tdee}</div>
                <div style={{fontSize:9,color:Dk.muted}}>kcal/día</div>
              </div>
            </div>
            {showTMBInfo&&(()=>{
              const isMale=profile.gender==="male";
              const tmbFormula=isMale
                ?"10×"+profile.weight+" + 6.25×"+profile.height+" − 5×"+profile.age+" + 5"
                :"10×"+profile.weight+" + 6.25×"+profile.height+" − 5×"+profile.age+" − 161";
              return(
                <div style={{marginTop:10,padding:"10px 12px",background:Dk.card,borderRadius:8,border:"1px solid "+Dk.border,animation:"fi 0.2s ease"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                    <span style={{fontSize:11,fontWeight:700,color:Dk.text}}>Tasa Metabólica Basal</span>
                    <button type="button" onClick={()=>setShowTMBInfo(false)} aria-label="Cerrar panel TMB" style={{background:"none",border:"none",cursor:"pointer",color:Dk.muted,fontSize:15,padding:0,lineHeight:1}}>×</button>
                  </div>
                  <div style={{fontSize:11,color:Dk.muted,marginBottom:6,lineHeight:1.6}}>
                    Calorías que tu cuerpo necesita en reposo absoluto para mantener funciones vitales.<br/>
                    <span style={{color:Dk.text}}>Fórmula Mifflin-St Jeor ({isMale?"hombre":"mujer"}): </span>
                    <span style={{color:Dk.accent,fontWeight:700}}>{tmbFormula} = {bmr} kcal</span>
                  </div>
                  <div style={{fontSize:11,color:Dk.muted,lineHeight:1.6}}>
                    Depende de tu <span style={{color:Dk.text}}>edad</span>, <span style={{color:Dk.text}}>peso</span>, <span style={{color:Dk.text}}>altura</span> y <span style={{color:Dk.text}}>sexo</span>. No incluye ninguna actividad física.
                  </div>
                </div>
              );
            })()}
            {showTDEEInfo&&(()=>{
              const actLabel={"sedentario":"sedentario (×1.2)","ligero":"ligera (×1.375)","moderado":"moderada (×1.55)","activo":"alta (×1.725)","muy_activo":"muy alta (×1.9)"}[profile.activity]||"moderada";
              const tmbVal=Math.round(profile.gender==="male"?10*profile.weight+6.25*profile.height-5*profile.age+5:10*profile.weight+6.25*profile.height-5*profile.age-161);
              return(
                <div style={{marginTop:10,padding:"10px 12px",background:Dk.card,borderRadius:8,border:"1px solid "+Dk.border,animation:"fi 0.2s ease"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                    <span style={{fontSize:11,fontWeight:700,color:Dk.text}}>Gasto Energético Diario Total</span>
                    <button type="button" onClick={()=>setShowTDEEInfo(false)} aria-label="Cerrar panel TDEE" style={{background:"none",border:"none",cursor:"pointer",color:Dk.muted,fontSize:15,padding:0,lineHeight:1}}>×</button>
                  </div>
                  <div style={{fontSize:11,color:Dk.muted,marginBottom:6,lineHeight:1.6}}>
                    Calorías totales que gastas al día incluyendo tu actividad física ({actLabel}).<br/>
                    <span style={{color:Dk.text}}>TMB ({tmbVal} kcal) × factor de actividad = </span>
                    <span style={{color:Dk.accent,fontWeight:700}}>{tdee} kcal/día</span>
                  </div>
                  <div style={{fontSize:11,color:Dk.muted,lineHeight:1.6}}>
                    Comer alrededor de este valor mantiene tu peso. Un déficit lo reduce; un superávit lo aumenta.
                  </div>
                </div>
              );
            })()}
            {showIMCInfo&&(()=>{
              const imcVal=parseFloat((profile.weight/((profile.height/100)**2)).toFixed(1));
              const cat=imcVal<18.5?{label:"Bajo peso",   color:"#60a5fa",hint:"Considera aumentar la ingesta calórica con alimentos nutritivos."}
                       :imcVal<25  ?{label:"Peso normal", color:THEME.colorSuccess,hint:"Tu peso está en el rango saludable para tu altura."}
                       :imcVal<30  ?{label:"Sobrepeso",   color:THEME.colorWarning,hint:"Un pequeño déficit calórico puede ayudarte a alcanzar el rango saludable."}
                       :            {label:"Obesidad",    color:THEME.colorError,hint:"Se recomienda trabajar con un profesional para un plan personalizado."};
              return(
                <div style={{marginTop:10,padding:"10px 12px",background:Dk.card,borderRadius:8,border:"1px solid "+Dk.border,animation:"fi 0.2s ease"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                    <span style={{fontSize:11,fontWeight:700,color:Dk.text}}>Índice de Masa Corporal</span>
                    <button type="button" onClick={()=>setShowIMCInfo(false)} aria-label="Cerrar panel IMC" style={{background:"none",border:"none",cursor:"pointer",color:Dk.muted,fontSize:15,padding:0,lineHeight:1}}>×</button>
                  </div>
                  <div style={{fontSize:11,color:Dk.muted,marginBottom:6,lineHeight:1.6}}>
                    Mide si tu peso es proporcional a tu altura.<br/>
                    <span style={{color:Dk.text}}>Fórmula: </span>{profile.weight} ÷ ({(profile.height/100).toFixed(2)})² =&nbsp;<span style={{color:Dk.accent,fontWeight:700}}>{imcVal} kg/m²</span>
                  </div>
                  <div style={{fontSize:11,marginBottom:9}}>
                    Tu valor indica:&nbsp;<span style={{color:cat.color,fontWeight:700}}>{cat.label}</span>
                    <div style={{fontSize:10,color:Dk.muted,marginTop:2}}>{cat.hint}</div>
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    {[["<18.5","Bajo peso","#60a5fa"],["18.5–24.9","Normal",THEME.colorSuccess],["25–29.9","Sobrepeso",THEME.colorWarning],["≥30","Obesidad",THEME.colorError]].map(([range,name,col])=>(
                      <div key={range} style={{flex:1,padding:"4px 3px",borderRadius:5,background:cat.label===name?col+"22":"transparent",border:"1px solid "+(cat.label===name?col:Dk.border),textAlign:"center"}}>
                        <div style={{fontSize:9,color:col,fontWeight:700,lineHeight:1.3}}>{name}</div>
                        <div style={{fontSize:8,color:Dk.muted}}>{range}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      );
      if(step===1) return (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {ACTIVITIES.map(a=>(
            <button key={a.key} onClick={()=>up("activity",a.key)} style={{padding:"11px 13px",borderRadius:10,border:"2px solid "+(profile.activity===a.key?Dk.accent:Dk.border),background:profile.activity===a.key?Dk.accent+"18":Dk.card2,color:Dk.text,cursor:"pointer",fontFamily:sans,textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20,flexShrink:0}}>{a.icon}</span>
              <div style={{minWidth:0}}><div style={{fontWeight:600,fontSize:13,color:profile.activity===a.key?Dk.accent:Dk.text}}>{a.label}</div><div style={{fontSize:11,color:Dk.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.desc}</div></div>
              {profile.activity===a.key&&<span style={{marginLeft:"auto",color:Dk.accent,flexShrink:0}}>✓</span>}
            </button>
          ))}
        </div>
      );
      if(step===2) return (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {GOALS.map(g=>{
            const sel=profile.goal===g.key;
            return (<button key={g.key} onClick={()=>up("goal",g.key)} style={{padding:"11px 13px",borderRadius:10,border:"2px solid "+(sel?g.color:Dk.border),background:sel?g.color+"15":Dk.card2,cursor:"pointer",fontFamily:sans,textAlign:"left",display:"flex",alignItems:"center",gap:10,position:"relative"}}>
              <span style={{fontSize:22,flexShrink:0}}>{g.icon}</span>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,color:sel?g.color:Dk.text}}>{g.label}</div><div style={{fontSize:11,color:Dk.muted}}>{g.desc}</div></div>
              <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:15,fontWeight:700,color:g.color,fontFamily:serif}}>{calcTarget(tdee,g.key)}</div><div style={{fontSize:9,color:Dk.muted}}>kcal/día</div></div>
            </button>);
          })}
          <div style={{background:Dk.card2,borderRadius:10,padding:12,border:"1px solid "+Dk.border,marginTop:2}}>
            <div style={{fontSize:10,color:Dk.muted,marginBottom:8,letterSpacing:"0.1em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:5}}>
              Macros estimados — {targetKcal} kcal/día
              <button type="button" onClick={()=>setShowMacrosInfo(v=>!v)} aria-label={showMacrosInfo?"Cerrar información de macros":"¿Cómo se calculan los macros?"} aria-expanded={showMacrosInfo} style={{background:"none",border:"1px solid "+Dk.muted,borderRadius:"50%",width:13,height:13,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,color:Dk.muted,padding:0,lineHeight:1,flexShrink:0,fontFamily:sans,textTransform:"none",letterSpacing:"normal"}}>i</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
              {(function(){var m=calcMacros(targetKcal,profile.weight,profile.goal,profile.activity,computeStrategy(profile));return[["Proteína",m.protein,"#737520",(m.proteinFactor||2.0)+"g/kg"],["Hidratos",m.carbs,THEME.colorWarning,""],["Grasa",m.fat,THEME.colorPurpleLight,""]];})().map(([lbl,val,col,note])=>(
                <div key={lbl}><div style={{fontSize:18,fontWeight:700,color:col,fontFamily:serif}}>{val}g</div><div style={{fontSize:10,color:Dk.muted}}>{lbl}</div>{note?<div style={{fontSize:9,color:Dk.muted,marginTop:1}}>{note}</div>:null}</div>
              ))}
            </div>
            {showMacrosInfo&&(
              <div style={{marginTop:10,padding:"10px 12px",background:Dk.card,borderRadius:8,border:"1px solid "+Dk.border,animation:"fi 0.2s ease"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                  <span style={{fontSize:11,fontWeight:700,color:Dk.text}}>¿Cómo se calculan tus macros?</span>
                  <button type="button" onClick={()=>setShowMacrosInfo(false)} aria-label="Cerrar panel macros" style={{background:"none",border:"none",cursor:"pointer",color:Dk.muted,fontSize:15,padding:0,lineHeight:1}}>×</button>
                </div>
                <div style={{fontSize:11,color:Dk.muted,marginBottom:8,lineHeight:1.6}}>
                  Son estimaciones derivadas de tu TDEE (<span style={{color:Dk.text}}>{tdee} kcal/día</span>) y ajustadas según tu objetivo y nivel de actividad — no son valores fijos.
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {[
                    ["#737520","Proteína","Mantenimiento y construcción muscular. Se calcula a partir de tu peso corporal."],
                    [THEME.colorWarning,"Hidratos","Principal fuente de energía. Se asignan las calorías restantes tras proteína y grasa."],
                    [THEME.colorPurpleLight,"Grasa","Función hormonal y energética. Representa un porcentaje fijo del total calórico."],
                  ].map(([col,name,desc])=>(
                    <div key={name} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0,marginTop:2}}/>
                      <div style={{fontSize:11,color:Dk.muted,lineHeight:1.5}}><span style={{color:col,fontWeight:700}}>{name}:</span> {desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
      if(step===3) {
        const MEAL_OPTIONS=[{n:2,icon:"🍳",label:"2 comidas",desc:"Desayuno + Comida principal",detail:"Ideal si prefieres ventanas de ayuno"},{n:3,icon:"🥗",label:"3 comidas",desc:"Desayuno · Comida · Cena",detail:"El esquema más clásico y equilibrado"},{n:4,icon:"🥙",label:"4 comidas",desc:"Desayuno · Almuerzo · Comida · Cena",detail:"Añade un snack a media mañana"},{n:5,icon:"🍱",label:"5 comidas",desc:"Desayuno · Almuerzo · Comida · Merienda · Cena",detail:"Máxima frecuencia, porciones más pequeñas"}];
        return (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {MEAL_OPTIONS.map(o=>{
              const sel=profile.mealsPerDay===o.n;
              return (<button key={o.n} onClick={()=>up("mealsPerDay",o.n)} style={{padding:"13px 15px",borderRadius:10,border:"2px solid "+(sel?Dk.accent:Dk.border),background:sel?Dk.accent+"18":Dk.card2,cursor:"pointer",fontFamily:sans,textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24,flexShrink:0}}>{o.icon}</span>
                <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:13,color:sel?Dk.accent:Dk.text}}>{o.label}</div><div style={{fontSize:11,color:Dk.muted}}>{o.desc}</div><div style={{fontSize:10,color:Dk.muted,marginTop:2,fontStyle:"italic"}}>{o.detail}</div></div>
                {sel&&<span style={{color:Dk.accent,flexShrink:0,fontSize:16}}>✓</span>}
              </button>);
            })}
            {(()=>{
              var _extras=profile.extras||{};
              var _shake=_extras.proteinShake||{enabled:false,scoops:1,kcalPerScoop:120,proteinPerScoop:24,timing:"post_entreno"};
              var _shakeOn=!!_shake.enabled;
              var _upShake=function(patch){up("extras",Object.assign({},_extras,{proteinShake:Object.assign({},_shake,patch)}));};
              return(
                <div style={{marginTop:6}}>
                  <div style={{fontSize:10,color:Dk.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Suplementación</div>
                  <button onClick={()=>_upShake({enabled:!_shakeOn})} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"2px solid "+(_shakeOn?Dk.accent:Dk.border),background:_shakeOn?Dk.accent+"18":Dk.card2,color:_shakeOn?Dk.accent:Dk.text,cursor:"pointer",fontFamily:sans,textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:22}}>🥤</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600}}>Tomo batido de proteína a diario</div>
                      <div style={{fontSize:11,color:Dk.muted}}>Si lo marcas, ajustamos las porciones de tus comidas para que el total cuadre con tu objetivo (no se suma encima).</div>
                    </div>
                    <span style={{fontSize:13,fontWeight:700,color:_shakeOn?Dk.accent:Dk.muted}}>{_shakeOn?"ON":"OFF"}</span>
                  </button>
                  {_shakeOn&&(
                    <div style={{marginTop:8,padding:"10px 14px",borderRadius:10,background:Dk.card2,border:"1px solid "+Dk.border,display:"flex",flexDirection:"column",gap:10}}>
                      <div>
                        <div style={{fontSize:10,color:Dk.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Cantidad</div>
                        <div style={{display:"flex",gap:6}}>
                          {[1,2].map(function(n){var sel=(_shake.scoops||1)===n;return(
                            <button key={n} onClick={()=>_upShake({scoops:n})} style={{flex:1,padding:"8px",borderRadius:8,border:"2px solid "+(sel?Dk.accent:Dk.border),background:sel?Dk.accent+"18":Dk.card2,color:sel?Dk.accent:Dk.text,cursor:"pointer",fontFamily:sans,fontSize:13,fontWeight:sel?700:400}}>
                              {n} {n===1?"scoop":"scoops"}
                            </button>);
                          })}
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:Dk.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Cuándo lo tomas</div>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          {[{k:"manana",lbl:"Por la mañana"},{k:"post_entreno",lbl:"Post-entreno"},{k:"noche",lbl:"Por la noche"}].map(function(t){var sel=(_shake.timing||"post_entreno")===t.k;return(
                            <button key={t.k} onClick={()=>_upShake({timing:t.k})} style={{padding:"7px 12px",borderRadius:8,border:"2px solid "+(sel?Dk.accent:Dk.border),background:sel?Dk.accent+"18":Dk.card2,color:sel?Dk.accent:Dk.text,cursor:"pointer",fontFamily:sans,fontSize:12,fontWeight:sel?600:400,textAlign:"left"}}>
                              {t.lbl}
                            </button>);
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      }
      if(step===4) {
        var hambreOpts=[{k:"baja",icon:"🙂",lbl:"Baja",desc:"No suelo tener hambre"},{k:"media",icon:"😐",lbl:"Media",desc:"Hambre normal, controlable"},{k:"alta",icon:"😤",lbl:"Alta",desc:"Me cuesta mucho controlarla"}];
        var expOpts=[{k:"novato",icon:"⚡",lbl:"Rápido y sin complicaciones",desc:"Recetas de menos de 15 min"},{k:"intermedio",icon:"🍳",lbl:"Me gusta cocinar un poco",desc:"Platos variados, 15-30 min"},{k:"avanzado",icon:"👨‍🍳",lbl:"Disfruto cocinando",desc:"Recetas más elaboradas"}];
        var tiempoOpts=[{k:"poco",icon:"⏱️",lbl:"Poco tiempo entre semana",desc:"Laborables apretados"},{k:"normal",icon:"🕐",lbl:"Tiempo normal",desc:"Puedo cocinar tranquilamente"},{k:"mucho",icon:"🍲",lbl:"Disfruto del proceso",desc:"Me gusta dedicarle tiempo"}];
        var previewStrategy=computeStrategy(profile);
        var previewInfo=STRATEGIES[previewStrategy]||STRATEGIES.mantenimiento_equilibrado;
        return (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {[[hambreOpts,"hambre","Nivel de hambre habitual"],[expOpts,"experiencia","¿Cuánto te gusta cocinar?"],[tiempoOpts,"tiempoCocina","Tiempo disponible entre semana"]].map(([opts,field,title])=>(
              <div key={field}>
                <div style={{fontSize:10,color:Dk.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>{title}</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {opts.map(function(o){var sel=(profile[field]||"normal")===o.k;return(
                    <button key={o.k} onClick={()=>up(field,o.k)} style={{padding:"10px 14px",borderRadius:10,border:"2px solid "+(sel?Dk.accent:Dk.border),background:sel?Dk.accent+"18":Dk.card2,color:sel?Dk.accent:Dk.text,cursor:"pointer",fontFamily:sans,textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:22}}>{o.icon}</span><div><div style={{fontSize:13,fontWeight:600}}>{o.lbl}</div><div style={{fontSize:11,color:Dk.muted}}>{o.desc}</div></div>
                    </button>
                  );})}</div>
              </div>
            ))}
            <div style={{background:previewInfo.color+"18",border:"1px solid "+previewInfo.color+"55",borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:Dk.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Tu estrategia asignada</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:22}}>{previewInfo.icon}</span><span style={{fontSize:14,fontWeight:700,color:previewInfo.color}}>{previewInfo.label}</span></div>
              <div style={{fontSize:12,color:Dk.muted,lineHeight:1.5}}>{previewInfo.desc}</div>
            </div>
          </div>
        );
      }
      if(step===5) return (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <div style={{fontSize:10,color:Dk.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Intolerancias y alergias</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {INTOLERANCES.map(it=>{const sel=profile.intolerances.includes(it.key);return(<button key={it.key} onClick={()=>toggleIntol(it.key)} style={{padding:"6px 12px",borderRadius:99,border:"1.5px solid "+(sel?THEME.colorError2:Dk.border),background:sel?"#e05a5a22":Dk.card2,color:sel?THEME.colorError2:Dk.muted,cursor:"pointer",fontFamily:sans,fontSize:12,fontWeight:sel?600:400}}>{it.emoji} {it.label}</button>);})}
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:Dk.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Alimentos a eliminar</div>
            <div style={{display:"flex",gap:7,marginBottom:8}}>
              <input value={foodInput} onChange={e=>setFoodInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFood()} placeholder="Ej: atún, aguacate..." style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1px solid "+Dk.border,background:Dk.card2,color:Dk.text,fontFamily:sans,fontSize:13,outline:"none",minWidth:0}}/>
              <button onClick={addFood} style={{padding:"8px 14px",borderRadius:8,background:Dk.accent,color:THEME.bgPage,fontWeight:700,border:"none",cursor:"pointer",fontFamily:sans,flexShrink:0}}>+</button>
            </div>
            {profile.eliminatedFoods.length>0&&(<div style={{display:"flex",flexWrap:"wrap",gap:5}}>{profile.eliminatedFoods.map(f=>(<div key={f} style={{padding:"4px 10px",borderRadius:99,background:THEME.accentBg22,border:"1px solid #e8a04544",color:Dk.accent,fontSize:12,display:"flex",alignItems:"center",gap:4}}>{f}<button onClick={()=>removeFood(f)} style={{background:"none",border:"none",cursor:"pointer",color:Dk.accent,fontSize:13,padding:0}}>×</button></div>))}</div>)}
          </div>
          <div style={{background:Dk.card2,borderRadius:10,padding:12,border:"1px solid "+goalObj.color+"55"}}>
            <div style={{fontSize:10,color:Dk.muted,marginBottom:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>Resumen final</div>
            {[["🎯 Objetivo",GOAL_LABELS[profile.goal]],["🔥 Calorías",targetKcal+" kcal/día"],["💪 Macros",macros.protein+"g prot · "+macros.carbs+"g HC · "+macros.fat+"g grasa"],["🍽️ Comidas",profile.mealsPerDay+" comidas al día"],["🧠 Estrategia",(STRATEGIES[computeStrategy(profile)]||STRATEGIES.mantenimiento_equilibrado).label],["🚫 Eliminar",[...profile.intolerances.map(k=>(INTOLERANCES.find(x=>x.key===k)||{label:k}).label||k),...profile.eliminatedFoods].join(", ")||"Nada"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:"1px solid #30363d22",gap:8}}><span style={{color:Dk.muted,flexShrink:0}}>{k}</span><span style={{color:Dk.text,fontWeight:500,textAlign:"right",wordBreak:"break-word"}}>{v}</span></div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div style={{background:Dk.bg,minHeight:"100vh",fontFamily:sans,color:Dk.text}}>
        <style>{`@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{padding:"22px 16px 16px",textAlign:"center",borderBottom:"1px solid "+Dk.border,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:30,marginBottom:5}}>🥗</div>
            <h1 style={{fontFamily:serif,fontSize:22,color:Dk.text,margin:"0 0 2px"}}>Plan Nutricional</h1>
            <p style={{color:Dk.muted,margin:0,fontSize:11}}>{currentUser.email}</p>
          </div>
          <button onClick={onLogout} style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+Dk.border,background:"none",color:Dk.muted,fontFamily:sans,fontSize:12,cursor:"pointer",flexShrink:0}}>Salir</button>
        </div>
        <div style={{padding:"12px 16px 0",maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",gap:4,marginBottom:16}}>
            {TITLES.map((t,i)=>(<div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:3,borderRadius:99,background:i<=step?Dk.accent:Dk.border,marginBottom:4,transition:"background 0.3s"}}/><div style={{fontSize:9,color:i===step?Dk.accent:i<step?Dk.accentLight:Dk.muted,fontWeight:i===step?600:400,lineHeight:1.2}}>{ICONS[i]}<br/>{t}</div></div>))}
          </div>
        </div>
        <div style={{maxWidth:480,margin:"0 auto",padding:"0 16px 110px",animation:"fi 0.3s ease"}}>
          {/* NutiMessage — guía contextual por paso */}
          {step===0&&<NutiMessage message={COPY.onboarding.step0} variant="tip" compact style={{marginBottom:12}}/>}
          {step===1&&<NutiMessage message={COPY.onboarding.step1} variant="info" compact style={{marginBottom:12}}/>}
          {step===2&&<NutiMessage message={COPY.onboarding.step2} variant="nudge" compact style={{marginBottom:12}}/>}
          {step===5&&<NutiMessage message={COPY.onboarding.step5} variant="tip" compact style={{marginBottom:12}}/>}
          <div style={{background:Dk.card,borderRadius:14,padding:18,border:"1px solid "+Dk.border}}>
            <h2 style={{fontFamily:serif,fontSize:17,color:Dk.accent,margin:"0 0 16px"}}>{ICONS[step]} {TITLES[step]}</h2>
            {content()}
          </div>
        </div>
        <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 16px",background:Dk.bg+"f0",backdropFilter:"blur(8px)",borderTop:"1px solid "+Dk.border}}>
          <div style={{maxWidth:480,margin:"0 auto",display:"flex",gap:8}}>
            {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid "+Dk.border,background:Dk.card2,color:Dk.muted,fontFamily:sans,fontSize:13,fontWeight:600,cursor:"pointer"}}>{COPY.onboarding.back}</button>}
            {step<5?<button onClick={()=>setStep(s=>s+1)} style={{flex:2,padding:"12px",borderRadius:10,border:"none",background:Dk.accent,color:THEME.bgPage,fontFamily:sans,fontSize:14,fontWeight:700,cursor:"pointer"}}>{COPY.onboarding.next}</button>
              :<button
    onClick={handleGenerate}
    disabled={isGenerating}
    style={{
      flex:2, padding:"12px", borderRadius:10, border:"none",
      background: isGenerating
        ? THEME.textMuted5
        : "linear-gradient(135deg,"+Dk.accent+",#d4820a)",
      color: isGenerating ? THEME.textMuted3 : THEME.bgPage,
      fontFamily:sans, fontSize:14, fontWeight:700,
      cursor: isGenerating ? "not-allowed" : "pointer",
      opacity: isGenerating ? 0.7 : 1,
      transition:"all 0.2s",
    }}>
    {isGenerating ? "⏳ "+COPY.onboarding.generating : "✅ "+COPY.onboarding.generate}
  </button>}
          </div>
        </div>
      </div>
    );
  }

  // ── PLAN VIEW (100% ORIGINAL) ─────────────────────────────────────────
  const dayExtras = (dayName) => (extras[dayName]||[]);
  const dayExtraKcal = (dayName) => dayExtras(dayName).reduce((s,e)=>s+Number(e.kcal||0),0);
  const addExtra = (dayName) => {
    if(!selectedFood) return;
    const grams = parseFloat(extraInput.grams) || selectedFood.defaultG;
    const kcal  = calcFoodKcal(selectedFood, grams);
    const name  = selectedFood.name + " (" + Math.round(grams) + "g)";
    const updated = Object.assign({}, extras, {[dayName]:[...dayExtras(dayName),{name,kcal}]});
    setExtras(updated); saveData(profile,plan,weekNum,updated);
    setExtraInput({name:"",grams:""}); setSelectedFood(null); setSuggestions([]);
  };
  const removeExtra = (dayName,idx) => {
    const updated = Object.assign({}, extras, {[dayName]:dayExtras(dayName).filter(function(_,i){return i!==idx;})});
    setExtras(updated); saveData(profile,plan,weekNum,updated);
  };

  const day       = plan && plan.days ? plan.days[activeDay] : null;
  const isTraining= day ? day.special==="entrenamiento" : false;
  const isFreeDay = day ? day.special==="libre" : false;
  const accentFor =(meal)=>{ if(meal && meal.time && meal.time.includes("🏋️")) return THEME.colorPurple; return gc.primary; };

  if(!plan || !day) return null;

  return (
    <div style={{fontFamily:sans,background:THEME.bgPage,minHeight:"100vh"}}>
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@keyframes expandIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* HEADER */}
      <div style={{background:"#0D1B2A",padding:"14px 16px 0",position:"sticky",top:0,zIndex:20}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {/* Logo principal del header — PNG con alpha real */}
              <img
                src={NUTIPLAN_LOGO}
                alt=""
                aria-hidden="true"
                loading="lazy"
                style={{
                  display:"block",
                  width:72,
                  height:"auto",
                  objectFit:"contain",
                  background:"transparent",
                  flexShrink:0,
                  filter:"brightness(0) invert(1)",
                }}
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
              <div>
              <div style={{fontFamily:serif,fontSize:22,color:"#FFFFFF",lineHeight:1.2}}>
                {isNutriPlan ? "🧑‍⚕️ Plan de tu nutricionista" : "Plan de "+GOAL_LABELS[profile.goal].toLowerCase()}
              </div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.65)"}}>{profile.weight}kg · {targetKcal} kcal/día · <span style={{color:"#EFF2DA"}}>Semana {weekNum||getWeekNumber()}</span>
                {(()=>{var trend=computeTrend(progress.weeks);if(trend&&trend.diff!==0){var sign=trend.diff>0?"+":"";var col=((profile.goal==="fatLoss"||profile.goal==="mildFatLoss"||profile.goal==="fatLossGeneral")&&trend.diff<0)||(profile.goal==="muscleGain"&&trend.diff>0)?THEME.colorSuccess:THEME.colorError;return <span> · <span style={{color:col,fontWeight:700}}>{sign}{trend.diff} kg</span></span>;}return null;})()}
              </div>
              </div>
            </div>
            <button onClick={()=>setNavOpen(o=>!o)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,color:"rgba(255,255,255,0.85)",fontSize:18,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {navOpen?"✕":"☰"}
            </button>
          </div>

          {/* Strategy pill */}
          {(function(){var mealRules=getMealRules(stratKey);return(
            <div style={{display:"flex",alignItems:"center",gap:6,paddingBottom:isNutriPlan?0:8,marginTop:0,paddingLeft:2}}>
              <span style={{fontSize:13,flexShrink:0}}>{stratInfo.icon}</span>
              <div><span style={{fontSize:11,color:"#FFFFFF",fontWeight:700}}>{stratInfo.label}</span><span style={{fontSize:10,color:"rgba(239,242,218,0.7)",display:"block",marginTop:1,lineHeight:1.4}}>{mealRules.tipPlate}</span></div>
            </div>
          );})()}

          {/* Nutritionist lock banner */}
          {isNutriPlan && (
            <div style={{marginTop:6,marginBottom:6,padding:"5px 10px",background:THEME.purpleBg18,border:"1px solid #7c3aed44",borderRadius:8,fontSize:11,color:THEME.colorPurpleLight,display:"flex",alignItems:"center",gap:6}}>
              <span>🔒</span> Plan de tu nutricionista — ajústalo en el menú ☰
            </div>
          )}
          {/* SYNC FIX: non-intrusive banner shown when nutritionist updates the plan */}
          {planUpdatedBanner && (
            <div style={{marginBottom:6,padding:"6px 12px",background:THEME.successBg18,border:"1px solid #16a34a55",borderRadius:8,fontSize:12,color:THEME.colorSuccess,display:"flex",alignItems:"center",gap:8,animation:"fi 0.3s ease"}}>
              <span>✅</span>
              <span>Tu nutricionista ha actualizado tu plan</span>
              <button onClick={()=>setPlanUpdatedBanner(false)} style={{marginLeft:"auto",background:"none",border:"none",color:THEME.colorSuccess,cursor:"pointer",fontSize:14,padding:0}}>✕</button>
            </div>
          )}

          <div style={{display:"flex",gap:0}}>
            {[{key:"plan",label:"📅 Menú"},{key:"progreso",label:"📈 Progreso"},{key:"numeros",label:"📊 Números"},...(isAdmin?[{key:"admin",label:"⚙️ Admin"}]:[])].map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{flex:1,padding:"9px 4px",border:"none",cursor:"pointer",fontFamily:sans,fontWeight:activeTab===t.key?600:400,background:activeTab===t.key?"rgba(255,255,255,0.12)":"transparent",color:activeTab===t.key?"#FFFFFF":"rgba(255,255,255,0.6)",borderBottom:activeTab===t.key?"2px solid #EFF2DA":"2px solid transparent",fontSize:11,transition:"all 0.2s"}}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* NAV DROPDOWN */}
      {navOpen&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:30}} onClick={()=>setNavOpen(false)}>
          <div style={{position:"absolute",top:64,right:12,width:260,maxWidth:320,background:THEME.bgCard2,borderRadius:14,border:"1px solid #30363d",overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",animation:"slideDown 0.2s ease"}} onClick={function(e){e.stopPropagation();}}>
            {/* Plan warnings */}
            {((plan.weekWarnings&&plan.weekWarnings.length>0)||(plan.weekProblems&&plan.weekProblems.length>0)||(Number.isFinite(plan.weekScore)))&&(
              <div style={{padding:"12px 16px",borderBottom:"1px solid #30363d"}}>
                <div style={{fontSize:10,color:THEME.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Estado del plan</div>
                {Number.isFinite(plan.weekScore)&&(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:12,color:THEME.textPrimary}}>Variedad</span><span style={{fontSize:12,fontWeight:700,color:plan.weekScore>=80?THEME.colorSuccess:plan.weekScore>=60?THEME.colorWarning:THEME.colorError}}>{plan.weekScore}/100</span></div>)}
                {(plan.weekProblems||[]).map(function(w,i){return <div key={"p"+i} style={{fontSize:11,color:THEME.colorError,padding:"2px 0",lineHeight:1.4}}>{w}</div>;})}
                {(plan.weekWarnings||[]).filter(function(w){ return !w.startsWith("[AJUSTE]"); }).map(function(w,i){return <div key={"w"+i} style={{fontSize:11,color:THEME.colorWarning,padding:"2px 0",lineHeight:1.4}}>{w}</div>;})}
              </div>
            )}
            {!isNutriPlan&&(
              <div style={{padding:"12px 16px",borderBottom:"1px solid #30363d"}}>
                <button onClick={function(){handleRegenerate();setNavOpen(false);}} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:THEME.accent,color:THEME.bgPage,fontFamily:sans,fontSize:13,fontWeight:700,cursor:"pointer"}}>🔄 Regenerar plan</button>
              </div>
            )}
            {[
              {icon:"📋",label:"Check-in semanal",action:function(){setShowCheckin(true);setNavOpen(false);}},
              {icon:"✏️",label:"Cambiar mi perfil",action:handleEditProfile},
              {icon:"👤",label:"Mi perfil",action:function(){setShowProfile(true);setNavOpen(false);}},
              {icon:"🤝",label:"Plan con amigo",action:()=>{setShowFriendModal(true);setFriendMode("menu");setNavOpen(false);}},
              {icon:"←",label:"Cerrar sesión",action:()=>{setNavOpen(false);onLogout();},muted:true},
            ].map(function(item,i,arr){return(
              <button key={i} onClick={item.action} style={{width:"100%",padding:"13px 16px",border:"none",borderBottom:i<arr.length-1?"1px solid #30363d30":"none",background:"transparent",color:item.danger?THEME.colorError2:item.muted?THEME.textMuted:THEME.textPrimary,fontFamily:sans,fontSize:13,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:16}}>{item.icon}</span>{item.label}
              </button>
            );})}
          </div>
        </div>
      )}

      <div style={{maxWidth:600,margin:"0 auto",padding:"14px 13px 60px"}}>

        {activeTab==="plan"&&(
          <div style={{animation:"fi 0.3s ease"}}>
            {/* Nutricionista feedback */}
            {nutriFeedback&&(
              <div style={{background:nutriFeedback.type==="success"?THEME.bgSuccessLight:nutriFeedback.type==="warning"?"#fef9ec":"#eff6ff",border:"1px solid "+(nutriFeedback.type==="success"?THEME.colorSuccessLight:nutriFeedback.type==="warning"?"#fde68a":"#bfdbfe"),borderLeft:"4px solid "+(nutriFeedback.type==="success"?THEME.colorSuccessDark:nutriFeedback.type==="warning"?THEME.colorWarningAlt:"#2563eb"),borderRadius:10,padding:"12px 14px",marginBottom:12,animation:"fi 0.4s ease"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1}}><div style={{fontSize:11,color:THEME.textDark2,fontWeight:700,marginBottom:3}}>{nutriFeedback.type==="success"?"✅ Tu nutricionista dice:":nutriFeedback.type==="warning"?"⚡ Tu nutricionista dice:":"ℹ️ Tu nutricionista dice:"}</div><div style={{fontSize:13,color:THEME.textDark,lineHeight:1.55,fontStyle:"italic"}}>"{nutriFeedback.msg}"</div></div>
                  <button onClick={()=>setNutriFeedback(null)} style={{background:"none",border:"none",cursor:"pointer",color:THEME.textMuted3,fontSize:16,padding:"0 2px",flexShrink:0}}>×</button>
                </div>
              </div>
            )}

            {/* Day pills */}
            <div style={{display:"flex",gap:4,marginBottom:13,justifyContent:"center"}}>
              {plan.days.map((d,i)=>(<button key={i} onClick={()=>{setActiveDay(i);setOpenMeal(null);}} style={{width:34,height:34,borderRadius:"50%",border:"2px solid "+(activeDay===i?"#4A4E10":"#e2e8f0"),background:activeDay===i?"#4A4E10":THEME.bgWhite,color:activeDay===i?"#FFFFFF":THEME.textDark2,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:sans}}>{DAYS_SHORT[i]}</button>))}
            </div>

            {/* Day card */}
            <div style={{background:THEME.bgWhite,borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 2px 16px rgba(0,0,0,0.07)"}}>
              <div style={{background:"#4A4E10",padding:"14px 18px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <h2 style={{fontSize:22,color:THEME.bgWhite,margin:0,fontFamily:serif,letterSpacing:"-0.3px"}}>{day.name}</h2>
                  <div style={{display:"flex",gap:4}}>
                    {isTraining&&<span style={{fontSize:10,background:"rgba(255,255,255,0.22)",color:THEME.bgWhite,padding:"3px 8px",borderRadius:99,fontWeight:600}}>🏋️ entreno</span>}
                    {isFreeDay&&<span style={{fontSize:10,background:"rgba(255,255,255,0.22)",color:THEME.bgWhite,padding:"3px 8px",borderRadius:99,fontWeight:600}}>🎉 libre</span>}
                  </div>
                </div>
                {(()=>{var note=day.meals&&day.meals.find(function(m){return m&&m.slotNote;});return note?<div style={{fontSize:15,color:"rgba(255,255,255,0.82)",lineHeight:1.45,marginBottom:6}}>{note.slotNote}</div>:null;})()}
                {(()=>{var moodTags={reset:[{icon:"🔄",txt:"Reset"},{icon:"🥗",txt:"Ligero"}],comfort:[{icon:"🍲",txt:"Confort"},{icon:"🌡️",txt:"Caliente"}],rapido:[{icon:"⚡",txt:"Rápido"},{icon:"⏱️",txt:"<15 min"}],fresco:[{icon:"🥗",txt:"Fresco"},{icon:"💧",txt:"Hidratante"}],fibra:[{icon:"🫘",txt:"Alta fibra"},{icon:"💪",txt:"Saciante"}],fuerza:[{icon:"💪",txt:"Fuerza"},{icon:"🥩",txt:"Alta proteína"}],ligero:[{icon:"🌿",txt:"Ligero"},{icon:"🫶",txt:"Fácil digestión"}],omega:[{icon:"🐟",txt:"Omega-3"},{icon:"🧠",txt:"Antiinflamatorio"}],hidratos:[{icon:"🍝",txt:"Carbohidratos"},{icon:"⚡",txt:"Energía"}],aminoacidos:[{icon:"🥩",txt:"Recuperación"},{icon:"💪",txt:"Alta proteína"}],carga:[{icon:"⚡",txt:"Carga energética"},{icon:"🍝",txt:"Hidratos clave"}],recarga:[{icon:"🎉",txt:"Recarga"},{icon:"🔋",txt:"Repone glucógeno"}],descanso:[{icon:"😌",txt:"Descanso"},{icon:"🌙",txt:"Digestivo"}],familiar:[{icon:"🏠",txt:"Familiar"},{icon:"🍽️",txt:"Plato conocido"}],reconfortante:[{icon:"🍵",txt:"Reconfortante"},{icon:"🫂",txt:"Confort food"}]};var mood=day.effectiveMood;var tags=moodTags[mood];if(!tags||isFreeDay)return null;return(<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{tags.map(function(t,ti){return(<span key={ti} style={{fontSize:11,background:"rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.9)",padding:"2px 6px",borderRadius:99,fontWeight:500}}>{t.icon} {t.txt}</span>);})}</div>);})()}
                {!isFreeDay&&(()=>{
                  // FASE 3 — pill siempre visible, sin condicionar a globalEnabled
                  var _gShakeOn=!!(profile&&profile.extras&&profile.extras.proteinShake&&profile.extras.proteinShake.enabled);
                  var _dayOverride=day.shakeEnabled;
                  var _effectiveShake=
                    (_gShakeOn && _dayOverride !== false) ||
                    (!_gShakeOn && _dayOverride === true);
                  return(
                    <div style={{marginTop:10}}>
                      <button onClick={()=>regenerateDayPortions(activeDay)} style={{background:_effectiveShake?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.08)",border:"1px solid "+(_effectiveShake?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.18)"),borderRadius:99,padding:"5px 12px",cursor:"pointer",fontFamily:sans,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:14}}>{_effectiveShake?"🥤":"🥗"}</span>
                        <span style={{fontSize:12,fontWeight:700,color:THEME.bgWhite}}>{_effectiveShake?"Batido del día: ON":"Batido del día: OFF"}</span>
                      </button>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginTop:4}}>{_effectiveShake?"Toca para quitar el batido de este día.":"Toca para volver a activar el batido."}</div>
                    </div>
                  );
                })()}
              </div>

              {day.meals.map((meal,i)=>{
                const isOpen=openMeal&&openMeal.dayIdx===activeDay&&openMeal.mealIdx===i;
                const accent=accentFor(meal);
                const alts=getDefaultAlts(meal);
                const shopping=meal.shopping||[];
                const recipe=meal.recipe||[];
                const isMainMeal = meal.time==="Comida" || meal.time==="☀️ Comida";
                return (
                  <div key={i} style={{borderBottom:i<day.meals.length-1?"1px solid #f1f5f9":"none",background:isMainMeal?"#fafafa":THEME.bgWhite}}>
                    <div onClick={()=>{setOpenMeal(isOpen?null:{dayIdx:activeDay,mealIdx:i});setMealTab("compra");}} style={{padding:isMainMeal?"16px 18px":"13px 18px",cursor:"pointer",userSelect:"none",transition:"background 0.15s"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:isMainMeal?5:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontWeight:700,fontSize:isMainMeal?14:13,color:accent}}>{meal.emoji} {meal.time}</span>
                          {isMainMeal&&<span style={{fontSize:9,background:accent+"18",color:accent,padding:"2px 6px",borderRadius:99,fontWeight:700,letterSpacing:"0.04em"}}>PRINCIPAL</span>}
                        </div>
                        <span style={{fontSize:14,color:"#cbd5e1",flexShrink:0,transition:"transform 0.2s",display:"inline-block",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
                      </div>
                      {meal.title&&<div style={{fontSize:14,color:"#94a3b8",fontStyle:"italic",marginBottom:isMainMeal?7:5,paddingLeft:2}}>{meal.title}</div>}
                      <div style={{paddingLeft:2}}>
                        <div style={{fontSize:16,color:THEME.textDark,fontWeight:isMainMeal?700:600,lineHeight:1.6,borderLeft:"3px solid "+accent,paddingLeft:10,marginBottom:isMainMeal?6:4}}>{meal.p1}</div>
                        <div style={{fontSize:13,color:THEME.textMuted4,lineHeight:1.5,paddingLeft:13,fontWeight:400}}>{meal.p2}</div>
                        {meal.metadata&&meal.metadata.glutenFreeAdapted===true&&(<div style={{fontSize:11,color:"#7c5c00",background:"#fef9c3",borderRadius:6,padding:"3px 9px",marginTop:5,marginLeft:13,display:"inline-block",fontWeight:600}}>🌾✗ Usar alternativa sin gluten</div>)}
                      </div>
                    </div>

                    {isOpen&&(
                      <div style={{borderTop:"1px solid "+gc.border,background:THEME.bgLightAlt,animation:"expandIn 0.22s cubic-bezier(0.4,0,0.2,1)"}}>
                        <div style={{display:"flex",borderBottom:"1px solid "+gc.border}}>
                          {[{k:"compra",l:"🛒 Compra"},{k:"receta",l:"👨‍🍳 Receta"},{k:"alternativas",l:"🔄 Alternativas"}].map(t=>(
                            <button key={t.k} onClick={e=>{e.stopPropagation();setMealTab(t.k);}} style={{flex:1,padding:"9px 4px",border:"none",cursor:"pointer",fontSize:11,fontFamily:sans,fontWeight:mealTab===t.k?700:400,background:mealTab===t.k?gc.light:"transparent",color:mealTab===t.k?gc.primary:THEME.textMuted2,borderBottom:mealTab===t.k?"2px solid "+gc.primary:"2px solid transparent"}}>{t.l}</button>
                          ))}
                        </div>
                        <div style={{padding:"14px 18px"}} onClick={e=>e.stopPropagation()}>
                          {mealTab==="compra"&&(<div><p style={{fontSize:11,color:THEME.textMuted3,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Lista de la compra</p>{shopping.length>0?(<div style={{display:"flex",flexDirection:"column",gap:5}}>{shopping.map((item,k)=>(<div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:THEME.bgWhite,borderRadius:8,border:"1px solid "+gc.border,fontSize:13}}><span style={{color:THEME.textDark,fontWeight:500}}>{item}</span></div>))}</div>):(<p style={{color:THEME.textMuted3,fontSize:13,fontStyle:"italic"}}>Comida libre — elige según tu preferencia.</p>)}</div>)}
                          {mealTab==="receta"&&(<div><p style={{fontSize:11,color:THEME.textMuted3,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{meal.title||"Receta"}</p>{recipe.length>0?(<div style={{display:"flex",flexDirection:"column",gap:8}}>{recipe.map((step,k)=>(<div key={k} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",background:THEME.bgWhite,borderRadius:8,border:"1px solid "+gc.border}}><span style={{background:gc.primary,color:THEME.bgWhite,borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{k+1}</span><span style={{fontSize:13,color:THEME.textDark2,lineHeight:1.65}}>{step}</span></div>))}</div>):(<p style={{color:THEME.textMuted3,fontSize:13,fontStyle:"italic"}}>Comida libre — sin receta fija.</p>)}</div>)}
                          {mealTab==="alternativas"&&(
                            <div>
                              <p style={{fontSize:11,color:THEME.textMuted3,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>🔄 Cambiar este plato por...</p>
                              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                                {SEMANTIC_OPTIONS.map(function(opt){return(
                                  <button key={opt.key} onClick={()=>{regenerateMeal(activeDay,meal.time,opt.key);setOpenMeal(null);}} style={{fontSize:13,color:THEME.textDark,padding:"10px 13px",borderRadius:9,background:gc.light,border:"1px solid "+gc.border,textAlign:"left",cursor:"pointer",fontFamily:sans,display:"flex",gap:9,alignItems:"center",fontWeight:500}}>
                                    <span style={{fontSize:16}}>{opt.emoji}</span>
                                    <div><div style={{fontWeight:600,fontSize:13}}>{opt.label}</div><div style={{fontSize:11,color:THEME.textMuted2,marginTop:1}}>{opt.key==="comfort"&&"Guiso, sopa o plato caliente"}{opt.key==="ligero"&&"Ensalada, bowl o plancha sin salsa"}{opt.key==="rapido"&&"Listo en menos de 10 minutos"}{opt.key==="diferente"&&"El sistema elige algo distinto"}</div></div>
                                  </button>
                                );})}
                              </div>
                              {alts.length>0&&(<div><p style={{fontSize:11,color:THEME.textMuted3,margin:"8px 0 6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>O cambia un ingrediente:</p><div style={{display:"flex",flexDirection:"column",gap:5}}>{alts.map((a,k)=>(<button key={k} onClick={()=>swapMeal(activeDay,i,k)} style={{fontSize:12,color:"#475569",padding:"7px 11px",borderRadius:7,background:THEME.bgLightAlt,border:"1px solid #e2e8f0",textAlign:"left",cursor:"pointer",fontFamily:sans,display:"flex",gap:7,alignItems:"flex-start"}}><span style={{color:gc.primary,flexShrink:0}}>↻</span>{a}</button>))}</div></div>)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {(()=>{
                // FASE 1: ShakeCard — visible únicamente cuando effectiveShake === true
                var _sk=profile&&profile.extras&&profile.extras.proteinShake;
                var _globalEnabled=!!(_sk&&_sk.enabled);
                var _dayOverride=day.shakeEnabled;
                var _effectiveShake=
                  (_globalEnabled && _dayOverride !== false) ||
                  (!_globalEnabled && _dayOverride === true);
                if(!_effectiveShake||!_sk) return null;
                var _sc=_sk.scoops||1;
                var _kc=_sc*(_sk.kcalPerScoop||120);
                var _pr=_sc*(_sk.proteinPerScoop||24);
                var _tMap={manana:"Por la mañana",post_entreno:"Post-entreno",noche:"Por la noche"};
                var _tlbl=_tMap[_sk.timing||"post_entreno"]||"Post-entreno";
                return(
                  <div style={{borderTop:"1px solid #e0f2fe",background:"#f0f9ff",padding:"13px 18px",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20}}>🥤</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#0369a1"}}>Batido del día · {_sc===2?"2 scoops":"1 scoop"} de proteína</div>
                      <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{_kc} kcal · {_pr}g proteína · {_tlbl}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Nav arrows */}
            <div style={{display:"flex",gap:7,marginTop:12,marginBottom:4,justifyContent:"center"}}>
              <button onClick={()=>{if(activeDay>0){setActiveDay(d=>d-1);setOpenMeal(null);}}} style={{padding:"7px 16px",borderRadius:99,border:"1px solid "+gc.border,background:activeDay===0?THEME.bgLightMuted:gc.light,color:activeDay===0?THEME.textMuted3:gc.primary,fontSize:12,cursor:activeDay===0?"default":"pointer",fontFamily:sans}}>← Anterior</button>
              <button onClick={()=>{if(activeDay<plan.days.length-1){setActiveDay(d=>d+1);setOpenMeal(null);}}} style={{padding:"7px 16px",borderRadius:99,border:"1px solid "+gc.border,background:activeDay>=plan.days.length-1?THEME.bgLightMuted:gc.light,color:activeDay>=plan.days.length-1?THEME.textMuted3:gc.primary,fontSize:12,cursor:activeDay>=plan.days.length-1?"default":"pointer",fontFamily:sans}}>Siguiente →</button>
            </div>

            {/* Extras */}
            {(()=>{
              const dName=day.name;const dExtras=dayExtras(dName);const dExtraKcal=dayExtraKcal(dName);const remaining=targetKcal-dExtraKcal;const pct=Math.min(100,Math.round(dExtraKcal/targetKcal*100));
              return(
                <div style={{
  background:THEME.bgWhite, borderRadius:14, border:"1px solid #e2e8f0",
  marginTop:12, boxShadow:"0 1px 8px rgba(0,0,0,0.05)",
  /* BUG FIX 2B: overflow:visible so the suggestions dropdown (position:absolute,
     bottom:100%) is not clipped. border-radius works without overflow:hidden. */
  overflow:"visible", position:"relative",
}}>
                  <button onClick={()=>setExtraOpen(o=>o===dName?null:dName)} style={{width:"100%",padding:"12px 16px",background:"transparent",border:"none",cursor:"pointer",fontFamily:sans,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>🍫</span><div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:700,color:THEME.textDark}}>Extras del día</div><div style={{fontSize:11,color:dExtraKcal>0?THEME.colorErrorDark:THEME.textMuted3}}>{dExtraKcal>0?`+${dExtraKcal} kcal añadidas — quedan ${remaining} kcal del objetivo`:"Añade lo que hayas comido de más"}</div></div></div>
                    <span style={{color:THEME.textMuted3,fontSize:13}}>{extraOpen===dName?"▲":"▼"}</span>
                  </button>
                  {dExtraKcal>0&&(<div style={{padding:"0 16px 10px"}}><div style={{background:THEME.bgLightMuted,borderRadius:99,height:6,overflow:"hidden"}}><div style={{height:"100%",borderRadius:99,background:pct>80?THEME.colorErrorDark:pct>50?THEME.colorWarningAlt:THEME.colorSuccess,width:pct+"%",transition:"width 0.4s ease"}}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:THEME.textMuted3,marginTop:3}}><span>{dExtraKcal} kcal extra ({pct}% del objetivo diario)</span><span>Objetivo: {targetKcal} kcal</span></div></div>)}
                  {extraOpen===dName&&(
                    <div style={{
                      borderTop:"1px solid #f1f5f9", padding:"12px 16px",
                      borderBottomLeftRadius:14, borderBottomRightRadius:14,
                      /* Clip this panel's rounded bottom corners without
                         clipping the suggestions dropdown above it */
                      overflow:"visible", position:"relative",
                    }}>
                      {dExtras.length>0&&(<div style={{
  marginBottom:12, display:"flex", flexDirection:"column", gap:6,
  /* BUG FIX 2B: scroll when many extras accumulate */
  maxHeight:180, overflowY:"auto",
  paddingRight:2, /* hairline so scrollbar doesn't overlap delete button */
}}>{dExtras.map((ex,k)=>(<div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:THEME.bgErrorLight,borderRadius:8,padding:"6px 10px",border:"1px solid #fecaca"}}><div><span style={{fontSize:12,color:THEME.textDark,fontWeight:600}}>{ex.name}</span><span style={{fontSize:11,color:THEME.colorErrorDark,marginLeft:8}}>+{ex.kcal} kcal</span></div><button onClick={()=>removeExtra(dName,k)} style={{background:"none",border:"none",cursor:"pointer",color:THEME.colorErrorDark,fontSize:16,lineHeight:1,padding:"0 2px"}}>×</button></div>))}</div>)}
                      <div style={{fontSize:11,color:THEME.textMuted2,marginBottom:8,fontWeight:600}}>Añadir alimento extra:</div>
                      <div style={{position:"relative",marginBottom:6}}>
                        <input
  value={extraInput.name}
  onChange={e=>{const v=e.target.value;setExtraInput(p=>({...p,name:v}));setSelectedFood(null);setSuggestions(searchFoods(v));}}
  placeholder="Escribe el alimento: palmera, cerveza..."
  style={{
    width:"100%", boxSizing:"border-box", padding:"9px 12px",
    borderRadius:8, fontFamily:sans, fontSize:12, outline:"none",
    border:"1px solid "+(selectedFood?THEME.colorSuccess:"#e2e8f0"),
    background:selectedFood?THEME.bgSuccessLight:THEME.bgWhite,
    color:THEME.textDark,      /* BUG FIX 2A: explicit color prevents inheriting dark-theme #cdd9e5 */
  }}
/>
                        {selectedFood&&(<span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:14}}>✅</span>)}
                        {suggestions.length>0&&!selectedFood&&(<div style={{position:"absolute",bottom:"100%",left:0,right:0,background:THEME.bgWhite,border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 -4px 16px rgba(0,0,0,0.12)",zIndex:50,overflow:"hidden",marginBottom:4}}>{suggestions.map((food,k)=>(<button key={k} onClick={()=>{setSelectedFood(food);setExtraInput({name:food.name,grams:String(food.defaultG)});setSuggestions([]);}} style={{width:"100%",padding:"9px 12px",border:"none",borderBottom:k<suggestions.length-1?"1px solid #f1f5f9":"none",background:"transparent",textAlign:"left",cursor:"pointer",fontFamily:sans,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,color:THEME.textDark,fontWeight:500}}>{food.name}</span><span style={{fontSize:11,color:THEME.textMuted2}}>{food.kcal100} kcal/100g</span></button>))}</div>)}
                      </div>
                      {selectedFood&&(<div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}><div style={{flex:1,background:THEME.bgLightAlt,borderRadius:8,padding:"8px 12px",border:"1px solid #e2e8f0"}}><div style={{fontSize:10,color:THEME.textMuted2,marginBottom:2}}>Cantidad (g)</div><input type="number" value={extraInput.grams} onChange={e=>setExtraInput(p=>({...p,grams:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addExtra(dName)} style={{width:"100%",border:"none",background:"transparent",fontFamily:sans,fontSize:16,fontWeight:700,color:THEME.textDark,outline:"none"}}/></div><div style={{fontSize:20,color:THEME.textMuted3}}>=</div><div style={{background:gc.light,borderRadius:8,padding:"8px 12px",border:"1px solid "+gc.border,textAlign:"center",minWidth:80}}><div style={{fontSize:10,color:gc.primary,marginBottom:2}}>Calorías</div><div style={{fontSize:16,fontWeight:700,color:gc.primary}}>{calcFoodKcal(selectedFood,parseFloat(extraInput.grams)||selectedFood.defaultG)}</div></div><button onClick={()=>addExtra(dName)} style={{padding:"8px 14px",borderRadius:8,background:gc.primary,color:THEME.bgWhite,border:"none",cursor:"pointer",fontFamily:sans,fontSize:13,fontWeight:700,flexShrink:0,alignSelf:"stretch"}}>+ Añadir</button></div>)}
                      {dExtraKcal>0&&(<div style={{background:"#fefce8",borderRadius:8,padding:"8px 12px",border:"1px solid #fde68a"}}><div style={{fontSize:11,color:"#92400e",fontWeight:600,marginBottom:3}}>💡 Ajuste sugerido</div><div style={{fontSize:11,color:"#78350f",lineHeight:1.5}}>{dExtraKcal<=150?"Extra pequeño. No hace falta ajustar nada — compensarás solo con la actividad diaria.":dExtraKcal<=400?`Reduce la cena de hoy en ~${Math.round(dExtraKcal*0.5)}–${dExtraKcal} kcal: menos hidrato o proteína más magra.`:"Exceso considerable. Reduce hidratos en comida y cena, y añade 15–20 min de caminata extra."}</div></div>)}
                    </div>
                  )}
                </div>
              );
            })()}
          {/* AD: end of weekly plan — user has seen full content */}
          <AdBanner
            slot={AD_SLOTS.planFooter}
            format="auto"
            style={{ marginTop:16, marginBottom:4 }}
          />
          </div>
        )}

        {activeTab==="progreso"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12,animation:"fi 0.3s ease"}}>
            {(()=>{var weeks=progress.weeks||[];var trend=computeTrend(weeks);var lastW=weeks[weeks.length-1];var isCutting=(profile.goal==="fatLoss"||profile.goal==="mildFatLoss"||profile.goal==="fatLossGeneral");var hasPeso=weeks.some(function(w){return w.peso;});return(
              <div>
                <div style={{background:THEME.bgWhite,borderRadius:14,padding:18,border:"1px solid #e2e8f0",marginBottom:12}}>
                  <div style={{fontFamily:serif,fontSize:14,color:THEME.textDark,marginBottom:14}}>Resumen de progreso</div>
                  {weeks.length===0?(
                    <div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:32,marginBottom:8}}>📊</div><div style={{fontSize:13,color:THEME.textMuted2,lineHeight:1.6}}>Aquí verás tu evolución.<br/>Haz tu primer check-in semanal para empezar a registrar.</div><button onClick={()=>setShowCheckin(true)} style={{marginTop:14,padding:"10px 20px",borderRadius:10,border:"none",background:THEME.gradPurple,color:THEME.bgWhite,fontFamily:sans,fontSize:13,fontWeight:700,cursor:"pointer"}}>📋 Hacer check-in ahora</button></div>
                  ):(
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
                        {hasPeso&&trend&&(<div style={{background:isCutting?(trend.diff<=0?THEME.bgSuccessLight:THEME.bgErrorLight):(trend.diff>=0?THEME.bgSuccessLight:THEME.bgErrorLight),borderRadius:10,padding:"12px 10px",textAlign:"center",border:"1px solid "+(isCutting?(trend.diff<=0?THEME.colorSuccessLight:"#fca5a5"):(trend.diff>=0?THEME.colorSuccessLight:"#fca5a5"))}}><div style={{fontSize:9,color:THEME.textMuted2,marginBottom:3,letterSpacing:"0.05em",textTransform:"uppercase"}}>Tendencia</div><div style={{fontSize:20,fontWeight:700,fontFamily:serif,color:isCutting?(trend.diff<=0?THEME.colorSuccessDark:THEME.colorErrorDark):(trend.diff>=0?THEME.colorSuccessDark:THEME.colorErrorDark)}}>{trend.diff>0?"+":""}{trend.diff} kg</div><div style={{fontSize:9,color:THEME.textMuted3,marginTop:2}}>desde inicio</div></div>)}
                        {lastW&&(<div style={{background:THEME.bgLightAlt,borderRadius:10,padding:"12px 10px",textAlign:"center",border:"1px solid #e2e8f0"}}><div style={{fontSize:9,color:THEME.textMuted2,marginBottom:3,letterSpacing:"0.05em",textTransform:"uppercase"}}>Adherencia</div><div style={{fontSize:20,fontWeight:700,fontFamily:serif,color:lastW.adherencia>=4?THEME.colorSuccessDark:lastW.adherencia>=3?THEME.colorWarningDark:THEME.colorErrorDark}}>{adherenciaPct(lastW.adherencia)}%</div><div style={{fontSize:9,color:THEME.textMuted3,marginTop:2}}>última semana</div></div>)}
                        {lastW&&(<div style={{background:THEME.bgLightAlt,borderRadius:10,padding:"12px 10px",textAlign:"center",border:"1px solid #e2e8f0"}}><div style={{fontSize:9,color:THEME.textMuted2,marginBottom:3,letterSpacing:"0.05em",textTransform:"uppercase"}}>Energía</div><div style={{fontSize:20,fontWeight:700,fontFamily:serif,color:lastW.energia>=4?THEME.colorSuccessDark:lastW.energia>=3?THEME.colorWarningDark:THEME.colorErrorDark}}>{lastW.energia}/5</div><div style={{fontSize:9,color:THEME.textMuted3,marginTop:2}}>última semana</div></div>)}
                      </div>
                      {weeks.length>1&&(<div style={{marginBottom:14}}><div style={{fontSize:11,color:THEME.textMuted2,fontWeight:600,marginBottom:8}}>Adherencia por semana</div><div style={{display:"flex",gap:4,alignItems:"flex-end",height:48}}>{weeks.slice(-8).map(function(w,i){var pct=adherenciaPct(w.adherencia);var col=w.adherencia>=4?THEME.colorSuccess:w.adherencia>=3?THEME.colorWarning:THEME.colorError;return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{width:"100%",background:col,borderRadius:4,height:Math.round(pct*0.44)+"px",transition:"height 0.4s ease"}}/><div style={{fontSize:8,color:THEME.textMuted3}}>{pct}%</div></div>);})}</div></div>)}
                      <div style={{fontSize:11,color:THEME.textMuted3,marginTop:4}}>{weeks.length} semana{weeks.length!==1?"s":""} de seguimiento · <span style={{color:gc.primary,fontWeight:600}}>Semana {weekNum||getWeekNumber()}</span></div>
                    </div>
                  )}
                </div>
                {weeks.length>0&&(<button onClick={()=>setShowCheckin(true)} style={{width:"100%",padding:"13px",borderRadius:10,border:"none",background:THEME.gradPurple,color:THEME.bgWhite,fontFamily:sans,fontSize:13,fontWeight:700,cursor:"pointer"}}>📋 Check-in semanal →</button>)}
              </div>
            );})()}
          {/* AD: below progress summary — visible after check-in CTA */}
          <AdBanner
            slot={AD_SLOTS.progressFooter}
            format="auto"
            style={{ marginTop:16, marginBottom:4 }}
          />
          </div>
        )}

        {activeTab==="numeros"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12,animation:"fi 0.3s ease"}}>
            <div style={{background:THEME.bgWhite,borderRadius:14,padding:18,border:"1px solid #e2e8f0"}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}><span style={{fontSize:28}}>{goalObj.icon}</span><div><div style={{fontFamily:serif,fontSize:15,color:gc.primary}}>{GOAL_LABELS[profile.goal]}</div><div style={{fontSize:11,color:THEME.textMuted2}}>{profile.gender==="female"?"Mujer":"Hombre"} · {profile.age}a · {profile.weight}kg · {profile.height}cm</div></div></div>
              {[["🔥 TDEE estimado","~"+tdee+" kcal/día"],["🎯 Objetivo calórico",targetKcal+" kcal/día"],["📉 Déficit / Superávit",(GOAL_ADJ[profile.goal]>0?"+":"")+GOAL_ADJ[profile.goal]+" kcal"],["📆 Cambio esperado","~"+Math.abs((GOAL_ADJ[profile.goal]||0)/7700*7).toFixed(2)+" kg/semana"]].map(([k,v],i)=>(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<3?"1px solid "+gc.light:"none",fontSize:12}}><span style={{color:THEME.textDark2}}>{k}</span><span style={{fontWeight:700,color:gc.primary}}>{v}</span></div>))}
            </div>
            <div style={{background:THEME.bgWhite,borderRadius:14,padding:18,border:"1px solid #e2e8f0"}}>
              <div style={{fontFamily:serif,fontSize:13,color:THEME.textDark2,marginBottom:12}}>Macronutrientes diarios</div>
              {[{lbl:"Proteína",val:macros.protein,pct:Math.round(macros.protein*4/targetKcal*100),col:"#737520",note:(macros.proteinFactor||2.0)+"g/kg"},{lbl:"Hidratos",val:macros.carbs,pct:Math.round(macros.carbs*4/targetKcal*100),col:THEME.colorWarning,note:"Arroz, patata, pasta, pan, avena"},{lbl:"Grasa",val:macros.fat,pct:Math.round(macros.fat*9/targetKcal*100),col:THEME.colorPurpleLight,note:"Min "+(Math.round(profile.weight*0.8))+"g"}].map(m=>(<div key={m.lbl} style={{marginBottom:13}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13}}><span style={{fontWeight:700}}>{m.lbl}</span><span style={{color:m.col,fontWeight:700}}>{m.val}g · {m.pct}%</span></div><div style={{background:THEME.bgLightMuted,borderRadius:99,height:7}}><div style={{height:"100%",borderRadius:99,background:m.col,width:m.pct+"%",transition:"width 0.6s ease"}}/></div><p style={{fontSize:10,color:THEME.textMuted3,margin:"3px 0 0",fontStyle:"italic"}}>{m.note}</p></div>))}
            </div>
            {(()=>{
              // FASE 1: ShakeCard sidebar — solo cuando effectiveShake === true
              var _f5sk=profile.extras&&profile.extras.proteinShake;
              var _f5global=!!(_f5sk&&_f5sk.enabled);
              var _f5override=day.shakeEnabled;
              var _f5effectiveShake=
                (_f5global && _f5override !== false) ||
                (!_f5global && _f5override === true);
              if(!_f5effectiveShake||!_f5sk) return null;
              var _sc2=_f5sk.scoops||1;
              return(
                <div style={{background:"#f0f9ff",borderRadius:14,padding:16,border:"1px solid #e0f2fe"}}>
                  <div style={{fontFamily:serif,fontSize:13,color:"#0369a1",marginBottom:8}}>
                    🥤 Batido del día · {day.name}
                  </div>
                  <div style={{fontSize:12,color:THEME.textDark2,lineHeight:1.55,marginBottom:8}}>
                    <span style={{fontWeight:600}}>{_sc2===2?"2 scoops":"1 scoop"} de proteína</span>{" "}
                    forma parte de tus {targetKcal} kcal diarias.
                  </div>
                  <div style={{display:"flex",gap:12}}>
                    <div style={{flex:1,background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                      <div style={{fontSize:18,fontWeight:700,color:"#0369a1"}}>{_sc2*(_f5sk.kcalPerScoop||120)}</div>
                      <div style={{fontSize:10,color:THEME.textMuted2,marginTop:1}}>kcal</div>
                    </div>
                    <div style={{flex:1,background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                      <div style={{fontSize:18,fontWeight:700,color:"#0369a1"}}>{_sc2*(_f5sk.proteinPerScoop||24)}g</div>
                      <div style={{fontSize:10,color:THEME.textMuted2,marginTop:1}}>proteína</div>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div style={{background:THEME.bgWhite,borderRadius:14,padding:16,border:"1px solid #e2e8f0"}}>
              <div style={{fontFamily:serif,fontSize:13,color:THEME.textDark2,marginBottom:12}}>Acciones</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <button onClick={()=>setShowCheckin(true)} style={{padding:"11px",borderRadius:10,border:"none",background:THEME.gradPurple,color:THEME.bgWhite,fontFamily:sans,fontSize:13,fontWeight:700,cursor:"pointer",textAlign:"left",paddingLeft:14}}>📋 Check-in semanal {isNutriPlan?"(notifica a tu nutricionista)":""}</button>
                {!isNutriPlan&&<button onClick={handleRegenerate} style={{padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,"+gc.primary+","+gc.primary+"bb)",color:THEME.bgWhite,fontFamily:sans,fontSize:13,fontWeight:700,cursor:"pointer",textAlign:"left",paddingLeft:14}}>🔄 Regenerar plan semanal</button>}
                <button onClick={handleEditProfile} style={{padding:"11px",borderRadius:10,border:"1px solid #e2e8f0",background:THEME.bgLightAlt,color:THEME.textDark2,fontFamily:sans,fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"left",paddingLeft:14}}>✏️ Cambiar mi perfil</button>
                <button onClick={handleReset} style={{padding:"11px",borderRadius:10,border:"1px solid #fecaca",background:THEME.bgErrorLight,color:THEME.colorErrorDark,fontFamily:sans,fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"left",paddingLeft:14}}>🗑️ Empezar de cero</button>
                <button onClick={onLogout} style={{padding:"11px",borderRadius:10,border:"1px solid #e2e8f0",background:THEME.bgLightAlt,color:THEME.textMuted,fontFamily:sans,fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"left",paddingLeft:14}}>← Cerrar sesión</button>
              </div>
            </div>
          {/* AD: macros/numbers tab footer — after data cards */}
          <AdBanner
            slot={AD_SLOTS.numerosFooter}
            format="auto"
            style={{ marginTop:16, marginBottom:4 }}
          />
          </div>
        )}

        {activeTab==="admin"&&isAdmin&&(
          <div style={{animation:"fi 0.3s ease"}}>
            <div style={{fontFamily:SERIF_EMOJI,fontSize:16,color:THEME.textDark2,marginBottom:14}}>⚙️ Panel de administración</div>
            <AdminPanel currentUser={currentUser}/>
          </div>
        )}
      </div>

      {/* CHECK-IN MODAL */}
      {showCheckin&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:50,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowCheckin(false)}>
          <div style={{background:THEME.bgCard2,borderRadius:"18px 18px 0 0",padding:"20px 18px 32px",width:"100%",maxWidth:520,animation:"fi 0.25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:serif,fontSize:18,color:THEME.bgLightAlt,marginBottom:4}}>📋 Check-in semanal</div>
            {isNutriPlan
              ? <div style={{fontSize:12,color:THEME.colorPurpleLight,marginBottom:16,padding:"8px 12px",background:THEME.purpleBg18,borderRadius:8}}>🔒 Tu plan es de tu nutricionista — los datos se guardarán para que los revise. El plan no se modificará automáticamente.</div>
              : <div style={{fontSize:12,color:THEME.textMuted,marginBottom:20}}>Dinos cómo te fue — ajustamos el plan automáticamente.</div>
            }
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:THEME.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Peso actual (opcional)</div>
              <input type="number" step="0.1" value={checkin.pesoActual||""} onChange={e=>setCheckin(c=>Object.assign({},c,{pesoActual:e.target.value}))} placeholder={"Ej: "+profile.weight+" kg"} style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:8,border:"1.5px solid #30363d",background:THEME.bgPage,color:THEME.textPrimary,fontFamily:sans,fontSize:15,fontWeight:700,outline:"none"}}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:THEME.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>¿Cómo evolucionó tu peso?</div>
              <div style={{display:"flex",gap:6}}>{[{k:"baja",lbl:"📉 Bajó"},{k:"sinCambio",lbl:"➡️ Igual"},{k:"sube",lbl:"📈 Subió"}].map(o=>{var sel=checkin.pesoTrend===o.k;return<button key={o.k} onClick={()=>setCheckin(c=>Object.assign({},c,{pesoTrend:o.k}))} style={{flex:1,padding:"9px 6px",borderRadius:8,border:"1.5px solid "+(sel?THEME.accent:THEME.borderDark),background:sel?"#e8a04520":THEME.bgPage,color:sel?THEME.accent:THEME.textMuted,fontFamily:sans,fontSize:12,fontWeight:sel?700:400,cursor:"pointer"}}>{o.lbl}</button>;})}</div>
            </div>
            {[{k:"hambre",lbl:"Nivel de hambre (1=sin hambre, 5=mucha)",col:THEME.accent},{k:"energia",lbl:"Nivel de energía (1=agotado, 5=excelente)",col:THEME.colorPurple},{k:"adherencia",lbl:"¿Cuánto seguiste el plan? (1=poco, 5=perfecto)",col:THEME.colorSuccessDark}].map(({k,lbl,col})=>(
              <div key={k} style={{marginBottom:16}}>
                <div style={{fontSize:11,color:THEME.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{lbl}</div>
                <div style={{display:"flex",gap:5}}>{[1,2,3,4,5].map(n=>{var sel=checkin[k]===n;return<button key={n} onClick={()=>setCheckin(c=>Object.assign({},c,{[k]:n}))} style={{flex:1,padding:"10px 0",borderRadius:8,border:"1.5px solid "+(sel?col:THEME.borderDark),background:sel?col+"20":THEME.bgPage,color:sel?col:THEME.textMuted,fontFamily:sans,fontSize:15,fontWeight:700,cursor:"pointer"}}>{n}</button>;})}
                </div>
              </div>
            ))}
            {!isNutriPlan&&(()=>{var adj=computeCheckinAdjustment(checkin,profile.goal);if(!adj.reasons.length) return <div style={{fontSize:12,color:THEME.textMuted,marginBottom:16,padding:"10px 12px",background:THEME.bgPage,borderRadius:8}}>✅ Todo va bien — sin cambios necesarios esta semana.</div>;return(<div style={{marginBottom:16,padding:"10px 12px",background:"#e8a04512",border:"1px solid #e8a04530",borderRadius:8}}><div style={{fontSize:11,color:THEME.accent,fontWeight:700,marginBottom:5}}>Ajustes que aplicaremos:</div>{adj.reasons.map((r,i)=><div key={i} style={{fontSize:12,color:THEME.textPrimary,padding:"2px 0"}}>• {r}</div>)}<div style={{fontSize:11,color:THEME.textMuted,marginTop:6}}>Ajuste acumulado: {(profile.kcalAdjust||0)+adj.delta>0?"+":" "}{(profile.kcalAdjust||0)+adj.delta} kcal</div></div>);})()}
            <button onClick={handleCheckinSubmit} style={{width:"100%",padding:"13px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7c3aed,#e8a045)",color:THEME.bgWhite,fontFamily:sans,fontSize:14,fontWeight:700,cursor:"pointer"}}>
              {isNutriPlan ? "Guardar check-in →" : "Aplicar y regenerar plan →"}
            </button>
          </div>
        </div>
      )}

      {/* ── MI PERFIL MODAL ──────────────────────────────────────────── */}
      {showProfile&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:60,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>{ if(confirmDelete) return; setShowProfile(false); }}>
          <div style={{background:THEME.bgCard2,borderRadius:"18px 18px 0 0",padding:"22px 20px 36px",width:"100%",maxWidth:520,animation:"fi 0.25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:serif,fontSize:19,color:THEME.bgLightAlt,marginBottom:16}}>👤 Mi perfil</div>

            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
              <div style={{background:THEME.bgPage,borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:THEME.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Email</div>
                <div style={{fontSize:14,color:THEME.textPrimary}}>{currentUser.email}</div>
              </div>
              <div style={{background:THEME.bgPage,borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:THEME.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>ID de usuario</div>
                <div style={{fontSize:12,color:THEME.textMuted,fontFamily:"monospace",wordBreak:"break-all"}}>{currentUser.id}</div>
              </div>
              <div style={{background:THEME.bgPage,borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:THEME.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Rol</div>
                <div style={{fontSize:14,color:THEME.textPrimary}}>{currentUser.role || "usuario"}</div>
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={handleReset} style={{width:"100%",padding:"11px",borderRadius:9,border:"1px solid "+THEME.borderDark,background:"transparent",color:THEME.textMuted,fontFamily:sans,fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"left",paddingLeft:14}}>
                🗑️ Empezar de cero
              </button>
              {!confirmDelete&&(
                <button onClick={()=>setConfirmDelete(true)} style={{width:"100%",padding:"11px",borderRadius:9,border:"1px solid #fca5a5",background:"#7f1d1d18",color:"#fca5a5",fontFamily:sans,fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"left",paddingLeft:14}}>
                  ⚠️ Eliminar mi cuenta
                </button>
              )}
              {confirmDelete&&(
                <div style={{background:"#7f1d1d22",border:"1px solid #fca5a5",borderRadius:10,padding:"14px"}}>
                  <div style={{fontSize:13,color:THEME.textPrimary,marginBottom:10,lineHeight:1.5}}>
                    ¿Estás seguro? Esta acción es irreversible.<br/>
                    Tu cuenta y todos tus datos serán eliminados permanentemente.
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setConfirmDelete(false)} disabled={deleting} style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid "+THEME.borderDark,background:"transparent",color:THEME.textMuted,fontFamily:sans,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                      Cancelar
                    </button>
                    <button onClick={handleDeleteAccount} disabled={deleting} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:deleting?"#4b0b0b":"#dc2626",color:"#fff",fontFamily:sans,fontSize:13,fontWeight:700,cursor:deleting?"not-allowed":"pointer"}}>
                      {deleting ? "Eliminando cuenta…" : "Eliminar mi cuenta"}
                    </button>
                  </div>
                </div>
              )}
              <button onClick={()=>{ setShowProfile(false); setConfirmDelete(false); }} style={{width:"100%",padding:"11px",borderRadius:9,border:"none",background:"transparent",color:THEME.textMuted,fontFamily:sans,fontSize:13,cursor:"pointer"}}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAN CON AMIGO MODAL ─────────────────────────────────────── */}
      {showFriendModal&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:60,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>{ if(redeemStatus==="loading") return; setShowFriendModal(false); setFriendMode("menu"); }}>
          <div style={{background:THEME.bgCard2,borderRadius:"18px 18px 0 0",padding:"22px 20px 36px",width:"100%",maxWidth:520,animation:"fi 0.25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:serif,fontSize:19,color:THEME.bgLightAlt,marginBottom:4}}>🤝 Plan con amigo</div>
            <div style={{fontSize:12,color:THEME.textMuted,marginBottom:20}}>Comparte tu menú o adopta el de un amigo — las raciones se adaptan a tus macros.</div>

            {/* ── Menú principal ── */}
            {friendMode==="menu"&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={handleCreateInvitation} disabled={inviteCreating} style={{padding:"14px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#0369a1,#0ea5e9)",color:THEME.bgWhite,fontFamily:sans,fontSize:14,fontWeight:700,cursor:inviteCreating?"not-allowed":"pointer",opacity:inviteCreating?0.6:1}}>{inviteCreating?"Generando código…":"📤 Compartir mi menú"}</button>
                <button onClick={()=>setFriendMode("redeem")} style={{padding:"14px",borderRadius:12,border:"1.5px solid #0369a1",background:THEME.bgPage,color:THEME.colorInfo,fontFamily:sans,fontSize:14,fontWeight:700,cursor:"pointer"}}>📥 Usar menú de un amigo</button>
              </div>
            )}

            {/* ── Código generado + botón copiar robusto ── */}
            {friendMode==="create"&&myToken&&(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:12,color:THEME.textMuted,marginBottom:12}}>
                  Comparte este código con tu amigo. Válido 7 días, un solo uso.<br/>
                  Las raciones se adaptarán automáticamente a sus macros.
                </div>
                <div style={{fontSize:42,fontWeight:900,letterSpacing:10,color:THEME.colorInfo,fontFamily:"monospace",padding:"18px 0",background:THEME.bgPage,borderRadius:12,marginBottom:16,userSelect:"all"}}>{myToken}</div>
                <button
                  onClick={async()=>{
                    const {ok} = await copyToClipboard(myToken);
                    setCopyFeedback(ok?"ok":"error");
                    setTimeout(()=>setCopyFeedback(null),2500);
                  }}
                  style={{
                    padding:"10px 24px",borderRadius:8,
                    border:"1px solid "+(copyFeedback==="ok"?THEME.colorSuccess:copyFeedback==="error"?THEME.colorError:"#0369a1"),
                    background:copyFeedback==="ok"?THEME.successBg18:copyFeedback==="error"?"#dc262618":"transparent",
                    color:copyFeedback==="ok"?THEME.colorSuccess:copyFeedback==="error"?THEME.colorError:THEME.colorInfo,
                    fontFamily:sans,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s ease",
                  }}>
                  {copyFeedback==="ok"?"✅ ¡Copiado!":copyFeedback==="error"?"❌ Error — cópialo manualmente":"📋 Copiar código"}
                </button>
                <div style={{fontSize:11,color:THEME.textMuted5,marginTop:10}}>Tu plan original no se modifica.</div>
              </div>
            )}

            {/* ── Canjear código ── */}
            {friendMode==="redeem"&&(
              <div>
                <div style={{fontSize:12,color:THEME.textMuted,marginBottom:10}}>Introduce el código de 6 caracteres de tu amigo:</div>
                <input
                  value={redeemToken}
                  onChange={e=>setRedeemToken(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
                  placeholder="CÓDIGO"
                  maxLength={6}
                  disabled={redeemStatus==="loading"}
                  style={{width:"100%",boxSizing:"border-box",textAlign:"center",fontFamily:"monospace",fontSize:28,fontWeight:900,letterSpacing:8,padding:"14px",borderRadius:10,border:"1.5px solid #30363d",background:THEME.bgPage,color:THEME.colorInfo,outline:"none",marginBottom:12,opacity:redeemStatus==="loading"?0.6:1}}/>

                {redeemStatus==="loading"&&(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:13,color:THEME.colorInfo,marginBottom:10,padding:"10px",background:"#0369a118",borderRadius:8}}>
                    <span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⏳</span>
                    Validando código y descargando plan del amigo…
                  </div>
                )}
                {redeemStatus==="error"&&(
                  <div style={{fontSize:12,color:THEME.colorError,marginBottom:10,padding:"8px 10px",background:"#7f1d1d22",borderRadius:8,lineHeight:1.5}}>
                    ❌ {redeemError}
                  </div>
                )}
                {redeemStatus==="ok"&&(
                  <div style={{fontSize:13,color:THEME.colorSuccess,marginBottom:10,textAlign:"center",padding:"8px"}}>
                    ✅ ¡Plan adoptado! Las raciones se han adaptado a tus macros.
                  </div>
                )}

                <button
                  onClick={handleRedeemToken}
                  disabled={redeemStatus==="loading"||redeemToken.length<6}
                  style={{width:"100%",padding:"13px",borderRadius:10,border:"none",background:redeemToken.length===6&&redeemStatus!=="loading"?"linear-gradient(135deg,#0369a1,#0ea5e9)":THEME.bgCard2,color:redeemToken.length===6&&redeemStatus!=="loading"?THEME.bgWhite:THEME.textMuted5,fontFamily:sans,fontSize:14,fontWeight:700,cursor:redeemToken.length===6&&redeemStatus!=="loading"?"pointer":"default",transition:"all 0.2s"}}>
                  {redeemStatus==="loading"?"Procesando…":"Adoptar menú →"}
                </button>
                <div style={{fontSize:11,color:THEME.textMuted5,marginTop:10,lineHeight:1.5}}>
                  Recibirás exactamente los mismos platos que tu amigo, con las raciones ajustadas a tu objetivo calórico.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NUTRITIONIST DASHBOARD — full editable plan per client
// ═══════════════════════════════════════════════════════════════════════════
function NutritionistDashboard({ currentUser, onLogout }) {
  __PERF.render("NutritionistDashboard");  // PERF
  // EMOJI FIX: use emoji-safe font stacks
  const serif = SERIF_EMOJI;
  const sans  = SANS_EMOJI;
  const Dk = { bg:THEME.bgPage, card:THEME.bgCard, card2:THEME.bgCard2, border:THEME.borderDark, text:THEME.textPrimary, muted:THEME.textMuted, accent:THEME.accent };

  const [view, setView]   = useState("clients"); // "clients" | "client_detail" | "plan_editor"
  const [clients, setClients] = useState([]);
  const [sel, setSel]     = useState(null); // selected client data
  const [clientTab, setClientTab] = useState("plan");
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState("");
  // Plan editor state
  const [editPlan, setEditPlan] = useState(null); // { days, strategy, calories, profile }
  const [editDay, setEditDay]   = useState(0);
  const [editMeal, setEditMeal] = useState(null); // {dayIdx, mealIdx}
  const [saving, setSaving]     = useState(false);

  const refresh = useCallback(() => {
    const asgns = PDB.getClientsOf(currentUser.id);
    setClients(asgns.map(a => {
      const user    = PDB.getUserById(a.cid);
      const profile = PDB._g("pf_profile_"+ a.cid) || null; // stored by OriginalPlanApp via saveData
      const plan    = PDB.getActivePlan(a.cid);
      const checkins= PDB.getCheckins(a.cid);
      return { a, user, profile, plan, checkins };
    }).filter(c => c.user));
  }, [currentUser.id]);

  useEffect(() => { refresh(); }, [refresh]);

  // FIX 11: listen for plan-change broadcasts so dashboard auto-refreshes
  // when a client submits a check-in or a plan is saved in another tab.
  useEffect(() => {
    if (!_bcGet()) return;  // browser doesn't support BroadcastChannel — no-op
    const onMsg = (e) => {
      if (e.data?.type === "PLAN_UPDATED") refresh();
    };
    _bc.addEventListener("message", onMsg);
    return () => _bc.removeEventListener("message", onMsg);
  }, [refresh]);

  const handleAddClient = () => {
    setAddError("");
    const u = PDB.getUserByEmail(addEmail.trim());
    if (!u || u.role !== "user") { setAddError("No existe ningún usuario con ese email."); return; }
    if (clients.find(c => c.user.id === u.id)) { setAddError("Este cliente ya está asignado."); return; }
    PDB.assignClient(currentUser.id, u.id);
    setAddEmail(""); refresh();
  };

  const handleOpenPlanEditor = (c) => {
    if (!c.profile) { alert("El cliente no ha configurado su perfil todavía."); return; }
    // FIX 2: no uid swap needed — PDB uses explicit uid params
    const kcal = calcTarget(calcTDEE(c.profile.gender,c.profile.age,c.profile.weight,c.profile.height,c.profile.activity), c.profile.goal, 0);
    const generated = c.plan
      ? { days:[...c.plan.days], strategy:c.plan.strategy, weekWarnings:c.plan.weekWarnings, weekScore:c.plan.weekScore }
      : __PERF.time("buildPlan:nutriEditor", () => buildPlan(c.profile, kcal));  // PERF
    setEditPlan({ days: JSON.parse(JSON.stringify(generated.days)), strategy: generated.strategy, calories: kcal, profile: c.profile, clientId: c.user.id, originalPlanMeta: c.plan });
    setEditDay(0); setEditMeal(null);
    setView("plan_editor"); setSel(c);
  };

  const updateMealField = (dayIdx, mealIdx, field, value) => {
    setEditPlan(ep => {
      const days = JSON.parse(JSON.stringify(ep.days));
      if (days[dayIdx] && days[dayIdx].meals[mealIdx]) days[dayIdx].meals[mealIdx][field] = value;
      return { ...ep, days };
    });
  };

  const handleSavePlan = () => {
    setSaving(true);

    // 1. Deep-clone days before persisting — immutability guaranteed
    const planDays = JSON.parse(JSON.stringify(editPlan.days));

    // 2. Persist to PDB (localStorage + SyncEngine → Supabase)
    PDB.addPlan(editPlan.clientId, {
      created_by: "nutritionist", nutritionist_id: currentUser.id,
      strategy:   editPlan.strategy,
      calories:   editPlan.calories,
      profile:    editPlan.profile,
      days:       planDays,
      weekNum:    getWeekNumber(),
      extras:     {},
    });

    // 3. Broadcast to user's tab(s) instantly
    _bcPost({ type:"PLAN_UPDATED", uid: editPlan.clientId, ts: Date.now() });

    // 4. BUG FIX: refresh() updates `clients` state but `sel` stays stale
    //    because React state updates are async. We derive the fresh client
    //    directly from PDB (synchronous read) and update sel immediately
    //    so client_detail renders the saved plan without needing a second render.
    const freshPlan    = PDB.getActivePlan(editPlan.clientId);
    const freshProfile = PDB._g("pf_profile_"+editPlan.clientId) || freshPlan?.profile || editPlan.profile;
    const freshClient  = {
      user:    PDB.getUserById(editPlan.clientId) || (sel && sel.user),
      plan:    freshPlan,
      profile: freshProfile,
      asgn:    sel && sel.asgn,
    };
    setSel(freshClient);

    setSaving(false);
    refresh();            // also updates `clients` list for the sidebar
    setView("client_detail");
  };

  // ── CLIENTS LIST ────────────────────────────────────────────────────────
  if (view === "clients") return (
    <div style={{background:Dk.bg, minHeight:"100vh", fontFamily:sans, color:Dk.text}}>
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {/* LOGO FIX: NutiPlan logo in nutritionist dashboard header */}
      <div style={{padding:"14px 16px", borderBottom:"1px solid "+Dk.border, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <img
            src={NUTIPLAN_LOGO}
            alt=""
            aria-hidden="true"
            loading="lazy"
            style={{
              display:"block",
              width:"auto",
              height:40,
              maxHeight:40,
              objectFit:"contain",
              background:"transparent",
              flexShrink:0,
            }}
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
          <div>
            <h1 style={{fontFamily:serif, fontSize:18, color:Dk.text, margin:0}}>Mis clientes</h1>
            <p style={{color:Dk.muted, fontSize:11, margin:0}}>{currentUser.email}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{padding:"7px 14px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:12, cursor:"pointer"}}>Salir</button>
      </div>

      <div style={{maxWidth:600, margin:"0 auto", padding:"16px 14px"}}>
        <div style={{background:Dk.card, borderRadius:14, padding:16, border:"1px solid "+Dk.border, marginBottom:16}}>
          <div style={{fontSize:12, color:Dk.muted, marginBottom:10, fontWeight:600}}>Añadir cliente por email</div>
          <div style={{display:"flex", gap:8}}>
            <input value={addEmail} onChange={e=>{setAddEmail(e.target.value);setAddError("");}} onKeyDown={e=>e.key==="Enter"&&handleAddClient()} placeholder="email@cliente.com" style={{flex:1, padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:13, outline:"none", minWidth:0}}/>
            <button onClick={handleAddClient} style={{padding:"9px 16px", borderRadius:8, background:Dk.accent, color:THEME.bgPage, border:"none", fontFamily:sans, fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0}}>Asignar</button>
          </div>
          {addError && <div style={{fontSize:12, color:THEME.colorError2, marginTop:6}}>{addError}</div>}
          <div style={{fontSize:11, color:Dk.muted, marginTop:8}}>💡 También puedes compartir tu email con clientes para que se registren vinculados a ti.</div>
        </div>

        {clients.length === 0
          ? <div style={{textAlign:"center", padding:"40px 0", color:Dk.muted}}><div style={{fontSize:40, marginBottom:12}}>👥</div><div>Sin clientes asignados aún.</div></div>
          : clients.map((c, i) => {
              const lastCi = c.checkins.slice(-1)[0];
              return (
                <div key={i} onClick={()=>{setSel(c);setClientTab("plan");setView("client_detail");}} style={{background:Dk.card, borderRadius:14, padding:16, border:"1px solid "+Dk.border, marginBottom:10, cursor:"pointer", animation:"fi 0.3s ease"}}>
                  <div style={{display:"flex", alignItems:"center", gap:12}}>
                    <div style={{width:42, height:42, borderRadius:"50%", background:THEME.accentBg22, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20}}>👤</div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:14, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.user.email}</div>
                      {c.profile ? <div style={{fontSize:11, color:Dk.muted, marginTop:2}}>{GOAL_LABELS[c.profile.goal]} · {c.profile.weight}kg · {c.profile.age}a</div> : <div style={{fontSize:11, color:THEME.accent}}>Sin perfil aún</div>}
                    </div>
                    <div style={{textAlign:"right", flexShrink:0}}>
                      <div style={{fontSize:10, padding:"3px 8px", borderRadius:99, background:c.plan?(c.plan.created_by==="nutritionist"?"#7c3aed22":THEME.accentBg22):"#e05a5a22", color:c.plan?(c.plan.created_by==="nutritionist"?THEME.colorPurpleLight:Dk.accent):THEME.colorError2, fontWeight:700}}>
                        {c.plan ? (c.plan.created_by==="nutritionist"?"🔒 Manual":"🤖 Auto") : "Sin plan"}
                      </div>
                      {lastCi && <div style={{fontSize:9, color:Dk.muted, marginTop:3}}>Check-in hace {Math.round((Date.now()-lastCi.created_at)/86400000)}d</div>}
                    </div>
                  </div>
                </div>
              );
            })
        }

        {/* AD PLACEMENT 4: nutritionist dashboard — below clients list, above the fold */}
        <div style={{padding:"0 16px 16px"}}>
          <AdBanner
            slot={AD_SLOTS.nutriDashboard}
            format="horizontal"
            responsive={true}
            style={{ borderRadius:8, overflow:"hidden" }}
          />
        </div>

      </div>
    </div>
  );

  // ── CLIENT DETAIL ────────────────────────────────────────────────────────
  if (view === "client_detail" && sel) {
    // BUG FIX: derive c from the refreshed `clients` state so that after
    // handleSavePlan runs refresh(), the detail view sees the saved plan.
    // Falls back to sel if clients hasn't updated yet (first render).
    const c = clients.find(x => x.user?.id === sel.user?.id) || sel;
    return (
      <div style={{background:Dk.bg, minHeight:"100vh", fontFamily:sans, color:Dk.text}}>
        <style>{`@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{padding:"14px 16px", borderBottom:"1px solid "+Dk.border, display:"flex", alignItems:"center", gap:12}}>
          <button onClick={()=>setView("clients")} style={{background:"none", border:"none", color:Dk.muted, fontSize:20, cursor:"pointer", padding:0}}>←</button>
          <div style={{flex:1, minWidth:0}}>
            <h1 style={{fontFamily:serif, fontSize:17, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.user.email}</h1>
            {c.profile && <p style={{color:Dk.muted, margin:0, fontSize:11}}>{GOAL_LABELS[c.profile.goal]} · {c.profile.weight}kg</p>}
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={()=>handleOpenPlanEditor(c)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:Dk.accent,color:THEME.bgPage,fontFamily:sans,fontSize:12,fontWeight:700,cursor:"pointer"}}>
              {c.plan ? "✏️ Editar plan" : "+ Crear plan"}
            </button>
            <button onClick={async()=>{
              if(!confirm("¿Dar de baja a este paciente? Se le generará un plan automático.")) return;
              await removePatient(currentUser.id, c.user.id);
              refresh(); setView("clients"); setSel(null);
            }} style={{padding:"8px 10px",borderRadius:8,border:"1px solid #7f1d1d",background:"#7f1d1d18",color:THEME.colorError,fontFamily:sans,fontSize:11,fontWeight:600,cursor:"pointer"}}>🚫</button>
          </div>
        </div>

        <div style={{display:"flex", borderBottom:"1px solid "+Dk.border}}>
          {[["plan","📋 Plan"],["checkins","📊 Check-ins"],["perfil","👤 Perfil"]].map(([t,l]) => (
            <button key={t} onClick={()=>setClientTab(t)} style={{flex:1, padding:"10px 0", border:"none", background:"none", color:clientTab===t?Dk.accent:Dk.muted, fontFamily:sans, fontSize:12, fontWeight:700, cursor:"pointer", borderBottom:clientTab===t?"2px solid "+Dk.accent:"2px solid transparent"}}>{l}</button>
          ))}
        </div>

        <div style={{maxWidth:600, margin:"0 auto", padding:"16px 14px 100px", animation:"fi 0.3s ease"}}>
          {clientTab === "plan" && (
            !c.plan
              ? <div style={{textAlign:"center", padding:"32px 0", color:Dk.muted}}><div style={{fontSize:40}}>📋</div><div style={{marginTop:12, marginBottom:16}}>Sin plan activo</div>{c.profile && <button onClick={()=>handleOpenPlanEditor(c)} style={{padding:"11px 24px", borderRadius:10, border:"none", background:Dk.accent, color:THEME.bgPage, fontFamily:sans, fontSize:13, fontWeight:700, cursor:"pointer"}}>Crear plan →</button>}</div>
              : <>
                  <div style={{padding:"10px 14px", borderRadius:12, background:c.plan.created_by==="nutritionist"?THEME.purpleBg18:THEME.accentBg18, border:"1px solid "+(c.plan.created_by==="nutritionist"?"#7c3aed44":"#e8a04544"), marginBottom:12}}>
                    <div style={{fontSize:12, fontWeight:700, color:c.plan.created_by==="nutritionist"?THEME.colorPurpleLight:Dk.accent}}>{c.plan.created_by==="nutritionist"?"🔒 Plan manual — tuyo":"🤖 Plan automático"}</div>
                    <div style={{fontSize:11, color:Dk.muted, marginTop:2}}>Semana {c.plan.weekNum} · {c.plan.calories} kcal · {(STRATEGIES[c.plan.strategy]||{}).label}</div>
                  </div>
                  {(c.plan.days||[]).map((d, di) => (
                    <div key={di} style={{background:Dk.card, borderRadius:12, padding:"12px 14px", marginBottom:8, border:"1px solid "+Dk.border}}>
                      <div style={{fontSize:13, fontWeight:700, color:Dk.accent, marginBottom:8}}>{d.name} {d.special==="entrenamiento"?"🏋️":d.special==="libre"?"🎉":""}</div>
                      {(d.meals||[]).filter(Boolean).map((m,mi)=>(
                        <div key={mi} style={{fontSize:11, color:Dk.muted, padding:"3px 0", borderBottom:mi<d.meals.filter(Boolean).length-1?"1px solid "+Dk.border+"66":"none"}}>
                          <span style={{color:Dk.text, fontWeight:600}}>{m.time}:</span> {m.p1}
                        </div>
                      ))}
                    </div>
                  ))}
                </>
          )}

          {clientTab === "checkins" && (
            c.checkins.length === 0
              ? <div style={{textAlign:"center", padding:"32px 0", color:Dk.muted}}><div style={{fontSize:40}}>📊</div><div style={{marginTop:12}}>Sin check-ins aún.</div></div>
              : [...c.checkins].reverse().map((ci, i) => (
                  <div key={i} style={{background:Dk.card, borderRadius:12, padding:"12px 14px", marginBottom:8, border:"1px solid "+Dk.border}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
                      <div style={{fontSize:12, fontWeight:700, color:Dk.accent}}>Check-in #{c.checkins.length-i}</div>
                      <div style={{fontSize:11, color:Dk.muted}}>{new Date(ci.created_at).toLocaleDateString("es-ES")}</div>
                    </div>
                    <div style={{display:"flex", gap:16, flexWrap:"wrap"}}>
                      {[["Peso",ci.pesoTrend==="baja"?"📉 Bajó":ci.pesoTrend==="sube"?"📈 Subió":"➡️ Igual"],["Hambre","★".repeat(ci.hambre||3)],["Energía","★".repeat(ci.energia||3)],["Adherencia","★".repeat(ci.adherencia||3)]].map(([k,v])=>(
                        <div key={k} style={{fontSize:11}}><div style={{color:Dk.muted, marginBottom:1}}>{k}</div><div style={{color:Dk.text, fontWeight:600}}>{v}</div></div>
                      ))}
                    </div>
                    {ci.pesoActual && <div style={{marginTop:6, fontSize:11, color:Dk.accent}}>Peso: {ci.pesoActual} kg</div>}
                  </div>
                ))
          )}

          {clientTab === "perfil" && (
            !c.profile
              ? <div style={{textAlign:"center", padding:"32px 0", color:Dk.muted}}><div style={{fontSize:40}}>👤</div><div style={{marginTop:12}}>Sin perfil configurado.</div></div>
              : <div style={{display:"flex", flexDirection:"column", gap:8}}>
                  {[["Género",c.profile.gender==="female"?"Mujer":"Hombre"],["Edad",c.profile.age+" años"],["Peso",c.profile.weight+" kg"],["Altura",c.profile.height+" cm"],["Objetivo",GOAL_LABELS[c.profile.goal]],["Actividad",c.profile.activity],["Comidas/día",c.profile.mealsPerDay],["TDEE","~"+calcTDEE(c.profile.gender,c.profile.age,c.profile.weight,c.profile.height,c.profile.activity)+" kcal"],["Objetivo kcal",calcTarget(calcTDEE(c.profile.gender,c.profile.age,c.profile.weight,c.profile.height,c.profile.activity),c.profile.goal,0)+" kcal"],["Intolerancias",(c.profile.intolerances||[]).join(", ")||"Ninguna"]].map(([k,v])=>(
                    <div key={k} style={{background:Dk.card, borderRadius:10, padding:"10px 14px", border:"1px solid "+Dk.border, display:"flex", justifyContent:"space-between"}}>
                      <span style={{fontSize:12, color:Dk.muted}}>{k}</span><span style={{fontSize:13, fontWeight:600}}>{String(v)}</span>
                    </div>
                  ))}
                </div>
          )}
        </div>

        <div style={{position:"fixed", bottom:0, left:0, right:0, padding:"10px 16px", background:Dk.bg+"f0", backdropFilter:"blur(8px)", borderTop:"1px solid "+Dk.border}}>
          <div style={{maxWidth:600, margin:"0 auto"}}>
            <button onClick={()=>handleOpenPlanEditor(c)} style={{width:"100%", padding:"12px", borderRadius:10, border:"none", background:THEME.gradPurple, color:THEME.bgWhite, fontFamily:sans, fontSize:13, fontWeight:700, cursor:"pointer"}}>
              {c.plan ? "✏️ Editar / actualizar plan" : "📋 Crear plan"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAN EDITOR — full editable meals ────────────────────────────────────
  if (view === "plan_editor" && editPlan) {
    const day = editPlan.days[editDay];
    return (
      <div style={{background:Dk.bg, minHeight:"100vh", fontFamily:sans, color:Dk.text}}>
        <style>{`@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{padding:"14px 16px", borderBottom:"1px solid "+Dk.border, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, background:Dk.bg, zIndex:10}}>
          <button onClick={()=>setView("client_detail")} style={{background:"none", border:"none", color:Dk.muted, fontSize:20, cursor:"pointer", padding:0}}>←</button>
          <div style={{flex:1, minWidth:0}}>
            <h1 style={{fontFamily:serif, fontSize:17, margin:0}}>✏️ Editor de plan</h1>
            <p style={{color:Dk.muted, margin:0, fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{sel&&sel.user.email}</p>
          </div>
          <button onClick={handleSavePlan} disabled={saving} style={{padding:"9px 16px", borderRadius:8, border:"none", background:THEME.colorPurple, color:THEME.bgWhite, fontFamily:sans, fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0, opacity:saving?0.7:1}}>
            {saving ? "..." : "✅ Guardar"}
          </button>
        </div>

        {/* Day tabs */}
        <div style={{display:"flex", overflowX:"auto", padding:"10px 14px 0", gap:6, scrollbarWidth:"none", borderBottom:"1px solid "+Dk.border}}>
          {editPlan.days.map((d, di) => (
            <button key={di} onClick={()=>{setEditDay(di);setEditMeal(null);}} style={{flexShrink:0, padding:"6px 12px", borderRadius:8, border:"2px solid "+(editDay===di?THEME.colorPurple:Dk.border), background:editDay===di?"#7c3aed22":Dk.card2, color:editDay===di?THEME.colorPurpleLight:Dk.muted, fontFamily:sans, fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap"}}>
              {d.name.slice(0,3)} {d.special==="entrenamiento"?"🏋️":d.special==="libre"?"🎉":""}
            </button>
          ))}
        </div>

        <div style={{maxWidth:600, margin:"0 auto", padding:"14px 14px 100px"}}>
          {/* Day header note */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11, color:Dk.muted, marginBottom:6, letterSpacing:"0.08em", textTransform:"uppercase"}}>Nota del día (visible para el cliente)</div>
            <textarea
              value={day.dayNote||""}
              onChange={e=>setEditPlan(ep=>{const days=JSON.parse(JSON.stringify(ep.days));days[editDay].dayNote=e.target.value;return{...ep,days};})}
              placeholder="Ej: Día de entrenamiento — asegúrate de comer el post-entreno dentro de los 30 min."
              style={{width:"100%", boxSizing:"border-box", padding:"10px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card, color:Dk.text, fontFamily:sans, fontSize:12, outline:"none", resize:"vertical", minHeight:60}}
            />
          </div>

          {/* Meals editor */}
          {(day.meals||[]).filter(Boolean).map((meal, mi) => {
            const isEditing = editMeal && editMeal.dayIdx===editDay && editMeal.mealIdx===mi;
            return (
              <div key={mi} style={{background:Dk.card, borderRadius:14, marginBottom:10, border:"1px solid "+(isEditing?THEME.colorPurple:Dk.border), overflow:"hidden"}}>
                <button onClick={()=>setEditMeal(isEditing?null:{dayIdx:editDay,mealIdx:mi})} style={{width:"100%", padding:"12px 14px", background:"none", border:"none", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10}}>
                  <span style={{fontSize:18}}>{meal.emoji||"🍽️"}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:11, color:Dk.muted, marginBottom:2}}>{meal.time}</div>
                    <div style={{fontSize:13, fontWeight:700, color:Dk.text, lineHeight:1.3}}>{meal.p1||"—"}</div>
                    {meal.p2 && <div style={{fontSize:11, color:Dk.muted, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{meal.p2}</div>}
                  </div>
                  <span style={{color:Dk.muted, fontSize:14, flexShrink:0, transform:isEditing?"rotate(180deg)":"none", transition:"transform 0.2s"}}>▼</span>
                </button>

                {isEditing && (
                  <div style={{padding:"0 14px 14px", borderTop:"1px solid "+Dk.border+"66", animation:"fi 0.2s ease"}}>
                    <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:10}}>
                      {/* Emoji */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Emoji</div>
                        <input value={meal.emoji||""} onChange={e=>updateMealField(editDay,mi,"emoji",e.target.value)} placeholder="🍽️" style={{width:60, padding:"8px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:18, textAlign:"center", outline:"none"}}/>
                      </div>
                      {/* Title */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Título del plato</div>
                        <input value={meal.title||""} onChange={e=>updateMealField(editDay,mi,"title",e.target.value)} placeholder="Ej: Salmón al horno con quinoa" style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:13, outline:"none"}}/>
                      </div>
                      {/* Plate 1 */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Descripción principal (p1)</div>
                        <textarea value={meal.p1||""} onChange={e=>updateMealField(editDay,mi,"p1",e.target.value)} placeholder="Ej: 150g salmón · 80g quinoa · 200g espinacas salteadas" style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:13, outline:"none", resize:"vertical", minHeight:60}}/>
                      </div>
                      {/* Plate 2 */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Descripción secundaria (p2, opcional)</div>
                        <textarea value={meal.p2||""} onChange={e=>updateMealField(editDay,mi,"p2",e.target.value)} placeholder="Ej: Aliño: AOVE + limón + eneldo · Postre: fruta de temporada" style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:13, outline:"none", resize:"vertical", minHeight:50}}/>
                      </div>
                      {/* Shopping list */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Lista de la compra (una por línea)</div>
                        <textarea value={(meal.shopping||[]).join("\n")} onChange={e=>updateMealField(editDay,mi,"shopping",e.target.value.split("\n"))} placeholder={"150g salmón fresco\n80g quinoa\n200g espinacas"} style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:12, outline:"none", resize:"vertical", minHeight:70, lineHeight:1.8}}/>
                      </div>
                      {/* Recipe */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Receta (un paso por línea)</div>
                        <textarea value={(meal.recipe||[]).join("\n")} onChange={e=>updateMealField(editDay,mi,"recipe",e.target.value.split("\n"))} placeholder={"Enjuaga la quinoa y cocina con el doble de agua 15 min.\nSaltea las espinacas con AOVE y ajo.\nMarca el salmón en la sartén 3 min por lado."} style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:12, outline:"none", resize:"vertical", minHeight:80, lineHeight:1.8}}/>
                      </div>
                      {/* Nutritionist note */}
                      <div>
                        <div style={{fontSize:10, color:THEME.colorPurpleLight, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>🧑‍⚕️ Nota tuya para este plato (visible para el cliente)</div>
                        <textarea value={meal.nutriNote||""} onChange={e=>updateMealField(editDay,mi,"nutriNote",e.target.value)} placeholder="Ej: Si entrenas hoy, añade un plátano de postre para reponer glucógeno." style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid #7c3aed44", background:"#7c3aed12", color:Dk.text, fontFamily:sans, fontSize:12, outline:"none", resize:"vertical", minHeight:50}}/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Calories info */}
          <div style={{background:Dk.card, borderRadius:12, padding:"12px 14px", border:"1px solid "+Dk.border, marginTop:4}}>
            <div style={{fontSize:11, color:Dk.muted, marginBottom:4}}>Calorías del plan: <strong style={{color:Dk.accent}}>{editPlan.calories} kcal/día</strong></div>
            <div style={{fontSize:11, color:Dk.muted}}>Estrategia: <strong style={{color:Dk.text}}>{(STRATEGIES[editPlan.strategy]||{}).label||editPlan.strategy}</strong></div>
          </div>
        </div>

        <div style={{position:"fixed", bottom:0, left:0, right:0, padding:"10px 16px", background:Dk.bg+"f0", backdropFilter:"blur(8px)", borderTop:"1px solid "+Dk.border}}>
          <div style={{maxWidth:600, margin:"0 auto", display:"flex", gap:8}}>
            <button onClick={()=>setView("client_detail")} style={{flex:1, padding:"12px", borderRadius:10, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, fontWeight:600, cursor:"pointer"}}>Cancelar</button>
            <button onClick={handleSavePlan} disabled={saving} style={{flex:2, padding:"12px", borderRadius:10, border:"none", background:THEME.gradPurple, color:THEME.bgWhite, fontFamily:sans, fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving?0.7:1}}>
              {saving ? "Guardando..." : "✅ Guardar plan del cliente →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


// ═══════════════════════════════════════════════════════════════════════════
// PLAN CON AMIGO — token-based invitation system
// ═══════════════════════════════════════════════════════════════════════════

// ── Token helpers ─────────────────────────────────────────────────────────
function _genToken() {
  // 6-char uppercase alphanumeric, URL-safe, easy to type
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  let t = "";
  for (let i = 0; i < 6; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

// ── copyToClipboard — copia texto con fallback para HTTP / navegadores viejos ──
async function copyToClipboard(text) {
  // Método moderno: requiere HTTPS y permiso del usuario
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    } catch(e) {
      console.warn("[copyToClipboard] clipboard API falló:", e.message);
    }
  }
  // Fallback: textarea + execCommand (funciona en HTTP y navegadores antiguos)
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
    document.body.appendChild(el);
    el.focus();
    el.setSelectionRange(0, el.value.length);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return { ok };
  } catch(e) {
    console.warn("[copyToClipboard] execCommand falló:", e.message);
    return { ok: false };
  }
}

// PDB layer — localStorage store for invitations (offline / fallback)
const INVITATIONS_KEY = "pf_invitations";
const InvitationStore = {
  _all: () => PDB._g(INVITATIONS_KEY) || [],
  _save: (arr) => PDB._s(INVITATIONS_KEY, arr),

  create: (ownerUid, planId) => {
    let token;
    // Retry until we get a unique token (astronomically unlikely to collide)
    do { token = _genToken(); }
    while (InvitationStore._all().find(i => i.token === token));

    const inv = {
      token,
      ownerUid,
      planId,
      usedBy:    null,
      usedAt:    null,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
    };
    InvitationStore._save([...InvitationStore._all(), inv]);
    // Mirror to Supabase async
    SyncEngine.push(() => SDB._rest("/plan_invitations", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        token:      inv.token,
        owner_uid:  inv.ownerUid,
        plan_id:    inv.planId,
        expires_at: new Date(inv.expiresAt).toISOString(),
      }),
    }));
    return token;
  },

  // Returns:
  //   { ok:true,  invitation: { token, planId, plan, ownerUid } }
  //   { ok:false, errorCode, errorMsg }
  //
  // errorCode values:
  //   "empty"            — token vacío o longitud incorrecta (sin llamada a red)
  //   "session_expired"  — JWT caducado, _rest devolvió 401
  //   "timeout"          — la petición superó el límite de tiempo
  //   "rpc_missing"      — la función no existe en Supabase (migration pendiente)
  //                        o respuesta inesperada (data vacío)
  //   "network"          — error de red genérico, el usuario puede reintentar
  //   "token_not_found"  — el código no existe en la base de datos
  //   "token_expired"    — el código existe pero ha caducado (y no fue usado)
  //   "token_already_used" — el código ya fue canjeado por otro usuario
  //   "self_redemption"  — el propietario intenta canjear su propio código
  //   "plan_not_found"   — el token es válido pero el plan ya no existe;
  //                        el token NO se consume
  //   "invalid_or_used"  — fallback genérico (reason desconocido de la RPC,
  //                        o token no encontrado en modo offline)
  //
  // Paths:
  //  • Online (SDB._token presente):
  //      RPC redeem_invitation_and_get_plan devuelve SETOF jsonb, siempre 1 fila.
  //      { success:true,  plan }        → token reclamado atómicamente, ok:true
  //      { success:false, reason }      → mapeado a errorCode específico, ok:false
  //      error HTTP/_rest               → errorCode de red/auth, ok:false
  //  • Offline (SDB._token ausente):
  //      Busca en localStorage; solo útil en demo o mismo dispositivo.
  validate: async (token) => {
    if (typeof token !== "string") return { ok:false, errorCode:"empty", errorMsg:"Código vacío." };
    const clean = token.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length !== 6) {
      return { ok:false, errorCode:"empty", errorMsg:"El código debe tener 6 caracteres." };
    }

    console.info("[INVITE_VALIDATE] token:", clean, "uid:", SDB._uid, "online:", !!SDB._token);
    __TRACE.log("invitation:validate:start", { tokenInput: token, tokenClean: clean, hasSdbToken: !!SDB._token, sdbUid: SDB._uid });

    // 1. Online path — transactional: validate + claim + fetch plan in one RPC.
    //    redeem_invitation_and_get_plan devuelve SETOF jsonb (siempre 1 fila):
    //      { success:true,  plan:{…} }         → éxito, token reclamado
    //      { success:false, reason:"TOKEN_*" } → razón explícita del fallo
    if (SDB._token) {
      console.info("[INVITE_REDEEM] calling redeem_invitation_and_get_plan");
      const { data, error } = await SDB._rest("/rpc/redeem_invitation_and_get_plan", {
        method: "POST",
        body: JSON.stringify({ p_token: clean, p_requester_id: SDB._uid }),
      });
      __TRACE.log("invitation:rpc:response", {
        dataLen: Array.isArray(data) ? data.length : typeof data,
        error,
      });

      if (error) {
        // _rest devuelve string para errores de red/timeout/401,
        // pero un objeto PostgREST {code,message,hint,details,status} para errores HTTP.
        // Normalizar a string antes de clasificar.
        const errStr =
          typeof error === "string"
            ? error
            : (error?.message || error?.code || error?.hint || JSON.stringify(error));

        const errorCode =
          errStr === "session_expired"
            ? "session_expired"
          : errStr.includes("timeout")
            ? "timeout"
          : (errStr.includes("PGRST") || errStr.includes("404") ||
             errStr.includes("could not find") || errStr.includes("does not exist"))
            ? "rpc_missing"
          : "network";

        const errorMsg =
          errorCode === "session_expired"
            ? "Tu sesión ha caducado. Inicia sesión otra vez."
          : errorCode === "timeout"
            ? "El servidor tardó demasiado. Inténtalo de nuevo."
          : errorCode === "rpc_missing"
            ? "Error de configuración del servidor. Ejecuta la migration SQL y vuelve a intentarlo."
          : "Sin conexión con el servidor. Comprueba tu red e inténtalo de nuevo.";

        console.warn("[INVITE_REDEEM] RPC error:", error, "→ errorCode:", errorCode, "errStr:", errStr);
        return { ok: false, errorCode, errorMsg };
      }

      // La RPC siempre devuelve exactamente 1 fila JSONB
      if (!Array.isArray(data) || data.length === 0) {
        return { ok:false, errorCode:"rpc_missing",
                 errorMsg:"Respuesta inesperada del servidor. Inténtalo de nuevo." };
      }

      const rpcResult = data[0];

      // Error con reason explícito — el token NO fue reclamado
      if (!rpcResult.success) {
        const REASON_MAP = {
          TOKEN_NOT_FOUND:    { errorCode:"token_not_found",    errorMsg:"El código no existe. Comprueba que lo has escrito bien." },
          TOKEN_EXPIRED:      { errorCode:"token_expired",      errorMsg:"Este código ha caducado. Pide uno nuevo a tu amigo." },
          TOKEN_ALREADY_USED: { errorCode:"token_already_used", errorMsg:"Este código ya fue canjeado. Cada código es de un solo uso." },
          SELF_REDEMPTION:    { errorCode:"self_redemption",    errorMsg:"No puedes canjear tu propio código de invitación." },
          PLAN_NOT_FOUND:     { errorCode:"plan_not_found",     errorMsg:"El plan de este código ya no existe. Pide uno nuevo a tu amigo." },
        };
        const mapped = REASON_MAP[rpcResult.reason]
          || { errorCode:"invalid_or_used", errorMsg:"Código no válido." };
        console.info("[INVITE_REDEEM] rejected — reason:", rpcResult.reason);
        __TRACE.log("invitation:rpc:rejected", { reason: rpcResult.reason });
        return { ok:false, ...mapped };
      }

      // Éxito — rpcResult.plan es la fila de plans serializada por row_to_json
      const planRow = rpcResult.plan;
      const planId  = planRow.id;
      const plan    = _sbToLocalPlan(planRow);

      const all = InvitationStore._all().map(i =>
        i.token === clean ? { ...i, usedBy: SDB._uid, usedAt: Date.now() } : i
      );
      InvitationStore._save(all);
      console.info("[INVITE_REDEEM] claimed — planId:", planId);
      __TRACE.log("invitation:rpc:claimed", { planId });
      return { ok:true, invitation: { token:clean, planId, plan, ownerUid:null } };
    }

    // 2. Offline fallback: localStorage only. Only useful for demo/single-device.
    const inv = InvitationStore._all().find(
      i => i.token === clean && !i.usedBy && i.expiresAt > Date.now()
    );
    if (!inv) {
      return { ok:false, errorCode:"invalid_or_used",
               errorMsg:"Código no encontrado o ya utilizado (modo offline)." };
    }
    const all = InvitationStore._all().map(i =>
      i.token === clean ? { ...i, usedBy: "offline", usedAt: Date.now() } : i
    );
    InvitationStore._save(all);
    __TRACE.log("invitation:offline:claimed", { planId: inv.planId });
    return { ok:true, invitation:inv };
  },

  // claim() kept for cases where validate() already claimed atomically via RPC.
  // Only needed for the offline localStorage fallback path.
  claim: async (token, claimantUid) => {
    const clean = token.trim().toUpperCase();
    const all = InvitationStore._all().map(i =>
      i.token === clean ? { ...i, usedBy: claimantUid, usedAt: Date.now() } : i
    );
    InvitationStore._save(all);
    // Mirror to Supabase only if RPC wasn't already used (offline recovery)
    SyncEngine.push(() => SDB._rest(
      `/plan_invitations?token=eq.${clean}`,
      { method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({ used_by: claimantUid, used_at: new Date().toISOString() }),
      }
    ));
  },
};

// ── cloneAndScalePlan — reemplaza buildFriendPlan ────────────────────────
// Clona el plan REAL del amigo y escala SOLO las cantidades en gramos
// en proporción a las calorías del receptor. El menú (platos, recetas,
// lista de compra) es idéntico al original.
//
// Ejemplo: "Pollo (150g)" con ratio 0.9 → "Pollo (135g)"
function cloneAndScalePlan(ownerPlan, ownerKcal, friendKcal, friendProfile) {
  const ratio = ownerKcal > 0 ? friendKcal / ownerKcal : 1.0;

  // Deep clone para no mutar el plan del amigo
  const cloned = JSON.parse(JSON.stringify(ownerPlan));

  // Escala todos los valores en gramos dentro de un string
  function scaleText(text) {
    if (!text || typeof text !== "string") return text;
    return text.replace(/(\d+)\s*g\b/gi, (match, num) => {
      const scaled = Math.round(parseInt(num, 10) * ratio);
      return match.replace(num, String(scaled));
    });
  }

  function scaleMeal(meal) {
    if (!meal) return meal;
    return {
      ...meal,
      p1:       scaleText(meal.p1),
      p2:       scaleText(meal.p2),
      shopping: Array.isArray(meal.shopping) ? meal.shopping.map(scaleText) : meal.shopping,
      recipe:   Array.isArray(meal.recipe)   ? meal.recipe.map(scaleText)   : meal.recipe,
    };
  }

  cloned.days = (cloned.days || []).map(day => ({
    ...day,
    meals: (day.meals || []).map(scaleMeal),
  }));

  cloned.calories   = friendKcal;
  cloned.source     = "friend_plan";
  cloned.is_active  = true;
  cloned.profile    = friendProfile;
  cloned.created_at = Date.now();
  delete cloned.uid;
  delete cloned.id;

  return cloned;
}

// extractMenuNames — mantenida por compatibilidad (ya no usada en el flujo principal)
function extractMenuNames(plan) {
  if (!plan?.days) return [];
  return plan.days.map(day => ({
    name:  day.name,
    meals: (day.meals || []).map(m => ({ slot: m.slot, name: m.p1, alts: (m.alt || []).slice(0, 2) })),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// REMOVE PATIENT — nutritionist removes a client safely
// ═══════════════════════════════════════════════════════════════════════════

// Removes the nutritionist→client link and regenerates an auto system plan
// for the client. The client's account and all their data remain intact.
async function removePatient(nutritionistId, clientId) {
  // 1. Remove assignment from localStorage
  const asgns = PDB.getAssignments().filter(
    a => !(a.nid === nutritionistId && a.cid === clientId)
  );
  PDB._saveAsgn(asgns);

  // 2. Mirror deletion to Supabase
  await SDB.deleteAssignment(clientId, nutritionistId).catch(e =>
    console.warn("[removePatient] Supabase delete failed:", e.message)
  );

  // 3. Get client's active plan — we need their profile to rebuild
  const activePlan  = PDB.getActivePlan(clientId);
  const clientProf  = activePlan?.profile || PDB._g("pf_profile_" + clientId);
  if (!clientProf) {
    console.info("[removePatient] No profile found for client — plan not regenerated");
    return { ok: true, newPlan: null };
  }

  // 4. Deactivate the nutritionist plan
  const plans = PDB.getPlans(clientId).map(p => ({ ...p, is_active: false }));
  try { localStorage.setItem("pf_plans_" + clientId, JSON.stringify(plans)); } catch(e) {}

  // 5. Generate a new system plan for the client
  const tdee     = calcTDEE(clientProf.gender, clientProf.age, clientProf.weight,
                             clientProf.height, clientProf.activity);
  const kcal     = calcTarget(tdee, clientProf.goal, clientProf.kcalAdjust || 0);
  const newPlan  = __PERF.time("buildPlan:removePatient", () => buildPlan(clientProf, kcal));  // PERF
  const wk       = getWeekNumber();

  // 6. Save the new auto plan for the client
  PDB.addPlan(clientId, {
    created_by: "system",
    nutritionist_id: null,
    strategy:   newPlan.strategy,
    calories:   kcal,
    profile:    clientProf,
    days:       JSON.parse(JSON.stringify(newPlan.days)),
    weekNum:    wk,
    extras:     {},
  });

  // 7. Broadcast so the client's tab updates immediately
  _bcPost({ type: "PLAN_UPDATED", uid: clientId, ts: Date.now() });

  console.info("[removePatient] Done — client", clientId, "now has system plan");
  return { ok: true, newPlan };
}

// ── useSyncStatus — tiny hook for the sync indicator dot ─────────────────
function useSyncStatus() {
  const [status, setStatus] = useState("synced"); // "synced" | "pending" | "offline"
  useEffect(() => {
    const check = () => {
      if (!navigator.onLine)         return setStatus("offline");
      if (SyncEngine._q.length > 0) return setStatus("pending");
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
// ═══════════════════════════════════════════════════════════════════════════
// RESET PASSWORD VIEW — shown when user arrives via Supabase recovery link
// ═══════════════════════════════════════════════════════════════════════════
function ResetPasswordView({ token, onDone }) {
  const sans  = SANS_EMOJI;
  const serif = SERIF_EMOJI;
  const Dk = { bg:THEME.bgPage, card:THEME.bgCard, card2:THEME.bgCard2, border:THEME.borderDark, text:THEME.textPrimary, muted:THEME.textMuted };
  const inp = { width:"100%", boxSizing:"border-box", padding:"11px 14px", borderRadius:8, border:"1.5px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:14, outline:"none" };

  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [success,          setSuccess]          = useState(false);
  const [showNewPass,      setShowNewPass]      = useState(false);
  const [showConfirmPass,  setShowConfirmPass]  = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (newPass.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (newPass !== confirmPass) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true);
    const prevToken = SDB._token;
    SDB._token = token;
    const { ok, error: sbErr } = await SDB.updatePassword(newPass);
    SDB._token = prevToken;
    setLoading(false);
    if (!ok) { setError(sbErr || "No se pudo actualizar la contraseña. El enlace puede haber caducado."); return; }
    setSuccess(true);
    setTimeout(() => onDone(), 3000);
  };

  return (
    <div style={{background:Dk.bg, minHeight:"100vh", fontFamily:sans, color:Dk.text, display:"flex", alignItems:"center", justifyContent:"center", padding:16}}>
      <div style={{width:"100%", maxWidth:400}}>
        <div style={{textAlign:"center", marginBottom:28}}>
          <img src={NUTIPLAN_LOGO} alt="NutiPlan" style={{display:"block", margin:"0 auto 8px", width:96, height:"auto", maxHeight:96, objectFit:"contain", background:"transparent", userSelect:"none"}} onError={e => { e.currentTarget.style.display = "none"; }} />
          <h1 style={{fontFamily:serif, fontSize:26, color:Dk.text, margin:"0 0 4px"}}>NutiPlan</h1>
          <p style={{color:Dk.muted, fontSize:13, margin:0}}>Plataforma de nutrición personalizada</p>
        </div>
        <div style={{background:Dk.card, border:"1px solid "+Dk.border, borderRadius:16, padding:"22px 18px"}}>
          <div style={{fontFamily:serif, fontSize:18, color:Dk.text, marginBottom:6}}>🔐 Nueva contraseña</div>
          <div style={{fontSize:12, color:Dk.muted, marginBottom:16, lineHeight:1.5}}>
            Elige una contraseña nueva. Mínimo 8 caracteres.
          </div>
          {success ? (
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"16px 0"}}>
              <div style={{fontSize:40}}>✅</div>
              <div style={{color:THEME.colorSuccess, fontSize:14, fontWeight:700, textAlign:"center"}}>¡Contraseña actualizada!</div>
              <div style={{color:Dk.muted, fontSize:12, textAlign:"center"}}>Redirigiendo al login en 3 segundos…</div>
            </div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              <div style={{position:"relative"}}>
                <input type={showNewPass?"text":"password"} placeholder="Nueva contraseña (mín. 8 caracteres)" value={newPass} onChange={e => setNewPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{...inp,paddingRight:42}} />
                <button type="button" onClick={()=>setShowNewPass(v=>!v)} aria-label={showNewPass?"Ocultar contraseña":"Mostrar contraseña"} style={{position:"absolute",right:0,top:0,height:"100%",width:40,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:Dk.muted,padding:0,flexShrink:0}}>
                  {showNewPass ? <EyeOffIcon/> : <EyeIcon/>}
                </button>
              </div>
              <div style={{position:"relative"}}>
                <input type={showConfirmPass?"text":"password"} placeholder="Confirmar nueva contraseña" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{...inp,paddingRight:42}} />
                <button type="button" onClick={()=>setShowConfirmPass(v=>!v)} aria-label={showConfirmPass?"Ocultar contraseña":"Mostrar contraseña"} style={{position:"absolute",right:0,top:0,height:"100%",width:40,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:Dk.muted,padding:0,flexShrink:0}}>
                  {showConfirmPass ? <EyeOffIcon/> : <EyeIcon/>}
                </button>
              </div>
              {error && <div style={{padding:"8px 12px", borderRadius:8, background:THEME.errorBg18, border:"1px solid #e05a5a44", color:THEME.colorError2, fontSize:13}}>{error}</div>}
              <button onClick={handleSubmit} disabled={loading} style={{padding:"12px", borderRadius:10, border:"none", background:THEME.gradAccent, color:THEME.bgPage, fontFamily:sans, fontSize:14, fontWeight:700, cursor:"pointer", marginTop:4, opacity:loading?0.7:1}}>
                {loading ? "Actualizando…" : "Guardar contraseña →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
        _setUid(safeSession.id);
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
    _setUid(u.id);
    setUser(u);
    setActivePlan(PDB.getActivePlan(u.id));
    // Drain any queued sync ops now that we have a token
    SyncEngine._drain();
  };

  const handleLogout = async () => {
    // Sign out from Supabase (revokes server-side session)
    await SDB.signOut().catch(() => {});
    PDB.clearSession();
    _setUid("anon");
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
