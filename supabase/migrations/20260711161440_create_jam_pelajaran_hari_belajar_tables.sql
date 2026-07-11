/*
# Create jam_pelajaran and hari_belajar tables

1. New Tables
- `jam_pelajaran`: Stores time slots for teaching periods (e.g., 07:00-07:45).
  - id (uuid, primary key)
  - nama_jam (varchar, e.g., "Jam ke-1")
  - jam_mulai (time, start time)
  - jam_selesai (time, end time)
  - urutan (int, display order)
  - is_active (boolean, default true)
  - created_at, updated_at (timestamps)
- `hari_belajar`: Stores days of the week that are learning days.
  - id (uuid, primary key)
  - nama_hari (varchar, e.g., "Senin")
  - urutan (int, display order, 1-7)
  - is_active (boolean, default true)
  - created_at, updated_at (timestamps)

2. Security
- RLS enabled on both tables.
- Admin-only CRUD policies (TO authenticated, ownership via user_id default).
- Both tables have user_id column defaulting to auth.uid() for ownership.
*/

CREATE TABLE IF NOT EXISTS jam_pelajaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_jam varchar NOT NULL,
  jam_mulai time,
  jam_selesai time,
  urutan int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jam_pelajaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_jam_pelajaran" ON jam_pelajaran;
CREATE POLICY "select_own_jam_pelajaran" ON jam_pelajaran FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_jam_pelajaran" ON jam_pelajaran;
CREATE POLICY "insert_own_jam_pelajaran" ON jam_pelajaran FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_jam_pelajaran" ON jam_pelajaran;
CREATE POLICY "update_own_jam_pelajaran" ON jam_pelajaran FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_jam_pelajaran" ON jam_pelajaran;
CREATE POLICY "delete_own_jam_pelajaran" ON jam_pelajaran FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS hari_belajar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_hari varchar NOT NULL,
  urutan int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hari_belajar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_hari_belajar" ON hari_belajar;
CREATE POLICY "select_own_hari_belajar" ON hari_belajar FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_hari_belajar" ON hari_belajar;
CREATE POLICY "insert_own_hari_belajar" ON hari_belajar FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_hari_belajar" ON hari_belajar;
CREATE POLICY "update_own_hari_belajar" ON hari_belajar FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_hari_belajar" ON hari_belajar;
CREATE POLICY "delete_own_hari_belajar" ON hari_belajar FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
