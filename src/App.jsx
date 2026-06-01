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
-- ⚠ SEGURIDAD 2026-05-29: esta policy carece de WITH CHECK que restrinja columnas.
-- Riesgo potencial: un usuario autenticado puede hacer PATCH de su propia fila y
-- cambiar el campo `role` (ej: de 'user' a 'nutritionist') sin pasar por los RPC
-- de admin. Pendiente de endurecer en Supabase. Ver SQL propuesto en el PR de
-- seguridad Nivel 0.
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
import {
  FREEFORM_COMBOS,
  loadFreeFormCombos
} from "./data/FREEFORM_COMBOS";
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
  EMOJI_FONTS
} from "./ui/constants";
import { EyeIcon, EyeOffIcon } from "./ui/common/Icons";
import { Stepper }   from "./ui/common/Stepper";
import { DOBPicker } from "./ui/common/DOBPicker";
import { NutiMessage } from "./ui/common/NutiMessage";
import { AdBanner } from "./ui/common/AdBanner";






if (typeof window !== "undefined") {
  window.__NP_simpleHash       = simpleHash;
}




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




var FREEFORM_POOL_RESULT = loadFreeFormCombos(
  FREEFORM_COMBOS,
  validateFreeFormPool,
  { strict: true, healthRatioMin: 0.8 }
);

var FREEFORM_POOL = FREEFORM_POOL_RESULT.pool;



