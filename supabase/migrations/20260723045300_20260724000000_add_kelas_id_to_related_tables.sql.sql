-- Add kelas_id FK to jurnal_kbm, izin_mengajar, sikap tables
-- These tables currently store kelas as a name string; adding kelas_id as FK
-- to the kelas table for proper referential integrity.

-- 1. jurnal_kbm
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jurnal_kbm' AND column_name = 'kelas_id'
  ) THEN
    ALTER TABLE jurnal_kbm ADD COLUMN kelas_id uuid;
    ALTER TABLE jurnal_kbm ADD CONSTRAINT fk_jurnal_kbm_kelas FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL;
    CREATE INDEX idx_jurnal_kbm_kelas_id ON jurnal_kbm(kelas_id);
  END IF;
END $$;

-- Populate kelas_id from kelas name
UPDATE jurnal_kbm j
SET kelas_id = k.id
FROM kelas k
WHERE j.kelas_id IS NULL
  AND j.kelas IS NOT NULL
  AND j.kelas = k.nama_kelas;

-- 2. izin_mengajar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'izin_mengajar' AND column_name = 'kelas_id'
  ) THEN
    ALTER TABLE izin_mengajar ADD COLUMN kelas_id uuid;
    ALTER TABLE izin_mengajar ADD CONSTRAINT fk_izin_mengajar_kelas FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL;
    CREATE INDEX idx_izin_mengajar_kelas_id ON izin_mengajar(kelas_id);
  END IF;
END $$;

-- Populate kelas_id from kelas name
UPDATE izin_mengajar i
SET kelas_id = k.id
FROM kelas k
WHERE i.kelas_id IS NULL
  AND i.kelas IS NOT NULL
  AND i.kelas = k.nama_kelas;

-- 3. sikap
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sikap' AND column_name = 'kelas_id'
  ) THEN
    ALTER TABLE sikap ADD COLUMN kelas_id uuid;
    ALTER TABLE sikap ADD CONSTRAINT fk_sikap_kelas FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL;
    CREATE INDEX idx_sikap_kelas_id ON sikap(kelas_id);
  END IF;
END $$;

-- Populate kelas_id from murid's kelas_id
UPDATE sikap s
SET kelas_id = m.kelas_id
FROM murid m
WHERE s.kelas_id IS NULL
  AND s.murid_id = m.id
  AND m.kelas_id IS NOT NULL;
