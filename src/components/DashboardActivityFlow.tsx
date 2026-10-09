import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, CheckCircle, Clock, Timer, Camera,
  ClipboardCheck, FileText, BookOpen,
  AlertCircle, Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { setActivityContext } from '../lib/activityContext';
import type { Profile, JadwalMengajar, ActiveTab, ShowToast } from '../types';

interface Props {
  profile: Profile | null;
  showToast: ShowToast;
  setActiveTab: (tab: ActiveTab) => void;
  jadwalHariIni: JadwalMengajar[];
  now: Date;
}

type StepStatus = 'pending' | 'active' | 'done' | 'skipped';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function DashboardActivityFlow({ profile, setActiveTab, jadwalHariIni, now }: Props) {
  const queryClient = useQueryClient();
  const todayDate = now.toISOString().split('T')[0];
  const userId = profile?.id ?? '';
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Determine the "active" jadwal — ongoing or next-up within 15 min
  const activeJadwal = useMemo(() => {
    let found: JadwalMengajar | null = null;
    for (const j of jadwalHariIni) {
      const start = timeToMinutes(j.jam_mulai);
      const end = j.jam_selesai ? timeToMinutes(j.jam_selesai) : start + 90;
      if (currentMinutes >= start - 15 && currentMinutes < end) {
        found = j;
        break;
      }
    }
    return found;
  }, [jadwalHariIni, currentMinutes]);

  // Check if a jadwal is "upcoming" (within 15 min before start)
  const upcomingJadwal = useMemo(() => {
    if (activeJadwal) return null;
    for (const j of jadwalHariIni) {
      const start = timeToMinutes(j.jam_mulai);
      if (currentMinutes >= start - 15 && currentMinutes < start) return j;
    }
    return null;
  }, [jadwalHariIni, currentMinutes, activeJadwal]);

  const targetJadwal = activeJadwal || upcomingJadwal;

  // Fetch presensi status for this jadwal today
  const { data: presensiData } = useQuery({
    queryKey: ['activity-presensi', todayDate, userId, targetJadwal?.id],
    queryFn: async () => {
      if (!targetJadwal) return null;
      const { data } = await supabase
        .from('presensi_ustaz')
        .select('id, status, jam_server')
        .eq('guru_id', userId)
        .eq('jadwal_id', targetJadwal.id)
        .eq('tanggal', todayDate)
        .maybeSingle();
      return data;
    },
    enabled: !!targetJadwal && !!userId,
    staleTime: 30 * 1000,
  });

  // Fetch absensi status for this jadwal's class today
  const { data: absensiData } = useQuery({
    queryKey: ['activity-absensi', todayDate, targetJadwal?.kelas, targetJadwal?.id],
    queryFn: async () => {
      if (!targetJadwal) return null;
      let muridIds: { id: string }[] = [];
      if (targetJadwal.kelas_id) {
        const { data } = await supabase
          .from('murid')
          .select('id')
          .eq('kelas_id', targetJadwal.kelas_id)
          .eq('status_aktif', true);
        muridIds = data ?? [];
      } else {
        const { data } = await supabase
          .from('murid')
          .select('id')
          .eq('kelas', targetJadwal.kelas)
          .eq('status_aktif', true);
        muridIds = data ?? [];
      }
      const ids = muridIds.map(m => m.id);
      if (ids.length === 0) return { total: 0, hadir: 0, telat: 0, izin: 0, sakit: 0, alfa: 0, belum: 0 };
      const { data: absen } = await supabase
        .from('absensi')
        .select('status')
        .eq('tanggal', todayDate)
        .in('murid_id', ids);
      const stats = { total: ids.length, hadir: 0, telat: 0, izin: 0, sakit: 0, alfa: 0, belum: 0 };
      (absen || []).forEach(a => {
        const s = (a as any).status;
        if (s === 'Hadir') stats.hadir++;
        else if (s === 'Telat') stats.telat++;
        else if (s === 'Izin') stats.izin++;
        else if (s === 'Sakit') stats.sakit++;
        else if (s === 'Alfa') stats.alfa++;
        else if (s === 'Belum Hadir') stats.belum++;
      });
      return stats;
    },
    enabled: !!targetJadwal,
    staleTime: 30 * 1000,
  });

  // Fetch jurnal status for this jadwal today
  const { data: jurnalData } = useQuery({
    queryKey: ['activity-jurnal', todayDate, userId, targetJadwal?.id],
    queryFn: async () => {
      if (!targetJadwal) return null;
      const { data } = await supabase
        .from('jurnal_kbm')
        .select('id')
        .eq('user_id', userId)
        .eq('jadwal_id', targetJadwal.id)
        .eq('tanggal', todayDate)
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
    enabled: !!targetJadwal && !!userId,
    staleTime: 30 * 1000,
  });

  // Compute step statuses
  const steps = useMemo(() => {
    if (!targetJadwal) return null;
    const isOngoing = activeJadwal?.id === targetJadwal.id;
    const presensiDone = !!presensiData;
    const absensiDone = absensiData ? absensiData.total > 0 && (absensiData.hadir + absensiData.telat + absensiData.izin + absensiData.sakit + absensiData.alfa + absensiData.belum) > 0 : false;
    const jurnalDone = !!jurnalData;

    const presensiStatus: StepStatus = presensiDone ? 'done' : (isOngoing ? 'active' : 'pending');
    const absensiStatus: StepStatus = !presensiDone ? 'pending' : (absensiDone ? 'done' : 'active');
    const jurnalStatus: StepStatus = !absensiDone ? 'pending' : (jurnalDone ? 'done' : 'active');

    return { presensiStatus, absensiStatus, jurnalStatus, presensiDone, absensiDone, jurnalDone, isOngoing };
  }, [targetJadwal, activeJadwal, presensiData, absensiData, jurnalData]);

  // Countdown for upcoming
  const countdown = useMemo(() => {
    if (!upcomingJadwal) return null;
    const [h, m] = upcomingJadwal.jam_mulai.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return null;
    return {
      minutes: Math.floor(diff / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [upcomingJadwal, now]);

  // Auto-refresh queries periodically
  useEffect(() => {
    if (!targetJadwal) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['activity-presensi'] });
      queryClient.invalidateQueries({ queryKey: ['activity-absensi'] });
      queryClient.invalidateQueries({ queryKey: ['activity-jurnal'] });
    }, 15000);
    return () => clearInterval(interval);
  }, [targetJadwal, queryClient]);

  // Navigate with context
  const navigateTo = (tab: ActiveTab, jadwal: JadwalMengajar) => {
    setActivityContext(jadwal);
    setActiveTab(tab);
    window.history.pushState(null, '', `#${tab}`);
  };

  if (!targetJadwal || !steps) return null;

  const allDone = steps.presensiDone && steps.absensiDone && steps.jurnalDone;
  const jadwalStart = timeToMinutes(targetJadwal.jam_mulai);
  const jadwalEnd = targetJadwal.jam_selesai ? timeToMinutes(targetJadwal.jam_selesai) : jadwalStart + 90;
  const isFinished = currentMinutes >= jadwalEnd;

  // Find next jadwal after current one
  const nextJadwal = jadwalHariIni.find(j => timeToMinutes(j.jam_mulai) > jadwalEnd);
  const nextCountdown = useMemo(() => {
    if (!nextJadwal) return null;
    const [h, m] = nextJadwal.jam_mulai.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { hours, minutes, seconds };
  }, [nextJadwal, now]);

  return (
    <div className="space-y-3">
      {/* ===== UPCOMING NOTIFICATION (15 min before) ===== */}
      {upcomingJadwal && !steps.presensiDone && (
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-sky-600 dark:text-sky-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-sky-800 dark:text-sky-200">Sebentar lagi Anda akan mengajar</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-sky-700 dark:text-sky-300">
                <span className="font-semibold">{targetJadwal.pelajaran}</span>
                <span>•</span>
                <span>Kelas {targetJadwal.kelas}</span>
              </div>
              {countdown && (
                <div className="flex items-center gap-2 mt-2">
                  <Timer className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Dimulai dalam:</span>
                  <span className="font-mono text-sm font-bold text-sky-700 dark:text-sky-300">
                    {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== ACTIVE JADWAL CARD ===== */}
      {(activeJadwal || allDone || isFinished) && (
        <div className="card p-4 border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-slate-800 animate-fadeIn">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{targetJadwal.pelajaran}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {targetJadwal.jam_mulai.slice(0, 5)} - {targetJadwal.jam_selesai?.slice(0, 5)} • Kelas {targetJadwal.kelas}
                  {targetJadwal.ruangan && ` • ${targetJadwal.ruangan}`}
                </p>
              </div>
            </div>
            {allDone && (
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-bold">Selesai</span>
              </div>
            )}
          </div>

          {/* Step Pipeline */}
          <div className="flex items-center gap-1 mb-3">
            {[
              { status: steps.presensiStatus, label: 'Presensi', icon: Camera },
              { status: steps.absensiStatus, label: 'Absensi', icon: ClipboardCheck },
              { status: steps.jurnalStatus, label: 'Jurnal', icon: FileText },
            ].map((step, i) => {
              const Icon = step.icon;
              const color = step.status === 'done'
                ? 'bg-emerald-500 text-white'
                : step.status === 'active'
                ? 'bg-amber-400 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400';
              return (
                <div key={i} className="flex items-center flex-1">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${color} transition-all`}>
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-0.5 mx-0.5 ${step.status === 'done' ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ===== STEP 1: Presensi ===== */}
          {steps.presensiStatus === 'active' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Waktu mengajar telah dimulai</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">Silakan lakukan Presensi Kehadiran.</p>
                </div>
                <button
                  onClick={() => navigateTo('presensi', targetJadwal)}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex-shrink-0 active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" /> Presensi Sekarang
                </button>
              </div>
            </div>
          )}

          {steps.presensiDone && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2.5 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 flex-1">
                {presensiData?.status === 'Terlambat'
                  ? `Anda terlambat. Mohon lebih disiplin pada pertemuan berikutnya.`
                  : 'Presensi tepat waktu. Semoga KBM berjalan lancar.'}
              </p>
            </div>
          )}

          {/* ===== STEP 2: Absensi Murid ===== */}
          {steps.absensiStatus === 'active' && (
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 mb-2">
              <div className="flex items-start gap-2.5">
                <ClipboardCheck className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-sky-800 dark:text-sky-200">Langkah Berikutnya: Absensi Murid</p>
                  <p className="text-[11px] text-sky-700 dark:text-sky-300">
                    Kelas {targetJadwal.kelas} • {targetJadwal.pelajaran}
                  </p>
                </div>
                <button
                  onClick={() => navigateTo('absensi', targetJadwal)}
                  className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex-shrink-0 active:scale-95"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> Absensi Murid
                </button>
              </div>
            </div>
          )}

          {steps.absensiDone && absensiData && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 mb-2">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Absensi Murid Selesai</p>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[
                  { label: 'Hadir', val: absensiData.hadir, color: 'text-emerald-600' },
                  { label: 'Telat', val: absensiData.telat, color: 'text-orange-600' },
                  { label: 'Izin', val: absensiData.izin, color: 'text-amber-600' },
                  { label: 'Sakit', val: absensiData.sakit, color: 'text-sky-600' },
                  { label: 'Alfa', val: absensiData.alfa, color: 'text-rose-600' },
                  { label: 'Belum', val: absensiData.belum, color: 'text-slate-400' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-[8px] text-slate-400 font-semibold">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== STEP 3: Jurnal ===== */}
          {steps.jurnalStatus === 'active' && (
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 mb-2">
              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-violet-800 dark:text-violet-200">Langkah Terakhir: Isi Jurnal Mengajar</p>
                  <p className="text-[11px] text-violet-700 dark:text-violet-300">
                    Kelas {targetJadwal.kelas} • {targetJadwal.pelajaran}
                  </p>
                </div>
                <button
                  onClick={() => navigateTo('jurnal', targetJadwal)}
                  className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex-shrink-0 active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" /> Isi Jurnal
                </button>
              </div>
            </div>
          )}

          {steps.jurnalDone && !allDone && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2.5 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Jurnal Mengajar telah diisi.</p>
            </div>
          )}

          {/* ===== ALL DONE ===== */}
          {allDone && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">Semua tugas pada jam pelajaran ini telah selesai</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Semoga pembelajaran berjalan dengan baik.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== NEXT JADWAL ===== */}
      {nextJadwal && nextCountdown && (
        <div className="card p-3.5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Jadwal Berikutnya</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{nextJadwal.pelajaran}</p>
              <p className="text-xs text-slate-400">
                {nextJadwal.jam_mulai.slice(0, 5)} - {nextJadwal.jam_selesai?.slice(0, 5)} • Kelas {nextJadwal.kelas}
              </p>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs flex-shrink-0">
              <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded px-1.5 py-0.5 font-bold">{String(nextCountdown.hours).padStart(2, '0')}</span>
              <span className="text-slate-400">:</span>
              <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded px-1.5 py-0.5 font-bold">{String(nextCountdown.minutes).padStart(2, '0')}</span>
              <span className="text-slate-400">:</span>
              <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded px-1.5 py-0.5 font-bold">{String(nextCountdown.seconds).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
