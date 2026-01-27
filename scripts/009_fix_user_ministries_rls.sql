-- Fix user_ministries RLS policies
-- Usuarios: visualizam ministerios e eventos, podem adicionar indisponibilidade
-- Admin: pode fazer tudo

-- Drop ALL existing policies on user_ministries
drop policy if exists "Users can view user_ministries from their church" on public.user_ministries;
drop policy if exists "Users can join ministries" on public.user_ministries;
drop policy if exists "Users can leave ministries" on public.user_ministries;
drop policy if exists "Users and admins can add members to ministries" on public.user_ministries;
drop policy if exists "Users and admins can remove members from ministries" on public.user_ministries;

-- SELECT: Users can view user_ministries from their church
create policy "Users can view user_ministries from their church" on public.user_ministries
  for select using (
    ministry_id in (
      select id from public.ministries where church_id in (
        select church_id from public.profiles where id = auth.uid()
      )
    )
  );

-- INSERT: Only admins can add members to ministries
create policy "Admins can add members to ministries" on public.user_ministries
  for insert with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'admin'
      and church_id in (
        select church_id from public.ministries where id = ministry_id
      )
    )
  );

-- UPDATE: Only admins can update user_ministries
create policy "Admins can update user_ministries" on public.user_ministries
  for update using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'admin'
      and church_id in (
        select church_id from public.ministries where id = ministry_id
      )
    )
  );

-- DELETE: Only admins can remove members from ministries
create policy "Admins can remove members from ministries" on public.user_ministries
  for delete using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'admin'
      and church_id in (
        select church_id from public.ministries where id = ministry_id
      )
    )
  );
