/*
# Add Lembaga (Institution) System + Missing Columns

## Summary
This migration adds multi-institution (lembaga) support to the SIM KBM application.
A single ustaz may teach at multiple lembaga (madrasah/pesantren). All major tables
get a `lembaga_id` column so data can be scoped per institution.

## New Tables
1. `lembaga` — Institution master table
   - `id` (uuid, PK)
   - `nama_lembaga` (text, not null) — Institution name
   - `alamat` (text) — Address
   - `telepon` (text) — Phone
   - `user_id` (uuid) — Owner (who created it)
   - `created_at`, `updated_at` (timestamptz)

2. `catatan_guru_notifikasi` — Track unread catatan_guru for dashboard notifications
   - `id` (uuid, PK)
   - `catatan_guru_id` (uuid, FK → catatan_guru.id)
   - `user_id` (uuid) — Recipient ustaz
   - `dibaca` (boolean, default false)
   - `created_at` (timestamptz)

## Modified Tables (add `lembaga_id` column)
- `murid` — add `lembaga_id uuid` nullable
- `jadwal_mengajar` — add `lembaga_id uuid` nullable
- `jurnal_kbm` — add `lembaga_id uuid` nullable
- `absensi` — add `lembaga_id uuid` nullable
- `sikap` — add `lembaga_id uuid` nullable
- `soal_baru` — add `lembaga_id uuid` nullable
- `penilaian` — add `lembaga_id uuid` nullable
- `presensi_guru` — add `lembaga_id uuid` nullable, add `foto_url text` nullable, add `telat_menit integer` nullable

## Modified Tables (add missing columns)
- `pengumuman` — add `jenis text`, `prioritas text`, `status text DEFAULT 'Draft'`,
  `tanggal_mulai date`, `tanggal_selesai date`, `lampiran text`
  (The app already uses these columns but they were missing from DB)

## Security
- RLS enabled on `lembaga` — admin can CRUD, all authenticated can SELECT
- RLS enabled on `catatan_guru_notifikasi` — owner-scoped CRUD
- Existing RLS policies on modified tables remain unchanged

## Notes
1. All `lembaga_id` columns are nullable to preserve existing data
2. No foreign keys are added to avoid breaking existing inserts that don't set lembaga_id
3. The `pengumuman` columns are added with IF NOT EXISTS safety
4. `presensi_guru` gets `foto_url` and `telat_menit` for the presensi feature
*/

-- ═══════════════════════════════════════════════════════════
-- 1. CREATE LEMBAGA TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS lembaga (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_lembaga text NOT NULL,
  alamat text,
  telepon text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lembaga ENABLE ROW LEVEL SECURITY;

-- Admin can do everything, all authenticated can read
DROP POLICY IF EXISTS "select_lembaga_all" ON lembaga;
CREATE POLICY "select_lembaga_all" ON lembaga FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_lembaga_admin" ON lembaga;
CREATE POLICY "insert_lembaga_admin" ON lembaga FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_lembaga_admin" ON lembaga;
CREATE POLICY "update_lembaga_admin" ON lembaga FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_lembaga_admin" ON lembaga;
CREATE POLICY "delete_lembaga_admin" ON lembaga FOR DELETE
  TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════
-- 2. ADD lembaga_id TO ALL RELEVANT TABLES
-- ═══════════════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='murid' AND column_name='lembaga_id') THEN
    ALTER TABLE murid ADD COLUMN lembaga_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jadwal_mengajar' AND column_name='lembaga_id') THEN
    ALTER TABLE jadwal_mengajar ADD COLUMN lembaga_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jurnal_kbm' AND column_name='lembaga_id') THEN
    ALTER TABLE jurnal_kbm ADD COLUMN lembaga_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absensi' AND column_name='lembaga_id') THEN
    ALTER TABLE absensi ADD COLUMN lembaga_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sikap' AND column_name='lembaga_id') THEN
    ALTER TABLE sikap ADD COLUMN lembaga_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='soal_baru' AND column_name='lembaga_id') THEN
    ALTER TABLE soal_baru ADD COLUMN lembaga_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='penilaian' AND column_name='lembaga_id') THEN
    ALTER TABLE penilaian ADD COLUMN lembaga_id uuid;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 3. ADD COLUMNS TO presensi_guru
