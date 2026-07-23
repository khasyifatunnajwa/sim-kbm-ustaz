import { useState } from 'react';
import {
  Palette, Type, LayoutDashboard, Table, Bell, Smartphone,
  Zap, Database, Shield, Accessibility, Info, RotateCcw,
  Sun, Moon, Monitor, ChevronRight, Trash2, RefreshCw,
  Download, Eye, KeyRound, LogOut,
  HardDrive, Loader2, Save, ArrowUp, ArrowDown, GripVertical,
  Code2, Users, Building2,
} from 'lucide-react';
import { useSettings, DEFAULT_SETTINGS } from '../store/useSettings';
import type { DashboardWidgetId, ThemeColor, FontSize, FontWeight, LineSpacing, TableSize, IconSize, RefreshInterval, ThemeMode } from '../store/useSettings';
import type { ShowToast, Profile } from '../types';
import { supabase } from '../lib/supabase';
import { useLembaga } from '../hooks/useLembaga';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchableSelect from '../components/SearchableSelect';
import {
  SettingsSection, SettingsRow, Toggle, OptionGroup,
  SettingsSlider, SettingsAction, ColorSwatchPicker,
} from '../components/SettingsControls';

interface PengaturanPageProps {
  showToast: ShowToast;
  profile: Profile | null;
}

const THEME_COLORS: { label: string; value: ThemeColor; bg: string }[] = [
  { label: 'Hijau', value: 'hijau', bg: 'bg-emerald-500' },
  { label: 'Biru', value: 'biru', bg: 'bg-blue-500' },
  { label: 'Ungu', value: 'ungu', bg: 'bg-purple-500' },
  { label: 'Merah', value: 'merah', bg: 'bg-rose-500' },
  { label: 'Orange', value: 'orange', bg: 'bg-orange-500' },
  { label: 'Abu-abu', value: 'abu', bg: 'bg-slate-500' },
];

const FONT_SIZE_OPTIONS: { label: string; value: FontSize }[] = [
  { label: 'Sangat Kecil', value: 'xs' },
  { label: 'Kecil', value: 'sm' },
  { label: 'Sedang', value: 'md' },
  { label: 'Besar', value: 'lg' },
  { label: 'Sangat Besar', value: 'xl' },
];

const DASHBOARD_WIDGETS: { id: DashboardWidgetId; label: string }[] = [
  { id: 'ringkasanData', label: 'Ringkasan Data' },
  { id: 'jadwalHariIni', label: 'Jadwal Hari Ini' },
  { id: 'pengumuman', label: 'Pengumuman' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'statistik', label: 'Statistik' },
  { id: 'aktivitasTerbaru', label: 'Aktivitas Terbaru' },
  { id: 'presensiHariIni', label: 'Presensi Hari Ini' },
];

const TABLE_SIZE_OPTIONS: { label: string; value: TableSize }[] = [
  { label: 'Compact', value: 'compact' },
  { label: 'Normal', value: 'normal' },
  { label: 'Lebar', value: 'lebar' },
];

const ICON_SIZE_OPTIONS: { label: string; value: IconSize }[] = [
  { label: 'Kecil', value: 'kecil' },
  { label: 'Sedang', value: 'sedang' },
  { label: 'Besar', value: 'besar' },
];

const REFRESH_OPTIONS: { label: string; value: RefreshInterval }[] = [
  { label: '1 Menit', value: '1' },
  { label: '5 Menit', value: '5' },
  { label: '10 Menit', value: '10' },
  { label: 'Manual', value: 'manual' },
];

