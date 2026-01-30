-- Update volunteer_unavailability table to include time period
-- Add period column to track if unavailable all day or only morning/afternoon/evening

alter table public.volunteer_unavailability
  add column if not exists period text default 'all_day' check (period in ('all_day', 'morning', 'afternoon', 'evening'));

-- Drop and recreate unique constraint to include period
alter table public.volunteer_unavailability drop constraint if exists volunteer_unavailability_user_id_unavailable_date_key;
alter table public.volunteer_unavailability add unique(user_id, unavailable_date, period);
