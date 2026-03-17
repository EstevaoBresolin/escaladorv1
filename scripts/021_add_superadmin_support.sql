-- Adiciona a role superadmin.
-- As policies globais desta migration foram revertidas porque causavam
-- recursao infinita em public.profiles quando aplicadas junto do RLS atual.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('superadmin', 'admin', 'leader', 'volunteer', 'member'));

create policy "Superadmins can view all churches" on public.churches
  for select using (false);

create policy "Superadmins can update churches" on public.churches
  for update using (false)
  with check (false);

create policy "Superadmins can view all profiles" on public.profiles
  for select using (false);

create policy "Superadmins can update profiles" on public.profiles
  for update using (false)
  with check (false);

create policy "Superadmins can view all ministries" on public.ministries
  for select using (false);

create policy "Superadmins can view all user ministries" on public.user_ministries
  for select using (false);

create policy "Superadmins can view all ministry leaders" on public.ministry_leaders
  for select using (false);