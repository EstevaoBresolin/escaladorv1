-- Promote member to volunteer when added to a ministry

create or replace function public.promote_member_on_ministry_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set role = 'volunteer'
  where id = new.user_id
    and role = 'member';

  return new;
end;
$$;

drop trigger if exists trg_promote_member_on_ministry_join on public.user_ministries;
create trigger trg_promote_member_on_ministry_join
after insert on public.user_ministries
for each row
execute function public.promote_member_on_ministry_join();
