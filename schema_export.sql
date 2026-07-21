-- ============================================================
-- SIMKBM Database Structure Export
-- Schema-only export (no data)
-- Generated for cloning to a new project
-- ============================================================

-- Order: extensions -> tables -> foreign keys -> indexes
--   -> functions -> triggers -> views -> RLS -> policies
--   -> grants -> storage buckets -> storage policies

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
-- plpgsql is installed by default

-- ============================================================
-- 2. TABLES (with columns, defaults, PK, check & unique constraints)
-- ============================================================
-- Table: absensi
CREATE TABLE IF NOT EXISTS public.absensi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    jadwal_id uuid,
    murid_id uuid,
    tanggal date NOT NULL,
    status character varying(50),
    keterangan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    lembaga_id uuid,
    jam_datang timestamp with time zone,
    menit_terlambat integer,
    diubah_oleh uuid,
    alasan text,
    sumber_perubahan text DEFAULT 'ustaz'::text,
    telat_menit integer,
    alasan_ubah text,
    CONSTRAINT absensi_pkey PRIMARY KEY (id),
    CONSTRAINT absensi_status_check CHECK (((status)::text = ANY ((ARRAY['Hadir'::character varying, 'Izin'::character varying, 'Sakit'::character varying, 'Alfa'::character varying])::text[])))
);

-- Table: absensi_audit
CREATE TABLE IF NOT EXISTS public.absensi_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    absensi_id uuid,
    status_lama text,
    status_baru text,
    jam_datang timestamp with time zone,
    menit_terlambat integer,
    diubah_oleh uuid,
    nama_pengubah text,
    sumber text DEFAULT 'ustaz'::text,
    alasan text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT absensi_audit_pkey PRIMARY KEY (id)
);

-- Table: agenda
CREATE TABLE IF NOT EXISTS public.agenda (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    judul character varying(255) NOT NULL,
    isi text,
    tanggal date NOT NULL,
    jam time without time zone,
    selesai time without time zone,
    warna character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    CONSTRAINT agenda_pkey PRIMARY KEY (id),
    CONSTRAINT cek_jam_agenda_selesai CHECK ((selesai > jam))
);

-- Table: agenda_penting
CREATE TABLE IF NOT EXISTS public.agenda_penting (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    judul text,
    catatan text,
    jenis text DEFAULT 'Umum'::text,
    tanggal date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT agenda_penting_pkey PRIMARY KEY (id)
);

-- Table: audit_trail_absensi
CREATE TABLE IF NOT EXISTS public.audit_trail_absensi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    absensi_id uuid,
    murid_id uuid,
    jadwal_id uuid,
    tanggal date NOT NULL,
    status_lama text,
    status_baru text NOT NULL,
    jam_datang time without time zone,
    telat_menit integer,
    diubah_oleh uuid,
    diubah_oleh_nama text,
    alasan text,
    tipe_perubahan text DEFAULT 'guru'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_trail_absensi_pkey PRIMARY KEY (id),
    CONSTRAINT audit_trail_absensi_tipe_perubahan_check CHECK ((tipe_perubahan = ANY (ARRAY['guru'::text, 'admin'::text, 'sistem'::text])))
);

-- Table: bank_soal
CREATE TABLE IF NOT EXISTS public.bank_soal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    pelajaran text,
    kelas text,
    batasan text,
    isi_soal text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bank_soal_pkey PRIMARY KEY (id)
);

-- Table: buku_saku
CREATE TABLE IF NOT EXISTS public.buku_saku (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    kelas_id bigint,
    pelajaran text,
    bab_terakhir text,
    halaman_terakhir text,
    catatan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT buku_saku_pkey PRIMARY KEY (id)
);

-- Table: capaian_hafalan
CREATE TABLE IF NOT EXISTS public.capaian_hafalan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    murid_id uuid,
    capaian text,
    tanggal date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT capaian_hafalan_pkey PRIMARY KEY (id)
);

-- Table: catatan_guru
CREATE TABLE IF NOT EXISTS public.catatan_guru (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    kategori character varying(50) NOT NULL,
    judul character varying(255) NOT NULL,
    isi text,
    tanggal_waktu timestamp with time zone,
    lokasi character varying(255),
    status character varying(50) DEFAULT 'Belum Selesai'::character varying,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT catatan_guru_pkey PRIMARY KEY (id)
);

-- Table: catatan_guru_notifikasi
CREATE TABLE IF NOT EXISTS public.catatan_guru_notifikasi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    catatan_guru_id uuid,
    user_id uuid DEFAULT uid() NOT NULL,
    dibaca boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT catatan_guru_notifikasi_pkey PRIMARY KEY (id)
);

-- Table: catatan_perilaku
CREATE TABLE IF NOT EXISTS public.catatan_perilaku (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    murid_id uuid,
    jenis text DEFAULT 'catatan'::text,
    catatan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT catatan_perilaku_pkey PRIMARY KEY (id)
);

-- Table: detail_nilai
CREATE TABLE IF NOT EXISTS public.detail_nilai (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    penilaian_id uuid,
    murid_id uuid,
    nilai numeric(5,2),
    catatan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    CONSTRAINT detail_nilai_pkey PRIMARY KEY (id),
    CONSTRAINT detail_nilai_nilai_check CHECK (((nilai >= (0)::numeric) AND (nilai <= (100)::numeric)))
);

-- Table: guru_pengganti
CREATE TABLE IF NOT EXISTS public.guru_pengganti (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    jadwal_asli_id uuid,
    guru_asli_id uuid NOT NULL,
    guru_pengganti_id uuid NOT NULL,
    tanggal date NOT NULL,
    kelas text,
    mapel text,
    jam_mulai text,
    jam_selesai text,
    alasan text,
    status text DEFAULT 'berlangsung'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT guru_pengganti_pkey PRIMARY KEY (id),
    CONSTRAINT guru_pengganti_status_check CHECK ((status = ANY (ARRAY['berlangsung'::text, 'selesai'::text, 'dibatalkan'::text])))
);

-- Table: hari_belajar
CREATE TABLE IF NOT EXISTS public.hari_belajar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    nama_hari character varying NOT NULL,
    urutan integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT hari_belajar_pkey PRIMARY KEY (id)
);

-- Table: izin_mengajar
CREATE TABLE IF NOT EXISTS public.izin_mengajar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nama_ustaz text NOT NULL,
    jenis_izin text NOT NULL,
    lama_izin text NOT NULL,
    tanggal_mulai date NOT NULL,
    tanggal_selesai date,
    mata_pelajaran text NOT NULL,
    kelas text NOT NULL,
    guru_pengganti text,
    catatan text,
    status text DEFAULT 'diajukan'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT izin_mengajar_pkey PRIMARY KEY (id),
    CONSTRAINT izin_mengajar_lama_izin_check CHECK ((lama_izin = ANY (ARRAY['hari_ini'::text, 'beberapa_hari'::text]))),
    CONSTRAINT izin_mengajar_status_check CHECK ((status = ANY (ARRAY['diajukan'::text, 'disetujui'::text, 'ditolak'::text])))
);

-- Table: jadwal
CREATE TABLE IF NOT EXISTS public.jadwal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    kelas_id uuid NOT NULL,
    mapel_id uuid NOT NULL,
    semester_id uuid NOT NULL,
    tahun_ajaran_id uuid NOT NULL,
    hari character varying(20) NOT NULL,
    jam_mulai time without time zone NOT NULL,
    jam_selesai time without time zone NOT NULL,
    ruangan character varying(100),
    warna character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    CONSTRAINT jadwal_pkey PRIMARY KEY (id),
    CONSTRAINT jadwal_check CHECK ((jam_selesai > jam_mulai)),
    CONSTRAINT jadwal_hari_check CHECK (((hari)::text = ANY ((ARRAY['Senin'::character varying, 'Selasa'::character varying, 'Rabu'::character varying, 'Kamis'::character varying, 'Jumat'::character varying, 'Sabtu'::character varying, 'Ahad'::character varying])::text[])))
);

-- Table: jadwal_mengajar
CREATE TABLE IF NOT EXISTS public.jadwal_mengajar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    hari text,
    jam_mulai text,
    jam_selesai text,
    kelas text,
    pelajaran text,
    ruangan text,
    catatan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lembaga_id uuid,
    guru_pengganti_id uuid,
    is_libur boolean DEFAULT false,
    gender text,
    CONSTRAINT jadwal_mengajar_pkey PRIMARY KEY (id)
);

-- Table: jam_pelajaran
CREATE TABLE IF NOT EXISTS public.jam_pelajaran (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    nama_jam character varying NOT NULL,
    jam_mulai time without time zone,
    jam_selesai time without time zone,
    urutan integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    batas_terlambat time without time zone,
    batas_edit time without time zone,
    batas_edit_absensi integer DEFAULT 40,
    batas_terlambat_presensi integer DEFAULT 15,
    batas_edit_presensi integer DEFAULT 40,
    CONSTRAINT jam_pelajaran_pkey PRIMARY KEY (id)
);

-- Table: jurnal_kbm
CREATE TABLE IF NOT EXISTS public.jurnal_kbm (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    jadwal_id uuid,
    tanggal date NOT NULL,
    materi text,
    target text,
    realisasi text,
    metode character varying(100),
    catatan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    kelas text,
    pelajaran text,
    lembaga_id uuid,
    CONSTRAINT jurnal_kbm_pkey PRIMARY KEY (id)
);

-- Table: kbm_harian
CREATE TABLE IF NOT EXISTS public.kbm_harian (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    kelas_id bigint,
    tanggal date,
    pelajaran text,
    materi text,
    catatan text,
    durasi integer,
    selesai boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kbm_harian_pkey PRIMARY KEY (id)
);

-- Table: kelas
CREATE TABLE IF NOT EXISTS public.kelas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    kode character varying(50),
    nama_kelas character varying(100) NOT NULL,
    tingkat character varying(50),
    warna character varying(20),
    keterangan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    aktif boolean DEFAULT true,
    lembaga_id uuid,
    gender text,
    CONSTRAINT kelas_pkey PRIMARY KEY (id),
    CONSTRAINT kelas_user_id_nama_kelas_key UNIQUE (user_id, nama_kelas)
);

-- Table: lembaga
CREATE TABLE IF NOT EXISTS public.lembaga (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nama_lembaga text NOT NULL,
    alamat text,
    telepon text,
    user_id uuid DEFAULT uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email text,
    website text,
    logo_url text,
    CONSTRAINT lembaga_pkey PRIMARY KEY (id)
);

-- Table: mata_pelajaran
CREATE TABLE IF NOT EXISTS public.mata_pelajaran (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    kode character varying(50),
    nama_mapel character varying(100) NOT NULL,
    kelompok character varying(50),
    warna character varying(20),
    keterangan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    CONSTRAINT mata_pelajaran_pkey PRIMARY KEY (id),
    CONSTRAINT mata_pelajaran_kelompok_check CHECK (((kelompok)::text = ANY ((ARRAY['Diniyah'::character varying, 'Umum'::character varying, 'Bahasa'::character varying, 'Tahfidz'::character varying, 'Lainnya'::character varying])::text[]))),
    CONSTRAINT mata_pelajaran_user_id_nama_mapel_key UNIQUE (user_id, nama_mapel)
);

-- Table: materi
CREATE TABLE IF NOT EXISTS public.materi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    kelas_id uuid,
    mapel_id uuid,
    judul character varying(255) NOT NULL,
    isi text,
    lampiran text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    CONSTRAINT materi_pkey PRIMARY KEY (id)
);

-- Table: muhafadhoh
CREATE TABLE IF NOT EXISTS public.muhafadhoh (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    kelas_id bigint,
    tanggal date,
    materi text,
    target_hafalan text,
    catatan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT muhafadhoh_pkey PRIMARY KEY (id)
);

-- Table: murid
CREATE TABLE IF NOT EXISTS public.murid (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    kelas_id uuid,
    nis character varying(50),
    nama character varying(255) NOT NULL,
    jenis_kelamin character varying(20),
    tempat_lahir character varying(100),
    tanggal_lahir date,
    alamat text,
    nama_wali character varying(255),
    no_hp_wali character varying(20),
    status character varying(50) DEFAULT 'Aktif'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    kelas text,
    status_aktif boolean DEFAULT true,
    domisili text,
    nomor_whatsapp text,
    lembaga_id uuid,
    gender_kelas text,
    CONSTRAINT murid_pkey PRIMARY KEY (id),
    CONSTRAINT murid_status_check CHECK (((status)::text = ANY ((ARRAY['Aktif'::character varying, 'Lulus'::character varying, 'Pindah'::character varying, 'Keluar'::character varying, 'Cuti'::character varying])::text[]))),
    CONSTRAINT murid_user_id_nis_key UNIQUE (user_id, nis)
);

-- Table: nilai
CREATE TABLE IF NOT EXISTS public.nilai (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    murid_id uuid,
    pelajaran text,
    jenis_ujian text,
    skor numeric,
    tanggal date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT nilai_pkey PRIMARY KEY (id)
);

