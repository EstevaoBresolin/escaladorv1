-- GoMinistry Database Schema
-- This script creates all necessary tables for the church ministry scheduling SaaS

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Churches table
create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. User profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  church_id uuid references public.churches(id) on delete set null,
  role text not null default 'volunteer' check (role in ('admin', 'leader', 'volunteer')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Ministries table
create table if not exists public.ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text default '#3B82F6',
  church_id uuid not null references public.churches(id) on delete cascade,
  leader_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. User-Ministry relationship (many-to-many)
create table if not exists public.user_ministries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ministry_id uuid not null references public.ministries(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(user_id, ministry_id)
);

-- 5. Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time,
  location text,
  church_id uuid not null references public.churches(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 6. Event-Ministry relationship (which ministries serve at which events)
create table if not exists public.event_ministries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ministry_id uuid not null references public.ministries(id) on delete cascade,
  unique(event_id, ministry_id)
);

-- 7. Volunteer slots (scheduling volunteers for events)
create table if not exists public.volunteer_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ministry_id uuid not null references public.ministries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'absent')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(event_id, ministry_id, user_id)
);

-- 8. Notifications table (for future WhatsApp integration)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'warning', 'success', 'error')),
  read boolean default false,
  sent_via text check (sent_via in ('app', 'whatsapp', 'email')),
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security on all tables
alter table public.churches enable row level security;
alter table public.profiles enable row level security;
alter table public.ministries enable row level security;
alter table public.user_ministries enable row level security;
alter table public.events enable row level security;
alter table public.event_ministries enable row level security;
alter table public.volunteer_slots enable row level security;
alter table public.notifications enable row level security;

-- RLS Policies for churches
create policy "Users can view their own church" on public.churches
  for select using (
    id in (select church_id from public.profiles where id = auth.uid())
  );

create policy "Admins can update their church" on public.churches
  for update using (
    id in (select church_id from public.profiles where id = auth.uid() and role = 'admin')
  );

-- RLS Policies for profiles
create policy "Users can view profiles from their church" on public.profiles
  for select using (
    church_id in (select church_id from public.profiles where id = auth.uid())
    or id = auth.uid()
  );

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- RLS Policies for ministries
create policy "Users can view ministries from their church" on public.ministries
  for select using (
    church_id in (select church_id from public.profiles where id = auth.uid())
  );

create policy "Admins and leaders can insert ministries" on public.ministries
  for insert with check (
    church_id in (select church_id from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
  );

create policy "Admins and leaders can update ministries" on public.ministries
  for update using (
    church_id in (select church_id from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
  );

create policy "Admins can delete ministries" on public.ministries
  for delete using (
    church_id in (select church_id from public.profiles where id = auth.uid() and role = 'admin')
  );

-- RLS Policies for user_ministries
create policy "Users can view user_ministries from their church" on public.user_ministries
  for select using (
    ministry_id in (
      select id from public.ministries where church_id in (
        select church_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Users can join ministries" on public.user_ministries
  for insert with check (user_id = auth.uid());

create policy "Users can leave ministries" on public.user_ministries
  for delete using (user_id = auth.uid());

-- RLS Policies for events
create policy "Users can view events from their church" on public.events
  for select using (
    church_id in (select church_id from public.profiles where id = auth.uid())
  );

create policy "Admins and leaders can create events" on public.events
  for insert with check (
    church_id in (select church_id from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
  );

create policy "Admins and leaders can update events" on public.events
  for update using (
    church_id in (select church_id from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
  );

create policy "Admins can delete events" on public.events
  for delete using (
    church_id in (select church_id from public.profiles where id = auth.uid() and role = 'admin')
  );

-- RLS Policies for event_ministries
create policy "Users can view event_ministries from their church" on public.event_ministries
  for select using (
    event_id in (
      select id from public.events where church_id in (
        select church_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Admins and leaders can manage event_ministries" on public.event_ministries
  for all using (
    event_id in (
      select id from public.events where church_id in (
        select church_id from public.profiles where id = auth.uid() and role in ('admin', 'leader')
      )
    )
  );

-- RLS Policies for volunteer_slots
create policy "Users can view volunteer_slots from their church" on public.volunteer_slots
  for select using (
    event_id in (
      select id from public.events where church_id in (
        select church_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Users can volunteer themselves" on public.volunteer_slots
  for insert with check (user_id = auth.uid());

create policy "Users can update their own volunteer status" on public.volunteer_slots
  for update using (user_id = auth.uid());

create policy "Leaders can manage volunteer slots in their ministries" on public.volunteer_slots
  for all using (
    ministry_id in (
      select id from public.ministries where leader_id = auth.uid()
    )
  );

-- RLS Policies for notifications
create policy "Users can view their own notifications" on public.notifications
  for select using (user_id = auth.uid());

create policy "Users can update their own notifications" on public.notifications
  for update using (user_id = auth.uid());

-- Create indexes for better performance
create index if not exists idx_profiles_church_id on public.profiles(church_id);
create index if not exists idx_ministries_church_id on public.ministries(church_id);
create index if not exists idx_events_church_id on public.events(church_id);
create index if not exists idx_events_date on public.events(date);
create index if not exists idx_volunteer_slots_event_id on public.volunteer_slots(event_id);
create index if not exists idx_volunteer_slots_user_id on public.volunteer_slots(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
