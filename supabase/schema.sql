-- ============================================================
-- NwSSU Campus Tour — Supabase schema
-- Paste this whole file into the Supabase SQL Editor and run it
-- once, on a fresh project. Run seed.sql afterward to load the
-- existing campus data.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. PROFILES  (extends auth.users with an app-level role)
-- ------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'One row per Supabase Auth user. role drives admin-only access via RLS.';

-- ------------------------------------------------------------
-- 2. DEPARTMENTS  (the 7 colleges)
-- ------------------------------------------------------------
create table public.departments (
  id            text primary key,               -- slug, e.g. 'ccis'
  name          text not null,
  abbr          text not null unique,
  color         text,
  photo         text,
  programs      text[] not null default '{}',
  faculty       text[] not null default '{}',
  officers      text[] not null default '{}',
  organizations text[] not null default '{}',    -- display list only; real rows live in public.organizations
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. BUILDINGS
-- ------------------------------------------------------------
create table public.buildings (
  id             text primary key,               -- slug, e.g. 'ccis', 'library'
  name           text not null,
  abbr           text not null,
  type           text not null check (type in ('academic', 'admin', 'facility')),
  color          text,
  emoji          text,
  lat            double precision,
  lng            double precision,
  photo          text,
  description    text,
  location       text,
  hours          text,
  offices        text[] not null default '{}',   -- short display list ("offices inside")
  programs       text[] not null default '{}',
  department_id  text references public.departments (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_buildings_type on public.buildings (type);
create index idx_buildings_department_id on public.buildings (department_id);

-- ------------------------------------------------------------
-- 4. OFFICES  (standalone admin offices, e.g. Registrar, HR)
-- ------------------------------------------------------------
create table public.offices (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,             -- used as the AR waypoint key
  name         text not null,
  icon         text,
  location     text,
  hours        text,
  photo        text,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. ORGANIZATIONS  (student orgs / councils)
-- ------------------------------------------------------------
create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  abbr          text unique,
  college_abbr  text,                            -- e.g. 'CCIS' or 'University-Wide' — not a hard FK, see note below
  president     text,
  vp            text,
  secretary     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_organizations_college_abbr on public.organizations (college_abbr);

-- Note: college_abbr is intentionally plain text, not a foreign key to
-- departments.abbr. The existing data uses the literal value
-- 'University-Wide' for campus-wide organizations, which has no matching
-- department row, so a strict FK would reject valid existing data.

-- ------------------------------------------------------------
-- 6. AR_WAYPOINTS  (replaces the hand-edited arDestinations.js file)
-- ------------------------------------------------------------
create table public.ar_waypoints (
  id                uuid primary key default gen_random_uuid(),
  destination_key   text not null unique,   -- building/department id, or an office slug
  display_name      text not null,
  lat               double precision,
  lng               double precision,
  updated_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 7. ACTIVITY_LOG  (replaces the browser-local admin activity feed)
-- ------------------------------------------------------------
create table public.activity_log (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid references public.profiles (id) on delete set null,
  action        text not null check (action in ('created', 'updated', 'deleted')),
  entity        text not null,             -- 'Building' | 'Department' | 'Office' | 'Organization'
  record_label  text,
  created_at    timestamptz not null default now()
);

create index idx_activity_log_created_at on public.activity_log (created_at desc);
create index idx_activity_log_entity on public.activity_log (entity);

-- ============================================================
-- updated_at trigger (shared by every table that has the column)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at      before update on public.profiles      for each row execute function public.set_updated_at();
create trigger trg_departments_updated_at   before update on public.departments   for each row execute function public.set_updated_at();
create trigger trg_buildings_updated_at     before update on public.buildings     for each row execute function public.set_updated_at();
create trigger trg_offices_updated_at       before update on public.offices       for each row execute function public.set_updated_at();
create trigger trg_organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger trg_ar_waypoints_updated_at  before update on public.ar_waypoints  for each row execute function public.set_updated_at();

-- ============================================================
-- Auth wiring: auto-create a profile row for every new signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'user');
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- is_admin() helper — used by RLS policies below.
-- security definer + fixed search_path avoids the RLS-recursion
-- problem you'd get by querying public.profiles from its own policy.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Prevent a non-admin from promoting themselves (or anyone else) to admin
-- by editing their own profile row through the "users manage own profile" policy.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an admin can change a profile role.';
  end if;
  return new;
end;
$$;

create trigger trg_profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ============================================================
-- Activity logging — automatic, via triggers, so the app never
-- has to remember to write a log row itself.
-- ============================================================
create or replace function public.log_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_entity text;
  v_label  text;
  v_action text;
begin
  v_entity := case tg_table_name
    when 'buildings' then 'Building'
    when 'departments' then 'Department'
    when 'offices' then 'Office'
    when 'organizations' then 'Organization'
    else tg_table_name
  end;

  v_action := case tg_op
    when 'INSERT' then 'created'
    when 'UPDATE' then 'updated'
    when 'DELETE' then 'deleted'
  end;

  v_label := coalesce(
    (case when tg_op = 'DELETE' then old.name else new.name end),
    (case when tg_op = 'DELETE' then old.id::text else new.id::text end)
  );

  insert into public.activity_log (admin_id, action, entity, record_label)
  values (auth.uid(), v_action, v_entity, v_label);

  return coalesce(new, old);
end;
$$;

create trigger trg_log_buildings     after insert or update or delete on public.buildings     for each row execute function public.log_activity();
create trigger trg_log_departments   after insert or update or delete on public.departments   for each row execute function public.log_activity();
create trigger trg_log_offices       after insert or update or delete on public.offices        for each row execute function public.log_activity();
create trigger trg_log_organizations after insert or update or delete on public.organizations  for each row execute function public.log_activity();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.departments   enable row level security;
alter table public.buildings     enable row level security;
alter table public.offices       enable row level security;
alter table public.organizations enable row level security;
alter table public.ar_waypoints  enable row level security;
alter table public.activity_log  enable row level security;

-- ---- profiles: users see/update their own row; admins see all ----
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());
-- Role changes are still blocked for non-admins by the
-- trg_profiles_prevent_role_escalation trigger above.

-- ---- content tables: public read, admin-only write ----
-- The User Dashboard has no login, so anon (and authenticated) both need
-- SELECT. Only an authenticated admin may INSERT/UPDATE/DELETE.

create policy "departments_public_read" on public.departments for select using (true);
create policy "departments_admin_write" on public.departments for insert with check (public.is_admin());
create policy "departments_admin_update" on public.departments for update using (public.is_admin()) with check (public.is_admin());
create policy "departments_admin_delete" on public.departments for delete using (public.is_admin());

create policy "buildings_public_read" on public.buildings for select using (true);
create policy "buildings_admin_write" on public.buildings for insert with check (public.is_admin());
create policy "buildings_admin_update" on public.buildings for update using (public.is_admin()) with check (public.is_admin());
create policy "buildings_admin_delete" on public.buildings for delete using (public.is_admin());

create policy "offices_public_read" on public.offices for select using (true);
create policy "offices_admin_write" on public.offices for insert with check (public.is_admin());
create policy "offices_admin_update" on public.offices for update using (public.is_admin()) with check (public.is_admin());
create policy "offices_admin_delete" on public.offices for delete using (public.is_admin());

create policy "organizations_public_read" on public.organizations for select using (true);
create policy "organizations_admin_write" on public.organizations for insert with check (public.is_admin());
create policy "organizations_admin_update" on public.organizations for update using (public.is_admin()) with check (public.is_admin());
create policy "organizations_admin_delete" on public.organizations for delete using (public.is_admin());

create policy "ar_waypoints_public_read" on public.ar_waypoints for select using (true);
create policy "ar_waypoints_admin_write" on public.ar_waypoints for insert with check (public.is_admin());
create policy "ar_waypoints_admin_update" on public.ar_waypoints for update using (public.is_admin()) with check (public.is_admin());
create policy "ar_waypoints_admin_delete" on public.ar_waypoints for delete using (public.is_admin());

-- ---- activity_log: admin-only, read-only from the app's point of view ----
-- (rows are written exclusively by the log_activity() trigger, which runs
-- as security definer, so no client-facing INSERT policy is needed)
create policy "activity_log_admin_read" on public.activity_log for select using (public.is_admin());

-- ============================================================
-- Done. Next: run seed.sql, then promote your own account:
--   update public.profiles set role = 'admin' where id = '<your-auth-uid>';
-- ============================================================
