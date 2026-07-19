import { useState, useEffect, useRef } from 'react';
import {
  Building2, Shield, Calendar, Clock, Upload, Download, Smartphone,
  Database, Save, CheckCircle, X, AlertTriangle, AlertCircle, Wifi,
  WifiOff, Bell, BellOff, RefreshCw, Image as ImageIcon, Loader2, Plus, Trash2,
  Info, Pencil, Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import type { ShowToast, Profile, JamPelajaran } from '../../types';

interface SistemSettings {
  nama_lembaga: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  tahun_ajaran_aktif: string;
  semester_aktif: string;
  hari_libur: string[];
}

const HARI_SEMUA = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
const DEFAULT_HARI_LIBUR = ['Jumat'];

const BACKUP_TABLES = [
  'lembaga', 'profiles', 'kelas', 'mata_pelajaran', 'murid', 'jadwal_mengajar',
  'jurnal_kbm', 'absensi', 'penilaian', 'detail_nilai', 'sikap', 'catatan_guru',
  'pengumuman', 'agenda_penting', 'izin_mengajar', 'tahun_ajaran',
];

type ActivePanel = 'identitas' | 'logo' | 'akademik' | 'waktu' | 'hari-libur' | 'backup' | 'restore' | 'pwa';

export default function PengaturanSistemSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [activePanel, setActivePanel] = useState<ActivePanel>('identitas');
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [parsedRestore, setParsedRestore] = useState<any>(null);
  const [tahunOptions, setTahunOptions] = useState<string[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPWA, setIsPWA] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [swStatus, setSwStatus] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SistemSettings>({
    nama_lembaga: '', alamat: '', telepon: '', email: '', website: '',
    tahun_ajaran_aktif: '', semester_aktif: '',
    hari_libur: [...DEFAULT_HARI_LIBUR],
  });

  useEffect(() => {
    fetchSettings();
    checkPWA();
    checkSW();
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  const checkPWA = () => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsPWA(standalone);
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
    setPushEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted');
  };

  const checkSW = async () => {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
      setSwStatus(reg ? `Aktif (scope: ${reg.scope})` : 'Tidak terdaftar');
    } else {
      setSwStatus('Browser tidak mendukung Service Worker');
    }
  };

  const fetchSettings = async () => {
    try {
      const [lembagaRes, tahunRes, semesterRes] = await Promise.all([
        supabase.from('lembaga').select('*').limit(1).maybeSingle(),
        supabase.from('tahun_ajaran').select('nama').order('nama'),
        supabase.from('semester').select('nama').order('nama'),
      ]);

      setTahunOptions((tahunRes.data || []).map((t: any) => t.nama));
      setSemesterOptions((semesterRes.data || []).map((s: any) => s.nama));

      if (lembagaRes.data) {
        setSettings(prev => ({
          ...prev,
          nama_lembaga: lembagaRes.data.nama_lembaga || '',
          alamat: lembagaRes.data.alamat || '',
          telepon: lembagaRes.data.telepon || '',
          email: lembagaRes.data.email || '',
          website: lembagaRes.data.website || '',
        }));
        if (lembagaRes.data.logo_url) {
          setLogoUrl(lembagaRes.data.logo_url);
          setLogoPreview(lembagaRes.data.logo_url);
        }
      }

      const activeTahun = await supabase.from('tahun_ajaran').select('nama').eq('aktif', true).maybeSingle();
      const activeSemester = await supabase.from('semester').select('nama').eq('aktif', true).maybeSingle();
      setSettings(prev => ({
        ...prev,
        tahun_ajaran_aktif: activeTahun.data?.nama || '',
        semester_aktif: activeSemester.data?.nama || '',
      }));

      // Load jam settings from localStorage (persisted locally per-institution)
      const savedJam = localStorage.getItem('simkbm-jam-settings');
      if (savedJam) {
        try {
          const jam = JSON.parse(savedJam);
          setSettings(prev => ({ ...prev, hari_libur: jam.hari_libur || [...DEFAULT_HARI_LIBUR] }));
        } catch { /* ignore */ }
      }
    } catch (err: any) {
      showToast('Gagal memuat pengaturan: ' + err.message, 'error');
    }
  };

  const handleSaveIdentitas = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('lembaga').select('id').limit(1).maybeSingle();
      const payload: any = {
        nama_lembaga: settings.nama_lembaga,
        alamat: settings.alamat || null,
        telepon: settings.telepon || null,
        email: settings.email || null,
        website: settings.website || null,
      };
      if (logoUrl) payload.logo_url = logoUrl;

      if (existing) {
        await supabase.from('lembaga').update(payload).eq('id', existing.id);
      } else {
        payload.user_id = profile?.id;
        await supabase.from('lembaga').insert(payload);
      }
      showToast('Identitas lembaga disimpan', 'success');
    } catch (err: any) { showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleSaveAkademik = async () => {
    setSaving(true);
    try {
      if (settings.tahun_ajaran_aktif) {
        await supabase.from('tahun_ajaran').update({ aktif: false }).neq('nama', settings.tahun_ajaran_aktif);
        await supabase.from('tahun_ajaran').update({ aktif: true }).eq('nama', settings.tahun_ajaran_aktif);
      }
      if (settings.semester_aktif) {
        await supabase.from('semester').update({ aktif: false }).neq('nama', settings.semester_aktif);
        await supabase.from('semester').update({ aktif: true }).eq('nama', settings.semester_aktif);
      }
      showToast('Tahun ajaran & semester aktif disimpan', 'success');
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleSaveWaktu = () => {
    localStorage.setItem('simkbm-jam-settings', JSON.stringify({
      hari_libur: settings.hari_libur,
    }));
    showToast('Hari libur disimpan', 'success');
  };

  const handleLogoChange = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) { showToast('Ukuran logo maksimal 2MB', 'error'); return; }
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
    setLogoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logos/logo.${ext}`;
      const { error } = await supabase.storage.from('lembaga-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('lembaga-assets').getPublicUrl(path);
      setLogoUrl(publicUrl);
      showToast('Logo berhasil diunggah', 'success');
    } catch (err: any) { showToast('Gagal unggah logo: ' + err.message, 'error');
    } finally { setLogoUploading(false); }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const backupData: Record<string, any[]> = {};
      for (const table of BACKUP_TABLES) {
        const { data } = await supabase.from(table).select('*');
        backupData[table] = data || [];
      }
      const backup = {
        version: '2.0',
        backup_date: new Date().toISOString(),
        nama_lembaga: settings.nama_lembaga,
        tables: backupData,
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_simkbm_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Backup berhasil (${BACKUP_TABLES.length} tabel)`, 'success');
    } catch (err: any) { showToast('Gagal backup: ' + err.message, 'error');
    } finally { setBackupLoading(false); }
  };

  const handleRestoreFile = (file: File) => {
    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.tables) { showToast('Format backup tidak valid', 'error'); return; }
        setParsedRestore(parsed);
        setShowRestoreConfirm(true);
      } catch { showToast('File JSON tidak valid', 'error'); }
    };
    reader.readAsText(file);
  };

  const handleRestoreJson = () => {
    if (!restoreJson.trim()) { showToast('Paste JSON backup terlebih dahulu', 'error'); return; }
    try {
      const parsed = JSON.parse(restoreJson);
      if (!parsed.tables) { showToast('Format backup tidak valid', 'error'); return; }
      setParsedRestore(parsed);
      setShowRestoreConfirm(true);
    } catch { showToast('JSON tidak valid', 'error'); }
  };

  const handleRestoreConfirm = async () => {
    if (!parsedRestore) return;
    setRestoreLoading(true);
    try {
      let totalRestored = 0;
      for (const [table, rows] of Object.entries(parsedRestore.tables as Record<string, any[]>)) {
        if (!rows || rows.length === 0) continue;
        const chunks = [];
        for (let i = 0; i < rows.length; i += 100) chunks.push(rows.slice(i, i + 100));
        for (const chunk of chunks) {
          const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });
          if (!error) totalRestored += chunk.length;
        }
      }
      showToast(`Restore selesai: ${totalRestored} record dipulihkan`, 'success');
      setShowRestoreConfirm(false);
      setShowRestoreModal(false);
      setRestoreJson('');
      setRestoreFile(null);
      setParsedRestore(null);
    } catch (err: any) { showToast('Gagal restore: ' + err.message, 'error');
    } finally { setRestoreLoading(false); }
  };

  const handleTogglePush = async () => {
    if (!pushSupported) { showToast('Browser tidak mendukung notifikasi push', 'error'); return; }
    if (Notification.permission === 'denied') { showToast('Izin notifikasi diblokir. Aktifkan di pengaturan browser.', 'error'); return; }
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      setPushEnabled(perm === 'granted');
      showToast(perm === 'granted' ? 'Notifikasi push diaktifkan' : 'Izin notifikasi ditolak', perm === 'granted' ? 'success' : 'error');
    } else {
      showToast('Notifikasi sudah aktif. Nonaktifkan melalui pengaturan browser.', 'info');
    }
  };

  const handleUpdateSW = async () => {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        showToast('Service Worker diperbarui', 'success');
        checkSW();
      }
    }
  };

  const menuItems: { id: ActivePanel; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'identitas', label: 'Identitas Lembaga', icon: Building2, color: 'emerald' },
    { id: 'logo', label: 'Logo Lembaga', icon: ImageIcon, color: 'sky' },
    { id: 'akademik', label: 'Tahun / Semester', icon: Calendar, color: 'amber' },
    { id: 'waktu', label: 'Waktu Kehadiran', icon: Clock, color: 'violet' },
    { id: 'hari-libur', label: 'Hari Libur', icon: Calendar, color: 'rose' },
    { id: 'backup', label: 'Backup Database', icon: Download, color: 'emerald' },
    { id: 'restore', label: 'Restore Database', icon: Upload, color: 'amber' },
    { id: 'pwa', label: 'Pengaturan PWA', icon: Smartphone, color: 'sky' },
  ];

  const colorMap: Record<string, { icon: string; bg: string }> = {
    emerald: { icon: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    sky: { icon: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/40' },
    amber: { icon: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
    violet: { icon: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/40' },
    rose: { icon: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/40' },
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Pengaturan Sistem</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Konfigurasi identitas lembaga, akademik, waktu, dan backup data</p>
      </div>

      {/* Navigation grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {menuItems.map(item => {
          const Icon = item.icon;
          const c = colorMap[item.color] || colorMap.emerald;
          const isActive = activePanel === item.id;
          return (
            <button key={item.id} onClick={() => setActivePanel(item.id)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold transition-all border ${isActive ? 'bg-slate-800 text-white border-slate-800' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20' : c.bg}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : c.icon}`} />
              </div>
              <span className="text-center leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===== IDENTITAS LEMBAGA ===== */}
      {activePanel === 'identitas' && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Identitas Lembaga</h3>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Lembaga *</label><input type="text" value={settings.nama_lembaga} onChange={e => setSettings(s => ({ ...s, nama_lembaga: e.target.value }))} className="input-field text-sm" placeholder="Nama pesantren / madrasah" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Alamat</label><textarea value={settings.alamat} onChange={e => setSettings(s => ({ ...s, alamat: e.target.value }))} className="input-field text-sm resize-none" rows={2} placeholder="Alamat lengkap lembaga" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Telepon</label><input type="text" value={settings.telepon} onChange={e => setSettings(s => ({ ...s, telepon: e.target.value }))} className="input-field text-sm" placeholder="08xx" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Email</label><input type="email" value={settings.email} onChange={e => setSettings(s => ({ ...s, email: e.target.value }))} className="input-field text-sm" placeholder="email@lembaga.id" /></div>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Website</label><input type="text" value={settings.website} onChange={e => setSettings(s => ({ ...s, website: e.target.value }))} className="input-field text-sm" placeholder="https://..." /></div>
          <button onClick={handleSaveIdentitas} disabled={saving || !settings.nama_lembaga} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Identitas'}
          </button>
        </div>
      )}

      {/* ===== LOGO ===== */}
      {activePanel === 'logo' && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Logo Lembaga</h3>
          </div>
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-sky-700 dark:text-sky-300">Format: JPG/PNG/WebP. Ukuran maks. 2MB. Logo akan ditampilkan di header aplikasi dan laporan.</p>
          </div>
          {/* Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-600">
              {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="w-12 h-12 text-slate-300" />}
            </div>
            {logoUploading && (
              <div className="flex items-center gap-2 text-xs text-sky-600">
                <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => logoInputRef.current?.click()} disabled={logoUploading} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50">
              <Upload className="w-3.5 h-3.5" /> {logoUploading ? 'Mengunggah...' : 'Pilih Logo'}
            </button>
            {logoPreview && (
              <button onClick={() => { setLogoPreview(null); setLogoUrl(null); }} className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              </button>
            )}
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleLogoChange(e.target.files[0]); }} />
          {logoUrl && (
            <button onClick={handleSaveIdentitas} disabled={saving} className="w-full py-2 text-xs text-emerald-600 font-semibold hover:underline">
              {saving ? 'Menyimpan...' : 'Simpan perubahan ke profil lembaga'}
            </button>
          )}
        </div>
      )}

      {/* ===== TAHUN / SEMESTER ===== */}
      {activePanel === 'akademik' && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tahun Ajaran & Semester Aktif</h3>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">Ubah data tahun ajaran dan semester melalui menu Data Master → Tahun Ajaran / Semester. Di sini Anda hanya memilih yang aktif.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tahun Ajaran Aktif</label>
            <select value={settings.tahun_ajaran_aktif} onChange={e => setSettings(s => ({ ...s, tahun_ajaran_aktif: e.target.value }))} className="input-field text-sm">
              <option value="">Pilih Tahun Ajaran</option>
              {tahunOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {tahunOptions.length === 0 && <p className="text-[10px] text-slate-400 mt-1">Belum ada tahun ajaran. Tambahkan di Data Master → Tahun Ajaran.</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Semester Aktif</label>
            <select value={settings.semester_aktif} onChange={e => setSettings(s => ({ ...s, semester_aktif: e.target.value }))} className="input-field text-sm">
              <option value="">Pilih Semester</option>
              {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {semesterOptions.length === 0 && <p className="text-[10px] text-slate-400 mt-1">Belum ada semester. Tambahkan di Data Master → Semester.</p>}
          </div>
          <button onClick={handleSaveAkademik} disabled={saving} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan Akademik'}
          </button>
        </div>
      )}

      {/* ===== WAKTU KEHADIRAN ===== */}
      {activePanel === 'waktu' && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-violet-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Waktu Kehadiran</h3>
          </div>
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-violet-700 dark:text-violet-300">
              Pengaturan waktu kehadiran ustaz & murid mengikuti Data Master Jam Pelajaran. Setiap jam memiliki batas terlambat dan batas edit yang dapat diatur per jam.
            </p>
          </div>
          <WaktuKehadiranEditor showToast={showToast} />
        </div>
      )}

      {/* ===== HARI LIBUR ===== */}
      {activePanel === 'hari-libur' && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Hari Libur Mingguan</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pilih hari yang menjadi hari libur rutin setiap minggu. Jumat adalah hari libur default pesantren.</p>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
            {HARI_SEMUA.map(hari => {
              const isLibur = settings.hari_libur.includes(hari);
              const isJumat = hari === 'Jumat';
              return (
                <button
                  key={hari}
                  disabled={isJumat}
                  onClick={() => {
                    if (isJumat) return;
                    setSettings(s => ({
                      ...s,
                      hari_libur: isLibur
                        ? s.hari_libur.filter(h => h !== hari)
                        : [...s.hari_libur, hari],
                    }));
                  }}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-all border ${isLibur ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'} ${isJumat ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {hari}
                  {isJumat && <span className="block text-[8px] mt-0.5 opacity-75">Default</span>}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-slate-500">
            Hari libur aktif: <strong className="text-rose-600">{settings.hari_libur.join(', ') || '-'}</strong>
          </div>
          <button onClick={handleSaveWaktu} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Simpan Hari Libur
          </button>
        </div>
      )}

      {/* ===== BACKUP ===== */}
      {activePanel === 'backup' && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Backup Database</h3>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Tabel yang akan dibackup ({BACKUP_TABLES.length}):</p>
            <div className="flex flex-wrap gap-1">
              {BACKUP_TABLES.map(t => <span key={t} className="text-[10px] bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-mono">{t}</span>)}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Backup akan mengunduh semua data dalam format JSON. Simpan file ini di tempat aman sebagai cadangan.</p>
          <button onClick={handleBackup} disabled={backupLoading} className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
            {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {backupLoading ? 'Memproses backup...' : 'Mulai Backup Database'}
          </button>
        </div>
      )}

      {/* ===== RESTORE ===== */}
      {activePanel === 'restore' && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Restore Database</h3>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Perhatian:</strong> Restore akan menimpa (upsert) data yang ada. Pastikan Anda memiliki backup terbaru sebelum melakukan restore. Proses ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-5 text-center cursor-pointer hover:border-amber-400 transition-colors" onClick={() => restoreInputRef.current?.click()}>
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              {restoreFile ? <p className="text-sm font-semibold text-amber-600">{restoreFile.name}</p> : <p className="text-sm text-slate-400">Klik untuk pilih file JSON backup</p>}
              <input ref={restoreInputRef} type="file" accept=".json" className="hidden" onChange={e => { if (e.target.files?.[0]) handleRestoreFile(e.target.files[0]); }} />
            </div>
            <div className="text-center text-xs text-slate-400">— atau paste JSON —</div>
            <textarea value={restoreJson} onChange={e => setRestoreJson(e.target.value)} className="input-field text-xs font-mono resize-none" rows={5} placeholder={'{\n  "version": "2.0",\n  "tables": {...}\n}'} />
            <button onClick={handleRestoreJson} disabled={!restoreJson.trim()} className="w-full py-2.5 text-xs font-semibold rounded-xl bg-amber-600 text-white disabled:opacity-50 flex items-center justify-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Validasi & Restore dari JSON
            </button>
          </div>
        </div>
      )}

      {/* ===== PWA ===== */}
      {activePanel === 'pwa' && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Pengaturan PWA</h3>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 border ${isPWA ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className={`w-4 h-4 ${isPWA ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Mode PWA</span>
              </div>
              <p className={`text-sm font-bold ${isPWA ? 'text-emerald-600' : 'text-slate-400'}`}>{isPWA ? 'Standalone' : 'Browser'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{isPWA ? 'Berjalan sebagai aplikasi' : 'Belum diinstal sebagai PWA'}</p>
            </div>

            <div className={`rounded-xl p-3 border ${isOnline ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-rose-600" />}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Koneksi</span>
              </div>
              <p className={`text-sm font-bold ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>{isOnline ? 'Online' : 'Offline'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{isOnline ? 'Terhubung ke internet' : 'Tidak ada koneksi'}</p>
            </div>
          </div>

          {/* Push Notification */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {pushEnabled ? <Bell className="w-4 h-4 text-emerald-600" /> : <BellOff className="w-4 h-4 text-slate-400" />}
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Notifikasi Push</p>
                <p className="text-[10px] text-slate-400">{pushEnabled ? 'Izin diberikan' : pushSupported ? 'Belum diaktifkan' : 'Tidak didukung browser'}</p>
              </div>
            </div>
            <button onClick={handleTogglePush} disabled={!pushSupported} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${pushEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-emerald-50'}`}>
              {pushEnabled ? 'Aktif' : 'Aktifkan'}
            </button>
          </div>

          {/* Service Worker */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-sky-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Service Worker</p>
                  <p className="text-[10px] text-slate-400 break-all">{swStatus || 'Memeriksa...'}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleUpdateSW} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Perbarui SW
              </button>
              <button onClick={checkSW} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Cek Status
              </button>
            </div>
          </div>

          {/* App info */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Versi Aplikasi</span><span className="font-semibold">2.0.0</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Build</span><span className="font-semibold">2026.07</span></div>
            <div className="flex justify-between"><span className="text-slate-500">User Agent</span><span className="font-semibold text-right truncate max-w-[60%]">{navigator.userAgent.split(' ').slice(-2).join(' ')}</span></div>
          </div>
        </div>
      )}

      {/* ===== Restore confirm modal ===== */}
      {showRestoreConfirm && parsedRestore && (
        <Modal isOpen={true} onClose={() => { setShowRestoreConfirm(false); setParsedRestore(null); }} title="Konfirmasi Restore" size="sm">
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <p><strong>File backup:</strong> {parsedRestore.backup_date ? new Date(parsedRestore.backup_date).toLocaleDateString('id-ID') : 'Tanggal tidak diketahui'}</p>
                <p><strong>Lembaga:</strong> {parsedRestore.nama_lembaga || '-'}</p>
                <p><strong>Versi:</strong> {parsedRestore.version || '-'}</p>
                <p><strong>Tabel:</strong> {Object.keys(parsedRestore.tables || {}).join(', ')}</p>
                <p className="font-bold mt-2">Data yang ada akan ditimpa (upsert). Proses ini tidak dapat dibatalkan. Lanjutkan?</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowRestoreConfirm(false); setParsedRestore(null); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleRestoreConfirm} disabled={restoreLoading} className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-amber-600 text-white flex items-center justify-center gap-1.5 disabled:opacity-50">
                {restoreLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {restoreLoading ? 'Memulihkan...' : 'Ya, Restore Sekarang'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ===== WAKTU KEHADIRAN EDITOR (Jam Pelajaran) =====
function WaktuKehadiranEditor({ showToast }: { showToast: ShowToast }) {
  const [jamList, setJamList] = useState<JamPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<JamPelajaran>>({});

  useEffect(() => { fetchJam(); }, []);

  const fetchJam = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('jam_pelajaran').select('*').order('jam_mulai');
    if (error) { showToast(error.message, 'error'); }
    else if (data) setJamList(data as JamPelajaran[]);
    setLoading(false);
  };

  const startEdit = (jam: JamPelajaran) => {
    setEditing(jam.id);
    setEditForm({
      jam_mulai: jam.jam_mulai,
      jam_selesai: jam.jam_selesai,
      batas_terlambat: jam.batas_terlambat ?? 15,
      batas_edit_absensi: jam.batas_edit_absensi ?? 40,
      batas_terlambat_presensi: jam.batas_terlambat_presensi ?? 15,
      batas_edit_presensi: jam.batas_edit_presensi ?? 40,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from('jam_pelajaran').update({
      batas_terlambat: editForm.batas_terlambat,
      batas_edit_absensi: editForm.batas_edit_absensi,
      batas_terlambat_presensi: editForm.batas_terlambat_presensi,
      batas_edit_presensi: editForm.batas_edit_presensi,
    }).eq('id', editing);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Pengaturan waktu berhasil disimpan', 'success');
    setEditing(null);
    fetchJam();
  };

  const addNewJam = async () => {
    const lastJam = jamList[jamList.length - 1];
    const newMulai = lastJam?.jam_selesai || '13:00';
    const [h, m] = newMulai.split(':').map(Number);
    const newSelesai = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const newUrutan = (lastJam?.urutan || 0) + 1;
    const { data, error } = await supabase.from('jam_pelajaran').insert({
      nama_jam: `Jam ke-${newUrutan}`,
      jam_mulai: newMulai,
      jam_selesai: newSelesai,
      urutan: newUrutan,
      is_active: true,
      batas_terlambat: 15,
      batas_edit_absensi: 40,
      batas_terlambat_presensi: 15,
      batas_edit_presensi: 40,
    }).select().single();
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Jam pelajaran baru ditambahkan', 'success');
    fetchJam();
  };

  const deleteJam = async (id: string) => {
    const { error } = await supabase.from('jam_pelajaran').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Jam pelajaran dihapus', 'success');
    fetchJam();
  };

  if (loading) return <div className="flex items-center gap-2 py-4"><Loader2 className="w-4 h-4 text-slate-400 animate-spin" /><p className="text-xs text-slate-400">Memuat jam pelajaran...</p></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Jam Pelajaran & Batas Kehadiran</p>
        <button onClick={addNewJam} className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
          <Plus className="w-3.5 h-3.5" /> Tambah Jam
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {jamList.map(jam => {
          const isEditing = editing === jam.id;
          return (
            <div key={jam.id} className={`rounded-xl p-3 border ${isEditing ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {jam.jam_mulai?.slice(0, 5)} - {jam.jam_selesai?.slice(0, 5)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!isEditing ? (
                    <button onClick={() => startEdit(jam)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                  ) : (
                    <>
                      <button onClick={saveEdit} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                  <button onClick={() => deleteJam(jam.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500">Batas Terlambat (menit)</label>
                    <input type="number" value={editForm.batas_terlambat ?? 15} onChange={e => setEditForm(f => ({ ...f, batas_terlambat: Number(e.target.value) }))} className="input-field text-xs py-1.5" />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500">Batas Edit Absensi (menit)</label>
                    <input type="number" value={editForm.batas_edit_absensi ?? 40} onChange={e => setEditForm(f => ({ ...f, batas_edit_absensi: Number(e.target.value) }))} className="input-field text-xs py-1.5" />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500">Batas Terlambat Presensi</label>
                    <input type="number" value={editForm.batas_terlambat_presensi ?? 15} onChange={e => setEditForm(f => ({ ...f, batas_terlambat_presensi: Number(e.target.value) }))} className="input-field text-xs py-1.5" />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500">Batas Edit Presensi</label>
                    <input type="number" value={editForm.batas_edit_presensi ?? 40} onChange={e => setEditForm(f => ({ ...f, batas_edit_presensi: Number(e.target.value) }))} className="input-field text-xs py-1.5" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                  <div className="bg-white dark:bg-slate-800 rounded-lg px-2 py-1.5">
                    <p className="text-slate-400">Terlambat</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{jam.batas_terlambat ?? 15} menit</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg px-2 py-1.5">
                    <p className="text-slate-400">Edit Absensi</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{jam.batas_edit_absensi ?? 40} menit</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg px-2 py-1.5">
                    <p className="text-slate-400">Terlambat Presensi</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{jam.batas_terlambat_presensi ?? 15} menit</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg px-2 py-1.5">
                    <p className="text-slate-400">Edit Presensi</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{jam.batas_edit_presensi ?? 40} menit</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
