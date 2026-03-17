-- Hotfix: permite updates administrativos em public.profiles via SQL editor.
-- Cenário: auth.uid() pode ser null fora do contexto JWT e o trigger antigo bloqueava tudo.

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
