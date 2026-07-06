import { useEffect, useRef, useCallback } from 'react';
import type { ActiveTab } from '../types';

interface BackButtonOptions {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExitDialog: () => void;
}

export function useBackButton({ activeTab, setActiveTab, onExitDialog }: BackButtonOptions) {
  const historyRef = useRef<ActiveTab[]>(['dashboard']);
  const stateRef = useRef({ activeTab, setActiveTab, onExitDialog });
  const isNavigatingBack = useRef(false);
  const lastBackPressTime = useRef<number>(0);

  // Selalu sinkronkan state terbaru ke dalam ref
  stateRef.current = { activeTab, setActiveTab, onExitDialog };

  // 1. Melacak perubahan tab secara manual untuk membangun riwayat tumpukan halaman
  useEffect(() => {
    if (isNavigatingBack.current) {
      isNavigatingBack.current = false;
      return;
    }
    const hist = historyRef.current;
    const last = hist[hist.length - 1];
    
    if (activeTab !== last) {
      hist.push(activeTab);
      if (hist.length > 30) hist.shift(); // Batasi riwayat agar tidak membebani memori
    }
  }, [activeTab]);

  // 2. Fungsi utama penanganan tombol kembali (Fisik & UI)
  const handleBack = useCallback(() => {
    const { activeTab: current, setActiveTab: setTab, onExitDialog: exitDialog } = stateRef.current;
    const hist = historyRef.current;

    const now = Date.now();
    const timeSinceLastPress = now - lastBackPressTime.current;
    lastBackPressTime.current = now;

    // A. FITUR DOUBLE-TAP: Jika diketuk 2x cepat (< 400ms), langsung panggil dialog keluar
    if (timeSinceLastPress < 400) {
      exitDialog();
      return;
    }

    // B. FITUR KONFIRMASI DASBOR: Jika sedang di dasbor, panggil dialog keluar
    if (current === 'dashboard') {
      exitDialog();
      return;
    }

    // C. FITUR HISTORY BERURUTAN: Mundur ke menu sebelumnya
    if (hist.length > 1) {
      hist.pop(); // Buang halaman saat ini
      const prev = hist[hist.length - 1];
      if (prev && prev !== current) {
        isNavigatingBack.current = true;
        setTab(prev);
        return;
      }
    }

    // Fallback jika tumpukan kosong namun tidak di dasbor
    if (current !== 'dashboard') {
      isNavigatingBack.current = true;
      setTab('dashboard');
    } else {
      exitDialog();
    }
  }, []);

  // 3. Listener event popstate (Menangkap tombol fisik HP / Browser Back)
  useEffect(() => {
    window.history.pushState({ app: 'simkbm', depth: 0 }, '');

    const onPopState = () => {
      handleBack();
      window.history.pushState({ app: 'simkbm', depth: 0 }, '');
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [handleBack]);

  // 4. Fungsi tambahan untuk reset riwayat jika diperlukan
  const resetHistory = useCallback(() => {
    historyRef.current = ['dashboard'];
  }, []);

  return { handleBack, resetHistory };
}