-- Table: notifikasi
CREATE TABLE IF NOT EXISTS public.notifikasi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    judul character varying(255) NOT NULL,
    pesan text NOT NULL,
    dibaca boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifikasi_pkey PRIMARY KEY (id)
);

-- Table: pengaturan
CREATE TABLE IF NOT EXISTS public.pengaturan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nama_sekolah character varying(255),
    alamat text,
    telepon character varying(50),
    email character varying(255),
    website character varying(255),
    logo text,
    tema character varying(50) DEFAULT 'Light'::character varying,
    bahasa character varying(50) DEFAULT 'Indonesia'::character varying,
    zona_waktu character varying(100) DEFAULT 'Asia/Jakarta'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pengaturan_pkey PRIMARY KEY (id),
    CONSTRAINT pengaturan_user_id_key UNIQUE (user_id)
);

-- Table: pengumuman
CREATE TABLE IF NOT EXISTS public.pengumuman (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    judul character varying(255) NOT NULL,
    isi text,
    prioritas character varying(50) DEFAULT 'Normal'::character varying,
    aktif boolean DEFAULT true,
    tanggal_mulai date,
    tanggal_selesai date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    kategori text,
    tanggal date,
    jenis text DEFAULT 'Pengumuman'::text,
    status text DEFAULT 'Draft'::text,
    lampiran text,
    dibuat_oleh uuid DEFAULT uid(),
    CONSTRAINT pengumuman_pkey PRIMARY KEY (id)
);

-- Table: penilaian
CREATE TABLE IF NOT EXISTS public.penilaian (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    kelas_id uuid,
    mapel_id uuid,
    semester_id uuid,
    tahun_ajaran_id uuid,
    nama_penilaian character varying(255) NOT NULL,
    jenis character varying(50),
    bobot numeric(5,2) DEFAULT 100,
    tanggal date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    kelas text,
    mapel text,
    lembaga_id uuid,
    CONSTRAINT penilaian_pkey PRIMARY KEY (id),
    CONSTRAINT penilaian_jenis_check CHECK (((jenis)::text = ANY ((ARRAY['Ulangan'::character varying, 'Ujian Tulis'::character varying, 'Ujian Lisan'::character varying, 'Tugas'::character varying, 'Hafalan'::character varying, 'Praktik'::character varying, 'Lainnya'::character varying])::text[])))
);

-- Table: presensi_guru
CREATE TABLE IF NOT EXISTS public.presensi_guru (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tanggal date NOT NULL,
    jam_masuk time without time zone,
    jam_keluar time without time zone,
    lokasi text,
    keterangan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lembaga_id uuid,
    foto_url text,
    telat_menit integer DEFAULT 0,
    CONSTRAINT presensi_guru_pkey PRIMARY KEY (id)
);

-- Table: presensi_ustaz
CREATE TABLE IF NOT EXISTS public.presensi_ustaz (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guru_id uuid DEFAULT uid() NOT NULL,
    kelas_id bigint,
    jadwal_id uuid,
    tanggal date DEFAULT CURRENT_DATE NOT NULL,
    jam_server timestamp with time zone DEFAULT now() NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    akurasi_gps numeric(10,2),
    status text DEFAULT 'Hadir'::text NOT NULL,
    photo_url text,
    photo_expired boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT presensi_ustaz_pkey PRIMARY KEY (id),
    CONSTRAINT presensi_ustaz_status_check CHECK ((status = ANY (ARRAY['Hadir'::text, 'Terlambat'::text, 'Belum Presensi'::text])))
);

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    nama_lengkap character varying(255),
    nama_panggilan character varying(100),
    email character varying(255),
    nomor_whatsapp character varying(20),
    foto text,
    role character varying(50) DEFAULT 'ustaz'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    id_login character varying(50),
    status character varying DEFAULT 'Aktif'::character varying,
    alamat text,
    jenis_kelamin text,
    boleh_mengajar text,
    roles _text[] DEFAULT ARRAY['ustaz'::text],
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'operator'::character varying, 'ustaz'::character varying])::text[]))),
    CONSTRAINT profiles_email_key UNIQUE (email),
    CONSTRAINT profiles_id_login_key UNIQUE (id_login)
);

-- Table: rapor_final
CREATE TABLE IF NOT EXISTS public.rapor_final (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    murid_id uuid,
    semester_id uuid,
    tahun_ajaran_id uuid,
    nilai_akhir numeric(5,2),
    predikat character varying(5),
    deskripsi text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rapor_final_pkey PRIMARY KEY (id),
    CONSTRAINT rapor_final_murid_id_semester_id_tahun_ajaran_id_key UNIQUE (murid_id, semester_id, tahun_ajaran_id)
);

-- Table: ruangan
CREATE TABLE IF NOT EXISTS public.ruangan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    nama_ruangan text NOT NULL,
    kode text,
    kapasitas integer,
    keterangan text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lembaga_id uuid,
    CONSTRAINT ruangan_pkey PRIMARY KEY (id)
);

-- Table: semester
CREATE TABLE IF NOT EXISTS public.semester (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nama character varying(50) NOT NULL,
    aktif boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT semester_pkey PRIMARY KEY (id)
);

-- Table: sikap
CREATE TABLE IF NOT EXISTS public.sikap (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    murid_id uuid,
    tanggal date NOT NULL,
    disiplin numeric(5,2),
    adab numeric(5,2),
    kerajinan numeric(5,2),
    kejujuran numeric(5,2),
    tanggung_jawab numeric(5,2),
    catatan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    lembaga_id uuid,
    CONSTRAINT sikap_pkey PRIMARY KEY (id),
    CONSTRAINT sikap_adab_check CHECK (((adab >= (0)::numeric) AND (adab <= (100)::numeric))),
    CONSTRAINT sikap_disiplin_check CHECK (((disiplin >= (0)::numeric) AND (disiplin <= (100)::numeric))),
    CONSTRAINT sikap_kejujuran_check CHECK (((kejujuran >= (0)::numeric) AND (kejujuran <= (100)::numeric))),
    CONSTRAINT sikap_kerajinan_check CHECK (((kerajinan >= (0)::numeric) AND (kerajinan <= (100)::numeric))),
    CONSTRAINT sikap_tanggung_jawab_check CHECK (((tanggung_jawab >= (0)::numeric) AND (tanggung_jawab <= (100)::numeric)))
);

-- Table: soal
CREATE TABLE IF NOT EXISTS public.soal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    kelas_id uuid,
    mapel_id uuid,
    judul character varying(255) NOT NULL,
    pertanyaan text NOT NULL,
    jawaban text,
    tingkat character varying(50),
    lampiran text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    lembaga_id uuid,
    CONSTRAINT soal_pkey PRIMARY KEY (id)
);

-- Table: tahun_ajaran
CREATE TABLE IF NOT EXISTS public.tahun_ajaran (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nama character varying(50) NOT NULL,
    aktif boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tahun_ajaran_pkey PRIMARY KEY (id)
);

-- Table: user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT uid() NOT NULL,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_settings_pkey PRIMARY KEY (id),
    CONSTRAINT user_settings_user_id_key UNIQUE (user_id)
);

-- ============================================================
-- 3. FOREIGN KEYS
-- ============================================================
ALTER TABLE public.absensi DROP CONSTRAINT IF EXISTS absensi_jadwal_id_fkey;
ALTER TABLE public.absensi ADD CONSTRAINT absensi_jadwal_id_fkey FOREIGN KEY (jadwal_id) REFERENCES jadwal(id) ON DELETE RESTRICT;

ALTER TABLE public.absensi DROP CONSTRAINT IF EXISTS absensi_murid_id_fkey;
ALTER TABLE public.absensi ADD CONSTRAINT absensi_murid_id_fkey FOREIGN KEY (murid_id) REFERENCES murid(id) ON DELETE CASCADE;

ALTER TABLE public.absensi DROP CONSTRAINT IF EXISTS absensi_user_id_fkey;
ALTER TABLE public.absensi ADD CONSTRAINT absensi_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.absensi_audit DROP CONSTRAINT IF EXISTS absensi_audit_absensi_id_fkey;
ALTER TABLE public.absensi_audit ADD CONSTRAINT absensi_audit_absensi_id_fkey FOREIGN KEY (absensi_id) REFERENCES absensi(id) ON DELETE CASCADE;

ALTER TABLE public.agenda DROP CONSTRAINT IF EXISTS agenda_user_id_fkey;
ALTER TABLE public.agenda ADD CONSTRAINT agenda_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.audit_trail_absensi DROP CONSTRAINT IF EXISTS audit_trail_absensi_absensi_id_fkey;
ALTER TABLE public.audit_trail_absensi ADD CONSTRAINT audit_trail_absensi_absensi_id_fkey FOREIGN KEY (absensi_id) REFERENCES absensi(id) ON DELETE SET NULL;

ALTER TABLE public.audit_trail_absensi DROP CONSTRAINT IF EXISTS audit_trail_absensi_diubah_oleh_fkey;
ALTER TABLE public.audit_trail_absensi ADD CONSTRAINT audit_trail_absensi_diubah_oleh_fkey FOREIGN KEY (diubah_oleh) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public.audit_trail_absensi DROP CONSTRAINT IF EXISTS audit_trail_absensi_murid_id_fkey;
ALTER TABLE public.audit_trail_absensi ADD CONSTRAINT audit_trail_absensi_murid_id_fkey FOREIGN KEY (murid_id) REFERENCES murid(id) ON DELETE SET NULL;

ALTER TABLE public.catatan_guru DROP CONSTRAINT IF EXISTS catatan_guru_user_id_fkey;
ALTER TABLE public.catatan_guru ADD CONSTRAINT catatan_guru_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.catatan_guru_notifikasi DROP CONSTRAINT IF EXISTS catatan_guru_notifikasi_catatan_guru_id_fkey;
ALTER TABLE public.catatan_guru_notifikasi ADD CONSTRAINT catatan_guru_notifikasi_catatan_guru_id_fkey FOREIGN KEY (catatan_guru_id) REFERENCES catatan_guru(id) ON DELETE CASCADE;

ALTER TABLE public.detail_nilai DROP CONSTRAINT IF EXISTS detail_nilai_murid_id_fkey;
ALTER TABLE public.detail_nilai ADD CONSTRAINT detail_nilai_murid_id_fkey FOREIGN KEY (murid_id) REFERENCES murid(id) ON DELETE CASCADE;

ALTER TABLE public.detail_nilai DROP CONSTRAINT IF EXISTS detail_nilai_penilaian_id_fkey;
ALTER TABLE public.detail_nilai ADD CONSTRAINT detail_nilai_penilaian_id_fkey FOREIGN KEY (penilaian_id) REFERENCES penilaian(id) ON DELETE CASCADE;

