// Types match the LIVE database schema (hybrid of two migrations).
// Tables with uuid IDs use text "kelas"; tables with bigint IDs use kelas_id FK.

export interface Kelas {
  id: number;
  nama_kelas: string;
  tingkat: number;
  aktif: boolean;
  wali_kelas?: string;
  tahun_ajaran_id?: number;
  user_id: string;
  created_at: string;
}

// murid: uuid id, kelas text (no FK)
export interface Murid {
  id: string;
  nama: string;
  kelas: string;
  nomor_whatsapp?: string;
  alamat?: string;
  domisili?: string;
  status_aktif: boolean;
  user_id: string;
  created_at: string;
}

// jadwal_mengajar: uuid id, kelas text, ruangan, catatan
export interface JadwalMengajar {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kelas: string;
  pelajaran: string;
  ruangan?: string;
  catatan?: string;
  user_id: string;
  created_at: string;
}

// absensi: uuid id, tanggal text
export interface Absensi {
  id: string;
  murid_id: string;
  tanggal: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
  user_id: string;
  created_at: string;
}

// kbm_harian: bigint id, kelas_id FK
export interface KbmHarian {
  id: number;
  tanggal: string;
  kelas_id: number;
  pelajaran: string;
  materi?: string;
  catatan?: string;
  durasi?: number;
  selesai: boolean;
  user_id: string;
  created_at: string;
}

// buku_saku: bigint id, kelas_id FK
export interface BukuSaku {
  id: number;
  kelas_id: number;
  pelajaran: string;
  bab_terakhir?: string;
  halaman_terakhir?: string;
  catatan?: string;
  user_id: string;
  created_at: string;
}

// muhafadhoh: bigint id, kelas_id FK
export interface Muhafadhoh {
  id: number;
  kelas_id: number;
  tanggal: string;
  materi?: string;
  target_hafalan?: string;
  catatan?: string;
  user_id: string;
  created_at: string;
}

// nilai: uuid id, jenis_ujian, tanggal
export interface Nilai {
  id: string;
  murid_id: string;
  pelajaran: string;
  jenis_ujian: string;
  skor: number;
  tanggal: string;
  user_id: string;
  created_at: string;
}

// bank_soal: uuid id, kelas text, batasan
export interface BankSoal {
  id: string;
  pelajaran: string;
  kelas: string;
  batasan?: string;
  isi_soal: string;
  user_id: string;
  created_at: string;
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

export interface Pengumuman {
  id: number;
  judul: string;
  isi: string;
  kategori: string;
  tanggal: string;
  user_id: string;
  created_at: string;
}

// catatan_perilaku: uuid id, murid_id uuid
export interface CatatanPerilaku {
  id: string;
  murid_id: string;
  jenis: 'prestasi' | 'pelanggaran' | 'catatan';
  catatan: string;
  user_id: string;
  created_at: string;
}

// capaian_hafalan: uuid id, murid_id uuid, tanggal text
export interface CapaianHafalan {
  id: string;
  murid_id: string;
  capaian: string;
  tanggal: string;
  user_id: string;
  created_at: string;
}

export type ActiveTab = 'jadwal' | 'murid' | 'absensi' | 'kbm' | 'sikap' | 'nilai' | 'soal' | 'agenda';

export type ShowToast = (message: string, type?: 'success' | 'error' | 'info') => void;
