-- Security audit checks (read-only)
-- Run these queries in Supabase SQL editor to verify hardened policies are active in production.

-- 1) Confirm trigger that protects privileged fields
select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'profiles'
  and trigger_name = 'trg_protect_profile_privileged_fields';

-- 2) Confirm profile hardening function exists
select routine_name, routine_type
from information_schema.routines
where specific_schema = 'public'
  and routine_name = 'protect_profile_privileged_fields';

-- 3) Confirm profiles UPDATE policy is self-only
select policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
  and cmd = 'UPDATE';

-- 4) Confirm profiles role constraint supports expected values
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.profiles'::regclass
  and conname = 'profiles_role_check';

-- 5) Confirm auth signup trigger exists
select tgname as trigger_name
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and tgname = 'on_auth_user_created';

-- 6) Sample query to verify role distribution (monitoring)
select role, count(*) as total
from public.profiles
group by role
order by role;
