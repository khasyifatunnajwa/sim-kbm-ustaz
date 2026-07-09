import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, CalendarDays, Clock, Bell, Megaphone,
  CheckCircle, Timer, TrendingUp, FileText, GraduationCap,
  ChevronRight, BookMarked, AlertTriangle, ChevronLeft, X,
  Moon, Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SkeletonCard } from '../components/Skeleton';
import type { Profile, JadwalMengajar, AgendaPenting, Pengumuman, JurnalKBM, ShowToast, ActiveTab } from '../types';

// Hijri month names in Indonesian/Arabic
const HIJRI_MONTHS = [
  'Muharram', 'Shafar', 'Rabi\'ul Awwal', 'Rabi\'ul Akhir',
  'Jumadil Awwal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
  'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
];

// Convert Gregorian date to Hijri using Julian Day Number method
function gregorianToHijri(date: Date): { day: number; month: number; year: number; monthName: string } {
  // Convert to UTC to avoid timezone issues
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Calculate Julian Day Number
  let jd: number;
  if (month <= 2) {
    const y = year - 1;
    const m = month + 12;
    jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day - 1524.5;
  } else {
    jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5;
  }

  // Adjust for Gregorian calendar (dates after 1582 Oct 15)
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  if (year > 1582 || (year === 1582 && month > 10) || (year === 1582 && month === 10 && day >= 15)) {
    jd += b;
  }

  // Convert Julian Day Number to Hijri
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

  // TanStack Query: cached data fetching — no loading spinner on revisits
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

  const { data: jadwalCount = 0 } = useQuery<number>({
    queryKey: ['dashboard-jadwal-count', userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('jadwal_mengajar').select('*', { count: 'exact', head: true });
      if (isUstaz) q = q.eq('user_id', userId);
      const { count } = await q;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: jurnalCount = 0 } = useQuery<number>({
    queryKey: ['dashboard-jurnal-count', userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('jurnal_kbm').select('*', { count: 'exact', head: true }).eq('is_active', true);
      if (isUstaz) q = q.eq('user_id', userId);
      const { count } = await q;
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

  // Auto-advance carousel
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

  // Show skeleton only on very first load (no cached data yet)
  const isLoading = jadwalHariIni.length === 0 && !broadcastList.length && !agendaList.length && !pengumumanList.length;
  // But if we have ANY data, show it immediately (TanStack Query returns cached data instantly)
  const showSkeleton = isLoading && jadwalCount === 0 && muridCount === 0;

  if (showSkeleton) {
    return (
      <div className="space-y-4">
        <SkeletonCard count={1} className="h-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-4 animate-pulse h-20" />
          ))}
        </div>
        <SkeletonCard count={2} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Broadcast Pengumuman Banner Carousel */}
      <BroadcastBanner
        list={broadcastList}
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        dismissedIds={dismissedIds}
        setDismissedIds={setDismissedIds}
      />

      {/* Greeting Header */}
      <div className="card overflow-hidden border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="p-5">
          {/* Top Row: Greeting + WIB Clock */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src="/icon/512x512.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">{greeting()}, Ustaz {profile?.nama_panggilan || profile?.nama_lengkap || ''}</p>
              </div>
            </div>
            {/* WIB Clock - top right */}
            <div className="text-right flex-shrink-0">
              <p className="font-mono font-bold text-xl leading-none">
                {now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-xs text-emerald-200 font-semibold mt-0.5">WIB</p>
            </div>
          </div>

          {/* Horizontal Date Row: Gregorian + Hijri */}
          <div className="flex items-center gap-2 flex-wrap text-sm text-emerald-100 mb-4">
            <CalendarDays className="w-4 h-4 flex-shrink-0" />
            <span>{now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="text-emerald-300">|</span>
            <Moon className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span className="font-medium">
              {(() => {
                const hijri = gregorianToHijri(now);
                return `${hijri.day} ${hijri.monthName} ${hijri.year} H`;
              })()}
            </span>
          </div>

          {/* Ongoing or Next Class - White card for contrast */}
          {ongoingClass ? (
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase">Sedang Berlangsung</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-800">{ongoingClass.pelajaran}</span>
                <span className="badge bg-emerald-100 text-emerald-700 text-xs">{ongoingClass.kelas}</span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {ongoingClass.jam_mulai} - {ongoingClass.jam_selesai}
                </span>
                {ongoingClass.ruangan && (
                  <span>{ongoingClass.ruangan}</span>
                )}
              </div>
            </div>
          ) : nextClass ? (
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Jadwal Berikutnya</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <BookOpen className="w-5 h-5 text-slate-600" />
                <span className="font-bold text-slate-800">{nextClass.pelajaran}</span>
                <span className="badge bg-slate-100 text-slate-700 text-xs">{nextClass.kelas}</span>
                <span className="text-sm text-slate-500 ml-auto">{nextClass.jam_mulai} - {nextClass.jam_selesai}</span>
              </div>
              {countdown && (
                <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
                  <Timer className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-600">Masuk dalam:</span>
                  <div className="flex items-center gap-1 ml-auto font-mono text-sm">
                    <span className="bg-emerald-600 text-white rounded px-2 py-0.5 font-bold">{String(countdown.hours).padStart(2, '0')}</span>
                    <span className="text-slate-400">:</span>
                    <span className="bg-emerald-600 text-white rounded px-2 py-0.5 font-bold">{String(countdown.minutes).padStart(2, '0')}</span>
                    <span className="text-slate-400">:</span>
                    <span className="bg-emerald-600 text-white rounded px-2 py-0.5 font-bold">{String(countdown.seconds).padStart(2, '0')}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/90 rounded-2xl p-4">
              <p className="text-sm text-slate-600">Tidak ada jadwal mengajar hari ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{muridCount}</p>
              <p className="text-xs text-slate-500">Total Santri</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{absensiStats.total > 0 ?
                Math.round((absensiStats.hadir / absensiStats.total) * 100) : 0}%</p>
              <p className="text-xs text-slate-500">Kehadiran Hari Ini</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{jadwalCount}</p>
              <p className="text-xs text-slate-500">Total Jadwal</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{jurnalCount}</p>
              <p className="text-xs text-slate-500">Jurnal KBM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {setActiveTab && (
        <div className="card p-4">
          <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            Aksi Cepat
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { tab: 'jurnal' as ActiveTab, icon: FileText, label: 'Jurnal', color: 'bg-violet-50 text-violet-600' },
              { tab: 'absensi' as ActiveTab, icon: CheckCircle, label: 'Absensi', color: 'bg-emerald-50 text-emerald-600' },
              { tab: 'nilai' as ActiveTab, icon: GraduationCap, label: 'Nilai', color: 'bg-sky-50 text-sky-600' },
              { tab: 'catatan' as ActiveTab, icon: BookMarked, label: 'Catatan', color: 'bg-amber-50 text-amber-600' },
            ].map(a => {
              const Icon = a.icon;
              return (
                <button
                  key={a.tab}
                  onClick={() => handleNav(a.tab)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors active:scale-95"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Absensi Stats */}
      {absensiStats.total > 0 && (
        <div className="card p-4">
          <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" />
            Statistik Kehadiran Hari Ini
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Hadir', val: absensiStats.hadir, color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Izin', val: absensiStats.izin, color: 'bg-amber-50 text-amber-700' },
              { label: 'Sakit', val: absensiStats.sakit, color: 'bg-sky-50 text-sky-700' },
              { label: 'Alpha', val: absensiStats.alpha, color: 'bg-rose-50 text-rose-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-2 text-center ${s.color}`}>
                <p className="text-lg font-bold">{s.val}</p>
                <p className="text-[10px] font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jadwal Hari Ini */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
            <CalendarDays className="w-4 h-4" />
            Jadwal Hari Ini
          </h3>
          <span className="badge badge-info text-xs">{jadwalHariIni.length} jadwal</span>
        </div>

        {jadwalHariIni.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Tidak ada jadwal hari ini</p>
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
                  className={`flex items-center gap-3 p-3 rounded-xl ${isActive ? 'bg-emerald-50 border border-emerald-200' : isDone ? 'bg-slate-50 opacity-60' : 'bg-slate-50'}`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-xs font-bold text-slate-600">
                    {j.jam_mulai.slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">{j.pelajaran}</p>
                    <span className="badge badge-success text-[10px]">{j.kelas}</span>
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
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
        {/* Jurnal Terakhir */}
        {jurnalList.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="font-bold text-slate-700 text-sm">Jurnal Terakhir</h3>
              </div>
              {setActiveTab && (
                <button onClick={() => handleNav('jurnal')} className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5 hover:gap-1 transition-all">
                  Lihat <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {jurnalList.map(j => (
                <div key={j.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                  <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{j.materi || j.pelajaran || 'Jurnal KBM'}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      {j.kelas && ` • ${j.kelas}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agenda */}
        {agendaList.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">Agenda Mendatang</h3>
            </div>
            <div className="space-y-2">
              {agendaList.map(a => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-amber-700">{new Date(a.tanggal).getDate()}</span>
                    <span className="text-[8px] text-amber-500">{new Date(a.tanggal).toLocaleString('id-ID', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{a.judul}</p>
                    <span className="badge badge-warning text-[9px]">{a.jenis}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pengumuman */}
      {pengumumanList.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-sky-50 rounded-lg flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-sky-600" />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">Pengumuman</h3>
          </div>
          <div className="space-y-2">
            {pengumumanList.map(p => (
              <div key={p.id} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-700">{p.judul}</span>
                  {p.kategori && <span className="badge badge-info text-[9px]">{p.kategori}</span>}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{p.isi}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PRIORITAS_ORDER: Record<string, number> = { Darurat: 3, Penting: 2, Normal: 1 };
const JENIS_BANNER_STYLE: Record<string, { bg: string; border: string; icon: string; iconBg: string }> = {
  Penting: { bg: 'from-rose-50 to-rose-100', border: 'border-rose-300', icon: 'text-rose-600', iconBg: 'bg-rose-100' },
  Peringatan: { bg: 'from-amber-50 to-amber-100', border: 'border-amber-300', icon: 'text-amber-600', iconBg: 'bg-amber-100' },
  Agenda: { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-300', icon: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  Pengumuman: { bg: 'from-sky-50 to-sky-100', border: 'border-sky-300', icon: 'text-sky-600', iconBg: 'bg-sky-100' },
};

function BroadcastBanner({
  list, currentSlide, setCurrentSlide, dismissedIds, setDismissedIds,
}: {
  list: Pengumuman[];
  currentSlide: number;
  setCurrentSlide: React.Dispatch<React.SetStateAction<number>>;
  dismissedIds: string[];
  setDismissedIds: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const visible = list
    .filter(p => !dismissedIds.includes(String(p.id)))
    .sort((a, b) => (PRIORITAS_ORDER[b.prioritas || 'Normal'] || 0) - (PRIORITAS_ORDER[a.prioritas || 'Normal'] || 0));

  if (visible.length === 0) return null;

  const current = visible[currentSlide % visible.length];
  if (!current) return null;

  const style = JENIS_BANNER_STYLE[current.jenis || 'Pengumuman'] || JENIS_BANNER_STYLE.Pengumuman;
  const isDarurat = current.prioritas === 'Darurat';

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => [...prev, String(current.id)]);
    setCurrentSlide(0);
  };

  return (
    <div className={`relative bg-gradient-to-r ${style.bg} border-2 ${style.border} rounded-2xl overflow-hidden shadow-sm`}>
      {isDarurat && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 animate-pulse" />
      )}
      <div className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 ${style.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {isDarurat ? (
            <AlertTriangle className={`w-5 h-5 ${style.icon} animate-pulse`} />
          ) : (
            <Megaphone className={`w-5 h-5 ${style.icon}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-slate-800 text-sm">{current.judul}</span>
            {current.jenis && <span className={`badge text-[9px] ${style.icon} bg-white/60`}>{current.jenis}</span>}
            {current.prioritas === 'Darurat' && <span className="badge text-[9px] bg-rose-600 text-white">Darurat</span>}
            {current.prioritas === 'Penting' && <span className="badge text-[9px] bg-amber-500 text-white">Penting</span>}
          </div>
          <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{current.isi}</p>
        </div>
        <button onClick={dismiss} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/40 transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Carousel dots */}
      {visible.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-2.5">
          {visible.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all ${i === (currentSlide % visible.length) ? 'w-5 bg-slate-700' : 'w-1.5 bg-slate-300'}`}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows for multiple */}
      {visible.length > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide(prev => (prev - 1 + visible.length) % visible.length)}
            className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-white/40 hover:bg-white/60 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentSlide(prev => (prev + 1) % visible.length)}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-white/40 hover:bg-white/60 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
