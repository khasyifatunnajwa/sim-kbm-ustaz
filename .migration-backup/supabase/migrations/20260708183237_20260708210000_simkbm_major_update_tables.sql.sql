/*
# SIM KBM Ustaz Major Update - Part 1: Tables and Basic Views

Creates new tables for presensi_murid, guru_pengganti, pengaturan_tampilan, peringatan, etc.
*/

-- ============================================================
-- 1. CREATE NEW TABLES
-- ============================================================

-- Pengaturan Tampilan (Dark Mode Support)
CREATE TABLE IF NOT EXISTS pengaturan_tampilan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tema text NOT NULL DEFAULT 'light' CHECK (tema IN ('light', 'dark', 'system')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pengaturan_tampilan ENABLE ROW LEVEL SECURITY;

-- Presensi Murid (Student Attendance)
CREATE TABLE IF NOT EXISTS presensi_murid (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  murid_id uuid NOT NULL REFERENCES murid(id) ON DELETE CASCADE,
  jadwal_id uuid,
  kelas_id uuid,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal date NOT NULL,
  status text NOT NULL DEFAULT 'Hadir' CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alfa')),
  keterangan text,
  jam_input timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_presensi_murid_tanggal ON presensi_murid(tanggal);
CREATE INDEX IF NOT EXISTS idx_presensi_murid_murid_id ON presensi_murid(murid_id);
CREATE INDEX IF NOT EXISTS idx_presensi_murid_kelas_id ON presensi_murid(kelas_id);
CREATE INDEX IF NOT EXISTS idx_presensi_murid_status ON presensi_murid(status);

ALTER TABLE presensi_murid ENABLE ROW LEVEL SECURITY;

-- Guru Pengganti (Substitute Teacher)
CREATE TABLE IF NOT EXISTS guru_pengganti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jadwal_asli_id uuid,
  guru_asli_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guru_pengganti_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal date NOT NULL,
  kelas text,
  mapel text,
  jam_mulai text,
  jam_selesai text,
  alasan text,
  status text NOT NULL DEFAULT 'berlangsung' CHECK (status IN ('berlangsung', 'selesai', 'dibatalkan')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_guru_pengganti_tanggal ON guru_pengganti(tanggal);
CREATE INDEX IF NOT EXISTS idx_guru_pengganti_guru_pengganti_id ON guru_pengganti(guru_pengganti_id);

ALTER TABLE guru_pengganti ENABLE ROW LEVEL SECURITY;

-- Peringatan Ustaz (Teacher Disciplinary Warnings)
CREATE TABLE IF NOT EXISTS peringatan_ustaz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jumlah_tidak_hadir integer NOT NULL DEFAULT 0,
  tanggal_mulai date,
  tanggal_selesai date,
  kelas_list text[],
  status_wa text DEFAULT 'pending' CHECK (status_wa IN ('pending', 'sent', 'failed')),
  tanggal_kirim timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_peringatan_ustaz_guru_id ON peringatan_ustaz(guru_id);

ALTER TABLE peringatan_ustaz ENABLE ROW LEVEL SECURITY;

-- Peringatan Murid (Student Disciplinary Warnings)
CREATE TABLE IF NOT EXISTS peringatan_murid (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  murid_id uuid NOT NULL REFERENCES murid(id) ON DELETE CASCADE,
  jumlah_alfa integer NOT NULL DEFAULT 0,
  minggu_ke integer,
  tahun integer,
  wali_kelas_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status_wa text DEFAULT 'pending' CHECK (status_wa IN ('pending', 'sent', 'failed')),
  tanggal_kirim timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_peringatan_murid_murid_id ON peringatan_murid(murid_id);

ALTER TABLE peringatan_murid ENABLE ROW LEVEL SECURITY;

-- Riwayat Pelanggaran (Violation History)
CREATE TABLE IF NOT EXISTS riwayat_pelanggaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipe text NOT NULL CHECK (tipe IN ('ustaz', 'murid')),
  referensi_id uuid NOT NULL,
  tanggal date NOT NULL,
  keterangan text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_riwayat_pelanggaran_tipe ON riwayat_pelanggaran(tipe);
CREATE INDEX IF NOT EXISTS idx_riwayat_pelanggaran_referensi_id ON riwayat_pelanggaran(referensi_id);

ALTER TABLE riwayat_pelanggaran ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. RLS POLICIES
-- ============================================================

-- Pengaturan Tampilan
DROP POLICY IF EXISTS "select_own_pengaturan_tampilan" ON pengaturan_tampilan;
CREATE POLICY "select_own_pengaturan_tampilan" ON pengaturan_tampilan
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_pengaturan_tampilan" ON pengaturan_tampilan;
CREATE POLICY "insert_own_pengaturan_tampilan" ON pengaturan_tampilan
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_pengaturan_tampilan" ON pengaturan_tampilan;
CREATE POLICY "update_own_pengaturan_tampilan" ON pengaturan_tampilan
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Presensi Murid
DROP POLICY IF EXISTS "select_presensi_murid" ON presensi_murid;
CREATE POLICY "select_presensi_murid" ON presensi_murid
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_presensi_murid" ON presensi_murid;
CREATE POLICY "insert_presensi_murid" ON presensi_murid
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')));

DROP POLICY IF EXISTS "update_presensi_murid" ON presensi_murid;
CREATE POLICY "update_presensi_murid" ON presensi_murid
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')));

DROP POLICY IF EXISTS "delete_presensi_murid" ON presensi_murid;
CREATE POLICY "delete_presensi_murid" ON presensi_murid
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Guru Pengganti
DROP POLICY IF EXISTS "select_guru_pengganti" ON guru_pengganti;
CREATE POLICY "select_guru_pengganti" ON guru_pengganti
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_guru_pengganti" ON guru_pengganti;
CREATE POLICY "insert_guru_pengganti" ON guru_pengganti
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')));

DROP POLICY IF EXISTS "update_guru_pengganti" ON guru_pengganti;
CREATE POLICY "update_guru_pengganti" ON guru_pengganti
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')));

-- Peringatan Ustaz - Admin only
DROP POLICY IF EXISTS "admin_peringatan_ustaz" ON peringatan_ustaz;
CREATE POLICY "admin_peringatan_ustaz" ON peringatan_ustaz
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Peringatan Murid - Admin only
DROP POLICY IF EXISTS "admin_peringatan_murid" ON peringatan_murid;
CREATE POLICY "admin_peringatan_murid" ON peringatan_murid
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Riwayat Pelanggaran
DROP POLICY IF EXISTS "select_riwayat_pelanggaran" ON riwayat_pelanggaran;
CREATE POLICY "select_riwayat_pelanggaran" ON riwayat_pelanggaran
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "insert_riwayat_pelanggaran" ON riwayat_pelanggaran;
CREATE POLICY "insert_riwayat_pelanggaran" ON riwayat_pelanggaran
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pengaturan_tampilan_updated ON pengaturan_tampilan;
CREATE TRIGGER trg_pengaturan_tampilan_updated
  BEFORE UPDATE ON pengaturan_tampilan
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_presensi_murid_updated ON presensi_murid;
CREATE TRIGGER trg_presensi_murid_updated
  BEFORE UPDATE ON presensi_murid
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_guru_pengganti_updated ON guru_pengganti;
CREATE TRIGGER trg_guru_pengganti_updated
  BEFORE UPDATE ON guru_pengganti
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();