-- Summer Tracker schema. Run this once in the Supabase SQL editor.
-- All tables are user-scoped via auth.uid() and protected by RLS.

create extension if not exists "pgcrypto";

-- ---------- jobs ----------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  title text not null,
  location text,
  url text,
  status text not null default 'applied'
    check (status in ('applied','phone_screen','interview','offer','rejected','ghosted','withdrew')),
  source text,
  notes text,
  salary text,
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists jobs_user_applied_at_idx on public.jobs (user_id, applied_at desc);

-- ---------- leetcode_problems ----------
create table if not exists public.leetcode_problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null,
  difficulty text check (difficulty in ('Easy','Medium','Hard')),
  topics text[],
  url text,
  solved_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual','sync')),
  runtime_ms integer,
  notes text,
  unique (user_id, slug, solved_at)
);
create index if not exists lc_user_solved_at_idx on public.leetcode_problems (user_id, solved_at desc);

-- ---------- projects ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active','paused','shipped','archived')),
  repo_url text,
  live_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects (user_id, updated_at desc);

-- ---------- daily_logs ----------
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  summary text,
  highlights text,
  hours_focused numeric(4,1),
  mood smallint check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);
create index if not exists daily_user_day_idx on public.daily_logs (user_id, day desc);

-- ---------- RLS ----------
alter table public.jobs enable row level security;
alter table public.leetcode_problems enable row level security;
alter table public.projects enable row level security;
alter table public.daily_logs enable row level security;

-- Policies: each user can only see and edit their own rows.
do $$ begin
  create policy "jobs are user-scoped" on public.jobs
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "leetcode is user-scoped" on public.leetcode_problems
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "projects are user-scoped" on public.projects
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "daily_logs are user-scoped" on public.daily_logs
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
