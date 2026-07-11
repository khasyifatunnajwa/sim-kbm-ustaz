# Database Documentation — SIM KBM Ustaz V2.0

## Overview
Database: Supabase PostgreSQL
Total Tables: 36
Total Views: 7
Auth: Supabase Auth (email/password)
RLS: Enabled on all tables

---

## Table List

### Core / Auth

| # | Table | Purpose | Used By |
|---|-------|---------|---------|
| 1 | `profiles` | User identity (nama, role, phone, etc) | Auth, Dashboard, Admin, Profil |
| 2 | `lembaga` | Institution master (madrasah/pesantren) | All pages with lembaga selector |
| 3 | `kelas` | Class master data | Jadwal, Murid, Absensi, Admin |
| 4 | `mata_pelajaran` | Subject master data | Jadwal, Jurnal, Nilai, Soal |
| 5 | `tahun_ajaran` | Academic year master | Admin, Penilaian |
| 6 | `semester` | Semester master | Admin, Penilaian |
| 7 | `ruangan` | Room master data | Jadwal, Admin |

### Teaching & Schedule

| # | Table | Purpose | Used By |
|---|-------|---------|---------|
| 8 | `jadwal` | Structured schedule (FK-based: kelas_id, mapel_id) | Admin (Presensi Ustaz) |
| 9 | `jadwal_mengajar` | Teaching schedule (text-based: kelas, pelajaran) | JadwalPage, Dashboard, Presensi, Admin |
| 10 | `guru_pengganti` | Substitute teacher records | Admin (Jadwal Ustaz) |
| 11 | `materi` | Teaching material master | Jurnal, Soal |

### Student Data

| # | Table | Purpose | Used By |
|---|-------|---------|---------|
| 12 | `murid` | Student master data | MuridPage, Absensi, Nilai, Rapor, Sikap |
| 13 | `absensi` | Daily student attendance | AbsensiPage, Dashboard, Admin |
| 14 | `penilaian` | Assessment header (jenis, bobot) | NilaiPage |
| 15 | `detail_nilai` | Individual student scores | NilaiPage |
| 16 | `nilai` | Simplified score storage | NilaiPage, Rapor |
| 17 | `sikap` | Character/attitude assessment | SikapPage |
| 18 | `capaian_hafalan` | Quran memorization progress | Rapor |
| 19 | `catatan_perilaku` | Behavior notes | Rapor |
| 20 | `rapor_final` | Final report card data | Rapor (kept for existing data) |

### Teacher Data

| # | Table | Purpose | Used By |
|---|-------|---------|---------|
| 21 | `presensi_guru` | Teacher self-attendance (GPS, photo) | PresensiPage, Admin |
| 22 | `presensi_ustaz` | Teacher attendance summary | Admin (Presensi Ustaz) |
| 23 | `jurnal_kbm` | Teaching journal | JurnalPage, Dashboard |
| 24 | `kbm_harian` | Daily teaching activity | Admin |
| 25 | `catatan_guru` | Teacher notes | CatatanPage, Dashboard |
| 26 | `catatan_guru_notifikasi` | Unread note notifications | Dashboard |
| 27 | `izin_mengajar` | Teaching leave requests | IzinPage, Admin |

### Assessment & Questions

| # | Table | Purpose | Used By |
|---|-------|---------|---------|
| 28 | `soal` | Exam questions | SoalPage |
| 29 | `bank_soal` | Question bank | SoalPage |

### Communication & Settings

| # | Table | Purpose | Used By |
|---|-------|---------|---------|
| 30 | `pengumuman` | Announcements/broadcasts | Dashboard, AdminPengumuman |
| 31 | `agenda` | Calendar events | Dashboard |
| 32 | `agenda_penting` | Important upcoming events | Dashboard |
| 33 | `notifikasi` | In-app notifications | Dashboard |
| 34 | `pengaturan` | App settings | Admin |
| 35 | `buku_saku` | Digital handbook | (feature page) |
| 36 | `muhafadhoh` | Memorization session data | (feature page) |

---

## Views

| View | Purpose |
|------|---------|
| `dashboard_agenda` | Dashboard agenda list |
| `dashboard_pengumuman` | Dashboard announcement list |
| `dashboard_today` | Dashboard today summary |
| `rekap_absensi_bulanan` | Monthly attendance recap |
| `rekap_absensi_tahunan` | Yearly attendance recap |
| `v_dashboard_presensi_ustaz_hari_ini` | Today's teacher attendance for dashboard |
| `view_rekap_nilai_murid` | Student score recap |

---

## Key Relationships

```
profiles (1) ──── (N) jadwal_mengajar
profiles (1) ──── (N) presensi_guru
profiles (1) ──── (N) jurnal_kbm
profiles (1) ──── (N) catatan_guru
profiles (1) ──── (N) izin_mengajar

murid (1) ──── (N) absensi
murid (1) ──── (N) detail_nilai
murid (1) ──── (N) sikap
murid (1) ──── (N) capaian_hafalan

lembaga (1) ──── (N) murid
lembaga (1) ──── (N) jadwal_mengajar
lembaga (1) ──── (N) jurnal_kbm

penilaian (1) ──── (N) detail_nilai
tahun_ajaran (1) ──── (N) penilaian
semester (1) ──── (N) penilaian
```

---

## RLS Policy Pattern

All tables use one of two patterns:

1. **Shared data (all authenticated can SELECT, admin can CRUD)**:
   - SELECT: `TO authenticated USING (true)`
   - INSERT/UPDATE/DELETE: `TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())`

2. **Owner-scoped data (user can CRUD own rows)**:
   - SELECT: `TO authenticated USING (auth.uid() = user_id)`
   - INSERT: `TO authenticated WITH CHECK (auth.uid() = user_id)`
   - UPDATE: `TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
   - DELETE: `TO authenticated USING (auth.uid() = user_id)`

---

## Helper Functions

| Function | Purpose |
|----------|---------|
| `is_admin()` | Returns true if current user has role='admin' in profiles |

---

## Realtime

Realtime is enabled on: `lembaga`, `catatan_guru_notifikasi`, `pengumuman`, `jadwal_mengajar`, `murid`, `presensi_guru`, `absensi`, `jurnal_kbm`

---

## Tables Removed in Cleanup (2026-07-11)

| Table | Reason |
|-------|--------|
| `log_aktivitas` | 0 rows, 0 references |
| `log_perubahan_nilai` | 0 rows, 0 references |
| `pengaturan_tampilan` | 0 rows, 0 references (app uses ThemeContext) |
| `peringatan_murid` | 0 rows, 0 references |
| `peringatan_ustaz` | 0 rows, 0 references |
| `presensi_murid` | 0 rows, duplicate of absensi |
| `riwayat_pelanggaran` | 0 rows, 0 references |
| `wa_queue` | 0 rows, 0 edge function processes it |
| `v_presensi_murid_by_kelas_hari_ini` | View depending on dropped table |
| `v_dashboard_presensi_murid_hari_ini` | View depending on dropped table |
