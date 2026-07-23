import { supabase } from './supabase';
import type { Profile, Kelas, MataPelajaran } from '../types';

export interface UstazScope {
  kelasList: string[];
  mapelList: string[];
  kelasIds: string[];
  mapelIds: string[];
  isAdmin: boolean;
}

export async function getUstazScope(profile: Profile | null): Promise<UstazScope> {
  if (!profile) return { kelasList: [], mapelList: [], kelasIds: [], mapelIds: [], isAdmin: false };

  if (profile.role === 'admin') {
    const [kelasRes, mapelRes] = await Promise.all([
      supabase.from('kelas').select('id, nama_kelas').eq('is_active', true).order('nama_kelas'),
      supabase.from('mata_pelajaran').select('id, nama_mapel').eq('is_active', true).order('nama_mapel'),
    ]);
    const kelasData = (kelasRes.data as Pick<Kelas, 'id' | 'nama_kelas'>[] | null) ?? [];
    const mapelData = (mapelRes.data as Pick<MataPelajaran, 'id' | 'nama_mapel'>[] | null) ?? [];
    return {
      kelasList: kelasData.map(k => k.nama_kelas).filter(Boolean),
      mapelList: mapelData.map(m => m.nama_mapel).filter(Boolean),
      kelasIds: kelasData.map(k => k.id).filter(Boolean),
      mapelIds: mapelData.map(m => m.id).filter(Boolean),
      isAdmin: true,
    };
  }

  const { data: jadwalData } = await supabase
    .from('jadwal_mengajar')
    .select('kelas, pelajaran, kelas_id, mapel_id')
    .eq('user_id', profile.id);

  const kelasSet = new Set<string>();
  const mapelSet = new Set<string>();
  const kelasIdSet = new Set<string>();
  const mapelIdSet = new Set<string>();
  (jadwalData || []).forEach((j: any) => {
    if (j.kelas) kelasSet.add(j.kelas);
    if (j.pelajaran) mapelSet.add(j.pelajaran);
    if (j.kelas_id) kelasIdSet.add(j.kelas_id);
    if (j.mapel_id) mapelIdSet.add(j.mapel_id);
  });

  if (kelasIdSet.size === 0) {
    const { data: kelasData } = await supabase.from('kelas').select('id, nama_kelas').eq('is_active', true).order('nama_kelas');
    (kelasData || []).forEach((k: any) => {
      if (k.id) kelasIdSet.add(k.id);
      if (k.nama_kelas) kelasSet.add(k.nama_kelas);
    });
  }
  if (mapelIdSet.size === 0) {
    const { data: mapelData } = await supabase.from('mata_pelajaran').select('id, nama_mapel').eq('is_active', true).order('nama_mapel');
    (mapelData || []).forEach((m: any) => {
      if (m.id) mapelIdSet.add(m.id);
      if (m.nama_mapel) mapelSet.add(m.nama_mapel);
    });
  }

  return {
    kelasList: [...kelasSet].sort(),
    mapelList: [...mapelSet].sort(),
    kelasIds: [...kelasIdSet].sort(),
    mapelIds: [...mapelIdSet].sort(),
    isAdmin: false,
  };
}