ALTER TABLE public.detail_nilai DROP CONSTRAINT IF EXISTS detail_nilai_user_id_fkey;
ALTER TABLE public.detail_nilai ADD CONSTRAINT detail_nilai_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.guru_pengganti DROP CONSTRAINT IF EXISTS guru_pengganti_guru_asli_id_fkey;
ALTER TABLE public.guru_pengganti ADD CONSTRAINT guru_pengganti_guru_asli_id_fkey FOREIGN KEY (guru_asli_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.guru_pengganti DROP CONSTRAINT IF EXISTS guru_pengganti_guru_pengganti_id_fkey;
ALTER TABLE public.guru_pengganti ADD CONSTRAINT guru_pengganti_guru_pengganti_id_fkey FOREIGN KEY (guru_pengganti_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.hari_belajar DROP CONSTRAINT IF EXISTS hari_belajar_user_id_fkey;
ALTER TABLE public.hari_belajar ADD CONSTRAINT hari_belajar_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.izin_mengajar DROP CONSTRAINT IF EXISTS izin_mengajar_user_id_fkey;
ALTER TABLE public.izin_mengajar ADD CONSTRAINT izin_mengajar_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.jadwal DROP CONSTRAINT IF EXISTS jadwal_kelas_id_fkey;
ALTER TABLE public.jadwal ADD CONSTRAINT jadwal_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE RESTRICT;

ALTER TABLE public.jadwal DROP CONSTRAINT IF EXISTS jadwal_mapel_id_fkey;
ALTER TABLE public.jadwal ADD CONSTRAINT jadwal_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE RESTRICT;

ALTER TABLE public.jadwal DROP CONSTRAINT IF EXISTS jadwal_semester_id_fkey;
ALTER TABLE public.jadwal ADD CONSTRAINT jadwal_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES semester(id) ON DELETE RESTRICT;

ALTER TABLE public.jadwal DROP CONSTRAINT IF EXISTS jadwal_tahun_ajaran_id_fkey;
ALTER TABLE public.jadwal ADD CONSTRAINT jadwal_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE RESTRICT;

ALTER TABLE public.jadwal DROP CONSTRAINT IF EXISTS jadwal_user_id_fkey;
ALTER TABLE public.jadwal ADD CONSTRAINT jadwal_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.jam_pelajaran DROP CONSTRAINT IF EXISTS jam_pelajaran_user_id_fkey;
ALTER TABLE public.jam_pelajaran ADD CONSTRAINT jam_pelajaran_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.jurnal_kbm DROP CONSTRAINT IF EXISTS jurnal_kbm_jadwal_id_fkey;
ALTER TABLE public.jurnal_kbm ADD CONSTRAINT jurnal_kbm_jadwal_id_fkey FOREIGN KEY (jadwal_id) REFERENCES jadwal(id) ON DELETE RESTRICT;

ALTER TABLE public.jurnal_kbm DROP CONSTRAINT IF EXISTS jurnal_kbm_user_id_fkey;
ALTER TABLE public.jurnal_kbm ADD CONSTRAINT jurnal_kbm_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.kelas DROP CONSTRAINT IF EXISTS kelas_lembaga_id_fkey;
ALTER TABLE public.kelas ADD CONSTRAINT kelas_lembaga_id_fkey FOREIGN KEY (lembaga_id) REFERENCES lembaga(id) ON DELETE SET NULL;

ALTER TABLE public.kelas DROP CONSTRAINT IF EXISTS kelas_user_id_fkey;
ALTER TABLE public.kelas ADD CONSTRAINT kelas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.mata_pelajaran DROP CONSTRAINT IF EXISTS mata_pelajaran_user_id_fkey;
ALTER TABLE public.mata_pelajaran ADD CONSTRAINT mata_pelajaran_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.materi DROP CONSTRAINT IF EXISTS materi_kelas_id_fkey;
ALTER TABLE public.materi ADD CONSTRAINT materi_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE;

ALTER TABLE public.materi DROP CONSTRAINT IF EXISTS materi_mapel_id_fkey;
ALTER TABLE public.materi ADD CONSTRAINT materi_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE;

ALTER TABLE public.materi DROP CONSTRAINT IF EXISTS materi_user_id_fkey;
ALTER TABLE public.materi ADD CONSTRAINT materi_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.murid DROP CONSTRAINT IF EXISTS murid_kelas_id_fkey;
ALTER TABLE public.murid ADD CONSTRAINT murid_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL;

ALTER TABLE public.murid DROP CONSTRAINT IF EXISTS murid_user_id_fkey;
ALTER TABLE public.murid ADD CONSTRAINT murid_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifikasi DROP CONSTRAINT IF EXISTS notifikasi_user_id_fkey;
ALTER TABLE public.notifikasi ADD CONSTRAINT notifikasi_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.pengaturan DROP CONSTRAINT IF EXISTS pengaturan_user_id_fkey;
ALTER TABLE public.pengaturan ADD CONSTRAINT pengaturan_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.pengumuman DROP CONSTRAINT IF EXISTS pengumuman_user_id_fkey;
ALTER TABLE public.pengumuman ADD CONSTRAINT pengumuman_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.penilaian DROP CONSTRAINT IF EXISTS penilaian_kelas_id_fkey;
ALTER TABLE public.penilaian ADD CONSTRAINT penilaian_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE RESTRICT;

ALTER TABLE public.penilaian DROP CONSTRAINT IF EXISTS penilaian_mapel_id_fkey;
ALTER TABLE public.penilaian ADD CONSTRAINT penilaian_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE RESTRICT;

ALTER TABLE public.penilaian DROP CONSTRAINT IF EXISTS penilaian_semester_id_fkey;
ALTER TABLE public.penilaian ADD CONSTRAINT penilaian_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES semester(id) ON DELETE RESTRICT;

ALTER TABLE public.penilaian DROP CONSTRAINT IF EXISTS penilaian_tahun_ajaran_id_fkey;
ALTER TABLE public.penilaian ADD CONSTRAINT penilaian_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE RESTRICT;

ALTER TABLE public.penilaian DROP CONSTRAINT IF EXISTS penilaian_user_id_fkey;
ALTER TABLE public.penilaian ADD CONSTRAINT penilaian_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.presensi_guru DROP CONSTRAINT IF EXISTS presensi_guru_user_id_fkey;
ALTER TABLE public.presensi_guru ADD CONSTRAINT presensi_guru_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.presensi_ustaz DROP CONSTRAINT IF EXISTS presensi_ustaz_guru_id_fkey;
ALTER TABLE public.presensi_ustaz ADD CONSTRAINT presensi_ustaz_guru_id_fkey FOREIGN KEY (guru_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.rapor_final DROP CONSTRAINT IF EXISTS rapor_final_murid_id_fkey;
ALTER TABLE public.rapor_final ADD CONSTRAINT rapor_final_murid_id_fkey FOREIGN KEY (murid_id) REFERENCES murid(id) ON DELETE CASCADE;

ALTER TABLE public.rapor_final DROP CONSTRAINT IF EXISTS rapor_final_semester_id_fkey;
ALTER TABLE public.rapor_final ADD CONSTRAINT rapor_final_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES semester(id) ON DELETE RESTRICT;

ALTER TABLE public.rapor_final DROP CONSTRAINT IF EXISTS rapor_final_tahun_ajaran_id_fkey;
ALTER TABLE public.rapor_final ADD CONSTRAINT rapor_final_tahun_ajaran_id_fkey FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE RESTRICT;

ALTER TABLE public.rapor_final DROP CONSTRAINT IF EXISTS rapor_final_user_id_fkey;
ALTER TABLE public.rapor_final ADD CONSTRAINT rapor_final_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.ruangan DROP CONSTRAINT IF EXISTS ruangan_lembaga_id_fkey;
ALTER TABLE public.ruangan ADD CONSTRAINT ruangan_lembaga_id_fkey FOREIGN KEY (lembaga_id) REFERENCES lembaga(id) ON DELETE SET NULL;

ALTER TABLE public.ruangan DROP CONSTRAINT IF EXISTS ruangan_user_id_fkey;
ALTER TABLE public.ruangan ADD CONSTRAINT ruangan_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.sikap DROP CONSTRAINT IF EXISTS sikap_murid_id_fkey;
ALTER TABLE public.sikap ADD CONSTRAINT sikap_murid_id_fkey FOREIGN KEY (murid_id) REFERENCES murid(id) ON DELETE CASCADE;

ALTER TABLE public.sikap DROP CONSTRAINT IF EXISTS sikap_user_id_fkey;
ALTER TABLE public.sikap ADD CONSTRAINT sikap_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.soal DROP CONSTRAINT IF EXISTS soal_kelas_id_fkey;
ALTER TABLE public.soal ADD CONSTRAINT soal_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE;

ALTER TABLE public.soal DROP CONSTRAINT IF EXISTS soal_mapel_id_fkey;
ALTER TABLE public.soal ADD CONSTRAINT soal_mapel_id_fkey FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE;

ALTER TABLE public.soal DROP CONSTRAINT IF EXISTS soal_user_id_fkey;
ALTER TABLE public.soal ADD CONSTRAINT soal_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX idx_absensi_komposit ON public.absensi USING btree (user_id, tanggal);
CREATE INDEX idx_absensi_audit_absensi_id ON public.absensi_audit USING btree (absensi_id);
CREATE INDEX idx_absensi_audit_created_at ON public.absensi_audit USING btree (created_at DESC);
CREATE INDEX idx_guru_pengganti_guru_pengganti_id ON public.guru_pengganti USING btree (guru_pengganti_id);
CREATE INDEX idx_guru_pengganti_tanggal ON public.guru_pengganti USING btree (tanggal);
CREATE INDEX idx_izin_created ON public.izin_mengajar USING btree (created_at DESC);
CREATE INDEX idx_izin_mengajar_status ON public.izin_mengajar USING btree (status);
CREATE INDEX idx_izin_mengajar_user ON public.izin_mengajar USING btree (user_id);
CREATE INDEX idx_izin_status ON public.izin_mengajar USING btree (status);
CREATE INDEX idx_izin_tanggal ON public.izin_mengajar USING btree (tanggal_mulai);
CREATE INDEX idx_izin_user ON public.izin_mengajar USING btree (user_id);
CREATE INDEX idx_jadwal_komposit ON public.jadwal USING btree (user_id, hari, jam_mulai);
CREATE INDEX idx_jurnal_komposit ON public.jurnal_kbm USING btree (user_id, tanggal);
CREATE INDEX idx_kelas_active ON public.kelas USING btree (is_active);
CREATE INDEX idx_pengumuman_broadcast ON public.pengumuman USING btree (status, tanggal_mulai, tanggal_selesai);
CREATE INDEX idx_penilaian_komposit ON public.penilaian USING btree (user_id, kelas_id, mapel_id);
CREATE INDEX idx_presensi_ustaz_guru_id ON public.presensi_ustaz USING btree (guru_id);
CREATE INDEX idx_presensi_ustaz_jam_server ON public.presensi_ustaz USING btree (jam_server);
CREATE INDEX idx_presensi_ustaz_status ON public.presensi_ustaz USING btree (status);
CREATE INDEX idx_presensi_ustaz_tanggal ON public.presensi_ustaz USING btree (tanggal);
CREATE UNIQUE INDEX profiles_id_login_unique ON public.profiles USING btree (id_login) WHERE (id_login IS NOT NULL);
CREATE INDEX idx_ruangan_active ON public.ruangan USING btree (is_active);
CREATE INDEX idx_user_settings_user_id ON public.user_settings USING btree (user_id);

-- ============================================================
-- 5. FUNCTIONS
-- ============================================================
-- auth.uid() is a built-in, included for reference
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION public.audit_perubahan_nilai()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO log_perubahan_nilai (detail_nilai_id, nilai_lama, nilai_baru, diubah_oleh)
        VALUES (OLD.id, OLD.nilai, NEW.nilai, auth.uid());
    END IF;
    RETURN NEW;
END;
$$


CREATE OR REPLACE FUNCTION public.current_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
AS $$
BEGIN
    RETURN auth.uid();
END;
$$


CREATE OR REPLACE FUNCTION public.fn_hitung_kehadiran_murid(p_murid_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS TABLE(murid_id uuid, total_presensi bigint, hadir bigint, sakit bigint, izin bigint, alfa bigint, persentase numeric)
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
$$


CREATE OR REPLACE FUNCTION public.fn_hitung_kehadiran_ustaz(p_guru_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS TABLE(guru_id uuid, total_presensi bigint, hadir bigint, terlambat bigint, persentase numeric, sebagai_pengganti bigint)
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
$$


CREATE OR REPLACE FUNCTION public.fn_murid_presensi_by_kelas(p_kelas_id uuid)
 RETURNS TABLE(murid_id uuid, nama text, nis text, jenis_kelamin text, sudah_presensi boolean, status text, keterangan text)
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
$$


CREATE OR REPLACE FUNCTION public.fn_update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$


CREATE OR REPLACE FUNCTION public.fn_ustaz_detail_presensi(p_guru_id uuid)
 RETURNS TABLE(guru_id uuid, nama_lengkap text, nama_panggilan text, foto text, nomor_whatsapp text, total_hari_kerja bigint, hadir bigint, terlambat bigint, sakit bigint, izin bigint, alfa bigint, sebagai_pengganti bigint, persentase_hadir numeric)
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
$$


CREATE OR REPLACE FUNCTION public.fn_ustaz_presensi_list_hari_ini()
 RETURNS TABLE(guru_id uuid, nama_lengkap text, nama_panggilan text, foto text, nomor_whatsapp text, sudah_presensi boolean, status_presensi text, jam_presensi timestamp with time zone)
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
$$


CREATE OR REPLACE FUNCTION public.generate_code(prefix text)
 RETURNS text
 LANGUAGE plpgsql
AS $$
BEGIN
    RETURN prefix || '-' || upper(substring(md5(random()::text) from 1 for 6));
END;
$$


CREATE OR REPLACE FUNCTION public.get_attendance_percentage()
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
    uid UUID := auth.uid();
    total_hadir INT;
    total_absensi INT;
    persentase NUMERIC(5,2) := 0;
BEGIN
    SELECT COUNT(*) INTO total_hadir FROM absensi WHERE user_id = uid AND status = 'Hadir' AND is_active = true;
    SELECT COUNT(*) INTO total_absensi FROM absensi WHERE user_id = uid AND is_active = true;
    
    IF total_absensi > 0 THEN
        persentase := (total_hadir::NUMERIC / total_absensi::NUMERIC) * 100;
    END IF;
    
    RETURN ROUND(persentase, 2);
END;
$$


CREATE OR REPLACE FUNCTION public.get_statistics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
    uid UUID := auth.uid();
    total_murid INT;
    total_kelas INT;
    total_mapel INT;
    result JSONB;
BEGIN
    SELECT COUNT(*) INTO total_murid FROM murid WHERE user_id = uid AND is_active = true;
    SELECT COUNT(*) INTO total_kelas FROM kelas WHERE user_id = uid AND is_active = true;
    SELECT COUNT(*) INTO total_mapel FROM mata_pelajaran WHERE user_id = uid AND is_active = true;
    
    result := json_build_object(
        'total_murid', COALESCE(total_murid, 0),
        'total_kelas', COALESCE(total_kelas, 0),
        'total_mapel', COALESCE(total_mapel, 0)
    );
    RETURN result;
END;
$$


CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama_lengkap, email, role, is_active)
  VALUES (new.id, new.raw_user_meta_data->>'nama_lengkap', new.email, 'ustaz', true)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$


CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
SELECT EXISTS (
SELECT 1 FROM public.profiles
WHERE id = auth.uid() AND role = 'admin' AND is_active = true
);
$$


CREATE OR REPLACE FUNCTION public.prevent_multiple_active_semester()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.aktif = true THEN
        UPDATE semester SET aktif = false WHERE id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$


CREATE OR REPLACE FUNCTION public.prevent_multiple_active_tahun()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.aktif = true THEN
        UPDATE tahun_ajaran SET aktif = false WHERE id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$


CREATE OR REPLACE FUNCTION public.prevent_schedule_conflict()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM jadwal
        WHERE user_id = NEW.user_id 
          AND hari = NEW.hari 
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND (NEW.jam_mulai < jam_selesai AND NEW.jam_selesai > jam_mulai)
          AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Jadwal bentrok pada hari % antara jam % - %', NEW.hari, NEW.jam_mulai, NEW.jam_selesai;
    END IF;
    RETURN NEW;
END;
$$


CREATE OR REPLACE FUNCTION public.queue_share_nilai(p_murid_id uuid, p_mapel_id uuid, p_nomor_wali text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
    v_murid_nama TEXT;
    v_mapel_nama TEXT;
    v_nilai NUMERIC;
BEGIN
    -- Ambil data
    SELECT nama INTO v_murid_nama FROM murid WHERE id = p_murid_id;
    SELECT nama_mapel INTO v_mapel_nama FROM mata_pelajaran WHERE id = p_mapel_id;
    SELECT nilai INTO v_nilai FROM detail_nilai WHERE murid_id = p_murid_id AND mapel_id = p_mapel_id LIMIT 1;

    -- Masukkan ke antrean
    INSERT INTO wa_queue (user_id, tujuan_nomor, pesan, jenis)
    VALUES (auth.uid(), p_nomor_wali, 
            'Hasil nilai ' || v_mapel_nama || ' untuk ' || v_murid_nama || ' adalah ' || v_nilai, 
            'nilai');
END;
$$


CREATE OR REPLACE FUNCTION public.set_user_id_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
-- Only set if user_id is null and the column exists
IF NEW.user_id IS NULL THEN
NEW.user_id := auth.uid();
END IF;
RETURN NEW;
END;
$$


CREATE OR REPLACE FUNCTION public.sync_rapor_final()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
    -- Variabel penampung
    var_murid_id UUID;
    var_semester_id UUID;
    var_tahun_id UUID;
    v_avg_nilai NUMERIC;
    v_predikat VARCHAR(5);
    v_deskripsi TEXT;
BEGIN
    -- 1. Tentukan ID berdasarkan operasi (INSERT/UPDATE/DELETE)
    IF (TG_OP = 'DELETE') THEN
        var_murid_id := OLD.murid_id;
        SELECT semester_id, tahun_ajaran_id INTO var_semester_id, var_tahun_id 
        FROM penilaian WHERE id = OLD.penilaian_id;
    ELSE
        var_murid_id := NEW.murid_id;
        SELECT semester_id, tahun_ajaran_id INTO var_semester_id, var_tahun_id 
        FROM penilaian WHERE id = NEW.penilaian_id;
    END IF;

    -- 2. Hitung rata-rata menggunakan variabel yang sudah aman (var_murid_id)
    -- Kita menggunakan SELECT ... INTO ... FROM ... WHERE ... 
    -- Pastikan variabel tidak bentrok dengan nama kolom
    SELECT 
        COALESCE(SUM(dn.nilai * p.bobot) / NULLIF(SUM(p.bobot), 0), 0)
    INTO v_avg_nilai
    FROM detail_nilai dn
    JOIN penilaian p ON dn.penilaian_id = p.id
    WHERE dn.murid_id = var_murid_id 
      AND p.semester_id = var_semester_id
      AND p.tahun_ajaran_id = var_tahun_id;

    -- 3. Logika Predikat
    v_predikat := CASE 
        WHEN v_avg_nilai >= 90 THEN 'A'
        WHEN v_avg_nilai >= 80 THEN 'B'
        WHEN v_avg_nilai >= 70 THEN 'C'
        ELSE 'D'
    END;

    v_deskripsi := CASE 
        WHEN v_avg_nilai >= 90 THEN 'Sangat baik, pertahankan prestasi Anda!'
        WHEN v_avg_nilai >= 80 THEN 'Baik, terus tingkatkan belajar Anda.'
        WHEN v_avg_nilai >= 70 THEN 'Cukup, perlu bimbingan tambahan.'
        ELSE 'Kurang, diharapkan lebih giat belajar.'
    END;

    -- 4. Update ke tabel rapor_final
    INSERT INTO rapor_final (user_id, murid_id, semester_id, tahun_ajaran_id, nilai_akhir, predikat, deskripsi, updated_at)
    VALUES (auth.uid(), var_murid_id, var_semester_id, var_tahun_id, v_avg_nilai, v_predikat, v_deskripsi, NOW())
    ON CONFLICT (murid_id, semester_id, tahun_ajaran_id) 
    DO UPDATE SET 
        nilai_akhir = EXCLUDED.nilai_akhir,
        predikat = EXCLUDED.predikat,
        deskripsi = EXCLUDED.deskripsi,
        updated_at = NOW();

    RETURN NULL;
END;
$$


CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$


CREATE OR REPLACE FUNCTION public.update_user_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$


-- ============================================================
-- 6. TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS set_updated_at_absensi ON public.absensi;
CREATE TRIGGER set_updated_at_absensi BEFORE UPDATE ON public.absensi FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_absensi ON public.absensi;
CREATE TRIGGER trg_set_user_id_absensi BEFORE INSERT ON public.absensi FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_agenda ON public.agenda;
CREATE TRIGGER set_updated_at_agenda BEFORE UPDATE ON public.agenda FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_agenda ON public.agenda;
CREATE TRIGGER trg_set_user_id_agenda BEFORE INSERT ON public.agenda FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_set_user_id_agenda_penting ON public.agenda_penting;
CREATE TRIGGER trg_set_user_id_agenda_penting BEFORE INSERT ON public.agenda_penting FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_set_user_id_bank_soal ON public.bank_soal;
CREATE TRIGGER trg_set_user_id_bank_soal BEFORE INSERT ON public.bank_soal FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_set_user_id_buku_saku ON public.buku_saku;
CREATE TRIGGER trg_set_user_id_buku_saku BEFORE INSERT ON public.buku_saku FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_set_user_id_capaian_hafalan ON public.capaian_hafalan;
CREATE TRIGGER trg_set_user_id_capaian_hafalan BEFORE INSERT ON public.capaian_hafalan FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_set_user_id_catatan_guru ON public.catatan_guru;
CREATE TRIGGER trg_set_user_id_catatan_guru BEFORE INSERT ON public.catatan_guru FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS update_catatan_guru_updated_at ON public.catatan_guru;
CREATE TRIGGER update_catatan_guru_updated_at BEFORE UPDATE ON public.catatan_guru FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_catatan_perilaku ON public.catatan_perilaku;
CREATE TRIGGER trg_set_user_id_catatan_perilaku BEFORE INSERT ON public.catatan_perilaku FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_detail_nilai ON public.detail_nilai;
CREATE TRIGGER set_updated_at_detail_nilai BEFORE UPDATE ON public.detail_nilai FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_audit_nilai ON public.detail_nilai;
CREATE TRIGGER trg_audit_nilai AFTER UPDATE ON public.detail_nilai FOR EACH ROW EXECUTE FUNCTION audit_perubahan_nilai();

DROP TRIGGER IF EXISTS trg_set_user_id_detail_nilai ON public.detail_nilai;
CREATE TRIGGER trg_set_user_id_detail_nilai BEFORE INSERT ON public.detail_nilai FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_sync_rapor ON public.detail_nilai;
CREATE TRIGGER trg_sync_rapor AFTER INSERT OR DELETE OR UPDATE ON public.detail_nilai FOR EACH ROW EXECUTE FUNCTION sync_rapor_final();

DROP TRIGGER IF EXISTS trg_guru_pengganti_updated ON public.guru_pengganti;
CREATE TRIGGER trg_guru_pengganti_updated BEFORE UPDATE ON public.guru_pengganti FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_update_izin ON public.izin_mengajar;
CREATE TRIGGER trg_update_izin BEFORE UPDATE ON public.izin_mengajar FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_jadwal ON public.jadwal;
CREATE TRIGGER set_updated_at_jadwal BEFORE UPDATE ON public.jadwal FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_prevent_schedule_conflict ON public.jadwal;
CREATE TRIGGER trg_prevent_schedule_conflict BEFORE INSERT OR UPDATE ON public.jadwal FOR EACH ROW EXECUTE FUNCTION prevent_schedule_conflict();

DROP TRIGGER IF EXISTS trg_set_user_id_jadwal ON public.jadwal;
CREATE TRIGGER trg_set_user_id_jadwal BEFORE INSERT ON public.jadwal FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_set_user_id_jadwal_mengajar ON public.jadwal_mengajar;
CREATE TRIGGER trg_set_user_id_jadwal_mengajar BEFORE INSERT ON public.jadwal_mengajar FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_jurnal ON public.jurnal_kbm;
CREATE TRIGGER set_updated_at_jurnal BEFORE UPDATE ON public.jurnal_kbm FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_jurnal_kbm ON public.jurnal_kbm;
CREATE TRIGGER trg_set_user_id_jurnal_kbm BEFORE INSERT ON public.jurnal_kbm FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_set_user_id_kbm_harian ON public.kbm_harian;
CREATE TRIGGER trg_set_user_id_kbm_harian BEFORE INSERT ON public.kbm_harian FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_kelas ON public.kelas;
CREATE TRIGGER set_updated_at_kelas BEFORE UPDATE ON public.kelas FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_kelas ON public.kelas;
CREATE TRIGGER trg_set_user_id_kelas BEFORE INSERT ON public.kelas FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_mapel ON public.mata_pelajaran;
CREATE TRIGGER set_updated_at_mapel BEFORE UPDATE ON public.mata_pelajaran FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_mata_pelajaran ON public.mata_pelajaran;
CREATE TRIGGER trg_set_user_id_mata_pelajaran BEFORE INSERT ON public.mata_pelajaran FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_materi ON public.materi;
CREATE TRIGGER set_updated_at_materi BEFORE UPDATE ON public.materi FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_materi ON public.materi;
CREATE TRIGGER trg_set_user_id_materi BEFORE INSERT ON public.materi FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_set_user_id_muhafadhoh ON public.muhafadhoh;
CREATE TRIGGER trg_set_user_id_muhafadhoh BEFORE INSERT ON public.muhafadhoh FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_murid ON public.murid;
CREATE TRIGGER set_updated_at_murid BEFORE UPDATE ON public.murid FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_murid ON public.murid;
CREATE TRIGGER trg_set_user_id_murid BEFORE INSERT ON public.murid FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_set_user_id_nilai ON public.nilai;
CREATE TRIGGER trg_set_user_id_nilai BEFORE INSERT ON public.nilai FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS trg_set_user_id_notifikasi ON public.notifikasi;
CREATE TRIGGER trg_set_user_id_notifikasi BEFORE INSERT ON public.notifikasi FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_pengaturan ON public.pengaturan;
CREATE TRIGGER set_updated_at_pengaturan BEFORE UPDATE ON public.pengaturan FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_pengaturan ON public.pengaturan;
CREATE TRIGGER trg_set_user_id_pengaturan BEFORE INSERT ON public.pengaturan FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_pengumuman ON public.pengumuman;
CREATE TRIGGER set_updated_at_pengumuman BEFORE UPDATE ON public.pengumuman FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_pengumuman ON public.pengumuman;
CREATE TRIGGER trg_set_user_id_pengumuman BEFORE INSERT ON public.pengumuman FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_penilaian ON public.penilaian;
CREATE TRIGGER set_updated_at_penilaian BEFORE UPDATE ON public.penilaian FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_penilaian ON public.penilaian;
CREATE TRIGGER trg_set_user_id_penilaian BEFORE INSERT ON public.penilaian FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_presensi_guru ON public.presensi_guru;
CREATE TRIGGER set_updated_at_presensi_guru BEFORE UPDATE ON public.presensi_guru FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_presensi_guru ON public.presensi_guru;
CREATE TRIGGER trg_set_user_id_presensi_guru BEFORE INSERT ON public.presensi_guru FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_rapor_final ON public.rapor_final;
CREATE TRIGGER trg_set_user_id_rapor_final BEFORE INSERT ON public.rapor_final FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_semester ON public.semester;
CREATE TRIGGER set_updated_at_semester BEFORE UPDATE ON public.semester FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_single_active_semester ON public.semester;
CREATE TRIGGER trg_single_active_semester BEFORE INSERT OR UPDATE ON public.semester FOR EACH ROW EXECUTE FUNCTION prevent_multiple_active_semester();

DROP TRIGGER IF EXISTS set_updated_at_sikap ON public.sikap;
CREATE TRIGGER set_updated_at_sikap BEFORE UPDATE ON public.sikap FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_sikap ON public.sikap;
CREATE TRIGGER trg_set_user_id_sikap BEFORE INSERT ON public.sikap FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_soal ON public.soal;
CREATE TRIGGER set_updated_at_soal BEFORE UPDATE ON public.soal FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_set_user_id_soal ON public.soal;
CREATE TRIGGER trg_set_user_id_soal BEFORE INSERT ON public.soal FOR EACH ROW EXECUTE FUNCTION set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_updated_at_tahun_ajaran ON public.tahun_ajaran;
CREATE TRIGGER set_updated_at_tahun_ajaran BEFORE UPDATE ON public.tahun_ajaran FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_single_active_tahun ON public.tahun_ajaran;
CREATE TRIGGER trg_single_active_tahun BEFORE INSERT OR UPDATE ON public.tahun_ajaran FOR EACH ROW EXECUTE FUNCTION prevent_multiple_active_tahun();

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_user_settings_updated_at();

-- ============================================================
-- 7. VIEWS
-- ============================================================
CREATE OR REPLACE VIEW public.dashboard_agenda AS
 SELECT id,
    user_id,
    judul,
    tanggal,
    jam,
    selesai,
    warna
   FROM agenda
  WHERE ((is_active = true) AND (tanggal >= CURRENT_DATE));

CREATE OR REPLACE VIEW public.dashboard_pengumuman AS
 SELECT id,
    user_id,
    judul,
    prioritas,
    tanggal_mulai,
    tanggal_selesai
   FROM pengumuman
  WHERE ((aktif = true) AND (is_active = true));

CREATE OR REPLACE VIEW public.dashboard_today AS
 SELECT j.id,
    j.user_id,
    k.nama_kelas,
    m.nama_mapel,
    j.hari,
    j.jam_mulai,
    j.jam_selesai,
    j.ruangan,
    j.warna
   FROM ((jadwal j
     LEFT JOIN kelas k ON ((j.kelas_id = k.id)))
     LEFT JOIN mata_pelajaran m ON ((j.mapel_id = m.id)))
  WHERE (j.is_active = true);

CREATE OR REPLACE VIEW public.rekap_absensi_bulanan AS
 SELECT user_id,
    murid_id,
    EXTRACT(month FROM tanggal) AS bulan,
    EXTRACT(year FROM tanggal) AS tahun,
    count(*) FILTER (WHERE ((status)::text = 'Hadir'::text)) AS hadir,
    count(*) FILTER (WHERE ((status)::text = 'Izin'::text)) AS izin,
    count(*) FILTER (WHERE ((status)::text = 'Sakit'::text)) AS sakit,
    count(*) FILTER (WHERE ((status)::text = 'Alfa'::text)) AS alfa
   FROM absensi
  WHERE (is_active = true)
  GROUP BY user_id, murid_id, (EXTRACT(month FROM tanggal)), (EXTRACT(year FROM tanggal));

CREATE OR REPLACE VIEW public.rekap_absensi_tahunan AS
 SELECT user_id,
    murid_id,
    EXTRACT(year FROM tanggal) AS tahun,
    count(*) FILTER (WHERE ((status)::text = 'Hadir'::text)) AS total_hadir,
    count(*) FILTER (WHERE ((status)::text = 'Alfa'::text)) AS total_alfa
   FROM absensi
  WHERE (is_active = true)
  GROUP BY user_id, murid_id, (EXTRACT(year FROM tanggal));

CREATE OR REPLACE VIEW public.v_dashboard_presensi_ustaz_hari_ini AS
 SELECT count(
        CASE
            WHEN (status = 'Hadir'::text) THEN 1
            ELSE NULL::integer
        END) AS hadir,
    count(
        CASE
            WHEN (status = 'Terlambat'::text) THEN 1
            ELSE NULL::integer
        END) AS terlambat,
    0 AS sakit,
    0 AS izin,
    0 AS alfa,
    ( SELECT count(*) AS count
           FROM guru_pengganti
          WHERE (guru_pengganti.tanggal = CURRENT_DATE)) AS guru_pengganti,
    ( SELECT count(*) AS count
           FROM profiles
          WHERE (((profiles.role)::text = ANY ((ARRAY['ustaz'::character varying, 'operator'::character varying])::text[])) AND (profiles.is_active = true))) AS total_guru
   FROM presensi_ustaz pu
  WHERE (tanggal = CURRENT_DATE);

CREATE OR REPLACE VIEW public.view_rekap_nilai_murid AS
 SELECT dn.murid_id,
    p.jenis,
    avg(dn.nilai) AS rata_rata_jenis
   FROM (detail_nilai dn
     JOIN penilaian p ON ((dn.penilaian_id = p.id)))
  GROUP BY dn.murid_id, p.jenis;

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_penting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail_absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buku_saku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capaian_hafalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catatan_guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catatan_guru_notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catatan_perilaku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru_pengganti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hari_belajar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.izin_mengajar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_mengajar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_kbm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kbm_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembaga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muhafadhoh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.murid ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penilaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi_guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi_ustaz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapor_final ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ruangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sikap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahun_ajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. POLICIES
-- ============================================================
-- Policies for table: absensi
DROP POLICY IF EXISTS "Akses mandiri absensi" ON public.absensi;
CREATE POLICY "Akses mandiri absensi" ON public.absensi
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "delete_policy_absensi" ON public.absensi;
CREATE POLICY "delete_policy_absensi" ON public.absensi
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_absensi" ON public.absensi;
CREATE POLICY "insert_policy_absensi" ON public.absensi
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_absensi" ON public.absensi;
CREATE POLICY "select_policy_absensi" ON public.absensi
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_absensi" ON public.absensi;
CREATE POLICY "update_policy_absensi" ON public.absensi
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: absensi_audit
DROP POLICY IF EXISTS "delete_own_absensi_audit" ON public.absensi_audit;
CREATE POLICY "delete_own_absensi_audit" ON public.absensi_audit
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM absensi
  WHERE ((absensi.id = absensi_audit.absensi_id) AND (absensi.user_id = uid())))));
DROP POLICY IF EXISTS "insert_own_absensi_audit" ON public.absensi_audit;
CREATE POLICY "insert_own_absensi_audit" ON public.absensi_audit
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((EXISTS ( SELECT 1
   FROM absensi
  WHERE ((absensi.id = absensi_audit.absensi_id) AND (absensi.user_id = uid())))));
DROP POLICY IF EXISTS "select_own_absensi_audit" ON public.absensi_audit;
CREATE POLICY "select_own_absensi_audit" ON public.absensi_audit
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM absensi
  WHERE ((absensi.id = absensi_audit.absensi_id) AND (absensi.user_id = uid())))));
