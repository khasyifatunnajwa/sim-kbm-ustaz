import { useEffect, useRef, useCallback } from 'react';
import type { ActiveTab } from '../types';

interface BackButtonOptions {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExitDialog: () => void;
}

export function useBackButton({ activeTab, setActiveTab, onExitDialog }: BackButtonOptions) {
  const stateRef = useRef({ activeTab, setActiveTab, onExitDialog });
  const lastBackPressTime = useRef<number>(0);

  // Selalu perbarui ref agar event listener selalu membaca state terbaru
  stateRef.current = { activeTab, setActiveTab, onExitDialog };

  // 1. SINKRONISASI AWAL (Saat PWA di-refresh atau dibuka pertama kali)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const mainTab = hash.split('/')[0];
    
    if (mainTab && mainTab !== activeTab) {
      setActiveTab(mainTab as ActiveTab);
    } else if (!hash) {
      window.history.replaceState(null, '', '#dashboard');
    }
  }, []);

  // 2. PEREKAM RIWAYAT OTOMATIS (Saat pindah menu via Sidebar/Klik)
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '').split('/')[0];
    // Jika tab aktif tidak sama dengan URL saat ini, dorong riwayat baru ke browser
    if (currentHash !== activeTab) {
      window.history.pushState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  // 3. PENANGKAP TOMBOL KEMBALI HP (Mendeteksi native back)
  useEffect(() => {
    const onPopState = () => {
      const { activeTab: current, setActiveTab: setTab, onExitDialog: exitDialog } = stateRef.current;
      
      // Kalkulasi selisih waktu antar-ketukan tombol kembali (Untuk Double-tap)
      const now = Date.now();
      const timeSinceLastPress = now - lastBackPressTime.current;
      lastBackPressTime.current = now;

      // Ambil riwayat URL sebelumnya yang dituju oleh browser
      const rawHash = window.location.hash.replace('#', '');
      const mainTab = rawHash.split('/')[0] || 'dashboard';

      // FITUR DOUBLE-TAP: Jika diketuk 2x cepat (< 400ms), langsung panggil dialog keluar
      if (timeSinceLastPress < 400) {
        // Rem darurat: Kembalikan URL seperti semula agar PWA tidak terlempar keluar
        window.history.pushState(null, '', `#${current}`);
        exitDialog();
        return;
      }

      // FITUR KONFIRMASI DASBOR: Jika sedang di dasbor dan ditekan 1x (mundur dari dasbor)
      if (current === 'dashboard') {
        // Tahan pengguna agar tidak keluar, kembalikan hash dasbor
        window.history.pushState(null, '', '#dashboard');
        exitDialog();
        return;
      }

      // FITUR HISTORY BERURUTAN: Mundur ke menu sebelumnya sesuai riwayat URL browser
      setTab(mainTab as ActiveTab);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // FUNGSI KONTROL MANUAL (Untuk tombol '< Kembali' di UI/Header aplikasi)
  const handleBack = useCallback(() => {
    window.history.back(); // Memanggil trigger native browser yang akan ditangkap oleh onPopState di atas
  }, []);

  // FUNGSI RESET (Misalnya digunakan saat pengguna Logout)
  const resetHistory = useCallback(() => {
    window.history.replaceState(null, '', '#dashboard');
  }, []);

  return { handleBack, resetHistory };
}
