import {
  CalendarDays, ClipboardCheck, BookOpen, BarChart3, Users,
  LogOut, Menu, X, User, ChevronRight, ChevronDown, Heart,
  FileQuestion, Home, FileText, Shield, Download, GraduationCap,
  Camera, Megaphone, LayoutDashboard, Building2, Database, Settings, History,
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
  collapsible?: boolean;
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
    collapsible: true,
    items: [
      { id: 'admin', icon: Shield, label: 'Panel Admin', adminOnly: true },
      { id: 'admin-kelola-user', icon: Users, label: 'Kelola User', adminOnly: true },
      { id: 'admin-data-master', icon: Database, label: 'Data Master', adminOnly: true },
      { id: 'admin-jadwal', icon: CalendarDays, label: 'Jadwal', adminOnly: true },
      { id: 'admin-akademik', icon: BookOpen, label: 'Akademik', adminOnly: true },
      { id: 'admin-presensi', icon: ClipboardCheck, label: 'Presensi', adminOnly: true },
      { id: 'admin-penilaian', icon: BarChart3, label: 'Penilaian', adminOnly: true },
      { id: 'admin-pengumuman', icon: Megaphone, label: 'Pengumuman', adminOnly: true },
      { id: 'admin-laporan', icon: FileText, label: 'Laporan', adminOnly: true },
      { id: 'admin-statistik', icon: BarChart3, label: 'Statistik', adminOnly: true },
      { id: 'admin-pengaturan', icon: Settings, label: 'Pengaturan', adminOnly: true },
      { id: 'admin-audit', icon: History, label: 'Audit', adminOnly: true },
      { id: 'presensi-admin', icon: LayoutDashboard, label: 'Presensi Admin', adminOnly: true },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);
const bottomNavItems: ActiveTab[] = ['dashboard', 'jadwal', 'presensi', 'nilai', 'murid'];

export default function Layout({ activeTab, setActiveTab, profile, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [now, setNow] = useState(new Date());
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

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

  // Auto-expand admin group if active tab is in admin section
  useEffect(() => {
    if (navGroups[3].items.some(item => item.id === activeTab)) {
      setAdminExpanded(true);
    }
  }, [activeTab]);

  const handleNav = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    window.history.pushState(null, '', `#${tab}`);
  };

  const activeLabel = activeTab === 'profil' ? 'Profil' : allNavItems.find(n => n.id === activeTab)?.label ?? 'Beranda';
  const displayName = profile?.nama_panggilan || profile?.nama_lengkap?.split(' ')[0] || 'Ustaz';
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : profile?.role === 'operator' ? 'Operator' : 'Ustaz';

  const renderNavGroups = () => (
    <>
      {navGroups.map((group, gi) => {
        const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
        if (visibleItems.length === 0) return null;

        // Admin group: collapsible
        if (group.collapsible && group.label === 'Administrasi') {
          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => setAdminExpanded(prev => !prev)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <span>{group.label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${adminExpanded ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {adminExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {visibleItems.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNav(item.id)}
                          className={`nav-item w-full text-left ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                        >
                          <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }

        return (
          <div key={group.label} className="mb-1">
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.label}</p>
            {visibleItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`nav-item w-full text-left ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16 md:pb-0 md:pl-60">
      {/* Sidebar Desktop */}
      <nav className="hidden md:flex flex-col w-60 bg-white dark:bg-slate-800 shadow-sm border-r border-slate-200 dark:border-slate-700 fixed top-0 bottom-0 left-0 z-40">
        {/* Logo Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 p-0.5 shadow-sm border border-slate-100">
              <img src="/icon/logo_asli.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">SIM KBM Ustaz</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">V2.0 Multi-Tenant</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-2 px-1.5">
          {renderNavGroups()}
        </div>

        {/* User Footer */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
          <button
            onClick={() => handleNav('profil')}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors text-left ${activeTab === 'profil' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${activeTab === 'profil' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{roleLabel}</p>
            </div>
          </button>

          {isInstallable && !isInstalled && (
            <button
              onClick={promptInstall}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instal</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
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
              className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-800 z-50 shadow-2xl md:hidden flex flex-col"
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-0.5 shadow-sm border border-slate-100">
                    <img src="/icon/logo_asli.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">SIM KBM</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 py-2 px-1.5 overflow-y-auto">
                {renderNavGroups()}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                {isInstallable && !isInstalled && (
                  <button
                    onClick={() => { promptInstall(); setSidebarOpen(false); }}
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Instal Aplikasi</span>
                  </button>
                )}
                <button
                  onClick={() => { onLogout(); setSidebarOpen(false); }}
                  className="w-full flex items-center justify-center gap-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="md:hidden w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 p-0.5 shadow-sm border border-slate-100">
                <img src="/icon/logo_asli.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  <span className="md:hidden">{activeLabel}</span>
                  <span className="hidden md:inline">SIM KBM Ustaz</span>
                </h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
                  {now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNav('profil')}
              className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all ${activeTab === 'profil' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'}`}
              title="Profil"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-30 flex justify-around px-1 py-1">
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
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg min-w-[48px] transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className={`text-[9px] leading-none mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg min-w-[48px] text-slate-400"
        >
          <Menu className="w-[18px] h-[18px]" />
          <span className="text-[9px] leading-none mt-0.5 font-medium">Menu</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="p-3.5 md:p-5">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
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
