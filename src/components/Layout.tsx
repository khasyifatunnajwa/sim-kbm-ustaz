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
  Bell,
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
      { id: 'admin', icon: Shield, label: 'Admin', adminOnly: true },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);

const bottomNavItems: { id: ActiveTab; icon: React.ElementType; label: string }[] = [
  { id: 'dashboard', icon: Home, label: 'Beranda' },
  { id: 'jadwal', icon: CalendarDays, label: 'Jadwal' },
  { id: 'presensi', icon: Camera, label: 'Presensi' },
  { id: 'murid', icon: Users, label: 'Santri' },
  { id: 'jurnal', icon: FileText, label: 'Jurnal' },
];

export default function Layout({ activeTab, setActiveTab, profile, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const isAdmin = profile?.role === 'admin';
  const displayName = profile?.nama_panggilan || profile?.nama_lengkap?.split(' ')[0] || 'Ustaz';
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : profile?.role === 'operator' ? 'Operator' : 'Ustaz';

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
    window.history.pushState(null, '', `#${tab}`);
  };

  const renderNavGroups = () => (
    <>
      {navGroups.map(group => {
        const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
        if (visibleItems.length === 0) return null;
        return (
          <div key={group.label} className="mb-1">
            <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.label}</p>
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
    <div className="min-h-screen bg-[#F5F6FA] pb-20 md:pb-0 md:pl-64">
      {/* Sidebar Desktop */}
      <nav className="hidden md:flex flex-col w-64 bg-white shadow-sm border-r border-slate-100 fixed top-0 bottom-0 left-0 z-40">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
              <img src="/icon/logo_asli.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base leading-tight">SIM KBM</p>
              <p className="text-[10px] text-slate-400 font-medium">Ustaz Three</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2">
          {renderNavGroups()}
        </div>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <button
            onClick={() => handleNav('profil')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${activeTab === 'profil' ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'hover:bg-slate-50'}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${activeTab === 'profil' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 capitalize">{roleLabel}</p>
            </div>
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
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

      {/* Mobile Overlay & Sidebar */}
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
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow">
                    <img src="/icon/logo_asli.png" alt="Logo" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">SIM KBM</p>
                    <p className="text-[10px] text-slate-400">Ustaz Three</p>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 py-3 px-2 overflow-y-auto">
                {renderNavGroups()}
              </div>
              <div className="p-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => handleNav('profil')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${activeTab === 'profil' ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 font-bold text-sm text-emerald-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{roleLabel}</p>
                  </div>
                </button>
                {isInstallable && !isInstalled && (
                  <button
                    onClick={() => { promptInstall(); setSidebarOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instal Aplikasi</span>
                  </button>
                )}
                <button
                  onClick={() => { onLogout(); setSidebarOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 text-rose-500 hover:bg-rose-50 px-4 py-2.5 rounded-xl font-semibold transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-700 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                <img src="/icon/logo_asli.png" alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="font-bold text-slate-800 text-base">Ustaz Three</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNav('profil')}
              className="relative w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
            </button>
            <button
              onClick={() => handleNav('profil')}
              className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
            >
              <User className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="px-6 py-3 flex items-center justify-between max-w-5xl mx-auto ml-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-base">
              {allNavItems.find(n => n.id === activeTab)?.label ?? 'Beranda'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav('profil')}
              className="flex items-center gap-2.5 hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-sm text-emerald-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700">{displayName}</p>
                <p className="text-[10px] text-slate-400 capitalize">{roleLabel}</p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-100 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] z-30">
        <div className="flex justify-around items-center px-2 py-2">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl min-w-[52px] transition-all active:scale-95 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                <Icon className={`w-[22px] h-[22px] ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`text-[10px] leading-none font-semibold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-4 md:p-6">
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
