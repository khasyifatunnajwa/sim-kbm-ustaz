/*
# Add admin_notifications table, lembaga column to murid, and admin override RLS

## Summary
This migration does four things:
1. Adds a `lembaga` text column to `murid` so ustaz can record which institution a student belongs to.
2. Creates the `admin_notifications` table so non-admin ustaz can send written notifications to admins when they add murid, jadwal, or kelas.
3. Adds admin-override SELECT policies to `murid` and `kelas` tables so admin users can read ALL records (not just their own).
4. All admin checks use `profiles.role = 'admin'` (singular column) — NOT `profiles.roles`.

## Tables Modified
- `murid`: adds nullable `lembaga` text column
- `kelas`: no columns added; RLS extended only

## New Tables
- `admin_notifications`: stores notifications sent to admin from non-admin ustaz
  - `id` (uuid, pk)
  - `type` (text): category e.g. 'murid_added', 'jadwal_added', 'kelas_added'
  - `title` (text): short heading
  - `message` (text): full message body
  - `data` (jsonb): optional extra payload
  - `created_by` (uuid): user_id of the sender
  - `created_by_name` (text): display name of the sender
  - `is_read` (boolean, default false)
  - `read_at` (timestamptz, nullable)
  - `created_at` (timestamptz, default now())

## Security Changes
- `admin_notifications`: RLS enabled; ustaz can insert own rows; admin can select/update/delete all rows
- `murid`: new admin-override SELECT policy added (admin can read all)
- `kelas`: new admin-override SELECT policy added (admin can read all)

## Notes
- All admin checks use: EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
- Existing owner-scoped policies on murid and kelas are left untouched
- Migration is idempotent: IF NOT EXISTS guards on table/column creation; DROP POLICY IF EXISTS before every CREATE POLICY
*/

-- 1. Add lembaga column to murid if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'murid' AND column_name = 'lembaga'
  ) THEN
    ALTER TABLE murid ADD COLUMN lembaga text;
  END IF;
END $$;

-- 2. Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL,
  title       text NOT NULL,
  message     text NOT NULL,
  data        jsonb,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  is_read     boolean NOT NULL DEFAULT false,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS on admin_notifications
DROP POLICY IF EXISTS "insert_own_notification" ON admin_notifications;
CREATE POLICY "insert_own_notification" ON admin_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "admin_select_notifications" ON admin_notifications;
CREATE POLICY "admin_select_notifications" ON admin_notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "admin_update_notifications" ON admin_notifications;
CREATE POLICY "admin_update_notifications" ON admin_notifications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "admin_delete_notifications" ON admin_notifications;
CREATE POLICY "admin_delete_notifications" ON admin_notifications FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- 4. Admin override SELECT on murid (admin can read all rows)
DROP POLICY IF EXISTS "admin_select_all_murid" ON murid;
CREATE POLICY "admin_select_all_murid" ON murid FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- 5. Admin override SELECT on kelas (admin can read all rows)
DROP POLICY IF EXISTS "admin_select_all_kelas" ON kelas;
CREATE POLICY "admin_select_all_kelas" ON kelas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
