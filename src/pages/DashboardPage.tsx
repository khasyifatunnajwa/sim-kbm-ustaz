import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, CalendarDays, Clock, Bell, Megaphone,
  CheckCircle, FileText, ChevronRight, Moon, Camera,
  ClipboardCheck, BarChart3, X, TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { SkeletonList } from '../components/Skeleton';
import type { Profile, JadwalMengajar, AgendaPenting, Pengumuman, JurnalKBM, ShowToast, ActiveTab } from '../types';

const HIJRI_MONTHS = [
  "Muharram","Shafar","Rabi'ul Awwal","Rabi'ul Akhir",
  "Jumadil Awwal","Jumadil Akhir","Rajab","Sya'ban",
  "Ramadhan","Syawal","Dzulqa'dah","Dzulhijjah"
];

function gregorianToHijri(date: Date) {
  const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
  let jd: number;
  if (month <= 2) {
    const y = year - 1, m = month + 12;
    jd = Math.floor(365.25*(y+4716)) + Math.floor(30.6001*(m+1)) + day - 1524.5;
  } else {
    jd = Math.floor(365.25*(year+4716)) + Math.floor(30.6001*(month+1)) + day - 1524.5;
  }
  const a = Math.floor(year/100), b = 2 - a + Math.floor(a/4);
  if (year > 1582 || (year === 1582 && month > 10) || (year === 1582 && month === 10 && day >= 15)) jd += b;
  const l = Math.floor(jd - 1948439.5) + 10632;
  const n = Math.floor((l-1)/10631);
  const l2 = l - 10631*n + 354;
  const j = Math.floor((10985-l2)/5316)*Math.floor((50*l2)/17719) + Math.floor(l2/5670)*Math.floor((43*l2)/15238);
  const l3 = l2 - Math.floor((30-j)/15)*Math.floor((17719*j)/50) - Math.floor(j/16)*Math.floor((15238*j)/43) + 29;
  const hijriMonth = Math.floor((24*l3)/709);
  const hijriDay = l3 - Math.floor((709*hijriMonth)/24);
  const hijriYear = 30*n + j - 30;
  return { day: hijriDay, month: hijriMonth, year: hijriYear, monthName: HIJRI_MONTHS[hijriMonth-1] || '' };
}

interface Props {
  showToast: ShowToast;
  profile: Profile | null;
  setActiveTab?: (tab: ActiveTab) => void;
}

