/*
# Create admin_notifications table and fix murid RLS policies

## Summary

1. **New Table: `admin_notifications`**
   - Stores written notifications sent to admin when ustaz (non-admin) users add murid, jadwal, or kelas.
   - Columns: id, type, title, message, data (jsonb), created_by (uuid), created_by_name (text), read (boolean), created_at.
   - RLS enabled: admin can see all; non-admin can insert (to notify admin) but cannot read others' notifications.

2. **Fix `murid.user_id` column**
   - Add `DEFAULT auth.uid()` so ustaz inserts that omit user_id still satisfy RLS WITH CHECK.
   - Previously user_id was NOT NULL with no default, causing silent insert failures.

3. **Clean up murid RLS policies**
   - Drop all 12 existing overlapping/conflicting policies.
   - Create 4 clean per-verb policies:
     - SELECT: admin sees all; ustaz sees murid in their scope (their classes or own rows).
     - INSERT: admin can insert; ustaz can insert own rows (user_id = auth.uid()).
     - UPDATE: admin can update all; ustaz can update own rows only.
     - DELETE: admin can delete all; ustaz can delete own rows only.

4. **Security**
   - admin_notifications: admin full access, authenticated can INSERT only (to send notifications), no SELECT for non-admin.
   - murid: ownership-based for non-admin, full access for admin via is_admin() function.

5. **Important Notes**
   - The is_admin() function already exists in the database and is used by existing policies.
   - No data is lost: only policies are dropped and recreated, no table data changes.
   - The murid.user_id default change is safe: existing rows already have user_id set.
*/

-- =========================================================
-- 1. Create admin_notifications table
-- =========================================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS "admin_all_admin_notifications" ON admin_notifications;
CREATE POLICY "admin_all_admin_notifications" ON admin_notifications
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Any authenticated user can INSERT (to send notification to admin)
DROP POLICY IF EXISTS "insert_admin_notifications" ON admin_notifications;
CREATE POLICY "insert_admin_notifications" ON admin_notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Add index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications (read);

-- =========================================================
-- 2. Fix murid.user_id default
-- =========================================================
ALTER TABLE murid ALTER COLUMN user_id SET DEFAULT auth.uid();

-- =========================================================
-- 3. Clean up murid RLS policies
-- =========================================================
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON murid;
DROP POLICY IF EXISTS "Akses mandiri murid" ON murid;
DROP POLICY IF EXISTS "admin_all_murid" ON murid;
DROP POLICY IF EXISTS "admin_all_murid_v2" ON murid;
DROP POLICY IF EXISTS "murid_insert_update_delete" ON murid;
DROP POLICY IF EXISTS "delete_own_murid" ON murid;
DROP POLICY IF EXISTS "insert_own_murid" ON murid;
DROP POLICY IF EXISTS "select_all_murid_v2" ON murid;
DROP POLICY IF EXISTS "select_own_murid" ON murid;
DROP POLICY IF EXISTS "select_all_murid" ON murid;
DROP POLICY IF EXISTS "murid_select" ON murid;
DROP POLICY IF EXISTS "update_own_murid" ON murid;

-- SELECT: admin sees all; non-admin sees rows where user_id matches OR kelas_id is in their jadwal_mengajar
DROP POLICY IF EXISTS "select_murid_scoped" ON murid;
CREATE POLICY "select_murid_scoped" ON murid
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jadwal_mengajar jm
      WHERE jm.user_id = auth.uid()
        AND jm.kelas_id::text = murid.kelas_id::text
    )
  );

-- INSERT: admin can insert any; non-admin can insert own rows
DROP POLICY IF EXISTS "insert_murid_scoped" ON murid;
CREATE POLICY "insert_murid_scoped" ON murid
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR user_id = auth.uid());

-- UPDATE: admin can update any; non-admin can update own rows only
DROP POLICY IF EXISTS "update_murid_scoped" ON murid;
CREATE POLICY "update_murid_scoped" ON murid
  FOR UPDATE TO authenticated
  USING (is_admin() OR user_id = auth.uid())
  WITH CHECK (is_admin() OR user_id = auth.uid());

-- DELETE: admin can delete any; non-admin can delete own rows only
DROP POLICY IF EXISTS "delete_murid_scoped" ON murid;
CREATE POLICY "delete_murid_scoped" ON murid
  FOR DELETE TO authenticated
  USING (is_admin() OR user_id = auth.uid());
