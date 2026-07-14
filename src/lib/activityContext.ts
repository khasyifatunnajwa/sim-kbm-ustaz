import type { JadwalMengajar } from '../types';

const STORAGE_KEY = 'simkbm-active-jadwal';

export interface ActivityContext {
  jadwal_id: string;
  kelas: string;
  pelajaran: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan?: string;
  user_id: string;
  lembaga_id?: string;
  gender?: string;
  hari: string;
}

export function setActivityContext(jadwal: JadwalMengajar): void {
  const ctx: ActivityContext = {
    jadwal_id: jadwal.id,
    kelas: jadwal.kelas,
    pelajaran: jadwal.pelajaran,
    jam_mulai: jadwal.jam_mulai,
    jam_selesai: jadwal.jam_selesai,
    ruangan: jadwal.ruangan,
    user_id: jadwal.user_id,
    lembaga_id: jadwal.lembaga_id,
    gender: jadwal.gender,
    hari: jadwal.hari,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
}

export function getActivityContext(): ActivityContext | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActivityContext;
  } catch {
    return null;
  }
}

export function clearActivityContext(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