export default function DashboardPage({ profile, setActiveTab }: Props) {
  const [now, setNow] = useState(new Date());
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const namaHari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const todayHari = namaHari[new Date().getDay()];
  const todayDate = new Date().toISOString().split('T')[0];
  const isUstaz = profile?.role !== 'admin';
  const userId = profile?.id ?? '';

  const handleNav = (tab: ActiveTab) => {
    if (setActiveTab) { setActiveTab(tab); window.history.pushState(null,'',`#${tab}`); }
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: broadcastList = [] } = useQuery<Pengumuman[]>({
    queryKey: ['dashboard-broadcast'],
    queryFn: async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('pengumuman').select('*')
        .eq('status','Publish').lte('tanggal_mulai',todayStr)
        .or(`tanggal_selesai.is.null,tanggal_selesai.gte.${todayStr}`)
        .order('prioritas',{ascending:false}).order('created_at',{ascending:false}).limit(5);
      return (data ?? []) as Pengumuman[];
    },
    staleTime: 60*1000,
  });

  const { data: jadwalHariIni = [] } = useQuery<JadwalMengajar[]>({
    queryKey: ['dashboard-jadwal', todayHari, userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('jadwal_mengajar').select('*').eq('hari',todayHari).order('jam_mulai');
      if (isUstaz) q = q.eq('user_id',userId);
      const { data } = await q;
      return (data ?? []) as JadwalMengajar[];
    },
    staleTime: 60*1000,
  });

  const { data: agendaList = [] } = useQuery<AgendaPenting[]>({
    queryKey: ['dashboard-agenda', userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('agenda_penting').select('*').gte('tanggal',todayDate).order('tanggal',{ascending:true}).limit(5);
      if (isUstaz) q = q.eq('user_id',userId);
      const { data } = await q;
      return (data ?? []) as AgendaPenting[];
    },
    staleTime: 60*1000,
  });

  const { data: jurnalList = [] } = useQuery<JurnalKBM[]>({
    queryKey: ['dashboard-jurnal', userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('jurnal_kbm').select('*').eq('is_active',true).order('tanggal',{ascending:false}).limit(3);
      if (isUstaz) q = q.eq('user_id',userId);
      const { data } = await q;
      return (data ?? []) as JurnalKBM[];
    },
    staleTime: 60*1000,
  });

  const { data: muridCount = 0 } = useQuery<number>({
    queryKey: ['dashboard-murid-count'],
    queryFn: async () => {
      const { count } = await supabase.from('murid').select('*',{count:'exact',head:true}).eq('status_aktif',true);
      return count ?? 0;
    },
    staleTime: 5*60*1000,
  });

  const { data: absensiStats = { hadir:0, total:0 } } = useQuery({
    queryKey: ['dashboard-absensi-stats', todayDate, userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('absensi').select('status').eq('tanggal',todayDate);
      if (isUstaz) q = q.eq('user_id',userId);
      const { data } = await q;
      const stats = { hadir:0, total:0 };
      (data ?? []).forEach((a:any) => { if (a.status === 'Hadir') stats.hadir++; stats.total++; });
      return stats;
    },
    staleTime: 60*1000,
  });

  const ongoingClass = useMemo(() => {
    const nowMin = now.getHours()*60 + now.getMinutes();
    return jadwalHariIni.find(j => {
      const [h,m] = j.jam_mulai.split(':').map(Number);
      const [h2,m2] = j.jam_selesai.split(':').map(Number);
      return nowMin >= h*60+m && nowMin < h2*60+m2;
    });
  }, [jadwalHariIni, now]);

  const nextClass = useMemo(() => {
    const nowMin = now.getHours()*60 + now.getMinutes();
    return jadwalHariIni.find(j => {
      const [h,m] = j.jam_mulai.split(':').map(Number);
      return h*60+m > nowMin;
    });
  }, [jadwalHariIni, now]);

  const countdown = useMemo(() => {
    const target = nextClass ?? ongoingClass;
    if (!target) return null;
    const timeStr = nextClass ? nextClass.jam_mulai : ongoingClass!.jam_selesai;
    const [h,m] = timeStr.split(':').map(Number);
    const t = new Date(now);
    t.setHours(h,m,0,0);
    const diff = t.getTime() - now.getTime();
    if (diff <= 0) return null;
    return { hours: Math.floor(diff/3600000), minutes: Math.floor((diff%3600000)/60000), seconds: Math.floor((diff%60000)/1000) };
  }, [nextClass, ongoingClass, now]);

  const greeting = () => {
    const h = now.getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const hijri = gregorianToHijri(now);
  const kehadiranPercent = absensiStats.total > 0 ? Math.round((absensiStats.hadir/absensiStats.total)*100) : 0;
  const activeOrNext = ongoingClass ?? nextClass;
  const visibleBroadcast = broadcastList.filter(p => !dismissedIds.includes(String(p.id)));
  const infoPenting = visibleBroadcast[0] ?? null;

  const timeStr = now.toLocaleTimeString('id-ID', { timeZone:'Asia/Jakarta', hour:'2-digit', minute:'2-digit' });

  return (
    <div className="space-y-4">
      {/* ── Greeting + Clock ── */}
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assalamu'alaikum,</p>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
              {greeting()}, Ustaz {profile?.nama_panggilan || profile?.nama_lengkap?.split(' ')[0] || ''}
            </h1>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm mb-1">
              <Clock size={13} className="text-emerald-600" />
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm tabular-nums">{timeStr}</span>
              <span className="text-[10px] font-bold text-emerald-600">WIB</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {now.toLocaleDateString('id-ID', {weekday:'short', day:'numeric', month:'short'})}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1 mt-0.5">
              <Moon size={10} className="text-amber-500" />
              {hijri.day} {hijri.monthName} {hijri.year} H
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Active / Next Class Card ── */}
      {activeOrNext ? (
        <div className="surface-primary rounded-2xl p-5 relative overflow-hidden" style={{boxShadow:'0 8px 24px rgba(5,150,105,0.25)'}}>
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/5 rounded-full" />
          <div className="absolute right-4 bottom-0 w-16 h-16 bg-white/5 rounded-full" />
          <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
            {ongoingClass ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse inline-block" />Sedang Berlangsung</>
            ) : 'Jadwal Berikutnya'}
          </p>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen size={22} className="text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold text-white leading-tight truncate">{activeOrNext.pelajaran}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full">{activeOrNext.kelas}</span>
                <span className="text-emerald-200 text-[11px] flex items-center gap-1">
                  <Clock size={11} />{activeOrNext.jam_mulai.slice(0,5)} – {activeOrNext.jam_selesai.slice(0,5)}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 flex items-end justify-between gap-4">
            {countdown ? (
              <div>
                <p className="text-emerald-300 text-[10px] font-semibold mb-2">
                  {ongoingClass ? 'Selesai dalam' : 'Dimulai dalam'}
                </p>
                <div className="flex items-end gap-1.5">
                  {[{val:countdown.hours,label:'Jam'},{val:countdown.minutes,label:'Mnt'},{val:countdown.seconds,label:'Det'}].map((t,i) => (
                    <div key={i} className="flex items-end gap-1">
                      {i > 0 && <span className="text-white/40 font-bold text-lg mb-3">:</span>}
                      <div className="text-center">
                        <span className="font-extrabold text-white text-2xl tabular-nums leading-none block">{String(t.val).padStart(2,'0')}</span>
                        <p className="text-emerald-300 text-[9px] font-semibold mt-0.5">{t.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div />}
            <button onClick={() => handleNav('presensi')} className="flex items-center gap-1.5 bg-white text-emerald-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all flex-shrink-0">
              Presensi <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-5 text-center">
          <div className="icon-box icon-box-lg icon-box-slate mx-auto mb-3"><CalendarDays size={22} /></div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tidak ada jadwal hari ini</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Nikmati hari ini dengan baik</p>
        </div>
      )}

      {/* ── Announcement Banner ── */}
      {infoPenting && (
        <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-700/40 rounded-2xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="icon-box icon-box-sm bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Megaphone size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate">{infoPenting.judul}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{infoPenting.isi}</p>
            </div>
            <button onClick={() => setDismissedIds(prev => [...prev, String(infoPenting.id)])} className="btn-icon w-7 h-7 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Quick Actions ── */}
      {setActiveTab && (
        <div className="card p-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Akses Cepat</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { tab:'presensi' as ActiveTab, icon:Camera,        label:'Presensi', bg:'bg-emerald-500', ring:'ring-emerald-200 dark:ring-emerald-800' },
              { tab:'absensi' as ActiveTab,  icon:ClipboardCheck, label:'Absensi',  bg:'bg-sky-500',     ring:'ring-sky-200 dark:ring-sky-800' },
              { tab:'jurnal' as ActiveTab,   icon:FileText,       label:'Jurnal',   bg:'bg-violet-500',  ring:'ring-violet-200 dark:ring-violet-800' },
              { tab:'nilai' as ActiveTab,    icon:BarChart3,       label:'Nilai',    bg:'bg-orange-500',  ring:'ring-orange-200 dark:ring-orange-800' },
            ].map(a => {
              const Icon = a.icon;
              return (
                <button key={a.tab} onClick={() => handleNav(a.tab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform group">
                  <div className={`w-14 h-14 ${a.bg} rounded-2xl flex items-center justify-center ring-4 ring-offset-1 ${a.ring} shadow-sm group-hover:shadow-md transition-shadow`}>
                    <Icon size={22} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { val: muridCount,              label:'Santri Aktif',  sub:'Total',     icon:Users,         color:'icon-box-sky' },
          { val: jadwalHariIni.length,    label:'Jadwal',        sub:'Hari Ini',  icon:CalendarDays,  color:'icon-box-amber' },
          { val: `${kehadiranPercent}%`,  label:'Kehadiran',     sub:'Hari Ini',  icon:CheckCircle,   color:'icon-box-emerald' },
          { val: jurnalList.length,       label:'Jurnal',        sub:'Terakhir',  icon:FileText,      color:'icon-box-violet' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card p-3.5 flex items-center gap-3">
              <div className={`icon-box icon-box-md ${s.color}`}><Icon size={18} /></div>
              <div className="min-w-0">
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{s.val}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Today Schedule ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-50 dark:border-slate-700/50">
          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Jadwal Hari Ini</p>
          {setActiveTab && (
            <button onClick={() => handleNav('jadwal')} className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 hover:underline">
              Lihat Semua <ChevronRight size={13} />
            </button>
          )}
        </div>
        {jadwalHariIni.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">Tidak ada jadwal hari ini</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
            {jadwalHariIni.map((j, idx) => {
              const isActive = ongoingClass?.id === j.id;
              const isDone = (() => {
                const [h,m] = j.jam_selesai.split(':').map(Number);
                return now.getHours()*60+now.getMinutes() >= h*60+m;
              })();
              return (
                <div key={j.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-shrink-0">
                    {isDone ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    ) : isActive ? (
                      <div className="w-7 h-7 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-900/30 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-300 dark:bg-slate-500 rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="w-12 flex-shrink-0 text-center">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight">{j.jam_mulai.slice(0,5)}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px]">{j.jam_selesai.slice(0,5)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate">{j.pelajaran}</p>
                    {j.kelas && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{j.kelas}</p>}
                  </div>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${isDone ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400' : isActive ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                    {isDone ? 'Selesai' : isActive ? 'Aktif' : 'Akan'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Jurnal ── */}
      {jurnalList.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="icon-box icon-box-sm icon-box-violet"><FileText size={14} /></div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Jurnal Terakhir</p>
            </div>
            {setActiveTab && (
              <button onClick={() => handleNav('jurnal')} className="btn-ghost text-emerald-600 dark:text-emerald-400 text-xs px-2 py-1">
                Semua <ChevronRight size={12} />
              </button>
            )}
          </div>
          <div className="p-3 space-y-2">
            {jurnalList.map(j => (
              <div key={j.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="icon-box icon-box-sm icon-box-violet"><FileText size={14} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{j.materi || j.pelajaran || 'Jurnal KBM'}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(j.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}
                    {j.kelas && ` · ${j.kelas}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming Agenda ── */}
      {agendaList.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-slate-50 dark:border-slate-700/50">
            <div className="icon-box icon-box-sm icon-box-amber"><Bell size={14} /></div>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Agenda Mendatang</p>
          </div>
          <div className="p-3 space-y-2">
            {agendaList.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400 leading-none">{new Date(a.tanggal).getDate()}</span>
                  <span className="text-[9px] text-amber-500 font-semibold">{new Date(a.tanggal).toLocaleString('id-ID',{month:'short'})}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{a.judul}</p>
                  <span className="badge badge-warning text-[9px] mt-0.5">{a.jenis}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
