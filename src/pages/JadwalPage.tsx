import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Pencil, CalendarDays, MapPin, Clock, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import type { JadwalMengajar, ShowToast } from '../types';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

interface KelasOption {
  id: string;
  kode: string;
}

export default function JadwalPage({ showToast }: { showToast: ShowToast }) {
  const [jadwal, setJadwal] = useState<JadwalMengajar[]>([]);
  const [kelasDaftar, setKelasDaftar] = useState<KelasOption[]>([]); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    hari: 'Senin', 
    jam_mulai: '07:00', 
    jam_selesai: '08:00',
    kelas: '', 
    pelajaran: '', 
    ruangan: '', 
    catatan: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jadwalResponse, kelasResponse] = await Promise.all([
        supabase.from('jadwal_mengajar').select('*').order('jam_mulai'),
        supabase.from('kelas').select('id, kode'),
      ]);

      if (jadwalResponse.data) {
        setJadwal(jadwalResponse.data as JadwalMengajar[]);
      }
      if (kelasResponse.data) {
        const sortedKelas = [...kelasResponse.data].sort((a, b) => a.kode.localeCompare(b.kode));
        setKelasDaftar(sortedKelas);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      showToast('Gagal mengambil data jadwal', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ 
      hari: 'Senin', 
      jam_mulai: '07:00', 
      jam_selesai: '08:00', 
      kelas: '', 
      pelajaran: '', 
      ruangan: '', 
      catatan: '' 
    });
    setShowModal(true);
  };

  const openEdit = (j: JadwalMengajar) => {
    setEditingId(j.id);
    setForm({
      hari: j.hari, 
      jam_mulai: j.jam_mulai.slice(0, 5), 
      jam_selesai: j.jam_selesai.slice(0, 5),
      kelas: j.kelas, 
      pelajaran: j.pelajaran, 
      ruangan: j.ruangan ?? '', 
      catatan: j.catatan ?? '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kelas || !form.pelajaran) { 
      showToast('Kelas dan pelajaran wajib diisi', 'error'); 
      return; 
    }
    
    setSaving(true);
    const payload = {
      hari: form.hari, 
      jam_mulai: form.jam_mulai, 
      jam_selesai: form.jam_selesai,
      kelas: form.kelas, 
      pelajaran: form.pelajaran,
      ruangan: form.ruangan || null, 
      catatan: form.catatan || null,
    };

    try {
      const { error } = editingId
        ? await supabase.from('jadwal_mengajar').update(payload).eq('id', editingId)
        : await supabase.from('jadwal_mengajar').insert(payload);
        
      if (error) throw error;
      
      showToast(editingId ? 'Jadwal berhasil diperbarui!' : 'Jadwal berhasil ditambahkan!', 'success');
      setShowModal(false);
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Terjadi kesalahan saat menyimpan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    
    try {
      const { error } = await supabase.from('jadwal_mengajar').delete().eq('id', id);
      if (error) throw error;
      
      showToast('Jadwal berhasil dihapus', 'info');
      setJadwal(prev => prev.filter(j => j.id !== id));
    } catch (error: any) {
      showToast(error.message || 'Gagal menghapus jadwal', 'error');
    }
  };

  // Mengelompokkan jadwal berdasarkan hari
  const groupedJadwal = HARI.reduce((acc, h) => { 
    acc[h] = jadwal.filter(j => j.hari === h); 
    return acc; 
  }, {} as Record<string, JadwalMengajar[]>);

  const getTodayName = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  };
  const todayHari = getTodayName();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            Jadwal Mengajar
          </h2>
          <p className="text-sm text-slate-500 mt-1">{jadwal.length} jadwal terdaftar keseluruhan</p>
        </div>
        <button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm">
          <Plus className="w-5 h-5" />
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* KONTEN JADWAL */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
              <div className="h-6 w-32 bg-slate-200 rounded-lg mb-4" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : jadwal.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <CalendarDays className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Jadwal Masih Kosong</h3>
          <p className="text-sm text-slate-500 max-w-sm">Anda belum menambahkan jadwal mengajar. Silakan klik tombol "Tambah Jadwal" di atas untuk memulai.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {HARI.map(hari => {
            const items = groupedJadwal[hari];
            if (!items || items.length === 0) return null;
            
            const isToday = hari === todayHari;

            return (
              <div key={hari} className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${isToday ? 'border-emerald-200 ring-4 ring-emerald-50' : 'border-slate-100'}`}>
                {/* Header Hari */}
                <div className={`px-5 py-3 flex items-center justify-between border-b ${isToday ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold ${isToday ? 'text-emerald-700' : 'text-slate-700'}`}>{hari}</h3>
                    {isToday && (
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Hari Ini
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{items.length} Sesi</span>
                </div>

                {/* List Jadwal dalam hari tersebut */}
                <div className="divide-y divide-slate-50">
                  {items.map(j => (
                    <div key={j.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <span className="font-bold text-slate-800 text-base">{j.pelajaran}</span>
                          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-md font-bold">{j.kelas}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {j.jam_mulai.slice(0, 5)} – {j.jam_selesai.slice(0, 5)} WIB
                          </span>
                          {j.ruangan && (
                            <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {j.ruangan}
                            </span>
                          )}
                          {j.catatan && (
                            <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-md max-w-[200px] truncate">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {j.catatan}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Aksi Edit/Hapus */}
                      <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(j)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors">
                          <Pencil className="w-4 h-4" />
                          <span className="text-xs font-semibold sm:hidden">Edit</span>
                        </button>
                        <button onClick={() => handleDelete(j.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs font-semibold sm:hidden">Hapus</span>
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

      {/* MODAL FORM TAMBAH / EDIT JADWAL */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hari <span className="text-rose-500">*</span></label>
              <select 
                value={form.hari} 
                onChange={e => setForm(p => ({ ...p, hari: e.target.value }))} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              >
                {HARI.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kelas <span className="text-rose-500">*</span></label>
              <select
                required
                value={form.kelas}
                onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              >
                <option value="">-- Pilih --</option>
                {kelasDaftar.map((k) => (
                  <option key={k.id} value={k.kode}>{k.kode}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mata Pelajaran <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              required
              value={form.pelajaran} 
              onChange={e => setForm(p => ({ ...p, pelajaran: e.target.value }))} 
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" 
              placeholder="Contoh: Fiqih, Nahwu, Matematika..." 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jam Mulai <span className="text-rose-500">*</span></label>
              <input 
                type="time" 
                required
                value={form.jam_mulai} 
                onChange={e => setForm(p => ({ ...p, jam_mulai: e.target.value }))} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jam Selesai <span className="text-rose-500">*</span></label>
              <input 
                type="time" 
                required
                value={form.jam_selesai} 
                onChange={e => setForm(p => ({ ...p, jam_selesai: e.target.value }))} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ruangan <span className="text-slate-400 font-normal">(opsional)</span></label>
            <input 
              type="text" 
              value={form.ruangan} 
              onChange={e => setForm(p => ({ ...p, ruangan: e.target.value }))} 
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" 
              placeholder="Contoh: Kelas 2 Ulya, Lab Komputer..." 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Catatan <span className="text-slate-400 font-normal">(opsional)</span></label>
            <textarea 
              value={form.catatan} 
              onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} 
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none" 
              rows={2} 
              placeholder="Tambahkan catatan khusus jika ada..." 
            />
          </div>
          
          <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors active:scale-95 text-sm disabled:opacity-70 flex items-center justify-center"
            >
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan Jadwal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
