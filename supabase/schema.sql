-- QueryLens schema
create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create type query_status as enum ('pending', 'running', 'completed', 'failed');

create table if not exists public.query_analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  raw_sql text not null,
  explain_output jsonb,
  ai_explanation text,
  optimized_query text,
  status query_status not null default 'pending',
  error text,
  created_at timestamptz not null default now()
);

create index if not exists query_analyses_user_id_idx on public.query_analyses(user_id);
create index if not exists query_analyses_created_at_idx on public.query_analyses(created_at desc);

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

create policy "analyses owner read" on public.query_analyses
  for select using (auth.uid() = user_id);

create policy "analyses owner insert" on public.query_analyses
  for insert with check (auth.uid() = user_id);

create policy "analyses owner delete" on public.query_analyses
  for delete using (auth.uid() = user_id);
