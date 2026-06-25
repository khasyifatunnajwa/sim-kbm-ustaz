import { useState, useEffect } from 'react';
import { ClipboardCheck, Save, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EmptyState from '../components/EmptyState';
import type { Kelas, Murid, Absensi, ShowToast } from '../types';

type Status = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';

const STATUS_CONFIG: Record<Status, { label: string; color: string; active: string; icon: React.ElementType }> = {
  Hadir:  { label: 'Hadir',  color: 'border-slate-200 text-slate-500',        active: 'bg-emerald-500 border-emerald-500 text-white', icon: CheckCircle },
  Izin:   { label: 'Izin',   color: 'border-slate-200 text-slate-500',        active: 'bg-amber-500 border-amber-500 text-white',   icon: Clock },
  Sakit:  { label: 'Sakit',  color: 'border-slate-200 text-slate-500',        active: 'bg-sky-500 border-sky-500 text-white',       icon: AlertCircle },
  Alpha:  { label: 'Alpha',  color: 'border-slate-200 text-slate-500',        active: 'bg-rose-500 border-rose-500 text-white',     icon: XCircle },
};

const STATUS_LIST: Status[] = ['Hadir', 'Izin', 'Sakit', 'Alpha'];

export default function AbsensiPage({ showToast }: { showToast: ShowToast }) {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [attendance, setAttendance] = useState<Record<number, Status>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<(Absensi & { murid?: { nama: string } })[]>([]);
  const [tab, setTab] = useState<'input' | 'riwayat'>('input');

  useEffect(() => {
    supabase.from('kelas').select('*').eq('aktif', true).order('tingkat').then(({ data }) => {
      if (data) { setKelasList(data); if (data.length) setSelectedKelas(data[0].id); }
    });
  }, []);

  useEffect(() => {
    if (!selectedKelas) return;
    loadData(selectedKelas, tanggal);
  }, [selectedKelas, tanggal]);

  const loadData = async (kelas_id: number, tgl: string) => {
    setLoading(true);
    const [muridRes, absenRes] = await Promise.all([
      supabase.from('murid').select('*').eq('kelas_id', kelas_id).eq('status_aktif', true).order('nama'),
      supabase.from('absensi').select('*').eq('tanggal', tgl).in('murid_id',
        await supabase.from('murid').select('id').eq('kelas_id', kelas_id).eq('status_aktif', true)
          .then(r => (r.data ?? []).map(m => m.id))
      ),
    ]);
    const murid = muridRes.data ?? [];
    setMuridList(murid);
    const map: Record<number, Status> = {};
    murid.forEach(m => { map[m.id] = 'Hadir'; });
    (absenRes.data ?? []).forEach((a: Absensi) => { map[a.murid_id] = a.status; });
    setAttendance(map);
    setLoading(false);
  };

  const loadHistory = async () => {
    if (!selectedKelas) return;
    const muridIds = muridList.map(m => m.id);
    if (!muridIds.length) return;
    const { data } = await supabase.from('absensi')
      .select('*, murid(nama)')
      .in('murid_id', muridIds)
      .order('tanggal', { ascending: false })
      .limit(100);
    if (data) setHistory(data as any);
  };

  const handleSave = async () => {
    if (!selectedKelas || !muridList.length) return;
    setSaving(true);
    const muridIds = muridList.map(m => m.id);
    await supabase.from('absensi').delete().eq('tanggal', tanggal).in('murid_id', muridIds);
    const records = muridList.map(m => ({ murid_id: m.id, tanggal, status: attendance[m.id] ?? 'Hadir' }));
    const { error } = await supabase.from('absensi').insert(records);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Absensi berhasil disimpan!', 'success');
  };

  const stats = {
    hadir: Object.values(attendance).filter(s => s === 'Hadir').length,
    izin:  Object.values(attendance).filter(s => s === 'Izin').length,
    sakit: Object.values(attendance).filter(s => s === 'Sakit').length,
    alpha: Object.values(attendance).filter(s => s === 'Alpha').length,
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="section-title">Absensi</h2>
        <p className="section-subtitle">Input kehadiran santri</p>
      </div>

      <div className="tab-switcher mb-5">
        <button onClick={() => setTab('input')} className={`tab-btn ${tab === 'input' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>Input Absensi</button>
        <button onClick={() => { setTab('riwayat'); loadHistory(); }} className={`tab-btn ${tab === 'riwayat' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>Riwayat</button>
      </div>

      {tab === 'input' && (
        <>
          {/* Filter */}
          <div className="card p-4 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas</label>
                <select value={selectedKelas ?? ''} onChange={e => setSelectedKelas(Number(e.target.value))} className="input-field text-sm">
                  <option value="">Pilih Kelas</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label>
                <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="input-field text-sm" />
              </div>
            </div>
          </div>

          {/* Stats */}
          {muridList.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Hadir', val: stats.hadir, color: 'bg-emerald-50 text-emerald-700' },
                { label: 'Izin',  val: stats.izin,  color: 'bg-amber-50 text-amber-700' },
                { label: 'Sakit', val: stats.sakit, color: 'bg-sky-50 text-sky-700' },
                { label: 'Alpha', val: stats.alpha, color: 'bg-rose-50 text-rose-700' },
              ].map(s => (
                <div key={s.label} className={`card p-2.5 text-center ${s.color}`}>
                  <p className="text-xl font-bold">{s.val}</p>
                  <p className="text-[10px] font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="card p-4 animate-pulse h-16 bg-slate-50 rounded-2xl" />)}
            </div>
          ) : !selectedKelas ? (
            <EmptyState title="Pilih kelas" description="Pilih kelas untuk mulai absensi." icon={<ClipboardCheck className="w-8 h-8 text-slate-300" />} />
          ) : muridList.length === 0 ? (
            <EmptyState title="Tidak ada santri" description="Belum ada santri aktif di kelas ini." icon={<ClipboardCheck className="w-8 h-8 text-slate-300" />} />
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {muridList.map((m, i) => {
                  const status = attendance[m.id] ?? 'Hadir';
                  return (
                    <div key={m.id} className="card p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-600 font-bold text-xs">{i + 1}</span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm flex-1 min-w-0 truncate">{m.nama}</p>
                      <div className="flex gap-1 flex-shrink-0">
                        {STATUS_LIST.map(s => (
                          <button
                            key={s}
                            onClick={() => setAttendance(prev => ({ ...prev, [m.id]: s }))}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${status === s ? STATUS_CONFIG[s].active : STATUS_CONFIG[s].color + ' hover:bg-slate-50'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Absensi'}
              </button>
            </>
          )}
        </>
      )}

      {tab === 'riwayat' && (
        <div>
          {history.length === 0 ? (
            <EmptyState title="Belum ada riwayat" description="Riwayat absensi akan muncul setelah Anda menyimpan absensi." icon={<ClipboardCheck className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-2">
              {history.map(a => {
                const cfg = STATUS_CONFIG[a.status as Status];
                return (
                  <div key={a.id} className="card p-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{(a as any).murid?.nama ?? `Santri ${a.murid_id}`}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                    <span className={`badge text-[10px] ${a.status === 'Hadir' ? 'badge-success' : a.status === 'Izin' ? 'badge-warning' : a.status === 'Sakit' ? 'badge-info' : 'badge-danger'}`}>
                      {a.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
