import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Users, GraduationCap, School, BookOpen, Calendar, Clock,
  Plus, Pencil, Trash2, Search, CheckCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import SearchableSelect from '../../components/SearchableSelect';
import { useLembaga } from '../../hooks/useLembaga';
import type {
  ShowToast, Profile, KelompokMapel, Lembaga,
} from '../../types';
import DataSiswaPage from '../DataSiswaPage';
import DataUstazPage from '../DataUstazPage';

const PAGE_SIZE = 10;

type MasterTab = 'lembaga' | 'ustaz' | 'murid' | 'kelas' | 'ruangan' | 'mapel' | 'tahun' | 'semester' | 'hari' | 'jam';

export default function DataMasterSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [tab, setTab] = useState<MasterTab>('lembaga');

  const tabs = [
    { id: 'lembaga' as MasterTab, label: 'Lembaga', icon: Building2 },
    { id: 'ustaz' as MasterTab, label: 'Ustaz', icon: Users },
    { id: 'murid' as MasterTab, label: 'Murid', icon: GraduationCap },
    { id: 'kelas' as MasterTab, label: 'Kelas', icon: School },
    { id: 'ruangan' as MasterTab, label: 'Ruang', icon: Building2 },
    { id: 'mapel' as MasterTab, label: 'Mapel', icon: BookOpen },
    { id: 'tahun' as MasterTab, label: 'Tahun', icon: Calendar },
    { id: 'semester' as MasterTab, label: 'Semester', icon: BookOpen },
    { id: 'hari' as MasterTab, label: 'Hari', icon: Calendar },
    { id: 'jam' as MasterTab, label: 'Jam Pelajaran', icon: Clock },
  ];

  useEffect(() => { }, [tab]);

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Data Master</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Semua data dasar lembaga, ustaz, murid, kelas, dan akademik</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-[10px] font-semibold transition-all border ${tab === t.id ? 'bg-sky-600 text-white border-sky-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-4 h-4" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'lembaga' && <KelolaLembaga showToast={showToast} profile={profile} />}
      {tab === 'ustaz' && <DataUstazPage showToast={showToast} />}
      {tab === 'murid' && <DataSiswaPage showToast={showToast} />}
      {tab === 'kelas' && <CrudKelas showToast={showToast} />}
      {tab === 'ruangan' && <CrudRuangan showToast={showToast} />}
      {tab === 'mapel' && <CrudMapel showToast={showToast} />}
      {tab === 'tahun' && <CrudTahun showToast={showToast} />}
      {tab === 'semester' && <CrudSemester showToast={showToast} />}
      {tab === 'hari' && <PlaceholderCard icon={Calendar} label="Hari Belajar" desc="Konfigurasi hari belajar dalam seminggu" />}
      {tab === 'jam' && <PlaceholderCard icon={Clock} label="Jam Pelajaran" desc="Konfigurasi jam pelajaran (slot waktu)" />}
    </div>
  );
}

function PlaceholderCard({ icon: Icon, label, desc }: { icon: React.ElementType; label: string; desc: string }) {
  return (
    <div className="card p-6 text-center">
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      <p className="text-xs text-slate-400 mt-1">{desc}</p>
    </div>
  );
}

