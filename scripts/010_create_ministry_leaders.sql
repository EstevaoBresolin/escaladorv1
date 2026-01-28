-- Create ministry_leaders table for multiple leaders per ministry
-- This allows a many-to-many relationship between profiles and ministries for leadership

-- 1. Create ministry_leaders table
CREATE TABLE IF NOT EXISTS public.ministry_leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(ministry_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE public.ministry_leaders ENABLE ROW LEVEL SECURITY;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ministry_leaders_ministry_id ON public.ministry_leaders(ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_leaders_user_id ON public.ministry_leaders(user_id);

-- 4. RLS Policies for ministry_leaders

-- Everyone in the same church can view ministry leaders
CREATE POLICY "Users can view ministry leaders from their church" ON public.ministry_leaders
  FOR SELECT USING (
    ministry_id IN (
      SELECT id FROM public.ministries WHERE church_id IN (
        SELECT church_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Only admins can add ministry leaders
CREATE POLICY "Admins can insert ministry leaders" ON public.ministry_leaders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND ministry_id IN (
      SELECT id FROM public.ministries WHERE church_id IN (
        SELECT church_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Only admins can remove ministry leaders
CREATE POLICY "Admins can delete ministry leaders" ON public.ministry_leaders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND ministry_id IN (
      SELECT id FROM public.ministries WHERE church_id IN (
        SELECT church_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- 5. Update user_ministries policies to allow ministry leaders to manage members

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can join ministries" ON public.user_ministries;

-- Create new insert policy: Admins and ministry leaders can add members
CREATE POLICY "Admins and leaders can add ministry members" ON public.user_ministries
  FOR INSERT WITH CHECK (
    -- User is admin
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- User is a leader of this ministry
    EXISTS (
      SELECT 1 FROM public.ministry_leaders 
      WHERE ministry_id = user_ministries.ministry_id AND user_id = auth.uid()
    )
  );

-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can leave ministries" ON public.user_ministries;

-- Create new delete policy: Admins, ministry leaders, or the user themselves can remove
CREATE POLICY "Admins, leaders, or self can remove ministry members" ON public.user_ministries
  FOR DELETE USING (
    -- User removing themselves
    user_id = auth.uid()
    OR
    -- User is admin
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- User is a leader of this ministry
    EXISTS (
      SELECT 1 FROM public.ministry_leaders 
      WHERE ministry_id = user_ministries.ministry_id AND user_id = auth.uid()
    )
  );

-- 6. Update volunteer_slots policies for ministry leaders

-- Drop existing policy for leaders managing volunteer slots
DROP POLICY IF EXISTS "Leaders can manage volunteer slots in their ministries" ON public.volunteer_slots;

-- Create new policy: Admins and ministry leaders can manage volunteer slots
CREATE POLICY "Admins and ministry leaders can manage volunteer slots" ON public.volunteer_slots
  FOR ALL USING (
    -- User is admin
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- User is a leader of this ministry
    EXISTS (
      SELECT 1 FROM public.ministry_leaders 
      WHERE ministry_id = volunteer_slots.ministry_id AND user_id = auth.uid()
    )
  );

-- 7. Create a helper function to check if a user is a ministry leader
CREATE OR REPLACE FUNCTION public.is_ministry_leader(p_user_id uuid, p_ministry_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ministry_leaders 
    WHERE user_id = p_user_id AND ministry_id = p_ministry_id
  );
$$;

-- 8. Create a function to get all ministries where a user is a leader
CREATE OR REPLACE FUNCTION public.get_user_led_ministries(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ministry_id FROM public.ministry_leaders WHERE user_id = p_user_id;
$$;

-- 9. Migrate existing leader_id from ministries table to ministry_leaders
-- This preserves the existing single-leader data
INSERT INTO public.ministry_leaders (ministry_id, user_id)
SELECT id, leader_id FROM public.ministries 
WHERE leader_id IS NOT NULL
ON CONFLICT (ministry_id, user_id) DO NOTHING;
