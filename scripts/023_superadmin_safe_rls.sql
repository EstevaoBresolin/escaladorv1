-- Superadmin seguro sem recursao de policy em public.profiles.
-- Pre-requisito: 022_revert_superadmin_policies.sql aplicado.

-- 1) Garantir helper de role com SECURITY DEFINER.
-- Evita repetir subquery em cada policy e centraliza a verificacao.
create or replace function public.get_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- 2) Ajustar trigger para permitir alteracoes privilegiadas por admin e superadmin.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
begin
  -- SQL editor/service-role podem nao ter JWT; nesses casos,
  -- deixamos a operacao seguir para permitir administracao manual.
  if auth.uid() is null then
    return new;
  end if;

  select public.get_user_role() into requester_role;

  if requester_role not in ('admin', 'superadmin') then
    if new.role is distinct from old.role then
      raise exception 'Only admins can change profile role';
    end if;

    if new.church_id is distinct from old.church_id then
      raise exception 'Only admins can change church_id';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileged_fields on public.profiles;

create trigger trg_protect_profile_privileged_fields
before update on public.profiles
for each row
execute function public.protect_profile_privileged_fields();

-- 3) Policies de superadmin (idempotente).
drop policy if exists "Superadmins can view all churches" on public.churches;
drop policy if exists "Superadmins can update churches" on public.churches;
drop policy if exists "Superadmins can view all profiles" on public.profiles;
drop policy if exists "Superadmins can update profiles" on public.profiles;
drop policy if exists "Superadmins can view all ministries" on public.ministries;
drop policy if exists "Superadmins can view all user ministries" on public.user_ministries;
drop policy if exists "Superadmins can view all ministry leaders" on public.ministry_leaders;

create policy "Superadmins can view all churches" on public.churches
  for select
  using (public.get_user_role() = 'superadmin');

create policy "Superadmins can update churches" on public.churches
  for update
  using (public.get_user_role() = 'superadmin')
  with check (public.get_user_role() = 'superadmin');

create policy "Superadmins can view all profiles" on public.profiles
  for select
  using (public.get_user_role() = 'superadmin');

create policy "Superadmins can update profiles" on public.profiles
  for update
  using (public.get_user_role() = 'superadmin')
  with check (public.get_user_role() = 'superadmin');

create policy "Superadmins can view all ministries" on public.ministries
  for select
  using (public.get_user_role() = 'superadmin');

create policy "Superadmins can view all user ministries" on public.user_ministries
  for select
  using (public.get_user_role() = 'superadmin');

create policy "Superadmins can view all ministry leaders" on public.ministry_leaders
  for select
  using (public.get_user_role() = 'superadmin');