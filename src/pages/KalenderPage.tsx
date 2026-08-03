import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, MapPin,
  FileText, Megaphone,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SkeletonCard } from '../components/Skeleton';
import type { ShowToast, Profile, KalenderPendidikan, JadwalUjian } from '../types';

interface Props {
  showToast: ShowToast;
  profile: Profile | null;
}

const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const NAMA_HARI_SINGKAT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const JENIS_KALENDER_COLOR: Record<string, string> = {
  Libur: 'bg-rose-500', Ujian: 'bg-amber-500', Rapat: 'bg-sky-500',
  Kegiatan: 'bg-emerald-500', Penting: 'bg-violet-500', Lainnya: 'bg-slate-400',
};
const JENIS_KALENDER_BADGE: Record<string, string> = {
  Libur: 'badge-danger', Ujian: 'badge-warning', Rapat: 'badge-info',
  Kegiatan: 'badge-success', Penting: 'bg-violet-100 text-violet-700', Lainnya: 'bg-slate-100 text-slate-600',
};
const JENIS_KALENDER_LIGHT_BG: Record<string, string> = {
  Libur: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
  Ujian: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  Rapat: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
  Kegiatan: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  Penting: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
  Lainnya: 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600',
};

export default function KalenderPage({ }: Props) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery<KalenderPendidikan[]>({
    queryKey: ['kalender-pendidikan-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kalender_pendidikan')
        .select('*')
        .eq('is_active', true)
        .order('tanggal_mulai', { ascending: true });
      if (error) throw error;
      return (data ?? []) as KalenderPendidikan[];
    },
    staleTime: 60 * 1000,
  });

  const { data: ujianList = [] } = useQuery<JadwalUjian[]>({
    queryKey: ['jadwal-ujian-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jadwal_ujian')
        .select('*')
        .eq('is_active', true)
        .order('tanggal', { ascending: true });
      if (error) throw error;
      return (data ?? []) as JadwalUjian[];
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();

  const getEventsForDate = (dateStr: string) => events.filter(e => {
    const start = e.tanggal_mulai;
    const end = e.tanggal_selesai || e.tanggal_mulai;
    return dateStr >= start && dateStr <= end;
  });

  const getUjianForDate = (dateStr: string) => ujianList.filter(u => u.tanggal === dateStr);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => { setViewDate(new Date()); setSelectedDate(new Date().toISOString().split('T')[0]); };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = useMemo(() => {
    return events.filter(e => (e.tanggal_selesai || e.tanggal_mulai) >= todayStr).sort((a, b) => a.tanggal_mulai.localeCompare(b.tanggal_mulai));
  }, [events, todayStr]);

  const upcomingUjian = useMemo(() => {
    return ujianList.filter(u => u.tanggal >= todayStr).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [ujianList, todayStr]);

  if (isLoading) {
    return <SkeletonCard count={3} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">Kalender Pendidikan</h2>
            <p className="text-emerald-100 text-xs">Agenda & jadwal ujian lembaga</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="text-center">
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">{NAMA_BULAN[month]} {year}</p>
            <button onClick={goToday} className="text-[10px] text-emerald-600 hover:underline font-semibold">Hari Ini</button>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {NAMA_HARI_SINGKAT.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = getEventsForDate(dateStr);
            const dayUjian = getUjianForDate(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasItems = dayEvents.length > 0 || dayUjian.length > 0;
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[48px] p-1.5 rounded-xl text-left transition-all border ${
                  isSelected ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-300' :
                  isToday ? 'border-emerald-300 bg-emerald-50/50' :
                  'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className={`text-xs font-bold ${isToday ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>{day}</span>
                {hasItems && (
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} className={`h-1.5 rounded-full ${JENIS_KALENDER_COLOR[e.jenis] || 'bg-slate-400'}`} />
                    ))}
                    {dayUjian.length > 0 && dayEvents.length < 2 && (
                      <div className="h-1.5 rounded-full bg-amber-500" />
                    )}
                    {(dayEvents.length + dayUjian.length) > 2 && (
                      <span className="text-[8px] text-slate-400">+{(dayEvents.length + dayUjian.length) - 2}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="card p-3">
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(JENIS_KALENDER_COLOR).map(([jenis, color]) => (
            <div key={jenis} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{jenis}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Ujian</span>
          </div>
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="card p-4">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
            {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {(() => {
            const dayEvents = getEventsForDate(selectedDate);
            const dayUjian = getUjianForDate(selectedDate);
            if (dayEvents.length === 0 && dayUjian.length === 0) {
              return <p className="text-xs text-slate-400 text-center py-3">Tidak ada agenda pada tanggal ini</p>;
            }
            return (
              <div className="space-y-2">
                {dayEvents.map(e => (
                  <div key={e.id} className={`p-3 rounded-xl border ${JENIS_KALENDER_LIGHT_BG[e.jenis] || JENIS_KALENDER_LIGHT_BG.Lainnya}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${JENIS_KALENDER_COLOR[e.jenis] || 'bg-slate-400'}`} />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{e.judul}</span>
                      <span className={`badge text-[9px] ${JENIS_KALENDER_BADGE[e.jenis] || 'bg-slate-100'}`}>{e.jenis}</span>
                    </div>
                    {e.deskripsi && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{e.deskripsi}</p>}
                    {e.tanggal_selesai && e.tanggal_selesai !== e.tanggal_mulai && (
                      <p className="text-[10px] text-slate-400 mt-1">s/d {new Date(e.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    )}
                  </div>
                ))}
                {dayUjian.map(u => (
                  <div key={u.id} className="p-3 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{u.judul}</span>
                      <span className="badge badge-warning text-[9px]">{u.jenis_ujian}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap mt-1">
                      {u.jam_mulai && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{u.jam_mulai}{u.jam_selesai ? `-${u.jam_selesai}` : ''}</span>}
                      {u.ruangan && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{u.ruangan}</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Upcoming Events */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Agenda Mendatang</h3>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">Belum ada agenda mendatang</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {upcomingEvents.slice(0, 15).map(e => {
              const eventDate = new Date(e.tanggal_mulai);
              const isToday = e.tanggal_mulai === todayStr;
              return (
                <div key={e.id} className={`flex items-start gap-3 p-3 rounded-xl border ${JENIS_KALENDER_LIGHT_BG[e.jenis] || JENIS_KALENDER_LIGHT_BG.Lainnya}`}>
                  <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white ${JENIS_KALENDER_COLOR[e.jenis] || 'bg-slate-400'}`}>
                    <span className="text-sm font-bold leading-none">{eventDate.getDate()}</span>
                    <span className="text-[7px] leading-none mt-0.5">{NAMA_BULAN[eventDate.getMonth()].slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{e.judul}</span>
                      <span className={`badge text-[8px] ${JENIS_KALENDER_BADGE[e.jenis] || 'bg-slate-100'}`}>{e.jenis}</span>
                      {isToday && <span className="badge badge-success text-[8px]">Hari Ini</span>}
                    </div>
                    {e.deskripsi && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{e.deskripsi}</p>}
                    {e.tanggal_selesai && e.tanggal_selesai !== e.tanggal_mulai && (
                      <p className="text-[9px] text-slate-400 mt-0.5">s/d {new Date(e.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Ujian */}
      {upcomingUjian.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Jadwal Ujian Mendatang</h3>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {upcomingUjian.slice(0, 15).map(u => {
              const uDate = new Date(u.tanggal);
              return (
                <div key={u.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                  <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 bg-amber-500 text-white">
                    <span className="text-sm font-bold leading-none">{uDate.getDate()}</span>
                    <span className="text-[7px] leading-none mt-0.5">{NAMA_BULAN[uDate.getMonth()].slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{u.judul}</span>
                      <span className="badge badge-warning text-[8px]">{u.jenis_ujian}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap mt-0.5">
                      {u.jam_mulai && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{u.jam_mulai}{u.jam_selesai ? `-${u.jam_selesai}` : ''}</span>}
                      {u.ruangan && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{u.ruangan}</span>}
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
