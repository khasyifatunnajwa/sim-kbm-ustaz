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
  
  // Penambahan penghitung waktu untuk deteksi double-tap
  const lastBackPressTime = useRef<number>(0);

  stateRef.current = { activeTab, setActiveTab, onExitDialog };

  useEffect(() => {
    if (isNavigatingBack.current) {
      isNavigatingBack.current = false;
      return;
    }
    const hist = historyRef.current;
    const last = hist[hist.length - 1];
    
    if (activeTab !== last) {
      hist.push(activeTab);
      if (hist.length > 30) hist.shift();
    }
  }, [activeTab]);

  const handleBack = useCallback(() => {
    const { activeTab: current, setActiveTab: setTab, onExitDialog: exitDialog } = stateRef.current;
    const hist = historyRef.current;

    // Kalkulasi selisih waktu antar-ketukan tombol kembali
    const now = Date.now();
    const timeSinceLastPress = now - lastBackPressTime.current;
    lastBackPressTime.current = now;

    // FITUR DOUBLE-TAP: Jika diketuk 2x cepat (< 400ms), langsung panggil dialog keluar
    if (timeSinceLastPress < 400) {
      exitDialog();
      return;
    }

    // FITUR KONFIRMASI DASBOR: Jika sedang di dasbor dan ditekan 1x, panggil dialog keluar
    if (current === 'dashboard') {
      exitDialog();
      return;
    }

    // FITUR HISTORY BERURUTAN: Mundur ke menu sebelumnya (bukan ke dasbor)
    if (hist.length > 1) {
      hist.pop(); 
      const prev = hist[hist.length - 1];
      if (prev && prev !== current) {
        isNavigatingBack.current = true;
        setTab(prev);
        return;
      }
    }

    // Fallback/jaring pengaman
    if (current !== 'dashboard') {
      isNavigatingBack.current = true;
      setTab('dashboard');
    } else {
      exitDialog();
    }
  }, []);

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

  const resetHistory = useCallback(() => {
    historyRef.current = ['dashboard'];
  }, []);

  return { handleBack, resetHistory };
}
