import { useEffect, useRef, useCallback } from 'react';
import type { ActiveTab } from '../types';

interface BackButtonOptions {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExitDialog: () => void;
}

export function useBackButton({ activeTab, setActiveTab, onExitDialog }: BackButtonOptions) {
  // Gunakan ref untuk state agar tidak menyebabkan re-render yang tidak perlu
  const historyRef = useRef<ActiveTab[]>(['dashboard']);
  const stateRef = useRef({ activeTab, setActiveTab, onExitDialog });
  const isNavigatingBack = useRef(false);
  const lastBackPressTime = useRef<number>(0);

  // Update ref setiap kali props berubah
  stateRef.current = { activeTab, setActiveTab, onExitDialog };

  // 1. Melacak perubahan tab oleh user untuk membangun riwayat (stack)
  useEffect(() => {
    if (isNavigatingBack.current) {
      isNavigatingBack.current = false;
      return;
    }
    const hist = historyRef.current;
    const last = hist[hist.length - 1];
    
    // Hanya tambahkan ke history jika tab berbeda dari sebelumnya
    if (activeTab !== last) {
      hist.push(activeTab);
      // Batasi history agar tidak membengkak
      if (hist.length > 30) hist.shift();
    }
  }, [activeTab]);

  // 2. Fungsi utama penanganan tombol kembali
  const handleBack = useCallback(() => {
    const { activeTab: current, setActiveTab: setTab, onExitDialog: exitDialog } = stateRef.current;
    const hist = historyRef.current;

    const now = Date.now();
    const timeSinceLastPress = now - lastBackPressTime.current;
    lastBackPressTime.current = now;

    // A. FITUR DOUBLE-TAP: Jika diketuk 2x dalam < 400ms, langsung keluar
    if (timeSinceLastPress < 400) {
      exitDialog();
      return;
    }

    // B. JIKA DI DASHBOARD: Langsung panggil konfirmasi keluar
    if (current === 'dashboard') {
      exitDialog();
      return;
    }

    // C. NAVIGASI MUNDUR: Pop history dan pindah ke tab sebelumnya
    if (hist.length > 1) {
      hist.pop(); 
      const prev = hist[hist.length - 1];
      if (prev) {
        isNavigatingBack.current = true;
        setTab(prev);
        return;
      }
    }

    // Fallback: Jika history kosong/error, paksa ke dashboard
    isNavigatingBack.current = true;
    setTab('dashboard');
  }, []);

  // 3. Listener event popstate (tombol fisik HP/Browser back)
  useEffect(() => {
    // Inisialisasi state awal
    window.history.pushState({ app: 'simkbm', depth: 0 }, '');

    const onPopState = () => {
      handleBack();
      // Selalu push state baru agar history tidak habis dan aplikasi tidak tertutup
      window.history.pushState({ app: 'simkbm', depth: 0 }, '');
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [handleBack]);

  return { handleBack };
}TROL MANUAL (Untuk tombol '< Kembali' di UI/Header aplikasi)
  const handleBack = useCallback(() => {
    window.history.back(); // Memanggil trigger native browser yang akan ditangkap oleh onPopState di atas
  }, []);

  // FUNGSI RESET (Misalnya digunakan saat pengguna Logout)
  const resetHistory = useCallback(() => {
    window.history.replaceState(null, '', '#dashboard');
  }, []);

  return { handleBack, resetHistory };
}