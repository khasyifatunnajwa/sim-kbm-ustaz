import { get, set } from 'idb-keyval';

export async function readOfflinePageCache<T>(key: string): Promise<T | null> {
  try {
    return (await get<T>(key)) ?? null;
  } catch {
    return null;
  }
}

export async function writeOfflinePageCache<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value);
  } catch (error) {
    console.warn('Cache offline tidak dapat disimpan:', error);
  }
}
