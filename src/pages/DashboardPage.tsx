import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, CalendarDays, Clock, Bell, Megaphone,
  CheckCircle, Timer, FileText, ChevronRight, Moon, Sparkles,
  ChevronLeft, X, AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SkeletonCard } from '../components/Skeleton';
import type { Profile, JadwalMengajar, AgendaPenting, Pengumuman, JurnalKBM, ShowToast, ActiveTab } from '../types';

const HIJRI_MONTHS = [
  'Muharram', 'Shafar', 'Rabi\'ul Awwal', 'Rabi\'ul Akhir',
  'Jumadil Awwal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
  'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
];

function gregorianToHijri(date: Date): { day: number; month: number; year: number; monthName: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let jd: number;
  if (month <= 2) {
    const y = year - 1;
    const m = month + 12;
    jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day - 1524.5;
  } else {
    jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  if (year > 1582 || (year === 1582 && month > 10) || (year === 1582 && month === 10 && day >= 15)) {
    jd += b;
  }

  const l = Math.floor(jd - 1948439.5) + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hijriMonth = Math.floor((24 * l3) / 709);
  const hijriDay = l3 - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;

  return {
    day: hijriDay,
    month: hijriMonth,
    year: hijriYear,
    monthName: HIJRI_MONTHS[hijriMonth - 1] || ''
  };
}

interface DashboardPageProps {
  showToast: ShowToast;
  profile: Profile | null;
  setActiveTab?: (tab: ActiveTab) => void;
}

export default function DashboardPage({ profile, setActiveTab }: DashboardPageProps) {
  const [now, setNow] = useState(new Date());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayHari = namaHari[new Date().getDay()];
  const todayDate = new Date().toISOString().split('T')[0];
  const isUstaz = profile?.role !== 'admin';
  const userId = profile?.id ?? '';

  const handleNav = (tab: ActiveTab) => {
    if (setActiveTab) {
      setActiveTab(tab);
      window.history.pushState(null, '', `#${tab}`);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: broadcastList = [] } = useQuery<Pengumuman[]>({
    queryKey: ['dashboard-broadcast'],
    queryFn: async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('pengumuman')
        .select('*')
        .eq('status', 'Publish')
        .lte('tanggal_mulai', todayStr)
        .or(`tanggal_selesai.is.null,tanggal_selesai.gte.${todayStr}`)
        .order('prioritas', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);
      return (data ?? []) as Pengumuman[];
    },
    staleTime: 60 * 1000,
  });

  const { data: jadwalHariIni = [] } = useQuery<JadwalMengajar[]>({
    queryKey: ['dashboard-jadwal', todayHari, userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('jadwal_mengajar').select('*').eq('hari', todayHari).order('jam_mulai');
      if (isUstaz) q = q.eq('user_id', userId);
      const { data } = await q;
      return (data ?? []) as JadwalMengajar[];
    },
    staleTime: 60 * 1000,
  });

  const { data: agendaList = [] } = useQuery<AgendaPenting[]>({
    queryKey: ['dashboard-agenda', userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('agenda_penting').select('*').gte('tanggal', todayDate).order('tanggal', { ascending: true }).limit(5);
      if (isUstaz) q = q.eq('user_id', userId);
      const { data } = await q;
      return (data ?? []) as AgendaPenting[];
    },
    staleTime: 60 * 1000,
  });

  const { data: pengumumanList = [] } = useQuery<Pengumuman[]>({
    queryKey: ['dashboard-pengumuman', userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('pengumuman').select('*').order('created_at', { ascending: false }).limit(3);
      if (isUstaz) q = q.eq('user_id', userId);
      const { data } = await q;
      return (data ?? []) as Pengumuman[];
    },
    staleTime: 60 * 1000,
  });

  const { data: jurnalList = [] } = useQuery<JurnalKBM[]>({
    queryKey: ['dashboard-jurnal', userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('jurnal_kbm').select('*').eq('is_active', true).order('tanggal', { ascending: false }).limit(3);
      if (isUstaz) q = q.eq('user_id', userId);
      const { data } = await q;
      return (data ?? []) as JurnalKBM[];
    },
    staleTime: 60 * 1000,
  });

  const { data: muridCount = 0 } = useQuery<number>({
    queryKey: ['dashboard-murid-count'],
    queryFn: async () => {
      const { count } = await supabase.from('murid').select('*', { count: 'exact', head: true }).eq('status_aktif', true);
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: absensiStats = { hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0 } } = useQuery({
    queryKey: ['dashboard-absensi-stats', todayDate, userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('absensi').select('status').eq('tanggal', todayDate);
      if (isUstaz) q = q.eq('user_id', userId);
      const { data } = await q;
      const stats = { hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0 };
      (data ?? []).forEach((a: any) => {
        if (a.status === 'Hadir') stats.hadir++;
        else if (a.status === 'Izin') stats.izin++;
        else if (a.status === 'Sakit') stats.sakit++;
        else if (a.status === 'Alpha') stats.alpha++;
        stats.total++;
      });
      return stats;
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    const visible = broadcastList.filter(p => !dismissedIds.includes(String(p.id)));
    if (visible.length <= 1) return;
    const t = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % visible.length);
    }, 5000);
    return () => clearInterval(t);
  }, [broadcastList, dismissedIds]);

  const ongoingClass = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return jadwalHariIni.find(j => {
      const [h, m] = j.jam_mulai.split(':').map(Number);
      const [h2, m2] = j.jam_selesai.split(':').map(Number);
      const start = h * 60 + m;
      const end = h2 * 60 + m2;
      return nowMin >= start && nowMin < end;
    });
  }, [jadwalHariIni, now]);

  const nextClass = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return jadwalHariIni.find(j => {
      const [h, m] = j.jam_mulai.split(':').map(Number);
      return h * 60 + m > nowMin;
    });
  }, [jadwalHariIni, now]);

  const countdown = useMemo(() => {
    if (!nextClass) return null;
    const [h, m] = nextClass.jam_mulai.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { hours, minutes, seconds };
  }, [nextClass, now]);

  const greeting = () => {
    const h = now.getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const hijriDate = gregorianToHijri(now);
  const kehadiranPercent = absensiStats.total > 0 ? Math.round((absensiStats.hadir / absensiStats.total) * 100) : 0;

  const isLoading = jadwalHariIni.length === 0 && !broadcastList.length && !agendaList.length && !pengumumanList.length;
  const showSkeleton = isLoading && muridCount === 0;

  if (showSkeleton) {
    return (
      <div className="space-y-4">
        <SkeletonCard count={1} className="h-32" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map(i => (
            <div key={i} className="card p-4 animate-pulse h-20" />
          ))}
        </div>
        <SkeletonCard count={2} />
      </div>
    );
  }

  const visibleBroadcast = broadcastList.filter(p => !dismissedIds.includes(String(p.id)));
  const infoPenting = visibleBroadcast.length > 0 ? visibleBroadcast[currentSlide % visibleBroadcast.length] : null;

  return (
    <div className="space-y-4">
      {/* Bismillah + Greeting Header */}
      <div className="text-center">
        <p className="text-2xl font-arabic text-emerald-700 dark:text-emerald-400 mb-1" style={{ fontFamily: "'Amiri', serif" }}>
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          {greeting()}, <span className="font-semibold text-emerald-700 dark:text-emerald-400">Ustaz {profile?.nama_panggilan || profile?.nama_lengan || ''}</span>
        </p>
      </div>

      {/* Time Hub - Two Column Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700">
          {/* Left: WIB Clock */}
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-6 h-4 rounded-sm overflow-hidden shadow-sm">
                <div className="w-full h-1/2 bg-red-600" />
                <div className="w-full h-1/2 bg-white" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">WIB</span>
            </div>
            <p className="font-mono font-bold text-4xl text-slate-800 dark:text-white tracking-tight">
              {now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Right: Hijri Date */}
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Moon className="w-5 h-5 text-amber-300" />
              <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wide">Tanggal Hijriah</span>
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">
              {hijriDate.day} {hijriDate.monthName}
            </p>
            <p className="text-xl font-semibold text-emerald-100">
              {hijriDate.year} H
            </p>
          </div>
        </div>
      </div>

      {/* Jadwal Berikutnya / Sedang Berlangsung */}
      {(ongoingClass || nextClass) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
          {ongoingClass ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Sedang Berlangsung</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-white text-lg truncate">{ongoingClass.pelajaran}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="badge bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">{ongoingClass.kelas}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ongoingClass.jam_mulai.slice(0, 5)} - {ongoingClass.jam_selesai.slice(0, 5)}
                    </span>
                    {ongoingClass.ruangan && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">{ongoingClass.ruangan}</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : nextClass ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Jadwal Berikutnya</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-white text-lg truncate">{nextClass.pelajaran}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">{nextClass.kelas}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{nextClass.jam_mulai.slice(0, 5)} - {nextClass.jam_selesai.slice(0, 5)}</span>
                  </div>
                </div>
              </div>
              {countdown && (
                <div className="mt-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Masuk dalam</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg px-2.5 py-1 text-lg font-bold">{String(countdown.hours).padStart(2, '0')}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-lg font-bold">:</span>
                    <span className="bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg px-2.5 py-1 text-lg font-bold">{String(countdown.minutes).padStart(2, '0')}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-lg font-bold">:</span>
                    <span className="bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg px-2.5 py-1 text-lg font-bold">{String(countdown.seconds).padStart(2, '0')}</span>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Info Penting Banner */}
      {infoPenting && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-2xl border-2 border-amber-300 dark:border-amber-700 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-200 dark:bg-amber-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-amber-800 dark:text-amber-200 text-sm">Info Penting</span>
                {infoPenting.prioritas === 'Penting' && (
                  <span className="badge bg-amber-500 text-white text-[9px]">Penting</span>
                )}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">{infoPenting.judul}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 line-clamp-2">{infoPenting.isi}</p>
            </div>
            <button
              onClick={() => setDismissedIds(prev => [...prev, String(infoPenting.id)])}
              className="p-1.5 rounded-lg text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-800/50 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats - 2 Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{muridCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Santri</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{kehadiranPercent}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kehadiran Hari Ini</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jadwal Hari Ini */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-800 dark:text-white">Jadwal Hari Ini</h3>
          </div>
          <span className="badge bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">{jadwalHariIni.length} jadwal</span>
        </div>

        {jadwalHariIni.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Tidak ada jadwal hari ini</p>
        ) : (
          <div className="space-y-2">
            {jadwalHariIni.map((j) => {
              const isActive = ongoingClass?.id === j.id;
              const isDone = (() => {
                const [h, m] = j.jam_selesai.split(':').map(Number);
                const endMin = h * 60 + m;
                const nowMin = now.getHours() * 60 + now.getMinutes();
                return nowMin >= endMin;
              })();

              return (
                <div
                  key={j.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700' : isDone ? 'bg-slate-50 dark:bg-slate-700/30 opacity-60' : 'bg-slate-50 dark:bg-slate-700/50'}`}
                >
                  <div className="w-11 h-11 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                    {j.jam_mulai.slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">{j.pelajaran}</p>
                    <span className="badge bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px]">{j.kelas}</span>
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Aktif
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Jurnal Terakhir + Agenda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jurnalList.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Jurnal Terakhir</h3>
              </div>
              {setActiveTab && (
                <button onClick={() => handleNav('jurnal')} className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 hover:gap-1 transition-all">
                  Lihat <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {jurnalList.map(j => (
                <div key={j.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <div className="w-9 h-9 bg-violet-50 dark:bg-violet-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{j.materi || j.pelajaran || 'Jurnal KBM'}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      {j.kelas && ` • ${j.kelas}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {agendaList.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Agenda Mendatang</h3>
            </div>
            <div className="space-y-2">
              {agendaList.map(a => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{new Date(a.tanggal).getDate()}</span>
                    <span className="text-[8px] text-amber-500 dark:text-amber-500">{new Date(a.tanggal).toLocaleString('id-ID', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{a.judul}</p>
                    <span className="badge bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[9px]">{a.jenis}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pengumuman */}
      {pengumumanList.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-sky-50 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Pengumuman</h3>
          </div>
          <div className="space-y-2">
            {pengumumanList.map(p => (
              <div key={p.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.judul}</span>
                  {p.kategori && <span className="badge bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[9px]">{p.kategori}</span>}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{p.isi}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
