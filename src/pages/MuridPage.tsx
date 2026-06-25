import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Phone, MapPin, GraduationCap, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import type { Kelas, Murid, ShowToast } from '../types';

type Tab = 'kelas' | 'murid';

export default function MuridPage({ showToast }: { showToast: ShowToast }) {
  const [tab, setTab] = useState<Tab>('kelas');
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showKelasModal, setShowKelasModal] = useState(false);
  const [showMuridModal, setShowMuridModal] = useState(false);
  const [editMurid, setEditMurid] = useState<Murid | null>(null);

  const [kelasForm, setKelasForm] = useState({ nama_kelas: '', tingkat: '1', wali_kelas: '' });
  const [muridForm, setMuridForm] = useState({ nama: '', nomor_whatsapp: '', alamat: '', domisili: '', status_aktif: true });

  const fetchKelas = async () => {
    const { data } = await supabase.from('kelas').select('*').order('tingkat');
    if (data) { setKelasList(data); if (!selectedKelas && data.length) setSelectedKelas(data[0].id); }
    setLoading(false);
  };

  const fetchMurid = async (kelas_id: number) => {
    const { data } = await supabase.from('murid').select('*').eq('kelas_id', kelas_id).order('nama');
    if (data) setMuridList(data);
  };

  useEffect(() => { fetchKelas(); }, []);
  useEffect(() => { if (selectedKelas) fetchMurid(selectedKelas); }, [selectedKelas]);

  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('kelas').insert({
      nama_kelas: kelasForm.nama_kelas,
      tingkat: Number(kelasForm.tingkat),
      wali_kelas: kelasForm.wali_kelas || null,
      aktif: true,
    });
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Kelas berhasil ditambahkan!', 'success');
    setShowKelasModal(false);
    setKelasForm({ nama_kelas: '', tingkat: '1', wali_kelas: '' });
    fetchKelas();
  };

  const handleDeleteKelas = async (id: number) => {
    const { error } = await supabase.from('kelas').delete().eq('id', id);
    if (error) { showToast('Gagal hapus kelas (mungkin ada data terkait)', 'error'); return; }
    showToast('Kelas dihapus', 'info');
    setKelasList(prev => prev.filter(k => k.id !== id));
    if (selectedKelas === id) setSelectedKelas(null);
  };

  const handleSaveMurid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKelas) return;
    setSaving(true);
    const payload = { ...muridForm, kelas_id: selectedKelas };
    const { error } = editMurid
      ? await supabase.from('murid').update(payload).eq('id', editMurid.id)
      : await supabase.from('murid').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(editMurid ? 'Data diperbarui!' : 'Santri ditambahkan!', 'success');
    setShowMuridModal(false);
    setEditMurid(null);
    setMuridForm({ nama: '', nomor_whatsapp: '', alamat: '', domisili: '', status_aktif: true });
    fetchMurid(selectedKelas);
  };

  const handleDeleteMurid = async (id: number) => {
    const { error } = await supabase.from('murid').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Santri dihapus', 'info');
    setMuridList(prev => prev.filter(m => m.id !== id));
  };

  const openEditMurid = (m: Murid) => {
    setEditMurid(m);
    setMuridForm({ nama: m.nama, nomor_whatsapp: m.nomor_whatsapp ?? '', alamat: m.alamat ?? '', domisili: m.domisili ?? '', status_aktif: m.status_aktif });
    setShowMuridModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">Data Santri</h2>
          <p className="section-subtitle">{kelasList.length} kelas, {muridList.length} santri aktif ditampilkan</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="tab-switcher mb-5">
        <button onClick={() => setTab('kelas')} className={`tab-btn ${tab === 'kelas' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
          Manajemen Kelas
        </button>
        <button onClick={() => setTab('murid')} className={`tab-btn ${tab === 'murid' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
          Data Santri
        </button>
      </div>

      {tab === 'kelas' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowKelasModal(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Tambah Kelas
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="card p-4 animate-pulse h-20 bg-slate-50 rounded-2xl" />)}
            </div>
          ) : kelasList.length === 0 ? (
            <EmptyState title="Belum ada kelas" description="Tambahkan kelas untuk mulai mengelola santri." icon={<GraduationCap className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-3">
              {kelasList.map(k => (
                <div key={k.id} className="card card-hover p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-lg">{k.tingkat}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{k.nama_kelas}</p>
                    {k.wali_kelas && <p className="text-xs text-slate-500 mt-0.5">Wali: {k.wali_kelas}</p>}
                    <span className={`badge text-[10px] mt-1 ${k.aktif ? 'badge-success' : 'bg-slate-100 text-slate-500'}`}>
                      {k.aktif ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteKelas(k.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'murid' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <select
              value={selectedKelas ?? ''}
              onChange={e => setSelectedKelas(Number(e.target.value))}
              className="input-field text-sm flex-1 max-w-[200px]"
            >
              <option value="">Pilih Kelas</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
            {selectedKelas && (
              <button onClick={() => { setEditMurid(null); setMuridForm({ nama: '', nomor_whatsapp: '', alamat: '', domisili: '', status_aktif: true }); setShowMuridModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Tambah Santri
              </button>
            )}
          </div>

          {!selectedKelas ? (
            <EmptyState title="Pilih kelas" description="Pilih kelas untuk melihat daftar santri." icon={<Users className="w-8 h-8 text-slate-300" />} />
          ) : muridList.length === 0 ? (
            <EmptyState title="Belum ada santri" description="Belum ada santri di kelas ini. Tambahkan sekarang." icon={<Users className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-2">
              {muridList.map((m, i) => (
                <div key={m.id} onClick={() => openEditMurid(m)} className="card card-hover p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-sm">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{m.nama}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {m.nomor_whatsapp && <span className="flex items-center gap-1 text-[10px] text-slate-400"><Phone className="w-2.5 h-2.5" />{m.nomor_whatsapp}</span>}
                      {m.domisili && <span className="flex items-center gap-1 text-[10px] text-slate-400"><MapPin className="w-2.5 h-2.5" />{m.domisili}</span>}
                    </div>
                  </div>
                  <span className={`badge text-[10px] flex-shrink-0 ${m.status_aktif ? 'badge-success' : 'bg-slate-100 text-slate-500'}`}>
                    {m.status_aktif ? 'Aktif' : 'Non-aktif'}
                  </span>
                  <button onClick={e => { e.stopPropagation(); handleDeleteMurid(m.id); }} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Kelas */}
      <Modal isOpen={showKelasModal} onClose={() => setShowKelasModal(false)} title="Tambah Kelas" size="sm">
        <form onSubmit={handleAddKelas} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Kelas</label>
            <input type="text" value={kelasForm.nama_kelas} onChange={e => setKelasForm(p => ({ ...p, nama_kelas: e.target.value }))} className="input-field text-sm" placeholder="cth. Kelas 1A, Mutawassith..." required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tingkat</label>
            <input type="number" min="1" value={kelasForm.tingkat} onChange={e => setKelasForm(p => ({ ...p, tingkat: e.target.value }))} className="input-field text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Wali Kelas (opsional)</label>
            <input type="text" value={kelasForm.wali_kelas} onChange={e => setKelasForm(p => ({ ...p, wali_kelas: e.target.value }))} className="input-field text-sm" placeholder="Nama ustaz/ustazah..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowKelasModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah/Edit Murid */}
      <Modal isOpen={showMuridModal} onClose={() => setShowMuridModal(false)} title={editMurid ? 'Edit Santri' : 'Tambah Santri'} size="sm">
        <form onSubmit={handleSaveMurid} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Santri</label>
            <input type="text" value={muridForm.nama} onChange={e => setMuridForm(p => ({ ...p, nama: e.target.value }))} className="input-field text-sm" placeholder="Nama lengkap..." required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">No. WhatsApp (opsional)</label>
            <input type="tel" value={muridForm.nomor_whatsapp} onChange={e => setMuridForm(p => ({ ...p, nomor_whatsapp: e.target.value }))} className="input-field text-sm" placeholder="08xx..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Domisili</label>
              <input type="text" value={muridForm.domisili} onChange={e => setMuridForm(p => ({ ...p, domisili: e.target.value }))} className="input-field text-sm" placeholder="Kota/Kec..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select value={String(muridForm.status_aktif)} onChange={e => setMuridForm(p => ({ ...p, status_aktif: e.target.value === 'true' }))} className="input-field text-sm">
                <option value="true">Aktif</option>
                <option value="false">Non-aktif</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alamat (opsional)</label>
            <textarea value={muridForm.alamat} onChange={e => setMuridForm(p => ({ ...p, alamat: e.target.value }))} className="input-field text-sm resize-none" rows={2} placeholder="Alamat lengkap..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowMuridModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : editMurid ? 'Perbarui' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
