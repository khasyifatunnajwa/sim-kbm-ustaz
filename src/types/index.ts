// Types for SIM KBM Ustaz V2.0 - Multi-Tenant PWA
// All tables use UUID id, have proper FK relationships

// ============ ENUMS ============
export type UserRole = 'admin' | 'operator' | 'ustaz';
export type MuridStatus = 'Aktif' | 'Lulus' | 'Pindah' | 'Keluar' | 'Cuti';
export type KelompokMapel = 'Diniyah' | 'Umum' | 'Bahasa' | 'Tahfidz' | 'Lainnya';
export type Hari = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';
export type StatusAbsensi = 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
export type JenisPenilaian = 'Ulangan' | 'Ujian Tulis' | 'Ujian Lisan' | 'Tugas' | 'Hafalan' | 'Praktik' | 'Lainnya';
export type KategoriCatatan = 'Umum' | 'Acara' | 'Undangan' | 'Agenda';
export type StatusCatatan = 'Belum Selesai' | 'Selesai';
export type PrioritasPengumuman = 'Normal' | 'Penting' | 'Sangat Penting';
export type StatusPresensi = 'Hadir' | 'Terlambat' | 'Belum Presensi';

export interface Lembaga {
  id: string;
  nama_lembaga: string;
  alamat?: string;
  telepon?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ============ CORE TABLES ============

export interface TahunAjaran {
  id: string;
  nama: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  nama: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  nama_lengkap?: string;
  nama_panggilan?: string;
  email?: string;
  nomor_whatsapp?: string;
  id_login?: string;
  alamat?: string;
  foto?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
}

export interface Pengaturan {
  id: string;
  user_id: string;
  nama_sekolah?: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  website?: string;
  logo?: string;
  tema?: string;
  bahasa?: string;
  zona_waktu?: string;
  created_at: string;
  updated_at: string;
}

// ============ MASTER DATA ============

export interface Kelas {
  id: string;
  user_id: string;
  kode?: string;
  nama_kelas: string;
  tingkat?: string;
  warna?: string;
  keterangan?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
}

export interface MataPelajaran {
  id: string;
  user_id: string;
  kode?: string;
  nama_mapel: string;
  kelompok?: KelompokMapel;
  warna?: string;
  keterangan?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
}

export interface Murid {
  id: string;
  user_id: string;
  kelas_id?: string;
  kelas?: string; 
  nis?: string;
  nama: string;
  jenis_kelamin?: 'L' | 'P';
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  domisili?: string; 
  nama_wali?: string;
  no_hp_wali?: string;
  nomor_whatsapp?: string; 
  status?: MuridStatus;
  status_aktif?: boolean; 
  lembaga_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
}

// ============ KBM MODULE ============

export interface Jadwal {
  id: string;
  user_id: string;
  kelas_id: string;
  mapel_id: string;
  semester_id: string;
  tahun_ajaran_id: string;
  hari: Hari;
  jam_mulai: string;
  jam_selesai: string;
  ruangan?: string;
  warna?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
  kelas?: Kelas;
  mapel?: MataPelajaran;
  semester?: Semester;
  tahun_ajaran?: TahunAjaran;
}

export interface JurnalKBM {
  id: string;
  user_id: string;
  jadwal_id?: string;
  kelas?: string;
  pelajaran?: string;
  tanggal: string;
  materi?: string;
  target?: string;
  realisasi?: string;
  metode?: string;
  catatan?: string;
  lembaga_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
  jadwal?: Jadwal;
}

export interface Absensi {
  id: string;
  user_id: string;
  jadwal_id?: string;
  murid_id?: string;
  tanggal: string;
  status?: StatusAbsensi;
  keterangan?: string;
  lembaga_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
  jadwal?: Jadwal;
  murid?: Murid;
}

// ============ PENILAIAN MODULE ============

export interface Penilaian {
  id: string;
  user_id: string;
  kelas?: string;
  mapel?: string;
  nama_penilaian: string;
  jenis?: JenisPenilaian;
  bobot?: number;
  tanggal: string;
  lembaga_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
}

export interface DetailNilai {
  id: string;
  user_id: string;
  penilaian_id?: string;
  murid_id?: string;
  nilai?: number;
  catatan?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
  penilaian?: Penilaian;
  murid?: Murid;
}

export interface Sikap {
  id: string;
  user_id: string;
  murid_id?: string;
  tanggal: string;
  disiplin?: number;
  adab?: number;
  kerajinan?: number;
  kejujuran?: number;
  tanggung_jawab?: number;
  catatan?: string;
  lembaga_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
  murid?: Murid;
}

// ============ PRODUKTIVITAS MODULE ============

export interface CatatanGuru {
  id: string;
  user_id: string;
  kategori: KategoriCatatan;
  judul: string;
  isi?: string;
  tanggal_waktu?: string;
  lokasi?: string;
  status: StatusCatatan;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
}

// ============ INFORMASI & PENDUKUNG ============

export interface Agenda {
  id: string;
  user_id: string;
  judul: string;
  isi?: string;
  tanggal: string;
  jam?: string;
  selesai?: string;
  warna?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
}

export interface Pengumuman {
  id: string | number;
  user_id: string;
  judul: string;
  isi?: string;
  kategori?: string;
  jenis?: string;
  prioritas?: string;
  aktif?: boolean;
  tanggal?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  status?: string; 
  lampiran?: string;
  dibuat_oleh?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  is_active?: boolean;
}

export interface Ruangan {
  id: string;
  user_id: string;
  nama_ruangan: string;
  kode?: string;
  kapasitas?: number;
  keterangan?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface IzinMengajar {
  id: string;
  user_id: string;
  nama_ustaz: string;
  jenis_izin: string;
  lama_izin: string;
  tanggal_mulai: string;
  tanggal_selesai?: string;
  mata_pelajaran?: string;
  kelas?: string;
  guru_pengganti?: string;
  catatan?: string;
  status: string; 
  created_at: string;
  updated_at?: string;
}

export interface Notifikasi {
  id: string;
  user_id: string;
  judul: string;
  pesan: string;
  dibaca: boolean;
  created_at: string;
}



// ============ LAIN-LAIN ============

export interface Materi {
  id: string;
  user_id: string;
  kelas_id?: string;
  mapel_id?: string;
  judul: string;
  isi?: string;
  lampiran?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
}

export interface PresensiGuru {
  id: string;
  user_id: string;
  tanggal: string;
  jam_masuk?: string;
  jam_keluar?: string;
  lokasi?: string;
  keterangan?: string;
  lembaga_id?: string;
  foto_url?: string;
  telat_menit?: number;
  created_at: string;
  updated_at: string;
}

export interface PresensiUstaz {
  id: string;
  guru_id: string;
  kelas_id?: number | null;
  jadwal_id?: string | null;
  tanggal: string;
  jam_server: string;
  latitude?: number | null;
  longitude?: number | null;
  akurasi_gps?: number | null;
  status: StatusPresensi;
  photo_url?: string | null;
  photo_expired?: boolean;
  created_at: string;
  guru?: Profile;
  kelas?: { id: number; nama_kelas: string };
  jadwal?: JadwalMengajar;
}

export interface Soal {
  id: string;
  user_id: string;
  kelas_id?: string;
  mapel_id?: string;
  judul: string;
  pertanyaan: string;
  jawaban?: string;
  tingkat?: string;
  lampiran?: string;
  lembaga_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
}

export interface RaporFinal {
  id: string;
  user_id: string;
  murid_id?: string;
  semester_id?: string;
  tahun_ajaran_id?: string;
  nilai_akhir?: number;
  predikat?: string;
  deskripsi?: string;
  created_at: string;
  updated_at: string;
}



// ============ APP TYPES ============

export type ActiveTab =
  | 'dashboard'
  | 'jadwal'
  | 'murid'
  | 'absensi'
  | 'jurnal'
  | 'nilai'
  | 'sikap'
  | 'catatan'
  | 'soal'
  | 'izin'
  | 'rapor'
  | 'pengumuman'
  | 'admin'
  | 'profil'
  | 'presensi'
  | 'presensi-admin'
  | 'admin-presensi'
  | 'admin-kelola-user'
  | 'admin-data-akademik'
  | 'admin-kenakalan'
  | 'admin-presensi-ustaz'
  | 'admin-presensi-murid'
  | 'admin-jadwal-ustaz'
  | 'admin-data-santri'
  | 'admin-jadwal-asatiz'
  | 'admin-kelola-lembaga';

export type ShowToast = (message: string, type?: 'success' | 'error' | 'info') => void;

export interface MuridFormData {
  nama: string;
  kelas_id?: string;
  nis?: string;
  jenis_kelamin?: 'L' | 'P';
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  nama_wali?: string;
  no_hp_wali?: string;
  status: MuridStatus;
}

export interface JadwalFormData {
  kelas_id: string;
  mapel_id: string;
  semester_id: string;
  tahun_ajaran_id: string;
  hari: Hari;
  jam_mulai: string;
  jam_selesai: string;
  ruangan?: string;
  warna?: string;
}

export interface JadwalMengajar {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kelas: string;
  pelajaran: string;
  ruangan?: string;
  catatan?: string;
  lembaga_id?: string;
  is_libur?: boolean;
  guru_pengganti_id?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface BankSoal {
  id: string;
  pelajaran: string;
  kelas: string;
  batasan?: string;
  isi_soal: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface AgendaPenting {
  id: number;
  judul: string;
  catatan?: string;
  jenis: string;
  tanggal: string;
  user_id: string;
  created_at: string;
}

export interface Nilai {
  id: string;
  murid_id: string;
  pelajaran: string;
  jenis_ujian: string;
  skor: number;
  tanggal: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface CatatanPerilaku {
  id: string;
  murid_id: string;
  jenis: 'prestasi' | 'pelanggaran' | 'catatan';
  catatan: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface CapaianHafalan {
  id: string;
  murid_id: string;
  capaian: string;
  tanggal: string;
  user_id: string;
  created_at: string;
}

export interface BukuSaku {
  id: number;
  kelas_id?: number;
  pelajaran: string;
  bab_terakhir?: string;
  halaman_terakhir?: string;
  catatan?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  kelas?: { nama_kelas: string };
}

export interface Muhafadhoh {
  id: number;
  kelas_id?: number;
  tanggal: string;
  materi?: string;
  target_hafalan?: string;
  catatan?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  kelas?: { nama_kelas: string };
}

export interface KbmHarian {
  id: number;
  tanggal: string;
  kelas_id?: number;
  pelajaran?: string;
  materi?: string;
  catatan?: string;
  durasi?: number;
  selesai: boolean;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

// ============ NEW TABLES FOR V2.0 UPDATE ============



export interface GuruPengganti {
  id: string;
  jadwal_asli_id?: string;
  guru_asli_id: string;
  guru_pengganti_id: string;
  tanggal: string;
  kelas?: string;
  mapel?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  alasan?: string;
  status: 'berlangsung' | 'selesai' | 'dibatalkan';
  created_at: string;
  updated_at: string;
  guru_asli?: Profile;
  guru_pengganti?: Profile;
}



// Admin View Types
export interface DashboardPresensiUstaz {
  hadir: number;
  terlambat: number;
  sakit: number;
  izin: number;
  alfa: number;
  guru_pengganti: number;
  total_guru: number;
}

export interface DashboardPresensiMurid {
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  total_murid: number;
  persentase_kehadiran: number;
}

export interface PresensiMuridByKelas {
  kelas_id: string;
  nama_kelas: string;
  total_murid: number;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  persentase: number;
}



export interface UstazPresensiList {
  guru_id: string;
  nama_lengkap: string;
  nama_panggilan: string;
  foto: string;
  nomor_whatsapp: string;
  sudah_presensi: boolean;
  status_presensi: string;
  jam_presensi: string;
}

export interface UstazDetailPresensi {
  guru_id: string;
  nama_lengkap: string;
  nama_panggilan: string;
  foto: string;
  nomor_whatsapp: string;
  total_hari_kerja: number;
  hadir: number;
  terlambat: number;
  sakit: number;
  izin: number;
  alfa: number;
  sebagai_pengganti: number;
  persentase_hadir: number;
}

export interface KelasKosong {
  jadwal_id: string;
  nama_kelas: string;
  nama_mapel: string;
  nama_guru: string;
  jam_mulai: string;
  jam_selesai: string;
  guru_id: string;
  lama_belum_presensi: string;
}

export interface KenakalanUstaz {
  guru_id: string;
  nama_lengkap: string;
  nama_panggilan: string;
  foto: string;
  nomor_whatsapp: string;
  jumlah_kelas_hari_ini: number;
  jumlah_tidak_hadir: number;
}

export interface KenakalanMurid {
  murid_id: string;
  nama_murid: string;
  kelas_id: string;
  nama_kelas: string;
  no_hp_wali: string;
  nama_wali: string;
  jumlah_alfa: number;
  wali_kelas_id: string;
  nama_wali_kelas: string;
}
