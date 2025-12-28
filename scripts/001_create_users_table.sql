-- Create users table with all necessary fields
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  plan text default 'free',
  openrouter_key_encrypted text,
  supabase_url text,
  supabase_key_encrypted text,
  supabase_permissions jsonb default '{
    "can_read": true,
    "can_insert": true,
    "can_create": false,
    "can_delete": false
  }'::jsonb,
  setup_completed boolean default false
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies for users to access their own data
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
