-- Add missing columns to lembaga table
ALTER TABLE public.lembaga
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS logo_url text;
