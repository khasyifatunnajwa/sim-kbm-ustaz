import {
  CalendarDays, ClipboardCheck, BookOpen, BarChart3, Users,
  Bell, LogOut, Menu, X, User, ChevronRight, Heart, FileQuestion, School,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ActiveTab } from '../types';

interface LayoutProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userEmail?: string;
  onLogout: () => void;
  children: React.ReactNode;
}

const navItems: { id: ActiveTab; icon: React.ElementType; label: string }[] = [
  { id: 'kelas',   icon: School,         label: 'Kelas' },
  { id: 'murid',   icon: Users,          label: 'Santri' },
  { id: 'jadwal',  icon: CalendarDays,   label: 'Jadwal' },
  { id: 'absensi', icon: ClipboardCheck, label: 'Absensi' },
  { id: 'kbm',     icon: BookOpen,       label: 'Buku Saku' },
  { id: 'sikap',   icon: Heart,          label: 'Sikap' },
  { id: 'nilai',   icon: BarChart3,      label: 'Nilai' },
  { id: 'soal',    icon: FileQuestion,   label: 'Soal' },
  { id: 'agenda',  icon: Bell,           label: 'Agenda' },
];

// Bottom nav mobile: 5 item pertama saja
const bottomNav = navItems.slice(0, 5);

export default function Layout({ activeTab, setActiveTab, userEmail, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleNav = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const activeLabel = navItems.find(n => n.id === activeTab)?.label ?? '';
  const isInBottomNav = bottomNav.some(n => n.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:pl-64">
      {/* ===== Sidebar Desktop ===== */}
      <nav className="hidden md:flex flex-col w-64 bg-white shadow-sm border-r border-slate-100 fixed top-0 bottom-0 left-0 z-40">
        <div className="p-5 bg-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight">SIM KBM Ustaz</p>
              <p className="text-[10px] text-emerald-100">Portal Manajemen Kelas</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => {
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

        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-600 truncate">{userEmail ?? 'Ustaz'}</span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-rose-500 hover:bg-rose-50 px-4 py-2.5 rounded-xl font-semibold transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </nav>

      {/* ===== Mobile Sidebar Overlay ===== */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl md:hidden flex flex-col">
            <div className="p-5 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6" />
                <span className="font-bold">SIM KBM Ustaz</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`nav-item w-full text-left ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => { onLogout(); setSidebarOpen(false); }}
                className="w-full flex items-center justify-center gap-2 text-rose-500 hover:bg-rose-50 px-4 py-2.5 rounded-xl font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== Header ===== */}
      <header className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 active:scale-95 transition-transform"
            >
              <Menu className="w-5 h-5" />
            </button>
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
          <div className="md:hidden">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>
      </header>

      {/* ===== Bottom Nav Mobile ===== */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] z-30 flex justify-around px-1 py-1.5">
        {bottomNav.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[48px] transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <div className={`p-1.5 rounded-xl mb-0.5 ${isActive ? 'bg-emerald-50' : ''}`}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <span className={`text-[9px] leading-none ${isActive ? 'font-bold text-emerald-600' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        {/* Tombol Lainnya — buka sidebar untuk menu sisanya */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[48px] transition-all ${
            !isInBottomNav ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <div className={`p-1.5 rounded-xl mb-0.5 ${!isInBottomNav ? 'bg-emerald-50' : ''}`}>
            <Menu className="w-[18px] h-[18px]" />
          </div>
          <span className="text-[9px] leading-none font-medium">Lainnya</span>
        </button>
      </nav>

      {/* ===== Main Content ===== */}
      <main className="p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
