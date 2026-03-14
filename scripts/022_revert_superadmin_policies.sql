-- Reverte as policies da migration 021 que causavam recursao infinita em public.profiles.
-- Aplique esta migration imediatamente em qualquer ambiente onde a 021 ja foi executada.

drop policy if exists "Superadmins can view all churches" on public.churches;
drop policy if exists "Superadmins can update churches" on public.churches;
drop policy if exists "Superadmins can view all profiles" on public.profiles;
drop policy if exists "Superadmins can update profiles" on public.profiles;
drop policy if exists "Superadmins can view all ministries" on public.ministries;
drop policy if exists "Superadmins can view all user ministries" on public.user_ministries;
drop policy if exists "Superadmins can view all ministry leaders" on public.ministry_leaders;

-- Mantem apenas o suporte ao valor da role, sem abrir acesso global por policy.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('superadmin', 'admin', 'leader', 'volunteer', 'member'));