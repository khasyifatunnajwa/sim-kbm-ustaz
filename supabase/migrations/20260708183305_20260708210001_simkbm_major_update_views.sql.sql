/*
# SIM KBM Ustaz Major Update - Part 2: Views and Functions

Creates dashboard views and utility functions for statistics
*/

-- ============================================================
-- 1. DASHBOARD VIEWS
-- ============================================================

-- View: Dashboard Presensi Ustaz Hari Ini
CREATE OR REPLACE VIEW v_dashboard_presensi_ustaz_hari_ini AS
SELECT
  COUNT(CASE WHEN pu.status = 'Hadir' THEN 1 END) AS hadir,
  COUNT(CASE WHEN pu.status = 'Terlambat' THEN 1 END) AS terlambat,
  0 AS sakit,
  0 AS izin,
  0 AS alfa,
  (SELECT COUNT(*) FROM guru_pengganti WHERE tanggal = CURRENT_DATE) AS guru_pengganti,
  (SELECT COUNT(*) FROM profiles WHERE role IN ('ustaz', 'operator') AND is_active = true) AS total_guru
FROM presensi_ustaz pu
WHERE pu.tanggal = CURRENT_DATE;

-- View: Dashboard Presensi Murid Hari Ini
CREATE OR REPLACE VIEW v_dashboard_presensi_murid_hari_ini AS
SELECT
  COUNT(CASE WHEN pm.status = 'Hadir' THEN 1 END) AS hadir,
  COUNT(CASE WHEN pm.status = 'Sakit' THEN 1 END) AS sakit,
  COUNT(CASE WHEN pm.status = 'Izin' THEN 1 END) AS izin,
  COUNT(CASE WHEN pm.status = 'Alfa' THEN 1 END) AS alfa,
  (SELECT COUNT(*) FROM murid WHERE is_active = true) AS total_murid,
  ROUND(
    (COUNT(CASE WHEN pm.status = 'Hadir' THEN 1 END)::numeric /
     NULLIF((SELECT COUNT(*) FROM murid WHERE is_active = true), 0) * 100)::numeric,
    1
  ) AS persentase_kehadiran
FROM presensi_murid pm
WHERE pm.tanggal = CURRENT_DATE;

-- View: Presensi Murid By Kelas Today
CREATE OR REPLACE VIEW v_presensi_murid_by_kelas_hari_ini AS
SELECT
  k.id AS kelas_id,
  k.nama_kelas,
  (SELECT COUNT(*) FROM murid m WHERE m.kelas_id = k.id AND m.is_active = true) AS total_murid,
  COUNT(CASE WHEN pm.status = 'Hadir' THEN 1 END) AS hadir,
  COUNT(CASE WHEN pm.status = 'Sakit' THEN 1 END) AS sakit,
  COUNT(CASE WHEN pm.status = 'Izin' THEN 1 END) AS izin,
  COUNT(CASE WHEN pm.status = 'Alfa' THEN 1 END) AS alfa,
  ROUND(
    (COUNT(CASE WHEN pm.status = 'Hadir' THEN 1 END)::numeric /
     NULLIF((SELECT COUNT(*) FROM murid m WHERE m.kelas_id = k.id AND m.is_active = true), 0) * 100)::numeric,
    1
  ) AS persentase
FROM kelas k
LEFT JOIN presensi_murid pm ON pm.kelas_id = k.id AND pm.tanggal = CURRENT_DATE
WHERE k.is_active = true
GROUP BY k.id, k.nama_kelas
ORDER BY k.nama_kelas;

-- ============================================================
-- 2. FUNCTIONS
-- ============================================================

