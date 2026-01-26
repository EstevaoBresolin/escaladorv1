-- Fix profile trigger to handle full_name from sign-up form

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_church_id uuid;
  v_church_name text;
begin
  -- Get church name from user metadata (set during sign-up)
  v_church_name := new.raw_user_meta_data ->> 'church_name';
  
  -- Create church if church_name is provided
  if v_church_name is not null and v_church_name != '' then
    insert into public.churches (name)
    values (v_church_name)
    returning id into v_church_id;
  end if;

  -- Create profile with the user's data
  -- Handle both 'full_name' and 'name' from metadata for flexibility
  insert into public.profiles (id, name, email, role, church_id)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name', 
      split_part(new.email, '@', 1)
    ),
    new.email,
    case 
      when v_church_id is not null then 'admin'
      else coalesce(new.raw_user_meta_data ->> 'role', 'volunteer')
    end,
    v_church_id
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop and recreate trigger
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
