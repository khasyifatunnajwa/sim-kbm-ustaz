import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, Users, Phone, MapPin, Search, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import type { Murid, ShowToast } from '../types';

export default function MuridPage({ showToast }: { showToast: ShowToast }) {
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>('all');

  const [form, setForm] = useState({
    nama: '', kelas: '', domisili: '', alamat: '', nomor_whatsapp: '', status_aktif: true,
  });

  const fetchMurid = async () => {
    setLoading(true);
    const { data } = await supabase.from('murid').select('*').order('nama');
    if (data) setMuridList(data as Murid[]);
    setLoading(false);
  };

  useEffect(() => { fetchMurid(); }, []);

  const kelasOptions = useMemo(
    () => [...new Set(muridList.map(m => m.kelas).filter(Boolean))].sort(),
    [muridList]
  );

  const filtered = useMemo(() => {
    return muridList.filter(m => {
      const matchKelas = filterKelas === 'all' || m.kelas === filterKelas;
      const matchSearch = !search ||
        m.nama.toLowerCase().includes(search.toLowerCase()) ||
        (m.domisili ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (m.alamat ?? '').toLowerCase().includes(search.toLowerCase());
      return matchKelas && matchSearch;
    });
  }, [muridList, filterKelas, search]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ nama: '', kelas: filterKelas !== 'all' ? filterKelas : '', domisili: '', alamat: '', nomor_whatsapp: '', status_aktif: true });
    setShowModal(true);
  };

  const openEdit = (m: Murid) => {
    setEditingId(m.id);
    setForm({
      nama: m.nama, kelas: m.kelas, domisili: m.domisili ?? '', alamat: m.alamat ?? '',
      nomor_whatsapp: m.nomor_whatsapp ?? '', status_aktif: m.status_aktif,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.kelas) { showToast('Nama dan kelas wajib diisi', 'error'); return; }
    setSaving(true);
    const payload = {
      nama: form.nama, kelas: form.kelas, domisili: form.domisili || null,
      alamat: form.alamat || null, nomor_whatsapp: form.nomor_whatsapp || null,
      status_aktif: form.status_aktif,
    };
    const { error } = editingId
      ? await supabase.from('murid').update(payload).eq('id', editingId)
      : await supabase.from('murid').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(editingId ? 'Data santri diperbarui!' : 'Santri ditambahkan!', 'success');
    setShowModal(false);
    setEditingId(null);
    fetchMurid();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('murid').delete().eq('id', id);
    if (error) { showToast('Gagal hapus (mungkin ada data terkait)', 'error'); return; }
    showToast('Santri dihapus', 'info');
    setMuridList(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">Database Santri</h2>
          <p className="section-subtitle">{filtered.length} dari {muridList.length} santri</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, domisili, atau alamat..."
            className="input-field text-sm pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={filterKelas}
          onChange={e => setFilterKelas(e.target.value)}
          className="input-field text-sm sm:max-w-[180px]"
        >
          <option value="all">Semua Kelas</option>
          {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {/* Stats */}
      {muridList.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="card p-3 text-center bg-emerald-50 border-emerald-100">
            <p className="text-2xl font-bold text-emerald-700">{muridList.filter(m => m.status_aktif).length}</p>
            <p className="text-[10px] font-semibold text-emerald-600">Aktif</p>
          </div>
          <div className="card p-3 text-center bg-slate-50 border-slate-100">
            <p className="text-2xl font-bold text-slate-600">{muridList.filter(m => !m.status_aktif).length}</p>
            <p className="text-[10px] font-semibold text-slate-500">Non-aktif</p>
          </div>
          <div className="card p-3 text-center bg-sky-50 border-sky-100">
            <p className="text-2xl font-bold text-sky-700">{kelasOptions.length}</p>
            <p className="text-[10px] font-semibold text-sky-600">Kelas</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="card p-4 animate-pulse h-16 bg-slate-50 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search || filterKelas !== 'all' ? "Tidak ada hasil" : "Belum ada santri"}
          description={search || filterKelas !== 'all' ? "Coba ubah kata kunci atau filter." : "Tambahkan data santri untuk mulai mengelola."}
          icon={<Users className="w-8 h-8 text-slate-300" />}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((m, i) => (
            <div key={m.id} className="card card-hover p-3.5 flex items-center gap-3 group">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-700 font-bold text-sm">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-semibold text-slate-800 text-sm truncate">{m.nama}</p>
                  <span className="badge badge-success text-[10px]">{m.kelas}</span>
                  <span className={`badge text-[10px] ${m.status_aktif ? 'badge-success' : 'bg-slate-100 text-slate-500'}`}>
                    {m.status_aktif ? 'Aktif' : 'Non-aktif'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {m.nomor_whatsapp && <span className="flex items-center gap-1 text-[10px] text-slate-400"><Phone className="w-2.5 h-2.5" />{m.nomor_whatsapp}</span>}
                  {m.domisili && <span className="flex items-center gap-1 text-[10px] text-slate-400"><MapPin className="w-2.5 h-2.5" />{m.domisili}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit Santri */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Santri' : 'Tambah Santri'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Santri</label>
            <input type="text" value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} className="input-field text-sm" placeholder="Nama lengkap..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas</label>
              <input type="text" value={form.kelas} onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))} className="input-field text-sm" placeholder="cth. 3A" required list="kelas-list" />
              <datalist id="kelas-list">
                {kelasOptions.map(k => <option key={k} value={k} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select value={String(form.status_aktif)} onChange={e => setForm(p => ({ ...p, status_aktif: e.target.value === 'true' }))} className="input-field text-sm">
                <option value="true">Aktif</option>
                <option value="false">Non-aktif</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">No. WhatsApp (opsional)</label>
            <input type="tel" value={form.nomor_whatsapp} onChange={e => setForm(p => ({ ...p, nomor_whatsapp: e.target.value }))} className="input-field text-sm" placeholder="08xx..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Domisili (opsional)</label>
            <input type="text" value={form.domisili} onChange={e => setForm(p => ({ ...p, domisili: e.target.value }))} className="input-field text-sm" placeholder="Kota/Kecamatan..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alamat (opsional)</label>
            <textarea value={form.alamat} onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))} className="input-field text-sm resize-none" rows={2} placeholder="Alamat lengkap..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
