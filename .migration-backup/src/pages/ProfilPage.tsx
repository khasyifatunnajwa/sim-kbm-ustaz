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
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-2 bg-slate-200 rounded-full w-full"></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
          <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
          <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Kartu Progress Profil */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 md:p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Kelengkapan Profil</h2>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${progress === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {progress}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {progress === 100 
              ? 'Profil Anda sudah lengkap. Mantap!' 
              : 'Lengkapi data Anda agar informasi kontak & administrasi lebih akurat.'}
          </p>
        </div>
      </div>

      {/* Form Edit */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Informasi Dasar</h2>
              <p className="text-xs text-slate-500">Perbarui data diri Anda</p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-5">
          {/* Read Only: ID Login & Terakhir Update */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">ID Login Akun</label>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-slate-200 text-slate-700 px-2 py-1.5 rounded truncate flex-1 font-mono">
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
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Terakhir Update / Login</label>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">
                  {formatDateTime(profile?.updated_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Nama Lengkap - Editable */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  placeholder="Masukkan nama lengkap Anda"
                  required
                />
              </div>
            </div>

            {/* Nama Panggilan - Read Only */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Panggilan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={profile?.nama_panggilan || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none font-medium"
                  placeholder="Nama panggilan (tidak dapat diubah)"
                />
              </div>
            </div>

            {/* Nomor WhatsApp - Editable */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nomor WhatsApp</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  value={nomorWhatsapp}
                  onChange={handleWAChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  placeholder="Contoh: 081234567890"
                />
              </div>
            </div>

            {/* Alamat Lengkap - Editable */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Lengkap</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MapPin className="h-4 w-4 text-slate-400" />
                </div>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none min-h-[100px] resize-none"
                  placeholder="Masukkan alamat domisili saat ini"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-70"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
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
      <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">Aplikasi Terpasang</p>
          <p className="text-xs text-emerald-600">SIM KBM sudah berjalan sebagai aplikasi di perangkat Anda.</p>
        </div>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Pasang Aplikasi</h3>
            <p className="text-xs text-slate-500">Akses lebih cepat dari layar utama</p>
          </div>
        </div>
        <button
          onClick={promptInstall}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Pasang Sekarang</span>
        </button>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Pasang di iPhone/iPad</h3>
            <p className="text-xs text-slate-500">Ikuti langkah berikut</p>
          </div>
        </div>
        <ol className="space-y-2.5">
          <li className="flex items-start gap-2.5 text-sm text-slate-600">
            <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <span>Tap tombol <strong className="inline-flex items-center gap-1"><Share className="w-3.5 h-3.5" /> Share</strong> di Safari</span>
          </li>
          <li className="flex items-start gap-2.5 text-sm text-slate-600">
            <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <span>Pilih <strong>"Tambah ke Layar Utama"</strong></span>
          </li>
          <li className="flex items-start gap-2.5 text-sm text-slate-600">
            <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <span>Tap <strong>"Tambah"</strong> untuk menyelesaikan</span>
          </li>
        </ol>
      </div>
    );
  }

  return null;
}
