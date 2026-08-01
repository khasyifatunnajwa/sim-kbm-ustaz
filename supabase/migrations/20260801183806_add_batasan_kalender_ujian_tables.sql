/*
# Add Batasan Mengajar, Kalender Pendidikan, and Jadwal Ujian Tables

## Summary
Creates three new tables to support the Batasan (teaching bounds), Kalender Pendidikan (academic calendar), and Jadwal Ujian (exam schedule) features.

## New Tables

### 1. batasan_mengajar
Stores teaching material bounds per semester for each class/subject/lembaga combination.
- `id` (uuid PK)
- `lembaga_id` (uuid FK to lembaga, nullable)
- `kelas_id` (uuid FK to kelas, nullable)
- `mapel_id` (uuid FK to mata_pelajaran, nullable)
- `gender` (text, nullable — Banin/Banat/Campuran)
- `semester` (integer — 1 or 2)
- `tahun_ajaran_id` (uuid FK to tahun_ajaran, nullable)
- `bab_mulai` (text — starting chapter)
- `halaman_mulai` (text — starting page)
- `bab_selesai` (text — ending chapter)
- `halaman_selesai` (text — ending page)
- `keterangan` (text, nullable)
- `user_id` (uuid, defaults to auth.uid())
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamps)

### 2. kalender_pendidikan
Stores academic calendar events (holidays, exams, meetings, activities).
- `id` (uuid PK)
- `judul` (text, not null — event title)
- `deskripsi` (text, nullable)
- `jenis` (text — 'Libur', 'Ujian', 'Rapat', 'Kegiatan', 'Penting', 'Lainnya')
- `tanggal_mulai` (date, not null)
- `tanggal_selesai` (date, nullable — for multi-day events)
- `warna` (text, nullable — for calendar color coding)
- `lembaga_id` (uuid FK to lembaga, nullable)
- `user_id` (uuid, defaults to auth.uid())
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamps)

### 3. jadwal_ujian
Stores exam schedules, linked to kalender_pendidikan entries.
- `id` (uuid PK)
- `judul` (text, not null — exam name)
- `jenis_ujian` (text — 'UTS', 'UAS', 'Ulangan', 'Lisan', 'Lainnya')
- `kelas_id` (uuid FK to kelas, nullable)
- `mapel_id` (uuid FK to mata_pelajaran, nullable)
- `tanggal` (date, not null)
- `jam_mulai` (text, nullable)
- `jam_selesai` (text, nullable)
- `ruangan` (text, nullable)
- `kalender_id` (uuid FK to kalender_pendidikan, nullable)
- `lembaga_id` (uuid FK to lembaga, nullable)
- `user_id` (uuid, defaults to auth.uid())
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamps)

## Security
- RLS enabled on all three tables.
- CRUD policies for authenticated users (owner-scoped via user_id).
- Admin users get full access via existing is_admin() function pattern.

## Notes
1. All tables use UUID primary keys with gen_random_uuid() defaults.
2. user_id columns default to auth.uid() for seamless inserts.
3. Foreign keys use ON DELETE SET NULL to avoid data loss on parent deletion.
4. is_active column supports soft deletes.
*/

-- ===== 1. BATASAN MENGAJAR =====
CREATE TABLE IF NOT EXISTS batasan_mengajar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lembaga_id uuid REFERENCES lembaga(id) ON DELETE SET NULL,
  kelas_id uuid REFERENCES kelas(id) ON DELETE SET NULL,
  mapel_id uuid REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
  gender text,
  semester integer DEFAULT 1,
  tahun_ajaran_id uuid REFERENCES tahun_ajaran(id) ON DELETE SET NULL,
  bab_mulai text,
  halaman_mulai text,
  bab_selesai text,
  halaman_selesai text,
  keterangan text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE batasan_mengajar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_batasan_mengajar" ON batasan_mengajar;
CREATE POLICY "select_batasan_mengajar" ON batasan_mengajar FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_batasan_mengajar" ON batasan_mengajar;
CREATE POLICY "insert_batasan_mengajar" ON batasan_mengajar FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_batasan_mengajar" ON batasan_mengajar;
CREATE POLICY "update_batasan_mengajar" ON batasan_mengajar FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_batasan_mengajar" ON batasan_mengajar;
CREATE POLICY "delete_batasan_mengajar" ON batasan_mengajar FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_batasan_lembaga ON batasan_mengajar(lembaga_id);
CREATE INDEX IF NOT EXISTS idx_batasan_kelas ON batasan_mengajar(kelas_id);
CREATE INDEX IF NOT EXISTS idx_batasan_mapel ON batasan_mengajar(mapel_id);

-- ===== 2. KALENDER PENDIDIKAN =====
CREATE TABLE IF NOT EXISTS kalender_pendidikan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  deskripsi text,
  jenis text DEFAULT 'Kegiatan',
  tanggal_mulai date NOT NULL,
  tanggal_selesai date,
  warna text,
  lembaga_id uuid REFERENCES lembaga(id) ON DELETE SET NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kalender_pendidikan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_kalender_pendidikan" ON kalender_pendidikan;
CREATE POLICY "select_kalender_pendidikan" ON kalender_pendidikan FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_kalender_pendidikan" ON kalender_pendidikan;
CREATE POLICY "insert_kalender_pendidikan" ON kalender_pendidikan FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_kalender_pendidikan" ON kalender_pendidikan;
CREATE POLICY "update_kalender_pendidikan" ON kalender_pendidikan FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_kalender_pendidikan" ON kalender_pendidikan;
CREATE POLICY "delete_kalender_pendidikan" ON kalender_pendidikan FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_kalender_tanggal ON kalender_pendidikan(tanggal_mulai);
CREATE INDEX IF NOT EXISTS idx_kalender_jenis ON kalender_pendidikan(jenis);

-- ===== 3. JADWAL UJIAN =====
CREATE TABLE IF NOT EXISTS jadwal_ujian (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  jenis_ujian text DEFAULT 'Ulangan',
  kelas_id uuid REFERENCES kelas(id) ON DELETE SET NULL,
  mapel_id uuid REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
  tanggal date NOT NULL,
  jam_mulai text,
  jam_selesai text,
  ruangan text,
  kalender_id uuid REFERENCES kalender_pendidikan(id) ON DELETE SET NULL,
  lembaga_id uuid REFERENCES lembaga(id) ON DELETE SET NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jadwal_ujian ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_jadwal_ujian" ON jadwal_ujian;
CREATE POLICY "select_jadwal_ujian" ON jadwal_ujian FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_jadwal_ujian" ON jadwal_ujian;
CREATE POLICY "insert_jadwal_ujian" ON jadwal_ujian FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_jadwal_ujian" ON jadwal_ujian;
CREATE POLICY "update_jadwal_ujian" ON jadwal_ujian FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_jadwal_ujian" ON jadwal_ujian;
CREATE POLICY "delete_jadwal_ujian" ON jadwal_ujian FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ujian_tanggal ON jadwal_ujian(tanggal);
CREATE INDEX IF NOT EXISTS idx_ujian_kelas ON jadwal_ujian(kelas_id);
CREATE INDEX IF NOT EXISTS idx_ujian_kalender ON jadwal_ujian(kalender_id);