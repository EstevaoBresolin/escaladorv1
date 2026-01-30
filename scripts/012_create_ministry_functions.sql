-- Create ministry_functions table to store roles/functions inside a ministry

create table if not exists public.ministry_functions (
  id uuid primary key default gen_random_uuid(),
  ministry_id uuid not null references public.ministries(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(ministry_id, name)
);

-- Add function_id to volunteer_slots
alter table public.volunteer_slots
  add column if not exists function_id uuid references public.ministry_functions(id) on delete set null;

-- Enable RLS
alter table public.ministry_functions enable row level security;

-- Policies for ministry_functions
create policy "Users can view ministry functions from their church" on public.ministry_functions
  for select using (
    ministry_id in (
      select id from public.ministries where church_id in (
        select church_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Admins and ministry leaders can manage ministry functions" on public.ministry_functions
  for all using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
    or public.is_ministry_leader(auth.uid(), ministry_id)
  )
  with check (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
    or public.is_ministry_leader(auth.uid(), ministry_id)
  );

-- Indexes
create index if not exists idx_ministry_functions_ministry_id on public.ministry_functions(ministry_id);
create index if not exists idx_volunteer_slots_function_id on public.volunteer_slots(function_id);
