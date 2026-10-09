import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CheckCircle, Upload, Loader2 } from 'lucide-react';
import { getQueue, syncQueue, initOfflineSync, subscribeToMutations, isOnline } from '../lib/offlineQueue';
import { supabase } from '../lib/supabase';
import type { ShowToast } from '../types';

interface OfflineSyncIndicatorProps {
  showToast: ShowToast;
}

/**
 * OfflineSyncIndicator — shows network status and offline queue state.
 * Displays a banner when offline, and auto-syncs queued data when back online.
 * Also shows a floating badge with pending item count.
 */
export default function OfflineSyncIndicator({ showToast }: OfflineSyncIndicatorProps) {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize offline sync + subscribe to queue changes
  useEffect(() => {
    const updateCount = async () => {
      const queue = await getQueue();
      setPendingCount(queue.filter(m => m.status === 'pending' || m.status === 'failed').length);
    };

    updateCount();
    const unsub = subscribeToMutations(updateCount);

    const cleanupSync = initOfflineSync(supabase, showToast);

    return () => {
      unsub();
      cleanupSync();
    };
  }, [showToast]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (online && pendingCount > 0) {
      setSyncing(true);
      syncQueue(supabase, showToast).then(() => {
        setSyncing(false);
      });
    }
  }, [online, pendingCount, showToast]);

  const handleManualSync = async () => {
    if (!isOnline()) {
      showToast('Tidak ada koneksi internet', 'error');
      return;
    }
    setSyncing(true);
    await syncQueue(supabase, showToast);
    setSyncing(false);
  };

  return (
    <>
      {/* Offline Banner */}
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[54] px-4"
          >
            <div className="bg-slate-800 dark:bg-slate-700 text-white rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 text-rose-300 flex-shrink-0" />
              <span className="text-xs font-semibold">Mode Offline — data disimpan lokal</span>
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingCount} menunggu
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Status Floating Badge (bottom-right, above bottom nav) */}
      <AnimatePresence>
        {(pendingCount > 0 || syncing) && online && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-20 md:bottom-4 right-3 z-[54]"
          >
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl px-3.5 py-2.5 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold">Menyinkronkan...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span className="text-xs font-bold">{pendingCount} data siap sync</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Synced success indicator (brief flash) */}
      <AnimatePresence>
        {online && pendingCount === 0 && !syncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-20 md:bottom-4 right-3 z-[53] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl px-3 py-2 shadow-lg flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">Tersinkron</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
