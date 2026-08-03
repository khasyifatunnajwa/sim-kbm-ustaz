import { useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  addToQueue,
  getQueue,
  syncQueue,
  initOfflineSync,
  subscribeToMutations,
  isOnline,
  type QueuedMutation,
} from '../lib/offlineQueue';
import { useStore } from '../store/useStore';

type ShowToast = (message: string, type: 'success' | 'error' | 'info') => void;

export function useOfflineQueue() {
  const { pendingSyncCount, setPendingSyncCount, setOnline } = useStore();

  useEffect(() => {
    const updateCount = async () => {
      const queue = await getQueue();
      setPendingSyncCount(queue.filter(m => m.status === 'pending' || m.status === 'failed').length);
    };
    updateCount();

    const unsubscribe = subscribeToMutations(updateCount);
    return unsubscribe;
  }, [setPendingSyncCount]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOnline(isOnline());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return { pendingSyncCount };
}

export function useOfflineMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: any }>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: string, variables: TVariables) => void;
    queueOfflineOp?: (variables: TVariables) => Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount' | 'status'> | null;
    invalidateKeys?: unknown[][];
  }
) {
  const queryClient = useQueryClient();
  const { setPendingSyncCount } = useStore();

  const mutation = useMutation({
    mutationFn: async (variables: TVariables) => {
      const result = await mutationFn(variables);
      if (result.error) {
        throw new Error(result.error.message || 'Operation failed');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      options?.onSuccess?.(data as TData, variables);
    },
    onError: (error, variables) => {
      if (isOnline()) {
        options?.onError?.((error as Error).message, variables);
      }
    },
    networkMode: 'offlineFirst',
  });

  const mutateOfflineFirst = useCallback(
    async (variables: TVariables) => {
      if (isOnline()) {
        return mutation.mutateAsync(variables);
      } else {
        if (options?.queueOfflineOp) {
          const queuedOp = options.queueOfflineOp(variables);
          if (queuedOp) {
            await addToQueue(queuedOp);
            const queue = await getQueue();
            setPendingSyncCount(queue.filter(m => m.status === 'pending').length);
            const mockData = { offline: true, queued: true } as unknown as TData;
            options.onSuccess?.(mockData, variables);
            return mockData;
          }
        }
        throw new Error('Offline: operation queued for sync');
      }
    },
    [mutation, options, setPendingSyncCount]
  );

  return {
    ...mutation,
    mutateOfflineFirst,
  };
}

export function initOfflineSyncWithToast(showToast: ShowToast) {
  return initOfflineSync(supabase, showToast);
}

export function isOfflineMode(): boolean {
  return !navigator.onLine;
}

export function getConnectivityStatus(): { online: boolean; status: string } {
  const online = navigator.onLine;
  return {
    online,
    status: online ? 'online' : 'offline',
  };
}
