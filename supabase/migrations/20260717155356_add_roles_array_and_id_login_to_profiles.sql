-- Add roles array column and id_login to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY['ustaz'],
  ADD COLUMN IF NOT EXISTS id_login text;

-- Populate roles from existing role column for existing rows
UPDATE profiles SET roles = ARRAY[role] WHERE roles IS NULL OR roles = '{}';

-- Create unique index on id_login (partial, allows nulls)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_id_login_unique
  ON profiles (id_login)
  WHERE id_login IS NOT NULL;

-- Allow anon/authenticated to read profiles for id_login lookup
-- (already covered by existing SELECT policies)
