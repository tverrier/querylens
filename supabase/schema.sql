-- QueryLens schema (canonical)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.query_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_sql text not null,
  explain_output jsonb,
  execution_tree jsonb,
  ai_explanation text,
  ai_bottlenecks jsonb default '[]'::jsonb,
  optimized_query text,
  estimated_improvement text,
  index_suggestions jsonb default '[]'::jsonb,
  planner_insights text,
  status text not null default 'pending'
    check (status in ('pending','processing','complete','error','degraded')),
  error_message text,
  share_token text unique default encode(gen_random_bytes(16),'hex'),
  processing_time_ms int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists query_analyses_user_id_idx on public.query_analyses(user_id);
create index if not exists query_analyses_created_at_idx on public.query_analyses(created_at desc);
create index if not exists query_analyses_share_token_idx on public.query_analyses(share_token);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists query_analyses_set_updated_at on public.query_analyses;
create trigger query_analyses_set_updated_at
  before update on public.query_analyses
  for each row execute function public.set_updated_at();

-- Auto-create users row on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.users enable row level security;
alter table public.query_analyses enable row level security;

create policy "users self read" on public.users
  for select using (auth.uid() = id);

create policy "analyses owner all" on public.query_analyses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "analyses share read" on public.query_analyses
  for select using (share_token is not null);
