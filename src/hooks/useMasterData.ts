import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getUstazScope } from '../lib/ustazData';
import type { Profile, JadwalMengajar, Murid } from '../types';

export function useMasterData(profile: Profile | null) {
  const isAdmin = profile?.role === 'admin';
  const userId = profile?.id ?? '';

  const { data: scope } = useQuery({
    queryKey: ['ustaz-scope', userId, isAdmin],
    queryFn: () => getUstazScope(profile),
    enabled: !!profile,
    staleTime: 5 * 60 * 1000,
  });

  const { data: kelasList = [] } = useQuery({
    queryKey: ['kelas-list', userId, isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kelas')
        .select('id, nama_kelas, tingkat, aktif')
        .eq('aktif', true)
        .order('nama_kelas');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000,
  });

  const { data: mapelList = [] } = useQuery({
    queryKey: ['mapel-list', userId, isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mata_pelajaran')
        .select('id, nama_mapel, kelompok, kode')
        .eq('is_active', true)
        .order('nama_mapel');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000,
  });

  const { data: jadwalList = [] } = useQuery<JadwalMengajar[]>({
    queryKey: ['jadwal-list', userId, isAdmin],
    queryFn: async () => {
      let q = supabase.from('jadwal_mengajar').select('*').order('jam_mulai');
      if (!isAdmin) q = q.eq('user_id', userId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as JadwalMengajar[];
    },
    enabled: !!profile,
    staleTime: 60 * 1000,
  });

  const { data: muridList = [] } = useQuery<Murid[]>({
    queryKey: ['murid-list', userId, isAdmin],
    queryFn: async () => {
      let q = supabase.from('murid').select('*').eq('status_aktif', true).order('nama');
      const { data, error } = await q;
      if (error) throw error;
      const murid = (data ?? []) as Murid[];
      if (!isAdmin && scope && scope.kelasList.length > 0) {
        return murid.filter(m => scope.kelasList.includes(m.kelas || ''));
      }
      return murid;
    },
    enabled: !!profile && !!scope,
    staleTime: 60 * 1000,
  });

  const kelasNames = (scope?.kelasList ?? []) as string[];
  const mapelNames = (scope?.mapelList ?? []) as string[];

  return {
    kelasList,
    mapelList,
    jadwalList,
    muridList,
    kelasNames,
    mapelNames,
    isAdmin,
    scope,
  };
}