// ─── STEPPER ───────────────────────────────────────────────────────────────






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
  const [pass,       setPass]       = useState("");
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
            }
            localStorage.removeItem("np_remembered_pass"); // migración: borra contraseñas guardadas en sesiones previas
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
  const isAdmin = currentUser?.email === 'javivalmich@gmail.com'
    || currentUser?.role === 'admin';

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
      const _uid = currentUser.id;
      const {profile:pr, plan:pl, weekNum:wk, extras:ex} = loadData(_uid);
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
        const newPlan = __PERF.time("buildPlan:weekRollover", () => buildPlan(pr, kcal, {month:new Date().getMonth(),pastProteins:getPastProteinFrequency(loadMealMemory(_uid)),freeFormPool:FREEFORM_POOL,saveMealMemory:(wk,L,D)=>saveMealMemory(_uid,wk,L,D),weekNumber:getWeekNumber(),perf:__PERF}));  // PERF
        __TRACE.event("plan", "hydration:weekRollover", plan, newPlan);
        setPlan(newPlan); setWeekNum(currentWeek); setExtras({});
        saveData(_uid, pr, newPlan, currentWeek, {});
        // Also save to PDB
        PDB.addPlan(currentUser.id, { created_by:"system", strategy:newPlan.strategy, calories:kcal, profile:pr, days:newPlan.days, weekWarnings:newPlan.weekWarnings, weekScore:newPlan.weekScore, weekNum:currentWeek, extras:{} });
      }
    }
    var prog = loadProgress(currentUser.id);
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
      const uid = currentUser.id;  // capture before async yield
      const freshProfile = { ...profile, strategyOverride: null }; // immutable
      __TRACE.event("profile", "handleGenerate", profile, freshProfile);
      setProfile(freshProfile);
      __trace("setProfile queued", { weight: freshProfile.weight, age: freshProfile.age });

      // Yield to main thread → disabled button renders before CPU work
      await new Promise(resolve => setTimeout(resolve, 0));
      __trace("yield complete, starting buildPlan");
      __TRACE.log("handleGenerate:yield-complete");

      const newPlan = __PERF.time("buildPlan:handleGenerate", () => buildPlan(freshProfile, targetKcal, {month:new Date().getMonth(),pastProteins:getPastProteinFrequency(loadMealMemory(uid)),freeFormPool:FREEFORM_POOL,saveMealMemory:(wk,L,D)=>saveMealMemory(uid,wk,L,D),weekNumber:getWeekNumber(),perf:__PERF}));  // PERF
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
          saveData(uid, freshProfile, newPlan, wk, {});
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
    var newPlan=__PERF.time("buildPlan:checkin", () => buildPlan(newProfile,newKcal, {month:new Date().getMonth(),pastProteins:getPastProteinFrequency(loadMealMemory(currentUser.id)),freeFormPool:FREEFORM_POOL,saveMealMemory:(wk,L,D)=>saveMealMemory(currentUser.id,wk,L,D),weekNumber:getWeekNumber(),perf:__PERF}));  // PERF
    setPlan(newPlan); setWeekNum(wk); setExtras({}); setActiveDay(0);
    var pesoActualNum = parseFloat(checkin.pesoActual||"") || null;
    var prog = addWeekProgress(currentUser.id, wk, { peso:pesoActualNum, pesoInicial:pesoActualNum && progress.weeks.length===0 ? pesoActualNum : (progress.weeks[0]&&progress.weeks[0].pesoInicial) || pesoActualNum, adherencia:checkin.adherencia, energia:checkin.energia, hambre:checkin.hambre });
    setProgress(prog);
    var fb = getNutricionistaFeedback(prog, profile.goal, checkin);
    setNutriFeedback(fb);
    saveData(currentUser.id, newProfile,newPlan,wk,{});
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
    setPlan(newPlan); saveData(currentUser.id,profile,newPlan,weekNum,extras);
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
      const _redeemUid = currentUser.id;  // capture before microtask
      setPlan(newPlan);
      setWeekNum(wk);
      setActiveDay(0);
      setActiveTab("plan");
      Promise.resolve().then(() => {
        try {
          saveData(_redeemUid, freshProfile, newPlan, wk, {});
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
      clearData(uid);
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
    const newPlan=__PERF.time("buildPlan:regenerate", () => buildPlan(profile,targetKcal, {month:new Date().getMonth(),pastProteins:getPastProteinFrequency(loadMealMemory(currentUser.id)),freeFormPool:FREEFORM_POOL,saveMealMemory:(wk,L,D)=>saveMealMemory(currentUser.id,wk,L,D),weekNumber:getWeekNumber(),perf:__PERF}));  // PERF
    setPlan(newPlan); setWeekNum(wk); setActiveDay(0); setActiveTab("plan");
    saveData(currentUser.id,profile,newPlan,wk,{}); setExtras({}); setNavOpen(false);
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
    const rebuilt=__PERF.time("buildPlan:regenerateMeal", () => buildPlan(contextProfile, targetKcal, {month:new Date().getMonth(),pastProteins:getPastProteinFrequency(loadMealMemory(currentUser.id)),freeFormPool:FREEFORM_POOL,saveMealMemory:(wk,L,D)=>saveMealMemory(currentUser.id,wk,L,D),weekNumber:getWeekNumber(),perf:__PERF}));  // PERF
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
    setPlan(newPlan); saveData(currentUser.id,profile,newPlan,weekNum,extras); setSwapSemantic(null);
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
    const rebuilt = buildPlan(clonedProfile, targetKcal, {month:new Date().getMonth(),pastProteins:getPastProteinFrequency(loadMealMemory(currentUser.id)),freeFormPool:FREEFORM_POOL,saveMealMemory:(wk,L,D)=>saveMealMemory(currentUser.id,wk,L,D),weekNumber:getWeekNumber(),perf:__PERF});
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
      saveData(currentUser.id, profile, newPlan, weekNum, extras);
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
    saveData(currentUser.id, profile, newPlan, weekNum, extras);
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
    setExtras(updated); saveData(currentUser.id,profile,plan,weekNum,updated);
    setExtraInput({name:"",grams:""}); setSelectedFood(null); setSuggestions([]);
  };
  const removeExtra = (dayName,idx) => {
    const updated = Object.assign({}, extras, {[dayName]:dayExtras(dayName).filter(function(_,i){return i!==idx;})});
    setExtras(updated); saveData(currentUser.id,profile,plan,weekNum,updated);
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
      : __PERF.time("buildPlan:nutriEditor", () => buildPlan(c.profile, kcal, {month:new Date().getMonth(),pastProteins:getPastProteinFrequency(loadMealMemory(currentUser.id)),freeFormPool:FREEFORM_POOL,saveMealMemory:(wk,L,D)=>saveMealMemory(currentUser.id,wk,L,D),weekNumber:getWeekNumber(),perf:__PERF}));  // PERF
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
  const newPlan  = __PERF.time("buildPlan:removePatient", () => buildPlan(clientProf, kcal, {month:new Date().getMonth(),pastProteins:getPastProteinFrequency(loadMealMemory(clientId)),freeFormPool:FREEFORM_POOL,saveMealMemory:(wk,L,D)=>saveMealMemory(clientId,wk,L,D),weekNumber:getWeekNumber(),perf:__PERF}));  // PERF
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