-- Fix: evita conflito entre o trigger de protecao de role e a promocao
-- automatica para volunteer ao entrar em um ministerio.
--
-- Regra mantida:
-- - Apenas admin/superadmin podem alterar role livremente.
-- Excecao segura:
-- - Permite member -> volunteer quando a alteracao acontece em trigger interno
--   e o usuario ja possui vinculo em user_ministries.

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
  is_internal_ministry_promotion boolean;
begin
  -- SQL editor/service-role podem nao ter JWT; nesses casos,
  -- deixamos a operacao seguir para permitir administracao manual.
  if auth.uid() is null then
    return new;
  end if;

  select public.get_user_role() into requester_role;

  if requester_role not in ('admin', 'superadmin') then
    if new.role is distinct from old.role then
      is_internal_ministry_promotion :=
        pg_trigger_depth() > 1
        and old.role = 'member'
        and new.role = 'volunteer'
        and exists (
          select 1
          from public.user_ministries um
          where um.user_id = new.id
        );

      if not is_internal_ministry_promotion then
        raise exception 'Only admins can change profile role';
      end if;
    end if;
  end if;

  return new;
end;
$$;
