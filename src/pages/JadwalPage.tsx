import { useState, useEffect } from 'react';
import { Plus, Trash2, CalendarDays, MapPin, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import type { JadwalMengajar, Kelas, ShowToast } from '../types';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

type JadwalWithKelas = JadwalMengajar & { kelas?: { nama_kelas: string } };

export default function JadwalPage({ showToast }: { showToast: ShowToast }) {
  const [jadwal, setJadwal] = useState<JadwalWithKelas[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterKelas, setFilterKelas] = useState<number | 'all'>('all');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:00',
    kelas_id: '', pelajaran: '', lokasi: '',
  });

  const fetchData = async () => {
    setLoading(true);
    const [jr, kr] = await Promise.all([
      supabase.from('jadwal_mengajar').select('*, kelas(nama_kelas)').order('jam_mulai'),
      supabase.from('kelas').select('*').eq('aktif', true).order('tingkat'),
    ]);
    if (jr.data) setJadwal(jr.data);
    if (kr.data) setKelasList(kr.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kelas_id) { showToast('Pilih kelas terlebih dahulu', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('jadwal_mengajar').insert({
      hari: form.hari, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai,
      kelas_id: Number(form.kelas_id), pelajaran: form.pelajaran,
      lokasi: form.lokasi || null,
    });
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Jadwal ditambahkan!', 'success');
    setShowModal(false);
    setForm({ hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:00', kelas_id: '', pelajaran: '', lokasi: '' });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('jadwal_mengajar').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Jadwal dihapus', 'info');
    setJadwal(prev => prev.filter(j => j.id !== id));
  };

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  const todayHari = HARI.find(h => today.toLowerCase().startsWith(h.toLowerCase())) ?? '';
  const filtered = filterKelas === 'all' ? jadwal : jadwal.filter(j => j.kelas_id === filterKelas);
  const grouped = HARI.reduce((acc, h) => { acc[h] = filtered.filter(j => j.hari === h); return acc; }, {} as Record<string, JadwalWithKelas[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">Jadwal Mengajar</h2>
          <p className="section-subtitle">{jadwal.length} jadwal terdaftar</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {kelasList.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
          <button
            onClick={() => setFilterKelas('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${filterKelas === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            Semua
          </button>
          {kelasList.map(k => (
            <button key={k.id} onClick={() => setFilterKelas(k.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${filterKelas === k.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              {k.nama_kelas}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card p-4 animate-pulse"><div className="h-16 bg-slate-50 rounded-xl" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Jadwal kosong" description="Tambahkan jadwal mengajar untuk ditampilkan di sini." icon={<CalendarDays className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-4">
          {HARI.map(hari => {
            const items = grouped[hari];
            if (!items.length) return null;
            const isToday = hari === todayHari;
            return (
              <div key={hari} className={`card overflow-hidden ${isToday ? 'ring-2 ring-emerald-300' : ''}`}>
                <div className={`px-4 py-2.5 flex items-center justify-between ${isToday ? 'bg-emerald-600' : 'bg-slate-50 border-b border-slate-100'}`}>
                  <span className={`font-bold text-sm ${isToday ? 'text-white' : 'text-slate-700'}`}>{hari}</span>
                  {isToday && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Hari Ini</span>}
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map(j => (
                    <div key={j.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-semibold text-slate-800 text-sm">{j.pelajaran}</span>
                          {j.kelas && <span className="badge badge-success text-[10px]">{j.kelas.nama_kelas}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{j.jam_mulai.slice(0, 5)} – {j.jam_selesai.slice(0, 5)}</span>
                          {j.lokasi && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.lokasi}</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(j.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Jadwal" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Hari</label>
              <select value={form.hari} onChange={e => setForm(p => ({ ...p, hari: e.target.value }))} className="input-field text-sm">
                {HARI.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas</label>
              <select value={form.kelas_id} onChange={e => setForm(p => ({ ...p, kelas_id: e.target.value }))} className="input-field text-sm" required>
                <option value="">Pilih Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pelajaran / Kitab</label>
            <input type="text" value={form.pelajaran} onChange={e => setForm(p => ({ ...p, pelajaran: e.target.value }))} className="input-field text-sm" placeholder="cth. Fiqih, Nahwu Wadhih..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jam Mulai</label>
              <input type="time" value={form.jam_mulai} onChange={e => setForm(p => ({ ...p, jam_mulai: e.target.value }))} className="input-field text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jam Selesai</label>
              <input type="time" value={form.jam_selesai} onChange={e => setForm(p => ({ ...p, jam_selesai: e.target.value }))} className="input-field text-sm" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lokasi (opsional)</label>
            <input type="text" value={form.lokasi} onChange={e => setForm(p => ({ ...p, lokasi: e.target.value }))} className="input-field text-sm" placeholder="cth. Kelas A, Musholla..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
