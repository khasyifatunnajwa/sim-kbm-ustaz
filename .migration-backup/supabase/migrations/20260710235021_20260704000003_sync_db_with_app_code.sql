-- Apply July 4th migration 3: Sync DB with app code (RLS policies + missing columns)
-- All idempotent

-- 1. kelas: add missing columns
ALTER TABLE kelas ADD COLUMN IF NOT EXISTS kode text;
ALTER TABLE kelas ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE kelas ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE kelas SET is_active = aktif WHERE is_active IS NULL;
UPDATE kelas SET is_active = true WHERE is_active IS NULL;
CREATE INDEX IF NOT EXISTS idx_kelas_active ON kelas (is_active);

-- 2. updated_at on frequently updated tables
ALTER TABLE murid ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE absensi ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE jadwal_mengajar ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. is_admin() function (idempotent)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- 4-15. RLS policies for all tables (SELECT all authenticated + admin CRUD)
-- kelas
DROP POLICY IF EXISTS "select_all_kelas_v2" ON kelas;
CREATE POLICY "select_all_kelas_v2" ON kelas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_kelas_v2" ON kelas;
CREATE POLICY "admin_all_kelas_v2" ON kelas FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- murid
DROP POLICY IF EXISTS "select_all_murid_v2" ON murid;
CREATE POLICY "select_all_murid_v2" ON murid FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_murid_v2" ON murid;
CREATE POLICY "admin_all_murid_v2" ON murid FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- jadwal_mengajar
DROP POLICY IF EXISTS "select_all_jadwal_mengajar_v2" ON jadwal_mengajar;
CREATE POLICY "select_all_jadwal_mengajar_v2" ON jadwal_mengajar FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_jadwal_mengajar_v2" ON jadwal_mengajar;
CREATE POLICY "admin_all_jadwal_mengajar_v2" ON jadwal_mengajar FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- absensi
DROP POLICY IF EXISTS "select_all_absensi_v2" ON absensi;
CREATE POLICY "select_all_absensi_v2" ON absensi FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_absensi_v2" ON absensi;
CREATE POLICY "admin_all_absensi_v2" ON absensi FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- penilaian
DROP POLICY IF EXISTS "select_all_penilaian_v2" ON penilaian;
CREATE POLICY "select_all_penilaian_v2" ON penilaian FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_penilaian_v2" ON penilaian;
CREATE POLICY "admin_all_penilaian_v2" ON penilaian FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- detail_nilai
DROP POLICY IF EXISTS "select_all_detail_nilai_v2" ON detail_nilai;
CREATE POLICY "select_all_detail_nilai_v2" ON detail_nilai FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_detail_nilai_v2" ON detail_nilai;
CREATE POLICY "admin_all_detail_nilai_v2" ON detail_nilai FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- sikap
DROP POLICY IF EXISTS "select_all_sikap_v2" ON sikap;
CREATE POLICY "select_all_sikap_v2" ON sikap FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_sikap_v2" ON sikap;
CREATE POLICY "admin_all_sikap_v2" ON sikap FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- jurnal_kbm
DROP POLICY IF EXISTS "select_all_jurnal_kbm_v2" ON jurnal_kbm;
CREATE POLICY "select_all_jurnal_kbm_v2" ON jurnal_kbm FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_jurnal_kbm_v2" ON jurnal_kbm;
CREATE POLICY "admin_all_jurnal_kbm_v2" ON jurnal_kbm FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- bank_soal
DROP POLICY IF EXISTS "select_all_bank_soal_v2" ON bank_soal;
CREATE POLICY "select_all_bank_soal_v2" ON bank_soal FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_bank_soal_v2" ON bank_soal;
CREATE POLICY "admin_all_bank_soal_v2" ON bank_soal FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- catatan_guru
DROP POLICY IF EXISTS "select_all_catatan_guru_v2" ON catatan_guru;
CREATE POLICY "select_all_catatan_guru_v2" ON catatan_guru FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_catatan_guru_v2" ON catatan_guru;
CREATE POLICY "admin_all_catatan_guru_v2" ON catatan_guru FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- mata_pelajaran
DROP POLICY IF EXISTS "select_all_mata_pelajaran_v2" ON mata_pelajaran;
CREATE POLICY "select_all_mata_pelajaran_v2" ON mata_pelajaran FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_mata_pelajaran_v2" ON mata_pelajaran;
CREATE POLICY "admin_all_mata_pelajaran_v2" ON mata_pelajaran FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- profiles
DROP POLICY IF EXISTS "select_all_profiles_v2" ON profiles;
CREATE POLICY "select_all_profiles_v2" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_profiles_v2" ON profiles;
CREATE POLICY "admin_all_profiles_v2" ON profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- tahun_ajaran
DROP POLICY IF EXISTS "select_all_tahun_ajaran_v2" ON tahun_ajaran;
CREATE POLICY "select_all_tahun_ajaran_v2" ON tahun_ajaran FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_tahun_ajaran_v2" ON tahun_ajaran;
CREATE POLICY "admin_all_tahun_ajaran_v2" ON tahun_ajaran FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- semester
DROP POLICY IF EXISTS "select_all_semester_v2" ON semester;
CREATE POLICY "select_all_semester_v2" ON semester FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_semester_v2" ON semester;
CREATE POLICY "admin_all_semester_v2" ON semester FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- soal
DROP POLICY IF EXISTS "select_all_soal_v2" ON soal;
CREATE POLICY "select_all_soal_v2" ON soal FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_soal_v2" ON soal;
CREATE POLICY "admin_all_soal_v2" ON soal FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- presensi_guru
DROP POLICY IF EXISTS "select_all_presensi_guru_v2" ON presensi_guru;
CREATE POLICY "select_all_presensi_guru_v2" ON presensi_guru FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_presensi_guru_v2" ON presensi_guru;
CREATE POLICY "admin_all_presensi_guru_v2" ON presensi_guru FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';