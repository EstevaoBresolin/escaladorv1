ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

UPDATE public.churches
SET active = true
WHERE active IS NULL;