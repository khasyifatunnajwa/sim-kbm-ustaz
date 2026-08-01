import { useState, useEffect, Suspense, lazy } from 'react';
import {
  Shield, ArrowLeft, LayoutDashboard, Users, Building2, Calendar,
  BookOpen, CheckCircle, Award, GraduationCap, Megaphone, FileText,
  Settings as SettingsIcon, TrendingUp, BookUser, ChevronDown,
} from 'lucide-react';
import type { ShowToast, Profile, ActiveTab } from '../types';

// Penting: Impor tipe (type) harus dipisah karena tipe tidak ikut di-compile
import type { AdminSectionId } from './admin/AdminDashboard';

// --- LAZY LOADING SEMUA KOMPONEN SECTION ---
// Aplikasi HANYA akan memuat file ini jika tabnya diklik!
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const KelolaUserSection = lazy(() => import('./admin/KelolaUserSection'));
const DataMasterSection = lazy(() => import('./admin/DataMasterSection'));
const JadwalSection = lazy(() => import('./admin/JadwalSection'));
const AkademikSection = lazy(() => import('./admin/AkademikSection'));
const PresensiSection = lazy(() => import('./admin/PresensiSection'));
const PenilaianSection = lazy(() => import('./admin/PenilaianSection'));
const DataMuridSection = lazy(() => import('./admin/DataMuridSection'));
const LaporanSection = lazy(() => import('./admin/LaporanSection'));
const PengaturanSistemSection = lazy(() => import('./admin/PengaturanSistemSection'));
const StatistikSection = lazy(() => import('./admin/StatistikSection'));
const AdminPengumuman = lazy(() => import('./AdminPengumumanPage'));
const RaporUstazPage = lazy(() => import('./RaporUstazPage'));
const RaporPage = lazy(() => import('./RaporPage'));

interface Props {
  showToast: ShowToast;
  profile: Profile | null;
  setActiveTab?: (tab: ActiveTab) => void;
  initialSection?: string;
  initialSubTab?: string;
}

const SECTION_MAP: Record<string, AdminSectionId> = {
  'presensi': 'presensi',
  'kelola-user': 'kelola-user',
  'data-akademik': 'data-master',
  'data-master': 'data-master',
  'jadwal': 'jadwal',
  'akademik': 'akademik',
  'penilaian': 'penilaian',
  'data-murid': 'data-murid',
  'pengumuman': 'pengumuman',
  'laporan': 'laporan',
  'rapor-ustaz': 'rapor-ustaz',
  'rapor-murid': 'rapor-murid',
  'pengaturan-sistem': 'pengaturan-sistem',
  'statistik': 'statistik',
};

