-- Run this in the Supabase SQL editor to add Gmail auto-import support.
-- Safe to re-run; everything is `if not exists`.

create table if not exists public.gmail_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- Track which Gmail message IDs we've already imported, so re-syncing
-- the same window doesn't duplicate jobs. One row per imported message.
create table if not exists public.gmail_imported_messages (
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id text not null,
  job_id uuid references public.jobs(id) on delete set null,
  imported_at timestamptz not null default now(),
  primary key (user_id, message_id)
);

alter table public.gmail_connections enable row level security;
alter table public.gmail_imported_messages enable row level security;

do $$ begin
  create policy "gmail_connections user-scoped" on public.gmail_connections
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "gmail_imported_messages user-scoped" on public.gmail_imported_messages
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
