-- Atualizar trigger de perfil para não criar igreja no cadastro
-- Agora o usuário escolhe a igreja depois no perfil

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Criar perfil com os dados do usuário
  -- Não vincula igreja automaticamente - usuário escolhe depois
  insert into public.profiles (id, name, email, role, church_id)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name', 
      split_part(new.email, '@', 1)
    ),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'volunteer'),
    null  -- igreja será definida pelo usuário no perfil
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Recriar trigger
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
