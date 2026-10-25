-- Mengganti tingkat numerik kelas menjadi nama tingkat.
-- Tidak menghapus kelas, ID, atau relasi. Semua kelas yang ada menjadi Ibtida’i.
-- Terapkan setelah meninjau skema dan memastikan migration ini belum pernah dijalankan.

BEGIN;

ALTER TABLE public.kelas
  DROP CONSTRAINT IF EXISTS kelas_tingkat_check;

ALTER TABLE public.kelas
  ALTER COLUMN tingkat TYPE text USING 'Ibtida’i';

ALTER TABLE public.kelas
  ALTER COLUMN tingkat SET DEFAULT 'Ibtida’i';

UPDATE public.kelas
  SET tingkat = 'Ibtida’i';

ALTER TABLE public.kelas
  ADD CONSTRAINT kelas_tingkat_check
  CHECK (tingkat IN ('Tamhidi', 'Ibtida’i', 'Tsanawiyah', 'Ulya', 'Kuliyah Syariah'));


COMMIT;
