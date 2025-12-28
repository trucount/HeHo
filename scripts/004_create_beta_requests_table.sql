-- Create beta requests table
create table if not exists public.beta_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  email text not null,
  company text,
  role text,
  reason text not null,
  status text default 'pending',
  created_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.beta_requests enable row level security;

-- Allow users to insert their own requests and view status
create policy "beta_requests_select_own" on public.beta_requests for select using (auth.uid() = user_id);
create policy "beta_requests_insert_own" on public.beta_requests for insert with check (auth.uid() = user_id);
