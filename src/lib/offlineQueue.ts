import * as idbKeyval from 'idb-keyval';

const OFFLINE_QUEUE_KEY = 'offline-mutation-queue';
const MAX_RETRIES = 5;

export interface QueuedMutation {
  id: string;
  timestamp: number;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data?: Record<string, unknown>;
  filter?: { column: string; value: unknown; operator?: 'eq' | 'neq' | 'in' };
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

type MutationListener = () => void;
const listeners: Set<MutationListener> = new Set();

export function subscribeToMutations(listener: MutationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(l => l());
}

export async function getQueue(): Promise<QueuedMutation[]> {
  try {
    const queue = await idbKeyval.get<QueuedMutation[]>(OFFLINE_QUEUE_KEY);
    return queue || [];
  } catch {
    return [];
  }
}

export async function addToQueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<QueuedMutation> {
  const queue = await getQueue();
  const newMutation: QueuedMutation = {
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };
  queue.push(newMutation);
  await idbKeyval.set(OFFLINE_QUEUE_KEY, queue);
  notifyListeners();
  return newMutation;
}

export async function updateMutationStatus(id: string, status: QueuedMutation['status']): Promise<void> {
  const queue = await getQueue();
  const index = queue.findIndex(m => m.id === id);
  if (index !== -1) {
    queue[index].status = status;
    await idbKeyval.set(OFFLINE_QUEUE_KEY, queue);
    notifyListeners();
  }
}

export async function removeMutation(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter(m => m.id !== id);
  await idbKeyval.set(OFFLINE_QUEUE_KEY, filtered);
  notifyListeners();
}

export async function clearQueue(): Promise<void> {
  await idbKeyval.set(OFFLINE_QUEUE_KEY, []);
  notifyListeners();
}

export function isOnline(): boolean {
  return navigator.onLine;
}

async function processMutation(mutation: QueuedMutation, supabase: any): Promise<boolean> {
  const { type, table, data, filter } = mutation;
  let query = supabase.from(table);
  let result;

  switch (type) {
    case 'insert':
      result = await query.insert(data);
      break;
    case 'update':
      if (!filter) return false;
      query = query.update(data);
      if (filter.operator === 'in') {
        query = query.in(filter.column, filter.value as unknown[]);
      } else if (filter.operator === 'neq') {
        query = query.neq(filter.column, filter.value);
      } else {
        query = query.eq(filter.column, filter.value);
      }
      result = await query;
      break;
    case 'delete':
      if (!filter) return false;
      query = query.delete();
      if (filter.operator === 'in') {
        query = query.in(filter.column, filter.value as unknown[]);
      } else if (filter.operator === 'neq') {
        query = query.neq(filter.column, filter.value);
      } else {
        query = query.eq(filter.column, filter.value);
      }
      result = await query;
      break;
    default:
      return false;
  }

  return !result.error;
}

export async function syncQueue(supabase: any, showToast?: (msg: string, type: 'success' | 'error' | 'info') => void): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) {
    return { synced: 0, failed: 0 };
  }

  const queue = await getQueue();
  const pending = queue.filter(m => m.status === 'pending' || (m.status === 'failed' && m.retryCount < MAX_RETRIES));

  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  if (showToast && pending.length > 0) {
    showToast(`Menyinkronkan ${pending.length} data tersimpan...`, 'info');
  }

  for (const mutation of pending) {
    await updateMutationStatus(mutation.id, 'syncing');
    const success = await processMutation(mutation, supabase);

    if (success) {
      await removeMutation(mutation.id);
      synced++;
    } else {
      const queueNow = await getQueue();
      const index = queueNow.findIndex(m => m.id === mutation.id);
      if (index !== -1) {
        queueNow[index].status = 'failed';
        queueNow[index].retryCount++;
        await idbKeyval.set(OFFLINE_QUEUE_KEY, queueNow);
      }
      failed++;
    }
  }

  if (showToast) {
    if (synced > 0 && failed === 0) {
      showToast(`${synced} data berhasil disinkronkan`, 'success');
    } else if (synced > 0 && failed > 0) {
      showToast(`${synced} berhasil, ${failed} gagal disinkronkan`, 'error');
    } else if (failed > 0) {
      showToast(`${failed} data gagal disinkronkan. Akan coba lagi nanti.`, 'error');
    }
  }

  notifyListeners();
  return { synced, failed };
}

export function initOfflineSync(supabase: any, showToast?: (msg: string, type: 'success' | 'error' | 'info') => void): () => void {
  const handleOnline = () => {
    console.log('[OfflineQueue] Koneksi kembali, menyinkronkan...');
    syncQueue(supabase, showToast);
  };

  window.addEventListener('online', handleOnline);

  // Sync on init if online
  if (isOnline()) {
    syncQueue(supabase, showToast);
  }

  // Periodic check every 30 seconds
  const interval = setInterval(() => {
    if (isOnline()) {
      syncQueue(supabase);
    }
  }, 30000);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(interval);
  };
}

// Utility to check if operation should be queued (offline) or executed directly
export function shouldQueueOffline(): boolean {
  return !navigator.onLine;
}
