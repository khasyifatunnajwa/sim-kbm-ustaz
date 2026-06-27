-- ============================================================
-- SIM KBM Ustaz – Migration: Profiles, Kelas Extended, Admin
-- ============================================================

-- PROFILES (data ustaz)
CREATE TABLE IF NOT EXISTS profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap    text NOT NULL DEFAULT '',
  nama_panggilan  text,
  email           text,
  nomor_whatsapp  text,
  alamat          text,
  foto_url        text,
  role            text NOT NULL DEFAULT 'ustaz' CHECK (role IN ('ustaz', 'admin')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Setiap user bisa baca/tulis profilnya sendiri
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Admin bisa baca semua profil
DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- PENGATURAN APLIKASI
CREATE TABLE IF NOT EXISTS pengaturan_aplikasi (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nama_aplikasi   text NOT NULL DEFAULT 'SIM KBM Ustaz',
  nama_lembaga    text,
  logo_url        text,
  warna_tema      text DEFAULT '#059669',
  nomor_whatsapp  text,
  alamat_lembaga  text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pengaturan_aplikasi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pengaturan_select" ON pengaturan_aplikasi;
DROP POLICY IF EXISTS "pengaturan_admin_all" ON pengaturan_aplikasi;
CREATE POLICY "pengaturan_select" ON pengaturan_aplikasi FOR SELECT TO authenticated USING (true);
CREATE POLICY "pengaturan_admin_all" ON pengaturan_aplikasi FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Insert default pengaturan jika belum ada
INSERT INTO pengaturan_aplikasi (nama_aplikasi, nama_lembaga)
SELECT 'SIM KBM Ustaz', 'Madrasah Diniyah'
WHERE NOT EXISTS (SELECT 1 FROM pengaturan_aplikasi);

-- KELAS: tambah kolom lembaga dan tahun_ajaran text
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kelas' AND column_name = 'lembaga') THEN
    ALTER TABLE kelas ADD COLUMN lembaga text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kelas' AND column_name = 'tahun_ajaran') THEN
    ALTER TABLE kelas ADD COLUMN tahun_ajaran text;
  END IF;
END $$;

-- MURID: pastikan kelas_id ada (bigint FK ke kelas)
-- Tabel murid di migration ke-2 sudah pakai kelas_id bigint
-- Tapi migration ke-1 pakai kelas text. Kita tambahkan kelas_id jika belum ada.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'murid' AND column_name = 'kelas_id') THEN
    ALTER TABLE murid ADD COLUMN kelas_id bigint REFERENCES kelas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- JADWAL MENGAJAR: tambah kelas_id jika belum ada
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jadwal_mengajar' AND column_name = 'kelas_id') THEN
    ALTER TABLE jadwal_mengajar ADD COLUMN kelas_id bigint REFERENCES kelas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- JADWAL MENGAJAR: tambah lokasi jika belum ada
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jadwal_mengajar' AND column_name = 'lokasi') THEN
    ALTER TABLE jadwal_mengajar ADD COLUMN lokasi text;
  END IF;
END $$;

-- NILAI: pastikan kolom jenis_penilaian ada (alias jenis_ujian)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nilai' AND column_name = 'jenis_penilaian') THEN
    ALTER TABLE nilai ADD COLUMN jenis_penilaian text;
  END IF;
END $$;

-- ABSENSI: tambah kelas_id untuk filter lebih mudah
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'absensi' AND column_name = 'kelas_id') THEN
    ALTER TABLE absensi ADD COLUMN kelas_id bigint REFERENCES kelas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- BANK SOAL: tambah kelas_id jika belum ada
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_soal' AND column_name = 'kelas_id') THEN
    ALTER TABLE bank_soal ADD COLUMN kelas_id bigint REFERENCES kelas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- CATATAN PERILAKU: tambah kelas_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catatan_perilaku' AND column_name = 'tanggal') THEN
    ALTER TABLE catatan_perilaku ADD COLUMN tanggal date NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- PENGUMUMAN: tambah jenis (Umum/Khusus Ustaz/Khusus Admin)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pengumuman' AND column_name = 'jenis') THEN
    ALTER TABLE pengumuman ADD COLUMN jenis text NOT NULL DEFAULT 'Umum' CHECK (jenis IN ('Umum', 'Khusus Ustaz', 'Khusus Admin'));
  END IF;
END $$;

-- Indexes tambahan
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_kelas_user_aktif ON kelas(user_id, aktif);
CREATE INDEX IF NOT EXISTS idx_murid_kelas_id ON murid(kelas_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_kelas_id ON jadwal_mengajar(kelas_id);
CREATE INDEX IF NOT EXISTS idx_absensi_kelas_id ON absensi(kelas_id);
CREATE INDEX IF NOT EXISTS idx_kbm_kelas_tanggal ON kbm_harian(kelas_id, tanggal);
