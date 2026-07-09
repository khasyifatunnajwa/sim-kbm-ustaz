import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Save, Loader2, Copy, CheckCircle2, Hash, Clock, Download, Smartphone, Share } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { Profile, ShowToast } from '../types';

interface ProfilPageProps {
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  showToast: ShowToast;
}

export default function ProfilPage({ profile, setProfile, showToast }: ProfilPageProps) {
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [alamat, setAlamat] = useState('');
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch data setiap buka halaman
  useEffect(() => {
    const loadProfileData = async () => {
      setInitialLoading(true);
      if (profile) {
        setNamaLengkap(profile.nama_lengkap || '');
        setNomorWhatsapp(profile.nomor_whatsapp || '');
        setAlamat(profile.alamat || '');
      }
      // Simulasi delay singkat agar animasi skeleton terasa native
      setTimeout(() => setInitialLoading(false), 400);
    };
    loadProfileData();
  }, [profile]);

  const handleCopyIdLogin = () => {
    if (!profile?.id_login) return;
    navigator.clipboard.writeText(profile.id_login);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('ID Login berhasil disalin ke clipboard', 'success');
  };

  const calculateProgress = () => {
    let score = 0;
    // 5 Indikator kelengkapan (masing-masing bernilai 20%)
    if (profile?.id_login) score += 20;
    if (namaLengkap) score += 20;
    if (profile?.nama_panggilan) score += 20;
    if (nomorWhatsapp) score += 20;
    if (alamat) score += 20;
    return Math.floor(score);
  };

  const handleWAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hanya perbolehkan karakter angka
    const val = e.target.value.replace(/\D/g, '');
    setNomorWhatsapp(val);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    // Validasi No HP (jika diisi, harus mulai dari 08 atau 62)
    if (nomorWhatsapp && !(nomorWhatsapp.startsWith('08') || nomorWhatsapp.startsWith('62'))) {
      showToast('Nomor WhatsApp harus diawali 08 atau 62', 'error');
      return;
    }

    setSaving(true);
    const currentTime = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nama_lengkap: namaLengkap,
          nomor_whatsapp: nomorWhatsapp,
          alamat: alamat,
          updated_at: currentTime
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      // Update global state sehingga komponen lain re-render otomatis
      setProfile((prev) => prev ? { 
        ...prev, 
        nama_lengkap: namaLengkap, 
        nomor_whatsapp: nomorWhatsapp,
        alamat: alamat,
        updated_at: currentTime
      } : prev);
      
      showToast('Profil berhasil diperbarui', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal menyimpan profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date) + ' WIB';
  };

  const progress = calculateProgress();

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="card p-4 animate-pulse flex items-center justify-between">
          <div className="h-3 skeleton rounded w-1/3" />
          <div className="h-5 skeleton rounded-full w-12" />
        </div>
        <div className="card p-5 space-y-4 animate-pulse">
          <div className="h-9 skeleton rounded-xl" />
          <div className="h-9 skeleton rounded-xl" />
          <div className="h-20 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Progress Card */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Kelengkapan Profil</p>
          <span className={`badge ${progress === 100 ? 'badge-success' : 'badge-warning'}`}>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className={`progress-fill ${progress === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {progress === 100 ? 'Profil Anda sudah lengkap.' : 'Lengkapi data Anda agar informasi lebih akurat.'}
        </p>
      </div>

      {/* Form Edit */}
      <form onSubmit={handleSave} className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md icon-box-emerald"><User className="w-5 h-5" /></div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Informasi Dasar</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Perbarui data diri Anda</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Read Only info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">ID Login Akun</label>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1.5 rounded-lg truncate flex-1 font-mono">
                  {profile?.id_login || '-'}
                </code>
                <button
                  type="button"
                  onClick={handleCopyIdLogin}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                  title="Salin ID Login"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Terakhir Update</label>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">
                  {formatDateTime(profile?.updated_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-slate-400" /></div>
                <input type="text" value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)}
                  className="input-field pl-10" placeholder="Nama lengkap Anda" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Panggilan <span className="text-slate-400 font-normal">(tidak dapat diubah)</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Hash className="h-4 w-4 text-slate-400" /></div>
                <input type="text" value={profile?.nama_panggilan || ''} disabled
                  className="input-field pl-10 opacity-60 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nomor WhatsApp</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-slate-400" /></div>
                <input type="tel" value={nomorWhatsapp} onChange={handleWAChange}
                  className="input-field pl-10" placeholder="Contoh: 081234567890" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Alamat Lengkap</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none"><MapPin className="h-4 w-4 text-slate-400" /></div>
                <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)}
                  className="input-field pl-10 resize-none min-h-[90px]" placeholder="Alamat domisili saat ini" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>

      {/* Install App Section */}
      <InstallAppSection />
    </div>
  );
}

function InstallAppSection() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

  if (isStandalone || isInstalled) {
    return (
      <div className="card p-4 flex items-center gap-3 border-emerald-100 dark:border-emerald-800">
        <div className="icon-box icon-box-md icon-box-emerald"><CheckCircle2 className="w-5 h-5" /></div>
        <div>
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Aplikasi Terpasang</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">SIM KBM berjalan sebagai aplikasi.</p>
        </div>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="icon-box icon-box-md bg-emerald-600 text-white"><Download className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Pasang Aplikasi</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Akses lebih cepat dari layar utama</p>
          </div>
        </div>
        <button onClick={promptInstall} className="btn-primary w-full justify-center py-3">
          <Download className="w-4 h-4" /> Pasang Sekarang
        </button>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="icon-box icon-box-md bg-emerald-600 text-white"><Smartphone className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Pasang di iPhone/iPad</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ikuti langkah berikut</p>
          </div>
        </div>
        <ol className="space-y-2.5">
          {["Tap tombol Share di Safari","Pilih Tambah ke Layar Utama","Tap Tambah untuk menyelesaikan"].map((s,i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
              <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
              {i === 0 ? <span>Tap tombol <strong><Share className="inline w-3.5 h-3.5" /> Share</strong> di Safari</span> : <span>{s}</span>}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return null;
}