-- Function: Calculate Ustaz Attendance Statistics
CREATE OR REPLACE FUNCTION fn_hitung_kehadiran_ustaz(
  p_guru_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  guru_id uuid,
  total_presensi bigint,
  hadir bigint,
  terlambat bigint,
  persentase numeric,
  sebagai_pengganti bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_start_date IS NULL THEN
    p_start_date := DATE_TRUNC('month', CURRENT_DATE);
  END IF;

  IF p_end_date IS NULL THEN
    p_end_date := CURRENT_DATE;
  END IF;

  RETURN QUERY
  SELECT
    p_guru_id AS guru_id,
    COUNT(*) AS total_presensi,
    COUNT(CASE WHEN pu.status = 'Hadir' THEN 1 END) AS hadir,
    COUNT(CASE WHEN pu.status = 'Terlambat' THEN 1 END) AS terlambat,
    ROUND(
      (COUNT(CASE WHEN pu.status IN ('Hadir', 'Terlambat') THEN 1 END)::numeric /
       NULLIF(COUNT(*), 0) * 100)::numeric,
      1
    ) AS persentase,
    (SELECT COUNT(*) FROM guru_pengganti gp WHERE gp.guru_pengganti_id = p_guru_id
     AND gp.tanggal BETWEEN p_start_date AND p_end_date) AS sebagai_pengganti
  FROM presensi_ustaz pu
  WHERE pu.guru_id = p_guru_id
    AND pu.tanggal BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Function: Calculate Murid Attendance Statistics
CREATE OR REPLACE FUNCTION fn_hitung_kehadiran_murid(
  p_murid_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  murid_id uuid,
  total_presensi bigint,
  hadir bigint,
  sakit bigint,
  izin bigint,
  alfa bigint,
  persentase numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_start_date IS NULL THEN
    p_start_date := DATE_TRUNC('month', CURRENT_DATE);
  END IF;

  IF p_end_date IS NULL THEN
    p_end_date := CURRENT_DATE;
  END IF;

  RETURN QUERY
  SELECT
    p_murid_id AS murid_id,
    COUNT(*) AS total_presensi,
    COUNT(CASE WHEN pm.status = 'Hadir' THEN 1 END) AS hadir,
    COUNT(CASE WHEN pm.status = 'Sakit' THEN 1 END) AS sakit,
    COUNT(CASE WHEN pm.status = 'Izin' THEN 1 END) AS izin,
    COUNT(CASE WHEN pm.status = 'Alfa' THEN 1 END) AS alfa,
    ROUND(
      (COUNT(CASE WHEN pm.status = 'Hadir' THEN 1 END)::numeric /
       NULLIF(COUNT(*), 0) * 100)::numeric,
      1
    ) AS persentase
  FROM presensi_murid pm
  WHERE pm.murid_id = p_murid_id
    AND pm.tanggal BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Function: Get Ustaz Detail with Full Stats
CREATE OR REPLACE FUNCTION fn_ustaz_detail_presensi(p_guru_id uuid)
RETURNS TABLE (
  guru_id uuid,
  nama_lengkap text,
  nama_panggilan text,
  foto text,
  nomor_whatsapp text,
  total_hari_kerja bigint,
  hadir bigint,
  terlambat bigint,
  sakit bigint,
  izin bigint,
  alfa bigint,
  sebagai_pengganti bigint,
  persentase_hadir numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS guru_id,
    p.nama_lengkap AS nama_lengkap,
    p.nama_panggilan AS nama_panggilan,
    p.foto AS foto,
    p.nomor_whatsapp AS nomor_whatsapp,
    (SELECT COUNT(DISTINCT tanggal) FROM presensi_ustaz WHERE guru_id = p_guru_id) AS total_hari_kerja,
    (SELECT COUNT(*) FROM presensi_ustaz WHERE guru_id = p_guru_id AND status = 'Hadir') AS hadir,
    (SELECT COUNT(*) FROM presensi_ustaz WHERE guru_id = p_guru_id AND status = 'Terlambat') AS terlambat,
    0::bigint AS sakit,
    (SELECT COUNT(*) FROM izin_mengajar WHERE user_id = p_guru_id AND status = 'disetujui') AS izin,
    0::bigint AS alfa,
    (SELECT COUNT(*) FROM guru_pengganti WHERE guru_pengganti_id = p_guru_id) AS sebagai_pengganti,
    ROUND(
      ((SELECT COUNT(*) FROM presensi_ustaz WHERE guru_id = p_guru_id AND status IN ('Hadir', 'Terlambat'))::numeric /
       NULLIF((SELECT COUNT(*) FROM presensi_ustaz WHERE guru_id = p_guru_id), 0) * 100)::numeric,
      1
    ) AS persentase_hadir
  FROM profiles p
  WHERE p.id = p_guru_id;
END;
$$;

-- Function: Get List of Ustaz with Attendance Stats for Today
CREATE OR REPLACE FUNCTION fn_ustaz_presensi_list_hari_ini()
RETURNS TABLE (
  guru_id uuid,
  nama_lengkap text,
  nama_panggilan text,
  foto text,
  nomor_whatsapp text,
  sudah_presensi boolean,
  status_presensi text,
  jam_presensi timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS guru_id,
    p.nama_lengkap AS nama_lengkap,
    p.nama_panggilan AS nama_panggilan,
    p.foto AS foto,
    p.nomor_whatsapp AS nomor_whatsapp,
    EXISTS (
      SELECT 1 FROM presensi_ustaz pu
      WHERE pu.guru_id = p.id AND pu.tanggal = CURRENT_DATE
    ) AS sudah_presensi,
    COALESCE(
      (SELECT pu.status FROM presensi_ustaz pu WHERE pu.guru_id = p.id AND pu.tanggal = CURRENT_DATE LIMIT 1),
      'Belum Presensi'
    ) AS status_presensi,
    (SELECT pu.jam_server FROM presensi_ustaz pu WHERE pu.guru_id = p.id AND pu.tanggal = CURRENT_DATE LIMIT 1) AS jam_presensi
  FROM profiles p
  WHERE p.role IN ('ustaz', 'operator')
    AND p.is_active = true
  ORDER BY p.nama_lengkap;
END;
$$;

-- Function: Get Murid Presensi List by Kelas for Today
CREATE OR REPLACE FUNCTION fn_murid_presensi_by_kelas(p_kelas_id uuid)
RETURNS TABLE (
  murid_id uuid,
  nama text,
  nis text,
  jenis_kelamin text,
  sudah_presensi boolean,
  status text,
  keterangan text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS murid_id,
    m.nama AS nama,
    m.nis AS nis,
    m.jenis_kelamin AS jenis_kelamin,
    EXISTS (
      SELECT 1 FROM presensi_murid pm
      WHERE pm.murid_id = m.id AND pm.tanggal = CURRENT_DATE AND pm.kelas_id = p_kelas_id
    ) AS sudah_presensi,
    COALESCE(
      (SELECT pm.status FROM presensi_murid pm WHERE pm.murid_id = m.id AND pm.tanggal = CURRENT_DATE AND pm.kelas_id = p_kelas_id LIMIT 1),
      'Belum Presensi'
    ) AS status,
    (SELECT pm.keterangan FROM presensi_murid pm WHERE pm.murid_id = m.id AND pm.tanggal = CURRENT_DATE AND pm.kelas_id = p_kelas_id LIMIT 1) AS keterangan
  FROM murid m
  WHERE m.kelas_id = p_kelas_id
    AND m.is_active = true
  ORDER BY m.nama;
END;
$$;