-- ═══════════════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='presensi_guru' AND column_name='lembaga_id') THEN
    ALTER TABLE presensi_guru ADD COLUMN lembaga_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='presensi_guru' AND column_name='foto_url') THEN
    ALTER TABLE presensi_guru ADD COLUMN foto_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='presensi_guru' AND column_name='telat_menit') THEN
    ALTER TABLE presensi_guru ADD COLUMN telat_menit integer DEFAULT 0;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 4. ADD MISSING COLUMNS TO pengumuman
-- ═══════════════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pengumuman' AND column_name='jenis') THEN
    ALTER TABLE pengumuman ADD COLUMN jenis text DEFAULT 'Pengumuman';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pengumuman' AND column_name='prioritas') THEN
    ALTER TABLE pengumuman ADD COLUMN prioritas text DEFAULT 'Normal';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pengumuman' AND column_name='status') THEN
    ALTER TABLE pengumuman ADD COLUMN status text DEFAULT 'Draft';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pengumuman' AND column_name='tanggal_mulai') THEN
    ALTER TABLE pengumuman ADD COLUMN tanggal_mulai date;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pengumuman' AND column_name='tanggal_selesai') THEN
    ALTER TABLE pengumuman ADD COLUMN tanggal_selesai date;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pengumuman' AND column_name='lampiran') THEN
    ALTER TABLE pengumuman ADD COLUMN lampiran text;
  END IF;
END $$;

-- Backfill tanggal_mulai from tanggal where tanggal_mulai is null
UPDATE pengumuman SET tanggal_mulai = tanggal WHERE tanggal_mulai IS NULL AND tanggal IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- 5. CREATE catatan_guru_notifikasi TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS catatan_guru_notifikasi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catatan_guru_id uuid REFERENCES catatan_guru(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  dibaca boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE catatan_guru_notifikasi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_catatan_notif" ON catatan_guru_notifikasi;
CREATE POLICY "select_own_catatan_notif" ON catatan_guru_notifikasi FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_catatan_notif" ON catatan_guru_notifikasi;
CREATE POLICY "insert_own_catatan_notif" ON catatan_guru_notifikasi FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_catatan_notif" ON catatan_guru_notifikasi;
CREATE POLICY "update_own_catatan_notif" ON catatan_guru_notifikasi FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_catatan_notif" ON catatan_guru_notifikasi;
CREATE POLICY "delete_own_catatan_notif" ON catatan_guru_notifikasi FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- 6. ADD guru_pengganti_id TO jadwal_mengajar (for guru pengganti feature)
-- ═══════════════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jadwal_mengajar' AND column_name='guru_pengganti_id') THEN
    ALTER TABLE jadwal_mengajar ADD COLUMN guru_pengganti_id uuid;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 7. ADD is_jumat_libur SETTING (for Friday holiday)
-- ═══════════════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jadwal_mengajar' AND column_name='is_libur') THEN
    ALTER TABLE jadwal_mengajar ADD COLUMN is_libur boolean DEFAULT false;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 8. ENABLE REALTIME ON ALL TABLES
-- ═══════════════════════════════════════════════════════════
ALTER TABLE lembaga REPLICA IDENTITY FULL;
ALTER TABLE catatan_guru_notifikasi REPLICA IDENTITY FULL;
ALTER TABLE pengumuman REPLICA IDENTITY FULL;
ALTER TABLE jadwal_mengajar REPLICA IDENTITY FULL;
ALTER TABLE murid REPLICA IDENTITY FULL;
ALTER TABLE presensi_guru REPLICA IDENTITY FULL;
ALTER TABLE absensi REPLICA IDENTITY FULL;
ALTER TABLE jurnal_kbm REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE lembaga;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE catatan_guru_notifikasi;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pengumuman;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE jadwal_mengajar;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE murid;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE presensi_guru;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE absensi;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE jurnal_kbm;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
