-- Fix RLS policies for user_ministries to allow admins and leaders to add/remove members

-- Drop existing insert policy
drop policy if exists "Users can join ministries" on public.user_ministries;

-- Drop existing delete policy
drop policy if exists "Users can leave ministries" on public.user_ministries;

-- Create new insert policy that allows:
-- 1. Users to add themselves
-- 2. Admins and leaders to add any user from their church
create policy "Users and admins can add members to ministries" on public.user_ministries
  for insert with check (
    user_id = auth.uid() 
    or 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('admin', 'leader')
      and church_id in (
        select church_id from public.ministries where id = ministry_id
      )
    )
  );

-- Create new delete policy that allows:
-- 1. Users to remove themselves
-- 2. Admins and leaders to remove any user from their church ministries
create policy "Users and admins can remove members from ministries" on public.user_ministries
  for delete using (
    user_id = auth.uid() 
    or 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('admin', 'leader')
      and church_id in (
        select church_id from public.ministries where id = ministry_id
      )
    )
  );