// ====== Kelola Lembaga ======
function KelolaLembaga({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const { data: lembagaList, isLoading, refetch } = useLembaga();
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nama_lembaga: '', alamat: '', telepon: '' });

  const resetForm = () => { setForm({ nama_lembaga: '', alamat: '', telepon: '' }); setEditingId(null); };
  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (l: Lembaga) => { setEditingId(l.id); setForm({ nama_lembaga: l.nama_lembaga || '', alamat: l.alamat || '', telepon: l.telepon || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nama_lembaga) { showToast('Nama lembaga wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { nama_lembaga: form.nama_lembaga, alamat: form.alamat || null, telepon: form.telepon || null };
      if (editingId) {
        const { error } = await supabase.from('lembaga').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Lembaga diperbarui', 'success');
      } else {
        payload.user_id = profile?.id;
        const { error } = await supabase.from('lembaga').insert(payload);
        if (error) throw error;
        showToast('Lembaga ditambahkan', 'success');
      }
      setShowModal(false); resetForm(); refetch();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || ''), 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (l: Lembaga) => {
    if (!confirm(`Yakin ingin menghapus lembaga "${l.nama_lembaga}"?`)) return;
    try {
      const { error } = await supabase.from('lembaga').delete().eq('id', l.id);
      if (error) throw error;
      showToast('Lembaga dihapus', 'success'); refetch();
    } catch (err: any) { showToast('Gagal menghapus: ' + (err?.message || ''), 'error'); }
  };

  const filtered = useMemo(() => {
    const base = lembagaList || [];
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(l => [l.nama_lembaga, l.alamat, l.telepon].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [lembagaList, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari lembaga..." className="input-field text-xs pl-8" />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-xs"><Plus className="w-3.5 h-3.5" /> Tambah</button>
      </div>
      {isLoading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /></div> : filtered.length === 0 ? (
        <EmptyState title="Tidak ada lembaga" icon={<Building2 className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map(l => (
            <div key={l.id} className="card p-3 group">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center flex-shrink-0"><Building2 className="w-4 h-4 text-rose-600 dark:text-rose-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{l.nama_lembaga}</p>
                  {l.alamat && <p className="text-[10px] text-slate-500 truncate mt-0.5">{l.alamat}</p>}
                  {l.telepon && <p className="text-[10px] text-slate-500 truncate">{l.telepon}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(l)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(l)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Lembaga' : 'Tambah Lembaga'}>
          <div className="space-y-3">
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Lembaga *</label><input type="text" value={form.nama_lembaga} onChange={e => setForm({ ...form, nama_lembaga: e.target.value })} className="input-field text-xs" placeholder="Nama lembaga" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Alamat</label><textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} className="input-field text-xs" rows={2} placeholder="Alamat lengkap" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Telepon</label><input type="text" value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} className="input-field text-xs" placeholder="08xx" /></div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">{saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ====== CRUD Kelas ======
function CrudKelas({ showToast }: { showToast: ShowToast }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ nama_kelas: '', tingkat: '1', kode: '' });

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('kelas').select('*').eq('is_active', true).order('nama_kelas');
      if (error) throw error;
      setList(data || []);
    } catch { showToast('Gagal memuat kelas', 'error'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.nama_kelas) { showToast('Nama kelas wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload = { nama_kelas: form.nama_kelas, tingkat: Number(form.tingkat) || 1, kode: form.kode || null, is_active: true };
      if (editingId) {
        const { error } = await supabase.from('kelas').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Kelas diperbarui', 'success');
      } else {
        const { error } = await supabase.from('kelas').insert(payload);
        if (error) throw error;
        showToast('Kelas ditambahkan', 'success');
      }
      setShowModal(false); setForm({ nama_kelas: '', tingkat: '1', kode: '' }); setEditingId(null); fetchList();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || ''), 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Yakin ingin menghapus kelas ini?')) return;
    try { await supabase.from('kelas').delete().eq('id', item.id); showToast('Kelas dihapus', 'success'); fetchList(); } catch { showToast('Gagal menghapus', 'error'); }
  };

  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(i => i.nama_kelas?.toLowerCase().includes(q)); }, [list, search]);

  return (
    <CrudList title="Kelas" icon={School} search={search} setSearch={setSearch} onAdd={() => { setForm({ nama_kelas: '', tingkat: '1', kode: '' }); setEditingId(null); setShowModal(true); }} loading={loading} list={filtered} page={page} setPage={setPage} onEdit={(item) => { setEditingId(item.id); setForm({ nama_kelas: item.nama_kelas || '', tingkat: String(item.tingkat || '1'), kode: item.kode || '' }); setShowModal(true); }} onDelete={handleDelete} displayName={(item) => item.nama_kelas} subInfo={(item) => `Tingkat ${item.tingkat || '-'}`} showModal={showModal} onClose={() => setShowModal(false)} saving={saving} onSave={handleSave} modalTitle={editingId ? 'Edit Kelas' : 'Tambah Kelas'}>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Kelas *</label><input type="text" value={form.nama_kelas} onChange={e => setForm({ ...form, nama_kelas: e.target.value })} className="input-field text-xs" placeholder="Nama kelas" /></div>
      <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tingkat</label><input type="number" value={form.tingkat} onChange={e => setForm({ ...form, tingkat: e.target.value })} className="input-field text-xs" min={1} max={12} /></div><div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kode</label><input type="text" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} className="input-field text-xs" placeholder="Kode kelas" /></div></div>
    </CrudList>
  );
}

// ====== CRUD Ruangan ======
function CrudRuangan({ showToast }: { showToast: ShowToast }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '' });

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => {
    setLoading(true);
    try { const { data, error } = await supabase.from('ruangan').select('*').eq('is_active', true).order('nama_ruangan'); if (error) throw error; setList(data || []); } catch { showToast('Gagal memuat ruangan', 'error'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.nama_ruangan) { showToast('Nama ruangan wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload = { nama_ruangan: form.nama_ruangan, kode: form.kode || null, kapasitas: form.kapasitas ? Number(form.kapasitas) : null, keterangan: form.keterangan || null, is_active: true };
      if (editingId) { const { error } = await supabase.from('ruangan').update(payload).eq('id', editingId); if (error) throw error; showToast('Ruangan diperbarui', 'success'); }
      else { const { error } = await supabase.from('ruangan').insert(payload); if (error) throw error; showToast('Ruangan ditambahkan', 'success'); }
      setShowModal(false); setForm({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '' }); setEditingId(null); fetchList();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || ''), 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => { if (!confirm('Yakin ingin menghapus?')) return; try { await supabase.from('ruangan').delete().eq('id', item.id); showToast('Dihapus', 'success'); fetchList(); } catch { showToast('Gagal menghapus', 'error'); } };
  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(i => i.nama_ruangan?.toLowerCase().includes(q)); }, [list, search]);

  return (
    <CrudList title="Ruangan" icon={Building2} search={search} setSearch={setSearch} onAdd={() => { setForm({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '' }); setEditingId(null); setShowModal(true); }} loading={loading} list={filtered} page={page} setPage={setPage} onEdit={(item) => { setEditingId(item.id); setForm({ nama_ruangan: item.nama_ruangan || '', kode: item.kode || '', kapasitas: item.kapasitas?.toString() || '', keterangan: item.keterangan || '' }); setShowModal(true); }} onDelete={handleDelete} displayName={(item) => item.nama_ruangan} subInfo={(item) => item.kapasitas ? `Kapasitas ${item.kapasitas}` : ''} showModal={showModal} onClose={() => setShowModal(false)} saving={saving} onSave={handleSave} modalTitle={editingId ? 'Edit Ruangan' : 'Tambah Ruangan'}>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Ruangan *</label><input type="text" value={form.nama_ruangan} onChange={e => setForm({ ...form, nama_ruangan: e.target.value })} className="input-field text-xs" /></div>
      <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kode</label><input type="text" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} className="input-field text-xs" /></div><div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kapasitas</label><input type="number" value={form.kapasitas} onChange={e => setForm({ ...form, kapasitas: e.target.value })} className="input-field text-xs" /></div></div>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Keterangan</label><input type="text" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} className="input-field text-xs" /></div>
    </CrudList>
  );
}

// ====== CRUD Mapel ======
function CrudMapel({ showToast }: { showToast: ShowToast }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ nama_mapel: '', kelompok: 'Diniyah' as KelompokMapel, kode: '' });

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => { setLoading(true); try { const { data, error } = await supabase.from('mata_pelajaran').select('*').eq('is_active', true).order('nama_mapel'); if (error) throw error; setList(data || []); } catch { showToast('Gagal memuat mapel', 'error'); } finally { setLoading(false); } };

  const handleSave = async () => {
    if (!form.nama_mapel) { showToast('Nama mapel wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload = { nama_mapel: form.nama_mapel, kelompok: form.kelompok, kode: form.kode || null, is_active: true };
      if (editingId) { const { error } = await supabase.from('mata_pelajaran').update(payload).eq('id', editingId); if (error) throw error; showToast('Mapel diperbarui', 'success'); }
      else { const { error } = await supabase.from('mata_pelajaran').insert(payload); if (error) throw error; showToast('Mapel ditambahkan', 'success'); }
      setShowModal(false); setForm({ nama_mapel: '', kelompok: 'Diniyah', kode: '' }); setEditingId(null); fetchList();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || ''), 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => { if (!confirm('Yakin ingin menghapus?')) return; try { await supabase.from('mata_pelajaran').delete().eq('id', item.id); showToast('Dihapus', 'success'); fetchList(); } catch { showToast('Gagal menghapus', 'error'); } };
  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(i => i.nama_mapel?.toLowerCase().includes(q)); }, [list, search]);

  return (
    <CrudList title="Mata Pelajaran" icon={BookOpen} search={search} setSearch={setSearch} onAdd={() => { setForm({ nama_mapel: '', kelompok: 'Diniyah', kode: '' }); setEditingId(null); setShowModal(true); }} loading={loading} list={filtered} page={page} setPage={setPage} onEdit={(item) => { setEditingId(item.id); setForm({ nama_mapel: item.nama_mapel || '', kelompok: item.kelompok || 'Diniyah', kode: item.kode || '' }); setShowModal(true); }} onDelete={handleDelete} displayName={(item) => item.nama_mapel} subInfo={(item) => item.kelompok} showModal={showModal} onClose={() => setShowModal(false)} saving={saving} onSave={handleSave} modalTitle={editingId ? 'Edit Mapel' : 'Tambah Mapel'}>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Mapel *</label><input type="text" value={form.nama_mapel} onChange={e => setForm({ ...form, nama_mapel: e.target.value })} className="input-field text-xs" /></div>
      <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kode</label><input type="text" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} className="input-field text-xs" /></div><div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kelompok</label><SearchableSelect value={form.kelompok} onChange={v => setForm({ ...form, kelompok: v as KelompokMapel })} options={['Diniyah', 'Umum', 'Bahasa', 'Tahfidz', 'Lainnya'].map(k => ({ value: k, label: k }))} placeholder="Pilih kelompok" /></div></div>
    </CrudList>
  );
}

