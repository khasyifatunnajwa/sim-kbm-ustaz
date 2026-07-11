/*
# Fix RLS: ustaz only sees/edits own data, admin sees all

1. Security
- Drop overly permissive "Akses Penuh Admin Otomatis" (qual=true) policies from all tables
- Drop overly permissive "select_all_*" (qual=true) policies
- Drop redundant admin_all_* policies (replaced by new is_admin OR own policy)
- Add new SELECT/INSERT/UPDATE/DELETE policies: admin sees all, ustaz only own data

2. Notes
- Only touches tables that have user_id column
- Does NOT drop "own_*" policies that already correctly scope to user_id = uid()
*/

DO $$
DECLARE
  t text;
  permissive_policies text[];
BEGIN
  -- Tables with user_id column that need fixing
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'user_id'
    AND table_name IN (
      'absensi','agenda_penting','bank_soal','buku_saku','capaian_hafalan',
      'catatan_guru','catatan_perilaku','jadwal','jadwal_mengajar','jurnal_kbm',
      'kbm_harian','materi','muhafadhoh','nilai','notifikasi','pengumuman',
      'penilaian','rapor_final','sikap','soal'
    )
  LOOP
    -- Drop "Akses Penuh Admin Otomatis" (qual=true, ALL)
    EXECUTE format('DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON %I;', t);
    
    -- Drop "select_all_*" policies (qual=true)
    EXECUTE format('DROP POLICY IF EXISTS "select_all_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "select_all_%s_v2" ON %I;', t, t);
    
    -- Drop redundant admin_all_* policies
    EXECUTE format('DROP POLICY IF EXISTS "admin_all_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_all_%s_v2" ON %I;', t, t);
    
    -- Drop the generic "absensi_all" style policy
    EXECUTE format('DROP POLICY IF EXISTS "%s_all" ON %I;', t, t);
    
    -- Drop existing own_* policies (we'll recreate clean ones)
    EXECUTE format('DROP POLICY IF EXISTS "select_own_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "insert_own_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "update_own_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "delete_own_%s" ON %I;', t, t);
    
    -- Create clean 4 CRUD policies: admin sees all, ustaz only own
    EXECUTE format('CREATE POLICY "select_policy_%s" ON %I FOR SELECT TO authenticated USING (is_admin() OR user_id = auth.uid());', t, t);
    EXECUTE format('CREATE POLICY "insert_policy_%s" ON %I FOR INSERT TO authenticated WITH CHECK (is_admin() OR user_id = auth.uid());', t, t);
    EXECUTE format('CREATE POLICY "update_policy_%s" ON %I FOR UPDATE TO authenticated USING (is_admin() OR user_id = auth.uid()) WITH CHECK (is_admin() OR user_id = auth.uid());', t, t);
    EXECUTE format('CREATE POLICY "delete_policy_%s" ON %I FOR DELETE TO authenticated USING (is_admin() OR user_id = auth.uid());', t, t);
  END LOOP;
END $$;
