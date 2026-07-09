import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, CalendarDays, Clock, Bell, Megaphone,
  CheckCircle, Timer, FileText, ChevronRight, Moon, Camera,
  ClipboardCheck, BarChart3, X, AlertTriangle,
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
        .limit(5);
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

  const ongoingClass = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return jadwalHariIni.find(j => {
      const [h, m] = j.jam_mulai.split(':').map(Number);
      const [h2, m2] = j.jam_selesai.split(':').map(Number);
      return nowMin >= h * 60 + m && nowMin < h2 * 60 + m2;
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
    const target = nextClass ?? ongoingClass;
    if (!target) return null;
    const timeStr = nextClass ? nextClass.jam_mulai : ongoingClass!.jam_selesai;
    const [h, m] = timeStr.split(':').map(Number);
    const t = new Date(now);
    t.setHours(h, m, 0, 0);
    const diff = t.getTime() - now.getTime();
    if (diff <= 0) return null;
    return {
      hours: Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [nextClass, ongoingClass, now]);

  const greeting = () => {
    const h = now.getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const hijri = gregorianToHijri(now);
  const kehadiranPercent = absensiStats.total > 0 ? Math.round((absensiStats.hadir / absensiStats.total) * 100) : 0;
  const activeOrNext = ongoingClass ?? nextClass;
  const visibleBroadcast = broadcastList.filter(p => !dismissedIds.includes(String(p.id)));
  const infoPenting = visibleBroadcast[0] ?? null;

  const showSkeleton = muridCount === 0 && jadwalHariIni.length === 0 && broadcastList.length === 0;

  if (showSkeleton) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-20 bg-white rounded-2xl" />
        <div className="animate-pulse h-48 bg-white rounded-2xl" />
        <div className="animate-pulse h-16 bg-white rounded-2xl" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse h-20 bg-white rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Greeting + Clock ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 font-medium">Assalamu'alaikum,</p>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight mt-0.5">
            Ustaz {profile?.nama_panggilan || profile?.nama_lengkap?.split(' ')[0] || ''} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">{greeting()}, semangat mengajar!</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm mb-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold text-slate-800 text-sm tabular-nums">
              {now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs font-bold text-emerald-600">WIB</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-0.5">
            <Moon className="w-3 h-3 text-amber-500" />
            {hijri.day} {hijri.monthName} {hijri.year} H
          </p>
        </div>
      </div>

      {/* ── Schedule Card (Emerald) ── */}
      {activeOrNext ? (
        <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 overflow-hidden shadow-lg shadow-emerald-200/60">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -right-2 top-12 w-20 h-20 bg-white/5 rounded-full" />

          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3">
            {ongoingClass ? 'Sedang Berlangsung' : 'Jadwal Berikutnya'}
          </p>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-14 h-14 bg-emerald-800/60 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
              <BookOpen className="w-7 h-7 text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-extrabold text-white leading-tight truncate">
                {activeOrNext.pelajaran}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="bg-emerald-500/40 border border-emerald-400/30 text-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {activeOrNext.kelas}
                </span>
                <span className="text-emerald-200 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activeOrNext.jam_mulai.slice(0, 5)} - {activeOrNext.jam_selesai.slice(0, 5)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 flex items-end justify-between gap-4">
            {countdown ? (
              <div>
                <p className="text-emerald-300 text-xs font-medium mb-2">
                  {ongoingClass ? 'Selesai dalam' : 'Masuk dalam'}
                </p>
                <div className="flex items-end gap-2">
                  {[
                    { val: countdown.hours, label: 'Jam' },
                    { val: countdown.minutes, label: 'Menit' },
                    { val: countdown.seconds, label: 'Detik' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-end gap-1">
                      {i > 0 && <span className="text-white/60 font-bold text-2xl mb-4">:</span>}
                      <div className="text-center">
                        <span className="font-extrabold text-white text-3xl tabular-nums leading-none">
                          {String(t.val).padStart(2, '0')}
                        </span>
                        <p className="text-emerald-300 text-[10px] font-semibold mt-1">{t.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-emerald-200 text-sm">Kelas berlangsung</p>
              </div>
            )}

            <button
              onClick={() => handleNav('presensi')}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white text-emerald-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all shadow-sm whitespace-nowrap"
            >
              Mulai Presensi
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-sm">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-sm">Tidak ada jadwal mengajar hari ini</p>
          <p className="text-slate-400 text-xs mt-1">Nikmati waktu istirahatmu</p>
        </div>
      )}

      {/* ── Announcement Banner ── */}
      {infoPenting && (
        <div className="bg-[#FFF8EC] border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm leading-tight">{infoPenting.judul}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{infoPenting.isi}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <button
                onClick={() => setDismissedIds(prev => [...prev, String(infoPenting.id)])}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Access ── */}
      {setActiveTab && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="font-bold text-slate-800 text-sm mb-3">Akses Cepat</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { tab: 'presensi' as ActiveTab, icon: CheckCircle, label: 'Presensi', bg: 'bg-emerald-500', iconColor: 'text-white' },
              { tab: 'absensi' as ActiveTab, icon: ClipboardCheck, label: 'Absensi', bg: 'bg-blue-500', iconColor: 'text-white' },
              { tab: 'jurnal' as ActiveTab, icon: FileText, label: 'Jurnal', bg: 'bg-violet-500', iconColor: 'text-white' },
              { tab: 'nilai' as ActiveTab, icon: BarChart3, label: 'Nilai', bg: 'bg-orange-500', iconColor: 'text-white' },
            ].map(a => {
              const Icon = a.icon;
              return (
                <button
                  key={a.tab}
                  onClick={() => handleNav(a.tab)}
                  className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <div className={`w-14 h-14 ${a.bg} rounded-2xl flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-6 h-6 ${a.iconColor}`} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="grid grid-cols-4 divide-x divide-slate-100">
          {[
            { val: muridCount, label: 'Santri', sublabel: 'Aktif', icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
            { val: jadwalHariIni.length, label: 'Jadwal', sublabel: 'Hari Ini', icon: CalendarDays, iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
            { val: `${kehadiranPercent}%`, label: 'Kehadiran', sublabel: 'Hari Ini', icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
            { val: jurnalCount, label: 'Jurnal', sublabel: 'Bulan Ini', icon: FileText, iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 px-2 py-1">
                <div className={`w-9 h-9 ${s.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <p className="font-extrabold text-slate-800 text-lg leading-none">{s.val}</p>
                <div className="text-center">
                  <p className="text-[10px] text-slate-700 font-semibold leading-tight">{s.label}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold leading-tight">{s.sublabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Jadwal Hari Ini ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-slate-800">Jadwal Hari Ini</p>
          {setActiveTab && (
            <button onClick={() => handleNav('jadwal')} className="text-xs text-emerald-600 font-semibold">
              Lihat Semua
            </button>
          )}
        </div>

        {jadwalHariIni.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Tidak ada jadwal hari ini</p>
        ) : (
          <div className="space-y-0">
            {jadwalHariIni.map((j, idx) => {
              const isActive = ongoingClass?.id === j.id;
              const isDone = (() => {
                const [h, m] = j.jam_selesai.split(':').map(Number);
                return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
              })();

              return (
                <div key={j.id} className={`flex items-center gap-3 py-3 ${idx < jadwalHariIni.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    {isDone ? (
                      <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    ) : isActive ? (
                      <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center ring-4 ring-amber-100">
                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 border-2 border-slate-200 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-300 rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div className="w-12 flex-shrink-0 text-center">
                    <p className="font-bold text-slate-800 text-sm leading-tight">{j.jam_mulai.slice(0, 5)}</p>
                    <p className="text-slate-400 text-xs leading-tight">{j.jam_selesai.slice(0, 5)}</p>
                  </div>

                  {/* Subject */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm leading-tight">{j.pelajaran}</p>
                    {j.kelas && <p className="text-xs text-slate-400 mt-0.5 truncate">{j.kelas}</p>}
                  </div>

                  {/* Status badge */}
                  {isDone ? (
                    <span className="flex-shrink-0 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Selesai</span>
                  ) : isActive ? (
                    <span className="flex-shrink-0 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">Berlangsung</span>
                  ) : (
                    <span className="flex-shrink-0 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Belum</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Jurnal Terakhir ── */}
      {jurnalList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              <p className="font-bold text-slate-800 text-sm">Jurnal Terakhir</p>
            </div>
            {setActiveTab && (
              <button onClick={() => handleNav('jurnal')} className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                Lihat <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {jurnalList.map(j => (
              <div key={j.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
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

      {/* ── Agenda Mendatang ── */}
      {agendaList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-600" />
            </div>
            <p className="font-bold text-slate-800 text-sm">Agenda Mendatang</p>
          </div>
          <div className="space-y-2">
            {agendaList.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <div className="w-11 h-11 bg-amber-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-amber-700 leading-tight">{new Date(a.tanggal).getDate()}</span>
                  <span className="text-[9px] text-amber-500 font-semibold">{new Date(a.tanggal).toLocaleString('id-ID', { month: 'short' })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{a.judul}</p>
                  <span className="text-[10px] text-amber-600 font-medium">{a.jenis}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
