/*
# Add Gender System (Banin/Banat/Campuran)

1. Modified Tables
- `kelas`: Added `gender` column (text, nullable) — values: 'Banin', 'Banat', 'Campuran'
- `murid`: Added `gender_kelas` column (text, nullable) — values: 'Banin', 'Banat', 'Campuran'
  (Note: `jenis_kelamin` already exists on `murid` as varchar with 'L'/'P')
- `profiles`: Added `jenis_kelamin` column (text, nullable) — values: 'L', 'P'
- `profiles`: Added `boleh_mengajar` column (text, nullable) — values: 'Banin', 'Banat', 'Keduanya'
- `jadwal_mengajar`: Added `gender` column (text, nullable) — values: 'Banin', 'Banat', 'Campuran'

2. Security
- No RLS policy changes needed — existing policies remain intact.
- New columns are nullable so existing rows are unaffected.

3. Notes
- All columns are nullable to preserve backward compatibility with existing data.
- Gender values are stored as text for flexibility (not enum constraints).
- The `pengaturan` table already exists for app settings; gender settings will be stored
  in the frontend settings store (zustand persist) and optionally synced to `pengaturan` table.
*/

DO $$
BEGIN
  -- kelas.gender
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kelas' AND column_name = 'gender') THEN
    ALTER TABLE kelas ADD COLUMN gender text;
  END IF;

  -- murid.gender_kelas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'murid' AND column_name = 'gender_kelas') THEN
    ALTER TABLE murid ADD COLUMN gender_kelas text;
  END IF;

  -- profiles.jenis_kelamin
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'jenis_kelamin') THEN
    ALTER TABLE profiles ADD COLUMN jenis_kelamin text;
  END IF;

  -- profiles.boleh_mengajar
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'boleh_mengajar') THEN
    ALTER TABLE profiles ADD COLUMN boleh_mengajar text;
  END IF;

  -- jadwal_mengajar.gender
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jadwal_mengajar' AND column_name = 'gender') THEN
    ALTER TABLE jadwal_mengajar ADD COLUMN gender text;
  END IF;
END $$;
