import { useState } from 'react';
import {
  BookMarked, Plus, Trash2, Calendar, Target
} from 'lucide-react';
import type { Murid, CapaianHafalan } from '../types';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { cn } from '../lib/utils';

interface HafalanPageProps {
  muridList: Murid[];
  capaianList: CapaianHafalan[];
  onAddCapaian: (capaian: Omit<CapaianHafalan, 'id' | 'user_id' | 'created_at'>) => void;
  onDeleteCapaian: (id: string) => void;
}

export default function HafalanPage({ muridList, capaianList, onAddCapaian, onDeleteCapaian }: HafalanPageProps) {
  const [filterKelas, setFilterKelas] = useState('');
  const [selectedMurid, setSelectedMurid] = useState<Murid | null>(null);
  const [form, setForm] = useState({ capaian: '', tanggal: new Date().toISOString().split('T')[0] });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const kelasList = [...new Set(muridList.map(m => m.kelas))].sort();
  const muridFiltered = muridList.filter(m => m.kelas === filterKelas);

  const capaianMurid = capaianList
    .filter(c => c.murid_id === selectedMurid?.id)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMurid || !form.capaian) return;
    onAddCapaian({
      murid_id: selectedMurid.id,
      capaian: form.capaian,
      tanggal: form.tanggal,
    });
    setForm({ ...form, capaian: '' });
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h2 className="section-title">Setoran Hafalan Santri</h2>
        <p className="section-subtitle">Kelola capaian sabaq, tasyrih, dan hafalan harian</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Panel: Filter & Select */}
        <div className="space-y-4">
          <div className="card p-4">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilih Kelas</label>
            <select
              className="input-field"
              value={filterKelas}
              onChange={e => { setFilterKelas(e.target.value); setSelectedMurid(null); }}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
          </div>

          {filterKelas && (
            <div className="card p-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilih Santri</label>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {muridFiltered.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMurid(m)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border',
                      selectedMurid?.id === m.id
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-md'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-100'
                    )}
                  >
                    {m.nama}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Form & History */}
        <div className="lg:col-span-2 space-y-4">
          {selectedMurid ? (
            <>
              {/* Form */}
              <div className="card p-5">
                <h3 className="font-bold text-slate-800 mb-4">
                  Form Setoran: <span className="text-emerald-600">{selectedMurid.nama}</span>
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tanggal</label>
                      <input
                        type="date"
                        className="input-field"
                        value={form.tanggal}
                        onChange={e => setForm({ ...form, tanggal: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Capaian Hafalan</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Contoh: Juz 30 Surah An-Naba' 1-10"
                        value={form.capaian}
                        onChange={e => setForm({ ...form, capaian: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Simpan Setoran
                    </button>
                  </div>
                </form>
              </div>

              {/* History */}
              <div className="card p-5">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-slate-400" />
                  Riwayat Progres Hafalan
                </h3>
                <div className="space-y-3">
                  {capaianMurid.map(c => (
                    <div key={c.id} className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 relative group hover:border-emerald-200 transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3 h-3 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-600">
                            {new Date(c.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-800 font-semibold text-sm">{c.capaian}</p>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {capaianMurid.length === 0 && (
                    <EmptyState
                      title="Belum ada catatan"
                      description="Belum ada setoran hafalan untuk santri ini"
                    />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card border-dashed border-slate-200 p-12 text-center">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">
                Pilih kelas dan santri di sebelah kiri untuk mengelola hafalan
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { confirmDelete && onDeleteCapaian(confirmDelete); setConfirmDelete(null); }}
        title="Hapus Setoran"
        message="Apakah Anda yakin ingin menghapus catatan setoran ini?"
      />
    </div>
  );
}
