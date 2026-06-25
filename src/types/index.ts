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

export interface Murid {
  id: number;
  nama: string;
  kelas_id: number;
  nomor_whatsapp?: string;
  alamat?: string;
  domisili?: string;
  status_aktif: boolean;
  user_id: string;
  created_at: string;
}

export interface JadwalMengajar {
  id: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kelas_id: number;
  pelajaran: string;
  lokasi?: string;
  user_id: string;
  created_at: string;
}

export interface Absensi {
  id: number;
  murid_id: number;
  tanggal: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
  user_id: string;
  created_at: string;
}

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

export interface Nilai {
  id: number;
  murid_id: number;
  pelajaran: string;
  jenis_penilaian: string;
  skor: number;
  tanggal: string;
  user_id: string;
  created_at: string;
}

export interface BankSoal {
  id: number;
  kelas_id: number;
  pelajaran: string;
  batasan_materi?: string;
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

export type ActiveTab = 'jadwal' | 'murid' | 'absensi' | 'kbm' | 'nilai' | 'agenda';

export type ShowToast = (message: string, type?: 'success' | 'error' | 'info') => void;
