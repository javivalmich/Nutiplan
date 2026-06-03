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
