import { useState, useEffect } from 'react';
import {
  Shield, ArrowLeft, LayoutDashboard, Users, Building2, Calendar,
  BookOpen, CheckCircle, Award, GraduationCap, Megaphone, FileText,
  Settings as SettingsIcon, TrendingUp,
} from 'lucide-react';
import type { ShowToast, Profile, ActiveTab } from '../types';
import AdminDashboard, { type AdminSectionId } from './admin/AdminDashboard';
import KelolaUserSection from './admin/KelolaUserSection';
import DataMasterSection from './admin/DataMasterSection';
import JadwalSection from './admin/JadwalSection';
import AkademikSection from './admin/AkademikSection';
import PresensiSection from './admin/PresensiSection';
import PenilaianSection from './admin/PenilaianSection';
import DataMuridSection from './admin/DataMuridSection';
import LaporanSection from './admin/LaporanSection';
import PengaturanSistemSection from './admin/PengaturanSistemSection';
import StatistikSection from './admin/StatistikSection';
import AdminPengumuman from './AdminPengumumanPage';

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
  'pengaturan-sistem': 'pengaturan-sistem',
  'statistik': 'statistik',
};

const NAV_ITEMS: { id: AdminSectionId; icon: React.ElementType; label: string; color: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'emerald' },
  { id: 'kelola-user', icon: Users, label: 'Kelola User', color: 'emerald' },
  { id: 'data-master', icon: Building2, label: 'Data Master', color: 'sky' },
  { id: 'jadwal', icon: Calendar, label: 'Jadwal', color: 'amber' },
  { id: 'akademik', icon: BookOpen, label: 'Akademik', color: 'emerald' },
  { id: 'presensi', icon: CheckCircle, label: 'Presensi', color: 'emerald' },
  { id: 'penilaian', icon: Award, label: 'Penilaian', color: 'violet' },
  { id: 'data-murid', icon: GraduationCap, label: 'Data Murid', color: 'sky' },
  { id: 'pengumuman', icon: Megaphone, label: 'Pengumuman', color: 'rose' },
  { id: 'laporan', icon: FileText, label: 'Laporan', color: 'rose' },
  { id: 'pengaturan-sistem', icon: SettingsIcon, label: 'Pengaturan Sistem', color: 'slate' },
  { id: 'statistik', icon: TrendingUp, label: 'Statistik', color: 'emerald' },
];

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
  };

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
      {/* Section Nav Pills */}
      {section !== 'dashboard' && (
        <button onClick={() => handleSectionChange('dashboard')} className="mb-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard
        </button>
      )}

      {/* Horizontal scrollable nav */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${isActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
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
      {section === 'pengaturan-sistem' && <PengaturanSistemSection showToast={showToast} profile={profile} />}
      {section === 'statistik' && <StatistikSection showToast={showToast} />}
    </div>
  );
}
