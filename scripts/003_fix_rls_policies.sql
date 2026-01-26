-- Fix infinite recursion in profiles RLS policy
-- The issue: profiles policy was referencing profiles table, causing infinite recursion

-- Drop existing problematic policies
drop policy if exists "Users can view their own church" on public.churches;
drop policy if exists "Admins can update their church" on public.churches;
drop policy if exists "Users can view profiles from their church" on public.profiles;
drop policy if exists "Users can view ministries from their church" on public.ministries;
drop policy if exists "Admins and leaders can insert ministries" on public.ministries;
drop policy if exists "Admins and leaders can update ministries" on public.ministries;
drop policy if exists "Admins can delete ministries" on public.ministries;
drop policy if exists "Users can view user_ministries from their church" on public.user_ministries;
drop policy if exists "Users can view events from their church" on public.events;
drop policy if exists "Admins and leaders can create events" on public.events;
drop policy if exists "Admins and leaders can update events" on public.events;
drop policy if exists "Admins can delete events" on public.events;
drop policy if exists "Users can view event_ministries from their church" on public.event_ministries;
drop policy if exists "Admins and leaders can manage event_ministries" on public.event_ministries;
drop policy if exists "Users can view volunteer_slots from their church" on public.volunteer_slots;
drop policy if exists "Leaders can manage volunteer slots in their ministries" on public.volunteer_slots;

-- Create a security definer function to get user's church_id without triggering RLS
create or replace function public.get_user_church_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select church_id from public.profiles where id = auth.uid()
$$;

-- Create a security definer function to get user's role without triggering RLS
create or replace function public.get_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- RLS Policies for profiles (fixed - no recursion)
create policy "Users can view their own profile" on public.profiles
  for select using (id = auth.uid());

create policy "Users can view profiles from same church" on public.profiles
  for select using (church_id = public.get_user_church_id());

-- RLS Policies for churches (using the security definer function)
create policy "Users can view their own church" on public.churches
  for select using (id = public.get_user_church_id());

create policy "Admins can update their church" on public.churches
  for update using (
    id = public.get_user_church_id() and public.get_user_role() = 'admin'
  );

create policy "Admins can insert churches" on public.churches
  for insert with check (true);

-- RLS Policies for ministries (using the security definer function)
create policy "Users can view ministries from their church" on public.ministries
  for select using (church_id = public.get_user_church_id());

create policy "Admins and leaders can insert ministries" on public.ministries
  for insert with check (
    church_id = public.get_user_church_id() and public.get_user_role() in ('admin', 'leader')
  );

create policy "Admins and leaders can update ministries" on public.ministries
  for update using (
    church_id = public.get_user_church_id() and public.get_user_role() in ('admin', 'leader')
  );

create policy "Admins can delete ministries" on public.ministries
  for delete using (
    church_id = public.get_user_church_id() and public.get_user_role() = 'admin'
  );

-- RLS Policies for user_ministries
create policy "Users can view user_ministries from their church" on public.user_ministries
  for select using (
    ministry_id in (select id from public.ministries where church_id = public.get_user_church_id())
  );

-- RLS Policies for events
create policy "Users can view events from their church" on public.events
  for select using (church_id = public.get_user_church_id());

create policy "Admins and leaders can create events" on public.events
  for insert with check (
    church_id = public.get_user_church_id() and public.get_user_role() in ('admin', 'leader')
  );

create policy "Admins and leaders can update events" on public.events
  for update using (
    church_id = public.get_user_church_id() and public.get_user_role() in ('admin', 'leader')
  );

create policy "Admins can delete events" on public.events
  for delete using (
    church_id = public.get_user_church_id() and public.get_user_role() = 'admin'
  );

-- RLS Policies for event_ministries
create policy "Users can view event_ministries from their church" on public.event_ministries
  for select using (
    event_id in (select id from public.events where church_id = public.get_user_church_id())
  );

create policy "Admins and leaders can manage event_ministries" on public.event_ministries
  for all using (
    event_id in (select id from public.events where church_id = public.get_user_church_id())
    and public.get_user_role() in ('admin', 'leader')
  );

-- RLS Policies for volunteer_slots
create policy "Users can view volunteer_slots from their church" on public.volunteer_slots
  for select using (
    event_id in (select id from public.events where church_id = public.get_user_church_id())
  );

create policy "Leaders can manage volunteer slots in their ministries" on public.volunteer_slots
  for all using (
    ministry_id in (select id from public.ministries where leader_id = auth.uid())
    or public.get_user_role() = 'admin'
  );
