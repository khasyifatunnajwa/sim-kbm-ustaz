import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRealtimePengumuman() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('pengumuman-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pengumuman' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pengumuman-list'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agenda_penting' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['agenda-list'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useRealtimeTable(table: string, queryKey: string[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${queryKey.join('-')}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, table, queryKey]);
}
