import { useState, useEffect, useMemo } from 'react';
import {
  Award, Users, TrendingUp, Calendar, CheckCircle, Clock, XCircle,
  Heart, FileText, MessageCircle, Mail, Phone, BarChart3, Loader2,
  Search, Trophy, Target,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import EmptyState from '../components/EmptyState';
import { shareWA } from '../lib/pdf';
import type { Profile, PresensiGuru, JadwalMengajar, ShowToast, JurnalKBM } from '../types';

type RankCategory = 'terbaik' | 'disiplin' | 'aktif' | 'terlambat' | 'alfa';

interface UstazStats {
  ustaz: Profile;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alfa: number;
  belum: number;
  totalJadwal: number;
  totalJurnal: number;
}

export default function RaporUstazPage(_: { showToast: ShowToast }) {
  const [ustazList, setUstazList] = useState<Profile[]>([]);
  const [selectedUstazId, setSelectedUstazId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [rankCategory, setRankCategory] = useState<RankCategory>('terbaik');
  const [allStats, setAllStats] = useState<UstazStats[]>([]);

  // Detail data
  const [presensiList, setPresensiList] = useState<PresensiGuru[]>([]);
  // const [izinList, setIzinList] = useState<IzinMengajar[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalMengajar[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalKBM[]>([]);

  useEffect(() => { fetchAllUstaz(); }, []);

  const fetchAllUstaz = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('is_active', true).neq('role', 'admin').order('nama_lengkap');
    if (data) {
      const profiles = data as Profile[];
      setUstazList(profiles);
      // Fetch presensi + jadwal + jurnal for all ustaz to compute rankings
      const [presRes, izinRes, jadwalRes, jurnalRes] = await Promise.all([
        supabase.from('presensi_guru').select('user_id, status_presensi, telat_menit').order('tanggal', { ascending: false }).limit(500),
        supabase.from('izin_mengajar').select('user_id, jenis_izin').limit(500),
        supabase.from('jadwal_mengajar').select('user_id, id'),
        supabase.from('jurnal_kbm').select('user_id, id').eq('is_active', true).limit(500),
      ]);
      const stats: UstazStats[] = profiles.map(u => {
        const pres = (presRes.data || []).filter((p: any) => p.user_id === u.id);
        const izin = (izinRes.data || []).filter((i: any) => i.user_id === u.id);
        const jadwal = (jadwalRes.data || []).filter((j: any) => j.user_id === u.id);
        const jurnal = (jurnalRes.data || []).filter((j: any) => j.user_id === u.id);
        return {
          ustaz: u,
          hadir: pres.filter(p => p.status_presensi === 'Hadir').length,
          terlambat: pres.filter(p => p.status_presensi === 'Terlambat').length,
          izin: izin.filter(i => i.jenis_izin === 'Izin').length,
          sakit: izin.filter(i => i.jenis_izin === 'Sakit').length,
          alfa: pres.filter(p => p.status_presensi === 'Alfa').length,
          belum: pres.filter(p => !p.status_presensi || p.status_presensi === 'Belum Presensi').length,
          totalJadwal: jadwal.length,
          totalJurnal: jurnal.length,
        };
      });
      setAllStats(stats);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedUstazId) fetchDetail(selectedUstazId);
    else clearDetail();
  }, [selectedUstazId]);

  const clearDetail = () => {
    setPresensiList([]); setJadwalList([]); setJurnalList([]);
  };

  const fetchDetail = async (id: string) => {
    const [p, i, j, jur] = await Promise.all([
      supabase.from('presensi_guru').select('*').eq('user_id', id).order('tanggal', { ascending: false }).limit(100),
      supabase.from('jadwal_mengajar').select('*').eq('user_id', id).order('hari'),
      supabase.from('jurnal_kbm').select('*').eq('user_id', id).eq('is_active', true).order('tanggal', { ascending: false }).limit(50),
    ]);
    if (p.data) setPresensiList(p.data as PresensiGuru[]);
    if (j.data) setJadwalList(j.data as JadwalMengajar[]);
    if (jur.data) setJurnalList(jur.data as JurnalKBM[]);
  };

  const selectedUstaz = ustazList.find(u => u.id === selectedUstazId);
  const selectedStats = allStats.find(s => s.ustaz.id === selectedUstazId);

  const rankedUstaz = useMemo(() => {
    const filtered = allStats.filter(s => {
      if (!searchText) return true;
      const name = (s.ustaz.nama_lengkap || s.ustaz.nama_panggilan || '').toLowerCase();
      return name.includes(searchText.toLowerCase());
    });
    const sorted = [...filtered];
    switch (rankCategory) {
      case 'terbaik': sorted.sort((a, b) => (b.hadir + b.terlambat) - (a.hadir + a.terlambat)); break;
      case 'disiplin': sorted.sort((a, b) => a.terlambat - b.terlambat || b.hadir - a.hadir); break;
      case 'aktif': sorted.sort((a, b) => b.totalJurnal - a.totalJurnal || b.totalJadwal - a.totalJadwal); break;
      case 'terlambat': sorted.sort((a, b) => b.terlambat - a.terlambat); break;
      case 'alfa': sorted.sort((a, b) => b.alfa - a.alfa); break;
    }
    return sorted;
  }, [allStats, searchText, rankCategory]);

  const rankConfig: { id: RankCategory; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'terbaik', label: 'Kehadiran Terbaik', icon: Trophy, color: 'emerald' },
    { id: 'disiplin', label: 'Paling Disiplin', icon: Target, color: 'sky' },
    { id: 'aktif', label: 'Paling Aktif', icon: TrendingUp, color: 'violet' },
    { id: 'terlambat', label: 'Terlambat Terbanyak', icon: Clock, color: 'amber' },
    { id: 'alfa', label: 'Alfa Terbanyak', icon: XCircle, color: 'rose' },
  ];

  // Simple bar chart data for selected ustaz
  const chartData = useMemo(() => {
    if (!selectedStats) return [];
    return [
      { label: 'Hadir', val: selectedStats.hadir, color: 'bg-emerald-500' },
      { label: 'Terlambat', val: selectedStats.terlambat, color: 'bg-amber-500' },
      { label: 'Izin', val: selectedStats.izin, color: 'bg-sky-500' },
      { label: 'Sakit', val: selectedStats.sakit, color: 'bg-violet-500' },
      { label: 'Alfa', val: selectedStats.alfa, color: 'bg-rose-500' },
    ];
  }, [selectedStats]);

  const maxChartVal = Math.max(...chartData.map(d => d.val), 1);

  const handleShareWA = () => {
    if (!selectedUstaz || !selectedStats) return;
    let text = `*RAPOR USTAZ*\n\n`;
    text += `Nama: ${selectedUstaz.nama_lengkap || selectedUstaz.nama_panggilan}\n`;
    text += `\n*Rekap Presensi:*\n`;
    text += `Hadir: ${selectedStats.hadir}\nTerlambat: ${selectedStats.terlambat}\nIzin: ${selectedStats.izin}\nSakit: ${selectedStats.sakit}\nAlfa: ${selectedStats.alfa}\n`;
    text += `\n*Jadwal Mengajar:* ${selectedStats.totalJadwal}\n`;
    text += `*Jurnal KBM:* ${selectedStats.totalJurnal}\n`;
    shareWA(text);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500">Memuat data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="section-title">Rapor Ustaz</h2>
        <p className="section-subtitle">Rekap presensi, ranking, dan performa ustaz</p>
      </div>

      {/* Ranking categories */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-600 mb-2">Ranking Kategori</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {rankConfig.map(r => {
            const Icon = r.icon;
            const isActive = rankCategory === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRankCategory(r.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all border ${isActive ? 'bg-slate-800 text-white border-slate-800' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="card p-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Cari nama ustaz..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700/50 rounded-xl outline-none border border-transparent focus:border-emerald-400 text-slate-700 dark:text-slate-200"
          />
        </div>
      </div>

      {ustazList.length === 0 ? (
        <EmptyState title="Belum ada ustaz" description="Belum ada data ustaz." icon={<Users className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Ranked List */}
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {rankConfig.find(r => r.id === rankCategory)?.label}
                </span>
              </div>
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                {rankedUstaz.map((s, i) => {
                  const u = s.ustaz;
                  const isSel = selectedUstazId === u.id;
                  const medal = i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400';
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUstazId(u.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border ${isSel ? 'bg-emerald-600 text-white font-bold border-emerald-600' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-100'}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSel ? 'bg-white/20' : medal}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="truncate">{u.nama_lengkap || u.nama_panggilan || 'Ustaz'}</p>
                        <p className={`text-[10px] ${isSel ? 'text-emerald-100' : 'text-slate-400'}`}>
                          H:{s.hadir} T:{s.terlambat} A:{s.alfa}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Detail */}
          <div className="lg:col-span-2 space-y-4">
            {selectedUstaz && selectedStats ? (
              <>
                {/* Header */}
                <div className="card overflow-hidden border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg truncate">{selectedUstaz.nama_lengkap || selectedUstaz.nama_panggilan || 'Ustaz'}</p>
                          <p className="text-emerald-100 text-sm">{selectedUstaz.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{selectedStats.hadir + selectedStats.terlambat}</p>
                        <p className="text-[10px] text-emerald-100 font-semibold uppercase">Total Hadir</p>
                      </div>
                      <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{selectedStats.totalJadwal}</p>
                        <p className="text-[10px] text-emerald-100 font-semibold uppercase">Jadwal Mengajar</p>
                      </div>
                      <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{selectedStats.totalJurnal}</p>
                        <p className="text-[10px] text-emerald-100 font-semibold uppercase">Jurnal KBM</p>
                      </div>
                      <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{((selectedStats.hadir / Math.max(selectedStats.hadir + selectedStats.terlambat + selectedStats.alfa, 1)) * 100).toFixed(0)}%</p>
                        <p className="text-[10px] text-emerald-100 font-semibold uppercase">Kehadiran</p>
                      </div>
                    </div>
                    {/* Contact buttons */}
                    <div className="flex gap-2 mt-4">
                      {selectedUstaz.nomor_whatsapp && (
                        <a href={`https://wa.me/${selectedUstaz.nomor_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                      {selectedUstaz.nomor_whatsapp && (
                        <a href={`tel:${selectedUstaz.nomor_whatsapp}`} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                          <Phone className="w-3.5 h-3.5" /> Telepon
                        </a>
                      )}
                      {selectedUstaz.email && (
                        <a href={`mailto:${selectedUstaz.email}`} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                      )}
                      <button onClick={handleShareWA} className="flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-xl text-xs font-bold transition-colors ml-auto">
                        <MessageCircle className="w-3.5 h-3.5" /> Share
                      </button>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="card p-4">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4 text-emerald-600" /> Grafik Kehadiran
                  </h3>
                  <div className="space-y-2.5">
                    {chartData.map(d => (
                      <div key={d.label} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600 w-20 flex-shrink-0">{d.label}</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                          <div className={`h-full ${d.color} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                            style={{ width: `${(d.val / maxChartVal) * 100}%`, minWidth: d.val > 0 ? '24px' : '0' }}>
                            {d.val > 0 && <span className="text-[10px] font-bold text-white">{d.val}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jadwal Mengajar */}
                <div className="card p-4">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-emerald-600" /> Jadwal Mengajar
                    <span className="ml-auto badge badge-info text-[10px]">{jadwalList.length}</span>
                  </h3>
                  {jadwalList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Belum ada jadwal</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {jadwalList.map(j => (
                        <div key={j.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
                          <div className="w-10 h-10 bg-white dark:bg-slate-600 rounded-xl flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
                            {j.jam_mulai?.slice(0, 5)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{j.pelajaran}</p>
                            <p className="text-[10px] text-slate-400">{j.hari} • {j.kelas}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rekap Mengajar */}
                <div className="card p-4">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-violet-600" /> Rekap Mengajar
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{jurnalList.length}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Total Jurnal</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{jadwalList.length}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Total Jadwal</p>
                    </div>
                    <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-sky-700 dark:text-sky-300">{selectedStats.hadir}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Hadir Mengajar</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{selectedStats.terlambat}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Terlambat</p>
                    </div>
                  </div>
                </div>

                {/* Riwayat Presensi */}
                <div className="card p-4">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-slate-500" /> Riwayat Presensi
                  </h3>
                  {presensiList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Belum ada riwayat</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {presensiList.slice(0, 20).map(p => (
                        <div key={p.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status_presensi === 'Hadir' ? 'bg-emerald-500' : p.status_presensi === 'Terlambat' ? 'bg-amber-500' : p.status_presensi === 'Izin' ? 'bg-sky-500' : p.status_presensi === 'Sakit' ? 'bg-violet-500' : p.status_presensi === 'Alfa' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{p.status_presensi || 'Belum'}</p>
                            <p className="text-[10px] text-slate-400">{p.tanggal} {p.jam_masuk && `• ${p.jam_masuk.slice(0, 5)}`}</p>
                          </div>
                          {p.telat_menit != null && p.telat_menit > 0 && <span className="text-[10px] text-amber-600 font-bold">{p.telat_menit}m</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card border-dashed border-slate-200 p-12 text-center">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Pilih ustaz untuk melihat rapor lengkap</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
