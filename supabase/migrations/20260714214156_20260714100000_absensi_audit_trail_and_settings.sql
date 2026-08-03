/*
# Absensi Enhancement: Audit Trail, Telat/Belum Hadir Status, Jam Pelajaran Settings

## Summary
Adds new features to support the enhanced attendance system:
1. New columns on `absensi` table for late arrival tracking
2. New `audit_trail_absensi` table for full change history
3. New columns on `jam_pelajaran` for edit deadline and late threshold

## Changes

### Modified: `absensi` table
- `status` now supports 'Belum Hadir' and 'Telat' in addition to existing values
- `jam_datang` (time) — actual arrival time for late students
- `telat_menit` (integer) — minutes late, calculated from jam_masuk
- `diubah_oleh` (uuid) — profile id of who last changed the status
- `alasan_ubah` (text) — optional reason for status change

### New Table: `audit_trail_absensi`
Stores every status change for an attendance record.
- `id` (uuid, PK)
- `absensi_id` (uuid, FK → absensi)
- `murid_id` (uuid, FK → murid)
- `tanggal` (date)
- `status_lama` (text)
- `status_baru` (text)
- `jam_datang` (time) — at time of change
- `telat_menit` (integer)
- `diubah_oleh` (uuid, FK → profiles) — null means system auto-change
- `diubah_oleh_nama` (text) — cached name for display
- `alasan` (text)
- `tipe_perubahan` (text) — 'guru' | 'admin' | 'sistem'
- `created_at` (timestamptz)

### Modified: `jam_pelajaran` table
- `batas_terlambat` (integer, minutes after jam_mulai) — default 15
- `batas_edit_absensi` (integer, minutes after jam_mulai) — default 40

## Security
- RLS enabled on `audit_trail_absensi`
- All authenticated users can read audit trail
- Only authenticated users can insert (via app logic)
- No delete/update allowed (immutable log)
*/

-- Add new columns to absensi (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absensi' AND column_name='jam_datang') THEN
    ALTER TABLE absensi ADD COLUMN jam_datang time;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absensi' AND column_name='telat_menit') THEN
    ALTER TABLE absensi ADD COLUMN telat_menit integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absensi' AND column_name='diubah_oleh') THEN
    ALTER TABLE absensi ADD COLUMN diubah_oleh uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absensi' AND column_name='alasan_ubah') THEN
    ALTER TABLE absensi ADD COLUMN alasan_ubah text;
  END IF;
END $$;

-- Add new columns to jam_pelajaran (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jam_pelajaran' AND column_name='batas_terlambat') THEN
    ALTER TABLE jam_pelajaran ADD COLUMN batas_terlambat integer DEFAULT 15;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jam_pelajaran' AND column_name='batas_edit_absensi') THEN
    ALTER TABLE jam_pelajaran ADD COLUMN batas_edit_absensi integer DEFAULT 40;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jam_pelajaran' AND column_name='batas_terlambat_presensi') THEN
    ALTER TABLE jam_pelajaran ADD COLUMN batas_terlambat_presensi integer DEFAULT 15;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jam_pelajaran' AND column_name='batas_edit_presensi') THEN
    ALTER TABLE jam_pelajaran ADD COLUMN batas_edit_presensi integer DEFAULT 40;
  END IF;
END $$;

-- Create audit_trail_absensi table
CREATE TABLE IF NOT EXISTS audit_trail_absensi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  absensi_id uuid REFERENCES absensi(id) ON DELETE SET NULL,
  murid_id uuid REFERENCES murid(id) ON DELETE SET NULL,
  jadwal_id uuid,
  tanggal date NOT NULL,
  status_lama text,
  status_baru text NOT NULL,
  jam_datang time,
  telat_menit integer,
  diubah_oleh uuid REFERENCES profiles(id) ON DELETE SET NULL,
  diubah_oleh_nama text,
  alasan text,
  tipe_perubahan text DEFAULT 'guru' CHECK (tipe_perubahan IN ('guru', 'admin', 'sistem')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_trail_absensi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_audit_trail_absensi" ON audit_trail_absensi;
CREATE POLICY "select_audit_trail_absensi" ON audit_trail_absensi FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_audit_trail_absensi" ON audit_trail_absensi;
CREATE POLICY "insert_audit_trail_absensi" ON audit_trail_absensi FOR INSERT
  TO authenticated WITH CHECK (true);

-- Enable realtime on audit_trail_absensi
ALTER PUBLICATION supabase_realtime ADD TABLE audit_trail_absensi;
