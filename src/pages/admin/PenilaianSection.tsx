import { useState } from 'react';
import { Award, BookOpen, FileText, Mic, BookMarked, BookCheck, Smile, ScrollText } from 'lucide-react';
import { ShowToast } from '../../types';

type SubTab = 'harian' | 'uts' | 'uas' | 'lisan' | 'hafalan' | 'baca-kitab' | 'sikap' | 'rapor';

export default function PenilaianSection({ showToast }: { showToast: ShowToast }) {
  const [subTab, setSubTab] = useState<SubTab>('harian');

  const subTabs = [
    { id: 'harian' as SubTab, label: 'Nilai Harian', icon: Award },
    { id: 'uts' as SubTab, label: 'UTS', icon: FileText },
    { id: 'uas' as SubTab, label: 'UAS', icon: FileText },
    { id: 'lisan' as SubTab, label: 'Ujian Lisan', icon: Mic },
    { id: 'hafalan' as SubTab, label: 'Hafalan', icon: BookMarked },
    { id: 'baca-kitab' as SubTab, label: 'Baca Kitab', icon: BookOpen },
    { id: 'sikap' as SubTab, label: 'Sikap', icon: Smile },
    { id: 'rapor' as SubTab, label: 'Rapor', icon: ScrollText },
  ];

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Penilaian</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Kelola berbagai jenis penilaian dan rapor</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {subTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${subTab === t.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="card p-6 text-center">
        {(() => {
          const Icon = subTabs.find(t => t.id === subTab)?.icon ?? Award;
          const label = subTabs.find(t => t.id === subTab)?.label ?? '';
          return (
            <>
              <Icon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
              <p className="text-xs text-slate-400 mt-1">Kelola data {label.toLowerCase()} dari menu utama ustaz</p>
            </>
          );
        })()}
      </div>
    </div>
  );
}
