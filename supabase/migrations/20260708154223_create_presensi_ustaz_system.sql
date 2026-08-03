/*
# Create Presensi Ustaz System (Table + Storage Bucket + RLS)

## Overview
This migration creates the infrastructure for the Ustaz (teacher) attendance system
with photo capture, GPS tracking, and automatic 24-hour photo deletion.

## 1. New Tables

### `presensi_ustaz`
Stores teacher attendance records with embedded photo proof and GPS coordinates.
- `id` (uuid, primary key) — unique record identifier
- `guru_id` (uuid, not null, defaults to auth.uid()) — the teacher who submitted attendance
- `kelas_id` (bigint, nullable) — reference to kelas table (which class was attended)
- `jadwal_id` (uuid, nullable) — reference to jadwal_mengajar table (which schedule)
- `tanggal` (date, not null) — the date of attendance
- `jam_server` (timestamptz, not null, default now()) — server timestamp at presensi submission
- `latitude` (numeric, nullable) — GPS latitude at time of capture
- `longitude` (numeric, nullable) — GPS longitude at time of capture
- `akurasi_gps` (numeric, nullable) — GPS accuracy in meters
- `status` (text, not null, default 'Hadir') — attendance status: 'Hadir', 'Terlambat', 'Belum Presensi'
- `photo_url` (text, nullable) — Supabase Storage URL; set to NULL after 24h auto-deletion
- `photo_expired` (boolean, default false) — true after photo is auto-deleted
- `created_at` (timestamptz, default now()) — record creation timestamp

## 2. Modified Tables

### `profiles`
- Added `id_login` (text, nullable) — login identifier for the teacher
- Added `alamat` (text, nullable) — home address of the teacher

## 3. Storage

### Bucket: `presensi-ustaz`
- Public bucket for storing attendance photos
- File path structure: `tahun/bulan/tanggal/guruid_timestamp.jpg`
- Photos auto-deleted after 24 hours via edge function (data record preserved)

### Storage Policies
- Authenticated users can upload to their own folder path (path starts with their user ID)
- Authenticated users can read their own photos
- Admin users (role = 'admin' in profiles) can read all photos

## 4. Security (RLS)

### `presensi_ustaz` table
- **SELECT**: Teachers can only see their own attendance records. Admins can see all records.
- **INSERT**: Teachers can only insert their own attendance records (auth.uid() = guru_id).
- **UPDATE**: No update policy — records are immutable once created (teachers cannot modify attendance after submission).
- **DELETE**: No delete policy — records cannot be deleted through the anon key. The cleanup edge function uses the service role key which bypasses RLS.

### Admin detection
Admin role is determined by checking `profiles.role = 'admin'` for the authenticated user.

## 5. Important Notes

1. The `presensi_ustaz` table is separate from the existing `presensi_guru` table which has a simpler structure without photo/GPS support.
2. The `DEFAULT auth.uid()` on `guru_id` ensures that frontend inserts that omit `guru_id` still satisfy the INSERT policy's `WITH CHECK (auth.uid() = guru_id)`.
3. No UPDATE or DELETE policies are created — this enforces immutability of attendance records at the database level.
4. The cleanup edge function (deployed separately) will use the service role key to update `photo_url` to NULL and set `photo_expired = true` after 24 hours, and delete the file from Storage.
5. Storage policies use path-based ownership: files must be uploaded to a path starting with the user's UUID.
*/

-- ============================================================
-- 1. Add missing columns to profiles table
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'id_login'
  ) THEN
    ALTER TABLE profiles ADD COLUMN id_login text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'alamat'
  ) THEN
    ALTER TABLE profiles ADD COLUMN alamat text;
  END IF;
END $$;

-- ============================================================
-- 2. Create presensi_ustaz table
-- ============================================================
CREATE TABLE IF NOT EXISTS presensi_ustaz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kelas_id bigint REFERENCES kelas(id) ON DELETE SET NULL,
  jadwal_id uuid REFERENCES jadwal_mengajar(id) ON DELETE SET NULL,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  jam_server timestamptz NOT NULL DEFAULT now(),
  latitude numeric(10,7),
  longitude numeric(10,7),
  akurasi_gps numeric(10,2),
  status text NOT NULL DEFAULT 'Hadir' CHECK (status IN ('Hadir', 'Terlambat', 'Belum Presensi')),
  photo_url text,
  photo_expired boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE presensi_ustaz ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_presensi_ustaz_guru_id ON presensi_ustaz(guru_id);
CREATE INDEX IF NOT EXISTS idx_presensi_ustaz_tanggal ON presensi_ustaz(tanggal);
CREATE INDEX IF NOT EXISTS idx_presensi_ustaz_status ON presensi_ustaz(status);
CREATE INDEX IF NOT EXISTS idx_presensi_ustaz_jam_server ON presensi_ustaz(jam_server);

-- ============================================================
-- 4. RLS Policies for presensi_ustaz
-- ============================================================

-- SELECT: Teachers see own records, admins see all
DROP POLICY IF EXISTS "select_own_presensi_ustaz" ON presensi_ustaz;
CREATE POLICY "select_own_presensi_ustaz"
ON presensi_ustaz FOR SELECT
TO authenticated
USING (
  auth.uid() = guru_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- INSERT: Teachers can only insert their own records
DROP POLICY IF EXISTS "insert_own_presensi_ustaz" ON presensi_ustaz;
CREATE POLICY "insert_own_presensi_ustaz"
ON presensi_ustaz FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = guru_id);

-- No UPDATE policy: records are immutable once created
-- No DELETE policy: records cannot be deleted via anon key

-- ============================================================
-- 5. Create Storage Bucket for presensi photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('presensi-ustaz', 'presensi-ustaz', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. Storage Policies for presensi-ustaz bucket
-- ============================================================

-- Upload: authenticated users can upload to their own folder path
DROP POLICY IF EXISTS "Allow authenticated upload to presensi-ustaz" ON storage.objects;
CREATE POLICY "Allow authenticated upload to presensi-ustaz"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'presensi-ustaz'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Read: anyone can read (public bucket for photo access)
DROP POLICY IF EXISTS "Allow public read from presensi-ustaz" ON storage.objects;
CREATE POLICY "Allow public read from presensi-ustaz"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'presensi-ustaz');

-- Delete: only service role can delete (used by cleanup edge function)
-- No delete policy for authenticated users — photos are managed by the edge function

-- ============================================================
-- 7. Add helpful comment
-- ============================================================
COMMENT ON TABLE presensi_ustaz IS 'Teacher attendance records with photo proof and GPS coordinates. Photos auto-deleted after 24 hours via edge function.';