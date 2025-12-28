-- Create chatbots table
create table if not exists public.chatbots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  goal text,
  description text not null,
  tone text default 'professional',
  model text not null,
  status text default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.chatbots enable row level security;

-- Policies
create policy "chatbots_select_own" on public.chatbots for select using (auth.uid() = user_id);
create policy "chatbots_insert_own" on public.chatbots for insert with check (auth.uid() = user_id);
create policy "chatbots_update_own" on public.chatbots for update using (auth.uid() = user_id);
create policy "chatbots_delete_own" on public.chatbots for delete using (auth.uid() = user_id);
