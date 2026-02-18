-- Security hardening for profiles table
-- 1) guarantee RLS is enabled and enforced
-- 2) prevent users from updating other users' profiles
-- 3) prevent privilege escalation (role/church changes) by non-admin users

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- Replace update policy with strict self-only updates
-- (admins should use service-role backend operations for cross-user admin actions)
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can update their own profile" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger to protect sensitive columns from horizontal privilege escalation
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select role into requester_role
  from public.profiles
  where id = auth.uid();

  if requester_role is distinct from 'admin' then
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
