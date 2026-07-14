/*
# Add lembaga_id column to ruangan table

1. Modified Tables
- `ruangan`: Added `lembaga_id` column (uuid, nullable, references lembaga.id)
2. Security
- No RLS policy changes needed — existing policies on ruangan remain intact.
3. Notes
- The `kelas` table already has `lembaga_id`. This migration adds the same column to `ruangan` so both can be associated with a lembaga.
- The column is nullable to preserve existing rows.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ruangan' AND column_name = 'lembaga_id'
  ) THEN
    ALTER TABLE ruangan ADD COLUMN lembaga_id uuid REFERENCES lembaga(id) ON DELETE SET NULL;
  END IF;
END $$;
