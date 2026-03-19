-- Fix adicional: remove dependencia de pg_trigger_depth() na sincronizacao de role.
--
-- Em alguns cenarios, updates disparados por trigger nao chegam com depth > 1,
-- gerando falso bloqueio "Only admins can change profile role".
--
-- Regra mantida:
-- - Apenas admin/superadmin alteram role livremente.
-- Excecoes de sincronizacao permitidas para nao-admin:
-- - member -> volunteer quando existe vinculo em user_ministries.
-- - volunteer -> member quando nao existe vinculo em user_ministries.

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
  is_allowed_role_sync boolean;
begin
  -- SQL editor/service-role podem nao ter JWT; nesses casos,
  -- deixamos a operacao seguir para permitir administracao manual.
  if auth.uid() is null then
    return new;
  end if;

  select public.get_user_role() into requester_role;

  if requester_role not in ('admin', 'superadmin') then
    if new.role is distinct from old.role then
      is_allowed_role_sync :=
        (
          old.role = 'member'
          and new.role = 'volunteer'
          and exists (
            select 1
            from public.user_ministries um
            where um.user_id = new.id
          )
        )
        or
        (
          old.role = 'volunteer'
          and new.role = 'member'
          and not exists (
            select 1
            from public.user_ministries um
            where um.user_id = new.id
          )
        );

      if not is_allowed_role_sync then
        raise exception 'Only admins can change profile role';
      end if;
    end if;
  end if;

  return new;
end;
$$;
