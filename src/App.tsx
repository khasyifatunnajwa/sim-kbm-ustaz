import { useState, useEffect, useRef } from 'react';
import { BookOpen, Loader2, Shield, AlertCircle, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';
import Modal from './components/Modal';
import { useToast } from './hooks/useToast';
import { useBackButton } from './hooks/useBackButton';
import type { ActiveTab, ShowToast, Profile } from './types';

import DashboardPage from './pages/DashboardPage';
import JadwalPage from './pages/JadwalPage';
import MuridPage from './pages/MuridPage';
import AbsensiPage from './pages/AbsensiPage';
import JurnalPage from './pages/JurnalPage';
import NilaiPage from './pages/NilaiPage';
import SikapPage from './pages/SikapPage';
import CatatanPage from './pages/CatatanPage';
import SoalPage from './pages/SoalPage';
import IzinPage from './pages/IzinPage';
import RaporPage from './pages/RaporPage';
import AdminPage from './pages/AdminPage';
import AdminPengumumanPage from './pages/AdminPengumumanPage';
import ProfilPage from './pages/ProfilPage';
import AuthPage from './pages/AuthPage'; // Dipastikan mengarah ke halaman autentikasi Anda

const SUPABASE_URL = 'https://intkcrhsinezswldmokr.supabase.co';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-9 h-9 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-emerald-700 animate-pulse">Memuat data sistem...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  const { toasts, showToast, removeToast } = useToast();
  
  // Custom hook penanganan tombol kembali di Android / PWA
  useBackButton(() => {
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    } else {
      setShowExitDialog(true);
    }
  });

  useEffect(() => {
    // Ambil sesi login saat pertama aplikasi dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Ambil update status auth secara real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Mengambil seluruh kolom profiles termasuk id_login, nama_panggilan, & updated_at
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error memuat profil:', error.message);
      showToast('Gagal memuat profil pengguna terbaru', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setActiveTab('dashboard');
      showToast('Berhasil keluar dari aplikasi', 'success');
    } catch (error: any) {
      showToast('Gagal keluar dari sesi aplikasi', 'error');
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthPage showToast={showToast} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage profile={profile} showToast={showToast} setActiveTab={setActiveTab} />;
      case 'jadwal': return <JadwalPage profile={profile} showToast={showToast} />;
      case 'murid': return <MuridPage profile={profile} showToast={showToast} />;
      case 'absensi': return <AbsensiPage profile={profile} showToast={showToast} />;
      case 'jurnal': return <JurnalPage profile={profile} showToast={showToast} />;
      case 'nilai': return <NilaiPage profile={profile} showToast={showToast} />;
      case 'sikap': return <SikapPage profile={profile} showToast={showToast} />;
      case 'catatan': return <CatatanPage profile={profile} showToast={showToast} />;
      case 'soal': return <SoalPage profile={profile} showToast={showToast} />;
      case 'izin': return <IzinPage profile={profile} showToast={showToast} />;
      case 'rapor': return <RaporPage profile={profile} showToast={showToast} />;
      case 'admin': return <AdminPage profile={profile} showToast={showToast} setActiveTab={setActiveTab} />;
      case 'pengumuman': return <AdminPengumumanPage showToast={showToast} />;
      case 'profil': return <ProfilPage showToast={showToast} profile={profile} setProfile={setProfile} />;
      default: return null;
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        profile={profile}
        onLogout={() => setShowExitDialog(true)}
      >
        {renderPage()}
      </Layout>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Dialog Konfirmasi Keluar */}
      <Modal
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        title="Keluar Aplikasi"
        size="sm"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2 rounded-xl bg-amber-50">
            <LogOut className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">Apakah Anda yakin ingin keluar dari aplikasi?</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setShowExitDialog(false)} className="btn-secondary text-sm">Batal</button>
          <button
            onClick={() => {
              setShowExitDialog(false);
              handleLogout();
            }}
            className="text-sm px-5 py-2.5 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all active:scale-95"
          >
            Keluar
          </button>
        </div>
      </Modal>
    </>
  );
}
