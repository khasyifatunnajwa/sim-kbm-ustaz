import { useState } from 'react';
import { BookOpen, Target, FileText, BookMarked, FileQuestion } from 'lucide-react';

type SubTab = 'target' | 'kbm' | 'jurnal' | 'muhafadhah' | 'bank-soal';

export default function AkademikSection(_: { showToast: import('../../types').ShowToast }) {
  const [subTab, setSubTab] = useState<SubTab>('target');

  const subTabs = [
    { id: 'target' as SubTab, label: 'Target Mengajar', icon: Target },
    { id: 'kbm' as SubTab, label: 'KBM Harian', icon: BookOpen },
    { id: 'jurnal' as SubTab, label: 'Jurnal Mengajar', icon: FileText },
    { id: 'muhafadhah' as SubTab, label: 'Muhafadhah', icon: BookMarked },
    { id: 'bank-soal' as SubTab, label: 'Bank Soal', icon: FileQuestion },
  ];

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Akademik</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Target mengajar, KBM, jurnal, muhafadhah, dan bank soal</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {subTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${subTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="card p-6 text-center">
        {(() => {
          const Icon = subTabs.find(t => t.id === subTab)?.icon ?? BookOpen;
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
