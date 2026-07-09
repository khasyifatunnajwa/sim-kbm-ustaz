import {
  CalendarDays, ClipboardCheck, BookOpen, BarChart3, Users, LogOut,
  Menu, X, Heart, FileQuestion, Home, FileText,
  Shield, Download, GraduationCap, Camera, Bell, Megaphone,
  LayoutDashboard, ChevronRight,
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

interface NavItem {
  id: ActiveTab;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { id: 'dashboard',  icon: Home,          label: 'Beranda' },
      { id: 'jadwal',     icon: CalendarDays,   label: 'Jadwal' },
      { id: 'murid',      icon: Users,          label: 'Santri' },
    ],
  },
  {
    label: 'KBM',
    items: [
      { id: 'absensi',  icon: ClipboardCheck, label: 'Absensi' },
      { id: 'presensi', icon: Camera,          label: 'Presensi' },
      { id: 'jurnal',   icon: FileText,        label: 'Jurnal' },
      { id: 'nilai',    icon: BarChart3,        label: 'Nilai' },
      { id: 'sikap',    icon: Heart,            label: 'Sikap' },
    ],
  },
  {
    label: 'Lainnya',
    items: [
      { id: 'catatan', icon: BookOpen,       label: 'Catatan' },
      { id: 'soal',    icon: FileQuestion,   label: 'Soal' },
      { id: 'izin',    icon: FileText,       label: 'Izin' },
      { id: 'rapor',   icon: GraduationCap,  label: 'Rapor' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { id: 'admin',          icon: Shield,           label: 'Panel Admin',      adminOnly: true },
      { id: 'pengumuman',     icon: Megaphone,        label: 'Pengumuman',       adminOnly: true },
      { id: 'presensi-admin', icon: LayoutDashboard,  label: 'Presensi Admin',   adminOnly: true },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);

const bottomNavItems: NavItem[] = [
  { id: 'dashboard', icon: Home,          label: 'Beranda' },
  { id: 'jadwal',    icon: CalendarDays,  label: 'Jadwal' },
  { id: 'presensi',  icon: Camera,        label: 'Presensi' },
  { id: 'murid',     icon: Users,         label: 'Santri' },
  { id: 'jurnal',    icon: FileText,      label: 'Jurnal' },
];

export default function Layout({ activeTab, setActiveTab, profile, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const isAdmin = profile?.role === 'admin';
  const displayName = profile?.nama_panggilan || profile?.nama_lengkap?.split(' ')[0] || 'Ustaz';
  const roleLabel =
    profile?.role === 'admin' ? 'Administrator' :
    profile?.role === 'operator' ? 'Operator' : 'Ustaz';

  const activeNavItem = allNavItems.find(n => n.id === activeTab);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleNav = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    window.history.pushState(null, '', `#${tab}`);
  };

  const renderSidebarContent = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navGroups.map(group => {
          const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
          if (!visibleItems.length) return null;
          return (
            <div key={group.label} className="mb-1">
              <p className="section-label px-3 py-2">{group.label}</p>
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`nav-item w-full text-left ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    <span className="flex-1 text-sm">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="px-2 pb-3 pt-2 space-y-0.5 border-t border-slate-100 dark:border-slate-700/50 flex-shrink-0">
        {isInstallable && !isInstalled && (
          <button
            onClick={() => { promptInstall(); setSidebarOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold transition-colors"
          >
            <Download size={16} />
            <span>Pasang Aplikasi</span>
          </button>
        )}

        <button
          onClick={() => handleNav('profil')}
          className={`nav-item w-full text-left ${activeTab === 'profil' ? 'nav-item-active' : 'nav-item-inactive'}`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${activeTab === 'profil' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{displayName}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{roleLabel}</p>
          </div>
          <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
        </button>

        <button
          onClick={onLogout}
          className="nav-item nav-item-inactive w-full text-left text-rose-500 dark:text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          <LogOut size={18} />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </div>
  );

  const LogoBrand = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
    <div className="flex items-center gap-2.5">
      {/* Logo container — fixed size, no overflow clip that cuts the image */}
      <div className={`${size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm flex-shrink-0`}>
        <img
          src="/icon/logo_asli.png"
          alt="Logo"
          className={`${size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'} object-contain`}
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
      <div className="min-w-0">
        <p className={`font-bold text-slate-800 dark:text-slate-100 leading-tight ${size === 'sm' ? 'text-sm' : 'text-sm'}`}>SIM KBM</p>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-tight">Ustaz Three</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] pb-20 md:pb-0 md:pl-60">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <nav className="hidden md:flex flex-col w-60 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 fixed top-0 bottom-0 left-0 z-40">
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <LogoBrand />
        </div>
        {renderSidebarContent()}
      </nav>

      {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col md:hidden"
            >
              <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <LogoBrand />
                <button onClick={() => setSidebarOpen(false)} className="btn-icon flex-shrink-0">
                  <X size={18} />
                </button>
              </div>
              {renderSidebarContent()}
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* ─── MOBILE HEADER ─── */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="btn-icon -ml-1">
              <Menu size={20} />
            </button>
            {/* Mobile: just show the active tab title */}
            <span className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
              {activeNavItem?.label ?? 'Beranda'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNav('profil')}
              className="btn-icon relative"
            >
              <Bell size={18} />
            </button>
            <button
              onClick={() => handleNav('profil')}
              className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm flex-shrink-0"
            >
              {displayName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* ─── DESKTOP HEADER ─── */}
      <header className="hidden md:flex sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100/80 dark:border-slate-800 items-center justify-between px-6 h-14">
        <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
          {activeNavItem?.label ?? 'Beranda'}
        </span>
        <button
          onClick={() => handleNav('profil')}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">{displayName}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize leading-tight">{roleLabel}</p>
          </div>
        </button>
      </header>

      {/* ─── BOTTOM NAV (MOBILE) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-t border-slate-100/80 dark:border-slate-800" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center px-1 h-16">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative group"
                style={{ minWidth: 0 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-2 inset-x-1.5 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/25"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
                  />
                  <span className={`text-[10px] font-semibold leading-tight transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <main className="px-4 py-5 md:px-6 md:py-6">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
