import { useState } from 'react';
import { FileText, Download, FileSpreadsheet, Calendar, BookOpen, FileCheck, Users, UserCheck, Repeat } from 'lucide-react';
import { ShowToast } from '../../types';

type SubTab = 'presensi-ustaz' | 'presensi-murid' | 'nilai' | 'kbm' | 'jurnal' | 'jadwal' | 'guru-pengganti';

export default function LaporanSection({ showToast }: { showToast: ShowToast }) {
  const [subTab, setSubTab] = useState<SubTab>('presensi-ustaz');
  const [period, setPeriod] = useState<'bulanan' | 'semester'>('bulanan');

  const subTabs = [
    { id: 'presensi-ustaz' as SubTab, label: 'Presensi Ustaz', icon: Users },
    { id: 'presensi-murid' as SubTab, label: 'Presensi Murid', icon: UserCheck },
    { id: 'nilai' as SubTab, label: 'Nilai', icon: FileCheck },
    { id: 'kbm' as SubTab, label: 'KBM', icon: BookOpen },
    { id: 'jurnal' as SubTab, label: 'Jurnal', icon: FileText },
    { id: 'jadwal' as SubTab, label: 'Jadwal', icon: Calendar },
    { id: 'guru-pengganti' as SubTab, label: 'Guru Pengganti', icon: Repeat },
  ];

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Laporan</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Export dan cetak laporan dalam format PDF/Excel</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {subTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${subTab === t.id ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Period toggle */}
      <div className="flex gap-1.5">
        <button onClick={() => setPeriod('bulanan')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === 'bulanan' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>Rekap Bulanan</button>
        <button onClick={() => setPeriod('semester')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === 'semester' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>Rekap Semester</button>
      </div>

      {/* Export buttons */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          {(() => {
            const Icon = subTabs.find(t => t.id === subTab)?.icon ?? FileText;
            return <Icon className="w-5 h-5 text-rose-600" />;
          })()}
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Laporan {subTabs.find(t => t.id === subTab)?.label}</p>
            <p className="text-[10px] text-slate-400">Periode: {period === 'bulanan' ? 'Bulanan' : 'Semester'}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3">Pilih format export untuk mengunduh laporan:</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => showToast('Export PDF akan tersedia segera', 'info')} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all active:scale-95">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={() => showToast('Export Excel akan tersedia segera', 'info')} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all active:scale-95">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>
    </div>
  );
}
