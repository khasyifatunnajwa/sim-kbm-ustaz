import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import { useLocalStorage } from './hooks/useLocalStorage';
import type {
  Murid, Jadwal, Absensi, BukuSakuBatas, BukuSakuTagihan,
  CatatanPerilaku, Nilai, BankSoal, CapaianHafalan, ActiveTab,
} from './types';

import JadwalPage from './pages/JadwalPage';
import MuridPage from './pages/MuridPage';
import AbsensiPage from './pages/AbsensiPage';
import BukuSakuPage from './pages/BukuSakuPage';
import HafalanPage from './pages/HafalanPage';
import PerilakuPage from './pages/PerilakuPage';
import NilaiPage from './pages/NilaiPage';
import SoalPage from './pages/SoalPage';

// Auth Screen
function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast('Akun berhasil dibuat! Silakan login.', 'success');
        setMode('login');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white">
        <div className="bg-emerald-600 p-8 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">SIM KBM Ustaz</h1>
          <p className="text-emerald-100 text-sm">Manajemen Kelas & Santri Modern</p>
        </div>
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {mode === 'login' ? 'Masuk ke Akun' : 'Buat Akun Baru'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="ustaz@madrasah.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kata Sandi</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-emerald-600 hover:text-emerald-800 text-sm font-medium transition-colors"
            >
              {mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('jadwal');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { toasts, showToast, removeToast } = useToast();

  // Data states with localStorage fallback
  const [muridList, setMuridList] = useLocalStorage<Murid[]>('simbkm_murid', []);
  const [jadwalList, setJadwalList] = useLocalStorage<Jadwal[]>('simbkm_jadwal', []);
  const [absensiList, setAbsensiList] = useLocalStorage<Absensi[]>('simbkm_absensi', []);
  const [batasList, setBatasList] = useLocalStorage<BukuSakuBatas[]>('simbkm_batas', []);
  const [tagihanList, setTagihanList] = useLocalStorage<BukuSakuTagihan[]>('simbkm_tagihan', []);
  const [perilakuList, setPerilakuList] = useLocalStorage<CatatanPerilaku[]>('simbkm_perilaku', []);
  const [nilaiList, setNilaiList] = useLocalStorage<Nilai[]>('simbkm_nilai', []);
  const [soalList, setSoalList] = useLocalStorage<BankSoal[]>('simbkm_soal', []);
  const [capaianList, setCapaianList] = useLocalStorage<CapaianHafalan[]>('simbkm_capaian', []);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Online/offline
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Back button handling
  useEffect(() => {
    const handleBack = (e: PopStateEvent) => {
      if (activeTab !== 'jadwal') {
        e.preventDefault();
        setActiveTab('jadwal');
        window.history.pushState(null, '', window.location.pathname);
      }
    };
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [activeTab]);

  // Sync all data from cloud
  const syncData = useCallback(async () => {
    if (!user || isOffline) return;
    setLoading(true);
    try {
      const [muridRes, jadwalRes, absenRes, batasRes, tagihanRes, perilakuRes, nilaiRes, soalRes, capaianRes] = await Promise.all([
        supabase.from('murid').select('*').order('nama', { ascending: true }),
        supabase.from('jadwal_mengajar').select('*').order('jam_mulai', { ascending: true }),
        supabase.from('absensi').select('*').order('tanggal', { ascending: false }),
        supabase.from('buku_saku_batas').select('*').order('created_at', { ascending: false }),
        supabase.from('buku_saku_tagihan').select('*').order('tanggal', { ascending: true }),
        supabase.from('catatan_perilaku').select('*').order('created_at', { ascending: false }),
        supabase.from('nilai').select('*').order('created_at', { ascending: false }),
        supabase.from('bank_soal').select('*').order('created_at', { ascending: false }),
        supabase.from('capaian_hafalan').select('*').order('created_at', { ascending: false }),
      ]);

      if (muridRes.data) setMuridList(muridRes.data);
      if (jadwalRes.data) setJadwalList(jadwalRes.data);
      if (absenRes.data) setAbsensiList(absenRes.data);
      if (batasRes.data) setBatasList(batasRes.data);
      if (tagihanRes.data) setTagihanList(tagihanRes.data);
      if (perilakuRes.data) setPerilakuList(perilakuRes.data);
      if (nilaiRes.data) setNilaiList(nilaiRes.data);
      if (soalRes.data) setSoalList(soalRes.data);
      if (capaianRes.data) setCapaianList(capaianRes.data);

      showToast('Data berhasil disinkronkan!', 'success');
    } catch (err) {
      showToast('Gagal sinkronisasi data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, isOffline]);

  useEffect(() => {
    if (user && !isOffline) syncData();
  }, [user, isOffline, syncData]);

  // Helper: sync to cloud
  const syncToCloud = async (table: string, data: any) => {
    if (!user || isOffline) return;
    try {
      await supabase.from(table).insert(data);
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  // CRUD operations
  const addMurid = async (murid: Omit<Murid, 'id' | 'user_id' | 'created_at'>) => {
    const newMurid = { ...murid, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setMuridList(prev => [...prev, newMurid]);
    await syncToCloud('murid', [newMurid]);
    showToast('Santri berhasil ditambahkan!', 'success');
  };

  const updateMurid = async (id: string, data: Partial<Murid>) => {
    setMuridList(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    if (!isOffline) await supabase.from('murid').update(data).eq('id', id);
    showToast('Data santri diperbarui!', 'success');
  };

  const deleteMurid = async (id: string) => {
    setMuridList(prev => prev.filter(m => m.id !== id));
    if (!isOffline) await supabase.from('murid').delete().eq('id', id);
    showToast('Santri dihapus', 'info');
  };

  const addJadwal = async (jadwal: Omit<Jadwal, 'id' | 'user_id' | 'created_at'>) => {
    const newJadwal = { ...jadwal, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setJadwalList(prev => [...prev, newJadwal]);
    await syncToCloud('jadwal_mengajar', [newJadwal]);
    showToast('Jadwal ditambahkan!', 'success');
  };

  const updateJadwal = async (id: string, data: Partial<Jadwal>) => {
    setJadwalList(prev => prev.map(j => j.id === id ? { ...j, ...data } : j));
    if (!isOffline) await supabase.from('jadwal_mengajar').update(data).eq('id', id);
    showToast('Jadwal diperbarui!', 'success');
  };

  const deleteJadwal = async (id: string) => {
    setJadwalList(prev => prev.filter(j => j.id !== id));
    if (!isOffline) await supabase.from('jadwal_mengajar').delete().eq('id', id);
    showToast('Jadwal dihapus', 'info');
  };

  const saveBatchAbsen = async (records: { murid_id: string; status: Absensi['status'] }[]) => {
    const tanggal = new Date().toISOString().split('T')[0];
    const newRecords = records.map(r => ({
      ...r,
      id: crypto.randomUUID(),
      tanggal,
      created_at: new Date().toISOString(),
    }));

    // Remove existing for today
    setAbsensiList(prev => {
      const filtered = prev.filter(a => a.tanggal !== tanggal);
      return [...newRecords, ...filtered];
    });

    if (!isOffline) {
      const muridIds = records.map(r => r.murid_id);
      await supabase.from('absensi').delete().eq('tanggal', tanggal).in('murid_id', muridIds);
      await supabase.from('absensi').insert(newRecords);
    }
  };

  const addBatas = async (batas: Omit<BukuSakuBatas, 'id' | 'user_id' | 'created_at'>) => {
    const newBatas = { ...batas, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setBatasList(prev => [newBatas, ...prev]);
    await syncToCloud('buku_saku_batas', [newBatas]);
    showToast('Batasan ditambahkan!', 'success');
  };

  const deleteBatas = async (id: string) => {
    setBatasList(prev => prev.filter(b => b.id !== id));
    if (!isOffline) await supabase.from('buku_saku_batas').delete().eq('id', id);
    showToast('Batasan dihapus', 'info');
  };

  const addTagihan = async (tagihan: Omit<BukuSakuTagihan, 'id' | 'user_id' | 'created_at'>) => {
    const newTagihan = { ...tagihan, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setTagihanList(prev => [newTagihan, ...prev]);
    await syncToCloud('buku_saku_tagihan', [newTagihan]);
    showToast('Tagihan ditambahkan!', 'success');
  };

  const deleteTagihan = async (id: string) => {
    setTagihanList(prev => prev.filter(t => t.id !== id));
    if (!isOffline) await supabase.from('buku_saku_tagihan').delete().eq('id', id);
    showToast('Tagihan dihapus', 'info');
  };

  const addCapaian = async (capaian: Omit<CapaianHafalan, 'id' | 'user_id' | 'created_at'>) => {
    const newCapaian = { ...capaian, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setCapaianList(prev => [newCapaian, ...prev]);
    await syncToCloud('capaian_hafalan', [newCapaian]);
    showToast('Capaian ditambahkan!', 'success');
  };

  const deleteCapaian = async (id: string) => {
    setCapaianList(prev => prev.filter(c => c.id !== id));
    if (!isOffline) await supabase.from('capaian_hafalan').delete().eq('id', id);
    showToast('Capaian dihapus', 'info');
  };

  const addPerilaku = async (perilaku: Omit<CatatanPerilaku, 'id' | 'user_id' | 'created_at'>) => {
    const newPerilaku = { ...perilaku, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setPerilakuList(prev => [newPerilaku, ...prev]);
    await syncToCloud('catatan_perilaku', [newPerilaku]);
    showToast('Catatan perilaku ditambahkan!', 'success');
  };

  const deletePerilaku = async (id: string) => {
    setPerilakuList(prev => prev.filter(p => p.id !== id));
    if (!isOffline) await supabase.from('catatan_perilaku').delete().eq('id', id);
    showToast('Catatan dihapus', 'info');
  };

  const saveNilai = async (nilai: Omit<Nilai, 'id' | 'user_id' | 'created_at'>) => {
    // Check if exists
    const existing = nilaiList.find(n =>
      n.murid_id === nilai.murid_id &&
      n.pelajaran.toLowerCase() === nilai.pelajaran.toLowerCase() &&
      n.jenis_ujian === nilai.jenis_ujian
    );

    if (existing) {
      setNilaiList(prev => prev.map(n =>
        n.id === existing.id ? { ...n, skor: nilai.skor } : n
      ));
      if (!isOffline) await supabase.from('nilai').update({ skor: nilai.skor }).eq('id', existing.id);
    } else {
      const newNilai = { ...nilai, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      setNilaiList(prev => [newNilai, ...prev]);
      await syncToCloud('nilai', [newNilai]);
    }
  };

  const addSoal = async (soal: Omit<BankSoal, 'id' | 'user_id' | 'created_at'>) => {
    const newSoal = { ...soal, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setSoalList(prev => [newSoal, ...prev]);
    await syncToCloud('bank_soal', [newSoal]);
    showToast('Soal ditambahkan!', 'success');
  };

  const updateSoal = async (id: string, data: Partial<BankSoal>) => {
    setSoalList(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    if (!isOffline) await supabase.from('bank_soal').update(data).eq('id', id);
    showToast('Soal diperbarui!', 'success');
  };

  const deleteSoal = async (id: string) => {
    setSoalList(prev => prev.filter(s => s.id !== id));
    if (!isOffline) await supabase.from('bank_soal').delete().eq('id', id);
    showToast('Soal dihapus', 'info');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!user) {
    return <AuthScreen onLogin={() => {}} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'jadwal':
        return (
          <JadwalPage
            jadwalList={jadwalList}
            onAdd={addJadwal}
            onUpdate={updateJadwal}
            onDelete={deleteJadwal}
            onSync={syncData}
          />
        );
      case 'murid':
        return (
          <MuridPage
            muridList={muridList}
            onAdd={addMurid}
            onUpdate={updateMurid}
            onDelete={deleteMurid}
          />
        );
      case 'absensi':
        return (
          <AbsensiPage
            muridList={muridList}
            absensiList={absensiList}
            onSaveAbsen={() => {}}
            onSaveBatch={saveBatchAbsen}
          />
        );
      case 'bukusaku':
        return (
          <BukuSakuPage
            muridList={muridList}
            batasList={batasList}
            tagihanList={tagihanList}
            onAddBatas={addBatas}
            onDeleteBatas={deleteBatas}
            onAddTagihan={addTagihan}
            onDeleteTagihan={deleteTagihan}
          />
        );
      case 'hafalan':
        return (
          <HafalanPage
            muridList={muridList}
            capaianList={capaianList}
            onAddCapaian={addCapaian}
            onDeleteCapaian={deleteCapaian}
          />
        );
      case 'perilaku':
        return (
          <PerilakuPage
            muridList={muridList}
            perilakuList={perilakuList}
            onAddPerilaku={addPerilaku}
            onDeletePerilaku={deletePerilaku}
          />
        );
      case 'nilai':
        return (
          <NilaiPage
            muridList={muridList}
            nilaiList={nilaiList}
            absensiList={absensiList}
            perilakuList={perilakuList}
            capaianList={capaianList}
            onSaveNilai={saveNilai}
          />
        );
      case 'soal':
        return (
          <SoalPage
            soalList={soalList}
            onAddSoal={addSoal}
            onUpdateSoal={updateSoal}
            onDeleteSoal={deleteSoal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={user?.email}
        onLogout={handleLogout}
        onSync={syncData}
        isOffline={isOffline}
        isSyncing={loading}
      >
        {renderContent()}
      </Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
