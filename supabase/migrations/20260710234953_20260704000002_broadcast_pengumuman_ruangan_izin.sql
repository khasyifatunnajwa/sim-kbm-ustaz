-- Apply July 4th migration 2: Broadcast pengumuman, ruangan, izin_mengajar
-- All statements are idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS)

-- 1. Pengumuman: add broadcast columns
ALTER TABLE pengumuman ADD COLUMN IF NOT EXISTS jenis text DEFAULT 'Pengumuman';
ALTER TABLE pengumuman ADD COLUMN IF NOT EXISTS prioritas text DEFAULT 'Normal';
ALTER TABLE pengumuman ADD COLUMN IF NOT EXISTS tanggal_mulai date;
ALTER TABLE pengumuman ADD COLUMN IF NOT EXISTS tanggal_selesai date;
ALTER TABLE pengumuman ADD COLUMN IF NOT EXISTS status text DEFAULT 'Draft';
ALTER TABLE pengumuman ADD COLUMN IF NOT EXISTS lampiran text;
ALTER TABLE pengumuman ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE pengumuman ADD COLUMN IF NOT EXISTS dibuat_oleh uuid DEFAULT auth.uid();

UPDATE pengumuman SET tanggal_mulai = tanggal WHERE tanggal_mulai IS NULL AND tanggal IS NOT NULL;
UPDATE pengumuman SET tanggal_selesai = tanggal + INTERVAL '30 days' WHERE tanggal_selesai IS NULL AND tanggal IS NOT NULL;
UPDATE pengumuman SET status = 'Publish' WHERE status IS NULL OR status = 'Draft';

CREATE INDEX IF NOT EXISTS idx_pengumuman_broadcast ON pengumuman (status, tanggal_mulai, tanggal_selesai);

-- 2. Ruangan table
CREATE TABLE IF NOT EXISTS ruangan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_ruangan text NOT NULL,
  kode text,
  kapasitas integer,
  keterangan text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ruangan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_ruangan" ON ruangan;
CREATE POLICY "admin_all_ruangan" ON ruangan FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "select_all_ruangan" ON ruangan;
CREATE POLICY "select_all_ruangan" ON ruangan FOR SELECT
  TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_ruangan_active ON ruangan (is_active);

-- 3. Izin Mengajar table
CREATE TABLE IF NOT EXISTS izin_mengajar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_ustaz text NOT NULL,
  jenis_izin text NOT NULL DEFAULT 'Izin',
  lama_izin text NOT NULL DEFAULT 'hari_ini',
  tanggal_mulai date NOT NULL DEFAULT CURRENT_DATE,
  tanggal_selesai date,
  mata_pelajaran text,
  kelas text,
  guru_pengganti text,
  catatan text,
  status text NOT NULL DEFAULT 'diajukan',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE izin_mengajar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_izin_mengajar" ON izin_mengajar;
CREATE POLICY "admin_all_izin_mengajar" ON izin_mengajar FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "select_own_izin_mengajar" ON izin_mengajar;
CREATE POLICY "select_own_izin_mengajar" ON izin_mengajar FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_izin_mengajar" ON izin_mengajar;
CREATE POLICY "insert_own_izin_mengajar" ON izin_mengajar FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_izin_mengajar" ON izin_mengajar;
CREATE POLICY "update_own_izin_mengajar" ON izin_mengajar FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_izin_mengajar" ON izin_mengajar;
CREATE POLICY "delete_own_izin_mengajar" ON izin_mengajar FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_izin_mengajar_user ON izin_mengajar (user_id);
CREATE INDEX IF NOT EXISTS idx_izin_mengajar_status ON izin_mengajar (status);

-- 4. Pengumuman SELECT policy
DROP POLICY IF EXISTS "select_all_pengumuman" ON pengumuman;
CREATE POLICY "select_all_pengumuman" ON pengumuman FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_pengumuman_v2" ON pengumuman;
CREATE POLICY "admin_all_pengumuman_v2" ON pengumuman FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());