export default function PengaturanPage({ showToast }: PengaturanPageProps) {
  const { settings, updateSetting, resetSettings, resetPersonalData } = useSettings();
  const { data: lembagaList = [] } = useLembaga();

  const lembagaOptions = [
    { value: 'all', label: 'Semua Lembaga' },
    ...lembagaList.map((l: any) => ({ value: l.id, label: l.nama_lembaga })),
  ];
  const [showResetSettings, setShowResetSettings] = useState(false);
  const [showResetPersonal, setShowResetPersonal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<string | null>(null);
  const [, setClearingCache] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // ====== Theme Mode ======
  const handleThemeModeChange = (mode: ThemeMode) => {
    updateSetting('themeMode', mode);
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    }
    localStorage.setItem('simkbm-theme', mode);
  };

  // ====== Cache Management ======
  const handleViewCache = async () => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) ?? '';
          total += val.length + key.length;
        }
      }
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        const idb = est.usage ?? 0;
        setCacheInfo(
          `localStorage: ${(total / 1024).toFixed(1)} KB | Total storage: ${((idb) / 1024 / 1024).toFixed(2)} MB dari ${((est.quota ?? 0) / 1024 / 1024).toFixed(0)} MB`
        );
      } else {
        setCacheInfo(`localStorage: ${(total / 1024).toFixed(1)} KB`);
      }
    } catch {
      setCacheInfo('Tidak dapat menghitung ukuran cache.');
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const keepKeys = ['simkbm-settings', 'simkbm-theme', 'sim-kbm-storage'];
      const kept: Record<string, string | null> = {};
      keepKeys.forEach(k => { kept[k] = localStorage.getItem(k); });
      localStorage.clear();
      keepKeys.forEach(k => { if (kept[k]) localStorage.setItem(k, kept[k]!); });
      try {
        const idbKeyval = await import('idb-keyval');
        await idbKeyval.clear();
      } catch { /* ignore */ }
      setCacheInfo(null);
      showToast('Cache berhasil dibersihkan', 'success');
    } catch {
      showToast('Gagal membersihkan cache', 'error');
    } finally {
      setClearingCache(false);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      showToast('Sinkronisasi ulang dimulai...', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch {
      showToast('Gagal sinkronisasi', 'error');
      setSyncing(false);
    }
  };

  const handleDownloadOffline = () => {
    showToast('Data offline akan diunduh saat aplikasi aktif. Cache otomatis tersimpan saat browsing.', 'info');
  };

  // ====== Security ======
  const handleLogoutAllDevices = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      showToast('Berhasil logout dari semua perangkat', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal logout dari semua perangkat', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="card p-4 md:p-5 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Pengaturan Aplikasi</h2>
            <p className="text-primary-100 text-xs mt-0.5">Atur tampilan, kenyamanan, dan preferensi pribadi Anda.</p>
          </div>
        </div>
      </div>

      {/* ====== A. Pilih Lembaga ====== */}
      <SettingsSection icon={Building2} title="Pilih Lembaga" desc="Filter data yang ditampilkan berdasarkan lembaga." accent="text-primary-600 bg-primary-50">
        <SettingsRow title="Lembaga Aktif" desc="Pilih lembaga untuk memfilter data. Dashboard & Jadwal tetap menampilkan semua lembaga.">
          <div className="w-48 flex-shrink-0">
            <SearchableSelect
              value={settings.selectedLembaga}
              onChange={(v) => updateSetting('selectedLembaga', v)}
              options={lembagaOptions}
              placeholder="Pilih Lembaga"
            />
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* ====== B. Pengaturan Gender ====== */}
      <SettingsSection icon={Users} title="Pengaturan Gender" desc="Pisahkan kelas menjadi Banin/Banat/Campuran." accent="text-emerald-600 bg-emerald-50">
        <SettingsRow title="Aktifkan Sistem Gender" desc="Pisahkan kelas menjadi Banin/Banat">
          <Toggle checked={settings.genderEnabled} onChange={v => updateSetting('genderEnabled', v)} />
        </SettingsRow>
        {settings.genderEnabled && (
          <>
            <SettingsRow title="Pilihan Gender" desc="Pilih gender yang digunakan">
            </SettingsRow>
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {(['Banin', 'Banat', 'Campuran'] as const).map(g => {
                const active = settings.genderOptions.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => {
                      const opts = active
                        ? settings.genderOptions.filter(x => x !== g)
                        : [...settings.genderOptions, g];
                      if (opts.length > 0) updateSetting('genderOptions', opts);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
            <SettingsRow title="Pisahkan Dashboard" desc="Tampilkan statistik terpisah berdasarkan gender">
              <Toggle checked={settings.genderDashboardSplit} onChange={v => updateSetting('genderDashboardSplit', v)} />
            </SettingsRow>
            <SettingsRow title="Pisahkan Laporan" desc="Pisahkan laporan berdasarkan gender">
              <Toggle checked={settings.genderReportSplit} onChange={v => updateSetting('genderReportSplit', v)} />
            </SettingsRow>
            <SettingsRow title="Istilah Banin" desc="Nama istilah untuk Banin">
              <input
                type="text"
                value={settings.genderLabelBanin}
                onChange={e => updateSetting('genderLabelBanin', e.target.value)}
                className="input-field text-xs w-32"
              />
            </SettingsRow>
            <SettingsRow title="Istilah Banat" desc="Nama istilah untuk Banat">
              <input
                type="text"
                value={settings.genderLabelBanat}
                onChange={e => updateSetting('genderLabelBanat', e.target.value)}
                className="input-field text-xs w-32"
              />
            </SettingsRow>
            <SettingsRow title="Istilah Campuran" desc="Nama istilah untuk Campuran">
              <input
                type="text"
                value={settings.genderLabelCampuran}
                onChange={e => updateSetting('genderLabelCampuran', e.target.value)}
                className="input-field text-xs w-32"
              />
            </SettingsRow>
          </>
        )}
      </SettingsSection>

      {/* ====== C. Penyimpanan ====== */}
      <SettingsSection icon={Database} title="Penyimpanan" desc="Manajemen cache dan data offline." accent="text-emerald-600 bg-emerald-50">
        {cacheInfo && (
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{cacheInfo}</p>
            </div>
          </div>
        )}
        <SettingsAction icon={Eye} title="Lihat Ukuran Cache" onClick={handleViewCache} rightIcon={ChevronRight} />
        <SettingsAction icon={Trash2} title="Hapus Cache" desc="Bersihkan data cache aplikasi." onClick={handleClearCache} variant="danger" rightIcon={ChevronRight} />
        <SettingsAction icon={RefreshCw} title="Sinkronisasi Ulang Data" desc="Muat ulang semua data dari server." onClick={handleSyncData} rightIcon={ChevronRight} />
        <SettingsAction icon={Download} title="Download Data Offline" onClick={handleDownloadOffline} rightIcon={ChevronRight} />
      </SettingsSection>

      {/* ====== D. Tampilan ====== */}
      <SettingsSection icon={Palette} title="Tampilan" desc="Mode tampilan, warna tema, dan kepadatan layout.">
        <SettingsRow title="Mode Tampilan">
          <div className="flex gap-1.5">
            {([
              { label: 'Terang', value: 'light', icon: Sun },
              { label: 'Gelap', value: 'dark', icon: Moon },
              { label: 'Sistem', value: 'system', icon: Monitor },
            ] as { label: string; value: ThemeMode; icon: React.ElementType }[]).map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.value}
                  onClick={() => handleThemeModeChange(m.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    settings.themeMode === m.value
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </SettingsRow>

        <div className="py-2.5">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2.5">Warna Tema</p>
          <ColorSwatchPicker colors={THEME_COLORS} value={settings.themeColor} onChange={(v) => updateSetting('themeColor', v)} />
        </div>

        <SettingsRow title="Mode Compact" desc="Card, tabel, dan menu lebih rapat.">
          <Toggle checked={settings.compactMode} onChange={(v) => updateSetting('compactMode', v)} />
        </SettingsRow>
      </SettingsSection>

      {/* ====== Font & Tampilan Teks ====== */}
      <SettingsSection icon={Type} title="Font & Tampilan Teks" desc="Sesuaikan ukuran, ketebalan, dan jarak baris." accent="text-sky-600 bg-sky-50">
        <div className="py-2.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ukuran Font</p>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg">
              {FONT_SIZE_OPTIONS.find(o => o.value === settings.fontSize)?.label}
            </span>
          </div>
          <SettingsSlider
            min={0}
            max={4}
            step={1}
            value={FONT_SIZE_OPTIONS.findIndex(o => o.value === settings.fontSize)}
            onChange={(idx) => updateSetting('fontSize', FONT_SIZE_OPTIONS[idx].value)}
            labels={['XS', 'S', 'M', 'L', 'XL']}
          />
        </div>

        <SettingsRow title="Ketebalan Font">
          <OptionGroup
            options={[{ label: 'Normal', value: 'normal' as FontWeight }, { label: 'Sedikit Tebal', value: 'semibold' as FontWeight }]}
            value={settings.fontWeight}
            onChange={(v) => updateSetting('fontWeight', v)}
          />
        </SettingsRow>

        <SettingsRow title="Jarak Antar Baris">
          <OptionGroup
            options={[
              { label: 'Rapat', value: 'rapat' as LineSpacing },
              { label: 'Sedang', value: 'sedang' as LineSpacing },
              { label: 'Lebar', value: 'lebar' as LineSpacing },
            ]}
            value={settings.lineSpacing}
            onChange={(v) => updateSetting('lineSpacing', v)}
          />
        </SettingsRow>
      </SettingsSection>

      {/* ====== Tampilan Dashboard ====== */}
      <SettingsSection icon={LayoutDashboard} title="Tampilan Dashboard" desc="Pilih widget yang ditampilkan dan urutannya." accent="text-violet-600 bg-violet-50">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Widget yang aktif:</p>
        <div className="space-y-1.5">
          {DASHBOARD_WIDGETS.map(w => {
            const isEnabled = settings.dashboardWidgets.includes(w.id);
            const orderIdx = settings.dashboardWidgetOrder.indexOf(w.id);
            return (
              <div
                key={w.id}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50"
              >
                <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-500 flex-shrink-0" />
                <Toggle checked={isEnabled} onChange={(v) => {
                  if (v) {
                    updateSetting('dashboardWidgets', [...settings.dashboardWidgets, w.id]);
                    if (!settings.dashboardWidgetOrder.includes(w.id)) {
                      updateSetting('dashboardWidgetOrder', [...settings.dashboardWidgetOrder, w.id]);
                    }
                  } else {
                    updateSetting('dashboardWidgets', settings.dashboardWidgets.filter(id => id !== w.id));
                  }
                }} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{w.label}</span>
                {isEnabled && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        if (orderIdx > 0) {
                          const newOrder = [...settings.dashboardWidgetOrder];
                          [newOrder[orderIdx - 1], newOrder[orderIdx]] = [newOrder[orderIdx], newOrder[orderIdx - 1]];
                          updateSetting('dashboardWidgetOrder', newOrder);
                        }
                      }}
                      disabled={orderIdx <= 0}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (orderIdx < settings.dashboardWidgetOrder.length - 1) {
                          const newOrder = [...settings.dashboardWidgetOrder];
                          [newOrder[orderIdx + 1], newOrder[orderIdx]] = [newOrder[orderIdx], newOrder[orderIdx + 1]];
                          updateSetting('dashboardWidgetOrder', newOrder);
                        }
                      }}
                      disabled={orderIdx >= settings.dashboardWidgetOrder.length - 1}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* ====== Tabel ====== */}
      <SettingsSection icon={Table} title="Tabel" desc="Konfigurasi tampilan tabel data." accent="text-amber-600 bg-amber-50">
        <SettingsRow title="Jumlah Data Per Halaman">
          <OptionGroup
            options={[10, 20, 50, 100].map(n => ({ label: String(n), value: n }))}
            value={settings.tablePageSize}
            onChange={(v) => updateSetting('tablePageSize', v)}
          />
        </SettingsRow>
        <SettingsRow title="Ukuran Tabel">
          <OptionGroup options={TABLE_SIZE_OPTIONS} value={settings.tableSize} onChange={(v) => updateSetting('tableSize', v)} />
        </SettingsRow>
        <SettingsRow title="Sticky Header" desc="Header tabel tetap terlihat saat scroll.">
          <Toggle checked={settings.tableStickyHeader} onChange={(v) => updateSetting('tableStickyHeader', v)} />
        </SettingsRow>
        <SettingsRow title="Nomor Urut Otomatis" desc="Tambahkan kolom nomor urut pada tabel.">
          <Toggle checked={settings.tableAutoNumber} onChange={(v) => updateSetting('tableAutoNumber', v)} />
        </SettingsRow>
      </SettingsSection>

      {/* ====== Notifikasi ====== */}
      <SettingsSection icon={Bell} title="Notifikasi" desc="Atur jenis notifikasi dan preferensi peringatan." accent="text-rose-600 bg-rose-50">
        <SettingsRow title="Notifikasi Pengumuman"><Toggle checked={settings.notifPengumuman} onChange={(v) => updateSetting('notifPengumuman', v)} /></SettingsRow>
        <SettingsRow title="Notifikasi Jadwal Mengajar"><Toggle checked={settings.notifJadwal} onChange={(v) => updateSetting('notifJadwal', v)} /></SettingsRow>
        <SettingsRow title="Notifikasi KBM"><Toggle checked={settings.notifKbm} onChange={(v) => updateSetting('notifKbm', v)} /></SettingsRow>
        <SettingsRow title="Notifikasi Presensi"><Toggle checked={settings.notifPresensi} onChange={(v) => updateSetting('notifPresensi', v)} /></SettingsRow>
        <SettingsRow title="Notifikasi Nilai"><Toggle checked={settings.notifNilai} onChange={(v) => updateSetting('notifNilai', v)} /></SettingsRow>
        <div className="border-t border-slate-100 dark:border-slate-700 my-2" />
        <SettingsRow title="Suara Notifikasi"><Toggle checked={settings.notifSound} onChange={(v) => updateSetting('notifSound', v)} /></SettingsRow>
        <SettingsRow title="Getar"><Toggle checked={settings.notifVibrate} onChange={(v) => updateSetting('notifVibrate', v)} /></SettingsRow>
      </SettingsSection>

      {/* ====== Tampilan Mobile ====== */}
      <SettingsSection icon={Smartphone} title="Tampilan Mobile" desc="Optimasi tampilan untuk perangkat mobile." accent="text-sky-600 bg-sky-50">
        <SettingsRow title="Bottom Navigation" desc="Navigasi bawah layar."><Toggle checked={settings.mobileBottomNav} onChange={(v) => updateSetting('mobileBottomNav', v)} /></SettingsRow>
        <SettingsRow title="Mode Landscape"><Toggle checked={settings.mobileLandscape} onChange={(v) => updateSetting('mobileLandscape', v)} /></SettingsRow>
        <SettingsRow title="Sembunyikan Sidebar Otomatis"><Toggle checked={settings.mobileAutoHideSidebar} onChange={(v) => updateSetting('mobileAutoHideSidebar', v)} /></SettingsRow>
        <SettingsRow title="Ukuran Icon">
          <OptionGroup options={ICON_SIZE_OPTIONS} value={settings.mobileIconSize} onChange={(v) => updateSetting('mobileIconSize', v)} />
        </SettingsRow>
      </SettingsSection>

      {/* ====== Performa ====== */}
      <SettingsSection icon={Zap} title="Performa" desc="Pengaturan hemat data dan refresh otomatis." accent="text-amber-600 bg-amber-50">
        <SettingsRow title="Mode Hemat Data" desc="Mengurangi penggunaan internet.">
          <Toggle checked={settings.dataSaver} onChange={(v) => updateSetting('dataSaver', v)} />
        </SettingsRow>
        <SettingsRow title="Mode Offline" desc="Gunakan data cache ketika tidak ada internet.">
          <Toggle checked={settings.offlineMode} onChange={(v) => updateSetting('offlineMode', v)} />
        </SettingsRow>
        <SettingsRow title="Refresh Otomatis">
          <OptionGroup options={REFRESH_OPTIONS} value={settings.refreshInterval} onChange={(v) => updateSetting('refreshInterval', v)} />
        </SettingsRow>
      </SettingsSection>

      {/* ====== E. Privasi & Keamanan ====== */}
      <SettingsSection icon={Shield} title="Privasi & Keamanan" desc="Keamanan akun dan kontrol perangkat." accent="text-slate-600 bg-slate-100">
        <SettingsAction icon={KeyRound} title="Ubah Password" desc="Ganti kata sandi akun Anda." onClick={() => setShowChangePassword(true)} rightIcon={ChevronRight} />
        <div className="border-t border-slate-100 dark:border-slate-700 my-2" />
        <SettingsAction icon={LogOut} title="Logout dari Semua Perangkat" desc="Keluar dari semua sesi aktif." onClick={handleLogoutAllDevices} variant="danger" rightIcon={ChevronRight} />
        <SettingsAction icon={Smartphone} title="Lihat Perangkat yang Sedang Login" onClick={() => setShowDevices(true)} rightIcon={ChevronRight} />
      </SettingsSection>

      {/* ====== Aksesibilitas ====== */}
      <SettingsSection icon={Accessibility} title="Aksesibilitas" desc="Bantuan untuk kenyamanan penggunaan." accent="text-blue-600 bg-blue-50">
        <SettingsRow title="Ukuran Tombol Besar"><Toggle checked={settings.a11yLargeButtons} onChange={(v) => updateSetting('a11yLargeButtons', v)} /></SettingsRow>
        <SettingsRow title="Kontras Tinggi"><Toggle checked={settings.a11yHighContrast} onChange={(v) => updateSetting('a11yHighContrast', v)} /></SettingsRow>
        <SettingsRow title="Animasi Dikurangi"><Toggle checked={settings.a11yReduceMotion} onChange={(v) => updateSetting('a11yReduceMotion', v)} /></SettingsRow>
        <SettingsRow title="Mode Ramah Lansia" desc="Font lebih besar, tombol lebih mudah."><Toggle checked={settings.a11ySeniorMode} onChange={(v) => updateSetting('a11ySeniorMode', v)} /></SettingsRow>
      </SettingsSection>

      {/* ====== Tentang Aplikasi ====== */}
      <SettingsSection icon={Info} title="Tentang Aplikasi" desc="Informasi versi dan dokumen." accent="text-slate-600 bg-slate-100">
        <div className="grid grid-cols-2 gap-3 py-2">
          <InfoItem label="Versi Aplikasi" value="2.0.0" />
          <InfoItem label="Versi Database" value="v2" />
          <InfoItem label="Versi Build" value="2026.07.14" />
          <InfoItem label="Platform" value="PWA" />
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700 my-2" />
        <SettingsAction icon={RefreshCw} title="Riwayat Update" onClick={() => setShowChangelog(true)} rightIcon={ChevronRight} />
        <SettingsAction icon={Shield} title="Kebijakan Privasi" onClick={() => setShowPrivacy(true)} rightIcon={ChevronRight} />
        <SettingsAction icon={Info} title="Syarat Penggunaan" onClick={() => setShowTerms(true)} rightIcon={ChevronRight} />
        <SettingsAction icon={Code2} title="Tim Pengembang" onClick={() => setShowAbout(true)} rightIcon={ChevronRight} />
      </SettingsSection>

      {/* ====== Reset ====== */}
      <SettingsSection icon={RotateCcw} title="Reset" desc="Kembalikan pengaturan atau data pribadi." accent="text-rose-600 bg-rose-50">
        <SettingsAction icon={RotateCcw} title="Reset Seluruh Pengaturan" desc="Kembalikan semua pengaturan ke default." onClick={() => setShowResetSettings(true)} variant="danger" rightIcon={ChevronRight} />
        <SettingsAction icon={Trash2} title="Reset Semua Data Ustaz Pribadi" desc="Hapus data lokal dan cache pribadi." onClick={() => setShowResetPersonal(true)} variant="danger" rightIcon={ChevronRight} />
      </SettingsSection>

      {/* ====== Footer ====== */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-400">SIM KBM Ustaz V2.0 Multi-Tenant</p>
        <p className="text-[10px] text-slate-300 mt-0.5">Dikembangkan oleh TIM aQanD-APP</p>
      </div>

      {/* ====== Dialogs ====== */}
      <ConfirmDialog
        isOpen={showResetSettings}
        onClose={() => setShowResetSettings(false)}
        onConfirm={() => {
          resetSettings();
          handleThemeModeChange(DEFAULT_SETTINGS.themeMode);
          showToast('Pengaturan berhasil direset ke default', 'success');
        }}
        title="Reset Pengaturan?"
        message="Semua pengaturan akan dikembalikan ke nilai default. Tindakan ini tidak dapat dibatalkan."
        confirmText="Reset"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={showResetPersonal}
        onClose={() => setShowResetPersonal(false)}
        onConfirm={async () => {
          resetPersonalData();
          try {
            const keepKeys = ['simkbm-settings', 'simkbm-theme', 'sim-kbm-storage'];
            const kept: Record<string, string | null> = {};
            keepKeys.forEach(k => { kept[k] = localStorage.getItem(k); });
            localStorage.clear();
            keepKeys.forEach(k => { if (kept[k]) localStorage.setItem(k, kept[k]!); });
            try {
              const idbKeyval = await import('idb-keyval');
              await idbKeyval.clear();
            } catch { /* ignore */ }
            showToast('Data pribadi berhasil direset', 'success');
            setTimeout(() => window.location.reload(), 800);
          } catch {
            showToast('Gagal reset data pribadi', 'error');
          }
        }}
        title="Reset Data Pribadi?"
        message="Semua data lokal, cache, dan pengaturan pribadi akan dihapus. Data server tidak terpengaruh."
        confirmText="Reset Data"
        variant="danger"
      />

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        showToast={showToast}
      />

      {/* About / Developer Modal */}
      <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title="Tim Pengembang" size="sm">
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3 p-1">
            <img src="/icon/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-3">
            <Code2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-700 text-sm">TIM aQanD-APP</span>
          </div>
          <h3 className="font-bold text-slate-800 text-base">SIM KBM Ustaz</h3>
          <p className="text-xs text-slate-500 mt-1">Sistem Informasi Manajemen KBM untuk Madrasah & Pesantren</p>
          <div className="mt-4 bg-slate-50 rounded-xl p-3 text-left space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Versi</span>
              <span className="font-semibold text-slate-700">2.0.0</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Build</span>
              <span className="font-semibold text-slate-700">2026.07.14</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Platform</span>
              <span className="font-semibold text-slate-700">PWA (Offline Ready)</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-300 mt-4">© 2026 TIM aQanD-APP. All rights reserved.</p>
        </div>
      </Modal>

      {/* Privacy Modal */}
      <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Kebijakan Privasi" size="md">
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 max-h-[60vh] overflow-y-auto">
          <p>SIM KBM Ustaz berkomitmen melindungi privasi data pengguna. Aplikasi ini menyimpan data secara aman di server terenkripsi.</p>
          <p><strong className="text-slate-700 dark:text-slate-100">Data yang dikumpulkan:</strong> Nama, kontak, jadwal mengajar, data santri, dan catatan akademik yang Anda input.</p>
          <p><strong className="text-slate-700 dark:text-slate-100">Penggunaan data:</strong> Data hanya digunakan untuk operasional manajemen kelas dan tidak dibagikan ke pihak ketiga.</p>
          <p><strong className="text-slate-700 dark:text-slate-100">Keamanan:</strong> Data ditransmisikan melalui koneksi terenkripsi (HTTPS/TLS) dan disimpan di database dengan keamanan tingkat enterprise.</p>
          <p><strong className="text-slate-700 dark:text-slate-100">Hak pengguna:</strong> Anda dapat mengakses, memperbarui, atau menghapus data Anda kapan saja melalui aplikasi.</p>
        </div>
      </Modal>

      {/* Terms Modal */}
      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Syarat Penggunaan" size="md">
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 max-h-[60vh] overflow-y-auto">
          <p>Dengan menggunakan SIM KBM Ustaz, Anda menyetujui syarat berikut:</p>
          <p>1. Aplikasi ini ditujukan untuk manajemen akademik madrasah dan kelas KBM.</p>
          <p>2. Pengguna bertanggung jawab atas keakuratan data yang diinput.</p>
          <p>3. Akun dan kredensial adalah tanggung jawab pribadi pengguna.</p>
          <p>4. Penyalahgunaan aplikasi untuk tujuan di luar fungsi pendidikan dilarang.</p>
          <p>5. Pengembang berhak memperbarui fitur dan kebijakan sewaktu-waktu.</p>
        </div>
      </Modal>

      {/* Changelog Modal */}
      <Modal isOpen={showChangelog} onClose={() => setShowChangelog(false)} title="Riwayat Update" size="md">
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <span className="badge badge-success text-[10px]">v2.0.0</span>
            <p className="mt-1.5 text-xs">Multi-tenant architecture, presensi ustaz system, dashboard widgets, dark mode, PWA offline support, settings personalization, admin panel lengkap.</p>
          </div>
          <div>
            <span className="badge badge-info text-[10px]">v1.5.0</span>
            <p className="mt-1.5 text-xs">Added rapor module, catatan guru, and improved absensi workflow.</p>
          </div>
          <div>
            <span className="badge badge-warning text-[10px]">v1.0.0</span>
            <p className="mt-1.5 text-xs">Initial release: dashboard, jadwal, murid, absensi, jurnal, nilai, sikap, soal, izin modules.</p>
          </div>
        </div>
      </Modal>

      {/* Devices Modal */}
      <Modal isOpen={showDevices} onClose={() => setShowDevices(false)} title="Perangkat Aktif" size="md">
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
          <p className="text-xs text-slate-400">Daftar perangkat yang sedang login dengan akun Anda:</p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <Smartphone className="w-5 h-5 text-primary-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Perangkat Ini</p>
              <p className="text-[10px] text-slate-400">{navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} • {navigator.platform || 'Unknown'}</p>
            </div>
            <span className="badge badge-success text-[9px]">Aktif</span>
          </div>
          <p className="text-[10px] text-slate-400">Untuk logout dari perangkat lain, gunakan tombol "Logout dari Semua Perangkat".</p>
        </div>
      </Modal>

      {/* Sync overlay */}
      {syncing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex items-center gap-3 shadow-2xl">
            <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Menyinkronkan data...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== Info Item helper ======
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">{value}</p>
    </div>
  );
}

// ====== Change Password Modal ======
function ChangePasswordModal({ isOpen, onClose, showToast }: { isOpen: boolean; onClose: () => void; showToast: ShowToast }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !next || !confirm) {
      showToast('Semua kolom wajib diisi', 'error');
      return;
    }
    if (next.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      return;
    }
    if (next !== confirm) {
      showToast('Konfirmasi password tidak cocok', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      showToast('Password berhasil diubah', 'success');
      setCurrent(''); setNext(''); setConfirm('');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah password', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ubah Password" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Password Saat Ini</label>
          <input
            type="password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            className="input-field"
            placeholder="Masukkan password lama"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Password Baru</label>
          <input
            type="password"
            value={next}
            onChange={e => setNext(e.target.value)}
            className="input-field"
            placeholder="Minimal 6 karakter"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Konfirmasi Password Baru</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="input-field"
            placeholder="Ulangi password baru"
            required
          />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Batal</button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
