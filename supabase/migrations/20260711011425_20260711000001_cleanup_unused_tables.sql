/*
# Database Cleanup: Remove Unused Tables and Views

## Summary
This migration removes 9 tables and 2 views that are not referenced by any
frontend code or edge function. This keeps the database clean and optimized.

## Tables Removed (0 rows each, 0 frontend references)
1. `log_aktivitas` — audit log table, never written to by app or triggers
2. `log_perubahan_nilai` — audit log for nilai changes, never used
3. `pengaturan_tampilan` — theme settings table, app uses ThemeContext instead
4. `peringatan_murid` — warning system for murid, never implemented in frontend
5. `peringatan_ustaz` — warning system for ustaz, never implemented in frontend
6. `presensi_murid` — duplicate of absensi table (app uses absensi instead)
7. `riwayat_pelanggaran` — violation history, never implemented in frontend
8. `wa_queue` — WhatsApp queue, no edge function processes it

## Table Kept (has data)
- `rapor_final` — has 3 rows, referenced by RaporPage types but not actively
  queried by the frontend. KEPT to preserve existing data.

## Views Removed
1. `v_dashboard_presensi_murid_hari_ini` — referenced presensi_murid (dropped)
2. `v_presensi_murid_by_kelas_hari_ini` — referenced presensi_murid (dropped)
   Both views are unused by the frontend (Admin Presensi Murid now queries
   absensi + murid tables directly).

## Safety
- All dropped tables have 0 rows (except rapor_final which is kept)
- No frontend code references any of these tables
- No edge functions reference any of these tables
- No triggers depend on these tables
- CASCADE is used to remove dependent objects (FK constraints, etc.)
*/

-- Drop unused views first (they depend on presensi_murid)
DROP VIEW IF EXISTS v_presensi_murid_by_kelas_hari_ini;
DROP VIEW IF EXISTS v_dashboard_presensi_murid_hari_ini;

-- Drop unused tables (CASCADE removes FK constraints from other tables)
DROP TABLE IF EXISTS wa_queue CASCADE;
DROP TABLE IF EXISTS riwayat_pelanggaran CASCADE;
DROP TABLE IF EXISTS peringatan_ustaz CASCADE;
DROP TABLE IF EXISTS peringatan_murid CASCADE;
DROP TABLE IF EXISTS pengaturan_tampilan CASCADE;
DROP TABLE IF EXISTS log_perubahan_nilai CASCADE;
DROP TABLE IF EXISTS log_aktivitas CASCADE;
DROP TABLE IF EXISTS presensi_murid CASCADE;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';