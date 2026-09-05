
-- =========================================================
-- RewardKu V11 - Supabase database
-- Server-authoritative points, mission claims, redemptions
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Pengguna RewardKu',
  public_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- MISSIONS ----------
create table if not exists public.missions (
  id text primary key,
  name text not null,
  description text not null default '',
  reward integer not null check (reward > 0),
  daily boolean not null default true,
  active boolean not null default true
);

insert into public.missions (id, name, description, reward, daily)
values
  ('iklan', 'Melihat Iklan', 'Tonton iklan dan dapatkan poin.', 20, true),
  ('novel', 'Baca Novel', 'Baca novel dan dapatkan poin.', 30, true),
  ('game', 'Mainkan Game', 'Mainkan game pilihan dan raih poin.', 25, true),
  ('shortvideo', 'Menonton Short Video', 'Tonton video pendek dan dapatkan poin.', 20, true),
  ('login', 'Login Harian', 'Bonus login harian.', 10, true),
  ('survey', 'Survei Singkat', 'Isi survei sederhana dan dapatkan poin.', 40, true),
  ('share', 'Bagikan RewardKu', 'Bagikan aplikasi kepada teman.', 50, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  reward = excluded.reward,
  daily = excluded.daily;

-- ---------- POINT TRANSACTIONS ----------
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('mission','redemption','adjustment','bonus')),
  reference_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists point_transactions_user_created_idx
  on public.point_transactions(user_id, created_at desc);

-- ---------- MISSION CLAIMS ----------
create table if not exists public.mission_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null references public.missions(id),
  claim_date date not null default current_date,
  reward integer not null check (reward > 0),
  created_at timestamptz not null default now(),
  unique (user_id, mission_id, claim_date)
);

create index if not exists mission_claims_user_date_idx
  on public.mission_claims(user_id, claim_date desc);

-- ---------- REDEMPTIONS ----------
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_name text not null,
  reward_code text not null,
  cost integer not null check (cost > 0),
  status text not null default 'pending'
    check (status in ('pending','approved','fulfilled','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists redemptions_user_created_idx
  on public.redemptions(user_id, created_at desc);

-- ---------- TIMESTAMP TRIGGER ----------
create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_profile_updated_at();

-- ---------- NEW USER PROFILE ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  code := 'RWK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.profiles (id, display_name, public_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Pengguna RewardKu'),
    code
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- BALANCE ----------
create or replace function public.get_my_balance()
returns integer
language sql
security invoker
set search_path = public
as $$
  select coalesce(sum(amount), 0)::integer
  from public.point_transactions
  where user_id = auth.uid();
$$;

-- ---------- CLAIM MISSION ----------
create or replace function public.claim_mission(p_mission_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.missions;
begin
  if auth.uid() is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  select *
  into m
  from public.missions
  where id = p_mission_id
    and active = true;

  if not found then
    raise exception 'MISSION_NOT_FOUND';
  end if;

  if m.daily and exists (
    select 1
    from public.mission_claims
    where user_id = auth.uid()
      and mission_id = m.id
      and claim_date = current_date
  ) then
    raise exception 'ALREADY_CLAIMED';
  end if;

  insert into public.mission_claims (
    user_id, mission_id, claim_date, reward
  )
  values (
    auth.uid(), m.id, current_date, m.reward
  );

  insert into public.point_transactions (
    user_id, amount, type, reference_id, note
  )
  values (
    auth.uid(),
    m.reward,
    'mission',
    m.id,
    m.name
  );

  return jsonb_build_object(
    'ok', true,
    'mission_id', m.id,
    'reward', m.reward
  );
end;
$$;

-- ---------- REDEEM REWARD ----------
create or replace function public.redeem_reward(
  p_reward_name text,
  p_reward_code text,
  p_cost integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  balance integer;
  redemption_id uuid;
begin
  if auth.uid() is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  if p_cost <= 0 then
    raise exception 'INVALID_COST';
  end if;

  select public.get_my_balance() into balance;

  if balance < p_cost then
    raise exception 'INSUFFICIENT_POINTS';
  end if;

  insert into public.redemptions (
    user_id, reward_name, reward_code, cost, status
  )
  values (
    auth.uid(),
    p_reward_name,
    p_reward_code,
    p_cost,
    'pending'
  )
  returning id into redemption_id;

  insert into public.point_transactions (
    user_id, amount, type, reference_id, note
  )
  values (
    auth.uid(),
    -p_cost,
    'redemption',
    redemption_id::text,
    p_reward_name
  );

  return jsonb_build_object(
    'ok', true,
    'redemption_id', redemption_id,
    'new_balance', balance - p_cost
  );
end;
$$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.point_transactions enable row level security;
alter table public.mission_claims enable row level security;
alter table public.redemptions enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "missions_public_select" on public.missions;
create policy "missions_public_select"
on public.missions
for select
to anon, authenticated
using (active = true);

drop policy if exists "points_self_select" on public.point_transactions;
create policy "points_self_select"
on public.point_transactions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "claims_self_select" on public.mission_claims;
create policy "claims_self_select"
on public.mission_claims
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "redemptions_self_select" on public.redemptions;
create policy "redemptions_self_select"
on public.redemptions
for select
to authenticated
using (user_id = auth.uid());

-- RPCs are intended to be called by authenticated users.
revoke all on function public.get_my_balance() from public;
grant execute on function public.get_my_balance() to authenticated;

revoke all on function public.claim_mission(text) from public;
grant execute on function public.claim_mission(text) to authenticated;

revoke all on function public.redeem_reward(text, text, integer) from public;
grant execute on function public.redeem_reward(text, text, integer) to authenticated;

-- Data API privileges for authenticated reads/RPCs.
grant select on public.profiles, public.missions, public.point_transactions,
  public.mission_claims, public.redemptions to authenticated;

-- IMPORTANT:
-- Never expose Supabase service_role keys in the browser.