interface NavGroup {
  label: string;
  items: { id: AdminSectionId; icon: React.ElementType; label: string; color: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'emerald' },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { id: 'kelola-user', icon: Users, label: 'Kelola User', color: 'emerald' },
      { id: 'data-master', icon: Building2, label: 'Data Master', color: 'sky' },
      { id: 'data-murid', icon: GraduationCap, label: 'Data Murid', color: 'sky' },
    ],
  },
  {
    label: 'Akademik',
    items: [
      { id: 'jadwal', icon: Calendar, label: 'Jadwal', color: 'amber' },
      { id: 'akademik', icon: BookOpen, label: 'Akademik', color: 'emerald' },
      { id: 'presensi', icon: CheckCircle, label: 'Presensi', color: 'emerald' },
      { id: 'penilaian', icon: Award, label: 'Penilaian', color: 'violet' },
    ],
  },
  {
    label: 'Laporan & Rapor',
    items: [
      { id: 'laporan', icon: FileText, label: 'Laporan', color: 'rose' },
      { id: 'rapor-ustaz', icon: BookUser, label: 'Rapor Ustaz', color: 'emerald' },
      { id: 'rapor-murid', icon: GraduationCap, label: 'Rapor Murid', color: 'sky' },
      { id: 'statistik', icon: TrendingUp, label: 'Statistik', color: 'emerald' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { id: 'pengumuman', icon: Megaphone, label: 'Pengumuman', color: 'rose' },
      { id: 'pengaturan-sistem', icon: SettingsIcon, label: 'Pengaturan', color: 'slate' },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

const colorClasses: Record<string, { active: string; inactive: string; dot: string }> = {
  emerald: { active: 'bg-emerald-600 text-white shadow-sm', inactive: 'hover:border-emerald-300 hover:bg-emerald-50/50', dot: 'bg-emerald-500' },
  sky: { active: 'bg-sky-600 text-white shadow-sm', inactive: 'hover:border-sky-300 hover:bg-sky-50/50', dot: 'bg-sky-500' },
  amber: { active: 'bg-amber-600 text-white shadow-sm', inactive: 'hover:border-amber-300 hover:bg-amber-50/50', dot: 'bg-amber-500' },
  violet: { active: 'bg-violet-600 text-white shadow-sm', inactive: 'hover:border-violet-300 hover:bg-violet-50/50', dot: 'bg-violet-500' },
  rose: { active: 'bg-rose-600 text-white shadow-sm', inactive: 'hover:border-rose-300 hover:bg-rose-50/50', dot: 'bg-rose-500' },
  slate: { active: 'bg-slate-600 text-white shadow-sm', inactive: 'hover:border-slate-300 hover:bg-slate-50/50', dot: 'bg-slate-500' },
};

export default function AdminPage({ showToast, profile, initialSection }: Props) {
  const [section, setSection] = useState<AdminSectionId>(() => {
    if (initialSection && SECTION_MAP[initialSection]) return SECTION_MAP[initialSection];
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] && SECTION_MAP[hashParts[1]]) return SECTION_MAP[hashParts[1]];
    return 'dashboard';
  });

  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[1] && SECTION_MAP[hashParts[1]]) setSection(SECTION_MAP[hashParts[1]]);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSectionChange = (s: AdminSectionId) => {
    setSection(s);
    window.history.pushState(null, '', `#admin/${s}`);
    setMobileNavOpen(false);
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const currentItem = ALL_NAV_ITEMS.find(i => i.id === section);

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Akses ditolak</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Admin Header Bar */}
      <div className="mb-4 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">Panel Admin</h2>
              <p className="text-[10px] text-slate-300 truncate">
                {currentItem ? currentItem.label : 'Dashboard'} • {profile?.nama_panggilan || 'Admin'}
              </p>
            </div>
          </div>
          {section !== 'dashboard' && (
            <button
              onClick={() => handleSectionChange('dashboard')}
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop: Grouped horizontal nav */}
      <div className="hidden md:block mb-4 space-y-2">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider w-20 flex-shrink-0">{group.label}</span>
            <div className="flex gap-1.5 flex-wrap">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = section === item.id;
                const c = colorClasses[item.color] || colorClasses.slate;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${isActive ? c.active : `bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 ${c.inactive}`}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Collapsible nav */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setMobileNavOpen(v => !v)}
          className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <span className="flex items-center gap-2">
            {currentItem && (() => { const Icon = currentItem.icon; return <Icon className="w-4 h-4" />; })()}
            {currentItem?.label || 'Pilih Menu'}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
        </button>
        {mobileNavOpen && (
          <div className="mt-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg space-y-3 max-h-80 overflow-y-auto">
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">{group.label}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = section === item.id;
                    const c = colorClasses[item.color] || colorClasses.slate;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSectionChange(item.id)}
                        className={`flex items-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-semibold transition-all border ${isActive ? c.active : `bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600`}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- SECTION CONTENT DIBUNGKUS SUSPENSE --- */}
      <Suspense 
        fallback={
          <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
            <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3"></div>
            <p className="text-sm font-semibold text-slate-500">Memuat modul...</p>
          </div>
        }
      >
        {section === 'dashboard' && <AdminDashboard onViewChange={handleSectionChange} profile={profile} />}
        {section === 'kelola-user' && <KelolaUserSection showToast={showToast} profile={profile} />}
        {section === 'data-master' && <DataMasterSection showToast={showToast} profile={profile} />}
        {section === 'jadwal' && <JadwalSection showToast={showToast} profile={profile} />}
        {section === 'akademik' && <AkademikSection showToast={showToast} />}
        {section === 'presensi' && <PresensiSection showToast={showToast} />}
        {section === 'penilaian' && <PenilaianSection showToast={showToast} />}
        {section === 'data-murid' && <DataMuridSection showToast={showToast} profile={profile} />}
        {section === 'pengumuman' && <AdminPengumuman showToast={showToast} />}
        {section === 'laporan' && <LaporanSection showToast={showToast} />}
        {section === 'rapor-ustaz' && <RaporUstazPage showToast={showToast} />}
        {section === 'rapor-murid' && <RaporPage showToast={showToast} />}
        {section === 'pengaturan-sistem' && <PengaturanSistemSection showToast={showToast} profile={profile} />}
        {section === 'statistik' && <StatistikSection showToast={showToast} />}
      </Suspense>
    </div>
  );
}
