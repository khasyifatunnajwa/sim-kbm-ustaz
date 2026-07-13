import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Lembaga } from '../types';

export function useLembaga() {
  return useQuery<Lembaga[]>({
    queryKey: ['lembaga-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lembaga')
        .select('*')
        .order('nama_lembaga', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Lembaga[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLembagaKelas(lembagaId?: string) {
  return useQuery<string[]>({
    queryKey: ['lembaga-kelas', lembagaId],
    queryFn: async () => {
      let q = supabase.from('murid').select('kelas').eq('status_aktif', true);
      if (lembagaId) q = q.eq('lembaga_id', lembagaId);
      const { data, error } = await q;
      if (error) throw error;
      const kelasSet = new Set<string>();
      (data ?? []).forEach((m: any) => { if (m.kelas) kelasSet.add(m.kelas); });
      return Array.from(kelasSet).sort();
    },
    enabled: !!lembagaId || lembagaId === undefined,
    staleTime: 60 * 1000,
  });
}