DROP POLICY IF EXISTS "update_own_absensi_audit" ON public.absensi_audit;
CREATE POLICY "update_own_absensi_audit" ON public.absensi_audit
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM absensi
  WHERE ((absensi.id = absensi_audit.absensi_id) AND (absensi.user_id = uid())))))
    WITH CHECK ((EXISTS ( SELECT 1
   FROM absensi
  WHERE ((absensi.id = absensi_audit.absensi_id) AND (absensi.user_id = uid())))));

-- Policies for table: agenda
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON public.agenda;
CREATE POLICY "Akses Penuh Admin Otomatis" ON public.agenda
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "Akses mandiri agenda" ON public.agenda;
CREATE POLICY "Akses mandiri agenda" ON public.agenda
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "admin_all_agenda" ON public.agenda;
CREATE POLICY "admin_all_agenda" ON public.agenda
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "agenda_all" ON public.agenda;
CREATE POLICY "agenda_all" ON public.agenda
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (is_admin());
DROP POLICY IF EXISTS "agenda_select" ON public.agenda;
CREATE POLICY "agenda_select" ON public.agenda
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((uid() IS NOT NULL));
DROP POLICY IF EXISTS "delete_own_agenda" ON public.agenda;
CREATE POLICY "delete_own_agenda" ON public.agenda
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_agenda" ON public.agenda;
CREATE POLICY "insert_own_agenda" ON public.agenda
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "select_own_agenda" ON public.agenda;
CREATE POLICY "select_own_agenda" ON public.agenda
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_agenda" ON public.agenda;
CREATE POLICY "update_own_agenda" ON public.agenda
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: agenda_penting
DROP POLICY IF EXISTS "delete_policy_agenda_penting" ON public.agenda_penting;
CREATE POLICY "delete_policy_agenda_penting" ON public.agenda_penting
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_agenda_penting" ON public.agenda_penting;
CREATE POLICY "insert_policy_agenda_penting" ON public.agenda_penting
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_agenda_penting" ON public.agenda_penting;
CREATE POLICY "select_policy_agenda_penting" ON public.agenda_penting
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_agenda_penting" ON public.agenda_penting;
CREATE POLICY "update_policy_agenda_penting" ON public.agenda_penting
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: audit_trail_absensi
DROP POLICY IF EXISTS "insert_audit_trail_absensi" ON public.audit_trail_absensi;
CREATE POLICY "insert_audit_trail_absensi" ON public.audit_trail_absensi
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
DROP POLICY IF EXISTS "select_audit_trail_absensi" ON public.audit_trail_absensi;
CREATE POLICY "select_audit_trail_absensi" ON public.audit_trail_absensi
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);

