/*
# Fix kelas RLS policies and rename admin_notifications.read to is_read

## Summary
1. Rename admin_notifications.read → is_read to match frontend code
2. Clean up kelas table RLS policies (12 overlapping → 4 clean per-verb)
3. Add DEFAULT auth.uid() to kelas.user_id
*/

-- =========================================================
-- 1. Rename admin_notifications.read to is_read
-- =========================================================
ALTER TABLE admin_notifications RENAME COLUMN "read" TO is_read;

-- =========================================================
-- 2. Fix kelas.user_id default
-- =========================================================
ALTER TABLE kelas ALTER COLUMN user_id SET DEFAULT auth.uid();

-- =========================================================
-- 3. Clean up kelas RLS policies
-- =========================================================
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON kelas;
DROP POLICY IF EXISTS "Akses mandiri kelas" ON kelas;
DROP POLICY IF EXISTS "kelas_insert_update_delete" ON kelas;
DROP POLICY IF EXISTS "admin_all_kelas" ON kelas;
DROP POLICY IF EXISTS "admin_all_kelas_v2" ON kelas;
DROP POLICY IF EXISTS "delete_own_kelas" ON kelas;
DROP POLICY IF EXISTS "insert_own_kelas" ON kelas;
DROP POLICY IF EXISTS "Izinkan semua akun login membaca data kelas" ON kelas;
DROP POLICY IF EXISTS "kelas_select" ON kelas;
DROP POLICY IF EXISTS "select_all_kelas_v2" ON kelas;
DROP POLICY IF EXISTS "select_own_kelas" ON kelas;
DROP POLICY IF EXISTS "update_own_kelas" ON kelas;

-- SELECT: admin sees all; non-admin sees all active kelas (needed for dropdowns) OR own rows
DROP POLICY IF EXISTS "select_kelas_scoped" ON kelas;
CREATE POLICY "select_kelas_scoped" ON kelas
  FOR SELECT TO authenticated
  USING (is_admin() OR user_id = auth.uid() OR is_active = true);

-- INSERT: admin can insert any; non-admin can insert own rows
DROP POLICY IF EXISTS "insert_kelas_scoped" ON kelas;
CREATE POLICY "insert_kelas_scoped" ON kelas
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR user_id = auth.uid());

-- UPDATE: admin can update any; non-admin can update own rows only
DROP POLICY IF EXISTS "update_kelas_scoped" ON kelas;
CREATE POLICY "update_kelas_scoped" ON kelas
  FOR UPDATE TO authenticated
  USING (is_admin() OR user_id = auth.uid())
  WITH CHECK (is_admin() OR user_id = auth.uid());

-- DELETE: admin can delete any; non-admin can delete own rows only
DROP POLICY IF EXISTS "delete_kelas_scoped" ON kelas;
CREATE POLICY "delete_kelas_scoped" ON kelas
  FOR DELETE TO authenticated
  USING (is_admin() OR user_id = auth.uid());
