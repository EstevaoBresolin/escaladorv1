-- Auto-create profile on user signup
-- This trigger creates a profile entry when a new user signs up

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'volunteer')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop existing trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger for new user signups
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