-- Policies for table: bank_soal
DROP POLICY IF EXISTS "delete_policy_bank_soal" ON public.bank_soal;
CREATE POLICY "delete_policy_bank_soal" ON public.bank_soal
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_bank_soal" ON public.bank_soal;
CREATE POLICY "insert_policy_bank_soal" ON public.bank_soal
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_bank_soal" ON public.bank_soal;
CREATE POLICY "select_policy_bank_soal" ON public.bank_soal
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_bank_soal" ON public.bank_soal;
CREATE POLICY "update_policy_bank_soal" ON public.bank_soal
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: buku_saku
DROP POLICY IF EXISTS "delete_policy_buku_saku" ON public.buku_saku;
CREATE POLICY "delete_policy_buku_saku" ON public.buku_saku
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_buku_saku" ON public.buku_saku;
CREATE POLICY "insert_policy_buku_saku" ON public.buku_saku
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_buku_saku" ON public.buku_saku;
CREATE POLICY "select_policy_buku_saku" ON public.buku_saku
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_buku_saku" ON public.buku_saku;
CREATE POLICY "update_policy_buku_saku" ON public.buku_saku
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: capaian_hafalan
DROP POLICY IF EXISTS "delete_policy_capaian_hafalan" ON public.capaian_hafalan;
CREATE POLICY "delete_policy_capaian_hafalan" ON public.capaian_hafalan
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_capaian_hafalan" ON public.capaian_hafalan;
CREATE POLICY "insert_policy_capaian_hafalan" ON public.capaian_hafalan
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_capaian_hafalan" ON public.capaian_hafalan;
CREATE POLICY "select_policy_capaian_hafalan" ON public.capaian_hafalan
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_capaian_hafalan" ON public.capaian_hafalan;
CREATE POLICY "update_policy_capaian_hafalan" ON public.capaian_hafalan
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: catatan_guru
DROP POLICY IF EXISTS "delete_policy_catatan_guru" ON public.catatan_guru;
CREATE POLICY "delete_policy_catatan_guru" ON public.catatan_guru
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_catatan_guru" ON public.catatan_guru;
CREATE POLICY "insert_policy_catatan_guru" ON public.catatan_guru
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_catatan_guru" ON public.catatan_guru;
CREATE POLICY "select_policy_catatan_guru" ON public.catatan_guru
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_catatan_guru" ON public.catatan_guru;
CREATE POLICY "update_policy_catatan_guru" ON public.catatan_guru
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: catatan_guru_notifikasi
DROP POLICY IF EXISTS "delete_own_catatan_notif" ON public.catatan_guru_notifikasi;
CREATE POLICY "delete_own_catatan_notif" ON public.catatan_guru_notifikasi
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_catatan_notif" ON public.catatan_guru_notifikasi;
CREATE POLICY "insert_own_catatan_notif" ON public.catatan_guru_notifikasi
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "select_own_catatan_notif" ON public.catatan_guru_notifikasi;
CREATE POLICY "select_own_catatan_notif" ON public.catatan_guru_notifikasi
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_catatan_notif" ON public.catatan_guru_notifikasi;
CREATE POLICY "update_own_catatan_notif" ON public.catatan_guru_notifikasi
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: catatan_perilaku
DROP POLICY IF EXISTS "delete_policy_catatan_perilaku" ON public.catatan_perilaku;
CREATE POLICY "delete_policy_catatan_perilaku" ON public.catatan_perilaku
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_catatan_perilaku" ON public.catatan_perilaku;
CREATE POLICY "insert_policy_catatan_perilaku" ON public.catatan_perilaku
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_catatan_perilaku" ON public.catatan_perilaku;
CREATE POLICY "select_policy_catatan_perilaku" ON public.catatan_perilaku
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_catatan_perilaku" ON public.catatan_perilaku;
CREATE POLICY "update_policy_catatan_perilaku" ON public.catatan_perilaku
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: detail_nilai
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON public.detail_nilai;
CREATE POLICY "Akses Penuh Admin Otomatis" ON public.detail_nilai
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "Akses mandiri detail_nilai" ON public.detail_nilai;
CREATE POLICY "Akses mandiri detail_nilai" ON public.detail_nilai
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "admin_all_detail_nilai" ON public.detail_nilai;
CREATE POLICY "admin_all_detail_nilai" ON public.detail_nilai
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_all_detail_nilai_v2" ON public.detail_nilai;
CREATE POLICY "admin_all_detail_nilai_v2" ON public.detail_nilai
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "delete_own_detail_nilai" ON public.detail_nilai;
CREATE POLICY "delete_own_detail_nilai" ON public.detail_nilai
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_detail_nilai" ON public.detail_nilai;
CREATE POLICY "insert_own_detail_nilai" ON public.detail_nilai
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "select_all_detail_nilai" ON public.detail_nilai;
CREATE POLICY "select_all_detail_nilai" ON public.detail_nilai
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_all_detail_nilai_v2" ON public.detail_nilai;
CREATE POLICY "select_all_detail_nilai_v2" ON public.detail_nilai
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_own_detail_nilai" ON public.detail_nilai;
CREATE POLICY "select_own_detail_nilai" ON public.detail_nilai
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_detail_nilai" ON public.detail_nilai;
CREATE POLICY "update_own_detail_nilai" ON public.detail_nilai
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: guru_pengganti
DROP POLICY IF EXISTS "insert_guru_pengganti" ON public.guru_pengganti;
CREATE POLICY "insert_guru_pengganti" ON public.guru_pengganti
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = uid()) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'operator'::character varying])::text[]))))));
DROP POLICY IF EXISTS "select_guru_pengganti" ON public.guru_pengganti;
CREATE POLICY "select_guru_pengganti" ON public.guru_pengganti
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "update_guru_pengganti" ON public.guru_pengganti;
CREATE POLICY "update_guru_pengganti" ON public.guru_pengganti
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = uid()) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'operator'::character varying])::text[]))))))
    WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = uid()) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'operator'::character varying])::text[]))))));