// ====== CRUD Tahun ======
function CrudTahun({ showToast }: { showToast: ShowToast }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ nama: '', aktif: false });

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => { setLoading(true); try { const { data, error } = await supabase.from('tahun_ajaran').select('*').order('nama'); if (error) throw error; setList(data || []); } catch { showToast('Gagal memuat tahun ajaran', 'error'); } finally { setLoading(false); } };

  const handleSave = async () => {
    if (!form.nama) { showToast('Nama tahun ajaran wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      if (form.aktif) { await supabase.from('tahun_ajaran').update({ aktif: false }).neq('id', editingId || 'x'); }
      if (editingId) { const { error } = await supabase.from('tahun_ajaran').update({ nama: form.nama, aktif: form.aktif }).eq('id', editingId); if (error) throw error; showToast('Tahun ajaran diperbarui', 'success'); }
      else { const { error } = await supabase.from('tahun_ajaran').insert({ nama: form.nama, aktif: form.aktif }); if (error) throw error; showToast('Tahun ajaran ditambahkan', 'success'); }
      setShowModal(false); setForm({ nama: '', aktif: false }); setEditingId(null); fetchList();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || ''), 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => { if (!confirm('Yakin ingin menghapus?')) return; try { await supabase.from('tahun_ajaran').delete().eq('id', item.id); showToast('Dihapus', 'success'); fetchList(); } catch { showToast('Gagal menghapus', 'error'); } };
  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(i => i.nama?.toLowerCase().includes(q)); }, [list, search]);

  return (
    <CrudList title="Tahun Ajaran" icon={Calendar} search={search} setSearch={setSearch} onAdd={() => { setForm({ nama: '', aktif: false }); setEditingId(null); setShowModal(true); }} loading={loading} list={filtered} page={page} setPage={setPage} onEdit={(item) => { setEditingId(item.id); setForm({ nama: item.nama || '', aktif: item.aktif ?? false }); setShowModal(true); }} onDelete={handleDelete} displayName={(item) => item.nama} subInfo={(item) => item.aktif ? 'Aktif' : ''} showModal={showModal} onClose={() => setShowModal(false)} saving={saving} onSave={handleSave} modalTitle={editingId ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Tahun Ajaran *</label><input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="input-field text-xs" placeholder="Contoh: 2026/2027" /></div>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.aktif} onChange={e => setForm({ ...form, aktif: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs text-slate-600 dark:text-slate-300">Set sebagai aktif</span></label>
    </CrudList>
  );
}

// ====== CRUD Semester ======
function CrudSemester({ showToast }: { showToast: ShowToast }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ nama: '', aktif: false });

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => { setLoading(true); try { const { data, error } = await supabase.from('semester').select('*').order('nama'); if (error) throw error; setList(data || []); } catch { showToast('Gagal memuat semester', 'error'); } finally { setLoading(false); } };

  const handleSave = async () => {
    if (!form.nama) { showToast('Nama semester wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      if (form.aktif) { await supabase.from('semester').update({ aktif: false }).neq('id', editingId || 'x'); }
      if (editingId) { const { error } = await supabase.from('semester').update({ nama: form.nama, aktif: form.aktif }).eq('id', editingId); if (error) throw error; showToast('Semester diperbarui', 'success'); }
      else { const { error } = await supabase.from('semester').insert({ nama: form.nama, aktif: form.aktif }); if (error) throw error; showToast('Semester ditambahkan', 'success'); }
      setShowModal(false); setForm({ nama: '', aktif: false }); setEditingId(null); fetchList();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || ''), 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => { if (!confirm('Yakin ingin menghapus?')) return; try { await supabase.from('semester').delete().eq('id', item.id); showToast('Dihapus', 'success'); fetchList(); } catch { showToast('Gagal menghapus', 'error'); } };
  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(i => i.nama?.toLowerCase().includes(q)); }, [list, search]);

  return (
    <CrudList title="Semester" icon={BookOpen} search={search} setSearch={setSearch} onAdd={() => { setForm({ nama: '', aktif: false }); setEditingId(null); setShowModal(true); }} loading={loading} list={filtered} page={page} setPage={setPage} onEdit={(item) => { setEditingId(item.id); setForm({ nama: item.nama || '', aktif: item.aktif ?? false }); setShowModal(true); }} onDelete={handleDelete} displayName={(item) => item.nama} subInfo={(item) => item.aktif ? 'Aktif' : ''} showModal={showModal} onClose={() => setShowModal(false)} saving={saving} onSave={handleSave} modalTitle={editingId ? 'Edit Semester' : 'Tambah Semester'}>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Semester *</label><input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="input-field text-xs" placeholder="Contoh: Ganjil / Genap" /></div>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.aktif} onChange={e => setForm({ ...form, aktif: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs text-slate-600 dark:text-slate-300">Set sebagai aktif</span></label>
    </CrudList>
  );
}

// ====== Reusable CRUD List ======
interface CrudListProps {
  title: string;
  icon: React.ElementType;
  search: string;
  setSearch: (v: string) => void;
  onAdd: () => void;
  loading: boolean;
  list: any[];
  page: number;
  setPage: (p: number) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  displayName: (item: any) => string;
  subInfo?: (item: any) => string;
  showModal: boolean;
  onClose: () => void;
  saving: boolean;
  onSave: () => void;
  modalTitle: string;
  children: React.ReactNode;
}
function CrudList({ title, icon: Icon, search, setSearch, onAdd, loading, list, page, setPage, onEdit, onDelete, displayName, subInfo, showModal, onClose, saving, onSave, modalTitle, children }: CrudListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Cari ${title.toLowerCase()}...`} className="input-field text-xs pl-8" />
        </div>
        <button onClick={onAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-xs"><Plus className="w-3.5 h-3.5" /> Tambah</button>
      </div>
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /></div> : list.length === 0 ? (
        <EmptyState title={`Tidak ada ${title.toLowerCase()}`} icon={<Icon className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item: any) => (
            <div key={item.id} className="card p-2.5 flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-sky-600 dark:text-sky-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{displayName(item)}</p>
                {subInfo?.(item) && <p className="text-[9px] text-slate-500 dark:text-slate-400">{subInfo(item)}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => onDelete(item)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          <Pagination currentPage={page} totalPages={Math.ceil(list.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}
      {showModal && (
        <Modal isOpen={true} onClose={onClose} title={modalTitle}>
          <div className="space-y-3">{children}<div className="flex gap-2 pt-2"><button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button><button onClick={onSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">{saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan</button></div></div>
        </Modal>
      )}
    </div>
  );
}
