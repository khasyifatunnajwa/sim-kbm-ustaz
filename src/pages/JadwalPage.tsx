import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, CalendarDays, MapPin, Clock, BookOpen,
  Bell, Megaphone, Timer, Upload, FileSpreadsheet
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import ExcelImportModal from '../components/ExcelImportModal';
import type { JadwalMengajar, AgendaPenting, Pengumuman, Kelas, MataPelajaran, Profile, ShowToast } from '../types';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

function getTodayHari(): string {
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  return HARI.find(h => today.toLowerCase().startsWith(h.toLowerCase())) ?? 'Senin';
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function JadwalPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [jadwal, setJadwal] = useState<JadwalMengajar[]>([]);
  const [agendaList, setAgendaList] = useState<AgendaPenting[]>([]);
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[0] === 'jadwal' && hashParts[1] === 'form';
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  const [form, setForm] = useState({
    hari: 'Senin', jam_mulai: '14:00', jam_selesai: '15:00',
    kelas: '', pelajaran: '', ruangan: '', catatan: '',
  });

  const todayHari = getTodayHari();
  const today = new Date().toISOString().split('T')[0];
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'jadwal') {
        if (hashParts[1] === 'form') {
          setShowModal(true);
        } else {
          setShowModal(false);
          setEditingId(null);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleCloseModal = () => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] === 'form') {
      window.history.back();
    } else {
      setShowModal(false);
      setEditingId(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const jadwalQuery = profile?.role === 'admin'
      ? supabase.from('jadwal_mengajar').select('*').order('jam_mulai')
      : supabase.from('jadwal_mengajar').select('*').eq('user_id', profile?.id ?? '').order('jam_mulai');
    const [jr, ar, pr, kr, mr] = await Promise.all([
      jadwalQuery,
      supabase.from('agenda_penting').select('*').order('tanggal', { ascending: true }),
      supabase.from('pengumuman').select('*').order('tanggal', { ascending: false }).limit(3),
      supabase.from('kelas').select('*').eq('is_active', true).order('nama_kelas'),
      supabase.from('mata_pelajaran').select('*').eq('is_active', true).order('nama_mapel'),
    ]);
    if (jr.data) setJadwal(jr.data as JadwalMengajar[]);
    if (ar.data) setAgendaList(ar.data as AgendaPenting[]);
    if (pr.data) setPengumumanList(pr.data as Pengumuman[]);
    if (kr.data) setKelasList(kr.data as Kelas[]);
    if (mr.data) setMapelList(mr.data as MataPelajaran[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todaySchedules = useMemo(
    () => jadwal.filter(j => j.hari === todayHari).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)),
    [jadwal, todayHari]
  );

  const nextClass = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return todaySchedules.find(j => parseTimeToMinutes(j.jam_mulai) > nowMin);
  }, [todaySchedules, now]);

  const ongoingClass = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return todaySchedules.find(j => {
      const start = parseTimeToMinutes(j.jam_mulai);
      const end = parseTimeToMinutes(j.jam_selesai);
      return nowMin >= start && nowMin < end;
    });
  }, [todaySchedules, now]);

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

  const upcomingAgenda = useMemo(
    () => agendaList.filter(a => new Date(a.tanggal) >= new Date(today)).slice(0, 3),
    [agendaList, today]
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({ hari: 'Senin', jam_mulai: '14:00', jam_selesai: '15:00', kelas: '', pelajaran: '', ruangan: '', catatan: '' });
    setShowModal(true);
    window.history.pushState(null, '', '#jadwal/form');
  };

  const openEdit = (j: JadwalMengajar) => {
    setEditingId(j.id);
    setForm({
      hari: j.hari, jam_mulai: j.jam_mulai.slice(0, 5), jam_selesai: j.jam_selesai.slice(0, 5),
      kelas: j.kelas, pelajaran: j.pelajaran, ruangan: j.ruangan ?? '', catatan: j.catatan ?? '',
    });
    setShowModal(true);
    window.history.pushState(null, '', '#jadwal/form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kelas || !form.pelajaran) { showToast('Kelas dan pelajaran wajib diisi', 'error'); return; }
    setSaving(true);
    const payload = {
      hari: form.hari, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai,
      kelas: form.kelas, pelajaran: form.pelajaran,
      ruangan: form.ruangan || null, catatan: form.catatan || null,
    };
    const { error } = editingId
      ? await supabase.from('jadwal_mengajar').update(payload).eq('id', editingId)
      : await supabase.from('jadwal_mengajar').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(editingId ? 'Jadwal diperbarui!' : 'Jadwal ditambahkan!', 'success');
    handleCloseModal();
    fetchData();
  };

  const confirmDelete = (id: string) => {
    setDeleteTarget(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('jadwal_mengajar').delete().eq('id', deleteTarget);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Jadwal dihapus', 'info');
    setJadwal(prev => prev.filter(j => j.id !== deleteTarget));
    setDeleteTarget(null);
  };

  // Excel Import
  const jadwalColumns = [
    { key: 'hari', label: 'Hari', required: true, example: 'Senin' },
    { key: 'jam_mulai', label: 'Jam Mulai', required: true, example: '14:00' },
    { key: 'jam_selesai', label: 'Jam Selesai', required: true, example: '15:00' },
    { key: 'kelas', label: 'Kelas', required: true, example: '7A' },
    { key: 'pelajaran', label: 'Mata Pelajaran', required: true, example: 'Al-Quran' },
    { key: 'ruangan', label: 'Ruangan', required: false, example: 'Musholla' },
    { key: 'catatan', label: 'Catatan', required: false },
  ];

  const handleImportJadwal = async (data: Record<string, any>[]) => {
    // Get kelas and mapel mappings
    const kelasMap = new Map(kelasList.map(k => [k.nama_kelas, k.id]));
    const mapelMap = new Map(mapelList.map(m => [m.nama_mapel, m.id]));

    const records = data.map(row => ({
      hari: row.hari || row.Hari,
      jam_mulai: row.jam_mulai || row['Jam Mulai'],
      jam_selesai: row.jam_selesai || row['Jam Selesai'],
      kelas: row.kelas || row.Kelas,
      pelajaran: row.pelajaran || row['Mata Pelajaran'] || row.Pelajaran,
      ruangan: row.ruangan || row.Ruangan || null,
      catatan: row.catatan || row.Catatan || null,
    })).filter(r => r.hari && r.jam_mulai && r.jam_selesai && r.kelas && r.pelajaran);

    if (records.length === 0) throw new Error('Tidak ada data valid untuk diimpor');

    const { error } = await supabase.from('jadwal_mengajar').insert(records);
    if (error) throw error;
    showToast(`${records.length} jadwal berhasil diimpor!`, 'success');
    fetchData();
  };

  const grouped = HARI.reduce((acc, h) => { acc[h] = jadwal.filter(j => j.hari === h); return acc; }, {} as Record<string, JadwalMengajar[]>);

  return (
    <div className="space-y-5">

      {/* ===== HERO CARD (surface-primary) ===== */}
      <div className="surface-primary rounded-2xl overflow-hidden shadow-lg">
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base leading-tight">
                Ahlan, {profile?.nama_panggilan || 'Ustaz'} 👋
              </p>
              <p className="text-emerald-100 text-[11px] mt-0.5">
                {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Class status panel */}
          {ongoingClass ? (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Sedang Berlangsung</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <BookOpen className="w-4 h-4 text-white/80" />
                <span className="font-bold text-white text-sm">{ongoingClass.pelajaran}</span>
                <span className="px-2 py-0.5 bg-white/25 text-white text-[10px] font-bold rounded-full">{ongoingClass.kelas}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-emerald-100">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {ongoingClass.jam_mulai.slice(0, 5)} – {ongoingClass.jam_selesai.slice(0, 5)} WIB
                </span>
                {ongoingClass.ruangan && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />{ongoingClass.ruangan}
                  </span>
                )}
              </div>
            </div>
          ) : nextClass ? (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-200" />
                <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wide">Jadwal Berikutnya</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <BookOpen className="w-4 h-4 text-white/80" />
                <span className="font-bold text-white text-sm">{nextClass.pelajaran}</span>
                <span className="px-2 py-0.5 bg-white/25 text-white text-[10px] font-bold rounded-full">{nextClass.kelas}</span>
                <span className="text-emerald-100 text-xs">{nextClass.jam_mulai.slice(0, 5)}–{nextClass.jam_selesai.slice(0, 5)} WIB</span>
              </div>
              {countdown && (
                <div className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2.5">
                  <Timer className="w-4 h-4 text-emerald-200 flex-shrink-0" />
                  <span className="text-[10px] font-semibold text-emerald-100 mr-1">Masuk dalam:</span>
                  <div className="flex items-center gap-1.5 ml-auto font-mono">
                    {[
                      { val: countdown.hours, label: 'Jam' },
                      { val: countdown.minutes, label: 'Mnt' },
                      { val: countdown.seconds, label: 'Dtk' },
                    ].map(({ val, label }) => (
                      <div key={label} className="flex flex-col items-center">
                        <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm font-bold text-white tabular-nums min-w-[2rem] text-center">
                          {String(val).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] text-emerald-200 mt-0.5">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : todaySchedules.length > 0 ? (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-sm text-emerald-100">Semua jadwal mengajar hari ini telah selesai. Barakallahu fiikum. 🌙</p>
            </div>
          ) : (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-sm text-emerald-100">Tidak ada jadwal mengajar hari ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== AGENDA & PENGUMUMAN 2-COL GRID ===== */}
      {(upcomingAgenda.length > 0 || pengumumanList.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {upcomingAgenda.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center border border-amber-100 dark:border-amber-800">
                  <CalendarDays className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Agenda Mendatang</h3>
              </div>
              <div className="space-y-2.5">
                {upcomingAgenda.map(a => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-amber-100 dark:border-amber-800">
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400 leading-none">{new Date(a.tanggal).getDate()}</span>
                      <span className="text-[8px] text-amber-500 font-semibold uppercase">{new Date(a.tanggal).toLocaleString('id-ID', { month: 'short' })}</span>
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

          {pengumumanList.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-sky-50 dark:bg-sky-900/20 rounded-lg flex items-center justify-center border border-sky-100 dark:border-sky-800">
                  <Megaphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Pengumuman Terbaru</h3>
              </div>
              <div className="space-y-2">
                {pengumumanList.map(p => (
                  <div key={p.id} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex-1 leading-tight">{p.judul}</span>
                      <span className="badge badge-info text-[9px] flex-shrink-0">{p.kategori}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{p.isi}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== JADWAL MENGAJAR HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Jadwal Mengajar</h2>
          <p className="section-subtitle">{jadwal.length} jadwal terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => setShowImportModal(true)} className="btn-secondary flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Impor Excel</span>
            </button>
          )}
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="text-sm">Tambah</span>
          </button>
        </div>
      </div>

      {/* ===== SCHEDULE LIST ===== */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton h-9 rounded-none" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded-lg" />
                <div className="skeleton h-3 w-1/2 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : jadwal.length === 0 ? (
        <EmptyState
          title="Jadwal kosong"
          description="Tambahkan jadwal mengajar untuk ditampilkan di sini."
          icon={<CalendarDays className="w-8 h-8 text-slate-300" />}
        />
      ) : (
        <div className="space-y-3">
          {HARI.map(hari => {
            const items = grouped[hari];
            if (!items.length) return null;
            const isToday = hari === todayHari;
            return (
              <div key={hari} className={`card overflow-hidden ${isToday ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}>
                {/* Day header */}
                <div className={`px-4 py-2.5 flex items-center justify-between ${isToday ? 'bg-emerald-600' : 'bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isToday ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{hari}</span>
                    {isToday && (
                      <span className="text-[9px] bg-white/25 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        Hari Ini
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold ${isToday ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {items.length} sesi
                  </span>
                </div>

                {/* Schedule rows */}
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {items.map(j => (
                    <div key={j.id} className="px-4 py-3 flex items-center gap-3 group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Time badge column */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold tabular-nums leading-none ${isToday ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          {j.jam_mulai.slice(0, 5)}
                        </div>
                        <div className="w-px h-2 bg-slate-200 dark:bg-slate-700" />
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold tabular-nums leading-none ${isToday ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          {j.jam_selesai.slice(0, 5)}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight">{j.pelajaran}</span>
                          <span className="badge badge-success text-[10px]">{j.kelas}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                          {j.ruangan && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{j.ruangan}
                            </span>
                          )}
                          {j.catatan && (
                            <span className="italic truncate max-w-[140px]">{j.catatan}</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => openEdit(j)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(j.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MODAL TAMBAH / EDIT ===== */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingId ? 'Edit Jadwal' : 'Tambah Jadwal'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hari & Kelas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Hari</label>
              <select
                value={form.hari}
                onChange={e => setForm(p => ({ ...p, hari: e.target.value }))}
                className="input-field text-sm"
              >
                {HARI.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.kelas}
                onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))}
                className="input-field text-sm"
                required
              >
                <option value="">Pilih Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>)}
              </select>
            </div>
          </div>

          {/* Mata Pelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.pelajaran}
              onChange={e => setForm(p => ({ ...p, pelajaran: e.target.value }))}
              className="input-field text-sm"
              required
            >
              <option value="">Pilih Pelajaran</option>
              {mapelList.map(m => <option key={m.id} value={m.nama_mapel}>{m.nama_mapel}</option>)}
            </select>
          </div>

          {/* Jam Mulai & Selesai */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Mulai</label>
              <input
                type="time"
                value={form.jam_mulai}
                onChange={e => setForm(p => ({ ...p, jam_mulai: e.target.value }))}
                className="input-field text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Selesai</label>
              <input
                type="time"
                value={form.jam_selesai}
                onChange={e => setForm(p => ({ ...p, jam_selesai: e.target.value }))}
                className="input-field text-sm"
                required
              />
            </div>
          </div>

          {/* Ruangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Ruangan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.ruangan}
              onChange={e => setForm(p => ({ ...p, ruangan: e.target.value }))}
              className="input-field text-sm"
              placeholder="cth. Kelas A, Musholla..."
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Catatan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={form.catatan}
              onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))}
              className="input-field text-sm resize-none"
              rows={2}
              placeholder="Catatan tambahan..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Impor Jadwal dari Excel"
        columns={jadwalColumns}
        onImport={handleImportJadwal}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Hapus Jadwal"
        message="Yakin ingin menghapus jadwal ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  );
}