-- Policies for table: hari_belajar
DROP POLICY IF EXISTS "delete_own_hari_belajar" ON public.hari_belajar;
CREATE POLICY "delete_own_hari_belajar" ON public.hari_belajar
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_hari_belajar" ON public.hari_belajar;
CREATE POLICY "insert_own_hari_belajar" ON public.hari_belajar
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "select_own_hari_belajar" ON public.hari_belajar;
CREATE POLICY "select_own_hari_belajar" ON public.hari_belajar
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_hari_belajar" ON public.hari_belajar;
CREATE POLICY "update_own_hari_belajar" ON public.hari_belajar
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: izin_mengajar
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON public.izin_mengajar;
CREATE POLICY "Akses Penuh Admin Otomatis" ON public.izin_mengajar
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_izin_mengajar" ON public.izin_mengajar;
CREATE POLICY "admin_all_izin_mengajar" ON public.izin_mengajar
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "delete_own_izin_mengajar" ON public.izin_mengajar;
CREATE POLICY "delete_own_izin_mengajar" ON public.izin_mengajar
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_izin_mengajar" ON public.izin_mengajar;
CREATE POLICY "insert_own_izin_mengajar" ON public.izin_mengajar
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "izin_delete_sendiri" ON public.izin_mengajar;
CREATE POLICY "izin_delete_sendiri" ON public.izin_mengajar
    AS PERMISSIVE
    FOR DELETE
    TO public
    USING ((user_id = uid()));
DROP POLICY IF EXISTS "izin_insert_sendiri" ON public.izin_mengajar;
CREATE POLICY "izin_insert_sendiri" ON public.izin_mengajar
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK ((user_id = uid()));
DROP POLICY IF EXISTS "izin_select_sendiri" ON public.izin_mengajar;
CREATE POLICY "izin_select_sendiri" ON public.izin_mengajar
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((user_id = uid()));
DROP POLICY IF EXISTS "izin_update_sendiri" ON public.izin_mengajar;
CREATE POLICY "izin_update_sendiri" ON public.izin_mengajar
    AS PERMISSIVE
    FOR UPDATE
    TO public
    USING ((user_id = uid()));
DROP POLICY IF EXISTS "select_own_izin_mengajar" ON public.izin_mengajar;
CREATE POLICY "select_own_izin_mengajar" ON public.izin_mengajar
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_izin_mengajar" ON public.izin_mengajar;
CREATE POLICY "update_own_izin_mengajar" ON public.izin_mengajar
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: jadwal
DROP POLICY IF EXISTS "Akses mandiri jadwal" ON public.jadwal;
CREATE POLICY "Akses mandiri jadwal" ON public.jadwal
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "delete_policy_jadwal" ON public.jadwal;
CREATE POLICY "delete_policy_jadwal" ON public.jadwal
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_jadwal" ON public.jadwal;
CREATE POLICY "insert_policy_jadwal" ON public.jadwal
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "jadwal_insert_update_delete" ON public.jadwal;
CREATE POLICY "jadwal_insert_update_delete" ON public.jadwal
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (is_admin());
DROP POLICY IF EXISTS "jadwal_select" ON public.jadwal;
CREATE POLICY "jadwal_select" ON public.jadwal
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_jadwal" ON public.jadwal;
CREATE POLICY "select_policy_jadwal" ON public.jadwal
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_jadwal" ON public.jadwal;
CREATE POLICY "update_policy_jadwal" ON public.jadwal
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: jadwal_mengajar
DROP POLICY IF EXISTS "delete_policy_jadwal_mengajar" ON public.jadwal_mengajar;
CREATE POLICY "delete_policy_jadwal_mengajar" ON public.jadwal_mengajar
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_jadwal_mengajar" ON public.jadwal_mengajar;
CREATE POLICY "insert_policy_jadwal_mengajar" ON public.jadwal_mengajar
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_jadwal_mengajar" ON public.jadwal_mengajar;
CREATE POLICY "select_policy_jadwal_mengajar" ON public.jadwal_mengajar
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_jadwal_mengajar" ON public.jadwal_mengajar;
CREATE POLICY "update_policy_jadwal_mengajar" ON public.jadwal_mengajar
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: jam_pelajaran
DROP POLICY IF EXISTS "delete_own_jam_pelajaran" ON public.jam_pelajaran;
CREATE POLICY "delete_own_jam_pelajaran" ON public.jam_pelajaran
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_jam_pelajaran" ON public.jam_pelajaran;
CREATE POLICY "insert_own_jam_pelajaran" ON public.jam_pelajaran
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "select_own_jam_pelajaran" ON public.jam_pelajaran;
CREATE POLICY "select_own_jam_pelajaran" ON public.jam_pelajaran
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_jam_pelajaran" ON public.jam_pelajaran;
CREATE POLICY "update_own_jam_pelajaran" ON public.jam_pelajaran
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: jurnal_kbm
DROP POLICY IF EXISTS "Akses mandiri jurnal_kbm" ON public.jurnal_kbm;
CREATE POLICY "Akses mandiri jurnal_kbm" ON public.jurnal_kbm
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "delete_policy_jurnal_kbm" ON public.jurnal_kbm;
CREATE POLICY "delete_policy_jurnal_kbm" ON public.jurnal_kbm
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_jurnal_kbm" ON public.jurnal_kbm;
CREATE POLICY "insert_policy_jurnal_kbm" ON public.jurnal_kbm
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_jurnal_kbm" ON public.jurnal_kbm;
CREATE POLICY "select_policy_jurnal_kbm" ON public.jurnal_kbm
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_jurnal_kbm" ON public.jurnal_kbm;
CREATE POLICY "update_policy_jurnal_kbm" ON public.jurnal_kbm
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: kbm_harian
DROP POLICY IF EXISTS "delete_policy_kbm_harian" ON public.kbm_harian;
CREATE POLICY "delete_policy_kbm_harian" ON public.kbm_harian
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_kbm_harian" ON public.kbm_harian;
CREATE POLICY "insert_policy_kbm_harian" ON public.kbm_harian
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_kbm_harian" ON public.kbm_harian;
CREATE POLICY "select_policy_kbm_harian" ON public.kbm_harian
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_kbm_harian" ON public.kbm_harian;
CREATE POLICY "update_policy_kbm_harian" ON public.kbm_harian
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: kelas
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON public.kelas;
CREATE POLICY "Akses Penuh Admin Otomatis" ON public.kelas
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "Akses mandiri kelas" ON public.kelas;
CREATE POLICY "Akses mandiri kelas" ON public.kelas
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "Izinkan semua akun login membaca data kelas" ON public.kelas;
CREATE POLICY "Izinkan semua akun login membaca data kelas" ON public.kelas
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "admin_all_kelas" ON public.kelas;
CREATE POLICY "admin_all_kelas" ON public.kelas
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_all_kelas_v2" ON public.kelas;
CREATE POLICY "admin_all_kelas_v2" ON public.kelas
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "delete_own_kelas" ON public.kelas;
CREATE POLICY "delete_own_kelas" ON public.kelas
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_kelas" ON public.kelas;
CREATE POLICY "insert_own_kelas" ON public.kelas
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "kelas_insert_update_delete" ON public.kelas;
CREATE POLICY "kelas_insert_update_delete" ON public.kelas
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (is_admin());
DROP POLICY IF EXISTS "kelas_select" ON public.kelas;
CREATE POLICY "kelas_select" ON public.kelas
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_all_kelas_v2" ON public.kelas;
CREATE POLICY "select_all_kelas_v2" ON public.kelas
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_own_kelas" ON public.kelas;
CREATE POLICY "select_own_kelas" ON public.kelas
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_kelas" ON public.kelas;
CREATE POLICY "update_own_kelas" ON public.kelas
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: lembaga
DROP POLICY IF EXISTS "delete_lembaga_admin" ON public.lembaga;
CREATE POLICY "delete_lembaga_admin" ON public.lembaga
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "insert_lembaga_admin" ON public.lembaga;
CREATE POLICY "insert_lembaga_admin" ON public.lembaga
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
DROP POLICY IF EXISTS "select_lembaga_all" ON public.lembaga;
CREATE POLICY "select_lembaga_all" ON public.lembaga
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "update_lembaga_admin" ON public.lembaga;
CREATE POLICY "update_lembaga_admin" ON public.lembaga
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policies for table: mata_pelajaran
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON public.mata_pelajaran;
CREATE POLICY "Akses Penuh Admin Otomatis" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "Akses mandiri mata_pelajaran" ON public.mata_pelajaran;
CREATE POLICY "Akses mandiri mata_pelajaran" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "admin_all_mata_pelajaran" ON public.mata_pelajaran;
CREATE POLICY "admin_all_mata_pelajaran" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_all_mata_pelajaran_v2" ON public.mata_pelajaran;
CREATE POLICY "admin_all_mata_pelajaran_v2" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "delete_own_mata_pelajaran" ON public.mata_pelajaran;
CREATE POLICY "delete_own_mata_pelajaran" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_mata_pelajaran" ON public.mata_pelajaran;
CREATE POLICY "insert_own_mata_pelajaran" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "mapel_insert_update_delete" ON public.mata_pelajaran;
CREATE POLICY "mapel_insert_update_delete" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (is_admin());
DROP POLICY IF EXISTS "mapel_select" ON public.mata_pelajaran;
CREATE POLICY "mapel_select" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_all_mata_pelajaran" ON public.mata_pelajaran;
CREATE POLICY "select_all_mata_pelajaran" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_all_mata_pelajaran_v2" ON public.mata_pelajaran;
CREATE POLICY "select_all_mata_pelajaran_v2" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_own_mata_pelajaran" ON public.mata_pelajaran;
CREATE POLICY "select_own_mata_pelajaran" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_mata_pelajaran" ON public.mata_pelajaran;
CREATE POLICY "update_own_mata_pelajaran" ON public.mata_pelajaran
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: materi
DROP POLICY IF EXISTS "Akses mandiri materi" ON public.materi;
CREATE POLICY "Akses mandiri materi" ON public.materi
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "delete_policy_materi" ON public.materi;
CREATE POLICY "delete_policy_materi" ON public.materi
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_materi" ON public.materi;
CREATE POLICY "insert_policy_materi" ON public.materi
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_materi" ON public.materi;
CREATE POLICY "select_policy_materi" ON public.materi
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_materi" ON public.materi;
CREATE POLICY "update_policy_materi" ON public.materi
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: muhafadhoh
DROP POLICY IF EXISTS "delete_policy_muhafadhoh" ON public.muhafadhoh;
CREATE POLICY "delete_policy_muhafadhoh" ON public.muhafadhoh
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_muhafadhoh" ON public.muhafadhoh;
CREATE POLICY "insert_policy_muhafadhoh" ON public.muhafadhoh
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_muhafadhoh" ON public.muhafadhoh;
CREATE POLICY "select_policy_muhafadhoh" ON public.muhafadhoh
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_muhafadhoh" ON public.muhafadhoh;
CREATE POLICY "update_policy_muhafadhoh" ON public.muhafadhoh
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: murid
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON public.murid;
CREATE POLICY "Akses Penuh Admin Otomatis" ON public.murid
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "Akses mandiri murid" ON public.murid;
CREATE POLICY "Akses mandiri murid" ON public.murid
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "admin_all_murid" ON public.murid;
CREATE POLICY "admin_all_murid" ON public.murid
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_all_murid_v2" ON public.murid;
CREATE POLICY "admin_all_murid_v2" ON public.murid
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "delete_own_murid" ON public.murid;
CREATE POLICY "delete_own_murid" ON public.murid
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_murid" ON public.murid;
CREATE POLICY "insert_own_murid" ON public.murid
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "murid_insert_update_delete" ON public.murid;
CREATE POLICY "murid_insert_update_delete" ON public.murid
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (is_admin());
DROP POLICY IF EXISTS "murid_select" ON public.murid;
CREATE POLICY "murid_select" ON public.murid
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_all_murid" ON public.murid;
CREATE POLICY "select_all_murid" ON public.murid
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_all_murid_v2" ON public.murid;
CREATE POLICY "select_all_murid_v2" ON public.murid
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_own_murid" ON public.murid;
CREATE POLICY "select_own_murid" ON public.murid
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_murid" ON public.murid;
CREATE POLICY "update_own_murid" ON public.murid
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: nilai
DROP POLICY IF EXISTS "delete_policy_nilai" ON public.nilai;
CREATE POLICY "delete_policy_nilai" ON public.nilai
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_nilai" ON public.nilai;
CREATE POLICY "insert_policy_nilai" ON public.nilai
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_nilai" ON public.nilai;
CREATE POLICY "select_policy_nilai" ON public.nilai
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_nilai" ON public.nilai;
CREATE POLICY "update_policy_nilai" ON public.nilai
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: notifikasi
DROP POLICY IF EXISTS "Akses mandiri notifikasi" ON public.notifikasi;
CREATE POLICY "Akses mandiri notifikasi" ON public.notifikasi
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "delete_policy_notifikasi" ON public.notifikasi;
CREATE POLICY "delete_policy_notifikasi" ON public.notifikasi
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_notifikasi" ON public.notifikasi;
CREATE POLICY "insert_policy_notifikasi" ON public.notifikasi
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_notifikasi" ON public.notifikasi;
CREATE POLICY "select_policy_notifikasi" ON public.notifikasi
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_notifikasi" ON public.notifikasi;
CREATE POLICY "update_policy_notifikasi" ON public.notifikasi
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: pengaturan
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON public.pengaturan;
CREATE POLICY "Akses Penuh Admin Otomatis" ON public.pengaturan
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "Akses mandiri pengaturan" ON public.pengaturan;
CREATE POLICY "Akses mandiri pengaturan" ON public.pengaturan
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "admin_all_pengaturan" ON public.pengaturan;
CREATE POLICY "admin_all_pengaturan" ON public.pengaturan
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "delete_own_pengaturan" ON public.pengaturan;
CREATE POLICY "delete_own_pengaturan" ON public.pengaturan
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_pengaturan" ON public.pengaturan;
CREATE POLICY "insert_own_pengaturan" ON public.pengaturan
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "select_own_pengaturan" ON public.pengaturan;
CREATE POLICY "select_own_pengaturan" ON public.pengaturan
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_pengaturan" ON public.pengaturan;
CREATE POLICY "update_own_pengaturan" ON public.pengaturan
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: pengumuman
DROP POLICY IF EXISTS "Akses mandiri pengumuman" ON public.pengumuman;
CREATE POLICY "Akses mandiri pengumuman" ON public.pengumuman
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "delete_policy_pengumuman" ON public.pengumuman;
CREATE POLICY "delete_policy_pengumuman" ON public.pengumuman
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_pengumuman" ON public.pengumuman;
CREATE POLICY "insert_policy_pengumuman" ON public.pengumuman
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "pengumuman_select" ON public.pengumuman;
CREATE POLICY "pengumuman_select" ON public.pengumuman
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((uid() IS NOT NULL));
DROP POLICY IF EXISTS "select_policy_pengumuman" ON public.pengumuman;
CREATE POLICY "select_policy_pengumuman" ON public.pengumuman
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_pengumuman" ON public.pengumuman;
CREATE POLICY "update_policy_pengumuman" ON public.pengumuman
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: penilaian
DROP POLICY IF EXISTS "Akses mandiri penilaian" ON public.penilaian;
CREATE POLICY "Akses mandiri penilaian" ON public.penilaian
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "delete_policy_penilaian" ON public.penilaian;
CREATE POLICY "delete_policy_penilaian" ON public.penilaian
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_penilaian" ON public.penilaian;
CREATE POLICY "insert_policy_penilaian" ON public.penilaian
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_penilaian" ON public.penilaian;
CREATE POLICY "select_policy_penilaian" ON public.penilaian
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_penilaian" ON public.penilaian;
CREATE POLICY "update_policy_penilaian" ON public.penilaian
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: presensi_guru
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON public.presensi_guru;
CREATE POLICY "Akses Penuh Admin Otomatis" ON public.presensi_guru
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "Akses mandiri presensi_guru" ON public.presensi_guru;
CREATE POLICY "Akses mandiri presensi_guru" ON public.presensi_guru
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "admin_all_presensi_guru" ON public.presensi_guru;
CREATE POLICY "admin_all_presensi_guru" ON public.presensi_guru
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_all_presensi_guru_v2" ON public.presensi_guru;
CREATE POLICY "admin_all_presensi_guru_v2" ON public.presensi_guru
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "delete_own_presensi_guru" ON public.presensi_guru;
CREATE POLICY "delete_own_presensi_guru" ON public.presensi_guru
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_presensi_guru" ON public.presensi_guru;
CREATE POLICY "insert_own_presensi_guru" ON public.presensi_guru
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "select_all_presensi_guru_v2" ON public.presensi_guru;
CREATE POLICY "select_all_presensi_guru_v2" ON public.presensi_guru
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_own_presensi_guru" ON public.presensi_guru;
CREATE POLICY "select_own_presensi_guru" ON public.presensi_guru
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_presensi_guru" ON public.presensi_guru;
CREATE POLICY "update_own_presensi_guru" ON public.presensi_guru
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- Policies for table: presensi_ustaz
DROP POLICY IF EXISTS "insert_own_presensi_ustaz" ON public.presensi_ustaz;
CREATE POLICY "insert_own_presensi_ustaz" ON public.presensi_ustaz
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = guru_id));
DROP POLICY IF EXISTS "select_own_presensi_ustaz" ON public.presensi_ustaz;
CREATE POLICY "select_own_presensi_ustaz" ON public.presensi_ustaz
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (((uid() = guru_id) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = uid()) AND ((profiles.role)::text = 'admin'::text))))));

