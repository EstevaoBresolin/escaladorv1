-- Create volunteer_unavailability table for tracking days volunteers cannot help
-- Volunteers can mark specific dates when they are unavailable
-- By default, they are available on all other days

create table if not exists public.volunteer_unavailability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  unavailable_date date not null,
  reason text,
  created_at timestamp with time zone default now(),
  unique(user_id, unavailable_date)
);

-- Enable Row Level Security
alter table public.volunteer_unavailability enable row level security;

-- RLS Policies for volunteer_unavailability
create policy "Users can view unavailability from their church" on public.volunteer_unavailability
  for select using (
    user_id in (
      select id from public.profiles where church_id in (
        select church_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Users can manage their own unavailability" on public.volunteer_unavailability
  for insert with check (user_id = auth.uid());

create policy "Users can update their own unavailability" on public.volunteer_unavailability
  for update using (user_id = auth.uid());

create policy "Users can delete their own unavailability" on public.volunteer_unavailability
  for delete using (user_id = auth.uid());

-- Leaders and admins can view all unavailability in their church
create policy "Leaders can view all unavailability" on public.volunteer_unavailability
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('admin', 'leader')
      and church_id in (
        select church_id from public.profiles where id = volunteer_unavailability.user_id
      )
    )
  );

-- Create index for better performance
create index if not exists idx_volunteer_unavailability_user_id on public.volunteer_unavailability(user_id);
create index if not exists idx_volunteer_unavailability_date on public.volunteer_unavailability(unavailable_date);
