/*
# Create device_tokens table for Firebase Cloud Messaging (FCM)

1. Purpose
   - Stores FCM registration tokens for each authenticated user so the
     server can send push notifications to their devices.
   - Each user may have multiple tokens (multiple devices/browsers).

2. New Tables
   - `device_tokens`
     - `id`          (uuid, primary key)
     - `user_id`     (uuid, NOT NULL, references auth.users, ON DELETE CASCADE)
     - `token`       (text, NOT NULL, the FCM registration token)
     - `platform`    (text, platform/browser info, e.g. 'web', 'android')
     - `created_at`  (timestamptz, default now())
     - `updated_at`  (timestamptz, default now())

3. Indexes
   - `idx_device_tokens_user_id`  — fast lookup by user
   - `unique_device_tokens_token` — prevents duplicate tokens

4. Security (RLS)
   - RLS enabled on `device_tokens`.
   - Authenticated users can SELECT/INSERT/UPDATE/DELETE only their own tokens.
   - A trigger function `update_updated_at_column()` bumps `updated_at` on UPDATE.
*/

-- Helper function: bump updated_at on UPDATE (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text DEFAULT 'web',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_device_tokens_token ON public.device_tokens(token);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_device_tokens_updated_at ON public.device_tokens;
CREATE TRIGGER trg_device_tokens_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Policies (owner-scoped CRUD)
DROP POLICY IF EXISTS "select_own_device_tokens" ON public.device_tokens;
CREATE POLICY "select_own_device_tokens"
  ON public.device_tokens FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_device_tokens" ON public.device_tokens;
CREATE POLICY "insert_own_device_tokens"
  ON public.device_tokens FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_device_tokens" ON public.device_tokens;
CREATE POLICY "update_own_device_tokens"
  ON public.device_tokens FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_device_tokens" ON public.device_tokens;
CREATE POLICY "delete_own_device_tokens"
  ON public.device_tokens FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
