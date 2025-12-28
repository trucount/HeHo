-- Create usage tracking table
create table if not exists public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  month date not null,
  messages integer default 0,
  tokens integer default 0,
  api_calls integer default 0,
  db_reads integer default 0,
  db_writes integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, month)
);

-- Enable RLS
alter table public.usage enable row level security;

-- Policies
create policy "usage_select_own" on public.usage for select using (auth.uid() = user_id);
create policy "usage_insert_own" on public.usage for insert with check (auth.uid() = user_id);
create policy "usage_update_own" on public.usage for update using (auth.uid() = user_id);
