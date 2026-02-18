-- Remove vínculos quando usuário troca de igreja

create or replace function public.cleanup_on_profile_church_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.church_id is distinct from new.church_id) then
    delete from public.user_ministries where user_id = old.id;
    delete from public.volunteer_slots where user_id = old.id;
    delete from public.ministry_leaders where user_id = old.id;
    delete from public.volunteer_unavailability where user_id = old.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cleanup_on_church_change on public.profiles;
create trigger trg_cleanup_on_church_change
before update of church_id on public.profiles
for each row
when (old.church_id is distinct from new.church_id)
execute function public.cleanup_on_profile_church_change();