-- Policies for table: profiles
DROP POLICY IF EXISTS "Admin bypass RLS for Insert" ON public.profiles;
CREATE POLICY "Admin bypass RLS for Insert" ON public.profiles
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK ((role() = 'authenticated'::text));
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    AS PERMISSIVE
    FOR UPDATE
    TO public
    USING ((uid() = id))
    WITH CHECK ((uid() = id));
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((role() = 'authenticated'::text));
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;
CREATE POLICY "admin_all_profiles" ON public.profiles
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_all_profiles_v2" ON public.profiles;
CREATE POLICY "admin_all_profiles_v2" ON public.profiles
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "select_all_profiles_v2" ON public.profiles;
CREATE POLICY "select_all_profiles_v2" ON public.profiles
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);

-- Policies for table: rapor_final
DROP POLICY IF EXISTS "delete_policy_rapor_final" ON public.rapor_final;
CREATE POLICY "delete_policy_rapor_final" ON public.rapor_final
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_rapor_final" ON public.rapor_final;
CREATE POLICY "insert_policy_rapor_final" ON public.rapor_final
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_rapor_final" ON public.rapor_final;
CREATE POLICY "select_policy_rapor_final" ON public.rapor_final
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_rapor_final" ON public.rapor_final;
CREATE POLICY "update_policy_rapor_final" ON public.rapor_final
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: ruangan
DROP POLICY IF EXISTS "admin_all_ruangan" ON public.ruangan;
CREATE POLICY "admin_all_ruangan" ON public.ruangan
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "select_all_ruangan" ON public.ruangan;
CREATE POLICY "select_all_ruangan" ON public.ruangan
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);

-- Policies for table: semester
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON public.semester;
CREATE POLICY "Akses Penuh Admin Otomatis" ON public.semester
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_semester" ON public.semester;
CREATE POLICY "admin_all_semester" ON public.semester
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_all_semester_v2" ON public.semester;
CREATE POLICY "admin_all_semester_v2" ON public.semester
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "read_semester" ON public.semester;
CREATE POLICY "read_semester" ON public.semester
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_all_semester" ON public.semester;
CREATE POLICY "select_all_semester" ON public.semester
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_all_semester_v2" ON public.semester;
CREATE POLICY "select_all_semester_v2" ON public.semester
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "semester_all" ON public.semester;
CREATE POLICY "semester_all" ON public.semester
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (is_admin());
DROP POLICY IF EXISTS "semester_select" ON public.semester;
CREATE POLICY "semester_select" ON public.semester
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((uid() IS NOT NULL));

-- Policies for table: sikap
DROP POLICY IF EXISTS "Akses mandiri sikap" ON public.sikap;
CREATE POLICY "Akses mandiri sikap" ON public.sikap
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "delete_policy_sikap" ON public.sikap;
CREATE POLICY "delete_policy_sikap" ON public.sikap
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_sikap" ON public.sikap;
CREATE POLICY "insert_policy_sikap" ON public.sikap
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_sikap" ON public.sikap;
CREATE POLICY "select_policy_sikap" ON public.sikap
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_sikap" ON public.sikap;
CREATE POLICY "update_policy_sikap" ON public.sikap
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: soal
DROP POLICY IF EXISTS "Akses mandiri soal" ON public.soal;
CREATE POLICY "Akses mandiri soal" ON public.soal
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "delete_policy_soal" ON public.soal;
CREATE POLICY "delete_policy_soal" ON public.soal
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "insert_policy_soal" ON public.soal;
CREATE POLICY "insert_policy_soal" ON public.soal
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "select_policy_soal" ON public.soal;
CREATE POLICY "select_policy_soal" ON public.soal
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((is_admin() OR (user_id = uid())));
DROP POLICY IF EXISTS "update_policy_soal" ON public.soal;
CREATE POLICY "update_policy_soal" ON public.soal
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((is_admin() OR (user_id = uid())))
    WITH CHECK ((is_admin() OR (user_id = uid())));

-- Policies for table: tahun_ajaran
DROP POLICY IF EXISTS "Akses Penuh Admin Otomatis" ON public.tahun_ajaran;
CREATE POLICY "Akses Penuh Admin Otomatis" ON public.tahun_ajaran
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_tahun_ajaran" ON public.tahun_ajaran;
CREATE POLICY "admin_all_tahun_ajaran" ON public.tahun_ajaran
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_all_tahun_ajaran_v2" ON public.tahun_ajaran;
CREATE POLICY "admin_all_tahun_ajaran_v2" ON public.tahun_ajaran
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
DROP POLICY IF EXISTS "read_tahun_ajaran" ON public.tahun_ajaran;
CREATE POLICY "read_tahun_ajaran" ON public.tahun_ajaran
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_all_tahun_ajaran" ON public.tahun_ajaran;
CREATE POLICY "select_all_tahun_ajaran" ON public.tahun_ajaran
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "select_all_tahun_ajaran_v2" ON public.tahun_ajaran;
CREATE POLICY "select_all_tahun_ajaran_v2" ON public.tahun_ajaran
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);
DROP POLICY IF EXISTS "tahun_ajaran_all" ON public.tahun_ajaran;
CREATE POLICY "tahun_ajaran_all" ON public.tahun_ajaran
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (is_admin());
DROP POLICY IF EXISTS "tahun_ajaran_select" ON public.tahun_ajaran;
CREATE POLICY "tahun_ajaran_select" ON public.tahun_ajaran
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((uid() IS NOT NULL));

-- Policies for table: user_settings
DROP POLICY IF EXISTS "delete_own_user_settings" ON public.user_settings;
CREATE POLICY "delete_own_user_settings" ON public.user_settings
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "insert_own_user_settings" ON public.user_settings;
CREATE POLICY "insert_own_user_settings" ON public.user_settings
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((uid() = user_id));
DROP POLICY IF EXISTS "select_own_user_settings" ON public.user_settings;
CREATE POLICY "select_own_user_settings" ON public.user_settings
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((uid() = user_id));
DROP POLICY IF EXISTS "update_own_user_settings" ON public.user_settings;
CREATE POLICY "update_own_user_settings" ON public.user_settings
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((uid() = user_id))
    WITH CHECK ((uid() = user_id));

