import {
  CalendarDays,
  ClipboardCheck,
  BookOpen,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
  Heart,
  FileQuestion,
  Home,
  FileText,
  Shield,
  Download,
  GraduationCap,
  Camera,
  Megaphone,
  LayoutDashboard,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActiveTab, Profile } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface LayoutProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  profile?: Profile | null;
  onLogout: () => void;
  children: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: { id: ActiveTab; icon: React.ElementType; label: string; adminOnly?: boolean }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { id: 'dashboard', icon: Home, label: 'Beranda' },
      { id: 'jadwal', icon: CalendarDays, label: 'Jadwal' },
      { id: 'murid', icon: Users, label: 'Santri' },
    ],
  },
  {
    label: 'KBM',
    items: [
      { id: 'absensi', icon: ClipboardCheck, label: 'Absensi' },
      { id: 'presensi', icon: Camera, label: 'Presensi' },
      { id: 'jurnal', icon: FileText, label: 'Jurnal' },
      { id: 'nilai', icon: BarChart3, label: 'Nilai' },
      { id: 'sikap', icon: Heart, label: 'Sikap' },
    ],
  },
  {
    label: 'Lainnya',
    items: [
      { id: 'catatan', icon: BookOpen, label: 'Catatan' },
      { id: 'soal', icon: FileQuestion, label: 'Soal' },
      { id: 'izin', icon: FileText, label: 'Izin' },
      { id: 'rapor', icon: GraduationCap, label: 'Rapor' },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { id: 'admin',                icon: Shield,           label: 'Panel Admin',       adminOnly: true },
      { id: 'admin-presensi-ustaz', icon: ClipboardCheck,   label: 'Presensi Ustaz',    adminOnly: true },
      { id: 'admin-jadwal-ustaz',   icon: CalendarDays,     label: 'Jadwal Ustaz',      adminOnly: true },
      { id: 'admin-data-santri',    icon: Users,            label: 'Data Santri',       adminOnly: true },
      { id: 'admin-jadwal-asatiz',  icon: BookOpen,         label: 'Jadwal Asatiz',     adminOnly: true },
      { id: 'admin-kelola-lembaga', icon: Building2,        label: 'Kelola Lembaga',    adminOnly: true },
      { id: 'pengumuman',           icon: Megaphone,        label: 'Pengumuman',        adminOnly: true },
      { id: 'presensi-admin',       icon: LayoutDashboard,  label: 'Presensi Admin',    adminOnly: true },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);

const bottomNavItems: ActiveTab[] = ['dashboard', 'jadwal', 'absensi', 'presensi', 'murid', 'jurnal'];

export default function Layout({ activeTab, setActiveTab, profile, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const { isInstallable, isInstalled, promptInstall, dismissInstall } = usePWAInstall();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleNav = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const activeLabel = activeTab === 'profil' ? 'Profil Pengguna' : allNavItems.find(n => n.id === activeTab)?.label ?? 'Beranda';
  const displayName = profile?.nama_panggilan || profile?.nama_lengkap?.split(' ')[0] || 'Ustaz';
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : profile?.role === 'operator' ? 'Operator' : 'Ustaz';

  const renderNavGroups = () => (
    <>
      {navGroups.map(group => {
        const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
        if (visibleItems.length === 0) return null;
        return (
          <div key={group.label} className="mb-1">
            <p className="px-4 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">{group.label}</p>
            {visibleItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`nav-item w-full text-left ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-sm">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-emerald-400" />}
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:pl-64">
      {/* Sidebar Desktop */}
      <nav className="hidden md:flex flex-col w-64 bg-white shadow-sm border-r border-slate-100 fixed top-0 bottom-0 left-0 z-40">
        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 p-0.5 shadow-lg">
              <img src="/icon/logo_asli.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight">SIM KBM Ustaz</p>
              <p className="text-[10px] text-emerald-100">V2.0 Multi-Tenant</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2">
          {renderNavGroups()}
        </div>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <button
            onClick={() => handleNav('profil')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left ${activeTab === 'profil' ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'hover:bg-slate-50'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activeTab === 'profil' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 capitalize">{roleLabel}</p>
            </div>
          </button>

          {isInstallable && !isInstalled && (
            <button
              onClick={promptInstall}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Instal Aplikasi</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-rose-500 hover:bg-rose-50 px-4 py-2.5 rounded-xl font-semibold transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </nav>

      {/* Mobile Overlay & Sidebar Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl md:hidden flex flex-col"
            >
              <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg">
                    <img src="/icon/logo_asli.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-bold">SIM KBM</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 py-3 px-2 overflow-y-auto">
                {renderNavGroups()}
              </div>
              <div className="p-3 border-t border-slate-100 space-y-2">
                {isInstallable && !isInstalled && (
                  <button
                    onClick={() => { promptInstall(); setSidebarOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instal Aplikasi</span>
                  </button>
                )}
                <button
                  onClick={() => { onLogout(); setSidebarOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 text-rose-500 hover:bg-rose-50 px-4 py-2.5 rounded-xl font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header Mobile & Desktop */}
      <header className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 active:scale-95 transition-transform"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="md:hidden w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 p-0.5 shadow">
                <img src="/icon/logo_asli.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 leading-tight">
                  <span className="md:hidden">{activeLabel}</span>
                  <span className="hidden md:inline">SIM KBM Ustaz</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">
                  {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => handleNav('profil')}
              className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all ${activeTab === 'profil' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
              title="Ke Halaman Profil"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] z-30 flex justify-around px-1 py-1.5 overflow-x-auto">
        {bottomNavItems.map(tabId => {
          const item = allNavItems.find(n => n.id === tabId);
          if (!item) return null;
          if (item.adminOnly && !isAdmin) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[52px] transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <div className={`p-1.5 rounded-xl mb-0.5 transition-colors ${isActive ? 'bg-emerald-50' : ''}`}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <span className={`text-[9px] leading-none ${isActive ? 'font-bold text-emerald-600' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[52px] text-slate-400"
        >
          <div className="p-1.5 rounded-xl mb-0.5">
            <Menu className="w-[18px] h-[18px]" />
          </div>
          <span className="text-[9px] leading-none font-medium">Lainnya</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
