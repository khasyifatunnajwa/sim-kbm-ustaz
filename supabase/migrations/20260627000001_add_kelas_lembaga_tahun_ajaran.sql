-- Tambah kolom lembaga dan tahun_ajaran ke tabel kelas jika belum ada
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kelas' AND column_name = 'lembaga'
  ) THEN
    ALTER TABLE kelas ADD COLUMN lembaga text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kelas' AND column_name = 'tahun_ajaran'
  ) THEN
    ALTER TABLE kelas ADD COLUMN tahun_ajaran text;
  END IF;
END $$;

-- Pastikan murid.kelas_id ada sebagai FK ke kelas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'murid' AND column_name = 'kelas_id'
  ) THEN
    ALTER TABLE murid ADD COLUMN kelas_id bigint REFERENCES kelas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Pastikan jadwal_mengajar.kelas_id ada sebagai FK ke kelas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jadwal_mengajar' AND column_name = 'kelas_id'
  ) THEN
    ALTER TABLE jadwal_mengajar ADD COLUMN kelas_id bigint REFERENCES kelas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index performa
CREATE INDEX IF NOT EXISTS idx_murid_kelas_id ON murid(kelas_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_kelas_id ON jadwal_mengajar(kelas_id);
CREATE INDEX IF NOT EXISTS idx_kelas_user_aktif ON kelas(user_id, aktif);
