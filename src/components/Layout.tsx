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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ActiveTab, Profile } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface LayoutProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  profile?: Profile | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const navItems: { id: ActiveTab; icon: React.ElementType; label: string; adminOnly?: boolean }[] = [
  { id: 'dashboard', icon: Home, label: 'Beranda' },
  { id: 'jadwal', icon: CalendarDays, label: 'Jadwal' },
  { id: 'murid', icon: Users, label: 'Santri' },
  { id: 'absensi', icon: ClipboardCheck, label: 'Absensi' },
  { id: 'jurnal', icon: FileText, label: 'Jurnal' },
  { id: 'nilai', icon: BarChart3, label: 'Nilai' },
  { id: 'sikap', icon: Heart, label: 'Sikap' },
  { id: 'catatan', icon: BookOpen, label: 'Catatan' },
  { id: 'soal', icon: FileQuestion, label: 'Bank Soal' },
  { id: 'izin', icon: ClipboardCheck, label: 'Perizinan' },
  { id: 'rapor', icon: GraduationCap, label: 'Rapor' },
  { id: 'admin', icon: Shield, label: 'Panel Admin', adminOnly: true },
];

export default function Layout({ activeTab, setActiveTab, profile, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isInstallable, installPWA } = usePWAInstall();

  // Filter menu berdasarkan role admin database
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return profile?.role === 'admin';
    }
    return true;
  });

  const handleNav = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 shrink-0 fixed h-screen">
        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            A
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm tracking-wide leading-tight">Sistem Akademik</h1>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Dashboard Portal</p>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Info Akun Pengguna (Bottom Sidebar Desktop) */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/50">
          <button
            onClick={() => handleNav('profil')}
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white transition-all text-left group border border-transparent hover:border-slate-100"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
              {profile?.nama_lengkap ? profile.nama_lengkap[0].toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                {profile?.nama_lengkap || 'Pengguna'}
              </p>
              {/* Diubah: Hanya menampilkan id_login, menyembunyikan role & uuid */}
              <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                @{profile?.id_login || 'id_login'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors mt-2"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* WRAPPER HALAMAN UTAMA */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* HEADER MOBILE */}
        <header className="lg:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 active:scale-95 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <span className="font-bold text-slate-800 text-sm tracking-wide">Sistem Akademik</span>
            </div>
          </div>

          <button
            onClick={() => handleNav('profil')}
            className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs"
          >
            {profile?.nama_lengkap ? profile.nama_lengkap[0].toUpperCase() : <User className="w-3 h-3" />}
          </button>
        </header>

        {/* KONTEN UTAMA */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* DRAWER MENU MOBILE (SLIDE OUT DI SIDEBAR) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white flex flex-col z-50 animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-base">
                  A
                </div>
                <span className="font-bold text-slate-800 text-sm">Sistem Navigasi</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profil Ringkas Di Bagian Atas Drawer Mobile */}
            <div className="p-4 border-b border-slate-50 flex items-center gap-3 bg-emerald-50/30">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {profile?.nama_lengkap ? profile.nama_lengkap[0].toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-800 text-sm truncate">{profile?.nama_lengkap || 'Pengguna'}</h4>
                {/* Diubah: Hanya menampilkan id_login, menyembunyikan role & uuid */}
                <p className="text-xs font-mono text-slate-400 truncate">@{profile?.id_login || 'id_login'}</p>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {filteredNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Tombol PWA Install & Logout di bagian bawah Drawer */}
            <div className="p-3 border-t border-slate-50 bg-slate-50/50 space-y-1">
              {isInstallable && (
                <button
                  onClick={installPWA}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Instal Aplikasi</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* BOTTOM NAV BAR MOBILE (Akses Cepat 6 Menu Utama) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 flex justify-around px-1 py-1.5 overflow-x-auto">
        {filteredNavItems.slice(0, 6).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[52px] transition-all ${
                isActive ? 'text-emerald-600' : 'text-slate-400'
              }`}
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
        {/* Tombol pemicu laci menu jika item lebih dari 6 */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[52px] text-slate-400"
        >
          <div className="p-1.5 rounded-xl mb-0.5">
            <Menu className="w-[18px] h-[18px]" />
          </div>
          <span className="text-[9px] leading-none font-medium">Menu</span>
        </button>
      </nav>
    </div>
  );
}