-- ============================================================
-- 10. GRANTS
-- ============================================================
-- Table grants
GRANT ALL ON TABLE public.absensi TO anon;
GRANT ALL ON TABLE public.absensi TO authenticated;
GRANT ALL ON TABLE public.absensi TO service_role;
GRANT ALL ON TABLE public.absensi_audit TO anon;
GRANT ALL ON TABLE public.absensi_audit TO authenticated;
GRANT ALL ON TABLE public.absensi_audit TO service_role;
GRANT ALL ON TABLE public.agenda TO anon;
GRANT ALL ON TABLE public.agenda TO authenticated;
GRANT ALL ON TABLE public.agenda TO service_role;
GRANT ALL ON TABLE public.agenda_penting TO anon;
GRANT ALL ON TABLE public.agenda_penting TO authenticated;
GRANT ALL ON TABLE public.agenda_penting TO service_role;
GRANT ALL ON TABLE public.audit_trail_absensi TO anon;
GRANT ALL ON TABLE public.audit_trail_absensi TO authenticated;
GRANT ALL ON TABLE public.audit_trail_absensi TO service_role;
GRANT ALL ON TABLE public.bank_soal TO anon;
GRANT ALL ON TABLE public.bank_soal TO authenticated;
GRANT ALL ON TABLE public.bank_soal TO service_role;
GRANT ALL ON TABLE public.buku_saku TO anon;
GRANT ALL ON TABLE public.buku_saku TO authenticated;
GRANT ALL ON TABLE public.buku_saku TO service_role;
GRANT ALL ON TABLE public.capaian_hafalan TO anon;
GRANT ALL ON TABLE public.capaian_hafalan TO authenticated;
GRANT ALL ON TABLE public.capaian_hafalan TO service_role;
GRANT ALL ON TABLE public.catatan_guru TO anon;
GRANT ALL ON TABLE public.catatan_guru TO authenticated;
GRANT ALL ON TABLE public.catatan_guru TO service_role;
GRANT ALL ON TABLE public.catatan_guru_notifikasi TO anon;
GRANT ALL ON TABLE public.catatan_guru_notifikasi TO authenticated;
GRANT ALL ON TABLE public.catatan_guru_notifikasi TO service_role;
GRANT ALL ON TABLE public.catatan_perilaku TO anon;
GRANT ALL ON TABLE public.catatan_perilaku TO authenticated;
GRANT ALL ON TABLE public.catatan_perilaku TO service_role;
GRANT ALL ON TABLE public.detail_nilai TO anon;
GRANT ALL ON TABLE public.detail_nilai TO authenticated;
GRANT ALL ON TABLE public.detail_nilai TO service_role;
GRANT ALL ON TABLE public.guru_pengganti TO anon;
GRANT ALL ON TABLE public.guru_pengganti TO authenticated;
GRANT ALL ON TABLE public.guru_pengganti TO service_role;
GRANT ALL ON TABLE public.hari_belajar TO anon;
GRANT ALL ON TABLE public.hari_belajar TO authenticated;
GRANT ALL ON TABLE public.hari_belajar TO service_role;
GRANT ALL ON TABLE public.izin_mengajar TO anon;
GRANT ALL ON TABLE public.izin_mengajar TO authenticated;
GRANT ALL ON TABLE public.izin_mengajar TO service_role;
GRANT ALL ON TABLE public.jadwal TO anon;
GRANT ALL ON TABLE public.jadwal TO authenticated;
GRANT ALL ON TABLE public.jadwal TO service_role;
GRANT ALL ON TABLE public.jadwal_mengajar TO anon;
GRANT ALL ON TABLE public.jadwal_mengajar TO authenticated;
GRANT ALL ON TABLE public.jadwal_mengajar TO service_role;
GRANT ALL ON TABLE public.jam_pelajaran TO anon;
GRANT ALL ON TABLE public.jam_pelajaran TO authenticated;
GRANT ALL ON TABLE public.jam_pelajaran TO service_role;
GRANT ALL ON TABLE public.jurnal_kbm TO anon;
GRANT ALL ON TABLE public.jurnal_kbm TO authenticated;
GRANT ALL ON TABLE public.jurnal_kbm TO service_role;
GRANT ALL ON TABLE public.kbm_harian TO anon;
GRANT ALL ON TABLE public.kbm_harian TO authenticated;
GRANT ALL ON TABLE public.kbm_harian TO service_role;
GRANT ALL ON TABLE public.kelas TO anon;
GRANT ALL ON TABLE public.kelas TO authenticated;
GRANT ALL ON TABLE public.kelas TO service_role;
GRANT ALL ON TABLE public.lembaga TO anon;
GRANT ALL ON TABLE public.lembaga TO authenticated;
GRANT ALL ON TABLE public.lembaga TO service_role;
GRANT ALL ON TABLE public.mata_pelajaran TO anon;
GRANT ALL ON TABLE public.mata_pelajaran TO authenticated;
GRANT ALL ON TABLE public.mata_pelajaran TO service_role;
GRANT ALL ON TABLE public.materi TO anon;
GRANT ALL ON TABLE public.materi TO authenticated;
GRANT ALL ON TABLE public.materi TO service_role;
GRANT ALL ON TABLE public.muhafadhoh TO anon;
GRANT ALL ON TABLE public.muhafadhoh TO authenticated;
GRANT ALL ON TABLE public.muhafadhoh TO service_role;
GRANT ALL ON TABLE public.murid TO anon;
GRANT ALL ON TABLE public.murid TO authenticated;
GRANT ALL ON TABLE public.murid TO service_role;
GRANT ALL ON TABLE public.nilai TO anon;
GRANT ALL ON TABLE public.nilai TO authenticated;
GRANT ALL ON TABLE public.nilai TO service_role;
GRANT ALL ON TABLE public.notifikasi TO anon;
GRANT ALL ON TABLE public.notifikasi TO authenticated;
GRANT ALL ON TABLE public.notifikasi TO service_role;
GRANT ALL ON TABLE public.pengaturan TO anon;
GRANT ALL ON TABLE public.pengaturan TO authenticated;
GRANT ALL ON TABLE public.pengaturan TO service_role;
GRANT ALL ON TABLE public.pengumuman TO anon;
GRANT ALL ON TABLE public.pengumuman TO authenticated;
GRANT ALL ON TABLE public.pengumuman TO service_role;
GRANT ALL ON TABLE public.penilaian TO anon;
GRANT ALL ON TABLE public.penilaian TO authenticated;
GRANT ALL ON TABLE public.penilaian TO service_role;
GRANT ALL ON TABLE public.presensi_guru TO anon;
GRANT ALL ON TABLE public.presensi_guru TO authenticated;
GRANT ALL ON TABLE public.presensi_guru TO service_role;
GRANT ALL ON TABLE public.presensi_ustaz TO anon;
GRANT ALL ON TABLE public.presensi_ustaz TO authenticated;
GRANT ALL ON TABLE public.presensi_ustaz TO service_role;
GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.rapor_final TO anon;
GRANT ALL ON TABLE public.rapor_final TO authenticated;
GRANT ALL ON TABLE public.rapor_final TO service_role;
GRANT ALL ON TABLE public.ruangan TO anon;
GRANT ALL ON TABLE public.ruangan TO authenticated;
GRANT ALL ON TABLE public.ruangan TO service_role;
GRANT ALL ON TABLE public.semester TO anon;
GRANT ALL ON TABLE public.semester TO authenticated;
GRANT ALL ON TABLE public.semester TO service_role;
GRANT ALL ON TABLE public.sikap TO anon;
GRANT ALL ON TABLE public.sikap TO authenticated;
GRANT ALL ON TABLE public.sikap TO service_role;
GRANT ALL ON TABLE public.soal TO anon;
GRANT ALL ON TABLE public.soal TO authenticated;
GRANT ALL ON TABLE public.soal TO service_role;
GRANT ALL ON TABLE public.tahun_ajaran TO anon;
GRANT ALL ON TABLE public.tahun_ajaran TO authenticated;
GRANT ALL ON TABLE public.tahun_ajaran TO service_role;
GRANT ALL ON TABLE public.user_settings TO anon;
GRANT ALL ON TABLE public.user_settings TO authenticated;
GRANT ALL ON TABLE public.user_settings TO service_role;

-- Function grants
GRANT EXECUTE ON FUNCTION public.audit_perubahan_nilai() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_perubahan_nilai() TO anon;
GRANT EXECUTE ON FUNCTION public.audit_perubahan_nilai() TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_perubahan_nilai() TO service_role;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO anon;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_hitung_kehadiran_murid(p_murid_id uuid, p_start_date date, p_end_date date) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_hitung_kehadiran_murid(p_murid_id uuid, p_start_date date, p_end_date date) TO anon;
GRANT EXECUTE ON FUNCTION public.fn_hitung_kehadiran_murid(p_murid_id uuid, p_start_date date, p_end_date date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_hitung_kehadiran_murid(p_murid_id uuid, p_start_date date, p_end_date date) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_hitung_kehadiran_ustaz(p_guru_id uuid, p_start_date date, p_end_date date) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_hitung_kehadiran_ustaz(p_guru_id uuid, p_start_date date, p_end_date date) TO anon;
GRANT EXECUTE ON FUNCTION public.fn_hitung_kehadiran_ustaz(p_guru_id uuid, p_start_date date, p_end_date date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_hitung_kehadiran_ustaz(p_guru_id uuid, p_start_date date, p_end_date date) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_murid_presensi_by_kelas(p_kelas_id uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_murid_presensi_by_kelas(p_kelas_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.fn_murid_presensi_by_kelas(p_kelas_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_murid_presensi_by_kelas(p_kelas_id uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_update_timestamp() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_update_timestamp() TO anon;
GRANT EXECUTE ON FUNCTION public.fn_update_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_update_timestamp() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_ustaz_detail_presensi(p_guru_id uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_ustaz_detail_presensi(p_guru_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.fn_ustaz_detail_presensi(p_guru_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_ustaz_detail_presensi(p_guru_id uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_ustaz_presensi_list_hari_ini() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_ustaz_presensi_list_hari_ini() TO anon;
GRANT EXECUTE ON FUNCTION public.fn_ustaz_presensi_list_hari_ini() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_ustaz_presensi_list_hari_ini() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_code(prefix text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_code(prefix text) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_code(prefix text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_code(prefix text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_attendance_percentage() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_attendance_percentage() TO anon;
GRANT EXECUTE ON FUNCTION public.get_attendance_percentage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_percentage() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_statistics() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_statistics() TO anon;
GRANT EXECUTE ON FUNCTION public.get_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_statistics() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_multiple_active_semester() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_multiple_active_semester() TO anon;
GRANT EXECUTE ON FUNCTION public.prevent_multiple_active_semester() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_multiple_active_semester() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_multiple_active_tahun() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_multiple_active_tahun() TO anon;
GRANT EXECUTE ON FUNCTION public.prevent_multiple_active_tahun() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_multiple_active_tahun() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_schedule_conflict() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_schedule_conflict() TO anon;
GRANT EXECUTE ON FUNCTION public.prevent_schedule_conflict() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_schedule_conflict() TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_share_nilai(p_murid_id uuid, p_mapel_id uuid, p_nomor_wali text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_share_nilai(p_murid_id uuid, p_mapel_id uuid, p_nomor_wali text) TO anon;
GRANT EXECUTE ON FUNCTION public.queue_share_nilai(p_murid_id uuid, p_mapel_id uuid, p_nomor_wali text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_share_nilai(p_murid_id uuid, p_mapel_id uuid, p_nomor_wali text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_user_id_on_insert() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_id_on_insert() TO anon;
GRANT EXECUTE ON FUNCTION public.set_user_id_on_insert() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_id_on_insert() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_rapor_final() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_rapor_final() TO anon;
GRANT EXECUTE ON FUNCTION public.sync_rapor_final() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_rapor_final() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_settings_updated_at() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_settings_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_settings_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_settings_updated_at() TO service_role;

-- ============================================================
-- 11. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('lampiran', 'lampiran', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('logo', 'logo', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('materi', 'materi', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('murid', 'murid', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('presensi-ustaz', 'presensi-ustaz', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('soal', 'soal', false) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. STORAGE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated upload to presensi-ustaz" ON storage.objects;
CREATE POLICY "Allow authenticated upload to presensi-ustaz" ON storage.objects
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (((bucket_id = 'presensi-ustaz'::text) AND ((storage.foldername(name))[1] = (uid())::text)));

DROP POLICY IF EXISTS "Allow public read from presensi-ustaz" ON storage.objects;
CREATE POLICY "Allow public read from presensi-ustaz" ON storage.objects
    AS PERMISSIVE
    FOR SELECT
    TO anon, authenticated
    USING ((bucket_id = 'presensi-ustaz'::text));
