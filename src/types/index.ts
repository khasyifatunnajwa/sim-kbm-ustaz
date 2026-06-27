// Types sinkron dengan skema database live.

export interface Kelas {
  id: number;
  nama_kelas: string;
  tingkat: number;
  aktif: boolean;
  wali_kelas?: string;
  lembaga?: string;
  tahun_ajaran?: string;
  tahun_ajaran_id?: number;
  user_id: string;
  created_at: string;
}

// murid: kelas_id FK ke tabel kelas (kolom kelas text masih ada sebagai fallback)
export interface Murid {
  id: string;
  nama: string;
  kelas_id?: number | null;
  kelas?: string;
  nomor_whatsapp?: string;
  alamat?: string;
  domisili?: string;
  status_aktif: boolean;
  user_id: string;
  created_at: string;
  // join
  kelas_data?: Kelas;
}

// jadwal_mengajar: kolom kelas text (DB lama), ditambah kelas_id opsional
export interface JadwalMengajar {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kelas: string;
  kelas_id?: number | null;
  pelajaran: string;
  ruangan?: string;
  catatan?: string;
  user_id: string;
  created_at: string;
  // join
  kelas_data?: Kelas;
}

export interface Absensi {
  id: string;
  murid_id: string;
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
  id: string;
  murid_id: string;
  pelajaran: string;
  jenis_ujian: string;
  skor: number;
  tanggal: string;
  user_id: string;
  created_at: string;
}

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

export interface CatatanPerilaku {
  id: string;
  murid_id: string;
  jenis: 'prestasi' | 'pelanggaran' | 'catatan';
  catatan: string;
  user_id: string;
  created_at: string;
}

export interface CapaianHafalan {
  id: string;
  murid_id: string;
  capaian: string;
  tanggal: string;
  user_id: string;
  created_at: string;
}

export type ActiveTab =
  | 'kelas'
  | 'jadwal'
  | 'murid'
  | 'absensi'
  | 'kbm'
  | 'sikap'
  | 'nilai'
  | 'soal'
  | 'agenda';

export type ShowToast = (message: string, type?: 'success' | 'error' | 'info') => void;
