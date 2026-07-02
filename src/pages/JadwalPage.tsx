import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, CalendarDays, MapPin, Clock, AlertCircle, Search, Inbox, ChevronRight
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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredJadwal = useMemo(() => {
    return jadwal.filter(j => 
      j.pelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.ruangan && j.ruangan.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [jadwal, searchTerm]);

  const groupedJadwal = useMemo(() => {
    return HARI.reduce((acc, h) => { 
      acc[h] = filteredJadwal.filter(j => j.hari === h); 
      return acc; 
    }, {} as Record<string, JadwalMengajar[]>);
  }, [filteredJadwal]);

  const todayHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* HEADER & SEARCH BARS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-emerald-600" />
            Jadwal Mengajar
          </h2>
          <p className="text-sm text-slate-500 mt-1">{jadwal.length} jadwal terdaftar keseluruhan</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:min-w-[250px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Cari mapel, kelas, ruangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm whitespace-nowrap">
            <Plus className="w-5 h-5" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* KONTEN JADWAL */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
              <div className="h-6 w-40 bg-slate-200 rounded-lg mb-6" />
              <div className="space-y-3">
                {[1, 2, 3].map(j => <div key={j} className="h-12 bg-slate-50 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : filteredJadwal.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
            {searchTerm ? <Search className="w-10 h-10 text-emerald-400" /> : <Inbox className="w-10 h-10 text-emerald-400" />}
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {searchTerm ? 'Pencarian Tidak Ditemukan' : 'Jadwal Masih Kosong'}
          </h3>
          <p className="text-slate-500 max-w-md">
            {searchTerm 
              ? `Tidak ada jadwal yang cocok dengan pencarian "${searchTerm}". Coba kata kunci lain.` 
              : 'Anda belum menambahkan jadwal mengajar. Silakan klik tombol "Tambah Jadwal" di atas untuk memulai.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {HARI.map(hari => {
            const items = groupedJadwal[hari];
            if (!items || items.length === 0) return null;
            
            const isToday = hari === todayHari;

            return (
              <div key={hari} className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${isToday ? 'border-emerald-300 ring-4 ring-emerald-50/50' : 'border-slate-100'}`}>
                {/* Header Hari */}
                <div className={`px-5 py-4 md:px-6 flex items-center justify-between border-b ${isToday ? 'bg-emerald-50/80 border-emerald-100' : 'bg-slate-50/80 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <h3 className={`text-lg font-bold ${isToday ? 'text-emerald-800' : 'text-slate-800'}`}>{hari}</h3>
                    {isToday && (
                      <span className="bg-emerald-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
                        Hari Ini
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{items.length} Sesi</span>
                </div>

                {/* --- TAMPILAN DESKTOP (Tabel Modern) --- */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4 font-semibold w-40">Waktu</th>
                        <th className="px-6 py-4 font-semibold">Mata Pelajaran</th>
                        <th className="px-6 py-4 font-semibold w-32">Kelas</th>
                        <th className="px-6 py-4 font-semibold">Ruangan & Info</th>
                        <th className="px-6 py-4 font-semibold text-right w-32">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map(j => (
                        <tr key={j.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 w-fit px-3 py-1.5 rounded-lg">
                              <Clock className="w-4 h-4 text-emerald-500" />
                              {j.jam_mulai.slice(0, 5)} - {j.jam_selesai.slice(0, 5)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800 text-base">{j.pelajaran}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm px-3 py-1 rounded-lg font-bold">
                              {j.kelas}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              {j.ruangan ? (
                                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                                  <MapPin className="w-4 h-4 text-slate-400" /> {j.ruangan}
                                </span>
                              ) : <span className="text-sm text-slate-400 italic">-</span>}
                              
                              {j.catatan && (
                                <span className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100/50 w-fit max-w-xs">
                                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                  <span className="truncate">{j.catatan}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(j)} title="Edit" className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-slate-600 hover:text-emerald-600 transition-all shadow-sm">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(j.id)} title="Hapus" className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 transition-all shadow-sm">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* --- TAMPILAN MOBILE BARY (Modern Event Cards) --- */}
                <div className="md:hidden bg-slate-50/50 p-3 flex flex-col gap-3">
                  {items.map(j => (
                    <div key={j.id} className="relative bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                      {/* Aksen warna hijau di kiri kartu layaknya kalender modern */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                      
                      <div className="pl-2">
                        {/* Waktu & Kelas (Header Kartu) */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            {j.jam_mulai.slice(0, 5)} - {j.jam_selesai.slice(0, 5)}
                          </div>
                          <span className="bg-slate-800 text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md shadow-sm">
                            Kelas {j.kelas}
                          </span>
                        </div>

                        {/* Mata Pelajaran */}
                        <h4 className="font-extrabold text-slate-800 text-lg md:text-xl leading-tight mb-3">
                          {j.pelajaran}
                        </h4>

                        {/* Info Ruangan & Catatan */}
                        <div className="flex flex-col gap-2 mb-4">
                          {j.ruangan && (
                            <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              {j.ruangan}
                            </div>
                          )}
                          {j.catatan && (
                            <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-2.5 rounded-lg text-xs font-medium border border-amber-100">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{j.catatan}</span>
                            </div>
                          )}
                        </div>

                        {/* Tombol Aksi Bawah */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-50">
                          <button onClick={() => openEdit(j)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors text-xs font-bold">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => handleDelete(j.id)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors text-xs font-bold">
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}>
        <form onSubmit={handleSubmit} className="space-y-5">
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hari <span className="text-rose-500">*</span></label>
              <select value={form.hari} onChange={e => setForm(p => ({ ...p, hari: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm">
                {HARI.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kelas <span className="text-rose-500">*</span></label>
              <select required value={form.kelas} onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm">
                <option value="">-- Pilih --</option>
                {kelasDaftar.map((k) => <option key={k.id} value={k.kode}>{k.kode}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mata Pelajaran <span className="text-rose-500">*</span></label>
            <input type="text" required value={form.pelajaran} onChange={e => setForm(p => ({ ...p, pelajaran: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" placeholder="Contoh: Fiqih, Nahwu, Matematika..." />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jam Mulai <span className="text-rose-500">*</span></label>
              <input type="time" required value={form.jam_mulai} onChange={e => setForm(p => ({ ...p, jam_mulai: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jam Selesai <span className="text-rose-500">*</span></label>
              <input type="time" required value={form.jam_selesai} onChange={e => setForm(p => ({ ...p, jam_selesai: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ruangan <span className="text-slate-400 font-normal">(opsional)</span></label>
            <input type="text" value={form.ruangan} onChange={e => setForm(p => ({ ...p, ruangan: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" placeholder="Contoh: Kelas 2 Ulya, Lab Komputer..." />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Catatan <span className="text-slate-400 font-normal">(opsional)</span></label>
            <textarea value={form.catatan} onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none" rows={2} placeholder="Tambahkan catatan khusus jika ada..." />
          </div>
          
          <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors text-sm">
              Batal
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors active:scale-95 text-sm disabled:opacity-70 flex items-center justify-center">
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan Jadwal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
