import { useState, useEffect } from 'react';
import { TrendingUp, Users, GraduationCap, BookOpen, Award, School, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EmptyState from '../../components/EmptyState';
import type { ShowToast } from '../../types';

type SubTab = 'kehadiran-ustaz' | 'kehadiran-murid' | 'kbm' | 'nilai' | 'kelas-teraktif' | 'guru-teraktif' | 'murid-teraktif';

export default function StatistikSection({ showToast }: { showToast: ShowToast }) {
  const [subTab, setSubTab] = useState<SubTab>('kehadiran-ustaz');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const subTabs = [
    { id: 'kehadiran-ustaz' as SubTab, label: 'Kehadiran Ustaz', icon: Users },
    { id: 'kehadiran-murid' as SubTab, label: 'Kehadiran Murid', icon: GraduationCap },
    { id: 'kbm' as SubTab, label: 'KBM', icon: BookOpen },
    { id: 'nilai' as SubTab, label: 'Nilai', icon: Award },
    { id: 'kelas-teraktif' as SubTab, label: 'Kelas Teraktif', icon: School },
    { id: 'guru-teraktif' as SubTab, label: 'Guru Teraktif', icon: Activity },
    { id: 'murid-teraktif' as SubTab, label: 'Murid Teraktif', icon: TrendingUp },
  ];

  useEffect(() => { fetchData(); }, [subTab]);

  const fetchData = async () => {
    setLoading(true);
    setData([]);
    try {
      const today = new Date();
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      const todayStr = today.toISOString().split('T')[0];
      const last7Str = last7.toISOString().split('T')[0];

      if (subTab === 'kehadiran-ustaz') {
        const { data: presensi } = await supabase.from('presensi_guru').select('tanggal, jam_masuk, telat_menit').gte('tanggal', last7Str).order('tanggal');
        const byDate: Record<string, { hadir: number; terlambat: number }> = {};
        (presensi || []).forEach(p => {
          const d = p.tanggal;
          if (!byDate[d]) byDate[d] = { hadir: 0, terlambat: 0 };
          byDate[d].hadir++;
          if (p.telat_menit && p.telat_menit > 10) byDate[d].terlambat++;
        });
        setData(Object.entries(byDate).map(([date, v]) => ({ label: date.slice(5), ...v })));
      } else if (subTab === 'kehadiran-murid') {
        const { data: absensi } = await supabase.from('absensi').select('tanggal, status').gte('tanggal', last7Str).order('tanggal');
        const byDate: Record<string, { hadir: number; izin: number; sakit: number; alfa: number }> = {};
        (absensi || []).forEach(a => {
          const d = a.tanggal;
          if (!byDate[d]) byDate[d] = { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
          if (a.status === 'Hadir') byDate[d].hadir++;
          else if (a.status === 'Izin') byDate[d].izin++;
          else if (a.status === 'Sakit') byDate[d].sakit++;
          else if (a.status === 'Alfa' || a.status === 'Alpha') byDate[d].alfa++;
        });
        setData(Object.entries(byDate).map(([date, v]) => ({ label: date.slice(5), ...v })));
      } else if (subTab === 'kbm') {
        const { data: kbm } = await supabase.from('jurnal_kbm').select('tanggal, kelas, selesai').gte('tanggal', last7Str).order('tanggal');
        const byDate: Record<string, { total: number; selesai: number }> = {};
        (kbm || []).forEach(k => {
          const d = k.tanggal;
          if (!byDate[d]) byDate[d] = { total: 0, selesai: 0 };
          byDate[d].total++;
          if (k.selesai) byDate[d].selesai++;
        });
        setData(Object.entries(byDate).map(([date, v]) => ({ label: date.slice(5), ...v })));
      } else if (subTab === 'kelas-teraktif') {
        const { data: jadwal } = await supabase.from('jadwal_mengajar').select('kelas').order('kelas');
        const byKelas: Record<string, number> = {};
        (jadwal || []).forEach(j => { if (j.kelas) byKelas[j.kelas] = (byKelas[j.kelas] || 0) + 1; });
        setData(Object.entries(byKelas).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([kelas, count]) => ({ label: kelas, value: count })));
      } else if (subTab === 'guru-teraktif') {
        const { data: jadwal } = await supabase.from('jadwal_mengajar').select('user_id');
        const userIds = [...new Set((jadwal || []).map(j => j.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('id, nama_lengkap').in('id', userIds);
          const byUser: Record<string, number> = {};
          (jadwal || []).forEach(j => { if (j.user_id) byUser[j.user_id] = (byUser[j.user_id] || 0) + 1; });
          const profileMap = new Map((profiles || []).map(p => [p.id, p.nama_lengkap]));
          setData(Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([uid, count]) => ({ label: profileMap.get(uid) || '-', value: count })));
        }
      } else {
        setData([]);
      }
    } catch (err: any) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value || d.hadir || d.total || 0)) : 0;

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Statistik</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Grafik dan statistik aktivitas lembaga</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {subTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${subTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate text-[10px]">{t.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : data.length === 0 ? (
        <EmptyState title="Belum ada data statistik" icon={<TrendingUp className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="card p-4">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">{subTabs.find(t => t.id === subTab)?.label}</p>
          {/* Simple bar chart */}
          <div className="space-y-2">
            {data.map((d, i) => {
              const value = d.value || d.hadir || d.total || 0;
              const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-16 truncate flex-shrink-0">{d.label}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.max(pct, 5)}%` }}>
                      <span className="text-[9px] text-white font-bold">{value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
